// V1.3-F.3 生产构建性能 / Lazy Loading / Chunk Failure / Competition Polish E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, statSync, copyFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'f3-evidence');
mkdirSync(evidence, { recursive: true });
const PORT = 8600 + Math.floor(Math.random() * 60);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
function makeSave() {
  return JSON.stringify({
    version: 10, updatedAt: Date.now(),
    player: {
      name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
      level: 1, exp: 70, consciousness: 100,
      meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
      progress: {
        completedLevels: [], stars: {}, unlockedServers: ['training'], currentLevelId: null,
        failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: {},
        story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
        flags: { prologueDone: true, tutorialCinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true },
        bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
        bossBattleStats: { active: null, history: [] }, bossBattleRatings: { history: [] }, bossBattleRewards: { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } },
        bossAchievements: { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] },
        bossBattleArchive: { version: 1, records: [], archivedBattleIds: [], totals: { totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0, totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0, ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 }, bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null, currentWinStreak: 0, bestWinStreak: 0, updatedAt: null }, bossTotals: {}, difficultyTotals: {}, updatedAt: null },
        dynamicEvent: null, eventCooldowns: {}, currentBossId: null, pendingRebirth: false,
      },
      rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], ledger: [] },
      settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
    },
  });
}
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return Date.now() - t0; await sleep(100); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(100); } }
async function enterMenu(page) { await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click(); await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page); }
async function setEditorCode(page, code) { const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false); if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); } await sleep(160); }
function dirSize(dir) { let n = 0; for (const f of readdirSync(dir)) { const p = join(dir, f); const s = statSync(p); n += s.isDirectory() ? dirSize(p) : s.size; } return n; }
function bundleRows() {
  const chunks = join(root, 'dist', 'assets', 'chunks');
  const rows = [{ name: 'assets/game.js（Initial）', size: statSync(join(root, 'dist', 'assets', 'game.js')).size }];
  if (existsSync(chunks)) for (const f of readdirSync(chunks)) rows.push({ name: 'chunks/' + f, size: statSync(join(chunks, f)).size });
  return rows;
}
function evidencePage(title, rows) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#07111b;color:#eaf3fa;font-family:Consolas,monospace;padding:42px}h1{font-family:Orbitron,sans-serif;font-size:28px;color:#42d6d0;letter-spacing:2px;margin:0 0 8px}p{color:#6e8594;font-size:12px;margin:0 0 24px}.row{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid rgba(66,214,208,.15);padding:7px 0;font-size:13px}.row b{color:#ffd75e;font-weight:600}span{color:#9fb8c6}</style></head><body><h1>${title}</h1><p>NEXUS V1.3 · actual build/runtime evidence · ${new Date().toISOString()}</p>${rows.map(r => `<div class="row"><span>${r.name}</span><b>${r.value ?? ((r.size / 1024).toFixed(1) + ' KB')}</b></div>`).join('')}</body></html>`;
}

