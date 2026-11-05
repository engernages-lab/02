// 浏览器级冒烟测试：用 jsdom 加载生产构建产物，跑通核心流程：
// 启动页 → 跳过初始化 → ENTER → 主菜单 → 新的开始 → 序章跳过 → 地图 → 进入训练关卡
// → 验证 localStorage 存档 → 模拟刷新（新实例预置存档）→ 主菜单显示「继续游戏」
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'dist');
const PORT = 4174;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = normalize(join(root, p));
    if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  } catch { res.writeHead(500); res.end('err'); }
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// jsdom 无法加载 Monaco CDN 时会产生 error 事件 rejection（预期噪音）。
// 不做处理会让 Node 22+ 把未处理 rejection 当作致命错误退出，这里计数静默。
let unhandledCount = 0;
process.on('unhandledRejection', (reason) => {
  unhandledCount++;
  if (unhandledCount <= 2) console.log('  [ignored jsdom resource rejection]', reason && reason.type ? reason.type : String(reason).slice(0, 100));
});

async function waitFor(fn, timeoutMs = 25000, label = '') {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const v = fn(); if (v) return v; } catch { /* retry */ }
    await sleep(120);
  }
  throw new Error('超时等待: ' + label);
}

let failures = 0;
const ok = (cond, label) => {
  if (cond) console.log('PASS | ' + label);
  else { failures++; console.log('FAIL | ' + label); }
};

const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  // 忽略 Monaco CDN 加载与 Worker 缺失（jsdom 不支持），只记录
  const msg = String(e.message || e);
  if (!/Worker|monaco|Cannot read|not implemented/i.test(msg)) {
    console.log('  [jsdom-warn]', msg.slice(0, 200));
  }
});
vc.on('error', () => {});
vc.on('warn', () => {});

async function launch(seedSave) {
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      if (seedSave) window.localStorage.setItem('nexus_code_repair_save_v1', seedSave);
    },
  });
  return dom;
}

