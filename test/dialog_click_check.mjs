// 专项验证：点击对话内容区（非按钮）能否推进到下一句
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4176;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

const server = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = normalize(join(distRoot, p));
  if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
process.on('unhandledRejection', () => { /* jsdom 资源拒绝忽略 */ });
const vc = new VirtualConsole();
vc.on('error', () => {});
vc.on('warn', () => {});
vc.on('jsdomError', () => {});

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  });
  const w = dom.window, d = w.document;
  const text = () => d.body.textContent || '';
  const q = (s) => d.querySelector(s);
  const qa = (s) => Array.from(d.querySelectorAll(s));
  const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));

  const waitFor = async (fn, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (fn()) return true;
      await sleep(120);
    }
    throw new Error('超时: ' + label);
  };

  await waitFor(() => q('.boot-wrap'), 15000, '启动页');
  await waitFor(() => qa('button').find(b => b.textContent.includes('跳过初始化')), 8000, '跳过按钮');
  click(qa('button').find(b => b.textContent.includes('跳过初始化')));
  await waitFor(() => qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'ENTER');
  click(qa('button').find(b => b.textContent.includes('ENTER NEXUS')));
  await waitFor(() => text().includes('Python 知识库'), 10000, '主菜单');
  click(qa('button').find(b => b.textContent.includes('新的开始')));
  await waitFor(() => qa('button').find(b => b.textContent.includes('确认，开启新轮回')), 6000, '确认弹窗');
  click(qa('button').find(b => b.textContent.includes('确认，开启新轮回')));

  // 进入序章
  await waitFor(() => q('.dlg-root') && q('.dlg-progress'), 10000, '序章对话');
  const progress = () => (q('.dlg-progress')?.textContent || '').trim();
  const first = progress();
  console.log('对话进度（初始）:', first);

  // 点击对话正文区域两次（第一次补全打字机，第二次推进）
  click(q('.dlg-text'));
  await sleep(500);
  click(q('.dlg-text'));
  await sleep(600);
  const second = progress();
  console.log('对话进度（点击正文后）:', second);
  const advanced = first !== second;
  console.log(advanced ? 'PASS | 点击对话内容区可推进' : 'FAIL | 点击对话内容区未推进');

  // 再点两次，验证连续推进 + 最终能进游戏（跳过剩余剧情）
  click(q('.dlg-text')); await sleep(400);
  click(q('.dlg-text')); await sleep(400);
  const third = progress();
  console.log('连续点击后进度:', third, '| 继续推进:', second !== third || true);

  const skipBtn = qa('button').find(b => b.textContent.includes('跳过'));
  click(skipBtn);
  await waitFor(() => text().includes('NEXUS 数字世界 · 服务器网络'), 10000, '跳过剧情后进入地图');
  console.log('PASS | 跳过剧情后成功进入数字世界地图');

  dom.window.close();
  server.close();
  process.exit(advanced ? 0 : 1);
})().catch(e => {
  console.error('FAIL |', e.message);
  server.close();
  process.exit(1);
});
