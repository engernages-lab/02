// 剧情域统一类型（纯类型，无运行时依赖）
export type CharacterId = 'r07' | 'mira' | 'engel' | 'k0';
export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6';
export type FragmentId = 'frag-01' | 'frag-02' | 'frag-03' | 'frag-04' | 'frag-05' | 'frag-06';
export type EndingId = 'dawn' | 'order' | 'beyond';
export type StoryEventKind = 'prologue' | 'tutorial' | 'chapter' | 'boss' | 'rebirth' | 'ending';

/** 角色档案（四位核心角色，固定设定） */
export interface CharacterDef {
  id: CharacterId;
  /** 固定编号（仅 R-07 有） */
  originCode?: string;
  /** 显示名 */
  name: string;
  fullName: string;
  /** 身份 / 职务 */
  role: string;
  faction: 'silicon' | 'system' | 'creator' | 'arbiter';
  color: string;
  /** 语音画像 id（与 services/voice 的 role 对应） */
  voiceKind: string;
  /** 公开档案（默认可读） */
  bio: string;
  /** 未解锁时显示的档案（剧透保护） */
  secret: string;
  quote: string;
  unlock: { kind: 'default' | 'flag'; flag?: string };
}

/** 六章剧情配置（正式蓝本 ↔ 现有教学结构映射） */
export interface ChapterDef {
  id: ChapterId;
  order: number;
  /** 正式章节名（蓝本） */
  title: string;
  /** 现有服务器/区域名（保留原有教学结构） */
  area: string;
  serverId: string;
  /** 规范要求的 Boss 代号 */
  bossId: string;
  /** 当前代码里实际存在的 Boss id（第六章暂无） */
  currentBossId: string | null;
  fragmentId: FragmentId;
  /** 本章必须承载的核心剧情事件（蓝本） */
  coreEvent: string;
  knowledgeFocus: string[];
  /** 章节完成剧情事件 id */
  storyEventId: string;
  /** 章节完成标记（沿用现有 flags，不改语义） */
  doneFlag: string;
}

// 创世主碎片的数据结构在 fragments.ts（含完整剧情与记忆影像）
export interface EndingCondition {
  /** 需要的碎片（全部满足） */
  fragments: FragmentId[];
  /** 需要的剧情变量为真 */
  flags?: string[];
  minTrust?: number;
  /** 玩家在终章的选择 */
  choice?: EndingId;
}

export interface EndingDef {
  id: EndingId;
  order: number;
  title: string;
  kind: 'main' | 'hidden';
  summary: string;
  condition: EndingCondition;
}

/** 演出背景 */
export type SceneBg = 'underground' | 'corridor' | 'dataport' | 'core' | 'void' | 'memory' | 'terminal';
/** 演出特效 */
export type SceneFx = 'none' | 'glitch' | 'alarm' | 'scan' | 'flicker' | 'particles';

/** 演出台词（在基础台词上扩展演出指令） */
export interface CinematicLine {
  id: string;
  speaker: string;
  /** 与 story.ts 的 SpeakerKind 对应（type-only 引用，避免运行时依赖） */
  kind: import('../story').SpeakerKind;
  text: string;
  choices?: { label: string; next?: string }[];
  /** 需要玩家输入的步骤（目前只有显示名设置） */
  input?: 'playerName';
  /** 播放音效（services/sound 的 SfxName） */
  sfx?: string;
  /** 信任度台词变体（达到 min 时优先使用） */
  altByTrust?: { min: number; text: string }[];
}

/** 一段独立演出（场景 = 背景 + 特效 + 若干台词） */
export interface StoryScene {
  id: string;
  title: string;
  subtitle?: string;
  bg: SceneBg;
  fx?: SceneFx;
  lines: CinematicLine[];
}

/** 剧情事件（解锁 / 阅读统计的最小单位） */
export interface StoryEventDef {
  id: string;
  kind: StoryEventKind;
  chapter?: ChapterId;
  title: string;
  /** 解锁条件（剧情变量 key，缺省=默认解锁） */
  requireFlag?: string;
}
