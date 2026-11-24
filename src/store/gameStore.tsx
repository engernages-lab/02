import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { GameEvent, PlayerState, Screen, Toast, GameSettings } from '../game/types';
import { defaultState, exportSave, importSave, loadGame, saveGame, SAVE_VERSION } from '../services/save';
import { normalizeIdentity, validateDisplayName, ORIGIN_CODE, type PlayerIdentity } from '../game/identity';
import { normalizeStoryReadState, markNodeSeen, unlockEvent, recordChoice } from '../game/lore/events';
import { levelById, levelsOfServer } from '../game/levels';
import { levelForExp, toleranceFor } from '../game/progression';
import { recalcAchievements, achievementById } from '../game/achievements';
import { DEFENSE_TASKS } from '../game/defense';
import { bossById } from '../game/bosses';
import { createBattleState, normalizeBattleState, resolveSubmission, phaseHp, type BossBattleState, type SubmissionResult } from '../game/battle';
import { bossBattleDef, bossDifficulties } from '../game/bossDifficulties';
import { difficultyOf, type BossDifficulty } from '../game/difficulty';
import {
  handleBossFirstClear, chapterGate, canEnterServer, bossGate, originCoreGate, markOriginCoreEntered,
  recordBossDifficultyClear, bossRecordOf, verifyBattleState, type BossFirstClearPayload,
  type ChapterGate, type BossGate, type OriginCoreGate,
} from '../game/chapterFlow';
import type { VaultState, RunOutcomeShape } from '../game/types';
import { CREATOR_FRAGMENTS } from '../game/lore/fragments';
import { buildHarness, checkUserCode, combineWithHarness, judgeRun, type JudgeVerdict } from '../services/judge';
import { runPython } from '../services/pythonRunner';
import {
  normalizeRewards, shopItemById,
  chapterRewardOf, type RewardState, type RewardBreakdown, type Grade,
} from '../game/rewards';
import { computeLevelRewardV2, unlocksForLevel } from '../game/economy';
import { slotOf, skinMetaById } from '../game/cosmetics';
import { play, setVolumes, startMusic, stopMusic, isMusicOn } from '../services/sound';
import { clearAllDrafts } from '../services/drafts';
import {
  beginSession, createSession, countRun, countSubmit, countHint, countError, settle,
  buildPassedSettlement, buildFailedSettlement, normalizeSessions,
  type ChallengeSession, type ChallengeSettlement, type ChallengeKind,
} from '../game/challengeSession';
import {
  createChallengeRun, normalizeChallengeRuns,
  recordRun as runCountRun, recordSubmit as runCountSubmit, recordHint as runCountHint,
  complete as runComplete, cancel as runCancel,
  canRun as runCanRun, canSubmit as runCanSubmit, canHint as runCanHint,
  remainingMs, isTimedOut, fixBug, completeStage, markHiddenTest, allStagesDone,
  type ChallengeRunState,
} from '../game/challengeEngine';
import { independentChallengeById } from '../game/challengeTemplates';
import type { ChallengeDef } from '../game/challengeTypes';
import {
  tryTrigger, advance as evAdvance, resolve as evResolve, cancelEvent as evCancel,
  recoverException as evRecover, dismiss as evDismiss,
  normalizeEventState, normalizeCooldowns, eventDefById, isBlocking as evIsBlocking,
  type EngineSnapshot, type DynamicEventState,
} from '../game/eventEngine';
import {
  registerUnknownIntrusion, UNKNOWN_INTRUSION_ID,
  intrusionDataOf, defaultIntrusionData, INTRUSION_RECOVER_STEPS,
} from '../game/events/unknownIntrusion';
import { purchaseItem, useItem as applyUseItem, equipItemById, unequipSlot } from '../game/shopTx';
import type { ShopTransaction, EquipSlot } from '../game/shop';
import { appendLedger, safeCredits } from '../game/economy';
import { safeExp } from '../game/economyConfig';
import {
  createBossPhaseRun, prepareBattle, activateBattle,
  normalizeBossPhaseRun, reconcileBossPhaseRun,
  evaluatePhaseTransition, completePhaseTransition,
  applyDamage, recordChallengeStart, recordChallengeResult, recordDamageReceived,
  finishBattle, interruptBattle, resumeBattle, toBattleRecord, phaseProgressOf,
  normalizeBossBattleHistory, bossBattleEventBus, isTerminalStatus, phaseHpUpper,
  BOSS_BATTLE_STATUS_LABEL, BOSS_BATTLE_EVENTS,
  type BossBattleRunState, type BossBattleEvent, type BossBattleRecord, type BossPhasePlan,
} from '../game/bossPhaseEngine';
import { buildBossPhasePlan } from '../game/bossPhasePlans';
import {
  createBossAttackState, normalizeBossAttackState, tickBossAttack,
  playerDefend, playerDodge, cancelAttack, interruptAttack, syncAttackPhase,
  applyAttackInterference,
  type BossAttackState, type BossAttackStep,
} from '../game/bossAttackEngine';
import { attackPatternsFor } from '../game/bossAttackPatterns';
import {
  createBossWeaknessRun, normalizeWeaknessRun, syncWeaknessPhase, observeWeakness,
  startAnalysis as startWeaknessAnalysisStep, tickWeakness, beginWeaknessCrack,
  completeWeaknessCrack, exposureInfo, setCarryDamage, consumeCarryDamage,
  closeWeaknessRun, activeWeakness, activeEntry, definitionsForPhase,
  type BossWeaknessRunState, type BossWeaknessDefinition, type WeaknessStep, type WeaknessObservation,
} from '../game/bossWeaknessEngine';
import { weaknessDefinitionsFor } from '../game/bossWeaknessCatalog';
import {
  createCombatArbiter, normalizeCombatArbiter, requestExclusive, releaseExclusive, enqueue,
  expireCombatEvents, invalidatePhase, closeCombatArbiter, settleEvent, recordCombatEvent,
  isSettled as isCombatEventSettled, COMBAT_PRIORITY,
  type CombatArbiterState, type CombatEventInput, type CombatEventStatus, type CombatEvent,
} from '../game/combatEventArbiter';
import { resolvePlayerDamage } from '../game/combatDamage';
import {
  createBossBattleStats, recordBossBattleEvent, finalizeBossBattleStats,
  snapshotBossBattleStats, normalizeBossBattleStatsStore,
  BATTLE_STAT_EVENT_LABEL,
  type BossBattleStatsState, type BossBattleStatsStore, type BossBattleStatEventInput,
  type BossBattleStatEventType, type BossBattleStatsResult,
} from '../game/bossBattleStats';
import {
  calculateBossBattleRating, findBossBattleRating, recordBossBattleRating, type BossBattleRatingStore,
} from '../game/bossBattleRating';
import {
  bossLegacyRewardOffset, calculateBossBattleRewards, findBossBattleReward,
  type BossBattleRewardStore,
} from '../game/bossBattleReward';
import { evaluateBossAchievements } from '../game/bossAchievementEngine';
import { evaluateAndApplyBossAchievements } from '../game/bossAchievementStore';
import { archiveBossBattleForPlayer } from '../game/bossBattleArchive';
import {
  defaultMiraState, normalizeMiraState, miraAward, miraUnlockMemory, miraMarkRead,
  miraSceneLine, miraRiskFor, miraMemoryById, MIRA_STAGE_LABEL,
  type MiraState, type MiraScene,
} from '../game/miraCore';
import {
  normalizeExplorationState, discoverRegion as exploreDiscoverRegionPure,
  completeExploreNode, startTerminalChallenge, completeTerminalChallenge,
  type ExplorationState, type ExploreResult,
} from '../game/explorationCore';
import { applyBossBattleRewardGrant } from '../game/bossBattleRewardGrant';

registerUnknownIntrusion();

function chapterIndexForServer(serverId: string): number {
  const map: Record<string, number> = { syntax: 1, logs: 2, storage: 3, factory: 4, diag: 5, core: 6 };
  return map[serverId] || 0;
}

/** 把当前关卡的进行中会话结算为失败（幂等：已结算的会话不再改动） */
function failedSessionsFor(p: PlayerState, levelId: string, reason: string, consciousnessLoss: number): Record<string, ChallengeSession> {
  const sessions = p.progress.challengeSessions || {};
  const cur = sessions[levelId];
  if (!cur || cur.status !== 'active') return sessions;
  const settlement = buildFailedSettlement(cur, {
    now: Date.now(),
    reason,
    levelNow: p.level,
    expNow: p.exp,
    consciousnessLoss,
  });
  return { ...sessions, [levelId]: settle(cur, settlement) };
}

/** Boss 通关：把进行中会话结算为通过（不改动战斗/奖励数据） */
function passedBossSessionsFor(p: PlayerState, bossId: string, expGain: number, creditsGain: number): Record<string, ChallengeSession> {
  const sessions = p.progress.challengeSessions || {};
  const cur = sessions[bossId];
  if (!cur || cur.status !== 'active') return sessions;
  const expBefore = Math.max(0, p.exp - Math.max(0, expGain));
  const settlement = buildPassedSettlement(cur, {
    now: Date.now(),
    levelBefore: levelForExp(expBefore),
    levelAfter: p.level,
    expBefore,
    expAfter: p.exp,
    creditsGained: creditsGain,
  });
  return { ...sessions, [bossId]: settle(cur, settlement) };
}

/** 独立挑战通过结算：经验 / 贡献点按奖励系数入账，会话与运行状态各只结算一次 */
function settleChallengePass(
  p: PlayerState,
  challengeId: string,
  run: ChallengeRunState,
  def: ChallengeDef,
  now: number,
): { player: PlayerState; settlement: ChallengeSettlement; expGained: number; creditsGained: number } {
  const mult = run.rewardMultiplier && isFinite(run.rewardMultiplier) ? run.rewardMultiplier : 1;
  const expGained = Math.max(0, Math.round((def.rewardExp || 0) * mult));
  const creditsGained = Math.max(0, Math.round((def.rewardExp || 0) * 2 * mult));
  const expBefore = p.exp;
  const expAfter = safeExp(p.exp + expGained);
  const levelAfter = levelForExp(expAfter);
  const sessionBase = beginSession(
    p.progress.challengeSessions?.[challengeId] || null, challengeId, 'level', now, toleranceFor(p.level),
  );
  const settlement = buildPassedSettlement(sessionBase, {
    now, levelBefore: p.level, levelAfter, expBefore, expAfter, creditsGained,
  });
  const rw = normalizeRewards(p.rewards);
  const player: PlayerState = {
    ...p,
    exp: expAfter,
    level: levelAfter,
    rewards: {
      ...rw,
      credits: safeCredits(rw.credits + creditsGained),
      ledger: appendLedger(rw.ledger, { kind: 'challenge', ref: challengeId, credits: creditsGained, exp: expGained, at: now }),
    },
    progress: {
      ...p.progress,
      challengeRuns: { ...(p.progress.challengeRuns || {}), [challengeId]: runComplete(run, now, 'passed') },
      challengeSessions: normalizeSessions({ ...(p.progress.challengeSessions || {}), [challengeId]: settle(sessionBase, settlement) }),
    },
  };
  return { player, settlement, expGained, creditsGained };
}

/** 独立挑战失败结算（超时 / 提交次数用尽 / 放弃）：只结算一次，独立挑战不惩罚意识值 */
function settleChallengeFailed(p: PlayerState, challengeId: string, run: ChallengeRunState, reason: string, now: number): PlayerState {
  const sessionBase = beginSession(
    p.progress.challengeSessions?.[challengeId] || null, challengeId, 'level', now, toleranceFor(p.level),
  );
  const settlement = buildFailedSettlement(sessionBase, { now, reason, levelNow: p.level, expNow: p.exp, consciousnessLoss: 0 });
  return {
    ...p,
    progress: {
      ...p.progress,
      challengeRuns: { ...(p.progress.challengeRuns || {}), [challengeId]: runComplete(run, now, 'failed') },
      challengeSessions: normalizeSessions({ ...(p.progress.challengeSessions || {}), [challengeId]: settle(sessionBase, settlement) }),
    },
  };
}

// ---------- 多阶段 Boss 战斗（V1.3-B.1） ----------

function battleDifficultyOf(raw: unknown, fallback?: BossDifficulty): BossDifficulty {
  if (raw && typeof raw === 'object') {
    const d = (raw as { difficulty?: unknown }).difficulty;
    if (d === 'hard' || d === 'expert' || d === 'easy') return d;
  }
  return fallback || 'easy';
}

/** 读取某个 Boss 的多阶段运行状态（带自愈）；配置缺失返回 null */
function phaseRuntimeOf(p: PlayerState, bossId: string): { plan: BossPhasePlan; run: BossBattleRunState | null; difficulty: BossDifficulty } | null {
  const battleRaw = (p.progress.battles || {})[bossId];
  const difficulty = battleDifficultyOf(battleRaw, p.progress.bossBattles?.[bossId]?.difficulty);
  const plan = buildBossPhasePlan(bossId, difficulty);
  if (!plan) return null;
  const run = normalizeBossPhaseRun((p.progress.bossBattles || {})[bossId], plan, Date.now());
  return { plan, run, difficulty };
}

/** 写入运行状态 + 阶段进度 +（已终结时）战斗历史；全部字段均经自愈 */
function withPhaseRun(p: PlayerState, run: BossBattleRunState): PlayerState {
  const progress = {
    ...p.progress,
    bossBattles: { ...(p.progress.bossBattles || {}), [run.bossId]: run },
  };
  const prev = p.progress.bossPhaseProgress?.[run.bossId];
  const current = phaseProgressOf(run);
  progress.bossPhaseProgress = {
    ...(p.progress.bossPhaseProgress || {}),
    [run.bossId]: {
      highestPhaseIndex: Math.max(prev?.highestPhaseIndex ?? 0, current.highestPhaseIndex),
      clearedPhases: [...new Set([...(prev?.clearedPhases || []), ...current.clearedPhases])].slice(-16),
      updatedAt: Date.now(),
    },
  };
  const record = toBattleRecord(run);
  if (record) {
    progress.bossBattleHistory = normalizeBossBattleHistory(
      [...(p.progress.bossBattleHistory || []), record],
      buildBossPhasePlan,
      Date.now(),
    );
  }
  return { ...p, progress };
}

function phaseStatusText(run: BossBattleRunState): string {
  return BOSS_BATTLE_STATUS_LABEL[run.status] || run.status;
}

/** 读取攻击状态（未创建时返回内存初始态，不写存档；刷新后的安全恢复由 save normalize 负责） */
function readBossAttackState(
  p: PlayerState,
  bossId: string,
  run: BossBattleRunState,
  plan: BossPhasePlan,
  now: number,
): BossAttackState {
  const phase = plan.phases[run.currentPhaseIndex] || plan.phases[0];
  const raw = (p.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
  if (raw && raw.bossId === bossId && raw.battleId === run.battleId && typeof raw.attackState === 'string') return raw;
  return createBossAttackState(run.battleId, bossId, phase.phaseId, run.currentPhaseIndex, now);
}

function withBossAttack(p: PlayerState, state: BossAttackState): PlayerState {
  return {
    ...p,
    progress: {
      ...p.progress,
      bossAttacks: { ...(p.progress.bossAttacks || {}), [state.bossId]: state },
    },
  };
}

function withoutBossAttack(p: PlayerState, bossId: string): PlayerState {
  const map = { ...(p.progress.bossAttacks || {}) };
  delete map[bossId];
  return { ...p, progress: { ...p.progress, bossAttacks: map } };
}

// ---------- Boss 弱点（V1.3-B.3） ----------

function weaknessDefsForRun(bossId: string, run: BossBattleRunState): BossWeaknessDefinition[] {
  return weaknessDefinitionsFor(bossId, run.difficulty);
}

function readWeaknessRun(
  p: PlayerState,
  bossId: string,
  run: BossBattleRunState,
  plan: BossPhasePlan,
  now: number,
): BossWeaknessRunState {
  const defs = weaknessDefsForRun(bossId, run);
  const phase = plan.phases[run.currentPhaseIndex] || plan.phases[0];
  const raw = (p.progress.bossWeaknesses || {})[bossId];
  // 进行中的破解/暴露必须读取原状态：normalize 只用于加载存档，不能把 exploiting 当作刷新失败
  if (raw && raw.bossId === bossId && raw.battleId === run.battleId &&
      raw.phaseId === phase.phaseId && raw.phaseIndex === run.currentPhaseIndex &&
      defs.every(d => !!raw.entries[d.weaknessId])) {
    return raw;
  }
  return normalizeWeaknessRun(raw, defs, {
    bossId, battleId: run.battleId, phaseId: phase.phaseId, phaseIndex: run.currentPhaseIndex, now,
  });
}

function withBossWeakness(p: PlayerState, state: BossWeaknessRunState): PlayerState {
  return {
    ...p,
    progress: {
      ...p.progress,
      bossWeaknesses: { ...(p.progress.bossWeaknesses || {}), [state.bossId]: state },
    },
  };
}

function withoutBossWeakness(p: PlayerState, bossId: string): PlayerState {
  const map = { ...(p.progress.bossWeaknesses || {}) };
  delete map[bossId];
  return { ...p, progress: { ...p.progress, bossWeaknesses: map } };
}

function hasActiveWeaknessState(state: BossWeaknessRunState): boolean {
  return Object.values(state.entries).some(e => e.status === 'analyzing' || e.status === 'exploiting' || e.status === 'exposed');
}

// ---------- 战斗事件仲裁（V1.3-B.4） ----------

function readCombatArbiter(
  p: PlayerState,
  bossId: string,
  run: BossBattleRunState,
  plan: BossPhasePlan,
  now: number,
): CombatArbiterState {
  // 阶段切换演出期间使用目标阶段，避免瞬态锁被旧阶段 normalization 清空
  const phaseIndex = run.status === 'phase_transition' && run.transition
    ? Math.min(run.transition.toIndex, plan.phases.length - 1)
    : run.currentPhaseIndex;
  const phase = plan.phases[phaseIndex] || plan.phases[0];
  const raw = p.progress.combatArbiter;
  // 进行中战斗直接读取原始仲裁状态：normalize 只用于加载存档，不能每 tick 清空活动锁
  if (raw && raw.bossId === bossId && raw.battleId === run.battleId && raw.phaseId === phase.phaseId) return raw;
  return normalizeCombatArbiter(raw, {
    battleId: run.battleId, bossId, phaseId: phase.phaseId, now,
  });
}

function withCombatArbiter(p: PlayerState, state: CombatArbiterState): PlayerState {
  return { ...p, progress: { ...p.progress, combatArbiter: state } };
}

function withoutCombatArbiter(p: PlayerState): PlayerState {
  return { ...p, progress: { ...p.progress, combatArbiter: undefined } };
}

function combatEventId(kind: string, battleId: string, token: string | number): string {
  return kind + ':' + battleId + ':' + token;
}

function closeCombatForPlayer(
  p: PlayerState,
  bossId: string,
  terminalType: 'death' | 'victory' | 'defeat' | 'retreat' | 'rebirth',
  now: number,
): PlayerState {
  const runtime = phaseRuntimeOf(p, bossId);
  let next = p;
  const activeStats = activeStatsOf(p, bossId);
  if (activeStats && p.progress.dynamicEvent) {
    const dyn = p.progress.dynamicEvent;
    next = recordStatsInPlayer(next, bossId, {
      eventId: 'dynamic-clear:' + activeStats.battleId + ':' + dyn.id,
      eventType: 'dynamic-cleared',
      source: 'battle-terminal',
      occurredAt: now,
      payload: { instanceId: dyn.id, defId: dyn.defId, reason: terminalType },
    }, now);
  }
  if (activeStats) {
    next = finalizeStatsInPlayer(next, bossId, statsResultForTerminal(terminalType), now);
  }
  if (!runtime || !runtime.run) {
    return { ...next, progress: { ...next.progress, dynamicEvent: null } };
  }
  const arbiter = readCombatArbiter(next, bossId, runtime.run, runtime.plan, now);
  const closed = closeCombatArbiter(arbiter, terminalType, now, {
    eventId: combatEventId('terminal', runtime.run.battleId, terminalType + '@' + now),
    eventType: terminalType,
    priority: COMBAT_PRIORITY.TERMINAL,
    payload: { reason: terminalType },
  });
  return {
    ...next,
    progress: { ...next.progress, combatArbiter: closed.state, dynamicEvent: null },
  };
}

function closeCombatForPlayerWithEvents(
  p: PlayerState,
  bossId: string,
  terminalType: 'death' | 'victory' | 'defeat' | 'retreat' | 'rebirth',
  now: number,
): { player: PlayerState; events: ReturnType<typeof closeCombatArbiter>['events'] } {
  const runtime = phaseRuntimeOf(p, bossId);
  if (!runtime || !runtime.run) return { player: { ...p, progress: { ...p.progress, dynamicEvent: null } }, events: [] };
  const arbiter = readCombatArbiter(p, bossId, runtime.run, runtime.plan, now);
  const closed = closeCombatArbiter(arbiter, terminalType, now, {
    eventId: combatEventId('terminal', runtime.run.battleId, terminalType + '@' + now),
    eventType: terminalType,
    priority: COMBAT_PRIORITY.TERMINAL,
    payload: { reason: terminalType },
  });
  return {
    player: {
      ...p,
      progress: { ...p.progress, combatArbiter: closed.state, dynamicEvent: null },
    },
    events: closed.events,
  };
}

// ---------- Boss 战斗统计（V1.3-B.5.1） ----------

function statsStoreOf(p: PlayerState): BossBattleStatsStore {
  return p.progress.bossBattleStats || { active: null, history: [] };
}

function withStatsStore(p: PlayerState, store: BossBattleStatsStore): PlayerState {
  return { ...p, progress: { ...p.progress, bossBattleStats: store } };
}

function activeStatsOf(p: PlayerState, bossId: string): BossBattleStatsState | null {
  const active = statsStoreOf(p).active;
  return active && active.bossId === bossId && !active.finalized ? active : null;
}

function recordStatsInPlayer(p: PlayerState, bossId: string, input: BossBattleStatEventInput, now: number): PlayerState {
  const store = statsStoreOf(p);
  const active = store.active;
  if (!active || active.bossId !== bossId) return p;
  const result = recordBossBattleEvent(active, input, now);
  if (result.state === active) return p;
  return withStatsStore(p, { ...store, active: result.state });
}

function finalizeStatsInPlayer(
  p: PlayerState,
  bossId: string,
  result: Exclude<BossBattleStatsResult, null>,
  now: number,
): PlayerState {
  const store = statsStoreOf(p);
  const active = store.active;
  if (!active || active.bossId !== bossId || active.finalized) return p;
  const finalized = finalizeBossBattleStats(active, result, now).state;
  const history = [...store.history, finalized]
    .filter((s, i, arr) => arr.findIndex(x => x.battleId === s.battleId) === i)
    .slice(-50);
  return withStatsStore(p, { active: null, history });
}

function statsResultForTerminal(type: 'death' | 'victory' | 'defeat' | 'retreat' | 'rebirth'): Exclude<BossBattleStatsResult, null> {
  if (type === 'victory') return 'victory';
  if (type === 'retreat') return 'retreat';
  if (type === 'rebirth') return 'interrupted';
  return 'defeat';
}

// ---------- Boss 战斗评价（V1.3-B.5.2） ----------

function ratingsStoreOf(p: PlayerState): BossBattleRatingStore {
  return p.progress.bossBattleRatings || { history: [] };
}

function withRatingsStore(p: PlayerState, store: BossBattleRatingStore): PlayerState {
  return { ...p, progress: { ...p.progress, bossBattleRatings: store } };
}

/** 胜利终结后基于 B.5.1 最终快照生成评分；失败不影响战斗结算 */
function rateVictoryInPlayer(p: PlayerState, bossId: string, now: number): PlayerState {
  try {
    const stats = statsStoreOf(p).history
      .filter(s => s.bossId === bossId && s.finalized && s.result === 'victory')
      .sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0))
      .pop();
    if (!stats) return p;
    const rating = calculateBossBattleRating(stats, now);
    const written = recordBossBattleRating(ratingsStoreOf(p), rating);
    return written.added ? withRatingsStore(p, written.store) : p;
  } catch {
    return p;
  }
}

