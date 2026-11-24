// Boss 战斗结算数据模型（V1.3-B.5.5）
//
// 纯只读投影：从 B.5.1 统计、B.5.2 评分、B.5.3 奖励、B.5.4 成就生成结算数据。
// 不重新计算、不写存档、不发放奖励、不解锁成就。

import { bossById } from './bosses';
import { buildBossPhasePlan } from './bossPhasePlans';
import { difficultyMeta, type BossDifficulty } from './difficulty';
import { fragmentById } from './lore/fragments';
import { BOSS_ACHIEVEMENT_MAP, type BossAchievementDefinition } from './bossAchievementConfig';
import type { BossBattleRating } from './bossBattleRating';
import type { BossBattleReward } from './bossBattleReward';
import type { BossBattleStatsState } from './bossBattleStats';
import type { PlayerState } from './types';

export type SettlementOutcome = 'victory' | 'defeat' | 'retreat';
export type SettlementDataQuality = 'complete' | 'partial' | 'invalid';

export interface SettlementMetric {
  key: string;
  label: string;
  value: number | null;
  display: string;
  available: boolean;
}

export interface SettlementDimension {
  key: string;
  label: string;
  score: number | null;
  maxScore: number;
  weight: number;
  effectiveWeight: number | null;
  availability: string;
  available: boolean;
  reason: string;
}

export interface SettlementAchievement {
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

export interface SettlementRewardView {
  available: boolean;
  granted: boolean;
  rewardId: string | null;
  grantedAt: number | null;
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
  fragmentTitle: string | null;
  fragmentStatus: string;
  reason: string;
}

export interface SettlementRatingView {
  available: boolean;
  finalized: boolean;
  grade: string | null;
  displayScore: number | null;
  totalScore: number | null;
  dataQuality: string;
  ratingVersion: string | null;
  reasons: string[];
  highlights: string[];
  weaknesses: string[];
  dimensions: SettlementDimension[];
}

export interface SettlementTimelineEvent {
  offsetMs: number;
  label: string;
  kind: string;
}

export interface SettlementPhaseRow {
  phaseId: string;
  label: string;
  durationMs: number | null;
  damageTaken: number | null;
  attackCount: number | null;
  challengeSuccess: number | null;
  challengeFailed: number | null;
  weaknessDiscoveries: number | null;
  weaknessCracks: number | null;
  endState: string;
}

export interface BossSettlementData {
  battleId: string;
  bossId: string;
  bossName: string;
  bossCodename: string;
  difficulty: string;
  difficultyLabel: string;
  outcome: SettlementOutcome;
  outcomeTitle: string;
  outcomeSubtitle: string;
  resultCode: string;
  dataQuality: SettlementDataQuality;
  durationMs: number | null;
  completedAt: number | null;
  archivedAt?: number | null;
  finalPhase: number | null;
  phaseTotal: number | null;
  consciousness: number | null;
  deaths: number | null;
  failureReason: string;
  fragmentTitle: string | null;
  fragmentStatus: string;
  statsAvailable: boolean;
  rating: SettlementRatingView | null;
  reward: SettlementRewardView;
  achievements: SettlementAchievement[];
  achievementCount: number;
  strengths: string[];
  improvements: string[];
  metrics: {
    challenge: SettlementMetric[];
    combat: SettlementMetric[];
    weakness: SettlementMetric[];
    dynamic: SettlementMetric[];
    progress: SettlementMetric[];
  };
  phaseRows: SettlementPhaseRow[];
  timeline: SettlementTimelineEvent[];
  source: {
    statsBattleId: string | null;
    ratingId: string | null;
    rewardId: string | null;
    achievementIds: string[];
  };
}

export interface SettlementBuildContext {
  fragmentGranted?: boolean;
  failureReason?: string;
  now?: number;
}

const int = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
const finiteOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : null);
const pct = (v: number | null): string => (v == null ? 'N/A' : (Math.round(v * 1000) / 10) + '%');

