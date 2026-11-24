// V1.3-B.3 Boss 弱点引擎专项：状态机 / 线索 / 发现 / 破解 / 暴露 / 恢复 / 阶段 / 自愈
// 执行：node test/boss_weakness_engine.test.mjs
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
const W = L('src/game/bossWeaknessEngine.ts');
const Catalog = L('src/game/bossWeaknessCatalog.ts');
const Plans = L('src/game/bossPhasePlans.ts');
const Patterns = L('src/game/bossAttackPatterns.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const NOW = 1_800_000_000_000;

function def(over = {}) {
  return {
    weaknessId: 'w1', bossId: 'boss', phaseId: 'bp1', phaseIndex: 0,
    name: '测试弱点', description: 'desc', weaknessType: 'logic', discoveryDifficulty: 'easy',
    clues: [
      { clueId: 'c1', text: '线索一', sourceLabel: '攻击预警', trigger: { kind: 'attack-telegraph', attackType: 'single' } },
      { clueId: 'c2', text: '线索二', sourceLabel: '防御反馈', trigger: { kind: 'attack-result', result: 'blocked' } },
      { clueId: 'c3', text: '线索三', sourceLabel: '闪避反馈', trigger: { kind: 'attack-result', result: 'dodged' } },
    ],
    requiredClues: 2,
    analysisDurationMs: 1000,
    challenge: {
      id: 'crack', title: '破解', goal: 'goal', fault: 'fault', initialCode: 'x', reference: 'x',
      judge: { judgeKind: 'python', pythonChecks: [{ name: 't', expr: 'True' }] },
      hints: ['a', 'b', 'c'],
    },
    vulnerabilityDuration: 5000,
    damageMultiplier: 1.5,
    attackCooldownBonus: 1.3,
    interruptAttack: true,
    disableAttackPatternIds: ['p-x'],
    exposureEffects: ['伤害 ×1.5'],
    recoveryRule: { recoveryCooldownMs: 2000, lockRecoveryMs: 3000 },
    maxAttempts: 2,
    ...over,
  };
}
const create = (defs = [def()], over = {}) => W.createBossWeaknessRun('b1', 'boss', 'bp1', 0, defs, NOW);
const observe = (run, defs, obs, now = NOW + 10) => W.observeWeakness(run, defs, obs, now);

// ================= 状态机 / 线索 =================
console.log('=== 1. 弱点状态机与线索 ===');
{
  const d = def();
  const defs = [d];
  let run = create(defs);
  ok(run.activeWeaknessId === 'w1' && run.entries.w1.status === 'hidden', '创建后弱点 hidden');
  let step = observe(run, defs, { kind: 'attack-telegraph', attackType: 'single' });
  run = step.state;
  ok(step.changed && run.entries.w1.status === 'hinted' && run.entries.w1.clues.length === 1, '首条线索 → hinted');
  ok(step.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_HINT), '线索事件');
  const dup = observe(run, defs, { kind: 'attack-telegraph', attackType: 'single' });
  ok(!dup.changed && dup.state.entries.w1.clues.length === 1, '重复线索不重复添加');
  step = observe(run, defs, { kind: 'attack-result', result: 'blocked' });
  run = step.state;
  ok(run.entries.w1.clues.length === 2, '第二条线索');
  const noAnalysis = W.startAnalysis(create(defs), defs, NOW + 100);
  ok(!noAnalysis.ok, '线索不足时无法分析');
  const analysis = W.startAnalysis(run, defs, NOW + 200);
  ok(analysis.ok && analysis.state.entries.w1.status === 'analyzing', '线索足够 → 分析中');
  ok(!W.startAnalysis(analysis.state, defs, NOW + 300).ok, '重复分析被拒绝');
  const early = W.tickWeakness(analysis.state, defs, NOW + 500);
  ok(!early.changed && early.state.entries.w1.status === 'analyzing', '分析未完成不发现');
  const done = W.tickWeakness(analysis.state, defs, NOW + 1500);
  ok(done.changed && done.state.entries.w1.status === 'discovered', '分析完成 → discovered');
  ok(done.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_ANALYZED), 'ANALYZED 事件');
  ok(done.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_DISCOVERED), 'DISCOVERED 事件');
  ok(!W.startAnalysis(done.state, defs, NOW + 1600).ok, '已发现后不能再次分析');
}

