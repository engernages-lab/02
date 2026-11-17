// V1.1.1 三档难度选择端到端：难度界面 / 三档进入 / 题目切换 / 难度锁定 / 放弃重选 / 模拟再战
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4188;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };

const server = createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = normalize(join(distRoot, p));
    if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  } catch { res.writeHead(500); res.end('err'); }
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
process.on('unhandledRejection', () => { /* ignore */ });
const vc = new VirtualConsole();
vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];

function makeSave({ completedLevels = CH1, bossesDone = [], fragments = [], battles = {}, flags = {}, consciousness = 100 } = {}) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 4, exp: 600, consciousness,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: fragments, fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels, stars: {}, unlockedServers: ['training', 'syntax'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      vault: { read: [], finalSeen: false, lastOpened: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true, ...flags },
      bossesDone, battles, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], bossRewards: [], unlocks: [], badges: [] },
    settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 7, updatedAt: Date.now(), player });
}

async function launch(seed) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { if (seed) w.localStorage.setItem('nexus_code_repair_save_v1', seed); },
  });
}

function helpers(dom) {
  const w = dom.window, d = w.document;
  return {
    w, d,
    text: () => d.body.textContent || '',
    q: (s) => d.querySelector(s),
    qa: (s) => Array.from(d.querySelectorAll(s)),
    click: (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })),
    save: () => JSON.parse(w.localStorage.getItem('nexus_code_repair_save_v1') || '{}'),
    async wait(fn, ms, label) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        try { const v = fn(); if (v) return v; } catch { /* retry */ }
        await sleep(100);
      }
      throw new Error('超时: ' + label);
    },
  };
}

async function toMap(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  const skip = h.qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (skip) h.click(skip);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
  h.click(h.qa('button').find(b => b.textContent.includes('继续探索')) || h.qa('button').find(b => b.textContent.includes('开始探索')));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 12000, '地图');
}

async function skipCinema(h) {
  for (let i = 0; i < 20; i++) {
    if (!h.q('.cine-root')) return;
    const skip = h.qa('button').find(b => b.textContent.includes('跳过'));
    if (skip) h.click(skip);
    await sleep(100);
  }
}

