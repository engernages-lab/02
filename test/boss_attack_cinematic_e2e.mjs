// V1.3-B.6.2 攻击电影化真实浏览器 E2E
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b6-2-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 5000 + Math.floor(Math.random() * 80);
const DEV_PORT = 6300 + Math.floor(Math.random() * 80);
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
async function waitTextGone(page, text, timeout = 8000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { if (!(await textOf(page)).includes(text)) return; await sleep(120); } }
async function clickButton(page, text, scope = 'button') { const b = page.locator(scope, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout: 15000 }); await b.click(); }
async function clickThroughDialog(page) { for (let i = 0; i < 20; i++) { const d = page.locator('.dlg-root').first(); if (!(await d.isVisible().catch(() => false))) return; const s = page.locator('button', { hasText: '跳过' }).first(); if (await s.isVisible().catch(() => false)) await s.click().catch(() => {}); else await d.click({ position: { x: 24, y: 24 } }).catch(() => {}); await sleep(120); } }
async function dismissIntrusion(page) { if (!(await textOf(page)).includes('UNKNOWN INTRUSION')) return; const b = page.locator('button', { hasText: '退出隔离' }).first(); if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await sleep(250); } }
async function waitWarning(page, timeout = 45000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { await dismissIntrusion(page); if (await page.locator('.attack-warning').first().isVisible().catch(() => false)) return; await sleep(180); } throw new Error('warning timeout'); }
async function remaining(page) { const t = await page.locator('.attack-warning .aw-time').first().innerText().catch(() => ''); const m = t.match(/([\d.]+)s/); return m ? Number(m[1]) : null; }
async function waitRemaining(page, th, timeout = 8000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const r = await remaining(page); if (r != null && r <= th) return true; await sleep(40); } return false; }
async function enterBoss(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const skip = page.locator('button', { hasText: '跳过初始化' }).first(); if (await skip.isVisible().catch(() => false)) await skip.click();
  await clickButton(page, 'ENTER NEXUS'); await waitText(page, 'Python 知识库', 60000); await clickThroughDialog(page);
  await clickButton(page, '继续探索'); await clickThroughDialog(page);
  await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000); await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click({ force: true }); await sleep(220); await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸'); await sleep(220); await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const cont = page.locator('button', { hasText: '继续挑战' }).first(); if (await cont.isVisible().catch(() => false)) await cont.click(); else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.b6-visual-root').waitFor({ state: 'visible', timeout: 10000 });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
function staticServer(rootDir, port) { const server = createServer((req, res) => { try { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = normalize(join(rootDir, p)); if (!existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); } catch { res.writeHead(500); res.end(); } }); return new Promise(r => server.listen(port, '127.0.0.1', () => r(server))); }

