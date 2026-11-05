// 端到端验证：序章演出（含名称设置）→ 第一章前往/恢复/警告 → GATE-01 入口 → Boss 演出 → 碎片档案
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4178;
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
vc.on('error', () => {});
vc.on('warn', () => {});
vc.on('jsdomError', () => {});

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

const baseSettings = { musicVolume: 0.35, sfxVolume: 0.6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' };

function makeSave(over) {
  const player = {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 2, exp: 100, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], backupLevel: 1 },
    progress: {
      completedLevels: [], stars: {}, unlockedServers: ['training'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: {}, bossesDone: [], currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: baseSettings,
    ...(over && over.player ? over.player : {}),
  };
  if (over && over.progress) player.progress = { ...player.progress, ...over.progress };
  if (over && over.flags) player.progress.flags = over.flags;
  if (over && over.meta) player.meta = { ...player.meta, ...over.meta };
  return JSON.stringify({ version: 6, updatedAt: Date.now(), player });
}

async function launch(seed) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) { if (seed) window.localStorage.setItem('nexus_code_repair_save_v1', seed); },
  });
}

function helpers(dom) {
  const w = dom.window, d = w.document;
  return {
    w, d,
    text: () => d.body.textContent || '',
    q: (s) => d.querySelector(s),
    qa: (s) => Array.from(d.querySelectorAll(s)),
    click: (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })),
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

async function enterMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  // 关闭动画时启动序列会直接完成，跳过按钮不渲染——两种情形都要兼容
  const skipBtn = h.qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (skipBtn) h.click(skipBtn);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
}

/** 逐句点击推进，累积出现过的文本（演出一次只渲染一句） */
async function advanceUntil(h, predicate, maxClicks = 40) {
  let acc = h.text();
  if (predicate(acc)) return acc;
  for (let i = 0; i < maxClicks; i++) {
    const t = h.q('.dlg-text');
    if (!t) break;
    h.click(t);
    await sleep(50);
    acc += '\n' + h.text();
    if (predicate(acc)) return acc;
  }
  return acc;
}

