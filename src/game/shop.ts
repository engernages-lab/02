// NEXUS 兑换中心 · 统一商品目录（A5）
//
// 约定：
//   1. 商品数据只在这里定义，页面不得硬编码价格/效果；
//   2. category 保留旧的 look/tool/special 分组（兼容旧测试与旧存档文案），
//      type 是 A5 的六类展示分组：防御 / 能量 / 经验 / 技能 / 外观 / 特殊；
//   3. 购买与使用只传 itemId + 数量，价格与效果一律从这里读取（前端无法改价）。

export type LegacyCategory = 'look' | 'tool' | 'special';
export type ShopCategory = 'defense' | 'energy' | 'exp' | 'skill' | 'look' | 'special';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemKind = 'consumable' | 'permanent' | 'equipment' | 'boost';
export type BuffKind = 'shield' | 'guard' | 'barrier' | 'expBoost' | 'hintTicket';
export type EquipSlot = 'terminal' | 'particles' | 'title' | 'avatarFrame' | 'login' | 'bg';

export interface BuffGrant {
  kind: BuffKind;
  /** 叠加次数（护盾/护符/护罩/提示券） */
  amount?: number;
  /** 经验倍率（expBoost 专用） */
  mult?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** 兼容旧分组 */
  category: LegacyCategory;
  /** A5 六类分组 */
  type: ShopCategory;
  price: number;
  rarity: Rarity;
  kind: ItemKind;
  /** 实际功能说明（详情页展示） */
  effect: string;
  unique?: boolean;
  /** 每次购买获得的库存数量 */
  count?: number;
  slot?: EquipSlot;
  /** 永久解锁标记（写入 progress.flags） */
  flag?: string;
  usable?: boolean;
  equippable?: boolean;
  permanent?: boolean;
  /** 限购数量（不填：永久 1 / 消耗品 99） */
  maxOwn?: number;
  /** 是否上架 */
  listed?: boolean;
  /** 购买后额外发放 */
  grants?: { buff?: BuffGrant; items?: Record<string, number> };
}

export const RARITY_META: Record<Rarity, { name: string; color: string }> = {
  common: { name: '普通', color: '#8FB0C9' },
  rare: { name: '稀有', color: '#42D6D0' },
  epic: { name: '史诗', color: '#B08CFF' },
  legendary: { name: '传说', color: '#F3B75C' },
};

export const CATEGORY_META: { id: ShopCategory; name: string; icon: string }[] = [
  { id: 'defense', name: '防御道具', icon: '⛨' },
  { id: 'energy', name: '能量补给', icon: '✚' },
  { id: 'exp', name: '经验增幅', icon: '↑' },
  { id: 'skill', name: '技能强化', icon: '⌖' },
  { id: 'look', name: '外观装饰', icon: '▤' },
  { id: 'special', name: '特殊物品', icon: '✦' },
];

