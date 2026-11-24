// V1.3-B.5.4 真实浏览器 E2E：完整 Boss 战斗 → 成就判定/解锁/奖励、刷新、失败/撤退、DEV 全量预览
// 主流程：生产构建静态服务（稳定）+ 真实 MicroPython/Judge；DEV 简洁动态事件统计使用短 Vite session。
// 执行：node test/boss_achievement_e2e.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const evidence = join(root, '.tmp', 'b5-ach-evidence');
mkdirSync(evidence, { recursive: true });
const DIST_PORT = 4700 + Math.floor(Math.random() * 100);
const DEV_PORT = 5900 + Math.floor(Math.random() * 80);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
function makeSave(opts = {}) {
  const player = {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 3, exp: 390, consciousness: opts.consciousness ?? 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: CH1, stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: { 'bossIntro_gate-01': true }, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
      bossesDone: [], battles: {}, bossBattles: {}, bossBattleHistory: [], bossPhaseProgress: {}, bossAttacks: {}, bossWeaknesses: {}, bossBattleStats: { active: null, history: [] },
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
async function enterBossDiff(page) {
  await waitText(page, 'ENTER NEXUS', 60000);
  const bootSkip = page.locator('button', { hasText: '跳过初始化' }).first();
  if (await bootSkip.isVisible().catch(() => false)) await bootSkip.click();
  await clickButton(page, 'ENTER NEXUS');
  await waitText(page, 'Python 知识库', 60000);
  await clickThroughDialog(page);
  await clickButton(page, '继续探索');
  await clickThroughDialog(page);
  await waitText(page, 'NEXUS 数字世界 · 服务器网络', 60000);
  await clickThroughDialog(page);
  await page.locator('.node-group').nth(1).click();
  await sleep(220);
  await clickThroughDialog(page);
  await clickButton(page, '挑战 ▸');
  await sleep(220);
  await clickThroughDialog(page);
  await page.locator('.diff-panel').waitFor({ state: 'visible', timeout: 20000 });
}
async function enterBoss(page) {
  await enterBossDiff(page);
  const cont = page.locator('button', { hasText: '继续挑战' }).first();
  if (await cont.isVisible().catch(() => false)) await cont.click();
  else {
    const sim = page.locator('button', { hasText: '开始模拟再战' }).first();
    if (await sim.isVisible().catch(() => false)) await sim.click();
    else await clickButton(page, '开始挑战');
  }
  await page.locator('.diff-panel').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.locator('.boss-arena').waitFor({ state: 'visible', timeout: 20000 });
}
async function setCode(page, code, last = false) {
  const okM = await page.evaluate(({ c, useLast }) => {
    const m = window.monaco;
    if (!m || !m.editor) return false;
    const models = m.editor.getModels();
    if (!models.length) return false;
    (useLast ? models[models.length - 1] : models[0]).setValue(c);
    return true;
  }, { c: code, useLast: last }).catch(() => false);
  if (!okM) {
    const ta = page.locator('.monaco-editor textarea').first();
    await ta.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(code);
  }
  await sleep(150);
}
async function dismissIntrusion(page) {
  if (!(await textOf(page)).includes('UNKNOWN INTRUSION')) return;
  const b = page.locator('button', { hasText: '退出隔离' }).first();
  if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await sleep(350); }
}
async function waitWarning(page, timeout = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    await dismissIntrusion(page);
    if (await page.locator('.attack-warning').first().isVisible().catch(() => false)) return;
    await sleep(180);
  }
  throw new Error('等待攻击预警超时');
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
async function clueCount(page) { return page.locator('.weakness-clue:not(.locked)').count(); }
async function saveData(page) {
  return page.evaluate(() => { try { return JSON.parse(localStorage.getItem('nexus_code_repair_save_v1')); } catch { return null; } });
}

function statsSnapshotFixture(opts = {}) {
  return {
    schemaVersion: 1, battleId: opts.battleId || 'battle-preview-1', bossId: 'gate-01',
    bossName: 'GATE-01 · 数据港守卫', difficulty: opts.difficulty || 'easy',
    battleStatus: 'completed', result: 'victory', startedAt: 1000, endedAt: 101000,
    wallDurationMs: 100000, activeDurationMs: null, currentPhaseId: 'gate-01-bp1', currentPhaseIndex: 0,
    maxPhaseReached: 0, phaseTransitions: 0, phasesCompleted: 1, phaseStats: {},
    challengeStats: {
      submittedCount: opts.noJudge ? 0 : 5, judgedCount: opts.noJudge ? 0 : 5,
      passedCount: opts.noJudge ? 0 : 5, failedCount: 0, runtimeErrorCount: 0, invalidCount: 0,
      consecutiveSuccess: opts.noJudge ? 0 : 5, maxConsecutiveSuccess: opts.noJudge ? 0 : 5,
      failureReasons: {}, successRate: opts.noJudge ? null : 1, keyCrackSuccess: !opts.noJudge,
    },
    attackStats: { telegraphCount: 3, startedCount: 3, hitCount: 0, blockedCount: 2, cancelledCount: 0, interruptedByWeaknessCount: 0, interruptedByCrisisCount: 0, damageTaken: 0, shieldAbsorbed: 0 },
    defenseStats: { defenseSuccessCount: 2, defenseFailedCount: 0, dodgeSuccessCount: 1, dodgeFailedCount: 0 },
    weaknessStats: { clueCount: 2, discoveredCount: 1, analysisCount: 1, crackSubmittedCount: 1, crackSuccessCount: 1, crackFailedCount: 0, exposedCount: 1, exposureMsTotal: 3000, bossHpDamage: 10, cancelledCount: 0 },
    dynamicEventStats: { triggeredCount: 0, byDef: {}, successCount: 0, failedCount: 0, playerCompletedCount: 0, timeoutCount: 0, cancelledByPriorityCount: 0, clearedByBattleEndCount: 0, attackInterruptedCount: 0, playerDamageTaken: 0, durationMsTotal: 0 },
    playerDeathCount: 0, dataQuality: opts.dataQuality || 'complete', finalized: true, finalizedAt: 101000,
    lastUpdatedAt: 101000, eventLog: [], rejectedEvents: [], settledEventIds: [], weaknessClues: [],
    weaknessExposureStartedAt: {}, dynamicStartedAt: {}, sequence: 0,
  };
}
function statsSeed(opts = {}) {
  const save = JSON.parse(makeSave());
  save.player.progress.bossBattleStats = { active: null, history: [statsSnapshotFixture(opts)] };
  save.player.progress.bossBattleRatings = { history: [] };
  return JSON.stringify(save);
}

const P1 = 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))';
const P1_BAD = 'def startup(energy):\n    return "POWER OFF"';
const P2 = 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"';
const P3 = 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))';
const P4 = 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))';
const CRACK2 = 'def verify(a, b, c):\n    return a and b and c';

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

