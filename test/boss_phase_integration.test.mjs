// V1.3-B.1 Boss 多阶段集成：真实 Python 判题驱动完整三阶段战斗 + 存档兼容
// 执行：node test/boss_phase_integration.test.mjs
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
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

const E = L('src/game/bossPhaseEngine.ts');
const P = L('src/game/bossPhasePlans.ts');
const B = L('src/game/battle.ts');
const J = L('src/services/judge.ts');
const Save = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;

// ================= 1. 配置与现有战斗数据一致 =================
console.log('=== 1. 多阶段配置与现有 Boss 战斗一致 ===');
{
  for (const bossId of P.BOSS_PHASE_BOSS_IDS) {
    for (const diff of ['easy', 'hard', 'expert']) {
      const def = L('src/game/bossDifficulties.ts').bossBattleDef(bossId, diff);
      const plan = P.buildBossPhasePlan(bossId, diff);
      if (!def) { ok(!plan, bossId + '/' + diff + '：无战斗数据时不生成阶段配置'); continue; }
      ok(!!plan, bossId + '/' + diff + '：生成阶段配置');
      ok(plan.totalHp === def.maxHp, bossId + '/' + diff + '：总血量一致');
      ok(plan.phases.reduce((s, p) => s + p.maxHp, 0) === def.maxHp, bossId + '/' + diff + '：阶段血量和等于总血量');
      const ids = def.phases.map(p => p.id);
      ok(plan.phases.every(p => p.availableChallenges.every(id => ids.includes(id))), bossId + '/' + diff + '：阶段挑战均来自真实判题阶段');
      ok(new Set(plan.phases.flatMap(p => p.availableChallenges)).size === ids.length, bossId + '/' + diff + '：每个判题阶段恰好归属一个战斗阶段');
      const thresholds = plan.phases.map(p => p.hpThreshold);
      ok(thresholds[0] === 100 && thresholds.every((t, i) => i === 0 || t < thresholds[i - 1]), bossId + '/' + diff + '：阈值严格递减');
    }
  }
  const gate = P.buildBossPhasePlan('gate-01', 'easy');
  eq(gate.phases.map(p => p.phaseName), ['能源封锁', '防御协议', '核心暴走'], 'GATE-01 三阶段名称');
  const k0 = P.buildBossPhasePlan('k0', 'easy');
  eq(k0.phases.map(p => p.phaseName), ['绝对安全壁垒', '零号裁决'], 'K-0 两阶段名称');
  ok(P.buildBossPhasePlan('somnia', 'easy').phases.length === 4, 'SOMNIA 四阶段');
}

// ================= 2. 真实 Python 驱动完整战斗 =================
console.log('=== 2. 真实 Python 判题驱动 GATE-01 三阶段战斗 ===');
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
  return { ok: res ? !res.err : false, stdout: res ? (res.out || '') : '', stderr: res ? (res.err || '') : 'no result', error: res && res.err ? { type: 'RuntimeError', message: String(res.err) } : undefined, timedOut: false };
}

const FIXED = [
  'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))',
  'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"',
  'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))',
  'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))',
];

