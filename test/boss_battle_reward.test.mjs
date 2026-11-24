// V1.3-B.5.3 奖励算法专项测试（配置 / 资格 / 倍率 / 表现 / 幂等 / 发放）
// 执行：node test/boss_battle_reward.test.mjs
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
const Cfg = L('src/game/bossBattleRewardConfig.ts');
const Grant = L('src/game/bossBattleRewardGrant.ts');
const Save = L('src/services/save.ts');
const Prog = L('src/game/progression.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 900000;

function statsBase(overrides = {}) {
  let s = S.createBossBattleStats({
    battleId: 'battle-reward-1', bossId: 'gate-01', bossName: 'GATE-01 · 数据港守卫',
    difficulty: 'easy', startedAt: 1000, phaseId: 'gate-01-bp1', phaseIndex: 0,
  });
  s = {
    ...s,
    result: 'victory', battleStatus: 'completed', endedAt: 101000, wallDurationMs: 100000,
    finalized: true, finalizedAt: 101000, dataQuality: 'complete',
    challengeStats: {
      ...s.challengeStats, submittedCount: 5, judgedCount: 5, passedCount: 5, failedCount: 0,
      runtimeErrorCount: 0, invalidCount: 0, consecutiveSuccess: 5, maxConsecutiveSuccess: 5,
      failureReasons: {}, successRate: 1, keyCrackSuccess: true,
    },
    attackStats: {
      ...s.attackStats, telegraphCount: 4, startedCount: 3, hitCount: 0, blockedCount: 2,
      cancelledCount: 0, interruptedByWeaknessCount: 0, interruptedByCrisisCount: 0,
      damageTaken: 0, shieldAbsorbed: 0,
    },
    defenseStats: { defenseSuccessCount: 2, defenseFailedCount: 0, dodgeSuccessCount: 1, dodgeFailedCount: 0 },
    weaknessStats: {
      ...s.weaknessStats, clueCount: 2, discoveredCount: 1, analysisCount: 1, crackSubmittedCount: 1,
      crackSuccessCount: 1, crackFailedCount: 0, exposedCount: 1, exposureMsTotal: 3000,
      bossHpDamage: 12, cancelledCount: 0,
    },
    dynamicEventStats: {
      ...s.dynamicEventStats, triggeredCount: 1, byDef: { unknown_intrusion: 1 }, successCount: 1,
      failedCount: 0, playerCompletedCount: 1, timeoutCount: 0, cancelledByPriorityCount: 0,
      clearedByBattleEndCount: 0, attackInterruptedCount: 0, playerDamageTaken: 0, durationMsTotal: 3000,
    },
    playerDeathCount: 0,
  };
  return { ...s, ...overrides };
}
const perfectRating = R.calculateBossBattleRating(statsBase(), NOW);
function ratingWithGrade(grade) {
  const r = clone(perfectRating);
  r.grade = grade;
  return r;
}
function noSpecialStats(overrides = {}) {
  return statsBase({
    playerDeathCount: 1,
    challengeStats: { ...statsBase().challengeStats, judgedCount: 5, passedCount: 3, failedCount: 2, maxConsecutiveSuccess: 1, successRate: 0.6 },
    weaknessStats: { ...statsBase().weaknessStats, crackSuccessCount: 0, crackFailedCount: 1, exposedCount: 0, bossHpDamage: 0 },
    dynamicEventStats: { ...statsBase().dynamicEventStats, triggeredCount: 0, successCount: 0, playerCompletedCount: 0, byDef: {} },
    ...overrides,
  });
}
const calc = (over = {}) => W.calculateBossBattleRewards({
  stats: statsBase(), rating: perfectRating, bossId: 'gate-01', difficulty: 'easy',
  firstDifficultyReward: true, now: NOW, ...over,
});
const cfg = Cfg.BOSS_BATTLE_REWARD_CONFIG;

console.log('=== 1. 配置 / 基础 / 偏移 ===');
ok(cfg.version === Cfg.BOSS_REWARD_VERSION && cfg.version === 'v1.0.0', '奖励配置版本集中且有效');
ok(cfg.gradeMultipliers.S === 1.5 && cfg.gradeMultipliers.D === 0.8, 'S/D 表现倍率配置');
ok(cfg.difficultyMultipliers.hard.xp === 1.4 && cfg.difficultyMultipliers.expert.contribution === 2, '难度倍率与现有经济口径一致');
const baseGate = W.bossBaseVictoryRewards('gate-01');
ok(baseGate.xp === 150 && baseGate.contribution === 120 && baseGate.fragments === 1, 'GATE-01 基础奖励来自现有经济数据', JSON.stringify(baseGate));
const offEasy = W.bossLegacyRewardOffset('gate-01', 'easy');
const offHard = W.bossLegacyRewardOffset('gate-01', 'hard');
const offExpert = W.bossLegacyRewardOffset('gate-01', 'expert');
ok(offEasy.xp === 150 && offHard.xp === 210 && offExpert.xp === 255, '既有首胜+难度 XP 偏移正确');
ok(offEasy.contribution === 120 && offHard.contribution === 180 && offExpert.contribution === 240, '既有贡献点偏移正确');

console.log('=== 2. 等级倍率 / 计算顺序 / 舍入 ===');
const cRating = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: ratingWithGrade('C'), bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(cRating.baseReward.xp === 150 && cRating.baseReward.contribution === 120, '基础奖励为真实经济基础');
ok(cRating.difficultyBonus.xp === 0 && cRating.performanceBonus.xp === 0, 'C 级无额外难度/表现加成（easy）');
ok(cRating.finalReward.xp === 150 && cRating.grantedReward.xp === 0, 'C 级完整奖励已被既有发放覆盖，增量为 0');
const sRating = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: ratingWithGrade('S'), bossId: 'gate-01', difficulty: 'easy', now: NOW });
const aRating = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: ratingWithGrade('A'), bossId: 'gate-01', difficulty: 'easy', now: NOW });
const bRating = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: ratingWithGrade('B'), bossId: 'gate-01', difficulty: 'easy', now: NOW });
const dRating = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: ratingWithGrade('D'), bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(sRating.performanceBonus.xp === 75 && aRating.performanceBonus.xp === 45 && bRating.performanceBonus.xp === 22 && cRating.performanceBonus.xp === 0 && dRating.performanceBonus.xp === 0, 'S/A/B/C/D XP 表现加成与 floor 规则', JSON.stringify([sRating.performanceBonus.xp, aRating.performanceBonus.xp, bRating.performanceBonus.xp]));
ok(sRating.finalReward.xp === 225 && sRating.grantedReward.xp === 75, 'S 级完整奖励 225，实际增量 75');
ok(sRating.grantedReward.contribution === 60 && sRating.grantedReward.fragments === 0, 'S 级贡献增量 60，碎片不重复发放');
ok(bRating.performanceBonus.xp === 22, '172.5 统一向下取整为 172（增量 22）');
ok(sRating.performanceBonus.contribution === 60 && bRating.performanceBonus.contribution === 18, '贡献点同样 floor');

