// Boss 战斗历史归档与玩家战绩（V1.3-B.5.6）
//
// 正式终结后归档 B.5.1~B.5.5 的只读快照；不重新评分、不发奖励、不解锁成就。
// 记录上限 200，battleId 幂等表 500，累计统计独立保存、不因历史裁剪下降。

import { bossById } from './bosses';
import { difficultyMeta, type BossDifficulty } from './difficulty';
import { BOSS_ACHIEVEMENT_MAP, BOSS_ACHIEVEMENT_DEFINITIONS, type BossAchievementDefinition } from './bossAchievementConfig';
import { buildBossSettlementData, type BossSettlementData, type SettlementAchievement, type SettlementDimension, type SettlementMetric, type SettlementPhaseRow, type SettlementTimelineEvent } from './bossSettlement';
import type { PlayerState } from './types';

export const BOSS_ARCHIVE_VERSION = 'v1.0.0';
export const MAX_ARCHIVE_RECORDS = 200;
export const MAX_ARCHIVED_BATTLE_IDS = 500;
/** 撤退是否重置当前连胜：按项目设计固定为重置（避免用撤退保留连胜） */
export const RETREAT_RESETS_WIN_STREAK = true;

export type ArchiveResult = 'victory' | 'defeat' | 'retreat';
export type ArchiveQuality = 'complete' | 'partial' | 'invalid';

export interface ArchiveChallengeStats {
  submitted: number; judged: number; passed: number; failed: number; invalid: number; streak: number;
}
export interface ArchiveCombatStats {
  warning: number; hit: number; blocked: number; dodged: number; cancelled: number; interrupted: number; damageTaken: number; damageDealt: number | null;
}
export interface ArchiveWeaknessStats {
  discovered: number; uniqueDiscovered: number | null; cracked: number; exposed: number; damage: number;
}
export interface ArchiveDynamicStats {
  triggered: number; success: number; failed: number; successRate: number | null;
}
export interface ArchivePhaseStats {
  transitions: number; completed: number; maxPhase: number | null; minConsciousness: number | null;
}
export interface ArchiveStatsSnapshot {
  challenge: ArchiveChallengeStats;
  combat: ArchiveCombatStats;
  weakness: ArchiveWeaknessStats;
  dynamic: ArchiveDynamicStats;
  phases: ArchivePhaseStats;
  deaths: number | null;
  phaseRows: SettlementPhaseRow[];
}
export interface ArchiveRatingSnapshot {
  grade: string | null;
  displayScore: number | null;
  totalScore: number | null;
  finalized: boolean;
  dataQuality: string;
  ratingVersion: string | null;
  dimensions: SettlementDimension[];
  reasons: string[];
  highlights: string[];
  weaknesses: string[];
}
export interface ArchiveRewardSnapshot {
  available: boolean;
  granted: boolean;
  xp: number | null;
  contribution: number | null;
  credits: number | null;
  fragments: number | null;
  baseXp: number | null;
  difficultyXp: number | null;
  performanceXp: number | null;
  specialXp: number | null;
  fullXp: number | null;
  legacyXp: number | null;
  rewardId: string | null;
  grantedAt: number | null;
  fragmentTitle: string | null;
  fragmentStatus: string;
}
export interface ArchiveAchievementSnapshot {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  level: string;
  hidden: boolean;
  icon: string;
  reward: { xp: number; contribution: number; fragments: number };
  unlockedAt: number;
  evidence: string;
}
export interface ArchiveTimelineEvent {
  offsetMs: number;
  label: string;
  kind: string;
}
export interface BossArchiveRecord {
  battleId: string;
  bossId: string;
  bossName: string;
  bossCodename: string;
  difficulty: string;
  difficultyLabel: string;
  result: ArchiveResult;
  startedAt: number | null;
  endedAt: number | null;
  archivedAt: number;
  durationMs: number | null;
  finalPhase: number | null;
  phaseTotal: number | null;
  consciousness: number | null;
  deaths: number | null;
  failureReason: string;
  fragmentTitle: string | null;
  fragmentStatus: string;
  fragmentGranted: boolean;
  firstClear: boolean;
  dataQuality: ArchiveQuality;
  stats: ArchiveStatsSnapshot;
  rating: ArchiveRatingSnapshot | null;
  reward: ArchiveRewardSnapshot;
  achievements: ArchiveAchievementSnapshot[];
  strengths: string[];
  improvements: string[];
  timeline: ArchiveTimelineEvent[];
  archiveVersion: string;
}

export interface ArchiveTotals {
  totalBattles: number;
  victories: number;
  defeats: number;
  retreats: number;
  totalDuration: number;
  totalXP: number;
  totalContribution: number;
  totalCredits: number;
  totalFragments: number;
  ratingCount: number;
  ratingScoreSum: number;
  gradeCounts: Record<'S' | 'A' | 'B' | 'C' | 'D', number>;
  bestScore: number | null;
  bestGrade: string | null;
  fastestVictory: number | null;
  longestBattle: number | null;
  currentWinStreak: number;
  bestWinStreak: number;
  updatedAt: number | null;
}
export interface ArchiveBossTotals {
  attempts: number;
  victories: number;
  defeats: number;
  retreats: number;
  totalDuration: number;
  ratingCount: number;
  ratingScoreSum: number;
  bestScore: number | null;
  bestGrade: string | null;
  fastestVictory: number | null;
  longestBattle: number | null;
  firstVictoryAt: number | null;
  firstVictoryDifficulty: string | null;
  lastBattleAt: number | null;
}
export interface ArchiveDifficultyTotals {
  attempts: number;
  victories: number;
  defeats: number;
  retreats: number;
  totalDuration: number;
  ratingCount: number;
  ratingScoreSum: number;
  bestScore: number | null;
}
export interface BossBattleArchiveStore {
  version: 1;
  records: BossArchiveRecord[];
  archivedBattleIds: string[];
  totals: ArchiveTotals;
  bossTotals: Record<string, ArchiveBossTotals>;
  difficultyTotals: Record<string, ArchiveDifficultyTotals>;
  updatedAt: number | null;
}

