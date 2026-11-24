// Boss 战斗奖励计算引擎（V1.3-B.5.3）
//
// 读取 B.5.1 最终统计与 B.5.2 正式评分，纯函数计算完整奖励。
// 现有 handleBossFirstClear / recordBossDifficultyClear 已发放基础与难度奖励；
// 本引擎通过 legacyOffset 扣减既有发放，只得到 B.5.3 的评分/表现增量，避免重复经济。
//
// 奖励只在 Boss + 难度的首次通关参与；同一 battleId 只记录一份正式奖励。

import { bossById } from './bosses';
import { bossRewardFor } from './economy';
import { difficultyBonusAmounts } from './chapterFlow';
import type { BossBattleRating } from './bossBattleRating';
import { BOSS_BATTLE_RATING_VERSION } from './bossBattleRatingConfig';
import type { BossBattleStatsState } from './bossBattleStats';
import {
  BOSS_BATTLE_REWARD_CONFIG,
  SPECIAL_BONUS_LABELS,
  difficultyMultiplierOf,
  gradeMultiplierOf,
  type BossRewardAmounts,
  type BossRewardDifficulty,
} from './bossBattleRewardConfig';

export type BossRewardDataQuality = 'complete' | 'partial' | 'invalid';

export interface BossBattleReward {
  rewardId: string;
  battleId: string;
  bossId: string;
  difficulty: string;
  battleResult: string | null;

  ratingId: string | null;
  ratingGrade: string | null;
  ratingScore: number | null;
  ratingVersion: string | null;

  rewardVersion: string;
  baseReward: BossRewardAmounts;
  difficultyBonus: BossRewardAmounts;
  performanceBonus: BossRewardAmounts;
  specialBonus: BossRewardAmounts;
  finalReward: BossRewardAmounts;
  legacyOffset: BossRewardAmounts;
  grantedReward: BossRewardAmounts;

  rewardBreakdown: Record<string, unknown>;
  dataQuality: BossRewardDataQuality;
  ratingUnavailable: boolean;
  eligible: boolean;
  rejectionReason: string | null;

  granted: boolean;
  grantedAt: number | null;
  createdAt: number;
}

export interface BossBattleRewardStore {
  history: BossBattleReward[];
  grantedBattleIds: string[];
  totalGranted: BossRewardAmounts;
}

export interface BossBattleRewardInput {
  stats: BossBattleStatsState | null | undefined;
  rating?: BossBattleRating | null;
  bossId?: string;
  difficulty?: string;
  battleResult?: string | null;
  firstDifficultyReward?: boolean;
  legacyGranted?: BossRewardAmounts;
  now?: number;
}

const int = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
const amount = (xp = 0, contribution = 0, fragments = 0): BossRewardAmounts => ({
  xp: int(xp), contribution: int(contribution), fragments: int(fragments),
});
const zero = (): BossRewardAmounts => amount(0, 0, 0);
const add = (a: BossRewardAmounts, b: BossRewardAmounts): BossRewardAmounts => amount(a.xp + b.xp, a.contribution + b.contribution, a.fragments + b.fragments);
const subFloor = (a: BossRewardAmounts, b: BossRewardAmounts): BossRewardAmounts => amount(a.xp - b.xp, a.contribution - b.contribution, a.fragments - b.fragments);
const clampAmount = (a: BossRewardAmounts, maxXp: number, maxContribution: number): BossRewardAmounts => amount(
  Math.min(maxXp, a.xp), Math.min(maxContribution, a.contribution), a.fragments,
);

function difficultyOf(raw: string): BossRewardDifficulty {
  return raw === 'hard' || raw === 'expert' ? raw : 'easy';
}

/** 现有经济系统中的 Boss 基础奖励（作为 B.5.3 的完整奖励基础） */
export function bossBaseVictoryRewards(bossId: string): BossRewardAmounts {
  const boss = bossById(bossId);
  const fallback = BOSS_BATTLE_REWARD_CONFIG.baseVictoryRewards;
  if (!boss) return { ...fallback };
  const chapter = bossRewardFor(boss.chapter);
  return amount(
    n(boss.rewardExp) || fallback.xp,
    chapter ? n(chapter.credits) : fallback.contribution,
    boss.fragmentId ? 1 : 0,
  );
}