const hardS = W.calculateBossBattleRewards({ stats: noSpecialStats({ difficulty: 'hard' }), rating: ratingWithGrade('S'), bossId: 'gate-01', difficulty: 'hard', now: NOW });
const expertS = W.calculateBossBattleRewards({ stats: noSpecialStats({ difficulty: 'expert' }), rating: ratingWithGrade('S'), bossId: 'gate-01', difficulty: 'expert', now: NOW });
ok(hardS.difficultyBonus.xp === 60 && hardS.performanceBonus.xp === 105, 'HARD 难度+表现加成正确', JSON.stringify(hardS.performanceBonus));
ok(expertS.difficultyBonus.xp === 105 && expertS.performanceBonus.xp === 127, 'EXPERT 难度+表现加成正确');
ok(hardS.grantedReward.xp > sRating.grantedReward.xp && expertS.grantedReward.xp > hardS.grantedReward.xp, '难度越高增量越高');

console.log('=== 3. 评分资格 / 缺失评分 ===');
const noRating = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: null, bossId: 'gate-01', difficulty: 'easy', now: NOW });
ok(noRating.eligible === true && noRating.ratingUnavailable === true, '无评分仍可领取基础奖励并标记 ratingUnavailable');
ok(noRating.performanceBonus.xp === 0 && noRating.ratingGrade === null, '无评分不按 D 级计算，也不发评分加成');
ok(noRating.dataQuality === 'partial', '无评分奖励数据完整性为 partial');
const tempRating = clone(perfectRating); tempRating.finalized = false;
const invalidRating = clone(perfectRating); invalidRating.dataQuality = 'invalid';
const mismatchRating = clone(perfectRating); mismatchRating.battleId = 'other-battle';
const versionMismatch = clone(perfectRating); versionMismatch.ratingVersion = 'v0.0.1'; versionMismatch.ratingId = 'rating:' + versionMismatch.battleId + ':v0.0.1';
const idMismatch = clone(perfectRating); idMismatch.ratingId = 'rating:wrong:v1.0.0';
for (const [label, r] of [['临时评分', tempRating], ['invalid 评分', invalidRating], ['battleId 不一致', mismatchRating], ['评分版本不一致', versionMismatch], ['ratingId 不一致', idMismatch]]) {
  const x = calc({ stats: noSpecialStats(), rating: r });
  ok(x.ratingUnavailable === true && x.performanceBonus.xp === 0, label + ' 不产生正式评分奖励');
}
const partialStats = calc({ stats: statsBase({ dataQuality: 'partial' }) });
ok(partialStats.eligible === true && partialStats.dataQuality === 'partial', 'partial 统计支持基础奖励但标记 partial');
const invalidStats = calc({ stats: statsBase({ dataQuality: 'invalid' }) });
ok(!invalidStats.eligible && invalidStats.rejectionReason === 'invalid-stats' && invalidStats.finalReward.xp === 0, 'invalid 统计拒绝奖励');
ok(!W.calculateBossBattleRewards({ stats: null, now: NOW }).eligible, '缺失统计拒绝奖励');
const defeat = calc({ stats: statsBase({ result: 'defeat', battleStatus: 'failed' }), battleResult: 'defeat' });
ok(!defeat.eligible && defeat.rejectionReason === 'not-victory', '失败战斗拒绝奖励');
const retreat = calc({ stats: statsBase({ result: 'retreat', battleStatus: 'abandoned' }), battleResult: 'retreat' });
ok(!retreat.eligible, '撤退战斗拒绝奖励');
const active = calc({ stats: statsBase({ result: null, finalized: false, battleStatus: 'active' }), battleResult: null });
ok(!active.eligible, '未终结/进行中战斗拒绝奖励');
const easyC = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: ratingWithGrade('C'), bossId: 'gate-01', difficulty: 'easy', legacyGranted: { xp: 0, contribution: 0, fragments: 0 }, now: NOW });
const hardC = W.calculateBossBattleRewards({ stats: noSpecialStats({ difficulty: 'hard' }), rating: ratingWithGrade('C'), bossId: 'gate-01', difficulty: 'hard', legacyGranted: { xp: 0, contribution: 0, fragments: 0 }, now: NOW });
ok(easyC.finalReward.xp === 150 && hardC.finalReward.xp === 210, '无既有偏移时 C 级仍按难度完整计算');
ok(hardC.grantedReward.xp === 210 && hardC.grantedReward.contribution === 180, '无偏移时 HARD C 完整发放 210/180');
const noRatingSpecial = W.calculateBossBattleRewards({ stats: statsBase(), rating: null, bossId: 'gate-01', difficulty: 'easy', again: true, now: NOW });
ok(noRatingSpecial.specialBonus.xp === 55 && noRatingSpecial.performanceBonus.xp === 0, '缺失评分不影响真实表现奖励，但不计评分奖励');
const notFirst = calc({ firstDifficultyReward: false });
ok(!notFirst.eligible && notFirst.rejectionReason === 'difficulty-already-rewarded', '同 Boss+难度重复通关不参与 B.5.3');
const bossMismatch = calc({ bossId: 'k0' });
ok(!bossMismatch.eligible && bossMismatch.rejectionReason === 'boss-mismatch', 'Boss ID 不一致拒绝');
const resultMismatch = calc({ battleResult: 'defeat' });
ok(!resultMismatch.eligible && resultMismatch.rejectionReason === 'result-mismatch', '战斗结果不一致拒绝');

