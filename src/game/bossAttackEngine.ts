// Boss 主动攻击引擎（V1.3-B.2）：攻击模式 / 预警 / 防御 / 闪避 / 伤害 / 冷却
//
// 设计约束：
//   1. 纯逻辑 + 可序列化状态：不直接写存档、不改 DOM、不结算奖励；
//   2. 攻击生命周期：idle → selecting → telegraph → attacking → resolving → cooldown → idle；
//      异常：telegraph → cancelled，attacking → interrupted；
//   3. 伤害只由本模块计算（基础伤害 / 防御减伤 / 闪避 / 难度 / 减伤护罩），
//      同一 hitKey 只产生一次伤害；
//   4. 刷新后无法安全恢复的预警 / 攻击一律取消，绝不重复伤害；
//   5. 事件通过 B.1 的 bossBattleEventBus 广播，不新建动态事件引擎。

import type { BossDifficulty } from './difficulty';
import { BOSS_BATTLE_EVENTS, type BossBattleEvent, type BossBattleEventType } from './bossPhaseEngine';

export { BOSS_BATTLE_EVENTS };

export type BossAttackType = 'single' | 'multi' | 'aoe' | 'delayed' | 'special';

export type BossAttackStatus =
  | 'idle'
  | 'selecting'
  | 'telegraph'
  | 'attacking'
  | 'resolving'
  | 'cooldown'
  | 'cancelled'
  | 'interrupted';

export type PlayerResponseKind = 'none' | 'defend' | 'dodge';
export type AttackHitResult = 'hit' | 'blocked' | 'dodged';
export type AttackSummary = AttackHitResult | 'cancelled' | 'interrupted' | null;

export interface BossAttackPattern {
  attackId: string;
  attackName: string;
  attackType: BossAttackType;
  description: string;
  /** 单次命中基础伤害 */
  damage: number;
  /** 预警时长（毫秒） */
  warningDuration: number;
  /** 该模式冷却（毫秒） */
  cooldown: number;
  /** 攻击阶段开始到第一次命中的延迟（毫秒） */
  attackDuration: number;
  /** 命中次数（连续攻击 > 1） */
  hitCount: number;
  /** 连续攻击间隔（毫秒） */
  hitIntervalMs: number;
  /** 全部命中后的恢复时长 */
  recoveryDuration: number;
  difficulty: BossDifficulty;
  /** 闪避窗口：按下闪避后的有效时长（毫秒） */
  dodgeWindow: number;
  /** 防御需求：basic / timed / none（none = 不可防御） */
  defenseRequirement: 'basic' | 'timed' | 'none';
  /** 防御减伤比例 0~1 */
  defenseReduction: number;
  /** 防御姿态持续时长（毫秒） */
  defenseWindow: number;
  /** 允许出现的战斗阶段索引 */
  phaseRestriction: number[];
  target: 'player';
  visualEffect: 'pulse' | 'barrage' | 'aoe' | 'lock' | 'burst' | 'wave';
  audioEffect: string;
  dangerLevel: 1 | 2 | 3;
  specialEffect?: string;
  attackMetadata?: Record<string, unknown>;
}

export interface BossAttackState {
  battleId: string;
  bossId: string;
  phaseId: string;
  phaseIndex: number;
  attackState: BossAttackStatus;
  currentPattern: BossAttackPattern | null;
  instanceId: string | null;
  startedAt: number;
  telegraphStartedAt: number | null;
  telegraphEndsAt: number | null;
  attackStartedAt: number | null;
  attackEndsAt: number | null;
  cooldownEndsAt: number | null;
  target: 'player';
  damagePlanned: number;
  damageDealt: number;
  playerResponse: PlayerResponseKind;
  responseAt: number | null;
  guardUntil: number | null;
  dodgeUntil: number | null;
  defenseReadyAt: number;
  dodgeReadyAt: number;
  hitsResolved: number;
  hitCount: number;
  nextHitAt: number | null;
  lastResult: AttackHitResult | null;
  attackResult: AttackSummary;
  /** 已结算命中 key（instanceId:hitIndex），防止重复伤害 */
  resolvedHitKeys: string[];
  /** 模式 → 上次使用时间（冷却） */
  patternCooldowns: Record<string, number>;
  /** 被弱点效果禁用的模式 → 解禁时间（V1.3-B.3） */
  disabledPatterns: Record<string, number>;
  /** 下一次允许选择攻击的时间 */
  nextAttackAt: number;
  lastPatternId: string | null;
  updatedAt: number;
}

