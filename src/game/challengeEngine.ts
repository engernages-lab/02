// 挑战运行状态机（V1.3-A A1）：一次挑战会话的生命周期与资源消耗的唯一执行层
//
// 与 challengeSession.ts 的分工：
//   - challengeSession.ts：关卡「统计与结算」的唯一数据源（运行 / 提交 / 失误 / 容错 / 奖励），已并入存档；
//   - 本模块：V1.3-A 新增的「规则执行层」——把限时 / 次数 / 连锁 / 多阶段等限制与状态机抽出来，
//     由挑战页 / 独立测试入口消费。判定结果仍交给 services/judge.ts，奖励仍走 challengeSession / 经济账本。
// 本阶段只做纯逻辑 + 可序列化状态，不直接写存档、不改 DOM。

import type { ChallengeRules } from './challengeRules';

export type ChallengeRunStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface BugState {
  id: string;
  label: string;
  fixed: boolean;
  dependsOn: string[];
}

export interface StageState {
  id: string;
  label: string;
  done: boolean;
}

export interface HiddenTestState {
  id: string;
  label: string;
  passed: boolean | null;
}

export interface RunLimits {
  timeLimitSec: number | null;
  maxRuns: number | null;
  maxSubmits: number | null;
  maxHints: number | null;
}

export interface ChallengeRunState {
  id: string;
  challengeId: string;
  status: ChallengeRunStatus;
  startedAt: number;
  endedAt: number | null;
  limits: RunLimits;
  runsUsed: number;
  submitsUsed: number;
  hintsUsed: number;
  /** 限时挑战的绝对截止时间戳；null = 不限时 */
  deadlineAt: number | null;
  pausedAt: number | null;
  pausedTotalMs: number;
  bugs: BugState[];
  stages: StageState[];
  stageIndex: number;
  hiddenTests: HiddenTestState[];
  result: 'passed' | 'failed' | null;
  settledAt: number | null;
  rewardMultiplier: number;
}

const int = (v: unknown, fb = 0): number =>
  typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fb;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function createChallengeRun(
  challengeId: string,
  rules: ChallengeRules,
  opts: {
    now: number;
    id?: string;
    bugs?: BugState[];
    stages?: StageState[];
    hiddenTests?: HiddenTestState[];
  },
): ChallengeRunState {
  const now = opts.now;
  return {
    id: opts.id ?? challengeId + '@' + now,
    challengeId,
    status: 'active',
    startedAt: now,
    endedAt: null,
    limits: {
      timeLimitSec: rules.timeLimitSec,
      maxRuns: rules.maxRuns,
      maxSubmits: rules.maxSubmits,
      maxHints: rules.maxHints,
    },
    runsUsed: 0,
    submitsUsed: 0,
    hintsUsed: 0,
    deadlineAt: rules.timeLimitSec != null ? now + rules.timeLimitSec * 1000 : null,
    pausedAt: null,
    pausedTotalMs: 0,
    bugs: (opts.bugs ?? []).map((b) => ({ ...b, fixed: false })),
    stages: (opts.stages ?? []).map((s) => ({ ...s, done: false })),
    stageIndex: 0,
    hiddenTests: (opts.hiddenTests ?? []).map((h) => ({ ...h, passed: null })),
    result: null,
    settledAt: null,
    rewardMultiplier: rules.rewardMultiplier,
  };
}

/** pending → active（已开始时幂等） */
export function start(run: ChallengeRunState, now: number): ChallengeRunState {
  if (run.status === 'active') return run;
  if (run.status !== 'pending') return run;
  return {
    ...run,
    status: 'active',
    startedAt: now,
    deadlineAt: run.limits.timeLimitSec != null ? now + run.limits.timeLimitSec * 1000 : run.deadlineAt,
  };
}

export function pause(run: ChallengeRunState, now: number): ChallengeRunState {
  if (run.status !== 'active') return run;
  return { ...run, status: 'paused', pausedAt: now };
}

export function resume(run: ChallengeRunState, now: number): ChallengeRunState {
  if (run.status !== 'paused') return run;
  const pausedMs = run.pausedAt != null ? Math.max(0, now - run.pausedAt) : 0;
  return {
    ...run,
    status: 'active',
    pausedAt: null,
    pausedTotalMs: run.pausedTotalMs + pausedMs,
    // 暂停期间不计时：把截止时间顺延等长
    deadlineAt: run.deadlineAt != null ? run.deadlineAt + pausedMs : run.deadlineAt,
  };
}

