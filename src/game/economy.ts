// 奖励与成长规则（纯函数，便于测试）
// 原则：所有数值都来自真实通关结果；重复刷关不再产生资源。
import type { Grade } from './rewards';
import { gradeOf } from './rewards';
import type { BossDifficulty } from './difficulty';
import { LEVEL_XP, MAX_LEVEL } from './progression';
import { ECONOMY, safeCredits, safeExp } from './economyConfig';

export {
  ECONOMY, safeCredits, safeExp,
  MAX_LEDGER, ledgerId, hasLedger, appendLedger, normalizeLedger,
} from './economyConfig';
export type { LedgerKind, RewardLedgerEntry } from './economyConfig';

/** 升级曲线自检：单调、首级门槛、末级门槛、增长倍率 */
export function auditLevelCurve(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (LEVEL_XP.length !== MAX_LEVEL) issues.push('LEVEL_XP 长度与 MAX_LEVEL 不一致');
  if (LEVEL_XP[0] !== 0) issues.push('Lv.1 门槛必须为 0');
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (LEVEL_XP[i] <= LEVEL_XP[i - 1]) issues.push('Lv.' + (i + 1) + ' 门槛未递增');
  }
  const firstDelta = LEVEL_XP[1] - LEVEL_XP[0];
  if (firstDelta > ECONOMY.curve.firstMax) issues.push('首级门槛过高：' + firstDelta);
  const lastDelta = LEVEL_XP[LEVEL_XP.length - 1] - LEVEL_XP[LEVEL_XP.length - 2];
  if (lastDelta > ECONOMY.curve.lastMax) issues.push('末级门槛过高：' + lastDelta);
  const ratio = firstDelta > 0 ? lastDelta / firstDelta : 0;
  if (ratio > ECONOMY.curve.growthRatioMax) issues.push('单级门槛增长倍率过高：' + ratio.toFixed(1));
  return { ok: issues.length === 0, issues };
}

export interface LevelRewardInput {
  levelExp: number;
  fails: number;
  hints: number;
  firstClear: boolean;
  prevStars: number;
  newStars: number;
}

export interface LevelRewardResult {
  grade: Grade;
  base: number;
  firstClearBonus: number;
  noFail: number;
  noHint: number;
  gradeBonus: number;
  /** 重复通关时的评级提升补偿（唯一允许的重复收益） */
  improvement: number;
  total: number;
  trustGain: number;
}

/** 重复通关的收益上限：每提升一颗星给 6 贡献点，最多两颗星 */
export const IMPROVEMENT_PER_STAR = ECONOMY.level.improvementPerStar;

/**
 * 关卡结算：
 * - 首通：基础 + 首通 + 零失误 + 未用提示 + 评级；
 * - 重复：不计基础收益，只在星级提升时给少量补偿（防止刷关刷资源）。
 */
export function computeLevelRewardV2(input: LevelRewardInput): LevelRewardResult {
  const L = ECONOMY.level;
  const { levelExp, fails, hints, firstClear, prevStars, newStars } = input;
  const grade = gradeOf(fails, hints);
  const base = firstClear ? Math.max(L.baseMin, Math.round(levelExp / L.baseDivisor)) : 0;
  const firstClearBonus = firstClear ? L.firstClear : 0;
  const noFail = firstClear && fails <= 0 ? L.noFail : 0;
  const noHint = firstClear && hints <= 0 ? L.noHint : 0;
  const gradeBonus = firstClear ? (grade === 'S' ? L.gradeS : grade === 'A' ? L.gradeA : grade === 'B' ? L.gradeB : 0) : 0;
  const gained = Math.max(0, newStars - prevStars);
  const improvement = firstClear ? 0 : Math.min(L.improvementMaxStars, gained) * L.improvementPerStar;
  const total = base + firstClearBonus + noFail + noHint + gradeBonus + improvement;
  const trustGain = firstClear
    ? (L.trustFirst + (grade === 'S' ? L.trustS : 0) + L.trustFirstExtra)
    : (improvement > 0 ? L.trustImprove : 0);
  return { grade, base, firstClearBonus, noFail, noHint, gradeBonus, improvement, total, trustGain };
}

// ---------- 首次击败章节 Boss 的奖励 ----------
export interface BossReward {
  chapter: number;
  credits: number;
  trust: number;
  title: string;
  items?: Record<string, number>;
  skins?: string[];
}

export const BOSS_CLEAR_REWARDS: BossReward[] = [
  { chapter: 1, credits: 120, trust: 6, title: '数据港清道夫', items: { scan: 1 } },
  { chapter: 2, credits: 150, trust: 7, title: '记忆守门人', items: { rollback: 1 } },
  { chapter: 3, credits: 180, trust: 8, title: '档案解密者' },
  { chapter: 4, credits: 220, trust: 9, title: '秩序校准者' },
  { chapter: 5, credits: 260, trust: 10, title: '熵潮平息者' },
  { chapter: 6, credits: 360, trust: 12, title: '起源之外' },
];

