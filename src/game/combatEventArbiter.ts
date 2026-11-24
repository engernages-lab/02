// 战斗事件仲裁器（V1.3-B.4 补充）
//
// 统一管理 Boss 攻击、弱点、动态事件、阶段切换、终结事件的优先级 / 独占锁 / 队列 /
// 抢占 / 去重 / 过期 / 阶段失效 / 战斗终结清理与事件记录。
//
// 优先级（数值越小越优先）：
//   P0 终结（死亡/胜利/失败/撤退/重生）
//   P1 战斗状态（阶段切换/阶段击破/中断/恢复）
//   P2 重大危机（未知入侵/系统崩溃/核心暴走）
//   P3 弱点（发现/破解/暴露/恢复）
//   P4 动态战斗（区域异常/干扰）
//   P5 Boss 攻击（预警/单体/连续/范围/特殊）
//   P6 普通系统（冷却/倒计时/提示）
//
// 设计约束：
//   - 同一时间只允许一个独占事件（active lock）；
//   - 高优先级可中断低优先级；低优先级不得抢占高优先级；
//   - 同优先级独占事件进入队列（FIFO），失效/过期自动清理；
//   - settledEventIds 保证同一 eventId 不重复结算（含伤害/奖励/状态变更）；
//   - 纯逻辑 + 可序列化，normalize 只保留历史记录，不恢复已取消的旧锁。

export const COMBAT_PRIORITY = {
  TERMINAL: 0,
  BATTLE_FLOW: 1,
  CRISIS: 2,
  WEAKNESS: 3,
  DYNAMIC: 4,
  ATTACK: 5,
  AMBIENT: 6,
} as const;

export type CombatPriority = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CombatEventStatus =
  | 'queued'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'interrupted'
  | 'resolved';

export type CombatConflictGroup =
  | 'terminal'
  | 'battle-flow'
  | 'crisis'
  | 'weakness'
  | 'dynamic'
  | 'attack'
  | 'overlay'
  | 'ambient';

export type CombatEventType =
  | 'death'
  | 'victory'
  | 'defeat'
  | 'retreat'
  | 'rebirth'
  | 'phase-transition'
  | 'phase-break'
  | 'battle-interrupt'
  | 'battle-resume'
  | 'dynamic-crisis'
  | 'weakness-discover'
  | 'weakness-crack'
  | 'weakness-exposed'
  | 'weakness-recovered'
  | 'boss-attack'
  | 'damage'
  | 'ambient';

export interface CombatEvent {
  eventId: string;
  battleId: string;
  bossId: string;
  phaseId: string | null;
  eventType: CombatEventType;
  priority: CombatPriority;
  createdAt: number;
  expiresAt: number;
  status: CombatEventStatus;
  interruptible: boolean;
  conflictGroup: CombatConflictGroup;
  /** 队列排序用：同优先级按 sequence 递增 */
  sequence: number;
  payload: Record<string, unknown>;
}

export interface CombatLock {
  eventId: string;
  eventType: CombatEventType;
  priority: CombatPriority;
  conflictGroup: CombatConflictGroup;
  createdAt: number;
  expiresAt: number;
}

export interface CombatEventRecord {
  eventId: string;
  eventType: CombatEventType;
  priority: CombatPriority;
  status: CombatEventStatus;
  battleId: string;
  bossId: string;
  phaseId: string | null;
  at: number;
  reason?: string;
  payload?: Record<string, unknown>;
}

export interface CombatArbiterState {
  battleId: string;
  bossId: string;
  phaseId: string;
  active: CombatLock | null;
  queue: CombatEvent[];
  records: CombatEventRecord[];
  /** 已结算 eventId（伤害/奖励/状态变更幂等） */
  settledEventIds: string[];
  sequence: number;
  updatedAt: number;
}

export interface CombatEventInput {
  eventId: string;
  eventType: CombatEventType;
  priority: CombatPriority;
  conflictGroup: CombatConflictGroup;
  phaseId?: string | null;
  expiresInMs?: number;
  interruptible?: boolean;
  payload?: Record<string, unknown>;
}

export interface ArbiterStep {
  state: CombatArbiterState;
  ok: boolean;
  reason?: string;
  queued?: boolean;
  preempted?: CombatEvent | null;
  promoted?: CombatEvent | null;
  events: CombatEventRecord[];
}

const MAX_QUEUE = 32;
const MAX_RECORDS = 60;
const MAX_SETTLED = 120;

const int = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;

const sortQueue = (q: CombatEvent[]): CombatEvent[] =>
  [...q].sort((a, b) => (a.priority - b.priority) || (a.createdAt - b.createdAt) || (a.sequence - b.sequence));

