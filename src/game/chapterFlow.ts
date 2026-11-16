// 章节主线流程（V1.1.1）
// 单一事实来源：progress.chapters（每章 Boss 首胜 / 碎片归位 / 章节完成 / 下一章开放）
//
// 设计约束：
//   1. 所有正式入口（地图 / Boss 页 / 关卡页）必须走本模块的门禁函数；
//   2. Boss 首胜只能由 handleBossFirstClear 统一处理，六个 Boss 共用同一套事务；
//   3. 首胜必须通过「全部阶段 + 全部测试位掩码 + 血量归零」的真实战斗校验；
//   4. 首胜处理幂等：重复调用不会重复发碎片 / 经验 / 奖励 / 章节解锁；
//   5. 旧存档通过可审计的「历史进度继承」补齐章节与碎片，绝不降级已解锁章节。
import type {
  PlayerState, ChapterProgressMap, ChapterProgressState, LegacyMigrationAudit, BossRecord,
} from './types';
import { CHAPTERS, chapterById, chapterByServer } from './lore/chapters';
import type { ChapterDef } from './lore/types';
import { bossById } from './bosses';
import {
  normalizeBattleState, fullMask, phaseCheckCount,
  type BossBattleDef, type BossBattleState,
} from './battle';
import { bossBattleDef } from './bossDifficulties';
import { levelsOfServer } from './levels';
import { fragmentById, hasFragment } from './lore/fragments';
import { normalizeRewards, type RewardState } from './rewards';
import { bossRewardFor, unlocksForLevel, difficultyRewardFor, bossDifficultyBadgeId } from './economy';
import { difficultyOf, difficultyRank, bestDifficultyOf, type BossDifficulty } from './difficulty';
import { recalcAchievements } from './achievements';
import { levelForExp } from './progression';

// ---------- 基础类型 ----------

export type ChapterRunStatus =
  | 'LOCKED'          // 未解锁
  | 'AVAILABLE'       // 可以进入
  | 'IN_PROGRESS'     // 正在进行
  | 'BOSS_REQUIRED'   // 等待挑战本章 Boss
  | 'BOSS_DEFEATED'   // Boss 首胜已记录（等待章节结算）
  | 'COMPLETED';      // 章节已完成

export const CHAPTER_STATUS_TEXT: Record<ChapterRunStatus, string> = {
  LOCKED: 'LOCKED · 未解锁',
  AVAILABLE: 'AVAILABLE · 可进入',
  IN_PROGRESS: 'IN PROGRESS · 进行中',
  BOSS_REQUIRED: 'BOSS REQUIRED · 等待 Boss',
  BOSS_DEFEATED: 'BOSS DEFEATED · Boss 首胜',
  COMPLETED: 'COMPLETED · 已完成',
};

export const CHAPTER_STATUS_SHORT: Record<ChapterRunStatus, string> = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  IN_PROGRESS: 'IN PROGRESS',
  BOSS_REQUIRED: 'BOSS REQUIRED',
  BOSS_DEFEATED: 'BOSS DEFEATED',
  COMPLETED: 'COMPLETED',
};

export interface ChapterGate {
  id: string;
  order: number;
  title: string;
  area: string;
  serverId: string;
  bossId: string | null;
  bossCodename: string;
  bossTitle: string;
  fragmentId: string;
  shardCode: string;
  shardTitle: string;
  status: ChapterRunStatus;
  /** 规范解锁（满足主线条件） */
  unlocked: boolean;
  /** 旧存档已解锁（历史进度继承，允许进入但需补打 Boss） */
  legacyUnlocked: boolean;
  /** 是否允许进入本章区域（规范解锁 或 旧档继承） */
  enterable: boolean;
  levelsTotal: number;
  levelsDone: number;
  levelsComplete: boolean;
  bossDefeated: boolean;
  bossFirstClearAt: number | null;
  bossClearSource: ChapterProgressState['bossClearSource'];
  completed: boolean;
  shardOwned: boolean;
  nextChapterId: string | null;
  nextChapterTitle: string | null;
  /** 解锁本章需要满足的条件（真实状态推导） */
  requirement: string;
  /** 当前不能推进的原因（面向上方提示） */
  blockedReason: string;
}

export interface OriginCoreGate {
  /** 第六章外围区域是否可进入（规范解锁或旧档继承） */
  chapterEnterable: boolean;
  chapterUnlocked: boolean;
  /** 前五枚创世主碎片是否齐全 */
  unlocked: boolean;
  requiredCount: number;
  ownedCount: number;
  missing: { shardCode: string; fragmentId: string; title: string; bossCodename: string }[];
  bossDefeated: boolean;
  enteredAt: number | null;
  clearedAt: number | null;
  reason: string;
}

export interface BossGate {
  bossId: string;
  exists: boolean;
  chapterId: string | null;
  chapterOrder: number;
  chapterTitle: string;
  codename: string;
  bossTitle: string;
  chapterUnlocked: boolean;
  chapterEnterable: boolean;
  legacyChapter: boolean;
  levelsTotal: number;
  levelsDone: number;
  levelsComplete: boolean;
  bossDefeated: boolean;
  /** 已首胜：允许模拟再战（不发永久奖励） */
  simulation: boolean;
  originCoreRequired: boolean;
  originCore: OriginCoreGate | null;
  available: boolean;
  reason: string;
}

export interface BattleProof {
  ok: boolean;
  reason: string;
  /** 尚未完成的阶段 id */
  missingPhases: string[];
  /** 各阶段缺失的测试位 */
  missingChecks: number[];
}

// ---------- 小工具 ----------

const safeArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const chapterOfBossId = (bossId: string): ChapterDef | undefined =>
  CHAPTERS.find(c => c.currentBossId === bossId);

const nextChapterOf = (ch: ChapterDef): ChapterDef | undefined =>
  CHAPTERS.find(c => c.order === ch.order + 1);

