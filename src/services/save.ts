// 存档服务：localStorage 读写、版本迁移、导出导入
import type { PlayerState, SaveData } from '../game/types';
import { defaultIdentity, normalizeIdentity } from '../game/identity';
import { normalizeStoryReadState, defaultStoryReadState } from '../game/lore/events';
import { normalizeStoryVars } from '../game/lore/vars';
import { defaultRewards, normalizeRewards } from '../game/rewards';
import { safeExp } from '../game/economyConfig';
import { levelForExp } from '../game/progression';
import { DEFAULT_VOICE, normalizeVoice } from './voice';
import { CURRENT_SAVE_VERSION, migrateSave } from './migrations';
import { normalizeChapterProgress } from '../game/chapterFlow';
import { normalizeSessions } from '../game/challengeSession';
import { LEVELS, SERVERS } from '../game/levels';
import { ACHIEVEMENTS } from '../game/achievements';
import { KNOWLEDGE } from '../game/knowledge';
import { MEMORY_FRAGMENTS } from '../game/story';
import { CREATOR_FRAGMENTS } from '../game/lore/fragments';
import { BOSSES } from '../game/bosses';

/** 合法 id 白名单：脏存档里的无效关卡/碎片/成就不会流入核心逻辑 */
const LEVEL_ID_SET = new Set(LEVELS.map(l => l.id));
const SERVER_ID_SET = new Set(SERVERS.map(s => s.id));
const ACH_ID_SET = new Set(ACHIEVEMENTS.map(a => a.id));
const KNOW_ID_SET = new Set(KNOWLEDGE.map(k => k.id));
const BOSS_ID_SET = new Set(BOSSES.map(b => b.id));
const FRAGMENT_ID_SET = new Set<string>([
  ...MEMORY_FRAGMENTS.map(f => f.id),
  ...CREATOR_FRAGMENTS.map(f => f.id),
]);
/** 失败计数同时用于普通关卡与 Boss（bossId），两者都要保留 */
const FAIL_ID_SET = new Set<string>([...LEVEL_ID_SET, ...BOSS_ID_SET]);

function cleanStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64))];
}

/** 计数表：只保留有限非负整数，并夹到上限 */
function cleanCounts(raw: unknown, allowed: Set<string> | null, max: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (allowed && !allowed.has(key)) continue;
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) continue;
    out[key] = Math.min(max, n);
  }
  return out;
}

function cleanStars(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!LEVEL_ID_SET.has(key)) continue;
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) continue;
    out[key] = Math.min(3, n);
  }
  return out;
}

/** 存储键保持不变，确保旧存档仍能被读取（改名会导致所有玩家进度丢失） */
export const SAVE_KEY = 'nexus_code_repair_save_v1';
export const SAVE_VERSION = CURRENT_SAVE_VERSION;

export function defaultState(): PlayerState {
  return {
    name: 'R-07',
    identity: defaultIdentity(),
    level: 1,
    exp: 0,
    consciousness: 100,
    meta: {
      deaths: 0,
      rebirths: 0,
      lastDeathLevel: null,
      lastDeathReason: null,
      memoryFragments: [],
      memoryLogs: [],
      fragmentLog: {},
      backupLevel: 1,
    },
    progress: {
      completedLevels: [],
      stars: {},
      unlockedServers: ['training'],
      currentLevelId: null,
      failedAttempts: {},
      hintLevels: {},
      achievements: [],
      knowledge: [],
      storySeen: {},
      story: defaultStoryReadState(),
      vault: { read: [], finalSeen: false, lastOpened: null },
      challengeSessions: {},
      endings: [],
      ending: null,
      flags: {},
      bossesDone: [],
      currentBossId: null,
      pendingRebirth: false,
    },
    rewards: defaultRewards(),
    settings: {
      musicVolume: 0.35,
      sfxVolume: 0.6,
      animations: true,
      animLevel: 'high',
      typewriterMs: 26,
      fullscreen: false,
      voice: { ...DEFAULT_VOICE, roleVoices: {} },
      lang: 'zh',
    },
  };
}

function isValidSave(x: unknown): x is PlayerState {
  if (typeof x !== 'object' || x === null) return false;
  const p = x as PlayerState;
  return (
    typeof p.name === 'string' &&
    typeof p.level === 'number' &&
    typeof p.exp === 'number' &&
    typeof p.consciousness === 'number' &&
    typeof p.meta?.deaths === 'number' &&
    typeof p.progress?.completedLevels === 'object' &&
    p.progress.completedLevels !== null &&
    typeof p.settings?.sfxVolume === 'number' &&
    Array.isArray(p.progress.completedLevels)
  );
}

/**
 * 字段级自愈：所有新增字段都必须是「缺失即可补」的。
 * 名称/身份以 identity 为准，并把 name 同步为显示名（兼容旧组件）。
 * fromVersion 用于旧存档的「历史进度继承」审计（V1.1.1 章节主线）。
 */
