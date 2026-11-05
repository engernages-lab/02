// 存档服务：localStorage 读写、版本迁移、导出导入
import type { PlayerState, SaveData } from '../game/types';
import { defaultIdentity, normalizeIdentity } from '../game/identity';
import { normalizeStoryReadState, defaultStoryReadState } from '../game/lore/events';
import { normalizeStoryVars } from '../game/lore/vars';
import { defaultRewards, normalizeRewards } from '../game/rewards';
import { DEFAULT_VOICE, normalizeVoice } from './voice';
import { CURRENT_SAVE_VERSION, migrateSave } from './migrations';

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
 */
export function normalizePlayerState(raw: PlayerState): PlayerState {
  const identity = normalizeIdentity((raw as Partial<PlayerState>).identity, raw.name);
  const progress = raw.progress;
  const storySeen = progress.storySeen && typeof progress.storySeen === 'object' ? progress.storySeen : {};
  return {
    ...raw,
    name: identity.displayName,
    identity,
    meta: {
      ...raw.meta,
      memoryFragments: Array.isArray(raw.meta?.memoryFragments) ? raw.meta.memoryFragments : [],
      fragmentLog: raw.meta?.fragmentLog && typeof raw.meta.fragmentLog === 'object' ? raw.meta.fragmentLog : {},
      bugCodex: raw.meta?.bugCodex && typeof raw.meta.bugCodex === 'object' ? raw.meta.bugCodex : {},
    },
    progress: {
      ...progress,
      storySeen,
      story: normalizeStoryReadState(progress.story, storySeen),
      endings: Array.isArray(progress.endings) ? progress.endings : [],
      ending: typeof progress.ending === 'string' ? progress.ending : null,
      vault: {
        read: Array.isArray(progress.vault?.read) ? progress.vault.read : [],
        finalSeen: progress.vault?.finalSeen === true,
        lastOpened: typeof progress.vault?.lastOpened === 'string' ? progress.vault.lastOpened : null,
      },
      flags: normalizeStoryVars(progress.flags),
    },
    rewards: normalizeRewards((raw as Partial<PlayerState>).rewards),
    settings: {
      ...raw.settings,
      voice: normalizeVoice((raw.settings as { voice?: unknown })?.voice),
    },
  };
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
    const player = normalizePlayerState(m.player);
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
    return { ok: true, state: normalizePlayerState(m.player), notes };
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
