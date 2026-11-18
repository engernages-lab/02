import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { GameEvent, PlayerState, Screen, Toast, GameSettings } from '../game/types';
import { defaultState, exportSave, importSave, loadGame, saveGame, SAVE_VERSION } from '../services/save';
import { normalizeIdentity, validateDisplayName, ORIGIN_CODE, type PlayerIdentity } from '../game/identity';
import { normalizeStoryReadState, markNodeSeen, unlockEvent, recordChoice } from '../game/lore/events';
import { levelById, levelsOfServer } from '../game/levels';
import { levelForExp, toleranceFor } from '../game/progression';
import { recalcAchievements, achievementById } from '../game/achievements';
import { DEFENSE_TASKS } from '../game/defense';
import { bossById } from '../game/bosses';
import { createBattleState, normalizeBattleState, resolveSubmission, type BossBattleState, type SubmissionResult } from '../game/battle';
import { bossBattleDef, bossDifficulties } from '../game/bossDifficulties';
import { difficultyOf, type BossDifficulty } from '../game/difficulty';
import {
  handleBossFirstClear, chapterGate, canEnterServer, bossGate, originCoreGate, markOriginCoreEntered,
  recordBossDifficultyClear, bossRecordOf, verifyBattleState, type BossFirstClearPayload,
  type ChapterGate, type BossGate, type OriginCoreGate,
} from '../game/chapterFlow';
import type { VaultState, RunOutcomeShape } from '../game/types';
import { CREATOR_FRAGMENTS } from '../game/lore/fragments';
import { buildHarness, checkUserCode, combineWithHarness, judgeRun, type JudgeVerdict } from '../services/judge';
import { runPython } from '../services/pythonRunner';
import {
  normalizeRewards, shopItemById,
  chapterRewardOf, type RewardState, type RewardBreakdown, type Grade,
} from '../game/rewards';
import { computeLevelRewardV2, unlocksForLevel } from '../game/economy';
import { slotOf, skinMetaById } from '../game/cosmetics';
import { play, setVolumes, startMusic, stopMusic, isMusicOn } from '../services/sound';
import { clearAllDrafts } from '../services/drafts';
import {
  beginSession, createSession, countRun, countSubmit, countError, settle,
  buildPassedSettlement, buildFailedSettlement, normalizeSessions,
  type ChallengeSession, type ChallengeSettlement, type ChallengeKind,
} from '../game/challengeSession';
import { purchaseItem, useItem as applyUseItem, equipItemById, unequipSlot } from '../game/shopTx';
import type { ShopTransaction, EquipSlot } from '../game/shop';

function chapterIndexForServer(serverId: string): number {
  const map: Record<string, number> = { syntax: 1, logs: 2, storage: 3, factory: 4, diag: 5, core: 6 };
  return map[serverId] || 0;
}

/** 把当前关卡的进行中会话结算为失败（幂等：已结算的会话不再改动） */
function failedSessionsFor(p: PlayerState, levelId: string, reason: string, consciousnessLoss: number): Record<string, ChallengeSession> {
  const sessions = p.progress.challengeSessions || {};
  const cur = sessions[levelId];
  if (!cur || cur.status !== 'active') return sessions;
  const settlement = buildFailedSettlement(cur, {
    now: Date.now(),
    reason,
    levelNow: p.level,
    expNow: p.exp,
    consciousnessLoss,
  });
  return { ...sessions, [levelId]: settle(cur, settlement) };
}

/** Boss 通关：把进行中会话结算为通过（不改动战斗/奖励数据） */
function passedBossSessionsFor(p: PlayerState, bossId: string, expGain: number, creditsGain: number): Record<string, ChallengeSession> {
  const sessions = p.progress.challengeSessions || {};
  const cur = sessions[bossId];
  if (!cur || cur.status !== 'active') return sessions;
  const expBefore = Math.max(0, p.exp - Math.max(0, expGain));
  const settlement = buildPassedSettlement(cur, {
    now: Date.now(),
    levelBefore: levelForExp(expBefore),
    levelAfter: p.level,
    expBefore,
    expAfter: p.exp,
    creditsGained: creditsGain,
  });
  return { ...sessions, [bossId]: settle(cur, settlement) };
}

export interface CompletePayload {
  levelId: string;
  firstTime: boolean;
  expGained: number;
  levelUp: boolean;
  oldLevel: number;
  newLevel: number;
  stars: number;
  newAchievements: string[];
  /** 本次新解锁的外观（等级解锁） */
  unlocks?: string[];
  /** 奖励系统结算（旧调用方可忽略） */
  reward?: {
    breakdown: RewardBreakdown;
    fails: number;
    hints: number;
    creditsTotal: number;
    trustTotal: number;
    trustUp: boolean;
    chapterReward?: { id: string; title: string; desc: string; credits: number; skins: string[]; items: Record<string, number>; fragment?: string };
    duplicate: boolean;
  };
  /** 统一挑战会话结算（A4 起，结算面板的唯一数据源） */
  session?: ChallengeSettlement;
  /** A5：本次经验是否吃到增幅（true 时面板显示倍率） */
  expBoosted?: boolean;
  expBoostMult?: number;
}

export interface FailPayload { n: number; tolerance: number; triggered: boolean; protectedBy?: 'guard' | 'shield' }

/** Boss 攻击提交结果（由 store 统一执行真实 Python 判题 + 战斗结算 + 首胜事务） */
export type BossAttackStatus = 'blocked' | 'timeout' | 'error' | 'miss' | 'hit' | 'victory' | 'simulation' | 'simVictory';

export interface DifficultyClearInfo {
  difficulty: BossDifficulty;
  exp: number;
  credits: number;
  badgeId: string | null;
  titleUnlocked: string | null;
  firstTime: boolean;
}

export interface BossAttackResult {
  status: BossAttackStatus;
  /** 被门禁拒绝 / 安全策略阻止 / 首胜校验失败的原因 */
  reason?: string;
  denied?: boolean;
  run?: RunOutcomeShape;
  verdict?: JudgeVerdict;
  result?: SubmissionResult;
  /** 首次击败时由统一事务返回（幂等，只会出现一次） */
  firstClear?: BossFirstClearPayload | null;
  /** 模拟再战完成时返回（不发碎片/章节奖励） */
  difficultyClear?: DifficultyClearInfo | null;
  /** 本次是否触发 Boss 反击（意识下降） */
  countered?: boolean;
  toleranceTriggered?: boolean;
}

