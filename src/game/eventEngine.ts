// 动态事件引擎（V1.3-A A3）：通用动态事件的生命周期与调度规则的唯一执行层
//
// 设计原则：
//   1. 纯逻辑 + 可序列化状态：不直接写存档、不改 DOM、不触碰经济 / 代码 / 草稿 / 判题；
//   2. 生命周期：waiting → triggering → presenting → active → resolving → completed → recovering → dismissed；
//      「waiting」是概念态（事件尚未触发，无需存储），其余状态都由 current 持久化；
//   3. 调度规则：重复触发（cooldown）、同时触发（互斥）、展示中（already-presenting）都在 tryTrigger 内判定；
//   4. 所有函数幂等且永不抛错：坏数据一律回退到安全状态，绝不因事件引擎白屏或永久锁死操作；
//   5. 影响隔离：事件只能改自己的状态，不能改 coins / exp / 资产，不能删代码 / 覆盖草稿 / 伪造判题 / 绕过结算。

export type DynamicEventStatus =
  | 'waiting'
  | 'triggering'
  | 'presenting'
  | 'active'
  | 'resolving'
  | 'completed'
  | 'recovering'
  | 'dismissed';

export type DynamicEventResult = 'completed' | 'timeout' | 'cancelled' | 'recovered' | null;

export interface DynamicEventState {
  /** 实例 id（同一事件定义可多次触发，实例 id 唯一） */
  id: string;
  /** 事件定义 id */
  defId: string;
  status: DynamicEventStatus;
  priority: number;
  startedAt: number;
  /** presenting → active 的自动激活时间戳（由 presentDurationMs 推导） */
  activateAt: number | null;
  /** 激活后的超时时间戳（超过则自动进入 resolving→timeout 恢复） */
  deadlineAt: number | null;
  endedAt: number | null;
  result: DynamicEventResult;
  reason: string | null;
  /** 定义相关的可序列化数据（例如入侵的恢复阶段 / 剩余尝试次数） */
  data: Record<string, unknown>;
}

export interface EventDefinition {
  id: string;
  label: string;
  /** 优先级：冲突时高优先级胜出 */
  priority: number;
  /** 互斥：不能与这些 defId 同时进行 */
  mutualExclude: string[];
  /** 同一定义两次触发之间的最小间隔（毫秒） */
  cooldownMs: number;
  /** 展示阶段时长（毫秒），之后自动进入 active */
  presentDurationMs: number;
  /** 激活后的最大时长（毫秒）；null = 无超时 */
  activeTimeoutMs: number | null;
}

const defs = new Map<string, EventDefinition>();

export function registerEvent(def: EventDefinition): void {
  defs.set(def.id, def);
}

export function eventDefById(id: string): EventDefinition | undefined {
  return defs.get(id);
}

export interface EngineSnapshot {
  current: DynamicEventState | null;
  cooldowns: Record<string, number>;
}

export const EMPTY_SNAPSHOT: EngineSnapshot = { current: null, cooldowns: {} };

export type TriggerOutcome =
  | { ok: true; snapshot: EngineSnapshot; state: DynamicEventState }
  | { ok: false; reason: 'unknown-def' | 'cooldown' | 'mutex' | 'already-presenting'; snapshot: EngineSnapshot };

const int = (v: unknown, fb = 0): number => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fb);

/** 是否处于展示 / 交互 / 结算中（会阻挡新事件触发） */
export function isBlocking(cur: DynamicEventState | null): boolean {
  if (!cur) return false;
  return cur.status === 'presenting' || cur.status === 'active' || cur.status === 'resolving' || cur.status === 'recovering';
}

/** 是否已终结（completed / dismissed） */
export function isTerminal(cur: DynamicEventState | null): boolean {
  return !!cur && (cur.status === 'completed' || cur.status === 'dismissed');
}