export interface BossAttackDamage {
  hitKey: string;
  hitIndex: number;
  amount: number;
  result: AttackHitResult;
  attackId: string;
  attackName: string;
}

export interface BossAttackStep {
  state: BossAttackState;
  events: BossBattleEvent[];
  damages: BossAttackDamage[];
  changed: boolean;
  reason?: string;
}

export const ATTACK_STATUS_LABEL: Record<BossAttackStatus, string> = {
  idle: '待机',
  selecting: '选择攻击',
  telegraph: '预警中',
  attacking: '攻击中',
  resolving: '结算中',
  cooldown: '冷却中',
  cancelled: '已取消',
  interrupted: '已中断',
};

export const ATTACK_TYPE_LABEL: Record<BossAttackType, string> = {
  single: '单体攻击',
  multi: '连续攻击',
  aoe: '范围攻击',
  delayed: '延迟攻击',
  special: '特殊攻击',
};

export const DANGER_LABEL: Record<1 | 2 | 3, string> = { 1: '低', 2: '中', 3: '高' };

export const DEFENSE_COOLDOWN_MS = 3000;
export const DODGE_COOLDOWN_MS = 4500;
export const ATTACK_GAP_MS = 3500;
export const INITIAL_ATTACK_DELAY_MS = 7000;

const ALLOWED: Record<BossAttackStatus, BossAttackStatus[]> = {
  idle: ['selecting', 'cancelled'],
  selecting: ['telegraph', 'cancelled'],
  telegraph: ['attacking', 'cancelled', 'interrupted'],
  attacking: ['resolving', 'cancelled', 'interrupted'],
  resolving: ['cooldown', 'interrupted'],
  cooldown: ['idle', 'cancelled', 'interrupted'],
  cancelled: ['idle'],
  interrupted: ['idle'],
};

export function canTransitionAttack(from: BossAttackStatus, to: BossAttackStatus): boolean {
  return ALLOWED[from].includes(to);
}

const int = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;

const clampNum = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

