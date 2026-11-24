// V1.3-B.3 Boss 弱点集成：真实 Python 破解 + B.1 阶段结转 + B.2 攻击干扰 + 存档自愈
// 执行：node test/boss_weakness_integration.test.mjs
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
const W = L('src/game/bossWeaknessEngine.ts');
const Catalog = L('src/game/bossWeaknessCatalog.ts');
const Plans = L('src/game/bossPhasePlans.ts');
const A = L('src/game/bossAttackEngine.ts');
const AP = L('src/game/bossAttackPatterns.ts');
const B = L('src/game/battle.ts');
const Phase = L('src/game/bossPhaseEngine.ts');
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

// ================= 1. 真实 Python 破解挑战 =================
console.log('=== 1. 真实 Python 破解挑战 ===');
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
function judgeChallenge(def) {
  const bad = runCode(J.combineWithHarness(def.challenge.initialCode, J.buildHarness(def.challenge.judge.pythonChecks || [])));
  const good = runCode(J.combineWithHarness(def.challenge.reference, J.buildHarness(def.challenge.judge.pythonChecks || [])));
  return {
    bad: J.judgeRun(def.challenge.judge, bad),
    good: J.judgeRun(def.challenge.judge, good),
  };
}

{
  const gate = Catalog.weaknessDefinitionsFor('gate-01', 'easy');
  for (const def of gate) {
    const r = judgeChallenge(def);
    ok(r.bad.passed === false, def.weaknessId + '：初始故障代码判题不通过', JSON.stringify(r.bad.error || ''));
    ok(r.good.passed === true, def.weaknessId + '：参考解答真实判题通过', JSON.stringify(r.good.error || ''));
    ok((def.challenge.judge.pythonChecks || []).length >= 3, def.weaknessId + '：至少 3 条真实测试');
  }
  for (const bossId of ['somnia', 'k0']) {
    const defs = Catalog.weaknessDefinitionsFor(bossId, 'easy');
    for (const def of defs.slice(0, 2)) {
      const r = judgeChallenge(def);
      ok(r.bad.passed === false, bossId + '/' + def.weaknessId + '：初始代码不通过');
      ok(r.good.passed === true, bossId + '/' + def.weaknessId + '：参考解答通过');
    }
  }
}

// ================= 2. B.1 阶段结转 =================
console.log('=== 2. B.1 阶段伤害结转 ===');
{
  const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
  const defs = Catalog.weaknessDefinitionsFor('gate-01', 'easy');
  const def = defs[0];
  const run = Phase.startBossPhaseRun(plan, NOW).run;
  const attack = B.createBattleState(L('src/game/bossDifficulties.ts').bossBattleDef('gate-01', 'easy'));
  let weakness = W.createBossWeaknessRun(run.battleId, 'gate-01', plan.phases[0].phaseId, 0, defs, NOW);
  for (const clue of def.clues.slice(0, def.requiredClues)) {
    weakness = W.observeWeakness(weakness, defs, {
      kind: clue.trigger.kind, attackId: clue.trigger.attackId, attackType: clue.trigger.attackType,
      result: clue.trigger.result, challengeId: clue.trigger.challengeId,
    }, NOW + 10).state;
  }
  weakness = W.tickWeakness(W.startAnalysis(weakness, defs, NOW + 100).state, defs, NOW + 3000).state;
  weakness = W.completeWeaknessCrack(W.beginWeaknessCrack(weakness, defs, NOW + 4000).state, defs, true, NOW + 5000).state;
  const exposure = W.exposureInfo(weakness, defs, NOW + 5100);
  ok(exposure.active && exposure.damageMultiplier === 1.5, '弱点暴露：伤害倍率 1.5');

  // 阶段 1 击破：普通伤害 25 → 血量 75；弱点额外伤害结转到阶段 2
  const cleared = 25;
  const extra = Math.ceil(cleared * (exposure.damageMultiplier - 1));
  ok(extra === 13, '弱点额外伤害 = ceil(25 × 0.5) = 13');
  weakness = W.setCarryDamage(weakness, extra, NOW + 6000);
  const nextUpper = Phase.phaseHpUpper(plan, 1);
  const nextLower = nextUpper - plan.phases[1].maxHp;
  const minNext = nextLower + 1;
  const hpAfter = Math.max(minNext, 75 - extra);
  ok(nextUpper === 75 && nextLower === 50, '阶段 2 血量区间 50~75');
  ok(hpAfter === 62, '阶段 2 起始 HP = 62（普通 75，弱点结转 13）');
  const consumed = W.consumeCarryDamage(weakness, NOW + 7000);
  ok(consumed.amount === 13 && consumed.state.pendingCarryDamage === 0, '结转只消费一次');
  ok(hpAfter >= nextLower + 1, '结转不会跨过下一阶段下界');
}

