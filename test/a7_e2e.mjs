// A7 综合验收 E2E：7 种分辨率 + 挑战→诊断→判题→结算→购买→道具→刷新 全链路 + 启动耗时
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4195;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SAVE_KEY = 'nexus_code_repair_save_v1';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

class CDP {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP 超时: ' + method)); }
      }, 40000);
    });
  }
}

function seedSave({ credits = 500, exp = 0, level = 1, consciousness = 100 } = {}) {
  return JSON.stringify({
    version: 10, updatedAt: 1700000000000,
    player: {
      name: 'R-07',
      identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1700000000000 },
      level, exp, consciousness,
      meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
      progress: {
        completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training', 'syntax'], currentLevelId: null,
        failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
        storySeen: { 'bs-syntax-1': true, 'bs-syntax-2': true, '1-1': true, '1-2': true, '1-3': true, '1-4': true, '1-5': true },
        story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
        flags: { tutorialCinematicShown: true, chapter1ArrivalSeen: true, prologueDone: true },
        bossesDone: [], currentBossId: null, pendingRebirth: false, challengeSessions: {},
      },
      rewards: {
        credits, trust: 30, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [],
        transactions: [], purchases: {}, buffs: { shield: 0, guard: 0, barrier: 0, hintTicket: 0, expBoost: null }, ledger: [],
      },
      settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 1, fullscreen: false, lang: 'zh' },
    },
  });
}

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
let chrome = null, cdp = null, sessionId = null, wsUrl = '', seedId = null;
const readSave = `JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null')`;
const perf = {};

async function evalJS(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error('页面脚本异常: ' + (r.exceptionDetails.text || ''));
  return r.result ? r.result.value : undefined;
}
async function waitFor(expr, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const v = await evalJS(expr); if (v) return v; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error('等待超时: ' + label);
}
const clickText = (scope, text) => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(scope)} + ' button')].find(b => (b.textContent || '').includes(${JSON.stringify(text)}));
  if (!el) return false; el.click(); return true;
})()`;

async function setViewport(w, h) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 767 }, sessionId);
  await sleep(350);
}

async function bootToMenu() {
  const t0 = Date.now();
  await waitFor(`!!document.querySelector('.boot-wrap')`, 20000, '启动页');
  const skip = await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`);
  if (skip) await evalJS(clickText('body', '跳过初始化'));
  await evalJS(clickText('body', 'ENTER NEXUS'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 15000, '主菜单');
  perf.bootMs = Date.now() - t0;
}
async function enterLevel() {
  const t0 = Date.now();
  await evalJS(clickText('body', '继续探索'));
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 15000, '世界地图');
  await waitFor(`document.querySelectorAll('.node-group').length >= 2`, 12000, '地图节点');
  await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 12000, '关卡列表');
  await evalJS(`document.querySelectorAll('.lv-row')[0].querySelector('button').click()`);
  await waitFor(`!!document.querySelector('.monaco-editor')`, 20000, '挑战页');
  await sleep(700);
  perf.challengeMs = Date.now() - t0;
}
async function toMenu() {
  await evalJS(clickText('body', '返回地图'));
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 15000, '地图');
  await evalJS(clickText('body', '主菜单'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 15000, '主菜单');
}

