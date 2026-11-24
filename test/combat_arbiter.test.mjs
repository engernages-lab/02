// V1.3-B.4 战斗事件仲裁器专项：优先级 / FIFO / 抢占 / 去重 / 过期 / 队列 / 阶段 / 终结 / 自愈 / 统一伤害
// 执行：node test/combat_arbiter.test.mjs
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

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;
const create = () => A.createCombatArbiter('b1', 'boss', 'p1', NOW);
const ev = (id, priority, over = {}) => ({
  eventId: id,
  eventType: 'ambient',
  priority,
  conflictGroup: 'ambient',
  ...over,
});

// ================= 1. 优先级与 FIFO =================
console.log('=== 1. 优先级队列与 FIFO ===');
{
  let s = create();
  let r = A.enqueue(s, ev('a', 6, { createdAt: NOW }), NOW + 1);
  s = r.state;
  r = A.enqueue(s, ev('b', 2), NOW + 2);
  s = r.state;
  r = A.enqueue(s, ev('c', 5), NOW + 3);
  s = r.state;
  eq(s.queue.map(e => e.eventId), ['b', 'c', 'a'], '按优先级排序（P2 → P5 → P6）');

  r = A.enqueue(s, ev('d', 2), NOW + 4);
  s = r.state;
  eq(s.queue.filter(e => e.priority === 2).map(e => e.eventId), ['b', 'd'], '同优先级按 createdAt FIFO');
  const dup = A.enqueue(s, ev('b', 2), NOW + 5);
  ok(!dup.ok && dup.reason === 'duplicate', '重复 eventId 入队被拒绝');
  ok(s.settledEventIds.length === 0, '重复事件不产生结算记录');
}

// ================= 2. 独占锁 / 抢占 =================
console.log('=== 2. 独占锁与抢占 ===');
{
  let s = create();
  const atk = ev('atk', 5, { eventType: 'boss-attack', conflictGroup: 'attack' });
  let r = A.requestExclusive(s, atk, NOW + 1);
  ok(r.ok && r.state.active && r.state.active.eventId === 'atk', '无锁时立即获得独占');
  s = r.state;

  const crisis = ev('crisis', 2, { eventType: 'dynamic-crisis', conflictGroup: 'crisis' });
  r = A.requestExclusive(s, crisis, NOW + 2);
  ok(r.ok && r.state.active.eventId === 'crisis', 'P2 抢占 P5 攻击');
  ok(r.preempted && r.preempted.eventId === 'atk', '返回被抢占事件');
  ok(r.state.settledEventIds.includes('atk'), '被抢占事件进入幂等表');
  ok(r.state.records.some(x => x.eventId === 'atk' && x.status === 'interrupted'), '被抢占事件记录 interrupted');
  s = r.state;

  const crack = ev('crack', 3, { eventType: 'weakness-crack', conflictGroup: 'weakness' });
  r = A.requestExclusive(s, crack, NOW + 3);
  ok(!r.ok && r.queued && r.state.queue.some(e => e.eventId === 'crack'), 'P3 不抢占 P2，进入队列');
  s = r.state;

  const same = ev('crisis2', 2, { eventType: 'dynamic-crisis', conflictGroup: 'crisis' });
  r = A.requestExclusive(s, same, NOW + 4);
  ok(!r.ok && r.reason === 'equal-priority-active' && r.queued, '同优先级独占事件等待');

  // 释放 P2 → 提升 P3（而不是同优先级后到的 crisis2）
  r = A.releaseExclusive(s, 'crisis', 'resolved', NOW + 5);
  ok(r.promoted && r.promoted.eventId === 'crack', '释放后按优先级提升 P3');
  ok(r.promoted.eventId !== 'crisis2', '低优先级不做错误提升');
  s = r.state;
  ok(s.active.eventId === 'crack', '新锁为提升事件');

  // P0 终结抢占一切
  const terminal = ev('death', 0, { eventType: 'death', conflictGroup: 'terminal' });
  r = A.requestExclusive(s, terminal, NOW + 6);
  ok(r.ok && r.state.active.eventId === 'death' && r.preempted.eventId === 'crack', 'P0 死亡抢占 P3');
}

