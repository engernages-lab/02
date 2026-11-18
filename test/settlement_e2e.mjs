// A4 端到端：挑战会话统计、成功/失败结算、容错 +N、防重复提交、跨关隔离、A1/A3 回归
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4188;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SAVE_KEY = 'nexus_code_repair_save_v1';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

class CDP {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP 超时: ' + method)); }
      }, 40000);
    });
  }
}

function seedSave({ level = 5, exp = 1040, consciousness = 100, completed = ['tut-1'], failed = {} } = {}) {
  return JSON.stringify({
    version: 7, updatedAt: 1700000000000,
    player: {
      name: 'R-07',
      identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1700000000000 },
      level, exp, consciousness,
      meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
      progress: {
        completedLevels: completed, stars: {}, unlockedServers: ['training', 'syntax'], currentLevelId: null,
        failedAttempts: failed, hintLevels: {}, achievements: [], knowledge: [],
        storySeen: { 'bs-syntax-1': true, 'bs-syntax-2': true, '1-1': true, '1-2': true, '1-3': true, '1-4': true, '1-5': true },
        story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
        flags: { tutorialCinematicShown: true, chapter1ArrivalSeen: true, prologueDone: true },
        bossesDone: [], currentBossId: null, pendingRebirth: false,
      },
      rewards: { credits: 300, trust: 30, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
      settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 1, fullscreen: false, lang: 'zh' },
    },
  });
}

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

let chrome = null, cdp = null, sessionId = null, wsUrl = '', seedScriptId = null;

async function evalJS(expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error('页面脚本异常: ' + (r.exceptionDetails.text || ''));
  return r.result ? r.result.value : undefined;
}

async function waitFor(expr, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const v = await evalJS(expr); if (v) return v; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error('等待超时: ' + label);
}

const clickText = (scope, text) => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(scope)} + ' button')].find(b => (b.textContent || '').includes(${JSON.stringify(text)}));
  if (!el) return false; el.click(); return true;
})()`;

async function setCode(code) {
  const set = await evalJS(`(() => {
    const m = window.monaco;
    if (!m || !m.editor) return false;
    const models = m.editor.getModels();
    if (!models.length) return false;
    models[0].setValue(${JSON.stringify(code)});
    return true;
  })()`);
  if (!set) throw new Error('无法设置编辑器内容');
  const lines = code.split('\n').length;
  await waitFor(`(() => { const m = (document.querySelector('.draft-lines') || {}).textContent || ''; return m.includes('当前 ${lines} 行'); })()`, 8000, '代码同步');
  await sleep(250);
}

async function seedAndOpen(seed) {
  if (seedScriptId) {
    try { await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedScriptId }, sessionId); } catch { /* ignore */ }
    seedScriptId = null;
  }
  const src = `try {
    localStorage.clear();
    localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(seed)});
  } catch (e) {}`;
  const r = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: src }, sessionId);
  seedScriptId = r.identifier;
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' }, sessionId);
  await sleep(800);
}

async function enterChallenge(index = 0) {
  await waitFor(`!!document.querySelector('.boot-wrap')`, 20000, '启动页');
  const hasSkip = await evalJS(`!!([...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('跳过初始化')))`);
  if (hasSkip) await evalJS(clickText('body', '跳过初始化'));
  await evalJS(clickText('body', 'ENTER NEXUS'));
  await waitFor(`document.body.textContent.includes('Python 知识库')`, 15000, '主菜单');
  await evalJS(clickText('body', '继续探索'));
  await waitFor(`document.body.textContent.includes('NEXUS 数字世界 · 服务器网络')`, 15000, '世界地图');
  await waitFor(`document.querySelectorAll('.node-group').length >= 2`, 12000, '地图节点');
  await evalJS(`document.querySelectorAll('.node-group')[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  await waitFor(`document.querySelectorAll('.lv-row').length >= 3`, 12000, '关卡列表');
  await evalJS(`document.querySelectorAll('.lv-row')[${index}].querySelector('button').click()`);
  await waitFor(`!!document.querySelector('.chlg-page')`, 20000, '挑战页');
  await waitFor(`!!document.querySelector('.monaco-editor')`, 20000, '编辑器');
  await sleep(600);
}

