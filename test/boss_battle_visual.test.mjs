// V1.3-B.6.1 视觉基础系统单元测试
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

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const def = (id) => C.BOSS_VISUAL_EFFECTS[id];

console.log('=== 1. 配置 / 主题 ===');
ok(C.BOSS_VISUAL_VERSION === 'v1.0.0', '视觉版本');
ok(Object.keys(C.VISUAL_INTENSITY_PROFILES).length === 4, '四档强度');
ok(C.VISUAL_INTENSITY_PROFILES.LOW.particles < C.VISUAL_INTENSITY_PROFILES.CINEMATIC.particles, '强度粒子递增');
ok(C.VISUAL_INTENSITY_PROFILES.LOW.shake === 0, 'LOW 关闭震动');
ok(C.VISUAL_PRIORITY.terminal < C.VISUAL_PRIORITY.phase && C.VISUAL_PRIORITY.phase < C.VISUAL_PRIORITY.crisis, '视觉优先级顺序');
ok(C.getVisualEffectDef('boss-warning-pulse')?.effectType === 'pulse', '注册表读取脉冲');
ok(C.getVisualEffectDef('missing-effect') === null, '未知效果安全');
const gate = C.bossVisualThemeFor('gate-01');
ok(gate.primaryColor === '#00E5FF' && gate.visualTheme === 'digital-corruption', 'GATE-01 主题');
const fallback = C.bossVisualThemeFor('unknown-boss');
ok(fallback.bossId === 'unknown-boss' && fallback.primaryColor === C.DEFAULT_BOSS_VISUAL_THEME.primaryColor, '未知 Boss fallback');
const badTheme = C.bossVisualThemeFor('');
ok(badTheme.primaryColor && badTheme.secondaryColor, '空 Boss 配置安全');
ok(C.VISUAL_INTENSITY_PROFILES.MEDIUM.intensity === 'MEDIUM', '默认强度 MEDIUM');

console.log('=== 2. 触发 / 幂等 / 生命周期 ===');
let s = E.createVisualRuntime(1000);
const r1 = E.triggerVisualEffect(s, def('boss-warning-pulse'), 1000, { intensity: 'MEDIUM' });
s = r1.state;
ok(r1.accepted && s.active.length === 1 && s.active[0].status === 'playing', '触发进入 PLAYING');
ok(s.active[0].endsAt === 2000 && s.sequence === 1, '效果时长/序号');
ok(s.active[0].cleanupExecuted === false, '未结束不清理');
const dup = E.triggerVisualEffect(s, def('boss-warning-pulse'), 1050);
ok(!dup.accepted && dup.reason === 'duplicate', '重复 effectId 拒绝');
const invalid = E.triggerVisualEffect(s, { effectId: '', duration: 0 }, 1050);
ok(!invalid.accepted && invalid.reason === 'invalid', '非法效果拒绝');
const ticked = E.tickVisualEffects(s, 2100);
ok(ticked.active.length === 0 && ticked.completed.length === 1, '到期进入 COMPLETED');
ok(ticked.completed[0].cleanupExecuted === true && ticked.cleanupCount === 1, '完成清理一次');
const ticked2 = E.tickVisualEffects(ticked, 2200);
ok(ticked2.cleanupCount === 1, '重复 tick 不重复清理');

console.log('=== 3. 优先级 / 队列 / 中断 ===');
s = E.triggerVisualEffect(E.createVisualRuntime(0), def('boss-warning-pulse'), 0, { intensity: 'HIGH' }).state;
const high = E.triggerVisualEffect(s, def('boss-phase-flash'), 10, { intensity: 'HIGH' });
s = high.state;
ok(high.accepted && s.active.some(e => e.effectId === 'boss-phase-flash'), '高优先级抢占');
ok(s.completed.some(e => e.effectId === 'boss-warning-pulse' && e.status === 'interrupted'), '低优先级被中断');
ok(s.cleanupCount === 1 && s.interruptedCount === 1, '中断清理计数');
const queued = E.triggerVisualEffect(s, def('boss-warning-pulse'), 20, { intensity: 'HIGH' });
s = queued.state;
ok(queued.accepted && queued.reason === 'queued' && s.queued.length === 1, '低优先级进入队列');
const interrupted = E.interruptVisualEffect(s, 'boss-warning-pulse', 30);
ok(interrupted.queued.length === 0 && interrupted.completed.some(e => e.status === 'cancelled'), '队列取消 CLEANUP');
const phaseEnd = E.tickVisualEffects(interrupted, 2000);
ok(phaseEnd.active.length === 0 && phaseEnd.queued.length === 0, '无队列时不残留');
s = E.triggerVisualEffect(E.createVisualRuntime(0), def('boss-warning-pulse'), 0).state;
const term = E.triggerVisualEffect(s, def('boss-terminal-flash'), 5, { intensity: 'HIGH' });
ok(term.accepted && term.state.active[0].effectId === 'boss-terminal-flash', '终结效果优先级 P0');
ok(term.state.active.length === 1 && term.state.queued.length === 0, '终结清空所有演出');
const cleaned = E.cleanupAllVisualEffects(term.state, 10);
ok(cleaned.active.length === 0 && cleaned.queued.length === 0, 'cleanupAll 清空');
ok(cleaned.cleanupCount >= term.state.cleanupCount, 'cleanupAll 计数不下降');

