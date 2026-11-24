// V1.3-B.6.8 视觉系统最终集成验收 E2E（真实 Chrome）
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-8-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 6100 + Math.floor(Math.random() * 80);
const DEV_PORT = 7400 + Math.floor(Math.random() * 80);
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
  if (expectDashboard) { await page.locator('.dev-perf-dashboard').waitFor({ state: 'visible', timeout: 15000 }); await sleep(1300); }
}
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function dashboard(page) {
  const el = page.locator('.dev-perf-dashboard'); await el.waitFor({ state: 'visible', timeout: 10000 });
  const text = await el.innerText();
  const num = (re, fb = NaN) => { const m = text.match(re); return m ? Number(m[1]) : fb; };
  return {
    text,
    mode: (text.match(/Mode：(\w+)/) || [])[1] || '',
    active: num(/Active：(\d+) \/ 6/),
    queue: num(/Queue (\d+) \/ 8/),
    particles: num(/Particles：(\d+) \/ 96/),
    hidden: /Hidden：YES/.test(text),
  };
}
async function shotAt(page, selector, name) {
  await page.locator(selector).first().evaluate(e => e.scrollIntoView({ block: 'start' })).catch(() => {});
  await sleep(120);
  await page.screenshot({ path: join(evidence, name), fullPage: false });
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
    ok((await prodPage.locator('.dev-registry-panel').count()) === 0 && (await prodPage.locator('.dev-perf-dashboard').count()) === 0, '生产隐藏 DEV Registry/Dashboard');
    await prodPage.screenshot({ path: join(evidence, '26-production-hidden.png'), fullPage: false });
    await prodCtx.close();

    console.log('=== 2. Registry / Priority / Conflicts ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const ctx = await mkCtx(makeSave()); const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('MAIN ' + String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    const vp = page.locator('.dev-visual-panel');
    await shotAt(page, '.dev-registry-panel', '01-visual-registry.png');
    ok((await page.locator('.dev-registry-grid').innerText()).includes('Terminal') && (await page.locator('.dev-registry-grid').innerText()).includes('P0'), 'Registry 显示 Terminal P0');

    // Priority: Attack → Weakness → Crisis → Phase
    await vp.locator('button', { hasText: 'Attack Warning' }).click();
    await vp.locator('button', { hasText: 'Weakness Discovery' }).click();
    await vp.locator('button', { hasText: 'Crisis Identification' }).click();
    await vp.locator('button', { hasText: 'Phase 1 → 2' }).click();
    await page.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 5000 });
    ok((await page.locator('.b6-crisis-cine').count()) === 0 && (await page.locator('.b6-weak-cine').count()) === 0 && (await page.locator('.b6-attack-cine').count()) === 0, 'P1 Phase 最终接管');
    await page.screenshot({ path: join(evidence, '02-priority-arbitration.png'), fullPage: false });
    await sleep(3300);
    await vp.locator('button', { hasText: 'Attack Warning' }).click();
    await vp.locator('button', { hasText: 'Phase 1 → 2' }).click();
    await page.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 5000 });
    ok((await page.locator('.b6-attack-cine').count()) === 0, 'Attack + Phase：Attack 被清理');
    await page.screenshot({ path: join(evidence, '03-attack-phase.png'), fullPage: false });
    await sleep(3300);
    await vp.locator('button', { hasText: 'Attack Warning' }).click();
    await vp.locator('button', { hasText: 'Crisis Impact' }).click();
    await page.locator('.b6-crisis-cine').waitFor({ state: 'visible', timeout: 5000 });
    ok((await page.locator('.b6-attack-cine').count()) === 0, 'Attack + Crisis：Crisis 接管');
    await page.screenshot({ path: join(evidence, '04-attack-crisis.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Interrupt Crisis' }).click(); await sleep(150);
    await vp.locator('button', { hasText: 'Weakness Discovery' }).click();
    await vp.locator('button', { hasText: 'Phase 1 → 2' }).click();
    await page.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 5000 });
    ok((await page.locator('.b6-weak-cine').count()) === 0, 'Weakness + Phase：Weakness 被清理');
    await page.screenshot({ path: join(evidence, '05-weakness-phase.png'), fullPage: false });
    await sleep(3300);

    console.log('=== 3. Terminal P0 ===');
    await vp.locator('button', { hasText: 'Attack Warning' }).click();
    await vp.locator('button', { hasText: 'Weakness Discovery' }).click();
    await vp.locator('button', { hasText: 'Crisis Impact' }).click();
    await vp.locator('button', { hasText: 'Phase 1 → 2' }).click();
    await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await page.locator('.b6-terminal-portal').waitFor({ state: 'visible', timeout: 5000 });
    ok((await page.locator('.b6-phase-cine').count()) === 0 && (await page.locator('.b6-crisis-cine').count()) === 0 && (await page.locator('.b6-weak-cine').count()) === 0 && (await page.locator('.b6-attack-cine').count()) === 0, 'Terminal 清理全部非 Terminal');
    let d = await dashboard(page);
    ok(d.active <= 6 && d.queue <= 8, 'Terminal P0 不突破硬限制');
    await page.screenshot({ path: join(evidence, '06-terminal-p0.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    ok((await page.locator('.b6-terminal-portal').count()) === 0, 'Terminal Cleanup 清理');
    await page.screenshot({ path: join(evidence, '07-terminal-cleanup.png'), fullPage: false });

    console.log('=== 4. AUTO / Modes / Flash / Visibility / Stress ===');
    const setMode = async (mode) => {
      await page.locator('.dev-perf-dashboard select').selectOption(mode);
      if (mode !== 'AUTO') await page.waitForFunction(m => document.querySelector('.b6-visual-root')?.getAttribute('data-performance-mode') === m, mode, { timeout: 5000 });
      await sleep(150);
    };
    await setMode('NORMAL'); await setMode('AUTO');
    await vp.locator('button', { hasText: 'Simulate 40 FPS' }).click(); await sleep(200);
    await shotAt(page, '.dev-perf-dashboard', '08-auto-degradation.png');
    ok((await dashboard(page)).mode !== 'NORMAL', 'AUTO 降级生效');
    await vp.locator('button', { hasText: 'Performance Recovery' }).click(); await sleep(100);
    await vp.locator('button', { hasText: 'Performance Recovery' }).click(); await sleep(100);
    await vp.locator('button', { hasText: 'Performance Recovery' }).click(); await sleep(100);
    await vp.locator('button', { hasText: 'Performance Recovery' }).click(); await sleep(200);
    await shotAt(page, '.dev-perf-dashboard', '09-auto-recovery.png');
    ok((await dashboard(page)).mode !== 'CRITICAL', 'AUTO 恢复离开 CRITICAL');
    for (const [name, mode] of [['10-normal.png', 'NORMAL'], ['11-reduced-mode.png', 'REDUCED'], ['12-low-mode.png', 'LOW'], ['13-critical-mode.png', 'CRITICAL']]) {
      await setMode(mode);
      await shotAt(page, '.dev-perf-dashboard', name);
    }
    await setMode('CRITICAL');
    await vp.locator('button', { hasText: 'Flash Safety Audit' }).click(); await sleep(300);
    ok((await page.locator('.b6-visual-root.b6-shaking').count()) === 0, 'CRITICAL Flash Safety');
    await page.screenshot({ path: join(evidence, '15-flash-safety.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Visibility Pause' }).click(); await sleep(200);
    ok((await dashboard(page)).hidden, 'Visibility Pause');
    await shotAt(page, '.dev-perf-dashboard', '18-visibility-pause.png');
    await vp.locator('button', { hasText: 'Visibility Pause' }).click(); await sleep(200);
    await setMode('NORMAL');
    await vp.locator('button', { hasText: 'Full Visual Stress' }).click();
    await page.locator('.b6-terminal-portal').waitFor({ state: 'visible', timeout: 5000 });
    d = await dashboard(page);
    ok(d.active <= 6 && d.queue <= 8 && d.particles <= 96, 'Stress 硬限制');
    await page.screenshot({ path: join(evidence, '19-stress.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);

    console.log('=== 5. Final Dashboard / Mobile / Settlement ===');
    await shotAt(page, '.dev-perf-dashboard', '25-final-dashboard.png');
    for (const [i, width] of [360, 390, 430].entries()) {
      await page.setViewportSize({ width, height: 844 });
      await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
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
      await page.screenshot({ path: join(evidence, (20 + i) + '-mobile-' + width + '.png'), fullPage: false });
      await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(150);
    }
    await page.setViewportSize({ width: 768, height: 1024 });
    await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await page.locator('.b6-terminal-reveal').waitFor({ state: 'visible', timeout: 7000 });
    const pad = await page.evaluate(() => {
      let el = document.querySelector('.boss-page');
      while (el) { if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = 0; el = el.parentElement; }
      window.scrollTo(0, 0);
      const reveal = document.querySelector('.b6-terminal-reveal');
      const b = reveal ? reveal.getBoundingClientRect() : null;
      const hit = (r) => !!b && !!r && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
      const buttons = Array.from(document.querySelectorAll('.boss-attack-panel button')).map(el => hit(el.getBoundingClientRect()));
      const hp = document.querySelector('.hp-track');
      const editor = document.querySelector('.code-frame');
      return { overflow: document.documentElement.scrollWidth > window.innerWidth + 2, visible: !!b && b.bottom <= window.innerHeight, blocked: buttons.some(Boolean) || (!!hp && hit(hp.getBoundingClientRect())) || (!!editor && hit(editor.getBoundingClientRect())) };
    });
    ok(!pad.overflow && pad.visible && !pad.blocked, '768px 移动/平板布局通过');
    await page.screenshot({ path: join(evidence, '27-mobile-768.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(150);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('.dev-arbiter-panel button', { hasText: '模拟胜利' }).click();
    await page.locator('.settlement-overlay').waitFor({ state: 'visible', timeout: 8000 });
    ok(await page.locator('.settlement-overlay.settlement-victory').count() >= 1, '真实 Settlement 打开');
    await page.screenshot({ path: join(evidence, '23-settlement.png'), fullPage: false });

    console.log('=== 6. Settings Integration ===');
    const footer = page.locator('.settlement-overlay .bs-footer .nxbtn.primary').first();
    await footer.click().catch(() => {});
    await page.locator('.settlement-overlay').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await clickButton(page, '撤退', '.hud button');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 20000);
    await clickButton(page, '主菜单', '.nxbtn');
    await waitText(page, '系统配置', 15000);
    await clickButton(page, '系统配置', '.rail-item');
    await waitText(page, '画面', 15000);
    const saveBeforeSettings = await saveData(page);
    await page.locator('.set-row', { hasText: 'Boss 视觉强度' }).locator('select').selectOption('CINEMATIC');
    await page.screenshot({ path: join(evidence, '16-settings-intensity.png'), fullPage: false });
    await page.locator('.set-row', { hasText: '视觉性能模式' }).locator('select').selectOption('LOW');
    await page.screenshot({ path: join(evidence, '17-settings-performance.png'), fullPage: false });
    const ls = await page.evaluate(() => ({
      intensity: localStorage.getItem('nexus_visual_intensity'),
      performance: localStorage.getItem('nexus_visual_performance_mode'),
    }));
    ok(ls.intensity === 'CINEMATIC' && ls.performance === 'LOW', 'Settings 持久化到 localStorage', JSON.stringify(ls));
    ok((await saveData(page)).version === saveBeforeSettings.version && saveBeforeSettings.version === 10, 'Settings 不改 Save 版本');
    await ctx.close();

    console.log('=== 7. Archive Integrity ===');
    const aCtx = await mkCtx(makeSave()); const ap = await aCtx.newPage();
    ap.on('pageerror', e => errors.push('ARCHIVE ' + String(e)));
    await ap.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(ap);
    await ap.locator('.dev-arbiter-panel button', { hasText: '模拟撤退' }).click();
    await ap.locator('.settlement-overlay.settlement-retreat').waitFor({ state: 'visible', timeout: 8000 });
    await ap.locator('.settlement-overlay .bs-footer .nxbtn.primary').first().click().catch(() => {});
    await ap.locator('.settlement-overlay').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await clickButton(ap, '撤退', '.hud button');
    await waitText(ap, 'NEXUS 数字世界 · 服务器网络', 20000);
    await clickButton(ap, '主菜单', '.nxbtn');
    await waitText(ap, '战斗档案馆', 15000);
    await clickButton(ap, '战斗档案馆', '.rail-item');
    await ap.locator('.archive-page').waitFor({ state: 'visible', timeout: 15000 });
    ok((await ap.locator('.archive-card').count()) >= 1, '真实 Retreat 写入战斗档案馆');
    await ap.screenshot({ path: join(evidence, '24-archive.png'), fullPage: false });
    await aCtx.close();

    console.log('=== 8. Reduced Motion ===');
    const rmCtx = await mkCtx(makeSave(), { reducedMotion: 'reduce' }); const rp = await rmCtx.newPage();
    rp.on('pageerror', e => errors.push('RM ' + String(e)));
    await rp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(rp);
    await rp.locator('.dev-perf-dashboard select').selectOption('NORMAL');
    await rp.locator('.dev-visual-panel').locator('button', { hasText: 'Crisis Identification' }).click(); await sleep(300);
    ok(await rp.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 生效');
    ok(await rp.locator('.b6-crisis-cine').isVisible(), 'Reduced Motion 保留危机信息');
    ok((await dashboard(rp)).particles === 0, 'Reduced Motion 0 粒子');
    await rp.screenshot({ path: join(evidence, '14-reduced-motion.png'), fullPage: false });
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
