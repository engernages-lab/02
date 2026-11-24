// V1.3-F.2 基础性能测量（生产构建，真实浏览器）
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PORT = 8400 + Math.floor(Math.random() * 50);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function playerSeed(level, exp, extra = {}) {
  const p = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level, exp, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: extra.completed || [], stars: {}, unlockedServers: extra.servers || ['training'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: {},
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, ...(extra.flags || {}) },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
      bossBattleStats: { active: null, history: [] }, bossBattleRatings: { history: [] }, bossBattleRewards: { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } },
      bossAchievements: { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] },
      bossBattleArchive: { version: 1, records: [], archivedBattleIds: [], totals: { totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0, totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0, ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 }, bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null, currentWinStreak: 0, bestWinStreak: 0, updatedAt: null }, bossTotals: {}, difficultyTotals: {}, updatedAt: null },
      dynamicEvent: null, eventCooldowns: {}, currentBossId: null, pendingRebirth: false,
      exploration: { version: 1, events: {}, ruins: {}, hidden: {}, rewardsClaimed: [], discoveredRegions: [], pendingChallenge: null, archive: [], updatedAt: 1 },
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], ledger: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player: p });
}
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 60000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return Date.now() - t0; await sleep(100); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(100); } }
async function enterMenu(page) {
  await waitText(page, 'ENTER NEXUS');
  const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  const t = Date.now();
  await clickButton(page, 'ENTER NEXUS');
  await waitText(page, '继续探索');
  await clickThroughDialog(page);
  return Date.now() - t;
}
async function launch() {
  const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
  return chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
}

(async () => {
  let server = null; let browser = null;
  const result = {};
  try {
    server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 30000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(200); }
    browser = await launch();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, playerSeed(2, 110));
    const page = await ctx.newPage();
    const consoleErrors = []; const failedRequests = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', r => failedRequests.push(r.url()));
    const navStart = Date.now();
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForFunction(() => document.body && document.body.innerText.includes('ENTER NEXUS'), null, { timeout: 60000 });
    result.firstLoadMs = Date.now() - navStart;
    result.nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      return n ? { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), transferSize: n.transferSize || 0 } : null;
    });
    result.menuMs = await enterMenu(page);
    await page.screenshot({ path: join(root, '.tmp', 'f2-evidence', '13-performance-menu.png'), fullPage: false });
    let t = Date.now();
    await page.locator('.rail-item', { hasText: '数字世界探索' }).click();
    await page.locator('.explore-page').waitFor({ state: 'visible', timeout: 15000 });
    result.exploreSwitchMs = Date.now() - t;
    t = Date.now();
    await page.locator('button', { hasText: '◀ 返回' }).first().click();
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    result.profileSwitchMs = Date.now() - t;
    result.consoleErrors = consoleErrors;
    result.failedRequests = failedRequests;
    ok(result.firstLoadMs > 0 && result.menuMs > 0, '生产构建首屏/主菜单可测量');
    ok(result.exploreSwitchMs > 0 && result.profileSwitchMs > 0, '页面切换可测量');
    ok(consoleErrors.length === 0, '无 Console Error', consoleErrors.slice(0, 2).join(' | '));
    ok(failedRequests.length === 0, '无资源加载失败', failedRequests.slice(0, 2).join(' | '));

    const bctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await bctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, playerSeed(3, 390, { completed: CH1, servers: ['training', 'syntax', 'logs'], flags: { chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true, 'bossIntro_gate-01': true } }));
    const bp = await bctx.newPage();
    const bErrors = []; bp.on('pageerror', e => bErrors.push(String(e)));
    const bStart = Date.now();
    await bp.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMenu(bp);
    await clickButton(bp, '继续探索');
    await waitText(bp, 'NEXUS 数字世界 · 服务器网络');
    await clickThroughDialog(bp);
    await bp.locator('.node-group').nth(1).click({ force: true }); await sleep(200); await clickThroughDialog(bp);
    await clickButton(bp, '挑战 ▸'); await sleep(200); await clickThroughDialog(bp);
    await bp.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
    const c = bp.locator('button', { hasText: '继续挑战' }).first();
    if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(bp, '开始挑战');
    await bp.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
    result.bossEntryMs = Date.now() - bStart;
    ok(result.bossEntryMs > 0, 'Boss 初始化可测量');
    ok(bErrors.length === 0, 'Boss 初始化无未捕获异常', bErrors.slice(0, 2).join(' | '));
    console.log('F2_PERF ' + JSON.stringify(result));
    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.2 PERF ERROR: ' + e.message);
    total++; console.log('FAIL | 性能测量中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