let seq = 0;
function nextId(prefix: string, now: number): string {
  seq = (seq + 1) % 1_000_000;
  return prefix + '@' + Math.max(0, Math.floor(now)) + '-' + seq.toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

function eventOf(
  state: BossAttackState,
  type: BossBattleEventType,
  now: number,
  payload: Record<string, unknown> = {},
): BossBattleEvent {
  return {
    id: nextId('atkevt', now),
    type,
    battleId: state.battleId,
    bossId: state.bossId,
    phaseId: state.phaseId,
    attackId: state.currentPattern ? state.currentPattern.attackId : null,
    at: Math.max(0, Math.floor(now)),
    payload,
  };
}

export function createBossAttackState(
  battleId: string,
  bossId: string,
  phaseId: string,
  phaseIndex: number,
  now: number,
  opts: { nextAttackAt?: number } = {},
): BossAttackState {
  return {
    battleId,
    bossId,
    phaseId,
    phaseIndex,
    attackState: 'idle',
    currentPattern: null,
    instanceId: null,
    startedAt: 0,
    telegraphStartedAt: null,
    telegraphEndsAt: null,
    attackStartedAt: null,
    attackEndsAt: null,
    cooldownEndsAt: null,
    target: 'player',
    damagePlanned: 0,
    damageDealt: 0,
    playerResponse: 'none',
    responseAt: null,
    guardUntil: null,
    dodgeUntil: null,
    defenseReadyAt: 0,
    dodgeReadyAt: 0,
    hitsResolved: 0,
    hitCount: 0,
    nextHitAt: null,
    lastResult: null,
    attackResult: null,
    resolvedHitKeys: [],
    patternCooldowns: {},
    disabledPatterns: {},
    nextAttackAt: typeof opts.nextAttackAt === 'number' && isFinite(opts.nextAttackAt)
      ? Math.max(0, Math.floor(opts.nextAttackAt))
      : now + INITIAL_ATTACK_DELAY_MS,
    lastPatternId: null,
    updatedAt: Math.max(0, Math.floor(now)),
  };
}

const unchanged = (state: BossAttackState, reason?: string): BossAttackStep =>
  ({ state, events: [], damages: [], changed: false, reason });

function hpDamageOf(pattern: BossAttackPattern, result: AttackHitResult, damageScale: number): number {
  if (result === 'dodged') return 0;
  const reduction = result === 'blocked' ? clampNum(pattern.defenseReduction, 0, 1) : 0;
  const raw = Math.max(0, pattern.damage) * (1 - reduction) * clampNum(damageScale, 0, 4);
  return Math.max(0, Math.ceil(raw));
}

export interface AttackTickContext {
  now: number;
  phaseId: string;
  phaseIndex: number;
  battleActive: boolean;
  eventBlocked: boolean;
  playerHp: number;
  /** 难度 / 模拟再战 / 护罩减伤系数（0 = 不扣血） */
  damageScale: number;
  /** 弱点暴露时对 Boss 攻击冷却的延长倍率（≥1） */
  cooldownMultiplier?: number;
  rng?: () => number;
}

// ---------- 攻击选择 ----------

const availablePatterns = (state: BossAttackState, patterns: BossAttackPattern[], now: number): BossAttackPattern[] =>
  patterns.filter(p => {
    if (!p.phaseRestriction.includes(state.phaseIndex)) return false;
    const disabledUntil = state.disabledPatterns[p.attackId];
    if (typeof disabledUntil === 'number' && now < disabledUntil) return false;
    const last = state.patternCooldowns[p.attackId];
    if (typeof last === 'number' && now - last < Math.max(0, p.cooldown)) return false;
    return true;
  });

/** idle → selecting：按阶段 / 冷却 / 权重选择攻击模式 */
export function selectAttack(state: BossAttackState, patterns: BossAttackPattern[], now: number, rng: () => number = Math.random): BossAttackStep & { pattern?: BossAttackPattern } {
  if (state.attackState !== 'idle') return unchanged(state, '当前状态不能选择攻击');
  let pool = availablePatterns(state, patterns, now);
  if (pool.length === 0) return unchanged(state, '没有可用的攻击模式（阶段限制或冷却中）');
  if (pool.length > 1 && state.lastPatternId) {
    const withoutLast = pool.filter(p => p.attackId !== state.lastPatternId);
    if (withoutLast.length > 0) pool = withoutLast;
  }
  const weights = pool.map(p => 1 + p.dangerLevel * 0.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = clampNum(rng(), 0, 0.999999) * total;
  let picked = pool[pool.length - 1];
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { picked = pool[i]; break; }
  }
  const next: BossAttackState = {
    ...state,
    attackState: 'selecting',
    currentPattern: picked,
    instanceId: nextId('atk', now),
    startedAt: now,
    damagePlanned: picked.damage * Math.max(1, picked.hitCount),
    damageDealt: 0,
    playerResponse: 'none',
    responseAt: null,
    guardUntil: null,
    dodgeUntil: null,
    hitsResolved: 0,
    hitCount: Math.max(1, Math.floor(picked.hitCount)),
    nextHitAt: null,
    lastResult: null,
    attackResult: null,
    resolvedHitKeys: [],
    lastPatternId: picked.attackId,
    patternCooldowns: { ...state.patternCooldowns, [picked.attackId]: now },
    updatedAt: now,
  };
  return {
    state: next,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.ATTACK_SELECTED, now, {
      attackName: picked.attackName,
      attackType: picked.attackType,
      dangerLevel: picked.dangerLevel,
    })],
    damages: [],
    changed: true,
    pattern: picked,
  };
}

/** selecting → telegraph */
export function startTelegraph(state: BossAttackState, now: number): BossAttackStep {
  if (state.attackState !== 'selecting' || !state.currentPattern) return unchanged(state, '没有待预警的攻击');
  const p = state.currentPattern;
  const next: BossAttackState = {
    ...state,
    attackState: 'telegraph',
    telegraphStartedAt: now,
    telegraphEndsAt: now + Math.max(0, p.warningDuration),
    attackStartedAt: null,
    attackEndsAt: null,
    cooldownEndsAt: null,
    updatedAt: now,
  };
  return {
    state: next,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH, now, {
      warningDuration: p.warningDuration,
      plannedDamage: next.damagePlanned,
      dangerLevel: p.dangerLevel,
      attackType: p.attackType,
      recommended: p.defenseRequirement === 'none' ? 'dodge' : 'defend-or-dodge',
    })],
    damages: [],
    changed: true,
  };
}

// ---------- 玩家响应 ----------

export interface PlayerActionStep {
  state: BossAttackState;
  events: BossBattleEvent[];
  changed: boolean;
  ok: boolean;
  reason?: string;
  message?: string;
}

