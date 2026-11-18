// NEXUS 奖励系统：修复贡献点 / MIRA 信任度 / 关卡评级 / 兑换中心 / 章节奖励
// 与经验等级、成就、知识卡、意识值、剧情进度并行，互不覆盖（旧的 exp/level 逻辑完全保留）。

import {
  SHOP_ITEMS, shopItemById, defaultBuffs, MAX_TRANSACTIONS, MAX_BUFF_CHARGES, EXP_BOOST_MAX_USES, EXP_BOOST_MULT,
  type ShopItem, type ShopTransaction, type RewardBuffs,
} from './shop';
import { normalizeLedger, safeCredits, type RewardLedgerEntry } from './economyConfig';

export { SHOP_ITEMS, shopItemById };
export type { ShopItem, ShopTransaction, RewardBuffs };

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
  /** 已获得的难度徽章 id（困难 / 专家，一次性） */
  badges?: string[];
  /** 已发放的难度一次性奖励 key（bossId + difficulty，防刷） */
  difficultyRewards?: string[];
  /** 交易记录（A5，最近 MAX_TRANSACTIONS 条） */
  transactions?: ShopTransaction[];
  /** 每种商品已购买数量（A5，限购依据） */
  purchases?: Record<string, number>;
  /** 道具增益（A5：护盾/护符/护罩/提示券/经验增幅） */
  buffs?: RewardBuffs;
  /** 奖励账本（A6：每次入账的唯一流水，可追溯） */
  ledger?: RewardLedgerEntry[];
}

export function defaultRewards(): NormalizedRewards {
  return {
    credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [],
    bossRewards: [], unlocks: [], badges: [], difficultyRewards: [],
    transactions: [], purchases: {}, buffs: defaultBuffs(), ledger: [],
  };
}

/** 规范化后的奖励状态：A5 字段保证存在，调用方无需再做空判断 */
export type NormalizedRewards = RewardState & {
  transactions: ShopTransaction[];
  purchases: Record<string, number>;
  buffs: RewardBuffs;
};

/** 兼容旧存档：缺失字段逐一补齐（不覆盖已有值） */
export function normalizeRewards(raw: unknown): NormalizedRewards {
  const d = defaultRewards();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<RewardState>;
  return {
    credits: safeCredits(r.credits),
    trust: typeof r.trust === 'number' && isFinite(r.trust) ? Math.min(100, Math.max(0, Math.round(r.trust))) : d.trust,
    items: normalizeItemCounts(r.items),
    skins: [...new Set(Array.isArray(r.skins) ? r.skins.filter((x): x is string => typeof x === 'string' && x.length > 0) : [])],
    equipped: r.equipped && typeof r.equipped === 'object' ? { ...r.equipped } : {},
    chapterRewards: Array.isArray(r.chapterRewards) ? r.chapterRewards.slice() : [],
    cleared: r.cleared && typeof r.cleared === 'object' ? { ...r.cleared } : {},
    archiveRead: Array.isArray(r.archiveRead) ? r.archiveRead.slice() : [],
    bossRewards: Array.isArray(r.bossRewards) ? r.bossRewards.slice() : [],
    unlocks: Array.isArray(r.unlocks) ? r.unlocks.slice() : [],
    badges: Array.isArray(r.badges) ? r.badges.slice() : [],
    difficultyRewards: Array.isArray(r.difficultyRewards) ? r.difficultyRewards.slice() : [],
    transactions: normalizeTransactions(r.transactions),
    purchases: normalizePurchases(r.purchases),
    buffs: normalizeBuffs(r.buffs),
    ledger: normalizeLedger(r.ledger),
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

// ---------- A5：交易记录 / 限购计数 / 增益状态 ----------

/** 库存：非负整数，去掉非法与 0 */
function normalizeItemCounts(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Math.floor(Number(value));
    if (!id || !Number.isFinite(n) || n <= 0) continue;
    out[id.slice(0, 64)] = Math.min(9999, n);
  }
  return out;
}

function normalizeTransactions(raw: unknown): ShopTransaction[] {
  if (!Array.isArray(raw)) return [];
  const out: ShopTransaction[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;
    const x = t as Partial<ShopTransaction>;
    if (typeof x.itemId !== 'string' || !x.itemId) continue;
    if (x.status !== 'ok' && x.status !== 'failed') continue;
    const status = x.status;
    out.push({
      id: typeof x.id === 'string' ? x.id : 'tx-' + Math.max(0, Number(x.at) || 0),
      requestId: typeof x.requestId === 'string' ? x.requestId : '',
      itemId: x.itemId,
      itemName: typeof x.itemName === 'string' ? x.itemName : x.itemId,
      at: Number.isFinite(Number(x.at)) ? Math.max(0, Math.floor(Number(x.at))) : 0,
      qty: Math.max(1, Math.min(99, Math.floor(Number(x.qty) || 1))),
      unitPrice: Math.max(0, Math.floor(Number(x.unitPrice) || 0)),
      total: Math.max(0, Math.floor(Number(x.total) || 0)),
      status,
      reason: typeof x.reason === 'string' ? x.reason : undefined,
    });
  }
  return out.slice(-MAX_TRANSACTIONS);
}

function normalizePurchases(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Math.floor(Number(v));
    if (k && Number.isFinite(n) && n > 0) out[k] = Math.min(999, n);
  }
  return out;
}

function normalizeBuffs(raw: unknown): RewardBuffs {
  const d = defaultBuffs();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<RewardBuffs>;
  const charge = (v: unknown) => Math.max(0, Math.min(MAX_BUFF_CHARGES, Math.floor(Number(v) || 0)));
  const boost = r.expBoost;
  const uses = boost && typeof boost === 'object' ? Math.max(0, Math.min(EXP_BOOST_MAX_USES, Math.floor(Number(boost.uses) || 0))) : 0;
  const mult = boost && typeof boost === 'object' && Number.isFinite(Number(boost.mult)) ? Number(boost.mult) : EXP_BOOST_MULT;
  return {
    shield: charge(r.shield),
    guard: charge(r.guard),
    barrier: charge(r.barrier),
    hintTicket: charge(r.hintTicket),
    // 倍率不合法（≤1 或非数字）的增幅直接丢弃，避免出现「吃了增幅却没加成」
    expBoost: uses > 0 && mult > 1 ? { uses, mult } : null,
  };
}
