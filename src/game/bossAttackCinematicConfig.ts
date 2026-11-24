// B.6.2 攻击电影化配置：把真实 BossAttackPattern 映射为攻击视觉主题。
import { bossVisualThemeFor, type BossVisualTheme } from './bossBattleVisualConfig';

export type AttackVisualType = 'digital-wave' | 'data-strike' | 'system-crash' | 'corruption-wave';
export type AttackCinematicKind = 'warning' | 'charge' | 'release' | 'hit' | 'block' | 'dodge' | 'interrupt' | 'cancel';

export interface AttackVisualProfile {
  visualType: AttackVisualType;
  warningColor: string;
  chargeColor: string;
  releaseColor: string;
  hitColor: string;
  blockColor: string;
  dodgeColor: string;
  intensity: number;
}

const DEFAULT_ATTACK_PROFILE: AttackVisualProfile = {
  visualType: 'digital-wave', warningColor: '#FF3D5A', chargeColor: '#7B61FF',
  releaseColor: '#00E5FF', hitColor: '#FF3D5A', blockColor: '#00E5FF', dodgeColor: '#7B61FF', intensity: 0.7,
};

const GATE01_ATTACK_PROFILE: AttackVisualProfile = {
  ...DEFAULT_ATTACK_PROFILE, visualType: 'digital-wave',
  warningColor: '#FF3D5A', chargeColor: '#7B61FF', releaseColor: '#00E5FF',
};

const ATTACK_TYPE_TO_VISUAL: Record<string, AttackVisualType> = {
  single: 'data-strike',
  multi: 'data-strike',
  aoe: 'digital-wave',
  delayed: 'system-crash',
  special: 'corruption-wave',
};

export function attackVisualTypeFor(attackType: string | undefined): AttackVisualType {
  return ATTACK_TYPE_TO_VISUAL[attackType || ''] || 'digital-wave';
}

export function attackVisualProfileFor(attackType: string | undefined, bossId: string): AttackVisualProfile {
  const base = bossId === 'gate-01' ? GATE01_ATTACK_PROFILE : DEFAULT_ATTACK_PROFILE;
  const selected = attackVisualTypeFor(attackType);
  return { ...base, visualType: selected };
}

export function attackThemeColorsFor(bossId: string): BossVisualTheme {
  return bossVisualThemeFor(bossId);
}

export function attackCinematicKindForEvent(eventType: string): AttackCinematicKind | null {
  switch (eventType) {
    case 'BOSS_ATTACK_TELEGRAPH': return 'warning';
    case 'BOSS_ATTACK_STARTED': return 'release';
    case 'BOSS_ATTACK_HIT': return 'hit';
    case 'BOSS_ATTACK_BLOCKED': return 'block';
    case 'BOSS_ATTACK_DODGED': return 'dodge';
    case 'BOSS_ATTACK_INTERRUPTED': return 'interrupt';
    case 'BOSS_ATTACK_CANCELLED': return 'cancel';
    default: return null;
  }
}

export function attackEffectIdFor(kind: AttackCinematicKind): string {
  switch (kind) {
    case 'warning': return 'boss-attack-warning';
    case 'charge': return 'boss-attack-charge';
    case 'release': return 'boss-attack-release';
    case 'hit': return 'boss-attack-hit';
    case 'block': return 'boss-attack-block';
    case 'dodge': return 'boss-attack-dodge';
    case 'interrupt': return 'boss-attack-interrupt';
    case 'cancel': return 'boss-attack-cancel';
  }
}

export function attackEffectDurationFor(kind: AttackCinematicKind, warningDuration?: number): number {
  if (kind === 'warning') return Math.max(260, Math.min(800, Math.round((warningDuration || 500) * 0.8)));
  if (kind === 'charge') return Math.max(300, Math.min(2200, Math.round(warningDuration || 900)));
  if (kind === 'release') return 380;
  if (kind === 'hit') return 360;
  if (kind === 'block') return 520;
  if (kind === 'dodge') return 520;
  if (kind === 'interrupt') return 620;
  return 350;
}

export function attackResultLabel(kind: AttackCinematicKind): string {
  switch (kind) {
    case 'block': return 'BLOCKED';
    case 'dodge': return 'DODGED';
    case 'hit': return 'IMPACT';
    case 'interrupt': return 'ATTACK INTERRUPTED';
    case 'cancel': return 'ATTACK CANCELLED';
    default: return '';
  }
}

export function attackResultText(kind: AttackCinematicKind): string {
  switch (kind) {
    case 'block': return '攻击已成功防御';
    case 'dodge': return '成功闪避攻击';
    case 'hit': return '玩家受到攻击';
    case 'interrupt': return 'Boss 攻击已被打断';
    case 'cancel': return 'Boss 攻击已取消';
    default: return '';
  }
}