const skipCinema = async (h) => {
  const btn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('跳过')), 8000, '跳过演出');
  h.click(btn);
  await sleep(300);
};

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：序章完整演出 + 名称设置 ----------
  console.log('=== 第一轮：序章演出 + 名称设置 ===');
  let dom = await launch(null);
  let h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('新的开始')));
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('确认，开启新轮回')), 6000, '确认新游戏'));

  await h.wait(() => h.q('.cine-root'), 10000, '序章演出界面');
  ok(!!h.q('.cine-root'), '序章使用独立演出界面（.cine-root）');
  ok(h.text().includes('序章 · 沉睡的意识'), '演出标题为「序章 · 沉睡的意识」');
  ok(h.text().includes('地下服务器'), '开场位于地下服务器');
  const p1 = (h.q('.dlg-progress')?.textContent || '').trim();
  ok(p1.startsWith('1 / ') && p1.length > 4, '演出进度显示 1 / N', p1);

  // 点击推进直到出现名称输入
  let input = null;
  for (let i = 0; i < 80 && !input; i++) {
    input = h.q('input[maxlength="12"]');
    if (input) break;
    const t = h.q('.dlg-text');
    if (t) h.click(t);
    await sleep(60);
  }
  ok(!!input, '序章出现「名称设置」输入框');
  ok(h.text().includes('你希望我怎么称呼你'), 'MIRA 询问玩家希望被如何称呼');

  // 输入自定义名称
  const setVal = (el, v) => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  setVal(input, '小林');
  await sleep(120);
  h.click(h.qa('button').find(b => b.textContent.includes('确认名称')));
  await sleep(300);

  let sv = h.save();
  ok(sv.player.identity.displayName === '小林', '序章内设置的名称已写入存档');
  ok(sv.player.identity.originCode === 'R-07', '名称设置后原始编号仍为 R-07');
  ok(h.text().includes('小林'), '后续台词使用自定义名称称呼玩家');

  await skipCinema(h);
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '跳过序章后进入地图');
  sv = h.save();
  ok(sv.player.progress.flags.prologueDone === true, '序章完成标记已保存');
  ok((sv.player.progress.story.unlocked || []).includes('prologue'), '剧情事件 prologue 已解锁');
  ok(Object.keys(sv.player.progress.story.seen || {}).length >= 20, '序章台词阅读状态已记录');
  dom.window.close();

  // ---------- 第二轮：前往数据港（第一章开场演出） ----------
  console.log('=== 第二轮：第一章 · 前往数据港 ===');
  const arrivalSave = makeSave({
    progress: { completedLevels: ['tut-1'], unlockedServers: ['training', 'syntax'], currentLevelId: null },
    flags: { prologueDone: true, tutorialCinematicShown: true },
  });
  dom = await launch(arrivalSave);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('继续游戏')));
  await h.wait(() => h.q('.cine-root'), 12000, '前往数据港演出');
  ok(h.text().includes('第一章 · 失落的数据港'), '章节标题为「第一章 · 失落的数据港」');
  const arrivalText = await advanceUntil(h, s => s.includes('五个节点') || s.includes('5 个能源节点'), 12);
  ok(arrivalText.includes('五个节点') || arrivalText.includes('5 个能源节点'), 'MIRA 说明数据港能源节点');
  ok(arrivalText.includes('MIRA'), 'MIRA 出场');
  await skipCinema(h);
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '返回地图');
  ok(h.save().player.progress.flags.chapter1ArrivalSeen === true, '「前往数据港」演出已记录');

  // 地图面板显示能源节点进度
  h.click(h.qa('.node-group')[1]);
  await h.wait(() => h.text().includes('数据港能源节点'), 8000, '能源节点面板');
  ok(h.text().includes('0 / 5'), '能源节点进度 0 / 5');
  dom.window.close();

  // ---------- 第三轮：数据港恢复 + K-0 警告 ----------
  console.log('=== 第三轮：数据港恢复 + K-0 第一次警告 ===');
  const restoredSave = makeSave({
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'],
      unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
    },
    flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true },
  });
  dom = await launch(restoredSave);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('继续游戏')));
  await h.wait(() => h.q('.cine-root'), 12000, '数据港恢复演出');
  const recordText = await advanceUntil(h, s => s.includes('R-SERIES') && s.includes('前六代'), 24);
  ok(recordText.includes('R-SERIES') || recordText.includes('前六代'), '首次出现 R-07 实验记录');
  const k0Text = await advanceUntil(h, s => s.includes('K-0') && s.includes('GATE-01'), 24);
  ok(k0Text.includes('K-0'), 'K-0 第一次发出警告');
  ok(k0Text.includes('GATE-01'), 'K-0 部署 GATE-01');
  await skipCinema(h);
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '恢复演出后回地图');
  ok(h.save().player.progress.flags.chapter1RestoreSeen === true, '数据港恢复演出已记录');

  // 面板出现 GATE-01 挑战入口
  h.click(h.qa('.node-group')[1]);
  await h.wait(() => h.text().includes('GATE-01'), 8000, 'GATE-01 入口');
  ok(h.text().includes('数据港守卫'), '面板显示「数据港守卫」');
  ok(h.text().includes('5 / 5'), '能源节点进度 5 / 5');
  const challenge = h.qa('button').find(b => b.textContent.includes('挑战 ▸'));
  ok(!!challenge, '面板有挑战按钮');

  // ---------- 第四轮：GATE-01 Boss 战前演出 ----------
  console.log('=== 第四轮：GATE-01 Boss 演出 ===');
  if (challenge) {
    h.click(challenge);
    await h.wait(() => h.q('.cine-root'), 12000, 'Boss 战前演出');
    ok(h.text().includes('GATE-01'), 'Boss 战前演出出现 GATE-01');
    ok(h.text().includes('数据港守卫'), '演出点明 GATE-01 是数据港守卫');
    await skipCinema(h);
    await h.wait(() => h.q('.boss-arena'), 12000, 'Boss 战斗界面');
    ok(h.text().includes('提交攻击'), 'Boss 战界面有「提交攻击」按钮');
    ok(h.text().includes('能源启动程序'), 'Boss 战从第一阶段开始');
  }
  dom.window.close();

  // ---------- 第五轮：碎片《初始指令》档案 ----------
  console.log('=== 第五轮：第一枚碎片档案 ===');
  const fragSave = makeSave({
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'],
      unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      bossesDone: ['gate-01'],
    },
    flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
    meta: { memoryFragments: ['frag-01'] },
  });
  dom = await launch(fragSave);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('剧情档案')));
  await h.wait(() => h.text().includes('创世主碎片 · 六枚'), 10000, '碎片档案');
  ok(h.text().includes('初始指令'), '档案显示第一枚碎片《初始指令》');
  ok(h.text().includes('1 / 6'), '碎片进度为 1 / 6');
  ok(h.text().includes('恩格尔'), '角色档案包含恩格尔');
  dom.window.close();

  // ---------- 第六轮：第二章 · 进入记忆花园 ----------
  console.log('=== 第六轮：第二章 · 破碎的记忆花园 ===');
  const ch2Arrive = makeSave({
    progress: { completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'], unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null },
    flags: { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true },
  });
  dom = await launch(ch2Arrive);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('继续游戏')));
  await h.wait(() => h.q('.cine-root'), 12000, '第二章开场演出');
  ok(h.text().includes('第二章 · 破碎的记忆花园'), '章节标题为「第二章 · 破碎的记忆花园」');
  const ch2Text = await advanceUntil(h, s => s.includes('记忆花园') && s.includes('SOMNIA'), 14);
  ok(ch2Text.includes('记忆花园'), '开场说明记忆花园');
  ok(ch2Text.includes('SOMNIA'), '开场点名吞噬者 SOMNIA');
  await skipCinema(h);
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '第二章开场后回地图');
  ok(h.save().player.progress.flags.chapter2ArrivalSeen === true, '第二章开场演出已记录');

  // ---------- 第七轮：花园恢复 + MIRA 坦白 ----------
  console.log('=== 第七轮：花园恢复 + MIRA 坦白 ===');
  const ch2Restore = makeSave({
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5'],
      unlockedServers: ['training', 'syntax', 'logs', 'storage'], currentLevelId: null,
    },
    flags: {
      prologueDone: true, tutorialCinematicShown: true, chapter1Done: true,
      chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true,
      chapter2Done: true, chapter2ArrivalSeen: true, chapter3ArrivalSeen: true,
    },
  });
  dom = await launch(ch2Restore);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('继续游戏')));
  await h.wait(() => h.q('.cine-root'), 12000, '第二章恢复演出');
  const restoreText = await advanceUntil(h, s => s.includes('我删掉过你的一部分记忆'), 26);
  ok(restoreText.includes('我删掉过你的一部分记忆'), 'MIRA 承认删改过 R-07 的记忆');
  ok(restoreText.includes('恩格尔'), '补充恩格尔的历史记录');
  const somniaText = await advanceUntil(h, s => s.includes('SOMNIA') && s.includes('K-0'), 20);
  ok(somniaText.includes('SOMNIA'), 'SOMNIA 登场');
  ok(somniaText.includes('K-0'), 'SOMNIA 与 K-0 的关联被点出');
  await skipCinema(h);
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '恢复演出后回地图');
  ok(h.save().player.progress.flags.chapter2RestoreSeen === true, '花园恢复演出已记录');

  // ---------- 第八轮：SOMNIA 战斗界面 ----------
  console.log('=== 第八轮：SOMNIA 战斗界面 ===');
  const somniaSave = makeSave({
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5'],
      unlockedServers: ['training', 'syntax', 'logs', 'storage'], currentLevelId: null,
    },
    flags: {
      prologueDone: true, tutorialCinematicShown: true, chapter1Done: true,
      chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true,
      chapter2Done: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true, chapter2CinematicShown: true, chapter3ArrivalSeen: true,
    },
  });
  dom = await launch(somniaSave);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('继续游戏')));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 12000, '地图');
  h.click(h.qa('.node-group')[2]);
  const somBtn = await h.wait(() => h.qa('button').find(b => b.textContent.includes('挑战 ▸')), 8000, 'SOMNIA 入口');
  ok(h.text().includes('SOMNIA'), '面板显示 SOMNIA');
  ok(h.text().includes('记忆吞噬体'), '面板显示「记忆吞噬体」');
  h.click(somBtn);
  await sleep(500);
  if (h.q('.cine-root')) {
    const sk = h.qa('button').find(b => b.textContent.includes('跳过'));
    if (sk) h.click(sk);
    await sleep(400);
  }
  await h.wait(() => h.q('.boss-arena'), 12000, 'SOMNIA 战斗界面');
  ok(h.text().includes('记忆分流'), 'SOMNIA 第一阶段为「记忆分流」');
  ok(h.qa('.pip').length === 4, 'SOMNIA 四阶段刻度');
  dom.window.close();

  // ---------- 第九轮：第二枚碎片《守护者的约定》 ----------
  console.log('=== 第九轮：第二枚碎片 ===');
  const frag2Save = makeSave({
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5'],
      unlockedServers: ['training', 'syntax', 'logs', 'storage'], currentLevelId: null,
      bossesDone: ['gate-01', 'somnia'],
    },
    flags: {
      prologueDone: true, tutorialCinematicShown: true, chapter1Done: true,
      chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true,
      chapter2Done: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true, chapter2CinematicShown: true,
    },
    meta: { memoryFragments: ['frag-01', 'frag-02'] },
  });
  dom = await launch(frag2Save);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('剧情档案')));
  await h.wait(() => h.text().includes('创世主碎片 · 六枚'), 10000, '碎片档案');
  ok(h.text().includes('守护者的约定'), '档案显示第二枚碎片《守护者的约定》');
  ok(h.text().includes('2 / 6'), '碎片进度为 2 / 6');
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