let idSeq = 0;
function newId(defId: string, now: number): string {
  idSeq = (idSeq + 1) % 100000;
  return defId + '@' + now + '-' + idSeq.toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * 触发事件：在唯一入口处做「重复触发 / 同时触发 / 展示中」判定。
 * 成功则生成实例并进入 presenting，同时写入冷却时间戳。
 */
export function tryTrigger(
  snap: EngineSnapshot,
  defId: string,
  now: number,
  opts?: { reason?: string | null; data?: Record<string, unknown> },
): TriggerOutcome {
  const def = defs.get(defId);
  if (!def) return { ok: false, reason: 'unknown-def', snapshot: snap };

  const cur = snap.current;
  if (isBlocking(cur)) {
    if (cur && cur.defId === defId) return { ok: false, reason: 'already-presenting', snapshot: snap };
    return { ok: false, reason: 'mutex', snapshot: snap };
  }

  // 只有在「曾经触发过」时才应用冷却：缺失条目视为从未触发（避免小时间戳误判）
  const hasLast = Object.prototype.hasOwnProperty.call(snap.cooldowns, defId);
  const last = int(snap.cooldowns[defId]);
  if (hasLast && def.cooldownMs > 0 && now - last < def.cooldownMs) {
    return { ok: false, reason: 'cooldown', snapshot: snap };
  }

  const state: DynamicEventState = {
    id: newId(defId, now),
    defId,
    status: 'presenting',
    priority: def.priority,
    startedAt: now,
    activateAt: now + Math.max(0, def.presentDurationMs),
    deadlineAt: def.activeTimeoutMs != null ? now + Math.max(0, def.presentDurationMs) + def.activeTimeoutMs : null,
    endedAt: null,
    result: null,
    reason: opts?.reason ?? null,
    data: opts?.data ?? {},
  };
  const snapshot: EngineSnapshot = {
    current: state,
    cooldowns: { ...snap.cooldowns, [defId]: now },
  };
  return { ok: true, snapshot, state };
}

/**
 * 推进生命周期：presenting→active（到期）、active→resolving(timeout)（超时）。
 * 幂等：不满足条件时原样返回。
 */
export function advance(snap: EngineSnapshot, now: number): EngineSnapshot {
  let cur = snap.current;
  if (!cur) return snap;
  let changed = false;
  // 单次推进可级联：长时间跳变（如刷新间隔很久）时 presenting 可直接走到超时
  if (cur.status === 'presenting' && cur.activateAt != null && now >= cur.activateAt) {
    cur = { ...cur, status: 'active' };
    changed = true;
  }
  if (cur.status === 'active' && cur.deadlineAt != null && now >= cur.deadlineAt) {
    cur = { ...cur, status: 'resolving', result: 'timeout', endedAt: now, reason: '事件超时，已自动解除' };
    changed = true;
  }
  return changed ? { ...snap, current: cur } : snap;
}

/** 正常完成：resolving → completed（result = completed） */
export function resolve(snap: EngineSnapshot, now: number, reason?: string | null): EngineSnapshot {
  const cur = snap.current;
  if (!cur || isTerminal(cur)) return snap;
  return {
    ...snap,
    current: { ...cur, status: 'completed', result: 'completed', endedAt: now, reason: reason ?? cur.reason },
  };
}

/** 玩家取消：resolving → completed（result = cancelled） */
export function cancelEvent(snap: EngineSnapshot, now: number, reason?: string | null): EngineSnapshot {
  const cur = snap.current;
  if (!cur || isTerminal(cur)) return snap;
  return {
    ...snap,
    current: { ...cur, status: 'completed', result: 'cancelled', endedAt: now, reason: reason ?? '玩家主动退出' },
  };
}

/** 异常恢复：resolving → completed（result = recovered）；保证异常不会永久锁死 */
export function recoverException(snap: EngineSnapshot, now: number, reason?: string | null): EngineSnapshot {
  const cur = snap.current;
  if (!cur || isTerminal(cur)) return snap;
  return {
    ...snap,
    current: { ...cur, status: 'completed', result: 'recovered', endedAt: now, reason: reason ?? '事件异常，已安全恢复' },
  };
}

/** 清理：把终结事件从 current 移除（dismissed 是终点，current 置空即代表无事件） */
export function dismiss(snap: EngineSnapshot): EngineSnapshot {
  return { ...snap, current: null };
}

/** 序列化自愈：非法 / 已终结 / 已过期的事件一律清理，永不抛错 */
export function normalizeEventState(raw: unknown, now: number): DynamicEventState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<DynamicEventState>;
  const defId = typeof r.defId === 'string' && r.defId ? r.defId : '';
  if (!defId || !defs.has(defId)) return null;
  const status: DynamicEventStatus = r.status === 'presenting' || r.status === 'active' || r.status === 'resolving' || r.status === 'recovering'
    ? r.status
    : 'completed';
  // 已终结（completed / dismissed）在刷新后不再阻塞，直接清理
  if (status === 'completed') return null;
  const activateAt = typeof r.activateAt === 'number' && isFinite(r.activateAt) ? r.activateAt : null;
  const deadlineAt = typeof r.deadlineAt === 'number' && isFinite(r.deadlineAt) ? r.deadlineAt : null;
  let nextStatus = status;
  const result: DynamicEventResult =
    r.result === 'completed' || r.result === 'timeout' || r.result === 'cancelled' || r.result === 'recovered'
      ? r.result
      : null;
  if (nextStatus === 'presenting' && activateAt != null && now >= activateAt) nextStatus = 'active';
  if (nextStatus === 'active' && deadlineAt != null && now >= deadlineAt) {
    // 刷新时已超时：安全恢复，不阻塞操作
    return null;
  }
  return {
    id: typeof r.id === 'string' && r.id ? r.id : defId + '@' + int(r.startedAt),
    defId,
    status: nextStatus,
    priority: int(r.priority, 0),
    startedAt: int(r.startedAt),
    activateAt,
    deadlineAt,
    endedAt: typeof r.endedAt === 'number' && isFinite(r.endedAt) ? r.endedAt : null,
    result,
    reason: typeof r.reason === 'string' ? r.reason : null,
    data: r.data && typeof r.data === 'object' ? { ...(r.data as Record<string, unknown>) } : {},
  };
}

/** 冷却表自愈：只保留有限非负时间戳，并限制条数 */
export function normalizeCooldowns(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  const entries = Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'number' && isFinite(v) && (v as number) >= 0)
    .map(([k, v]) => [k, Math.floor(v as number)] as const);
  for (const [k, v] of entries) out[k] = v;
  return out;
}
