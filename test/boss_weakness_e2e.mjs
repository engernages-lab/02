// V1.3-B.3 真实浏览器 E2E（Playwright + 真实 Chrome + 真实 MicroPython/Judge）
// 主流程使用生产构建静态服务（稳定）；DEV 面板单独短 session 验证。
// 流程：线索 → 发现 → 破解失败/成功 → 暴露 → 伤害结转 → 阶段切换 → 刷新恢复 → 胜利清理
// 执行：node test/boss_weakness_e2e.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b3-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 4400 + Math.floor(Math.random() * 150);
const DEV_PORT = 5600 + Math.floor(Math.random() * 150);
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
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: { 'bossIntro_gate-01': true },
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: {
        prologueDone: true, tutorialCinematicShown: true, chapter1Done: true,
        chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true,
      },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
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
    try { const r = await fetch(url); if (r.ok) return true; } catch { /* retry */ }
    await sleep(300);
  }
  throw new Error('服务器未就绪: ' + url);
}
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
async function clickThroughDialog(page, maxSteps = 30) {
  for (let i = 0; i < maxSteps; i++) {
    const dlg = page.locator('.dlg-root').first();
    if (!(await dlg.isVisible().catch(() => false))) return;
    const skip = page.locator('button', { hasText: '跳过' }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
    else await dlg.click({ position: { x: 24, y: 24 } }).catch(() => {});
    await sleep(180);
  }
}
async function enterBoss(page) {
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
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const cont = page.locator('button', { hasText: '继续挑战' }).first();
  if (await cont.isVisible().catch(() => false)) await cont.click();
  else await clickButton(page, '开始挑战');
  await page.locator('.diff-panel').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
}
async function setEditorCode(page, code, last = false) {
  const viaMonaco = await page.evaluate(({ c, useLast }) => {
    const monaco = window.monaco;
    if (!monaco || !monaco.editor) return false;
    const models = monaco.editor.getModels();
    if (!models.length) return false;
    const model = useLast ? models[models.length - 1] : models[0];
    model.setValue(c);
    return true;
  }, { c: code, useLast: last }).catch(() => false);
  if (viaMonaco) { await sleep(150); return true; }
  const ta = page.locator('.monaco-editor textarea').first();
  await ta.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(code);
  await sleep(180);
  return false;
}
async function consciousness(page) {
  const body = await textOf(page);
  const m = body.match(/意识\s*(\d+)%/);
  return m ? Number(m[1]) : NaN;
}
async function waitWarning(page, timeout = 45000) {
  await page.locator('.attack-warning').first().waitFor({ state: 'visible', timeout });
  return (await page.locator('.attack-warning .aw-name').first().innerText()).trim();
}
async function remainingSeconds(page) {
  const t = await page.locator('.attack-warning .aw-time').first().innerText().catch(() => '');
  const m = t.match(/([\d.]+)s/);
  return m ? Number(m[1]) : null;
}
async function waitUntilRemaining(page, threshold, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (!(await page.locator('.attack-warning').first().isVisible().catch(() => false))) return false;
    const rem = await remainingSeconds(page);
    if (rem != null && rem <= threshold) return true;
    await sleep(40);
  }
  return false;
}
async function warningGone(page) {
  await page.locator('.attack-warning').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}
async function clueCount(page) {
  return page.locator('.weakness-clue:not(.locked)').count();
}
async function saveData(page) {
  return page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; }
  });
}

