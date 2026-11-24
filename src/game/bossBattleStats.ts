// Boss 战斗数据采集与统计引擎（V1.3-B.5.1）
//
// 观察者模块：只记录已经确认的战斗结果，不修改 Boss HP / 玩家意识 / 攻击 / 阶段 / 奖励。
// 所有统计事件按 battleId + eventId 幂等；活动战斗保留事件日志，终结后生成只读快照。
//
// 数据来源优先级：战斗引擎真实结算 > Judge/Runner 真实返回 > B.4 仲裁确认 > gameStore 状态；
// UI 仅用于展示，不作为统计数据来源。

export const BOSS_BATTLE_STATS_SCHEMA_VERSION = 1;

export type BossBattleStatsStatus = 'active' | 'completed' | 'failed' | 'abandoned' | 'interrupted';
export type BossBattleStatsResult = 'victory' | 'defeat' | 'retreat' | 'interrupted' | null;
export type BossBattleStatsDataQuality = 'complete' | 'partial' | 'invalid';

export type BossBattleStatEventType =
  | 'battle-started'
  | 'battle-ended'
  | 'phase-started'
  | 'phase-completed'
  | 'phase-transition'
  | 'challenge-result'
  | 'attack-telegraph'
  | 'attack-started'
  | 'attack-result'
  | 'attack-cancelled'
  | 'attack-interrupted'
  | 'damage-taken'
  | 'weakness-clue'
  | 'weakness-analyzed'
  | 'weakness-discovered'
  | 'weakness-crack-result'
  | 'weakness-exposed'
  | 'weakness-recovered'
  | 'weakness-cancelled'
  | 'weakness-boss-damage'
  | 'dynamic-triggered'
  | 'dynamic-success'
  | 'dynamic-failed'
  | 'dynamic-timeout'
  | 'dynamic-cancelled'
  | 'dynamic-cleared'
  | 'dynamic-attack-interrupted'
  | 'dynamic-damage-taken'
  | 'player-death';

export interface BossBattleStatEvent {
  eventId: string;
  battleId: string;
  bossId: string;
  phaseId: string | null;
  eventType: BossBattleStatEventType;
  source: string;
  occurredAt: number;
  sequence: number;
  payload: Record<string, unknown>;
  settled: boolean;
}

export interface BossBattleStatEventInput {
  eventId: string;
  eventType: BossBattleStatEventType;
  phaseId?: string | null;
  source?: string;
  occurredAt?: number;
  payload?: Record<string, unknown>;
}

export interface BossPhaseStat {
  phaseId: string;
  phaseIndex: number;
  enteredAt: number | null;
  exitedAt: number | null;
  durationMs: number;
  damageTaken: number;
  attackCount: number;
  challengeSuccess: number;
  challengeFailed: number;
  weaknessDiscoveries: number;
  weaknessCracks: number;
  endState: 'active' | 'completed' | 'victory' | 'defeat' | 'interrupted';
}

export interface BossChallengeStats {
  submittedCount: number;
  judgedCount: number;
  passedCount: number;
  failedCount: number;
  runtimeErrorCount: number;
  invalidCount: number;
  consecutiveSuccess: number;
  maxConsecutiveSuccess: number;
  failureReasons: Record<string, number>;
  successRate: number | null;
  keyCrackSuccess: boolean;
}

export interface BossAttackStats {
  telegraphCount: number;
  startedCount: number;
  hitCount: number;
  blockedCount: number;
  cancelledCount: number;
  interruptedByWeaknessCount: number;
  interruptedByCrisisCount: number;
  damageTaken: number;
  shieldAbsorbed: number;
}

export interface BossDefenseStats {
  defenseSuccessCount: number;
  defenseFailedCount: number;
  dodgeSuccessCount: number;
  dodgeFailedCount: number;
}

export interface BossWeaknessStats {
  clueCount: number;
  discoveredIds: string[];
  crackedIds: string[];
  discoveredCount: number;
  analysisCount: number;
  crackSubmittedCount: number;
  crackSuccessCount: number;
  crackFailedCount: number;
  exposedCount: number;
  exposureMsTotal: number;
  bossHpDamage: number;
  cancelledCount: number;
}

export interface BossDynamicEventStats {
  triggeredCount: number;
  byDef: Record<string, number>;
  successByDef: Record<string, number>;
  successCount: number;
  failedCount: number;
  playerCompletedCount: number;
  timeoutCount: number;
  cancelledByPriorityCount: number;
  clearedByBattleEndCount: number;
  attackInterruptedCount: number;
  playerDamageTaken: number;
  durationMsTotal: number;
}

