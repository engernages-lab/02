// A4 挑战会话 / 容错 / 结算 / 迁移 纯逻辑回归
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

const S = L('src/game/challengeSession.ts');
const { migrateSave, CURRENT_SAVE_VERSION } = L('src/services/migrations.ts');

let pass = 0;
let total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

console.log('=== A. 会话创建与生命周期 ===');
{
  const s = S.createSession('1-1', 'level', 1000, 3);
  ok(s.status === 'active' && s.levelId === '1-1' && s.errors === 0 && s.runs === 0, '新建会话为进行中且计数归零');
  ok(s.id === '1-1@1000', '会话 id 含关卡与开始时间', s.id);

  const again = S.beginSession(s, '1-1', 'level', 5000, 3);
  ok(again === s, '进行中的同一关会话被保留（刷新/重进不丢统计）');

  const finished = S.settle(s, S.buildPassedSettlement(S.countError(S.countRun(S.countSubmit(s))), {
    now: 2000, levelBefore: 2, levelAfter: 3, expBefore: 100, expAfter: 160, creditsGained: 30,
  }));
  const replay = S.beginSession(finished, '1-1', 'level', 9000, 4);
  ok(replay.status === 'active' && replay.id !== finished.id && replay.errors === 0, '已结算的关卡重新进入会开新会话');
  ok(finished.status === 'passed', '原会话结算状态保留');

  const other = S.beginSession(finished, '1-2', 'level', 9500, 4);
  ok(other.levelId === '1-2' && other.errors === 0, '进入新关卡不会继承上一关数据');
}

console.log('=== B. 计数：只在进行中累加 ===');
{
  let s = S.createSession('2-1', 'level', 0, 4);
  s = S.countRun(s); s = S.countRun(s); s = S.countSubmit(s); s = S.countError(s); s = S.countHint(s);
  ok(s.runs === 2 && s.submits === 1 && s.errors === 1 && s.hints === 1, '运行/提交/错误/提示分别累加');
  const done = S.settle(s, S.buildFailedSettlement(s, { now: 10, reason: 'x', levelNow: 3, expNow: 0, consciousnessLoss: 30 }));
  const after = S.countRun(S.countSubmit(S.countError(done)));
  ok(after.runs === done.runs && after.errors === done.errors, '已结算的会话不再累加');
}

console.log('=== C. 容错计算：上限 / 剩余 / 升级增量 ===');
{
  ok(S.toleranceRemaining(5, 0) === 5 && S.toleranceRemaining(5, 5) === 0, '剩余容错正常');
  ok(S.toleranceRemaining(5, 9) === 0, '超出上限时剩余为 0（不为负）');
  ok(S.toleranceRemaining(3, -2) === 3, '负数使用量不产生超上限');

  const a = S.toleranceOutcome(2, 3);
  ok(a.maxBefore === 3 && a.maxAfter === 4 && a.gain === 1 && !a.capped, 'Lv2→3 容错 +1', JSON.stringify(a));
  const b = S.toleranceOutcome(3, 4);
  ok(b.gain === 0 && !b.capped && b.nextLevel === 5 && b.nextMax === 5, 'Lv3→4 不增容错，并给出下次提升等级', JSON.stringify(b));
  const c = S.toleranceOutcome(9, 10);
  ok(c.gain === 0 && c.capped === true && c.nextLevel === null, 'Lv9→10 达到最高上限', JSON.stringify(c));
  const d = S.toleranceOutcome(1, 10);
  ok(d.gain === 4 && d.maxAfter === 7 && d.capped, 'Lv1→10 容错 +4 且封顶');
}

console.log('=== D. 成功结算字段 ===');
{
  let s = S.createSession('1-4', 'level', 10000, 4);
  s = S.countRun(s); s = S.countRun(s); s = S.countSubmit(s); s = S.countSubmit(s); s = S.countError(s); s = S.countHint(s);
  const st = S.buildPassedSettlement(s, {
    now: 10000 + 83_000, levelBefore: 3, levelAfter: 4, expBefore: 470, expAfter: 530, creditsGained: 42,
  });
  ok(st.result === 'passed' && st.durationMs === 83000, '耗时来自会话时间戳', String(st.durationMs));
  ok(S.formatDuration(st.durationMs) === '01:23', '耗时格式为 mm:ss', S.formatDuration(st.durationMs));
  ok(st.runs === 2 && st.submits === 2 && st.errors === 1 && st.hints === 1, '运行/提交/错误/提示进入结算');
  ok(st.toleranceMax === 4 && st.toleranceUsed === 1 && st.toleranceRemaining === 3, '容错上限/已用/剩余正确');
  ok(st.expGained === 60 && st.creditsGained === 42, '经验与贡献点增量正确');
  ok(st.toleranceGain === 0 && st.toleranceNextLevel === 5, '逐级结算给出下次容错提升');
  ok(st.levelBefore === 3 && st.levelAfter === 4, '等级前后值正确');
}