/** 防御：只在预警 / 攻击阶段可用；姿态持续 defenseWindow，命中时仍在姿态内才减伤 */
export function playerDefend(state: BossAttackState, now: number): PlayerActionStep {
  if (state.attackState !== 'telegraph' && state.attackState !== 'attacking') {
    return { state, events: [], changed: false, ok: false, reason: '当前没有可防御的攻击' };
  }
  if (state.attackState === 'attacking' && state.nextHitAt == null) {
    return { state, events: [], changed: false, ok: false, reason: '攻击已经结算' };
  }
  if (now < state.defenseReadyAt) {
    return { state, events: [], changed: false, ok: false, reason: '防御冷却中', message: '还需 ' + ((state.defenseReadyAt - now) / 1000).toFixed(1) + ' 秒' };
  }
  const p = state.currentPattern;
  if (!p || p.defenseRequirement === 'none' || p.defenseReduction <= 0) {
    return { state, events: [], changed: false, ok: false, reason: '该攻击无法防御，只能闪避' };
  }
  const next: BossAttackState = {
    ...state,
    playerResponse: 'defend',
    responseAt: now,
    guardUntil: now + Math.max(0, p.defenseWindow),
    dodgeUntil: null,
    defenseReadyAt: now + DEFENSE_COOLDOWN_MS,
    updatedAt: now,
  };
  return {
    state: next,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.PLAYER_DEFEND, now, {
      guardUntil: next.guardUntil,
      reduction: p.defenseReduction,
    })],
    changed: true,
    ok: true,
    message: '已展开防御姿态（' + Math.round(p.defenseReduction * 100) + '% 减伤）',
  };
}

/** 闪避：闪避窗口由攻击模式决定，命中时仍在窗口内才成功 */
export function playerDodge(state: BossAttackState, now: number): PlayerActionStep {
  if (state.attackState !== 'telegraph' && state.attackState !== 'attacking') {
    return { state, events: [], changed: false, ok: false, reason: '当前没有可闪避的攻击' };
  }
  if (state.attackState === 'attacking' && state.nextHitAt == null) {
    return { state, events: [], changed: false, ok: false, reason: '攻击已经结算' };
  }
  if (now < state.dodgeReadyAt) {
    return { state, events: [], changed: false, ok: false, reason: '闪避冷却中', message: '还需 ' + ((state.dodgeReadyAt - now) / 1000).toFixed(1) + ' 秒' };
  }
  const p = state.currentPattern;
  if (!p) return { state, events: [], changed: false, ok: false, reason: '攻击数据缺失' };
  const next: BossAttackState = {
    ...state,
    playerResponse: 'dodge',
    responseAt: now,
    dodgeUntil: now + Math.max(0, p.dodgeWindow),
    guardUntil: null,
    dodgeReadyAt: now + DODGE_COOLDOWN_MS,
    updatedAt: now,
  };
  return {
    state: next,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.PLAYER_DODGE, now, {
      dodgeUntil: next.dodgeUntil,
      window: p.dodgeWindow,
    })],
    changed: true,
    ok: true,
    message: '进入闪避窗口（' + (p.dodgeWindow / 1000).toFixed(1) + ' 秒）',
  };
}

// ---------- 取消 / 中断 ----------

export function cancelAttack(state: BossAttackState, now: number, reason = '攻击取消'): BossAttackStep {
  if (state.attackState === 'idle' || state.attackState === 'cancelled' || state.attackState === 'interrupted') {
    return unchanged(state, reason);
  }
  const next: BossAttackState = {
    ...state,
    attackState: 'cancelled',
    attackResult: 'cancelled',
    attackEndsAt: now + 1000,
    cooldownEndsAt: null,
    nextAttackAt: now + 2000,
    updatedAt: now,
  };
  return {
    state: next,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.ATTACK_CANCELLED, now, { reason })],
    damages: [],
    changed: true,
  };
}

export function interruptAttack(state: BossAttackState, now: number, reason = '攻击中断'): BossAttackStep {
  if (state.attackState === 'idle' || state.attackState === 'cancelled' || state.attackState === 'interrupted') {
    return unchanged(state, reason);
  }
  const next: BossAttackState = {
    ...state,
    attackState: 'interrupted',
    attackResult: 'interrupted',
    attackEndsAt: now + 800,
    cooldownEndsAt: null,
    nextAttackAt: now + 2000,
    updatedAt: now,
  };
  return {
    state: next,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.ATTACK_INTERRUPTED, now, { reason })],
    damages: [],
    changed: true,
  };
}