// ================= 3. B.2 攻击干扰 =================
console.log('=== 3. B.2 攻击干扰 ===');
{
  const defs = Catalog.weaknessDefinitionsFor('gate-01', 'easy');
  const def = defs[1];
  const run = Phase.startBossPhaseRun(Plans.buildBossPhasePlan('gate-01', 'easy'), NOW).run;
  const patterns = AP.bossAttackPatterns('gate-01', 'easy');
  let state = A.createBossAttackState(run.battleId, 'gate-01', 'gate-01-bp2', 1, NOW, { nextAttackAt: NOW });
  let step = A.tickBossAttack(state, patterns, {
    now: NOW + 10, phaseId: 'gate-01-bp2', phaseIndex: 1, battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1, rng: () => 0.9,
  });
  state = step.state;
  ok(state.attackState === 'telegraph', '攻击进入预警');
  const interference = A.applyAttackInterference(state, {
    now: NOW + 20,
    until: NOW + 10000,
    disablePatternIds: def.disableAttackPatternIds,
    interrupt: def.interruptAttack,
    reason: 'weakness-exposed',
  });
  ok(interference.state.attackState === 'cancelled', '破解成功中断当前攻击');
  ok(Object.keys(interference.state.disabledPatterns).length > 0, '写入禁用攻击模式');
  const disabledId = def.disableAttackPatternIds[0];
  const enabledPattern = patterns.find(p => p.phaseRestriction.includes(1) && p.attackId !== disabledId);
  const onlyDisabled = patterns.filter(p => p.attackId === disabledId);
  const sel = A.tickBossAttack(
    { ...interference.state, attackState: 'idle', nextAttackAt: NOW + 30 },
    [...onlyDisabled, enabledPattern],
    { now: NOW + 100, phaseId: 'gate-01-bp2', phaseIndex: 1, battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1, rng: () => 0.01 },
  );
  ok(sel.state.currentPattern && sel.state.currentPattern.attackId === enabledPattern.attackId, '禁用模式不会再次被选择');
  ok(sel.state.currentPattern.attackId !== disabledId, '被禁用攻击不再触发');

  // 弱点冷却延长
  const p = patterns.find(x => x.attackId === enabledPattern.attackId);
  const cooldownState = {
    ...interference.state,
    attackState: 'resolving',
    attackEndsAt: NOW + 200,
    currentPattern: p,
    disabledPatterns: {},
    transition: null,
    hp: 100,
  };
  const normal = A.tickBossAttack(cooldownState, patterns, {
    now: NOW + 300, phaseId: 'gate-01-bp2', phaseIndex: 1, battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1,
  });
  const boosted = A.tickBossAttack(cooldownState, patterns, {
    now: NOW + 300, phaseId: 'gate-01-bp2', phaseIndex: 1, battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1, cooldownMultiplier: 1.35,
  });
  const normalCd = normal.state.cooldownEndsAt - normal.state.updatedAt;
  const boostedCd = boosted.state.cooldownEndsAt - boosted.state.updatedAt;
  ok(boostedCd > normalCd, '弱点暴露延长攻击冷却', normalCd + ' vs ' + boostedCd);
  ok(Math.abs(boostedCd / normalCd - 1.35) < 0.05, '冷却倍率接近配置 1.35');
}

