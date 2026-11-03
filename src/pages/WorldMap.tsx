import { useEffect, useMemo, useState } from 'react';
import { SERVERS, serverById, levelsOfServer, levelUnlockState, levelById, type LevelDef } from '../game/levels';
import { CHAPTER1_COMPLETE, CHAPTER2_COMPLETE, CHAPTER3_COMPLETE, CHAPTER4_COMPLETE, CHAPTER5_COMPLETE, CHAPTER6_COMPLETE, TUTORIAL_DONE } from '../game/story';
import { bossForChapter } from '../game/bosses';
import DialogSystem from '../components/DialogSystem';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';
import ParticlesField from '../components/ParticlesField';

type NodeStatus = 'online' | 'damaged' | 'locked' | 'sealed';

const HUB = { x: 620, y: 365 };
const CHIP_COLOR: Record<NodeStatus, string> = {
  online: '#35D39A', damaged: '#FF5B64', locked: '#4A6E85', sealed: '#F3B75C',
};
const CHIP_TEXT: Record<NodeStatus, string> = {
  online: 'ONLINE', damaged: 'DAMAGED', locked: 'LOCKED', sealed: 'SEALED',
};
const ICON_COLOR: Record<NodeStatus, string> = {
  online: '#7FE8C4', damaged: '#FF8B92', locked: '#5E7C96', sealed: '#F5CE8E',
};