function recordOf(event: CombatEvent, status: CombatEventStatus, at: number, reason?: string): CombatEventRecord {
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    priority: event.priority,
    status,
    battleId: event.battleId,
    bossId: event.bossId,
    phaseId: event.phaseId,
    at,
    reason,
    payload: event.payload,
  };
}

function pushRecord(state: CombatArbiterState, record: CombatEventRecord): void {
  state.records = [...state.records, record].slice(-MAX_RECORDS);
}

function settleId(state: CombatArbiterState, eventId: string): void {
  if (!eventId) return;
  state.settledEventIds = [...new Set([...state.settledEventIds, eventId])].slice(-MAX_SETTLED);
}

export function createCombatArbiter(battleId: string, bossId: string, phaseId: string, now: number): CombatArbiterState {
  return {
    battleId,
    bossId,
    phaseId,
    active: null,
    queue: [],
    records: [],
    settledEventIds: [],
    sequence: 0,
    updatedAt: now,
  };
}

export function isSettled(state: CombatArbiterState | null, eventId: string): boolean {
  return !!state && state.settledEventIds.includes(eventId);
}

export function activePriority(state: CombatArbiterState | null): CombatPriority | null {
  return state && state.active ? state.active.priority : null;
}

function makeEvent(state: CombatArbiterState, input: CombatEventInput, now: number): CombatEvent {
  return {
    eventId: input.eventId,
    battleId: state.battleId,
    bossId: state.bossId,
    phaseId: input.phaseId === undefined ? state.phaseId : input.phaseId,
    eventType: input.eventType,
    priority: input.priority,
    createdAt: now,
    expiresAt: now + Math.max(500, typeof input.expiresInMs === 'number' ? input.expiresInMs : 30000),
    status: 'queued',
    interruptible: input.interruptible !== false,
    conflictGroup: input.conflictGroup,
    sequence: state.sequence + 1,
    payload: input.payload || {},
  };
}

/** 入队：去重、过期丢弃、阶段失效清理、最大长度限制 */
export function enqueue(state: CombatArbiterState, input: CombatEventInput, now: number): ArbiterStep {
  const next: CombatArbiterState = { ...state, queue: [...state.queue], records: [...state.records], settledEventIds: [...state.settledEventIds] };
  const event = makeEvent(next, input, now);
  const events: CombatEventRecord[] = [];

  if (event.battleId !== next.battleId) return { state, ok: false, reason: 'battle-mismatch', events: [] };
  if (event.phaseId && event.priority > COMBAT_PRIORITY.BATTLE_FLOW && event.phaseId !== next.phaseId) {
    return { state, ok: false, reason: 'phase-mismatch', events: [] };
  }
  if (isSettled(next, event.eventId) ||
      next.queue.some(e => e.eventId === event.eventId) ||
      (next.active && next.active.eventId === event.eventId)) {
    return { state, ok: false, reason: 'duplicate', events: [] };
  }
  if (event.expiresAt <= now) {
    return { state, ok: false, reason: 'expired', events: [] };
  }

  next.queue = sortQueue([...next.queue, event]);
  next.sequence = event.sequence;
  if (next.queue.length > MAX_QUEUE) {
    const removed = next.queue[next.queue.length - 1];
    next.queue = next.queue.slice(0, MAX_QUEUE);
    const rec = recordOf(removed, 'cancelled', now, 'queue-overflow');
    events.push(rec);
    pushRecord(next, rec);
    settleId(next, removed.eventId);
  }
  next.updatedAt = now;
  return { state: next, ok: true, queued: true, events };
}

/**
 * 请求独占锁：
 * - 无锁 → 立即获得；
 * - 现有更高优先级 → 拒绝并入队；
 * - 现有同优先级 → 入队（FIFO）；
 * - 现有更低优先级 → 中断现有事件并抢占（返回 preempted）。
 */
