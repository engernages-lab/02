// V1.3-A.1 集成回归：动态事件引擎 / 未知入侵六种恢复 / 隐藏用例 / 运行状态机全流程
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

const Engine = L('src/game/challengeEngine.ts');
const Templates = L('src/game/challengeTemplates.ts');
const Event = L('src/game/eventEngine.ts');
const Intrusion = L('src/game/events/unknownIntrusion.ts');
const Migrations = L('src/services/migrations.ts');

let pass = 0;
let total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

// 注册事件定义（含测试用互斥事件）
Intrusion.registerUnknownIntrusion();
Event.registerEvent({ id: 'test-a', label: 'A', priority: 50, mutualExclude: ['test-b'], cooldownMs: 1000, presentDurationMs: 100, activeTimeoutMs: 2000 });
Event.registerEvent({ id: 'test-b', label: 'B', priority: 60, mutualExclude: ['test-a'], cooldownMs: 0, presentDurationMs: 100, activeTimeoutMs: null });

console.log('=== A. 事件触发：重复 / 同时 / 冷却 / 未知 ===');
{
  const snap0 = { current: null, cooldowns: {} };
  const t1 = Event.tryTrigger(snap0, 'test-a', 1000);
  ok(t1.ok && t1.state.status === 'presenting', '首次触发进入 presenting');
  const t2 = Event.tryTrigger(t1.snapshot, 'test-a', 1100);
  ok(!t2.ok && t2.reason === 'already-presenting', '同类事件展示中拒绝重复触发', t2.reason);
  const t3 = Event.tryTrigger(t1.snapshot, 'test-b', 1100);
  ok(!t3.ok && t3.reason === 'mutex', '互斥事件被拒绝', t3.reason);
  const t4 = Event.tryTrigger(snap0, 'nope', 1000);
  ok(!t4.ok && t4.reason === 'unknown-def', '未知定义被拒绝', t4.reason);

  const dismissed = Event.dismiss(t1.snapshot);
  const t5 = Event.tryTrigger(dismissed, 'test-a', 1200);
  ok(!t5.ok && t5.reason === 'cooldown', '冷却期内再次触发被拒绝', t5.reason);
  const t6 = Event.tryTrigger(dismissed, 'test-a', 2001);
  ok(t6.ok, '冷却结束后可再次触发');
}

console.log('=== B. 生命周期推进与终结 ===');
{
  const t = Event.tryTrigger({ current: null, cooldowns: {} }, 'test-a', 1000);
  let snap = t.snapshot;
  // presenting(activateAt=1100) → advance at 1050 仍 presenting
  ok(Event.advance(snap, 1050).current.status === 'presenting', '未到激活时间保持 presenting');
  // → advance at 1100 进入 active
  snap = Event.advance(snap, 1100);
  ok(snap.current.status === 'active', '到激活时间进入 active');
  // 超时：deadlineAt = 1000+100+2000 = 3100
  const before = Event.advance(snap, 3000);
  ok(before.current.status === 'active', '未到超时保持 active');
  const timed = Event.advance(snap, 3100);
  ok(timed.current.status === 'resolving' && timed.current.result === 'timeout', '超时进入 resolving(timeout)');
  ok(Event.isBlocking(timed.current), 'resolving 仍在阻塞态');

  const resolved = Event.resolve(snap, 1200);
  ok(resolved.current.status === 'completed' && resolved.current.result === 'completed', '正常完成 → completed');
  ok(Event.isTerminal(resolved.current), 'completed 是终结态');
  const resolved2 = Event.resolve(resolved, 1300);
  ok(resolved2.current === resolved.current, '二次完成无操作（幂等）');

  const cancelled = Event.cancelEvent(snap, 1400);
  ok(cancelled.current.result === 'cancelled', '取消 → cancelled');
  const recovered = Event.recoverException(snap, 1500);
  ok(recovered.current.result === 'recovered', '异常恢复 → recovered');
  const dismissed = Event.dismiss(recovered);
  ok(dismissed.current === null, 'dismiss 后 current 清空');
}

