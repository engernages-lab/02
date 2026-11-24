// Boss 多阶段战斗引擎（V1.3-B.1）：战斗状态机 + 阶段配置 + 阶段切换生命周期
//
// 设计约束：
//   1. 纯逻辑 + 可序列化状态：不直接写存档、不改 DOM、不参与判题与奖励；
//   2. 状态机只允许合法转换；阶段切换具有幂等性（transitionId + completedTransitionIds）；
//   3. HP 只有单一真实来源（战斗结算后的 hp），阶段切换默认「按比例继承」，不会凭空回血；
//   4. 所有 normalize / 恢复函数永不抛错：坏数据退化为安全状态，绝不锁死战斗；
//   5. 事件只通过本模块的事件总线向外广播，不另建动态事件引擎。

import type { BossDifficulty } from './difficulty';

// ---------- 状态机 ----------

export type BossBattleStatus =
  | 'idle'          // 未开始
  | 'preparing'     // 战斗准备（难度选择 / 入场）
  | 'active'        // 战斗进行中
  | 'phase_transition' // 阶段切换演出中
  | 'victory'       // 最终胜利
  | 'defeat'        // 战斗失败（玩家意识崩解）
  | 'interrupted';  // 战斗中断（撤退 / 异常）

export const BOSS_BATTLE_STATUS_LABEL: Record<BossBattleStatus, string> = {
  idle: '未开始',
  preparing: '准备中',
  active: '进行中',
  phase_transition: '阶段切换',
  victory: '已胜利',
  defeat: '已失败',
  interrupted: '已中断',
};

const ALLOWED_TRANSITIONS: Record<BossBattleStatus, BossBattleStatus[]> = {
  idle: ['preparing'],
  preparing: ['active', 'interrupted'],
  active: ['phase_transition', 'victory', 'defeat', 'interrupted'],
  phase_transition: ['active', 'victory', 'defeat', 'interrupted'],
  victory: [],
  defeat: [],
  interrupted: ['preparing', 'active'],
};

