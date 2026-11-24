// Boss 战斗评价引擎（V1.3-B.5.2）
//
// 纯函数观察者：只读取 B.5.1 最终统计快照，不重新采集/计算战斗事件，
// 不修改战斗状态、统计数据、奖励或 UI。
//
// 评分口径：
// - 五维分数上限即配置权重（25/30/20/15/10）。
// - mechanicUnavailable 维度不计入权重（机制不存在不惩罚）。
// - dataMissing 维度同样不参与总分，但会降低数据完整性并禁止正式评分。
// - 总分 = 各可用维度得分之和 × 100 / 可用权重和，四舍五入后判定等级。

import { weaknessDefinitionsFor } from './bossWeaknessCatalog';
import type { BossDifficulty } from './difficulty';
import type { BossBattleStatsState } from './bossBattleStats';
import {
  BOSS_BATTLE_RATING_VERSION,
  BOSS_BATTLE_RATING_WEIGHTS,
  CHALLENGE_RATING_CONFIG,
  CRISIS_RATING_CONFIG,
  MAX_BOSS_BATTLE_RATINGS,
  SURVIVAL_RATING_CONFIG,
  TACTICS_RATING_CONFIG,
  WEAKNESS_RATING_CONFIG,
  displayScoreFor,
  gradeForDisplayScore,
  type BossRatingAvailability,
  type BossRatingDimensionKey,
  type BossRatingGrade,
} from './bossBattleRatingConfig';

export type BossRatingDataQuality = 'complete' | 'partial' | 'invalid';

export interface BossRatingComponent {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  available: boolean;
  detail: string;
}

export interface BossRatingDimensionScore {
  key: BossRatingDimensionKey;
  label: string;
  score: number;
  maxScore: number;
  available: boolean;
  availability: BossRatingAvailability;
  partial: boolean;
  weight: number;
  effectiveWeight: number;
  components: BossRatingComponent[];
}

export interface BossBattleRating {
  battleId: string;
  bossId: string;
  battleResult: string | null;
  ratingId: string;
  ratingVersion: string;
  ratedAt: number;
  totalScore: number;
  displayScore: number;
  grade: BossRatingGrade;
  dimensionScores: Record<BossRatingDimensionKey, BossRatingDimensionScore>;
  dimensionWeights: Record<BossRatingDimensionKey, number>;
  dimensionEffectiveWeights: Record<BossRatingDimensionKey, number>;
  dimensionAvailability: Record<BossRatingDimensionKey, BossRatingAvailability>;
  dataQuality: BossRatingDataQuality;
  scoreBreakdown: Record<string, unknown>;
  performanceHighlights: string[];
  performanceWeaknesses: string[];
  ratingReasons: string[];
  sourceStatsHash: string;
  finalized: boolean;
}

export interface BossBattleRatingStore {
  history: BossBattleRating[];
}

const DIMENSIONS: BossRatingDimensionKey[] = ['survival', 'challenge', 'tactics', 'weakness', 'crisis'];
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
const round2 = (v: number): number => Math.round(clamp(v, 0, 1000000) * 100) / 100;
const round1 = (v: number): number => Math.round(v * 10) / 10;

function pct(rate: number | null): string {
  return rate == null ? '—' : round1(rate * 100) + '%';
}

function difficultyOfStats(raw: string): BossDifficulty {
  return raw === 'hard' || raw === 'expert' ? raw : 'easy';
}

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

/** 仅对参与评分的真实统计字段做稳定摘要，用于识别快照变化 */
export function hashBossBattleStats(stats: BossBattleStatsState): string {
  const c = stats.challengeStats;
  const a = stats.attackStats;
  const d = stats.defenseStats;
  const w = stats.weaknessStats;
  const e = stats.dynamicEventStats;
  const payload = {
    battleId: stats.battleId,
    bossId: stats.bossId,
    difficulty: stats.difficulty,
    result: stats.result,
    startedAt: stats.startedAt,
    endedAt: stats.endedAt,
    deaths: stats.playerDeathCount,
    challenges: [c.submittedCount, c.judgedCount, c.passedCount, c.failedCount, c.runtimeErrorCount, c.invalidCount, c.maxConsecutiveSuccess, c.keyCrackSuccess],
    attacks: [a.telegraphCount, a.startedCount, a.hitCount, a.blockedCount, a.cancelledCount, a.interruptedByWeaknessCount, a.interruptedByCrisisCount, a.damageTaken, a.shieldAbsorbed],
    defense: [d.defenseSuccessCount, d.defenseFailedCount, d.dodgeSuccessCount, d.dodgeFailedCount],
    weakness: [w.clueCount, w.discoveredCount, w.analysisCount, w.crackSubmittedCount, w.crackSuccessCount, w.crackFailedCount, w.exposedCount, w.exposureMsTotal, w.bossHpDamage, w.cancelledCount],
    dynamic: [e.triggeredCount, e.successCount, e.failedCount, e.playerCompletedCount, e.timeoutCount, e.cancelledByPriorityCount, e.clearedByBattleEndCount, e.attackInterruptedCount, e.playerDamageTaken, e.durationMsTotal],
  };
  return fnv1a(JSON.stringify(payload));
}

