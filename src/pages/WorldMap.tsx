import { useEffect, useMemo, useState } from 'react';
import { SERVERS, serverById, levelsOfServer, levelUnlockState, levelById, type LevelDef } from '../game/levels';
import { CHAPTER3_COMPLETE, CHAPTER4_COMPLETE, CHAPTER5_COMPLETE, CHAPTER6_COMPLETE, TUTORIAL_DONE } from '../game/story';
import { CHAPTER2_ARRIVAL_SCENES, CHAPTER2_RESTORED_SCENES } from '../game/lore/chapter2';
import { CHAPTER3_ARRIVAL_SCENES, CHAPTER3_VICTORY_SCENES } from '../game/lore/chapter3';
import { CHAPTER4_ARRIVAL_SCENES, CHAPTER4_VICTORY_SCENES } from '../game/lore/chapter4';
import { CHAPTER5_ARRIVAL_SCENES, CHAPTER5_TRUTH_SCENES, CHAPTER5_VICTORY_SCENES } from '../game/lore/chapter5';
import { CHAPTER6_ARRIVAL_SCENES, CHAPTER6_ENGEL_SCENES, CHAPTER6_VICTORY_SCENES } from '../game/lore/chapter6';
import { CHAPTER1_ARRIVAL_SCENES, CHAPTER1_RESTORED_SCENES } from '../game/lore/chapter1';
import { bossForChapter } from '../game/bosses';
import { chapterByServer } from '../game/lore/chapters';
import DialogSystem from '../components/DialogSystem';
import CinematicStage from '../components/CinematicStage';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';
import ParticlesField from '../components/ParticlesField';

type NodeStatus = 'online' | 'restored' | 'damaged' | 'locked' | 'sealed';

const HUB = { x: 620, y: 365 };
const CHIP_COLOR: Record<NodeStatus, string> = {
  online: '#35D39A', restored: '#35D39A', damaged: '#FF5B64', locked: '#4A6E85', sealed: '#F3B75C',
};
const CHIP_TEXT: Record<NodeStatus, string> = {
  online: 'ONLINE', restored: 'RESTORED', damaged: 'DAMAGED', locked: 'LOCKED', sealed: 'SEALED',
};
const ICON_COLOR: Record<NodeStatus, string> = {
  online: '#7FE8C4', restored: '#9FE8C8', damaged: '#FF8B92', locked: '#5E7C96', sealed: '#F5CE8E',
};