export function canTransition(from: BossBattleStatus, to: BossBattleStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminalStatus(status: BossBattleStatus): boolean {
  return status === 'victory' || status === 'defeat';
}

// ---------- 阶段配置 ----------

export type BossPhaseHpPolicy = 'inherit' | 'restore' | 'independent';

export type BossPhaseTriggerKind = 'hp-threshold' | 'challenge-complete' | 'special-event' | 'composite';

export interface BossPhaseTrigger {
  kind: BossPhaseTriggerKind;
  /** hp-threshold：血量百分比 ≤ threshold 时满足 */
  threshold?: number;
  /** challenge-complete：指定挑战完成后满足 */
  challengeId?: string;
  /** special-event：指定事件发生后满足（B.4 预留） */
  eventId?: string;
  /** composite：全部子条件同时满足 */
  all?: BossPhaseTrigger[];
}

export interface BossPhaseConfig {
  phaseId: string;
  phaseName: string;
  phaseIndex: number;
  description: string;
  /** 进入本阶段所需 Boss 血量百分比（0~100）；第一阶段固定 100 */
  hpThreshold: number;
  /** 本阶段在整场战斗中占用的血量段 */
  maxHp: number;
  phaseIntro: string;
  phaseOutro: string;
  /** 阶段专属参数（B.1 只保存，不提前实现攻击/弱点机制） */
  difficultyMultiplier: number;
  /** 本阶段允许挑战的现有挑战 id（复用 Judge 的真实题目） */
  availableChallenges: string[];
  /** 阶段切换时的 HP 策略；缺省使用 plan.defaultHpPolicy */
  hpPolicy?: BossPhaseHpPolicy;
  /** 防御参数（B.3 弱点 / 护盾机制预留） */
  defense: number;
  stageMetadata?: Record<string, unknown>;
  /** 额外触发条件（HP 阈值之外的挑战完成 / 特殊事件 / 组合条件） */
  trigger?: BossPhaseTrigger;
}

export interface BossPhasePlan {
  bossId: string;
  bossName: string;
  difficulty: BossDifficulty;
  totalHp: number;
  defaultHpPolicy: BossPhaseHpPolicy;
  phases: BossPhaseConfig[];
}

// ---------- 战斗运行状态 ----------

export interface BossPhaseHistoryEntry {
  phaseId: string;
  phaseIndex: number;
  enteredAt: number;
  exitedAt: number | null;
  trigger: BossPhaseTriggerKind | 'battle-start' | 'resume';
}

export interface BossPhaseTransition {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  fromIndex: number;
  toIndex: number;
  reason: BossPhaseTriggerKind;
  startedAt: number;
  completedAt: number | null;
}

export interface BossBattleStats {
  damageDealt: number;
  damageReceived: number;
  challengeAttempts: number;
  challengeSuccesses: number;
  challengeFailures: number;
  phaseTransitions: number;
}

export interface BossBattleRunState {
  battleId: string;
  bossId: string;
  bossName: string;
  difficulty: BossDifficulty;
  status: BossBattleStatus;
  startedAt: number;
  endedAt: number | null;
  hp: number;
  maxHp: number;
  currentPhaseId: string;
  currentPhaseIndex: number;
  phaseHistory: BossPhaseHistoryEntry[];
  transition: BossPhaseTransition | null;
  /** 已完成的切换 id（幂等保护，保留最近 32 个） */
  completedTransitionIds: string[];
  completedChallenges: string[];
  /** 已消费的特殊事件 id（B.4 预留） */
  consumedEventIds: string[];
  stats: BossBattleStats;
  battleResult: 'victory' | 'defeat' | 'interrupted' | null;
  updatedAt: number;
}

/** B.5 战斗评价预留：B.1 只记录数据，不计算评分 */
export interface BossBattleRecord extends BossBattleRunState {
  endedAt: number;
  battleResult: 'victory' | 'defeat' | 'interrupted';
  grade: null;
}

/** 玩家跨场次的 Boss 阶段进度 */
export interface BossPhaseProgress {
  highestPhaseIndex: number;
  clearedPhases: string[];
  updatedAt: number;
}

// ---------- 事件 ----------

export const BOSS_BATTLE_EVENTS = {
  STARTED: 'BOSS_BATTLE_STARTED',
  PHASE_STARTED: 'BOSS_PHASE_STARTED',
  PHASE_TRANSITION: 'BOSS_PHASE_TRANSITION',
  PHASE_COMPLETED: 'BOSS_PHASE_COMPLETED',
  CHALLENGE_STARTED: 'BOSS_CHALLENGE_STARTED',
  CHALLENGE_COMPLETED: 'BOSS_CHALLENGE_COMPLETED',
  DAMAGE_DEALT: 'BOSS_DAMAGE_DEALT',
  DAMAGE_RECEIVED: 'BOSS_DAMAGE_RECEIVED',
  VICTORY: 'BOSS_BATTLE_VICTORY',
  DEFEAT: 'BOSS_BATTLE_DEFEAT',
  INTERRUPTED: 'BOSS_BATTLE_INTERRUPTED',
  RESUMED: 'BOSS_BATTLE_RESUMED',
  // V1.3-B.2 攻击事件（与多阶段战斗共用同一事件总线）
  ATTACK_SELECTED: 'BOSS_ATTACK_SELECTED',
  ATTACK_TELEGRAPH: 'BOSS_ATTACK_TELEGRAPH',
  ATTACK_STARTED: 'BOSS_ATTACK_STARTED',
  ATTACK_RESOLVED: 'BOSS_ATTACK_RESOLVED',
  ATTACK_HIT: 'BOSS_ATTACK_HIT',
  ATTACK_DODGED: 'BOSS_ATTACK_DODGED',
  ATTACK_BLOCKED: 'BOSS_ATTACK_BLOCKED',
  ATTACK_CANCELLED: 'BOSS_ATTACK_CANCELLED',
  ATTACK_INTERRUPTED: 'BOSS_ATTACK_INTERRUPTED',
  PLAYER_DEFEND: 'BOSS_PLAYER_DEFEND',
  PLAYER_DODGE: 'BOSS_PLAYER_DODGE',
  // V1.3-B.3 弱点事件（复用同一事件总线）
  WEAKNESS_HINT: 'BOSS_WEAKNESS_HINT',
  WEAKNESS_ANALYZED: 'BOSS_WEAKNESS_ANALYZED',
  WEAKNESS_DISCOVERED: 'BOSS_WEAKNESS_DISCOVERED',
  WEAKNESS_CHALLENGE_STARTED: 'BOSS_WEAKNESS_CHALLENGE_STARTED',
  WEAKNESS_CHALLENGE_FAILED: 'BOSS_WEAKNESS_CHALLENGE_FAILED',
  WEAKNESS_CHALLENGE_SUCCESS: 'BOSS_WEAKNESS_CHALLENGE_SUCCESS',
  WEAKNESS_EXPOSED: 'BOSS_WEAKNESS_EXPOSED',
  WEAKNESS_EFFECT_APPLIED: 'BOSS_WEAKNESS_EFFECT_APPLIED',
  WEAKNESS_RECOVERED: 'BOSS_WEAKNESS_RECOVERED',
  WEAKNESS_CANCELLED: 'BOSS_WEAKNESS_CANCELLED',
} as const;

export type BossBattleEventType = typeof BOSS_BATTLE_EVENTS[keyof typeof BOSS_BATTLE_EVENTS];

export interface BossBattleEvent {
  id: string;
  type: BossBattleEventType;
  battleId: string;
  bossId: string;
  phaseId: string | null;
  /** 攻击事件专用：当前攻击模式 id */
  attackId?: string | null;
  /** 弱点事件专用：当前弱点 id */
  weaknessId?: string | null;
  at: number;
  payload: Record<string, unknown>;
}

export type BossBattleListener = (event: BossBattleEvent) => void;

/** 战斗事件总线：只做进程内广播，不持久化、不建立新的动态事件引擎 */
class BossBattleEventBus {
  private listeners = new Set<BossBattleListener>();
  private recentEvents: BossBattleEvent[] = [];

  subscribe(fn: BossBattleListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(events: BossBattleEvent | BossBattleEvent[]): void {
    const list = Array.isArray(events) ? events : [events];
    if (list.length === 0) return;
    this.recentEvents = [...this.recentEvents, ...list].slice(-40);
    for (const e of list) {
      for (const fn of [...this.listeners]) {
        try { fn(e); } catch { /* 监听器异常不影响战斗 */ }
      }
    }
  }

  recent(limit = 20): BossBattleEvent[] {
    return this.recentEvents.slice(-Math.max(0, limit));
  }

  clear(): void {
    this.recentEvents = [];
    this.listeners.clear();
  }
}

export const bossBattleEventBus = new BossBattleEventBus();

// ---------- 工具 ----------

export interface EngineStep {
  run: BossBattleRunState;
  events: BossBattleEvent[];
  ok: boolean;
  reason?: string;
}

let seq = 0;

const int = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const round1 = (v: number): number => Math.round(v * 10) / 10;

function nextId(prefix: string, now: number): string {
  seq = (seq + 1) % 1_000_000;
  return prefix + '@' + Math.max(0, Math.floor(now)) + '-' + seq.toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

function eventOf(
  run: BossBattleRunState,
  type: BossBattleEventType,
  now: number,
  payload: Record<string, unknown> = {},
  phaseId: string | null = run.currentPhaseId,
): BossBattleEvent {
  return {
    id: nextId('evt', now),
    type,
    battleId: run.battleId,
    bossId: run.bossId,
    phaseId,
    at: Math.max(0, Math.floor(now)),
    payload,
  };
}

function cloneRun(run: BossBattleRunState): BossBattleRunState {
  return {
    ...run,
    phaseHistory: run.phaseHistory.map(h => ({ ...h })),
    completedTransitionIds: [...run.completedTransitionIds],
    completedChallenges: [...run.completedChallenges],
    consumedEventIds: [...run.consumedEventIds],
    stats: { ...run.stats },
    transition: run.transition ? { ...run.transition } : null,
  };
}

const unchanged = (run: BossBattleRunState, reason?: string): EngineStep => ({ run, events: [], ok: false, reason });

// ---------- 查询 ----------

export function phaseCount(plan: BossPhasePlan): number {
  return plan.phases.length;
}

/** 血量百分比（0~100，保留 1 位小数） */
export function hpPercentOf(run: BossBattleRunState): number {
  if (!(run.maxHp > 0)) return 0;
  return round1(clamp((run.hp / run.maxHp) * 100, 0, 100));
}

/** 某阶段占用血量段的上界（进入该阶段时的血量） */
export function phaseHpUpper(plan: BossPhasePlan, index: number): number {
  let consumed = 0;
  for (let i = 0; i < index && i < plan.phases.length; i++) consumed += plan.phases[i].maxHp;
  return Math.max(0, plan.totalHp - consumed);
}

/** 某阶段在整场战斗中的本地血量视图 */
export function phaseHpView(plan: BossPhasePlan, run: BossBattleRunState, index = run.currentPhaseIndex): { current: number; max: number } {
  const phase = plan.phases[clamp(index, 0, plan.phases.length - 1)];
  if (!phase) return { current: 0, max: 0 };
  const upper = phaseHpUpper(plan, index);
  const current = clamp(run.hp - (upper - phase.maxHp), 0, phase.maxHp);
  return { current: Math.floor(current), max: phase.maxHp };
}

/** 根据当前血量推算应处阶段（阈值向下取整，保证 75% 恰好进入第二阶段） */
export function phaseIndexForHp(plan: BossPhasePlan, hp: number): number {
  if (plan.phases.length === 0) return 0;
  const pct = plan.totalHp > 0 ? (clamp(hp, 0, plan.totalHp) / plan.totalHp) * 100 : 0;
  let index = 0;
  for (let i = 1; i < plan.phases.length; i++) {
    if (pct <= plan.phases[i].hpThreshold + 1e-9) index = i;
    else break;
  }
  return index;
}

// ---------- 创建 / 生命周期 ----------

export function createBossPhaseRun(plan: BossPhasePlan, now: number, opts: { battleId?: string; hp?: number } = {}): BossBattleRunState {
  const totalHp = Math.max(0, Math.floor(plan.totalHp));
  const hp = clamp(typeof opts.hp === 'number' && isFinite(opts.hp) ? Math.floor(opts.hp) : totalHp, 0, totalHp);
  const first = plan.phases[0];
  return {
    battleId: opts.battleId || nextId('battle', now),
    bossId: plan.bossId,
    bossName: plan.bossName,
    difficulty: plan.difficulty,
    status: 'idle',
    startedAt: 0,
    endedAt: null,
    hp,
    maxHp: totalHp,
    currentPhaseId: first ? first.phaseId : '',
    currentPhaseIndex: 0,
    phaseHistory: [],
    transition: null,
    completedTransitionIds: [],
    completedChallenges: [],
    consumedEventIds: [],
    stats: {
      damageDealt: 0,
      damageReceived: 0,
      challengeAttempts: 0,
      challengeSuccesses: 0,
      challengeFailures: 0,
      phaseTransitions: 0,
    },
    battleResult: null,
    updatedAt: Math.max(0, Math.floor(now)),
  };
}

/** idle → preparing（幂等：已开始则原样返回） */
export function prepareBattle(run: BossBattleRunState, now: number): EngineStep {
  if (run.status === 'preparing') return { run, events: [], ok: true };
  if (run.status !== 'idle') return unchanged(run, '当前状态不能进入准备阶段');
  return { run: { ...run, status: 'preparing', updatedAt: now }, events: [], ok: true };
}

/** preparing → active；写入开始时间与第一阶段历史 */
export function activateBattle(run: BossBattleRunState, plan: BossPhasePlan, now: number): EngineStep {
  if (run.status === 'active') return { run, events: [], ok: true };
  if (run.status !== 'preparing') return unchanged(run, '当前状态不能开始战斗');
  if (run.hp <= 0) return unchanged(run, 'Boss 血量已归零，不能重新进入战斗');

  const phase = plan.phases[run.currentPhaseIndex] || plan.phases[0];
  const history = run.phaseHistory.some(h => h.phaseId === phase.phaseId && h.exitedAt === null)
    ? run.phaseHistory
    : [...run.phaseHistory, { phaseId: phase.phaseId, phaseIndex: run.currentPhaseIndex, enteredAt: now, exitedAt: null, trigger: 'battle-start' as const }];

  const next: BossBattleRunState = {
    ...run,
    status: 'active',
    startedAt: run.startedAt > 0 ? run.startedAt : now,
    endedAt: null,
    battleResult: null,
    transition: null,
    phaseHistory: history,
    updatedAt: now,
  };
  return {
    run: next,
    ok: true,
    events: [
      eventOf(next, BOSS_BATTLE_EVENTS.STARTED, now, { bossName: next.bossName, difficulty: next.difficulty }, phase.phaseId),
      eventOf(next, BOSS_BATTLE_EVENTS.PHASE_STARTED, now, { phaseIndex: run.currentPhaseIndex, phaseName: phase.phaseName, reason: 'battle-start' }, phase.phaseId),
    ],
  };
}

/** 便捷：创建并立即开始（idle → preparing → active） */
export function startBossPhaseRun(plan: BossPhasePlan, now: number, opts: { battleId?: string; hp?: number } = {}): EngineStep {
  const created = createBossPhaseRun(plan, now, opts);
  const prepared = prepareBattle(created, now);
  return activateBattle(prepared.run, plan, now);
}

/** 通用状态转换（仅供恢复 / 测试使用；阶段切换走专用函数） */
export function transitionBattleStatus(run: BossBattleRunState, to: BossBattleStatus, now: number): EngineStep {
  if (!canTransition(run.status, to)) return unchanged(run, '非法状态转换：' + run.status + ' → ' + to);
  const next: BossBattleRunState = { ...run, status: to, updatedAt: now };
  const events: BossBattleEvent[] = [];
  if (to === 'victory' || to === 'defeat') {
    next.endedAt = now;
    next.battleResult = to;
    events.push(eventOf(next, to === 'victory' ? BOSS_BATTLE_EVENTS.VICTORY : BOSS_BATTLE_EVENTS.DEFEAT, now, { hp: next.hp }));
  } else if (to === 'interrupted') {
    next.endedAt = now;
    next.battleResult = 'interrupted';
    events.push(eventOf(next, BOSS_BATTLE_EVENTS.INTERRUPTED, now, { hp: next.hp }));
  }
  return { run: next, events, ok: true };
}

/** 战斗胜利 / 失败（幂等：已终结直接返回） */
export function finishBattle(run: BossBattleRunState, result: 'victory' | 'defeat', now: number): EngineStep {
  if (isTerminalStatus(run.status)) return { run, events: [], ok: false, reason: '战斗已结束' };
  if (run.status !== 'active' && run.status !== 'phase_transition') return unchanged(run, '当前状态不能结算战斗');
  return transitionBattleStatus(run, result, now);
}

/** 战斗中断（撤退 / 退出 / 异常）：幂等 */
export function interruptBattle(run: BossBattleRunState, now: number, reason = '战斗中断'): EngineStep {
  if (isTerminalStatus(run.status)) return unchanged(run, '战斗已结束');
  if (run.status === 'interrupted') return { run, events: [], ok: true };
  if (run.status === 'idle') return unchanged(run, '战斗尚未开始');
  const next: BossBattleRunState = {
    ...run,
    status: 'interrupted',
    endedAt: now,
    battleResult: 'interrupted',
    transition: null,
    updatedAt: now,
  };
  return {
    run: next,
    ok: true,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.INTERRUPTED, now, { reason, hp: next.hp })],
  };
}

/**
 * 从存档恢复：interrupted → active。
 * 终止 / 死亡状态不允许恢复，防止「Boss 已死亡却继续攻击」。
 */
export function resumeBattle(run: BossBattleRunState, plan: BossPhasePlan, now: number, hp?: number): EngineStep {
  if (run.status === 'victory' || run.status === 'defeat') return unchanged(run, '战斗已结束，不能恢复');
  const safeHp = typeof hp === 'number' && isFinite(hp) ? clamp(Math.floor(hp), 0, run.maxHp) : run.hp;
  if (safeHp <= 0) {
    const dead = { ...run, hp: 0, status: 'victory' as const, endedAt: now, battleResult: 'victory' as const, updatedAt: now };
    return { run: dead, ok: true, events: [eventOf(dead, BOSS_BATTLE_EVENTS.VICTORY, now, { recovered: true })] };
  }
  const healed = reconcileBossPhaseRun(run, plan, { hp: safeHp, maxHp: run.maxHp }, now);
  if (healed.status === 'victory') return { run: healed, events: [], ok: true };
  const current = plan.phases[healed.currentPhaseIndex];
  const history = healed.phaseHistory.some(h => h.phaseId === current.phaseId && h.exitedAt === null)
    ? healed.phaseHistory
    : [...healed.phaseHistory, { phaseId: current.phaseId, phaseIndex: healed.currentPhaseIndex, enteredAt: now, exitedAt: null, trigger: 'resume' as const }];
  const next: BossBattleRunState = {
    ...healed,
    status: 'active',
    endedAt: null,
    battleResult: null,
    transition: null,
    phaseHistory: history,
    updatedAt: now,
  };
  return {
    run: next,
    ok: true,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.RESUMED, now, { hp: next.hp, phaseIndex: next.currentPhaseIndex })],
  };
}