function emptyDimension(key: BossRatingDimensionKey, availability: BossRatingAvailability): BossRatingDimensionScore {
  return {
    key,
    label: key === 'survival' ? '生存表现' : key === 'challenge' ? '代码挑战' : key === 'tactics' ? '战术操作' : key === 'weakness' ? '弱点破解' : '危机处理',
    score: 0,
    maxScore: BOSS_BATTLE_RATING_WEIGHTS[key],
    available: false,
    availability,
    partial: false,
    weight: BOSS_BATTLE_RATING_WEIGHTS[key],
    effectiveWeight: 0,
    components: [],
  };
}

function dimensionMap(
  factory: (key: BossRatingDimensionKey) => BossRatingDimensionScore,
): Record<BossRatingDimensionKey, BossRatingDimensionScore> {
  return {
    survival: factory('survival'),
    challenge: factory('challenge'),
    tactics: factory('tactics'),
    weakness: factory('weakness'),
    crisis: factory('crisis'),
  };
}

function invalidRating(stats: unknown, now: number, reason: string): BossBattleRating {
  const s = (stats && typeof stats === 'object' ? stats : {}) as Partial<BossBattleStatsState>;
  const battleId = typeof s.battleId === 'string' ? s.battleId : '';
  const bossId = typeof s.bossId === 'string' ? s.bossId : '';
  const dims = dimensionMap(k => emptyDimension(k, 'invalid'));
  return {
    battleId,
    bossId,
    battleResult: null,
    ratingId: 'rating:' + (battleId || 'invalid') + ':' + BOSS_BATTLE_RATING_VERSION,
    ratingVersion: BOSS_BATTLE_RATING_VERSION,
    ratedAt: Math.max(0, Math.floor(now)),
    totalScore: 0,
    displayScore: 0,
    grade: 'D',
    dimensionScores: dims,
    dimensionWeights: { ...BOSS_BATTLE_RATING_WEIGHTS },
    dimensionEffectiveWeights: { survival: 0, challenge: 0, tactics: 0, weakness: 0, crisis: 0 },
    dimensionAvailability: { survival: 'invalid', challenge: 'invalid', tactics: 'invalid', weakness: 'invalid', crisis: 'invalid' },
    dataQuality: 'invalid',
    scoreBreakdown: { invalid: true, reason },
    performanceHighlights: [],
    performanceWeaknesses: [],
    ratingReasons: [reason],
    sourceStatsHash: '',
    finalized: false,
  };
}

