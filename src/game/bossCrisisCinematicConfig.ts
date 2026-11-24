// B.6.5 动态危机电影化配置；只影响视觉层。
//
// 真实事件：unknown-intrusion（eventEngine + gameStore.progress.dynamicEvent）
// 生命周期：presenting → active → resolving(timeout) / completed → dismissed
// 结果：completed / timeout / cancelled / recovered
// 真实数据：id / defId / status / result / startedAt / activateAt / deadlineAt / data.step / data.missesLeft
//
// 项目没有独立的危机升级事件；INTRUSION_PHASES 只是覆盖层表演标签。
// 因此 escalation 仅作为 DEV 视觉阶段，真实流程不会自动进入。

import type { DynamicEventState, DynamicEventStatus, DynamicEventResult } from './eventEngine';
import {
  UNKNOWN_INTRUSION_ID, UNKNOWN_INTRUSION_DEF, INTRUSION_RECOVER_STEPS, INTRUSION_MAX_MISSES,
  intrusionDataOf,
} from './events/unknownIntrusion';

export type CrisisCinematicKind =
  | 'warning' | 'detection' | 'identification' | 'escalation'
  | 'impact' | 'response' | 'resolution' | 'recovery';

export interface CrisisCinematicTheme {
  primary: string;
  secondary: string;
  danger: string;
}

export interface CrisisCinematicStageDef {
  kind: CrisisCinematicKind;
  durationMs: number;
  kicker: string;
  label: string;
  text: string;
}

export const CRISIS_CINEMATIC_STAGES: CrisisCinematicStageDef[] = [
  { kind: 'warning', durationMs: UNKNOWN_INTRUSION_DEF.presentDurationMs, kicker: 'SYSTEM ALERT', label: 'CRISIS DETECTED', text: '检测到未经授权的系统活动' },
  { kind: 'detection', durationMs: 900, kicker: 'THREAT DETECTED', label: 'CRISIS DETECTION', text: '正在识别危机来源与影响范围' },
  { kind: 'identification', durationMs: 1200, kicker: 'CRISIS IDENTIFIED', label: 'THREAT IDENTIFIED', text: '未知入侵 · 隔离协议待命' },
  { kind: 'escalation', durationMs: 1100, kicker: 'ESCALATION', label: 'THREAT ESCALATION', text: '入侵正在扩散' },
  { kind: 'impact', durationMs: 800, kicker: 'IMPACT', label: 'SYSTEM BREACH', text: '入侵冲击 · 数据完整性受损' },
  { kind: 'response', durationMs: 900, kicker: 'COUNTERMEASURE', label: 'RESPONSE DETECTED', text: '隔离序列推进' },
  { kind: 'resolution', durationMs: 1800, kicker: 'THREAT NEUTRALIZED', label: 'CRISIS RESOLVED', text: '入侵已隔离 · 系统恢复中' },
  { kind: 'recovery', durationMs: 1400, kicker: 'SYSTEM RESTORED', label: 'RECOVERY COMPLETE', text: '安全状态恢复' },
];

const WARNING_SPLIT_MS = 700;
const DEFAULT_THEME: CrisisCinematicTheme = { primary: '#FF5B64', secondary: '#FFB15E', danger: '#FF3D5A' };
const KIND_THEMES: Record<CrisisCinematicKind, CrisisCinematicTheme> = {
  warning: { primary: '#FF5B64', secondary: '#FFB15E', danger: '#FF3D5A' },
  detection: { primary: '#FF7A5C', secondary: '#FFD75E', danger: '#FF3D5A' },
  identification: { primary: '#C084FC', secondary: '#FF5B9E', danger: '#FF3D5A' },
  escalation: { primary: '#FF8A3D', secondary: '#FF3D5A', danger: '#FF3D5A' },
  impact: { primary: '#FF3D5A', secondary: '#FFE0E2', danger: '#FF3D5A' },
  response: { primary: '#42D6D0', secondary: '#8FE8FF', danger: '#FF5B64' },
  resolution: { primary: '#5BD6A0', secondary: '#B7F5D8', danger: '#FF5B64' },
  recovery: { primary: '#67B7FF', secondary: '#8FD3FF', danger: '#FF5B64' },
};