export interface BossBattleStatsState {
  schemaVersion: number;
  battleId: string;
  bossId: string;
  bossName: string;
  difficulty: string;
  battleStatus: BossBattleStatsStatus;
  result: BossBattleStatsResult;
  startedAt: number;
  endedAt: number | null;
  wallDurationMs: number | null;
  /** 项目没有正式暂停系统：可靠活动时长不可得时为 null，不伪造 */
  activeDurationMs: number | null;
  currentPhaseId: string | null;
  currentPhaseIndex: number;
  maxPhaseReached: number;
  phaseTransitions: number;
  phasesCompleted: number;
  phaseStats: Record<string, BossPhaseStat>;
  challengeStats: BossChallengeStats;
  attackStats: BossAttackStats;
  defenseStats: BossDefenseStats;
  weaknessStats: BossWeaknessStats;
  dynamicEventStats: BossDynamicEventStats;
  playerDeathCount: number;
  /** 战斗中真实观察到的最低意识值；无记录为 null（B.5.4 极限生存成就） */
  minConsciousness: number | null;
  dataQuality: BossBattleStatsDataQuality;
  finalized: boolean;
  finalizedAt: number | null;
  lastUpdatedAt: number;
  eventLog: BossBattleStatEvent[];
  rejectedEvents: { eventId: string; eventType: string; reason: string; at: number }[];
  settledEventIds: string[];
  weaknessClues: string[];
  weaknessExposureStartedAt: Record<string, number>;
  dynamicStartedAt: Record<string, number>;
  sequence: number;
}

export interface BossBattleStatsStore {
  active: BossBattleStatsState | null;
  /** 已终结快照，最多 50 场（最旧优先清理） */
  history: BossBattleStatsState[];
}

export const MAX_STATS_HISTORY = 50;
export const MAX_EVENT_LOG = 200;
export const MAX_SETTLED = 400;

const int = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.max(0, v) : fallback;
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

function emptyPhase(phaseId: string, phaseIndex: number): BossPhaseStat {
  return {
    phaseId, phaseIndex, enteredAt: null, exitedAt: null, durationMs: 0,
    damageTaken: 0, attackCount: 0, challengeSuccess: 0, challengeFailed: 0,
    weaknessDiscoveries: 0, weaknessCracks: 0, endState: 'active',
  };
}

export function createBossBattleStats(ctx: {
  battleId: string;
  bossId: string;
  bossName: string;
  difficulty: string;
  startedAt: number;
  phaseId?: string | null;
  phaseIndex?: number;
  consciousness?: number | null;
}): BossBattleStatsState {
  const phaseId = ctx.phaseId ?? null;
  const phaseIndex = int(ctx.phaseIndex);
  const stats: BossBattleStatsState = {
    schemaVersion: BOSS_BATTLE_STATS_SCHEMA_VERSION,
    battleId: ctx.battleId,
    bossId: ctx.bossId,
    bossName: ctx.bossName,
    difficulty: ctx.difficulty,
    battleStatus: 'active',
    result: null,
    startedAt: Math.max(0, Math.floor(ctx.startedAt)),
    endedAt: null,
    wallDurationMs: null,
    activeDurationMs: null,
    currentPhaseId: phaseId,
    currentPhaseIndex: phaseIndex,
    maxPhaseReached: phaseIndex,
    phaseTransitions: 0,
    phasesCompleted: 0,
    phaseStats: phaseId ? { [phaseId]: { ...emptyPhase(phaseId, phaseIndex), enteredAt: Math.max(0, Math.floor(ctx.startedAt)) } } : {},
    challengeStats: {
      submittedCount: 0, judgedCount: 0, passedCount: 0, failedCount: 0,
      runtimeErrorCount: 0, invalidCount: 0, consecutiveSuccess: 0, maxConsecutiveSuccess: 0,
      failureReasons: {}, successRate: null, keyCrackSuccess: false,
    },
    attackStats: {
      telegraphCount: 0, startedCount: 0, hitCount: 0, blockedCount: 0, cancelledCount: 0,
      interruptedByWeaknessCount: 0, interruptedByCrisisCount: 0, damageTaken: 0, shieldAbsorbed: 0,
    },
    defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 0, dodgeSuccessCount: 0, dodgeFailedCount: 0 },
    weaknessStats: {
      clueCount: 0, discoveredIds: [], crackedIds: [], discoveredCount: 0, analysisCount: 0, crackSubmittedCount: 0,
      crackSuccessCount: 0, crackFailedCount: 0, exposedCount: 0, exposureMsTotal: 0,
      bossHpDamage: 0, cancelledCount: 0,
    },
    dynamicEventStats: {
      triggeredCount: 0, byDef: {}, successByDef: {}, successCount: 0, failedCount: 0, playerCompletedCount: 0,
      timeoutCount: 0, cancelledByPriorityCount: 0, clearedByBattleEndCount: 0,
      attackInterruptedCount: 0, playerDamageTaken: 0, durationMsTotal: 0,
    },
    playerDeathCount: 0,
    minConsciousness: typeof ctx.consciousness === 'number' && Number.isFinite(ctx.consciousness)
      ? Math.max(0, Math.min(100, Math.floor(ctx.consciousness)))
      : null,
    dataQuality: 'partial',
    finalized: false,
    finalizedAt: null,
    lastUpdatedAt: Math.max(0, Math.floor(ctx.startedAt)),
    eventLog: [],
    rejectedEvents: [],
    settledEventIds: [],
    weaknessClues: [],
    weaknessExposureStartedAt: {},
    dynamicStartedAt: {},
    sequence: 0,
  };
  return stats;
}

