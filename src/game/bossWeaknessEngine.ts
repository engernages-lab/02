// Boss 弱点引擎（V1.3-B.3）：线索 → 分析 → 发现 → 真实破解 → 暴露 → 恢复
//
// 设计约束：
//   1. 纯逻辑 + 可序列化状态：判题仍由 store 调用真实 Python Runner + Judge；
//   2. 线索来自真实战斗事件（B.2 攻击预警 / 命中 / 防御 / 闪避、B.1 阶段、挑战成功）；
//   3. 发现必须满足「线索数量 + 真实分析时间」，不能靠按钮直接解锁；
//   4. 破解尝试次数、暴露计时、冷却、锁定全部持久化并自愈；
//   5. 暴露效果（额外伤害 / 攻击中断 / 禁用模式 / 冷却延长）由配置驱动，不硬编码 Boss。

import type { LevelJudgeSpec } from './types';
import type { BossDifficulty } from './difficulty';
import type { BossAttackType } from './bossAttackEngine';
import {
  BOSS_BATTLE_EVENTS, type BossBattleEvent, type BossBattleEventType,
} from './bossPhaseEngine';

export { BOSS_BATTLE_EVENTS };

export type WeaknessType = 'logic' | 'protocol' | 'data' | 'structure' | 'resource' | 'timing';
export type WeaknessStatus =
  | 'hidden'
  | 'hinted'
  | 'analyzing'
  | 'discovered'
  | 'exploiting'
  | 'exposed'
  | 'recovered'
  | 'locked';

export type ClueSourceKind =
  | 'attack-telegraph'
  | 'attack-result'
  | 'attack-started'
  | 'attack-resolved'
  | 'player-defense'
  | 'player-dodge'
  | 'phase-start'
  | 'challenge-success';

export interface WeaknessClue {
  clueId: string;
  text: string;
  sourceLabel: string;
  trigger: {
    kind: ClueSourceKind;
    attackId?: string;
    attackType?: BossAttackType;
    result?: 'hit' | 'blocked' | 'dodged';
    challengeId?: string;
  };
}

export interface BossWeaknessChallenge {
  id: string;
  title: string;
  goal: string;
  fault: string;
  initialCode: string;
  /** 参考解答（仅测试 / 说明，不展示给玩家） */
  reference: string;
  judge: LevelJudgeSpec;
  hints: [string, string, string];
}

export interface WeaknessRecoveryRule {
  /** 暴露结束后的恢复冷却（毫秒） */
  recoveryCooldownMs: number;
  /** 尝试次数耗尽后的解锁时间（毫秒） */
  lockRecoveryMs: number;
}

export interface BossWeaknessDefinition {
  weaknessId: string;
  bossId: string;
  phaseId: string;
  phaseIndex: number;
  name: string;
  description: string;
  weaknessType: WeaknessType;
  discoveryDifficulty: BossDifficulty;
  clues: WeaknessClue[];
  requiredClues: number;
  analysisDurationMs: number;
  challenge: BossWeaknessChallenge;
  vulnerabilityDuration: number;
  damageMultiplier: number;
  /** Boss 攻击冷却延长倍率（1 = 不延长） */
  attackCooldownBonus: number;
  interruptAttack: boolean;
  disableAttackPatternIds: string[];
  exposureEffects: string[];
  recoveryRule: WeaknessRecoveryRule;
  /** 0 = 不限制 */
  maxAttempts: number;
}

export interface WeaknessEntry {
  weaknessId: string;
  status: WeaknessStatus;
  clues: string[];
  analysisStartedAt: number | null;
  analysisEndsAt: number | null;
  attempts: number;
  successCount: number;
  lastResult: 'success' | 'failure' | null;
  exposedAt: number | null;
  exposedUntil: number | null;
  exposureCount: number;
  cooldownUntil: number | null;
  lockedUntil: number | null;
  lastCrackAt: number | null;
}

