// V1.3-B.5.1 统计集成：真实 B.1~B.4 引擎 + Judge + combatDamage + 存档
// 执行：node test/boss_battle_stats_integration.test.mjs
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
    const b = join(dirname(abs), sp);
    const c = existsSync(b) && extname(b) ? b : existsSync(b + '.ts') ? b + '.ts' : b + '/index.ts';
    return load(c);
  });
  return mod.exports;
}
const L = (rel) => load(join(root, rel));
const S = L('src/game/bossBattleStats.ts');
const Plans = L('src/game/bossPhasePlans.ts');
const Phase = L('src/game/bossPhaseEngine.ts');
const Attack = L('src/game/bossAttackEngine.ts');
const Patterns = L('src/game/bossAttackPatterns.ts');
const Weak = L('src/game/bossWeaknessEngine.ts');
const Catalog = L('src/game/bossWeaknessCatalog.ts');
const Arb = L('src/game/combatEventArbiter.ts');
const Dmg = L('src/game/combatDamage.ts');
const Event = L('src/game/eventEngine.ts');
const Intr = L('src/game/events/unknownIntrusion.ts');
const Judge = L('src/services/judge.ts');
const Battle = L('src/game/battle.ts');
const Save = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;
const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
const run = Phase.startBossPhaseRun(plan, NOW).run;
const p1 = plan.phases[0].phaseId;
const p2 = plan.phases[1].phaseId;

function create() {
  return S.createBossBattleStats({
    battleId: run.battleId, bossId: 'gate-01', bossName: 'GATE-01', difficulty: 'easy',
    startedAt: NOW, phaseId: p1, phaseIndex: 0,
  });
}
function rec(s, id, type, payload = {}, phaseId = p1, at = NOW + 1) {
  return S.recordBossBattleEvent(s, { eventId: id, eventType: type, phaseId, payload, occurredAt: at }, at).state;
}

// ================= 1. 真实攻击 + 统一伤害 =================
console.log('=== 1. B.2 攻击与 combatDamage ===');
{
  let stats = create();
  const patterns = Patterns.bossAttackPatterns('gate-01', 'easy');
  const pulse = patterns.find(p => p.attackId === 'gate-01-p1-pulse');
  let state = Attack.createBossAttackState(run.battleId, 'gate-01', p1, 0, NOW, { nextAttackAt: NOW });
  const tel = Attack.tickBossAttack(state, [pulse], {
    now: NOW + 10, phaseId: p1, phaseIndex: 0, battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1, rng: () => 0.01,
  });
  stats = rec(stats, 'atk-tel-1', 'attack-telegraph', { attackId: pulse.attackId, attackType: pulse.attackType }, p1, NOW + 10);
  const hit = Attack.tickBossAttack(tel.state, [pulse], {
    now: tel.state.telegraphEndsAt + pulse.attackDuration, phaseId: p1, phaseIndex: 0,
    battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1,
  });
  ok(hit.damages.length === 1 && hit.damages[0].result === 'hit', '真实攻击命中');
  const dmg = hit.damages[0];
  const resolution = Dmg.resolvePlayerDamage(100, 0, dmg.amount);
  stats = rec(stats, 'atk-res-1', 'attack-result', { result: 'hit', response: 'none', hitIndex: 0 }, p1, NOW + 20);
  stats = rec(stats, 'dmg-1', 'damage-taken', { amount: resolution.applied, shieldAbsorbed: 0, source: 'boss-attack' }, p1, NOW + 20);
  ok(stats.attackStats.telegraphCount === 1 && stats.attackStats.hitCount === 1, '攻击预警/命中统计');
  ok(stats.attackStats.damageTaken === resolution.applied && resolution.consciousness === 100 - dmg.amount, '伤害统计与实际结算一致');
  const barrier = Dmg.resolvePlayerDamage(100, 1, 8);
  stats = rec(stats, 'dmg-barrier', 'damage-taken', { amount: barrier.applied, shieldAbsorbed: 8 - barrier.applied }, p1, NOW + 21);
  ok(barrier.barrierConsumed && stats.attackStats.shieldAbsorbed === 4, '护罩吸收统计');
  // 重复 hitKey/eventId
  const before = stats.attackStats.damageTaken;
  const dup = S.recordBossBattleEvent(stats, { eventId: 'dmg-1', eventType: 'damage-taken', phaseId: p1, payload: { amount: 999 } }, NOW + 22);
  ok(!dup.accepted && dup.state.attackStats.damageTaken === before, '重复 hitKey 不重复统计伤害');
  // 统计不修改攻击状态
  const stateCopy = JSON.stringify(hit.state);
  S.recordBossBattleEvent(stats, { eventId: 'x', eventType: 'attack-result', phaseId: p1, payload: { result: 'dodged' } }, NOW + 23);
  ok(JSON.stringify(hit.state) === stateCopy, '统计不修改战斗引擎状态');
}