export function requestExclusive(state: CombatArbiterState, input: CombatEventInput, now: number): ArbiterStep {
  let cur = state;
  const events: CombatEventRecord[] = [];
  const event = makeEvent(cur, input, now);

  if (event.battleId !== cur.battleId) return { state, ok: false, reason: 'battle-mismatch', events: [] };
  if (event.phaseId && event.priority > COMBAT_PRIORITY.BATTLE_FLOW && event.phaseId !== cur.phaseId) {
    return { state, ok: false, reason: 'phase-mismatch', events: [] };
  }
  if (isSettled(cur, event.eventId)) return { state, ok: false, reason: 'duplicate', events: [] };
  if (event.expiresAt <= now) return { state, ok: false, reason: 'expired', events: [] };

  let preempted: CombatEvent | null = null;
  const active = cur.active;
  if (active) {
    if (active.eventId === event.eventId) return { state, ok: true, events: [] };
    if (active.priority < event.priority) {
      const enq = enqueue(cur, input, now);
      return { ...enq, ok: false, reason: 'higher-priority-active', queued: true };
    }
    if (active.priority === event.priority) {
      const enq = enqueue(cur, input, now);
      return { ...enq, ok: false, reason: 'equal-priority-active', queued: true };
    }
    // 抢占更低优先级
    const existing = cur.queue.find(e => e.eventId === active.eventId);
    if (existing) preempted = { ...existing, status: 'interrupted' };
    const rec = recordOf(
      existing || {
        eventId: active.eventId, eventType: active.eventType, priority: active.priority,
        battleId: cur.battleId, bossId: cur.bossId, phaseId: cur.phaseId, createdAt: active.createdAt,
        expiresAt: active.expiresAt, status: 'active', interruptible: true, conflictGroup: active.conflictGroup,
        sequence: 0, payload: {},
      },
      'interrupted', now, 'preempted-by:' + event.eventId,
    );
    events.push(rec);
    cur = {
      ...cur,
      queue: cur.queue.filter(e => e.eventId !== active.eventId),
      records: [...cur.records, rec].slice(-MAX_RECORDS),
      settledEventIds: [...new Set([...cur.settledEventIds, active.eventId])].slice(-MAX_SETTLED),
    };
  }

  event.status = 'active';
  const next: CombatArbiterState = {
    ...cur,
    active: {
      eventId: event.eventId,
      eventType: event.eventType,
      priority: event.priority,
      conflictGroup: event.conflictGroup,
      createdAt: event.createdAt,
      expiresAt: event.expiresAt,
    },
    queue: sortQueue([...cur.queue.filter(e => e.eventId !== event.eventId), event]),
    sequence: event.sequence,
  };
  return { state: next, ok: true, preempted, events };
}

/**
 * 释放独占锁并推进队列：
 * 只有 queue 中最高优先级事件会被提升为 active（返回 promoted，由 store 执行）。
 */
export function releaseExclusive(
  state: CombatArbiterState,
  eventId: string,
  status: CombatEventStatus,
  now: number,
  reason?: string,
): ArbiterStep {
  if (state.active && state.active.eventId !== eventId) {
    // 释放非当前事件：只清理队列中的等待项
    const target = state.queue.find(e => e.eventId === eventId);
    if (!target) return { state, ok: false, reason: 'not-active', events: [] };
    const rec = recordOf(target, status, now, reason);
    const next: CombatArbiterState = {
      ...state,
      queue: state.queue.filter(e => e.eventId !== eventId),
      records: [...state.records, rec].slice(-MAX_RECORDS),
      settledEventIds: [...new Set([...state.settledEventIds, eventId])].slice(-MAX_SETTLED),
      updatedAt: now,
    };
    return { state: next, ok: true, events: [rec] };
  }
  if (!state.active) return { state, ok: false, reason: 'no-active-lock', events: [] };

  const target = state.queue.find(e => e.eventId === eventId);
  const rec = recordOf(
    target || {
      eventId,
      eventType: state.active.eventType,
      priority: state.active.priority,
      battleId: state.battleId,
      bossId: state.bossId,
      phaseId: state.phaseId,
      createdAt: state.active.createdAt,
      expiresAt: state.active.expiresAt,
      status: 'active',
      interruptible: true,
      conflictGroup: state.active.conflictGroup,
      sequence: 0,
      payload: {},
    },
    status, now, reason,
  );
  let next: CombatArbiterState = {
    ...state,
    active: null,
    queue: state.queue.filter(e => e.eventId !== eventId),
    records: [...state.records, rec].slice(-MAX_RECORDS),
    settledEventIds: [...new Set([...state.settledEventIds, eventId])].slice(-MAX_SETTLED),
    updatedAt: now,
  };
  const events = [rec];
  const promoted = promoteNext(next, now);
  next = promoted.state;
  if (promoted.event) events.push(recordOf(promoted.event, 'active', now, 'promoted-from-queue'));
  return { state: next, ok: true, promoted: promoted.event, events };
}