const PHASE_SCOPED = new Set<BossBattleStatEventType>([
  'challenge-result', 'attack-telegraph', 'attack-started', 'attack-result', 'attack-cancelled',
  'attack-interrupted', 'damage-taken', 'weakness-clue', 'weakness-analyzed', 'weakness-discovered',
  'weakness-crack-result', 'weakness-exposed', 'weakness-recovered', 'weakness-cancelled',
  'weakness-boss-damage',
]);

const clampRate = (passed: number, judged: number): number | null =>
  judged > 0 ? Math.round((passed / judged) * 10000) / 10000 : null;

export interface RecordStatResult {
  state: BossBattleStatsState;
  accepted: boolean;
  reason?: string;
}

/** 记录统计事件（纯函数，幂等；非法/迟到/旧阶段事件安全拒绝） */
export function recordBossBattleEvent(
  state: BossBattleStatsState,
  input: BossBattleStatEventInput,
  now: number,
): RecordStatResult {
  const at = Math.max(0, Math.floor(typeof input.occurredAt === 'number' && isFinite(input.occurredAt) ? input.occurredAt : now));
  if (state.finalized) return reject(state, input, at, 'finalized');
  const eventId = typeof input.eventId === 'string' ? input.eventId.trim() : '';
  if (!eventId) return reject(state, input, at, 'missing-event-id');
  if (state.settledEventIds.includes(eventId)) return reject(state, input, at, 'duplicate');
  const phaseId = input.phaseId === undefined ? state.currentPhaseId : input.phaseId;
  if (PHASE_SCOPED.has(input.eventType) && phaseId && state.currentPhaseId && phaseId !== state.currentPhaseId) {
    return reject(state, input, at, 'stale-phase');
  }

  const next: BossBattleStatsState = {
    ...state,
    phaseStats: { ...state.phaseStats },
    challengeStats: { ...state.challengeStats, failureReasons: { ...state.challengeStats.failureReasons } },
    attackStats: { ...state.attackStats },
    defenseStats: { ...state.defenseStats },
    weaknessStats: {
      ...state.weaknessStats,
      discoveredIds: [...state.weaknessStats.discoveredIds],
      crackedIds: [...state.weaknessStats.crackedIds],
    },
    dynamicEventStats: {
      ...state.dynamicEventStats,
      byDef: { ...state.dynamicEventStats.byDef },
      successByDef: { ...state.dynamicEventStats.successByDef },
    },
    eventLog: [...state.eventLog],
    rejectedEvents: [...state.rejectedEvents],
    settledEventIds: [...state.settledEventIds],
    weaknessClues: [...state.weaknessClues],
    weaknessExposureStartedAt: { ...state.weaknessExposureStartedAt },
    dynamicStartedAt: { ...state.dynamicStartedAt },
    sequence: state.sequence + 1,
    lastUpdatedAt: at,
  };
  const payload = input.payload || {};
  const phase = phaseId ? next.phaseStats[phaseId] || { ...emptyPhase(phaseId, next.currentPhaseIndex) } : null;

  switch (input.eventType) {
    case 'battle-started':
      if (next.startedAt <= 0) next.startedAt = at;
      break;
    case 'battle-ended':
      next.endedAt = at;
      break;
    case 'phase-started': {
      const idx = int(payload.phaseIndex, next.currentPhaseIndex);
      next.currentPhaseId = phaseId;
      next.currentPhaseIndex = idx;
      next.maxPhaseReached = Math.max(next.maxPhaseReached, idx);
      if (phase) {
        phase.phaseIndex = idx;
        phase.enteredAt = phase.enteredAt ?? at;
        next.phaseStats[phaseId as string] = phase;
      }
      break;
    }
    case 'phase-completed': {
      if (phase) {
        phase.exitedAt = at;
        phase.durationMs = phase.enteredAt != null ? Math.max(0, at - phase.enteredAt) : phase.durationMs;
        phase.endState = 'completed';
        next.phaseStats[phaseId as string] = phase;
        next.phasesCompleted = Math.max(next.phasesCompleted, phase.phaseIndex + 1);
      }
      break;
    }
    case 'phase-transition':
      next.phaseTransitions += 1;
      if (typeof payload.toIndex === 'number') next.maxPhaseReached = Math.max(next.maxPhaseReached, int(payload.toIndex));
      break;
    case 'challenge-result': {
      const outcome = str(payload.outcome);
      const cs = next.challengeStats;
      if (outcome === 'invalid') {
        cs.invalidCount += 1;
      } else {
        cs.submittedCount += 1;
        if (outcome === 'passed' || outcome === 'failed') {
          cs.judgedCount += 1;
          if (outcome === 'passed') {
            cs.passedCount += 1;
            cs.consecutiveSuccess += 1;
            cs.maxConsecutiveSuccess = Math.max(cs.maxConsecutiveSuccess, cs.consecutiveSuccess);
            if (payload.phaseCleared === true) cs.keyCrackSuccess = true;
            if (phase) { phase.challengeSuccess += 1; next.phaseStats[phaseId as string] = phase; }
          } else {
            cs.failedCount += 1;
            cs.consecutiveSuccess = 0;
            const reason = str(payload.reason, 'judge-failed');
            cs.failureReasons[reason] = (cs.failureReasons[reason] || 0) + 1;
            if (phase) { phase.challengeFailed += 1; next.phaseStats[phaseId as string] = phase; }
          }
        } else if (outcome === 'runtime-error' || outcome === 'timeout') {
          cs.runtimeErrorCount += 1;
          cs.consecutiveSuccess = 0;
          const reason = outcome === 'timeout' ? 'timeout' : str(payload.reason, 'runtime-error');
          cs.failureReasons[reason] = (cs.failureReasons[reason] || 0) + 1;
        }
        cs.successRate = clampRate(cs.passedCount, cs.judgedCount);
      }
      break;
    }
    case 'attack-telegraph':
      next.attackStats.telegraphCount += 1;
      break;
    case 'attack-started':
      next.attackStats.startedCount += 1;
      if (phase) { phase.attackCount += 1; next.phaseStats[phaseId as string] = phase; }
      break;
    case 'attack-result': {
      const result = str(payload.result);
      const response = str(payload.response, 'none');
      if (result === 'hit') {
        next.attackStats.hitCount += 1;
        if (response === 'defend') next.defenseStats.defenseFailedCount += 1;
        if (response === 'dodge') next.defenseStats.dodgeFailedCount += 1;
      } else if (result === 'blocked') {
        next.attackStats.blockedCount += 1;
        next.defenseStats.defenseSuccessCount += 1;
      } else if (result === 'dodged') {
        next.defenseStats.dodgeSuccessCount += 1;
      }
      break;
    }
    case 'attack-cancelled':
    case 'attack-interrupted': {
      next.attackStats.cancelledCount += 1;
      const reason = str(payload.reason);
      if (reason === 'weakness-exposed' || reason === 'weakness-crack') next.attackStats.interruptedByWeaknessCount += 1;
      if (reason === 'dynamic-crisis' || reason === 'dynamic-event') next.attackStats.interruptedByCrisisCount += 1;
      break;
    }
    case 'damage-taken': {
      const amount = num(payload.amount);
      if (typeof payload.consciousness === 'number' && Number.isFinite(payload.consciousness)) {
        const c = Math.max(0, Math.min(100, Math.floor(payload.consciousness)));
        next.minConsciousness = next.minConsciousness == null ? c : Math.min(next.minConsciousness, c);
      }
      next.attackStats.damageTaken += amount;
      next.attackStats.shieldAbsorbed += num(payload.shieldAbsorbed);
      if (phase) { phase.damageTaken += amount; next.phaseStats[phaseId as string] = phase; }
      break;
    }
    case 'weakness-clue': {
      const clueId = str(payload.clueId, eventId);
      if (!next.weaknessClues.includes(clueId)) {
        next.weaknessClues = [...next.weaknessClues, clueId].slice(-60);
        next.weaknessStats.clueCount += 1;
      }
      break;
    }
    case 'weakness-analyzed':
      next.weaknessStats.analysisCount += 1;
      break;
    case 'weakness-discovered':
      next.weaknessStats.discoveredCount += 1;
      if (typeof payload.weaknessId === 'string' && payload.weaknessId && !next.weaknessStats.discoveredIds.includes(payload.weaknessId)) {
        next.weaknessStats.discoveredIds = [...next.weaknessStats.discoveredIds, payload.weaknessId].slice(-60);
      }
      if (phase) { phase.weaknessDiscoveries += 1; next.phaseStats[phaseId as string] = phase; }
      break;
    case 'weakness-crack-result': {
      next.weaknessStats.crackSubmittedCount += 1;
      if (str(payload.outcome) === 'success') {
        next.weaknessStats.crackSuccessCount += 1;
        if (typeof payload.weaknessId === 'string' && payload.weaknessId && !next.weaknessStats.crackedIds.includes(payload.weaknessId)) {
          next.weaknessStats.crackedIds = [...next.weaknessStats.crackedIds, payload.weaknessId].slice(-60);
        }
        if (phase) { phase.weaknessCracks += 1; next.phaseStats[phaseId as string] = phase; }
      } else {
        next.weaknessStats.crackFailedCount += 1;
      }
      break;
    }
    case 'weakness-exposed': {
      next.weaknessStats.exposedCount += 1;
      const wid = str(payload.weaknessId, 'unknown');
      next.weaknessExposureStartedAt[wid] = at;
      break;
    }
    case 'weakness-recovered':
    case 'weakness-cancelled': {
      const wid = str(payload.weaknessId, 'unknown');
      const started = next.weaknessExposureStartedAt[wid];
      const duration = typeof payload.durationMs === 'number' ? num(payload.durationMs) : started != null ? Math.max(0, at - started) : 0;
      next.weaknessStats.exposureMsTotal += duration;
      delete next.weaknessExposureStartedAt[wid];
      if (input.eventType === 'weakness-cancelled') next.weaknessStats.cancelledCount += 1;
      break;
    }
    case 'weakness-boss-damage':
      next.weaknessStats.bossHpDamage += num(payload.amount);
      break;
    case 'dynamic-triggered': {
      const defId = str(payload.defId, 'unknown');
      next.dynamicEventStats.triggeredCount += 1;
      next.dynamicEventStats.byDef[defId] = (next.dynamicEventStats.byDef[defId] || 0) + 1;
      const instanceId = str(payload.instanceId, eventId);
      next.dynamicStartedAt[instanceId] = at;
      break;
    }
    case 'dynamic-success':
    case 'dynamic-failed':
    case 'dynamic-timeout':
    case 'dynamic-cancelled':
    case 'dynamic-cleared': {
      const instanceId = str(payload.instanceId, '');
      const started = instanceId ? next.dynamicStartedAt[instanceId] : undefined;
      const duration = typeof payload.durationMs === 'number' ? num(payload.durationMs) : started != null ? Math.max(0, at - started) : 0;
      next.dynamicEventStats.durationMsTotal += duration;
      if (instanceId) delete next.dynamicStartedAt[instanceId];
      if (input.eventType === 'dynamic-success') {
        next.dynamicEventStats.successCount += 1;
        if (typeof payload.defId === 'string' && payload.defId) {
          next.dynamicEventStats.successByDef[payload.defId] = (next.dynamicEventStats.successByDef[payload.defId] || 0) + 1;
        }
        next.dynamicEventStats.playerCompletedCount += 1;
      } else if (input.eventType === 'dynamic-failed') {
        next.dynamicEventStats.failedCount += 1;
      } else if (input.eventType === 'dynamic-timeout') {
        next.dynamicEventStats.timeoutCount += 1;
      } else if (input.eventType === 'dynamic-cancelled') {
        next.dynamicEventStats.cancelledByPriorityCount += 1;
      } else {
        next.dynamicEventStats.clearedByBattleEndCount += 1;
      }
      break;
    }
    case 'dynamic-attack-interrupted':
      next.dynamicEventStats.attackInterruptedCount += 1;
      break;
    case 'dynamic-damage-taken':
      next.dynamicEventStats.playerDamageTaken += num(payload.amount);
      break;
    case 'player-death':
      next.playerDeathCount += 1;
      break;
    default:
      break;
  }

  const event: BossBattleStatEvent = {
    eventId,
    battleId: state.battleId,
    bossId: state.bossId,
    phaseId: phaseId ?? null,
    eventType: input.eventType,
    source: input.source || 'combat',
    occurredAt: at,
    sequence: next.sequence,
    payload,
    settled: true,
  };
  next.eventLog = [...next.eventLog, event].slice(-MAX_EVENT_LOG);
  next.settledEventIds = [...next.settledEventIds, eventId].slice(-MAX_SETTLED);
  return { state: next, accepted: true };
}

