// 第十阶段：验收与稳定性（存档兼容 / 数据一致性 / 构建产物 / 响应式）
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
function makeLoader() {
  const cache = new Map();
  const rf = (base) => existsSync(base) && extname(base) ? base : existsSync(base + '.ts') ? base + '.ts' : existsSync(join(base, 'index.ts')) ? join(base, 'index.ts') : base + '.ts';
  function load(file) {
    const abs = rf(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} }; cache.set(abs, mod);
    new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
    return mod.exports;
  }
  return (rel) => load(join(root, rel));
}
const L = makeLoader();
const SV = L('src/services/save.ts');
const R = L('src/game/rewards.ts');
const B = L('src/game/bosses.ts');
const CH = L('src/game/lore/chapters.ts');
const E = L('src/game/lore/endings.ts');
const F = L('src/game/lore/fragments.ts');
const LV = L('src/game/levels.ts');

let pass = 0, total = 0;
const check = (c, label, extra = '') => { total++; if (c) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? ' => ' + extra : '')); };

const base = (version, extra = {}) => JSON.stringify({ version, updatedAt: 1, player: {
  name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
  level: 3, exp: 200, consciousness: 80,
  meta: { deaths: 1, rebirths: 0, lastDeathLevel: 'tut-1', lastDeathReason: '意识耗尽', memoryFragments: ['f3'], backupLevel: 1, ...(extra.meta || {}) },
  progress: {
    completedLevels: ['tut-1'], stars: { 'tut-1': 3 }, unlockedServers: ['training'], currentLevelId: null,
    failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: ['print'],
    storySeen: {}, story: { unlocked: ['prologue'], seen: {}, choices: {}, lastEventId: 'prologue' },
    flags: { prologueDone: true }, bossesDone: [], battles: {}, currentBossId: null, pendingRebirth: false, ...(extra.progress || {}),
  },
  rewards: { credits: 120, trust: 20, items: { scan: 1 }, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [], ...(extra.rewards || {}) },
  settings: { musicVolume: .3, sfxVolume: .6, animations: true, animLevel: 'high', typewriterMs: 20, fullscreen: false, lang: 'zh' },
} });

console.log('=== 1. 存档版本兼容（v1 → v6） ===');
for (const v of [1, 2, 3, 4, 5]) {
  const imp = SV.importSave(base(v));
  check(imp.ok === true && imp.state && imp.state.progress, 'v' + v + ' 存档可导入');
  check(imp.state.meta.memoryFragments.includes('f3') || imp.state.meta.memoryFragments.includes('frag-01'), 'v' + v + ' 保留碎片');
  check(imp.state.rewards.credits === 120 && imp.state.rewards.trust === 20, 'v' + v + ' 保留贡献点/信任度');
}
const v1 = SV.importSave(base(1));
check(SV.SAVE_VERSION === 7, '当前存档版本 7');
check(v1.state.progress.story && typeof v1.state.progress.story.unlocked !== 'undefined', 'v1 补齐剧情结构');
check(Array.isArray(v1.state.progress.endings) && v1.state.progress.vault, 'v1 补齐结局/档案馆字段');

console.log('=== 2. 旧 Boss 代号迁移 ===');
const v2 = SV.importSave(base(2, { progress: { bossesDone: ['echo-01'], currentBossId: 'echo-01' } }));
check(v2.state.progress.bossesDone.includes('gate-01'), 'echo-01 → gate-01');
const v4 = SV.importSave(base(4, { progress: { bossesDone: ['echo-02'], currentBossId: 'echo-02' } }));
check(v4.state.progress.bossesDone.includes('somnia'), 'echo-02 → somnia');

console.log('=== 3. 不重复发放 ===');
const rw = R.normalizeRewards({ credits: 10, bossRewards: ['boss-ch1'], unlocks: ['title-level5'] });
check(rw.bossRewards.length === 1 && rw.unlocks.length === 1, '幂等字段保留');
const rw2 = R.normalizeRewards(rw);
check(JSON.stringify(rw2.bossRewards) === JSON.stringify(rw.bossRewards), '重复归一化不增加奖励');

console.log('=== 4. 数据完整性 ===');
check(LV.LEVELS.length === 31, '31 个关卡', String(LV.LEVELS.length));
check(F.CREATOR_FRAGMENTS.length === 6, '六枚创世主碎片');
check(E.ENDINGS.length === 3, '三个结局');
const bossIds = B.BOSSES.map(b => b.id);
check(CH.CHAPTERS.filter(c => c.currentBossId).every(c => bossIds.includes(c.currentBossId)), '已接入 Boss 的章节均已注册');
check(CH.CHAPTERS.length === 6, '六个章节定义齐全', String(CH.CHAPTERS.length));
check(CH.CHAPTERS.filter(c => !c.currentBossId).length === 0, '终章 Boss 已接入');
const dupBoss = bossIds.filter((id, i) => bossIds.indexOf(id) !== i);
check(dupBoss.length === 0, 'Boss id 无重复');

console.log('=== 5. 构建产物 ===');
check(existsSync(join(root, 'dist/index.html')), 'dist/index.html 存在');
check(existsSync(join(root, 'dist/assets/game.js')), 'dist/assets/game.js 存在');
const jsSize = readFileSync(join(root, 'dist/assets/game.js')).length;
check(jsSize > 100000, '构建体积正常（' + Math.round(jsSize / 1024) + ' KB）');
const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
check(html.includes('vault.css'), 'index.html 引入 vault.css');
check(html.includes('boss.css'), 'index.html 引入 boss.css');
check(existsSync(join(root, 'public/micropython/micropython-settrace.wasm')), 'MicroPython 运行时随包分发');

console.log('=== 6. 响应式样式 ===');
const css = readFileSync(join(root, 'public/vault.css'), 'utf8');
check(/@media\s*\(max-width/.test(css), '存在响应式断点');
check(css.includes('.ending-grid') && css.includes('.codex-grid') && css.includes('.tl-item'), '新系统样式已打包');
const globalCss = readFileSync(join(root, 'public/global.css'), 'utf8');
check(/@media\s*\(max-width/.test(globalCss), '全局布局有响应式断点');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
