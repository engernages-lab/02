// V1.3-B.4 仲裁集成：Boss 攻击 / 动态事件 / 弱点 / 阶段 / 终结 / 存档 / 统一伤害
// 执行：node test/combat_arbiter_integration.test.mjs
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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
const A = L('src/game/combatEventArbiter.ts');
const D = L('src/game/combatDamage.ts');
const E = L('src/game/eventEngine.ts');
const U = L('src/game/events/unknownIntrusion.ts');
const Plans = L('src/game/bossPhasePlans.ts');
const Phase = L('src/game/bossPhaseEngine.ts');
const Attack = L('src/game/bossAttackEngine.ts');
const Patterns = L('src/game/bossAttackPatterns.ts');
const Save = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;
const create = () => A.createCombatArbiter('b1', 'gate-01', 'gate-01-bp1', NOW);
const ev = (id, priority, over = {}) => ({ eventId: id, eventType: 'ambient', priority, conflictGroup: 'ambient', ...over });

// ================= 1. 攻击 vs 动态事件 vs 弱点 =================
console.log('=== 1. 攻击 / 动态事件 / 弱点冲突 ===');
{
  let s = create();
  let r = A.requestExclusive(s, ev('atk:1', 5, { eventType: 'boss-attack', conflictGroup: 'attack' }), NOW + 1);
  s = r.state;
  ok(s.active.eventId === 'atk:1', 'Boss 攻击（P5）获得独占');

  r = A.requestExclusive(s, ev('crisis:1', 2, { eventType: 'dynamic-crisis', conflictGroup: 'crisis' }), NOW + 2);
  s = r.state;
  ok(r.ok && r.preempted.eventId === 'atk:1' && s.active.eventId === 'crisis:1', '未知入侵（P2）中断攻击');
  ok(s.settledEventIds.includes('atk:1'), '攻击中断后不可重复执行');

  const crack = ev('crack:1', 3, { eventType: 'weakness-crack', conflictGroup: 'weakness' });
  r = A.requestExclusive(s, crack, NOW + 3);
  ok(!r.ok && r.queued, '危机进行中弱点破解（P3）等待');
  s = r.state;
  r = A.releaseExclusive(s, 'crisis:1', 'resolved', NOW + 4);
  ok(r.promoted && r.promoted.eventId === 'crack:1', '危机结束后按优先级恢复弱点破解');
  s = r.state;

  r = A.requestExclusive(s, ev('atk:2', 5, { eventType: 'boss-attack', conflictGroup: 'attack' }), NOW + 5);
  ok(!r.ok && r.queued, '弱点破解（P3）期间攻击（P5）不得抢占');
}

// ================= 2. 阶段切换 vs 动态事件 =================
console.log('=== 2. 阶段切换与动态事件 ===');
{
  let s = create();
  let r = A.requestExclusive(s, ev('crisis:2', 2, { eventType: 'dynamic-crisis', conflictGroup: 'crisis' }), NOW + 1);
  s = r.state;
  r = A.requestExclusive(s, ev('phase:1', 1, { eventType: 'phase-transition', conflictGroup: 'battle-flow', phaseId: 'gate-01-bp1' }), NOW + 2);
  ok(r.ok && r.preempted.eventId === 'crisis:2' && r.state.active.eventId === 'phase:1', '阶段切换（P1）抢占动态事件（P2）');
  s = r.state;

  const lateCrisis = ev('crisis:3', 2, { eventType: 'dynamic-crisis', conflictGroup: 'crisis', phaseId: 'gate-01-bp1' });
  r = A.requestExclusive(s, lateCrisis, NOW + 3);
  ok(!r.ok && r.queued, '阶段切换期间新动态事件进入队列');
  s = r.state;
  r = A.releaseExclusive(s, 'phase:1', 'resolved', NOW + 4);
  ok(r.promoted && r.promoted.eventId === 'crisis:3', '阶段切换完成后恢复排队动态事件');
  s = r.state;
  r = A.invalidatePhase(s, 'gate-01-bp2', NOW + 5);
  ok(r.state.phaseId === 'gate-01-bp2', '阶段更新');
  ok(r.state.active === null || r.state.active.phaseId === 'gate-01-bp2', '旧阶段锁不在新阶段执行');
}

