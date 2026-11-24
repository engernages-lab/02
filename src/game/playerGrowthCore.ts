// V1.3-E：玩家成长 / 风险统一规则（只读现有数据，不新增第二套属性）
import type { PlayerState } from './types';
import { LEVEL_XP, MAX_LEVEL, expForLevel, levelForExp, milestone, titleForLevel, toleranceFor } from './progression';
import { normalizeExplorationState, explorationTotals, regionCompleted, explorationRegionDefs } from './explorationCore';
import { normalizeMiraState, miraLevelProgress } from './miraCore';

export type RiskLevel = 'NORMAL' | 'WARNING' | 'DANGER' | 'CRITICAL';

export interface RiskStatus {
  level: RiskLevel;
  label: string;
  hint: string;
  toleranceRemaining: number;
  toleranceMax: number;
  failures: number;
  consciousness: number;
}

export const RISK_META: Record<RiskLevel, { label: string; hint: string; color: string }> = {
  NORMAL: { label: 'NORMAL · 稳定', hint: '容错与意识状态正常，可以继续推进。', color: '#5BD6A0' },
  WARNING: { label: 'WARNING · 警戒', hint: '容错或意识开始下降，先读诊断再提交。', color: '#FFD75E' },
  DANGER: { label: 'DANGER · 危险', hint: '剩余容错很低；优先「运行」验证，避免继续消耗。', color: '#FF9B4A' },
  CRITICAL: { label: 'CRITICAL · 危急', hint: '意识或容错已接近极限，下一次失败可能致命。', color: '#FF5B64' },
};

/** 基于真实意识 / 本关失败次数 / 等级容错计算风险。 */
export function riskStatusFor(input: {
  consciousness: number;
  level: number;
  failures?: number;
  toleranceRemaining?: number;
}): RiskStatus {
  const toleranceMax = toleranceFor(input.level);
  const used = Math.max(0, Math.floor(Number(input.failures) || 0));
  const remaining = typeof input.toleranceRemaining === 'number'
    ? Math.max(0, Math.floor(input.toleranceRemaining))
    : Math.max(0, toleranceMax - used);
  const c = Math.max(0, Math.min(100, Math.floor(Number(input.consciousness) || 0)));
  let level: RiskLevel = 'NORMAL';
  if (c <= 20 || remaining <= 0) level = 'CRITICAL';
  else if (c <= 35 || remaining <= 1) level = 'DANGER';
  else if (c <= 60 || remaining <= 2 || used >= 2) level = 'WARNING';
  return {
    level, label: RISK_META[level].label, hint: RISK_META[level].hint,
    toleranceRemaining: remaining, toleranceMax, failures: used, consciousness: c,
  };
}

export interface GrowthOverview {
  level: number;
  exp: number;
  title: string;
  nextExp: number;
  into: number;
  need: number;
  pct: number;
  maxed: boolean;
  toleranceMax: number;
  completedChallenges: number;
  totalChallenges: number;
  totalStars: number;
  failedSubmissions: number;
  regionsUnlocked: number;
  regionsCompleted: number;
  explorePct: number;
  nodesCompleted: number;
  achievementCount: number;
  miraLevel: number;
  miraStage: string;
  risk: RiskStatus;
}

export function growthOverviewFor(p: PlayerState, totalChallenges: number): GrowthOverview {
  const ms = milestone(p.exp);
  const ex = normalizeExplorationState(p.progress.exploration);
  const totals = explorationTotals(ex, p.progress.unlockedServers || []);
  const mira = normalizeMiraState(p.mira);
  const miraP = miraLevelProgress(mira);
  const totalStars = Object.values(p.progress.stars || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const failedSubmissions = Object.values(p.progress.failedAttempts || {}).reduce((s, v) => s + Math.max(0, Number(v) || 0), 0);
  const risk = riskStatusFor({ consciousness: p.consciousness, level: p.level });
  return {
    level: p.level, exp: p.exp, title: titleForLevel(p.level),
    nextExp: ms.maxed ? p.exp : expForLevel(ms.level + 1),
    into: ms.into, need: ms.need, pct: ms.maxed ? 100 : Math.max(0, Math.min(100, Math.round(ms.into / Math.max(1, ms.need) * 100))),
    maxed: ms.maxed, toleranceMax: toleranceFor(p.level),
    completedChallenges: p.progress.completedLevels.length, totalChallenges,
    totalStars, failedSubmissions,
    regionsUnlocked: totals.regionsUnlocked, regionsCompleted: totals.regionsCompleted,
    explorePct: totals.pct, nodesCompleted: totals.nodesCompleted,
    achievementCount: p.progress.achievements.length,
    miraLevel: miraP.level, miraStage: mira.stage,
    risk,
  };
}

/** 本阶段只用于展示：等级阈值/下一级差值，不修改等级。 */
export function levelThresholds(): readonly number[] { return LEVEL_XP; }
export function maxPlayerLevel(): number { return MAX_LEVEL; }
export function levelForExperience(exp: number): number { return levelForExp(exp); }

export function explorationRegionCompletionCount(p: PlayerState): number {
  const ex = normalizeExplorationState(p.progress.exploration);
  return explorationRegionDefs().filter(r => regionCompleted(ex, r.id)).length;
}