let _dom = null;
function clickEl(dom, el) {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}
function text(dom) { return dom.window.document.body.textContent || ''; }
function q(dom, sel) { return dom.window.document.querySelector(sel); }
function qa(dom, sel) { return Array.from(dom.window.document.querySelectorAll(sel)); }

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：全新玩家 ----------
  console.log('=== 第一轮：新玩家完整流程 ===');
  let dom = await launch(null);

  // 启动页
  await waitFor(() => q(dom, '.boot-wrap'), 15000, '启动页渲染');
  await waitFor(() => text(dom).includes('SYSTEM INITIALIZING'), 15000, '启动初始化文字（打字机）');
  ok(text(dom).includes('SYSTEM INITIALIZING'), '启动页初始化文字');
  const skipBtn = await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 15000, '跳过按钮');
  clickEl(dom, skipBtn);
  const enterBtn = await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'ENTER NEXUS 按钮');
  clickEl(dom, enterBtn);

  // 主菜单
  await waitFor(() => text(dom).includes('代码修复局') && text(dom).includes('Python 知识库'), 10000, '主菜单渲染');
  ok(text(dom).includes('开始游戏'), '菜单无存档显示「开始游戏」');
  const newGame = qa(dom, 'button').find(b => b.textContent.includes('新的开始'));
  clickEl(dom, newGame);
  const confirmNew = await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('确认，开启新轮回')), 5000, '新游戏确认弹窗');
  clickEl(dom, confirmNew);

  // 序章剧情（frameTitle 为「序章 · 苏醒」，打字机逐字显示）
  await waitFor(() => text(dom).includes('序章 · 沉睡的意识'), 10000, '序章演出渲染');
  ok(!!q(dom, '.voice-btn'), '剧情对话带语音播放按钮（🔊）');
  const skipStory = await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过')), 8000, '剧情跳过按钮');
  clickEl(dom, skipStory);
  await sleep(600);

  // 地图
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 10000, '世界地图渲染');
  ok(text(dom).includes('新人训练终端'), '地图包含训练终端节点');
  ok(text(dom).includes('语法维修站'), '地图包含语法维修站');

  // 点击训练终端节点 → 关卡面板
  const node = q(dom, '.node-group');
  clickEl(dom, node);
  await waitFor(() => text(dom).includes('初识终端'), 8000, '关卡面板出现');
  const enterLevel = await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('接入')), 8000, '接入按钮');
  clickEl(dom, enterLevel);

  // 挑战页（Monaco 在 jsdom 中无法创建 Worker，会停留在加载态——页面其余部分必须正常）
  await waitFor(() => text(dom).includes('任务简报') && text(dom).includes('运行代码'), 15000, '挑战页渲染');
  ok(text(dom).includes('初识终端'), '挑战页显示关卡标题');
  ok(text(dom).includes('提交修复'), '挑战页有提交按钮');
  ok(text(dom).includes('MIRA 提示'), '挑战页有 MIRA 提示按钮');
  ok(text(dom).includes('变量监视器'), '挑战页有变量监视器');
  ok(text(dom).includes('维修终端'), '挑战页有终端');
  await sleep(500);

  // 存档检查
  const saveRaw = dom.window.localStorage.getItem('nexus_code_repair_save_v1');
  ok(!!saveRaw, 'localStorage 已写入存档');
  if (saveRaw) {
    const save = JSON.parse(saveRaw);
    ok(save.version === 7, '存档版本 v7');
    ok(save.player.identity && save.player.identity.displayName === 'R-07', '存档含玩家身份（默认显示名 R-07）');
    ok(save.player.identity && save.player.identity.originCode === 'R-07', '存档保留原始实验编号 R-07');
    ok(save.player.progress.story && Array.isArray(save.player.progress.story.unlocked), '存档含剧情事件状态');
    ok(save.player.progress.currentLevelId === 'tut-1', '存档记录当前关卡 tut-1');
    ok(typeof save.player.consciousness === 'number', '存档含意识完整度');
    ok(typeof save.player.progress.storySeen === 'object' && save.player.progress.storySeen !== null, '存档含剧情进度');
    ok(Object.keys(save.player.progress.storySeen).length > 0, '剧情进度已记录');
  }
  dom.window.close();

  // ---------- 第二轮：模拟刷新（预置存档） ----------
  console.log('=== 第二轮：刷新后恢复 ===');
  dom = await launch(saveRaw);
  await waitFor(() => q(dom, '.boot-wrap'), 15000, '重启后启动页渲染');
  const skipR2 = await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, '重启后跳过按钮');
  clickEl(dom, skipR2);
  await waitFor(() => text(dom).includes('ENTER NEXUS'), 8000, '重启后 ENTER 按钮');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, '重启后主菜单');
  ok(qa(dom, 'button').some(b => b.textContent.includes('继续游戏')), '刷新后主菜单显示「继续游戏」');
  const cont = qa(dom, 'button').find(b => b.textContent.includes('继续游戏'));
  clickEl(dom, cont);
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 15000, '继续游戏进入世界地图（可自选关卡）');
  ok(text(dom).includes('已修复'), '地图显示已修复计数（存档恢复）');
  const contBtn = qa(dom, 'button').find(b => b.textContent.includes('继续：'));
  ok(!!contBtn, '地图提供「继续上次修复」入口');
  if (contBtn) {
    clickEl(dom, contBtn);
    await waitFor(() => text(dom).includes('运行代码') && text(dom).includes('初识终端'), 15000, '继续上次修复回到挑战页');
    ok(true, '刷新后可从地图继续上次关卡（tut-1）');
  }
  dom.window.close();

  // ---------- 第三轮：攻击/死亡/重生状态机（逻辑层直接验证 store 流程） ----------
  console.log('=== 第三轮：状态机验证（无浏览器依赖的部分改由逻辑断言覆盖，以下为界面级） ===');
  // 挑战页提交按钮在正常状态下可点击（React 未抛错）
  dom = await launch(saveRaw);
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'c3 启动页渲染');
  const skipC3 = await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'c3 跳过按钮');
  clickEl(dom, skipC3);
  await waitFor(() => text(dom).includes('ENTER NEXUS'), 8000, 'c3 ENTER 按钮');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'c3 主菜单');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('继续游戏')));
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 15000, 'c3 地图');
  const c3Cont = qa(dom, 'button').find(b => b.textContent.includes('继续：'));
  clickEl(dom, c3Cont || qa(dom, '.node-group')[0]);
  await waitFor(() => text(dom).includes('运行代码'), 15000, 'c3 挑战页');
  ok(!text(dom).includes('紧急代码防御'), '无攻击时无防御界面');
  dom.window.close();

  // ---------- 第四轮：第二章解锁路径（预置「第一章完成」存档） ----------
  console.log('=== 第四轮：第二章解锁路径 ===');
  const ch1Save = JSON.parse(saveRaw);
  ch1Save.player.progress.completedLevels = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
  ch1Save.player.progress.unlockedServers = ['training', 'syntax', 'logs'];
  ch1Save.player.progress.flags = { chapter1Done: true, chapter1CinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true, chapter2CinematicShown: false };
  ch1Save.player.progress.currentLevelId = null;
  ch1Save.player.level = 3;
  ch1Save.player.exp = 390;
  ch1Save.player.consciousness = 90;
  dom = await launch(JSON.stringify(ch1Save));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'd4 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'd4 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'd4 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'd4 主菜单');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('继续游戏')));
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 10000, 'd4 世界地图');
  ok(text(dom).includes('DAMAGED'), '第一章完成后日志中心显示 DAMAGED');
  // 点击日志中心节点（第 3 个：training / syntax / logs）
  const logNode = qa(dom, '.node-group')[2];
  clickEl(dom, logNode);
  await waitFor(() => text(dom).includes('分流的消息'), 8000, '日志中心关卡面板出现第二章关卡');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('接入')));
  await waitFor(() => text(dom).includes('运行代码') && text(dom).includes('分流的消息'), 15000, '2-1 挑战页渲染');
  ok(text(dom).includes('提交修复'), '2-1 可提交判题');
  dom.window.close();

  // ---------- 第五轮：第三章解锁路径（预置「第二章完成」存档） ----------
  console.log('=== 第五轮：第三章解锁路径 ===');
  const ch2Save = JSON.parse(saveRaw);
  ch2Save.player.progress.completedLevels = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5'];
  ch2Save.player.progress.unlockedServers = ['training', 'syntax', 'logs', 'storage'];
  ch2Save.player.progress.flags = {
    chapter1Done: true, chapter1CinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true,
    chapter2Done: true, chapter2CinematicShown: true,
    chapter3CinematicShown: false,
  };
  ch2Save.player.progress.currentLevelId = null;
  ch2Save.player.level = 5;
  ch2Save.player.exp = 700;
  ch2Save.player.consciousness = 85;
  dom = await launch(JSON.stringify(ch2Save));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'd5 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'd5 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'd5 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'd5 主菜单');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('继续游戏')));
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 10000, 'd5 世界地图');
  ok(text(dom).includes('DAMAGED'), '第二章完成后存储数据仓显示 DAMAGED');
  const stNode = qa(dom, '.node-group')[3]; // training / syntax / logs / storage
  clickEl(dom, stNode);
  await waitFor(() => text(dom).includes('空仓的货架'), 8000, '存储数据仓关卡面板出现第三章关卡');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('接入')));
  await waitFor(() => text(dom).includes('运行代码') && text(dom).includes('空仓的货架'), 15000, '3-1 挑战页渲染');
  ok(text(dom).includes('提交修复'), '3-1 可提交判题');
  dom.window.close();

  // ---------- 第六轮：第四章解锁路径（预置「第三章完成」存档） ----------
  console.log('=== 第六轮：第四章解锁路径 ===');
  const ch3Save = JSON.parse(saveRaw);
  ch3Save.player.progress.completedLevels = [
    'tut-1', '1-1', '1-2', '1-3', '1-4', '1-5',
    '2-1', '2-2', '2-3', '2-4', '2-5',
    '3-1', '3-2', '3-3', '3-4', '3-5',
  ];
  ch3Save.player.progress.unlockedServers = ['training', 'syntax', 'logs', 'storage', 'factory'];
  ch3Save.player.progress.flags = {
    chapter1Done: true, chapter1CinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true,
    chapter2Done: true, chapter2CinematicShown: true,
    chapter3Done: true, chapter3CinematicShown: true,
    chapter4CinematicShown: false,
  };
  ch3Save.player.progress.currentLevelId = null;
  ch3Save.player.level = 7;
  ch3Save.player.exp = 1400;
  ch3Save.player.consciousness = 82;
  dom = await launch(JSON.stringify(ch3Save));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'd6 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'd6 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'd6 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'd6 主菜单');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('继续游戏')));
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 10000, 'd6 世界地图');
  ok(text(dom).includes('DAMAGED'), '第三章完成后自动化工厂显示 DAMAGED');
  const faNode = qa(dom, '.node-group')[4]; // training/syntax/logs/storage/factory
  clickEl(dom, faNode);
  await waitFor(() => text(dom).includes('失灵的装配'), 8000, '自动化工厂关卡面板出现第四章关卡');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('接入')));
  await waitFor(() => text(dom).includes('运行代码') && text(dom).includes('失灵的装配'), 15000, '4-1 挑战页渲染');
  ok(text(dom).includes('提交修复'), '4-1 可提交判题');
  dom.window.close();

  // ---------- 第七轮：第五章解锁路径（预置「第四章完成」存档） ----------
  console.log('=== 第七轮：第五章解锁路径 ===');
  const ch4Save = JSON.parse(saveRaw);
  ch4Save.player.progress.completedLevels = [
    'tut-1', '1-1', '1-2', '1-3', '1-4', '1-5',
    '2-1', '2-2', '2-3', '2-4', '2-5',
    '3-1', '3-2', '3-3', '3-4', '3-5',
    '4-1', '4-2', '4-3', '4-4', '4-5',
  ];
  ch4Save.player.progress.unlockedServers = ['training', 'syntax', 'logs', 'storage', 'factory', 'diag'];
  ch4Save.player.progress.flags = {
    chapter1Done: true, chapter1CinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true,
    chapter2Done: true, chapter2CinematicShown: true,
    chapter3Done: true, chapter3CinematicShown: true,
    chapter4Done: true, chapter4CinematicShown: true,
    chapter5CinematicShown: false,
  };
  ch4Save.player.progress.currentLevelId = null;
  ch4Save.player.level = 9;
  ch4Save.player.exp = 2300;
  ch4Save.player.consciousness = 78;
  dom = await launch(JSON.stringify(ch4Save));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'd7 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'd7 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'd7 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'd7 主菜单');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('继续游戏')));
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 10000, 'd7 世界地图');
  ok(text(dom).includes('系统诊断中心'), '地图包含系统诊断中心节点');
  ok(text(dom).includes('DAMAGED'), '第四章完成后系统诊断中心显示 DAMAGED');
  const diagNode = qa(dom, '.node-group')[5]; // training/syntax/logs/storage/factory/diag
  clickEl(dom, diagNode);
  await waitFor(() => text(dom).includes('丢失的键值'), 8000, '诊断中心关卡面板出现第五章关卡');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('接入')));
  await waitFor(() => text(dom).includes('运行代码') && text(dom).includes('丢失的键值'), 15000, '5-1 挑战页渲染');
  ok(text(dom).includes('提交修复'), '5-1 可提交判题');
  dom.window.close();

  // ---------- 第八轮：终章解锁路径（预置「第五章完成」存档） ----------
  console.log('=== 第八轮：终章解锁路径 ===');
  const ch5Save = JSON.parse(saveRaw);
  ch5Save.player.progress.completedLevels = [
    'tut-1', '1-1', '1-2', '1-3', '1-4', '1-5',
    '2-1', '2-2', '2-3', '2-4', '2-5',
    '3-1', '3-2', '3-3', '3-4', '3-5',
    '4-1', '4-2', '4-3', '4-4', '4-5',
    '5-1', '5-2', '5-3', '5-4', '5-5',
  ];
  ch5Save.player.progress.unlockedServers = ['training', 'syntax', 'logs', 'storage', 'factory', 'diag', 'core'];
  ch5Save.player.progress.flags = {
    chapter1Done: true, chapter1CinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true,
    chapter2Done: true, chapter2CinematicShown: true,
    chapter3Done: true, chapter3CinematicShown: true,
    chapter4Done: true, chapter4CinematicShown: true,
    chapter5Done: true, chapter5CinematicShown: true,
    chapter6CinematicShown: false,
  };
  ch5Save.player.progress.currentLevelId = null;
  ch5Save.player.level = 10;
  ch5Save.player.exp = 3200;
  ch5Save.player.consciousness = 75;
  dom = await launch(JSON.stringify(ch5Save));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'd8 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'd8 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'd8 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'd8 主菜单');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('继续游戏')));
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 10000, 'd8 世界地图');
  ok(text(dom).includes('DAMAGED'), '第五章完成后方舟核心机房显示 DAMAGED');
  const coreNode = qa(dom, '.node-group')[6]; // training/syntax/logs/storage/factory/diag/core
  clickEl(dom, coreNode);
  await waitFor(() => text(dom).includes('心跳协议'), 8000, '核心机房关卡面板出现终章关卡');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('接入')));
  await waitFor(() => text(dom).includes('运行代码') && text(dom).includes('心跳协议'), 15000, '6-1 挑战页渲染');
  ok(text(dom).includes('提交修复'), '6-1 可提交判题');
  ok(text(dom).includes('单步调试'), '6-1 挑战页有「单步调试」按钮');
  dom.window.close();

  // ---------- 第九轮：自由编程实验室 ----------
  console.log('=== 第九轮：编程实验室 ===');
  const labSave = JSON.parse(saveRaw);
  labSave.player.progress.completedLevels = ['tut-1'];
  labSave.player.progress.unlockedServers = ['training'];
  labSave.player.progress.currentLevelId = null;
  dom = await launch(JSON.stringify(labSave));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'd9 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'd9 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'd9 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'd9 主菜单');
  ok(!!qa(dom, 'button').find(b => b.textContent.includes('编程实验室')), '主菜单有「编程实验室」入口');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('编程实验室')));
  await waitFor(() => text(dom).includes('编程实验室 · SANDBOX'), 15000, 'd9 实验室页面渲染');
  ok(text(dom).includes('练习任务'), '实验室有练习任务卡');
  ok(text(dom).includes('变量监视器'), '实验室有变量监视器');
  ok(text(dom).includes('目标输出'), '实验室显示目标输出');
  ok(text(dom).includes('换一题'), '实验室有换一题按钮');
  // 换一题：题目编号应变化
  const beforeIdx = text(dom).match(/练习题 (\d+) \//);
  const nextBtn = qa(dom, 'button').find(b => b.textContent.includes('换一题'));
  clickEl(dom, nextBtn);
  await sleep(400);
  const afterIdx = text(dom).match(/练习题 (\d+) \//);
  ok(!!beforeIdx && !!afterIdx && beforeIdx[1] !== afterIdx[1], '换一题切换了题目编号');
  dom.window.close();

  // ECHO 分支入口：完成第一章的存档下，语法维修站面板应出现挑战入口
  const bossSave = JSON.parse(saveRaw);
  bossSave.player.progress.completedLevels = ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'];
  bossSave.player.progress.unlockedServers = ['training', 'syntax'];
  bossSave.player.progress.flags = { chapter1Done: true, chapter1CinematicShown: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true };
  bossSave.player.progress.currentLevelId = null;
  bossSave.player.progress.bossesDone = [];
  dom.window.close();
  dom = await launch(JSON.stringify(bossSave));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 'b10 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 'b10 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'b10 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 'b10 主菜单');
  clickEl(dom, qa(dom, 'button').find(b => b.textContent.includes('继续游戏')));
  await waitFor(() => text(dom).includes('NEXUS 数字世界 · 服务器网络'), 12000, 'b10 地图');
  clickEl(dom, qa(dom, '.node-group')[1]); // 语法维修站
  await waitFor(() => text(dom).includes('GATE-01'), 8000, 'b10 服务器面板出现章节 Boss 入口');
  ok(text(dom).includes('数据港守卫'), '面板显示第一章 GATE-01 名称');
  const bossBtn = qa(dom, 'button').find(b => b.textContent.includes('挑战 ▸'));
  ok(!!bossBtn, '面板有「挑战 ▸」按钮');
  if (bossBtn) {
    clickEl(dom, bossBtn);
    await sleep(500);
    // 首次进入会先播战前演出
    if (q(dom, '.cine-root')) {
      const sk = qa(dom, 'button').find(b => b.textContent.includes('跳过'));
      if (sk) clickEl(dom, sk);
      await sleep(400);
    }
    await waitFor(() => q(dom, '.boss-arena'), 15000, 'b10 Boss 战斗界面渲染');
    ok(!!q(dom, '.boss-avatar svg'), 'Boss 战渲染立绘');
    ok(text(dom).includes('提交攻击'), 'Boss 战有提交攻击按钮');
    ok(text(dom).includes('能源启动程序'), 'Boss 战显示第一阶段');
  }

  // ---------- 第十一轮：奖励兑换中心 ----------
  console.log('=== 第十一轮：奖励兑换中心 ===');
  const shopSave = JSON.parse(saveRaw);
  shopSave.player.progress.completedLevels = ['tut-1'];
  shopSave.player.progress.currentLevelId = null;
  shopSave.player.rewards = { credits: 500, trust: 42, items: { scan: 2 }, skins: [], equipped: {}, chapterRewards: ['ch1'], cleared: {}, archiveRead: [] };
  dom = await launch(JSON.stringify(shopSave));
  await waitFor(() => q(dom, '.boot-wrap'), 15000, 's11 启动页');
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('跳过初始化')), 8000, 's11 跳过'));
  clickEl(dom, await waitFor(() => qa(dom, 'button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 's11 ENTER'));
  await waitFor(() => text(dom).includes('Python 知识库'), 10000, 's11 主菜单');
  const shopBtn = qa(dom, 'button').find(b => b.textContent.includes('奖励兑换中心'));
  ok(!!shopBtn, '主菜单有「奖励兑换中心」入口');
  clickEl(dom, shopBtn);
  await waitFor(() => text(dom).includes('REWARD NEXUS'), 12000, 's11 兑换中心渲染');
  ok(text(dom).includes('贡献点') && text(dom).includes('信任度'), '兑换中心显示贡献点与信任度');
  ok(qa(dom, '.shop-card').length > 0, '兑换中心渲染商品卡片（' + qa(dom, '.shop-card').length + ' 个）');
  // 购买流程：点击第一个可购买商品的按钮，贡献点应减少
  const creditBefore = (text(dom).match(/贡献点 (\d+)/) || [])[1];
  const buyBtn = qa(dom, '.shop-card button').find(b => /◈\s*\d+/.test(b.textContent || ''));
  ok(!!buyBtn, '商品卡片有兑换按钮（◈ 价格）');
  if (buyBtn) {
    clickEl(dom, buyBtn);
    await sleep(500);
    const creditAfter = (text(dom).match(/贡献点 (\d+)/) || [])[1];
    ok(!!creditBefore && !!creditAfter && Number(creditAfter) < Number(creditBefore), '兑换后贡献点减少（' + creditBefore + ' → ' + creditAfter + '）');
    ok(text(dom).includes('兑换成功') || text(dom).includes('已拥有') || text(dom).includes('已解锁'), '兑换结果有反馈');
  }
  ok(text(dom).includes('记忆档案'), '兑换中心有记忆档案标签');
  dom.window.close();

  server.close();
  if (unhandledCount > 0) console.log('  [注] 忽略 jsdom/Monaco 资源拒绝 ' + unhandledCount + ' 次（非游戏问题）');
  console.log(failures === 0 ? '=== 冒烟测试全部通过 ===' : '=== 冒烟测试失败数: ' + failures + ' ===');
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('冒烟测试异常:', e);
  server.close();
  process.exit(1);
});
