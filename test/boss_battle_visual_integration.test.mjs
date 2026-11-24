// V1.3-B.6.1 视觉系统集成测试（纯视觉隔离 / 事件映射 / 存档 / 层级）
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
const Save = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

console.log('=== 1. 战斗事件映射 / 隔离 ===');
const eventEffects = {
  BOSS_ATTACK_TELEGRAPH: 'boss-warning-pulse',
  BOSS_ATTACK_HIT: 'boss-attack-impact',
  BOSS_ATTACK_BLOCKED: 'boss-defend-pulse',
  BOSS_ATTACK_DODGED: 'boss-dodge-pulse',
  BOSS_WEAKNESS_EXPOSED: 'boss-weakness-flash',
  BOSS_PHASE_TRANSITION: 'boss-phase-flash',
  BOSS_BATTLE_VICTORY: 'boss-terminal-flash',
  BOSS_BATTLE_DEFEAT: 'boss-terminal-flash',
  BOSS_BATTLE_INTERRUPTED: 'boss-terminal-flash',
};
for (const [type, id] of Object.entries(eventEffects)) {
  ok(E.visualEffectIdForBattleEvent(type) === id, '事件映射：' + type);
}
ok(E.visualEffectIdForBattleEvent('UNKNOWN_EVENT') === null, '未知事件不触发视觉');
const player = Save.defaultState();
const beforePlayer = JSON.stringify(player);
const beforeSave = JSON.stringify(player.progress.bossBattleStats);
let visual = E.createVisualRuntime(0);
for (const [type] of Object.entries(eventEffects)) {
  const id = E.visualEffectIdForBattleEvent(type);
  if (id) visual = E.triggerVisualEffect(visual, C.BOSS_VISUAL_EFFECTS[id], 10, { intensity: 'HIGH' }).state;
}
visual = E.cleanupAllVisualEffects(visual, 20);
ok(JSON.stringify(player) === beforePlayer, '视觉触发不修改玩家状态');
ok(JSON.stringify(player.progress.bossBattleStats) === beforeSave, '视觉触发不修改战斗统计');
ok(visual.active.length === 0 && visual.queued.length === 0, '终结/清理后无活动效果');
ok(visual.cleanupCount > 0, '清理计数');
ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');

console.log('=== 2. 视觉优先级与战斗优先级隔离 ===');
ok(C.VISUAL_PRIORITY.terminal === 0 && C.VISUAL_PRIORITY.phase === 1, '视觉 P0/P1');
ok(C.VISUAL_PRIORITY.attack === 4 && C.VISUAL_PRIORITY.defense === 5, '视觉 P4/P5');
ok(C.VISUAL_PRIORITY.hud === 6 && C.VISUAL_PRIORITY.ambient === 7, '视觉 P6/P7');
ok(C.VISUAL_LAYER_Z.settlement === 90 && C.VISUAL_LAYER_Z.critical === 100, '结算/系统层级');
ok(C.VISUAL_LAYER_Z.warning > C.VISUAL_LAYER_Z.hud, '警告层级高于 HUD');
ok(C.VISUAL_LAYER_Z.terminal > C.VISUAL_LAYER_Z.cinematic, '终结层级高于普通演出');

console.log('=== 3. 队列 / 中断 / 清理 ===');
let s = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-phase-flash'], 0).state;
const queued = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-warning-pulse'], 10);
ok(queued.accepted && queued.reason === 'queued', '低优先级排队');
const interrupted = E.interruptVisualEffect(queued.state, 'boss-warning-pulse', 20);
ok(interrupted.queued.length === 0 && interrupted.completed.some(e => e.status === 'cancelled'), '队列取消');
const terminal = E.triggerVisualEffect(interrupted, C.BOSS_VISUAL_EFFECTS['boss-terminal-flash'], 30);
ok(terminal.state.active.length === 1 && terminal.state.active[0].effectId === 'boss-terminal-flash', '终结演出独占');
const cleaned = E.cleanupAllVisualEffects(terminal.state, 40);
ok(cleaned.active.length === 0 && cleaned.queued.length === 0, '页面卸载全清理');
ok(E.cleanupAllVisualEffects(cleaned, 50) === cleaned, '重复清理幂等');

console.log('=== 4. 强度 / 性能 / Reduced Motion ===');
ok(E.particleBudget('LOW', 'full', false) === 0 && E.particleBudget('MEDIUM', 'full', false) > 0, 'LOW/MEDIUM 粒子策略');
ok(E.particleBudget('CINEMATIC', 'full', true) === 0, 'Reduced Motion 关闭粒子');
ok(E.evaluateVisualPerformance(30, 'full', 0, 5000) === 'reduced', '性能下降自动降级');
ok(E.evaluateVisualPerformance(20, 'reduced', 0, 5000) === 'minimal', '严重下降最小模式');
ok(E.evaluateVisualPerformance(60, 'minimal', 0, 1000) === 'minimal', '冷却期不抖动');
ok(C.bossVisualThemeFor('gate-01').visualTheme === 'digital-corruption', 'GATE-01 主题');
ok(C.bossVisualThemeFor('missing').primaryColor === C.DEFAULT_BOSS_VISUAL_THEME.primaryColor, '未知 Boss fallback');

console.log('=== 5. 存档 / 层级隔离 ===');
const norm = Save.normalizePlayerState(JSON.parse(JSON.stringify(player)), 10);
ok(norm.progress.bossBattleStats !== undefined, '迁移保留战斗统计');
ok(norm.progress.bossBattleStats === player.progress.bossBattleStats || JSON.stringify(norm.progress.bossBattleStats) === JSON.stringify(player.progress.bossBattleStats), '迁移不增加视觉存档字段');
ok(norm.exp === player.exp && norm.consciousness === player.consciousness, '视觉不改变经济/意识');
ok(C.VISUAL_LAYER_Z.modal < C.VISUAL_LAYER_Z.settlement, '结算高于普通 Modal');
ok(C.VISUAL_LAYER_Z.interaction < C.VISUAL_LAYER_Z.warning, '交互层不被普通环境效果覆盖');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
