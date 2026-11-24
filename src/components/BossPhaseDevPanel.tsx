import { useEffect, useMemo, useState } from 'react';
import { BOSS_PHASE_BOSS_IDS, bossPhaseBossName, buildBossPhasePlan } from '../game/bossPhasePlans';
import {
  startBossPhaseRun, setHpForDev, forcePhaseForDev, evaluatePhaseTransition, completePhaseTransition,
  applyDamage, BOSS_BATTLE_STATUS_LABEL, hpPercentOf,
  type BossBattleRunState,
} from '../game/bossPhaseEngine';
import { bossDifficulties } from '../game/bossDifficulties';
import type { BossDifficulty } from '../game/difficulty';
import { devToolsOn } from '../game/devMode';

/**
 * 仅 DEV 可用的 Boss 多阶段测试入口。
 * 完全运行在组件内存里：不写正式存档、不发奖励、不影响真实战斗状态。
 */
export default function BossPhaseDevPanel({
  initialBossId,
  initialDifficulty,
}: {
  initialBossId: string;
  initialDifficulty: BossDifficulty;
}) {
  const enabled = devToolsOn();
  const [bossId, setBossId] = useState(initialBossId);
  const [difficulty, setDifficulty] = useState<BossDifficulty>(initialDifficulty);
  const [run, setRun] = useState<BossBattleRunState | null>(null);
  const [hpInput, setHpInput] = useState(100);
  const [jumpIndex, setJumpIndex] = useState(0);
  const [msg, setMsg] = useState('');

  const difficulties = bossDifficulties(bossId);
  const plan = useMemo(() => buildBossPhasePlan(bossId, difficulty), [bossId, difficulty]);

  useEffect(() => {
    if (difficulties.length > 0 && !difficulties.includes(difficulty)) {
      setDifficulty(difficulties[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossId]);

  useEffect(() => {
    if (!plan) { setRun(null); return; }
    const started = startBossPhaseRun(plan, Date.now());
    setRun(started.run);
    setHpInput(started.run.hp);
    setJumpIndex(0);
    setMsg('已重置测试战斗（内存态，不写存档 / 不发奖励）。');
  }, [plan]);

  if (!enabled) return null;

  const totalHp = plan ? plan.totalHp : 100;
  const pct = run ? hpPercentOf(run) : 0;
  const statusLabel = run ? (BOSS_BATTLE_STATUS_LABEL[run.status] || run.status) : '—';

  const doReset = () => {
    if (!plan) return;
    const started = startBossPhaseRun(plan, Date.now());
    setRun(started.run);
    setHpInput(started.run.hp);
    setJumpIndex(0);
    setMsg('已重置测试战斗。');
  };

  const doSetHp = (value: number) => {
    if (!plan || !run) return;
    const step = setHpForDev(run, plan, value, Date.now());
    setRun(step.run);
    setHpInput(step.run.hp);
    setMsg('HP 已设置为 ' + step.run.hp + ' / ' + step.run.maxHp + '（阶段 ' + (step.run.currentPhaseIndex + 1) + '）。');
  };

  const doDamage = (amount: number) => {
    if (!run) return;
    const step = applyDamage(run, amount, Date.now());
    setRun(step.run);
    setHpInput(step.run.hp);
    setMsg('造成 ' + amount + ' 点伤害 → HP ' + step.run.hp + '，状态 ' + (BOSS_BATTLE_STATUS_LABEL[step.run.status] || step.run.status));
  };

  const doTrigger = () => {
    if (!plan || !run) return;
    const step = evaluatePhaseTransition(run, plan, { hp: run.hp, maxHp: run.maxHp, completedChallenges: run.completedChallenges }, Date.now());
    if (!step.ok || !step.run.transition) {
      setMsg('未触发阶段切换：' + (step.reason || '没有满足条件的下一阶段'));
      return;
    }
    setRun(step.run);
    const to = plan.phases[step.run.transition.toIndex];
    setMsg('已触发切换 → 第 ' + (to.phaseIndex + 1) + ' 阶段「' + to.phaseName + '」（transition ' + step.run.transition.id.slice(0, 18) + '…）');
  };

  const doComplete = () => {
    if (!plan || !run) return;
    const step = completePhaseTransition(run, plan, Date.now());
    if (!step.ok) { setMsg('完成切换失败：' + (step.reason || '没有待完成的切换')); return; }
    setRun(step.run);
    setJumpIndex(step.run.currentPhaseIndex);
    setMsg('阶段初始化完成：第 ' + (step.run.currentPhaseIndex + 1) + ' 阶段「' + plan.phases[step.run.currentPhaseIndex].phaseName + '」。');
  };

  const doJump = () => {
    if (!plan || !run) return;
    const step = forcePhaseForDev(run, plan, jumpIndex, Date.now());
    setRun(step.run);
    setHpInput(step.run.hp);
    setMsg('已强行指定第 ' + (step.run.currentPhaseIndex + 1) + ' 阶段（DEV 专用）。');
  };

  return (
    <div className="panel dev-phase-panel">
      <div className="panel-title">DEV · Boss 多阶段测试入口<span className="panel-tag">仅本机 · 不写存档</span></div>
      <div className="dev-phase-row">
        <label>Boss</label>
        <select value={bossId} onChange={e => { setBossId(e.target.value); setMsg(''); }}>
          {BOSS_PHASE_BOSS_IDS.map(id => <option key={id} value={id}>{bossPhaseBossName(id)}</option>)}
        </select>
        <label>难度</label>
        <select value={difficulty} onChange={e => { setDifficulty(e.target.value as BossDifficulty); setMsg(''); }}>
          {difficulties.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
        <button className="nxbtn small ghost" onClick={doReset}>重置测试战斗</button>
      </div>

      {plan && run && (
        <>
          <div className="dev-phase-row">
            <button className="nxbtn small" onClick={() => doSetHp(totalHp)}>HP 100%</button>
            <button className="nxbtn small" onClick={() => doSetHp(Math.round(totalHp * 0.7))}>HP 70%</button>
            <button className="nxbtn small" onClick={() => doSetHp(Math.round(totalHp * 0.35))}>HP 35%</button>
            <button className="nxbtn small" onClick={() => doSetHp(0)}>HP 0</button>
            <input
              type="number"
              min={0}
              max={totalHp}
              value={hpInput}
              onChange={e => setHpInput(Number(e.target.value))}
              style={{ width: 90 }}
            />
            <button className="nxbtn small primary" onClick={() => doSetHp(hpInput)}>应用 HP</button>
          </div>

          <div className="dev-phase-row">
            <button className="nxbtn small" onClick={() => doDamage(25)}>-25 伤害</button>
            <button className="nxbtn small" onClick={() => doDamage(60)}>-60 伤害</button>
            <button className="nxbtn small primary" onClick={doTrigger}>触发阶段切换</button>
            <button className="nxbtn small primary" onClick={doComplete}>完成阶段切换</button>
            <select value={jumpIndex} onChange={e => setJumpIndex(Number(e.target.value))}>
              {plan.phases.map(p => <option key={p.phaseId} value={p.phaseIndex}>第 {p.phaseIndex + 1} 阶段 · {p.phaseName}</option>)}
            </select>
            <button className="nxbtn small ghost" onClick={doJump}>指定阶段</button>
          </div>

          <div className="dev-phase-status">
            <span>状态：<b>{statusLabel}</b></span>
            <span>阶段：<b>{run.currentPhaseIndex + 1} / {plan.phases.length}</b> · {plan.phases[run.currentPhaseIndex]?.phaseName}</span>
            <span>HP：<b>{run.hp} / {run.maxHp}</b>（{pct}%）</span>
            <span>挑战：{run.stats.challengeSuccesses} 成功 / {run.stats.challengeFailures} 失败</span>
            <span>切换：{run.stats.phaseTransitions} 次 · 伤害 {run.stats.damageDealt} / 反击 {run.stats.damageReceived}</span>
          </div>

          <div className="dev-phase-history">
            <div className="dim" style={{ fontSize: 11.5 }}>阶段历史：</div>
            {run.phaseHistory.length === 0 && <span className="dim">（空）</span>}
            {run.phaseHistory.map((h, i) => (
              <span key={i} className="chip">
                {h.phaseIndex + 1}·{h.phaseId} {h.exitedAt == null ? '进行中' : '已结束'}
              </span>
            ))}
          </div>

          <pre className="dev-phase-json">{JSON.stringify({
            battleId: run.battleId,
            status: run.status,
            battleResult: run.battleResult,
            hp: run.hp,
            currentPhaseIndex: run.currentPhaseIndex,
            transition: run.transition,
            stats: run.stats,
            completedChallenges: run.completedChallenges,
          }, null, 2)}</pre>
        </>
      )}

      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        说明：本面板只操作组件内存状态；真实战斗的阶段切换由提交判题后自动触发。生产构建中该入口不存在。
      </div>
    </div>
  );
}
