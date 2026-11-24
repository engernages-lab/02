// Boss 隐藏成就持久化与奖励发放（V1.3-B.5.4）
//
// 正式解锁永久保存；同一 achievementId 只解锁一次、只领取一次。
// 奖励复用现有 XP / 贡献点 / 等级 / 账本；不新增货币或碎片。

import type { PlayerState } from './types';
import { normalizeRewards } from './rewards';
import { safeCredits, safeExp } from './economyConfig';
import { levelForExp } from './progression';
import { unlocksForLevel, appendLedger } from './economy';
import { recalcAchievements } from './achievements';
import {
  BOSS_ACHIEVEMENT_MAP,
  type BossAchievementRewardAmounts,
} from './bossAchievementConfig';
import {
  calculateBossAchievementReward,
  bossAchievementRewardId,
  type BossAchievementEvaluation,
  type BossAchievementEvidence,
} from './bossAchievementEngine';

export const MAX_ACHIEVEMENT_UNLOCKS = 200;
export const MAX_ACHIEVEMENT_PROGRESS = 300;
export const MAX_ACHIEVEMENT_REWARD_HISTORY = 200;
export const MAX_ACHIEVEMENT_EVENT_DEDUP = 500;

export interface BossAchievementUnlock {
  achievementId: string;
  unlockedAt: number;
  battleId: string;
  bossId: string;
  difficulty: string;
  rewardId: string;
  rewardGranted: boolean;
  rewardGrantedAt: number | null;
  evidence: BossAchievementEvidence;
}

export interface BossAchievementProgress {
  achievementId: string;
  progress: number;
  target: number;
  completed: boolean;
  updatedAt: number;
  battleId: string | null;
}

export interface BossAchievementRewardRecord {
  achievementId: string;
  battleId: string;
  rewardId: string;
  xp: number;
  contribution: number;
  fragments: number;
  grantedAt: number;
}

export interface BossAchievementStore {
  unlocked: BossAchievementUnlock[];
  progress: BossAchievementProgress[];
  rewardHistory: BossAchievementRewardRecord[];
  eventDeduplication: string[];
}

const int = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

export function emptyBossAchievementStore(): BossAchievementStore {
  return { unlocked: [], progress: [], rewardHistory: [], eventDeduplication: [] };
}

function normalizeEvidence(raw: unknown): BossAchievementEvidence {
  const e = raw && typeof raw === 'object' ? raw as Partial<BossAchievementEvidence> : {};
  return {
    battleId: typeof e.battleId === 'string' ? e.battleId : '',
    bossId: typeof e.bossId === 'string' ? e.bossId : '',
    difficulty: typeof e.difficulty === 'string' ? e.difficulty : 'easy',
    challengePassed: int(e.challengePassed),
    challengeJudged: int(e.challengeJudged),
    challengeFailed: int(e.challengeFailed),
    invalidChallengeCount: int(e.invalidChallengeCount),
    maxConsecutive: int(e.maxConsecutive),
    playerDeathCount: int(e.playerDeathCount),
    damageTaken: int(e.damageTaken),
    minConsciousness: typeof e.minConsciousness === 'number' && Number.isFinite(e.minConsciousness) ? Math.max(0, Math.min(100, Math.floor(e.minConsciousness))) : null,
    defenseSuccess: int(e.defenseSuccess),
    dodgeSuccess: int(e.dodgeSuccess),
    weaknessDiscovered: int(e.weaknessDiscovered),
    weaknessCracked: int(e.weaknessCracked),
    weaknessExposed: int(e.weaknessExposed),
    weaknessDamage: int(e.weaknessDamage),
    dynamicTriggered: int(e.dynamicTriggered),
    dynamicSuccess: int(e.dynamicSuccess),
    dynamicSuccessByDef: e.dynamicSuccessByDef && typeof e.dynamicSuccessByDef === 'object'
      ? Object.fromEntries(Object.entries(e.dynamicSuccessByDef).map(([k, v]) => [k, int(v)]).filter(([, v]) => Number(v) > 0))
      : {},
    ratingGrade: typeof e.ratingGrade === 'string' ? e.ratingGrade : null,
    ratingScore: typeof e.ratingScore === 'number' && Number.isFinite(e.ratingScore) ? Math.max(0, Math.min(100, Math.floor(e.ratingScore))) : null,
  };
}

