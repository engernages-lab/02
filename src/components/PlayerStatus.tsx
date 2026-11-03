import { useGame } from '../store/gameStore';
import { milestone, titleForLevel } from '../game/progression';

export default function PlayerStatus({ showTolerance = false, compact = false }: { showTolerance?: boolean; compact?: boolean }) {
  const { player, tolerance, event } = useGame();
  const ms = milestone(player.exp);
  const c = player.consciousness;
  const cZone = c >= 81 ? 'green' : c >= 61 ? '' : c >= 41 ? 'orange' : c >= 21 ? 'orange' : 'red';
  const level = player.progress.currentLevelId;
  const att = level ? player.progress.failedAttempts[level] || 0 : 0;

  return (
    <div className="pl-card">
      {!compact && (
        <div className="pl-top">
          <div className="pl-core">R</div>
          <div>
            <div className="pl-name">{player.name}</div>
            <div className="pl-level">Lv.{player.level} · {titleForLevel(player.level)}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="chip cyan">容错 {tolerance}</div>
          </div>
        </div>
      )}
      <div className="pl-row">
        <div className="bar-labels"><span>经验 {player.exp}</span><span>{ms.maxed ? 'MAX' : 'Lv.' + (ms.level + 1) + ' 需 ' + ms.need}</span></div>
        <div className="bar"><div className="bar-fill" style={{ width: ms.maxed ? '100%' : Math.min(100, (ms.into / ms.need) * 100) + '%' }} /></div>
      </div>
      <div className="pl-row">
        <div className="bar-labels"><span>意识完整度</span><span className={c <= 20 ? 'red warn-flash' : ''}>{c}%</span></div>
        <div className="bar"><div className={'bar-fill ' + cZone + (c <= 20 ? ' pulse' : '')} style={{ width: c + '%' }} /></div>
      </div>
      {showTolerance && (
        <div className="pl-row">
          <div className="bar-labels"><span>本关失败提交</span><span className={att >= tolerance ? 'red' : ''}>{att} / {tolerance}</span></div>
          <div className="tolerance-dots" style={{ marginTop: 4 }}>
            {Array.from({ length: Math.max(tolerance, att) }).map((_, i) => (
              <span key={i} className={'dot' + (i < att ? (i >= tolerance ? ' over' : ' filled') : '')} />
            ))}
          </div>
        </div>
      )}
      {compact && (
        <div className="row">
          <span className="badge">Lv.{player.level}</span>
          <span className="chip">{titleForLevel(player.level)}</span>
          {event.kind !== 'none' && <span className="chip red warn-flash">危险</span>}
        </div>
      )}
    </div>
  );
}
