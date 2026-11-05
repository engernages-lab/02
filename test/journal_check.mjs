// 剧情时间线 / Bug 图鉴：数据与锁定规则
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
    const mod = { exports: {} };
    cache.set(abs, mod);
    new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
    return mod.exports;
  }
  return (rel) => load(join(root, rel));
}
const L = makeLoader();
const C = L('src/game/codex.ts');
const T = L('src/game/timeline.ts');

let pass = 0, total = 0;
const check = (c, label, extra = '') => { total++; if (c) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? ' => ' + extra : '')); };

console.log('=== 1. Bug 图鉴数据 ===');
check(C.BUG_CODEX.length >= 10, '图鉴条目不少于 10 条');
check(new Set(C.BUG_CODEX.map(b => b.id)).size === C.BUG_CODEX.length, '条目 id 唯一');
['SyntaxError', 'NameError', 'TypeError', 'IndexError', 'KeyError'].forEach(err => {
  check(C.BUG_CODEX.some(b => b.error === err), '覆盖 ' + err);
});
C.BUG_CODEX.forEach(b => {
  check(b.levelIds.length > 0 && b.levelIds.every(id => /^\d+-\d+$/.test(id)), b.id + '：关联真实关卡');
  check(!!b.fix && !!b.desc, b.id + '：有说明与修复要点');
});

console.log('=== 2. 错误类型映射 ===');
check(C.codexForError('SyntaxError').id === 'syntax', 'SyntaxError → 语法错误');
check(C.codexForError('IndentationError').id === 'indent', 'IndentationError → 缩进错误');
check(C.codexForError('NameError').id === 'name', 'NameError → 名字未定义');
check(C.codexForError('KeyError').id === 'key', 'KeyError → 键不存在');
check(C.codexForError('IndexError').id === 'index', 'IndexError → 索引越界');
check(C.codexForError('WeirdError') === undefined, '未知错误不误判');

console.log('=== 3. 章节常见错误 ===');
const log = { syntax: { count: 1, firstAt: 1 }, logic: { count: 4, firstAt: 1 }, name: { count: 2, firstAt: 1 } };
const top1 = C.topBugsForChapter(1, log, 3);
check(top1.length === 2 && top1[0].id === 'name', '只取本章且按次数排序', JSON.stringify(top1.map(b => b.id)));
check(!top1.some(b => b.id === 'logic'), '不混入其他章节的错误');
check(C.topBugsForChapter(5, log).length === 0, '其他章节不串数据');
check(C.topBugsForChapter(1, undefined).length === 0, '无记录时返回空');

console.log('=== 4. 时间线 ===');
const player = {
  level: 3, exp: 200,
  meta: { memoryFragments: ['frag-01'], fragmentLog: { 'frag-01': 123 } },
  progress: {
    achievements: [], knowledge: [],
    story: { unlocked: ['prologue'], seen: { 'pro-01': 1 }, choices: {}, lastEventId: 'prologue' },
  },
};
const tl = T.buildTimeline(player);
check(tl.length > 10, '时间线非空');
check(tl.some(e => e.kind === 'story' && !e.locked), '已解锁主线事件可见');
check(tl.some(e => e.kind === 'story' && e.locked), '未解锁主线事件保持锁定');
const mem1 = tl.find(e => e.id === 'memory:frag-01');
check(mem1 && !mem1.locked && mem1.title.includes('初始指令'), '已获得碎片显示标题');
const mem3 = tl.find(e => e.id === 'memory:frag-03');
check(mem3 && mem3.locked && mem3.title.includes('未归档'), '未获得碎片不显示真相');
check(tl.find(e => e.id === 'memory:frag-01').at === 123, '碎片时间来自归档记录');
const lv10 = tl.find(e => e.id === 'growth:10');
check(lv10 && lv10.locked, '未达到的等级锁定');
check(tl.find(e => e.id === 'growth:3') && !tl.find(e => e.id === 'growth:3').locked, '已达成的等级解锁');
check(tl.some(e => e.kind === 'mira' && e.desc.includes('1 / 6')), 'MIRA 恢复进度按碎片计算');
const mira2 = tl.find(e => e.id === 'mira:2');
check(!mira2, '碎片不足时不出现「记起约定」');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
