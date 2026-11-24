// B.6.6 Boss 终结电影化配置；只影响视觉层。
//
// 真实事件：
//   BOSS_BATTLE_VICTORY   → victory
//   BOSS_BATTLE_DEFEAT    → defeat（意识归零时由 finishBattle 发出）
//   BOSS_BATTLE_INTERRUPTED + reason 含“撤退” → retreat
//   BOSS_BATTLE_INTERRUPTED 其他 reason → interrupted
// 真实 event 带 battleId / bossId / phaseId / id / at；没有独立 terminalEventId。

export type TerminalKind = 'victory' | 'defeat' | 'retreat' | 'interrupted';

export interface TerminalCinematicTheme {
  primary: string;
  secondary: string;
  danger: string;
}

export interface TerminalCinematicStageDef {
  kind: TerminalKind;
  stage: string;
  startMs: number;
  endMs: number;
  kicker: string;
  label: string;
  text: string;
  reveal: boolean;
}

export const TERMINAL_CINEMATIC_STAGES: Record<TerminalKind, TerminalCinematicStageDef[]> = {
  victory: [
    { kind: 'victory', stage: 'impact', startMs: 0, endMs: 900, kicker: 'FINAL IMPACT', label: 'CORE IMPACT', text: '最终冲击 · Boss 核心失稳', reveal: false },
    { kind: 'victory', stage: 'collapse', startMs: 900, endMs: 2100, kicker: 'BOSS COLLAPSE', label: 'DATA SHATTER', text: '数据结构崩解 · 能量消散', reveal: false },
    { kind: 'victory', stage: 'shutdown', startMs: 2100, endMs: 3100, kicker: 'CORE SHUTDOWN', label: 'THREAT ELIMINATED', text: '核心关闭 · 威胁已消除', reveal: false },
    { kind: 'victory', stage: 'reveal', startMs: 3100, endMs: 4800, kicker: 'VICTORY', label: 'BOSS DEFEATED', text: '战斗胜利 · 系统恢复', reveal: true },
  ],
  defeat: [
    { kind: 'defeat', stage: 'critical', startMs: 0, endMs: 900, kicker: 'CRITICAL FAILURE', label: 'SYSTEM CRITICAL', text: '意识完整度归零 · 系统严重故障', reveal: false },
    { kind: 'defeat', stage: 'collapse', startMs: 900, endMs: 2300, kicker: 'SYSTEM COLLAPSE', label: 'MISSION FAILED', text: '数据流中断 · 战斗失败', reveal: false },
    { kind: 'defeat', stage: 'reveal', startMs: 2300, endMs: 3900, kicker: 'DEFEAT', label: 'PLAYER DEFEATED', text: '系统修复失败', reveal: true },
  ],
  retreat: [
    { kind: 'retreat', stage: 'initiated', startMs: 0, endMs: 900, kicker: 'RETREAT INITIATED', label: 'DISENGAGING', text: '撤退协议启动', reveal: false },
    { kind: 'retreat', stage: 'escape', startMs: 900, endMs: 2000, kicker: 'ARENA ESCAPE', label: 'DATA EXTRACTION', text: '脱离战场 · 数据撤离', reveal: false },
    { kind: 'retreat', stage: 'terminated', startMs: 2000, endMs: 3300, kicker: 'BATTLE TERMINATED', label: 'MISSION ABORTED', text: '战斗已终止', reveal: true },
  ],
  interrupted: [
    { kind: 'interrupted', stage: 'interrupted', startMs: 0, endMs: 900, kicker: 'SYSTEM INTERRUPTED', label: 'BATTLE ABORTED', text: '战斗连接中断', reveal: false },
    { kind: 'interrupted', stage: 'stabilized', startMs: 900, endMs: 2100, kicker: 'SYSTEM STABILIZED', label: 'CONNECTION RESTORED', text: '系统恢复稳定', reveal: true },
  ],
};

const DEFAULT_THEME: TerminalCinematicTheme = { primary: '#C9A7FF', secondary: '#8FD3FF', danger: '#FF5B64' };
const KIND_THEMES: Record<TerminalKind, TerminalCinematicTheme> = {
  victory: { primary: '#5BD6A0', secondary: '#FFD75E', danger: '#42D6D0' },
  defeat: { primary: '#FF5B64', secondary: '#FF9BA2', danger: '#FF3D5A' },
  retreat: { primary: '#FFD75E', secondary: '#FFB15E', danger: '#FF9BA2' },
  interrupted: { primary: '#C9A7FF', secondary: '#8FD3FF', danger: '#FF5B64' },
};

