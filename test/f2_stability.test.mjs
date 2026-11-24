// V1.3-F.2 边缘稳定性：Save / Economy / MIRA / Achievement / Explore / Challenge Session
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
const Econ = L('src/game/economyConfig.ts');
const M = L('src/game/miraCore.ts');
const Ach = L('src/game/achievements.ts');
const X = L('src/game/explorationCore.ts');
const CS = L('src/game/challengeSession.ts');
const P = L('src/game/progression.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const NOW = 5000;

console.log('=== 1. Save / Recovery ===');
let p = Save.defaultState();
p.level = 999;
p.exp = -100;
p.consciousness = 999;
p.progress.completedLevels = ['not-a-level', 'tut-1'];
p.progress.achievements = ['first_repair', 'hacked-achievement'];
p.progress.exploration = { version: 1, events: { 'bad': { status: 'x' } }, hidden: { 'hidden:training:echo': { title: 'x' } } };
const norm = Save.normalizePlayerState(p, 10);
ok(norm.level === 1 && norm.exp === 0, '非法等级/经验自愈');
ok(norm.consciousness === 100, '意识夹取 0–100');
ok(norm.progress.completedLevels.length === 1 && norm.progress.completedLevels[0] === 'tut-1', '非法关卡 ID 过滤');
ok(norm.progress.achievements.includes('first_repair') && !norm.progress.achievements.includes('hacked-achievement'), '非法成就 ID 过滤');
ok(!!norm.progress.exploration && !!norm.mira, '缺失 MIRA/Explore 安全初始化');
ok(Save.SAVE_VERSION === 10, 'SAVE_VERSION 10');

const store = new Map();
globalThis.localStorage = {
  getItem: k => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};
store.set('nexus_code_repair_save_v1', '{broken json');
const corrupt = Save.loadGame();
ok(corrupt.fresh === true && !!corrupt.corrupted, '损坏 JSON 安全重置并提示');
store.set('nexus_code_repair_save_v1', JSON.stringify({ version: 10, player: { name: 'R', level: 1, exp: 0, consciousness: 100, meta: { deaths: 0 }, progress: { completedLevels: [] }, settings: { sfxVolume: 0 } } }));
const legacy = Save.loadGame();
ok(legacy.fresh === false && legacy.state.progress.exploration && legacy.state.mira, '旧档缺失字段自动补齐');

console.log('=== 2. Economy / Ledger ===');
ok(Econ.safeCredits(-1) === 0 && Econ.safeExp(-1) === 0, '非法货币/经验归零');
ok(Econ.normalizeLedger([]).length === 0, '空 Ledger 安全');
const explorationLedger = Econ.normalizeLedger([
  { kind: 'exploration', ref: 'signal:training', credits: 5, exp: 0, at: NOW },
  { kind: 'exploration', ref: 'terminal:training', credits: 10, exp: 0, at: NOW + 1 },
  { kind: 'hacked', ref: 'x', credits: 99, exp: 0, at: NOW + 2 },
]);
ok(explorationLedger.length === 2 && explorationLedger.every(x => x.kind === 'exploration'), '探索流水保留，非法 kind 丢弃');
const oneTime = Econ.appendLedger([], { kind: 'level', ref: 'tut-1', credits: 30, exp: 40, at: NOW });
ok(Econ.appendLedger(oneTime, { kind: 'level', ref: 'tut-1', credits: 30, exp: 40, at: NOW + 1 }) === oneTime, '首通流水不重复追加');

console.log('=== 3. MIRA / Achievement ===');
let mira = M.defaultMiraState(NOW);
const a1 = M.miraAward(mira, { eventId: 'mira:test:1', xp: 30, source: 'test', memoryId: 'mira-first-fix', now: NOW });
mira = a1.state;
const a2 = M.miraAward(mira, { eventId: 'mira:test:1', xp: 30, source: 'test', now: NOW + 1 });
ok(a1.changed && !a2.changed && a2.state.exp === 30, 'MIRA 同事件不重复 XP');
ok(!!mira.memories['mira-first-fix'] && mira.eventLog.filter(x => x === 'mira:test:1').length === 1, 'MIRA 记忆/事件日志唯一');
const achP = { ...p, mira, progress: { ...p.progress, completedLevels: ['tut-1'], achievements: ['first_repair'] } };
const recalc1 = Ach.recalcAchievements(achP);
const recalc2 = Ach.recalcAchievements({ ...achP, progress: { ...achP.progress, achievements: recalc1 } });
ok(recalc1.length === recalc2.length && recalc1.every(x => recalc2.includes(x)), '成就重复重算幂等');
ok(recalc1.includes('training_done'), '真实关卡触发新成就');

console.log('=== 4. Explore 边缘 ===');
let ex = X.defaultExplorationState(NOW);
const locked = X.completeExploreNode(ex, 'syntax', 'signal:syntax', ['training'], NOW);
ok(!locked.changed && locked.credits === 0, '未解锁区域不能完成节点');
const beforeHidden = X.completeExploreNode(ex, 'training', 'hidden:training:echo', ['training'], NOW);
ok(!beforeHidden.changed, '区域未完成时隐藏信号不可领取');
const sig = X.completeExploreNode(ex, 'training', 'signal:training', ['training'], NOW);
const sig2 = X.completeExploreNode(sig.state, 'training', 'signal:training', ['training'], NOW + 1);
ok(sig.changed && sig.firstTime && !sig2.changed && sig2.credits === 0, '同一节点只发一次探索奖励');
const start = X.startTerminalChallenge(sig.state, 'training', 'terminal:training', NOW + 2);
const fail = X.completeTerminalChallenge(start.state, 'tut-1', false, NOW + 3);
ok(!fail.changed && fail.state.pendingChallenge === null && !fail.state.events['terminal:training'], '终端失败不完成节点');
const start2 = X.startTerminalChallenge(fail.state, 'training', 'terminal:training', NOW + 4);
const win = X.completeTerminalChallenge(start2.state, 'tut-1', true, NOW + 5);
const win2 = X.completeTerminalChallenge(win.state, 'tut-1', true, NOW + 6);
ok(win.changed && win.firstTime && !win2.changed, '终端成功仅首次发奖');

console.log('=== 5. Challenge Session ===');
let s = CS.createSession('tut-1', 'level', NOW, P.toleranceFor(1));
s = CS.countError(CS.countError(CS.countSubmit(s)));
const passSettle = CS.buildPassedSettlement(s, { now: NOW + 10, levelBefore: 1, levelAfter: 2, expBefore: 70, expAfter: 110, creditsGained: 67 });
ok(passSettle.expGained === 40 && passSettle.toleranceRemaining === 1 && passSettle.toleranceUsed === 2, '失败 2 次后结算容错正确');
ok(s.status === 'active', '结算函数不修改原会话（由 store 唯一落盘）');
const failSettle = CS.buildFailedSettlement(s, { now: NOW + 11, reason: 'judge-failed', levelNow: 1, expNow: 70, consciousnessLoss: 0 });
ok(failSettle.result === 'failed' && failSettle.resourceLoss?.amount === 0, '判题失败不伪造死亡/意识损失');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
