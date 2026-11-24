// V1.3-B.2 Boss 攻击引擎专项：状态机 / 模式 / 预警 / 防御 / 闪避 / 伤害 / 冷却 / 阶段 / 自愈
// 执行：node test/boss_attack_engine.test.mjs
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

const cache = new Map();
function load(file) {
  const abs = file;
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = readFileSync(abs, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  cache.set(abs, mod);
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => {
    const base = join(dirname(abs), sp);
    const cand = existsSync(base) && extname(base) ? base : existsSync(base + '.ts') ? base + '.ts' : base + '/index.ts';
    return load(cand);
  });
  return mod.exports;
}
const L = (rel) => load(join(root, rel));
const E = L('src/game/bossAttackEngine.ts');

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, JSON.stringify(a) + ' !== ' + JSON.stringify(b));

const T0 = 1_800_000_000_000;

function pattern(over = {}) {
  return {
    attackId: 'pulse', attackName: '数据脉冲', attackType: 'single', description: 'test',
    damage: 10, warningDuration: 1000, cooldown: 5000, attackDuration: 0,
    hitCount: 1, hitIntervalMs: 0, recoveryDuration: 300, difficulty: 'easy',
    dodgeWindow: 300, defenseRequirement: 'timed', defenseReduction: 0.5, defenseWindow: 1500,
    phaseRestriction: [0], target: 'player', visualEffect: 'pulse', audioEffect: 'threat',
    dangerLevel: 1,
    ...over,
  };
}
function ctx(now, over = {}) {
  return {
    now, phaseId: 'bp1', phaseIndex: 0, battleActive: true, eventBlocked: false,
    playerHp: 100, damageScale: 1, rng: () => 0.1,
    ...over,
  };
}
const create = (opts = {}) => E.createBossAttackState('b1', 'boss', 'bp1', 0, T0, { nextAttackAt: T0 + 10, ...opts });

/** 推进到预警中，返回 state 与预警开始时间 */
function toTelegraph(p, ctxx = ctx(T0 + 20)) {
  const step = E.tickBossAttack(create(), [p], ctxx);
  return { state: step.state, events: step.events, damages: step.damages };
}
/** 从 idle 直接跑到第一次命中 */
function toHit(p) {
  const tel = toTelegraph(p);
  const telEnd = tel.state.telegraphEndsAt;
  const hit = E.tickBossAttack(tel.state, [p], ctx(telEnd));
  return { tel, hit };
}

// ================= 16.1 状态机 =================
console.log('=== 16.1 攻击状态机 ===');
{
  const p = pattern();
  const idle = create();
  ok(idle.attackState === 'idle', '创建后为 idle');
  const selected = E.selectAttack(idle, [p], T0 + 20);
  ok(selected.changed && selected.state.attackState === 'selecting', 'idle → selecting');
  const tel = E.startTelegraph(selected.state, T0 + 21);
  ok(tel.changed && tel.state.attackState === 'telegraph', 'selecting → telegraph');
  const telEnd = tel.state.telegraphEndsAt;
  const attack = E.tickBossAttack(tel.state, [p], ctx(telEnd));
  ok(attack.state.attackState === 'resolving' && attack.damages.length === 1, 'telegraph → attacking → resolving（命中一次）');
  const resolvingEnd = attack.state.attackEndsAt;
  const cool = E.tickBossAttack(attack.state, [p], ctx(resolvingEnd));
  ok(cool.state.attackState === 'cooldown', 'resolving → cooldown');
  const coolEnd = cool.state.cooldownEndsAt;
  const backIdle = E.tickBossAttack(cool.state, [p], ctx(coolEnd));
  ok(backIdle.state.attackState === 'idle', 'cooldown → idle');

  ok(E.canTransitionAttack('idle', 'selecting') && !E.canTransitionAttack('telegraph', 'cooldown'), '合法转换表正确');
  ok(E.selectAttack({ ...idle, attackState: 'telegraph' }, [p], T0 + 30).changed === false, '重复选择攻击被拒绝');
  const cancelled = E.cancelAttack(tel.state, T0 + 40, 'test');
  ok(cancelled.changed && cancelled.state.attackState === 'cancelled', 'telegraph → cancelled');
  const interrupted = E.interruptAttack(attack.state, T0 + 50, 'test');
  ok(interrupted.changed && interrupted.state.attackState === 'interrupted', 'attacking → interrupted');
  ok(E.startTelegraph(idle, T0 + 60).changed === false, '没有待预警攻击时 startTelegraph 被拒绝');
}