// ================= 破解 / 尝试次数 / 封锁 =================
console.log('=== 2. 破解与尝试次数 ===');
{
  const d = def();
  const defs = [d];
  let run = create(defs);
  run = observe(run, defs, { kind: 'attack-telegraph', attackType: 'single' }).state;
  run = observe(run, defs, { kind: 'attack-result', result: 'blocked' }).state;
  run = W.tickWeakness(W.startAnalysis(run, defs, NOW + 200).state, defs, NOW + 1500).state;
  ok(run.entries.w1.status === 'discovered', '准备破解：discovered');

  const begin = W.beginWeaknessCrack(run, defs, NOW + 2000);
  ok(begin.ok && begin.state.entries.w1.status === 'exploiting' && begin.state.entries.w1.attempts === 1, '开始破解 → exploiting，attempts=1');
  ok(!W.beginWeaknessCrack(begin.state, defs, NOW + 2100).ok, '破解中不能重复提交');
  const success = W.completeWeaknessCrack(begin.state, defs, true, NOW + 3000);
  ok(success.ok && success.state.entries.w1.status === 'exposed', '破解成功 → exposed');
  ok(success.state.entries.w1.successCount === 1 && success.state.entries.w1.exposureCount === 1, '成功/暴露次数记录');
  ok(success.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_SUCCESS), 'CHALLENGE_SUCCESS 事件');
  ok(success.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_EXPOSED), 'EXPOSED 事件');
  ok(success.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_EFFECT_APPLIED), 'EFFECT_APPLIED 事件');
  ok(!W.completeWeaknessCrack(success.state, defs, true, NOW + 3100).changed, '重复成功结算被拒绝（幂等）');

  // 失败两次 → 封锁
  const recoverAt = success.state.entries.w1.exposedUntil;
  let r2 = W.tickWeakness(success.state, defs, recoverAt + 1).state;
  r2 = W.tickWeakness(r2, defs, recoverAt + 1 + 2000).state;
  ok(r2.entries.w1.status === 'discovered', '暴露恢复 + 冷却结束 → 可再次破解');
  const b2 = W.beginWeaknessCrack(r2, defs, NOW + 10000);
  const f2 = W.completeWeaknessCrack(b2.state, defs, false, NOW + 11000);
  ok(f2.state.entries.w1.status === 'locked' && f2.state.entries.w1.attempts === 2, '尝试次数耗尽 → locked');
  ok(f2.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_FAILED), 'CHALLENGE_FAILED 事件');
  const locked = f2.state.entries.w1.lockedUntil;
  const unlocked = W.tickWeakness(f2.state, defs, locked + 1);
  ok(unlocked.changed && unlocked.state.entries.w1.status === 'discovered', '封锁到期 → 恢复可破解');
}

// ================= 暴露 / 恢复 =================
console.log('=== 3. 暴露与恢复 ===');
{
  const d = def();
  const defs = [d];
  let run = create(defs);
  run = observe(run, defs, { kind: 'attack-telegraph', attackType: 'single' }).state;
  run = observe(run, defs, { kind: 'attack-result', result: 'blocked' }).state;
  run = W.tickWeakness(W.startAnalysis(run, defs, NOW + 200).state, defs, NOW + 1500).state;
  run = W.completeWeaknessCrack(W.beginWeaknessCrack(run, defs, NOW + 2000).state, defs, true, NOW + 3000).state;
  const info = W.exposureInfo(run, defs, NOW + 4000);
  ok(info.active && info.damageMultiplier === 1.5 && info.attackCooldownBonus === 1.3, '暴露信息：倍率/冷却');
  ok(info.interruptAttack === true && info.disabledPatternIds.includes('p-x'), '暴露信息：中断/禁用');
  ok(info.remainingMs === 4000, '暴露剩余时间正确');
  const expired = W.tickWeakness(run, defs, run.entries.w1.exposedUntil + 1);
  ok(expired.state.entries.w1.status === 'recovered', '暴露结束 → recovered');
  ok(expired.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_RECOVERED), 'RECOVERED 事件');
  ok(W.exposureInfo(expired.state, defs, NOW + 9999).active === false, '恢复后暴露效果失效');
  const cooled = W.tickWeakness(expired.state, defs, expired.state.entries.w1.cooldownUntil + 1);
  ok(cooled.state.entries.w1.status === 'discovered', '冷却结束 → discovered');
}

