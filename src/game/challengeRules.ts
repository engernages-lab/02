// 统一挑战规则（V1.3-A A1）：可配置的挑战限制，与判题 / 诊断 / 事件 / 结算解耦
//
// 边界约定：
//   1. 规则只决定「玩家需要遵守什么限制」；判题仍由 services/judge.ts 负责，规则不篡改执行结果；
//   2. 校验函数永不抛错：非法配置回退到安全默认值并记录 issue，绝不因坏数据白屏；
//   3. 难度只通过限制 / 数量 / 系数体现，不靠「多扣惩罚」提高难度。

export type ChallengeType =
  | 'standard'
  | 'timed'
  | 'chain-bug'
  | 'hidden-bug'
  | 'resource-limited'
  | 'multi-stage';

export type ChallengeDifficulty = 'normal' | 'advanced' | 'elite' | 'special';

export interface FailurePenalty {
  kind: 'consciousness' | 'none';
  amount: number;
}

export interface ChallengeRules {
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  /** 时间限制（秒）；null = 不限时 */
  timeLimitSec: number | null;
  /** 最大运行次数；null = 不限，0 = 禁用运行 */
  maxRuns: number | null;
  maxSubmits: number | null;
  maxHints: number | null;
  hiddenTests: boolean;
  hiddenTestCount: number;
  chainBugs: boolean;
  eventsEnabled: boolean;
  allowHintTicket: boolean;
  allowItems: boolean;
  failurePenalty: FailurePenalty;
  rewardMultiplier: number;
  notes: string;
}

export interface RulesValidation {
  rules: ChallengeRules;
  issues: string[];
}

export const CHALLENGE_TYPES: ChallengeType[] = [
  'standard',
  'timed',
  'chain-bug',
  'hidden-bug',
  'resource-limited',
  'multi-stage',
];

export interface DifficultyPreset {
  label: string;
  timeLimitSec: number | null;
  maxRuns: number | null;
  maxSubmits: number | null;
  maxHints: number | null;
  hiddenTestCount: number;
  rewardMultiplier: number;
}

export const DIFFICULTY_PRESETS: Record<ChallengeDifficulty, DifficultyPreset> = {
  normal:   { label: '普通', timeLimitSec: null, maxRuns: null, maxSubmits: null, maxHints: null, hiddenTestCount: 0, rewardMultiplier: 1 },
  advanced: { label: '进阶', timeLimitSec: 300, maxRuns: 12,  maxSubmits: 6,    maxHints: 2,    hiddenTestCount: 1, rewardMultiplier: 1.25 },
  elite:    { label: '精英', timeLimitSec: 180, maxRuns: 8,   maxSubmits: 4,    maxHints: 1,    hiddenTestCount: 2, rewardMultiplier: 1.5 },
  special:  { label: '特殊', timeLimitSec: 120, maxRuns: 5,   maxSubmits: 3,    maxHints: 0,    hiddenTestCount: 3, rewardMultiplier: 2 },
};

export const DEFAULT_RULES: ChallengeRules = {
  type: 'standard',
  difficulty: 'normal',
  timeLimitSec: null,
  maxRuns: null,
  maxSubmits: null,
  maxHints: null,
  hiddenTests: false,
  hiddenTestCount: 0,
  chainBugs: false,
  eventsEnabled: false,
  allowHintTicket: true,
  allowItems: true,
  failurePenalty: { kind: 'none', amount: 0 },
  rewardMultiplier: 1,
  notes: '',
};

const isNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v);

function optLimit(
  v: unknown,
  presetVal: number | null,
  issues: string[],
  label: string,
): number | null {
  if (v === null) return null;
  if (v === undefined) return presetVal;
  if (!isNum(v)) {
    issues.push(label + ' 不是有效数字，回退难度预设');
    return presetVal;
  }
  if (v < 0) {
    issues.push(label + ' 为负，视为 0（禁用该操作）');
    return 0;
  }
  return Math.min(100, Math.floor(v));
}

