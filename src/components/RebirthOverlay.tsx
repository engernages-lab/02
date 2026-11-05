import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import { rebirthScript } from '../game/story';
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
  const [phase, setPhase] = useState<'collapse' | 'console' | 'dialog'>('collapse');
  const [conIdx, setConIdx] = useState(0);
  const script = useMemo(() => rebirthScript(g.player.meta.rebirths), [g.player.meta.rebirths]);

  useEffect(() => {
    if (phase === 'collapse') {
      const t = window.setTimeout(() => { setPhase('console'); setConIdx(0); play('rebirth'); }, 2600);
      return () => window.clearTimeout(t);
    }
    if (phase === 'console') {
      if (conIdx >= REBOOT_LINES.length) {
        const t = window.setTimeout(() => setPhase('dialog'), 800);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setConIdx(i => i + 1), 430);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [phase, conIdx]);

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
