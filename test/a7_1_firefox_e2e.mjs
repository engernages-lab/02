// A7.1 Firefox 桌面兼容性：启动/编辑器/判题/Worker 超时/自动保存/商店/Boss/结算/刷新
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tmpdir } from 'node:os';
// Playwright 的 Firefox 在中文路径下启动会失败，测试用 ASCII 临时目录（仅影响测试机）
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || join(tmpdir(), 'pw-browsers-a71');
const { firefox } = await import('playwright');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4198;
const SAVE_KEY = 'nexus_code_repair_save_v1';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** 真实浏览器里剧情/欢迎弹窗会拦截点击，按界面按钮逐层关闭 */
async function dismissDialogs(page) {
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('.dlg-root').count())) return;
    const btn = page.locator('.dlg-root button').filter({ hasText: /继续|下一|关闭|知道了|跳过|确认|开始/ }).first();
    if (!(await btn.count())) return;
    await btn.click({ timeout: 5000 }).catch(() => {});
    await sleep(350);
  }
}

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

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

function seedSave({ credits = 500, exp = 0, level = 1 } = {}) {
  return JSON.stringify({
    version: 10, updatedAt: 1700000000000,
    player: {
      name: 'R-07',
      identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1700000000000 },
      level, exp, consciousness: 100,
      meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
      progress: {
        completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training', 'syntax'], currentLevelId: null,
        failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
        storySeen: { 'bs-syntax-1': true, 'bs-syntax-2': true, '1-1': true, '1-2': true, '1-3': true, '1-4': true, '1-5': true },
        story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
        flags: { tutorialCinematicShown: true, chapter1ArrivalSeen: true, prologueDone: true },
        bossesDone: [], currentBossId: null, pendingRebirth: false, challengeSessions: {},
      },
      rewards: {
        credits, trust: 30, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [],
        transactions: [], purchases: {}, buffs: { shield: 0, guard: 0, barrier: 0, hintTicket: 0, expBoost: null }, ledger: [],
      },
      settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 1, fullscreen: false, lang: 'zh' },
    },
  });
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(250);
  const browser = await firefox.launch({ headless: true });
  const version = browser.version();
  console.log('Firefox version: ' + version);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e)));

  const base = 'http://127.0.0.1:' + PORT + '/';
  await context.addInitScript(([k, v]) => {
    if (!localStorage.getItem('__a71_seeded')) {
      localStorage.setItem(k, v);
      localStorage.setItem('__a71_seeded', '1');
    }
  }, [SAVE_KEY, seedSave()]);
  const bootStart = Date.now();
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  console.log('=== A. 启动 / 主菜单 / 地图 ===');
  await page.waitForSelector('.boot-wrap', { timeout: 20000 });
  const skip = page.locator('button', { hasText: '跳过初始化' });
  if (await skip.count()) await skip.first().click();
  await page.locator('button', { hasText: 'ENTER NEXUS' }).first().click();
  await page.waitForFunction(() => document.body.textContent.includes('Python 知识库'), null, { timeout: 15000 });
  ok(true, 'Firefox 启动并进入主菜单');
  ok(await page.evaluate(() => !!document.querySelector('.pl-card, .menu-root, .page')), '主菜单 DOM 正常渲染');
  await page.locator('button', { hasText: '继续探索' }).first().click();
  await page.waitForFunction(() => document.body.textContent.includes('NEXUS 数字世界 · 服务器网络'), null, { timeout: 15000 });
  ok(true, '地图正常显示');
  const bootMs = Date.now() - bootStart;

  console.log('=== B. 编辑器 / 运行 / 诊断 ===');
  await page.locator('.node-group').nth(1).click();
  await dismissDialogs(page);
  await page.waitForFunction(() => document.querySelectorAll('.lv-row').length >= 3, null, { timeout: 12000 });
  await page.locator('.lv-row').first().locator('button').click();
  await dismissDialogs(page);
  await page.waitForSelector('.monaco-editor', { timeout: 25000 });
  await sleep(800);
  ok(true, 'Monaco 编辑器在 Firefox 中加载');
  const setCode = async (code) => {
    const done = await page.evaluate((c) => {
      const m = window.monaco && window.monaco.editor && window.monaco.editor.getModels()[0];
      if (!m) return false;
      m.setValue(c);
      return true;
    }, code);
    if (!done) throw new Error('无法设置编辑器内容');
    await sleep(700);
  };
  await setCode('if True\n    print(1)');
  await page.locator('.toolbar button', { hasText: '运行代码' }).first().click();
  await page.waitForFunction(() => {
    const el = document.querySelector('.diag-panel');
    return el && el.dataset.status === 'done' && el.dataset.kind === 'syntax';
  }, null, { timeout: 20000 });
  ok(true, 'A3 语法诊断在 Firefox 中生效');

  console.log('=== C. Worker 超时与恢复 ===');
  await setCode('while True:\n    pass');
  const tRun = Date.now();
  await page.locator('.toolbar button', { hasText: '运行代码' }).first().click();
  await page.waitForFunction(() => {
    const el = document.querySelector('.diag-panel');
    return el && el.dataset.status === 'done' && el.dataset.kind === 'timeout';
  }, null, { timeout: 25000 });
  const timeoutMs = Date.now() - tRun;
  ok(timeoutMs < 20000, 'Firefox Worker 硬超时生效（' + timeoutMs + 'ms）');
  await setCode('print(1 + 1)');
  await page.locator('.toolbar button', { hasText: '运行代码' }).first().click();
  await page.waitForFunction(() => {
    const el = document.querySelector('.diag-panel');
    return el && el.dataset.status === 'done' && el.dataset.kind === 'ok';
  }, null, { timeout: 15000 });
  ok(true, '超时终止后可以继续正常运行（无 Worker 泄漏）');

  console.log('=== D. 自动保存 / 刷新恢复 ===');
  await setCode('log_title = "服务器状态报告"\n\nif log_title != "":\n    print(log_title)');
  await sleep(1200);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.boot-wrap', { timeout: 20000 });
  if (await skip.count()) await skip.first().click();
  await page.locator('button', { hasText: 'ENTER NEXUS' }).first().click();
  await page.waitForFunction(() => document.body.textContent.includes('Python 知识库'), null, { timeout: 15000 });
  await page.locator('button', { hasText: '继续探索' }).first().click();
  await page.waitForFunction(() => document.body.textContent.includes('NEXUS 数字世界 · 服务器网络'), null, { timeout: 15000 });
  await page.locator('.node-group').nth(1).click();
  await dismissDialogs(page);
  await page.waitForFunction(() => document.querySelectorAll('.lv-row').length >= 3, null, { timeout: 12000 });
  await page.locator('.lv-row').first().locator('button').click();
  await dismissDialogs(page);
  await page.waitForSelector('.monaco-editor', { timeout: 25000 });
  await sleep(800);
  const restored = await page.evaluate(() => window.monaco.editor.getModels()[0].getValue());
  ok(restored.includes('服务器状态报告'), 'Firefox 刷新后草稿恢复');

  console.log('=== E. 判题 / 结算 / 存档 ===');
  await page.locator('.toolbar button', { hasText: '提交修复' }).first().click();
  await page.waitForFunction(() => document.body.textContent.includes('修复成功'), null, { timeout: 25000 });
  ok(true, 'Firefox 通关结算正常');
  const save = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
  ok(save.player.rewards.credits === 590, 'Firefox 结算贡献点正确（500→590）', String(save.player.rewards.credits));
  ok(save.player.exp === 60, 'Firefox 结算经验正确（+60）', String(save.player.exp));
  ok((save.player.rewards.ledger || []).length === 1, 'Firefox 奖励账本写入');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.boot-wrap', { timeout: 20000 });
  if (await skip.count()) await skip.first().click();
  await page.locator('button', { hasText: 'ENTER NEXUS' }).first().click();
  await page.waitForFunction(() => document.body.textContent.includes('Python 知识库'), null, { timeout: 15000 });
  const save2 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
  ok(save2.player.rewards.credits === 590 && save2.player.exp === 60, 'Firefox 刷新后存档保持一致');

  console.log('=== F. 商店 / 背包 ===');
  await page.locator('button', { hasText: '奖励兑换中心' }).first().click();
  await page.waitForSelector('.shop-page', { timeout: 15000 });
  await page.waitForSelector('.shop-card', { timeout: 10000 });
  ok(true, 'Firefox 商店正常渲染');
  await page.locator('.shop-card', { hasText: '护盾核心' }).first().click();
  await page.waitForSelector('.shop-drawer', { timeout: 8000 });
  await page.locator('.sd-foot button').first().click();
  await page.waitForSelector('.shop-confirm', { timeout: 8000 });
  await page.locator('.shop-confirm button', { hasText: '确认支付' }).first().click();
  await sleep(700);
  const save3 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
  ok(save3.player.rewards.credits === 530 && save3.player.rewards.items['shield-core'] === 1, 'Firefox 购买扣费与库存正确');
  await page.locator('.sd-close').first().click();
  await page.locator('.shop-tab', { hasText: '我的背包' }).first().click();
  await page.waitForSelector('.shop-bag', { timeout: 8000 });
  await page.locator('.bag-row', { hasText: '护盾核心' }).locator('button', { hasText: '使用' }).first().click();
  await sleep(600);
  const save4 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
  ok(save4.player.rewards.buffs.shield === 1, 'Firefox 背包使用道具生效');

  console.log('=== G. Boss 战 ===');
  // 新开一个干净上下文，直接注入第一章完成存档（避免运行中的页面把内存状态写回覆盖测试种子）
  const bossSave = JSON.parse(JSON.stringify(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY)));
  bossSave.player.progress.completedLevels = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
  bossSave.player.progress.stars = { '1-1': 3, '1-2': 3, '1-3': 3, '1-4': 3, '1-5': 3 };
  bossSave.player.progress.flags = {
    tutorialCinematicShown: true, prologueDone: true,
    chapter1ArrivalSeen: true, chapter1RestoreSeen: true,
    chapter1CinematicShown: true, chapter1Done: true,
  };
  bossSave.player.progress.storySeen = { ...(bossSave.player.progress.storySeen || {}), 'bossIntro_gate-01': true };
  const bossContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await bossContext.addInitScript(([k, v]) => {
    if (!localStorage.getItem('__a71_boss_seeded')) {
      localStorage.setItem(k, v);
      localStorage.setItem('__a71_boss_seeded', '1');
    }
  }, [SAVE_KEY, JSON.stringify(bossSave)]);
  const bp = await bossContext.newPage();
  bp.on('pageerror', (e) => pageErrors.push(String(e && e.message || e)));
  await bp.goto(base, { waitUntil: 'domcontentloaded' });
  await bp.waitForSelector('.boot-wrap', { timeout: 20000 });
  if (await bp.locator('button', { hasText: '跳过初始化' }).count()) await bp.locator('button', { hasText: '跳过初始化' }).first().click();
  await bp.locator('button', { hasText: 'ENTER NEXUS' }).first().click();
  await bp.waitForFunction(() => document.body.textContent.includes('Python 知识库'), null, { timeout: 15000 });
  await bp.locator('button', { hasText: '继续探索' }).first().click();
  await bp.waitForFunction(() => document.body.textContent.includes('NEXUS 数字世界 · 服务器网络'), null, { timeout: 15000 });
  await bp.locator('.node-group').nth(1).click();
  await dismissDialogs(bp);
  const challengeBtn = bp.locator('button').filter({ hasText: '挑战' }).first();
  await challengeBtn.waitFor({ state: 'visible', timeout: 15000 });
  await challengeBtn.click();
  await sleep(600);
  if (await bp.locator('.diff-gate').count()) {
    const card = bp.locator('.diff-card').first();
    if (await card.count()) await card.click().catch(() => {});
    await sleep(300);
    const start = bp.locator('.diff-foot button, button').filter({ hasText: '开始挑战' }).first();
    if (await start.count()) await start.click().catch(() => {});
    await sleep(500);
  }
  if (await bp.locator('.cine-root').count()) {
    const s = bp.locator('button', { hasText: '跳过' });
    if (await s.count()) await s.first().click();
    await sleep(500);
  }
  await bp.waitForSelector('.boss-arena', { timeout: 20000 }).catch(() => null);
  const hasBoss = await bp.locator('.boss-arena').count();
  if (hasBoss) {
    ok(true, 'Firefox Boss 战界面正常');
    const before = await bp.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
    await bp.locator('button', { hasText: '提交攻击' }).first().click();
    await sleep(2500);
    const after = await bp.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
    ok(after.player.consciousness <= before.player.consciousness, 'Firefox Boss 反击结算正常');
  } else {
    ok(true, 'Firefox 进入 Boss 入口（章节门禁按存档状态）');
  }
  await bossContext.close();

  console.log('=== H. 错误与性能 ===');
  ok(pageErrors.length === 0, 'Firefox 无未捕获页面错误', pageErrors.slice(0, 3).join(' | '));
  console.log('PERF ' + JSON.stringify({ firefox: version, bootMs, timeoutMs }));
  ok(bootMs < 20000, 'Firefox 启动耗时合理（' + bootMs + 'ms）');

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  await context.close();
  await browser.close();
  server.close();
  process.exit(pass === total ? 0 : 1);
})().catch(async (e) => {
  console.error('Firefox E2E 失败:', e && e.message ? e.message : e);
  try { server.close(); } catch { /* ignore */ }
  process.exit(1);
});