export interface BossWeaknessRunState {
  battleId: string;
  bossId: string;
  phaseId: string;
  phaseIndex: number;
  activeWeaknessId: string | null;
  entries: Record<string, WeaknessEntry>;
  /** 弱点暴露期间击破阶段时，额外伤害结转到下一阶段（由 store 消费） */
  pendingCarryDamage: number;
  updatedAt: number;
}

export interface WeaknessObservation {
  kind: ClueSourceKind;
  attackId?: string;
  attackType?: BossAttackType;
  result?: 'hit' | 'blocked' | 'dodged';
  challengeId?: string;
}

export interface WeaknessStep {
  state: BossWeaknessRunState;
  events: BossBattleEvent[];
  changed: boolean;
  ok: boolean;
  reason?: string;
  clue?: WeaknessClue;
  definition?: BossWeaknessDefinition;
}

export const WEAKNESS_STATUS_LABEL: Record<WeaknessStatus, string> = {
  hidden: '未发现',
  hinted: '线索分析中',
  analyzing: '解析中',
  discovered: '弱点已发现',
  exploiting: '破解中',
  exposed: '弱点暴露',
  recovered: '恢复中',
  locked: '暂时封锁',
};

export const WEAKNESS_TYPE_LABEL: Record<WeaknessType, string> = {
  logic: '逻辑漏洞',
  protocol: '协议漏洞',
  data: '数据漏洞',
  structure: '结构漏洞',
  resource: '资源漏洞',
  timing: '时间窗口漏洞',
};

const int = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;

