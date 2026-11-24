// V1.3-B.6.8 视觉系统长期稳定性 / 泄漏检查
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
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
console.log('=== 1. 50 次 Trigger / Interrupt / Cleanup / Terminal ===');
let s = E.createVisualRuntime(0);
let leak = false;
for (let i = 0; i < 50; i++) {
  s = E.triggerVisualEffect(s, { ...C.BOSS_VISUAL_EFFECTS['boss-crisis-cinematic'], effectId: 'stab-crisis-' + i }, i * 10).state;
  s = E.interruptVisualEffect(s, 'stab-crisis-' + i, i * 10 + 1);
  s = E.cleanupAllVisualEffects(s, i * 10 + 2);
  s = E.triggerVisualEffect(s, { ...C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], effectId: 'stab-term-' + i }, i * 10 + 3).state;
  s = E.cleanupAllVisualEffects(s, i * 10 + 4);
  if (s.active.length !== 0 || s.queued.length !== 0) { leak = true; break; }
}
ok(!leak, '50 次循环无 Active/Queue 泄漏');
ok(s.completed.length <= 24, 'Completed 历史有界', String(s.completed.length));
ok(s.sequence > 0, 'Sequence 正常推进');
console.log('=== 2. 100 次 Terminal 抢占 ===');
let t = E.createVisualRuntime(0);
for (let i = 0; i < 100; i++) {
  t = E.triggerVisualEffect(t, { ...C.BOSS_VISUAL_EFFECTS['boss-terminal-cinematic'], effectId: 'stab-t-' + i }, i).state;
}
ok(t.active.length === 1, 'Terminal 始终单实例');
ok(t.queued.length === 0, 'Terminal 不进入队列');
ok(t.completed.length <= 24, 'Completed 有界');
console.log('=== 3. 粒子 / 效果 / 队列硬限制 ===');
let b = E.createVisualRuntime(0);
for (let i = 0; i < 200; i++) {
  b = E.triggerVisualEffect(b, { ...C.BOSS_VISUAL_EFFECTS['boss-particle-stream'], effectId: 'stab-p-' + i, queueable: true }, i).state;
}
ok(b.active.length <= C.MAX_ACTIVE_EFFECTS, 'Active ≤6');
ok(b.queued.length <= C.MAX_QUEUED_EFFECTS, 'Queue ≤8');
ok(E.particleBudget('CINEMATIC', 'full', false, 'NORMAL') <= C.MAX_PARTICLE_BUDGET, 'Particles ≤96');
console.log('=== 4. Cleanup 幂等 / 完成态 ===');
const clean = E.cleanupAllVisualEffects(t, 1000);
ok(clean.active.length === 0 && clean.queued.length === 0, 'Cleanup 清空');
ok(E.cleanupAllVisualEffects(clean, 1001) === clean, '重复 Cleanup 幂等');
const late = E.triggerVisualEffect(clean, C.BOSS_VISUAL_EFFECTS['boss-phase-cinematic'], 1002);
ok(late.state.active.length === 1, 'Cleanup 后可重新开始新区块');
console.log('=== 5. 多模式重复切换 ===');
let m = E.createVisualRuntime(0);
for (let i = 0; i < 100; i++) {
  const mode = ['NORMAL', 'REDUCED', 'LOW', 'CRITICAL'][i % 4];
  m = E.interruptVisualEffect(m, 'stab-mode', i);
  m = E.triggerVisualEffect(m, { ...C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], effectId: 'stab-mode' }, i, { performanceMode: mode }).state;
}
ok(m.active.length === 1, '模式切换单实例');
ok(m.active[0].intensity >= 0 && m.active[0].intensity <= 1, '强度合法');
console.log('=== 6. Reduced / Visibility 重复 ===');
for (let i = 0; i < 20; i++) {
  const r = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-warning'], i, { reducedMotion: true }).state;
  if (r.active.length !== 1) { ok(false, 'Reduced 检查'); break; }
  if (i === 19) ok(true, 'Reduced Motion 20 次稳定');
}
ok(E.visualsPaused(true, false) && !E.visualsPaused(false, false), 'Visibility 状态稳定');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
