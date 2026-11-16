// Boss 三档难度审计：真实 MicroPython 执行
//   1. 每个阶段初始故障代码的 baselineMask 必须与实测一致；
//   2. 参考解必须让全部 pythonChecks 通过；
//   3. 考点必须落在 cumulativeKnowledge(chapter) 内；
//   4. 三档难度必须是不同题目（initialCode / phase id 不重复）。
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { DIFFICULTY_SOLUTIONS } from '../test/difficulty_solutions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function makeLoader() {
  const cache = new Map();
  const resolveFile = (base) => {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  };
  function load(file) {
    const abs = resolveFile(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const mod = { exports: {} };
    cache.set(abs, mod);
    const req = (spec) => {
      if (!spec.startsWith('.')) throw new Error('外部依赖不可用: ' + spec);
      return load(join(dirname(abs), spec));
    };
    new Function('exports', 'module', 'require', out)(mod.exports, mod, req);
    return mod.exports;
  }
  return (rel) => load(join(root, rel));
}

const L = makeLoader();
const B = L('src/game/battle.ts');
const J = L('src/services/judge.ts');
const BF = L('src/game/bossDifficulties.ts');
const D = L('src/game/difficulty.ts');

const RUNNER = readFileSync(join(root, 'test/_mp_runner.py'), 'utf8');
let raw = '';
const mp = await loadMicroPython({
  url: join(root, 'node_modules/@micropython/micropython-webassembly-pyscript/micropython-settrace.wasm'),
  stdout: (s) => { raw += s; },
  stderr: (s) => { raw += s; },
});

function runCode(code) {
  raw = '';
  mp.runPython(RUNNER.replace('__NX_SRC__', JSON.stringify(String(code))));
  const i = raw.lastIndexOf('__NX_RES__');
  if (i < 0) return { ok: false, stdout: '', timedOut: false, error: { type: 'NoResult', message: 'no result' } };
  try {
    const r = JSON.parse(raw.slice(i + '__NX_RES__'.length).trim());
    return {
      ok: !r.err,
      stdout: r.out || '',
      timedOut: false,
      error: r.err ? { type: String(r.err).split(':')[0] || 'Error', message: String(r.err) } : undefined,
    };
  } catch {
    return { ok: false, stdout: '', timedOut: false, error: { type: 'ParseFail', message: 'parse fail' } };
  }
}

const results = [];
let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL | ' + msg); };

for (const bossId of Object.keys(BF.BOSS_DIFFICULTY_BATTLES)) {
  for (const diff of ['easy', 'hard', 'expert']) {
    const def = BF.bossBattleDef(bossId, diff);
    if (!def) { fail(bossId + ' 缺少 ' + diff + ' 配置'); continue; }
    const allowed = B.cumulativeKnowledge(def.chapter);
    const violations = B.knowledgeViolations(def);
    if (violations.length) fail(bossId + '/' + diff + ' 考点越界: ' + violations.join(','));
    if (def.phases.length !== 4) fail(bossId + '/' + diff + ' 阶段数不是 4');
    console.log('### ' + bossId + ' / ' + diff + '（考点 ' + allowed.length + '）');
    def.phases.forEach((p, idx) => {
      const total = (p.judge.pythonChecks || []).length;
      const init = runCode(J.combineWithHarness(p.initialCode, J.buildHarness(p.judge.pythonChecks || [])));
      const iv = J.judgeRun(p.judge, init);
      let mask = 0;
      iv.checks.forEach((c, i) => { if (c.ok) mask |= (1 << i); });
      const solution = DIFFICULTY_SOLUTIONS[p.id];
      let solOk = false;
      let solDetail = '';
      if (!solution) {
        fail(p.id + ' 缺少参考解');
      } else {
        const sr = runCode(J.combineWithHarness(solution, J.buildHarness(p.judge.pythonChecks || [])));
        const sv = J.judgeRun(p.judge, sr);
        solOk = sv.passed;
        solDetail = sv.checks.map(c => (c.ok ? '✓' : '✗') + c.name).join(' ');
        if (!solOk) fail(p.id + ' 参考解未全部通过：' + solDetail + (sr.error ? ' [' + sr.error.type + ']' : ''));
      }
      if (mask !== p.baselineMask) {
        fail(p.id + ' baselineMask 实测=' + mask + ' 声明=' + p.baselineMask);
      }
      const initialPassesAll = mask === B.fullMask(total);
      if (initialPassesAll) fail(p.id + ' 初始故障代码可直接通关');
      results.push({ bossId, diff, id: p.id, total, mask, declared: p.baselineMask, solOk });
      console.log('  ' + (mask === p.baselineMask && solOk ? 'ok  ' : '!!! ') + p.id + ' 测试=' + total +
        ' baseline=' + mask + ' 声明=' + p.baselineMask + ' 参考解=' + (solOk ? '全过' : '失败'));
    });
  }
}

// 三档难度必须是独立题目
for (const bossId of Object.keys(BF.BOSS_DIFFICULTY_BATTLES)) {
  const ids = new Set();
  const codes = new Set();
  for (const diff of ['easy', 'hard', 'expert']) {
    const def = BF.bossBattleDef(bossId, diff);
    if (!def) continue;
    for (const p of def.phases) {
      if (ids.has(p.id)) fail(bossId + ' 阶段 id 重复: ' + p.id);
      ids.add(p.id);
      if (codes.has(p.initialCode)) fail(bossId + ' 初始代码重复: ' + p.id);
      codes.add(p.initialCode);
    }
  }
}

const totalPhases = results.length;
const totalChecks = results.reduce((s, r) => s + r.total, 0);
console.log('\n=== 汇总 ===');
console.log('阶段：' + totalPhases + '，测试用例：' + totalChecks + '，失败：' + failures);
if (failures > 0) process.exit(1);
console.log('全部难度配置通过真实执行审计');
