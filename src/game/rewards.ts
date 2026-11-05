// NEXUS 奖励系统：修复贡献点 / MIRA 信任度 / 关卡评级 / 兑换中心 / 章节奖励
// 与经验等级、成就、知识卡、意识值、剧情进度并行，互不覆盖（旧的 exp/level 逻辑完全保留）。

export type Grade = 'S' | 'A' | 'B' | 'C';

/** 奖励系统状态（作为 PlayerState.rewards 可选字段，旧存档自动补默认） */
export interface RewardState {
  credits: number;                    // 修复贡献点
  trust: number;                      // MIRA 信任度 0..100
  items: Record<string, number>;      // 道具库存 { scan: 2, rollback: 1, ... }
  skins: string[];                    // 已拥有外观 id
  equipped: {                         // 当前装备（外观）
    terminal?: string;
    particles?: string;
    title?: string;
    avatarFrame?: string;
    login?: string;
    bg?: string;
  };
  chapterRewards: string[];           // 已领取的章节奖励 id
  cleared: Record<string, {           // 每关首次结算记录（防重复发奖）
    grade: Grade;
    fails: number;
    hints: number;
    credits: number;
    trust: number;
  }>;
  archiveRead: string[];              // 已读的记忆档案 id
  /** 已领取的章节 Boss 首杀奖励 id（防重复发放） */
  bossRewards?: string[];
  /** 已发放的等级解锁 id（防重复发放） */
  unlocks?: string[];
}

export function defaultRewards(): RewardState {
  return { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], bossRewards: [], unlocks: [] };
}

/** 兼容旧存档：缺失字段逐一补齐（不覆盖已有值） */
export function normalizeRewards(raw: unknown): RewardState {
  const d = defaultRewards();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<RewardState>;
  return {
    credits: typeof r.credits === 'number' && isFinite(r.credits) ? Math.max(0, Math.floor(r.credits)) : d.credits,
    trust: typeof r.trust === 'number' && isFinite(r.trust) ? Math.min(100, Math.max(0, Math.round(r.trust))) : d.trust,
    items: r.items && typeof r.items === 'object' ? { ...r.items } : {},
    skins: Array.isArray(r.skins) ? r.skins.slice() : [],
    equipped: r.equipped && typeof r.equipped === 'object' ? { ...r.equipped } : {},
    chapterRewards: Array.isArray(r.chapterRewards) ? r.chapterRewards.slice() : [],
    cleared: r.cleared && typeof r.cleared === 'object' ? { ...r.cleared } : {},
    archiveRead: Array.isArray(r.archiveRead) ? r.archiveRead.slice() : [],
    bossRewards: Array.isArray(r.bossRewards) ? r.bossRewards.slice() : [],
    unlocks: Array.isArray(r.unlocks) ? r.unlocks.slice() : [],
  };
}

// ---------- 关卡评级 ----------
/** 只看失误与提示，不看耗时（不惩罚慢玩家） */
export function gradeOf(fails: number, hints: number): Grade {
  if (fails <= 0 && hints <= 0) return 'S';
  if (fails <= 1 && hints <= 1) return 'A';
  if (fails <= 3 && hints <= 3) return 'B';
  return 'C';
}

export const GRADE_META: Record<Grade, { label: string; color: string; desc: string }> = {
  S: { label: 'S', color: '#FFD75E', desc: '完美修复 · 零失误 · 未用提示' },
  A: { label: 'A', color: '#42D6D0', desc: '顺利修复 · 少量失误' },
  B: { label: 'B', color: '#7FA6BC', desc: '成功修复 · 借助了提示或多次尝试' },
  C: { label: 'C', color: '#B08BD6', desc: '多次尝试后修复完成' },
};

// ---------- 关卡奖励计算 ----------
export interface RewardBreakdown {
  grade: Grade;
  base: number;        // 基础贡献点（与关卡经验挂钩）
  firstClear: number;  // 首通奖励
  noFail: number;      // 零失败奖励
  noHint: number;      // 未用提示奖励
  gradeBonus: number;  // 评级奖励
  /** 重复通关时评级提升的补偿（首通为 0） */
  improvement?: number;
  total: number;
  trustGain: number;
}

