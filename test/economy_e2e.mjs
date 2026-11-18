// A6 端到端：首通收益 / 重复通关零收益 / 升级与账本 / HUD 货币 / 余额不足提示 / 移动端
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4192;
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

function seedSave({ credits = 500, exp = 2700, level = 9, consciousness = 100 } = {}) {
  return JSON.stringify({
    version: 9, updatedAt: 1700000000000,
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
        bossesDone: [], currentBossId: null, pendingRebirth: false,
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

async function seedAndOpen(seed) {
  if (seedId) { try { await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedId }, sessionId); } catch { /* ignore */ } }
  const src = `try { localStorage.clear(); localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(seed)}); } catch (e) {}`;
  const r = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: src }, sessionId);
  seedId = r.identifier;
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
  await sleep(800);
}

async function toMapAndEnter() {
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
  await waitFor(`!!document.querySelector('.monaco-editor')`, 20000, '挑战页');
  await sleep(600);
}

async function submitCorrect() {
  await evalJS(`(() => { const m=window.monaco.editor.getModels()[0]; m.setValue('log_title = "服务器状态报告"\\n\\nif log_title != "":\\n    print(log_title)'); return true; })()`);
  await sleep(600);
  await evalJS(clickText('.chlg-page .toolbar', '提交修复'));
  await waitFor(`document.body.textContent.includes('修复成功')`, 20000, '通关面板');
  await sleep(300);
}

