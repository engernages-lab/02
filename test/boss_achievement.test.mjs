// V1.3-B.5.4 隐藏成就专项测试（配置 / 判定 / 隐藏 / 进度 / 奖励 / 幂等）
// 执行：node test/boss_achievement.test.mjs
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
const A = L('src/game/bossAchievementEngine.ts');
const C = L('src/game/bossAchievementConfig.ts');
const Store = L('src/game/bossAchievementStore.ts');
const Save = L('src/services/save.ts');
const Prog = L('src/game/progression.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 700000;

function statsBase(overrides = {}) {
  let s = S.createBossBattleStats({
    battleId: 'battle-ach-1', bossId: 'gate-01', bossName: 'GATE-01', difficulty: 'easy',
    startedAt: 1000, phaseId: 'gate-01-bp1', phaseIndex: 0, consciousness: 100,
  });
  s = {
    ...s,
    result: 'victory', battleStatus: 'completed', endedAt: 101000, wallDurationMs: 100000,
    finalized: true, finalizedAt: 101000, dataQuality: 'complete', minConsciousness: 10,
    challengeStats: {
      ...s.challengeStats, submittedCount: 5, judgedCount: 5, passedCount: 5, failedCount: 0,
      runtimeErrorCount: 0, invalidCount: 0, consecutiveSuccess: 5, maxConsecutiveSuccess: 5,
      failureReasons: {}, successRate: 1, keyCrackSuccess: true,
    },
    attackStats: {
      ...s.attackStats, telegraphCount: 4, startedCount: 4, hitCount: 0, blockedCount: 2,
      cancelledCount: 0, interruptedByWeaknessCount: 1, interruptedByCrisisCount: 0,
      damageTaken: 0, shieldAbsorbed: 0,
    },
    defenseStats: { defenseSuccessCount: 3, defenseFailedCount: 0, dodgeSuccessCount: 3, dodgeFailedCount: 0 },
    weaknessStats: {
      ...s.weaknessStats, clueCount: 2, discoveredIds: ['gate-01-w1', 'gate-01-w2'],
      crackedIds: ['gate-01-w1', 'gate-01-w2'], discoveredCount: 2, analysisCount: 2,
      crackSubmittedCount: 2, crackSuccessCount: 2, crackFailedCount: 0, exposedCount: 2,
      exposureMsTotal: 6000, bossHpDamage: 20, cancelledCount: 0,
    },
    dynamicEventStats: {
      ...s.dynamicEventStats, triggeredCount: 1, byDef: { 'unknown-intrusion': 1 },
      successByDef: { 'unknown-intrusion': 1 }, successCount: 1, failedCount: 0,
      playerCompletedCount: 1, timeoutCount: 0, cancelledByPriorityCount: 0,
      clearedByBattleEndCount: 0, attackInterruptedCount: 0, playerDamageTaken: 0, durationMsTotal: 3000,
    },
    playerDeathCount: 0,
  };
  return { ...s, ...overrides };
}
const perfectStats = statsBase();
const perfectRating = R.calculateBossBattleRating(perfectStats, NOW);
function evaluate(stats, over = {}) {
  return A.evaluateBossAchievements({
    stats, rating: perfectRating, bossId: 'gate-01', difficulty: 'easy', battleResult: 'victory', now: NOW, ...over,
  });
}
const all = evaluate(perfectStats);
const allIds = all.newlyUnlocked.map(x => x.achievementId);

console.log('=== 1. 配置完整性 / 全解锁 ===');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.length >= 15, '成就库至少 15 个', String(C.BOSS_ACHIEVEMENT_DEFINITIONS.length));
ok(new Set(C.BOSS_ACHIEVEMENT_DEFINITIONS.map(d => d.id)).size === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, 'achievementId 唯一');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.every(d => d.reward.xp >= 0 && d.reward.contribution >= 0 && d.reward.fragments >= 0), '奖励非负');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.every(d => d.reward.fragments === 0), '成就不重复发放创世主碎片');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.every(d => C.BOSS_ACHIEVEMENT_CATEGORY_LABEL[d.category]), '分类合法');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.every(d => C.BOSS_ACHIEVEMENT_LEVEL_LABEL[d.level]), '等级合法');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.filter(d => d.hidden).length >= 4, '包含多个隐藏成就');
ok(all.formalEligible === true && all.dataQuality === 'complete', '完美正式战斗可判定');
ok(all.newlyUnlocked.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, '完美战斗解锁全部成就');
for (const id of ['boss_perfect_defense', 'boss_last_stand', 'boss_no_death', 'boss_clutch_survivor', 'boss_code_master', 'boss_perfect_streak', 'boss_first_try', 'boss_dodge_master', 'boss_defense_master', 'boss_counter_master', 'boss_weakness_hunter', 'boss_weakness_master', 'boss_weakness_exploit', 'boss_crisis_responder', 'boss_intrusion_destroyer', 'boss_rating_s']) {
  ok(allIds.includes(id), '成就可触发：' + id);
}
ok(all.newlyUnlocked.every(x => x.evidence && x.evidence.battleId === perfectStats.battleId), '每个解锁带真实证据');
ok(all.newlyUnlocked.every(x => x.reward.fragments === 0), '每个成就奖励碎片为 0');
ok(all.newlyUnlocked.every(x => A.bossAchievementRewardId(x.achievementId).startsWith('boss-achievement-reward:')), '成就奖励 ID 格式稳定');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.some(d => d.category === 'survival') && C.BOSS_ACHIEVEMENT_DEFINITIONS.some(d => d.category === 'challenge'), '生存/挑战分类均存在');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.some(d => d.level === 'Platinum'), '存在铂金成就');
ok(C.BOSS_ACHIEVEMENT_DEFINITIONS.every(d => d.conditions.length > 0), '每个成就都有条件');

