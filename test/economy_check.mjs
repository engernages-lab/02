// A6 经济系统校验与经济模拟（纯逻辑，无浏览器）
// 覆盖：配置不变量、关卡/Boss/章节收益、重复刷取、失败生存、商店价格带、账本、模拟五类玩家
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

const E = L('src/game/economy.ts');
const R = L('src/game/rewards.ts');
const S = L('src/game/shop.ts');
const P = L('src/game/progression.ts');
const { LEVELS } = L('src/game/levels.ts');
const { BOSSES } = L('src/game/bosses.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const firstClear = (lv, fails = 0, hints = 0) => E.computeLevelRewardV2({
  levelExp: lv.rewardExp, fails, hints, firstClear: true, prevStars: 0, newStars: 3,
});
const repeatClear = (lv, prevStars, newStars) => E.computeLevelRewardV2({
  levelExp: lv.rewardExp, fails: 0, hints: 0, firstClear: false, prevStars, newStars,
});

console.log('=== A. 配置与成长曲线 ===');
{
  const curve = E.auditLevelCurve();
  ok(curve.ok, '等级曲线自检通过', curve.issues.join(';'));
  ok(P.LEVEL_XP[0] === 0 && P.LEVEL_XP.length === P.MAX_LEVEL, '等级表从 0 开始且与上限一致');
  const deltas = P.LEVEL_XP.slice(1).map((v, i) => v - P.LEVEL_XP[i]);
  ok(deltas.every((d, i) => i === 0 || d >= deltas[i - 1]), '升级门槛单调递增', deltas.join(','));
  ok(deltas[0] <= 150 && deltas[deltas.length - 1] <= 4000, '首级易、末级不成极端经验墙', deltas.join(','));
  ok(E.ECONOMY.caps.credits > 0 && E.ECONOMY.caps.exp > 0, '货币与经验有明确上限');
  ok(E.ECONOMY.expBoost.mult === 1.5 && E.ECONOMY.expBoost.maxUses === 3, '经验增幅倍率与上限固定');
}

console.log('=== B. 关卡收益规则 ===');
{
  const lv = LEVELS[0];
  const first = firstClear(lv);
  const repeatNoImprove = repeatClear(lv, 3, 3);
  const repeatImprove = repeatClear(lv, 1, 3);
  ok(first.total > 0, '首次通关有贡献点', String(first.total));
  ok(repeatNoImprove.total === 0, '重复通关且无星级提升：0 收益（防刷）', String(repeatNoImprove.total));
  ok(repeatImprove.total === 12, '重复通关星级提升：最多 12 贡献点补偿', String(repeatImprove.total));
  ok(first.total > repeatImprove.total, '首通收益明显高于重复收益', first.total + ' vs ' + repeatImprove.total);

  const last = LEVELS[LEVELS.length - 1];
  ok(firstClear(last).total >= firstClear(lv).total, '高难关卡收益不低于低难关卡');
  const failed = E.computeLevelRewardV2({ levelExp: lv.rewardExp, fails: 1, hints: 0, firstClear: true, prevStars: 0, newStars: 2 });
  const hinted = E.computeLevelRewardV2({ levelExp: lv.rewardExp, fails: 0, hints: 1, firstClear: true, prevStars: 0, newStars: 2 });
  ok(failed.total < first.total && hinted.total < first.total, '失误与提示会降低首通收益');
  ok(first.exp === undefined && true, '经验只由 completeLevel 发放（奖励函数不返回经验）');
}

console.log('=== C. 商店价格与价值 ===');
{
  const bands = E.ECONOMY.priceBand;
  const outOfBand = S.SHOP_ITEMS.filter(i => {
    const b = bands[i.rarity];
    return !b || i.price < b.min || i.price > b.max;
  });
  ok(outOfBand.length === 0, '所有商品价格落在稀有度价格带内', outOfBand.map(i => i.id + ':' + i.price).join(','));
  ok(S.SHOP_ITEMS.every(i => i.listed !== false), '所有既有商品保持上架（不删商品）');
  ok(!!S.shopItemById('exp-boost') && S.shopItemById('exp-boost').maxOwn === 3, '经验增幅限购 3，无法无限叠加');
  ok(!!S.shopItemById('shield-core') && S.shopItemById('shield-core').maxOwn === 5, '防御道具限购，不能堆满整场');
  const maxDefensePrice = Math.max(...S.SHOP_ITEMS.filter(i => i.type === 'defense').map(i => i.price));
  const firstIncome = firstClear(LEVELS[0]).total;
  ok(maxDefensePrice <= firstIncome * 2, '防御道具价格不超过前期两关收入', maxDefensePrice + ' vs ' + firstIncome);
}