(async () => {
  const distRoot = join(root, 'dist');
  if (!existsSync(join(distRoot, 'index.html'))) throw new Error('缺少 dist，请先 npm run build');
  const server = await staticServer(distRoot, DIST_PORT);
  let browser = null;
  let dev = null;
  try {
    const chromePath = [
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      chromium.executablePath(),
    ].find(p => p && existsSync(p));
    browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
    console.log('浏览器:', chromePath || '(Playwright bundled)');
    let victorySaveForDev = null;
    const blockFonts = route => /fonts\.(googleapis|gstatic)\.com/.test(route.request().url()) ? route.abort() : route.continue();
    const mkCtx = async (seed) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addInitScript(s => {
        try {
          if (!localStorage.getItem('nexus_code_repair_save_v1')) localStorage.setItem('nexus_code_repair_save_v1', s);
          localStorage.setItem('nexus_dev_tools', '1');
        } catch { /* ignore */ }
      }, seed);
      await ctx.route('**/*', blockFonts);
      return ctx;
    };
    const collectErrors = (page) => {
      const errors = [];
      page.on('pageerror', e => { const s = String(e); if (!/Canceled/i.test(s)) errors.push(s); });
      page.on('console', m => {
        if (m.type() === 'error' && !/wasm|WebAssembly|favicon|ERR_FAILED|fonts\.(googleapis|gstatic)|Failed to load resource|Monaco initialization|Canceled/i.test(m.text())) errors.push(m.text());
      });
      return errors;
    };

    // ---------- 1. 完整真实战斗 ----------
    console.log('=== 1. 完整战斗统计采集 ===');
    const ctx = await mkCtx(makeSave());
    const page = await ctx.newPage();
    const errors = collectErrors(page);
    await page.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(page);
    ok(!(await textOf(page)).includes('DEV · Boss 战斗统计'), '生产构建隐藏统计 DEV 面板');
    ok((await page.locator('.dev-rating-panel').count()) === 0, '生产构建隐藏评分 DEV 面板');
    ok((await page.locator('.dev-reward-panel').count()) === 0, '生产构建隐藏奖励 DEV 面板');
    ok((await page.locator('.dev-achievement-panel').count()) === 0, '生产构建隐藏成就 DEV 面板');

    // 攻击防御 / 闪避 / 未响应
    await waitWarning(page, 45000);
    if (await waitUntilRemaining(page, 0.6)) {
      await clickButton(page, '防御', '.boss-attack-panel button');
      await waitText(page, '防御成功', 12000).catch(() => {});
      await warningGone(page);
    }
    await waitWarning(page, 45000);
    if (await waitUntilRemaining(page, 0.25)) {
      await clickButton(page, '闪避', '.boss-attack-panel button');
      await waitText(page, '闪避成功', 12000).catch(() => {});
      await warningGone(page);
    }
    await waitWarning(page, 45000);
    await waitText(page, '受到「', 15000);
    await warningGone(page);

    // 一次判题失败 + 一次成功（真实 Judge）
    await setCode(page, P1_BAD, false);
    await clickButton(page, '提交攻击');
    await waitText(page, '测试未全部通过', 30000).catch(() => waitText(page, '未造成伤害', 30000));
    await setCode(page, P1, false);
    await clickButton(page, '提交攻击');
    await page.locator('.phase-transition-banner').first().waitFor({ state: 'visible', timeout: 60000 });
    await waitText(page, '战斗阶段 2 / 3', 20000);
    const activeAfterP1 = (await saveData(page)).player.progress.bossBattleStats.active;
    ok(activeAfterP1 && activeAfterP1.battleId, '战斗中生成活动统计');
    ok(activeAfterP1.challengeStats.submittedCount >= 2 && activeAfterP1.challengeStats.failedCount >= 1 && activeAfterP1.challengeStats.passedCount >= 1, '挑战成功/失败真实统计');
    ok(activeAfterP1.attackStats.telegraphCount >= 3, '攻击预警统计来自真实战斗');
    ok(activeAfterP1.attackStats.damageTaken >= 0 && activeAfterP1.defenseStats.defenseSuccessCount + activeAfterP1.defenseStats.dodgeSuccessCount >= 1, '防御/闪避统计');

    // 刷新恢复活动统计
    const statsBattleId = activeAfterP1.battleId;
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await sleep(2500);
    const afterReload = (await saveData(page)).player.progress.bossBattleStats.active;
    ok(afterReload && afterReload.battleId === statsBattleId, '刷新后活动统计 battleId 保持');
    ok(afterReload.challengeStats.passedCount === activeAfterP1.challengeStats.passedCount, '刷新不重置挑战统计');
    await enterBoss(page);

    // 阶段 2 弱点：线索 → 分析 → 破解 → 暴露
    let cluesOk = (await clueCount(page)) >= 2;
    for (let i = 0; i < 4 && !cluesOk; i++) {
      await waitWarning(page, 45000);
      if (await waitUntilRemaining(page, 0.25)) {
        await clickButton(page, '闪避', '.boss-attack-panel button');
        await waitText(page, '闪避成功', 12000).catch(() => {});
      }
      await warningGone(page);
      cluesOk = (await clueCount(page)) >= 2;
    }
    ok(cluesOk, '阶段 2 通过真实攻击/闪避获得弱点线索');
    if (cluesOk) {
      await clickButton(page, '分析弱点', '.boss-weakness-panel button');
      await waitText(page, '弱点已发现', 12000);
      await clickButton(page, '开始弱点破解', '.boss-weakness-panel button');
      await page.locator('.weakness-crack-panel').waitFor({ state: 'visible', timeout: 15000 });
      await setCode(page, CRACK2, true);
      await clickButton(page, '提交破解');
      await page.locator('.weakness-crack-panel').waitFor({ state: 'hidden', timeout: 60000 });
      await page.locator('.weakness-exposure-banner').waitFor({ state: 'visible', timeout: 20000 });
      ok(true, '弱点破解成功并暴露');
    }
    await page.screenshot({ path: join(evidence, '01-live-battle.png'), fullPage: false });

    // 完成阶段 2/3/4
    await setCode(page, P2, false);
    await clickButton(page, '提交攻击');
    await waitText(page, '战斗阶段 3 / 3', 60000);
    await setCode(page, P3, false);
    await clickButton(page, '提交攻击');
    await waitText(page, '阶段 4 / 4', 30000);
    await setCode(page, P4, false);
    await clickButton(page, '提交攻击');
    await page.locator('.boss-complete').waitFor({ state: 'visible', timeout: 60000 }).catch(async (e) => {
      console.log('DEBUG 末尾界面:', (await textOf(page)).slice(-1500));
      const dbg = (await saveData(page)).player.progress;
      console.log('DEBUG 战斗:', JSON.stringify(dbg.bossBattles['gate-01']).slice(0, 900));
      console.log('DEBUG 统计:', JSON.stringify(dbg.bossBattleStats).slice(0, 1200));
      console.log('DEBUG 异常:', errors.slice(-6).join(' | ') || '(无)');
      writeFileSync(join(evidence, 'debug-save.json'), JSON.stringify(await saveData(page)));
      await page.screenshot({ path: join(evidence, 'debug-final.png'), fullPage: false });
      throw e;
    });
    await sleep(800);

    const finalSave = await saveData(page);
    const statsStore = finalSave.player.progress.bossBattleStats;
    ok(statsStore.active === null, '战斗结束后活动统计清空');
    ok(statsStore.history.length === 1, '生成 1 份最终统计快照');
    const snap = statsStore.history[0];
    ok(snap.battleStatus === 'completed' && snap.result === 'victory' && snap.finalized === true, '最终快照状态/结果/锁定');
    ok(snap.wallDurationMs != null && snap.wallDurationMs > 0 && snap.dataQuality === 'complete', '最终快照时长与完整性');
    ok(snap.challengeStats.submittedCount >= 5 && snap.challengeStats.passedCount >= 4 && snap.challengeStats.failedCount >= 1, '最终挑战统计');
    ok(snap.challengeStats.successRate != null, '成功率有有效判题数据');
    ok(snap.attackStats.telegraphCount >= 3 && snap.attackStats.damageTaken >= 0, '最终攻击统计');
    ok(snap.defenseStats.defenseSuccessCount + snap.defenseStats.dodgeSuccessCount >= 1, '最终防御/闪避统计');
    ok(snap.weaknessStats.discoveredCount >= 1 && snap.weaknessStats.crackSuccessCount >= 1 && snap.weaknessStats.exposedCount >= 1, '最终弱点统计');
    ok(snap.phaseTransitions >= 2 && snap.maxPhaseReached >= 2, '最终阶段统计');
    ok(snap.eventLog.length > 0 && snap.settledEventIds.length > 0, '事件日志与幂等表非空');
    ok((finalSave.player.progress.bossesDone || []).filter(x => x === 'gate-01').length === 1, '统计数据未影响 Boss 首胜结算');
    ok((finalSave.player.meta.memoryFragments || []).filter(x => x === 'frag-01').length === 1, '统计数据未重复发放碎片');
    const ratingStore = finalSave.player.progress.bossBattleRatings;
    ok(ratingStore && ratingStore.history.length === 1, 'Boss 胜利后生成 1 份战斗评分');
    const victoryRating = ratingStore && ratingStore.history[0];
    ok(victoryRating && victoryRating.battleId === snap.battleId, '评分绑定本场 battleId');
    ok(victoryRating && victoryRating.battleResult === 'victory' && victoryRating.finalized === true && victoryRating.dataQuality === 'complete', '评分状态为正式 victory/complete');
    ok(victoryRating && victoryRating.ratingVersion === 'v1.0.0', '评分记录算法版本');
    ok(victoryRating && victoryRating.totalScore >= 0 && victoryRating.totalScore <= 100, '评分范围 0~100');
    ok(victoryRating && victoryRating.displayScore === Math.round(victoryRating.totalScore), '展示分与内部分口径一致');
    ok(victoryRating && ['S', 'A', 'B', 'C', 'D'].includes(victoryRating.grade), '评分生成合法等级');
    ok(victoryRating && ['survival', 'challenge', 'tactics', 'weakness'].every(k => victoryRating.dimensionScores[k].availability === 'available'), '评分包含生存/挑战/战术/弱点真实维度');
    ok(victoryRating && ['available', 'mechanicUnavailable'].includes(victoryRating.dimensionScores.crisis.availability), '危机维度按真实事件可用性处理');
    ok(victoryRating && Object.values(victoryRating.dimensionScores).every(d => d.score >= 0 && d.score <= d.maxScore), '各维度分数不超过上限');
    ok(victoryRating && victoryRating.ratingReasons.length > 0 && victoryRating.performanceWeaknesses.length >= 1, '评分依据与不足来自真实数据');
    ok(victoryRating && /^[0-9a-f]{8}$/.test(victoryRating.sourceStatsHash), '评分记录统计快照摘要');
    ok(victoryRating && victoryRating.battleId === snap.battleId && victoryRating.bossId === snap.bossId, '评分与统计快照完全对齐');
    const rewardStore = finalSave.player.progress.bossBattleRewards;
    ok(rewardStore && rewardStore.history.length === 1, 'Boss 首胜生成 1 份正式奖励记录');
    const victoryReward = rewardStore && rewardStore.history[0];
    ok(victoryReward && victoryReward.battleId === snap.battleId, '奖励绑定本场 battleId');
    ok(victoryReward && victoryReward.eligible === true && victoryReward.granted === true, '奖励资格通过并已发放');
    ok(victoryReward && victoryReward.rewardVersion === 'v1.0.0', '奖励记录算法版本');
    ok(victoryReward && victoryReward.battleResult === 'victory' && victoryReward.dataQuality === 'complete', '奖励状态为正式胜利/完整');
    ok(victoryReward && victoryReward.ratingId === victoryRating.ratingId && victoryReward.ratingGrade === victoryRating.grade, '奖励引用正式评分');
    ok(victoryReward && victoryReward.baseReward.xp > 0 && victoryReward.baseReward.contribution > 0, '基础 XP/贡献点大于 0');
    ok(victoryReward && victoryReward.finalReward.xp === victoryReward.baseReward.xp + victoryReward.difficultyBonus.xp + victoryReward.performanceBonus.xp + victoryReward.specialBonus.xp, '完整 XP = 基础+难度+评分+表现');
    ok(victoryReward && victoryReward.grantedReward.xp >= 0 && victoryReward.grantedReward.contribution >= 0, '实际增量为非负整数');
    ok(victoryReward && victoryReward.grantedReward.xp <= 400 && victoryReward.grantedReward.contribution <= 300, '实际增量不超配置上限');
    ok(victoryReward && victoryReward.grantedReward.fragments === 0, '奖励不重复发放创世主碎片');
    ok(rewardStore && rewardStore.totalGranted.xp === victoryReward.grantedReward.xp && rewardStore.totalGranted.contribution === victoryReward.grantedReward.contribution, '累计奖励与本次增量一致');
    ok((finalSave.player.rewards.ledger || []).some(e => e.kind === 'boss' && String(e.ref).includes(':performance:')), '奖励写入现有经济账本');
    ok(finalSave.player.rewards.credits >= victoryReward.grantedReward.contribution, '贡献点经济已增加');
    ok(finalSave.player.exp >= 390 + victoryReward.grantedReward.xp, '经验经济已增加（含既有首胜）');
    const achStore = finalSave.player.progress.bossAchievements;
    ok(achStore && achStore.unlocked.length >= 1, '真实 Boss 胜利自动解锁隐藏成就');
    const achIds = (achStore?.unlocked || []).map(u => u.achievementId);
    ok(achIds.includes('boss_no_death'), '零死亡成就来自真实统计');
    ok(achIds.includes('boss_weakness_hunter'), '弱点猎人成就来自真实发现');
    ok((achStore?.unlocked || []).every(u => u.battleId === snap.battleId && u.unlockedAt > 0), '成就绑定真实 battleId 与解锁时间');
    ok((achStore?.unlocked || []).every(u => u.evidence && u.evidence.battleId === snap.battleId), '成就保存真实证据');
    ok((achStore?.unlocked || []).every(u => u.rewardGranted === true && u.rewardGrantedAt > 0), '成就奖励已发放标记');
    ok((achStore?.rewardHistory || []).length === (achStore?.unlocked || []).length, '成就奖励历史与解锁一一对应');
    ok((achStore?.unlocked || []).some(u => u.rewardId.startsWith('boss-achievement-reward:')), '成就奖励 ID 稳定');
    ok((achStore?.progress || []).some(p => p.achievementId === 'boss_perfect_streak' && p.progress < p.target), '未完成挑战成就保存真实进度');
    if (victoryRating.grade === 'S') ok(achIds.includes('boss_rating_s'), 'S 级正式评分触发卓越执行');
    else ok(!achIds.includes('boss_rating_s'), '非 S 级不触发卓越执行');
    ok((finalSave.player.rewards.ledger || []).some(e => String(e.ref).startsWith('achievement:')), '成就奖励写入现有经济账本');
    await page.screenshot({ path: join(evidence, '02-victory.png'), fullPage: false });

    // 再次刷新：最终快照不被重复创建
    await page.reload({ waitUntil: 'commit', timeout: 60000 });
    await sleep(2500);
    const reloadedSave = await saveData(page);
    const afterVictoryReload = reloadedSave.player.progress.bossBattleStats;
    ok(afterVictoryReload.active === null && afterVictoryReload.history.length === 1, '刷新后最终快照仍只有 1 份');
    const afterRatingReload = reloadedSave.player.progress.bossBattleRatings;
    ok(afterRatingReload && afterRatingReload.history.length === 1, '刷新后评分仍只有 1 份');
    ok(afterRatingReload && afterRatingReload.history[0].totalScore === victoryRating.totalScore && afterRatingReload.history[0].ratedAt === victoryRating.ratedAt, '刷新不重新评分、不改变历史结果');
    ok((finalSave.player.progress.bossesDone || []).length === 1, '刷新不重复推进章节');
    ok(reloadedSave.player.rewards.credits === finalSave.player.rewards.credits && reloadedSave.player.exp === finalSave.player.exp, '刷新不因评分重复发放经验/贡献点');
    const afterRewardReload = reloadedSave.player.progress.bossBattleRewards;
    ok(afterRewardReload && afterRewardReload.history.length === 1, '刷新后奖励仍只有 1 份');
    ok(afterRewardReload && afterRewardReload.history[0].rewardId === victoryReward.rewardId && afterRewardReload.totalGranted.xp === rewardStore.totalGranted.xp, '刷新不重复发放、不改变累计奖励');
    ok((reloadedSave.player.meta.memoryFragments || []).filter(x => x === 'frag-01').length === 1, '刷新不重复发放碎片');
    const achAfterReload = reloadedSave.player.progress.bossAchievements;
    ok(achAfterReload && achAfterReload.unlocked.length === achStore.unlocked.length, '刷新后成就解锁数量不变');
    ok(achAfterReload && achAfterReload.unlocked.every(u => achStore.unlocked.some(x => x.achievementId === u.achievementId && x.unlockedAt === u.unlockedAt)), '刷新不重复解锁/不改解锁时间');
    ok(achAfterReload && achAfterReload.rewardHistory.length === achStore.rewardHistory.length, '刷新不重复发放成就奖励');
    ok(errors.length === 0, '完整战斗无未捕获异常', errors.slice(0, 3).join(' | '));
    victorySaveForDev = reloadedSave;
    await ctx.close();

    // ---------- 2. 玩家死亡 ----------
    console.log('=== 2. 玩家死亡统计 ===');
    const ctxDeath = await mkCtx(makeSave({ consciousness: 10 }));
    const deathPage = await ctxDeath.newPage();
    const deathErrors = collectErrors(deathPage);
    await deathPage.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(deathPage);
    let died = false;
    const deathT0 = Date.now();
    while (Date.now() - deathT0 < 90000) {
      await dismissIntrusion(deathPage);
      if ((await textOf(deathPage)).includes('意识核心崩解')) { died = true; break; }
      await sleep(250);
    }
    ok(died, '真实 Boss 攻击导致玩家意识归零');
    await sleep(900);
    const deathStore = (await saveData(deathPage)).player.progress.bossBattleStats;
    ok(deathStore.active === null && deathStore.history.length === 1, '死亡生成 1 份最终统计');
    const deathSnap = deathStore.history[0] || {};
    ok(deathSnap.result === 'defeat' && deathSnap.battleStatus === 'failed' && deathSnap.finalized === true, '死亡统计结果为 defeat / failed');
    ok(deathSnap.playerDeathCount >= 1 && deathSnap.attackStats.damageTaken > 0, '死亡与受伤统计来自真实结算', JSON.stringify({ deaths: deathSnap.playerDeathCount, dmg: deathSnap.attackStats && deathSnap.attackStats.damageTaken }));
    const deathRatingStore = (await saveData(deathPage)).player.progress.bossBattleRatings;
    ok(deathRatingStore && deathRatingStore.history.length === 0, 'Boss 失败不生成正式战斗评分');
    const deathRewardStore = (await saveData(deathPage)).player.progress.bossBattleRewards;
    ok(deathRewardStore && deathRewardStore.history.length === 0, 'Boss 失败不生成胜利奖励');
    const deathAch = (await saveData(deathPage)).player.progress.bossAchievements;
    ok(deathAch && deathAch.unlocked.length === 0, 'Boss 失败不解锁正式成就');
    ok(deathErrors.length === 0, '死亡流程无未捕获异常', deathErrors.slice(0, 3).join(' | '));
    await deathPage.screenshot({ path: join(evidence, '04-death.png'), fullPage: false });
    await ctxDeath.close();

    // ---------- 3. 暂时离开不判负 + 放弃 = 撤退 ----------
    console.log('=== 3. 撤退 / 暂时离开 ===');
    const ctxRetreat = await mkCtx(makeSave());
    const retreatPage = await ctxRetreat.newPage();
    const retreatErrors = collectErrors(retreatPage);
    await retreatPage.goto('http://127.0.0.1:' + DIST_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(retreatPage);
    await waitText(retreatPage, '提交攻击', 10000);
    await clickButton(retreatPage, '撤退', '.hud button');
    await waitText(retreatPage, 'NEXUS 数字世界 · 服务器网络', 20000);
    const leftStore = (await saveData(retreatPage)).player.progress.bossBattleStats;
    ok(leftStore.active && leftStore.active.battleStatus === 'active' && leftStore.history.length === 0, '暂时离开战斗不判负、不终结统计');
    await retreatPage.reload({ waitUntil: 'commit', timeout: 60000 });
    await sleep(2000);
    await enterBossDiff(retreatPage);
    await clickButton(retreatPage, '放弃本场 · 重新选择');
    await sleep(800);
    const retreatStore = (await saveData(retreatPage)).player.progress.bossBattleStats;
    ok(retreatStore.active === null && retreatStore.history.length === 1, '放弃本场生成 1 份最终统计');
    const retreatSnap = retreatStore.history[0] || {};
    ok(retreatSnap.result === 'retreat' && retreatSnap.battleStatus === 'abandoned' && retreatSnap.finalized === true, '撤退统计结果为 retreat / abandoned');
    const retreatRatingStore = (await saveData(retreatPage)).player.progress.bossBattleRatings;
    ok(retreatRatingStore && retreatRatingStore.history.length === 0, '撤退不生成正式战斗评分');
    const retreatRewardStore = (await saveData(retreatPage)).player.progress.bossBattleRewards;
    ok(retreatRewardStore && retreatRewardStore.history.length === 0, '撤退不生成胜利奖励');
    const retreatAch = (await saveData(retreatPage)).player.progress.bossAchievements;
    ok(retreatAch && retreatAch.unlocked.length === 0, '撤退不解锁正式成就');
    ok(retreatErrors.length === 0, '撤退流程无未捕获异常', retreatErrors.slice(0, 3).join(' | '));
    await retreatPage.screenshot({ path: join(evidence, '05-retreat.png'), fullPage: false });
    await ctxRetreat.close();

    // ---------- 3. DEV 统计面板 + 动态事件统计 ----------
    console.log('=== 4. DEV 统计面板与动态事件 ===');
    const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    dev = spawn(process.execPath, [viteBin, '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', env: { ...process.env } });
    await waitServer('http://127.0.0.1:' + DEV_PORT + '/', 60000);
    const ctxDev = await mkCtx(makeSave());
    const devPage = await ctxDev.newPage();
    const devErrors = collectErrors(devPage);
    await devPage.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(devPage);
    await devPage.locator('.dev-stats-panel').waitFor({ state: 'visible', timeout: 15000 });
    ok(true, 'DEV 环境显示统计面板');
    ok(await devPage.locator('button', { hasText: '导出 JSON' }).first().isVisible(), 'DEV 统计面板提供 JSON 导出');
    // 触发未知入侵并退出 = 玩家失败处理
    await waitWarning(devPage, 45000);
    await devPage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('触发未知入侵（P2）'));
      if (b) b.click();
    });
    await waitText(devPage, '未知入侵 · UNKNOWN INTRUSION', 12000);
    await clickButton(devPage, '退出隔离');
    await waitTextGone(devPage, '未知入侵 · UNKNOWN INTRUSION', 6000);
    await sleep(500);
    const devSave = await saveData(devPage);
    const devStats = devSave.player.progress.bossBattleStats.active;
    ok(devStats && devStats.dynamicEventStats.triggeredCount >= 1, '动态事件触发进入统计');
    ok(devStats && devStats.dynamicEventStats.failedCount >= 1, '玩家退出动态事件统计为失败（非系统成功）');
    ok(devStats && devStats.dynamicEventStats.attackInterruptedCount >= 1, '动态事件中断攻击被统计');
    await waitText(devPage, '最近事件', 8000);
    await devPage.screenshot({ path: join(evidence, '03-dev-stats-panel.png'), fullPage: false });
    ok(devErrors.length === 0, 'DEV 流程无未捕获异常', devErrors.slice(0, 3).join(' | '));
    await ctxDev.close();

    // ---------- 5. 弱点破解被 P2 抢占：只记取消、不算失败 ----------
    console.log('=== 5. 弱点破解被高优先级事件抢占 ===');
    const ctxPreempt = await mkCtx(makeSave());
    const prePage = await ctxPreempt.newPage();
    const preErrors = collectErrors(prePage);
    await prePage.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(prePage);
    let clues = await clueCount(prePage);
    for (let i = 0; i < 4 && clues < 2; i++) {
      await waitWarning(prePage, 45000);
      if (await waitUntilRemaining(prePage, 0.6)) {
        await clickButton(prePage, '防御', '.boss-attack-panel button');
        await waitText(prePage, '防御成功', 12000).catch(() => {});
      }
      await warningGone(prePage);
      clues = await clueCount(prePage);
    }
    ok(clues >= 2, '抢占前获得真实弱点线索');
    await clickButton(prePage, '分析弱点', '.boss-weakness-panel button');
    await waitText(prePage, '弱点已发现', 12000);
    await clickButton(prePage, '开始弱点破解', '.boss-weakness-panel button');
    await prePage.locator('.weakness-crack-panel').waitFor({ state: 'visible', timeout: 15000 });
    await prePage.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('触发未知入侵（P2）'));
      if (b) b.click();
    });
    await waitText(prePage, '未知入侵 · UNKNOWN INTRUSION', 12000);
    await sleep(700);
    const preStore = (await saveData(prePage)).player.progress.bossBattleStats.active;
    ok(preStore && preStore.weaknessStats.cancelledCount >= 1, '被抢占的弱点破解记录为取消');
    ok(preStore && preStore.weaknessStats.crackFailedCount === 0, '被抢占不统计为玩家破解失败');
    ok(preStore && preStore.dynamicEventStats.triggeredCount >= 1, '抢占事件本身正常统计');
    await prePage.screenshot({ path: join(evidence, '06-weakness-preempted.png'), fullPage: false });
    ok(preErrors.length === 0, '抢占流程无未捕获异常', preErrors.slice(0, 3).join(' | '));
    await ctxPreempt.close();

    // ---------- 6. DEV 评分面板：正式评分展示/导出/不改写历史 ----------
    console.log('=== 6. DEV 评分面板 ===');
    if (!victorySaveForDev) throw new Error('缺少胜利存档，无法验证 DEV 评分面板');
    const ratingPanelSeed = JSON.parse(makeSave());
    ratingPanelSeed.player.progress.bossBattleStats = victorySaveForDev.player.progress.bossBattleStats;
    ratingPanelSeed.player.progress.bossBattleRatings = victorySaveForDev.player.progress.bossBattleRatings;
    ratingPanelSeed.player.progress.bossBattleRewards = victorySaveForDev.player.progress.bossBattleRewards;
    ratingPanelSeed.player.progress.bossAchievements = victorySaveForDev.player.progress.bossAchievements;
    const ctxRating = await mkCtx(JSON.stringify(ratingPanelSeed));
    const ratingPage = await ctxRating.newPage();
    const ratingErrors = collectErrors(ratingPage);
    await ratingPage.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(ratingPage);
    await ratingPage.locator('.dev-rating-panel').waitFor({ state: 'visible', timeout: 15000 });
    ok(true, 'DEV 环境显示评分面板');
    const ratingPanelText = await ratingPage.locator('.dev-rating-panel').innerText();
    const storedGrade = victorySaveForDev.player.progress.bossBattleRatings.history[0].grade;
    ok((await ratingPage.locator('.dev-rating-grade').first().innerText()).trim() === storedGrade, 'DEV 面板显示正式评分等级');
    ok(ratingPanelText.includes('评分依据') && ratingPanelText.includes('v1.0.0'), 'DEV 面板显示评分依据与算法版本');
    ok(await ratingPage.locator('button', { hasText: '导出 JSON' }).first().isVisible(), 'DEV 评分面板提供 JSON 导出');
    const ratingsBeforePreview = JSON.stringify((await saveData(ratingPage)).player.progress.bossBattleRatings);
    await ratingPage.locator('.dev-rating-panel button', { hasText: '重算预览' }).first().click();
    await sleep(500);
    const ratingsAfterPreview = JSON.stringify((await saveData(ratingPage)).player.progress.bossBattleRatings);
    ok(ratingsAfterPreview === ratingsBeforePreview, 'DEV 重算预览不写入/覆盖正式评分');
    ok((await ratingPage.locator('.dev-rating-panel').innerText()).includes('临时预览'), 'DEV 预览明确标记为临时预览');
    const rewardPanel = ratingPage.locator('.dev-reward-panel');
    await rewardPanel.waitFor({ state: 'visible', timeout: 10000 });
    const rewardPanelText = await rewardPanel.innerText();
    const storedReward = victorySaveForDev.player.progress.bossBattleRewards.history[0];
    ok(rewardPanelText.includes('已发放') && rewardPanelText.includes(storedReward.rewardId), 'DEV 奖励面板显示正式奖励与 rewardId');
    ok(rewardPanelText.includes('基础奖励') && rewardPanelText.includes('评分加成') && rewardPanelText.includes('实际发放'), 'DEV 奖励面板显示完整明细');
    ok(rewardPanelText.includes('资格：可领取') && rewardPanelText.includes('v1.0.0'), 'DEV 奖励面板显示资格与版本');
    ok(await rewardPanel.locator('button', { hasText: '导出 JSON' }).isVisible(), 'DEV 奖励面板提供导出');
    const rewardsBefore = JSON.stringify((await saveData(ratingPage)).player.progress.bossBattleRewards);
    await rewardPanel.locator('button', { hasText: '重算预览' }).click();
    await sleep(500);
    const rewardsAfter = JSON.stringify((await saveData(ratingPage)).player.progress.bossBattleRewards);
    ok(rewardsAfter === rewardsBefore, 'DEV 奖励预览不写入/不重复发放');
    const achPanel = ratingPage.locator('.dev-achievement-panel');
    await achPanel.waitFor({ state: 'visible', timeout: 10000 });
    const achPanelText = await achPanel.innerText();
    ok(achPanelText.includes('BOSS_PERFECT_DEFENSE') || achPanelText.includes('boss_perfect_defense'), 'DEV 成就面板显示隐藏成就 ID');
    ok(achPanelText.includes('完美防线'), 'DEV 成就面板显示隐藏成就名称/条件');
    ok(achPanelText.includes('已解锁'), 'DEV 成就面板显示解锁状态');
    ok(await achPanel.locator('button', { hasText: '导出 JSON' }).isVisible(), 'DEV 成就面板提供导出');
    const achBefore = JSON.stringify((await saveData(ratingPage)).player.progress.bossAchievements);
    await achPanel.locator('button', { hasText: '重算预览' }).click();
    await sleep(500);
    const achAfter = JSON.stringify((await saveData(ratingPage)).player.progress.bossAchievements);
    ok(achAfter === achBefore, 'DEV 成就预览不写入正式解锁/奖励');
    await ratingPage.screenshot({ path: join(evidence, '07-dev-rating-panel.png'), fullPage: false });
    ok(ratingErrors.length === 0, 'DEV 评分/奖励/成就面板流程无未捕获异常', ratingErrors.slice(0, 3).join(' | '));
    await ctxRating.close();

    // ---------- 7. 浏览器内 partial / invalid 预览 ----------
    console.log('=== 7. partial / invalid 评分预览 ===');
    const ctxPartial = await mkCtx(statsSeed({ battleId: 'battle-preview-partial', dataQuality: 'partial', difficulty: 'hard', noJudge: true }));
    const partialPage = await ctxPartial.newPage();
    const partialErrors = collectErrors(partialPage);
    await partialPage.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(partialPage);
    await partialPage.locator('.dev-rating-panel').waitFor({ state: 'visible', timeout: 15000 });
    await partialPage.locator('.dev-rating-panel button', { hasText: '重算预览' }).first().click();
    await sleep(500);
    const partialText = await partialPage.locator('.dev-rating-panel').innerText();
    ok(partialText.includes('临时预览') && partialText.includes('数据缺失'), 'partial 快照显示临时评分与数据缺失维度');
    const partialRewardPanel = partialPage.locator('.dev-reward-panel');
    await partialRewardPanel.waitFor({ state: 'visible', timeout: 10000 });
    await partialRewardPanel.locator('button', { hasText: '重算预览' }).click();
    await sleep(500);
    const partialRewardText = await partialRewardPanel.innerText();
    ok(partialRewardText.includes('预览') && partialRewardText.includes('评分缺失：是'), '缺失正式评分时奖励预览标记 ratingUnavailable');
    ok(partialRewardText.includes('partial') || partialRewardText.includes('不完整'), 'partial 奖励显示不完整状态');
    ok((await saveData(partialPage)).player.progress.bossBattleRewards.history.length === 0, 'partial 奖励预览不写入正式记录');
    const partialAchPanel = partialPage.locator('.dev-achievement-panel');
    await partialAchPanel.waitFor({ state: 'visible', timeout: 10000 });
    await partialAchPanel.locator('button', { hasText: '重算预览' }).click();
    await sleep(500);
    ok((await saveData(partialPage)).player.progress.bossAchievements.unlocked.length === 0, 'partial 成就预览不正式解锁');
    ok((await partialPage.locator('.dev-achievement-panel').innerText()).includes('partial') || (await partialPage.locator('.dev-achievement-panel').innerText()).includes('不完整'), 'partial 成就预览显示不完整状态');
    ok((await saveData(partialPage)).player.progress.bossBattleRatings.history.length === 0, 'partial 预览不写入正式评分');
    ok(partialErrors.length === 0, 'partial 预览流程无未捕获异常', partialErrors.slice(0, 3).join(' | '));
    await ctxPartial.close();

    const ctxInvalid = await mkCtx(statsSeed({ battleId: 'battle-preview-invalid', dataQuality: 'invalid' }));
    const invalidPage = await ctxInvalid.newPage();
    const invalidErrors = collectErrors(invalidPage);
    await invalidPage.goto('http://127.0.0.1:' + DEV_PORT + '/', { waitUntil: 'commit', timeout: 60000 });
    await enterBoss(invalidPage);
    await invalidPage.locator('.dev-rating-panel').waitFor({ state: 'visible', timeout: 15000 });
    await invalidPage.locator('.dev-rating-panel button', { hasText: '重算预览' }).first().click();
    await sleep(500);
    const invalidText = await invalidPage.locator('.dev-rating-panel').innerText();
    ok(invalidText.includes('invalid') && invalidText.includes('无效'), 'invalid 快照显示无效评分与原因');
    const invalidRewardPanel = invalidPage.locator('.dev-reward-panel');
    await invalidRewardPanel.waitFor({ state: 'visible', timeout: 10000 });
    await invalidRewardPanel.locator('button', { hasText: '重算预览' }).click();
    await sleep(500);
    const invalidRewardText = await invalidRewardPanel.innerText();
    ok(invalidRewardText.includes('不可领取') || invalidRewardText.includes('拒绝'), 'invalid 统计奖励预览显示不可领取');
    ok((await saveData(invalidPage)).player.progress.bossBattleRewards.history.length === 0, 'invalid 奖励预览不写入正式记录');
    const invalidAchPanel = invalidPage.locator('.dev-achievement-panel');
    await invalidAchPanel.waitFor({ state: 'visible', timeout: 10000 });
    await invalidAchPanel.locator('button', { hasText: '重算预览' }).click();
    await sleep(500);
    ok((await saveData(invalidPage)).player.progress.bossAchievements.unlocked.length === 0, 'invalid 成就预览不正式解锁');
    ok((await invalidPage.locator('.dev-achievement-panel').innerText()).includes('invalid') || (await invalidPage.locator('.dev-achievement-panel').innerText()).includes('不完整'), 'invalid 成就预览显示无效状态');
    ok((await saveData(invalidPage)).player.progress.bossBattleRatings.history.length === 0, 'invalid 预览不写入正式评分');
    ok(invalidErrors.length === 0, 'invalid 预览流程无未捕获异常', invalidErrors.slice(0, 3).join(' | '));
    await ctxInvalid.close();
  } finally {
    if (dev) dev.kill();
    if (browser) await browser.close().catch(() => {});
    await new Promise(r => server.close(r));
  }
  console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
  console.log('截图目录：' + evidence);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e && e.message ? e.message : e); process.exit(1); });
