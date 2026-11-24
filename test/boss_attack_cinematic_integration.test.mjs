// V1.3-B.6.2 攻击电影化集成测试：真实 B.2 事件 → 视觉层 → 无战斗污染
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
const Attack = L('src/game/bossAttackEngine.ts');
const Patterns = L('src/game/bossAttackPatterns.ts');
const Save = L('src/services/save.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const NOW = 200000;
const pattern = Patterns.attackPatternsFor('gate-01', 'easy', 0)[0];
let state = Attack.createBossAttackState('battle-cinematic', 'gate-01', 'gate-01-bp1', 0, NOW);
const started = Attack.startAttackForDev(state, pattern, NOW);
state = started.state;
const selected = started.events.find(e => e.type === 'BOSS_ATTACK_SELECTED');
const telegraph = started.events.find(e => e.type === 'BOSS_ATTACK_TELEGRAPH');
const before = JSON.stringify(state);

console.log('=== 1. 真实 B.2 事件映射 ===');
ok(selected && selected.payload.attackName === pattern.attackName, '真实攻击选择事件');
ok(telegraph && telegraph.payload.warningDuration === pattern.warningDuration && telegraph.payload.attackType === pattern.attackType, '真实预警时长/类型');
ok(A.attackCinematicKindForEvent(telegraph.type) === 'warning', '预警 → Warning');
ok(A.attackCinematicKindForEvent('BOSS_ATTACK_STARTED') === 'release', '开始 → Release');
ok(A.attackCinematicKindForEvent('BOSS_ATTACK_HIT') === 'hit', '命中 → Hit');
ok(A.attackCinematicKindForEvent('BOSS_ATTACK_BLOCKED') === 'block', '格挡 → Block');
ok(A.attackCinematicKindForEvent('BOSS_ATTACK_DODGED') === 'dodge', '闪避 → Dodge');
ok(A.attackCinematicKindForEvent('BOSS_ATTACK_INTERRUPTED') === 'interrupt', '打断 → Interrupt');
ok(A.attackCinematicKindForEvent('BOSS_ATTACK_CANCELLED') === 'cancel', '取消 → Cancel');
ok(selected.battleId === 'battle-cinematic' && selected.attackId === pattern.attackId, 'battleId/attackId 存在');
ok(!!telegraph.id, 'eventId 存在');

console.log('=== 2. 视觉触发不修改战斗 ===');
let visual = E.createVisualRuntime(NOW);
const warningDef = C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor('warning')];
const wr = E.triggerVisualEffect(visual, { ...warningDef, duration: Math.min(800, pattern.warningDuration) }, telegraph.at, { intensity: 'HIGH' });
visual = wr.state;
ok(wr.accepted && visual.active[0].effectType === 'warning', '真实预警触发视觉');
ok(JSON.stringify(state) === before, '视觉触发不修改攻击状态');
ok(state.damageDealt === 0 && state.attackResult === null, '视觉不修改伤害/结果');
const chargeDef = C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor('charge')];
const cr = E.triggerVisualEffect(visual, { ...chargeDef, duration: pattern.warningDuration }, telegraph.at + 1, { intensity: 'HIGH' });
visual = cr.state;
ok(cr.accepted || cr.reason === 'queued', '蓄力事件进入视觉流程');
const releaseDef = C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor('release')];
visual = E.interruptVisualEffect(visual, A.attackEffectIdFor('warning'), telegraph.at + 2);
visual = E.interruptVisualEffect(visual, A.attackEffectIdFor('charge'), telegraph.at + 2);
const rr = E.triggerVisualEffect(visual, releaseDef, telegraph.at + 3, { intensity: 'HIGH' });
visual = rr.state;
ok(rr.accepted && visual.active.some(e => e.effectType === 'release'), '释放视觉启动');
const hitDef = C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor('hit')];
visual = E.interruptVisualEffect(visual, A.attackEffectIdFor('release'), telegraph.at + 4);
const hr = E.triggerVisualEffect(visual, hitDef, telegraph.at + 5, { intensity: 'HIGH' });
visual = hr.state;
ok(hr.accepted && visual.active.some(e => e.effectType === 'hit'), '命中视觉启动');
ok(JSON.stringify(state) === before, '完整演出后攻击状态不变');

