// V1.3-B.4 真实浏览器 E2E：事件优先级 / 冲突仲裁 / 覆盖层互斥 / 终结清理 / 刷新幂等
// 主流程使用生产构建静态服务（刷新/生产校验），冲突与终结使用短 Vite dev session（DEV 面板）。
// 执行：node test/combat_arbiter_e2e.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b4-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 4600 + Math.floor(Math.random() * 100);
const DEV1_PORT = 5700 + Math.floor(Math.random() * 80);
const DEV2_PORT = 5800 + Math.floor(Math.random() * 80);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- TS loader（仅用于构造刷新恢复种子存档） ----
const ts = createRequire(join(root, 'package.json'))('typescript');
const cache = new Map();
function load(file) {
  const abs = file;
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = readFileSync(abs, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  cache.set(abs, mod);
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => {
    const b = join(dirname(abs), sp);
    const c = existsSync(b) && extname(b) ? b : existsSync(b + '.ts') ? b + '.ts' : b + '/index.ts';
    return load(c);
  });
  return mod.exports;
}
const L = (rel) => load(join(root, rel));

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function basePlayer(now) {
  return {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: { 'bossIntro_gate-01': true },
      story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {},
      currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
}
function makeSave() {
  return JSON.stringify({ version: 10, updatedAt: Date.now(), player: basePlayer(Date.now()) });
}
/** 刷新恢复种子：进行中 Boss 战 + 激活的未知入侵 + 仲裁记录 */
function makeRefreshSave() {
  const now = Date.now();
  const Phase = L('src/game/bossPhaseEngine.ts');
  const Plans = L('src/game/bossPhasePlans.ts');
  const A = L('src/game/combatEventArbiter.ts');
  const plan = Plans.buildBossPhasePlan('gate-01', 'easy');
  const run = Phase.startBossPhaseRun(plan, now, { battleId: 'battle@refresh-seed' }).run;
  let ar = A.createCombatArbiter(run.battleId, 'gate-01', plan.phases[0].phaseId, now);
  const dynId = 'intrusion@refresh-seed';
  ar = A.requestExclusive(ar, {
    eventId: 'crisis:' + dynId, eventType: 'dynamic-crisis', priority: 2, conflictGroup: 'crisis',
    expiresInMs: 120000, payload: { defId: 'unknown-intrusion' },
  }, now).state;
  const p = basePlayer(now);
  p.progress.battles = { 'gate-01': { hp: 100, maxHp: 100, difficulty: 'easy', started: true, phase: 0, phaseMask: [0, 0, 0, 0], failures: 0, cleared: false, updatedAt: now } };
  p.progress.bossBattles = { 'gate-01': run };
  p.progress.combatArbiter = ar;
  p.progress.dynamicEvent = {
    id: dynId, defId: 'unknown-intrusion', status: 'active', priority: 2,
    startedAt: now - 1000, activateAt: now - 1000, deadlineAt: now + 120000,
    endedAt: null, result: null, reason: null, data: { step: 0, missesLeft: 3 },
  };
  return JSON.stringify({ version: 10, updatedAt: now, player: p });
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
async function waitTextGone(page, text, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (!(await textOf(page)).includes(text)) return true;
    await sleep(150);
  }
  return false;
}
async function clickButton(page, text, scope = 'button', timeout = 15000) {
  const btn = page.locator(scope, { hasText: text }).first();
  await btn.waitFor({ state: 'visible', timeout });
  await btn.click();
}
async function domClick(page, text) {
  const r = await page.evaluate((t) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => (x.textContent || '').includes(t));
    if (!b) return false;
    b.click();
    return true;
  }, text);
  return r;
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
async function enterBoss(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const bootSkip = page.locator('button', { hasText: '跳过初始化' }).first();
  if (await bootSkip.isVisible().catch(() => false)) await bootSkip.click();
  await clickButton(page, 'ENTER NEXUS');
  await waitText(page, 'Python 知识库', 60000);
  await clickButton(page, '继续探索');
  await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000);
  await page.locator('.node-group').nth(1).click();
  await sleep(220);
  await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸');
  await sleep(220);
  await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
  const cont = page.locator('button', { hasText: '继续挑战' }).first();
  if (await cont.isVisible().catch(() => false)) await cont.click();
  else await clickButton(page, '开始挑战');
  await page.locator('.diff-panel').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
}
async function setEditorCode(page, code) {
  const okM = await page.evaluate((c) => {
    const m = window.monaco;
    if (!m || !m.editor) return false;
    const models = m.editor.getModels();
    if (!models.length) return false;
    models[0].setValue(c);
    return true;
  }, code).catch(() => false);
  if (!okM) {
    const ta = page.locator('.monaco-editor textarea').first();
    await ta.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(code);
    await sleep(180);
  } else await sleep(120);
}
async function waitWarning(page, timeout = 45000) {
  await page.locator('.attack-warning').first().waitFor({ state: 'visible', timeout });
}
async function saveData(page) {
  return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } });
}
const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';

