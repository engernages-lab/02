// 用与游戏 worker 完全一致的 MicroPython 执行器重跑判题回归
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const req = createRequire(join(root, 'package.json'));
const ts = req('typescript');

function loadTS(file) {
  const src = readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require allowed'); });
  return mod.exports;
}

const { LEVELS } = loadTS(join(root, 'src/game/levels.ts'));
const { judgeRun, parseTraceback } = loadTS(join(root, 'src/services/judge.ts'));
const { DEFENSE_TASKS, judgeDefenseResult } = loadTS(join(root, 'src/game/defense.ts'));

const casesDir = join(__dirname, 'cases');
const meta = JSON.parse(readFileSync(join(casesDir, 'meta.json'), 'utf8'));
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

let pass = 0, total = 0;
const failures = [];

for (const m of meta) {
  total++;
  const code = readFileSync(join(casesDir, m.file), 'utf8');
  raw = '';
  const script = RUNNER.replace('__NX_SRC__', pyStr(code));
  mp.runPython(script);
  const res = extract('__NX_RES__');
  const runOut = res ? (res.out || '') : '';
  const ok = res ? !res.err : false;
  const errText = res && res.err ? res.err : '';

  if (m.defense) {
    const task = DEFENSE_TASKS.find(t => t.id === m.defense);
    const v = judgeDefenseResult({ ok, stdout: runOut, timedOut: false }, task);
    const good = v.ok === m.good;
    if (good) pass++; else failures.push(m.file + ': expected ' + m.good + ' got ' + v.ok);
    console.log((good ? 'PASS' : 'FAIL') + ' | defense ' + m.defense + ' good=' + m.good + ' got=' + v.ok + (v.reason ? ' [' + v.reason + ']' : ''));
    continue;
  }

  const level = LEVELS.find(l => l.id === m.id);
  const v = judgeRun(level.judge, {
    ok,
    stdout: runOut,
    timedOut: false,
    error: ok ? undefined : parseTraceback(errText),
  });
  const good = v.passed === m.expect;
  if (good) pass++;
  else failures.push(m.file + ' (' + m.id + '): expected pass=' + m.expect + ' got=' + v.passed +
    (v.error ? ' err=' + v.error.type + '@' + v.error.line : '') + ' out=' + JSON.stringify(runOut.slice(0, 100)));
  console.log((good ? 'PASS' : 'FAIL') + ' | ' + m.id + ' expect=' + m.expect + ' got=' + v.passed +
    (v.error ? ' [' + v.error.type + (v.error.line ? '@' + v.error.line : '') + ']' : ''));
}

console.log('=== MicroPython 判题回归：' + pass + '/' + total + ' ===');
if (failures.length) {
  console.log('失败明细：');
  failures.slice(0, 20).forEach(f => console.log('  - ' + f));
  process.exit(1);
}