function validColor(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

export function terminalThemeFor(kind: TerminalKind): TerminalCinematicTheme {
  const t = KIND_THEMES[kind] || DEFAULT_THEME;
  return {
    primary: validColor(t.primary, DEFAULT_THEME.primary),
    secondary: validColor(t.secondary, DEFAULT_THEME.secondary),
    danger: validColor(t.danger, DEFAULT_THEME.danger),
  };
}

export function terminalStages(kind: TerminalKind): TerminalCinematicStageDef[] {
  return TERMINAL_CINEMATIC_STAGES[kind] || TERMINAL_CINEMATIC_STAGES.interrupted;
}

export function terminalTotalDuration(kind: TerminalKind): number {
  const list = terminalStages(kind);
  return list[list.length - 1].endMs;
}

export function terminalStageAtElapsed(kind: TerminalKind, elapsed: number): TerminalCinematicStageDef {
  const list = terminalStages(kind);
  const e = Math.max(0, elapsed);
  return list.find(s => e >= s.startMs && e < s.endMs) || list[list.length - 1];
}

/** 真实 Terminal 事件 → 视觉类型；不虚构事件。 */
export function terminalKindForEvent(
  eventType: string,
  payload?: Record<string, unknown> | null,
): TerminalKind | null {
  if (eventType === 'BOSS_BATTLE_VICTORY') return 'victory';
  if (eventType === 'BOSS_BATTLE_DEFEAT') return 'defeat';
  if (eventType === 'BOSS_BATTLE_INTERRUPTED') {
    const reason = typeof payload?.reason === 'string' ? payload.reason : '';
    return /撤退|retreat/i.test(reason) ? 'retreat' : 'interrupted';
  }
  return null;
}

export function terminalResultLabel(kind: TerminalKind): string {
  return kind === 'victory' ? 'VICTORY'
    : kind === 'defeat' ? 'DEFEAT'
      : kind === 'retreat' ? 'RETREAT' : 'INTERRUPTED';
}

export function terminalDedupeKey(battleId: string, eventId: string): string {
  return String(battleId || '') + ':' + String(eventId || '');
}

export interface TerminalEventSnapshot {
  battleId: string;
  eventId: string;
  bossId: string;
  phaseId: string;
  kind: TerminalKind;
  reason: string;
}

export function terminalSnapshotOf(
  eventType: string,
  payload: Record<string, unknown> | null | undefined,
  ctx: { battleId: string; eventId: string; bossId: string; phaseId: string },
): TerminalEventSnapshot | null {
  const kind = terminalKindForEvent(eventType, payload);
  if (!kind) return null;
  return {
    battleId: String(ctx.battleId || ''),
    eventId: String(ctx.eventId || ''),
    bossId: String(ctx.bossId || ''),
    phaseId: String(ctx.phaseId || ''),
    kind,
    reason: typeof payload?.reason === 'string' ? payload.reason : '',
  };
}

export interface TerminalCinematicView {
  battleId: string;
  terminalId: string;
  eventId: string;
  bossId: string;
  bossName: string;
  kind: TerminalKind;
  result: string;
  stage: string;
  stageLabel: string;
  kicker: string;
  title: string;
  description: string;
  theme: TerminalCinematicTheme;
  startedAt: number;
  expiresAt: number;
  reveal: boolean;
  source: 'REAL' | 'DEV';
}

export function terminalViewFor(
  snapshot: TerminalEventSnapshot,
  bossName: string,
  now: number,
  source: 'REAL' | 'DEV',
): TerminalCinematicView {
  const first = terminalStages(snapshot.kind)[0];
  return {
    battleId: snapshot.battleId,
    terminalId: snapshot.eventId,
    eventId: snapshot.eventId,
    bossId: snapshot.bossId,
    bossName: String(bossName || snapshot.bossId || 'BOSS'),
    kind: snapshot.kind,
    result: terminalResultLabel(snapshot.kind),
    stage: first.stage,
    stageLabel: first.label,
    kicker: first.kicker,
    title: first.kicker,
    description: first.text,
    theme: terminalThemeFor(snapshot.kind),
    startedAt: now,
    expiresAt: now + terminalTotalDuration(snapshot.kind),
    reveal: first.reveal,
    source,
  };
}
