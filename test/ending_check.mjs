// 结局条件与演出脚本
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
function makeLoader() {
  const cache = new Map();
  const rf = (base) => existsSync(base) && extname(base) ? base : existsSync(base + '.ts') ? base + '.ts' : existsSync(join(base, 'index.ts')) ? join(base, 'index.ts') : base + '.ts';
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
const E = L('src/game/lore/endings.ts');
const S = L('src/game/lore/endingScenes.ts');

let pass = 0, total = 0;
const check = (c, label, extra = '') => { total++; if (c) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? ' => ' + extra : '')); };

console.log('=== 1. 三个固定结局 ===');
check(E.ENDINGS.length === 3, '只有三个结局');
check(JSON.stringify(E.ENDINGS.map(e => e.id)) === JSON.stringify(['dawn', 'order', 'beyond']), 'id 顺序正确');
check(JSON.stringify(E.ENDINGS.map(e => e.title)) === JSON.stringify(['新的黎明', '永恒秩序', '超越起源']), '标题符合蓝本');
check(E.ENDINGS.filter(e => e.kind === 'main').length === 2, '两个主要结局');
check(E.ENDINGS.filter(e => e.kind === 'hidden').length === 1, '一个隐藏结局');
check(Object.keys(S.ENDING_SCENES || {}).length === 3, '每个结局都有独立演出', JSON.stringify(Object.keys(S.ENDING_SCENES || {})));
Object.entries(S.ENDING_SCENES).forEach(([id, sc]) => {
  check(sc.lines.length >= 8, id + ' 演出不少于 8 句');
  check(new Set(sc.lines.map(l => l.id)).size === sc.lines.length, id + ' 台词 id 唯一');
  check(sc.lines.every(l => l.text.length > 4 && l.speaker), id + ' 台词完整');
  check(sc.id === 'ending-' + id, id + ' 场景 id 正确');
});
check(S.ENDING_SCENES.beyond.lines.some(l => l.text.includes('下一个问题')), '隐藏结局呼应「下一个问题」');

console.log('=== 2. 普通结局条件 ===');
const base = { fragments: [], flags: { chapter6Done: true }, trust: 10 };
check(E.endingEligible(E.endingById('dawn'), { ...base, choice: 'dawn' }) === true, '抵达终章 + 选择黎明 = 可达成');
check(E.endingEligible(E.endingById('dawn'), { ...base, choice: 'order' }) === false, '选择不同则不匹配');
check(E.endingEligible(E.endingById('dawn'), { fragments: [], flags: {}, trust: 10, choice: 'dawn' }) === false, '未抵达终章不能达成');
check(E.endingEligible(E.endingById('order'), { ...base, choice: 'order' }) === true, '永恒秩序同理');

console.log('=== 3. 隐藏结局条件 ===');
const all = ['frag-01', 'frag-02', 'frag-03', 'frag-04', 'frag-05', 'frag-06'];
const hidden = E.endingById('beyond');
check(E.endingEligible(hidden, { fragments: all, flags: { chapter6Done: true, finalMemorySeen: true }, trust: 80, choice: 'beyond' }) === true, '全部条件满足才可达成');
check(E.endingEligible(hidden, { fragments: all.slice(0, 5), flags: { chapter6Done: true, finalMemorySeen: true }, trust: 80, choice: 'beyond' }) === false, '少一枚碎片不可达成');
check(E.endingEligible(hidden, { fragments: all, flags: { chapter6Done: true, finalMemorySeen: false }, trust: 80, choice: 'beyond' }) === false, '未查看最终档案不可达成');
check(E.endingEligible(hidden, { fragments: all, flags: { chapter6Done: true, finalMemorySeen: true }, trust: 74, choice: 'beyond' }) === false, '信任度不足不可达成');
check(E.endingEligible(hidden, { fragments: all, flags: { chapter6Done: true, finalMemorySeen: true }, trust: 80, choice: 'dawn' }) === false, '隐藏结局需要明确选择');

console.log('=== 4. 可用结局列表 ===');
const list = E.availableEndings({ fragments: all, flags: { chapter6Done: true, finalMemorySeen: true }, trust: 80, choice: 'beyond' });
check(list.length === 1 && list[0].id === 'beyond', '一次只能达成一个结局');
check(E.availableEndings({ fragments: [], flags: {}, trust: 0, choice: 'dawn' }).length === 0, '未抵达终章时无可达结局');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
