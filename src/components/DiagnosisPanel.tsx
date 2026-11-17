import { useEffect, useState } from 'react';
import type { Diagnosis } from '../services/diagnose';
import { kindLabel, defaultVisibleLayers } from '../services/diagnose';
import { knowledgeById } from '../game/knowledge';

export type DiagStatus = 'idle' | 'running' | 'done';

export interface DiagnosisPanelProps {
  diag: Diagnosis | null;
  status: DiagStatus;
  /** 同一错误连续触发次数（决定默认展开到第几层） */
  streak: number;
  /** 本次挑战的历史错误（新的在前） */
  history: Diagnosis[];
}

const CONFIDENCE_TEXT: Record<Diagnosis['confidence'], string> = {
  high: '依据：解释器',
  medium: '依据：源码推断',
  low: '可能原因',
};

const LAYER_TAG = ['方向', '原因', '修复'];

export default function DiagnosisPanel({ diag, status, streak, history }: DiagnosisPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [manualLayers, setManualLayers] = useState(0);

  // 每次出现新的诊断，重置手动展开（自动层数由连续失败决定）
  useEffect(() => {
    setManualLayers(0);
  }, [diag?.signature]);

  const visible = Math.max(1, Math.min(3, defaultVisibleLayers(streak) + manualLayers));
  const running = status === 'running';
  const tone = diag ? (diag.kind === 'ok' ? 'ok' : diag.kind === 'syntax' || diag.kind === 'runtime' ? 'err' : 'warn') : 'dim';

  return (
    <div
      className={'panel diag-panel ' + (diag ? 'diag-' + diag.kind : 'diag-empty')}
      data-kind={diag ? diag.kind : ''}
      data-error={diag ? diag.errorType : ''}
      data-line={diag && diag.line != null ? String(diag.line) : ''}
      data-layers={diag ? String(visible) : ''}
      data-status={status}
    >
      <div className="panel-title">
        代码诊断
        <span className={'diag-status ' + (running ? 'running' : tone)}>
          {running ? '检测中' : diag ? (diag.kind === 'ok' ? '正常' : '发现错误') : '待运行'}
        </span>
      </div>

      {running && (
        <div className="diag-hint"><span className="spinner" />&nbsp;正在执行并收集真实错误信息…</div>
      )}

      {!running && !diag && (
        <div className="diag-hint">
          运行或提交后，这里会依据真实 MicroPython 执行结果显示错误类型、出错行与修复方向。诊断不会改变判题结果。
        </div>
      )}

      {!running && diag && (
        <>
          <div className="diag-head">
            <span className={'diag-kind k-' + diag.kind}>{kindLabel(diag.kind)}</span>
            <span className="diag-type">{diag.errorType}</span>
            {diag.line != null && <span className="diag-line">第 {diag.line} 行</span>}
          </div>

          <div className="diag-reason">{diag.reason}</div>

          {diag.snippet && expanded && (
            <pre className="diag-snippet" aria-label="出错代码行">{diag.snippet}</pre>
          )}

          <div className="diag-meta">
            <span className={'diag-conf c-' + diag.confidence}>{CONFIDENCE_TEXT[diag.confidence]}</span>
            {diag.line != null && <span className="diag-meta-item">位置：第 {diag.line} 行{diag.column ? ' 第 ' + diag.column + ' 列' : ''}</span>}
          </div>

          {expanded && (
            <div className="diag-layers">
              {diag.layers.slice(0, visible).map((text, i) => (
                <div key={i} className={'diag-layer l' + (i + 1)}>
                  <div className="dl-tag">第 {i + 1} 层 · {LAYER_TAG[i]}</div>
                  <div className="dl-text">{text}</div>
                </div>
              ))}
            </div>
          )}

          {diag.knowledge.length > 0 && (
            <div className="diag-know">
              {diag.knowledge.map((id) => {
                const k = knowledgeById(id);
                return k ? <span key={id} className="chip cyan know-chip">{k.title}</span> : null;
              })}
            </div>
          )}

          {diag.mira && (
            <div className="diag-mira">
              <span className="dm-tag">◈ MIRA</span>
              <span>{diag.mira}</span>
            </div>
          )}

          <div className="diag-actions">
            {expanded && visible < 3 && (
              <button className="nxbtn small ghost" onClick={() => setManualLayers((v) => v + 1)}>
                继续分析（第 {visible + 1} 层）
              </button>
            )}
            <button className="nxbtn small ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? '收起详情' : '展开详情'}
            </button>
            {expanded && visible > 1 && (
              <button className="nxbtn small ghost" onClick={() => setManualLayers(0)}>回到第一层</button>
            )}
          </div>

          {expanded && diag.rawMessage && (
            <details className="diag-raw">
              <summary>原始错误信息</summary>
              <pre>{diag.rawMessage}</pre>
            </details>
          )}
        </>
      )}

      {history.length > 0 && (
        <details className="diag-history">
          <summary>本次挑战的错误记录（{history.length}）</summary>
          <div className="dh-list">
            {history.map((h, i) => (
              <div key={h.signature + '-' + i} className="dh-item">
                <span className="dh-kind">{kindLabel(h.kind)}</span>
                <span className="dh-line">{h.line != null ? '第 ' + h.line + ' 行' : '未定位'}</span>
                <span className="dh-reason">{h.reason}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
