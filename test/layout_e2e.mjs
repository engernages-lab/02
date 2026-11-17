// A2 真实浏览器布局测试：Chrome Headless + CDP（320/360/390/430/768/1024/1366 + 横屏）
// 断言：三栏/双栏/单栏切换、标签切换、侧栏折叠、编辑器空间、操作栏可见、无横向溢出、键盘补偿变量
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4185;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- 本地静态服务器 ----------
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

// ---------- CDP 客户端 ----------
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.method + ' ' + JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        const arr = this.listeners.get(msg.method) || [];
        arr.forEach(fn => { try { fn(msg.params, msg.sessionId); } catch { /* ignore */ } });
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP 超时: ' + method)); }
      }, 20000);
    });
  }
  on(method, fn) {
    const arr = this.listeners.get(method) || [];
    arr.push(fn);
    this.listeners.set(method, arr);
  }
}

const SAVE = JSON.stringify({
  version: 7, updatedAt: 1700000000000,
  player: {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1700000000000 },
    level: 5, exp: 1040, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2'], stars: { 'tut-1': 3, '1-1': 3, '1-2': 2 },
      unlockedServers: ['training', 'syntax'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: { 'bs-syntax-1': true, 'bs-syntax-2': true, '1-1': true, '1-2': true, '1-3': true },
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { tutorialCinematicShown: true, chapter1ArrivalSeen: true, prologueDone: true },
      bossesDone: [], currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 300, trust: 30, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 1, fullscreen: false, lang: 'zh' },
  },
});

const MEASURE = `(() => {
  const de = document.documentElement;
  const vw = window.innerWidth, vh = window.innerHeight;
  const q = (s) => document.querySelector(s);
  const vis = (el) => { if (!el) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right) }; };
  const page = q('.chlg-page');
  return {
    vw, vh,
    scrollW: de.scrollWidth, bodyScrollW: document.body.scrollWidth,
    left: vis(q('.chlg-left')), center: vis(q('.chlg-center')), right: vis(q('.chlg-right')), bottom: vis(q('.chlg-bottom')),
    tabs: vis(q('.mobile-tabs')), actions: vis(q('.mobile-actions')), sideSwitch: vis(q('.side-switch')),
    draftBar: vis(q('.draft-bar')), toolbar: vis(q('.toolbar')),
    editor: rect(q('.chlg-page .code-frame')), terminal: rect(q('.chlg-page .chlg-bottom')),
    actionBar: rect(q('.chlg-page .mobile-actions')),
    actionBtns: [...document.querySelectorAll('.chlg-page .mobile-actions button')].map(b => ({ t: (b.textContent || '').trim(), ...rect(b) })),
    taskPanel: rect(q('.chlg-page .chlg-left')), miraPanel: rect(q('.chlg-page .chlg-right')),
    tabsRect: rect(q('.chlg-page .mobile-tabs')),
    badge: rect(q('.engine-badge')),
    cls: page ? page.className : '',
    monaco: !!q('.monaco-editor'),
    kbOffset: getComputedStyle(de).getPropertyValue('--kb-offset').trim(),
  };
})()`;

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

let chrome = null;
let cdp = null;
let sessionId = null;
let wsUrl = '';

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

const clickText = (text) => `(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').includes(${JSON.stringify(text)})); if (!b) return false; b.click(); return true; })()`;

async function click(text, ms = 8000) {
  const okc = await waitFor(clickText(text), ms, '按钮 ' + text);
  if (!okc) throw new Error('找不到按钮: ' + text);
  await sleep(250);
}

async function setViewport(width, height) {
  const mobile = (width <= 767) || (width <= 1100 && height <= 520);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile,
    screenWidth: width, screenHeight: height,
  }, sessionId);
  await sleep(450);
}

async function shot(name) {
  try {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
    const dir = join(__dirname, '_a2_shots');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name + '.png'), Buffer.from(r.data, 'base64'));
  } catch { /* 截图失败不影响断言 */ }
}