interface GameCtx {
  player: PlayerState;
  screen: Screen;
  event: GameEvent;
  toasts: Toast[];
  saveCorrupted: string | null;
  hasSave: boolean;
  tolerance: number;
  nav: (s: Screen) => void;
  toast: (kind: Toast['kind'], text: string) => void;
  startNewGame: () => void;
  setCurrentLevel: (id: string | null) => void;
  setCurrentBoss: (id: string | null) => void;
  completeBoss: (bossId: string) => BossFirstClearPayload | null;
  beginBossBattle: (bossId: string, difficulty?: BossDifficulty) => BossBattleState | null;
  /** 难度选择界面「开始挑战」：按所选难度重置整场战斗（已首胜则为模拟再战） */
  startBossBattle: (bossId: string, difficulty: BossDifficulty) => BossBattleState | null;
  /** 放弃当前进行中的战斗（只清战斗进度，不影响永久奖励），用于重新选择难度 */
  abandonBossBattle: (bossId: string) => void;
  /** 读取 Boss 难度记录（最高难度 / 各难度通关） */
  bossRecord: (bossId: string) => import('../game/types').BossRecord;
  /** 唯一的 Boss 攻击入口：真实判题 → 伤害 → 首胜事务 */
  submitBossAttack: (bossId: string, phaseIndex: number, code: string) => Promise<BossAttackResult>;
  /** 章节门禁（真实状态读取，所有正式入口共用） */
  chapterGateOf: (chapterId: string) => ChapterGate;
  /** 服务器入口门禁（旧档继承放行记录在 legacy 标记里） */
  serverGate: (serverId: string) => { ok: boolean; reason: string; legacy: boolean };
  /** Boss 入口门禁（含原初核心校验 / 模拟再战） */
  bossEntryGate: (bossId: string) => BossGate;
  /** 原初核心门禁（前五枚碎片校验） */
  originCoreGateNow: () => OriginCoreGate;
  recordBug: (entryId: string) => void;
  recordEnding: (endingId: string) => void;
  markVaultRead: (fragmentId: string) => void;
  markVaultFinalSeen: () => void;
  setVaultLastOpened: (id: string | null) => void;
  buyShopItem: (itemId: string) => { ok: boolean; reason?: string };
  /** A5 统一购买：数量/请求 id 由 UI 生成，价格与限购由业务层重新校验 */
  purchaseShopItem: (itemId: string, qty?: number, requestId?: string) => {
    ok: boolean; reason?: string; duplicate?: boolean; transaction?: ShopTransaction | null; charged?: number;
  };
  /** A5 使用道具（恢复意识 / 激活增益） */
  useShopItem: (itemId: string) => { ok: boolean; reason?: string; message?: string };
  equipItem: (itemId: string) => { ok: boolean; reason?: string };
  unequipItem: (slot: EquipSlot) => { ok: boolean; reason?: string };
  /** 挑战页提示：消耗提示券，不计入本关提示层数 */
  consumeHintTicket: () => boolean;
  consumeItem: (itemId: string) => boolean;
  restoreConsciousness: (amount: number) => void;
  markArchiveRead: (archiveId: string) => void;
  completeLevel: (levelId: string) => CompletePayload | null;
  recordFail: (levelId: string) => FailPayload;
  /** 进入/恢复一次挑战会话（进行中的会话保留统计；已结算的会新开） */
  beginChallenge: (id: string, kind?: ChallengeKind) => ChallengeSession;
  /** 预览运行一次（只影响本会话的运行次数） */
  recordRun: (id: string) => void;
  /** 正式提交一次（只影响本会话的提交次数） */
  recordSubmit: (id: string) => void;
  resetAttempts: (levelId: string) => void;
  hintUsed: (levelId: string) => number;
  resolveDefense: (ok: boolean) => void;
  finishRebirth: () => void;
  startDeath: (levelId: string, reason: string, consciousnessLoss?: number) => void;
  decrementAttackAttempt: () => void;
  triggerPendingDeath: () => void;
  wipeSave: () => void;
  markStory: (id: string) => void;
  unlockStoryEvent: (eventId: string) => void;
  recordStoryChoice: (nodeId: string, label: string) => void;
  renamePlayer: (raw: string) => { ok: boolean; reason?: string; name?: string };
  addKnowledge: (ids: string[]) => void;
  setFlag: (key: string, value: boolean | number) => void;
  patchSettings: (patch: Partial<GameSettings>) => void;
  importSaveData: (text: string) => { ok: boolean; reason?: string };
  exportSaveString: () => string;
  respawnTick: number;
  toggleMusic: () => void;
}

const Ctx = createContext<GameCtx | null>(null);