const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
const P2 = 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"';
const P3 = 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))';
const P4 = 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))';
const CRACK1_BAD = 'def bypass(level, backup):\n    return False';
const CRACK1_OK = 'def bypass(level, backup):\n    if level >= 50 and backup:\n        return True\n    return False';
const CRACK2_OK = 'def verify(a, b, c):\n    return a and b and c';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
function staticServer(distRoot, port) {
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
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

async function acquireClues(page) {
  for (let attempt = 0; attempt < 5; attempt++) {
    if ((await clueCount(page)) >= 2) return true;
    await waitWarning(page, 45000);
    if (!(await waitUntilRemaining(page, 0.6))) { await warningGone(page); continue; }
    await clickButton(page, '防御', '.boss-attack-panel button');
    await waitText(page, '防御成功', 12000).catch(() => {});
    await warningGone(page);
    if ((await clueCount(page)) >= 2) return true;
  }
  return (await clueCount(page)) >= 2;
}

(async () => {
  let browser;
  const distRoot = join(root, 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist，请先 npm run build');
  const server = await staticServer(distRoot, DIST_PORT);
  let dev = null;
  try {
    const chromePath = [
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      chromium.executablePath(),
    ].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    console.log('浏览器:', chromePath || '(Playwright bundled)');
    const blockFonts = route => {
      const u = route.request().url();
      if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return route.abort();
      return route.continue();
    };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(save => {
      try {
        if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', save);
        localStorage.setItem('nexus_dev_tools', '1');
      } catch { /* ignore */ }
    }, makeSave());
    await ctx.route('**/*', blockFonts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => {
      if (m.type() === 'error' && !/wasm|WebAssembly|favicon|ERR_FAILED|fonts\.(googleapis|gstatic)/i.test(m.text())) errors.push(m.text());
    });

    console.log('=== A. 发现弱点 ===');
    await page.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    await waitWarning(page, 45000);
    await waitText(page, 'BOSS WEAKNESS', 15000);
    ok(true, '战斗页显示 BOSS WEAKNESS 面板');
    ok(!(await textOf(page)).includes('弱点测试面板'), '生产构建中 DEV 弱点面板不可见');
    ok(await acquireClues(page), '通过攻击预警 + 防御获得 2 条弱点线索');
    ok((await textOf(page)).includes('已获得 2 / 2 条线索') || (await clueCount(page)) >= 2, '线索数量达到分析条件');
    await page.screenshot({ path: join(evidence, '01-clues.png'), fullPage: false });

    await clickButton(page, '分析弱点', '.boss-weakness-panel button');
    await waitText(page, '解析中', 5000).catch(() => {});
    await waitText(page, '弱点已发现', 12000);
    ok(true, '线索分析完成 → 弱点已发现');
    await page.screenshot({ path: join(evidence, '02-weakness-discovered.png'), fullPage: false });

    console.log('=== B. 破解弱点 ===');
    await clickButton(page, '开始弱点破解', '.boss-weakness-panel button');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'visible', timeout: 15000 });
    ok(true, '弱点破解覆盖层打开');
    await setEditorCode(page, CRACK1_BAD, true);
    await clickButton(page, '提交破解');
    await waitText(page, '破解失败', 30000);
    ok(true, '错误代码真实判题失败并显示反馈');
    await page.screenshot({ path: join(evidence, '03-crack-failed.png'), fullPage: false });
    await setEditorCode(page, CRACK1_OK, true);
    await clickButton(page, '提交破解');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'hidden', timeout: 60000 });
    await page.locator('.weakness-exposure-banner').waitFor({ state: 'visible', timeout: 20000 });
    ok(true, '正确代码真实判题成功 → 弱点暴露');
    await page.screenshot({ path: join(evidence, '04-weakness-exposed.png'), fullPage: false });

    console.log('=== C. 暴露伤害结转 ===');
    await sleep(400);
    await setEditorCode(page, P1, false);
    await clickButton(page, '提交攻击');
    await page.locator('.phase-transition-banner').waitFor({ state: 'visible', timeout: 60000 });
    await waitText(page, '战斗阶段 2 / 3', 20000);
    await sleep(600);
    const saveCarry = await saveData(page);
    const hpCarry = saveCarry.player.progress.battles['gate-01'].hp;
    ok(hpCarry === 62, '弱点额外伤害结转到阶段 2：HP 75 → 62', String(hpCarry));
    ok((await textOf(page)).includes('62 / 100'), 'HUD 显示结转后的 62 / 100');
    await page.screenshot({ path: join(evidence, '05-stage2-carry.png'), fullPage: false });

    console.log('=== D. 阶段 2 弱点与阶段联动 ===');
    const weak1 = saveCarry.player.progress.bossWeaknesses['gate-01'];
    ok(weak1.entries['gate-01-w1'].status === 'recovered', '阶段 1 弱点暴露随阶段切换失效');
    ok(weak1.entries['gate-01-w2'] && weak1.entries['gate-01-w2'].status === 'hidden', '阶段 2 弱点已加载（hidden）');
    await waitWarning(page, 45000);
    ok(await waitUntilRemaining(page, 0.25), '等待阶段 2 闪避窗口');
    await clickButton(page, '闪避', '.boss-attack-panel button');
    await waitText(page, '闪避成功', 12000);
    await warningGone(page);
    ok((await clueCount(page)) >= 2, '阶段 2 线索收集完成');
    await clickButton(page, '分析弱点', '.boss-weakness-panel button');
    await waitText(page, '弱点已发现', 12000);
    await clickButton(page, '开始弱点破解', '.boss-weakness-panel button');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'visible', timeout: 15000 });
    await setEditorCode(page, CRACK2_OK, true);
    await clickButton(page, '提交破解');
    await page.locator('.weakness-crack-panel').waitFor({ state: 'hidden', timeout: 60000 });
    await page.locator('.weakness-exposure-banner').waitFor({ state: 'visible', timeout: 20000 });
    ok(true, '阶段 2 弱点破解成功并暴露');
    await page.screenshot({ path: join(evidence, '06-phase2-exposed.png'), fullPage: false });

    console.log('=== E. 刷新恢复 ===');
    await sleep(400);
    const beforeReload = await saveData(page);
    const w2Before = beforeReload.player.progress.bossWeaknesses['gate-01'].entries['gate-01-w2'];
    const hpBefore = beforeReload.player.consciousness;
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await sleep(2500);
    const afterReload = await saveData(page);
    const w2After = afterReload.player.progress.bossWeaknesses['gate-01'].entries['gate-01-w2'];
    ok(afterReload.player.consciousness === hpBefore, '刷新后意识值不变（无重复伤害）');
    ok(w2After.successCount === w2Before.successCount, '刷新不重复破解成功');
    ok(w2After.attempts === w2Before.attempts, '刷新不重置尝试次数');
    ok(w2After.status === 'exposed' || w2After.status === 'recovered', '暴露状态按剩余时间安全恢复');
    await enterBoss(page);
    await page.screenshot({ path: join(evidence, '07-refresh-recovered.png'), fullPage: false });

    console.log('=== F. 战斗终结与清理 ===');
    await setEditorCode(page, P2, false);
    await clickButton(page, '提交攻击');
    await waitText(page, '战斗阶段 3 / 3', 60000);
    await setEditorCode(page, P3, false);
    await clickButton(page, '提交攻击');
    await waitText(page, '阶段 4 / 4', 30000);
    await setEditorCode(page, P4, false);
    await clickButton(page, '提交攻击');
    await page.locator('.boss-complete').waitFor({ state: 'visible', timeout: 60000 });
    const victorySave = await saveData(page);
    ok(victorySave.player.progress.bossBattles['gate-01'].status === 'victory', '最终胜利正常结算');
    ok(!victorySave.player.progress.bossWeaknesses['gate-01'], '战斗结束后弱点状态被清理');
    await page.screenshot({ path: join(evidence, '08-victory.png'), fullPage: false });

    ok(errors.length === 0, '主流程页面无未捕获异常 / 业务控制台错误', errors.slice(0, 3).join(' | '));
    await ctx.close();

    console.log('=== G. DEV 弱点面板（短 session） ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], {
      cwd: root, stdio: 'ignore', env: { ...process.env },
    });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/', 60000);
    const devCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await devCtx.addInitScript(save => {
      try {
        if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', save);
        localStorage.setItem('nexus_dev_tools', '1');
      } catch { /* ignore */ }
    }, makeSave());
    await devCtx.route('**/*', blockFonts);
    const devPage = await devCtx.newPage();
    await devPage.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(devPage);
    await waitText(devPage, '弱点测试面板', 15000);
    ok(true, 'DEV 环境显示弱点测试面板');
    const beforeDev = await saveData(devPage);
    await clickButton(devPage, '注入全部线索');
    await waitText(devPage, '已注入该弱点全部线索', 8000);
    await clickButton(devPage, '模拟分析/发现');
    await waitText(devPage, '分析完成', 8000);
    await clickButton(devPage, '开始破解');
    await waitText(devPage, '破解开始', 8000);
    await clickButton(devPage, '模拟成功/暴露');
    await waitText(devPage, '模拟破解成功', 8000);
    await clickButton(devPage, '测试攻击中断');
    await waitText(devPage, '攻击联动', 8000);
    await clickButton(devPage, '模拟刷新恢复');
    await waitText(devPage, '模拟刷新', 8000);
    await clickButton(devPage, '重置测试状态');
    const afterDev = await saveData(devPage);
    ok(JSON.stringify(afterDev.player.progress.bossBattles) === JSON.stringify(beforeDev.player.progress.bossBattles), 'DEV 弱点操作不修改正式阶段状态');
    ok(JSON.stringify(afterDev.player.progress.bossBattleHistory || []) === JSON.stringify(beforeDev.player.progress.bossBattleHistory || []), 'DEV 弱点操作不写入正式战斗历史');
    await devPage.screenshot({ path: join(evidence, '09-dev-panel.png'), fullPage: false });
    await devCtx.close();
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => server.close(r));
  }

  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图目录：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => {
  console.error('E2E 失败:', e && e.message ? e.message : e);
  process.exit(1);
});