let seq = 0;
function nextId(prefix: string, now: number): string {
  seq = (seq + 1) % 1_000_000;
  return prefix + '@' + Math.max(0, Math.floor(now)) + '-' + seq.toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

function eventOf(
  state: BossWeaknessRunState,
  weaknessId: string,
  type: BossBattleEventType,
  now: number,
  payload: Record<string, unknown> = {},
): BossBattleEvent {
  return {
    id: nextId('wkevt', now),
    type,
    battleId: state.battleId,
    bossId: state.bossId,
    phaseId: state.phaseId,
    weaknessId,
    at: Math.max(0, Math.floor(now)),
    payload,
  };
}

const unchanged = (state: BossWeaknessRunState, reason?: string): WeaknessStep =>
  ({ state, events: [], changed: false, ok: false, reason });

function emptyEntry(weaknessId: string): WeaknessEntry {
  return {
    weaknessId,
    status: 'hidden',
    clues: [],
    analysisStartedAt: null,
    analysisEndsAt: null,
    attempts: 0,
    successCount: 0,
    lastResult: null,
    exposedAt: null,
    exposedUntil: null,
    exposureCount: 0,
    cooldownUntil: null,
    lockedUntil: null,
    lastCrackAt: null,
  };
}

export function definitionsForPhase(defs: BossWeaknessDefinition[], phaseIndex: number): BossWeaknessDefinition[] {
  return defs.filter(d => d.phaseIndex === phaseIndex);
}

export function weaknessById(defs: BossWeaknessDefinition[], weaknessId: string | null): BossWeaknessDefinition | undefined {
  return weaknessId ? defs.find(d => d.weaknessId === weaknessId) : undefined;
}

export function activeWeakness(run: BossWeaknessRunState, defs: BossWeaknessDefinition[]): BossWeaknessDefinition | undefined {
  return weaknessById(defs, run.activeWeaknessId) || definitionsForPhase(defs, run.phaseIndex)[0];
}

export function activeEntry(run: BossWeaknessRunState, defs: BossWeaknessDefinition[]): WeaknessEntry | undefined {
  const def = activeWeakness(run, defs);
  return def ? run.entries[def.weaknessId] : undefined;
}

export function createBossWeaknessRun(
  battleId: string,
  bossId: string,
  phaseId: string,
  phaseIndex: number,
  defs: BossWeaknessDefinition[],
  now: number,
): BossWeaknessRunState {
  const entries: Record<string, WeaknessEntry> = {};
  for (const d of defs) entries[d.weaknessId] = emptyEntry(d.weaknessId);
  const first = definitionsForPhase(defs, phaseIndex)[0];
  return {
    battleId,
    bossId,
    phaseId,
    phaseIndex,
    activeWeaknessId: first ? first.weaknessId : null,
    entries,
    pendingCarryDamage: 0,
    updatedAt: now,
  };
}

/** 阶段同步：旧阶段暴露/破解立即失效，线索保留，新阶段加载自己的弱点 */
export function syncWeaknessPhase(
  run: BossWeaknessRunState,
  defs: BossWeaknessDefinition[],
  phaseId: string,
  phaseIndex: number,
  now: number,
): WeaknessStep {
  if (run.phaseId === phaseId && run.phaseIndex === phaseIndex) return { state: run, events: [], changed: false, ok: true };
  const entries: Record<string, WeaknessEntry> = { ...run.entries };
  for (const d of defs) if (!entries[d.weaknessId]) entries[d.weaknessId] = emptyEntry(d.weaknessId);
  const events: BossBattleEvent[] = [];
  for (const [id, entry] of Object.entries(entries)) {
    if (entry.status === 'exposed' || entry.status === 'exploiting' || entry.status === 'analyzing') {
      entries[id] = {
        ...entry,
        status: 'recovered',
        exposedUntil: now,
        analysisEndsAt: null,
        cooldownUntil: now,
      };
      events.push(eventOf(run, id, BOSS_BATTLE_EVENTS.WEAKNESS_CANCELLED, now, { reason: 'phase-change' }));
    }
  }
  const nextDef = definitionsForPhase(defs, phaseIndex)[0];
  const next: BossWeaknessRunState = {
    ...run,
    phaseId,
    phaseIndex,
    activeWeaknessId: nextDef ? nextDef.weaknessId : null,
    entries,
    updatedAt: now,
  };
  return { state: next, events, changed: true, ok: true };
}

function clueMatches(clue: WeaknessClue, obs: WeaknessObservation): boolean {
  const t = clue.trigger;
  if (t.kind !== obs.kind) return false;
  if (t.attackId && t.attackId !== obs.attackId) return false;
  if (t.attackType && t.attackType !== obs.attackType) return false;
  if (t.result && t.result !== obs.result) return false;
  if (t.challengeId && t.challengeId !== obs.challengeId) return false;
  return true;
}

/** 观察战斗事件并解锁线索（去重；只针对当前阶段弱点） */
export function observeWeakness(
  run: BossWeaknessRunState,
  defs: BossWeaknessDefinition[],
  obs: WeaknessObservation,
  now: number,
): WeaknessStep {
  const phaseDefs = definitionsForPhase(defs, run.phaseIndex);
  if (phaseDefs.length === 0) return unchanged(run, '当前阶段没有弱点配置');
  const entries: Record<string, WeaknessEntry> = { ...run.entries };
  const events: BossBattleEvent[] = [];
  const discoveredClues: WeaknessClue[] = [];
  for (const def of phaseDefs) {
    const entry = entries[def.weaknessId] || emptyEntry(def.weaknessId);
    const matched: WeaknessClue[] = [];
    for (const clue of def.clues) {
      if (entry.clues.includes(clue.clueId)) continue;
      if (clueMatches(clue, obs)) matched.push(clue);
    }
    if (matched.length === 0) continue;
    const clues = [...entry.clues, ...matched.map(c => c.clueId)];
    const status: WeaknessStatus = entry.status === 'hidden' || entry.status === 'hinted' ? 'hinted' : entry.status;
    entries[def.weaknessId] = { ...entry, clues, status, updatedAt: now } as WeaknessEntry;
    for (const clue of matched) {
      discoveredClues.push(clue);
      events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_HINT, now, {
        clueId: clue.clueId,
        text: clue.text,
        source: clue.sourceLabel,
        clueCount: clues.length,
        requiredClues: def.requiredClues,
      }));
    }
  }
  if (discoveredClues.length === 0) return unchanged(run, '没有新线索');
  const next = { ...run, entries, updatedAt: now };
  return { state: next, events, changed: true, ok: true, clue: discoveredClues[0] };
}

