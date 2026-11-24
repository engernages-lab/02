// V1.3-F.4 竞赛截图（核心页面）：真实生产构建 + Demo Save
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shots = join(root, 'docs', 'competition', 'screenshots');
mkdirSync(shots, { recursive: true });
const demo = JSON.parse(readFileSync(join(root, 'docs', 'competition', 'demo-save.json'), 'utf8'));
const PORT = 8900 + Math.floor(Math.random() * 50);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
function freshSave() {
  const s = JSON.parse(JSON.stringify(demo));
  const p = s.player;
  p.level = 1; p.exp = 70; p.consciousness = 100;
  p.progress.completedLevels = []; p.progress.stars = {}; p.progress.achievements = []; p.progress.knowledge = [];
  p.progress.currentLevelId = null; p.progress.unlockedServers = ['training']; p.progress.failedAttempts = {};
  p.progress.flags = { prologueDone: true, tutorialCinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true };
  p.progress.exploration = { version: 1, events: {}, ruins: {}, hidden: {}, rewardsClaimed: [], discoveredRegions: [], pendingChallenge: null, archive: [], updatedAt: 1 };
  p.rewards = { ...p.rewards, credits: 0, trust: 10, cleared: {}, ledger: [], chapterRewards: [] };
  p.mira = { level: 1, exp: 0, stage: 'initial', eventLog: [], memories: {}, lastScene: {}, updatedAt: 1 };
  return JSON.stringify(s);
}
function riskSave() { const s = JSON.parse(JSON.stringify(demo)); s.player.consciousness = 30; return JSON.stringify(s); }
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(120); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 35; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(100); } }
async function enterMenu(page) { await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click(); await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page); }
async function backMenu(page) { const b = page.locator('button', { hasText: '◀ 返回' }).first(); if (await b.isVisible().catch(() => false)) await b.click().catch(() => {}); else { const m = page.locator('button', { hasText: '主菜单' }).first(); if (await m.isVisible().catch(() => false)) await m.click().catch(() => {}); } await waitText(page, '继续探索', 15000); await sleep(250); }
async function setEditorCode(page, code) { const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false); if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); } await sleep(160); }
async function newPage(browser, seed) { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, seed); return { ctx, page: await ctx.newPage() }; }

(async () => {
  let server = null; let browser = null;
  try {
    server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 30000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(200); }
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });

    console.log('=== Demo Save / Start / Main / World ===');
    let { ctx, page } = await newPage(browser, JSON.stringify(demo));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, 'ENTER NEXUS', 60000);
    await page.screenshot({ path: join(shots, '01-Start-Screen.png'), fullPage: false });
    await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);
    await page.screenshot({ path: join(shots, '02-Main-Menu.png'), fullPage: false });
    await clickButton(page, '继续探索'); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000); await clickThroughDialog(page);
    await page.screenshot({ path: join(shots, '03-World-Map.png'), fullPage: false });
    await backMenu(page);

    console.log('=== Explore / Hidden / Profile / Achievements ===');
    await page.locator('.rail-item', { hasText: '数字世界探索' }).click();
    await page.locator('.explore-page').waitFor({ state: 'visible', timeout: 20000 }); await sleep(400);
    await page.screenshot({ path: join(shots, '12-Explore.png'), fullPage: false });
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(400);
    await page.screenshot({ path: join(shots, '13-Hidden-Signal.png'), fullPage: false });
    await backMenu(page);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 20000 }); await sleep(350);
    await page.screenshot({ path: join(shots, '14-Profile.png'), fullPage: false });
    await backMenu(page);
    await page.locator('.rail-item', { hasText: '成就系统' }).click();
    await page.locator('.ach-card').first().waitFor({ state: 'visible', timeout: 20000 }); await sleep(350);
    await page.screenshot({ path: join(shots, '15-Achievements.png'), fullPage: false });
    await backMenu(page);
    await page.locator('.rail-item', { hasText: 'MIRA 核心' }).click();
    await page.locator('.mira-page').waitFor({ state: 'visible', timeout: 20000 }); await sleep(350);
    await page.screenshot({ path: join(shots, '07-MIRA.png'), fullPage: false });
    await backMenu(page);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 20000 });
    await page.setViewportSize({ width: 390, height: 844 }); await sleep(400);
    await page.screenshot({ path: join(shots, '17-Mobile.png'), fullPage: false });
    await ctx.close();

    console.log('=== Challenge / Success / Settlement ===');
    ({ ctx, page } = await newPage(browser, freshSave()));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await clickButton(page, '继续探索'); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000); await clickThroughDialog(page);
    await page.locator('.node-group').first().dispatchEvent('click'); await sleep(500); await clickThroughDialog(page);
    await page.locator('.lv-row').first().locator('button').first().click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 }); await clickThroughDialog(page); await sleep(300);
    await page.screenshot({ path: join(shots, '04-Challenge.png'), fullPage: false });
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复'); await waitText(page, '修复成功', 30000); await sleep(1000);
    await page.screenshot({ path: join(shots, '05-Code-Repair-Success.png'), fullPage: false });
    await page.locator('.ov-result').screenshot({ path: join(shots, '06-Settlement.png') }).catch(async () => {
      await page.screenshot({ path: join(shots, '06-Settlement.png'), fullPage: false });
    });
    await ctx.close();

    console.log('=== Risk ===');
    ({ ctx, page } = await newPage(browser, riskSave()));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 20000 }); await sleep(400);
    await page.screenshot({ path: join(shots, '16-Risk-System.png'), fullPage: false });
    await ctx.close();
    ok(true, '核心截图生成完成');
    console.log('Core screenshots: OK');
  } catch (e) {
    console.log('F.4 screenshot ERROR: ' + e.message);
    total++; console.log('FAIL | 截图流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
