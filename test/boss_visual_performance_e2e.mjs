// V1.3-B.6.7 视觉性能 / 无障碍 / 稳定性真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-7-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 5900 + Math.floor(Math.random() * 80);
const DEV_PORT = 7200 + Math.floor(Math.random() * 80);
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
      dynamicEvent: null, eventCooldowns: {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}
async function waitServer(url, timeout = 60000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { try { if ((await fetch(url)).ok) return; } catch { /* retry */ } await sleep(300); } throw new Error('server timeout'); }
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(150); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 25; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function enterBoss(page, expectDashboard = true) {
  await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, 'Python 知识库', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await clickThroughDialog(page); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000); await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(220); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(220); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const c = page.locator('button', { hasText: '继续挑战' }).first(); if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.b6-visual-root').waitFor({ state: 'visible', timeout: 10000 });
  if (expectDashboard) {
    await page.locator('.dev-perf-dashboard').waitFor({ state: 'visible', timeout: 15000 });
    await sleep(1300);
  }
}
async function shotDashboard(page, name) {
  await page.locator('.dev-perf-dashboard').evaluate(e => e.scrollIntoView({ block: 'start' })).catch(() => {});
  await sleep(80);
  await page.screenshot({ path: join(evidence, name), fullPage: false });
}
async function dashboard(page) {
  const el = page.locator('.dev-perf-dashboard'); await el.waitFor({ state: 'visible', timeout: 10000 });
  await el.evaluate(e => e.scrollIntoView({ block: 'start' })).catch(() => {});
  await sleep(80);
  const text = await el.innerText();
  const num = (re, fb = NaN) => { const m = text.match(re); return m ? Number(m[1]) : fb; };
  return {
    text,
    fps: num(/FPS：(\d+)/),
    frame: num(/Frame ([\d.]+)ms/),
    mode: (text.match(/Mode：(\w+)/) || [])[1] || '',
    active: num(/Active：(\d+) \/ 6/),
    queue: num(/Queue (\d+) \/ 8/),
    particles: num(/Particles：(\d+) \/ 96/),
    dpr: num(/Canvas DPR：([\d.]+)/),
    hidden: /Hidden：YES/.test(text),
    cost: (text.match(/Render Cost：(\w+)/) || [])[1] || '',
  };
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
function staticServer(rootDir, port) { const server = createServer((req, res) => { try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = normalize(join(rootDir, p)); if (!existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); } catch { res.writeHead(500); res.end(); } }); return new Promise(r => server.listen(port, '127.0.0.1', () => r(server))); }

