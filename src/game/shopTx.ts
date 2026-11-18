// A5 交易与道具使用的纯逻辑层：不依赖 React / 存档 IO，便于单测与复用
//
// 所有校验都在这里重新计算：价格只来自商品目录，数量必须是 1..99 的整数，
// 请求 id 去重，扣费与发货在同一次返回值里完成（store 只负责提交一次）。

import type { PlayerState } from './types';
import { normalizeRewards } from './rewards';
import {
  shopItemById, buyStateOf, maxOwnOf, MAX_TRANSACTIONS, MAX_BUFF_CHARGES, EXP_BOOST_MAX_USES, EXP_BOOST_MULT,
  type ShopItem, type ShopTransaction, type EquipSlot,
} from './shop';

export interface TxResult {
  ok: boolean;
  reason?: string;
  /** 重复请求：没有再次扣费/发货 */
  duplicate?: boolean;
  player: PlayerState;
  transaction: ShopTransaction | null;
  charged: number;
}

export interface UseResult {
  ok: boolean;
  reason?: string;
  player: PlayerState;
  message?: string;
}

function txId(now: number, seed: number): string {
  return 'tx-' + now.toString(36) + '-' + Math.floor(seed % 1e6).toString(36).padStart(4, '0');
}

function fail(prev: PlayerState, itemId: string, itemName: string, reason: string, qty: number, unitPrice: number, now: number, requestId: string): TxResult {
  const rw = normalizeRewards(prev.rewards);
  const tx: ShopTransaction = {
    id: txId(now, Math.random() * 1e6),
    requestId: requestId || '',
    itemId, itemName, at: now, qty, unitPrice, total: 0, status: 'failed', reason,
  };
  const transactions = [...rw.transactions, tx].slice(-MAX_TRANSACTIONS);
  return {
    ok: false,
    reason,
    charged: 0,
    transaction: tx,
    player: { ...prev, rewards: { ...rw, transactions } },
  };
}

/** 统一购买事务：校验 → 扣费 → 记录 → 发货，一次返回新状态 */
export function purchaseItem(prev: PlayerState, itemId: string, qtyRaw: number, requestId: string, now: number = Date.now()): TxResult {
  const item: ShopItem | undefined = shopItemById(itemId);
  if (!item) return fail(prev, itemId || 'unknown', itemId || '未知商品', '商品不存在', 1, 0, now, requestId);

  const qty = Math.floor(Number(qtyRaw));
  if (!Number.isFinite(qty) || qty < 1) {
    return fail(prev, item.id, item.name, '购买数量无效（必须 ≥ 1）', 1, item.price, now, requestId);
  }
  if (qty > 99) {
    return fail(prev, item.id, item.name, '购买数量超出上限（单次最多 99）', 99, item.price, now, requestId);
  }
  if (!Number.isInteger(Number(qtyRaw))) {
    return fail(prev, item.id, item.name, '购买数量必须是整数', qty, item.price, now, requestId);
  }

  const rw = normalizeRewards(prev.rewards);
  // 请求去重：同一 requestId 的重复点击/重复提交不会二次扣费
  if (requestId && rw.transactions.some(t => t.requestId === requestId && t.status === 'ok')) {
    return { ok: true, duplicate: true, player: prev, transaction: null, charged: 0 };
  }

  const purchases = rw.purchases[item.id] || 0;
  const state = buyStateOf(item, {
    credits: rw.credits,
    purchases,
    ownedSkins: rw.skins,
    flags: prev.progress.flags,
  });
  if (state === 'offline') return fail(prev, item.id, item.name, '商品暂未开放', qty, item.price, now, requestId);
  if (state === 'owned') return fail(prev, item.id, item.name, '已拥有该商品', qty, item.price, now, requestId);
  if (state === 'limit') return fail(prev, item.id, item.name, '已达到购买上限（' + maxOwnOf(item) + '）', qty, item.price, now, requestId);
  if (purchases + qty > maxOwnOf(item)) {
    return fail(prev, item.id, item.name, '超出限购数量（剩余 ' + Math.max(0, maxOwnOf(item) - purchases) + '）', qty, item.price, now, requestId);
  }

  // 价格由商品目录重新计算，忽略任何前端传入金额
  const unitPrice = item.price;
  const total = unitPrice * qty;
  if (rw.credits < total) {
    return fail(prev, item.id, item.name, '贡献点不足（还差 ' + (total - rw.credits) + '）', qty, unitPrice, now, requestId);
  }

  const items = { ...rw.items };
  if (item.kind === 'consumable' || item.count) {
    items[item.id] = (items[item.id] || 0) + (item.count || 1) * qty;
  }
  const skins = item.unique ? [...new Set([...rw.skins, item.id])] : rw.skins;
  const flags = { ...prev.progress.flags };
  if (item.flag) flags[item.flag] = true;

  const tx: ShopTransaction = {
    id: txId(now, Math.random() * 1e6),
    requestId: requestId || '',
    itemId: item.id,
    itemName: item.name,
    at: now,
    qty,
    unitPrice,
    total,
    status: 'ok',
  };
  const rewards = {
    ...rw,
    credits: rw.credits - total,
    items,
    skins,
    purchases: { ...rw.purchases, [item.id]: purchases + qty },
    transactions: [...rw.transactions, tx].slice(-MAX_TRANSACTIONS),
  };

  return {
    ok: true,
    charged: total,
    transaction: tx,
    player: { ...prev, rewards, progress: { ...prev.progress, flags } },
  };
}

