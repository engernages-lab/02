// 第三章：剧情/碎片/Boss/知识点/迁移
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
function makeLoader() {
  const cache = new Map();
  const rf = (b) => existsSync(b) && extname(b) ? b : existsSync(b + '.ts') ? b + '.ts' : existsSync(join(b, 'index.ts')) ? join(b, 'index.ts') : b + '.ts';
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
const S = L('src/game/lore/chapter4.ts');
const B = L('src/game/battle.ts');
const BO = L('src/game/bosses.ts');
const F = L('src/game/lore/fragments.ts');
const CH = L('src/game/lore/chapters.ts');
const SV = L('src/services/save.ts');

let pass = 0, total = 0;
const check = (c, label, extra = '') => { total++; if (c) { pass++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label + (extra ? ' => ' + extra : '')); };

console.log('=== 1. 剧情演出 ===');
const scenes = [...S.CHAPTER4_ARRIVAL_SCENES, ...S.CHAPTER4_RESTORED_SCENES, ...S.CHAPTER4_BOSS_INTRO_SCENES, ...S.CHAPTER4_VICTORY_SCENES];
check(scenes.length >= 4, '演出分组齐全', String(scenes.length));
check(scenes.flatMap(s => s.lines).length >= 30, '剧情长度足够', String(scenes.flatMap(s => s.lines).length));
const all = scenes.flatMap(s => s.lines).map(l => l.text).join('');
check(all.includes('K-0') && all.includes('K-0'), '包含 K-0~K-0 实验记录');
check(all.includes('判断能力不应该成为决定其他生命命运的唯一依据'), '揭示第七代身份');
check(all.includes('你保护的究竟是什么'), '包含恩格尔实验记录');
check(all.includes('未经授权的意识'), '包含 K-0 威胁');
check(all.includes('第五章入口已解锁'), '结尾开放第四章');
check(!/R-0[1-6][^0-9]{0,4}成功/.test(all), '未改写 K-0~K-0 失败设定');

console.log('=== 2. Boss 与战斗 ===');
const boss = BO.bossById ? BO.bossById('judgment-4') : BO.BOSSES.find(b => b.id === 'judgment-4');
check(!!boss, 'JUDGMENT-4 已注册');
check(boss.chapter === 4 && boss.fragmentId === 'frag-04', '绑定第三章与第四枚碎片');
check(CH.chapterById('ch4').currentBossId === 'judgment-4', '第三章入口指向 JUDGMENT-4');
const bt = B.BOSS_BATTLES.find(x => x.bossId === 'judgment-4');
check(!!bt, 'JUDGMENT-4 已接入多阶段战斗');
check(bt.phases.length === 4, '四个战斗阶段', String(bt && bt.phases.length));
bt.phases.forEach((p, i) => {
  check(p.judge.pythonChecks.length >= 2, 'P' + (i + 1) + ' 有真实判题用例');
  check(!!p.initialCode && p.initialCode.length > 20, 'P' + (i + 1) + ' 有初始故障代码');
  check(p.hints.length === 3, 'P' + (i + 1) + ' 有三级提示');
});
check(B.knowledgeViolations(bt).length === 0, '知识点不超纲', JSON.stringify(B.knowledgeViolations(bt)));

console.log('=== 3. 碎片与迁移 ===');
const frag = F.fragmentById('frag-04');
check(frag && frag.title === '秩序的边界', '第四枚碎片名称正确');
check(frag.order === 4, '碎片顺序为 4');
check(SV.SAVE_VERSION === 7, '存档版本 v7');
const imp = SV.importSave(JSON.stringify({ version: 6, updatedAt: 1, player: {
  name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
  level: 6, exp: 1200, consciousness: 100,
  meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: ['frag-01', 'frag-02'], backupLevel: 1 },
  progress: {
    completedLevels: ['4-1','4-2','4-3','4-4','4-5'], stars: {}, unlockedServers: ['storage'], currentLevelId: null,
    failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
    storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
    flags: {}, bossesDone: ['judgment-4'], battles: {}, currentBossId: null, pendingRebirth: false,
  },
  rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
  settings: { musicVolume: .3, sfxVolume: .6, animations: true, animLevel: 'high', typewriterMs: 20, fullscreen: false, lang: 'zh' },
} }));
check(imp.ok === true, 'v6 存档可导入');
check(imp.state.progress.flags.chapter4Done === true, '旧档回填 chapter3Done');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
