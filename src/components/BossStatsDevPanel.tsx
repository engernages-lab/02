import { useState } from 'react';
import { useGame } from '../store/gameStore';
import {
  BATTLE_STAT_EVENT_LABEL,
  snapshotBossBattleStats,
  type BossBattleStatsState,
} from '../game/bossBattleStats';
import { devToolsOn } from '../game/devMode';

const pct = (v: number | null) => (v == null ? '—' : (v * 100).toFixed(1) + '%');
const sec = (ms: number | null) => (ms == null ? '—' : (ms / 1000).toFixed(1) + 's');

/** 仅 DEV：Boss 战斗统计调试面板（只读真实统计，不修改战斗/奖励） */
export default function BossStatsDevPanel({ bossId }: { bossId: string }) {
  const g = useGame();
  const [msg, setMsg] = useState('');
  if (!devToolsOn()) return null;

  const store = g.player.progress.bossBattleStats;
  const active = store && store.active && store.active.bossId === bossId ? store.active : null;
  const latestHistory = store && store.history.length > 0 ? store.history[store.history.length - 1] : null;
  const [viewSnapshot, setViewSnapshot] = useState(false);
  const shown = viewSnapshot && latestHistory ? latestHistory : active;

  const exportJson = () => {
    if (!shown) { setMsg('没有可导出的统计数据。'); return; }
    try {
      const data = JSON.stringify(snapshotBossBattleStats(shown), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'boss-stats-' + shown.battleId.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg('已导出 ' + (viewSnapshot ? '历史快照' : '当前战斗') + ' JSON。');
    } catch {
      setMsg('导出失败（浏览器限制）。');
    }
  };

  const recent = shown ? [...shown.eventLog].slice(-12).reverse() : [];

  return (
    <div className="panel dev-stats-panel">
      <div className="panel-title">DEV · Boss 战斗统计<span className="panel-tag">只读 / 真实事件</span></div>
      <div className="dev-phase-row">
        <button className={'nxbtn small ' + (viewSnapshot ? '' : 'primary')} disabled={!active} onClick={() => setViewSnapshot(false)}>当前战斗</button>
        <button className={'nxbtn small ' + (viewSnapshot ? 'primary' : '')} disabled={!latestHistory} onClick={() => setViewSnapshot(true)}>最近快照</button>
        <button className="nxbtn small ghost" disabled={!shown} onClick={exportJson}>导出 JSON</button>
      </div>

      {!shown && <div className="dim" style={{ fontSize: 12.5, marginTop: 8 }}>暂无统计数据（进入 Boss 战并开始挑战后生成）。</div>}

      {shown && (
        <>
          <div className="dev-stats-grid">
            <span>Battle：<b>{shown.battleId}</b></span>
            <span>Boss：<b>{shown.bossName}</b></span>
            <span>状态：<b>{shown.battleStatus}</b>{shown.result ? ' · ' + shown.result : ''}</span>
            <span>阶段：<b>{shown.currentPhaseIndex + 1}</b>（最高 {shown.maxPhaseReached + 1}）</span>
            <span>时长：<b>{sec(shown.wallDurationMs)}</b>{shown.activeDurationMs == null ? '（活动时长不可得）' : ''}</span>
            <span>完整性：<b>{shown.dataQuality}</b>{shown.finalized ? ' · 已终结' : ''}</span>
          </div>
          <div className="dev-stats-grid">
            <span>提交：<b>{shown.challengeStats.submittedCount}</b></span>
            <span>判题：<b>{shown.challengeStats.judgedCount}</b></span>
            <span>通过：<b>{shown.challengeStats.passedCount}</b></span>
            <span>失败：<b>{shown.challengeStats.failedCount}</b></span>
            <span>运行异常：<b>{shown.challengeStats.runtimeErrorCount}</b></span>
            <span>成功率：<b>{pct(shown.challengeStats.successRate)}</b></span>
            <span>最长连击：<b>{shown.challengeStats.maxConsecutiveSuccess}</b></span>
          </div>
          <div className="dev-stats-grid">
            <span>攻击预警：<b>{shown.attackStats.telegraphCount}</b></span>
            <span>攻击发起：<b>{shown.attackStats.startedCount}</b></span>
            <span>命中：<b>{shown.attackStats.hitCount}</b></span>
            <span>防御成功：<b>{shown.defenseStats.defenseSuccessCount}</b></span>
            <span>防御失败：<b>{shown.defenseStats.defenseFailedCount}</b></span>
            <span>闪避成功：<b>{shown.defenseStats.dodgeSuccessCount}</b></span>
            <span>闪避失败：<b>{shown.defenseStats.dodgeFailedCount}</b></span>
            <span>受到伤害：<b>{shown.attackStats.damageTaken}</b></span>
            <span>护罩吸收：<b>{shown.attackStats.shieldAbsorbed}</b></span>
          </div>
          <div className="dev-stats-grid">
            <span>弱点线索：<b>{shown.weaknessStats.clueCount}</b></span>
            <span>发现：<b>{shown.weaknessStats.discoveredCount}</b></span>
            <span>分析：<b>{shown.weaknessStats.analysisCount}</b></span>
            <span>破解提交：<b>{shown.weaknessStats.crackSubmittedCount}</b></span>
            <span>破解成功：<b>{shown.weaknessStats.crackSuccessCount}</b></span>
            <span>暴露：<b>{shown.weaknessStats.exposedCount}</b></span>
            <span>弱点伤害：<b>{shown.weaknessStats.bossHpDamage}</b></span>
          </div>
          <div className="dev-stats-grid">
            <span>事件触发：<b>{shown.dynamicEventStats.triggeredCount}</b></span>
            <span>成功：<b>{shown.dynamicEventStats.successCount}</b></span>
            <span>失败：<b>{shown.dynamicEventStats.failedCount}</b></span>
            <span>超时：<b>{shown.dynamicEventStats.timeoutCount}</b></span>
            <span>中断攻击：<b>{shown.dynamicEventStats.attackInterruptedCount}</b></span>
          </div>

          <div className="dev-stats-sub">最近事件（{recent.length}）</div>
          <div className="dev-stats-events">
            {recent.length === 0 && <span className="dim">暂无</span>}
            {recent.map(e => (
              <div key={e.eventId} className="dev-stats-event">
                <span className="dse-type">{BATTLE_STAT_EVENT_LABEL[e.eventType] || e.eventType}</span>
                <span className="dse-phase">{e.phaseId || '—'}</span>
                <span className="dse-seq">#{e.sequence}</span>
                <span className="dse-id">{e.eventId.slice(0, 24)}</span>
              </div>
            ))}
          </div>

          {shown.rejectedEvents.length > 0 && (
            <>
              <div className="dev-stats-sub">被拒绝事件（{shown.rejectedEvents.length}）</div>
              <div className="dev-stats-events">
                {shown.rejectedEvents.slice(-5).reverse().map((r, i) => (
                  <div key={r.eventId + ':' + i} className="dev-stats-event rejected">
                    <span className="dse-type">{r.eventType || 'unknown'}</span>
                    <span className="dse-reason">{r.reason}</span>
                    <span className="dse-id">{r.eventId.slice(0, 24)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <details className="dev-stats-json">
            <summary>查看统计 JSON</summary>
            <pre>{JSON.stringify(snapshotBossBattleStats(shown), null, 2)}</pre>
          </details>
        </>
      )}
      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        说明：统计面板只读取真实战斗事件；不修改 Boss HP、玩家意识、阶段、Judge 或奖励。生产构建中不可见。
      </div>
    </div>
  );
}