function reject(state: BossBattleStatsState, input: BossBattleStatEventInput, at: number, reason: string): RecordStatResult {
  const rejected = [...state.rejectedEvents, {
    eventId: typeof input.eventId === 'string' ? input.eventId : '',
    eventType: String(input.eventType || ''),
    reason,
    at,
  }].slice(-20);
  return { state: { ...state, rejectedEvents: rejected }, accepted: false, reason };
}

/** 生成只读统计摘要（深拷贝；不含评分/奖励逻辑） */
export function snapshotBossBattleStats(state: BossBattleStatsState): BossBattleStatsState {
  return JSON.parse(JSON.stringify(state)) as BossBattleStatsState;
}

/** 结束战斗并生成只读快照（幂等） */
export function finalizeBossBattleStats(
  state: BossBattleStatsState,
  result: Exclude<BossBattleStatsResult, null>,
  now: number,
): { state: BossBattleStatsState; already: boolean } {
  if (state.finalized) return { state, already: true };
  const at = Math.max(state.startedAt, Math.floor(now));
  const next: BossBattleStatsState = {
    ...state,
    phaseStats: { ...state.phaseStats },
    challengeStats: { ...state.challengeStats, failureReasons: { ...state.challengeStats.failureReasons } },
    attackStats: { ...state.attackStats },
    defenseStats: { ...state.defenseStats },
    weaknessStats: {
      ...state.weaknessStats,
      discoveredIds: [...state.weaknessStats.discoveredIds],
      crackedIds: [...state.weaknessStats.crackedIds],
    },
    dynamicEventStats: {
      ...state.dynamicEventStats,
      byDef: { ...state.dynamicEventStats.byDef },
      successByDef: { ...state.dynamicEventStats.successByDef },
    },
    settledEventIds: [...state.settledEventIds],
  };
  next.result = result;
  next.battleStatus = result === 'victory' ? 'completed'
    : result === 'defeat' ? 'failed'
      : result === 'retreat' ? 'abandoned'
        : 'interrupted';
  next.endedAt = at;
  next.wallDurationMs = next.startedAt > 0 ? Math.max(0, at - next.startedAt) : null;
  // 无正式暂停系统：不伪造活动时长
  next.activeDurationMs = null;
  next.finalized = true;
  next.finalizedAt = at;
  next.lastUpdatedAt = at;
  next.dataQuality = next.startedAt > 0 && next.endedAt != null && next.endedAt >= next.startedAt ? 'complete' : 'partial';

  const current = next.currentPhaseId ? next.phaseStats[next.currentPhaseId] : null;
  if (current && current.exitedAt == null) {
    current.exitedAt = at;
    current.durationMs = current.enteredAt != null ? Math.max(0, at - current.enteredAt) : current.durationMs;
    current.endState = result === 'victory' ? 'victory' : result === 'defeat' ? 'defeat' : 'interrupted';
    next.phaseStats[next.currentPhaseId as string] = current;
    if (result === 'victory') next.phasesCompleted = Math.max(next.phasesCompleted, current.phaseIndex + 1);
  }
  next.challengeStats.successRate = clampRate(next.challengeStats.passedCount, next.challengeStats.judgedCount);
  next.eventLog = next.eventLog.slice(-40);
  next.rejectedEvents = next.rejectedEvents.slice(-20);
  return { state: snapshotBossBattleStats(next), already: false };
}