console.log('=== 2. 单成就条件 ===');
const noDamage = (over) => evaluate(statsBase(over));
ok(!noDamage({ attackStats: { ...perfectStats.attackStats, damageTaken: 1 } }).newlyUnlocked.some(x => x.achievementId === 'boss_perfect_defense'), '受到伤害不触发完美防线');
ok(noDamage({ playerDeathCount: 1 }).newlyUnlocked.some(x => x.achievementId === 'boss_no_death') === false, '死亡不触发零死亡');
ok(noDamage({ playerDeathCount: 1 }).newlyUnlocked.some(x => x.achievementId === 'boss_perfect_defense') === false, '死亡也不触发完美防线');
ok(noDamage({ minConsciousness: 15, defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 0, dodgeSuccessCount: 1, dodgeFailedCount: 0 } }).newlyUnlocked.some(x => x.achievementId === 'boss_clutch_survivor'), '极限意识+闪避触发极限生还');
ok(noDamage({ minConsciousness: 20 }).newlyUnlocked.some(x => x.achievementId === 'boss_last_stand'), '意识 20 阈值触发最后一线生机');
ok(!noDamage({ minConsciousness: 21 }).newlyUnlocked.some(x => x.achievementId === 'boss_last_stand'), '意识 21 不触发最后一线生机');
ok(!noDamage({ minConsciousness: null }).newlyUnlocked.some(x => x.achievementId === 'boss_last_stand'), '缺少意识历史不伪造成就');
ok(noDamage({ minConsciousness: 10, defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 0, dodgeSuccessCount: 0, dodgeFailedCount: 0 } }).newlyUnlocked.some(x => x.achievementId === 'boss_clutch_survivor') === false, '极限生还需要真实防御/闪避');
ok(noDamage({ challengeStats: { ...perfectStats.challengeStats, passedCount: 4, failedCount: 1, maxConsecutiveSuccess: 4 } }).newlyUnlocked.some(x => x.achievementId === 'boss_code_master') === false, '失败提交不触发代码大师');
ok(noDamage({ challengeStats: { ...perfectStats.challengeStats, invalidCount: 1 } }).newlyUnlocked.some(x => x.achievementId === 'boss_code_master') === false, '无效提交不触发代码大师');
ok(noDamage({ challengeStats: { ...perfectStats.challengeStats, maxConsecutiveSuccess: 4 } }).newlyUnlocked.some(x => x.achievementId === 'boss_perfect_streak') === false, '连续 4 次不触发连续修复者');
ok(noDamage({ challengeStats: { ...perfectStats.challengeStats, judgedCount: 2, passedCount: 2, maxConsecutiveSuccess: 2 } }).newlyUnlocked.some(x => x.achievementId === 'boss_first_try') === false, '判题不足 3 次不触发一次通过');
ok(noDamage({ defenseStats: { ...perfectStats.defenseStats, dodgeSuccessCount: 2 } }).newlyUnlocked.some(x => x.achievementId === 'boss_dodge_master') === false, '闪避 2 次不触发无伤战术家');
ok(noDamage({ defenseStats: { ...perfectStats.defenseStats, defenseSuccessCount: 2 } }).newlyUnlocked.some(x => x.achievementId === 'boss_defense_master') === false, '防御 2 次不触发绝对防御');
ok(noDamage({ attackStats: { ...perfectStats.attackStats, interruptedByWeaknessCount: 0, interruptedByCrisisCount: 2 } }).newlyUnlocked.some(x => x.achievementId === 'boss_counter_master') === false, '危机中断不冒充弱点打断');
ok(noDamage({ weaknessStats: { ...perfectStats.weaknessStats, discoveredIds: [], discoveredCount: 0 } }).newlyUnlocked.some(x => x.achievementId === 'boss_weakness_hunter') === false, '未发现弱点不触发弱点猎人');
ok(noDamage({ weaknessStats: { ...perfectStats.weaknessStats, crackedIds: ['gate-01-w1'], crackSuccessCount: 2 } }).newlyUnlocked.some(x => x.achievementId === 'boss_weakness_master') === false, '同一弱点重复破解不触发弱点专家');
ok(noDamage({ weaknessStats: { ...perfectStats.weaknessStats, bossHpDamage: 0 } }).newlyUnlocked.some(x => x.achievementId === 'boss_weakness_exploit') === false, '暴露但无真实伤害不触发致命破绽');
ok(noDamage({ dynamicEventStats: { ...perfectStats.dynamicEventStats, successCount: 0, failedCount: 1, successByDef: {} } }).newlyUnlocked.some(x => x.achievementId === 'boss_crisis_responder') === false, '动态事件失败不触发危机解除');
ok(noDamage({ dynamicEventStats: { ...perfectStats.dynamicEventStats, successCount: 0, timeoutCount: 1, successByDef: {} } }).newlyUnlocked.some(x => x.achievementId === 'boss_crisis_responder') === false, '超时不触发危机解除');
ok(noDamage({ dynamicEventStats: { ...perfectStats.dynamicEventStats, successCount: 0, failedCount: 0, cancelledByPriorityCount: 1, successByDef: {} } }).newlyUnlocked.some(x => x.achievementId === 'boss_crisis_responder') === false, '系统取消不触发危机解除');
ok(noDamage({ dynamicEventStats: { ...perfectStats.dynamicEventStats, successByDef: { 'other-event': 1 } } }).newlyUnlocked.some(x => x.achievementId === 'boss_intrusion_destroyer') === false, '非未知入侵不触发入侵终结者');
const aRating = clone(perfectRating); aRating.grade = 'A'; aRating.displayScore = 85; aRating.totalScore = 85;
ok(!evaluate(perfectStats, { rating: aRating }).newlyUnlocked.some(x => x.achievementId === 'boss_rating_s'), 'A 级不触发卓越执行');
ok(!evaluate(perfectStats, { rating: null }).newlyUnlocked.some(x => x.achievementId === 'boss_rating_s'), '缺失评分不触发卓越执行');

