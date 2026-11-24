// V1.3-B.5.2 评分算法专项测试（纯函数 / 边界 / 公平性 / 持久化）
// 执行：node test/boss_battle_rating.test.mjs
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
const R = L('src/game/bossBattleRating.ts');
const C = L('src/game/bossBattleRatingConfig.ts');
const Cat = L('src/game/bossWeaknessCatalog.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));

function baseStats(overrides = {}) {
  let s = S.createBossBattleStats({
    battleId: 'battle-rating-1', bossId: 'gate-01', bossName: 'GATE-01 · 数据港守卫',
    difficulty: 'easy', startedAt: 1000, phaseId: 'gate-01-bp1', phaseIndex: 0,
  });
  s = {
    ...s,
    result: 'victory', battleStatus: 'completed', endedAt: 101000, wallDurationMs: 100000,
    finalized: true, finalizedAt: 101000, dataQuality: 'complete',
    challengeStats: {
      ...s.challengeStats, submittedCount: 10, judgedCount: 10, passedCount: 10, failedCount: 0,
      runtimeErrorCount: 0, invalidCount: 0, consecutiveSuccess: 10, maxConsecutiveSuccess: 10,
      failureReasons: {}, successRate: 1, keyCrackSuccess: true,
    },
    attackStats: {
      ...s.attackStats, telegraphCount: 10, startedCount: 8, hitCount: 0, blockedCount: 8,
      cancelledCount: 0, interruptedByWeaknessCount: 0, interruptedByCrisisCount: 0,
      damageTaken: 0, shieldAbsorbed: 2,
    },
    defenseStats: { defenseSuccessCount: 8, defenseFailedCount: 0, dodgeSuccessCount: 4, dodgeFailedCount: 0 },
    weaknessStats: {
      ...s.weaknessStats, clueCount: 3, discoveredCount: 3, analysisCount: 3, crackSubmittedCount: 3,
      crackSuccessCount: 3, crackFailedCount: 0, exposedCount: 2, exposureMsTotal: 12000,
      bossHpDamage: 30, cancelledCount: 0,
    },
    dynamicEventStats: {
      ...s.dynamicEventStats, triggeredCount: 1, byDef: { unknown_intrusion: 1 }, successCount: 1,
      failedCount: 0, playerCompletedCount: 1, timeoutCount: 0, cancelledByPriorityCount: 0,
      clearedByBattleEndCount: 0, attackInterruptedCount: 0, playerDamageTaken: 0, durationMsTotal: 4000,
    },
  };
  return { ...s, ...overrides };
}

const rating = (stats, now = 200000) => R.calculateBossBattleRating(stats, now);
const perfect = rating(baseStats());
console.log('=== 1. 权重与等级边界 ===');
const weightSum = Object.values(C.BOSS_BATTLE_RATING_WEIGHTS).reduce((a, b) => a + b, 0);
ok(weightSum === 100, '五维权重总和严格为 100', String(weightSum));
ok(C.gradeForDisplayScore(100) === 'S', '100 分为 S');
ok(C.gradeForDisplayScore(90) === 'S', '90 分边界为 S');
ok(C.gradeForDisplayScore(89.5) === 'S', '89.5 四舍五入为 90 → S，不出现显示 90 却 A');
ok(C.gradeForDisplayScore(89.4) === 'A', '89.4 → 89 为 A');
ok(C.gradeForDisplayScore(80) === 'A', '80 分边界为 A');
ok(C.gradeForDisplayScore(79.5) === 'A', '79.5 四舍五入为 80 → A');
ok(C.gradeForDisplayScore(79.4) === 'B', '79.4 → 79 为 B');
ok(C.gradeForDisplayScore(70) === 'B', '70 分边界为 B');
ok(C.gradeForDisplayScore(60) === 'C', '60 分边界为 C');
ok(C.gradeForDisplayScore(59.9) === 'C', '59.9 四舍五入为 60 → C，与展示分一致');
ok(C.gradeForDisplayScore(59.4) === 'D', '59.4 → 59 为 D');
ok(C.gradeForDisplayScore(0) === 'D' && C.gradeForDisplayScore(-10) === 'D', '0/负数不越界，均为 D');
ok(C.gradeForDisplayScore(120) === 'S', '超过 100 安全钳制为 S');
ok(C.displayScoreFor(89.5) === 90 && C.displayScoreFor(-3) === 0, '展示分统一四舍五入并钳制');

console.log('=== 2. 满分 / 零分 / 输出结构 ===');
ok(perfect.totalScore === 100 && perfect.displayScore === 100 && perfect.grade === 'S', '完美数据得到 100 分 S', JSON.stringify({ t: perfect.totalScore, g: perfect.grade }));
ok(perfect.dataQuality === 'complete' && perfect.finalized === true, '完整胜利数据生成正式评分');
ok(Object.values(perfect.dimensionScores).every(d => d.available && d.score === d.maxScore), '完美数据五维均为满分');
ok(perfect.ratingId === 'rating:battle-rating-1:v1.0.0', 'ratingId 由 battleId + 版本确定');
ok(perfect.ratingVersion === C.BOSS_BATTLE_RATING_VERSION, '记录评分算法版本');
ok(perfect.performanceHighlights.length > 0 && perfect.ratingReasons.length > 0, '输出评分依据与亮点');
ok(!('rewards' in perfect) && !('reward' in perfect), '评分输出不包含奖励字段');

const zeroStats = baseStats({
  playerDeathCount: 2,
  challengeStats: { ...baseStats().challengeStats, passedCount: 0, failedCount: 10, runtimeErrorCount: 3, successRate: 0, maxConsecutiveSuccess: 0, consecutiveSuccess: 0, keyCrackSuccess: false },
  attackStats: { ...baseStats().attackStats, hitCount: 8, blockedCount: 0, damageTaken: 88 },
  defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 5, dodgeSuccessCount: 0, dodgeFailedCount: 3 },
  weaknessStats: { ...baseStats().weaknessStats, discoveredCount: 0, crackSubmittedCount: 2, crackSuccessCount: 0, crackFailedCount: 2, exposedCount: 0, bossHpDamage: 0 },
  dynamicEventStats: { ...baseStats().dynamicEventStats, successCount: 0, failedCount: 1, playerCompletedCount: 0 },
});
const zero = rating(zeroStats);
ok(zero.totalScore === 0 && zero.grade === 'D', '全维度失败得到 0 分 D', JSON.stringify({ t: zero.totalScore, g: zero.grade }));
ok(zero.totalScore >= 0 && perfect.totalScore <= 100, '分数上限/下限安全');

