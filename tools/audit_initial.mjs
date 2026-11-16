// 自检：每一关的「初始故障代码」都应当无法通过判题；否则该关没有修复目标。
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
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require'); });
  return mod.exports;
}

const { LEVELS } = loadTS(join(root, 'src/game/levels.ts'));
const { judgeRun, buildHarness, combineWithHarness, parseTraceback } = loadTS(join(root, 'src/services/judge.ts'));
const RUNNER = readFileSync(join(root, 'test/_mp_runner.py'), 'utf8');

let raw = '';
const mp = await loadMicroPython({
  url: join(root, 'node_modules/@micropython/micropython-webassembly-pyscript/micropython-settrace.wasm'),
  stdout: (s) => { raw += s; }, stderr: (s) => { raw += s; },
});
const pyStr = (s) => JSON.stringify(String(s));
function extract(marker) {
  const i = raw.lastIndexOf(marker);
  if (i < 0) return null;
  try { return JSON.parse(raw.slice(i + marker.length).trim()); } catch { return null; }
}
function run(code) {
  raw = '';
  mp.runPython(RUNNER.replace('__NX_SRC__', pyStr(code)));
  const res = extract('__NX_RES__');
  return { ok: res ? !res.err : false, stdout: res ? (res.out || '') : '', error: res && res.err ? parseTraceback(res.err) : undefined };
}

let bad = 0;
for (const lv of LEVELS) {
  let code = lv.initialCode;
  if (lv.judge.judgeKind === 'python') code = combineWithHarness(code, buildHarness(lv.judge.pythonChecks || []));
  const r = run(code);
  const v = judgeRun(lv.judge, { ...r, timedOut: false });
  if (v.passed) {
    bad++;
    console.log('!!! 初始代码直接通过 | ' + lv.id + ' ' + lv.title);
  } else {
    const why = v.error ? v.error.type + ':' + (v.error.message || '').slice(0, 50) : v.checks.map(c => (c.ok ? '✓' : '✗') + c.name).join(' ');
    console.log('ok  ' + lv.id.padEnd(5) + ' 初始代码失败（' + why.slice(0, 100) + '）');
  }
}
console.log(bad === 0 ? '全部关卡初始代码均未通过（正常）' : '发现 ' + bad + ' 关初始代码已是正确解！');