console.log('=== 3. 数据完整性 / 结果 / 机制不可用 ===');
for (const [label, stats, reason] of [
  ['partial', statsBase({ dataQuality: 'partial' }), 'partial-stats'],
  ['invalid', statsBase({ dataQuality: 'invalid' }), 'invalid-stats'],
  ['active', statsBase({ result: null, battleStatus: 'active', finalized: false, endedAt: null }), 'not-victory'],
  ['defeat', statsBase({ result: 'defeat', battleStatus: 'failed' }), 'not-victory'],
  ['retreat', statsBase({ result: 'retreat', battleStatus: 'abandoned' }), 'not-victory'],
]) {
  const x = evaluate(stats, { battleResult: stats.result });
  ok(!x.formalEligible && x.newlyUnlocked.length === 0, label + ' 不产生正式成就');
  ok(x.rejectedAchievements.length > 0 && x.rejectionReason === reason, label + ' 明确拒绝原因', x.rejectionReason);
}
const missing = A.evaluateBossAchievements({ stats: null, now: NOW });
ok(!missing.formalEligible && missing.dataQuality === 'invalid', '缺失统计不产生成就');
const noWeakBoss = evaluate(statsBase({ bossId: 'boss-without-weakness' }), { bossId: 'boss-without-weakness' });
ok(noWeakBoss.rejectedAchievements.some(x => x.achievementId === 'boss_weakness_hunter' && x.reason === 'mechanic-unavailable'), '无弱点机制标记 mechanicUnavailable');
const noDynamic = evaluate(statsBase({ dynamicEventStats: { ...perfectStats.dynamicEventStats, triggeredCount: 0, successCount: 0, byDef: {}, successByDef: {} } }));
ok(noDynamic.rejectedAchievements.some(x => x.achievementId === 'boss_crisis_responder' && x.reason === 'mechanic-unavailable'), '无动态事件标记 mechanicUnavailable');
const noAttacks = evaluate(statsBase({ attackStats: { ...perfectStats.attackStats, startedCount: 0, interruptedByWeaknessCount: 0 }, defenseStats: { defenseSuccessCount: 0, defenseFailedCount: 0, dodgeSuccessCount: 0, dodgeFailedCount: 0 } }));
ok(noAttacks.rejectedAchievements.some(x => x.achievementId === 'boss_dodge_master' && x.reason === 'mechanic-unavailable'), '无攻击机制不把战术成就判为失败');