function metric(key: string, label: string, value: number | null, unit = ''): SettlementMetric {
  return {
    key, label, value,
    available: value != null,
    display: value == null ? 'N/A' : String(value) + unit,
  };
}

function outcomeOf(stats: BossBattleStatsState | null): SettlementOutcome {
  if (!stats) return 'retreat';
  if (stats.result === 'victory') return 'victory';
  if (stats.result === 'defeat') return 'defeat';
  return 'retreat';
}

function findStats(player: PlayerState, battleId: string): BossBattleStatsState | null {
  const store = player.progress.bossBattleStats;
  if (!store) return null;
  const hist = Array.isArray(store.history) ? store.history.find(s => s.battleId === battleId) : undefined;
  if (hist) return hist;
  return store.active && store.active.battleId === battleId ? store.active : null;
}

function findRating(player: PlayerState, battleId: string): BossBattleRating | null {
  return player.progress.bossBattleRatings?.history?.find(r => r.battleId === battleId) || null;
}

function findReward(player: PlayerState, battleId: string): BossBattleReward | null {
  return player.progress.bossBattleRewards?.history?.find(r => r.battleId === battleId) || null;
}

function achievementEvidence(definition: BossAchievementDefinition, evidence: Record<string, unknown>): string {
  switch (definition.id) {
    case 'boss_perfect_defense': return '本场未受到有效伤害，且未发生死亡。';
    case 'boss_last_stand': return `最低意识降至 ${evidence.minConsciousness ?? 'N/A'}。`;
    case 'boss_no_death': return '本场战斗未发生死亡。';
    case 'boss_clutch_survivor': return `最低意识 ${evidence.minConsciousness ?? 'N/A'}，并完成有效防御/闪避。`;
    case 'boss_code_master': return `判题 ${evidence.challengePassed ?? 0} / ${evidence.challengeJudged ?? 0} 全部通过。`;
    case 'boss_perfect_streak': return `最长连续成功 ${evidence.maxConsecutive ?? 0} 次。`;
    case 'boss_first_try': return `判题 ${evidence.challengeJudged ?? 0} 次，无失败提交。`;
    case 'boss_dodge_master': return `成功闪避 ${evidence.dodgeSuccess ?? 0} 次。`;
    case 'boss_defense_master': return `成功防御 ${evidence.defenseSuccess ?? 0} 次。`;
    case 'boss_counter_master': return '弱点机制真实打断了 Boss 攻击。';
    case 'boss_weakness_hunter': return `发现弱点 ${evidence.weaknessDiscovered ?? 0} 个。`;
    case 'boss_weakness_master': return `破解不同弱点 ${evidence.weaknessCracked ?? 0} 个。`;
    case 'boss_weakness_exploit': return `弱点暴露期间造成 ${evidence.weaknessDamage ?? 0} 点真实伤害。`;
    case 'boss_crisis_responder': return `成功处理动态事件 ${evidence.dynamicSuccess ?? 0} 次。`;
    case 'boss_intrusion_destroyer': return '成功完成未知入侵事件。';
    case 'boss_rating_s': return '正式战斗评分达到 S 级。';
    default: return '满足真实战斗统计条件。';
  }
}

function buildRatingView(rating: BossBattleRating | null): SettlementRatingView | null {
  if (!rating) return null;
  const dims = Object.entries(rating.dimensionScores || {}).map(([key, d]) => ({
    key,
    label: d.label,
    score: finiteOrNull(d.score),
    maxScore: finiteOrNull(d.maxScore) ?? 0,
    weight: finiteOrNull(d.weight) ?? 0,
    effectiveWeight: finiteOrNull(d.effectiveWeight),
    availability: d.availability,
    available: d.availability === 'available',
    reason: rating.ratingReasons.find(r => r.includes(d.label)) || '',
  }));
  return {
    available: true,
    finalized: rating.finalized === true,
    grade: rating.grade || null,
    displayScore: finiteOrNull(rating.displayScore),
    totalScore: finiteOrNull(rating.totalScore),
    dataQuality: rating.dataQuality || 'invalid',
    ratingVersion: rating.ratingVersion || null,
    reasons: Array.isArray(rating.ratingReasons) ? rating.ratingReasons.slice(0, 8) : [],
    highlights: Array.isArray(rating.performanceHighlights) ? rating.performanceHighlights.slice(0, 6) : [],
    weaknesses: Array.isArray(rating.performanceWeaknesses) ? rating.performanceWeaknesses.slice(0, 6) : [],
    dimensions: dims,
  };
}

