// A7.1 低性能设备模拟（CPU 6× 节流 + 手机视口）：明确为模拟测试，不代表真实低端机
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4200;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SAVE_KEY = 'nexus_code_repair_save_v1';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.svg': 'image/svg+xml',
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
      }, 60000);
    });
  }
}

function seedSave() {
  return JSON.stringify({
    version: 10, updatedAt: 1700000000000,
    player: {
      name: 'R-07',
      identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1700000000000 },
      level: 1, exp: 0, consciousness: 100,
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
        credits: 500, trust: 30, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [],
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
let chrome = null, cdp = null, sessionId = null, wsUrl = '';
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
    await sleep(200);
  }
  throw new Error('等待超时: ' + label);
}
const clickText = (scope, text) => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(scope)} + ' button')].find(b => (b.textContent || '').includes(${JSON.stringify(text)}));
  if (!el) return false; el.click(); return true;
})()`;

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(250);
  if (!existsSync(CHROME)) throw new Error('找不到 Chrome');
  const profile = join(tmpdir(), 'nexus-a71-lowend-' + Date.now());
  mkdirSync(profile, { recursive: true });
  const D = 11300 + Math.floor(Math.random() * 300);
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--window-size=360,800',
    '--remote-debugging-port=' + D, '--user-data-dir=' + profile, 'about:blank',
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
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 2, mobile: true }, sessionId);
  // 模拟低端机：CPU 6 倍降速（不是真机，报告中明确标注）
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 }, sessionId);
  const src = `try { localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(seedSave())}); } catch (e) {}`;
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: src }, sessionId);

  console.log('=== A. 冷启动（CPU 6× 节流 / 360×800 DPR2）===');
  const tBoot = Date.now();
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
  await waitFor(`!!document.querySelector('.boot-wrap')`, 30000, '启动页');
  if (await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`)) {
    await evalJS(clickText('body', '跳过初始化'));
  }
  await evalJS(clickText('body', 'ENTER NEXUS'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 40000, '主菜单');
  perf.bootMs = Date.now() - tBoot;
  ok(perf.bootMs < 30000, '节流下启动到主菜单 < 30s（' + perf.bootMs + 'ms）');

  console.log('=== B. 进入关卡 ===');
  const tEnter = Date.now();
  await evalJS(clickText('body', '继续探索'));
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 40000, '地图');
  await waitFor(`document.querySelectorAll('.node-group').length >= 2`, 40000, '节点');
  await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 40000, '关卡');
  await evalJS(`document.querySelectorAll('.lv-row')[0].querySelector('button').click()`);
  await waitFor(`!!document.querySelector('.monaco-editor')`, 60000, '编辑器');
  await sleep(1200);
  perf.enterMs = Date.now() - tEnter;
  ok(perf.enterMs < 40000, '节流下进入关卡 < 40s（' + perf.enterMs + 'ms）');
  const layout = await evalJS(`({ sw: document.documentElement.scrollWidth, vw: innerWidth, ed: Math.round(document.querySelector('.code-frame')?.getBoundingClientRect().height || 0) })`);
  ok(layout.sw <= layout.vw + 1, '节流+手机视口无横向溢出', JSON.stringify(layout));
  ok(layout.ed >= 150, '编辑器仍有可用高度（' + layout.ed + 'px）');

  console.log('=== C. 连续运行与 Worker 超时 ===');
  const runOnce = async (code) => {
    await evalJS(`(() => { window.monaco.editor.getModels()[0].setValue(${JSON.stringify(code)}); return true; })()`);
    await sleep(900);
    const t = Date.now();
    await evalJS(clickText('.chlg-page .toolbar', '运行代码'));
    await waitFor(`(() => { const el=document.querySelector('.diag-panel'); return el && el.dataset.status==='done'; })()`, 30000, '运行完成');
    return Date.now() - t;
  };
  const times = [];
  for (let i = 0; i < 3; i++) times.push(await runOnce('print(' + i + ')'));
  perf.runAvgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  ok(perf.runAvgMs < 8000, '节流下简单代码平均运行 < 8s（' + perf.runAvgMs + 'ms）');

  const loopCode = ['while True:', '    pass'].join('\n');
  await evalJS(`(() => { window.monaco.editor.getModels()[0].setValue(${JSON.stringify(loopCode)}); return true; })()`);
  await sleep(1100);
  const tTimeout = Date.now();
  await evalJS(clickText('.chlg-page .toolbar', '运行代码'));
  await waitFor(`(() => { const el=document.querySelector('.diag-panel'); return el && el.dataset.status==='done'; })()`, 60000, '超时终止');
  perf.timeoutMs = Date.now() - tTimeout;
  const diagKind = await evalJS(`document.querySelector('.diag-panel').dataset.kind`);
  perf.timeoutKind = diagKind;
  ok(perf.timeoutMs < 30000, '节流下死循环仍能在 30s 内被终止（' + perf.timeoutMs + 'ms, kind=' + diagKind + '）');
  const alive = await runOnce('print(42)');
  ok(alive > 0, '终止后页面与 Worker 可继续使用（' + alive + 'ms）');

  console.log('=== D. 存档写入与内存 ===');
  const write = await evalJS(`(() => { const t=performance.now(); for (let i=0;i<200;i++){ localStorage.setItem('__a71_low', String(i)); } localStorage.removeItem('__a71_low'); return Math.round(performance.now()-t); })()`);
  perf.save200Ms = write;
  ok(write < 2000, '节流下 200 次存档写入 < 2s（' + write + 'ms）');
  const heap = await evalJS(`performance.memory ? { used: Math.round(performance.memory.usedJSHeapSize/1048576), total: Math.round(performance.memory.totalJSHeapSize/1048576) } : null`);
  perf.heap = heap;
  if (heap) ok(heap.used < 400, '节流下 JS 堆 < 400MB（' + heap.used + 'MB）');

  console.log('PERF ' + JSON.stringify(perf));
  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  finish(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('低性能模拟测试失败:', e && e.message ? e.message : e);
  finish(1);
});

function finish(code) {
  try { server.close(); } catch { /* ignore */ }
  try { if (cdp) cdp.ws.close(); } catch { /* ignore */ }
  try { if (chrome && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* ignore */ }
  setTimeout(() => process.exit(code), 400);
}
