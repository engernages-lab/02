// V1.3-B.6.5 动态危机电影化真实浏览器 E2E
// 真实事件：通过 CombatArbiterDevPanel 调用正式 triggerDynamicEvent 触发 unknown-intrusion
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-5-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 5500 + Math.floor(Math.random() * 80);
const DEV_PORT = 6800 + Math.floor(Math.random() * 80);
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
}
async function setEditorCode(page, code, last = false) {
  const okM = await page.evaluate(({ c, useLast }) => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[useLast ? models.length - 1 : 0].setValue(c); return true; }, { c: code, useLast: last }).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').first(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(150);
}
async function waitWarning(page, timeout = 45000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await page.locator('.attack-warning').first().isVisible().catch(() => false)) return; await sleep(160); } throw new Error('warning timeout'); }
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function triggerCrisis(page) { await page.locator('.dev-arbiter-panel button', { hasText: '触发未知入侵' }).click(); }
async function resetCrisisCooldown(page) { await page.locator('.dev-arbiter-panel button', { hasText: '重置动态事件冷却' }).click(); }
async function crisisStrip(page, text, timeout = 10000) { const loc = page.locator('.b6-crisis-strip', { hasText: text }).first(); await loc.waitFor({ state: 'visible', timeout }); return loc.innerText(); }
async function crisisBase(page, text, timeout = 10000) { const loc = page.locator('.b6-crisis-cine', { hasText: text }).first(); await loc.waitFor({ state: 'visible', timeout }); return loc.innerText(); }
function overlayPanel(page) { return page.locator('.panel', { hasText: '未知入侵 · UNKNOWN INTRUSION' }).first(); }
async function waitOverlayGone(page, timeout = 12000) { await overlayPanel(page).waitFor({ state: 'hidden', timeout }).catch(() => {}); }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function permFor(id, n) { let seed = hashStr(id) || 1; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; const arr = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
const NODE_LABELS = ['NODE-α', 'NODE-β', 'NODE-γ'];
const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
function staticServer(rootDir, port) { const server = createServer((req, res) => { try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = normalize(join(rootDir, p)); if (!existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); } catch { res.writeHead(500); res.end(); } }); return new Promise(r => server.listen(port, '127.0.0.1', () => r(server))); }

