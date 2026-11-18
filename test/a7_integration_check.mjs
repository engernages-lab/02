// A7 跨模块联调（纯逻辑）：挑战会话 → 经济结算 → 账本 → 购买 → 道具 → 碎片/难度一次性奖励
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
const cache = new Map();
function load(file) {
  const abs = extname(file) ? file : existsSync(file + '.ts') ? file + '.ts' : file;
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = readFileSync(abs, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  cache.set(abs, mod);
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
  return mod.exports;
}
const L = (rel) => load(join(root, rel));

const CS = L('src/game/challengeSession.ts');
const E = L('src/game/economy.ts');
const EC = L('src/game/economyConfig.ts');
const R = L('src/game/rewards.ts');
const TX = L('src/game/shopTx.ts');
const S = L('src/game/shop.ts');
const P = L('src/game/progression.ts');
const CF = L('src/game/chapterFlow.ts');
const FR = L('src/game/lore/fragments.ts');
const M = L('src/services/migrations.ts');
const SV = L('src/services/save.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

function player(over = {}) {
  return {
    name: 'R-07',
    identity: { displayName: 'R-07', originCode: 'R-07', renamed: false, createdAt: 1 },
    level: 5, exp: 1000, consciousness: 100,
    meta: { deaths: 0, rebirths: 0, memoryFragments: [], memoryLogs: [], fragmentLog: {}, lastDeathLevel: null, lastDeathReason: null },
    progress: {
      completedLevels: ['tut-1'], stars: {}, unlockedServers: ['training', 'syntax'], currentLevelId: null,
      failedAttempts: {}, hintLevels: {}, achievements: [], knowledge: [],
      storySeen: {}, story: { unlocked: [], seen: {}, choices: {}, lastEventId: null },
      flags: {}, bossesDone: [], currentBossId: null, pendingRebirth: false, challengeSessions: {},
    },
    rewards: R.normalizeRewards({ credits: 500, trust: 20, items: {}, skins: [], equipped: {}, chapterRewards: [], cleared: {}, archiveRead: [] }),
    settings: { musicVolume: 0, sfxVolume: 0, animations: false, animLevel: 'low', typewriterMs: 1, fullscreen: false, lang: 'zh' },
    ...over,
  };
}

console.log('=== A. 挑战 → 会话 → 经济结算 → 账本 ===');
{
  let s = CS.createSession('1-1', 'level', 1000, 3);
  s = CS.countRun(CS.countSubmit(CS.countRun(s)));
  s = CS.countError(s);
  const reward = E.computeLevelRewardV2({
    levelExp: 60, fails: 1, hints: 0, firstClear: true, prevStars: 0, newStars: 2,
  });
  const st = CS.buildPassedSettlement(s, {
    now: 1000 + 65_000, levelBefore: 5, levelAfter: 6, expBefore: 1000, expAfter: 1060, creditsGained: reward.total,
  });
  const settled = CS.settle(s, st);
  ok(reward.total === 72, '首通 A 评级（1 次失误）收益 72', String(reward.total));
  ok(st.result === 'passed' && st.durationMs === 65000 && st.runs === 2 && st.submits === 1 && st.errors === 1, '结算统计与会话一致');
  ok(st.expGained === 60 && st.levelAfter === 6, '经验与等级进入结算');
  ok(settled.status === 'passed' && CS.settle(settled, st) === settled, '结算只写一次（幂等）');

  let rw = R.normalizeRewards(player().rewards);
  let ledger = E.appendLedger(rw.ledger, { kind: 'level', ref: '1-1', credits: reward.total, exp: 60, at: 2000 });
  const again = E.appendLedger(ledger, { kind: 'level', ref: '1-1', credits: reward.total, exp: 60, at: 3000 });
  ok(again === ledger && ledger.length === 1, '账本阻止同一首通重复入账');
  rw = R.normalizeRewards({ ...rw, credits: rw.credits + reward.total, ledger });
  ok(rw.credits === 572 && rw.ledger.length === 1, '奖励入账后余额与流水一致', String(rw.credits));
}

console.log('=== B. 购买 → 库存 → 道具效果 ===');
{
  let p = player();
  const buy = TX.purchaseItem(p, 'shield-core', 1, 'rq-a7-1', 3000);
  ok(buy.ok && buy.charged === 60, '购买护盾扣 60', String(buy.charged));
  ok(buy.player.rewards.items['shield-core'] === 1 && buy.player.rewards.transactions.length === 1, '库存与交易记录同时写入');
  const use = TX.useItem(buy.player, 'shield-core', 3001);
  ok(use.ok && use.player.rewards.buffs.shield === 1, '使用后获得 1 层护盾');
  ok(use.player.rewards.items['shield-core'] === 0, '库存正确扣减');
  const useAgain = TX.useItem(use.player, 'shield-core', 3002);
  ok(!useAgain.ok && useAgain.reason === '背包中没有该道具', '库存耗尽不能重复使用');
  const balanceAfter = use.player.rewards.credits + 60;
  ok(balanceAfter === 500, '购买回滚校验：500-60+60=500');
}

console.log('=== C. 经验增幅接入成长 ===');
{
  const base = 60;
  const boosted = Math.round(base * EC.ECONOMY.expBoost.mult);
  ok(boosted === 90, '首通经验 60 ×1.5 = 90');
  ok(P.levelForExp(2700 + boosted) === 10 && P.levelForExp(2700 + base) === 9, '增幅可以改变升级节点');
  const buffs = R.normalizeRewards({ buffs: { expBoost: { uses: 2, mult: 1.5 } } }).buffs;
  ok(buffs.expBoost.uses === 2, '增幅次数持久化');
  const capped = R.normalizeRewards({ buffs: { expBoost: { uses: 9, mult: 1.5 } } }).buffs;
  ok(capped.expBoost.uses === 3, '增幅次数上限 3');
}

console.log('=== D. 碎片系统（原有规则不变） ===');
{
  const listed = ['frag-01', 'frag-01', 'frag-03'];
  const owned = FR.ownedFragments(listed);
  ok(owned.length === 2, '碎片去重计数', String(owned.length));
  ok(FR.hasFragment(listed, 'frag-03') === true && FR.hasFragment(listed, 'frag-05') === false, '碎片拥有判断正确');
  const prog = FR.fragmentProgress(listed);
  ok(prog.owned === 2 && prog.total === FR.CREATOR_FRAGMENTS.length, '创作者碎片进度正确', JSON.stringify(prog));
  const legacyId = FR.CREATOR_FRAGMENTS[0].legacyIds[0];
  const legacy = FR.fragmentForLegacyId(legacyId);
  ok(!!legacy && legacy.id === 'frag-01', '旧碎片 id 仍可映射', legacyId);
  ok(FR.canReceiveFragment(listed, 'frag-01') === false, '已拥有碎片不可重复领取');
  ok(FR.canReceiveFragment(listed, 'frag-02') === true, '未拥有碎片可领取');
}

console.log('=== E. Boss 难度奖励一次性 ===');
{
  const p = player();
  const first = CF.recordBossDifficultyClear(p, 'gate-01', 'hard', { now: 1000, grantRewards: true });
  ok(first.firstTime === true && first.credits > 0 && first.exp > 0, 'Hard 首次通关有一次性奖励', JSON.stringify({ c: first.credits, e: first.exp }));
  const second = CF.recordBossDifficultyClear(first.player, 'gate-01', 'hard', { now: 2000, grantRewards: true });
  ok(second.firstTime === false && second.credits === 0 && second.exp === 0, '同一难度重复通关不再发奖');
  const expert = CF.recordBossDifficultyClear(second.player, 'gate-01', 'expert', { now: 3000, grantRewards: true });
  ok(expert.credits > first.credits, 'Expert 奖励高于 Hard');
}

console.log('=== F. 迁移 → 购买 → 结算 全链路 ===');
{
  const raw = {
    version: 6,
    player: player({ exp: 1000, rewards: R.normalizeRewards({ credits: 300 }) }),
  };
  const migrated = SV.normalizePlayerState(M.migrateSave(raw).player, 6);
  ok(migrated.exp === 1000 && migrated.rewards.credits === 300, '迁移后数值保持');
  const buy = TX.purchaseItem(migrated, 'nano-restore', 1, 'rq-a7-2', 4000);
  ok(buy.ok && buy.player.rewards.credits === 160, '迁移后购买扣费正确', String(buy.player.rewards.credits));
  const use = TX.useItem({ ...buy.player, consciousness: 50 }, 'nano-restore', 4001);
  ok(use.ok && use.player.consciousness === 80, '购买的道具立即生效（50→80）');
  const normalized = SV.normalizePlayerState(use.player, 10);
  ok(normalized.rewards.credits === 160 && normalized.consciousness === 80 && (normalized.rewards.items['nano-restore'] || 0) === 0, '再规范化后数据一致', JSON.stringify({ c: normalized.rewards.credits, h: normalized.consciousness, i: normalized.rewards.items }));
  ok(normalized.rewards.transactions.length === 1 && normalized.rewards.transactions[0].status === 'ok', '交易记录随存档保留');
}

console.log('=== G. 失败与复活的资源状态 ===');
{
  const p = player({ consciousness: 20, rewards: R.normalizeRewards({ credits: 0 }) });
  const dead = SV.normalizePlayerState({ ...p, consciousness: 0 }, 10);
  ok(dead.consciousness === 0 && dead.rewards.credits === 0, '死亡状态不产生负资产');
  const reborn = SV.normalizePlayerState({ ...dead, consciousness: 70 }, 10);
  ok(reborn.consciousness === 70 && reborn.level === P.levelForExp(reborn.exp), '重生恢复 70% 且等级一致');
  ok(Number.isFinite(reborn.rewards.credits) && reborn.rewards.credits >= 0, '复活后货币合法');
}

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
