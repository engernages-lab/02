// V1.3-A.2 真实浏览器验收（Playwright 驱动系统 Chrome Headless，可截图）
// 挑战流程在单一持久 context 中验证奖励/刷新；未知入侵每种恢复使用独立 fresh context（隔离冷却，避免 beforeunload 覆盖）。
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const SHOT = join(root, '.tmp', 'a2-evidence');
const PORT = 4186;
const BASE = 'http://127.0.0.1:' + PORT;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

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

const results = [];
const ok = (name, cond, detail = '') => { results.push({ name, ok: !!cond, detail }); console.log((cond ? 'PASS | ' : 'FAIL | ') + name + (cond ? '' : ('  => ' + detail))); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
try { mkdirSync(SHOT, { recursive: true }); } catch { /* ignore */ }

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function permFor(id, n) { let seed = hashStr(id) || 1; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

(async () => {
  server.listen(PORT, '127.0.0.1'); await sleep(300);
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });

  const pageErrors = [];
  const notFound = new Set();
  const attach = (p) => {
    p.on('pageerror', e => pageErrors.push('PAGEERROR: ' + e.message));
    p.on('response', r => { if (r.status() === 404) { try { notFound.add(new URL(r.url()).pathname); } catch { /* ignore */ } } });
  };

  // ---- page 参数化 helpers ----
  const bodyText = (p) => p.evaluate(() => document.body.innerText);
  const visible = (p, t) => p.getByText(t, { exact: false }).first().isVisible().catch(() => false);
  const waitVisible = (p, t, timeout = 15000) => p.getByText(t, { exact: false }).first().waitFor({ state: 'visible', timeout });
  const hiddenWithin = async (p, t, timeout = 8000) => { try { await p.getByText(t, { exact: false }).first().waitFor({ state: 'hidden', timeout }); return true; } catch { return false; } };
  const getSave = async (p) => { const raw = await p.evaluate(() => localStorage.getItem('nexus_code_repair_save_v1')); return raw ? JSON.parse(raw) : null; };
  const setCode = async (p, code) => {
    const done = await p.evaluate((c) => { const ms = window.monaco && window.monaco.editor && window.monaco.editor.getModels(); const m = ms && (ms[0] || ms[ms.length - 1]); if (m) { m.setValue(c); return true; } return false; }, code);
    if (!done) throw new Error('monaco 未就绪'); await sleep(200);
  };
  async function bootMenu(p) {
    await p.goto(BASE + '/?dev=1', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('.boot-wrap', { timeout: 25000 });
    // 用 DOM 直接点击，绕过启动动画装饰层对指针的拦截（真实浏览器仍会派发 click）
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').includes('跳过初始化')); if (b) b.click(); });
    await p.waitForFunction(() => [...document.querySelectorAll('button')].some(x => (x.textContent || '').includes('ENTER NEXUS')), { timeout: 20000 });
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').includes('ENTER NEXUS')); if (b) b.click(); });
    await waitVisible(p, 'Python 知识库');
  }
  const domClickByText = (p, sel, text) => p.evaluate(([s, t]) => { const b = [...document.querySelectorAll(s)].find(x => (x.textContent || '').includes(t)); if (b) { b.click(); return true; } return false; }, [sel, text]);
  async function ensureHub(p) {
    if (await visible(p, '独立挑战 · CHALLENGE SIM')) return;
    if (!(await p.locator('.rail-item:has-text("独立挑战")').count())) await bootMenu(p);
    await domClickByText(p, '.rail-item', '独立挑战');
    await waitVisible(p, '独立挑战 · CHALLENGE SIM');
  }
  async function enterChallenge(p, title) {
    const card = p.locator('.panel').filter({ hasText: title }).first();
    await card.locator('button').first().click();
    await p.waitForSelector('.monaco-editor', { timeout: 30000 });
    await p.locator('button:has-text("提交判题")').first().waitFor({ timeout: 15000 });
  }
  async function backHub(p) { const b = p.locator('button:has-text("挑战列表")'); if (await b.count()) await b.first().click(); await waitVisible(p, '独立挑战 · CHALLENGE SIM'); }
  async function waitEv(p, pred, timeout = 8000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await getSave(p); const ev = s && s.player.progress.dynamicEvent; if (pred(ev)) return ev; await sleep(150); } return null; }
  async function triggerIntr(p) { await p.locator('button:has-text("触发未知入侵")').first().click(); await waitVisible(p, 'UNKNOWN INTRUSION', 8000); }
  async function freshHubPage(w = 1280, h = 800) { const c = await browser.newContext({ viewport: { width: w, height: h } }); const p = await c.newPage(); attach(p); await bootMenu(p); await ensureHub(p); return { c, p }; }

  try {
    // ======================= 挑战流程（持久 context） =======================
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); attach(page);
    const shot = async (n) => { try { await page.screenshot({ path: join(SHOT, n + '.png') }); } catch { /* ignore */ } };

    await bootMenu(page); ok('A2-启动与主菜单', true); await shot('01-menu');
    await ensureHub(page); await shot('02-hub-pc');
    const hubText = await bodyText(page);
    ok('A2-大厅-数据真实(5 项)', ['应急链路重启（限时）', '继电器连锁修复', '均值函数的隐藏边界', '受限资源求和', '指令解析三阶段'].every(t => hubText.includes(t)));
    ok('A2-大厅-类型与系数', hubText.includes('限时修复') && hubText.includes('奖励系数'));
    const ovPC = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok('A2-大厅-PC 无横向溢出', ovPC <= 1, 'overflow=' + ovPC);

    const before = await getSave(page);
    await enterChallenge(page, '应急链路重启（限时）'); await shot('03-play-timed');
    const playText = await bodyText(page);
    ok('A2-挑战页-真实配置', playText.includes('应急链路重启（限时）') && playText.includes('运行剩余') && playText.includes('挑战终端'));
    await setCode(page, 'print("LINK OK")\n');
    await page.locator('button:has-text("运行代码")').first().click();
    await page.getByText('运行成功（诊断）', { exact: false }).or(page.getByText('进程正常退出', { exact: false })).first().waitFor({ timeout: 30000 }).catch(() => {});
    ok('A2-运行-次数扣除', ((await getSave(page)).player.progress.challengeRuns['ind-timed']?.runsUsed || 0) >= 1);
    await page.locator('button:has-text("提交判题")').first().click();
    await waitVisible(page, '挑战完成', 40000); await shot('04-pass');
    const ap = await getSave(page);
    const runT = ap.player.progress.challengeRuns['ind-timed']; const sessT = ap.player.progress.challengeSessions['ind-timed'];
    ok('A2-结算-运行 completed / 会话 passed', runT && runT.status === 'completed' && sessT && sessT.status === 'passed', JSON.stringify({ run: runT && runT.status, sess: sessT && sessT.status }));
    ok('A2-结算-经验增加', ap.player.exp > (before ? before.player.exp : 0), 'exp ' + (before?.player.exp) + '->' + ap.player.exp);
    ok('A2-结算-贡献点增加', ap.player.rewards.credits > (before ? before.player.rewards.credits : 0));
    ok('A2-结算-账本 challenge 记录', (ap.player.rewards.ledger || []).some(e => e.kind === 'challenge' && e.ref === 'ind-timed'));
    ok('A2-幂等-完成后提交禁用', await page.locator('button:has-text("提交判题")').first().isDisabled().catch(() => false));
    const expA = ap.player.exp; await sleep(400); const aA = await getSave(page);
    ok('A2-幂等-未重复发奖', aA.player.exp === expA && aA.player.rewards.credits === ap.player.rewards.credits);

    await backHub(page); await enterChallenge(page, '受限资源求和');
    await setCode(page, 'print(1)\n'); await page.locator('button:has-text("运行代码")').first().click(); await sleep(1800);
    const runsBefore = (await getSave(page)).player.progress.challengeRuns['ind-resource']?.runsUsed || 0;
    ok('A2-刷新前-已消耗运行', runsBefore >= 1, 'runs=' + runsBefore);
    await page.reload({ waitUntil: 'domcontentloaded' }); await bootMenu(page); await ensureHub(page);
    await enterChallenge(page, '受限资源求和');
    const ar = await getSave(page);
    ok('A2-刷新-运行次数持久恢复', (ar.player.progress.challengeRuns['ind-resource']?.runsUsed || 0) >= runsBefore);
    ok('A2-刷新-版本仍 v10', ar.version === 10);
    const ab = page.locator('button:has-text("放弃并返回")'); if (await ab.count()) await ab.first().click();
    await waitVisible(page, '独立挑战 · CHALLENGE SIM');
    ok('A2-退出-运行终结', ((await getSave(page)).player.progress.challengeRuns['ind-resource']?.status || '') !== 'active');
    await enterChallenge(page, '受限资源求和');
    const rr = (await getSave(page)).player.progress.challengeRuns['ind-resource'];
    ok('A2-重进-新运行 active 且计数归零', rr && rr.status === 'active' && (rr.runsUsed || 0) === 0);

    // ======================= 未知入侵（每场景 fresh context） =======================
    // ① 正常完成 + ⑥ 冷却（同一 fresh context：完成后再次触发应冷却）
    {
      const { c, p } = await freshHubPage();
      await triggerIntr(p); await p.screenshot({ path: join(SHOT, '05-intrusion.png') }).catch(() => {});
      ok('A2-入侵-①触发显示覆盖层', await visible(p, 'UNKNOWN INTRUSION'));
      const ev = await waitEv(p, e => e && e.status === 'active', 8000);
      ok('A2-入侵-presenting→active', !!ev);
      if (ev) {
        // ⑥ 进行中重复触发（覆盖层内 DEV 按钮）
        await p.locator('button:has-text("DEV 重复触发")').first().click();
        await sleep(250);
        ok('A2-恢复⑥进行中重复触发被拒绝', (await bodyText(p)).includes('重复触发被拒绝'));
        const seq = permFor(ev.id, 3); const nodes = p.locator('button:has-text("NODE-")'); for (let s = 0; s < 3; s++) { await nodes.nth(seq[s]).click(); await sleep(260); }
      }
      ok('A2-恢复①正常完成-覆盖层关闭', await hiddenWithin(p, 'UNKNOWN INTRUSION', 8000));
      ok('A2-恢复①正常完成-事件已清理', !(await getSave(p)).player.progress.dynamicEvent);
      await p.screenshot({ path: join(SHOT, '06-intrusion-done.png') }).catch(() => {});
      // ⑥ 冷却：事件结束后立刻再次触发（<60s）应被拒
      await p.locator('button:has-text("触发未知入侵")').first().click().catch(() => {});
      await sleep(300);
      const txt = await bodyText(p);
      ok('A2-恢复⑥冷却内再次触发被拒绝', txt.includes('冷却中'));
      await c.close();
    }
    // ② 玩家退出
    {
      const { c, p } = await freshHubPage(); await triggerIntr(p);
      await waitEv(p, e => e && e.status === 'active', 8000);
      await p.locator('button:has-text("退出隔离")').first().click();
      ok('A2-恢复②玩家退出-关闭', await hiddenWithin(p, 'UNKNOWN INTRUSION', 8000));
      ok('A2-恢复②-无残留事件', !(await getSave(p)).player.progress.dynamicEvent);
      await c.close();
    }
    // ⑤ 异常恢复
    {
      const { c, p } = await freshHubPage(); await triggerIntr(p);
      await waitEv(p, e => e && e.status === 'active', 8000);
      await p.locator('button:has-text("DEV 模拟异常")').first().click();
      ok('A2-恢复⑤异常恢复-关闭', await hiddenWithin(p, 'UNKNOWN INTRUSION', 8000));
      ok('A2-恢复⑤-游戏仍可操作(返回主菜单按钮在)', await visible(p, '独立挑战 · CHALLENGE SIM'));
      await c.close();
    }
    // ④ 刷新恢复（同 context reload）
    {
      const { c, p } = await freshHubPage(); await triggerIntr(p);
      await waitEv(p, e => e && e.status === 'active', 8000);
      await p.reload({ waitUntil: 'domcontentloaded' }); await bootMenu(p);
      const s4 = await getSave(p);
      ok('A2-恢复④刷新-存档未损坏', !!s4 && s4.version === 10 && !!s4.player.progress);
      await ensureHub(p);
      const resumed = await visible(p, 'UNKNOWN INTRUSION');
      if (resumed) { await waitEv(p, e => e && e.status === 'active', 8000); const q = p.locator('button:has-text("退出隔离")'); if (await q.count()) await q.first().click(); await hiddenWithin(p, 'UNKNOWN INTRUSION', 8000); }
      const s4b = await getSave(p);
      ok('A2-恢复④刷新-无永久覆盖层', !s4b.player.progress.dynamicEvent || s4b.player.progress.dynamicEvent.status === 'active');
      ok('A2-恢复④刷新-仍可正常进入游戏', await visible(p, '独立挑战 · CHALLENGE SIM'));
      await c.close();
    }
    // ③ 超时（真实等待完整时间）
    {
      const { c, p } = await freshHubPage(); await triggerIntr(p);
      ok('A2-恢复③超时-进入 active', !!(await waitEv(p, e => e && e.status === 'active', 8000)));
      const t0 = Date.now();
      const closed = await hiddenWithin(p, 'UNKNOWN INTRUSION', 55000);
      ok('A2-恢复③超时-真实等待后自动关闭(' + Math.round((Date.now() - t0) / 1000) + 's)', closed);
      await c.close();
    }

    // ======================= 移动端（浏览器模拟） =======================
    {
      const { c, p } = await freshHubPage(375, 820);
      for (const w of [375, 390, 430]) {
        await p.setViewportSize({ width: w, height: 820 });
        await ensureHub(p);
        const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        ok('A2-移动端-' + w + 'px 无横向溢出(模拟)', ov <= 1, 'overflow=' + ov);
        await p.screenshot({ path: join(SHOT, '07-hub-' + w + '.png') }).catch(() => {});
      }
      await p.setViewportSize({ width: 430, height: 820 }); await ensureHub(p); await triggerIntr(p);
      const ovI = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok('A2-移动端-入侵覆盖层无横向溢出(模拟)', ovI <= 1, 'overflow=' + ovI);
      await p.screenshot({ path: join(SHOT, '08-intrusion-430.png') }).catch(() => {});
      await c.close();
    }

    // ======================= 回归抽查：奖励兑换中心 =======================
    {
      const { c, p } = await freshHubPage();
      const rail = p.locator('.rail-item:has-text("奖励兑换中心")');
      if (!(await rail.count())) { await bootMenu(p); }
      let shopOk = false;
      try { await domClickByText(p, '.rail-item', '奖励兑换中心'); await waitVisible(p, '贡献点', 12000); shopOk = true; } catch { shopOk = false; }
      ok('A2-回归抽查-奖励兑换中心渲染', shopOk);
      await p.screenshot({ path: join(SHOT, '09-shop.png') }).catch(() => {});
      await c.close();
    }

    // 数据安全（回到主 context 读取最终存档）
    const finalSave = await getSave(page);
    ok('A2-存档-版本仍 v10', finalSave.version === 10);
    ok('A2-存档-新字段存在', !!finalSave.player.progress.challengeRuns && 'dynamicEvent' in finalSave.player.progress && 'eventCooldowns' in finalSave.player.progress);
    ok('A2-存档-普通关卡进度未污染', Array.isArray(finalSave.player.progress.completedLevels) && finalSave.player.progress.completedLevels.length === 0, JSON.stringify(finalSave.player.progress.completedLevels));
    ok('A2-存档-挑战奖励不重复(ind-timed 仅 1 条)', finalSave.player.rewards.ledger.filter(e => e.kind === 'challenge' && e.ref === 'ind-timed').length === 1);
    ok('A2-控制台无未捕获异常', pageErrors.filter(e => e.startsWith('PAGEERROR')).length === 0, pageErrors.slice(0, 3).join(' | '));
    await ctx.close();

  } catch (e) {
    ok('A2-执行异常', false, e && e.message);
  }

  await browser.close(); server.close();
  const pass = results.filter(r => r.ok).length;
  console.log('\n=== 真实浏览器验收结果 ===');
  console.log('通过 ' + pass + ' / ' + results.length);
  const fails = results.filter(r => !r.ok);
  if (fails.length) { console.log('失败项：'); fails.forEach(f => console.log(' - ' + f.name + ' :: ' + f.detail)); }
  console.log('截图目录：' + SHOT);
  console.log('404 资源：' + (Array.from(notFound).join(', ') || '无'));
  console.log('pageerror：' + (pageErrors.join(' | ') || '无'));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FATAL', (e && e.stack) || e); try { server.close(); } catch { /* ignore */ } process.exit(1); });