export default function WorldMap() {
  const g = useGame();
  const p = g.player.progress;
  const [sel, setSel] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [cinema, setCinema] = useState<'tut' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | null>(null);
  const [briefServer, setBriefServer] = useState<string | null>(null);

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
    if (ch6Done && !ch6Cin) setCinema('ch6');
    else if (ch5Done && !ch5Cin) setCinema('ch5');
    else if (ch4Done && !ch4Cin) setCinema('ch4');
    else if (ch3Done && !ch3Cin) setCinema('ch3');
    else if (ch2Done && !ch2Cin) setCinema('ch2');
    else if (ch1Done && !ch1Cin) setCinema('ch1');
    else if (tutDone && !tutCin && !ch1Done) setCinema('tut');
  }, [ch6Done, ch6Cin, ch5Done, ch5Cin, ch4Done, ch4Cin, ch3Done, ch3Cin, ch2Done, ch2Cin, ch1Done, ch1Cin, tutDone, tutCin]);

  const statusOf = useMemo(() => (id: string): NodeStatus => {
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

  const clickNode = (id: string) => {
    const s = serverById(id);
    const st = statusOf(id);
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

        <div className="map-wrap" style={{ position: 'relative' }}>
          <svg className="map-svg" viewBox="0 0 1240 660">
            {/* 网络连线 */}
            {SERVERS.map(s => {
              const st = statusOf(s.id);
              return (
                <line key={'ln' + s.id} x1={HUB.x} y1={HUB.y} x2={s.x} y2={s.y}
                  className={'map-link ' + (st === 'online' ? 'on' : st === 'damaged' ? 'damaged' : '')} />
              );
            })}
            {/* 中枢 */}
            <g>
              <circle cx={HUB.x} cy={HUB.y} r={58} fill="rgba(66,214,208,0.06)" stroke="rgba(66,214,208,0.5)" strokeWidth={1.5} />
              <circle cx={HUB.x} cy={HUB.y} r={44} fill="rgba(13,27,40,0.9)" stroke="rgba(66,214,208,0.7)" strokeWidth={2} />
              <text x={HUB.x} y={HUB.y} textAnchor="middle" dominantBaseline="central" fontSize={26} fill="#42D6D0">◉</text>
              <text x={HUB.x} y={HUB.y + 74} textAnchor="middle" fontSize={15} fontWeight={700} fill="#8FDDE3">修复局中枢</text>
              <text x={HUB.x} y={HUB.y + 92} textAnchor="middle" fontSize={10} fill="#4A6E85" fontFamily="Consolas, monospace">NEXUS CORE RELAY</text>
            </g>
            {/* 服务器节点 */}
            {SERVERS.map(s => {
              const st = statusOf(s.id);
              const shaking = shakeId === s.id;
              return (
                <g key={s.id} className={'node-group st-' + st + (shaking ? ' shake' : '')}
                  onClick={() => clickNode(s.id)} style={{ cursor: 'pointer' }}>
                  <circle className="node-ring" cx={s.x} cy={s.y} r={58} fill="none" strokeWidth={1.5}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                  <circle className="node-circle" cx={s.x} cy={s.y} r={46} strokeWidth={1.8}
                    style={{ backdropFilter: 'blur(2px)' }} />
                  <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={24} fill={ICON_COLOR[st]}>{s.icon}</text>
                  <text x={s.x} y={s.y + 66} textAnchor="middle" fontSize={15} fontWeight={700} fill="#EAF3FA">{s.name}</text>
                  <text x={s.x} y={s.y + 82} textAnchor="middle" fontSize={10.5} fill="#4A6E85" fontFamily="Consolas, monospace">{s.codename}</text>
                  <text x={s.x} y={s.y - 62} textAnchor="middle" fontSize={11} fill={CHIP_COLOR[st]} fontFamily="Consolas, monospace" letterSpacing={1.5}>{CHIP_TEXT[st]}</text>
                </g>
              );
            })}
          </svg>

          {/* 选中服务器的关卡面板 */}
          {selServer && (
            <div className="panel map-panel" style={{ backdropFilter: 'blur(10px)' }}>
              <div className="panel-title">{selServer.name}
                <span className="panel-tag">{selServer.codename}</span>
              </div>
              <div style={{ fontSize: 13, color: '#C6D9E6', marginBottom: 10 }}>{selServer.desc}</div>
              {(() => {
                const boss = bossForChapter(selServer.id);
                if (!boss) return null;
                const allDone = selLevels.length > 0 && selLevels.every(l => p.completedLevels.includes(l.id));
                if (!allDone) return null;
                const cleared = (p.bossesDone ?? []).includes(boss.id);
                return (
                  <div className="boss-entry">
                    <span className="chip echo">⚡ ECHO 分支</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#C9A7FF' }}>{boss.title}</div>
                      <div className="dim" style={{ fontSize: 12 }}>章节测试 · 综合本服务器全部知识点{cleared ? ' · 已击破' : ''}</div>
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
          frameTitle="训练终端 · 任务完成"
          onSeen={id => g.markStory(id)}
          onDone={() => { g.setFlag('tutorialCinematicShown', true); setCinema(null); play('unlock'); }}
        />
      )}
      {cinema === 'ch1' && (
        <DialogSystem
          nodes={CHAPTER1_COMPLETE}
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          frameTitle="第一章 · 完成"
          onSeen={id => g.markStory(id)}
          onDone={() => { g.setFlag('chapter1CinematicShown', true); setCinema(null); play('levelup'); }}
        />
      )}
      {cinema === 'ch2' && (
        <DialogSystem
          nodes={CHAPTER2_COMPLETE}
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          frameTitle="第二章 · 完成"
          onSeen={id => g.markStory(id)}
          onDone={() => { g.setFlag('chapter2CinematicShown', true); setCinema(null); play('levelup'); }}
        />
      )}
      {cinema === 'ch3' && (
        <DialogSystem
          nodes={CHAPTER3_COMPLETE}
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          frameTitle="第三章 · 完成"
          onSeen={id => g.markStory(id)}
          onDone={() => { g.setFlag('chapter3CinematicShown', true); setCinema(null); play('levelup'); }}
        />
      )}
      {cinema === 'ch4' && (
        <DialogSystem
          nodes={CHAPTER4_COMPLETE}
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          frameTitle="第四章 · 完成"
          onSeen={id => g.markStory(id)}
          onDone={() => { g.setFlag('chapter4CinematicShown', true); setCinema(null); play('levelup'); }}
        />
      )}
      {cinema === 'ch5' && (
        <DialogSystem
          nodes={CHAPTER5_COMPLETE}
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          frameTitle="第五章 · 完成"
          onSeen={id => g.markStory(id)}
          onDone={() => { g.setFlag('chapter5CinematicShown', true); setCinema(null); play('levelup'); }}
        />
      )}
      {cinema === 'ch6' && (
        <DialogSystem
          nodes={CHAPTER6_COMPLETE}
          speedMs={g.player.settings.typewriterMs}
          animEnabled={g.player.settings.animations}
          frameTitle="终章 · NEXUS 复苏"
          onSeen={id => g.markStory(id)}
          onDone={() => {
            g.setFlag('chapter6CinematicShown', true);
            setCinema(null);
            play('unlock');
            g.toast('success', 'NEXUS 全部服务器已复原——感谢游玩！');
          }}
        />
      )}
    </div>
  );
}