/** 结算（成功 / 失败）：只允许发生一次 */
export function complete(
  run: ChallengeRunState,
  now: number,
  result: 'passed' | 'failed',
): ChallengeRunState {
  if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') return run;
  if (run.status !== 'active' && run.status !== 'paused') return run;
  return {
    ...run,
    status: result === 'passed' ? 'completed' : 'failed',
    endedAt: now,
    settledAt: now,
    result,
    pausedAt: null,
  };
}

export function cancel(run: ChallengeRunState, now: number): ChallengeRunState {
  if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') return run;
  return { ...run, status: 'cancelled', endedAt: now, pausedAt: null };
}

export function isTerminal(run: ChallengeRunState): boolean {
  return run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled';
}

/** 剩余时间（毫秒）；不限时返回 null */
export function remainingMs(run: ChallengeRunState, now: number): number | null {
  if (run.deadlineAt == null) return null;
  return Math.max(0, run.deadlineAt - now);
}

export function isTimedOut(run: ChallengeRunState, now: number): boolean {
  return run.status === 'active' && run.deadlineAt != null && now >= run.deadlineAt;
}

// ---------- 资源消耗 ----------
export function canRun(run: ChallengeRunState): boolean {
  return run.status === 'active' && (run.limits.maxRuns == null || run.runsUsed < run.limits.maxRuns);
}

export function canSubmit(run: ChallengeRunState): boolean {
  return run.status === 'active' && (run.limits.maxSubmits == null || run.submitsUsed < run.limits.maxSubmits);
}

export function canHint(run: ChallengeRunState): boolean {
  return run.status === 'active' && (run.limits.maxHints == null || run.hintsUsed < run.limits.maxHints);
}

export function recordRun(run: ChallengeRunState): ChallengeRunState {
  if (!canRun(run)) return run;
  return { ...run, runsUsed: run.runsUsed + 1 };
}

export function recordSubmit(run: ChallengeRunState): ChallengeRunState {
  if (!canSubmit(run)) return run;
  return { ...run, submitsUsed: run.submitsUsed + 1 };
}

export function recordHint(run: ChallengeRunState): ChallengeRunState {
  if (!canHint(run)) return run;
  return { ...run, hintsUsed: run.hintsUsed + 1 };
}

export function remainingRuns(run: ChallengeRunState): number | null {
  return run.limits.maxRuns == null ? null : clamp(run.limits.maxRuns - run.runsUsed, 0, run.limits.maxRuns);
}

export function remainingSubmits(run: ChallengeRunState): number | null {
  return run.limits.maxSubmits == null ? null : clamp(run.limits.maxSubmits - run.submitsUsed, 0, run.limits.maxSubmits);
}

export function remainingHints(run: ChallengeRunState): number | null {
  return run.limits.maxHints == null ? null : clamp(run.limits.maxHints - run.hintsUsed, 0, run.limits.maxHints);
}

// ---------- 连锁 Bug ----------
/** 修复一个 Bug：依赖未全部修复时不可修复（保证连锁顺序） */
export function fixBug(run: ChallengeRunState, bugId: string): ChallengeRunState {
  if (run.status !== 'active') return run;
  const target = run.bugs.find((b) => b.id === bugId);
  if (!target || target.fixed) return run;
  const depsOk = target.dependsOn.every((d) => run.bugs.find((b) => b.id === d)?.fixed === true);
  if (!depsOk) return run;
  return { ...run, bugs: run.bugs.map((b) => (b.id === bugId ? { ...b, fixed: true } : b)) };
}

export function allBugsFixed(run: ChallengeRunState): boolean {
  return run.bugs.length > 0 && run.bugs.every((b) => b.fixed);
}

// ---------- 多阶段 ----------
/** 完成当前阶段；不允许跳阶段 */
export function completeStage(run: ChallengeRunState, stageId: string): ChallengeRunState {
  if (run.status !== 'active') return run;
  if (run.stageIndex >= run.stages.length) return run;
  const current = run.stages[run.stageIndex];
  if (!current || current.id !== stageId) return run;
  return {
    ...run,
    stages: run.stages.map((s, i) => (i === run.stageIndex ? { ...s, done: true } : s)),
    stageIndex: run.stageIndex + 1,
  };
}

