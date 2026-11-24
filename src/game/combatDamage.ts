// 统一玩家伤害结算（V1.3-B.4 补充）
//
// 所有会扣玩家意识的来源（Boss 攻击 / 动态事件 / 特殊攻击 / 弱点反噬 / 环境伤害）
// 必须经过这里：统一护罩消耗、意识下限、死亡判定输入与可追踪结果。
// 幂等由 combatEventArbiter.settledEventIds 负责；本模块只做纯数值结算。

export interface PlayerDamageResolution {
  consciousness: number;
  barrierLayers: number;
  /** 实际扣除的意识值 */
  applied: number;
  barrierConsumed: boolean;
  /** 是否因玩家已死亡 / 战斗终结而未结算 */
  blocked: boolean;
  reason?: string;
}

export function resolvePlayerDamage(
  consciousness: number,
  barrierLayers: number,
  amount: number,
  opts: { blockedReason?: string | null } = {},
): PlayerDamageResolution {
  const hp = Math.max(0, Math.min(100, Math.floor(Number.isFinite(consciousness) ? consciousness : 0)));
  const barriers = Math.max(0, Math.floor(Number.isFinite(barrierLayers) ? barrierLayers : 0));
  const raw = Math.max(0, Math.ceil(Number.isFinite(amount) ? amount : 0));
  if (opts.blockedReason) {
    return { consciousness: hp, barrierLayers: barriers, applied: 0, barrierConsumed: false, blocked: true, reason: opts.blockedReason };
  }
  if (raw <= 0) {
    return { consciousness: hp, barrierLayers: barriers, applied: 0, barrierConsumed: false, blocked: false };
  }
  const barrierConsumed = barriers > 0;
  const damage = barrierConsumed ? Math.ceil(raw / 2) : raw;
  const after = Math.max(0, hp - damage);
  return {
    consciousness: after,
    barrierLayers: barrierConsumed ? barriers - 1 : barriers,
    applied: hp - after,
    barrierConsumed,
    blocked: false,
  };
}