(async () => {
  const distRoot = join(root, 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist');
  const server = await staticServer(distRoot, DIST_PORT);
  let browser = null; let dev = null;
  try {
    const chromePath = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', chromium.executablePath()].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const mkCtx = async (seed) => { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.addInitScript(s => { try { if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ } }, seed); return ctx; };
    console.log('=== 1. 生产页 ===');
    const ctxProd = await mkCtx(makeSave()); const prod = await ctxProd.newPage();
    await prod.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(prod);
    ok(await prod.locator('.b6-visual-root').isVisible(), '生产 Boss 战视觉层存在');
    ok((await prod.locator('.dev-visual-panel').count()) === 0, '生产隐藏 DEV 面板');
    const btnClickable = await prod.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('提交攻击')); if (!b) return false; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!el && (el === b || b.contains(el)); });
    ok(btnClickable, '攻击演出不遮挡提交按钮');
    await ctxProd.close();

    console.log('=== 2. 真实攻击 + DEV 演出 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const ctx = await mkCtx(makeSave()); const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    const devPanel = page.locator('.dev-visual-panel'); await devPanel.waitFor({ state: 'visible', timeout: 10000 });
    ok(true, 'DEV 战斗面板可见');
    ok((await devPanel.innerText()).includes('Attack'), 'DEV 面板显示攻击状态');

    await waitWarning(page);
    const warning = page.locator('.b6-attack-cine.b6-attack-warning');
    await warning.waitFor({ state: 'visible', timeout: 5000 });
    ok((await warning.innerText()).includes('WARNING'), '真实预警显示 WARNING');
    ok((await warning.innerText()).includes('DEFEND') && (await warning.innerText()).includes('DODGE'), '预警提示防御/闪避');
    ok((await warning.innerText()).length > 10, '预警显示攻击名称/说明');
    const defenseClickable = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('.boss-attack-panel button')).find(x => (x.textContent || '').includes('防御'));
      if (!b) return false; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!el && (el === b || b.contains(el));
    });
    ok(defenseClickable, '攻击演出不遮挡防御按钮');
    await page.screenshot({ path: join(evidence, '01-warning.png'), fullPage: false });

    await waitText(page, '受到「', 20000);
    const hitView = page.locator('.b6-attack-cine.b6-attack-result');
    ok(await hitView.isVisible().catch(() => false) && (await hitView.innerText()).includes('IMPACT'), '真实受击演出');
    await page.screenshot({ path: join(evidence, '07-hit.png'), fullPage: false });

    await devPanel.locator('button', { hasText: 'Attack Warning' }).click();
    await sleep(180);
    ok((await page.locator('.b6-attack-cine').innerText()).includes('WARNING'), 'DEV Warning 演出');
    await devPanel.locator('button', { hasText: 'Charge' }).click();
    await sleep(180);
    ok((await page.locator('.b6-attack-cine').innerText()).includes('CHARGING') || (await page.locator('.b6-charge').count()) >= 1, '蓄力演出');
    await page.screenshot({ path: join(evidence, '02-charge.png'), fullPage: false });
    await devPanel.locator('button', { hasText: 'Block' }).click();
    await sleep(180);
    ok((await page.locator('.b6-attack-cine').innerText()).includes('BLOCKED'), '格挡电影化演出');
    await page.screenshot({ path: join(evidence, '08-block.png'), fullPage: false });
    await devPanel.locator('button', { hasText: 'Dodge' }).click();
    await sleep(180);
    ok((await page.locator('.b6-attack-cine').innerText()).includes('DODGED'), '闪避电影化演出');
    await page.screenshot({ path: join(evidence, '09-dodge.png'), fullPage: false });
    const variants = [
      ['Digital Wave', 'digital-wave', '03-digital-wave.png'],
      ['Data Strike', 'data-strike', '04-data-strike.png'],
      ['System Crash', 'system-crash', '05-system-crash.png'],
      ['Corruption Wave', 'corruption-wave', '06-corruption-wave.png'],
    ];
    for (const [label, vt, file] of variants) {
      await devPanel.locator('button', { hasText: label }).click();
      await sleep(180);
      ok((await page.locator('.b6-attack-cine').getAttribute('class')).includes('b6-vt-' + vt), '攻击变体：' + label);
      await page.screenshot({ path: join(evidence, file), fullPage: false });
    }
    await devPanel.locator('button', { hasText: 'Interrupt' }).first().click();
    await sleep(180);
    ok((await page.locator('.b6-attack-cine').innerText()).includes('ATTACK INTERRUPTED'), '打断演出');
    await page.screenshot({ path: join(evidence, '10-interrupt.png'), fullPage: false });
    await devPanel.locator('button', { hasText: 'Cancel' }).click();
    await sleep(180);
    ok((await page.locator('.b6-attack-cine').innerText()).includes('ATTACK CANCELLED'), '取消演出');
    await devPanel.locator('button', { hasText: 'Cleanup All' }).click();
    await sleep(250);
    ok((await page.locator('.b6-effect').count()) === 0, '攻击 Cleanup');
    await page.screenshot({ path: join(evidence, '13-cleanup.png'), fullPage: false });

    await devPanel.locator('button', { hasText: 'Preview' }).count().catch(() => 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    await sleep(500);
    ok(await page.locator('.b6-visual-root.b6-reduced').count() >= 1, 'Reduced Motion 生效');
    ok((await page.locator('.b6-attack-cine').count()) === 0, '刷新后无残留攻击演出');
    await devPanel.locator('button', { hasText: 'HIGH' }).click();
    await devPanel.locator('button', { hasText: 'Digital Wave' }).click();
    await sleep(200);
    await page.screenshot({ path: join(evidence, '11-reduced.png'), fullPage: false });
    await page.setViewportSize({ width: 390, height: 844 }); await sleep(120);
    await devPanel.locator('button', { hasText: 'Digital Wave' }).click(); await sleep(120);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), '移动端无横向溢出');
    ok(await page.locator('.b6-attack-cine').isVisible().catch(() => false), '移动端攻击演出可见');
    await page.screenshot({ path: join(evidence, '12-mobile.png'), fullPage: false });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: join(evidence, '14-dev-panel.png'), fullPage: true });
    ok(await page.locator('.b6-visual-root').isVisible(), '视觉层保持');
    await clickButton(page, '撤退', '.hud button');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 20000);
    ok((await page.locator('.b6-visual-root').count()) === 0, '页面切换后视觉层清理');
    ok(errors.length === 0, '攻击演出无未捕获异常', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => server.close(r));
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e?.message || e); process.exit(1); });
