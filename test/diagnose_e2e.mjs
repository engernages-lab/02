// A3 端到端：真实 MicroPython 诊断面板（语法/运行时/输出/超时/分层/MIRA）+ A1 草稿 + A2 移动端 + 判题不受影响
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4186;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
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
      }, 30000);
    });
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
      completedLevels: ['tut-1'], stars: { 'tut-1': 3 },
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

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

let chrome = null, cdp = null, sessionId = null, wsUrl = '';

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

async function setViewport(width, height) {
  const mobile = (width <= 767) || (width <= 1100 && height <= 520);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height }, sessionId);
  await sleep(450);
}

async function shot(name) {
  try {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
    const dir = join(__dirname, '_a3_shots');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name + '.png'), Buffer.from(r.data, 'base64'));
  } catch { /* ignore */ }
}

const READ_DIAG = `(() => {
  const el = document.querySelector('.diag-panel');
  if (!el) return null;
  return { kind: el.dataset.kind, error: el.dataset.error, line: el.dataset.line, layers: el.dataset.layers, status: el.dataset.status, text: el.textContent || '' };
})()`;

const clickText = (scope, text) => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(scope)} + ' button')].find(b => (b.textContent || '').includes(${JSON.stringify(text)}));
  if (!el) return false; el.click(); return true;
})()`;

async function setCode(code) {
  const set = await evalJS(`(() => {
    const m = window.monaco;
    if (!m || !m.editor) return false;
    const models = m.editor.getModels();
    if (!models.length) return false;
    models[0].setValue(${JSON.stringify(code)});
    return true;
  })()`);
  if (!set) throw new Error('无法设置编辑器内容（monaco 未就绪）');
  const lines = code.split('\n').length;
  await waitFor(`(() => { const m = (document.querySelector('.draft-lines') || {}).textContent || ''; return m.includes('当前 ${lines} 行'); })()`, 8000, '编辑器内容同步（' + lines + ' 行）');
  await sleep(200);
}

async function runCode() {
  const clicked = await evalJS(clickText('.chlg-page .toolbar', '运行代码'));
  if (!clicked) throw new Error('找不到运行按钮');
  await sleep(200);
}

async function submitCode() {
  const clicked = await evalJS(clickText('.chlg-page .toolbar', '提交修复'));
  if (!clicked) throw new Error('找不到提交按钮');
  await sleep(200);
}

async function waitDiag(kind, ms = 12000) {
  await waitFor(`(() => { const el = document.querySelector('.diag-panel'); return el && el.dataset.status === 'done' && el.dataset.kind === ${JSON.stringify(kind)}; })()`, ms, '诊断=' + kind);
  return evalJS(READ_DIAG);
}

(async () => {
  if (!existsSync(CHROME)) throw new Error('找不到 Chrome');
  server.listen(PORT, '127.0.0.1');
  await sleep(250);

  const profile = join(tmpdir(), 'nexus-a3-cdp-' + Date.now());
  mkdirSync(profile, { recursive: true });
  const DEBUG_PORT = 9400 + Math.floor(Math.random() * 500);
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1366,900', '--remote-debugging-port=' + DEBUG_PORT,
    '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });

  const t0 = Date.now();
  while (!wsUrl && Date.now() - t0 < 20000) {
    try {
      const j = await (await fetch('http://127.0.0.1:' + DEBUG_PORT + '/json/version')).json();
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
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { localStorage.setItem('nexus_code_repair_save_v1', ${JSON.stringify(SAVE)}); } catch (e) {}`,
  }, sessionId);

  await setViewport(1366, 900);
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
  await sleep(700);

  async function enterChallenge() {
    await waitFor(`!!document.querySelector('.boot-wrap')`, 20000, '启动页');
    const hasSkip = await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`);
    if (hasSkip) await evalJS(clickText('body', '跳过初始化'));
    await evalJS(clickText('body', 'ENTER NEXUS'));
    await waitFor(`document.body.textContent.includes('Python 知识库')`, 15000, '主菜单');
    await evalJS(clickText('body', '继续探索'));
    await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 15000, '世界地图');
    await waitFor(`document.querySelectorAll('.node-group').length >= 2`, 12000, '地图节点');
    await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
    await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 12000, '关卡列表');
    await evalJS(`document.querySelectorAll('.lv-row')[0].querySelector('button').click()`);
    await waitFor(`!!document.querySelector('.chlg-page') && !!document.querySelector('.diag-panel')`, 20000, '挑战页');
    await waitFor(`!!document.querySelector('.monaco-editor')`, 20000, '代码编辑器');
    await sleep(500);
  }

  await enterChallenge();
  ok(true, '进入挑战页并加载编辑器');

  console.log('=== A. 语法错误诊断（真实执行） ===');
  const SYNTAX = 'log_title = "服务器状态报告"\n\nif log_title != ""\n    print(log_title)';
  await setCode(SYNTAX);
  await runCode();
  let d = await waitDiag('syntax');
  ok(d.error === 'SyntaxError', '识别为 SyntaxError', d.error);
  ok(d.line === '3', '定位到第 3 行', d.line);
  ok(/冒号/.test(d.text), '说明指出缺少冒号', d.text.slice(0, 80));
  ok(/MIRA/.test(d.text), '诊断面板包含 MIRA 建议');
  ok(d.layers === '1', '首次错误只展开第一层', d.layers);

  console.log('=== B. 分层提示：连续三次同一错误 ===');
  await runCode();
  await waitDiag('syntax');
  await sleep(400);
  d = await evalJS(READ_DIAG);
  ok(d.layers === '2', '第二次同类错误展开到第二层', d.layers);
  await runCode();
  await waitDiag('syntax');
  await sleep(400);
  d = await evalJS(READ_DIAG);
  ok(d.layers === '3', '第三次同类错误展开到第三层', d.layers);
  ok(/第 3 层/.test(d.text), '界面出现第三层提示');

  console.log('=== C. 运行时错误 ===');
  await setCode('repair_id = "R-07"\n\nprint(repair_ids)');
  await runCode();
  d = await waitDiag('runtime');
  ok(d.error === 'NameError', '识别为 NameError', d.error);
  ok(d.line === '3', 'NameError 行号正确', d.line);
  ok(/repair_ids/.test(d.text), '面板包含未定义的名字');
  await shot('diag-nameerror');

  console.log('=== C2. 含 while 的正常代码仍能执行（沙箱路径） ===');
  await setCode('i = 0\nwhile i < 3:\n    i += 1\nprint(i)');
  const tWhile = Date.now();
  await runCode();
  await waitDiag('ok', 15000);
  const whileMs = Date.now() - tWhile;
  ok(whileMs < 8000, '纯 while 代码通过沙箱正常返回（' + whileMs + 'ms）');
  const termText = await evalJS(`(document.querySelector('.term-body') || {}).textContent || ''`);
  ok(termText.includes('3'), '沙箱执行的输出正确（3）', termText.slice(-60));

  console.log('=== D. 输出不匹配（正式判题） ===');
  await setCode('log_title = "错误标题"\n\nif log_title != "":\n    print(log_title)');
  await submitCode();
  d = await waitDiag('output', 15000);
  ok(d.kind === 'output', '判题失败分类为输出不匹配', d.kind);
  ok(/输出|差异/.test(d.text), '提示指向输出差异');
  await waitFor(`!!document.querySelector('.result-banner.fail')`, 8000, '判题失败横幅');
  ok(true, '原有判题失败横幅仍显示');

  console.log('=== E. while 死循环：Worker 沙箱硬超时 ===');
  await setCode('while True:\n    pass');
  const tRun = Date.now();
  await runCode();
  d = await waitDiag('timeout', 20000);
  const elapsed = Date.now() - tRun;
  ok(d.kind === 'timeout', '识别执行超时', d.kind);
  ok(elapsed < 15000, '超时在合理时间内返回（' + elapsed + 'ms）');
  ok(/循环/.test(d.text), '提示解释循环未结束');
  const alive = await evalJS(`document.title !== '' && !!document.querySelector('.chlg-page')`);
  ok(alive, '超时后页面仍可交互（未被死循环卡死）');
  await shot('diag-timeout');

  console.log('=== F. A1 草稿：诊断后仍然保存并可恢复 ===');
  const draftRaw = await evalJS(`localStorage.getItem('nexus_draft_v1:p1700000000000:1-1')`);
  ok(!!draftRaw, '诊断过程写入了草稿（A1 正常）');
  const draftCode = draftRaw ? JSON.parse(draftRaw).code : '';
  ok(draftCode === 'while True:\n    pass', '草稿内容为最后一次编辑的代码');
  await cdp.send('Page.reload', {}, sessionId);
  await sleep(800);
  await enterChallenge();
  const restored = await evalJS(`(document.querySelector('.draft-lines') || {}).textContent || ''`);
  ok(restored.includes('当前 2 行'), '刷新后草稿恢复（2 行）', restored);
  ok((await evalJS(`document.querySelector('.diag-panel').dataset.status`)) === 'idle', '刷新后诊断回到待运行状态');

  console.log('=== G. A2 移动端：诊断标签 / 无横向溢出 ===');
  for (const [w, h] of [[320, 568], [360, 640], [390, 844], [430, 932]]) {
    await setViewport(w, h);
    const tab = await evalJS(`(() => { const b=[...document.querySelectorAll('.mobile-tabs .mt-btn')].find(x=>(x.textContent||'').includes('诊断')); if(!b) return false; b.click(); return true; })()`);
    ok(tab, w + ': 存在「诊断」标签并可点击');
    await sleep(350);
    const m = await evalJS(`(() => {
      const r = document.querySelector('.diag-panel').getBoundingClientRect();
      const bar = document.querySelector('.mobile-actions').getBoundingClientRect();
      return { w: Math.round(r.width), right: Math.round(r.right), sw: document.documentElement.scrollWidth, vw: innerWidth, barBottom: Math.round(bar.bottom), vh: innerHeight };
    })()`);
    ok(m.sw <= m.vw + 1, w + ': 诊断页无横向溢出', JSON.stringify(m));
    ok(m.right <= m.vw + 1, w + ': 诊断面板不超出视口');
    ok(m.barBottom <= m.vh + 1, w + ': 操作栏仍在视口内');
    // 回到代码标签，编辑器高度不被诊断面板挤压
    await evalJS(`(() => { const b=[...document.querySelectorAll('.mobile-tabs .mt-btn')].find(x=>(x.textContent||'').includes('代码')); b && b.click(); })()`);
    await sleep(300);
    const ed = await evalJS(`(() => { const r = document.querySelector('.code-frame').getBoundingClientRect(); return Math.round(r.height); })()`);
    ok(ed >= 160, w + ': 代码页编辑器高度不受诊断面板影响（' + ed + 'px）');
  }

  console.log('=== H. 手机端真实诊断（390px，运行按钮走固定操作栏） ===');
  await setViewport(390, 844);
  await sleep(350);
  await evalJS(`(() => { const b=[...document.querySelectorAll('.mobile-tabs .mt-btn')].find(x=>(x.textContent||'').includes('代码')); b && b.click(); })()`);
  await sleep(250);
  await setCode('if True\n    print(1)');
  const mobileRun = await evalJS(`(() => { const b=[...document.querySelectorAll('.mobile-actions button')].find(x=>(x.textContent||'').includes('运行')); if(!b) return false; b.click(); return true; })()`);
  ok(mobileRun, '手机固定操作栏可触达「运行」');
  d = await waitDiag('syntax', 15000);
  ok(d.error === 'SyntaxError' && d.line === '1', '手机端真实执行后给出语法诊断', d.error + ':' + d.line);
  await evalJS(`(() => { const b=[...document.querySelectorAll('.mobile-tabs .mt-btn')].find(x=>(x.textContent||'').includes('诊断')); b && b.click(); })()`);
  await sleep(400);
  const mobileDiagVisible = await evalJS(`(() => { const p=document.querySelector('.diag-panel'); return getComputedStyle(p).display !== 'none' && p.getBoundingClientRect().height > 80; })()`);
  ok(mobileDiagVisible, '手机诊断标签显示真实诊断结果');
  await shot('diag-mobile');

  console.log('=== I. 平板：侧栏「诊断」切换 ===');
  await setViewport(900, 800);
  await sleep(400);
  const sideDiag = await evalJS(`(() => { const b=[...document.querySelectorAll('.ss-btn')].find(x=>(x.textContent||'').includes('诊断')); if(!b) return false; b.click(); return true; })()`);
  ok(sideDiag, '平板侧栏出现「诊断」入口');
  await sleep(350);
  const sideOk = await evalJS(`(() => { const p=document.querySelector('.diag-panel'); const s=getComputedStyle(p); return s.display !== 'none' && p.getBoundingClientRect().width > 100; })()`);
  ok(sideOk, '平板切到诊断后诊断面板可见');

  console.log('=== J. 判题不受影响：正确代码通过 ===');
  await setViewport(1366, 900);
  await sleep(400);
  await setCode('log_title = "服务器状态报告"\n\nif log_title != "":\n    print(log_title)');
  await submitCode();
  await waitFor(`document.body.textContent.includes('修复成功')`, 15000, '通关面板');
  ok(true, '正确代码仍可通过原有判题');
  d = await evalJS(READ_DIAG);
  ok(d.kind === 'ok', '诊断显示判题通过', d.kind);
  await shot('complete-overlay');

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  finish(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('A3 E2E 失败:', e && e.message ? e.message : e);
  finish(1);
});

function finish(code) {
  try { server.close(); } catch { /* ignore */ }
  try { if (cdp) cdp.ws.close(); } catch { /* ignore */ }
  try { if (chrome && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* ignore */ }
  setTimeout(() => process.exit(code), 400);
}