{
  const def = L('src/game/bossDifficulties.ts').bossBattleDef('gate-01', 'easy');
  const plan = P.buildBossPhasePlan('gate-01', 'easy');
  const started = E.startBossPhaseRun(plan, NOW);
  let run = started.run;
  let state = B.createBattleState(def);

  // 阶段 1 初始故障版：真实判题不通过且不造成伤害
  {
    const badV = J.judgeRun(def.phases[0].judge, runCode(J.combineWithHarness(def.phases[0].initialCode, J.buildHarness(def.phases[0].judge.pythonChecks || []))));
    const badRes = B.resolveSubmission(def, state, 0, badV.checks);
    ok(badV.passed === false && badRes.newPassed === 0 && badRes.damage === 0, '初始故障版：真实判题不通过，0 伤害');
  }

  const expectedAfter = [
    { hp: 75, stage: 1, phaseName: '防御协议', transition: true },
    { hp: 50, stage: 2, phaseName: '核心暴走', transition: true },
    { hp: 25, stage: 2, phaseName: '核心暴走', transition: false },
    { hp: 0, stage: 2, phaseName: '核心暴走', transition: false, victory: true },
  ];

  for (let i = 0; i < def.phases.length; i++) {
    const phase = def.phases[i];
    const verdict = J.judgeRun(phase.judge, runCode(J.combineWithHarness(FIXED[i], J.buildHarness(phase.judge.pythonChecks || []))));
    ok(verdict.passed === true, '阶段 ' + (i + 1) + '「' + phase.title + '」真实判题通过', JSON.stringify(verdict.error || ''));

    const res = B.resolveSubmission(def, state, i, verdict.checks);
    ok(res.phaseCleared === true, '阶段 ' + (i + 1) + ' 击破');
    ok(res.hpAfter === expectedAfter[i].hp, '阶段 ' + (i + 1) + ' 血量结算 ' + res.hpAfter);

    const ch = E.recordChallengeResult(run, phase.id, verdict.passed, NOW + i * 10 + 1);
    run = E.applyDamage(ch.run, res.damage, NOW + i * 10 + 2).run;
    if (run.status === 'active') {
      const trans = E.evaluatePhaseTransition(run, plan, { hp: res.hpAfter, maxHp: 100, completedChallenges: run.completedChallenges }, NOW + i * 10 + 3);
      if (trans.ok) {
        run = E.completePhaseTransition(trans.run, plan, NOW + i * 10 + 4).run;
      }
    }
    ok(run.currentPhaseIndex === expectedAfter[i].stage, '阶段 ' + (i + 1) + ' 后战斗阶段 = ' + (expectedAfter[i].stage + 1));
    ok(run.hp === expectedAfter[i].hp, '阶段 ' + (i + 1) + ' 后 HP = ' + expectedAfter[i].hp);
    if (expectedAfter[i].victory) {
      ok(run.status === 'victory' && run.battleResult === 'victory', '最终阶段：Boss 胜利');
    } else if (run.status === 'active') {
      ok(plan.phases[run.currentPhaseIndex].availableChallenges.includes(def.phases[i + 1].id), '下一挑战属于当前战斗阶段');
    }

    // 与 gameStore 相同的战斗状态推进
    const masks = state.phaseMask.slice();
    masks[i] = masks[i] | res.mask;
    state = {
      ...state,
      hp: res.hpAfter,
      phase: Math.max(state.phase, res.phaseAfter),
      phaseMask: masks,
      started: true,
      cleared: res.defeated,
    };
  }

  ok(state.hp === 0 && state.cleared === true, '原有战斗状态同步归零并标记击破');
  ok(run.hp === 0 && run.status === 'victory', '多阶段运行状态同步胜利');
  ok(run.stats.damageDealt === 100, '战斗记录累计伤害 100', String(run.stats.damageDealt));
  ok(run.stats.challengeSuccesses === 4, '战斗记录挑战成功 4 次');
  ok(run.stats.phaseTransitions === 2, '战斗记录阶段切换 2 次');
  eq(run.phaseHistory.map(h => h.phaseIndex), [0, 1, 2], '阶段历史完整（0→1→2）');
  const record = E.toBattleRecord(run);
  ok(!!record && record.grade === null && record.battleResult === 'victory', '可被 B.5 读取的战斗记录已生成');
}