function validColor(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

export function crisisCinematicStageFor(kind: CrisisCinematicKind): CrisisCinematicStageDef {
  return CRISIS_CINEMATIC_STAGES.find(s => s.kind === kind) || CRISIS_CINEMATIC_STAGES[0];
}

export function crisisCinematicThemeFor(kind: CrisisCinematicKind, defId?: string | null): CrisisCinematicTheme {
  const preset = KIND_THEMES[kind] || DEFAULT_THEME;
  const t = {
    primary: validColor(preset.primary, DEFAULT_THEME.primary),
    secondary: validColor(preset.secondary, DEFAULT_THEME.secondary),
    danger: validColor(preset.danger, DEFAULT_THEME.danger),
  };
  if (defId && defId !== UNKNOWN_INTRUSION_ID) {
    // 目前只有 unknown-intrusion；未登记危机一律使用安全默认主题。
    return { ...DEFAULT_THEME };
  }
  return t;
}

/** Warning 在真实 presenting 窗口内拆成 Warning → Detection；其余阶段为单阶段。 */
export function crisisStageAtElapsed(kind: CrisisCinematicKind, elapsed: number): CrisisCinematicStageDef {
  if (kind !== 'warning' && kind !== 'detection') return crisisCinematicStageFor(kind);
  const e = Math.max(0, elapsed);
  if (e < WARNING_SPLIT_MS) return crisisCinematicStageFor('warning');
  return crisisCinematicStageFor('detection');
}

export interface CrisisEventSnapshot {
  id: string;
  defId: string;
  status: DynamicEventStatus;
  result: DynamicEventResult;
  step: number;
  missesLeft: number;
  startedAt: number;
  activateAt: number | null;
  deadlineAt: number | null;
  reason: string | null;
  battleId: string;
}

export function crisisSnapshotOf(
  state: DynamicEventState | null | undefined,
  battleId: string,
): CrisisEventSnapshot | null {
  if (!state || typeof state !== 'object') return null;
  const d = state.defId === UNKNOWN_INTRUSION_ID
    ? intrusionDataOf(state.data)
    : {
      step: Math.max(0, Math.min(INTRUSION_RECOVER_STEPS, Number(state.data?.step) || 0)),
      missesLeft: Math.max(0, Math.min(INTRUSION_MAX_MISSES, Number(state.data?.missesLeft) || 0)),
    };
  return {
    id: typeof state.id === 'string' ? state.id : '',
    defId: typeof state.defId === 'string' ? state.defId : '',
    status: state.status,
    result: state.result,
    step: d.step,
    missesLeft: d.missesLeft,
    startedAt: Number(state.startedAt) || 0,
    activateAt: typeof state.activateAt === 'number' && isFinite(state.activateAt) ? state.activateAt : null,
    deadlineAt: typeof state.deadlineAt === 'number' && isFinite(state.deadlineAt) ? state.deadlineAt : null,
    reason: typeof state.reason === 'string' ? state.reason : null,
    battleId: String(battleId || ''),
  };
}

export function crisisEventTitle(defId: string | null | undefined): string {
  return defId === UNKNOWN_INTRUSION_ID ? UNKNOWN_INTRUSION_DEF.label : 'SYSTEM ANOMALY';
}

export function crisisStatusLabel(status: DynamicEventStatus): string {
  switch (status) {
    case 'presenting': return '检测中';
    case 'active': return '隔离中';
    case 'resolving': return '超时解除中';
    case 'completed': return '已结束';
    case 'recovering': return '恢复中';
    case 'dismissed': return '已关闭';
    default: return status;
  }
}

export interface CrisisTransition {
  kind: CrisisCinematicKind;
  marker: string;
  detail: string;
}

/** 真实状态差异 → 视觉阶段（不创建正式状态）。 */
export function crisisTransitions(
  prev: CrisisEventSnapshot | null,
  next: CrisisEventSnapshot | null,
): CrisisTransition[] {
  if (!next) {
    if (!prev) return [];
    if (prev.status === 'completed' || prev.status === 'resolving') {
      return [{ kind: 'recovery', marker: 'dismissed:' + (prev.result || ''), detail: '事件结束 · 系统恢复' }];
    }
    return [];
  }
  if (!prev || prev.id !== next.id) {
    return [{ kind: 'warning', marker: 'start', detail: crisisCinematicStageFor('warning').text }];
  }
  if (prev.battleId !== next.battleId) return [];
  const out: CrisisTransition[] = [];
  if (next.missesLeft < prev.missesLeft) {
    out.push({
      kind: 'impact',
      marker: 'miss:' + next.missesLeft,
      detail: '隔离失误 · 剩余 ' + next.missesLeft + ' / ' + INTRUSION_MAX_MISSES,
    });
  }
  if (next.step > prev.step) {
    out.push({
      kind: 'response',
      marker: 'step:' + next.step,
      detail: '隔离进度 ' + next.step + ' / ' + INTRUSION_RECOVER_STEPS,
    });
  }
  if (prev.status !== next.status) {
    if (next.status === 'active' && (prev.status === 'presenting' || prev.status === 'triggering')) {
      out.push({
        kind: 'identification',
        marker: 'active',
        detail: '真实隔离序列已激活 · 步骤 0 / ' + INTRUSION_RECOVER_STEPS,
      });
    } else if (next.status === 'resolving') {
      out.push({
        kind: 'impact',
        marker: 'timeout:' + next.result,
        detail: next.result === 'timeout' ? '隔离超时 · 事件自动解除' : '事件进入结算',
      });
      out.push({ kind: 'recovery', marker: 'resolving:' + next.result, detail: '系统正在解除危机状态' });
    } else if (next.status === 'completed') {
      if (next.result === 'completed') {
        out.push({ kind: 'resolution', marker: 'completed', detail: '入侵已隔离 · 协议反制成功' });
      } else {
        const label = next.result === 'cancelled' ? '隔离已退出 · 入侵进入潜伏'
          : next.result === 'recovered' ? '事件异常 · 已安全恢复'
            : next.result === 'timeout' ? '隔离超时 · 已自动解除' : '危机已结束';
        out.push({ kind: 'recovery', marker: 'ended:' + (next.result || ''), detail: label });
      }
    }
  }
  return out;
}

export function crisisCinematicDedupeKey(
  battleId: string,
  eventId: string,
  kind: CrisisCinematicKind,
  marker: string,
): string {
  return String(battleId || '') + ':' + String(eventId || '') + ':' + kind + ':' + String(marker || '');
}

export interface CrisisCinematicView {
  eventId: string;
  battleId: string;
  defId: string;
  kind: CrisisCinematicKind;
  stage: CrisisCinematicKind;
  stageLabel: string;
  kicker: string;
  title: string;
  text: string;
  detail: string;
  statusLabel: string;
  theme: CrisisCinematicTheme;
  startedAt: number;
  expiresAt: number;
  source: 'REAL' | 'DEV';
}

export function crisisViewFor(
  snapshot: CrisisEventSnapshot,
  transition: CrisisTransition,
  now: number,
  source: 'REAL' | 'DEV',
): CrisisCinematicView {
  const stage = crisisCinematicStageFor(transition.kind);
  return {
    eventId: snapshot.id,
    battleId: snapshot.battleId,
    defId: snapshot.defId,
    kind: transition.kind,
    stage: transition.kind,
    stageLabel: stage.label,
    kicker: stage.kicker,
    title: crisisEventTitle(snapshot.defId),
    text: stage.text,
    detail: transition.detail,
    statusLabel: crisisStatusLabel(snapshot.status),
    theme: crisisCinematicThemeFor(transition.kind, snapshot.defId),
    startedAt: now,
    expiresAt: now + stage.durationMs,
    source,
  };
}
