import { useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import { buildTimeline } from '../game/timeline';
import { BUG_CODEX } from '../game/codex';
import { play } from '../services/sound';

/** 探索档案：剧情时间线 + Bug 图鉴（只展示已解锁内容） */
export default function JournalPage() {
  const g = useGame();
  const p = g.player;
  const entries = useMemo(() => buildTimeline(p), [p]);
  const log = p.meta.bugCodex || {};
  const [tab, setTab] = useState<'timeline' | 'codex'>('timeline');
  const found = BUG_CODEX.filter(b => log[b.id]);
  const maxCount = Math.max(1, ...Object.values(log).map(v => v.count || 0));

  return (
    <div className="page page-anim">
      <div className="page-inner" style={{ maxWidth: 940 }}>
        <div className="hud">
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
          <div>
            <div className="hud-title">探索档案</div>
            <div className="hud-sub">剧情时间线 · Bug 图鉴</div>
          </div>
          <div className="hud-spacer" />
          <span className="hud-chip cyan">已归档 {found.length} / {BUG_CODEX.length}</span>
        </div>

        <div className="shop-tabs" style={{ marginBottom: 12 }}>
          <button className={'shop-tab' + (tab === 'timeline' ? ' on' : '')} onClick={() => { play('click'); setTab('timeline'); }}>剧情时间线</button>
          <button className={'shop-tab' + (tab === 'codex' ? ' on' : '')} onClick={() => { play('click'); setTab('codex'); }}>Bug 图鉴</button>
        </div>

        {tab === 'timeline' && (
          <div className="panel">
            <div className="panel-title">时间线<span className="panel-tag">{entries.filter(e => !e.locked).length} / {entries.length}</span></div>
            <div className="tl-list">
              {entries.map(e => (
                <div className={'tl-item' + (e.locked ? ' locked' : '') + ' k-' + e.kind} key={e.id}>
                  <span className="tl-dot" />
                  <div className="tl-main">
                    <div className="tl-title">{e.locked ? '🔒 ' + e.title : e.title}</div>
                    <div className="tl-desc">{e.desc}</div>
                  </div>
                  <span className={'chip' + (e.kind === 'memory' ? ' gold' : e.kind === 'mira' ? ' cyan' : e.kind === 'growth' ? ' green' : '')}>
                    {e.kind === 'memory' ? '恩格尔' : e.kind === 'mira' ? 'MIRA' : e.kind === 'growth' ? '成长' : '主线'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'codex' && (
          <div className="panel">
            <div className="panel-title">Bug 图鉴<span className="panel-tag">遭遇后自动归档</span></div>
            <div className="codex-grid">
              {BUG_CODEX.map(b => {
                const rec = log[b.id];
                return (
                  <div className={'codex-card' + (rec ? ' found' : ' locked')} key={b.id}>
                    <div className="cx-head">
                      <span className="cx-err">{rec ? b.error : '？？？'}</span>
                      {rec && <span className="chip">{rec.count} 次</span>}
                    </div>
                    <div className="cx-title">{rec ? b.title : '未遭遇的错误类型'}</div>
                    <div className="cx-desc">{rec ? b.desc : '在关卡中遇到该错误后自动解锁。'}</div>
                    {rec && <div className="cx-fix">修复要点：{b.fix}</div>}
                    {rec && <div className="cx-bar"><span style={{ width: Math.round((rec.count / maxCount) * 100) + '%' }} /></div>}
                    <div className="cx-levels">{b.levelIds.map(id => <span key={id} className="chip dim">{id}</span>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