export function allStagesDone(run: ChallengeRunState): boolean {
  return run.stages.length > 0 && run.stageIndex >= run.stages.length;
}

// ---------- 隐藏测试 ----------
export function markHiddenTest(run: ChallengeRunState, id: string, passed: boolean): ChallengeRunState {
  return {
    ...run,
    hiddenTests: run.hiddenTests.map((h) => (h.id === id ? { ...h, passed } : h)),
  };
}

export function allHiddenPassed(run: ChallengeRunState): boolean {
  return run.hiddenTests.length > 0 && run.hiddenTests.every((h) => h.passed === true);
}

// ---------- 序列化自愈 ----------
/** 规范化一个运行状态（供未来持久化 / 旧数据自愈），永不抛错 */
export function normalizeRun(raw: unknown): ChallengeRunState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ChallengeRunState>;
  const challengeId = typeof r.challengeId === 'string' && r.challengeId ? r.challengeId : '';
  if (!challengeId) return null;
  const status: ChallengeRunStatus =
    r.status === 'pending' || r.status === 'active' || r.status === 'paused' ||
    r.status === 'completed' || r.status === 'failed' || r.status === 'cancelled'
      ? r.status
      : 'active';
  const startedAt = int(r.startedAt, 0);
  return {
    id: typeof r.id === 'string' && r.id ? r.id : challengeId + '@' + startedAt,
    challengeId,
    status,
    startedAt,
    endedAt: typeof r.endedAt === 'number' && isFinite(r.endedAt) ? r.endedAt : null,
    limits: {
      timeLimitSec: typeof r.limits?.timeLimitSec === 'number' ? r.limits.timeLimitSec : null,
      maxRuns: typeof r.limits?.maxRuns === 'number' ? r.limits.maxRuns : null,
      maxSubmits: typeof r.limits?.maxSubmits === 'number' ? r.limits.maxSubmits : null,
      maxHints: typeof r.limits?.maxHints === 'number' ? r.limits.maxHints : null,
    },
    runsUsed: int(r.runsUsed),
    submitsUsed: int(r.submitsUsed),
    hintsUsed: int(r.hintsUsed),
    deadlineAt: typeof r.deadlineAt === 'number' && isFinite(r.deadlineAt) ? r.deadlineAt : null,
    pausedAt: typeof r.pausedAt === 'number' && isFinite(r.pausedAt) ? r.pausedAt : null,
    pausedTotalMs: int(r.pausedTotalMs),
    bugs: Array.isArray(r.bugs)
      ? r.bugs.map((b) => ({
          id: String((b as BugState).id ?? ''),
          label: String((b as BugState).label ?? ''),
          fixed: (b as BugState).fixed === true,
          dependsOn: Array.isArray((b as BugState).dependsOn) ? (b as BugState).dependsOn.map(String) : [],
        }))
      : [],
    stages: Array.isArray(r.stages)
      ? r.stages.map((s) => ({
          id: String((s as StageState).id ?? ''),
          label: String((s as StageState).label ?? ''),
          done: (s as StageState).done === true,
        }))
      : [],
    stageIndex: Math.min(int(r.stageIndex), Array.isArray(r.stages) ? r.stages.length : 0),
    hiddenTests: Array.isArray(r.hiddenTests)
      ? r.hiddenTests.map((h) => ({
          id: String((h as HiddenTestState).id ?? ''),
          label: String((h as HiddenTestState).label ?? ''),
          passed: (h as HiddenTestState).passed === true ? true : (h as HiddenTestState).passed === false ? false : null,
        }))
      : [],
    result: r.result === 'passed' || r.result === 'failed' ? r.result : null,
    settledAt: typeof r.settledAt === 'number' && isFinite(r.settledAt) ? r.settledAt : null,
    rewardMultiplier: typeof r.rewardMultiplier === 'number' && isFinite(r.rewardMultiplier) ? r.rewardMultiplier : 1,
  };
}

/** 规范化整个运行表（challengeId → 运行状态），丢弃无法修复的条目，永不抛错 */
export function normalizeChallengeRuns(raw: unknown): Record<string, ChallengeRunState> {
  const out: Record<string, ChallengeRunState> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const r = normalizeRun(value);
    if (r) out[key] = r;
  }
  return out;
}