const invalidNull = rating(null);
const invalidMissing = rating({ foo: 1 });
ok(invalidNull.dataQuality === 'invalid' && invalidNull.finalized === false, 'null 输入返回 invalid 且非正式');
ok(invalidMissing.dataQuality === 'invalid' && invalidMissing.totalScore === 0, '缺少 battleId/bossId 安全拒绝');
const invalidQuality = rating(baseStats({ dataQuality: 'invalid' }));
ok(invalidQuality.dataQuality === 'invalid' && invalidQuality.finalized === false, 'stat dataQuality=invalid 禁止正式评分');

console.log('=== 3. 缺失数据 / 机制不存在 ===');
const noJudge = rating(baseStats({ challengeStats: { ...baseStats().challengeStats, judgedCount: 0, passedCount: 0, submittedCount: 0, successRate: null } }));
ok(noJudge.dimensionAvailability.challenge === 'dataMissing', '无判题数据标记 dataMissing');
ok(noJudge.dataQuality === 'partial' && noJudge.finalized === false, 'dataMissing 降低完整性且不生成正式评分');
ok(noJudge.dimensionScores.challenge.score === 0, '无判题数据不自动满分');

const noDefense = rating(baseStats({
  defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 0, dodgeSuccessCount: 2, dodgeFailedCount: 0 },
}));
ok(noDefense.dimensionScores.tactics.partial === true, '无防御尝试时战术标记子项不完整');
ok(noDefense.dimensionScores.tactics.score === 8, '仅有闪避时只计闪避 8 分，不自动补满');

const noDodge = rating(baseStats({
  defenseStats: { defenseSuccessCount: 4, defenseFailedCount: 0, dodgeSuccessCount: 0, dodgeFailedCount: 0 },
}));
ok(noDodge.dimensionScores.tactics.partial === true && noDodge.dimensionScores.tactics.score === 12, '无闪避尝试时只计防御 12 分');

const noOps = rating(baseStats({
  defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 0, dodgeSuccessCount: 0, dodgeFailedCount: 0 },
  attackStats: { ...baseStats().attackStats, hitCount: 8, blockedCount: 0, damageTaken: 60 },
}));
ok(noOps.dimensionScores.tactics.availability === 'available' && noOps.dimensionScores.tactics.score === 0, '有攻击但无操作 → 战术真实 0 分');

