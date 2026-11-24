// V1.3-F.2 Challenge 边缘 E2E：空代码 / 非法代码 / 退出刷新 / 未解锁区域
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
mkdirSync(join(root, '.tmp', 'f2-evidence'), { recursive: true });
const PORT = 8300 + Math.floor(Math.random() * 70);
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
      exploration: { version: 1, events: {}, ruins: {}, hidden: {}, rewardsClaimed: [], discoveredRegions: [], pendingChallenge: null, archive: [], updatedAt: 1 },
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], ledger: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(150); } throw new Error('text timeout: ' + text); }
async function waitAny(page, texts, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const t = await textOf(page); if (texts.some(x => t.includes(x))) return t; await sleep(150); } throw new Error('texts timeout: ' + texts.join(',')); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function enterMenu(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, '继续探索', 60000); await clickThroughDialog(page);
}
async function setEditorCode(page, code) {
  const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(180);
}
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }

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
    await enterMenu(page);
    await clickButton(page, '继续探索');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000);
    await clickThroughDialog(page);
    await page.locator('.node-group').first().dispatchEvent('click'); await sleep(500);
    await clickThroughDialog(page); await sleep(300);
    const enter = page.locator('.lv-row').first().locator('button').first();
    await enter.click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    const baseline = await saveData(page);
    ok(baseline.player.exp === 70 && baseline.player.rewards.credits === 0, '挑战前经验/贡献点基线');

    console.log('=== 1. 空代码 ===');
    await setEditorCode(page, '');
    await clickButton(page, '提交修复');
    await waitAny(page, ['测试未全部通过', '执行出错', '判题超时'], 30000);
    await sleep(300);
    const afterEmpty = await saveData(page);
    ok(!afterEmpty.player.progress.completedLevels.includes('tut-1'), '空代码不完成挑战');
    ok(afterEmpty.player.exp === 70 && afterEmpty.player.rewards.credits === 0, '空代码不加经验/贡献点');
    ok(afterEmpty.player.progress.failedAttempts['tut-1'] === 1, '空代码记录 1 次失败');
    ok(!afterEmpty.player.progress.challengeSessions['tut-1'].settlement, '空代码不产生通过结算');

    console.log('=== 2. 非法代码 ===');
    await setEditorCode(page, 'print(');
    await clickButton(page, '提交修复');
    await waitAny(page, ['测试未全部通过', '执行出错', '判题超时'], 30000);
    await sleep(300);
    const afterIllegal = await saveData(page);
    ok(!afterIllegal.player.progress.completedLevels.includes('tut-1'), '非法代码不完成挑战');
    ok(afterIllegal.player.exp === 70 && afterIllegal.player.rewards.credits === 0, '非法代码不加经验/贡献点');
    ok(afterIllegal.player.progress.failedAttempts['tut-1'] === 2, '非法代码累计失败 2 次');
    ok(afterIllegal.player.progress.challengeSessions['tut-1'].status === 'active', '连续失败后会话仍 active');

    console.log('=== 3. 退出 / Refresh ===');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    const afterRefresh = await saveData(page);
    ok(!afterRefresh.player.progress.completedLevels.includes('tut-1'), '刷新后仍未误完成挑战');
    ok(afterRefresh.player.exp === 70 && afterRefresh.player.rewards.credits === 0, '刷新后不伪造奖励');
    ok(afterRefresh.player.progress.failedAttempts['tut-1'] === 2, '刷新后失败计数保留');
    await page.locator('.rail-item', { hasText: '玩家档案' }).click();
    await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
    ok((await page.locator('.pf-growth-panel').innerText()).includes('Lv.1'), '刷新后档案仍为真实 Lv1');

    console.log('=== 4. 未解锁区域 ===');
    await page.locator('button', { hasText: '◀ 返回' }).first().click();
    await waitText(page, '继续探索', 15000);
    await page.locator('.rail-item', { hasText: '数字世界探索' }).click();
    await page.locator('.explore-page').waitFor({ state: 'visible', timeout: 15000 });
    const locked = page.locator('.explore-node.status-locked').first();
    await locked.click(); await sleep(300);
    const detail = await page.locator('.explore-detail').innerText();
    ok(detail.includes('未解锁') || (await textOf(page)).includes('区域未解锁'), '未解锁区域不可开始挑战');
    ok(errors.length === 0, '边缘流程无未捕获异常', errors.slice(0, 3).join(' | '));

    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.2 Challenge E2E ERROR: ' + e.message);
    total++; console.log('FAIL | 流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (dev) dev.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