// ---------- 阶段切换 ----------

function triggerSatisfied(trigger: BossPhaseTrigger, ctx: { hpPct: number; completedChallenges: string[]; eventIds: string[] }): boolean {
  switch (trigger.kind) {
    case 'hp-threshold':
      return ctx.hpPct <= (typeof trigger.threshold === 'number' && isFinite(trigger.threshold) ? trigger.threshold : 0) + 1e-9;
    case 'challenge-complete':
      return !!trigger.challengeId && ctx.completedChallenges.includes(trigger.challengeId);
    case 'special-event':
      return !!trigger.eventId && ctx.eventIds.includes(trigger.eventId);
    case 'composite':
      return Array.isArray(trigger.all) && trigger.all.length > 0 && trigger.all.every(t => triggerSatisfied(t, ctx));
    default:
      return false;
  }
}

/** 阶段条件：默认 HP 阈值；显式 trigger 与 HP 阈值取“或”，composite 只按组合条件判定 */
function phaseConditionSatisfied(phase: BossPhaseConfig, ctx: { hpPct: number; completedChallenges: string[]; eventIds: string[] }): boolean {
  const byHp = ctx.hpPct <= phase.hpThreshold + 1e-9;
  if (!phase.trigger) return byHp;
  const explicit = triggerSatisfied(phase.trigger, ctx);
  return phase.trigger.kind === 'composite' ? explicit : byHp || explicit;
}

