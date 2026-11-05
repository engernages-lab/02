import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { milestone, titleForLevel, toleranceFor } from '../game/progression';
import { normalizeIdentity, ORIGIN_CODE, DISPLAY_NAME_MAX } from '../game/identity';
import { levelsOfServer, levelById } from '../game/levels';
import { KNOWLEDGE, knowledgeById } from '../game/knowledge';
import { ACHIEVEMENTS } from '../game/achievements';
import { CREATOR_FRAGMENTS, fragmentProgress, hasFragment } from '../game/lore/fragments';
import PlayerStatus from '../components/PlayerStatus';
import { play } from '../services/sound';

export default function ProfilePage() {
  const g = useGame();
  const p = g.player;
  const ms = milestone(p.exp);
  const identity = normalizeIdentity(p.identity, p.name);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState('');

  const startRename = () => {
    setNameDraft(identity.displayName);
    setNameError('');
    setEditingName(true);
  };
  const saveName = () => {
    const r = g.renamePlayer(nameDraft);
    if (!r.ok) { setNameError(r.reason || '该名称不可用。'); return; }
    setEditingName(false);
    setNameError('');
  };

  const allLevels = levelsOfServer('training')
    .concat(levelsOfServer('syntax'), levelsOfServer('logs'), levelsOfServer('storage'), levelsOfServer('factory'), levelsOfServer('diag'), levelsOfServer('core'));
  const totalStars = allLevels.reduce((s, l) => s + (p.progress.stars[l.id] || 0), 0);

  return (
    <div className="page page-anim">
      <div className="page-inner">
        <div className="hud">
          <div>
            <div className="hud-title">玩家档案</div>
            <div className="hud-sub">R-07 修复师数据总览</div>
          </div>
          <div className="hud-spacer" />
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 返回</button>
        </div>

        <div className="pf-grid">
          <div className="panel">
            <div className="panel-title">身份信息<span className="panel-tag">IDENTITY</span></div>
            <PlayerStatus />
            <div className="pf-kv" style={{ marginTop: 8 }}><span className="k">显示名称</span><span className="v">{identity.displayName}</span></div>
            <div className="pf-kv"><span className="k">原始实验编号</span><span className="v">{ORIGIN_CODE}（固定不可更改）</span></div>
            <div className="pf-kv"><span className="k">命名状态</span><span className="v">{identity.renamed ? '已自定义显示名' : '默认名称'}</span></div>
            {editingName ? (
              <div style={{ marginTop: 10 }}>
                <input
                  value={nameDraft}
                  maxLength={DISPLAY_NAME_MAX}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); }}
                  placeholder={'1–' + DISPLAY_NAME_MAX + ' 个字符'}
                  style={{ background: 'rgba(13,27,40,0.8)', border: '1px solid var(--line)', color: '#EAF3FA', borderRadius: 8, padding: '7px 12px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="nxbtn small primary" onClick={saveName}>保存名称</button>
                  <button className="nxbtn small ghost" onClick={() => { setEditingName(false); setNameError(''); }}>取消</button>
                </div>
                {nameError && <div className="red" style={{ fontSize: 12.5, marginTop: 6 }}>{nameError}</div>}
              </div>
            ) : (
              <button className="nxbtn small ghost" style={{ marginTop: 10 }} onClick={startRename}>修改显示名称</button>
            )}
            <div className="hint-note" style={{ marginTop: 8 }}>
              只修改显示名称。R-07 是永久实验编号，不会随改名改变。
            </div>
            <div className="pf-kv" style={{ marginTop: 8 }}><span className="k">修复师称号</span><span className="v">{titleForLevel(p.level)}</span></div>
            <div className="pf-kv"><span className="k">累计经验</span><span className="v">{p.exp}（{ms.maxed ? 'MAX' : '距 Lv.' + (ms.level + 1) + ' 还差 ' + Math.max(0, ms.need - ms.into) + ' 经验'}）</span></div>
            <div className="pf-kv"><span className="k">当前容错次数</span><span className="v">{toleranceFor(p.level)} 次 / 关</span></div>
          </div>

          <div className="panel">
            <div className="panel-title">修复进度</div>
            {allLevels.map(l => {
              const done = p.progress.completedLevels.includes(l.id);
              const stars = p.progress.stars[l.id] || 0;
              const name = levelById(l.id);
              return (
                <div className="pf-kv" key={l.id}>
                  <span className="k">{l.codename} {name?.title}</span>
                  <span className="v">{done ? '★'.repeat(stars) + ' 已修复' : '待修复'}</span>
                </div>
              );
            })}
            <div className="pf-kv"><span className="k">累计星级</span><span className="v">{totalStars} / {allLevels.length * 3}</span></div>
            <div className="pf-kv"><span className="k">已解锁服务器</span><span className="v">{p.progress.unlockedServers.length} 个</span></div>
          </div>

          <div className="panel">
            <div className="panel-title">意识记录</div>
            <div className="pf-kv"><span className="k">意识完整度</span><span className="v">{p.consciousness}%</span></div>
            <div className="pf-kv"><span className="k">累计死亡次数</span><span className="v">{p.meta.deaths}</span></div>
            <div className="pf-kv"><span className="k">意识重组次数</span><span className="v">{p.meta.rebirths}</span></div>
            <div className="pf-kv"><span className="k">最近死亡关卡</span><span className="v">{p.meta.lastDeathLevel ? levelById(p.meta.lastDeathLevel)?.title || p.meta.lastDeathLevel : '无记录'}</span></div>
            <div className="pf-kv"><span className="k">最近死亡原因</span><span className="v">{p.meta.lastDeathReason || '无记录'}</span></div>
            <div className="pf-kv"><span className="k">意识备份等级</span><span className="v">ORIGIN-v{p.meta.backupLevel}</span></div>
          </div>

          <div className="panel">
            <div className="panel-title">知识掌握</div>
            <div className="pf-kv"><span className="k">已收集知识卡片</span><span className="v">{p.progress.knowledge.length} / {KNOWLEDGE.length}</span></div>
            <div style={{ marginTop: 8 }}>
              {KNOWLEDGE.map(k => (
                <span key={k.id} className={'chip know-chip' + (p.progress.knowledge.includes(k.id) ? ' cyan' : ' dim')}>{k.title}</span>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">成就</div>
            <div className="pf-kv"><span className="k">已解锁</span><span className="v">{p.progress.achievements.length} / {ACHIEVEMENTS.length}</span></div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ACHIEVEMENTS.filter(a => p.progress.achievements.includes(a.id)).map(a => (
                <span key={a.id} className="chip orange">{a.icon} {a.name}</span>
              ))}
              {p.progress.achievements.length === 0 && <span className="dim" style={{ fontSize: 13 }}>还没有成就。去完成第一次修复吧。</span>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">创世主碎片<span className="panel-tag">{fragmentProgress(p.meta.memoryFragments).owned} / {fragmentProgress(p.meta.memoryFragments).total}</span></div>
            {CREATOR_FRAGMENTS.map(f => hasFragment(p.meta.memoryFragments, f.id) ? (
              <div className="frag-card" key={f.id}>
                <div className="fc-title">◇ {f.title}</div>
                <div className="fc-body">{f.content}</div>
              </div>
            ) : (
              <div className="empty-hint" key={f.id} style={{ padding: '16px 0', fontSize: 12.5 }}>
                第 {f.order} 枚 —— 尚未获得（对应第 {f.order} 章章节 Boss）
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
