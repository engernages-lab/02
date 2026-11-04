import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { GameEvent, PlayerState, Screen, Toast, GameSettings } from '../game/types';
import { defaultState, exportSave, importSave, loadGame, saveGame } from '../services/save';
import { levelById, levelsOfServer } from '../game/levels';
import { levelForExp, toleranceFor } from '../game/progression';
import { recalcAchievements, achievementById } from '../game/achievements';
import { DEFENSE_TASKS } from '../game/defense';
import { bossById } from '../game/bosses';
import {
  computeLevelReward, defaultRewards, normalizeRewards, shopItemById,
  chapterRewardOf, type RewardState, type RewardBreakdown, type Grade,
} from '../game/rewards';
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
  completeBoss: (bossId: string) => { fragmentId: string; expGained: number; levelUp: boolean; newLevel: number } | null;
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

  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = toastSeq++;
    setToasts(t => [...t.slice(-4), { id, kind, text }]);
    window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4600);
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

  const completeBoss = useCallback((bossId: string): { fragmentId: string; expGained: number; levelUp: boolean; newLevel: number } | null => {
    const boss = bossById(bossId);
    if (!boss) return null;
    const cur = playerRef.current;
    const done = cur.progress.bossesDone ?? [];
    if (done.includes(bossId)) return null;
    const newExp = cur.exp + boss.rewardExp;
    const newLevel = levelForExp(newExp);
    const fragments = cur.meta.memoryFragments.includes(boss.fragmentId)
      ? cur.meta.memoryFragments
      : [...cur.meta.memoryFragments, boss.fragmentId];
    setPlayer(p => {
      const next: PlayerState = {
        ...p,
        level: newLevel,
        exp: newExp,
        meta: { ...p.meta, memoryFragments: fragments },
        progress: {
          ...p.progress,
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
    return { fragmentId: boss.fragmentId, expGained: boss.rewardExp, levelUp: newLevel > cur.level, newLevel };
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
    const item = shopItemById(itemId);
    if (!item || !item.slot) return { ok: false, reason: '该物品不可装备' };
    const cur = playerRef.current;
    const rw = normalizeRewards(cur.rewards);
    if (!rw.skins.includes(itemId)) return { ok: false, reason: '尚未拥有' };
    const equipped = { ...rw.equipped, [item.slot]: itemId };
    setPlayer(p => ({ ...p, rewards: { ...normalizeRewards(p.rewards), equipped } }));
    toast('success', '已装备：' + item.name);
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

  const markStory = useCallback((id: string) => {
    setPlayer(p => {
      if (p.progress.storySeen[id]) return p;
      return { ...p, progress: { ...p.progress, storySeen: { ...p.progress.storySeen, [id]: true } } };
    });
  }, []);

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
    const breakdown = computeLevelReward(level.rewardExp, att, hintsUsed, !alreadyCleared);
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
    next.rewards = rewards;

    setPlayer(next);
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
    setPlayer(p => ({
      ...p,
      meta: { ...p.meta, deaths: p.meta.deaths + 1, lastDeathLevel: levelId, lastDeathReason: reason },
      progress: { ...p.progress, pendingRebirth: true },
    }));
    setEvent({ kind: 'death', levelId, reason });
    play('death');
  }, []);

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
      progress: { ...prev.progress, pendingRebirth: false },
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
    nav, toast, startNewGame, setCurrentLevel, setCurrentBoss, completeBoss, completeLevel, recordFail,
    buyShopItem, equipItem, consumeItem, restoreConsciousness, markArchiveRead,
    resetAttempts, hintUsed, resolveDefense, finishRebirth, startDeath,
    decrementAttackAttempt, triggerPendingDeath, wipeSave,
    markStory, addKnowledge, setFlag, patchSettings, importSaveData, exportSaveString,
    respawnTick, toggleMusic,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame must be used within GameProvider');
  return v;
}
