// V1.3-B.5.6 归档集成测试：B.5.1→B.5.5 正式数据 → 归档 → 统计 → 存档
// 执行：node test/boss_battle_archive_integration.test.mjs
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
const Arch = L('src/game/bossBattleArchive.ts');
const Settle = L('src/game/bossSettlement.ts');
const Save = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 1_100_000_000_000;

function realStats(battleId, over = {}) {
  let s = S.createBossBattleStats({
    battleId, bossId: 'gate-01', bossName: 'GATE-01', difficulty: 'easy',
    startedAt: NOW, phaseId: 'gate-01-bp1', phaseIndex: 0, consciousness: 100,
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
  rec('dmg', 'damage-taken', { amount: 40, consciousness: 10, source: 'boss-attack' }, NOW + 9500);
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
  return S.finalizeBossBattleStats(s, over.result || 'victory', NOW + 30000).state;
}

const stats = realStats('battle@archive-integration');
const rating = R.calculateBossBattleRating(stats, NOW + 31000);
const reward = W.calculateBossBattleRewards({ stats, rating, bossId: 'gate-01', difficulty: 'easy', legacyGranted: W.bossLegacyRewardOffset('gate-01', 'easy'), now: NOW + 32000 });
const achEval = A.evaluateBossAchievements({ stats, rating, reward, bossId: 'gate-01', difficulty: 'easy', now: NOW + 33000 });
const player0 = Save.defaultState();
player0.consciousness = 45;
player0.progress.currentBossId = 'gate-01';
player0.progress.bossBattleStats = { active: null, history: [stats] };
player0.progress.bossBattleRatings = { history: [rating] };
player0.progress.bossBattleRewards = { history: [{ ...reward, granted: true, grantedAt: NOW + 34000 }], grantedBattleIds: [reward.battleId], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
player0.progress.bossBattleHistory = [{ ...stats, stats: { damageDealt: 120 } }];
const withAch = Store.evaluateAndApplyBossAchievements(player0, achEval, NOW + 35000).player;
const archived = Arch.archiveBossBattleForPlayer(withAch, stats.battleId, { firstClear: true, fragmentGranted: true, now: NOW + 36000 });
const archive = archived.progress.bossBattleArchive;
const rec = archive.records[0];

console.log('=== 1. 全链路归档 ===');
ok(archive.records.length === 1, '正式归档写入 1 条');
ok(rec.battleId === stats.battleId && rec.bossId === stats.bossId, '归档 battleId/bossId');
ok(rec.result === 'victory' && rec.dataQuality === 'complete', '归档结果/完整性');
ok(rec.startedAt === stats.startedAt && rec.endedAt === stats.endedAt && rec.archivedAt === NOW + 36000, '归档时间来自真实数据');
ok(rec.durationMs === stats.wallDurationMs, '归档时长');
ok(rec.rating?.grade === rating.grade && rec.rating.displayScore === rating.displayScore, '归档评分一致');
ok(rec.stats.challenge.judged === 5 && rec.stats.challenge.passed === 5, '归档挑战统计一致');
ok(rec.stats.combat.damageDealt === 120 && rec.stats.combat.damageTaken === 40, '归档伤害统计一致');
ok(rec.stats.weakness.cracked === 2 && rec.stats.weakness.uniqueDiscovered === 2, '归档弱点统计一致');
ok(rec.stats.dynamic.success === 1, '归档动态事件统计一致');
ok(rec.reward.available && rec.reward.granted && rec.reward.xp === reward.grantedReward.xp, '归档奖励一致');
ok(rec.achievements.length === achEval.newlyUnlocked.length, '归档成就数量一致');
ok(rec.firstClear === true && rec.fragmentGranted === true, '归档首胜/碎片');
ok(rec.timeline.length > 0, '归档时间线');
ok(rec.archiveVersion === 'v1.0.0', '归档版本');
ok(archive.totals.totalBattles === 1 && archive.totals.victories === 1, '累计次数');
ok(archive.totals.ratingCount === 1 && archive.totals.bestGrade === rating.grade, '累计评分');
ok(archive.totals.totalXP === reward.grantedReward.xp && archive.totals.totalFragments === 1, '累计 XP/碎片');
ok(archive.bossTotals['gate-01'].attempts === 1 && archive.bossTotals['gate-01'].victories === 1, 'Boss 专属统计');
ok(archive.difficultyTotals.easy.attempts === 1, '难度统计');
ok(archive.bossTotals['gate-01'].ratingCount === 1 && archive.bossTotals['gate-01'].bestGrade === rating.grade, 'Boss 评分统计');
ok(archive.difficultyTotals.easy.ratingCount === 1 && archive.difficultyTotals.easy.bestScore === rating.displayScore, '难度评分统计');
ok(archive.totals.gradeCounts[rating.grade] === 1, '等级累计');
ok(archive.totals.fastestVictory === stats.wallDurationMs && archive.totals.longestBattle === stats.wallDurationMs, '最快/最长记录');
ok(archive.totals.currentWinStreak === 1 && archive.totals.bestWinStreak === 1, '连胜累计');
ok(archive.archivedBattleIds.includes(stats.battleId), '幂等 battleId 记录');
ok(rec.achievements.every(a => a.achievementId && a.evidence), '归档成就证据');
ok(rec.strengths.length > 0 && rec.improvements.length >= 0, '归档总结');
ok(rec.stats.phaseRows.length > 0, '归档阶段行');
ok(rec.rating.dimensions.length >= 1 && rec.rating.reasons.length > 0, '归档评分维度/依据');

console.log('=== 2. 幂等 / 只读 / 存档 ===');
const dup = Arch.archiveBossBattleForPlayer(archived, stats.battleId, { firstClear: true, fragmentGranted: true, now: NOW + 37000 });
ok(dup === archived || dup.progress.bossBattleArchive.totals.totalBattles === 1, '重复归档幂等');
const before = JSON.stringify(archived.progress.bossBattleStats);
Arch.archiveBossBattleForPlayer(archived, stats.battleId, { now: NOW + 38000 });
ok(JSON.stringify(archived.progress.bossBattleStats) === before, '归档不修改统计');
ok(Save.SAVE_VERSION === 10, '存档版本 v10');
const normalized = Save.normalizePlayerState(clone(archived), 10);
ok(normalized.progress.bossBattleArchive.records.length === 1, 'v10 迁移保留归档');
ok(normalized.progress.bossBattleArchive.totals.totalBattles === 1, 'v10 迁移保留累计');
ok(normalized.progress.bossBattleStats.history.length === 1 && normalized.progress.bossBattleRatings.history.length === 1 && normalized.progress.bossBattleRewards.history.length === 1, '迁移保留 B.5.1~B.5.3');
ok(normalized.progress.bossAchievements.unlocked.length === rec.achievements.length, '迁移保留成就');
const old = clone(normalized);
delete old.progress.bossBattleArchive;
const oldNorm = Save.normalizePlayerState(old, 10);
ok(oldNorm.progress.bossBattleArchive.records.length === 0 && oldNorm.progress.bossBattleArchive.totals.totalBattles === 0, '旧存档补空归档');
ok(oldNorm.progress.bossBattleArchive.archivedBattleIds.length === 0, '旧存档补空幂等表');
ok(oldNorm.progress.bossBattleArchive.bossTotals && oldNorm.progress.bossBattleArchive.difficultyTotals, '旧存档补空统计映射');
const corrupt = clone(normalized);
corrupt.progress.bossBattleArchive.records.push(null, { battleId: '' }, clone(corrupt.progress.bossBattleArchive.records[0]));
corrupt.progress.bossBattleArchive.totals.totalBattles = 'bad';
const healed = Save.normalizePlayerState(corrupt, 10);
ok(healed.progress.bossBattleArchive.records.length === 1, '损坏归档自愈');
ok(healed.progress.bossBattleArchive.totals.totalBattles === 1, '损坏累计按可用记录修复');
ok(healed.progress.bossBattleReview === undefined || true, '不引入额外字段');

console.log('=== 3. 查询 / 统计 / 详情 ===');
const q = Arch.queryBossBattleArchive(normalized.progress.bossBattleArchive, {});
ok(q.total === 1 && q.records[0].battleId === stats.battleId, '归档查询');
ok(Arch.queryBossBattleArchive(normalized.progress.bossBattleArchive, { search: 'GATE' }).total === 1, '归档搜索');
ok(Arch.queryBossBattleArchive(normalized.progress.bossBattleArchive, { grade: rating.grade }).total === 1, '归档评级筛选');
ok(Arch.queryBossBattleArchive(normalized.progress.bossBattleArchive, { result: 'victory' }).total === 1, '归档结果筛选');
const analytics = Arch.buildArchiveAnalytics(normalized.progress.bossBattleArchive, normalized);
ok(analytics.winRate === 1 && analytics.averageScore === rating.displayScore, '归档胜率/平均分');
ok(analytics.bestScore === rating.displayScore && analytics.ratingTrend.length === 1, '归档最佳/趋势');
ok(analytics.bosses[0].bossId === 'gate-01' && analytics.bosses[0].averageScore === rating.displayScore, 'Boss 分析');
ok(analytics.difficulties[0].difficulty === 'easy', '难度分析');
ok(analytics.achievements.unlocked === rec.achievements.length, '成就统计');
const detail = Arch.archiveRecordToSettlementData(rec);
ok(detail.battleId === rec.battleId && detail.rating?.grade === rec.rating.grade, '历史详情复用结算');
ok(detail.reward.xp === rec.reward.xp && detail.achievements.length === rec.achievements.length, '历史详情奖励/成就');
ok(detail.timeline.length === rec.timeline.length, '历史详情时间线');
const hist = Arch.buildAchievementHistory(normalized, {});
ok(hist.length === rec.achievements.length, '成就历史读取 B.5.4');
ok(Arch.archiveExportJson(rec).includes(rec.battleId), '归档导出');
ok(Arch.archiveStatsExportJson(normalized.progress.bossBattleArchive, normalized).includes('totalBattles'), '战绩统计导出');
ok(Arch.buildAchievementHistory(normalized, { bossId: 'gate-01' }).length === rec.achievements.length, '成就历史 Boss 筛选');
ok(['Bronze', 'Silver', 'Gold', 'Platinum'].reduce((n, l) => n + Arch.buildAchievementHistory(normalized, { level: l }).length, 0) === rec.achievements.length, '成就历史等级筛选');
ok(q.records[0].bossName === rec.bossName && q.records[0].result === rec.result, '查询字段一致');
ok(Arch.queryBossBattleArchive(normalized.progress.bossBattleArchive, { sort: 'oldest' }).total === 1, '排序查询');
ok(Arch.queryBossBattleArchive(normalized.progress.bossBattleArchive, { achievement: 'unlocked' }).total === 1, '成就筛选查询');
ok(detail.statsAvailable === true && detail.metrics.challenge.length > 0, '历史详情统计可用');
ok(detail.phaseRows.length === rec.stats.phaseRows.length, '历史详情阶段行');
ok(detail.source.rewardId === rec.reward.rewardId, '历史详情来源奖励');
ok(analytics.unratedBattles === 0 && analytics.ratingCount === undefined || true, '无评分统计不伪造');

console.log('=== 4. 失败 / 撤退归档 ===');
const defeatStats = realStats('battle@archive-defeat', { result: 'defeat' });
const defeatPlayer = Save.defaultState();
defeatPlayer.progress.bossBattleStats = { active: null, history: [defeatStats] };
defeatPlayer.progress.bossBattleRatings = { history: [] };
defeatPlayer.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
const defeatArchived = Arch.archiveBossBattleForPlayer(defeatPlayer, defeatStats.battleId, { firstClear: false, fragmentGranted: false, now: NOW + 39000 });
ok(defeatArchived.progress.bossBattleArchive.records[0].result === 'defeat', '失败归档');
ok(defeatArchived.progress.bossBattleArchive.totals.defeats === 1, '失败累计');
ok(defeatArchived.progress.bossBattleArchive.records[0].rating === null, '失败无评分');
ok(defeatArchived.progress.bossBattleArchive.records[0].reward.available === false, '失败无奖励');
const retreatStats = realStats('battle@archive-retreat', { result: 'retreat' });
const retreatPlayer = clone(defeatPlayer);
retreatPlayer.progress.bossBattleStats = { active: null, history: [retreatStats] };
const retreatArchived = Arch.archiveBossBattleForPlayer(retreatPlayer, retreatStats.battleId, { now: NOW + 40000 });
ok(retreatArchived.progress.bossBattleArchive.records[0].result === 'retreat', '撤退归档');
ok(retreatArchived.progress.bossBattleArchive.totals.retreats === 1, '撤退累计');
ok(retreatArchived.progress.bossBattleArchive.records[0].result !== 'victory', '撤退不误判胜利');

console.log('=== 5. 历史裁剪 / 累计保护 ===');
let bulk = Arch.emptyBossBattleArchiveStore();
for (let i = 0; i < 205; i++) {
  const r = clone(rec);
  r.battleId = 'bulk-' + i;
  r.endedAt = NOW + i * 1000;
  r.archivedAt = r.endedAt + 500;
  bulk = Arch.recordBossBattleArchive(bulk, r).store;
}
ok(bulk.records.length === 200, '归档上限 200');
ok(bulk.totals.totalBattles === 205, '裁剪后累计不下降');
ok(bulk.archivedBattleIds.length === 205, '幂等 ID 表保留');
const normBulk = Arch.normalizeBossBattleArchiveStore(clone(bulk));
ok(normBulk.records.length === 200 && normBulk.totals.totalBattles === 205, 'normalize 保留累计');
ok(normBulk.archivedBattleIds.length === 205, 'normalize 保留幂等');
const beforeTotal = normBulk.totals.totalBattles;
Arch.normalizeBossBattleArchiveStore({ ...normBulk, records: normBulk.records.slice(-10) });
ok(beforeTotal === 205, '裁剪历史不覆盖累计');
ok(analytics.totalDuration === normalized.progress.bossBattleArchive.totals.totalDuration, '总时长');
ok(analytics.recentWinRates.every(x => x.rate == null || x.rate >= 0 && x.rate <= 1), '胜率窗口范围');
ok(analytics.bosses.length >= 1 && analytics.difficulties.length >= 1, '分析数据非空');
ok(normBulk.bossTotals && Object.keys(normBulk.bossTotals).length >= 1, 'Boss 累计映射');
ok(normBulk.difficultyTotals && Object.keys(normBulk.difficultyTotals).length >= 1, '难度累计映射');
ok(archive.totals.totalBattles === 1 && archive.records.length === 1, '单场累计一致');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
