// V1.3-E 成长 × 探索 × 成就 × MIRA × 存档 集成测试
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
const G = L('src/game/playerGrowthCore.ts');
const P = L('src/game/progression.ts');
const A = L('src/game/achievements.ts');
const E = L('src/game/explorationCore.ts');
const M = L('src/game/miraCore.ts');
const Save = L('src/services/save.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const NOW = 2000;

console.log('=== 1. 挑战 → 经验 → 等级 → 容错 ===');
let p = Save.defaultState();
p.exp = 70;
p.level = P.levelForExp(70);
ok(p.level === 1 && P.toleranceFor(p.level) === 3, '初始 Lv1 / 容错 3');
p.exp += 40;
const beforeLevel = p.level;
p.level = P.levelForExp(p.exp);
ok(p.level === 2 && beforeLevel === 1, '经验 110 → Lv2（单次挑战内升级）');
ok(P.toleranceFor(p.level) === 3 && P.toleranceFor(5) === 5, '升级后容错按真实等级读取');
const growthBefore = G.growthOverviewFor(p, 26);
ok(growthBefore.level === 2 && growthBefore.into === 10, '成长总览读取升级后经验');

console.log('=== 2. 连续失败 → 风险 → MIRA 提示 ===');
let failures = 0;
ok(G.riskStatusFor({ consciousness: 100, level: p.level, failures }).level === 'NORMAL', '0 失败 NORMAL');
failures++;
ok(G.riskStatusFor({ consciousness: 100, level: p.level, failures }).level === 'WARNING', '1 失败 WARNING');
failures++;
ok(G.riskStatusFor({ consciousness: 100, level: p.level, failures }).level === 'DANGER', '2 失败 DANGER');
failures++;
const critical = G.riskStatusFor({ consciousness: 100, level: p.level, failures });
ok(critical.level === 'CRITICAL' && critical.toleranceRemaining === 0, '3 失败 CRITICAL / 容错耗尽');
const hints = M.miraRiskFor({ consciousness: 100, consecutiveFails: failures });
ok(hints[0].level === 'high' && /连续失败/.test(hints[0].text), 'MIRA 读取真实连续失败');
const lowHints = M.miraRiskFor({ consciousness: 25 });
ok(lowHints.some(h => /低于 30%/.test(h.text)), 'MIRA 读取真实低意识');

console.log('=== 3. 探索 → 成长 → 成就 ===');
let ex = E.defaultExplorationState(NOW);
let st = E.discoverRegion(ex, 'training', NOW).state;
st = E.completeExploreNode(st, 'training', 'signal:training', ['training'], NOW).state;
st = E.completeExploreNode(st, 'training', 'ruin:training', ['training'], NOW).state;
const started = E.startTerminalChallenge(st, 'training', 'terminal:training', NOW);
ok(!!started.pending && started.pending.levelId === 'tut-1', '探索终端复用真实关卡');
st = E.completeTerminalChallenge(started.state, 'tut-1', true, NOW).state;
ok(E.regionStatus(st, 'training', ['training']) === 'COMPLETED', '区域完成');
st = E.completeExploreNode(st, 'training', 'hidden:training:echo', ['training'], NOW).state;
p.progress = { ...p.progress, exploration: st, unlockedServers: ['training'], stars: { 'tut-1': 3 } };
const o1 = G.growthOverviewFor(p, 26);
ok(o1.regionsCompleted === 1 && o1.nodesCompleted >= 3 && o1.explorePct > 0, '探索数据进入成长总览');
let ids = A.recalcAchievements(p);
ok(ids.includes('explorer_first') && ids.includes('hidden_signal'), '真实探索触发 2 个新成就');
p.progress = { ...p.progress, achievements: [...p.progress.achievements, ...ids.filter(i => !p.progress.achievements.includes(i))] };
const o2 = G.growthOverviewFor(p, 26);
ok(o2.achievementCount === p.progress.achievements.length && o2.achievementCount > 0, '成就数同步成长总览');
const ids2 = A.recalcAchievements(p);
ok(ids2.length === ids.length && ids2.every(i => ids.includes(i)), '重复重算幂等');

console.log('=== 4. 成就奖励幂等（MIRA） ===');
let mira = M.defaultMiraState(NOW);
const rewardA = M.miraAward(mira, { eventId: 'mira:achievement:explorer_first', xp: 6, source: 'achievement', now: NOW });
ok(rewardA.changed && rewardA.state.exp === 6, '首次成就奖励发放');
const rewardB = M.miraAward(rewardA.state, { eventId: 'mira:achievement:explorer_first', xp: 6, source: 'achievement', now: NOW });
ok(!rewardB.changed && rewardB.state.exp === 6, '重复成就奖励不重复发放');
const achMira = A.recalcAchievements({ ...p, mira: rewardB.state });
ok(achMira.length === ids.length, 'MIRA 奖励不改变成就集合');

console.log('=== 5. 危机成就 ===');
const crisis = { ...p, mira: M.normalizeMiraState({ memories: { 'mira-major-crisis': { unlockedAt: NOW, read: false } } }, NOW) };
const cIds = A.recalcAchievements(crisis);
ok(cIds.includes('crisis_handler'), '真实危机记忆触发危机处理者');
ok(!A.recalcAchievements(p).includes('crisis_handler'), '未经历危机不会误触发');

console.log('=== 6. 存档兼容 ===');
const cloned = JSON.parse(JSON.stringify({ ...p, mira: rewardB.state }));
const norm = Save.normalizePlayerState(cloned, 10);
ok(norm.level === 2 && norm.exp === 110, '等级/经验往返保持');
ok(!!norm.progress.exploration.hidden['hidden:training:echo'], '隐藏探索往返保持');
ok(norm.mira.exp === 6 && norm.mira.eventLog.includes('mira:achievement:explorer_first'), 'MIRA 经验/事件日志往返保持');
ok(norm.progress.achievements.includes('explorer_first'), '成就往返保持');
const legacy = Save.normalizePlayerState({ ...Save.defaultState(), version: 10, progress: { ...p.progress, exploration: undefined, achievements: undefined } }, 10);
ok(!!legacy.progress.exploration && Array.isArray(legacy.progress.achievements), '旧存档字段缺失自愈');
const abnormal = Save.normalizePlayerState({ ...p, level: 99, exp: -5 }, 10);
ok(abnormal.level >= 1 && abnormal.level <= 10 && abnormal.exp >= 0, '异常等级/经验修正');
const riskNorm = G.riskStatusFor({ consciousness: 100, level: norm.level });
ok(riskNorm.label && riskNorm.hint, '风险状态可展示');

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
