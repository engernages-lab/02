import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import type { BossBattleStatsState } from '../game/bossBattleStats';
import { buildBossSettlementData, type BossSettlementData, type SettlementAchievement, type SettlementDimension } from '../game/bossSettlement';
import { BOSS_ACHIEVEMENT_DEFINITIONS } from '../game/bossAchievementConfig';
import { devToolsOn } from '../game/devMode';

const clone = (x: BossSettlementData): BossSettlementData => JSON.parse(JSON.stringify(x));

const DIM_LABELS: { key: string; label: string }[] = [
  { key: 'survival', label: '生存表现' },
  { key: 'challenge', label: '代码挑战' },
  { key: 'tactics', label: '战术操作' },
  { key: 'weakness', label: '弱点破解' },
  { key: 'crisis', label: '危机处理' },
];

function demoDimensions(score: number): SettlementDimension[] {
  return DIM_LABELS.map((d, i) => ({
    key: d.key, label: d.label, score: Math.max(0, Math.min(100, score - i * 2)),
    maxScore: 25, weight: 20, effectiveWeight: 0.2, availability: 'available',
    available: true, reason: 'DEV 预览数据',
  }));
}

function demoAchievement(index: number, level = 'Gold'): SettlementAchievement {
  const def = BOSS_ACHIEVEMENT_DEFINITIONS[index % BOSS_ACHIEVEMENT_DEFINITIONS.length];
  return {
    achievementId: def.id + '-dev-' + index,
    name: def.name, description: def.description, category: def.category,
    level, hidden: def.hidden, icon: def.icon,
    reward: { xp: 80, contribution: 40, fragments: 0 },
    unlockedAt: Date.now(), evidence: 'DEV 预览证据（不写入正式存档）',
  };
}

/** 仅 DEV：结算状态/评分/异常数据全量预览，所有数据仅存在内存 */
export default function BossSettlementDevPanel({ bossId, onPreview }: { bossId: string; onPreview: (data: BossSettlementData) => void }) {
  const g = useGame();
  const [base, setBase] = useState<BossSettlementData | null>(null);
  const [msg, setMsg] = useState('');

  const statsStore = g.player.progress.bossBattleStats;
  const latestStats: BossBattleStatsState | null = statsStore
    ? [...statsStore.history].filter(s => s.bossId === bossId && s.finalized).sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0)).pop() || null
    : null;

  useEffect(() => {
    if (!latestStats) { setBase(null); return; }
    setBase(buildBossSettlementData(g.player, latestStats.battleId, { now: Date.now() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestStats ? latestStats.battleId : '']);

  if (!devToolsOn()) return null;

  const preview = (mutator: (d: BossSettlementData) => void, label: string) => {
    if (!base) { setMsg('需要至少一场已终结战斗才能预览。'); return; }
    const d = clone(base);
    mutator(d);
    onPreview(d);
    setMsg('已打开 DEV 结算预览：' + label + '（不写入存档/不发奖励）。');
  };
  const setOutcome = (d: BossSettlementData, outcome: 'victory' | 'defeat' | 'retreat') => {
    d.outcome = outcome;
    d.resultCode = outcome === 'victory' ? 'VICTORY' : outcome === 'defeat' ? 'DEFEAT' : 'RETREAT';
    d.outcomeTitle = outcome === 'victory' ? 'BOSS DEFEATED' : outcome === 'defeat' ? 'SYSTEM FAILURE' : 'MISSION ABORTED';
    d.outcomeSubtitle = outcome === 'victory' ? '目标已消除' : outcome === 'defeat' ? '系统修复失败' : '任务已撤离';
    if (outcome !== 'victory') {
      d.rating = null;
      d.reward = { ...d.reward, available: false, granted: false, reason: 'DEV 失败预览' };
      d.achievements = [];
      d.achievementCount = 0;
    }
  };
  const setGrade = (d: BossSettlementData, grade: string, score: number) => {
    d.rating = {
      available: true, finalized: true, grade, displayScore: score, totalScore: score,
      dataQuality: 'complete', ratingVersion: 'v1.0.0', reasons: ['DEV 评分预览：' + grade + ' 级。'],
      highlights: ['DEV 预览亮点'], weaknesses: ['DEV 预览改进项'],
      dimensions: demoDimensions(score),
    };
  };

  return (
    <div className="panel dev-settlement-panel">
      <div className="panel-title">DEV · 结算 UI 预览<span className="panel-tag">内存数据 / 不写存档</span></div>
      <div className="dev-settlement-buttons">
        <button className="nxbtn small" onClick={() => preview(d => setOutcome(d, 'victory'), 'Victory')}>Victory</button>
        <button className="nxbtn small" onClick={() => preview(d => setOutcome(d, 'defeat'), 'Defeat')}>Defeat</button>
        <button className="nxbtn small" onClick={() => preview(d => setOutcome(d, 'retreat'), 'Retreat')}>Retreat</button>
        {['S', 'A', 'B', 'C', 'D'].map((g, i) => (
          <button key={g} className="nxbtn small" onClick={() => preview(d => { setOutcome(d, 'victory'); setGrade(d, g, [96, 85, 75, 65, 50][i]); }, g + ' Rank')}>{g} Rank</button>
        ))}
        <button className="nxbtn small" onClick={() => preview(d => { d.dataQuality = 'partial'; if (d.rating) d.rating.dataQuality = 'partial'; }, 'Partial')}>Partial</button>
        <button className="nxbtn small" onClick={() => preview(d => { d.dataQuality = 'invalid'; d.rating = null; d.reward = { ...d.reward, available: false, reason: 'DEV invalid 预览' }; }, 'Invalid')}>Invalid</button>
        <button className="nxbtn small" onClick={() => preview(d => { d.achievements = []; d.achievementCount = 0; }, 'No Achievement')}>No Achievement</button>
        <button className="nxbtn small" onClick={() => preview(d => { d.achievements = [demoAchievement(0), demoAchievement(1), demoAchievement(2)]; d.achievementCount = 3; }, 'Multiple Achievements')}>Multiple</button>
        <button className="nxbtn small" onClick={() => preview(d => { d.achievements = [demoAchievement(0, 'Platinum')]; d.achievementCount = 1; }, 'Platinum Achievement')}>Platinum</button>
      </div>
      <div className="dev-stats-grid">
        <span>当前战斗：<b>{latestStats ? latestStats.battleId : '—'}</b></span>
        <span>基础数据：<b>{base ? base.resultCode : '—'}</b></span>
        <span>可预览：<b>{base ? '是' : '需要已终结战斗'}</b></span>
      </div>
      {msg && <div className="dev-phase-msg">{msg}</div>}
      <details className="dev-stats-json">
        <summary>查看当前结算基础 JSON</summary>
        <pre>{base ? JSON.stringify(base, null, 2) : '—'}</pre>
      </details>
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        所有预览仅存在组件内存；不修改战斗、统计、评分、奖励、成就或经济。生产构建中不可见。
      </div>
    </div>
  );
}