const noAttacks = rating(baseStats({
  attackStats: { ...baseStats().attackStats, startedCount: 0, hitCount: 0, blockedCount: 0, damageTaken: 0 },
  defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 0, dodgeSuccessCount: 0, dodgeFailedCount: 0 },
}));
ok(noAttacks.dimensionScores.survival.availability === 'mechanicUnavailable', '无攻击数据生存维度标记机制不可用');
ok(noAttacks.dimensionScores.tactics.availability === 'mechanicUnavailable', '无攻击且无操作战术维度标记机制不可用');
ok(noAttacks.totalScore === 100 && noAttacks.grade === 'S', '缺少攻击机制不惩罚，其余维度归一化仍可满分', JSON.stringify({ t: noAttacks.totalScore }));

const noWeakness = rating(baseStats({ bossId: 'boss-without-weakness' }));
ok(noWeakness.dimensionAvailability.weakness === 'mechanicUnavailable', '无弱点机制标记 mechanicUnavailable');
ok(noWeakness.totalScore === 100 && noWeakness.dataQuality === 'complete', '无弱点机制不扣分且不降低完整性');

const weaknessIgnored = rating(baseStats({
  weaknessStats: { ...baseStats().weaknessStats, clueCount: 0, discoveredCount: 0, analysisCount: 0, crackSubmittedCount: 0, crackSuccessCount: 0, crackFailedCount: 0, exposedCount: 0, bossHpDamage: 0 },
}));
ok(weaknessIgnored.dimensionAvailability.weakness === 'available' && weaknessIgnored.dimensionScores.weakness.score === 0, 'Boss 有弱点但玩家未发现 → 真实 0 分而非缺失');

const noDynamic = rating(baseStats({ dynamicEventStats: { ...baseStats().dynamicEventStats, triggeredCount: 0, successCount: 0, playerCompletedCount: 0, byDef: {} } }));
ok(noDynamic.dimensionAvailability.crisis === 'mechanicUnavailable', '未触发动态事件标记 mechanicUnavailable');
ok(noDynamic.totalScore === 100, '无动态事件不自动扣分，动态权重归一化');

const systemCancelled = rating(baseStats({
  dynamicEventStats: { ...baseStats().dynamicEventStats, triggeredCount: 1, successCount: 0, failedCount: 0, playerCompletedCount: 0, cancelledByPriorityCount: 1 },
}));
ok(systemCancelled.dimensionAvailability.crisis === 'mechanicUnavailable', '仅被 P2 抢占的事件不算玩家失败，危机维度不参与评分');

const unresolved = rating(baseStats({
  dynamicEventStats: { ...baseStats().dynamicEventStats, triggeredCount: 1, successCount: 0, failedCount: 0, playerCompletedCount: 0, cancelledByPriorityCount: 0, clearedByBattleEndCount: 0 },
}));
ok(unresolved.dimensionAvailability.crisis === 'dataMissing' && unresolved.dataQuality === 'partial', '无法归属玩家的事件标记 dataMissing 并降低完整性');

const partialStats = rating(baseStats({ dataQuality: 'partial' }));
ok(partialStats.dataQuality === 'partial' && partialStats.finalized === false, 'B.5.1 partial 快照只生成临时评分');
const nonVictory = rating(baseStats({ result: 'defeat', battleStatus: 'failed' }));
ok(nonVictory.finalized === false, '非胜利战斗不生成正式评分');

console.log('=== 4. 动态权重与公平性 ===');
ok(perfect.dimensionEffectiveWeights.survival === 0.25 && perfect.dimensionEffectiveWeights.crisis === 0.1, '完整数据有效权重保持原比例');
const noCrisisWeight = Object.values(noDynamic.dimensionEffectiveWeights).reduce((a, b) => a + b, 0);
ok(Math.abs(noCrisisWeight - 1) < 0.02, '缺失机制后有效权重归一化，总和约 1', String(noCrisisWeight));
ok(noDynamic.scoreBreakdown.availableWeight === 90, '无动态事件可用权重为 90');