// ================= 16.2 攻击模式 =================
console.log('=== 16.2 攻击模式 ===');
{
  const single = pattern({ attackId: 's', attackType: 'single' });
  const multi = pattern({ attackId: 'm', attackType: 'multi', damage: 3, hitCount: 3, hitIntervalMs: 500 });
  const aoe = pattern({ attackId: 'a', attackType: 'aoe', damage: 8, warningDuration: 500 });
  const delayed = pattern({ attackId: 'd', attackType: 'delayed', attackDuration: 800, warningDuration: 500 });
  const special = pattern({ attackId: 'x', attackType: 'special', defenseRequirement: 'none', defenseReduction: 0 });

  const sHit = toHit(single).hit;
  ok(sHit.damages.length === 1 && sHit.damages[0].amount === 10, '单体攻击：一次命中');

  const mTel = toTelegraph(multi);
  const m1 = E.tickBossAttack(mTel.state, [multi], ctx(mTel.state.telegraphEndsAt));
  ok(m1.state.attackState === 'attacking' && m1.damages.length === 1, '连续攻击：第一次命中后进入 attacking');
  const m2 = E.tickBossAttack(m1.state, [multi], ctx(m1.state.nextHitAt));
  ok(m2.damages.length === 1, '连续攻击：第二次命中');
  const m3 = E.tickBossAttack(m2.state, [multi], ctx(m2.state.nextHitAt));
  ok(m3.state.attackState === 'resolving' && m3.damages.length === 1, '连续攻击：第三次命中后结算');
  ok(m1.damages[0].amount + m2.damages[0].amount + m3.damages[0].amount === 9, '连续攻击总伤害 9');

  const aHit = toHit(aoe).hit;
  ok(aHit.damages[0].amount === 8, '范围攻击正常结算');

  const dTel = toTelegraph(delayed);
  const dStart = E.tickBossAttack(dTel.state, [delayed], ctx(dTel.state.telegraphEndsAt));
  ok(dStart.state.attackState === 'attacking' && dStart.damages.length === 0, '延迟攻击：预警结束后不立即命中');
  const dHit = E.tickBossAttack(dStart.state, [delayed], ctx(dStart.state.nextHitAt));
  ok(dHit.damages.length === 1, '延迟攻击：延迟结束后命中');

  const xTel = toTelegraph(special);
  const xDef = E.playerDefend(xTel.state, xTel.state.telegraphStartedAt + 100);
  ok(!xDef.ok, '特殊攻击（defenseRequirement=none）无法防御');
  const xDodge = E.playerDodge(xTel.state, xTel.state.telegraphEndsAt - 100);
  const xHit = E.tickBossAttack(xDodge.state, [special], ctx(xTel.state.telegraphEndsAt));
  ok(xHit.damages[0].result === 'dodged' && xHit.damages[0].amount === 0, '特殊攻击可通过闪避规避');
}

// ================= 16.3 预警 =================
console.log('=== 16.3 预警 ===');
{
  const p = pattern();
  const tel = toTelegraph(p);
  ok(tel.state.attackState === 'telegraph', '预警开始');
  ok(tel.events.some(e => e.type === E.BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH), '预警事件');
  ok(tel.state.telegraphEndsAt - tel.state.telegraphStartedAt === 1000, '预警倒计时时长正确');
  ok(E.attackRemainingMs(tel.state, tel.state.telegraphStartedAt + 400) === 600, '剩余时间计算正确');
  const tooEarly = E.tickBossAttack(tel.state, [p], ctx(tel.state.telegraphStartedAt + 500));
  ok(tooEarly.damages.length === 0 && tooEarly.state.attackState === 'telegraph', '预警未结束时不会命中');
  const cancelled = E.cancelAttack(tel.state, tel.state.telegraphStartedAt + 300, 'player-left');
  ok(cancelled.state.attackState === 'cancelled' && cancelled.damages.length === 0, '取消预警不造成伤害');
  const phaseChanged = E.tickBossAttack(tel.state, [p], ctx(tel.state.telegraphStartedAt + 300, { phaseId: 'bp2', phaseIndex: 1 }));
  ok(phaseChanged.state.attackState === 'idle' && phaseChanged.state.phaseIndex === 1, '切换阶段时取消预警并同步阶段');
}