async function runCode() {
  const c = await evalJS(clickText('.chlg-page .toolbar', '运行代码'));
  if (!c) throw new Error('找不到运行按钮');
  await sleep(250);
}
async function submitCode(twice = false) {
  const expr = twice
    ? `(() => { const el=[...document.querySelectorAll('.chlg-page .toolbar button')].find(b=>(b.textContent||'').includes('提交修复')); if(!el) return false; el.click(); el.click(); return true; })()`
    : clickText('.chlg-page .toolbar', '提交修复');
  const c = await evalJS(expr);
  if (!c) throw new Error('找不到提交按钮');
  await sleep(250);
}

async function shot(name) {
  try {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
    const dir = join(__dirname, '_a4_shots');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name + '.png'), Buffer.from(r.data, 'base64'));
  } catch { /* ignore */ }
}

async function setViewport(width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 767 }, sessionId);
  await sleep(400);
}

const readSave = `JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null')`;
const readSession = (id) => `(() => { const s=${readSave}; return s && s.player.progress.challengeSessions ? s.player.progress.challengeSessions[${JSON.stringify(id)}] : null; })()`;

const SUCCESS = 'log_title = "服务器状态报告"\n\nif log_title != "":\n    print(log_title)';
const WRONG_OUT = 'log_title = "错误标题"\n\nif log_title != "":\n    print(log_title)';
const SYNTAX = 'if True\n    print(1)';

