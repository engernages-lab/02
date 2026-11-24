// V1.3-F.2 生产构建 Smoke：世界地图 / 挑战 / 商城 / 存档 / 错误边界 DEV 隔离
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
mkdirSync(join(root, '.tmp', 'f2-evidence'), { recursive: true });
const PORT = 8500 + Math.floor(Math.random() * 50);
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
        exploration: { version: 1, events: { 'terminal:training': { status: 'completed', discoveredAt: 1, completedAt: 1 } }, ruins: {}, hidden: {}, rewardsClaimed: ['terminal:training'], discoveredRegions: [], pendingChallenge: null, archive: [], updatedAt: 1 },
      },
      rewards: { credits: 10, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], ledger: [{ kind: 'exploration', ref: 'terminal:training', credits: 10, exp: 0, at: 1 }] },
      mira: { level: 2, exp: 30, stage: 'initial', eventLog: [], memories: {}, lastScene: {}, updatedAt: 1 },
      settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
    },
  });
}
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(150); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function enterMenu(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);
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

    console.log('=== 1. DEV 错误探针不得进入生产 ===');
    await page.goto('http://127.0.0.1:' + PORT + '/?crash=1', { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, 'ENTER NEXUS', 60000);
    ok((await page.locator('.eb-root').count()) === 0, '生产构建不激活 DEV crash 探针');
    await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);

    console.log('=== 2. 世界地图 / 挑战 ===');
    await clickButton(page, '继续探索'); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000); await clickThroughDialog(page);
    ok((await page.locator('.node-group').count()) >= 1, '生产构建世界地图可打开');
    await page.locator('.node-group').first().dispatchEvent('click'); await sleep(500); await clickThroughDialog(page);
    await page.locator('.lv-row').first().locator('button', { hasText: '重玩' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    ok(true, '生产构建 Challenge 编辑器可打开');

    console.log('=== 3. 商城 / 页面 ===');
    await page.reload({ waitUntil: 'commit', timeout: 60000 }); await enterMenu(page);
    await page.locator('.rail-item', { hasText: '奖励兑换中心' }).click();
    await waitText(page, '兑换中心 · REWARD NEXUS', 15000);
    ok(true, '生产构建 Shop 可打开');
    await clickButton(page, '主菜单', '.nxbtn'); await waitText(page, '继续探索', 15000);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    ok((await page.locator('.pf-recent').innerText()).includes('exploration'), '生产构建探索流水可见');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    ok(saved.version === 10 && saved.player.level === 2, '生产构建 Save v10 / Lv2');

    console.log('=== 4. Refresh ===');
    await page.reload({ waitUntil: 'commit', timeout: 60000 }); await enterMenu(page);
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    ok((await page.locator('.pf-growth-panel').innerText()).includes('Lv.2'), '生产构建刷新恢复');
    ok(errors.length === 0, '生产构建无未捕获异常', errors.slice(0, 3).join(' | '));

    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.2 Smoke ERROR: ' + e.message);
    total++; console.log('FAIL | Smoke 中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