/** 既有首胜/难度奖励偏移：基础 + 当前难度的既有增量 */
export function bossLegacyRewardOffset(bossId: string, difficulty: string): BossRewardAmounts {
  const base = bossBaseVictoryRewards(bossId);
  const diff = difficultyOf(difficulty);
  const bonus = difficultyBonusAmounts(bossId, diff);
  return amount(base.xp + int(bonus.exp), base.contribution + int(bonus.credits), base.fragments);
}

function ratingIsUsable(rating: BossBattleRating | null | undefined, stats: BossBattleStatsState, version: string): boolean {
  if (!rating || typeof rating !== 'object') return false;
  return rating.battleId === stats.battleId
    && rating.battleResult === 'victory'
    && rating.finalized === true
    && rating.dataQuality === 'complete'
    && rating.battleResult === 'victory'
    && rating.ratingVersion === version
    && rating.ratingId === 'rating:' + stats.battleId + ':' + version;
}

function rejection(
  stats: BossBattleStatsState | null | undefined,
  bossId: string,
  difficulty: string,
  result: string | null,
  now: number,
  reason: string,
  quality: BossRewardDataQuality,
): BossBattleReward {
  const battleId = stats && typeof stats.battleId === 'string' ? stats.battleId : '';
  return {
    rewardId: 'boss-reward:' + (battleId || 'invalid') + ':' + BOSS_BATTLE_REWARD_CONFIG.version,
    battleId, bossId, difficulty, battleResult: result,
    ratingId: null, ratingGrade: null, ratingScore: null, ratingVersion: null,
    rewardVersion: BOSS_BATTLE_REWARD_CONFIG.version,
    baseReward: zero(), difficultyBonus: zero(), performanceBonus: zero(), specialBonus: zero(),
    finalReward: zero(), legacyOffset: zero(), grantedReward: zero(),
    rewardBreakdown: { rejectionReason: reason },
    dataQuality: quality, ratingUnavailable: true, eligible: false, rejectionReason: reason,
    granted: false, grantedAt: null, createdAt: now,
  };
}

