// V1.3-F.4 竞赛截图（Boss）：真实生产构建 + Demo Save，无 DEV 面板
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shots = join(root, 'docs', 'competition', 'screenshots');
mkdirSync(shots, { recursive: true });
const demo = readFileSync(join(root, 'docs', 'competition', 'demo-save.json'), 'utf8');
const PORT = 9000 + Math.floor(Math.random() * 50);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(120); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 35; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(100); } }
async function setEditorCode(page, code, last = false) { const okM = await page.evaluate(({ c, useLast }) => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[useLast ? models.length - 1 : 0].setValue(c); return true; }, { c: code, useLast: last }).catch(() => false); if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); } await sleep(160); }
async function waitWarning(page, timeout = 45000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await page.locator('.attack-warning').first().isVisible().catch(() => false)) return; await sleep(160); } throw new Error('warning timeout'); }
async function remainingSeconds(page) { const t = await page.locator('.attack-warning .aw-time').first().innerText().catch(() => ''); const m = t.match(/([\d.]+)s/); return m ? Number(m[1]) : null; }
async function waitUntilRemaining(page, threshold, timeout = 8000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (!(await page.locator('.attack-warning').first().isVisible().catch(() => false))) return false; const rem = await remainingSeconds(page); if (rem != null && rem <= threshold) return true; await sleep(40); } return false; }
async function warningGone(page) { await page.locator('.attack-warning').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}); }
async function clueCount(page) { return page.locator('.weakness-clue:not(.locked)').count(); }
const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
const P2 = 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"';
const P3 = 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))';
const P4 = 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))';
const CRACK1 = 'def bypass(level, backup):\n    if level >= 50 and backup:\n        return True\n    return False';

(async () => {
  let server = null; let browser = null;
  try {
    server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 30000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(200); }
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, demo);
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
    await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);
    await clickButton(page, '继续探索'); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000); await clickThroughDialog(page);
    await page.locator('.node-group').nth(1).click({ force: true }); await sleep(250); await clickThroughDialog(page);
    await clickButton(page, '挑战 ▸'); await sleep(300); await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
    await page.screenshot({ path: join(shots, '08-Boss-Entrance.png'), fullPage: false });
    await clickThroughDialog(page);
    const c = page.locator('button', { hasText: '继续挑战' }).first(); if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(page, '开始挑战');
    await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 }); await sleep(1000);
    await page.screenshot({ path: join(shots, '09-Boss-Arena.png'), fullPage: false });

    // 真实防御/弱点流程，确保阶段伤害
    await waitWarning(page);
    await waitUntilRemaining(page, 0.7);
    await clickButton(page, '防御', '.boss-attack-panel button').catch(() => {});
    await warningGone(page);
    let clues = await clueCount(page);
    for (let i = 0; i < 4 && clues < 2; i++) {
      await waitWarning(page);
      if (await waitUntilRemaining(page, 0.5)) await clickButton(page, '防御', '.boss-attack-panel button').catch(() => {});
      await warningGone(page);
      clues = await clueCount(page);
    }
    await clickButton(page, '分析弱点', '.boss-weakness-panel button');
    await page.locator('.b6-weak-cine').waitFor({ state: 'visible', timeout: 8000 });
    await waitText(page, '弱点已发现', 12000);
    await clickButton(page, '开始弱点破解', '.boss-weakness-panel button');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'visible', timeout: 15000 });
    await setEditorCode(page, CRACK1, true);
    await clickButton(page, '提交破解');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'hidden', timeout: 60000 });
    await page.locator('.weakness-exposure-banner').waitFor({ state: 'visible', timeout: 15000 });
    await setEditorCode(page, P1, false);
    await clickButton(page, '提交攻击');
    await page.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 60000 });
    await page.screenshot({ path: join(shots, '10-Boss-Phase-Transition.png'), fullPage: false });
    await waitText(page, '战斗阶段 2 / 3', 30000); await sleep(1500);
    await setEditorCode(page, P2, false); await clickButton(page, '提交攻击'); await waitText(page, '战斗阶段 3 / 3', 60000); await sleep(1200);
    await setEditorCode(page, P3, false); await clickButton(page, '提交攻击'); await waitText(page, '阶段 4 / 4', 30000); await sleep(1200);
    await setEditorCode(page, P4, false); await clickButton(page, '提交攻击');
    await page.locator('.b6-terminal-portal').waitFor({ state: 'visible', timeout: 60000 });
    const frag = page.locator('.frag-gain').first(); if (await frag.isVisible().catch(() => false)) await frag.click({ force: true }).catch(() => {});
    await page.locator('.settlement-overlay').waitFor({ state: 'visible', timeout: 15000 });
    await sleep(1600);
    await page.screenshot({ path: join(shots, '11-Boss-Victory.png'), fullPage: false });
    ok(await page.locator('.settlement-overlay.settlement-victory').count() >= 1, 'Boss victory screenshot');
    ok(errors.length === 0, 'Boss screenshot flow no errors', errors.slice(0, 3).join(' | '));
    await ctx.close();
    console.log('Boss screenshots: OK');
  } catch (e) {
    console.log('F.4 boss screenshot ERROR: ' + e.message);
    total++; console.log('FAIL | Boss 截图中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