const int = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : null);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const resultOf = (v: unknown): ArchiveResult => (v === 'victory' || v === 'defeat' || v === 'retreat' ? v : 'retreat');
const qualityOf = (v: unknown): ArchiveQuality => (v === 'complete' || v === 'partial' || v === 'invalid' ? v : 'invalid');
const gradeOrder: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

export function emptyArchiveTotals(): ArchiveTotals {
  return {
    totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0,
    totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0,
    ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 },
    bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null,
    currentWinStreak: 0, bestWinStreak: 0, updatedAt: null,
  };
}
const emptyBossTotals = (): ArchiveBossTotals => ({
  attempts: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0,
  ratingCount: 0, ratingScoreSum: 0, bestScore: null, bestGrade: null,
  fastestVictory: null, longestBattle: null, firstVictoryAt: null, firstVictoryDifficulty: null, lastBattleAt: null,
});
const emptyDifficultyTotals = (): ArchiveDifficultyTotals => ({
  attempts: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0,
  ratingCount: 0, ratingScoreSum: 0, bestScore: null,
});

export function emptyBossBattleArchiveStore(): BossBattleArchiveStore {
  return {
    version: 1, records: [], archivedBattleIds: [], totals: emptyArchiveTotals(),
    bossTotals: {}, difficultyTotals: {}, updatedAt: null,
  };
}

function metricValue(data: BossSettlementData, group: keyof BossSettlementData['metrics'], key: string): number | null {
  return data.metrics[group].find(m => m.key === key)?.value ?? null;
}

/** 从 B.5.5 结算投影生成 compact 归档记录 */
export function buildBossArchiveRecord(
  player: PlayerState,
  battleId: string,
  context: { firstClear?: boolean; fragmentGranted?: boolean; now?: number } = {},
): BossArchiveRecord | null {
  const data = buildBossSettlementData(player, battleId, { fragmentGranted: context.fragmentGranted, now: context.now });
  if (!data) return null;
  const archivedAt = Math.max(0, Math.floor(context.now ?? Date.now()));
  const rating = data.rating && data.rating.available ? {
    grade: data.rating.grade,
    displayScore: data.rating.displayScore,
    totalScore: data.rating.totalScore,
    finalized: data.rating.finalized,
    dataQuality: data.rating.dataQuality,
    ratingVersion: data.rating.ratingVersion,
    dimensions: data.rating.dimensions.map(d => ({ ...d })),
    reasons: [...data.rating.reasons],
    highlights: [...data.rating.highlights],
    weaknesses: [...data.rating.weaknesses],
  } : null;
  const reward = {
    available: data.reward.available,
    granted: data.reward.granted,
    xp: data.reward.xp,
    contribution: data.reward.contribution,
    credits: data.reward.credits,
    fragments: data.reward.fragments,
    baseXp: data.reward.baseXp,
    difficultyXp: data.reward.difficultyXp,
    performanceXp: data.reward.performanceXp,
    specialXp: data.reward.specialXp,
    fullXp: data.reward.fullXp,
    legacyXp: data.reward.legacyXp,
    rewardId: data.reward.rewardId,
    grantedAt: data.reward.grantedAt,
    fragmentTitle: data.reward.fragmentTitle,
    fragmentStatus: data.reward.fragmentStatus,
  };
  return {
    battleId: data.battleId,
    bossId: data.bossId,
    bossName: data.bossName,
    bossCodename: data.bossCodename,
    difficulty: data.difficulty,
    difficultyLabel: data.difficultyLabel,
    result: data.outcome,
    startedAt: data.completedAt != null && data.durationMs != null ? Math.max(0, data.completedAt - data.durationMs) : null,
    endedAt: data.completedAt,
    archivedAt,
    durationMs: data.durationMs,
    finalPhase: data.finalPhase,
    phaseTotal: data.phaseTotal,
    consciousness: data.consciousness,
    deaths: data.deaths,
    failureReason: data.failureReason,
    fragmentTitle: data.fragmentTitle,
    fragmentStatus: data.fragmentStatus,
    fragmentGranted: context.fragmentGranted === true,
    firstClear: context.firstClear === true,
    dataQuality: data.dataQuality,
    stats: {
      challenge: {
        submitted: metricValue(data, 'challenge', 'submitted') ?? 0,
        judged: metricValue(data, 'challenge', 'judged') ?? 0,
        passed: metricValue(data, 'challenge', 'passed') ?? 0,
        failed: metricValue(data, 'challenge', 'failed') ?? 0,
        invalid: metricValue(data, 'challenge', 'invalid') ?? 0,
        streak: metricValue(data, 'challenge', 'streak') ?? 0,
      },
      combat: {
        warning: metricValue(data, 'combat', 'warning') ?? 0,
        hit: metricValue(data, 'combat', 'hit') ?? 0,
        blocked: metricValue(data, 'combat', 'blocked') ?? 0,
        dodged: metricValue(data, 'combat', 'dodged') ?? 0,
        cancelled: metricValue(data, 'combat', 'cancelled') ?? 0,
        interrupted: metricValue(data, 'combat', 'interrupted') ?? 0,
        damageTaken: metricValue(data, 'combat', 'damageTaken') ?? 0,
        damageDealt: metricValue(data, 'combat', 'damageDealt'),
      },
      weakness: {
        discovered: metricValue(data, 'weakness', 'discovered') ?? 0,
        uniqueDiscovered: metricValue(data, 'weakness', 'uniqueDiscovered'),
        cracked: metricValue(data, 'weakness', 'cracked') ?? 0,
        exposed: metricValue(data, 'weakness', 'exposed') ?? 0,
        damage: metricValue(data, 'weakness', 'damage') ?? 0,
      },
      dynamic: {
        triggered: metricValue(data, 'dynamic', 'triggered') ?? 0,
        success: metricValue(data, 'dynamic', 'success') ?? 0,
        failed: metricValue(data, 'dynamic', 'failed') ?? 0,
        successRate: metricValue(data, 'dynamic', 'successRate'),
      },
      phases: {
        transitions: metricValue(data, 'progress', 'phases') ?? 0,
        completed: metricValue(data, 'progress', 'completed') ?? 0,
        maxPhase: metricValue(data, 'progress', 'maxPhase'),
        minConsciousness: metricValue(data, 'progress', 'minConsciousness'),
      },
      deaths: data.deaths,
      phaseRows: data.phaseRows.map(p => ({ ...p })),
    },
    rating,
    reward,
    achievements: data.achievements.map(a => ({ ...a })),
    strengths: [...data.strengths],
    improvements: [...data.improvements],
    timeline: data.timeline.map(e => ({ ...e })),
    archiveVersion: BOSS_ARCHIVE_VERSION,
  };
}

