// V1.3-B.5.4 成就集成测试：真实 B.5.1 统计 + B.5.2 评分 + B.5.3 奖励 + 存档 v10
// 执行：node test/boss_achievement_integration.test.mjs
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
const Grant = L('src/game/bossBattleRewardGrant.ts');
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
const NOW = 800000;

function realStats(opts = {}) {
  let s = S.createBossBattleStats({
    battleId: opts.battleId || 'battle@ach-integration', bossId: 'gate-01', bossName: 'GATE-01',
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
  rec('int', 'attack-interrupted', { reason: 'weakness-crack', attackId: 'a0' }, NOW + 9500);
  if (!opts.noDamage) rec('dmg', 'damage-taken', { amount: 40, consciousness: 10, source: 'boss-attack' }, NOW + 9000);
  for (let i = 0; i < 5; i++) rec('c' + i, 'challenge-result', { outcome: 'passed', phaseCleared: i === 2 }, NOW + 10000 + i * 1000);
  rec('w1', 'weakness-discovered', { weaknessId: 'gate-01-w1' }, NOW + 16000);
  rec('w2', 'weakness-discovered', { weaknessId: 'gate-01-w2' }, NOW + 16500);
  rec('w3', 'weakness-crack-result', { outcome: 'success', weaknessId: 'gate-01-w1' }, NOW + 17000);
  rec('w4', 'weakness-crack-result', { outcome: 'success', weaknessId: 'gate-01-w2' }, NOW + 17500);
  rec('w5', 'weakness-exposed', { weaknessId: 'gate-01-w1' }, NOW + 18000);
  rec('w6', 'weakness-boss-damage', { amount: 20, weaknessId: 'gate-01-w1' }, NOW + 19000);
  rec('w7', 'weakness-recovered', { weaknessId: 'gate-01-w1', durationMs: 3000 }, NOW + 21000);
  rec('e1', 'dynamic-triggered', { defId: 'unknown-intrusion', instanceId: 'intr-1' }, NOW + 22000);
  rec('e2', 'dynamic-success', { instanceId: 'intr-1', defId: 'unknown-intrusion', durationMs: 4000 }, NOW + 26000);
  const fin = S.finalizeBossBattleStats(s, 'victory', NOW + 30000).state;
  return fin;
}

const stats = realStats();
const rating = R.calculateBossBattleRating(stats, NOW + 31000);
const reward = W.calculateBossBattleRewards({ stats, rating, bossId: 'gate-01', difficulty: 'easy', legacyGranted: W.bossLegacyRewardOffset('gate-01', 'easy'), now: NOW + 32000 });
const eval1 = A.evaluateBossAchievements({ stats, rating, reward, bossId: 'gate-01', difficulty: 'easy', battleResult: 'victory', now: NOW + 33000 });
const ids = eval1.newlyUnlocked.map(x => x.achievementId);

console.log('=== 1. 真实统计 → 成就 ===');
ok(eval1.formalEligible && eval1.dataQuality === 'complete', '真实完整胜利可正式判定');
ok(stats.minConsciousness === 10, '最低意识来自真实伤害事件');
ok(stats.weaknessStats.discoveredIds.length === 2 && stats.weaknessStats.crackedIds.length === 2, '弱点唯一 ID 来自真实事件');
ok(stats.dynamicEventStats.successByDef['unknown-intrusion'] === 1, '动态事件成功按真实 defId 统计');
ok(ids.includes('boss_last_stand') && ids.includes('boss_clutch_survivor'), '低意识生存成就解锁');
ok(ids.includes('boss_weakness_hunter') && ids.includes('boss_weakness_master') && ids.includes('boss_weakness_exploit'), '弱点三成就解锁');
ok(ids.includes('boss_intrusion_destroyer') && ids.includes('boss_crisis_responder'), '危机/入侵成就解锁');
ok(ids.includes('boss_counter_master'), '真实弱点打断攻击成就解锁');
ok(ids.includes('boss_code_master') && ids.includes('boss_perfect_streak') && ids.includes('boss_first_try'), '挑战成就解锁');
ok(ids.includes('boss_no_death'), '零死亡成就解锁');
ok(!ids.includes('boss_perfect_defense'), '受到真实伤害不触发完美防线');
ok(eval1.progressUpdates.find(x => x.achievementId === 'boss_weakness_master')?.progress === 2, '弱点进度 2/2');
ok(eval1.newlyUnlocked.find(x => x.achievementId === 'boss_weakness_master')?.evidence.weaknessCracked === 2, '解锁证据保存真实破解数');
ok(eval1.newlyUnlocked.length >= 12, '真实战斗解锁大量成就', String(eval1.newlyUnlocked.length));
ok(eval1.progressUpdates.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, '所有适用成就产生进度');
ok(eval1.evaluated.length === C.BOSS_ACHIEVEMENT_DEFINITIONS.length, 'DEV 可读取全部判定项');
ok(eval1.newlyUnlocked.every(x => x.reward.fragments === 0), '真实解锁奖励不含碎片');

const noDamageStats = realStats({ battleId: 'battle@ach-perfect', noDamage: true });
const noDamageRating = R.calculateBossBattleRating(noDamageStats, NOW + 34000);
const noDamageEval = A.evaluateBossAchievements({ stats: noDamageStats, rating: noDamageRating, bossId: 'gate-01', difficulty: 'easy', now: NOW + 35000 });
ok(noDamageEval.newlyUnlocked.some(x => x.achievementId === 'boss_perfect_defense'), '真实无伤胜利触发完美防线');
ok(!noDamageEval.newlyUnlocked.some(x => x.achievementId === 'boss_last_stand'), '无伤高意识不触发最后一线生机');

console.log('=== 2. 评分 / 奖励联动 ===');
ok(eval1.newlyUnlocked.every(x => x.evidence.battleId === stats.battleId), '所有证据绑定 battleId');
ok(rating.battleId === stats.battleId && reward.battleId === stats.battleId, '评分/奖励/成就 battleId 对齐');
if (rating.grade === 'S') {
  ok(ids.includes('boss_rating_s'), '真实 S 评分触发卓越执行');
} else {
  ok(!ids.includes('boss_rating_s'), '非 S 评分不触发卓越执行');
  const sRating = clone(rating); sRating.grade = 'S'; sRating.displayScore = 95; sRating.totalScore = 95;
  const sEval = A.evaluateBossAchievements({ stats, rating: sRating, bossId: 'gate-01', difficulty: 'easy', now: NOW });
  ok(sEval.newlyUnlocked.some(x => x.achievementId === 'boss_rating_s'), '正式 S 评分对象触发卓越执行');
}
ok(new Set(ids).size === ids.length, '新解锁 ID 不重复');
ok(eval1.rejectedAchievements.every(x => !!x.reason), '拒绝成就均带原因');

console.log('=== 3. 解锁 / 奖励发放 ===');
const player = Save.defaultState();
player.exp = 0; player.level = 1; player.rewards.credits = 0;
player.progress.bossAchievements = Store.emptyBossAchievementStore();
const applied = Store.evaluateAndApplyBossAchievements(player, eval1, NOW + 36000);
const achReward = A.calculateBossAchievementReward(eval1.newlyUnlocked);
ok(applied.granted && applied.newlyUnlocked.length === ids.length, '正式解锁写入');
ok(applied.player.progress.bossAchievements.unlocked.length === ids.length, '解锁记录数量正确');
ok(applied.player.progress.bossAchievements.rewardHistory.length === ids.length, '奖励历史数量正确');
ok(applied.player.exp === achReward.xp && applied.player.rewards.credits === achReward.contribution, 'XP/贡献点与成就奖励一致');
ok(applied.player.meta.memoryFragments.length === player.meta.memoryFragments.length, '成就不发放碎片');
ok(applied.player.rewards.ledger.filter(e => e.ref.startsWith('achievement:')).length === ids.length, '每个成就写入账本');
ok(applied.player.progress.bossAchievements.progress.every(p => p.progress <= p.target), '进度不超过目标');
ok(applied.player.progress.bossAchievements.eventDeduplication.includes('achievement-eval:' + stats.battleId), '评测事件去重记录');
const appliedAgain = Store.evaluateAndApplyBossAchievements(applied.player, eval1, NOW + 37000);
ok(!appliedAgain.granted && appliedAgain.player.exp === applied.player.exp, '重复评测不重复发 XP');
ok(appliedAgain.player.progress.bossAchievements.rewardHistory.length === applied.player.progress.bossAchievements.rewardHistory.length, '重复评测不增加奖励历史');

const bossRewarded = Grant.applyBossBattleRewardGrant(player, reward, { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } }, NOW + 38000);
const combined = Store.evaluateAndApplyBossAchievements(bossRewarded.player, eval1, NOW + 39000);
ok(combined.player.exp === reward.grantedReward.xp + achReward.xp, 'Boss 奖励与成就奖励相加不重复基础');
ok(combined.player.rewards.ledger.some(e => e.ref.includes(':performance:')) && combined.player.rewards.ledger.some(e => e.ref.startsWith('achievement:')), '两类奖励账本独立');
ok(combined.player.progress.bossAchievements.unlocked.length === ids.length, 'Boss 奖励与成就解锁互不覆盖');
ok(combined.player.progress.bossAchievements.eventDeduplication.length === 1, '单场评测只保留一个去重事件');

console.log('=== 4. 资格 / 隐藏 ===');
const partialEval = A.evaluateBossAchievements({ stats: { ...stats, dataQuality: 'partial' }, rating, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!partialEval.formalEligible && partialEval.newlyUnlocked.length === 0, 'partial 统计不正式解锁');
const invalidEval = A.evaluateBossAchievements({ stats: { ...stats, dataQuality: 'invalid' }, rating, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!invalidEval.formalEligible && invalidEval.newlyUnlocked.length === 0, 'invalid 统计不正式解锁');
const defeatEval = A.evaluateBossAchievements({ stats: { ...stats, result: 'defeat', battleStatus: 'failed' }, rating, bossId: 'gate-01', difficulty: 'easy', battleResult: 'defeat', now: NOW });
ok(!defeatEval.formalEligible && defeatEval.rejectionReason === 'not-victory', '失败不正式解锁');
const activeEval = A.evaluateBossAchievements({ stats: { ...stats, result: null, finalized: false, endedAt: null }, rating: null, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!activeEval.formalEligible, '进行中不正式解锁');
const hiddenLocked = A.publicBossAchievementViews({ unlocked: [], progress: [] }, false).find(v => v.id === 'boss_perfect_defense');
ok(hiddenLocked.name === null && hiddenLocked.reward === null, '隐藏成就未解锁脱敏');
const hiddenUnlocked = A.publicBossAchievementViews({ unlocked: [{ achievementId: 'boss_perfect_defense', unlockedAt: 1 }], progress: [] }, false).find(v => v.id === 'boss_perfect_defense');
ok(hiddenUnlocked.name === '完美防线' && hiddenUnlocked.unlocked === true, '隐藏成就解锁后展示');
ok(A.publicBossAchievementViews({ unlocked: [], progress: [] }, true).find(v => v.id === 'boss_perfect_defense').name === '完美防线', 'DEV 可查看隐藏成就');
const noRatingEval = A.evaluateBossAchievements({ stats, rating: null, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!noRatingEval.newlyUnlocked.some(x => x.achievementId === 'boss_rating_s'), '缺失评分不触发评分成就');

console.log('=== 5. 存档 / 自愈 / 刷新 ===');
ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');
const savePlayer = clone(applied.player);
const normalized = Save.normalizePlayerState(savePlayer, 10);
ok(normalized.progress.bossAchievements.unlocked.length === ids.length, 'v10 迁移保留成就解锁');
ok(normalized.progress.bossAchievements.rewardHistory.length === ids.length, 'v10 迁移保留奖励历史');
ok(normalized.progress.bossAchievements.progress.length > 0, 'v10 迁移保留进度');
ok(normalized.progress.bossAchievements.unlocked.every(u => u.unlockedAt > 0 && u.battleId === stats.battleId), '解锁时间/battleId 保持');
ok(JSON.stringify(normalized.progress.bossBattleStats) === JSON.stringify(applied.player.progress.bossBattleStats), '成就不修改统计快照');
const old = clone(normalized);
delete old.progress.bossAchievements;
const oldNorm = Save.normalizePlayerState(old, 10);
ok(oldNorm.progress.bossAchievements.unlocked.length === 0 && oldNorm.progress.bossAchievements.progress.length === 0, '旧存档补空成就');
const corrupt = clone(normalized);
corrupt.progress.bossAchievements.unlocked = [null, { achievementId: 'bad' }, clone(normalized.progress.bossAchievements.unlocked[0]), clone(normalized.progress.bossAchievements.unlocked[0])];
corrupt.progress.bossAchievements.progress = [{ achievementId: 'boss_dodge_master', progress: 999, target: 3, completed: true, updatedAt: 1, battleId: 'x' }];
corrupt.progress.bossAchievements.rewardHistory = [null, { rewardId: 'bad', achievementId: 'bad' }];
corrupt.progress.bossAchievements.eventDeduplication = ['', 'a', 'a'];
const healed = Save.normalizePlayerState(corrupt, 10);
ok(healed.progress.bossAchievements.unlocked.length === 1, '损坏解锁记录去重');
ok(healed.progress.bossAchievements.progress[0].progress === 3, '进度夹取到目标');
ok(healed.progress.bossAchievements.rewardHistory.length === 0, '非法奖励历史清理');
ok(healed.progress.bossAchievements.eventDeduplication.length === 1, '事件去重自愈');

console.log('=== 6. 奖励 / 等级 ===');
const levelPlayer = Save.defaultState();
levelPlayer.exp = Prog.LEVEL_XP[1] - 5; levelPlayer.level = 1; levelPlayer.rewards.credits = 0;
levelPlayer.progress.bossAchievements = Store.emptyBossAchievementStore();
const levelApplied = Store.evaluateAndApplyBossAchievements(levelPlayer, eval1, NOW + 40000);
ok(levelApplied.player.level > levelPlayer.level, '成就 XP 触发升级');
ok(levelApplied.player.progress.bossAchievements.rewardHistory.every(r => r.fragments === 0), '奖励历史碎片为 0');
ok(levelApplied.player.progress.bossAchievements.unlocked.every(u => u.rewardGranted && u.rewardGrantedAt > 0), '解锁记录标记奖励已领取');
ok(levelApplied.player.progress.bossAchievements.unlocked.every(u => u.rewardId.startsWith('boss-achievement-reward:')), '奖励 ID 稳定');
const totalReward = A.calculateBossAchievementReward(eval1.newlyUnlocked);
ok(totalReward.xp <= C.BOSS_ACHIEVEMENT_REWARD_CAPS.totalXp, '奖励不超 XP 上限');
ok(totalReward.contribution <= C.BOSS_ACHIEVEMENT_REWARD_CAPS.totalContribution, '奖励不超贡献点上限');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
