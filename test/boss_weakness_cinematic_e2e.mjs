// V1.3-B.6.4 弱点电影化真实浏览器 E2E（真实 Chrome + 真实 B.3 Judge）
// 真实流程：线索 → 分析(Scan) → 发现 → 破解(Crack) → 击破(Break) → 暴露 → 恢复
// DEV 流程：全序列 / 优先级冲突 / 阶段抢占 / Terminal Override / Reduced / Mobile / Cleanup
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-4-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 5300 + Math.floor(Math.random() * 80);
const DEV_PORT = 6600 + Math.floor(Math.random() * 80);
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
      currentBossId: null, pendingRebirth: false,
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
async function setEditorCode(page, code, last = true) {
  const okM = await page.evaluate(({ c, useLast }) => { const m = window.monaco; if (!m || !m.editor) return false; const models = m.editor.getModels(); if (!models.length) return false; models[useLast ? models.length - 1 : 0].setValue(c); return true; }, { c: code, useLast: last }).catch(() => false);
  if (!okM) { const ta = page.locator('.monaco-editor textarea').last(); await ta.click(); await page.keyboard.press('Control+A'); await page.keyboard.insertText(code); }
  await sleep(150);
}
async function waitWarning(page, timeout = 45000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (await page.locator('.attack-warning').first().isVisible().catch(() => false)) return; await sleep(160); } throw new Error('warning timeout'); }
async function remainingSeconds(page) { const t = await page.locator('.attack-warning .aw-time').first().innerText().catch(() => ''); const m = t.match(/([\d.]+)s/); return m ? Number(m[1]) : null; }
async function waitUntilRemaining(page, threshold, timeout = 8000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (!(await page.locator('.attack-warning').first().isVisible().catch(() => false))) return false; const rem = await remainingSeconds(page); if (rem != null && rem <= threshold) return true; await sleep(40); } return false; }
async function warningGone(page) { await page.locator('.attack-warning').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}); }
async function clueCount(page) { return page.locator('.weakness-clue:not(.locked)').count(); }
async function acquireClues(page) { for (let i = 0; i < 5; i++) { if ((await clueCount(page)) >= 2) return true; await waitWarning(page, 45000); if (!(await waitUntilRemaining(page, 0.6))) { await warningGone(page); continue; } await clickButton(page, '防御', '.boss-attack-panel button'); await waitText(page, '防御成功', 12000).catch(() => {}); await warningGone(page); if ((await clueCount(page)) >= 2) return true; } return (await clueCount(page)) >= 2; }
async function saveData(page) { return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } }); }
async function weaknessBanner(page, text, timeout = 8000) { const loc = page.locator('.b6-weak-cine', { hasText: text }).first(); await loc.waitFor({ state: 'visible', timeout }); return loc.innerText(); }
const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
const CRACK1_OK = 'def bypass(level, backup):\n    if level >= 50 and backup:\n        return True\n    return False';
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

    console.log('=== 1. 生产页 / 真实发现 ===');
    const prodCtx = await mkCtx(makeSave()); const page = await prodCtx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    ok((await page.locator('.dev-visual-panel').count()) === 0, '生产隐藏 DEV 视觉面板');
    await waitWarning(page);
    ok(await acquireClues(page), '真实战斗获得 2 条弱点线索');
    await clickButton(page, '分析弱点', '.boss-weakness-panel button');
    const scanText = await weaknessBanner(page, 'WEAKNESS SCAN', 6000);
    ok(scanText.includes('SCANNING BOSS DATA'), '真实分析开始显示 Scan');
    await page.screenshot({ path: join(evidence, '01-weakness-scan.png'), fullPage: false });
    const discoveryText = await weaknessBanner(page, 'WEAKNESS DISCOVERED', 8000);
    ok(discoveryText.includes('能源边界校验旁路'), '真实弱点名称来自 B.3 配置');
    ok(discoveryText.includes('逻辑漏洞'), '真实弱点类型');
    await page.screenshot({ path: join(evidence, '02-weakness-discovery.png'), fullPage: false });
    await sleep(500);
    ok((await page.locator('.b6-weak-cine').innerText()).includes('TARGET LOCKED'), 'Discovery 目标锁定阶段');
    await page.screenshot({ path: join(evidence, '03-target-lock.png'), fullPage: false });
    const saveBefore = await saveData(page);
    ok(saveBefore.version === 10, '存档版本保持 v10');
    ok(saveBefore.player.progress.bossBattles['gate-01'].status === 'active', '真实战斗保持进行中');

    console.log('=== 2. 真实破解 / 击破 / 暴露 / 恢复 ===');
    await clickButton(page, '开始弱点破解', '.boss-weakness-panel button');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'visible', timeout: 15000 });
    await setEditorCode(page, CRACK1_OK, true);
    await clickButton(page, '提交破解');
    const crackText = await weaknessBanner(page, 'WEAKNESS CRACK', 10000);
    ok(crackText.includes('CRACK IN PROGRESS'), '真实破解开始显示 Crack');
    await page.screenshot({ path: join(evidence, '04-weakness-crack.png'), fullPage: false });
    await sleep(450);
    await page.screenshot({ path: join(evidence, '05-crack-progress.png'), fullPage: false });
    const breakText = await weaknessBanner(page, 'WEAKNESS BREAK', 60000);
    ok(breakText.includes('CORE SHATTER'), '真实破解成功显示 Break');
    await page.screenshot({ path: join(evidence, '06-weakness-break.png'), fullPage: false });
    await sleep(450);
    await page.screenshot({ path: join(evidence, '07-core-shatter.png'), fullPage: false });
    await page.locator('.weakness-exposure-banner').waitFor({ state: 'visible', timeout: 20000 });
    const exposeText = await weaknessBanner(page, 'CORE EXPOSED', 8000);
    ok(exposeText.includes('CORE EXPOSED'), '真实暴露显示 Expose');
    ok(/伤害 ×1\.5/.test(exposeText), 'Expose 读取真实伤害倍率');
    await page.screenshot({ path: join(evidence, '08-weakness-expose.png'), fullPage: false });
    const saveExposed = await saveData(page);
    const entryExposed = saveExposed.player.progress.bossWeaknesses['gate-01'].entries['gate-01-w1'];
    ok(entryExposed.status === 'exposed' && entryExposed.successCount === 1, '真实弱点状态 exposed / 成功 1 次');
    ok(entryExposed.attempts === 1, '真实尝试次数 1（视觉未重复提交）');
    const recoverText = await weaknessBanner(page, 'WEAKNESS RECOVERED', 25000);
    ok(recoverText.includes('WEAKNESS RECOVERED'), '真实暴露到期显示 Recovery');
    await page.screenshot({ path: join(evidence, '09-weakness-recovery.png'), fullPage: false });
    const saveRecovered = await saveData(page);
    const entryRecovered = saveRecovered.player.progress.bossWeaknesses['gate-01'].entries['gate-01-w1'];
    ok(entryRecovered.status === 'recovered', '真实弱点状态 recovered');
    ok(saveRecovered.player.progress.bossBattles['gate-01'].status === 'active', '恢复后战斗仍正常进行');
    ok((await page.locator('.b6-visual-root').count()) >= 1, '视觉层仍然存在');
    await prodCtx.close();

    console.log('=== 3. DEV 面板 / 全序列 / 冲突 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const devCtx = await mkCtx(makeSave()); const dp = await devCtx.newPage();
    dp.on('pageerror', e => errors.push('DEV ' + String(e)));
    await dp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(dp);
    const panel = dp.locator('.dev-visual-panel'); await panel.waitFor({ state: 'visible', timeout: 15000 });
    ok(true, 'DEV 环境显示视觉测试面板');
    await panel.locator('button', { hasText: 'Weakness Full Sequence' }).click();
    await weaknessBanner(dp, 'WEAKNESS SCAN', 5000);
    await weaknessBanner(dp, 'WEAKNESS DISCOVERED', 6000);
    ok((await dp.locator('.b6-weak-cine').count()) === 1, '全序列仅单个演出实例');
    await weaknessBanner(dp, 'WEAKNESS BREAK', 8000);
    await weaknessBanner(dp, 'CORE EXPOSED', 8000);
    ok((await dp.locator('.b6-weak-cine').innerText()).includes('DEV'), 'DEV 演出明确标记');
    await panel.locator('button', { hasText: 'Interrupt Weakness' }).click();
    await sleep(250);
    ok((await dp.locator('.b6-weak-cine').count()) === 0, 'Interrupt Weakness 清理演出');
    await panel.locator('button', { hasText: 'Weakness Priority' }).click();
    await sleep(300);
    ok((await dp.locator('.b6-weak-cine').count()) === 1, '弱点 P3 接管攻击视觉');
    ok((await dp.locator('.b6-attack-cine').count()) === 0, '旧攻击演出不恢复');
    await panel.locator('button', { hasText: 'Weakness Discovery' }).click();
    await sleep(200);
    await panel.locator('button', { hasText: 'Weakness Discovery' }).click();
    ok((await dp.locator('.b6-weak-cine').count()) === 1, '重复触发不并列演出');

    console.log('=== 4. 真实阶段转换抢占弱点 ===');
    await panel.locator('button', { hasText: 'Weakness Discovery' }).click();
    await sleep(200);
    await setEditorCode(dp, P1, false);
    await clickButton(dp, '提交攻击');
    await dp.locator('.b6-phase-cine').waitFor({ state: 'visible', timeout: 60000 });
    ok((await dp.locator('.b6-weak-cine').count()) === 0, 'P1 真实阶段转换清理弱点演出');
    await dp.screenshot({ path: join(evidence, '15-phase-override.png'), fullPage: false });
    await dp.waitForTimeout(3500);

    console.log('=== 5. 页面切换清理 ===');
    await panel.locator('button', { hasText: 'Weakness Discovery' }).click();
    await sleep(200);
    await clickButton(dp, '撤退', '.hud button');
    await waitText(dp, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await dp.locator('.b6-weak-cine').count()) === 0 && (await dp.locator('.b6-visual-root').count()) === 0, '页面切换清理弱点/视觉层');
    await devCtx.close();

    console.log('=== 6. Reduced Motion / Mobile / Terminal ===');
    const rmCtx = await mkCtx(makeSave(), { reducedMotion: 'reduce' }); const rp = await rmCtx.newPage();
    rp.on('pageerror', e => errors.push('RM ' + String(e)));
    await rp.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(rp);
    ok(await rp.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 生效');
    await rp.locator('.dev-visual-panel').locator('button', { hasText: 'Weakness Discovery' }).click();
    await sleep(300);
    ok(await rp.locator('.b6-weak-cine').isVisible(), 'Reduced Motion 仍显示弱点信息');
    await rp.screenshot({ path: join(evidence, '10-reduced-motion.png'), fullPage: false });
    for (const width of [360, 390, 430]) {
      await rp.setViewportSize({ width, height: 844 });
      await rp.locator('.dev-visual-panel').locator('button', { hasText: 'Weakness Discovery' }).click();
      await sleep(250);
      const layout = await rp.evaluate(() => {
        let el = document.querySelector('.boss-page');
        while (el) { if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = 0; el = el.parentElement; }
        const left = document.querySelector('.chlg-left');
        if (left) left.scrollTop = 0;
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        const banner = document.querySelector('.b6-weak-cine');
        const b = banner ? banner.getBoundingClientRect() : null;
        const hit = (r) => !!b && !!r && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
        const buttons = Array.from(document.querySelectorAll('.boss-attack-panel button')).map(el => ({ text: el.textContent || '', overlap: hit(el.getBoundingClientRect()) }));
        const hp = document.querySelector('.hp-track');
        const editor = document.querySelector('.code-frame');
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
          bannerVisible: !!b && b.width > 0 && b.height > 0 && b.bottom <= window.innerHeight && b.top >= 0,
          defendDodgeOverlap: buttons.some(x => x.overlap),
          hpOverlap: !!hp && hit(hp.getBoundingClientRect()),
          editorOverlap: !!editor && hit(editor.getBoundingClientRect()),
        };
      });
      ok(!layout.overflow, width + 'px 无横向溢出');
      ok(layout.bannerVisible, width + 'px 弱点演出完整可见');
      ok(!layout.defendDodgeOverlap, width + 'px 不遮挡防御/闪避按钮');
      ok(!layout.hpOverlap, width + 'px 不遮挡 Boss HP');
      ok(!layout.editorOverlap, width + 'px 不遮挡挑战输入区');
      await rp.screenshot({ path: join(evidence, '11-mobile-' + width + '.png'), fullPage: false });
    }
    await rp.setViewportSize({ width: 1440, height: 900 });
    await rp.screenshot({ path: join(evidence, '16-dev-panel.png'), fullPage: true });
    const rmPanel = rp.locator('.dev-visual-panel');
    await rmPanel.locator('button', { hasText: 'Weakness Discovery' }).click();
    await sleep(200);
    await rmPanel.locator('button', { hasText: 'Terminal Override' }).click();
    await sleep(250);
    ok((await rp.locator('.b6-weak-cine').count()) === 0, 'Terminal Override 抢占并清理弱点');
    await rp.screenshot({ path: join(evidence, '14-terminal-override.png'), fullPage: false });
    await clickButton(rp, '撤退', '.hud button');
    await waitText(rp, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await rp.locator('.b6-weak-cine').count()) === 0 && (await rp.locator('.b6-visual-root').count()) === 0, '页面切换清理弱点/视觉层');
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
