import { useEffect, useMemo, useState } from 'react';
import { BOSS_PHASE_BOSS_IDS, bossPhaseBossName, buildBossPhasePlan } from '../game/bossPhasePlans';
import { bossDifficulties } from '../game/bossDifficulties';
import type { BossDifficulty } from '../game/difficulty';
import { devToolsOn } from '../game/devMode';
import { attackPatternsFor } from '../game/bossAttackPatterns';
import {
  createBossAttackState, startAttackForDev, applyAttackInterference,
} from '../game/bossAttackEngine';
import {
  createBossWeaknessRun, normalizeWeaknessRun, observeWeakness, startAnalysis,
  tickWeakness, beginWeaknessCrack, completeWeaknessCrack, syncWeaknessPhase,
  definitionsForPhase, activeWeakness, activeEntry, exposureInfo,
  WEAKNESS_STATUS_LABEL, WEAKNESS_TYPE_LABEL,
  type BossWeaknessRunState, type BossWeaknessDefinition, type WeaknessObservation,
} from '../game/bossWeaknessEngine';
import { weaknessDefinitionsFor } from '../game/bossWeaknessCatalog';

/**
 * 仅 DEV 可见的 Boss 弱点测试面板。
 * 虚拟时钟 + 内存状态：不写正式存档、不扣意识、不发奖励、不绕过正式 Judge。
 */