/** 同步阶段：阶段切换时取消当前攻击并加载新阶段攻击模式（由 tick 调用） */
export function syncAttackPhase(state: BossAttackState, phaseId: string, phaseIndex: number, now: number): BossAttackStep {
  if (state.phaseId === phaseId && state.phaseIndex === phaseIndex) return unchanged(state);
  const active = state.attackState !== 'idle' && state.attackState !== 'cancelled' && state.attackState !== 'interrupted';
  const next: BossAttackState = {
    ...state,
    phaseId,
    phaseIndex,
    attackState: 'idle',
    currentPattern: null,
    instanceId: null,
    playerResponse: 'none',
    responseAt: null,
    guardUntil: null,
    dodgeUntil: null,
    hitsResolved: 0,
    hitCount: 0,
    nextHitAt: null,
    attackResult: active ? 'cancelled' : state.attackResult,
    resolvedHitKeys: [],
    // 新阶段：重置攻击模式冷却 / 弱点禁用与玩家缓冲
    patternCooldowns: {},
    disabledPatterns: {},
    nextAttackAt: now + 2200,
    updatedAt: now,
  };
  return {
    state: next,
    events: active ? [eventOf(next, BOSS_BATTLE_EVENTS.ATTACK_CANCELLED, now, { reason: 'phase-change', toPhase: phaseId })] : [],
    damages: [],
    changed: true,
  };
}

// ---------- 主循环 ----------

function resolveHit(
  state: BossAttackState,
  now: number,
  ctx: AttackTickContext,
): { state: BossAttackState; damage: BossAttackDamage | null; event: BossBattleEvent | null; done: boolean } {
  const p = state.currentPattern;
  if (!p || !state.instanceId) return { state, damage: null, event: null, done: true };
  const hitIndex = state.hitsResolved;
  const hitKey = state.instanceId + ':' + hitIndex;
  if (state.resolvedHitKeys.includes(hitKey)) {
    // 幂等：该命中已结算，只推进计数（不会重复扣血）
    const hitsResolved = hitIndex + 1;
    return {
      state: { ...state, hitsResolved, nextHitAt: hitsResolved < state.hitCount ? now + Math.max(0, p.hitIntervalMs) : null, updatedAt: now },
      damage: null,
      event: null,
      done: hitsResolved >= state.hitCount,
    };
  }

  const guardActive = state.guardUntil != null && now <= state.guardUntil && p.defenseReduction > 0 && p.defenseRequirement !== 'none';
  const dodgeActive = state.dodgeUntil != null && now <= state.dodgeUntil;
  const result: AttackHitResult = dodgeActive ? 'dodged' : guardActive ? 'blocked' : 'hit';
  const amount = hpDamageOf(p, result, ctx.damageScale);
  const hitsResolved = hitIndex + 1;
  const nextHit = hitsResolved < state.hitCount ? now + Math.max(0, p.hitIntervalMs) : null;
  const nextState: BossAttackState = {
    ...state,
    hitsResolved,
    nextHitAt: nextHit,
    lastResult: result,
    damageDealt: state.damageDealt + amount,
    resolvedHitKeys: [...state.resolvedHitKeys, hitKey].slice(-40),
    updatedAt: now,
  };
  const damage: BossAttackDamage = {
    hitKey,
    hitIndex,
    amount,
    result,
    attackId: p.attackId,
    attackName: p.attackName,
  };
  const eventType = result === 'dodged'
    ? BOSS_BATTLE_EVENTS.ATTACK_DODGED
    : result === 'blocked' ? BOSS_BATTLE_EVENTS.ATTACK_BLOCKED : BOSS_BATTLE_EVENTS.ATTACK_HIT;
  const event = eventOf(nextState, eventType, now, {
    hitIndex,
    hitCount: state.hitCount,
    amount,
    result,
    response: state.playerResponse,
    plannedDamage: p.damage,
    damageDealt: nextState.damageDealt,
  });
  return { state: nextState, damage, event, done: hitsResolved >= state.hitCount };
}

/**
 * 推进攻击生命周期（唯一调度入口，由页面单一定时器 / DEV 虚拟时钟调用）。
 * 只在状态真正变化时返回 changed=true；无变化时绝不写存档。
 */
