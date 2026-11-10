// 端到端验证：旧存档迁移 + 玩家显示名自定义 + 刷新后保留 + 原始编号固定
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4177;
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

/** 旧版 v1 存档：没有 identity、没有 story，只有旧的 storySeen / flags */
function v1Save(name = 'R-07') {
  return JSON.stringify({
    version: 1,
    updatedAt: 1700000000000,
    player: {
      name,
      level: 3,
      exp: 390,
      consciousness: 88,
      meta: { deaths: 1, rebirths: 0, lastDeathLevel: '1-1', lastDeathReason: '纠错者攻击', memoryFragments: ['f3'], backupLevel: 1 },
      progress: {
        completedLevels: ['tut-1', '1-1'],
        stars: { 'tut-1': 3, '1-1': 2 },
        unlockedServers: ['training', 'syntax'],
        currentLevelId: null,
        failedAttempts: {},
        hintLevels: { '1-1': 1 },
        achievements: ['first_repair', 'training_done'],
        knowledge: ['print', 'if'],
        storySeen: { p1: true, p2: true, 'prologue_p1': true },
        flags: { prologueDone: true, chapter1ZeroFail: true },
        bossesDone: [],
        currentBossId: null,
        pendingRebirth: false,
      },
      rewards: { credits: 120, trust: 30, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
      settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
    },
  });
}

async function launch(seed) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      if (seed) window.localStorage.setItem('nexus_code_repair_save_v1', seed);
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

async function enterMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('跳过初始化')), 8000, '跳过初始化'));
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'ENTER NEXUS'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  // ---------- 第一轮：v1 旧存档 → 自动迁移 ----------
  console.log('=== 第一轮：v1 旧存档自动迁移 ===');
  let dom = await launch(v1Save());
  let h = helpers(dom);
  await enterMenu(h);
  ok(h.qa('button').some(b => b.textContent.includes('继续探索')), '旧存档被识别（主菜单显示「继续探索」，未被重置）');

  const raw1 = dom.window.localStorage.getItem('nexus_code_repair_save_v1');
  const save1 = JSON.parse(raw1);
  ok(save1.version === 7, '旧存档已迁移为 v7', 'version=' + save1.version);
  ok(save1.player.level === 3 && save1.player.exp === 390, '迁移保留等级与经验');
  ok(JSON.stringify(save1.player.progress.completedLevels) === JSON.stringify(['tut-1', '1-1']), '迁移保留通关记录');
  ok(save1.player.progress.flags.chapter1ZeroFail === true, '迁移保留 flags 语义');
  ok(save1.player.identity && save1.player.identity.displayName === 'R-07', '迁移生成默认身份（R-07）');
  ok(save1.player.identity.originCode === 'R-07', '迁移后原始编号为 R-07');
  ok(save1.player.progress.story && save1.player.progress.story.seen.p1 === 1, '旧 storySeen 合并为阅读次数');
  ok(save1.player.meta.memoryFragments.includes('f3'), '迁移不丢失已收集碎片');

  // ---------- 第二轮：玩家档案页 + 默认名称显示 ----------
  console.log('=== 第二轮：身份显示与自定义 ===');
  h.click(h.qa('button').find(b => b.textContent.includes('玩家档案')));
  await h.wait(() => h.text().includes('身份信息'), 8000, '玩家档案页');
  ok(h.text().includes('R-07（固定不可更改）'), '档案页显示原始编号 R-07（固定）');
  ok(h.text().includes('默认名称'), '未改名时显示「默认名称」');

  // 打开改名
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('修改显示名称')), 6000, '修改显示名称按钮'));
  const input = await h.wait(() => h.q('input[maxlength="12"]'), 6000, '名称输入框');
  ok(!!input, '出现名称输入框');

  // 空名称校验
  const setVal = (el, v) => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  setVal(input, '   ');
  await sleep(120);
  h.click(h.qa('button').find(b => b.textContent.includes('保存名称')));
  await sleep(300);
  ok(h.text().includes('显示名称不能为空'), '空名称被拒绝并提示');

  // 与核心角色同名校验
  const input2 = h.q('input[maxlength="12"]');
  setVal(input2, 'MIRA');
  await sleep(120);
  h.click(h.qa('button').find(b => b.textContent.includes('保存名称')));
  await sleep(300);
  ok(h.text().includes('属于 NEXUS 的核心角色'), '与核心角色同名被拒绝');

  // 合法名称
  const input3 = h.q('input[maxlength="12"]');
  setVal(input3, '小林');
  await sleep(120);
  h.click(h.qa('button').find(b => b.textContent.includes('保存名称')));
  await h.wait(() => h.text().includes('已自定义显示名'), 5000, '改名成功');

  const save2 = JSON.parse(dom.window.localStorage.getItem('nexus_code_repair_save_v1'));
  ok(save2.player.identity.displayName === '小林', '显示名称已写入存档');
  ok(save2.player.name === '小林', '兼容字段 name 与显示名同步');
  ok(save2.player.identity.originCode === 'R-07', '改名后原始编号仍为 R-07');
  ok(save2.player.identity.renamed === true, '身份标记为已自定义');
  ok(h.text().includes('小林'), '档案页立即显示新名称');

  // 返回主菜单：状态卡应显示新名称
  h.click(h.qa('button').find(b => b.textContent.includes('◀ 返回')));
  await h.wait(() => h.text().includes('Python 知识库'), 8000, '返回主菜单');
  ok(h.text().includes('小林'), '主菜单状态卡使用新显示名');
  ok(h.text().includes('编号 R-07'), '主菜单同时显示固定编号 R-07');
  dom.window.close();

  // ---------- 第三轮：刷新后名称保留 ----------
  console.log('=== 第三轮：刷新后保留 ===');
  const persisted = dom.window.localStorage ? null : null; // 上一窗口已关闭，使用捕获的存档
  const seed2 = JSON.stringify(save2);
  dom = await launch(seed2);
  h = helpers(dom);
  await enterMenu(h);
  ok(h.text().includes('小林'), '刷新后主菜单仍显示自定义名称');
  h.click(h.qa('button').find(b => b.textContent.includes('玩家档案')));
  await h.wait(() => h.text().includes('身份信息'), 8000, '刷新后档案页');
  ok(h.text().includes('已自定义显示名'), '刷新后命名状态保留');
  ok(h.text().includes('R-07（固定不可更改）'), '刷新后原始编号仍为 R-07');
  const save3 = JSON.parse(dom.window.localStorage.getItem('nexus_code_repair_save_v1'));
  ok(save3.player.identity.displayName === '小林' && save3.player.identity.originCode === 'R-07', '刷新后存档身份正确');
  dom.window.close();

  // ---------- 第四轮：剧情档案（角色 / 事件 / 六碎片） ----------
  console.log('=== 第四轮：剧情档案页 ===');
  dom = await launch(seed2);
  h = helpers(dom);
  await enterMenu(h);
  h.click(h.qa('button').find(b => b.textContent.includes('剧情档案')));
  await h.wait(() => h.text().includes('核心角色档案'), 8000, '剧情档案页');
  ok(h.text().includes('MIRA') && h.text().includes('恩格尔'), '角色档案包含 MIRA 与恩格尔');
  ok(h.text().includes('K-0') || h.text().includes('？？？'), 'K-0 档案按解锁条件显示');
  ok(h.text().includes('剧情事件'), '剧情事件分区存在');
  ok(h.text().includes('创世主碎片 · 六枚'), '创世主六碎片分区存在');
  ok(h.text().includes('1 / 6'), '碎片进度显示为 1 / 6（f3 归并为 frag-01）');
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