function buildRewardView(
  reward: BossBattleReward | null,
  fragmentTitle: string | null,
  fragmentStatus: string,
): SettlementRewardView {
  if (!reward) {
    return {
      available: false, granted: false, rewardId: null, grantedAt: null,
      xp: null, contribution: null, credits: null, fragments: null,
      baseXp: null, difficultyXp: null, performanceXp: null, specialXp: null, fullXp: null, legacyXp: null,
      fragmentTitle, fragmentStatus, reason: '奖励数据不可用',
    };
  }
  return {
    available: true,
    granted: reward.granted === true,
    rewardId: reward.rewardId || null,
    grantedAt: finiteOrNull(reward.grantedAt),
    xp: finiteOrNull(reward.grantedReward?.xp),
    contribution: finiteOrNull(reward.grantedReward?.contribution),
    credits: finiteOrNull(reward.grantedReward?.contribution),
    fragments: finiteOrNull(reward.grantedReward?.fragments),
    baseXp: finiteOrNull(reward.baseReward?.xp),
    difficultyXp: finiteOrNull(reward.difficultyBonus?.xp),
    performanceXp: finiteOrNull(reward.performanceBonus?.xp),
    specialXp: finiteOrNull(reward.specialBonus?.xp),
    fullXp: finiteOrNull(reward.finalReward?.xp),
    legacyXp: finiteOrNull(reward.legacyOffset?.xp),
    fragmentTitle,
    fragmentStatus,
    reason: '',
  };
}

function buildAchievements(player: PlayerState, battleId: string): SettlementAchievement[] {
  const unlocked = player.progress.bossAchievements?.unlocked || [];
  const out: SettlementAchievement[] = [];
  for (const u of unlocked) {
    if (u.battleId !== battleId) continue;
    const def = BOSS_ACHIEVEMENT_MAP[u.achievementId];
    if (!def) continue;
    out.push({
      achievementId: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      level: def.level,
      hidden: def.hidden,
      icon: def.icon,
      reward: { ...def.reward, fragments: 0 },
      unlockedAt: finiteOrNull(u.unlockedAt) ?? 0,
      evidence: achievementEvidence(def, (u.evidence || {}) as unknown as Record<string, unknown>),
    });
  }
  return out;
}

function buildTimeline(stats: BossBattleStatsState | null): SettlementTimelineEvent[] {
  if (!stats || !Array.isArray(stats.eventLog) || stats.eventLog.length === 0) return [];
  const out: SettlementTimelineEvent[] = [];
  for (const ev of stats.eventLog) {
    let label = '';
    switch (ev.eventType) {
      case 'battle-started': label = '战斗开始'; break;
      case 'phase-started': label = '进入新阶段'; break;
      case 'phase-transition': label = 'Boss 阶段转换'; break;
      case 'phase-completed': label = '阶段击破'; break;
      case 'challenge-result': label = String(ev.payload?.outcome) === 'passed' ? '挑战成功' : '挑战失败'; break;
      case 'weakness-discovered': label = '发现弱点'; break;
      case 'weakness-crack-result': label = String(ev.payload?.outcome) === 'success' ? '破解弱点' : '弱点破解失败'; break;
      case 'weakness-exposed': label = '弱点暴露'; break;
      case 'dynamic-triggered': label = '动态事件触发'; break;
      case 'dynamic-success': label = '动态事件成功'; break;
      case 'dynamic-failed': label = '动态事件失败'; break;
      case 'dynamic-timeout': label = '动态事件超时'; break;
      case 'dynamic-cancelled': label = '动态事件取消'; break;
      case 'attack-cancelled': label = 'Boss 攻击取消'; break;
      case 'attack-interrupted': label = 'Boss 攻击打断'; break;
      case 'player-death': label = '玩家死亡'; break;
      default: break;
    }
    if (!label) continue;
    out.push({
      offsetMs: Math.max(0, ev.occurredAt - (stats.startedAt || ev.occurredAt)),
      label,
      kind: ev.eventType,
    });
  }
  return out.sort((a, b) => a.offsetMs - b.offsetMs).slice(-40);
}

