// 自检：所有 Boss 战的每阶段——初始故障版真实判题结果 vs baselineMask、阶段能否被白打穿
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
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
const J = load(join(root, 'src/services/judge.ts'));
const B = load(join(root, 'src/game/battle.ts'));
const RUNNER = readFileSync(join(root, 'test/_mp_runner.py'), 'utf8');
let raw = '';
const mp = await loadMicroPython({
  url: join(root, 'node_modules/@micropython/micropython-webassembly-pyscript/micropython-settrace.wasm'),
  stdout: s => { raw += s; }, stderr: s => { raw += s; },
});
function run(code) {
  raw = '';
  mp.runPython(RUNNER.replace('__NX_SRC__', JSON.stringify(String(code))));
  const i = raw.lastIndexOf('__NX_RES__');
  if (i < 0) return { ok: false, stdout: '', error: 'no result' };
  try {
    const r = JSON.parse(raw.slice(i + '__NX_RES__'.length).trim());
    return { ok: !r.err, stdout: r.out || '', error: r.err };
  } catch { return { ok: false, stdout: '', error: 'parse fail' }; }
}

let bad = 0;
for (const b of B.BOSS_BATTLES) {
  const seg = b.maxHp / b.phases.length;
  if (!Number.isInteger(seg)) { console.log('!!! ' + b.bossId + ' 血量不能被阶段整除'); bad++; }
  b.phases.forEach((p, idx) => {
    if (p.judge.judgeKind !== 'python') { console.log('!!! ' + b.bossId + ' ' + p.id + ' 不是 python 判题'); bad++; return; }
    const checks = p.judge.pythonChecks || [];
    const total = checks.length;
    const code = J.combineWithHarness(p.initialCode, J.buildHarness(checks));
    const r = run(code);
    const v = J.judgeRun(p.judge, { ...r, timedOut: false });
    let mask = 0;
    (v.checks || []).forEach((c, i) => { if (c.ok) mask |= (1 << i); });
    const maskMatch = mask === p.baselineMask;
    const cleared = mask === (1 << total) - 1;
    console.log((maskMatch ? 'ok  ' : '!!! ') + b.bossId + ' ' + p.id +
      ' baseline实际=' + mask + ' 配置=' + p.baselineMask + ' 初始版通过=' + (v.checks || []).filter(c => c.ok).length + '/' + total +
      ' 初始版可通关=' + cleared + (v.error ? ' err=' + v.error : ''));
    if (!maskMatch) bad++;
    if (cleared) bad++;
    if (total < 2) { console.log('!!! ' + b.bossId + ' ' + p.id + ' 测试项少于 2'); bad++; }
    if ((p.hints || []).length !== 3) { console.log('!!! ' + b.bossId + ' ' + p.id + ' 提示不是 3 层'); bad++; }
    const kv = B.knowledgeViolations({ ...b, phases: [p] });
    if (kv.length) { console.log('!!! ' + b.bossId + ' ' + p.id + ' 知识点超纲: ' + JSON.stringify(kv)); bad++; }
  });
}
console.log(bad === 0 ? '全部 Boss 战阶段基线一致' : '发现 ' + bad + ' 处问题');