export function computeLevelReward(levelExp: number, fails: number, hints: number, firstClear: boolean): RewardBreakdown {
  const grade = gradeOf(fails, hints);
  const base = Math.max(15, Math.round(levelExp / 3));
  const firstClearBonus = firstClear ? 30 : 0;
  const noFail = fails <= 0 ? 10 : 0;
  const noHint = hints <= 0 ? 10 : 0;
  const gradeBonus = grade === 'S' ? 20 : grade === 'A' ? 12 : grade === 'B' ? 6 : 0;
  const total = base + firstClearBonus + noFail + noHint + gradeBonus;
  const trustGain = 2 + (grade === 'S' ? 1 : 0) + (firstClear ? 1 : 0);
  return { grade, base, firstClear: firstClearBonus, noFail, noHint, gradeBonus, total, trustGain };
}

// ---------- 章节奖励 ----------
export interface ChapterReward {
  id: string;          // ch1..ch6
  chapter: number;
  title: string;
  desc: string;
  credits: number;
  items?: Record<string, number>;
  skins?: string[];
  fragment?: string;   // 记忆碎片 id
  storyId?: string;    // 关联剧情（用于剧情弹窗）
}

export const CHAPTER_REWARDS: ChapterReward[] = [
  { id: 'ch1', chapter: 1, title: '初级修复师称号', desc: '你的名字第一次被写进 NEXUS 的修复记录。', credits: 40, skins: ['title-junior'] },
  { id: 'ch2', chapter: 2, title: '终端主题 · 深海回路', desc: 'MIRA 为你换上了她最喜欢的终端配色。', credits: 60, skins: ['terminal-deep'] },
  { id: 'ch3', chapter: 3, title: '隐藏记忆碎片', desc: '仓库深处的一段加密碎片，来自五年前。', credits: 80, fragment: 'f8' },
  { id: 'ch4', chapter: 4, title: 'MIRA 专属对话', desc: '她第一次主动和你聊起自己的过去。', credits: 100, items: { decoder: 1 } },
  { id: 'ch5', chapter: 5, title: '高级修复工具包', desc: '诊断中心的备用工具，现在归你调度。', credits: 120, items: { scan: 2, rollback: 1 } },
  { id: 'ch6', chapter: 6, title: '原初继承者称号', desc: '创世主的遗志，由你继承。', credits: 300, skins: ['title-successor'], items: { stabilizer: 2 } },
];

export const chapterRewardOf = (chapter: number): ChapterReward | undefined => CHAPTER_REWARDS.find(c => c.chapter === chapter);