// ================= 2. 真实 Judge =================
console.log('=== 2. 真实 Judge 挑战统计 ===');
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
  return { ok: res ? !res.err : false, stdout: res ? (res.out || '') : '', error: res && res.err ? { type: 'RuntimeError', message: String(res.err) } : undefined, timedOut: false };
}
{
  let stats = create();
  const phaseDef = Battle.GATE01_BATTLE.phases[0];
  const good = runCode(Judge.combineWithHarness('def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))', Judge.buildHarness(phaseDef.judge.pythonChecks || [])));
  const verdict = Judge.judgeRun(phaseDef.judge, good);
  ok(verdict.passed === true, '真实 Judge 通过');
  stats = rec(stats, 'challenge-1', 'challenge-result', { outcome: verdict.passed ? 'passed' : 'failed', phaseCleared: true }, p1, NOW + 30);
  const bad = runCode(Judge.combineWithHarness('def startup(energy):\n    return "POWER OFF"', Judge.buildHarness(phaseDef.judge.pythonChecks || [])));
  const badV = Judge.judgeRun(phaseDef.judge, bad);
  stats = rec(stats, 'challenge-2', 'challenge-result', { outcome: badV.passed ? 'passed' : 'failed', reason: 'judge-failed' }, p1, NOW + 31);
  ok(stats.challengeStats.submittedCount === 2 && stats.challengeStats.judgedCount === 2, '提交/判题计数来自真实 Judge');
  ok(stats.challengeStats.passedCount === 1 && stats.challengeStats.failedCount === 1, '真实判题成功/失败');
  ok(stats.challengeStats.successRate === 0.5 && stats.challengeStats.keyCrackSuccess, '成功率/关键破解标记');
}

