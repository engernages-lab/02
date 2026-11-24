// V1.3-F.2 稳定性 E2E：结算成就一致性 / Error Boundary / 刷新 / 移动端
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'f2-evidence');
mkdirSync(evidence, { recursive: true });
const PORT = 8200 + Math.floor(Math.random() * 70);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
function makeSave() {
  const player = {
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
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(150); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 35; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function enterMenu(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS');
  await waitText(page, '继续探索', 60000);
  await clickThroughDialog(page);
}
async function openExplore(page) {
  await page.locator('.rail-item', { hasText: '数字世界探索' }).click();
  await page.locator('.explore-page').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(350);
}
async function openProfile(page) {
  await page.locator('.rail-item', { hasText: '玩家档案' }).click();
  await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(350);
}
async function backMenu(page) {
  const b = page.locator('button', { hasText: '◀ 返回' }).first();
  if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  await waitText(page, '继续探索', 15000);
  await sleep(250);
}
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function setEditorCode(page, code) {
  const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(180);
}

(async () => {
  let dev = null; let browser = null;
  try {
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 60000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(300); }
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, makeSave());
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });

    console.log('=== 1. 主菜单 / Explore ===');
    await enterMenu(page);
    await page.screenshot({ path: join(evidence, '01-main-menu.png'), fullPage: false });
    await openExplore(page);
    await page.screenshot({ path: join(evidence, '04-explore.png'), fullPage: false });
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(300);
    const sig = page.locator('.explore-event-card', { hasText: '未知数据残留' }).first();
    if (!(await sig.innerText()).includes('已完成')) { await sig.locator('button', { hasText: '调查异常' }).click(); await sleep(350); }
    const ruin = page.locator('.explore-event-card', { hasText: '初代核心档案' }).first();
    if (!(await ruin.innerText()).includes('已完成')) { await ruin.locator('button', { hasText: '调查遗迹' }).click(); await sleep(350); }

    console.log('=== 2. F.2-A 结算新成就 ===');
    await page.locator('.explore-event-card', { hasText: '损坏的数据终端' }).first().locator('button', { hasText: '接入真实修复挑战' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(900);
    const fullText = await textOf(page);
    const settleText = await page.locator('.ov-result').innerText();
    ok(settleText.includes('探索者'), '结算 newAchievements 包含探索者');
    ok(fullText.includes('成就解锁：探索者'), 'Toast 显示探索者');
    await page.screenshot({ path: join(evidence, '02-challenge-settlement.png'), fullPage: false });
    await page.locator('.ov-result').screenshot({ path: join(evidence, '03-achievement-settlement.png') }).catch(async () => {
      await page.screenshot({ path: join(evidence, '03-achievement-settlement.png'), fullPage: false });
    });
    const afterFirst = await saveData(page);
    ok(afterFirst.player.progress.achievements.includes('explorer_first'), '档案状态真实解锁探索者');
    ok(afterFirst.player.mira.eventLog.filter(e => e === 'mira:achievement:explorer_first').length === 1, '成就 MIRA 奖励事件只记录一次');
    const miraAfterFirst = afterFirst.player.mira.exp;
    ok(afterFirst.player.level === 2 && afterFirst.player.exp === 110, '真实首通经验 Lv2 / 110');
    ok(afterFirst.version === 10, 'Save v10');

    console.log('=== 3. 重复完成不重复成就 ===');
    await clickButton(page, '返回地图');
    await sleep(800); await clickThroughDialog(page); await sleep(500); await clickThroughDialog(page);
    await page.locator('.node-group').first().dispatchEvent('click'); await sleep(500);
    await clickThroughDialog(page); await sleep(300);
    await page.locator('.lv-row').first().locator('button', { hasText: '重玩' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(700);
    const repeatSettle = await page.locator('.ov-result').innerText();
    const afterRepeat = await saveData(page);
    ok(!repeatSettle.includes('探索者'), '已解锁成就不再次出现在新成就列表');
    ok(afterRepeat.player.mira.exp === miraAfterFirst, '重复完成不重复 MIRA 经验');
    ok(afterRepeat.player.mira.eventLog.filter(e => e === 'mira:achievement:explorer_first').length === 1, '重复完成不重复成就奖励事件');
    ok(afterRepeat.player.exp === 110 && afterRepeat.player.level === 2, '重复完成不重复玩家经验/不跳级');
    await clickButton(page, '返回地图'); await clickThroughDialog(page); await sleep(300);
    await clickButton(page, '主菜单'); await waitText(page, '继续探索', 15000);

    console.log('=== 4. Achievement / Profile / MIRA ===');
    await page.locator('.rail-item', { hasText: '成就系统' }).click();
    await waitText(page, '成就系统', 15000); await sleep(350);
    ok((await textOf(page)).includes('探索者'), '成就页显示探索者');
    await backMenu(page);
    await page.locator('.rail-item', { hasText: 'MIRA 核心' }).click();
    await waitText(page, 'MIRA', 15000); await sleep(400);
    await page.screenshot({ path: join(evidence, '05-mira.png'), fullPage: false });
    await backMenu(page);
    await openProfile(page);
    await page.screenshot({ path: join(evidence, '07-profile-growth.png'), fullPage: false });
    ok((await page.locator('.pf-growth-panel').innerText()).includes('Lv.2'), 'Profile 成长总览显示 Lv2');

    console.log('=== 5. Error Boundary / Recovery ===');
    await page.goto('http://127.0.0.1:' + PORT + '/?crash=1', { waitUntil: 'commit', timeout: 60000 });
    await page.locator('.eb-root').waitFor({ state: 'visible', timeout: 15000 });
    ok((await page.locator('.eb-code').innerText()).includes('SYSTEM FAILURE'), 'Error Boundary 真实显示');
    ok((await page.locator('.eb-actions button').count()) >= 3, 'Error Boundary 提供重试/菜单/重启');
    await page.screenshot({ path: join(evidence, '08-error-boundary.png'), fullPage: false });
    await clickButton(page, '重新加载模块');
    await waitText(page, 'ENTER NEXUS', 60000);
    ok(true, 'Error Boundary 重新加载模块有效');
    await page.goto('http://127.0.0.1:' + PORT + '/?crash=1', { waitUntil: 'commit', timeout: 60000 });
    await page.locator('.eb-root').waitFor({ state: 'visible', timeout: 15000 });
    await clickButton(page, '返回主菜单');
    await waitText(page, '继续探索', 30000);
    ok((await page.locator('.rail-item').count()) > 0, 'Error Boundary 返回主菜单有效');
    await page.screenshot({ path: join(evidence, '09-error-recovery.png'), fullPage: false });
    await page.goto('http://127.0.0.1:' + PORT + '/?crash=1', { waitUntil: 'commit', timeout: 60000 });
    await page.locator('.eb-root').waitFor({ state: 'visible', timeout: 15000 });
    await clickButton(page, '重新启动系统');
    await waitText(page, 'ENTER NEXUS', 60000);
    ok(true, 'Error Boundary 重新启动系统有效');

    console.log('=== 6. Refresh / Mobile ===');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openProfile(page);
    const refreshed = await saveData(page);
    ok(refreshed.player.progress.achievements.includes('explorer_first'), 'Refresh 后探索者保留');
    ok(refreshed.player.mira.exp === miraAfterFirst, 'Refresh 后 MIRA 经验保留');
    ok(refreshed.player.progress.exploration.events['terminal:training']?.status === 'completed', 'Refresh 后探索终端保留');
    ok(refreshed.version === 10, 'Refresh 后 Save v10');
    await page.screenshot({ path: join(evidence, '12-refresh-recovery.png'), fullPage: false });
    for (const width of [390, 360, 430, 768]) {
      await page.setViewportSize({ width, height: 844 }); await sleep(300);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), width + 'px 无横向溢出');
      ok(await page.locator('.pf-growth-panel').isVisible(), width + 'px 成长面板可见');
      if (width === 390 || width === 360) {
        await page.screenshot({ path: join(evidence, width === 390 ? '10-mobile-390.png' : '11-mobile-360.png'), fullPage: false });
      }
    }
    const unexpectedErrors = errors.filter(e => !e.includes('NEXUS_DEV_CRASH_PROBE'));
    ok(unexpectedErrors.length === 0, '业务全流程无非预期异常', unexpectedErrors.slice(0, 3).join(' | '));

    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.2 E2E ERROR: ' + e.message);
    total++; console.log('FAIL | 流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (dev) dev.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