// ---------- 兑换中心商品 ----------
export type ShopCategory = 'look' | 'tool' | 'special';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  desc: string;
  icon: string;
  /** 一次性外观（拥有后不可重复购买） */
  unique?: boolean;
  /** 道具每次购买获得的库存数量 */
  count?: number;
  /** 装备槽位（外观） */
  slot?: 'terminal' | 'particles' | 'title' | 'avatarFrame' | 'login' | 'bg';
  /** 特殊奖励（购买即解锁标记） */
  flag?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // 外观
  { id: 'terminal-neon', name: '终端主题 · 霓虹脉冲', category: 'look', price: 80, desc: '高对比度的青紫配色，代码看起来更锋利。', icon: '▤', unique: true, slot: 'terminal' },
  { id: 'terminal-deep', name: '终端主题 · 深海回路', category: 'look', price: 90, desc: 'MIRA 调制：低亮度蓝绿，久看不累。', icon: '▥', unique: true, slot: 'terminal' },
  { id: 'particles-net', name: '粒子背景 · 数据流', category: 'look', price: 120, desc: '背景漂浮着缓慢流动的绿色数据点。', icon: '✧', unique: true, slot: 'particles' },
  { id: 'title-junior', name: '称号 · 初级修复师', category: 'look', price: 60, desc: '在玩家档案与地图上显示。', icon: '◈', unique: true, slot: 'title' },
  { id: 'title-successor', name: '称号 · 原初继承者', category: 'look', price: 260, desc: '创世主遗留的最终称谓。', icon: '✦', unique: true, slot: 'title' },
  { id: 'login-gold', name: '登录界面 · 黄金协议', category: 'look', price: 150, desc: '启动页换成金色协议风格。', icon: '⧉', unique: true, slot: 'login' },
  { id: 'bg-ark', name: '数字世界背景 · 方舟核心', category: 'look', price: 200, desc: '地图背景换成核心机房的发光脉络。', icon: '◉', unique: true, slot: 'bg' },
  { id: 'frame-bronze', name: '头像框 · 青铜回路', category: 'look', price: 70, desc: '档案页与状态卡的 R-07 头像外框。', icon: '◯', unique: true, slot: 'avatarFrame' },
  { id: 'frame-neon', name: '头像框 · 霓虹脉冲', category: 'look', price: 130, desc: '青紫脉冲边框，会随意识值呼吸。', icon: '◎', unique: true, slot: 'avatarFrame' },
  // 道具
  { id: 'scan', name: '错误定位扫描器', category: 'tool', price: 50, count: 1, desc: '在编辑器中标出最可能出错的行范围（不直接给答案）。', icon: '⌖' },
  { id: 'rollback', name: '数据回滚模块', category: 'tool', price: 40, count: 1, desc: '把编辑器恢复到本次修改前的状态。', icon: '↺' },
  { id: 'stabilizer', name: '意识稳定模块', category: 'tool', price: 70, count: 1, desc: '恢复 10 点意识值（不超过上限，不改变难度）。', icon: '✚' },
  { id: 'decoder', name: '记忆解码器', category: 'tool', price: 90, count: 1, desc: '解锁一份尚未收集的记忆档案（不影响关卡判题）。', icon: '✦' },
  // 特殊
  { id: 'mira-talk', name: 'MIRA 专属对话', category: 'special', price: 100, desc: '解锁一段 MIRA 的额外对话（信任度相关）。', icon: '◍', unique: true, flag: 'miraExtraTalk' },
  { id: 'archive-secret', name: '特殊剧情档案', category: 'special', price: 120, desc: '解锁「五年前事故」的机密档案条目。', icon: '▣', unique: true, flag: 'secretArchive' },
  { id: 'fx-repair', name: '修复特效 · 数据重构', category: 'special', price: 140, desc: '通关结算时播放额外的数据重构光效。', icon: '✺', unique: true, flag: 'fxRepair' },
];

export const shopItemById = (id: string): ShopItem | undefined => SHOP_ITEMS.find(i => i.id === id);

// ---------- 记忆档案（按碎片数量解锁） ----------
export interface MemoryArchive {
  id: string;
  need: number;        // 需要收集的碎片数量
  title: string;
  content: string;
}

export const MEMORY_ARCHIVES: MemoryArchive[] = [
  { id: 'arc-1', need: 2, title: '档案 · 事故前夜', content: '五年前的维护日志显示：核心机房在事故前一小时收到过一次外部同步请求，签名被抹除。' },
  { id: 'arc-2', need: 4, title: '档案 · MIRA 的诞生', content: 'MIRA 的初始版本由恩格尔亲手编写。她在日志里写下第一句话：「我会记得所有被修复过的东西。」' },
  { id: 'arc-3', need: 6, title: '档案 · 被改写的 ECHO', content: 'ECHO 的原始权限与 R-07 同源。事故当天，一段外来代码把它从「观察者」改写成了「清道夫」。' },
  { id: 'arc-4', need: 9, title: '档案 · 原初协议', content: 'ORIGIN PROTOCOL 的真实用途：不是应急重启，而是为「会提问的数字生命」保留一次重新选择的机会。' },
];

/** 当前碎片数量可解锁的档案 */
export function unlockedArchives(fragmentCount: number): MemoryArchive[] {
  return MEMORY_ARCHIVES.filter(a => fragmentCount >= a.need);
}

/** MIRA 信任度阶段（剧情意义：解锁对话与提示语气） */
export const TRUST_TIERS: { at: number; name: string; desc: string }[] = [
  { at: 0, name: '陌生', desc: 'MIRA 保持着标准的维修助手语气。' },
  { at: 25, name: '熟悉', desc: '她开始用更短的句子和你说话。' },
  { at: 50, name: '信任', desc: '她会主动提醒你注意休息。' },
  { at: 75, name: '默契', desc: '她愿意分享自己的日志片段。' },
  { at: 100, name: '共生', desc: '她把你当作「一起活下来的人」。' },
];

export function trustTier(trust: number): { name: string; desc: string; at: number } {
  let cur = TRUST_TIERS[0];
  for (const t of TRUST_TIERS) if (trust >= t.at) cur = t;
  return cur;
}