console.log('=== C. 刷新清理：normalizeEventState ===');
{
  const now = 5000;
  // 已终结 → null
  const done = { id: 'x', defId: Intrusion.UNKNOWN_INTRUSION_ID, status: 'completed', priority: 1, startedAt: 1, activateAt: null, deadlineAt: null, endedAt: 2, result: 'completed', reason: null, data: {} };
  ok(Event.normalizeEventState(done, now) === null, '已终结事件刷新后清理');
  // 过期 active → null
  const expired = { id: 'x', defId: Intrusion.UNKNOWN_INTRUSION_ID, status: 'active', priority: 1, startedAt: 1, activateAt: 2, deadlineAt: 100, endedAt: null, result: null, reason: null, data: {} };
  ok(Event.normalizeEventState(expired, now) === null, '已过期 active 事件刷新后恢复清理');
  // 未过期 active → 保留
  const live = { ...expired, deadlineAt: 999999 };
  const kept = Event.normalizeEventState(live, now);
  ok(kept && kept.status === 'active', '未过期 active 事件被保留（可恢复）');
  // presenting 已过激活时间 → active
  const presenting = { ...expired, status: 'presenting', activateAt: 100, deadlineAt: 999999 };
  const n1 = Event.normalizeEventState(presenting, now);
  ok(n1 && n1.status === 'active', 'presenting 过期激活时间 → active');
  // 未注册定义 → null
  const unknown = { ...live, defId: 'ghost' };
  ok(Event.normalizeEventState(unknown, now) === null, '未注册定义被丢弃');
  // 垃圾 → null
  ok(Event.normalizeEventState(null, now) === null && Event.normalizeEventState('x', now) === null, '非法数据安全返回 null');
  ok(Event.normalizeEventState({}, now) === null, '缺 defId 返回 null');

  const cd = Event.normalizeCooldowns({ a: 100, b: -1, c: 'x', d: 1.9 });
  ok(cd.a === 100 && !('b' in cd) && !('c' in cd) && cd.d === 1, '冷却表清洗非法值');
}

console.log('=== D. 未知入侵：数据自愈与六种恢复方式 ===');
{
  const d0 = Intrusion.defaultIntrusionData();
  ok(d0.step === 0 && d0.missesLeft === Intrusion.INTRUSION_MAX_MISSES, '默认入侵数据');
  const clamp = Intrusion.intrusionDataOf({ step: 999, missesLeft: -5 });
  ok(clamp.step === Intrusion.INTRUSION_RECOVER_STEPS && clamp.missesLeft === 0, '入侵数据夹取到合法范围');
  ok(Intrusion.INTRUSION_PHASES.length === 6, '入侵为六阶段演出');

  const base = { current: null, cooldowns: {} };
  // ① 正常完成
  const t1 = Event.tryTrigger(base, Intrusion.UNKNOWN_INTRUSION_ID, 10000, { data: { ...d0 } });
  let s = Event.advance(t1.snapshot, 10000 + Intrusion.UNKNOWN_INTRUSION_DEF.presentDurationMs);
  s = Event.resolve(s, 11000);
  ok(s.current.result === 'completed', '恢复①正常完成');
  // ② 玩家退出
  const t2 = Event.tryTrigger(Event.dismiss(s), Intrusion.UNKNOWN_INTRUSION_ID, 100000);
  const s2 = Event.cancelEvent(t2.snapshot, 101000);
  ok(s2.current.result === 'cancelled', '恢复②玩家退出');
  // ③ 超时
  const t3 = Event.tryTrigger(Event.dismiss(s2), Intrusion.UNKNOWN_INTRUSION_ID, 200000);
  const s3 = Event.advance(t3.snapshot, 200000 + Intrusion.UNKNOWN_INTRUSION_DEF.presentDurationMs + Intrusion.UNKNOWN_INTRUSION_DEF.activeTimeoutMs + 1);
  ok(s3.current.result === 'timeout' && s3.current.status === 'resolving', '恢复③超时');
  // ④ 刷新清理（已在 C 覆盖，这里确认入侵定义可用）
  ok(Event.normalizeEventState({ ...s3.current, status: 'completed' }, 300000) === null, '恢复④刷新清理已终结事件');
  // ⑤ 异常恢复
  const t5 = Event.tryTrigger(Event.dismiss(s3), Intrusion.UNKNOWN_INTRUSION_ID, 400000);
  const s5 = Event.recoverException(t5.snapshot, 400100);
  ok(s5.current.result === 'recovered', '恢复⑤异常恢复');
  // ⑥ 重复触发保护
  const t6 = Event.tryTrigger(Event.dismiss(s5), Intrusion.UNKNOWN_INTRUSION_ID, 500000);
  const t6b = Event.tryTrigger(t6.snapshot, Intrusion.UNKNOWN_INTRUSION_ID, 500100);
  ok(!t6b.ok && t6b.reason === 'already-presenting', '恢复⑥重复触发保护');
}

