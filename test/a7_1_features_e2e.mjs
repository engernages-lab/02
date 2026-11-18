// A7.1 专项 E2E：提示券（Hint Ticket）与 Boss 护盾（Boss Shield）真实交互（jsdom + 真实 store）
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4197;
const SAVE_KEY = 'nexus_code_repair_save_v1';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

const vc = new VirtualConsole();
vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});
process.on('unhandledRejection', () => {});

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];

function makeSave({ credits = 500, items = {}, buffs = {}, failed = {}, bossesDone = [], battles = {}, consciousness = 100, seenIntro = true } = {}) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: failed, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: seenIntro ? { 'bossIntro_gate-01': true } : {},
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: {
        prologueDone: true, tutorialCinematicShown: true, chapter1Done: true,
        chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true,
      },
      bossesDone, battles, currentBossId: null, pendingRebirth: false, challengeSessions: {},
    },
    rewards: {
      credits, trust: 10, items, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [],
      transactions: [], purchases: {},
      buffs: { shield: 0, guard: 0, barrier: 0, hintTicket: 0, expBoost: null, ...buffs },
    },
    settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}

async function launch(seed) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { if (seed) window.localStorage.setItem(SAVE_KEY, seed); },
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
    save: () => JSON.parse(w.localStorage.getItem(SAVE_KEY) || '{}'),
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

const btn = (h, label) => h.qa('button').find(b => (b.textContent || '').includes(label));

