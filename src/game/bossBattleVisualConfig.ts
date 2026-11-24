// Boss 战斗视觉配置（V1.3-B.6.1）
// 视觉效果只影响表现层：不改 HP / 意识 / 阶段 / 攻击 / 统计 / 奖励 / 成就。

export const BOSS_VISUAL_VERSION = 'v1.0.0';

export type VisualIntensity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CINEMATIC';
export type VisualPerformanceLevel = 'full' | 'reduced' | 'minimal';
export type VisualPerformanceMode = 'AUTO' | 'NORMAL' | 'REDUCED' | 'LOW' | 'CRITICAL';
export type ActivePerformanceMode = Exclude<VisualPerformanceMode, 'AUTO'>;

export const VISUAL_INTENSITY_STORAGE_KEY = 'nexus_visual_intensity';
export const PERFORMANCE_MODE_STORAGE_KEY = 'nexus_visual_performance_mode';
export const DEFAULT_PERFORMANCE_MODE: VisualPerformanceMode = 'AUTO';

export function normalizePerformanceMode(raw: unknown): VisualPerformanceMode {
  return raw === 'AUTO' || raw === 'NORMAL' || raw === 'REDUCED' || raw === 'LOW' || raw === 'CRITICAL'
    ? raw : DEFAULT_PERFORMANCE_MODE;
}

export function performanceModeFromStorage(raw: string | null | undefined): VisualPerformanceMode {
  return normalizePerformanceMode(raw);
}

export function savePerformanceMode(mode: VisualPerformanceMode): void {
  try { localStorage.setItem(PERFORMANCE_MODE_STORAGE_KEY, mode); } catch { /* ignore */ }
}

export function saveVisualIntensity(intensity: VisualIntensity): void {
  try { localStorage.setItem(VISUAL_INTENSITY_STORAGE_KEY, intensity); } catch { /* ignore */ }
}

export function activePerformanceMode(setting: VisualPerformanceMode, auto: ActivePerformanceMode): ActivePerformanceMode {
  return setting === 'AUTO' ? auto : setting;
}

export function performanceLevelForMode(mode: ActivePerformanceMode): VisualPerformanceLevel {
  return mode === 'NORMAL' ? 'full' : mode === 'REDUCED' ? 'reduced' : 'minimal';
}

export function maxDprForMode(mode: ActivePerformanceMode): number {
  return mode === 'NORMAL' ? 2 : mode === 'REDUCED' ? 1.5 : 1;
}

export function modeSeverity(mode: ActivePerformanceMode): number {
  return mode === 'NORMAL' ? 0 : mode === 'REDUCED' ? 1 : mode === 'LOW' ? 2 : 3;
}
export type VisualEffectType = 'pulse' | 'shake' | 'glitch' | 'flash' | 'particle-burst' | 'particle-stream' | 'scanline' | 'warning' | 'charge' | 'release' | 'hit' | 'block' | 'dodge' | 'interrupt' | 'cancel' | 'phase-cinematic' | 'weakness-cinematic' | 'crisis-cinematic' | 'terminal-cinematic';

export const VISUAL_PRIORITY = {
  terminal: 0,
  phase: 1,
  crisis: 2,
  weakness: 3,
  attack: 4,
  defense: 5,
  hud: 6,
  ambient: 7,
} as const;

export const VISUAL_LAYER_Z: Record<string, number> = {
  background: 0,
  ambient: 10,
  boss: 20,
  hud: 30,
  interaction: 40,
  warning: 50,
  cinematic: 60,
  modal: 70,
  terminal: 80,
  settlement: 90,
  critical: 100,
};

export interface VisualIntensityProfile {
  intensity: VisualIntensity;
  particles: number;
  shake: number;
  flash: number;
  glitch: number;
  scanline: number;
}

export const VISUAL_INTENSITY_PROFILES: Record<VisualIntensity, VisualIntensityProfile> = {
  LOW: { intensity: 'LOW', particles: 0, shake: 0, flash: 0.35, glitch: 0.15, scanline: 0.25 },
  MEDIUM: { intensity: 'MEDIUM', particles: 22, shake: 0.35, flash: 0.55, glitch: 0.3, scanline: 0.35 },
  HIGH: { intensity: 'HIGH', particles: 42, shake: 0.6, flash: 0.75, glitch: 0.5, scanline: 0.45 },
  CINEMATIC: { intensity: 'CINEMATIC', particles: 64, shake: 0.85, flash: 0.9, glitch: 0.65, scanline: 0.55 },
};

