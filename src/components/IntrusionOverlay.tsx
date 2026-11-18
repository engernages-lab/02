import { useEffect, useMemo, useRef } from 'react';
import { useGame } from '../store/gameStore';
import {
  UNKNOWN_INTRUSION_ID, INTRUSION_PHASES, INTRUSION_RECOVER_STEPS, INTRUSION_MAX_MISSES,
  intrusionDataOf,
} from '../game/events/unknownIntrusion';

const NODE_LABELS = ['NODE-α', 'NODE-β', 'NODE-γ'];

/** 字符串 → 32 位哈希（FNV-1a），用于按事件实例 id 生成稳定的节点顺序 */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** 确定性排列：同一事件 id 永远得到同一顺序（刷新后一致） */
function permFor(id: string, n: number): number[] {
  let seed = hashStr(id) || 1;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

/**
 * 未知入侵覆盖层：全局挂载（App Shell），只要存在进行中的动态事件就显示。
 * 六种恢复方式在此完整闭环：
 *   正常完成（按序隔离）/ 玩家退出 / 超时 / 刷新清理（存档规范化）/ 异常恢复 / 重复触发保护（引擎）。
 * 所有定时器在依赖变化或卸载时清理；结束态展示后自动 dismiss。
 */
export default function IntrusionOverlay() {
  const g = useGame();
  const gRef = useRef(g);
  gRef.current = g;

  const ev = g.player.progress.dynamicEvent;

  // presenting → active 自动推进；active → 超时自动推进
  useEffect(() => {
    if (!ev) return;
    if (ev.status === 'presenting' && ev.activateAt != null) {
      const ms = Math.max(0, ev.activateAt - Date.now());
      const t = window.setTimeout(() => gRef.current.advanceDynamicEvent(), ms + 20);
      return () => window.clearTimeout(t);
    }
    if (ev.status === 'active' && ev.deadlineAt != null) {
      const t = window.setInterval(() => gRef.current.advanceDynamicEvent(), 500);
      return () => window.clearInterval(t);
    }
    return;
  }, [ev?.status, ev?.activateAt, ev?.deadlineAt]);

  // 结束态（completed / resolving-timeout）展示后自动清理
  useEffect(() => {
    if (ev && (ev.status === 'completed' || ev.status === 'resolving')) {
      const t = window.setTimeout(() => gRef.current.dismissDynamicEvent(), 1500);
      return () => window.clearTimeout(t);
    }
    return;
  }, [ev?.status]);

  const seq = useMemo(() => permFor(ev?.id || 'seed', NODE_LABELS.length), [ev?.id]);

  if (!ev || ev.defId !== UNKNOWN_INTRUSION_ID) return null;

  const data = intrusionDataOf(ev.data);
  const phaseIdx = ev.status === 'presenting'
    ? 1
    : ev.status === 'active'
      ? Math.min(4, 2 + data.step)
      : 5;
  const resultLabel =
    ev.result === 'completed' ? '入侵已隔离：协议反制成功。'
      : ev.result === 'cancelled' ? '已退出隔离流程：入侵进入潜伏，系统恢复正常。'
      : ev.result === 'timeout' ? '隔离超时：入侵已自动脱离，操作未受影响。'
      : ev.result === 'recovered' ? '异常已安全恢复：无残留锁。'
      : '';
  const ended = ev.status === 'completed' || ev.status === 'resolving';
  const nextCorrect = data.step < INTRUSION_RECOVER_STEPS ? seq[data.step] : -1;

  const onNode = (i: number) => {
    if (ev.status !== 'active') return;
    if (i === nextCorrect) g.confirmIntrusionStep();
    else g.missIntrusionStep();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 40%, rgba(255,60,80,0.14), rgba(4,8,12,0.86) 60%)',
      backdropFilter: 'blur(3px)',
    }}>
      <style>{'@keyframes nxIntrPulse{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}@keyframes nxIntrScan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}'}</style>
      <div className="panel" style={{ width: 'min(560px, 92vw)', maxHeight: '86vh', overflowY: 'auto', borderColor: 'rgba(255,91,100,0.5)', boxShadow: '0 0 40px rgba(255,60,80,0.25)' }}>
        <div className="panel-title" style={{ color: '#FF6B73' }}>
          ⚠ 未知入侵 · UNKNOWN INTRUSION
          <span className="panel-tag" style={{ borderColor: 'rgba(255,91,100,0.6)', color: '#FF9AA0' }}>
            {ev.status === 'presenting' ? '检测中' : ev.status === 'active' ? '隔离中' : ended ? '结束' : '恢复中'}
          </span>
        </div>

        {/* 六阶段演出 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, margin: '10px 0 14px' }}>
          {INTRUSION_PHASES.map((p, i) => (
            <div key={p} style={{
              textAlign: 'center', fontSize: 11, padding: '5px 0', borderRadius: 4,
              background: i <= phaseIdx ? 'rgba(255,91,100,0.18)' : 'rgba(255,255,255,0.03)',
              color: i <= phaseIdx ? '#FF9AA0' : '#5b7078',
              border: '1px solid ' + (i === phaseIdx ? 'rgba(255,91,100,0.7)' : 'transparent'),
              animation: i === phaseIdx && !ended ? 'nxIntrPulse 1.4s infinite' : 'none',
            }}>{p}</div>
          ))}
        </div>

        {ended ? (
          <div style={{ fontSize: 13.5, lineHeight: 1.9, color: ev.result === 'completed' ? '#5BD6A0' : '#D3E4EF' }}>
            {resultLabel}
            <br /><span className="dim" style={{ fontSize: 12 }}>（覆盖层将在片刻后自动关闭，不影响你的代码与存档）</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: '#C9D8E0', lineHeight: 1.8, marginBottom: 10 }}>
              一段未经授权的指令正在改写终端。请按 <b style={{ color: '#FF9AA0' }}>正确的节点顺序</b> 依次隔离
              （{data.step}/{INTRUSION_RECOVER_STEPS}），误触会消耗失误次数（剩余 {data.missesLeft}/{INTRUSION_MAX_MISSES}）。
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {NODE_LABELS.map((label, i) => {
                const doneIdx = seq.indexOf(i);
                const done = doneIdx >= 0 && doneIdx < data.step;
                const active = ev.status === 'active';
                return (
                  <button
                    key={label}
                    disabled={!active}
                    onClick={() => onNode(i)}
                    style={{
                      flex: 1, padding: '16px 8px', borderRadius: 8, fontFamily: 'Consolas, monospace', fontSize: 13,
                      cursor: active ? 'pointer' : 'not-allowed',
                      background: done ? 'rgba(91,214,160,0.16)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid ' + (done ? 'rgba(91,214,160,0.7)' : 'rgba(255,91,100,0.35)'),
                      color: done ? '#5BD6A0' : '#E6F0F5',
                      opacity: active ? 1 : 0.5,
                    }}
                  >
                    {done ? '✓ ' : ''}{label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="nxbtn small danger" disabled={ev.status !== 'active'} onClick={() => g.abandonDynamicEvent()}>
                退出隔离
              </button>
              {ev.status === 'presenting' && <span className="dim" style={{ fontSize: 12 }}>正在同步隔离协议…</span>}
              {ev.status === 'active' && ev.deadlineAt != null && (
                <span className="dim" style={{ fontSize: 12 }}>
                  超时倒计时：{Math.max(0, Math.ceil((ev.deadlineAt - Date.now()) / 1000))}s
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
