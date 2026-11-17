import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import { rebirthScript } from '../game/story';
import { levelById } from '../game/levels';
import { formatDuration } from '../game/challengeSession';
import ParticlesField from './ParticlesField';
import DialogSystem from './DialogSystem';
import { play } from '../services/sound';

const REBOOT_LINES = [
  'CONSCIOUSNESS COLLAPSE.',
  'SEARCHING FOR ORIGIN BACKUP...',
  'VALID BACKUP FOUND.',
  'RECONSTRUCTING SILICON BODY...',
  'SYNC COMPLETE.',
  'R-07 REBORN.',
];

export default function RebirthOverlay() {
  const g = useGame();
  const [phase, setPhase] = useState<'collapse' | 'console' | 'settle' | 'dialog'>('collapse');
  const [conIdx, setConIdx] = useState(0);
  const script = useMemo(() => rebirthScript(g.player.meta.rebirths), [g.player.meta.rebirths]);
  const deadLevelId = g.event.kind === 'death' ? g.event.levelId : null;
  const settlement = deadLevelId ? g.player.progress.challengeSessions?.[deadLevelId]?.settlement : null;

  useEffect(() => {
    if (phase === 'collapse') {
      const t = window.setTimeout(() => { setPhase('console'); setConIdx(0); play('rebirth'); }, 2600);
      return () => window.clearTimeout(t);
    }
    if (phase === 'console') {
      if (conIdx >= REBOOT_LINES.length) {
        const t = window.setTimeout(() => setPhase(settlement ? 'settle' : 'dialog'), 800);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setConIdx(i => i + 1), 430);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [phase, conIdx, settlement]);

  return (
    <div className="overlay ov-death">
      {phase === 'collapse' && (
        <div style={{ textAlign: 'center' }}>
          <div className="enemy-wrap"><div className="enemy-hex" style={{ width: 120, height: 120, fontSize: 46, color: '#FF8B92', animationDuration: '0.6s' }} /></div>
          <div className="glitch-text" style={{ fontSize: 30, marginTop: 16 }}>CONSCIOUSNESS COLLAPSE</div>
          <div className="att-line small" style={{ marginTop: 10, color: '#C98A8F' }}>意识核心崩解 —— 正在尝试原初重组协议…</div>
        </div>
      )}
      {phase === 'console' && (
        <div className="reb-stage">
          <div className="core-rebuild" style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
            <ParticlesField converge enabled={g.player.settings.animations} max={90} speed={1.4} colors={['#42D6D0', '#9FE8FF', '#3986C8']} />
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 56, height: 56, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #C9FBFF, #42D6D0 50%, #0B6B74 95%)', boxShadow: '0 0 40px rgba(66,214,208,0.9)', animation: 'corePulse 1.6s ease-in-out infinite' }} />
          </div>
          <div className="reb-console">
            {REBOOT_LINES.slice(0, conIdx).map((l, i) => (
              <p key={i} className={'rc-line' + (l.includes('REBORN') ? ' ok' : '')}>▸ {l}</p>
            ))}
          </div>
        </div>
      )}
      {phase === 'settle' && settlement && (
        <div className="reb-settle">
          <div className="rs-head">
            <span className="rs-ico">✕</span>
            <div>
              <div className="rs-title">挑战失败 · 结算</div>
              <div className="rs-sub">{levelById(deadLevelId || '')?.title || deadLevelId} · 本次挑战未完成</div>
            </div>
          </div>
          <div className="rs-grid">
            <div><span>失败原因</span><b>{settlement.reason || '意识完整度归零'}</b></div>
            <div><span>本次用时</span><b>{formatDuration(settlement.durationMs)}</b></div>
            <div><span>运行 / 提交</span><b>{settlement.runs} / {settlement.submits}</b></div>
            <div><span>错误次数</span><b>{settlement.errors}</b></div>
            <div><span>容错上限</span><b>{settlement.toleranceMax}</b></div>
            <div><span>已使用容错</span><b>{settlement.toleranceUsed}</b></div>
            <div><span>剩余容错</span><b>{settlement.toleranceRemaining}</b></div>
            <div><span>实际扣除</span><b>{settlement.resourceLoss ? '意识 -' + settlement.resourceLoss.amount + '%' : '无'}</b></div>
          </div>
          <div className="rs-note">
            惩罚已生效：意识完整度归零，将从原初备份重建。成长、已获奖励与已通关记录保留，不会重复发放。
          </div>
          {settlement.errors > settlement.toleranceMax && (
            <div className="rs-note" style={{ background: 'rgba(255,91,100,0.07)', borderColor: 'rgba(255,91,100,0.25)' }}>
              本次失误 {settlement.errors} 次，已超过本关容错上限 {settlement.toleranceMax} 次，结算按上限计。
            </div>
          )}
          <button className="nxbtn primary" onClick={() => { play('click'); setPhase('dialog'); }}>
            重新挑战 · 进入意识重组
          </button>
        </div>
      )}
      {phase === 'dialog' && (
        <DialogSystem
          nodes={script}
          frameTitle="ORIGIN PROTOCOL · 意识重组"
          eventId="rebirth"
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          onSeen={id => g.markStory('rb_' + id)}
          onDone={() => g.finishRebirth()}
        />
      )}
    </div>
  );
}