async function openBoss(h) {
  h.click(h.qa('.node-group')[1]);
  const btn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('挑战 ▸') || b.textContent.includes('模拟再战')), 8000, 'Boss 入口');
  h.click(btn);
  await sleep(500);
  await skipCinema(h);
  await h.wait(() => h.q('.boss-arena') && h.q('.diff-gate'), 12000, 'Boss + 难度界面');
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：三档难度界面 ----------
  console.log('=== 第一轮：难度选择界面 ===');
  let dom = await launch(makeSave());
  let h = helpers(dom);
  await toMap(h);
  await skipCinema(h);
  await openBoss(h);

  ok(h.qa('.diff-card').length === 3, '出现三张难度卡片');
  ok(h.text().includes('EASY') && h.text().includes('HARD') && h.text().includes('EXPERT'), '三档名称齐全');
  ok(h.text().includes('简单') && h.text().includes('困难') && h.text().includes('专家'), '三档中文名齐全');
  ok(h.text().includes('推荐'), '显示推荐难度');
  ok(!!h.q('.diff-easy') && !!h.q('.diff-hard') && !!h.q('.diff-expert'), '三档独立视觉卡片');
  ok(h.text().includes('考点'), '显示知识点范围');
  ok(h.text().includes('阶段 4'), '显示预计阶段数');
  ok(h.text().includes('测试'), '显示测试数量');
  ok(h.qa('button').some(b => b.textContent.includes('返回章节')), '有返回章节按钮');

  // ---------- 第二轮：进入 HARD，加载 HARD 独立题目 ----------
  console.log('=== 第二轮：HARD 独立题目 ===');
  h.click(h.q('.diff-hard'));
  await sleep(150);
  const startHard = h.qa('button').find(b => b.textContent.includes('开始挑战 HARD'));
  ok(!!startHard, '出现「开始挑战 HARD」按钮');
  h.click(startHard);
  await h.wait(() => !h.q('.diff-gate'), 8000, '难度界面关闭');
  ok(h.text().includes('双路能源闸门'), 'HARD 加载自己的第一阶段题目');
  ok(h.text().includes('HARD · 困难'), 'HUD 显示 HARD');
  const saveHard = h.save();
  ok(saveHard.player.progress.battles['gate-01'].difficulty === 'hard', '战斗难度写入存档');
  ok(saveHard.player.progress.battles['gate-01'].phase === 0, 'HARD 从第一阶段开始');

  // ---------- 第三轮：难度锁定 / 放弃重选 ----------
  console.log('=== 第三轮：难度锁定 ===');
  h.click(h.qa('button').find(b => b.textContent.includes('撤退')));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '回到地图');
  await skipCinema(h);
  await openBoss(h);
  ok(h.text().includes('战斗进行中') || h.text().includes('难度已锁定'), '进行中显示难度锁定提示');
  ok(h.q('.diff-hard').classList.contains('active'), '锁定后当前 HARD 保持选中');
  ok(h.q('.diff-easy').disabled && h.q('.diff-expert').disabled, '其他难度不可切换');
  ok(h.qa('button').some(b => b.textContent.includes('继续挑战 HARD')), '提供继续挑战按钮');
  const abandon = h.qa('button').find(b => b.textContent.includes('放弃本场'));
  ok(!!abandon, '提供放弃本场入口');
  if (abandon) {
    h.click(abandon);
    await sleep(300);
    ok(!h.q('.diff-hard').disabled, '放弃后可以重新选择难度');
  }

  // ---------- 第四轮：进入 EXPERT，加载 EXPERT 独立题目 ----------
  console.log('=== 第四轮：EXPERT 独立题目 ===');
  h.click(h.q('.diff-expert'));
  await sleep(150);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('开始挑战 EXPERT')), 5000, '开始 EXPERT'));
  await h.wait(() => !h.q('.diff-gate'), 8000, '关闭难度界面');
  ok(h.text().includes('能源回路核算'), 'EXPERT 加载自己的第一阶段题目');
  ok(h.text().includes('EXPERT · 专家'), 'HUD 显示 EXPERT');
  ok(h.save().player.progress.battles['gate-01'].difficulty === 'expert', 'EXPERT 难度写入存档');
  dom.window.close();

  // ---------- 第五轮：已首胜 → 模拟再战难度选择 ----------
  console.log('=== 第五轮：模拟再战难度选择 ===');
  const clearedBattle = { hp: 0, maxHp: 100, difficulty: 'easy', phase: 4, phaseMask: [7, 15, 7, 3], failures: 3, cleared: true, updatedAt: 1 };
  dom = await launch(makeSave({ bossesDone: ['gate-01'], fragments: ['frag-01'], battles: { 'gate-01': clearedBattle } }));
  h = helpers(dom);
  await toMap(h);
  await skipCinema(h);
  h.click(h.qa('.node-group')[1]);
  const simBtn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('模拟再战')), 8000, '模拟再战入口');
  ok(!!simBtn, '已首胜提供模拟再战入口');
  h.click(simBtn);
  await sleep(500);
  await skipCinema(h);
  await h.wait(() => h.q('.diff-gate'), 10000, '模拟再战难度界面');
  ok(h.text().includes('已首胜'), '模拟再战界面标记已首胜');
  ok(!h.qa('.diff-card').some(c => c.disabled), '已首胜可自由选择三档难度');
  h.click(h.q('.diff-hard'));
  await sleep(120);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('开始模拟再战 HARD')), 5000, '开始模拟'));
  await h.wait(() => !h.q('.diff-gate'), 8000, '关闭模拟难度界面');
  ok(h.text().includes('双路能源闸门'), '模拟再战加载所选 HARD 题目');
  ok(h.text().includes('模拟再战'), 'HUD 标记模拟再战');
  ok(h.save().player.progress.battles['gate-01'].difficulty === 'hard', '模拟再战难度写入存档');
  ok(h.save().player.progress.battles['gate-01'].cleared === false, '模拟再战重置为进行中');
  dom.window.close();

  // ---------- 第六轮：战斗失败（意识崩解）后重新选择难度 ----------
  console.log('=== 第六轮：失败后重新选择难度 ===');
  dom = await launch(makeSave({ consciousness: 3 }));
  h = helpers(dom);
  await toMap(h);
  await skipCinema(h);
  await openBoss(h);
  h.click(h.q('.diff-hard'));
  await sleep(120);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('开始挑战 HARD')), 5000, '开始 HARD'));
  await h.wait(() => !h.q('.diff-gate'), 8000, '关闭难度界面');
  h.click(h.qa('button').find(b => b.textContent.includes('提交攻击')));
  await h.wait(() => h.q('.cine-root') || h.text().includes('意识核心崩解'), 20000, '意识崩解流程');
  // A4：死亡后先展示「挑战失败结算」，确认后再进入重组对话
  await h.wait(() => h.q('.reb-settle'), 25000, '挑战失败结算');
  ok(/挑战失败/.test(h.q('.reb-settle').textContent), '失败后展示挑战失败结算');
  ok(/容错/.test(h.q('.reb-settle').textContent), '失败结算包含容错数据');
  h.click(h.qa('button').find(b => b.textContent.includes('重新挑战')));
  await h.wait(() => h.q('.dlg-text'), 15000, '重生对话');
  for (let i = 0; i < 60 && !h.q('.diff-gate'); i++) {
    const sk = h.qa('button').find(b => b.textContent.includes('跳过'));
    if (sk) h.click(sk);
    const txt = h.q('.dlg-text');
    if (txt) h.click(txt);
    await sleep(150);
  }
  await h.wait(() => h.q('.diff-gate'), 15000, '重生后重新打开难度界面');
  ok(!!h.q('.diff-gate'), '战斗失败/重生后重新出现难度选择');
  ok(!h.q('.diff-hard').disabled, '失败后可以重新选择难度');
  const reborn = h.save();
  ok(reborn.player.progress.battles['gate-01'].started === false, '失败重生后战斗进度重置');
  ok(reborn.player.progress.battles['gate-01'].hp === 100, '失败重生后 Boss 血量重置');
  dom.window.close();

  server.close();
  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  process.exit(pass === total ? 0 : 1);
})().catch(e => {
  console.error('E2E 失败:', e && e.message ? e.message : e);
  server.close();
  process.exit(1);
});
