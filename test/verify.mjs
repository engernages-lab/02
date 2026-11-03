import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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
const lines = readFileSync(join(casesDir, 'runall.out'), 'utf8').trim().split('\n').filter(Boolean);
const runs = lines.map(l => JSON.parse(l));
const byFile = new Map(runs.map(r => [r.file, r]));

let pass = 0, total = 0;
const failures = [];

for (const m of meta) {
  total++;
  const run = byFile.get(m.file);
  if (!run) { failures.push(m.file + ': 缺少执行结果'); console.log('FAIL | ' + m.file + ' 缺少执行结果'); continue; }
  const ok = run.rc === 0;

  if (m.defense) {
    const task = DEFENSE_TASKS.find(t => t.id === m.defense);
    const v = judgeDefenseResult({ ok, stdout: run.out, timedOut: false }, task);
    const good = v.ok === m.good;
    if (good) pass++; else failures.push(m.file + ': expected ' + m.good + ' got ' + v.ok);
    console.log((good ? 'PASS' : 'FAIL') + ' | defense ' + m.defense + ' good=' + m.good + ' got=' + v.ok + (v.reason ? ' [' + v.reason + ']' : ''));
    continue;
  }

  const level = LEVELS.find(l => l.id === m.id);
  const v = judgeRun(level.judge, {
    ok,
    stdout: run.out,
    timedOut: false,
    error: ok ? undefined : parseTraceback(run.err),
  });
  const good = v.passed === m.expect;
  if (good) pass++;
  else failures.push(m.file + ' (' + m.id + '): expected pass=' + m.expect + ' got=' + v.passed + (v.error ? ' err=' + v.error.type : ''));
  console.log((good ? 'PASS' : 'FAIL') + ' | ' + m.id + ' expect=' + m.expect + ' got=' + v.passed +
    (v.error ? ' [' + v.error.type + (v.error.line ? '@' + v.error.line : '') + ']' : ''));
}

console.log('=== 判题链路测试：' + pass + '/' + total + ' ===');
if (failures.length) {
  console.log('失败明细：');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
