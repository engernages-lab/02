// Boss 三档难度：EASY / HARD / EXPERT
// 难度差异体现在「真实 Python 题目内容」（代码、考点、测试、边界、提示），
// 不是血量 / 扣血 / 错误次数的数值堆叠。
export type BossDifficulty = 'easy' | 'hard' | 'expert';

export interface BossDifficultyMeta {
  id: BossDifficulty;
  label: string;
  cn: string;
  color: string;
  /** 视觉层次用的色板 */
  accent: string;
  tagline: string;
  description: string;
  knowledgeScope: string;
  hintRule: string;
  rewardNote: string;
  /** 首次进入时的推荐难度 */
  recommended: boolean;
}

export const BOSS_DIFFICULTIES: BossDifficultyMeta[] = [
  {
    id: 'easy',
    label: 'EASY',
    cn: '简单',
    color: '#35D39A',
    accent: 'rgba(53,211,154,0.18)',
    tagline: '初次挑战 · 基础知识点',
    description: '主要使用本章基础 Python 知识；每个阶段 1–2 个主要错误，错误位置容易分析，提供完整分层提示。',
    knowledgeScope: '本章基础知识点 + 已学内容',
    hintRule: '完整三层提示：现象 → 定位方向 → 具体修复点',
    rewardNote: '基础经验 / 基础贡献点 / 正常创世主碎片',
    recommended: true,
  },
  {
    id: 'hard',
    label: 'HARD',
    cn: '困难',
    color: '#F3B75C',
    accent: 'rgba(243,183,92,0.18)',
    tagline: '熟练修复师 · 综合运用',
    description: '综合本章与之前已学知识；每个阶段多个相互关联的错误，需要分析执行顺序、处理复杂输入与边界。',
    knowledgeScope: '累计已学知识点（本章 + 前章）',
    hintRule: '减少直接定位：只给现象与思路方向',
    rewardNote: '额外经验 / 更多贡献点 / 困难徽章',
    recommended: false,
  },
  {
    id: 'expert',
    label: 'EXPERT',
    cn: '专家',
    color: '#C9A7FF',
    accent: 'rgba(201,167,255,0.18)',
    tagline: '独立调试 · 全知识域综合',
    description: '综合全部已学知识；多函数/多模块关联、多处相互影响的逻辑错误、隐藏边界输入，需要独立分析与完整通过测试。',
    knowledgeScope: '全部已学知识点（严格不超纲）',
    hintRule: '仅给有限思路提示，不直接定位到行',
    rewardNote: '较高经验 / 较高贡献点 / 专家徽章 + 专属称号',
    recommended: false,
  },
];

export const DIFFICULTY_ORDER: BossDifficulty[] = ['easy', 'hard', 'expert'];

export const DIFFICULTY_RANK: Record<BossDifficulty, number> = { easy: 1, hard: 2, expert: 3 };

export function difficultyOf(raw: unknown): BossDifficulty {
  return raw === 'hard' || raw === 'expert' ? raw : 'easy';
}

export function difficultyMeta(id: BossDifficulty): BossDifficultyMeta {
  return BOSS_DIFFICULTIES.find(d => d.id === id) || BOSS_DIFFICULTIES[0];
}

export function difficultyRank(id: BossDifficulty): number {
  return DIFFICULTY_RANK[id] || 1;
}

/** 取两者中更高的难度（用于最高成绩记录） */
export function bestDifficultyOf(a: BossDifficulty | null | undefined, b: BossDifficulty | null | undefined): BossDifficulty | null {
  if (!a) return b || null;
  if (!b) return a;
  return difficultyRank(a) >= difficultyRank(b) ? a : b;
}
