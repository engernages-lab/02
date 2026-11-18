// A5 端到端：真实购买、扣费、限购、背包使用、装备、经验增幅、刷新持久化、手机端
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4190;
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

function seedSave({ credits = 800, consciousness = 40, level = 5, exp = 1040, items = {} } = {}) {
  return JSON.stringify({
    version: 8, updatedAt: 1700000000000,
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
        credits, trust: 30, items, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [],
        transactions: [], purchases: {}, buffs: { shield: 0, guard: 0, barrier: 0, hintTicket: 0, expBoost: null },
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

async function setViewport(w, h) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 767 }, sessionId);
  await sleep(350);
}
async function shot(name) {
  try {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
    const dir = join(__dirname, '_a5_shots');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name + '.png'), Buffer.from(r.data, 'base64'));
  } catch { /* ignore */ }
}

async function seedAndOpen(seed) {
  if (seedId) { try { await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedId }, sessionId); } catch { /* ignore */ } }
  const src = `try {
    localStorage.clear();
    localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(seed)});
  } catch (e) {}`;
  const r = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: src }, sessionId);
  seedId = r.identifier;
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
  await sleep(800);
}

async function clearSeed() {
  if (!seedId) return;
  try { await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedId }, sessionId); } catch { /* ignore */ }
  seedId = null;
}