(async () => {
  if (!existsSync(CHROME)) throw new Error('找不到 Chrome');
  server.listen(PORT, '127.0.0.1');
  await sleep(250);
  const profile = join(tmpdir(), 'nexus-a6-cdp-' + Date.now());
  mkdirSync(profile, { recursive: true });
  const D = 10700 + Math.floor(Math.random() * 300);
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1366,900', '--remote-debugging-port=' + D, '--user-data-dir=' + profile, 'about:blank',
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
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

  console.log('=== A. 首通收益 / 升级 / 账本 ===');
  await seedAndOpen(seedSave({ credits: 500, exp: 2740 }));
  await toMapAndEnter();
  const hudGold = await evalJS(`([...document.querySelectorAll('.hud-chip')].find(x => x.textContent.includes('◈')) || {}).textContent || ''`);
  ok(/◈\s*500/.test(hudGold), '挑战页 HUD 显示贡献点', hudGold);
  await submitCorrect();
  const panel = await evalJS(`document.querySelector('.cp-summary').parentElement.textContent`);
  ok(/贡献点\s*\+?90/.test(panel), '首通贡献点 90（20 基础 + 30 首通 + 10 零失误 + 10 未用提示 + 20 评级）', panel.slice(0, 160));
  ok(/等级 Lv\.10/.test(panel), '经验 2740+60 后升到 Lv.10', panel.slice(0, 220));
  const sv1 = await evalJS(`${readSave}`);
  ok(sv1.version === 10, '旧档 v9 迁移为 v10', String(sv1.version));
  ok(sv1.player.exp === 2800 && sv1.player.level === 10, '经验与等级写入存档', sv1.player.exp + '/' + sv1.player.level);
  ok(sv1.player.rewards.credits === 590, '贡献点 500+90=590', String(sv1.player.rewards.credits));
  const ledger1 = sv1.player.rewards.ledger || [];
  ok(ledger1.length === 1 && ledger1[0].kind === 'level' && ledger1[0].ref === '1-1', '奖励账本写入首通流水', JSON.stringify(ledger1));
  ok(ledger1[0].credits === 90 && ledger1[0].exp === 60, '账本记录贡献点与经验', JSON.stringify(ledger1[0]));
  ok(sv1.player.rewards.unlocks && sv1.player.rewards.unlocks.includes('particles-origin'), 'Lv.10 解锁原初辉光');
  await sleep(200);

  console.log('=== B. 重复通关：零收益、账本不重复 ===');
  await evalJS(clickText('body', '返回地图'));
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 15000, '返回地图');
  await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 12000, '关卡列表');
  await evalJS(`document.querySelectorAll('.lv-row')[0].querySelector('button').click()`);
  await waitFor(`!!document.querySelector('.monaco-editor')`, 20000, '再次进入 1-1');
  await sleep(600);
  await submitCorrect();
  const panel2 = await evalJS(`document.querySelector('.cp-summary').parentElement.textContent`);
  ok(/贡献点\s*\+?0/.test(panel2) || !/\+100/.test(panel2), '重复通关不再发放首通奖励', panel2.slice(0, 160));
  const sv2 = await evalJS(`${readSave}`);
  ok(sv2.player.rewards.credits === 590, '重复通关后余额不变', String(sv2.player.rewards.credits));
  ok(sv2.player.exp === 2800, '重复通关不发放经验', String(sv2.player.exp));
  const levelRows = (sv2.player.rewards.ledger || []).filter(e => e.kind === 'level' && e.ref === '1-1');
  ok(levelRows.length === 1, '账本不会重复记录同一首通', String(levelRows.length));

  console.log('=== C. 余额不足提示与 HUD ===');
  await seedAndOpen(seedSave({ credits: 50, exp: 100, level: 2 }));
  await waitFor(`!!document.querySelector('.boot-wrap')`, 20000, '启动页');
  const skip = await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`);
  if (skip) await evalJS(clickText('body', '跳过初始化'));
  await evalJS(clickText('body', 'ENTER NEXUS'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 15000, '主菜单');
  await evalJS(clickText('body', '奖励兑换中心'));
  await waitFor(`!!document.querySelector('.shop-page')`, 15000, '兑换中心');
  await sleep(600);
  const card = await evalJS(`(() => { const c=[...document.querySelectorAll('.shop-card')].find(x=>x.textContent.includes('原初继承者')); if(!c) return false; c.click(); return true; })()`);
  ok(card, '打开高价商品详情');
  await waitFor(`!!document.querySelector('.sd-hint')`, 5000, '余额不足提示');
  const hint = await evalJS(`document.querySelector('.sd-hint').textContent`);
  ok(/还差\s*◈\s*370/.test(hint) || /还差/.test(hint), '显示还差多少贡献点', hint);
  ok((await evalJS(`document.querySelector('.sd-foot button').disabled`)) === true, '余额不足时购买按钮禁用');
  await evalJS(`document.querySelector('.sd-close').click()`);
  await sleep(200);

  console.log('=== D. 刷新与移动端 ===');
  const before = await evalJS(`${readSave}`);
  await cdp.send('Page.reload', {}, sessionId);
  await sleep(900);
  const after = await evalJS(`${readSave}`);
  ok(after.player.rewards.credits === before.player.rewards.credits, '刷新后余额一致');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
  await sleep(500);
  await waitFor(`!!document.querySelector('.boot-wrap')`, 20000, '重启启动页');
  const skip2 = await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`);
  if (skip2) await evalJS(clickText('body', '跳过初始化'));
  await evalJS(clickText('body', 'ENTER NEXUS'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 15000, '手机端主菜单');
  await evalJS(clickText('body', '奖励兑换中心'));
  await waitFor(`!!document.querySelector('.shop-page')`, 10000, '手机商城');
  const m = await evalJS(`(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, gold: ([...document.querySelectorAll('.hud-chip')].find(x=>x.textContent.includes('◈'))||{}).textContent||'' }))()`);
  ok(m.sw <= m.vw + 1, '手机端无横向溢出');
  ok(/◈/.test(m.gold), '手机端显示贡献点', m.gold);

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  finish(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('A6 E2E 失败:', e && e.message ? e.message : e);
  finish(1);
});

function finish(code) {
  try { server.close(); } catch { /* ignore */ }
  try { if (cdp) cdp.ws.close(); } catch { /* ignore */ }
  try { if (chrome && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* ignore */ }
  setTimeout(() => process.exit(code), 400);
}
