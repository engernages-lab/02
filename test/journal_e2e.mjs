// 探索档案端到端：时间线锁定 / Bug 图鉴解锁 / 存档恢复
import { JSDOM, VirtualConsole } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = join(__dirname, '..', 'dist');
const PORT = 4183;
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

let pass = 0, total = 0;
const ok = (c, label, extra = '') => { total++; if (c) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? ' => ' + extra : '')); };

const makeSave = () => JSON.stringify({ version: 6, updatedAt: Date.now(), player: {
  name: 'R-07',
  identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
  level: 3, exp: 200, consciousness: 100,
  meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null,
    memoryFragments: ['frag-01'], fragmentLog: { 'frag-01': 0 }, backupLevel: 1,
    bugCodex: { syntax: { count: 3, firstAt: 1 }, logic: { count: 1, firstAt: 2 } } },
  progress: {
    completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training'], currentLevelId: null,
    failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
    storySeen: { 'pro-01': true }, story: { unlocked: ['prologue'], seen: { 'pro-01': 1 }, choices: {}, lastEventId: 'prologue' },
    vault: { read: [], finalSeen: false, lastOpened: null }, flags: { prologueDone: true, tutorialCinematicShown: true },
    bossesDone: [], battles: {}, currentBossId: null, pendingRebirth: false,
  },
  rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], bossRewards: [], unlocks: [] },
  settings: { musicVolume: .3, sfxVolume: .6, animations: false, animLevel: 'low', typewriterMs: 0, fullscreen: false, lang: 'zh' },
} });

(async () => {
  server.listen(PORT, '127.0.0.1'); await sleep(300);
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + PORT + '/', {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.localStorage.setItem('nexus_code_repair_save_v1', makeSave()); },
  });
  const w = dom.window, d = w.document;
  const text = () => d.body.textContent || '';
  const qa = (s) => Array.from(d.querySelectorAll(s));
  const click = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  const wait = async (fn, ms, label) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch {} await sleep(100); } throw new Error('超时: ' + label); };

  await wait(() => d.querySelector('.boot-wrap'), 15000, '启动页');
  const sk = qa('button').find(b => b.textContent.includes('跳过初始化')); if (sk) click(sk);
  click(await wait(() => qa('button').find(b => b.textContent.includes('ENTER NEXUS')), 10000, 'ENTER'));
  await wait(() => text().includes('Python 知识库'), 10000, '主菜单');

  click(await wait(() => qa('button').find(b => b.textContent.includes('探索档案')), 8000, '入口'));
  await wait(() => d.querySelector('.tl-list'), 10000, '时间线');
  ok(text().includes('剧情时间线'), '时间线标签渲染');
  ok(text().includes('初始指令'), '已获得碎片显示真实标题');
  ok(text().includes('第 3 枚碎片 · 未归档'), '未获得碎片遮蔽为未归档');
  ok(text().includes('🔒'), '未解锁条目有锁定标识');
  ok(text().includes('Lv.3'), '成长轨迹显示当前等级');

  click(qa('button').find(b => b.textContent.includes('Bug 图鉴')));
  await wait(() => d.querySelector('.codex-card'), 8000, '图鉴');
  ok(qa('.codex-card').length >= 10, '图鉴卡片齐全');
  ok(qa('.codex-card.found').length === 2, '只解锁遭遇过的 2 条');
  ok(text().includes('SyntaxError'), '已遭遇错误显示类型');
  ok(text().includes('3 次'), '显示遭遇次数');
  ok(text().includes('？？？'), '未遭遇错误保持加密');

  // 存档中的图鉴记录不丢失
  const sv = JSON.parse(w.localStorage.getItem('nexus_code_repair_save_v1') || '{}');
  ok(sv.player.meta.bugCodex.syntax.count === 3, '图鉴记录持久化');

  dom.window.close(); server.close();
  console.log('\n=== 结果 ===');
  console.log('通过 ' + pass + ' / ' + total);
  process.exit(pass === total ? 0 : 1);
})().catch(e => { console.error('E2E 失败:', e && e.message ? e.message : e); server.close(); process.exit(1); });