export const SHOP_ITEMS: ShopItem[] = [
  // ---------- 防御道具 ----------
  {
    id: 'shield-core', name: '护盾核心', icon: '⛨', category: 'tool', type: 'defense',
    price: 60, rarity: 'rare', kind: 'consumable', usable: true, maxOwn: 5,
    desc: '一次性力场：下一次纠错者攻击会被自动拦截。',
    effect: '使用后获得 1 层护盾。失误超过容错触发攻击时，护盾自动生效，判定为防御成功并清零本关失误计数。',
    grants: { buff: { kind: 'shield', amount: 1 } },
  },
  {
    id: 'guard-charm', name: '容错护符', icon: '◈', category: 'tool', type: 'defense',
    price: 95, rarity: 'epic', kind: 'consumable', usable: true, maxOwn: 3,
    desc: '在容错耗尽的那一刻替你挡下一次攻击。',
    effect: '使用后获得 1 层护符。失误超过容错上限时自动消耗，挡住这一次攻击并把本关失误计数清零（不改变容错上限）。',
    grants: { buff: { kind: 'guard', amount: 1 } },
  },
  {
    id: 'mental-barrier', name: '意识护罩', icon: '◍', category: 'tool', type: 'defense',
    price: 75, rarity: 'rare', kind: 'consumable', usable: true, maxOwn: 3,
    desc: '把一次意识冲击的伤害减半。',
    effect: '使用后获得 1 层护罩。下一次意识损失（防御失败或 Boss 反击）减半，随后消耗。',
    grants: { buff: { kind: 'barrier', amount: 1 } },
  },

  // ---------- 能量补给 ----------
  {
    id: 'stabilizer', name: '意识稳定模块', icon: '✚', category: 'tool', type: 'energy',
    price: 70, rarity: 'common', kind: 'consumable', usable: true, count: 1, maxOwn: 10,
    desc: '恢复 10 点意识值（不超过上限）。',
    effect: '立即恢复 10 点意识完整度，最高 100；意识已满时无法使用。',
  },
  {
    id: 'nano-restore', name: '纳米修复液', icon: '✚', category: 'tool', type: 'energy',
    price: 140, rarity: 'rare', kind: 'consumable', usable: true, count: 1, maxOwn: 5,
    desc: '恢复 30 点意识值（不超过上限）。',
    effect: '立即恢复 30 点意识完整度，最高 100；意识已满时无法使用。',
  },

  // ---------- 经验增幅 ----------
  {
    id: 'exp-boost', name: '经验增幅器', icon: '↑', category: 'tool', type: 'exp',
    price: 150, rarity: 'rare', kind: 'boost', usable: true, count: 1, maxOwn: 3,
    desc: '下一次通关经验 +50%，最多叠加 3 次。',
    effect: '使用后激活 1 次增幅：下一次首次通关结算经验 ×1.5。最多同时持有 3 次，不与其他增幅叠乘。',
    grants: { buff: { kind: 'expBoost', amount: 1, mult: 1.5 } },
  },

  // ---------- 技能强化 ----------
  {
    id: 'scan', name: '错误定位扫描器', icon: '⌖', category: 'tool', type: 'skill',
    price: 50, rarity: 'common', kind: 'consumable', usable: true, count: 1, maxOwn: 20,
    desc: '在编辑器中标出最可能出错的行范围（不直接给答案）。',
    effect: '挑战页「扫描器」按钮消耗 1 个，高亮最可能出错的行；不影响判题。',
  },
  {
    id: 'rollback', name: '数据回滚模块', icon: '↺', category: 'tool', type: 'skill',
    price: 40, rarity: 'common', kind: 'consumable', usable: true, count: 1, maxOwn: 20,
    desc: '把编辑器恢复到本次修改前的状态。',
    effect: '挑战页「回滚」按钮消耗 1 个，恢复上一份代码快照；不影响判题。',
  },
  {
    id: 'hint-ticket', name: '提示券', icon: '◇', category: 'tool', type: 'skill',
    price: 55, rarity: 'rare', kind: 'consumable', usable: true, count: 1, maxOwn: 5,
    desc: '免费获得一层 MIRA 提示，不增加本关提示使用次数。',
    effect: '使用后获得 1 张提示券。挑战页请求提示时优先消耗提示券，不计入本关提示层数（保护评级）。',
    grants: { buff: { kind: 'hintTicket', amount: 1 } },
  },

  // ---------- 外观装饰 ----------
  { id: 'terminal-neon', name: '终端主题 · 霓虹脉冲', category: 'look', type: 'look', price: 80, rarity: 'rare', kind: 'equipment', equippable: true, unique: true, slot: 'terminal', icon: '▤', desc: '高对比度的青紫配色，代码看起来更锋利。', effect: '装备后改变代码终端配色，立即生效并保存。' },
  { id: 'terminal-deep', name: '终端主题 · 深海回路', category: 'look', type: 'look', price: 90, rarity: 'rare', kind: 'equipment', equippable: true, unique: true, slot: 'terminal', icon: '▥', desc: 'MIRA 调制：低亮度蓝绿，久看不累。', effect: '装备后改变代码终端配色，立即生效并保存。' },
  { id: 'particles-net', name: '粒子背景 · 数据流', category: 'look', type: 'look', price: 120, rarity: 'epic', kind: 'equipment', equippable: true, unique: true, slot: 'particles', icon: '✧', desc: '背景漂浮着缓慢流动的绿色数据点。', effect: '装备后在地图与档案页显示数据流粒子背景。' },
  { id: 'title-junior', name: '称号 · 初级修复师', category: 'look', type: 'look', price: 60, rarity: 'common', kind: 'equipment', equippable: true, unique: true, slot: 'title', icon: '◈', desc: '在玩家档案与状态卡显示。', effect: '装备后在档案与 HUD 显示该称号。' },
  { id: 'title-successor', name: '称号 · 原初继承者', category: 'look', type: 'look', price: 260, rarity: 'legendary', kind: 'equipment', equippable: true, unique: true, slot: 'title', icon: '✦', desc: '创世主遗留的最终称谓。', effect: '装备后在档案与 HUD 显示该称号。' },
  { id: 'login-gold', name: '登录界面 · 黄金协议', category: 'look', type: 'look', price: 150, rarity: 'epic', kind: 'equipment', equippable: true, unique: true, slot: 'login', icon: '⧉', desc: '启动页换成金色协议风格。', effect: '装备后启动页使用黄金协议视觉。' },
  { id: 'bg-ark', name: '数字世界背景 · 方舟核心', category: 'look', type: 'look', price: 200, rarity: 'legendary', kind: 'equipment', equippable: true, unique: true, slot: 'bg', icon: '◉', desc: '地图背景换成核心机房的发光脉络。', effect: '装备后地图背景切换为方舟核心。' },
  { id: 'frame-bronze', name: '头像框 · 青铜回路', category: 'look', type: 'look', price: 70, rarity: 'common', kind: 'equipment', equippable: true, unique: true, slot: 'avatarFrame', icon: '◯', desc: '档案页与状态卡的 R-07 头像外框。', effect: '装备后头像显示青铜回路边框。' },
  { id: 'frame-neon', name: '头像框 · 霓虹脉冲', category: 'look', type: 'look', price: 130, rarity: 'rare', kind: 'equipment', equippable: true, unique: true, slot: 'avatarFrame', icon: '◎', desc: '青紫脉冲边框，会随意识值呼吸。', effect: '装备后头像显示霓虹脉冲边框。' },

  // ---------- 特殊物品 ----------
  { id: 'decoder', name: '记忆解码器', icon: '✦', category: 'tool', type: 'special', price: 90, rarity: 'rare', kind: 'consumable', usable: true, count: 1, maxOwn: 10, desc: '解锁一份尚未收集的记忆档案（不影响关卡判题）。', effect: '在「记忆档案」中消耗 1 个，直接解锁并阅读指定档案。' },
  { id: 'mira-talk', name: 'MIRA 专属对话', icon: '◍', category: 'special', type: 'special', price: 100, rarity: 'epic', kind: 'permanent', unique: true, permanent: true, flag: 'miraExtraTalk', desc: '解锁一段 MIRA 的额外对话（信任度相关）。', effect: '永久解锁：档案页 MIRA 会多出一段关于自己的对话。' },
  { id: 'archive-secret', name: '特殊剧情档案', icon: '▣', category: 'special', type: 'special', price: 120, rarity: 'epic', kind: 'permanent', unique: true, permanent: true, flag: 'secretArchive', desc: '解锁「五年前事故」的机密档案条目。', effect: '永久解锁：记忆档案中出现「五年前事故」机密条目。' },
  { id: 'fx-repair', name: '修复特效 · 数据重构', icon: '✺', category: 'special', type: 'special', price: 140, rarity: 'epic', kind: 'permanent', unique: true, permanent: true, flag: 'fxRepair', desc: '通关结算时播放额外的数据重构光效。', effect: '永久生效：通关结算面板附加数据重构光效。' },
];

