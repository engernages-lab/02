// Boss 战斗隐藏成就判定引擎（V1.3-B.5.4）
//
// 纯函数：读取 B.5.1 最终统计、B.5.2 正式评分与 B.5.3 奖励记录，
// 判定成就、计算进度与证据；不写存档、不发奖励、不改战斗。
//
// 正式解锁要求：真实 victory + stats finalized + dataQuality complete。

import { weaknessDefinitionsFor } from './bossWeaknessCatalog';
import type { BossBattleStatsState } from './bossBattleStats';
import type { BossBattleRating } from './bossBattleRating';
import type { BossBattleReward } from './bossBattleReward';
import { BOSS_BATTLE_RATING_VERSION } from './bossBattleRatingConfig';
import {
  BOSS_ACHIEVEMENT_DEFINITIONS,
  BOSS_ACHIEVEMENT_MAP,
  publicAchievementView,
  type BossAchievementPublicView,
  BOSS_ACHIEVEMENT_REWARD_CAPS,
  BOSS_ACHIEVEMENT_REWARD_VERSION,
  BOSS_ACHIEVEMENT_VERSION,
  type BossAchievementCondition,
  type BossAchievementDefinition,
  type BossAchievementRewardAmounts,
} from './bossAchievementConfig';

export type BossAchievementDataQuality = 'complete' | 'partial' | 'invalid';

export interface BossAchievementEvidence {
  battleId: string;
  bossId: string;
  difficulty: string;
  challengePassed: number;
  challengeJudged: number;
  challengeFailed: number;
  invalidChallengeCount: number;
  maxConsecutive: number;
  playerDeathCount: number;
  damageTaken: number;
  minConsciousness: number | null;
  defenseSuccess: number;
  dodgeSuccess: number;
  weaknessDiscovered: number;
  weaknessCracked: number;
  weaknessExposed: number;
  weaknessDamage: number;
  dynamicTriggered: number;
  dynamicSuccess: number;
  dynamicSuccessByDef: Record<string, number>;
  ratingGrade: string | null;
  ratingScore: number | null;
}

export interface BossAchievementProgressUpdate {
  achievementId: string;
  progress: number;
  target: number;
  completed: boolean;
  updatedAt: number;
  battleId: string;
}

export interface BossAchievementUnlockCandidate {
  achievementId: string;
  unlockedAt: number;
  battleId: string;
  bossId: string;
  difficulty: string;
  reward: BossAchievementRewardAmounts;
  evidence: BossAchievementEvidence;
  progress: number;
  target: number;
}

export interface BossAchievementEvaluatedItem {
  achievementId: string;
  completed: boolean;
  applicable: boolean;
  progress: number;
  target: number;
  reason: string | null;
}

export interface BossAchievementEvaluation {
  battleId: string;
  bossId: string;
  newlyUnlocked: BossAchievementUnlockCandidate[];
  progressUpdates: BossAchievementProgressUpdate[];
  rejectedAchievements: { achievementId: string; reason: string }[];
  evaluated: BossAchievementEvaluatedItem[];
  evaluationVersion: string;
  dataQuality: BossAchievementDataQuality;
  formalEligible: boolean;
  rejectionReason: string | null;
}

export interface BossAchievementEvaluationInput {
  stats: BossBattleStatsState | null | undefined;
  rating?: BossBattleRating | null;
  reward?: BossBattleReward | null;
  bossId?: string;
  difficulty?: string;
  battleResult?: string | null;
  definitions?: BossAchievementDefinition[];
  unlockedIds?: string[];
  now?: number;
}

const int = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

function difficultyOfStats(raw: string): 'easy' | 'hard' | 'expert' {
  return raw === 'hard' || raw === 'expert' ? raw : 'easy';
}

function ratingUsable(rating: BossBattleRating | null | undefined, stats: BossBattleStatsState): boolean {
  if (!rating || typeof rating !== 'object') return false;
  return rating.battleId === stats.battleId
    && rating.battleResult === 'victory'
    && rating.finalized === true
    && rating.dataQuality === 'complete'
    && rating.ratingVersion === BOSS_BATTLE_RATING_VERSION
    && rating.ratingId === 'rating:' + stats.battleId + ':' + BOSS_BATTLE_RATING_VERSION;
}

