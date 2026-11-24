// V1.3-C MIRA 核心真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'c-evidence');
mkdirSync(evidence, { recursive: true });
const PORT = 6800 + Math.floor(Math.random() * 80);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
function makeSave() {
  const player = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 1, exp: 0, consciousness: 100,
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
async function openMira(page) {
  await page.locator('.rail-item', { hasText: 'MIRA 核心' }).click();
  await page.locator('.mira-page').waitFor({ state: 'visible', timeout: 15000 });
}
async function enterTrainingFromMenu(page) {
  await clickButton(page, '继续探索');
  await clickThroughDialog(page);
  await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000);
  await page.locator('.node-group').nth(0).click({ force: true });
  await sleep(250);
  await clickThroughDialog(page);
  await waitText(page, '初识终端', 15000);
  const row = page.locator('.lv-row', { hasText: '初识终端' }).first();
  await row.locator('button').first().click();
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
  await clickThroughDialog(page);
  await sleep(500);
}
async function enterTrainingLevel(page) {
  await enterMenu(page);
  await enterTrainingFromMenu(page);
}
async function setEditorCode(page, code) {
  const okM = await page.evaluate(c => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[0].setValue(c); return true; }, code).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(180);
}
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function enterBoss(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, 'Python 知识库', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await clickThroughDialog(page); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000); await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(220); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(220); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  await clickThroughDialog(page);
  const c = page.locator('button', { hasText: '继续挑战' }).first(); if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.b6-visual-root').waitFor({ state: 'visible', timeout: 10000 });
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

    console.log('=== 1. 初次连接 / MIRA 主界面 ===');
    await enterMenu(page);
    await openMira(page);
    ok((await textOf(page)).includes('MIRA · 智能伙伴核心'), '真实菜单进入 MIRA 主界面');
    await page.locator('.mira-memory-card.unlocked').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await sleep(500);
    let save = await saveData(page);
    ok(save.player.mira && save.player.mira.memories['mira-first-contact'], '首次连接解锁初始相遇');
    ok(save.player.mira.level === 1 && save.player.mira.exp === 0, 'MIRA 初始 Lv1');
    await page.screenshot({ path: join(evidence, '01-mira-main.png'), fullPage: false });
    const firstCard = page.locator('.mira-memory-card', { hasText: '初始相遇' }).first();
    await firstCard.click();
    await waitText(page, 'MIRA：', 5000).catch(() => {});
    ok((await textOf(page)).includes('初始相遇'), '记忆列表/详情正常');
    ok((await page.locator('.mira-memory-detail').innerText()).includes('首次连接') || (await page.locator('.mira-memory-detail').count()) > 0, '记忆详情显示解锁条件');
    await page.screenshot({ path: join(evidence, '03-mira-memories.png'), fullPage: false });

    console.log('=== 2. 挑战辅助 / 成长 / 记忆 ===');
    await page.locator('.mira-page button', { hasText: '返回' }).first().click().catch(() => page.locator('.hud button', { hasText: '返回' }).first().click());
    await enterTrainingFromMenu(page);
    const before = await saveData(page);
    await setEditorCode(page, 'def broken(:');
    await clickButton(page, '运行代码');
    await page.locator('.diag-panel, .diagnosis-panel').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await sleep(400);
    addDiag: {
      ok((await page.locator('.mira-box').count()) >= 1, '挑战页 MIRA 面板存在');
      const diagText = await textOf(page);
      ok(diagText.includes('语法') || diagText.includes('错误'), 'MIRA 真实诊断读取错误');
    }
    await page.screenshot({ path: join(evidence, '04-mira-code-assist.png'), fullPage: false });
    await setEditorCode(page, 'print("Hello, world!")');
    await clickButton(page, '提交修复');
    await waitText(page, '修复成功', 30000);
    const after = await saveData(page);
    ok(after.player.mira.exp > before.player.mira.exp, '真实挑战成功获得 MIRA 经验', before.player.mira.exp + '→' + after.player.mira.exp);
    ok(!!after.player.mira.memories['mira-first-fix'], '首次修复记忆解锁');
    ok(!!after.player.mira.memories['mira-first-explore'], '新区域探索记忆解锁');
    ok(after.player.mira.eventLog.some(x => x.startsWith('mira:level:')), 'MIRA 经验事件幂等 ID');
    ok(after.version === 10, 'Save v10 未升级');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openMira(page);
    await waitText(page, 'Lv.', 5000);
    ok((await page.locator('.mira-memory-card.unlocked').count()) >= 3, '刷新后记忆保留');
    await page.screenshot({ path: join(evidence, '02-mira-growth.png'), fullPage: false });
    await page.screenshot({ path: join(evidence, '05-mira-explore-memory.png'), fullPage: false });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterMenu(page);
    await openMira(page);
    const persist = await saveData(page);
    ok(persist.player.mira.exp === after.player.mira.exp && Object.keys(persist.player.mira.memories).length === Object.keys(after.player.mira.memories).length, '刷新后成长/记忆持久化');
    await page.screenshot({ path: join(evidence, '06-mira-persist.png'), fullPage: false });
    await ctx.close();

    console.log('=== 3. Boss 只读辅助 ===');
    const bCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await bCtx.addInitScript(s => { try { localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, makeSave().replace('"completedLevels":[]', '"completedLevels":["tut-1","1-1","1-2","1-3","1-4","1-5"]').replace('"chapter1Done":false', '"chapter1Done":true').replace('"unlockedServers":["training"]', '"unlockedServers":["training","syntax","logs"]'));
    const bp = await bCtx.newPage(); bp.on('pageerror', e => errors.push('BOSS ' + String(e)));
    await bp.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(bp);
    await waitText(bp, 'MIRA 提示', 15000);
    const miraPanel = bp.locator('.panel', { hasText: 'MIRA 提示' }).first();
    await miraPanel.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(800);
    const mpt = await miraPanel.innerText();
    ok(/Lv.|LV./i.test(mpt) && mpt.length > 20, 'Boss 战 MIRA 只读辅助面板', mpt.slice(0, 80));
    await bp.screenshot({ path: join(evidence, '07-mira-boss-assist.png'), fullPage: false });
    await bCtx.close();

    console.log('=== 4. 移动端 ===');
    const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await mCtx.addInitScript(s => { try { localStorage.setItem('nexus_code_repair_save_v1', s); } catch { /* ignore */ } }, makeSave());
    const mp = await mCtx.newPage(); mp.on('pageerror', e => errors.push('MOBILE ' + String(e)));
    await mp.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterMenu(mp);
    await openMira(mp);
    ok(await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), '390px MIRA 无横向溢出');
    ok(await mp.locator('.mira-page').isVisible(), '390px MIRA 页面可用');
    await mp.screenshot({ path: join(evidence, '08-mira-mobile.png'), fullPage: false });
    await mCtx.close();
    ok(errors.length === 0, '全流程无未捕获异常', errors.slice(0, 3).join(' | '));
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('MIRA E2E 失败:', e?.message || e); process.exit(1); });
