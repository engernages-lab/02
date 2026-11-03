import { useEffect, useMemo, useRef, useState } from 'react';
import type { StoryLine } from '../game/story';

export interface DialogSystemProps {
  nodes: StoryLine[];
  onDone: () => void;
  onSeen?: (id: string) => void;
  speedMs?: number;
  animEnabled?: boolean;
  frameTitle?: string;
}

export default function DialogSystem({ nodes, onDone, onSeen, speedMs = 26, animEnabled = true, frameTitle = 'NEXUS 剧情记录' }: DialogSystemProps) {
  const index = useRef(0);
  const [chars, setChars] = useState(0);
  const node = nodes[Math.min(index.current, nodes.length - 1)];
  const typing = chars < node.text.length;

  useEffect(() => {
    if (!animEnabled || speedMs <= 0) {
      setChars(node.text.length);
      return;
    }
    setChars(0);
    const iv = window.setInterval(() => {
      setChars(c => {
        if (c >= node.text.length) {
          window.clearInterval(iv);
          return c;
        }
        return c + 1;
      });
    }, speedMs);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, animEnabled, speedMs]);

  const advance = () => {
    if (typing) { setChars(node.text.length); return; }
    if (node.choices) return;
    onSeen?.(node.id);
    const ni = index.current + 1;
    if (ni >= nodes.length) { onDone(); return; }
    index.current = ni;
    setChars(0);
  };

  const choose = (next?: string) => {
    onSeen?.(node.id);
    if (!next) { index.current += 1; setChars(0); return; }
    const ni = nodes.findIndex(n => n.id === next);
    if (ni < 0) { onDone(); return; }
    index.current = ni;
    setChars(0);
  };

  const skipAll = () => {
    nodes.forEach(n => onSeen?.(n.id));
    onDone();
  };

  const text = useMemo(() => node.text.slice(0, chars), [node.text, chars]);

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
          <div className={'dlg-avatar kind-' + node.kind}>{node.speaker.slice(0, 1)}</div>
          <div className="dlg-body">
            <div className={'dlg-name kind-' + node.kind}>{node.speaker}</div>
            <div className={'dlg-text' + (typing ? ' dlg-cursor' : '')}>{text}</div>
            {!typing && node.choices && (
              <div className="dlg-choices">
                {node.choices.map((c, i) => (
                  <button key={i} className="dlg-choice" onClick={() => choose(c.next)}>{c.label}</button>
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
