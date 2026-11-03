import { HINT_MAX } from '../services/ai';
import type { ReactNode } from 'react';

export interface MiraPanelProps {
  message: string;
  msgTag?: string;
  hintUsed: number;
  onAskHint?: () => void;
  extra?: ReactNode;
}

export default function MiraPanel({ message, msgTag = 'MIRA', hintUsed, onAskHint, extra }: MiraPanelProps) {
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
          <button className="nxbtn small" onClick={onAskHint} disabled={!onAskHint}>
            {exhausted ? '提示已用尽' : 'MIRA 提示'}
          </button>
        </div>
      </div>
      <div className="mira-msg" key={msgTag + message.slice(0, 12)}>
        <span className="mira-tag">◈ {msgTag}</span>
        {message}
      </div>
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