// ================= 阶段联动 =================
console.log('=== 4. 阶段联动 ===');
{
  const d0 = def();
  const d1 = def({ weaknessId: 'w2', phaseId: 'bp2', phaseIndex: 1, clues: [{ clueId: 'c21', text: '新阶段线索', sourceLabel: '攻击预警', trigger: { kind: 'attack-telegraph', attackType: 'single' } }] });
  const defs = [d0, d1];
  let run = create(defs);
  run = observe(run, defs, { kind: 'attack-telegraph', attackType: 'single' }).state;
  run = observe(run, defs, { kind: 'attack-result', result: 'blocked' }).state;
  run = W.tickWeakness(W.startAnalysis(run, defs, NOW + 200).state, defs, NOW + 1500).state;
  run = W.completeWeaknessCrack(W.beginWeaknessCrack(run, defs, NOW + 2000).state, defs, true, NOW + 3000).state;
  run = W.setCarryDamage(run, 12, NOW + 3100);
  ok(run.entries.w1.status === 'exposed', '阶段 1 弱点已暴露');
  const synced = W.syncWeaknessPhase(run, defs, 'bp2', 1, NOW + 4000);
  ok(synced.changed && synced.state.phaseIndex === 1 && synced.state.activeWeaknessId === 'w2', '阶段切换加载新阶段弱点');
  ok(synced.state.entries.w1.status === 'recovered', '旧阶段暴露被取消');
  ok(synced.state.entries.w1.clues.length === 2, '旧阶段线索保留');
  ok(W.exposureInfo(synced.state, defs, NOW + 5000).active === false, '旧阶段弱点不影响新阶段');
  ok(synced.state.pendingCarryDamage === 12, '结转伤害保留，等待 store 消费');
  const consumed = W.consumeCarryDamage(synced.state, NOW + 5000);
  ok(consumed.amount === 12 && consumed.state.pendingCarryDamage === 0, '结转伤害可一次性消费');
  const newEntry = synced.state.entries.w2;
  ok(newEntry && newEntry.status === 'hidden', '新阶段弱点从 hidden 开始');
  ok(synced.events.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_CANCELLED), '阶段切换取消事件');
}

// ================= 自愈 =================
console.log('=== 5. 存档自愈 ===');
{
  const d = def();
  const defs = [d];
  const opts = { bossId: 'boss', battleId: 'b1', phaseId: 'bp1', phaseIndex: 0, now: NOW + 5000 };
  const fresh = W.normalizeWeaknessRun(null, defs, opts);
  ok(fresh.entries.w1.status === 'hidden', '空数据 → 安全初始状态');

  let run = create(defs);
  run = observe(run, defs, { kind: 'attack-telegraph', attackType: 'single' }).state;
  run = observe(run, defs, { kind: 'attack-result', result: 'blocked' }).state;
  const analyzing = W.startAnalysis(run, defs, NOW + 100).state;
  const normAnalyzing = W.normalizeWeaknessRun(analyzing, defs, { ...opts, now: NOW + 200 });
  ok(normAnalyzing.entries.w1.status === 'hinted', '刷新时分析中（未完成）→ 安全退回 hinted');
  const normDone = W.normalizeWeaknessRun(analyzing, defs, { ...opts, now: NOW + 2000 });
  ok(normDone.entries.w1.status === 'discovered', '刷新时分析已到期 → discovered');

  const exploiting = W.beginWeaknessCrack(normDone, defs, NOW + 2000).state;
  const normExploit = W.normalizeWeaknessRun(exploiting, defs, { ...opts, now: NOW + 3000 });
  ok(normExploit.entries.w1.status === 'discovered' && normExploit.entries.w1.attempts === 1, '破解中刷新 → 失败恢复，尝试次数保留');

  const exposed = W.completeWeaknessCrack(exploiting, defs, true, NOW + 3000).state;
  const normExposed = W.normalizeWeaknessRun(exposed, defs, { ...opts, now: NOW + 4000 });
  ok(normExposed.entries.w1.status === 'exposed' && normExposed.entries.w1.exposedUntil === exposed.entries.w1.exposedUntil, '暴露中刷新保留剩余时间');
  const normExpired = W.normalizeWeaknessRun(exposed, defs, { ...opts, now: exposed.entries.w1.exposedUntil + 100 });
  ok(normExpired.entries.w1.status === 'recovered', '暴露到期刷新 → recovered');

  const mismatch = W.normalizeWeaknessRun({ ...exposed, battleId: 'old' }, defs, opts);
  ok(mismatch.battleId === 'b1' && mismatch.entries.w1.status === 'hidden', 'battleId 不匹配 → 新战斗重置');
  const dirty = W.normalizeWeaknessRun({
    battleId: 'b1', bossId: 'boss', entries: { w1: { status: 'weird', clues: ['c1', 'c1', 'bad'], attempts: 99, exposedUntil: 'x' }, unknown: {} },
  }, defs, opts);
  ok(dirty.entries.w1.clues.length === 1 && dirty.entries.w1.attempts <= 2, '脏线索去重 / 尝试次数钳制');
  ok(!dirty.entries.unknown, '未知弱点条目被丢弃');
  ok(W.normalizeWeaknessRun({ battleId: 'b1', bossId: 'other' }, defs, opts).entries.w1.status === 'hidden', 'Boss 不匹配 → 重置');

  let closedRun = exposed;
  const closed = W.closeWeaknessRun(closedRun, NOW + 10000);
  ok(closed.state.entries.w1.status === 'recovered' && closed.state.pendingCarryDamage === 0, '战斗结束关闭暴露并清理结转');
}

