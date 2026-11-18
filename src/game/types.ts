// 核心游戏类型定义
import type { RewardState } from './rewards';
import type { VoiceSettings } from '../services/voice';
import type { PlayerIdentity } from './identity';
import type { StoryReadState } from './lore/events';
import type { BossBattleState } from './battle';
import type { BossDifficulty } from './difficulty';
import type { ChallengeSession } from './challengeSession';
import type { ChallengeRunState } from './challengeEngine';
import type { DynamicEventState } from './eventEngine';

export type Screen =
  | 'boot' | 'menu' | 'story' | 'map' | 'challenge'
  | 'challengehub' | 'challengeplay'
  | 'profile' | 'settings' | 'knowledge' | 'achievements' | 'archive' | 'vault' | 'journal' | 'endings' | 'lab' | 'boss' | 'shop';

export interface GameSettings {
  musicVolume: number;       // 0..1
  sfxVolume: number;         // 0..1
  animations: boolean;       // 总动画开关
  animLevel: 'low' | 'high'; // 动画强度
  typewriterMs: number;      // 打字机每字符毫秒数
  fullscreen: boolean;
  lang: 'zh' | 'en';         // 语言（预留）
  voice?: VoiceSettings;     // 语音设置（v1.1 起；旧存档由 loadGame 补齐）
}

/** 记忆档案馆的阅读状态（v6 起） */
export interface VaultState {
  /** 已查看过的碎片 id */
  read: string[];
  /** 最终记忆档案是否已查看 */
  finalSeen: boolean;
  /** 上次查看的碎片（关闭页面后恢复用） */
  lastOpened: string | null;
}

export interface PlayerMeta {
  deaths: number;            // 累计死亡次数
  rebirths: number;          // 累计意识重组次数
  lastDeathLevel: string | null;
  lastDeathReason: string | null;
  memoryFragments: string[]; // 创世主记忆碎片 id
  /** 非主线的记忆日志（重生等叙事奖励，不计入创世主碎片） */
  memoryLogs?: string[];
  /** 碎片归档记录：碎片 id → 获得时间（毫秒；0 表示旧档早期归档） */
  fragmentLog?: Record<string, number>;
  /** Bug 图鉴记录：条目 id → { 次数, 首次时间 } */
  bugCodex?: Record<string, { count: number; firstAt: number }>;
  backupLevel: number;       // 意识备份等级
}

/** 章节主线状态（V1.1.1 起；每章一条，Boss 首胜由统一事务写入） */
export interface ChapterProgressState {
  /** 是否已首次击败本章 Boss（真实战斗或旧档继承） */
  bossDefeated: boolean;
  /** 首次击败时间（毫秒；旧档继承为 0 或碎片归档时间） */
  bossFirstClearAt: number | null;
  /** 首胜来源：真实战斗 / 旧版本进度继承（不得伪装成新版本战斗胜利） */
  bossClearSource: 'battle' | 'legacy-inherit' | null;
  /** 本章守护的创世主碎片 id */
  fragmentId: string | null;
  /** 碎片正式归位时间 */
  fragmentGrantedAt: number | null;
  /** 章节是否已完成（首胜 + 章节结算，开放下一章） */
  completed: boolean;
  completedAt: number | null;
  /** 本章开放时间（进入章节区域） */
  unlockedAt: number | null;
}

export type ChapterProgressMap = Record<string, ChapterProgressState>;

/** 旧存档进度继承审计（可追溯，不与真实 Boss 战胜利混淆） */
export interface LegacyMigrationAudit {
  at: number;
  fromVersion: number;
  reason: string;
  inheritedChapters: string[];
  grantedFragments: string[];
}

/** 原初核心门禁状态（第六章开放 与 原初核心开放 是两个独立状态） */
export interface OriginCoreProgress {
  /** 首次进入原初核心（K-0 战入口）的时间 */
  enteredAt: number | null;
  /** K-0 首次击败时间 */
  clearedAt: number | null;
}

/** 单个 Boss 的单个难度通关记录 */
export interface BossDifficultyRecord {
  /** 首次通关时间 */
  firstAt: number;
  /** 最近一次通关时间 */
  lastAt: number;
  /** 通关次数 */
  count: number;
  /** 是否已经发放该难度的一次性奖励（防刷） */
  rewarded: boolean;
}

/** 单个 Boss 的挑战记录（难度 / 通关 / 最高成绩） */
export interface BossRecord {
  /** 首次首胜难度 */
  firstDifficulty: BossDifficulty | null;
  /** 已通关过的最高难度 */
  bestDifficulty: BossDifficulty | null;
  /** 首次首胜时间 */
  firstClearAt: number | null;
  /** 各难度通关记录 */
  cleared: Partial<Record<BossDifficulty, BossDifficultyRecord>>;
  /** 已获得的最好章节评价（可选，展示用） */
  bestGrade?: string;
}