/** 达到所需线索后，玩家启动真实分析（需要时间，不能直接解锁） */
export function startAnalysis(run: BossWeaknessRunState, defs: BossWeaknessDefinition[], now: number): WeaknessStep {
  const def = activeWeakness(run, defs);
  const entry = def ? run.entries[def.weaknessId] : undefined;
  if (!def || !entry) return unchanged(run, '没有可分析的弱点');
  if (entry.status === 'analyzing') return unchanged(run, '正在分析');
  if (entry.status !== 'hinted' && entry.status !== 'hidden') return unchanged(run, '当前状态不能分析');
  if (entry.clues.length < def.requiredClues) {
    return unchanged(run, '线索不足（' + entry.clues.length + '/' + def.requiredClues + '）');
  }
  const entries = {
    ...run.entries,
    [def.weaknessId]: {
      ...entry,
      status: 'analyzing' as const,
      analysisStartedAt: now,
      analysisEndsAt: now + Math.max(300, def.analysisDurationMs),
      updatedAt: now,
    } as WeaknessEntry,
  };
  const next = { ...run, entries, updatedAt: now };
  return {
    state: next,
    events: [eventOf(next, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_HINT, now, {
      phase: 'analyzing', analysisEndsAt: entries[def.weaknessId].analysisEndsAt,
    })],
    changed: true,
    ok: true,
    definition: def,
  };
}

/** 推进分析 / 暴露恢复 / 冷却 / 封锁解锁；无变化不写存档 */
export function tickWeakness(run: BossWeaknessRunState, defs: BossWeaknessDefinition[], now: number): WeaknessStep {
  const def = activeWeakness(run, defs);
  const entry = def ? run.entries[def.weaknessId] : undefined;
  if (!def || !entry) return unchanged(run, '没有弱点状态');
  const events: BossBattleEvent[] = [];
  let nextEntry: WeaknessEntry = entry;
  let changed = false;

  if (entry.status === 'analyzing' && entry.analysisEndsAt != null && now >= entry.analysisEndsAt) {
    if (entry.clues.length < def.requiredClues) {
      nextEntry = { ...entry, status: 'hinted', analysisEndsAt: null };
    } else {
      nextEntry = { ...entry, status: 'discovered', analysisEndsAt: null };
      events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_ANALYZED, now, { requiredClues: def.requiredClues }));
      events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_DISCOVERED, now, {
        name: def.name, weaknessType: def.weaknessType,
      }));
    }
    changed = true;
  } else if (entry.status === 'exposed' && entry.exposedUntil != null && now >= entry.exposedUntil) {
    nextEntry = {
      ...entry,
      status: 'recovered',
      exposedUntil: now,
      cooldownUntil: now + Math.max(0, def.recoveryRule.recoveryCooldownMs),
    };
    events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_RECOVERED, now, { reason: 'expired' }));
    changed = true;
  } else if (entry.status === 'recovered' && entry.cooldownUntil != null && now >= entry.cooldownUntil) {
    nextEntry = { ...entry, status: 'discovered', cooldownUntil: null };
    changed = true;
  } else if (entry.status === 'locked' && entry.lockedUntil != null && now >= entry.lockedUntil) {
    nextEntry = { ...entry, status: 'discovered', lockedUntil: null };
    changed = true;
  }

  if (!changed) return { state: run, events: [], changed: false, ok: true };
  const entries = { ...run.entries, [def.weaknessId]: nextEntry };
  const next = { ...run, entries, updatedAt: now };
  return { state: next, events, changed: true, ok: true, definition: def };
}