function bestGradeOf(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return (gradeOrder[a] || 0) >= (gradeOrder[b] || 0) ? a : b;
}

function applyRatingToTotals(t: ArchiveTotals, record: BossArchiveRecord): void {
  const r = record.rating;
  if (!r || !r.finalized || r.dataQuality !== 'complete' || r.displayScore == null || !r.grade) return;
  t.ratingCount += 1;
  t.ratingScoreSum += r.displayScore;
  if (r.grade === 'S' || r.grade === 'A' || r.grade === 'B' || r.grade === 'C' || r.grade === 'D') t.gradeCounts[r.grade] += 1;
  if (t.bestScore == null || r.displayScore > t.bestScore) t.bestScore = r.displayScore;
  t.bestGrade = bestGradeOf(t.bestGrade, r.grade);
}

function applyRecordToTotals(t: ArchiveTotals, record: BossArchiveRecord): ArchiveTotals {
  const next = {
    ...t,
    gradeCounts: { ...t.gradeCounts },
  };
  next.totalBattles += 1;
  if (record.result === 'victory') next.victories += 1;
  else if (record.result === 'defeat') next.defeats += 1;
  else next.retreats += 1;
  if (record.durationMs != null) next.totalDuration += record.durationMs;
  if (record.reward.available && record.reward.granted) {
    next.totalXP += int(record.reward.xp);
    next.totalContribution += int(record.reward.contribution);
    next.totalCredits += int(record.reward.credits);
    next.totalFragments += int(record.reward.fragments) + (record.fragmentGranted ? 1 : 0);
  }
  applyRatingToTotals(next, record);
  if (record.result === 'victory' && record.durationMs != null) {
    next.fastestVictory = next.fastestVictory == null ? record.durationMs : Math.min(next.fastestVictory, record.durationMs);
  }
  if (record.durationMs != null) {
    next.longestBattle = next.longestBattle == null ? record.durationMs : Math.max(next.longestBattle, record.durationMs);
  }
  if (record.result === 'victory') {
    next.currentWinStreak += 1;
    next.bestWinStreak = Math.max(next.bestWinStreak, next.currentWinStreak);
  } else {
    next.currentWinStreak = 0;
  }
  next.updatedAt = record.archivedAt;
  return next;
}

function applyRecordToBossTotals(t: ArchiveBossTotals, record: BossArchiveRecord): ArchiveBossTotals {
  const next = { ...t };
  next.attempts += 1;
  if (record.result === 'victory') next.victories += 1;
  else if (record.result === 'defeat') next.defeats += 1;
  else next.retreats += 1;
  if (record.durationMs != null) {
    next.totalDuration += record.durationMs;
    next.longestBattle = next.longestBattle == null ? record.durationMs : Math.max(next.longestBattle, record.durationMs);
    if (record.result === 'victory') next.fastestVictory = next.fastestVictory == null ? record.durationMs : Math.min(next.fastestVictory, record.durationMs);
  }
  const r = record.rating;
  if (r && r.finalized && r.dataQuality === 'complete' && r.displayScore != null && r.grade) {
    next.ratingCount += 1;
    next.ratingScoreSum += r.displayScore;
    if (next.bestScore == null || r.displayScore > next.bestScore) next.bestScore = r.displayScore;
    next.bestGrade = bestGradeOf(next.bestGrade, r.grade);
  }
  if (record.result === 'victory' && next.firstVictoryAt == null) {
    next.firstVictoryAt = record.endedAt ?? record.archivedAt;
    next.firstVictoryDifficulty = record.difficulty;
  }
  next.lastBattleAt = record.endedAt ?? record.archivedAt;
  return next;
}

function applyRecordToDifficultyTotals(t: ArchiveDifficultyTotals, record: BossArchiveRecord): ArchiveDifficultyTotals {
  const next = { ...t };
  next.attempts += 1;
  if (record.result === 'victory') next.victories += 1;
  else if (record.result === 'defeat') next.defeats += 1;
  else next.retreats += 1;
  if (record.durationMs != null) next.totalDuration += record.durationMs;
  const r = record.rating;
  if (r && r.finalized && r.dataQuality === 'complete' && r.displayScore != null && r.grade) {
    next.ratingCount += 1;
    next.ratingScoreSum += r.displayScore;
    if (next.bestScore == null || r.displayScore > next.bestScore) next.bestScore = r.displayScore;
  }
  return next;
}

