// V1.3-B.5.2 评分集成测试：真实 B.5.1 快照 + 存档自愈 + 评分持久化
// 执行：node test/boss_battle_rating_integration.test.mjs
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
const Save = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const NOW = 500000;

function realFinalSnapshot(result = 'victory') {
  let s = S.createBossBattleStats({
    battleId: 'battle@rating-integration', bossId: 'gate-01', bossName: 'GATE-01 · 数据港守卫',
    difficulty: 'easy', startedAt: NOW, phaseId: 'gate-01-bp1', phaseIndex: 0,
  });
  const rec = (id, type, payload = {}, at = NOW + 10) => {
    s = S.recordBossBattleEvent(s, { eventId: id, eventType: type, phaseId: 'gate-01-bp1', source: 'integration', payload, occurredAt: at }, at).state;
  };
  rec('start', 'battle-started', {}, NOW + 1);
  rec('t1', 'attack-telegraph', { attackType: 'single' }, NOW + 1000);
  rec('s1', 'attack-started', { attackId: 'a1' }, NOW + 2000);
  rec('r1', 'attack-result', { result: 'blocked', response: 'defend', attackId: 'a1' }, NOW + 3000);
  rec('t2', 'attack-telegraph', { attackType: 'multi' }, NOW + 4000);
  rec('s2', 'attack-started', { attackId: 'a2' }, NOW + 5000);
  rec('r2', 'attack-result', { result: 'dodged', response: 'dodge', attackId: 'a2' }, NOW + 6000);
  rec('t3', 'attack-telegraph', { attackType: 'single' }, NOW + 7000);
  rec('s3', 'attack-started', { attackId: 'a3' }, NOW + 8000);
  rec('r3', 'attack-result', { result: 'hit', response: 'none', attackId: 'a3' }, NOW + 9000);
  rec('dmg', 'damage-taken', { amount: 12, shieldAbsorbed: 3 }, NOW + 9001);
  rec('c1', 'challenge-result', { outcome: 'passed', phaseCleared: false }, NOW + 10000);
  rec('c2', 'challenge-result', { outcome: 'failed', reason: 'judge-failed' }, NOW + 11000);
  rec('c3', 'challenge-result', { outcome: 'passed', phaseCleared: true }, NOW + 12000);
  rec('c4', 'challenge-result', { outcome: 'passed', phaseCleared: false }, NOW + 13000);
  rec('c5', 'challenge-result', { outcome: 'passed', phaseCleared: false }, NOW + 14000);
  rec('w1', 'weakness-discovered', { weaknessId: 'gate-01-w1' }, NOW + 15000);
  rec('w2', 'weakness-discovered', { weaknessId: 'gate-01-w2' }, NOW + 16000);
  rec('w3', 'weakness-crack-result', { outcome: 'success', weaknessId: 'gate-01-w1' }, NOW + 17000);
  rec('w4', 'weakness-crack-result', { outcome: 'success', weaknessId: 'gate-01-w2' }, NOW + 18000);
  rec('w5', 'weakness-exposed', { weaknessId: 'gate-01-w1' }, NOW + 19000);
  rec('w6', 'weakness-boss-damage', { amount: 18, weaknessId: 'gate-01-w1' }, NOW + 20000);
  rec('w7', 'weakness-recovered', { weaknessId: 'gate-01-w1', durationMs: 3000 }, NOW + 22000);
  rec('e1', 'dynamic-triggered', { defId: 'unknown_intrusion', instanceId: 'intr-1' }, NOW + 23000);
  rec('e2', 'dynamic-success', { instanceId: 'intr-1', durationMs: 4000 }, NOW + 27000);
  rec('p1', 'phase-completed', {}, NOW + 28000);
  const fin = S.finalizeBossBattleStats(s, result, NOW + 30000).state;
  return fin;
}

const stats = realFinalSnapshot();
console.log('=== 1. 真实 B.5.1 快照 → 评分 ===');
const before = JSON.stringify(stats);
const rating = R.calculateBossBattleRating(stats, NOW + 31000);
ok(rating.battleId === stats.battleId && rating.bossId === stats.bossId, '评分与统计 battleId/bossId 对齐');
ok(rating.dataQuality === 'complete' && rating.finalized === true, '完整胜利快照生成正式评分', JSON.stringify({ q: rating.dataQuality, f: rating.finalized }));
ok(Object.values(rating.dimensionScores).every(d => d.availability === 'available'), '真实 GATE-01 五维均可评分');
ok(rating.dimensionScores.challenge.score > 0 && rating.dimensionScores.weakness.score > 0, '挑战与弱点维度来自真实事件');
ok(rating.dimensionScores.crisis.score === 10, '动态事件成功处理满分');
ok(rating.totalScore > 0 && rating.totalScore <= 100, '评分为 0~100');
ok(rating.ratingVersion === C.BOSS_BATTLE_RATING_VERSION, '评分版本记录');
ok(JSON.stringify(stats) === before, '评分不修改输入统计快照');
ok(rating.sourceStatsHash === R.hashBossBattleStats(stats), 'sourceStatsHash 与输入快照一致');
ok(rating.performanceHighlights.length + rating.performanceWeaknesses.length + rating.ratingReasons.length > 0, '生成真实可解释依据');