console.log('=== 4. 表现奖励 ===');
const allSpecial = calc();
ok(allSpecial.specialBonus.xp === 55 && allSpecial.specialBonus.contribution === 30, '四项表现奖励与上限');
ok(allSpecial.grantedReward.xp === 130 && allSpecial.grantedReward.contribution === 90, 'S+全表现的实际增量', JSON.stringify(allSpecial.grantedReward));
const noDeathOff = calc({ stats: statsBase({ playerDeathCount: 1 }) });
ok(noDeathOff.specialBonus.xp === 35 && noDeathOff.specialBonus.contribution === 20, '有死亡取消无死亡奖励');
const noStreak = calc({ stats: statsBase({ challengeStats: { ...statsBase().challengeStats, judgedCount: 5, passedCount: 4, failedCount: 1, maxConsecutiveSuccess: 2, successRate: 0.8 } }) });
ok(noStreak.specialBonus.xp === 40, '挑战未全通过/连续不足取消连续奖励');
const invalidChallenge = calc({ stats: statsBase({ challengeStats: { ...statsBase().challengeStats, invalidCount: 1 } }) });
ok(invalidChallenge.specialBonus.xp === 40, '无效提交取消连续奖励');
const noWeak = calc({ stats: statsBase({ weaknessStats: { ...statsBase().weaknessStats, crackSuccessCount: 0, bossHpDamage: 0 } }) });
ok(noWeak.specialBonus.xp === 45, '未真实破解/无弱点伤害取消弱点奖励');
const noCrisis = calc({ stats: statsBase({ dynamicEventStats: { ...statsBase().dynamicEventStats, successCount: 0, failedCount: 1 } }) });
ok(noCrisis.specialBonus.xp === 45, '动态事件失败取消危机奖励');
const timeoutCrisis = calc({ stats: statsBase({ dynamicEventStats: { ...statsBase().dynamicEventStats, successCount: 0, timeoutCount: 1 } }) });
ok(timeoutCrisis.specialBonus.xp === 45, '动态事件超时取消危机奖励');
const systemCancel = calc({ stats: statsBase({ dynamicEventStats: { ...statsBase().dynamicEventStats, successCount: 0, failedCount: 0, cancelledByPriorityCount: 1 } }) });
ok(systemCancel.specialBonus.xp === 45, '系统取消动态事件不产生危机奖励');
const noSpecial = W.calculateBossBattleRewards({ stats: noSpecialStats(), rating: perfectRating, bossId: 'gate-01', difficulty: 'expert', now: NOW });
ok(noSpecial.specialBonus.xp === 0, '无表现条件时表现奖励为 0');
ok(sRating.finalReward.contribution === 180 && hardS.finalReward.contribution === 270 && expertS.finalReward.contribution === 360, '各难度完整贡献点奖励正确');
ok(sRating.finalReward.xp === sRating.baseReward.xp + sRating.difficultyBonus.xp + sRating.performanceBonus.xp + sRating.specialBonus.xp, '完整 XP = 基础+难度+评分+表现');
ok(sRating.finalReward.fragments === 1 && sRating.grantedReward.fragments === 0, '碎片只记录既有唯一首胜，不再增量发放');
ok(sRating.dataQuality === 'complete' && sRating.eligible === true && sRating.rejectionReason === null, '正式评分+完整统计的奖励资格为 complete');
ok(cfg.specialBonuses.noDeath.xp === 20 && Cfg.SPECIAL_BONUS_LABELS.weakness === '弱点破解利用', '表现奖励标签与数值集中配置');