// ================= 3. 过期 / 队列上限 =================
console.log('=== 3. 过期与队列上限 ===');
{
  let s = create();
  let r = A.enqueue(s, ev('old', 6, { expiresInMs: 100 }), NOW + 1);
  s = r.state;
  const exp = A.expireCombatEvents(s, NOW + 700);
  ok(exp.state.queue.length === 0, '过期事件从队列移除');
  ok(exp.state.records.some(x => x.eventId === 'old' && x.status === 'expired'), '过期事件记录');
  ok(exp.state.settledEventIds.includes('old'), '过期事件进入幂等表');

  s = exp.state;
  for (let i = 0; i < 40; i++) {
    const rr = A.enqueue(s, ev('q' + i, 6), NOW + 300 + i);
    s = rr.state;
  }
  ok(s.queue.length <= 32, '队列最大长度受控', String(s.queue.length));
  ok(s.records.some(x => x.reason === 'queue-overflow'), '队列溢出有记录');

  let t = create();
  let rr = A.requestExclusive(t, ev('act', 5, { eventType: 'boss-attack', conflictGroup: 'attack', expiresInMs: 50 }), NOW + 1);
  t = rr.state;
  const ex2 = A.expireCombatEvents(t, NOW + 700);
  ok(ex2.state.active === null, '活动锁过期释放');
  ok(ex2.state.settledEventIds.includes('act'), '活动锁过期进入幂等表');
}

// ================= 4. 阶段失效 =================
console.log('=== 4. 阶段失效 ===');
{
  let s = create();
  let r = A.requestExclusive(s, ev('p1-atk', 5, { eventType: 'boss-attack', conflictGroup: 'attack', phaseId: 'p1' }), NOW + 1);
  s = r.state;
  r = A.enqueue(s, ev('p1-amb', 6, { phaseId: 'p1', expiresInMs: 60000 }), NOW + 2);
  s = r.state;
  s = A.invalidatePhase(s, 'p2', NOW + 4).state;
  r = A.enqueue(s, ev('p2-amb', 6, { phaseId: 'p2', expiresInMs: 60000 }), NOW + 5);
  s = r.state;

  r = A.invalidatePhase(s, 'p2', NOW + 6);
  ok(r.state.phaseId === 'p2', '阶段更新');
  ok(r.state.active === null, '旧阶段活动锁被取消');
  ok(r.state.queue.every(e => e.phaseId === 'p2'), '旧阶段队列事件被清理');
  ok(r.state.settledEventIds.includes('p1-atk') && r.state.settledEventIds.includes('p1-amb'), '旧阶段事件进入幂等表');
  ok(r.state.queue.some(e => e.eventId === 'p2-amb'), '新阶段事件保留');

  const mismatch = A.enqueue(create(), ev('future', 5, { phaseId: 'p9' }), NOW + 5);
  ok(!mismatch.ok && mismatch.reason === 'phase-mismatch', '跨阶段事件拒绝入队（P>P1）');
}

