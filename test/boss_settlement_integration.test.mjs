// V1.3-B.5.5 结算集成测试：B.5.1 → B.5.2 → B.5.3 → B.5.4 → 结算 + 存档
// 执行：node test/boss_settlement_integration.test.mjs
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
const A = L('src/game/bossAchievementEngine.ts');
const Store = L('src/game/bossAchievementStore.ts');
const M = L('src/game/bossSettlement.ts');
const Save = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 1000000;

function realStats() {
  let s = S.createBossBattleStats({
    battleId: 'battle@settle-integration', bossId: 'gate-01', bossName: 'GATE-01',
    difficulty: 'easy', startedAt: NOW, phaseId: 'gate-01-bp1', phaseIndex: 0, consciousness: 100,
  });
  const rec = (id, type, payload = {}, at = NOW + 10) => {
    s = S.recordBossBattleEvent(s, { eventId: id, eventType: type, phaseId: 'gate-01-bp1', source: 'integration', payload, occurredAt: at }, at).state;
  };
  rec('start', 'battle-started', {}, NOW + 1);
  for (let i = 0; i < 6; i++) {
    rec('t' + i, 'attack-telegraph', { attackType: 'single' }, NOW + 1000 + i * 1000);
    rec('s' + i, 'attack-started', { attackId: 'a' + i }, NOW + 1500 + i * 1000);
    const result = i < 2 ? 'blocked' : i < 4 ? 'dodged' : 'hit';
    const response = result === 'blocked' ? 'defend' : result === 'dodged' ? 'dodge' : 'none';
    rec('r' + i, 'attack-result', { result, response, attackId: 'a' + i }, NOW + 2000 + i * 1000);
  }
  rec('int', 'attack-interrupted', { reason: 'weakness-crack', attackId: 'a0' }, NOW + 9000);
  rec('dmg', 'damage-taken', { amount: 12, consciousness: 22, source: 'boss-attack' }, NOW + 9500);
  for (let i = 0; i < 5; i++) rec('c' + i, 'challenge-result', { outcome: 'passed', phaseCleared: i === 3 }, NOW + 10000 + i * 1000);
  for (const id of ['gate-01-w1', 'gate-01-w2']) {
    rec('disc-' + id, 'weakness-discovered', { weaknessId: id }, NOW + 16000);
    rec('crack-' + id, 'weakness-crack-result', { outcome: 'success', weaknessId: id }, NOW + 17000);
  }
  rec('wexp', 'weakness-exposed', { weaknessId: 'gate-01-w1' }, NOW + 18000);
  rec('wdmg', 'weakness-boss-damage', { amount: 20, weaknessId: 'gate-01-w1' }, NOW + 19000);
  rec('wrec', 'weakness-recovered', { weaknessId: 'gate-01-w1', durationMs: 3000 }, NOW + 21000);
  rec('e1', 'dynamic-triggered', { defId: 'unknown-intrusion', instanceId: 'intr-1' }, NOW + 22000);
  rec('e2', 'dynamic-success', { instanceId: 'intr-1', defId: 'unknown-intrusion', durationMs: 4000 }, NOW + 26000);
  rec('pc', 'phase-completed', {}, NOW + 28000);
  return S.finalizeBossBattleStats(s, 'victory', NOW + 30000).state;
}