export const bossRewardFor = (chapter: number): BossReward | undefined =>
  BOSS_CLEAR_REWARDS.find(b => b.chapter === chapter);

// ---------- 难度奖励（一次性，按难度分别结算，总量固定不随刷取增加） ----------
export interface DifficultyRewardDef {
  difficulty: BossDifficulty;
  /** 相对 Boss 基础经验的额外比例 */
  expPct: number;
  /** 相对章节首杀贡献点的额外比例 */
  creditsPct: number;
  /** 是否发放该难度的 Boss 徽章 */
  badge: boolean;
  /** 专家难度额外称号（全局一次） */
  title?: string;
}

export const DIFFICULTY_CLEAR_REWARDS: DifficultyRewardDef[] = [
  { difficulty: 'easy', expPct: 0, creditsPct: 0, badge: false },
  { difficulty: 'hard', expPct: 0.4, creditsPct: 0.5, badge: true },
  { difficulty: 'expert', expPct: 0.7, creditsPct: 1.0, badge: true, title: 'title-expert' },
];

export const difficultyRewardFor = (difficulty: BossDifficulty): DifficultyRewardDef =>
  DIFFICULTY_CLEAR_REWARDS.find(d => d.difficulty === difficulty) || DIFFICULTY_CLEAR_REWARDS[0];

/** 每个 Boss / 难度的徽章 id（一次性） */
export const bossDifficultyBadgeId = (bossId: string, difficulty: BossDifficulty): string =>
  'badge-' + difficulty + '-' + bossId;

// ---------- 等级解锁 ----------
export interface LevelUnlock {
  level: number;
  id: string;
  name: string;
  desc: string;
  /** 自动加入已拥有外观的槽位 */
  slot?: 'title' | 'avatarFrame' | 'particles' | 'terminal';
}

export const LEVEL_UNLOCKS: LevelUnlock[] = [
  { level: 5, id: 'title-level5', name: '称号 · 中级修复师', desc: 'Lv.5 自动解锁', slot: 'title' },
  { level: 7, id: 'frame-core', name: '头像框 · 核心回路', desc: 'Lv.7 自动解锁', slot: 'avatarFrame' },
  { level: 10, id: 'particles-origin', name: '粒子 · 原初辉光', desc: 'Lv.10 自动解锁', slot: 'particles' },
];

/** 本次升级新解锁的内容（跨级也会一次给全） */
export function unlocksForLevel(prevLevel: number, newLevel: number): LevelUnlock[] {
  return LEVEL_UNLOCKS.filter(u => u.level > prevLevel && u.level <= newLevel);
}

// ---------- 章节结算 ----------
export interface ChapterStats {
  chapter: number;
  levels: number;
  stars: number;
  maxStars: number;
  fails: number;
  hints: number;
}

/** 章节评价：星级占比为主，失误与提示扣分 */
export function chapterGrade(s: ChapterStats): Grade {
  const ratio = s.maxStars > 0 ? s.stars / s.maxStars : 0;
  const penalty = s.fails > 6 || s.hints > 6 ? 1 : 0;
  if (ratio >= 0.95 && s.fails === 0 && s.hints === 0) return 'S';
  if (ratio >= 0.8 && penalty === 0) return 'A';
  if (ratio >= 0.6) return 'B';
  return 'C';
}

export interface ChapterSettlement {
  grade: Grade;
  stats: ChapterStats;
  credits: number;
  exp: number;
  trust: number;
  knowledge: { id: string; ok: boolean }[];
  unlocks: string[];
}

/** 汇总章节结算面板需要展示的数据（不写存档，只读计算） */
export function buildChapterSettlement(args: {
  chapter: number;
  levels: number;
  stars: number;
  fails: number;
  hints: number;
  credits: number;
  exp: number;
  trust: number;
  knowledgeIds: string[];
  masteredIds: string[];
  unlocks: string[];
}): ChapterSettlement {
  const stats: ChapterStats = {
    chapter: args.chapter,
    levels: args.levels,
    stars: args.stars,
    maxStars: args.levels * 3,
    fails: args.fails,
    hints: args.hints,
  };
  return {
    grade: chapterGrade(stats),
    stats,
    credits: args.credits,
    exp: args.exp,
    trust: args.trust,
    knowledge: args.knowledgeIds.map(id => ({ id, ok: args.masteredIds.includes(id) })),
    unlocks: args.unlocks,
  };
}
