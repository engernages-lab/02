// 多类型代码挑战机制（V1.3-A A2）：五种挑战类型的「模板构建器」
//
// 只负责把散落的输入组装成合法的 ChallengeDef（含规则 + 判题 + 初始代码），
// 不参与判题（judge.ts）与结算（challengeSession.ts / challengeEngine.ts）。

import type { ChallengeRules, ChallengeType, ChallengeDifficulty, FailurePenalty } from './challengeRules';
import { validateChallengeRules } from './challengeRules';
import type { LevelJudgeSpec } from './types';
import type { BugState, StageState, HiddenTestState } from './challengeEngine';

export interface ChallengeDef {
  id: string;
  title: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  rules: ChallengeRules;
  judge: LevelJudgeSpec;
  initialCode: string;
  /** 参考解答（仅测试 / 说明用，不展示给玩家） */
  reference: string;
  goal: string;
  fault: string;
  rewardExp: number;
  bugs?: BugState[];
  stages?: StageState[];
  hiddenTests?: HiddenTestState[];
  /** 隐藏测试的判题表达式（只用于判题，绝不展示给玩家） */
  hiddenChecks?: { name: string; expr: string }[];
}

export interface ChallengeBuildInput {
  id: string;
  title: string;
  difficulty?: ChallengeDifficulty;
  timeLimitSec?: number | null;
  maxRuns?: number | null;
  maxSubmits?: number | null;
  maxHints?: number | null;
  judge: LevelJudgeSpec;
  initialCode: string;
  reference: string;
  goal: string;
  fault: string;
  rewardExp: number;
  notes?: string;
  failurePenalty?: FailurePenalty;
  eventsEnabled?: boolean;
  allowHintTicket?: boolean;
  allowItems?: boolean;
  bugs?: BugState[];
  stages?: StageState[];
  hiddenTests?: HiddenTestState[];
  hiddenChecks?: { name: string; expr: string }[];
}

function build(type: ChallengeType, input: ChallengeBuildInput): ChallengeDef {
  const { rules } = validateChallengeRules({
    type,
    difficulty: input.difficulty ?? 'normal',
    timeLimitSec: input.timeLimitSec,
    maxRuns: input.maxRuns,
    maxSubmits: input.maxSubmits,
    maxHints: input.maxHints,
    hiddenTests: type === 'hidden-bug',
    hiddenTestCount: type === 'hidden-bug' ? (input.hiddenTests?.length ?? 1) : undefined,
    chainBugs: type === 'chain-bug',
    eventsEnabled: input.eventsEnabled,
    allowHintTicket: input.allowHintTicket,
    allowItems: input.allowItems,
    failurePenalty: input.failurePenalty,
    notes: input.notes,
  });
  return {
    id: input.id,
    title: input.title,
    type,
    difficulty: rules.difficulty,
    rules,
    judge: input.judge,
    initialCode: input.initialCode,
    reference: input.reference,
    goal: input.goal,
    fault: input.fault,
    rewardExp: Math.max(0, Math.floor(input.rewardExp)),
    bugs: input.bugs,
    stages: input.stages,
    hiddenTests: input.hiddenTests,
    hiddenChecks: input.hiddenChecks,
  };
}

export const buildTimedChallenge = (input: ChallengeBuildInput): ChallengeDef => build('timed', input);

export const buildChainBugChallenge = (input: ChallengeBuildInput): ChallengeDef => build('chain-bug', input);

export const buildHiddenBugChallenge = (input: ChallengeBuildInput): ChallengeDef => build('hidden-bug', input);

export const buildResourceLimitedChallenge = (input: ChallengeBuildInput): ChallengeDef =>
  build('resource-limited', input);

export const buildMultiStageChallenge = (input: ChallengeBuildInput): ChallengeDef => build('multi-stage', input);

export const CHALLENGE_TYPE_LABEL: Record<ChallengeType, string> = {
  standard: '标准修复',
  timed: '限时修复',
  'chain-bug': '连锁 Bug',
  'hidden-bug': '隐藏 Bug',
  'resource-limited': '资源限制',
  'multi-stage': '多阶段',
};

export const CHALLENGE_TYPE_ORDER: ChallengeType[] = [
  'timed',
  'chain-bug',
  'hidden-bug',
  'resource-limited',
  'multi-stage',
];