console.log('=== 5. 上限 / 数值安全 / 确定性 ===');
const k0NoOffset = W.calculateBossBattleRewards({ stats: statsBase({ bossId: 'k0', difficulty: 'easy' }), rating: perfectRating, bossId: 'k0', difficulty: 'easy', legacyGranted: { xp: 0, contribution: 0, fragments: 0 }, now: NOW });
ok(k0NoOffset.baseReward.xp === 600 && k0NoOffset.baseReward.contribution === 360, 'K-0 基础奖励来自真实 Boss 配置');
ok(k0NoOffset.grantedReward.xp <= cfg.caps.additionalXp && k0NoOffset.grantedReward.contribution <= cfg.caps.additionalContribution, '单场增量不超配置上限');
const negativeStats = statsBase({
  challengeStats: { ...statsBase().challengeStats, judgedCount: -5, passedCount: -9 },
  attackStats: { ...statsBase().attackStats, damageTaken: -100 },
  weaknessStats: { ...statsBase().weaknessStats, bossHpDamage: -50 },
  playerDeathCount: -3,
});
const neg = calc({ stats: negativeStats });
ok(neg.baseReward.xp >= 0 && neg.grantedReward.xp >= 0 && Number.isInteger(neg.grantedReward.xp), '负数输入不会产生负奖励');
const nanStats = statsBase({ challengeStats: { ...statsBase().challengeStats, judgedCount: NaN, passedCount: Infinity } });
const nan = calc({ stats: nanStats });
ok(Number.isFinite(nan.grantedReward.xp) && Number.isFinite(nan.grantedReward.contribution), 'NaN/Infinity 安全归零');
const input = statsBase();
const before = JSON.stringify(input);
calc({ stats: input });
ok(JSON.stringify(input) === before, '奖励计算不修改统计输入');
const a1 = calc({ now: NOW + 1 });
const a2 = calc({ now: NOW + 1 });
ok(a1.finalReward.xp === a2.finalReward.xp && a1.grantedReward.xp === a2.grantedReward.xp && a1.rewardId === a2.rewardId, '相同输入奖励结果稳定');
ok(a1.rewardId === 'boss-reward:battle-reward-1:v1.0.0' && a1.rewardVersion === 'v1.0.0', 'rewardId / rewardVersion 稳定');