// ================= 16.4 防御 =================
console.log('=== 16.4 玩家防御 ===');
{
  const p = pattern();
  const tel = toTelegraph(p);
  const def = E.playerDefend(tel.state, tel.state.telegraphEndsAt - 200);
  ok(def.ok && def.state.playerResponse === 'defend', '预警期间可防御');
  const guardActive = E.tickBossAttack(def.state, [p], ctx(tel.state.telegraphEndsAt));
  ok(guardActive.damages[0].result === 'blocked' && guardActive.damages[0].amount === 5, '防御成功：减伤 50%（10→5）');
  const repeat = E.playerDefend(def.state, tel.state.telegraphEndsAt - 100);
  ok(!repeat.ok && repeat.reason === '防御冷却中', '重复防御被冷却拒绝');

  const earlyTel = toTelegraph(pattern({ defenseWindow: 300 }));
  const earlyDef = E.playerDefend(earlyTel.state, earlyTel.state.telegraphStartedAt + 100);
  const earlyHit = E.tickBossAttack(earlyDef.state, [p], ctx(earlyTel.state.telegraphEndsAt));
  ok(earlyHit.damages[0].result === 'hit' && earlyHit.damages[0].amount === 10, '过早防御（姿态已结束）仍然命中');

  const late = E.playerDefend(create(), T0 + 100);
  ok(!late.ok, '没有攻击时不能防御');
  const afterHit = E.playerDefend(guardActive.state, T0 + 9999);
  ok(!afterHit.ok, '攻击结算后不能防御');

  const cleanTel = toTelegraph(p);
  const cleanDef = E.playerDefend(cleanTel.state, cleanTel.state.telegraphEndsAt - 200);
  const cleanHit = E.tickBossAttack(cleanDef.state, [p], ctx(cleanTel.state.telegraphEndsAt));
  const coolEnd = cleanHit.state.attackEndsAt;
  const afterCool = E.tickBossAttack(cleanHit.state, [p], ctx(coolEnd));
  ok(afterCool.state.guardUntil != null && afterCool.state.attackState === 'cooldown', '防御状态随攻击结束进入冷却（不残留）');
}

// ================= 16.5 闪避 =================
console.log('=== 16.5 玩家闪避 ===');
{
  const p = pattern({ dodgeWindow: 400 });
  const tel = toTelegraph(p);
  const dodge = E.playerDodge(tel.state, tel.state.telegraphEndsAt - 200);
  const dodged = E.tickBossAttack(dodge.state, [p], ctx(tel.state.telegraphEndsAt));
  ok(dodged.damages[0].result === 'dodged' && dodged.damages[0].amount === 0, '闪避窗口内成功闪避');
  const repeat = E.playerDodge(dodge.state, tel.state.telegraphEndsAt - 100);
  ok(!repeat.ok && repeat.reason === '闪避冷却中', '重复闪避被冷却拒绝');

  const earlyTel = toTelegraph(p);
  const earlyDodge = E.playerDodge(earlyTel.state, earlyTel.state.telegraphStartedAt + 100);
  const earlyHit = E.tickBossAttack(earlyDodge.state, [p], ctx(earlyTel.state.telegraphEndsAt));
  ok(earlyHit.damages[0].result === 'hit', '过早闪避（窗口已过）仍然命中');

  const once = E.tickBossAttack(dodged.state, [p], ctx(tel.state.telegraphEndsAt + 10));
  ok(once.damages.length === 0, '闪避后同一攻击不重复结算');
}

