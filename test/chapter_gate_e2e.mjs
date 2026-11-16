// V1.1.1 章节门禁端到端：章节状态面板 / 未解锁章节不能进入 / Boss 必经 / 原初核心五碎片校验
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4187;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };

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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
process.on('unhandledRejection', () => { /* jsdom 资源拒绝忽略 */ });
const vc = new VirtualConsole();
vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const CH1 = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
const CH2 = ['2-1', '2-2', '2-3', '2-4', '2-5'];
const CH3 = ['3-1', '3-2', '3-3', '3-4', '3-5'];
const CH4 = ['4-1', '4-2', '4-3', '4-4', '4-5'];

function makeSave({
  completedLevels = CH1,
  unlockedServers = ['training', 'syntax'],
  bossesDone = [],
  fragments = [],
  flags = {},
  currentLevelId = null,
  currentBossId = null,
} = {}) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 4, exp: 600, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: fragments, fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels, stars: {}, unlockedServers, currentLevelId,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      vault: { read: [], finalSeen: false, lastOpened: null },
      flags: { prologueDone: true, tutorialCinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, ...flags },
      bossesDone, battles: {}, currentBossId, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  };
  return JSON.stringify({ version: 7, updatedAt: Date.now(), player });
}

async function launch(seed) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { if (seed) w.localStorage.setItem('nexus_code_repair_save_v1', seed); },
  });
}

function helpers(dom) {
  const w = dom.window, d = w.document;
  return {
    w, d,
    text: () => d.body.textContent || '',
    q: (s) => d.querySelector(s),
    qa: (s) => Array.from(d.querySelectorAll(s)),
    click: (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })),
    save: () => JSON.parse(w.localStorage.getItem('nexus_code_repair_save_v1') || '{}'),
    async wait(fn, ms, label) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        try { const v = fn(); if (v) return v; } catch { /* retry */ }
        await sleep(100);
      }
      throw new Error('超时: ' + label);
    },
  };
}

async function toMap(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  const skip = h.qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (skip) h.click(skip);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
  const cont = h.qa('button').find(b => b.textContent.includes('继续探索')) || h.qa('button').find(b => b.textContent.includes('开始探索'));
  h.click(cont);
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 12000, '地图');
}