function survivalDimension(stats: BossBattleStatsState, highlights: string[], weaknesses: string[], reasons: string[]): BossRatingDimensionScore {
  const a = stats.attackStats;
  const hit = n(a.hitCount);
  const blocked = n(a.blockedCount);
  const dodged = n(stats.defenseStats.dodgeSuccessCount);
  const outcomes = hit + blocked + dodged;
  const deaths = n(stats.playerDeathCount);
  const damageTaken = n(a.damageTaken);
  const hasEvidence = outcomes > 0 || damageTaken > 0 || deaths > 0 || n(a.startedCount) > 0;
  if (!hasEvidence) {
    const dim = emptyDimension('survival', 'mechanicUnavailable');
    reasons.push('本场没有可用的 Boss 攻击结果数据，生存维度不参与评分。');
    return dim;
  }

  const components: BossRatingComponent[] = [];
  let damageScore = 0;
  let partial = false;
  if (outcomes > 0) {
    const hitRatio = clamp(hit / outcomes, 0, 1);
    damageScore = round2(SURVIVAL_RATING_CONFIG.damageAvoidanceMax * (1 - hitRatio));
    components.push({
      key: 'damage-avoidance', label: '攻击规避', score: damageScore,
      maxScore: SURVIVAL_RATING_CONFIG.damageAvoidanceMax, available: true,
      detail: `命中 ${hit} / 可判定 ${outcomes} 次`,
    });
    if (hitRatio <= 0.25) highlights.push('成功规避了大部分 Boss 攻击。');
    if (hitRatio >= 0.6) weaknesses.push('多数可判定攻击直接命中，生存压力较大。');
  } else {
    partial = true;
    components.push({
      key: 'damage-avoidance', label: '攻击规避', score: 0,
      maxScore: SURVIVAL_RATING_CONFIG.damageAvoidanceMax, available: false,
      detail: '没有可判定的攻击结果',
    });
    reasons.push('缺少可判定的攻击命中数据，攻击规避子项未参与评分。');
  }

  const deathScore = round2(Math.max(0, SURVIVAL_RATING_CONFIG.deathMax - deaths * SURVIVAL_RATING_CONFIG.deathPenaltyPerDeath));
  components.push({
    key: 'death-penalty', label: '死亡惩罚', score: deathScore,
    maxScore: SURVIVAL_RATING_CONFIG.deathMax, available: true,
    detail: deaths > 0 ? `本场死亡 ${deaths} 次` : '本场未发生死亡',
  });
  if (deaths === 0) highlights.push('本场未发生死亡。');
  else weaknesses.push(`本场发生 ${deaths} 次死亡，生存表现受到影响。`);
  if (damageTaken === 0) highlights.push('本场未受到实际伤害。');
  if (n(a.shieldAbsorbed) > 0) highlights.push(`护罩吸收 ${round2(a.shieldAbsorbed)} 点伤害。`);
  reasons.push(`实际受到 ${round2(damageTaken)} 点伤害；命中 ${hit} / 可判定 ${outcomes} 次攻击。`);

  return {
    ...emptyDimension('survival', 'available'),
    score: round2(damageScore + deathScore),
    available: true,
    partial,
    components,
  };
}

function challengeDimension(stats: BossBattleStatsState, highlights: string[], weaknesses: string[], reasons: string[]): BossRatingDimensionScore {
  const c = stats.challengeStats;
  const judged = n(c.judgedCount);
  if (judged === 0) {
    reasons.push('本场没有有效判题数据，代码挑战维度不参与评分。');
    return emptyDimension('challenge', 'dataMissing');
  }
  const passed = Math.min(n(c.passedCount), judged);
  const rate = clamp(passed / judged, 0, 1);
  const passScore = round2(CHALLENGE_RATING_CONFIG.passRateMax * rate);
  const streakRatio = clamp(n(c.maxConsecutiveSuccess) / judged, 0, 1);
  const streakScore = round2(CHALLENGE_RATING_CONFIG.streakMax * streakRatio);
  const keyScore = c.keyCrackSuccess === true ? CHALLENGE_RATING_CONFIG.keyCrackMax : 0;
  const components: BossRatingComponent[] = [
    { key: 'pass-rate', label: '判题成功率', score: passScore, maxScore: CHALLENGE_RATING_CONFIG.passRateMax, available: true, detail: `通过 ${passed} / 判题 ${judged}` },
    { key: 'streak', label: '连续成功', score: streakScore, maxScore: CHALLENGE_RATING_CONFIG.streakMax, available: true, detail: `最长连续 ${n(c.maxConsecutiveSuccess)} 次` },
    { key: 'key-crack', label: '关键破解', score: keyScore, maxScore: CHALLENGE_RATING_CONFIG.keyCrackMax, available: c.keyCrackSuccess === true, detail: c.keyCrackSuccess === true ? '关键破解成功' : '未记录关键破解（不扣分）' },
  ];
  if (rate === 1) highlights.push('代码挑战全部通过。');
  else if (rate >= 0.9) highlights.push(`代码挑战成功率达到 ${pct(rate)}。`);
  if (rate < 0.6) weaknesses.push(`代码挑战成功率仅为 ${pct(rate)}。`);
  if (n(c.failedCount) > 0) weaknesses.push(`判题失败 ${n(c.failedCount)} 次。`);
  if (n(c.runtimeErrorCount) > 0) weaknesses.push(`代码运行异常 ${n(c.runtimeErrorCount)} 次。`);
  if (n(c.maxConsecutiveSuccess) >= 3) highlights.push(`连续通过 ${n(c.maxConsecutiveSuccess)} 次挑战。`);
  if (c.keyCrackSuccess === true) highlights.push('完成 Boss 关键破解挑战。');
  reasons.push(`代码挑战通过 ${passed} / ${judged}，成功率 ${pct(rate)}。`);
  if (n(c.runtimeErrorCount) > 0) reasons.push(`运行异常 ${n(c.runtimeErrorCount)} 次计入失败，但不额外重复扣分。`);

  return {
    ...emptyDimension('challenge', 'available'),
    score: round2(passScore + streakScore + keyScore),
    available: true,
    components,
  };
}