const shardTitleOf = (fragmentId: string): string => fragmentById(fragmentId)?.title || '创世主碎片';

export function emptyChapterState(ch: ChapterDef): ChapterProgressState {
  return {
    bossDefeated: false,
    bossFirstClearAt: null,
    bossClearSource: null,
    fragmentId: ch.fragmentId,
    fragmentGrantedAt: null,
    completed: false,
    completedAt: null,
    unlockedAt: ch.order === 1 ? 0 : null,
  };
}

function normalizeOne(raw: unknown, ch: ChapterDef): ChapterProgressState {
  const base = emptyChapterState(ch);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ChapterProgressState>;
  const source: ChapterProgressState['bossClearSource'] =
    r.bossClearSource === 'battle' || r.bossClearSource === 'legacy-inherit' ? r.bossClearSource : null;
  const num = (v: unknown): number | null =>
    typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : null;
  return {
    bossDefeated: r.bossDefeated === true,
    bossFirstClearAt: num(r.bossFirstClearAt),
    bossClearSource: source,
    fragmentId: typeof r.fragmentId === 'string' ? r.fragmentId : ch.fragmentId,
    fragmentGrantedAt: num(r.fragmentGrantedAt),
    completed: r.completed === true,
    completedAt: num(r.completedAt),
    unlockedAt: num(r.unlockedAt),
  };
}

export function chapterLevelStats(player: PlayerState, ch: ChapterDef): { total: number; done: number; complete: boolean } {
  const levels = levelsOfServer(ch.serverId);
  const done = levels.filter(l => player.progress.completedLevels.includes(l.id)).length;
  return { total: levels.length, done, complete: levels.length > 0 && done === levels.length };
}

// ---------- 状态读取（只读、可自愈） ----------

/** 读取章节状态表：缺失字段补默认；旧存档的 bossesDone 记录视为真实战斗首胜 */
export function chapterStatesOf(player: PlayerState): ChapterProgressMap {
  const raw = player.progress.chapters;
  const map: ChapterProgressMap = {};
  for (const ch of CHAPTERS) map[ch.id] = normalizeOne(raw && typeof raw === 'object' ? raw[ch.id] : undefined, ch);

  const bossesDone = safeArray<string>(player.progress.bossesDone);
  const fragmentLog = player.meta.fragmentLog || {};
  for (const ch of CHAPTERS) {
    const bossId = ch.currentBossId;
    if (!bossId || !bossesDone.includes(bossId)) continue;
    if (map[ch.id].bossDefeated) continue;
    const stats = chapterLevelStats(player, ch);
    const at = typeof fragmentLog[ch.fragmentId] === 'number' ? fragmentLog[ch.fragmentId] : null;
    map[ch.id] = {
      ...map[ch.id],
      bossDefeated: true,
      bossFirstClearAt: at,
      bossClearSource: 'battle',
      fragmentId: ch.fragmentId,
      fragmentGrantedAt: at,
      completed: stats.complete || ch.order === 6,
      completedAt: at,
    };
  }
  return map;
}

export function chapterStateOf(player: PlayerState, chapterId: string): ChapterProgressState {
  const states = chapterStatesOf(player);
  return states[chapterId] || {
    bossDefeated: false, bossFirstClearAt: null, bossClearSource: null,
    fragmentId: null, fragmentGrantedAt: null, completed: false, completedAt: null, unlockedAt: null,
  };
}

/** 前五枚碎片（第六章原初核心校验用） */
export function firstFiveChapters(): ChapterDef[] {
  return CHAPTERS.filter(c => c.order <= 5);
}

/** 玩家真实持有的前五枚碎片 */
export function ownedFirstFive(player: PlayerState): { owned: string[]; missing: string[] } {
  const fragments = safeArray<string>(player.meta.memoryFragments);
  const owned: string[] = [];
  const missing: string[] = [];
  for (const ch of firstFiveChapters()) {
    if (hasFragment(fragments, ch.fragmentId)) owned.push(ch.fragmentId);
    else missing.push(ch.fragmentId);
  }
  return { owned, missing };
}

// ---------- 章节门禁 ----------

/** 规范解锁条件：第一章初始开放；其余章节要求上一章 Boss 首胜 + 对应碎片 */
function canonicalUnlock(player: PlayerState, ch: ChapterDef, states: ChapterProgressMap): { ok: boolean; reason: string } {
  if (ch.order === 1) return { ok: true, reason: '' };
  const prev = CHAPTERS.find(c => c.order === ch.order - 1);
  if (!prev) return { ok: false, reason: '章节顺序异常' };
  const prevState = states[prev.id];
  const prevBoss = prev.currentBossId ? bossById(prev.currentBossId) : undefined;
  const prevBossName = prevBoss ? prevBoss.codename : (prev.bossId || '').toUpperCase();
  const prevShardOwned = hasFragment(safeArray<string>(player.meta.memoryFragments), prev.fragmentId);
  const prevDone = prevState.bossDefeated && prevState.completed && prevShardOwned;
  const base = `需要完成第 ${prev.order} 章《${prev.title}》最终 Boss ${prevBossName}，并获得创世主碎片 ${prev.shardId}《${shardTitleOf(prev.fragmentId)}》。`;

  if (!prevDone) return { ok: false, reason: base };

  if (ch.order === 6) {
    const { owned, missing } = ownedFirstFive(player);
    if (missing.length > 0) {
      const codes = firstFiveChapters().filter(c => missing.includes(c.fragmentId)).map(c => c.shardId).join('、');
      return {
        ok: false,
        reason: `需要完成第 ${prev.order} 章最终 Boss ${prevBossName}，并集齐前五枚创世主碎片（当前 ${owned.length}/5，缺少 ${codes}）。`,
      };
    }
  }
  return { ok: true, reason: '' };
}