const fewChallenges = rating(baseStats({
  challengeStats: { ...baseStats().challengeStats, submittedCount: 3, judgedCount: 3, passedCount: 3, failedCount: 0, successRate: 1, maxConsecutiveSuccess: 3, consecutiveSuccess: 3 },
}));
const manyChallenges = rating(baseStats());
ok(fewChallenges.dimensionScores.challenge.score === manyChallenges.dimensionScores.challenge.score, '不同挑战数量在全部通过时评分一致（按成功率归一化）');

const k0defs = Cat.weaknessDefinitionsFor('k0', 'easy').length;
const gateDefs = Cat.weaknessDefinitionsFor('gate-01', 'easy').length;
const k0Full = rating(baseStats({
  bossId: 'k0',
  weaknessStats: { ...baseStats().weaknessStats, clueCount: k0defs, discoveredCount: k0defs, analysisCount: k0defs, crackSubmittedCount: k0defs, crackSuccessCount: k0defs, crackFailedCount: 0, exposedCount: k0defs, bossHpDamage: 30 },
}));
const gateFull = rating(baseStats({
  weaknessStats: { ...baseStats().weaknessStats, discoveredCount: gateDefs, analysisCount: gateDefs, crackSubmittedCount: gateDefs, crackSuccessCount: gateDefs, exposedCount: gateDefs },
}));
ok(k0defs !== gateDefs, '不同 Boss 弱点数量确实不同（测试前提）', `${k0defs}/${gateDefs}`);
ok(k0Full.dimensionScores.weakness.score === gateFull.dimensionScores.weakness.score, '不同弱点数量按各自机制归一化后评分一致');

const poor = rating(baseStats({
  challengeStats: { ...baseStats().challengeStats, passedCount: 2, failedCount: 8, successRate: 0.2, maxConsecutiveSuccess: 1 },
  attackStats: { ...baseStats().attackStats, hitCount: 6, blockedCount: 2, damageTaken: 60 },
  defenseStats: { defenseSuccessCount: 1, defenseFailedCount: 4, dodgeSuccessCount: 0, dodgeFailedCount: 2 },
  weaknessStats: { ...baseStats().weaknessStats, discoveredCount: 1, crackSubmittedCount: 2, crackSuccessCount: 1, crackFailedCount: 1, exposedCount: 1, bossHpDamage: 5 },
  dynamicEventStats: { ...baseStats().dynamicEventStats, successCount: 0, failedCount: 1 },
}));
ok(poor.totalScore < perfect.totalScore && perfect.totalScore - poor.totalScore >= 20, '高质量表现显著高于低质量表现', `${perfect.totalScore}/${poor.totalScore}`);

const stageVariant = clone(baseStats());
stageVariant.phaseStats = {
  p1: { phaseId: 'p1', phaseIndex: 0, enteredAt: 1, exitedAt: 2, durationMs: 1, damageTaken: 0, attackCount: 1, challengeSuccess: 1, challengeFailed: 0, weaknessDiscoveries: 0, weaknessCracks: 0, endState: 'completed' },
  p2: { phaseId: 'p2', phaseIndex: 1, enteredAt: 2, exitedAt: 3, durationMs: 1, damageTaken: 0, attackCount: 1, challengeSuccess: 1, challengeFailed: 0, weaknessDiscoveries: 0, weaknessCracks: 0, endState: 'victory' },
};
ok(rating(stageVariant).totalScore === perfect.totalScore, '阶段数量本身不直接改变评分（只看表现）');

const hard = rating(baseStats({ difficulty: 'hard' }));
ok(hard.totalScore === perfect.totalScore, '相同表现下难度字段本身不直接改变评分口径');

const singleDimension = rating(baseStats({
  playerDeathCount: 2,
  attackStats: { ...baseStats().attackStats, hitCount: 8, blockedCount: 0, damageTaken: 80 },
  defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 4, dodgeSuccessCount: 0, dodgeFailedCount: 2 },
  weaknessStats: { ...baseStats().weaknessStats, discoveredCount: 0, crackSubmittedCount: 2, crackSuccessCount: 0, crackFailedCount: 2, exposedCount: 0, bossHpDamage: 0 },
  dynamicEventStats: { ...baseStats().dynamicEventStats, triggeredCount: 1, successCount: 0, failedCount: 1, playerCompletedCount: 0 },
}));
ok(singleDimension.totalScore === 30 && singleDimension.grade === 'D', '单一维度刷满不能获得高总评（挑战满分仅 30）', JSON.stringify({ t: singleDimension.totalScore }));