function tacticsDimension(stats: BossBattleStatsState, highlights: string[], weaknesses: string[], reasons: string[]): BossRatingDimensionScore {
  const d = stats.defenseStats;
  const defSuccess = n(d.defenseSuccessCount);
  const defFailed = n(d.defenseFailedCount);
  const dodgeSuccess = n(d.dodgeSuccessCount);
  const dodgeFailed = n(d.dodgeFailedCount);
  const defAttempts = defSuccess + defFailed;
  const dodgeAttempts = dodgeSuccess + dodgeFailed;
  const attacksStarted = n(stats.attackStats.startedCount);
  if (defAttempts === 0 && dodgeAttempts === 0 && attacksStarted === 0) {
    reasons.push('本场没有 Boss 攻击与操作记录，战术维度不参与评分。');
    return emptyDimension('tactics', 'mechanicUnavailable');
  }

  const defRate = defAttempts > 0 ? defSuccess / defAttempts : null;
  const dodgeRate = dodgeAttempts > 0 ? dodgeSuccess / dodgeAttempts : null;
  const defScore = round2((defRate == null ? 0 : defRate) * TACTICS_RATING_CONFIG.defenseMax);
  const dodgeScore = round2((dodgeRate == null ? 0 : dodgeRate) * TACTICS_RATING_CONFIG.dodgeMax);
  const components: BossRatingComponent[] = [
    { key: 'defense', label: '防御成功率', score: defScore, maxScore: TACTICS_RATING_CONFIG.defenseMax, available: defAttempts > 0, detail: defAttempts > 0 ? `成功 ${defSuccess} / 尝试 ${defAttempts}` : '无有效防御尝试' },
    { key: 'dodge', label: '闪避成功率', score: dodgeScore, maxScore: TACTICS_RATING_CONFIG.dodgeMax, available: dodgeAttempts > 0, detail: dodgeAttempts > 0 ? `成功 ${dodgeSuccess} / 尝试 ${dodgeAttempts}` : '无有效闪避尝试' },
  ];
  const partial = (defAttempts === 0 || dodgeAttempts === 0);
  if (defAttempts === 0 && dodgeAttempts === 0) {
    weaknesses.push('本场未进行防御或闪避操作。');
  }
  if (defAttempts > 0) {
    if (defRate === 1) highlights.push(`防御全部成功（${defSuccess} 次）。`);
    else if (defRate != null && defRate >= 0.7) highlights.push(`防御成功率达到 ${pct(defRate)}。`);
    if (defRate != null && defRate < 0.5) weaknesses.push(`防御成功率偏低（${pct(defRate)}）。`);
    reasons.push(`防御成功 ${defSuccess} / ${defAttempts}，成功率 ${pct(defRate)}。`);
  }
  if (dodgeAttempts > 0) {
    if (dodgeRate === 1) highlights.push(`闪避全部成功（${dodgeSuccess} 次）。`);
    else if (dodgeRate != null && dodgeRate >= 0.7) highlights.push(`闪避成功率达到 ${pct(dodgeRate)}。`);
    if (dodgeRate != null && dodgeRate < 0.5) weaknesses.push(`闪避成功率偏低（${pct(dodgeRate)}）。`);
    reasons.push(`闪避成功 ${dodgeSuccess} / ${dodgeAttempts}，成功率 ${pct(dodgeRate)}。`);
  }
  if (defAttempts === 0 || dodgeAttempts === 0) {
    reasons.push('战术操作存在未出现的子项，该子项不计分并降低评分可信度。');
  }
  if (n(stats.attackStats.cancelledCount) > 0 || n(stats.attackStats.interruptedByWeaknessCount) > 0 || n(stats.attackStats.interruptedByCrisisCount) > 0) {
    reasons.push('被取消或中断的攻击未计入玩家防御/闪避成功。');
  }

  return {
    ...emptyDimension('tactics', 'available'),
    score: round2(defScore + dodgeScore),
    available: true,
    partial,
    components,
  };
}