// ================= 3. 存档兼容 / 刷新恢复 =================
console.log('=== 3. 存档兼容与刷新恢复 ===');
{
  const base = () => ({
    name: 'R-07',
    level: 3,
    exp: 390,
    consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], backupLevel: 1 },
    progress: {
      completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: {},
      flags: {}, bossesDone: [], currentBossId: null, pendingRebirth: false,
    },
    settings: { musicVolume: 0.3, sfxVolume: 0.6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
  });

  const oldSave = Save.normalizePlayerState(base(), 10);
  ok(!!oldSave.progress.bossBattles && Object.keys(oldSave.progress.bossBattles).length === 0, '旧存档：bossBattles 缺失自动补空对象');
  ok(Array.isArray(oldSave.progress.bossBattleHistory) && oldSave.progress.bossBattleHistory.length === 0, '旧存档：bossBattleHistory 自动补空数组');
  ok(!!oldSave.progress.bossPhaseProgress, '旧存档：bossPhaseProgress 自动补空对象');
  ok(oldSave.progress.battles === undefined || typeof oldSave.progress.battles === 'object', '原有 battles 字段语义不变');

  const corrupt = base();
  corrupt.progress.battles = { 'gate-01': { hp: 75, maxHp: 100, phase: 1, phaseMask: [7, 0, 0, 0], failures: 1, cleared: false, difficulty: 'easy' } };
  corrupt.progress.bossBattles = {
    'gate-01': { battleId: 'bad', bossId: 'gate-01', difficulty: 'easy', status: 'active', hp: 9999, currentPhaseIndex: 99, stats: { damageDealt: -1 } },
    unknown: { bossId: 'unknown' },
  };
  const recordSeed = {
    bossId: 'gate-01', difficulty: 'easy', status: 'victory', hp: 0, battleId: 'h1',
    endedAt: NOW, updatedAt: NOW, battleResult: 'victory', currentPhaseIndex: 2,
    phaseHistory: [{ phaseId: 'gate-01-bp3', phaseIndex: 2, enteredAt: NOW - 10, exitedAt: null, trigger: 'hp-threshold' }],
  };
  corrupt.progress.bossBattleHistory = [{ ...recordSeed }, { ...recordSeed }];
  corrupt.progress.bossPhaseProgress = { 'gate-01': { highestPhaseIndex: -5, clearedPhases: ['x', 'x'], updatedAt: 1 } };
  const healed = Save.normalizePlayerState(corrupt, 10);
  ok(!healed.progress.bossBattles.unknown, '未知 Boss 的运行状态被丢弃');
  ok(healed.progress.bossBattles['gate-01'].hp === 75, '越界 HP 被真实战斗血量覆盖并钳制到合法范围');
  ok(healed.progress.bossBattles['gate-01'].currentPhaseIndex <= 2, '越界阶段被钳制');
  ok(healed.progress.bossBattleHistory.length === 1, '历史记录按 battleId 去重');
  ok(healed.progress.bossPhaseProgress['gate-01'].highestPhaseIndex >= 0, '阶段进度负数归零/修复');

  // 刷新恢复：真实血量 75 + 旧运行停在第一阶段 → 静默追平到第二阶段，不重复演出
  const refresh = base();
  refresh.progress.battles = { 'gate-01': { hp: 75, maxHp: 100, phase: 1, phaseMask: [7, 0, 0, 0], failures: 0, cleared: false, difficulty: 'easy' } };
  refresh.progress.bossBattles = { 'gate-01': { battleId: 'b1', bossId: 'gate-01', difficulty: 'easy', status: 'active', hp: 100, currentPhaseIndex: 0, phaseHistory: [] } };
  const restored = Save.normalizePlayerState(refresh, 10);
  const restoredRun = restored.progress.bossBattles['gate-01'];
  ok(restoredRun.hp === 75, '刷新：运行状态血量与真实战斗对齐');
  ok(restoredRun.currentPhaseIndex === 1, '刷新：阶段按阈值静默追平（不重复初始化）');
  ok(restoredRun.status === 'active' && restoredRun.transition === null, '刷新：无残留 transition，可继续战斗');

  ok(Save.SAVE_VERSION === 10, '存档版本保持 v10（未因 B.1 升级）');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
