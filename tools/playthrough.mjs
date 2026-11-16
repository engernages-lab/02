// 真实 UI 流程试玩（jsdom）：新游戏 → 地图 → 训练关 → 提示 → 失败提交 → 返回地图
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4192;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
const server = createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const f = normalize(join(distRoot, p));
    if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  } catch { res.writeHead(500); res.end('err'); }
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
process.on('unhandledRejection', () => {});
const vc = new VirtualConsole(); vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});
(async () => {
  server.listen(PORT, '127.0.0.1'); await sleep(300);
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.localStorage.clear(); },
  });
  const w = dom.window, d = w.document;
  const text = () => d.body.textContent || '';
  const qa = s => Array.from(d.querySelectorAll(s));
  const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  const wait = async (fn, ms, label) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(100); } throw new Error('timeout ' + label); };
  await wait(() => d.querySelector('.boot-wrap'), 15000, 'boot');
  click(qa('button').find(b => b.textContent.includes('跳过初始化')));
  click(await wait(() => qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 8000, 'enter'));
  await wait(() => text().includes('Python 知识库'), 10000, 'menu');
  console.log('MENU OK |', text().includes('开始探索') ? '开始探索' : '继续探索');
  click(qa('button').find(b => b.textContent.includes('新的开始')));
  click(await wait(() => qa('button').find(b => b.textContent.includes('确认，开启新轮回')), 5000, 'confirm'));
  await wait(() => text().includes('序章'), 10000, 'prologue');
  const skip = qa('button').find(b => b.textContent.includes('跳过'));
  if (skip) click(skip);
  await wait(() => text().includes('NEXUS 数字世界 · 服务器网络'), 15000, 'map');
  console.log('MAP OK');
  click(qa('.node-group')[0]);
  await wait(() => text().includes('初识终端'), 8000, 'panel');
  click(qa('button').find(b => b.textContent.includes('接入')));
  await wait(() => text().includes('运行代码'), 15000, 'challenge');
  console.log('CHALLENGE OK');
  console.log(text().replace(/\s+/g, ' ').slice(0, 700));
  const hint = qa('button').find(b => b.textContent.includes('MIRA 提示'));
  click(hint); await sleep(300);
  const hint1 = text().match(/MIRA[\s\S]{0,200}/)?.[0] || '';
  console.log('HINT:', hint1.replace(/\s+/g, ' ').slice(0, 220));
  const save = JSON.parse(w.localStorage.getItem('nexus_code_repair_save_v1') || '{}');
  console.log('SAVE version', save.version, 'level', save.player?.progress?.currentLevelId, 'hints', JSON.stringify(save.player?.progress?.hintLevels));
  dom.window.close(); server.close();
})().catch(e => { console.error(e); server.close(); process.exit(1); });
