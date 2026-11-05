// 剧情时间线：只展示玩家已经解锁的内容，未解锁保持遮蔽
import type { PlayerState } from './types';
import { STORY_EVENTS } from './lore/events';
import { CREATOR_FRAGMENTS, hasFragment, fragmentProgress } from './lore/fragments';
import { ACHIEVEMENTS } from './achievements';
import { titleForLevel } from './progression';

export type TimelineKind = 'story' | 'memory' | 'growth' | 'mira';

export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  title: string;
  desc: string;
  locked: boolean;
  at?: number;
}

/** 按发生顺序构建时间线（只读，不写存档） */
export function buildTimeline(player: PlayerState): TimelineEntry[] {
  const story = player.progress.story;
  const unlocked = story?.unlocked || [];
  const seen = story?.seen || {};
  const out: TimelineEntry[] = [];

  // 1) 主线事件
  for (const e of STORY_EVENTS) {
    const read = seen[Object.keys(seen)[0] || ''] ? true : false; // 占位，真实判断在下方
    const isUnlocked = unlocked.includes(e.id) || hasAnyNode(e.id, seen);
    out.push({
      id: 'story:' + e.id,
      kind: 'story',
      title: isUnlocked ? e.title : '尚未抵达的事件',
      desc: isUnlocked ? '已记录 · 可在档案馆回放' : '继续推进主线以解锁',
      locked: !isUnlocked,
    });
  }

  // 2) 恩格尔记忆（碎片）
  for (const f of CREATOR_FRAGMENTS) {
    const has = hasFragment(player.meta.memoryFragments, f.id);
    out.push({
      id: 'memory:' + f.id,
      kind: 'memory',
      title: has ? '记忆碎片《' + f.title + '》' : '第 ' + f.order + ' 枚碎片 · 未归档',
      desc: has ? f.subtitle : '击败第 ' + f.order + ' 章 Boss 后归档',
      locked: !has,
      at: player.meta.fragmentLog?.[f.id],
    });
  }

  // 3) R-07 成长
  for (let lv = 1; lv <= 10; lv++) {
    const reached = player.level >= lv;
    out.push({
      id: 'growth:' + lv,
      kind: 'growth',
      title: reached ? 'Lv.' + lv + ' · ' + titleForLevel(lv) : 'Lv.' + lv + ' · 未达成',
      desc: reached ? '已达到该等级' : '继续修复服务器以提升等级',
      locked: !reached,
    });
  }
  for (const a of ACHIEVEMENTS) {
    const has = player.progress.achievements.includes(a.id);
    out.push({
      id: 'ach:' + a.id,
      kind: 'growth',
      title: has ? '成就 · ' + a.name : '未解锁的成就',
      desc: has ? a.desc : (a.hidden ? '隐藏成就' : a.desc),
      locked: !has,
    });
  }

  // 4) MIRA 记忆恢复（按碎片数量分阶段）
  const fp = fragmentProgress(player.meta.memoryFragments);
  out.push({
    id: 'mira:0',
    kind: 'mira',
    title: 'MIRA · 记忆索引重建',
    desc: '已归档 ' + fp.owned + ' / ' + fp.total + ' 枚创世主碎片，恢复进度 ' + Math.round((fp.owned / fp.total) * 100) + '%',
    locked: false,
  });
  if (fp.owned >= 2) out.push({ id: 'mira:2', kind: 'mira', title: 'MIRA · 记起了「约定」', desc: '第二章结束后，她开始主动谈起过去。', locked: false });
  if (fp.owned >= 4) out.push({ id: 'mira:4', kind: 'mira', title: 'MIRA · 恢复部分维护日志', desc: '她承认自己删改过你的记忆，也承认她害怕。', locked: false });
  if (fp.owned >= 6) out.push({ id: 'mira:6', kind: 'mira', title: 'MIRA · 完整记忆恢复', desc: '全部碎片归位，她不再需要隐瞒。', locked: false });

  return out;
}

/** 粗粒度节点判断：事件对应的台词节点是否已读过 */
function hasAnyNode(eventId: string, seen: Record<string, number>): boolean {
  const prefixes: Record<string, string[]> = {
    prologue: ['pro-'],
    'chapter-1': ['ch1-'],
    'chapter-2': ['ch2-'],
    tutorial: ['tut'],
  };
  const keys = Object.keys(seen);
  if (eventId.startsWith('boss-')) {
    const boss = eventId.replace('boss-', '');
    return keys.some(k => k.includes(boss));
  }
  const pre = prefixes[eventId];
  if (!pre) return false;
  return keys.some(k => pre.some(p => k.startsWith(p)));
}
