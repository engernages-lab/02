import { useState } from 'react';
import { useGame } from '../store/gameStore';
import PlayerStatus from '../components/PlayerStatus';
import ParticlesField from '../components/ParticlesField';
import { play } from '../services/sound';
import { LEVELS, levelById } from '../game/levels';

function importedTotalLevels(): number {
  return LEVELS.length;
}

export default function MainMenu() {
  const g = useGame();
  const [confirmNew, setConfirmNew] = useState(false);

  const enter = () => {
    if (g.player.progress.pendingRebirth) {
      g.triggerPendingDeath();
      g.toast('info', '检测到未完成的重生流程……正在重新构建载体。');
      return;
    }
    // 有进度时进入世界地图（可自由选择要修复的关卡），而非强制回到上次关卡
    if (g.player.progress.completedLevels.length > 0 || g.player.progress.currentLevelId) {
      g.nav('map');
    } else {
      g.nav('map');
    }
    play('click');
  };

  const done = g.player.progress.completedLevels.length;
  const totalLevels = importedTotalLevels();
  const repaired = done + ' / ' + totalLevels;

  return (
    <div className="page page-anim">
      <ParticlesField enabled={g.player.settings.animations} density={0.7} />
      <div className="page-inner menu-grid">
        {/* 左侧导航 */}
        <nav className="menu-nav">
          <button className="menu-navitem primary" onClick={enter}>
            <span className="micon">▶</span> {g.hasSave ? '继续游戏' : '开始游戏'}
          </button>
          <button className="menu-navitem" onClick={() => { play('click'); setConfirmNew(true); }}>
            <span className="micon">✦</span> 新的开始
          </button>
          <div className="menu-sep" />
          <button className="menu-navitem" onClick={() => { play('click'); g.nav('archive'); }}>
            <span className="micon">◎</span> 剧情档案
          </button>
          <button className="menu-navitem" onClick={() => { play('click'); g.nav('knowledge'); }}>
            <span className="micon">◈</span> Python 知识库
          </button>
          <button className="menu-navitem" onClick={() => {
            play('click');
            if (g.player.progress.completedLevels.includes('tut-1')) g.nav('lab');
            else g.toast('warn', '编程实验室将在你完成新人训练终端后开放。');
          }}>
            <span className="micon">⌬</span> 编程实验室
            {!g.player.progress.completedLevels.includes('tut-1') && <span className="chip dim" style={{ marginLeft: 'auto', fontSize: 10 }}>🔒</span>}
          </button>
          <button className="menu-navitem" onClick={() => { play('click'); g.nav('achievements'); }}>
            <span className="micon">✧</span> 成就系统
          </button>
          <button className="menu-navitem" onClick={() => { play('click'); g.nav('profile'); }}>
            <span className="micon">◉</span> 玩家档案
          </button>
          <div className="menu-sep" />
          <button className="menu-navitem" onClick={() => { play('click'); g.nav('settings'); }}>
            <span className="micon">⚙</span> 系统配置
          </button>
        </nav>

        {/* 中央标识 */}
        <div className="menu-center">
          <div className="menu-logo">代码修复局</div>
          <div className="menu-logo-en">CODE REPAIR : NEXUS</div>
          <div className="menu-slogan">在代码崩坏的世界中，寻找数字生命的真相。</div>
          <button className="nxbtn primary pulse" onClick={enter}>
            {g.hasSave ? '继续游戏 ▶' : '进入 NEXUS ▶'}
          </button>
          <div className="menu-save-hint" style={{ marginTop: 14, fontSize: 12.5, color: '#7FA6BC' }}>
            {done > 0
              ? '存档已自动保存 · 已完成 ' + repaired + ' 项修复 · Lv.' + g.player.level
              : '进度会自动保存到本机浏览器，关闭后重新打开可继续'}
          </div>
          <div style={{ marginTop: 26, display: 'flex', gap: 10 }}>
            <span className="chip cyan">序章 + 第一章已实装</span>
            <span className="chip">第二章起数据加密（占位）</span>
          </div>
        </div>

        {/* 右侧玩家状态 */}
        <aside className="menu-side">
          <div className="panel">
            <div className="panel-title">修复师档案<span className="panel-tag">{g.hasSave ? 'SAVE FOUND' : 'NO SAVE'}</span></div>
            {g.hasSave ? (
              <>
                <PlayerStatus showTolerance={false} />
                <div style={{ marginTop: 12 }}>
                  <div className="pf-kv"><span className="k">已修复任务</span><span className="v">{repaired}</span></div>
                  <div className="pf-kv"><span className="k">成就</span><span className="v">{g.player.progress.achievements.length}</span></div>
                  <div className="pf-kv"><span className="k">意识重组</span><span className="v">{g.player.meta.rebirths} 次</span></div>
                  <div className="pf-kv"><span className="k">记忆碎片</span><span className="v">{g.player.meta.memoryFragments.length} / 1</span></div>
                </div>
              </>
            ) : (
              <div className="empty-hint">尚未检测到存档。<br />选择「开始游戏」进入 NEXUS。</div>
            )}
          </div>
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