(async () => {
  const distRoot = join(root, 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist，请先 npm run build');
  const server = await staticServer(distRoot, DIST_PORT);
  let browser = null; let dev = null;
  try {
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const mkCtx = async (seed, opts = {}) => { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts }); await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, seed); return ctx; };
    const errors = [];

    console.log('=== 1. 生产 DEV 隐藏 ===');
    const prodCtx = await mkCtx(makeSave()); const prodPage = await prodCtx.newPage();
    prodPage.on('pageerror', e => errors.push('PROD ' + String(e)));
    await prodPage.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(prodPage, false).catch(() => {});
    ok((await prodPage.locator('.dev-visual-panel').count()) === 0 && (await prodPage.locator('.dev-perf-dashboard').count()) === 0, '生产隐藏 DEV/性能面板');
    await prodPage.screenshot({ path: join(evidence, '19-production-hidden.png'), fullPage: false });
    await prodCtx.close();

    console.log('=== 2. Performance Dashboard / 模式 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const ctx = await mkCtx(makeSave()); const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('MAIN ' + String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    const vp = page.locator('.dev-visual-panel');
    let d = await dashboard(page);
    ok(d.fps >= 1 && d.fps <= 144, '真实 FPS 读数', String(d.fps));
    ok(d.frame > 0 && d.active <= 6 && d.queue <= 8, 'Frame/Active/Queue 读数');
    ok(d.mode === 'NORMAL', '初始 NORMAL', d.mode);
    await shotDashboard(page, '01-performance-dashboard.png');
    await vp.locator('button', { hasText: 'CINEMATIC' }).first().click();
    const setMode = async (mode) => {
      await page.locator('.dev-perf-dashboard select').selectOption(mode);
      if (mode !== 'AUTO') {
        await page.waitForFunction(m => document.querySelector('.b6-visual-root')?.getAttribute('data-performance-mode') === m, mode, { timeout: 5000 });
      }
      await sleep(200);
    };
    await setMode('NORMAL'); d = await dashboard(page);
    ok(d.particles === 64, 'NORMAL CINEMATIC 64 粒子', String(d.particles));
    await shotDashboard(page, '02-normal.png');
    await setMode('REDUCED'); d = await dashboard(page);
    ok(d.particles < 64 && d.dpr === 1.5, 'REDUCED 降粒子 / DPR 1.5');
    await shotDashboard(page, '03-reduced.png');
    await setMode('LOW'); d = await dashboard(page);
    ok(d.particles < 42 && d.dpr === 1, 'LOW 降粒子 / DPR 1');
    await shotDashboard(page, '04-low.png');
    await setMode('CRITICAL'); d = await dashboard(page);
    ok(d.particles === 0 && d.dpr === 1, 'CRITICAL 0 粒子 / DPR 1');
    const ambient = await page.evaluate(() => getComputedStyle(document.querySelector('.b6-ambient-grid')).display);
    ok(ambient === 'none', 'CRITICAL 关闭 Ambient');
    await shotDashboard(page, '05-critical.png');

    console.log('=== 3. Dynamic Degradation / Recovery ===');
    await setMode('NORMAL');
    await setMode('AUTO');
    await vp.locator('button', { hasText: 'Simulate 40 FPS' }).click(); await sleep(250);
    d = await dashboard(page);
    ok(d.mode === 'REDUCED' || d.mode === 'LOW', '40 FPS 自动降级', d.mode);
    await shotDashboard(page, '06-dynamic-degradation.png');
    await vp.locator('button', { hasText: 'Simulate 25 FPS' }).click(); await sleep(150);
    await vp.locator('button', { hasText: 'Simulate 25 FPS' }).click(); await sleep(250);
    d = await dashboard(page);
    ok(d.mode === 'CRITICAL', '25 FPS → CRITICAL', d.mode);
    for (let i = 0; i < 4; i++) { await vp.locator('button', { hasText: 'Performance Recovery' }).click(); await sleep(120); }
    d = await dashboard(page);
    ok(d.mode === 'NORMAL' || d.mode === 'REDUCED', '稳定恢复且不闪烁', d.mode);
    await shotDashboard(page, '07-performance-recovery.png');

    console.log('=== 4. Flash Safety / Stress ===');
    await setMode('CRITICAL');
    await vp.locator('button', { hasText: 'Flash Safety Audit' }).click(); await sleep(300);
    ok((await page.locator('.b6-visual-root.b6-shaking').count()) === 0, 'CRITICAL 无 Screen Shake');
    ok((await dashboard(page)).mode === 'CRITICAL', 'Flash Audit 保持 CRITICAL');
    await page.screenshot({ path: join(evidence, '09-flash-safety.png'), fullPage: false });
    await setMode('NORMAL');
    await vp.locator('button', { hasText: 'Performance Stress Test' }).click(); await sleep(300);
    d = await dashboard(page);
    ok(d.active <= 6 && d.queue <= 8 && d.particles <= 96, 'Stress 不突破 Hard Limit');
    await shotDashboard(page, '10-stress.png');
    await vp.locator('button', { hasText: 'Particle Overflow' }).click(); await sleep(250);
    d = await dashboard(page);
    ok(d.particles <= 96, 'Particle Overflow 不超 96');
    await shotDashboard(page, '11-particle-overflow.png');
    await vp.locator('button', { hasText: 'Queue Overflow' }).click(); await sleep(250);
    d = await dashboard(page);
    ok(d.queue <= 8, 'Queue Overflow 不超 8');
    await shotDashboard(page, '12-queue-overflow.png');
    await vp.locator('button', { hasText: 'Full Visual Stress' }).click();
    await page.locator('.b6-terminal-portal').waitFor({ state: 'visible', timeout: 6000 });
    d = await dashboard(page);
    ok(d.active <= 6 && d.queue <= 8, 'Full Stress 仍受硬限制');
    ok((await page.locator('.b6-crisis-portal').count()) === 0 && (await page.locator('.b6-attack-cine').count()) === 0, 'Terminal P0 清理低优先级');
    await page.screenshot({ path: join(evidence, '13-terminal-p0.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(250);

    console.log('=== 5. Visibility / Cleanup / Memory ===');
    await vp.locator('button', { hasText: 'Visibility Pause' }).click(); await sleep(200);
    ok((await dashboard(page)).hidden, 'Visibility Pause 生效');
    ok((await page.locator('.b6-visual-root.b6-hidden').count()) === 1, 'Hidden 视觉暂停类');
    await shotDashboard(page, '14-visibility-pause.png');
    await vp.locator('button', { hasText: 'Visibility Pause' }).click(); await sleep(200);
    ok(!(await dashboard(page)).hidden, 'Visibility 恢复');
    await vp.locator('button', { hasText: 'Memory Leak Stress' }).click(); await sleep(200);
    await vp.locator('button', { hasText: 'Resize Stress' }).click(); await sleep(200);
    d = await dashboard(page);
    ok(d.active === 0 && d.queue === 0, 'Leak/Resize Stress 后无残留');
    await vp.locator('button', { hasText: 'Canvas Cleanup' }).click(); await sleep(250);
    ok((await page.locator('.b6-terminal-portal').count()) === 0 && (await page.locator('.b6-crisis-cine').count()) === 0, 'Cleanup 清理 Portal');
    await page.screenshot({ path: join(evidence, '15-cleanup.png'), fullPage: false });

    console.log('=== 6. Settings Persistence / Mobile ===');
    await vp.locator('button', { hasText: 'CINEMATIC' }).first().click();
    await setMode('LOW');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    const persisted = await page.locator('.dev-perf-dashboard select').inputValue();
    ok(persisted === 'LOW', 'Performance Mode 刷新保持', persisted);
    ok((await dashboard(page)).mode === 'LOW', '刷新后 root 模式 LOW');
    await setMode('NORMAL');
    for (const [i, width] of [360, 390, 430].entries()) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('.dev-visual-panel').locator('button', { hasText: 'Victory Cinematic' }).click();
      await page.locator('.b6-terminal-reveal').waitFor({ state: 'visible', timeout: 7000 });
      const layout = await page.evaluate(() => {
        let el = document.querySelector('.boss-page');
        while (el) { if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = 0; el = el.parentElement; }
        window.scrollTo(0, 0);
        const reveal = document.querySelector('.b6-terminal-reveal');
        const b = reveal ? reveal.getBoundingClientRect() : null;
        const hit = (r) => !!b && !!r && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
        const buttons = Array.from(document.querySelectorAll('.boss-attack-panel button')).map(el => hit(el.getBoundingClientRect()));
        const hp = document.querySelector('.hp-track');
        const editor = document.querySelector('.code-frame');
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
          visible: !!b && b.width > 0 && b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight,
          defendDodge: buttons.some(Boolean),
          hp: !!hp && hit(hp.getBoundingClientRect()),
          editor: !!editor && hit(editor.getBoundingClientRect()),
        };
      });
      ok(!layout.overflow, width + 'px 无横向溢出');
      ok(layout.visible, width + 'px 演出完整可见');
      ok(!layout.defendDodge && !layout.hp && !layout.editor, width + 'px 不遮挡关键交互');
      await page.screenshot({ path: join(evidence, (16 + i) + '-mobile-' + width + '.png'), fullPage: false });
      await page.locator('.dev-visual-panel').locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(150);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => { const el = document.querySelector('.chlg-left'); if (el) el.scrollTop = el.scrollHeight; });
    await sleep(150);
    await page.screenshot({ path: join(evidence, '20-dev-panel.png'), fullPage: true });
    await page.locator('.dev-visual-panel').locator('button', { hasText: 'Victory Cinematic' }).click();
    await page.locator('.b6-terminal-portal').waitFor({ state: 'visible', timeout: 5000 });
    await clickButton(page, '撤退', '.hud button');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await page.locator('.b6-terminal-portal').count()) === 0 && (await page.locator('.b6-visual-root').count()) === 0, '页面切换清理视觉层/Portal');
    await ctx.close();

    console.log('=== 7. Reduced Motion ===');
    const rmCtx = await mkCtx(makeSave(), { reducedMotion: 'reduce' }); const rp = await rmCtx.newPage();
    rp.on('pageerror', e => errors.push('RM ' + String(e)));
    await rp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(rp);
    await rp.locator('.dev-perf-dashboard select').selectOption('NORMAL');
    ok(await rp.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 生效');
    await rp.locator('.dev-visual-panel').locator('button', { hasText: 'Crisis Identification' }).click();
    await sleep(300);
    ok(await rp.locator('.b6-crisis-cine').isVisible(), 'Reduced Motion 保留危机信息');
    const rpD = await dashboard(rp);
    ok(rpD.particles === 0, 'Reduced Motion 0 粒子');
    await rp.screenshot({ path: join(evidence, '08-reduced-motion.png'), fullPage: false });
    await rmCtx.close();
    ok(errors.length === 0, '全流程无未捕获异常', errors.slice(0, 3).join(' | '));
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => server.close(r));
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e?.message || e); process.exit(1); });