export const DEFAULT_VISUAL_INTENSITY: VisualIntensity = 'MEDIUM';
export const MAX_PARTICLE_BUDGET = 96;
export const MAX_QUEUED_EFFECTS = 8;
export const MAX_ACTIVE_EFFECTS = 6;

export interface BossVisualTheme {
  bossId: string;
  visualTheme: string;
  primaryColor: string;
  secondaryColor: string;
  dangerColor: string;
  particleTheme: string;
  backgroundEffect: string;
  glitchIntensity: number;
  shakeIntensity: number;
  cinematicIntensity: number;
}

export const DEFAULT_BOSS_VISUAL_THEME: BossVisualTheme = {
  bossId: 'default', visualTheme: 'nexus-digital',
  primaryColor: '#42D6D0', secondaryColor: '#7B61FF', dangerColor: '#FF5B64',
  particleTheme: 'data-fragments', backgroundEffect: 'digital-grid',
  glitchIntensity: 0.35, shakeIntensity: 0.4, cinematicIntensity: 0.6,
};

export const BOSS_VISUAL_THEMES: Record<string, BossVisualTheme> = {
  'gate-01': {
    bossId: 'gate-01', visualTheme: 'digital-corruption',
    primaryColor: '#00E5FF', secondaryColor: '#7B61FF', dangerColor: '#FF3D5A',
    particleTheme: 'data-fragments', backgroundEffect: 'digital-grid',
    glitchIntensity: 0.45, shakeIntensity: 0.4, cinematicIntensity: 0.65,
  },
};

export function bossVisualThemeFor(bossId: string): BossVisualTheme {
  const t = bossId ? BOSS_VISUAL_THEMES[bossId] : undefined;
  if (!t) return { ...DEFAULT_BOSS_VISUAL_THEME, bossId: bossId || 'default' };
  return {
    ...DEFAULT_BOSS_VISUAL_THEME,
    ...t,
    primaryColor: validColor(t.primaryColor, DEFAULT_BOSS_VISUAL_THEME.primaryColor),
    secondaryColor: validColor(t.secondaryColor, DEFAULT_BOSS_VISUAL_THEME.secondaryColor),
    dangerColor: validColor(t.dangerColor, DEFAULT_BOSS_VISUAL_THEME.dangerColor),
    glitchIntensity: clamp01(t.glitchIntensity, DEFAULT_BOSS_VISUAL_THEME.glitchIntensity),
    shakeIntensity: clamp01(t.shakeIntensity, DEFAULT_BOSS_VISUAL_THEME.shakeIntensity),
    cinematicIntensity: clamp01(t.cinematicIntensity, DEFAULT_BOSS_VISUAL_THEME.cinematicIntensity),
  };
}