export function chapterGate(player: PlayerState, chapterId: string): ChapterGate {
  const ch = chapterById(chapterId) || CHAPTERS[0];
  const states = chapterStatesOf(player);
  const state = states[ch.id];
  const stats = chapterLevelStats(player, ch);
  const unlock = canonicalUnlock(player, ch, states);
  const legacyUnlocked = !unlock.ok && safeArray<string>(player.progress.unlockedServers).includes(ch.serverId);
  const enterable = unlock.ok || legacyUnlocked;
  const boss = ch.currentBossId ? bossById(ch.currentBossId) : undefined;
  const next = nextChapterOf(ch);
  const shardOwned = hasFragment(safeArray<string>(player.meta.memoryFragments), ch.fragmentId);

  let status: ChapterRunStatus;
  if (state.completed && state.bossDefeated) status = 'COMPLETED';
  else if (state.bossDefeated) status = 'BOSS_DEFEATED';
  else if (!enterable) status = 'LOCKED';
  else if (ch.order <= 5 && stats.complete) status = 'BOSS_REQUIRED';
  else if (stats.done > 0) status = 'IN_PROGRESS';
  else status = 'AVAILABLE';

  let requirement = '';
  if (ch.order === 1) {
    requirement = '初始开放：完成新人训练终端后接入语法维修站。';
  } else if (ch.order === 6) {
    const { owned } = ownedFirstFive(player);
    const prev = CHAPTERS.find(c => c.order === 5);
    const prevBoss = prev?.currentBossId ? bossById(prev.currentBossId) : undefined;
    requirement = `需要完成第五章最终 Boss ${prevBoss ? prevBoss.codename : 'ENTROPY'} 并获得 ${prev?.shardId || 'SHARD-05'}，且集齐前五枚创世主碎片（当前 ${owned.length}/5）。`;
  } else {
    const prev = CHAPTERS.find(c => c.order === ch.order - 1)!;
    const prevBoss = prev.currentBossId ? bossById(prev.currentBossId) : undefined;
    requirement = `需要完成第 ${prev.order} 章最终 Boss ${prevBoss ? prevBoss.codename : prev.bossId.toUpperCase()}，并获得创世主碎片 ${prev.shardId}《${shardTitleOf(prev.fragmentId)}》。`;
  }

  let blockedReason = '';
  if (status === 'LOCKED') {
    blockedReason = unlock.reason || requirement;
  } else if (legacyUnlocked && !unlock.ok) {
    blockedReason = `旧版进度继承：${ch.area} 已开放，但需补打第 ${ch.order} 章 Boss ${boss ? boss.codename : ''}，才能解锁下一章。`;
  } else if (status === 'BOSS_REQUIRED') {
    blockedReason = `本章普通关卡已全部完成：击败 ${boss ? boss.codename : '本章 Boss'} 后才能解锁第 ${ch.order + 1} 章。`;
  }

  return {
    id: ch.id,
    order: ch.order,
    title: ch.title,
    area: ch.area,
    serverId: ch.serverId,
    bossId: ch.currentBossId,
    bossCodename: boss ? boss.codename : '',
    bossTitle: boss ? boss.title : '',
    fragmentId: ch.fragmentId,
    shardCode: ch.shardId,
    shardTitle: shardTitleOf(ch.fragmentId),
    status,
    unlocked: unlock.ok,
    legacyUnlocked,
    enterable,
    levelsTotal: stats.total,
    levelsDone: stats.done,
    levelsComplete: stats.complete,
    bossDefeated: state.bossDefeated,
    bossFirstClearAt: state.bossFirstClearAt,
    bossClearSource: state.bossClearSource,
    completed: state.completed,
    shardOwned,
    nextChapterId: next ? next.id : null,
    nextChapterTitle: next ? next.title : null,
    requirement,
    blockedReason,
  };
}

export function allChapterGates(player: PlayerState): ChapterGate[] {
  return CHAPTERS.map(c => chapterGate(player, c.id));
}

/** 正式游戏入口统一使用的服务器门禁 */
export function canEnterServer(player: PlayerState, serverId: string): { ok: boolean; reason: string; legacy: boolean } {
  if (serverId === 'training') return { ok: true, reason: '', legacy: false };
  if (serverId === 'syntax' && !player.progress.completedLevels.includes('tut-1')) {
    return { ok: false, reason: '需要先完成新人训练终端的基础接驳任务。', legacy: false };
  }
  const ch = chapterByServer(serverId);
  if (!ch) {
    const unlocked = safeArray<string>(player.progress.unlockedServers).includes(serverId);
    return { ok: unlocked, reason: unlocked ? '' : '该区域尚未解锁。', legacy: false };
  }
  const gate = chapterGate(player, ch.id);
  if (gate.enterable) return { ok: true, reason: '', legacy: gate.legacyUnlocked && !gate.unlocked };
  return { ok: false, reason: gate.blockedReason || gate.requirement, legacy: false };
}

// ---------- 原初核心（第六章外圈 与 原初核心 是两个独立状态） ----------

export function originCoreGate(player: PlayerState): OriginCoreGate {
  const ch6 = chapterGate(player, 'ch6');
  const ch6State = chapterStateOf(player, 'ch6');
  const { owned, missing } = ownedFirstFive(player);
  const missingDetail = firstFiveChapters()
    .filter(c => missing.includes(c.fragmentId))
    .map(c => {
      const boss = c.currentBossId ? bossById(c.currentBossId) : undefined;
      return {
        shardCode: c.shardId,
        fragmentId: c.fragmentId,
        title: shardTitleOf(c.fragmentId),
        bossCodename: boss ? boss.codename : '',
      };
    });
  const unlocked = ch6.enterable && missing.length === 0;
  let reason = '';
  if (!ch6.enterable) reason = ch6.blockedReason || ch6.requirement;
  else if (missing.length > 0) {
    reason = `需要集齐前五枚创世主碎片，才能启动原初核心（当前 ${owned.length}/5，缺少 ${missingDetail.map(m => m.shardCode).join('、')}）。`;
  } else if (ch6State.bossDefeated) {
    reason = '原初核心已通过 K-0 裁决。';
  }
  return {
    chapterEnterable: ch6.enterable,
    chapterUnlocked: ch6.unlocked,
    unlocked,
    requiredCount: 5,
    ownedCount: owned.length,
    missing: missingDetail,
    bossDefeated: ch6State.bossDefeated,
    enteredAt: player.progress.originCore?.enteredAt ?? null,
    clearedAt: player.progress.originCore?.clearedAt ?? null,
    reason,
  };
}