/** 开始破解：真实尝试次数在提交前 +1（刷新不会退还） */
export function beginWeaknessCrack(run: BossWeaknessRunState, defs: BossWeaknessDefinition[], now: number): WeaknessStep {
  const def = activeWeakness(run, defs);
  const entry = def ? run.entries[def.weaknessId] : undefined;
  if (!def || !entry) return unchanged(run, '没有可破解的弱点');
  if (entry.status === 'exposed') return unchanged(run, '弱点已暴露，无需重复破解');
  if (entry.status === 'exploiting') return unchanged(run, '破解正在进行');
  if (entry.status === 'locked') return unchanged(run, '破解次数已耗尽，请等待封锁解除');
  if (entry.status !== 'discovered' && entry.status !== 'recovered') return unchanged(run, '弱点尚未发现');
  if (def.maxAttempts > 0 && entry.attempts >= def.maxAttempts) {
    return unchanged(run, '破解次数已耗尽');
  }
  const entries = {
    ...run.entries,
    [def.weaknessId]: {
      ...entry,
      status: 'exploiting' as const,
      attempts: entry.attempts + 1,
      lastCrackAt: now,
      updatedAt: now,
    } as WeaknessEntry,
  };
  const next = { ...run, entries, updatedAt: now };
  return {
    state: next,
    events: [eventOf(next, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_STARTED, now, {
      attempts: entry.attempts + 1, maxAttempts: def.maxAttempts,
    })],
    changed: true,
    ok: true,
    definition: def,
  };
}

/**
 * 完成破解：只有 exploiting 状态可结算（幂等）；
 * 成功 → exposed；失败 → discovered 或 locked（真实尝试次数耗尽）。
 */
export function completeWeaknessCrack(
  run: BossWeaknessRunState,
  defs: BossWeaknessDefinition[],
  success: boolean,
  now: number,
): WeaknessStep {
  const def = activeWeakness(run, defs);
  const entry = def ? run.entries[def.weaknessId] : undefined;
  if (!def || !entry) return unchanged(run, '没有可破解的弱点');
  if (entry.status !== 'exploiting') return unchanged(run, '没有进行中的破解');
  const events: BossBattleEvent[] = [];
  let nextEntry: WeaknessEntry;
  if (success) {
    nextEntry = {
      ...entry,
      status: 'exposed',
      lastResult: 'success',
      successCount: entry.successCount + 1,
      exposureCount: entry.exposureCount + 1,
      exposedAt: now,
      exposedUntil: now + Math.max(1000, def.vulnerabilityDuration),
      cooldownUntil: null,
      analysisEndsAt: null,
    };
    events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_SUCCESS, now, {
      attempts: entry.attempts, exposureDuration: def.vulnerabilityDuration,
    }));
    events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_EXPOSED, now, {
      exposedUntil: nextEntry.exposedUntil,
      damageMultiplier: def.damageMultiplier,
      attackCooldownBonus: def.attackCooldownBonus,
      disabledPatterns: def.disableAttackPatternIds,
      effects: def.exposureEffects,
    }));
    events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_EFFECT_APPLIED, now, {
      damageMultiplier: def.damageMultiplier,
      attackCooldownBonus: def.attackCooldownBonus,
      interruptAttack: def.interruptAttack,
      disabledPatterns: def.disableAttackPatternIds,
    }));
  } else {
    const exhausted = def.maxAttempts > 0 && entry.attempts >= def.maxAttempts;
    nextEntry = {
      ...entry,
      status: exhausted ? 'locked' : 'discovered',
      lastResult: 'failure',
      lockedUntil: exhausted ? now + Math.max(1000, def.recoveryRule.lockRecoveryMs) : null,
      cooldownUntil: null,
      analysisEndsAt: null,
    };
    events.push(eventOf(run, def.weaknessId, BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_FAILED, now, {
      attempts: entry.attempts, maxAttempts: def.maxAttempts, locked: exhausted,
    }));
  }
  const entries = { ...run.entries, [def.weaknessId]: nextEntry };
  const next = { ...run, entries, updatedAt: now };
  return { state: next, events, changed: true, ok: true, definition: def };
}

/** 失败但非判题（超时/安全拦截）也走同一失败流程 */
export function failWeaknessCrack(
  run: BossWeaknessRunState,
  defs: BossWeaknessDefinition[],
  reason: string,
  now: number,
): WeaknessStep {
  const step = completeWeaknessCrack(run, defs, false, now);
  if (!step.changed) return step;
  return { ...step, reason };
}

