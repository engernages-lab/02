// Boss 战斗奖励发放（V1.3-B.5.3）
//
// 计算与发放分离：本模块只接收已计算的奖励，按 battleId 幂等写入记录，
// 在同一个返回状态中完成 XP/贡献点/等级/账本更新。碎片不重复发放。

import type { PlayerState } from './types';
import { normalizeRewards } from './rewards';
import { safeCredits, safeExp } from './economyConfig';
import { levelForExp } from './progression';
import { unlocksForLevel } from './economy';
import { appendLedger } from './economy';
import { recalcAchievements } from './achievements';
import { recordBossBattleReward, type BossBattleReward, type BossBattleRewardStore } from './bossBattleReward';

export interface BossRewardGrantResult {
  player: PlayerState;
  store: BossBattleRewardStore;
  added: boolean;
  reason?: string;
}

export function applyBossBattleRewardGrant(
  player: PlayerState,
  reward: BossBattleReward,
  store: BossBattleRewardStore,
  now: number,
): BossRewardGrantResult {
  let recorded: { store: BossBattleRewardStore; added: boolean; reason?: string };
  try {
    recorded = recordBossBattleReward(store, { ...reward, granted: true, grantedAt: now });
  } catch {
    return { player, store, added: false, reason: 'failed' };
  }
  if (!recorded.added) return { player, store: recorded.store, added: false, reason: recorded.reason || 'duplicate' };

  const add = reward.grantedReward;
  let next = player;
  if (add.xp > 0 || add.contribution > 0) {
    const prevLevel = player.level;
    const exp = safeExp(player.exp + add.xp);
    const level = levelForExp(exp);
    const baseRw = normalizeRewards(player.rewards);
    let rw = {
      ...baseRw,
      credits: safeCredits(baseRw.credits + add.contribution),
      skins: [...baseRw.skins],
      equipped: { ...baseRw.equipped },
      unlocks: [...(baseRw.unlocks || [])],
    };
    for (const u of unlocksForLevel(prevLevel, level)) {
      if (!rw.skins.includes(u.id)) rw.skins = [...rw.skins, u.id];
      if (!rw.unlocks.includes(u.id)) rw.unlocks = [...rw.unlocks, u.id];
      if (u.slot) rw.equipped = { ...rw.equipped, [u.slot]: u.id };
    }
    rw = {
      ...rw,
      ledger: appendLedger(rw.ledger, {
        kind: 'boss',
        ref: reward.bossId + ':performance:' + reward.difficulty + ':' + reward.battleId,
        credits: add.contribution,
        exp: add.xp,
        at: now,
      }),
    };
    next = { ...player, exp, level, rewards: rw };
  }
  next = { ...next, progress: { ...next.progress, bossBattleRewards: recorded.store } };
  next = { ...next, progress: { ...next.progress, achievements: recalcAchievements(next) } };
  return { player: next, store: recorded.store, added: true };
}