export function normalizeArchiveRecord(raw: unknown): BossArchiveRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BossArchiveRecord>;
  if (typeof r.battleId !== 'string' || !r.battleId) return null;
  if (typeof r.bossId !== 'string' || !r.bossId) return null;
  const result = resultOf(r.result);
  const startedAt = numOrNull(r.startedAt);
  const endedAt = numOrNull(r.endedAt);
  const duration = numOrNull(r.durationMs) ?? (startedAt != null && endedAt != null ? Math.max(0, endedAt - startedAt) : null);
  const s = r.stats && typeof r.stats === 'object' ? r.stats as Partial<ArchiveStatsSnapshot> : {};
  const ch = s.challenge || {} as Partial<ArchiveChallengeStats>;
  const co = s.combat || {} as Partial<ArchiveCombatStats>;
  const we = s.weakness || {} as Partial<ArchiveWeaknessStats>;
  const dy = s.dynamic || {} as Partial<ArchiveDynamicStats>;
  const ph = s.phases || {} as Partial<ArchivePhaseStats>;
  const ratingRaw = r.rating && typeof r.rating === 'object' ? r.rating as Partial<ArchiveRatingSnapshot> : null;
  const rating: ArchiveRatingSnapshot | null = ratingRaw ? {
    grade: typeof ratingRaw.grade === 'string' ? ratingRaw.grade : null,
    displayScore: numOrNull(ratingRaw.displayScore),
    totalScore: numOrNull(ratingRaw.totalScore),
    finalized: ratingRaw.finalized === true,
    dataQuality: str(ratingRaw.dataQuality, 'invalid'),
    ratingVersion: typeof ratingRaw.ratingVersion === 'string' ? ratingRaw.ratingVersion : null,
    dimensions: Array.isArray(ratingRaw.dimensions) ? ratingRaw.dimensions.filter(x => !!x && typeof x === 'object').slice(0, 8) : [],
    reasons: Array.isArray(ratingRaw.reasons) ? ratingRaw.reasons.filter(x => typeof x === 'string').slice(0, 8) : [],
    highlights: Array.isArray(ratingRaw.highlights) ? ratingRaw.highlights.filter(x => typeof x === 'string').slice(0, 6) : [],
    weaknesses: Array.isArray(ratingRaw.weaknesses) ? ratingRaw.weaknesses.filter(x => typeof x === 'string').slice(0, 6) : [],
  } : null;
  const rw = r.reward && typeof r.reward === 'object' ? r.reward as Partial<ArchiveRewardSnapshot> : {};
  const reward: ArchiveRewardSnapshot = {
    available: rw.available === true,
    granted: rw.granted === true,
    xp: numOrNull(rw.xp), contribution: numOrNull(rw.contribution), credits: numOrNull(rw.credits), fragments: numOrNull(rw.fragments),
    baseXp: numOrNull(rw.baseXp), difficultyXp: numOrNull(rw.difficultyXp), performanceXp: numOrNull(rw.performanceXp),
    specialXp: numOrNull(rw.specialXp), fullXp: numOrNull(rw.fullXp), legacyXp: numOrNull(rw.legacyXp),
    rewardId: typeof rw.rewardId === 'string' ? rw.rewardId : null,
    grantedAt: numOrNull(rw.grantedAt),
    fragmentTitle: typeof rw.fragmentTitle === 'string' ? rw.fragmentTitle : null,
    fragmentStatus: str(rw.fragmentStatus, 'N/A'),
  };
  const achievements: ArchiveAchievementSnapshot[] = Array.isArray(r.achievements)
    ? r.achievements.filter(x => !!x && typeof x === 'object' && typeof (x as ArchiveAchievementSnapshot).achievementId === 'string')
      .slice(0, 20)
      .map(x => ({
        achievementId: x.achievementId,
        name: str(x.name, x.achievementId),
        description: str(x.description),
        category: str(x.category),
        level: str(x.level),
        hidden: x.hidden === true,
        icon: str(x.icon),
        reward: x.reward && typeof x.reward === 'object' ? {
          xp: int(x.reward.xp), contribution: int(x.reward.contribution), fragments: int(x.reward.fragments),
        } : { xp: 0, contribution: 0, fragments: 0 },
        unlockedAt: Math.max(0, int(x.unlockedAt)),
        evidence: str(x.evidence),
      }))
    : [];
  return {
    battleId: r.battleId,
    bossId: r.bossId,
    bossName: str(r.bossName, r.bossId),
    bossCodename: str(r.bossCodename, r.bossId.toUpperCase()),
    difficulty: str(r.difficulty, 'easy'),
    difficultyLabel: str(r.difficultyLabel, difficultyMeta((r.difficulty === 'hard' || r.difficulty === 'expert' ? r.difficulty : 'easy') as BossDifficulty).label),
    result, startedAt, endedAt,
    archivedAt: Math.max(0, int(r.archivedAt ?? endedAt ?? startedAt)),
    durationMs: duration,
    finalPhase: numOrNull(r.finalPhase),
    phaseTotal: numOrNull(r.phaseTotal),
    consciousness: numOrNull(r.consciousness),
    deaths: numOrNull(r.deaths ?? s.deaths),
    failureReason: str(r.failureReason),
    fragmentTitle: typeof r.fragmentTitle === 'string' ? r.fragmentTitle : null,
    fragmentStatus: str(r.fragmentStatus, 'N/A'),
    fragmentGranted: r.fragmentGranted === true,
    firstClear: r.firstClear === true,
    dataQuality: qualityOf(r.dataQuality),
    stats: {
      challenge: {
        submitted: int(ch.submitted), judged: int(ch.judged), passed: int(ch.passed), failed: int(ch.failed), invalid: int(ch.invalid), streak: int(ch.streak),
      },
      combat: {
        warning: int(co.warning), hit: int(co.hit), blocked: int(co.blocked), dodged: int(co.dodged), cancelled: int(co.cancelled),
        interrupted: int(co.interrupted), damageTaken: int(co.damageTaken), damageDealt: numOrNull(co.damageDealt),
      },
      weakness: {
        discovered: int(we.discovered), uniqueDiscovered: numOrNull(we.uniqueDiscovered), cracked: int(we.cracked), exposed: int(we.exposed), damage: int(we.damage),
      },
      dynamic: {
        triggered: int(dy.triggered), success: int(dy.success), failed: int(dy.failed), successRate: numOrNull(dy.successRate),
      },
      phases: {
        transitions: int(ph.transitions), completed: int(ph.completed), maxPhase: numOrNull(ph.maxPhase), minConsciousness: numOrNull(ph.minConsciousness),
      },
      deaths: numOrNull(s.deaths),
      phaseRows: Array.isArray(s.phaseRows) ? s.phaseRows.filter(x => !!x && typeof x === 'object').slice(0, 20) as SettlementPhaseRow[] : [],
    },
    rating, reward, achievements,
    strengths: Array.isArray(r.strengths) ? r.strengths.filter(x => typeof x === 'string').slice(0, 3) : [],
    improvements: Array.isArray(r.improvements) ? r.improvements.filter(x => typeof x === 'string').slice(0, 3) : [],
    timeline: Array.isArray(r.timeline) ? r.timeline.filter(x => !!x && typeof x === 'object' && typeof x.label === 'string').slice(0, 40).map(x => ({
      offsetMs: int(x.offsetMs), label: x.label, kind: str(x.kind),
    })) : [],
    archiveVersion: str(r.archiveVersion, BOSS_ARCHIVE_VERSION),
  };
}

