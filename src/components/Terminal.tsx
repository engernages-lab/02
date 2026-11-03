import { useEffect, useRef } from 'react';

export type TermKind = 'cmd' | 'out' | 'err' | 'sys' | 'ok' | 'warn' | 'muted';
export interface TermLine { kind: TermKind; text: string }

export default function Terminal({ lines, title = '维修终端', maxHeight = 320, autoScroll = true }: {
  lines: TermLine[];
  title?: string;
  maxHeight?: number;
  autoScroll?: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoScroll && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines, autoScroll]);

  return (
    <div className="term" style={{ height: '100%' }}>
      <div className="term-head">
        <span className="dot r" /><span className="dot y" /><span className="dot g" />
        <span style={{ marginLeft: 6 }}>{title}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>PYTHON 3.12 // PYODIDE</span>
      </div>
      <div className="term-body" ref={bodyRef} style={{ maxHeight }}>
        {lines.length === 0 && <p className="term-line muted">—— 终端空闲。点击「运行代码」执行当前程序 ——</p>}
        {lines.map((l, i) => (
          <p key={i} className={'term-line ' + l.kind}>{l.text}</p>
        ))}
        <span className="term-cursor" />
      </div>
    </div>
  );
}
