import { useMemo, useState } from 'react';
import { KNOWLEDGE, type KnowledgeCard } from '../game/knowledge';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';

export default function KnowledgePage() {
  const g = useGame();
  const [kw, setKw] = useState('');
  const [open, setOpen] = useState<KnowledgeCard | null>(null);

  const groups = useMemo(() => {
    const map: Record<string, KnowledgeCard[]> = {};
    for (const k of KNOWLEDGE) {
      if (kw && !k.title.includes(kw) && !k.group.includes(kw)) continue;
      (map[k.group] = map[k.group] || []).push(k);
    }
    return map;
  }, [kw]);

  return (
    <div className="page page-anim">
      <div className="page-inner">
        <div className="hud">
          <div>
            <div className="hud-title">Python 知识库</div>
            <div className="hud-sub">通关获得的知识卡片会自动点亮</div>
          </div>
          <div className="hud-spacer" />
          <input placeholder="搜索知识点…" value={kw} onChange={e => setKw(e.target.value)}
            style={{ background: 'rgba(13,27,40,0.8)', border: '1px solid var(--line)', color: '#EAF3FA', borderRadius: 8, padding: '7px 12px', outline: 'none', width: 180 }} />
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 返回</button>
        </div>

        {Object.entries(groups).map(([group, cards]) => (
          <div key={group} style={{ marginBottom: 16 }}>
            <div className="panel-title" style={{ marginBottom: 8 }}>{group}</div>
            <div className="grid-2">
              {cards.map(k => {
                const unlocked = g.player.progress.knowledge.includes(k.id);
                return (
                  <div key={k.id} className={'know-card' + (unlocked ? '' : ' locked')}
                    onClick={() => { if (unlocked) { play('click'); setOpen(k); } }}>
                    <div className="kc-group">{group}{unlocked ? '' : ' · 🔒 未解锁'}</div>
                    <div className="kc-title">{k.title}</div>
                    <div className="kc-brief">{k.brief}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(groups).length === 0 && <div className="empty-hint">没有匹配的知识点。</div>}

        {open && (
          <div className="modal-mask" onClick={() => setOpen(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{open.title}</h3>
              <div className="dim" style={{ fontSize: 13, marginBottom: 8 }}>{open.brief}</div>
              <div className="code-example">{open.example}</div>
              <strong style={{ color: 'var(--orange)', fontSize: 13.5 }}>易错点：</strong>
              <ul className="pitfall-list">{open.pitfalls.map((p, i) => <li key={i}>{p}</li>)}</ul>
              <div className="modal-actions">
                <button className="nxbtn" onClick={() => setOpen(null)}>关闭</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