(async () => {
  const distRoot = join(root, 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist，请先 npm run build');
  const server = await staticServer(distRoot, DIST_PORT);
  let browser = null; let dev = null;
  try {
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const mkCtx = async (seed, opts = {}) => { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts }); await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, seed); return ctx; };

    console.log('=== 1. 生产页 ===');
    const prodCtx = await mkCtx(makeSave()); const prodPage = await prodCtx.newPage(); const errors = [];
    prodPage.on('pageerror', e => errors.push(String(e)));
    await prodPage.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(prodPage);
    ok((await prodPage.locator('.dev-visual-panel').count()) === 0, '生产隐藏 DEV 视觉面板');
    await prodCtx.close();

    console.log('=== 1b. 真实危机（DEV 入口调用正式 triggerDynamicEvent）===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const realCtx = await mkCtx(makeSave()); const page = await realCtx.newPage();
    page.on('pageerror', e => errors.push('REAL ' + String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    await triggerCrisis(page);
    await crisisStrip(page, 'SYSTEM ALERT', 8000);
    await overlayPanel(page).waitFor({ state: 'visible', timeout: 8000 });
    ok(await page.locator('.b6-crisis-portal').isVisible(), '真实危机 Portal 位于覆盖层之上');
    await page.screenshot({ path: join(evidence, '01-crisis-warning.png'), fullPage: false });
    const det = await crisisStrip(page, 'THREAT DETECTED', 2500);
    ok(det.includes('CRISIS DETECTION') || det.includes('THREAT DETECTED'), '真实 Warning → Detection');
    await page.screenshot({ path: join(evidence, '02-crisis-detection.png'), fullPage: false });
    await page.waitForFunction(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('NODE-α'));
      return b && !b.disabled;
    }, null, { timeout: 10000 });
    await crisisStrip(page, 'CRISIS IDENTIFIED', 4000);
    const overlayText = await overlayPanel(page).innerText();
    ok(overlayText.includes('未知入侵') && overlayText.includes('UNKNOWN INTRUSION'), '真实危机名称来自正式事件');
    await page.screenshot({ path: join(evidence, '03-crisis-identification.png'), fullPage: false });
    const saveCrisis = await saveData(page);
    const dyn = saveCrisis.player.progress.dynamicEvent;
    ok(!!dyn && dyn.defId === 'unknown-intrusion' && dyn.status === 'active', '真实 dynamicEvent active');
    ok(saveCrisis.version === 10, '存档版本保持 v10');
    const order = permFor(dyn.id, 3).map(i => NODE_LABELS[i]);
    console.log('  节点顺序：' + order.join(' → '));
    const panel = await overlayPanel(page);
    await panel.locator('button', { hasText: order[0] }).click();
    await waitText(page, '1/3', 8000);
    const resp = await crisisStrip(page, 'COUNTERMEASURE', 4000);
    ok(resp.includes('RESPONSE DETECTED'), '真实 step → Response');
    await page.screenshot({ path: join(evidence, '06-crisis-response.png'), fullPage: false });
    const wrongLabel = NODE_LABELS[(NODE_LABELS.indexOf(order[1]) + 1) % 3];
    await panel.locator('button', { hasText: wrongLabel }).click();
    await waitText(page, '剩余 2/3', 8000);
    const imp = await crisisStrip(page, 'IMPACT', 4000);
    const impBase = await page.locator('.b6-crisis-cine').innerText();
    ok(imp.includes('SYSTEM BREACH') && impBase.includes('隔离失误'), '真实 miss → Impact');
    await page.screenshot({ path: join(evidence, '05-crisis-impact.png'), fullPage: false });
    await panel.locator('button', { hasText: order[1] }).click();
    await sleep(300);
    await panel.locator('button', { hasText: order[2] }).click();
    await waitText(page, '入侵已隔离', 10000);
    const res = await crisisStrip(page, 'THREAT NEUTRALIZED', 4000);
    ok(res.includes('CRISIS RESOLVED'), '真实完成 → Resolution');
    await page.screenshot({ path: join(evidence, '07-crisis-resolution.png'), fullPage: false });
    await waitOverlayGone(page, 8000);
    const rec = await crisisBase(page, 'RECOVERY COMPLETE', 6000);
    ok(rec.includes('SYSTEM RESTORED') || rec.includes('RECOVERY COMPLETE'), '真实 dismiss → Recovery');
    await page.screenshot({ path: join(evidence, '08-crisis-recovery.png'), fullPage: false });
    await sleep(1800);
    ok((await page.locator('.b6-crisis-cine').count()) === 0 && (await page.locator('.b6-crisis-portal').count()) === 0, '真实危机结束后清理');
    const afterSave = await saveData(page);
    ok(afterSave.player.progress.dynamicEvent === null, '真实事件已 dismiss');
    ok(afterSave.player.consciousness > 0, '玩家意识值未被危机视觉修改');
    await resetCrisisCooldown(page);
    await waitWarning(page);
    await triggerCrisis(page);
    await overlayPanel(page).waitFor({ state: 'visible', timeout: 8000 });
    await sleep(400);
    ok((await page.locator('.b6-attack-cine').count()) === 0, '真实危机清理攻击演出');
    await page.screenshot({ path: join(evidence, '11-crisis-attack-conflict.png'), fullPage: false });
    await clickButton(page, '退出隔离', '.panel button');
    await waitOverlayGone(page, 8000);
    await sleep(2200);
    await realCtx.close();

    console.log('=== 2. DEV 面板 / 全阶段 / 冲突 ===');
    const ctx = await mkCtx(makeSave()); const dp = await ctx.newPage();
    dp.on('pageerror', e => errors.push('DEV ' + String(e)));
    await dp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(dp);
    const vp = dp.locator('.dev-visual-panel'); await vp.waitFor({ state: 'visible', timeout: 15000 });
    ok(true, 'DEV 环境显示视觉测试面板');
    await vp.locator('button', { hasText: 'Crisis Escalation' }).click();
    await sleep(250);
    ok((await dp.locator('.b6-crisis-cine').innerText()).includes('DEV'), 'DEV 危机演出明确标记');
    await dp.screenshot({ path: join(evidence, '04-crisis-escalation.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Full Crisis Sequence' }).click();
    await sleep(300);
    ok((await dp.locator('.b6-crisis-cine').count()) === 1, 'Full Crisis Sequence 单实例');
    await vp.locator('button', { hasText: 'Interrupt Crisis' }).click();
    await sleep(250);
    ok((await dp.locator('.b6-crisis-cine').count()) === 0, 'Interrupt Crisis 清理');
    await dp.screenshot({ path: join(evidence, '09-crisis-cleanup.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Crisis Priority' }).click();
    await sleep(300);
    ok((await dp.locator('.b6-crisis-cine').count()) === 1 && (await dp.locator('.b6-attack-cine').count()) === 0, 'Crisis P2 接管攻击视觉');
    await dp.screenshot({ path: join(evidence, '10-crisis-priority.png'), fullPage: false });
    await vp.locator('button', { hasText: 'Crisis Duplicate' }).click();
    ok((await dp.locator('.b6-crisis-cine').count()) === 1, '重复触发不并列');
    await vp.locator('button', { hasText: 'Interrupt Crisis' }).click();
    await sleep(200);
    await vp.locator('button', { hasText: 'Crisis Stale' }).click();
    await sleep(250);
    ok((await dp.locator('.b6-crisis-cine').count()) === 0, 'Stale 事件被拒绝');
    await vp.locator('button', { hasText: 'Weakness Discovery' }).click();
    await sleep(200);
    ok((await dp.locator('.b6-weak-cine').count()) === 1, '先建立弱点演出');
    await vp.locator('button', { hasText: 'Crisis Identification' }).click();
    await sleep(250);
    ok((await dp.locator('.b6-crisis-cine').count()) === 1 && (await dp.locator('.b6-weak-cine').count()) === 0, '危机 P2 抢占并清理弱点');
    await dp.screenshot({ path: join(evidence, '12-crisis-weakness-conflict.png'), fullPage: false });
    await setEditorCode(dp, P1, false);
    await clickButton(dp, '提交攻击');
    await dp.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 60000 });
    ok((await dp.locator('.b6-crisis-cine').count()) === 0, 'P1 阶段转换清理危机');
    await dp.screenshot({ path: join(evidence, '13-crisis-phase-override.png'), fullPage: false });
    await sleep(3500);
    await vp.locator('button', { hasText: 'Crisis Impact' }).click();
    await sleep(200);
    await vp.locator('button', { hasText: 'Terminal Override' }).click();
    await sleep(250);
    ok((await dp.locator('.b6-crisis-cine').count()) === 0, 'Terminal Override 清理危机');
    await dp.screenshot({ path: join(evidence, '14-crisis-terminal-override.png'), fullPage: false });
    await dp.setViewportSize({ width: 1440, height: 900 });
    await dp.evaluate(() => { const el = document.querySelector('.chlg-left'); if (el) el.scrollTop = el.scrollHeight; });
    await sleep(150);
    await dp.screenshot({ path: join(evidence, '19-dev-panel.png'), fullPage: true });
    await clickButton(dp, '撤退', '.hud button');
    await waitText(dp, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await dp.locator('.b6-crisis-cine').count()) === 0 && (await dp.locator('.b6-visual-root').count()) === 0, '页面切换清理危机/视觉层');
    await ctx.close();

    console.log('=== 3. Reduced Motion / Mobile ===');
    const rmCtx = await mkCtx(makeSave(), { reducedMotion: 'reduce' }); const rp = await rmCtx.newPage();
    rp.on('pageerror', e => errors.push('RM ' + String(e)));
    await rp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(rp);
    ok(await rp.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 生效');
    await rp.locator('.dev-visual-panel').locator('button', { hasText: 'Crisis Identification' }).click();
    await sleep(250);
    ok(await rp.locator('.b6-crisis-cine').isVisible(), 'Reduced Motion 仍显示危机信息');
    await rp.screenshot({ path: join(evidence, '15-reduced-motion.png'), fullPage: false });
    for (const width of [360, 390, 430]) {
      await rp.setViewportSize({ width, height: 844 });
      await rp.locator('.dev-visual-panel').locator('button', { hasText: 'Crisis Identification' }).click();
      await sleep(250);
      const layout = await rp.evaluate(() => {
        let el = document.querySelector('.boss-page');
        while (el) { if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = 0; el = el.parentElement; }
        window.scrollTo(0, 0);
        const banner = document.querySelector('.b6-crisis-cine');
        const b = banner ? banner.getBoundingClientRect() : null;
        const hit = (r) => !!b && !!r && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
        const buttons = Array.from(document.querySelectorAll('.boss-attack-panel button')).map(el => hit(el.getBoundingClientRect()));
        const hp = document.querySelector('.hp-track');
        const editor = document.querySelector('.code-frame');
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
          visible: !!b && b.width > 0 && b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight,
          defendDodge: buttons.some(Boolean),
          hp: !!hp && hit(hp.getBoundingClientRect()),
          editor: !!editor && hit(editor.getBoundingClientRect()),
        };
      });
      ok(!layout.overflow, width + 'px 无横向溢出');
      ok(layout.visible, width + 'px 危机横幅完整可见');
      ok(!layout.defendDodge, width + 'px 不遮挡防御/闪避');
      ok(!layout.hp, width + 'px 不遮挡 Boss HP');
      ok(!layout.editor, width + 'px 不遮挡挑战输入区');
      await rp.screenshot({ path: join(evidence, (16 + [360, 390, 430].indexOf(width)) + '-mobile-' + width + '.png'), fullPage: false });
    }
    await rp.setViewportSize({ width: 1440, height: 900 });
    await rp.locator('.dev-visual-panel').locator('button', { hasText: 'Crisis Impact' }).click();
    await sleep(200);
    await clickButton(rp, '撤退', '.hud button');
    await waitText(rp, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await rp.locator('.b6-crisis-cine').count()) === 0 && (await rp.locator('.b6-crisis-portal').count()) === 0, '页面切换清理危机/Portal');
    await rmCtx.close();
    ok(errors.length === 0, '全流程无未捕获异常', errors.slice(0, 3).join(' | '));
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => server.close(r));
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e?.message || e); process.exit(1); });
