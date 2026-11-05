import { CHAPTERS } from '../game/lore/chapters';
import { levelsOfServer } from '../game/levels';

const CHAPTER_FLAGS = CHAPTERS.map(c => ({
  flag: c.doneFlag,
  bossId: c.currentBossId,
  levelIds: levelsOfServer(c.serverId).map(l => l.id),
}));

// 存档迁移链：旧版本存档 → 当前版本（只增字段，不改语义，不删数据）
// 设计原则：
//   1. 迁移函数必须是纯函数（输入输出都不修改原对象）；
//   2. 每一步只做「补齐/改名/合并」，绝不丢弃玩家已有进度；
//   3. 迁移失败时由调用方回滚（本模块不写存储）。
import { normalizeIdentity } from '../game/identity';
import { normalizeStoryReadState } from '../game/lore/events';
import { normalizeStoryVars } from '../game/lore/vars';

/** 当前存档版本 */
export const CURRENT_SAVE_VERSION = 7;

interface MigrationStep {
  /** 迁移到的目标版本 */
  to: number;
  name: string;
  run: (p: Record<string, unknown>) => Record<string, unknown>;
}

type AnyPlayer = Record<string, unknown>;

const STEPS: MigrationStep[] = [
  {
    to: 2,
    name: 'v1→v2：玩家身份（identity）+ 剧情事件状态（story）',
    run: (p) => {
      const progress = (p && typeof p.progress === 'object' && p.progress ? { ...(p.progress as AnyPlayer) } : {});
      return {
        ...p,
        identity: normalizeIdentity(p.identity, p.name),
        progress: {
          ...progress,
          story: normalizeStoryReadState(progress.story, progress.storySeen as Record<string, boolean> | undefined),
          flags: normalizeStoryVars(progress.flags),
        },
      };
    },
  },
  {
    to: 3,
    name: 'v2→v3：第一章 Boss 代号 ECHO-01 → GATE-01',
    run: (p) => {
      const progress = (p && typeof p.progress === 'object' && p.progress ? { ...(p.progress as AnyPlayer) } : {});
      const alias: Record<string, string> = { 'echo-01': 'gate-01' };
      const mapId = (id: unknown): unknown => (typeof id === 'string' ? (alias[id] || id) : id);
      const rawDone = Array.isArray(progress.bossesDone) ? progress.bossesDone : [];
      const bossesDone = [...new Set(rawDone.map(mapId).filter((x): x is string => typeof x === 'string'))];
      const currentBossId = typeof progress.currentBossId === 'string'
        ? (alias[progress.currentBossId] || progress.currentBossId)
        : progress.currentBossId ?? null;
      return { ...p, progress: { ...progress, bossesDone, currentBossId } };
    },
  },
  {
    to: 4,
    name: 'v3→v4：Boss 战进度（progress.battles）',
    run: (p) => {
      const progress = (p && typeof p.progress === 'object' && p.progress ? { ...(p.progress as AnyPlayer) } : {});
      const battles = progress.battles && typeof progress.battles === 'object' ? { ...(progress.battles as AnyPlayer) } : {};
      return { ...p, progress: { ...progress, battles } };
    },
  },
  {
    to: 5,
    name: 'v4→v5：第二章 Boss 代号 ECHO-02 → SOMNIA',
    run: (p) => {
      const progress = (p && typeof p.progress === 'object' && p.progress ? { ...(p.progress as AnyPlayer) } : {});
      const alias: Record<string, string> = { 'echo-02': 'somnia' };
      const mapId = (id: unknown): unknown => (typeof id === 'string' ? (alias[id] || id) : id);
      const rawDone = Array.isArray(progress.bossesDone) ? progress.bossesDone : [];
      const bossesDone = [...new Set(rawDone.map(mapId).filter((x): x is string => typeof x === 'string'))];
      const currentBossId = typeof progress.currentBossId === 'string'
        ? (alias[progress.currentBossId] || progress.currentBossId)
        : progress.currentBossId ?? null;
      return { ...p, progress: { ...progress, bossesDone, currentBossId } };
    },
  },
  {
    to: 6,
    name: 'v5→v6：记忆档案馆（meta.fragmentLog + progress.vault）',
    run: (p) => {
      const meta = (p && typeof p.meta === 'object' && p.meta ? { ...(p.meta as AnyPlayer) } : {});
      const log = (meta.fragmentLog && typeof meta.fragmentLog === 'object' ? { ...(meta.fragmentLog as AnyPlayer) } : {}) as Record<string, number>;
      const collected = Array.isArray(meta.memoryFragments) ? (meta.memoryFragments as unknown[]) : [];
      for (const id of collected) {
        if (typeof id === 'string' && typeof log[id] !== 'number') log[id] = 0; // 旧档：早期归档
      }
      const progress = (p && typeof p.progress === 'object' && p.progress ? { ...(p.progress as AnyPlayer) } : {});
      const rawVault = (progress.vault && typeof progress.vault === 'object' ? progress.vault : {}) as AnyPlayer;
      const vault = {
        read: Array.isArray(rawVault.read) ? rawVault.read : [],
        finalSeen: rawVault.finalSeen === true,
        lastOpened: typeof rawVault.lastOpened === 'string' ? rawVault.lastOpened : null,
      };
      return { ...p, meta: { ...meta, fragmentLog: log }, progress: { ...progress, vault } };
    },
  },
  {
    to: 7,
    name: 'v6→v7：回填章节完成标记（chapterNDone）',
    run: (p) => {
      const progress = (p && typeof p.progress === 'object' && p.progress ? { ...(p.progress as AnyPlayer) } : {});
      const flags = (progress.flags && typeof progress.flags === 'object' ? { ...(progress.flags as AnyPlayer) } : {}) as Record<string, boolean | number>;
      const completed = Array.isArray(progress.completedLevels) ? (progress.completedLevels as string[]) : [];
      const bossesDone = Array.isArray(progress.bossesDone) ? (progress.bossesDone as string[]) : [];
      for (const ch of CHAPTER_FLAGS) {
        const allDone = ch.levelIds.length > 0 && ch.levelIds.every(id => completed.includes(id));
        const bossOk = !ch.bossId || bossesDone.includes(ch.bossId);
        if (allDone && bossOk) flags[ch.flag] = true;
      }
      return { ...p, progress: { ...progress, flags } };
    },
  },
];

