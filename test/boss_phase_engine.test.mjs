// V1.3-B.1 Boss 多阶段引擎专项：状态机 / 阶段切换 / HP / 事件 / 记录 / 自愈
// 执行：node test/boss_phase_engine.test.mjs
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

const E = L('src/game/bossPhaseEngine.ts');
const P = L('src/game/bossPhasePlans.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;

function makePlan({ phases = 3, hp = 100, thresholds = null, policy = 'inherit', trigger = null } = {}) {
  const seg = Math.floor(hp / phases);
  const list = Array.from({ length: phases }, (_, i) => {
    const maxHp = i === phases - 1 ? hp - seg * (phases - 1) : seg;
    return {
      phaseId: 'bp-' + (i + 1),
      phaseName: '阶段' + (i + 1),
      phaseIndex: i,
      description: 'desc' + (i + 1),
      hpThreshold: thresholds ? thresholds[i] : Math.round(100 - (i * 100) / phases),
      maxHp,
      phaseIntro: 'intro' + (i + 1),
      phaseOutro: 'outro' + (i + 1),
      difficultyMultiplier: 1,
      availableChallenges: ['c' + (i + 1)],
      hpPolicy: policy,
      defense: 0,
      trigger: trigger && trigger[i] ? trigger[i] : undefined,
    };
  });
  return { bossId: 'synthetic', bossName: 'SYNTHETIC', difficulty: 'easy', totalHp: hp, defaultHpPolicy: 'inherit', phases: list };
}

const start = (plan, opts = {}) => {
  const s = E.startBossPhaseRun(plan, NOW, opts);
  return s.run;
};

// ================= 10.1 状态机 =================
console.log('=== 10.1 状态机 ===');
{
  const plan = makePlan({ phases: 3 });
  const idle = E.createBossPhaseRun(plan, NOW);
  ok(idle.status === 'idle', '创建后为 idle');
  const prep = E.prepareBattle(idle, NOW + 1);
  ok(prep.ok && prep.run.status === 'preparing', 'idle → preparing');
  const act = E.activateBattle(prep.run, plan, NOW + 2);
  ok(act.ok && act.run.status === 'active', 'preparing → active');
  ok(act.events.some(e => e.type === E.BOSS_BATTLE_EVENTS.STARTED), '开始战斗广播 BOSS_BATTLE_STARTED');
  ok(act.events.some(e => e.type === E.BOSS_BATTLE_EVENTS.PHASE_STARTED), '开始战斗广播 BOSS_PHASE_STARTED');

  const toTransition = E.evaluatePhaseTransition(act.run, plan, { hp: 60, maxHp: 100 }, NOW + 3);
  ok(toTransition.ok && toTransition.run.status === 'phase_transition', 'active → phase_transition（HP 阈值）');
  const toActive = E.completePhaseTransition(toTransition.run, plan, NOW + 4);
  ok(toActive.ok && toActive.run.status === 'active' && toActive.run.currentPhaseIndex === 1, 'phase_transition → active（进入第二阶段）');

  const vic = E.finishBattle(toActive.run, 'victory', NOW + 5);
  ok(vic.ok && vic.run.status === 'victory' && vic.run.battleResult === 'victory', 'active → victory');
  ok(E.finishBattle(vic.run, 'victory', NOW + 6).ok === false, 'victory → victory 被拒绝（幂等但不重复结算）');
  ok(E.transitionBattleStatus(vic.run, 'active', NOW + 7).ok === false, 'victory → active 非法，防止战斗结束后继续');

  const def = E.finishBattle(act.run, 'defeat', NOW + 8);
  ok(def.ok && def.run.status === 'defeat', 'active → defeat');
  const intr = E.interruptBattle(act.run, NOW + 9, '撤退');
  ok(intr.ok && intr.run.status === 'interrupted', 'active → interrupted');
  const res = E.resumeBattle(intr.run, plan, NOW + 10, 80);
  ok(res.ok && res.run.status === 'active', 'interrupted → resumed（active）');
  ok(res.events.some(e => e.type === E.BOSS_BATTLE_EVENTS.RESUMED), '恢复广播 BOSS_BATTLE_RESUMED');

  ok(E.transitionBattleStatus(idle, 'active', NOW).ok === false, 'idle → active 非法');
  ok(E.transitionBattleStatus(prep.run, 'victory', NOW).ok === false, 'preparing → victory 非法');
  ok(E.transitionBattleStatus(def.run, 'interrupted', NOW).ok === false, 'defeat → interrupted 非法');
  ok(E.resumeBattle(def.run, plan, NOW + 11).ok === false, '已失败战斗不能恢复');
  ok(E.resumeBattle(vic.run, plan, NOW + 12).ok === false, '已胜利战斗不能恢复');
  ok(E.completePhaseTransition(act.run, plan, NOW + 13).ok === false, '没有待完成切换时 complete 被拒绝');
}

// ================= 10.2 阶段切换 =================
console.log('=== 10.2 阶段切换 ===');
{
  const plan = makePlan({ phases: 3, thresholds: [100, 75, 50] });
  let run = start(plan);
  const t1 = E.evaluatePhaseTransition(run, plan, { hp: 75, maxHp: 100 }, NOW + 1);
  ok(t1.ok && t1.run.transition && t1.run.transition.toIndex === 1, 'HP=75% 触发第二阶段');
  ok(t1.run.transition.id.startsWith('transition@'), '生成唯一 transitionId');
  const dup = E.evaluatePhaseTransition(t1.run, plan, { hp: 50, maxHp: 100 }, NOW + 2);
  ok(dup.ok === false && dup.run.transition.id === t1.run.transition.id, 'transition 中重复触发被拒绝，不覆盖当前切换');

  const c1 = E.completePhaseTransition(t1.run, plan, NOW + 3);
  ok(c1.ok && c1.run.currentPhaseIndex === 1 && c1.run.status === 'active', '完成切换后进入 active');
  const c2 = E.completePhaseTransition(c1.run, plan, NOW + 4);
  ok(c2.ok === false && c2.run.currentPhaseIndex === 1, '重复 complete 不会重复初始化阶段');
  const histCount = c1.run.phaseHistory.length;
  ok(c2.run.phaseHistory.length === histCount, '重复 complete 不追加阶段历史');
  ok(c1.run.completedTransitionIds.includes(t1.run.transition.id), 'transitionId 写入幂等表');

  // 一次跨两档：从第一阶段直接掉到 30%，应一次进入最高满足阶段，避免连续切换
  const plan4 = makePlan({ phases: 4 });
  let run4 = start(plan4);
  const jump = E.evaluatePhaseTransition(run4, plan4, { hp: 24, maxHp: 100 }, NOW + 5);
  ok(jump.ok && jump.run.transition.toIndex === 3, '一次跨多个阈值只产生一次切换（目标为最高阶段）');
  const jumped = E.completePhaseTransition(jump.run, plan4, NOW + 6);
  ok(jumped.run.currentPhaseIndex === 3, '跨阶段切换落到目标阶段');
  ok(jumped.run.phaseHistory.some(h => h.phaseIndex === 1 && h.enteredAt === h.exitedAt), '被跳过的阶段写入历史（不重复执行）');

  // 挑战完成触发
  const planChallenge = makePlan({ phases: 2, trigger: [null, { kind: 'challenge-complete', challengeId: 'c1' }] });
  let rc = start(planChallenge);
  const noTrigger = E.evaluatePhaseTransition(rc, planChallenge, { hp: 100, maxHp: 100, completedChallenges: [] }, NOW + 7);
  ok(noTrigger.ok === false, '挑战未完成时，挑战触发条件不生效');
  const yes = E.evaluatePhaseTransition(rc, planChallenge, { hp: 100, maxHp: 100, completedChallenges: ['c1'] }, NOW + 8);
  ok(yes.ok && yes.run.transition.toIndex === 1, '挑战完成触发阶段切换（HP 仍为 100）');

  // 组合条件触发
  const combo = makePlan({ phases: 2, trigger: [null, { kind: 'composite', all: [{ kind: 'hp-threshold', threshold: 40 }, { kind: 'challenge-complete', challengeId: 'c1' }] }] });
  let rb = start(combo);
  ok(E.evaluatePhaseTransition(rb, combo, { hp: 30, maxHp: 100, completedChallenges: [] }, NOW + 9).ok === false, '组合条件：只满足 HP 不切换');
  ok(E.evaluatePhaseTransition(rb, combo, { hp: 100, maxHp: 100, completedChallenges: ['c1'] }, NOW + 10).ok === false, '组合条件：只完成挑战不切换');
  const comboOk = E.evaluatePhaseTransition(rb, combo, { hp: 30, maxHp: 100, completedChallenges: ['c1'] }, NOW + 11);
  ok(comboOk.ok && comboOk.run.transition.toIndex === 1, '组合条件：HP + 挑战同时满足才切换');

  // 特殊事件接口（B.4 预留）
  const evPlan = makePlan({ phases: 2, trigger: [null, { kind: 'special-event', eventId: 'unknown-intrusion' }] });
  let re = start(evPlan);
  const evOk = E.evaluatePhaseTransition(re, evPlan, { hp: 100, maxHp: 100, eventIds: ['unknown-intrusion'] }, NOW + 12);
  ok(evOk.ok && evOk.run.transition.toIndex === 1, '特殊事件接口可触发阶段切换');

  // 异常恢复：刷新时停留在 transition，complete 仍能安全完成
  const stale = E.normalizeBossPhaseRun(t1.run, plan, NOW + 5000);
  ok(stale && stale.status === 'phase_transition' && stale.transition, '刷新时保留 transition 状态（不丢失）');
  const healed = E.completePhaseTransition(stale, plan, NOW + 5001);
  ok(healed.ok && healed.run.status === 'active' && healed.run.currentPhaseIndex === 1, '刷新后可以完成阶段切换，不重复初始化');
}

// ================= 10.3 HP =================
console.log('=== 10.3 HP ===');
{
  const plan = makePlan({ phases: 2 });
  let run = start(plan);
  const d1 = E.applyDamage(run, 10, NOW + 1);
  ok(d1.ok && d1.run.hp === 90, '正常伤害：100 → 90');
  const d0 = E.applyDamage(d1.run, 0, NOW + 2);
  ok(d0.ok && d0.run.hp === 90, '伤害为 0 不扣血');
  const dn = E.applyDamage(d1.run, -50, NOW + 3);
  ok(dn.ok && dn.run.hp === 90, '负伤害不扣血也不加血');
  const db = E.applyDamage(d1.run, 9999, NOW + 4);
  ok(db.run.hp === 0 && db.run.status === 'victory', '超过当前血量：钳制到 0 并自动胜利');
  ok(db.run.hp >= 0, 'HP 不会出现负数');
  const df = E.applyDamage({ ...d1.run, hp: 5, maxHp: 100 }, 12, NOW + 5);
  ok(df.run.hp === 0, '伤害超过剩余血量时钳制到 0');

  // 继承策略：阶段切换不回血
  const inheritPlan = makePlan({ phases: 2, policy: 'inherit' });
  let ri = start(inheritPlan);
  const ti = E.evaluatePhaseTransition(ri, inheritPlan, { hp: 50, maxHp: 100 }, NOW + 6);
  const ci = E.completePhaseTransition(ti.run, inheritPlan, NOW + 7);
  ok(ci.run.hp === 50, 'inherit：阶段切换保留 50 血，不无故回血');

  // 恢复策略：只补满本阶段血量段
  const restorePlan = makePlan({ phases: 2, policy: 'restore' });
  let rr = start(restorePlan);
  const tr = E.evaluatePhaseTransition({ ...rr, hp: 40 }, restorePlan, { hp: 40, maxHp: 100 }, NOW + 8);
  const cr = E.completePhaseTransition(tr.run, restorePlan, NOW + 9);
  ok(cr.run.hp === 100, 'restore：明确配置时固定恢复满血');

  // 独立策略
  const indepPlan = makePlan({ phases: 2, policy: 'independent' });
  let rn = start(indepPlan);
  const tn = E.evaluatePhaseTransition({ ...rn, hp: 45 }, indepPlan, { hp: 45, maxHp: 100 }, NOW + 10);
  const cn = E.completePhaseTransition(tn.run, indepPlan, NOW + 11);
  ok(cn.run.hp === 50, 'independent：新阶段使用独立血量段（50）');

  // 不同 Boss 策略
  const easyPlan = P.buildBossPhasePlan('gate-01', 'easy');
  const hardPlan = P.buildBossPhasePlan('gate-01', 'hard');
  ok(easyPlan.phases.every(p => p.hpPolicy === 'inherit'), 'GATE-01 默认继承血量');
  ok(hardPlan.phases.every(p => p.hpPolicy === 'inherit'), 'HARD 难度同样继承血量');

  // 阶段本地血量视图
  const view = E.phaseHpView(easyPlan, { ...E.createBossPhaseRun(easyPlan, NOW), hp: 60 }, 1);
  ok(view.current === 10 && view.max === 25, '阶段本地血量视图正确（60 血 → 第二阶段 10/25）');
}

// ================= 记录 / 事件 =================
console.log('=== 记录 / 事件 ===');
{
  const plan = makePlan({ phases: 3, thresholds: [100, 75, 50] });
  let run = start(plan);
  let s = E.recordChallengeStart(run, 'c1', NOW + 1); run = s.run;
  s = E.recordChallengeResult(run, 'c1', false, NOW + 2); run = s.run;
  s = E.recordChallengeResult(run, 'c1', true, NOW + 3); run = s.run;
  ok(run.stats.challengeAttempts === 1, '挑战次数记录');
  ok(run.stats.challengeFailures === 1 && run.stats.challengeSuccesses === 1, '挑战成功/失败记录');
  ok(run.completedChallenges.includes('c1'), '成功挑战写入完成列表');
  s = E.recordDamageReceived(run, 4, NOW + 4); run = s.run;
  ok(run.stats.damageReceived === 4, 'Boss 反击伤害记录');

  const evs = [
    ...E.evaluatePhaseTransition(run, plan, { hp: 70, maxHp: 100 }, NOW + 5).events,
    ...E.completePhaseTransition({ ...run, status: 'phase_transition', transition: { id: 't-x', fromPhaseId: 'bp-1', toPhaseId: 'bp-2', fromIndex: 0, toIndex: 1, reason: 'hp-threshold', startedAt: NOW, completedAt: null } }, plan, NOW + 6).events,
  ];
  ok(evs.every(e => !!e.id && !!e.battleId && !!e.at && !!e.phaseId), '事件包含唯一 id / battleId / 时间戳 / phaseId');
  ok(new Set(evs.map(e => e.id)).size === evs.length, '事件 id 唯一');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.PHASE_COMPLETED), '阶段完成事件');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.PHASE_TRANSITION), '阶段切换事件');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.PHASE_STARTED), '新阶段开始事件');

  let received = 0;
  const un = E.bossBattleEventBus.subscribe(() => { received++; });
  E.bossBattleEventBus.emit(evs);
  un();
  E.bossBattleEventBus.emit(evs);
  ok(received === evs.length, '事件总线订阅/退订正常（退订后不再收到）');
  ok(E.bossBattleEventBus.recent(100).length >= evs.length, '事件总线保留最近事件');
}