export default function BossWeaknessDevPanel({
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
  const [weaknessId, setWeaknessId] = useState('');
  const [clock, setClock] = useState(() => Date.now());
  const [run, setRun] = useState<BossWeaknessRunState | null>(null);
  const [msg, setMsg] = useState('');
  const [attackDemo, setAttackDemo] = useState('');

  const plan = useMemo(() => buildBossPhasePlan(bossId, difficulty), [bossId, difficulty]);
  const defs = useMemo(() => weaknessDefinitionsFor(bossId, difficulty), [bossId, difficulty]);
  const phaseDefs = useMemo(() => definitionsForPhase(defs, phaseIndex), [defs, phaseIndex]);
  const def = phaseDefs.find(d => d.weaknessId === weaknessId) || phaseDefs[0];
  const phase = plan ? plan.phases[Math.min(phaseIndex, plan.phases.length - 1)] : undefined;

  useEffect(() => {
    if (!plan || !phase) { setRun(null); return; }
    const now = Date.now();
    const fresh = createBossWeaknessRun('dev-' + bossId + '-' + phaseIndex, bossId, phase.phaseId, phaseIndex, defs, now);
    setRun(fresh);
    setClock(now);
    setWeaknessId(phaseDefs[0] ? phaseDefs[0].weaknessId : '');
    setMsg('已重置弱点测试状态（内存态）。');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossId, difficulty, phaseIndex]);

  useEffect(() => {
    if (!def) return;
    setWeaknessId(def.weaknessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseDefs]);

  if (!enabled) return null;

  const entry = run && def ? run.entries[def.weaknessId] : undefined;
  const apply = (next: BossWeaknessRunState | null, label: string) => {
    if (!next) return;
    setRun(next);
    setMsg(label);
  };

  const obsOfClue = (d: BossWeaknessDefinition, clueId: string): WeaknessObservation | null => {
    const c = d.clues.find(x => x.clueId === clueId);
    if (!c) return null;
    return { kind: c.trigger.kind, attackId: c.trigger.attackId, attackType: c.trigger.attackType, result: c.trigger.result, challengeId: c.trigger.challengeId };
  };

  const injectNextClue = () => {
    if (!run || !def || !entry) return;
    const nextClue = def.clues.find(c => !entry.clues.includes(c.clueId));
    if (!nextClue) { setMsg('所有线索已注入。'); return; }
    const obs = obsOfClue(def, nextClue.clueId);
    if (!obs) return;
    const step = observeWeakness(run, defs, obs, clock);
    apply(step.state, '注入线索：' + nextClue.text);
  };

  const injectAllClues = () => {
    if (!run || !def) return;
    let cur = run;
    for (const clue of def.clues) {
      const obs = obsOfClue(def, clue.clueId);
      if (!obs) continue;
      cur = observeWeakness(cur, defs, obs, clock).state;
    }
    apply(cur, '已注入该弱点全部线索。');
  };

  const analyze = () => {
    if (!run) return;
    const step = startAnalysis(run, defs, clock);
    if (!step.ok) { setMsg('无法分析：' + step.reason); return; }
    const nextClock = clock + (def ? def.analysisDurationMs : 2500);
    const tick = tickWeakness(step.state, defs, nextClock);
    setClock(nextClock);
    apply(tick.changed ? tick.state : step.state, '分析完成 → 弱点已发现。');
  };

  const begin = () => {
    if (!run) return;
    const step = beginWeaknessCrack(run, defs, clock);
    if (!step.ok) { setMsg('无法开始破解：' + step.reason); return; }
    apply(step.state, '破解开始（尝试次数 +1）。');
  };

  const succeed = () => {
    if (!run) return;
    const step = completeWeaknessCrack(run, defs, true, clock);
    if (!step.changed) { setMsg('没有进行中的破解。'); return; }
    apply(step.state, '模拟破解成功 → 弱点暴露。');
    if (def) {
      const ex = exposureInfo(step.state, defs, clock);
      setAttackDemo('攻击中断配置：' + (ex.interruptAttack ? '开启' : '关闭') + ' · 禁用模式 ' + (ex.disabledPatternIds.length || 0) + ' 个');
    }
  };

  const fail = () => {
    if (!run) return;
    const step = completeWeaknessCrack(run, defs, false, clock);
    if (!step.changed) { setMsg('没有进行中的破解。'); return; }
    apply(step.state, '模拟破解失败。');
  };

  const advance = (ms: number) => {
    if (!run) return;
    const nextClock = clock + ms;
    const step = tickWeakness(run, defs, nextClock);
    setClock(nextClock);
    apply(step.changed ? step.state : run, step.changed ? '推进 ' + (ms / 1000).toFixed(1) + 's' : '状态无变化');
  };

  const testInterrupt = () => {
    if (!run || !def || !phase) return;
    const patterns = attackPatternsFor(bossId, difficulty, phaseIndex);
    if (!patterns.length) { setAttackDemo('当前阶段没有攻击模式。'); return; }
    const base = createBossAttackState('dev-attack', bossId, phase.phaseId, phaseIndex, clock);
    const started = startAttackForDev(base, patterns[0], clock);
    const ex = exposureInfo(run, defs, clock);
    const interference = applyAttackInterference(started.state, {
      now: clock,
      until: ex.entry && ex.entry.exposedUntil ? ex.entry.exposedUntil : clock + 8000,
      disablePatternIds: ex.disabledPatternIds,
      interrupt: true,
      reason: 'dev-test',
    });
    setAttackDemo('攻击状态 ' + started.state.attackState + ' → ' + interference.state.attackState +
      ' · 禁用模式 ' + Object.keys(interference.state.disabledPatterns).length + ' 个');
  };

  const nextPhase = () => {
    if (!run || !plan) return;
    const idx = Math.min(phaseIndex + 1, plan.phases.length - 1);
    const ph = plan.phases[idx];
    const step = syncWeaknessPhase(run, defs, ph.phaseId, idx, clock);
    setPhaseIndex(idx);
    setRun(step.state);
    setClock(clock + 1000);
    setMsg('阶段切换 → 第 ' + (idx + 1) + ' 阶段，旧弱点效果已取消，新阶段弱点加载。');
  };

  const simulateRefresh = () => {
    if (!run || !phase) return;
    const now = clock + 5000;
    const normalized = normalizeWeaknessRun(run, defs, {
      bossId, battleId: run.battleId, phaseId: phase.phaseId, phaseIndex, now,
    });
    setClock(now);
    setRun(normalized);
    setMsg('模拟刷新：预警/破解中状态已安全恢复；暴露按剩余时间恢复。');
  };

  const reset = () => {
    if (!plan || !phase) return;
    const now = Date.now();
    setRun(createBossWeaknessRun('dev-' + bossId + '-' + phaseIndex, bossId, phase.phaseId, phaseIndex, defs, now));
    setClock(now);
    setAttackDemo('');
    setMsg('已重置弱点测试状态。');
  };

  const status = entry ? WEAKNESS_STATUS_LABEL[entry.status] : '—';
  const remaining = entry && entry.exposedUntil != null ? Math.max(0, entry.exposedUntil - clock) : 0;

  return (
    <div className="panel dev-weakness-panel">
      <div className="panel-title">DEV · Boss 弱点测试面板<span className="panel-tag">虚拟时钟 · 不写存档</span></div>
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
        <label>弱点</label>
        <select value={weaknessId} onChange={e => { setWeaknessId(e.target.value); }}>
          {phaseDefs.map(d => <option key={d.weaknessId} value={d.weaknessId}>{d.name}</option>)}
        </select>
      </div>

      <div className="dev-phase-row">
        <button className="nxbtn small" onClick={injectNextClue}>注入下一条线索</button>
        <button className="nxbtn small" onClick={injectAllClues}>注入全部线索</button>
        <button className="nxbtn small primary" onClick={analyze}>模拟分析/发现</button>
        <button className="nxbtn small primary" onClick={begin}>开始破解</button>
        <button className="nxbtn small" onClick={fail}>模拟失败</button>
        <button className="nxbtn small" onClick={succeed}>模拟成功/暴露</button>
      </div>
      <div className="dev-phase-row">
        <button className="nxbtn small" onClick={() => advance(1000)}>推进 1s</button>
        <button className="nxbtn small" onClick={testInterrupt}>测试攻击中断</button>
        <button className="nxbtn small" onClick={nextPhase}>模拟阶段切换</button>
        <button className="nxbtn small" onClick={simulateRefresh}>模拟刷新恢复</button>
        <button className="nxbtn small ghost" onClick={reset}>重置测试状态</button>
      </div>

      {run && def && entry && (
        <>
          <div className="dev-phase-status">
            <span>状态：<b>{status}</b></span>
            <span>类型：{WEAKNESS_TYPE_LABEL[def.weaknessType]} · 难度 {def.discoveryDifficulty.toUpperCase()}</span>
            <span>线索：{entry.clues.length} / {def.requiredClues}</span>
            <span>尝试：{entry.attempts} / {def.maxAttempts > 0 ? def.maxAttempts : '∞'} · 成功 {entry.successCount}</span>
            <span>暴露：{remaining > 0 ? (remaining / 1000).toFixed(1) + 's' : '—'} · 结转伤害 {run.pendingCarryDamage}</span>
            <span>效果：伤害 ×{def.damageMultiplier} · 冷却 ×{def.attackCooldownBonus} · 中断 {def.interruptAttack ? '是' : '否'}</span>
          </div>
          <div className="dev-phase-history">
            {def.clues.map(c => (
              <span key={c.clueId} className={'chip' + (entry.clues.includes(c.clueId) ? ' cyan' : '')}>
                {entry.clues.includes(c.clueId) ? '✓' : '·'} {c.sourceLabel}
              </span>
            ))}
          </div>
          <pre className="dev-phase-json">{JSON.stringify({
            status: entry.status,
            clues: entry.clues,
            attempts: entry.attempts,
            exposedUntil: entry.exposedUntil,
            cooldownUntil: entry.cooldownUntil,
            lockedUntil: entry.lockedUntil,
            pendingCarryDamage: run.pendingCarryDamage,
            disabledPatterns: def.disableAttackPatternIds,
          }, null, 2)}</pre>
        </>
      )}

      {attackDemo && <div className="dev-phase-msg">攻击联动：{attackDemo}</div>}
      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        说明：本面板使用虚拟时钟与内存状态；真实破解必须通过战斗页的正式 Judge。生产构建中不存在。
      </div>
    </div>
  );
}
