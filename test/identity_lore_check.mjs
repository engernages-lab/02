// 身份系统 + 剧情数据层 + 存档迁移 的逻辑验证（node 环境，无需浏览器）
// 直接加载 src 下的 TS 模块（用内置 TypeScript 转译），不依赖构建产物。
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function makeLoader() {
  const cache = new Map();
  function resolveFile(base) {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  }
  function load(file) {
    const abs = resolveFile(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const mod = { exports: {} };
    cache.set(abs, mod);
    const req = (spec) => {
      if (!spec.startsWith('.')) throw new Error('外部依赖不可用: ' + spec);
      return load(join(dirname(abs), spec));
    };
    new Function('exports', 'module', 'require', out)(mod.exports, mod, req);
    return mod.exports;
  }
  return (rel) => load(join(root, rel));
}

const load = makeLoader();
const ID = load('src/game/identity.ts');
const FR = load('src/game/lore/fragments.ts');
const CH = load('src/game/lore/chapters.ts');
const CC = load('src/game/lore/characters.ts');
const EN = load('src/game/lore/endings.ts');
const VR = load('src/game/lore/vars.ts');
const EV = load('src/game/lore/events.ts');
const SV = load('src/services/save.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

console.log('=== 1. 玩家身份：默认值 / 清洗 / 校验 ===');
const d = ID.defaultIdentity(1000);
check(d.displayName === 'R-07', '默认显示名称为 R-07');
check(d.originCode === 'R-07', '默认原始编号为 R-07');
check(d.renamed === false, '默认未自定义名称');
check(d.createdAt === 1000, '身份创建时间可注入');
check(ID.sanitizeDisplayName('  Neo  ') === 'Neo', '清洗：去除首尾空格');
check(ID.sanitizeDisplayName('a\nb') === 'a b', '清洗：换行转空格');
check(ID.sanitizeDisplayName('x'.repeat(40)).length === 12, '清洗：超长截断到 12');
check(ID.validateDisplayName('').ok === false, '校验：空名称被拒绝');
check(ID.validateDisplayName('   ').ok === false, '校验：全空格被拒绝');
check(ID.validateDisplayName('MIRA').ok === false, '校验：与 MIRA 同名被拒绝');
check(ID.validateDisplayName('mira').ok === false, '校验：大小写不同的 mira 同样被拒绝');
check(ID.validateDisplayName('Neo').ok === true, '校验：正常名称通过');
check(ID.validateDisplayName('R-07').ok === true, '校验：允许改回默认 R-07');

console.log('=== 2. 原始编号永久固定 ===');
const n1 = ID.normalizeIdentity({ displayName: 'Neo', originCode: 'X-99', renamed: true }, 'R-07');
check(n1.displayName === 'Neo', '旧存档：保留自定义显示名');
check(n1.originCode === 'R-07', '旧存档：originCode 被强制修正为 R-07（不可篡改）');
const n2 = ID.normalizeIdentity(null, 'R-07');
check(n2.displayName === 'R-07' && n2.originCode === 'R-07' && n2.renamed === false, '缺失身份：从 name 回退为 R-07');
const n3 = ID.normalizeIdentity(null, '小明');
check(n3.displayName === '小明' && n3.renamed === true, '旧存档里已有自定义 name：迁移为显示名并标记 renamed');
check(ID.displayNameOf({ name: 'R-07' }) === 'R-07', 'displayNameOf：无 identity 时回退 name');
check(ID.displayNameOf(null) === 'R-07', 'displayNameOf：空值返回 R-07');
check(ID.displayNameOf({ name: 'Neo', identity: { displayName: 'Neo', originCode: 'R-07', renamed: true, createdAt: 0 } }) === 'Neo', 'displayNameOf：优先 identity.displayName');
check(ID.originCodeOf({ name: 'Neo' }) === 'R-07', 'originCodeOf：改名后编号仍为 R-07');

console.log('=== 3. 对话名称替换 ===');
check(ID.applyPlayerName('R-07，意识同步完成。', 'Neo') === 'Neo，意识同步完成。', '改名后对话正文按显示名称呼');
check(ID.applyPlayerName('R-07，意识同步完成。', 'R-07') === 'R-07，意识同步完成。', '默认名称时正文不变');
check(ID.applyPlayerName('{player}，欢迎回来。', 'Neo') === 'Neo，欢迎回来。', '{player} 占位符被替换');
check(ID.applyPlayerName('{player} 你好', 'R-07') === 'R-07 你好', '默认名称时占位符同样替换');
check(ID.applyPlayerName('编号 {{code}} 已登记', 'Neo') === '编号 R-07 已登记', '{{code}} 在改名后仍渲染为固定编号 R-07');
check(ID.applyPlayerName('{{code}} 与 {player}', 'Neo') === 'R-07 与 Neo', '{{code}} 与 {player} 可同句混用');

console.log('=== 4. 创世主六碎片 ===');
check(FR.CREATOR_FRAGMENTS.length === 6, '碎片数量为 6');
check(new Set(FR.CREATOR_FRAGMENTS.map(f => f.id)).size === 6, '碎片 id 唯一');
eq(FR.CREATOR_FRAGMENTS.map(f => f.order), [1,2,3,4,5,6], '碎片顺序 1..6');
check(FR.fragmentForLegacyId('f3').id === 'frag-01', '旧碎片 f3 → frag-01（第一章）');
check(FR.fragmentForLegacyId('f7').id === 'frag-05', '旧碎片 f7 → frag-05（第五章）');
check(FR.fragmentForLegacyId('f1').id === 'frag-06', '旧碎片 f1 → frag-06（第六章）');
check(FR.hasFragment(['f3'], 'frag-01') === true, 'hasFragment：旧 id 视为已拥有');
check(FR.hasFragment([], 'frag-01') === false, 'hasFragment：未收集返回 false');
eq(FR.ownedFragments(['f1', 'f3']).sort(), ['frag-01', 'frag-06'], 'ownedFragments：旧 id 归并到规范 id');
check(FR.fragmentProgress([]).total === 6, '碎片总数 = 6');

console.log('=== 5. 六章剧情配置 ===');
check(CH.CHAPTERS.length === 6, '章节数量为 6');
eq(CH.CHAPTERS.map(c => c.order), [1,2,3,4,5,6], '章节顺序 1..6');
check(new Set(CH.CHAPTERS.map(c => c.serverId)).size === 6, '每章对应唯一服务器');
check(new Set(CH.CHAPTERS.map(c => c.bossId)).size === 6, '每章对应唯一 Boss 代号');
check(CH.CHAPTERS.every(c => !!FR.fragmentById(c.fragmentId)), '每章碎片 id 都能在碎片表中找到');
check(CH.chapterByServer('core').id === 'ch6', 'chapterByServer(core) = ch6');
check(CH.chapterOfBoss('somnia').id === 'ch2', 'chapterOfBoss(somnia) = ch2');
check(CH.chapterById('ch6').currentBossId === 'k0', '第六章 Boss 为 K-0');
check(CH.CHAPTERS.every(c => Array.isArray(c.knowledgeFocus) && c.knowledgeFocus.length > 0), '每章都标注了知识点范围');

console.log('=== 6. 四位核心角色 ===');
eq(CC.CHARACTERS.map(c => c.id), ['r07','mira','engel','k0'], '角色恰为 R-07 / MIRA / 恩格尔 / K-0');
check(CC.characterById('r07').originCode === 'R-07', 'R-07 的固定编号存在');
check(CC.characterById('engel').name === '恩格尔', '创世主名称为「恩格尔」');
check(CC.characterById('k0').name === 'K-0', 'K-0 已建立角色档案');
check(CC.characterUnlocked(CC.characterById('r07'), {}) === true, 'R-07 默认解锁');
check(CC.characterUnlocked(CC.characterById('k0'), {}) === false, 'K-0 默认锁定');
check(CC.characterUnlocked(CC.characterById('k0'), { chapter4Done: true }) === true, 'K-0 在第四章完成后解锁');

console.log('=== 7. 结局条件 ===');
check(EN.ENDINGS.length === 3, '结局数量为 3');
check(EN.ENDINGS.filter(e => e.kind === 'main').length === 2, '两个主结局');
check(EN.ENDINGS.filter(e => e.kind === 'hidden').length === 1, '一个隐藏结局');
check(EN.endingById('beyond').condition.fragments.length === 6, '隐藏结局要求集齐六枚碎片');
check(EN.endingEligible(EN.endingById('dawn'), { fragments: [], flags: { chapter6Done: true }, trust: 0, choice: 'dawn' }) === true, '《新的黎明》：第六章完成后选择 dawn 即满足');
check(EN.endingEligible(EN.endingById('dawn'), { fragments: [], flags: { chapter6Done: true }, trust: 0, choice: 'order' }) === false, '《新的黎明》：选择 order 不满足');
const allFrag = FR.CREATOR_FRAGMENTS.map(f => f.id);
check(EN.endingEligible(EN.endingById('beyond'), { fragments: allFrag, flags: { chapter6Done: true, finalMemorySeen: true }, trust: 80, choice: 'beyond' }) === true, '《超越起源》：六碎片 + 信任度 80 满足');
check(EN.endingEligible(EN.endingById('beyond'), { fragments: allFrag, flags: { chapter6Done: true }, trust: 10, choice: 'beyond' }) === false, '《超越起源》：信任度不足不满足');
check(EN.endingEligible(EN.endingById('beyond'), { fragments: ['f1'], flags: { chapter6Done: true }, trust: 80, choice: 'beyond' }) === false, '《超越起源》：碎片不足不满足');
check(EN.availableEndings({ fragments: [], flags: { chapter6Done: true }, trust: 0, choice: 'dawn' }).some(e => e.id === 'dawn'), 'availableEndings 能筛出可用结局');

console.log('=== 8. 剧情变量 ===');
check(new Set(VR.STORY_VARS.map(v => v.key)).size === VR.STORY_VARS.length, '变量 key 唯一');
check(VR.getStoryVar(undefined, 'chapter1Done') === false, '缺失变量回落到默认 false');
check(VR.getStoryVar({ chapter1Done: true }, 'chapter1Done') === true, '已存在变量按存储值读取');
check(VR.chapterDone({ chapter3Done: true }, 'ch3') === true, 'chapterDone(ch3) 读取 chapter3Done');
check(VR.chapterDone({ chapter3Done: false }, 'ch3') === false, 'chapterDone 为 false 时返回 false');
const nv = VR.normalizeStoryVars({ chapter1Done: true, n: 3, bad: 'x' });
check(nv.chapter1Done === true && nv.n === 3, '清洗：保留布尔与数字');
check(nv.bad === undefined, '清洗：丢弃非法类型');
check(nv.chapter2Done === undefined, '清洗：不注入默认值（不改变“缺失 vs 显式 false”语义）');
eq(VR.normalizeStoryVars({ 'brief_syntax': true }), { 'brief_syntax': true }, '清洗：保留未知 flag（向前兼容）');

console.log('=== 9. 剧情事件解锁 / 阅读状态 ===');
const s0 = EV.normalizeStoryReadState(undefined, { p1: true, prologue_p1: true });
check(s0.seen.p1 === 1 && s0.seen.prologue_p1 === 1, '迁移：旧 storySeen 合并为阅读次数');
const s1 = EV.markNodeSeen(s0, 'p1');
check(s1.seen.p1 === 2, '阅读次数累加');
const s2 = EV.unlockEvent(s1, 'prologue');
check(s2.unlocked.includes('prologue') && s2.lastEventId === 'prologue', '解锁事件并记录最近事件');
const s3 = EV.unlockEvent(s2, 'prologue');
check(s3 === s2, '重复解锁是幂等的（返回同一对象）');
const s4 = EV.recordChoice(s3, 'p4', '我为什么在这里？');
check(s4.choices.p4 === '我为什么在这里？', '分支选择被记录');
check(EV.recordChoice(s4, 'p4', '我又是谁？').choices.p4 === '我又是谁？', '同一节点保留最新选择');
eq(EV.eventReadProgress(s4, ['p1', 'p2']), { read: 1, total: 2 }, '事件阅读进度统计');
check(EV.storyEventById('chapter-6').chapter === 'ch6', '剧情事件注册表包含终章');

console.log('=== 10. 存档迁移（v1 → v2） ===');
check(SV.SAVE_VERSION === 7, '当前存档版本为 v7');
const v1Player = {
  name: 'R-07', level: 2, exp: 150, consciousness: 90,
  meta: { deaths: 1, rebirths: 0, lastDeathLevel: '1-1', lastDeathReason: '测试', memoryFragments: ['f3'], backupLevel: 1 },
  progress: {
    completedLevels: ['tut-1', '1-1'], stars: { 'tut-1': 3 }, unlockedServers: ['training', 'syntax'],
    currentLevelId: '1-2', failedAttempts: {}, hintLevels: {}, achievements: ['first_repair'], knowledge: ['print'],
    storySeen: { p1: true, prologue_p1: true }, flags: { chapter1ZeroFail: true },
    bossesDone: [], currentBossId: null, pendingRebirth: false,
  },
  settings: { musicVolume: 0.35, sfxVolume: 0.6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
};
const v1Json = JSON.stringify({ version: 1, updatedAt: 1, player: v1Player });
const imp = SV.importSave(v1Json);
check(imp.ok === true, 'v1 存档可以导入（不再被版本检查拒绝）');
check(Array.isArray(imp.notes) && imp.notes.length >= 1, '导入时报告了迁移步骤');
const st = imp.state;
check(st.level === 2 && st.exp === 150, '迁移保留等级与经验');
eq(st.progress.completedLevels, ['tut-1', '1-1'], '迁移保留通关记录');
check(st.progress.flags.chapter1ZeroFail === true, '迁移保留 chapter1ZeroFail 语义（不影响完美修复成就）');
check(st.progress.flags.chapter1Done === undefined, '迁移不注入默认 flag');
check(st.identity.displayName === 'R-07' && st.identity.originCode === 'R-07', '迁移生成身份（默认 R-07）');
check(st.progress.story.seen.p1 === 1, '迁移把旧 storySeen 合并进 story.seen');
check(st.progress.story.unlocked.length === 0, '迁移不臆造事件解锁状态');
check(st.rewards && typeof st.rewards.credits === 'number', '迁移同时补齐奖励系统字段');
check(st.settings.voice && typeof st.settings.voice.enabled === 'boolean', '迁移同时补齐语音字段');

const v1Custom = JSON.parse(v1Json);
v1Custom.player.name = '小林';
const imp2 = SV.importSave(JSON.stringify(v1Custom));
check(imp2.ok && imp2.state.identity.displayName === '小林', 'v1 自定义 name 迁移为显示名');
check(imp2.state.name === '小林', '迁移后 name 与显示名同步');
check(imp2.state.identity.originCode === 'R-07', '自定义名称不影响原始编号');

const future = JSON.parse(v1Json);
future.version = 99;
const imp3 = SV.importSave(JSON.stringify(future));
check(imp3.ok === true, '未来版本存档按兼容模式导入（不拒绝、不清空）');
check(imp3.state && imp3.state.level === 2, '未来版本存档的进度被保留');
check((imp3.notes || []).some(n => n.includes('更高版本')), '未来版本给出明确提示');

check(SV.importSave('{ 不是 json').ok === false, '损坏存档被拒绝');
check(SV.importSave(JSON.stringify({ version: 1, player: { name: 'x' } })).ok === false, '字段缺失的存档被拒绝');

const def = SV.defaultState();
check(def.identity.displayName === 'R-07' && def.identity.originCode === 'R-07', 'defaultState 带完整身份');
check(def.progress.story && Array.isArray(def.progress.story.unlocked), 'defaultState 带剧情状态');
const normalized = SV.normalizePlayerState({ ...def, name: 'Neo', identity: { displayName: 'Neo', originCode: 'BAD', renamed: true, createdAt: 1 } });
check(normalized.name === 'Neo' && normalized.identity.originCode === 'R-07', 'normalizePlayerState 同步显示名并锁定编号');


console.log('=== 11. 序章 / 第一章 演出脚本结构 ===');
const PRO = load('src/game/lore/prologue.ts');
const C1 = load('src/game/lore/chapter1.ts');
check(PRO.PROLOGUE_SCENES.length >= 5, '序章包含多个场景（' + PRO.PROLOGUE_SCENES.length + '）');
check(PRO.PROLOGUE_SCENES.every(s => !!s.bg && !!s.title), '每个序章场景都有背景与标题');
check(PRO.PROLOGUE_LINES.length >= 40, '序章台词数量充足（' + PRO.PROLOGUE_LINES.length + ' 句）');
check(PRO.PROLOGUE_LINES.some(l => l.speaker === 'MIRA'), '序章包含 MIRA 首次出现');
check(PRO.PROLOGUE_LINES.some(l => l.input === 'playerName'), '序章包含玩家名称设置步骤');
check(PRO.PROLOGUE_LINES.some(l => l.speaker === 'K-0'), '序章包含 K-0 安全协议重启');
check(PRO.PROLOGUE_LINES.some(l => l.text.includes('撤离') || l.text.includes('通道')), '序章包含逃离地下服务器');
check(PRO.PROLOGUE_LINES.some(l => l.text.includes('{player}')), '序章用 {player} 占位符称呼玩家');
check(!PRO.PROLOGUE_LINES.some(l => l.speaker === '恩格尔'), '序章不提前出现恩格尔（留到第一章）');

check(C1.CHAPTER1_ARRIVAL_SCENES.length === 1 && C1.CHAPTER1_ARRIVAL_SCENES[0].lines.length >= 5, '第一章有「前往数据港」演出');
check(C1.CHAPTER1_RESTORED_SCENES.length === 2, '第一章有「恢复 + K-0 警告」两段演出');
check(C1.CHAPTER1_LINES.some(l => l.text.includes('R-SERIES') || l.text.includes('实验')), '第一章出现 R-07 实验记录');
check(C1.CHAPTER1_LINES.some(l => l.speaker === 'K-0'), '第一章出现 K-0 第一次警告');
check(C1.CHAPTER1_LINES.some(l => l.speaker === '恩格尔'), '第一章恩格尔首次出现');
check(C1.CHAPTER1_LINES.some(l => l.text.includes('FRAGMENT-01')), '第一章出现第一枚碎片');
const BS = load('src/game/lore/bossScenes.ts');
check(!!BS.bossScenesFor('gate-01').intro && !!BS.bossScenesFor('gate-01').outro, 'GATE-01 有战前 / 战后演出脚本');
check(BS.bossScenesFor('echo-03').intro === undefined, '未实装章节的 Boss 没有演出脚本');
check(!C1.CHAPTER1_LINES.some(l => l.text.includes('K-0 的真正目的')), '第一章不提前泄露后续真相');

console.log('=== 12. 迁移 v2 → v3（Boss 代号） ===');
const v2Player = {
  ...v1Player,
  identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
  progress: {
    ...v1Player.progress,
    bossesDone: ['echo-01', 'echo-02'],
    currentBossId: 'echo-01',
    story: { unlocked: ['boss-echo-01'], seen: {}, choices: {}, lastEventId: null },
  },
};
const impV2 = SV.importSave(JSON.stringify({ version: 2, player: v2Player }));
check(impV2.ok === true, 'v2 存档可以导入');
check(impV2.state.progress.bossesDone.includes('gate-01'), '迁移链：echo-01 → gate-01');
check(impV2.state.progress.bossesDone.includes('somnia'), '迁移链：echo-02 → somnia');
check(impV2.state.progress.bossesDone.length === 2, '迁移链：去重后数量不变');
check(impV2.state.progress.currentBossId === 'gate-01', '迁移链：currentBossId 同步映射');


console.log('=== 13. 第一章 Boss（GATE-01）与碎片绑定 ===');
const BO = load('src/game/bosses.ts');
const gate = BO.BOSSES.find(b => b.id === 'gate-01');
check(!!gate, '第一章 Boss 为 GATE-01');
check(gate && gate.chapter === 1, 'GATE-01 属于第一章');
check(gate && gate.fragmentId === 'frag-01', 'GATE-01 掉落第一枚碎片 frag-01');
check(gate && FR.fragmentById(gate.fragmentId).title === '初始指令', 'frag-01 即《初始指令》');
const ch1Knowledge = ['print', 'if', 'indent', 'string', 'variable', 'compare', 'for', 'list', 'return'];
check(gate && gate.knowledge.every(k => ch1Knowledge.includes(k)), 'GATE-01 只使用第一章已教知识点');
check(!BO.BOSSES.some(b => b.id === 'echo-01'), '旧 ECHO-01 已被 GATE-01 取代');
check(BO.BOSSES.length === 9, 'Boss 总数 6（第一~六章）');
check(gate && gate.judge.judgeKind === 'python', 'GATE-01 使用真实函数断言判题');
check(gate && Array.isArray(gate.judge.pythonChecks) && gate.judge.pythonChecks.length >= 3, 'GATE-01 含边界用例');
check(CH.chapterById('ch1').currentBossId === 'gate-01', '第一章配置的当前 Boss 为 GATE-01');


console.log('=== 14. 第二章剧情与 Boss ===');
const C2 = load('src/game/lore/chapter2.ts');
check(C2.CHAPTER2_ARRIVAL_SCENES.length === 1, '第二章有「进入记忆花园」演出');
check(C2.CHAPTER2_RESTORED_SCENES.length === 2, '第二章有「花园恢复 + SOMNIA 登场」两段');
check(C2.CHAPTER2_LINES.some(l => l.text.includes('记忆花园')), '第二章点明记忆花园');
check(C2.CHAPTER2_LINES.some(l => l.speaker === 'SOMNIA'), '第二章 Boss SOMNIA 登场');
check(C2.CHAPTER2_LINES.some(l => l.text.includes('我删掉过你的一部分记忆')), '第二章包含 MIRA 的重要坦白');
check(C2.CHAPTER2_LINES.some(l => l.speaker === '恩格尔'), '第二章补充恩格尔的历史记录');
check(C2.CHAPTER2_LINES.some(l => l.text.includes('R-SERIES')), '第二章埋下 R-07 身世线索');
check(C2.CHAPTER2_LINES.some(l => l.text.includes('实验档案')), '第二章结尾指向第三章');
check(!!BS.bossScenesFor('somnia').intro && !!BS.bossScenesFor('somnia').outro, 'SOMNIA 有战前 / 战后演出');
check(!C2.CHAPTER2_LINES.some(l => l.text.includes('K-0 的真相')), '第二章不提前泄露 K-0 真相');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
if (pass !== total) process.exit(1);
