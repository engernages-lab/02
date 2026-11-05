// 结局端到端：三结局档案 / 隐藏结局条件 / 选择记录 / 存档恢复
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4184;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm' };
const server = createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const f = normalize(join(distRoot, p));
    if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  } catch { res.writeHead(500); res.end('err'); }
});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
process.on('unhandledRejection', () => {});
const vc = new VirtualConsole(); vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});

let pass = 0, total = 0;
const ok = (c, label, extra = '') => { total++; if (c) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? ' => ' + extra : '')); };

const makeSave = ({ fragments = [], trust = 10, finalSeen = false, chapterDone = true, endings = [], ending = null }) => JSON.stringify({ version: 6, updatedAt: Date.now(), player: {
  name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
  level: 9, exp: 4000, consciousness: 100,
  meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: fragments, fragmentLog: {}, backupLevel: 1, bugCodex: {} },
  progress: {
    completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training'], currentLevelId: null,
    failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
    storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
    vault: { read: [], finalSeen, lastOpened: null },
    endings, ending, flags: { prologueDone: true, tutorialCinematicShown: true, chapter6Done: chapterDone },
    bossesDone: [], battles: {}, currentBossId: null, pendingRebirth: false,
  },
  rewards: { credits: 0, trust, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], bossRewards: [], unlocks: [] },
  settings: { musicVolume: .3, sfxVolume: .6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
} });

async function launch(seed) {
  return JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.localStorage.setItem('nexus_code_repair_save_v1', seed); },
  });
}
const helpers = (dom) => {
  const w = dom.window, d = w.document;
  return { w, d, text: () => d.body.textContent || '', q: (s) => d.querySelector(s), qa: (s) => Array.from(d.querySelectorAll(s)),
    click: (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })),
    save: () => JSON.parse(w.localStorage.getItem('nexus_code_repair_save_v1') || '{}'),
    async wait(fn, ms, label) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch {} await sleep(100); } throw new Error('超时: ' + label); } };
};
async function enterMenu(h) {
  await h.wait(() => h.q('.boot-wrap'), 15000, '启动页');
  const sk = h.qa('button').find(b => b.textContent.includes('跳过初始化')); if (sk) h.click(sk);
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await h.wait(() => h.text().includes('Python 知识库'), 10000, '主菜单');
  h.click(await h.wait(() => h.qa('button').find(b => b.textContent.includes('结局档案')), 8000, '入口'));
  await h.wait(() => h.q('.ending-grid'), 10000, '结局档案');
}
const ALL = ['frag-01', 'frag-02', 'frag-03', 'frag-04', 'frag-05', 'frag-06'];

(async () => {
  server.listen(PORT, '127.0.0.1'); await sleep(300);

  // 1) 全部条件满足 → 选择隐藏结局
  let dom = await launch(makeSave({ fragments: ALL, trust: 80, finalSeen: true }));
  let h = helpers(dom);
  await enterMenu(h);
  ok(h.qa('.ending-card').length === 3, '档案展示三个结局');
  ok(h.text().includes('新的黎明') && h.text().includes('永恒秩序') && h.text().includes('超越起源'), '三个结局名称正确');
  ok(h.text().includes('已达成 0 / 3'), '初始未达成');
  ok(h.text().includes('终章已抵达'), '终章状态正确');
  const hiddenCard = h.qa('.ending-card').find(c => c.textContent.includes('超越起源'));
  ok(!!hiddenCard && hiddenCard.className.includes('hidden'), '隐藏结局标记');
  const chooseBtn = hiddenCard && Array.from(hiddenCard.querySelectorAll('button')).find(b => b.textContent.includes('做出选择'));
  ok(!!chooseBtn && !chooseBtn.disabled, '条件满足时可选隐藏结局');
  h.click(chooseBtn);
  await h.wait(() => h.q('.cine-root'), 8000, '结局演出');
  ok(h.text().includes('超越起源') || h.text().includes('下一个问题'), '播放隐藏结局独立演出');
  const sk = h.qa('button').find(b => b.textContent.includes('跳过')); if (sk) h.click(sk);
  await sleep(400);
  const sv1 = h.save();
  ok(Array.isArray(sv1.player.progress.endings) && sv1.player.progress.endings.includes('beyond'), '结局写入存档');
  ok(sv1.player.progress.ending === 'beyond', '记录玩家选择');
  dom.window.close();

  // 2) 重开 → 档案恢复
  dom = await launch(JSON.stringify(sv1));
  h = helpers(dom);
  await enterMenu(h);
  ok(h.text().includes('已达成 1 / 3'), '重开后恢复已达成数量');
  const done = h.qa('.ending-card.done');
  ok(done.length === 1 && done[0].textContent.includes('超越起源'), '重开后标记已达成的结局');
  ok(Array.from(done[0].querySelectorAll('button')).some(b => b.textContent.includes('回顾')), '已达成可回顾演出');
  dom.window.close();

  // 3) 条件不足 → 隐藏结局锁定
  dom = await launch(makeSave({ fragments: ['frag-01', 'frag-02'], trust: 40, finalSeen: false }));
  h = helpers(dom);
  await enterMenu(h);
  const hidden2 = h.qa('.ending-card').find(c => c.textContent.includes('待解锁的结局') || c.textContent.includes('超越起源'));
  ok(!!hidden2, '隐藏结局卡片存在');
  ok(h.text().includes('碎片 2/6'), '显示碎片进度条件');
  ok(h.text().includes('最终档案 未阅'), '显示最终档案条件');
  ok(h.text().includes('信任 40/75'), '显示信任度条件');
  const disabled = hidden2 && Array.from(hidden2.querySelectorAll('button')).find(b => b.textContent.includes('做出选择'));
  ok(!!disabled && disabled.disabled, '条件不足时不可选择');
  dom.window.close();

  server.close();
  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e && e.message ? e.message : e); server.close(); process.exit(1); });
