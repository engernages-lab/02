// V1.3-B.6.2 攻击电影化配置/演出单元测试
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
const A = L('src/game/bossAttackCinematicConfig.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const kinds = ['warning', 'charge', 'release', 'hit', 'block', 'dodge', 'interrupt', 'cancel'];
const eventMap = {
  BOSS_ATTACK_TELEGRAPH: 'warning', BOSS_ATTACK_STARTED: 'release', BOSS_ATTACK_HIT: 'hit',
  BOSS_ATTACK_BLOCKED: 'block', BOSS_ATTACK_DODGED: 'dodge', BOSS_ATTACK_INTERRUPTED: 'interrupt',
  BOSS_ATTACK_CANCELLED: 'cancel',
};

console.log('=== 1. 配置 / 映射 ===');
for (const [event, kind] of Object.entries(eventMap)) ok(A.attackCinematicKindForEvent(event) === kind, '事件映射：' + event);
ok(A.attackCinematicKindForEvent('UNKNOWN') === null, '未知事件不映射');
const expectedTypes = { single: 'data-strike', multi: 'data-strike', aoe: 'digital-wave', delayed: 'system-crash', special: 'corruption-wave' };
for (const [type, visual] of Object.entries(expectedTypes)) ok(A.attackVisualTypeFor(type) === visual, '攻击类型映射：' + type);
ok(A.attackVisualTypeFor('bad-type') === 'digital-wave', '未知攻击类型 fallback');
const gateProfile = A.attackVisualProfileFor('single', 'gate-01');
ok(gateProfile.visualType === 'data-strike' && gateProfile.warningColor === '#FF3D5A', 'GATE-01 攻击主题');
const defaultProfile = A.attackVisualProfileFor('aoe', 'unknown-boss');
ok(defaultProfile.visualType === 'digital-wave' && !!defaultProfile.blockColor, '未知 Boss 默认主题');
for (const k of kinds) ok(!!A.attackEffectIdFor(k) && !!C.getVisualEffectDef(A.attackEffectIdFor(k)), '效果映射：' + k);
ok(A.attackEffectDurationFor('warning', 800) <= 800 && A.attackEffectDurationFor('warning', 800) >= 260, '预警时长受真实窗口约束');
ok(A.attackEffectDurationFor('charge', 2000) <= 2200, '蓄力时长有上限');
ok(A.attackEffectDurationFor('hit') >= 150 && A.attackEffectDurationFor('hit') <= 400, '命中时长');
ok(A.attackResultLabel('block') === 'BLOCKED' && A.attackResultLabel('dodge') === 'DODGED', '格挡/闪避文案');
ok(A.attackResultText('interrupt').includes('打断') && A.attackResultText('cancel').includes('取消'), '打断/取消文案');

console.log('=== 2. 生命周期 / 优先级 / Cleanup ===');
for (const k of kinds) {
  const def = C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor(k)];
  const r = E.triggerVisualEffect(E.createVisualRuntime(0), def, 10, { intensity: 'HIGH' });
  ok(r.accepted && r.state.active.length === 1, '演出触发：' + k);
  const done = E.tickVisualEffects(r.state, 10 + def.duration + 1);
  ok(done.active.length === 0 && done.cleanupCount >= 1, '演出清理：' + k);
}
let s = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], 0, { intensity: 'HIGH' }).state;
const dup = E.triggerVisualEffect(s, C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], 20);
ok(!dup.accepted && dup.reason === 'duplicate', '重复攻击事件拒绝');
const preRelease = E.interruptVisualEffect(s, 'boss-attack-warning', 30);
const release = E.triggerVisualEffect(preRelease, C.BOSS_VISUAL_EFFECTS['boss-attack-release'], 31, { intensity: 'HIGH' });
ok(release.accepted && release.state.completed.some(e => e.status === 'interrupted'), '释放演出中断预警');
const terminal = E.triggerVisualEffect(release.state, C.BOSS_VISUAL_EFFECTS['boss-terminal-flash'], 40);
ok(terminal.state.active.length === 1 && terminal.state.queued.length === 0, '终结清理所有攻击演出');
ok(E.cleanupAllVisualEffects(terminal.state, 50).active.length === 0, 'Cleanup All');
ok(C.BOSS_VISUAL_EFFECTS['boss-attack-warning'].priority === C.VISUAL_PRIORITY.attack, '攻击预警 P4');
ok(C.BOSS_VISUAL_EFFECTS['boss-attack-block'].priority === C.VISUAL_PRIORITY.defense, '格挡 P5');
ok(C.BOSS_VISUAL_EFFECTS['boss-attack-interrupt'].priority === C.VISUAL_PRIORITY.weakness, '打断 P3');

console.log('=== 3. Reduced Motion / 强度 / 性能 ===');
const low = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-hit'], 0, { intensity: 'LOW', reducedMotion: true }).state;
ok(low.active[0].intensity < 0.5, 'Reduced Motion 降低强效果');
const high = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-release'], 0, { intensity: 'CINEMATIC' }).state;
ok(high.active[0].intensity > low.active[0].intensity, 'CINEMATIC 强度更高');
ok(E.particleBudget('MEDIUM', 'full', false) > 0 && E.particleBudget('MEDIUM', 'minimal', false) <= E.particleBudget('MEDIUM', 'full', false), '粒子性能预算');
ok(E.evaluateVisualPerformance(20, 'full', 0, 5000) === 'minimal', '攻击演出性能降级');
ok(C.VISUAL_INTENSITY_PROFILES.LOW.particles === 0, 'LOW 粒子为零');

console.log('=== 4. 配置安全 / 事件序列 ===');
const invalid = E.triggerVisualEffect(E.createVisualRuntime(0), { effectId: '', duration: 0 }, 0);
ok(!invalid.accepted && invalid.reason === 'invalid', '非法攻击配置拒绝');
const fallback = A.attackVisualProfileFor(undefined, 'unknown');
ok(fallback.visualType === 'digital-wave' && fallback.intensity === 0.7, '缺失攻击配置 fallback');
ok(A.attackEffectIdFor('warning') !== A.attackEffectIdFor('release'), '攻击阶段 effectId 唯一');
const sequence = ['warning', 'charge', 'release', 'hit', 'block', 'dodge', 'interrupt', 'cancel'];
ok(new Set(sequence.map(A.attackEffectIdFor)).size === sequence.length, '攻击阶段 ID 唯一');
const eventIds = Object.keys(eventMap);
ok(eventIds.length === 7 && new Set(eventIds).size === 7, '事件类型完整');
ok(C.BOSS_ATTACK_VISUAL_THEMES === undefined, '未重复建立 Boss 主题系统');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
