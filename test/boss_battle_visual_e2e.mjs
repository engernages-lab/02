// V1.3-B.6.1 视觉基础系统真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-1-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 4900 + Math.floor(Math.random() * 80);
const DEV_PORT = 6200 + Math.floor(Math.random() * 80);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave() {
  const player = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: { 'bossIntro_gate-01': true },
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {}, bossBattleStats: { active: null, history: [] }, bossBattleRatings: { history: [] }, bossBattleRewards: { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } }, bossAchievements: { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] }, bossBattleArchive: { version: 1, records: [], archivedBattleIds: [], totals: { totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0, totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0, ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 }, bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null, currentWinStreak: 0, bestWinStreak: 0, updatedAt: null }, bossTotals: {}, difficultyTotals: {}, updatedAt: null },
      currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}
async function waitServer(url, timeout = 60000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { try { if ((await fetch(url)).ok) return; } catch { /* retry */ } await sleep(300); } throw new Error('server timeout'); }
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(150); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button') { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout: 15000 }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 20; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function enterBoss(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const skip = page.locator('button', { hasText: '跳过初始化' }).first();
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, 'Python 知识库', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await clickThroughDialog(page);
  await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000); await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(220); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(220); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const cont = page.locator('button', { hasText: '继续挑战' }).first();
  if (await cont.isVisible().catch(() => false)) await cont.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.b6-visual-root').waitFor({ state: 'visible', timeout: 10000 });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
function staticServer(rootDir, port) { const server = createServer((req, res) => { try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = normalize(join(rootDir, p)); if (!existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); } catch { res.writeHead(500); res.end(); } }); return new Promise(r => server.listen(port, '127.0.0.1', () => r(server))); }

(async () => {
  const distRoot = join(root, 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist');
  const server = await staticServer(distRoot, DIST_PORT);
  let browser = null; let dev = null;
  try {
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const mkCtx = async (seed) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, seed);
      return ctx;
    };
    console.log('=== 1. 生产视觉层 ===');
    const ctxProd = await mkCtx(makeSave());
    const prodPage = await ctxProd.newPage();
    await prodPage.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(prodPage);
    ok(await prodPage.locator('.b6-visual-root').isVisible(), '生产 Boss 战显示视觉层');
    ok(await prodPage.locator('.b6-ambient-grid').isVisible(), '背景环境层存在');
    ok(await prodPage.locator('.b6-scanlines').count() >= 1, '扫描线存在');
    ok(await prodPage.locator('.b6-particles').count() === 1, 'Canvas 粒子层存在');
    ok(await prodPage.locator('.dev-visual-panel').count() === 0, '生产环境隐藏视觉 DEV 面板');
    const clickable = await prodPage.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('提交攻击')); if (!b) return false; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!el && (el === b || b.contains(el)); });
    ok(clickable, '视觉层不遮挡提交按钮');
    await prodPage.screenshot({ path: join(evidence, '01-production-visual.png'), fullPage: false });
    await ctxProd.close();

    console.log('=== 2. DEV 视觉层 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const ctx = await mkCtx(makeSave());
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    const devPanel = page.locator('.dev-visual-panel');
    await devPanel.waitFor({ state: 'visible', timeout: 10000 });
    ok(true, 'DEV 环境显示视觉测试面板');
    ok((await devPanel.innerText()).includes('Particles'), 'DEV 面板显示粒子统计');
    await sleep(1600);
    const perfText = await devPanel.innerText();
    const fpsMatch = perfText.match(/(\d+) FPS/);
    console.log('  [perf] ' + (fpsMatch ? fpsMatch[1] + ' FPS' : 'FPS not reported'));
    ok(!!fpsMatch && Number(fpsMatch[1]) > 0, 'DEV 面板报告真实 FPS');
    await page.screenshot({ path: join(evidence, '02-initial.png'), fullPage: false });
    ok((await page.locator('.b6-visual-root').getAttribute('data-theme')) === 'digital-corruption', 'GATE-01 视觉主题');
    ok((await page.locator('.b6-visual-root').getAttribute('data-intensity')) === 'MEDIUM', '默认 MEDIUM 强度');

    await devPanel.locator('button', { hasText: 'HIGH' }).click();
    await sleep(250);
    ok((await page.locator('.b6-visual-root').getAttribute('data-intensity')) === 'HIGH', '切换 HIGH 强度');
    ok(await page.locator('.b6-particles').isVisible(), '粒子层可见');
    await page.screenshot({ path: join(evidence, '03-particles.png'), fullPage: false });
    await devPanel.locator('button').filter({ hasText: /^LOW$/ }).click();
    await sleep(200);
    ok((await page.locator('.b6-visual-root').getAttribute('data-intensity')) === 'LOW', '切换 LOW 强度');
    await page.screenshot({ path: join(evidence, '04-low.png'), fullPage: false });

    await devPanel.locator('button', { hasText: 'HIGH' }).click();
    await devPanel.locator('button', { hasText: 'Scanline' }).click();
    await sleep(150);
    ok(await page.locator('.b6-effect.b6-scanline').count() >= 1, 'Scanline 效果触发');
    await page.screenshot({ path: join(evidence, '05-scanline.png'), fullPage: false });

    await devPanel.locator('button', { hasText: 'Phase Priority' }).click();
    await sleep(80);
    await devPanel.locator('button', { hasText: 'Queue Warning' }).click();
    await sleep(200);
    const priorityText = await devPanel.innerText();
    ok(priorityText.includes('Queued'), '视觉优先级冲突产生队列');
    await devPanel.locator('button', { hasText: 'Interrupt' }).last().click();
    await sleep(200);
    ok((await page.locator('.b6-effect.b6-pulse').count()) === 0, '中断后脉冲清理');
    await page.screenshot({ path: join(evidence, '06-interrupt.png'), fullPage: false });

    await devPanel.locator('button', { hasText: 'Screen Shake' }).click();
    await sleep(100);
    await devPanel.locator('button', { hasText: 'Digital Glitch' }).click();
    await sleep(100);
    await page.screenshot({ path: join(evidence, '07-effects.png'), fullPage: false });
    await devPanel.locator('button', { hasText: 'Cleanup All' }).click();
    await sleep(250);
    ok((await page.locator('.b6-effect').count()) === 0, 'Cleanup All 清空活动效果');
    await page.screenshot({ path: join(evidence, '08-cleanup.png'), fullPage: false });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    await sleep(500);
    ok(await page.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 模式');
    ok((await page.locator('.dev-visual-panel').innerText()).includes('Reduced：YES'), 'DEV 面板识别 Reduced Motion');
    await page.screenshot({ path: join(evidence, '09-reduced.png'), fullPage: false });

    await page.setViewportSize({ width: 390, height: 844 });
    await sleep(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
    ok(overflow, '移动端无横向溢出');
    ok(await page.locator('.b6-visual-root').isVisible(), '移动端视觉层可见');
    await page.screenshot({ path: join(evidence, '10-mobile.png'), fullPage: false });

    await devPanel.waitFor({ state: 'visible', timeout: 10000 });
    await page.screenshot({ path: join(evidence, '11-dev-panel.png'), fullPage: true });
    ok(errors.length === 0, '视觉流程无未捕获异常', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => server.close(r));
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e?.message || e); process.exit(1); });