function promoteNext(state: CombatArbiterState, now: number): { state: CombatArbiterState; event: CombatEvent | null } {
  const live = state.queue.filter(e => e.status === 'queued' && e.expiresAt > now);
  if (live.length === 0) return { state, event: null };
  const picked = sortQueue(live)[0];
  const active: CombatLock = {
    eventId: picked.eventId,
    eventType: picked.eventType,
    priority: picked.priority,
    conflictGroup: picked.conflictGroup,
    createdAt: picked.createdAt,
    expiresAt: picked.expiresAt,
  };
  const queue = state.queue.map(e => (e.eventId === picked.eventId ? { ...e, status: 'active' as const } : e));
  return { state: { ...state, active, queue, updatedAt: now }, event: { ...picked, status: 'active' } };
}

/** 标记事件已结算（伤害/奖励/状态变更幂等） */
export function settleEvent(
  state: CombatArbiterState,
  eventId: string,
  now: number,
  payload?: Record<string, unknown>,
): CombatArbiterState {
  if (isSettled(state, eventId)) return state;
  const target = state.queue.find(e => e.eventId === eventId);
  const rec: CombatEventRecord = {
    eventId,
    eventType: target ? target.eventType : 'ambient',
    priority: target ? target.priority : COMBAT_PRIORITY.AMBIENT,
    status: 'resolved',
    battleId: state.battleId,
    bossId: state.bossId,
    phaseId: target ? target.phaseId : state.phaseId,
    at: now,
    payload: payload || (target ? target.payload : undefined),
  };
  return {
    ...state,
    active: state.active && state.active.eventId === eventId ? null : state.active,
    queue: state.queue.filter(e => e.eventId !== eventId),
    records: [...state.records, rec].slice(-MAX_RECORDS),
    settledEventIds: [...new Set([...state.settledEventIds, eventId])].slice(-MAX_SETTLED),
    updatedAt: now,
  };
}

/** 过期清理：队列 / active 事件到期后丢弃或记录 */
export function expireCombatEvents(state: CombatArbiterState, now: number): ArbiterStep {
  const expired = state.queue.filter(e => e.expiresAt <= now || (e.status === 'queued' && e.expiresAt <= now));
  const activeExpired = !!state.active && state.active.expiresAt <= now;
  if (expired.length === 0 && !activeExpired) return { state, ok: true, events: [] };
  const records: CombatEventRecord[] = [];
  for (const e of expired) {
    records.push(recordOf(e, 'expired', now, 'expired'));
    state = { ...state, records: [...state.records, records[records.length - 1]].slice(-MAX_RECORDS) };
  }
  let next: CombatArbiterState = {
    ...state,
    queue: state.queue.filter(e => e.expiresAt > now),
    active: activeExpired ? null : state.active,
    settledEventIds: [...new Set([...state.settledEventIds, ...expired.map(e => e.eventId)])].slice(-MAX_SETTLED),
    updatedAt: now,
  };
  if (activeExpired && state.active) {
    next.settledEventIds = [...new Set([...next.settledEventIds, state.active.eventId])].slice(-MAX_SETTLED);
    records.push({
      eventId: state.active.eventId, eventType: state.active.eventType, priority: state.active.priority,
      status: 'expired', battleId: state.battleId, bossId: state.bossId, phaseId: state.phaseId, at: now, reason: 'active-expired',
    });
    next.records = [...next.records, records[records.length - 1]].slice(-MAX_RECORDS);
  }
  return { state: next, ok: true, events: records };
}

/** 阶段失效：旧阶段事件与锁全部取消，新阶段重新开始 */
export function invalidatePhase(state: CombatArbiterState, phaseId: string, now: number): ArbiterStep {
  const records: CombatEventRecord[] = [];
  const drop = (e: CombatEvent, status: CombatEventStatus, reason: string) => {
    const rec = recordOf(e, status, now, reason);
    records.push(rec);
  };
  if (state.active) {
    const activeEvent = state.queue.find(e => e.eventId === state.active!.eventId);
    if (activeEvent && activeEvent.phaseId && activeEvent.phaseId !== phaseId) drop(activeEvent, 'cancelled', 'phase-invalidated');
  }
  for (const e of state.queue) {
    if (e.phaseId && e.phaseId !== phaseId && e.eventId !== (state.active ? state.active.eventId : '')) {
      drop(e, 'cancelled', 'phase-invalidated');
    }
  }
  const kept = state.queue.filter(e => !e.phaseId || e.phaseId === phaseId);
  const keepActive = state.active && kept.some(e => e.eventId === state.active!.eventId);
  const next: CombatArbiterState = {
    ...state,
    phaseId,
    active: keepActive ? state.active : null,
    queue: kept,
    records: [...state.records, ...records].slice(-MAX_RECORDS),
    settledEventIds: [...new Set([...state.settledEventIds, ...records.map(r => r.eventId)])].slice(-MAX_SETTLED),
    updatedAt: now,
  };
  return { state: next, ok: true, events: records };
}

