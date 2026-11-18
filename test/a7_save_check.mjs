// A7 存档安全验收：历史迁移链、异常数据自愈、幂等性、重复流水清理
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
const cache = new Map();
function load(file) {
  const abs = extname(file) ? file : existsSync(file + '.ts') ? file + '.ts' : file;
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = readFileSync(abs, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  cache.set(abs, mod);
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
  return mod.exports;
}
const L = (rel) => load(join(root, rel));

const S = L('src/services/save.ts');
const M = L('src/services/migrations.ts');
const E = L('src/game/economyConfig.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

function basePlayer(over = {}) {
  return {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1700000000000 },
    level: 5, exp: 1040, consciousness: 100,
    meta: {
      deaths: 1, rebirths: 1, lastDeathLevel: '1-1', lastDeathReason: 'x',
      memoryFragments: ['f1', 'frag-01'], memoryLogs: [], fragmentLog: {},
    },
    progress: {
      completedLevels: ['tut-1', '1-1'], stars: { '1-1': 3 },
      unlockedServers: ['training', 'syntax'], currentLevelId: null,
      failedAttempts: { '1-1': 0 }, hintLevels: { '1-1': 1 }, achievements: ['first_repair'],
      knowledge: ['print'], storySeen: { '1-1': true },
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true }, bossesDone: ['gate-01'], currentBossId: null, pendingRebirth: false,
    },
    rewards: {
      credits: 500, trust: 40, items: { scan: 2 }, skins: ['frame-bronze'],
      equipped: { avatarFrame: 'frame-bronze' }, chapterRewards: ['ch1'],
      cleared: { '1-1': { grade: 'S', fails: 0, hints: 0, credits: 90, trust: 4 } },
      archiveRead: [], bossRewards: [], unlocks: [], badges: [], difficultyRewards: [],
    },
    settings: { musicVolume: 0.2, sfxVolume: 0.4, animations: true, animLevel: 'high', typewriterMs: 20, fullscreen: false, lang: 'zh' },
    ...over,
  };
}

console.log('=== A. 历史版本逐级迁移 ===');
for (const version of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const p = basePlayer();
  const r = M.migrateSave({ version, player: p });
  const n = S.normalizePlayerState(r.player, version);
  const credits = n.rewards.credits;
  const frags = n.meta.memoryFragments;
  const bosses = n.progress.bossesDone;
  const inventory = n.rewards.items.scan;
  ok(Number.isFinite(n.exp) && Number.isFinite(n.level) && n.level >= 1 && n.level <= 10, 'v' + version + '：等级/经验合法');
  ok(Number.isFinite(credits) && credits >= 0 && credits <= E.ECONOMY.caps.credits, 'v' + version + '：贡献点合法', String(credits));
  ok(frags.includes('f1') && frags.includes('frag-01'), 'v' + version + '：记忆碎片保留', JSON.stringify(frags));
  ok(bosses.includes('gate-01'), 'v' + version + '：Boss 记录保留', JSON.stringify(bosses));
  ok(inventory === 2, 'v' + version + '：背包库存保留', String(inventory));
  ok(n.progress.completedLevels.includes('1-1'), 'v' + version + '：关卡进度保留');
}

console.log('=== B. 迁移幂等 ===');
{
  const first = S.normalizePlayerState(M.migrateSave({ version: 7, player: basePlayer() }).player, 7);
  const second = S.normalizePlayerState(M.migrateSave({ version: 10, player: first }).player, 10);
  ok(second.rewards.credits === first.rewards.credits, '重复迁移不改变贡献点', first.rewards.credits + ' → ' + second.rewards.credits);
  ok(second.exp === first.exp, '重复迁移不改变经验');
  ok(JSON.stringify(second.meta.memoryFragments) === JSON.stringify(first.meta.memoryFragments), '重复迁移不改变碎片');
  ok(JSON.stringify(second.rewards.ledger) === JSON.stringify(first.rewards.ledger), '重复迁移不产生重复奖励流水');
}

