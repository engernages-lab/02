// A1 端到端：挑战页草稿自动恢复 / 通关代码预览 / 历史回退 / 手动保存 / 清除 / 切关隔离 / 刷新 / 存档命名空间隔离
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distRoot = join(root, 'dist');
const PORT = 4181;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };

const ts = createRequire(join(root, 'package.json'))('typescript');
function loadTS(file) {
  const src = readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require'); });
  return mod.exports;
}
const { LEVELS } = loadTS(join(root, 'src/game/levels.ts'));
const linesOf = (code) => code.split('\n').length;
const level = (id) => LEVELS.find(l => l.id === id);
const INIT = {
  '1-1': linesOf(level('1-1').initialCode),
  '1-2': linesOf(level('1-2').initialCode),
  '1-3': linesOf(level('1-3').initialCode),
};

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

const SAVE_KEY = 'nexus_code_repair_save_v1';
const NS = 'p1700000000000';

/** 已解锁语法维修站、1-1/1-2 已通关、剧情已读（不弹简报）的 v7 存档 */
function saveSeed(createdAt = 1700000000000) {
  return JSON.stringify({
    version: 7,
    updatedAt: 1700000000000,
    player: {
      name: 'R-07',
      identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt },
      level: 5,
      exp: 1040,
      consciousness: 100,
      meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], memoryLogs: [], fragmentLog: {}, backupLevel: 1 },
      progress: {
        completedLevels: ['tut-1', '1-1', '1-2'],
        stars: { 'tut-1': 3, '1-1': 3, '1-2': 2 },
        unlockedServers: ['training', 'syntax'],
        currentLevelId: null,
        failedAttempts: {},
        hintLevels: { '1-1': 1 },
        achievements: ['first_repair', 'training_done'],
        knowledge: ['print', 'if'],
        storySeen: { 'bs-syntax-1': true, 'bs-syntax-2': true, '1-1': true, '1-2': true, '1-3': true },
        story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
        flags: { tutorialCinematicShown: true, chapter1ArrivalSeen: true, prologueDone: true },
        bossesDone: [],
        currentBossId: null,
        pendingRebirth: false,
      },
      rewards: { credits: 300, trust: 30, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], bossRewards: [], unlocks: [], badges: [], difficultyRewards: [] },
      settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
    },
  });
}

function draftSeed(code, extra = {}) {
  const at = Date.now() - 60000;
  return JSON.stringify({ v: 1, code, updatedAt: at, history: [], ...extra });
}

async function launch(items) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      try {
        for (const [k, v] of Object.entries(items)) window.localStorage.setItem(k, v);
      } catch { /* ignore */ }
    },
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
    async wait(fn, ms, label) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        try { const v = fn(); if (v) return v; } catch { /* retry */ }
        await sleep(120);
      }
      throw new Error('超时: ' + label);
    },
  };
}

const btn = (h, label) => h.qa('button').find(b => (b.textContent || '').includes(label));

async function enterMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 20000, '启动页');
  h.click(await h.wait(() => btn(h, '跳过初始化'), 12000, '跳过初始化'));
  h.click(await h.wait(() => btn(h, 'ENTER NEXUS'), 10000, 'ENTER NEXUS'));
  await h.wait(() => h.text().includes('Python 知识库'), 15000, '主菜单');
}

async function enterMap(h) {
  h.click(await h.wait(() => btn(h, '继续探索') || btn(h, '开始探索'), 10000, '继续探索'));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 15000, '世界地图');
}

async function openSyntax(h) {
  if (h.qa('.lv-row').length === 0) {
    const nodes = await h.wait(() => { const n = h.qa('.node-group'); return n.length >= 2 ? n : null; }, 15000, '地图节点');
    h.click(nodes[1]);
  }
  await h.wait(() => h.qa('.lv-row').length >= 3, 12000, '语法维修站关卡列表');
}

/** 进入第 idx 个关卡（0=1-1, 1=1-2, 2=1-3） */
async function enterLevel(h, idx) {
  await openSyntax(h);
  const row = h.qa('.lv-row')[idx];
  const b = row && row.querySelector('button');
  if (!b) throw new Error('关卡行没有按钮: idx=' + idx);
  h.click(b);
  await h.wait(() => h.q('.draft-bar'), 20000, '挑战页草稿栏');
  await sleep(200);
}

async function backToMap(h) {
  h.click(await h.wait(() => btn(h, '服务器地图'), 8000, '返回地图'));
  await h.wait(() => h.text().includes('NEXUS 数字世界 · 服务器网络'), 12000, '回到世界地图');
}

