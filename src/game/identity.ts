// 玩家身份：显示名可自定义，原始实验编号永久固定
// 规范约束：R-07 是固定实验编号；玩家修改的只是「显示名称」。
export const ORIGIN_CODE = 'R-07';
export const DEFAULT_DISPLAY_NAME = 'R-07';
export const DISPLAY_NAME_MAX = 12;

/** 其他核心角色的名字，避免玩家改成与剧情角色同名造成混淆 */
export const RESERVED_NAMES = ['MIRA', '恩格尔', 'ENGER', 'K-0', 'K0', 'NEXUS'];

export interface PlayerIdentity {
  /** 玩家自定义显示名（默认 R-07） */
  displayName: string;
  /** 原始实验编号：永远是 R-07，任何逻辑都不得改写 */
  originCode: string;
  /** 是否使用过自定义名称 */
  renamed: boolean;
  /** 身份建立时间（毫秒） */
  createdAt: number;
}

export function defaultIdentity(now: number = Date.now()): PlayerIdentity {
  return { displayName: DEFAULT_DISPLAY_NAME, originCode: ORIGIN_CODE, renamed: false, createdAt: now };
}

/** 清洗显示名：去控制字符、合并空白、限长（不改变原始编号） */
export function sanitizeDisplayName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\r\n\t\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DISPLAY_NAME_MAX);
}

export function validateDisplayName(raw: unknown): { ok: boolean; name: string; reason?: string } {
  const name = sanitizeDisplayName(raw);
  if (!name) return { ok: false, name, reason: '显示名称不能为空。' };
  if (name.length > DISPLAY_NAME_MAX) {
    return { ok: false, name, reason: '显示名称最多 ' + DISPLAY_NAME_MAX + ' 个字符。' };
  }
  const upper = name.toUpperCase().replace(/\s+/g, '');
  if (RESERVED_NAMES.some(n => n.toUpperCase().replace(/\s+/g, '') === upper)) {
    return { ok: false, name, reason: '该名称属于 NEXUS 的核心角色，请换一个。' };
  }
  return { ok: true, name };
}

/** 旧存档兼容：缺失/损坏的身份信息补齐，且强制 originCode = R-07 */
export function normalizeIdentity(raw: unknown, fallbackName?: unknown): PlayerIdentity {
  const now = Date.now();
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<PlayerIdentity>;
  const fallback = sanitizeDisplayName(fallbackName);
  const displayName = sanitizeDisplayName(r.displayName) || fallback || DEFAULT_DISPLAY_NAME;
  const renamed = typeof r.renamed === 'boolean' ? r.renamed : displayName !== DEFAULT_DISPLAY_NAME;
  return {
    displayName,
    originCode: ORIGIN_CODE,
    renamed,
    createdAt: typeof r.createdAt === 'number' && isFinite(r.createdAt) ? r.createdAt : now,
  };
}

interface HasIdentity { identity?: PlayerIdentity | null; name?: string }

/** 全游戏统一读取显示名（永不返回空串） */
export function displayNameOf(p: HasIdentity | null | undefined): string {
  if (!p) return DEFAULT_DISPLAY_NAME;
  const fromIdentity = sanitizeDisplayName(p.identity?.displayName);
  if (fromIdentity) return fromIdentity;
  return sanitizeDisplayName(p.name) || DEFAULT_DISPLAY_NAME;
}

/** 全游戏统一读取原始编号（常量，不受改名影响） */
export function originCodeOf(_p?: HasIdentity | null): string {
  return ORIGIN_CODE;
}

/** 台词里显式指代「实验编号」的占位符：永远渲染为 R-07，不受改名影响 */
export const CODE_TOKEN = '{{code}}';
const CODE_SENTINEL = '\u0001';

/**
 * 对话文本中的名称替换：
 * - `{player}` → 玩家显示名（称呼）
 * - `{{code}}` → 固定实验编号 R-07（无论玩家是否改名）
 * - 玩家改过名时，正文里裸写的 R-07 也按显示名处理（兼容旧台词）
 */
export function applyPlayerName(text: string, displayName: string): string {
  if (!text) return '';
  const dn = sanitizeDisplayName(displayName) || DEFAULT_DISPLAY_NAME;
  let out = text.split(CODE_TOKEN).join(CODE_SENTINEL);
  out = out.split('{player}').join(dn);
  if (dn !== ORIGIN_CODE) out = out.split(ORIGIN_CODE).join(dn);
  return out.split(CODE_SENTINEL).join(ORIGIN_CODE);
}
