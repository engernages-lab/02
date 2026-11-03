// 等级 / 经验 / 称号 / 容错规则
// 累计经验阈值：达到 LEVEL_XP[i] 即升为 Lv.(i+1)
export const LEVEL_XP = [0, 100, 260, 470, 730, 1040, 1400, 1810, 2270, 2780];

export const TITLES = [
  '见习硅灵', '初级硅灵', '初级代码修复师', '正式修复师', '中级修复师',
  '高级修复师', '精英诊断员', '首席修复工程师', '核心守护者', '原初继承者'
];

export const MAX_LEVEL = 10;

export function expForLevel(lv: number): number {
  const i = Math.min(Math.max(1, Math.round(lv)), MAX_LEVEL) - 1;
  return LEVEL_XP[i];
}

export function levelForExp(exp: number): number {
  let lv = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (exp >= LEVEL_XP[i]) lv = i + 1; else break;
  }
  return Math.min(lv, MAX_LEVEL);
}

export function titleForLevel(lv: number): string {
  return TITLES[Math.min(Math.max(1, Math.round(lv)), MAX_LEVEL) - 1];
}

/** 等级对应的最大容错次数：Lv1-2:3 / Lv3-4:4 / Lv5-6:5 / Lv7-8:6 / Lv9-10:7 */
export function toleranceFor(level: number): number {
  return Math.min(7, 3 + Math.floor((Math.min(Math.round(level), 10) - 1) / 2));
}

/** 经验条里程碑 */
export function milestone(exp: number): { level: number; into: number; need: number; maxed: boolean } {
  const level = levelForExp(exp);
  const prev = expForLevel(level);
  if (level >= MAX_LEVEL) return { level, into: 0, need: 0, maxed: true };
  const next = expForLevel(level + 1);
  return { level, into: exp - prev, need: next - prev, maxed: false };
}
