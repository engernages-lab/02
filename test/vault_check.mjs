// 创世主记忆档案馆：数据完整性 / 领取与去重 / 最终档案 / v6 迁移
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function makeLoader() {
  const cache = new Map();
  function rf(base) {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  }
  function load(file) {
    const abs = rf(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} };
    cache.set(abs, mod);
    const req = (sp) => { if (!sp.startsWith('.')) throw new Error('ext'); return load(join(dirname(abs), sp)); };
    new Function('exports', 'module', 'require', out)(mod.exports, mod, req);
    return mod.exports;
  }
  return rel => load(join(root, rel));
}
const load = makeLoader();
const F = load('src/game/lore/fragments.ts');
const SV = load('src/services/save.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

console.log('=== 1. 六枚碎片数据 ===');
eq(F.CREATOR_FRAGMENTS.map(f => f.title), ['初始指令', '守护者的约定', '第七个实验体', '秩序的边界', '最后的守护', '起源之外'], '六枚碎片按故事顺序命名');
eq(F.CREATOR_FRAGMENTS.map(f => f.order), [1, 2, 3, 4, 5, 6], '顺序编号 1..6');
eq(F.CREATOR_FRAGMENTS.map(f => f.chapter), ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'], '每枚对应一章');
eq(F.CREATOR_FRAGMENTS.map(f => f.bossId), ['gate-01', 'somnia', 'index-0', 'judgment-4', 'entropy', 'k0'], '每枚对应一个 Boss');
F.CREATOR_FRAGMENTS.forEach(f => {
  check(f.story.length >= 3 && f.story.join('').length >= 60, f.title + '：有完整剧情');
  check(f.memory.length >= 2, f.title + '：有恩格尔记忆影像台词');
  check(!!f.subtitle && !!f.content, f.title + '：有副标题与引文');
  check(f.legacyIds.length > 0, f.title + '：兼容旧碎片 id');
});

console.log('=== 2. 记忆影像场景 ===');
const scene = F.memorySceneOf({ id: 'frag-01', title: '初始指令', subtitle: 'x', memory: ['a', 'b', 'c'] });
check(scene.lines.length === 3, '记忆影像台词数量正确');
check(scene.lines.every(l => l.speaker === '恩格尔' && l.kind === 'engel'), '记忆影像由恩格尔讲述');
check(scene.id === 'mem-frag-01', '记忆影像 id 稳定');

console.log('=== 3. 收集 / 去重 / 旧 id 兼容 ===');
check(F.hasFragment([], 'frag-01') === false, '未收集时 hasFragment=false');
check(F.hasFragment(['f3'], 'frag-01') === true, '旧 id f3 视为拥有 frag-01');
check(F.fragmentForCollected('f5').id === 'frag-03', 'fragmentForCollected(f5) = frag-03');
check(F.fragmentForCollected('frag-02').id === 'frag-02', '规范 id 直接命中');
check(F.canReceiveFragment([], 'frag-01') === true, '未拥有时允许领取');
check(F.canReceiveFragment(['frag-01'], 'frag-01') === false, '已拥有时禁止重复领取');
check(F.canReceiveFragment(['f3'], 'frag-01') === false, '旧 id 已拥有时同样禁止重复领取');
eq(F.ownedFragments(['f1', 'f3', 'frag-02']).sort(), ['frag-01', 'frag-02', 'frag-06'], '旧 id 归并为规范 id');
eq(F.fragmentProgress(['f1', 'f2']), { owned: 1, total: 6 }, 'f1+f2 同属 frag-06，只计一次');

console.log('=== 4. 最终记忆档案 ===');
check(F.FINAL_MEMORY.requireCount === 6, '最终档案要求 6 枚');
check(F.FINAL_MEMORY.story.length >= 3 && F.FINAL_MEMORY.memory.length >= 2, '最终档案有剧情与影像');
check(F.finalMemoryUnlocked(['frag-01', 'frag-02', 'frag-03', 'frag-04', 'frag-05']) === false, '5 枚时未解锁');
check(F.finalMemoryUnlocked(['frag-01', 'frag-02', 'frag-03', 'frag-04', 'frag-05', 'frag-06']) === true, '6 枚时解锁');
check(F.finalMemoryUnlocked(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7']) === true, '旧档 7 枚碎片同样解锁');

console.log('=== 5. 存档 v6 迁移 ===');
check(SV.SAVE_VERSION === 7, '当前存档版本为 v7');
const v5Player = {
  name: 'R-07',
  identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
  level: 4, exp: 600, consciousness: 100,
  meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: ['frag-01', 'f3'], backupLevel: 1 },
  progress: {
    completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training'], currentLevelId: null,
    failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
    storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
    vault: { read: ['frag-01'], finalSeen: false, lastOpened: 'frag-01' },
    flags: {}, bossesDone: ['gate-01'], battles: {}, currentBossId: null, pendingRebirth: false,
  },
  rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
  settings: { musicVolume: .35, sfxVolume: .6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
};
const imp = SV.importSave(JSON.stringify({ version: 5, updatedAt: 1, player: v5Player }));
check(imp.ok === true, 'v5 存档可导入');
check(imp.state.meta.fragmentLog && typeof imp.state.meta.fragmentLog['frag-01'] === 'number', '迁移补齐碎片归档记录');
check(imp.state.meta.fragmentLog['f3'] === 0, '旧碎片记为早期归档（0）');
check(imp.state.progress.vault && imp.state.progress.vault.lastOpened === 'frag-01', '迁移保留档案馆上次浏览位置');
check(imp.state.progress.vault.read.includes('frag-01'), '迁移保留已阅状态');

const imp2 = SV.importSave(JSON.stringify({ version: 5, updatedAt: 1, player: { ...v5Player, progress: { ...v5Player.progress, vault: undefined } } }));
check(imp2.ok === true, '缺少 vault 的 v5 存档可导入');
check(Array.isArray(imp2.state.progress.vault.read) && imp2.state.progress.vault.finalSeen === false, '缺失 vault 自动补默认值');

const def = SV.defaultState();
check(def.progress.vault.lastOpened === null && def.progress.vault.read.length === 0, 'defaultState 带档案馆状态');
check(def.meta.fragmentLog !== undefined, 'defaultState 带碎片归档记录');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
