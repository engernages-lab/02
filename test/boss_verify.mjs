// 验证 5 个章节 Boss（GATE-01 + ECHO-02~05）的判题（正确版应通过、原始故障版应失败）+ 实验室判题路径
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function loadTS(file) {
  const src = readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require'); });
  return mod.exports;
}

const { BOSSES } = loadTS(join(root, 'src/game/bosses.ts'));
const { judgeRun, buildHarness, combineWithHarness } = loadTS(join(root, 'src/services/judge.ts'));
const RUNNER = readFileSync(join(__dirname, '_mp_runner.py'), 'utf8');

let raw = '';
const mp = await loadMicroPython({
  url: join(root, 'node_modules', '@micropython', 'micropython-webassembly-pyscript', 'micropython-settrace.wasm'),
  stdout: (s) => { raw += s; },
  stderr: (s) => { raw += s; },
});
const pyStr = (s) => JSON.stringify(String(s));
function extract(marker) {
  const i = raw.lastIndexOf(marker);
  if (i < 0) return null;
  try { return JSON.parse(raw.slice(i + marker.length).trim()); } catch { return null; }
}
function runCode(code) {
  raw = '';
  mp.runPython(RUNNER.replace('__NX_SRC__', pyStr(code)));
  const res = extract('__NX_RES__');
  return { ok: res ? !res.err : false, stdout: res ? (res.out || '') : '', err: res ? res.err : 'no result' };
}

const FIXED = {
  'gate-01': 'def power(level):\n    if level >= 3:\n        return "ONLINE"\n    else:\n        return "OFFLINE"\n\ndef report(levels):\n    out = ""\n    for lv in levels:\n        out = out + power(lv) + " "\n    return out\n\nprint(report([3, 1, 5]))',
  'somnia': 'def classify(tag):\n    if tag == "error":\n        return "ALERT"\n    else:\n        return "PASS"',
  'echo-03': 'def highest(nums):\n    best = nums[0]\n    for n in nums:\n        if n > best:\n            best = n\n    return best',
  'echo-04': 'def total_after_discount(prices, rate):\n    total = 0\n    for p in prices:\n        total = total + p\n    return total * (1 - rate)',
  'echo-05': 'def safe_sum(records):\n    total = 0\n    for k in records:\n        try:\n            total = total + int(records[k])\n        except ValueError:\n            pass\n    return total',
};

let pass = 0, total = 0;
for (const b of BOSSES) {
  total += 1;
  const fixed = FIXED[b.id];
  // 正确版
  const combined = b.judge.judgeKind === 'python' ? combineWithHarness(fixed, buildHarness(b.judge.pythonChecks || [])) : fixed;
  const r1 = runCode(combined);
  const v1 = judgeRun(b.judge, r1);
  const ok1 = v1.passed === true;
  if (ok1) pass++;
  console.log((ok1 ? 'PASS' : 'FAIL') + ' | ' + b.id + ' 正确版 => ' + v1.passed + (v1.error ? ' err=' + v1.error.type : ''));

  // 故障版（应失败）
  const combinedBad = b.judge.judgeKind === 'python' ? combineWithHarness(b.initialCode, buildHarness(b.judge.pythonChecks || [])) : b.initialCode;
  const r2 = runCode(combinedBad);
  const v2 = judgeRun(b.judge, r2);
  const ok2 = v2.passed === false;
  if (ok2) pass++;
  total += 1;
  console.log((ok2 ? 'PASS' : 'FAIL') + ' | ' + b.id + ' 故障版 => ' + v2.passed);
}

// 实验室 P1 判题路径（debug 模式 stdout 拼接）
const { LAB_MISSIONS } = loadTS(join(root, 'src/game/playground.ts'));
const P1 = LAB_MISSIONS[0];
const rLab = runCode('print("WELCOME TO NEXUS")');
const labOk = P1.expect.every(s => rLab.stdout.includes(s));
console.log((labOk ? 'PASS' : 'FAIL') + ' | 实验室 ' + P1.id + ' 输出=' + JSON.stringify(rLab.stdout));
if (labOk) pass++;
total++;

console.log('=== Boss/实验室判题：' + pass + '/' + total + ' ===');
process.exit(pass === total ? 0 : 1);