export interface MigrateResult {
  /** 迁移后的 player 对象（未校验） */
  player: unknown;
  from: number;
  to: number;
  notes: string[];
  /** 存档来自更高版本（只做兼容读取，不回写降级） */
  future: boolean;
}

/** 对 player 对象执行迁移链 */
export function migratePlayer(rawPlayer: unknown, fromVersion: number): MigrateResult {
  let player = rawPlayer;
  const notes: string[] = [];
  const from = Math.max(1, Math.floor(Number(fromVersion) || 1));
  const future = from > CURRENT_SAVE_VERSION;
  if (!future) {
    for (const step of STEPS) {
      if (from < step.to) {
        if (!player || typeof player !== 'object') break;
        player = step.run(player as AnyPlayer);
        notes.push(step.name);
      }
    }
  }
  return { player, from, to: CURRENT_SAVE_VERSION, notes, future };
}

/** 对完整存档对象（{version, updatedAt, player}）执行迁移 */
export function migrateSave(raw: unknown): MigrateResult {
  const data = (raw && typeof raw === 'object' ? raw : {}) as { version?: unknown; player?: unknown };
  const v = typeof data.version === 'number' && isFinite(data.version) ? Math.floor(data.version) : 0;
  if (v <= 0) {
    const r = migratePlayer(data.player, 1);
    return { ...r, notes: ['存档缺少版本号，已按 v1 处理', ...r.notes] };
  }
  return migratePlayer(data.player, v);
}
