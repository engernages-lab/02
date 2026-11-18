// V1.3-A.1 真实执行回归：用真实 MicroPython 引擎验证每个独立挑战
// 参考解 → 公开判题 + 隐藏判题都应通过；初始代码 → 整体判题应失败（可玩性 + 难度成立）。
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const wasmDir = join(root, 'node_modules', '@micropython', 'micropython-webassembly-pyscript');
const ts = createRequire(join(root, 'package.json'))('typescript');

const cache = new Map();
function load(file) {
  const abs = file;
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = readFileSync(abs, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  cache.set(abs, mod);
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => {
    const base = join(dirname(abs), sp);
    const cand = existsSync(base) && extname(base) ? base : existsSync(base + '.ts') ? base + '.ts' : base + '/index.ts';
    return load(cand);
  });
  return mod.exports;
}
const L = (rel) => load(join(root, rel));

const Judge = L('src/services/judge.ts');
const PythonRunner = L('src/services/pythonRunner.ts');
const Templates = L('src/game/challengeTemplates.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };

function extract(raw, marker) {
  const i = raw.lastIndexOf(marker);
  if (i < 0) return null;
  try { return JSON.parse(raw.slice(i + marker.length).trim()); } catch { return null; }
}

let buf = '';
const mp = await loadMicroPython({
  url: join(wasmDir, 'micropython-settrace.wasm'),
  stdout: (s) => { buf += s; },
  stderr: (s) => { buf += s; },
});

function run(code) {
  buf = '';
  try { mp.runPython(PythonRunner.buildRunnerScript(code, 5)); } catch { /* engine error → res missing */ }
  const res = extract(buf, '__NX_RES__');
  const out = res ? String(res.out ?? '') : '';
  const err = res ? String(res.err ?? '') : '';
  return { ok: !err, stdout: out, err };
}

function judgePublic(def, code) {
  const combined = def.judge.judgeKind === 'python'
    ? Judge.combineWithHarness(code, Judge.buildHarness(def.judge.pythonChecks || []))
    : code;
  const r = run(combined);
  return { run: r, verdict: Judge.judgeRun(def.judge, { ok: r.ok, stdout: r.stdout, timedOut: false }) };
}

function judgeHidden(def, code) {
  const checks = def.hiddenChecks || [];
  if (checks.length === 0) return { total: 0, passed: 0, verdict: { passed: true, checks: [] } };
  const combined = Judge.combineWithHarness(code, Judge.buildHarness(checks));
  const r = run(combined);
  const verdict = Judge.judgeRun({ judgeKind: 'python', pythonChecks: checks }, { ok: r.ok, stdout: r.stdout, timedOut: false });
  const passed = (verdict.checks || []).filter(c => c.ok).length;
  return { total: checks.length, passed, verdict };
}

console.log('=== 安全策略 ===');
{
  const ref = Templates.independentChallengeById('ind-timed').reference;
  ok(Judge.checkUserCode(ref).allowed, '参考解通过安全检查');
  ok(!Judge.checkUserCode('import os\nos.system("x")').allowed, '越权模块被拦截');
}

for (const def of Templates.INDEPENDENT_CHALLENGES) {
  console.log('=== 挑战：' + def.id + ' · ' + def.title + ' ===');
  // 参考解：公开判题通过
  const refPub = judgePublic(def, def.reference);
  ok(refPub.run.ok, def.id + ' 参考解可正常执行', refPub.run.err);
  ok(refPub.verdict.passed, def.id + ' 参考解通过公开判题', JSON.stringify(refPub.verdict.checks));

  // 参考解：隐藏判题全通过
  const refHid = judgeHidden(def, def.reference);
  if (refHid.total > 0) ok(refHid.passed === refHid.total, def.id + ' 参考解通过全部隐藏用例 ' + refHid.passed + '/' + refHid.total + '（表达式不外泄）');

  // 初始代码：整体（公开 && 隐藏）应为失败
  const initPub = judgePublic(def, def.initialCode);
  const initHid = judgeHidden(def, def.initialCode);
  const overallPass = initPub.verdict.passed && initHid.passed === initHid.total;
  ok(!overallPass, def.id + ' 初始代码整体判题失败（挑战有难度）',
    'public=' + initPub.verdict.passed + ' hidden=' + initHid.passed + '/' + initHid.total);

  // 隐藏挑战：初始代码应能骗过公开用例但栽在隐藏用例（体现隐藏用例价值）
  if (def.id === 'ind-hidden') {
    ok(initPub.verdict.passed === true, 'ind-hidden 初始代码可通过公开用例（表面正常）');
    ok(initHid.passed < initHid.total, 'ind-hidden 初始代码在隐藏用例上失败（隐藏用例生效）');
  }
}

console.log('=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
