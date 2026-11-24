// B.6.3 阶段转换电影化配置；只影响视觉层。
export type PhaseCinematicStage = 'pre' | 'distortion' | 'collapse' | 'reconstruct' | 'reveal' | 'recovery';
export interface PhaseTransitionTheme {
  primary: string;
  secondary: string;
  danger: string;
}
export interface PhaseCinematicStageDef {
  stage: PhaseCinematicStage;
  startMs: number;
  endMs: number;
  label: string;
}
export const PHASE_CINEMATIC_STAGES: PhaseCinematicStageDef[] = [
  { stage: 'pre', startMs: 0, endMs: 350, label: 'PRE-TRANSITION' },
  { stage: 'distortion', startMs: 350, endMs: 800, label: 'SYSTEM DISTORTION' },
  { stage: 'collapse', startMs: 800, endMs: 1250, label: 'ENERGY COLLAPSE' },
  { stage: 'reconstruct', startMs: 1250, endMs: 1850, label: 'CORE RECONSTRUCTION' },
  { stage: 'reveal', startMs: 1850, endMs: 2850, label: 'PHASE REVEAL' },
  { stage: 'recovery', startMs: 2850, endMs: 3200, label: 'RECOVERY' },
];
export const PHASE_CINEMATIC_TOTAL_MS = 3200;
const PHASE_THEMES: PhaseTransitionTheme[] = [
  { primary: '#42D6D0', secondary: '#00E5FF', danger: '#FF3D5A' },
  { primary: '#C9A7FF', secondary: '#7B61FF', danger: '#FF5B64' },
  { primary: '#FFD75E', secondary: '#FF9BA2', danger: '#FF3D5A' },
];
const DEFAULT_THEME: PhaseTransitionTheme = { primary: '#42D6D0', secondary: '#7B61FF', danger: '#FF5B64' };
export function phaseTransitionThemeFor(toIndex: number): PhaseTransitionTheme {
  return PHASE_THEMES[Math.max(0, Math.min(PHASE_THEMES.length - 1, Math.floor(toIndex)))] || DEFAULT_THEME;
}
export function phaseStageForElapsed(elapsed: number): PhaseCinematicStageDef {
  const e = Math.max(0, elapsed);
  return PHASE_CINEMATIC_STAGES.find(s => e >= s.startMs && e < s.endMs) || PHASE_CINEMATIC_STAGES[PHASE_CINEMATIC_STAGES.length - 1];
}
export interface PhaseCinematicView {
  transitionId: string;
  fromIndex: number;
  toIndex: number;
  toPhaseName: string;
  stage: PhaseCinematicStage;
  startedAt: number;
  expiresAt: number;
  theme: PhaseTransitionTheme;
  reason: string;
}
export function phaseRevealNumber(toIndex: number, total?: number | null): string {
  const n = String(Math.max(1, Math.floor(toIndex) + 1)).padStart(2, '0');
  return total && total > 0 ? 'PHASE ' + n + ' / ' + String(total).padStart(2, '0') : 'PHASE ' + n;
}