console.log('=== 2. 战绩/评分持久化（v10） ===');
ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');
const player = Save.defaultState();
ok(player.progress.bossBattleRatings && Array.isArray(player.progress.bossBattleRatings.history), '默认存档包含评分存储');
player.progress.bossBattleStats = { active: null, history: [stats] };
const write = R.recordBossBattleRating({ history: [] }, rating);
player.progress.bossBattleRatings = write.store;
const rewardsBefore = JSON.stringify(player.rewards);
const normalized = Save.normalizePlayerState(clone(player), 10);
ok(normalized.progress.bossBattleStats.history.length === 1, '存档迁移不丢失 B.5.1 统计快照');
ok(normalized.progress.bossBattleRatings.history.length === 1, '存档迁移保留评分');
ok(normalized.progress.bossBattleRatings.history[0].battleId === stats.battleId, '评分绑定 battleId');
ok(normalized.progress.bossBattleRatings.history[0].ratingVersion === C.BOSS_BATTLE_RATING_VERSION, '迁移保留 ratingVersion');
ok(JSON.stringify(normalized.rewards) === rewardsBefore, '评分与存档迁移不改变奖励');
ok(normalized.progress.bossBattleStats.history[0].finalized === true, '统计历史仍为只读终结态');

const badSave = clone(normalized);
badSave.progress.bossBattleRatings.history = [
  { battleId: '', bossId: 'x', ratingVersion: 'v1' },
  { battleId: 'bad', bossId: 'x', ratingVersion: 'v1', dataQuality: 'invalid', totalScore: 999 },
  clone(normalized.progress.bossBattleRatings.history[0]),
  clone(normalized.progress.bossBattleRatings.history[0]),
];
const healed = Save.normalizePlayerState(badSave, 10);
ok(healed.progress.bossBattleRatings.history.length === 1, '异常评分存档安全自愈');
ok(healed.progress.bossBattleRatings.history[0].grade === rating.grade, '自愈后等级与分数口径一致');

const oldSave = clone(normalized);
delete oldSave.progress.bossBattleRatings;
const oldNorm = Save.normalizePlayerState(oldSave, 10);
ok(oldNorm.progress.bossBattleRatings.history.length === 0, '旧存档缺少评分字段时安全补空');

console.log('=== 3. 评分幂等 / 历史保护 ===');
const s0 = { history: [] };
const first = R.recordBossBattleRating(s0, rating);
const second = R.recordBossBattleRating(first.store, rating);
ok(first.added === true && second.added === false && second.reason === 'duplicate', '重复写入同一评分被拒绝');
ok(second.store.history.length === 1, '刷新/重复结算不生成第二份评分');

const laterRating = clone(rating);
laterRating.totalScore = 1;
laterRating.grade = 'D';
laterRating.ratedAt = NOW + 99999;
const noOverwrite = R.recordBossBattleRating(first.store, laterRating);
ok(!noOverwrite.added && noOverwrite.store.history[0].totalScore === rating.totalScore, '同 battleId 历史正式评分不被覆盖');

const defeatStats = realFinalSnapshot('defeat');
const defeatRating = R.calculateBossBattleRating(defeatStats, NOW + 32000);
ok(defeatRating.finalized === false, '失败战斗不生成正式评分');
const defeatWrite = R.recordBossBattleRating({ history: [] }, defeatRating);
ok(defeatWrite.store.history.length === 0, '失败评分不写入正式历史');

console.log('=== 4. 公平性与机制缺失（集成） ===');
const noCrisis = clone(stats);
noCrisis.dynamicEventStats = { ...noCrisis.dynamicEventStats, triggeredCount: 0, successCount: 0, playerCompletedCount: 0, byDef: {} };
const noCrisisRating = R.calculateBossBattleRating(noCrisis, NOW + 33000);
ok(noCrisisRating.dimensionAvailability.crisis === 'mechanicUnavailable', '无动态事件 → 危机维度机制不可用');
ok(noCrisisRating.dataQuality === 'complete', '机制不存在不降低数据完整性');
const noWeakBoss = clone(stats);
noWeakBoss.bossId = 'boss-without-weakness';
const noWeakRating = R.calculateBossBattleRating(noWeakBoss, NOW + 34000);
ok(noWeakRating.dimensionAvailability.weakness === 'mechanicUnavailable', '无弱点机制 → 弱点维度机制不可用');
ok(noWeakRating.dataQuality === 'complete', '无弱点机制不视为数据缺失');

const partial = clone(stats);
partial.dataQuality = 'partial';
const partialRating = R.calculateBossBattleRating(partial, NOW + 35000);
ok(partialRating.dataQuality === 'partial' && partialRating.finalized === false, 'partial 统计只生成临时评分');
const partialWrite = R.recordBossBattleRating({ history: [] }, partialRating);
ok(partialWrite.added === true && partialWrite.store.history[0].finalized === false, '临时评分可保存但明确标记非正式');
const formalAfterPartial = R.recordBossBattleRating(partialWrite.store, rating);
ok(formalAfterPartial.added === true && formalAfterPartial.store.history[0].finalized === true, '后续正式评分替换临时评分');

const invalid = clone(stats);
invalid.dataQuality = 'invalid';
const invalidRating = R.calculateBossBattleRating(invalid, NOW + 36000);
ok(invalidRating.dataQuality === 'invalid' && invalidRating.finalized === false, 'invalid 统计禁止正式评分');
ok(R.recordBossBattleRating({ history: [] }, invalidRating).store.history.length === 0, 'invalid 评分不写入历史');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
