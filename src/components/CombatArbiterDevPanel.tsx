import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { UNKNOWN_INTRUSION_ID } from '../game/events/unknownIntrusion';
import { COMBAT_PRIORITY } from '../game/combatEventArbiter';
import { devToolsOn } from '../game/devMode';

const P_LABEL: Record<number, string> = {
  0: 'P0 终结', 1: 'P1 战斗状态', 2: 'P2 重大危机', 3: 'P3 弱点',
  4: 'P4 动态战斗', 5: 'P5 Boss 攻击', 6: 'P6 普通系统',
};

/** 仅 DEV：战斗事件仲裁测试面板（触发冲突、查看锁/队列/记录、模拟终结） */
export default function CombatArbiterDevPanel({ bossId }: { bossId: string }) {
  const g = useGame();
  const [msg, setMsg] = useState('');
  if (!devToolsOn()) return null;

  const arb = g.combatArbiterStateOf(bossId);
  const active = arb ? arb.active : null;
  const records = arb ? arb.records.slice(-12).reverse() : [];

  const trigger = () => {
    const r = g.triggerDynamicEvent(UNKNOWN_INTRUSION_ID);
    setMsg(r.ok ? '未知入侵已触发（P2 抢占/等待结果见活动锁）。'
      : '未触发：' + (r.reason === 'queued' ? '已进入仲裁队列（等待高优先级事件结束）' : r.reason || '未知'));
  };

  return (
    <div className="panel dev-arbiter-panel">
      <div className="panel-title">DEV · 战斗事件仲裁面板<span className="panel-tag">优先级 / 锁 / 队列 / 记录</span></div>
      <div className="dev-arbiter-status">
        <span>活动锁：<b>{active ? P_LABEL[active.priority] + ' · ' + active.eventType : '无'}</b></span>
        <span>队列：<b>{arb ? arb.queue.length : 0}</b></span>
        <span>已结算：<b>{arb ? arb.settledEventIds.length : 0}</b></span>
        <span>记录：<b>{arb ? arb.records.length : 0}</b></span>
      </div>
      <div className="dev-phase-row">
        <button className="nxbtn small primary" onClick={trigger}>触发未知入侵（P2）</button>
        <button className="nxbtn small" onClick={() => { g.recoverDynamicEvent(); setMsg('动态事件已异常恢复并释放 P2。'); }}>恢复动态事件</button>
        <button className="nxbtn small" onClick={() => { g.dismissDynamicEvent(); setMsg('动态事件已清理。'); }}>清理动态事件</button>
        <button className="nxbtn small" onClick={() => { g.tickCombatArbiter(bossId); setMsg('已推进仲裁器（过期/锁一致性检查）。'); }}>推进仲裁器</button>
        <button className="nxbtn small ghost" onClick={() => { g.devResetDynamicEventCooldowns(); setMsg('已清空动态事件冷却（DEV）。'); }}>重置动态事件冷却</button>
        <button className="nxbtn small danger" onClick={() => { g.devForcePlayerDeath(bossId); setMsg('已模拟 P0 死亡：所有战斗事件应停止。'); }}>模拟玩家死亡（P0）</button>
        <button className="nxbtn small" onClick={() => { g.devForceBossVictory(bossId); setMsg('已模拟 P0 胜利终结：不发放奖励，所有事件停止。'); }}>模拟胜利（P0）</button>
        <button className="nxbtn small" onClick={() => { g.abandonBossBattle(bossId); setMsg('已触发真实撤退：INTERRUPTED / retreat，进入真实结算。'); }}>模拟撤退（P0）</button>
      </div>
      {arb && arb.queue.length > 0 && (
        <div className="dev-arbiter-queue">
          {arb.queue.slice(0, 6).map(e => (
            <span key={e.eventId} className="chip">{e.priority} · {e.eventType} · {e.status}</span>
          ))}
        </div>
      )}
      <div className="dev-arbiter-records">
        {records.length === 0 && <span className="dim" style={{ fontSize: 12 }}>暂无事件记录。</span>}
        {records.map((r, i) => (
          <div key={r.eventId + ':' + i} className="dev-arbiter-record">
            <span className="ar-p">P{r.priority}</span>
            <span className="ar-type">{r.eventType}</span>
            <span className={'ar-status ' + r.status}>{r.status}</span>
            <span className="ar-reason">{r.reason || ''}</span>
          </div>
        ))}
      </div>
      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        优先级：P0 终结 &gt; P1 阶段 &gt; P2 危机 &gt; P3 弱点 &gt; P4 动态 &gt; P5 攻击 &gt; P6 普通。
        同一时间仅一个独占事件；低优先级不会抢占高优先级。本面板仅修改内存/正式战斗状态用于测试，不发放奖励。
      </div>
    </div>
  );
}
