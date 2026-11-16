// V1.1.1 三档难度真实通关：EASY / HARD / EXPERT 各跑一遍六章主线，
// 所有 72 个阶段都用真实 MicroPython 执行正确解；同时验证初始故障版不造成伤害。
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { DIFFICULTY_SOLUTIONS } from './difficulty_solutions.mjs';

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
const B = L('src/game/battle.ts');
const J = L('src/services/judge.ts');
const BF = L('src/game/bossDifficulties.ts');
const CF = L('src/game/chapterFlow.ts');
const SV = L('src/services/save.ts');
const CH = L('src/game/lore/chapters.ts');
const LV = L('src/game/levels.ts');
const F = L('src/game/lore/fragments.ts');
const E = L('src/game/economy.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; }
  else { console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); }
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const RUNNER = readFileSync(join(root, 'test/_mp_runner.py'), 'utf8');
let raw = '';
const mp = await loadMicroPython({
  url: join(root, 'node_modules/@micropython/micropython-webassembly-pyscript/micropython-settrace.wasm'),
  stdout: (s) => { raw += s; },
  stderr: (s) => { raw += s; },
});

function runCode(code) {
  raw = '';
  mp.runPython(RUNNER.replace('__NX_SRC__', JSON.stringify(String(code))));
  const i = raw.lastIndexOf('__NX_RES__');
  if (i < 0) return { ok: false, stdout: '', timedOut: false, error: { type: 'NoResult', message: 'no result' } };
  try {
    const r = JSON.parse(raw.slice(i + '__NX_RES__'.length).trim());
    return {
      ok: !r.err,
      stdout: r.out || '',
      timedOut: false,
      error: r.err ? { type: String(r.err).split(':')[0] || 'Error', message: String(r.err) } : undefined,
    };
  } catch {
    return { ok: false, stdout: '', timedOut: false, error: { type: 'ParseFail', message: 'parse fail' } };
  }
}

function finishLevels(p, order) {
  const ch = CH.CHAPTERS.find(c => c.order === order);
  const ids = LV.levelsOfServer(ch.serverId).map(l => l.id);
  p.progress.completedLevels = [...new Set([...p.progress.completedLevels, ...ids])];
  p.progress.flags[ch.doneFlag] = true;
}

const chapters = [...CH.CHAPTERS];
let runs = 0;
const summary = [];

for (const difficulty of ['easy', 'hard', 'expert']) {
  console.log('=== 难度 ' + difficulty.toUpperCase() + ' 六章真实通关 ===');
  let player = SV.defaultState();
  const expectedFragments = [];
  for (const ch of chapters) {
    const bossId = ch.currentBossId;
    const def = BF.bossBattleDef(bossId, difficulty);
    if (!def) { check(false, bossId + '/' + difficulty + ' 配置存在'); continue; }
    if (ch.order <= 5) finishLevels(player, ch.order);
    else finishLevels(player, 6);

    const gate = CF.bossGate(player, bossId);
    check(gate.available, bossId + ' ' + difficulty + ' 门禁开放', gate.reason);

    let state = B.createBattleState(def);
    for (const [idx, phase] of def.phases.entries()) {
      // 初始故障代码：真实执行，必须不造成新伤害
      const init = runCode(J.combineWithHarness(phase.initialCode, J.buildHarness(phase.judge.pythonChecks || [])));
      const iv = J.judgeRun(phase.judge, init);
      const ires = B.resolveSubmission(def, state, idx, iv.checks);
      check(ires.newPassed === 0 && ires.damage === 0, phase.id + ' 初始故障版 0 伤害');
      check(!iv.passed, phase.id + ' 初始故障版不能直接通过');

      const fixed = DIFFICULTY_SOLUTIONS[phase.id];
      check(!!fixed, phase.id + ' 有参考解');
      if (!fixed) continue;
      const sr = runCode(J.combineWithHarness(fixed, J.buildHarness(phase.judge.pythonChecks || [])));
      runs++;
      const sv = J.judgeRun(phase.judge, sr);
      check(sv.passed, phase.id + ' 正确解真实通过' + (sr.error ? ' [' + sr.error.type + ']' : ''));
      const res = B.resolveSubmission(def, state, idx, sv.checks);
      check(res.phaseCleared, phase.id + ' 阶段击破');
      state = {
        ...state,
        hp: res.hpAfter,
        phase: res.phaseAfter,
        phaseMask: state.phaseMask.map((m, i) => (i === idx ? res.mask : m)),
        cleared: false,
        updatedAt: 1,
      };
    }
    state.cleared = CF.verifyBattleState(def, state).ok;
    check(state.hp === 0 && state.cleared, bossId + ' 四阶段击破、血量归零');
    player.progress.battles = { ...(player.progress.battles || {}), [bossId]: state };

    const fc = CF.handleBossFirstClear(player, bossId, { difficulty, now: 1000 + ch.order });
    check(fc.changed, bossId + ' 首胜事务执行');
    if (!fc.changed) { console.log('  reason:', fc.reason); break; }
    player = fc.player;
    expectedFragments.push(ch.fragmentId);
    eq(F.ownedFragments(player.meta.memoryFragments), expectedFragments, bossId + ' 碎片按顺序归位');
    check(player.progress.chapters[ch.id].completed, bossId + ' 章节完成');
    if (difficulty !== 'easy') {
      check(player.rewards.badges.includes(E.bossDifficultyBadgeId(bossId, difficulty)), bossId + ' 获得 ' + difficulty + ' 徽章');
    }
    if (ch.order < 6) check(CF.chapterGate(player, chapters[ch.order].id).unlocked, '第 ' + (ch.order + 1) + ' 章解锁');
    // 重复首胜幂等
    const again = CF.handleBossFirstClear(player, bossId, { difficulty, now: 9000 });
    check(!again.changed, bossId + ' 重复首胜幂等');
  }
  check(F.finalMemoryUnlocked(player.meta.memoryFragments), difficulty + ' 六枚碎片齐备');
  check(player.progress.chapters.ch6.completed, difficulty + ' 终章完成');
  if (difficulty === 'expert') {
    check(player.rewards.skins.includes('title-expert'), 'EXPERT 通关解锁专家称号');
    check((player.rewards.badges || []).filter(id => id.includes('expert')).length === 6, 'EXPERT 六枚专家徽章');
  }
  summary.push({ difficulty, exp: player.exp, credits: player.rewards.credits, badges: (player.rewards.badges || []).length });
}

console.log('\n=== 汇总 ===');
for (const s of summary) console.log(s.difficulty.toUpperCase() + ' 通关：经验 ' + s.exp + '，贡献点 ' + s.credits + '，徽章 ' + s.badges);
check(summary.find(s => s.difficulty === 'expert').exp > summary.find(s => s.difficulty === 'easy').exp, 'EXPERT 经验高于 EASY');
check(summary.find(s => s.difficulty === 'hard').exp > summary.find(s => s.difficulty === 'easy').exp, 'HARD 经验高于 EASY');
check(summary.find(s => s.difficulty === 'expert').credits > summary.find(s => s.difficulty === 'hard').credits, 'EXPERT 贡献点高于 HARD');

console.log('真实执行：' + runs + ' 次正确解（另含 72 次初始故障版）');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
