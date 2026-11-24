// Boss 战端到端（F.3 真实浏览器版）：独立界面 / 阶段 / 失败反击 / 撤退 / 中局存档 / 已击破
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PORT = 8800 + Math.floor(Math.random() * 50);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave({ battles = {}, bossesDone = [], seenIntro = true } = {}) {
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player: {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: seenIntro ? { 'bossIntro_gate-01': true } : {},
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
      bossesDone, battles, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
      bossBattleStats: { active: null, history: [] }, bossBattleRatings: { history: [] }, bossBattleRewards: { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } },
      bossAchievements: { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] },
      bossBattleArchive: { version: 1, records: [], archivedBattleIds: [], totals: { totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0, totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0, ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 }, bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null, currentWinStreak: 0, bestWinStreak: 0, updatedAt: null }, bossTotals: {}, difficultyTotals: {}, updatedAt: null },
      dynamicEvent: null, eventCooldowns: {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], ledger: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  } });
}
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(120); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(100); } }
async function enterMap(page) {
  await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000); await clickThroughDialog(page);
}
async function enterBoss(page) {
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(250); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(300); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  await clickThroughDialog(page);
  const c = page.locator('button', { hasText: '继续挑战' }).first(); if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
}
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function newPage(browser, seed) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, seed);
  const page = await ctx.newPage();
  return { ctx, page };
}

(async () => {
  let server = null; let browser = null;
  try {
    server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 30000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(200); }
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });

    console.log('=== 第一轮：Boss 界面 / 失败反击 / 撤退 ===');
    let { ctx, page } = await newPage(browser, makeSave({ seenIntro: false }));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMap(page);
    await page.locator('.node-group').nth(1).click({ force: true }); await sleep(250); await clickThroughDialog(page);
    await clickButton(page, '挑战 ▸'); await sleep(300);
    await page.locator('.cine-root').waitFor({ state: 'visible', timeout: 20000 });
    ok((await textOf(page)).includes('GATE-01'), '首次进入播放 GATE-01 战前演出');
    await clickThroughDialog(page);
    await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 15000 });
    await clickThroughDialog(page);
    const startBtn = page.locator('button', { hasText: '继续挑战' }).first();
    if (await startBtn.isVisible().catch(() => false)) await startBtn.click(); else await clickButton(page, '开始挑战');
    await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 30000 });
    ok(await page.locator('.boss-avatar svg').first().isVisible(), 'Boss 立绘已渲染');
    ok((await textOf(page)).includes('100 / 100'), '血条显示满血 100 / 100');
    ok((await textOf(page)).includes('能源启动程序'), '显示第一阶段');
    ok((await textOf(page)).includes('提交攻击'), '有提交攻击按钮');
    ok((await textOf(page)).includes('判题通过才掉血'), '界面明示判题规则');
    ok((await page.locator('.pip').count()) === 4, '四个阶段刻度');
    ok((await textOf(page)).includes('阶段 1 / 4'), 'HUD 显示阶段 1 / 4');
    await clickButton(page, '提交攻击');
    const tFail = Date.now(); let failSave = null;
    while (Date.now() - tFail < 30000) { failSave = await saveData(page); if (failSave && (failSave.player.consciousness < 100 || (failSave.player.progress.battles || {})['gate-01']?.failures > 0)) break; await sleep(200); }
    ok(!!failSave && !!failSave.player.progress.battles['gate-01'], '战斗进度写入存档');
    ok(failSave.player.consciousness === 97, '失败提交触发 Boss 反击 100 → 97', String(failSave.player.consciousness));
    ok(failSave.player.progress.battles['gate-01'].failures === 1, '战斗失误计数 +1');
    ok(failSave.player.progress.battles['gate-01'].hp === 100, '未通过判题 Boss 不掉血');
    ok(failSave.player.progress.failedAttempts['gate-01'] === 1, '接入原容错计数');
    await clickButton(page, '撤退', '.hud button');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 15000);
    ok((await saveData(page)).player.progress.battles['gate-01'].failures === 1, '撤退后战斗进度仍保存');
    await page.locator('.node-group').nth(1).click({ force: true }); await sleep(250); await clickThroughDialog(page);
    await clickButton(page, '挑战 ▸'); await sleep(250); await clickThroughDialog(page);
    await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 15000 });
    await clickThroughDialog(page);
    const cont = page.locator('button', { hasText: '继续挑战' }).first(); if (await cont.isVisible().catch(() => false)) await cont.click(); else await clickButton(page, '开始挑战');
    await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
    ok((await textOf(page)).includes('战斗失误') && (await textOf(page)).includes('1'), '续战后失误计数保留');
    await ctx.close();

    console.log('=== 第二轮：中局存档续战 ===');
    ({ ctx, page } = await newPage(browser, makeSave({ battles: { 'gate-01': { hp: 42, maxHp: 100, phase: 1, phaseMask: [7, 5, 0, 0], failures: 2, cleared: false, updatedAt: 1 } } })));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMap(page);
    await enterBoss(page);
    ok((await textOf(page)).includes('42 / 100'), '续战显示存档血量 42 / 100');
    ok((await textOf(page)).includes('防御逻辑'), '续战进入第二阶段');
    ok((await textOf(page)).includes('阶段 2 / 4'), 'HUD 阶段 2 / 4');
    ok((await page.locator('.pip.done').count()) === 1, '第一阶段标记已击破');
    await ctx.close();

    console.log('=== 第三轮：已击破 ===');
    ({ ctx, page } = await newPage(browser, makeSave({ bossesDone: ['gate-01'], battles: { 'gate-01': { hp: 0, maxHp: 100, phase: 4, phaseMask: [7, 15, 7, 3], failures: 3, cleared: true, updatedAt: 1 } } })));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMap(page);
    await page.locator('.node-group').nth(1).click({ force: true }); await sleep(250); await clickThroughDialog(page);
    await waitText(page, 'GATE-01', 10000);
    ok((await textOf(page)).includes('已击破'), '地图面板显示已击破');
    ok(!(await page.locator('button', { hasText: '挑战 ▸' }).count()), '已击破后不再提供挑战入口');
    await ctx.close();

    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('Boss Battle E2E ERROR: ' + e.message);
    total++; console.log('FAIL | 流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