// ================= 3. 弱点 + 阶段 + 动态 + 仲裁 =================
console.log('=== 3. B.3 弱点 / B.1 阶段 / B.4 动态事件 ===');
{
  let stats = create();
  const defs = Catalog.weaknessDefinitionsFor('gate-01', 'easy');
  let weak = Weak.createBossWeaknessRun(run.battleId, 'gate-01', p1, 0, defs, NOW);
  weak = Weak.observeWeakness(weak, defs, { kind: 'attack-telegraph', attackType: 'single' }, NOW + 10).state;
  weak = Weak.observeWeakness(weak, defs, { kind: 'attack-result', result: 'blocked' }, NOW + 20).state;
  weak = Weak.tickWeakness(Weak.startAnalysis(weak, defs, NOW + 30).state, defs, NOW + 3000).state;
  weak = Weak.completeWeaknessCrack(Weak.beginWeaknessCrack(weak, defs, NOW + 3100).state, defs, true, NOW + 3200).state;
  stats = rec(stats, 'w-clue-1', 'weakness-clue', { clueId: 'gate-w1-c1', weaknessId: 'gate-01-w1' }, p1, NOW + 10);
  stats = rec(stats, 'w-analyzed', 'weakness-analyzed', { weaknessId: 'gate-01-w1' }, p1, NOW + 30);
  stats = rec(stats, 'w-discovered', 'weakness-discovered', { weaknessId: 'gate-01-w1' }, p1, NOW + 3000);
  stats = rec(stats, 'w-crack', 'weakness-crack-result', { outcome: 'success', weaknessId: 'gate-01-w1' }, p1, NOW + 3200);
  stats = rec(stats, 'w-exposed', 'weakness-exposed', { weaknessId: 'gate-01-w1' }, p1, NOW + 3201);
  stats = rec(stats, 'w-recovered', 'weakness-recovered', { weaknessId: 'gate-01-w1' }, p1, NOW + 12000);
  stats = rec(stats, 'w-dmg', 'weakness-boss-damage', { amount: 13, weaknessId: 'gate-01-w1' }, p1, NOW + 12001);
  ok(stats.weaknessStats.discoveredCount === 1 && stats.weaknessStats.crackSuccessCount === 1, '弱点发现/破解统计');
  ok(stats.weaknessStats.exposedCount === 1 && stats.weaknessStats.exposureMsTotal === 8799, '暴露持续时间');
  ok(stats.weaknessStats.bossHpDamage === 13, '弱点 Boss HP 伤害');
  ok(weak.entries['gate-01-w1'].status === 'exposed', '弱点引擎真实暴露（统计不改变状态）');
  const failedBeforeCancel = stats.weaknessStats.crackFailedCount;
  stats = rec(stats, 'w-cancel', 'weakness-cancelled', { reason: 'dynamic-priority', weaknessId: 'gate-01-w2' }, p1, NOW + 12002);
  ok(stats.weaknessStats.cancelledCount === 1 && stats.weaknessStats.crackFailedCount === failedBeforeCancel, '高优先级抢占的破解只记取消、不算失败');

  stats = rec(stats, 'pt', 'phase-transition', { toIndex: 1 }, p2, NOW + 13000);
  stats = rec(stats, 'pc', 'phase-completed', {}, p1, NOW + 13001);
  stats = rec(stats, 'ps', 'phase-started', { phaseIndex: 1 }, p2, NOW + 13002);
  ok(stats.phaseTransitions === 1 && stats.currentPhaseId === p2 && stats.phasesCompleted === 1, '阶段切换统计与真实阶段同步');
  ok(stats.phaseStats[p1].durationMs === 13001 && stats.phaseStats[p2].enteredAt === NOW + 13002, '阶段停留时间');

  // B.4 仲裁：P2 抢占 P5，事件记录计数
  let ar = Arb.createCombatArbiter(run.battleId, 'gate-01', p1, NOW);
  ar = Arb.requestExclusive(ar, { eventId: 'atk', eventType: 'boss-attack', priority: 5, conflictGroup: 'attack' }, NOW + 14000).state;
  ar = Arb.requestExclusive(ar, { eventId: 'crisis', eventType: 'dynamic-crisis', priority: 2, conflictGroup: 'crisis' }, NOW + 14001).state;
  ok(ar.records.some(r => r.eventType === 'boss-attack' && r.status === 'interrupted'), 'B.4 仲裁记录攻击中断');
  Intr.registerUnknownIntrusion();
  const out = Event.tryTrigger({ current: null, cooldowns: {} }, Intr.UNKNOWN_INTRUSION_ID, NOW + 14002, { data: { ...Intr.defaultIntrusionData() } });
  stats = rec(stats, 'dyn-t', 'dynamic-triggered', { defId: Intr.UNKNOWN_INTRUSION_ID, instanceId: out.state.id }, p2, NOW + 14002);
  stats = rec(stats, 'dyn-i', 'dynamic-attack-interrupted', { instanceId: out.state.id }, p2, NOW + 14003);
  stats = rec(stats, 'dyn-s', 'dynamic-success', { instanceId: out.state.id, durationMs: 6000 }, p2, NOW + 20000);
  ok(stats.dynamicEventStats.triggeredCount === 1 && stats.dynamicEventStats.successCount === 1, '动态事件触发/成功统计');
  ok(stats.dynamicEventStats.attackInterruptedCount === 1, '动态事件中断攻击统计');
}