export function normalizeBossAchievementStore(raw: unknown): BossAchievementStore {
  const src = raw && typeof raw === 'object' ? raw as Partial<BossAchievementStore> : {};
  const unlocked: BossAchievementUnlock[] = [];
  const seenUnlock = new Set<string>();
  if (Array.isArray(src.unlocked)) {
    for (const item of [...src.unlocked].sort((a, b) => int(a?.unlockedAt) - int(b?.unlockedAt))) {
      if (!item || typeof item !== 'object') continue;
      const u = item as Partial<BossAchievementUnlock>;
      if (typeof u.achievementId !== 'string' || !BOSS_ACHIEVEMENT_MAP[u.achievementId] || seenUnlock.has(u.achievementId)) continue;
      seenUnlock.add(u.achievementId);
      unlocked.push({
        achievementId: u.achievementId,
        unlockedAt: Math.max(0, int(u.unlockedAt)),
        battleId: typeof u.battleId === 'string' ? u.battleId : '',
        bossId: typeof u.bossId === 'string' ? u.bossId : '',
        difficulty: typeof u.difficulty === 'string' ? u.difficulty : 'easy',
        rewardId: typeof u.rewardId === 'string' && u.rewardId ? u.rewardId : bossAchievementRewardId(u.achievementId),
        rewardGranted: u.rewardGranted === true,
        rewardGrantedAt: typeof u.rewardGrantedAt === 'number' && Number.isFinite(u.rewardGrantedAt) ? Math.max(0, Math.floor(u.rewardGrantedAt)) : null,
        evidence: normalizeEvidence(u.evidence),
      });
    }
  }
  const progress: BossAchievementProgress[] = [];
  const seenProgress = new Set<string>();
  if (Array.isArray(src.progress)) {
    for (const item of src.progress) {
      if (!item || typeof item !== 'object') continue;
      const p = item as Partial<BossAchievementProgress>;
      if (typeof p.achievementId !== 'string' || !BOSS_ACHIEVEMENT_MAP[p.achievementId] || seenProgress.has(p.achievementId)) continue;
      seenProgress.add(p.achievementId);
      const target = Math.max(1, int(p.target));
      progress.push({
        achievementId: p.achievementId,
        progress: Math.min(target, int(p.progress)),
        target,
        completed: p.completed === true,
        updatedAt: Math.max(0, int(p.updatedAt)),
        battleId: typeof p.battleId === 'string' ? p.battleId : null,
      });
    }
  }
  const rewardHistory: BossAchievementRewardRecord[] = [];
  const seenReward = new Set<string>();
  if (Array.isArray(src.rewardHistory)) {
    for (const item of src.rewardHistory) {
      if (!item || typeof item !== 'object') continue;
      const r = item as Partial<BossAchievementRewardRecord>;
      if (typeof r.rewardId !== 'string' || !r.rewardId || seenReward.has(r.rewardId)) continue;
      if (typeof r.achievementId !== 'string' || !BOSS_ACHIEVEMENT_MAP[r.achievementId]) continue;
      seenReward.add(r.rewardId);
      rewardHistory.push({
        achievementId: r.achievementId,
        battleId: typeof r.battleId === 'string' ? r.battleId : '',
        rewardId: r.rewardId,
        xp: int(r.xp),
        contribution: int(r.contribution),
        fragments: int(r.fragments),
        grantedAt: Math.max(0, int(r.grantedAt)),
      });
    }
  }
  const eventDeduplication = Array.isArray(src.eventDeduplication)
    ? [...new Set(src.eventDeduplication.filter((x): x is string => typeof x === 'string' && x.length > 0))].slice(-MAX_ACHIEVEMENT_EVENT_DEDUP)
    : [];
  return {
    unlocked: unlocked.slice(-MAX_ACHIEVEMENT_UNLOCKS),
    progress: progress.slice(-MAX_ACHIEVEMENT_PROGRESS),
    rewardHistory: rewardHistory.sort((a, b) => a.grantedAt - b.grantedAt).slice(-MAX_ACHIEVEMENT_REWARD_HISTORY),
    eventDeduplication,
  };
}

function achievementStoreOf(p: PlayerState): BossAchievementStore {
  return p.progress.bossAchievements || emptyBossAchievementStore();
}