function clamp01(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
}
function validColor(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

export interface VisualEffectDef {
  effectId: string;
  effectType: VisualEffectType;
  priority: number;
  duration: number;
  intensity: number;
  layer: keyof typeof VISUAL_LAYER_Z;
  interruptible: boolean;
  exclusiveGroup: string;
  queueable: boolean;
  cleanup: boolean;
  reducedMotionAlternative: 'fade' | 'none';
  color?: string;
}

const effect = (
  effectId: string,
  effectType: VisualEffectType,
  priority: number,
  duration: number,
  intensity: number,
  layer: keyof typeof VISUAL_LAYER_Z,
  exclusiveGroup: string,
  opts: Partial<VisualEffectDef> = {},
): VisualEffectDef => ({
  effectId, effectType, priority, duration, intensity, layer,
  interruptible: true, exclusiveGroup, queueable: true, cleanup: true,
  reducedMotionAlternative: 'fade', ...opts,
});

export const BOSS_VISUAL_EFFECTS: Record<string, VisualEffectDef> = {
  'boss-warning-pulse': effect('boss-warning-pulse', 'pulse', VISUAL_PRIORITY.attack, 1000, 0.7, 'warning', 'attack-warning'),
  'boss-attack-impact': effect('boss-attack-impact', 'shake', VISUAL_PRIORITY.attack, 460, 0.6, 'warning', 'attack-impact'),
  'boss-defend-pulse': effect('boss-defend-pulse', 'pulse', VISUAL_PRIORITY.defense, 620, 0.5, 'interaction', 'player-response', { color: '#42D6D0' }),
  'boss-dodge-pulse': effect('boss-dodge-pulse', 'pulse', VISUAL_PRIORITY.defense, 620, 0.5, 'interaction', 'player-response', { color: '#9FE8FF' }),
  'boss-phase-flash': effect('boss-phase-flash', 'flash', VISUAL_PRIORITY.phase, 1500, 0.8, 'cinematic', 'phase', { interruptible: false }),
  'boss-weakness-flash': effect('boss-weakness-flash', 'flash', VISUAL_PRIORITY.weakness, 1100, 0.8, 'cinematic', 'weakness', { color: '#C9A7FF' }),
  'boss-crisis-glitch': effect('boss-crisis-glitch', 'glitch', VISUAL_PRIORITY.crisis, 1000, 0.8, 'cinematic', 'crisis', { color: '#FF5B64' }),
  'boss-terminal-flash': effect('boss-terminal-flash', 'flash', VISUAL_PRIORITY.terminal, 1300, 1, 'terminal', 'terminal', { interruptible: false, queueable: false }),
  'boss-hud-pulse': effect('boss-hud-pulse', 'pulse', VISUAL_PRIORITY.hud, 800, 0.4, 'hud', 'hud'),
  'boss-particle-burst': effect('boss-particle-burst', 'particle-burst', VISUAL_PRIORITY.hud, 900, 0.7, 'ambient', 'particles'),
  'boss-particle-stream': effect('boss-particle-stream', 'particle-stream', VISUAL_PRIORITY.ambient, 2600, 0.6, 'ambient', 'particles'),
  'boss-scanline': effect('boss-scanline', 'scanline', VISUAL_PRIORITY.ambient, 2800, 0.5, 'ambient', 'scanline'),
  'boss-attack-warning': effect('boss-attack-warning', 'warning', VISUAL_PRIORITY.attack, 420, 0.7, 'warning', 'attack-warning'),
  'boss-attack-charge': effect('boss-attack-charge', 'charge', VISUAL_PRIORITY.attack, 900, 0.7, 'warning', 'attack-charge'),
  'boss-attack-release': effect('boss-attack-release', 'release', VISUAL_PRIORITY.attack, 380, 0.9, 'cinematic', 'attack-release'),
  'boss-attack-hit': effect('boss-attack-hit', 'hit', VISUAL_PRIORITY.attack, 360, 0.9, 'cinematic', 'attack-result', { color: '#FF3D5A' }),
  'boss-attack-block': effect('boss-attack-block', 'block', VISUAL_PRIORITY.defense, 500, 0.7, 'cinematic', 'attack-result', { color: '#00E5FF' }),
  'boss-attack-dodge': effect('boss-attack-dodge', 'dodge', VISUAL_PRIORITY.defense, 500, 0.7, 'cinematic', 'attack-result', { color: '#7B61FF' }),
  'boss-attack-interrupt': effect('boss-attack-interrupt', 'interrupt', VISUAL_PRIORITY.weakness, 600, 0.8, 'cinematic', 'attack-interrupt', { color: '#C9A7FF' }),
  'boss-attack-cancel': effect('boss-attack-cancel', 'cancel', VISUAL_PRIORITY.attack, 350, 0.5, 'cinematic', 'attack-cancel'),
  'boss-phase-cinematic': effect('boss-phase-cinematic', 'phase-cinematic', VISUAL_PRIORITY.phase, 3200, 0.9, 'cinematic', 'phase-cinematic', { interruptible: false, queueable: false }),
  'boss-weakness-cinematic': effect('boss-weakness-cinematic', 'weakness-cinematic', VISUAL_PRIORITY.weakness, 1600, 0.85, 'cinematic', 'weakness-cinematic', { queueable: false }),
  'boss-crisis-cinematic': effect('boss-crisis-cinematic', 'crisis-cinematic', VISUAL_PRIORITY.crisis, 1600, 0.9, 'cinematic', 'crisis-cinematic', { queueable: false }),
  'boss-terminal-cinematic': effect('boss-terminal-cinematic', 'terminal-cinematic', VISUAL_PRIORITY.terminal, 4800, 1, 'terminal', 'terminal-cinematic', { interruptible: false, queueable: false }),
};

export function getVisualEffectDef(effectId: string): VisualEffectDef | null {
  const d = BOSS_VISUAL_EFFECTS[effectId];
  return d ? { ...d } : null;
}