(async () => {
  if (!existsSync(CHROME)) throw new Error('找不到 Chrome');
  server.listen(PORT, '127.0.0.1');
  await sleep(250);
  const profile = join(tmpdir(), 'nexus-a7-cdp-' + Date.now());
  mkdirSync(profile, { recursive: true });
  const D = 11100 + Math.floor(Math.random() * 300);
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1920,1080', '--remote-debugging-port=' + D, '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });
  const t0 = Date.now();
  while (!wsUrl && Date.now() - t0 < 20000) {
    try {
      const j = await (await fetch('http://127.0.0.1:' + D + '/json/version')).json();
      if (j && j.webSocketDebuggerUrl) wsUrl = j.webSocketDebuggerUrl;
    } catch { /* not ready */ }
    if (!wsUrl && chrome.exitCode !== null) throw new Error('Chrome 提前退出');
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) throw new Error('Chrome 未开放 CDP');
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  cdp = new CDP(ws);
  const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const attached = await cdp.send('Target.attachToTarget', { targetId: created.targetId, flatten: true });
  sessionId = attached.sessionId;
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  const src = `try { localStorage.clear(); localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(seedSave())}); } catch (e) {}`;
  const seeded = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: src }, sessionId);
  seedId = seeded.identifier;
  await setViewport(1920, 1080);
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
  await sleep(900);

  console.log('=== A. 七种分辨率 ===');
  await bootToMenu();
  await enterLevel();
  const sizes = [[1920, 1080], [1366, 768], [1024, 768], [430, 932], [390, 844], [360, 800], [320, 700]];
  for (const [w, h] of sizes) {
    await setViewport(w, h);
    const m = await evalJS(`(() => {
      const ed = document.querySelector('.code-frame') || document.querySelector('.monaco-editor');
      const bar = document.querySelector('.mobile-actions');
      const hud = document.querySelector('.chlg-page .hud');
      const toolbar = document.querySelector('.chlg-page .toolbar');
      return {
        sw: document.documentElement.scrollWidth, vw: innerWidth,
        edH: ed ? Math.round(ed.getBoundingClientRect().height) : 0,
        barVisible: bar ? getComputedStyle(bar).display !== 'none' && bar.getBoundingClientRect().bottom <= innerHeight + 1 : false,
        toolbar: !!toolbar && getComputedStyle(toolbar).display !== 'none' && toolbar.getBoundingClientRect().height > 20,
        hudVisible: hud ? hud.getBoundingClientRect().height > 20 : false,
        tabs: document.querySelectorAll('.mobile-tabs .mt-btn').length,
      };
    })()`);
    ok(m.sw <= m.vw + 1, w + '×' + h + '：无横向溢出', JSON.stringify(m));
    ok(m.edH >= 120, w + '×' + h + '：编辑器可见且有空间（' + m.edH + 'px）');
    ok(w > 767 ? m.toolbar : m.barVisible, w + '×' + h + '：操作入口可用', JSON.stringify(m));
    ok(m.hudVisible, w + '×' + h + '：HUD 完整');
    if (w <= 767) ok(m.tabs >= 5, w + '×' + h + '：手机 5 标签可用', String(m.tabs));
  }
  await setViewport(1366, 900);

  console.log('=== B. 挑战 → 诊断 → 判题 → 结算 ===');
  await evalJS(`(() => { const m=window.monaco.editor.getModels()[0]; m.setValue('if True\\n    print(1)'); return true; })()`);
  await sleep(500);
  await evalJS(clickText('.chlg-page .toolbar', '运行代码'));
  await waitFor(`(() => { const el=document.querySelector('.diag-panel'); return el && el.dataset.status==='done' && el.dataset.kind==='syntax'; })()`, 15000, 'A3 语法诊断');
  ok(true, 'A3：真实语法错误诊断可用');
  await evalJS(`(() => { const m=window.monaco.editor.getModels()[0]; m.setValue('log_title = "服务器状态报告"\\n\\nif log_title != "":\\n    print(log_title)'); return true; })()`);
  await sleep(600);
  await evalJS(clickText('.chlg-page .toolbar', '提交修复'));
  await waitFor(`document.body.textContent.includes('修复成功')`, 20000, '通关结算');
  const sv1 = await evalJS(`${readSave}`);
  ok(sv1.player.rewards.credits === 590, 'A4/A6：首通结算 +90 贡献点', String(sv1.player.rewards.credits));
  ok(sv1.player.exp === 60 && sv1.player.level === 1, 'A6：首通 +60 经验', String(sv1.player.exp));
  ok((sv1.player.rewards.ledger || []).length === 1, 'A6：奖励账本 1 条');
  const sess = (sv1.player.progress.challengeSessions || {})['1-1'];
  ok(!!sess && sess.status === 'passed' && sess.settlement, 'A4：会话结算写入');
  ok(sess.runs === 1 && sess.submits === 1, 'A4：运行/提交计数正确', JSON.stringify({ r: sess.runs, s: sess.submits }));
  const draft = await evalJS(`localStorage.getItem('nexus_draft_v1:p1700000000000:1-1')`);
  ok(!!draft && JSON.parse(draft).code.includes('服务器状态报告'), 'A1：通关代码已保存');

  console.log('=== C. 结算 → 商店 → 购买 → 道具 → 刷新 ===');
  await toMenu();
  const tShop = Date.now();
  await evalJS(clickText('body', '奖励兑换中心'));
  await waitFor(`!!document.querySelector('.shop-page')`, 15000, '商店');
  perf.shopMs = Date.now() - tShop;
  const shopCredits = await evalJS(`[...document.querySelectorAll('.hud-chip')].map(x=>x.textContent).join('|')`);
  ok(/590/.test(shopCredits), 'A5：商店显示结算后余额 590', shopCredits);
  await evalJS(`(() => { const c=[...document.querySelectorAll('.shop-card')].find(x=>x.textContent.includes('护盾核心')); c.click(); return true; })()`);
  await waitFor(`!!document.querySelector('.sd-foot button')`, 5000, '商品详情');
  await evalJS(`document.querySelector('.sd-foot button').click()`);
  await waitFor(`!!document.querySelector('.shop-confirm')`, 5000, '二次确认');
  await evalJS(`[...document.querySelectorAll('.shop-confirm button')].find(b=>b.textContent.includes('确认支付')).click()`);
  await sleep(600);
  const sv2 = await evalJS(`${readSave}`);
  ok(sv2.player.rewards.credits === 530, 'A5：购买扣费 590→530', String(sv2.player.rewards.credits));
  ok(sv2.player.rewards.items['shield-core'] === 1, 'A5：库存 +1');
  await evalJS(`document.querySelector('.sd-close').click()`);
  await evalJS(`(() => { const b=[...document.querySelectorAll('.shop-tab')].find(x=>x.textContent.includes('我的背包')); b.click(); return true; })()`);
  await waitFor(`!!document.querySelector('.shop-bag')`, 5000, '背包');
  await evalJS(`(() => { const row=[...document.querySelectorAll('.bag-row')].find(x=>x.textContent.includes('护盾核心')); const b=[...row.querySelectorAll('button')].find(x=>x.textContent.includes('使用')); b.click(); return true; })()`);
  await sleep(400);
  const sv3 = await evalJS(`${readSave}`);
  ok(sv3.player.rewards.buffs.shield === 1, 'A5：使用护盾后增益 +1');
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedId }, sessionId);
  seedId = null;
  await cdp.send('Page.reload', {}, sessionId);
  await sleep(900);
  await bootToMenu();
  await enterLevel();
  const hudBuffs = await evalJS(`[...document.querySelectorAll('.hud-chip')].map(x=>x.textContent).join('|')`);
  ok(/护盾 1/.test(hudBuffs), 'A5：刷新后护盾仍生效并显示在 HUD', hudBuffs);
  ok(/◈\s*530/.test(hudBuffs), 'A6：刷新后余额 530 一致', hudBuffs);
  const sv4 = await evalJS(`${readSave}`);
  ok(sv4.player.level === 1 && sv4.player.exp === 60 && sv4.player.rewards.credits === 530, '刷新后成长与货币一致');

  console.log('=== D. 性能观测 ===');
  const write = await evalJS(`(() => { const t=performance.now(); for (let i=0;i<500;i++){ localStorage.setItem('__a7_probe', String(i)); } localStorage.removeItem('__a7_probe'); return Math.round(performance.now()-t); })()`);
  perf.save500Ms = write;
  const heap = await evalJS(`performance.memory ? { used: Math.round(performance.memory.usedJSHeapSize/1048576), total: Math.round(performance.memory.totalJSHeapSize/1048576) } : null`);
  perf.heap = heap;
  console.log('PERF ' + JSON.stringify(perf));
  ok(perf.bootMs < 12000, '启动到主菜单 < 12s（' + perf.bootMs + 'ms）');
  ok(perf.challengeMs < 15000, '进入关卡到编辑器 < 15s（' + perf.challengeMs + 'ms）');
  ok(perf.shopMs < 6000, '打开商店 < 6s（' + perf.shopMs + 'ms）');
  ok(write < 300, '500 次存档写入 < 300ms（' + write + 'ms）');
  if (heap) ok(heap.used < 600, 'JS 堆占用 < 600MB（' + heap.used + 'MB）');

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  finish(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('A7 E2E 失败:', e && e.message ? e.message : e);
  finish(1);
});

function finish(code) {
  try { server.close(); } catch { /* ignore */ }
  try { if (cdp) cdp.ws.close(); } catch { /* ignore */ }
  try { if (chrome && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* ignore */ }
  setTimeout(() => process.exit(code), 400);
}
