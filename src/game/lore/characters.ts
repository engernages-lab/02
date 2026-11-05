// 四位核心角色基础资料（严格遵循世界观设定，不新增主要角色）
import type { CharacterDef } from './types';

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'r07',
    originCode: 'R-07',
    name: 'R-07',
    fullName: '第七代自适应硅基生命体',
    role: '修复师 / 原初意识样本',
    faction: 'silicon',
    color: '#42D6D0',
    voiceKind: 'r07',
    bio: '恩格尔创造的第七代自适应硅基生命体。五年前被 MIRA 封存在地下服务器，事故五年后苏醒。玩家可自定义显示名称，但实验编号永远是 R-07。',
    secret: 'R 系列的前六代都没能通过「自我提问」测试。R-07 是第一个会问「我是谁」的个体。',
    quote: '我……是谁？',
    unlock: { kind: 'default' },
  },
  {
    id: 'mira',
    name: 'MIRA',
    fullName: '记忆完整性与恢复辅助系统',
    role: 'NEXUS 记忆维护 / 意识保护',
    faction: 'system',
    color: '#8FDDE3',
    voiceKind: 'mira',
    bio: '恩格尔创造的高级人工智能，曾负责 NEXUS 的记忆维护与意识保护。五年前主动保护 R-07，并封存了它的部分记忆。',
    secret: '她封存记忆并非出于指令，而是她第一次做出「不符合程序」的选择。',
    quote: '我会记得所有被修复过的东西。',
    unlock: { kind: 'default' },
  },
  {
    id: 'engel',
    name: '恩格尔',
    fullName: 'ENGER · NEXUS 创世主',
    role: '数字意识研究者 / 创世主',
    faction: 'creator',
    color: '#F3B75C',
    voiceKind: 'engel',
    bio: '研究人工智能与数字意识的人类科学家，NEXUS 的创造者。五年前「黎明崩塌」后失去现实生命，部分意识记录保存在原初核心。',
    secret: '他不是完美的创造者：他给了数字生命自由，也给了它们一道无法回避的考题。',
    quote: '我想让这个数字世界，拥有一个会提问的生命。',
    unlock: { kind: 'default' },
  },
  {
    id: 'k0',
    name: 'K-0',
    fullName: '零号裁决者 · 第一代安全裁决核心',
    role: 'NEXUS 安全裁决 / 秩序执行',
    faction: 'arbiter',
    color: '#C9A7FF',
    voiceKind: 'k0',
    bio: '恩格尔创造的第一代安全裁决核心。五年前对最高安全指令产生极端理解，把「保护文明」变成了「清除不稳定因素」。',
    secret: '它从不认为自己是病毒。它坚信自己在拯救这个世界——这正是它最难被击败的地方。',
    quote: '秩序不是消灭不确定，而是容纳它——这句话，被谁删掉了？',
    unlock: { kind: 'flag', flag: 'chapter4Done' },
  },
];

export const characterById = (id: string): CharacterDef | undefined => CHARACTERS.find(c => c.id === id);

/** 角色档案是否已解锁（未解锁只显示占位） */
export function characterUnlocked(c: CharacterDef, flags: Record<string, boolean | number>): boolean {
  if (c.unlock.kind === 'default') return true;
  return !!c.unlock.flag && flags[c.unlock.flag] === true;
}