function staticServer(distRoot, port) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
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

(async () => {
  const distRoot = join(root, 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist，请先 npm run build');
  const staticSrv = await staticServer(distRoot, DIST_PORT);
  let browser;
  let dev1 = null;
  let dev2 = null;
  try {
    const chromePath = [
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      chromium.executablePath(),
    ].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    console.log('浏览器:', chromePath || '(Playwright bundled)');
    const blockFonts = route => /fonts\.(googleapis|gstatic)\.com/.test(route.request().url()) ? route.abort() : route.continue();
    const mkCtx = async (seed) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addInitScript(s => {
        try { localStorage.setItem('nexus_code_repair_save_v1', s); localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ }
      }, seed);
      await ctx.route('**/*', blockFonts);
      return ctx;
    };
    const collectErrors = (page) => {
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => {
        if (m.type() === 'error' && !/wasm|WebAssembly|favicon|ERR_FAILED|fonts\.(googleapis|gstatic)/i.test(m.text())) errors.push(m.text());
      });
      return errors;
    };

    // ---------- 1. 刷新恢复（静态生产构建） ----------
    console.log('=== 1. 刷新恢复与生产校验 ===');
    const ctxStatic = await mkCtx(makeRefreshSave());
    const pStatic = await ctxStatic.newPage();
    const eStatic = collectErrors(pStatic);
    await pStatic.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await waitText(pStatic, '未知入侵 · UNKNOWN INTRUSION', 60000);
    ok(true, '刷新后动态事件从存档恢复并显示覆盖层');
    const s1 = await saveData(pStatic);
    ok(s1.player.progress.combatArbiter.active === null, '刷新后仲裁活动锁被清空（瞬态不恢复）');
    ok(s1.player.progress.combatArbiter.settledEventIds !== undefined, '刷新后幂等记录保留');
    ok(!(await textOf(pStatic)).includes('战斗事件仲裁面板'), '生产构建中 DEV 仲裁面板不可见');
    await sleep(1500);
    const s2 = await saveData(pStatic);
    ok(s2.player.consciousness === s1.player.consciousness, '刷新后无重复意识伤害');
    ok(JSON.stringify(s2.player.rewards) === JSON.stringify(s1.player.rewards), '刷新后无重复奖励');
    await pStatic.screenshot({ path: join(evidence, '01-refresh-recovery.png'), fullPage: false });
    await clickButton(pStatic, '退出隔离', 'button');
    await waitTextGone(pStatic, '未知入侵 · UNKNOWN INTRUSION', 6000);
    await enterBoss(pStatic).catch(() => {});
    ok(eStatic.length === 0, '静态刷新流程无未捕获异常', eStatic.slice(0, 3).join(' | '));
    await ctxStatic.close();

    // ---------- 2. Vite dev：攻击 vs 动态事件 ----------
    console.log('=== 2. 攻击与未知入侵冲突 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev1 = spawn(process.execPath, [viteBin, '--port', String(DEV1_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', env: { ...process.env } });
    await waitServer('http://127.0.0.1:' + DEV1_PORT + '/', 60000);
    const ctx1 = await mkCtx(makeSave());
    const p1 = await ctx1.newPage();
    const e1 = collectErrors(p1);
    await p1.goto('http://127.0.0.1:' + DEV1_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(p1);
    await waitText(p1, '战斗事件仲裁面板', 15000);
    await waitWarning(p1, 45000);
    let s = await saveData(p1);
    ok(s.player.progress.combatArbiter.active && s.player.progress.combatArbiter.active.priority === 5, 'Boss 攻击预警持有 P5 仲裁锁');
    const beforeCrisisHp = s.player.consciousness;
    ok(await domClick(p1, '触发未知入侵（P2）'), 'DEV 触发未知入侵');
    await waitText(p1, '未知入侵 · UNKNOWN INTRUSION', 12000);
    await sleep(500);
    ok(!(await p1.locator('.attack-warning').first().isVisible().catch(() => false)), 'P2 危机后攻击预警消失（攻击被中断）');
    s = await saveData(p1);
    ok(s.player.progress.combatArbiter.active && s.player.progress.combatArbiter.active.priority === 2, '动态危机持有 P2 仲裁锁');
    ok(s.player.progress.combatArbiter.records.some(r => r.eventType === 'boss-attack' && r.status === 'interrupted'), '事件记录：攻击被 P2 中断');
    const beforeWait = s.player.consciousness;
    await sleep(1500);
    s = await saveData(p1);
    ok(s.player.consciousness === beforeWait, '危机期间无重复意识扣除');
    await p1.screenshot({ path: join(evidence, '02-attack-vs-crisis.png'), fullPage: false });
    await clickButton(p1, '退出隔离');
    await waitTextGone(p1, '未知入侵 · UNKNOWN INTRUSION', 6000);
    await sleep(400);
    ok(await domClick(p1, '重置动态事件冷却'), 'DEV 重置动态事件冷却（连续仲裁测试）');
    s = await saveData(p1);
    ok(!s.player.progress.combatArbiter.active || s.player.progress.combatArbiter.active.priority >= 5, '危机结束后 P2 锁释放');

    // ---------- 3. 阶段切换期间触发动态事件（队列） ----------
    console.log('=== 3. 阶段切换与动态事件队列 ===');
    await setEditorCode(p1, P1);
    await clickButton(p1, '提交攻击');
    await p1.locator('.phase-transition-banner').first().waitFor({ state: 'visible', timeout: 60000 });
    ok(await domClick(p1, '触发未知入侵（P2）'), '阶段切换期间触发未知入侵');
    await sleep(250);
    s = await saveData(p1);
    const arDuring = s.player.progress.combatArbiter;
    ok(arDuring.active && arDuring.active.priority === 1, '阶段切换持有 P1 锁');
    ok(arDuring.queue.some(e => e.eventType === 'dynamic-crisis'), 'P2 动态事件进入仲裁队列');
    await waitText(p1, '战斗阶段 2 / 3', 20000);
    await sleep(600);
    await waitText(p1, '未知入侵 · UNKNOWN INTRUSION', 20000);
    await sleep(400);
    s = await saveData(p1);
    ok(s.player.progress.combatArbiter.active && s.player.progress.combatArbiter.active.priority === 2, '阶段完成后队列动态事件按优先级执行');
    await p1.screenshot({ path: join(evidence, '03-phase-queued-crisis.png'), fullPage: false });
    await clickButton(p1, '退出隔离');
    await waitTextGone(p1, '未知入侵 · UNKNOWN INTRUSION', 6000);
    await sleep(600);
    ok(await domClick(p1, '重置动态事件冷却'), 'DEV 重置动态事件冷却（胜利测试）');

    // ---------- 4. 胜利 P0 清理 ----------
    console.log('=== 4. 胜利终结清理 ===');
    const rewardsBefore = (await saveData(p1)).player.rewards;
    ok(await domClick(p1, '触发未知入侵（P2）'), '再次触发未知入侵');
    await waitText(p1, '未知入侵 · UNKNOWN INTRUSION', 12000);
    ok(await domClick(p1, '模拟胜利（P0）'), 'DEV 模拟 Boss 胜利（不发奖励）');
    await sleep(800);
    ok(!(await textOf(p1)).includes('未知入侵 · UNKNOWN INTRUSION'), 'P0 胜利后动态事件覆盖层清除');
    ok(!(await p1.locator('.attack-warning').first().isVisible().catch(() => false)), 'P0 胜利后攻击预警停止');
    s = await saveData(p1);
    ok(s.player.progress.bossBattles['gate-01'].status === 'victory', '胜利状态写入战斗运行');
    ok(s.player.progress.dynamicEvent === null, '胜利后动态事件状态清空');
    ok(s.player.progress.combatArbiter.active === null && s.player.progress.combatArbiter.queue.length === 0, '胜利后仲裁锁/队列清空');
    ok(JSON.stringify(s.player.rewards) === JSON.stringify(rewardsBefore), 'DEV 胜利不发放奖励');
    ok((s.player.progress.bossesDone || []).length === 0, 'DEV 胜利不推进章节');
    await p1.screenshot({ path: join(evidence, '04-victory-stop.png'), fullPage: false });
    ok(e1.length === 0, 'Vite 冲突流程无未捕获异常', e1.slice(0, 3).join(' | '));
    await ctx1.close();
    dev1.kill();
    dev1 = null;

    // ---------- 5. Vite dev：死亡 P0 清理 ----------
    console.log('=== 5. 死亡终结清理 ===');
    dev2 = spawn(process.execPath, [viteBin, '--port', String(DEV2_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', env: { ...process.env } });
    await waitServer('http://127.0.0.1:' + DEV2_PORT + '/', 60000);
    const ctx2 = await mkCtx(makeSave());
    const p2 = await ctx2.newPage();
    const e2 = collectErrors(p2);
    await p2.goto('http://127.0.0.1:' + DEV2_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(p2);
    await waitText(p2, '战斗事件仲裁面板', 15000);
    await waitWarning(p2, 45000);
    ok(await domClick(p2, '触发未知入侵（P2）'), '死亡测试：触发未知入侵');
    await waitText(p2, '未知入侵 · UNKNOWN INTRUSION', 12000);
    ok(await domClick(p2, '模拟玩家死亡（P0）'), 'DEV 模拟玩家死亡');
    await p2.locator('.ov-death').first().waitFor({ state: 'visible', timeout: 12000 });
    await sleep(800);
    ok(!(await textOf(p2)).includes('未知入侵 · UNKNOWN INTRUSION'), 'P0 死亡后动态事件覆盖层清除');
    ok(!(await p2.locator('.attack-warning').first().isVisible().catch(() => false)), 'P0 死亡后攻击预警停止');
    s = await saveData(p2);
    ok(s.player.consciousness === 0, '死亡后意识归零');
    ok(s.player.progress.dynamicEvent === null, '死亡后动态事件清空');
    ok(s.player.progress.combatArbiter.active === null && s.player.progress.combatArbiter.queue.length === 0, '死亡后仲裁锁/队列清空');
    ok(s.player.progress.combatArbiter.records.some(r => r.priority === 0), '死亡 P0 事件记录');
    const hpAfterDeath = s.player.consciousness;
    await sleep(1500);
    s = await saveData(p2);
    ok(s.player.consciousness === hpAfterDeath, '死亡后无后续伤害/重复扣除');
    await p2.screenshot({ path: join(evidence, '05-death-stop.png'), fullPage: false });
    ok(e2.length === 0, '死亡流程无未捕获异常', e2.slice(0, 3).join(' | '));
    await ctx2.close();
    dev2.kill();
    dev2 = null;
  } finally {
    if (dev1) dev1.kill();
    if (dev2) dev2.kill();
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => staticSrv.close(r));
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图目录：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e && e.message ? e.message : e); process.exit(1); });