console.log('=== 4. 进度 / 证据 / 确定性 ===');
const pStreak = all.progressUpdates.find(x => x.achievementId === 'boss_perfect_streak');
const pDodge = all.progressUpdates.find(x => x.achievementId === 'boss_dodge_master');
const pWeak = all.progressUpdates.find(x => x.achievementId === 'boss_weakness_master');
ok(pStreak?.progress === 5 && pStreak.target === 5 && pStreak.completed, '连续成功进度 5/5');
ok(pDodge?.progress === 3 && pDodge.target === 3 && pDodge.completed, '闪避进度 3/3');
ok(pWeak?.progress === 2 && pWeak.target === 2 && pWeak.completed, '唯一弱点进度 2/2');
const partialProgress = evaluate(statsBase({ challengeStats: { ...perfectStats.challengeStats, maxConsecutiveSuccess: 2, passedCount: 4, failedCount: 1 } }));
const pStreak2 = partialProgress.progressUpdates.find(x => x.achievementId === 'boss_perfect_streak');
ok(pStreak2?.progress === 2 && pStreak2.completed === false, '未完成进度保留 2/5');
ok(all.newlyUnlocked[0].evidence.challengeJudged === 5 && all.newlyUnlocked[0].evidence.minConsciousness === 10, '证据保存真实统计值');
const before = JSON.stringify(perfectStats);
evaluate(perfectStats);
ok(JSON.stringify(perfectStats) === before, '判定不修改输入统计');
const e1 = evaluate(perfectStats);
const e2 = evaluate(perfectStats);
ok(e1.newlyUnlocked.map(x => x.achievementId).join('|') === e2.newlyUnlocked.map(x => x.achievementId).join('|'), '相同输入判定稳定');
const already = evaluate(perfectStats, { unlockedIds: ['boss_no_death', 'boss_code_master'] });
ok(!already.newlyUnlocked.some(x => ['boss_no_death', 'boss_code_master'].includes(x.achievementId)), '已解锁成就不重复给出');
ok(already.newlyUnlocked.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length - 2, '已解锁只过滤对应成就');

console.log('=== 5. 隐藏机制 ===');
const views = A.publicBossAchievementViews({ unlocked: [], progress: [] }, false);
const hiddenView = views.find(v => v.id === 'boss_perfect_defense');
ok(hiddenView.hidden === true && hiddenView.unlocked === false && hiddenView.name === null && hiddenView.reward === null, '隐藏成就未解锁时不泄漏名称/奖励/条件');
ok(views.find(v => v.id === 'boss_no_death')?.name === '零死亡者', '非隐藏成就正常展示');
const unlockedViews = A.publicBossAchievementViews({ unlocked: [{ achievementId: 'boss_perfect_defense', unlockedAt: 1 }], progress: [] }, false);
ok(unlockedViews.find(v => v.id === 'boss_perfect_defense')?.name === '完美防线', '隐藏成就解锁后展示');
const devViews = A.publicBossAchievementViews({ unlocked: [], progress: [] }, true);
ok(devViews.find(v => v.id === 'boss_perfect_defense')?.name === '完美防线', 'DEV 可查看隐藏成就');