function weaknessDimension(stats: BossBattleStatsState, highlights: string[], weaknesses: string[], reasons: string[]): BossRatingDimensionScore {
  let definitions = 0;
  try {
    definitions = weaknessDefinitionsFor(stats.bossId, difficultyOfStats(stats.difficulty)).length;
  } catch {
    definitions = 0;
  }
  if (definitions === 0) {
    reasons.push('该 Boss 没有弱点机制，弱点维度不参与评分。');
    return emptyDimension('weakness', 'mechanicUnavailable');
  }
  const w = stats.weaknessStats;
  const discovered = n(w.discoveredCount);
  const crackSuccess = n(w.crackSuccessCount);
  const crackFailed = n(w.crackFailedCount);
  const crackAttempts = crackSuccess + crackFailed;
  const submitted = n(w.crackSubmittedCount);
  const exposure = n(w.exposedCount);
  const bossDamage = n(w.bossHpDamage);
  const discoveryScore = round2(WEAKNESS_RATING_CONFIG.discoveryMax * clamp(discovered / definitions, 0, 1));
  const crackRate = crackAttempts > 0 ? crackSuccess / crackAttempts : null;
  const crackScore = round2((crackRate || 0) * WEAKNESS_RATING_CONFIG.crackMax);
  const utilizationScore = exposure > 0 ? (bossDamage > 0 ? WEAKNESS_RATING_CONFIG.utilizationMax : round2(WEAKNESS_RATING_CONFIG.utilizationMax / 2)) : 0;
  const partial = submitted > crackAttempts;
  const components: BossRatingComponent[] = [
    { key: 'discovery', label: '弱点发现', score: discoveryScore, maxScore: WEAKNESS_RATING_CONFIG.discoveryMax, available: true, detail: `发现 ${discovered} / Boss 弱点 ${definitions}` },
    { key: 'crack', label: '破解成功率', score: crackScore, maxScore: WEAKNESS_RATING_CONFIG.crackMax, available: crackAttempts > 0, detail: crackAttempts > 0 ? `成功 ${crackSuccess} / 尝试 ${crackAttempts}` : '无有效破解尝试' },
    { key: 'utilization', label: '弱点利用', score: utilizationScore, maxScore: WEAKNESS_RATING_CONFIG.utilizationMax, available: exposure > 0, detail: exposure > 0 ? `暴露 ${exposure} 次，额外伤害 ${round2(bossDamage)}` : '本场未利用弱点暴露' },
  ];
  if (discovered > 0) highlights.push(`发现 ${discovered} 个 Boss 弱点。`);
  if (crackSuccess > 0) highlights.push(`成功破解 ${crackSuccess} 个弱点。`);
  if (bossDamage > 0) highlights.push(`弱点机制造成 ${round2(bossDamage)} 点额外 Boss 伤害。`);
  if (crackFailed > 0) weaknesses.push(`弱点破解失败 ${crackFailed} 次。`);
  if (discovered === 0) weaknesses.push('本场未发现任何弱点。');
  if (exposure === 0) weaknesses.push('本场未成功利用弱点暴露。');
  reasons.push(`发现 ${discovered} / ${definitions} 个弱点，破解成功 ${crackSuccess} / 有效尝试 ${crackAttempts}。`);
  if (n(w.cancelledCount) > 0) reasons.push(`弱点取消 ${n(w.cancelledCount)} 次；系统/高优先级取消不计为玩家破解失败。`);
  if (partial) reasons.push('存在尚未结算的破解提交，弱点维度仅作临时评估。');

  return {
    ...emptyDimension('weakness', 'available'),
    score: round2(discoveryScore + crackScore + utilizationScore),
    available: true,
    partial,
    components,
  };
}

function crisisDimension(stats: BossBattleStatsState, highlights: string[], weaknesses: string[], reasons: string[]): BossRatingDimensionScore {
  const e = stats.dynamicEventStats;
  const triggered = n(e.triggeredCount);
  const success = Math.min(n(e.successCount), triggered);
  const failed = n(e.failedCount);
  const timeout = n(e.timeoutCount);
  const eligible = success + failed + timeout;
  if (triggered === 0) {
    reasons.push('本场未触发动态事件，危机维度不参与评分。');
    return emptyDimension('crisis', 'mechanicUnavailable');
  }
  if (eligible === 0) {
    if (n(e.cancelledByPriorityCount) + n(e.clearedByBattleEndCount) > 0) {
      reasons.push('本场动态事件均由系统取消或终结清理，不计为玩家失败，危机维度不参与评分。');
      return emptyDimension('crisis', 'mechanicUnavailable');
    }
    reasons.push('动态事件缺少可归属玩家的处理结果，危机维度不参与评分。');
    return emptyDimension('crisis', 'dataMissing');
  }
  const rate = clamp(success / eligible, 0, 1);
  const score = round2(CRISIS_RATING_CONFIG.successRateMax * rate);
  const components: BossRatingComponent[] = [
    { key: 'success-rate', label: '危机成功率', score, maxScore: CRISIS_RATING_CONFIG.successRateMax, available: true, detail: `成功 ${success} / 可处理 ${eligible}` },
  ];
  if (success > 0) highlights.push(`成功处理 ${success} 次动态危机事件。`);
  if (failed > 0) weaknesses.push(`动态事件处理失败 ${failed} 次。`);
  if (timeout > 0) weaknesses.push(`动态事件超时 ${timeout} 次。`);
  reasons.push(`动态事件可处理 ${eligible} 次，成功 ${success} 次，成功率 ${pct(rate)}。`);
  if (n(e.cancelledByPriorityCount) + n(e.clearedByBattleEndCount) > 0) {
    reasons.push('被优先级抢占或战斗终结清理的事件未计入玩家失败。');
  }

  return {
    ...emptyDimension('crisis', 'available'),
    score,
    available: true,
    components,
  };
}