export interface WeaknessExposureInfo {
  active: boolean;
  definition?: BossWeaknessDefinition;
  entry?: WeaknessEntry;
  remainingMs: number;
  damageMultiplier: number;
  attackCooldownBonus: number;
  interruptAttack: boolean;
  disabledPatternIds: string[];
}

export function exposureInfo(run: BossWeaknessRunState, defs: BossWeaknessDefinition[], now: number): WeaknessExposureInfo {
  const def = activeWeakness(run, defs);
  const entry = def ? run.entries[def.weaknessId] : undefined;
  const active = !!def && !!entry && entry.status === 'exposed' && entry.exposedUntil != null && now < entry.exposedUntil;
  return {
    active,
    definition: def,
    entry,
    remainingMs: active && entry && entry.exposedUntil != null ? Math.max(0, entry.exposedUntil - now) : 0,
    damageMultiplier: active && def ? def.damageMultiplier : 1,
    attackCooldownBonus: active && def ? def.attackCooldownBonus : 1,
    interruptAttack: !!def && def.interruptAttack,
    disabledPatternIds: active && def ? [...def.disableAttackPatternIds] : [],
  };
}

export function setCarryDamage(run: BossWeaknessRunState, amount: number, now: number): BossWeaknessRunState {
  const value = Math.max(0, Math.floor(amount));
  if (value <= 0) return run;
  return { ...run, pendingCarryDamage: Math.max(run.pendingCarryDamage, value), updatedAt: now };
}

export function consumeCarryDamage(run: BossWeaknessRunState, now: number): { state: BossWeaknessRunState; amount: number } {
  const amount = Math.max(0, run.pendingCarryDamage);
  if (amount <= 0) return { state: run, amount: 0 };
  return { state: { ...run, pendingCarryDamage: 0, updatedAt: now }, amount };
}

/** 战斗结束 / 撤退：清理暴露与未完成破解，保留已发现线索供 UI 记录 */
export function closeWeaknessRun(run: BossWeaknessRunState, now: number): { state: BossWeaknessRunState; events: BossBattleEvent[] } {
  const entries: Record<string, WeaknessEntry> = {};
  const events: BossBattleEvent[] = [];
  for (const [id, entry] of Object.entries(run.entries)) {
    if (entry.status === 'exposed' || entry.status === 'exploiting' || entry.status === 'analyzing') {
      entries[id] = { ...entry, status: 'recovered', exposedUntil: now, cooldownUntil: now, analysisEndsAt: null };
      events.push(eventOf(run, id, BOSS_BATTLE_EVENTS.WEAKNESS_CANCELLED, now, { reason: 'battle-end' }));
    } else {
      entries[id] = entry;
    }
  }
  return { state: { ...run, entries, pendingCarryDamage: 0, updatedAt: now }, events };
}

// ---------- 自愈 ----------

export interface NormalizeWeaknessOptions {
  bossId: string;
  battleId: string;
  phaseId: string;
  phaseIndex: number;
  now: number;
}