/** 存档自愈：字段缺失/异常/旧版本安全修复，永不抛错 */
export function normalizeBossBattleStats(raw: unknown): BossBattleStatsState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BossBattleStatsState>;
  if (typeof r.battleId !== 'string' || !r.battleId) return null;
  if (typeof r.bossId !== 'string' || !r.bossId) return null;
  const startedAt = int(r.startedAt);
  const endedRaw = typeof r.endedAt === 'number' && isFinite(r.endedAt) ? Math.floor(r.endedAt) : null;
  const endedAt = endedRaw != null ? Math.max(startedAt, endedRaw) : null;
  const result: BossBattleStatsResult = r.result === 'victory' || r.result === 'defeat' || r.result === 'retreat' || r.result === 'interrupted'
    ? r.result : null;
  const finalized = r.finalized === true || !!endedAt;
  const derivedFinalStatus: BossBattleStatsStatus = result === 'victory' ? 'completed'
    : result === 'defeat' ? 'failed'
      : result === 'retreat' ? 'abandoned'
        : 'interrupted';
  const status: BossBattleStatsStatus =
    finalized
      ? derivedFinalStatus
      : (r.battleStatus === 'active' || r.battleStatus === 'completed' || r.battleStatus === 'failed' || r.battleStatus === 'abandoned' || r.battleStatus === 'interrupted'
        ? r.battleStatus : 'active');

  const phaseStats: Record<string, BossPhaseStat> = {};
  if (r.phaseStats && typeof r.phaseStats === 'object') {
    for (const [pid, rawPhase] of Object.entries(r.phaseStats as Record<string, unknown>)) {
      if (!rawPhase || typeof rawPhase !== 'object') continue;
      const p = rawPhase as Partial<BossPhaseStat>;
      phaseStats[pid] = {
        phaseId: pid,
        phaseIndex: int(p.phaseIndex),
        enteredAt: typeof p.enteredAt === 'number' && isFinite(p.enteredAt) ? Math.max(0, Math.floor(p.enteredAt)) : null,
        exitedAt: typeof p.exitedAt === 'number' && isFinite(p.exitedAt) ? Math.max(0, Math.floor(p.exitedAt)) : null,
        durationMs: int(p.durationMs),
        damageTaken: int(p.damageTaken),
        attackCount: int(p.attackCount),
        challengeSuccess: int(p.challengeSuccess),
        challengeFailed: int(p.challengeFailed),
        weaknessDiscoveries: int(p.weaknessDiscoveries),
        weaknessCracks: int(p.weaknessCracks),
        endState: p.endState === 'completed' || p.endState === 'victory' || p.endState === 'defeat' || p.endState === 'interrupted' ? p.endState : 'active',
      };
    }
  }

  const csRaw = (r.challengeStats || {}) as Partial<BossChallengeStats>;
  const passed = int(csRaw.passedCount);
  const judged = Math.max(passed, int(csRaw.judgedCount));
  const submitted = Math.max(judged, int(csRaw.submittedCount));
  const challengeStats: BossChallengeStats = {
    submittedCount: submitted,
    judgedCount: judged,
    passedCount: passed,
    failedCount: Math.min(judged, int(csRaw.failedCount)),
    runtimeErrorCount: int(csRaw.runtimeErrorCount),
    invalidCount: int(csRaw.invalidCount),
    consecutiveSuccess: 0,
    maxConsecutiveSuccess: Math.min(passed, int(csRaw.maxConsecutiveSuccess)),
    failureReasons: csRaw.failureReasons && typeof csRaw.failureReasons === 'object'
      ? Object.fromEntries(Object.entries(csRaw.failureReasons as Record<string, unknown>).map(([k, v]) => [k, int(v)]).filter(([, v]) => Number(v) > 0))
      : {},
    successRate: clampRate(passed, judged),
    keyCrackSuccess: csRaw.keyCrackSuccess === true,
  };

  const aRaw = (r.attackStats || {}) as Partial<BossAttackStats>;
  const dRaw = (r.defenseStats || {}) as Partial<BossDefenseStats>;
  const wRaw = (r.weaknessStats || {}) as Partial<BossWeaknessStats>;
  const eRaw = (r.dynamicEventStats || {}) as Partial<BossDynamicEventStats>;

  const eventLog = Array.isArray(r.eventLog)
    ? r.eventLog.filter((x): x is BossBattleStatEvent => !!x && typeof x === 'object' && typeof (x as BossBattleStatEvent).eventId === 'string')
      .map((x, i) => ({
        eventId: x.eventId, battleId: r.battleId as string, bossId: r.bossId as string,
        phaseId: typeof x.phaseId === 'string' ? x.phaseId : null,
        eventType: x.eventType, source: typeof x.source === 'string' ? x.source : 'normalize',
        occurredAt: int(x.occurredAt), sequence: int(x.sequence, i), payload: x.payload && typeof x.payload === 'object' ? x.payload : {}, settled: true,
      })).slice(-MAX_EVENT_LOG)
    : [];
  const settled = Array.isArray(r.settledEventIds)
    ? [...new Set(r.settledEventIds.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-MAX_SETTLED)
    : [];

  const stats: BossBattleStatsState = {
    schemaVersion: BOSS_BATTLE_STATS_SCHEMA_VERSION,
    battleId: r.battleId,
    bossId: r.bossId,
    bossName: str(r.bossName, r.bossId),
    difficulty: str(r.difficulty, 'easy'),
    battleStatus: status,
    result,
    startedAt,
    endedAt,
    wallDurationMs: startedAt > 0 && endedAt != null ? Math.max(0, endedAt - startedAt) : null,
    activeDurationMs: null,
    currentPhaseId: typeof r.currentPhaseId === 'string' ? r.currentPhaseId : null,
    currentPhaseIndex: int(r.currentPhaseIndex),
    maxPhaseReached: int(r.maxPhaseReached),
    phaseTransitions: int(r.phaseTransitions),
    phasesCompleted: int(r.phasesCompleted),
    phaseStats,
    challengeStats,
    attackStats: {
      telegraphCount: int(aRaw.telegraphCount), startedCount: int(aRaw.startedCount), hitCount: int(aRaw.hitCount),
      blockedCount: int(aRaw.blockedCount), cancelledCount: int(aRaw.cancelledCount),
      interruptedByWeaknessCount: int(aRaw.interruptedByWeaknessCount),
      interruptedByCrisisCount: int(aRaw.interruptedByCrisisCount),
      damageTaken: int(aRaw.damageTaken), shieldAbsorbed: int(aRaw.shieldAbsorbed),
    },
    defenseStats: {
      defenseSuccessCount: int(dRaw.defenseSuccessCount), defenseFailedCount: int(dRaw.defenseFailedCount),
      dodgeSuccessCount: int(dRaw.dodgeSuccessCount), dodgeFailedCount: int(dRaw.dodgeFailedCount),
    },
    weaknessStats: {
      clueCount: int(wRaw.clueCount),
      discoveredIds: Array.isArray(wRaw.discoveredIds) ? [...new Set(wRaw.discoveredIds.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-60) : [],
      crackedIds: Array.isArray(wRaw.crackedIds) ? [...new Set(wRaw.crackedIds.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-60) : [],
      discoveredCount: int(wRaw.discoveredCount), analysisCount: int(wRaw.analysisCount),
      crackSubmittedCount: int(wRaw.crackSubmittedCount), crackSuccessCount: int(wRaw.crackSuccessCount),
      crackFailedCount: int(wRaw.crackFailedCount), exposedCount: int(wRaw.exposedCount),
      exposureMsTotal: int(wRaw.exposureMsTotal), bossHpDamage: int(wRaw.bossHpDamage), cancelledCount: int(wRaw.cancelledCount),
    },
    dynamicEventStats: {
      triggeredCount: int(eRaw.triggeredCount),
      byDef: eRaw.byDef && typeof eRaw.byDef === 'object'
        ? Object.fromEntries(Object.entries(eRaw.byDef as Record<string, unknown>).map(([k, v]) => [k, int(v)]).filter(([, v]) => Number(v) > 0))
        : {},
      successByDef: eRaw.successByDef && typeof eRaw.successByDef === 'object'
        ? Object.fromEntries(Object.entries(eRaw.successByDef as Record<string, unknown>).map(([k, v]) => [k, int(v)]).filter(([, v]) => Number(v) > 0))
        : {},
      successCount: int(eRaw.successCount), failedCount: int(eRaw.failedCount),
      playerCompletedCount: int(eRaw.playerCompletedCount), timeoutCount: int(eRaw.timeoutCount),
      cancelledByPriorityCount: int(eRaw.cancelledByPriorityCount), clearedByBattleEndCount: int(eRaw.clearedByBattleEndCount),
      attackInterruptedCount: int(eRaw.attackInterruptedCount), playerDamageTaken: int(eRaw.playerDamageTaken),
      durationMsTotal: int(eRaw.durationMsTotal),
    },
    playerDeathCount: int(r.playerDeathCount),
    minConsciousness: typeof r.minConsciousness === 'number' && Number.isFinite(r.minConsciousness)
      ? Math.max(0, Math.min(100, Math.floor(r.minConsciousness)))
      : null,
    dataQuality: r.dataQuality === 'complete' || r.dataQuality === 'partial' || r.dataQuality === 'invalid' ? r.dataQuality : (finalized ? 'complete' : 'partial'),
    finalized: finalized && result != null,
    finalizedAt: typeof r.finalizedAt === 'number' && isFinite(r.finalizedAt) ? Math.max(0, Math.floor(r.finalizedAt)) : null,
    lastUpdatedAt: int(r.lastUpdatedAt, startedAt),
    eventLog,
    rejectedEvents: [],
    settledEventIds: settled,
    weaknessClues: Array.isArray(r.weaknessClues) ? [...new Set(r.weaknessClues.filter((x): x is string => typeof x === 'string'))].slice(-60) : [],
    weaknessExposureStartedAt: r.weaknessExposureStartedAt && typeof r.weaknessExposureStartedAt === 'object'
      ? Object.fromEntries(Object.entries(r.weaknessExposureStartedAt as Record<string, unknown>).map(([k, v]) => [k, int(v)]))
      : {},
    dynamicStartedAt: r.dynamicStartedAt && typeof r.dynamicStartedAt === 'object'
      ? Object.fromEntries(Object.entries(r.dynamicStartedAt as Record<string, unknown>).map(([k, v]) => [k, int(v)]))
      : {},
    sequence: int(r.sequence),
  };
  return stats;
}

/** 统计存储自愈：活动战斗与当前 battleId 对齐；终结快照进入历史，最多 50 场 */
export function normalizeBossBattleStatsStore(
  raw: unknown,
  liveBattleId: string | null,
  liveResult: Exclude<BossBattleStatsResult, null> | null,
): BossBattleStatsStore {
  const src = raw && typeof raw === 'object' ? raw as Partial<BossBattleStatsStore> : {};
  let active = normalizeBossBattleStats(src.active);
  let history: BossBattleStatsState[] = Array.isArray(src.history)
    ? src.history.map(normalizeBossBattleStats).filter((x): x is BossBattleStatsState => !!x && x.finalized)
    : [];

  if (active) {
    if (active.finalized) {
      history.push(active);
      active = null;
    } else if (liveBattleId && active.battleId === liveBattleId) {
      if (liveResult) {
        active = finalizeBossBattleStats(active, liveResult, active.endedAt || Date.now()).state;
        history.push(active);
        active = null;
      }
    } else if (active.finalized) {
      history.push(active);
      active = null;
    } else {
      active = null;
    }
  }
  const seen = new Set<string>();
  history = history
    .filter(s => (seen.has(s.battleId) ? false : (seen.add(s.battleId), true)))
    .sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0))
    .slice(-MAX_STATS_HISTORY);
  return { active, history };
}

