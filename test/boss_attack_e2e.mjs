// V1.3-B.2 真实浏览器 E2E（Playwright Chromium + 真实 MicroPython）
// 流程：预警 → 防御 → 闪避 → 未响应受伤 → 冷却 → 阶段切换攻击模式变化 → 刷新恢复 → 退出清理 → DEV / 生产校验
// 执行：node test/boss_attack_e2e.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b2-evidence');
mkdirSync(evidence, { recursive: true });

const DEV_PORT = 5180 + Math.floor(Math.random() * 150);
const DIST_PORT = 4330 + Math.floor(Math.random() * 150);
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
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {},
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
async function consciousness(page) {
  const body = await textOf(page);
  const m = body.match(/意识\s*(\d+)%/);
  return m ? Number(m[1]) : NaN;
}
async function attackPanelText(page) {
  return page.locator('.boss-attack-panel').first().innerText().catch(() => '');
}
async function waitWarning(page, timeout = 45000) {
  await page.locator('.attack-warning').first().waitFor({ state: 'visible', timeout });
  const name = await page.locator('.attack-warning .aw-name').first().innerText();
  return name.trim();
}
async function remainingSeconds(page) {
  const t = await page.locator('.attack-warning .aw-time').first().innerText().catch(() => '');
  const m = t.match(/([\d.]+)s/);
  return m ? Number(m[1]) : null;
}
/** 等到预警剩余时间 <= threshold；超时/预警消失返回 false */
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
async function saveData(page) {
  return page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; }
  });
}
async function warningGone(page) {
  await page.locator('.attack-warning').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

const SOLUTION_P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';

(async () => {
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
  });
  dev.stdout.on('data', d => { const s = d.toString().trim(); if (s) console.log('[vite]', s.slice(0, 300)); });
  dev.stderr.on('data', d => { const s = d.toString().trim(); if (s) console.log('[vite-err]', s.slice(0, 500)); });
  dev.on('exit', (code, signal) => console.log('DEV SERVER EXIT:', code, signal));
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

    console.log('=== 1. 进入战斗与攻击预警 ===');
    await page.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    ok(await page.locator('.boss-attack-panel').first().isVisible(), '战斗页显示 Boss 攻击面板');
    const firstName = await waitWarning(page, 45000);
    ok(!!firstName, 'Boss 主动发动攻击并显示预警：' + firstName);
    ok((await attackPanelText(page)).includes('攻击模式'), '攻击面板显示当前攻击模式');
    ok((await textOf(page)).includes('建议'), '预警显示推荐应对方式');
    const rem1 = await remainingSeconds(page);
    ok(rem1 != null && rem1 > 0, '预警倒计时正常：' + rem1 + 's');
    await page.screenshot({ path: join(evidence, '01-attack-warning.png'), fullPage: false });

    console.log('=== 2. 防御（真实时间窗口） ===');
    const beforeDef = await consciousness(page);
    ok(await waitUntilRemaining(page, 0.6), '等待防御时机（预警剩余 ≤0.6s）');
    await clickButton(page, '防御', '.boss-attack-panel button');
    await waitText(page, '防御成功', 12000);
    await page.locator('.battle-log-line', { hasText: '防御成功' }).first().waitFor({ state: 'visible', timeout: 12000 });
    await sleep(500);
    const afterDef = await consciousness(page);
    ok(afterDef <= beforeDef, '防御后意识值不增加');
    ok(afterDef < beforeDef, '防御后仍受到减伤伤害（>0）', beforeDef + ' → ' + afterDef);
    ok(afterDef >= beforeDef - 4, '防御有效减少伤害（实际 ≤4）', beforeDef + ' → ' + afterDef);
    ok((await textOf(page)).includes('防御姿态') || (await textOf(page)).includes('防御成功'), 'UI 反馈防御成功');
    await warningGone(page);
    await page.screenshot({ path: join(evidence, '02-defense-blocked.png'), fullPage: false });

    console.log('=== 3. 闪避（真实时间窗口） ===');
    await waitWarning(page, 45000);
    const beforeDodge = await consciousness(page);
    ok(await waitUntilRemaining(page, 0.25), '等待闪避时机（预警剩余 ≤0.25s）');
    await clickButton(page, '闪避', '.boss-attack-panel button');
    await waitText(page, '闪避成功', 12000);
    await sleep(600);
    const afterDodge = await consciousness(page);
    ok(afterDodge === beforeDodge, '闪避成功：意识值不变', beforeDodge + ' → ' + afterDodge);
    await warningGone(page);
    await page.screenshot({ path: join(evidence, '03-dodge-success.png'), fullPage: false });

    console.log('=== 4. 未响应受到真实伤害 ===');
    await waitWarning(page, 45000);
    const beforeHit = await consciousness(page);
    await waitText(page, '受到「', 15000);
    await sleep(600);
    const afterHit = await consciousness(page);
    ok(afterHit < beforeHit, '未响应受到真实意识伤害', beforeHit + ' → ' + afterHit);
    await warningGone(page);
    await page.screenshot({ path: join(evidence, '04-hit-damage.png'), fullPage: false });

    console.log('=== 5. 冷却与下一次攻击 ===');
    await waitText(page, '冷却中', 12000).catch(() => {});
    const cooldownSeen = (await attackPanelText(page)).includes('冷却') || (await textOf(page)).includes('冷却中');
    ok(cooldownSeen, '攻击结束后进入冷却');
    const warningsBefore = await page.locator('.attack-warning').count();
    const secondName = await waitWarning(page, 30000);
    ok(!!secondName, '冷却结束后进入下一次攻击');

    console.log('=== 6. 阶段切换 → 新阶段攻击模式 ===');
    // 在冷却 / 预警阶段提交阶段 1 正确答案，触发阶段切换
    await setCode(page, SOLUTION_P1);
    await clickButton(page, '提交攻击');
    await page.locator('.phase-transition-banner').first().waitFor({ state: 'visible', timeout: 60000 });
    await waitText(page, '战斗阶段 2 / 3', 20000);
    ok(true, '阶段切换成功');
    let phase2Name = '';
    const tPhase = Date.now();
    while (Date.now() - tPhase < 30000) {
      const w = page.locator('.attack-warning').first();
      if (await w.isVisible().catch(() => false)) {
        phase2Name = (await page.locator('.attack-warning .aw-name').first().innerText()).trim();
        break;
      }
      await sleep(200);
    }
    ok(['连续代码冲击', '协议锁定'].includes(phase2Name), '新阶段加载阶段 2 攻击模式：' + phase2Name);
    await page.screenshot({ path: join(evidence, '05-stage2-attack.png'), fullPage: false });

    console.log('=== 7. 刷新恢复（预警中刷新不重复伤害） ===');
    await waitWarning(page, 45000);
    await sleep(300);
    const saveBeforeReload = await saveData(page);
    const beforeReloadHp = saveBeforeReload.player.consciousness;
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/', 5000);
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await sleep(2500);
    const saveAfterReload = await saveData(page);
    ok(saveAfterReload.player.consciousness === beforeReloadHp, '刷新后意识值不变（无重复伤害）');
    const atk = saveAfterReload.player.progress.bossAttacks['gate-01'];
    ok(atk && atk.attackState !== 'telegraph' && atk.attackState !== 'attacking', '刷新后预警/攻击状态被安全取消');
    await enterBoss(page);
    await page.screenshot({ path: join(evidence, '06-refresh-recovered.png'), fullPage: false });

    console.log('=== 8. 页面退出清理 ===');
    await waitWarning(page, 45000);
    await sleep(300);
    const exitSave = await saveData(page);
    const exitHp = exitSave.player.consciousness;
    await page.close();
    await sleep(1500);
    const page2 = await ctx.newPage();
    await page2.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await sleep(2500);
    const afterExit = await saveData(page2);
    ok(afterExit.player.consciousness === exitHp, '关闭页面后攻击计时器不继续造成伤害');
    const exitAtk = afterExit.player.progress.bossAttacks['gate-01'];
    ok(!exitAtk || (exitAtk.attackState !== 'telegraph' && exitAtk.attackState !== 'attacking'), '重新载入后无残留预警状态');

    console.log('=== 9. DEV 攻击测试面板 ===');
    const devPage = page2;
    await enterBoss(devPage);
    await waitText(devPage, '攻击测试面板', 15000);
    ok(true, 'DEV 环境显示攻击测试面板');
    const beforeDev = await saveData(devPage);
    await clickButton(devPage, '手动开始攻击');
    await waitText(devPage, '已开始预警', 8000);
    await clickButton(devPage, '推进至结算');
    await waitText(devPage, '推进至结算/冷却', 8000);
    ok((await textOf(devPage)).includes('合计伤害'), 'DEV 面板可推演攻击结算并显示伤害');
    await clickButton(devPage, '重置攻击状态');
    const afterDev = await saveData(devPage);
    ok(JSON.stringify(afterDev.player.progress.bossBattles) === JSON.stringify(beforeDev.player.progress.bossBattles), 'DEV 攻击操作不修改正式阶段运行状态');
    ok(JSON.stringify(afterDev.player.progress.bossBattleHistory || []) === JSON.stringify(beforeDev.player.progress.bossBattleHistory || []), 'DEV 攻击操作不写入战斗历史');
    await devPage.screenshot({ path: join(evidence, '07-dev-panel.png'), fullPage: false });

    ok(errors.length === 0, '页面无未捕获异常 / 业务控制台错误', errors.slice(0, 3).join(' | '));
    await ctx.close();

    console.log('=== 10. 生产构建校验 ===');
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
      await prodCtx.route('**/*', blockFonts);
      const prodPage = await prodCtx.newPage();
      await prodPage.goto('http://127.0.0.1:' + DIST_PORT + '/?dev=1', { waitUntil: 'commit', timeout: 60000 });
      await enterBoss(prodPage);
      const prodText = await textOf(prodPage);
      ok(!prodText.includes('攻击测试面板'), '生产构建中 DEV 攻击面板不可见');
      ok(await prodPage.locator('.boss-attack-panel').first().isVisible(), '生产构建中攻击系统正常运行');
      const prodWarn = await waitWarning(prodPage, 45000).catch(() => '');
      ok(!!prodWarn, '生产构建中攻击预警正常：' + prodWarn);
      await prodPage.screenshot({ path: join(evidence, '08-production.png'), fullPage: false });
      await prodCtx.close();
      await new Promise(r => staticServer.close(r));
    } else {
      ok(false, '缺少 dist 生产构建');
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