export function evaluateAndApplyBossAchievements(
  player: PlayerState,
  evaluation: BossAchievementEvaluation,
  now: number,
): { player: PlayerState; granted: boolean; newlyUnlocked: string[] } {
  if (!evaluation.formalEligible || evaluation.dataQuality !== 'complete') {
    return { player, granted: false, newlyUnlocked: [] };
  }
  const store = achievementStoreOf(player);
  const eventKey = 'achievement-eval:' + evaluation.battleId;
  if (store.eventDeduplication.includes(eventKey)) {
    return { player, granted: false, newlyUnlocked: [] };
  }
  const unlockedIds = new Set(store.unlocked.map(u => u.achievementId));
  const newCandidates = evaluation.newlyUnlocked.filter(c => !unlockedIds.has(c.achievementId));
  const newIds = newCandidates.map(c => c.achievementId);
  const progressMap = new Map(store.progress.map(p => [p.achievementId, p]));
  for (const p of evaluation.progressUpdates) {
    const prev = progressMap.get(p.achievementId);
    if (prev && prev.updatedAt > p.updatedAt) continue;
    progressMap.set(p.achievementId, {
      achievementId: p.achievementId,
      progress: p.completed ? p.target : Math.min(p.target, int(p.progress)),
      target: p.target,
      completed: p.completed,
      updatedAt: p.updatedAt,
      battleId: p.battleId,
    });
  }
  for (const id of newIds) {
    const def = BOSS_ACHIEVEMENT_MAP[id];
    if (!def) continue;
    const target = progressMap.get(id)?.target || 1;
    progressMap.set(id, {
      achievementId: id,
      progress: target,
      target,
      completed: true,
      updatedAt: now,
      battleId: evaluation.battleId,
    });
  }

  const unlockRecords: BossAchievementUnlock[] = newCandidates
    .filter(c => BOSS_ACHIEVEMENT_MAP[c.achievementId])
    .map(c => ({
      achievementId: c.achievementId,
      unlockedAt: now,
      battleId: c.battleId,
      bossId: c.bossId,
      difficulty: c.difficulty,
      rewardId: bossAchievementRewardId(c.achievementId),
      rewardGranted: true,
      rewardGrantedAt: now,
      evidence: { ...c.evidence },
    }));
  const reward = calculateBossAchievementReward(newCandidates);
  const rewardRecords: BossAchievementRewardRecord[] = newCandidates
    .filter(c => BOSS_ACHIEVEMENT_MAP[c.achievementId])
    .map(c => {
      const def = BOSS_ACHIEVEMENT_MAP[c.achievementId];
      const per = calculateBossAchievementReward([{ reward: def.reward }]);
      return {
        achievementId: c.achievementId,
        battleId: c.battleId,
        rewardId: bossAchievementRewardId(c.achievementId),
        xp: per.xp,
        contribution: per.contribution,
        fragments: 0,
        grantedAt: now,
      };
    });

  let next = player;
  if (reward.xp > 0 || reward.contribution > 0) {
    const prevLevel = player.level;
    const exp = safeExp(player.exp + reward.xp);
    const level = levelForExp(exp);
    const baseRw = normalizeRewards(player.rewards);
    let rw = {
      ...baseRw,
      credits: safeCredits(baseRw.credits + reward.contribution),
      skins: [...baseRw.skins],
      equipped: { ...baseRw.equipped },
      unlocks: [...(baseRw.unlocks || [])],
    };
    for (const u of unlocksForLevel(prevLevel, level)) {
      if (!rw.skins.includes(u.id)) rw.skins = [...rw.skins, u.id];
      if (!rw.unlocks.includes(u.id)) rw.unlocks = [...rw.unlocks, u.id];
      if (u.slot) rw.equipped = { ...rw.equipped, [u.slot]: u.id };
    }
    let ledger = rw.ledger;
    for (const rec of rewardRecords) {
      if (rec.xp <= 0 && rec.contribution <= 0) continue;
      ledger = appendLedger(ledger, {
        kind: 'boss',
        ref: 'achievement:' + rec.achievementId,
        credits: rec.contribution,
        exp: rec.xp,
        at: now,
      });
    }
    next = { ...player, exp, level, rewards: { ...rw, ledger } };
  }

  const merged: BossAchievementStore = {
    unlocked: [...store.unlocked, ...unlockRecords].slice(-MAX_ACHIEVEMENT_UNLOCKS),
    progress: [...progressMap.values()].sort((a, b) => a.updatedAt - b.updatedAt).slice(-MAX_ACHIEVEMENT_PROGRESS),
    rewardHistory: [...store.rewardHistory, ...rewardRecords].sort((a, b) => a.grantedAt - b.grantedAt).slice(-MAX_ACHIEVEMENT_REWARD_HISTORY),
    eventDeduplication: [...new Set([...store.eventDeduplication, eventKey])].slice(-MAX_ACHIEVEMENT_EVENT_DEDUP),
  };
  next = { ...next, progress: { ...next.progress, bossAchievements: merged } };
  next = { ...next, progress: { ...next.progress, achievements: recalcAchievements(next) } };
  return { player: next, granted: unlockRecords.length > 0, newlyUnlocked: newIds };
}