// ================= 16.6 伤害 =================
console.log('=== 16.6 伤害结算 ===');
{
  const p = pattern();
  const hit = toHit(p).hit;
  ok(hit.damages[0].amount === 10 && hit.state.damageDealt === 10, '普通伤害 10');
  const low = toHit(pattern({ damage: 1 }));
  ok(low.hit.damages[0].amount === 1, '最小伤害 1');
  const scale = toHit(pattern({ damage: 10 }));
  const scaled = E.tickBossAttack(toTelegraph(pattern({ damage: 10 })).state, [pattern({ damage: 10 })], ctx(T0 + 2000, { damageScale: 0.5 }));
  ok(scaled.damages[0] && scaled.damages[0].amount === 5, '减伤系数 0.5 生效');
  const zeroScale = E.tickBossAttack(toTelegraph(pattern({ damage: 10 })).state, [pattern({ damage: 10 })], ctx(T0 + 2000, { damageScale: 0 }));
  ok(zeroScale.damages[0] && zeroScale.damages[0].amount === 0, '模拟再战 damageScale=0 不扣血');

  const tel = toTelegraph(p);
  const dead = E.tickBossAttack(tel.state, [p], ctx(tel.state.telegraphEndsAt, { playerHp: 0 }));
  ok(dead.damages.length === 0 && dead.state.attackState === 'idle' && dead.state.attackResult === 'cancelled', '玩家已死亡：攻击取消且不结算');
  const inactive = E.tickBossAttack(tel.state, [p], ctx(tel.state.telegraphEndsAt, { battleActive: false }));
  ok(inactive.damages.length === 0 && inactive.state.attackState === 'idle' && inactive.state.attackResult === 'cancelled', '战斗已结束：攻击取消且不结算');
  const blockedEvent = E.tickBossAttack(tel.state, [p], ctx(tel.state.telegraphEndsAt, { eventBlocked: true }));
  ok(blockedEvent.state.attackState === 'idle' && blockedEvent.state.attackResult === 'cancelled', '动态事件阻断：攻击取消');

  const hitState = hit.state;
  const again = E.tickBossAttack(hitState, [p], ctx(hit.state.attackEndsAt ?? T0));
  ok(again.damages.length === 0, '攻击结束后的 tick 不重复命中');
}

// ================= 冷却 =================
console.log('=== 攻击冷却与节奏 ===');
{
  const p = pattern({ cooldown: 5000 });
  const { hit } = toHit(p);
  const cool = E.tickBossAttack(hit.state, [p], ctx(hit.state.attackEndsAt));
  ok(cool.state.attackState === 'cooldown' && cool.state.cooldownEndsAt - cool.state.attackEndsAt >= 5000, '进入冷却');
  const idle = E.tickBossAttack(cool.state, [p], ctx(cool.state.cooldownEndsAt));
  ok(idle.state.attackState === 'idle' && idle.state.nextAttackAt > idle.state.cooldownEndsAt, '冷却结束回到 idle 并留出间隔');
  const before = E.tickBossAttack(idle.state, [p], ctx(idle.state.nextAttackAt - 1));
  ok(before.state.attackState === 'idle', '间隔未到不会立即再次攻击');
  const after = E.tickBossAttack(idle.state, [p], ctx(idle.state.nextAttackAt));
  ok(after.state.attackState === 'telegraph', '间隔结束后开始下一次攻击');
}

// ================= 16.7 阶段联动 =================
console.log('=== 16.7 阶段联动 ===');
{
  const p0 = pattern({ attackId: 'p0', phaseRestriction: [0] });
  const p1 = pattern({ attackId: 'p1', phaseRestriction: [1] });
  const tel = toTelegraph(p0);
  const switched = E.tickBossAttack(tel.state, [p0, p1], ctx(tel.state.telegraphStartedAt + 100, { phaseId: 'bp2', phaseIndex: 1 }));
  ok(switched.state.phaseIndex === 1 && switched.state.attackState === 'idle', '阶段切换取消当前攻击并进入新阶段');
  ok(switched.damages.length === 0, '阶段切换不结算旧阶段攻击');
  ok(switched.state.patternCooldowns && Object.keys(switched.state.patternCooldowns).length === 0, '新阶段攻击冷却重置');
  ok(switched.state.nextAttackAt > tel.state.telegraphStartedAt + 100, '新阶段攻击有缓冲时间');
  const next = E.tickBossAttack(switched.state, [p0, p1], ctx(switched.state.nextAttackAt, { phaseId: 'bp2', phaseIndex: 1 }));
  ok(next.state.currentPattern && next.state.currentPattern.attackId === 'p1', '新阶段只加载本阶段攻击模式');
}