export function tickBossAttack(state: BossAttackState, patterns: BossAttackPattern[], ctx: AttackTickContext): BossAttackStep {
  let current = state;
  const events: BossBattleEvent[] = [];
  const damages: BossAttackDamage[] = [];
  let changed = false;

  // 阶段变化：取消旧攻击并加载新阶段
  if (current.phaseId !== ctx.phaseId || current.phaseIndex !== ctx.phaseIndex) {
    const sync = syncAttackPhase(current, ctx.phaseId, ctx.phaseIndex, ctx.now);
    current = sync.state;
    events.push(...sync.events);
    changed = changed || sync.changed;
  }

  // 战斗结束 / 事件阻断 / 玩家死亡：取消未完成攻击并立即回到 idle（避免残留计时/重复渲染）
  const battleBlocked = !ctx.battleActive || ctx.eventBlocked || ctx.playerHp <= 0;
  if (battleBlocked) {
    if (current.attackState !== 'idle') {
      const cancelled = cancelAttack(current, ctx.now, ctx.playerHp <= 0 ? 'player-down' : !ctx.battleActive ? 'battle-inactive' : 'dynamic-event');
      events.push(...cancelled.events);
      current = {
        ...cancelled.state,
        attackState: 'idle',
        currentPattern: null,
        attackEndsAt: null,
        nextAttackAt: ctx.now + 2000,
        updatedAt: ctx.now,
      };
      changed = true;
    } else if (current.nextAttackAt <= ctx.now) {
      current = { ...current, nextAttackAt: ctx.now + 2000, updatedAt: ctx.now };
      changed = true;
    }
    return { state: current, events, damages, changed };
  }

  const now = ctx.now;
  for (let guard = 0; guard < 12; guard++) {
    let progressed = false;
    switch (current.attackState) {
      case 'idle': {
        if (now >= current.nextAttackAt) {
          const selected = selectAttack(current, patterns, now, ctx.rng);
          if (selected.changed) {
            current = selected.state;
            events.push(...selected.events);
            progressed = true;
            changed = true;
          } else {
            current = { ...current, nextAttackAt: now + 1800, updatedAt: now };
            changed = true;
          }
        }
        break;
      }
      case 'selecting': {
        const tel = startTelegraph(current, now);
        if (tel.changed) {
          current = tel.state;
          events.push(...tel.events);
          progressed = true;
          changed = true;
        }
        break;
      }
      case 'telegraph': {
        if (current.telegraphEndsAt != null && now >= current.telegraphEndsAt) {
          const p = current.currentPattern;
          const attackStartedAt = current.telegraphEndsAt;
          const nextHitAt = attackStartedAt + (p ? Math.max(0, p.attackDuration) : 0);
          const next: BossAttackState = {
            ...current,
            attackState: 'attacking',
            attackStartedAt,
            attackEndsAt: null,
            nextHitAt,
            updatedAt: now,
          };
          current = next;
          events.push(eventOf(next, BOSS_BATTLE_EVENTS.ATTACK_STARTED, now, {
            attackName: p ? p.attackName : '',
            hitCount: next.hitCount,
          }));
          progressed = true;
          changed = true;
        }
        break;
      }
      case 'attacking': {
        if (current.nextHitAt != null && now >= current.nextHitAt) {
          const hit = resolveHit(current, now, ctx);
          current = hit.state;
          if (hit.event) events.push(hit.event);
          if (hit.damage) damages.push(hit.damage);
          changed = true;
          if (hit.done) {
            const summary: AttackSummary = current.lastResult === 'dodged'
              ? 'dodged'
              : current.lastResult === 'blocked' ? 'blocked' : 'hit';
            const p = current.currentPattern;
            const recovery = p ? Math.max(0, p.recoveryDuration) : 0;
            const next: BossAttackState = {
              ...current,
              attackState: 'resolving',
              attackResult: summary,
              attackEndsAt: now + recovery,
              nextHitAt: null,
              updatedAt: now,
            };
            current = next;
            events.push(eventOf(next, BOSS_BATTLE_EVENTS.ATTACK_RESOLVED, now, {
              result: summary,
              damageDealt: current.damageDealt,
              hitsResolved: current.hitsResolved,
            }));
          }
          progressed = true;
        }
        break;
      }
      case 'resolving': {
        if (current.attackEndsAt != null && now >= current.attackEndsAt) {
          const p = current.currentPattern;
          const baseCooldown = p ? Math.max(0, p.cooldown) : 0;
          const mult = typeof ctx.cooldownMultiplier === 'number' && isFinite(ctx.cooldownMultiplier)
            ? clampNum(ctx.cooldownMultiplier, 1, 3)
            : 1;
          const cooldown = Math.round(baseCooldown * mult);
          const next: BossAttackState = {
            ...current,
            attackState: 'cooldown',
            cooldownEndsAt: now + cooldown,
            updatedAt: now,
          };
          current = next;
          progressed = true;
          changed = true;
        }
        break;
      }
      case 'cooldown': {
        if (current.cooldownEndsAt != null && now >= current.cooldownEndsAt) {
          const next: BossAttackState = {
            ...current,
            attackState: 'idle',
            currentPattern: null,
            nextAttackAt: now + ATTACK_GAP_MS,
            updatedAt: now,
          };
          current = next;
          progressed = true;
          changed = true;
        }
        break;
      }
      case 'cancelled':
      case 'interrupted': {
        if (current.attackEndsAt == null || now >= current.attackEndsAt) {
          current = {
            ...current,
            attackState: 'idle',
            currentPattern: null,
            attackEndsAt: null,
            nextAttackAt: Math.max(current.nextAttackAt, now + 800),
            updatedAt: now,
          };
          progressed = true;
          changed = true;
        }
        break;
      }
      default:
        break;
    }
    if (!progressed) break;
  }

  return { state: current, events, damages, changed };
}

