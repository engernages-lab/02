// V1.3-B.5.3 奖励集成测试：真实 B.5.1 快照 + B.5.2 评分 + 经济发放 + 存档 v10
// 执行：node test/boss_battle_reward_integration.test.mjs
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
const Cfg = L('src/game/bossBattleRewardConfig.ts');
const Save = L('src/services/save.ts');
const Prog = L('src/game/progression.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 600000;

function realFinalSnapshot(result = 'victory') {
  let s = S.createBossBattleStats({
    battleId: 'battle@reward-integration', bossId: 'gate-01', bossName: 'GATE-01 · 数据港守卫',
    difficulty: 'easy', startedAt: NOW, phaseId: 'gate-01-bp1', phaseIndex: 0,
  });
  const rec = (id, type, payload = {}, at = NOW + 10) => {
    s = S.recordBossBattleEvent(s, { eventId: id, eventType: type, phaseId: 'gate-01-bp1', source: 'integration', payload, occurredAt: at }, at).state;
  };
  rec('start', 'battle-started', {}, NOW + 1);
  for (let i = 0; i < 4; i++) {
    const result = i === 2 ? 'hit' : i === 3 ? 'dodged' : 'blocked';
    const response = i === 2 ? 'none' : i === 3 ? 'dodge' : 'defend';
    rec('t' + i, 'attack-telegraph', { attackType: 'single' }, NOW + 1000 + i * 2000);
    rec('s' + i, 'attack-started', { attackId: 'a' + i }, NOW + 2000 + i * 2000);
    rec('r' + i, 'attack-result', { result, response, attackId: 'a' + i }, NOW + 3000 + i * 2000);
  }
  rec('dmg', 'damage-taken', { amount: 10, shieldAbsorbed: 0 }, NOW + 9001);
  for (let i = 0; i < 5; i++) rec('c' + i, 'challenge-result', { outcome: 'passed', phaseCleared: i === 2 }, NOW + 10000 + i * 1000);
  rec('w1', 'weakness-discovered', { weaknessId: 'gate-01-w1' }, NOW + 16000);
  rec('w2', 'weakness-crack-result', { outcome: 'success', weaknessId: 'gate-01-w1' }, NOW + 17000);
  rec('w3', 'weakness-exposed', { weaknessId: 'gate-01-w1' }, NOW + 18000);
  rec('w4', 'weakness-boss-damage', { amount: 15, weaknessId: 'gate-01-w1' }, NOW + 19000);
  rec('w5', 'weakness-recovered', { weaknessId: 'gate-01-w1', durationMs: 3000 }, NOW + 21000);
  rec('e1', 'dynamic-triggered', { defId: 'unknown_intrusion', instanceId: 'intr-1' }, NOW + 22000);
  rec('e2', 'dynamic-success', { instanceId: 'intr-1', durationMs: 4000 }, NOW + 26000);
  return S.finalizeBossBattleStats(s, result, NOW + 30000).state;
}

const stats = realFinalSnapshot();
const rating = R.calculateBossBattleRating(stats, NOW + 31000);
const offset = W.bossLegacyRewardOffset('gate-01', 'easy');
const reward = W.calculateBossBattleRewards({
  stats, rating, bossId: 'gate-01', difficulty: 'easy', battleResult: 'victory',
  firstDifficultyReward: true, legacyGranted: offset, now: NOW + 32000,
});
console.log('=== 1. 真实统计 + 正式评分 → 奖励 ===');
ok(reward.eligible === true && reward.rejectionReason === null, '正式胜利奖励资格通过');
ok(reward.battleId === stats.battleId && reward.bossId === stats.bossId, '奖励绑定真实 battleId/bossId');
ok(reward.ratingId === rating.ratingId && reward.ratingGrade === rating.grade, '奖励引用 B.5.2 正式评分');
ok(reward.rewardVersion === Cfg.BOSS_REWARD_VERSION, '记录奖励版本');
ok(reward.baseReward.xp === 150 && reward.baseReward.contribution === 120, '基础奖励来自现有经济');
ok(reward.difficultyBonus.xp === 0 && reward.difficultyBonus.contribution === 0, 'EASY 难度无额外基础加成');
ok(reward.performanceBonus.xp > 0 && reward.performanceBonus.contribution > 0, '评分倍率产生真实表现加成');
ok(reward.specialBonus.xp === 55 && reward.specialBonus.contribution === 30, '真实表现奖励四项齐全');
ok(reward.finalReward.xp > reward.baseReward.xp && reward.grantedReward.xp < reward.finalReward.xp, '完整奖励与既有偏移分离');
ok(reward.grantedReward.fragments === 0, '正式奖励不重复增加创世主碎片');
ok(reward.dataQuality === 'complete' && reward.ratingUnavailable === false, '完整统计+正式评分奖励数据完整');
ok(reward.rewardId === 'boss-reward:' + stats.battleId + ':v1.0.0', 'rewardId 稳定');

console.log('=== 2. 经济发放 / 等级 / 账本 ===');
const player = Save.defaultState();
player.exp = 0; player.level = 1; player.rewards.credits = 0;
player.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
const beforeFrag = player.meta.memoryFragments.length;
const g1 = Grant.applyBossBattleRewardGrant(player, reward, player.progress.bossBattleRewards, NOW + 33000);
ok(g1.added === true, '胜利奖励成功发放');
ok(g1.player.exp === reward.grantedReward.xp, 'XP 增量与奖励记录一致');
ok(g1.player.rewards.credits === reward.grantedReward.contribution, '贡献点增量与奖励记录一致');
ok(g1.player.meta.memoryFragments.length === beforeFrag, '不重复发放碎片');
ok(g1.player.rewards.ledger.some(e => e.kind === 'boss' && e.ref.includes(':performance:')), '写入现有奖励账本');
ok(g1.player.progress.bossBattleRewards.history.length === 1, '奖励历史写入');
ok(g1.player.progress.bossBattleRewards.totalGranted.xp === reward.grantedReward.xp, '累计奖励写入');
const g2 = Grant.applyBossBattleRewardGrant(g1.player, reward, g1.player.progress.bossBattleRewards, NOW + 34000);
ok(!g2.added && g2.player.exp === g1.player.exp && g2.player.rewards.credits === g1.player.rewards.credits, '重复发放不重复增加经济');
ok(g2.player.progress.bossBattleRewards.history.length === 1, '重复发放不增加历史');

const levelPlayer = Save.defaultState();
levelPlayer.exp = Prog.LEVEL_XP[1] - 5; levelPlayer.level = 1; levelPlayer.rewards.credits = 0;
levelPlayer.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
const gl = Grant.applyBossBattleRewardGrant(levelPlayer, reward, levelPlayer.progress.bossBattleRewards, NOW + 35000);
ok(gl.added && gl.player.level > levelPlayer.level && gl.player.exp === levelPlayer.exp + reward.grantedReward.xp, '奖励 XP 正常触发升级');

console.log('=== 3. 缺失评分 / 临时 / invalid ===');
const noRating = W.calculateBossBattleRewards({ stats, rating: null, bossId: 'gate-01', difficulty: 'easy', legacyGranted: offset, now: NOW + 36000 });
ok(noRating.ratingUnavailable === true && noRating.performanceBonus.xp === 0, '缺失评分不发评分奖励');
ok(noRating.eligible === true && noRating.dataQuality === 'partial', '缺失评分仍可基础奖励但不完整');
ok(noRating.ratingGrade === null && noRating.ratingScore === null, '缺失评分不按 D 级处理');
const tempRating = clone(rating); tempRating.finalized = false;
const invalidRating = clone(rating); invalidRating.dataQuality = 'invalid';
for (const [label, r] of [['临时评分', tempRating], ['invalid 评分', invalidRating]]) {
  const x = W.calculateBossBattleRewards({ stats, rating: r, bossId: 'gate-01', difficulty: 'easy', legacyGranted: offset, now: NOW });
  ok(x.ratingUnavailable === true && x.performanceBonus.xp === 0, label + ' 不产生正式评分奖励');
}
const partialRating = clone(rating); partialRating.dataQuality = 'partial'; partialRating.finalized = false;
ok(W.calculateBossBattleRewards({ stats, rating: partialRating, bossId: 'gate-01', difficulty: 'easy', now: NOW }).ratingUnavailable === true, 'partial 评分视为不可用');
const partialStats = clone(stats); partialStats.dataQuality = 'partial';
const partialReward = W.calculateBossBattleRewards({ stats: partialStats, rating, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(partialReward.eligible === true && partialReward.dataQuality === 'partial', 'partial 统计奖励标记不完整');

console.log('=== 4. 失败 / 撤退 / 未终结 / invalid ===');
const defeatStats = realFinalSnapshot('defeat');
const defeatRating = R.calculateBossBattleRating(defeatStats, NOW + 37000);
const defeatReward = W.calculateBossBattleRewards({ stats: defeatStats, rating: defeatRating, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!defeatReward.eligible && defeatReward.rejectionReason === 'not-victory', '真实失败不发放奖励');
const retreatStats = realFinalSnapshot('retreat');
const retreatReward = W.calculateBossBattleRewards({ stats: retreatStats, rating: null, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!retreatReward.eligible, '真实撤退不发放奖励');
const activeStats = clone(stats); activeStats.finalized = false; activeStats.result = null; activeStats.endedAt = null;
const activeReward = W.calculateBossBattleRewards({ stats: activeStats, rating: null, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!activeReward.eligible, '进行中战斗不发放奖励');
const invalidStats = clone(stats); invalidStats.dataQuality = 'invalid';
const invalidReward = W.calculateBossBattleRewards({ stats: invalidStats, rating, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(!invalidReward.eligible && invalidReward.rejectionReason === 'invalid-stats', 'invalid 统计不发放奖励');
ok(!Grant.applyBossBattleRewardGrant(player, invalidReward, player.progress.bossBattleRewards, NOW).added, '无效奖励不进入发放');
ok(!W.calculateBossBattleRewards({ stats: null, rating: null, bossId: 'gate-01', difficulty: 'easy', now: NOW }).eligible, '缺失统计不发放奖励');

console.log('=== 5. 难度 / 偏移 / 反刷取 ===');
const hardOffset = W.bossLegacyRewardOffset('gate-01', 'hard');
const hardReward = W.calculateBossBattleRewards({ stats: { ...stats, difficulty: 'hard' }, rating, bossId: 'gate-01', difficulty: 'hard', legacyGranted: hardOffset, now: NOW });
ok(hardReward.difficultyBonus.xp === 60 && hardReward.difficultyBonus.contribution === 60, 'HARD 难度加成符合现有经济');
ok(hardReward.grantedReward.xp > reward.grantedReward.xp, '高难度评分增量更高');
const repeated = W.calculateBossBattleRewards({ stats, rating, bossId: 'gate-01', difficulty: 'easy', firstDifficultyReward: false, now: NOW });
ok(!repeated.eligible && repeated.rejectionReason === 'difficulty-already-rewarded', '同难度重复通关不参与奖励');
const mismatch = clone(rating); mismatch.battleId = 'other-battle';
ok(W.calculateBossBattleRewards({ stats, rating: mismatch, bossId: 'gate-01', difficulty: 'easy', now: NOW }).ratingUnavailable === true, '评分 battleId 不匹配不使用评分奖励');

console.log('=== 6. 存档 v10 / 自愈 ===');
ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');
const savePlayer = Save.defaultState();
savePlayer.progress.bossBattleStats = { active: null, history: [stats] };
savePlayer.progress.bossBattleRatings = { history: [rating] };
savePlayer.progress.bossBattleRewards = g1.player.progress.bossBattleRewards;
const rewardsBefore = JSON.stringify(savePlayer.rewards);
const normalized = Save.normalizePlayerState(clone(savePlayer), 10);
ok(normalized.progress.bossBattleStats.history.length === 1, '迁移保留 B.5.1 统计');
ok(normalized.progress.bossBattleRatings.history.length === 1, '迁移保留 B.5.2 评分');
ok(normalized.progress.bossBattleRewards.history.length === 1, '迁移保留 B.5.3 奖励');
ok(JSON.stringify(normalized.rewards) === rewardsBefore, '迁移不改变现有奖励/货币');
ok(normalized.progress.bossBattleRewards.history[0].battleId === stats.battleId, '奖励 battleId 保持');
ok(normalized.progress.bossBattleRewards.totalGranted.xp === reward.grantedReward.xp, '累计奖励保持');

const oldSave = clone(normalized);
delete oldSave.progress.bossBattleRewards;
const oldNorm = Save.normalizePlayerState(oldSave, 10);
ok(oldNorm.progress.bossBattleRewards.history.length === 0 && oldNorm.progress.bossBattleRewards.totalGranted.xp === 0, '旧存档自动补空奖励');
const corrupt = clone(normalized);
corrupt.progress.bossBattleRewards.history = [null, { battleId: 'bad' }, clone(normalized.progress.bossBattleRewards.history[0]), clone(normalized.progress.bossBattleRewards.history[0])];
corrupt.progress.bossBattleRewards.grantedBattleIds = ['', 'x', 'x'];
corrupt.progress.bossBattleRewards.totalGranted = { xp: -5, contribution: 'bad', fragments: 2.9 };
const healed = Save.normalizePlayerState(corrupt, 10);
ok(healed.progress.bossBattleRewards.history.length === 1, '损坏奖励历史安全自愈');
ok(healed.progress.bossBattleRewards.totalGranted.xp === 0 && healed.progress.bossBattleRewards.totalGranted.fragments === 2, '损坏累计数值安全');
ok(healed.progress.bossBattleStats.history.length === 1 && healed.progress.bossBattleRatings.history.length === 1, '奖励自愈不破坏统计/评分');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