// ---------- Boss 门禁 ----------

export function bossGate(player: PlayerState, bossId: string): BossGate {
  const boss = bossById(bossId);
  const ch = chapterOfBossId(bossId);
  if (!boss || !ch) {
    return {
      bossId, exists: false, chapterId: null, chapterOrder: 0, chapterTitle: '',
      codename: boss ? boss.codename : bossId.toUpperCase(), bossTitle: boss ? boss.title : '',
      chapterUnlocked: false, chapterEnterable: false, legacyChapter: false,
      levelsTotal: 0, levelsDone: 0, levelsComplete: false,
      bossDefeated: false, simulation: false, originCoreRequired: false, originCore: null,
      available: false, reason: '该 Boss 不属于六章主线。',
    };
  }
  const gate = chapterGate(player, ch.id);
  const stats = chapterLevelStats(player, ch);
  const states = chapterStatesOf(player);
  const state = states[ch.id];
  const core = ch.order === 6 ? originCoreGate(player) : null;
  const bossDefeated = state.bossDefeated;
  const simulation = bossDefeated;
  const originCoreRequired = ch.order === 6;

  let available: boolean;
  let reason = '';
  if (ch.order === 6) {
    available = gate.enterable && !!core && core.unlocked && !bossDefeated;
    if (!gate.enterable) reason = gate.blockedReason || gate.requirement;
    else if (core && !core.unlocked) reason = core.reason;
  } else {
    available = gate.enterable && stats.complete && !bossDefeated;
    if (!gate.enterable) reason = gate.blockedReason || gate.requirement;
    else if (!stats.complete) {
      reason = `需要先完成第 ${ch.order} 章全部 ${stats.total} 个普通关卡（当前 ${stats.done}/${stats.total}），才能挑战 ${boss.codename}。`;
    }
  }
  if (bossDefeated) reason = '该 Boss 已首次击败：可进行模拟挑战（不发放永久奖励）。';

  return {
    bossId,
    exists: true,
    chapterId: ch.id,
    chapterOrder: ch.order,
    chapterTitle: ch.title,
    codename: boss.codename,
    bossTitle: boss.title,
    chapterUnlocked: gate.unlocked,
    chapterEnterable: gate.enterable,
    legacyChapter: gate.legacyUnlocked && !gate.unlocked,
    levelsTotal: stats.total,
    levelsDone: stats.done,
    levelsComplete: stats.complete,
    bossDefeated,
    simulation,
    originCoreRequired,
    originCore: core,
    available,
    reason,
  };
}

// ---------- 真实战斗校验 ----------

/** 校验战斗状态是否真的满足「全部阶段 + 全部测试 + 血量归零」 */
export function verifyBattleState(def: BossBattleDef, state: BossBattleState): BattleProof {
  const missingPhases: string[] = [];
  const missingChecks: number[] = [];
  def.phases.forEach((p, i) => {
    const full = fullMask(phaseCheckCount(p));
    const got = state.phaseMask[i] || 0;
    if ((got & full) !== full) {
      missingPhases.push(p.id);
      missingChecks.push(full & ~got);
    }
  });
  if (missingPhases.length > 0) {
    return { ok: false, reason: 'Boss 阶段测试尚未全部通过', missingPhases, missingChecks };
  }
  if (state.phase < def.phases.length) {
    return { ok: false, reason: 'Boss 仍有阶段未被击破', missingPhases, missingChecks };
  }
  if (state.hp > 0) {
    return { ok: false, reason: 'Boss 血量尚未归零', missingPhases, missingChecks };
  }
  return { ok: true, reason: '', missingPhases: [], missingChecks: [] };
}

/** 从存档读取某 Boss 的战斗，并校验是否真实胜利 */
export function verifyBossVictory(player: PlayerState, bossId: string): BattleProof {
  const raw = (player.progress.battles || {})[bossId];
  const difficulty = difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined);
  const def = bossBattleDef(bossId, difficulty);
  if (!def) return { ok: false, reason: '该 Boss 没有多阶段战斗数据', missingPhases: [], missingChecks: [] };
  if (!raw) return { ok: false, reason: '没有该 Boss 的战斗记录', missingPhases: [], missingChecks: [] };
  const state = normalizeBattleState(raw, def);
  return verifyBattleState(def, state);
}

// ---------- Boss 难度挑战记录 ----------

export function emptyBossRecord(): BossRecord {
  return { firstDifficulty: null, bestDifficulty: null, firstClearAt: null, cleared: {} };
}

export function bossRecordOf(player: PlayerState, bossId: string): BossRecord {
  const raw = (player.progress.bossRecords || {})[bossId];
  if (!raw || typeof raw !== 'object') return emptyBossRecord();
  const cleared: BossRecord['cleared'] = {};
  for (const d of ['easy', 'hard', 'expert'] as BossDifficulty[]) {
    const rec = raw.cleared?.[d];
    if (!rec || typeof rec !== 'object') continue;
    cleared[d] = {
      firstAt: typeof rec.firstAt === 'number' && isFinite(rec.firstAt) ? Math.max(0, Math.floor(rec.firstAt)) : 0,
      lastAt: typeof rec.lastAt === 'number' && isFinite(rec.lastAt) ? Math.max(0, Math.floor(rec.lastAt)) : 0,
      count: typeof rec.count === 'number' && isFinite(rec.count) ? Math.max(0, Math.floor(rec.count)) : 0,
      rewarded: rec.rewarded === true,
    };
  }
  return {
    firstDifficulty: raw.firstDifficulty ? difficultyOf(raw.firstDifficulty) : null,
    bestDifficulty: raw.bestDifficulty ? difficultyOf(raw.bestDifficulty) : null,
    firstClearAt: typeof raw.firstClearAt === 'number' && isFinite(raw.firstClearAt) ? Math.max(0, Math.floor(raw.firstClearAt)) : null,
    cleared,
    bestGrade: typeof raw.bestGrade === 'string' ? raw.bestGrade : undefined,
  };
}