export function recordBossBattleArchive(
  store: BossBattleArchiveStore,
  record: BossArchiveRecord,
): { store: BossBattleArchiveStore; added: boolean; reason?: string } {
  const normalized = normalizeArchiveRecord(record);
  if (!normalized) return { store, added: false, reason: 'invalid' };
  if (store.archivedBattleIds.includes(normalized.battleId) || store.records.some(r => r.battleId === normalized.battleId)) {
    return { store, added: false, reason: 'duplicate' };
  }
  const records = [...store.records, normalized].sort((a, b) => (a.endedAt || a.archivedAt) - (b.endedAt || b.archivedAt)).slice(-MAX_ARCHIVE_RECORDS);
  const ids = [...new Set([...store.archivedBattleIds, normalized.battleId])].slice(-MAX_ARCHIVED_BATTLE_IDS);
  const totals = applyRecordToTotals(store.totals || emptyArchiveTotals(), normalized);
  const bossTotals = { ...store.bossTotals };
  bossTotals[normalized.bossId] = applyRecordToBossTotals(bossTotals[normalized.bossId] || emptyBossTotals(), normalized);
  const difficultyTotals = { ...store.difficultyTotals };
  difficultyTotals[normalized.difficulty] = applyRecordToDifficultyTotals(difficultyTotals[normalized.difficulty] || emptyDifficultyTotals(), normalized);
  return { store: { ...store, records, archivedBattleIds: ids, totals, bossTotals, difficultyTotals, updatedAt: normalized.archivedAt }, added: true };
}

export function archiveBossBattleForPlayer(
  player: PlayerState,
  battleId: string,
  context: { firstClear?: boolean; fragmentGranted?: boolean; now?: number } = {},
): PlayerState {
  try {
    const record = buildBossArchiveRecord(player, battleId, context);
    if (!record) return player;
    const current = player.progress.bossBattleArchive || emptyBossBattleArchiveStore();
    const written = recordBossBattleArchive(current, record);
    if (!written.added) return player;
    return { ...player, progress: { ...player.progress, bossBattleArchive: written.store } };
  } catch {
    return player;
  }
}

function normalizeTotals(raw: unknown): ArchiveTotals {
  const base = emptyArchiveTotals();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ArchiveTotals>;
  const grades = (r.gradeCounts && typeof r.gradeCounts === 'object' ? r.gradeCounts : {}) as Partial<Record<'S' | 'A' | 'B' | 'C' | 'D', unknown>>;
  return {
    totalBattles: int(r.totalBattles), victories: int(r.victories), defeats: int(r.defeats), retreats: int(r.retreats),
    totalDuration: int(r.totalDuration), totalXP: int(r.totalXP), totalContribution: int(r.totalContribution),
    totalCredits: int(r.totalCredits), totalFragments: int(r.totalFragments),
    ratingCount: int(r.ratingCount), ratingScoreSum: int(r.ratingScoreSum),
    gradeCounts: { S: int(grades.S), A: int(grades.A), B: int(grades.B), C: int(grades.C), D: int(grades.D) },
    bestScore: numOrNull(r.bestScore), bestGrade: typeof r.bestGrade === 'string' ? r.bestGrade : null,
    fastestVictory: numOrNull(r.fastestVictory), longestBattle: numOrNull(r.longestBattle),
    currentWinStreak: int(r.currentWinStreak), bestWinStreak: int(r.bestWinStreak),
    updatedAt: numOrNull(r.updatedAt),
  };
}

function deriveTotals(records: BossArchiveRecord[]): ArchiveTotals {
  let t = emptyArchiveTotals();
  for (const r of records) t = applyRecordToTotals(t, r);
  return t;
}