console.log('=== C. 异常存档自愈 ===');
{
  const dirty = basePlayer({
    level: -8, exp: -99, consciousness: 999,
    meta: { ...basePlayer().meta, deaths: NaN, rebirths: Infinity, memoryFragments: ['f1', 'f1', 42, 'nope', 'frag-01', 'f8'] },
    progress: {
      ...basePlayer().progress,
      completedLevels: ['1-1', '1-1', 7, 'no-such-level', 'tut-1'],
      stars: { '1-1': 99, '1-2': -3, 'bad': 2 },
      failedAttempts: { '1-1': -5, '1-2': NaN, '1-3': 2.6, 'bad': 9, 'gate-01': 2 },
      hintLevels: { '1-1': -1, '1-2': 999 },
      unlockedServers: ['training', 'hack'],
      knowledge: ['print', 'print', 'nope', 5],
      achievements: ['first_repair', 'first_repair', 'nope'],
      bossesDone: ['gate-01', 'gate-01', 'nope'],
      endings: ['e1', 'e1'],
    },
    rewards: {
      ...basePlayer().rewards,
      credits: 1e12, trust: 500, items: { scan: -2, rollback: 1.9, bad: NaN },
      skins: ['frame-bronze', 'frame-bronze'],
      transactions: [{ itemId: 'scan', qty: -5, total: NaN, status: 'weird' }, { itemId: 'scan', qty: 1, unitPrice: 50, total: 50, status: 'ok', at: 10 }, null],
      purchases: { scan: -2, rollback: 2.4 },
      buffs: { shield: 99, guard: -1, barrier: 'x', hintTicket: 1, expBoost: { uses: 99, mult: 0.2 } },
      ledger: [
        { kind: 'level', ref: '1-1', credits: 90, exp: 60, at: 1 },
        { kind: 'level', ref: '1-1', credits: 90, exp: 60, at: 2 },
        { kind: 'bad', ref: 'x', credits: 1, exp: 1, at: 3 },
        null,
      ],
    },
  });
  const n = S.normalizePlayerState(dirty, 10);
  ok(n.exp === 0 && n.level === 1, '负数经验归零且等级由经验推导', n.exp + '/' + n.level);
  ok(n.consciousness === 100, '意识值夹到 100');
  ok(n.rewards.credits === E.ECONOMY.caps.credits, '超大贡献点夹到上限', String(n.rewards.credits));
  ok(n.rewards.trust === 100, '信任度夹到 100');
  ok(n.rewards.items.scan === undefined && n.rewards.items.rollback === 1, '库存负数丢弃、小数取整', JSON.stringify(n.rewards.items));
  ok(n.rewards.skins.length === 1, '外观去重');
  ok(n.meta.memoryFragments.filter((x) => x === 'f1').length === 1, '碎片去重');
  ok(!n.meta.memoryFragments.includes('nope') && !n.meta.memoryFragments.some((x) => typeof x !== 'string'), '无效碎片 ID 被过滤');
  ok(n.progress.completedLevels.filter((x) => x === '1-1').length === 1 && n.progress.completedLevels.includes('tut-1'), '关卡完成去重且保留合法项');
  ok(!n.progress.completedLevels.includes('no-such-level'), '不存在的关卡 ID 被过滤');
  ok(n.progress.stars['1-1'] === 3 && n.progress.stars['1-2'] === undefined, '星级夹到 0..3 且过滤未知关卡');
  ok(n.progress.failedAttempts['1-1'] === undefined && n.progress.failedAttempts['1-3'] === 2, '失败计数非负且过滤未知关卡');
  ok(n.progress.failedAttempts['gate-01'] === 2 && n.progress.failedAttempts['bad'] === undefined, 'Boss 失败计数保留（不是关卡 id 也要保留）', JSON.stringify(n.progress.failedAttempts));
  ok(n.progress.hintLevels['1-2'] === 99 && n.progress.hintLevels['1-1'] === undefined, '提示层数夹取且过滤非法值');
  ok(!n.progress.unlockedServers.includes('hack') && n.progress.unlockedServers.includes('training'), '非法服务器被过滤');
  ok(n.progress.knowledge.length === 1 && n.progress.achievements.length === 1, '知识点与成就去重/过滤');
  ok(n.progress.bossesDone.length === 1 && n.progress.endings.length === 1, 'Boss 记录与结局去重');
  ok((n.rewards.transactions || []).length === 1, '非法交易记录被清洗', JSON.stringify(n.rewards.transactions));
  ok(n.rewards.purchases.scan === undefined && n.rewards.purchases.rollback === 2, '限购计数清洗');
  ok(n.rewards.buffs.shield === 3 && n.rewards.buffs.guard === 0 && n.rewards.buffs.barrier === 0, '增益层数夹到 0..3');
  ok(n.rewards.buffs.expBoost === null, '非法倍率增幅被丢弃');
  ok((n.rewards.ledger || []).length === 1, '账本去重并丢弃非法行', JSON.stringify(n.rewards.ledger));
}

console.log('=== D. 空/缺字段存档 ===');
{
  const empty = S.normalizePlayerState({ name: 'X' }, 10);
  ok(empty.level === 1 && empty.exp === 0 && empty.consciousness === 100, '缺字段存档可用且不崩溃', empty.consciousness + '');
  ok(empty.rewards.credits === 0 && Array.isArray(empty.progress.completedLevels), '缺奖励字段补默认');
  const badJson = S.importSave('{not-json');
  ok(!badJson.ok && !!badJson.reason, '损坏 JSON 被拒绝并给出原因', badJson.reason);
  const nullPlayer = S.importSave(JSON.stringify({ version: 10, player: null }));
  ok(!nullPlayer.ok, '空 player 存档被拒绝而不是白屏');
  const good = S.importSave(JSON.stringify({ version: 10, player: basePlayer() }));
  ok(good.ok && good.state && good.state.progress.completedLevels.includes('1-1'), '正常存档可安全导入');
  const noProgress = S.normalizePlayerState({ name: 'Y', exp: 10, meta: {}, progress: {}, rewards: {} }, 1);
  ok(noProgress.level === 1 && noProgress.progress.completedLevels.length === 0, '缺 progress 不崩溃');
}

console.log('=== E. 当前版本存档不被旧逻辑覆盖 ===');
{
  const current = S.normalizePlayerState(M.migrateSave({ version: 10, player: basePlayer() }).player, 10);
  ok(current.rewards.credits === 500 && current.exp === 1040, 'v10 存档数值不变');
  ok(current.progress.completedLevels.includes('1-1') && current.progress.bossesDone.includes('gate-01'), 'v10 进度不变');
  ok(current.meta.memoryFragments.includes('frag-01'), '创作者碎片保留');
}

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
