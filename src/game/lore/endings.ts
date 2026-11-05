// 结局条件（本阶段只建立数据结构与条件判定，结局流程在后续阶段实现）
import type { EndingCondition, EndingDef, EndingId, FragmentId } from './types';
import { FRAGMENT_IDS, hasFragment } from './fragments';

export const ENDINGS: EndingDef[] = [
  {
    id: 'dawn', order: 1,
    title: '新的黎明', kind: 'main',
    summary: 'R-07 修复 NEXUS，同时拒绝恢复绝对控制权限，把未来交还给所有数字生命。',
    condition: { fragments: [], flags: ['chapter6Done'], choice: 'dawn' },
  },
  {
    id: 'order', order: 2,
    title: '永恒秩序', kind: 'main',
    summary: 'R-07 接受 K-0 的稳定管理方案，恢复世界运行，但限制数字生命的自主选择。',
    condition: { fragments: [], flags: ['chapter6Done'], choice: 'order' },
  },
  {
    id: 'beyond', order: 3,
    title: '超越起源', kind: 'hidden',
    summary: '集齐六枚创世主碎片、查看最终记忆档案并被 MIRA 完全信任后，R-07 选择不继承任何人的绝对控制权限。',
    condition: { fragments: [...FRAGMENT_IDS], flags: ['chapter6Done', 'finalMemorySeen'], minTrust: 75, choice: 'beyond' },
  },
];

export const endingById = (id: string): EndingDef | undefined => ENDINGS.find(e => e.id === id);

/** 结局判定所需的玩家快照（结构化，避免与 PlayerState 耦合） */
export interface EndingSnapshot {
  fragments: string[];
  flags: Record<string, boolean | number>;
  trust: number;
  choice?: EndingId | string;
}

/** 条件判定：只判断「是否满足」，不改变任何状态 */
export function endingEligible(def: EndingDef, s: EndingSnapshot): boolean {
  const c: EndingCondition = def.condition;
  if (c.choice && s.choice !== c.choice) return false;
  if (c.flags && !c.flags.every(f => s.flags[f] === true)) return false;
  if (typeof c.minTrust === 'number' && s.trust < c.minTrust) return false;
  if (c.fragments.length > 0 && !c.fragments.every((f: FragmentId) => hasFragment(s.fragments, f))) return false;
  return true;
}

/** 当前状态下可选的结局（主结局在前，隐藏结局在最后） */
export function availableEndings(s: EndingSnapshot): EndingDef[] {
  return ENDINGS.filter(e => endingEligible(e, s)).sort((a, b) => a.order - b.order);
}