/** 战斗终结：取消全部事件、锁与队列；可记录一条 P0 终结事件 */
export function closeCombatArbiter(
  state: CombatArbiterState,
  reason: string,
  now: number,
  terminal?: { eventId: string; eventType: CombatEventType; priority: CombatPriority; payload?: Record<string, unknown> },
): ArbiterStep {
  const records: CombatEventRecord[] = [];
  if (state.active) {
    const target = state.queue.find(e => e.eventId === state.active!.eventId);
    if (target) records.push(recordOf(target, 'cancelled', now, reason));
    else records.push({
      eventId: state.active.eventId, eventType: state.active.eventType, priority: state.active.priority,
      status: 'cancelled', battleId: state.battleId, bossId: state.bossId, phaseId: state.phaseId, at: now, reason,
    });
  }
  for (const e of state.queue) {
    if (state.active && e.eventId === state.active.eventId) continue;
    records.push(recordOf(e, 'cancelled', now, reason));
  }
  if (terminal) {
    records.push({
      eventId: terminal.eventId, eventType: terminal.eventType, priority: terminal.priority,
      status: 'resolved', battleId: state.battleId, bossId: state.bossId, phaseId: state.phaseId,
      at: now, reason, payload: terminal.payload,
    });
  }
  const cancelledIds = records.filter(r => r.status === 'cancelled').map(r => r.eventId);
  const next: CombatArbiterState = {
    ...state,
    active: null,
    queue: [],
    records: [...state.records, ...records].slice(-MAX_RECORDS),
    settledEventIds: [...new Set([...state.settledEventIds, ...cancelledIds, ...(terminal ? [terminal.eventId] : [])])].slice(-MAX_SETTLED),
    updatedAt: now,
  };
  return { state: next, ok: true, events: records };
}

/** 直接记录一个已结算事件（伤害/弱点效果/奖励），不占锁、不入队 */
export function recordCombatEvent(
  state: CombatArbiterState,
  input: CombatEventInput,
  now: number,
  status: CombatEventStatus = 'resolved',
  reason?: string,
): CombatArbiterState {
  if (isSettled(state, input.eventId)) return state;
  const event = makeEvent(state, input, now);
  const rec: CombatEventRecord = {
    eventId: event.eventId,
    eventType: event.eventType,
    priority: event.priority,
    status,
    battleId: state.battleId,
    bossId: state.bossId,
    phaseId: event.phaseId,
    at: now,
    reason,
    payload: event.payload,
  };
  const settled = status === 'resolved' || status === 'cancelled' || status === 'expired';
  return {
    ...state,
    sequence: event.sequence,
    records: [...state.records, rec].slice(-MAX_RECORDS),
    settledEventIds: settled
      ? [...new Set([...state.settledEventIds, event.eventId])].slice(-MAX_SETTLED)
      : state.settledEventIds,
    updatedAt: now,
  };
}

export interface NormalizeArbiterOptions {
  battleId: string;
  bossId: string;
  phaseId: string;
  now: number;
}

/**
 * 存档自愈：只保留记录与已结算 ID；活动锁 / 队列属于瞬态，刷新后清空（由 store 重新获取）。
 * battleId / bossId 不匹配 → 新建；旧阶段记录保留但不再执行。
 */
export function normalizeCombatArbiter(raw: unknown, opts: NormalizeArbiterOptions): CombatArbiterState {
  const fresh = createCombatArbiter(opts.battleId, opts.bossId, opts.phaseId, opts.now);
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Partial<CombatArbiterState>;
  if (typeof r.bossId === 'string' && r.bossId !== opts.bossId) return fresh;
  if (typeof r.battleId === 'string' && r.battleId !== opts.battleId) return fresh;
  const records = Array.isArray(r.records)
    ? r.records.filter((x): x is CombatEventRecord => !!x && typeof x === 'object' && typeof (x as CombatEventRecord).eventId === 'string')
      .map(x => ({ ...x, status: 'resolved' as const }))
      .slice(-MAX_RECORDS)
    : [];
  const settled = Array.isArray(r.settledEventIds)
    ? [...new Set(r.settledEventIds.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-MAX_SETTLED)
    : [];
  return {
    battleId: opts.battleId,
    bossId: opts.bossId,
    phaseId: opts.phaseId,
    active: null,
    queue: [],
    records,
    settledEventIds: settled,
    sequence: int(r.sequence),
    updatedAt: opts.now,
  };
}