// ================= 4. 终结快照 + 存档 =================
console.log('=== 4. 终结快照与存档 ===');
{
  let stats = create();
  stats = rec(stats, 'c-pass', 'challenge-result', { outcome: 'passed', phaseCleared: true }, p1, NOW + 10);
  stats = rec(stats, 'dmg', 'damage-taken', { amount: 6 }, p1, NOW + 20);
  const fin = S.finalizeBossBattleStats(stats, 'victory', NOW + 60000);
  ok(fin.state.finalized && fin.state.result === 'victory' && fin.state.battleStatus === 'completed', '最终快照生成');
  ok(fin.state.wallDurationMs === 60000 && fin.state.dataQuality === 'complete', '时长与完整性');
  const again = S.finalizeBossBattleStats(fin.state, 'defeat', NOW + 70000);
  ok(again.already && again.state.result === 'victory', '重复终结不重算');

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
  const raw = base();
  raw.progress.battles = { 'gate-01': { hp: 100, maxHp: 100, phase: 0, phaseMask: [0, 0, 0, 0], failures: 0, cleared: false, difficulty: 'easy', started: true } };
  raw.progress.bossBattles = { 'gate-01': run };
  raw.progress.bossBattleStats = { active: stats, history: [] };
  const norm = Save.normalizePlayerState(raw, 10);
  ok(norm.progress.bossBattleStats.active && norm.progress.bossBattleStats.active.battleId === run.battleId, '刷新保留活动统计');
  ok(norm.progress.bossBattleStats.active.challengeStats.passedCount === 1, '刷新统计计数保留');

  const terminal = base();
  terminal.progress.battles = { 'gate-01': { hp: 0, maxHp: 100, phase: 4, phaseMask: [7, 15, 7, 3], failures: 0, cleared: true, difficulty: 'easy', started: true } };
  terminal.progress.bossBattles = { 'gate-01': { ...run, status: 'victory', battleResult: 'victory', endedAt: NOW + 100, hp: 0 } };
  terminal.progress.bossBattleStats = { active: stats, history: [] };
  const termNorm = Save.normalizePlayerState(terminal, 10);
  ok(termNorm.progress.bossBattleStats.active === null, '终结战斗活动统计移出');
  ok(termNorm.progress.bossBattleStats.history.some(x => x.result === 'victory' && x.finalized), '终结统计进入历史快照');

  const old = Save.normalizePlayerState(base(), 10);
  ok(old.progress.bossBattleStats && old.progress.bossBattleStats.active === null && old.progress.bossBattleStats.history.length === 0, '旧存档自动补空统计');
  ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');
}

// ================= 5. 数据边界 =================
console.log('=== 5. 统计边界 ===');
{
  let stats = create();
  const hpBefore = 100;
  const consciousnessBefore = 100;
  const cooldownBefore = 5000;
  stats = rec(stats, 'atk', 'attack-result', { result: 'hit' }, p1);
  stats = rec(stats, 'dmg', 'damage-taken', { amount: 5 }, p1);
  eq(hpBefore, 100, '统计不修改 Boss HP');
  eq(consciousnessBefore, 100, '统计不修改玩家意识');
  eq(cooldownBefore, 5000, '统计不修改攻击冷却');
  const stale = S.recordBossBattleEvent(stats, { eventId: 'old', eventType: 'attack-telegraph', phaseId: p2, payload: {} }, NOW + 5);
  ok(!stale.accepted && stale.reason === 'stale-phase', '旧阶段事件不污染新阶段统计');
  const final = S.finalizeBossBattleStats(stats, 'defeat', NOW + 1000).state;
  const late = S.recordBossBattleEvent(final, { eventId: 'late', eventType: 'damage-taken', phaseId: p1, payload: { amount: 99 } }, NOW + 2000);
  ok(!late.accepted && late.state.attackStats.damageTaken === 5, '终结后迟到事件被拒绝');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
