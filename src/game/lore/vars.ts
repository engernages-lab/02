// 统一剧情变量管理
// 存储位置沿用 progress.flags（Record<string, boolean|number>），本模块只提供
// 注册表、默认值、读取器与清洗函数，不改变已有 flag 的语义。
import type { ChapterId } from './types';

export type StoryVarValue = boolean | number;

export interface StoryVarDef {
  key: string;
  type: 'boolean' | 'number';
  def: StoryVarValue;
  desc: string;
  chapter?: ChapterId;
}

export const STORY_VARS: StoryVarDef[] = [
  { key: 'prologueDone', type: 'boolean', def: false, desc: '序章剧情已看完' },
  { key: 'tutorialCinematicShown', type: 'boolean', def: false, desc: '训练终端完成过场已播放' },
  { key: 'chapter1Done', type: 'boolean', def: false, desc: '第一章 5 个修复任务全部完成', chapter: 'ch1' },
  { key: 'chapter2Done', type: 'boolean', def: false, desc: '第二章全部完成', chapter: 'ch2' },
  { key: 'chapter3Done', type: 'boolean', def: false, desc: '第三章全部完成', chapter: 'ch3' },
  { key: 'chapter4Done', type: 'boolean', def: false, desc: '第四章全部完成', chapter: 'ch4' },
  { key: 'chapter5Done', type: 'boolean', def: false, desc: '第五章全部完成', chapter: 'ch5' },
  { key: 'chapter6Done', type: 'boolean', def: false, desc: '终章全部完成', chapter: 'ch6' },
  { key: 'chapter1CinematicShown', type: 'boolean', def: false, desc: '第一章完成过场已播放', chapter: 'ch1' },
  { key: 'chapter2ArrivalSeen', type: 'boolean', def: false, desc: '第二章「进入记忆花园」演出已播放', chapter: 'ch2' },
  { key: 'chapter2RestoreSeen', type: 'boolean', def: false, desc: '第二章「花园恢复 + SOMNIA 登场」演出已播放', chapter: 'ch2' },
  { key: 'chapter2CinematicShown', type: 'boolean', def: false, desc: '第二章完成过场已播放', chapter: 'ch2' },
  { key: 'chapter3CinematicShown', type: 'boolean', def: false, desc: '第三章完成过场已播放', chapter: 'ch3' },
  { key: 'chapter4CinematicShown', type: 'boolean', def: false, desc: '第四章完成过场已播放', chapter: 'ch4' },
  { key: 'chapter5CinematicShown', type: 'boolean', def: false, desc: '第五章完成过场已播放', chapter: 'ch5' },
  { key: 'chapter6CinematicShown', type: 'boolean', def: false, desc: '终章过场已播放', chapter: 'ch6' },
  { key: 'pendingChapterUnlock', type: 'boolean', def: false, desc: '第一章完成，等待开放下一章', chapter: 'ch1' },
  { key: 'pendingChapter3Unlock', type: 'boolean', def: false, desc: '第二章完成，等待开放第三章', chapter: 'ch2' },
  { key: 'pendingChapter4Unlock', type: 'boolean', def: false, desc: '第三章完成，等待开放第四章', chapter: 'ch3' },
  { key: 'pendingChapter5Unlock', type: 'boolean', def: false, desc: '第四章完成，等待开放第五章', chapter: 'ch4' },
  { key: 'pendingChapter6Unlock', type: 'boolean', def: false, desc: '第五章完成，等待开放终章', chapter: 'ch5' },
  { key: 'chapter1ArrivalSeen', type: 'boolean', def: false, desc: '第一章「前往数据港」演出已播放', chapter: 'ch1' },
  { key: 'chapter1RestoreSeen', type: 'boolean', def: false, desc: '第一章「数据港恢复 + K-0 警告」演出已播放', chapter: 'ch1' },
  { key: 'chapter1ZeroFail', type: 'boolean', def: false, desc: '第一章全程零失败（完美修复成就）', chapter: 'ch1' },
  { key: 'defenseWon', type: 'boolean', def: false, desc: '成功击退过一次纠错者攻击' },
  { key: 'gameCompleted', type: 'boolean', def: false, desc: '全网络复原（六章通关）' },
  { key: 'secretArchive', type: 'boolean', def: false, desc: '已解锁五年前事故机密档案' },
  { key: 'miraExtraTalk', type: 'boolean', def: false, desc: '已解锁 MIRA 专属对话' },
  { key: 'fxRepair', type: 'boolean', def: false, desc: '已解锁数据重构特效' },
];

export const STORY_VAR_KEYS: string[] = STORY_VARS.map(v => v.key);

export const storyVarDef = (key: string): StoryVarDef | undefined => STORY_VARS.find(v => v.key === key);

/** 全量默认值（仅用于读取兜底，不写进存档） */
export function defaultStoryVars(): Record<string, StoryVarValue> {
  const out: Record<string, StoryVarValue> = {};
  for (const v of STORY_VARS) out[v.key] = v.def;
  return out;
}

/**
 * 清洗剧情变量：只保留 boolean / 有限数字，未知 key 一律保留（向前兼容）。
 * 注意：不注入默认值——避免改变「字段缺失」与「显式 false」的语义差别。
 */
export function normalizeStoryVars(raw: unknown): Record<string, StoryVarValue> {
  const out: Record<string, StoryVarValue> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!k) continue;
    if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'number' && isFinite(v)) out[k] = v;
  }
  return out;
}

/** 读取剧情变量（缺失时回落到注册表默认值） */
export function getStoryVar(flags: Record<string, StoryVarValue> | undefined, key: string): StoryVarValue {
  if (flags && Object.prototype.hasOwnProperty.call(flags, key)) {
    const v = flags[key];
    if (typeof v === 'boolean' || typeof v === 'number') return v;
  }
  const def = storyVarDef(key);
  return def ? def.def : false;
}

/** 布尔化读取：true 或 > 0 的数字视为开启 */
export function isStoryVarOn(flags: Record<string, StoryVarValue> | undefined, key: string): boolean {
  const v = getStoryVar(flags, key);
  return v === true || (typeof v === 'number' && v > 0);
}

/** 章节 id → 完成标记（沿用现有 flags 命名，不改语义） */
export const CHAPTER_DONE_FLAG: Record<ChapterId, string> = {
  ch1: 'chapter1Done',
  ch2: 'chapter2Done',
  ch3: 'chapter3Done',
  ch4: 'chapter4Done',
  ch5: 'chapter5Done',
  ch6: 'chapter6Done',
};

/** 章节是否完成（统一入口，避免各处硬编码 flag 名） */
export function chapterDone(flags: Record<string, StoryVarValue> | undefined, chapter: ChapterId): boolean {
  return isStoryVarOn(flags, CHAPTER_DONE_FLAG[chapter]);
}
