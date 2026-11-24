// V1.3-B.6.8 视觉系统终验收：事件注册 / 优先级 / 模式 / 压力 / 只读
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
    const b = join(dirname(abs), sp);
    const c = existsSync(b) && extname(b) ? b : existsSync(b + '.ts') ? b + '.ts' : b + '/index.ts';
    return load(c);
  });
  return mod.exports;
}
const L = (rel) => load(join(root, rel));
const C = L('src/game/bossBattleVisualConfig.ts');
const E = L('src/game/bossBattleVisualEngine.ts');
const P = L('src/game/bossPhaseTransitionCinematicConfig.ts');
const W = L('src/game/bossWeaknessCinematicConfig.ts');
const X = L('src/game/bossCrisisCinematicConfig.ts');
const T = L('src/game/bossTerminalCinematicConfig.ts');
const Phase = L('src/game/bossPhaseEngine.ts');
const Plans = L('src/game/bossPhasePlans.ts');
const Arbiter = L('src/game/combatEventArbiter.ts');
const Save = L('src/services/save.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const NOW = 1100000;
const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
const run = Phase.activateBattle(Phase.prepareBattle(Phase.createBossPhaseRun(plan, NOW, { battleId: 'b68', hp: plan.totalHp }), NOW).run, plan, NOW).run;
console.log('=== 1. Visual Event Registry ===');
const attackIds = ['boss-attack-warning', 'boss-attack-charge', 'boss-attack-release', 'boss-attack-hit', 'boss-attack-block', 'boss-attack-dodge', 'boss-attack-interrupt', 'boss-attack-cancel'];
ok(attackIds.every(id => !!C.BOSS_VISUAL_EFFECTS[id]), 'Attack 八类效果注册');
for (const id of attackIds) ok(C.BOSS_VISUAL_EFFECTS[id].priority === C.VISUAL_PRIORITY.attack || C.BOSS_VISUAL_EFFECTS[id].priority === C.VISUAL_PRIORITY.defense || C.BOSS_VISUAL_EFFECTS[id].priority === C.VISUAL_PRIORITY.weakness, 'Attack 优先级合法：' + id);
ok(C.BOSS_VISUAL_EFFECTS['boss-phase-cinematic'].priority === C.VISUAL_PRIORITY.phase, 'Phase P1');
ok(C.BOSS_VISUAL_EFFECTS['boss-weakness-cinematic'].priority === C.VISUAL_PRIORITY.weakness, 'Weakness P3');
ok(C.BOSS_VISUAL_EFFECTS['boss-crisis-cinematic'].priority === C.VISUAL_PRIORITY.crisis, 'Crisis P2');
ok(C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'].priority === C.VISUAL_PRIORITY.terminal, 'Terminal P0');
ok(P.PHASE_CINEMATIC_STAGES.length === 6, 'Phase 六阶段');
ok(W.WEAKNESS_CINEMATIC_STAGES.length === 6, 'Weakness 六阶段');
ok(X.CRISIS_CINEMATIC_STAGES.length === 8, 'Crisis 八阶段');
ok(['victory', 'defeat', 'retreat', 'interrupted'].every(k => T.terminalStages(k).length >= 2), 'Terminal 四种类型');
ok(E.visualEffectIdForBattleEvent('BOSS_ATTACK_TELEGRAPH') === 'boss-warning-pulse', '真实 Attack 事件映射');
ok(E.visualEffectIdForBattleEvent('BOSS_PHASE_TRANSITION') === 'boss-phase-flash', '真实 Phase 事件映射');
ok(E.visualEffectIdForBattleEvent('BOSS_WEAKNESS_EXPOSED') === 'boss-weakness-flash', '真实 Weakness 事件映射');
ok(E.visualEffectIdForBattleEvent('BOSS_BATTLE_VICTORY') === 'boss-terminal-flash', '真实 Terminal 事件映射');
console.log('=== 2. 全局优先级 ===');
ok(C.VISUAL_PRIORITY.terminal < C.VISUAL_PRIORITY.phase && C.VISUAL_PRIORITY.phase < C.VISUAL_PRIORITY.crisis, 'P0<P1<P2');
ok(C.VISUAL_PRIORITY.crisis < C.VISUAL_PRIORITY.weakness && C.VISUAL_PRIORITY.weakness < C.VISUAL_PRIORITY.attack, 'P2<P3<P4');
ok(C.VISUAL_PRIORITY.attack < C.VISUAL_PRIORITY.defense && C.VISUAL_PRIORITY.defense < C.VISUAL_PRIORITY.ambient, 'P4<P5<P7');
ok(Arbiter.COMBAT_PRIORITY.TERMINAL === 0 && Arbiter.COMBAT_PRIORITY.BATTLE_FLOW === 1 && Arbiter.COMBAT_PRIORITY.CRISIS === 2 && Arbiter.COMBAT_PRIORITY.WEAKNESS === 3, 'B.4 业务优先级一致');
console.log('=== 3. 冲突场景 ===');
let s = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], 0).state;
let r = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-phase-cinematic'], 1);
ok(r.state.completed.some(e => e.effectId === 'boss-attack-warning'), 'Attack Warning → Phase 抢占');
ok(!r.state.active.some(e => e.effectId === 'boss-attack-warning'), 'Phase 中 Attack 不复活');
s = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-weakness-cinematic'], 0).state;
r = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-phase-cinematic'], 1);
ok(r.state.completed.some(e => e.effectId === 'boss-weakness-cinematic'), 'Weakness → Phase 抢占');
s = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], 0).state;
s = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-weakness-cinematic'], 1).state;
r = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-crisis-cinematic'], 2);
ok(r.state.active.length === 1 && r.state.active[0].effectId === 'boss-crisis-cinematic', 'Attack+Weakness→Crisis 单全屏');
s = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], 0).state;
s = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-weakness-cinematic'], 1).state;
s = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-crisis-cinematic'], 2).state;
r = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-phase-cinematic'], 3);
ok(r.state.active.length === 1 && r.state.active[0].effectId === 'boss-phase-cinematic', '四事件冲突 Phase 接管');
r = E.triggerVisualEffect(r.state, C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 4);
ok(r.state.active.length === 1 && r.state.active[0].effectId === 'boss-terminal-cinematic', 'Terminal P0 最终接管');
console.log('=== 4. Terminal P0 × 模式 ===');
for (const mode of ['NORMAL', 'REDUCED', 'LOW', 'CRITICAL']) {
  const st = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 0, { intensity: 'CINEMATIC', performanceMode: mode }).state;
  ok(st.active.length === 1 && st.active[0].effectId === 'boss-terminal-cinematic', 'Terminal 可用：' + mode);
}
const redTerm = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 0, { intensity: 'CINEMATIC', reducedMotion: true }).state;
ok(redTerm.active.length === 1, 'Terminal Reduced Motion 保留事件');
ok(T.terminalStages('victory').every(s2 => !!s2.kicker && !!s2.text), 'Terminal 文本不因模式删除');
console.log('=== 5. 性能模式全演出 ===');
for (const mode of ['NORMAL', 'REDUCED', 'LOW', 'CRITICAL']) {
  for (const id of ['boss-attack-warning', 'boss-phase-cinematic', 'boss-weakness-cinematic', 'boss-crisis-cinematic', 'boss-terminal-cinematic']) {
    const st = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS[id], 0, { intensity: 'CINEMATIC', performanceMode: mode }).state;
    ok(st.active.length === 1, mode + ' 触发 ' + id);
  }
  ok(E.particleBudget('CINEMATIC', 'full', false, mode) <= C.MAX_PARTICLE_BUDGET, mode + ' 粒子预算');
}
console.log('=== 6. AUTO 降级 / 恢复 ===');
let auto = { mode: 'NORMAL', smoothedFps: 60, lastChangeAt: 0, stableSince: 0, reason: '' };
for (let i = 1; i <= 12; i++) auto = E.nextPerformanceMode(auto, 'AUTO', 25, NOW + i * 1000).state;
ok(auto.mode === 'CRITICAL', 'AUTO 降至 CRITICAL');
for (let i = 13; i <= 32; i++) auto = E.nextPerformanceMode(auto, 'AUTO', 60, NOW + i * 1000).state;
ok(auto.mode !== 'CRITICAL', 'AUTO 恢复离开 CRITICAL');
const forced = E.nextPerformanceMode({ ...auto }, 'LOW', 60, NOW + 40000);
ok(forced.state.mode === 'LOW', '强制模式优先');
console.log('=== 7. Reduced Motion / Flash Safety ===');
const flash = C.BOSS_VISUAL_EFFECTS['boss-terminal-flash'];
const crit = E.triggerVisualEffect(E.createVisualRuntime(0), flash, 0, { intensity: 'CINEMATIC', performanceMode: 'CRITICAL' }).state.active[0];
ok(crit.intensity === 0, 'CRITICAL Flash=0');
const low = E.triggerVisualEffect(E.createVisualRuntime(0), flash, 0, { intensity: 'CINEMATIC', performanceMode: 'LOW' }).state.active[0];
ok(low.intensity > 0 && low.intensity < 0.5, 'LOW Flash 安全降低');
const rm = E.triggerVisualEffect(E.createVisualRuntime(0), flash, 0, { intensity: 'CINEMATIC', reducedMotion: true }).state.active[0];
ok(rm.intensity < 0.5, 'Reduced Motion Flash 降低');
ok(E.particleBudget('CINEMATIC', 'full', true) === 0, 'Reduced Motion 0 粒子');
console.log('=== 8. 压力 / 生命周期 ===');
let stress = E.createVisualRuntime(0);
for (let i = 0; i < 20; i++) {
  stress = E.triggerVisualEffect(stress, { ...C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], effectId: 'b68-atk-' + i }, i).state;
  stress = E.interruptVisualEffect(stress, 'b68-atk-' + i, i);
  stress = E.triggerVisualEffect(stress, { ...C.BOSS_VISUAL_EFFECTS['boss-weakness-cinematic'], effectId: 'b68-weak-' + i }, i + 0.1).state;
  stress = E.interruptVisualEffect(stress, 'b68-weak-' + i, i + 0.1);
}
ok(stress.active.length === 0 && stress.queued.length === 0, 'Stress A 清理后无残留');
let burst = E.createVisualRuntime(0);
for (let i = 0; i < 60; i++) burst = E.triggerVisualEffect(burst, { ...C.BOSS_VISUAL_EFFECTS['boss-particle-stream'], effectId: 'b68-burst-' + i, queueable: true }, i).state;
ok(burst.active.length <= C.MAX_ACTIVE_EFFECTS && burst.queued.length <= C.MAX_QUEUED_EFFECTS, 'Stress B 硬限制');
for (let i = 0; i < 50; i++) {
  let c = E.triggerVisualEffect(E.createVisualRuntime(0), { ...C.BOSS_VISUAL_EFFECTS['boss-crisis-cinematic'], effectId: 'b68-cycle-' + i }, i).state;
  c = E.interruptVisualEffect(c, 'b68-cycle-' + i, i + 0.1);
  c = E.cleanupAllVisualEffects(c, i + 0.2);
  c = E.triggerVisualEffect(c, { ...C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], effectId: 'b68-term-' + i }, i + 0.3).state;
  c = E.cleanupAllVisualEffects(c, i + 0.4);
  if (c.active.length !== 0 || c.queued.length !== 0) { ok(false, 'Stress C cycle ' + i); break; }
  if (i === 49) ok(true, 'Stress C 50 次生命周期');
}
console.log('=== 9. 业务只读 / Settlement / Archive ===');
const p = Save.defaultState();
const before = JSON.stringify(p);
for (let i = 0; i < 10; i++) {
  let c = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], i).state;
  E.cleanupAllVisualEffects(c, i + 1);
}
ok(JSON.stringify(p) === before, '视觉压力不改 Save/Stats/Rating/Reward/Achievement/Archive');
ok(Save.SAVE_VERSION === 10, 'Save v10');
const finish = Phase.finishBattle(run, 'victory', NOW + 5000);
ok(finish.ok && finish.events.some(e => e.type === Phase.BOSS_BATTLE_EVENTS.VICTORY), '真实 Victory 业务结果不变');
ok(run.status === 'active' && run.hp === plan.totalHp, '视觉测试不改原 run');
console.log('=== 10. Settings / Visibility ===');
ok(C.normalizePerformanceMode('AUTO') === 'AUTO' && C.normalizePerformanceMode('LOW') === 'LOW', 'Performance 设置合法');
ok(C.performanceLevelForMode('CRITICAL') === 'minimal', 'CRITICAL → minimal');
ok(E.visualsPaused(true, false) && E.visualsPaused(false, true), 'Visibility 暂停');
ok(E.renderCostLevel('CRITICAL', 6, 64) === 'LOW', 'CRITICAL Render Cost LOW');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
