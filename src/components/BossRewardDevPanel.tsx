import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { latestBossBattleRewardForBoss, calculateBossBattleRewards, bossLegacyRewardOffset, type BossBattleReward } from '../game/bossBattleReward';
import { findBossBattleRating } from '../game/bossBattleRating';
import type { BossBattleStatsState } from '../game/bossBattleStats';
import { BOSS_REWARD_VERSION } from '../game/bossBattleRewardConfig';
import { devToolsOn } from '../game/devMode';

const fmt = (x: number) => String(Math.max(0, Math.floor(Number.isFinite(x) ? x : 0)));

/** 仅 DEV：Boss 战斗奖励预览（只读，不写经济/正式奖励） */
export default function BossRewardDevPanel({ bossId }: { bossId: string }) {
  const g = useGame();
  const [preview, setPreview] = useState<BossBattleReward | null>(null);
  const [msg, setMsg] = useState('');

  const statsStore = g.player.progress.bossBattleStats;
  const latestStats: BossBattleStatsState | null = statsStore
    ? [...statsStore.history].filter(s => s.bossId === bossId && s.finalized).sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0)).pop() || null
    : null;
  const latestRating = latestStats ? findBossBattleRating(g.player.progress.bossBattleRatings, latestStats.battleId) : null;
  const stored = latestBossBattleRewardForBoss(g.player.progress.bossBattleRewards, bossId);
  const shown = preview || stored;

  useEffect(() => {
    setPreview(null);
    setMsg('');
  }, [latestStats ? latestStats.battleId : '']);

  if (!devToolsOn()) return null;

  const rerun = () => {
    if (!latestStats) { setMsg('没有可用的最终统计快照。'); return; }
    try {
      setPreview(calculateBossBattleRewards({
        stats: latestStats,
        rating: latestRating,
        bossId,
        difficulty: latestStats.difficulty,
        firstDifficultyReward: true,
        legacyGranted: bossLegacyRewardOffset(bossId, latestStats.difficulty),
        now: Date.now(),
      }));
      setMsg('已基于最终统计/正式评分重算奖励（仅预览，不发放）。');
    } catch {
      setMsg('奖励预览失败。');
    }
  };

  const exportJson = () => {
    if (!shown) { setMsg('没有可导出的奖励。'); return; }
    try {
      const blob = new Blob([JSON.stringify(shown, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'boss-reward-' + shown.battleId.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg('已导出奖励 JSON。');
    } catch {
      setMsg('导出失败（浏览器限制）。');
    }
  };

  return (
    <div className="panel dev-reward-panel">
      <div className="panel-title">DEV · Boss 战斗奖励<span className="panel-tag">只读 / 不发放</span></div>
      <div className="dev-phase-row">
        <button className={'nxbtn small ' + (preview ? '' : 'primary')} disabled={!stored} onClick={() => { setPreview(null); setMsg(''); }}>正式奖励</button>
        <button className="nxbtn small" disabled={!latestStats} onClick={rerun}>重算预览</button>
        <button className="nxbtn small ghost" disabled={!shown} onClick={exportJson}>导出 JSON</button>
      </div>
      {!latestStats && <div className="dim" style={{ fontSize: 12.5, marginTop: 8 }}>暂无最终统计快照；击败 Boss 后生成。</div>}
      {latestStats && !stored && !preview && <div className="dim" style={{ fontSize: 12.5, marginTop: 8 }}>该场战斗尚未生成正式奖励记录。可点击「重算预览」查看，不会写入或发放。</div>}

      {shown && (
        <>
          <div className="dev-reward-head">
            <span className={'dev-reward-state ' + (preview ? 'preview' : shown.granted ? 'granted' : 'ineligible')}>
              {preview ? '预览' : shown.granted ? '已发放' : '未发放'}
            </span>
            <span className="dim">资格：{shown.eligible ? '可领取' : '不可领取'} · 版本 {shown.rewardVersion}</span>
          </div>
          <div className="dev-stats-grid">
            <span>Battle：<b>{shown.battleId}</b></span>
            <span>Boss：<b>{shown.bossId}</b></span>
            <span>难度：<b>{shown.difficulty}</b></span>
            <span>结果：<b>{shown.battleResult || '—'}</b></span>
            <span>评分：<b>{shown.ratingGrade || '—'}</b> / {shown.ratingScore ?? '—'}</span>
            <span>完整性：<b>{shown.dataQuality}</b></span>
            <span>评分缺失：<b>{shown.ratingUnavailable ? '是' : '否'}</b></span>
            {shown.rejectionReason && <span>拒绝：<b>{shown.rejectionReason}</b></span>}
          </div>

          <div className="dev-reward-table">
            <div className="dev-reward-row head"><span>项目</span><span>XP</span><span>贡献点</span><span>碎片</span></div>
            {[
              ['基础奖励', shown.baseReward],
              ['难度加成', shown.difficultyBonus],
              ['评分加成', shown.performanceBonus],
              ['表现奖励', shown.specialBonus],
              ['完整奖励', shown.finalReward],
              ['既有发放', shown.legacyOffset],
              ['B.5.3 实际发放', shown.grantedReward],
            ].map(([label, a]) => {
              const x = a as { xp: number; contribution: number; fragments: number };
              return <div className="dev-reward-row" key={label as string}><span>{label as string}</span><span>{fmt(x.xp)}</span><span>{fmt(x.contribution)}</span><span>{fmt(x.fragments)}</span></div>;
            })}
          </div>

          <div className="dev-stats-grid">
            <span>奖励 ID：<b>{shown.rewardId}</b></span>
            <span>发放时间：<b>{shown.grantedAt ? new Date(shown.grantedAt).toLocaleTimeString() : '—'}</b></span>
          </div>

          <details className="dev-stats-json">
            <summary>查看奖励计算明细 JSON</summary>
            <pre>{JSON.stringify(shown.rewardBreakdown, null, 2)}</pre>
          </details>
          <details className="dev-stats-json">
            <summary>查看完整奖励记录 JSON</summary>
            <pre>{JSON.stringify(shown, null, 2)}</pre>
          </details>
        </>
      )}
      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        说明：B.5.3 奖励版本 {BOSS_REWARD_VERSION}；基础/难度奖励由现有首胜事务发放，本面板只展示/预览增量，不修改经济或历史记录。生产构建中不可见。
      </div>
    </div>
  );
}
