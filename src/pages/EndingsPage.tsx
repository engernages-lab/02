import { useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import { ENDINGS, endingById, endingEligible } from '../game/lore/endings';
import { endingScene } from '../game/lore/endingScenes';
import { fragmentProgress, hasFragment } from '../game/lore/fragments';
import {
  CREATOR_FRAGMENTS, FINAL_MEMORY,
} from '../game/lore/fragments';
import type { StoryScene } from '../game/lore/types';
import { normalizeRewards } from '../game/rewards';
import CinematicStage from '../components/CinematicStage';
import { play } from '../services/sound';

/** 结局档案：三个固定结局（两主一隐藏），达成后可回顾完整演出 */
export default function EndingsPage() {
  const g = useGame();
  const p = g.player;
  const unlocked = p.progress.endings || [];
  const flags = p.progress.flags || {};
  const trust = normalizeRewards(p.rewards).trust;
  const fp = fragmentProgress(p.meta.memoryFragments || []);
  const finalSeen = p.progress.vault?.finalSeen === true;
  const chapterDone = flags.chapter6Done === true;

  // 展示用可用性：把「选择」当作各自的选项来判定条件（真正选择时才提交）
  const eligible = useMemo(() => ENDINGS
    .filter(e => endingEligible(e, {
      fragments: p.meta.memoryFragments || [],
      flags: { chapter6Done: chapterDone, finalMemorySeen: finalSeen },
      trust,
      choice: e.id,
    }))
    .map(e => e.id as string), [p.meta.memoryFragments, chapterDone, finalSeen, trust]);

  const [playing, setPlaying] = useState<StoryScene | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const choose = (id: 'dawn' | 'order' | 'beyond') => {
    if (!chapterDone) { play('deny'); g.toast('warn', '终章尚未抵达——完成终章后才能做出最终选择。'); return; }
    if (!eligible.includes(id)) { play('deny'); g.toast('warn', '该结局的条件尚未满足。'); return; }
    play('unlock');
    setChosen(id);
    g.recordEnding(id);
    const sc = endingScene(String(id));
    if (sc) setPlaying(sc);
  };

  return (
    <div className="page page-anim">
      <div className="page-inner" style={{ maxWidth: 980 }}>
        <div className="hud">
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
          <div>
            <div className="hud-title">结局档案</div>
            <div className="hud-sub">ENDINGS · 三种终局</div>
          </div>
          <div className="hud-spacer" />
          <span className="hud-chip gold">已达成 {unlocked.length} / {ENDINGS.length}</span>
          <span className={'hud-chip' + (chapterDone ? ' green' : '')}>{chapterDone ? '终章已抵达' : '终章未抵达'}</span>
        </div>

        <div className="ending-grid">
          {ENDINGS.map(e => {
            const done = unlocked.includes(e.id);
            const ok = eligible.includes(e.id);
            return (
              <div className={'ending-card' + (done ? ' done' : '') + (e.kind === 'hidden' ? ' hidden' : '')} key={e.id}>
                <div className="ec-head">
                  <span className="ec-order">{String(e.order).padStart(2, '0')}</span>
                  <span className={'chip ' + (done ? 'green' : ok ? 'cyan' : 'dim')}>
                    {done ? '已达成' : ok ? '可达成' : '未解锁'}
                  </span>
                </div>
                <div className="ec-title">{done || ok || e.kind === 'main' ? '《' + e.title + '》' : '《待解锁的结局》'}</div>
                <div className="ec-kind">{e.kind === 'hidden' ? '隐藏结局' : '主要结局'}</div>
                <div className="ec-desc">{e.kind === 'hidden' && !done && !ok ? '击败 K-0、集齐全部创世主碎片、查看最终记忆档案后，才会浮现的选择。' : e.summary}</div>
                {e.kind === 'hidden' && !done && (
                  <div className="ec-req">
                    <span className={'chip ' + (fp.owned >= fp.total ? 'green' : 'dim')}>碎片 {fp.owned}/{fp.total}</span>
                    <span className={'chip ' + (finalSeen ? 'green' : 'dim')}>最终档案 {finalSeen ? '已阅' : '未阅'}</span>
                    <span className={'chip ' + (trust >= 75 ? 'green' : 'dim')}>信任 {trust}/75</span>
                  </div>
                )}
                <div className="ec-actions">
                  <button className="nxbtn small primary" disabled={!ok} onClick={() => choose(e.id)}>
                    {done ? '重看演出' : '做出选择'}
                  </button>
                  {done && endingScene(e.id) && (
                    <button className="nxbtn small ghost" onClick={() => { play('click'); setPlaying(endingScene(String(e.id))!); }}>回顾 ▸</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!chapterDone && (
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="panel-title">终章前提示</div>
            <div className="dim" style={{ fontSize: 12.5, lineHeight: 1.9 }}>
              三个结局都必须在终章做出选择后才会结算。普通结局只要求抵达终章；隐藏结局还需要
              六枚创世主碎片、最终记忆档案、以及 MIRA 的完全信任——这些条件只能通过真实游玩获得，无法用贡献点购买。
            </div>
          </div>
        )}
        {chosen && <div className="panel" style={{ marginTop: 12 }}><div className="panel-title">已记录结局</div>
          <div style={{ fontSize: 13.5 }}>你选择了《{endingById(chosen)?.title}》——结局已写入档案，可随时回来重看。</div></div>}
      </div>

      {playing && <CinematicStage scenes={[playing]} frameTitle="结局演出" replay onDone={() => setPlaying(null)} />}
    </div>
  );
}