/** 各难度的一次性奖励量（相对 Boss 基础经验 / 章节首杀贡献点） */
export function difficultyBonusAmounts(bossId: string, difficulty: BossDifficulty): { exp: number; credits: number } {
  const boss = bossById(bossId);
  if (!boss) return { exp: 0, credits: 0 };
  const dr = difficultyRewardFor(difficulty);
  const baseCredits = bossRewardFor(boss.chapter)?.credits || 0;
  return {
    exp: Math.max(0, Math.round(boss.rewardExp * dr.expPct)),
    credits: Math.max(0, Math.round(baseCredits * dr.creditsPct)),
  };
}

export interface DifficultyClearResult {
  player: PlayerState;
  firstTime: boolean;
  exp: number;
  credits: number;
  badgeId: string | null;
  titleUnlocked: string | null;
  record: BossRecord;
}

/**
 * 记录一次「某 Boss / 某难度」通关（首通或模拟再战）。
 * 难度一次性奖励只在该难度的首次通关发放；重复通关只累计次数，不产生永久资源。
 */
export function recordBossDifficultyClear(
  player: PlayerState,
  bossId: string,
  difficulty: BossDifficulty,
  opts: { now?: number; grantRewards?: boolean; grade?: string } = {},
): DifficultyClearResult {
  const now = typeof opts.now === 'number' ? Math.max(0, Math.floor(opts.now)) : Date.now();
  const diff = difficultyOf(difficulty);
  const grant = opts.grantRewards !== false;
  const record = bossRecordOf(player, bossId);
  const cleared = { ...record.cleared };
  const prev = cleared[diff];
  const firstTime = !prev;
  const current: BossRecord['cleared'][BossDifficulty] = prev
    ? { ...prev, lastAt: now, count: prev.count + 1 }
    : { firstAt: now, lastAt: now, count: 1, rewarded: grant };

  let exp = 0;
  let credits = 0;
  let badgeId: string | null = null;
  let titleUnlocked: string | null = null;
  const dr = difficultyRewardFor(diff);
  const shouldReward = firstTime && grant;

  const nextRewards = normalizeRewards(player.rewards);
  const badges = [...(nextRewards.badges || [])];
  const skins = [...nextRewards.skins];
  const equipped = { ...nextRewards.equipped };
  const unlocks = [...(nextRewards.unlocks || [])];
  const difficultyRewards = [...(nextRewards.difficultyRewards || [])];
  const rewardKey = bossId + '@' + diff;
  const canPay = shouldReward && !difficultyRewards.includes(rewardKey);

  if (canPay) {
    difficultyRewards.push(rewardKey);
    const amounts = difficultyBonusAmounts(bossId, diff);
    exp = amounts.exp;
    credits = amounts.credits;
    if (dr.badge) {
      badgeId = bossDifficultyBadgeId(bossId, diff);
      if (!badges.includes(badgeId)) badges.push(badgeId);
    }
    if (dr.title && !skins.includes(dr.title)) {
      skins.push(dr.title);
      titleUnlocked = dr.title;
      if (!equipped.title) equipped.title = dr.title;
      unlocks.push(dr.title);
    }
    current.rewarded = true;
  }
  cleared[diff] = current;

  const nextRecord: BossRecord = {
    firstDifficulty: record.firstDifficulty || diff,
    bestDifficulty: bestDifficultyOf(record.bestDifficulty, diff),
    firstClearAt: record.firstClearAt ?? now,
    cleared,
    bestGrade: opts.grade || record.bestGrade,
  };

  let nextPlayer: PlayerState = {
    ...player,
    exp: player.exp + exp,
    rewards: {
      ...nextRewards,
      credits: nextRewards.credits + credits,
      badges,
      skins,
      equipped,
      unlocks,
      difficultyRewards,
    },
    progress: {
      ...player.progress,
      bossRecords: { ...(player.progress.bossRecords || {}), [bossId]: nextRecord },
    },
  };
  if (exp > 0) nextPlayer = { ...nextPlayer, level: levelForExp(nextPlayer.exp) };
  nextPlayer.progress.achievements = recalcAchievements(nextPlayer);

  return { player: nextPlayer, firstTime, exp, credits, badgeId, titleUnlocked, record: nextRecord };
}

// ---------- 统一 Boss 首胜事务 ----------

export interface BossFirstClearPayload {
  bossId: string;
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  shardCode: string;
  fragmentId: string;
  fragmentTitle: string;
  /** 本次是否真正新写入碎片（旧档已拥有 / 旧 id 兼容时为 false） */
  fragmentGranted: boolean;
  expGained: number;
  levelUp: boolean;
  newLevel: number;
  credits: number;
  trust: number;
  unlocks: string[];
  /** 本次首胜选择的难度 */
  difficulty: BossDifficulty;
  /** 难度额外经验 / 贡献点（已包含在 expGained / credits 中） */
  difficultyExp: number;
  difficultyCredits: number;
  /** 该难度首次通关获得的徽章 id */
  badgeId: string | null;
  /** 专家难度首次通关解锁的称号 */
  titleUnlocked: string | null;
  nextChapterId: string | null;
  nextChapterTitle: string | null;
  nextChapterUnlocked: boolean;
  firstClearAt: number;
  bossClearSource: 'battle' | 'legacy-inherit';
  originCoreCleared: boolean;
}