export const BATTLE_STAT_EVENT_LABEL: Record<BossBattleStatEventType, string> = {
  'battle-started': '战斗开始',
  'battle-ended': '战斗结束',
  'phase-started': '阶段开始',
  'phase-completed': '阶段完成',
  'phase-transition': '阶段切换',
  'challenge-result': '挑战结果',
  'attack-telegraph': '攻击预警',
  'attack-started': '攻击开始',
  'attack-result': '攻击判定',
  'attack-cancelled': '攻击取消',
  'attack-interrupted': '攻击中断',
  'damage-taken': '受到伤害',
  'weakness-clue': '弱点线索',
  'weakness-analyzed': '弱点分析',
  'weakness-discovered': '弱点发现',
  'weakness-crack-result': '弱点破解结果',
  'weakness-exposed': '弱点暴露',
  'weakness-recovered': '弱点恢复',
  'weakness-cancelled': '弱点取消',
  'weakness-boss-damage': '弱点伤害',
  'dynamic-triggered': '动态事件触发',
  'dynamic-success': '动态事件成功',
  'dynamic-failed': '动态事件失败',
  'dynamic-timeout': '动态事件超时',
  'dynamic-cancelled': '动态事件取消',
  'dynamic-cleared': '动态事件终结清理',
  'dynamic-attack-interrupted': '动态事件中断攻击',
  'dynamic-damage-taken': '动态事件伤害',
  'player-death': '玩家死亡',
};
