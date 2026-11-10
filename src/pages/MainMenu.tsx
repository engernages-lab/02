import { useState } from 'react';
import { useGame } from '../store/gameStore';
import PlayerStatus from '../components/PlayerStatus';
import ParticlesField from '../components/ParticlesField';
import { play } from '../services/sound';
import { LEVELS } from '../game/levels';
import { fragmentProgress } from '../game/lore/fragments';
import { ACHIEVEMENTS } from '../game/achievements';

type NavItem = { id: string; label: string; icon: string; onClick: () => void; badge?: string; locked?: boolean };

export default function MainMenu() {
  const g = useGame();
  const [confirmNew, setConfirmNew] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('nexus_rail_collapsed') === '1'; } catch { return false; }
  });
  const toggleRail = () => {
    setCollapsed(v => { const n = !v; try { localStorage.setItem('nexus_rail_collapsed', n ? '1' : '0'); } catch { /* ignore */ } return n; });
    play('click');
  };

  const enter = () => {
    if (g.player.progress.pendingRebirth) {
      g.triggerPendingDeath();
      g.toast('info', '检测到未完成的重生流程……正在重新构建载体。');
      return;
    }
    play('click');
    g.nav('map');
  };

  const done = g.player.progress.completedLevels.length;
  const totalLevels = LEVELS.length;
  const remaining = Math.max(0, totalLevels - done);
  const syncPct = totalLevels ? Math.round((done / totalLevels) * 100) : 0;
  const frag = fragmentProgress(g.player.meta.memoryFragments || []);
  const ach = g.player.progress.achievements.length;
  const tutDone = g.player.progress.completedLevels.includes('tut-1');

  const explore: NavItem[] = [
    { id: 'continue', label: g.hasSave ? '继续探索' : '开始探索', icon: '▶', onClick: enter },
    { id: 'new', label: '新的开始', icon: '✦', onClick: () => { play('click'); setConfirmNew(true); } },
  ];
  const archive: NavItem[] = [
    { id: 'archive', label: '剧情档案', icon: '◎', onClick: () => { play('click'); g.nav('archive'); } },
    { id: 'endings', label: '结局档案', icon: '✧', onClick: () => { play('click'); g.nav('endings'); } },
    { id: 'journal', label: '探索档案', icon: '▤', onClick: () => { play('click'); g.nav('journal'); } },
    { id: 'vault', label: '创世主记忆档案馆', icon: '◇', onClick: () => { play('click'); g.nav('vault'); }, badge: frag.owned + '/' + frag.total },
  ];
  const grow: NavItem[] = [
    { id: 'knowledge', label: 'Python 知识库', icon: '◈', onClick: () => { play('click'); g.nav('knowledge'); } },
    { id: 'lab', label: '编程实验室', icon: '⌬', locked: !tutDone, onClick: () => { play('click'); if (tutDone) g.nav('lab'); else g.toast('warn', '编程实验室将在你完成新人训练终端后开放。'); } },
    { id: 'shop', label: '奖励兑换中心', icon: '◈', onClick: () => { play('click'); g.nav('shop'); } },
    { id: 'achievements', label: '成就系统', icon: '✧', onClick: () => { play('click'); g.nav('achievements'); } },
    { id: 'profile', label: '玩家档案', icon: '◉', onClick: () => { play('click'); g.nav('profile'); } },
    { id: 'settings', label: '系统配置', icon: '⚙', onClick: () => { play('click'); g.nav('settings'); } },
  ];

  const renderGroup = (title: string, items: NavItem[]) => (
    <div className="rail-group" key={title}>
      <div className="rail-group-title">{title}</div>
      {items.map(it => (
        <button
          key={it.id}
          className={'rail-item' + (it.id === 'continue' ? ' primary' : '') + (it.locked ? ' locked' : '')}
          onClick={it.onClick}
          title={it.label}
        >
          <span className="rail-icon">{it.icon}</span>
          <span className="rail-label">{it.label}</span>
          {it.badge && <span className="rail-badge">{it.badge}</span>}
          {it.locked && <span className="rail-badge dim">🔒</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="page menu-page">
      <ParticlesField enabled={g.player.settings.animations} density={0.65} />
      <div className="menu-grid-bg" aria-hidden="true" />
      <div className="menu-scan" aria-hidden="true" />

      <div className={'menu-shell' + (collapsed ? ' rail-collapsed' : '')}>
        <aside className="menu-rail">
          <div className="rail-head">
            <span className="rail-mark">N</span>
            <span className="rail-name">NEXUS</span>
            <button className="rail-toggle" onClick={toggleRail} title={collapsed ? '展开导航' : '收起导航'}>
              {collapsed ? '»' : '«'}
            </button>
          </div>
          {renderGroup('探索', explore)}
          {renderGroup('档案', archive)}
          {renderGroup('成长', grow)}
          <div className="rail-foot">
            <span className={'rail-dot' + (g.hasSave ? ' on' : '')} />
            {g.hasSave ? '本地存档已同步' : '无存档'}
          </div>
        </aside>

        <main className="menu-stage">
          <div className="stage-core" aria-hidden="true">
            <span className="core-ring r1" /><span className="core-ring r2" /><span className="core-ring r3" />
            <span className="core-orb" />
            <span className="core-grid" />
          </div>
          <h1 className="brand-title">NEXUS</h1>
          <div className="brand-sub">DIGITAL WORLD // SYSTEM REPAIR</div>
          <p className="brand-cn">「在崩坏的数据宇宙中，寻找文明的真相。」</p>

          <div className="stage-actions">
            <button className="stage-btn primary" onClick={enter}>
              {g.hasSave ? '继续探索' : '进入 NEXUS'}<span className="stage-btn-arrow">▶</span>
            </button>
            <button className="stage-btn ghost" onClick={() => { play('click'); setConfirmNew(true); }}>新的开始</button>
          </div>

          <div className="stage-stats">
            <div className="stat">
              <span className="stat-k">世界状态</span>
              <span className={'stat-v ' + (done >= totalLevels ? 'ok' : 'warn')}>{done >= totalLevels ? 'STABLE' : 'UNSTABLE'}</span>
            </div>
            <div className="stat">
              <span className="stat-k">待修复任务</span>
              <span className="stat-v">{remaining}</span>
            </div>
            <div className="stat">
              <span className="stat-k">探索进度</span>
              <span className="stat-v">{syncPct}%</span>
            </div>
            <div className="stat">
              <span className="stat-k">系统同步率</span>
              <span className="stat-v cyan">{Math.min(100, Math.round((done / Math.max(1, totalLevels)) * 70 + frag.owned * 5))}%</span>
            </div>
          </div>
        </main>

        <aside className="menu-id">
          <div className="id-card">
            <div className="id-head">
              <span className="id-tag">REPAIRER FILE</span>
              <span className={'id-status' + (g.hasSave ? ' on' : '')}>{g.hasSave ? 'SYNCED' : 'EMPTY'}</span>
            </div>
            {g.hasSave ? (
              <>
                <PlayerStatus showTolerance={false} />
                <div className="id-rows">
                  <div className="id-row"><span>已修复任务</span><b>{done} / {totalLevels}</b></div>
                  <div className="id-row"><span>成就</span><b>{ach} / {ACHIEVEMENTS.length}</b></div>
                  <div className="id-row"><span>记忆碎片</span><b className="gold">{frag.owned} / {frag.total}</b></div>
                  <div className="id-row"><span>意识重组</span><b>{g.player.meta.rebirths} 次</b></div>
                </div>
                <div className="id-frag">
                  {Array.from({ length: frag.total }).map((_, i) => (
                    <span key={i} className={'frag-pip' + (i < frag.owned ? ' on' : '')} />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-hint">尚未检测到存档。<br />选择「开始探索」接入 NEXUS。</div>
            )}
          </div>
          <div className="id-credit">代码修复局 · 内部档案 · 仅限授权修复师</div>
        </aside>
      </div>

      {confirmNew && (
        <div className="modal-mask" onClick={() => setConfirmNew(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>⚠ 开始新的轮回</h3>
            <p style={{ color: '#D3E4EF' }}>
              这将<strong className="red">清空当前全部游戏进度</strong>（等级、成就、通关记录、设置），且不可撤销。
              <br />确定要重新开始吗？
            </p>
            <div className="modal-actions">
              <button className="nxbtn ghost" onClick={() => setConfirmNew(false)}>取消</button>
              <button className="nxbtn danger" onClick={() => { setConfirmNew(false); g.startNewGame(); }}>确认，开启新轮回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