function storageSnapshot(dom) {
  const out = {};
  const s = dom.window.localStorage;
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k) out[k] = s.getItem(k);
  }
  return out;
}
const readDraftItem = (dom, id) => {
  const raw = dom.window.localStorage.getItem('nexus_draft_v1:' + NS + ':' + id);
  return raw ? JSON.parse(raw) : null;
};
const curLines = (h) => {
  const m = (h.text().match(/当前\s*(\d+)\s*行/) || []);
  return m[1] ? parseInt(m[1], 10) : null;
};

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  const draft11 = 'def power(level):\n    if level >= 3:\n        return "ONLINE"\n    else:\n        return "OFFLINE"\n# 我的草稿';
  const draft13 = '# 1-3 草稿\n' + 'print(1)\n'.repeat(8);
  const passed11 = 'def power(level):\n    return "ONLINE" if level >= 3 else "OFFLINE"';
  const items = {
    [SAVE_KEY]: saveSeed(),
    ['nexus_draft_v1:' + NS + ':1-1']: draftSeed(draft11, {
      passedCode: passed11,
      passedAt: Date.now() - 30000,
      history: [{ code: '# 旧版本', at: Date.now() - 90000 }],
    }),
    ['nexus_draft_v1:' + NS + ':1-3']: draftSeed(draft13),
  };

  // ---------- 第一轮：恢复 / 通关代码 / 历史 / 手动保存 / 切关 / 清除 ----------
  console.log('=== 第一轮：进入关卡自动恢复草稿 ===');
  let dom = await launch(items);
  let h = helpers(dom);
  await enterMenu(h);
  await enterMap(h);
  await enterLevel(h, 0);

  ok(h.text().includes('已恢复上次保存的草稿'), '进入关卡自动恢复本地草稿');
  ok(curLines(h) === linesOf(draft11), '编辑器内容为该关草稿（' + linesOf(draft11) + ' 行）', 'got ' + curLines(h));
  ok(h.text().includes('草稿 · 已保存'), '保存状态显示「已保存」');
  ok(/保存于 \d{2}:\d{2}/.test(h.text()), '显示上次保存时间');
  ok(!!btn(h, '查看通关代码'), '存在通关代码入口');
  ok(!!btn(h, '恢复上一版'), '存在历史版本入口');
  const seededAt = readDraftItem(dom, '1-1').updatedAt;
  ok(readDraftItem(dom, '1-1').code === draft11, '自动恢复不会改写草稿内容');

  console.log('=== 第二轮：通关代码只预览、不覆盖草稿 ===');
  h.click(btn(h, '查看通关代码'));
  await sleep(200);
  ok(curLines(h) === linesOf(passed11), '载入通关代码（' + linesOf(passed11) + ' 行）', 'got ' + curLines(h));
  ok(readDraftItem(dom, '1-1').code === draft11, '预览通关代码未覆盖草稿');
  ok(h.text().includes('不会覆盖当前草稿'), '界面明确提示仅查看');

  console.log('=== 第三轮：恢复草稿 / 历史回退 ===');
  h.click(btn(h, '恢复草稿'));
  await sleep(200);
  ok(curLines(h) === linesOf(draft11), '恢复草稿回到 ' + linesOf(draft11) + ' 行');
  h.click(btn(h, '恢复上一版'));
  await sleep(250);
  ok(curLines(h) === 1, '恢复上一版回到旧快照（1 行）', 'got ' + curLines(h));
  ok(readDraftItem(dom, '1-1').code === '# 旧版本', '历史回退已落盘');
  h.click(btn(h, '恢复上一版'));
  await sleep(250);
  ok(curLines(h) === linesOf(draft11), '再次回退可回到刚保存的版本');

  console.log('=== 第四轮：手动保存 ===');
  const beforeSave = readDraftItem(dom, '1-1').updatedAt;
  await sleep(40);
  h.click(btn(h, '保存草稿'));
  await h.wait(() => h.text().includes('草稿已保存到本机'), 6000, '手动保存提示');
  ok(readDraftItem(dom, '1-1').updatedAt > beforeSave, '手动保存刷新了保存时间');
  ok(readDraftItem(dom, '1-1').code === draft11, '手动保存写入当前编辑器内容');

  console.log('=== 第五轮：切换关卡互不覆盖 ===');
  await backToMap(h);
  await enterLevel(h, 2);
  ok(curLines(h) === linesOf(draft13), '1-3 载入自己的草稿（' + linesOf(draft13) + ' 行）', 'got ' + curLines(h));
  ok(readDraftItem(dom, '1-1').code === draft11, '进入 1-3 未改动 1-1 草稿');
  const saved11At = readDraftItem(dom, '1-1').updatedAt;

  console.log('=== 第六轮：清除草稿 ===');
  h.click(btn(h, '清除草稿'));
  await sleep(120);
  ok(!!btn(h, '确认清除？'), '清除需要二次确认');
  h.click(btn(h, '确认清除？'));
  await sleep(250);
  ok(readDraftItem(dom, '1-3') === null, '1-3 草稿 key 已删除');
  ok(curLines(h) === INIT['1-3'], '清除后回到初始故障版（' + INIT['1-3'] + ' 行）', 'got ' + curLines(h));
  ok(h.text().includes('草稿已清除'), '界面提示草稿已清除');
  ok(readDraftItem(dom, '1-1').code === draft11 && readDraftItem(dom, '1-1').updatedAt === saved11At, '清除 1-3 不影响 1-1');

  console.log('=== 第七轮：未修改的关卡不产生草稿 ===');
  await backToMap(h);
  await enterLevel(h, 1);
  ok(h.text().includes('草稿 · 未保存'), '新关卡初始状态为「未保存」');
  await sleep(900);
  ok(readDraftItem(dom, '1-2') === null, '仅进入、未修改时不写入草稿');

  console.log('=== 第八轮：通关记录未被覆盖 ===');
  const saved = JSON.parse(dom.window.localStorage.getItem(SAVE_KEY));
  ok(JSON.stringify(saved.player.progress.completedLevels) === JSON.stringify(['tut-1', '1-1', '1-2']), '草稿操作不影响已通关记录');
  ok(saved.player.progress.stars['1-1'] === 3 && saved.player.progress.stars['1-2'] === 2, '星级记录保持不变');
  ok(saved.player.level === 5 && saved.player.exp === 1040, '等级与经验保持不变');
  ok(saved.version === 9, '存档版本 v9（A5 新增商城交易）');

  console.log('=== 第九轮：刷新后恢复 ===');
  const snapshot = storageSnapshot(dom);
  dom.window.close();
  dom = await launch(snapshot);
  h = helpers(dom);
  await enterMenu(h);
  await enterMap(h);
  await enterLevel(h, 0);
  ok(curLines(h) === linesOf(draft11), '刷新后 1-1 草稿仍能恢复', 'got ' + curLines(h));
  ok(h.text().includes('已恢复上次保存的草稿'), '刷新后提示已恢复');
  ok(dom.window.localStorage.getItem('nexus_draft_v1:' + NS + ':1-3') === null, '已清除的草稿刷新后不会复活');
  const snap2 = storageSnapshot(dom);
  dom.window.close();

  console.log('=== 第十轮：不同玩家存档隔离 ===');
  snap2[SAVE_KEY] = saveSeed(1800000000000);
  dom = await launch(snap2);
  h = helpers(dom);
  await enterMenu(h);
  await enterMap(h);
  await enterLevel(h, 0);
  ok(curLines(h) === INIT['1-1'], '换存档后不加载上一个存档的草稿（初始 ' + INIT['1-1'] + ' 行）', 'got ' + curLines(h));
  ok(!h.text().includes('已恢复上次保存的草稿'), '换存档后没有「已恢复草稿」提示');
  ok(!!dom.window.localStorage.getItem('nexus_draft_v1:' + NS + ':1-1'), '旧存档的草稿仍然保留，未被覆盖或删除');
  await sleep(800);
  ok(dom.window.localStorage.getItem('nexus_draft_v1:p1800000000000:1-1') === null, '新存档在未修改前不写入草稿');
  dom.window.close();

  console.log('=== 第十一轮：重置进度时清理草稿 ===');
  dom = await launch(items);
  h = helpers(dom);
  await enterMenu(h);
  ok(!!dom.window.localStorage.getItem('nexus_draft_v1:' + NS + ':1-1'), '重置前草稿存在');
  h.click(await h.wait(() => btn(h, '系统配置'), 8000, '系统配置入口'));
  await h.wait(() => h.text().includes('重置游戏进度'), 10000, '设置页');
  h.click(await h.wait(() => btn(h, '重置进度'), 8000, '重置进度'));
  h.click(await h.wait(() => btn(h, '再次点击确认清空'), 8000, '二次确认'));
  await sleep(400);
  const draftKeys = Object.keys(storageSnapshot(dom)).filter(k => k.startsWith('nexus_draft_v1:'));
  ok(draftKeys.length === 0, '重置进度后草稿全部清除', draftKeys.join(','));
  ok(!dom.window.localStorage.getItem(SAVE_KEY) || JSON.parse(dom.window.localStorage.getItem(SAVE_KEY)).player.exp === 0, '存档已重置');
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
