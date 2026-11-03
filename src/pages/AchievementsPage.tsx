import { ACHIEVEMENTS } from '../game/achievements';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';

export default function AchievementsPage() {
  const g = useGame();
  const got = g.player.progress.achievements;
  const unlocked = ACHIEVEMENTS.filter(a => got.includes(a.id));
  const locked = ACHIEVEMENTS.filter(a => !got.includes(a.id));

  return (
    <div className="page page-anim">
      <div className="page-inner" style={{ maxWidth: 980 }}>
        <div className="hud">
          <div>
            <div className="hud-title">成就系统</div>
            <div className="hud-sub">已解锁 {unlocked.length} / {ACHIEVEMENTS.length}</div>
          </div>
          <div className="hud-spacer" />
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 返回</button>
        </div>
        <div className="grid-3">
          {[...unlocked, ...locked].map(a => (
            <div key={a.id} className={'ach-card' + (got.includes(a.id) ? ' unlocked' : '')}>
              <div className="ac-icon">{got.includes(a.id) ? a.icon : '🔒'}</div>
              <div className="ac-name">{got.includes(a.id) ? a.name : (a.hidden ? '？？？' : a.name)}</div>
              <div className="ac-desc">{got.includes(a.id) ? a.desc : (a.hidden ? '隐藏成就：达成条件未知' : a.desc)}</div>
              {got.includes(a.id) && <div className="chip green" style={{ marginTop: 8 }}>✓ 已解锁</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
