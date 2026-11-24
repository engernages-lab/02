// V1.3-B.5.6 归档引擎专项测试（记录 / 累计 / 查询 / 趋势 / 统计 / 存档）
// 执行：node test/boss_battle_archive.test.mjs
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
const A = L('src/game/bossBattleArchive.ts');
const Save = L('src/services/save.ts');
const C = L('src/game/bossAchievementConfig.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const BASE = 1_700_000_000_000;
const bossIds = ['gate-01', 'somnia', 'index-0'];
const diffs = ['easy', 'hard', 'expert'];
const results = ['victory', 'defeat', 'retreat'];
const grades = ['S', 'A', 'B', 'C', 'D'];

function record(i, over = {}) {
  const result = over.result || results[i % results.length];
  const grade = over.grade === undefined ? (result === 'victory' ? grades[i % grades.length] : null) : over.grade;
  const ended = BASE + i * 100000;
  const duration = over.duration ?? (60000 + (i % 5) * 10000);
  return {
    battleId: over.battleId || 'battle-arch-' + i,
    bossId: over.bossId !== undefined ? over.bossId : bossIds[i % bossIds.length],
    bossName: bossIds[i % bossIds.length] + ' · Boss',
    bossCodename: bossIds[i % bossIds.length].toUpperCase(),
    difficulty: diffs[i % diffs.length],
    difficultyLabel: diffs[i % diffs.length].toUpperCase(),
    result,
    startedAt: ended - duration,
    endedAt: ended,
    archivedAt: ended + 500,
    durationMs: duration,
    finalPhase: 3, phaseTotal: 3, consciousness: result === 'defeat' ? 0 : 60,
    deaths: result === 'defeat' ? 1 : 0,
    failureReason: result === 'defeat' ? '意识完整度归零' : result === 'retreat' ? '玩家主动撤退' : '',
    fragmentTitle: '初始指令', fragmentStatus: result === 'victory' ? '已归位' : '未发放',
    fragmentGranted: result === 'victory' && i === 0,
    firstClear: i === 0,
    dataQuality: over.dataQuality || 'complete',
    stats: {
      challenge: { submitted: 6, judged: 5, passed: 4, failed: 1, invalid: 1, streak: 3 },
      combat: { warning: 5, hit: 1, blocked: 2, dodged: 2, cancelled: 1, interrupted: 1, damageTaken: 12, damageDealt: 120 },
      weakness: { discovered: 2, uniqueDiscovered: 2, cracked: 2, exposed: 1, damage: 18 },
      dynamic: { triggered: 1, success: 1, failed: 0, successRate: 100 },
      phases: { transitions: 2, completed: 3, maxPhase: 3, minConsciousness: 18 },
      deaths: result === 'defeat' ? 1 : 0,
      phaseRows: [{ phaseId: 'p1', label: '阶段 1', durationMs: 1000, damageTaken: 1, attackCount: 1, challengeSuccess: 1, challengeFailed: 0, weaknessDiscoveries: 1, weaknessCracks: 1, endState: 'completed' }],
    },
    rating: grade ? {
      grade, displayScore: grade === 'S' ? 96 : grade === 'A' ? 85 : grade === 'B' ? 75 : grade === 'C' ? 65 : 50,
      totalScore: 80, finalized: (over.dataQuality || 'complete') === 'complete', dataQuality: over.dataQuality || 'complete', ratingVersion: 'v1.0.0',
      dimensions: [{ key: 'survival', label: '生存表现', score: 20, maxScore: 25, weight: 25, effectiveWeight: 0.25, availability: 'available', available: true, reason: 'ok' }],
      reasons: ['真实评分依据'], highlights: ['亮点'], weaknesses: ['不足'],
    } : null,
    reward: {
      available: result === 'victory', granted: result === 'victory',
      xp: result === 'victory' ? 75 : null, contribution: result === 'victory' ? 52 : null,
      credits: result === 'victory' ? 52 : null, fragments: 0, baseXp: 150, difficultyXp: 0,
      performanceXp: 45, specialXp: 30, fullXp: 225, legacyXp: 150,
      rewardId: 'boss-reward:' + (over.battleId || 'battle-arch-' + i) + ':v1.0.0',
      grantedAt: result === 'victory' ? ended + 1000 : null,
      fragmentTitle: '初始指令', fragmentStatus: result === 'victory' ? '已归位' : '未发放',
    },
    achievements: result === 'victory' ? [{ achievementId: 'boss_no_death', name: '零死亡者', description: '未死亡', category: 'survival', level: 'Bronze', hidden: false, icon: '✦', reward: { xp: 30, contribution: 15, fragments: 0 }, unlockedAt: ended, evidence: '真实证据' }] : [],
    strengths: ['亮点'], improvements: ['改进'],
    timeline: [{ offsetMs: 0, label: '战斗开始', kind: 'battle-started' }, { offsetMs: 60000, label: 'Boss 阶段转换', kind: 'phase-transition' }],
    archiveVersion: 'v1.0.0',
  };
}
const empty = A.emptyBossBattleArchiveStore();
let store = empty;
for (let i = 0; i < 4; i++) store = A.recordBossBattleArchive(store, record(i)).store;

console.log('=== 1. 记录 / 幂等 ===');
ok(store.records.length === 4, '4 场正式归档');
ok(store.archivedBattleIds.length === 4, 'battleId 幂等表');
ok(store.totals.totalBattles === 4, '总场次');
ok(store.totals.victories === 2 && store.totals.defeats === 1 && store.totals.retreats === 1, '胜负撤退统计');
ok(store.totals.ratingCount === 2 && store.totals.gradeCounts.S === 1 && store.totals.gradeCounts.C === 1, '评分/等级分布');
ok(store.totals.bestScore === 96 && store.totals.bestGrade === 'S', '最佳评分/等级');
ok(store.totals.totalXP === 150 && store.totals.totalContribution === 104, '累计 XP/贡献');
ok(store.totals.totalFragments === 1, '累计首胜碎片（不重复）');
ok(store.totals.totalDuration === store.records.reduce((s, r) => s + (r.durationMs || 0), 0), '累计时长');
ok(store.totals.currentWinStreak === 1 && store.totals.bestWinStreak === 1, '当前/最佳连胜');
ok(store.totals.fastestVictory === Math.min(...store.records.filter(r => r.result === 'victory').map(r => r.durationMs)), '最快胜利');
ok(store.totals.longestBattle === Math.max(...store.records.map(r => r.durationMs)), '最长战斗');
const dup = A.recordBossBattleArchive(store, record(0));
ok(!dup.added && dup.reason === 'duplicate' && dup.store.totals.totalBattles === 4, '重复 battleId 不重复累计');
ok(store.bossTotals['gate-01']?.attempts === 2 && store.bossTotals['gate-01']?.victories === 2, 'Boss 专属统计');
ok(store.difficultyTotals.easy?.attempts === 2, '难度统计');
ok(store.records.every(r => r.archiveVersion === 'v1.0.0'), '归档版本');
for (const r of store.records) {
  ok(r.battleId.startsWith('battle-arch-'), '记录 battleId：' + r.battleId);
  ok(!!r.bossId && !!r.bossName, '记录 Boss 信息：' + r.battleId);
  ok(['victory', 'defeat', 'retreat'].includes(r.result), '记录结果合法：' + r.battleId);
  ok(r.startedAt != null && r.endedAt != null && r.durationMs != null, '记录时间/时长：' + r.battleId);
  ok(!!r.timeline && r.timeline.length > 0, '记录时间线：' + r.battleId);
  ok(!!r.stats && !!r.stats.challenge, '记录统计结构：' + r.battleId);
}
ok(store.records[0].stats.combat.warning === 5 && store.records[0].stats.combat.hit === 1, '攻防字段');
ok(store.records[0].stats.combat.blocked === 2 && store.records[0].stats.combat.dodged === 2, '防御/闪避字段');
ok(store.records[0].stats.weakness.uniqueDiscovered === 2 && store.records[0].stats.weakness.damage === 18, '弱点字段');
ok(store.records[0].stats.dynamic.successRate === 100 && store.records[0].stats.phases.transitions === 2, '动态/阶段字段');
ok(store.records[0].rating.reasons.length === 1 && store.records[0].rating.dimensions.length === 1, '评分快照');
ok(store.records[0].reward.baseXp === 150 && store.records[0].reward.fullXp === 225, '奖励快照');
ok(store.records[0].achievements.length === 1 && store.records[0].achievements[0].evidence === '真实证据', '成就快照');
ok(store.records[0].firstClear === true && store.records[0].fragmentGranted === true, '首胜/碎片标记');
ok(store.records[1].result === 'defeat' && store.records[1].rating === null, '失败记录无评分');
ok(store.records[2].result === 'retreat' && store.records[2].rating === null, '撤退记录无评分');
ok(store.bossTotals['gate-01'].bestScore === 96 && store.bossTotals['gate-01'].firstVictoryDifficulty === 'easy', 'Boss 最佳/首胜难度');
ok(A.RETREAT_RESETS_WIN_STREAK === true, '撤退重置连胜策略明确');

console.log('=== 2. 查询 / 筛选 / 排序 / 搜索 ===');
const qAll = A.queryBossBattleArchive(store, {});
ok(qAll.total === 4 && qAll.records[0].battleId === 'battle-arch-3', '默认最新排序');
ok(A.queryBossBattleArchive(store, { result: 'defeat' }).total === 1, '结果筛选');
ok(A.queryBossBattleArchive(store, { bossId: 'gate-01' }).total === 2, 'Boss 筛选');
ok(A.queryBossBattleArchive(store, { difficulty: 'hard' }).total === 1, '难度筛选');
ok(A.queryBossBattleArchive(store, { grade: 'S' }).total === 1, '评级筛选');
ok(A.queryBossBattleArchive(store, { grade: 'unrated' }).total === 2, '无评级筛选');
ok(A.queryBossBattleArchive(store, { achievement: 'unlocked' }).total === 2, '成就筛选');
ok(A.queryBossBattleArchive(store, { search: 'GATE' }).total === 2, 'Boss 名称/ID 搜索');
ok(A.queryBossBattleArchive(store, { search: 'battle-arch-2' }).total === 1, 'battleId 搜索');
ok(A.queryBossBattleArchive(store, { sort: 'oldest' }).records[0].battleId === 'battle-arch-0', '最早排序');
ok(A.queryBossBattleArchive(store, { sort: 'best' }).records[0].rating?.grade === 'S', '最高评分排序');
ok(A.queryBossBattleArchive(store, { sort: 'worst' }).records[3].rating == null, '最低评分排序将无评分置后');
ok(A.queryBossBattleArchive(store, { sort: 'fastest' }).records[0].durationMs === Math.min(...store.records.map(r => r.durationMs)), '最快通关排序');
ok(A.queryBossBattleArchive(store, { sort: 'longest' }).records[0].durationMs === Math.max(...store.records.map(r => r.durationMs)), '最长战斗排序');
const p1 = A.queryBossBattleArchive(store, { page: 1, pageSize: 2 });
const p2 = A.queryBossBattleArchive(store, { page: 2, pageSize: 2 });
ok(p1.records.length === 2 && p2.records.length === 2 && p1.records[0].battleId !== p2.records[0].battleId && p1.pages === 2, '分页稳定');
ok(A.queryBossBattleArchive(store, { search: '不存在' }).total === 0, '无结果安全');
ok(A.queryBossBattleArchive(store, { grade: 'C' }).total === 1 && A.queryBossBattleArchive(store, { grade: 'D' }).total === 0, '评级精确过滤');
ok(A.queryBossBattleArchive(store, { achievement: 'none' }).total === 2, '无成就过滤');
ok(A.queryBossBattleArchive(store, { result: 'victory', grade: 'S' }).total === 1, '组合过滤');
ok(A.queryBossBattleArchive(store, { page: 99, pageSize: 2 }).page === 2, '越界页安全夹取');
ok(A.queryBossBattleArchive(store, { pageSize: 2 }).pages === 2, '页数计算');
ok(A.queryBossBattleArchive(store, { search: 'somnia' }).total >= 1, 'Boss 名称搜索');
ok(A.queryBossBattleArchive(store, { sort: 'newest' }).records[0].endedAt >= A.queryBossBattleArchive(store, { sort: 'newest' }).records[1].endedAt, '最新排序稳定');

console.log('=== 3. 趋势 / 统计 ===');
const player = Save.defaultState();
player.progress.bossAchievements.unlocked = [{ achievementId: 'boss_no_death', unlockedAt: BASE, battleId: 'battle-arch-3', bossId: 'gate-01', difficulty: 'easy', rewardId: 'x', rewardGranted: true, rewardGrantedAt: BASE, evidence: {} }];
const analytics = A.buildArchiveAnalytics(store, player);
ok(Math.abs(analytics.winRate - (2 / 3)) < 0.001, '胜率 = victory/(victory+defeat)');
ok(Math.abs((analytics.averageScore || 0) - 80.5) < 0.001, '平均评分只计完整正式评分');
ok(analytics.bestScore === 96 && analytics.bestGrade === 'S', '最佳分统计');
ok(analytics.ratingTrend.length === 2 && analytics.ratingTrend[1].score === 65, '评分趋势');
ok(analytics.gradeCounts.S === 1 && analytics.gradeCounts.B === 0, '等级分布');
ok(analytics.unratedBattles === 2, '无评分场次');
ok(analytics.recentWinRates.length === 3 && analytics.recentWinRates[0].key === 'all', '胜率趋势多窗口');
ok(analytics.bosses.length >= 2 && analytics.bosses[0].attempts >= 1, 'Boss 对比');
ok(analytics.difficulties.length >= 2, '难度对比');
ok(analytics.achievements.unlocked === 1 && analytics.achievements.total >= 15, '成就统计');
ok(analytics.achievements.recent[0].achievementId === 'boss_no_death', '最近解锁成就');
ok(analytics.fastestVictory === store.totals.fastestVictory && analytics.bestWinStreak === 1, '战斗记录统计');
ok(A.buildAchievementHistory(player, {}).length === 1, '成就历史');
ok(A.buildAchievementHistory(player, { level: 'Bronze' }).length === 1, '成就等级筛选');
ok(A.buildAchievementHistory(player, { level: 'Gold' }).length === 0, '成就等级过滤');
ok(A.buildAchievementHistory(player, { bossId: 'gate-01' }).length >= 1, '成就 Boss 筛选');
ok(analytics.recentWinRates[1].key === '10' && analytics.recentWinRates[2].key === '5', '胜率窗口 5/10/全部');
ok(analytics.bosses.every(b => b.attempts >= 1 && b.bestScore == null || typeof b.bestScore === 'number'), 'Boss 对比字段安全');
ok(analytics.difficulties.every(d => d.label), '难度标签完整');
ok(analytics.achievements.rate > 0 && analytics.achievements.rate <= 1, '成就解锁率范围');
ok(analytics.totalDuration === store.totals.totalDuration, '总时长统计');
ok(analytics.currentWinStreak === store.totals.currentWinStreak, '当前连胜一致');
ok(analytics.longestBattle === store.totals.longestBattle, '最长战斗一致');
ok(A.buildAchievementHistory(player, { sort: 'oldest' }).length === 1, '成就最早排序');

console.log('=== 4. 存档 / 自愈 / 上限 ===');
const norm = A.normalizeBossBattleArchiveStore(clone(store));
ok(norm.records.length === 4 && norm.totals.totalBattles === 4, 'normalize 保留记录/累计');
ok(norm.archivedBattleIds.length === 4, 'normalize 幂等表');
const bad = clone(store);
bad.records.push(null, { battleId: '' }, { battleId: 'dup', bossId: 'gate-01' });
bad.records.push(clone(bad.records[0]));
bad.archivedBattleIds.push('', 'x', 'x');
bad.totals.totalBattles = 'bad';
const healed = A.normalizeBossBattleArchiveStore(bad);
ok(healed.records.length === 5 && healed.totals.totalBattles === 5, '损坏累计按可用记录修复');
ok(healed.totals.gradeCounts.S >= 0 && healed.totals.gradeCounts.D >= 0, '等级计数安全');
const oldSave = clone(norm);
delete oldSave.records;
delete oldSave.totals;
delete oldSave.archivedBattleIds;
delete oldSave.bossTotals;
delete oldSave.difficultyTotals;
const oldNorm = A.normalizeBossBattleArchiveStore(oldSave);
ok(oldNorm.records.length === 0 && oldNorm.totals.totalBattles === 0, '旧存档补空归档');
ok(oldNorm.archivedBattleIds.length === 0 && oldNorm.bossTotals && oldNorm.difficultyTotals && Object.keys(oldNorm.bossTotals).length === 0, '旧存档补空幂等表/统计映射');
ok(norm.records.every(r => r.battleId && r.bossId && r.archivedAt >= 0), 'normalize 记录字段完整');
ok(norm.totals.gradeCounts.S === 1 && norm.totals.bestGrade === 'S', 'normalize 等级统计');
let many = A.emptyBossBattleArchiveStore();
for (let i = 0; i < 205; i++) many = A.recordBossBattleArchive(many, record(i, { battleId: 'overflow-' + i })).store;
ok(many.records.length === 200, '记录上限 200');
ok(many.archivedBattleIds.length === 205, '幂等 ID 表 500 内保留 205');
ok(many.totals.totalBattles === 205, '历史裁剪不减少累计');
const preserved = A.normalizeBossBattleArchiveStore({ ...many, totals: { ...many.totals, totalBattles: 999 } });
ok(preserved.totals.totalBattles === 999, '累计统计独立于裁剪历史');
const partial = record(99, { battleId: 'partial-1', dataQuality: 'partial', grade: 'S' });
const partialStore = A.recordBossBattleArchive(A.emptyBossBattleArchiveStore(), partial).store;
ok(partialStore.totals.ratingCount === 0, 'partial 评分不进入平均/累计评分');
const invalidStore = A.normalizeBossBattleArchiveStore({ records: [record(0, { battleId: 'bad-1', bossId: '' })], archivedBattleIds: [], totals: {}, bossTotals: {}, difficultyTotals: {} });
ok(invalidStore.records.length === 0, '非法 bossId 记录丢弃');

console.log('=== 5. 历史详情 / 导出 ===');
const detail = A.archiveRecordToSettlementData(store.records[0]);
ok(detail.battleId === store.records[0].battleId && detail.historical !== false, '历史详情绑定 battleId');
ok(detail.rating?.grade === store.records[0].rating?.grade, '历史详情评分一致');
ok(detail.reward.xp === store.records[0].reward.xp, '历史详情奖励一致');
ok(detail.achievements.length === store.records[0].achievements.length, '历史详情成就一致');
ok(detail.timeline.length === 2 && detail.timeline[0].label === '战斗开始', '历史详情时间线');
ok(detail.phaseRows.length === 1, '历史详情阶段');
const exportJson = A.archiveExportJson(store.records[0]);
ok(JSON.parse(exportJson).battleId === store.records[0].battleId, '单场导出 JSON');
const statsJson = JSON.parse(A.archiveStatsExportJson(store, player));
ok(statsJson.totals.totalBattles === 4 && statsJson.achievements.length === 1, '总统计/成就导出');
ok(!JSON.stringify(statsJson).includes('password') && !JSON.stringify(statsJson).includes('token'), '导出不含私密字段');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