export interface PhaseTriggerContext {
  hp: number;
  maxHp: number;
  completedChallenges?: string[];
  eventIds?: string[];
}

/**
 * 检测并开始阶段切换：选中「满足条件的最高阶段」，一次跨越多个阈值也不会连续执行。
 * 正在进行 phase_transition / 已终结 / 无满足条件时原样返回。
 */
export function evaluatePhaseTransition(
  run: BossBattleRunState,
  plan: BossPhasePlan,
  ctx: PhaseTriggerContext,
  now: number,
): EngineStep {
  if (run.status !== 'active') return unchanged(run, '当前状态不能切换阶段');
  if (run.transition) return unchanged(run, '阶段切换正在进行');
  const maxHp = run.maxHp > 0 ? run.maxHp : plan.totalHp;
  const hp = clamp(ctx.hp, 0, maxHp);
  if (hp <= 0) return unchanged(run, 'Boss 血量已归零');
  const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const completed = [...new Set([...(ctx.completedChallenges || []), ...run.completedChallenges])];
  const eventIds = [...new Set([...(ctx.eventIds || []), ...run.consumedEventIds])];

  let target = run.currentPhaseIndex;
  for (let i = run.currentPhaseIndex + 1; i < plan.phases.length; i++) {
    if (phaseConditionSatisfied(plan.phases[i], { hpPct, completedChallenges: completed, eventIds })) target = i;
    else break;
  }
  if (target <= run.currentPhaseIndex) return unchanged(run, '没有满足条件的下一阶段');

  const from = plan.phases[run.currentPhaseIndex];
  const to = plan.phases[target];
  const transitionId = nextId('transition', now);
  const history = run.phaseHistory.map(h => h.phaseId === from.phaseId && h.exitedAt === null ? { ...h, exitedAt: now } : h);
  const next: BossBattleRunState = {
    ...run,
    status: 'phase_transition',
    hp,
    transition: {
      id: transitionId,
      fromPhaseId: from.phaseId,
      toPhaseId: to.phaseId,
      fromIndex: run.currentPhaseIndex,
      toIndex: target,
      reason: 'hp-threshold',
      startedAt: now,
      completedAt: null,
    },
    phaseHistory: history,
    consumedEventIds: eventIds,
    stats: { ...run.stats, phaseTransitions: run.stats.phaseTransitions + 1 },
    updatedAt: now,
  };
  return {
    run: next,
    ok: true,
    events: [
      eventOf(next, BOSS_BATTLE_EVENTS.PHASE_COMPLETED, now, { phaseIndex: run.currentPhaseIndex, phaseId: from.phaseId, phaseName: from.phaseName }, from.phaseId),
      eventOf(next, BOSS_BATTLE_EVENTS.PHASE_TRANSITION, now, {
        transitionId, fromIndex: run.currentPhaseIndex, toIndex: target, toPhaseName: to.phaseName,
      }, to.phaseId),
    ],
  };
}

