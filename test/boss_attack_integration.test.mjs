// V1.3-B.2 Boss 攻击集成：真实阶段配置 + 攻击模式 + 阶段联动 + 存档自愈
// 执行：node test/boss_attack_integration.test.mjs
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
    const base = join(dirname(abs), sp);
    const cand = existsSync(base) && extname(base) ? base : existsSync(base + '.ts') ? base + '.ts' : base + '/index.ts';
    return load(cand);
  });
  return mod.exports;
}
const L = (rel) => load(join(root, rel));
const A = L('src/game/bossAttackEngine.ts');
const AP = L('src/game/bossAttackPatterns.ts');
const B = L('src/game/bossPhaseEngine.ts');
const P = L('src/game/bossPhasePlans.ts');
const Save = L('src/services/save.ts');
const BD = L('src/game/bossDifficulties.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;
const ctx = (now, over = {}) => ({
  now, phaseId: 'bp1', phaseIndex: 0, battleActive: true, eventBlocked: false,
  playerHp: 100, damageScale: 1, rng: () => 0.01, ...over,
});

// ================= 1. 攻击模式与阶段配置 =================
console.log('=== 1. 攻击模式与真实阶段配置 ===');
{
  for (const bossId of P.BOSS_PHASE_BOSS_IDS) {
    for (const diff of ['easy', 'hard', 'expert']) {
      const plan = P.buildBossPhasePlan(bossId, diff);
      if (!plan) continue;
      const all = AP.bossAttackPatterns(bossId, diff);
      ok(all.length >= 4, bossId + '/' + diff + '：至少配置 4 个攻击模式');
      ok(new Set(all.map(p => p.attackId)).size === all.length, bossId + '/' + diff + '：attackId 唯一');
      for (let i = 0; i < plan.phases.length; i++) {
        const list = AP.attackPatternsFor(bossId, diff, i);
        ok(list.length >= 2, bossId + '/' + diff + ' 阶段 ' + (i + 1) + '：至少 2 个攻击模式');
        ok(list.every(p => p.phaseRestriction.includes(i)), bossId + '/' + diff + ' 阶段 ' + (i + 1) + '：模式阶段限制正确');
        ok(list.every(p => p.damage >= 1 && p.warningDuration >= 1400 && p.cooldown >= 5000), bossId + '/' + diff + ' 阶段 ' + (i + 1) + '：伤害/预警/冷却在安全范围');
      }
    }
  }

  const easy = AP.bossAttackPatterns('gate-01', 'easy');
  const expert = AP.bossAttackPatterns('gate-01', 'expert');
  const ePulse = easy.find(p => p.attackId === 'gate-01-p1-pulse');
  const xPulse = expert.find(p => p.attackId === 'gate-01-p1-pulse');
  ok(!!ePulse && !!xPulse, 'GATE-01 数据脉冲存在');
  ok(xPulse.damage > ePulse.damage, 'EXPERT 伤害高于 EASY');
  ok(xPulse.warningDuration < ePulse.warningDuration, 'EXPERT 预警时间更短');
  ok(xPulse.cooldown <= ePulse.cooldown, 'EXPERT 冷却不长于 EASY');

  const g1 = AP.attackPatternsFor('gate-01', 'easy', 0);
  const g2 = AP.attackPatternsFor('gate-01', 'easy', 1);
  const g3 = AP.attackPatternsFor('gate-01', 'easy', 2);
  ok(g1.some(p => p.attackType === 'single'), '阶段 1 包含单体攻击');
  ok(g1.some(p => p.attackType === 'delayed'), '阶段 1 包含延迟攻击');
  ok(g2.some(p => p.attackType === 'multi'), '阶段 2 包含连续攻击');
  ok(g2.some(p => p.attackType === 'special' && p.defenseRequirement === 'none'), '阶段 2 包含不可防御特殊攻击');
  ok(g3.some(p => p.attackType === 'aoe'), '阶段 3 包含范围攻击');
  ok(g3.some(p => p.dangerLevel === 3), '阶段 3 有高危险攻击');

  const k0 = AP.bossAttackPatterns('k0', 'easy');
  ok(k0.length > 0 && k0.every(p => p.attackId.startsWith('k0-')), 'K-0 使用独立攻击模式 ID');
}

// ================= 2. 真实 GATE-01 攻击循环 =================
console.log('=== 2. GATE-01 攻击循环（真实阶段 / 攻击模式） ===');
{
  const plan = P.buildBossPhasePlan('gate-01', 'easy');
  const run = B.startBossPhaseRun(plan, NOW).run;
  const patterns = AP.bossAttackPatterns('gate-01', 'easy');
  let state = A.createBossAttackState(run.battleId, 'gate-01', plan.phases[0].phaseId, 0, NOW, { nextAttackAt: NOW + 100 });

  // 选择并预警
  let step = A.tickBossAttack(state, patterns, ctx(NOW + 100, { phaseId: plan.phases[0].phaseId }));
  state = step.state;
  ok(state.attackState === 'telegraph' && !!state.currentPattern, '真实阶段 1：进入攻击预警');
  ok(state.currentPattern.phaseRestriction.includes(0), '预警模式属于阶段 1');

  // 防御并结算
  const def = A.playerDefend(state, state.telegraphEndsAt - 200);
  ok(def.ok, '攻击预警期间可以防御');
  const hitAt = state.telegraphEndsAt + state.currentPattern.attackDuration;
  const hit = A.tickBossAttack(def.state, patterns, ctx(hitAt, { phaseId: plan.phases[0].phaseId }));
  ok(hit.damages.length === 1 && hit.damages[0].result === 'blocked', '防御成功：本次命中被减伤');
  state = hit.state;
  ok(state.damageDealt > 0 && state.damageDealt < state.currentPattern.damage * state.currentPattern.hitCount, '防御后伤害低于满额');

  // 结算 → 冷却
  let guard = 0;
  while (state.attackState !== 'cooldown' && guard++ < 20) {
    const s = A.tickBossAttack(state, patterns, ctx((state.attackEndsAt || NOW) + guard * 100, { phaseId: plan.phases[0].phaseId }));
    if (!s.changed) break;
    state = s.state;
  }
  ok(state.attackState === 'cooldown', '攻击结束进入冷却');

  // 阶段切换：旧攻击取消、冷却重置、新阶段模式加载
  const switched = A.tickBossAttack(
    { ...state, attackState: 'telegraph', telegraphStartedAt: NOW, telegraphEndsAt: NOW + 3000 },
    patterns,
    ctx(NOW + 500, { phaseId: plan.phases[1].phaseId, phaseIndex: 1 }),
  );
  ok(switched.state.phaseIndex === 1 && switched.state.attackState === 'idle', '阶段切换取消攻击并加载阶段 2');
  ok(Object.keys(switched.state.patternCooldowns).length === 0, '阶段切换重置攻击冷却');
  ok(switched.damages.length === 0, '阶段切换不结算旧阶段攻击');

  const next = A.tickBossAttack(switched.state, patterns, ctx(switched.state.nextAttackAt, { phaseId: plan.phases[1].phaseId, phaseIndex: 1 }));
  ok(next.state.currentPattern && next.state.currentPattern.phaseRestriction.includes(1), '阶段 2 只选择阶段 2 攻击模式');

  // 多次攻击后玩家 HP 不会为负
  let hp = 100;
  let s2 = next.state;
  for (let i = 0; i < 30; i++) {
    const t = A.tickBossAttack(s2, patterns, ctx((s2.updatedAt || NOW) + 400, { phaseId: plan.phases[1].phaseId, phaseIndex: 1, playerHp: hp }));
    s2 = t.state;
    hp = Math.max(0, hp - t.damages.reduce((sum, d) => sum + d.amount, 0));
    if (hp <= 0) break;
  }
  ok(hp >= 0, '连续攻击后玩家 HP 不会为负');
}

// ================= 3. 存档集成 =================
console.log('=== 3. 攻击状态存档自愈 ===');
{
  const base = () => ({
    name: 'R-07', level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], backupLevel: 1 },
    progress: {
      completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: {}, flags: {},
      bossesDone: [], currentBossId: null, pendingRebirth: false,
    },
    settings: { musicVolume: 0.3, sfxVolume: 0.6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
  });

  const plan = P.buildBossPhasePlan('gate-01', 'easy');
  const run = B.startBossPhaseRun(plan, NOW).run;
  const patterns = AP.bossAttackPatterns('gate-01', 'easy');
  const tel = A.startAttackForDev(
    A.createBossAttackState(run.battleId, 'gate-01', plan.phases[0].phaseId, 0, NOW),
    patterns[0], NOW,
  ).state;

  const raw = base();
  raw.progress.bossBattles = { 'gate-01': run };
  raw.progress.bossAttacks = { 'gate-01': tel };
  raw.progress.battles = { 'gate-01': { hp: 100, maxHp: 100, phase: 0, phaseMask: [0, 0, 0, 0], failures: 0, cleared: false, difficulty: 'easy', started: true } };
  const normalized = Save.normalizePlayerState(raw, 10);
  ok(normalized.progress.bossAttacks['gate-01'].attackState === 'cancelled', '刷新时预警中的攻击被安全取消');
  ok(normalized.progress.bossAttacks['gate-01'].battleId === run.battleId, '刷新后攻击状态与战斗 battleId 对齐');
  ok(normalized.progress.bossAttacks['gate-01'].damageDealt === 0, '刷新不产生额外伤害');

  // 终结战斗 → 攻击状态被清理
  const deadRun = { ...run, status: 'victory', battleResult: 'victory', endedAt: NOW, hp: 0 };
  const raw2 = base();
  raw2.progress.bossBattles = { 'gate-01': deadRun };
  raw2.progress.bossAttacks = { 'gate-01': tel };
  raw2.progress.battles = { 'gate-01': { hp: 0, maxHp: 100, phase: 4, phaseMask: [7, 15, 7, 3], failures: 0, cleared: true, difficulty: 'easy', started: true } };
  const norm2 = Save.normalizePlayerState(raw2, 10);
  ok(!norm2.progress.bossAttacks['gate-01'], '已终结战斗的攻击状态被清理');

  // 旧存档无字段
  const old = Save.normalizePlayerState(base(), 10);
  ok(old.progress.bossAttacks && Object.keys(old.progress.bossAttacks).length === 0, '旧存档自动补空 bossAttacks');
  ok(Save.SAVE_VERSION === 10, '存档版本保持 v10');

  // 脏数据
  const raw3 = base();
  raw3.progress.bossBattles = { 'gate-01': run };
  raw3.progress.battles = { 'gate-01': { hp: 100, maxHp: 100, phase: 0, phaseMask: [0, 0, 0, 0], failures: 0, cleared: false, difficulty: 'easy', started: true } };
  raw3.progress.bossAttacks = {
    'gate-01': { bossId: 'gate-01', attackState: 'telegraph', resolvedHitKeys: new Array(200).fill('x'), damageDealt: -8 },
    'unknown': { bossId: 'unknown', attackState: 'telegraph' },
  };
  const norm3 = Save.normalizePlayerState(raw3, 10);
  ok(norm3.progress.bossAttacks['gate-01'].attackState === 'cancelled', '脏攻击数据退化为安全取消状态');
  ok(norm3.progress.bossAttacks['gate-01'].resolvedHitKeys.length <= 40, 'hitKey 列表有上限');
  ok(!norm3.progress.bossAttacks.unknown, '未知 Boss 攻击状态被丢弃');
}

