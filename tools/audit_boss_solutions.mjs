// 自检：六场 Boss 战的每个阶段都可以用「修复后的正确代码」全部通过
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
  try { const r = JSON.parse(raw.slice(i + '__NX_RES__'.length).trim()); return { ok: !r.err, stdout: r.out || '', error: r.err }; }
  catch { return { ok: false, stdout: '', error: 'parse fail' }; }
}

const FIX = {
  'gate-p1': 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))',
  'gate-p2': 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"',
  'gate-p3': 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))',
  'gate-p4': 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))',
  'som-p1': 'def classify(tag):\n    if tag == "error":\n        return "ALERT"\n    else:\n        return "PASS"\n\nprint(classify("error"))',
  'som-p2': 'def guard(temp, pressure):\n    if temp > 90 and pressure > 150:\n        return "OVERLOAD"\n    return "SAFE"',
  'som-p3': 'def scan(logs):\n    out = []\n    for lv in logs:\n        if lv == "error":\n            out.append("FAIL")\n        elif lv == "warn":\n            out.append("WARN")\n        else:\n            out.append("PASS")\n    return out\n\nprint(scan(["ok", "warn", "error"]))',
  'som-p4': 'def recover(nodes):\n    good = []\n    for n in nodes:\n        if n >= 1 and n <= 99:\n            good.append(n)\n    return good\n\nprint(recover([0, 5, 120]))',
  'idx-p1': 'def find_id(name, names):\n    for i in range(len(names)):\n        if names[i] == name:\n            return i\n    return -1',
  'idx-p2': 'def read_names(rows):\n    names = []\n    for row in rows:\n        if row[0] > 0:\n            names.append(row[1])\n    return names',
  'idx-p3': 'def dedupe(ids):\n    out = []\n    i = 0\n    while i < len(ids):\n        x = ids[i]\n        if x != -1 and x not in out:\n            out.append(x)\n        i = i + 1\n    return out',
  'idx-p4': 'def restore(records):\n    names = []\n    for row in records:\n        if row[0] > 0 and row[1] not in names:\n            names.append(row[1])\n    return names',
  'jd-p1': 'def power_ok(levels):\n    for x in levels:\n        if x < 1:\n            return False\n    return True',
  'jd-p2': 'def verdict(score):\n    if score >= 90:\n        return "CLEAR"\n    if score >= 60:\n        return "HOLD"\n    return "BLOCK"',
  'jd-p3': 'def unlock(a, b, c):\n    if a == "root" and b == "root" and c == "root":\n        return True\n    return False',
  'jd-p4': 'def restore_cmd(ids):\n    out = []\n    for x in ids:\n        if x > 0 and x not in out:\n            out.append(x)\n    return out',
  'en-p1': 'def clean(values):\n    out = []\n    for v in values:\n        if v > 0:\n            out.append(v)\n    return out',
  'en-p2': 'def lookup(table, key):\n    return table.get(key, 0)',
  'en-p3': 'def to_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0',
  'en-p4': 'def repair(rows):\n    total = 0\n    for r in rows:\n        try:\n            total = total + int(r)\n        except ValueError:\n            continue\n    return total',
  'k0-p1': 'def pass_gate(a, b, c):\n    if a and b and c:\n        return True\n    return False',
  'k0-p2': 'def judge(score):\n    if score >= 90:\n        return "PASS"\n    if score >= 60:\n        return "REVIEW"\n    return "REJECT"',
  'k0-p3': 'def merge(a, b):\n    out = dict(a)\n    for k in b:\n        if k not in out or b[k] > out[k]:\n            out[k] = b[k]\n    return out',
  'k0-p4': 'def final_repair(rows):\n    total = 0\n    for r in rows:\n        try:\n            total = total + int(r)\n        except ValueError:\n            continue\n    return "STABLE" if total >= 0 else "UNSTABLE"',
};

let bad = 0, total = 0;
for (const b of B.BOSS_BATTLES) {
  let state = { hp: b.maxHp, maxHp: b.maxHp, phase: 0, phaseMask: b.phases.map(() => 0), fails: 0 };
  b.phases.forEach((p, idx) => {
    total++;
    const fixed = FIX[p.id];
    if (!fixed) { console.log('!!! 缺少正确解 ' + p.id); bad++; return; }
    const code = J.combineWithHarness(fixed, J.buildHarness(p.judge.pythonChecks || []));
    const r = run(code);
    const v = J.judgeRun(p.judge, { ...r, timedOut: false });
    const res = B.resolveSubmission(b, state, idx, v.checks || []);
    state = { ...state, hp: res.hpAfter, phase: res.phaseAfter, phaseMask: state.phaseMask.map((m, i) => i === idx ? res.mask : m) };
    const ok = v.passed && res.phaseCleared;
    if (!ok) bad++;
    console.log((ok ? 'ok  ' : '!!! ') + b.bossId + ' ' + p.id + ' 正确解通过=' + v.passed + ' 阶段击破=' + res.phaseCleared + ' 血量=' + res.hpAfter +
      (v.error ? ' err=' + v.error : ''));
  });
  console.log('  ' + b.bossId + ' 最终血量=' + state.hp + ' phase=' + state.phase);
  if (state.hp !== 0) { console.log('!!! ' + b.bossId + ' 无法被击破'); bad++; }
}
console.log(bad === 0 ? '全部 ' + total + ' 个 Boss 阶段均可真实击破' : '发现 ' + bad + ' 处问题');
