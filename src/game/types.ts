// 核心游戏类型定义
import type { RewardState } from './rewards';
import type { VoiceSettings } from '../services/voice';
import type { PlayerIdentity } from './identity';
import type { StoryReadState } from './lore/events';
import type { BossBattleState } from './battle';

export type Screen =
  | 'boot' | 'menu' | 'story' | 'map' | 'challenge'
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
  /** 碎片归档记录：碎片 id → 获得时间（毫秒；0 表示旧档早期归档） */
  fragmentLog?: Record<string, number>;
  /** Bug 图鉴记录：条目 id → { 次数, 首次时间 } */
  bugCodex?: Record<string, { count: number; firstAt: number }>;
  backupLevel: number;       // 意识备份等级
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
  bossesDone: string[];                      // 已击破的章节 Boss
  /** Boss 战进度（v4 起；旧存档由迁移补齐） */
  battles?: Record<string, BossBattleState>;
  /** 记忆档案馆阅读状态（v6 起；旧存档由迁移补齐） */
  vault?: VaultState;
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
}
