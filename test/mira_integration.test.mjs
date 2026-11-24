// V1.3-C MIRA 与真实事件/存档的集成测试（纯逻辑 + Save 自愈）
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
const M = L('src/game/miraCore.ts');
const Save = L('src/services/save.ts');
let pass = 0, total = 0;
const ok = (cond, label, extra = '') => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? '  => ' + extra : '')); };
const NOW = 5000;
let p = Save.defaultState();
const before = JSON.stringify({ level: p.level, exp: p.exp, rewards: p.rewards, settings: p.settings, stats: p.progress.bossBattleStats, archive: p.progress.bossBattleArchive });
let mira = M.normalizeMiraState(p.mira, NOW);
console.log('=== 1. 真实事件来源 ===');
const events = [
  { eventId: 'mira:level:tut-1', xp: 10, source: 'challenge', memoryId: 'mira-first-fix' },
  { eventId: 'mira:explore:syntax', xp: 8, source: 'explore', memoryId: 'mira-first-explore' },
  { eventId: 'mira:story:chapter1', xp: 12, source: 'story', memoryId: 'mira-key-story' },
  { eventId: 'mira:crisis:intrusion-1', xp: 15, source: 'crisis', memoryId: 'mira-major-crisis' },
  { eventId: 'mira:boss:victory:battle-1', xp: 30, source: 'boss', memoryId: 'mira-boss-victory' },
  { eventId: 'mira:achievement:first', xp: 6, source: 'achievement' },
];
for (const e of events) {
  const r = M.miraAward(mira, { ...e, now: NOW });
  ok(r.changed, '真实事件获得成长：' + e.source);
  mira = r.state;
}
ok(mira.exp === 81, '累计经验 81', String(mira.exp));
ok(mira.level === 3 && mira.stage === 'sync', 'Lv3 / 稳定同步');
ok(Object.keys(mira.memories).length === 5, '五条事件记忆解锁');
ok(mira.memories['mira-first-fix'] && mira.memories['mira-first-explore'] && mira.memories['mira-boss-victory'], 'Challenge/Explore/Boss 记忆真实写入');
console.log('=== 2. 幂等 ===');
const expBefore = mira.exp;
for (const e of events) mira = M.miraAward(mira, { ...e, now: NOW + 1 }).state;
ok(mira.exp === expBefore, '重复同一事件不重复经验');
ok(mira.eventLog.length === events.length, '事件日志无重复');
const beforeMem = JSON.stringify(mira.memories);
mira = M.miraUnlockMemory(mira, 'mira-major-crisis', NOW).state;
ok(JSON.stringify(mira.memories) === beforeMem, '重复记忆解锁幂等');
console.log('=== 3. 场景反馈 ===');
const s1 = M.miraSceneLine('boss-enter', mira, {}, NOW + 10);
ok(s1.changed && s1.text.length > 0, 'Boss 场景反馈');
const s2 = M.miraSceneLine('boss-enter', s1.state, {}, NOW + 20);
ok(!s2.changed, '同场景短时间不刷屏');
const s3 = M.miraSceneLine('challenge-fail', s2.state, {}, NOW + 7000);
ok(s3.changed && s3.state.interactions.length <= 30, '失败场景反馈有界');
console.log('=== 4. 风险读取真实状态 ===');
const riskHigh = M.miraRiskFor({ consciousness: 10, crisis: true });
ok(riskHigh[0].level === 'high', '高风险排序');
ok(riskHigh.some(r => r.text.includes('意识')), '意识风险真实');
const riskBoss = M.miraRiskFor({ bossPhase: 2, attackWarning: true });
ok(riskBoss.some(r => r.text.includes('攻击预警')), 'Boss 预警风险真实');
console.log('=== 5. UI 数据 ===');
const prog = M.miraLevelProgress(mira);
ok(prog.level === 3 && prog.pct >= 0 && prog.pct <= 100, 'UI 成长进度');
const summary = M.miraProgressSummary(mira);
ok(summary.label.includes('稳定同步'), 'UI 阶段标签');
console.log('=== 6. Save 兼容 / 业务只读 ===');
p = { ...p, mira };
const json = JSON.stringify(p);
const norm = Save.normalizePlayerState(JSON.parse(json), 10);
ok(JSON.stringify(norm.mira) === JSON.stringify(mira), 'MIRA 数据 Save/读取保持');
const after = JSON.stringify({ level: norm.level, exp: norm.exp, rewards: norm.rewards, settings: norm.settings, stats: norm.progress.bossBattleStats, archive: norm.progress.bossBattleArchive });
ok(after === before, 'MIRA 不修改玩家等级/经验/奖励/设置/统计/归档');
ok(Save.SAVE_VERSION === 10, 'SAVE_VERSION 保持 10');
const old = { ...norm, mira: undefined };
const oldNorm = Save.normalizePlayerState(old, 10);
ok(!!oldNorm.mira && oldNorm.mira.level === 1, '旧存档无 MIRA 安全初始化');
const corrupt = Save.normalizePlayerState({ ...norm, mira: { exp: 'x', level: 99, memories: { bad: 1 } } }, 10);
ok(corrupt.mira.level === 1 && Object.keys(corrupt.mira.memories).length === 0, '损坏 MIRA 安全自愈');
console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
