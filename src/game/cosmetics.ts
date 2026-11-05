// 外观元数据与装备解析（商店皮肤 + 等级解锁共用）
import { normalizeRewards, type RewardState } from './rewards';
import { LEVEL_UNLOCKS } from './economy';

export interface SkinMeta { id: string; name: string; slot: 'terminal' | 'particles' | 'title' | 'avatarFrame' | 'login' | 'bg' }

export const SKIN_META: SkinMeta[] = [
  { id: 'terminal-neon', name: '终端主题 · 霓虹脉冲', slot: 'terminal' },
  { id: 'terminal-deep', name: '终端主题 · 深海回路', slot: 'terminal' },
  { id: 'particles-net', name: '粒子背景 · 数据流', slot: 'particles' },
  { id: 'title-junior', name: '称号 · 初级修复师', slot: 'title' },
  { id: 'title-successor', name: '称号 · 原初继承者', slot: 'title' },
  { id: 'login-gold', name: '登录界面 · 黄金协议', slot: 'login' },
  { id: 'bg-ark', name: '数字世界背景 · 方舟核心', slot: 'bg' },
  { id: 'frame-bronze', name: '头像框 · 青铜回路', slot: 'avatarFrame' },
  { id: 'frame-neon', name: '头像框 · 霓虹脉冲', slot: 'avatarFrame' },
  ...LEVEL_UNLOCKS.filter(u => u.slot).map(u => ({ id: u.id, name: u.name, slot: u.slot! })),
];

export const skinMetaById = (id: string): SkinMeta | undefined => SKIN_META.find(s => s.id === id);

/** 装备槽位（商店商品或等级解锁） */
export function slotOf(id: string): SkinMeta['slot'] | undefined {
  return skinMetaById(id)?.slot;
}

/** 已装备称号名（没有则返回 null，交给等级称号兜底） */
export function equippedTitleName(rewards: RewardState | undefined): string | null {
  const rw = normalizeRewards(rewards);
  const id = rw.equipped.title;
  if (!id) return null;
  return skinMetaById(id)?.name.replace(/^称号 · /, '') || null;
}

/** 已装备头像框的样式类 */
export function equippedFrameClass(rewards: RewardState | undefined): string {
  const rw = normalizeRewards(rewards);
  const id = rw.equipped.avatarFrame;
  if (!id) return '';
  if (id === 'frame-core') return 'frame-core';
  if (id === 'frame-bronze') return 'frame-bronze';
  if (id === 'frame-neon') return 'frame-neon';
  return '';
}