// ================= 16.8 存档自愈 =================
console.log('=== 16.8 攻击存档自愈 ===');
{
  const p = pattern();
  const tel = toTelegraph(p);
  const normalized = E.normalizeBossAttackState(tel.state, { bossId: 'boss', phaseId: 'bp1', phaseIndex: 0, battleId: 'b1', now: T0 + 5000 });
  ok(normalized && normalized.attackState === 'cancelled', '刷新时预警中的攻击被安全取消');
  ok(normalized.damageDealt === 0 && normalized.nextAttackAt === T0 + 7500, '取消后不结算伤害并留出恢复时间');

  const hit = toHit(p).hit;
  const normHit = E.normalizeBossAttackState(hit.state, { bossId: 'boss', phaseId: 'bp1', phaseIndex: 0, battleId: 'b1', now: T0 + 9000 });
  ok(normHit.attackState === 'cancelled' && normHit.resolvedHitKeys.length === hit.state.resolvedHitKeys.length, '刷新时攻击中状态被取消且保留已结算 hitKey');

  const cool = E.tickBossAttack(hit.state, [p], ctx(hit.state.attackEndsAt));
  const normCool = E.normalizeBossAttackState(cool.state, { bossId: 'boss', phaseId: 'bp1', phaseIndex: 0, battleId: 'b1', now: T0 + 6000 });
  ok(normCool.attackState === 'cooldown' && normCool.cooldownEndsAt === cool.state.cooldownEndsAt, '冷却状态刷新后保留');

  const late = E.normalizeBossAttackState(cool.state, { bossId: 'boss', phaseId: 'bp1', phaseIndex: 0, battleId: 'b1', now: cool.state.cooldownEndsAt + 1000 });
  ok(late.attackState === 'idle', '冷却已过期的状态刷新后回到 idle');

  ok(E.normalizeBossAttackState({ bossId: 'other' }, { bossId: 'boss', phaseId: 'bp1', phaseIndex: 0, battleId: 'b1', now: T0 }) === null, 'Boss 不匹配的存档被丢弃');
  const dirty = E.normalizeBossAttackState({ bossId: 'boss', attackState: '??', resolvedHitKeys: new Array(100).fill('x'), nextAttackAt: -5 }, { bossId: 'boss', phaseId: 'bp1', phaseIndex: 0, battleId: 'b1', now: T0 });
  ok(dirty.attackState === 'idle' && dirty.resolvedHitKeys.length <= 40, '脏数据退化为安全 idle 且 hitKey 有上限');
}

// ================= 事件 =================
console.log('=== 攻击事件 ===');
{
  const p = pattern({ attackId: 'pulse' });
  const tel = toTelegraph(p);
  const def = E.playerDefend(tel.state, tel.state.telegraphEndsAt - 200);
  const hit = E.tickBossAttack(def.state, [p], ctx(tel.state.telegraphEndsAt));
  const evs = [...tel.events, ...def.events, ...hit.events];
  ok(evs.every(e => !!e.id && !!e.battleId && !!e.bossId && !!e.at), '事件包含唯一 id / battleId / bossId / 时间戳');
  ok(evs.every(e => e.attackId === 'pulse' || e.type === E.BOSS_BATTLE_EVENTS.ATTACK_SELECTED), '事件携带 attackId');
  ok(new Set(evs.map(e => e.id)).size === evs.length, '事件 id 唯一');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.ATTACK_SELECTED), 'ATTACK_SELECTED');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH), 'ATTACK_TELEGRAPH');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.ATTACK_STARTED), 'ATTACK_STARTED');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.ATTACK_BLOCKED), 'ATTACK_BLOCKED');
  ok(evs.some(e => e.type === E.BOSS_BATTLE_EVENTS.ATTACK_RESOLVED), 'ATTACK_RESOLVED');
}

console.log('\n结果：' + pass + ' / ' + total + ' 通过' + (pass === total ? ' ✅' : ' ❌'));
process.exit(pass === total ? 0 : 1);