function applyHpPolicy(run: BossBattleRunState, plan: BossPhasePlan, toIndex: number): number {
  const policy = plan.phases[toIndex].hpPolicy || plan.defaultHpPolicy;
  const upper = phaseHpUpper(plan, toIndex);
  if (policy === 'restore') {
    // 明确配置的「固定恢复」：恢复到满血（只允许在 Boss 配置显式声明时使用）
    return run.maxHp;
  }
  if (policy === 'independent') {
    // 新阶段拥有独立血量段：进入时把本段补满（上界），不改变总血量结构
    return clamp(Math.max(run.hp, upper), 0, run.maxHp);
  }
  // inherit：保留整体战斗进度，绝不无条件回血；同时不允许超过本阶段血量上界
  return clamp(Math.min(run.hp, upper), 0, run.maxHp);
}

/**
 * 完成阶段切换：初始化目标阶段（幂等）。
 * 同一个 transitionId 重复调用不会重复初始化；interrupted 状态不会执行。
 */
export function completePhaseTransition(run: BossBattleRunState, plan: BossPhasePlan, now: number): EngineStep {
  const t = run.transition;
  if (!t) return unchanged(run, '没有待完成的阶段切换');
  if (t.completedAt != null || run.completedTransitionIds.includes(t.id)) {
    const settled = { ...run, transition: null, status: run.status === 'phase_transition' ? 'active' as const : run.status };
    return { run: settled, events: [], ok: true };
  }
  if (run.status !== 'phase_transition') return unchanged(run, '当前状态不能完成阶段切换');

  const toIndex = clamp(t.toIndex, 0, plan.phases.length - 1);
  const target = plan.phases[toIndex];
  const skippedHistory: BossPhaseHistoryEntry[] = [];
  for (let i = run.currentPhaseIndex + 1; i < toIndex; i++) {
    const p = plan.phases[i];
    skippedHistory.push({ phaseId: p.phaseId, phaseIndex: i, enteredAt: now, exitedAt: now, trigger: 'hp-threshold' });
  }

  const hpAfter = applyHpPolicy(run, plan, toIndex);
  const completedIds = [...run.completedTransitionIds, t.id].slice(-32);
  const next: BossBattleRunState = {
    ...run,
    hp: hpAfter,
    status: 'active',
    currentPhaseId: target.phaseId,
    currentPhaseIndex: toIndex,
    transition: null,
    completedTransitionIds: completedIds,
    phaseHistory: [
      ...run.phaseHistory,
      ...skippedHistory,
      { phaseId: target.phaseId, phaseIndex: toIndex, enteredAt: now, exitedAt: null, trigger: 'hp-threshold' },
    ],
    updatedAt: now,
  };
  return {
    run: next,
    ok: true,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.PHASE_STARTED, now, {
      phaseIndex: toIndex, phaseName: target.phaseName, hp: hpAfter,
    }, target.phaseId)],
  };
}

