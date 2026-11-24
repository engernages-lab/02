// Boss 战斗评价配置（V1.3-B.5.2）
//
// 所有评分权重、子项上限、缺失数据策略与等级阈值集中在此文件。
// 评分算法不得在组件或其他模块内散落阈值。

export const BOSS_BATTLE_RATING_VERSION = 'v1.0.0';

export type BossRatingGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type BossRatingDimensionKey = 'survival' | 'challenge' | 'tactics' | 'weakness' | 'crisis';
export type BossRatingAvailability = 'available' | 'mechanicUnavailable' | 'dataMissing' | 'invalid';

export const BOSS_BATTLE_RATING_WEIGHTS: Record<BossRatingDimensionKey, number> = {
  survival: 25,
  challenge: 30,
  tactics: 20,
  weakness: 15,
  crisis: 10,
};

/** 生存：真实攻击结果归一化（15）+ 死亡惩罚（10） */
export const SURVIVAL_RATING_CONFIG = {
  damageAvoidanceMax: 15,
  deathMax: 10,
  /** 第 1 次死亡扣 5；第 2 次起扣满，不允许负分 */
  deathPenaltyPerDeath: 5,
};

/** 挑战：通过率（26）+ 连续成功（2）+ 关键破解成功（2） */
export const CHALLENGE_RATING_CONFIG = {
  passRateMax: 26,
  streakMax: 2,
  keyCrackMax: 2,
};

/** 战术：防御（12）+ 闪避（8）；缺失子项不重新分配，只降低可信度 */
export const TACTICS_RATING_CONFIG = {
  defenseMax: 12,
  dodgeMax: 8,
};

/** 弱点：发现（5，按 Boss 真实弱点数量归一化）+ 破解成功率（8）+ 利用（2） */
export const WEAKNESS_RATING_CONFIG = {
  discoveryMax: 5,
  crackMax: 8,
  utilizationMax: 2,
};

/** 危机：成功处理率（10）；系统取消/终结清理不计入可处理事件 */
export const CRISIS_RATING_CONFIG = {
  successRateMax: 10,
};

export const BOSS_BATTLE_RATING_GRADES: { grade: BossRatingGrade; min: number; name: string }[] = [
  { grade: 'S', min: 90, name: '卓越' },
  { grade: 'A', min: 80, name: '优秀' },
  { grade: 'B', min: 70, name: '良好' },
  { grade: 'C', min: 60, name: '合格' },
  { grade: 'D', min: 0, name: '待提升' },
];

export const MAX_BOSS_BATTLE_RATINGS = 50;

/** 展示分与等级统一使用四舍五入后的整数，避免 89.5 显示 90 却仍为 A */
export function gradeForDisplayScore(score: number): BossRatingGrade {
  const v = Math.max(0, Math.min(100, Math.round(Number.isFinite(score) ? score : 0)));
  for (const g of BOSS_BATTLE_RATING_GRADES) {
    if (v >= g.min) return g.grade;
  }
  return 'D';
}

export function displayScoreFor(totalScore: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(totalScore) ? totalScore : 0)));
}

export function gradeNameOf(grade: BossRatingGrade): string {
  return BOSS_BATTLE_RATING_GRADES.find(g => g.grade === grade)?.name || '待提升';
}

export function dimensionLabel(key: BossRatingDimensionKey): string {
  switch (key) {
    case 'survival': return '生存表现';
    case 'challenge': return '代码挑战';
    case 'tactics': return '战术操作';
    case 'weakness': return '弱点破解';
    case 'crisis': return '危机处理';
  }
}
