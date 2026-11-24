// V1.3-B.1 真实浏览器 E2E（Playwright Chromium + 真实 MicroPython）
// 流程：进入 GATE-01 真实战斗 → 三战斗阶段 → 阶段切换演出 → 刷新恢复 → 最终胜利 → 奖励/存档校验
// DEV 面板验证；生产构建（dist）验证入口不可见。
// 执行：node test/boss_phase_e2e.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b1-evidence');
mkdirSync(evidence, { recursive: true });

const DEV_PORT = 5180 + Math.floor(Math.random() * 80);
const DIST_PORT = 4300 + Math.floor(Math.random() * 80);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave({ seenIntro = true } = {}) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: seenIntro ? { 'bossIntro_gate-01': true } : {},
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: {
        prologueDone: true, tutorialCinematicShown: true, chapter1Done: true,
        chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true,
      },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {},
      currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player });
}

async function waitServer(url, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch { /* retry */ }
    await sleep(300);
  }
  throw new Error('服务器未就绪: ' + url);
}

const textOf = (page) => page.evaluate(() => document.body.innerText || '');
async function waitText(page, text, timeout = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const body = await textOf(page);
    if (body.includes(text)) return true;
    await sleep(150);
  }
  throw new Error('等待文本超时: ' + text);
}
async function clickButton(page, text, timeout = 15000) {
  const btn = page.locator('button', { hasText: text }).first();
  await btn.waitFor({ state: 'visible', timeout });
  await btn.click();
}
async function setCode(page, code) {
  const viaMonaco = await page.evaluate((c) => {
    const monaco = window.monaco;
    if (!monaco || !monaco.editor) return false;
    const models = monaco.editor.getModels();
    if (!models.length) return false;
    models[0].setValue(c);
    return true;
  }, code).catch(() => false);
  if (viaMonaco) { await sleep(120); return true; }
  const ta = page.locator('.monaco-editor textarea').first();
  await ta.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(code);
  await sleep(150);
  return false;
}
async function clickThroughDialog(page, maxSteps = 30) {
  for (let i = 0; i < maxSteps; i++) {
    const dlg = page.locator('.dlg-root').first();
    if (!(await dlg.isVisible().catch(() => false))) return;
    const skip = page.locator('button', { hasText: '跳过' }).first();
    if (await skip.isVisible().catch(() => false)) { await skip.click().catch(() => {}); }
    else { await dlg.click({ position: { x: 24, y: 24 } }).catch(() => {}); }
    await sleep(180);
  }
}
async function enterBoss(page, { continueFight = false } = {}) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const bootSkip = page.locator('button', { hasText: '跳过初始化' }).first();
  if (await bootSkip.isVisible().catch(() => false)) await bootSkip.click();
  await clickButton(page, 'ENTER NEXUS');
  await waitText(page, 'Python 知识库', 60000);
  await clickButton(page, '继续探索');
  await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000);
  await page.locator('.node-group').nth(1).click();
  await sleep(250);
  await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸');
  await sleep(250);
  await clickThroughDialog(page);
  // 战前演出（若出现）
  const skip = page.locator('button', { hasText: '跳过' }).first();
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  // 难度界面完全渲染后再判断：已有进度用「继续挑战」，否则「开始挑战」
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const cont = page.locator('button', { hasText: '继续挑战' }).first();
  if (await cont.isVisible().catch(() => false)) { await cont.click(); }
  else { await clickButton(page, '开始挑战'); }
  await page.locator('.diff-panel').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
}

const SOLUTIONS = [
  'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))',
  'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"',
  'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))',
  'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))',
];

async function submitAndWait(page, code, waitFor) {
  await setCode(page, code);
  await clickButton(page, '提交攻击');
  await waitFor();
}

