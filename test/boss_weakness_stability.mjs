// V1.3-B.3 稳定性：Boss 页面进出 10 次，验证攻击/弱点调度器与监听器清理
// 执行：node test/boss_weakness_stability.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4500 + Math.floor(Math.random() * 120);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave() {
  const player = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: { 'bossIntro_gate-01': true }, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
      currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
const textOf = (page) => page.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await textOf(page)).includes(text)) return true;
    await sleep(150);
  }
  throw new Error('等待文本超时: ' + text);
}
async function clickButton(page, text, scope = 'button', timeout = 15000) {
  const btn = page.locator(scope, { hasText: text }).first();
  await btn.waitFor({ state: 'visible', timeout });
  await btn.click();
}
async function clickThroughDialog(page, maxSteps = 20) {
  for (let i = 0; i < maxSteps; i++) {
    const dlg = page.locator('.dlg-root').first();
    if (!(await dlg.isVisible().catch(() => false))) return;
    const skip = page.locator('button', { hasText: '跳过' }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
    else await dlg.click({ position: { x: 24, y: 24 } }).catch(() => {});
    await sleep(150);
  }
}
async function enterBossFromMap(page) {
  await waitText(page, 'NEXUS 数字世界 · 服务器网络', 30000);
  await page.locator('.node-group').nth(1).click();
  await sleep(200);
  await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸');
  await sleep(200);
  await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const cont = page.locator('button', { hasText: '继续挑战' }).first();
  if (await cont.isVisible().catch(() => false)) await cont.click();
  else await clickButton(page, '开始挑战');
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
}
async function consciousness(page) {
  const body = await textOf(page);
  const m = body.match(/意识\s*(\d+)%/);
  return m ? Number(m[1]) : NaN;
}

(async () => {
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist');
  const server = createServer((req, res) => {
    try {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = normalize(join(distRoot, p));
      if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
      res.end(readFileSync(f));
    } catch { res.writeHead(500); res.end('err'); }
  });
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  let browser;
  try {
    const chromePath = [
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      chromium.executablePath(),
    ].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(save => {
      try { localStorage.setItem('nexus_code_repair_save_v1', save); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ }
    }, makeSave());
    await ctx.route('**/*', route => /fonts\.(googleapis|gstatic)/.test(route.request().url()) ? route.abort() : route.continue());
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => {
      if (m.type() === 'error' && !/wasm|WebAssembly|favicon|ERR_FAILED|fonts\.(googleapis|gstatic)/i.test(m.text())) errors.push(m.text());
    });

    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, 'ENTER NEXUS', 60000);
    await clickButton(page, 'ENTER NEXUS');
    await waitText(page, 'Python 知识库', 60000);
    await clickButton(page, '继续探索');
    await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000);

    let stable = true;
    for (let i = 0; i < 10; i++) {
      await enterBossFromMap(page);
      await sleep(350);
      await clickButton(page, '撤退');
      await waitText(page, 'NEXUS 数字世界 · 服务器网络', 20000);
      const a = await consciousness(page);
      await sleep(1600);
      const b = await consciousness(page);
      if (!(a === b)) { stable = false; console.log('  cycle ' + (i + 1) + ' consciousness ' + a + ' → ' + b); }
    }
    ok(stable, '10 次进入/退出后地图上意识值稳定（无残留攻击 Timer）');
    ok(errors.length === 0, '10 次进出无未捕获异常 / 控制台错误', errors.slice(0, 3).join(' | '));
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    ok(save && save.player.progress.bossBattles['gate-01'], 'Boss 战斗状态未因反复进出损坏');
    await ctx.close();
  } finally {
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => server.close(r));
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('稳定性测试失败:', e && e.message ? e.message : e); process.exit(1); });
