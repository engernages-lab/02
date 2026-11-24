// Boss 战斗奖励配置（V1.3-B.5.3）
//
// 数值以现有经济体系为基准：
// - 首胜基础 XP/贡献点/碎片仍由 handleBossFirstClear 统一发放；
// - B.5.3 计算完整奖励，并扣除既有首胜/难度奖励（legacyOffset），只补发评分与表现增量；
// - 同一 Boss + 难度只在首次通关时参与 B.5.3 奖励，避免重复刷取。
// 所有倍率、表现奖励与上限集中在此文件。

export const BOSS_REWARD_VERSION = 'v1.0.0';

export type BossRewardDifficulty = 'easy' | 'hard' | 'expert';

export interface BossRewardAmounts {
  xp: number;
  contribution: number;
  fragments: number;
}

export const BOSS_BATTLE_REWARD_CONFIG = {
  version: BOSS_REWARD_VERSION,

  /** 无 Boss 数据时的兜底基础奖励；实际基础值优先读取现有 Boss/章节配置 */
  baseVictoryRewards: {
    xp: 150,
    contribution: 120,
    fragments: 1,
  } as BossRewardAmounts,

  /**
   * 与现有难度奖励保持同口径：
   * - XP：easy 0%、hard +40%、expert +70%
   * - 贡献点：easy 0%、hard +50%、expert +100%
   * - 碎片为唯一首胜物品，不叠加倍率。
   */
  difficultyMultipliers: {
    easy: { xp: 1, contribution: 1, fragments: 1 },
    hard: { xp: 1.4, contribution: 1.5, fragments: 1 },
    expert: { xp: 1.7, contribution: 2, fragments: 1 },
  } as Record<BossRewardDifficulty, { xp: number; contribution: number; fragments: number }>,

  gradeMultipliers: {
    S: 1.5,
    A: 1.3,
    B: 1.15,
    C: 1,
    D: 0.8,
  } as Record<'S' | 'A' | 'B' | 'C' | 'D', number>,

  specialBonuses: {
    noDeath: { xp: 20, contribution: 10, fragments: 0 },
    challengeStreak: { xp: 15, contribution: 8, fragments: 0 },
    weakness: { xp: 10, contribution: 6, fragments: 0 },
    crisis: { xp: 10, contribution: 6, fragments: 0 },
  } as Record<'noDeath' | 'challengeStreak' | 'weakness' | 'crisis', BossRewardAmounts>,

  caps: {
    /** 单场 B.5.3 增量（评分 + 表现）上限 */
    additionalXp: 400,
    additionalContribution: 300,
    /** 表现奖励小计上限 */
    specialXp: 55,
    specialContribution: 30,
  },

  maxHistory: 50,
  maxGrantedIds: 200,
} as const;

export const SPECIAL_BONUS_LABELS: Record<'noDeath' | 'challengeStreak' | 'weakness' | 'crisis', string> = {
  noDeath: '无死亡',
  challengeStreak: '连续挑战成功',
  weakness: '弱点破解利用',
  crisis: '危机处理',
};

export function difficultyMultiplierOf(raw: string): { xp: number; contribution: number; fragments: number } {
  if (raw === 'hard' || raw === 'expert') return BOSS_BATTLE_REWARD_CONFIG.difficultyMultipliers[raw];
  return BOSS_BATTLE_REWARD_CONFIG.difficultyMultipliers.easy;
}

export function gradeMultiplierOf(grade: string | null): number {
  if (grade === 'S' || grade === 'A' || grade === 'B' || grade === 'C' || grade === 'D') {
    return BOSS_BATTLE_REWARD_CONFIG.gradeMultipliers[grade];
  }
  return 1;
}