const stats = realStats();
const rating = R.calculateBossBattleRating(stats, NOW + 31000);
const reward = W.calculateBossBattleRewards({ stats, rating, bossId: 'gate-01', difficulty: 'easy', legacyGranted: W.bossLegacyRewardOffset('gate-01', 'easy'), now: NOW + 32000 });
const grantedReward = { ...reward, granted: true, grantedAt: NOW + 33000 };
const evalA = A.evaluateBossAchievements({ stats, rating, reward, bossId: 'gate-01', difficulty: 'easy', now: NOW + 34000 });
const player0 = Save.defaultState();
player0.consciousness = 45;
player0.progress.currentBossId = 'gate-01';
player0.progress.bossBattleStats = { active: null, history: [stats] };
player0.progress.bossBattleRatings = { history: [rating] };
player0.progress.bossBattleRewards = { history: [grantedReward], grantedBattleIds: [reward.battleId], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
player0.progress.bossBattleHistory = [{ ...stats, stats: { damageDealt: 140 } }];
const appliedAch = Store.evaluateAndApplyBossAchievements(player0, evalA, NOW + 35000);
const player = appliedAch.player;
player.progress.currentBossId = 'gate-01';
const data = M.buildBossSettlementData(player, stats.battleId, { fragmentGranted: true, now: NOW + 36000 });

console.log('=== 1. 全链路数据 ===');
ok(!!data, 'B.5.1~B.5.4 → B.5.5 生成结算');
ok(data.battleId === stats.battleId, '结算 battleId 与统计一致');
ok(data.source.statsBattleId === stats.battleId, '来源统计 battleId');
ok(data.source.ratingId === rating.ratingId, '来源正式评分');
ok(data.source.rewardId === reward.rewardId, '来源正式奖励');
ok(data.source.achievementIds.length === evalA.newlyUnlocked.length, '来源成就数量');
ok(data.consciousness === 45 && data.deaths === 0, '玩家状态');
ok(data.dataQuality === 'complete' && data.statsAvailable, '完整统计');
ok(data.outcome === 'victory' && data.outcomeTitle === 'BOSS DEFEATED', '胜利结算');
ok(data.reward.xp === reward.grantedReward.xp && data.reward.contribution === reward.grantedReward.contribution, '奖励金额与 B.5.3 一致');
ok(data.reward.fullXp === reward.finalReward.xp && data.reward.legacyXp === reward.legacyOffset.xp, '完整/既有奖励一致');
ok(data.rating.grade === rating.grade && data.rating.displayScore === rating.displayScore, '评分等级/分数一致');
ok(data.rating.dimensions.length === 5, '五维展示');
ok(data.achievements.length === evalA.newlyUnlocked.length, '成就数量一致');
ok(data.achievements.every(a => evalA.newlyUnlocked.some(n => n.achievementId === a.achievementId)), '成就 ID 一致');
ok(data.achievements.every(a => a.evidence.length > 0), '每项成就有真实证据');
ok(data.metrics.challenge.find(m => m.key === 'judged').value === 5, '挑战统计一致');
ok(data.metrics.combat.find(m => m.key === 'damageDealt').value === 140, '造成伤害来自战斗记录');
ok(data.metrics.weakness.find(m => m.key === 'uniqueDiscovered').value === 2, '唯一弱点统计');
ok(data.metrics.dynamic.find(m => m.key === 'success').value === 1, '动态事件成功');
ok(data.strengths.length > 0 && data.improvements.length >= 0, '表现总结');
ok(data.phaseRows.length >= 1, '阶段明细');

console.log('=== 2. 只读 / 幂等 ===');
const before = JSON.stringify(player);
M.buildBossSettlementData(player, stats.battleId);
ok(JSON.stringify(player) === before, '结算不修改玩家/奖励/成就');
const beforeRewards = JSON.stringify(player.progress.bossBattleRewards);
const beforeAch = JSON.stringify(player.progress.bossAchievements);
const d2 = M.buildBossSettlementData(player, stats.battleId);
ok(JSON.stringify(player.progress.bossBattleRewards) === beforeRewards, '重复打开不重复发奖');
ok(JSON.stringify(player.progress.bossAchievements) === beforeAch, '重复打开不重复解锁');
ok(d2.battleId === data.battleId && d2.reward.xp === data.reward.xp, '重复打开数据稳定');
ok(!player.progress.bossAchievements.rewardHistory.some(r => r.battleId === 'other'), '不混入其他战斗成就');
const wrong = M.buildBossSettlementData(player, 'battle@other');
ok(wrong === null, '未知 battleId 不生成结算');
const mismatch = clone(player);
mismatch.progress.bossBattleRatings.history[0].battleId = 'other-battle';
const mismatchData = M.buildBossSettlementData(mismatch, stats.battleId);
ok(mismatchData.rating === null, '评分 battleId 不一致不显示');

console.log('=== 3. 存档 v10 / 刷新 ===');
ok(Save.SAVE_VERSION === 10, '存档版本 v10');
const normalized = Save.normalizePlayerState(clone(player), 10);
ok(normalized.progress.bossBattleStats.history.length === 1, '迁移保留统计');
ok(normalized.progress.bossBattleRatings.history.length === 1, '迁移保留评分');
ok(normalized.progress.bossBattleRewards.history.length === 1, '迁移保留奖励');
ok(normalized.progress.bossAchievements.unlocked.length === player.progress.bossAchievements.unlocked.length, '迁移保留成就');
const afterRefresh = M.buildBossSettlementData(normalized, stats.battleId);
ok(afterRefresh.battleId === data.battleId, '刷新后结算 battleId 恢复');
ok(afterRefresh.reward.xp === data.reward.xp && afterRefresh.achievementCount === data.achievementCount, '刷新后奖励/成就一致');
ok(afterRefresh.rating.grade === data.rating.grade, '刷新后评分一致');
const old = clone(normalized);
delete old.progress.bossAchievements;
delete old.progress.bossBattleRewards;
delete old.progress.bossBattleRatings;
const oldNorm = Save.normalizePlayerState(old, 10);
const oldData = M.buildBossSettlementData(oldNorm, stats.battleId);
ok(oldData !== null && oldData.statsAvailable, '旧存档统计仍可展示');
ok(oldData.rating === null && oldData.reward.available === false, '旧存档缺评分/奖励安全显示 N/A');

console.log('=== 4. 失败 / 撤退 / 异常 ===');
const defeatStats = { ...stats, result: 'defeat', battleStatus: 'failed', endedAt: NOW + 20000, wallDurationMs: 20000 };
const defeatPlayer = clone(player);
defeatPlayer.progress.bossBattleStats = { active: null, history: [defeatStats] };
defeatPlayer.progress.bossBattleRatings = { history: [] };
defeatPlayer.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
defeatPlayer.progress.bossAchievements.unlocked = [];
const defeat = M.buildBossSettlementData(defeatPlayer, stats.battleId, { failureReason: '意识完整度归零' });
ok(defeat.outcome === 'defeat' && defeat.outcomeTitle === 'SYSTEM FAILURE', '失败结算');
ok(defeat.failureReason === '意识完整度归零', '失败原因');
ok(defeat.rating === null && defeat.reward.available === false && defeat.achievementCount === 0, '失败无评分/奖励/成就');
const retreatStats = { ...stats, result: 'retreat', battleStatus: 'abandoned', endedAt: NOW + 15000, wallDurationMs: 15000 };
const retreatPlayer = clone(defeatPlayer); retreatPlayer.progress.bossBattleStats = { active: null, history: [retreatStats] };
const retreat = M.buildBossSettlementData(retreatPlayer, stats.battleId);
ok(retreat.outcome === 'retreat' && retreat.outcomeTitle === 'MISSION ABORTED', '撤退结算');
ok(retreat.resultCode === 'RETREAT', '撤退不误判胜利');
const partialStats = { ...stats, dataQuality: 'partial' };
const partialPlayer = clone(player); partialPlayer.progress.bossBattleStats = { active: null, history: [partialStats] };
ok(M.buildBossSettlementData(partialPlayer, stats.battleId).dataQuality === 'partial', 'partial 兼容');
const invalidStats = { ...stats, dataQuality: 'invalid' };
const invalidPlayer = clone(player); invalidPlayer.progress.bossBattleStats = { active: null, history: [invalidStats] };
ok(M.buildBossSettlementData(invalidPlayer, stats.battleId).dataQuality === 'invalid', 'invalid 兼容');
const noStatsPlayer = clone(player); noStatsPlayer.progress.bossBattleStats = { active: null, history: [] };
const noStats = M.buildBossSettlementData(noStatsPlayer, stats.battleId);
ok(noStats && !noStats.statsAvailable && noStats.dataQuality === 'invalid', '缺失统计安全展示');
ok(noStats.source.statsBattleId === null, '缺失统计 source 为空');

console.log('=== 5. 展示细节 ===');
ok(data.metrics.combat.find(m => m.key === 'damageDealt').available, '造成伤害可用');
ok(data.achievements.some(a => a.name === '零死亡者'), '结算包含零死亡成就');
ok(data.achievements.some(a => a.evidence.includes('判题') || a.evidence.includes('弱点')), '成就解释可读');
ok(data.rating.reasons.length > 0 && data.rating.highlights.length >= 0, '评分依据/亮点');
ok(data.reward.fragmentStatus === '已归位' || data.reward.fragmentStatus.includes('已拥有'), '碎片状态明确');
ok(M.formatSettlementDuration(data.durationMs) !== 'N/A', '时长可读');
ok(data.metrics.challenge.every(m => typeof m.display === 'string'), '统计显示字符串');
ok(data.phaseRows.every(p => p.label.startsWith('阶段')), '阶段标签');
ok(data.strengths.every(s => typeof s === 'string' && s.length > 0), '总结为非空文本');
ok(data.improvements.every(s => typeof s === 'string' && s.length > 0), '改进为非空文本');
ok(data.source.achievementIds.every(id => data.achievements.some(a => a.achievementId === id)), 'source 成就与展示一致');
ok(data.reward.grantedAt === grantedReward.grantedAt, '奖励到账时间与 B.5.3 一致');
ok(data.rating.finalized === true && data.rating.dataQuality === 'complete', '正式评分状态一致');
ok(data.outcome === 'victory' && data.resultCode === 'VICTORY', '胜利结果码');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
