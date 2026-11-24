// V1.3-B.5.5 结算数据模型专项测试（纯投影 / 数据完整性 / 幂等 / 展示）
// 执行：node test/boss_settlement.test.mjs
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
const W = L('src/game/bossBattleReward.ts');
const M = L('src/game/bossSettlement.ts');
const Save = L('src/services/save.ts');
const C = L('src/game/bossAchievementConfig.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 900000;

function makeStats(over = {}) {
  let s = S.createBossBattleStats({
    battleId: 'battle-settle-1', bossId: 'gate-01', bossName: 'GATE-01', difficulty: 'easy',
    startedAt: NOW, phaseId: 'gate-01-bp1', phaseIndex: 0, consciousness: 100,
  });
  s = {
    ...s,
    result: 'victory', battleStatus: 'completed', endedAt: NOW + 90000, wallDurationMs: 90000,
    finalized: true, finalizedAt: NOW + 90000, dataQuality: 'complete', minConsciousness: 18,
    currentPhaseId: 'gate-01-bp2', currentPhaseIndex: 1, maxPhaseReached: 1, phaseTransitions: 1, phasesCompleted: 2,
    phaseStats: {
      'gate-01-bp1': { phaseId: 'gate-01-bp1', phaseIndex: 0, enteredAt: NOW, exitedAt: NOW + 30000, durationMs: 30000, damageTaken: 5, attackCount: 2, challengeSuccess: 2, challengeFailed: 1, weaknessDiscoveries: 1, weaknessCracks: 1, endState: 'completed' },
      'gate-01-bp2': { phaseId: 'gate-01-bp2', phaseIndex: 1, enteredAt: NOW + 30000, exitedAt: NOW + 90000, durationMs: 60000, damageTaken: 7, attackCount: 3, challengeSuccess: 2, challengeFailed: 0, weaknessDiscoveries: 1, weaknessCracks: 1, endState: 'victory' },
    },
    challengeStats: {
      ...s.challengeStats, submittedCount: 6, judgedCount: 5, passedCount: 4, failedCount: 1,
      runtimeErrorCount: 0, invalidCount: 1, consecutiveSuccess: 0, maxConsecutiveSuccess: 3,
      failureReasons: { 'judge-failed': 1 }, successRate: 0.8, keyCrackSuccess: true,
    },
    attackStats: {
      ...s.attackStats, telegraphCount: 5, startedCount: 5, hitCount: 1, blockedCount: 2,
      cancelledCount: 1, interruptedByWeaknessCount: 1, interruptedByCrisisCount: 0,
      damageTaken: 12, shieldAbsorbed: 3,
    },
    defenseStats: { defenseSuccessCount: 2, defenseFailedCount: 0, dodgeSuccessCount: 2, dodgeFailedCount: 0 },
    weaknessStats: {
      ...s.weaknessStats, clueCount: 2, discoveredIds: ['gate-01-w1', 'gate-01-bp2-w2'],
      crackedIds: ['gate-01-w1', 'gate-01-bp2-w2'], discoveredCount: 2, analysisCount: 2,
      crackSubmittedCount: 2, crackSuccessCount: 2, crackFailedCount: 0, exposedCount: 1,
      exposureMsTotal: 3000, bossHpDamage: 18, cancelledCount: 0,
    },
    dynamicEventStats: {
      ...s.dynamicEventStats, triggeredCount: 1, byDef: { 'unknown-intrusion': 1 },
      successByDef: { 'unknown-intrusion': 1 }, successCount: 1, failedCount: 0,
      playerCompletedCount: 1, timeoutCount: 0, cancelledByPriorityCount: 0,
      clearedByBattleEndCount: 0, attackInterruptedCount: 0, playerDamageTaken: 0, durationMsTotal: 3000,
    },
    playerDeathCount: 0,
  };
  return { ...s, ...over };
}
const stats = makeStats();
const rating = R.calculateBossBattleRating(stats, NOW + 91000);
const reward = W.calculateBossBattleRewards({ stats, rating, bossId: 'gate-01', difficulty: 'easy', legacyGranted: W.bossLegacyRewardOffset('gate-01', 'easy'), now: NOW + 92000 });
const grantedReward = { ...reward, granted: true, grantedAt: NOW + 93000 };

const player = Save.defaultState();
player.consciousness = 42;
player.progress.currentBossId = 'gate-01';
player.meta.memoryFragments = ['frag-01'];
player.progress.bossBattleStats = { active: null, history: [stats] };
player.progress.bossBattleRatings = { history: [rating] };
player.progress.bossBattleRewards = { history: [grantedReward], grantedBattleIds: [reward.battleId], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
player.progress.bossBattleHistory = [{ ...stats, stats: { damageDealt: 120, damageReceived: 12, challengeAttempts: 6, challengeSuccesses: 4, challengeFailures: 1 } }];
const achievementDefs = C.BOSS_ACHIEVEMENT_DEFINITIONS;
player.progress.bossAchievements = {
  unlocked: [
    { achievementId: 'boss_no_death', unlockedAt: NOW + 94000, battleId: stats.battleId, bossId: 'gate-01', difficulty: 'easy', rewardId: 'boss-achievement-reward:boss_no_death:v1.0.0', rewardGranted: true, rewardGrantedAt: NOW + 94000, evidence: { battleId: stats.battleId, bossId: 'gate-01', difficulty: 'easy', challengePassed: 4, challengeJudged: 5, playerDeathCount: 0, damageTaken: 12, minConsciousness: 18, defenseSuccess: 2, dodgeSuccess: 2, weaknessDiscovered: 2, weaknessCracked: 2, weaknessExposed: 1, weaknessDamage: 18, dynamicTriggered: 1, dynamicSuccess: 1, dynamicSuccessByDef: { 'unknown-intrusion': 1 } } },
    { achievementId: 'boss_weakness_master', unlockedAt: NOW + 95000, battleId: stats.battleId, bossId: 'gate-01', difficulty: 'easy', rewardId: 'boss-achievement-reward:boss_weakness_master:v1.0.0', rewardGranted: true, rewardGrantedAt: NOW + 95000, evidence: { battleId: stats.battleId, bossId: 'gate-01', difficulty: 'easy', weaknessCracked: 2, weaknessDamage: 18 } },
  ],
  progress: [], rewardHistory: [], eventDeduplication: [],
};
const data = M.buildBossSettlementData(player, stats.battleId, { fragmentGranted: true, now: NOW + 96000 });

console.log('=== 1. 基础投影 ===');
ok(!!data, '存在正式结算数据');
ok(data.battleId === stats.battleId && data.bossId === 'gate-01', 'battleId/bossId 正确');
ok(data.outcome === 'victory' && data.resultCode === 'VICTORY', '胜利结果正确');
ok(data.outcomeTitle === 'BOSS DEFEATED' && data.outcomeSubtitle === '目标已消除', '胜利标题/中文');
ok(data.bossName.includes('GATE-01'), 'Boss 名称');
ok(data.difficultyLabel === 'EASY' && data.dataQuality === 'complete', '难度/完整性');
ok(data.durationMs === 90000 && M.formatSettlementDuration(data.durationMs) === '1 分 30 秒', '战斗时长');
ok(data.completedAt === NOW + 90000, '完成时间');
ok(data.finalPhase === 2 && data.phaseTotal === 3, '最终阶段/总阶段');
ok(data.consciousness === 42 && data.deaths === 0, '剩余意识/死亡');
ok(data.statsAvailable === true, '统计可用');
ok(data.source.statsBattleId === stats.battleId && data.source.ratingId === rating.ratingId && data.source.rewardId === reward.rewardId, 'source 绑定 battleId/评分/奖励');
ok(data.achievementCount === 2 && data.achievements.length === 2, '只展示本场成就');
ok(data.source.achievementIds.length === 2, 'source 成就 ID');
ok(data.reward.fragments === 0, 'B.5.3 增量碎片为 0');
ok(data.reward.grantedAt === NOW + 93000, '奖励到账时间');
ok(data.reward.fragmentTitle === '初始指令' && data.reward.fragmentStatus !== '未发放', '首胜碎片信息完整');
for (const key of ['survival', 'challenge', 'tactics', 'weakness', 'crisis']) {
  ok(data.rating.dimensions.some(d => d.key === key), '五维包含 ' + key);
}
for (const a of data.achievements) {
  ok(a.reward.xp >= 0 && a.reward.contribution >= 0, '成就奖励非负：' + a.achievementId);
  ok(a.evidence.length > 0, '成就证据非空：' + a.achievementId);
}
ok(data.strengths.some(x => x.includes('未发生死亡') || x.includes('弱点')), '总结包含真实生存/弱点亮点');
ok(data.improvements.some(x => x.includes('判题失败')), '总结包含真实失败改进');
ok(data.phaseRows[0].label === '阶段 1' && data.phaseRows[1].label === '阶段 2', '阶段标签');
ok(data.phaseRows[0].damageTaken === 5 && data.phaseRows[1].damageTaken === 7, '阶段伤害');
ok(data.phaseRows[0].weaknessCracks === 1, '阶段弱点');
ok(data.metrics.challenge.length === 7 && data.metrics.combat.length === 8, '基础/攻防指标数量');
ok(data.metrics.weakness.length === 5 && data.metrics.dynamic.length === 4, '弱点/动态指标数量');
ok(data.metrics.progress.length === 4, '阶段指标数量');
ok(data.metrics.combat.find(m => m.key === 'damageDealt').value === 120, '造成伤害值');
ok(data.metrics.combat.find(m => m.key === 'interrupted').value === 1, '打断值');
ok(data.metrics.dynamic.find(m => m.key === 'successRate').display === '100%', '成功率展示');
ok(data.metrics.challenge.find(m => m.key === 'invalid').display === '1', '无效提交展示');
ok(data.rating.displayScore >= 0 && data.rating.displayScore <= 100, '展示分范围');
ok(data.rating.totalScore >= 0 && data.rating.totalScore <= 100, '总分范围');
ok(data.rating.dataQuality === 'complete', '评分完整性');
ok(data.reward.baseXp === 150 && data.reward.fullXp >= data.reward.baseXp, '奖励基础/完整关系');
ok(data.reward.credits === data.reward.contribution, 'Credits 与贡献点映射');
ok(data.reward.available && data.reward.granted, '奖励可用已发放');
ok(data.outcome !== 'defeat' && data.outcome !== 'retreat', '胜利不被误判失败');
ok(data.dataQuality === 'complete' && data.statsAvailable, '完整统计可展示');

console.log('=== 2. 统计展示 ===');
const metric = (group, key) => data.metrics[group].find(m => m.key === key);
ok(metric('challenge', 'submitted').value === 6 && metric('challenge', 'judged').value === 5 && metric('challenge', 'passed').value === 4, '挑战统计真实');
ok(metric('challenge', 'failed').value === 1 && metric('challenge', 'invalid').value === 1, '失败/无效提交');
ok(metric('challenge', 'streak').value === 3 && metric('challenge', 'deaths').value === 0, '连续/死亡');
ok(metric('combat', 'warning').value === 5 && metric('combat', 'hit').value === 1 && metric('combat', 'blocked').value === 2, '攻防统计');
ok(metric('combat', 'dodged').value === 2 && metric('combat', 'cancelled').value === 1, '闪避/取消');
ok(metric('combat', 'interrupted').value === 1, '攻击打断合计');
ok(metric('combat', 'damageTaken').value === 12 && metric('combat', 'damageDealt').value === 120, '伤害来自真实记录');
ok(metric('weakness', 'discovered').value === 2 && metric('weakness', 'uniqueDiscovered').value === 2, '弱点发现/唯一数');
ok(metric('weakness', 'cracked').value === 2 && metric('weakness', 'exposed').value === 1 && metric('weakness', 'damage').value === 18, '弱点破解/利用/伤害');
ok(metric('dynamic', 'triggered').value === 1 && metric('dynamic', 'success').value === 1 && metric('dynamic', 'successRate').value === 100, '动态事件统计');
ok(metric('progress', 'phases').value === 1 && metric('progress', 'completed').value === 2 && metric('progress', 'maxPhase').value === 2, '阶段统计');
ok(metric('progress', 'minConsciousness').value === 18, '最低意识');
ok(data.phaseRows.length === 2 && data.phaseRows[0].challengeSuccess === 2 && data.phaseRows[1].endState === 'victory', '阶段明细');
ok(metric('combat', 'damageDealt').available === true, '造成伤害真实可用');
const noRunRecord = clone(player);
noRunRecord.progress.bossBattleHistory = [];
const noRun = M.buildBossSettlementData(noRunRecord, stats.battleId);
ok(noRun.metrics.combat.find(m => m.key === 'damageDealt').display === 'N/A', '缺少造成伤害数据不伪造 0');

console.log('=== 3. 评分 ===');
ok(data.rating.available && data.rating.finalized === true, '评分可用且正式');
ok(data.rating.grade === rating.grade && data.rating.displayScore === rating.displayScore, '等级/展示分');
ok(data.rating.dimensions.length === 5, '五维评分');
ok(data.rating.dimensions.every(d => d.weight > 0 && d.maxScore > 0), '维度权重/满分');
ok(data.rating.reasons.length > 0, '评分依据');
ok(data.rating.ratingVersion === rating.ratingVersion, '评分版本');
const noRatingPlayer = clone(player);
noRatingPlayer.progress.bossBattleRatings = { history: [] };
const noRating = M.buildBossSettlementData(noRatingPlayer, stats.battleId);
ok(noRating.rating === null, '无评分时明确不可用');
const partialRating = clone(rating); partialRating.finalized = false; partialRating.dataQuality = 'partial';
const pPlayer = clone(player); pPlayer.progress.bossBattleRatings = { history: [partialRating] };
const pData = M.buildBossSettlementData(pPlayer, stats.battleId);
ok(pData.rating.available && pData.rating.finalized === false && pData.rating.dataQuality === 'partial', '临时评分明确标记');

console.log('=== 4. 奖励 ===');
ok(data.reward.available && data.reward.granted === true, '奖励可用且已发放');
ok(data.reward.xp === reward.grantedReward.xp && data.reward.contribution === reward.grantedReward.contribution, '实际奖励与 B.5.3 一致');
ok(data.reward.credits === data.reward.contribution, 'Credits 映射项目贡献点');
ok(data.reward.baseXp === reward.baseReward.xp && data.reward.performanceXp === reward.performanceBonus.xp, '奖励来源明细');
ok(data.reward.fullXp === reward.finalReward.xp && data.reward.legacyXp === reward.legacyOffset.xp, '完整/既有奖励');
ok(data.reward.fragmentStatus === '已归位' && data.reward.fragmentTitle === '初始指令', '首胜碎片状态/标题', data.reward.fragmentTitle);
const noRewardPlayer = clone(player);
noRewardPlayer.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
const noReward = M.buildBossSettlementData(noRewardPlayer, stats.battleId);
ok(noReward.reward.available === false && noReward.reward.reason === '奖励数据不可用', '无奖励明确不可用');
ok(noReward.reward.xp === null && noReward.reward.fragments === null, '无奖励不伪造 0');

console.log('=== 5. 成就 / 隐藏 ===');
ok(data.achievements.every(a => a.unlockedAt > 0 && a.name && a.evidence), '成就展示名称/时间/证据');
ok(data.achievements.some(a => a.achievementId === 'boss_no_death'), '零死亡成就展示');
ok(data.achievements.some(a => a.achievementId === 'boss_weakness_master' && a.evidence.includes('2')), '弱点专家证据');
const hiddenDef = achievementDefs.find(d => d.hidden);
const hiddenPlayer = clone(player);
hiddenPlayer.progress.bossAchievements.unlocked.push({
  achievementId: hiddenDef.id, unlockedAt: NOW + 97000, battleId: stats.battleId, bossId: 'gate-01', difficulty: 'easy',
  rewardId: 'x', rewardGranted: true, rewardGrantedAt: NOW, evidence: { battleId: stats.battleId, bossId: 'gate-01', difficulty: 'easy' },
});
const hiddenData = M.buildBossSettlementData(hiddenPlayer, stats.battleId);
ok(hiddenData.achievements.some(a => a.achievementId === hiddenDef.id && a.hidden === true && a.name), '已解锁隐藏成就可在结算中展示');
const noAchPlayer = clone(player); noAchPlayer.progress.bossAchievements.unlocked = [];
const noAch = M.buildBossSettlementData(noAchPlayer, stats.battleId);
ok(noAch.achievementCount === 0 && noAch.achievements.length === 0, '无成就时为空');
const otherBattleUnlock = clone(player);
otherBattleUnlock.progress.bossAchievements.unlocked[0].battleId = 'other-battle';
const otherData = M.buildBossSettlementData(otherBattleUnlock, stats.battleId);
ok(otherData.achievementCount === 1, '只展示本场 battleId 成就');

console.log('=== 6. 失败 / 撤退 / 异常 ===');
const defeatStats = makeStats({ result: 'defeat', battleStatus: 'failed', endedAt: NOW + 50000, wallDurationMs: 50000, finalized: true, dataQuality: 'complete' });
const defeatPlayer = clone(player);
defeatPlayer.progress.bossBattleStats = { active: null, history: [defeatStats] };
defeatPlayer.progress.bossBattleRatings = { history: [] };
defeatPlayer.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
defeatPlayer.progress.bossAchievements.unlocked = [];
const defeat = M.buildBossSettlementData(defeatPlayer, defeatStats.battleId, { failureReason: '意识完整度归零' });
ok(defeat.outcome === 'defeat' && defeat.outcomeTitle === 'SYSTEM FAILURE', '失败结算标题');
ok(defeat.failureReason === '意识完整度归零', '失败原因');
ok(defeat.rating === null && defeat.reward.available === false && defeat.achievementCount === 0, '失败不展示评分/奖励/成就');
const retreatStats = makeStats({ result: 'retreat', battleStatus: 'abandoned', endedAt: NOW + 20000, wallDurationMs: 20000 });
const retreatPlayer = clone(defeatPlayer); retreatPlayer.progress.bossBattleStats = { active: null, history: [retreatStats] };
const retreat = M.buildBossSettlementData(retreatPlayer, retreatStats.battleId);
ok(retreat.outcome === 'retreat' && retreat.outcomeTitle === 'MISSION ABORTED', '撤退结算标题');
ok(retreat.failureReason === '玩家主动撤退', '撤退原因');
ok(retreat.resultCode === 'RETREAT', '撤退不误判胜利');
const partialStats = makeStats({ dataQuality: 'partial' });
const partialPlayer = clone(player); partialPlayer.progress.bossBattleStats = { active: null, history: [partialStats] };
ok(M.buildBossSettlementData(partialPlayer, partialStats.battleId).dataQuality === 'partial', 'partial 数据兼容');
const invalidStats = makeStats({ dataQuality: 'invalid' });
const invalidPlayer = clone(player); invalidPlayer.progress.bossBattleStats = { active: null, history: [invalidStats] };
ok(M.buildBossSettlementData(invalidPlayer, invalidStats.battleId).dataQuality === 'invalid', 'invalid 数据兼容');
const emptyPlayer = Save.defaultState();
const missing = M.buildBossSettlementData(emptyPlayer, 'missing-battle');
ok(missing === null, '完全未知 battleId 安全返回 null');
const mismatchPlayer = clone(player);
mismatchPlayer.progress.bossBattleRatings.history[0].battleId = 'other';
const mismatch = M.buildBossSettlementData(mismatchPlayer, stats.battleId);
ok(mismatch.rating === null, '评分 battleId 不一致时不混入');
const statsNoData = clone(player);
statsNoData.progress.bossBattleStats = { active: null, history: [] };
const noStats = M.buildBossSettlementData(statsNoData, stats.battleId);
ok(noStats !== null && noStats.statsAvailable === false && noStats.dataQuality === 'invalid', '缺统计数据仍可生成不可用结算');

console.log('=== 7. 总结 / 幂等 / 时长 ===');
ok(data.strengths.length > 0 && data.strengths.length <= 3, '优秀表现最多 3 条');
ok(data.improvements.length > 0 && data.improvements.length <= 3, '改进最多 3 条');
ok(!data.improvements.some(x => x.includes('弱点') && x.includes('未发现')), '已发现弱点时不生成错误建议');
const before = JSON.stringify(player);
M.buildBossSettlementData(player, stats.battleId, { fragmentGranted: true });
ok(JSON.stringify(player) === before, '结算投影不修改玩家状态');
const d1 = M.buildBossSettlementData(player, stats.battleId);
const d2 = M.buildBossSettlementData(player, stats.battleId);
ok(d1.battleId === d2.battleId && d1.bossId === d2.bossId && JSON.stringify(d1.metrics) === JSON.stringify(d2.metrics), '相同输入重复投影一致');
ok(M.formatSettlementDuration(null) === 'N/A' && M.formatSettlementDuration(-1) === 'N/A', '非法时长显示 N/A');
ok(M.formatSettlementDuration(5000) === '5 秒' && M.formatSettlementDuration(61000) === '1 分 01 秒', '时长格式');
ok(data.source.achievementIds.every(id => data.achievements.some(a => a.achievementId === id)), 'source 成就与展示一致');
ok(data.metrics.challenge.every(m => m.available ? m.display !== 'N/A' : m.display === 'N/A'), '指标可用性与显示一致');
ok(data.metrics.combat.length >= 8 && data.metrics.weakness.length >= 5 && data.metrics.dynamic.length >= 4, '统计分区覆盖攻防/弱点/动态');
ok(data.phaseRows.every(p => p.phaseId && p.endState), '阶段行完整');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