function buildEvidence(stats: BossBattleStatsState, rating: BossBattleRating | null, difficulty: string): BossAchievementEvidence {
  return {
    battleId: stats.battleId,
    bossId: stats.bossId,
    difficulty,
    challengePassed: int(stats.challengeStats.passedCount),
    challengeJudged: int(stats.challengeStats.judgedCount),
    challengeFailed: int(stats.challengeStats.failedCount),
    invalidChallengeCount: int(stats.challengeStats.invalidCount),
    maxConsecutive: int(stats.challengeStats.maxConsecutiveSuccess),
    playerDeathCount: int(stats.playerDeathCount),
    damageTaken: int(stats.attackStats.damageTaken),
    minConsciousness: typeof stats.minConsciousness === 'number' ? stats.minConsciousness : null,
    defenseSuccess: int(stats.defenseStats.defenseSuccessCount),
    dodgeSuccess: int(stats.defenseStats.dodgeSuccessCount),
    weaknessDiscovered: int(stats.weaknessStats.discoveredCount),
    weaknessCracked: int(stats.weaknessStats.crackSuccessCount),
    weaknessExposed: int(stats.weaknessStats.exposedCount),
    weaknessDamage: int(stats.weaknessStats.bossHpDamage),
    dynamicTriggered: int(stats.dynamicEventStats.triggeredCount),
    dynamicSuccess: int(stats.dynamicEventStats.successCount),
    dynamicSuccessByDef: { ...stats.dynamicEventStats.successByDef },
    ratingGrade: rating && ratingUsable(rating, stats) ? rating.grade : null,
    ratingScore: rating && ratingUsable(rating, stats) ? rating.displayScore : null,
  };
}

interface ConditionResult {
  value: number;
  target: number;
  completed: boolean;
  applicable: boolean;
  reason: string | null;
}

function countResult(value: number, target: number, applicable = true, reason: string | null = null): ConditionResult {
  return { value: int(value), target: Math.max(1, int(target)), completed: applicable && int(value) >= Math.max(1, int(target)), applicable, reason };
}

function binaryResult(completed: boolean, applicable = true, reason: string | null = null): ConditionResult {
  return { value: completed ? 1 : 0, target: 1, completed: applicable && completed, applicable, reason };
}

function checkCondition(
  condition: BossAchievementCondition,
  stats: BossBattleStatsState,
  rating: BossBattleRating | null,
  weaknessMechanics: boolean,
): ConditionResult {
  const c = stats.challengeStats;
  const a = stats.attackStats;
  const d = stats.defenseStats;
  const w = stats.weaknessStats;
  const e = stats.dynamicEventStats;
  switch (condition.kind) {
    case 'damage-at-most':
      return binaryResult(int(a.damageTaken) <= condition.value);
    case 'deaths-at-most':
      return binaryResult(int(stats.playerDeathCount) <= condition.value);
    case 'min-consciousness-at-most':
      if (typeof stats.minConsciousness !== 'number' || !Number.isFinite(stats.minConsciousness)) {
        return binaryResult(false, false, 'data-missing');
      }
      return binaryResult(stats.minConsciousness <= condition.value);
    case 'defense-or-dodge-at-least': {
      const attempts = d.defenseSuccessCount + d.defenseFailedCount + d.dodgeSuccessCount + d.dodgeFailedCount;
      if (attempts === 0 && a.startedCount === 0) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(d.defenseSuccessCount + d.dodgeSuccessCount, condition.value);
    }
    case 'all-challenges-passed':
      if (int(c.judgedCount) === 0) return binaryResult(false, false, 'data-missing');
      return binaryResult(
        int(c.judgedCount) >= condition.minJudged
        && int(c.passedCount) === int(c.judgedCount)
        && int(c.invalidCount) === 0,
      );
    case 'challenge-failures-at-most':
      if (int(c.judgedCount) === 0) return binaryResult(false, false, 'data-missing');
      return binaryResult(int(c.judgedCount) >= condition.minJudged && int(c.failedCount) <= condition.value);
    case 'consecutive-success-at-least':
      return countResult(c.maxConsecutiveSuccess, condition.value);
    case 'dodge-success-at-least':
      if (a.startedCount === 0 && int(d.dodgeSuccessCount) + int(d.dodgeFailedCount) === 0) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(d.dodgeSuccessCount, condition.value);
    case 'defense-success-at-least':
      if (a.startedCount === 0 && int(d.defenseSuccessCount) + int(d.defenseFailedCount) === 0) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(d.defenseSuccessCount, condition.value);
    case 'weakness-interrupt-at-least':
      if (!weaknessMechanics) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(a.interruptedByWeaknessCount, condition.value);
    case 'weakness-discovered-at-least':
      if (!weaknessMechanics) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(w.discoveredIds.length, condition.value);
    case 'unique-weakness-cracked-at-least':
      if (!weaknessMechanics) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(w.crackedIds.length, condition.value);
    case 'weakness-exploit-damage':
      if (!weaknessMechanics) return binaryResult(false, false, 'mechanic-unavailable');
      return binaryResult(int(w.crackSuccessCount) > 0 && int(w.bossHpDamage) > 0);
    case 'dynamic-success-at-least':
      if (int(e.triggeredCount) === 0) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(e.successCount, condition.value);
    case 'dynamic-def-success-at-least':
      if (int(e.triggeredCount) === 0) return countResult(0, condition.value, false, 'mechanic-unavailable');
      return countResult(e.successByDef[condition.defId] || 0, condition.value);
    case 'rating-grade': {
      if (!ratingUsable(rating, stats)) return binaryResult(false, false, 'data-missing');
      const order: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
      return binaryResult((order[rating!.grade] || 0) >= (order[condition.grade] || 0));
    }
  }
}