console.log('=== 4. 队列上限 / 丢弃 ===');
s = E.triggerVisualEffect(E.createVisualRuntime(0), def('boss-phase-flash'), 0).state;
for (const id of ['boss-warning-pulse', 'boss-crisis-glitch', 'boss-weakness-flash', 'boss-defend-pulse', 'boss-dodge-pulse', 'boss-hud-pulse', 'boss-particle-burst', 'boss-particle-stream', 'boss-scanline']) {
  const r = E.triggerVisualEffect(s, def(id), 10);
  s = r.state;
}
ok(s.queued.length <= C.MAX_QUEUED_EFFECTS, '队列上限');
ok(s.droppedCount >= 0, '丢弃计数安全');
const terminalOnQueue = E.triggerVisualEffect(s, def('boss-terminal-flash'), 100).state;
ok(terminalOnQueue.queued.length === 0, '终结清空队列');

console.log('=== 5. Reduced Motion / 强度 / 性能 ===');
ok(E.particleBudget('LOW', 'full', false) === 0, 'LOW 无粒子');
ok(E.particleBudget('MEDIUM', 'full', true) === 0, 'Reduced Motion 无粒子');
ok(E.particleBudget('HIGH', 'full', false) > E.particleBudget('MEDIUM', 'full', false), '高强度粒子更多');
ok(E.particleBudget('CINEMATIC', 'minimal', false) < E.particleBudget('CINEMATIC', 'full', false), '性能降级减少粒子');
ok(E.particleBudget('CINEMATIC', 'full', false) <= C.MAX_PARTICLE_BUDGET, '粒子上限');
const low = E.triggerVisualEffect(E.createVisualRuntime(0), def('boss-attack-impact'), 0, { intensity: 'LOW', reducedMotion: true }).state;
ok(low.active[0].intensity === 0, 'Reduced Motion 关闭震动强度');
const normal = E.triggerVisualEffect(E.createVisualRuntime(0), def('boss-attack-impact'), 0, { intensity: 'HIGH' }).state;
ok(normal.active[0].intensity > 0, '正常震动强度');
ok(E.evaluateVisualPerformance(60, 'full', 0, 5000) === 'full', '正常 FPS 保持');
ok(E.evaluateVisualPerformance(40, 'full', 0, 5000) === 'reduced', 'FPS 下降降级');
ok(E.evaluateVisualPerformance(20, 'reduced', 0, 5000) === 'minimal', '严重下降最小模式');
ok(E.evaluateVisualPerformance(60, 'reduced', 0, 1000) === 'reduced', '冷却期不立即升级');
ok(E.evaluateVisualPerformance(60, 'reduced', 0, 9000) === 'full', '冷却后恢复');
ok(E.visualIntensityFromStorage('CINEMATIC') === 'CINEMATIC' && E.visualIntensityFromStorage('bad') === 'MEDIUM', '强度存储 fallback');

console.log('=== 6. 纯视觉 / 统计 ===');
const stats = E.visualEffectStats(s);
ok(stats.active >= 0 && stats.queued >= 0 && stats.completed >= 0, '统计计数');
ok(E.effectDefForId('boss-terminal-flash')?.priority === 0, 'effectDefForId');
ok(E.triggerVisualEffect(E.createVisualRuntime(0), null, 0).accepted === false, 'null 效果拒绝');
const copy = JSON.stringify(C.BOSS_VISUAL_THEMES['gate-01']);
C.bossVisualThemeFor('gate-01');
ok(JSON.stringify(C.BOSS_VISUAL_THEMES['gate-01']) === copy, '主题读取不修改配置');
ok(C.VISUAL_LAYER_Z.settlement > C.VISUAL_LAYER_Z.modal, '结算层级高于 Modal');
ok(C.VISUAL_LAYER_Z.critical > C.VISUAL_LAYER_Z.settlement, '系统层最高');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
