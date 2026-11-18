// V1.3-A 挑战规则 / 状态机 / 类型模板 / 独立模板 纯逻辑回归
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

const Rules = L('src/game/challengeRules.ts');
const Engine = L('src/game/challengeEngine.ts');
const Types = L('src/game/challengeTypes.ts');
const Templates = L('src/game/challengeTemplates.ts');
const { LEVELS } = L('src/game/levels.ts');

let pass = 0;
let total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

console.log('=== A. 规则校验：非法配置回退且不抛错 ===');
{
  const empty = Rules.validateChallengeRules(null);
  ok(empty.rules.type === 'standard' && empty.issues.length > 0, '空配置回退默认规则并记录 issue');

  const bad = Rules.validateChallengeRules({ difficulty: 'nightmare', type: 'hack', maxRuns: -3, timeLimitSec: 'x', rewardMultiplier: 99 });
  ok(bad.rules.difficulty === 'normal', '非法难度回退普通', bad.rules.difficulty);
  ok(bad.rules.type === 'standard', '非法类型回退标准', bad.rules.type);
  ok(bad.rules.timeLimitSec === null, '非法时间限制视为不限时', String(bad.rules.timeLimitSec));
  ok(bad.rules.maxRuns === 0, '负运行次数视为 0（禁用）', String(bad.rules.maxRuns));
  ok(bad.rules.rewardMultiplier === 5, '奖励系数封顶到 5', String(bad.rules.rewardMultiplier));
  ok(bad.issues.length >= 4, '多处非法配置都被记录', String(bad.issues.length));

  const timedNoLimit = Rules.validateChallengeRules({ type: 'timed' });
  ok(timedNoLimit.rules.timeLimitSec === 120, '限时挑战缺时间默认 120 秒', String(timedNoLimit.rules.timeLimitSec));

  let threw = false;
  try { Rules.validateChallengeRules({ type: 'timed', timeLimitSec: 0, hiddenTestCount: 999, maxSubmits: 'z' }); } catch { threw = true; }
  ok(!threw, '极端配置不抛异常');

  const elite = Rules.validateChallengeRules({ difficulty: 'elite' });
  ok(elite.rules.maxRuns === 8 && elite.rules.rewardMultiplier === 1.5 && elite.rules.hiddenTestCount === 2, '难度预设生效');
}

console.log('=== B. 状态机生命周期 ===');
{
  const r = Engine.createChallengeRun('ind-timed', Templates.independentChallengeById('ind-timed').rules, { now: 1000 });
  ok(r.status === 'active' && r.startedAt === 1000 && r.deadlineAt === 1000 + 90 * 1000, '创建即进入进行中并设置截止时间');

  const paused = Engine.pause(r, 2000);
  ok(paused.status === 'paused' && paused.pausedAt === 2000, '进行中可暂停');
  ok(Engine.pause(paused, 999) === paused, '非进行中暂停为无操作');

  const resumed = Engine.resume(paused, 5000);
  ok(resumed.status === 'active' && resumed.pausedAt === null, '暂停可恢复');
  ok(resumed.deadlineAt === 1000 + 90 * 1000 + 3000, '暂停期间顺延截止时间', String(resumed.deadlineAt));
  ok(resumed.pausedTotalMs === 3000, '累计暂停时长', String(resumed.pausedTotalMs));

  const done = Engine.complete(resumed, 6000, 'passed');
  ok(done.status === 'completed' && done.result === 'passed' && done.endedAt === 6000, '结算为已完成');
  const twice = Engine.complete(done, 9999, 'failed');
  ok(twice === done, '第二次结算被忽略');
}

console.log('=== C. 资源消耗：上限/剩余/不越界 ===');
{
  const r = Engine.createChallengeRun('ind-resource', Templates.independentChallengeById('ind-resource').rules, { now: 0 });
  ok(r.limits.maxRuns === 3 && r.limits.maxSubmits === 2 && r.limits.maxHints === 1, '资源限制写入运行状态');

  let s = r;
  for (let i = 0; i < 5; i++) s = Engine.recordRun(s);
  ok(s.runsUsed === 3, '运行次数封顶到上限', String(s.runsUsed));
  ok(Engine.remainingRuns(s) === 0, '剩余运行次数为 0（不为负）', String(Engine.remainingRuns(s)));
  ok(!Engine.canRun(s), '超限后不可再运行');

  const noHint = Engine.createChallengeRun('x', Rules.validateChallengeRules({ type: 'resource-limited', maxHints: 0 }).rules, { now: 0 });
  ok(!Engine.canHint(noHint), '提示次数为 0 时不可提示');
  const afterHint = Engine.recordHint(noHint);
  ok(afterHint.hintsUsed === 0, '不可提示时记录为无操作');

  const unlimited = Engine.createChallengeRun('u', Rules.validateChallengeRules({}).rules, { now: 0 });
  ok(Engine.remainingRuns(unlimited) === null, '不限次时剩余为 null');
}

console.log('=== D. 限时：时间戳差值判超时 ===');
{
  const r = Engine.createChallengeRun('t', Rules.validateChallengeRules({ type: 'timed', timeLimitSec: 10 }).rules, { now: 0 });
  ok(Engine.remainingMs(r, 4000) === 6000, '剩余时间按时间戳差值', String(Engine.remainingMs(r, 4000)));
  ok(!Engine.isTimedOut(r, 9999) && Engine.isTimedOut(r, 10000), '到达截止即超时');
  const done = Engine.complete(r, 5000, 'passed');
  ok(!Engine.isTimedOut(done, 10000), '已结算不再判超时');
}