(async () => {
  if (!existsSync(CHROME)) throw new Error('找不到 Chrome');
  server.listen(PORT, '127.0.0.1');
  await sleep(250);

  const profile = join(tmpdir(), 'nexus-a4-cdp-' + Date.now());
  mkdirSync(profile, { recursive: true });
  const DEBUG_PORT = 9900 + Math.floor(Math.random() * 400);
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1366,900', '--remote-debugging-port=' + DEBUG_PORT,
    '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });

  const t0 = Date.now();
  while (!wsUrl && Date.now() - t0 < 20000) {
    try {
      const j = await (await fetch('http://127.0.0.1:' + DEBUG_PORT + '/json/version')).json();
      if (j && j.webSocketDebuggerUrl) wsUrl = j.webSocketDebuggerUrl;
    } catch { /* not ready */ }
    if (!wsUrl && chrome.exitCode !== null) throw new Error('Chrome 提前退出');
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) throw new Error('Chrome 未开放 CDP');

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  cdp = new CDP(ws);
  const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const attached = await cdp.send('Target.attachToTarget', { targetId: created.targetId, flatten: true });
  sessionId = attached.sessionId;
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

  console.log('=== A. 成功结算 + 容错 +1（Lv2→3）+ 会话统计 ===');
  await seedAndOpen(seedSave({ level: 2, exp: 220, consciousness: 100 }));
  await enterChallenge(0);
  ok(true, '进入 1-1');

  await setCode(SYNTAX);
  await runCode();
  await waitFor(`(() => { const el=document.querySelector('.diag-panel'); return el && el.dataset.status==='done'; })()`, 15000, '诊断完成');
  await setCode(WRONG_OUT);
  await submitCode();
  await waitFor(`!!document.querySelector('.result-banner.fail')`, 15000, '判题失败横幅');

  let s = await evalJS(readSession('1-1'));
  ok(s && s.status === 'active' && s.runs === 1 && s.submits === 1 && s.errors === 1, '会话记录运行/提交/失误', JSON.stringify(s && { r: s.runs, s: s.submits, e: s.errors }));
  ok((await evalJS(`(() => { const s=${readSave}; return s.version; })()`)) === 9, '旧档 v7 已迁移为 v9');
  const hudText = `([...document.querySelectorAll('.hud-chip')].find(x => (x.textContent || '').includes('容错')) || {}).textContent || ''`;
  ok((await evalJS(hudText)).includes('2/3'), '失败一次后 HUD 显示容错 2/3（上限 3）');

  await setCode(SUCCESS);
  await submitCode(true); // 双击：应只结算一次
  await waitFor(`document.body.textContent.includes('修复成功')`, 20000, '成功面板');
  const panel = await evalJS(`document.querySelector('.cp-summary').parentElement.textContent`);
  ok(/修复成功/.test(panel), '显示挑战完成状态');
  ok(/用时\s*\d{2}:\d{2}/.test(panel), '显示本次挑战用时', panel.slice(0, 120));
  ok(/运行\s*1\s*次/.test(panel), '显示运行次数 1');
  ok(/提交\s*2\s*次/.test(panel), '显示提交次数 2（双击未重复计数）');
  ok(/失误\s*1\s*次/.test(panel), '显示错误次数 1');
  ok(/容错\s*剩余\s*3\s*\/\s*上限\s*4/.test(panel), '容错剩余/上限按等级 4 计算', panel.slice(0, 200));
  ok(/本次消耗\s*1\s*次/.test(panel), '显示本次容错消耗');
  ok(/容错次数 \+1/.test(panel), '升级提示显示真实增量 +1');
  ok(!/容错次数 \+0/.test(panel), '不再出现虚假的「+0」');
  ok(!/NaN|undefined/.test(panel), '结算面板无 NaN/undefined');
  ok(/等级 Lv\.3/.test(panel) && /经验\s*280/.test(panel), '显示等级与经验进度', panel.slice(0, 240));

  const save1 = await evalJS(readSave);
  const sess1 = save1.player.progress.challengeSessions['1-1'];
  ok(sess1.status === 'passed' && sess1.endedAt > 0, '会话已结算为通过');
  ok(sess1.settlement && sess1.settlement.result === 'passed', '写入成功结算');
  ok(sess1.settlement.submits === 2 && sess1.settlement.errors === 1 && sess1.settlement.runs === 1, '结算计数与会话一致');
  ok(sess1.settlement.toleranceGain === 1 && sess1.settlement.toleranceMax === 4, '结算记录容错增量与上限');
  ok(sess1.settlement.expAfter === 280 && sess1.settlement.levelAfter === 3, '结算记录真实经验与等级');
  ok(save1.player.rewards.credits > 300, '贡献点真实发放', String(save1.player.rewards.credits));
  const draft = await evalJS(`localStorage.getItem('nexus_draft_v1:p1700000000000:1-1')`);
  ok(!!draft && JSON.parse(draft).code === SUCCESS, 'A1 草稿仍保存成功代码');
  await shot('settle-success');
  await setViewport(390, 844);
  const mobilePanel = await evalJS(`(() => { const el=document.querySelector('.complete-panel'); if(!el) return null; const r=el.getBoundingClientRect(); return { right: Math.round(r.right), vw: innerWidth, sw: document.documentElement.scrollWidth, text: el.textContent }; })()`);
  ok(mobilePanel && mobilePanel.right <= mobilePanel.vw + 1 && mobilePanel.sw <= mobilePanel.vw + 1, '手机端成功结算无横向溢出');
  ok(mobilePanel && /容错\s*剩余/.test(mobilePanel.text), '手机端成功结算显示容错数据');
  const reach = await evalJS(`(() => {
    const ov = document.querySelector('.ov-result');
    if (!ov) return null;
    ov.scrollTop = ov.scrollHeight;
    const btns = [...ov.querySelectorAll('button')];
    const b = btns[btns.length - 1];
    const r = b.getBoundingClientRect();
    return { scrollable: ov.scrollHeight > ov.clientHeight, bottom: Math.round(r.bottom), vh: innerHeight, label: b.textContent };
  })()`);
  ok(reach && reach.scrollable, '手机端结算面板可滚动（内容高于视口）');
  ok(reach && reach.bottom <= reach.vh + 1, '滚动后结算按钮可达', JSON.stringify(reach));
  await shot('settle-success-mobile');
  await setViewport(1366, 900);

  console.log('=== B. 下一关：会话隔离 ===');
  await evalJS(`(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('下一关')); b && b.click(); })()`);
  await waitFor(`document.body.textContent.includes('丢失的字符') || !!document.querySelector('.chlg-page .hud-title')`, 12000, '下一关');
  await waitFor(`!!document.querySelector('.monaco-editor')`, 15000, '下一关编辑器');
  await sleep(700);
  const sess12 = await evalJS(readSession('1-2'));
  ok(sess12 && sess12.status === 'active' && sess12.errors === 0 && sess12.runs === 0, '下一关会话从零开始（不继承上一关）');
  const hud12 = await evalJS(`([...document.querySelectorAll('.hud-chip')].find(x => (x.textContent || '').includes('容错')) || {}).textContent || ''`);
  ok(hud12.includes('4/4'), '下一关 HUD 容错 4/4', hud12);

  console.log('=== C. 满级容错：不伪造 +0 ===');
  await seedAndOpen(seedSave({ level: 9, exp: 2770, consciousness: 100 }));
  await enterChallenge(0);
  await setCode(SUCCESS);
  await submitCode();
  await waitFor(`document.body.textContent.includes('修复成功')`, 20000, '满级成功面板');
  const panel2 = await evalJS(`document.querySelector('.cp-summary').parentElement.textContent`);
  ok(/等级 Lv\.10/.test(panel2), '升到 Lv.10', panel2.slice(0, 160));
  ok(/容错次数已达到最高上限 7 次/.test(panel2), '达到上限时给出明确原因', panel2.slice(0, 260));
  ok(!/容错次数 \+0/.test(panel2), '满级不再显示 +0');
  ok(!/NaN|undefined/.test(panel2), '满级结算无 NaN/undefined');

  console.log('=== D. 失败结算（容错耗尽 → 防御失败 → 意识归零） ===');
  await seedAndOpen(seedSave({ level: 1, exp: 0, consciousness: 10 }));
  await enterChallenge(0);
  await setCode(WRONG_OUT);
  for (let i = 0; i < 4; i++) {
    await submitCode();
    await sleep(900);
  }
  await waitFor(`!!document.querySelector('.ov-attack')`, 20000, '纠错者攻击演出');
  await waitFor(`!!document.querySelector('.ov-attack .monaco-editor')`, 15000, '防御代码编辑器');
  await sleep(1200);
  // 把防御代码改成「能运行但判题不过」，两次失败 → 意识 10 - 30 = 0
  await evalJS(`(() => {
    const models = window.monaco.editor.getModels();
    const m = models.find(x => x.getValue().includes('??')) || models[models.length - 1];
    if (m) m.setValue('print(123)');
    return true;
  })()`);
  await sleep(400);
  for (let i = 0; i < 2; i++) {
    const c = await evalJS(`(() => { const b=[...document.querySelectorAll('.ov-attack button')].find(x=>(x.textContent||'').includes('提交防御')); if(!b) return false; b.click(); return true; })()`);
    if (!c) throw new Error('找不到提交防御按钮');
    await sleep(1800);
  }
  await waitFor(`!!document.querySelector('.reb-settle')`, 30000, '失败结算面板');
  const failText = await evalJS(`document.querySelector('.reb-settle').textContent`);
  ok(/挑战失败/.test(failText), '显示挑战失败状态');
  ok(/失败原因/.test(failText), '显示失败原因');
  ok(/容错上限\s*3/.test(failText), '显示容错上限 3', failText.slice(0, 200));
  ok(/已使用容错\s*3/.test(failText), '已使用容错封顶为 3');
  ok(/剩余容错\s*0/.test(failText), '剩余容错为 0');
  ok(/意识 -10%/.test(failText), '显示实际扣除的意识值', failText.slice(0, 260));
  ok(/运行 \/ 提交/.test(failText), '显示运行/提交次数');
  ok(!/NaN|undefined/.test(failText), '失败结算无 NaN/undefined');
  ok(!/修复成功|贡献点/.test(failText), '失败结算不显示成功奖励');
  await shot('settle-failure');

  const save3 = await evalJS(readSave);
  const sessF = save3.player.progress.challengeSessions['1-1'];
  ok(sessF.status === 'failed' && sessF.settlement.result === 'failed', '会话写入失败结算');
  ok(sessF.settlement.toleranceUsed === 3 && sessF.settlement.toleranceRemaining === 0, '失败结算的容错字段正确');
  ok(sessF.settlement.resourceLoss && sessF.settlement.resourceLoss.amount === 10, '记录实际资源损失 10');
  ok(save3.player.progress.pendingRebirth === true, '进入待重生状态');

  console.log('=== E. 重新挑战入口 ===');
  const retry = await evalJS(`(() => { const b=[...document.querySelectorAll('.reb-settle button')].find(x=>(x.textContent||'').includes('重新挑战')); if(!b) return false; b.click(); return true; })()`);
  ok(retry, '失败结算提供重新挑战入口');
  await waitFor(`!!document.querySelector('.ov-death .dlg-root')`, 12000, '进入重组对话');

  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  finish(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('A4 E2E 失败:', e && e.message ? e.message : e);
  finish(1);
});

function finish(code) {
  try { server.close(); } catch { /* ignore */ }
  try { if (cdp) cdp.ws.close(); } catch { /* ignore */ }
  try { if (chrome && chrome.pid) spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* ignore */ }
  setTimeout(() => process.exit(code), 400);
}