console.log('=== E. 失败结算字段 ===');
{
  let s = S.createSession('2-2', 'level', 0, 4);
  for (let i = 0; i < 6; i++) s = S.countError(s);
  const st = S.buildFailedSettlement(s, { now: 5000, reason: '纠错者攻击 · 两次防御失败', levelNow: 5, expNow: 300, consciousnessLoss: 30 });
  ok(st.result === 'failed' && st.errors === 6, '失败结算记录错误次数');
  ok(st.toleranceMax === 4 && st.toleranceUsed === 4 && st.toleranceRemaining === 0, '已用容错封顶到上限，剩余为 0');
  ok(st.resourceLoss && st.resourceLoss.kind === 'consciousness' && st.resourceLoss.amount === 30, '记录实际资源损失');
  ok(/纠错者/.test(st.reason), '保留失败原因');
  ok(st.expGained === 0 && st.creditsGained === 0, '失败不产生奖励');
  const noReason = S.buildFailedSettlement(s, { now: 1, reason: '', levelNow: 5, expNow: 0, consciousnessLoss: 0 });
  ok(noReason.reason === '意识完整度归零', '空原因使用默认文案');
}

console.log('=== F. 结算幂等 ===');
{
  const s = S.createSession('3-1', 'level', 0, 4);
  const st = S.buildPassedSettlement(s, { now: 10, levelBefore: 1, levelAfter: 1, expBefore: 0, expAfter: 0, creditsGained: 0 });
  const once = S.settle(s, st);
  const twice = S.settle(once, { ...st, at: 99, creditsGained: 999 });
  ok(twice === once, '第二次结算被忽略（不会重复发奖）');
  ok(twice.settlement.at === 10 && twice.settlement.creditsGained === 0, '结算数据保持第一次的值');
}

console.log('=== G. 脏数据 / 旧数据兼容 ===');
{
  ok(S.normalizeSession(null) === null && S.normalizeSession({}) === null, '空会话被丢弃');
  const dirty = S.normalizeSession({ levelId: '1-1', status: 'passed', runs: 'x', errors: -5, toleranceMax: NaN, settlement: null });
  ok(dirty.status === 'active' && dirty.endedAt === null, '已结算但无结算体 → 退回进行中');
  ok(dirty.runs === 0 && dirty.errors === 0 && dirty.toleranceMax >= 1, '非法计数被归零、上限至少为 1');
  const badSettle = S.normalizeSettlement({ result: 'unknown' });
  ok(badSettle === null, '非法结算体被丢弃');
  const sessions = {};
  for (let i = 0; i < 20; i++) sessions['l' + i] = S.createSession('l' + i, 'level', i, 3);
  const kept = S.normalizeSessions(sessions);
  ok(Object.keys(kept).length === S.SESSION_KEEP, '会话表按上限裁剪', String(Object.keys(kept).length));
  ok(!!kept['l19'] && !kept['l0'], '保留最近开始的会话');
}

console.log('=== H. 存档迁移 v7 → v8 ===');
{
  ok(CURRENT_SAVE_VERSION === 8, '当前存档版本为 8', String(CURRENT_SAVE_VERSION));
  const r = migrateSave({
    version: 7,
    player: {
      level: 5, exp: 1040, consciousness: 100,
      progress: {
        completedLevels: [], stars: {}, failedAttempts: { '1-1': -3, '1-2': 'x', '1-3': 2.7 },
        hintLevels: {}, achievements: [], knowledge: [], unlockedServers: ['training'],
        storySeen: {}, flags: {},
      },
      meta: { deaths: 0, rebirths: 0, memoryFragments: [], memoryLogs: [] },
      rewards: { credits: 0, trust: 0, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
      settings: {},
    },
  });
  ok(r.player.progress.challengeSessions && typeof r.player.progress.challengeSessions === 'object', '迁移后补上 challengeSessions');
  ok(Object.keys(r.player.progress.challengeSessions).length === 0, '新会话表初始为空');
  ok(r.player.progress.failedAttempts['1-1'] === 0 && r.player.progress.failedAttempts['1-2'] === 0, '非法失败次数被归零');
  ok(r.player.progress.failedAttempts['1-3'] === 2, '正常失败次数保留');
  ok(r.player.level === 5 && r.player.exp === 1040, '迁移不改变等级与经验');

  const old = migrateSave({ version: 3, player: { progress: { completedLevels: ['tut-1'] } } });
  ok(!!old.player.progress.challengeSessions, 'v3 旧档跨版本迁移后同样补齐会话');
  ok(old.notes.length > 0, '迁移返回兼容说明');
}

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
