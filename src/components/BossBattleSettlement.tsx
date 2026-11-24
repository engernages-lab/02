import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../store/gameStore';
import {
  formatSettlementDuration,
  type BossSettlementData,
  type SettlementAchievement,
  type SettlementDimension,
  type SettlementMetric,
} from '../game/bossSettlement';

interface Props {
  data: BossSettlementData;
  onClose: () => void;
  onRetry?: () => void;
  preview?: boolean;
  historical?: boolean;
  onExport?: () => void;
}

const GRADE_COLOR: Record<string, string> = { S: 'grade-s', A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d' };
const formatOffset = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

function useCountUp(target: number | null, duration: number, skip: boolean): number {
  const [value, setValue] = useState(() => (skip || target == null ? (target ?? 0) : 0));
  useEffect(() => {
    if (target == null || skip) { setValue(target ?? 0); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, skip]);
  return value;
}

function StatCard({ m }: { m: SettlementMetric }) {
  return (
    <div className={'bs-stat-card' + (m.available ? '' : ' unavailable')}>
      <span className="bs-stat-label">{m.label}</span>
      <span className="bs-stat-value">{m.display}</span>
    </div>
  );
}

function DimensionRow({ d }: { d: SettlementDimension }) {
  const pct = d.available && d.maxScore > 0 && d.score != null ? Math.max(0, Math.min(100, (d.score / d.maxScore) * 100)) : 0;
  return (
    <div className={'bs-dim-row' + (d.available ? '' : ' unavailable')}>
      <span className="bs-dim-label">{d.label}</span>
      <span className="bs-dim-score">{d.available && d.score != null ? d.score : 'N/A'}<em>/{d.maxScore}</em></span>
      <span className="bs-dim-weight">权重 {d.weight}% · 有效 {d.effectiveWeight == null ? '—' : (d.effectiveWeight * 100).toFixed(1) + '%'}</span>
      <span className="bs-dim-track"><i style={{ width: pct + '%' }} /></span>
      <span className="bs-dim-note">{d.available ? (d.reason || '已计入评分') : (d.availability === 'mechanicUnavailable' ? '该机制未触发' : d.availability === 'dataMissing' ? '数据不足' : '评分不可用')}</span>
    </div>
  );
}

function AchievementCard({ a }: { a: SettlementAchievement }) {
  return (
    <div className={'bs-ach-card level-' + a.level.toLowerCase() + (a.hidden ? ' hidden' : '')}>
      <span className="bs-ach-icon">{a.icon}</span>
      <span className="bs-ach-main">
        <b>{a.name}</b>
        <span className="bs-ach-desc">{a.description}</span>
        <span className="bs-ach-evidence">{a.evidence}</span>
        <span className="bs-ach-meta">{a.level}{a.hidden ? ' · 隐藏' : ''} · {new Date(a.unlockedAt).toLocaleString()}</span>
      </span>
      <span className="bs-ach-reward">+{a.reward.xp} XP<span>+{a.reward.contribution} 贡献</span></span>
    </div>
  );
}

export default function BossBattleSettlement({ data, onClose, onRetry, preview = false, historical = false, onExport }: Props) {
  const g = useGame();
  const [skip, setSkip] = useState(false);
  const animationsOff = !g.player.settings.animations || g.player.settings.animLevel === 'low';
  const instant = skip || animationsOff;
  const score = useCountUp(data.rating?.available ? data.rating.displayScore : null, 1100, instant);
  const grade = data.rating?.grade || null;
  const good = data.outcome === 'victory';
  const footerLabel = historical ? '关闭档案' : good ? '继续 · 查看结算详情' : data.outcome === 'defeat' ? '继续 · 返回重生协议' : '继续 · 返回难度选择';

  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.scrollTo?.({ top: 0 });
  }, [data.battleId]);

  return createPortal(
    <div className={'settlement-overlay settlement-' + data.outcome + (preview ? ' settlement-preview' : '') + (instant ? ' settlement-instant' : '')} role="dialog" aria-label="Boss 战斗结算" aria-modal="true">
      <div className="settlement-shell" ref={ref}>
        {preview && <div className="bs-preview-badge">DEV PREVIEW · 不写入存档</div>}
        {historical && <div className="bs-preview-badge">HISTORICAL RECORD · 历史战斗档案</div>}
        <header className="bs-header">
          <div className="bs-kicker">{data.resultCode} · {data.difficultyLabel}</div>
          <h1>{data.outcomeTitle}</h1>
          <div className="bs-subtitle">{data.outcomeSubtitle}</div>
          <div className="bs-boss-line">
            <span>{data.bossName}</span>
            <span>战斗时长 {formatSettlementDuration(data.durationMs)}</span>
            <span>{data.finalPhase != null ? '阶段 ' + data.finalPhase + (data.phaseTotal ? ' / ' + data.phaseTotal : '') : '阶段 N/A'}</span>
            <span>意识 {data.consciousness == null ? 'N/A' : data.consciousness}%</span>
            {data.archivedAt != null && <span>归档 {new Date(data.archivedAt).toLocaleString()}</span>}
          </div>
        </header>

        <section className={'bs-rating ' + (grade ? GRADE_COLOR[grade] : 'grade-unavailable')}>
          {data.rating?.available ? (
            <>
              <div className="bs-grade-wrap">
                <span className="bs-grade">{grade || '—'}</span>
                <span className="bs-rank">RANK</span>
              </div>
              <div className="bs-score-wrap">
                <div className="bs-score"><b>{score}</b> / 100</div>
                <div className="bs-score-bar"><i style={{ width: (data.rating.displayScore || 0) + '%' }} /></div>
                <div className="bs-score-meta">{data.rating.finalized ? '正式评分' : '临时 / 不完整评分'} · {data.rating.dataQuality}</div>
              </div>
              <div className="bs-rating-note">{data.rating.reasons[0] || '评分依据来自真实战斗数据。'}</div>
            </>
          ) : (
            <div className="bs-rating-unavailable">
              <div className="bs-grade-wrap"><span className="bs-grade">?</span><span className="bs-rank">RANK</span></div>
              <div>
                <b>评分数据不可用</b>
                <div className="dim">本场没有可读取的正式评分，结算不会重新计算或伪造评分。</div>
              </div>
            </div>
          )}
        </section>

        <section className="bs-section">
          <div className="bs-section-title">维度分析<span>DIMENSIONS</span></div>
          {data.rating?.available ? (
            <div className="bs-dims">{data.rating.dimensions.map(d => <DimensionRow key={d.key} d={d} />)}</div>
          ) : <div className="bs-empty">评分不可用，维度分析已跳过。</div>}
        </section>

        <section className="bs-section">
          <div className="bs-section-title">战斗统计<span>BATTLE STATS</span></div>
          {data.statsAvailable ? (
            <>
              <div className="bs-stat-grid">
                {data.metrics.challenge.map(m => <StatCard key={m.key} m={m} />)}
              </div>
              <div className="bs-stat-grid">
                {data.metrics.combat.map(m => <StatCard key={m.key} m={m} />)}
              </div>
              <div className="bs-stat-grid">
                {data.metrics.weakness.map(m => <StatCard key={m.key} m={m} />)}
                {data.metrics.dynamic.map(m => <StatCard key={m.key} m={m} />)}
              </div>
              <div className="bs-stat-grid">
                {data.metrics.progress.map(m => <StatCard key={m.key} m={m} />)}
              </div>
              {data.phaseRows.length > 0 && (
                <div className="bs-phase-table">
                  <div className="bs-phase-row head"><span>阶段</span><span>时长</span><span>受伤</span><span>攻击</span><span>挑战</span><span>弱点</span><span>状态</span></div>
                  {data.phaseRows.map(p => (
                    <div className="bs-phase-row" key={p.phaseId}>
                      <span>{p.label}</span>
                      <span>{formatSettlementDuration(p.durationMs)}</span>
                      <span>{p.damageTaken == null ? 'N/A' : p.damageTaken}</span>
                      <span>{p.attackCount == null ? 'N/A' : p.attackCount}</span>
                      <span>{p.challengeSuccess == null ? 'N/A' : p.challengeSuccess + '/' + (p.challengeFailed || 0)}</span>
                      <span>{p.weaknessCracks == null ? 'N/A' : p.weaknessDiscoveries + ' / ' + p.weaknessCracks}</span>
                      <span>{p.endState}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bs-timeline">
                <div className="bs-timeline-title">战斗时间线</div>
                {data.timeline.length > 0 ? (
                  <div className="bs-timeline-list">
                    {data.timeline.map((e, i) => (
                      <div className="bs-timeline-item" key={i}>
                        <span className="bs-timeline-time">{formatOffset(e.offsetMs)}</span>
                        <span>{e.label}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="bs-empty">{data.statsAvailable ? '当前历史记录未包含完整事件时间线。' : 'Timeline unavailable'}</div>}
              </div>
            </>
          ) : <div className="bs-empty">战斗统计不可用：没有找到该 battleId 的统计快照。</div>}
        </section>

        <section className="bs-section">
          <div className="bs-section-title">奖励到账<span>REWARDS</span></div>
          {data.reward.available ? (
            <div className="bs-rewards">
              <div className="bs-reward-hero">
                <span className={data.reward.granted ? 'granted' : 'unavailable'}>{data.reward.granted ? 'REWARD GRANTED' : '奖励未发放'}</span>
                <span className="dim">{data.reward.grantedAt ? new Date(data.reward.grantedAt).toLocaleString() : '—'}</span>
              </div>
              <div className="bs-reward-grid">
                <div><span>本次 XP</span><b>+{data.reward.xp ?? 'N/A'}</b></div>
                <div><span>贡献点</span><b>+{data.reward.contribution ?? 'N/A'}</b></div>
                <div><span>Credits</span><b>+{data.reward.credits ?? 'N/A'}</b></div>
                <div><span>创世主碎片</span><b>{data.fragmentTitle || 'N/A'}</b><em>{data.fragmentStatus}</em></div>
              </div>
              <div className="bs-reward-breakdown">
                <span>基础 +{data.reward.baseXp ?? 'N/A'} XP</span>
                <span>难度 +{data.reward.difficultyXp ?? 'N/A'} XP</span>
                <span>评分 +{data.reward.performanceXp ?? 'N/A'} XP</span>
                <span>表现 +{data.reward.specialXp ?? 'N/A'} XP</span>
                <span>完整 +{data.reward.fullXp ?? 'N/A'} XP</span>
                <span>既有发放 {data.reward.legacyXp ?? 'N/A'} XP</span>
              </div>
              <div className="bs-reward-reason">实际到账以 B.5.3 正式奖励记录为准；结算页面不会再次发放。</div>
            </div>
          ) : <div className="bs-empty">奖励数据不可用。{data.outcome !== 'victory' ? '本场未产生胜利奖励。' : ''}</div>}
        </section>

        <section className="bs-section">
          <div className="bs-section-title">隐藏成就<span>ACHIEVEMENTS</span></div>
          {data.achievementCount > 0 ? (
            <>
              <div className="bs-ach-count">{data.achievementCount} ACHIEVEMENTS UNLOCKED · 隐藏成就解锁</div>
              <div className="bs-ach-list">{data.achievements.map(a => <AchievementCard key={a.achievementId} a={a} />)}</div>
            </>
          ) : <div className="bs-empty">本次战斗没有解锁隐藏成就。</div>}
        </section>

        <section className="bs-section">
          <div className="bs-section-title">战斗总结<span>SUMMARY</span></div>
          {data.outcome === 'defeat' && data.failureReason && <div className="bs-failure">失败原因：{data.failureReason}</div>}
          {data.outcome === 'retreat' && <div className="bs-failure">撤退原因：{data.failureReason || '玩家主动撤退'}</div>}
          <div className="bs-summary-grid">
            <div><div className="bs-summary-head good">表现亮点</div>{data.strengths.length ? data.strengths.map((s, i) => <div key={i} className="bs-summary-line">· {s}</div>) : <div className="dim">数据不足</div>}</div>
            <div><div className="bs-summary-head warn">可提升方向</div>{data.improvements.length ? data.improvements.map((s, i) => <div key={i} className="bs-summary-line">· {s}</div>) : <div className="dim">继续保持</div>}</div>
          </div>
        </section>

        <footer className="bs-footer">
          <button className="nxbtn ghost" onClick={() => { setSkip(true); }} disabled={skip}>{skip ? '动画已跳过' : '跳过动画'}</button>
          {onExport && <button className="nxbtn" onClick={onExport}>导出档案 JSON</button>}
          {onRetry && data.outcome !== 'victory' && <button className="nxbtn" onClick={onRetry}>重新挑战</button>}
          <button className="nxbtn primary" onClick={onClose}>{footerLabel}</button>
        </footer>
        <div className="bs-source">battleId: {data.battleId}{data.source.ratingId ? ' · ' + data.source.ratingId : ''}{data.source.rewardId ? ' · ' + data.source.rewardId : ''}</div>
      </div>
    </div>,
    document.body,
  );
}
