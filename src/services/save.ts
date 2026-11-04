// 存档服务：localStorage 读写、数据版本管理、导出导入
import type { PlayerState, SaveData } from '../game/types';
import { defaultRewards, normalizeRewards } from '../game/rewards';
import { DEFAULT_VOICE, normalizeVoice } from './voice';

export const SAVE_KEY = 'nexus_code_repair_save_v1';
export const SAVE_VERSION = 1;

export function defaultState(): PlayerState {
  return {
    name: 'R-07',
    level: 1,
    exp: 0,
    consciousness: 100,
    meta: {
      deaths: 0,
      rebirths: 0,
      lastDeathLevel: null,
      lastDeathReason: null,
      memoryFragments: [],
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

export type LoadResult = { state: PlayerState; fresh: boolean; corrupted?: string };

export function saveGame(p: PlayerState): void {
  try {
    const data: SaveData = { version: SAVE_VERSION, updatedAt: Date.now(), player: p };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // 存储不可用时静默失败（游戏仍可玩，只是不持久化）
  }
}

export function loadGame(): LoadResult {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: defaultState(), fresh: true };
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) {
      // 版本迁移预留：未来升级时在此按 version 迁移
      return { state: defaultState(), fresh: true, corrupted: '存档数据版本（v' + data.version + '）与本版本（v' + SAVE_VERSION + '）不一致，已重置。' };
    }
    if (!isValidSave(data.player)) {
      return { state: defaultState(), fresh: true, corrupted: '存档数据已损坏，已重置。' };
    }
    // 兼容旧存档：奖励/语音字段缺失时补齐（不覆盖已有数据）
    const migrated: PlayerState = {
      ...data.player,
      rewards: normalizeRewards((data.player as Partial<PlayerState>).rewards),
      settings: {
        ...data.player.settings,
        voice: normalizeVoice((data.player.settings as { voice?: unknown })?.voice),
      },
    };
    return { state: migrated, fresh: false };
  } catch {
    return { state: defaultState(), fresh: true, corrupted: '存档数据已损坏，已重置。' };
  }
}

export function exportSave(p: PlayerState): string {
  const data: SaveData = { version: SAVE_VERSION, updatedAt: Date.now(), player: p };
  return JSON.stringify(data, null, 2);
}

export function importSave(text: string): { ok: boolean; state?: PlayerState; reason?: string } {
  try {
    const data = JSON.parse(text) as SaveData;
    if (!data || data.version !== SAVE_VERSION) return { ok: false, reason: '存档版本不匹配（需要 v' + SAVE_VERSION + '）。' };
    if (!isValidSave(data.player)) return { ok: false, reason: '存档内容不完整或已损坏。' };
    return { ok: true, state: data.player };
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
