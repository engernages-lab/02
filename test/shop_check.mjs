// A5 商城纯逻辑回归：商品目录、交易原子性、限购、请求去重、道具效果、装备
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

const cache = new Map();
function load(file) {
  const abs = extname(file) ? file : existsSync(file + '.ts') ? file + '.ts' : file;
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = readFileSync(abs, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  cache.set(abs, mod);
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
  return mod.exports;
}
const L = (rel) => load(join(root, rel));

const S = L('src/game/shop.ts');
const TX = L('src/game/shopTx.ts');
const R = L('src/game/rewards.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

function player(over = {}) {
  return {
    level: 5, exp: 1000, consciousness: 100,
    rewards: R.normalizeRewards({ credits: 300, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] }),
    progress: { flags: {}, failedAttempts: {}, challengeSessions: {} },
    ...over,
  };
}

console.log('=== A. 商品目录完整性 ===');
{
  const ids = S.SHOP_ITEMS.map(i => i.id);
  ok(new Set(ids).size === ids.length, '商品 id 唯一', String(ids.length));
  ok(S.SHOP_ITEMS.every(i => i.price > 0 && Number.isInteger(i.price)), '价格均为正整数');
  ok(S.SHOP_ITEMS.every(i => !!S.RARITY_META[i.rarity]), '稀有度均有效');
  ok(S.SHOP_ITEMS.every(i => !!i.effect && i.effect.length > 4), '每件商品都有真实功能说明');
  ok(S.SHOP_ITEMS.every(i => i.listed !== false), '默认商品均已上架');
  const types = new Set(S.SHOP_ITEMS.map(i => i.type));
  ok(['defense', 'energy', 'exp', 'skill', 'look', 'special'].every(t => types.has(t)), '六类商品齐全', [...types].join(','));
  ok(S.CATEGORY_META.length === 6, '六个分类元数据');
  ok(S.shopItemById('scan').count === 1 && S.shopItemById('scan').category === 'tool', '旧字段兼容（scan/count/category）');
  ok(S.maxOwnOf(S.shopItemById('shield-core')) === 5, '消耗品可用 maxOwn 配置限购');
  ok(S.maxOwnOf(S.shopItemById('terminal-neon')) === 1, '永久商品默认限购 1');
}

console.log('=== B. 购买事务 ===');
{
  let p = player();
  const res = TX.purchaseItem(p, 'shield-core', 2, 'rq-1', 1000);
  ok(res.ok && res.charged === 120, '购买 2 件按目录价扣费 120', String(res.charged));
  ok(res.player.rewards.credits === 180, '余额正确扣除');
  ok(res.player.rewards.items['shield-core'] === 2, '背包数量正确增加');
  ok(res.player.rewards.purchases['shield-core'] === 2, '限购计数累加');
  ok(res.transaction && res.transaction.status === 'ok' && res.transaction.total === 120, '写入成功交易记录');
  ok(res.transaction.unitPrice === 60 && res.transaction.qty === 2, '记录单价与数量');
  ok(res.transaction.requestId === 'rq-1' && !!res.transaction.id, '记录请求 id 与交易 id');

  const dup = TX.purchaseItem(res.player, 'shield-core', 2, 'rq-1', 1001);
  ok(dup.ok && dup.duplicate === true && dup.charged === 0, '同一请求 id 不重复扣费');
  ok(dup.player.rewards.credits === 180 && dup.player.rewards.items['shield-core'] === 2, '重复请求不改变余额与背包');

  const poor = TX.purchaseItem(player(), 'exp-boost', 3, 'rq-2', 1002);
  ok(!poor.ok && /贡献点不足/.test(poor.reason), '余额不足被拒绝', poor.reason);
  const stateQty = S.buyStateOf(S.shopItemById('exp-boost'), { credits: 200, purchases: 0, ownedSkins: [], flags: {}, qty: 2 });
  ok(stateQty === 'insufficient', '按数量计算总价后按钮显示余额不足', stateQty);
  const stateQty1 = S.buyStateOf(S.shopItemById('exp-boost'), { credits: 200, purchases: 0, ownedSkins: [], flags: {}, qty: 1 });
  ok(stateQty1 === 'buy', '数量 1 时余额足够', stateQty1);
  ok(poor.player.rewards.credits === 300 && !poor.player.rewards.items['exp-boost'], '失败不扣费不发货');
  ok(poor.transaction && poor.transaction.status === 'failed' && poor.transaction.total === 0, '失败写入失败记录');

  const missing = TX.purchaseItem(player(), 'no-such-item', 1, 'rq-3', 1003);
  ok(!missing.ok && /不存在/.test(missing.reason), '商品不存在被拒绝');

  const zero = TX.purchaseItem(player(), 'scan', 0, 'rq-4', 1004);
  ok(!zero.ok && /数量无效/.test(zero.reason), '数量 0 被拒绝');
  const neg = TX.purchaseItem(player(), 'scan', -3, 'rq-5', 1005);
  ok(!neg.ok && /数量无效/.test(neg.reason), '负数数量被拒绝');
  const frac = TX.purchaseItem(player(), 'scan', 1.5, 'rq-6', 1006);
  ok(!frac.ok && /整数/.test(frac.reason), '小数数量被拒绝');
  const huge = TX.purchaseItem(player({ rewards: R.normalizeRewards({ credits: 999999 }) }), 'scan', 100, 'rq-7', 1007);
  ok(!huge.ok && /上限/.test(huge.reason), '超大数量被拒绝');
}

console.log('=== C. 限购 / 永久商品 / 下架 ===');
{
  let p = player({ rewards: R.normalizeRewards({ credits: 2000 }) });
  const first = TX.purchaseItem(p, 'guard-charm', 3, 'rq-10', 1100);
  ok(first.ok && first.player.rewards.items['guard-charm'] === 3, '一次买满限购 3 件');
  const over = TX.purchaseItem(first.player, 'guard-charm', 1, 'rq-11', 1101);
  ok(!over.ok && /已达到购买上限/.test(over.reason), '超过限购被拒绝', over.reason);
  const partial = TX.purchaseItem(p, 'guard-charm', 4, 'rq-12', 1102);
  ok(!partial.ok && /超出限购数量/.test(partial.reason), '数量超过剩余限购说明剩余数', partial.reason);

  const skin = TX.purchaseItem(player(), 'terminal-neon', 1, 'rq-13', 1103);
  ok(skin.ok && skin.player.rewards.skins.includes('terminal-neon'), '永久外观购买后进入已拥有');
  const again = TX.purchaseItem(skin.player, 'terminal-neon', 1, 'rq-14', 1104);
  ok(!again.ok && /已拥有/.test(again.reason), '已拥有商品不可重复购买');

  const flagItem = TX.purchaseItem(player(), 'fx-repair', 1, 'rq-15', 1105);
  ok(flagItem.ok && flagItem.player.progress.flags.fxRepair === true, '永久权益写入标记');

  const target = S.SHOP_ITEMS.find(i => i.id === 'nano-restore');
  const old = target.listed;
  target.listed = false;
  const offline = TX.purchaseItem(player(), 'nano-restore', 1, 'rq-16', 1106);
  ok(!offline.ok && /暂未开放/.test(offline.reason), '下架商品不可购买');
  target.listed = old;
}

console.log('=== D. 道具真实效果 ===');
{
  let p = player({ consciousness: 85, rewards: R.normalizeRewards({ credits: 300, items: { stabilizer: 1 } }) });
  const heal = TX.useItem(p, 'stabilizer', 1200);
  ok(heal.ok && heal.player.consciousness === 95, '稳定模块恢复 10 点意识', String(heal.player.consciousness));
  const heal2 = TX.useItem(heal.player, 'stabilizer', 1201);
  ok(!heal2.ok && heal2.reason === '背包中没有该道具', '没有库存时不能使用');

  let near = player({ consciousness: 95, rewards: R.normalizeRewards({ credits: 300, items: { 'nano-restore': 1 } }) });
  const capped = TX.useItem(near, 'nano-restore', 1202);
  ok(capped.ok && capped.player.consciousness === 100, '恢复不超过 100 上限', String(capped.player.consciousness));
  ok(capped.player.rewards.items['nano-restore'] === 0, '使用后数量扣减且不为负');

  const full = player({ consciousness: 100, rewards: R.normalizeRewards({ items: { stabilizer: 1 } }) });
  ok(!TX.useItem(full, 'stabilizer', 1203).ok, '意识已满时拒绝使用');

  let boostP = player({ rewards: R.normalizeRewards({ items: { 'exp-boost': 4 } }) });
  const use1 = TX.useItem(boostP, 'exp-boost', 1204);
  ok(use1.ok && use1.player.rewards.buffs.expBoost.uses === 1, '经验增幅激活 1 次');
  const use2 = TX.useItem(use1.player, 'exp-boost', 1205);
  const use3 = TX.useItem(use2.player, 'exp-boost', 1206);
  ok(use3.player.rewards.buffs.expBoost.uses === 3, '增幅叠加到 3 次');
  const use4 = TX.useItem(use3.player, 'exp-boost', 1207);
  ok(!use4.ok && /叠满/.test(use4.reason), '增幅不得超过配置上限', use4.reason);
  ok(use4.player.rewards.buffs.expBoost.uses === 3 && use4.player.rewards.items['exp-boost'] === 1, '超限时不消耗库存');

  let shieldP = player({ rewards: R.normalizeRewards({ items: { 'shield-core': 4 } }) });
  let cur = shieldP;
  for (let i = 0; i < 3; i++) cur = TX.useItem(cur, 'shield-core', 1300 + i).player;
  ok(cur.rewards.buffs.shield === 3, '护盾叠到 3 层');
  const shield4 = TX.useItem(cur, 'shield-core', 1304);
  ok(!shield4.ok && /叠加上限/.test(shield4.reason), '护盾不超过 3 层');

  const skillUse = TX.useItem(player({ rewards: R.normalizeRewards({ items: { scan: 1 } }) }), 'scan', 1305);
  ok(!skillUse.ok && /挑战页/.test(skillUse.reason), '扫描器只能在挑战页使用');
  const dec = TX.useItem(player({ rewards: R.normalizeRewards({ items: { decoder: 1 } }) }), 'decoder', 1306);
  ok(!dec.ok && /记忆档案/.test(dec.reason), '解码器只能在记忆档案使用');
}

console.log('=== E. 装备与卸下 ===');
{
  let p = player({ rewards: R.normalizeRewards({ skins: ['title-junior', 'frame-bronze'] }) });
  const eq = TX.equipItemById(p, 'title-junior');
  ok(eq.ok && eq.player.rewards.equipped.title === 'title-junior', '装备称号写入槽位');
  const eq2 = TX.equipItemById(eq.player, 'frame-bronze');
  ok(eq2.ok && eq2.player.rewards.equipped.avatarFrame === 'frame-bronze', '装备头像框');
  const un = TX.unequipSlot(eq2.player, 'title');
  ok(un.ok && !un.player.rewards.equipped.title, '卸下称号');
  const un2 = TX.unequipSlot(un.player, 'title');
  ok(!un2.ok && /没有装备/.test(un2.reason), '重复卸下返回明确原因');
  const notOwned = TX.equipItemById(player(), 'title-junior');
  ok(!notOwned.ok && /尚未拥有/.test(notOwned.reason), '未拥有不能装备');
  const wrong = TX.equipItemById(player(), 'scan');
  ok(!wrong.ok && /不可装备/.test(wrong.reason), '非装备类不能装备');
}

console.log('=== F. 记录与存档字段 ===');
{
  const p = TX.purchaseItem(player(), 'scan', 1, 'rq-20', 1400).player;
  const rw = R.normalizeRewards(p.rewards);
  ok(Array.isArray(rw.transactions) && rw.transactions.length === 1, '交易记录可持久化');
  ok(rw.purchases.scan === 1, '限购计数可持久化');
  ok(rw.buffs && rw.buffs.shield === 0 && rw.buffs.expBoost === null, '增益默认值完整');

  const dirty = R.normalizeRewards({
    credits: 'x', items: { scan: -2, rollback: 'a' },
    transactions: [{ itemId: 'scan', qty: -5, total: NaN, status: 'weird' }, null],
    purchases: { scan: -1, rollback: 2.7 },
    buffs: { shield: 9, guard: -1, barrier: 'x', hintTicket: 1, expBoost: { uses: 9, mult: 0 } },
  });
  ok(dirty.credits === 0, '非法余额归零');
  ok(dirty.transactions.length === 1 && dirty.transactions[0].qty === 1 && dirty.transactions[0].total === 0, '非法交易记录被清洗');
  ok(dirty.purchases.scan === undefined && dirty.purchases.rollback === 2, '非法限购计数被清洗');
  ok(dirty.buffs.shield === 3 && dirty.buffs.guard === 0 && dirty.buffs.barrier === 0, '增益层数被限制在 0..3');
  ok(dirty.buffs.expBoost === null, '非法增幅被丢弃');
}

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