// ================= 4. 存档兼容 =================
console.log('=== 4. 弱点存档自愈 ===');
{
  const base = () => ({
    name: 'R-07', level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], backupLevel: 1 },
    progress: {
      completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: {}, flags: {},
      bossesDone: [], currentBossId: null, pendingRebirth: false,
    },
    settings: { musicVolume: 0.3, sfxVolume: 0.6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
  });
  const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
  const run = Phase.startBossPhaseRun(plan, NOW).run;
  const basePlayer = base();
  basePlayer.progress.battles = { 'gate-01': { hp: 75, maxHp: 100, phase: 1, phaseMask: [7, 0, 0, 0], failures: 0, cleared: false, difficulty: 'easy', started: true } };
  basePlayer.progress.bossBattles = { 'gate-01': { ...run, currentPhaseIndex: 1, currentPhaseId: 'gate-01-bp2', phaseId: 'gate-01-bp2', phaseIndex: 1 } };
  basePlayer.progress.bossWeaknesses = {
    'gate-01': {
      battleId: run.battleId, bossId: 'gate-01', phaseId: 'gate-01-bp2', phaseIndex: 1,
      activeWeaknessId: 'gate-01-w2',
      entries: {
        'gate-01-w2': {
          weaknessId: 'gate-01-w2', status: 'exposed', clues: ['gate-w2-c1', 'gate-w2-c2'],
          attempts: 1, successCount: 1, exposureCount: 1, exposedAt: NOW, exposedUntil: NOW + 60000,
          cooldownUntil: null, lockedUntil: null, analysisStartedAt: null, analysisEndsAt: null, lastResult: 'success', lastCrackAt: NOW,
        },
      },
      pendingCarryDamage: 12, updatedAt: NOW,
    },
  };
  const normalized = Save.normalizePlayerState(basePlayer, 10);
  const weak = normalized.progress.bossWeaknesses['gate-01'];
  ok(weak && weak.entries['gate-01-w2'].status === 'exposed', '暴露状态刷新后保留剩余时间');
  ok(weak.pendingCarryDamage === 12, '结转伤害持久化');
  ok(normalized.progress.bossAttacks && typeof normalized.progress.bossAttacks === 'object', '攻击状态字段仍存在');

  const old = Save.normalizePlayerState(base(), 10);
  ok(old.progress.bossWeaknesses && Object.keys(old.progress.bossWeaknesses).length === 0, '旧存档自动补空 bossWeaknesses');
  ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');

  const dead = base();
  dead.progress.battles = { 'gate-01': { hp: 0, maxHp: 100, phase: 4, phaseMask: [7, 15, 7, 3], failures: 0, cleared: true, difficulty: 'easy', started: true } };
  dead.progress.bossBattles = { 'gate-01': { ...run, status: 'victory', battleResult: 'victory', endedAt: NOW, hp: 0 } };
  dead.progress.bossWeaknesses = basePlayer.progress.bossWeaknesses;
  const deadNorm = Save.normalizePlayerState(dead, 10);
  ok(!deadNorm.progress.bossWeaknesses['gate-01'], '终结战斗清理弱点状态');
}

// ================= 5. 弱点与真实 Boss 数据一致性 =================
console.log('=== 5. 与 Boss/攻击配置一致性 ===');
{
  for (const bossId of Plans.BOSS_PHASE_BOSS_IDS) {
    for (const diff of ['easy', 'hard', 'expert']) {
      const plan = Plans.buildBossPhasePlan(bossId, diff);
      const defs = Catalog.weaknessDefinitionsFor(bossId, diff);
      if (!plan) continue;
      ok(defs.length === plan.phases.length, bossId + '/' + diff + '：弱点数量与阶段数一致');
      const patternIds = AP.bossAttackPatterns(bossId, diff).map(p => p.attackId);
      ok(defs.every(d => d.disableAttackPatternIds.every(id => patternIds.includes(id))), bossId + '/' + diff + '：禁用模式 ID 均存在');
      ok(defs.every(d => d.vulnerabilityDuration >= 3000 && d.damageMultiplier > 1), bossId + '/' + diff + '：暴露时长/倍率合法');
      ok(defs.every(d => d.challenge.judge.judgeKind === 'python'), bossId + '/' + diff + '：全部真实 Judge');
    }
  }
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
