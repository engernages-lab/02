import { useEffect, useMemo, useState } from 'react';
import { BOSS_PHASE_BOSS_IDS, bossPhaseBossName, buildBossPhasePlan } from '../game/bossPhasePlans';
import { bossDifficulties } from '../game/bossDifficulties';
import type { BossDifficulty } from '../game/difficulty';
import { devToolsOn } from '../game/devMode';
import {
  createBossAttackState, startAttackForDev, tickBossAttack, playerDefend, playerDodge,
  attackRemainingMs, telegraphProgress, ATTACK_STATUS_LABEL, ATTACK_TYPE_LABEL, DANGER_LABEL,
  type BossAttackPattern, type BossAttackState, type BossAttackStep,
} from '../game/bossAttackEngine';
import { attackPatternsFor } from '../game/bossAttackPatterns';

/**
 * 仅 DEV 可见的 Boss 攻击测试面板。
 * 使用独立虚拟时钟，不写存档、不扣真实意识、不发奖励、不影响正式战斗。
 */
export default function BossAttackDevPanel({
  initialBossId,
  initialDifficulty,
  initialPhaseIndex,
}: {
  initialBossId: string;
  initialDifficulty: BossDifficulty;
  initialPhaseIndex: number;
}) {
  const enabled = devToolsOn();
  const [bossId, setBossId] = useState(initialBossId);
  const [difficulty, setDifficulty] = useState<BossDifficulty>(initialDifficulty);
  const [phaseIndex, setPhaseIndex] = useState(initialPhaseIndex);
  const [patternId, setPatternId] = useState('');
  const [warningMs, setWarningMs] = useState(3000);
  const [clock, setClock] = useState(() => Date.now());
  const [state, setState] = useState<BossAttackState | null>(null);
  const [msg, setMsg] = useState('');

  const plan = useMemo(() => buildBossPhasePlan(bossId, difficulty), [bossId, difficulty]);
  const patterns = useMemo(() => attackPatternsFor(bossId, difficulty, phaseIndex), [bossId, difficulty, phaseIndex]);
  const phase = plan ? plan.phases[Math.min(phaseIndex, plan.phases.length - 1)] : undefined;
  const pattern = patterns.find(p => p.attackId === patternId) || patterns[0];

  const reset = (nextClock = Date.now()) => {
    if (!plan || !phase) { setState(null); return; }
    const st = createBossAttackState('dev-' + bossId + '-' + phaseIndex, bossId, phase.phaseId, phaseIndex, nextClock);
    setState(st);
    setClock(nextClock);
    setMsg('已重置攻击状态（DEV 虚拟时钟）。');
  };

  useEffect(() => {
    setPhaseIndex(p => Math.max(0, Math.min(p, plan ? plan.phases.length - 1 : 0)));
  }, [plan]);

  useEffect(() => {
    if (!plan || !phase) { setState(null); return; }
    const now = Date.now();
    setState(createBossAttackState('dev-' + bossId + '-' + phaseIndex, bossId, phase.phaseId, phaseIndex, now));
    setClock(now);
    setMsg('已加载攻击配置。');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossId, difficulty, phaseIndex]);

  useEffect(() => {
    if (pattern) {
      setPatternId(pattern.attackId);
      setWarningMs(pattern.warningDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patterns]);

  if (!enabled) return null;

  const applyStep = (step: BossAttackStep, label: string, nextClock = clock) => {
    setState(step.state);
    setClock(nextClock);
    const dmg = step.damages.reduce((s, d) => s + d.amount, 0);
    const extra = step.damages.length > 0 ? ' · 命中 ' + step.damages.map(d => d.result + ':' + d.amount).join(', ') : '';
    setMsg(label + (step.changed ? '' : '（无变化：' + (step.reason || '条件未满足') + '）') + extra + (dmg ? ' · 合计伤害 ' + dmg : ''));
  };

  const start = () => {
    if (!state || !pattern || !phase) return;
    const custom: BossAttackPattern = { ...pattern, warningDuration: Math.max(300, Math.floor(warningMs)) };
    const step = startAttackForDev(state, custom, clock);
    applyStep(step, '已开始预警：' + custom.attackName);
  };

  const advance = (ms: number) => {
    if (!state || !phase) return;
    const nextClock = clock + ms;
    const step = tickBossAttack(state, patterns, {
      now: nextClock, phaseId: phase.phaseId, phaseIndex,
      battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1,
    });
    applyStep(step, '推进 ' + (ms / 1000).toFixed(1) + ' 秒', nextClock);
  };

  const advanceToResolve = () => {
    if (!state || !phase) return;
    let cur = state;
    let c = clock;
    const collected: BossAttackStep = { state: cur, events: [], damages: [], changed: false };
    for (let i = 0; i < 80; i++) {
      c += 200;
      const step = tickBossAttack(cur, patterns, {
        now: c, phaseId: phase.phaseId, phaseIndex,
        battleActive: true, eventBlocked: false, playerHp: 100, damageScale: 1,
      });
      if (step.changed) {
        cur = step.state;
        collected.events.push(...step.events);
        collected.damages.push(...step.damages);
        collected.changed = true;
        if (cur.attackState === 'cooldown' || cur.attackState === 'idle') break;
      }
    }
    collected.state = cur;
    applyStep(collected, '推进至结算/冷却', c);
  };

  const defend = () => {
    if (!state) return;
    const step = playerDefend(state, clock);
    if (!step.ok) { setMsg('防御失败：' + step.reason + (step.message ? '（' + step.message + '）' : '')); return; }
    setState(step.state);
    setMsg(step.message || '防御姿态已展开');
  };

  const dodge = () => {
    if (!state) return;
    const step = playerDodge(state, clock);
    if (!step.ok) { setMsg('闪避失败：' + step.reason + (step.message ? '（' + step.message + '）' : '')); return; }
    setState(step.state);
    setMsg(step.message || '闪避窗口已开启');
  };

  const remain = state ? attackRemainingMs(state, clock) : null;
  const progress = state ? telegraphProgress(state, clock) : 0;

  return (
    <div className="panel dev-attack-panel">
      <div className="panel-title">DEV · Boss 攻击测试面板<span className="panel-tag">虚拟时钟 · 不写存档</span></div>
      <div className="dev-phase-row">
        <label>Boss</label>
        <select value={bossId} onChange={e => setBossId(e.target.value)}>
          {BOSS_PHASE_BOSS_IDS.map(id => <option key={id} value={id}>{bossPhaseBossName(id)}</option>)}
        </select>
        <label>难度</label>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value as BossDifficulty)}>
          {bossDifficulties(bossId).map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
        <label>阶段</label>
        <select value={phaseIndex} onChange={e => setPhaseIndex(Number(e.target.value))}>
          {plan?.phases.map(p => <option key={p.phaseId} value={p.phaseIndex}>第 {p.phaseIndex + 1} 阶段 · {p.phaseName}</option>)}
        </select>
      </div>

      <div className="dev-phase-row">
        <label>攻击模式</label>
        <select value={patternId} onChange={e => {
          setPatternId(e.target.value);
          const p = patterns.find(x => x.attackId === e.target.value);
          if (p) setWarningMs(p.warningDuration);
        }}>
          {patterns.map(p => <option key={p.attackId} value={p.attackId}>{p.attackName}（{ATTACK_TYPE_LABEL[p.attackType]}）</option>)}
        </select>
        <label>预警(ms)</label>
        <input type="number" min={300} step={100} value={warningMs} onChange={e => setWarningMs(Number(e.target.value))} style={{ width: 90 }} />
        <button className="nxbtn small primary" onClick={start}>手动开始攻击</button>
        <button className="nxbtn small ghost" onClick={() => reset()}>重置攻击状态</button>
      </div>

      <div className="dev-phase-row">
        <button className="nxbtn small" onClick={() => advance(500)}>推进 0.5s</button>
        <button className="nxbtn small" onClick={() => advance(1000)}>推进 1s</button>
        <button className="nxbtn small primary" onClick={advanceToResolve}>推进至结算</button>
        <button className="nxbtn small" onClick={defend}>模拟防御</button>
        <button className="nxbtn small" onClick={dodge}>模拟闪避</button>
      </div>

      {state && pattern && (
        <>
          <div className="dev-phase-status">
            <span>状态：<b>{ATTACK_STATUS_LABEL[state.attackState]}</b></span>
            <span>模式：<b>{pattern.attackName}</b> · {ATTACK_TYPE_LABEL[pattern.attackType]} · 危险 {DANGER_LABEL[pattern.dangerLevel]}</span>
            <span>伤害：{pattern.damage} × {pattern.hitCount} · 防御减伤 {Math.round(pattern.defenseReduction * 100)}%</span>
            <span>剩余：{remain == null ? '—' : (remain / 1000).toFixed(1) + 's'}（进度 {Math.round(progress * 100)}%）</span>
            <span>已结算：{state.damageDealt} · 命中 {state.hitsResolved}/{state.hitCount}</span>
            <span>响应：{state.playerResponse} · 结果：{state.lastResult || state.attackResult || '—'}</span>
          </div>
          <div className="dev-phase-history">
            {state.resolvedHitKeys.map(k => <span key={k} className="chip">{k}</span>)}
          </div>
          <pre className="dev-phase-json">{JSON.stringify({
            attackState: state.attackState,
            attackId: pattern.attackId,
            telegraphEndsAt: state.telegraphEndsAt,
            nextHitAt: state.nextHitAt,
            cooldownEndsAt: state.cooldownEndsAt,
            damageDealt: state.damageDealt,
            attackResult: state.attackResult,
            guardUntil: state.guardUntil,
            dodgeUntil: state.dodgeUntil,
          }, null, 2)}</pre>
        </>
      )}

      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        说明：本面板使用虚拟时钟推演攻击状态，不触发真实意识伤害；正式攻击由战斗页的单一定时器调度。生产构建中不存在。
      </div>
    </div>
  );
}