// ================= 真实目录配置 =================
console.log('=== 6. 弱点目录配置 ===');
{
  const gate = Catalog.weaknessDefinitionsFor('gate-01', 'easy');
  ok(gate.length === 3, 'GATE-01 三个阶段各一个弱点');
  const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
  eq(gate.map(d => d.phaseId), plan.phases.map(p => p.phaseId), '弱点 phaseId 与多阶段配置一致');
  gate.forEach((d, i) => {
    ok(d.clues.length >= 3, 'GATE 阶段 ' + (i + 1) + ' 线索 ≥3');
    ok(!!d.challenge.judge && d.challenge.judge.judgeKind === 'python', 'GATE 阶段 ' + (i + 1) + ' 使用真实 Python 判题');
    ok(d.requiredClues <= d.clues.length, 'GATE 阶段 ' + (i + 1) + ' 所需线索不超过总数');
    ok(d.damageMultiplier > 1, 'GATE 阶段 ' + (i + 1) + ' 有真实伤害倍率');
    ok(d.attackCooldownBonus > 1, 'GATE 阶段 ' + (i + 1) + ' 有攻击冷却干扰');
  });
  ok(gate[1].disableAttackPatternIds.includes('gate-01-p2-lock'), '阶段 2 暴露禁用协议锁定');
  ok(gate[2].disableAttackPatternIds.includes('gate-01-p3-frenzy'), '阶段 3 暴露禁用暴走连击');
  const patterns = Patterns.bossAttackPatterns('gate-01', 'easy');
  for (const d of gate) {
    ok(d.disableAttackPatternIds.every(id => patterns.some(p => p.attackId === id)), d.weaknessId + ' 禁用模式 ID 均真实存在');
  }
  const expert = Catalog.weaknessDefinitionsFor('gate-01', 'expert');
  ok(expert[0].maxAttempts < gate[0].maxAttempts, 'EXPERT 尝试次数更少');
  ok(expert[0].vulnerabilityDuration < gate[0].vulnerabilityDuration, 'EXPERT 暴露时间更短');
  ok(expert[0].requiredClues >= gate[0].requiredClues, 'EXPERT 线索要求不降低');
  for (const bossId of ['somnia', 'index-0', 'judgment-4', 'entropy', 'k0']) {
    const defs = Catalog.weaknessDefinitionsFor(bossId, 'easy');
    const p = Plans.buildBossPhasePlan(bossId, 'easy');
    ok(defs.length === p.phases.length, bossId + ' 每个阶段都有弱点');
    ok(defs.every(d => d.challenge.judge.judgeKind === 'python'), bossId + ' 全部使用真实 Python 判题');
    ok(defs.every(d => d.clues.length >= 2), bossId + ' 线索完整');
  }
  ok(Catalog.weaknessDefinitionsFor('nope', 'easy').length === 0, '未知 Boss 不生成弱点');
}

// ================= 事件 =================
console.log('=== 7. 弱点事件 ===');
{
  const d = def();
  const defs = [d];
  let run = create(defs);
  const steps = [
    observe(run, defs, { kind: 'attack-telegraph', attackType: 'single' }),
  ];
  run = steps[0].state;
  steps.push(observe(run, defs, { kind: 'attack-result', result: 'blocked' }));
  run = steps[1].state;
  steps.push(W.startAnalysis(run, defs, NOW + 200));
  steps.push(W.tickWeakness(steps[2].state, defs, NOW + 1500));
  run = steps[3].state;
  steps.push(W.beginWeaknessCrack(run, defs, NOW + 2000));
  steps.push(W.completeWeaknessCrack(steps[4].state, defs, true, NOW + 3000));
  const evs = steps.flatMap(s => s.events);
  ok(evs.length > 0 && evs.every(e => !!e.id && !!e.battleId && !!e.bossId && !!e.phaseId && !!e.weaknessId && !!e.at), '事件包含 id/battleId/bossId/phaseId/weaknessId/时间戳');
  ok(new Set(evs.map(e => e.id)).size === evs.length, '事件 ID 唯一');
  ok(evs.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_HINT), 'HINT');
  ok(evs.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_DISCOVERED), 'DISCOVERED');
  ok(evs.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_SUCCESS), 'CHALLENGE_SUCCESS');
  ok(evs.some(e => e.type === W.BOSS_BATTLE_EVENTS.WEAKNESS_EXPOSED), 'EXPOSED');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