async function advanceCinema(h, max = 40) {
  for (let i = 0; i < max; i++) {
    if (!h.q('.cine-root')) return;
    const skip = h.qa('button').find(b => b.textContent.includes('跳过'));
    if (skip) h.click(skip);
    await sleep(120);
    if (!h.q('.cine-root')) return;
    const body = h.q('.cine-body') || h.q('.cine-root');
    if (body) h.click(body);
    await sleep(120);
  }
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：第一章等待 Boss，第二章锁定 ----------
  console.log('=== 第一轮：章节状态面板 / 锁定提示 ===');
  let dom = await launch(makeSave({ bossesDone: [], unlockedServers: ['training', 'syntax'] }));
  let h = helpers(dom);
  await toMap(h);
  await advanceCinema(h);
  ok(!!h.q('.chapter-track'), '地图显示六章主线状态面板');
  ok(h.qa('.ct-card').length === 6, '六张章节卡片');
  ok(h.text().includes('BOSS REQUIRED'), '第一章显示 BOSS REQUIRED');
  ok(h.text().includes('LOCKED'), '未解锁章节显示 LOCKED');
  const chapterCards = h.qa('.ct-card');
  ok(chapterCards[1].textContent.includes('需要完成第 1 章') || chapterCards[1].textContent.includes('GATE-01'), '第二章卡片明确提示解锁条件', chapterCards[1].textContent);

  // 点击锁定节点 → 明确提示条件，不进入
  h.click(h.qa('.node-group')[2]);
  await sleep(400);
  ok(h.text().includes('GATE-01') && h.text().includes('SHARD-01'), '锁定章节提示包含 Boss 与碎片条件', h.text().slice(-300));
  ok(!h.text().includes('分流的消息'), '锁定章节不会展示第二章关卡');

  // 直接留下未解锁关卡的 currentLevelId → 地图不提供"继续"入口
  dom.window.close();
  dom = await launch(makeSave({ currentLevelId: '2-1' }));
  h = helpers(dom);
  await toMap(h);
  const continueBtn = h.qa('button').find(b => b.textContent.includes('继续：'));
  ok(!continueBtn, '未解锁章节的「继续上次修复」入口被隐藏');
  ok(!h.q('.code-frame') && !h.text().includes('提交修复'), '未解锁关卡页面没有渲染（地图直接拦住）');
  dom.window.close();

  // ---------- 第二轮：Boss 未部署（本章普通关卡未完成） ----------
  console.log('=== 第二轮：普通关卡未完成 → Boss 不可挑战 ===');
  dom = await launch(makeSave({
    completedLevels: CH1,
    unlockedServers: ['training', 'syntax', 'logs'],
    bossesDone: ['gate-01'],
    fragments: ['frag-01'],
    flags: { chapter1Done: true, chapter1CinematicShown: true },
  }));
  h = helpers(dom);
  await toMap(h);
  await advanceCinema(h);
  h.click(h.qa('.node-group')[2]);
  await sleep(400);
  ok(h.text().includes('SOMNIA'), '第二章面板显示 SOMNIA 信息');
  ok(h.text().includes('尚未部署') || h.text().includes('BOSS REQUIRED'), '显示 Boss 尚未部署');
  ok(!h.qa('button').some(b => b.textContent.includes('挑战 ▸')), '未完成普通关卡时没有挑战入口');
  dom.window.close();

  // ---------- 第三轮：普通关卡完成 → Boss 必经入口 ----------
  console.log('=== 第三轮：普通关卡完成 → Boss 挑战入口 ===');
  dom = await launch(makeSave({
    completedLevels: [...CH1, ...CH2],
    unlockedServers: ['training', 'syntax', 'logs'],
    bossesDone: ['gate-01'],
    fragments: ['frag-01'],
    flags: { chapter1Done: true, chapter1CinematicShown: true, chapter2Done: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true },
  }));
  h = helpers(dom);
  await toMap(h);
  await advanceCinema(h);
  h.click(h.qa('.node-group')[2]);
  const somBtn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('挑战 ▸')), 8000, 'SOMNIA 挑战');
  ok(!!somBtn, '第二章普通关卡完成后出现 SOMNIA 挑战入口');
  ok(h.text().includes('SHARD-02'), '入口提示第二枚碎片');
  h.click(somBtn);
  await sleep(600);
  await advanceCinema(h);
  await h.wait(() => h.q('.boss-arena'), 12000, 'SOMNIA 战斗界面');
  ok(h.text().includes('记忆分流'), '进入 SOMNIA 战斗界面');
  dom.window.close();

  // ---------- 第四轮：原初核心门禁（四枚碎片 vs 五枚碎片） ----------
  console.log('=== 第四轮：原初核心五枚碎片校验 ===');
  const fourFragments = ['frag-01', 'frag-02', 'frag-03', 'frag-04'];
  const fourBosses = ['gate-01', 'somnia', 'index-0', 'judgment-4'];
  const baseSeed = {
    completedLevels: [...CH1, ...CH2, ...CH3, ...CH4],
    unlockedServers: ['training', 'syntax', 'logs', 'storage', 'factory', 'diag', 'core'],
    bossesDone: fourBosses,
    fragments: fourFragments,
    flags: {
      chapter1Done: true, chapter2Done: true, chapter3Done: true, chapter4Done: true,
      chapter1CinematicShown: true, chapter2CinematicShown: true, chapter3CinematicShown: true, chapter4CinematicShown: true,
      chapter1ArrivalSeen: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true, chapter3ArrivalSeen: true, chapter4ArrivalSeen: true, chapter5ArrivalSeen: true,
    },
  };
  dom = await launch(makeJSON(baseSeed));
  h = helpers(dom);
  await toMap(h);
  await advanceCinema(h);
  ok(h.text().includes('原初核心'), '地图显示原初核心入口');
  ok(h.text().includes('碎片 4/5') || h.text().includes('4 / 5'), '原初核心显示 4/5 碎片');
  h.click(h.qa('.node-group')[6]);
  await sleep(400);
  ok(h.text().includes('碎片不足') || h.text().includes('SHARD-05'), '四枚碎片时原初核心锁定并说明缺少 SHARD-05');
  ok(!h.qa('button').some(b => b.textContent.includes('进入原初核心')), '四枚碎片时不提供进入原初核心按钮');
  dom.window.close();

  dom = await launch(makeJSON({ ...baseSeed, fragments: [...fourFragments, 'frag-05'] }));
  h = helpers(dom);
  await toMap(h);
  await advanceCinema(h);
  h.click(h.qa('.node-group')[6]);
  const coreBtn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('进入原初核心')), 8000, '原初核心入口');
  ok(!!coreBtn, '五枚碎片齐全 → 出现进入原初核心按钮');
  h.click(coreBtn);
  await sleep(600);
  await advanceCinema(h);
  await h.wait(() => h.q('.boss-arena'), 12000, 'K-0 战斗界面');
  ok(h.text().includes('K-0'), '进入 K-0 最终 Boss 战');
  ok(h.text().includes('绝对安全壁垒'), 'K-0 第一阶段渲染');
  dom.window.close();

  // ---------- 第五轮：已首胜 Boss 提供模拟再战，不发永久奖励 ----------
  console.log('=== 第五轮：已首胜 → 模拟再战 ===');
  const clearedFull = {
    hp: 0, maxHp: 100, phase: 4, phaseMask: [7, 15, 7, 3], failures: 3, cleared: true, updatedAt: 1,
  };
  const clearedSeed = makeSave({
    bossesDone: ['gate-01'],
    fragments: ['frag-01'],
    flags: { chapter1Done: true, chapter1CinematicShown: true },
  });
  const clearedObj = JSON.parse(clearedSeed);
  clearedObj.player.progress.battles = { 'gate-01': clearedFull };
  dom = await launch(JSON.stringify(clearedObj));
  h = helpers(dom);
  await toMap(h);
  await advanceCinema(h);
  h.click(h.qa('.node-group')[1]);
  await sleep(400);
  ok(h.text().includes('已击破'), '已首胜章节显示已击破');
  const simBtn = h.qa('button').find(b => b.textContent.includes('模拟再战'));
  ok(!!simBtn, '已首胜提供模拟再战入口');
  ok(!h.qa('button').some(b => b.textContent.includes('挑战 ▸')), '已首胜不再提供首次挑战入口');
  if (simBtn) {
    h.click(simBtn);
    await sleep(600);
    await advanceCinema(h);
    await h.wait(() => h.q('.boss-arena'), 12000, '模拟再战界面');
    ok(h.text().includes('模拟再战'), '战斗界面标记为模拟再战');
    ok(h.text().includes('不扣血') || h.text().includes('不发放永久奖励'), '界面明示模拟挑战不发奖励');
  }
  dom.window.close();

  server.close();
  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  process.exit(pass === total ? 0 : 1);
})().catch(e => {
  console.error('E2E 失败:', e && e.message ? e.message : e);
  server.close();
  process.exit(1);
});

function makeJSON(seed) {
  return makeSave(seed);
}