export interface BossFirstClearResult {
  changed: boolean;
  reason: string;
  player: PlayerState;
  payload: BossFirstClearPayload | null;
}

const fail = (player: PlayerState, reason: string): BossFirstClearResult =>
  ({ changed: false, reason, player, payload: null });

export interface BossFirstClearOptions {
  now?: number;
  /** 本次挑战的难度（默认 easy，兼容旧调用） */
  difficulty?: BossDifficulty;
  /** 仅内部/迁移使用；正式入口一律使用 battle */
  source?: 'battle' | 'legacy-inherit';
}

/**
 * 统一 Boss 首胜处理（六个 Boss 共用）：
 *   校验真实胜利 → 记录首胜 → 发放对应碎片 → 记录时间 → 章节完成 → 开放下一章
 *   → 更新解锁服务器 / 成就 / 奖励 → 原初核心记录（K-0）。
 * 幂等：已首胜直接返回 changed=false。
 */
export function handleBossFirstClear(
  player: PlayerState,
  bossId: string,
  opts: BossFirstClearOptions = {},
): BossFirstClearResult {
  const boss = bossById(bossId);
  const ch = chapterOfBossId(bossId);
  if (!boss) return fail(player, 'Boss 不存在');
  if (!ch) return fail(player, '该 Boss 不属于六章主线，不能发放创世主碎片');
  if (boss.fragmentId !== ch.fragmentId) return fail(player, 'Boss 与创世主碎片绑定不一致');

  const now = typeof opts.now === 'number' ? Math.max(0, Math.floor(opts.now)) : Date.now();
  const source = opts.source === 'legacy-inherit' ? 'legacy-inherit' : 'battle';
  const states = chapterStatesOf(player);
  if (states[ch.id].bossDefeated) return fail(player, '该 Boss 已首次击败（幂等）');

  // 主线前提：章节必须已开放；第一~五章还必须完成全部普通关卡；第六章必须通过五碎片校验
  const gate = chapterGate(player, ch.id);
  if (!gate.enterable) return fail(player, '章节尚未解锁：' + (gate.blockedReason || gate.requirement));
  if (ch.order <= 5) {
    const stats = chapterLevelStats(player, ch);
    if (!stats.complete) {
      return fail(player, '本章普通关卡尚未全部完成（' + stats.done + '/' + stats.total + '）');
    }
  } else {
    const core = originCoreGate(player);
    if (!core.unlocked) return fail(player, '原初核心尚未解锁：' + core.reason);
  }

  if (source === 'battle') {
    const proof = verifyBossVictory(player, bossId);
    if (!proof.ok) return fail(player, 'Boss 尚未真实胜利：' + proof.reason);
  }

  // 难度记录 + 该难度一次性奖励（首通该难度时发放，之后不重复）
  const difficulty = difficultyOf(opts.difficulty);
  const diffClear = recordBossDifficultyClear(player, bossId, difficulty, { now, grantRewards: true });
  const diffPlayer = diffClear.player;

  const meta = player.meta;
  const fragments = safeArray<string>(meta.memoryFragments).slice();
  const alreadyOwned = hasFragment(fragments, ch.fragmentId);
  const fragmentGranted = !alreadyOwned;
  if (fragmentGranted) fragments.push(ch.fragmentId);
  const fragmentLog = { ...(meta.fragmentLog || {}) };
  if (typeof fragmentLog[ch.fragmentId] !== 'number') fragmentLog[ch.fragmentId] = now;

  const newExp = diffPlayer.exp + boss.rewardExp;
  const newLevel = levelForExp(newExp);

  // 章节奖励（幂等）
  const baseRw = normalizeRewards(diffPlayer.rewards);
  const bossRewards = [...(baseRw.bossRewards || [])];
  const nextRw: RewardState = {
    ...baseRw,
    items: { ...baseRw.items },
    skins: [...baseRw.skins],
    bossRewards,
    unlocks: [...(baseRw.unlocks || [])],
    equipped: { ...baseRw.equipped },
  };
  const unlocks: string[] = [];
  let trust = 0;
  const br = bossRewardFor(boss.chapter);
  const rewardKey = 'boss-ch' + boss.chapter;
  if (br && !bossRewards.includes(rewardKey)) {
    nextRw.credits = baseRw.credits + br.credits;
    nextRw.trust = Math.min(100, baseRw.trust + br.trust);
    bossRewards.push(rewardKey);
    if (br.items) for (const [k, v] of Object.entries(br.items)) nextRw.items[k] = (nextRw.items[k] || 0) + v;
    if (br.skins && br.skins.length) nextRw.skins = [...new Set([...nextRw.skins, ...br.skins])];
    trust = br.trust;
    unlocks.push(br.title);
  }

  // 等级解锁
  for (const u of unlocksForLevel(diffPlayer.level, newLevel)) {
    if (nextRw.skins.includes(u.id)) continue;
    nextRw.skins = [...nextRw.skins, u.id];
    nextRw.unlocks = [...(nextRw.unlocks || []), u.id];
    if (u.slot) nextRw.equipped = { ...nextRw.equipped, [u.slot]: u.id };
    unlocks.push(u.name);
  }

  // 章节状态：首胜 + 结算 + 下一章开放
  const nextStates: ChapterProgressMap = { ...states };
  nextStates[ch.id] = {
    ...states[ch.id],
    bossDefeated: true,
    bossFirstClearAt: now,
    bossClearSource: source,
    fragmentId: ch.fragmentId,
    fragmentGrantedAt: alreadyOwned
      ? (states[ch.id].fragmentGrantedAt ?? (fragmentLog[ch.fragmentId] || now))
      : now,
    completed: true,
    completedAt: now,
    unlockedAt: states[ch.id].unlockedAt ?? now,
  };
  const nextCh = nextChapterOf(ch);
  if (nextCh) {
    nextStates[nextCh.id] = { ...nextStates[nextCh.id], unlockedAt: nextStates[nextCh.id].unlockedAt ?? now };
  }

  // 服务器解锁（兼容旧字段，供地图/状态展示；真实门禁仍以 chapters 为准）
  const unlockedServers = [...new Set([
    ...safeArray<string>(player.progress.unlockedServers),
    ch.serverId,
    ...(nextCh ? [nextCh.serverId] : []),
  ])];

  const flags = { ...player.progress.flags };
  flags[ch.doneFlag] = true;
  if (ch.order === 6) {
    flags.chapter6Done = true;
    flags.gameCompleted = true;
  }

  const bossesDone = safeArray<string>(player.progress.bossesDone).slice();
  if (!bossesDone.includes(bossId)) bossesDone.push(bossId);

  const originCore = ch.order === 6
    ? { enteredAt: player.progress.originCore?.enteredAt ?? null, clearedAt: now }
    : player.progress.originCore;

  const totalCredits = (br ? br.credits : 0) + diffClear.credits;
  const nextPlayer: PlayerState = {
    ...diffPlayer,
    exp: newExp,
    level: newLevel,
    rewards: nextRw,
    meta: { ...meta, memoryFragments: fragments, fragmentLog },
    progress: {
      ...diffPlayer.progress,
      flags,
      bossesDone,
      chapters: nextStates,
      unlockedServers,
      originCore,
    },
  };
  nextPlayer.progress.achievements = recalcAchievements(nextPlayer);

  const payload: BossFirstClearPayload = {
    bossId,
    chapterId: ch.id,
    chapterTitle: ch.title,
    chapterOrder: ch.order,
    shardCode: ch.shardId,
    fragmentId: ch.fragmentId,
    fragmentTitle: shardTitleOf(ch.fragmentId),
    fragmentGranted,
    expGained: boss.rewardExp + diffClear.exp,
    levelUp: newLevel > player.level,
    newLevel,
    credits: totalCredits,
    trust,
    unlocks,
    difficulty,
    difficultyExp: diffClear.exp,
    difficultyCredits: diffClear.credits,
    badgeId: diffClear.badgeId,
    titleUnlocked: diffClear.titleUnlocked,
    nextChapterId: nextCh ? nextCh.id : null,
    nextChapterTitle: nextCh ? nextCh.title : null,
    nextChapterUnlocked: !!nextCh,
    firstClearAt: now,
    bossClearSource: source,
    originCoreCleared: ch.order === 6,
  };
  return { changed: true, reason: '', player: nextPlayer, payload };
}

