import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
function makeLoader() {
  const cache = new Map();
  const rf = (b) => existsSync(b) && extname(b) ? b : existsSync(b + '.ts') ? b + '.ts' : existsSync(join(b, 'index.ts')) ? join(b, 'index.ts') : b + '.ts';
  function load(file) {
    const abs = rf(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} }; cache.set(abs, mod);
    new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
    return mod.exports;
  }
  return (rel) => load(join(root, rel));
}
const L = makeLoader();
const { LEVELS } = L('src/game/levels.ts');
const E = L('src/game/economy.ts');
const R = L('src/game/rewards.ts');
const B = L('src/game/bosses.ts');
let lv = 0;
for (const l of LEVELS) lv += E.computeLevelRewardV2({ levelExp: l.rewardExp, fails: 0, hints: 0, firstClear: true, prevStars: 0, newStars: 3 }).total;
const ch = R.CHAPTER_REWARDS.reduce((a, c) => a + c.credits, 0);
const bo = E.BOSS_CLEAR_REWARDS.reduce((a, b) => a + b.credits, 0);
const shop = R.SHOP_ITEMS.reduce((a, s) => a + s.price, 0);
console.log('levels', lv, 'chapters', ch, 'bosses', bo, 'TOTAL', lv + ch + bo, 'SHOP', shop, 'surplus', lv + ch + bo - shop);
console.log(R.SHOP_ITEMS.map(s => s.name + ':' + s.price).join('\n'));
console.log('boss exp total', B.BOSSES.reduce((a, b) => a + b.rewardExp, 0), 'level exp total', LEVELS.reduce((a, l) => a + l.rewardExp, 0));
