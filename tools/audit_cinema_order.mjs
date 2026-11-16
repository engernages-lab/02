// 自检：章节过场的实际播放顺序（用 jsdom 打开真实构建产物）
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4191;
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
const vc = new VirtualConsole(); vc.on('error', () => {}); vc.on('warn', () => {}); vc.on('jsdomError', () => {});

function makeSave(progress, flags) {
  return JSON.stringify({ version: 7, updatedAt: Date.now(), player: {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 9, exp: 2600, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], backupLevel: 1, fragmentLog: {} },
    progress: {
      completedLevels: [], stars: {}, unlockedServers: ['training', 'syntax', 'logs', 'storage', 'factory', 'diag', 'core'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags, bossesDone: [], battles: {}, currentBossId: null, pendingRebirth: false,
      ...progress,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
  } });
}

async function runCase(name, progress, flags, waitMs = 6000) {
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.localStorage.setItem('nexus_code_repair_save_v1', makeSave(progress, flags)); },
  });
  const w = dom.window, d = w.document;
  const text = () => d.body.textContent || '';
  const qa = s => Array.from(d.querySelectorAll(s));
  const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  const wait = async (fn, ms, label) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(100); } throw new Error('timeout ' + label); };
  await wait(() => w.document.querySelector('.boot-wrap'), 15000, 'boot');
  const skip = qa('button').find(b => b.textContent.includes('跳过初始化'));
  if (skip) click(skip);
  click(await wait(() => qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'enter'));
  await wait(() => text().includes('Python 知识库'), 10000, 'menu');
  click(qa('button').find(b => b.textContent.includes('继续探索')));
  await sleep(1200);
  const cinema = d.querySelector('.cine-root');
  const body = text().replace(/\s+/g, ' ');
  console.log('--- ' + name + ' ---');
  console.log('cinema?', !!cinema, '| cine text:', ((cinema && cinema.textContent) || '').replace(/\s+/g, ' ').slice(0, 260));
  console.log('buttons:', qa('button').map(b => b.textContent.trim()).filter(Boolean).slice(0, 10).join(' / '));
  console.log('text:', body.slice(0, 160));
  if (cinema) {
    // 点击推进一次，看看下一句
    const t = d.querySelector('.dlg-text');
    if (t) { click(t); await sleep(300); }
    console.log('after click:', ((d.querySelector('.cine-root')?.textContent) || '').replace(/\s+/g, ' ').slice(0, 260));
  }
  dom.window.close();
}

(async () => {
  server.listen(PORT, '127.0.0.1');
  await sleep(300);
  // 第二章 5 关刚完成：应播「第二章恢复/坦白」，而不是第三章开场
  await runCase('ch2 done', { completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5'] },
    { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true, chapter2Done: true });
  await runCase('ch3 done（已击破 INDEX-0）', { completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5', '3-1', '3-2', '3-3', '3-4', '3-5'], bossesDone: ['gate-01', 'somnia', 'index-0'] },
    { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true, chapter2Done: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true, chapter2CinematicShown: true, chapter3Done: true });
  // 第五章 5 关刚完成、已击破 ENTROPY：应先播「第五章真相」，而不是第六章开场
  await runCase('ch5 done（已击破 ENTROPY）', { completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5', '3-1', '3-2', '3-3', '3-4', '3-5', '4-1', '4-2', '4-3', '4-4', '4-5', '5-1', '5-2', '5-3', '5-4', '5-5'], bossesDone: ['gate-01', 'somnia', 'index-0', 'judgment-4', 'entropy'] },
    { prologueDone: true, tutorialCinematicShown: true, chapter1Done: true, chapter1ArrivalSeen: true, chapter1RestoreSeen: true, chapter1CinematicShown: true, chapter2Done: true, chapter2ArrivalSeen: true, chapter2RestoreSeen: true, chapter2CinematicShown: true, chapter3Done: true, chapter3ArrivalSeen: true, chapter3CinematicShown: true, chapter4Done: true, chapter4ArrivalSeen: true, chapter4CinematicShown: true, chapter5Done: true });
  server.close();
})().catch(e => { console.error(e); server.close(); process.exit(1); });