// ================= 3. 终结清理 =================
console.log('=== 3. 死亡 / 胜利 / 撤退清理 ===');
{
  for (const type of ['death', 'victory', 'defeat', 'retreat']) {
    let s = create();
    s = A.requestExclusive(s, ev('crisis:x', 2, { eventType: 'dynamic-crisis', conflictGroup: 'crisis' }), NOW + 1).state;
    s = A.enqueue(s, ev('queued:x', 6), NOW + 2).state;
    const closed = A.closeCombatArbiter(s, type, NOW + 3, { eventId: 'terminal:' + type, eventType: type, priority: 0 });
    ok(closed.state.active === null && closed.state.queue.length === 0, type + '：清空活动锁与队列');
    ok(closed.state.settledEventIds.includes('terminal:' + type), type + '：终结事件幂等记录');
    ok(closed.state.records.some(x => x.eventId === 'terminal:' + type && x.priority === 0), type + '：P0 记录');
  }
}

// ================= 4. 动态事件引擎联动 =================
console.log('=== 4. 动态事件引擎联动 ===');
{
  U.registerUnknownIntrusion();
  const snap = { current: null, cooldowns: {} };
  const out = E.tryTrigger(snap, U.UNKNOWN_INTRUSION_ID, NOW, { data: { ...U.defaultIntrusionData() } });
  ok(out.ok, '未知入侵可由现有 eventEngine 触发');
  let s = create();
  let r = A.requestExclusive(s, ev('crisis:' + out.state.id, 2, { eventType: 'dynamic-crisis', conflictGroup: 'crisis' }), NOW + 1);
  ok(r.ok, '动态事件实例获取 P2 锁');
  s = r.state;
  const resolved = E.resolve(out.snapshot, NOW + 2);
  ok(E.isTerminal(resolved.current), '动态事件正常结算');
  r = A.releaseExclusive(s, 'crisis:' + out.state.id, 'resolved', NOW + 3);
  ok(r.state.active === null, '动态事件结算后释放锁');
  const normalized = E.normalizeEventState(out.state, NOW + 5000);
  ok(normalized && normalized.status === 'active', '刷新后未过期事件可恢复（由 store 重新获取 P2 锁）');
}

// ================= 5. 统一伤害 + 攻击引擎 =================
console.log('=== 5. 统一伤害与攻击结果 ===');
{
  const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
  const run = Phase.startBossPhaseRun(plan, NOW).run;
  const patterns = Patterns.bossAttackPatterns('gate-01', 'easy');
  const pulse = patterns.find(p => p.attackId === 'gate-01-p1-pulse');
  let state = Attack.createBossAttackState(run.battleId, 'gate-01', plan.phases[0].phaseId, 0, NOW, { nextAttackAt: NOW });
  const tel = Attack.tickBossAttack(state, [pulse], {
    now: NOW + 10, phaseId: plan.phases[0].phaseId, phaseIndex: 0,
    battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1, rng: () => 0.01,
  });
  const hit = Attack.tickBossAttack(tel.state, [pulse], {
    now: tel.state.telegraphEndsAt + pulse.attackDuration, phaseId: plan.phases[0].phaseId, phaseIndex: 0,
    battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1,
  });
  ok(hit.damages.length === 1, '真实攻击命中产生伤害事件');
  const dmg = hit.damages[0];
  let arb = create();
  const dmgId = 'dmg:' + run.battleId + ':' + dmg.hitKey;
  arb = A.recordCombatEvent(arb, { eventId: dmgId, eventType: 'damage', priority: 5, conflictGroup: 'attack', payload: { source: 'boss-attack', amount: dmg.amount } }, NOW + 20);
  ok(A.isSettled(arb, dmgId), '伤害事件进入幂等表');
  const before = D.resolvePlayerDamage(100, 0, dmg.amount);
  ok(before.consciousness === 100 - dmg.amount, '伤害经统一入口结算');
  const dup = A.recordCombatEvent(arb, { eventId: dmgId, eventType: 'damage', priority: 5, conflictGroup: 'attack' }, NOW + 21);
  ok(dup === arb, '重复伤害事件不重复记录');
  ok(dmg.amount >= 1, '最小伤害 ≥1');

  // 防御结果进入统一伤害
  const defTel = Attack.tickBossAttack(Attack.createBossAttackState(run.battleId, 'gate-01', plan.phases[0].phaseId, 0, NOW, { nextAttackAt: NOW }), [pulse], {
    now: NOW + 10, phaseId: plan.phases[0].phaseId, phaseIndex: 0,
    battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1, rng: () => 0.01,
  });
  const def = Attack.playerDefend(defTel.state, defTel.state.telegraphEndsAt - 200);
  const blocked = Attack.tickBossAttack(def.state, [pulse], {
    now: defTel.state.telegraphEndsAt + pulse.attackDuration, phaseId: plan.phases[0].phaseId, phaseIndex: 0,
    battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1,
  });
  ok(blocked.damages[0].result === 'blocked', '防御结果由攻击引擎统一判定');
  const res = D.resolvePlayerDamage(100, 0, blocked.damages[0].amount);
  ok(res.applied === blocked.damages[0].amount && res.consciousness >= 0, '防御伤害统一结算且不为负');

  const barrier = D.resolvePlayerDamage(100, 1, 8);
  ok(barrier.consciousness === 96 && barrier.barrierLayers === 0, '护罩统一减半并消耗');
}