/** 强行指定阶段（仅 DEV 测试入口使用，不产生奖励、不写存档） */
export function forcePhaseForDev(run: BossBattleRunState, plan: BossPhasePlan, index: number, now: number): EngineStep {
  const toIndex = clamp(Math.floor(index), 0, plan.phases.length - 1);
  const target = plan.phases[toIndex];
  const hp = clamp(phaseHpUpper(plan, toIndex), 1, run.maxHp);
  const next: BossBattleRunState = {
    ...run,
    status: 'active',
    hp,
    currentPhaseId: target.phaseId,
    currentPhaseIndex: toIndex,
    transition: null,
    endedAt: null,
    battleResult: null,
    phaseHistory: [...run.phaseHistory, { phaseId: target.phaseId, phaseIndex: toIndex, enteredAt: now, exitedAt: null, trigger: 'battle-start' }],
    updatedAt: now,
  };
  return { run: next, events: [], ok: true };
}

/** 直接设置血量（仅 DEV 测试入口使用；不写存档、不发奖励） */
export function setHpForDev(run: BossBattleRunState, plan: BossPhasePlan, hp: number, now: number): EngineStep {
  const value = clamp(typeof hp === 'number' && isFinite(hp) ? Math.floor(hp) : run.hp, 0, plan.totalHp);
  const index = phaseIndexForHp(plan, value);
  const target = plan.phases[index];
  const dead = value <= 0;
  const next: BossBattleRunState = {
    ...run,
    hp: value,
    status: dead ? 'victory' : 'active',
    endedAt: dead ? now : null,
    battleResult: dead ? 'victory' : null,
    transition: null,
    currentPhaseId: target.phaseId,
    currentPhaseIndex: index,
    updatedAt: now,
  };
  return { run: next, events: [], ok: true };
}

// ---------- HP / 伤害 ----------

/**
 * 结算 Boss 受到的伤害：
 * - 负伤害 / NaN 视为 0；超过当前血量部分被 clamp；
 * - HP 归零自动结算胜利（防止 Boss 已死亡却继续攻击）；
 * - 返回实际造成的伤害，供记录使用。
 */
export function applyDamage(run: BossBattleRunState, damage: number, now: number): EngineStep {
  if (run.status !== 'active' && run.status !== 'phase_transition') return unchanged(run, '当前状态不能结算伤害');
  const amount = typeof damage === 'number' && isFinite(damage) ? Math.max(0, Math.floor(damage)) : 0;
  if (amount <= 0) return { run, events: [], ok: true };
  const actual = Math.min(amount, run.hp);
  const hpAfter = clamp(run.hp - actual, 0, run.maxHp);
  let next: BossBattleRunState = {
    ...run,
    hp: hpAfter,
    stats: { ...run.stats, damageDealt: run.stats.damageDealt + actual },
    updatedAt: now,
  };
  const events: BossBattleEvent[] = [eventOf(next, BOSS_BATTLE_EVENTS.DAMAGE_DEALT, now, { amount: actual, hpAfter })];
  if (hpAfter <= 0 && !isTerminalStatus(next.status)) {
    const finished = finishBattle(next, 'victory', now);
    next = finished.run;
    events.push(...finished.events);
  }
  return { run: next, events, ok: true };
}

/** Boss 反击（记录用；玩家意识值由现有系统结算） */
export function recordDamageReceived(run: BossBattleRunState, amount: number, now: number): EngineStep {
  const dmg = typeof amount === 'number' && isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  if (dmg <= 0) return { run, events: [], ok: true };
  const next = { ...run, stats: { ...run.stats, damageReceived: run.stats.damageReceived + dmg }, updatedAt: now };
  return { run: next, events: [eventOf(next, BOSS_BATTLE_EVENTS.DAMAGE_RECEIVED, now, { amount: dmg })], ok: true };
}

// ---------- 挑战统计 ----------

export function recordChallengeStart(run: BossBattleRunState, challengeId: string, now: number): EngineStep {
  if (run.status !== 'active') return unchanged(run, '当前状态不能开始挑战');
  const next = { ...run, stats: { ...run.stats, challengeAttempts: run.stats.challengeAttempts + 1 }, updatedAt: now };
  return {
    run: next,
    ok: true,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.CHALLENGE_STARTED, now, { challengeId })],
  };
}

export function recordChallengeResult(run: BossBattleRunState, challengeId: string, success: boolean, now: number): EngineStep {
  const stats: BossBattleStats = {
    ...run.stats,
    challengeSuccesses: run.stats.challengeSuccesses + (success ? 1 : 0),
    challengeFailures: run.stats.challengeFailures + (success ? 0 : 1),
  };
  const completedChallenges = success && !run.completedChallenges.includes(challengeId)
    ? [...run.completedChallenges, challengeId]
    : run.completedChallenges;
  const next = { ...run, stats, completedChallenges, updatedAt: now };
  return {
    run: next,
    ok: true,
    events: [eventOf(next, BOSS_BATTLE_EVENTS.CHALLENGE_COMPLETED, now, { challengeId, success })],
  };
}

