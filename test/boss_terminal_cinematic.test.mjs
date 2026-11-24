// V1.3-B.6.6 Boss 终结（胜利/失败/撤退/中断）电影化配置与视觉引擎单元测试
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
const T = L('src/game/bossTerminalCinematicConfig.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const kinds = ['victory', 'defeat', 'retreat', 'interrupted'];
console.log('=== 1. 配置 / 阶段 ===');
for (const k of kinds) {
  const list = T.terminalStages(k);
  ok(list.length >= 2, '阶段存在：' + k);
  ok(list[0].startMs === 0 && list[list.length - 1].endMs === T.terminalTotalDuration(k), '时间线一致：' + k);
  for (let i = 1; i < list.length; i++) ok(list[i].startMs === list[i - 1].endMs, '无空档：' + k + '#' + i);
  ok(list.every(s => s.kind === k && !!s.stage && !!s.kicker && !!s.label && !!s.text), '阶段字段完整：' + k);
  ok(list[list.length - 1].reveal === true, 'Reveal 阶段：' + k);
}
ok(T.terminalStages('victory').length === 4 && T.terminalStages('defeat').length === 3, 'Victory/Defeat 阶段数');
ok(T.terminalStages('retreat').length === 3 && T.terminalStages('interrupted').length === 2, 'Retreat/Interrupted 阶段数');
ok(T.terminalStageAtElapsed('victory', 0).stage === 'impact', 'Victory 初始 Impact');
ok(T.terminalStageAtElapsed('victory', 5000).stage === 'reveal', 'Victory 末尾 Reveal');
ok(T.terminalStageAtElapsed('defeat', 99999).stage === 'reveal', '超长 elapsed fallback');
console.log('=== 2. 主题 / 标签 ===');
for (const k of kinds) {
  const t = T.terminalThemeFor(k);
  ok(/^#[0-9a-fA-F]{3,8}$/.test(t.primary) && /^#[0-9a-fA-F]{3,8}$/.test(t.secondary) && /^#[0-9a-fA-F]{3,8}$/.test(t.danger), '主题合法：' + k);
}
ok(T.terminalThemeFor('victory').primary !== T.terminalThemeFor('defeat').primary, '胜败主题不同');
ok(T.terminalResultLabel('victory') === 'VICTORY' && T.terminalResultLabel('defeat') === 'DEFEAT', '结果标签');
ok(T.terminalResultLabel('retreat') === 'RETREAT' && T.terminalResultLabel('interrupted') === 'INTERRUPTED', '撤退/中断标签');
console.log('=== 3. 真实事件映射 ===');
ok(T.terminalKindForEvent('BOSS_BATTLE_VICTORY', { hp: 0 }) === 'victory', 'VICTORY → victory');
ok(T.terminalKindForEvent('BOSS_BATTLE_DEFEAT', { hp: 40 }) === 'defeat', 'DEFEAT → defeat');
ok(T.terminalKindForEvent('BOSS_BATTLE_INTERRUPTED', { reason: '玩家撤退' }) === 'retreat', '撤退 reason → retreat');
ok(T.terminalKindForEvent('BOSS_BATTLE_INTERRUPTED', { reason: '玩家主动撤退' }) === 'retreat', '主动撤退 → retreat');
ok(T.terminalKindForEvent('BOSS_BATTLE_INTERRUPTED', { reason: 'external-signal' }) === 'interrupted', '其他 reason → interrupted');
ok(T.terminalKindForEvent('BOSS_BATTLE_INTERRUPTED', {}) === 'interrupted', '空 reason → interrupted');
ok(T.terminalKindForEvent('BOSS_ATTACK_HIT', {}) === null, '非终结事件不映射');
ok(T.terminalKindForEvent('UNKNOWN', null) === null, '未知事件安全');
console.log('=== 4. Snapshot / View / 去重 ===');
const snap = T.terminalSnapshotOf('BOSS_BATTLE_VICTORY', { hp: 0 }, { battleId: 'b1', eventId: 'e1', bossId: 'gate-01', phaseId: 'p1' });
ok(!!snap && snap.battleId === 'b1' && snap.eventId === 'e1' && snap.bossId === 'gate-01', '真实 snapshot 字段');
ok(snap.kind === 'victory' && snap.phaseId === 'p1', 'snapshot kind/phaseId');
ok(T.terminalSnapshotOf('BOSS_ATTACK_HIT', {}, { battleId: 'b', eventId: 'e', bossId: 'g', phaseId: 'p' }) === null, '非法事件 snapshot null');
const view = T.terminalViewFor(snap, '数据港守卫', 1000, 'REAL');
ok(view.battleId === 'b1' && view.terminalId === 'e1' && view.eventId === 'e1', 'View 真实事件字段');
ok(view.bossId === 'gate-01' && view.bossName === '数据港守卫' && view.kind === 'victory', 'View Boss 信息');
ok(view.result === 'VICTORY' && view.source === 'REAL' && view.reveal === false, 'View result/source/reveal');
ok(view.expiresAt === 1000 + T.terminalTotalDuration('victory'), 'View 时长');
const key = T.terminalDedupeKey('b1', 'e1');
ok(key === 'b1:e1', 'battleId:eventId');
ok(key !== T.terminalDedupeKey('b2', 'e1') && key !== T.terminalDedupeKey('b1', 'e2'), '不同战斗/事件不冲突');
ok(T.terminalDedupeKey('', '') === ':', '空值安全');
console.log('=== 5. 视觉注册 / 优先级 ===');
const def = C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'];
ok(!!def, '终结演出注册');
ok(def.priority === C.VISUAL_PRIORITY.terminal && def.priority === 0, 'P0');
ok(def.queueable === false && def.interruptible === false, '不可排队/不可中断');
ok(def.layer === 'terminal', 'terminal 层');
ok(C.VISUAL_PRIORITY.terminal < C.VISUAL_PRIORITY.phase, 'P0 < P1');
console.log('=== 6. 生命周期 / 抢占 / 清理 ===');
let st = E.createVisualRuntime(0);
for (const id of ['boss-attack-warning', 'boss-phase-cinematic']) st = E.triggerVisualEffect(st, C.BOSS_VISUAL_EFFECTS[id], 1, { intensity: 'HIGH' }).state;
const term = E.triggerVisualEffect(st, C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 10, { intensity: 'HIGH' });
ok(term.accepted && term.state.active.some(e => e.effectId === 'boss-terminal-cinematic'), '终结演出启动');
for (const id of ['boss-attack-warning', 'boss-phase-cinematic']) {
  ok(term.state.completed.some(e => e.effectId === id), '终结清理：' + id);
}
const crisisTerm = E.triggerVisualEffect(
  E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-crisis-cinematic'], 0).state,
  C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 5,
);
ok(crisisTerm.state.completed.some(e => e.effectId === 'boss-crisis-cinematic'), '终结清理：boss-crisis-cinematic');
const weakTerm = E.triggerVisualEffect(
  E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-weakness-cinematic'], 0).state,
  C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 5,
);
ok(weakTerm.state.completed.some(e => e.effectId === 'boss-weakness-cinematic'), '终结清理：boss-weakness-cinematic');
const dup = E.triggerVisualEffect(term.state, C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 20);
ok(!dup.accepted && dup.reason === 'duplicate', '重复终结拒绝');
const latePhase = E.triggerVisualEffect(term.state, C.BOSS_VISUAL_EFFECTS['boss-phase-cinematic'], 30);
ok(!latePhase.state.active.some(e => e.effectId === 'boss-phase-cinematic'), '终结后 Phase 不可抢占');
const cleaned = E.cleanupAllVisualEffects(term.state, 40);
ok(cleaned.active.length === 0 && cleaned.queued.length === 0, 'Cleanup 无残留');
ok(E.cleanupAllVisualEffects(cleaned, 50) === cleaned, '重复 cleanup 幂等');
console.log('=== 7. 强度 / 性能 ===');
ok(E.particleBudget('LOW', 'full', false) === 0, 'LOW 无粒子');
ok(E.particleBudget('CINEMATIC', 'full', false) <= C.MAX_PARTICLE_BUDGET, 'CINEMATIC 不超上限');
const reduced = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 0, { intensity: 'HIGH', reducedMotion: true }).state;
ok(reduced.active[0].intensity < 0.5, 'Reduced 降低终结强度');
ok(E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], 0).state.active.length <= C.MAX_ACTIVE_EFFECTS, '活动效果上限');
ok(E.evaluateVisualPerformance(20, 'full', 0, 5000) === 'minimal', '性能降级');
ok(C.VISUAL_LAYER_Z.terminal > C.VISUAL_LAYER_Z.cinematic, '终结层级');
let many = E.createVisualRuntime(0);
for (let i = 0; i < 12; i++) many = E.triggerVisualEffect(many, { ...def, effectId: 'term-' + i, priority: C.VISUAL_PRIORITY.ambient }, i).state;
ok(many.queued.length <= C.MAX_QUEUED_EFFECTS, '队列上限');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
