import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import {
  MIRA_MEMORY_DEFS, MIRA_STAGE_LABEL, miraLevelProgress, miraMemoryById,
  miraRiskFor, normalizeMiraState, type MiraMemoryDef,
} from '../game/miraCore';

const TYPE_LABEL: Record<MiraMemoryDef['type'], string> = {
  connection: '连接', repair: '修复', explore: '探索', crisis: '危机', boss: 'Boss', story: '剧情',
};

export default function MiraPage() {
  const g = useGame();
  const mira = normalizeMiraState(g.player.mira);
  const progress = miraLevelProgress(mira);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selected, setSelected] = useState<string>('');
  const activeBossId = g.player.progress.currentBossId;
  const bossRun = activeBossId ? g.player.progress.bossBattles?.[activeBossId] : undefined;
  const consecutiveFails = Math.max(0, ...Object.values(g.player.progress.failedAttempts || {}));
  const risks = useMemo(() => miraRiskFor({
    consciousness: g.player.consciousness,
    consecutiveFails,
    crisis: !!g.player.progress.dynamicEvent,
    bossPhase: bossRun ? bossRun.currentPhaseIndex : undefined,
  }), [g.player.consciousness, consecutiveFails, g.player.progress.dynamicEvent, bossRun]);

  useEffect(() => { g.miraEnsureContact(); }, [g.miraEnsureContact]);

  const memories = MIRA_MEMORY_DEFS.filter(m => {
    const unlocked = !!mira.memories[m.id];
    return filter === 'all' || (filter === 'unlocked' ? unlocked : !unlocked);
  });
  const selectedDef = selected ? miraMemoryById(selected) : undefined;
  const selectedState = selected ? mira.memories[selected] : undefined;
  const unlockedCount = MIRA_MEMORY_DEFS.filter(m => mira.memories[m.id]).length;

  return (
    <div className="page page-anim mira-page">
      <div className="hud">
        <button className="nxbtn small ghost" onClick={() => g.nav('menu')}>◀ 返回</button>
        <div>
          <div className="hud-title" style={{ color: '#C9A7FF' }}>◈ MIRA · 智能伙伴核心</div>
          <div className="hud-sub">连接状态 · 成长记录 · 记忆归档 · 辅助建议</div>
        </div>
        <div className="hud-spacer" />
        <span className="hud-chip cyan">Lv.{progress.level} · {MIRA_STAGE_LABEL[mira.stage]}</span>
        <span className="hud-chip">记忆 {unlockedCount} / {MIRA_MEMORY_DEFS.length}</span>
      </div>

      <div className="mira-page-grid">
        <div className="panel mira-profile-card">
          <div className="mira-page-avatar">M</div>
          <div className="mira-page-name">MIRA</div>
          <div className="mira-page-sub">智能维修助手 · ONLINE</div>
          <div className="mira-page-stage">{MIRA_STAGE_LABEL[mira.stage]}</div>
          <div className="mira-xp-track"><i style={{ width: progress.pct + '%' }} /></div>
          <div className="mira-page-xp">{progress.exp} / {progress.next} XP · 下一等级 Lv.{Math.min(10, progress.level + 1)}</div>
          <div className="mira-page-counts">
            <span>等级 <b>{progress.level}</b></span>
            <span>成长记录 <b>{mira.eventLog.length}</b></span>
            <span>交互记录 <b>{mira.interactions.length}</b></span>
          </div>
          <button className="nxbtn small" style={{ marginTop: 10 }} onClick={() => g.miraSay('menu')}>与 MIRA 对话</button>
        </div>

        <div className="panel mira-memory-panel">
          <div className="panel-title">记忆碎片<span className="panel-tag">真实事件解锁</span></div>
          <div className="mira-memory-filters">
            {(['all', 'unlocked', 'locked'] as const).map(f => (
              <button key={f} className={'nxbtn small ' + (filter === f ? 'primary' : 'ghost')} onClick={() => setFilter(f)}>
                {f === 'all' ? '全部' : f === 'unlocked' ? '已解锁' : '未解锁'}
              </button>
            ))}
          </div>
          <div className="mira-memory-list">
            {memories.map(m => {
              const st = mira.memories[m.id];
              return (
                <button
                  key={m.id}
                  className={'mira-memory-card' + (st ? ' unlocked' : ' locked') + (selected === m.id ? ' active' : '')}
                  onClick={() => {
                    setSelected(m.id);
                    if (st && !st.read) g.miraMarkMemoryRead(m.id);
                  }}
                >
                  <span className="mm-type">{TYPE_LABEL[m.type]}</span>
                  <b>{st ? m.name : '未解锁记忆'}</b>
                  <span className="mm-desc">{st ? m.description : m.condition}</span>
                  {st && !st.read && <em>NEW</em>}
                </button>
              );
            })}
          </div>
          {selectedDef && (
            <div className="mira-memory-detail">
              <div className="mm-detail-title">{selectedState ? selectedDef.name : '锁定记忆'}</div>
              <div className="mm-detail-body">
                {selectedState
                  ? selectedDef.description + ' 解锁条件：' + selectedDef.condition
                  : '尚未解锁。解锁条件：' + selectedDef.condition}
              </div>
              {selectedState && <div className="mm-detail-mira">MIRA：{selectedDef.mira}</div>}
            </div>
          )}
        </div>

        <div className="panel mira-assist-panel">
          <div className="panel-title">智能辅助<span className="panel-tag">真实状态</span></div>
          {risks.map((r, i) => <div key={i} className={'mira-risk risk-' + r.level}>{r.text}</div>)}
          <div className="tb-item">
            <div className="tb-label">当前区域</div>
            <div className="tb-text">{g.player.progress.currentBossId ? 'Boss 战区 · ' + g.player.progress.currentBossId.toUpperCase() : '服务器网络'}</div>
          </div>
          <div className="tb-item">
            <div className="tb-label">Boss 阶段</div>
            <div className="tb-text">{bossRun ? '第 ' + (bossRun.currentPhaseIndex + 1) + ' 阶段' : '当前无 Boss 战'}</div>
          </div>
          <div className="tb-item">
            <div className="tb-label">挑战诊断</div>
            <div className="tb-text dim" style={{ fontSize: 12.5 }}>在代码挑战页，MIRA 会读取真实运行结果、判题项与错误行，提供三层提示。这里不伪造答案。</div>
          </div>
          <div className="mira-assist-actions">
            <button className="nxbtn small primary" onClick={() => g.nav('map')}>进入探索</button>
            <button className="nxbtn small ghost" onClick={() => g.nav('challengehub')}>独立挑战</button>
          </div>
        </div>

        <div className="panel mira-history-panel">
          <div className="panel-title">最近互动<span className="panel-tag">上下文记录</span></div>
          {mira.interactions.length === 0 && <div className="dim" style={{ fontSize: 12.5 }}>还没有 MIRA 互动记录。</div>}
          {mira.interactions.slice(0, 10).map(it => (
            <div key={it.id} className="mira-interaction">
              <span>{new Date(it.at).toLocaleTimeString()}</span>
              <b>{it.scene}</b>
              <em>{it.text}</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