export function normalizeBossBattleArchiveStore(raw: unknown): BossBattleArchiveStore {
  const src = raw && typeof raw === 'object' ? raw as Partial<BossBattleArchiveStore> : {};
  const seen = new Set<string>();
  const records: BossArchiveRecord[] = [];
  if (Array.isArray(src.records)) {
    for (const item of src.records) {
      const r = normalizeArchiveRecord(item);
      if (!r || seen.has(r.battleId)) continue;
      seen.add(r.battleId);
      records.push(r);
    }
  }
  records.sort((a, b) => (a.endedAt || a.archivedAt) - (b.endedAt || b.archivedAt));
  const trimmed = records.slice(-MAX_ARCHIVE_RECORDS);
  const storedIds = Array.isArray(src.archivedBattleIds) ? src.archivedBattleIds.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
  const archivedBattleIds = [...new Set([...storedIds, ...trimmed.map(r => r.battleId)])].slice(-MAX_ARCHIVED_BATTLE_IDS);
  const rawTotalBattles = src.totals && typeof src.totals === 'object' ? (src.totals as Partial<ArchiveTotals>).totalBattles : undefined;
  const totalsUsable = typeof rawTotalBattles === 'number' && Number.isFinite(rawTotalBattles) && rawTotalBattles >= trimmed.length;
  const totals = totalsUsable ? normalizeTotals(src.totals) : deriveTotals(trimmed);
  const bossTotals: Record<string, ArchiveBossTotals> = {};
  if (src.bossTotals && typeof src.bossTotals === 'object') {
    for (const [id, t] of Object.entries(src.bossTotals)) {
      if (!t || typeof t !== 'object') continue;
      const x = t as Partial<ArchiveBossTotals>;
      bossTotals[id] = {
        ...emptyBossTotals(),
        attempts: int(x.attempts), victories: int(x.victories), defeats: int(x.defeats), retreats: int(x.retreats),
        totalDuration: int(x.totalDuration), ratingCount: int(x.ratingCount), ratingScoreSum: int(x.ratingScoreSum),
        bestScore: numOrNull(x.bestScore), bestGrade: typeof x.bestGrade === 'string' ? x.bestGrade : null,
        fastestVictory: numOrNull(x.fastestVictory), longestBattle: numOrNull(x.longestBattle),
        firstVictoryAt: numOrNull(x.firstVictoryAt), firstVictoryDifficulty: typeof x.firstVictoryDifficulty === 'string' ? x.firstVictoryDifficulty : null,
        lastBattleAt: numOrNull(x.lastBattleAt),
      };
    }
  }
  if (Object.keys(bossTotals).length === 0) {
    for (const r of trimmed) bossTotals[r.bossId] = applyRecordToBossTotals(bossTotals[r.bossId] || emptyBossTotals(), r);
  }
  const difficultyTotals: Record<string, ArchiveDifficultyTotals> = {};
  if (src.difficultyTotals && typeof src.difficultyTotals === 'object') {
    for (const [id, t] of Object.entries(src.difficultyTotals)) {
      if (!t || typeof t !== 'object') continue;
      const x = t as Partial<ArchiveDifficultyTotals>;
      difficultyTotals[id] = {
        ...emptyDifficultyTotals(),
        attempts: int(x.attempts), victories: int(x.victories), defeats: int(x.defeats), retreats: int(x.retreats),
        totalDuration: int(x.totalDuration), ratingCount: int(x.ratingCount), ratingScoreSum: int(x.ratingScoreSum), bestScore: numOrNull(x.bestScore),
      };
    }
  }
  if (Object.keys(difficultyTotals).length === 0) {
    for (const r of trimmed) difficultyTotals[r.difficulty] = applyRecordToDifficultyTotals(difficultyTotals[r.difficulty] || emptyDifficultyTotals(), r);
  }
  return { version: 1, records: trimmed, archivedBattleIds, totals, bossTotals, difficultyTotals, updatedAt: numOrNull(src.updatedAt) };
}

// ---------- 查询 / 统计 / 详情 ----------

export type ArchiveSort = 'newest' | 'oldest' | 'best' | 'worst' | 'fastest' | 'longest';

export interface ArchiveQuery {
  search?: string;
  bossId?: string;
  difficulty?: string;
  result?: string;
  grade?: string;
  achievement?: string;
  sort?: ArchiveSort;
  page?: number;
  pageSize?: number;
}

export function queryBossBattleArchive(store: BossBattleArchiveStore, query: ArchiveQuery = {}): { records: BossArchiveRecord[]; total: number; page: number; pages: number } {
  const q = query.search ? query.search.trim().toLowerCase() : '';
  let rows = [...store.records];
  if (q) rows = rows.filter(r => r.bossId.toLowerCase().includes(q) || r.bossName.toLowerCase().includes(q) || r.battleId.toLowerCase().includes(q));
  if (query.bossId && query.bossId !== 'all') rows = rows.filter(r => r.bossId === query.bossId);
  if (query.difficulty && query.difficulty !== 'all') rows = rows.filter(r => r.difficulty === query.difficulty);
  if (query.result && query.result !== 'all') rows = rows.filter(r => r.result === query.result);
  if (query.grade && query.grade !== 'all') rows = rows.filter(r => query.grade === 'unrated' ? !r.rating || !r.rating.grade : r.rating?.grade === query.grade);
  if (query.achievement && query.achievement !== 'all') rows = rows.filter(r => query.achievement === 'unlocked' ? r.achievements.length > 0 : r.achievements.length === 0);
  const sort = query.sort || 'newest';
  rows.sort((a, b) => {
    const tie = (b.endedAt || b.archivedAt) - (a.endedAt || a.archivedAt) || a.battleId.localeCompare(b.battleId);
    switch (sort) {
      case 'oldest': return -tie;
      case 'best': return (b.rating?.displayScore ?? -1) - (a.rating?.displayScore ?? -1) || tie;
      case 'worst': return (a.rating?.displayScore ?? 101) - (b.rating?.displayScore ?? 101) || tie;
      case 'fastest': return (a.durationMs ?? Number.MAX_SAFE_INTEGER) - (b.durationMs ?? Number.MAX_SAFE_INTEGER) || tie;
      case 'longest': return (b.durationMs ?? -1) - (a.durationMs ?? -1) || tie;
      default: return tie;
    }
  });
  const pageSize = Math.max(1, Math.min(50, int(query.pageSize) || 12));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(1, Math.min(pages, int(query.page) || 1));
  return { records: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pages };
}

