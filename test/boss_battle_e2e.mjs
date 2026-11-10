// Boss 战端到端：独立界面 / 血条 / 阶段 / 反击 / 撤退后进度保留 / 已击破状态
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4179;
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
process.on('unhandledRejection', () => { /* jsdom 资源拒绝忽略 */ });
const vc = new VirtualConsole();
vc.on('error', () => {});
vc.on('warn', () => {});
vc.on('jsdomError', () => {});

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];

function makeSave({ battles, bossesDone = [], consciousness = 100, seenIntro = true, flags = {} } = {}) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: seenIntro ? { 'bossIntro_gate-01': true } : {},
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true, ...flags },
      bossesDone, battles: battles || {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 6, updatedAt: Date.now(), player });
}

async function launch(seed) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { if (seed) window.localStorage.setItem('nexus_code_repair_save_v1', seed); },
  });
}

function helpers(dom) {
  const w = dom.window, d = w.document;
  return {
    w, d,
    text: () => d.body.textContent || '',
    q: (s) => d.querySelector(s),
    qa: (s) => Array.from(d.querySelectorAll(s)),
    click: (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })),
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

async function enterMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  const skipBtn = h.qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (skipBtn) h.click(skipBtn);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
  h.click(h.qa('button').find(b => b.textContent.includes('继续探索')));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 12000, '地图');
}

async function openBoss(h) {
  h.click(h.qa('.node-group')[1]);
  const btn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('挑战 ▸')), 8000, '挑战入口');
  h.click(btn);
  await sleep(400);
  // 首次进入会先播战前演出
  if (h.q('.cine-root')) {
    const skip = h.qa('button').find(b => b.textContent.includes('跳过'));
    if (skip) h.click(skip);
    await sleep(400);
  }
  await h.wait(() => h.q('.boss-arena'), 12000, '战斗界面');
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：独立战斗界面 ----------
  console.log('=== 第一轮：Boss 战独立界面 ===');
  let dom = await launch(makeSave({ seenIntro: false }));
  let h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('.node-group')[1]);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('挑战 ▸')), 8000, '挑战入口'));
  await h.wait(() => h.q('.cine-root'), 12000, '战前演出');
  ok(h.text().includes('GATE-01'), '首次进入播放 GATE-01 战前演出');
  const skip = h.qa('button').find(b => b.textContent.includes('跳过'));
  if (skip) h.click(skip);
  await h.wait(() => h.q('.boss-arena'), 12000, '战斗舞台');
  ok(!!h.q('.boss-avatar svg'), 'Boss 立绘（SVG 构造体）已渲染');
  ok(h.text().includes('100 / 100'), '血条显示满血 100 / 100');
  ok(h.text().includes('能源启动程序'), '显示第一阶段「能源启动程序」');
  ok(h.text().includes('提交攻击'), '有「提交攻击」按钮');
  ok(h.text().includes('判题通过才掉血'), '界面明示「判题通过才掉血」');
  ok(h.qa('.pip').length === 4, '四个阶段刻度');
  ok(h.text().includes('阶段 1 / 4'), 'HUD 显示阶段进度 1 / 4');
  ok(h.text().includes('容错'), 'HUD 接入原有容错显示');

  // ---------- 第二轮：失败提交 = 反击（不是战斗失败） ----------
  console.log('=== 第二轮：失败提交触发反击 ===');
  const atk = h.qa('button').find(b => b.textContent.includes('提交攻击'));
  h.click(atk);
  await h.wait(() => {
    const s = h.save();
    return s.player && (s.player.consciousness < 100 || (s.player.progress.battles || {})['gate-01']?.failures > 0);
  }, 20000, '反击结算');
  const s1 = h.save();
  const b1 = (s1.player.progress.battles || {})['gate-01'];
  ok(!!b1, '战斗进度已写入存档');
  ok(s1.player.consciousness === 97, 'Boss 反击造成 3 点意识伤害（100 → 97）', String(s1.player.consciousness));
  ok(b1.failures === 1, '战斗失误计数 +1');
  ok(b1.hp === 100, '未通过判题时 Boss 不掉血');
  ok((s1.player.progress.failedAttempts || {})['gate-01'] === 1, '同时接入原有容错计数');
  ok(h.text().includes('未造成伤害'), '战斗记录显示「未造成伤害」');

  // ---------- 第三轮：撤退后进度保留 ----------
  console.log('=== 第三轮：撤退 / 续战 ===');
  h.click(h.qa('button').find(b => b.textContent.includes('撤退')));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '撤退回地图');
  ok((h.save().player.progress.battles || {})['gate-01'].failures === 1, '撤退后战斗进度仍保存');
  h.click(h.qa('.node-group')[1]);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('挑战 ▸')), 8000, '再次挑战'));
  await h.wait(() => h.q('.boss-arena'), 12000, '续战界面');
  ok(h.text().includes('战斗失误') && h.text().includes('1'), '续战后失误计数保留');
  dom.window.close();

  // ---------- 第四轮：中局存档续战 ----------
  console.log('=== 第四轮：中局存档续战 ===');
  const midSave = makeSave({
    battles: { 'gate-01': { hp: 42, maxHp: 100, phase: 1, phaseMask: [7, 5, 0, 0], failures: 2, cleared: false, updatedAt: 1 } },
  });
  dom = await launch(midSave);
  h = helpers(dom);
  await enterMenu(h);
  await openBoss(h);
  ok(h.text().includes('42 / 100'), '续战显示存档血量 42 / 100');
  ok(h.text().includes('防御逻辑'), '续战进入第二阶段「防御逻辑」');
  ok(h.text().includes('阶段 2 / 4'), 'HUD 阶段进度 2 / 4');
  ok(h.qa('.pip.done').length === 1, '第一阶段标记为已击破');
  ok(h.text().includes('本阶段测试'), '显示本阶段测试进度');
  dom.window.close();

  // ---------- 第五轮：已击破状态 ----------
  console.log('=== 第五轮：已击破 ===');
  const clearedSave = makeSave({
    bossesDone: ['gate-01'],
    battles: { 'gate-01': { hp: 0, maxHp: 100, phase: 4, phaseMask: [7, 15, 7, 3], failures: 3, cleared: true, updatedAt: 1 } },
  });
  dom = await launch(clearedSave);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('.node-group')[1]);
  await h.wait(() => h.text().includes('GATE-01'), 8000, '面板');
  ok(h.text().includes('已击破'), '地图面板显示已击破');
  ok(!h.qa('button').some(b => b.textContent.includes('挑战 ▸')), '已击破后不再提供挑战入口（防止重复刷碎片）');
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
