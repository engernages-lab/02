import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { calculateBossBattleRating, latestBossBattleRatingForBoss, type BossBattleRating } from '../game/bossBattleRating';
import type { BossBattleStatsState } from '../game/bossBattleStats';
import { BOSS_BATTLE_RATING_GRADES, BOSS_BATTLE_RATING_VERSION, gradeNameOf, type BossRatingDimensionKey } from '../game/bossBattleRatingConfig';
import { devToolsOn } from '../game/devMode';

const DIMENSIONS: BossRatingDimensionKey[] = ['survival', 'challenge', 'tactics', 'weakness', 'crisis'];

const AVAILABILITY_LABEL: Record<string, string> = {
  available: '可评分',
  mechanicUnavailable: '机制不存在',
  dataMissing: '数据缺失',
  invalid: '无效',
};

/** 仅 DEV：Boss 战斗评价预览（只读最终统计快照，不写正式评分/奖励） */
export default function BossRatingDevPanel({ bossId }: { bossId: string }) {
  const g = useGame();
  const enabled = devToolsOn();
  const [preview, setPreview] = useState<BossBattleRating | null>(null);
  const [msg, setMsg] = useState('');

  const statsStore = g.player.progress.bossBattleStats;
  const latestStats: BossBattleStatsState | null = statsStore
    ? [...statsStore.history].filter(s => s.bossId === bossId && s.finalized).sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0)).pop() || null
    : null;
  const stored = latestBossBattleRatingForBoss(g.player.progress.bossBattleRatings, bossId);
  const shown = preview || stored;

  useEffect(() => {
    setPreview(null);
    setMsg('');
  }, [latestStats ? latestStats.battleId : '']);

  if (!enabled) return null;

  const rerun = () => {
    if (!latestStats) { setMsg('没有可用的最终统计快照。'); return; }
    try {
      setPreview(calculateBossBattleRating(latestStats, Date.now()));
      setMsg('已基于最终统计快照重算（仅预览，不写入正式评分）。');
    } catch {
      setMsg('评分预览失败。');
    }
  };

  const exportJson = () => {
    if (!shown) { setMsg('没有可导出的评分。'); return; }
    try {
      const blob = new Blob([JSON.stringify(shown, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'boss-rating-' + shown.battleId.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg('已导出评分 JSON。');
    } catch {
      setMsg('导出失败（浏览器限制）。');
    }
  };

  return (
    <div className="panel dev-rating-panel">
      <div className="panel-title">DEV · Boss 战斗评价<span className="panel-tag">只读 / 不写奖励</span></div>
      <div className="dev-phase-row">
        <button className={'nxbtn small ' + (preview ? '' : 'primary')} disabled={!stored} onClick={() => { setPreview(null); setMsg(''); }}>正式评分</button>
        <button className="nxbtn small" disabled={!latestStats} onClick={rerun}>重算预览</button>
        <button className="nxbtn small ghost" disabled={!shown} onClick={exportJson}>导出 JSON</button>
      </div>
      {!latestStats && <div className="dim" style={{ fontSize: 12.5, marginTop: 8 }}>暂无最终统计快照；击败 Boss 后生成。</div>}
      {latestStats && !stored && !preview && <div className="dim" style={{ fontSize: 12.5, marginTop: 8 }}>该场战斗尚未生成正式评分。可点击「重算预览」查看，但不会写入存档。</div>}

      {shown && (
        <>
          <div className="dev-rating-head">
            <span className={'dev-rating-grade grade-' + shown.grade}>{shown.grade}</span>
            <div>
              <div className="dev-rating-score">{shown.displayScore}<span> / 100</span></div>
              <div className="dim">{shown.totalScore} 分 · {gradeNameOf(shown.grade)} · {shown.dataQuality} · {preview ? '临时预览' : shown.finalized ? '正式' : '临时'}</div>
            </div>
          </div>
          <div className="dev-stats-grid">
            <span>Battle：<b>{shown.battleId}</b></span>
            <span>Boss：<b>{shown.bossId}</b></span>
            <span>版本：<b>{shown.ratingVersion}</b></span>
            <span>完整性：<b>{shown.dataQuality}</b></span>
            <span>快照摘要：<b>{shown.sourceStatsHash || '—'}</b></span>
          </div>
          <div className="dev-rating-dims">
            {DIMENSIONS.map(k => {
              const d = shown.dimensionScores[k];
              return (
                <div key={k} className={'dev-rating-row' + (d.availability === 'available' ? '' : ' dim')}>
                  <span className="drr-label">{d.label}</span>
                  <span className="drr-score"><b>{d.score}</b> / {d.maxScore}</span>
                  <span className="drr-weight">权重 {d.weight} · 有效 {(d.effectiveWeight * 100).toFixed(1)}%</span>
                  <span className={'drr-avail avail-' + d.availability}>{AVAILABILITY_LABEL[d.availability] || d.availability}{d.partial ? ' · 子项不完整' : ''}</span>
                </div>
              );
            })}
          </div>
          <div className="dev-stats-grid">
            {BOSS_BATTLE_RATING_GRADES.map(x => <span key={x.grade}>{x.grade} ≥ {x.min}</span>)}
          </div>

          <div className="dev-stats-sub">评分依据</div>
          <div className="dev-rating-list">{shown.ratingReasons.map((r, i) => <div key={'r' + i}>· {r}</div>)}</div>
          <div className="dev-stats-sub">表现亮点</div>
          <div className="dev-rating-list">{shown.performanceHighlights.length ? shown.performanceHighlights.map((r, i) => <div key={'h' + i}>· {r}</div>) : <span className="dim">暂无</span>}</div>
          <div className="dev-stats-sub">表现不足</div>
          <div className="dev-rating-list">{shown.performanceWeaknesses.length ? shown.performanceWeaknesses.map((r, i) => <div key={'w' + i}>· {r}</div>) : <span className="dim">暂无</span>}</div>

          <details className="dev-stats-json">
            <summary>查看评分计算明细 JSON</summary>
            <pre>{JSON.stringify(shown.scoreBreakdown, null, 2)}</pre>
          </details>
          <details className="dev-stats-json">
            <summary>查看评分输入统计快照</summary>
            <pre>{latestStats ? JSON.stringify(latestStats, null, 2) : '—'}</pre>
          </details>
        </>
      )}
      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        说明：评分预览只读取 B.5.1 最终统计快照，算法版本 {BOSS_BATTLE_RATING_VERSION}；不修改战斗、统计、奖励或历史正式评分。生产构建中不可见。
      </div>
    </div>
  );
}