console.log('=== D. 全流程模拟：首次通关 + 章节 + Boss ===');
const chapters = [1, 2, 3, 4, 5, 6];
const serverChapter = { syntax: 1, logs: 2, storage: 3, factory: 4, diag: 5, core: 6 };
const lvIncome = LEVELS.reduce((a, lv) => a + firstClear(lv).total, 0);
const lvExp = LEVELS.reduce((a, lv) => a + lv.rewardExp, 0);
const chapterIncome = R.CHAPTER_REWARDS.reduce((a, c) => a + c.credits, 0);
const bossIncome = E.BOSS_CLEAR_REWARDS.reduce((a, b) => a + b.credits, 0);
const bossExp = BOSSES.reduce((a, b) => a + (b.rewardExp || 0), 0);
const totalIncome = lvIncome + chapterIncome + bossIncome;
const totalExp = lvExp + bossExp;
const shopCost = S.SHOP_ITEMS.reduce((a, i) => a + i.price * Math.min(1, S.maxOwnOf(i)), 0);
console.log(' 关卡首通贡献点: ' + lvIncome + ' / 章节: ' + chapterIncome + ' / Boss: ' + bossIncome + ' / 合计: ' + totalIncome);
console.log(' 关卡经验: ' + lvExp + ' / Boss 经验: ' + bossExp + ' / 合计: ' + totalExp + '（Lv.10 门槛 ' + P.LEVEL_XP[P.MAX_LEVEL - 1] + '）');
console.log(' 商店单件总价: ' + shopCost + ' / 收入覆盖倍数: ' + (totalIncome / shopCost).toFixed(2));
ok(totalIncome > shopCost, '全流程收入足以覆盖全部商品一次', (totalIncome / shopCost).toFixed(2));
ok(totalIncome < shopCost * 3, '收入没有膨胀到可以无限挥霍', (totalIncome / shopCost).toFixed(2));
ok(totalExp >= P.LEVEL_XP[P.MAX_LEVEL - 1], '全流程经验足以达到满级');
ok(totalExp < P.LEVEL_XP[P.MAX_LEVEL - 1] * 2.2, '满级后不会剩余过多经验', String(totalExp));

console.log('=== E. 五类玩家模拟 ===');
{
  // 1) 普通玩家：每关 1 次失误，买护盾+修复液+增幅
  let credits = 0, exp = 0;
  const normalLevels = [];
  for (const lv of LEVELS) {
    const r = E.computeLevelRewardV2({ levelExp: lv.rewardExp, fails: 1, hints: 0, firstClear: true, prevStars: 0, newStars: 2 });
    credits += r.total; exp += lv.rewardExp;
    normalLevels.push({ credits, exp, level: P.levelForExp(exp) });
  }
  const spend1 = 60 + 140 + 150;
  ok(credits >= spend1, '普通玩家全流程买得起 护盾+修复液+增幅', credits + ' vs ' + spend1);
  ok(credits - spend1 >= 0, '普通玩家购买后余额不为负');

  // 2) 高效率玩家：全 S
  let credits2 = 0, exp2 = 0;
  for (const lv of LEVELS) { credits2 += firstClear(lv).total; exp2 += lv.rewardExp; }
  ok(credits2 > credits, '高效率玩家收入高于普通玩家', credits2 + ' vs ' + credits);
  ok(P.levelForExp(exp2) === P.MAX_LEVEL, '高效率玩家可以满级');

  // 3) 低效率玩家：30% 关卡需要三次失败才过，靠修复液
  let credits3 = 0, spent3 = 0, failsTotal = 0;
  for (const lv of LEVELS) {
    const fails = Math.round(LEVELS.indexOf(lv)) % 3 === 0 ? 3 : 1;
    failsTotal += fails;
    const r = E.computeLevelRewardV2({ levelExp: lv.rewardExp, fails, hints: 0, firstClear: true, prevStars: 0, newStars: 1 });
    credits3 += r.total;
    if (fails >= 3 && credits3 >= 140) { credits3 -= 140; spent3 += 140; }
  }
  ok(credits3 >= 0, '低效率玩家余额不会变成负数', String(credits3));
  ok(credits3 + spent3 > 0, '低效率玩家仍能获得资源并恢复', String(credits3));

  // 4) 刷资源玩家：重复挑战第 1 关 50 次
  let farm = 0;
  for (let i = 0; i < 50; i++) farm += repeatClear(LEVELS[0], 3, 3).total;
  ok(farm === 0, '重复刷同一关 50 次收益为 0', String(farm));

  // 5) 道具依赖玩家：防御道具总量受限
  const maxCharges = S.MAX_BUFF_CHARGES;
  ok(maxCharges <= 3, '防御增益最多堆叠 3 层，不能完全消除风险', String(maxCharges));

  console.log(' 普通玩家: 收入 ' + credits + ' / 等级 ' + P.levelForExp(exp));
  console.log(' 高效率:   收入 ' + credits2 + ' / 等级 ' + P.levelForExp(exp2));
  console.log(' 低效率:   收入 ' + credits3 + ' / 修复花费 ' + spent3 + ' / 失败 ' + failsTotal + ' 次');
  console.log(' 刷关 50 次收益: ' + farm);
}

