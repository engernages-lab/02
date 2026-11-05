import { useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type * as MonacoNS from 'monaco-editor';

// Monaco 通过 CDN 按需加载（jsdelivr），避免把 monaco-editor 打进游戏包
// 本地内置 Monaco（public/monaco/vs，随构建分发，完全离线）；仅在本地缺失时才回退 CDN
const LOCAL_MONACO = (() => {
  try {
    const u = new URL('monaco/vs', document.baseURI).href;
    return u.replace(/\/+$/, '');
  } catch {
    return '';
  }
})();
const MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

loader.config({
  paths: {
    vs: LOCAL_MONACO || MONACO_CDN,
  },
});

let themeReady = false;
let edSeq = 0;

export const ERR_STYLE = '.nx-error-line { background: rgba(255, 91, 100, 0.13) !important; box-shadow: inset 3px 0 0 var(--red); } .nx-error-gutter { border-left: 3px solid var(--red); } .nx-debug-line { background: rgba(243, 183, 92, 0.16) !important; box-shadow: inset 3px 0 0 var(--orange); } .nx-debug-gutter { border-left: 3px solid var(--orange); } .nx-scan-line { background: rgba(66, 214, 208, 0.14) !important; box-shadow: inset 3px 0 0 #42D6D0; } .nx-scan-gutter { border-left: 3px solid #42D6D0; }';

export interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  height?: string | number;
  fontSize?: number;
  readOnly?: boolean;
  errorLine?: number | null;
  debugLine?: number | null;
  /** 扫描器定位到的可疑行（1 基） */
  markLines?: number[];
  onRun?: () => void;
  placeholder?: string;
}

export default function CodeEditor({
  value, onChange, height = '100%', fontSize = 15, readOnly = false,
  errorLine, debugLine, markLines, onRun, placeholder,
}: CodeEditorProps) {
  const edRef = useRef<MonacoNS.editor.IStandaloneCodeEditor | null>(null);
  const monRef = useRef<typeof MonacoNS | null>(null);
  const decRef = useRef<MonacoNS.editor.IEditorDecorationsCollection | null>(null);
  const idRef = useRef('nx' + ++edSeq);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  useEffect(() => {
    const ed = edRef.current;
    const mon = monRef.current;
    if (!ed || !mon) return;
    ed.addCommand(mon.KeyMod.CtrlCmd | mon.KeyCode.Enter, () => {
      onRunRef.current?.();
    });
    // 命令随编辑器实例销毁
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ed = edRef.current;
    const mon = monRef.current;
    if (!ed || !mon) return;
    if (!decRef.current) decRef.current = ed.createDecorationsCollection();
    const model = ed.getModel();
    const marks: { line: number; kind: 'error' | 'debug' | 'scan' }[] = [];
    if (errorLine != null && model && errorLine >= 1 && errorLine <= model.getLineCount()) {
      marks.push({ line: errorLine, kind: 'error' });
    }
    if (debugLine != null && debugLine >= 1 && model && debugLine <= model.getLineCount()) {
      marks.push({ line: debugLine, kind: 'debug' });
    }
    if (markLines && model) {
      for (const ln of markLines) {
        if (ln >= 1 && ln <= model.getLineCount()) marks.push({ line: ln, kind: 'scan' });
      }
    }
    decRef.current.set(marks.map(m => ({
      range: new mon.Range(m.line, 1, m.line, model!.getLineMaxColumn(m.line)),
      options: {
        isWholeLine: true,
        className: m.kind === 'error' ? 'nx-error-line' : m.kind === 'debug' ? 'nx-debug-line' : 'nx-scan-line',
        linesDecorationsClassName: m.kind === 'error' ? 'nx-error-gutter' : m.kind === 'debug' ? 'nx-debug-gutter' : 'nx-scan-gutter',
      },
    })));
    const top = marks[0]?.line;
    if (top) ed.revealLineInCenter(top);
  }, [errorLine, debugLine, markLines]);

  return (
    <div style={{ width: '100%', height }} className="code-editor-host">
      <style>{ERR_STYLE}</style>
      <Editor
        path={idRef.current + '.py'}
        height="100%"
        language="python"
        theme="nexus-dark"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        loading={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A6E85' }}>
          <span className="spinner" />&nbsp;正在从 CDN 加载代码编辑器…
        </div>}
        onMount={(ed, mon) => {
          edRef.current = ed;
          monRef.current = mon;
          if (!themeReady) {
            try {
              mon.editor.defineTheme('nexus-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                  { token: 'comment', foreground: '4A6E85', fontStyle: 'italic' },
                  { token: 'string', foreground: '35D39A' },
                  { token: 'string.escape', foreground: 'F3B75C' },
                  { token: 'keyword', foreground: '42D6D0', fontStyle: 'bold' },
                  { token: 'number', foreground: 'F3B75C' },
                  { token: 'type', foreground: '3986C8' },
                  { token: 'identifier', foreground: 'EAF3FA' },
                  { token: 'delimiter', foreground: '8FB0C9' },
                  { token: 'operator', foreground: '42D6D0' },
                  { token: 'function', foreground: '6FB7E8' },
                ],
                colors: {
                  'editor.background': '#0A1622',
                  'editor.lineHighlightBackground': '#101F2D88',
                  'editorLineNumber.foreground': '#2C4A5C',
                  'editorLineNumber.activeForeground': '#42D6D0',
                  'editorCursor.foreground': '#42D6D0',
                  'editor.selectionBackground': '#1D4A6688',
                  'editor.inactiveSelectionBackground': '#1D4A6655',
                  'editorIndentGuide.background1': '#12293A',
                  'editorIndentGuide.activeBackground1': '#1E4A63',
                  'editorGutter.background': '#0A1622',
                  'editorWidget.background': '#0D1B28',
                  'editorSuggestWidget.background': '#0D1B28',
                  'editorSuggestWidget.border': '#1E3A50',
                  'editorBracketMatch.border': '#42D6D0',
                  'editorBracketMatch.background': '#42D6D033',
                },
              });
              themeReady = true;
            } catch { /* ignore */ }
          }
          mon.editor.setTheme('nexus-dark');
          ed.updateOptions({ readOnly });
        }}
        options={{
          fontSize,
          fontFamily: 'Consolas, "Cascadia Code", monospace',
          minimap: { enabled: false },
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: { indentation: true, bracketPairs: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 10, bottom: 10 },
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          parameterHints: { enabled: false },
          readOnly,
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          placeholder,
        }}
      />
    </div>
  );
}
