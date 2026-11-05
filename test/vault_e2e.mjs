// 记忆档案馆端到端：全息展厅 / 加密态 / 详情 / 记忆影像 / 最终档案 / 恢复浏览位置 / 事件回放
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4180;
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
process.on('unhandledRejection', () => {});
const vc = new VirtualConsole();
vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

function makeSave({ fragments = [], bossesDone = [], vault, story, flags = {} } = {}) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 4, exp: 600, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: fragments, fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training', 'syntax'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: story || { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      vault: vault || { read: [], finalSeen: false, lastOpened: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, ...flags },
      bossesDone, battles: {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 6, updatedAt: Date.now(), player });
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

async function enterMainMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  const skip = h.qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (skip) h.click(skip);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
}

async function openVault(h) {
  const btn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('创世主记忆档案馆')), 8000, '档案馆入口');
  h.click(btn);
  await h.wait(() => h.q('.vault-hall'), 10000, '档案馆');
}

async function advanceUntil(h, predicate, maxClicks = 30) {
  let acc = h.text();
  if (predicate(acc)) return acc;
  for (let i = 0; i < maxClicks; i++) {
    const el = h.q('.dlg-text');
    if (!el) break;
    h.click(el);
    await sleep(60);
    acc += '\n' + h.text();
    if (predicate(acc)) return acc;
  }
  return acc;
}

const skipCinema = async (h) => {
  const btn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('跳过')), 8000, '跳过');
  h.click(btn);
  await sleep(300);
};

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：两枚碎片 ----------
  console.log('=== 第一轮：展厅 / 加密 / 详情 / 影像 ===');
  const seed = makeSave({
    fragments: ['frag-01', 'frag-02'],
    bossesDone: ['gate-01', 'somnia'],
    vault: { read: ['frag-02'], finalSeen: false, lastOpened: 'frag-02' },
    story: { unlocked: ['prologue', 'chapter-1'], seen: {}, choices: {}, lastEventId: 'chapter-1' },
  });
  let dom = await launch(seed);
  let h = helpers(dom);
  await enterMainMenu(h);
  await openVault(h);

  ok(!!h.q('.vault-hall'), '全息档案馆界面已渲染');
  ok(h.qa('.vault-slot').length === 6, '六枚碎片槽位齐全');
  ok(h.qa('.vault-slot.owned').length === 2, '已收集 2 枚');
  ok(h.qa('.vault-slot.locked').length === 4, '未收集显示加密态');
  ok(h.text().includes('2 / 6'), '进度显示 2 / 6');
  ok(h.text().includes('██████'), '加密槽位用占位符遮蔽名称');
  ok(!!h.q('.vault-detail') && h.text().includes('守护者的约定'), '关闭页面前的浏览位置被恢复（frag-02）');

  // 锁定槽位
  const slots = h.qa('.vault-slot');
  h.click(slots[2]);
  await sleep(300);
  ok(h.text().includes('加密') && h.text().includes('第 3 章'), '点击加密碎片提示仍加密');

  // 打开 frag-01
  h.click(slots[0]);
  await sleep(300);
  ok(!!h.q('.vault-detail') && h.text().includes('初始指令'), '打开已收集碎片的详情页');
  ok(h.text().includes('恩格尔在黎明协议的启动日志里写下'), '详情页展示完整剧情');
  ok(h.text().includes('归档时间'), '详情页显示归档时间');

  // 记忆影像
  const playBtn = h.qa('button').find(b => b.textContent.includes('播放恩格尔记忆影像'));
  ok(!!playBtn, '有「播放恩格尔记忆影像」按钮');
  h.click(playBtn);
  await h.wait(() => h.q('.cine-root'), 8000, '记忆影像');
  ok(h.text().includes('恩格尔'), '记忆影像由恩格尔讲述');
  await skipCinema(h);

  // 最终档案仍加密
  ok(h.text().includes('集齐六枚'), '未集齐时最终档案提示加密');

  // 事件回放
  const replayBtn = h.qa('button').find(b => b.textContent.includes('回放 ▸') && !b.disabled);
  ok(!!replayBtn, '已解锁主线事件可回放');
  h.click(replayBtn);
  await h.wait(() => h.q('.cine-root'), 8000, '事件回放');
  ok(h.text().includes('序章') || h.text().includes('第一章'), '回放打开对应章节演出');
  await skipCinema(h);

  // 返回再进：恢复上次浏览位置
  h.click(h.qa('button').find(b => b.textContent.includes('◀ 主菜单')));
  await h.wait(() => h.text().includes('Python 知识库'), 8000, '返回主菜单');
  await openVault(h);
  ok(!!h.q('.vault-detail') && h.text().includes('初始指令'), '重新进入后恢复上次查看的碎片');
  const saved = h.save();
  ok(saved.player.progress.vault.lastOpened === 'frag-01', '上次浏览位置已写入存档');
  ok(saved.player.progress.vault.read.includes('frag-01'), '已阅状态已记录');
  dom.window.close();

  // ---------- 第二轮：六枚齐备 → 最终档案 ----------
  console.log('=== 第二轮：最终记忆档案 ===');
  const all = makeSave({
    fragments: ['frag-01', 'frag-02', 'frag-03', 'frag-04', 'frag-05', 'frag-06'],
    bossesDone: ['gate-01', 'somnia'],
  });
  dom = await launch(all);
  h = helpers(dom);
  await enterMainMenu(h);
  await openVault(h);
  ok(h.qa('.vault-slot.owned').length === 6, '六枚全部已收集');
  ok(h.text().includes('6 / 6'), '进度显示 6 / 6');
  ok(h.text().includes('最终档案已解锁') || h.text().includes('已解锁'), '最终档案解锁');
  const finalBtn = h.qa('button').find(b => b.textContent.includes('打开最终记忆档案'));
  ok(!!finalBtn, '出现「打开最终记忆档案」按钮');
  if (finalBtn) {
    h.click(finalBtn);
    await sleep(300);
    ok(h.text().includes('超越起源'), '最终档案标题《超越起源》');
    ok(h.text().includes('这个位置，我留给做出选择的人'), '最终档案展示完整剧情');
    const fm = h.qa('button').find(b => b.textContent.includes('播放最终记忆影像'));
    ok(!!fm, '最终档案可播放记忆影像');
    if (fm) {
      h.click(fm);
      await h.wait(() => h.q('.cine-root'), 8000, '最终影像');
      const finalText = await advanceUntil(h, s => s.includes('轮到你提问了'), 12);
      ok(finalText.includes('轮到你提问了'), '最终影像台词正确');
      await skipCinema(h);
    }
    ok(h.save().player.progress.vault.finalSeen === true, '最终档案已阅状态已保存');
  }
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
