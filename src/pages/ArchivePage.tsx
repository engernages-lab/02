import { useGame } from '../store/gameStore';
import { MEMORY_FRAGMENTS } from '../game/story';
import { PROLOGUE_LINES } from '../game/lore/prologue';
import { CHARACTERS, characterUnlocked } from '../game/lore/characters';
import { STORY_EVENTS, normalizeStoryReadState, eventReadProgress } from '../game/lore/events';
import { dialogueById } from '../game/lore/dialogue';
import { CREATOR_FRAGMENTS, fragmentProgress, hasFragment } from '../game/lore/fragments';
import { displayNameOf } from '../game/identity';
import { play } from '../services/sound';

export default function ArchivePage() {
  const g = useGame();
  const p = g.player;
  const seen = p.progress.storySeen;
  const prologueSeen = PROLOGUE_LINES.filter(n => seen[n.id] || seen['prologue_' + n.id]);
  const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
  const flags = p.progress.flags || {};
  const fp = fragmentProgress(p.meta.memoryFragments);

  return (
    <div className="page page-anim">
      <div className="page-inner" style={{ maxWidth: 960 }}>
        <div className="hud">
          <div>
            <div className="hud-title">剧情档案</div>
            <div className="hud-sub">角色档案 · 剧情事件 · 已记录的对话与记忆碎片</div>
          </div>
          <div className="hud-spacer" />
          <span className="hud-chip cyan">显示名 {displayNameOf(p)}</span>
          <span className="hud-chip">碎片 {fp.owned} / {fp.total}</span>
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 返回</button>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">核心角色档案<span className="panel-tag">CHARACTERS</span></div>
          <div className="grid-2">
            {CHARACTERS.map(c => {
              const open = characterUnlocked(c, flags);
              const isPlayer = c.id === 'r07';
              const shownName = isPlayer ? displayNameOf(p) : c.name;
              return (
                <div key={c.id} className="panel" style={{ margin: 0, borderColor: open ? c.color + '55' : undefined }}>
                  <div className="panel-title" style={{ color: open ? c.color : '#4A6E85' }}>
                    {open ? shownName : '？？？'}
                    <span className="panel-tag">{open ? c.role : '档案加密'}</span>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.8, color: open ? '#C6D9E6' : '#4A6E85' }}>
                    {open ? c.bio : '继续推进主线以解锁该角色的档案。'}
                  </div>
                  {open && (
                    <>
                      <div className="dim" style={{ fontSize: 12, marginTop: 6 }}>{c.quote}</div>
                      {isPlayer && c.originCode && (
                        <span className="chip cyan" style={{ marginTop: 8 }}>编号 {c.originCode}（固定，不随改名改变）</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">剧情事件<span className="panel-tag">已解锁 {story.unlocked.length} / {STORY_EVENTS.length}</span></div>
          {STORY_EVENTS.map(e => {
            const seq = dialogueById(e.id);
            const prog = seq ? eventReadProgress(story, seq.nodes.map(n => n.id)) : { read: 0, total: 0 };
            const unlocked = story.unlocked.includes(e.id) || prog.read > 0;
            return (
              <div className="pf-kv" key={e.id}>
                <span className="k" style={{ color: unlocked ? undefined : '#4A6E85' }}>
                  {unlocked ? '◈ ' : '🔒 '}{e.title}
                </span>
                <span className="v">
                  {unlocked
                    ? (prog.total > 0 ? '已读 ' + prog.read + ' / ' + prog.total + ' 句' : '已解锁')
                    : '未解锁'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">创世主碎片 · 六枚<span className="panel-tag">{fp.owned} / {fp.total}</span></div>
          <div className="dim" style={{ fontSize: 12.5, marginBottom: 8 }}>
            每枚碎片对应一章的章节 Boss，只能通过首次成功击败该 Boss 获得（旧存档已收集的碎片不会收回）。
          </div>
          {CREATOR_FRAGMENTS.map(f => {
            const has = hasFragment(p.meta.memoryFragments, f.id);
            return (
              <div className={'frag-card' + (has ? '' : ' locked')} key={f.id} style={{ opacity: has ? 1 : 0.55 }}>
                <div className="fc-title">◇ {has ? f.title : '？？？（第 ' + f.order + ' 枚）'}</div>
                <div className="fc-body">{has ? f.content : '尚未获得 · 对应章节：' + f.chapter.toUpperCase()}</div>
              </div>
            );
          })}
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">序章 · 沉睡的意识</div>
          {prologueSeen.length === 0 && <div className="empty-hint">还未记录任何剧情对话。开始新游戏后会自动记录。</div>}
          {prologueSeen.map(n => (
            <div className="archive-line" key={n.id}>
              <div className="al-speaker">{n.speaker}</div>
              <div className="al-text">{n.text}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">记忆残片<span className="panel-tag">旧档案</span></div>
          {p.meta.memoryFragments.length === 0 && <div className="empty-hint">尚未收集到任何碎片。</div>}
          {MEMORY_FRAGMENTS.filter(f => p.meta.memoryFragments.includes(f.id)).map(f => (
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