/** 计算完整奖励（纯函数，不修改输入） */
export function calculateBossBattleRewards(input: BossBattleRewardInput): BossBattleReward {
  const now = Math.max(0, Math.floor(Number.isFinite(input.now) ? (input.now as number) : Date.now()));
  const stats = input.stats;
  if (!stats || typeof stats !== 'object' || typeof stats.battleId !== 'string' || !stats.battleId || typeof stats.bossId !== 'string' || !stats.bossId) {
    return rejection(stats, input.bossId || '', input.difficulty || 'easy', input.battleResult ?? null, now, 'missing-stats', 'invalid');
  }
  const bossId = input.bossId || stats.bossId;
  if (input.bossId && input.bossId !== stats.bossId) {
    return rejection(stats, bossId, input.difficulty || stats.difficulty, input.battleResult ?? stats.result, now, 'boss-mismatch', 'invalid');
  }
  const result = input.battleResult === undefined ? stats.result : input.battleResult;
  if (result !== stats.result) {
    return rejection(stats, bossId, input.difficulty || stats.difficulty, result, now, 'result-mismatch', 'invalid');
  }
  if (result !== 'victory') {
    return rejection(stats, bossId, input.difficulty || stats.difficulty, result, now, 'not-victory', 'invalid');
  }
  if (stats.finalized !== true) {
    return rejection(stats, bossId, input.difficulty || stats.difficulty, result, now, 'not-finalized', 'invalid');
  }
  if (stats.dataQuality === 'invalid') {
    return rejection(stats, bossId, input.difficulty || stats.difficulty, result, now, 'invalid-stats', 'invalid');
  }
  if (input.firstDifficultyReward === false) {
    return rejection(stats, bossId, input.difficulty || stats.difficulty, result, now, 'difficulty-already-rewarded', 'partial');
  }

  const difficulty = difficultyOf(input.difficulty || stats.difficulty);
  const base = bossBaseVictoryRewards(bossId);
  const diffMult = difficultyMultiplierOf(difficulty);
  const difficultyAdjusted = amount(
    Math.floor(base.xp * diffMult.xp),
    Math.floor(base.contribution * diffMult.contribution),
    base.fragments,
  );

  const ratingOk = ratingIsUsable(input.rating, stats, BOSS_BATTLE_RATING_VERSION);
  const grade = ratingOk && input.rating ? input.rating.grade : null;
  const gradeMult = ratingOk ? gradeMultiplierOf(grade) : 1;
  const performanceAdjusted = ratingOk
    ? amount(
      Math.floor(difficultyAdjusted.xp * gradeMult),
      Math.floor(difficultyAdjusted.contribution * gradeMult),
      base.fragments,
    )
    : difficultyAdjusted;

  const specialParts: { key: keyof typeof SPECIAL_BONUS_LABELS; label: string; condition: boolean; amounts: BossRewardAmounts }[] = [];
  const c = stats.challengeStats;
  const w = stats.weaknessStats;
  const e = stats.dynamicEventStats;
  specialParts.push({
    key: 'noDeath', label: SPECIAL_BONUS_LABELS.noDeath, condition: int(stats.playerDeathCount) === 0,
    amounts: BOSS_BATTLE_REWARD_CONFIG.specialBonuses.noDeath,
  });
  specialParts.push({
    key: 'challengeStreak', label: SPECIAL_BONUS_LABELS.challengeStreak,
    condition: int(c.judgedCount) >= 3 && int(c.passedCount) === int(c.judgedCount) && int(c.maxConsecutiveSuccess) >= 3 && int(c.invalidCount) === 0,
    amounts: BOSS_BATTLE_REWARD_CONFIG.specialBonuses.challengeStreak,
  });
  specialParts.push({
    key: 'weakness', label: SPECIAL_BONUS_LABELS.weakness,
    condition: int(w.crackSuccessCount) > 0 && int(w.bossHpDamage) > 0,
    amounts: BOSS_BATTLE_REWARD_CONFIG.specialBonuses.weakness,
  });
  specialParts.push({
    key: 'crisis', label: SPECIAL_BONUS_LABELS.crisis,
    condition: int(e.triggeredCount) > 0 && int(e.successCount) > 0 && int(e.failedCount) === 0 && int(e.timeoutCount) === 0,
    amounts: BOSS_BATTLE_REWARD_CONFIG.specialBonuses.crisis,
  });
  let special = zero();
  for (const part of specialParts) {
    if (part.condition) special = add(special, part.amounts);
  }
  special = clampAmount(special, BOSS_BATTLE_REWARD_CONFIG.caps.specialXp, BOSS_BATTLE_REWARD_CONFIG.caps.specialContribution);

  const finalReward = add(performanceAdjusted, special);
  const difficultyBonus = subFloor(difficultyAdjusted, base);
  const performanceBonus = subFloor(performanceAdjusted, difficultyAdjusted);
  const legacyOffset = input.legacyGranted
    ? amount(input.legacyGranted.xp, input.legacyGranted.contribution, input.legacyGranted.fragments)
    : bossLegacyRewardOffset(bossId, difficulty);
  const rawAdditional = subFloor(finalReward, legacyOffset);
  const grantedReward = amount(
    Math.min(BOSS_BATTLE_REWARD_CONFIG.caps.additionalXp, rawAdditional.xp),
    Math.min(BOSS_BATTLE_REWARD_CONFIG.caps.additionalContribution, rawAdditional.contribution),
    rawAdditional.fragments,
  );

  const dataQuality: BossRewardDataQuality =
    stats.dataQuality === 'partial' || !ratingOk ? 'partial' : 'complete';
  const breakdown = {
    formula: 'floor(base × difficulty) → floor(previous × grade) + special − legacyOffset',
    baseSource: 'existing-boss-economy',
    difficulty,
    difficultyMultiplier: { xp: diffMult.xp, contribution: diffMult.contribution, fragments: diffMult.fragments },
    grade,
    gradeMultiplier: gradeMult,
    baseReward: base,
    difficultyAdjusted,
    performanceAdjusted,
    difficultyBonus,
    performanceBonus,
    specialBonus: special,
    specialParts: specialParts.map(p => ({ key: p.key, label: p.label, condition: p.condition, amounts: p.amounts })),
    legacyOffset,
    rawAdditional,
    caps: BOSS_BATTLE_REWARD_CONFIG.caps,
    rounding: 'Math.floor（所有资源统一）',
    fragmentsNote: '创世主碎片为唯一首胜物品，既有首通已发放；B.5.3 不重复增加碎片。',
    ratingUnavailable: !ratingOk,
  };

  return {
    rewardId: 'boss-reward:' + stats.battleId + ':' + BOSS_BATTLE_REWARD_CONFIG.version,
    battleId: stats.battleId,
    bossId,
    difficulty,
    battleResult: result,
    ratingId: ratingOk && input.rating ? input.rating.ratingId : null,
    ratingGrade: ratingOk ? grade : null,
    ratingScore: ratingOk && input.rating ? input.rating.displayScore : null,
    ratingVersion: ratingOk && input.rating ? input.rating.ratingVersion : null,
    rewardVersion: BOSS_BATTLE_REWARD_CONFIG.version,
    baseReward: base,
    difficultyBonus,
    performanceBonus,
    specialBonus: special,
    finalReward,
    legacyOffset,
    grantedReward,
    rewardBreakdown: breakdown,
    dataQuality,
    ratingUnavailable: !ratingOk,
    eligible: true,
    rejectionReason: null,
    granted: false,
    grantedAt: null,
    createdAt: now,
  };
}

