import { useGame } from '../store/gameStore';
import { MEMORY_FRAGMENTS, PROLOGUE } from '../game/story';
import { play } from '../services/sound';

export default function ArchivePage() {
  const g = useGame();
  const seen = g.player.progress.storySeen;
  const prologueSeen = PROLOGUE.filter(n => seen['prologue_' + n.id]);

  return (
    <div className="page page-anim">
      <div className="page-inner" style={{ maxWidth: 900 }}>
        <div className="hud">
          <div>
            <div className="hud-title">剧情档案</div>
            <div className="hud-sub">已记录的对话与记忆碎片</div>
          </div>
          <div className="hud-spacer" />
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 返回</button>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">序章 · 苏醒</div>
          {prologueSeen.length === 0 && <div className="empty-hint">还未记录任何剧情对话。开始新游戏后会自动记录。</div>}
          {prologueSeen.map(n => (
            <div className="archive-line" key={n.id}>
              <div className="al-speaker">{n.speaker}</div>
              <div className="al-text">{n.text}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">创世主记忆碎片</div>
          {g.player.meta.memoryFragments.length === 0 && <div className="empty-hint">尚未收集到任何碎片。</div>}
          {MEMORY_FRAGMENTS.filter(f => g.player.meta.memoryFragments.includes(f.id)).map(f => (
            <div className="frag-card" key={f.id}>
              <div className="fc-title">◇ {f.title}</div>
              <div className="fc-body">{f.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