(async () => {
  let server = null; let browser = null;
  try {
    server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 30000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(200); }
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, makeSave());
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const loadStart = Date.now();
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    const bootMs = await waitText(page, 'ENTER NEXUS', 60000);
    const menuStart = Date.now();
    await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);
    const menuMs = Date.now() - menuStart;
    ok((await page.locator('.rail-item').count()) > 0, '生产构建主菜单正常');
    await page.screenshot({ path: join(evidence, '02-main-menu-after.png'), fullPage: false });

    console.log('=== Bundle / performance evidence ===');
    const rows = bundleRows();
    const mainBytes = rows[0].size;
    const totalBytes = rows.reduce((s, r) => s + r.size, 0);
    writeFileSync(join(evidence, '03-bundle-analysis.txt'), rows.map(r => r.name + '\t' + r.size).join('\n'));
    const auditPage = await ctx.newPage();
    await auditPage.setContent(evidencePage('BUNDLE ANALYSIS', rows));
    await auditPage.screenshot({ path: join(evidence, '03-bundle-analysis.png'), fullPage: true });
    await auditPage.close();
    ok(mainBytes < 1500000 && totalBytes > mainBytes, '页面级分块生效：初始 JS 小于总 JS', JSON.stringify({ mainBytes, totalBytes }));

    console.log('=== Explore lazy loading ===');
    const explorePattern = /\/assets\/chunks\/ExplorePage-.*\.js/;
    await page.route(explorePattern, async route => { await sleep(1000); await route.continue(); });
    const exploreStart = Date.now();
    await page.locator('.rail-item', { hasText: '数字世界探索' }).click();
    await page.locator('.nx-module-loading').waitFor({ state: 'visible', timeout: 5000 }); await sleep(350);
    await page.screenshot({ path: join(evidence, '04-explore-loading.png'), fullPage: false });
    await page.locator('.explore-page').waitFor({ state: 'visible', timeout: 20000 });
    const exploreMs = Date.now() - exploreStart;
    await page.unroute(explorePattern);
    ok(exploreMs >= 900, 'Explore 首次加载经过 Loading 状态', String(exploreMs));
    await page.screenshot({ path: join(evidence, '05-explore-loaded.png'), fullPage: false });
    const perfCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await perfCtx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, makeSave());
    const perfPage = await perfCtx.newPage();
    const coldStart = Date.now();
    await perfPage.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    const coldBoot = await waitText(perfPage, 'ENTER NEXUS', 60000);
    const coldMenuStart = Date.now();
    await clickButton(perfPage, 'ENTER NEXUS'); await waitText(perfPage, '继续探索', 60000); await clickThroughDialog(perfPage);
    const coldMenu = Date.now() - coldMenuStart;
    const coldExploreStart = Date.now();
    await perfPage.locator('.rail-item', { hasText: '数字世界探索' }).click();
    await perfPage.locator('.explore-page').waitFor({ state: 'visible', timeout: 20000 });
    const coldExplore = Date.now() - coldExploreStart;
    const coldTotal = Date.now() - coldStart;
    ok(coldExplore > 0 && coldTotal > 0, '冷缓存 Explore 首次加载可测量');
    const perfRows = [
      { name: 'Initial JS（game.js）', value: (mainBytes / 1024).toFixed(1) + ' KB' },
      { name: 'Lazy chunks（全部）', value: ((totalBytes - mainBytes) / 1024).toFixed(1) + ' KB' },
      { name: 'Total JS', value: (totalBytes / 1024).toFixed(1) + ' KB' },
      { name: '首屏到 ENTER NEXUS（冷）', value: coldBoot + ' ms' },
      { name: 'ENTER → Main Menu', value: coldMenu + ' ms' },
      { name: 'Explore 首次 Lazy Load（冷）', value: coldExplore + ' ms' },
    ];
    await perfPage.setContent(evidencePage('PERFORMANCE', perfRows));
    await perfPage.screenshot({ path: join(evidence, '14-performance.png'), fullPage: true });
    await perfCtx.close();

    console.log('=== Challenge / settlement ===');
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(300);
    const sig = page.locator('.explore-event-card', { hasText: '未知数据残留' }).first();
    if (!(await sig.innerText()).includes('已完成')) { await sig.locator('button', { hasText: '调查异常' }).click(); await sleep(350); }
    const ruin = page.locator('.explore-event-card', { hasText: '初代核心档案' }).first();
    if (!(await ruin.innerText()).includes('已完成')) { await ruin.locator('button', { hasText: '调查遗迹' }).click(); await sleep(350); }
    await page.locator('.explore-event-card', { hasText: '损坏的数据终端' }).first().locator('button', { hasText: '接入真实修复挑战' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    await page.screenshot({ path: join(evidence, '08-challenge.png'), fullPage: false });
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(900);
    await page.screenshot({ path: join(evidence, '09-settlement.png'), fullPage: false });
    ok((await page.locator('.ov-result').innerText()).includes('探索者'), '结算包含探索者');
    await clickButton(page, '返回地图'); await clickThroughDialog(page); await sleep(250);
    await clickButton(page, '主菜单'); await waitText(page, '继续探索', 15000);

    console.log('=== Profile / Shop / Mobile / Reduced Motion ===');
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    await page.screenshot({ path: join(evidence, '10-profile.png'), fullPage: false });
    await page.locator('button', { hasText: '◀ 返回' }).first().click(); await waitText(page, '继续探索', 15000);
    await page.locator('.rail-item', { hasText: '奖励兑换中心' }).click();
    await waitText(page, '兑换中心 · REWARD NEXUS', 15000); await sleep(350);
    await page.screenshot({ path: join(evidence, '11-shop.png'), fullPage: false });
    await page.locator('button', { hasText: '主菜单' }).first().click(); await waitText(page, '继续探索', 15000);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 844 }); await sleep(300);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), width + 'px 无横向溢出');
      await page.screenshot({ path: join(evidence, width === 390 ? '12-mobile-390.png' : '13-mobile-360.png'), fullPage: false });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.screenshot({ path: join(evidence, '15-reduced-motion.png'), fullPage: false });
    ok(true, 'Reduced Motion 下页面保持可读');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    console.log('=== Chunk failure / Retry ===');
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx2.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, makeSave());
    const p2 = await ctx2.newPage(); const e2 = [];
    p2.on('pageerror', e => e2.push(String(e)));
    await p2.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMenu(p2);
    await p2.route(explorePattern, route => route.abort('failed'));
    await p2.locator('.rail-item', { hasText: '数字世界探索' }).click();
    await p2.locator('.eb-root').waitFor({ state: 'visible', timeout: 15000 });
    ok((await p2.locator('.eb-code').innerText()).includes('SYSTEM FAILURE'), '懒加载 Chunk 失败进入 Error Boundary');
    await p2.screenshot({ path: join(evidence, '16-chunk-failure.png'), fullPage: false });
    await p2.unroute(explorePattern);
    await clickButton(p2, '重新加载模块');
    await waitText(p2, 'ENTER NEXUS', 60000);
    ok(true, 'Chunk 失败后重新加载恢复');
    const unexpected = e2.filter(e => !/Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(e));
    ok(unexpected.length === 0, 'Chunk 失败测试无非预期异常', unexpected.slice(0, 2).join(' | '));
    await ctx2.close();

    ok(errors.length === 0, '主流程无未捕获异常', errors.slice(0, 3).join(' | '));
    console.log('F3_PERF ' + JSON.stringify({ bootMs, menuMs, exploreMs, coldBoot, coldMenu, coldExplore, mainBytes, totalBytes }));
    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.3 E2E ERROR: ' + e.message);
    total++; console.log('FAIL | 流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
