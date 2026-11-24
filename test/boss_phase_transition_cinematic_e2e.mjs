// V1.3-B.6.3 阶段转换电影化真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-3-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 5100 + Math.floor(Math.random() * 80);
const DEV_PORT = 6400 + Math.floor(Math.random() * 80);
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
  await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, 'Python 知识库', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await clickThroughDialog(page); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000); await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(220); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(220); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const c = page.locator('button', { hasText: '继续挑战' }).first(); if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.b6-visual-root').waitFor({ state: 'visible', timeout: 10000 });
}
async function setCode(page, code) { const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false); if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); } await sleep(150); }
async function waitWarning(page, timeout = 45000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await page.locator('.attack-warning').first().isVisible().catch(() => false)) return; await sleep(160); } throw new Error('warning timeout'); }
const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
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
    const mkCtx = async (seed) => { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, seed); return ctx; };
    console.log('=== 1. 生产页 ===');
    const prodCtx = await mkCtx(makeSave()); const prod = await prodCtx.newPage();
    await prod.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 }); await enterBoss(prod);
    ok(await prod.locator('.b6-visual-root').isVisible(), '生产 Boss 视觉层存在');
    ok((await prod.locator('.dev-visual-panel').count()) === 0, '生产隐藏 DEV 面板');
    await prodCtx.close();

    console.log('=== 2. 真实阶段转换 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const ctx = await mkCtx(makeSave()); const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 }); await enterBoss(page);
    await waitWarning(page);
    await setCode(page, P1);
    await clickButton(page, '提交攻击');
    await page.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 60000 });
    const phaseText = await page.locator('.b6-phase-cine').innerText();
    ok(phaseText.includes('PHASE 02'), '真实阶段转换显示 PHASE 02');
    ok(phaseText.includes('防御协议'), '真实阶段名称来自配置');
    ok(phaseText.includes('PRE-TRANSITION') || phaseText.includes('PHASE TRANSITION'), '阶段演出阶段标识');
    ok((await page.locator('.b6-attack-cine').count()) === 0, '阶段转换清理攻击演出');
    await page.screenshot({ path: join(evidence, '01-phase-transition-warning.png'), fullPage: false });
    await sleep(320);
    await page.screenshot({ path: join(evidence, '02-pre-transition.png'), fullPage: false });
    await sleep(500);
    await page.screenshot({ path: join(evidence, '03-distortion.png'), fullPage: false });
    await sleep(450);
    await page.screenshot({ path: join(evidence, '04-energy-collapse.png'), fullPage: false });
    await sleep(500);
    await page.screenshot({ path: join(evidence, '05-core-reconstruction.png'), fullPage: false });
    await sleep(550);
    await page.screenshot({ path: join(evidence, '06-phase-reveal.png'), fullPage: false });
    await page.screenshot({ path: join(evidence, '07-phase-02.png'), fullPage: false });
    await waitWarning(page);
    ok(await page.locator('.b6-phase-cine').count() === 0, '阶段转换结束后新阶段攻击可启动');
    await page.screenshot({ path: join(evidence, '08-phase-03-transition-ready.png'), fullPage: false });

    const devPanel = page.locator('.dev-visual-panel'); await devPanel.waitFor({ state: 'visible', timeout: 10000 });
    await devPanel.locator('button', { hasText: 'Phase 2 → 3' }).click();
    await sleep(1900);
    ok((await page.locator('.b6-phase-cine').innerText()).includes('核心暴走'), 'DEV Phase 2→3 使用真实名称');
    await page.screenshot({ path: join(evidence, '09-phase-03.png'), fullPage: false });
    await devPanel.locator('button', { hasText: 'Cleanup All' }).click();
    await sleep(200);
    ok((await page.locator('.b6-phase-cine').count()) === 0, 'Cleanup 清理阶段演出');
    await page.screenshot({ path: join(evidence, '13-cleanup.png'), fullPage: false });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'commit', timeout: 60000 }); await enterBoss(page); await sleep(400);
    ok(await page.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 生效');
    await page.locator('.dev-visual-panel').locator('button', { hasText: 'Phase 1 → 2' }).click();
    await sleep(1900);
    ok(await page.locator('.b6-phase-cine').isVisible(), 'Reduced Motion 仍显示阶段信息');
    await page.screenshot({ path: join(evidence, '10-reduced-motion.png'), fullPage: false });

    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('.dev-visual-panel').locator('button', { hasText: 'Phase 1 → 2' }).click();
      await sleep(1900);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), width + 'px 无横向溢出');
      ok(await page.locator('.b6-phase-cine').isVisible(), width + 'px 阶段演出可见');
      await page.screenshot({ path: join(evidence, '11-mobile-' + width + '.png'), fullPage: false });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: join(evidence, '14-dev-panel.png'), fullPage: true });
    await clickButton(page, '撤退', '.hud button');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await page.locator('.b6-phase-cine').count()) === 0 && (await page.locator('.b6-visual-root').count()) === 0, '页面切换清理阶段/视觉层');
    ok(errors.length === 0, '阶段演出无未捕获异常', errors.slice(0, 3).join(' | '));
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