export default function WorldMap() {
  const g = useGame();
  const p = g.player.progress;
  const [sel, setSel] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [cinema, setCinema] = useState<'tut' | 'ch1arrive' | 'ch1restore' | 'ch2arrive' | 'ch2restore' | 'ch3arrive' | 'ch3' | 'ch4arrive' | 'ch4' | 'ch5arrive' | 'ch5truth' | 'ch5' | 'ch6arrive' | 'ch6engel' | 'ch6' | null>(null);
  const [briefServer, setBriefServer] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const [showLinks, setShowLinks] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({ online: true, restored: true, damaged: true, locked: true, sealed: true });

  const tutDone = p.completedLevels.includes('tut-1');
  const ch1Done = p.flags.chapter1Done === true;
  const ch2Done = p.flags.chapter2Done === true;
  const ch3Done = p.flags.chapter3Done === true;
  const ch4Done = p.flags.chapter4Done === true;
  const ch5Done = p.flags.chapter5Done === true;
  const ch6Done = p.flags.chapter6Done === true;
  const tutCin = p.flags.tutorialCinematicShown === true;
  const ch1Cin = p.flags.chapter1CinematicShown === true;
  const ch2Cin = p.flags.chapter2CinematicShown === true;
  const ch3Cin = p.flags.chapter3CinematicShown === true;
  const ch4Cin = p.flags.chapter4CinematicShown === true;
  const ch5Cin = p.flags.chapter5CinematicShown === true;
  const ch6Cin = p.flags.chapter6CinematicShown === true;

  useEffect(() => {
    if (ch6Done && !p.flags.chapter6EngelSeen) setCinema('ch6engel');
    else if (ch6Done && !ch6Cin) setCinema('ch6');
    else if (ch5Done && !p.flags.chapter6ArrivalSeen) setCinema('ch6arrive');
    else if (ch4Done && !p.flags.chapter5ArrivalSeen) setCinema('ch5arrive');
    else if (ch5Done && !p.flags.chapter5TruthSeen) setCinema('ch5truth');
    else if (ch5Done && !ch5Cin) setCinema('ch5');
    else if (ch3Done && !p.flags.chapter4ArrivalSeen) setCinema('ch4arrive');
    else if (ch4Done && !ch4Cin) setCinema('ch4');
    else if (ch2Done && !p.flags.chapter3ArrivalSeen) setCinema('ch3arrive');
    else if (ch3Done && !ch3Cin) setCinema('ch3');
    else if (ch2Done && p.flags.chapter2RestoreSeen !== true) setCinema('ch2restore');
    else if (ch1Done && p.flags.chapter1RestoreSeen !== true) setCinema('ch1restore');
    else if (tutDone && !tutCin && !ch1Done) setCinema('tut');
    else if (!ch1Done && p.unlockedServers.includes('syntax') && p.flags.chapter1ArrivalSeen !== true) setCinema('ch1arrive');
    else if (!ch2Done && p.unlockedServers.includes('logs') && p.flags.chapter2ArrivalSeen !== true) setCinema('ch2arrive');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch6Done, ch6Cin, ch5Done, ch5Cin, ch4Done, ch4Cin, ch3Done, ch3Cin, ch2Done, ch2Cin, ch1Done, ch1Cin, tutDone, tutCin, p.flags.chapter1RestoreSeen, p.flags.chapter1ArrivalSeen, p.flags.chapter2RestoreSeen, p.flags.chapter2ArrivalSeen, p.unlockedServers]);

  const baseStatusOf = useMemo(() => (id: string): NodeStatus => {
    if (id === 'training') return tutDone ? 'online' : 'damaged';
    if (id === 'syntax') {
      if (!p.unlockedServers.includes('syntax')) return 'locked';
      const all = levelsOfServer('syntax');
      return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
    }
    if (id === 'logs') {
      if (!ch1Done || !p.unlockedServers.includes('logs')) return 'locked';
      const all = levelsOfServer('logs');
      return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
    }
    if (id === 'storage') {
      if (!ch2Done || !p.unlockedServers.includes('storage')) return 'locked';
      const all = levelsOfServer('storage');
      return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
    }
    if (id === 'factory') {
      if (!ch3Done || !p.unlockedServers.includes('factory')) return 'locked';
      const all = levelsOfServer('factory');
      return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
    }
    if (id === 'diag') {
      if (!ch4Done || !p.unlockedServers.includes('diag')) return 'locked';
      const all = levelsOfServer('diag');
      return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
    }
    if (id === 'core') {
      if (!ch5Done || !p.unlockedServers.includes('core')) return ch4Done ? 'sealed' : 'locked';
      const all = levelsOfServer('core');
      return all.every(l => p.completedLevels.includes(l.id)) ? 'online' : 'damaged';
    }
    return 'locked';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutDone, ch1Done, ch2Done, ch3Done, ch4Done, ch5Done, p.unlockedServers, p.completedLevels]);

  /** Boss 击败后，该章服务器视为「完整恢复」 */
  const statusOf = (id: string): NodeStatus => {
    const st = baseStatusOf(id);
    if (st !== 'online') return st;
    const ch = chapterByServer(id || '');
    return ch && ch.currentBossId && (p.bossesDone || []).includes(ch.currentBossId) ? 'restored' : 'online';
  };

  const clickNode = (id: string) => {
    const s = serverById(id);
    const st = statusOf(id);
  // Boss 击败后该服务器视为「完整恢复」
    if (st === 'locked' || st === 'sealed') {
      play('deny');
      setShakeId(id);
      window.setTimeout(() => setShakeId(null), 450);
      g.toast('warn', (s ? s.lockedReason : '权限不足') + (st === 'sealed' ? '（数据恢复中，将在后续版本开放）' : ''));
      return;
    }
    play('click');
    if (sel === id) { setSel(null); return; }
    setSel(id);
    if (!g.player.progress.flags['brief_' + id]) setBriefServer(id);
  };

  const enterLevel = (lv: LevelDef) => {
    play('click');
    g.setCurrentLevel(lv.id);
    g.nav('challenge');
  };

  const selServer = sel ? serverById(sel) : undefined;
  const selLevels = sel ? levelsOfServer(sel) : [];

  return (
    <div className="page page-anim" style={{ padding: 0 }}>
      <ParticlesField enabled={g.player.settings.animations} density={0.5} />
      <div className="page-inner" style={{ padding: '14px 18px 0' }}>
        <div className="hud">
          <div>
            <div className="hud-title">NEXUS 数字世界 · 服务器网络</div>
            <div className="hud-sub">点击节点接入服务器。修复任务可让你解锁新的区域。</div>
          </div>
          <div className="hud-spacer" />
          <span className="hud-chip">Lv.{g.player.level}</span>
          <span className="hud-chip cyan">意识 {g.player.consciousness}%</span>
          <span className="hud-chip green">已修复 {p.completedLevels.length} 项</span>
          {(() => {
            const cur = p.currentLevelId ? levelById(p.currentLevelId) : undefined;
            if (!cur || p.completedLevels.includes(cur.id)) return null;
            return (
              <button className="nxbtn small primary" onClick={() => enterLevel(cur)}>
                ▶ 继续：{cur.title}
              </button>
            );
          })()}
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
        </div>

        <div className="map-wrap">
          <div className="map-toolbar">
            <button className="mt-btn" onClick={() => { play('click'); setZoom(z => Math.min(1.8, +(z + 0.15).toFixed(2))); }} title="放大">＋</button>
            <button className="mt-btn" onClick={() => { play('click'); setZoom(z => Math.max(0.65, +(z - 0.15).toFixed(2))); }} title="缩小">－</button>
            <button className="mt-btn" onClick={() => { play('click'); setZoom(1); setPan({ x: 0, y: 0 }); }} title="重置视角">⟲</button>
            <button className={'mt-btn' + (showLinks ? ' on' : '')} onClick={() => { play('click'); setShowLinks(v => !v); }} title="显示连接线路">⇄</button>
          </div>

          <div className="map-legend">
            {(['online', 'restored', 'damaged', 'locked', 'sealed'] as NodeStatus[]).map(st => (
              <button key={st} className={'lg' + (statusFilter[st] ? '' : ' off')}
                onClick={() => { play('click'); setStatusFilter(f => ({ ...f, [st]: !f[st] })); }}>
                <span className="sw" style={{ background: CHIP_COLOR[st] }} />
                {CHIP_TEXT[st]}
              </button>
            ))}
          </div>

          <div className={'map-viewport' + (drag ? ' dragging' : '')}
            onWheel={e => { e.preventDefault(); setZoom(z => Math.max(0.65, Math.min(1.8, z + (e.deltaY > 0 ? -0.08 : 0.08)))); }}
            onPointerDown={e => { setDrag({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }); (e.target as Element).setPointerCapture?.(e.pointerId); }}
            onPointerMove={e => { if (drag) setPan({ x: drag.px + (e.clientX - drag.x), y: drag.py + (e.clientY - drag.y) }); }}
            onPointerUp={() => setDrag(null)}
            onPointerLeave={() => setDrag(null)}>
            <svg className="map-svg" viewBox="0 0 1240 660"
              style={{ transform: 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')' }}>
              <defs>
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#9FF7EF" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#42D6D0" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#42D6D0" stopOpacity="0" />
                </radialGradient>
                <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {showLinks && SERVERS.map(s => {
                const st = statusOf(s.id);
                const cls = st === 'damaged' ? 'ln-bad' : st === 'locked' || st === 'sealed' ? 'ln-off' : 'ln-ok';
                return (
                  <g key={'ln' + s.id} className={'map-link-g ' + cls}>
                    <line className="map-link-base" x1={HUB.x} y1={HUB.y} x2={s.x} y2={s.y} />
                    <line className="map-link-flow" x1={HUB.x} y1={HUB.y} x2={s.x} y2={s.y} />
                    {(st === 'online' || st === 'restored') && (
                      <circle r={2.6} className="map-packet">
                        <animateMotion dur={(2.6 + (s.x % 5) * 0.3).toFixed(2) + 's'} repeatCount="indefinite"
                          path={'M' + HUB.x + ',' + HUB.y + ' L' + s.x + ',' + s.y} />
                      </circle>
                    )}
                  </g>
                );
              })}

              <g className="map-hub" onClick={() => { play('click'); setHoverId(null); g.toast('info', 'NEXUS CORE RELAY · 全服务器同步核心'); }}>
                <circle cx={HUB.x} cy={HUB.y} r={92} fill="url(#hubGlow)" className="hub-aura" />
                <circle className="hub-ring r1" cx={HUB.x} cy={HUB.y} r={74} />
                <circle className="hub-ring r2" cx={HUB.x} cy={HUB.y} r={60} />
                <circle className="hub-ring r3" cx={HUB.x} cy={HUB.y} r={46} />
                <circle className="hub-core" cx={HUB.x} cy={HUB.y} r={30} />
                <text x={HUB.x} y={HUB.y} textAnchor="middle" dominantBaseline="central" fontSize={22} fill="#04121A" fontWeight={800}>◉</text>
                <text x={HUB.x} y={HUB.y + 78} textAnchor="middle" fontSize={15} fontWeight={700} fill="#8FDDE3">修复局中枢</text>
                <text x={HUB.x} y={HUB.y + 95} textAnchor="middle" fontSize={10} fill="#4A6E85" fontFamily="Consolas, monospace">NEXUS CORE RELAY</text>
              </g>

              {SERVERS.map(s => {
                const st = statusOf(s.id);
                const shaking = shakeId === s.id;
                const dim = !statusFilter[st];
                const damaged = st === 'damaged';
                return (
                  <g key={s.id}
                    className={'node-group st-' + st + (shaking ? ' shake' : '') + (dim ? ' filtered' : '')}
                    onMouseEnter={() => setHoverId(s.id)}
                    onMouseLeave={() => setHoverId(h => (h === s.id ? null : h))}
                    onClick={() => clickNode(s.id)} style={{ cursor: 'pointer' }}>
                    <circle className="node-ring" cx={s.x} cy={s.y} r={58} fill="none" strokeWidth={1.5} />
                    {damaged && <circle className="node-alarm" cx={s.x} cy={s.y} r={58} fill="none" strokeWidth={1.2} />}
                    <circle className="node-circle" cx={s.x} cy={s.y} r={46} strokeWidth={1.8} />
                    <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={24} fill={ICON_COLOR[st]}>{s.icon}</text>
                    <text x={s.x} y={s.y + 66} textAnchor="middle" fontSize={15} fontWeight={700} fill="#EAF3FA">{s.name}</text>
                    <text x={s.x} y={s.y + 82} textAnchor="middle" fontSize={10.5} fill="#4A6E85" fontFamily="Consolas, monospace">{s.codename}</text>
                    <text x={s.x} y={s.y - 62} textAnchor="middle" fontSize={11} fill={CHIP_COLOR[st]} fontFamily="Consolas, monospace" letterSpacing={1.5}>{CHIP_TEXT[st]}</text>
                  </g>
                );
              })}
          </svg>
          </div>

          {/* 选中服务器的关卡面板 */}
          {selServer && (
            <div className="panel map-panel" style={{ backdropFilter: 'blur(10px)' }}>
              <div className="panel-title">{selServer.name}
                <span className="panel-tag">{selServer.codename}</span>
              </div>
              <div style={{ fontSize: 13, color: '#C6D9E6', marginBottom: 8 }}>{selServer.desc}</div>
              {(() => {
                const st = statusOf(selServer.id);
                const doneN = selLevels.filter(l => p.completedLevels.includes(l.id)).length;
                const pct = selLevels.length ? Math.round((doneN / selLevels.length) * 100) : 0;
                const remain = selLevels.length - doneN;
                return (
                  <div className="node-metrics">
                    <div className="nm"><span>状态</span><b style={{ color: CHIP_COLOR[st] }}>{CHIP_TEXT[st]}</b></div>
                    <div className="nm"><span>稳定度</span><b>{st === 'damaged' ? Math.max(12, 100 - remain * 18) : 100}%</b></div>
                    <div className="nm"><span>任务</span><b>{doneN}/{selLevels.length}</b></div>
                    <div className="nm"><span>探索</span><b>{pct}%</b></div>
                    <div className="nm"><span>待修复</span><b>{remain}</b></div>
                    <div className="bar"><span style={{ width: pct + '%' }} /></div>
                  </div>
                );
              })()}
              {(() => {
                const ch = chapterByServer(selServer.id);
                if (!ch) return null;
                return (
                  <div className="chip cyan" style={{ marginBottom: 10 }}>
                    第 {ch.order} 章 · {ch.title}
                  </div>
                );
              })()}
              {selServer.id === 'syntax' && (() => {
                const done = selLevels.filter(l => p.completedLevels.includes(l.id)).length;
                return (
                  <div className="pf-kv" style={{ marginBottom: 8 }}>
                    <span className="k">数据港能源节点</span>
                    <span className="v">{done} / {selLevels.length}</span>
                  </div>
                );
              })()}
              {(() => {
                const boss = bossForChapter(selServer.id);
                if (!boss) return null;
                const allDone = selLevels.length > 0 && selLevels.every(l => p.completedLevels.includes(l.id));
                if (!allDone) return null;
                const cleared = (p.bossesDone ?? []).includes(boss.id);
                return (
                  <div className="boss-entry">
                    <span className="chip echo">⚡ {boss.codename}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A7FF' }}>{boss.title}</div>
                      <div className="dim" style={{ fontSize: 12 }}>章节 Boss · 综合本服务器全部知识点{cleared ? ' · 已击破' : ''}</div>
                    </div>
                    {cleared
                      ? <span className="chip green">已击破</span>
                      : <button className="nxbtn small primary" onClick={() => { play('click'); g.setCurrentBoss(boss.id); g.nav('boss'); }}>挑战 ▸</button>}
                  </div>
                );
              })()}
              {selLevels.map(lv => {
                const lu = levelUnlockState(p, lv.id);
                const stars = p.stars[lv.id] || 0;
                return (
                  <div key={lv.id} className={'lv-row' + (lu === 'locked' ? ' locked' : '')}>
                    <div style={{ minWidth: 44, fontFamily: 'Consolas, monospace', color: lu === 'locked' ? '#4A6E85' : '#42D6D0', fontSize: 13 }}>
                      {lv.codename}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{lv.title}</div>
                      <div className="lv-stars">
                        {[1, 2, 3].map(i => <span key={i} className={i <= stars ? '' : 'off'}>★</span>)}
                      </div>
                    </div>
                    {lu === 'completed' && (
                      <>
                        <span className="chip green">已修复</span>
                        <button className="nxbtn small ghost" onClick={() => enterLevel(lv)}>重玩 ▸</button>
                      </>
                    )}
                    {lu === 'unlocked' && <button className="nxbtn small primary" onClick={() => enterLevel(lv)}>接入 ▸</button>}
                    {lu === 'locked' && <span className="chip dim">🔒 前置未完成</span>}
                  </div>
                );
              })}
              <div className="map-legend">
                <span className="lg"><span className="sw" style={{ background: '#35D39A' }} />ONLINE 已修复</span>
                <span className="lg"><span className="sw" style={{ background: '#FF5B64' }} />DAMAGED 待修复</span>
                <span className="lg"><span className="sw" style={{ background: '#4A6E85' }} />LOCKED 未解锁</span>
                <span className="lg"><span className="sw" style={{ background: '#F3B75C' }} />SEALED 数据恢复中</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 服务器首次接入简报 */}
      {briefServer && (() => {
        const s = serverById(briefServer);
        if (!s) return null;
        return (
          <DialogSystem
            nodes={[
              { id: 'bs-' + s.id + '-1', speaker: 'MIRA', kind: 'mira', text: '已接入 ' + s.name + '。' + s.desc },
              { id: 'bs-' + s.id + '-2', speaker: 'NEXUS 系统', kind: 'system', text: '节点接入完成。检测到 ' + s.id + ' 区域内存在待修复任务。' },
            ]}
            speedMs={g.player.settings.typewriterMs}
            animEnabled={g.player.settings.animations}
            frameTitle={s.name + ' · 接入简报'}
            onSeen={id => g.markStory(id)}
            onDone={() => { g.setFlag('brief_' + s.id, true); setBriefServer(null); }}
          />
        );
      })()}

      {/* 剧情过场：训练完成 / 第一章完成 */}
      {cinema === 'tut' && (
        <DialogSystem
          nodes={TUTORIAL_DONE}
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          eventId="tutorial-done"
          frameTitle="训练终端 · 任务完成"
          onSeen={id => g.markStory(id)}
          onDone={() => { g.setFlag('tutorialCinematicShown', true); setCinema(null); play('unlock'); }}
        />
      )}
      {cinema === 'ch1arrive' && (
        <CinematicStage
          scenes={CHAPTER1_ARRIVAL_SCENES}
          eventId="chapter-1"
          frameTitle="第一章 · 失落的数据港"
          onDone={() => { g.setFlag('chapter1ArrivalSeen', true); setCinema(null); play('unlock'); }}
        />
      )}
      {cinema === 'ch1restore' && (
        <CinematicStage
          scenes={CHAPTER1_RESTORED_SCENES}
          eventId="chapter-1"
          frameTitle="第一章 · 失落的数据港"
          onDone={() => {
            g.setFlag('chapter1RestoreSeen', true);
            g.setFlag('chapter1CinematicShown', true);
            setCinema(null);
            play('levelup');
            g.toast('warn', 'GATE-01 数据港守卫已部署——回到语法维修站挑战它。');
          }}
        />
      )}
      {cinema === 'ch2arrive' && (
        <CinematicStage
          scenes={CHAPTER2_ARRIVAL_SCENES}
          eventId="chapter-2"
          frameTitle="第二章 · 破碎的记忆花园"
          onDone={() => { g.setFlag('chapter2ArrivalSeen', true); setCinema(null); play('unlock'); }}
        />
      )}
      {cinema === 'ch2restore' && (
        <CinematicStage
          scenes={CHAPTER2_RESTORED_SCENES}
          eventId="chapter-2"
          frameTitle="第二章 · 破碎的记忆花园"
          onDone={() => {
            g.setFlag('chapter2RestoreSeen', true);
            g.setFlag('chapter2CinematicShown', true);
            setCinema(null);
            play('levelup');
            g.toast('warn', 'SOMNIA 已盘踞记忆花园核心——回到数据日志中心挑战它。');
          }}
        />
      )}
      {cinema === 'ch3arrive' && (
        <CinematicStage
          scenes={CHAPTER3_ARRIVAL_SCENES}
          eventId="chapter-3"
          frameTitle="第三章 · 被遗忘的实验档案"
          onDone={() => { g.setFlag('chapter3ArrivalSeen', true); setCinema(null); play('unlock'); }}
        />
      )}
      {cinema === 'ch3' && (
        <CinematicStage
          scenes={CHAPTER3_VICTORY_SCENES}
          eventId="chapter-3"
          frameTitle="第三章 · 被遗忘的实验档案"
          onDone={() => {
            g.setFlag('chapter3CinematicShown', true);
            setCinema(null);
            play('levelup');
            g.toast('warn', 'K-0 已发出威胁——第四章入口已解锁。');
          }}
        />
      )}
      {cinema === 'ch4arrive' && (
        <CinematicStage
          scenes={CHAPTER4_ARRIVAL_SCENES}
          eventId="chapter-4"
          frameTitle="第四章 · 失控的核心工坊"
          onDone={() => { g.setFlag('chapter4ArrivalSeen', true); setCinema(null); play('unlock'); }}
        />
      )}
      {cinema === 'ch4' && (
        <CinematicStage
          scenes={CHAPTER4_VICTORY_SCENES}
          eventId="chapter-4"
          frameTitle="第四章 · 失控的核心工坊"
          onDone={() => {
            g.setFlag('chapter4CinematicShown', true);
            setCinema(null);
            play('levelup');
            g.toast('warn', 'MIRA 已定位事故现场——第五章入口已解锁。');
          }}
        />
      )}
      {cinema === 'ch5arrive' && (
        <CinematicStage scenes={CHAPTER5_ARRIVAL_SCENES} eventId="chapter-5" frameTitle="第五章 · 黎明崩塌的真相"
          onDone={() => { g.setFlag('chapter5ArrivalSeen', true); setCinema(null); play('unlock'); }} />
      )}
      {cinema === 'ch5truth' && (
        <CinematicStage scenes={CHAPTER5_TRUTH_SCENES} eventId="chapter-5" frameTitle="第五章 · 黎明崩塌"
          onDone={() => { g.setFlag('chapter5TruthSeen', true); setCinema(null); play('levelup'); }} />
      )}
      {cinema === 'ch5' && (
        <CinematicStage scenes={CHAPTER5_VICTORY_SCENES} eventId="chapter-5" frameTitle="第五章 · 黎明崩塌的真相"
          onDone={() => { g.setFlag('chapter5CinematicShown', true); setCinema(null); play('levelup'); g.toast('warn', '原初核心坐标已解锁——第六章入口开放。'); }} />
      )}
      {cinema === 'ch6arrive' && (
        <CinematicStage scenes={CHAPTER6_ARRIVAL_SCENES} eventId="chapter-6" frameTitle="第六章 · 起源之外"
          onDone={() => { g.setFlag('chapter6ArrivalSeen', true); setCinema(null); play('unlock'); }} />
      )}
      {cinema === 'ch6engel' && (
        <CinematicStage scenes={CHAPTER6_ENGEL_SCENES} eventId="chapter-6" frameTitle="第六章 · 最后的意识回声"
          onDone={() => { g.setFlag('chapter6EngelSeen', true); setCinema(null); play('levelup'); }} />
      )}
      {cinema === 'ch6' && (
        <CinematicStage scenes={CHAPTER6_VICTORY_SCENES} eventId="chapter-6" frameTitle="第六章 · 起源之外"
          onDone={() => {
            g.setFlag('chapter6CinematicShown', true);
            setCinema(null);
            play('levelup');
            g.toast('warn', '最终裁决结束——前往结局档案做出你的选择。');
          }} />
      )}
    </div>
  );
}
