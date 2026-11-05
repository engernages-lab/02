// Boss 战系统：数据 / 伤害计算 / 知识点覆盖 / 真实 Python 判题 全链路验证
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
  function resolveFile(base) {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  }
  function load(file) {
    const abs = resolveFile(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
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

const load = makeLoader();
const B = load('src/game/battle.ts');
const J = load('src/services/judge.ts');
const { BOSSES } = load('src/game/bosses.ts');
const FR = load('src/game/lore/fragments.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

console.log('=== 1. 战斗数据与知识点覆盖 ===');
const def = B.GATE01_BATTLE;
check(!!def, 'GATE-01 有战斗配置');
check(def.phases.length === 4, 'GATE-01 共 4 个阶段');
eq(def.phases.map(p => p.title), ['能源启动程序', '防御逻辑', '数据传输模块', '综合服务器恢复'], '四个阶段标题符合需求');
check(def.maxHp === 100, '总血量 100');
check(def.counterDamage > 0, 'Boss 反击有意识伤害');
check(B.battleFor('gate-01') === def, 'battleFor(gate-01) 命中');
check(B.battleFor('echo-02') === undefined, '其余章节暂未启用战斗框架');

eq(B.knowledgeViolations(def), [], '所有阶段考点都在第一章已教范围内');
const ch1 = B.CHAPTER1_KNOWLEDGE;
['print', 'if', 'indent', 'string', 'variable', 'compare', 'for', 'list', 'return'].forEach(k => {
  check(ch1.includes(k), '第一章知识点包含 ' + k);
});
check(!ch1.includes('dict') && !ch1.includes('try') && !ch1.includes('while') && !ch1.includes('elif'),
  '第一章知识点不包含后续章节内容（dict/try/while/elif）');
def.phases.forEach((p, i) => {
  check(p.knowledge.length > 0 && p.knowledge.every(k => ch1.includes(k)), '阶段 ' + (i + 1) + ' 考点均属第一章');
  check(p.judge.judgeKind === 'python', '阶段 ' + (i + 1) + ' 使用函数断言判题');
  check(B.phaseCheckCount(p) >= 3, '阶段 ' + (i + 1) + ' 至少 3 条测试');
});

console.log('=== 2. 状态与伤害计算 ===');
let st = B.createBattleState(def);
check(st.hp === 100 && st.phase === 0 && !st.cleared, '初始状态满血第一阶段');
check(B.hpPercent(st) === 100, '初始血量百分比 100');
eq(B.phaseHp(def), 25, '每阶段血量 25');

// 合成阶段（4 条测试、无基线）验证比例伤害
const synthPhase = {
  ...def.phases[0],
  baselineMask: 0,
  judge: { judgeKind: 'python', pythonChecks: [0, 1, 2, 3].map(i => ({ name: 't' + i, expr: 'True' })) },
};
const synth = { ...def, maxHp: 100, phases: [synthPhase] };
let sst = B.createBattleState(synth);
let r = B.resolveSubmission(synth, sst, 0, [{ ok: true }, { ok: false }, { ok: false }, { ok: false }]);
check(r.newPassed === 1 && r.damage === 25 && r.hpAfter === 75, '通过 1/4 → 25 点伤害（100 → 75）', JSON.stringify(r));
check(!r.phaseCleared, '部分通过不破阶段');
sst = { ...sst, hp: r.hpAfter, phaseMask: [r.mask] };
r = B.resolveSubmission(synth, sst, 0, [{ ok: true }, { ok: false }, { ok: false }, { ok: false }]);
check(r.newPassed === 0 && r.damage === 0 && r.hpAfter === 75, '重复通过同一测试不再造成伤害');
r = B.resolveSubmission(synth, sst, 0, [{ ok: true }, { ok: true }, { ok: false }, { ok: false }]);
check(r.newPassed === 1 && r.damage === 25 && r.hpAfter === 50, '新通过 1 条 → 再扣 25 点');
r = B.resolveSubmission(synth, sst, 0, [{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
check(r.phaseCleared && r.defeated && r.hpAfter === 0, '全部通过 → 阶段击破且整场胜利');

// 真实阶段的基线：初始故障版本来就能通过的项不算伤害
def.phases.forEach((p, i) => {
  const st0 = B.createBattleState(def);
  const baselineChecks = (p.judge.pythonChecks || []).map((_, k) => ({ ok: !!(p.baselineMask & (1 << k)) }));
  const rb = B.resolveSubmission(def, st0, i, baselineChecks);
  check(rb.newPassed === 0 && rb.damage === 0, '阶段 ' + (i + 1) + ' 初始故障版不造成伤害（基线位不算）');
});
// 修好第一阶段的关键项：3 条测试全过 → 阶段击破
{
  const st0 = B.createBattleState(def);
  const p1 = def.phases[0];
  const checks = (p1.judge.pythonChecks || []).map((_, k) => ({ ok: (p1.baselineMask & (1 << k)) !== 0 || k === 0 }));
  const rr = B.resolveSubmission(def, st0, 0, checks);
  check(rr.newPassed === 1 && rr.phaseCleared && rr.hpAfter === 75, '修好临界值 → 新通过 1 项并击破阶段（扣 25）', JSON.stringify(rr));
}
// 基线位之外的新通过才计伤害（合成 4 测试 / 基线 1）
{
  const synth2 = {
    ...def, maxHp: 100,
    phases: [{ ...def.phases[0], baselineMask: 1, judge: { judgeKind: 'python', pythonChecks: [0, 1, 2, 3].map(i => ({ name: 't' + i, expr: 'True' })) } }],
  };
  const rr = B.resolveSubmission(synth2, B.createBattleState(synth2), 0, [{ ok: true }, { ok: true }, { ok: false }, { ok: false }]);
  check(rr.newPassed === 1 && rr.damage === 25, '基线位之外新通过 1 条才计伤害', JSON.stringify(rr));
}
// 全部失败 → 0 伤害
const r0 = B.resolveSubmission(def, B.createBattleState(def), 0, [{ ok: false }, { ok: false }, { ok: false }]);
check(r0.damage === 0 && r0.newPassed === 0 && !r0.phaseCleared, '全部未通过 → 0 伤害（不算战斗失败）');

// 最后一阶段击破 → 整场胜利
const finalState = { ...B.createBattleState(def), hp: 25, phase: 3, phaseMask: [7, 15, 7, 0] };
const rf = B.resolveSubmission(def, finalState, 3, [{ ok: true }, { ok: true }, { ok: true }]);
check(rf.defeated === true && rf.hpAfter === 0, '最后一阶段击破 → 血量归零、整场胜利');
check(rf.phaseAfter === 4, '阶段计数到 4');

console.log('=== 3. 存档状态清洗 ===');
const bad = B.normalizeBattleState({ hp: 999, phase: 99, phaseMask: [999, -5], failures: -3, maxHp: 0 }, def);
check(bad.hp <= def.maxHp && bad.phase <= 4, '异常血量/阶段被夹紧');
check(bad.failures === 0, '负数失败次数被归零');
check(bad.phaseMask.length === 4, '位掩码长度与阶段数一致');
check(bad.phaseMask[0] <= B.fullMask(3), '位掩码不超过测试位数');
const empty = B.normalizeBattleState(undefined, def);
check(empty.hp === 100 && empty.phase === 0, '空数据得到满血初始状态');
check(B.normalizeBattleState({ hp: 0, phase: 4 }, def).cleared === true, '血量归零/阶段走完视为已击破');

console.log('=== 4. 真实 Python 判题 → 战斗结果（MicroPython） ===');
const RUNNER = readFileSync(join(__dirname, '_mp_runner.py'), 'utf8');
let raw = '';
const mp = await loadMicroPython({
  url: join(root, 'node_modules', '@micropython/micropython-webassembly-pyscript', 'micropython-settrace.wasm'),
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
  return { ok: res ? !res.err : false, stdout: res ? (res.out || '') : '', err: res ? res.err : 'no result', timedOut: false };
}

const FIXED = [
  'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))',
  'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"',
  'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))',
  'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))',
];

def.phases.forEach((p, i) => {
  // 初始故障版：必须打不动
  const badRun = runCode(J.combineWithHarness(p.initialCode, J.buildHarness(p.judge.pythonChecks || [])));
  const badVerdict = J.judgeRun(p.judge, badRun);
  const badRes = B.resolveSubmission(def, B.createBattleState(def), i, badVerdict.checks);
  check(badVerdict.passed === false, '阶段 ' + (i + 1) + ' 初始故障版判题不通过');
  check(badRes.newPassed === 0 && badRes.damage === 0, '阶段 ' + (i + 1) + ' 故障版造成 0 伤害');

  // 正确版：必须击破
  const goodRun = runCode(J.combineWithHarness(FIXED[i], J.buildHarness(p.judge.pythonChecks || [])));
  const goodVerdict = J.judgeRun(p.judge, goodRun);
  check(goodVerdict.passed === true, '阶段 ' + (i + 1) + ' 正确版判题通过', JSON.stringify(goodVerdict.error || ''));
  const start = { ...B.createBattleState(def), hp: def.maxHp - i * 25, phase: i, phaseMask: def.phases.map((_, k) => (k < i ? 7 : 0)) };
  const goodRes = B.resolveSubmission(def, start, i, goodVerdict.checks);
  check(goodRes.phaseCleared === true, '阶段 ' + (i + 1) + ' 真实判题通过 → 防御破裂');
  check(goodRes.hpAfter === def.maxHp - (i + 1) * 25, '阶段 ' + (i + 1) + ' 血量正确结算');
});

console.log('=== 5. Boss 与战斗配置绑定 ===');
const gate = BOSSES.find(b => b.id === 'gate-01');
check(!!gate && gate.fragmentId === 'frag-01', 'GATE-01 对应第一枚碎片');
check(gate && gate.knowledge.every(k => ch1.includes(k)), 'Boss 主数据知识点也在第一章范围内');

console.log('=== 6. 第二章 SOMNIA（Boss / 知识点 / 真实判题） ===');
const som = B.battleFor('somnia');
check(!!som, 'SOMNIA 有战斗配置');
check(som && som.phases.length === 4, 'SOMNIA 共 4 个阶段');
eq(som.phases.map(p => p.title), ['记忆分流', '逻辑校验', '循环筛查', '综合记忆重建'], 'SOMNIA 四个阶段标题');
check(som && som.maxHp === 100, 'SOMNIA 总血量 100');
check(som && som.chapter === 2, 'SOMNIA 属于第二章');
const ch2Allowed = B.cumulativeKnowledge(2);
eq(B.knowledgeViolations(som), [], 'SOMNIA 所有考点都在第一~二章累计范围内');
check(!ch2Allowed.includes('dict') && !ch2Allowed.includes('try') && !ch2Allowed.includes('while'),
  '第二章累计知识点不含 dict/try/while');
const somBoss = BOSSES.find(b => b.id === 'somnia');
check(!!somBoss && somBoss.fragmentId === 'frag-02', 'SOMNIA 掉落第二枚碎片 frag-02');
check(somBoss && somBoss.fragmentId && FR.fragmentById(somBoss.fragmentId).title === '守护者的约定',
  'frag-02 即《守护者的约定》');
check(!BOSSES.some(b => b.id === 'echo-02'), '旧 ECHO-02 已被 SOMNIA 取代');

const SOM_FIXED = [
  'def classify(tag):\n    if tag == "error":\n        return "ALERT"\n    else:\n        return "PASS"\n\nprint(classify("error"))',
  'def guard(temp, pressure):\n    if temp > 90 and pressure > 150:\n        return "OVERLOAD"\n    return "SAFE"',
  'def scan(logs):\n    out = []\n    for lv in logs:\n        if lv == "error":\n            out.append("FAIL")\n        elif lv == "warn":\n            out.append("WARN")\n        else:\n            out.append("PASS")\n    return out\n\nprint(scan(["ok", "warn", "error"]))',
  'def recover(nodes):\n    good = []\n    for n in nodes:\n        if n >= 1 and n <= 99:\n            good.append(n)\n    return good\n\nprint(recover([0, 5, 120]))',
];

som.phases.forEach((p, i) => {
  const badV = J.judgeRun(p.judge, runCode(J.combineWithHarness(p.initialCode, J.buildHarness(p.judge.pythonChecks || []))));
  const badRes = B.resolveSubmission(som, B.createBattleState(som), i, badV.checks);
  check(badV.passed === false, 'SOMNIA 阶段 ' + (i + 1) + ' 初始版判题不通过');
  check(badRes.damage === 0, 'SOMNIA 阶段 ' + (i + 1) + ' 初始版造成 0 伤害（基线保护）');

  const goodV = J.judgeRun(p.judge, runCode(J.combineWithHarness(SOM_FIXED[i], J.buildHarness(p.judge.pythonChecks || []))));
  check(goodV.passed === true, 'SOMNIA 阶段 ' + (i + 1) + ' 正确版判题通过', JSON.stringify(goodV.error || ''));
  const start = { ...B.createBattleState(som), hp: 100 - i * 25, phase: i, phaseMask: som.phases.map((_, k) => (k < i ? 15 : 0)) };
  const goodRes = B.resolveSubmission(som, start, i, goodV.checks);
  check(goodRes.phaseCleared === true, 'SOMNIA 阶段 ' + (i + 1) + ' 击破');
  check(goodRes.hpAfter === 100 - (i + 1) * 25, 'SOMNIA 阶段 ' + (i + 1) + ' 血量结算正确');
});

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