async function bootToMenu() {
  await waitFor(`!!document.querySelector('.boot-wrap')`, 20000, '启动页');
  const hasSkip = await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`);
  if (hasSkip) await evalJS(clickText('body', '跳过初始化'));
  await evalJS(clickText('body', 'ENTER NEXUS'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 15000, '主菜单');
}
async function openShop() {
  await bootToMenu();
  await evalJS(clickText('body', '奖励兑换中心'));
  await waitFor(`!!document.querySelector('.shop-page')`, 15000, '兑换中心');
  await waitFor(`document.querySelectorAll('.shop-card').length >= 6`, 8000, '商品列表');
}
async function goMap() {
  await evalJS(clickText('body', '主菜单'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 12000, '主菜单');
  await evalJS(clickText('body', '继续探索'));
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 12000, '世界地图');
}

async function openCard(name) {
  const r = await evalJS(`(() => {
    const c = [...document.querySelectorAll('.shop-card')].find(x => (x.textContent || '').includes(${JSON.stringify(name)}));
    if (!c) return false; c.click(); return true;
  })()`);
  if (!r) throw new Error('找不到商品卡片: ' + name);
  await waitFor(`!!document.querySelector('.shop-drawer')`, 5000, '商品详情');
  await sleep(250);
}

async function buyFromDetail(double = false) {
  const clicked = await evalJS(`(() => { const b=document.querySelector('.sd-foot button'); if(!b || b.disabled) return false; b.click(); return true; })()`);
  if (!clicked) throw new Error('购买按钮不可用');
  await waitFor(`!!document.querySelector('.shop-confirm')`, 5000, '二次确认');
  const pay = double
    ? `(() => { const b=[...document.querySelectorAll('.shop-confirm button')].find(x=>(x.textContent||'').includes('确认支付')); if(!b) return false; b.click(); b.click(); return true; })()`
    : `(() => { const b=[...document.querySelectorAll('.shop-confirm button')].find(x=>(x.textContent||'').includes('确认支付')); if(!b) return false; b.click(); return true; })()`;
  await evalJS(pay);
  await sleep(500);
  await waitFor(`!document.querySelector('.shop-confirm')`, 5000, '确认框关闭');
}

const credits = async () => (await evalJS(`${readSave}`)).player.rewards.credits;
const rwOf = async () => (await evalJS(`${readSave}`)).player.rewards;

(async () => {
  if (!existsSync(CHROME)) throw new Error('找不到 Chrome');
  server.listen(PORT, '127.0.0.1');
  await sleep(250);
  const profile = join(tmpdir(), 'nexus-a5-cdp-' + Date.now());
  mkdirSync(profile, { recursive: true });
  const PORT2 = 10300 + Math.floor(Math.random() * 300);
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1366,900', '--remote-debugging-port=' + PORT2, '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });
  const t0 = Date.now();
  while (!wsUrl && Date.now() - t0 < 20000) {
    try {
      const j = await (await fetch('http://127.0.0.1:' + PORT2 + '/json/version')).json();
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
  await setViewport(1366, 900);

  console.log('=== A. 商品展示与详情 ===');
  await seedAndOpen(seedSave({ credits: 800, consciousness: 40 }));
  await openShop();
  const cardCount = await evalJS(`document.querySelectorAll('.shop-card').length`);
  ok(cardCount >= 20, '商城展示全部上架商品（' + cardCount + ' 件）');
  ok((await evalJS(`document.querySelectorAll('.shop-cat').length`)) >= 7, '六个分类 + 全部筛选');
  ok((await evalJS(`([...document.querySelectorAll('.shop-tab')].map(x=>x.textContent).join('|'))`)).includes('我的背包'), '背包标签存在');

  await openCard('护盾核心');
  const detail = await evalJS(`document.querySelector('.shop-drawer').textContent`);
  ok(/护盾核心/.test(detail) && /稀有/.test(detail), '详情显示名称与稀有度');
  ok(/实际功能/.test(detail) && /自动拦截/.test(detail), '详情显示真实功能');
  ok(/◈ 60/.test(detail), '详情显示价格 60');
  ok(/◈ 800/.test(detail), '详情显示当前余额 800');
  ok(/限购 5 件 · 已购 0/.test(detail), '详情显示购买限制');
  ok((await evalJS(`!!document.querySelector('.shop-drawer .qty-ctl')`)), '详情提供数量选择');
  const rects = await evalJS(`(() => {
    const rr = (sel) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom) }; };
    return { foot: rr('.sd-foot'), vh: innerHeight };
  })()`);
  ok(rects.foot && rects.foot.b <= rects.vh + 1 && rects.foot.t < rects.vh, '购买按钮常驻可见（不被抽屉滚动挤出）', JSON.stringify(rects));
  // 等迁移提示消失后再截图，避免 toast 遮挡详情标题
  await sleep(4200);
  await shot('shop-detail');

  console.log('=== B. 购买：二次确认 / 扣费 / 双击只扣一次 ===');
  await buyFromDetail(true);
  ok((await credits()) === 740, '双击确认只扣一次（800-60=740）', String(await credits()));
  const rw1 = await rwOf();
  ok(rw1.items['shield-core'] === 1, '背包获得 1 个护盾核心');
  ok(rw1.transactions.length === 1 && rw1.transactions[0].status === 'ok' && rw1.transactions[0].total === 60, '交易记录写入 1 笔成功交易');
  ok((await evalJS(`(document.querySelector('.result-banner')||{}).textContent||''`)).includes('交易完成'), '购买成功反馈可见');

  await evalJS(`document.querySelector('.sd-close').click()`);
  await sleep(250);

  console.log('=== C. 余额不足 ===');
  await seedAndOpen(seedSave({ credits: 200 }));
  await openShop();
  ok((await credits()) === 200, '[C] 初始余额 200', String(await credits()));
  await openCard('经验增幅器');
  const plus = await evalJS(`(() => { const b=[...document.querySelectorAll('.qty-ctl button')].find(x=>x.textContent.includes('＋')); if(!b) return false; b.click(); return true; })()`);
  ok(plus, '可增加购买数量');
  await sleep(250);
  const payText = await evalJS(`document.querySelector('.sd-foot button').textContent`);
  ok(/余额不足/.test(payText), '数量×2 超出余额时显示余额不足', payText);
  ok((await evalJS(`document.querySelector('.sd-foot button').disabled`)) === true, '余额不足时购买按钮禁用');
  await evalJS(`document.querySelector('.sd-close').click()`);
  await sleep(200);

  console.log('=== D. 限购：买满后拒绝 ===');
  await seedAndOpen(seedSave({ credits: 1000 }));
  await openShop();
  await openCard('容错护符');
  await evalJS(`(() => { const b=[...document.querySelectorAll('.qty-ctl button')].find(x=>x.textContent.includes('＋')); b && b.click(); b && b.click(); return true; })()`);
  await buyFromDetail(false);
  ok((await credits()) === 715, '买 3 件护符扣 285', String(await credits()));
  await sleep(300);
  const footText = await evalJS(`document.querySelector('.sd-foot button') ? document.querySelector('.sd-foot button').textContent : (document.querySelector('.sd-foot').textContent)`);
  ok(/已达购买上限/.test(footText), '买满限购后按钮显示已达购买上限', footText);
  await evalJS(`document.querySelector('.sd-close').click()`);
  await sleep(200);
  await openCard('终端主题 · 霓虹脉冲');
  await buyFromDetail(false);
  await sleep(300);
  const ownedText = await evalJS(`document.querySelector('.sd-foot').textContent`);
  ok(/已拥有|装备/.test(ownedText), '一次性外观购买后显示已拥有/装备', ownedText);
  await evalJS(`document.querySelector('.sd-close').click()`);

  console.log('=== E. 背包：使用 / 装备 / 卸下 ===');
  await evalJS(`(() => { const b=[...document.querySelectorAll('.shop-tab')].find(x=>(x.textContent||'').includes('我的背包')); b && b.click(); })()`);
  await waitFor(`!!document.querySelector('.shop-bag')`, 5000, '背包');
  const bagText = await evalJS(`document.querySelector('.shop-bag').textContent`);
  ok(/容错护符/.test(bagText) && /×3/.test(bagText), '背包显示道具与数量');
  ok(/终端主题 · 霓虹脉冲/.test(bagText), '背包显示已购外观');
  const equip = await evalJS(`(() => { const row=[...document.querySelectorAll('.bag-row')].find(x=>x.textContent.includes('霓虹脉冲')); if(!row) return false; const b=[...row.querySelectorAll('button')].find(x=>x.textContent.includes('装备')); if(!b) return false; b.click(); return true; })()`);
  ok(equip, '背包内可装备外观');
  await sleep(300);
  ok((await rwOf()).equipped.terminal === 'terminal-neon', '装备状态写入存档');
  const unequip = await evalJS(`(() => { const row=[...document.querySelectorAll('.bag-row')].find(x=>x.textContent.includes('霓虹脉冲')); const b=row && [...row.querySelectorAll('button')].find(x=>x.textContent.includes('卸下')); if(!b) return false; b.click(); return true; })()`);
  ok(unequip, '背包内可卸下装备');
  await sleep(300);
  ok(!(await rwOf()).equipped.terminal, '卸下后装备槽清空');
  await sleep(4200);
  await shot('shop-bag');

  console.log('=== F. 消耗品真实效果 ===');
  await seedAndOpen(seedSave({ credits: 800, consciousness: 40, items: { 'nano-restore': 1 } }));
  await openShop();
  await evalJS(`(() => { const b=[...document.querySelectorAll('.shop-tab')].find(x=>(x.textContent||'').includes('我的背包')); b && b.click(); })()`);
  await waitFor(`!!document.querySelector('.shop-bag')`, 5000, '背包');
  const useBtn = await evalJS(`(() => { const row=[...document.querySelectorAll('.bag-row')].find(x=>x.textContent.includes('纳米修复液')); const b=row && [...row.querySelectorAll('button')].find(x=>x.textContent.includes('使用')); if(!b) return false; b.click(); return true; })()`);
  ok(useBtn, '背包内可使用消耗品');
  await sleep(400);
  const saveHeal = await evalJS(`${readSave}`);
  ok(saveHeal.player.consciousness === 70, '纳米修复液恢复 30 点意识（40→70）', String(saveHeal.player.consciousness));
  ok((saveHeal.player.rewards.items['nano-restore'] || 0) === 0, '使用后库存归零');
  const useAgain = await evalJS(`(() => { const row=[...document.querySelectorAll('.bag-row')].find(x=>x.textContent.includes('纳米修复液')); return !!row; })()`);
  ok(!useAgain, '库存耗尽后背包不再显示该消耗品');

  console.log('=== G. 交易记录 / 刷新持久化 ===');
  await evalJS(`(() => { const b=[...document.querySelectorAll('.shop-tab')].find(x=>(x.textContent||'').includes('交易记录')); b && b.click(); })()`);
  await waitFor(`!!document.querySelector('.shop-history')`, 5000, '交易记录');
  const txText = await evalJS(`document.querySelector('.shop-history').textContent`);
  ok(/交易记录/.test(txText), '交易记录页存在');
  const beforeReload = await evalJS(`${readSave}`);
  await clearSeed();
  await cdp.send('Page.reload', {}, sessionId);
  await sleep(900);
  await openShop();
  const afterReload = await evalJS(`${readSave}`);
  ok(afterReload.player.rewards.credits === beforeReload.player.rewards.credits, '刷新后余额一致');
  ok(afterReload.player.rewards.transactions.length === beforeReload.player.rewards.transactions.length, '刷新后交易记录不重复不丢失');
  ok(afterReload.player.rewards.items['nano-restore'] === 0, '刷新后道具使用状态保持');

  console.log('=== H. 经验增幅接入结算 ===');
  await seedAndOpen(seedSave({ credits: 1000, exp: 0, consciousness: 100 }));
  await openShop();
  await openCard('经验增幅器');
  await buyFromDetail(false);
  await evalJS(`document.querySelector('.sd-close').click()`);
  await sleep(250);
  await evalJS(`(() => { const b=[...document.querySelectorAll('.shop-tab')].find(x=>(x.textContent||'').includes('我的背包')); b && b.click(); })()`);
  await waitFor(`!!document.querySelector('.shop-bag')`, 5000, '背包');
  const useBoost = await evalJS(`(() => { const row=[...document.querySelectorAll('.bag-row')].find(x=>x.textContent.includes('经验增幅器')); const b=row && [...row.querySelectorAll('button')].find(x=>x.textContent.includes('使用')); if(!b) return false; b.click(); return true; })()`);
  ok(useBoost, '激活经验增幅');
  await sleep(300);
  ok((await rwOf()).buffs.expBoost && (await rwOf()).buffs.expBoost.uses === 1, '增幅次数写入存档');

  await goMap();
  await waitFor(`document.querySelectorAll('.node-group').length >= 2`, 12000, '地图节点');
  await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 12000, '关卡列表');
  await evalJS(`document.querySelectorAll('.lv-row')[0].querySelector('button').click()`);
  await waitFor(`!!document.querySelector('.monaco-editor')`, 20000, '挑战页');
  await evalJS(`(() => { const m=window.monaco.editor.getModels()[0]; m.setValue('log_title = "服务器状态报告"\\n\\nif log_title != "":\\n    print(log_title)'); return true; })()`);
  await sleep(600);
  await evalJS(clickText('.chlg-page .toolbar', '提交修复'));
  await waitFor(`document.body.textContent.includes('修复成功')`, 20000, '通关面板');
  const panel = await evalJS(`document.querySelector('.cp-summary').parentElement.textContent`);
  ok(/经验增幅 ×1\.5/.test(panel), '结算面板显示增幅倍率', panel.slice(0, 200));
  ok(/\+90/.test(panel) || /经验 90/.test(panel), '经验按 60×1.5=90 发放', panel.slice(0, 220));
  const afterBoost = await evalJS(`${readSave}`);
  ok(afterBoost.player.exp === 90, '存档经验为 90', String(afterBoost.player.exp));
  ok(!afterBoost.player.rewards.buffs.expBoost, '增幅使用后消耗', JSON.stringify(afterBoost.player.rewards.buffs));
  await shot('shop-challenge-boost');

  console.log('=== I. 手机端商城 ===');
  await seedAndOpen(seedSave({ credits: 800 }));
  await setViewport(390, 844);
  await openShop();
  const m = await evalJS(`(() => {
    const cards=[...document.querySelectorAll('.shop-card')].slice(0,4).map(c=>Math.round(c.getBoundingClientRect().left));
    return { sw: document.documentElement.scrollWidth, vw: innerWidth, lefts: cards };
  })()`);
  ok(m.sw <= m.vw + 1, '手机端商城无横向溢出');
  ok(new Set(m.lefts).size >= 2, '手机端商品双列布局');
  await openCard('护盾核心');
  const sheet = await evalJS(`(() => { const d=document.querySelector('.shop-drawer'); const r=d.getBoundingClientRect(); return { w: Math.round(r.width), bottom: Math.round(r.bottom), vh: innerHeight }; })()`);
  ok(sheet.w >= 380, '手机端详情以整宽底部面板展示', JSON.stringify(sheet));
  await shot('shop-mobile-sheet');
  await buyFromDetail(false);
  ok((await credits()) === 740, '手机端可完成真实购买');
  await shot('shop-mobile');
  await evalJS(`document.querySelector('.sd-close') && document.querySelector('.sd-close').click()`);
  await sleep(200);
  await shot('shop-mobile-list');

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  finish(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('A5 E2E 失败:', e && e.message ? e.message : e);
  finish(1);
});

function finish(code) {
  try { server.close(); } catch { /* ignore */ }
  try { if (cdp) cdp.ws.close(); } catch { /* ignore */ }
  try { if (chrome && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* ignore */ }
  setTimeout(() => process.exit(code), 400);
}