// ---------- 记录 / 进度 ----------

/** 已终结的战斗转换为历史记录（B.5 评价读取入口；grade 预留） */
export function toBattleRecord(run: BossBattleRunState): BossBattleRecord | null {
  if (!run.endedAt || !run.battleResult) return null;
  return { ...cloneRun(run), endedAt: run.endedAt, battleResult: run.battleResult, grade: null };
}

export function phaseProgressOf(run: BossBattleRunState): BossPhaseProgress {
  const cleared = run.status === 'victory'
    ? [...new Set(run.phaseHistory.map(h => h.phaseId))]
    : [...new Set(run.phaseHistory.filter(h => h.exitedAt != null).map(h => h.phaseId))];
  return {
    highestPhaseIndex: Math.max(0, run.currentPhaseIndex),
    clearedPhases: cleared,
    updatedAt: run.updatedAt,
  };
}

// ---------- 自愈 / 规范化 ----------

function normalizeHistory(raw: unknown, plan: BossPhasePlan): BossPhaseHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(plan.phases.map(p => [p.phaseId, p]));
  const out: BossPhaseHistoryEntry[] = [];
  for (const item of raw.slice(-64)) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Partial<BossPhaseHistoryEntry>;
    const phase = byId.get(String(r.phaseId || ''));
    if (!phase) continue;
    out.push({
      phaseId: phase.phaseId,
      phaseIndex: phase.phaseIndex,
      enteredAt: int(r.enteredAt),
      exitedAt: typeof r.exitedAt === 'number' && isFinite(r.exitedAt) ? Math.max(0, Math.floor(r.exitedAt)) : null,
      trigger: r.trigger === 'challenge-complete' || r.trigger === 'special-event' || r.trigger === 'composite' || r.trigger === 'resume'
        ? r.trigger
        : r.trigger === 'battle-start' ? 'battle-start' : 'hp-threshold',
    });
  }
  return out;
}

function normalizeTransition(raw: unknown, plan: BossPhasePlan): BossPhaseTransition | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BossPhaseTransition>;
  const fromIndex = clamp(int(r.fromIndex), 0, plan.phases.length - 1);
  const toIndex = clamp(int(r.toIndex), 0, plan.phases.length - 1);
  if (toIndex <= fromIndex) return null;
  const id = typeof r.id === 'string' && r.id ? r.id : nextId('transition', int(r.startedAt));
  return {
    id,
    fromPhaseId: plan.phases[fromIndex].phaseId,
    toPhaseId: plan.phases[toIndex].phaseId,
    fromIndex,
    toIndex,
    reason: r.reason === 'challenge-complete' || r.reason === 'special-event' || r.reason === 'composite' ? r.reason : 'hp-threshold',
    startedAt: int(r.startedAt),
    completedAt: typeof r.completedAt === 'number' && isFinite(r.completedAt) ? Math.max(0, Math.floor(r.completedAt)) : null,
  };
}

/**
 * 存档自愈：任何非法 / 越界 / 已结束数据都退化为安全状态。
 * 若血量已经跨过阈值（例如刷新时错过了演出），静默推进到正确阶段，绝不重复初始化。
 */
