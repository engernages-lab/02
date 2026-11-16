// V1.1.1 真实判题回归：六章 24 个 Boss 阶段全部用 MicroPython 真实执行，
// 判题 → 伤害 → 阶段击破 → 统一首胜事务 → 碎片 / 章节解锁，全链路不经过任何桩。
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';

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
const CF = L('src/game/chapterFlow.ts');
const BS = L('src/game/bosses.ts');
const SV = L('src/services/save.ts');
const CH = L('src/game/lore/chapters.ts');
const LV = L('src/game/levels.ts');
const F = L('src/game/lore/fragments.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

// 每个阶段的正确解（与 tools/audit_boss_solutions.mjs 一致）
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
  if (i < 0) return { ok: false, stdout: '', stderr: '', timedOut: false, error: { type: 'NoResult', message: 'no result' } };
  try {
    const r = JSON.parse(raw.slice(i + '__NX_RES__'.length).trim());
    return {
      ok: !r.err,
      stdout: r.out || '',
      stderr: '',
      timedOut: false,
      error: r.err ? { type: String(r.err).split(':')[0] || 'Error', message: String(r.err) } : undefined,
    };
  } catch {
    return { ok: false, stdout: '', stderr: '', timedOut: false, error: { type: 'ParseFail', message: 'parse fail' } };
  }
}

let player = SV.defaultState();
const chapters = [...CH.CHAPTERS];
let phaseRuns = 0;
let testRuns = 0;

for (const ch of chapters) {
  const bossId = ch.currentBossId;
  const boss = BS.bossById(bossId);
  const def = B.battleFor(bossId);
  check(!!boss && !!def, '第 ' + ch.order + ' 章 Boss 与战斗数据存在');

  // 普通关卡：第一~五章需要全部完成；第六章外围关卡不影响原初核心（此处只完成前五章）
  if (ch.order <= 5) {
    const ids = LV.levelsOfServer(ch.serverId).map(l => l.id);
    player.progress.completedLevels = [...new Set([...player.progress.completedLevels, ...ids])];
    player.progress.flags[ch.doneFlag] = true;
  }

  // 门禁：Boss 必须在上一章首胜后才开放
  const gate = CF.bossGate(player, bossId);
  check(gate.available, '第 ' + ch.order + ' 章 Boss 门禁开放（' + bossId + '）', gate.reason);

  let state = B.createBattleState(def);
  for (const [idx, phase] of def.phases.entries()) {
    // 1) 初始故障版本：真实执行 + 真实判题，必须不造成伤害
    const initialCombined = J.combineWithHarness(phase.initialCode, J.buildHarness(phase.judge.pythonChecks || []));
    const ir = runCode(initialCombined);
    testRuns++;
    const iv = J.judgeRun(phase.judge, ir);
    const ires = B.resolveSubmission(def, state, idx, iv.checks);
    check(ires.newPassed === 0 && ires.damage === 0, phase.id + ' 初始故障版不造成伤害（真实执行）', 'newPassed=' + ires.newPassed);

    // 2) 正确解：真实执行 → 判题全过 → 阶段击破
    const fixed = FIX[phase.id];
    check(!!fixed, phase.id + ' 存在正确解');
    const combined = J.combineWithHarness(fixed, J.buildHarness(phase.judge.pythonChecks || []));
    const r = runCode(combined);
    phaseRuns++;
    const v = J.judgeRun(phase.judge, r);
    check(v.passed, phase.id + ' 真实判题全部通过' + (r.error ? ' [' + r.error.type + ']' : ''), JSON.stringify(v.checks));
    const res = B.resolveSubmission(def, state, idx, v.checks);
    check(res.phaseCleared, phase.id + ' 阶段击破');
    state = {
      ...state,
      hp: res.hpAfter,
      phase: res.phaseAfter,
      phaseMask: state.phaseMask.map((m, i) => (i === idx ? res.mask : m)),
      cleared: false,
      updatedAt: 1,
    };
    const proof = CF.verifyBattleState(def, state);
    if (idx < def.phases.length - 1) {
      check(!proof.ok || state.phase < def.phases.length, phase.id + ' 非最终阶段不判定整场胜利');
    }
  }

  state.cleared = CF.verifyBattleState(def, state).ok;
  check(state.hp === 0 && state.phase === def.phases.length && state.cleared, bossId + ' 四阶段全部击破、血量归零');
  check(CF.verifyBossVictory({
    ...player,
    progress: { ...player.progress, battles: { [bossId]: state } },
  }, bossId).ok, bossId + ' 真实战斗校验通过');

  player.progress.battles = { ...(player.progress.battles || {}), [bossId]: state };
  const first = CF.handleBossFirstClear(player, bossId, { now: 1000 + ch.order });
  check(first.changed && first.payload, bossId + ' 统一首胜事务执行');
  if (!first.changed) { console.log('  reason:', first.reason); break; }
  player = first.player;
  check(F.hasFragment(player.meta.memoryFragments, ch.fragmentId), bossId + ' 发放对应碎片 ' + ch.shardId);
  check(player.progress.chapters[ch.id].completed, bossId + ' 章节完成');
  if (ch.order < 6) {
    const nextGate = CF.chapterGate(player, chapters[ch.order].id);
    check(nextGate.unlocked, '第 ' + (ch.order + 1) + ' 章解锁');
  }

  // 重复挑战（模拟再战）：不重复发放
  const before = JSON.stringify({
    fragments: player.meta.memoryFragments,
    credits: player.rewards.credits,
    exp: player.exp,
  });
  const again = CF.handleBossFirstClear(player, bossId, { now: 9999 });
  check(!again.changed, bossId + ' 重复首胜被拒绝');
  check(before === JSON.stringify({
    fragments: player.meta.memoryFragments,
    credits: player.rewards.credits,
    exp: player.exp,
  }), bossId + ' 重复挑战不改变碎片 / 贡献点 / 经验');
}

console.log('=== 汇总 ===');
check(F.ownedFragments(player.meta.memoryFragments).length === 6, '六枚碎片全部来自六个 Boss 首胜');
check(player.progress.chapters.ch6.completed, 'K-0 首胜 → 终章完成');
check(player.progress.flags.gameCompleted === true, '全网络复原标记');
check(F.finalMemoryUnlocked(player.meta.memoryFragments), '最终记忆解锁');

console.log('\n真实执行：' + testRuns + ' 次初始故障版 + ' + phaseRuns + ' 次正确解（共 ' + (testRuns + phaseRuns) + ' 次 MicroPython 运行）');
console.log('=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
