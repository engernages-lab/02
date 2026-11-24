// V1.3-F.1 P2-01：探索奖励流水 normalize / Save 往返 / 重复领取
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
const Econ = L('src/game/economyConfig.ts');
const Save = L('src/services/save.ts');
const X = L('src/game/explorationCore.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const NOW = 3000;

console.log('=== 1. exploration 账本 normalize ===');
const one = Econ.appendLedger([], { kind: 'exploration', ref: 'signal:training', credits: 5, exp: 0, at: NOW });
ok(one.length === 1 && one[0].kind === 'exploration', 'exploration 可入账');
const normOne = Econ.normalizeLedger(one);
ok(normOne.length === 1 && normOne[0].kind === 'exploration' && normOne[0].ref === 'signal:training', 'exploration 经 normalizeLedger 后保留');
const mixed = Econ.normalizeLedger([
  ...one,
  { kind: 'challenge', ref: 'ind-timed', credits: 8, exp: 4, at: NOW },
  { kind: 'hacked', ref: 'x', credits: 99, exp: 99, at: NOW },
  null,
]);
ok(mixed.length === 2 && mixed.some(x => x.kind === 'exploration') && mixed.some(x => x.kind === 'challenge'), '合法 kind 保留，非法 kind 丢弃');
ok(Econ.normalizeLedger([{ kind: 'exploration', ref: '', credits: 1, exp: 0, at: NOW }]).length === 0, '空 ref 仍被丢弃');

console.log('=== 2. Save / Normalize 往返 ===');
let p = Save.defaultState();
p.rewards = {
  ...p.rewards,
  credits: 25,
  ledger: [...one, ...Econ.appendLedger([], { kind: 'challenge', ref: 'ind-timed', credits: 8, exp: 4, at: NOW + 1 })],
};
const norm = Save.normalizePlayerState(JSON.parse(JSON.stringify(p)), 10);
ok(norm.rewards.credits === 25, '贡献点往返保持');
ok(norm.rewards.ledger.some(x => x.kind === 'exploration' && x.ref === 'signal:training'), 'Refresh → Normalize 后探索流水仍存在');
ok(norm.rewards.ledger.some(x => x.kind === 'challenge'), '其他流水不受影响');
ok(Save.SAVE_VERSION === 10, 'SAVE_VERSION 保持 10');
const legacy = Save.normalizePlayerState({ ...p, rewards: { credits: 12 } }, 10);
ok(Array.isArray(legacy.rewards.ledger) && legacy.rewards.ledger.length === 0, '旧存档缺少 ledger 安全初始化');

console.log('=== 3. 同一探索节点重复领取 ===');
let ex = X.defaultExplorationState(NOW);
const first = X.completeExploreNode(ex, 'training', 'signal:training', ['training'], NOW);
ok(first.changed && first.firstTime && first.credits === 5, '首次调查发放真实节点奖励');
let credits = 0;
let ledger = [];
if (first.firstTime) {
  credits += first.credits;
  ledger = Econ.appendLedger(ledger, { kind: 'exploration', ref: first.node.id, credits: first.credits, exp: 0, at: NOW });
}
ex = first.state;
const second = X.completeExploreNode(ex, 'training', 'signal:training', ['training'], NOW + 1);
ok(!second.changed && second.firstTime === false && second.credits === 0, '重复调查不再发奖');
if (second.firstTime) {
  credits += second.credits;
  ledger = Econ.appendLedger(ledger, { kind: 'exploration', ref: second.node.id, credits: second.credits, exp: 0, at: NOW + 1 });
}
ok(credits === 5, '重复领取贡献点不增加');
ok(normalizeLen(ledger) === 1, '重复领取不产生第二条有效探索流水');

console.log('=== 4. 终端的探索节点 ===');
let st = X.startTerminalChallenge(ex, 'training', 'terminal:training', NOW).state;
ok(st.pendingChallenge?.nodeId === 'terminal:training', '终端建立 pendingChallenge');
const fail = X.completeTerminalChallenge(st, 'tut-1', false, NOW + 2);
ok(!fail.changed && fail.state.pendingChallenge === null, '失败清除 pending，不完成节点');
ok(!fail.state.events['terminal:training'], '失败不写入完成节点');
const retry = X.startTerminalChallenge(fail.state, 'training', 'terminal:training', NOW + 3).state;
const win = X.completeTerminalChallenge(retry, 'tut-1', true, NOW + 4);
ok(win.changed && win.firstTime && win.credits === 10, '成功完成终端并首次发奖');
const dup = X.completeTerminalChallenge(win.state, 'tut-1', true, NOW + 5);
ok(!dup.changed && dup.credits === 0, '重复完成终端不重复发奖');

console.log('=== 5. 流水 + 奖励一致性 ===');
const runLedger = Econ.appendLedger([], { kind: 'exploration', ref: 'terminal:training', credits: win.credits, exp: 0, at: NOW + 4 });
const normRun = Econ.normalizeLedger(runLedger);
ok(normRun.length === 1 && normRun[0].credits === 10, '探索终端流水金额/类型往返一致');

function normalizeLen(list) { return Econ.normalizeLedger(list).length; }

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