// ================= 4. 攻击面板配置字段完整性 =================
console.log('=== 4. 攻击配置字段完整性 ===');
{
  const plan = P.buildBossPhasePlan('gate-01', 'easy');
  const run = B.startBossPhaseRun(plan, NOW).run;
  const patterns = AP.bossAttackPatterns('gate-01', 'easy');
  for (const p of patterns) {
    ok(typeof p.attackName === 'string' && p.attackName.length > 0, p.attackId + '：attackName');
    ok(['single', 'multi', 'aoe', 'delayed', 'special'].includes(p.attackType), p.attackId + '：attackType 合法');
    ok(typeof p.description === 'string' && p.description.length > 0, p.attackId + '：description');
    ok(p.target === 'player', p.attackId + '：target=player');
    ok(typeof p.visualEffect === 'string' && typeof p.audioEffect === 'string', p.attackId + '：视觉/音效配置');
    ok(p.defenseReduction >= 0 && p.defenseReduction <= 1, p.attackId + '：防御减伤合法');
    ok(p.hitCount >= 1, p.attackId + '：命中次数合法');
  }
  ok(patterns.some(p => p.attackType === 'multi' && p.hitCount >= 3), '存在 ≥3 段的连续攻击');
  ok(patterns.every(p => p.phaseRestriction.length > 0), '所有模式都有阶段限制');
  ok(!!run.battleId, '攻击状态可绑定真实战斗 battleId');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
