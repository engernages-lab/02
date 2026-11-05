import { useEffect, useMemo, useState } from 'react';
import type { StoryScene } from '../game/lore/types';
import type { StoryLine } from '../game/story';
import { useGame } from '../store/gameStore';
import {
  CREATOR_FRAGMENTS, FINAL_MEMORY, HIDDEN_MEMORY, fragmentProgress, hasFragment, memorySceneOf, type CreatorFragmentDef,
} from '../game/lore/fragments';
import { STORY_EVENTS, normalizeStoryReadState } from '../game/lore/events';
import { replayFor } from '../game/lore/replay';
import CinematicStage from '../components/CinematicStage';
import DialogSystem from '../components/DialogSystem';
import { play } from '../services/sound';

/**
 * 创世主记忆档案馆：剧情收藏系统（不是商城）。
 * - 六枚碎片按故事顺序陈列，未收集显示加密态；
 * - 已收集可打开独立详情：完整剧情 + 恩格尔记忆影像；
 * - 六枚齐备解锁最终记忆档案《超越起源》；
 * - 可回顾已解锁的主线事件（回放不改变进度）。
 */
export default function VaultPage() {
  const g = useGame();
  const p = g.player;
  const owned = p.meta.memoryFragments || [];
  const fp = fragmentProgress(owned);
  const allOwned = fp.owned >= fp.total;
  const log = p.meta.fragmentLog || {};
  const trust = p.rewards?.trust ?? 0;
  const vault = p.progress.vault || { read: [], finalSeen: false, lastOpened: null };

  const [openId, setOpenId] = useState<string | null>(() => {
    const last = vault.lastOpened;
    return last && CREATOR_FRAGMENTS.some(f => f.id === last) ? last : null;
  });
  const [finalOpen, setFinalOpen] = useState(false);
  const [playing, setPlaying] = useState<StoryScene[] | null>(null);
  const [replayNodes, setReplayNodes] = useState<{ nodes: StoryLine[]; title: string } | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  // 进入档案馆即恢复上次浏览位置（已在 state 初始化中处理）
  useEffect(() => {
    if (openId) g.markVaultRead(openId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detail = useMemo(() => CREATOR_FRAGMENTS.find(f => f.id === openId) || null, [openId]);
  const ownedCount = fp.owned;

  const openFragment = (f: CreatorFragmentDef) => {
    if (!hasFragment(owned, f.id)) {
      play('deny');
      setShakeId(f.id);
      window.setTimeout(() => setShakeId(null), 460);
      g.toast('warn', '该碎片仍加密：击败第 ' + f.order + ' 章 Boss 后归档。');
      return;
    }
    play('click');
    setOpenId(f.id);
    g.markVaultRead(f.id);
  };

  const playMemory = (src: { id: string; title: string; subtitle: string; memory: string[] }) => {
    play('unlock');
    setPlaying([memorySceneOf(src)]);
  };

  const openFinal = () => {
    if (!allOwned) {
      play('deny');
      g.toast('warn', '需要集齐六枚创世主碎片才能解锁最终记忆档案。');
      return;
    }
    play('unlock');
    setFinalOpen(true);
    g.markVaultFinalSeen();
  };

  const replayEvent = (eventId: string, title: string) => {
    const src = replayFor(eventId);
    if (!src) { play('deny'); return; }
    play('click');
    if (src.kind === 'scenes') setPlaying(src.scenes);
    else setReplayNodes({ nodes: src.nodes, title });
  };

  const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
  const fmtTime = (t: number | undefined) => {
    if (!t) return '早期归档';
    try { return new Date(t).toLocaleString('zh-CN'); } catch { return '已归档'; }
  };

  return (
    <div className="page page-anim vault-page">
      <div className="page-inner" style={{ maxWidth: 1080 }}>
        <div className="hud">
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
          <div>
            <div className="hud-title">创世主记忆档案馆</div>
            <div className="hud-sub">CREATOR MEMORY VAULT · 六枚碎片 · 剧情收藏</div>
          </div>
          <div className="hud-spacer" />
          <span className="hud-chip gold">碎片 {ownedCount} / {fp.total}</span>
          <span className={'hud-chip' + (allOwned ? ' green' : '')}>{allOwned ? '最终档案已解锁' : '最终档案加密中'}</span>
        </div>

        {/* 全息展厅 */}
        <div className="vault-hall">
          <div className="vh-rings" aria-hidden="true"><span /><span /><span /></div>
          <div className="vh-grid">
            {CREATOR_FRAGMENTS.map(f => {
              const has = hasFragment(owned, f.id);
              const read = vault.read.includes(f.id);
              return (
                <button
                  key={f.id}
                  className={'vault-slot' + (has ? ' owned' : ' locked') + (openId === f.id ? ' active' : '') + (shakeId === f.id ? ' shake' : '')}
                  onClick={() => openFragment(f)}
                  title={has ? f.title : '加密碎片'}
                >
                  <span className="vs-order">{String(f.order).padStart(2, '0')}</span>
                  <span className="vs-glyph">{has ? '◇' : '🔒'}</span>
                  <span className="vs-name">{has ? f.title : '██████'}</span>
                  <span className="vs-chapter">{has ? '第 ' + f.order + ' 章 · ' + f.bossId.toUpperCase() : '加密状态'}</span>
                  {has && read && <span className="vs-read">已阅</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 碎片详情 */}
        {detail && (
          <div className="panel vault-detail">
            <div className="panel-title">
              {String(detail.order).padStart(2, '0')} · 《{detail.title}》
              <span className="panel-tag">{detail.bossId.toUpperCase()}</span>
            </div>
            <div className="vd-sub">{detail.subtitle}</div>
            <div className="vd-meta">
              <span className="chip">第 {detail.order} 章</span>
              <span className="chip cyan">归档时间：{fmtTime(log[detail.id])}</span>
              <span className="chip green">状态：已归档</span>
            </div>
            <div className="vd-quote">{detail.content}</div>
            <div className="vd-story">
              {detail.story.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="vd-actions">
              <button className="nxbtn primary" onClick={() => playMemory({ id: detail.id, title: detail.title, subtitle: detail.subtitle, memory: detail.memory })}>
                ▶ 播放恩格尔记忆影像
              </button>
              <button className="nxbtn ghost" onClick={() => { play('click'); setOpenId(null); g.setVaultLastOpened(null); }}>收起</button>
            </div>
          </div>
        )}

        {/* 最终记忆档案 */}
        <div className={'panel vault-final' + (allOwned ? ' unlocked' : ' sealed')}>
          <div className="panel-title">
            最终记忆档案 · 《{FINAL_MEMORY.title}》
            <span className="panel-tag">{allOwned ? (vault.finalSeen ? '已阅' : '已解锁') : fp.owned + ' / ' + FINAL_MEMORY.requireCount}</span>
          </div>
          {!allOwned ? (
            <div className="vf-locked">
              <div className="vf-lock">▣</div>
              <div>
                <div className="vf-line">档案封存在档案馆最深处。</div>
                <div className="dim" style={{ fontSize: 12.5 }}>集齐六枚创世主碎片后自动解锁。</div>
              </div>
            </div>
          ) : finalOpen ? (
            <>
              <div className="vd-sub">{FINAL_MEMORY.subtitle}</div>
              <div className="vd-story">
                {FINAL_MEMORY.story.map((line, i) => <p key={i}>{line}</p>)}
              </div>
              <div className="vd-actions">
                <button className="nxbtn primary" onClick={() => playMemory({ id: FINAL_MEMORY.id, title: FINAL_MEMORY.title, subtitle: FINAL_MEMORY.subtitle, memory: FINAL_MEMORY.memory })}>
                  ▶ 播放最终记忆影像
                </button>
              </div>
            </>
          ) : (
            <div className="vd-actions" style={{ marginTop: 4 }}>
              <button className="nxbtn primary" onClick={openFinal}>打开最终记忆档案</button>
            </div>
          )}
        </div>

        {/* 隐藏记忆（MIRA 信任度解锁） */}
        <div className={'panel vault-hidden' + (trust >= HIDDEN_MEMORY.requireTrust ? ' unlocked' : ' sealed')}>
          <div className="panel-title">隐藏记忆 · {HIDDEN_MEMORY.title}<span className="panel-tag">信任度 ≥ {HIDDEN_MEMORY.requireTrust}</span></div>
          {trust >= HIDDEN_MEMORY.requireTrust ? (
            <>
              <div className="vd-sub">{HIDDEN_MEMORY.subtitle}</div>
              <div className="vd-story">
                {HIDDEN_MEMORY.text.map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </>
          ) : (
            <div className="vf-locked">
              <div className="vf-lock">▣</div>
              <div>
                <div className="vf-line">这段记忆被 MIRA 锁着。</div>
                <div className="dim" style={{ fontSize: 12.5 }}>当前信任度 {trust} / {HIDDEN_MEMORY.requireTrust}——通过修复与章节事件提升信任度。</div>
              </div>
            </div>
          )}
        </div>

        {/* 主线事件回顾 */}
        <div className="panel vault-events">
          <div className="panel-title">主线事件回顾<span className="panel-tag">回放不改变进度</span></div>
          {STORY_EVENTS.filter(e => replayFor(e.id)).map(e => {
            const unlocked = story.unlocked.includes(e.id);
            return (
              <div className={'vault-event' + (unlocked ? '' : ' locked')} key={e.id}>
                <span className="ve-id">{e.kind === 'boss' ? '⚡' : '◈'}</span>
                <div className="ve-main">
                  <div className="ve-title">{unlocked ? e.title : '🔒 ' + e.title}</div>
                  <div className="dim" style={{ fontSize: 11.5 }}>{unlocked ? '已解锁 · 可回放' : '尚未解锁'}</div>
                </div>
                <button className="nxbtn small ghost" disabled={!unlocked} onClick={() => replayEvent(e.id, e.title)}>回放 ▸</button>
              </div>
            );
          })}
        </div>
      </div>

      {playing && (
        <CinematicStage
          scenes={playing}
          frameTitle="记忆影像 · 回放"
          replay
          onDone={() => setPlaying(null)}
        />
      )}

      {replayNodes && (
        <DialogSystem
          nodes={replayNodes.nodes}
          frameTitle={replayNodes.title + ' · 回放'}
          speedMs={p.settings.typewriterMs}
          animEnabled={p.settings.animations}
          onDone={() => setReplayNodes(null)}
        />
      )}
    </div>
  );
}
