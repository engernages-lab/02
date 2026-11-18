// 未知入侵（V1.3-A A4）：动态事件引擎的第一个真实事件定义
//
// 本模块只声明配置与「六种恢复方式」的语义；状态流转由 eventEngine + store 完成，
// 展示由 IntrusionOverlay 完成。事件只影响自己的状态，绝不触碰经济 / 代码 / 草稿 / 判题 / 结算。
//
// 六种恢复方式（都必须实现并各自清理定时器 / 动画 / 监听 / 临时状态）：
//   1. 正常完成   —— 玩家完成隔离序列 → resolve('completed')；
//   2. 玩家退出   —— 玩家点击退出 → cancelEvent('cancelled')；
//   3. 超时       —— activeTimeoutMs 到期 → advance() 转为 resolving('timeout')；
//   4. 刷新清理   —— 载入存档时 normalizeEventState() 把已过期 / 已终结事件安全清理；
//   5. 异常恢复   —— 触发 / 推进 / 结算抛错时 recoverException('recovered')，永不锁死；
//   6. 重复触发保护 —— tryTrigger() 的 cooldown / mutex / already-presenting 三重判定。

import { registerEvent, type EventDefinition } from '../eventEngine';

export const UNKNOWN_INTRUSION_ID = 'unknown-intrusion';

export const UNKNOWN_INTRUSION_DEF: EventDefinition = {
  id: UNKNOWN_INTRUSION_ID,
  label: '未知入侵',
  priority: 100,
  mutualExclude: ['unknown-intrusion'],
  cooldownMs: 60_000,
  presentDurationMs: 1600,
  activeTimeoutMs: 45_000,
};

/** 入侵展示的六个阶段（表演用，顺序固定） */
export const INTRUSION_PHASES = ['探测', '渗透', '潜伏', '激活', '扩散', '反制'] as const;

/** 完成隔离序列所需的确认步数 */
export const INTRUSION_RECOVER_STEPS = 3;

/** 玩家在隔离序列中允许的失误次数（超过则强制超时解除） */
export const INTRUSION_MAX_MISSES = 3;

/** 入侵数据（可序列化，写入 dynamicEvent.data） */
export interface IntrusionData {
  /** 已完成的恢复确认步数 */
  step: number;
  /** 剩余失误次数 */
  missesLeft: number;
}

export function defaultIntrusionData(): IntrusionData {
  return { step: 0, missesLeft: INTRUSION_MAX_MISSES };
}

/** 从事件 data 中读取入侵数据（自愈，永不抛错） */
export function intrusionDataOf(data: Record<string, unknown> | undefined): IntrusionData {
  const d = data && typeof data === 'object' ? (data as Partial<IntrusionData>) : {};
  const step = typeof d.step === 'number' && isFinite(d.step) ? Math.max(0, Math.min(INTRUSION_RECOVER_STEPS, Math.floor(d.step))) : 0;
  const missesLeft = typeof d.missesLeft === 'number' && isFinite(d.missesLeft)
    ? Math.max(0, Math.min(INTRUSION_MAX_MISSES, Math.floor(d.missesLeft)))
    : INTRUSION_MAX_MISSES;
  return { step, missesLeft };
}

/** 初始化注册（幂等） */
export function registerUnknownIntrusion(): void {
  registerEvent(UNKNOWN_INTRUSION_DEF);
}