/**
 * 计算 Boss 战斗评价（纯函数，不修改输入）。
 * 同一统计快照（同一 sourceStatsHash）得到相同维度分/总分/等级。
 */
export function calculateBossBattleRating(stats: BossBattleStatsState, now: number = Date.now()): BossBattleRating {
  if (!stats || typeof stats !== 'object' || typeof stats.battleId !== 'string' || !stats.battleId || typeof stats.bossId !== 'string' || !stats.bossId) {
    return invalidRating(stats, now, '统计数据缺少 battleId/bossId，无法生成评分。');
  }
  if (stats.dataQuality === 'invalid') {
    return invalidRating(stats, now, '统计数据完整性为 invalid，禁止生成正式评分。');
  }

  const highlights: string[] = [];
  const weaknesses: string[] = [];
  const reasons: string[] = [];
  const dims = dimensionMap(k => emptyDimension(k, 'dataMissing'));
  dims.survival = survivalDimension(stats, highlights, weaknesses, reasons);
  dims.challenge = challengeDimension(stats, highlights, weaknesses, reasons);
  dims.tactics = tacticsDimension(stats, highlights, weaknesses, reasons);
  dims.weakness = weaknessDimension(stats, highlights, weaknesses, reasons);
  dims.crisis = crisisDimension(stats, highlights, weaknesses, reasons);

  const availableWeight = DIMENSIONS.reduce((sum, k) => sum + (dims[k].availability === 'available' ? dims[k].weight : 0), 0);
  if (availableWeight <= 0) {
    return invalidRating(stats, now, '没有可评分的数据维度，禁止生成正式评分。');
  }
  let total = 0;
  for (const k of DIMENSIONS) {
    const dim = dims[k];
    dim.effectiveWeight = dim.availability === 'available' ? dim.weight / availableWeight : 0;
    if (dim.availability === 'available') total += dim.score;
  }
  total = round2(clamp(total * 100 / availableWeight, 0, 100));

  const displayScore = displayScoreFor(total);
  const grade = gradeForDisplayScore(displayScore);

  const hasMissing = DIMENSIONS.some(k => dims[k].availability === 'dataMissing');
  const hasPartialSub = DIMENSIONS.some(k => dims[k].partial);
  const dataQuality: BossRatingDataQuality =
    stats.dataQuality === 'partial' || !stats.finalized || hasMissing || hasPartialSub ? 'partial' : 'complete';

  if (dataQuality === 'partial') {
    reasons.push('评分数据不完整或为临时状态，本次结果不作为最终正式评价。');
  }
  if (stats.result && stats.result !== 'victory') {
    reasons.push('该场战斗结果不是胜利，不生成正式战斗评价。');
  }
  reasons.push(`评分版本 ${BOSS_BATTLE_RATING_VERSION}；可用权重 ${availableWeight} / 100。`);
  reasons.push(`综合得分 ${total}，评级 ${grade}。`);

  const finalized = stats.finalized === true && stats.result === 'victory' && dataQuality === 'complete';
  const dimensionScores = dims;
  const dimensionAvailability = Object.fromEntries(DIMENSIONS.map(k => [k, dims[k].availability])) as Record<BossRatingDimensionKey, BossRatingAvailability>;
  const dimensionEffectiveWeights = Object.fromEntries(DIMENSIONS.map(k => [k, round2(dims[k].effectiveWeight * 100) / 100])) as Record<BossRatingDimensionKey, number>;
  const scoreBreakdown: Record<string, unknown> = {
    availableWeight,
    rawTotal: total,
    displayScore,
    gradeOrder: ['S', 'A', 'B', 'C', 'D'],
    dataQuality,
    dimensions: Object.fromEntries(DIMENSIONS.map(k => [k, {
      availability: dims[k].availability,
      partial: dims[k].partial,
      score: dims[k].score,
      maxScore: dims[k].maxScore,
      weight: dims[k].weight,
      effectiveWeightPercent: round2(dims[k].effectiveWeight * 100),
      components: dims[k].components,
    }])),
  };

  const trim = (arr: string[]) => [...new Set(arr)].slice(0, 10);
  return {
    battleId: stats.battleId,
    bossId: stats.bossId,
    battleResult: stats.result,
    ratingId: 'rating:' + stats.battleId + ':' + BOSS_BATTLE_RATING_VERSION,
    ratingVersion: BOSS_BATTLE_RATING_VERSION,
    ratedAt: Math.max(0, Math.floor(Number.isFinite(now) ? now : Date.now())),
    totalScore: total,
    displayScore,
    grade,
    dimensionScores,
    dimensionWeights: { ...BOSS_BATTLE_RATING_WEIGHTS },
    dimensionEffectiveWeights,
    dimensionAvailability,
    dataQuality,
    scoreBreakdown,
    performanceHighlights: trim(highlights),
    performanceWeaknesses: trim(weaknesses),
    ratingReasons: trim(reasons),
    sourceStatsHash: hashBossBattleStats(stats),
    finalized,
  };
}

