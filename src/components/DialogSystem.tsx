import { useEffect, useMemo, useRef, useState } from 'react';
import type { StoryLine } from '../game/story';
import { useGame } from '../store/gameStore';
import { applyPlayerName, displayNameOf } from '../game/identity';
import { normalizeVoice, speech, speakLine, type VoiceState } from '../services/voice';
import VoiceBar from './VoiceBar';

export interface DialogSystemProps {
  nodes: StoryLine[];
  onDone: () => void;
  onSeen?: (id: string) => void;
  speedMs?: number;
  animEnabled?: boolean;
  frameTitle?: string;
  /** 剧情事件 id：进入对话即标记该事件已解锁（用于档案/回顾） */
  eventId?: string;
}

export default function DialogSystem({ nodes, onDone, onSeen, speedMs = 26, animEnabled = true, frameTitle = 'NEXUS 剧情记录', eventId }: DialogSystemProps) {
  const g = useGame();
  const voice = useMemo(() => normalizeVoice(g.player.settings.voice), [g.player.settings.voice]);
  const index = useRef(0);
  const [chars, setChars] = useState(0);
  const [vState, setVState] = useState<VoiceState>('idle');
  const node = nodes[Math.min(index.current, nodes.length - 1)];

  // 玩家显示名：说话人标签与正文统一走身份系统（原始编号仍固定为 R-07）
  const displayName = displayNameOf(g.player);
  const speakerName = node.speaker === 'R-07' ? displayName : node.speaker;
  const fullText = applyPlayerName(node.text, displayName);
  const typing = chars < fullText.length;

  // 进入对话 = 该剧情事件已解锁
  useEffect(() => {
    if (eventId) g.unlockStoryEvent(eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // 语音状态订阅（用于按钮动画/角色高亮）
  useEffect(() => {
    const un = speech.onState(s => setVState(s));
    speech.applySettings(voice);
    return un;
  }, [voice]);

  // 打字完成后再自动朗读（文字未显示完不抢先播放）
  useEffect(() => {
    if (!voice.enabled || !voice.autoRead) return;
    if (typing) return;
    if (!speech.supported) return;
    speakLine(fullText, node.kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing, node.id, voice.enabled, voice.autoRead]);

  // 卸载/回落时停止语音
  useEffect(() => () => { speech.stop(); }, []);

  useEffect(() => {
    if (!animEnabled || speedMs <= 0) {
      setChars(fullText.length);
      return;
    }
    setChars(0);
    const iv = window.setInterval(() => {
      setChars(c => {
        if (c >= fullText.length) {
          window.clearInterval(iv);
          return c;
        }
        return c + 1;
      });
    }, speedMs);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, animEnabled, speedMs, fullText]);

  const speakCurrent = () => {
    if (vState === 'speaking') { speech.stop(); return; }
    speakLine(fullText, node.kind);
  };

  const advance = () => {
    if (typing) { setChars(fullText.length); return; }
    if (node.choices) return;
    speech.stop();
    onSeen?.(node.id);
    const ni = index.current + 1;
    if (ni >= nodes.length) { onDone(); return; }
    index.current = ni;
    setChars(0);
  };

  const choose = (next?: string, label?: string) => {
    speech.stop();
    onSeen?.(node.id);
    if (label) g.recordStoryChoice(node.id, label);
    if (!next) { index.current += 1; setChars(0); return; }
    const ni = nodes.findIndex(n => n.id === next);
    if (ni < 0) { onDone(); return; }
    index.current = ni;
    setChars(0);
  };

  const skipAll = () => {
    speech.stop();
    nodes.forEach(n => onSeen?.(n.id));
    onDone();
  };

  const text = useMemo(() => fullText.slice(0, chars), [fullText, chars]);

  return (
    <div className="dlg-root" onClick={advance}>
      <div
        className="dlg-stage"
        onClick={e => {
          e.stopPropagation();
          // 点击对话框内部（按钮除外）同样推进对话——此前只有点击遮罩才生效
          if ((e.target as HTMLElement).closest('button')) return;
          advance();
        }}
      >
        <div className="dlg-topbar">
          <span className="cyan">{frameTitle}</span>
          <span className="dlg-progress">{Math.min(index.current + 1, nodes.length)} / {nodes.length}</span>
          <span className="sp" />
          <button className="nxbtn ghost small" onClick={skipAll}>跳过 ▸▸</button>
        </div>
        <div className="dlg-main">
          <div className={'dlg-avatar kind-' + node.kind}>{speakerName.slice(0, 1)}</div>
          <div className="dlg-body">
            <div className='dlg-name-row'>
              <div className={'dlg-name kind-' + node.kind + (vState === 'speaking' ? ' speaking' : '')}>{speakerName}</div>
              <VoiceBar text={fullText} kind={node.kind} />
            </div>
            <div className={'dlg-text' + (typing ? ' dlg-cursor' : '')}>{text}</div>
            {!typing && node.choices && (
              <div className="dlg-choices">
                {node.choices.map((c, i) => (
                  <button key={i} className="dlg-choice" onClick={() => choose(c.next, c.label)}>{c.label}</button>
                ))}
              </div>
            )}
            {!typing && !node.choices && index.current >= nodes.length - 1 && (
              <div className="dlg-choices">
                <button className="dlg-choice" onClick={() => { onSeen?.(node.id); onDone(); }}>继续 ▸</button>
              </div>
            )}
          </div>
        </div>
        <div className="dlg-actions">
          <span className="dlg-clickhint"><b>点击对话</b>继续{typing ? '（正在输入…）' : ''}</span>
          <span className="sp" />
          <span style={{ fontSize: 11, color: '#4A6E85', fontFamily: 'Consolas, monospace' }}>REC-{node.id.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