console.log('=== 6. 记录 / 幂等 / 存档 ===');
const granted = { ...calc(), granted: true, grantedAt: NOW };
const store0 = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
const rec1 = W.recordBossBattleReward(store0, granted);
ok(rec1.added && rec1.store.history.length === 1 && rec1.store.grantedBattleIds.includes(granted.battleId), '正式奖励写入历史与 battleId 幂等表');
ok(rec1.store.totalGranted.xp === granted.grantedReward.xp && rec1.store.totalGranted.contribution === granted.grantedReward.contribution, '累计奖励正确增加');
const rec2 = W.recordBossBattleReward(rec1.store, granted);
ok(!rec2.added && rec2.reason === 'duplicate' && rec2.store.history.length === 1, '重复奖励被拒绝');
const otherVersion = clone(granted);
otherVersion.rewardVersion = 'v0.9.0';
otherVersion.rewardId = 'boss-reward:' + granted.battleId + ':v0.9.0';
ok(!W.recordBossBattleReward(rec1.store, otherVersion).added, '同 battleId 不同版本不重复发放');
const notGranted = { ...granted, granted: false };
ok(!W.recordBossBattleReward(store0, notGranted).added, '未发放奖励不写入正式历史');
const zeroReward = { ...calc(), grantedReward: { xp: 0, contribution: 0, fragments: 0 }, granted: true, grantedAt: NOW };
ok(W.recordBossBattleReward(store0, zeroReward).added, '增量为 0 的正式奖励仍记录以防重复');

let capped = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
for (let i = 0; i < 55; i++) {
  const x = clone(granted);
  x.battleId = 'battle-reward-cap-' + i;
  x.rewardId = 'boss-reward:' + x.battleId + ':v1.0.0';
  x.grantedReward = { xp: 1, contribution: 1, fragments: 0 };
  x.createdAt = 1000 + i;
  capped = W.recordBossBattleReward(capped, x).store;
}
ok(capped.history.length === 50 && capped.grantedBattleIds.length === 55, '奖励历史上限 50，幂等 battleId 表继续保留', String(capped.history.length));
ok(capped.totalGranted.xp === 55, '累计奖励不受历史裁剪影响');
ok(k0NoOffset.grantedReward.xp === cfg.caps.additionalXp && k0NoOffset.grantedReward.contribution === cfg.caps.additionalContribution, '增量上限严格生效');
const derivedTotal = W.normalizeBossBattleRewardStore({ history: [granted], grantedBattleIds: [] });
ok(derivedTotal.totalGranted.xp === granted.grantedReward.xp && derivedTotal.totalGranted.contribution === granted.grantedReward.contribution, '缺少累计字段时从历史安全推导');
ok(W.findBossBattleReward(rec1.store, 'missing-battle') === null, '缺失 battleId 查询返回 null');

