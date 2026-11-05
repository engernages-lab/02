// 语音端到端：播放 / 暂停 / 继续 / 停止 / 跳过即停 / 声波 / 单段不叠加
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4182;
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
process.on('unhandledRejection', () => {});
const vc = new VirtualConsole();
vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

function installFakeVoice(w) {
  const fake = { spoken: [], cancel: 0, pause: 0, resume: 0, speaking: false, paused: false };
  function Utt(text) { this.text = text; }
  fake.Utterance = Utt;
  fake.synth = {
    speaking: false, paused: false,
    speak(u) { fake.spoken.push(u); fake.speaking = true; fake.synth.speaking = true; if (u.onstart) u.onstart(); },
    cancel() { fake.cancel++; fake.speaking = false; fake.synth.speaking = false; },
    pause() { fake.pause++; fake.paused = true; },
    resume() { fake.resume++; fake.paused = false; },
    getVoices() { return [{ name: 'Microsoft Xiaoxiao', lang: 'zh-CN', localService: true }]; },
    addEventListener() {},
  };
  w.speechSynthesis = fake.synth;
  w.SpeechSynthesisUtterance = Utt;
  w.__voiceFake = fake;
}

async function launch() {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { installFakeVoice(w); },
  });
}
function helpers(dom) {
  const w = dom.window, d = w.document;
  return {
    w, d, fake: () => w.__voiceFake,
    text: () => d.body.textContent || '',
    q: (s) => d.querySelector(s),
    qa: (s) => Array.from(d.querySelectorAll(s)),
    click: (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })),
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

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);

  const dom = await launch();
  const h = helpers(dom);
  const f = h.fake();

  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  const sk = h.qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (sk) h.click(sk);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
  h.click(h.qa('button').find(b => b.textContent.includes('新的开始')));
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('确认，开启新轮回')), 6000, '确认'));
  await h.wait(() => h.q('.cine-root'), 12000, '序章演出');

  // 1. 播放
  const btn = await h.wait(() => h.q('.voice-bar .voice-btn'), 8000, '语音按钮');
  ok(!!btn, '对话界面有扬声器按钮');
  h.click(btn);
  await sleep(400);
  ok(f.spoken.length === 1, '点击后朗读当前台词');
  ok(f.spoken[0] && f.spoken[0].text.length > 0, '朗读内容非空');
  ok(h.q('.voice-bar .wave') !== null, '播放时显示声波');
  ok(h.qa('.voice-bar .wave i').length === 3, '声波由 3 根动态柱组成');
  ok((h.q('.voice-btn').textContent || '').includes('⏸'), '播放中按钮变为暂停');

  // 2. 暂停
  h.click(h.q('.voice-btn'));
  await sleep(250);
  ok(f.pause === 1, '点击暂停调用 pause');
  ok(h.qa('.voice-bar .wave.frozen').length === 1, '暂停时声波冻结');
  ok((h.q('.voice-btn').textContent || '').includes('▶'), '暂停后按钮变为继续');

  // 3. 继续
  h.click(h.q('.voice-btn'));
  await sleep(250);
  ok(f.resume === 1, '点击继续调用 resume');

  // 4. 停止
  const stop = h.q('.voice-stop');
  ok(!!stop, '播放中出现停止按钮');
  const beforeCancel = f.cancel;
  h.click(stop);
  await sleep(250);
  ok(f.cancel > beforeCancel, '停止会取消当前朗读');
  ok(!h.q('.voice-stop'), '停止后停止按钮消失');

  // 5. 跳过剧情 → 立即停止
  h.click(h.q('.voice-btn'));
  await sleep(300);
  ok(f.spoken.length === 2, '可以再次播放');
  const beforeSkip = f.cancel;
  const skip = h.qa('button').find(b => b.textContent.includes('跳过'));
  h.click(skip);
  await sleep(500);
  ok(f.cancel > beforeSkip, '跳过剧情会立即停止语音');
  ok(h.text().includes('NEXUS 数字世界 · 服务器网络') || h.text().includes('任务简报'), '语音停止不影响剧情推进');

  // 6. 不叠加：连续两句
  if (h.q('.cine-root')) {
    const before = f.spoken.length;
    h.click(h.q('.voice-btn'));
    await sleep(200);
    const t = h.q('.dlg-text');
    if (t) { h.click(t); await sleep(120); h.click(t); }
    await sleep(200);
    ok(f.spoken.length <= before + 2, '连续对话不会叠加多个朗读（每次先取消）');
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
