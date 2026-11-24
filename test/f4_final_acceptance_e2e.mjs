// V1.3-F.4 最终功能验收：页面入口 / 新游戏 / Demo Save / Refresh
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const demo = readFileSync(join(root, 'docs', 'competition', 'demo-save.json'), 'utf8');
const demoChallenge = readFileSync(join(root, 'docs', 'competition', 'demo-challenge-save.json'), 'utf8');
const PORT = 9100 + Math.floor(Math.random() * 50);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(120); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(100); } }
async function enterMenu(page) { await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click(); await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page); }
async function returnMenu(page) {
  const candidates = ['◀ 返回', '主菜单', '◀ 主菜单'];
  for (const t of candidates) {
    const b = page.locator('button', { hasText: t }).first();
    if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); if (await waitText(page, '继续探索', 5000).then(() => true).catch(() => false)) return; }
  }
  await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
  await enterMenu(page);
}
async function openRail(page, label, marker) {
  await page.locator('.rail-item', { hasText: label }).click();
  await waitText(page, marker, 20000);
  await sleep(250);
  const body = await textOf(page);
  ok(body.includes(marker) && (await page.locator('.eb-root').count()) === 0, '入口可用：' + label);
}
async function newContext(browser, seed) { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, seed); return { ctx, page: await ctx.newPage() }; }

(async () => {
  let server = null; let browser = null;
  try {
    server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 30000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(200); }
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    let { ctx, page } = await newContext(browser, demo);
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, 'ENTER NEXUS', 60000);
    ok(true, '启动页正常');
    await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);
    ok((await page.locator('.rail-item').count()) >= 10, '主菜单完整');
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    ok(save.version === 10 && save.player.level === 5, 'Demo Save 正常加载');

    console.log('=== Page sweep ===');
    await clickButton(page, '继续探索'); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000); await clickThroughDialog(page);
    ok((await page.locator('.node-group').count()) >= 1, '入口可用：World Map');
    await returnMenu(page);
    const rails = [
      ['剧情档案', '剧情档案'], ['结局档案', '结局档案'], ['探索档案', '探索档案'],
      ['战斗档案馆', '战斗档案馆'], ['创世主记忆档案馆', '创世主记忆档案馆'],
      ['数字世界探索', '数字世界探索'], ['MIRA 核心', 'MIRA'], ['Python 知识库', 'Python 知识库'],
      ['独立挑战', '独立挑战'], ['奖励兑换中心', '兑换中心'], ['成就系统', '成就系统'],
      ['玩家档案', '玩家档案'], ['系统配置', '系统配置'], ['编程实验室', '编程实验室'],
    ];
    for (const [label, marker] of rails) {
      await openRail(page, label, marker);
      await returnMenu(page);
    }
    await page.reload({ waitUntil: 'commit', timeout: 60000 }); await enterMenu(page);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click(); await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    const refreshed = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    ok(refreshed.player.level === 5 && refreshed.player.mira.exp > 0 && refreshed.version === 10, 'Refresh 后 Demo 进度保持');
    ok(errors.length === 0, '页面巡检无未捕获异常', errors.slice(0, 3).join(' | '));
    await ctx.close();

    console.log('=== New game ===');
    ({ ctx, page } = await newContext(browser, demo));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 }); await enterMenu(page);
    await page.locator('.rail-item', { hasText: '新的开始' }).click();
    await waitText(page, '开始新的轮回', 10000);
    await clickButton(page, '确认，开启新轮回');
    await sleep(800);
    const fresh = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    ok(fresh.player.progress.completedLevels.length === 0 && fresh.player.level === 1, '新的开始重置真实存档');
    ok((await page.locator('.eb-root').count()) === 0, '新的开始无错误页');
    await ctx.close();

    console.log('=== Challenge Demo Save ===');
    ({ ctx, page } = await newContext(browser, demoChallenge));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 }); await enterMenu(page);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click(); await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    const challengeDemo = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    ok(challengeDemo.player.level === 1 && challengeDemo.player.exp === 70, 'Challenge Demo Save 可加载');
    await ctx.close();

    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.4 acceptance ERROR: ' + e.message);
    total++; console.log('FAIL | 流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