// ---------- 奖励记录 / 存档 ----------

function normalizeAmounts(raw: unknown): BossRewardAmounts {
  const r = raw && typeof raw === 'object' ? raw as Partial<BossRewardAmounts> : {};
  return amount(int(r.xp), int(r.contribution), int(r.fragments));
}

export function normalizeBossBattleReward(raw: unknown): BossBattleReward | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BossBattleReward>;
  if (typeof r.rewardId !== 'string' || !r.rewardId) return null;
  if (typeof r.battleId !== 'string' || !r.battleId) return null;
  if (typeof r.bossId !== 'string' || !r.bossId) return null;
  if (r.battleResult !== 'victory' || r.eligible !== true || r.granted !== true) return null;
  const version = typeof r.rewardVersion === 'string' && r.rewardVersion ? r.rewardVersion : BOSS_BATTLE_REWARD_CONFIG.version;
  const quality: BossRewardDataQuality = r.dataQuality === 'complete' || r.dataQuality === 'partial' ? r.dataQuality : 'invalid';
  if (quality === 'invalid') return null;
  const baseReward = normalizeAmounts(r.baseReward);
  const difficultyBonus = normalizeAmounts(r.difficultyBonus);
  const performanceBonus = normalizeAmounts(r.performanceBonus);
  const specialBonus = normalizeAmounts(r.specialBonus);
  const finalReward = normalizeAmounts(r.finalReward);
  const legacyOffset = normalizeAmounts(r.legacyOffset);
  const grantedReward = normalizeAmounts(r.grantedReward);
  return {
    rewardId: r.rewardId,
    battleId: r.battleId,
    bossId: r.bossId,
    difficulty: typeof r.difficulty === 'string' ? r.difficulty : 'easy',
    battleResult: 'victory',
    ratingId: typeof r.ratingId === 'string' ? r.ratingId : null,
    ratingGrade: typeof r.ratingGrade === 'string' ? r.ratingGrade : null,
    ratingScore: typeof r.ratingScore === 'number' && Number.isFinite(r.ratingScore) ? Math.max(0, Math.min(100, Math.floor(r.ratingScore))) : null,
    ratingVersion: typeof r.ratingVersion === 'string' ? r.ratingVersion : null,
    rewardVersion: version,
    baseReward, difficultyBonus, performanceBonus, specialBonus, finalReward, legacyOffset, grantedReward,
    rewardBreakdown: r.rewardBreakdown && typeof r.rewardBreakdown === 'object' ? r.rewardBreakdown as Record<string, unknown> : {},
    dataQuality: quality,
    ratingUnavailable: r.ratingUnavailable !== false,
    eligible: true,
    rejectionReason: null,
    granted: true,
    grantedAt: typeof r.grantedAt === 'number' && Number.isFinite(r.grantedAt) ? Math.max(0, Math.floor(r.grantedAt)) : null,
    createdAt: typeof r.createdAt === 'number' && Number.isFinite(r.createdAt) ? Math.max(0, Math.floor(r.createdAt)) : 0,
  };
}