export interface ArchiveAnalytics {
  winRate: number | null;
  averageScore: number | null;
  bestScore: number | null;
  bestGrade: string | null;
  fastestVictory: number | null;
  longestBattle: number | null;
  totalDuration: number;
  currentWinStreak: number;
  bestWinStreak: number;
  gradeCounts: Record<'S' | 'A' | 'B' | 'C' | 'D', number>;
  unratedBattles: number;
  ratingTrend: { battleId: string; endedAt: number | null; score: number; grade: string | null }[];
  recentWinRates: { key: string; label: string; rate: number | null; sample: number }[];
  bosses: { bossId: string; bossName: string; attempts: number; victories: number; wins: number; winRate: number | null; averageScore: number | null; bestScore: number | null }[];
  difficulties: { difficulty: string; label: string; attempts: number; victories: number; winRate: number | null; averageScore: number | null; bestScore: number | null }[];
  achievements: { total: number; unlocked: number; rate: number; recent: { achievementId: string; name: string; level: string; category: string; unlockedAt: number; battleId: string }[] };
}

function winRateOf(records: BossArchiveRecord[]): number | null {
  const eligible = records.filter(r => r.result === 'victory' || r.result === 'defeat');
  if (!eligible.length) return null;
  return eligible.filter(r => r.result === 'victory').length / eligible.length;
}

export function buildArchiveAnalytics(store: BossBattleArchiveStore, player: PlayerState): ArchiveAnalytics {
  const t = store.totals;
  const sorted = [...store.records].sort((a, b) => (a.endedAt || a.archivedAt) - (b.endedAt || b.archivedAt));
  const rated = sorted.filter(r => r.rating && r.rating.finalized && r.rating.dataQuality === 'complete' && r.rating.displayScore != null);
  const recent = [...rated].slice(-20).map(r => ({
    battleId: r.battleId, endedAt: r.endedAt, score: r.rating!.displayScore!, grade: r.rating!.grade,
  }));
  const last = (n: number) => sorted.slice(-n);
  const recentWinRates = [
    { key: 'all', label: '全部', rate: winRateOf(sorted), sample: sorted.length },
    { key: '10', label: '最近 10 场', rate: winRateOf(last(10)), sample: last(10).length },
    { key: '5', label: '最近 5 场', rate: winRateOf(last(5)), sample: last(5).length },
  ];
  const bosses = Object.entries(store.bossTotals).map(([bossId, b]) => ({
    bossId,
    bossName: bossById(bossId)?.codename || bossId.toUpperCase(),
    attempts: b.attempts, victories: b.victories, wins: b.victories,
    winRate: b.victories + b.defeats > 0 ? b.victories / (b.victories + b.defeats) : null,
    averageScore: b.ratingCount > 0 ? b.ratingScoreSum / b.ratingCount : null,
    bestScore: b.bestScore,
  })).sort((a, b) => b.attempts - a.attempts);
  const difficulties = Object.entries(store.difficultyTotals).map(([difficulty, d]) => ({
    difficulty,
    label: difficulty === 'hard' || difficulty === 'expert' ? difficultyMeta(difficulty as BossDifficulty).label : 'EASY',
    attempts: d.attempts, victories: d.victories,
    winRate: d.victories + d.defeats > 0 ? d.victories / (d.victories + d.defeats) : null,
    averageScore: d.ratingCount > 0 ? d.ratingScoreSum / d.ratingCount : null,
    bestScore: d.bestScore,
  })).sort((a, b) => a.attempts - b.attempts);
  const unlocked = player.progress.bossAchievements?.unlocked || [];
  const recentAch = [...unlocked].sort((a, b) => b.unlockedAt - a.unlockedAt).slice(0, 5).map(u => {
    const def = BOSS_ACHIEVEMENT_MAP[u.achievementId];
    return {
      achievementId: u.achievementId,
      name: def?.name || u.achievementId,
      level: def?.level || '',
      category: def?.category || '',
      unlockedAt: u.unlockedAt,
      battleId: u.battleId,
    };
  });
  return {
    winRate: t.victories + t.defeats > 0 ? t.victories / (t.victories + t.defeats) : null,
    averageScore: t.ratingCount > 0 ? t.ratingScoreSum / t.ratingCount : null,
    bestScore: t.bestScore,
    bestGrade: t.bestGrade,
    fastestVictory: t.fastestVictory,
    longestBattle: t.longestBattle,
    totalDuration: t.totalDuration,
    currentWinStreak: t.currentWinStreak,
    bestWinStreak: t.bestWinStreak,
    gradeCounts: { ...t.gradeCounts },
    unratedBattles: Math.max(0, t.totalBattles - t.ratingCount),
    ratingTrend: recent,
    recentWinRates,
    bosses,
    difficulties,
    achievements: {
      total: BOSS_ACHIEVEMENT_DEFINITIONS.length,
      unlocked: unlocked.length,
      rate: unlocked.length / BOSS_ACHIEVEMENT_DEFINITIONS.length,
      recent: recentAch,
    },
  };
}

export interface ArchiveAchievementHistoryItem {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  level: string;
  hidden: boolean;
  icon: string;
  reward: { xp: number; contribution: number; fragments: number };
  unlockedAt: number;
  battleId: string;
  bossId: string;
  difficulty: string;
  evidence: string;
}

export function buildAchievementHistory(
  player: PlayerState,
  filters: { category?: string; level?: string; bossId?: string; sort?: 'newest' | 'oldest' } = {},
): ArchiveAchievementHistoryItem[] {
  const unlocked = player.progress.bossAchievements?.unlocked || [];
  const out: ArchiveAchievementHistoryItem[] = [];
  for (const u of unlocked) {
    const def = BOSS_ACHIEVEMENT_MAP[u.achievementId];
    if (!def) continue;
    out.push({
      achievementId: def.id, name: def.name, description: def.description, category: def.category,
      level: def.level, hidden: def.hidden, icon: def.icon, reward: { ...def.reward, fragments: 0 },
      unlockedAt: u.unlockedAt, battleId: u.battleId, bossId: u.bossId, difficulty: u.difficulty,
      evidence: '真实战斗解锁记录',
    });
  }
  let filtered = out;
  if (filters.category && filters.category !== 'all') filtered = filtered.filter(x => x.category === filters.category);
  if (filters.level && filters.level !== 'all') filtered = filtered.filter(x => x.level === filters.level);
  if (filters.bossId && filters.bossId !== 'all') filtered = filtered.filter(x => x.bossId === filters.bossId);
  filtered.sort((a, b) => filters.sort === 'oldest' ? a.unlockedAt - b.unlockedAt : b.unlockedAt - a.unlockedAt);
  return filtered;
}

