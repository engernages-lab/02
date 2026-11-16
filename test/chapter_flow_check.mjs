// V1.1.1 章节主线 / Boss 首胜事务 / 碎片绑定 / 原初核心 / 旧档继承 纯逻辑回归
// 不依赖浏览器：直接加载 TS 模块执行真实事务函数。
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function makeLoader() {
  const cache = new Map();
  const resolveFile = (base) => {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  };
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

const L = makeLoader();
const CF = L('src/game/chapterFlow.ts');
const SV = L('src/services/save.ts');
const B = L('src/game/battle.ts');
const BS = L('src/game/bosses.ts');
const CH = L('src/game/lore/chapters.ts');
const F = L('src/game/lore/fragments.ts');
const LV = L('src/game/levels.ts');

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => check(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const fresh = () => SV.defaultState();
const clone = (x) => JSON.parse(JSON.stringify(x));

function proveBattle(player, bossId, { tamper = false } = {}) {
  const def = B.battleFor(bossId);
  const st = B.createBattleState(def);
  def.phases.forEach((p, i) => {
    st.phaseMask[i] = tamper ? 0 : B.fullMask(B.phaseCheckCount(p));
  });
  st.hp = tamper ? 100 : 0;
  st.phase = tamper ? 0 : def.phases.length;
  st.cleared = !tamper;
  st.updatedAt = 1;
  player.progress.battles = { ...(player.progress.battles || {}), [bossId]: st };
  return player;
}

function finishLevels(player, chapterOrder) {
  const ch = CH.CHAPTERS.find(c => c.order === chapterOrder);
  const ids = LV.levelsOfServer(ch.serverId).map(l => l.id);
  player.progress.completedLevels = [...new Set([...player.progress.completedLevels, ...ids])];
  player.progress.flags[ch.doneFlag] = true;
  return player;
}

console.log('=== 1. Boss ↔ 碎片唯一绑定 ===');
const binding = CF.bossFragmentBinding();
check(binding.length === 6, '六章各有唯一 Boss');
eq(binding.map(x => x.bossId), ['gate-01', 'somnia', 'index-0', 'judgment-4', 'entropy', 'k0'], 'Boss id 固定');
eq(binding.map(x => x.shardCode), ['SHARD-01', 'SHARD-02', 'SHARD-03', 'SHARD-04', 'SHARD-05', 'SHARD-06'], '碎片编号固定');
eq(binding.map(x => x.fragmentId), ['frag-01', 'frag-02', 'frag-03', 'frag-04', 'frag-05', 'frag-06'], '碎片 id 固定');
check(new Set(binding.map(x => x.fragmentId)).size === 6, '每枚碎片只属于一个 Boss');
binding.forEach((x, i) => {
  const boss = BS.bossById(x.bossId);
  check(!!boss && boss.fragmentId === x.fragmentId, '第 ' + (i + 1) + ' 章 Boss 守护自己的碎片');
  check(!!F.fragmentById(x.fragmentId) && F.fragmentById(x.fragmentId).bossId === x.bossId, '碎片表 bossId 与章节一致');
});

console.log('=== 2. 新游戏只能进入第一章 ===');
let p = fresh();
let g1 = CF.chapterGate(p, 'ch1');
check(g1.status === 'AVAILABLE' && g1.enterable, '第一章初始可进入');
for (const ch of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6']) {
  const g = CF.chapterGate(p, ch);
  check(g.status === 'LOCKED' && !g.enterable, ch + ' 初始锁定');
  check(g.blockedReason.includes('Boss'), ch + ' 锁定提示包含 Boss 条件', g.blockedReason);
}
check(!CF.canEnterServer(p, 'logs').ok, '第二章区域不能直接进入');
check(!CF.canEnterServer(p, 'storage').ok, '第三章区域不能直接进入');
check(!CF.bossGate(p, 'gate-01').available, '普通关卡未完成时 Boss 不可挑战');
check(!CF.bossGate(p, 'somnia').available, '上一章 Boss 未首胜时下一章 Boss 不可挑战');

console.log('=== 3. 第一章：必须真实击败 Boss 才解锁第二章 ===');
finishLevels(p, 1);
g1 = CF.chapterGate(p, 'ch1');
check(g1.status === 'BOSS_REQUIRED', '普通关卡完成后显示 BOSS REQUIRED');
check(CF.bossGate(p, 'gate-01').available, 'GATE-01 开放');
check(!CF.chapterGate(p, 'ch2').unlocked, '未击败 Boss 时第二章仍锁定');

// 只点按钮 / 无战斗记录不能胜利
let r = CF.handleBossFirstClear(p, 'gate-01', { now: 1000 });
check(!r.changed && !r.payload, '没有真实战斗记录不能首胜');
check(!p.meta.memoryFragments.includes('frag-01'), '未胜利不发放碎片');

// 伪造血量归零但测试位为空 → 仍然拒绝
let fake = clone(p);
proveBattle(fake, 'gate-01', { tamper: true });
r = CF.handleBossFirstClear(fake, 'gate-01', { now: 1000 });
check(!r.changed, '只有血量归零、测试未通过仍不能首胜（禁止改血量）', r.reason);
check(!fake.meta.memoryFragments.includes('frag-01'), '伪造战斗不发放碎片');
check(CF.verifyBossVictory(fake, 'gate-01').ok === false, 'verifyBossVictory 拒绝不完整掩码');

// 真实全阶段通过 → 首胜事务
proveBattle(p, 'gate-01');
r = CF.handleBossFirstClear(p, 'gate-01', { now: 2000 });
check(r.changed && r.payload, '真实战斗胜利 → 首胜事务执行');
p = r.player;
eq(r.payload.shardCode, 'SHARD-01', '发放第一枚碎片 SHARD-01');
check(p.meta.memoryFragments.includes('frag-01'), '碎片写入存档');
check(p.progress.chapters.ch1.bossDefeated && p.progress.chapters.ch1.completed, '章节首胜 + 完成状态写入');
check(p.progress.chapters.ch1.bossClearSource === 'battle', '来源记录为真实战斗');
check(p.progress.chapters.ch1.bossFirstClearAt === 2000, '记录首次击败时间');
check(p.meta.fragmentLog['frag-01'] === 2000, '记录碎片获取时间');
check(CF.chapterGate(p, 'ch2').unlocked, '第二章已解锁');
check(CF.canEnterServer(p, 'logs').ok, '数据日志中心已开放');
check(p.progress.unlockedServers.includes('logs'), '旧字段 unlockedServers 同步开放');
check(p.progress.bossesDone.includes('gate-01'), 'bossesDone 兼容字段同步');
check(r.payload.nextChapterId === 'ch2' && r.payload.nextChapterUnlocked, '返回下一章解锁信息');

// 幂等：重复提交
const fragCount = p.meta.memoryFragments.length;
const credits = p.rewards.credits;
const exp = p.exp;
r = CF.handleBossFirstClear(p, 'gate-01', { now: 3000 });
check(!r.changed && !r.payload, '重复首胜被拒绝（幂等）');
check(p.meta.memoryFragments.length === fragCount, '重复提交不重复发碎片');
check(p.rewards.credits === credits && p.exp === exp, '重复提交不重复发经验/贡献点');

console.log('=== 4. 六章完整主线（真实胜利事务） ===');
let expectedFragments = ['frag-01'];
for (let order = 2; order <= 6; order++) {
  const ch = CH.CHAPTERS.find(c => c.order === order);
  check(CF.chapterGate(p, ch.id).unlocked, '第 ' + order + ' 章在上一章完成后解锁');
  const bossId = ch.currentBossId;
  if (order <= 5) {
    check(!CF.bossGate(p, bossId).available, '第 ' + order + ' 章普通关卡未完成时 Boss 不可挑战');
    finishLevels(p, order);
    check(CF.bossGate(p, bossId).available, '第 ' + order + ' 章普通关卡完成后 Boss 开放');
  } else {
    finishLevels(p, 6);
    const core = CF.originCoreGate(p);
    check(core.unlocked && core.ownedCount === 5, '第六章：前五枚碎片齐全 → 原初核心开放');
    check(CF.bossGate(p, 'k0').available, '原初核心开放后 K-0 可挑战');
  }
  proveBattle(p, bossId);
  const rr = CF.handleBossFirstClear(p, bossId, { now: 4000 + order });
  check(rr.changed && rr.payload, '第 ' + order + ' 章 Boss 真实首胜');
  p = rr.player;
  expectedFragments.push(ch.fragmentId);
  eq(F.ownedFragments(p.meta.memoryFragments), expectedFragments, '第 ' + order + ' 章碎片按顺序归位');
  check(p.progress.chapters[ch.id].completed, '第 ' + order + ' 章标记完成');
}
check(F.finalMemoryUnlocked(p.meta.memoryFragments), '六枚碎片齐备 → 最终记忆解锁');
check(p.progress.flags.chapter6Done === true, 'K-0 首胜写入 chapter6Done');
check(p.progress.flags.gameCompleted === true, 'K-0 首胜写入 gameCompleted');
check(p.progress.originCore.clearedAt === 4006, '原初核心记录 K-0 首胜时间');
check(CF.nextChapterUnlocked(p, 'ch6') === false, '第六章之后没有下一章');

console.log('=== 5. 原初核心：第六章开放 与 原初核心开放 独立 ===');
let coreP = clone(p);
// 拿走第五枚碎片（其余章节状态保留）：第六章可由旧档入口进入，但原初核心必须锁死
coreP.meta.memoryFragments = coreP.meta.memoryFragments.filter(x => x !== 'frag-05');
coreP.progress.unlockedServers = [...new Set([...coreP.progress.unlockedServers, 'core'])];
let coreGate = CF.originCoreGate(coreP);
check(!coreGate.unlocked, '只有四枚碎片时原初核心锁定', coreGate.reason);
check(coreGate.missing.some(x => x.fragmentId === 'frag-05'), '缺失项明确指向 SHARD-05');
check(!CF.bossGate(coreP, 'k0').available, '原初核心锁定 → 不能触发 K-0');
// 恢复第五枚：仍未击败 K-0 → 原初核心开放但终章未完成
coreP.meta.memoryFragments.push('frag-05');
coreGate = CF.originCoreGate(coreP);
check(coreGate.unlocked, '前五枚齐全 → 原初核心开放');
check(F.hasFragment(coreP.meta.memoryFragments, 'frag-06'), '第六枚已由 K-0 首胜获得');
// 第六枚未获取的场景
const fiveP = clone(coreP);
fiveP.meta.memoryFragments = fiveP.meta.memoryFragments.filter(x => x !== 'frag-06');
check(CF.originCoreGate(fiveP).unlocked, '无第六枚也可进入原初核心（只校验前五枚）');
check(!F.finalMemoryUnlocked(fiveP.meta.memoryFragments), '无第六枚 → 最终记忆未解锁');

console.log('=== 6. 旧存档继承：demo v1（第一~五章已完成，无 Boss 记录） ===');
const demoRaw = readFileSync(join(root, 'demo-save-ch1-5.json'), 'utf8');
const demo = SV.importSave(demoRaw);
check(demo.ok, 'demo 存档可导入');
const dp = demo.state;
check(dp.progress.completedLevels.length === 26, '保留已完成的普通关卡');
check(dp.level === 8 && dp.exp === 2260, '保留等级与经验');
check(dp.progress.achievements.includes('chapter5_done'), '保留成就');
check((dp.progress.migrationAudit?.inheritedChapters || []).length === 5, '审计记录继承 5 章', JSON.stringify(dp.progress.migrationAudit));
check(dp.progress.chapters.ch1.bossClearSource === 'legacy-inherit', '继承来源标记为历史进度继承，不伪装成真实战斗');
check(dp.progress.chapters.ch5.completed, '第五章按历史进度完成');
for (const f of ['frag-01', 'frag-02', 'frag-03', 'frag-04', 'frag-05']) {
  check(F.hasFragment(dp.meta.memoryFragments, f), '历史进度补齐碎片 ' + f);
}
check(!dp.progress.chapters.ch6.completed, '第六章未完成（必须真实击败 K-0）');
check(!dp.progress.chapters.ch6.bossDefeated, 'K-0 没有被继承击败');
check(CF.canEnterServer(dp, 'core').ok, '旧档不会被锁回已解锁的第六章区域');
check(CF.originCoreGate(dp).ownedCount === 5, '前五枚碎片齐全（frag-06 来自旧 id 兼容，不参与补发）');
// 再次规范化：幂等，不重复补发
const dp2 = SV.normalizePlayerState(clone(dp), 1);
eq(F.ownedFragments(dp2.meta.memoryFragments), F.ownedFragments(dp.meta.memoryFragments), '重复迁移不重复发碎片');
check((dp2.progress.migrationAudit?.grantedFragments || []).length === 5, '审计记录不重复累积');

console.log('=== 7. 旧存档保护：仅解锁下一章但未推进 → 不伪造 Boss 首胜 ===');
const e2eStyle = JSON.stringify({
  version: 6, updatedAt: 1,
  player: {
    name: 'R-07', level: 3, exp: 390, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: [], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'],
      stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      vault: { read: [], finalSeen: false, lastOpened: null },
      flags: { chapter1Done: true }, bossesDone: [], battles: {}, currentBossId: null, pendingRebirth: false,
    },
    settings: { musicVolume: .3, sfxVolume: .6, animations: true, animLevel: 'high', typewriterMs: 20, fullscreen: false, lang: 'zh' },
  },
});
const es = SV.importSave(e2eStyle);
check(es.ok, '仅解锁下一章的旧档可导入');
check(!es.state.progress.chapters.ch1.bossDefeated, '未推进到第二章 → 不继承 Boss 首胜');
check(!es.state.meta.memoryFragments.includes('frag-01'), '不伪造碎片');
check(CF.bossGate(es.state, 'gate-01').available, 'GATE-01 仍需玩家真实挑战');
check(CF.canEnterServer(es.state, 'logs').ok, '旧档已解锁的第二章区域不被锁回');
check(CF.canEnterServer(es.state, 'logs').legacy === true, '第二章标记为旧版解锁（需补打 Boss）');
check(!CF.chapterGate(es.state, 'ch3').unlocked, '不能借旧字段再往第三章推进');

console.log('=== 8. 已有 Boss 首胜记录：直接迁移且不降级 ===');
const legacyBoss = JSON.stringify({
  version: 5, updatedAt: 1,
  player: {
    name: 'R-07', identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 4, exp: 600, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, lastDeathLevel: null, lastDeathReason: null, memoryFragments: ['frag-01'], fragmentLog: {}, backupLevel: 1 },
    progress: {
      completedLevels: ['tut-1', '1-1', '1-2', '1-3', '1-4', '1-5'], stars: {}, unlockedServers: ['training', 'syntax', 'logs'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      vault: { read: [], finalSeen: false, lastOpened: null },
      flags: { chapter1Done: true }, bossesDone: ['gate-01'], battles: {}, currentBossId: null, pendingRebirth: false,
    },
    rewards: { credits: 0, trust: 10, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] },
    settings: { musicVolume: .35, sfxVolume: .6, animations: true, animLevel: 'high', typewriterMs: 26, fullscreen: false, lang: 'zh' },
  },
});
const lb = SV.importSave(legacyBoss);
check(lb.ok, 'Boss 首胜旧档可导入');
check(lb.state.progress.chapters.ch1.bossDefeated, '已有 Boss 首胜记录直接迁移');
check(lb.state.progress.chapters.ch1.bossClearSource === 'battle', '保留真实战斗来源');
check(lb.state.progress.chapters.ch1.completed, '关卡齐全时章节直接完成（不降级）');
check(CF.chapterGate(lb.state, 'ch2').unlocked, '第二章保持解锁');
eq(F.ownedFragments(lb.state.meta.memoryFragments), ['frag-01'], '碎片不重复发放');

console.log('=== 9. 章节状态机 ===');
const s = fresh();
eq(CF.chapterGate(s, 'ch1').status, 'AVAILABLE', '初始 AVAILABLE');
finishLevels(s, 1);
eq(CF.chapterGate(s, 'ch1').status, 'BOSS_REQUIRED', '关卡完成 BOSS_REQUIRED');
proveBattle(s, 'gate-01');
const sr = CF.handleBossFirstClear(s, 'gate-01', { now: 9 });
eq(CF.chapterGate(sr.player, 'ch1').status, 'COMPLETED', '首胜后 COMPLETED');
eq(CF.chapterGate(sr.player, 'ch2').status, 'AVAILABLE', '下一章 AVAILABLE');
const s3 = fresh();
s3.progress.completedLevels.push('2-1');
const s4 = SV.normalizePlayerState(clone(s3), 1);
check(CF.chapterGate(s4, 'ch2').status === 'LOCKED', '没有第一章 Boss 首胜时，第二章不会因为关卡数据出现而开放');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