function buildSummaries(stats: BossBattleStatsState | null, rating: BossBattleRating | null, outcome: SettlementOutcome): { strengths: string[]; improvements: string[] } {
  const strengths: string[] = [];
  const improvements: string[] = [];
  if (!stats) {
    return { strengths: [], improvements: outcome === 'victory' ? [] : ['战斗数据不完整，无法生成完整表现总结。'] };
  }
  const c = stats.challengeStats;
  const a = stats.attackStats;
  const d = stats.defenseStats;
  const w = stats.weaknessStats;
  const e = stats.dynamicEventStats;
  if (int(stats.playerDeathCount) === 0) strengths.push('全程保持意识稳定，未发生死亡。');
  if (int(a.damageTaken) === 0) strengths.push('本场未受到有效伤害。');
  if (int(c.judgedCount) > 0 && int(c.passedCount) === int(c.judgedCount) && int(c.invalidCount) === 0) strengths.push(`代码挑战 ${int(c.passedCount)} / ${int(c.judgedCount)} 全部通过。`);
  if (int(c.maxConsecutiveSuccess) >= 3) strengths.push(`连续修复 ${int(c.maxConsecutiveSuccess)} 次成功。`);
  if (int(d.dodgeSuccessCount) >= 3) strengths.push(`成功闪避 ${int(d.dodgeSuccessCount)} 次攻击。`);
  if (int(d.defenseSuccessCount) >= 3) strengths.push(`成功防御 ${int(d.defenseSuccessCount)} 次攻击。`);
  if (int(w.crackSuccessCount) > 0) strengths.push(`破解 ${int(w.crackSuccessCount)} 个弱点。`);
  if (int(w.bossHpDamage) > 0) strengths.push(`弱点机制造成 ${int(w.bossHpDamage)} 点额外 Boss 伤害。`);
  if (int(e.successCount) > 0) strengths.push(`成功处理 ${int(e.successCount)} 次动态危机。`);
  if (rating && (rating.grade === 'S' || rating.grade === 'A')) strengths.push(`正式战斗评分达到 ${rating.grade} 级。`);

  if (int(c.failedCount) > 0) improvements.push(`判题失败 ${int(c.failedCount)} 次，可先运行样例再提交。`);
  if (int(c.invalidCount) > 0) improvements.push(`存在 ${int(c.invalidCount)} 次无效提交。`);
  if (int(stats.playerDeathCount) > 0) improvements.push(`本场发生 ${int(stats.playerDeathCount)} 次死亡。`);
  if (int(a.damageTaken) > 0 && int(d.defenseSuccessCount) + int(d.dodgeSuccessCount) < 3) improvements.push(`受到 ${int(a.damageTaken)} 点伤害，防御/闪避仍有提升空间。`);
  if (int(w.discoveredCount) === 0) improvements.push('本场尚未发现可用的 Boss 弱点。');
  if (int(e.failedCount) + int(e.timeoutCount) > 0) improvements.push('动态事件处理还可以更稳定。');
  if (int(c.maxConsecutiveSuccess) < 3 && int(c.judgedCount) >= 3) improvements.push('尝试保持连续判题成功。');
  if (rating && rating.dataQuality === 'partial') improvements.push('本场评分数据不完整，结算评价仅作参考。');
  return { strengths: [...new Set(strengths)].slice(0, 3), improvements: [...new Set(improvements)].slice(0, 3) };
}

