// V1.3-F.1 跨系统集成：Challenge / Explore / Growth / Boss / Save
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
const Save = L('src/services/save.ts');
const P = L('src/game/progression.ts');
const Ach = L('src/game/achievements.ts');
const X = L('src/game/explorationCore.ts');
const M = L('src/game/miraCore.ts');
const G = L('src/game/playerGrowthCore.ts');
const CS = L('src/game/challengeSession.ts');
const Econ = L('src/game/economy.ts');
const Levels = L('src/game/levels.ts');
const S = L('src/game/bossBattleStats.ts');
const R = L('src/game/bossBattleRating.ts');
const W = L('src/game/bossBattleReward.ts');
const BA = L('src/game/bossAchievementEngine.ts');
const Store = L('src/game/bossAchievementStore.ts');
const Grant = L('src/game/bossBattleRewardGrant.ts');
const Archive = L('src/game/bossBattleArchive.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 1000000;

console.log('=== 1. Challenge → Player ===');
const def = Levels.levelById('tut-1');
let p = Save.defaultState();
p.exp = 70;
p.level = P.levelForExp(70);
const beforeExp = p.exp;
const afterExp = p.exp + def.rewardExp;
p = { ...p, exp: afterExp, level: P.levelForExp(afterExp) };
ok(p.level === 2 && p.exp === 110, '首通 tut-1：+40 XP → Lv2 / 110', JSON.stringify({ e: p.exp, l: p.level }));
ok(P.toleranceFor(p.level) === 3, 'Lv2 容错上限 3');
const session = CS.createSession('tut-1', 'level', NOW, P.toleranceFor(1));
const settlement = CS.buildPassedSettlement(session, {
  now: NOW + 1000, levelBefore: 1, levelAfter: 2,
  expBefore: beforeExp, expAfter: afterExp, creditsGained: 85,
});
ok(settlement.expGained === 40 && settlement.expAfter === 110, '结算经验 40 / 110');
ok(settlement.toleranceMax === 3 && settlement.toleranceRemaining === 3, '结算容错 3 / 3');
ok(settlement.creditsGained === 85, '结算贡献点来自真实奖励');
const reward = Econ.computeLevelRewardV2({ levelExp: def.rewardExp, fails: 0, hints: 0, firstClear: true, prevStars: 0, newStars: 3 });
ok(reward.total > 0 && reward.grade === 'S', '首通奖励与 S 评级一致');
const repeatReward = Econ.computeLevelRewardV2({ levelExp: def.rewardExp, fails: 0, hints: 0, firstClear: false, prevStars: 3, newStars: 3 });
ok(repeatReward.total === 0, '重复通关且无提升不发放贡献点');

console.log('=== 2. Challenge → MIRA → Achievement ===');
let mira = M.defaultMiraState(NOW);
const levelAward = M.miraAward(mira, { eventId: 'mira:level:tut-1', xp: 10, source: 'challenge', memoryId: 'mira-first-fix', now: NOW + 1000 });
mira = levelAward.state;
ok(levelAward.changed && mira.exp === 10 && !!mira.memories['mira-first-fix'], '首通 MIRA +10 / 首次修复记忆');
const repeatAward = M.miraAward(mira, { eventId: 'mira:level:tut-1', xp: 4, source: 'challenge', now: NOW + 2000 });
mira = repeatAward.state;
ok(!repeatAward.changed && mira.exp === 10, '同一关卡事件重复不重复发 MIRA XP');
const achAward = M.miraAward(mira, { eventId: 'mira:achievement:first_repair', xp: 6, source: 'achievement', now: NOW + 3000 });
mira = achAward.state;
const achAward2 = M.miraAward(mira, { eventId: 'mira:achievement:first_repair', xp: 6, source: 'achievement', now: NOW + 4000 });
ok(achAward.changed && achAward.state.exp === 16 && !achAward2.changed, '成就 MIRA 奖励只发一次');
p = { ...p, mira };
p.progress = { ...p.progress, completedLevels: ['tut-1'], stars: { 'tut-1': 3 }, achievements: [] };
const achIds = Ach.recalcAchievements(p);
ok(achIds.includes('first_repair') && achIds.includes('training_done'), '真实首通触发首次修复/接驳完成');
p.progress.achievements = achIds;

console.log('=== 3. Challenge → Explore：失败 / 成功 / 重复 ===');
let ex = X.defaultExplorationState(NOW);
ex = X.completeExploreNode(ex, 'training', 'signal:training', ['training'], NOW + 10).state;
ex = X.completeExploreNode(ex, 'training', 'ruin:training', ['training'], NOW + 11).state;
const start1 = X.startTerminalChallenge(ex, 'training', 'terminal:training', NOW + 12);
const fail = X.completeTerminalChallenge(start1.state, 'tut-1', false, NOW + 13);
ok(!fail.changed && fail.state.pendingChallenge === null, '失败清除 pending');
ok(!fail.state.events['terminal:training'], '失败不完成终端节点');
const start2 = X.startTerminalChallenge(fail.state, 'training', 'terminal:training', NOW + 14);
const success = X.completeTerminalChallenge(start2.state, 'tut-1', true, NOW + 15);
ok(success.changed && success.firstTime && success.credits === 10, '成功完成节点并首次发奖');
const success2 = X.completeTerminalChallenge(success.state, 'tut-1', true, NOW + 16);
ok(!success2.changed && success2.credits === 0, '重复完成不重复发奖');
ok(X.regionStatus(success.state, 'training', ['training']) === 'COMPLETED', '真实终端完成 → 区域完成');
ok(X.hiddenAvailable(success.state, 'training'), '区域完成 → 隐藏信号可用');
const hidden = X.completeExploreNode(success.state, 'training', 'hidden:training:echo', ['training'], NOW + 17);
ok(hidden.changed && hidden.firstTime && !!hidden.state.hidden['hidden:training:echo'], '隐藏信号唯一归档');
const hidden2 = X.completeExploreNode(hidden.state, 'training', 'hidden:training:echo', ['training'], NOW + 18);
ok(!hidden2.changed && !hidden2.firstTime, '隐藏信号不可重复领取');
ex = hidden.state;

console.log('=== 4. Exploration → Growth → Profile / Save ===');
p.progress = { ...p.progress, exploration: ex, unlockedServers: ['training'] };
p.rewards = {
  ...p.rewards,
  credits: 23,
  ledger: [
    { kind: 'exploration', ref: 'signal:training', credits: 5, exp: 0, at: NOW + 10 },
    { kind: 'exploration', ref: 'ruin:training', credits: 8, exp: 0, at: NOW + 11 },
    { kind: 'exploration', ref: 'terminal:training', credits: 10, exp: 0, at: NOW + 15 },
  ],
};
const pAch = Ach.recalcAchievements(p);
p.progress.achievements = pAch;
ok(pAch.includes('explorer_first') && pAch.includes('hidden_signal'), '区域/隐藏真实触发探索成就');
const growth = G.growthOverviewFor(p, 31);
ok(growth.level === 2 && growth.exp === 110 && growth.regionsCompleted === 1 && growth.explorePct > 0, '成长总览读取真实等级/探索');
ok(growth.achievementCount >= 4 && growth.miraLevel >= 1, '成长总览读取成就/MIRA');
ok(growth.risk.level === 'NORMAL' && growth.risk.toleranceMax === 3, '成长总览风险/容错来自真实数据');
const saved = Save.normalizePlayerState(clone(p), 10);
ok(saved.progress.exploration.hidden['hidden:training:echo'], '刷新后隐藏信号保留');
ok(saved.progress.achievements.includes('explorer_first'), '刷新后成就保留');
ok(saved.rewards.ledger.some(x => x.kind === 'exploration' && x.ref === 'terminal:training'), '刷新后探索流水保留');
ok(saved.mira.exp === 16 && saved.mira.memories['mira-first-fix'], '刷新后 MIRA 保留');
ok(Save.SAVE_VERSION === 10, 'Save v10');
const oldExplore = Save.normalizePlayerState(clone({ ...p, progress: { ...p.progress, achievements: [] } }), 10);
ok(!oldExplore.progress.achievements.includes('explorer_first'), 'P3-02 现状：旧档 normalize 不主动伪造成就');
ok(Ach.recalcAchievements(oldExplore).includes('explorer_first') && Ach.recalcAchievements(oldExplore).includes('hidden_signal'), 'P3-02：旧探索档在下一次真实重算后补齐成就');

console.log('=== 5. Boss → Reward → MIRA → Achievement → Archive ===');
function realStats() {
  let s = S.createBossBattleStats({
    battleId: 'battle@f1', bossId: 'gate-01', bossName: 'GATE-01',
    difficulty: 'easy', startedAt: NOW, phaseId: 'gate-01-bp1', phaseIndex: 0, consciousness: 100,
  });
  const rec = (id, type, payload = {}, at = NOW + 10) => {
    s = S.recordBossBattleEvent(s, { eventId: id, eventType: type, phaseId: 'gate-01-bp1', source: 'f1', payload, occurredAt: at }, at).state;
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
const bossReward = W.calculateBossBattleRewards({
  stats, rating, bossId: 'gate-01', difficulty: 'easy',
  legacyGranted: W.bossLegacyRewardOffset('gate-01', 'easy'), now: NOW + 32000,
});
let bp = Save.defaultState();
bp.consciousness = 45;
bp.progress.currentBossId = 'gate-01';
bp.progress.bossBattleStats = { active: null, history: [stats] };
bp.progress.bossBattleRatings = { history: [rating] };
bp.progress.bossBattleHistory = [{ ...stats, stats: { damageDealt: 140 } }];
const grant1 = Grant.applyBossBattleRewardGrant(bp, bossReward, bp.progress.bossBattleRewards, NOW + 33000);
ok(grant1.added && grant1.player.rewards.credits > 0, 'Boss 奖励真实入账');
ok(grant1.player.rewards.ledger.some(x => x.kind === 'boss'), 'Boss 奖励进入现有账本');
const grant2 = Grant.applyBossBattleRewardGrant(grant1.player, bossReward, grant1.store, NOW + 34000);
ok(!grant2.added && grant2.player.rewards.credits === grant1.player.rewards.credits, '同一 battleId 重复奖励被拒绝');
const evalA = BA.evaluateBossAchievements({ stats, rating, reward: bossReward, bossId: 'gate-01', difficulty: 'easy', now: NOW + 35000 });
let bossP = Store.evaluateAndApplyBossAchievements(grant1.player, evalA, NOW + 36000).player;
ok(evalA.newlyUnlocked.length >= 1, 'Boss 真实成就评估有解锁');
const archive1 = Archive.archiveBossBattleForPlayer(bossP, stats.battleId, { firstClear: true, fragmentGranted: true, now: NOW + 37000 });
const archive2 = Archive.archiveBossBattleForPlayer(archive1, stats.battleId, { firstClear: true, fragmentGranted: true, now: NOW + 38000 });
ok(archive1.progress.bossBattleArchive.records.length === 1, 'Boss 档案写入 1 条');
ok(archive2.progress.bossBattleArchive.records.length === 1, '同一 battleId 档案不重复');
const bm1 = M.miraAward(M.normalizeMiraState(archive2.mira), { eventId: 'mira:boss:victory:' + stats.battleId, xp: 30, source: 'boss', memoryId: 'mira-boss-victory', now: NOW + 39000 });
const bm2 = M.miraAward(bm1.state, { eventId: 'mira:boss:victory:' + stats.battleId, xp: 30, source: 'boss', memoryId: 'mira-boss-victory', now: NOW + 40000 });
ok(bm1.changed && bm1.state.exp === 30 && !!bm1.state.memories['mira-boss-victory'], 'Boss 胜利 MIRA +30 / 记忆');
ok(!bm2.changed && bm2.state.exp === 30, '重复 Victory 事件不重复 MIRA XP');
const bossSaved = Save.normalizePlayerState(clone({ ...archive2, mira: bm2.state }), 10);
ok(bossSaved.progress.bossBattleArchive.records.length === 1, '刷新后 Boss 档案保留');
ok(bossSaved.mira.memories['mira-boss-victory'] && bossSaved.mira.exp === 30, '刷新后 Boss MIRA 保留');
ok(bossSaved.rewards.ledger.some(x => x.kind === 'boss'), '刷新后 Boss 账本保留');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
