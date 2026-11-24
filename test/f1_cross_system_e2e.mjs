// V1.3-F.1 跨系统真实浏览器 E2E：Challenge / Explore / Growth / Ledger / Refresh
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'f1-evidence');
mkdirSync(evidence, { recursive: true });
const PORT = 7800 + Math.floor(Math.random() * 80);
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

    console.log('=== 1. Explore 地图 / 终端 ===');
    await enterMenu(page);
    await openExplore(page);
    ok((await page.locator('.explore-node').count()) === 7, '七个真实区域');
    await page.screenshot({ path: join(evidence, '05-explore.png'), fullPage: false });
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(300);
    const sig = page.locator('.explore-event-card', { hasText: '未知数据残留' }).first();
    if (!(await sig.innerText()).includes('已完成')) { await sig.locator('button', { hasText: '调查异常' }).click(); await sleep(400); }
    const ruin = page.locator('.explore-event-card', { hasText: '初代核心档案' }).first();
    if (!(await ruin.innerText()).includes('已完成')) { await ruin.locator('button', { hasText: '调查遗迹' }).click(); await sleep(400); }
    await page.locator('.explore-event-card', { hasText: '损坏的数据终端' }).first().locator('button', { hasText: '接入真实修复挑战' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    const before = await saveData(page);
    ok(before.player.rewards.credits === 13, '信号 + 遗迹已真实入账（13 贡献点）');

    console.log('=== 2. Explore 失败不完成节点 ===');
    await setEditorCode(page, 'print("wrong")');
    await clickButton(page, '提交修复');
    await waitText(page, '测试未全部通过', 30000);
    await sleep(400);
    const afterFail = await saveData(page);
    ok(!afterFail.player.progress.exploration.events['terminal:training'], '失败不完成探索终端');
    ok(afterFail.player.rewards.credits === before.player.rewards.credits, '失败不发探索奖励');
    ok(afterFail.player.progress.failedAttempts['tut-1'] >= 1, '真实失败计数');
    ok(!!afterFail.player.progress.exploration.pendingChallenge, 'pendingChallenge 保留以支持重试');

    console.log('=== 3. Explore 成功 / Challenge 首通 ===');
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(600);
    const settleText = await page.locator('.ov-result').innerText();
    await page.screenshot({ path: join(evidence, '01-challenge-success.png'), fullPage: false });
    const afterWin = await saveData(page);
    ok(afterWin.player.level === 2 && afterWin.player.exp === 110, '挑战首通 +40 XP → Lv2 / 110');
    ok(afterWin.player.progress.exploration.events['terminal:training']?.status === 'completed', '成功完成探索终端');
    ok(afterWin.player.progress.exploration.events['signal:training']?.status === 'completed' && afterWin.player.progress.exploration.ruins['ruin:training'], '区域信号/遗迹状态保留');
    ok(afterWin.player.progress.achievements.includes('first_repair'), '首通解锁首次修复');
    ok(afterWin.player.progress.achievements.includes('training_done'), '首通解锁接驳完成');
    ok(afterWin.player.progress.achievements.includes('explorer_first'), '终端完成区域 → 探索者真实解锁');
    ok(settleText.includes('探索者'), 'F.2 修复：结算列表包含终端后解锁的探索者');
    ok(afterWin.player.rewards.credits > before.player.rewards.credits, '真实贡献点入账');
    ok(afterWin.player.rewards.ledger.some(x => x.kind === 'exploration' && x.ref === 'terminal:training'), '探索奖励进入现有账本');
    ok(afterWin.player.mira.exp > 0, '真实挑战产生 MIRA XP');
    ok(afterWin.version === 10, 'Save v10');

    console.log('=== 4. Challenge 重复通关 ===');
    await clickButton(page, '返回地图');
    await sleep(800); await clickThroughDialog(page); await sleep(500); await clickThroughDialog(page);
    await page.locator('.node-group').first().dispatchEvent('click'); await sleep(500);
    await clickThroughDialog(page); await sleep(300);
    await page.locator('.lv-row').first().locator('button', { hasText: '重玩' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    const expBefore = (await saveData(page)).player.exp;
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(500);
    const afterRepeat = await saveData(page);
    ok(afterRepeat.player.exp === expBefore && afterRepeat.player.level === 2, '重复通关不重复发玩家经验/不跳级');
    ok(afterRepeat.player.progress.exploration.events['terminal:training']?.status === 'completed', '重复挑战不破坏探索节点');
    await clickButton(page, '返回地图'); await clickThroughDialog(page); await sleep(300);
    await clickButton(page, '主菜单'); await waitText(page, '继续探索', 15000);

    console.log('=== 5. Profile / MIRA / Achievement ===');
    await openProfile(page);
    const growth = await page.locator('.pf-growth-panel').innerText();
    ok(growth.includes('Lv.2') && growth.includes('经验 110'), '成长总览读取真实 Lv2 / 110 XP');
    ok(growth.includes('NORMAL'), '成长总览风险来自真实状态');
    ok((await page.locator('.pf-recent-row').count()) >= 1, '最近成长显示真实流水');
    await page.screenshot({ path: join(evidence, '02-player-growth.png'), fullPage: false });
    await backMenu(page);
    await page.locator('.rail-item', { hasText: 'MIRA 核心' }).click();
    await waitText(page, 'MIRA', 15000); await sleep(400);
    ok((await textOf(page)).includes('记忆') || (await textOf(page)).includes('成长'), 'MIRA 页面可见');
    await page.screenshot({ path: join(evidence, '03-mira.png'), fullPage: false });
    await backMenu(page);
    await page.locator('.rail-item', { hasText: '成就系统' }).click();
    await waitText(page, '成就系统', 15000); await sleep(400);
    const achText = await textOf(page);
    ok(achText.includes('首次修复') && achText.includes('接驳完成'), '成就页显示真实解锁');
    await page.screenshot({ path: join(evidence, '04-achievement.png'), fullPage: false });
    await backMenu(page);

    console.log('=== 6. Exploration → Growth / 隐藏信号 ===');
    await openExplore(page);
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(300);
    const hidden = page.locator('.explore-event-card', { hasText: '不属于当前服务器的数据回声' }).first();
    await hidden.waitFor({ state: 'visible', timeout: 10000 });
    await hidden.locator('button', { hasText: '追踪隐藏信号' }).click(); await sleep(600);
    await page.screenshot({ path: join(evidence, '06-exploration-reward.png'), fullPage: false });
    const afterExplore = await saveData(page);
    ok(!!afterExplore.player.progress.exploration.hidden['hidden:training:echo'], '隐藏信号真实归档');
    ok(afterExplore.player.progress.achievements.includes('explorer_first'), '探索者成就真实解锁');
    ok(afterExplore.player.progress.achievements.includes('hidden_signal'), '数据追踪者成就真实解锁');
    ok(afterExplore.player.rewards.ledger.filter(x => x.kind === 'exploration').length >= 3, '探索流水真实累积');

    console.log('=== 7. Refresh / Ledger / P2 修复验证 ===');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openProfile(page);
    const persisted = await saveData(page);
    const persistedGrowth = await page.locator('.pf-growth-panel').innerText();
    const ledgerText = await page.locator('.pf-recent').innerText();
    ok(persisted.player.level === 2 && persisted.player.exp === 110, '刷新后等级/经验保持');
    ok(persisted.player.progress.exploration.hidden['hidden:training:echo'], '刷新后隐藏信号保持');
    ok(persisted.player.progress.achievements.includes('hidden_signal'), '刷新后成就保持');
    ok(persisted.player.rewards.ledger.some(x => x.kind === 'exploration'), '刷新后探索流水仍存在（P2-01）');
    ok(ledgerText.includes('exploration'), 'Profile 最近成长显示探索流水');
    ok(/已完成区域\s*1/.test(persistedGrowth), '成长总览刷新后区域进度保持');
    await page.screenshot({ path: join(evidence, '07-exploration-ledger.png'), fullPage: false });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openProfile(page);
    ok((await page.locator('.pf-growth-panel').innerText()).includes('Lv.2'), '二次刷新恢复成长');
    await page.screenshot({ path: join(evidence, '10-refresh-recovery.png'), fullPage: false });

    console.log('=== 8. Mobile ===');
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await sleep(300);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), width + 'px 无横向溢出');
      ok(await page.locator('.pf-growth-panel').isVisible(), width + 'px 成长面板可见');
      if (width === 390) await page.screenshot({ path: join(evidence, '11-mobile.png'), fullPage: false });
    }
    ok(errors.length === 0, '全流程无未捕获异常', errors.slice(0, 3).join(' | '));

    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('F.1 E2E ERROR: ' + e.message);
    total++; console.log('FAIL | 流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (dev) dev.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