// ================= 6. 存档兼容 =================
console.log('=== 6. 仲裁存档兼容 ===');
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
  const raw = base();
  raw.progress.battles = { 'gate-01': { hp: 100, maxHp: 100, phase: 0, phaseMask: [0, 0, 0, 0], failures: 0, cleared: false, difficulty: 'easy', started: true } };
  raw.progress.bossBattles = { 'gate-01': run };
  raw.progress.combatArbiter = {
    ...A.requestExclusive(A.createCombatArbiter(run.battleId, 'gate-01', plan.phases[0].phaseId, NOW), ev('atk', 5, { eventType: 'boss-attack', conflictGroup: 'attack' }), NOW + 1).state,
  };
  raw.progress.combatArbiter = A.settleEvent(raw.progress.combatArbiter, 'dmg', NOW + 2, { amount: 3 });
  const normalized = Save.normalizePlayerState(raw, 10);
  ok(normalized.progress.combatArbiter, '刷新后仲裁字段存在');
  ok(normalized.progress.combatArbiter.active === null && normalized.progress.combatArbiter.queue.length === 0, '刷新清空瞬态锁/队列');
  ok(normalized.progress.combatArbiter.settledEventIds.includes('dmg'), '刷新保留伤害幂等 ID');
  ok(normalized.progress.combatArbiter.battleId === run.battleId, '仲裁 battleId 对齐');
  ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');

  const old = Save.normalizePlayerState(base(), 10);
  ok(old.progress.combatArbiter === undefined, '无进行中 Boss 时不生成仲裁状态');

  const terminal = base();
  terminal.progress.battles = { 'gate-01': { hp: 0, maxHp: 100, phase: 4, phaseMask: [7, 15, 7, 3], failures: 0, cleared: true, difficulty: 'easy', started: true } };
  terminal.progress.bossBattles = { 'gate-01': { ...run, status: 'victory', battleResult: 'victory', endedAt: NOW, hp: 0 } };
  terminal.progress.combatArbiter = raw.progress.combatArbiter;
  const termNorm = Save.normalizePlayerState(terminal, 10);
  ok(termNorm.progress.combatArbiter === undefined, '终结战斗清理仲裁状态');
}

// ================= 7. 优先级体系完整性 =================
console.log('=== 7. 优先级体系 ===');
{
  eq(A.COMBAT_PRIORITY, { TERMINAL: 0, BATTLE_FLOW: 1, CRISIS: 2, WEAKNESS: 3, DYNAMIC: 4, ATTACK: 5, AMBIENT: 6 }, 'P0~P6 优先级数值完整');
  const s = create();
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    const r = A.recordCombatEvent(s, ev('event-' + i + '-' + i * 7, 6), NOW + i);
    ok(!!r, '事件记录生成');
    ids.add('event-' + i + '-' + i * 7);
  }
  eq(ids.size, 100, '事件 ID 唯一集合');
  ok(Plans.buildBossPhasePlan('gate-01', 'easy').phases.length === 3, 'Boss 阶段配置可读');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