(async () => {
  if (!existsSync(CHROME)) throw new Error('找不到 Chrome: ' + CHROME);
  server.listen(PORT, '127.0.0.1');
  await sleep(250);

  const profile = join(tmpdir(), 'nexus-a2-cdp-' + Date.now());
  mkdirSync(profile, { recursive: true });
  const DEBUG_PORT = 9400 + Math.floor(Math.random() * 500);
  chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1366,900',
    '--remote-debugging-port=' + DEBUG_PORT,
    '--user-data-dir=' + profile,
    'about:blank',
  ], { stdio: 'ignore' });

  const t0 = Date.now();
  while (!wsUrl && Date.now() - t0 < 20000) {
    try {
      const res = await fetch('http://127.0.0.1:' + DEBUG_PORT + '/json/version');
      const j = await res.json();
      if (j && j.webSocketDebuggerUrl) wsUrl = j.webSocketDebuggerUrl;
    } catch { /* 尚未就绪 */ }
    if (!wsUrl && chrome.exitCode !== null) throw new Error('Chrome 提前退出（code=' + chrome.exitCode + '）');
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) throw new Error('Chrome 未在 20s 内开放 CDP 端口 ' + DEBUG_PORT);

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  cdp = new CDP(ws);

  await cdp.send('Target.setDiscoverTargets', { discover: true });
  const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const attached = await cdp.send('Target.attachToTarget', { targetId: created.targetId, flatten: true });
  sessionId = attached.sessionId;

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { localStorage.setItem('nexus_code_repair_save_v1', ${JSON.stringify(SAVE)}); } catch (e) {}`,
  }, sessionId);

  await setViewport(1366, 768);
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
  await sleep(800);

  // ---------- 进入挑战页 ----------
  await waitFor(`!!document.querySelector('.boot-wrap')`, 20000, '启动页');
  const hasSkip = await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`);
  if (hasSkip) await click('跳过初始化');
  await click('ENTER NEXUS', 15000);
  await click('继续探索', 12000);
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 15000, '世界地图');
  await waitFor(`document.querySelectorAll('.node-group').length >= 2`, 12000, '地图节点');
  await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 12000, '关卡列表');
  await evalJS(`document.querySelectorAll('.lv-row')[0].querySelector('button').click()`);
  await waitFor(`!!document.querySelector('.chlg-page') && !!document.querySelector('.draft-bar')`, 20000, '挑战页');
  await sleep(700);

  // ---------- 桌面 1366 ----------
  console.log('=== 桌面 1366×768：保留三栏 ===');
  await setViewport(1366, 768);
  let m = await evalJS(MEASURE);
  ok(m.left && m.center && m.right, '三栏同时可见', JSON.stringify({ l: m.left, c: m.center, r: m.right }));
  ok(!m.tabs, '桌面不显示手机标签栏');
  ok(!m.actions, '桌面不显示手机固定操作栏');
  ok(!m.sideSwitch, '桌面不显示平板侧栏开关');
  ok(m.bottom, '桌面保留底部终端');
  ok(m.editor && m.editor.w >= 600 && m.editor.h >= 260, '编辑器宽度与高度充足', JSON.stringify(m.editor));
  ok(m.terminal && m.terminal.bottom <= m.vh + 1, '桌面底部终端完整可见', JSON.stringify(m.terminal));
  ok(m.editor && m.terminal && m.editor.bottom <= m.terminal.y + 1, '桌面编辑器不被终端遮挡');
  ok(m.scrollW <= m.vw + 1 && m.bodyScrollW <= m.vw + 1, '桌面无横向溢出', `scrollW=${m.scrollW} vw=${m.vw}`);

  // ---------- 平板 1024 / 768 ----------
  for (const [w, h] of [[1024, 768], [768, 1024]]) {
    console.log(`=== 平板 ${w}×${h}：双栏 + 可折叠侧栏 ===`);
    await setViewport(w, h);
    m = await evalJS(MEASURE);
    ok(m.center, `${w}: 编辑器可见`);
    ok(m.sideSwitch, `${w}: 出现侧栏开关`);
    ok(!m.tabs, `${w}: 不显示手机标签栏`);
    ok(m.left !== m.right, `${w}: 任务/MIRA 侧栏只显示一块`, JSON.stringify({ l: m.left, r: m.right }));
    ok(m.bottom, `${w}: 保留底部终端`);
    ok(m.terminal && m.terminal.bottom <= m.vh + 1, `${w}: 终端完整可见`, JSON.stringify(m.terminal));
    ok(m.editor && m.terminal && m.editor.bottom <= m.terminal.y + 1, `${w}: 编辑器不被终端遮挡`);
    ok(m.scrollW <= m.vw + 1 && m.bodyScrollW <= m.vw + 1, `${w}: 无横向溢出`, `scrollW=${m.scrollW}`);
    const beforeW = m.editor.w;
    await evalJS(`document.querySelector('.ss-btn.ico').click()`);
    await sleep(400);
    const collapsed = await evalJS(MEASURE);
    ok(!collapsed.left && !collapsed.right, `${w}: 收起后侧栏隐藏`);
    ok(collapsed.editor.w >= beforeW + 120, `${w}: 收起后编辑器变宽（${beforeW} → ${collapsed.editor.w}）`);
    await evalJS(`document.querySelector('.ss-btn.ico').click()`);
    await sleep(350);
    const restored = await evalJS(MEASURE);
    ok(restored.editor.w <= beforeW + 2, `${w}: 再次展开恢复原宽度`);
    // 侧栏切换任务 / MIRA
    await evalJS(`[...document.querySelectorAll('.ss-btn')].find(b => (b.textContent||'').includes('MIRA')).click()`);
    await sleep(350);
    const miraTab = await evalJS(MEASURE);
    ok(miraTab.right && !miraTab.left, `${w}: 侧栏可切到 MIRA`);
    await evalJS(`[...document.querySelectorAll('.ss-btn')].find(b => (b.textContent||'').includes('任务')).click()`);
    await sleep(350);
  }

  // ---------- 手机竖屏 ----------
  const phones = [[430, 932], [390, 844], [360, 640], [320, 568]];
  for (const [w, h] of phones) {
    console.log(`=== 手机 ${w}×${h}：单栏 + 标签 + 固定操作栏 ===`);
    await setViewport(w, h);
    m = await evalJS(MEASURE);
    ok(m.tabs, `${w}: 显示标签栏`);
    ok(m.actions, `${w}: 显示固定操作栏`);
    ok(!m.left && m.center && !m.right, `${w}: 默认只显示代码区`, JSON.stringify({ l: m.left, c: m.center, r: m.right }));
    ok(!m.bottom, `${w}: 终端不占代码页空间`);
    ok(m.editor && Math.abs(m.editor.w - (w - 16)) <= 3, `${w}: 编辑器占满可用宽度（${m.editor ? m.editor.w : '-'}）`);
    ok(m.editor && m.editor.h >= 170, `${w}: 编辑器高度可用（${m.editor ? m.editor.h : '-'}）`);
    ok(m.actionBar && m.actionBar.bottom <= h + 1, `${w}: 操作栏在视口内`);
    ok(m.actionBar && m.editor && m.editor.bottom <= m.actionBar.y + 1, `${w}: 操作栏不遮挡编辑器`);
    ok(m.actionBtns.some(b => b.t.includes('运行')) && m.actionBtns.some(b => b.t.includes('提交')), `${w}: 运行与提交按钮始终可见`);
    ok(!m.badge || m.badge.bottom <= m.actionBar.y + 1, `${w}: 引擎提示不遮挡操作栏`, JSON.stringify(m.badge));
    ok(m.scrollW <= w + 1 && m.bodyScrollW <= w + 1, `${w}: 无横向溢出`, `scrollW=${m.scrollW}`);
    ok(m.draftBar, `${w}: 草稿栏可见`);

    // 标签切换
    const clickTab = (label) => evalJS(`(() => { const b=[...document.querySelectorAll('.mobile-tabs .mt-btn')].find(x=>(x.textContent||'').includes(${JSON.stringify(label)})); if(!b) return false; b.click(); return true; })()`);
    await clickTab('任务'); await sleep(300);
    m = await evalJS(MEASURE);
    ok(m.left && !m.center, `${w}: 切到「任务」只显示任务面板`);
    await clickTab('输出'); await sleep(300);
    m = await evalJS(MEASURE);
    ok(m.bottom && !m.center && m.terminal && m.terminal.h >= 150, `${w}: 切到「输出」显示终端并占满高度（${m.terminal ? m.terminal.h : '-'}）`);
    await clickTab('MIRA'); await sleep(300);
    m = await evalJS(MEASURE);
    ok(m.right && !m.center, `${w}: 切到「MIRA」只显示助手面板`);
    await clickTab('代码'); await sleep(300);
    m = await evalJS(MEASURE);
    ok(m.center && !m.left && !m.right, `${w}: 切回「代码」`);

    // 换行开关（仅手机可见）
    const wrapBefore = await evalJS(`localStorage.getItem('nexus_editor_wrap') || '0'`);
    await evalJS(`document.querySelector('.chlg-page .only-mobile').click()`);
    await sleep(250);
    const wrapAfter = await evalJS(`localStorage.getItem('nexus_editor_wrap') || '0'`);
    ok(wrapBefore !== wrapAfter, `${w}: 自动换行开关可切换并持久化（${wrapBefore} → ${wrapAfter}）`);
    await evalJS(`document.querySelector('.chlg-page .only-mobile').click()`);
    await sleep(200);
  }

  // ---------- 横屏手机 ----------
  for (const [w, h] of [[844, 390], [667, 375]]) {
    console.log(`=== 横屏 ${w}×${h}：单栏优先编辑器 ===`);
    await setViewport(w, h);
    m = await evalJS(MEASURE);
    ok(m.tabs && m.actions, `${w}×${h}: 横屏使用单栏 + 固定操作栏`);
    ok(m.center && !m.left && !m.right, `${w}×${h}: 代码区可见`);
    ok(m.editor && m.editor.h >= 110, `${w}×${h}: 编辑器仍有可用高度（${m.editor ? m.editor.h : '-'}）`);
    ok(m.actionBar && m.actionBar.bottom <= h + 1, `${w}×${h}: 操作栏在视口内`);
    ok(m.scrollW <= w + 1, `${w}×${h}: 无横向溢出`, `scrollW=${m.scrollW}`);
  }

  // ---------- 虚拟键盘补偿（CSS 变量链路） ----------
  console.log('=== 虚拟键盘：操作栏随 --kb-offset 上移 ===');
  await setViewport(390, 844);
  const before = await evalJS(MEASURE);
  await evalJS(`document.documentElement.style.setProperty('--kb-offset', '300px')`);
  await sleep(250);
  const withKb = await evalJS(MEASURE);
  ok(Math.abs(withKb.actionBar.bottom - (before.actionBar.bottom - 300)) <= 2,
    '键盘弹出时操作栏整体上移 300px',
    `before=${before.actionBar.bottom} after=${withKb.actionBar.bottom}`);
  ok(withKb.actionBar.bottom <= 844 - 300 + 1, '操作栏仍在可视区域内');
  await evalJS(`document.documentElement.style.setProperty('--kb-offset', '0px')`);
  await sleep(200);
  const reset = await evalJS(MEASURE);
  ok(Math.abs(reset.actionBar.bottom - before.actionBar.bottom) <= 2, '键盘收起后复位');

  // ---------- 其他页面横向溢出（320） ----------
  console.log('=== 320px 其他页面横向溢出检查 ===');
  await setViewport(320, 568);
  await evalJS(`[...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('服务器地图')).click()`);
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 12000, '返回地图');
  await sleep(500);
  let mapM = await evalJS(`({ vw: innerWidth, sw: document.documentElement.scrollWidth, bsw: document.body.scrollWidth })`);
  ok(mapM.sw <= mapM.vw + 1 && mapM.bsw <= mapM.vw + 1, '世界地图在 320px 无横向溢出', JSON.stringify(mapM));
  await shot('map-320');
  await click('主菜单');
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 12000, '主菜单');
  await sleep(400);
  const menuM = await evalJS(`({ vw: innerWidth, sw: document.documentElement.scrollWidth, bsw: document.body.scrollWidth })`);
  ok(menuM.sw <= menuM.vw + 1 && menuM.bsw <= menuM.vw + 1, '主菜单在 320px 无横向溢出', JSON.stringify(menuM));
  await shot('menu-320');

  // ---------- 截图（供人工复核） ----------
  await click('继续探索');
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 12000, '再次进入地图');
  await waitFor(`document.querySelectorAll('.node-group').length >= 2`, 10000, '节点');
  await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 10000, '关卡列表');
  await evalJS(`document.querySelectorAll('.lv-row')[0].querySelector('button').click()`);
  await waitFor(`!!document.querySelector('.chlg-page')`, 15000, '再次进入挑战页');
  await sleep(600);

  await setViewport(390, 844);
  await sleep(500);
  await shot('challenge-390');
  await setViewport(900, 800);
  await sleep(500);
  await shot('tablet-900');
  await setViewport(1366, 768);
  await sleep(500);
  await shot('desktop-1366');

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  console.log('Chrome 版本通道已关闭');
  finish(pass === total ? 0 : 1);
})().catch(e => {
  console.error('布局测试失败:', e && e.message ? e.message : e);
  finish(1);
});

function finish(code) {
  try { server.close(); } catch { /* ignore */ }
  try { if (cdp) cdp.ws.close(); } catch { /* ignore */ }
  try {
    if (chrome && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch { /* ignore */ }
  setTimeout(() => process.exit(code), 400);
}