function evaluateDefinition(
  definition: BossAchievementDefinition,
  stats: BossBattleStatsState,
  rating: BossBattleRating | null,
  weaknessMechanics: boolean,
): { applicable: boolean; completed: boolean; progress: number; target: number; reason: string | null } {
  const results = definition.conditions.map(c => checkCondition(c, stats, rating, weaknessMechanics));
  const unavailable = results.find(r => !r.applicable);
  const countLike = results.filter(r => r.target > 1);
  const target = countLike.length === 1 ? countLike[0].target : 1;
  const progress = target > 1
    ? Math.min(target, Math.max(...results.filter(r => r.target === target).map(r => r.value)))
    : (results.every(r => r.completed) ? 1 : 0);
  if (unavailable) {
    return { applicable: false, completed: false, progress: 0, target, reason: unavailable.reason || 'mechanic-unavailable' };
  }
  return { applicable: true, completed: results.every(r => r.completed), progress, target, reason: null };
}

function ineligibleEvaluation(
  stats: BossBattleStatsState | null | undefined,
  bossId: string,
  quality: BossAchievementDataQuality,
  reason: string,
  definitions: BossAchievementDefinition[],
  now: number,
): BossAchievementEvaluation {
  const battleId = stats && typeof stats.battleId === 'string' ? stats.battleId : '';
  return {
    battleId,
    bossId,
    newlyUnlocked: [],
    progressUpdates: [],
    rejectedAchievements: definitions.map(d => ({ achievementId: d.id, reason })),
    evaluated: definitions.map(d => ({ achievementId: d.id, completed: false, applicable: false, progress: 0, target: 1, reason })),
    evaluationVersion: BOSS_ACHIEVEMENT_VERSION,
    dataQuality: quality,
    formalEligible: false,
    rejectionReason: reason,
  };
}

