// V1.3-D 数字世界探索真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'd-evidence');
mkdirSync(evidence, { recursive: true });
const PORT = 7000 + Math.floor(Math.random() * 80);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave(opts = {}) {
  const player = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 1, exp: 0, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: opts.completed || [], stars: {}, unlockedServers: opts.servers || ['training'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: {},
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, ...(opts.flags || {}) },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
      bossBattleStats: { active: null, history: [] }, bossBattleRatings: { history: [] }, bossBattleRewards: { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } },
      bossAchievements: { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] },
      bossBattleArchive: { version: 1, records: [], archivedBattleIds: [], totals: { totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0, totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0, ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 }, bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null, currentWinStreak: 0, bestWinStreak: 0, updatedAt: null }, bossTotals: {}, difficultyTotals: {}, updatedAt: null },
      dynamicEvent: null, eventCooldowns: {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
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
async function openExplore(page) {
  await page.locator('.rail-item', { hasText: '数字世界探索' }).click();
  await page.locator('.explore-page').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(400);
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

    console.log('=== 1. 世界地图 / 区域详情 ===');
    await enterMenu(page);
    await openExplore(page);
    ok((await textOf(page)).includes('数字世界探索'), '真实菜单进入数字世界探索');
    ok((await page.locator('.explore-node').count()) === 7, '七个真实服务器区域');
    ok((await page.locator('.explore-node.status-locked').count()) >= 1, '未解锁区域显示锁定');
    await page.screenshot({ path: join(evidence, '01-world-map.png'), fullPage: false });
    const trainingNode = page.locator('.explore-node', { hasText: '新人训练终端' }).first();
    await trainingNode.click();
    await sleep(300);
    ok((await page.locator('.explore-detail').innerText()).includes('新人训练终端'), '区域详情正常');
    await page.screenshot({ path: join(evidence, '02-region-detail.png'), fullPage: false });
    const lockedNode = page.locator('.explore-node.status-locked').first();
    await lockedNode.click(); await sleep(200);
    ok((await page.locator('.explore-detail').innerText()).includes('未解锁') || (await textOf(page)).includes('区域未解锁'), '未解锁区域不能进入');
    await trainingNode.click(); await sleep(300);

    console.log('=== 2. 探索事件 / 遗迹 ===');
    const signalCard = page.locator('.explore-event-card', { hasText: '未知数据残留' }).first();
    const signalText = await signalCard.innerText();
    ok(signalText.includes('已发现') || signalText.includes('可调查'), '发现异常数据残留');
    await signalCard.locator('button', { hasText: '调查异常' }).click();
    await sleep(400);
    ok((await page.locator('.explore-event-card', { hasText: '未知数据残留' }).innerText()).includes('已完成'), '异常事件完成');
    await page.screenshot({ path: join(evidence, '03-exploration-event.png'), fullPage: false });
    const ruinCard = page.locator('.explore-event-card', { hasText: '初代核心档案' }).first();
    await ruinCard.locator('button', { hasText: '调查遗迹' }).click();
    await sleep(400);
    ok((await ruinCard.innerText()).includes('已完成'), '数据遗迹调查完成');
    await page.screenshot({ path: join(evidence, '05-data-ruin.png'), fullPage: false });
    const afterExplore = await saveData(page);
    ok(afterExplore.player.progress.exploration.events['signal:training'].status === 'completed', '探索状态写入存档');
    ok(afterExplore.player.progress.exploration.ruins['ruin:training'], '遗迹状态写入存档');

    console.log('=== 3. 真实代码修复挑战 ===');
    const terminalCard = page.locator('.explore-event-card', { hasText: '损坏的数据终端' }).first();
    await terminalCard.locator('button', { hasText: '接入真实修复挑战' }).click();
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await clickThroughDialog(page);
    await page.screenshot({ path: join(evidence, '04-terminal-repair.png'), fullPage: false });
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    await sleep(300);
    const afterChallenge = await saveData(page);
    ok(afterChallenge.player.progress.exploration.events['terminal:training']?.status === 'completed', '真实挑战成功完成终端节点');
    ok(afterChallenge.player.rewards.credits > afterExplore.player.rewards.credits, '探索奖励进入现有经济');
    ok(afterChallenge.player.mira.exp > afterExplore.player.mira.exp, '探索奖励产生 MIRA 经验');
    ok(afterChallenge.version === 10, 'Save v10');

    console.log('=== 4. 隐藏事件 / 档案 / 持久化 ===');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openExplore(page);
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(400);
    const hiddenCard = page.locator('.explore-event-card', { hasText: '不属于当前服务器的数据回声' }).first();
    ok(await hiddenCard.isVisible(), '区域完成 → 隐藏信号出现');
    await hiddenCard.locator('button', { hasText: '追踪隐藏信号' }).click();
    await sleep(500);
    ok((await hiddenCard.innerText()).includes('已完成'), '隐藏信号完成');
    await page.screenshot({ path: join(evidence, '06-hidden-event.png'), fullPage: false });
    const afterHidden = await saveData(page);
    ok(afterHidden.player.progress.exploration.hidden['hidden:training:echo'], '隐藏档案写入');
    await clickButton(page, '探索档案');
    await sleep(200);
    ok((await page.locator('.explore-archive').innerText()).includes('总探索进度'), '探索档案显示真实进度');
    await page.screenshot({ path: join(evidence, '07-exploration-archive.png'), fullPage: false });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openExplore(page);
    await clickButton(page, '探索档案');
    await sleep(300);
    const persisted = await saveData(page);
    ok(persisted.player.progress.exploration.hidden['hidden:training:echo'], '刷新后隐藏/进度保留');
    await page.screenshot({ path: join(evidence, '09-persistence.png'), fullPage: false });

    console.log('=== 5. 重复 / 移动端 / Reduced Motion ===');
    await clickButton(page, '区域地图'); await sleep(200);
    await page.locator('.explore-node', { hasText: '新人训练终端' }).first().click(); await sleep(300);
    const creditsBefore = (await saveData(page)).player.rewards.credits;
    const sigDone = page.locator('.explore-event-card', { hasText: '未知数据残留' }).first().locator('button').first();
    ok(await sigDone.isDisabled(), '已完成节点不可重复领奖');
    for (const width of [360, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await sleep(250);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), width + 'px 探索页无横向溢出');
      ok(await page.locator('.explore-node').first().isVisible(), width + 'px 地图节点可见');
      if (width === 390) await page.screenshot({ path: join(evidence, '08-mobile.png'), fullPage: false });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openExplore(page);
    ok(await page.locator('.explore-page').isVisible(), 'Reduced Motion 下探索可用');
    ok((await saveData(page)).player.rewards.credits === creditsBefore, '重复查看不增加奖励');
    ok(errors.length === 0, '全流程无未捕获异常', errors.slice(0, 3).join(' | '));
    await ctx.close();

    console.log('=== 6. 第二遗迹（真实区域）===');
    const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c2.addInitScript(s => { try { localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, makeSave({ completed: CH1, servers: ['training', 'syntax', 'logs'], flags: { chapter1Done: true } }));
    const p2 = await c2.newPage(); p2.on('pageerror', e => errors.push('R2 ' + String(e)));
    await p2.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMenu(p2);
    await openExplore(p2);
    await p2.locator('.explore-node', { hasText: '语法维修站' }).first().click();
    await sleep(400);
    const ruin2 = p2.locator('.explore-event-card', { hasText: '被封锁的记忆节点' }).first();
    ok(await ruin2.isVisible(), '第二遗迹在真实语法区域可见');
    await ruin2.locator('button', { hasText: '调查遗迹' }).click(); await sleep(300);
    ok((await ruin2.innerText()).includes('已完成'), '第二遗迹调查完成');
    await c2.close();
    ok(errors.length === 0, '第二遗迹流程无未捕获异常', errors.slice(0, 3).join(' | '));
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('探索 E2E 失败:', e?.message || e); process.exit(1); });
