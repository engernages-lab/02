// V1.3-A.1 UI E2E（jsdom 加载生产构建）：入口 → 挑战大厅 → 挑战页 → 未知入侵覆盖层恢复
// 说明：Monaco / MicroPython 在 jsdom 中无法创建 Worker，因此本用例只验证「接入与界面渲染」，
// 真实 Python 判题链路由 verify.mjs / 纯逻辑用例覆盖。
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'dist');
const PORT = 4175;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

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
let unhandled = 0;
process.on('unhandledRejection', () => { unhandled++; });

async function waitFor(fn, timeoutMs = 20000, label = '') {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const v = fn(); if (v) return v; } catch { /* retry */ }
    await sleep(120);
  }
  throw new Error('超时等待: ' + label);
}

let pass = 0, total = 0;
const ok = (cond, label) => { total++; if (cond) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label); };

const vc = new VirtualConsole();
vc.on('jsdomError', () => {});
vc.on('error', () => {});
vc.on('warn', () => {});

async function launch() {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      try { window.localStorage.setItem('nexus_dev_tools', '1'); } catch { /* ignore */ }
    },
  });
}
const text = (dom) => dom.window.document.body.textContent || '';
const qa = (dom, sel) => Array.from(dom.window.document.querySelectorAll(sel));
const clickEl = (dom, el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
const btnWith = (dom, s) => qa(dom, 'button').find(b => (b.textContent || '').includes(s));

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);
  const dom = await launch();

  // 启动 → 主菜单
  await waitFor(() => dom.window.document.querySelector('.boot-wrap'), 20000, '启动页');
  const skip = await waitFor(() => btnWith(dom, '跳过初始化'), 15000, '跳过按钮');
  clickEl(dom, skip);
  const enter = await waitFor(() => btnWith(dom, 'ENTER NEXUS'), 10000, 'ENTER 按钮');
  clickEl(dom, enter);
  await waitFor(() => text(dom).includes('Python 知识库'), 12000, '主菜单');
  ok(btnWith(dom, '独立挑战') !== undefined, '主菜单出现「独立挑战」入口');

  // 进入挑战大厅
  clickEl(dom, btnWith(dom, '独立挑战'));
  await waitFor(() => text(dom).includes('独立挑战 · CHALLENGE SIM'), 12000, '挑战大厅');
  ok(text(dom).includes('应急链路重启（限时）'), '大厅显示限时挑战标题（真实配置）');
  ok(text(dom).includes('均值函数的隐藏边界'), '大厅显示隐藏 Bug 挑战标题');
  ok(text(dom).includes('限时修复'), '大厅显示挑战类型标签');
  ok(text(dom).includes('奖励系数'), '大厅显示奖励系数（来自真实规则）');
  ok(btnWith(dom, '开始挑战') !== undefined, '大厅提供开始挑战按钮');

  // 进入挑战页
  clickEl(dom, btnWith(dom, '开始挑战'));
  await waitFor(() => text(dom).includes('运行代码') && text(dom).includes('提交判题'), 15000, '挑战页渲染');
  ok(text(dom).includes('应急链路重启（限时）'), '挑战页显示挑战标题（真实配置）');
  ok(text(dom).includes('挑战终端'), '挑战页有终端');
  ok(text(dom).includes('运行剩余'), '挑战页显示剩余运行次数');
  ok(text(dom).includes('剩余'), '挑战页显示时限倒计时');
  ok(text(dom).includes('挑战目标'), '挑战页显示目标面板');

  // 返回大厅
  const back = btnWith(dom, '挑战列表');
  if (back) clickEl(dom, back);
  await waitFor(() => text(dom).includes('独立挑战 · CHALLENGE SIM'), 10000, '返回大厅');

  // DEV 触发未知入侵
  const trig = await waitFor(() => btnWith(dom, '触发未知入侵'), 8000, 'DEV 触发按钮');
  clickEl(dom, trig);
  await waitFor(() => text(dom).includes('UNKNOWN INTRUSION'), 8000, '未知入侵覆盖层出现');
  ok(text(dom).includes('UNKNOWN INTRUSION'), '未知入侵覆盖层正常弹出');
  ok(btnWith(dom, '退出隔离') !== undefined, '覆盖层提供退出（恢复方式②）');

  // 等待 presenting→active 后可退出
  await sleep(2000);
  const quit = btnWith(dom, '退出隔离');
  ok(quit && !quit.disabled, '入侵进入 active，可执行退出隔离');
  if (quit) clickEl(dom, quit);
  await waitFor(() => !text(dom).includes('UNKNOWN INTRUSION'), 8000, '退出后覆盖层关闭');
  ok(!text(dom).includes('UNKNOWN INTRUSION'), '玩家退出后覆盖层安全关闭（无残留锁）');

  // 重复触发保护：冷却期内再次触发被拒绝
  const trig2 = btnWith(dom, '触发未知入侵');
  if (trig2) clickEl(dom, trig2);
  await sleep(300);
  ok(text(dom).includes('冷却中'), '冷却期内重复触发被拒绝（恢复方式⑥）');

  // 存档完整性：新字段已持久化且版本仍为 v10
  const raw = dom.window.localStorage.getItem('nexus_code_repair_save_v1');
  ok(!!raw, 'localStorage 存在存档');
  if (raw) {
    const save = JSON.parse(raw);
    ok(save.version === 10, '存档版本仍为 v10（未升级）');
    ok(save.player.progress.challengeRuns && typeof save.player.progress.challengeRuns === 'object', '存档含 challengeRuns 字段');
    ok('dynamicEvent' in save.player.progress && 'eventCooldowns' in save.player.progress, '存档含动态事件字段');
  }

  dom.window.close();
  server.close();

  console.log('=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total + (unhandled ? '（忽略 ' + unhandled + ' 个 jsdom 资源 rejection）' : ''));
  process.exit(pass === total ? 0 : 1);
})().catch(e => {
  console.error('E2E 异常：', e && e.message);
  try { server.close(); } catch { /* ignore */ }
  process.exit(1);
});