/** 将归档记录转回只读结算投影，供历史详情复用 */
export function archiveRecordToSettlementData(record: BossArchiveRecord): BossSettlementData {
  const stats = record.stats;
  const metrics = {
    challenge: [
      metric('submitted', '挑战次数', stats.challenge.submitted),
      metric('judged', '有效判题', stats.challenge.judged),
      metric('passed', '成功次数', stats.challenge.passed),
      metric('failed', '失败次数', stats.challenge.failed),
      metric('invalid', '无效提交', stats.challenge.invalid),
      metric('streak', '最长连续成功', stats.challenge.streak),
      metric('deaths', '死亡次数', record.deaths?? record.stats.deaths ?? 0),
    ],
    combat: [
      metric('warning', '攻击预警', stats.combat.warning), metric('hit', '被攻击命中', stats.combat.hit),
      metric('blocked', '成功防御', stats.combat.blocked), metric('dodged', '成功闪避', stats.combat.dodged),
      metric('cancelled', '攻击取消', stats.combat.cancelled), metric('interrupted', '攻击打断', stats.combat.interrupted),
      metric('damageTaken', '承受伤害', stats.combat.damageTaken), metric('damageDealt', '造成伤害', stats.combat.damageDealt),
    ],
    weakness: [
      metric('discovered', '已发现弱点', stats.weakness.discovered), metric('uniqueDiscovered', '不同弱点数量', stats.weakness.uniqueDiscovered),
      metric('cracked', '已破解弱点', stats.weakness.cracked), metric('exposed', '弱点利用次数', stats.weakness.exposed),
      metric('damage', '弱点造成伤害', stats.weakness.damage),
    ],
    dynamic: [
      metric('triggered', '事件触发', stats.dynamic.triggered), metric('success', '成功处理', stats.dynamic.success),
      metric('failed', '失败次数', stats.dynamic.failed), metric('successRate', '处理成功率', stats.dynamic.successRate, '%'),
    ],
    progress: [
      metric('phases', '阶段转换', stats.phases.transitions), metric('completed', '完成阶段', stats.phases.completed),
      metric('maxPhase', '最高阶段', stats.phases.maxPhase), metric('minConsciousness', '最低意识', stats.phases.minConsciousness),
    ],
  };
  const r = record.rating;
  const rating = r ? {
    available: true, finalized: r.finalized, grade: r.grade, displayScore: r.displayScore, totalScore: r.totalScore,
    dataQuality: r.dataQuality, ratingVersion: r.ratingVersion, reasons: r.reasons, highlights: r.highlights, weaknesses: r.weaknesses,
    dimensions: r.dimensions,
  } : null;
  return {
    battleId: record.battleId, bossId: record.bossId, bossName: record.bossName, bossCodename: record.bossCodename,
    difficulty: record.difficulty, difficultyLabel: record.difficultyLabel,
    outcome: record.result,
    outcomeTitle: record.result === 'victory' ? 'BOSS DEFEATED' : record.result === 'defeat' ? 'SYSTEM FAILURE' : 'MISSION ABORTED',
    outcomeSubtitle: record.result === 'victory' ? '目标已消除' : record.result === 'defeat' ? '系统修复失败' : '任务已撤离',
    resultCode: record.result === 'victory' ? 'VICTORY' : record.result === 'defeat' ? 'DEFEAT' : 'RETREAT',
    dataQuality: record.dataQuality, durationMs: record.durationMs, completedAt: record.endedAt, archivedAt: record.archivedAt,
    finalPhase: record.finalPhase, phaseTotal: record.phaseTotal, consciousness: record.consciousness, deaths: record.deaths,
    failureReason: record.failureReason, fragmentTitle: record.fragmentTitle, fragmentStatus: record.fragmentStatus,
    statsAvailable: true, rating,
    reward: {
      available: record.reward.available, granted: record.reward.granted, rewardId: record.reward.rewardId,
      grantedAt: record.reward.grantedAt, xp: record.reward.xp, contribution: record.reward.contribution,
      credits: record.reward.credits, fragments: record.reward.fragments, baseXp: record.reward.baseXp,
      difficultyXp: record.reward.difficultyXp, performanceXp: record.reward.performanceXp, specialXp: record.reward.specialXp,
      fullXp: record.reward.fullXp, legacyXp: record.reward.legacyXp, fragmentTitle: record.reward.fragmentTitle,
      fragmentStatus: record.reward.fragmentStatus, reason: record.reward.available ? '' : '奖励数据不可用',
    },
    achievements: record.achievements, achievementCount: record.achievements.length,
    strengths: record.strengths, improvements: record.improvements,
    metrics, phaseRows: record.stats.phaseRows, timeline: record.timeline,
    source: { statsBattleId: record.battleId, ratingId: r?.ratingVersion ? 'rating:' + record.battleId + ':' + r.ratingVersion : null, rewardId: record.reward.rewardId, achievementIds: record.achievements.map(a => a.achievementId) },
  };
}

function metric(key: string, label: string, value: number | null, unit = ''): SettlementMetric {
  return { key, label, value, available: value != null, display: value == null ? 'N/A' : String(value) + unit };
}

export function archiveExportJson(record: BossArchiveRecord): string {
  return JSON.stringify(record, null, 2);
}

export function archiveStatsExportJson(store: BossBattleArchiveStore, player: PlayerState): string {
  return JSON.stringify({ totals: store.totals, bossTotals: store.bossTotals, difficultyTotals: store.difficultyTotals, achievements: player.progress.bossAchievements?.unlocked || [] }, null, 2);
}
