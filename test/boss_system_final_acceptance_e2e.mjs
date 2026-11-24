// V1.3-B.7 Boss 系统最终验收：真实玩家完整流程
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b7-evidence');
mkdirSync(evidence, { recursive: true });
const DEV_PORT = 7600 + Math.floor(Math.random() * 60);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, total = 0;
const ok = (c, l, e = '') => { total++; if (c) { pass++; console.log('PASS | ' + l); } else console.log('FAIL | ' + l + (e ? '  => ' + e : '')); };
const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave() {
  const player = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [], storySeen: { 'bossIntro_gate-01': true },
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {}, bossBattleStats: { active: null, history: [] }, bossBattleRatings: { history: [] }, bossBattleRewards: { history: [], grantedBattleIds: [], totalGranted: { xp: 0, contribution: 0, fragments: 0 } }, bossAchievements: { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] }, bossBattleArchive: { version: 1, records: [], archivedBattleIds: [], totals: { totalBattles: 0, victories: 0, defeats: 0, retreats: 0, totalDuration: 0, totalXP: 0, totalContribution: 0, totalCredits: 0, totalFragments: 0, ratingCount: 0, ratingScoreSum: 0, gradeCounts: { S: 0, A: 0, B: 0, C: 0, D: 0 }, bestScore: null, bestGrade: null, fastestVictory: null, longestBattle: null, currentWinStreak: 0, bestWinStreak: 0, updatedAt: null }, bossTotals: {}, difficultyTotals: {}, updatedAt: null },
      dynamicEvent: null, eventCooldowns: {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: true, animLevel: 'high', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}
async function waitServer(url, timeout = 60000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { try { if ((await fetch(url)).ok) return; } catch { /* retry */ } await sleep(300); } throw new Error('server timeout'); }
const textOf = p => p.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if ((await textOf(page)).includes(text)) return; await sleep(150); } throw new Error('text timeout: ' + text); }
async function clickButton(page, text, scope = 'button', timeout = 15000) { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 25; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function enterBoss(page) {
  await waitText(page, 'ENTER NEXUS', 60000); const sk = page.locator('button', { hasText: '跳过初始化' }).first(); if (await sk.isVisible().catch(() => false)) await sk.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, 'Python 知识库', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await clickThroughDialog(page); await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000); await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(220); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(220); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const c = page.locator('button', { hasText: '继续挑战' }).first(); if (await c.isVisible().catch(() => false)) await c.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.b6-visual-root').waitFor({ state: 'visible', timeout: 10000 });
  await sleep(900);
}
async function setEditorCode(page, code, last = false) {
  const okM = await page.evaluate(({ c, useLast }) => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[useLast ? models.length - 1 : 0].setValue(c); return true; }, { c: code, useLast: last }).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(150);
}
async function waitWarning(page, timeout = 45000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await page.locator('.attack-warning').first().isVisible().catch(() => false)) return; await sleep(160); } throw new Error('warning timeout'); }
async function remainingSeconds(page) { const t = await page.locator('.attack-warning .aw-time').first().innerText().catch(() => ''); const m = t.match(/([\d.]+)s/); return m ? Number(m[1]) : null; }
async function waitUntilRemaining(page, threshold, timeout = 8000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (!(await page.locator('.attack-warning').first().isVisible().catch(() => false))) return false; const rem = await remainingSeconds(page); if (rem != null && rem <= threshold) return true; await sleep(40); } return false; }
async function warningGone(page) { await page.locator('.attack-warning').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}); }
async function clueCount(page) { return page.locator('.weakness-clue:not(.locked)').count(); }
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function permFor(id, n) { let seed = hashStr(id) || 1; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; const arr = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
const NODE_LABELS = ['NODE-α', 'NODE-β', 'NODE-γ'];
const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
const P2 = 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"';
const P3 = 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))';
const P4 = 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))';
const CRACK1 = 'def bypass(level, backup):\n    if level >= 50 and backup:\n        return True\n    return False';

