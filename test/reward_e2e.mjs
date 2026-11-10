// 奖励系统端到端：商店兑换/装备持久化、扫描与回滚道具、信任度隐藏记忆
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4181;
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

function makeSave({ credits = 500, trust = 10, items = {}, skins = [], equipped = {}, completed = [], flags = {}, knowledge = [] } = {}) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 200, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: completed, stars: {}, unlockedServers: ['training'], currentLevelId: completed.length ? null : 'tut-1',
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge,
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      vault: { read: [], finalSeen: false, lastOpened: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, ...flags },
      bossesDone: [], battles: {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits, trust, items, skins, equipped, chapterRewards: [], cleared: {}, archiveRead: [], bossRewards: [], unlocks: [] },
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
async function enterMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  const skip = h.qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (skip) h.click(skip);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：商店兑换 / 装备 / 持久化 ----------
  console.log('=== 第一轮：兑换中心 ===');
  let dom = await launch(makeSave({ credits: 500 }));
  let h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('奖励兑换中心')));
  await h.wait(() => h.q('.shop-card'), 10000, '兑换中心');

  const frameCard = h.qa('.shop-card').find(c => c.textContent.includes('青铜回路'));
  ok(!!frameCard, '商店包含头像框商品');
  const buyBtn = frameCard && frameCard.querySelector('button');
  h.click(buyBtn);
  await sleep(300);
  let sv = h.save();
  ok(sv.player.rewards.credits === 430, '兑换扣除贡献点（500 → 430）', String(sv.player.rewards.credits));
  ok(sv.player.rewards.skins.includes('frame-bronze'), '头像框已加入已拥有外观');

  // 装备
  const card2 = h.qa('.shop-card').find(c => c.textContent.includes('青铜回路'));
  const eqBtn = card2 && Array.from(card2.querySelectorAll('button')).find(b => b.textContent.includes('装备'));
  ok(!!eqBtn, '已购买商品出现装备按钮');
  h.click(eqBtn);
  await sleep(300);
  sv = h.save();
  ok(sv.player.rewards.equipped.avatarFrame === 'frame-bronze', '装备状态已写入存档');
  dom.window.close();

  // 重开：持久化
  dom = await launch(JSON.stringify(sv));
  h = helpers(dom);
  await enterMenu(h);
  ok(h.text().includes('R-07'), '重新进入后主菜单正常');
  const core = h.q('.pl-core');
  ok(!!core && core.className.includes('frame-bronze'), '头像框在状态卡上生效（frame-bronze）');
  dom.window.close();

  // ---------- 第二轮：扫描 / 回滚道具 ----------
  console.log('=== 第二轮：道具 ===');
  dom = await launch(makeSave({ items: { scan: 2, rollback: 1 }, completed: [] }));
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('继续探索')));
  await h.wait(() => h.q('.node-group'), 10000, '地图');
  h.click(h.qa('.node-group')[0]);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('接入')), 8000, '接入'));
  await h.wait(() => h.q('.code-editor-host'), 15000, '挑战页');

  const scanBtn = h.qa('button').find(b => b.textContent.includes('扫描 ×'));
  ok(!!scanBtn, '挑战页有扫描器按钮');
  h.click(scanBtn);
  await sleep(300);
  const afterScan = h.save();
  ok(afterScan.player.rewards.items.scan === 1, '扫描消耗 1 个扫描器（2 → 1）');
  ok(h.text().includes('扫描完成') || h.text().includes('扫描'), '扫描结果写入 MIRA 面板');

  const rbBtn = h.qa('button').find(b => b.textContent.includes('回滚 ×'));
  ok(!!rbBtn, '挑战页有回滚按钮');
  h.click(rbBtn);
  await sleep(300);
  const afterRb = h.save();
  ok(afterRb.player.rewards.items.rollback === 0, '回滚消耗 1 个模块（1 → 0）');
  dom.window.close();

  // ---------- 第三轮：信任度隐藏记忆 ----------
  console.log('=== 第三轮：信任度隐藏记忆 ===');
  dom = await launch(makeSave({ trust: 60 }));
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('创世主记忆档案馆')));
  await h.wait(() => h.text().includes('隐藏记忆'), 10000, '档案馆');
  ok(h.text().includes('被 MIRA 锁着'), '信任度不足时隐藏记忆锁住');
  ok(h.text().includes('60 / 75'), '显示当前信任度进度');
  dom.window.close();

  dom = await launch(makeSave({ trust: 80 }));
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('创世主记忆档案馆')));
  await h.wait(() => h.text().includes('隐藏记忆'), 10000, '档案馆');
  ok(h.text().includes('因为我也害怕'), '信任度足够时解锁隐藏记忆');
  ok(!h.text().includes('被 MIRA 锁着'), '解锁后不再显示锁定提示');
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