/** 弱点破解成功：中断当前攻击 + 禁用指定模式（配置驱动，供 B.3 调用） */
export function applyAttackInterference(
  state: BossAttackState,
  opts: { now: number; until: number; disablePatternIds?: string[]; interrupt?: boolean; reason?: string },
): BossAttackStep {
  let current = state;
  const events: BossBattleEvent[] = [];
  if (opts.interrupt && current.attackState !== 'idle' && current.attackState !== 'cancelled' && current.attackState !== 'interrupted') {
    const cancelled = cancelAttack(current, opts.now, opts.reason || 'weakness-exposed');
    current = cancelled.state;
    events.push(...cancelled.events);
  }
  const disabled: Record<string, number> = {};
  for (const [id, until] of Object.entries(current.disabledPatterns || {})) {
    if (typeof until === 'number' && until > opts.now) disabled[id] = until;
  }
  for (const id of opts.disablePatternIds || []) {
    if (typeof id === 'string' && id) disabled[id] = Math.max(disabled[id] || 0, opts.until);
  }
  current = { ...current, disabledPatterns: disabled, updatedAt: opts.now };
  return { state: current, events, damages: [], changed: true };
}

// ---------- 查询 ----------

export function attackRemainingMs(state: BossAttackState, now: number): number | null {
  if (state.attackState === 'telegraph' && state.telegraphEndsAt != null) return Math.max(0, state.telegraphEndsAt - now);
  if (state.attackState === 'attacking' && state.nextHitAt != null) return Math.max(0, state.nextHitAt - now);
  if (state.attackState === 'resolving' && state.attackEndsAt != null) return Math.max(0, state.attackEndsAt - now);
  if (state.attackState === 'cooldown' && state.cooldownEndsAt != null) return Math.max(0, state.cooldownEndsAt - now);
  return null;
}

export function isAttackActive(state: BossAttackState | null): boolean {
  return !!state && (state.attackState === 'telegraph' || state.attackState === 'attacking' || state.attackState === 'resolving');
}

export function responseReadyIn(state: BossAttackState, kind: 'defend' | 'dodge', now: number): number {
  const at = kind === 'defend' ? state.defenseReadyAt : state.dodgeReadyAt;
  return Math.max(0, at - now);
}

/** 预警进度 0~1（0=刚开始，1=即将命中） */
export function telegraphProgress(state: BossAttackState, now: number): number {
  if (state.attackState !== 'telegraph' || state.telegraphStartedAt == null || state.telegraphEndsAt == null) return 0;
  const total = state.telegraphEndsAt - state.telegraphStartedAt;
  if (total <= 0) return 1;
  return clampNum((now - state.telegraphStartedAt) / total, 0, 1);
}

// ---------- 自愈 ----------

export interface NormalizeAttackOptions {
  bossId: string;
  phaseId: string;
  phaseIndex: number;
  battleId: string;
  now: number;
}

/**
 * 存档自愈：预警 / 攻击中的状态无法安全恢复 → 取消但不结算伤害；
 * 冷却状态按绝对时间保留；任何脏数据退化为安全 idle。
 */
