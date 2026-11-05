// 剧情事件：解锁状态 + 阅读状态记录
// 兼容旧存档：progress.storySeen（节点 id → boolean）会被合并进 story.seen（节点 id → 次数）。
import type { ChapterId, StoryEventDef, StoryEventKind } from './types';

export interface StoryReadState {
  /** 已解锁的剧情事件 id */
  unlocked: string[];
  /** 已阅读的对话节点 id → 阅读次数 */
  seen: Record<string, number>;
  /** 分支选择记录：节点 id → 选项文本 */
  choices: Record<string, string>;
  /** 最近播放的事件 id */
  lastEventId: string | null;
}

export const STORY_EVENTS: StoryEventDef[] = [
  { id: 'prologue', kind: 'prologue', title: '序章 · 沉睡的意识' },
  { id: 'tutorial-done', kind: 'tutorial', title: '训练终端 · 接驳完成' },
  { id: 'chapter-1', kind: 'chapter', chapter: 'ch1', title: '第一章 · 失落的数据港', requireFlag: 'chapter1Done' },
  { id: 'chapter-2', kind: 'chapter', chapter: 'ch2', title: '第二章 · 破碎的记忆花园', requireFlag: 'chapter2Done' },
  { id: 'chapter-3', kind: 'chapter', chapter: 'ch3', title: '第三章 · 被遗忘的实验档案', requireFlag: 'chapter3Done' },
  { id: 'chapter-4', kind: 'chapter', chapter: 'ch4', title: '第四章 · 失控的核心工坊', requireFlag: 'chapter4Done' },
  { id: 'chapter-5', kind: 'chapter', chapter: 'ch5', title: '第五章 · 黎明崩塌的真相', requireFlag: 'chapter5Done' },
  { id: 'chapter-6', kind: 'chapter', chapter: 'ch6', title: '第六章 · 起源之外', requireFlag: 'chapter6Done' },
  { id: 'boss-gate-01', kind: 'boss', chapter: 'ch1', title: '章节 Boss · GATE-01 数据港守卫' },
  { id: 'boss-echo-02', kind: 'boss', chapter: 'ch2', title: 'Boss 遭遇 · ECHO-02' },
  { id: 'boss-echo-03', kind: 'boss', chapter: 'ch3', title: 'Boss 遭遇 · ECHO-03' },
  { id: 'boss-echo-04', kind: 'boss', chapter: 'ch4', title: 'Boss 遭遇 · ECHO-04' },
  { id: 'boss-echo-05', kind: 'boss', chapter: 'ch5', title: 'Boss 遭遇 · ECHO-05' },
  { id: 'rebirth', kind: 'rebirth', title: 'ORIGIN PROTOCOL · 意识重组' },
];

export const storyEventById = (id: string): StoryEventDef | undefined => STORY_EVENTS.find(e => e.id === id);

export function defaultStoryReadState(): StoryReadState {
  return { unlocked: [], seen: {}, choices: {}, lastEventId: null };
}

/** 清洗阅读状态；legacySeen 为旧存档的 progress.storySeen */
export function normalizeStoryReadState(
  raw: unknown,
  legacySeen?: Record<string, boolean> | null,
): StoryReadState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<StoryReadState>;
  const seen: Record<string, number> = {};
  if (r.seen && typeof r.seen === 'object') {
    for (const [k, v] of Object.entries(r.seen as Record<string, unknown>)) {
      if (!k) continue;
      const n = typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : v === true ? 1 : 0;
      if (n > 0) seen[k] = Math.min(999, n);
    }
  }
  if (legacySeen && typeof legacySeen === 'object') {
    for (const [k, v] of Object.entries(legacySeen)) {
      if (!k || v !== true) continue;
      if (!seen[k]) seen[k] = 1;
    }
  }
  const unlocked = Array.isArray(r.unlocked)
    ? [...new Set(r.unlocked.filter((x): x is string => typeof x === 'string' && x.length > 0))]
    : [];
  const choices: Record<string, string> = {};
  if (r.choices && typeof r.choices === 'object') {
    for (const [k, v] of Object.entries(r.choices as Record<string, unknown>)) {
      if (k && typeof v === 'string') choices[k] = v;
    }
  }
  return {
    unlocked,
    seen,
    choices,
    lastEventId: typeof r.lastEventId === 'string' ? r.lastEventId : null,
  };
}

/** 记录一个对话节点被阅读（幂等累加次数） */
export function markNodeSeen(state: StoryReadState, nodeId: string): StoryReadState {
  if (!nodeId) return state;
  const n = state.seen[nodeId] || 0;
  if (n >= 999) return state;
  return { ...state, seen: { ...state.seen, [nodeId]: n + 1 } };
}

/** 解锁剧情事件（幂等） */
export function unlockEvent(state: StoryReadState, eventId: string): StoryReadState {
  if (!eventId || state.unlocked.includes(eventId)) return state;
  return { ...state, unlocked: [...state.unlocked, eventId], lastEventId: eventId };
}

/** 记录分支选择（同一节点重复选择时保留最新一次） */
export function recordChoice(state: StoryReadState, nodeId: string, label: string): StoryReadState {
  if (!nodeId || !label) return state;
  return { ...state, choices: { ...state.choices, [nodeId]: label } };
}

export const isEventUnlocked = (state: StoryReadState, eventId: string): boolean =>
  state.unlocked.includes(eventId);

/** 某事件的阅读进度（按节点统计） */
export function eventReadProgress(
  state: StoryReadState,
  nodeIds: string[],
): { read: number; total: number } {
  const total = nodeIds.length;
  const read = nodeIds.filter(id => (state.seen[id] || 0) > 0).length;
  return { read, total };
}

/** 事件按类型分组（档案页展示用） */
export function eventsByKind(kind: StoryEventKind): StoryEventDef[] {
  return STORY_EVENTS.filter(e => e.kind === kind);
}

/** 章节对应的事件 id */
export function chapterEventId(chapter: ChapterId): string {
  return 'chapter-' + chapter.slice(2);
}