export function normalizePlayerState(raw: PlayerState, fromVersion?: number): PlayerState {
  const identity = normalizeIdentity((raw as Partial<PlayerState>).identity, raw.name);
  const progress = (raw.progress && typeof raw.progress === 'object' ? raw.progress : {}) as PlayerState['progress'];
  const storySeen = progress.storySeen && typeof progress.storySeen === 'object' ? progress.storySeen : {};
  const normalized: PlayerState = {
    ...raw,
    name: identity.displayName,
    identity,
    exp: safeExp(raw.exp),
    level: levelForExp(safeExp(raw.exp)),
    consciousness: Number.isFinite(Number(raw.consciousness))
      ? Math.max(0, Math.min(100, Math.floor(Number(raw.consciousness))))
      : 100,
    meta: {
      ...raw.meta,
      deaths: Math.max(0, Math.floor(Number(raw.meta?.deaths) || 0)),
      rebirths: Math.max(0, Math.floor(Number(raw.meta?.rebirths) || 0)),
      memoryFragments: cleanStringList(raw.meta?.memoryFragments).filter(id => FRAGMENT_ID_SET.has(id)),
      memoryLogs: Array.isArray(raw.meta?.memoryLogs) ? raw.meta.memoryLogs : [],
      fragmentLog: raw.meta?.fragmentLog && typeof raw.meta.fragmentLog === 'object' ? raw.meta.fragmentLog : {},
      bugCodex: raw.meta?.bugCodex && typeof raw.meta.bugCodex === 'object' ? raw.meta.bugCodex : {},
    },
    progress: {
      ...progress,
      storySeen,
      completedLevels: cleanStringList(progress.completedLevels).filter(id => LEVEL_ID_SET.has(id)),
      stars: cleanStars(progress.stars),
      failedAttempts: cleanCounts(progress.failedAttempts, FAIL_ID_SET, 999),
      hintLevels: cleanCounts(progress.hintLevels, LEVEL_ID_SET, 99),
      unlockedServers: (() => {
        const list = cleanStringList(progress.unlockedServers).filter(id => SERVER_ID_SET.has(id));
        return list.includes('training') ? list : ['training', ...list];
      })(),
      knowledge: cleanStringList(progress.knowledge).filter(id => KNOW_ID_SET.has(id)),
      achievements: cleanStringList(progress.achievements).filter(id => ACH_ID_SET.has(id)),
      bossesDone: cleanStringList(progress.bossesDone).filter(id => BOSS_ID_SET.has(id)),
      endings: cleanStringList(progress.endings),
      story: normalizeStoryReadState(progress.story, storySeen),
      ending: typeof progress.ending === 'string' ? progress.ending : null,
      vault: {
        read: Array.isArray(progress.vault?.read) ? progress.vault.read : [],
        finalSeen: progress.vault?.finalSeen === true,
        lastOpened: typeof progress.vault?.lastOpened === 'string' ? progress.vault.lastOpened : null,
      },
      flags: normalizeStoryVars(progress.flags),
      challengeSessions: normalizeSessions(progress.challengeSessions),
    },
    rewards: normalizeRewards((raw as Partial<PlayerState>).rewards),
    settings: {
      ...raw.settings,
      voice: normalizeVoice((raw.settings as { voice?: unknown })?.voice),
    },
  };
  return normalizeChapterProgress(normalized, typeof fromVersion === 'number' ? fromVersion : 1);
}

export type LoadResult = {
  state: PlayerState;
  fresh: boolean;
  corrupted?: string;
  /** 本次读取执行了版本迁移 */
  migrated?: boolean;
  fromVersion?: number;
  notes?: string[];
};

/** 损坏存档先备份，绝不直接丢弃原始数据 */
function backupCorrupted(raw: string): void {
  try {
    localStorage.setItem('nexus_save_corrupt_' + Date.now(), raw);
  } catch {
    // 存储不可用时忽略
  }
}

export function saveGame(p: PlayerState): void {
  try {
    const data: SaveData = { version: SAVE_VERSION, updatedAt: Date.now(), player: p };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // 存储不可用时静默失败（游戏仍可玩，只是不持久化）
  }
}

export function loadGame(): LoadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: defaultState(), fresh: true };
    const data = JSON.parse(raw) as SaveData;
    const m = migrateSave(data);
    if (!isValidSave(m.player)) {
      backupCorrupted(raw);
      return { state: defaultState(), fresh: true, corrupted: '存档数据已损坏，已重置（原始数据已备份）。' };
    }
    const player = normalizePlayerState(m.player, m.from);
    const notes = m.future ? [...m.notes, '存档来自更高版本（v' + m.from + '），已按兼容模式读取'] : m.notes;
    return {
      state: player,
      fresh: false,
      migrated: notes.length > 0,
      fromVersion: m.from,
      notes,
    };
  } catch {
    if (raw) backupCorrupted(raw);
    return { state: defaultState(), fresh: true, corrupted: '存档数据已损坏，已重置。' };
  }
}

export function exportSave(p: PlayerState): string {
  const data: SaveData = { version: SAVE_VERSION, updatedAt: Date.now(), player: p };
  return JSON.stringify(data, null, 2);
}

export function importSave(text: string): { ok: boolean; state?: PlayerState; reason?: string; notes?: string[] } {
  try {
    const data = JSON.parse(text) as SaveData;
    if (!data || typeof data !== 'object') return { ok: false, reason: '无法解析该文件，不是有效的 NEXUS 存档。' };
    const m = migrateSave(data);
    if (!isValidSave(m.player)) return { ok: false, reason: '存档内容不完整或已损坏。' };
    const notes = m.future ? [...m.notes, '该存档来自更高版本（v' + m.from + '），已按兼容模式导入'] : m.notes;
    return { ok: true, state: normalizePlayerState(m.player, m.from), notes };
  } catch {
    return { ok: false, reason: '无法解析该文件，不是有效的 NEXUS 存档。' };
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