console.log('=== E. 独立挑战模板：隐藏用例 / 多阶段 / 资源限制 ===');
{
  const hidden = Templates.independentChallengeById('ind-hidden');
  ok(Array.isArray(hidden.hiddenChecks) && hidden.hiddenChecks.length === 1, '隐藏 Bug 模板含隐藏判题表达式');
  ok(hidden.hiddenChecks[0].expr.includes('avg') && hidden.hiddenChecks[0].expr.includes('[]'), '隐藏表达式针对空列表边界', hidden.hiddenChecks?.[0]?.expr);
  ok(!(hidden.judge.pythonChecks || []).some(c => c.expr.includes('[]')), '隐藏表达式不在公开判题中泄露');

  const multi = Templates.independentChallengeById('ind-multi');
  ok(multi.stages.length === 3, '多阶段模板含 3 个阶段');
  ok((multi.hiddenChecks || []).length === 2, '多阶段模板含 2 条隐藏用例');

  const res = Templates.independentChallengeById('ind-resource');
  ok(res.rules.maxRuns === 3 && res.rules.maxSubmits === 2 && res.rules.maxHints === 1, '资源限制模板限制生效');

  const timed = Templates.independentChallengeById('ind-timed');
  ok(timed.rules.timeLimitSec === 90 && timed.rules.type === 'timed', '限时模板时间与类型正确');
}

console.log('=== F. 运行状态机：完整通过流程 + 单次结算 ===');
{
  const def = Templates.independentChallengeById('ind-multi');
  let r = Engine.createChallengeRun('ind-multi', def.rules, { now: 1000, stages: def.stages, hiddenTests: def.hiddenTests });
  ok(r.stages.length === 3 && r.stageIndex === 0, '创建运行状态含阶段');
  // 提交一次 + 运行一次
  r = Engine.recordSubmit(Engine.recordRun(r));
  ok(r.submitsUsed === 1 && r.runsUsed === 1, '提交/运行计数');
  // 跳阶段被拒绝
  const skipped = Engine.completeStage(r, 'stage-hidden');
  ok(skipped === r || skipped.stageIndex === 0, '不允许跳阶段');
  // 顺序完成 3 阶段
  r = Engine.completeStage(r, 'stage-syntax');
  r = Engine.completeStage(r, 'stage-logic');
  r = Engine.completeStage(r, 'stage-hidden');
  ok(Engine.allStagesDone(r), '三阶段全部完成');
  // 隐藏用例
  r = Engine.markHiddenTest(r, 'mt-hidden-empty', true);
  ok(r.hiddenTests[0].passed === true, '隐藏用例标记通过');
  // 结算通过
  const done = Engine.complete(r, 2000, 'passed');
  ok(done.status === 'completed' && done.result === 'passed' && done.settledAt === 2000, '通过结算只写一次');
  const again = Engine.complete(done, 3000, 'failed');
  ok(again === done || (again.status === 'completed' && again.settledAt === 2000), '重复结算无效（只结算一次）');
  ok(Engine.isTerminal(done), '结算后为终结态');
}

console.log('=== G. 运行状态序列化自愈 ===');
{
  const bad = Engine.normalizeRun({ challengeId: '', status: 'weird' });
  ok(bad === null, '缺 challengeId 丢弃');
  const r = Engine.normalizeRun({ challengeId: 'ind-timed', status: 'nope', runsUsed: -5, submitused: 1 });
  ok(r && r.challengeId === 'ind-timed' && r.status === 'active' && r.runsUsed === 0, '脏状态回退 active 且计数归零');
  const many = Engine.normalizeChallengeRuns({ 'ind-timed': { challengeId: 'ind-timed' }, bad: null, other: { foo: 1 } });
  ok(many['ind-timed'] && !('bad' in many) && !('other' in many), '运行表清洗只保留合法条目');
}

console.log('=== H. 存档版本未变（仍为 v10） ===');
{
  ok(Migrations.CURRENT_SAVE_VERSION === 10, '存档版本仍为 v10（未因新增字段升级）', String(Migrations.CURRENT_SAVE_VERSION));
  const v9 = Migrations.migrateSave({ version: 9, player: { exp: 0, rewards: {} } });
  ok(v9.to === 10 && v9.notes.some(n => n.includes('v10')), 'v9→v10 迁移仍存在');
}

console.log('=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
