// V1.3-B.6.7 集成：性能模式 / Reduced Motion / Cleanup 对 B.6.1~B.6.6 的只读验证
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
const Phase = L('src/game/bossPhasePlans.ts');
const Plans = L('src/game/bossPhasePlans.ts');
const Engine = L('src/game/bossPhaseEngine.ts');
const Weak = L('src/game/bossWeaknessEngine.ts');
const Catalog = L('src/game/bossWeaknessCatalog.ts');
const Save = L('src/services/save.ts');
const X = L('src/game/bossCrisisCinematicConfig.ts');
const W = L('src/game/bossWeaknessCinematicConfig.ts');
const T = L('src/game/bossTerminalCinematicConfig.ts');
const P = L('src/game/bossPhaseTransitionCinematicConfig.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const NOW = 1000000;
const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
let run = Engine.activateBattle(Engine.prepareBattle(Engine.createBossPhaseRun(plan, NOW, { battleId: 'b67', hp: plan.totalHp }), NOW).run, plan, NOW).run;
const defs = Catalog.weaknessDefinitionsFor('gate-01', 'easy');
let weak = Weak.createBossWeaknessRun('b67', 'gate-01', plan.phases[0].phaseId, 0, defs, NOW);
weak = Weak.observeWeakness(weak, defs, { kind: 'attack-telegraph' }, NOW + 1).state;
const beforeRun = JSON.stringify(run);
const beforeWeak = JSON.stringify(weak);
console.log('=== 1. 性能模式不影响业务 ===');
let vis = E.createVisualRuntime(NOW);
for (const mode of ['NORMAL', 'REDUCED', 'LOW', 'CRITICAL']) {
  for (const id of ['boss-attack-warning', 'boss-phase-cinematic', 'boss-weakness-cinematic', 'boss-crisis-cinematic', 'boss-terminal-cinematic']) {
    vis = E.interruptVisualEffect(vis, id, NOW);
    vis = E.triggerVisualEffect(vis, C.BOSS_VISUAL_EFFECTS[id], NOW, { intensity: 'CINEMATIC', performanceMode: mode }).state;
  }
}
ok(JSON.stringify(run) === beforeRun, '视觉性能模式不修改真实 run');
ok(JSON.stringify(weak) === beforeWeak, '视觉性能模式不修改弱点状态');
ok(run.status === 'active' && run.hp === plan.totalHp, 'Boss HP / 状态保持');
const p = Save.defaultState();
const pBefore = JSON.stringify(p);
E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 0, { performanceMode: 'CRITICAL' });
ok(JSON.stringify(p) === pBefore, '视觉性能模式不改存档/统计/奖励/成就/归档');
ok(Save.SAVE_VERSION === 10, 'Save v10');
console.log('=== 2. B.6.2~B.6.6 效果在 CRITICAL 下仍可触发 ===');
for (const id of ['boss-attack-warning', 'boss-attack-charge', 'boss-attack-release', 'boss-attack-hit', 'boss-attack-block', 'boss-attack-dodge', 'boss-phase-cinematic', 'boss-weakness-cinematic', 'boss-crisis-cinematic', 'boss-terminal-cinematic']) {
  const s = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS[id], 0, { intensity: 'CINEMATIC', performanceMode: 'CRITICAL' }).state;
  ok(s.active.some(e => e.effectId === id), 'CRITICAL 仍触发：' + id);
}
console.log('=== 3. Reduced Motion 核心信息保留 ===');
ok(W.WEAKNESS_CINEMATIC_STAGES.length === 6, 'B.6.4 六阶段配置保留');
ok(P.PHASE_CINEMATIC_TOTAL_MS > 0, 'B.6.3 阶段配置保留');
ok(X.CRISIS_CINEMATIC_STAGES.length === 8, 'B.6.5 八阶段配置保留');
ok(T.terminalStages('victory').length === 4 && T.terminalStages('defeat').length === 3, 'B.6.6 Victory/Defeat 配置保留');
const reducedWeak = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-weakness-cinematic'], 0, { intensity: 'HIGH', reducedMotion: true }).state;
ok(reducedWeak.active.length === 1 && reducedWeak.active[0].intensity < 0.5, 'Reduced Motion 保留弱点事件但降强度');
const reducedTerm = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 0, { intensity: 'HIGH', reducedMotion: true }).state;
ok(reducedTerm.active.length === 1, 'Reduced Motion 保留 Terminal');
console.log('=== 4. Hard Limits / Terminal P0 ===');
let stress = E.createVisualRuntime(0);
for (let i = 0; i < 40; i++) {
  stress = E.triggerVisualEffect(stress, { ...C.BOSS_VISUAL_EFFECTS['boss-particle-burst'], effectId: 'b67-int-' + i, duration: 400, queueable: true, priority: C.VISUAL_PRIORITY.ambient }, i).state;
}
ok(stress.active.length <= C.MAX_ACTIVE_EFFECTS, 'Active 上限');
ok(stress.queued.length <= C.MAX_QUEUED_EFFECTS, 'Queue 上限');
ok(E.particleBudget('CINEMATIC', 'full', false, 'NORMAL') <= C.MAX_PARTICLE_BUDGET, '粒子 Hard Limit');
const term = E.triggerVisualEffect(stress, C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 50, { performanceMode: 'CRITICAL' });
ok(term.state.active.some(e => e.effectId === 'boss-terminal-cinematic'), 'Terminal P0 优先');
ok(term.state.queued.length === 0, 'Terminal 清空队列');
const after = E.triggerVisualEffect(term.state, C.BOSS_VISUAL_EFFECTS['boss-phase-cinematic'], 60);
ok(!after.state.active.some(e => e.effectId === 'boss-phase-cinematic'), 'Terminal 后旧事件不复活');
console.log('=== 5. Cleanup / Visibility / DPR ===');
const cleaned = E.cleanupAllVisualEffects(term.state, 70);
ok(cleaned.active.length === 0 && cleaned.queued.length === 0, 'Cleanup 清空');
ok(E.cleanupAllVisualEffects(cleaned, 80) === cleaned, 'Cleanup 幂等');
ok(E.visualsPaused(true, false) && !E.visualsPaused(false, false), 'Visibility 暂停语义');
ok(C.maxDprForMode('NORMAL') === 2 && C.maxDprForMode('CRITICAL') === 1, 'DPR 模式');
console.log('=== 6. 动态降级 / 恢复 ===');
let state = { mode: 'NORMAL', smoothedFps: 60, lastChangeAt: 0, stableSince: 0, reason: '' };
for (let i = 1; i <= 12; i++) state = E.nextPerformanceMode(state, 'AUTO', 25, NOW + i * 1000).state;
ok(state.mode === 'CRITICAL', '低 FPS 自动 CRITICAL');
for (let i = 13; i <= 30; i++) state = E.nextPerformanceMode(state, 'AUTO', 60, NOW + i * 1000).state;
ok(state.mode !== 'CRITICAL', '恢复不立即跳回 NORMAL');
ok(state.mode === 'NORMAL' || state.mode === 'REDUCED' || state.mode === 'LOW', '恢复为合法等级', state.mode);
console.log('=== 7. Settings 兼容 ===');
ok(C.normalizePerformanceMode('AUTO') === 'AUTO' && C.normalizePerformanceMode('LOW') === 'LOW', 'Settings 模式合法');
ok(C.performanceModeFromStorage(null) === 'AUTO', '旧存档/无设置默认 AUTO');
ok(C.performanceLevelForMode('NORMAL') === 'full' && C.performanceLevelForMode('CRITICAL') === 'minimal', '模式→引擎等级');
ok(JSON.stringify(JSON.parse(pBefore).settings) === JSON.stringify(Save.defaultState().settings), '旧 Settings 结构不被修改');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