let toastSeq = 1;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [boot] = useState(() => loadGame());
  const [player, setPlayer] = useState<PlayerState>(() => boot.state);
  const [screen, setScreen] = useState<Screen>('boot');
  const [event, setEvent] = useState<GameEvent>({ kind: 'none' });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saveCorrupted] = useState<string | null>(boot.corrupted || null);
  const [hasSave, setHasSave] = useState<boolean>(!boot.fresh);
  const [respawnTick, setRespawnTick] = useState(0);
  const playerRef = useRef(player);
  playerRef.current = player;
  const eventRef = useRef(event);
  eventRef.current = event;
  // 死亡流程的稳定引用（Boss 反击在 startDeath 定义之前就需要调用它）
  const startDeathRef = useRef<(levelId: string, reason: string, consciousnessLoss?: number) => void>(() => {});

  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = toastSeq++;
    setToasts(t => [...t.slice(-4), { id, kind, text }]);
    window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4600);
  }, []);

  // 旧存档迁移提示（只提示一次，不打断游戏）
  useEffect(() => {
    if (boot.migrated && boot.notes && boot.notes.length > 0) {
      toast('info', '存档已自动迁移：v' + (boot.fromVersion || 1) + ' → v' + SAVE_VERSION + '（进度、等级、成就均已保留）');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 持久化
  useEffect(() => { saveGame(player); }, [player]);
  useEffect(() => {
    const h = () => saveGame(playerRef.current);
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  const nav = useCallback((s: Screen) => setScreen(s), []);

  // 设置联动
  useEffect(() => {
    setVolumes(player.settings.sfxVolume, player.settings.musicVolume);
    if (isMusicOn() && player.settings.musicVolume <= 0) stopMusic();
  }, [player.settings]);

  useEffect(() => {
    if (player.settings.fullscreen) {
      if (typeof document.fullscreenElement !== 'undefined' && !document.fullscreenElement &&
          typeof document.documentElement.requestFullscreen === 'function') {
        document.documentElement.requestFullscreen().catch(() => { /* 浏览器可能拒绝 */ });
      }
    } else if (typeof document.exitFullscreen === 'function' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* ignore */ });
    }
  }, [player.settings.fullscreen]);

  const toggleMusic = useCallback(() => {
    if (isMusicOn()) stopMusic();
    else startMusic();
  }, []);

  // ---------- 玩家操作 ----------
  const startNewGame = useCallback(() => {
    setPlayer(defaultState());
    setHasSave(true);
    setScreen('story');
  }, []);

  const setCurrentLevel = useCallback((id: string | null) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, currentLevelId: id } }));
  }, []);

  const setCurrentBoss = useCallback((id: string | null) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, currentBossId: id } }));
  }, []);

  /**
   * 同步提交：立即用最新状态计算并写入，同时更新 playerRef。
   * Boss 战需要在同一次交互里「扣血 → 校验 → 首胜事务」，不能依赖异步 state 队列。
   */
  const commitPlayer = useCallback((updater: (p: PlayerState) => PlayerState): PlayerState => {
    const next = updater(playerRef.current);
    playerRef.current = next;
    setPlayer(next);
    return next;
  }, []);

  /**
   * 统一 Boss 首胜处理入口（六个 Boss 共用，事务式 + 幂等）。
   * 真实胜利校验、碎片发放、章节完成、下一章解锁全部由 chapterFlow 完成；
   * 任何 UI 组件都不得自行发放碎片或解锁章节。
   */
  const completeBoss = useCallback((bossId: string): BossFirstClearPayload | null => {
    const cur = playerRef.current;
    const r = handleBossFirstClear(cur, bossId);
    if (!r.changed || !r.payload) return null;
    playerRef.current = r.player;
    setPlayer(r.player);
    if (r.payload.credits > 0) {
      toast('achieve', '章节奖励：+' + r.payload.credits + ' 贡献点（' + (r.payload.unlocks[0] || '') + '）');
    }
    return r.payload;
  }, [toast]);


  // ---------- Boss 战 ----------
  /**
   * 进入战斗：
   * - 未首胜：必须在真实门禁内（章节已开放 + 普通关卡完成 + 原初核心校验）；
   * - 已首胜：进入「模拟再战」，不复用旧血量，但绝不改动 bossesDone / 碎片 / 章节状态。
   * - 已有进行中的战斗：保留该难度（难度锁定），传别的难度会被拒绝。
   */
  const beginBossBattle = useCallback((bossId: string, difficulty: BossDifficulty = 'easy'): BossBattleState | null => {
    const wanted = difficultyOf(difficulty);
    const def = bossBattleDef(bossId, wanted);
    if (!def) return null;
    const cur = playerRef.current;
    const gate = bossGate(cur, bossId);
    if (!gate.available && !gate.simulation) return null;

    const raw = (cur.progress.battles || {})[bossId];
    const existingDiff = raw && typeof raw === 'object' ? difficultyOf((raw as { difficulty?: unknown }).difficulty) : null;
    const normalized = raw ? normalizeBattleState(raw, bossBattleDef(bossId, existingDiff || 'easy') || def) : null;
    const inProgress = !!normalized && !normalized.cleared && normalized.started;
    if (normalized && inProgress && existingDiff && existingDiff !== wanted) {
      // 本次挑战难度已锁定
      return null;
    }

    if (gate.simulation) {
      const fresh = createBattleState(def);
      commitPlayer(p => ({
        ...p,
        progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: fresh } },
      }));
      return fresh;
    }

    const existing = normalizeBattleState(raw, def);
    if (!raw || existing.difficulty !== wanted) {
      commitPlayer(p => ({
        ...p,
        progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: existing } },
      }));
    }
    if (bossId === 'k0') commitPlayer(p => markOriginCoreEntered(p));
    return existing;
  }, [commitPlayer]);

  /** 难度选择界面「开始挑战」：锁定所选难度并重置本场战斗 */
  const startBossBattle = useCallback((bossId: string, difficulty: BossDifficulty): BossBattleState | null => {
    const diff = difficultyOf(difficulty);
    const def = bossBattleDef(bossId, diff);
    if (!def) return null;
    const allowed = bossDifficulties(bossId);
    if (!allowed.includes(diff)) return null;
    const gate = bossGate(playerRef.current, bossId);
    if (!gate.available && !gate.simulation) return null;
    const fresh = { ...createBattleState(def), started: true };
    const next = commitPlayer(p => ({
      ...p,
      progress: {
        ...p.progress,
        battles: { ...(p.progress.battles || {}), [bossId]: fresh },
        challengeSessions: normalizeSessions({
          ...(p.progress.challengeSessions || {}),
          [bossId]: beginSession(p.progress.challengeSessions?.[bossId] || null, bossId, 'boss', Date.now(), toleranceFor(p.level)),
        }),
      },
    }));
    if (bossId === 'k0') commitPlayer(p => markOriginCoreEntered(p));
    return normalizeBattleState((next.progress.battles || {})[bossId], def);
  }, [commitPlayer]);

  /** 放弃当前进行中的战斗（只清战斗进度，不影响永久奖励） */
  const abandonBossBattle = useCallback((bossId: string) => {
    commitPlayer(p => {
      const battles = { ...(p.progress.battles || {}) };
      delete battles[bossId];
      return { ...p, progress: { ...p.progress, battles } };
    });
  }, [commitPlayer]);

  /** 判题没有造成伤害 → Boss 反击：意识值下降，失败次数 +1；意识归零走既有死亡流程 */
  const bossCounterAttack = useCallback((bossId: string, amount: number) => {
    const cur = playerRef.current;
    const raw = (cur.progress.battles || {})[bossId];
    const def = bossBattleDef(bossId, difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined));
    if (!def) return;
    let death = false;
    let lost = 0;
    commitPlayer(p => {
      const b = normalizeBattleState((p.progress.battles || {})[bossId], def);
      const rwB = normalizeRewards(p.rewards);
      const barrier = rwB.buffs.barrier > 0;
      const dmg = barrier ? Math.ceil(Math.max(0, amount) / 2) : Math.max(0, amount);
      const c = Math.max(0, p.consciousness - dmg);
      const next: PlayerState = {
        ...p,
        consciousness: c,
        rewards: barrier ? { ...rwB, buffs: { ...rwB.buffs, barrier: rwB.buffs.barrier - 1 } } : p.rewards,
        progress: {
          ...p.progress,
          battles: { ...(p.progress.battles || {}), [bossId]: { ...b, failures: b.failures + 1, updatedAt: Date.now() } },
        },
      };
      if (c <= 0) {
        death = true;
        lost = Math.max(0, p.consciousness);
        next.progress = {
          ...next.progress,
          battles: { ...(next.progress.battles || {}), [bossId]: createBattleState(def) },
        };
      }
      return next;
    });
    if (death) startDeathRef.current(bossId, '被 ' + (def.bossId.toUpperCase()) + ' 反击击穿', lost);
  }, [commitPlayer]);

  /** Bug 图鉴：记录一次错误遭遇（同一条目累计次数） */
  const recordBug = useCallback((entryId: string) => {
    if (!entryId) return;
    setPlayer(p => {
      const log = { ...(p.meta.bugCodex || {}) };
      const cur = log[entryId];
      log[entryId] = { count: (cur?.count || 0) + 1, firstAt: cur?.firstAt || Date.now() };
      return { ...p, meta: { ...p.meta, bugCodex: log } };
    });
  }, []);

  /** 结局档案：记录已解锁结局（幂等） */
  const recordEnding = useCallback((endingId: string) => {
    if (!endingId) return;
    setPlayer(p => {
      const list = p.progress.endings || [];
      const nextList = list.includes(endingId) ? list : [...list, endingId];
      return { ...p, progress: { ...p.progress, endings: nextList, ending: endingId } };
    });
  }, []);

  // ---------- 记忆档案馆 ----------
  const normalizeVault = (v: VaultState | undefined): VaultState => ({
    read: Array.isArray(v?.read) ? [...v.read] : [],
    finalSeen: v?.finalSeen === true,
    lastOpened: typeof v?.lastOpened === 'string' ? v.lastOpened : null,
  });

  /** 查看某枚碎片：记录已读 + 上次打开位置（关闭页面后可恢复） */
  const markVaultRead = useCallback((fragmentId: string) => {
    if (!fragmentId) return;
    setPlayer(p => {
      const v = normalizeVault(p.progress.vault);
      if (v.read.includes(fragmentId) && v.lastOpened === fragmentId) return p;
      return {
        ...p,
        progress: {
          ...p.progress,
          vault: { ...v, read: v.read.includes(fragmentId) ? v.read : [...v.read, fragmentId], lastOpened: fragmentId },
        },
      };
    });
  }, []);

  const markVaultFinalSeen = useCallback(() => {
    setPlayer(p => {
      const v = normalizeVault(p.progress.vault);
      if (v.finalSeen) return p;
      return { ...p, progress: { ...p.progress, vault: { ...v, finalSeen: true } } };
    });
  }, []);

  const setVaultLastOpened = useCallback((id: string | null) => {
    setPlayer(p => {
      const v = normalizeVault(p.progress.vault);
      if (v.lastOpened === id) return p;
      return { ...p, progress: { ...p.progress, vault: { ...v, lastOpened: id } } };
    });
  }, []);

  /** A5 统一购买事务：价格/限购/余额由商品目录与纯逻辑层重新校验 */
  const purchaseShopItem = useCallback((itemId: string, qty = 1, requestId?: string) => {
    const rid = requestId || 'rq-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    const res = purchaseItem(playerRef.current, itemId, qty, rid);
    if (res.player !== playerRef.current) {
      playerRef.current = res.player;
      setPlayer(res.player);
    }
    if (!res.ok) {
      toast('warn', res.reason || '购买失败');
      play('deny');
      return { ok: false, reason: res.reason, transaction: res.transaction as ShopTransaction | null };
    }
    if (res.duplicate) return { ok: true, duplicate: true };
    toast('achieve', '交易完成：' + (res.transaction?.itemName || itemId) + ' ×' + (res.transaction?.qty || qty) + '（-' + res.charged + ' 贡献点）');
    play('success');
    return { ok: true, transaction: res.transaction as ShopTransaction | null, charged: res.charged };
  }, [toast]);

  /** 兼容旧调用：买 1 件 */
  const buyShopItem = useCallback((itemId: string): { ok: boolean; reason?: string } => {
    const r = purchaseShopItem(itemId, 1);
    return { ok: r.ok, reason: r.reason };
  }, [purchaseShopItem]);

  /** A5 使用道具：恢复意识 / 激活增益，条件与上限在这里统一校验 */
  const useShopItem = useCallback((itemId: string) => {
    const res = applyUseItem(playerRef.current, itemId);
    if (!res.ok) {
      toast('warn', res.reason || '无法使用');
      play('deny');
      return { ok: false, reason: res.reason };
    }
    playerRef.current = res.player;
    setPlayer(res.player);
    toast('success', res.message || '已使用');
    play('success');
    return { ok: true, message: res.message };
  }, [toast]);

  /** 装备外观 */
  const equipItem = useCallback((itemId: string): { ok: boolean; reason?: string } => {
    const res = equipItemById(playerRef.current, itemId);
    if (!res.ok) return { ok: false, reason: res.reason };
    playerRef.current = res.player;
    setPlayer(res.player);
    toast('success', res.message || '已装备');
    play('click');
    return { ok: true };
  }, [toast]);

  /** 卸下某个装备槽 */
  const unequipItem = useCallback((slot: EquipSlot): { ok: boolean; reason?: string } => {
    const res = unequipSlot(playerRef.current, slot);
    if (!res.ok) return { ok: false, reason: res.reason };
    playerRef.current = res.player;
    setPlayer(res.player);
    toast('success', res.message || '已卸下');
    play('click');
    return { ok: true };
  }, [toast]);

  /** 挑战页请求提示：优先消耗提示券（不计入本关提示层数） */
  const consumeHintTicket = useCallback((): boolean => {
    const rw = normalizeRewards(playerRef.current.rewards);
    if (rw.buffs.hintTicket <= 0) return false;
    commitPlayer(p => {
      const cur = normalizeRewards(p.rewards);
      if (cur.buffs.hintTicket <= 0) return p;
      return { ...p, rewards: { ...cur, buffs: { ...cur.buffs, hintTicket: cur.buffs.hintTicket - 1 } } };
    });
    return true;
  }, [commitPlayer]);

  /** 消耗一个道具（挑战页的扫描器 / 回滚 / 解码器沿用） */
  const consumeItem = useCallback((itemId: string): boolean => {
    const cur = playerRef.current;
    const rw = normalizeRewards(cur.rewards);
    const have = rw.items[itemId] || 0;
    if (have <= 0) return false;
    const items = { ...rw.items, [itemId]: have - 1 };
    setPlayer(p => ({ ...p, rewards: { ...normalizeRewards(p.rewards), items } }));
    return true;
  }, []);

  /** 意识稳定模块 */
  const restoreConsciousness = useCallback((amount: number) => {
    setPlayer(p => ({ ...p, consciousness: Math.min(100, p.consciousness + amount) }));
    play('success');
  }, []);

  /** 标记记忆档案已读 */
  const markArchiveRead = useCallback((archiveId: string) => {
    setPlayer(p => {
      const rw = normalizeRewards(p.rewards);
      if (rw.archiveRead.includes(archiveId)) return p;
      return { ...p, rewards: { ...rw, archiveRead: [...rw.archiveRead, archiveId] } };
    });
  }, []);

  const setFlag = useCallback((key: string, value: boolean | number) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, flags: { ...p.progress.flags, [key]: value } } }));
  }, []);

  /** 记录对话节点已读：旧字段 storySeen（布尔）+ 新字段 story.seen（次数）双写 */
  const markStory = useCallback((id: string) => {
    if (!id) return;
    setPlayer(p => {
      const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
      const nextStory = markNodeSeen(story, id);
      const storySeen = p.progress.storySeen[id] ? p.progress.storySeen : { ...p.progress.storySeen, [id]: true };
      return { ...p, progress: { ...p.progress, storySeen, story: nextStory } };
    });
  }, []);

  /** 解锁剧情事件（幂等，不重复写入） */
  const unlockStoryEvent = useCallback((eventId: string) => {
    if (!eventId) return;
    setPlayer(p => {
      const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
      if (story.unlocked.includes(eventId)) return p;
      return { ...p, progress: { ...p.progress, story: unlockEvent(story, eventId) } };
    });
  }, []);

  /** 记录剧情分支选择（同一节点保留最新选择） */
  const recordStoryChoice = useCallback((nodeId: string, label: string) => {
    if (!nodeId || !label) return;
    setPlayer(p => {
      const story = normalizeStoryReadState(p.progress.story, p.progress.storySeen);
      return { ...p, progress: { ...p.progress, story: recordChoice(story, nodeId, label) } };
    });
  }, []);

  /**
   * 修改玩家显示名称。
   * 规范：只改显示名，原始实验编号 R-07 永远不变（identity.originCode 由 normalizeIdentity 强制）。
   */
  const renamePlayer = useCallback((raw: string): { ok: boolean; reason?: string; name?: string } => {
    const v = validateDisplayName(raw);
    if (!v.ok) return { ok: false, reason: v.reason };
    const cur = playerRef.current;
    const base = normalizeIdentity(cur.identity, cur.name);
    const identity: PlayerIdentity = {
      ...base,
      displayName: v.name,
      originCode: ORIGIN_CODE,
      renamed: v.name !== ORIGIN_CODE,
    };
    setPlayer(p => ({ ...p, name: v.name, identity }));
    toast('success', '显示名称已更新为「' + v.name + '」');
    play('success');
    return { ok: true, name: v.name };
  }, [toast]);

  const addKnowledge = useCallback((ids: string[]) => {
    setPlayer(p => {
      const merged = [...new Set([...p.progress.knowledge, ...ids])];
      return { ...p, progress: { ...p.progress, knowledge: merged } };
    });
  }, []);

  const hintUsed = useCallback((levelId: string): number => {
    const cur = playerRef.current.progress.hintLevels[levelId] || 0;
    setPlayer(p => ({
      ...p,
      progress: { ...p.progress, hintLevels: { ...p.progress.hintLevels, [levelId]: cur + 1 } },
    }));
    return cur;
  }, []);

  const resetAttempts = useCallback((levelId: string) => {
    setPlayer(p => ({
      ...p,
      progress: { ...p.progress, failedAttempts: { ...p.progress.failedAttempts, [levelId]: 0 } },
    }));
  }, []);

  /** 进入/恢复一次挑战会话（进行中保留统计；已结算则新开） */
  const beginChallenge = useCallback((id: string, kind: ChallengeKind = 'level'): ChallengeSession => {
    const prev = playerRef.current;
    const existing = prev.progress.challengeSessions?.[id] || null;
    const s = beginSession(existing, id, kind, Date.now(), toleranceFor(prev.level));
    if (existing && existing.id === s.id && existing.status === 'active') return existing;
    commitPlayer(p => ({
      ...p,
      progress: {
        ...p.progress,
        challengeSessions: normalizeSessions({ ...(p.progress.challengeSessions || {}), [id]: s }),
      },
    }));
    return s;
  }, [commitPlayer]);

  const updateSession = useCallback((id: string, fn: (s: ChallengeSession) => ChallengeSession) => {
    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const cur = sessions[id];
      if (!cur) return p;
      const nextS = fn(cur);
      if (nextS === cur) return p;
      return { ...p, progress: { ...p.progress, challengeSessions: { ...sessions, [id]: nextS } } };
    });
  }, [commitPlayer]);

  const recordRun = useCallback((id: string) => updateSession(id, countRun), [updateSession]);
  const recordSubmit = useCallback((id: string) => updateSession(id, countSubmit), [updateSession]);

  /** 通关：经验、星级、知识卡片、关卡/服务器解锁、成就、升级 */
  const completeLevel = useCallback((levelId: string): CompletePayload | null => {
    const level = levelById(levelId);
    if (!level) return null;
    const prev = playerRef.current;
    // 入口门禁：关卡所在章节必须已开放（旧档继承放行由 canEnterServer 统一处理）
    const serverGate = canEnterServer(prev, level.serverId);
    if (!serverGate.ok) return null;
    const firstTime = !prev.progress.completedLevels.includes(levelId);
    // 同一会话只允许结算一次：重复提交/重复触发结算不会重复发奖
    const activeSession = prev.progress.challengeSessions?.[levelId];
    if (activeSession && activeSession.status === 'passed') return null;
    const att = prev.progress.failedAttempts[levelId] || 0;
    const stars = att === 0 ? 3 : att === 1 ? 2 : 1;
    const prevStars = prev.progress.stars[levelId] || 0;
    const oldLevel = prev.level;

    const completed = prev.progress.completedLevels.includes(levelId)
      ? prev.progress.completedLevels
      : [...prev.progress.completedLevels, levelId];
    const knowledge = [...new Set([...prev.progress.knowledge, ...level.knowledge])];
    // A5 经验增幅：只在首次通关时生效，按配置倍率结算并消耗 1 次
    const boostRw = normalizeRewards(prev.rewards);
    const expBoost = firstTime && boostRw.buffs.expBoost && boostRw.buffs.expBoost.uses > 0 ? boostRw.buffs.expBoost : null;
    const expGain = firstTime ? Math.round(level.rewardExp * (expBoost ? expBoost.mult : 1)) : 0;
    const nextExp = prev.exp + expGain;
    const next: PlayerState = {
      ...prev,
      exp: nextExp,
      level: levelForExp(nextExp),
      progress: {
        ...prev.progress,
        completedLevels: completed,
        stars: { ...prev.progress.stars, [levelId]: Math.max(prevStars, stars) },
        knowledge,
        failedAttempts: { ...prev.progress.failedAttempts, [levelId]: 0 },
        flags: { ...prev.progress.flags },
      },
    };
    if (att > 0) next.progress.flags.chapter1ZeroFail = false;
    if (level.serverId === 'syntax' && att === 0 && next.progress.flags.chapter1ZeroFail !== false) {
      next.progress.flags.chapter1ZeroFail = true;
    }
    // 训练终端完成 → 开放语法维修站（新手五个修复端）
    if (level.id === 'tut-1' && !next.progress.unlockedServers.includes('syntax')) {
      next.progress.unlockedServers = [...next.progress.unlockedServers, 'syntax'];
    }
    // 服务器解锁 + 章节完成标记
    const siblings = levelsOfServer(level.serverId);
    const serverDone = siblings.length > 0 && siblings.every(l => next.progress.completedLevels.includes(l.id));
    if (serverDone && !next.progress.unlockedServers.includes(level.serverId)) {
      next.progress.unlockedServers = [...next.progress.unlockedServers, level.serverId];
    }
    // 章节关卡完成标记：只记录「本章普通关卡全通」（Boss 是否必经由 chapterFlow 判定）
    // 注意：这里绝不解锁下一章、绝不发放创世主碎片——二者只能由 Boss 首胜统一事务产生。
    if (level.serverId === 'syntax' && serverDone) {
      next.progress.flags.chapter1Done = true;
    }
    if (level.serverId === 'logs' && serverDone) {
      next.progress.flags.chapter2Done = true;
    }
    if (level.serverId === 'storage' && serverDone) {
      next.progress.flags.chapter3Done = true;
    }
    if (level.serverId === 'factory' && serverDone) {
      // 第四章完成：核心机房溢出信号，但最高权限封锁保持
      next.progress.flags.chapter4Done = true;
    }
    if (level.serverId === 'diag' && serverDone) {
      // 第五章完成：核心机房封锁开始解除（第六章入口仍需 ENTROPY 首胜 + 五枚碎片）
      next.progress.flags.chapter5Done = true;
    }
    // 终章普通关卡完成只代表外围修复完成：chapter6Done / 第六枚碎片只由 K-0 首胜写入
    const newAch = recalcAchievements(next);
    const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
    next.progress.achievements = newAch;
    // ---------- 奖励系统结算（与经验/等级并行，互不覆盖；仅在真实判题通过时执行） ----------
    const prevRewards = normalizeRewards(prev.rewards);
    const hintsUsed = prev.progress.hintLevels[levelId] || 0;
    const alreadyCleared = !!prevRewards.cleared[levelId];
    const v2 = computeLevelRewardV2({
      levelExp: level.rewardExp,
      fails: att,
      hints: hintsUsed,
      firstClear: !alreadyCleared,
      prevStars,
      newStars: stars,
    });
    const breakdown: RewardBreakdown = {
      grade: v2.grade,
      base: v2.base,
      firstClear: v2.firstClearBonus,
      noFail: v2.noFail,
      noHint: v2.noHint,
      gradeBonus: v2.gradeBonus,
      improvement: v2.improvement,
      total: v2.total,
      trustGain: v2.trustGain,
    };
    const rewards: RewardState = {
      ...prevRewards,
      credits: prevRewards.credits + breakdown.total,
      trust: Math.min(100, prevRewards.trust + breakdown.trustGain),
      cleared: {
        ...prevRewards.cleared,
        [levelId]: { grade: breakdown.grade as Grade, fails: att, hints: hintsUsed, credits: breakdown.total, trust: breakdown.trustGain },
      },
      skins: [...prevRewards.skins],
      items: { ...prevRewards.items },
      chapterRewards: [...prevRewards.chapterRewards],
    };
    if (expBoost) {
      const uses = Math.max(0, expBoost.uses - 1);
      rewards.buffs = { ...prevRewards.buffs, expBoost: uses > 0 ? { ...expBoost, uses } : null };
    }

    // 章节奖励：整章通关时发放一次（幂等）
    let chapterRewardPayload: NonNullable<CompletePayload['reward']>['chapterReward'] = undefined;
    const chapterDef = chapterRewardOf(chapterIndexForServer(level.serverId));
    const serverDoneAfter = siblings.length > 0 && siblings.every(l => next.progress.completedLevels.includes(l.id));
    if (chapterDef && serverDoneAfter && !rewards.chapterRewards.includes(chapterDef.id)) {
      rewards.chapterRewards.push(chapterDef.id);
      rewards.credits += chapterDef.credits;
      if (chapterDef.skins && chapterDef.skins.length) rewards.skins = [...new Set([...rewards.skins, ...chapterDef.skins])];
      if (chapterDef.items) {
        for (const [k, v] of Object.entries(chapterDef.items)) rewards.items[k] = (rewards.items[k] || 0) + v;
      }
      if (chapterDef.fragment &&
          !CREATOR_FRAGMENTS.some(f => f.id === chapterDef.fragment) &&
          !next.meta.memoryFragments.includes(chapterDef.fragment)) {
        // 章节奖励只允许非主线的档案残片（f8 等）；创世主六碎片只能由 Boss 首胜发放
        next.meta.memoryFragments = [...next.meta.memoryFragments, chapterDef.fragment];
      }
      chapterRewardPayload = {
        id: chapterDef.id, title: chapterDef.title, desc: chapterDef.desc,
        credits: chapterDef.credits, skins: chapterDef.skins || [], items: chapterDef.items || {},
        fragment: chapterDef.fragment,
      };
    }
    // 等级解锁：称号 / 头像框 / 粒子（升级时发放并自动装备）
    const unlockNames: string[] = [];
    for (const u of unlocksForLevel(oldLevel, next.level)) {
      if (rewards.skins.includes(u.id)) continue;
      rewards.skins = [...rewards.skins, u.id];
      rewards.unlocks = [...(rewards.unlocks || []), u.id];
      if (u.slot) rewards.equipped = { ...rewards.equipped, [u.slot]: u.id };
      unlockNames.push(u.name);
    }

    // ---------- 统一挑战会话结算（A4）：成功结算的唯一数据源 ----------
    const settleNow = Date.now();
    const sessionBase = activeSession ?? { ...createSession(levelId, 'level', settleNow, toleranceFor(oldLevel)), errors: att };
    const settlement = buildPassedSettlement(sessionBase, {
      now: settleNow,
      levelBefore: oldLevel,
      levelAfter: next.level,
      expBefore: prev.exp,
      expAfter: next.exp,
      creditsGained: breakdown.total + (chapterRewardPayload?.credits || 0),
    });
    next.progress.challengeSessions = normalizeSessions({
      ...(prev.progress.challengeSessions || {}),
      [levelId]: settle(sessionBase, settlement),
    });

    next.rewards = rewards;

    setPlayer(next);
    unlockNames.forEach(n => toast('achieve', '等级解锁：' + n));
    if (chapterRewardPayload) {
      toast('achieve', '章节奖励：' + chapterRewardPayload.title + '（+' + chapterRewardPayload.credits + ' 贡献点）');
      play('unlock');
    }

    gained.forEach(id => {
      const def = achievementById(id);
      if (def) toast('achieve', '成就解锁：' + def.name + (def.hidden ? '（隐藏）' : ''));
    });
    if (next.level > oldLevel) play('levelup'); else if (firstTime) play('success');
    return {
      levelId,
      firstTime,
      expGained: expGain,
      expBoosted: !!expBoost,
      expBoostMult: expBoost ? expBoost.mult : undefined,
      levelUp: next.level > oldLevel,
      oldLevel,
      newLevel: next.level,
      stars,
      newAchievements: gained,
      unlocks: unlockNames,
      session: settlement,
      reward: {
        breakdown,
        fails: att,
        hints: hintsUsed,
        creditsTotal: rewards.credits,
        trustTotal: rewards.trust,
        trustUp: rewards.trust > prevRewards.trust,
        chapterReward: chapterRewardPayload,
        duplicate: alreadyCleared,
      },
    };
  }, [toast]);

  /** 正式提交失败：计数 +1；超过容错时优先消耗护符/护盾，否则触发纠错者攻击 */
  const recordFail = useCallback((levelId: string): FailPayload => {
    if (eventRef.current.kind !== 'none') return { n: 0, tolerance: 0, triggered: false };
    const prev = playerRef.current;
    const n = (prev.progress.failedAttempts[levelId] || 0) + 1;
    const tol = toleranceFor(prev.level);
    let protectedBy: 'guard' | 'shield' | undefined;

    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const cur = sessions[levelId];
      const rw = normalizeRewards(p.rewards);
      let fails = n;
      let buffs = rw.buffs;
      if (n > tol) {
        if (rw.buffs.guard > 0) { protectedBy = 'guard'; buffs = { ...rw.buffs, guard: rw.buffs.guard - 1 }; fails = 0; }
        else if (rw.buffs.shield > 0) { protectedBy = 'shield'; buffs = { ...rw.buffs, shield: rw.buffs.shield - 1 }; fails = 0; }
      }
      return {
        ...p,
        rewards: { ...rw, buffs },
        progress: {
          ...p.progress,
          failedAttempts: { ...p.progress.failedAttempts, [levelId]: fails },
          // 会话 errors 与 failedAttempts 同源；防护生效时按「防御成功」语义清零
          challengeSessions: cur
            ? { ...sessions, [levelId]: protectedBy ? { ...cur, errors: 0 } : countError(cur) }
            : sessions,
        },
      };
    });

    if (protectedBy) {
      toast('success', protectedBy === 'guard'
        ? '容错护符生效：这次攻击被挡下，本关失误计数已清零'
        : '护盾核心生效：攻击被自动拦截，本关失误计数已清零');
      play('shield');
      return { n, tolerance: tol, triggered: false, protectedBy };
    }
    if (n > tol) {
      const pool = DEFENSE_TASKS.map(t => t.id);
      const defenseId = pool[Math.floor(Math.random() * pool.length)];
      setEvent({ kind: 'attack', levelId, defenseId, attemptsLeft: 2 });
      play('threat');
      return { n, tolerance: tol, triggered: true };
    }
    return { n, tolerance: tol, triggered: false };
  }, [commitPlayer, toast]);

  /**
   * 唯一的 Boss 攻击入口。
   * UI 只能提交「用户代码」，真实 Python 执行、判题、伤害结算、首胜事务全部在这里完成：
   * 前端无法通过传入血量 / 掩码 / 胜利标记绕过主线条件。
   */
  const submitBossAttack = useCallback(async (
    bossId: string,
    phaseIndex: number,
    code: string,
  ): Promise<BossAttackResult> => {
    const cur = playerRef.current;
    const raw = (cur.progress.battles || {})[bossId];
    const difficulty = difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined);
    const def = bossBattleDef(bossId, difficulty);
    const boss = bossById(bossId);
    if (!def || !boss) return { status: 'blocked', reason: '战斗数据缺失' };
    if (!raw || typeof raw !== 'object') return { status: 'blocked', reason: '请先选择挑战难度' };

    const gate = bossGate(cur, bossId);
    if (!gate.available && !gate.simulation) return { status: 'blocked', reason: gate.reason };
    const simulation = gate.simulation;

    const ck = checkUserCode(code);
    if (!ck.allowed) return { status: 'blocked', reason: '安全策略阻止：' + ck.reason, denied: true };

    // Boss 与普通关卡共用同一套会话计数：每次攻击 = 一次提交 + 一次运行
    commitPlayer(p => {
      const sessions = p.progress.challengeSessions || {};
      const base = beginSession(sessions[bossId] || null, bossId, 'boss', Date.now(), toleranceFor(p.level));
      return {
        ...p,
        progress: { ...p.progress, challengeSessions: { ...sessions, [bossId]: countRun(countSubmit(base)) } },
      };
    });

    const phase = def.phases[Math.max(0, Math.min(phaseIndex, def.phases.length - 1))];
    const combined = phase.judge.judgeKind === 'python'
      ? combineWithHarness(code, buildHarness(phase.judge.pythonChecks || []))
      : code;

    const state = normalizeBattleState(raw, def);
    if (Math.min(state.phase, def.phases.length - 1) !== phaseIndex) {
      return { status: 'blocked', reason: '阶段不同步，请刷新战斗界面' };
    }

    const r = await runPython(combined, { timeoutMs: 5000 });
    if (r.timedOut || !r.ok) {
      if (!simulation) {
        recordFail(bossId);
        bossCounterAttack(bossId, def.counterDamage);
      }
      const verdict: JudgeVerdict = { passed: false, checks: [], error: r.error, timedOut: r.timedOut };
      return { status: r.timedOut ? 'timeout' : 'error', run: r, verdict, countered: !simulation };
    }

    const verdict = judgeRun(phase.judge, r);
    const res = resolveSubmission(def, state, phaseIndex, verdict.checks);
    if (res.newPassed === 0) {
      const failPayload = simulation ? { triggered: false } : recordFail(bossId);
      if (!simulation) bossCounterAttack(bossId, def.counterDamage);
      return {
        status: 'miss', run: r, verdict, result: res,
        countered: !simulation, toleranceTriggered: failPayload.triggered,
      };
    }

    // 伤害写入（掩码来自真实判题结果；模拟再战同样推进战斗，但不发永久奖励）
    let next = commitPlayer(p => {
      const latestRaw = (p.progress.battles || {})[bossId];
      const latestDiff = difficultyOf(latestRaw && typeof latestRaw === 'object' ? (latestRaw as { difficulty?: unknown }).difficulty : undefined);
      const latestDef = bossBattleDef(bossId, latestDiff) || def;
      const curState = normalizeBattleState(latestRaw, latestDef);
      const masks = curState.phaseMask.slice();
      masks[phaseIndex] = (masks[phaseIndex] || 0) | res.mask;
      const candidate: BossBattleState = {
        ...curState,
        hp: Math.max(0, Math.min(curState.maxHp, res.hpAfter)),
        phase: Math.max(curState.phase, res.phaseAfter),
        phaseMask: masks,
        started: true,
        cleared: false,
        updatedAt: Date.now(),
      };
      candidate.cleared = verifyBattleState(latestDef, candidate).ok;
      return { ...p, progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: candidate } } };
    });

    if (!res.defeated) {
      return { status: 'hit', run: r, verdict, result: res };
    }

    // 模拟再战：记录难度通关 / 一次性徽章，但不发碎片、不推进章节
    if (simulation) {
      const dc = recordBossDifficultyClear(next, bossId, difficulty, { now: Date.now() });
      next = dc.player;
      next = {
        ...next,
        progress: { ...next.progress, challengeSessions: passedBossSessionsFor(next, bossId, dc.exp, dc.credits) },
      };
      playerRef.current = next;
      setPlayer(next);
      return {
        status: 'simVictory', run: r, verdict, result: res, firstClear: null,
        difficultyClear: {
          difficulty,
          exp: dc.exp,
          credits: dc.credits,
          badgeId: dc.badgeId,
          titleUnlocked: dc.titleUnlocked,
          firstTime: dc.firstTime,
        },
      };
    }

    // 阶段全部击破 → 统一首胜事务（内部会再次校验真实战斗状态 + 难度）
    const firstClear = handleBossFirstClear(next, bossId, { difficulty });
    let payload: BossFirstClearPayload | null = null;
    if (firstClear.changed && firstClear.payload) {
      payload = firstClear.payload;
      next = firstClear.player;
      playerRef.current = next;
      setPlayer(next);
      if (payload.credits > 0) {
        toast('achieve', '章节奖励：+' + payload.credits + ' 贡献点（' + (payload.unlocks[0] || '') + '）');
      }
    } else if (!firstClear.changed && res.defeated) {
      toast('warn', '首胜事务未执行：' + firstClear.reason);
    }
    // Boss 会话结算：无论是否首胜，本次战斗都算一次通过的挑战（不发额外奖励）
    next = {
      ...next,
      progress: {
        ...next.progress,
        challengeSessions: passedBossSessionsFor(next, bossId, payload?.expGained || 0, payload?.credits || 0),
      },
    };
    playerRef.current = next;
    setPlayer(next);
    return {
      status: 'victory', run: r, verdict, result: res, firstClear: payload,
      reason: firstClear.changed ? undefined : firstClear.reason,
    };
  }, [commitPlayer, recordFail, bossCounterAttack, toast]);

  /** 攻击事件结算：成功清零容错；失败 -30% 意识（到 0 触发死亡） */
  const resolveDefense = useCallback((ok: boolean) => {
    const ev = eventRef.current;
    if (ev.kind !== 'attack') return;
    const prev = playerRef.current;
    const levelId = ev.levelId;
    const next: PlayerState = {
      ...prev,
      progress: {
        ...prev.progress,
        failedAttempts: { ...prev.progress.failedAttempts, [levelId]: 0 },
        flags: { ...prev.progress.flags },
      },
    };
    if (ok) {
      next.progress.flags.defenseWon = true;
      // 防御成功：本关容错计数清零（会话与 failedAttempts 同步清零）
      const sessions = next.progress.challengeSessions || {};
      const cur = sessions[levelId];
      if (cur) next.progress.challengeSessions = { ...sessions, [levelId]: { ...cur, errors: 0 } };
      const newAch = recalcAchievements(next);
      const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
      next.progress.achievements = newAch;
      setPlayer(next);
      setEvent({ kind: 'none' });
      play('shield');
      gained.forEach(id => {
        const def = achievementById(id);
        if (def) toast('achieve', '成就解锁：' + def.name);
      });
      toast('success', '防御成功：纠错者已被击退，本关容错计数已清零。');
    } else {
      const rwB = normalizeRewards(next.rewards);
      const barrier = rwB.buffs.barrier > 0;
      const dmg = barrier ? Math.ceil(30 / 2) : 30;
      if (barrier) next.rewards = { ...rwB, buffs: { ...rwB.buffs, barrier: rwB.buffs.barrier - 1 } };
      const c = Math.max(0, next.consciousness - dmg);
      next.consciousness = c;
      if (c <= 0) {
        next.meta = {
          ...next.meta,
          deaths: next.meta.deaths + 1,
          lastDeathLevel: levelId,
          lastDeathReason: '纠错者攻击 · 两次防御失败',
        };
        next.progress.pendingRebirth = true;
        next.progress.challengeSessions = failedSessionsFor(next, levelId, '纠错者攻击 · 两次防御失败', prev.consciousness);
        setPlayer(next);
        setEvent({ kind: 'death', levelId, reason: next.meta.lastDeathReason || '' });
        play('death');
      } else {
        setPlayer(next);
        setEvent({ kind: 'none' });
        play('error');
        const barrierNote = barrier ? '（意识护罩已抵消一半伤害）' : '';
        toast('warn', '防御失败：意识完整度 -' + dmg + '%' + barrierNote + '（当前 ' + c + '%）。纠错者被暂时击退。');
      }
    }
  }, [toast]);

  /** 意识归零：写死亡标记 + 结算本次挑战（失败），随后进入重生流程 */
  const startDeath = useCallback((levelId: string, reason: string, consciousnessLoss?: number) => {
    setPlayer(p => ({
      ...p,
      meta: { ...p.meta, deaths: p.meta.deaths + 1, lastDeathLevel: levelId, lastDeathReason: reason },
      progress: {
        ...p.progress,
        pendingRebirth: true,
        challengeSessions: failedSessionsFor(
          p, levelId, reason,
          typeof consciousnessLoss === 'number' && isFinite(consciousnessLoss) ? consciousnessLoss : p.consciousness,
        ),
      },
    }));
    setEvent({ kind: 'death', levelId, reason });
    play('death');
  }, []);
  startDeathRef.current = startDeath;

  /** 重生时把进行中的 Boss 战重置为满血第一阶段（已击破的保持不变） */
  const resetCurrentBattle = (p: PlayerState): Record<string, BossBattleState> => {
    const battles = { ...(p.progress.battles || {}) };
    const bossId = p.progress.currentBossId;
    if (!bossId) return battles;
    const raw = battles[bossId];
    const diff = difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined);
    const def = bossBattleDef(bossId, diff);
    if (def && !battles[bossId]?.cleared) battles[bossId] = createBattleState(def);
    return battles;
  };

  /** 重生结算：意识恢复 70%、保留成长、当前关卡进度重置待重打 */
  const finishRebirth = useCallback(() => {
    const prev = playerRef.current;
    const idx = prev.meta.rebirths;
    // 重生叙事奖励只写入「记忆日志」，不计入六枚创世主碎片
    // （创世主碎片只能来自对应章节 Boss 的首胜；旧档已收集的碎片不会被收回）
    const logs = [...(prev.meta.memoryLogs || [])];
    if (idx >= 2 && !logs.includes('log-f01')) logs.push('log-f01');
    const curLevel = prev.progress.currentLevelId;
    // 重生后本关容错计数清零（与 MIRA 提示一致；旧实现会保留计数导致重生后立刻再次触发攻击）
    const failedAttempts = curLevel
      ? { ...prev.progress.failedAttempts, [curLevel]: 0 }
      : prev.progress.failedAttempts;
    const next: PlayerState = {
      ...prev,
      consciousness: 70,
      meta: { ...prev.meta, rebirths: prev.meta.rebirths + 1, memoryLogs: logs },
      progress: { ...prev.progress, pendingRebirth: false, failedAttempts, battles: resetCurrentBattle(prev) },
    };
    const newAch = recalcAchievements(next);
    const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
    next.progress.achievements = newAch;
    setPlayer(next);
    setEvent({ kind: 'none' });
    setRespawnTick(t => t + 1);
    play('rebirth');
    gained.forEach(id => {
      const def = achievementById(id);
      if (def) toast('achieve', '成就解锁：' + def.name + (def.hidden ? '（隐藏）' : ''));
    });
  }, [toast]);

  /** 攻击事件：消耗一次防御尝试（不加意识惩罚） */
  const decrementAttackAttempt = useCallback(() => {
    setEvent(ev => (ev.kind === 'attack' ? { ...ev, attemptsLeft: ev.attemptsLeft - 1 } : ev));
  }, []);

  /** 载入存档时发现 pendingRebirth：直接进入重生流程（不再重复计死亡次数） */
  const triggerPendingDeath = useCallback(() => {
    const lv = playerRef.current.progress.currentLevelId || 'tut-1';
    setEvent({ kind: 'death', levelId: lv, reason: playerRef.current.meta.lastDeathReason || '意识残留异常（上次死亡未完成重建）' });
  }, []);

  /** 清空存档并重置为初始状态 */
  const wipeSave = useCallback(() => {
    // 清空存档时同时清掉本机的代码草稿：新存档不应看到上一周目的残留草稿
    clearAllDrafts();
    setPlayer(defaultState());
    setHasSave(false);
    setScreen('menu');
    setEvent({ kind: 'none' });
  }, []);

  // ---------- 存档管理 ----------
  const importSaveData = useCallback((text: string) => {
    const r = importSave(text);
    if (r.ok && r.state) {
      setPlayer(r.state);
      setHasSave(true);
      toast('success', '存档已导入。');
      return { ok: true };
    }
    toast('warn', '导入失败：' + (r.reason || '未知原因'));
    return { ok: false, reason: r.reason };
  }, [toast]);

  const exportSaveString = useCallback(() => exportSave(playerRef.current), []);

  const patchSettings = useCallback((patch: Partial<GameSettings>) => {
    setPlayer(p => ({ ...p, settings: { ...p.settings, ...patch } }));
  }, []);

  // ---------- 章节门禁（所有正式入口共用） ----------
  const chapterGateOf = useCallback((chapterId: string): ChapterGate =>
    chapterGate(playerRef.current, chapterId), []);
  const serverGate = useCallback((serverId: string) =>
    canEnterServer(playerRef.current, serverId), []);
  const bossEntryGate = useCallback((bossId: string): BossGate =>
    bossGate(playerRef.current, bossId), []);
  const originCoreGateNow = useCallback((): OriginCoreGate =>
    originCoreGate(playerRef.current), []);
  const bossRecord = useCallback((bossId: string) => bossRecordOf(playerRef.current, bossId), []);

  const value: GameCtx = {
    player, screen, event, toasts, saveCorrupted, hasSave,
    tolerance: toleranceFor(player.level),
    nav, toast, startNewGame, setCurrentLevel, setCurrentBoss, completeBoss,
    beginBossBattle, startBossBattle, abandonBossBattle, bossRecord, submitBossAttack,
    chapterGateOf, serverGate, bossEntryGate, originCoreGateNow,
    recordBug, recordEnding, markVaultRead, markVaultFinalSeen, setVaultLastOpened,
    completeLevel, recordFail, beginChallenge, recordRun, recordSubmit,
    buyShopItem, purchaseShopItem, useShopItem, equipItem, unequipItem, consumeHintTicket, consumeItem, restoreConsciousness, markArchiveRead,
    resetAttempts, hintUsed, resolveDefense, finishRebirth, startDeath,
    decrementAttackAttempt, triggerPendingDeath, wipeSave,
    markStory, unlockStoryEvent, recordStoryChoice, renamePlayer,
    addKnowledge, setFlag, patchSettings, importSaveData, exportSaveString,
    respawnTick, toggleMusic,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame must be used within GameProvider');
  return v;
}