console.log('=== 5. 输入保护 / 确定性 / 摘要 ===');
const original = baseStats();
const before = JSON.stringify(original);
rating(original);
ok(JSON.stringify(original) === before, '评分不修改输入统计快照');
const a = rating(baseStats(), 300000);
const b = rating(baseStats(), 300000);
ok(a.totalScore === b.totalScore && a.grade === b.grade && a.sourceStatsHash === b.sourceStatsHash, '相同输入重复评分结果一致');
ok(a.performanceHighlights.join('|') === b.performanceHighlights.join('|'), '相同输入解释文案一致');
const changed = baseStats();
changed.challengeStats = { ...changed.challengeStats, passedCount: 9, failedCount: 1, successRate: 0.9 };
ok(rating(changed).sourceStatsHash !== perfect.sourceStatsHash, '统计变化会改变 sourceStatsHash');
ok(/^[0-9a-f]{8}$/.test(perfect.sourceStatsHash), 'sourceStatsHash 为稳定 8 位摘要');

const shieldVariant = baseStats({ attackStats: { ...baseStats().attackStats, shieldAbsorbed: 50 } });
ok(rating(shieldVariant).totalScore === perfect.totalScore, '护罩记录不重复扣生存分（仅作为依据）');
const interruptVariant = baseStats({ attackStats: { ...baseStats().attackStats, cancelledCount: 3, interruptedByWeaknessCount: 2, interruptedByCrisisCount: 1 } });
ok(rating(interruptVariant).dimensionScores.tactics.score === perfect.dimensionScores.tactics.score, '攻击取消/中断不计为玩家操作成功');

console.log('=== 6. 评分持久化 ===');
const store0 = { history: [] };
const formal = rating(baseStats());
const r1 = R.recordBossBattleRating(store0, formal);
ok(r1.added && r1.store.history.length === 1, '正式评分写入历史');
const r2 = R.recordBossBattleRating(r1.store, formal);
ok(!r2.added && r2.reason === 'duplicate' && r2.store.history.length === 1, '同一 ratingId 重复写入被拒绝');

const provisional = clone(formal);
provisional.dataQuality = 'partial';
provisional.finalized = false;
const pStore = R.recordBossBattleRating({ history: [] }, provisional);
ok(pStore.added && !pStore.store.history[0].finalized, '临时评分可保存并标记非正式');
const replaced = R.recordBossBattleRating(pStore.store, formal);
ok(replaced.added && replaced.reason === 'replaced-partial' && replaced.store.history[0].finalized, '正式评分替换同 battleId 的临时评分');

const otherVersion = clone(formal);
otherVersion.ratingVersion = 'v0.9.0';
otherVersion.ratingId = 'rating:' + formal.battleId + ':v0.9.0';
const rv = R.recordBossBattleRating(r1.store, otherVersion);
ok(!rv.added && rv.reason === 'battle-already-rated', '同一战斗不生成第二份正式评分');

let capped = { history: [] };
for (let i = 0; i < 55; i++) {
  const x = clone(formal);
  x.battleId = 'battle-cap-' + i;
  x.ratingId = 'rating:' + x.battleId + ':v1.0.0';
  x.ratedAt = 1000 + i;
  capped = R.recordBossBattleRating(capped, x).store;
}
ok(capped.history.length === 50, '评分历史上限为 50', String(capped.history.length));

const corruptStore = R.normalizeBossBattleRatingStore({
  history: [
    formal,
    clone(formal),
    { battleId: '', bossId: 'x', ratingVersion: 'v1' },
    { battleId: 'bad', bossId: 'x', ratingVersion: 'v1', dataQuality: 'invalid', totalScore: 50 },
    null,
  ],
});
ok(corruptStore.history.length === 1, '存档自愈丢弃重复/非法/无效评分');
ok(R.findBossBattleRating(r1.store, formal.battleId)?.finalized === true, '按 battleId 读取正式评分');
ok(R.latestBossBattleRatingForBoss(r1.store, formal.bossId)?.battleId === formal.battleId, '按 Boss 读取最近正式评分');
const newer = clone(formal);
newer.battleId = 'battle-rating-2';
newer.ratingId = 'rating:battle-rating-2:v1.0.0';
newer.ratedAt = formal.ratedAt + 1000;
ok(R.latestBossBattleRatingForBoss({ history: [formal, newer] }, formal.bossId)?.battleId === 'battle-rating-2', '多场评分按 Boss 返回最近正式评分');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
