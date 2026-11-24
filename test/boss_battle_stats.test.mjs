// V1.3-B.5.1 Boss 战斗数据统计专项：采集 / 幂等 / 边界 / 阶段 / 摘要 / 自愈
// 执行：node test/boss_battle_stats.test.mjs
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
const S = L('src/game/bossBattleStats.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;
function create(over = {}) {
  return S.createBossBattleStats({
    battleId: 'b1', bossId: 'gate-01', bossName: 'GATE-01', difficulty: 'easy',
    startedAt: NOW, phaseId: 'bp1', phaseIndex: 0, ...over,
  });
}
function rec(state, input, now = NOW + 1) {
  return S.recordBossBattleEvent(state, input, now);
}
const ev = (id, type, payload = {}, over = {}) => ({ eventId: id, eventType: type, phaseId: 'bp1', payload, ...over });

// ================= 1. 基础采集 =================
console.log('=== 1. 基础采集 ===');
{
  let s = create();
  ok(s.battleStatus === 'active' && s.result === null && s.startedAt === NOW, '创建活动战斗统计');
  ok(s.currentPhaseId === 'bp1' && s.phaseStats.bp1.enteredAt === NOW, '初始阶段统计');
  ok(s.challengeStats.successRate === null, '无判题时成功率为 null（不是 100%）');

  s = rec(s, ev('c1', 'challenge-result', { outcome: 'passed', phaseCleared: true }), NOW + 10).state;
  s = rec(s, ev('c2', 'challenge-result', { outcome: 'failed', reason: 'judge-failed' }), NOW + 20).state;
  s = rec(s, ev('c3', 'challenge-result', { outcome: 'runtime-error', reason: 'NameError' }), NOW + 30).state;
  s = rec(s, ev('c4', 'challenge-result', { outcome: 'invalid', reason: 'security' }), NOW + 40).state;
  const cs = s.challengeStats;
  ok(cs.submittedCount === 3 && cs.judgedCount === 2, '提交/判题计数');
  ok(cs.passedCount === 1 && cs.failedCount === 1 && cs.runtimeErrorCount === 1 && cs.invalidCount === 1, '成功/失败/运行异常/无效计数');
  ok(cs.successRate === 0.5, '成功率 = 1/2');
  ok(cs.maxConsecutiveSuccess === 1, '连续成功统计');
  ok(cs.keyCrackSuccess === true, '关键挑战成功标记');
  ok(s.phaseStats.bp1.challengeSuccess === 1 && s.phaseStats.bp1.challengeFailed === 1, '阶段挑战统计');
  ok(cs.passedCount + cs.failedCount <= cs.judgedCount && cs.judgedCount <= cs.submittedCount, '计数关系合理');
}

// ================= 2. 攻击 / 防御 / 伤害 =================
console.log('=== 2. 攻击、防御与伤害 ===');
{
  let s = create();
  s = rec(s, ev('t1', 'attack-telegraph', { attackId: 'pulse' }), NOW + 10).state;
  s = rec(s, ev('a1', 'attack-started', { attackId: 'pulse' }), NOW + 20).state;
  s = rec(s, ev('r1', 'attack-result', { result: 'blocked', response: 'defend' }), NOW + 30).state;
  s = rec(s, ev('r2', 'attack-result', { result: 'dodged', response: 'dodge' }), NOW + 40).state;
  s = rec(s, ev('r3', 'attack-result', { result: 'hit', response: 'defend' }), NOW + 50).state;
  s = rec(s, ev('r4', 'attack-result', { result: 'hit', response: 'dodge' }), NOW + 60).state;
  s = rec(s, ev('r5', 'attack-result', { result: 'hit', response: 'none' }), NOW + 70).state;
  s = rec(s, ev('d1', 'damage-taken', { amount: 10, shieldAbsorbed: 5, source: 'boss-attack' }), NOW + 80).state;
  s = rec(s, ev('x1', 'attack-cancelled', { reason: 'weakness-exposed' }), NOW + 90).state;
  s = rec(s, ev('x2', 'attack-interrupted', { reason: 'dynamic-crisis' }), NOW + 100).state;
  const a = s.attackStats;
  ok(a.telegraphCount === 1 && a.startedCount === 1, '预警 ≠ 攻击：分别计数');
  ok(a.hitCount === 3 && a.blockedCount === 1, '命中/格挡计数');
  ok(s.defenseStats.defenseSuccessCount === 1 && s.defenseStats.defenseFailedCount === 1, '防御成功/失败');
  ok(s.defenseStats.dodgeSuccessCount === 1 && s.defenseStats.dodgeFailedCount === 1, '闪避成功/失败');
  ok(a.damageTaken === 10 && a.shieldAbsorbed === 5, '实际伤害与护罩吸收');
  ok(a.cancelledCount === 2 && a.interruptedByWeaknessCount === 1 && a.interruptedByCrisisCount === 1, '攻击取消/中断分类');
  ok(s.phaseStats.bp1.damageTaken === 10 && s.phaseStats.bp1.attackCount === 1, '阶段伤害/攻击归属');
}

// ================= 3. 阶段 / 弱点 / 动态事件 =================
console.log('=== 3. 阶段、弱点与动态事件 ===');
{
  let s = create();
  s = rec(s, ev('pt1', 'phase-transition', { toIndex: 1 }, { phaseId: 'bp2' }), NOW + 100).state;
  s = rec(s, ev('pc1', 'phase-completed', {}, { phaseId: 'bp1' }), NOW + 110).state;
  s = rec(s, ev('ps1', 'phase-started', { phaseIndex: 1 }, { phaseId: 'bp2' }), NOW + 120).state;
  ok(s.phaseTransitions === 1 && s.currentPhaseId === 'bp2' && s.maxPhaseReached === 1, '阶段切换/当前阶段/最高阶段');
  ok(s.phasesCompleted === 1 && s.phaseStats.bp1.durationMs === 110, '阶段停留时间');
  ok(s.phaseStats.bp2.enteredAt === NOW + 120, '新阶段进入时间');

  // 旧阶段事件拒绝
  const stale = rec(s, ev('old', 'attack-telegraph', {}, { phaseId: 'bp1' }), NOW + 130);
  ok(!stale.accepted && stale.reason === 'stale-phase', '旧阶段事件拒绝');

  s = rec(s, ev('w1', 'weakness-clue', { clueId: 'c1', weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 140).state;
  s = rec(s, ev('w1b', 'weakness-clue', { clueId: 'c1', weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 141).state;
  s = rec(s, ev('w2', 'weakness-clue', { clueId: 'c2', weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 150).state;
  s = rec(s, ev('wa', 'weakness-analyzed', { weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 160).state;
  s = rec(s, ev('wd', 'weakness-discovered', { weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 170).state;
  s = rec(s, ev('wc1', 'weakness-crack-result', { outcome: 'failure', weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 180).state;
  s = rec(s, ev('wc2', 'weakness-crack-result', { outcome: 'success', weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 190).state;
  s = rec(s, ev('we', 'weakness-exposed', { weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 200).state;
  s = rec(s, ev('wr', 'weakness-recovered', { weaknessId: 'w2' }, { phaseId: 'bp2' }), NOW + 400).state;
  s = rec(s, ev('wdmg', 'weakness-boss-damage', { amount: 13 }, { phaseId: 'bp2' }), NOW + 410).state;
  ok(s.weaknessStats.clueCount === 2, '线索去重后计数');
  ok(s.weaknessStats.analysisCount === 1 && s.weaknessStats.discoveredCount === 1, '分析与发现计数');
  ok(s.weaknessStats.crackSubmittedCount === 2 && s.weaknessStats.crackSuccessCount === 1 && s.weaknessStats.crackFailedCount === 1, '破解提交/成功/失败');
  ok(s.weaknessStats.exposedCount === 1 && s.weaknessStats.exposureMsTotal === 200, '暴露次数与持续时间');
  ok(s.weaknessStats.bossHpDamage === 13, '弱点 Boss HP 伤害');
  ok(s.phaseStats.bp2.weaknessDiscoveries === 1 && s.phaseStats.bp2.weaknessCracks === 1, '阶段弱点统计');

  s = rec(s, ev('dt', 'dynamic-triggered', { defId: 'unknown-intrusion', instanceId: 'i1' }), NOW + 500).state;
  s = rec(s, ev('di', 'dynamic-attack-interrupted', { instanceId: 'i1' }), NOW + 510).state;
  s = rec(s, ev('dd', 'dynamic-damage-taken', { amount: 4 }), NOW + 520).state;
  s = rec(s, ev('ds', 'dynamic-success', { instanceId: 'i1', durationMs: 5000 }), NOW + 530).state;
  s = rec(s, ev('df', 'dynamic-failed', { instanceId: 'i2' }), NOW + 540).state;
  s = rec(s, ev('dto', 'dynamic-timeout', { instanceId: 'i3' }), NOW + 550).state;
  s = rec(s, ev('dc', 'dynamic-cancelled', { instanceId: 'i4' }), NOW + 560).state;
  s = rec(s, ev('dcl', 'dynamic-cleared', { instanceId: 'i5' }), NOW + 570).state;
  const e = s.dynamicEventStats;
  ok(e.triggeredCount === 1 && e.byDef['unknown-intrusion'] === 1, '动态事件触发统计');
  ok(e.successCount === 1 && e.failedCount === 1 && e.timeoutCount === 1 && e.cancelledByPriorityCount === 1 && e.clearedByBattleEndCount === 1, '动态事件结果分类');
  ok(e.attackInterruptedCount === 1 && e.playerDamageTaken === 4, '动态事件中断攻击/伤害');
  ok(e.durationMsTotal === 5000, '动态事件持续时间');
}

// ================= 4. 幂等 / 拒绝 / 终结 =================
console.log('=== 4. 幂等、拒绝与终结 ===');
{
  let s = create();
  let r1 = rec(s, ev('same', 'challenge-result', { outcome: 'passed' }), NOW + 10);
  s = r1.state;
  let r2 = rec(s, ev('same', 'challenge-result', { outcome: 'passed' }), NOW + 11);
  ok(r1.accepted && !r2.accepted && r2.reason === 'duplicate', '同一 eventId 只累计一次');
  ok(r2.state.challengeStats.passedCount === 1, '重复事件不增加计数');

  const bad = rec(s, { eventId: '', eventType: 'challenge-result' }, NOW + 12);
  ok(!bad.accepted && bad.reason === 'missing-event-id', '缺少 eventId 拒绝');
  const neg = rec(s, ev('neg', 'damage-taken', { amount: -50 }), NOW + 13);
  ok(neg.state.attackStats.damageTaken === 0, '负伤害不污染统计');

  s = rec(s, ev('victory', 'battle-ended', {}), NOW + 1000).state;
  const fin = S.finalizeBossBattleStats(s, 'victory', NOW + 1000);
  ok(fin.state.finalized && fin.state.result === 'victory' && fin.state.battleStatus === 'completed', '生成最终快照');
  ok(fin.state.wallDurationMs === 1000, '战斗时长计算');
  ok(fin.state.phaseStats.bp1.endState === 'victory', '最终阶段结束状态');
  ok(fin.state.dataQuality === 'complete', '数据完整性 complete');
  const fin2 = S.finalizeBossBattleStats(fin.state, 'defeat', NOW + 2000);
  ok(fin2.already && fin2.state.result === 'victory', '重复 finalize 不改变结果');
  const late = rec(fin.state, ev('late', 'damage-taken', { amount: 99 }), NOW + 3000);
  ok(!late.accepted && late.reason === 'finalized', '终结后拒绝迟到事件');
  ok(late.state.attackStats.damageTaken === 0, '迟到事件不污染历史');

  const copy = S.snapshotBossBattleStats(fin.state);
  copy.challengeStats.passedCount = 999;
  ok(fin.state.challengeStats.passedCount !== 999, '摘要为深拷贝，不可篡改原统计');
}

// ================= 5. 自愈 =================
console.log('=== 5. 统计自愈 ===');
{
  ok(S.normalizeBossBattleStats(null) === null, '空数据 → null');
  ok(S.normalizeBossBattleStats({ battleId: 'b' }) === null, '缺少 Boss 数据 → null');
  const dirty = S.normalizeBossBattleStats({
    battleId: 'b1', bossId: 'gate-01', startedAt: -5, endedAt: 'x',
    challengeStats: { passedCount: 9, judgedCount: 3, submittedCount: 1, failedCount: 99 },
    attackStats: { damageTaken: -10 }, phaseStats: { bp1: { phaseIndex: 'x' } },
    eventLog: [{ eventId: 'e', eventType: 'damage-taken' }], settledEventIds: ['e', 'e'],
  });
  ok(!!dirty && dirty.challengeStats.judgedCount >= dirty.challengeStats.passedCount, '判题数不小于通过数');
  ok(dirty.challengeStats.submittedCount >= dirty.challengeStats.judgedCount, '提交数不小于判题数');
  ok(dirty.challengeStats.failedCount <= dirty.challengeStats.judgedCount, '失败数受判题数约束');
  ok(dirty.attackStats.damageTaken >= 0, '负伤害归零');
  ok(dirty.startedAt === 0, '负时间戳安全处理');
  ok(dirty.eventLog.length === 1 && dirty.settledEventIds.length === 1, '事件/幂等表自愈');

  const store = S.normalizeBossBattleStatsStore({
    active: { ...create(), finalized: true, result: 'victory', endedAt: NOW + 10 },
    history: [{ ...create({ battleId: 'old' }), finalized: true, result: 'defeat', endedAt: NOW - 100 }],
  }, 'b1', null);
  ok(store.active === null, '已终结活动统计移入历史');
  ok(store.history.some(x => x.battleId === 'b1') && store.history.some(x => x.battleId === 'old'), '历史保留快照');

  const terminal = S.normalizeBossBattleStatsStore({ active: create(), history: [] }, 'b1', 'victory');
  ok(terminal.active === null && terminal.history[0].result === 'victory', '终结战斗自动 finalize');
  const stale = S.normalizeBossBattleStatsStore({ active: create(), history: [] }, 'other', null);
  ok(stale.active === null, 'battleId 不匹配的旧活动统计被清理');

  let hist = [];
  for (let i = 0; i < 60; i++) hist.push({ ...create({ battleId: 'h' + i }), finalized: true, result: 'victory', endedAt: NOW + i });
  const capped = S.normalizeBossBattleStatsStore({ active: null, history: hist }, null, null);
  ok(capped.history.length <= 50, '历史快照最多 50 场', String(capped.history.length));
}

// ================= 6. 事件日志上限 =================
console.log('=== 6. 事件日志上限 ===');
{
  let s = create();
  for (let i = 0; i < 230; i++) {
    s = rec(s, ev('log-' + i, 'attack-result', { result: 'hit', response: 'none' }, { phaseId: 'bp1' }), NOW + i).state;
  }
  ok(s.eventLog.length <= 200, '活动事件日志有上限', String(s.eventLog.length));
  ok(s.settledEventIds.length <= 400, '幂等表有上限');
  ok(s.attackStats.hitCount === 230, '增量统计不受日志截断影响');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