export function normalizeBossAttackState(raw: unknown, opts: NormalizeAttackOptions): BossAttackState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BossAttackState>;
  if (typeof r.bossId === 'string' && r.bossId !== opts.bossId) return null;
  const status: BossAttackStatus = r.attackState === 'idle' || r.attackState === 'selecting' || r.attackState === 'telegraph' ||
    r.attackState === 'attacking' || r.attackState === 'resolving' || r.attackState === 'cooldown' ||
    r.attackState === 'cancelled' || r.attackState === 'interrupted'
    ? r.attackState : 'idle';

  const resolvedHitKeys = Array.isArray(r.resolvedHitKeys)
    ? [...new Set(r.resolvedHitKeys.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-40)
    : [];
  const disabledPatterns: Record<string, number> = {};
  if (r.disabledPatterns && typeof r.disabledPatterns === 'object') {
    for (const [k, v] of Object.entries(r.disabledPatterns as Record<string, unknown>)) {
      if (typeof v === 'number' && isFinite(v) && v > opts.now) disabledPatterns[k] = Math.floor(v);
    }
  }
  const base = {
    ...createBossAttackState(opts.battleId, opts.bossId, opts.phaseId, opts.phaseIndex, opts.now),
    disabledPatterns,
  };
  const patternCooldowns: Record<string, number> = {};
  if (r.patternCooldowns && typeof r.patternCooldowns === 'object') {
    for (const [k, v] of Object.entries(r.patternCooldowns as Record<string, unknown>)) {
      if (typeof v === 'number' && isFinite(v) && v >= 0) patternCooldowns[k] = Math.floor(v);
    }
  }

  const active = status === 'selecting' || status === 'telegraph' || status === 'attacking' || status === 'resolving';
  if (active) {
    // 刷新无法安全恢复攻击：取消，绝不重复结算伤害
    return {
      ...base,
      attackState: 'cancelled',
      attackResult: 'cancelled',
      damageDealt: int(r.damageDealt),
      resolvedHitKeys,
      patternCooldowns,
      lastPatternId: typeof r.lastPatternId === 'string' ? r.lastPatternId : null,
      defenseReadyAt: int(r.defenseReadyAt),
      dodgeReadyAt: int(r.dodgeReadyAt),
      attackEndsAt: opts.now,
      nextAttackAt: opts.now + 2500,
      lastResult: null,
      updatedAt: opts.now,
    };
  }

  if (status === 'cooldown') {
    const end = int(r.cooldownEndsAt);
    if (end <= 0 || end <= opts.now) {
      return {
        ...base,
        attackState: 'idle',
        damageDealt: int(r.damageDealt),
        resolvedHitKeys,
        patternCooldowns,
        lastPatternId: typeof r.lastPatternId === 'string' ? r.lastPatternId : null,
        defenseReadyAt: int(r.defenseReadyAt),
        dodgeReadyAt: int(r.dodgeReadyAt),
        nextAttackAt: opts.now + 1500,
        updatedAt: opts.now,
      };
    }
    return {
      ...base,
      attackState: 'cooldown',
      cooldownEndsAt: end,
      damageDealt: int(r.damageDealt),
      resolvedHitKeys,
      patternCooldowns,
      lastPatternId: typeof r.lastPatternId === 'string' ? r.lastPatternId : null,
      defenseReadyAt: int(r.defenseReadyAt),
      dodgeReadyAt: int(r.dodgeReadyAt),
      nextAttackAt: end + ATTACK_GAP_MS,
      updatedAt: opts.now,
    };
  }

  return {
    ...base,
    attackState: status === 'cancelled' || status === 'interrupted' ? 'idle' : status,
    attackResult: status === 'cancelled' || status === 'interrupted' ? null : (r.attackResult || null),
    damageDealt: int(r.damageDealt),
    resolvedHitKeys,
    patternCooldowns,
    lastPatternId: typeof r.lastPatternId === 'string' ? r.lastPatternId : null,
    defenseReadyAt: int(r.defenseReadyAt),
    dodgeReadyAt: int(r.dodgeReadyAt),
    nextAttackAt: Math.max(int(r.nextAttackAt), opts.now + 1200),
    updatedAt: opts.now,
  };
}

export function normalizeBossAttackMap(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {};
}

// ---------- DEV ----------

/** DEV：直接以指定模式进入预警（不写存档、不发奖励） */
export function startAttackForDev(state: BossAttackState, pattern: BossAttackPattern, now: number): BossAttackStep {
  const base: BossAttackState = {
    ...state,
    attackState: 'selecting',
    currentPattern: pattern,
    instanceId: nextId('atkdev', now),
    startedAt: now,
    damagePlanned: pattern.damage * Math.max(1, pattern.hitCount),
    damageDealt: 0,
    playerResponse: 'none',
    responseAt: null,
    guardUntil: null,
    dodgeUntil: null,
    hitsResolved: 0,
    hitCount: Math.max(1, Math.floor(pattern.hitCount)),
    nextHitAt: null,
    lastResult: null,
    attackResult: null,
    resolvedHitKeys: [],
    patternCooldowns: { ...state.patternCooldowns, [pattern.attackId]: now },
    updatedAt: now,
  };
  const tel = startTelegraph(base, now);
  return {
    state: tel.state,
    events: [
      eventOf(base, BOSS_BATTLE_EVENTS.ATTACK_SELECTED, now, { attackName: pattern.attackName, dev: true }),
      ...tel.events,
    ],
    damages: [],
    changed: true,
  };
}
