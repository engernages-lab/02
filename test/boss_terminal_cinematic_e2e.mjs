// V1.3-B.6.6 终结（Victory / Defeat / Retreat / Interrupted）电影化真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-6-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 5700 + Math.floor(Math.random() * 80);
const DEV_PORT = 7000 + Math.floor(Math.random() * 80);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave(consciousness = 100) {
  const player = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness,
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
async function gotoBossDiff(page) {
  await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, 'Python 知识库', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await clickThroughDialog(page); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000); await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(220); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(220); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
}
async function enterBoss(page) {
  await gotoBossDiff(page);
  const c = page.locator('button', { hasText: '继续挑战' }).first(); if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.b6-visual-root').waitFor({ state: 'visible', timeout: 10000 });
}
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function setEditorCode(page, code) {
  const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(150);
}
const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
const P2 = 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"';
const P3 = 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))';
const P4 = 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))';
async function terminalPortal(page, text, timeout = 8000) { const loc = page.locator('.b6-terminal-portal', { hasText: text }).first(); await loc.waitFor({ state: 'visible', timeout }); return loc.innerText(); }
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
    await enterBoss(prodPage);
    ok((await prodPage.locator('.dev-visual-panel').count()) === 0, '生产隐藏 DEV 视觉面板');
    await prodCtx.close();

    console.log('=== 2. 冲突覆盖 / DEV 终结控制 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const ctx = await mkCtx(makeSave()); const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('MAIN ' + String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    const vp = page.locator('.dev-visual-panel'); await vp.waitFor({ state: 'visible', timeout: 15000 });
    ok(true, 'DEV 环境显示视觉测试面板');
    await vp.locator('button', { hasText: 'Phase 1 → 2' }).click();
    await sleep(200);
    await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await terminalPortal(page, 'FINAL IMPACT', 5000);
    ok((await page.locator('.b6-phase-cine').count()) === 0, 'Terminal 抢占 Phase');
    await page.screenshot({ path: join(evidence, '23-phase-override.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    await vp.locator('button', { hasText: 'Attack Warning' }).click();
    await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await terminalPortal(page, 'FINAL IMPACT', 5000);
    ok((await page.locator('.b6-attack-cine').count()) === 0, 'Terminal 抢占 Attack');
    await page.screenshot({ path: join(evidence, '20-attack-override.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    await vp.locator('button', { hasText: 'Weakness Discovery' }).click();
    await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await terminalPortal(page, 'FINAL IMPACT', 5000);
    ok((await page.locator('.b6-weak-cine').count()) === 0, 'Terminal 抢占 Weakness');
    await page.screenshot({ path: join(evidence, '21-weakness-override.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    await vp.locator('button', { hasText: 'Crisis Identification' }).click();
    await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await terminalPortal(page, 'FINAL IMPACT', 5000);
    ok((await page.locator('.b6-crisis-cine').count()) === 0 && (await page.locator('.b6-crisis-portal').count()) === 0, 'Terminal 抢占 Crisis/Portal');
    await page.screenshot({ path: join(evidence, '22-crisis-override.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    await vp.locator('button', { hasText: 'Terminal Priority' }).click();
    await terminalPortal(page, 'FINAL IMPACT', 5000);
    ok((await page.locator('.b6-attack-cine').count()) === 0, 'Terminal Priority 接管攻击');
    await page.screenshot({ path: join(evidence, '12-terminal-priority.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    await vp.locator('button', { hasText: 'Interrupted Cinematic' }).click();
    await terminalPortal(page, 'SYSTEM INTERRUPTED', 5000);
    await page.screenshot({ path: join(evidence, '24-interrupted.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Interrupt' }).click(); await sleep(250);
    ok((await page.locator('.b6-terminal-portal').count()) === 0, 'Terminal Interrupt 清理');
    await page.screenshot({ path: join(evidence, '11-terminal-interrupt.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await terminalPortal(page, 'FINAL IMPACT', 5000);
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(250);
    ok((await page.locator('.b6-terminal-portal').count()) === 0, 'Terminal Cleanup 清理');
    await page.screenshot({ path: join(evidence, '13-terminal-cleanup.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Terminal Duplicate' }).click();
    await terminalPortal(page, 'FINAL IMPACT', 5000);
    ok((await page.locator('.b6-terminal-portal').count()) === 1, 'Duplicate 不并列');
    await vp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    await vp.locator('button', { hasText: 'Terminal Stale' }).click(); await sleep(300);
    ok((await page.locator('.b6-terminal-portal').count()) === 0, 'Stale Terminal 被拒绝');

    console.log('=== 3. 真实 Victory + Settlement ===');
    const beforeVictory = await saveData(page);
    const beforeCount = (beforeVictory.player.progress.bossBattleStats.history || []).length;
    await setEditorCode(page, P1);
    await clickButton(page, '提交攻击');
    await waitText(page, '战斗阶段 2 / 3', 60000);
    await sleep(1800);
    await setEditorCode(page, P2);
    await clickButton(page, '提交攻击');
    await waitText(page, '战斗阶段 3 / 3', 60000);
    await sleep(1800);
    await setEditorCode(page, P3);
    await clickButton(page, '提交攻击');
    await waitText(page, '阶段 4 / 4', 30000);
    await sleep(1800);
    await setEditorCode(page, P4);
    await clickButton(page, '提交攻击');
    await terminalPortal(page, 'FINAL IMPACT', 60000);
    await page.screenshot({ path: join(evidence, '01-victory-impact.png'), fullPage: false });
    const frag = page.locator('.frag-gain').first();
    if (await frag.isVisible().catch(() => false)) await frag.click({ force: true }).catch(() => {});
    await page.locator('.settlement-overlay').waitFor({ state: 'visible', timeout: 8000 }).catch(async e => {
      console.log('DEBUG victory text:', (await textOf(page)).slice(-1200));
      console.log('DEBUG frag=', await page.locator('.frag-gain').count(), 'complete=', await page.locator('.boss-complete').count(), 'settle=', await page.locator('.settlement-overlay').count());
      console.log('DEBUG save stats:', JSON.stringify((await saveData(page)).player.progress.bossBattleStats).slice(0, 800));
      throw e;
    });
    ok(await page.locator('.settlement-overlay.settlement-victory').count() >= 1, '真实 Victory 结算打开');
    const footer = page.locator('.settlement-overlay .bs-footer .nxbtn.primary').first();
    ok(await footer.isVisible() && await footer.isEnabled(), 'Settlement 按钮可操作');
    const zs = await page.evaluate(() => {
      const p = document.querySelector('.b6-terminal-portal');
      const s = document.querySelector('.settlement-overlay');
      return { p: p ? Number(getComputedStyle(p).zIndex) : 0, s: s ? Number(getComputedStyle(s).zIndex) : 0 };
    });
    ok(zs.p > zs.s, 'Terminal Portal 位于 Settlement 之上', JSON.stringify(zs));
    await terminalPortal(page, 'BOSS COLLAPSE', 4000);
    await page.screenshot({ path: join(evidence, '02-boss-collapse.png'), fullPage: false });
    await terminalPortal(page, 'CORE SHUTDOWN', 4000);
    await page.screenshot({ path: join(evidence, '03-core-shutdown.png'), fullPage: false });
    const reveal = await terminalPortal(page, 'BOSS DEFEATED', 4000);
    ok(reveal.includes('VICTORY') && reveal.includes('数据港守卫'), 'Victory Reveal 真实 Boss 信息');
    const overlap = await page.evaluate(() => {
      const a = document.querySelector('.b6-terminal-reveal');
      const b = document.querySelector('.settlement-overlay .bs-footer .nxbtn.primary');
      const r1 = a ? a.getBoundingClientRect() : null;
      const r2 = b ? b.getBoundingClientRect() : null;
      if (!r1 || !r2) return false;
      return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
    });
    ok(!overlap, 'Reveal 卡不遮挡结算按钮');
    await page.screenshot({ path: join(evidence, '04-victory-reveal.png'), fullPage: false });
    await page.locator('.b6-terminal-portal').waitFor({ state: 'hidden', timeout: 6000 });
    await page.screenshot({ path: join(evidence, '05-victory-settlement.png'), fullPage: false });
    ok((await page.locator('.b6-terminal-portal').count()) === 0, 'Victory Cinematic 自动清理');
    ok((await page.locator('.settlement-overlay').count()) === 1, 'Settlement 未重复');
    const afterVictory = await saveData(page);
    const afterCount = (afterVictory.player.progress.bossBattleStats.history || []).length;
    ok(afterCount === beforeCount + 1, '真实终结统计只记录一次', beforeCount + '→' + afterCount);
    ok(afterVictory.version === 10, '存档版本 v10');
    await footer.click().catch(() => {});
    await page.locator('.settlement-overlay').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await ctx.close();

    console.log('=== 4. 真实 Defeat ===');
    const dCtx = await mkCtx(makeSave(1)); const dp = await dCtx.newPage();
    dp.on('pageerror', e => errors.push('DEFEAT ' + String(e)));
    await dp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(dp);
    await terminalPortal(dp, 'CRITICAL FAILURE', 60000);
    await dp.locator('.settlement-overlay').waitFor({ state: 'visible', timeout: 8000 });
    ok(await dp.locator('.settlement-overlay.settlement-defeat').count() >= 1, '真实 Defeat 结算打开');
    await dp.screenshot({ path: join(evidence, '06-defeat-critical.png'), fullPage: false });
    await terminalPortal(dp, 'SYSTEM COLLAPSE', 5000);
    await dp.screenshot({ path: join(evidence, '07-system-collapse.png'), fullPage: false });
    const dReveal = await terminalPortal(dp, 'PLAYER DEFEATED', 5000);
    ok(dReveal.includes('DEFEAT') && dReveal.includes('数据港守卫'), 'Defeat Reveal 真实信息');
    await dp.screenshot({ path: join(evidence, '08-defeat-reveal.png'), fullPage: false });
    await dp.locator('.b6-terminal-portal').waitFor({ state: 'hidden', timeout: 6000 });
    await dp.screenshot({ path: join(evidence, '09-defeat-settlement.png'), fullPage: false });
    const dSave = await saveData(dp);
    const dLast = (dSave.player.progress.bossBattleStats.history || []).slice(-1)[0];
    ok(dLast && dLast.result === 'defeat', '真实 Defeat 统计结果');
    await dCtx.close();

    console.log('=== 5. 真实 Retreat ===');
    const rCtx = await mkCtx(makeSave()); const rp = await rCtx.newPage();
    rp.on('pageerror', e => errors.push('RETREAT ' + String(e)));
    await rp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(rp);
    await rp.locator('.dev-arbiter-panel button', { hasText: '模拟撤退' }).click();
    await terminalPortal(rp, 'RETREAT INITIATED', 8000);
    await rp.locator('.settlement-overlay').waitFor({ state: 'visible', timeout: 8000 });
    ok(await rp.locator('.settlement-overlay.settlement-retreat').count() >= 1, '真实 Retreat 结算打开');
    await rp.screenshot({ path: join(evidence, '10-retreat-cinematic.png'), fullPage: false });
    const rSave = await saveData(rp);
    const rLast = (rSave.player.progress.bossBattleStats.history || []).slice(-1)[0];
    ok(rLast && rLast.result === 'retreat', '真实 Retreat 统计结果');
    await rCtx.close();

    console.log('=== 6. Reduced Motion / Mobile ===');
    const rmCtx = await mkCtx(makeSave(), { reducedMotion: 'reduce' }); const mp = await rmCtx.newPage();
    mp.on('pageerror', e => errors.push('RM ' + String(e)));
    await mp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(mp);
    ok(await mp.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 生效');
    const mvp = mp.locator('.dev-visual-panel');
    await mvp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await terminalPortal(mp, 'BOSS DEFEATED', 7000);
    await mp.screenshot({ path: join(evidence, '14-reduced-motion-victory.png'), fullPage: false });
    await mvp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    await mvp.locator('button', { hasText: 'Defeat Cinematic' }).click();
    await terminalPortal(mp, 'PLAYER DEFEATED', 6000);
    await mp.screenshot({ path: join(evidence, '15-reduced-motion-defeat.png'), fullPage: false });
    await mvp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(200);
    for (const [i, width] of [360, 390, 430].entries()) {
      await mp.setViewportSize({ width, height: 844 });
      await mvp.locator('button', { hasText: 'Victory Cinematic' }).click();
      await terminalPortal(mp, 'BOSS DEFEATED', 7000);
      const layout = await mp.evaluate(() => {
        let el = document.querySelector('.boss-page');
        while (el) { if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = 0; el = el.parentElement; }
        window.scrollTo(0, 0);
        const portal = document.querySelector('.b6-terminal-portal');
        const reveal = document.querySelector('.b6-terminal-reveal');
        const b = reveal ? reveal.getBoundingClientRect() : portal ? portal.getBoundingClientRect() : null;
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
      ok(layout.visible, width + 'px 终结演出完整可见');
      ok(!layout.defendDodge, width + 'px 不遮挡防御/闪避');
      ok(!layout.hp, width + 'px 不遮挡 Boss HP');
      ok(!layout.editor, width + 'px 不遮挡挑战输入区');
      await mp.screenshot({ path: join(evidence, (16 + i) + '-mobile-' + width + '.png'), fullPage: false });
      await mvp.locator('button', { hasText: 'Terminal Cleanup' }).click(); await sleep(150);
    }
    await mp.setViewportSize({ width: 1440, height: 900 });
    await mp.evaluate(() => { const el = document.querySelector('.chlg-left'); if (el) el.scrollTop = el.scrollHeight; });
    await sleep(150);
    await mp.screenshot({ path: join(evidence, '19-dev-panel.png'), fullPage: true });
    await mvp.locator('button', { hasText: 'Victory Cinematic' }).click();
    await terminalPortal(mp, 'FINAL IMPACT', 5000);
    await clickButton(mp, '撤退', '.hud button');
    await waitText(mp, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await mp.locator('.b6-terminal-portal').count()) === 0 && (await mp.locator('.b6-visual-root').count()) === 0, '页面切换清理 Terminal/Portal');
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