(async () => {
  // ---------- 启动 Vite dev server（DEV 面板可用） ----------
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, stdio: 'ignore', env: { ...process.env },
  });
  let browser;
  try {
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/');
    const chromePath = [
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      chromium.executablePath(),
    ].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    console.log('浏览器:', chromePath || '(Playwright bundled)');
    console.log('Chromium:', await browser.version());
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(save => {
      try {
        // 只在首次加载写入种子存档；刷新时保留游戏进程写入的真实进度
        if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', save);
        localStorage.setItem('nexus_dev_tools', '1');
      } catch { /* ignore */ }
    }, makeSave());
    const blockFonts = route => {
      const u = route.request().url();
      if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return route.abort();
      return route.continue();
    };
    await ctx.route('**/*', blockFonts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => {
      if (m.type() === 'error' && !/wasm|WebAssembly|favicon|ERR_FAILED|fonts\.(googleapis|gstatic)/i.test(m.text())) errors.push(m.text());
    });

    console.log('=== 1. 进入真实 Boss 战斗 ===');
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    ok((await textOf(page)).includes('战斗阶段 1 / 3'), 'HUD 显示战斗阶段 1 / 3');
    ok((await textOf(page)).includes('能源封锁'), '第一阶段名称「能源封锁」');
    ok((await textOf(page)).includes('阶段 1 / 4'), '判题阶段进度仍为 1 / 4');
    await waitText(page, '多阶段测试入口', 15000);
    ok(true, 'DEV 环境显示测试入口');
    await page.screenshot({ path: join(evidence, '01-stage1.png'), fullPage: false });

    console.log('=== 2. DEV 入口自检（不写存档） ===');
    const beforeDev = await page.evaluate(() => localStorage.getItem('nexus_code_repair_save_v1'));
    await clickButton(page, '-25 伤害');
    await clickButton(page, '触发阶段切换');
    await waitText(page, '已触发切换', 5000);
    ok(true, 'DEV 入口可设置 HP 并触发阶段切换');
    await clickButton(page, '完成阶段切换');
    await waitText(page, '阶段初始化完成', 5000);
    ok(true, 'DEV 入口可完成阶段切换');
    await clickButton(page, '重置测试战斗');
    const afterDev = await page.evaluate(() => localStorage.getItem('nexus_code_repair_save_v1'));
    ok(beforeDev === afterDev, 'DEV 操作不污染正式存档');

    console.log('=== 3. 真实判题：阶段 1 → 阶段 2 ===');
    await submitAndWait(page, SOLUTIONS[0], async () => {
      await page.locator('.phase-transition-banner').waitFor({ state: 'visible', timeout: 60000 });
      ok((await textOf(page)).includes('防御协议'), '阶段切换演出显示第二阶段「防御协议」');
      await page.screenshot({ path: join(evidence, '02-phase-transition.png'), fullPage: false });
      await waitText(page, '战斗阶段 2 / 3', 20000);
    });
    ok(true, '阶段 1 击破并进入战斗阶段 2');
    await page.screenshot({ path: join(evidence, '03-stage2.png'), fullPage: false });

    console.log('=== 4. 刷新恢复 ===');
    const saveMid = await page.evaluate(() => localStorage.getItem('nexus_code_repair_save_v1'));
    const parsedMid = JSON.parse(saveMid);
    const runMid = parsedMid.player.progress.bossBattles['gate-01'];
    ok(runMid && runMid.currentPhaseIndex === 1, '存档：运行状态已推进到第二阶段');
    ok(parsedMid.player.progress.battles['gate-01'].hp === 75, '存档：真实战斗血量 75');
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    const refreshBody = await textOf(page);
    ok(refreshBody.includes('战斗阶段 2 / 3'), '刷新后恢复到战斗阶段 2 / 3', (refreshBody.match(/战斗阶段\s*\d\s*\/\s*\d/g) || []).join(','));
    ok(refreshBody.includes('防御协议'), '刷新后阶段名称保持「防御协议」');
    ok(!(await page.locator('.phase-transition-banner').isVisible().catch(() => false)), '刷新后不重复播放阶段切换');
    const historyBefore = (await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')))).player.progress.bossBattleHistory?.length || 0;
    ok(historyBefore === 0, '刷新后不重复生成战斗记录');
    await page.screenshot({ path: join(evidence, '04-refresh-recovered.png'), fullPage: false });

    console.log('=== 5. 阶段 2 → 阶段 3 ===');
    await submitAndWait(page, SOLUTIONS[1], async () => {
      try {
        await waitText(page, '战斗阶段 3 / 3', 30000);
      } catch (e) {
        const body = await textOf(page);
        console.log('DEBUG stage:', (body.match(/战斗阶段\s*\d\s*\/\s*\d/g) || []).join(','));
        console.log('DEBUG save run:', JSON.stringify(await page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('nexus_code_repair_save_v1'));
          return { battles: s.player.progress.battles['gate-01'], run: s.player.progress.bossBattles['gate-01'] };
        })).slice(0, 600));
        throw e;
      }
    });
    ok((await textOf(page)).includes('核心暴走'), '进入最终阶段「核心暴走」');
    await page.screenshot({ path: join(evidence, '05-stage3.png'), fullPage: false });

    console.log('=== 6. 最终阶段挑战与胜利 ===');
    await submitAndWait(page, SOLUTIONS[2], async () => {
      await waitText(page, '阶段 4 / 4', 30000);
      const body = await textOf(page);
      ok(body.includes('25 / 100') || body.includes('25%'), '第三阶段击破后血量 25');
    });
    await submitAndWait(page, SOLUTIONS[3], async () => {
      try {
        await page.locator('.boss-complete').waitFor({ state: 'visible', timeout: 60000 });
      } catch (e) {
        const dbg = await page.evaluate(() => {
          try {
            const s = JSON.parse(localStorage.getItem('nexus_code_repair_save_v1'));
            return {
              consciousness: s.player.consciousness,
              bossesDone: s.player.progress.bossesDone,
              fragments: s.player.meta.memoryFragments,
              chapters: s.player.progress.chapters,
              battles: s.player.progress.battles['gate-01'],
              run: s.player.progress.bossBattles['gate-01'],
              attack: s.player.progress.bossAttacks && s.player.progress.bossAttacks['gate-01'],
            };
          } catch { return null; }
        });
        console.log('DEBUG final:', JSON.stringify(dbg).slice(0, 1600));
        console.log('DEBUG dom:', await page.evaluate(() => ({
          fragGain: !!document.querySelector('.frag-gain'),
          complete: !!document.querySelector('.boss-complete'),
          overlay: !!document.querySelector('.overlay'),
          cine: !!document.querySelector('.cine-root'),
          dialog: !!document.querySelector('.dlg-root'),
        })));
        console.log('DEBUG text tail:', (await textOf(page)).slice(-1200));
        await page.screenshot({ path: join(evidence, 'fail-victory.png'), fullPage: false });
        throw e;
      }
    });
    ok((await textOf(page)).includes('已击破'), '最终胜利结算面板出现');
    await page.screenshot({ path: join(evidence, '06-victory.png'), fullPage: false });

    const saveEnd = await page.evaluate(() => JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')));
    const p = saveEnd.player;
    const runEnd = p.progress.bossBattles['gate-01'];
    ok(runEnd && runEnd.status === 'victory' && runEnd.battleResult === 'victory', '存档：多阶段战斗状态 victory');
    ok(runEnd && runEnd.currentPhaseIndex === 2, '存档：最终阶段索引 2');
    ok(Array.isArray(p.progress.bossBattleHistory) && p.progress.bossBattleHistory.length === 1, '存档：仅生成 1 条战斗记录（无重复）');
    ok(p.progress.bossBattleHistory[0].stats.damageDealt === 100, '存档：战斗记录累计伤害 100');
    ok(p.progress.bossBattleHistory[0].grade === null, '存档：战斗记录预留给 B.5 的 grade');
    ok(p.progress.battles['gate-01'].cleared === true, '存档：原 Boss 战斗状态已击破');
    ok((p.progress.bossesDone || []).includes('gate-01'), '存档：章节 Boss 已记录');
    ok((p.meta.memoryFragments || []).includes('frag-01'), '存档：首胜碎片已发放（frag-01）');
    ok(p.progress.bossPhaseProgress['gate-01'].clearedPhases.length >= 3, '存档：阶段进度已记录');

    const submitBtn = page.locator('button', { hasText: '提交攻击' }).first();
    ok(await submitBtn.isDisabled().catch(() => true), '胜利后提交按钮禁用（防重复结算）');

    ok(errors.length === 0, '页面无未捕获异常 / 控制台错误', errors.slice(0, 3).join(' | '));
    await ctx.close();

    console.log('=== 7. 生产构建：DEV 入口不可见 ===');
    const distRoot = join(root, 'dist');
    if (existsSync(join(distRoot, 'index.html'))) {
      const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
      const staticServer = createServer((req, res) => {
        try {
          let p = decodeURIComponent((req.url || '/').split('?')[0]);
          if (p === '/') p = '/index.html';
          const f = normalize(join(distRoot, p));
          if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
          res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
          res.end(readFileSync(f));
        } catch { res.writeHead(500); res.end('err'); }
      });
      await new Promise(r => staticServer.listen(DIST_PORT, '127.0.0.1', r));
      const prodCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await prodCtx.addInitScript(save => {
        try { localStorage.setItem('nexus_code_repair_save_v1', save); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ }
      }, makeSave());
      const prodPage = await prodCtx.newPage();
      await prodCtx.route('**/*', blockFonts);
      await prodPage.goto('http://127.0.0.1:' + DIST_PORT + '/?dev=1', { waitUntil: 'commit', timeout: 60000 });
      await enterBoss(prodPage);
      const prodText = await textOf(prodPage);
      ok(!prodText.includes('多阶段测试入口'), '生产构建中 DEV 入口不可见（URL 参数无效）');
      ok(prodText.includes('战斗阶段 1 / 3'), '生产构建正常显示多阶段战斗');
      await prodPage.screenshot({ path: join(evidence, '07-production.png'), fullPage: false });
      await prodCtx.close();
      await new Promise(r => staticServer.close(r));
    } else {
      ok(false, '缺少 dist 生产构建，无法验证 DEV 入口隐藏');
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    dev.kill();
  }

  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图目录：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => {
  console.error('E2E 失败:', e && e.message ? e.message : e);
  process.exit(1);
});