/** 判定本场 Boss 战斗的成就（纯函数） */
export function evaluateBossAchievements(input: BossAchievementEvaluationInput): BossAchievementEvaluation {
  const now = Math.max(0, Math.floor(Number.isFinite(input.now) ? (input.now as number) : Date.now()));
  const definitions = input.definitions && input.definitions.length > 0 ? input.definitions : BOSS_ACHIEVEMENT_DEFINITIONS;
  const stats = input.stats;
  if (!stats || typeof stats !== 'object' || typeof stats.battleId !== 'string' || !stats.battleId || typeof stats.bossId !== 'string' || !stats.bossId) {
    return ineligibleEvaluation(stats, input.bossId || '', 'invalid', 'missing-stats', definitions, now);
  }
  const bossId = input.bossId || stats.bossId;
  if (input.bossId && input.bossId !== stats.bossId) {
    return ineligibleEvaluation(stats, bossId, 'invalid', 'boss-mismatch', definitions, now);
  }
  const result = input.battleResult === undefined ? stats.result : input.battleResult;
  if (result !== stats.result) {
    return ineligibleEvaluation(stats, bossId, 'invalid', 'result-mismatch', definitions, now);
  }
  if (result !== 'victory') {
    return ineligibleEvaluation(stats, bossId, 'invalid', 'not-victory', definitions, now);
  }
  if (stats.finalized !== true) {
    return ineligibleEvaluation(stats, bossId, 'invalid', 'not-finalized', definitions, now);
  }
  if (stats.dataQuality !== 'complete') {
    return ineligibleEvaluation(stats, bossId, stats.dataQuality === 'invalid' ? 'invalid' : 'partial', stats.dataQuality === 'invalid' ? 'invalid-stats' : 'partial-stats', definitions, now);
  }

  const difficulty = input.difficulty || stats.difficulty || 'easy';
  let weaknessMechanics = false;
  try {
    weaknessMechanics = weaknessDefinitionsFor(bossId, difficultyOfStats(difficulty)).length > 0;
  } catch {
    weaknessMechanics = false;
  }
  const rating = ratingUsable(input.rating, stats) ? (input.rating as BossBattleRating) : null;
  const evidence = buildEvidence(stats, rating, difficulty);
  const unlocked = new Set(Array.isArray(input.unlockedIds) ? input.unlockedIds : []);
  const newlyUnlocked: BossAchievementUnlockCandidate[] = [];
  const progressUpdates: BossAchievementProgressUpdate[] = [];
  const rejectedAchievements: { achievementId: string; reason: string }[] = [];
  const evaluated: BossAchievementEvaluatedItem[] = [];

  for (const definition of definitions) {
    const r = evaluateDefinition(definition, stats, rating, weaknessMechanics);
    evaluated.push({
      achievementId: definition.id,
      completed: r.completed,
      applicable: r.applicable,
      progress: r.progress,
      target: r.target,
      reason: r.reason,
    });
    if (!r.applicable) {
      rejectedAchievements.push({ achievementId: definition.id, reason: r.reason || 'mechanic-unavailable' });
      continue;
    }
    progressUpdates.push({
      achievementId: definition.id,
      progress: r.completed ? r.target : Math.max(0, Math.min(r.target, r.progress)),
      target: r.target,
      completed: r.completed,
      updatedAt: now,
      battleId: stats.battleId,
    });
    if (r.completed && !unlocked.has(definition.id)) {
      newlyUnlocked.push({
        achievementId: definition.id,
        unlockedAt: now,
        battleId: stats.battleId,
        bossId,
        difficulty: difficultyOfStats(difficulty),
        reward: { ...definition.reward, fragments: 0 },
        evidence,
        progress: r.target,
        target: r.target,
      });
    }
  }

  return {
    battleId: stats.battleId,
    bossId,
    newlyUnlocked,
    progressUpdates,
    rejectedAchievements,
    evaluated,
    evaluationVersion: BOSS_ACHIEVEMENT_VERSION,
    dataQuality: 'complete',
    formalEligible: true,
    rejectionReason: null,
  };
}

/** 成就奖励纯计算（只统计数据，不发放） */
export function calculateBossAchievementReward(
  unlocks: { reward?: BossAchievementRewardAmounts; achievementId?: string }[],
  definitions?: BossAchievementDefinition[],
): BossAchievementRewardAmounts {
  let xp = 0, contribution = 0;
  for (const u of unlocks) {
    const reward = u.reward || (u.achievementId ? BOSS_ACHIEVEMENT_MAP[u.achievementId]?.reward : undefined);
    if (!reward) continue;
    xp += int(reward.xp);
    contribution += int(reward.contribution);
  }
  return {
    xp: Math.min(BOSS_ACHIEVEMENT_REWARD_CAPS.totalXp, xp),
    contribution: Math.min(BOSS_ACHIEVEMENT_REWARD_CAPS.totalContribution, contribution),
    fragments: 0,
  };
}

export function bossAchievementRewardId(achievementId: string): string {
  return 'boss-achievement-reward:' + achievementId + ':' + BOSS_ACHIEVEMENT_REWARD_VERSION;
}

export function publicBossAchievementViews(
  store: { unlocked: { achievementId: string; unlockedAt: number }[]; progress: { achievementId: string; progress: number; target: number }[] } | undefined | null,
  includeHiddenSecrets = false,
): BossAchievementPublicView[] {
  const unlockedMap = new Map((store?.unlocked || []).map(u => [u.achievementId, u.unlockedAt]));
  const progressMap = new Map((store?.progress || []).map(p => [p.achievementId, p]));
  return BOSS_ACHIEVEMENT_DEFINITIONS.map(def => {
    const at = unlockedMap.get(def.id) || null;
    const p = progressMap.get(def.id);
    return publicAchievementView(def, at != null, at, p?.progress || 0, p?.target || 1, includeHiddenSecrets);
  });
}
