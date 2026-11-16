// V1.1.1 Boss 三档难度：配置完整性 / 知识范围 / 奖励幂等 / 记录 / 旧档兼容
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function makeLoader() {
  const cache = new Map();
  const resolveFile = (base) => {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  };
  function load(file) {
    const abs = resolveFile(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const mod = { exports: {} };
    cache.set(abs, mod);
    const req = (spec) => {
      if (!spec.startsWith('.')) throw new Error('外部依赖不可用: ' + spec);
      return load(join(dirname(abs), spec));
    };
    new Function('exports', 'module', 'require', out)(mod.exports, mod, req);
    return mod.exports;
  }
  return (rel) => load(join(root, rel));
}

const L = makeLoader();
const BF = L('src/game/bossDifficulties.ts');
const B = L('src/game/battle.ts');
const CF = L('src/game/chapterFlow.ts');
const D = L('src/game/difficulty.ts');
const SV = L('src/services/save.ts');
const BS = L('src/game/bosses.ts');
const CH = L('src/game/lore/chapters.ts');
const LV = L('src/game/levels.ts');
const F = L('src/game/lore/fragments.ts');
const E = L('src/game/economy.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const BOSSES = ['gate-01', 'somnia', 'index-0', 'judgment-4', 'entropy', 'k0'];
const DIFFS = ['easy', 'hard', 'expert'];

console.log('=== 1. 18 套难度配置完整性 ===');
let sets = 0, phases = 0;
const allIds = new Set();
const allCodes = new Set();
for (const bossId of BOSSES) {
  const avail = BF.bossDifficulties(bossId);
  eq(avail, DIFFS, bossId + ' 三档难度齐全');
  for (const diff of DIFFS) {
    const def = BF.bossBattleDef(bossId, diff);
    sets++;
    check(!!def, bossId + '/' + diff + ' 配置存在');
    if (!def) continue;
    check(def.bossId === bossId && def.difficulty === diff, bossId + '/' + diff + ' 元数据正确');
    check(def.phases.length === 4, bossId + '/' + diff + ' 四阶段');
    check(def.maxHp === 100, bossId + '/' + diff + ' 血量不用于制造难度（仍为 100）');
    const violations = B.knowledgeViolations(def);
    eq(violations, [], bossId + '/' + diff + ' 考点不超纲');
    for (const p of def.phases) {
      phases++;
      check(!allIds.has(p.id), '阶段 id 唯一：' + p.id);
      allIds.add(p.id);
      check(!allCodes.has(p.initialCode), '初始代码唯一：' + p.id);
      allCodes.add(p.initialCode);
      check(p.hints.length === 3, p.id + ' 三层提示');
      check(p.judge.judgeKind === 'python', p.id + ' 使用真实 Python 判题');
      check((p.judge.pythonChecks || []).length >= 3, p.id + ' 至少 3 条测试');
      check(p.initialCode.trim().length > 0, p.id + ' 有初始故障代码');
      check(p.baselineMask !== B.fullMask((p.judge.pythonChecks || []).length), p.id + ' 初始代码不能直接通关');
    }
  }
}
eq(sets, 18, '共 18 套难度配置');
eq(phases, 72, '共 72 个阶段');
check(D.BOSS_DIFFICULTIES.length === 3, '三档难度元数据');
eq(D.BOSS_DIFFICULTIES.map(d => d.id), DIFFS, '难度顺序');
check(D.BOSS_DIFFICULTIES.filter(d => d.recommended).length === 1 && D.BOSS_DIFFICULTIES[0].recommended, '默认推荐简单难度');

console.log('=== 2. 难度独立题目（不是只改数值） ===');
for (const bossId of BOSSES) {
  const easy = BF.bossBattleDef(bossId, 'easy');
  const hard = BF.bossBattleDef(bossId, 'hard');
  const expert = BF.bossBattleDef(bossId, 'expert');
  const easyIds = new Set(easy.phases.map(p => p.id));
  check(!hard.phases.some(p => easyIds.has(p.id)), bossId + ' HARD 与 EASY 题目 id 不重复');
  check(!expert.phases.some(p => easyIds.has(p.id)), bossId + ' EXPERT 与 EASY 题目 id 不重复');
  const easyTitles = new Set(easy.phases.map(p => p.title));
  check(!hard.phases.some(p => easyTitles.has(p.title)), bossId + ' HARD 与 EASY 题目内容不同');
  check(!expert.phases.some(p => easyTitles.has(p.title)), bossId + ' EXPERT 与 EASY 题目内容不同');
}

console.log('=== 3. 难度记录与一次性奖励 ===');
const player0 = SV.defaultState();
const bonusEasy = CF.difficultyBonusAmounts('gate-01', 'easy');
const bonusHard = CF.difficultyBonusAmounts('gate-01', 'hard');
const bonusExpert = CF.difficultyBonusAmounts('gate-01', 'expert');
eq(bonusEasy, { exp: 0, credits: 0 }, 'EASY 无额外奖励');
check(bonusHard.exp > 0 && bonusHard.credits > 0, 'HARD 有额外经验/贡献点', JSON.stringify(bonusHard));
check(bonusExpert.exp > bonusHard.exp && bonusExpert.credits > bonusHard.credits, 'EXPERT 奖励高于 HARD');

// EASY 首次记录
let r = CF.recordBossDifficultyClear(player0, 'gate-01', 'easy', { now: 100 });
check(r.firstTime && r.exp === 0 && r.credits === 0 && !r.badgeId, 'EASY 首通无额外奖励');
check(r.record.firstDifficulty === 'easy' && r.record.bestDifficulty === 'easy', '记录首次/最高难度');
check(r.record.cleared.easy.count === 1, '记录通关次数');
// EASY 重复
let r2 = CF.recordBossDifficultyClear(r.player, 'gate-01', 'easy', { now: 200 });
check(!r2.firstTime && r2.exp === 0 && r2.credits === 0 && !r2.badgeId, '重复通关不重复发奖');
check(r2.record.cleared.easy.count === 2, '重复通关累计次数');
// HARD 首通（额外奖励一次）
let r3 = CF.recordBossDifficultyClear(r2.player, 'gate-01', 'hard', { now: 300 });
check(r3.firstTime && r3.exp === bonusHard.exp && r3.credits === bonusHard.credits, 'HARD 首通发放额外奖励');
check(r3.badgeId === E.bossDifficultyBadgeId('gate-01', 'hard'), 'HARD 徽章 id 正确');
check(r3.player.rewards.badges.includes(r3.badgeId), '徽章写入存档');
check(r3.player.rewards.difficultyRewards.includes('gate-01@hard'), '难度一次性奖励写入防刷账本');
check(r3.record.bestDifficulty === 'hard', '最高难度更新为 HARD');
// HARD 重复
const r4 = CF.recordBossDifficultyClear(r3.player, 'gate-01', 'hard', { now: 400 });
check(r4.exp === 0 && r4.credits === 0 && !r4.badgeId, 'HARD 重复通关不重复发奖');
check(r4.player.rewards.difficultyRewards.filter(k => k === 'gate-01@hard').length === 1, '防刷账本不重复记录');
// EXPERT 首通 + 称号
const r5 = CF.recordBossDifficultyClear(r4.player, 'gate-01', 'expert', { now: 500 });
check(r5.firstTime && r5.exp === bonusExpert.exp && r5.credits === bonusExpert.credits, 'EXPERT 首通发放较高奖励');
check(r5.badgeId === E.bossDifficultyBadgeId('gate-01', 'expert'), 'EXPERT 徽章 id 正确');
check(r5.titleUnlocked === 'title-expert', 'EXPERT 解锁专属称号');
check(r5.player.rewards.skins.includes('title-expert'), '称号写入外观');
check(r5.record.bestDifficulty === 'expert', '最高难度更新为 EXPERT');
check(r5.player.exp === r.player.exp + bonusHard.exp + bonusExpert.exp, '经验只按各难度一次性叠加', String(r5.player.exp));

console.log('=== 4. 实际首胜事务（EASY 首胜 → 碎片/章节） ===');
function prove(player, bossId, difficulty) {
  const def = BF.bossBattleDef(bossId, difficulty);
  const st = B.createBattleState(def);
  def.phases.forEach((p, i) => { st.phaseMask[i] = B.fullMask(B.phaseCheckCount(p)); });
  st.hp = 0;
  st.phase = def.phases.length;
  st.cleared = true;
  st.updatedAt = 1;
  st.difficulty = difficulty;
  player.progress.battles = { ...(player.progress.battles || {}), [bossId]: st };
  return player;
}
function finishLevels(p, order) {
  const ch = CH.CHAPTERS.find(c => c.order === order);
  const ids = LV.levelsOfServer(ch.serverId).map(l => l.id);
  p.progress.completedLevels = [...new Set([...p.progress.completedLevels, ...ids])];
  p.progress.flags[ch.doneFlag] = true;
  return p;
}

let p = SV.defaultState();
finishLevels(p, 1);
prove(p, 'gate-01', 'hard');
const fc = CF.handleBossFirstClear(p, 'gate-01', { difficulty: 'hard', now: 1000 });
check(fc.changed, 'HARD 首胜事务执行');
check(fc.payload.difficulty === 'hard', '首胜记录难度');
check(fc.payload.fragmentId === 'frag-01' && fc.player.meta.memoryFragments.includes('frag-01'), 'HARD 首胜发放碎片');
check(fc.player.progress.chapters.ch1.completed, 'HARD 首胜完成章节');
check(CF.chapterGate(fc.player, 'ch2').unlocked, 'HARD 首胜解锁第二章');
check(fc.payload.badgeId === E.bossDifficultyBadgeId('gate-01', 'hard'), '首胜事务发放 HARD 徽章');
check(fc.payload.difficultyExp === bonusHard.exp, '首胜事务包含难度经验');
check(fc.player.progress.bossRecords['gate-01'].bestDifficulty === 'hard', '首胜事务写入 Boss 记录');
// 重复首胜
const again = CF.handleBossFirstClear(fc.player, 'gate-01', { difficulty: 'hard', now: 2000 });
check(!again.changed, '重复首胜幂等');
// 模拟再战 EXPERT
const sim = CF.recordBossDifficultyClear(fc.player, 'gate-01', 'expert', { now: 3000 });
check(sim.badgeId === E.bossDifficultyBadgeId('gate-01', 'expert'), '模拟再战 EXPERT 发放徽章');
check(sim.record.cleared.expert.count === 1, '模拟再战记录 EXPERT 通关');
check(!F.fragmentProgress(fc.player.meta.memoryFragments).owned < 1, '模拟再战不改变碎片');

console.log('=== 5. 难度配置与旧存档兼容 ===');
const def = BF.bossBattleDef('gate-01', 'expert');
const stNoDiff = B.createBattleState(def);
delete stNoDiff.difficulty;
const norm = B.normalizeBattleState(stNoDiff, BF.bossBattleDef('gate-01', 'easy'));
check(norm.difficulty === 'easy', '旧战斗状态无难度 → 归为 EASY');
check(norm.hp === 100 && norm.phase === 0, '旧状态不会带入错误进度');
const mismatch = B.normalizeBattleState({ ...stNoDiff, difficulty: 'expert' }, BF.bossBattleDef('gate-01', 'easy'));
check(mismatch.hp === 100 && mismatch.phase === 0, '难度不匹配时不复用进度');

const oldSave = JSON.stringify({
  version: 7, updatedAt: 1,
  player: {
    ...SV.defaultState(),
    progress: { ...SV.defaultState().progress, completedLevels: ['tut-1'], bossesDone: [], battles: {}, currentBossId: null },
  },
});
const imported = SV.importSave(oldSave);
check(imported.ok, '旧存档可导入');
check(imported.state.progress.bossRecords && typeof imported.state.progress.bossRecords === 'object', '旧存档补齐 bossRecords 字段');
check(Array.isArray(imported.state.rewards.badges), '旧存档补齐 badges 字段');
check(Array.isArray(imported.state.rewards.difficultyRewards), '旧存档补齐 difficultyRewards 字段');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