export function normalizeWeaknessRun(
  raw: unknown,
  defs: BossWeaknessDefinition[],
  opts: NormalizeWeaknessOptions,
): BossWeaknessRunState {
  const fresh = createBossWeaknessRun(opts.battleId, opts.bossId, opts.phaseId, opts.phaseIndex, defs, opts.now);
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Partial<BossWeaknessRunState>;
  if (typeof r.bossId === 'string' && r.bossId !== opts.bossId) return fresh;
  if (typeof r.battleId === 'string' && r.battleId !== opts.battleId) return fresh;

  const defMap = new Map(defs.map(d => [d.weaknessId, d]));
  const entries: Record<string, WeaknessEntry> = {};
  for (const d of defs) entries[d.weaknessId] = emptyEntry(d.weaknessId);
  if (r.entries && typeof r.entries === 'object') {
    for (const [id, rawEntry] of Object.entries(r.entries as Record<string, unknown>)) {
      const def = defMap.get(id);
      if (!def || !rawEntry || typeof rawEntry !== 'object') continue;
      const e = rawEntry as Partial<WeaknessEntry>;
      const clueIds = Array.isArray(e.clues)
        ? [...new Set(e.clues.filter((x): x is string => typeof x === 'string'))].filter(cid => def.clues.some(c => c.clueId === cid)).slice(0, 20)
        : [];
      let status: WeaknessStatus =
        e.status === 'hidden' || e.status === 'hinted' || e.status === 'analyzing' || e.status === 'discovered' ||
        e.status === 'exploiting' || e.status === 'exposed' || e.status === 'recovered' || e.status === 'locked'
          ? e.status : 'hidden';
      const max = def.maxAttempts > 0 ? def.maxAttempts : 999;
      const attempts = Math.min(max, int(e.attempts));
      let analysisEndsAt = typeof e.analysisEndsAt === 'number' && isFinite(e.analysisEndsAt) ? Math.floor(e.analysisEndsAt) : null;
      let exposedUntil = typeof e.exposedUntil === 'number' && isFinite(e.exposedUntil) ? Math.floor(e.exposedUntil) : null;
      let cooldownUntil = typeof e.cooldownUntil === 'number' && isFinite(e.cooldownUntil) ? Math.floor(e.cooldownUntil) : null;
      let lockedUntil = typeof e.lockedUntil === 'number' && isFinite(e.lockedUntil) ? Math.floor(e.lockedUntil) : null;
      if (status === 'hidden' && clueIds.length > 0) status = 'hinted';
      if (status === 'analyzing') {
        status = analysisEndsAt != null && opts.now >= analysisEndsAt && clueIds.length >= def.requiredClues ? 'discovered' : 'hinted';
        analysisEndsAt = null;
      }
      if (status === 'exploiting') {
        // 刷新无法确认真实判题结果：本次尝试计为失败，不重复成功/奖励
        status = def.maxAttempts > 0 && attempts >= def.maxAttempts ? 'locked' : 'discovered';
        if (status === 'locked') lockedUntil = opts.now + Math.max(1000, def.recoveryRule.lockRecoveryMs);
      }
      if (status === 'exposed') {
        if (exposedUntil == null || opts.now >= exposedUntil) {
          status = 'recovered';
          cooldownUntil = opts.now + Math.max(0, def.recoveryRule.recoveryCooldownMs);
        }
      }
      if (status === 'recovered' && cooldownUntil != null && opts.now >= cooldownUntil) {
        status = 'discovered';
        cooldownUntil = null;
      }
      if (status === 'locked' && lockedUntil != null && opts.now >= lockedUntil) {
        status = 'discovered';
        lockedUntil = null;
      }
      entries[id] = {
        weaknessId: id,
        status,
        clues: clueIds,
        analysisStartedAt: typeof e.analysisStartedAt === 'number' && isFinite(e.analysisStartedAt) ? Math.floor(e.analysisStartedAt) : null,
        analysisEndsAt,
        attempts,
        successCount: int(e.successCount),
        lastResult: e.lastResult === 'success' || e.lastResult === 'failure' ? e.lastResult : null,
        exposedAt: typeof e.exposedAt === 'number' && isFinite(e.exposedAt) ? Math.floor(e.exposedAt) : null,
        exposedUntil: status === 'exposed' ? exposedUntil : exposedUntil,
        exposureCount: int(e.exposureCount),
        cooldownUntil,
        lockedUntil,
        lastCrackAt: typeof e.lastCrackAt === 'number' && isFinite(e.lastCrackAt) ? Math.floor(e.lastCrackAt) : null,
      };
    }
  }
  const phaseDefs = definitionsForPhase(defs, opts.phaseIndex);
  const active = typeof r.activeWeaknessId === 'string' && phaseDefs.some(d => d.weaknessId === r.activeWeaknessId)
    ? r.activeWeaknessId
    : (phaseDefs[0] ? phaseDefs[0].weaknessId : null);
  return {
    battleId: opts.battleId,
    bossId: opts.bossId,
    phaseId: opts.phaseId,
    phaseIndex: opts.phaseIndex,
    activeWeaknessId: active,
    entries,
    pendingCarryDamage: Math.min(200, int(r.pendingCarryDamage)),
    updatedAt: opts.now,
  };
}