/** 校验并规范化挑战规则；永不抛错，非法字段回退默认并记录 issue */
export function validateChallengeRules(raw: unknown): RulesValidation {
  if (!raw || typeof raw !== 'object') {
    return { rules: { ...DEFAULT_RULES }, issues: ['规则配置为空，已使用默认规则'] };
  }
  const r = raw as Record<string, unknown>;
  const issues: string[] = [];

  let difficulty: ChallengeDifficulty = 'normal';
  if (typeof r.difficulty === 'string' && r.difficulty in DIFFICULTY_PRESETS) {
    difficulty = r.difficulty as ChallengeDifficulty;
  } else if (r.difficulty !== undefined) {
    issues.push('无效难度 "' + String(r.difficulty) + '"，回退为普通');
  }
  const preset = DIFFICULTY_PRESETS[difficulty];

  let type: ChallengeType = 'standard';
  if (typeof r.type === 'string' && (CHALLENGE_TYPES as string[]).includes(r.type)) {
    type = r.type as ChallengeType;
  } else if (r.type !== undefined) {
    issues.push('无效挑战类型 "' + String(r.type) + '"，回退为标准');
  }

  // 时间限制：null / 正数合法；负数 / 非法 → 不限时
  let timeLimitSec = preset.timeLimitSec;
  if (r.timeLimitSec === null) {
    timeLimitSec = null;
  } else if (isNum(r.timeLimitSec)) {
    if (r.timeLimitSec < 0) {
      issues.push('时间限制为负，视为不限时');
      timeLimitSec = null;
    } else {
      timeLimitSec = Math.floor(r.timeLimitSec);
    }
  } else if (r.timeLimitSec !== undefined) {
    issues.push('时间限制无效，视为不限时');
    timeLimitSec = null;
  }
  if (type === 'timed' && timeLimitSec === null) {
    timeLimitSec = 120;
    issues.push('限时挑战未配置时间，默认 120 秒');
  }

  const maxRuns = optLimit(r.maxRuns, preset.maxRuns, issues, '最大运行次数');
  const maxSubmits = optLimit(r.maxSubmits, preset.maxSubmits, issues, '最大提交次数');
  const maxHints = optLimit(r.maxHints, preset.maxHints, issues, '最大提示次数');

  const hiddenTests = r.hiddenTests === true;
  const hiddenTestCount = isNum(r.hiddenTestCount)
    ? Math.min(20, Math.max(0, Math.floor(r.hiddenTestCount)))
    : preset.hiddenTestCount;
  const chainBugs = r.chainBugs === true;
  const eventsEnabled = r.eventsEnabled === true;
  const allowHintTicket = r.allowHintTicket !== false;
  const allowItems = r.allowItems !== false;

  let rewardMultiplier = preset.rewardMultiplier;
  if (isNum(r.rewardMultiplier)) {
    rewardMultiplier = Math.min(5, Math.max(0.1, r.rewardMultiplier));
  } else if (r.rewardMultiplier !== undefined) {
    issues.push('无效奖励系数，回退难度预设');
  }

  let failurePenalty: FailurePenalty = { kind: 'none', amount: 0 };
  if (r.failurePenalty && typeof r.failurePenalty === 'object') {
    const fp = r.failurePenalty as Record<string, unknown>;
    const kind = fp.kind === 'consciousness' ? 'consciousness' : 'none';
    const amount = isNum(fp.amount) ? Math.min(100, Math.max(0, Math.floor(fp.amount))) : 0;
    failurePenalty = { kind, amount };
  }

  const notes = typeof r.notes === 'string' ? r.notes : '';

  return {
    rules: {
      type,
      difficulty,
      timeLimitSec,
      maxRuns,
      maxSubmits,
      maxHints,
      hiddenTests,
      hiddenTestCount,
      chainBugs,
      eventsEnabled,
      allowHintTicket,
      allowItems,
      failurePenalty,
      rewardMultiplier,
      notes,
    },
    issues,
  };
}

/** 难度 → 奖励系数（供结算使用） */
export function rewardMultiplierFor(difficulty: ChallengeDifficulty): number {
  return DIFFICULTY_PRESETS[difficulty]?.rewardMultiplier ?? 1;
}