// ---------- Boss 战斗奖励（V1.3-B.5.3） ----------

function rewardStoreOf(p: PlayerState): BossBattleRewardStore {
  return p.progress.bossBattleRewards || { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
}

/**
 * Boss 首次通过某难度后发放 B.5.3 增量奖励。
 * 基础/难度奖励仍由现有首胜与难度事务发放；这里只补评分与表现增量。
 * 整个过程在 gameStore 的单次状态更新中完成；失败不影响战斗胜利。
 */
function grantVictoryRewardsInPlayer(
  p: PlayerState,
  bossId: string,
  difficulty: BossDifficulty,
  firstDifficultyReward: boolean,
  now: number,
): PlayerState {
  if (!firstDifficultyReward) return p;
  try {
    const stats = statsStoreOf(p).history
      .filter(s => s.bossId === bossId && s.finalized && s.result === 'victory')
      .sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0))
      .pop();
    if (!stats) return p;
    const rating = findBossBattleRating(ratingsStoreOf(p), stats.battleId);
    const reward = calculateBossBattleRewards({
      stats,
      rating,
      bossId,
      difficulty,
      battleResult: 'victory',
      firstDifficultyReward: true,
      legacyGranted: bossLegacyRewardOffset(bossId, difficulty),
      now,
    });
    if (!reward.eligible || reward.rejectionReason) return p;
    const applied = applyBossBattleRewardGrant(p, reward, rewardStoreOf(p), now);
    return applied.added ? applied.player : p;
  } catch {
    return p;
  }
}

// ---------- Boss 隐藏成就（V1.3-B.5.4） ----------

function evaluateAchievementsInPlayer(
  p: PlayerState,
  bossId: string,
  difficulty: BossDifficulty,
  now: number,
): PlayerState {
  try {
    const stats = statsStoreOf(p).history
      .filter(s => s.bossId === bossId && s.finalized && s.result === 'victory')
      .sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0))
      .pop();
    if (!stats) return p;
    const rating = findBossBattleRating(ratingsStoreOf(p), stats.battleId);
    const reward = findBossBattleReward(rewardStoreOf(p), stats.battleId);
    const unlockedIds = (p.progress.bossAchievements?.unlocked || []).map(u => u.achievementId);
    const evaluation = evaluateBossAchievements({
      stats,
      rating,
      reward,
      bossId,
      difficulty,
      battleResult: 'victory',
      unlockedIds,
      now,
    });
    const applied = evaluateAndApplyBossAchievements(p, evaluation, now);
    return applied.player;
  } catch {
    return p;
  }
}

function startStatsForRun(
  p: PlayerState,
  bossId: string,
  run: BossBattleRunState,
  plan: BossPhasePlan,
  now: number,
  reset: boolean,
): PlayerState {
  const store = statsStoreOf(p);
  if (!reset && store.active && store.active.battleId === run.battleId && !store.active.finalized) return p;
  let next = p;
  if (store.active) {
    const old = store.active;
    if (old.finalized) {
      next = withStatsStore(next, { active: null, history: [...store.history, old].slice(-50) });
    } else {
      const finalized = finalizeBossBattleStats(old, 'interrupted', now).state;
      next = withStatsStore(next, { active: null, history: [...store.history, finalized].slice(-50) });
    }
  }
  const boss = bossById(bossId);
  const phase = plan.phases[run.currentPhaseIndex] || plan.phases[0];
  let stats = createBossBattleStats({
    battleId: run.battleId,
    bossId,
    bossName: boss ? boss.codename + ' · ' + boss.title : bossId.toUpperCase(),
    difficulty: run.difficulty,
    startedAt: run.startedAt > 0 ? run.startedAt : now,
    phaseId: phase.phaseId,
    phaseIndex: run.currentPhaseIndex,
    consciousness: p.consciousness,
  });
  const started = recordBossBattleEvent(stats, {
    eventId: 'battle-start:' + run.battleId,
    eventType: 'battle-started',
    phaseId: phase.phaseId,
    source: 'gameStore',
    occurredAt: stats.startedAt,
  }, now);
  stats = started.state;
  return withStatsStore(next, { ...statsStoreOf(next), active: stats });
}

/** B.1~B.4 事件总线 → 统计事件映射（仅记录，不修改战斗） */
function statsEventFromBus(ev: BossBattleEvent): BossBattleStatEventInput | null {
  const base = { eventId: ev.id, phaseId: ev.phaseId, occurredAt: ev.at, source: 'bossBattleEventBus' };
  switch (ev.type) {
    case BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH:
      return { ...base, eventType: 'attack-telegraph', payload: { attackId: ev.attackId, attackType: ev.payload.attackType } };
    case BOSS_BATTLE_EVENTS.ATTACK_STARTED:
      return { ...base, eventType: 'attack-started', payload: { attackId: ev.attackId } };
    case BOSS_BATTLE_EVENTS.ATTACK_HIT:
      return { ...base, eventType: 'attack-result', payload: { result: 'hit', response: ev.payload.response, attackId: ev.attackId, hitIndex: ev.payload.hitIndex } };
    case BOSS_BATTLE_EVENTS.ATTACK_BLOCKED:
      return { ...base, eventType: 'attack-result', payload: { result: 'blocked', response: ev.payload.response, attackId: ev.attackId, hitIndex: ev.payload.hitIndex } };
    case BOSS_BATTLE_EVENTS.ATTACK_DODGED:
      return { ...base, eventType: 'attack-result', payload: { result: 'dodged', response: ev.payload.response, attackId: ev.attackId, hitIndex: ev.payload.hitIndex } };
    case BOSS_BATTLE_EVENTS.ATTACK_CANCELLED:
      return { ...base, eventType: 'attack-cancelled', payload: { reason: ev.payload.reason } };
    case BOSS_BATTLE_EVENTS.ATTACK_INTERRUPTED:
      return { ...base, eventType: 'attack-interrupted', payload: { reason: ev.payload.reason } };
    case BOSS_BATTLE_EVENTS.WEAKNESS_HINT:
      if (ev.payload.phase === 'analyzing') {
        return { ...base, eventType: 'weakness-analyzed', payload: { weaknessId: ev.weaknessId } };
      }
      return { ...base, eventType: 'weakness-clue', payload: { clueId: ev.payload.clueId, weaknessId: ev.weaknessId } };
    case BOSS_BATTLE_EVENTS.WEAKNESS_DISCOVERED:
      return { ...base, eventType: 'weakness-discovered', payload: { weaknessId: ev.weaknessId, name: ev.payload.name } };
    case BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_SUCCESS:
      return { ...base, eventType: 'weakness-crack-result', payload: { outcome: 'success', weaknessId: ev.weaknessId } };
    case BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_FAILED:
      return { ...base, eventType: 'weakness-crack-result', payload: { outcome: 'failure', weaknessId: ev.weaknessId } };
    case BOSS_BATTLE_EVENTS.WEAKNESS_EXPOSED:
      return { ...base, eventType: 'weakness-exposed', payload: { weaknessId: ev.weaknessId } };
    case BOSS_BATTLE_EVENTS.WEAKNESS_RECOVERED:
      return { ...base, eventType: 'weakness-recovered', payload: { weaknessId: ev.weaknessId, reason: ev.payload.reason } };
    case BOSS_BATTLE_EVENTS.WEAKNESS_CANCELLED:
      return { ...base, eventType: 'weakness-cancelled', payload: { weaknessId: ev.weaknessId, reason: ev.payload.reason } };
    case BOSS_BATTLE_EVENTS.PHASE_STARTED:
      return { ...base, eventType: 'phase-started', payload: { phaseIndex: ev.payload.phaseIndex, phaseName: ev.payload.phaseName } };
    case BOSS_BATTLE_EVENTS.PHASE_COMPLETED:
      return { ...base, eventType: 'phase-completed', payload: {} };
    case BOSS_BATTLE_EVENTS.PHASE_TRANSITION:
      return { ...base, eventType: 'phase-transition', payload: { toIndex: ev.payload.toIndex, toPhaseName: ev.payload.toPhaseName } };
    default:
      return null;
  }
}

function recordStatsFromBusEvent(p: PlayerState, ev: BossBattleEvent): PlayerState {
  const active = statsStoreOf(p).active;
  if (!active || active.battleId !== ev.battleId) return p;
  const input = statsEventFromBus(ev);
  if (!input) return p;
  return recordStatsInPlayer(p, ev.bossId, input, ev.at);
}

/** B.2 攻击事件 → 弱点线索观察 */
function miraFromBattleEvent(p: PlayerState, ev: BossBattleEvent): { player: PlayerState; award: ReturnType<typeof miraAward> | null; sceneText: string | null } {
  let state = normalizeMiraState(p.mira);
  let award: ReturnType<typeof miraAward> | null = null;
  let scene: MiraScene | null = null;
  const input = (eventId: string, xp: number, source: string, memoryId?: string) =>
    miraAward(state, { eventId, xp, source, memoryId, now: ev.at });
  if (ev.type === BOSS_BATTLE_EVENTS.VICTORY && ev.battleId) {
    award = input('mira:boss:victory:' + ev.battleId, 30, 'boss', 'mira-boss-victory');
    scene = 'boss-victory';
  } else if (ev.type === BOSS_BATTLE_EVENTS.DEFEAT || ev.type === BOSS_BATTLE_EVENTS.INTERRUPTED) {
    scene = 'boss-defeat';
  } else if (ev.type === BOSS_BATTLE_EVENTS.PHASE_TRANSITION && ev.battleId) {
    const tid = String(ev.payload?.transitionId || ev.id);
    award = input('mira:boss:phase:' + ev.battleId + ':' + tid, 5, 'boss');
    scene = 'boss-phase';
  } else if (ev.type === BOSS_BATTLE_EVENTS.WEAKNESS_DISCOVERED && ev.battleId && ev.weaknessId) {
    award = input('mira:boss:weakness:' + ev.battleId + ':' + ev.weaknessId, 5, 'boss');
  }
  let sceneText: string | null = null;
  if (award?.changed) state = award.state;
  if (scene) {
    const line = miraSceneLine(scene, state, {}, ev.at);
    if (line.changed) { state = line.state; sceneText = line.text; }
  }
  return { player: { ...p, mira: state }, award, sceneText };
}

function attackObservationOf(ev: BossBattleEvent): WeaknessObservation | null {
  if (ev.type === BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH) {
    const attackType = typeof ev.payload.attackType === 'string' ? ev.payload.attackType as import('../game/bossAttackEngine').BossAttackType : undefined;
    return { kind: 'attack-telegraph', attackId: ev.attackId || undefined, attackType };
  }
  if (ev.type === BOSS_BATTLE_EVENTS.ATTACK_HIT) return { kind: 'attack-result', attackId: ev.attackId || undefined, result: 'hit' };
  if (ev.type === BOSS_BATTLE_EVENTS.ATTACK_BLOCKED) return { kind: 'attack-result', attackId: ev.attackId || undefined, result: 'blocked' };
  if (ev.type === BOSS_BATTLE_EVENTS.ATTACK_DODGED) return { kind: 'attack-result', attackId: ev.attackId || undefined, result: 'dodged' };
  if (ev.type === BOSS_BATTLE_EVENTS.ATTACK_STARTED) return { kind: 'attack-started', attackId: ev.attackId || undefined };
  if (ev.type === BOSS_BATTLE_EVENTS.ATTACK_RESOLVED) return { kind: 'attack-resolved', attackId: ev.attackId || undefined };
  return null;
}

export interface CompletePayload {
  levelId: string;
  firstTime: boolean;
  expGained: number;
  levelUp: boolean;
  oldLevel: number;
  newLevel: number;
  stars: number;
  newAchievements: string[];
  /** 本次新解锁的外观（等级解锁） */
  unlocks?: string[];
  /** 奖励系统结算（旧调用方可忽略） */
  reward?: {
    breakdown: RewardBreakdown;
    fails: number;
    hints: number;
    creditsTotal: number;
    trustTotal: number;
    trustUp: boolean;
    chapterReward?: { id: string; title: string; desc: string; credits: number; skins: string[]; items: Record<string, number>; fragment?: string };
    duplicate: boolean;
  };
  /** 统一挑战会话结算（A4 起，结算面板的唯一数据源） */
  session?: ChallengeSettlement;
  /** A5：本次经验是否吃到增幅（true 时面板显示倍率） */
  expBoosted?: boolean;
  expBoostMult?: number;
}

export interface FailPayload { n: number; tolerance: number; triggered: boolean; protectedBy?: 'guard' | 'shield' }

/** Boss 攻击提交结果（由 store 统一执行真实 Python 判题 + 战斗结算 + 首胜事务） */
export type BossAttackStatus = 'blocked' | 'timeout' | 'error' | 'miss' | 'hit' | 'victory' | 'simulation' | 'simVictory';

export interface DifficultyClearInfo {
  difficulty: BossDifficulty;
  exp: number;
  credits: number;
  badgeId: string | null;
  titleUnlocked: string | null;
  firstTime: boolean;
}

export interface BossAttackResult {
  status: BossAttackStatus;
  /** 被门禁拒绝 / 安全策略阻止 / 首胜校验失败的原因 */
  reason?: string;
  denied?: boolean;
  run?: RunOutcomeShape;
  verdict?: JudgeVerdict;
  result?: SubmissionResult;
  /** 首次击败时由统一事务返回（幂等，只会出现一次） */
  firstClear?: BossFirstClearPayload | null;
  /** 模拟再战完成时返回（不发碎片/章节奖励） */
  difficultyClear?: DifficultyClearInfo | null;
  /** 本次是否触发 Boss 反击（意识下降） */
  countered?: boolean;
  toleranceTriggered?: boolean;
  /** V1.3-B.3：弱点加成造成的额外伤害 / 使用的倍率 */
  weaknessDamage?: number;
  weaknessMultiplier?: number;
}

export interface WeaknessCrackResult {
  status: 'blocked' | 'success' | 'failure' | 'timeout' | 'error';
  reason?: string;
  run?: RunOutcomeShape;
  verdict?: JudgeVerdict;
  weaknessState?: BossWeaknessRunState | null;
  exposureRemainingMs?: number;
}

/** 独立挑战提交结果（由 store 统一执行真实判题 + 单次结算） */
export interface ChallengeSubmitResult {
  status: 'blocked' | 'timeout' | 'error' | 'fail' | 'pass';
  reason?: string;
  run?: RunOutcomeShape;
  verdict?: JudgeVerdict;
  settlement?: ChallengeSettlement;
  expGained?: number;
  creditsGained?: number;
  /** 隐藏测试通过/总数（只暴露数量，绝不暴露表达式） */
  hiddenPassed?: number;
  hiddenTotal?: number;
  /** 结算后的运行状态（供页面刷新展示） */
  runState?: ChallengeRunState | null;
}

interface GameCtx {
  player: PlayerState;
  screen: Screen;
  event: GameEvent;
  toasts: Toast[];
  saveCorrupted: string | null;
  hasSave: boolean;
  tolerance: number;
  nav: (s: Screen) => void;
  toast: (kind: Toast['kind'], text: string) => void;
  /** V1.3-C：MIRA 首次连接 / 记忆已读 / 场景反馈（写入 MIRA 自身数据，不触碰战斗） */
  miraEnsureContact: () => void;
  miraMarkMemoryRead: (memoryId: string) => void;
  miraSay: (scene: MiraScene, ctx?: Record<string, string | number>) => string;
  /** V1.3-D：数字世界探索（只读写探索状态；挑战/奖励复用现有系统） */
  explorationStateOf: () => ExplorationState;
  exploreRegion: (regionId: string) => void;
  exploreInteract: (regionId: string, nodeId: string) => { ok: boolean; reason?: string; credits?: number };
  exploreStartChallenge: (regionId: string, nodeId: string) => { ok: boolean; reason?: string };
  startNewGame: () => void;
  setCurrentLevel: (id: string | null) => void;
  setCurrentBoss: (id: string | null) => void;
  /** 当前选中的独立挑战 id（导航用，不写入存档） */
  currentChallengeId: string | null;
  setCurrentChallenge: (id: string | null) => void;
  completeBoss: (bossId: string) => BossFirstClearPayload | null;
  beginBossBattle: (bossId: string, difficulty?: BossDifficulty) => BossBattleState | null;
  /** 难度选择界面「开始挑战」：按所选难度重置整场战斗（已首胜则为模拟再战） */
  startBossBattle: (bossId: string, difficulty: BossDifficulty) => BossBattleState | null;
  /** 放弃当前进行中的战斗（只清战斗进度，不影响永久奖励），用于重新选择难度 */
  abandonBossBattle: (bossId: string) => void;
  /** 读取 Boss 难度记录（最高难度 / 各难度通关） */
  bossRecord: (bossId: string) => import('../game/types').BossRecord;
  /** 唯一的 Boss 攻击入口：真实判题 → 伤害 → 首胜事务 */
  submitBossAttack: (bossId: string, phaseIndex: number, code: string) => Promise<BossAttackResult>;
  /** 读取多阶段 Boss 运行状态（自愈后的只读快照） */
  bossPhaseRunOf: (bossId: string) => BossBattleRunState | null;
  /** 完成阶段切换（演出结束后调用；幂等，重复调用不会重复初始化） */
  completeBossPhaseTransition: (bossId: string) => BossBattleRunState | null;
  /** 推进 Boss 攻击生命周期（页面单一调度入口；无变化不写存档） */
  tickBossAttack: (bossId: string) => void;
  /** 读取 Boss 攻击状态（只读） */
  bossAttackStateOf: (bossId: string) => BossAttackState | null;
  /** 玩家防御：预警/攻击阶段有效，姿态持续时间内命中才减伤 */
  defendBossAttack: (bossId: string) => { ok: boolean; reason?: string; message?: string };
  /** 玩家闪避：攻击模式闪避窗口内命中才成功 */
  dodgeBossAttack: (bossId: string) => { ok: boolean; reason?: string; message?: string };
  /** 读取 Boss 弱点状态（只读） */
  bossWeaknessStateOf: (bossId: string) => BossWeaknessRunState | null;
  /** 推进弱点分析 / 暴露恢复 / 冷却（页面单一定时器调用） */
  tickBossWeakness: (bossId: string) => void;
  /** 线索足够后启动分析（需要真实等待分析完成） */
  analyzeBossWeakness: (bossId: string) => { ok: boolean; reason?: string; message?: string };
  /** 弱点破解：真实 Python Runner + Judge，成功后弱点暴露并干扰 Boss 攻击 */
  submitWeaknessCrack: (bossId: string, code: string) => Promise<WeaknessCrackResult>;
  /** 弱点破解覆盖层打开时暂停 Boss 自动攻击（获取 P3 仲裁锁；更高优先级可拒绝/抢占） */
  setBossCombatPaused: (bossId: string, paused: boolean) => { ok: boolean; reason?: string };
  /** 读取战斗事件仲裁状态（活动锁 / 队列 / 记录） */
  combatArbiterStateOf: (bossId: string) => CombatArbiterState | null;
  /** 推进仲裁器：过期清理、动态事件锁恢复、攻击锁一致性 */
  tickCombatArbiter: (bossId: string) => void;
  /** 仅 DEV：触发一次终结死亡，用于验证所有战斗事件停止 */
  devForcePlayerDeath: (bossId: string) => void;
  /** 仅 DEV：模拟 Boss 胜利终结（不发奖励 / 不推进章节），用于验证事件停止 */
  devForceBossVictory: (bossId: string) => void;
  /** 仅 DEV：清空动态事件冷却，便于连续触发仲裁测试 */
  devResetDynamicEventCooldowns: () => void;
  /** 确保当前进行中 Boss 战存在统计数据（旧存档/中途进入自愈） */
  ensureBossBattleStats: (bossId: string) => void;
  /** 章节门禁（真实状态读取，所有正式入口共用） */
  chapterGateOf: (chapterId: string) => ChapterGate;
  /** 服务器入口门禁（旧档继承放行记录在 legacy 标记里） */
  serverGate: (serverId: string) => { ok: boolean; reason: string; legacy: boolean };
  /** Boss 入口门禁（含原初核心校验 / 模拟再战） */
  bossEntryGate: (bossId: string) => BossGate;
  /** 原初核心门禁（前五枚碎片校验） */
  originCoreGateNow: () => OriginCoreGate;
  recordBug: (entryId: string) => void;
  recordEnding: (endingId: string) => void;
  markVaultRead: (fragmentId: string) => void;
  markVaultFinalSeen: () => void;
  setVaultLastOpened: (id: string | null) => void;
  buyShopItem: (itemId: string) => { ok: boolean; reason?: string };
  /** A5 统一购买：数量/请求 id 由 UI 生成，价格与限购由业务层重新校验 */
  purchaseShopItem: (itemId: string, qty?: number, requestId?: string) => {
    ok: boolean; reason?: string; duplicate?: boolean; transaction?: ShopTransaction | null; charged?: number;
  };
  /** A5 使用道具（恢复意识 / 激活增益） */
  useShopItem: (itemId: string) => { ok: boolean; reason?: string; message?: string };
  equipItem: (itemId: string) => { ok: boolean; reason?: string };
  unequipItem: (slot: EquipSlot) => { ok: boolean; reason?: string };
  /** 挑战页提示：消耗提示券，不计入本关提示层数 */
  consumeHintTicket: () => boolean;
  consumeItem: (itemId: string) => boolean;
  restoreConsciousness: (amount: number) => void;
  markArchiveRead: (archiveId: string) => void;
  completeLevel: (levelId: string) => CompletePayload | null;
  recordFail: (levelId: string) => FailPayload;
  /** 进入/恢复一次挑战会话（进行中的会话保留统计；已结算的会新开） */
  beginChallenge: (id: string, kind?: ChallengeKind) => ChallengeSession;
  /** 预览运行一次（只影响本会话的运行次数） */
  recordRun: (id: string) => void;
  /** 正式提交一次（只影响本会话的提交次数） */
  recordSubmit: (id: string) => void;
  /** 独立挑战：进入/恢复运行状态（进行中保留，已终结则新开） */
  enterChallenge: (challengeId: string) => ChallengeRunState | null;
  /** 读取当前运行状态（只读） */
  challengeRunOf: (challengeId: string) => ChallengeRunState | null;
  /** 预览运行一次（诊断，不等于提交） */
  recordChallengeRun: (challengeId: string) => boolean;
  /** 消耗一次挑战提示 */
  recordChallengeHint: (challengeId: string) => boolean;
  /** 唯一提交入口：真实判题 + 单次结算 */
  submitChallenge: (challengeId: string, code: string) => Promise<ChallengeSubmitResult>;
  /** 放弃当前挑战（正确清理） */
  cancelChallenge: (challengeId: string) => void;
  /** 限时挑战到期：一次性结算失败（幂等） */
  timeoutChallenge: (challengeId: string) => boolean;
  /** 动态事件：触发 */
  triggerDynamicEvent: (defId: string) => { ok: boolean; reason?: string };
  /** 动态事件：推进生命周期（presenting→active / active→超时） */
  advanceDynamicEvent: () => void;
  /** 动态事件：正常完成 */
  completeDynamicEvent: () => void;
  /** 动态事件：玩家退出 */
  abandonDynamicEvent: () => void;
  /** 动态事件：异常恢复 */
  recoverDynamicEvent: () => void;
  /** 动态事件：清理（dismiss） */
  dismissDynamicEvent: () => void;
  /** 入侵：完成一次隔离确认步 */
  confirmIntrusionStep: () => { ok: boolean; complete: boolean; missesLeft: number };
  /** 入侵：误触一次（失误计数，耗尽则强制解除） */
  missIntrusionStep: () => { missesLeft: number; forcedOut: boolean };
  resetAttempts: (levelId: string) => void;
  hintUsed: (levelId: string) => number;
  resolveDefense: (ok: boolean) => void;
  finishRebirth: () => void;
  startDeath: (levelId: string, reason: string, consciousnessLoss?: number) => void;
  decrementAttackAttempt: () => void;
  triggerPendingDeath: () => void;
  wipeSave: () => void;
  markStory: (id: string) => void;
  unlockStoryEvent: (eventId: string) => void;
  recordStoryChoice: (nodeId: string, label: string) => void;
  renamePlayer: (raw: string) => { ok: boolean; reason?: string; name?: string };
  addKnowledge: (ids: string[]) => void;
  setFlag: (key: string, value: boolean | number) => void;
  patchSettings: (patch: Partial<GameSettings>) => void;
  importSaveData: (text: string) => { ok: boolean; reason?: string };
  exportSaveString: () => string;
  respawnTick: number;
  toggleMusic: () => void;
}

