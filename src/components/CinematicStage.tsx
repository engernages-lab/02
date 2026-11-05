import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StoryScene, CinematicLine } from '../game/lore/types';
import { useGame } from '../store/gameStore';
import { applyPlayerName, displayNameOf, DISPLAY_NAME_MAX } from '../game/identity';
import { normalizeVoice, speech, speakLine, type VoiceState } from '../services/voice';
import VoiceBar from './VoiceBar';
import { play, type SfxName } from '../services/sound';

export interface CinematicStageProps {
  scenes: StoryScene[];
  /** 剧情事件 id：进入即标记该事件已解锁 */
  eventId?: string;
  frameTitle?: string;
  onDone: () => void;
  /** 名称设置步骤的回调（不传则该步骤直接跳过） */
  onRename?: (name: string) => { ok: boolean; reason?: string };
  /** 回顾模式：不写阅读状态、不解锁事件（档案馆回放用） */
  replay?: boolean;
}

interface Beat { si: number; li: number }

/**
 * 独立剧情演出界面：全屏场景 + 背景/特效 + 角色全息 + 台词 + 选项 + 名称设置。
 * 与挑战页/地图完全分离，只负责「演」，不含任何剧情数据。
 */
export default function CinematicStage({ scenes, eventId, frameTitle = 'NEXUS 剧情演出', onDone, onRename, replay = false }: CinematicStageProps) {
  const g = useGame();
  const voice = useMemo(() => normalizeVoice(g.player.settings.voice), [g.player.settings.voice]);
  const displayName = displayNameOf(g.player);
  const anim = g.player.settings.animations;
  const typeMs = g.player.settings.typewriterMs;

  const beats = useMemo<Beat[]>(() => {
    const out: Beat[] = [];
    scenes.forEach((s, si) => s.lines.forEach((_, li) => out.push({ si, li })));
    return out;
  }, [scenes]);

  const [bi, setBi] = useState(0);
  const [chars, setChars] = useState(0);
  const [vState, setVState] = useState<VoiceState>('idle');
  const [nameDraft, setNameDraft] = useState(displayName);
  const [nameError, setNameError] = useState('');
  const doneRef = useRef(false);

  const safeBi = Math.max(0, Math.min(bi, beats.length - 1));
  const scene: StoryScene | undefined = scenes[beats[safeBi]?.si ?? 0];
  const node: CinematicLine | undefined = scene?.lines[beats[safeBi]?.li ?? 0];

  const trust = g.player.rewards?.trust ?? 0;
  const rawText = node && node.altByTrust
    ? ([...node.altByTrust].filter(a => trust >= a.min).sort((a, b) => b.min - a.min)[0]?.text || node.text)
    : (node?.text || '');
  const fullText = applyPlayerName(rawText, displayName);
  const speakerName = node && node.speaker === 'R-07' ? displayName : (node?.speaker || '');
  const typing = chars < fullText.length;

  // 事件解锁（进入演出即记录）
  useEffect(() => {
    if (eventId && !replay) g.unlockStoryEvent(eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, replay]);

  // 语音状态订阅
  useEffect(() => {
    const un = speech.onState(s => setVState(s));
    speech.applySettings(voice);
    return un;
  }, [voice]);

  // 换行：重置打字机 + 播放该行音效
  useEffect(() => {
    if (!node) return;
    setChars(0);
    if (node.sfx) {
      try { play(node.sfx as SfxName); } catch { /* 音效名不存在时忽略 */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  // 打字机
  useEffect(() => {
    if (!node) return;
    if (!anim || typeMs <= 0) { setChars(fullText.length); return; }
    const iv = window.setInterval(() => {
      setChars(c => {
        if (c >= fullText.length) { window.clearInterval(iv); return c; }
        return c + 1;
      });
    }, typeMs);
    return () => window.clearInterval(iv);
  }, [node?.id, fullText, anim, typeMs]);

  // 打字完成后的自动朗读
  useEffect(() => {
    if (!node) return;
    if (!voice.enabled || !voice.autoRead) return;
    if (typing || !speech.supported) return;
    speakLine(fullText, node.kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing, node?.id, voice.enabled, voice.autoRead]);

  useEffect(() => () => { speech.stop(); }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    speech.stop();
    onDone();
  }, [onDone]);

  const goNext = useCallback(() => {
    if (bi >= beats.length - 1) finish();
    else setBi(bi + 1);
  }, [bi, beats.length, finish]);

  const advance = useCallback(() => {
    if (!node) return;
    if (typing) { setChars(fullText.length); return; }
    if (node.input || node.choices) return;
    if (!replay) g.markStory(node.id);
    speech.stop();
    goNext();
  }, [node, typing, fullText, g, goNext, replay]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // 键盘：空格 / 回车推进
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advanceRef.current(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const skipAll = () => {
    speech.stop();
    if (!replay) {
      beats.forEach(b => {
        const ln = scenes[b.si]?.lines[b.li];
        if (ln) g.markStory(ln.id);
      });
    }
    finish();
  };

  const choose = (label: string, next?: string) => {
    if (!node) return;
    if (!replay) {
      g.markStory(node.id);
      g.recordStoryChoice(node.id, label);
    }
    speech.stop();
    play('click');
    if (next) {
      const idx = beats.findIndex(b => scenes[b.si]?.lines[b.li]?.id === next);
      if (idx >= 0) { setBi(idx); return; }
    }
    goNext();
  };

  const confirmName = () => {
    if (!node) return;
    const apply = () => {
      if (!replay) g.markStory(node.id);
      goNext();
    };
    if (!onRename) { apply(); return; }
    const r = onRename(nameDraft);
    if (!r.ok) { setNameError(r.reason || '该名称不可用。'); play('deny'); return; }
    setNameError('');
    apply();
  };

  const speakCurrent = () => {
    if (!node) return;
    if (vState === 'speaking') { speech.stop(); return; }
    speakLine(fullText, node.kind);
  };

  if (!node || !scene) return null;

  return (
    <div className={'dlg-root cine-root cine-bg-' + scene.bg} onClick={advance}>
      <div className={'cine-bg bg-' + scene.bg} />
      <div className={'cine-fx fx-' + (scene.fx || 'none')} />
      <div
        className="cine-stage"
        onClick={e => {
          e.stopPropagation();
          if ((e.target as HTMLElement).closest('button, input, textarea')) return;
          advance();
        }}
      >
        <div className="cine-top">
          <span className="cine-brand">◈ {frameTitle}</span>
          <span className="dlg-progress">{safeBi + 1} / {beats.length}</span>
          <span className="sp" />
          <button className="nxbtn ghost small" onClick={skipAll}>跳过 ▸▸</button>
        </div>

        <div className="cine-titlecard" key={scene.id}>
          <div className="ct-main">{scene.title}</div>
          {scene.subtitle && <div className="ct-sub">{scene.subtitle}</div>}
        </div>

        <div className="cine-main">
          <div className={'cine-portrait kind-' + node.kind + (vState === 'speaking' ? ' speaking' : '')}>
            <span className="cp-glyph">{speakerName.slice(0, 1)}</span>
            <span className="cp-ring" />
          </div>
          <div className="cine-body">
            <div className="dlg-name-row">
              <div className={'dlg-name kind-' + node.kind + (vState === 'speaking' ? ' speaking' : '')}>{speakerName}</div>
              <VoiceBar text={fullText} kind={node.kind} />
            </div>

            <div className={'dlg-text cine-text' + (typing ? ' dlg-cursor' : '')}>{fullText.slice(0, chars)}</div>

            {!typing && node.choices && (
              <div className="dlg-choices">
                {node.choices.map((c, i) => (
                  <button key={i} className="dlg-choice" onClick={() => choose(c.label, c.next)}>{c.label}</button>
                ))}
              </div>
            )}

            {!typing && node.input === 'playerName' && (
              <div className="cine-input">
                <input
                  value={nameDraft}
                  maxLength={DISPLAY_NAME_MAX}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmName(); } }}
                  placeholder={'1–' + DISPLAY_NAME_MAX + ' 个字符'}
                  aria-label="玩家显示名称"
                />
                <div className="cine-input-row">
                  <button className="nxbtn small primary" onClick={confirmName}>确认名称</button>
                  <button className="nxbtn small ghost" onClick={() => { setNameDraft('R-07'); }}>沿用 R-07</button>
                </div>
                {nameError && <div className="cine-err">{nameError}</div>}
                <div className="cine-hint">R-07 是永久实验编号；这里修改的只是别人对你的称呼。</div>
              </div>
            )}
          </div>
        </div>

        <div className="dlg-actions">
          <span className="dlg-clickhint">
            <b>点击对话</b>继续{typing ? '（正在输入…）' : ''} · 空格 / 回车
          </span>
          <span className="sp" />
          <span className="cine-rec">REC-{node.id.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