console.log('=== E. 连锁 Bug：依赖顺序 ===');
{
  const tpl = Templates.independentChallengeById('ind-chain');
  const r = Engine.createChallengeRun('ind-chain', tpl.rules, { now: 0, bugs: tpl.bugs });
  const skip = Engine.fixBug(r, 'bug-fuse');
  ok(skip === r, '依赖未修复时不能修复后续 Bug');
  const first = Engine.fixBug(r, 'bug-relay');
  ok(first.bugs.find((b) => b.id === 'bug-relay').fixed === true, '先修无依赖 Bug');
  const second = Engine.fixBug(first, 'bug-fuse');
  ok(Engine.allBugsFixed(second), '依赖满足后可修复并全部完成');
  ok(!Engine.allBugsFixed(r), '未全部修复时不视为完成');
}

console.log('=== F. 多阶段：不允许跳阶段 ===');
{
  const tpl = Templates.independentChallengeById('ind-multi');
  const r = Engine.createChallengeRun('ind-multi', tpl.rules, { now: 0, stages: tpl.stages });
  ok(r.stageIndex === 0, '初始位于第一阶段');
  const skip = Engine.completeStage(r, 'stage-logic');
  ok(skip === r, '跳阶段为无操作');
  const s1 = Engine.completeStage(r, 'stage-syntax');
  ok(s1.stageIndex === 1 && s1.stages[0].done, '完成当前阶段并前进');
  const s2 = Engine.completeStage(s1, 'stage-logic');
  const s3 = Engine.completeStage(s2, 'stage-hidden');
  ok(Engine.allStagesDone(s3), '全部阶段完成后视为完成');
}

console.log('=== G. 隐藏测试 ===');
{
  const tpl = Templates.independentChallengeById('ind-hidden');
  const r = Engine.createChallengeRun('ind-hidden', tpl.rules, { now: 0, hiddenTests: tpl.hiddenTests });
  ok(r.hiddenTests.length === 1 && r.hiddenTests[0].passed === null, '隐藏测试初始未判定');
  const marked = Engine.markHiddenTest(r, 'hidden-empty', true);
  ok(Engine.allHiddenPassed(marked), '隐藏测试全部通过后视为通过');
}

console.log('=== H. 序列化自愈 ===');
{
  const r = Engine.createChallengeRun('ind-timed', Templates.independentChallengeById('ind-timed').rules, { now: 42 });
  const rt = Engine.normalizeRun(JSON.parse(JSON.stringify(r)));
  ok(rt.id === r.id && rt.challengeId === r.challengeId && rt.status === r.status, '序列化往返保持关键字段');
  ok(rt.deadlineAt === r.deadlineAt && rt.limits.timeLimitSec === 90, '往返保持限时与限制');
  const dirty = Engine.normalizeRun({ challengeId: 'c', status: 'weird', runsUsed: -5, limits: { maxRuns: 'x' } });
  ok(dirty.status === 'active' && dirty.runsUsed === 0 && dirty.limits.maxRuns === null, '脏数据自愈');
  ok(Engine.normalizeRun(null) === null && Engine.normalizeRun({}) === null, '空运行状态被丢弃');
}

console.log('=== I. 五种类型模板完整且合法 ===');
{
  const tpls = Templates.INDEPENDENT_CHALLENGES;
  ok(tpls.length === 5, '五种挑战类型各有一个模板', String(tpls.length));
  const types = new Set(tpls.map((t) => t.type));
  ok(types.size === 5, '模板覆盖全部五种类型', [...types].join(','));
  for (const t of tpls) {
    const v = Rules.validateChallengeRules(t.rules);
    ok(v.issues.length === 0, t.id + ' 规则自洽无 issue', v.issues.join(';'));
    ok(t.id && t.title && t.judge && t.initialCode.length > 0 && t.reference.length > 0, t.id + ' 模板字段完整');
    ok(typeof t.rewardExp === 'number' && t.rewardExp > 0, t.id + ' 奖励经验为正');
  }
  ok(Templates.independentChallengeById('ind-chain').rules.chainBugs === true, '连锁模板启用 chainBugs');
  ok(Templates.independentChallengeById('ind-hidden').rules.hiddenTests === true, '隐藏模板启用 hiddenTests');
  ok(Templates.independentChallengeById('ind-hidden').rules.hiddenTestCount === 1, '隐藏测试数量来自模板', String(Templates.independentChallengeById('ind-hidden').rules.hiddenTestCount));
  ok(Templates.independentChallengeById('ind-timed').rules.timeLimitSec === 90, '限时模板时间正确');
}

console.log('=== J. 与原有关卡零冲突 ===');
{
  const levelIds = new Set(LEVELS.map((l) => l.id));
  ok(levelIds.size === 31, '原有关卡仍为 31 个', String(levelIds.size));
  const collide = Templates.INDEPENDENT_CHALLENGES.filter((t) => levelIds.has(t.id));
  ok(collide.length === 0, '独立模板 id 不与原有关卡冲突', collide.map((c) => c.id).join(','));
  ok(Templates.INDEPENDENT_CHALLENGES.every((t) => t.id.startsWith('ind-')), '独立模板统一 ind- 前缀');
}

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
