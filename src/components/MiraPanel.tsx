import { useEffect } from 'react';
import { HINT_MAX } from '../services/ai';
import { useGame } from '../store/gameStore';
import { miraLevelProgress, miraRiskFor, miraMemoryById, MIRA_STAGE_LABEL, normalizeMiraState } from '../game/miraCore';
import type { ReactNode } from 'react';

export interface MiraPanelProps {
  message: string;
  msgTag?: string;
  hintUsed: number;
  onAskHint?: () => void;
  extra?: ReactNode;
}

export default function MiraPanel({ message, msgTag = 'MIRA', hintUsed, onAskHint, extra }: MiraPanelProps) {
  const g = useGame();
  useEffect(() => { g.miraEnsureContact(); }, [g.miraEnsureContact]);
  const mira = normalizeMiraState(g.player.mira);
  const progress = miraLevelProgress(mira);
  const latestMemory = Object.entries(mira.memories)
    .sort((a, b) => b[1].unlockedAt - a[1].unlockedAt)
    .map(([id]) => miraMemoryById(id))
    .find(Boolean);
  const consecutiveFails = Math.max(0, ...Object.values(g.player.progress.failedAttempts || {}));
  const risk = miraRiskFor({ consciousness: g.player.consciousness, consecutiveFails })[0];
  const exhausted = hintUsed >= HINT_MAX;
  return (
    <div className="mira-box">
      <div className="mira-head">
        <div className="mira-avatar">M</div>
        <div>
          <div className="mira-name">MIRA</div>
          <div className="mira-status">智能维修助手 · ONLINE</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="nxbtn small" onClick={onAskHint} disabled={!onAskHint || exhausted}>
            {exhausted ? '提示已用尽' : 'MIRA 提示'}
          </button>
        </div>
      </div>
      <div className="mira-growth">
        <span className="mira-lv">Lv.{progress.level} · {MIRA_STAGE_LABEL[mira.stage]}</span>
        <span className="mira-xp">{progress.exp} / {progress.next} XP</span>
        <span className="mira-mem">记忆 {Object.keys(mira.memories).length}/{6}</span>
        <div className="mira-xp-track"><i style={{ width: progress.pct + '%' }} /></div>
      </div>
      <div className={'mira-risk risk-' + risk.level}>{risk.text}</div>
      <div className="mira-msg" key={msgTag + message.slice(0, 12)}>
        <span className="mira-tag">◈ {msgTag}</span>
        {message}
      </div>
      {latestMemory && <div className="mira-latest-memory">最近记忆 · {latestMemory.name}：{latestMemory.mira}</div>}
      <div className="row" style={{ gap: 6 }}>
        <span className="chip">提示深度</span>
        {Array.from({ length: HINT_MAX }).map((_, i) => (
          <span key={i} className={'chip' + (i < hintUsed ? ' cyan' : ' dim')} style={{ padding: '1px 8px' }}>
            {i < hintUsed ? 'L' + (i + 1) + ' ✓' : 'L' + (i + 1)}
          </span>
        ))}
      </div>
      {extra}
    </div>
  );
}