console.log('=== 6. 奖励 / 解锁 / 幂等 ===');
const reward = A.calculateBossAchievementReward(all.newlyUnlocked);
ok(reward.xp > 0 && reward.contribution > 0 && reward.fragments === 0, '成就奖励纯计算非负且无碎片');
ok(reward.xp <= C.BOSS_ACHIEVEMENT_REWARD_CAPS.totalXp && reward.contribution <= C.BOSS_ACHIEVEMENT_REWARD_CAPS.totalContribution, '成就奖励不超上限');
const player = Save.defaultState();
player.exp = 0; player.level = 1; player.rewards.credits = 0;
player.progress.bossAchievements = Store.emptyBossAchievementStore();
const applied = Store.evaluateAndApplyBossAchievements(player, all, NOW);
ok(applied.granted && applied.newlyUnlocked.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, '正式判定写入全部解锁');
ok(applied.player.progress.bossAchievements.unlocked.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, '解锁记录持久化');
ok(applied.player.progress.bossAchievements.rewardHistory.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, '奖励历史保存');
ok(applied.player.exp === reward.xp && applied.player.rewards.credits === reward.contribution, 'XP/贡献点与成就奖励一致');
ok(applied.player.meta.memoryFragments.length === player.meta.memoryFragments.length, '成就不重复发放碎片');
ok(applied.player.progress.bossAchievements.eventDeduplication.includes('achievement-eval:' + perfectStats.battleId), '战斗评测事件去重');
ok(applied.player.rewards.ledger.some(e => e.ref.startsWith('achievement:')), '成就奖励写入现有账本');
const applied2 = Store.evaluateAndApplyBossAchievements(applied.player, all, NOW + 1);
ok(!applied2.granted && applied2.player.exp === applied.player.exp && applied2.player.progress.bossAchievements.rewardHistory.length === applied.player.progress.bossAchievements.rewardHistory.length, '重复评测/发放不重复奖励');
const different = evaluate(statsBase({ battleId: 'battle-ach-2' }), { unlockedIds: applied.player.progress.bossAchievements.unlocked.map(u => u.achievementId) });
ok(different.newlyUnlocked.length === 0, '另一场战斗的已解锁成就不重复解锁');

const levelPlayer = Save.defaultState();
levelPlayer.exp = Prog.LEVEL_XP[1] - 5; levelPlayer.level = 1; levelPlayer.rewards.credits = 0;
levelPlayer.progress.bossAchievements = Store.emptyBossAchievementStore();
const levelApplied = Store.evaluateAndApplyBossAchievements(levelPlayer, all, NOW);
ok(levelApplied.granted && levelApplied.player.level > levelPlayer.level, '成就 XP 正常触发升级');

console.log('=== 7. 存档自愈 / 历史上限 ===');
const normalized = Save.normalizePlayerState(clone(applied.player), 10);
ok(normalized.progress.bossAchievements.unlocked.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, '存档 v10 保留成就解锁');
ok(normalized.progress.bossAchievements.rewardHistory.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, '存档保留奖励历史');
ok(normalized.progress.bossAchievements.progress.length > 0, '存档保留进度');
const old = clone(normalized);
delete old.progress.bossAchievements;
ok(Save.normalizePlayerState(old, 10).progress.bossAchievements.unlocked.length === 0, '旧存档自动补空成就');
const corrupt = clone(normalized);
corrupt.progress.bossAchievements.unlocked = [
  null,
  { achievementId: 'bad-id' },
  { achievementId: 'boss_no_death', unlockedAt: 'bad', evidence: {} },
  clone(normalized.progress.bossAchievements.unlocked[0]),
  clone(normalized.progress.bossAchievements.unlocked[0]),
];
corrupt.progress.bossAchievements.rewardHistory = [null, { rewardId: 'x', achievementId: 'bad' }, clone(normalized.progress.bossAchievements.rewardHistory[0]), clone(normalized.progress.bossAchievements.rewardHistory[0])];
corrupt.progress.bossAchievements.eventDeduplication = ['', 'a', 'a', 3];
const healed = Store.normalizeBossAchievementStore(corrupt.progress.bossAchievements);
ok(healed.unlocked.length === 2, '损坏成就数据安全自愈/去重', String(healed.unlocked.length));
ok(healed.unlocked.every(u => !!C.BOSS_ACHIEVEMENT_MAP[u.achievementId]), '非法成就 ID 被丢弃');
ok(healed.rewardHistory.length === 1, '重复/非法奖励历史被清理');
ok(healed.eventDeduplication.length === 1, '事件去重列表自愈');
ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');
const duplicateReward = { ...normalized.progress.bossAchievements.rewardHistory[0], grantedAt: 999999 };
ok(Store.normalizeBossAchievementStore({ ...normalized.progress.bossAchievements, rewardHistory: [duplicateReward, duplicateReward] }).rewardHistory.length === 1, 'rewardId 去重');
ok(Store.normalizeBossAchievementStore({ unlocked: [{ achievementId: 'boss_no_death', unlockedAt: -5, battleId: '', bossId: '', difficulty: '', rewardId: '', rewardGranted: true, rewardGrantedAt: -1, evidence: {} }], progress: [], rewardHistory: [], eventDeduplication: [] }).unlocked[0].unlockedAt === 0, '非法解锁时间安全归零');
ok(Store.normalizeBossAchievementStore({ unlocked: [], progress: [{ achievementId: 'boss_dodge_master', progress: -9, target: 0, completed: true, updatedAt: -1, battleId: null }], rewardHistory: [], eventDeduplication: [] }).progress[0].target === 1, '非法进度 target 夹取为 1');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
