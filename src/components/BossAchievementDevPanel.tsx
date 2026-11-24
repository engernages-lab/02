import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import type { BossBattleStatsState } from '../game/bossBattleStats';
import { findBossBattleRating } from '../game/bossBattleRating';
import { findBossBattleReward } from '../game/bossBattleReward';
import {
  BOSS_ACHIEVEMENT_CATEGORY_LABEL,
  BOSS_ACHIEVEMENT_DEFINITIONS,
  BOSS_ACHIEVEMENT_LEVEL_LABEL,
} from '../game/bossAchievementConfig';
import {
  evaluateBossAchievements,
  type BossAchievementEvaluation,
} from '../game/bossAchievementEngine';
import { emptyBossAchievementStore } from '../game/bossAchievementStore';
import { devToolsOn } from '../game/devMode';

const fmtTime = (t: number | null | undefined) => (t ? new Date(t).toLocaleString() : '—');

/** 仅 DEV：Boss 隐藏成就全量调试（只读，不写正式解锁/奖励） */
export default function BossAchievementDevPanel({ bossId }: { bossId: string }) {
  const g = useGame();
  const [preview, setPreview] = useState<BossAchievementEvaluation | null>(null);
  const [msg, setMsg] = useState('');

  const statsStore = g.player.progress.bossBattleStats;
  const latestStats: BossBattleStatsState | null = statsStore
    ? [...statsStore.history].filter(s => s.bossId === bossId && s.finalized).sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0)).pop() || null
    : null;
  const store = g.player.progress.bossAchievements || emptyBossAchievementStore();
  const unlockedMap = new Map(store.unlocked.map(u => [u.achievementId, u]));
  const progressMap = new Map(store.progress.map(p => [p.achievementId, p]));

  useEffect(() => {
    setPreview(null);
    setMsg('');
  }, [latestStats ? latestStats.battleId : '']);

  if (!devToolsOn()) return null;

  const rerun = () => {
    if (!latestStats) { setMsg('没有可用的最终统计快照。'); return; }
    try {
      const rating = findBossBattleRating(g.player.progress.bossBattleRatings, latestStats.battleId);
      const reward = findBossBattleReward(g.player.progress.bossBattleRewards, latestStats.battleId);
      setPreview(evaluateBossAchievements({
        stats: latestStats,
        rating,
        reward,
        bossId,
        difficulty: latestStats.difficulty,
        battleResult: 'victory',
        unlockedIds: store.unlocked.map(u => u.achievementId),
        now: Date.now(),
      }));
      setMsg('已重算成就预览（不写入正式解锁，不发奖励）。');
    } catch {
      setMsg('成就预览失败。');
    }
  };

  const exportJson = () => {
    try {
      const data = preview || {
        unlocked: store.unlocked,
        progress: store.progress,
        rewardHistory: store.rewardHistory,
        eventDeduplication: store.eventDeduplication,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'boss-achievements-preview.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg('已导出成就 JSON。');
    } catch {
      setMsg('导出失败（浏览器限制）。');
    }
  };

  return (
    <div className="panel dev-achievement-panel">
      <div className="panel-title">DEV · Boss 隐藏成就<span className="panel-tag">全量 / 只读</span></div>
      <div className="dev-phase-row">
        <button className="nxbtn small" disabled={!latestStats} onClick={rerun}>重算预览</button>
        <button className="nxbtn small ghost" onClick={exportJson}>导出 JSON</button>
      </div>
      <div className="dev-stats-grid">
        <span>Boss：<b>{bossId}</b></span>
        <span>战斗：<b>{latestStats ? latestStats.battleId : '—'}</b></span>
        <span>完整性：<b>{latestStats ? latestStats.dataQuality : '—'}</b></span>
        <span>已解锁：<b>{store.unlocked.length}</b> / {BOSS_ACHIEVEMENT_DEFINITIONS.length}</span>
        {preview && <span>预览资格：<b>{preview.formalEligible ? '正式' : preview.rejectionReason || '不完整'}</b></span>}
      </div>

      <div className="dev-achievement-list">
        {BOSS_ACHIEVEMENT_DEFINITIONS.map(def => {
          const unlock = unlockedMap.get(def.id);
          const prog = progressMap.get(def.id);
          const previewItem = preview?.evaluated.find(e => e.achievementId === def.id);
          const completed = !!unlock || !!previewItem?.completed;
          return (
            <div key={def.id} className={'dev-achievement-row' + (completed ? ' completed' : '') + (def.hidden ? ' hidden' : '')}>
              <span className="dar-icon">{def.icon}</span>
              <span className="dar-main">
                <b>{def.name}</b>
                <span className="dim"> · {def.id} · {BOSS_ACHIEVEMENT_CATEGORY_LABEL[def.category]} · {BOSS_ACHIEVEMENT_LEVEL_LABEL[def.level]}{def.hidden ? ' · 隐藏' : ''}</span>
                <span className="dar-desc">{def.description}</span>
              </span>
              <span className="dar-state">
                {unlock ? <b className="ok">已解锁 {fmtTime(unlock.unlockedAt)}</b>
                  : <span>进度 {prog?.progress ?? previewItem?.progress ?? 0} / {prog?.target ?? previewItem?.target ?? 1}{previewItem && !previewItem.applicable ? ' · ' + (previewItem.reason || '不可用') : ''}</span>}
                <span className="dar-reward">+{def.reward.xp} XP · +{def.reward.contribution} 贡献</span>
              </span>
            </div>
          );
        })}
      </div>

      {preview && (
        <>
          <div className="dev-stats-sub">判定结果</div>
          <div className="dev-stats-grid">
            <span>新解锁：<b>{preview.newlyUnlocked.map(x => x.achievementId).join(', ') || '—'}</b></span>
            <span>拒绝：<b>{preview.rejectedAchievements.map(x => x.achievementId + ':' + x.reason).join(', ') || '—'}</b></span>
          </div>
          {preview.newlyUnlocked[0] && (
            <details className="dev-stats-json">
              <summary>查看首个新成就证据</summary>
              <pre>{JSON.stringify(preview.newlyUnlocked[0], null, 2)}</pre>
            </details>
          )}
        </>
      )}
      <details className="dev-stats-json">
        <summary>查看成就存储 JSON</summary>
        <pre>{JSON.stringify(store, null, 2)}</pre>
      </details>

      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        说明：成就预览只读取最终统计/正式评分/正式奖励；不写入正式解锁、不发经济奖励。生产构建中不可见。
      </div>
    </div>
  );
}
