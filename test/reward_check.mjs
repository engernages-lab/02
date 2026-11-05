// 奖励与成长：经济规则 / 等级解锁 / 章节结算 / Boss 奖励数据
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
function makeLoader() {
  const cache = new Map();
  function rf(base) {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  }
  function load(file) {
    const abs = rf(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} };
    cache.set(abs, mod);
    const req = (sp) => { if (!sp.startsWith('.')) throw new Error('ext'); return load(join(dirname(abs), sp)); };
    new Function('exports', 'module', 'require', out)(mod.exports, mod, req);
    return mod.exports;
  }
  return rel => load(join(root, rel));
}
const load = makeLoader();
const E = load('src/game/economy.ts');
const R = load('src/game/rewards.ts');
const F = load('src/game/lore/fragments.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

console.log('=== 1. 关卡贡献点（首通 vs 重复） ===');
const first = E.computeLevelRewardV2({ levelExp: 90, fails: 0, hints: 0, firstClear: true, prevStars: 0, newStars: 3 });
check(first.total > 0, '首通有贡献点', String(first.total));
check(first.base > 0 && first.firstClearBonus === 30, '首通含基础 + 首通奖励');
check(first.noFail === 10 && first.noHint === 10, '零失误 / 未用提示额外奖励');
check(first.grade === 'S', '零失误零提示评为 S');
const repeatSame = E.computeLevelRewardV2({ levelExp: 90, fails: 0, hints: 0, firstClear: false, prevStars: 3, newStars: 3 });
check(repeatSame.total === 0, '重复通关同星级：0 贡献点（不能刷关）', String(repeatSame.total));
check(repeatSame.trustGain === 0, '重复通关同星级：0 信任度');
const repeatUp = E.computeLevelRewardV2({ levelExp: 90, fails: 0, hints: 0, firstClear: false, prevStars: 1, newStars: 2 });
check(repeatUp.total === E.IMPROVEMENT_PER_STAR, '重复通关提升 1 星：仅给补偿');
const repeatMax = E.computeLevelRewardV2({ levelExp: 90, fails: 0, hints: 0, firstClear: false, prevStars: 0, newStars: 3 });
check(repeatMax.total === E.IMPROVEMENT_PER_STAR * 2, '星级补偿上限为 2 星（防止无限刷）');
const failed = E.computeLevelRewardV2({ levelExp: 90, fails: 3, hints: 2, firstClear: true, prevStars: 0, newStars: 1 });
check(failed.grade === 'B' && failed.noFail === 0 && failed.noHint === 0, '失误/提示会扣掉对应奖励');

console.log('=== 2. 等级解锁 ===');
eq(E.LEVEL_UNLOCKS.map(u => u.level), [5, 7, 10], '等级解锁节点 5 / 7 / 10');
eq(E.unlocksForLevel(4, 5).map(u => u.id), ['title-level5'], '升到 5 级解锁称号');
eq(E.unlocksForLevel(4, 7).map(u => u.id), ['title-level5', 'frame-core'], '跨级一次解锁多个');
eq(E.unlocksForLevel(10, 11).map(u => u.id), [], '已过节点不重复解锁');
E.LEVEL_UNLOCKS.forEach(u => check(!!u.name && !!u.slot, u.name + ' 有槽位'));

console.log('=== 3. Boss 首杀奖励 ===');
check(E.BOSS_CLEAR_REWARDS.length === 6, '六章各有 Boss 奖励');
eq(E.BOSS_CLEAR_REWARDS.map(b => b.chapter), [1, 2, 3, 4, 5, 6], '章节顺序正确');
check(new Set(E.BOSS_CLEAR_REWARDS.map(b => b.title)).size === 6, '奖励称号唯一');
check(E.BOSS_CLEAR_REWARDS.every(b => b.credits > 0 && b.trust > 0), '每个 Boss 奖励含贡献点与信任度');
check(E.BOSS_CLEAR_REWARDS[5].credits > E.BOSS_CLEAR_REWARDS[0].credits, '后章节奖励更高');
check(!!E.bossRewardFor(1) && !E.bossRewardFor(9), 'bossRewardFor 边界正确');

console.log('=== 4. 章节结算 ===');
const s = E.chapterGrade({ chapter: 1, levels: 5, stars: 15, maxStars: 15, fails: 0, hints: 0 });
check(s === 'S', '满星零失误 = S');
const a = E.chapterGrade({ chapter: 1, levels: 5, stars: 12, maxStars: 15, fails: 1, hints: 0 });
check(a === 'A', '80% 星级 = A');
const c = E.chapterGrade({ chapter: 1, levels: 5, stars: 5, maxStars: 15, fails: 8, hints: 6 });
check(c === 'C', '低星级 = C');
const sett = E.buildChapterSettlement({ chapter: 1, levels: 5, stars: 15, fails: 0, hints: 0, credits: 120, exp: 150, trust: 6, knowledgeIds: ['if', 'compare'], masteredIds: ['if'], unlocks: ['数据港清道夫'] });
check(sett.grade === 'S' && sett.credits === 120 && sett.exp === 150, '结算含评价 / 贡献点 / 经验');
eq(sett.knowledge, [{ id: 'if', ok: true }, { id: 'compare', ok: false }], '结算含知识点掌握情况');
eq(sett.unlocks, ['数据港清道夫'], '结算含新解锁');

console.log('=== 5. 存档字段与商店 ===');
const d = R.normalizeRewards(undefined);
check(Array.isArray(d.bossRewards) && Array.isArray(d.unlocks), '奖励状态含 bossRewards / unlocks');
const old = R.normalizeRewards({ credits: 100, trust: 40 });
check(old.credits === 100 && old.trust === 40, '旧存档已有字段保留');
const frames = R.SHOP_ITEMS.filter(i => i.slot === 'avatarFrame');
check(frames.length >= 2, '商店有头像框商品');
check(R.SHOP_ITEMS.some(i => i.id === 'scan' && i.category === 'tool'), '商店有代码扫描工具');
check(R.SHOP_ITEMS.some(i => i.id === 'rollback' && i.category === 'tool'), '商店有数据回滚工具');
check(R.SHOP_ITEMS.every(i => i.price > 0), '商品价格有效');

console.log('=== 6. 信任度与隐藏记忆 ===');
check(F.HIDDEN_MEMORY.requireTrust === 75, '隐藏记忆需要信任度 75');
check(F.HIDDEN_MEMORY.text.length >= 3, '隐藏记忆有完整文本');
check(R.TRUST_TIERS.length >= 5, '信任度有分阶段');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