// ================= 10.5 存档自愈 =================
console.log('=== 10.5 存档自愈 ===');
{
  const plan = makePlan({ phases: 3 });
  ok(E.normalizeBossPhaseRun(null, plan, NOW) === null, '空数据 → null');
  ok(E.normalizeBossPhaseRun({ bossId: 'other' }, plan, NOW) === null, 'Boss 不匹配 → null');
  ok(E.normalizeBossPhaseRun({ difficulty: 'expert' }, plan, NOW) === null, '难度不匹配 → null（防止复用另一套题目进度）');

  const bad = E.normalizeBossPhaseRun({
    battleId: 'b1', bossId: 'synthetic', difficulty: 'easy', status: 'weird',
    hp: 9999, maxHp: -5, currentPhaseIndex: 999,
    phaseHistory: [{ phaseId: 'nope' }, { phaseId: 'bp-1', phaseIndex: 0, enteredAt: 5, exitedAt: null }],
    stats: { damageDealt: -3, challengeAttempts: 'x' },
    completedTransitionIds: new Array(50).fill('t'), completedChallenges: ['c1', 'c1', 3],
  }, plan, NOW);
  ok(bad.hp === 100 && bad.maxHp === 100, '越界 HP 被钳制到合法范围');
  ok(bad.currentPhaseIndex <= 2, '越界阶段被钳制');
  ok(bad.phaseHistory.every(h => ['bp-1', 'bp-2', 'bp-3'].includes(h.phaseId)), '非法阶段历史被丢弃');
  ok(bad.stats.damageDealt === 0 && bad.stats.challengeAttempts === 0, '非法统计值退化为 0');
  ok(bad.completedTransitionIds.length <= 32, '幂等表长度受限');
  eq(bad.completedChallenges, ['c1'], '挑战完成列表去重并过滤脏值');

  const dead = E.normalizeBossPhaseRun({ bossId: 'synthetic', difficulty: 'easy', status: 'active', hp: 0 }, plan, NOW);
  ok(dead.status === 'victory' && dead.battleResult === 'victory', 'HP=0 的进行中战斗自愈为胜利，防止 Boss 已死亡继续攻击');

  const crossed = E.normalizeBossPhaseRun({ bossId: 'synthetic', difficulty: 'easy', status: 'active', hp: 30, currentPhaseIndex: 0, phaseHistory: [] }, plan, NOW);
  ok(crossed.currentPhaseIndex === 2 && crossed.status === 'active', '血量跨阈值时静默追平阶段（刷新不重复演出）');

  const transitionMissingTarget = E.normalizeBossPhaseRun({ bossId: 'synthetic', difficulty: 'easy', status: 'phase_transition', hp: 60, transition: null }, plan, NOW);
  ok(transitionMissingTarget.status === 'active', '缺失切换数据时安全退回 active');

  const record = E.toBattleRecord({ ...start(plan), status: 'victory', endedAt: NOW, battleResult: 'victory' });
  ok(record && record.grade === null && record.endedAt === NOW, '战斗记录包含 B.5 预留 grade=null');

  const hist = E.normalizeBossBattleHistory([
    record,
    record,
    { bossId: 'unknown', difficulty: 'easy', endedAt: NOW, battleResult: 'victory' },
  ], (bossId, diff) => (bossId === 'synthetic' ? plan : undefined), NOW);
  ok(hist.length === 1, '历史记录按 battleId 去重并过滤未知 Boss');

  const prog = E.normalizeBossPhaseProgress({ synthetic: { highestPhaseIndex: 99, clearedPhases: ['bp-1', 'bp-1', 7], updatedAt: 5 } });
  ok(prog.synthetic.highestPhaseIndex === 99 && prog.synthetic.clearedPhases.length === 1, '阶段进度自愈（保留最高阶段，过滤脏碎片）');

  const reconciled = E.reconcileBossPhaseRun(start(plan), plan, { hp: 0, maxHp: 100 }, NOW);
  ok(reconciled.status === 'victory', 'reconcile：真实血量归零时结算胜利');
}