export function recordBossBattleReward(
  store: BossBattleRewardStore,
  reward: BossBattleReward,
): { store: BossBattleRewardStore; added: boolean; reason?: string } {
  if (reward.granted !== true) return { store, added: false, reason: 'not-granted' };
  const normalized = normalizeBossBattleReward({ ...reward, granted: true, grantedAt: reward.grantedAt ?? reward.createdAt });
  if (!normalized) return { store, added: false, reason: 'invalid' };
  const history = Array.isArray(store.history) ? store.history : [];
  const grantedIds = Array.isArray(store.grantedBattleIds) ? store.grantedBattleIds : [];
  if (grantedIds.includes(normalized.battleId) || history.some(r => r.battleId === normalized.battleId || r.rewardId === normalized.rewardId)) {
    return { store, added: false, reason: 'duplicate' };
  }
  const total = store.totalGranted && typeof store.totalGranted === 'object' ? normalizeAmounts(store.totalGranted) : normalizeAmounts({
    xp: history.reduce((s, r) => s + r.grantedReward.xp, 0),
    contribution: history.reduce((s, r) => s + r.grantedReward.contribution, 0),
    fragments: history.reduce((s, r) => s + r.grantedReward.fragments, 0),
  });
  const next: BossBattleRewardStore = {
    history: [...history, normalized].sort((a, b) => a.createdAt - b.createdAt).slice(-BOSS_BATTLE_REWARD_CONFIG.maxHistory),
    grantedBattleIds: [...new Set([...grantedIds, normalized.battleId])].slice(-BOSS_BATTLE_REWARD_CONFIG.maxGrantedIds),
    totalGranted: add(total, normalized.grantedReward),
  };
  return { store: next, added: true };
}

export function normalizeBossBattleRewardStore(raw: unknown): BossBattleRewardStore {
  const src = raw && typeof raw === 'object' ? raw as Partial<BossBattleRewardStore> : {};
  const seenBattle = new Set<string>();
  const seenReward = new Set<string>();
  const history: BossBattleReward[] = [];
  if (Array.isArray(src.history)) {
    for (const item of [...src.history].sort((a, b) => (n(a?.createdAt) - n(b?.createdAt)))) {
      const reward = normalizeBossBattleReward(item);
      if (!reward || seenBattle.has(reward.battleId) || seenReward.has(reward.rewardId)) continue;
      seenBattle.add(reward.battleId);
      seenReward.add(reward.rewardId);
      history.push(reward);
    }
  }
  const trimmed = history.slice(-BOSS_BATTLE_REWARD_CONFIG.maxHistory);
  const idsFromHistory = trimmed.map(r => r.battleId);
  const storedIds = Array.isArray(src.grantedBattleIds)
    ? src.grantedBattleIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  const grantedBattleIds = [...new Set([...storedIds, ...idsFromHistory])].slice(-BOSS_BATTLE_REWARD_CONFIG.maxGrantedIds);
  // 累计值独立保存，不能因历史裁剪而减少
  const totalGranted = src.totalGranted && typeof src.totalGranted === 'object'
    ? normalizeAmounts(src.totalGranted)
    : normalizeAmounts({
      xp: trimmed.reduce((s, r) => s + r.grantedReward.xp, 0),
      contribution: trimmed.reduce((s, r) => s + r.grantedReward.contribution, 0),
      fragments: trimmed.reduce((s, r) => s + r.grantedReward.fragments, 0),
    });
  return { history: trimmed, grantedBattleIds, totalGranted };
}

export function findBossBattleReward(store: BossBattleRewardStore | undefined | null, battleId: string): BossBattleReward | null {
  if (!store || !Array.isArray(store.history)) return null;
  return store.history.find(r => r.battleId === battleId) || null;
}

export function latestBossBattleRewardForBoss(store: BossBattleRewardStore | undefined | null, bossId: string): BossBattleReward | null {
  if (!store || !Array.isArray(store.history)) return null;
  const list = store.history.filter(r => r.bossId === bossId);
  return list[list.length - 1] || null;
}