const Ctx = createContext<GameCtx | null>(null);

let toastSeq = 1;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [boot] = useState(() => loadGame());
  const [player, setPlayer] = useState<PlayerState>(() => boot.state);
  const [screen, setScreen] = useState<Screen>('boot');
  const [event, setEvent] = useState<GameEvent>({ kind: 'none' });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saveCorrupted] = useState<string | null>(boot.corrupted || null);
  const [hasSave, setHasSave] = useState<boolean>(!boot.fresh);
  const [respawnTick, setRespawnTick] = useState(0);
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(null);
  const [combatPaused, setCombatPaused] = useState(false);
  const combatPausedRef = useRef(false);
  combatPausedRef.current = combatPaused;
  const playerRef = useRef(player);
  playerRef.current = player;
  const eventRef = useRef(event);
  eventRef.current = event;
  // 死亡流程的稳定引用（Boss 反击在 startDeath 定义之前就需要调用它）
  const startDeathRef = useRef<(levelId: string, reason: string, consciousnessLoss?: number) => void>(() => {});
  // 仲裁队列提升事件的稳定分发引用
  const dispatchPromotedRef = useRef<(event: CombatEvent) => void>(() => {});

  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = toastSeq++;
    setToasts(t => [...t.slice(-4), { id, kind, text }]);
    window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4600);
  }, []);

  // 旧存档迁移提示（只提示一次，不打断游戏）
  useEffect(() => {
    if (boot.migrated && boot.notes && boot.notes.length > 0) {
      toast('info', '存档已自动迁移：v' + (boot.fromVersion || 1) + ' → v' + SAVE_VERSION + '（进度、等级、成就均已保留）');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 持久化
  useEffect(() => { saveGame(player); }, [player]);
  useEffect(() => {
    const h = () => saveGame(playerRef.current);
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  const nav = useCallback((s: Screen) => setScreen(s), []);

  // 设置联动
  useEffect(() => {
    setVolumes(player.settings.sfxVolume, player.settings.musicVolume);
    if (isMusicOn() && player.settings.musicVolume <= 0) stopMusic();
  }, [player.settings]);

  useEffect(() => {
    if (player.settings.fullscreen) {
      if (typeof document.fullscreenElement !== 'undefined' && !document.fullscreenElement &&
          typeof document.documentElement.requestFullscreen === 'function') {
        document.documentElement.requestFullscreen().catch(() => { /* 浏览器可能拒绝 */ });
      }
    } else if (typeof document.exitFullscreen === 'function' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* ignore */ });
    }
  }, [player.settings.fullscreen]);

  const toggleMusic = useCallback(() => {
    if (isMusicOn()) stopMusic();
    else startMusic();
  }, []);

  // ---------- 玩家操作 ----------
  const startNewGame = useCallback(() => {
    setPlayer(defaultState());
    setHasSave(true);
    setScreen('story');
  }, []);

  const setCurrentLevel = useCallback((id: string | null) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, currentLevelId: id } }));
  }, []);

  const setCurrentBoss = useCallback((id: string | null) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, currentBossId: id } }));
  }, []);

  const setCurrentChallenge = useCallback((id: string | null) => setCurrentChallengeId(id), []);

  /**
   * 同步提交：立即用最新状态计算并写入，同时更新 playerRef。
   * Boss 战需要在同一次交互里「扣血 → 校验 → 首胜事务」，不能依赖异步 state 队列。
   */
  const commitPlayer = useCallback((updater: (p: PlayerState) => PlayerState): PlayerState => {
    const next = updater(playerRef.current);
    playerRef.current = next;
    setPlayer(next);
    return next;
  }, []);

  // ---------- V1.3-C：MIRA 成长 / 记忆 / 场景反馈（只写 MIRA 自身字段） ----------
  const miraAwardPlayer = useCallback((p: PlayerState, input: Parameters<typeof miraAward>[1]) => {
    const state = normalizeMiraState(p.mira);
    const result = miraAward(state, input);
    return { player: result.changed ? { ...p, mira: result.state } : p, result };
  }, []);

  const announceMira = useCallback((result: { changed: boolean; levelUp: boolean; fromLevel: number; toLevel: number; memoryUnlocked?: { name: string } }) => {
    if (!result.changed) return;
    if (result.memoryUnlocked) toast('achieve', 'MIRA 记忆解锁：' + result.memoryUnlocked.name);
    if (result.levelUp) toast('achieve', 'MIRA 同步提升：Lv.' + result.fromLevel + ' → Lv.' + result.toLevel);
  }, [toast]);

  const miraSpeak = useCallback((scene: MiraScene, ctx: Record<string, string | number> = {}) => {
    const cur = playerRef.current;
    const r = miraSceneLine(scene, normalizeMiraState(cur.mira), ctx, Date.now());
    if (r.changed) commitPlayer(p => ({ ...p, mira: r.state }));
    toast('info', 'MIRA：' + r.text);
    return r.text;
  }, [commitPlayer, toast]);

  const miraEnsureContact = useCallback(() => {
    const now = Date.now();
    const cur = playerRef.current;
    const state = normalizeMiraState(cur.mira);
    if (state.memories['mira-first-contact']) return;
    const unlocked = miraUnlockMemory(state, 'mira-first-contact', now);
    const scene = miraSceneLine('menu', unlocked.state, {}, now);
    commitPlayer(p => ({ ...p, mira: scene.state }));
    if (unlocked.memory) toast('achieve', 'MIRA 记忆解锁：' + unlocked.memory.name);
    toast('info', 'MIRA：' + (miraMemoryById('mira-first-contact')?.mira || scene.text));
  }, [commitPlayer, toast]);

  const miraMarkMemoryRead = useCallback((memoryId: string) => {
    const now = Date.now();
    commitPlayer(p => {
      const r = miraMarkRead(normalizeMiraState(p.mira), memoryId, now);
      return r.changed ? { ...p, mira: r.state } : p;
    });
  }, [commitPlayer]);

  /** 统一成就重算：只追加 ID，奖励走成就事件 ID 幂等。 */
  const applyAchievementRecalc = useCallback((p: PlayerState, now: number): PlayerState => {
    const newAch = recalcAchievements(p);
    const gained = newAch.filter(id => !p.progress.achievements.includes(id));
    if (gained.length === 0) return p;
    let next: PlayerState = { ...p, progress: { ...p.progress, achievements: newAch } };
    for (const id of gained) {
      const def = achievementById(id);
      if (def) toast('achieve', '成就解锁：' + def.name + (def.hidden ? '（隐藏）' : ''));
      const award = miraAwardPlayer(next, {
        eventId: 'mira:achievement:' + id, xp: 6, source: 'achievement', now,
      });
      next = award.player;
      announceMira(award.result);
    }
    return next;
  }, [miraAwardPlayer, announceMira, toast]);

  // ---------- V1.3-D：数字世界探索（探索状态 + 现有奖励/MIRA） ----------
  const explorationStateOf = useCallback(() => normalizeExplorationState(playerRef.current.progress.exploration), []);

  const grantExplorationReward = useCallback((p: PlayerState, result: ExploreResult, now: number): PlayerState => {
    if (!result.changed || !result.firstTime || !result.node) return p;
    let next = p;
    if (result.credits > 0) {
      const rw = normalizeRewards(p.rewards);
      next = {
        ...p,
        rewards: {
          ...rw,
          credits: safeCredits(rw.credits + result.credits),
          ledger: appendLedger(rw.ledger, { kind: 'exploration', ref: result.node.id, credits: result.credits, exp: 0, at: now }),
        },
      };
    }
    if (result.miraXp > 0) {
      const award = miraAwardPlayer(next, {
        eventId: 'mira:exploration:' + result.node.id, xp: result.miraXp, source: 'exploration', now,
      });
      next = award.player;
      announceMira(award.result);
    }
    return next;
  }, [miraAwardPlayer, announceMira]);

  const exploreRegion = useCallback((regionId: string) => {
    const now = Date.now();
    const cur = playerRef.current;
    const st = normalizeExplorationState(cur.progress.exploration, now);
    const d = exploreDiscoverRegionPure(st, regionId, now);
    if (d.changed) {
      commitPlayer(p => ({ ...p, progress: { ...p.progress, exploration: d.state } }));
      miraSpeak('enter-region');
    }
  }, [commitPlayer, miraSpeak]);

  const exploreInteract = useCallback((regionId: string, nodeId: string) => {
    const now = Date.now();
    const cur = playerRef.current;
    const st = normalizeExplorationState(cur.progress.exploration, now);
    const result = completeExploreNode(st, regionId, nodeId, cur.progress.unlockedServers || [], now);
    if (!result.changed || !result.node) return { ok: false, reason: '探索节点尚未解锁或已完成' };
    const withState: PlayerState = {
      ...cur,
      progress: { ...cur.progress, exploration: result.state },
    };
    let next = grantExplorationReward(withState, result, now);
    next = applyAchievementRecalc(next, now);
    commitPlayer(() => next);
    if (result.node.kind === 'hidden') {
      toast('achieve', 'MIRA：这段数据回声不属于当前服务器……我会把它归档。');
    } else if (result.node.kind === 'ruin') {
      toast('info', 'MIRA：遗迹记录已归档。' + result.node.name + ' 的调查结果已写入探索档案。');
    } else {
      miraSpeak('reward');
    }
    return { ok: true, credits: result.firstTime ? result.credits : 0 };
  }, [commitPlayer, grantExplorationReward, miraSpeak, toast]);

  const exploreStartChallenge = useCallback((regionId: string, nodeId: string) => {
    const now = Date.now();
    const cur = playerRef.current;
    const st = normalizeExplorationState(cur.progress.exploration, now);
    const started = startTerminalChallenge(st, regionId, nodeId, now);
    if (!started.pending || !started.node?.levelId) return { ok: false, reason: '该终端没有真实挑战入口' };
    commitPlayer(p => ({
      ...p,
      progress: { ...p.progress, exploration: started.state, currentLevelId: started.node!.levelId! },
    }));
    miraSpeak('fault');
    nav('challenge');
    return { ok: true };
  }, [commitPlayer, miraSpeak, nav]);

  // 统计观察者：订阅 B.1~B.4 战斗事件，只记录已确认结果，不影响战斗
  useEffect(() => {
    const unsubscribe = bossBattleEventBus.subscribe(ev => {
      const cur = playerRef.current;
      const stats = recordStatsFromBusEvent(cur, ev);
      const mira = miraFromBattleEvent(stats, ev);
      const next = mira.player;
      if (next !== cur) {
        playerRef.current = next;
        setPlayer(next);
      }
      if (mira.award?.changed) announceMira(mira.award);
      if (mira.sceneText) toast('info', 'MIRA：' + mira.sceneText);
    });
    return unsubscribe;
  }, [announceMira, toast]);

  const recordBossStat = useCallback((bossId: string, input: BossBattleStatEventInput, now: number) => {
    commitPlayer(p => recordStatsInPlayer(p, bossId, input, now));
  }, [commitPlayer]);

  const ensureBossBattleStats = useCallback((bossId: string) => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return;
    const def = bossBattleDef(bossId, runtime.run.difficulty);
    const battleState = def ? normalizeBattleState((cur.progress.battles || {})[bossId], def) : null;
    if (!(battleState && battleState.started) && runtime.run.status !== 'active' && runtime.run.status !== 'phase_transition') return;
    commitPlayer(p => startStatsForRun(p, bossId, runtime.run as BossBattleRunState, runtime.plan, Date.now(), false));
  }, [commitPlayer]);

  /**
   * 统一 Boss 首胜处理入口（六个 Boss 共用，事务式 + 幂等）。
   * 真实胜利校验、碎片发放、章节完成、下一章解锁全部由 chapterFlow 完成；
   * 任何 UI 组件都不得自行发放碎片或解锁章节。
   */
  const completeBoss = useCallback((bossId: string): BossFirstClearPayload | null => {
    const cur = playerRef.current;
    const r = handleBossFirstClear(cur, bossId);
    if (!r.changed || !r.payload) return null;
    const withLedger: PlayerState = {
      ...r.player,
      rewards: {
        ...normalizeRewards(r.player.rewards),
        ledger: appendLedger(normalizeRewards(r.player.rewards).ledger, {
          kind: 'boss', ref: bossId,
          credits: r.payload.credits, exp: r.payload.expGained || 0,
        }),
      },
    };
    playerRef.current = withLedger;
    setPlayer(withLedger);
    if (r.payload.credits > 0) {
      toast('achieve', '章节奖励：+' + r.payload.credits + ' 贡献点（' + (r.payload.unlocks[0] || '') + '）');
    }
    return r.payload;
  }, [toast]);


  // ---------- Boss 战 ----------
  /**
   * 确保多阶段运行状态存在并与真实血量对账：
   * - 旧存档 / 首次进入：按当前战斗血量创建（不额外扣血、不额外回血）；
   * - 刷新：阶段单调追平，不会重复触发阶段切换；
   * - 中断后重新进入：从存档恢复（resume），已结束战斗不会复活。
   */
  const ensureBossPhaseRun = useCallback((bossId: string, opts: { reset?: boolean; activate?: boolean } = {}): BossBattleRunState | null => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime) return null;
    const { plan } = runtime;
    const now = Date.now();
    const events: BossBattleEvent[] = [];
    let run = opts.reset ? null : runtime.run;
    let changed = false;

    if (!run) {
      const battleRaw = (cur.progress.battles || {})[bossId];
      const def = bossBattleDef(bossId, plan.difficulty);
      const hp = def ? normalizeBattleState(battleRaw, def).hp : plan.totalHp;
      run = createBossPhaseRun(plan, now, { hp });
      changed = true;
    }

    if (!opts.reset) {
      const def = bossBattleDef(bossId, plan.difficulty);
      if (def) {
        const battleState = normalizeBattleState((cur.progress.battles || {})[bossId], def);
        const reconciled = reconcileBossPhaseRun(run, plan, { hp: battleState.hp, maxHp: battleState.maxHp }, now);
        if (reconciled !== run) {
          run = reconciled;
          changed = true;
        }
      }
      if (run.status === 'interrupted') {
        const resumed = resumeBattle(run, plan, now, run.hp);
        run = resumed.run;
        events.push(...resumed.events);
        changed = true;
      }
    }

    if (opts.activate || (run.status === 'idle' && !opts.reset)) {
      if (run.status === 'idle') {
        const def = bossBattleDef(bossId, plan.difficulty);
        const started = def ? normalizeBattleState((cur.progress.battles || {})[bossId], def).started : false;
        if (opts.activate || started) {
          const prepared = prepareBattle(run, now);
          run = prepared.run;
          events.push(...prepared.events);
          changed = true;
        }
      }
      if (run.status === 'preparing') {
        const activated = activateBattle(run, plan, now);
        run = activated.run;
        events.push(...activated.events);
        changed = true;
      }
    }

    if (changed && run) commitPlayer(p => withPhaseRun(p, run as BossBattleRunState));
    bossBattleEventBus.emit(events);
    return run;
  }, [commitPlayer]);

  const bossPhaseRunOf = useCallback((bossId: string): BossBattleRunState | null => {
    const runtime = phaseRuntimeOf(playerRef.current, bossId);
    return runtime ? runtime.run : null;
  }, []);

  const completeBossPhaseTransition = useCallback((bossId: string): BossBattleRunState | null => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run || runtime.run.status !== 'phase_transition') return runtime ? runtime.run : null;
    const now = Date.now();
    const step = completePhaseTransition(runtime.run, runtime.plan, now);
    if (!step.ok) return runtime.run;
    const phaseIndex = step.run.currentPhaseIndex;
    const phase = runtime.plan.phases[phaseIndex];
    let runNext = step.run;

    // 弱点伤害结转：暴露期间击破阶段，额外伤害在进入新阶段时扣除（有安全下限）
    const defs = weaknessDefsForRun(bossId, runNext);
    let weaknessRun = readWeaknessRun(cur, bossId, runtime.run, runtime.plan, now);
    const consumed = consumeCarryDamage(weaknessRun, now);
    let carryApplied = 0;
    if (consumed.amount > 0) {
      const lower = phaseHpUpper(runtime.plan, phaseIndex) - phase.maxHp;
      const minHp = phaseIndex >= runtime.plan.phases.length - 1 ? 0 : lower + 1;
      const hpAfter = Math.max(minHp, runNext.hp - consumed.amount);
      carryApplied = runNext.hp - hpAfter;
      runNext = { ...runNext, hp: hpAfter, updatedAt: now };
    }
    weaknessRun = consumed.state;
    const syncedWeakness = syncWeaknessPhase(weaknessRun, defs, phase.phaseId, phaseIndex, now);
    weaknessRun = syncedWeakness.state;

    let attackStep: BossAttackStep | null = null;
    commitPlayer(p => {
      let base: PlayerState = p;
      if (carryApplied > 0) {
        const legacyDef = bossBattleDef(bossId, runtime.plan.difficulty);
        if (legacyDef) {
          const legacy = normalizeBattleState((p.progress.battles || {})[bossId], legacyDef);
          base = {
            ...p,
            progress: {
              ...p.progress,
              battles: {
                ...(p.progress.battles || {}),
                [bossId]: { ...legacy, hp: runNext.hp, maxHp: runNext.maxHp, updatedAt: now },
              },
            },
          };
        }
      }
      let next = withPhaseRun(base, runNext);
      if (syncedWeakness.changed) next = withBossWeakness(next, weaknessRun);
      const raw = (p.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
      if (raw && phase) {
        const synced = syncAttackPhase(raw, phase.phaseId, phaseIndex, now);
        attackStep = synced;
        if (synced.changed) next = withBossAttack(next, synced.state);
      }
      return next;
    });
    bossBattleEventBus.emit([
      ...step.events,
      ...syncedWeakness.events,
      ...(attackStep ? (attackStep as BossAttackStep).events : []),
    ]);
    if (carryApplied > 0) toast('success', '弱点伤害结转：Boss 进入下一阶段时额外损失 ' + carryApplied + ' HP');
    if (phase) toast('success', 'BOSS 进入第 ' + (phaseIndex + 1) + ' 阶段：' + phase.phaseName);

    // 释放 P1 阶段锁；队列中的动态事件按优先级继续
    const after = playerRef.current;
    const rtAfter = phaseRuntimeOf(after, bossId);
    if (rtAfter && rtAfter.run) {
      const arb = readCombatArbiter(after, bossId, rtAfter.run, rtAfter.plan, now);
      if (arb.active && arb.active.eventType === 'phase-transition') {
        const rel = releaseExclusive(arb, arb.active.eventId, 'resolved', now, 'phase-completed');
        commitPlayer(pp => withCombatArbiter(pp, rel.state));
        if (rel.promoted) dispatchPromotedRef.current(rel.promoted);
      }
    }
    return runNext;
  }, [commitPlayer, toast]);

  /** 推进 Boss 攻击生命周期：唯一调度入口（页面定时器 / 可见性恢复时调用） */
  const tickBossAttackNow = useCallback((bossId: string) => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return;
    const run = runtime.run;
    const now = Date.now();
    const raw = (cur.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
    const paused = combatPausedRef.current;
    if (paused && (!raw || raw.attackState === 'idle')) return;
    if (run.status !== 'active' && run.status !== 'phase_transition') {
      if (!raw) return;
      // 战斗已结束 / 中断 / 尚未开始：只允许一次「取消 → idle」清理，之后完全停止调度
      if (raw.attackState === 'idle') return;
    }
    if (run.status !== 'active' && !raw) return;

    const state = readBossAttackState(cur, bossId, run, runtime.plan, now);
    const gate = bossGate(cur, bossId);
    const dynamicBlocking = evIsBlocking(cur.progress.dynamicEvent ?? null);
    let arbiter = readCombatArbiter(cur, bossId, run, runtime.plan, now);
    const higherLock = !!arbiter.active && arbiter.active.priority < COMBAT_PRIORITY.ATTACK;
    if ((dynamicBlocking || higherLock) && state.attackState === 'idle') return;
    const damageScale = gate.simulation ? 0 : 1;
    const weaknessDefs = weaknessDefsForRun(bossId, run);
    let weaknessRun = readWeaknessRun(cur, bossId, run, runtime.plan, now);
    const exposure = exposureInfo(weaknessRun, weaknessDefs, now);
    const step = tickBossAttack(state, attackPatternsFor(bossId, runtime.difficulty, run.currentPhaseIndex), {
      now,
      phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
      phaseIndex: run.currentPhaseIndex,
      battleActive: run.status === 'active' && !paused && !dynamicBlocking && !higherLock,
      eventBlocked: eventRef.current.kind !== 'none' || dynamicBlocking || higherLock,
      playerHp: cur.consciousness,
      damageScale,
      cooldownMultiplier: exposure.active ? exposure.attackCooldownBonus : 1,
    });
    if (!step.changed) return;

    const events: BossBattleEvent[] = [...step.events];
    let attackState = step.state;
    let arbiterChanged = false;

    // P5 攻击锁：预警/攻击/结算期间独占；冷却/结束即释放
    const attackLive = attackState.attackState === 'telegraph' || attackState.attackState === 'attacking' || attackState.attackState === 'resolving';
    if (attackLive && attackState.instanceId) {
      const eventId = combatEventId('attack', run.battleId, attackState.instanceId);
      if (!arbiter.active || arbiter.active.eventId !== eventId) {
        const requested = requestExclusive(arbiter, {
          eventId,
          eventType: 'boss-attack',
          priority: COMBAT_PRIORITY.ATTACK,
          conflictGroup: 'attack',
          expiresInMs: 30000,
          payload: { attackId: attackState.currentPattern ? attackState.currentPattern.attackId : null },
        }, now);
        if (requested.ok) {
          arbiter = requested.state;
          arbiterChanged = true;
        } else {
          const cancelled = cancelAttack(attackState, now, 'arbiter-denied');
          attackState = cancelled.state;
          events.push(...cancelled.events);
        }
      }
    } else if (arbiter.active && arbiter.active.eventType === 'boss-attack') {
      const rel = releaseExclusive(arbiter, arbiter.active.eventId, 'resolved', now, 'attack-ended');
      arbiter = rel.state;
      arbiterChanged = true;
      if (rel.promoted) dispatchPromotedRef.current(rel.promoted);
    }

    const uniqueDamages = step.damages.filter(d => !isCombatEventSettled(arbiter, combatEventId('dmg', run.battleId, d.hitKey)));
    const totalDamage = uniqueDamages.reduce((sum, d) => sum + Math.max(0, d.amount), 0);
    let weaknessChanged = false;
    for (const ev of step.events) {
      const obs = attackObservationOf(ev);
      if (!obs) continue;
      const observed = observeWeakness(weaknessRun, weaknessDefs, obs, now);
      if (observed.changed) {
        weaknessRun = observed.state;
        weaknessChanged = true;
        events.push(...observed.events);
      }
    }
    let death = false;
    let lost = 0;
    let deathReason = '';

    commitPlayer(p => {
      const rewards = normalizeRewards(p.rewards);
      const resolution = resolvePlayerDamage(p.consciousness, rewards.buffs.barrier, totalDamage, {
        blockedReason: isTerminalStatus(run.status) || p.consciousness <= 0 ? 'terminal-or-dead' : null,
      });
      const consciousness = resolution.consciousness;
      let next: PlayerState = {
        ...p,
        consciousness,
        rewards: resolution.barrierConsumed
          ? { ...rewards, buffs: { ...rewards.buffs, barrier: resolution.barrierLayers } }
          : p.rewards,
        progress: { ...p.progress, bossAttacks: { ...(p.progress.bossAttacks || {}), [bossId]: attackState } },
      };
      for (const d of uniqueDamages) {
        arbiter = recordCombatEvent(arbiter, {
          eventId: combatEventId('dmg', run.battleId, d.hitKey),
          eventType: 'damage',
          priority: COMBAT_PRIORITY.ATTACK,
          conflictGroup: 'attack',
          expiresInMs: 60000,
          payload: {
            source: 'boss-attack', amount: d.amount, result: d.result,
            attackId: d.attackId, phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
          },
        }, now);
      }
      if (arbiterChanged || uniqueDamages.length > 0) next = withCombatArbiter(next, arbiter);
      if (uniqueDamages.length > 0) {
        next = recordStatsInPlayer(next, bossId, {
          eventId: 'damage:' + run.battleId + ':' + uniqueDamages.map(d => d.hitKey).sort().join('+'),
          eventType: 'damage-taken',
          phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
          source: 'combatDamage',
          payload: {
            amount: resolution.applied,
            shieldAbsorbed: Math.max(0, totalDamage - resolution.applied),
            consciousness,
            source: 'boss-attack',
          },
        }, now);
      }
      if (consciousness <= 0) {
        death = true;
        lost = Math.max(0, p.consciousness);
        deathReason = step.damages[0] ? step.damages[0].attackName : 'Boss 攻击';
        for (const d of uniqueDamages) {
          next = recordStatsInPlayer(next, bossId, {
            eventId: 'attack-result:' + run.battleId + ':' + d.hitKey,
            eventType: 'attack-result',
            phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
            source: 'bossBattleEventBus',
            payload: { result: d.result, response: step.state.playerResponse, attackId: d.attackId, hitIndex: d.hitIndex },
          }, now);
        }
        const interrupted = interruptAttack(attackState, now, 'player-death');
        if (interrupted.changed) {
          attackState = interrupted.state;
          events.push(...interrupted.events);
          next = withBossAttack(next, attackState);
        }
        const closed = closeWeaknessRun(weaknessRun, now);
        weaknessRun = closed.state;
        weaknessChanged = true;
        events.push(...closed.events);
        next = recordStatsInPlayer(next, bossId, {
          eventId: 'player-death:' + run.battleId,
          eventType: 'player-death',
          phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
          source: 'gameStore',
          payload: { reason: 'boss-attack' },
        }, now);
        const rt = phaseRuntimeOf(next, bossId);
        if (rt && rt.run && !isTerminalStatus(rt.run.status)) {
          const finished = finishBattle(rt.run, 'defeat', now);
          if (finished.ok) {
            events.push(...finished.events);
            next = withPhaseRun(next, finished.run);
          }
        }
        next = closeCombatForPlayer(next, bossId, 'death', now);
        next = archiveBossBattleForPlayer(next, run.battleId, { firstClear: false, fragmentGranted: false, now });
      }
      if (weaknessChanged) next = withBossWeakness(next, weaknessRun);
      return next;
    });
    bossBattleEventBus.emit(events);
    if (death) startDeathRef.current(bossId, '被 ' + deathReason + ' 击中', lost);
  }, [commitPlayer]);

  const bossAttackStateOf = useCallback((bossId: string): BossAttackState | null => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return null;
    const run = runtime.run;
    if (isTerminalStatus(run.status)) return null;
    return readBossAttackState(cur, bossId, run, runtime.plan, Date.now());
  }, []);

  const defendBossAttack = useCallback((bossId: string): { ok: boolean; reason?: string; message?: string } => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run || runtime.run.status !== 'active') return { ok: false, reason: '战斗未开始' };
    const now = Date.now();
    const state = readBossAttackState(cur, bossId, runtime.run, runtime.plan, now);
    const step = playerDefend(state, now);
    if (!step.ok) return { ok: false, reason: step.reason, message: step.message };
    commitPlayer(p => withBossAttack(p, step.state));
    bossBattleEventBus.emit(step.events);
    return { ok: true, message: step.message };
  }, [commitPlayer]);

  const dodgeBossAttack = useCallback((bossId: string): { ok: boolean; reason?: string; message?: string } => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run || runtime.run.status !== 'active') return { ok: false, reason: '战斗未开始' };
    const now = Date.now();
    const state = readBossAttackState(cur, bossId, runtime.run, runtime.plan, now);
    const step = playerDodge(state, now);
    if (!step.ok) return { ok: false, reason: step.reason, message: step.message };
    commitPlayer(p => withBossAttack(p, step.state));
    bossBattleEventBus.emit(step.events);
    return { ok: true, message: step.message };
  }, [commitPlayer]);

  // ---------- Boss 弱点 ----------

  const ensureBossWeaknessRun = useCallback((bossId: string, opts: { reset?: boolean } = {}): BossWeaknessRunState | null => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return null;
    const run = runtime.run;
    const defs = weaknessDefsForRun(bossId, run);
    if (defs.length === 0) return null;
    const phase = runtime.plan.phases[run.currentPhaseIndex];
    const raw = (cur.progress.bossWeaknesses || {})[bossId];
    const needsReset = opts.reset === true || !raw || raw.battleId !== run.battleId;
    if (needsReset) {
      const now = Date.now();
      const fresh = createBossWeaknessRun(run.battleId, bossId, phase.phaseId, run.currentPhaseIndex, defs, now);
      commitPlayer(p => withBossWeakness(p, fresh));
      return fresh;
    }
    return normalizeWeaknessRun(raw, defs, {
      bossId, battleId: run.battleId, phaseId: phase.phaseId, phaseIndex: run.currentPhaseIndex, now: Date.now(),
    });
  }, [commitPlayer]);

  const bossWeaknessStateOf = useCallback((bossId: string): BossWeaknessRunState | null => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return null;
    const run = runtime.run;
    if (isTerminalStatus(run.status)) return null;
    if (weaknessDefsForRun(bossId, run).length === 0) return null;
    return readWeaknessRun(cur, bossId, run, runtime.plan, Date.now());
  }, []);

  const tickBossWeaknessNow = useCallback((bossId: string) => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run || runtime.run.status !== 'active') return;
    const defs = weaknessDefsForRun(bossId, runtime.run);
    if (defs.length === 0) return;
    const now = Date.now();
    const state = readWeaknessRun(cur, bossId, runtime.run, runtime.plan, now);
    const step = tickWeakness(state, defs, now);
    if (!step.changed) return;
    commitPlayer(p => withBossWeakness(p, step.state));
    bossBattleEventBus.emit(step.events);
  }, [commitPlayer]);

  const analyzeBossWeakness = useCallback((bossId: string): { ok: boolean; reason?: string; message?: string } => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run || runtime.run.status !== 'active') return { ok: false, reason: '战斗未开始' };
    const defs = weaknessDefsForRun(bossId, runtime.run);
    const now = Date.now();
    const state = readWeaknessRun(cur, bossId, runtime.run, runtime.plan, now);
    const step = startWeaknessAnalysisStep(state, defs, now);
    if (!step.ok) return { ok: false, reason: step.reason };
    commitPlayer(p => withBossWeakness(p, step.state));
    bossBattleEventBus.emit(step.events);
    const def = step.definition;
    return { ok: true, message: '正在解析' + (def ? '「' + def.name + '」' : '') + '……' };
  }, [commitPlayer]);

  const submitWeaknessCrack = useCallback(async (bossId: string, code: string): Promise<WeaknessCrackResult> => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run || runtime.run.status !== 'active') return { status: 'blocked', reason: '战斗未开始' };
    const defs = weaknessDefsForRun(bossId, runtime.run);
    const now = Date.now();
    let state = readWeaknessRun(cur, bossId, runtime.run, runtime.plan, now);
    const def = activeWeakness(state, defs);
    const entry = activeEntry(state, defs);
    if (!def || !entry) return { status: 'blocked', reason: '当前阶段没有弱点' };
    if (entry.status !== 'discovered' && entry.status !== 'recovered') {
      return { status: 'blocked', reason: '弱点尚未发现或正在处理中' };
    }
    const ck = checkUserCode(code);
    if (!ck.allowed) return { status: 'blocked', reason: '安全策略阻止：' + ck.reason };

    const begin = beginWeaknessCrack(state, defs, now);
    if (!begin.ok) return { status: 'blocked', reason: begin.reason };
    state = begin.state;
    commitPlayer(p => withBossWeakness(p, state));
    bossBattleEventBus.emit(begin.events);

    const combined = def.challenge.judge.judgeKind === 'python'
      ? combineWithHarness(code, buildHarness(def.challenge.judge.pythonChecks || []))
      : code;
    const r = await runPython(combined, { timeoutMs: 5000 });

    const cur2 = playerRef.current;
    const rt2 = phaseRuntimeOf(cur2, bossId);
    if (!rt2 || !rt2.run) return { status: 'failure', reason: '战斗已结束', run: r };
    const run2 = rt2.run;
    const plan2 = rt2.plan;
    const defs2 = weaknessDefsForRun(bossId, run2);
    const now2 = Date.now();
    let latest = readWeaknessRun(cur2, bossId, run2, plan2, now2);
    const latestDef = activeWeakness(latest, defs2);
    if (!latestDef || latestDef.weaknessId !== def.weaknessId) {
      return { status: 'failure', reason: '战斗阶段已变化，本次破解无效', run: r };
    }

    let success = false;
    let verdict: JudgeVerdict | undefined;
    if (r.timedOut) {
      verdict = { passed: false, checks: [], timedOut: true };
    } else if (!r.ok) {
      verdict = { passed: false, checks: [], error: r.error };
    } else {
      verdict = judgeRun(latestDef.challenge.judge, r);
      success = verdict.passed;
    }

    const complete = completeWeaknessCrack(latest, defs2, success, now2);
    if (!complete.changed) return { status: success ? 'success' : 'failure', run: r, verdict, weaknessState: latest };
    const weaknessEvents = [...complete.events];
    const attackEvents: BossBattleEvent[] = [];
    let exposureMs = 0;
    const eventId = combatEventId('weakness', run2.battleId, latestDef.weaknessId + ':' + (latest.entries[latestDef.weaknessId] ? latest.entries[latestDef.weaknessId].attempts : 0) + ':' + now2);
    let weaknessArbiter = readCombatArbiter(cur2, bossId, run2, plan2, now2);
    weaknessArbiter = recordCombatEvent(weaknessArbiter, {
      eventId,
      eventType: success ? 'weakness-exposed' : 'weakness-crack',
      priority: COMBAT_PRIORITY.WEAKNESS,
      conflictGroup: 'weakness',
      expiresInMs: 60000,
      payload: { weaknessId: latestDef.weaknessId, success },
    }, now2, success ? 'resolved' : 'cancelled');

    commitPlayer(p => {
      let next = withBossWeakness(p, complete.state);
      next = withCombatArbiter(next, weaknessArbiter);
      next = recordStatsInPlayer(next, bossId, {
        eventId: 'weakness-crack:' + run2.battleId + ':' + latestDef.weaknessId + ':' + (latest.entries[latestDef.weaknessId] ? latest.entries[latestDef.weaknessId].attempts : 0),
        eventType: 'weakness-crack-result',
        phaseId: plan2.phases[run2.currentPhaseIndex].phaseId,
        source: 'gameStore',
        payload: { outcome: success ? 'success' : 'failure', weaknessId: latestDef.weaknessId },
      }, now2);
      if (success) {
        const exposure = exposureInfo(complete.state, defs2, now2);
        exposureMs = exposure.remainingMs;
        const attack = readBossAttackState(p, bossId, run2, plan2, now2);
        if (exposure.definition) {
          const interference = applyAttackInterference(attack, {
            now: now2,
            until: exposure.entry && exposure.entry.exposedUntil ? exposure.entry.exposedUntil : now2 + exposure.remainingMs,
            disablePatternIds: exposure.disabledPatternIds,
            interrupt: exposure.interruptAttack,
            reason: 'weakness-exposed',
          });
          next = withBossAttack(next, interference.state);
          attackEvents.push(...interference.events);
        }
      }
      return next;
    });
    bossBattleEventBus.emit([...weaknessEvents, ...attackEvents]);
    if (success) {
      toast('success', '弱点破解成功：' + def.name + ' 已暴露');
    } else {
      const exhausted = def.maxAttempts > 0 && entry.attempts >= def.maxAttempts;
      toast('warn', exhausted ? '破解失败：尝试次数已耗尽，弱点暂时封锁' : '破解失败：' + (verdict?.error ? verdict.error.type : '测试未通过'));
    }
    const finalState = activeEntry(complete.state, defs2);
    return {
      status: success ? 'success' : (r.timedOut ? 'timeout' : r.ok ? 'failure' : 'error'),
      run: r,
      verdict,
      weaknessState: complete.state,
      exposureRemainingMs: exposureMs,
    };
  }, [commitPlayer, toast]);

  const setBossCombatPaused = useCallback((bossId: string, paused: boolean): { ok: boolean; reason?: string } => {
    if (!paused) {
      const p = playerRef.current;
      const runtime = phaseRuntimeOf(p, bossId);
      if (runtime && runtime.run) {
        const now = Date.now();
        let arbiter = readCombatArbiter(p, bossId, runtime.run, runtime.plan, now);
        if (arbiter.active && arbiter.active.eventType === 'weakness-crack') {
          const rel = releaseExclusive(arbiter, arbiter.active.eventId, 'cancelled', now, 'crack-closed');
          arbiter = rel.state;
          commitPlayer(pp => withCombatArbiter(pp, arbiter));
          if (rel.promoted) dispatchPromotedRef.current(rel.promoted);
        }
      }
      setCombatPaused(false);
      return { ok: true };
    }
    const p = playerRef.current;
    const runtime = phaseRuntimeOf(p, bossId);
    if (!runtime || !runtime.run) { setCombatPaused(true); return { ok: true }; }
    const now = Date.now();
    const arbiter = readCombatArbiter(p, bossId, runtime.run, runtime.plan, now);
    const requested = requestExclusive(arbiter, {
      eventId: combatEventId('weakness-crack', runtime.run.battleId, now),
      eventType: 'weakness-crack',
      priority: COMBAT_PRIORITY.WEAKNESS,
      conflictGroup: 'weakness',
      expiresInMs: 300000,
      payload: { phaseId: runtime.plan.phases[runtime.run.currentPhaseIndex].phaseId },
    }, now);
    if (!requested.ok) {
      return { ok: false, reason: requested.reason };
    }
    let next = withCombatArbiter(p, requested.state);
    const attack = (p.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
    if (attack) {
      const cancelled = cancelAttack(attack, now, 'weakness-crack');
      if (cancelled.changed) {
        next = withBossAttack(next, cancelled.state);
        bossBattleEventBus.emit(cancelled.events);
      }
    }
    commitPlayer(() => next);
    setCombatPaused(true);
    return { ok: true };
  }, [commitPlayer]);


  /**
   * 进入战斗：
   * - 未首胜：必须在真实门禁内（章节已开放 + 普通关卡完成 + 原初核心校验）；
   * - 已首胜：进入「模拟再战」，不复用旧血量，但绝不改动 bossesDone / 碎片 / 章节状态。
   * - 已有进行中的战斗：保留该难度（难度锁定），传别的难度会被拒绝。
   */
  const beginBossBattle = useCallback((bossId: string, difficulty: BossDifficulty = 'easy'): BossBattleState | null => {
    const wanted = difficultyOf(difficulty);
    const def = bossBattleDef(bossId, wanted);
    if (!def) return null;
    const cur = playerRef.current;
    const gate = bossGate(cur, bossId);
    if (!gate.available && !gate.simulation) return null;

    const raw = (cur.progress.battles || {})[bossId];
    const existingDiff = raw && typeof raw === 'object' ? difficultyOf((raw as { difficulty?: unknown }).difficulty) : null;
    const normalized = raw ? normalizeBattleState(raw, bossBattleDef(bossId, existingDiff || 'easy') || def) : null;
    const inProgress = !!normalized && !normalized.cleared && normalized.started;
    if (normalized && inProgress && existingDiff && existingDiff !== wanted) {
      // 本次挑战难度已锁定
      return null;
    }

    if (gate.simulation) {
      const fresh = createBattleState(def);
      commitPlayer(p => ({
        ...p,
        progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: fresh } },
      }));
      return fresh;
    }

    const existing = normalizeBattleState(raw, def);
    if (!raw || existing.difficulty !== wanted) {
      commitPlayer(p => ({
        ...p,
        progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: existing } },
      }));
    }
    if (bossId === 'k0') commitPlayer(p => markOriginCoreEntered(p));
    // 多阶段运行状态：模拟再战重置；进行中的战斗按真实血量恢复
    ensureBossPhaseRun(bossId, { reset: gate.simulation });
    // 攻击状态：新战斗 / 模拟再战 / battleId 不一致时重建
    const rtAfter = phaseRuntimeOf(playerRef.current, bossId);
    if (rtAfter && rtAfter.run) {
      const rawAttack = (playerRef.current.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
      if (gate.simulation || !rawAttack || rawAttack.battleId !== rtAfter.run.battleId) {
        const phase = rtAfter.plan.phases[rtAfter.run.currentPhaseIndex];
        const freshAttack = createBossAttackState(
          rtAfter.run.battleId, bossId, phase.phaseId, rtAfter.run.currentPhaseIndex, Date.now(),
        );
        commitPlayer(p => withBossAttack(p, freshAttack));
      }
    }
    const weaknessRuntime = phaseRuntimeOf(playerRef.current, bossId);
    if (weaknessRuntime && weaknessRuntime.run) {
      const defs = weaknessDefsForRun(bossId, weaknessRuntime.run);
      if (defs.length > 0) {
        const rawWeakness = (playerRef.current.progress.bossWeaknesses || {})[bossId];
        if (gate.simulation || !rawWeakness || rawWeakness.battleId !== weaknessRuntime.run.battleId) {
          const phase = weaknessRuntime.plan.phases[weaknessRuntime.run.currentPhaseIndex];
          const freshWeakness = createBossWeaknessRun(
            weaknessRuntime.run.battleId, bossId, phase.phaseId, weaknessRuntime.run.currentPhaseIndex, defs, Date.now(),
          );
          commitPlayer(p => withBossWeakness(p, freshWeakness));
        }
      }
    }
    const arRuntime = phaseRuntimeOf(playerRef.current, bossId);
    if (arRuntime && arRuntime.run) {
      const rawArbiter = playerRef.current.progress.combatArbiter;
      if (gate.simulation || !rawArbiter || rawArbiter.battleId !== arRuntime.run.battleId) {
        const phase = arRuntime.plan.phases[arRuntime.run.currentPhaseIndex];
        const arbiter = createCombatArbiter(arRuntime.run.battleId, bossId, phase.phaseId, Date.now());
        commitPlayer(p => withCombatArbiter(p, arbiter));
      }
    }
    return existing;
  }, [commitPlayer, ensureBossPhaseRun]);

  /** 难度选择界面「开始挑战」：锁定所选难度并重置本场战斗 */
  const startBossBattle = useCallback((bossId: string, difficulty: BossDifficulty): BossBattleState | null => {
    const diff = difficultyOf(difficulty);
    const def = bossBattleDef(bossId, diff);
    if (!def) return null;
    const allowed = bossDifficulties(bossId);
    if (!allowed.includes(diff)) return null;
    const gate = bossGate(playerRef.current, bossId);
    if (!gate.available && !gate.simulation) return null;
    const fresh = { ...createBattleState(def), started: true };
    const next = commitPlayer(p => ({
      ...p,
      progress: {
        ...p.progress,
        battles: { ...(p.progress.battles || {}), [bossId]: fresh },
        challengeSessions: normalizeSessions({
          ...(p.progress.challengeSessions || {}),
          [bossId]: beginSession(p.progress.challengeSessions?.[bossId] || null, bossId, 'boss', Date.now(), toleranceFor(p.level)),
        }),
      },
    }));
    if (bossId === 'k0') commitPlayer(p => markOriginCoreEntered(p));
    // 新的一场多阶段战斗：重置运行状态并立即进入 active
    ensureBossPhaseRun(bossId, { reset: true, activate: true });
    // 新攻击状态：满冷却就绪，首次攻击留出准备时间
    const rtStart = phaseRuntimeOf(playerRef.current, bossId);
    if (rtStart && rtStart.run) {
      const now = Date.now();
      const phase = rtStart.plan.phases[rtStart.run.currentPhaseIndex];
      const attack = createBossAttackState(rtStart.run.battleId, bossId, phase.phaseId, rtStart.run.currentPhaseIndex, now);
      commitPlayer(p => withBossAttack(p, attack));
    }
    const weaknessStart = phaseRuntimeOf(playerRef.current, bossId);
    if (weaknessStart && weaknessStart.run) {
      const defs = weaknessDefsForRun(bossId, weaknessStart.run);
      if (defs.length > 0) {
        const phase = weaknessStart.plan.phases[weaknessStart.run.currentPhaseIndex];
        const freshWeakness = createBossWeaknessRun(
          weaknessStart.run.battleId, bossId, phase.phaseId, weaknessStart.run.currentPhaseIndex, defs, Date.now(),
        );
        commitPlayer(p => withBossWeakness(p, freshWeakness));
      }
    }
    const arbStart = phaseRuntimeOf(playerRef.current, bossId);
    if (arbStart && arbStart.run) {
      const phase = arbStart.plan.phases[arbStart.run.currentPhaseIndex];
      const arbiter = createCombatArbiter(arbStart.run.battleId, bossId, phase.phaseId, Date.now());
      commitPlayer(p => withCombatArbiter(p, arbiter));
    }
    const statsStart = phaseRuntimeOf(playerRef.current, bossId);
    if (statsStart && statsStart.run) {
      const statsRun = statsStart.run;
      commitPlayer(p => startStatsForRun(p, bossId, statsRun, statsStart.plan, Date.now(), true));
    }
    miraSpeak('boss-enter');
    return normalizeBattleState((next.progress.battles || {})[bossId], def);
  }, [commitPlayer, ensureBossPhaseRun, miraSpeak]);

  /** 放弃当前进行中的战斗（只清战斗进度，不影响永久奖励） */
  const abandonBossBattle = useCallback((bossId: string) => {
    commitPlayer(p => {
      const battles = { ...(p.progress.battles || {}) };
      delete battles[bossId];
      let next: PlayerState = { ...p, progress: { ...p.progress, battles } };
      const runtime = phaseRuntimeOf(p, bossId);
      const run = runtime ? runtime.run : null;
      if (run && !isTerminalStatus(run.status) && run.status !== 'idle') {
        const interrupted = interruptBattle(run, Date.now(), '玩家撤退');
        if (interrupted.ok) {
          next = withPhaseRun(next, interrupted.run);
          bossBattleEventBus.emit(interrupted.events);
        }
      }
      const attack = (p.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
      if (attack) {
        const cancelled = cancelAttack(attack, Date.now(), '玩家撤退');
        next = withBossAttack(next, cancelled.state);
        if (cancelled.changed) bossBattleEventBus.emit(cancelled.events);
      }
      const weakness = (p.progress.bossWeaknesses || {})[bossId];
      if (weakness) {
        const closed = closeWeaknessRun(weakness, Date.now());
        next = withBossWeakness(next, closed.state);
        if (closed.events.length > 0) bossBattleEventBus.emit(closed.events);
      }
      if (p.progress.currentBossId === bossId) {
        const bid = run ? run.battleId : null;
        next = closeCombatForPlayer(next, bossId, 'retreat', Date.now());
        if (bid) next = archiveBossBattleForPlayer(next, bid, { firstClear: false, fragmentGranted: false, now: Date.now() });
      }
      return next;
    });
  }, [commitPlayer]);

  /** 判题没有造成伤害 → Boss 反击：意识值下降，失败次数 +1；意识归零走既有死亡流程 */
  const bossCounterAttack = useCallback((bossId: string, amount: number) => {
    const cur = playerRef.current;
    const raw = (cur.progress.battles || {})[bossId];
    const def = bossBattleDef(bossId, difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined));
    if (!def) return;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run || isTerminalStatus(runtime.run.status)) return;
    const counterRun = runtime.run;
    const now = Date.now();
    const bState = normalizeBattleState(raw, def);
    const eventId = combatEventId('counter', counterRun.battleId, (bState.failures + 1) + '@' + now);
    let initialArbiter = readCombatArbiter(cur, bossId, counterRun, runtime.plan, now);
    if (isCombatEventSettled(initialArbiter, eventId)) return;

    let death = false;
    let lost = 0;
    let phaseEvents: BossBattleEvent[] = [];
    commitPlayer(p => {
      const b = normalizeBattleState((p.progress.battles || {})[bossId], def);
      const rwB = normalizeRewards(p.rewards);
      const resolution = resolvePlayerDamage(p.consciousness, rwB.buffs.barrier, amount, {
        blockedReason: p.consciousness <= 0 ? 'player-dead' : null,
      });
      const c = resolution.consciousness;
      let arbiter = readCombatArbiter(p, bossId, counterRun, runtime.plan, now);
      arbiter = recordCombatEvent(arbiter, {
        eventId,
        eventType: 'damage',
        priority: COMBAT_PRIORITY.ATTACK,
        conflictGroup: 'attack',
        expiresInMs: 60000,
        payload: { source: 'boss-counter', amount: resolution.applied, rawAmount: amount, phaseId: runtime.plan.phases[counterRun.currentPhaseIndex].phaseId },
      }, now);
      let next: PlayerState = {
        ...p,
        consciousness: c,
        rewards: resolution.barrierConsumed
          ? { ...rwB, buffs: { ...rwB.buffs, barrier: resolution.barrierLayers } }
          : p.rewards,
        progress: {
          ...p.progress,
          battles: { ...(p.progress.battles || {}), [bossId]: { ...b, failures: b.failures + 1, updatedAt: now } },
          combatArbiter: arbiter,
        },
      };
      next = recordStatsInPlayer(next, bossId, {
        eventId: 'counter:' + counterRun.battleId + ':' + (b.failures + 1),
        eventType: 'damage-taken',
        phaseId: runtime.plan.phases[counterRun.currentPhaseIndex].phaseId,
        source: 'combatDamage',
        payload: { amount: resolution.applied, shieldAbsorbed: Math.max(0, amount - resolution.applied), consciousness: c, source: 'boss-counter' },
      }, now);
      if (c <= 0) {
        death = true;
        lost = Math.max(0, p.consciousness);
        next.progress = {
          ...next.progress,
          battles: { ...(next.progress.battles || {}), [bossId]: createBattleState(def) },
        };
        let pNext = next;
        const attack = (p.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
        if (attack) {
          const cancelled = cancelAttack(attack, now, 'player-death');
          if (cancelled.changed) {
            phaseEvents.push(...cancelled.events);
            pNext = withBossAttack(pNext, cancelled.state);
          }
        }
        const weakness = (p.progress.bossWeaknesses || {})[bossId];
        if (weakness) {
          const closed = closeWeaknessRun(weakness, now);
          phaseEvents.push(...closed.events);
          pNext = withBossWeakness(pNext, closed.state);
        }
        // 意识崩解 = 本场 Boss 战失败：记录死亡与多阶段战斗结果（历史供 B.5 读取）
        pNext = recordStatsInPlayer(pNext, bossId, {
          eventId: 'player-death:' + counterRun.battleId,
          eventType: 'player-death',
          phaseId: runtime.plan.phases[counterRun.currentPhaseIndex].phaseId,
          source: 'gameStore',
          payload: { reason: 'boss-counter' },
        }, now);
        const rt = phaseRuntimeOf(pNext, bossId);
        const run = rt ? rt.run : null;
        if (run && !isTerminalStatus(run.status) && run.status !== 'idle') {
          const failed = finishBattle(run, 'defeat', now);
          if (failed.ok) {
            phaseEvents.push(...failed.events);
            pNext = withPhaseRun(pNext, failed.run);
          }
        }
        const closed = closeCombatForPlayer(pNext, bossId, 'death', now);
        return archiveBossBattleForPlayer(closed, counterRun.battleId, { firstClear: false, fragmentGranted: false, now });
      }
      return next;
    });
    bossBattleEventBus.emit(phaseEvents);
    if (death) startDeathRef.current(bossId, '被 ' + (def.bossId.toUpperCase()) + ' 反击击穿', lost);
  }, [commitPlayer]);

  /** Bug 图鉴：记录一次错误遭遇（同一条目累计次数） */
  const recordBug = useCallback((entryId: string) => {
    if (!entryId) return;
    setPlayer(p => {
      const log = { ...(p.meta.bugCodex || {}) };
      const cur = log[entryId];
      log[entryId] = { count: (cur?.count || 0) + 1, firstAt: cur?.firstAt || Date.now() };
      return { ...p, meta: { ...p.meta, bugCodex: log } };
    });
  }, []);

  /** 结局档案：记录已解锁结局（幂等） */
  const recordEnding = useCallback((endingId: string) => {
    if (!endingId) return;
    setPlayer(p => {
      const list = p.progress.endings || [];
      const nextList = list.includes(endingId) ? list : [...list, endingId];
      return { ...p, progress: { ...p.progress, endings: nextList, ending: endingId } };
    });
  }, []);

  // ---------- 记忆档案馆 ----------
  const normalizeVault = (v: VaultState | undefined): VaultState => ({
    read: Array.isArray(v?.read) ? [...v.read] : [],
    finalSeen: v?.finalSeen === true,
    lastOpened: typeof v?.lastOpened === 'string' ? v.lastOpened : null,
  });

  /** 查看某枚碎片：记录已读 + 上次打开位置（关闭页面后可恢复） */
  const markVaultRead = useCallback((fragmentId: string) => {
    if (!fragmentId) return;
    setPlayer(p => {
      const v = normalizeVault(p.progress.vault);
      if (v.read.includes(fragmentId) && v.lastOpened === fragmentId) return p;
      return {
        ...p,
        progress: {
          ...p.progress,
          vault: { ...v, read: v.read.includes(fragmentId) ? v.read : [...v.read, fragmentId], lastOpened: fragmentId },
        },
      };
    });
  }, []);

  const markVaultFinalSeen = useCallback(() => {
    setPlayer(p => {
      const v = normalizeVault(p.progress.vault);
      if (v.finalSeen) return p;
      return { ...p, progress: { ...p.progress, vault: { ...v, finalSeen: true } } };
    });
  }, []);

  const setVaultLastOpened = useCallback((id: string | null) => {
    setPlayer(p => {
      const v = normalizeVault(p.progress.vault);
      if (v.lastOpened === id) return p;
      return { ...p, progress: { ...p.progress, vault: { ...v, lastOpened: id } } };
    });
  }, []);

  /** A5 统一购买事务：价格/限购/余额由商品目录与纯逻辑层重新校验 */
  const purchaseShopItem = useCallback((itemId: string, qty = 1, requestId?: string) => {
    const rid = requestId || 'rq-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    const res = purchaseItem(playerRef.current, itemId, qty, rid);
    if (res.player !== playerRef.current) {
      playerRef.current = res.player;
      setPlayer(res.player);
    }
    if (!res.ok) {
      toast('warn', res.reason || '购买失败');
      play('deny');
      return { ok: false, reason: res.reason, transaction: res.transaction as ShopTransaction | null };
    }
    if (res.duplicate) return { ok: true, duplicate: true };
    toast('achieve', '交易完成：' + (res.transaction?.itemName || itemId) + ' ×' + (res.transaction?.qty || qty) + '（-' + res.charged + ' 贡献点）');
    play('success');
    return { ok: true, transaction: res.transaction as ShopTransaction | null, charged: res.charged };
  }, [toast]);

  /** 兼容旧调用：买 1 件 */
  const buyShopItem = useCallback((itemId: string): { ok: boolean; reason?: string } => {
    const r = purchaseShopItem(itemId, 1);
    return { ok: r.ok, reason: r.reason };
  }, [purchaseShopItem]);

  /** A5 使用道具：恢复意识 / 激活增益，条件与上限在这里统一校验 */
  const useShopItem = useCallback((itemId: string) => {
    const res = applyUseItem(playerRef.current, itemId);
    if (!res.ok) {
      toast('warn', res.reason || '无法使用');
      play('deny');
      return { ok: false, reason: res.reason };
    }
    playerRef.current = res.player;
    setPlayer(res.player);
    toast('success', res.message || '已使用');
    play('success');
    return { ok: true, message: res.message };
  }, [toast]);

  /** 装备外观 */
  const equipItem = useCallback((itemId: string): { ok: boolean; reason?: string } => {
    const res = equipItemById(playerRef.current, itemId);
    if (!res.ok) return { ok: false, reason: res.reason };
    playerRef.current = res.player;
    setPlayer(res.player);
    toast('success', res.message || '已装备');
    play('click');
    return { ok: true };
  }, [toast]);

  /** 卸下某个装备槽 */
  const unequipItem = useCallback((slot: EquipSlot): { ok: boolean; reason?: string } => {
    const res = unequipSlot(playerRef.current, slot);
    if (!res.ok) return { ok: false, reason: res.reason };
    playerRef.current = res.player;
    setPlayer(res.player);
    toast('success', res.message || '已卸下');
    play('click');
    return { ok: true };
  }, [toast]);

  /** 挑战页请求提示：优先消耗提示券（不计入本关提示层数） */
  const consumeHintTicket = useCallback((): boolean => {
    const rw = normalizeRewards(playerRef.current.rewards);
    if (rw.buffs.hintTicket <= 0) return false;
    commitPlayer(p => {
      const cur = normalizeRewards(p.rewards);
      if (cur.buffs.hintTicket <= 0) return p;
      return { ...p, rewards: { ...cur, buffs: { ...cur.buffs, hintTicket: cur.buffs.hintTicket - 1 } } };
    });
    return true;
  }, [commitPlayer]);

  /** 消耗一个道具（挑战页的扫描器 / 回滚 / 解码器沿用） */
  const consumeItem = useCallback((itemId: string): boolean => {
    const cur = playerRef.current;
    const rw = normalizeRewards(cur.rewards);
    const have = rw.items[itemId] || 0;
    if (have <= 0) return false;
    const items = { ...rw.items, [itemId]: have - 1 };
    setPlayer(p => ({ ...p, rewards: { ...normalizeRewards(p.rewards), items } }));
    return true;
  }, []);

  /** 意识稳定模块 */
  const restoreConsciousness = useCallback((amount: number) => {
    setPlayer(p => ({ ...p, consciousness: Math.min(100, p.consciousness + amount) }));
    play('success');
  }, []);

  /** 标记记忆档案已读 */
  const markArchiveRead = useCallback((archiveId: string) => {
    setPlayer(p => {
      const rw = normalizeRewards(p.rewards);
      if (rw.archiveRead.includes(archiveId)) return p;
      return { ...p, rewards: { ...rw, archiveRead: [...rw.archiveRead, archiveId] } };
    });
  }, []);

  const setFlag = useCallback((key: string, value: boolean | number) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, flags: { ...p.progress.flags, [key]: value } } }));
  }, []);

  /** 记录对话节点已读：旧字段 storySeen（布尔）+ 新字段 story.seen（次数）双写 */
  const markStory = useCallback((id: string) => {
    if (!id) return;
    setPlayer(p => {
      const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
      const nextStory = markNodeSeen(story, id);
      const storySeen = p.progress.storySeen[id] ? p.progress.storySeen : { ...p.progress.storySeen, [id]: true };
      return { ...p, progress: { ...p.progress, storySeen, story: nextStory } };
    });
  }, []);

  /** 解锁剧情事件（幂等，不重复写入） */
  const unlockStoryEvent = useCallback((eventId: string) => {
    if (!eventId) return;
    setPlayer(p => {
      const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
      if (story.unlocked.includes(eventId)) return p;
      return { ...p, progress: { ...p.progress, story: unlockEvent(story, eventId) } };
    });
  }, []);

  /** 记录剧情分支选择（同一节点保留最新选择） */
  const recordStoryChoice = useCallback((nodeId: string, label: string) => {
    if (!nodeId || !label) return;
    setPlayer(p => {
      const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
      return { ...p, progress: { ...p.progress, story: recordChoice(story, nodeId, label) } };
    });
  }, []);

  /**
   * 修改玩家显示名称。
   * 规范：只改显示名，原始实验编号 R-07 永远不变（identity.originCode 由 normalizeIdentity 强制）。
   */
  const renamePlayer = useCallback((raw: string): { ok: boolean; reason?: string; name?: string } => {
    const v = validateDisplayName(raw);
    if (!v.ok) return { ok: false, reason: v.reason };
    const cur = playerRef.current;
    const base = normalizeIdentity(cur.identity, cur.name);
    const identity: PlayerIdentity = {
      ...base,
      displayName: v.name,
      originCode: ORIGIN_CODE,
      renamed: v.name !== ORIGIN_CODE,
    };
    setPlayer(p => ({ ...p, name: v.name, identity }));
    toast('success', '显示名称已更新为「' + v.name + '」');
    play('success');
    return { ok: true, name: v.name };
  }, [toast]);

  const addKnowledge = useCallback((ids: string[]) => {
    setPlayer(p => {
      const merged = [...new Set([...p.progress.knowledge, ...ids])];
      return { ...p, progress: { ...p.progress, knowledge: merged } };
    });
  }, []);

  const hintUsed = useCallback((levelId: string): number => {
    const cur = playerRef.current.progress.hintLevels[levelId] || 0;
    setPlayer(p => ({
      ...p,
      progress: { ...p.progress, hintLevels: { ...p.progress.hintLevels, [levelId]: cur + 1 } },
    }));
    return cur;
  }, []);

  const resetAttempts = useCallback((levelId: string) => {
    setPlayer(p => ({
      ...p,
      progress: { ...p.progress, failedAttempts: { ...p.progress.failedAttempts, [levelId]: 0 } },
    }));
  }, []);

  /** 进入/恢复一次挑战会话（进行中保留统计；已结算则新开） */
  const beginChallenge = useCallback((id: string, kind: ChallengeKind = 'level'): ChallengeSession => {
    const prev = playerRef.current;
    const existing = prev.progress.challengeSessions?.[id] || null;
    const s = beginSession(existing, id, kind, Date.now(), toleranceFor(prev.level));
    if (existing && existing.id === s.id && existing.status === 'active') return existing;
    commitPlayer(p => ({
      ...p,
      progress: {
        ...p.progress,
        challengeSessions: normalizeSessions({ ...(p.progress.challengeSessions || {}), [id]: s }),
      },
    }));
    return s;
  }, [commitPlayer]);

  const updateSession = useCallback((id: string, fn: (s: ChallengeSession) => ChallengeSession) => {
    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const cur = sessions[id];
      if (!cur) return p;
      const nextS = fn(cur);
      if (nextS === cur) return p;
      return { ...p, progress: { ...p.progress, challengeSessions: { ...sessions, [id]: nextS } } };
    });
  }, [commitPlayer]);

  const recordRun = useCallback((id: string) => updateSession(id, countRun), [updateSession]);
  const recordSubmit = useCallback((id: string) => updateSession(id, countSubmit), [updateSession]);

  // ---------- 独立挑战（V1.3-A）：运行状态机 + 会话结算 ----------
  const enterChallenge = useCallback((challengeId: string): ChallengeRunState | null => {
    const def = independentChallengeById(challengeId);
    if (!def) return null;
    const prev = playerRef.current;
    const existing = prev.progress.challengeRuns?.[challengeId] || null;
    // 进行中（active / paused）保留统计；已终结（completed/failed/cancelled）则新开一次
    if (existing && (existing.status === 'active' || existing.status === 'paused')) return existing;
    const run = createChallengeRun(challengeId, def.rules, {
      now: Date.now(),
      bugs: def.bugs,
      stages: def.stages,
      hiddenTests: def.hiddenTests,
    });
    const session = beginSession(prev.progress.challengeSessions?.[challengeId] || null, challengeId, 'level', Date.now(), toleranceFor(prev.level));
    commitPlayer(p => ({
      ...p,
      progress: {
        ...p.progress,
        challengeRuns: { ...(p.progress.challengeRuns || {}), [challengeId]: run },
        challengeSessions: normalizeSessions({ ...(p.progress.challengeSessions || {}), [challengeId]: session }),
      },
    }));
    return run;
  }, [commitPlayer]);

  const challengeRunOf = useCallback((challengeId: string): ChallengeRunState | null =>
    playerRef.current.progress.challengeRuns?.[challengeId] || null, []);

  const recordChallengeRun = useCallback((challengeId: string): boolean => {
    const prev = playerRef.current;
    const run = prev.progress.challengeRuns?.[challengeId] || null;
    if (!run || !runCanRun(run)) return false;
    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const session = beginSession(sessions[challengeId] || null, challengeId, 'level', Date.now(), toleranceFor(p.level));
      return {
        ...p,
        progress: {
          ...p.progress,
          challengeRuns: { ...(p.progress.challengeRuns || {}), [challengeId]: runCountRun((p.progress.challengeRuns || {})[challengeId] || run) },
          challengeSessions: { ...sessions, [challengeId]: countRun(session) },
        },
      };
    });
    return true;
  }, [commitPlayer]);

  const recordChallengeHint = useCallback((challengeId: string): boolean => {
    const prev = playerRef.current;
    const run = prev.progress.challengeRuns?.[challengeId] || null;
    if (!run || !runCanHint(run)) return false;
    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const session = beginSession(sessions[challengeId] || null, challengeId, 'level', Date.now(), toleranceFor(p.level));
      return {
        ...p,
        progress: {
          ...p.progress,
          challengeRuns: { ...(p.progress.challengeRuns || {}), [challengeId]: runCountHint((p.progress.challengeRuns || {})[challengeId] || run) },
          challengeSessions: { ...sessions, [challengeId]: countHint(session) },
        },
      };
    });
    return true;
  }, [commitPlayer]);

  const cancelChallenge = useCallback((challengeId: string) => {
    const prev = playerRef.current;
    const run = prev.progress.challengeRuns?.[challengeId] || null;
    if (!run || (run.status !== 'active' && run.status !== 'paused')) return;
    commitPlayer(p => settleChallengeFailed(p, challengeId, (p.progress.challengeRuns || {})[challengeId] || run, '放弃挑战', Date.now()));
  }, [commitPlayer]);

  const timeoutChallenge = useCallback((challengeId: string): boolean => {
    const prev = playerRef.current;
    const run = prev.progress.challengeRuns?.[challengeId] || null;
    if (!run || !isTimedOut(run, Date.now())) return false;
    commitPlayer(p => settleChallengeFailed(p, challengeId, (p.progress.challengeRuns || {})[challengeId] || run, '挑战超时', Date.now()));
    play('error');
    return true;
  }, [commitPlayer]);

  /** 唯一提交入口：真实判题 + 单次结算。隐藏测试只回传数量，绝不回传表达式。 */
  const submitChallenge = useCallback(async (challengeId: string, code: string): Promise<ChallengeSubmitResult> => {
    const def = independentChallengeById(challengeId);
    if (!def) return { status: 'blocked', reason: '未知挑战' };
    const prev = playerRef.current;
    const run = prev.progress.challengeRuns?.[challengeId] || null;
    if (!run || run.status !== 'active') return { status: 'blocked', reason: '挑战未在进行中，请先进入挑战' };
    const now = Date.now();
    if (isTimedOut(run, now)) {
      const next = settleChallengeFailed(prev, challengeId, run, '挑战超时', now);
      commitPlayer(() => next);
      play('error');
      return { status: 'timeout', reason: '挑战超时', runState: next.progress.challengeRuns?.[challengeId] || null };
    }
    const ck = checkUserCode(code);
    if (!ck.allowed) return { status: 'blocked', reason: '安全策略阻止：' + ck.reason };
    if (!runCanSubmit(run)) {
      const next = settleChallengeFailed(prev, challengeId, run, '提交次数用尽', now);
      commitPlayer(() => next);
      play('error');
      return { status: 'fail', reason: '提交次数用尽', runState: next.progress.challengeRuns?.[challengeId] || null };
    }

    // 提交消耗 1 次提交 + 1 次运行（与普通关卡一致）
    const counted = commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const curRun = (p.progress.challengeRuns || {})[challengeId] || run;
      const session = countSubmit(countRun(beginSession(sessions[challengeId] || null, challengeId, 'level', Date.now(), toleranceFor(p.level))));
      return {
        ...p,
        progress: {
          ...p.progress,
          challengeRuns: { ...(p.progress.challengeRuns || {}), [challengeId]: runCountSubmit(runCountRun(curRun)) },
          challengeSessions: { ...sessions, [challengeId]: session },
        },
      };
    });
    let countedRun = counted.progress.challengeRuns?.[challengeId] || run;

    const publicChecks = def.judge.judgeKind === 'python' ? (def.judge.pythonChecks || []) : [];
    const hiddenChecks = def.hiddenChecks || [];
    const combined = def.judge.judgeKind === 'python'
      ? combineWithHarness(code, buildHarness(publicChecks))
      : code;

    const r = await runPython(combined, { timeoutMs: 5000 });

    const recordErrorAndMaybeSettle = (reason: string): PlayerState => {
      const base = commitPlayer(p => {
        const sessions = p.progress.challengeSessions || {};
        const session = countError(beginSession(sessions[challengeId] || null, challengeId, 'level', Date.now(), toleranceFor(p.level)));
        return { ...p, progress: { ...p.progress, challengeSessions: { ...sessions, [challengeId]: session } } };
      });
      const freshRun = base.progress.challengeRuns?.[challengeId] || countedRun;
      if (!runCanSubmit(freshRun)) {
        const settled = settleChallengeFailed(base, challengeId, freshRun, reason, Date.now());
        commitPlayer(() => settled);
        return settled;
      }
      return base;
    };

    if (r.timedOut) {
      const next = recordErrorAndMaybeSettle('执行超时');
      play('error');
      return { status: 'timeout', run: r, reason: '执行超时', runState: next.progress.challengeRuns?.[challengeId] || null };
    }
    if (!r.ok) {
      const next = recordErrorAndMaybeSettle(r.error ? r.error.type + ': ' + r.error.message : '执行出错');
      play('error');
      return { status: 'error', run: r, verdict: { passed: false, checks: [], error: r.error }, runState: next.progress.challengeRuns?.[challengeId] || null };
    }

    const publicVerdict = judgeRun(def.judge, r);
    let hiddenPassed = 0;
    const hiddenTotal = hiddenChecks.length;
    let hiddenVerdict: JudgeVerdict | null = null;
    if (hiddenTotal > 0) {
      const hr = await runPython(combineWithHarness(code, buildHarness(hiddenChecks)), { timeoutMs: 5000 });
      if (hr.ok) {
        hiddenVerdict = judgeRun({ judgeKind: 'python', pythonChecks: hiddenChecks }, hr);
        hiddenPassed = (hiddenVerdict.checks || []).filter(c => c.ok).length;
      }
    }
    const hiddenOk = hiddenTotal === 0 || hiddenPassed === hiddenTotal;
    const publicOk = publicVerdict.passed;

    // 推进阶段 / 连锁 Bug / 隐藏测试状态（只影响本次运行状态）
    let nextRun = countedRun;
    if (def.stages && def.stages.length) {
      for (const s of def.stages) {
        const cur = nextRun.stages.find(x => x.id === s.id);
        if (cur && cur.done) continue;
        const done = s.id === 'stage-syntax' ? true
          : s.id === 'stage-logic' ? publicOk
          : s.id === 'stage-hidden' ? hiddenOk
          : publicOk;
        if (done) nextRun = completeStage(nextRun, s.id);
      }
    }
    if (publicOk) {
      for (const b of nextRun.bugs) if (!b.fixed) nextRun = fixBug(nextRun, b.id);
    }
    if (hiddenVerdict && def.hiddenTests) {
      for (let i = 0; i < def.hiddenTests.length; i++) {
        const ht = def.hiddenTests[i];
        const check = hiddenVerdict.checks?.[i];
        if (ht && check) nextRun = markHiddenTest(nextRun, ht.id, check.ok);
      }
    }

    let overall = publicOk && hiddenOk;
    if (def.stages && def.stages.length) overall = allStagesDone(nextRun);

    if (overall) {
      const res = settleChallengePass(counted, challengeId, nextRun, def, now);
      commitPlayer(() => res.player);
      play('success');
      toast('achieve', '挑战完成：' + def.title + '（+' + res.expGained + ' 经验，+' + res.creditsGained + ' 贡献点）');
      return {
        status: 'pass', run: r, verdict: publicVerdict, settlement: res.settlement,
        expGained: res.expGained, creditsGained: res.creditsGained,
        hiddenPassed, hiddenTotal, runState: res.player.progress.challengeRuns?.[challengeId] || null,
      };
    }

    // 失败但未终结：记录失误；提交次数用尽则结算失败
    if (!runCanSubmit(nextRun)) {
      const next = settleChallengeFailed(counted, challengeId, nextRun, '提交次数用尽', now);
      commitPlayer(() => next);
      play('error');
      return { status: 'fail', reason: '提交次数用尽', run: r, verdict: publicVerdict, hiddenPassed, hiddenTotal, runState: next.progress.challengeRuns?.[challengeId] || null };
    }
    const nextPlayer = commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const session = countError(beginSession(sessions[challengeId] || null, challengeId, 'level', now, toleranceFor(p.level)));
      return {
        ...p,
        progress: {
          ...p.progress,
          challengeRuns: { ...(p.progress.challengeRuns || {}), [challengeId]: nextRun },
          challengeSessions: { ...sessions, [challengeId]: session },
        },
      };
    });
    play('error');
    return { status: 'fail', run: r, verdict: publicVerdict, hiddenPassed, hiddenTotal, runState: nextPlayer.progress.challengeRuns?.[challengeId] || nextRun };
  }, [commitPlayer, toast]);

  // ---------- 动态事件引擎（V1.3-A A3/A4） ----------
  const snapshotOf = useCallback((): EngineSnapshot => {
    const p = playerRef.current;
    return { current: p.progress.dynamicEvent ?? null, cooldowns: p.progress.eventCooldowns ?? {} };
  }, []);

  const commitSnapshot = useCallback((snap: EngineSnapshot) => {
    commitPlayer(p => ({
      ...p,
      progress: { ...p.progress, dynamicEvent: snap.current, eventCooldowns: normalizeCooldowns(snap.cooldowns) },
    }));
  }, [commitPlayer]);

  /** 动态事件结束/取消时释放 P2 仲裁锁，并分发队列中等待的事件 */
  const releaseDynamicCombatLock = useCallback((status: CombatEventStatus, reason?: string) => {
    const p = playerRef.current;
    const bossId = p.progress.currentBossId;
    if (!bossId) return;
    const runtime = phaseRuntimeOf(p, bossId);
    if (!runtime || !runtime.run) return;
    const now = Date.now();
    let arbiter = readCombatArbiter(p, bossId, runtime.run, runtime.plan, now);
    if (arbiter.active && arbiter.active.eventType === 'dynamic-crisis') {
      const rel = releaseExclusive(arbiter, arbiter.active.eventId, status, now, reason);
      arbiter = rel.state;
      commitPlayer(pp => withCombatArbiter(pp, arbiter));
      if (rel.promoted) dispatchPromotedRef.current(rel.promoted);
    }
  }, [commitPlayer]);

  const advanceDynamicEvent = useCallback(() => {
    const snap = snapshotOf();
    const before = snap.current;
    const next = evAdvance(snap, Date.now());
    if (next.current !== snap.current) commitSnapshot(next);
    if (before && next.current && before.result == null && next.current.result === 'timeout') {
      const bossId = playerRef.current.progress.currentBossId;
      if (bossId) {
        recordBossStat(bossId, {
          eventId: 'dynamic-timeout:' + before.id,
          eventType: 'dynamic-timeout',
          source: 'eventEngine',
          payload: { instanceId: before.id, defId: before.defId, durationMs: Math.max(0, Date.now() - before.startedAt) },
        }, Date.now());
      }
    }
  }, [snapshotOf, commitSnapshot, recordBossStat]);

  const completeDynamicEvent = useCallback(() => {
    const snap = snapshotOf();
    if (!evIsBlocking(snap.current)) return;
    const cur = snap.current;
    commitSnapshot(evResolve(snap, Date.now()));
    releaseDynamicCombatLock('resolved', 'dynamic-completed');
    if (cur) {
      const bossId = playerRef.current.progress.currentBossId;
      if (bossId) recordBossStat(bossId, {
        eventId: 'dynamic-success:' + cur.id,
        eventType: 'dynamic-success',
        source: 'player',
        payload: { instanceId: cur.id, defId: cur.defId, durationMs: Math.max(0, Date.now() - cur.startedAt) },
      }, Date.now());
      const now = Date.now();
      const reward = miraAwardPlayer(playerRef.current, {
        eventId: 'mira:crisis:' + cur.id, xp: 15, source: 'crisis',
        memoryId: 'mira-major-crisis', now,
      });
      if (reward.result.changed) commitPlayer(p => ({ ...p, mira: reward.result.state }));
      announceMira(reward.result);
      const withAch = applyAchievementRecalc(playerRef.current, now);
      if (withAch !== playerRef.current) commitPlayer(() => withAch);
      toast('info', 'MIRA：隔离协议完成。我会记住这次入侵的波形。');
    }
    play('success');
  }, [snapshotOf, commitSnapshot, releaseDynamicCombatLock, recordBossStat]);

  const abandonDynamicEvent = useCallback(() => {
    const snap = snapshotOf();
    if (!evIsBlocking(snap.current)) return;
    const cur = snap.current;
    commitSnapshot(evCancel(snap, Date.now()));
    releaseDynamicCombatLock('cancelled', 'dynamic-abandoned');
    if (cur) {
      const bossId = playerRef.current.progress.currentBossId;
      if (bossId) recordBossStat(bossId, {
        eventId: 'dynamic-failed:' + cur.id,
        eventType: 'dynamic-failed',
        source: 'player',
        payload: { instanceId: cur.id, defId: cur.defId, durationMs: Math.max(0, Date.now() - cur.startedAt) },
      }, Date.now());
    }
    play('deny');
  }, [snapshotOf, commitSnapshot, releaseDynamicCombatLock, recordBossStat]);

  const recoverDynamicEvent = useCallback(() => {
    const snap = snapshotOf();
    const cur = snap.current;
    commitSnapshot(evRecover(snap, Date.now()));
    releaseDynamicCombatLock('cancelled', 'dynamic-recovered');
    if (cur) {
      const bossId = playerRef.current.progress.currentBossId;
      if (bossId) recordBossStat(bossId, {
        eventId: 'dynamic-cancelled:' + cur.id,
        eventType: 'dynamic-cancelled',
        source: 'eventEngine',
        payload: { instanceId: cur.id, defId: cur.defId, durationMs: Math.max(0, Date.now() - cur.startedAt) },
      }, Date.now());
    }
  }, [snapshotOf, commitSnapshot, releaseDynamicCombatLock, recordBossStat]);

  const dismissDynamicEvent = useCallback(() => {
    const snap = snapshotOf();
    if (!snap.current) return;
    commitSnapshot(evDismiss(snap));
    releaseDynamicCombatLock('cancelled', 'dynamic-dismissed');
  }, [snapshotOf, commitSnapshot, releaseDynamicCombatLock]);

  const confirmIntrusionStep = useCallback((): { ok: boolean; complete: boolean; missesLeft: number } => {
    const p = playerRef.current;
    const cur = p.progress.dynamicEvent;
    if (!cur || cur.defId !== UNKNOWN_INTRUSION_ID || cur.status !== 'active') {
      return { ok: false, complete: false, missesLeft: 0 };
    }
    const d = intrusionDataOf(cur.data);
    const step = d.step + 1;
    if (step >= INTRUSION_RECOVER_STEPS) {
      completeDynamicEvent();
      return { ok: true, complete: true, missesLeft: d.missesLeft };
    }
    commitPlayer(pp => ({
      ...pp,
      progress: {
        ...pp.progress,
        dynamicEvent: pp.progress.dynamicEvent ? { ...pp.progress.dynamicEvent, data: { step, missesLeft: d.missesLeft } } : null,
      },
    }));
    play('click');
    return { ok: true, complete: false, missesLeft: d.missesLeft };
  }, [commitPlayer, completeDynamicEvent]);

  const missIntrusionStep = useCallback((): { missesLeft: number; forcedOut: boolean } => {
    const p = playerRef.current;
    const cur = p.progress.dynamicEvent;
    if (!cur || cur.defId !== UNKNOWN_INTRUSION_ID || cur.status !== 'active') {
      return { missesLeft: 0, forcedOut: false };
    }
    const d = intrusionDataOf(cur.data);
    const missesLeft = Math.max(0, d.missesLeft - 1);
    if (missesLeft <= 0) {
      abandonDynamicEvent();
      return { missesLeft: 0, forcedOut: true };
    }
    commitPlayer(pp => ({
      ...pp,
      progress: {
        ...pp.progress,
        dynamicEvent: pp.progress.dynamicEvent ? { ...pp.progress.dynamicEvent, data: { step: d.step, missesLeft } } : null,
      },
    }));
    play('deny');
    return { missesLeft, forcedOut: false };
  }, [commitPlayer, abandonDynamicEvent]);

  const triggerDynamicEvent = useCallback((defId: string, opts?: { eventId?: string; fromPromotion?: boolean }): { ok: boolean; reason?: string } => {
    const p = playerRef.current;
    const bossId = p.progress.currentBossId;
    const runtime = bossId ? phaseRuntimeOf(p, bossId) : null;
    const now = Date.now();
    const snap = snapshotOf();

    // 非 Boss 战：保持原有动态事件行为
    if (!runtime || !runtime.run) {
      const out = tryTrigger(snap, defId, now, { data: { ...defaultIntrusionData() } });
      if (!out.ok) return { ok: false, reason: out.reason };
      commitSnapshot(out.snapshot);
      toast('warn', '未知入侵警报：检测到外部渗透，请立即隔离。');
      play('threat');
      return { ok: true };
    }

    const run = runtime.run;
    const bid = bossId as string;
    let arbiter = readCombatArbiter(p, bid, run, runtime.plan, now);
    const eventId: string = (opts && opts.eventId) ? opts.eventId : combatEventId('crisis', run.battleId, defId + '@' + now);
    let preemptedWeaknessCrack = false;
    if (!opts || !opts.fromPromotion) {
      const requested = requestExclusive(arbiter, {
        eventId,
        eventType: 'dynamic-crisis',
        priority: COMBAT_PRIORITY.CRISIS,
        conflictGroup: 'crisis',
        expiresInMs: 120000,
        payload: { defId },
      }, now);
      arbiter = requested.state;
      preemptedWeaknessCrack = !!requested.preempted && requested.preempted.eventType === 'weakness-crack';
      if (!requested.ok) {
        if (requested.queued) commitPlayer(pp => withCombatArbiter(pp, arbiter));
        return { ok: false, reason: requested.reason === 'duplicate' ? 'duplicate' : 'queued' };
      }
    }

    const out = tryTrigger(snap, defId, now, { data: { ...defaultIntrusionData() } });
    if (!out.ok) {
      const rel = releaseExclusive(arbiter, eventId, 'cancelled', now, 'dynamic-trigger-failed');
      arbiter = rel.state;
      commitPlayer(pp => withCombatArbiter(pp, arbiter));
      if (rel.promoted) dispatchPromotedRef.current(rel.promoted);
      return { ok: false, reason: out.reason };
    }

    // P2 高于 P5：立即取消当前 Boss 攻击
    let attackState = (p.progress.bossAttacks || {})[bid] as BossAttackState | undefined;
    let cancelledAttack: BossAttackState | undefined;
    const attackEvents: BossBattleEvent[] = [];
    if (attackState) {
      const cancelled = cancelAttack(attackState, now, 'dynamic-crisis');
      if (cancelled.changed) {
        cancelledAttack = cancelled.state;
        attackEvents.push(...cancelled.events);
      }
    }

    let next: PlayerState = {
      ...p,
      progress: {
        ...p.progress,
        dynamicEvent: out.snapshot.current,
        eventCooldowns: normalizeCooldowns(out.snapshot.cooldowns),
        combatArbiter: arbiter,
        ...(cancelledAttack
          ? { bossAttacks: { ...(p.progress.bossAttacks || {}), [bid]: cancelledAttack } }
          : {}),
      },
    };
    next = recordStatsInPlayer(next, bid, {
      eventId: 'dynamic-trigger:' + out.state.id,
      eventType: 'dynamic-triggered',
      phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
      source: 'eventEngine',
      payload: { defId, instanceId: out.state.id },
    }, now);
    if (cancelledAttack) {
      next = recordStatsInPlayer(next, bid, {
        eventId: 'dynamic-atk-interrupted:' + out.state.id,
        eventType: 'dynamic-attack-interrupted',
        phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
        source: 'arbiter',
        payload: { instanceId: out.state.id, defId },
      }, now);
    }
    if (preemptedWeaknessCrack) {
      // 被更高优先级危机抢占的破解不算玩家失败，只记录取消
      next = recordStatsInPlayer(next, bid, {
        eventId: 'weakness-cancelled:' + out.state.id,
        eventType: 'weakness-cancelled',
        phaseId: runtime.plan.phases[run.currentPhaseIndex].phaseId,
        source: 'arbiter',
        payload: { reason: 'dynamic-priority', instanceId: out.state.id },
      }, now);
    }
    playerRef.current = next;
    setPlayer(next);
    bossBattleEventBus.emit(attackEvents);
    toast('warn', '未知入侵警报：检测到外部渗透，请立即隔离。');
    play('threat');
    return { ok: true };
  }, [snapshotOf, commitSnapshot, commitPlayer, toast]);

  dispatchPromotedRef.current = (event: CombatEvent) => {
    if (event.eventType === 'dynamic-crisis') {
      const defId = typeof event.payload.defId === 'string' ? event.payload.defId : UNKNOWN_INTRUSION_ID;
      triggerDynamicEvent(defId, { eventId: event.eventId, fromPromotion: true });
      return;
    }
    const p = playerRef.current;
    const bossId = p.progress.currentBossId;
    if (!bossId) return;
    const runtime = phaseRuntimeOf(p, bossId);
    if (!runtime || !runtime.run) return;
    const now = Date.now();
    const arbiter = readCombatArbiter(p, bossId, runtime.run, runtime.plan, now);
    const rel = releaseExclusive(arbiter, event.eventId, 'cancelled', now, 'unsupported-promoted');
    commitPlayer(pp => withCombatArbiter(pp, rel.state));
  };

  const combatArbiterStateOf = useCallback((bossId: string): CombatArbiterState | null => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return null;
    if (isTerminalStatus(runtime.run.status)) return null;
    return readCombatArbiter(cur, bossId, runtime.run, runtime.plan, Date.now());
  }, []);

  const devForcePlayerDeath = useCallback((bossId: string) => {
    commitPlayer(p => ({ ...p, consciousness: 0 }));
    startDeathRef.current(bossId, 'DEV 终结事件测试', 0);
  }, [commitPlayer]);

  const devForceBossVictory = useCallback((bossId: string) => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return;
    const now = Date.now();
    const run = runtime.run;
    commitPlayer(p => {
      let next = p;
      const attack = (p.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
      if (attack) next = withBossAttack(next, cancelAttack(attack, now, 'dev-victory').state);
      const weakness = (p.progress.bossWeaknesses || {})[bossId];
      if (weakness) next = withBossWeakness(next, closeWeaknessRun(weakness, now).state);
      const finished = finishBattle(run, 'victory', now);
      if (finished.ok) next = withPhaseRun(next, finished.run);
      return closeCombatForPlayer(next, bossId, 'victory', now);
    });
  }, [commitPlayer]);

  const devResetDynamicEventCooldowns = useCallback(() => {
    commitPlayer(p => ({ ...p, progress: { ...p.progress, eventCooldowns: {} } }));
  }, [commitPlayer]);

  /** 仲裁器 tick：过期清理、刷新后恢复动态事件锁、攻击锁一致性 */
  const tickCombatArbiter = useCallback((bossId: string) => {
    const cur = playerRef.current;
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime || !runtime.run) return;
    const run = runtime.run;
    const now = Date.now();
    let arbiter = readCombatArbiter(cur, bossId, run, runtime.plan, now);
    let changed = false;
    let attackState = (cur.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
    let cancelledAttack: BossAttackState | undefined;
    const events: BossBattleEvent[] = [];

    const dyn = cur.progress.dynamicEvent;
    if (evIsBlocking(dyn ?? null) && dyn) {
      const eventId = combatEventId('crisis', run.battleId, dyn.id);
      if (!arbiter.active || arbiter.active.eventId !== eventId) {
        const requested = requestExclusive(arbiter, {
          eventId, eventType: 'dynamic-crisis', priority: COMBAT_PRIORITY.CRISIS,
          conflictGroup: 'crisis', expiresInMs: 120000, payload: { defId: dyn.defId },
        }, now);
        if (requested.ok) {
          arbiter = requested.state;
          changed = true;
          if (attackState) {
            const cancelled = cancelAttack(attackState, now, 'dynamic-crisis');
            if (cancelled.changed) {
              cancelledAttack = cancelled.state;
              events.push(...cancelled.events);
            }
          }
        }
      }
    } else if (arbiter.active && arbiter.active.eventType === 'dynamic-crisis') {
      const rel = releaseExclusive(arbiter, arbiter.active.eventId, 'cancelled', now, 'dynamic-not-blocking');
      arbiter = rel.state;
      changed = true;
      if (rel.promoted) dispatchPromotedRef.current(rel.promoted);
    }

    const expired = expireCombatEvents(arbiter, now);
    if (expired.state !== arbiter) {
      arbiter = expired.state;
      changed = true;
    }

    if (arbiter.active && arbiter.active.eventType === 'boss-attack') {
      const live = attackState && (attackState.attackState === 'telegraph' || attackState.attackState === 'attacking' || attackState.attackState === 'resolving');
      if (!live) {
        const rel = releaseExclusive(arbiter, arbiter.active.eventId, 'cancelled', now, 'attack-not-live');
        arbiter = rel.state;
        changed = true;
        if (rel.promoted) dispatchPromotedRef.current(rel.promoted);
      }
    }

    if (!changed) return;
    commitPlayer(p => {
      let next = withCombatArbiter(p, arbiter);
      if (cancelledAttack) next = withBossAttack(next, cancelledAttack);
      return next;
    });
    bossBattleEventBus.emit(events);
  }, [commitPlayer]);

  /** 通关：经验、星级、知识卡片、关卡/服务器解锁、成就、升级 */
  const completeLevel = useCallback((levelId: string): CompletePayload | null => {
    const level = levelById(levelId);
    if (!level) return null;
    const prev = playerRef.current;
    // 入口门禁：关卡所在章节必须已开放（旧档继承放行由 canEnterServer 统一处理）
    const serverGate = canEnterServer(prev, level.serverId);
    if (!serverGate.ok) return null;
    const firstTime = !prev.progress.completedLevels.includes(levelId);
    // 同一会话只允许结算一次：重复提交/重复触发结算不会重复发奖
    const activeSession = prev.progress.challengeSessions?.[levelId];
    if (activeSession && activeSession.status === 'passed') return null;
    const att = prev.progress.failedAttempts[levelId] || 0;
    const stars = att === 0 ? 3 : att === 1 ? 2 : 1;
    const prevStars = prev.progress.stars[levelId] || 0;
    const oldLevel = prev.level;

    const completed = prev.progress.completedLevels.includes(levelId)
      ? prev.progress.completedLevels
      : [...prev.progress.completedLevels, levelId];
    const knowledge = [...new Set([...prev.progress.knowledge, ...level.knowledge])];
    // A5 经验增幅：只在首次通关时生效，按配置倍率结算并消耗 1 次
    const boostRw = normalizeRewards(prev.rewards);
    const expBoost = firstTime && boostRw.buffs.expBoost && boostRw.buffs.expBoost.uses > 0 ? boostRw.buffs.expBoost : null;
    const expGain = firstTime ? Math.round(level.rewardExp * (expBoost ? expBoost.mult : 1)) : 0;
    const nextExp = prev.exp + expGain;
    let next: PlayerState = {
      ...prev,
      exp: nextExp,
      level: levelForExp(nextExp),
      progress: {
        ...prev.progress,
        completedLevels: completed,
        stars: { ...prev.progress.stars, [levelId]: Math.max(prevStars, stars) },
        knowledge,
        failedAttempts: { ...prev.progress.failedAttempts, [levelId]: 0 },
        flags: { ...prev.progress.flags },
      },
    };
    if (att > 0) next.progress.flags.chapter1ZeroFail = false;
    if (level.serverId === 'syntax' && att === 0 && next.progress.flags.chapter1ZeroFail !== false) {
      next.progress.flags.chapter1ZeroFail = true;
    }
    // 训练终端完成 → 开放语法维修站（新手五个修复端）
    if (level.id === 'tut-1' && !next.progress.unlockedServers.includes('syntax')) {
      next.progress.unlockedServers = [...next.progress.unlockedServers, 'syntax'];
    }
    // 服务器解锁 + 章节完成标记
    const siblings = levelsOfServer(level.serverId);
    const serverDone = siblings.length > 0 && siblings.every(l => next.progress.completedLevels.includes(l.id));
    if (serverDone && !next.progress.unlockedServers.includes(level.serverId)) {
      next.progress.unlockedServers = [...next.progress.unlockedServers, level.serverId];
    }
    // 章节关卡完成标记：只记录「本章普通关卡全通」（Boss 是否必经由 chapterFlow 判定）
    // 注意：这里绝不解锁下一章、绝不发放创世主碎片——二者只能由 Boss 首胜统一事务产生。
    if (level.serverId === 'syntax' && serverDone) {
      next.progress.flags.chapter1Done = true;
    }
    if (level.serverId === 'logs' && serverDone) {
      next.progress.flags.chapter2Done = true;
    }
    if (level.serverId === 'storage' && serverDone) {
      next.progress.flags.chapter3Done = true;
    }
    if (level.serverId === 'factory' && serverDone) {
      // 第四章完成：核心机房溢出信号，但最高权限封锁保持
      next.progress.flags.chapter4Done = true;
    }
    if (level.serverId === 'diag' && serverDone) {
      // 第五章完成：核心机房封锁开始解除（第六章入口仍需 ENTROPY 首胜 + 五枚碎片）
      next.progress.flags.chapter5Done = true;
    }
    // 终章普通关卡完成只代表外围修复完成：chapter6Done / 第六枚碎片只由 K-0 首胜写入
    const newAch = recalcAchievements(next);
    const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
    next.progress.achievements = newAch;
    // ---------- 奖励系统结算（与经验/等级并行，互不覆盖；仅在真实判题通过时执行） ----------
    const prevRewards = normalizeRewards(prev.rewards);
    const hintsUsed = prev.progress.hintLevels[levelId] || 0;
    const alreadyCleared = !!prevRewards.cleared[levelId];
    const v2 = computeLevelRewardV2({
      levelExp: level.rewardExp,
      fails: att,
      hints: hintsUsed,
      firstClear: !alreadyCleared,
      prevStars,
      newStars: stars,
    });
    const breakdown: RewardBreakdown = {
      grade: v2.grade,
      base: v2.base,
      firstClear: v2.firstClearBonus,
      noFail: v2.noFail,
      noHint: v2.noHint,
      gradeBonus: v2.gradeBonus,
      improvement: v2.improvement,
      total: v2.total,
      trustGain: v2.trustGain,
    };
    const rewards: RewardState = {
      ...prevRewards,
      credits: safeCredits(prevRewards.credits + breakdown.total),
      trust: Math.min(100, prevRewards.trust + breakdown.trustGain),
      cleared: {
        ...prevRewards.cleared,
        [levelId]: { grade: breakdown.grade as Grade, fails: att, hints: hintsUsed, credits: breakdown.total, trust: breakdown.trustGain },
      },
      skins: [...prevRewards.skins],
      items: { ...prevRewards.items },
      chapterRewards: [...prevRewards.chapterRewards],
    };
    if (expBoost) {
      const uses = Math.max(0, expBoost.uses - 1);
      rewards.buffs = { ...prevRewards.buffs, expBoost: uses > 0 ? { ...expBoost, uses } : null };
    }

    // 章节奖励：整章通关时发放一次（幂等）
    let chapterRewardPayload: NonNullable<CompletePayload['reward']>['chapterReward'] = undefined;
    const chapterDef = chapterRewardOf(chapterIndexForServer(level.serverId));
    const serverDoneAfter = siblings.length > 0 && siblings.every(l => next.progress.completedLevels.includes(l.id));
    if (chapterDef && serverDoneAfter && !rewards.chapterRewards.includes(chapterDef.id)) {
      rewards.chapterRewards.push(chapterDef.id);
      rewards.credits = safeCredits(rewards.credits + chapterDef.credits);
      if (chapterDef.skins && chapterDef.skins.length) rewards.skins = [...new Set([...rewards.skins, ...chapterDef.skins])];
      if (chapterDef.items) {
        for (const [k, v] of Object.entries(chapterDef.items)) rewards.items[k] = (rewards.items[k] || 0) + v;
      }
      if (chapterDef.fragment &&
          !CREATOR_FRAGMENTS.some(f => f.id === chapterDef.fragment) &&
          !next.meta.memoryFragments.includes(chapterDef.fragment)) {
        // 章节奖励只允许非主线的档案残片（f8 等）；创世主六碎片只能由 Boss 首胜发放
        next.meta.memoryFragments = [...next.meta.memoryFragments, chapterDef.fragment];
      }
      chapterRewardPayload = {
        id: chapterDef.id, title: chapterDef.title, desc: chapterDef.desc,
        credits: chapterDef.credits, skins: chapterDef.skins || [], items: chapterDef.items || {},
        fragment: chapterDef.fragment,
      };
    }
    // 等级解锁：称号 / 头像框 / 粒子（升级时发放并自动装备）
    const unlockNames: string[] = [];
    for (const u of unlocksForLevel(oldLevel, next.level)) {
      if (rewards.skins.includes(u.id)) continue;
      rewards.skins = [...rewards.skins, u.id];
      rewards.unlocks = [...(rewards.unlocks || []), u.id];
      if (u.slot) rewards.equipped = { ...rewards.equipped, [u.slot]: u.id };
      unlockNames.push(u.name);
    }

    // ---------- 统一挑战会话结算（A4）：成功结算的唯一数据源 ----------
    const settleNow = Date.now();
    const sessionBase = activeSession ?? { ...createSession(levelId, 'level', settleNow, toleranceFor(oldLevel)), errors: att };
    const settlement = buildPassedSettlement(sessionBase, {
      now: settleNow,
      levelBefore: oldLevel,
      levelAfter: next.level,
      expBefore: prev.exp,
      expAfter: next.exp,
      creditsGained: breakdown.total + (chapterRewardPayload?.credits || 0),
    });
    next.progress.challengeSessions = normalizeSessions({
      ...(prev.progress.challengeSessions || {}),
      [levelId]: settle(sessionBase, settlement),
    });

    // A6 奖励账本：首通入账一次；重复通关只记录星级补偿；章节奖励独立入账
    const ledgerAt = settleNow;
    rewards.ledger = appendLedger(rewards.ledger, { kind: 'level', ref: levelId, credits: breakdown.total, exp: expGain, at: ledgerAt });
    if (!firstTime && (breakdown.improvement || 0) > 0) {
      rewards.ledger = appendLedger(rewards.ledger, { kind: 'level-repeat', ref: levelId + ':' + stars, credits: breakdown.improvement || 0, exp: 0, at: ledgerAt });
    }
    if (chapterRewardPayload) {
      rewards.ledger = appendLedger(rewards.ledger, { kind: 'chapter', ref: chapterRewardPayload.id, credits: chapterRewardPayload.credits, exp: 0, at: ledgerAt });
    }

    next.rewards = rewards;

    // V1.3-C：MIRA 只从真实通关/探索/剧情/成就事件成长；事件 ID 幂等
    let miraPlayer = next;
    const levelAward = miraAwardPlayer(miraPlayer, {
      eventId: 'mira:level:' + levelId,
      xp: firstTime ? 10 : 4,
      source: 'challenge',
      memoryId: 'mira-first-fix',
      now: settleNow,
    });
    miraPlayer = levelAward.player;
    announceMira(levelAward.result);
    const prevServers = prev.progress.unlockedServers || [];
    const newServer = (next.progress.unlockedServers || []).find(s => !prevServers.includes(s));
    if (newServer) {
      const exploreAward = miraAwardPlayer(miraPlayer, {
        eventId: 'mira:explore:' + newServer, xp: 8, source: 'explore',
        memoryId: 'mira-first-explore', now: settleNow,
      });
      miraPlayer = exploreAward.player;
      announceMira(exploreAward.result);
      if (exploreAward.result.changed) {
        const scene = miraSceneLine('enter-region', normalizeMiraState(miraPlayer.mira), {}, settleNow);
        miraPlayer = { ...miraPlayer, mira: scene.state };
        toast('info', 'MIRA：' + scene.text);
      }
    }
    if (next.progress.flags.chapter1Done && !prev.progress.flags.chapter1Done) {
      const storyAward = miraAwardPlayer(miraPlayer, {
        eventId: 'mira:story:chapter1', xp: 12, source: 'story',
        memoryId: 'mira-key-story', now: settleNow,
      });
      miraPlayer = storyAward.player;
      announceMira(storyAward.result);
    }
    for (const ach of gained) {
      const achAward = miraAwardPlayer(miraPlayer, {
        eventId: 'mira:achievement:' + ach, xp: 6, source: 'achievement', now: settleNow,
      });
      miraPlayer = achAward.player;
      announceMira(achAward.result);
    }
    next.mira = miraPlayer.mira;

    // V1.3-D：探索终端挑战成功 → 完成真实探索节点（幂等奖励）
    const exState = normalizeExplorationState(next.progress.exploration, settleNow);
    const exResult = completeTerminalChallenge(exState, levelId, true, settleNow);
    let settlementAchievements = [...gained];
    if (exResult.changed) {
      const beforeAch = new Set(next.progress.achievements);
      next = { ...next, progress: { ...next.progress, exploration: exResult.state } };
      next = grantExplorationReward(next, exResult, settleNow);
      next = applyAchievementRecalc(next, settleNow);
      for (const id of next.progress.achievements) {
        if (!beforeAch.has(id) && !settlementAchievements.includes(id)) settlementAchievements.push(id);
      }
      toast('info', 'MIRA：终端修复完成，探索记录已更新。');
    }

    playerRef.current = next;
    setPlayer(next);
    unlockNames.forEach(n => toast('achieve', '等级解锁：' + n));
    if (chapterRewardPayload) {
      toast('achieve', '章节奖励：' + chapterRewardPayload.title + '（+' + chapterRewardPayload.credits + ' 贡献点）');
      play('unlock');
    }

    gained.forEach(id => {
      const def = achievementById(id);
      if (def) toast('achieve', '成就解锁：' + def.name + (def.hidden ? '（隐藏）' : ''));
    });
    if (next.level > oldLevel) play('levelup'); else if (firstTime) play('success');
    return {
      levelId,
      firstTime,
      expGained: expGain,
      expBoosted: !!expBoost,
      expBoostMult: expBoost ? expBoost.mult : undefined,
      levelUp: next.level > oldLevel,
      oldLevel,
      newLevel: next.level,
      stars,
      newAchievements: settlementAchievements,
      unlocks: unlockNames,
      session: settlement,
      reward: {
        breakdown,
        fails: att,
        hints: hintsUsed,
        creditsTotal: rewards.credits,
        trustTotal: rewards.trust,
        trustUp: rewards.trust > prevRewards.trust,
        chapterReward: chapterRewardPayload,
        duplicate: alreadyCleared,
      },
    };
  }, [toast]);

  /** 正式提交失败：计数 +1；超过容错时优先消耗护符/护盾，否则触发纠错者攻击 */
  const recordFail = useCallback((levelId: string): FailPayload => {
    if (eventRef.current.kind !== 'none') return { n: 0, tolerance: 0, triggered: false };
    const prev = playerRef.current;
    const n = (prev.progress.failedAttempts[levelId] || 0) + 1;
    const tol = toleranceFor(prev.level);
    let protectedBy: 'guard' | 'shield' | undefined;

    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const cur = sessions[levelId];
      const rw = normalizeRewards(p.rewards);
      let fails = n;
      let buffs = rw.buffs;
      if (n > tol) {
        if (rw.buffs.guard > 0) { protectedBy = 'guard'; buffs = { ...rw.buffs, guard: rw.buffs.guard - 1 }; fails = 0; }
        else if (rw.buffs.shield > 0) { protectedBy = 'shield'; buffs = { ...rw.buffs, shield: rw.buffs.shield - 1 }; fails = 0; }
      }
      return {
        ...p,
        rewards: { ...rw, buffs },
        progress: {
          ...p.progress,
          failedAttempts: { ...p.progress.failedAttempts, [levelId]: fails },
          // 会话 errors 与 failedAttempts 同源；防护生效时按「防御成功」语义清零
          challengeSessions: cur
            ? { ...sessions, [levelId]: protectedBy ? { ...cur, errors: 0 } : countError(cur) }
            : sessions,
        },
      };
    });

    if (protectedBy) {
      toast('success', protectedBy === 'guard'
        ? '容错护符生效：这次攻击被挡下，本关失误计数已清零'
        : '护盾核心生效：攻击被自动拦截，本关失误计数已清零');
      play('shield');
      return { n, tolerance: tol, triggered: false, protectedBy };
    }
    if (n > tol) {
      const pool = DEFENSE_TASKS.map(t => t.id);
      const defenseId = pool[Math.floor(Math.random() * pool.length)];
      setEvent({ kind: 'attack', levelId, defenseId, attemptsLeft: 2 });
      play('threat');
      return { n, tolerance: tol, triggered: true };
    }
    return { n, tolerance: tol, triggered: false };
  }, [commitPlayer, toast]);

  /**
   * 唯一的 Boss 攻击入口。
   * UI 只能提交「用户代码」，真实 Python 执行、判题、伤害结算、首胜事务全部在这里完成：
   * 前端无法通过传入血量 / 掩码 / 胜利标记绕过主线条件。
   */
  const submitBossAttack = useCallback(async (
    bossId: string,
    phaseIndex: number,
    code: string,
  ): Promise<BossAttackResult> => {
    const cur = playerRef.current;
    const raw = (cur.progress.battles || {})[bossId];
    const difficulty = difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined);
    const def = bossBattleDef(bossId, difficulty);
    const boss = bossById(bossId);
    if (!def || !boss) return { status: 'blocked', reason: '战斗数据缺失' };
    if (!raw || typeof raw !== 'object') return { status: 'blocked', reason: '请先选择挑战难度' };

    const gate = bossGate(cur, bossId);
    if (!gate.available && !gate.simulation) return { status: 'blocked', reason: gate.reason };
    const simulation = gate.simulation;

    // 多阶段战斗：优先读取自愈后的运行状态；旧存档 / 首次攻击时按真实血量补建
    const runtime = phaseRuntimeOf(cur, bossId);
    if (!runtime) return { status: 'blocked', reason: 'Boss 阶段配置缺失' };
    let run = runtime.run;
    if (!run) {
      const battleState = normalizeBattleState(raw, def);
      const now = Date.now();
      const created = createBossPhaseRun(runtime.plan, now, { hp: battleState.hp });
      const prepared = prepareBattle(created, now);
      const activated = activateBattle(prepared.run, runtime.plan, now);
      run = activated.run;
      const snapshot = run;
      commitPlayer(p => withPhaseRun(p, snapshot));
      bossBattleEventBus.emit([...prepared.events, ...activated.events]);
    }
    // 兼容旧入口：未显式选择难度就提交时，按当前锁定难度隐式开始战斗（与旧行为一致）
    if (run.status === 'idle' || run.status === 'preparing') {
      const now = Date.now();
      const prepared = prepareBattle(run, now);
      const activated = activateBattle(prepared.run, runtime.plan, now);
      if (!activated.ok) return { status: 'blocked', reason: activated.reason || '战斗无法开始' };
      run = activated.run;
      const snapshot = run;
      commitPlayer(p => withPhaseRun(p, snapshot));
      bossBattleEventBus.emit([...prepared.events, ...activated.events]);
    }
    if (run.status === 'phase_transition') {
      return { status: 'blocked', reason: '阶段切换演出中：请等待新阶段初始化完成' };
    }
    if (run.status !== 'active') {
      return { status: 'blocked', reason: '战斗状态不允许提交：' + phaseStatusText(run) };
    }

    const phase = def.phases[Math.max(0, Math.min(phaseIndex, def.phases.length - 1))];
    const currentBattlePhase = runtime.plan.phases[run.currentPhaseIndex];
    if (currentBattlePhase && !currentBattlePhase.availableChallenges.includes(phase.id)) {
      return { status: 'blocked', reason: '当前战斗阶段不允许该挑战，请刷新战斗界面' };
    }
    // 统计事件归属「战斗阶段」而非判题阶段索引（一个战斗阶段可能包含多个判题阶段）
    const statPhaseId = currentBattlePhase ? currentBattlePhase.phaseId : runtime.plan.phases[0].phaseId;

    const state = normalizeBattleState(raw, def);
    if (Math.min(state.phase, def.phases.length - 1) !== phaseIndex) {
      return { status: 'blocked', reason: '阶段不同步，请刷新战斗界面' };
    }
    run = reconcileBossPhaseRun(run, runtime.plan, { hp: state.hp, maxHp: state.maxHp }, Date.now());
    if (run.status === 'phase_transition') {
      return { status: 'blocked', reason: '阶段切换演出中：请等待新阶段初始化完成' };
    }
    if (run.status !== 'active') {
      return { status: 'blocked', reason: '战斗状态不允许提交：' + phaseStatusText(run) };
    }

    const ck = checkUserCode(code);
    if (!ck.allowed) {
      recordBossStat(bossId, {
        eventId: 'challenge-invalid:' + run.battleId + ':' + phase.id + ':' + Date.now(),
        eventType: 'challenge-result',
        phaseId: statPhaseId,
        source: 'security',
        payload: { outcome: 'invalid', reason: 'security' },
      }, Date.now());
      return { status: 'blocked', reason: '安全策略阻止：' + ck.reason, denied: true };
    }

    // 挑战统计 + Boss 与普通关卡共用同一套会话计数：每次攻击 = 一次提交 + 一次运行
    const started = recordChallengeStart(run, phase.id, Date.now());
    run = started.run;
    const challengeStatId = 'challenge:' + run.battleId + ':' + phase.id + ':' + run.stats.challengeAttempts;
    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const base = beginSession(sessions[bossId] || null, bossId, 'boss', Date.now(), toleranceFor(p.level));
      const withSession: PlayerState = {
        ...p,
        progress: { ...p.progress, challengeSessions: { ...sessions, [bossId]: countRun(countSubmit(base)) } },
      };
      return withPhaseRun(withSession, run as BossBattleRunState);
    });
    bossBattleEventBus.emit(started.events);

    const combined = phase.judge.judgeKind === 'python'
      ? combineWithHarness(code, buildHarness(phase.judge.pythonChecks || []))
      : code;

    const recordMiss = (outcome: 'failed' | 'runtime-error' | 'timeout' = 'failed') => {
      const now = Date.now();
      const resultStep = recordChallengeResult(run as BossBattleRunState, phase.id, false, now);
      run = resultStep.run;
      const events = [...resultStep.events];
      if (!simulation) {
        const dmgStep = recordDamageReceived(run, def.counterDamage, now);
        run = dmgStep.run;
        events.push(...dmgStep.events);
      }
      const snapshot = run;
      commitPlayer(p => {
        let next = withPhaseRun(p, snapshot);
        next = recordStatsInPlayer(next, bossId, {
          eventId: challengeStatId,
          eventType: 'challenge-result',
          phaseId: runtime.plan.phases[snapshot.currentPhaseIndex].phaseId,
          source: 'gameStore',
          payload: {
            outcome,
            reason: outcome === 'timeout' ? 'timeout' : outcome === 'runtime-error' ? 'runtime-error' : 'judge-failed',
            phaseCleared: false,
          },
        }, now);
        return next;
      });
      bossBattleEventBus.emit(events);
    };

    const r = await runPython(combined, { timeoutMs: 5000 });
    if (r.timedOut || !r.ok) {
      recordMiss(r.timedOut ? 'timeout' : 'runtime-error');
      if (!simulation) {
        recordFail(bossId);
        bossCounterAttack(bossId, def.counterDamage);
      }
      const verdict: JudgeVerdict = { passed: false, checks: [], error: r.error, timedOut: r.timedOut };
      return { status: r.timedOut ? 'timeout' : 'error', run: r, verdict, countered: !simulation };
    }

    const verdict = judgeRun(phase.judge, r);
    const res = resolveSubmission(def, state, phaseIndex, verdict.checks);
    if (res.newPassed === 0) {
      recordMiss();
      const failPayload = simulation ? { triggered: false } : recordFail(bossId);
      if (!simulation) bossCounterAttack(bossId, def.counterDamage);
      return {
        status: 'miss', run: r, verdict, result: res,
        countered: !simulation, toleranceTriggered: failPayload.triggered,
      };
    }

    // 真实命中：挑战结果 →（弱点加成）→ 伤害 → 阶段切换检测
    const now = Date.now();
    const weaknessDefs = weaknessDefsForRun(bossId, run);
    let weaknessRun = readWeaknessRun(cur, bossId, runtime.run || run, runtime.plan, now);
    const exposure = exposureInfo(weaknessRun, weaknessDefs, now);
    const phaseEvents: BossBattleEvent[] = [];
    if (verdict.passed) {
      const observed = observeWeakness(weaknessRun, weaknessDefs, { kind: 'challenge-success', challengeId: phase.id }, now);
      if (observed.changed) {
        weaknessRun = observed.state;
        phaseEvents.push(...observed.events);
      }
    }

    let effectiveRes = res;
    let weaknessBonus = 0;
    let weaknessCarry = 0;
    if (exposure.active && !simulation) {
      const mult = exposure.damageMultiplier;
      if (!res.phaseCleared) {
        const seg = phaseHp(def);
        const lower = Math.max(0, def.maxHp - (phaseIndex + 1) * seg);
        const floor = Math.min(state.hp, Math.max(1, lower + 1));
        const planned = Math.ceil(res.damage * mult);
        const hpAfter = Math.max(floor, Math.min(state.hp, state.hp - planned));
        const boostedDamage = Math.max(0, state.hp - hpAfter);
        weaknessBonus = Math.max(0, boostedDamage - res.damage);
        effectiveRes = { ...res, damage: boostedDamage, hpAfter };
      } else if (!res.defeated) {
        const currentBattlePhase = runtime.run ? runtime.run.currentPhaseIndex : 0;
        const nextBattlePhase = runtime.plan.phases[currentBattlePhase + 1];
        const hpPct = def.maxHp > 0 ? (res.hpAfter / def.maxHp) * 100 : 0;
        if (nextBattlePhase && hpPct <= nextBattlePhase.hpThreshold + 1e-9) {
          const extra = Math.max(0, Math.ceil(res.damage * (mult - 1)));
          const nextIdx = currentBattlePhase + 1;
          const nextUpper = phaseHpUpper(runtime.plan, nextIdx);
          const nextLower = nextUpper - runtime.plan.phases[nextIdx].maxHp;
          const minNext = nextIdx >= runtime.plan.phases.length - 1 ? 0 : nextLower + 1;
          weaknessCarry = Math.max(0, Math.min(extra, nextUpper - minNext));
          weaknessBonus = weaknessCarry;
          effectiveRes = { ...res, damage: res.damage + weaknessCarry };
        }
      }
    }
    if (weaknessCarry > 0) weaknessRun = setCarryDamage(weaknessRun, weaknessCarry, now);

    const resultStep = recordChallengeResult(run, phase.id, verdict.passed, now);
    run = resultStep.run;
    phaseEvents.push(...resultStep.events);
    const damageStep = applyDamage(run, effectiveRes.damage, now);
    run = damageStep.run;
    phaseEvents.push(...damageStep.events);
    if (run.status === 'active') {
      const transStep = evaluatePhaseTransition(run, runtime.plan, {
        hp: effectiveRes.hpAfter,
        maxHp: run.maxHp,
        completedChallenges: run.completedChallenges,
      }, now);
      if (transStep.ok) {
        run = transStep.run;
        phaseEvents.push(...transStep.events);
      }
    }
    const runSnapshot = run;

    // 阶段切换 P1：取得仲裁锁；若动态事件 P2 正在进行，则按优先级抢占并清理
    let phaseArbiter: CombatArbiterState | null = null;
    let phasePreemptedDynamic = false;
    if (runSnapshot.status === 'phase_transition' && runSnapshot.transition) {
      const newPhaseIndex = runSnapshot.transition.toIndex;
      const newPhase = runtime.plan.phases[newPhaseIndex];
      const phaseRun = runtime.run as BossBattleRunState;
      let arb = readCombatArbiter(cur, bossId, phaseRun, runtime.plan, now);
      arb = invalidatePhase(arb, newPhase.phaseId, now).state;
      const requested = requestExclusive(arb, {
        eventId: combatEventId('phase', runSnapshot.battleId, runSnapshot.transition.id),
        eventType: 'phase-transition',
        priority: COMBAT_PRIORITY.BATTLE_FLOW,
        conflictGroup: 'battle-flow',
        phaseId: newPhase.phaseId,
        expiresInMs: 15000,
        payload: { from: runSnapshot.transition.fromIndex, to: runSnapshot.transition.toIndex },
      }, now);
      phaseArbiter = requested.state;
      phasePreemptedDynamic = evIsBlocking(cur.progress.dynamicEvent ?? null) ||
        (!!requested.preempted && requested.preempted.eventType === 'dynamic-crisis');
    }

    // 伤害写入（掩码来自真实判题结果；模拟再战同样推进战斗，但不发永久奖励）
    // 阶段切换 / 战斗结束：立即取消或同步当前攻击，避免旧阶段攻击在新阶段结算
    const attackEvents: BossBattleEvent[] = [];
    let next = commitPlayer(p => {
      const latestRaw = (p.progress.battles || {})[bossId];
      const latestDiff = difficultyOf(latestRaw && typeof latestRaw === 'object' ? (latestRaw as { difficulty?: unknown }).difficulty : undefined);
      const latestDef = bossBattleDef(bossId, latestDiff) || def;
      const curState = normalizeBattleState(latestRaw, latestDef);
      const masks = curState.phaseMask.slice();
      masks[phaseIndex] = (masks[phaseIndex] || 0) | res.mask;
      const candidate: BossBattleState = {
        ...curState,
        hp: Math.max(0, Math.min(curState.maxHp, effectiveRes.hpAfter)),
        phase: Math.max(curState.phase, res.phaseAfter),
        phaseMask: masks,
        started: true,
        cleared: false,
        updatedAt: Date.now(),
      };
      candidate.cleared = verifyBattleState(latestDef, candidate).ok;
      let playerNext = withPhaseRun(
        { ...p, progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: candidate } } },
        runSnapshot,
      );
      const currentAttack = (p.progress.bossAttacks || {})[bossId] as BossAttackState | undefined;
      if (currentAttack && (runSnapshot.status === 'phase_transition' || isTerminalStatus(runSnapshot.status))) {
        const step = runSnapshot.status === 'phase_transition'
          ? syncAttackPhase(currentAttack, runtime.plan.phases[runSnapshot.currentPhaseIndex].phaseId, runSnapshot.currentPhaseIndex, now)
          : cancelAttack(currentAttack, now, 'battle-end');
        if (step.changed) {
          playerNext = withBossAttack(playerNext, step.state);
          attackEvents.push(...step.events);
        }
      }
      playerNext = recordStatsInPlayer(playerNext, bossId, {
        eventId: challengeStatId,
        eventType: 'challenge-result',
        phaseId: statPhaseId,
        source: 'gameStore',
        payload: {
          outcome: verdict.passed ? 'passed' : 'failed',
          reason: verdict.passed ? undefined : (verdict.error ? verdict.error.type : 'judge-failed'),
          phaseCleared: res.phaseCleared,
        },
      }, now);
      if (weaknessBonus > 0) {
        playerNext = recordStatsInPlayer(playerNext, bossId, {
          eventId: challengeStatId + ':weak',
          eventType: 'weakness-boss-damage',
          phaseId: statPhaseId,
          source: 'weakness',
          payload: { amount: weaknessBonus, weaknessId: exposure.definition ? exposure.definition.weaknessId : null },
        }, now);
      }
      if (isTerminalStatus(runSnapshot.status)) {
        const closed = closeWeaknessRun(weaknessRun, now);
        attackEvents.push(...closed.events);
        playerNext = withoutBossWeakness(playerNext, bossId);
        const terminalType = runSnapshot.status === 'victory' ? 'victory' : 'defeat';
        playerNext = closeCombatForPlayer(playerNext, bossId, terminalType, now);
        if (terminalType === 'victory') playerNext = rateVictoryInPlayer(playerNext, bossId, now);
      } else {
        playerNext = withBossWeakness(playerNext, weaknessRun);
        if (phaseArbiter) {
          let withArb = withCombatArbiter(playerNext, phaseArbiter);
          if (phasePreemptedDynamic) {
            withArb = { ...withArb, progress: { ...withArb.progress, dynamicEvent: null } };
          }
          playerNext = withArb;
        }
      }
      return playerNext;
    });
    bossBattleEventBus.emit([...phaseEvents, ...attackEvents]);

    // V1.3-C：真实 Victory 的 MIRA 记忆兜底（与 EventBus 订阅使用同一幂等 ID）
    if (res.defeated && !simulation && runSnapshot.status === 'victory' && runSnapshot.battleId) {
      const reward = miraAwardPlayer(playerRef.current, {
        eventId: 'mira:boss:victory:' + runSnapshot.battleId,
        xp: 30, source: 'boss', memoryId: 'mira-boss-victory', now,
      });
      if (reward.result.changed) {
        const line = miraSceneLine('boss-victory', normalizeMiraState(reward.result.state), {}, now);
        commitPlayer(p => ({ ...p, mira: line.state }));
        announceMira(reward.result);
        toast('info', 'MIRA：' + line.text);
      }
    }

    if (!res.defeated) {
      return {
        status: 'hit', run: r, verdict, result: effectiveRes,
        weaknessDamage: weaknessBonus > 0 ? weaknessBonus : undefined,
        weaknessMultiplier: exposure.active ? exposure.damageMultiplier : undefined,
      };
    }

    // 模拟再战：记录难度通关 / 一次性徽章，但不发碎片、不推进章节
    if (simulation) {
      const dc = recordBossDifficultyClear(next, bossId, difficulty, { now: Date.now() });
      next = dc.player;
      next = {
        ...next,
        rewards: {
          ...normalizeRewards(next.rewards),
          ledger: appendLedger(normalizeRewards(next.rewards).ledger, {
            kind: 'difficulty', ref: bossId + ':' + difficulty,
            credits: dc.credits, exp: dc.exp,
          }),
        },
        progress: { ...next.progress, challengeSessions: passedBossSessionsFor(next, bossId, dc.exp, dc.credits) },
      };
      next = grantVictoryRewardsInPlayer(next, bossId, difficulty, dc.firstTime, Date.now());
      next = evaluateAchievementsInPlayer(next, bossId, difficulty, Date.now());
      if (run.battleId) next = archiveBossBattleForPlayer(next, run.battleId, { firstClear: false, fragmentGranted: false, now: Date.now() });
      playerRef.current = next;
      setPlayer(next);
      return {
        status: 'simVictory', run: r, verdict, result: effectiveRes, firstClear: null,
        difficultyClear: {
          difficulty,
          exp: dc.exp,
          credits: dc.credits,
          badgeId: dc.badgeId,
          titleUnlocked: dc.titleUnlocked,
          firstTime: dc.firstTime,
        },
      };
    }

    // 阶段全部击破 → 统一首胜事务（内部会再次校验真实战斗状态 + 难度）
    const firstClear = handleBossFirstClear(next, bossId, { difficulty });
    let payload: BossFirstClearPayload | null = null;
    if (firstClear.changed && firstClear.payload) {
      payload = firstClear.payload;
      next = firstClear.player;
      if (payload.credits > 0) {
        toast('achieve', '章节奖励：+' + payload.credits + ' 贡献点（' + (payload.unlocks[0] || '') + '）');
      }
    } else if (!firstClear.changed && res.defeated) {
      toast('warn', '首胜事务未执行：' + firstClear.reason);
    }
    // Boss 会话结算：无论是否首胜，本次战斗都算一次通过的挑战（不发额外奖励）
    const bossRw = normalizeRewards(next.rewards);
    let bossLedger = appendLedger(bossRw.ledger, {
      kind: 'boss', ref: bossId, credits: payload?.credits || 0, exp: payload?.expGained || 0,
    });
    if (payload && (payload.difficultyCredits > 0 || payload.difficultyExp > 0)) {
      bossLedger = appendLedger(bossLedger, {
        kind: 'difficulty', ref: bossId + ':' + difficulty,
        credits: payload.difficultyCredits, exp: payload.difficultyExp,
      });
    }
    next = {
      ...next,
      rewards: { ...bossRw, ledger: bossLedger },
      progress: {
        ...next.progress,
        challengeSessions: passedBossSessionsFor(next, bossId, payload?.expGained || 0, payload?.credits || 0),
      },
    };
    if (payload) next = grantVictoryRewardsInPlayer(next, bossId, difficulty, true, Date.now());
    next = evaluateAchievementsInPlayer(next, bossId, difficulty, Date.now());
    if (run.battleId) next = archiveBossBattleForPlayer(next, run.battleId, { firstClear: !!payload, fragmentGranted: payload?.fragmentGranted === true, now: Date.now() });
    // V1.3-C：真实 Boss 胜利记忆/成长（与 EventBus 订阅使用同一幂等 ID）
    if (run.battleId) {
      const victoryAt = Date.now();
      const miraReward = miraAwardPlayer(next, {
        eventId: 'mira:boss:victory:' + run.battleId,
        xp: 30, source: 'boss', memoryId: 'mira-boss-victory', now: victoryAt,
      });
      if (miraReward.result.changed) {
        const scene = miraSceneLine('boss-victory', normalizeMiraState(miraReward.result.state), {}, victoryAt);
        next = { ...miraReward.player, mira: scene.state };
        announceMira(miraReward.result);
        toast('info', 'MIRA：' + scene.text);
      }
    }
    playerRef.current = next;
    setPlayer(next);
    return {
      status: 'victory', run: r, verdict, result: effectiveRes, firstClear: payload,
      weaknessDamage: weaknessBonus > 0 ? weaknessBonus : undefined,
      weaknessMultiplier: exposure.active ? exposure.damageMultiplier : undefined,
      reason: firstClear.changed ? undefined : firstClear.reason,
    };
  }, [commitPlayer, recordFail, bossCounterAttack, toast]);

  /** 攻击事件结算：成功清零容错；失败 -30% 意识（到 0 触发死亡） */
  const resolveDefense = useCallback((ok: boolean) => {
    const ev = eventRef.current;
    if (ev.kind !== 'attack') return;
    const prev = playerRef.current;
    const levelId = ev.levelId;
    let next: PlayerState = {
      ...prev,
      progress: {
        ...prev.progress,
        failedAttempts: { ...prev.progress.failedAttempts, [levelId]: 0 },
        flags: { ...prev.progress.flags },
      },
    };
    if (ok) {
      next.progress.flags.defenseWon = true;
      // 防御成功：本关容错计数清零（会话与 failedAttempts 同步清零）
      const sessions = next.progress.challengeSessions || {};
      const cur = sessions[levelId];
      if (cur) next.progress.challengeSessions = { ...sessions, [levelId]: { ...cur, errors: 0 } };
      const newAch = recalcAchievements(next);
      const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
      next.progress.achievements = newAch;
      setPlayer(next);
      setEvent({ kind: 'none' });
      play('shield');
      gained.forEach(id => {
        const def = achievementById(id);
        if (def) toast('achieve', '成就解锁：' + def.name);
      });
      toast('success', '防御成功：纠错者已被击退，本关容错计数已清零。');
    } else {
      const rwB = normalizeRewards(next.rewards);
      const resolution = resolvePlayerDamage(next.consciousness, rwB.buffs.barrier, 30);
      const barrier = resolution.barrierConsumed;
      const dmg = resolution.applied;
      const c = resolution.consciousness;
      if (barrier) next.rewards = { ...rwB, buffs: { ...rwB.buffs, barrier: resolution.barrierLayers } };
      next.consciousness = c;
      const now = Date.now();
      const bossId = prev.progress.currentBossId;
      if (bossId) {
        const runtime = phaseRuntimeOf(prev, bossId);
        if (runtime && runtime.run) {
          let arbiter = readCombatArbiter(prev, bossId, runtime.run, runtime.plan, now);
          arbiter = recordCombatEvent(arbiter, {
            eventId: combatEventId('defense', runtime.run.battleId, levelId + '@' + now),
            eventType: 'damage',
            priority: COMBAT_PRIORITY.DYNAMIC,
            conflictGroup: 'dynamic',
            expiresInMs: 60000,
            payload: { source: 'environment-defense', amount: dmg },
          }, now);
          next.progress.combatArbiter = arbiter;
          next = recordStatsInPlayer(next, bossId, {
            eventId: 'defense-dmg:' + runtime.run.battleId + ':' + levelId + '@' + now,
            eventType: 'damage-taken',
            phaseId: runtime.plan.phases[runtime.run.currentPhaseIndex].phaseId,
            source: 'combatDamage',
            payload: { amount: dmg, shieldAbsorbed: Math.max(0, 30 - dmg), consciousness: c, source: 'environment-defense' },
          }, now);
        }
      }
      if (c <= 0) {
        next.meta = {
          ...next.meta,
          deaths: next.meta.deaths + 1,
          lastDeathLevel: levelId,
          lastDeathReason: '纠错者攻击 · 两次防御失败',
        };
        next.progress.pendingRebirth = true;
        next.progress.challengeSessions = failedSessionsFor(next, levelId, '纠错者攻击 · 两次防御失败', prev.consciousness);
        if (bossId) {
          const bid = (next.progress.bossAttacks || {})[bossId]?.battleId || (next.progress.bossBattles || {})[bossId]?.battleId || null;
          const closed = closeCombatForPlayer(next, bossId, 'death', now);
          setPlayer(bid ? archiveBossBattleForPlayer(closed, bid, { firstClear: false, fragmentGranted: false, now }) : closed);
        } else {
          setPlayer({ ...next, progress: { ...next.progress, dynamicEvent: null } });
        }
        setEvent({ kind: 'death', levelId, reason: next.meta.lastDeathReason || '' });
        play('death');
      } else {
        setPlayer(next);
        setEvent({ kind: 'none' });
        play('error');
        const barrierNote = barrier ? '（意识护罩已抵消一半伤害）' : '';
        toast('warn', '防御失败：意识完整度 -' + dmg + '%' + barrierNote + '（当前 ' + c + '%）。纠错者被暂时击退。');
      }
    }
  }, [toast]);

  /** 意识归零：写死亡标记 + 结算本次挑战（失败），随后进入重生流程 */
  const startDeath = useCallback((levelId: string, reason: string, consciousnessLoss?: number) => {
    const now = Date.now();
    setPlayer(p => {
      let next: PlayerState = {
        ...p,
        meta: { ...p.meta, deaths: p.meta.deaths + 1, lastDeathLevel: levelId, lastDeathReason: reason },
        progress: {
          ...p.progress,
          pendingRebirth: true,
          challengeSessions: failedSessionsFor(
            p, levelId, reason,
            typeof consciousnessLoss === 'number' && isFinite(consciousnessLoss) ? consciousnessLoss : p.consciousness,
          ),
        },
      };
      const bossId = p.progress.currentBossId;
      if (bossId) {
        next = recordStatsInPlayer(next, bossId, {
          eventId: 'player-death:' + bossId + ':' + (p.meta.deaths + 1),
          eventType: 'player-death',
          source: 'gameStore',
          payload: { reason },
        }, now);
        const bid = next.progress.bossBattles?.[bossId]?.battleId || phaseRuntimeOf(next, bossId)?.run?.battleId || null;
        next = closeCombatForPlayer(next, bossId, 'death', now);
        if (bid) next = archiveBossBattleForPlayer(next, bid, { firstClear: false, fragmentGranted: false, now });
      } else {
        next = { ...next, progress: { ...next.progress, dynamicEvent: null } };
      }
      return next;
    });
    setEvent({ kind: 'death', levelId, reason });
    play('death');
  }, []);
  startDeathRef.current = startDeath;

  /** 重生时把进行中的 Boss 战重置为满血第一阶段（已击破的保持不变） */
  const resetCurrentBattle = (p: PlayerState): Record<string, BossBattleState> => {
    const battles = { ...(p.progress.battles || {}) };
    const bossId = p.progress.currentBossId;
    if (!bossId) return battles;
    const raw = battles[bossId];
    const diff = difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined);
    const def = bossBattleDef(bossId, diff);
    if (def && !battles[bossId]?.cleared) battles[bossId] = createBattleState(def);
    return battles;
  };

  /** 重生结算：意识恢复 70%、保留成长、当前关卡进度重置待重打 */
  const finishRebirth = useCallback(() => {
    const prev = playerRef.current;
    const idx = prev.meta.rebirths;
    // 重生叙事奖励只写入「记忆日志」，不计入六枚创世主碎片
    // （创世主碎片只能来自对应章节 Boss 的首胜；旧档已收集的碎片不会被收回）
    const logs = [...(prev.meta.memoryLogs || [])];
    if (idx >= 2 && !logs.includes('log-f01')) logs.push('log-f01');
    const curLevel = prev.progress.currentLevelId;
    // 重生后本关容错计数清零（与 MIRA 提示一致；旧实现会保留计数导致重生后立刻再次触发攻击）
    const failedAttempts = curLevel
      ? { ...prev.progress.failedAttempts, [curLevel]: 0 }
      : prev.progress.failedAttempts;
    // 多阶段战斗：失败已写入历史；重生后为当前 Boss 建立全新的准备态运行
    let bossBattles = prev.progress.bossBattles;
    let bossAttacks = prev.progress.bossAttacks;
    let bossWeaknesses = prev.progress.bossWeaknesses;
    let combatArbiter = prev.progress.combatArbiter;
    const deathBossId = prev.progress.currentBossId;
    if (deathBossId && !prev.progress.battles?.[deathBossId]?.cleared) {
      const runtime = phaseRuntimeOf(prev, deathBossId);
      if (runtime) {
        const now = Date.now();
        const fresh = prepareBattle(createBossPhaseRun(runtime.plan, now), now).run;
        bossBattles = { ...(prev.progress.bossBattles || {}), [deathBossId]: fresh };
        const phase = runtime.plan.phases[0];
        bossAttacks = {
          ...(prev.progress.bossAttacks || {}),
          [deathBossId]: createBossAttackState(fresh.battleId, deathBossId, phase.phaseId, 0, now),
        };
        const defs = weaknessDefinitionsFor(deathBossId, runtime.plan.difficulty);
        if (defs.length > 0) {
          bossWeaknesses = {
            ...(prev.progress.bossWeaknesses || {}),
            [deathBossId]: createBossWeaknessRun(fresh.battleId, deathBossId, phase.phaseId, 0, defs, now),
          };
        }
        combatArbiter = createCombatArbiter(fresh.battleId, deathBossId, phase.phaseId, now);
      }
    }
    const next: PlayerState = {
      ...prev,
      consciousness: 70,
      meta: { ...prev.meta, rebirths: prev.meta.rebirths + 1, memoryLogs: logs },
      progress: { ...prev.progress, pendingRebirth: false, failedAttempts, battles: resetCurrentBattle(prev), bossBattles, bossAttacks, bossWeaknesses, combatArbiter },
    };
    const newAch = recalcAchievements(next);
    const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
    next.progress.achievements = newAch;
    setPlayer(next);
    setEvent({ kind: 'none' });
    setRespawnTick(t => t + 1);
    play('rebirth');
    gained.forEach(id => {
      const def = achievementById(id);
      if (def) toast('achieve', '成就解锁：' + def.name + (def.hidden ? '（隐藏）' : ''));
    });
  }, [toast]);

  /** 攻击事件：消耗一次防御尝试（不加意识惩罚） */
  const decrementAttackAttempt = useCallback(() => {
    setEvent(ev => (ev.kind === 'attack' ? { ...ev, attemptsLeft: ev.attemptsLeft - 1 } : ev));
  }, []);

  /** 载入存档时发现 pendingRebirth：直接进入重生流程（不再重复计死亡次数） */
  const triggerPendingDeath = useCallback(() => {
    const lv = playerRef.current.progress.currentLevelId || 'tut-1';
    setEvent({ kind: 'death', levelId: lv, reason: playerRef.current.meta.lastDeathReason || '意识残留异常（上次死亡未完成重建）' });
  }, []);

  /** 清空存档并重置为初始状态 */
  const wipeSave = useCallback(() => {
    // 清空存档时同时清掉本机的代码草稿：新存档不应看到上一周目的残留草稿
    clearAllDrafts();
    setPlayer(defaultState());
    setHasSave(false);
    setScreen('menu');
    setEvent({ kind: 'none' });
  }, []);

  // ---------- 存档管理 ----------
  const importSaveData = useCallback((text: string) => {
    const r = importSave(text);
    if (r.ok && r.state) {
      setPlayer(r.state);
      setHasSave(true);
      toast('success', '存档已导入。');
      return { ok: true };
    }
    toast('warn', '导入失败：' + (r.reason || '未知原因'));
    return { ok: false, reason: r.reason };
  }, [toast]);

  const exportSaveString = useCallback(() => exportSave(playerRef.current), []);

  const patchSettings = useCallback((patch: Partial<GameSettings>) => {
    setPlayer(p => ({ ...p, settings: { ...p.settings, ...patch } }));
  }, []);

  // ---------- 章节门禁（所有正式入口共用） ----------
  const chapterGateOf = useCallback((chapterId: string): ChapterGate =>
    chapterGate(playerRef.current, chapterId), []);
  const serverGate = useCallback((serverId: string) =>
    canEnterServer(playerRef.current, serverId), []);
  const bossEntryGate = useCallback((bossId: string): BossGate =>
    bossGate(playerRef.current, bossId), []);
  const originCoreGateNow = useCallback((): OriginCoreGate =>
    originCoreGate(playerRef.current), []);
  const bossRecord = useCallback((bossId: string) => bossRecordOf(playerRef.current, bossId), []);

  const value: GameCtx = {
    player, screen, event, toasts, saveCorrupted, hasSave,
    tolerance: toleranceFor(player.level),
    nav, toast, startNewGame, setCurrentLevel, setCurrentBoss, currentChallengeId, setCurrentChallenge, completeBoss,
    miraEnsureContact, miraMarkMemoryRead, miraSay: miraSpeak,
    explorationStateOf, exploreRegion, exploreInteract, exploreStartChallenge,
    beginBossBattle, startBossBattle, abandonBossBattle, bossRecord, submitBossAttack,
    bossPhaseRunOf, completeBossPhaseTransition,
    tickBossAttack: tickBossAttackNow, bossAttackStateOf, defendBossAttack, dodgeBossAttack,
    bossWeaknessStateOf, tickBossWeakness: tickBossWeaknessNow, analyzeBossWeakness, submitWeaknessCrack, setBossCombatPaused,
    combatArbiterStateOf, tickCombatArbiter, devForcePlayerDeath, devForceBossVictory, devResetDynamicEventCooldowns,
    ensureBossBattleStats,
    chapterGateOf, serverGate, bossEntryGate, originCoreGateNow,
    recordBug, recordEnding, markVaultRead, markVaultFinalSeen, setVaultLastOpened,
    completeLevel, recordFail, beginChallenge, recordRun, recordSubmit,
    enterChallenge, challengeRunOf, recordChallengeRun, recordChallengeHint, submitChallenge, cancelChallenge, timeoutChallenge,
    triggerDynamicEvent, advanceDynamicEvent, completeDynamicEvent, abandonDynamicEvent, recoverDynamicEvent, dismissDynamicEvent,
    confirmIntrusionStep, missIntrusionStep,
    buyShopItem, purchaseShopItem, useShopItem, equipItem, unequipItem, consumeHintTicket, consumeItem, restoreConsciousness, markArchiveRead,
    resetAttempts, hintUsed, resolveDefense, finishRebirth, startDeath,
    decrementAttackAttempt, triggerPendingDeath, wipeSave,
    markStory, unlockStoryEvent, recordStoryChoice, renamePlayer,
    addKnowledge, setFlag, patchSettings, importSaveData, exportSaveString,
    respawnTick, toggleMusic,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame must be used within GameProvider');
  return v;
}