const preservedTotal = W.normalizeBossBattleRewardStore({ ...rec1.store, totalGranted: { xp: 999, contribution: 888, fragments: 7 } });
ok(preservedTotal.totalGranted.xp === 999 && preservedTotal.totalGranted.contribution === 888, '累计统计独立于历史保存');
const corrupt = W.normalizeBossBattleRewardStore({
  history: [granted, clone(granted), { battleId: '', bossId: 'x' }, null, { ...granted, battleId: 'b2', rewardId: 'boss-reward:b2:v1', granted: false }],
  grantedBattleIds: ['', granted.battleId, 3],
  totalGranted: { xp: -5, contribution: 'bad', fragments: 1.9 },
});
ok(corrupt.history.length === 1 && corrupt.grantedBattleIds.length === 1, '存档自愈去重/过滤非法奖励');
ok(corrupt.totalGranted.xp === 0 && corrupt.totalGranted.contribution === 0 && corrupt.totalGranted.fragments === 1, '累计数值安全夹取');
ok(W.findBossBattleReward(rec1.store, granted.battleId)?.rewardId === granted.rewardId, '按 battleId 读取奖励');
ok(W.latestBossBattleRewardForBoss(rec1.store, granted.bossId)?.battleId === granted.battleId, '按 Boss 读取最近奖励');

console.log('=== 7. 发放到玩家经济 ===');
const player0 = Save.defaultState();
player0.exp = 0;
player0.level = 1;
player0.rewards.credits = 0;
player0.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
const grant1 = Grant.applyBossBattleRewardGrant(player0, granted, player0.progress.bossBattleRewards, NOW + 5);
ok(grant1.added && grant1.player.exp === granted.grantedReward.xp && grant1.player.rewards.credits === granted.grantedReward.contribution, 'XP/贡献点正确增加');
ok(grant1.player.progress.bossBattleRewards.history.length === 1, '发放写入奖励历史');
ok(grant1.player.progress.bossBattleRewards.totalGranted.xp === granted.grantedReward.xp, '发放后累计奖励同步');
ok(grant1.player.exp === player0.exp + granted.grantedReward.xp, '经验变化与奖励增量完全一致');
ok(grant1.player.rewards.ledger.some(e => e.kind === 'boss' && e.ref.includes(':performance:')), '发放写入现有奖励账本');
const grant2 = Grant.applyBossBattleRewardGrant(grant1.player, granted, grant1.player.progress.bossBattleRewards, NOW + 6);
ok(!grant2.added && grant2.player.exp === grant1.player.exp && grant2.player.rewards.credits === grant1.player.rewards.credits, '重复 grant 不重复增加经济');
ok(grant1.player.meta.memoryFragments.length === player0.meta.memoryFragments.length, 'B.5.3 不重复发放创世主碎片');

const levelPlayer = Save.defaultState();
const lv2At = Prog.LEVEL_XP[1];
levelPlayer.exp = lv2At - 10;
levelPlayer.level = 1;
levelPlayer.rewards.credits = 0;
levelPlayer.progress.bossBattleRewards = { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } };
const levelGrant = Grant.applyBossBattleRewardGrant(levelPlayer, sRating, levelPlayer.progress.bossBattleRewards, NOW + 7);
ok(levelGrant.added && levelGrant.player.level >= 2, '增量 XP 正确触发升级');
ok(levelGrant.player.progress.bossBattleRewards.totalGranted.xp === sRating.grantedReward.xp, '升级同时保留奖励累计');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