/** 构建结算数据（纯只读） */
export function buildBossSettlementData(
  player: PlayerState,
  battleId: string,
  context: SettlementBuildContext = {},
): BossSettlementData | null {
  if (!battleId) return null;
  const stats = findStats(player, battleId);
  const rating = findRating(player, battleId);
  const reward = findReward(player, battleId);
  // 没有任何绑定该 battleId 的正式数据时不伪造结算
  if (!stats && !rating && !reward) return null;
  const boss = bossById(stats?.bossId || rating?.bossId || reward?.bossId || player.progress.currentBossId || '');
  const bossId = boss?.id || stats?.bossId || '';
  const difficulty = stats?.difficulty || reward?.difficulty || 'easy';
  const diff = (difficulty === 'hard' || difficulty === 'expert' ? difficulty : 'easy') as BossDifficulty;
  const outcome = outcomeOf(stats);
  const plan = boss ? buildBossPhasePlan(boss.id, diff) : null;
  const runRecord = player.progress.bossBattleHistory?.find(r => r.battleId === battleId);
  const phaseStats = stats ? Object.values(stats.phaseStats || {}).sort((a, b) => a.phaseIndex - b.phaseIndex) : [];
  const fragmentTitle = boss?.fragmentId ? (fragmentById(boss.fragmentId)?.title || boss.fragmentId) : null;
  const fragmentOwned = !!boss?.fragmentId && player.meta.memoryFragments.includes(boss.fragmentId);
  const fragmentStatus = outcome !== 'victory'
    ? '未发放'
    : context.fragmentGranted === true
      ? '已归位'
      : fragmentOwned
        ? '已拥有 / 不重复发放'
        : '未发放';
  const achievements = buildAchievements(player, battleId);
  const ratingView = buildRatingView(rating);
  const rewardView = buildRewardView(reward, fragmentTitle, fragmentStatus);
  const metrics = stats ? {
    challenge: [
      metric('submitted', '挑战次数', int(stats.challengeStats.submittedCount)),
      metric('judged', '有效判题', int(stats.challengeStats.judgedCount)),
      metric('passed', '成功次数', int(stats.challengeStats.passedCount)),
      metric('failed', '失败次数', int(stats.challengeStats.failedCount)),
      metric('invalid', '无效提交', int(stats.challengeStats.invalidCount)),
      metric('streak', '最长连续成功', int(stats.challengeStats.maxConsecutiveSuccess)),
      metric('deaths', '死亡次数', int(stats.playerDeathCount)),
    ],
    combat: [
      metric('warning', '攻击预警', int(stats.attackStats.telegraphCount)),
      metric('hit', '被攻击命中', int(stats.attackStats.hitCount)),
      metric('blocked', '成功防御', int(stats.defenseStats.defenseSuccessCount)),
      metric('dodged', '成功闪避', int(stats.defenseStats.dodgeSuccessCount)),
      metric('cancelled', '攻击取消', int(stats.attackStats.cancelledCount)),
      metric('interrupted', '攻击打断', int(stats.attackStats.interruptedByWeaknessCount) + int(stats.attackStats.interruptedByCrisisCount)),
      metric('damageTaken', '承受伤害', int(stats.attackStats.damageTaken)),
      metric('damageDealt', '造成伤害', finiteOrNull(runRecord?.stats?.damageDealt)),
    ],
    weakness: [
      metric('discovered', '已发现弱点', int(stats.weaknessStats.discoveredCount)),
      metric('uniqueDiscovered', '不同弱点数量', Array.isArray(stats.weaknessStats.discoveredIds) ? stats.weaknessStats.discoveredIds.length : null),
      metric('cracked', '已破解弱点', int(stats.weaknessStats.crackSuccessCount)),
      metric('exposed', '弱点利用次数', int(stats.weaknessStats.exposedCount)),
      metric('damage', '弱点造成伤害', int(stats.weaknessStats.bossHpDamage)),
    ],
    dynamic: [
      metric('triggered', '事件触发', int(stats.dynamicEventStats.triggeredCount)),
      metric('success', '成功处理', int(stats.dynamicEventStats.successCount)),
      metric('failed', '失败次数', int(stats.dynamicEventStats.failedCount)),
      metric('successRate', '处理成功率', stats.dynamicEventStats.successCount + stats.dynamicEventStats.failedCount + stats.dynamicEventStats.timeoutCount > 0
        ? Math.round((stats.dynamicEventStats.successCount / (stats.dynamicEventStats.successCount + stats.dynamicEventStats.failedCount + stats.dynamicEventStats.timeoutCount)) * 100)
        : null, '%'),
    ],
    progress: [
      metric('phases', '阶段转换', int(stats.phaseTransitions)),
      metric('completed', '完成阶段', int(stats.phasesCompleted)),
      metric('maxPhase', '最高阶段', int(stats.maxPhaseReached) + 1),
      metric('minConsciousness', '最低意识', finiteOrNull(stats.minConsciousness)),
    ],
  } : {
    challenge: [], combat: [], weakness: [], dynamic: [], progress: [],
  };
  const summary = buildSummaries(stats, rating, outcome);
  return {
    battleId,
    bossId,
    bossName: boss ? boss.codename + ' · ' + boss.title : bossId,
    bossCodename: boss ? boss.codename : bossId.toUpperCase(),
    difficulty,
    difficultyLabel: difficultyMeta(diff).label,
    outcome,
    outcomeTitle: outcome === 'victory' ? 'BOSS DEFEATED' : outcome === 'defeat' ? 'SYSTEM FAILURE' : 'MISSION ABORTED',
    outcomeSubtitle: outcome === 'victory' ? '目标已消除' : outcome === 'defeat' ? '系统修复失败' : '任务已撤离',
    resultCode: outcome === 'victory' ? 'VICTORY' : outcome === 'defeat' ? 'DEFEAT' : 'RETREAT',
    dataQuality: stats ? (stats.dataQuality === 'invalid' ? 'invalid' : stats.dataQuality === 'partial' ? 'partial' : 'complete') : 'invalid',
    durationMs: finiteOrNull(stats?.wallDurationMs),
    completedAt: finiteOrNull(stats?.endedAt),
    finalPhase: stats ? int(stats.maxPhaseReached) + 1 : null,
    phaseTotal: plan ? plan.phases.length : null,
    consciousness: finiteOrNull(player.consciousness),
    deaths: stats ? int(stats.playerDeathCount) : null,
    failureReason: context.failureReason
      || (outcome === 'defeat' ? (player.meta.lastDeathReason || '意识完整度归零') : outcome === 'retreat' ? '玩家主动撤退' : ''),
    fragmentTitle,
    fragmentStatus,
    statsAvailable: !!stats,
    rating: ratingView,
    reward: rewardView,
    achievements,
    achievementCount: achievements.length,
    strengths: summary.strengths,
    improvements: summary.improvements,
    metrics,
    timeline: buildTimeline(stats),
    phaseRows: phaseStats.map(p => ({
      phaseId: p.phaseId,
      label: '阶段 ' + (p.phaseIndex + 1),
      durationMs: finiteOrNull(p.durationMs),
      damageTaken: finiteOrNull(p.damageTaken),
      attackCount: finiteOrNull(p.attackCount),
      challengeSuccess: finiteOrNull(p.challengeSuccess),
      challengeFailed: finiteOrNull(p.challengeFailed),
      weaknessDiscoveries: finiteOrNull(p.weaknessDiscoveries),
      weaknessCracks: finiteOrNull(p.weaknessCracks),
      endState: p.endState,
    })),
    source: {
      statsBattleId: stats?.battleId || null,
      ratingId: rating?.ratingId || null,
      rewardId: reward?.rewardId || null,
      achievementIds: achievements.map(a => a.achievementId),
    },
  };
}

/** 动画/展示用时长格式化；数据缺失返回 N/A */
export function formatSettlementDuration(ms: number | null | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return 'N/A';
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? m + ' 分 ' + String(s).padStart(2, '0') + ' 秒' : s + ' 秒';
}

export function publicSettlementAchievementCount(data: BossSettlementData): number {
  return data.achievements.length;
}