// ---------- 评分持久化 ----------

function ratingGradeFromScore(score: number): BossRatingGrade {
  return gradeForDisplayScore(displayScoreFor(score));
}

/** 自愈单条评分（异常字段安全归零/丢弃） */
export function normalizeBossBattleRating(raw: unknown): BossBattleRating | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BossBattleRating>;
  if (typeof r.battleId !== 'string' || !r.battleId) return null;
  if (typeof r.bossId !== 'string' || !r.bossId) return null;
  if (typeof r.ratingVersion !== 'string' || !r.ratingVersion) return null;
  const total = round2(clamp(n(r.totalScore), 0, 100));
  const displayScore = displayScoreFor(total);
  const quality: BossRatingDataQuality = r.dataQuality === 'complete' || r.dataQuality === 'partial' ? r.dataQuality : 'invalid';
  if (quality === 'invalid') return null;
  const dims = dimensionMap(k => {
    const rawDim = r.dimensionScores && typeof r.dimensionScores === 'object'
      ? (r.dimensionScores as Record<string, unknown>)[k]
      : null;
    const d = rawDim && typeof rawDim === 'object' ? rawDim as Partial<BossRatingDimensionScore> : {};
    return {
      ...emptyDimension(k, 'dataMissing'),
      score: round2(clamp(n(d.score), 0, BOSS_BATTLE_RATING_WEIGHTS[k])),
      maxScore: BOSS_BATTLE_RATING_WEIGHTS[k],
      available: d.available === true,
      availability: d.availability === 'available' || d.availability === 'mechanicUnavailable' || d.availability === 'dataMissing' || d.availability === 'invalid'
        ? d.availability : 'dataMissing',
      partial: d.partial === true,
      effectiveWeight: clamp(n(d.effectiveWeight), 0, 1),
      components: Array.isArray(d.components) ? d.components.filter(x => !!x && typeof x === 'object').slice(0, 8).map(x => ({
        key: typeof x.key === 'string' ? x.key : '',
        label: typeof x.label === 'string' ? x.label : '',
        score: round2(clamp(n(x.score), 0, n(x.maxScore))),
        maxScore: n(x.maxScore),
        available: x.available === true,
        detail: typeof x.detail === 'string' ? x.detail : '',
      })) : [],
    };
  });
  return {
    battleId: r.battleId,
    bossId: r.bossId,
    battleResult: r.battleResult === 'victory' || r.battleResult === 'defeat' || r.battleResult === 'retreat' || r.battleResult === 'interrupted' ? r.battleResult : null,
    ratingId: typeof r.ratingId === 'string' && r.ratingId ? r.ratingId : 'rating:' + r.battleId + ':' + r.ratingVersion,
    ratingVersion: r.ratingVersion,
    ratedAt: Math.max(0, Math.floor(n(r.ratedAt))),
    totalScore: total,
    displayScore,
    grade: ratingGradeFromScore(total),
    dimensionScores: dims,
    dimensionWeights: { ...BOSS_BATTLE_RATING_WEIGHTS },
    dimensionEffectiveWeights: Object.fromEntries(DIMENSIONS.map(k => [k, clamp(n(r.dimensionEffectiveWeights && (r.dimensionEffectiveWeights as Record<string, unknown>)[k]), 0, 1)])) as Record<BossRatingDimensionKey, number>,
    dimensionAvailability: Object.fromEntries(DIMENSIONS.map(k => [k, dims[k].availability])) as Record<BossRatingDimensionKey, BossRatingAvailability>,
    dataQuality: quality,
    scoreBreakdown: r.scoreBreakdown && typeof r.scoreBreakdown === 'object' ? r.scoreBreakdown as Record<string, unknown> : {},
    performanceHighlights: Array.isArray(r.performanceHighlights) ? r.performanceHighlights.filter(x => typeof x === 'string').slice(0, 10) : [],
    performanceWeaknesses: Array.isArray(r.performanceWeaknesses) ? r.performanceWeaknesses.filter(x => typeof x === 'string').slice(0, 10) : [],
    ratingReasons: Array.isArray(r.ratingReasons) ? r.ratingReasons.filter(x => typeof x === 'string').slice(0, 10) : [],
    sourceStatsHash: typeof r.sourceStatsHash === 'string' ? r.sourceStatsHash : '',
    finalized: r.finalized === true && quality === 'complete',
  };
}