/** 使用消耗品：恢复意识 / 激活增益；条件不满足或数量不足会返回明确原因 */
export function useItem(prev: PlayerState, itemId: string, now: number = Date.now()): UseResult {
  const item = shopItemById(itemId);
  if (!item) return { ok: false, reason: '道具不存在', player: prev };
  const rw = normalizeRewards(prev.rewards);
  if ((rw.items[item.id] || 0) <= 0) return { ok: false, reason: '背包中没有该道具', player: prev };
  if (!item.usable) return { ok: false, reason: '该物品不能直接使用', player: prev };

  const items = { ...rw.items };
  const consume = () => { items[item.id] = Math.max(0, (items[item.id] || 0) - 1); };

  if (item.id === 'stabilizer' || item.id === 'nano-restore') {
    const amount = item.id === 'stabilizer' ? 10 : 30;
    if (prev.consciousness >= 100) return { ok: false, reason: '意识完整度已满，无需使用', player: prev };
    consume();
    const next = Math.min(100, prev.consciousness + amount);
    return {
      ok: true,
      player: { ...prev, consciousness: next, rewards: { ...rw, items } },
      message: '意识完整度 +' + (next - prev.consciousness) + '（当前 ' + next + '%）',
    };
  }

  if (item.id === 'exp-boost') {
    const cur = rw.buffs.expBoost;
    const uses = cur ? cur.uses : 0;
    if (uses >= EXP_BOOST_MAX_USES) return { ok: false, reason: '经验增幅已叠满（最多 ' + EXP_BOOST_MAX_USES + ' 次）', player: prev };
    consume();
    return {
      ok: true,
      player: {
        ...prev,
        rewards: { ...rw, items, buffs: { ...rw.buffs, expBoost: { uses: uses + 1, mult: EXP_BOOST_MULT } } },
      },
      message: '经验增幅已激活：剩余 ' + (uses + 1) + ' 次（下次通关经验 ×' + EXP_BOOST_MULT + '）',
    };
  }

  const buffField = item.grants?.buff?.kind;
  if (buffField === 'shield' || buffField === 'guard' || buffField === 'barrier' || buffField === 'hintTicket') {
    const cur = rw.buffs[buffField];
    if (cur >= MAX_BUFF_CHARGES) return { ok: false, reason: '该增益已达叠加上限（' + MAX_BUFF_CHARGES + ' 层）', player: prev };
    consume();
    const label = buffField === 'shield' ? '护盾' : buffField === 'guard' ? '容错护符' : buffField === 'barrier' ? '意识护罩' : '提示券';
    return {
      ok: true,
      player: { ...prev, rewards: { ...rw, items, buffs: { ...rw.buffs, [buffField]: cur + 1 } } },
      message: label + ' +1（当前 ' + (cur + 1) + ' 层）',
    };
  }

  if (item.id === 'scan' || item.id === 'rollback') {
    return { ok: false, reason: '请在挑战页的工具栏中使用', player: prev };
  }
  if (item.id === 'decoder') {
    return { ok: false, reason: '请在「记忆档案」中使用', player: prev };
  }
  return { ok: false, reason: '该道具没有可直接触发的效果', player: prev };
}

/** 装备外观：必须是已拥有的装备类商品 */
export function equipItemById(prev: PlayerState, itemId: string): UseResult {
  const item = shopItemById(itemId);
  if (!item || !item.slot || !item.equippable) return { ok: false, reason: '该物品不可装备', player: prev };
  const rw = normalizeRewards(prev.rewards);
  if (!rw.skins.includes(item.id)) return { ok: false, reason: '尚未拥有该外观', player: prev };
  const equipped = { ...rw.equipped, [item.slot]: item.id };
  return {
    ok: true,
    player: { ...prev, rewards: { ...rw, equipped } },
    message: '已装备：' + item.name,
  };
}

/** 卸下某个槽位 */
export function unequipSlot(prev: PlayerState, slot: EquipSlot): UseResult {
  const rw = normalizeRewards(prev.rewards);
  if (!rw.equipped[slot]) return { ok: false, reason: '该槽位没有装备', player: prev };
  const equipped = { ...rw.equipped };
  delete equipped[slot];
  return { ok: true, player: { ...prev, rewards: { ...rw, equipped } }, message: '已卸下装备' };
}

export type { EquipSlot };
