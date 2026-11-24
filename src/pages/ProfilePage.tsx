import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { milestone, titleForLevel, toleranceFor } from '../game/progression';
import { normalizeIdentity, ORIGIN_CODE, DISPLAY_NAME_MAX } from '../game/identity';
import { levelsOfServer, levelById } from '../game/levels';
import { KNOWLEDGE, knowledgeById } from '../game/knowledge';
import { ACHIEVEMENTS } from '../game/achievements';
import { CREATOR_FRAGMENTS, fragmentProgress, hasFragment } from '../game/lore/fragments';
import { CHAPTERS } from '../game/lore/chapters';
import { bossById } from '../game/bosses';
import { bossRecordOf } from '../game/chapterFlow';
import { difficultyMeta, DIFFICULTY_ORDER } from '../game/difficulty';
import PlayerStatus from '../components/PlayerStatus';
import { play } from '../services/sound';
import { growthOverviewFor, RISK_META } from '../game/playerGrowthCore';

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
  const growth = growthOverviewFor(p, allLevels.length);
  const recentLedger = [...(p.rewards?.ledger || [])]
    .filter(e => ['level', 'level-repeat', 'boss', 'chapter', 'difficulty', 'challenge', 'exploration'].includes(e.kind))
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .slice(0, 6);

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
          <div className="panel pf-growth-panel">
            <div className="panel-title">成长总览<span className="panel-tag">GROWTH</span></div>
            <div className="pf-growth-head">
              <div>
                <div className="pf-growth-title">Lv.{growth.level} · {growth.title}</div>
                <div className="pf-growth-sub">容错上限 {growth.toleranceMax} 次 / 关 · MIRA Lv.{growth.miraLevel}</div>
              </div>
              <span className={'pf-risk risk-' + growth.risk.level} style={{ borderColor: RISK_META[growth.risk.level].color, color: RISK_META[growth.risk.level].color }}>
                {growth.risk.label}
              </span>
            </div>
            <div className="pf-xp-track"><i style={{ width: growth.pct + '%' }} /></div>
            <div className="pf-growth-xp">
              {growth.maxed ? '经验 MAX · Lv.' + growth.level : '经验 ' + growth.exp + ' · 下一等级还差 ' + Math.max(0, growth.need - growth.into) + '（Lv.' + Math.min(10, growth.level + 1) + '）'}
            </div>
            <div className="pf-growth-grid">
              <span>已修复挑战 <b>{growth.completedChallenges} / {growth.totalChallenges}</b></span>
              <span>累计星级 <b>{growth.totalStars} / {growth.totalChallenges * 3}</b></span>
              <span>当前失误计数 <b>{growth.failedSubmissions}</b></span>
              <span>已解锁区域 <b>{growth.regionsUnlocked} / 7</b></span>
              <span>已完成区域 <b>{growth.regionsCompleted}</b></span>
              <span>探索节点 <b>{growth.nodesCompleted} · {growth.explorePct}%</b></span>
              <span>已解锁成就 <b>{growth.achievementCount}</b></span>
              <span>风险状态 <b style={{ color: RISK_META[growth.risk.level].color }}>{growth.risk.level}</b></span>
            </div>
            <div className="pf-risk-hint">{growth.risk.hint}</div>
            <div className="pf-recent">
              <div className="panel-title" style={{ fontSize: 13, marginTop: 8 }}>最近成长 / 奖励</div>
              {recentLedger.length === 0 && <div className="dim" style={{ fontSize: 12 }}>还没有成长记录。</div>}
              {recentLedger.map(e => (
                <div key={e.kind + ':' + e.ref + ':' + e.at} className="pf-recent-row">
                  <span className="pr-kind">{e.kind}</span>
                  <b>{e.ref}</b>
                  <span>+{e.credits} 贡献{e.exp ? ' · +' + e.exp + ' XP' : ''}</span>
                  <em>{new Date(e.at).toLocaleString()}</em>
                </div>
              ))}
            </div>
          </div>

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
            <div className="pf-kv"><span className="k">当前风险状态</span><span className="v" style={{ color: RISK_META[growth.risk.level].color }}>{growth.risk.label}</span></div>
            <div className="pf-kv"><span className="k">当前容错状态</span><span className="v">剩余 {growth.risk.toleranceRemaining} / {growth.risk.toleranceMax}</span></div>
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
            <div className="panel-title">Boss 难度战绩<span className="panel-tag">{(p.rewards?.badges || []).length} 徽章</span></div>
            <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>
              每个 Boss 可独立选择 EASY / HARD / EXPERT；难度徽章一次性发放，重复挑战只刷新记录。
            </div>
            {CHAPTERS.map(ch => {
              const boss = ch.currentBossId ? bossById(ch.currentBossId) : undefined;
              if (!boss) return null;
              const rec = bossRecordOf(p, boss.id);
              const best = rec.bestDifficulty ? difficultyMeta(rec.bestDifficulty) : null;
              return (
                <div className="pf-kv" key={ch.id}>
                  <span className="k">{boss.codename} · {boss.title}</span>
                  <span className="v">
                    {best ? (
                      <>
                        <span style={{ color: best.color, fontFamily: 'Consolas, monospace' }}>{best.label}</span>
                        {' · '}
                        {DIFFICULTY_ORDER.filter(d => rec.cleared[d]).map(d => {
                          const m = difficultyMeta(d);
                          const c = rec.cleared[d]!.count;
                          return <span key={d} className="chip" style={{ marginLeft: 4, color: m.color, borderColor: m.color }}>{m.label} ×{c}</span>;
                        })}
                      </>
                    ) : <span className="dim">未首胜</span>}
                  </span>
                </div>
              );
            })}
            {(p.rewards?.badges || []).length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(p.rewards?.badges || []).map(id => {
                  const parts = id.split('-');
                  const diffLabel = parts[1] === 'expert' ? '专家徽章' : '困难徽章';
                  const bossName = parts.slice(2).join('-').toUpperCase();
                  return (
                    <span key={id} className="chip gold" title={id}>
                      {diffLabel} · {bossName}
                    </span>
                  );
                })}
              </div>
            )}
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
