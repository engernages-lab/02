// B.6.4 弱点发现 / 破解 / 击破 / 暴露电影化配置；只影响视觉层。
//
// 真实事件来源（B.3 bossWeaknessEngine）：
//   WEAKNESS_HINT(phase=analyzing) → scan
//   WEAKNESS_DISCOVERED           → discovery
//   WEAKNESS_CHALLENGE_STARTED    → crack
//   WEAKNESS_CHALLENGE_SUCCESS    → break（项目没有独立的 BROKEN 事件，破解成功即弱点被击破）
//   WEAKNESS_EXPOSED              → expose
//   WEAKNESS_RECOVERED            → recovery
// 其余事件（ANALYZED / EFFECT_APPLIED / FAILED）不产生独立电影化演出。

export type WeaknessCinematicKind = 'scan' | 'discovery' | 'crack' | 'break' | 'expose' | 'recovery';

export interface WeaknessCinematicTheme {
  primary: string;
  secondary: string;
  danger: string;
}

export interface WeaknessCinematicStageDef {
  kind: WeaknessCinematicKind;
  durationMs: number;
  kicker: string;
  label: string;
  text: string;
}

export const WEAKNESS_CINEMATIC_STAGES: WeaknessCinematicStageDef[] = [
  { kind: 'scan', durationMs: 800, kicker: 'WEAKNESS SCAN', label: 'NEURAL SCAN', text: '正在扫描 Boss 数据结构' },
  { kind: 'discovery', durationMs: 1800, kicker: 'WEAKNESS DISCOVERED', label: 'TARGET LOCKED', text: 'VULNERABILITY IDENTIFIED' },
  { kind: 'crack', durationMs: 1400, kicker: 'WEAKNESS CRACK', label: 'CRACK IN PROGRESS', text: '真实判题进行中 · 数据结构崩解' },
  { kind: 'break', durationMs: 1600, kicker: 'WEAKNESS BREAK', label: 'CORE SHATTER', text: 'DATA EXPLOSION · 弱点核心破碎' },
  { kind: 'expose', durationMs: 1500, kicker: 'CORE EXPOSED', label: 'VULNERABILITY WINDOW', text: '弱点暴露 · 真实伤害窗口开启' },
  { kind: 'recovery', durationMs: 1000, kicker: 'WEAKNESS RECOVERED', label: 'SYSTEM STABILIZING', text: 'Boss 数据结构恢复稳定' },
];

const FALLBACK_STAGE = WEAKNESS_CINEMATIC_STAGES[1];
const DEFAULT_THEME: WeaknessCinematicTheme = { primary: '#42D6D0', secondary: '#7B61FF', danger: '#FF5B64' };
const KIND_THEMES: Record<WeaknessCinematicKind, WeaknessCinematicTheme> = {
  scan: { primary: '#8FD3FF', secondary: '#42D6D0', danger: '#FF5B64' },
  discovery: { primary: '#FFD75E', secondary: '#C9A7FF', danger: '#FF5B64' },
  crack: { primary: '#FF9B4A', secondary: '#FF5B64', danger: '#FF3D5A' },
  break: { primary: '#EAF6FF', secondary: '#00E5FF', danger: '#FFD75E' },
  expose: { primary: '#FF5B64', secondary: '#C9A7FF', danger: '#FF3D5A' },
  recovery: { primary: '#42D6D0', secondary: '#8FA6B2', danger: '#FF5B64' },
};

function validColor(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

export function weaknessCinematicStageFor(kind: WeaknessCinematicKind): WeaknessCinematicStageDef {
  return WEAKNESS_CINEMATIC_STAGES.find(s => s.kind === kind) || FALLBACK_STAGE;
}

/** 阶段主题：优先真实 Boss 主题，缺失/非法时安全回退。 */
export function weaknessCinematicThemeFor(
  kind: WeaknessCinematicKind,
  bossTheme?: { primaryColor?: string; secondaryColor?: string; dangerColor?: string } | null,
): WeaknessCinematicTheme {
  const preset = KIND_THEMES[kind] || KIND_THEMES.discovery;
  const t: WeaknessCinematicTheme = {
    primary: validColor(preset.primary, DEFAULT_THEME.primary),
    secondary: validColor(preset.secondary, DEFAULT_THEME.secondary),
    danger: validColor(preset.danger, DEFAULT_THEME.danger),
  };
  if (kind === 'recovery' && bossTheme) {
    t.primary = validColor(bossTheme.primaryColor, t.primary);
    t.secondary = validColor(bossTheme.secondaryColor, t.secondary);
  }
  return t;
}

/** 真实 B.3 事件 → 视觉阶段；非演出事件返回 null（不虚构事件）。 */
export function weaknessCinematicKindForEvent(
  eventType: string,
  payload?: Record<string, unknown> | null,
): WeaknessCinematicKind | null {
  switch (eventType) {
    case 'BOSS_WEAKNESS_HINT':
      return payload?.phase === 'analyzing' ? 'scan' : null;
    case 'BOSS_WEAKNESS_DISCOVERED':
      return 'discovery';
    case 'BOSS_WEAKNESS_CHALLENGE_STARTED':
      return 'crack';
    case 'BOSS_WEAKNESS_CHALLENGE_SUCCESS':
      return 'break';
    case 'BOSS_WEAKNESS_EXPOSED':
      return 'expose';
    case 'BOSS_WEAKNESS_RECOVERED':
      return 'recovery';
    default:
      return null;
  }
}

/** 去重键：battleId + weaknessId + eventId；同名弱点/多 Boss/多次战斗不会互相污染。 */
export function weaknessCinematicDedupeKey(
  battleId: string,
  weaknessId: string,
  eventId: string,
): string {
  return String(battleId || '') + ':' + String(weaknessId || '') + ':' + String(eventId || '');
}

export interface WeaknessCinematicView {
  weaknessId: string;
  weaknessName: string;
  weaknessType: string;
  kind: WeaknessCinematicKind;
  stageLabel: string;
  kicker: string;
  text: string;
  detail: string;
  startedAt: number;
  expiresAt: number;
  theme: WeaknessCinematicTheme;
  reason: 'battle' | 'dev';
}
