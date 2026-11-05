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
import { battleFor, createBattleState, normalizeBattleState, type BossBattleState } from '../game/battle';
import { fragmentForCollected } from '../game/lore/fragments';
import { chapterOfBoss } from '../game/lore/chapters';
import type { VaultState } from '../game/types';
import {
  defaultRewards, normalizeRewards, shopItemById,
  chapterRewardOf, type RewardState, type RewardBreakdown, type Grade,
} from '../game/rewards';
import { computeLevelRewardV2, unlocksForLevel, bossRewardFor, IMPROVEMENT_PER_STAR } from '../game/economy';
import { slotOf, skinMetaById } from '../game/cosmetics';
import { play, setVolumes, startMusic, stopMusic, isMusicOn } from '../services/sound';

function chapterIndexForServer(serverId: string): number {
  const map: Record<string, number> = { syntax: 1, logs: 2, storage: 3, factory: 4, diag: 5, core: 6 };
  return map[serverId] || 0;
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
}

export interface FailPayload { n: number; tolerance: number; triggered: boolean }

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
  completeBoss: (bossId: string) => { fragmentId: string; expGained: number; levelUp: boolean; newLevel: number; credits: number; trust: number; unlocks: string[] } | null;
  beginBossBattle: (bossId: string) => BossBattleState | null;
  applyBossDamage: (bossId: string, phaseIndex: number, r: { hpAfter: number; mask: number; phaseAfter: number; defeated: boolean }) => void;
  bossCounterAttack: (bossId: string, amount: number) => void;
  resetBossBattle: (bossId: string) => void;
  recordBug: (entryId: string) => void;
  recordEnding: (endingId: string) => void;
  markVaultRead: (fragmentId: string) => void;
  markVaultFinalSeen: () => void;
  setVaultLastOpened: (id: string | null) => void;
  buyShopItem: (itemId: string) => { ok: boolean; reason?: string };
  equipItem: (itemId: string) => { ok: boolean; reason?: string };
  consumeItem: (itemId: string) => boolean;
  restoreConsciousness: (amount: number) => void;
  markArchiveRead: (archiveId: string) => void;
  completeLevel: (levelId: string) => CompletePayload | null;
  recordFail: (levelId: string) => FailPayload;
  resetAttempts: (levelId: string) => void;
  hintUsed: (levelId: string) => number;
  resolveDefense: (ok: boolean) => void;
  finishRebirth: () => void;
  startDeath: (levelId: string, reason: string) => void;
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
  const [hasSave] = useState<boolean>(!boot.fresh);
  const [respawnTick, setRespawnTick] = useState(0);
  const playerRef = useRef(player);
  playerRef.current = player;
  const eventRef = useRef(event);
  eventRef.current = event;
  // 死亡流程的稳定引用（Boss 反击在 startDeath 定义之前就需要调用它）
  const startDeathRef = useRef<(levelId: string, reason: string) => void>(() => {});

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
    setScreen('story');
  }, []);

  const setCurrentLevel = useCallback((id: string | null) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, currentLevelId: id } }));
  }, []);

  const setCurrentBoss = useCallback((id: string | null) => {
    setPlayer(p => ({ ...p, progress: { ...p.progress, currentBossId: id } }));
  }, []);

  const completeBoss = useCallback((bossId: string): {
    fragmentId: string;
    expGained: number;
    levelUp: boolean;
    newLevel: number;
    credits: number;
    trust: number;
    unlocks: string[];
  } | null => {
    const boss = bossById(bossId);
    if (!boss) return null;
    const cur = playerRef.current;
    const done = cur.progress.bossesDone ?? [];
    if (done.includes(bossId)) return null; // 已击破：不重复发经验/碎片/奖励

    const newExp = cur.exp + boss.rewardExp;
    const newLevel = levelForExp(newExp);
    const firstGain = !cur.meta.memoryFragments.includes(boss.fragmentId);
    const fragments = firstGain
      ? [...cur.meta.memoryFragments, boss.fragmentId]
      : cur.meta.memoryFragments;

    // 碎片归档记录（重复挑战不会写入新时间）
    const fragmentLog = { ...(cur.meta.fragmentLog || {}) };
    if (firstGain) {
      const now = Date.now();
      fragmentLog[boss.fragmentId] = now;
      const canon = fragmentForCollected(boss.fragmentId)?.id;
      if (canon && !fragmentLog[canon]) fragmentLog[canon] = now;
    }

    // 章节完成标记：该章关卡全通 + Boss 首杀 → 写入 doneFlag（P0 修复）
    const chDef = chapterOfBoss(bossId);
    const chapterCleared = !!chDef && levelsOfServer(chDef.serverId).every(l => cur.progress.completedLevels.includes(l.id));
    const doneFlags = chapterCleared && chDef ? { ...cur.progress.flags, [chDef.doneFlag]: true } : cur.progress.flags;

    // 首次击败章节 Boss 的章节奖励（幂等）
    const baseRw = normalizeRewards(cur.rewards);
    let nextRw: RewardState = { ...baseRw, items: { ...baseRw.items }, skins: [...baseRw.skins] };
    const unlocks: string[] = [];
    let credits = 0;
    let trust = 0;
    const br = bossRewardFor(boss.chapter);
    const rewardKey = 'boss-ch' + boss.chapter;
    if (br && !(baseRw.bossRewards || []).includes(rewardKey)) {
      nextRw.credits = baseRw.credits + br.credits;
      nextRw.trust = Math.min(100, baseRw.trust + br.trust);
      nextRw.bossRewards = [...(baseRw.bossRewards || []), rewardKey];
      if (br.items) for (const [k, v] of Object.entries(br.items)) nextRw.items[k] = (nextRw.items[k] || 0) + v;
      if (br.skins && br.skins.length) nextRw.skins = [...new Set([...nextRw.skins, ...br.skins])];
      credits = br.credits;
      trust = br.trust;
      unlocks.push(br.title);
    }

    // 升级解锁（称号 / 头像框 / 粒子），自动装备
    for (const u of unlocksForLevel(cur.level, newLevel)) {
      if (nextRw.skins.includes(u.id)) continue;
      nextRw.skins = [...nextRw.skins, u.id];
      nextRw.unlocks = [...(nextRw.unlocks || []), u.id];
      if (u.slot) nextRw.equipped = { ...nextRw.equipped, [u.slot]: u.id };
      unlocks.push(u.name);
    }

    setPlayer(p => {
      const next: PlayerState = {
        ...p,
        level: newLevel,
        exp: newExp,
        rewards: nextRw,
        meta: { ...p.meta, memoryFragments: fragments, fragmentLog },
        progress: {
          ...p.progress,
          flags: doneFlags,
          bossesDone: [...(p.progress.bossesDone ?? []), bossId],
          achievements: recalcAchievements({
            ...p,
            level: newLevel,
            exp: newExp,
            meta: { ...p.meta, memoryFragments: fragments },
            progress: { ...p.progress, bossesDone: [...(p.progress.bossesDone ?? []), bossId] },
          }),
        },
      };
      return next;
    });

    if (credits > 0) toast('achieve', '章节奖励：+' + credits + ' 贡献点（' + (br ? br.title : '') + '）');
    return { fragmentId: boss.fragmentId, expGained: boss.rewardExp, levelUp: newLevel > cur.level, newLevel, credits, trust, unlocks };
  }, [toast]);

  // ---------- Boss 战 ----------
  /** 进入战斗：没有存档就创建满血状态（已击破的 Boss 保留原状态） */
  const beginBossBattle = useCallback((bossId: string): BossBattleState | null => {
    const def = battleFor(bossId);
    if (!def) return null;
    const cur = playerRef.current;
    const existing = normalizeBattleState((cur.progress.battles || {})[bossId], def);
    if (!(cur.progress.battles || {})[bossId]) {
      setPlayer(p => ({
        ...p,
        progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: existing } },
      }));
    }
    return existing;
  }, []);

  /** 写入一次判题结果（血量 / 阶段 / 已通过测试位掩码） */
  const applyBossDamage = useCallback((
    bossId: string,
    phaseIndex: number,
    r: { hpAfter: number; mask: number; phaseAfter: number; defeated: boolean },
  ) => {
    const def = battleFor(bossId);
    if (!def) return;
    setPlayer(p => {
      const cur = normalizeBattleState((p.progress.battles || {})[bossId], def);
      const masks = cur.phaseMask.slice();
      masks[phaseIndex] = Math.max(masks[phaseIndex] || 0, r.mask);
      const next: BossBattleState = {
        ...cur,
        hp: Math.max(0, Math.min(cur.maxHp, r.hpAfter)),
        phase: Math.max(cur.phase, r.phaseAfter),
        phaseMask: masks,
        cleared: cur.cleared || r.defeated || r.hpAfter <= 0,
        updatedAt: Date.now(),
      };
      return { ...p, progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: next } } };
    });
  }, []);

  /** 判题没有造成伤害 → Boss 反击：意识值下降，失败次数 +1；意识归零走既有死亡流程 */
  const bossCounterAttack = useCallback((bossId: string, amount: number) => {
    const def = battleFor(bossId);
    if (!def) return;
    const cur = playerRef.current;
    const c = Math.max(0, cur.consciousness - Math.max(0, amount));
    setPlayer(p => {
      const b = normalizeBattleState((p.progress.battles || {})[bossId], def);
      return {
        ...p,
        consciousness: c,
        progress: {
          ...p.progress,
          battles: { ...(p.progress.battles || {}), [bossId]: { ...b, failures: b.failures + 1, updatedAt: Date.now() } },
        },
      };
    });
    if (c <= 0) {
      setPlayer(p => ({
        ...p,
        progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: createBattleState(def) } },
      }));
      startDeathRef.current(bossId, '被 ' + (def.bossId.toUpperCase()) + ' 反击击穿');
    }
  }, []);

  /** 重置某场战斗（重生 / 手动放弃进度时使用） */
  const resetBossBattle = useCallback((bossId: string) => {
    const def = battleFor(bossId);
    if (!def) return;
    setPlayer(p => ({
      ...p,
      progress: { ...p.progress, battles: { ...(p.progress.battles || {}), [bossId]: createBattleState(def) } },
    }));
  }, []);

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

  /** 兑换中心购买（外观一次性、道具可重复购买） */
  const buyShopItem = useCallback((itemId: string): { ok: boolean; reason?: string } => {
    const item = shopItemById(itemId);
    if (!item) return { ok: false, reason: '商品不存在' };
    const cur = playerRef.current;
    const rw = normalizeRewards(cur.rewards);
    if (item.unique && (rw.skins.includes(itemId) || (item.flag && cur.progress.flags[item.flag] === true))) {
      return { ok: false, reason: '已拥有该奖励' };
    }
    if (rw.credits < item.price) return { ok: false, reason: '贡献点不足（还差 ' + (item.price - rw.credits) + '）' };
    const next: RewardState = {
      ...rw,
      credits: rw.credits - item.price,
      skins: item.unique ? [...new Set([...rw.skins, itemId])] : rw.skins,
      items: item.count ? { ...rw.items, [itemId]: (rw.items[itemId] || 0) + item.count } : { ...rw.items },
    };
    const flags = { ...cur.progress.flags };
    if (item.flag) flags[item.flag] = true;
    setPlayer(p => ({ ...p, rewards: next, progress: { ...p.progress, flags } }));
    toast('achieve', '兑换成功：' + item.name);
    play('success');
    return { ok: true };
  }, [toast]);

  /** 装备外观 */
  const equipItem = useCallback((itemId: string): { ok: boolean; reason?: string } => {
    const slot = slotOf(itemId);
    if (!slot) return { ok: false, reason: '该物品不可装备' };
    const cur = playerRef.current;
    const rw = normalizeRewards(cur.rewards);
    if (!rw.skins.includes(itemId)) return { ok: false, reason: '尚未拥有' };
    const equipped = { ...rw.equipped, [slot]: itemId };
    setPlayer(p => ({ ...p, rewards: { ...normalizeRewards(p.rewards), equipped } }));
    toast('success', '已装备：' + (skinMetaById(itemId)?.name || itemId));
    play('click');
    return { ok: true };
  }, [toast]);

  /** 消耗一个道具 */
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

  /** 通关：经验、星级、知识卡片、关卡/服务器解锁、成就、升级 */
  const completeLevel = useCallback((levelId: string): CompletePayload | null => {
    const level = levelById(levelId);
    if (!level) return null;
    const prev = playerRef.current;
    const firstTime = !prev.progress.completedLevels.includes(levelId);
    const att = prev.progress.failedAttempts[levelId] || 0;
    const stars = att === 0 ? 3 : att === 1 ? 2 : 1;
    const prevStars = prev.progress.stars[levelId] || 0;
    const oldLevel = prev.level;

    const completed = prev.progress.completedLevels.includes(levelId)
      ? prev.progress.completedLevels
      : [...prev.progress.completedLevels, levelId];
    const knowledge = [...new Set([...prev.progress.knowledge, ...level.knowledge])];
    const nextExp = firstTime ? prev.exp + level.rewardExp : prev.exp;
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
    if (level.serverId === 'syntax' && serverDone) {
      next.progress.flags.chapter1Done = true;
      next.progress.flags.pendingChapterUnlock = true;
      if (!next.progress.unlockedServers.includes('logs')) {
        next.progress.unlockedServers = [...next.progress.unlockedServers, 'logs'];
      }
    }
    if (level.serverId === 'logs' && serverDone) {
      next.progress.flags.chapter2Done = true;
      next.progress.flags.pendingChapter3Unlock = true;
      if (!next.progress.unlockedServers.includes('storage')) {
        next.progress.unlockedServers = [...next.progress.unlockedServers, 'storage'];
      }
    }
    if (level.serverId === 'storage' && serverDone) {
      next.progress.flags.chapter3Done = true;
      next.progress.flags.pendingChapter4Unlock = true;
      if (!next.progress.unlockedServers.includes('factory')) {
        next.progress.unlockedServers = [...next.progress.unlockedServers, 'factory'];
      }
    }
    if (level.serverId === 'factory' && serverDone) {
      // 第四章完成：核心机房溢出信号，但最高权限封锁保持（终章服务器，第五章衔接）
      next.progress.flags.chapter4Done = true;
      next.progress.flags.pendingChapter5Unlock = true;
      if (!next.progress.unlockedServers.includes('diag')) {
        next.progress.unlockedServers = [...next.progress.unlockedServers, 'diag'];
      }
    }
    if (level.serverId === 'diag' && serverDone) {
      // 第五章完成：核心机房封锁开始解除（终章仍待第六章）
      next.progress.flags.chapter5Done = true;
      next.progress.flags.pendingChapter6Unlock = true;
      if (!next.progress.unlockedServers.includes('core')) {
        next.progress.unlockedServers = [...next.progress.unlockedServers, 'core'];
      }
    }
    if (level.serverId === 'core' && serverDone) {
      // 终章完成：全网络复原 + 收集创世主第二块记忆碎片
      next.progress.flags.chapter6Done = true;
      next.progress.flags.gameCompleted = true;
      if (!next.meta.memoryFragments.includes('f2')) {
        next.meta.memoryFragments = [...next.meta.memoryFragments, 'f2'];
      }
    }
    const newAch = recalcAchievements(next);
    const gained = newAch.filter(a => !prev.progress.achievements.includes(a));
    next.progress.achievements = newAch;
    // ---------- 奖励系统结算（与经验/等级并行，互不覆盖；仅在真实判题通过时执行） ----------
    const prevRewards: RewardState = normalizeRewards(prev.rewards);
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
      if (chapterDef.fragment && !next.meta.memoryFragments.includes(chapterDef.fragment)) {
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
      expGained: firstTime ? level.rewardExp : 0,
      levelUp: next.level > oldLevel,
      oldLevel,
      newLevel: next.level,
      stars,
      newAchievements: gained,
      unlocks: unlockNames,
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

  /** 正式提交失败：计数 +1；超过容错上限时触发纠错者攻击事件 */
  const recordFail = useCallback((levelId: string): FailPayload => {
    if (eventRef.current.kind !== 'none') return { n: 0, tolerance: 0, triggered: false };
    const prev = playerRef.current;
    const n = (prev.progress.failedAttempts[levelId] || 0) + 1;
    const tol = toleranceFor(prev.level);
    setPlayer(p => ({
      ...p,
      progress: { ...p.progress, failedAttempts: { ...p.progress.failedAttempts, [levelId]: n } },
    }));
    if (n > tol) {
      const pool = DEFENSE_TASKS.map(t => t.id);
      const defenseId = pool[Math.floor(Math.random() * pool.length)];
      setEvent({ kind: 'attack', levelId, defenseId, attemptsLeft: 2 });
      play('threat');
      return { n, tolerance: tol, triggered: true };
    }
    return { n, tolerance: tol, triggered: false };
  }, []);

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
      const c = Math.max(0, next.consciousness - 30);
      next.consciousness = c;
      if (c <= 0) {
        next.meta = {
          ...next.meta,
          deaths: next.meta.deaths + 1,
          lastDeathLevel: levelId,
          lastDeathReason: '纠错者攻击 · 两次防御失败',
        };
        next.progress.pendingRebirth = true;
        setPlayer(next);
        setEvent({ kind: 'death', levelId, reason: next.meta.lastDeathReason || '' });
        play('death');
      } else {
        setPlayer(next);
        setEvent({ kind: 'none' });
        play('error');
        toast('warn', '防御失败：意识完整度 -30%（当前 ' + c + '%）。纠错者被暂时击退。');
      }
    }
  }, [toast]);

  const startDeath = useCallback((levelId: string, reason: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    setPlayer(p => ({
      ...p,
      meta: { ...p.meta, deaths: p.meta.deaths + 1, lastDeathLevel: levelId, lastDeathReason: reason },
      progress: { ...p.progress, pendingRebirth: true },
    }));
    setEvent({ kind: 'death', levelId, reason });
    play('death');
  }, []);
  startDeathRef.current = startDeath;

  /** 重生时把进行中的 Boss 战重置为满血第一阶段（已击破的保持不变） */
  const resetCurrentBattle = (p: PlayerState): Record<string, BossBattleState> => {
    const battles = { ...(p.progress.battles || {}) };
    const bossId = p.progress.currentBossId;
    const def = bossId ? battleFor(bossId) : undefined;
    if (bossId && def && !battles[bossId]?.cleared) battles[bossId] = createBattleState(def);
    return battles;
  };

  /** 重生结算：意识恢复 70%、保留成长、当前关卡进度重置待重打 */
  const finishRebirth = useCallback(() => {
    const prev = playerRef.current;
    const idx = prev.meta.rebirths;
    const fragments = prev.meta.memoryFragments.slice();
    if (idx >= 2 && !fragments.includes('f1')) fragments.push('f1');
    const next: PlayerState = {
      ...prev,
      consciousness: 70,
      meta: { ...prev.meta, rebirths: prev.meta.rebirths + 1, memoryFragments: fragments },
      progress: { ...prev.progress, pendingRebirth: false, battles: resetCurrentBattle(prev) },
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
    setPlayer(defaultState());
    setScreen('menu');
    setEvent({ kind: 'none' });
  }, []);

  // ---------- 存档管理 ----------
  const importSaveData = useCallback((text: string) => {
    const r = importSave(text);
    if (r.ok && r.state) {
      setPlayer(r.state);
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

  const value: GameCtx = {
    player, screen, event, toasts, saveCorrupted, hasSave,
    tolerance: toleranceFor(player.level),
    nav, toast, startNewGame, setCurrentLevel, setCurrentBoss, completeBoss,
    beginBossBattle, applyBossDamage, bossCounterAttack, resetBossBattle,
    recordBug, recordEnding, markVaultRead, markVaultFinalSeen, setVaultLastOpened,
    completeLevel, recordFail,
    buyShopItem, equipItem, consumeItem, restoreConsciousness, markArchiveRead,
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
