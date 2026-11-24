// V1.3-F.1 生产构建 Smoke：dist 产物真实启动、页面可达、无未捕获异常
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'f1-evidence');
mkdirSync(evidence, { recursive: true });
const PORT = 8100 + Math.floor(Math.random() * 50);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
function makeSave() {
  return JSON.stringify({
    version: 10, updatedAt: Date.now(),
    player: {
      name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
      level: 2, exp: 110, consciousness: 100,
      meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
      progress: {
        completedLevels: ['tut-1'], stars: { 'tut-1': 3 }, unlockedServers: ['training'], currentLevelId: null,
        failedAttempts: {}, hintLevels: {}, achievements: ['first_repair', 'training_done'], knowledge: [], storySeen: {},
        story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
        flags: { prologueDone: true, tutorialCinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true },
        bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
        bossBattleStats: { active: null, history: [] }, bossBattleRatings: { history: [] }, bossBattleRewards: { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } },
        bossAchievements: { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] },
        bossBattleArchive: { version: 1, records: [], archivedBattleIds: [], totals: { totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0, totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0, ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 }, bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null, currentWinStreak: 0, bestWinStreak: 0, updatedAt: null }, bossTotals: {}, difficultyTotals: {}, updatedAt: null },
        dynamicEvent: null, eventCooldowns: {}, currentBossId: null, pendingRebirth: false,
        exploration: { version: 1, events: {}, ruins: {}, hidden: {}, rewardsClaimed: [], discoveredRegions: [], pendingChallenge: null, archive: [], updatedAt: 1 },
      },
      rewards: { credits: 10, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], ledger: [{ kind: 'exploration', ref: 'signal:training', credits: 5, exp: 0, at: 1 }] },
      mira: { level: 2, exp: 30, stage: 'initial', eventLog: [], memories: {}, lastScene: {}, updatedAt: 1 },
      settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
    },
  });
}
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(150); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }

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
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, 'ENTER NEXUS', 60000);
    const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
    await clickButton(page, 'ENTER NEXUS');
    await waitText(page, '继续探索', 60000);
    await clickThroughDialog(page);
    ok((await textOf(page)).includes('继续探索'), '生产构建主菜单启动');
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    ok(save.version === 10, '生产构建读取 Save v10');
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    ok((await page.locator('.pf-growth-panel').innerText()).includes('Lv.2'), '生产构建玩家档案');
    ok((await page.locator('.pf-recent').innerText()).includes('exploration'), '生产构建探索流水可见（P2-01）');
    await page.locator('button', { hasText: '◀ 返回' }).first().click();
    await waitText(page, '继续探索', 15000);
    for (const [label, marker] of [['数字世界探索', '.explore-page'], ['MIRA 核心', '.mira-page'], ['成就系统', '.ach-card'], ['Python 知识库', '.page-inner']]) {
      if (label === 'Python 知识库') { await page.locator('.rail-item', { hasText: label }).click(); } else await page.locator('.rail-item', { hasText: label }).click();
      await page.locator(marker).first().waitFor({ state: 'visible', timeout: 15000 });
      ok(true, '生产构建页面可达：' + label);
      const back = page.locator('button', { hasText: '◀ 返回' }).first();
      if (await back.isVisible().catch(() => false)) await back.click();
      await waitText(page, '继续探索', 15000);
    }
    await page.screenshot({ path: join(evidence, '12-build-smoke.png'), fullPage: false });
    ok(errors.length === 0, '生产构建无未捕获异常', errors.slice(0, 3).join(' | '));
    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.1 Smoke ERROR: ' + e.message);
    total++; console.log('FAIL | Smoke 中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