// ================= 配置构建（2/3/4 阶段） =================
console.log('=== 配置构建 ===');
{
  const gate = P.buildBossPhasePlan('gate-01', 'easy');
  ok(!!gate, 'GATE-01 有阶段配置');
  ok(gate.phases.length === 3, 'GATE-01 为 3 阶段');
  eq(gate.phases.map(p => p.hpThreshold), [100, 75, 50], 'GATE-01 阈值 100/75/50');
  eq(gate.phases.map(p => p.availableChallenges), [['gate-p1'], ['gate-p2'], ['gate-p3', 'gate-p4']], 'GATE-01 挑战分组正确');
  ok(gate.phases.reduce((s, p) => s + p.maxHp, 0) === gate.totalHp, '各阶段血量之和等于总血量');
  ok(gate.phases.every(p => p.availableChallenges.length > 0), '每个阶段都关联真实挑战');

  const k0 = P.buildBossPhasePlan('k0', 'easy');
  ok(k0.phases.length === 2, 'K-0 为 2 阶段（阶段数量不固定为 3）');
  eq(k0.phases.map(p => p.hpThreshold), [100, 50], 'K-0 阈值 100/50');

  const somnia = P.buildBossPhasePlan('somnia', 'easy');
  ok(somnia.phases.length === 4, 'SOMNIA 默认 4 阶段（逐判题阶段）');
  eq(somnia.phases.map(p => p.hpThreshold), [100, 75, 50, 25], 'SOMNIA 阈值 100/75/50/25');

  const hard = P.buildBossPhasePlan('gate-01', 'hard');
  ok(hard.phases.length === 3 && hard.phases[0].availableChallenges[0] === 'gate-h1', 'HARD 难度使用独立题目集');
  ok(hard.phases.every(p => p.difficultyMultiplier === 1.25), 'HARD 阶段难度系数 1.25');

  const five = makePlan({ phases: 5 });
  ok(five.phases.length === 5, '引擎支持任意阶段数量（5 阶段合成配置）');
  ok(P.buildBossPhasePlan('nope', 'easy') === undefined, '未知 Boss 不生成配置');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