export const shopItemById = (id: string): ShopItem | undefined => SHOP_ITEMS.find(i => i.id === id);

export const listedItems = (): ShopItem[] => SHOP_ITEMS.filter(i => i.listed !== false);

export function maxOwnOf(item: ShopItem): number {
  if (typeof item.maxOwn === 'number') return item.maxOwn;
  return item.kind === 'consumable' ? 99 : 1;
}

/** 购买状态：供详情页与卡片按钮统一使用 */
export type BuyState = 'buy' | 'insufficient' | 'owned' | 'limit' | 'offline';

export function buyStateOf(item: ShopItem, ctx: {
  credits: number;
  purchases: number;
  ownedSkins: string[];
  flags: Record<string, boolean | number>;
  /** 本次准备购买的数量（决定总价与限购判断） */
  qty?: number;
}): BuyState {
  if (item.listed === false) return 'offline';
  if (item.unique) {
    const owned = ctx.ownedSkins.includes(item.id) || (!!item.flag && ctx.flags[item.flag] === true);
    if (owned) return 'owned';
  }
  const qty = Math.max(1, Math.min(99, Math.floor(Number(ctx.qty) || 1)));
  if (ctx.purchases >= maxOwnOf(item)) return 'limit';
  if (ctx.purchases + qty > maxOwnOf(item)) return 'limit';
  if (ctx.credits < item.price * qty) return 'insufficient';
  return 'buy';
}

export const BUY_STATE_TEXT: Record<BuyState, string> = {
  buy: '购买',
  insufficient: '余额不足',
  owned: '已拥有',
  limit: '已达购买上限',
  offline: '暂未开放',
};

/** 经验增幅的叠加上限（配置上限，不允许无限堆叠） */
export const EXP_BOOST_MAX_USES = 3;
export const EXP_BOOST_MULT = 1.5;

// ---------- 交易记录 / 玩家增益状态 ----------

export interface ShopTransaction {
  id: string;
  requestId: string;
  itemId: string;
  itemName: string;
  at: number;
  qty: number;
  unitPrice: number;
  total: number;
  status: 'ok' | 'failed';
  reason?: string;
}

export interface RewardBuffs {
  shield: number;
  guard: number;
  barrier: number;
  hintTicket: number;
  expBoost: { uses: number; mult: number } | null;
}

export const defaultBuffs = (): RewardBuffs => ({ shield: 0, guard: 0, barrier: 0, hintTicket: 0, expBoost: null });

export const MAX_BUFF_CHARGES = 3;
export const MAX_TRANSACTIONS = 30;