// ================= 5. 结算幂等 / 终结 =================
console.log('=== 5. 结算幂等与终结清理 ===');
{
  let s = create();
  s = A.settleEvent(s, 'dmg-1', NOW + 1, { amount: 5 });
  ok(s.settledEventIds.includes('dmg-1'), '伤害事件结算记录');
  const again = A.settleEvent(s, 'dmg-1', NOW + 2, { amount: 5 });
  ok(again === s, '同一 eventId 重复结算不产生变化');
  ok(A.isSettled(s, 'dmg-1'), 'isSettled 命中');

  let r = A.requestExclusive(s, ev('atk', 5, { eventType: 'boss-attack', conflictGroup: 'attack' }), NOW + 3);
  s = r.state;
  r = A.enqueue(s, ev('queued', 6), NOW + 4);
  s = r.state;
  const closed = A.closeCombatArbiter(s, 'victory', NOW + 5, { eventId: 'terminal-v', eventType: 'victory', priority: 0 });
  ok(closed.state.active === null && closed.state.queue.length === 0, '终结清空活动锁与队列');
  ok(closed.state.records.some(x => x.eventId === 'terminal-v' && x.priority === 0), 'P0 终结记录');
  ok(closed.state.settledEventIds.includes('terminal-v'), '终结事件进入幂等表');
  ok(closed.events.length >= 2, '终结清理记录完整');

  const recordStep = A.recordCombatEvent(create(), ev('rec', 2, { eventType: 'weakness-exposed', conflictGroup: 'weakness' }), NOW + 6);
  ok(recordStep.records.some(x => x.eventId === 'rec' && x.status === 'resolved'), '直接记录事件');
  ok(A.recordCombatEvent(recordStep, ev('rec', 2), NOW + 7) === recordStep, '直接记录幂等');
}

// ================= 6. 存档自愈 =================
console.log('=== 6. 存档自愈 ===');
{
  let s = create();
  s = A.requestExclusive(s, ev('act', 5, { eventType: 'boss-attack', conflictGroup: 'attack' }), NOW + 1).state;
  s = A.enqueue(s, ev('q', 6), NOW + 2).state;
  s = A.settleEvent(s, 'dmg', NOW + 3, { amount: 2 });
  const norm = A.normalizeCombatArbiter(s, { battleId: 'b1', bossId: 'boss', phaseId: 'p1', now: NOW + 100 });
  ok(norm.active === null && norm.queue.length === 0, '刷新清空瞬态锁与队列');
  ok(norm.settledEventIds.includes('dmg'), '刷新保留幂等 ID');
  ok(norm.records.length > 0, '刷新保留事件记录');
  const fresh = A.normalizeCombatArbiter(s, { battleId: 'b2', bossId: 'boss', phaseId: 'p1', now: NOW + 100 });
  ok(fresh.battleId === 'b2' && fresh.settledEventIds.length === 0, 'battleId 不匹配 → 新仲裁状态');
  const otherBoss = A.normalizeCombatArbiter(s, { battleId: 'b1', bossId: 'other', phaseId: 'p1', now: NOW + 100 });
  ok(otherBoss.bossId === 'other' && otherBoss.settledEventIds.length === 0, 'Boss 不匹配 → 新仲裁状态');
}

// ================= 7. 统一伤害 =================
console.log('=== 7. 统一伤害结算 ===');
{
  let r = D.resolvePlayerDamage(100, 0, 10);
  ok(r.consciousness === 90 && r.applied === 10 && !r.barrierConsumed, '普通伤害');
  r = D.resolvePlayerDamage(100, 1, 10);
  ok(r.consciousness === 95 && r.applied === 5 && r.barrierConsumed && r.barrierLayers === 0, '护罩减半并消耗');
  r = D.resolvePlayerDamage(8, 0, 20);
  ok(r.consciousness === 0 && r.applied === 8, '伤害钳制到 0，不产生负意识');
  r = D.resolvePlayerDamage(100, 0, 0);
  ok(r.applied === 0 && r.consciousness === 100, '0 伤害');
  r = D.resolvePlayerDamage(100, 0, -5);
  ok(r.applied === 0 && r.consciousness === 100, '负伤害不生效');
  r = D.resolvePlayerDamage(100, 0, 10, { blockedReason: 'terminal' });
  ok(r.blocked && r.applied === 0 && r.consciousness === 100, '终结/死亡状态阻止伤害');
  r = D.resolvePlayerDamage(0, 1, 10, { blockedReason: 'player-dead' });
  ok(r.applied === 0 && r.barrierLayers === 1, '玩家已死亡时护罩不消耗');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