/** 记录进入原初核心（K-0 入口）的时间 */
export function markOriginCoreEntered(player: PlayerState, now: number = Date.now()): PlayerState {
  const cur = player.progress.originCore;
  if (cur && typeof cur.enteredAt === 'number') return player;
  return {
    ...player,
    progress: {
      ...player.progress,
      originCore: { enteredAt: now, clearedAt: cur?.clearedAt ?? null },
    },
  };
}

// ---------- 旧存档进度继承（可审计） ----------

function hasAnyLevelProgress(player: PlayerState, ch: ChapterDef): boolean {
  const levels = levelsOfServer(ch.serverId);
  return levels.some(l => player.progress.completedLevels.includes(l.id));
}

function levelsVerboseDone(player: PlayerState, ch: ChapterDef): boolean {
  const stats = chapterLevelStats(player, ch);
  return stats.complete || player.progress.flags[ch.doneFlag] === true;
}

interface InheritancePlan {
  chapters: string[];
  fragments: string[];
}

/**
 * 旧档可继承的章节（只继承第一~五章，第六章必须真实击败 K-0）：
 *   1. 连续完成 ≥ 3 章 → 视为旧版深度进度，整段继承（避免强制重玩已完成章节）；
 *   2. 连续完成 1~2 章，且已经推进到下一章的关卡 → 继承已完成的章节；
 *   3. 仅完成 1~2 章、尚未推进到下一章 → 不补发（保留旧版区域入口，需补打 Boss，
 *      避免把「只解锁了下一章」伪造成「已完成章节」）。
 * 继承一律标记 bossClearSource='legacy-inherit' 并写入 migrationAudit，可审计。
 */
function planLegacyInheritance(player: PlayerState): InheritancePlan {
  let contiguous = 0;
  for (const ch of CHAPTERS) {
    if (levelsVerboseDone(player, ch)) contiguous = ch.order;
    else break;
  }
  const movedBeyond = (order: number): boolean => {
    const next = CHAPTERS.find(c => c.order === order + 1);
    if (!next) return false;
    return hasAnyLevelProgress(player, next) || player.progress.flags[next.doneFlag] === true;
  };
  let count = 0;
  if (contiguous >= 3) count = Math.min(contiguous, 5);
  else if (contiguous >= 1 && movedBeyond(contiguous)) count = Math.min(contiguous, 5);
  const chapters: string[] = [];
  const fragments: string[] = [];
  for (const ch of CHAPTERS) {
    if (ch.order > count) break;
    chapters.push(ch.id);
    fragments.push(ch.fragmentId);
  }
  return { chapters, fragments };
}

function mergeAudit(
  prev: LegacyMigrationAudit | undefined,
  patch: { at: number; fromVersion: number; reason: string; chapters: string[]; fragments: string[] },
): LegacyMigrationAudit {
  if (!prev) {
    return {
      at: patch.at,
      fromVersion: patch.fromVersion,
      reason: patch.reason,
      inheritedChapters: [...new Set(patch.chapters)],
      grantedFragments: [...new Set(patch.fragments)],
    };
  }
  return {
    ...prev,
    at: patch.at,
    reason: prev.reason.includes(patch.reason) ? prev.reason : prev.reason + '；' + patch.reason,
    inheritedChapters: [...new Set([...(prev.inheritedChapters || []), ...patch.chapters])],
    grantedFragments: [...new Set([...(prev.grantedFragments || []), ...patch.fragments])],
  };
}