export function normalizeBossPhaseRun(raw: unknown, plan: BossPhasePlan, now: number): BossBattleRunState | null {
  if (!raw || typeof raw !== 'object' || plan.phases.length === 0) return null;
  const r = raw as Partial<BossBattleRunState>;
  if (r.bossId !== undefined && r.bossId !== plan.bossId) return null;
  if (r.difficulty !== undefined && r.difficulty !== plan.difficulty) return null;

  const maxHp = plan.totalHp > 0 ? plan.totalHp : Math.max(1, int(r.maxHp, 1));
  const hp = clamp(typeof r.hp === 'number' && isFinite(r.hp) ? Math.floor(r.hp) : maxHp, 0, maxHp);
  const status: BossBattleStatus =
    r.status === 'idle' || r.status === 'preparing' || r.status === 'active' || r.status === 'phase_transition' ||
    r.status === 'victory' || r.status === 'defeat' || r.status === 'interrupted'
      ? r.status
      : hp <= 0 ? 'victory' : 'active';

  const base = createBossPhaseRun(plan, now, { battleId: typeof r.battleId === 'string' && r.battleId ? r.battleId : undefined, hp });
  const history = normalizeHistory(r.phaseHistory, plan);
  let currentIndex = clamp(int(r.currentPhaseIndex), 0, plan.phases.length - 1);
  const hpIndex = phaseIndexForHp(plan, hp);

  let nextStatus = status;
  if (hp <= 0) nextStatus = 'victory';
  // 血量已经跨过阈值：静默追平（不会再次触发阶段切换）
  if ((nextStatus === 'active' || nextStatus === 'preparing') && hpIndex > currentIndex) currentIndex = hpIndex;

  const transition = nextStatus === 'phase_transition' ? normalizeTransition(r.transition, plan) : null;
  if (nextStatus === 'phase_transition' && !transition) nextStatus = 'active';

  // 只有终结状态才保留 battleResult：避免「已胜利但状态仍是进行中」继续接受攻击
  const battleResult: BossBattleRunState['battleResult'] =
    nextStatus === 'victory' ? 'victory'
      : nextStatus === 'defeat' ? 'defeat'
        : nextStatus === 'interrupted' ? 'interrupted'
          : null;

  const completedTransitionIds = Array.isArray(r.completedTransitionIds)
    ? [...new Set(r.completedTransitionIds.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-32)
    : [];
  const completedChallenges = Array.isArray(r.completedChallenges)
    ? [...new Set(r.completedChallenges.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-64)
    : [];
  const consumedEventIds = Array.isArray(r.consumedEventIds)
    ? [...new Set(r.consumedEventIds.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-32)
    : [];

  const currentPhase = plan.phases[currentIndex];
  if (!history.some(h => h.phaseId === currentPhase.phaseId)) {
    history.push({ phaseId: currentPhase.phaseId, phaseIndex: currentIndex, enteredAt: int(r.startedAt), exitedAt: null, trigger: 'hp-threshold' });
  }

  return {
    ...base,
    status: nextStatus,
    startedAt: int(r.startedAt),
    endedAt: nextStatus === 'victory' || nextStatus === 'defeat' || nextStatus === 'interrupted'
      ? (typeof r.endedAt === 'number' && isFinite(r.endedAt) ? Math.max(0, Math.floor(r.endedAt)) : int(r.updatedAt, now))
      : null,
    hp,
    maxHp,
    currentPhaseId: currentPhase.phaseId,
    currentPhaseIndex: currentIndex,
    phaseHistory: history,
    transition,
    completedTransitionIds,
    completedChallenges,
    consumedEventIds,
    stats: {
      damageDealt: int(r.stats?.damageDealt),
      damageReceived: int(r.stats?.damageReceived),
      challengeAttempts: int(r.stats?.challengeAttempts),
      challengeSuccesses: int(r.stats?.challengeSuccesses),
      challengeFailures: int(r.stats?.challengeFailures),
      phaseTransitions: int(r.stats?.phaseTransitions),
    },
    battleResult,
    updatedAt: int(r.updatedAt, now),
  };
}

export type BossPhasePlanLookup = (bossId: string, difficulty: BossDifficulty) => BossPhasePlan | undefined;

/** 整表自愈：丢弃无法匹配 Boss / 难度的条目，永不抛错 */
export function normalizeBossPhaseRuns(raw: unknown, planFor: BossPhasePlanLookup, now: number): Record<string, BossBattleRunState> {
  const out: Record<string, BossBattleRunState> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const r = value as Partial<BossBattleRunState>;
    const plan = planFor(key, r.difficulty === 'hard' || r.difficulty === 'expert' ? r.difficulty : 'easy');
    if (!plan) continue;
    const run = normalizeBossPhaseRun(value, plan, now);
    if (run) out[key] = run;
  }
  return out;
}

/** 历史记录自愈：只保留已终结记录，按 battleId 去重，最多 20 条 */
export function normalizeBossBattleHistory(raw: unknown, planFor: BossPhasePlanLookup, now: number): BossBattleRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: BossBattleRecord[] = [];
  const seen = new Set<string>();
  for (const item of raw.slice(-40)) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Partial<BossBattleRunState>;
    const bossId = typeof r.bossId === 'string' ? r.bossId : '';
    const plan = bossId ? planFor(bossId, r.difficulty === 'hard' || r.difficulty === 'expert' ? r.difficulty : 'easy') : undefined;
    if (!plan) continue;
    const run = normalizeBossPhaseRun(item, plan, now);
    const record = run ? toBattleRecord(run) : null;
    if (!record || seen.has(record.battleId)) continue;
    seen.add(record.battleId);
    out.push(record);
  }
  return out.slice(-20);
}

/** 阶段进度自愈 */
export function normalizeBossPhaseProgress(raw: unknown): Record<string, BossPhaseProgress> {
  const out: Record<string, BossPhaseProgress> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const r = value as Partial<BossPhaseProgress>;
    out[key] = {
      highestPhaseIndex: int(r.highestPhaseIndex),
      clearedPhases: Array.isArray(r.clearedPhases)
        ? [...new Set(r.clearedPhases.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-16)
        : [],
      updatedAt: int(r.updatedAt),
    };
  }
  return out;
}

/** 用真实战斗血量对账（刷新 / 跨系统同步）；只允许阶段单调前进，不重复初始化 */
export function reconcileBossPhaseRun(
  run: BossBattleRunState,
  plan: BossPhasePlan,
  battle: { hp: number; maxHp: number },
  now: number,
): BossBattleRunState {
  const maxHp = plan.totalHp > 0 ? plan.totalHp : Math.max(1, int(battle.maxHp, 1));
  const hp = clamp(typeof battle.hp === 'number' && isFinite(battle.hp) ? Math.floor(battle.hp) : run.hp, 0, maxHp);
  if (hp <= 0 && !isTerminalStatus(run.status)) {
    const finished = finishBattle({ ...run, hp: 0 }, 'victory', now);
    return finished.run;
  }
  if (isTerminalStatus(run.status)) {
    return run.hp === hp ? run : { ...run, hp, maxHp, updatedAt: now };
  }
  const derived = phaseIndexForHp(plan, hp);
  if (derived > run.currentPhaseIndex) {
    const phase = plan.phases[derived];
    return {
      ...run,
      hp,
      maxHp,
      currentPhaseId: phase.phaseId,
      currentPhaseIndex: derived,
      transition: null,
      status: 'active',
      phaseHistory: [
        ...run.phaseHistory.map(h => h.exitedAt === null ? { ...h, exitedAt: now } : h),
        { phaseId: phase.phaseId, phaseIndex: derived, enteredAt: now, exitedAt: null, trigger: 'hp-threshold' },
      ],
      updatedAt: now,
    };
  }
  return run.hp === hp && run.maxHp === maxHp ? run : { ...run, hp, maxHp, updatedAt: now };
}