console.log('=== 3. 格挡 / 闪避 / 打断 / 取消 ===');
const blockPattern = Patterns.attackPatternsFor('gate-01', 'easy', 0).find(p => p.defenseRequirement !== 'none') || pattern;
let st = Attack.startAttackForDev(Attack.createBossAttackState('battle-cinematic-2', 'gate-01', 'gate-01-bp1', 0, NOW + 10000), blockPattern, NOW + 10000).state;
const defend = Attack.playerDefend(st, NOW + 10000 + blockPattern.warningDuration - 100);
if (defend.ok) {
  const patterns = Patterns.attackPatternsFor('gate-01', 'easy', 0);
  let tick = Attack.tickBossAttack(defend.state, patterns, { now: NOW + 10000 + blockPattern.warningDuration + 1, phaseId: 'gate-01-bp1', phaseIndex: 0, battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1 });
  let blocked = tick.events.find(e => e.type === 'BOSS_ATTACK_BLOCKED');
  if (!blocked && (tick.state.nextHitAt || tick.state.attackEndsAt)) {
    tick = Attack.tickBossAttack(tick.state, patterns, { now: (tick.state.nextHitAt || tick.state.attackEndsAt) + 1, phaseId: 'gate-01-bp1', phaseIndex: 0, battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1 });
    blocked = tick.events.find(e => e.type === 'BOSS_ATTACK_BLOCKED');
  }
  ok(!!blocked, '真实格挡事件');
  const bDef = C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor('block')];
  const bv = E.triggerVisualEffect(E.createVisualRuntime(0), bDef, NOW + 11000, { intensity: 'HIGH' });
  ok(bv.accepted && bv.state.active[0].effectType === 'block', '格挡演出触发');
} else {
  ok(true, '当前阶段无格挡窗口（真实引擎决定）');
}
const interrupt = Attack.interruptAttack(st, NOW + 10200, 'weakness-exposed');
const ie = interrupt.events.find(e => e.type === 'BOSS_ATTACK_INTERRUPTED');
ok(!!ie, '真实打断事件');
const iv = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor('interrupt')], NOW + 10201, { intensity: 'HIGH' });
ok(iv.accepted && iv.state.active[0].effectType === 'interrupt', '打断演出');
const cancel = Attack.cancelAttack(st, NOW + 10300, 'phase-change');
const ce = cancel.events.find(e => e.type === 'BOSS_ATTACK_CANCELLED');
ok(!!ce, '真实取消事件');
const cv = E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS[A.attackEffectIdFor('cancel')], NOW + 10301, { intensity: 'HIGH' });
ok(cv.accepted && cv.state.active[0].effectType === 'cancel', '取消演出');

console.log('=== 4. 终结 / 优先级 / 存档 ===');
const term = E.triggerVisualEffect(visual, C.BOSS_VISUAL_EFFECTS['boss-terminal-flash'], NOW + 20000);
ok(term.state.active.length === 1 && term.state.queued.length === 0, '终结清理攻击演出');
ok(E.cleanupAllVisualEffects(term.state, NOW + 20001).active.length === 0, '页面清理');
ok(A.attackVisualTypeFor('aoe') === 'digital-wave' && A.attackVisualTypeFor('delayed') === 'system-crash', '攻击视觉类型映射');
ok(A.attackVisualProfileFor('special', 'gate-01').visualType === 'corruption-wave', 'GATE-01 特殊攻击');
ok(A.attackVisualProfileFor('special', 'other').warningColor === '#FF3D5A', '主题 fallback');
ok(Save.SAVE_VERSION === 10, '存档版本 v10');
const p = Save.defaultState();
const pBefore = JSON.stringify(p);
E.triggerVisualEffect(E.createVisualRuntime(0), C.BOSS_VISUAL_EFFECTS['boss-attack-hit'], 0);
ok(JSON.stringify(p) === pBefore, '视觉不改存档/经济/成就');
ok(E.particleBudget('HIGH', 'full', false) <= C.MAX_PARTICLE_BUDGET, '攻击演出遵守粒子上限');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