/** 写入评分：ratingId 幂等；同一战斗保留一份正式评分，不让新算法覆盖历史正式结果 */
export function recordBossBattleRating(
  store: BossBattleRatingStore,
  rating: BossBattleRating,
): { store: BossBattleRatingStore; added: boolean; reason?: string } {
  const normalized = normalizeBossBattleRating(rating);
  if (!normalized) return { store, added: false, reason: 'invalid' };
  if (normalized.dataQuality === 'invalid') return { store, added: false, reason: 'invalid' };
  if (normalized.battleResult !== 'victory') return { store, added: false, reason: 'not-victory' };
  const history = Array.isArray(store.history) ? store.history : [];
  const sameId = history.find(r => r.ratingId === normalized.ratingId);
  if (sameId) {
    if (sameId.finalized || !normalized.finalized) return { store, added: false, reason: 'duplicate' };
    const next = history.map(r => r.ratingId === normalized.ratingId ? normalized : r);
    return { store: { history: next.slice(-MAX_BOSS_BATTLE_RATINGS) }, added: true, reason: 'replaced-partial' };
  }
  const formalSameBattle = history.find(r => r.battleId === normalized.battleId && r.finalized);
  if (normalized.finalized && formalSameBattle) return { store, added: false, reason: 'battle-already-rated' };
  return {
    store: { history: [...history, normalized].sort((a, b) => a.ratedAt - b.ratedAt).slice(-MAX_BOSS_BATTLE_RATINGS) },
    added: true,
  };
}

export function findBossBattleRating(store: BossBattleRatingStore | undefined | null, battleId: string): BossBattleRating | null {
  if (!store || !Array.isArray(store.history)) return null;
  const list = store.history.filter(r => r.battleId === battleId);
  const formal = list.filter(r => r.finalized);
  return formal[formal.length - 1] || list[list.length - 1] || null;
}

export function latestBossBattleRatingForBoss(store: BossBattleRatingStore | undefined | null, bossId: string): BossBattleRating | null {
  if (!store || !Array.isArray(store.history)) return null;
  const list = store.history.filter(r => r.bossId === bossId);
  const formal = list.filter(r => r.finalized);
  return formal[formal.length - 1] || list[list.length - 1] || null;
}

/** 评分存储自愈：丢弃非法项、ratingId 去重、只保留一份正式评分、最多 50 条 */
export function normalizeBossBattleRatingStore(raw: unknown): BossBattleRatingStore {
  const src = raw && typeof raw === 'object' ? raw as Partial<BossBattleRatingStore> : {};
  const list = Array.isArray(src.history)
    ? src.history.map(normalizeBossBattleRating).filter((x): x is BossBattleRating => !!x && x.battleResult === 'victory')
    : [];
  const seenIds = new Set<string>();
  const formalBattles = new Set<string>();
  const history: BossBattleRating[] = [];
  for (const rating of list.sort((a, b) => a.ratedAt - b.ratedAt)) {
    if (seenIds.has(rating.ratingId)) continue;
    if (rating.finalized && formalBattles.has(rating.battleId)) continue;
    seenIds.add(rating.ratingId);
    if (rating.finalized) formalBattles.add(rating.battleId);
    history.push(rating);
  }
  return { history: history.slice(-MAX_BOSS_BATTLE_RATINGS) };
}