async function enterMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 20000, '启动页');
  const skip = btn(h, '跳过初始化');
  if (skip) h.click(skip);
  h.click(await h.wait(() => btn(h, 'ENTER NEXUS'), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 15000, '主菜单');
}
async function enterMap(h) {
  h.click(await h.wait(() => btn(h, '继续探索') || btn(h, '开始探索'), 10000, '继续探索'));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 15000, '地图');
}
async function enterLevel(h, idx = 0) {
  if (h.qa('.lv-row').length === 0) {
    const nodes = await h.wait(() => { const n = h.qa('.node-group'); return n.length >= 2 ? n : null; }, 15000, '地图节点');
    h.click(nodes[1]);
  }
  await h.wait(() => h.qa('.lv-row').length >= 3, 12000, '关卡列表');
  h.click(h.qa('.lv-row')[idx].querySelector('button'));
  await h.wait(() => h.q('.draft-bar'), 20000, '挑战页');
  await sleep(300);
}
async function openBoss(h) {
  h.click(h.qa('.node-group')[1]);
  h.click(await h.wait(() => btn(h, '挑战 ▸'), 8000, '挑战入口'));
  await sleep(400);
  if (h.q('.cine-root')) {
    const skip = btn(h, '跳过');
    if (skip) h.click(skip);
    await sleep(400);
  }
  await h.wait(() => h.q('.boss-arena'), 15000, 'Boss 战斗');
  await sleep(300);
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  console.log('=== A. 提示券：购买来源之外的使用链路 ===');
  {
    let dom = await launch(makeSave({ items: { 'hint-ticket': 1 }, buffs: { hintTicket: 1 } }));
    let h = helpers(dom);
    await enterMenu(h); await enterMap(h); await enterLevel(h, 0);
    const hintBtn = await h.wait(() => btn(h, 'MIRA 提示'), 8000, 'MIRA 提示按钮');
    ok(!!hintBtn && !hintBtn.disabled, '挑战页存在可用的 MIRA 提示按钮');
    const before = h.save();
    ok(before.player.rewards.buffs.hintTicket === 1, '初始持有 1 张提示券');

    h.click(hintBtn);
    await h.wait(() => h.save().player.rewards.buffs.hintTicket === 0, 5000, '提示券消耗');
    let s = h.save();
    ok(!s.player.progress.hintLevels['1-1'], '使用提示券不增加本关提示层数', JSON.stringify(s.player.progress.hintLevels));
    ok(h.text().includes('LEVEL'), '提示内容正常显示');
    const miraMsg = (h.q('.mira-msg') || {}).textContent || '';
    ok(!miraMsg.includes('服务器状态报告'), '提示不直接泄露目标输出', miraMsg.slice(0, 120));

    h.click(btn(h, 'MIRA 提示'));
    await h.wait(() => (h.save().player.progress.hintLevels['1-1'] || 0) === 1, 5000, '第二次提示计数');
    s = h.save();
    ok(s.player.rewards.buffs.hintTicket === 0, '无券后不会出现负数量');
    ok(s.player.progress.hintLevels['1-1'] === 1, '无券时按普通提示计层');

    dom.window.close();
    dom = await launch(JSON.stringify(s));
    h = helpers(dom);
    await enterMenu(h); await enterMap(h); await enterLevel(h, 0);
    const afterReload = h.save();
    ok(afterReload.player.rewards.buffs.hintTicket === 0, '刷新后提示券数量保持 0');
    ok(afterReload.player.progress.hintLevels['1-1'] === 1, '刷新后提示层数保持 1');
    dom.window.close();
  }

  console.log('=== B. 提示券：无券 / 连续点击 ===');
  {
    let dom = await launch(makeSave());
    let h = helpers(dom);
    await enterMenu(h); await enterMap(h); await enterLevel(h, 0);
    h.click(await h.wait(() => btn(h, 'MIRA 提示'), 8000, '无券提示'));
    await h.wait(() => (h.save().player.progress.hintLevels['1-1'] || 0) === 1, 5000, '无券计层');
    let s = h.save();
    ok(s.player.rewards.buffs.hintTicket === 0 && s.player.progress.hintLevels['1-1'] === 1, '无券时不会凭空使用');
    dom.window.close();

    dom = await launch(makeSave({ items: { 'hint-ticket': 1 }, buffs: { hintTicket: 1 } }));
    h = helpers(dom);
    await enterMenu(h); await enterMap(h); await enterLevel(h, 0);
    const b = await h.wait(() => btn(h, 'MIRA 提示'), 8000, '连点提示');
    h.click(b); h.click(b);
    await sleep(600);
    s = h.save();
    ok(s.player.rewards.buffs.hintTicket === 0, '连续点击只消耗 1 张', String(s.player.rewards.buffs.hintTicket));
    ok((s.player.progress.hintLevels['1-1'] || 0) <= 1, '连续点击不会重复叠层', JSON.stringify(s.player.progress.hintLevels));
    dom.window.close();
  }

  console.log('=== C. Boss 护盾：获取与生效 ===');
  {
    let dom = await launch(makeSave({
      failed: { 'gate-01': 4 },
      buffs: { shield: 1 },
      items: { 'shield-core': 0 },
      consciousness: 100,
    }));
    let h = helpers(dom);
    await enterMenu(h); await enterMap(h); await openBoss(h);
    ok(h.text().includes('提交攻击'), '进入 Boss 战');
    const before = h.save();
    ok(before.player.rewards.buffs.shield === 1, 'Boss 战前持有 1 层护盾');
    h.click(btn(h, '提交攻击'));
    await h.wait(() => h.save().player.rewards.buffs.shield === 0, 20000, '护盾消耗');
    await sleep(500);
    const after = h.save();
    ok(!h.q('.ov-attack'), '护盾挡下纠错者攻击（未弹出攻击界面）');
    ok((after.player.progress.failedAttempts['gate-01'] || 0) === 0, '护盾生效后本关失败计数清零', JSON.stringify(after.player.progress.failedAttempts));
    ok(after.player.consciousness < before.player.consciousness, 'Boss 反击仍按原机制扣意识（护盾不改变 Boss 伤害）', before.player.consciousness + '→' + after.player.consciousness);
    const battle = (after.player.progress.battles || {})['gate-01'];
    ok(battle && battle.failures >= 1, 'Boss 战斗失败计数正常增加');
    ok((after.player.progress.bossesDone || []).length === 0, '护盾不会错误判定 Boss 已击破');

    h.click(btn(h, '提交攻击'));
    await sleep(1500);
    const after2 = h.save();
    ok(after2.player.rewards.buffs.shield === 0, '护盾只生效一次，不会重复激活');
    dom.window.close();
  }

  console.log('=== D. Boss 护盾：无护盾与刷新 ===');
  {
    let dom = await launch(makeSave({
      failed: { 'gate-01': 4 },
      buffs: { shield: 0 },
      consciousness: 100,
    }));
    let h = helpers(dom);
    await enterMenu(h); await enterMap(h); await openBoss(h);
    h.click(btn(h, '提交攻击'));
    await h.wait(() => !!h.q('.ov-attack'), 20000, '无护盾时触发攻击');
    ok(true, '没有护盾时攻击事件正常触发');
    ok(h.save().player.rewards.buffs.shield === 0, '无护盾不会出现负数');
    dom.window.close();

    dom = await launch(makeSave({ failed: { 'gate-01': 4 }, buffs: { shield: 1 } }));
    h = helpers(dom);
    await enterMenu(h); await enterMap(h); await openBoss(h);
    h.click(btn(h, '提交攻击'));
    await h.wait(() => h.save().player.rewards.buffs.shield === 0, 20000, '刷新前消耗');
    const saved = h.save();
    dom.window.close();
    dom = await launch(JSON.stringify(saved));
    h = helpers(dom);
    await enterMenu(h); await enterMap(h); await openBoss(h);
    const reloaded = h.save();
    ok(reloaded.player.rewards.buffs.shield === 0, '刷新后护盾状态保持（不会复活）');
    ok(reloaded.player.consciousness < 100, '刷新后 Boss 反击伤害保持');
    dom.window.close();
  }

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  server.close();
  process.exit(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('A7.1 专项 E2E 失败:', e && e.message ? e.message : e);
  server.close();
  process.exit(1);
});