(async () => {
  let dev = null; let browser = null;
  try {
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, makeSave());
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    ok((await page.locator('.boss-arena').isVisible()) && (await textOf(page)).includes('GATE-01'), '真实入口进入 Boss 战');
    const initSave = await saveData(page);
    ok(initSave.player.progress.bossBattles['gate-01'].status === 'active', 'Boss 初始化 active');
    ok((await page.locator('.hp-track').count()) === 1 && (await page.locator('.boss-weakness-panel').count()) === 1, '战斗 UI / 弱点面板初始化');
    await page.screenshot({ path: join(evidence, '01-boss-entry.png'), fullPage: false });

    console.log('=== 1. Attack / Defense ===');
    await waitWarning(page);
    await page.screenshot({ path: join(evidence, '02-attack-warning.png'), fullPage: false });
    ok(await waitUntilRemaining(page, 0.6), '攻击预警真实倒计时');
    await clickButton(page, '防御', '.boss-attack-panel button');
    await waitText(page, '防御成功', 12000);
    ok(true, '真实防御成功反馈');
    await warningGone(page);

    let clues = await clueCount(page);
    for (let i = 0; i < 4 && clues < 2; i++) {
      await waitWarning(page);
      if (await waitUntilRemaining(page, 0.5)) await clickButton(page, '防御', '.boss-attack-panel button').catch(() => {});
      await waitText(page, '防御成功', 12000).catch(() => {});
      await warningGone(page);
      clues = await clueCount(page);
    }
    ok(clues >= 2, '真实战斗获得弱点线索', String(clues));

    console.log('=== 2. Weakness Discovery / Crack / Expose ===');
    await clickButton(page, '分析弱点', '.boss-weakness-panel button');
    await page.locator('.b6-weak-cine').waitFor({ state: 'visible', timeout: 6000 });
    await waitText(page, '弱点已发现', 12000);
    await page.screenshot({ path: join(evidence, '03-weakness-discovery.png'), fullPage: false });
    await clickButton(page, '开始弱点破解', '.boss-weakness-panel button');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'visible', timeout: 15000 });
    await setEditorCode(page, CRACK1, true);
    await clickButton(page, '提交破解');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'hidden', timeout: 60000 });
    await page.locator('.weakness-exposure-banner').waitFor({ state: 'visible', timeout: 15000 });
    ok(true, '真实判题破解成功 → 弱点暴露');
    await page.screenshot({ path: join(evidence, '04-weakness-exposed.png'), fullPage: false });

    console.log('=== 3. Phase Transition / Cinematic ===');
    await setEditorCode(page, P1, false);
    await clickButton(page, '提交攻击');
    await page.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 60000 });
    ok(true, '真实阶段转换演出触发');
    await page.screenshot({ path: join(evidence, '05-phase-transition.png'), fullPage: false });
    await waitText(page, '战斗阶段 2 / 3', 30000);
    await sleep(1800);

    console.log('=== 4. Dynamic Crisis ===');
    await page.locator('.dev-arbiter-panel button', { hasText: '触发未知入侵' }).click();
    const overlay = page.locator('.panel', { hasText: '未知入侵 · UNKNOWN INTRUSION' }).first();
    await overlay.waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForFunction(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('NODE-α'));
      return b && !b.disabled;
    }, null, { timeout: 12000 });
    await page.screenshot({ path: join(evidence, '06-crisis-event.png'), fullPage: false });
    const evSave = await saveData(page);
    const dyn = evSave.player.progress.dynamicEvent;
    ok(!!dyn && dyn.defId === 'unknown-intrusion', '真实动态危机事件');
    const order = permFor(dyn.id, 3).map(i => NODE_LABELS[i]);
    for (const label of order) { await overlay.locator('button', { hasText: label }).click(); await sleep(350); }
    await waitText(page, '入侵已隔离', 12000);
    await page.locator('.panel', { hasText: '未知入侵 · UNKNOWN INTRUSION' }).first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await sleep(400);

    console.log('=== 5. Remaining Phases / Victory / Settlement ===');
    await setEditorCode(page, P2, false);
    await clickButton(page, '提交攻击');
    await waitText(page, '战斗阶段 3 / 3', 60000);
    await sleep(1800);
    await setEditorCode(page, P3, false);
    await clickButton(page, '提交攻击');
    await waitText(page, '阶段 4 / 4', 30000);
    await sleep(1800);
    await setEditorCode(page, P4, false);
    await clickButton(page, '提交攻击');
    await page.locator('.b6-terminal-portal').waitFor({ state: 'visible', timeout: 60000 });
    ok(true, '真实 Victory Terminal P0 演出');
    await page.screenshot({ path: join(evidence, '07-victory-terminal.png'), fullPage: false });
    const frag = page.locator('.frag-gain').first();
    if (await frag.isVisible().catch(() => false)) await frag.click({ force: true }).catch(() => {});
    await page.locator('.settlement-overlay').waitFor({ state: 'visible', timeout: 15000 });
    ok(await page.locator('.settlement-overlay.settlement-victory').count() >= 1, '真实 Victory Settlement');
    await page.screenshot({ path: join(evidence, '08-victory-settlement.png'), fullPage: false });
    const finalSave = await saveData(page);
    const history = finalSave.player.progress.bossBattleStats.history || [];
    ok(history.length === 1 && history[0].result === 'victory', '真实统计仅 1 份 Victory');
    ok(finalSave.version === 10, 'Save v10');
    ok(!!finalSave.player.mira && finalSave.player.mira.exp > 0, '真实 Boss 事件触发 MIRA 成长');
    ok(!!finalSave.player.mira?.memories['mira-boss-victory'], 'Boss 胜利记忆由真实 VICTORY 解锁');
    ok(!!finalSave.player.mira?.memories['mira-major-crisis'], '动态危机记忆由真实隔离完成解锁');
    await page.locator('.settlement-overlay .bs-footer .nxbtn.primary').first().click().catch(() => {});
    await page.locator('.settlement-overlay').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});

    console.log('=== 6. Archive / Return ===');
    const completeBack = page.locator('.boss-complete button', { hasText: '返回地图' }).first();
    if (await completeBack.isVisible().catch(() => false)) await completeBack.click();
    else await clickButton(page, '撤退', '.hud button');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await page.locator('.b6-visual-root').count()) === 0, '离开战斗清理视觉层');
    await clickThroughDialog(page);
    await sleep(300);
    await clickThroughDialog(page);
    await clickButton(page, '主菜单', '.nxbtn');
    await waitText(page, '战斗档案馆', 15000);
    await clickButton(page, '战斗档案馆', '.rail-item');
    await page.locator('.archive-page').waitFor({ state: 'visible', timeout: 15000 });
    ok((await page.locator('.archive-card').count()) >= 1, '真实战斗写入档案馆');
    await page.screenshot({ path: join(evidence, '09-archive.png'), fullPage: false });
    await clickButton(page, '返回', '.nxbtn').catch(() => {});
    await sleep(300);
    await page.screenshot({ path: join(evidence, '10-return-menu.png'), fullPage: false });
    ok(errors.length === 0, '完整流程无未捕获异常', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('B.7 E2E 失败:', e?.message || e); process.exit(1); });
