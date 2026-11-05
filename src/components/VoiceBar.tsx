import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { normalizeVoice, speech, speakLine, VoiceState } from '../services/voice';

/** 是否已经提示过音色问题（每局只提示一次） */
let hinted = false;

/**
 * 语音控制条：播放 / 暂停 / 继续 / 停止 + 播放声波。
 * 任何时刻只允许一段语音：speak 内部会先 cancel 上一段。
 */
export default function VoiceBar({ text, kind, compact = false }: { text: string; kind?: string; compact?: boolean }) {
  const g = useGame();
  const voice = normalizeVoice(g.player.settings.voice);
  const [state, setState] = useState<VoiceState>('idle');
  const stateRef = useRef<VoiceState>('idle');
  stateRef.current = state;

  useEffect(() => {
    const un = speech.onState(s => setState(s));
    speech.applySettings(voice);
    return un;
  }, [voice]);

  // 离开当前台词时停止（切换上下文/卸载）
  useEffect(() => () => { speech.stop(); }, []);

  const ensureHint = () => {
    if (hinted) return;
    const hint = speech.chineseVoiceHint();
    if (hint) { hinted = true; g.toast('warn', hint); }
  };

  const play = () => {
    if (!voice.enabled) { g.toast('warn', '语音已关闭——可在设置中重新开启。'); return; }
    if (stateRef.current === 'paused') { speech.resume(); return; }
    if (stateRef.current === 'speaking') { speech.pause(); return; }
    ensureHint();
    const ok = speakLine(text, kind);
    if (!ok) { g.toast('warn', '这段没有可朗读的内容，或浏览器语音不可用。'); }
  };

  const stop = () => { speech.stop(); };

  const speaking = state === 'speaking';
  const paused = state === 'paused';

  return (
    <div className={'voice-bar' + (compact ? ' compact' : '') + (speaking ? ' speaking' : '') + (paused ? ' paused' : '')}>
      <button
        className={'voice-btn' + (speaking ? ' on' : '') + (paused ? ' paused' : '')}
        title={!speech.supported ? '当前浏览器不支持语音' : !voice.enabled ? '语音已关闭' : paused ? '继续朗读' : speaking ? '暂停朗读' : '朗读这句'}
        aria-label={paused ? '继续朗读' : speaking ? '暂停朗读' : '朗读这句'}
        disabled={!speech.supported || !voice.enabled}
        onClick={e => { e.stopPropagation(); play(); }}
      >
        {paused ? '▶' : speaking ? '⏸' : '🔊'}
        {(speaking || paused) && (
          <span className={'wave' + (paused ? ' frozen' : '')} aria-hidden="true"><i /><i /><i /></span>
        )}
      </button>
      {(speaking || paused) && (
        <button
          className="voice-stop"
          title="停止朗读"
          aria-label="停止朗读"
          onClick={e => { e.stopPropagation(); stop(); }}
        >⏹</button>
      )}
    </div>
  );
}