/** 旧档/旧字段自愈：为已首胜的 Boss 补齐难度记录（视为 EASY 通关，不重复发奖） */
export function normalizeBossRecords(player: PlayerState): Record<string, BossRecord> {
  const states = chapterStatesOf(player);
  const out: Record<string, BossRecord> = {};
  for (const ch of CHAPTERS) {
    const bossId = ch.currentBossId;
    if (!bossId) continue;
    const defeated = states[ch.id].bossDefeated;
    if (!defeated) continue;
    const rec = bossRecordOf(player, bossId);
    const at = states[ch.id].bossFirstClearAt ?? 0;
    const cleared = { ...rec.cleared };
    if (!cleared.easy) {
      cleared.easy = { firstAt: at, lastAt: at, count: 1, rewarded: true };
    }
    out[bossId] = {
      firstDifficulty: rec.firstDifficulty || 'easy',
      bestDifficulty: bestDifficultyOf(rec.bestDifficulty, 'easy'),
      firstClearAt: rec.firstClearAt ?? at,
      cleared,
      bestGrade: rec.bestGrade,
    };
  }
  return out;
}

/**
 * 存档自愈 + 旧档继承（在 loadGame / importSave 的 normalize 阶段执行，不升存档版本）。
 * 返回的 PlayerState 一定包含完整的 chapters / originCore / bossRecords 字段。
 */
export function normalizeChapterProgress(player: PlayerState, fromVersion = 1): PlayerState {
  const raw = player.progress.chapters;
  const hasMap = !!raw && typeof raw === 'object';
  const states = chapterStatesOf(player);
  const fragments = safeArray<string>(player.meta.memoryFragments).slice();
  const fragmentLog = { ...(player.meta.fragmentLog || {}) };
  const now = Date.now();
  const inheritedChapters: string[] = [];
  const grantedFragments: string[] = [];

  if (!hasMap) {
    const plan = planLegacyInheritance(player);
    for (const ch of CHAPTERS) {
      if (!plan.chapters.includes(ch.id)) continue;
      if (states[ch.id].bossDefeated) continue;
      inheritedChapters.push(ch.id);
      states[ch.id] = {
        ...states[ch.id],
        bossDefeated: true,
        bossFirstClearAt: fragmentLog[ch.fragmentId] ?? 0,
        bossClearSource: 'legacy-inherit',
        fragmentId: ch.fragmentId,
        fragmentGrantedAt: fragmentLog[ch.fragmentId] ?? 0,
        completed: true,
        completedAt: 0,
        unlockedAt: 0,
      };
      if (!hasFragment(fragments, ch.fragmentId)) {
        fragments.push(ch.fragmentId);
        grantedFragments.push(ch.fragmentId);
      }
      if (typeof fragmentLog[ch.fragmentId] !== 'number') fragmentLog[ch.fragmentId] = 0;
    }
  }

  // 已有 Boss 首胜记录但碎片缺失：按记录补发（不伪装成新战斗）
  const backfilled: string[] = [];
  for (const ch of CHAPTERS) {
    if (!states[ch.id].bossDefeated) continue;
    if (!hasFragment(fragments, ch.fragmentId)) {
      fragments.push(ch.fragmentId);
      backfilled.push(ch.fragmentId);
      if (typeof fragmentLog[ch.fragmentId] !== 'number') {
        fragmentLog[ch.fragmentId] = states[ch.id].bossFirstClearAt ?? 0;
      }
    }
  }

  let audit = player.progress.migrationAudit;
  if (inheritedChapters.length > 0) {
    audit = mergeAudit(audit, {
      at: now,
      fromVersion,
      reason: '旧版本已完成章节但缺少 Boss 首胜字段：按历史进度继承并补齐碎片',
      chapters: inheritedChapters,
      fragments: grantedFragments,
    });
  }
  if (backfilled.length > 0) {
    audit = mergeAudit(audit, {
      at: now,
      fromVersion,
      reason: '存在 Boss 首胜记录但碎片缺失：按记录补发',
      chapters: [],
      fragments: backfilled,
    });
  }

  const originCore = player.progress.originCore || { enteredAt: null, clearedAt: null };
  const bossRecords = normalizeBossRecords({
    ...player,
    progress: { ...player.progress, chapters: states },
  });

  return {
    ...player,
    meta: {
      ...player.meta,
      memoryFragments: fragments,
      fragmentLog,
      memoryLogs: safeArray<string>(player.meta.memoryLogs),
    },
    progress: {
      ...player.progress,
      chapters: states,
      bossRecords,
      migrationAudit: audit,
      originCore,
    },
  };
}

// ---------- 剧情 / UI 辅助 ----------

export function chapterStatusOf(player: PlayerState, chapterId: string): ChapterRunStatus {
  return chapterGate(player, chapterId).status;
}

/** 下一章是否可以进入（不含旧档继承） */
export function nextChapterUnlocked(player: PlayerState, chapterId: string): boolean {
  const ch = chapterById(chapterId);
  if (!ch) return false;
  const next = nextChapterOf(ch);
  if (!next) return false;
  return chapterGate(player, next.id).unlocked;
}

export const MAINLINE_BOSS_IDS: string[] = CHAPTERS
  .map(c => c.currentBossId)
  .filter((x): x is string => typeof x === 'string' && x.length > 0);

/** Boss ↔ 碎片唯一绑定（自检/测试用） */
export function bossFragmentBinding(): { bossId: string; bossCodename: string; shardCode: string; fragmentId: string; title: string }[] {
  return CHAPTERS.map(ch => {
    const boss = ch.currentBossId ? bossById(ch.currentBossId) : undefined;
    return {
      bossId: ch.currentBossId || '',
      bossCodename: boss ? boss.codename : '',
      shardCode: ch.shardId,
      fragmentId: ch.fragmentId,
      title: shardTitleOf(ch.fragmentId),
    };
  });
}
