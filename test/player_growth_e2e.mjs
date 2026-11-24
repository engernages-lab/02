// V1.3-E 玩家成长 / 风险真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'e-evidence');
mkdirSync(evidence, { recursive: true });
const PORT = 7200 + Math.floor(Math.random() * 100);
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
async function clickThroughDialog(page) { for (let i = 0; i < 30; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function enterMenu(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS');
  await waitText(page, '继续探索', 60000);
  await clickThroughDialog(page);
}
async function openProfile(page) {
  await page.locator('.rail-item', { hasText: '玩家档案' }).click();
  await page.locator('.pf-growth-panel').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(350);
}
async function openExplore(page) {
  await page.locator('.rail-item', { hasText: '数字世界探索' }).click();
  await page.locator('.explore-page').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(350);
}
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function setEditorCode(page, code) {
  const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(180);
}

(async () => {
  let dev = null; let browser = null; let page = null;
  try {
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    const t0 = Date.now(); while (Date.now() - t0 < 60000) { try { if ((await fetch('http://127.0.0.1:' + PORT + '/')).ok) break; } catch { /* retry */ } await sleep(300); }
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, makeSave());
    page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });

    console.log('=== 1. 玩家档案 / 成长总览 ===');
    await enterMenu(page);
    await openProfile(page);
    const growthText = await page.locator('.pf-growth-panel').innerText();
    ok(growthText.includes('Lv.1') && growthText.includes('见习硅灵'), '成长总览显示真实等级/称号');
    ok(growthText.includes('容错上限 3') && growthText.includes('NORMAL'), '成长总览显示容错/风险');
    ok(growthText.includes('经验 70'), '成长总览显示真实经验');
    ok((await saveData(page)).player.level === 1, '读取前等级 Lv1');
    await page.screenshot({ path: join(evidence, '01-player-profile.png'), fullPage: false });
    await page.locator('.pf-growth-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(evidence, '02-player-growth.png'), fullPage: false });

    console.log('=== 2. 探索终端 → 真实修复 → 经验 → 升级 ===');
    await clickButton(page, '◀ 返回');
    await openExplore(page);
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(300);
    await page.locator('.explore-event-card', { hasText: '损坏的数据终端' }).first().locator('button', { hasText: '接入真实修复挑战' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    ok(await page.locator('.hud-chip.risk-normal').first().isVisible(), '挑战 HUD 显示真实 NORMAL 风险');
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(600);
    ok((await textOf(page)).includes('等级提升 Lv.1 → Lv.2') || (await textOf(page)).includes('Lv.2'), '结算显示升级反馈');
    await page.screenshot({ path: join(evidence, '03-level-up.png'), fullPage: false });
    const afterLevel = await saveData(page);
    ok(afterLevel.player.level === 2 && afterLevel.player.exp === 110, '挑战 +40 XP → Lv2 / 110 XP', JSON.stringify({ l: afterLevel.player.level, e: afterLevel.player.exp }));
    ok(afterLevel.player.progress.achievements.includes('first_repair'), '首次修复成就真实解锁');
    ok(afterLevel.player.progress.achievements.includes('training_done'), '接驳完成成就真实解锁');
    ok(afterLevel.player.mira.exp > 0, '真实挑战产生 MIRA 经验');
    ok(afterLevel.version === 10, 'Save v10 未升级');

    console.log('=== 3. 连续失败 → 风险 → 容错 → 重复经验防护 ===');
    await clickButton(page, '返回地图');
    await sleep(800);
    await clickThroughDialog(page);
    await sleep(500);
    await clickThroughDialog(page);
    await page.locator('.node-group').first().dispatchEvent('click'); await sleep(500);
    await clickThroughDialog(page);
    await sleep(300);
    const replayRow = page.locator('.lv-row').first();
    await replayRow.locator('button', { hasText: '重玩' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    const expBeforeReplay = (await saveData(page)).player.exp;
    await setEditorCode(page, 'print("definitely wrong output")');
    await clickButton(page, '提交修复');
    await waitText(page, '测试未全部通过', 30000);
    await sleep(500);
    const riskChip = page.locator('.hud-chip.risk-warning, .hud-chip.risk-danger').first();
    ok(await riskChip.isVisible(), '失败后 HUD 风险进入 WARNING/DANGER');
    ok((await riskChip.innerText()).includes('WARNING') || (await riskChip.innerText()).includes('DANGER'), '风险文案来自真实容错');
    await page.screenshot({ path: join(evidence, '04-risk-status.png'), fullPage: false });
    const afterFail = await saveData(page);
    ok((afterFail.player.progress.failedAttempts['tut-1'] || 0) >= 1, '失败次数真实记录');
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(500);
    const afterReplay = await saveData(page);
    ok(afterReplay.player.exp === expBeforeReplay && afterReplay.player.level === 2, '重玩通关不重复发放玩家经验/不跳级');

    console.log('=== 4. 探索联动 → 成就 ===');
    await clickButton(page, '返回地图');
    await clickButton(page, '主菜单');
    await openExplore(page);
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(300);
    const sig = page.locator('.explore-event-card', { hasText: '未知数据残留' }).first();
    if (!(await sig.innerText()).includes('已完成')) { await sig.locator('button', { hasText: '调查异常' }).click(); await sleep(400); }
    const ruin = page.locator('.explore-event-card', { hasText: '初代核心档案' }).first();
    if (!(await ruin.innerText()).includes('已完成')) { await ruin.locator('button', { hasText: '调查遗迹' }).click(); await sleep(400); }
    const hidden = page.locator('.explore-event-card', { hasText: '不属于当前服务器的数据回声' }).first();
    await hidden.waitFor({ state: 'visible', timeout: 10000 });
    await hidden.locator('button', { hasText: '追踪隐藏信号' }).click(); await sleep(600);
    const afterHidden = await saveData(page);
    ok(!!afterHidden.player.progress.exploration.hidden['hidden:training:echo'], '隐藏信号真实归档');
    ok(afterHidden.player.progress.achievements.includes('explorer_first'), '探索者成就来自真实区域完成');
    ok(afterHidden.player.progress.achievements.includes('hidden_signal'), '数据追踪者成就来自真实隐藏信号');
    ok(afterHidden.player.mira.exp > afterLevel.player.mira.exp, '探索奖励进入 MIRA');
    await page.screenshot({ path: join(evidence, '06-exploration-growth.png'), fullPage: false });

    console.log('=== 5. 成就页 / 成长档案 ===');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await page.locator('.rail-item', { hasText: '成就系统' }).click();
    await waitText(page, '成就系统', 15000);
    await sleep(400);
    const achText = await textOf(page);
    ok(achText.includes('探索者') && achText.includes('数据追踪者'), '成就页显示新解锁成就');
    ok(achText.includes('首次修复') && achText.includes('接驳完成'), '挑战成就保留');
    ok((await page.locator('.ach-card.unlocked').count()) >= 4, '至少 4 个真实成就已解锁');
    await page.screenshot({ path: join(evidence, '05-achievements.png'), fullPage: false });
    await page.locator('button', { hasText: '◀ 返回' }).click();
    await openProfile(page);
    const growth2 = await page.locator('.pf-growth-panel').innerText();
    ok(growth2.includes('Lv.2') && /已完成区域\s*1/.test(growth2), '成长总览同步探索区域');
    ok(growth2.includes('MIRA Lv.'), '成长总览同步 MIRA 等级');
    await page.locator('.pf-growth-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(evidence, '06-exploration-growth.png'), fullPage: false });

    console.log('=== 6. 移动端 / 持久化 ===');
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await sleep(300);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), width + 'px 档案无横向溢出');
      ok(await page.locator('.pf-growth-panel').isVisible(), width + 'px 成长总览可见');
      if (width === 390) await page.screenshot({ path: join(evidence, '07-mobile.png'), fullPage: false });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openProfile(page);
    const persisted = await saveData(page);
    const persistedGrowth = await page.locator('.pf-growth-panel').innerText();
    ok(persisted.player.level === 2 && persisted.player.exp === 110, '刷新后等级/经验保留');
    ok(persistedGrowth.includes('Lv.2') && /已完成区域\s*1/.test(persistedGrowth), '刷新后成长总览保留');
    ok(persisted.player.progress.achievements.includes('hidden_signal'), '刷新后成就保留');
    ok(persisted.player.progress.exploration.hidden['hidden:training:echo'], '刷新后探索档案保留');
    ok(persisted.version === 10, '持久化后 Save v10');
    await page.screenshot({ path: join(evidence, '08-persistence.png'), fullPage: false });
    await page.addInitScript(() => {
      try {
        const s = JSON.parse(localStorage.getItem('nexus_code_repair_save_v1') || 'null');
        if (s && s.player) { s.player.consciousness = 30; localStorage.setItem('nexus_code_repair_save_v1', JSON.stringify(s)); }
      } catch { /* ignore */ }
    });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openProfile(page);
    const dangerText = await page.locator('.pf-risk').innerText();
    ok(dangerText.includes('DANGER'), '真实低意识（30%）→ 档案 DANGER', dangerText);
    ok((await textOf(page)).includes('危险'), '档案展示 DANGER 真实提示');
    ok(errors.length === 0, '全流程无未捕获异常', errors.slice(0, 3).join(' | '));

    console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  } catch (e) {
    console.log('E2E ERROR: ' + e.message);
    if (typeof page !== 'undefined') {
      console.log('DEBUG dialog: ' + await page.locator('.dlg-root').first().innerText().catch(() => 'none'));
      await page.screenshot({ path: join(evidence, 'debug-dialog.png') }).catch(() => {});
    }
    total++; console.log('FAIL | 流程中断 => ' + e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (dev) dev.kill();
  }
  process.exit(pass === total ? 0 : 1);
})();