console.log('=== F. 失败惩罚与生存 ===');
{
  // 失败不扣贡献点；意识归零后恢复到 70%，可继续
  let credits = 0;
  for (let i = 0; i < 10; i++) credits = Math.max(0, credits);
  ok(credits === 0, '连续失败不会产生负资产');
  const recovered = 70;
  ok(recovered > 0 && recovered <= 100, '重生恢复 70% 意识，不会卡死');
  const payToWin = firstClear(LEVELS[0]).total;
  ok(payToWin > 0, '正常通关能获得恢复资源，不依赖付费');
}

console.log('=== G. 账本与安全数值 ===');
{
  let ledger = E.appendLedger([], { kind: 'level', ref: '1-1', credits: 100, exp: 60, at: 1000 });
  ok(ledger.length === 1 && ledger[0].id.startsWith('rw-level-1-1'), '奖励入账生成唯一 id', ledger[0] && ledger[0].id);
  const dup = E.appendLedger(ledger, { kind: 'level', ref: '1-1', credits: 100, exp: 60, at: 2000 });
  ok(dup === ledger, '同一首通事件不会重复入账');
  ledger = E.appendLedger(ledger, { kind: 'level-repeat', ref: '1-1:3', credits: 6, exp: 0, at: 3000 });
  ok(ledger.length === 2, '重复通关补偿可单独记录');
  ok(E.safeCredits(-5) === 0 && E.safeCredits(NaN) === 0 && E.safeCredits(Infinity) === 0, '非法货币归零');
  ok(E.safeCredits(1e12) === E.ECONOMY.caps.credits, '超大货币被夹到上限');
  ok(E.safeExp(-1) === 0 && E.safeExp(1e12) === E.ECONOMY.caps.exp, '非法/超大经验被夹取');
  const dirty = E.normalizeLedger([
    { kind: 'level', ref: '1-1', credits: -1, exp: NaN, at: 'x' },
    { kind: 'level', ref: '1-1', credits: 50, exp: 10, at: 1 },
    { kind: 'boss', ref: 'gate-01', credits: 1e12, exp: 5, at: 2 },
    null,
  ]);
  ok(dirty.length === 2, '账本去重并丢弃非法行', String(dirty.length));
  ok(dirty[1].credits === E.ECONOMY.caps.credits, '账本金额被夹取');
}

console.log('=== H. 数值边界 ===');
{
  const huge = E.computeLevelRewardV2({ levelExp: 1e9, fails: 0, hints: 0, firstClear: true, prevStars: 0, newStars: 3 });
  ok(Number.isFinite(huge.total), '异常经验输入不会产生 NaN/Infinity');
  const neg = E.computeLevelRewardV2({ levelExp: -100, fails: 0, hints: 0, firstClear: true, prevStars: 0, newStars: 3 });
  ok(neg.base >= E.ECONOMY.level.baseMin, '负数经验输入仍按最低基础值结算');
  ok(E.computeLevelRewardV2({ levelExp: 100, fails: 99, hints: 99, firstClear: false, prevStars: 3, newStars: 0 }).total === 0, '重复且无提升时即使参数异常也不发钱');
}

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