export interface Progress {
  completedLevels: string[];
  stars: Record<string, number>;             // 关卡最高星级 1-3
  unlockedServers: string[];
  currentLevelId: string | null;
  failedAttempts: Record<string, number>;    // 各关当前失败提交次数
  hintLevels: Record<string, number>;        // 每关已使用 MIRA 提示层级
  achievements: string[];
  knowledge: string[];                       // 已解锁知识卡片
  storySeen: Record<string, boolean>;        // 旧版剧情已读（v1，保留兼容）
  /** 剧情事件解锁 + 阅读状态（v2 起；旧存档由迁移补齐） */
  story?: StoryReadState;
  flags: Record<string, boolean | number>;   // 剧情/系统标记（由 lore/vars 统一管理）
  bossesDone: string[];                      // 已击破的章节 Boss（兼容旧字段）
  /** Boss 战进度（v4 起；旧存档由迁移补齐） */
  battles?: Record<string, BossBattleState>;
  /** 章节主线状态（V1.1.1 起；统一由 chapterFlow 读写，旧存档自愈继承） */
  chapters?: ChapterProgressMap;
  /** 旧存档进度继承审计 */
  migrationAudit?: LegacyMigrationAudit;
  /** 原初核心门禁记录 */
  originCore?: OriginCoreProgress;
  /** Boss 难度挑战记录：bossId → 记录（V1.1.1 难度系统） */
  bossRecords?: Record<string, BossRecord>;
  /** 记忆档案馆阅读状态（v6 起；旧存档由迁移补齐） */
  vault?: VaultState;
  /** 挑战会话（v8 起）：按关卡 id 记录运行/提交/失误/容错与结算，旧存档由迁移补齐 */
  challengeSessions?: Record<string, ChallengeSession>;
  /** 独立挑战运行状态（V1.3-A 起）：challengeId → 运行状态机，刷新/重进可安全恢复 */
  challengeRuns?: Record<string, ChallengeRunState>;
  /** 当前进行中的动态事件（未知入侵等）；null = 无事件 */
  dynamicEvent?: DynamicEventState | null;
  /** 动态事件冷却表：defId → 最近触发时间（毫秒） */
  eventCooldowns?: Record<string, number>;
  /** 已解锁的结局 id（第九阶段） */
  endings?: string[];
  /** 玩家最终选择的结局 */
  ending?: string | null;
  currentBossId: string | null;              // 当前 Boss 战（不写入关卡进度）
  pendingRebirth: boolean;                   // 存档时已死亡，等待重生流程
}

export interface PlayerState {
  /** 显示名称（与 identity.displayName 同步，兼容旧组件读取） */
  name: string;
  /** 玩家身份：显示名可改，原始实验编号固定 R-07（v2 起） */
  identity?: PlayerIdentity;
  level: number;             // 1..10
  exp: number;               // 累计经验
  consciousness: number;     // 意识完整度 0..100
  meta: PlayerMeta;
  progress: Progress;
  settings: GameSettings;
  /** 奖励系统数据（v1.1 起；旧存档由 loadGame 补齐，不影响原有经验/等级） */
  rewards?: RewardState;
}

export interface SaveData {
  version: number;
  updatedAt: number;
  player: PlayerState;
}

// 运行时全局事件（不写入存档；刷新后由存档状态重新推导）
export type GameEvent =
  | { kind: 'none' }
  | { kind: 'attack'; levelId: string; defenseId: string; attemptsLeft: number }
  | { kind: 'death'; levelId: string; reason: string }
  | { kind: 'rebirth' };

export interface Toast { id: number; kind: 'info' | 'success' | 'warn' | 'achieve'; text: string }

// 判题规格（关卡数据的判题部分，由 judge.ts 消费）
export interface LevelJudgeSpec {
  judgeKind: 'stdout' | 'python';
  stdoutChecks?: { name: string; contains?: string[]; notContains?: string[]; lines?: string[] }[];
  pythonChecks?: { name: string; expr: string }[];
}

// Python 运行结果（判题引擎输入的最小形状）
export interface RunOutcomeShape {
  ok: boolean;
  stdout: string;
  stderr?: string;
  error?: { type: string; message: string; line?: number };
  timedOut: boolean;
  /** 调试轨迹：每步 {执行行号, 变量快照, 输出增量} */
  trace?: { line: number; vars: Record<string, string>; out?: string }[];
  /** 真实 traceback 原文（MicroPython sys.print_exception 捕获，V1.2-A A3 起） */
  traceback?: string;
}
