import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import {
  explorationRegionDefs, explorationRegionDef, explorationNodeDef,
  nodeState, regionStatus, regionUnlocked, regionProgress, regionCompleted,
  hiddenAvailable, regionDangerLabel, regionCoordinates, explorationTotals,
  normalizeExplorationState, type ExplorationRegionStatus,
} from '../game/explorationCore';

const STATUS_LABEL: Record<ExplorationRegionStatus, string> = {
  LOCKED: '锁定', AVAILABLE: '可进入', EXPLORING: '探索中', COMPLETED: '已完成', ABNORMAL: '异常',
};

export default function ExplorePage() {
  const g = useGame();
  const state = normalizeExplorationState(g.player.progress.exploration);
  const [selected, setSelected] = useState('training');
  const [tab, setTab] = useState<'map' | 'archive'>('map');
  const [msg, setMsg] = useState('');
  const regions = explorationRegionDefs();
  const region = explorationRegionDef(selected);
  const unlockedServers = g.player.progress.unlockedServers || [];
  const status = region ? regionStatus(state, region.id, unlockedServers) : 'LOCKED';
  const progress = region ? regionProgress(state, region.id) : { completed: 0, total: 0, pct: 0 };
  const totals = useMemo(() => explorationTotals(state, unlockedServers), [state, unlockedServers]);
  const hiddenDef = region?.nodes.find(n => n.kind === 'hidden');
  const hiddenNodeVisible = !!hiddenDef && (!!state.hidden[hiddenDef.id] || hiddenAvailable(state, region!.id));
  const coreNodes = (region?.nodes || []).filter(n => n.kind !== 'hidden');
  const regionNodes = hiddenNodeVisible && hiddenDef ? [...coreNodes, hiddenDef] : coreNodes;

  useEffect(() => {
    if (!region || status === 'LOCKED') return;
    g.exploreRegion(region.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const openRegion = (id: string) => {
    setSelected(id);
    const def = explorationRegionDef(id);
    const st = def ? regionStatus(state, id, unlockedServers) : 'LOCKED';
    if (st === 'LOCKED') setMsg('区域尚未解锁：' + (def?.description || ''));
    else setMsg('已接入区域：' + (def?.name || id));
  };

  const act = (nodeId: string) => {
    if (!region) return;
    const def = explorationNodeDef(region.id, nodeId);
    if (!def) return;
    if (def.kind === 'terminal') {
      const r = g.exploreStartChallenge(region.id, nodeId);
      if (!r.ok) setMsg(r.reason || '无法进入终端');
      return;
    }
    const r = g.exploreInteract(region.id, nodeId);
    if (!r.ok) { setMsg(r.reason || '暂时无法调查'); return; }
    setMsg(def.kind === 'hidden'
      ? '隐藏信号已归档：' + def.name
      : def.kind === 'ruin' ? '遗迹调查完成：' + def.name : '异常残留已处理：' + def.name);
  };

  return (
    <div className="page page-anim explore-page">
      <div className="hud">
        <button className="nxbtn small ghost" onClick={() => g.nav('menu')}>◀ 返回</button>
        <div>
          <div className="hud-title" style={{ color: '#8FD3FF' }}>◎ 数字世界探索</div>
          <div className="hud-sub">区域 · 服务器节点 · 探索事件 · 数据遗迹 · 隐藏信号</div>
        </div>
        <div className="hud-spacer" />
        <span className="hud-chip cyan">区域 {totals.regionsUnlocked} / {regions.length}</span>
        <span className="hud-chip">节点 {totals.nodesCompleted} / {totals.nodesTotal}</span>
        <span className="hud-chip gold">总进度 {totals.pct}%</span>
      </div>

      <div className="explore-tabs">
        <button className={'nxbtn small ' + (tab === 'map' ? 'primary' : 'ghost')} onClick={() => setTab('map')}>区域地图</button>
        <button className={'nxbtn small ' + (tab === 'archive' ? 'primary' : 'ghost')} onClick={() => setTab('archive')}>探索档案</button>
      </div>

      {tab === 'map' ? (
        <div className="explore-layout">
          <div className="explore-map panel">
            <svg className="explore-links" viewBox="0 0 1100 650" preserveAspectRatio="none">
              {regions.slice(0, -1).map((r, i) => {
                const a = regionCoordinates(r.id);
                const b = regionCoordinates(regions[i + 1].id);
                return <line key={r.id + '-link'} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="explore-link" />;
              })}
            </svg>
            {regions.map(r => {
              const pos = regionCoordinates(r.id);
              const st = regionStatus(state, r.id, unlockedServers);
              const unlocked = regionUnlocked(r.id, unlockedServers);
              return (
                <button
                  key={r.id}
                  className={'explore-node status-' + st.toLowerCase() + (selected === r.id ? ' active' : '')}
                  style={{ left: (pos.x / 1100 * 100) + '%', top: (pos.y / 650 * 100) + '%' }}
                  onClick={() => openRegion(r.id)}
                  title={unlocked ? r.name : '锁定：' + r.description}
                >
                  <span className="en-icon">{pos.icon}</span>
                  <span className="en-name">{unlocked ? r.name : '???'}</span>
                  <span className="en-state">{STATUS_LABEL[st]}</span>
                </button>
              );
            })}
            <div className="explore-map-legend">
              <span><i className="dot available" />可进入</span>
              <span><i className="dot exploring" />探索中</span>
              <span><i className="dot abnormal" />异常</span>
              <span><i className="dot completed" />已完成</span>
              <span><i className="dot locked" />锁定</span>
            </div>
          </div>

          <div className="explore-detail panel">
            {!region ? <div className="dim">选择一个区域</div> : (
              <>
                <div className="panel-title">{region.name}<span className="panel-tag">{STATUS_LABEL[status]}</span></div>
                <div className="explore-region-meta">
                  <span className={'chip ' + (status === 'ABNORMAL' ? 'red' : 'cyan')}>{region.codename}</span>
                  <span className="chip">危险 {regionDangerLabel(region.danger)}</span>
                  <span className="chip">进度 {progress.completed}/{progress.total}</span>
                </div>
                <div className="explore-desc">{region.description}</div>
                <div className="explore-progress"><i style={{ width: progress.pct + '%' }} /></div>
                {status === 'LOCKED' ? (
                  <div className="mira-risk risk-medium">区域未解锁：{region.description}（请先完成前置区域）</div>
                ) : (
                  <div className="explore-node-list">
                    {regionNodes.map(n => {
                      const ns = nodeState(state, n.id);
                      const done = ns === 'completed';
                      return (
                        <div key={n.id} className={'explore-event-card kind-' + n.kind + (done ? ' done' : '')}>
                          <div className="eec-head">
                            <b>{n.name}</b>
                            <span className={'chip ' + (done ? 'green' : ns === 'discovered' ? 'red' : 'cyan')}>
                              {done ? '已完成' : ns === 'discovered' ? '已发现' : '可调查'}
                            </span>
                          </div>
                          <div className="eec-desc">{n.description}</div>
                          <div className="eec-actions">
                            {n.kind === 'terminal' && n.levelId && (
                              <button className="nxbtn small primary" disabled={done} onClick={() => act(n.id)}>
                                {done ? '终端已修复' : '接入真实修复挑战'}
                              </button>
                            )}
                            {n.kind !== 'terminal' && (
                              <button className="nxbtn small primary" disabled={done} onClick={() => act(n.id)}>
                                {done ? '已完成' : n.kind === 'hidden' ? '追踪隐藏信号' : n.kind === 'ruin' ? '调查遗迹' : '调查异常'}
                              </button>
                            )}
                            <span className="dim">+{n.credits} 贡献 · MIRA +{n.miraXp} XP</span>
                          </div>
                        </div>
                      );
                    })}
                    {hiddenDef && !hiddenNodeVisible && (
                      <div className="explore-hidden-hint">区域内仍存在未触发的隐藏信号。完成主要探索节点后可能出现新的数据回声。</div>
                    )}
                  </div>
                )}
                {msg && <div className="dev-phase-msg" style={{ marginTop: 8 }}>{msg}</div>}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="explore-archive panel">
          <div className="panel-title">探索档案<span className="panel-tag">真实数据</span></div>
          <div className="explore-archive-grid">
            <div><span>区域解锁</span><b>{totals.regionsUnlocked} / {regions.length}</b></div>
            <div><span>区域完成</span><b>{totals.regionsCompleted}</b></div>
            <div><span>节点完成</span><b>{totals.nodesCompleted} / {totals.nodesTotal}</b></div>
            <div><span>遗迹完成</span><b>{totals.ruinsCompleted} / 2+</b></div>
            <div><span>探索事件</span><b>{totals.eventsCompleted}</b></div>
            <div><span>隐藏信号</span><b>{totals.hiddenFound}</b></div>
            <div><span>总探索进度</span><b>{totals.pct}%</b></div>
            <div><span>区域完成度</span><b>{totals.regionsCompleted} / {totals.regionsUnlocked}</b></div>
          </div>
          <div className="explore-archive-progress"><i style={{ width: totals.pct + '%' }} /></div>
          <div className="explore-archive-list">
            {state.archive.length === 0 && <div className="dim">还没有探索档案记录。</div>}
            {state.archive.map(a => (
              <div key={a.id + ':' + a.at} className="explore-archive-row">
                <span className="ear-kind">{a.kind}</span>
                <b>{a.title}</b>
                <span>{new Date(a.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="dim" style={{ fontSize: 11.5, marginTop: 8 }}>
            隐藏内容不会在未发现时显示名称；探索进度只统计已知区域节点，避免将尚未发现的内容误认为已完成。
          </div>
        </div>
      )}
    </div>
  );
}
