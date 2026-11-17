// 挑战会话（challengeSession）：一次挑战过程中所有统计与结算的唯一数据源
//
// 设计原则（A4）：
//   1. 会话按关卡 id 存储，进入新关卡一定新建会话——上一关的错误数 / 容错 / 奖励不会串场；
//   2. 运行、提交、失误、提示都在会话里累加，页面只读会话，不再各算一套；
//   3. 结算只写一次（status 从 active 迁移到 passed/failed），重复调用不会重复发奖；
//   4. 容错上限由等级推导，剩余 = max(0, 上限 - 失误)，永不出现负数或超上限；
//   5. 所有入口都做 normalize，旧存档 / 空值 / 脏数据不会产生 NaN。

import { toleranceFor, MAX_LEVEL } from './progression';

export type ChallengeStatus = 'active' | 'passed' | 'failed';
export type ChallengeKind = 'level' | 'boss';

export interface ChallengeSettlement {
  result: 'passed' | 'failed';
  at: number;
  /** 本次挑战耗时（毫秒） */
  durationMs: number;
  runs: number;
  submits: number;
  errors: number;
  hints: number;
  /** 结算时的容错上限 */
  toleranceMax: number;
  /** 已使用的容错次数（= errors，封顶到上限用于展示） */
  toleranceUsed: number;
  toleranceRemaining: number;
  /** 本次升级带来的容错上限增量（0 表示没有增加） */
  toleranceGain: number;
  /** 已达到该等级段的容错上限（本次没有增加，且不会再有增加） */
  toleranceCapped: boolean;
  /** 下一次容错提升的等级与上限（没有则为 null） */
  toleranceNextLevel: number | null;
  toleranceNextMax: number | null;
  levelBefore: number;
  levelAfter: number;
  expBefore: number;
  expAfter: number;
  expGained: number;
  creditsGained: number;
  /** 失败原因（通过时为空） */
  reason?: string;
  /** 实际损失的资源（目前只有意识值） */
  resourceLoss?: { kind: 'consciousness'; amount: number };
}

export interface ChallengeSession {
  id: string;
  levelId: string;
  kind: ChallengeKind;
  status: ChallengeStatus;
  startedAt: number;
  endedAt: number | null;
  runs: number;
  submits: number;
  errors: number;
  hints: number;
  /** 进入挑战时的容错上限（等级可能在过程中提升） */
  toleranceMax: number;
  settlement: ChallengeSettlement | null;
}

/** 存档里最多保留多少个会话（避免无限增长） */
export const SESSION_KEEP = 12;

const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && isFinite(v) ? v : fallback);
const int = (v: unknown, fallback = 0): number => Math.max(0, Math.floor(num(v, fallback)));

export function createSession(levelId: string, kind: ChallengeKind, now: number, toleranceMax: number): ChallengeSession {
  return {
    id: levelId + '@' + now,
    levelId,
    kind,
    status: 'active',
    startedAt: now,
    endedAt: null,
    runs: 0,
    submits: 0,
    errors: 0,
    hints: 0,
    toleranceMax: Math.max(1, int(toleranceMax, 3)),
    settlement: null,
  };
}

/** 进入挑战：同一关的进行中会话保留（刷新/重进不丢统计），已结算的则开新会话 */
export function beginSession(
  existing: ChallengeSession | null | undefined,
  levelId: string,
  kind: ChallengeKind,
  now: number,
  toleranceMax: number,
): ChallengeSession {
  if (existing && existing.levelId === levelId && existing.status === 'active') return existing;
  return createSession(levelId, kind, now, toleranceMax);
}

export function countRun(s: ChallengeSession): ChallengeSession {
  if (s.status !== 'active') return s;
  return { ...s, runs: s.runs + 1 };
}

export function countSubmit(s: ChallengeSession): ChallengeSession {
  if (s.status !== 'active') return s;
  return { ...s, submits: s.submits + 1 };
}

export function countHint(s: ChallengeSession): ChallengeSession {
  if (s.status !== 'active') return s;
  return { ...s, hints: s.hints + 1 };
}

export function countError(s: ChallengeSession): ChallengeSession {
  if (s.status !== 'active') return s;
  return { ...s, errors: s.errors + 1 };
}

/** 剩余容错：永不小于 0 */
export function toleranceRemaining(max: number, used: number): number {
  return Math.max(0, int(max) - int(used));
}

/**
 * 等级变化带来的容错上限变化。
 * 容错是台阶函数（Lv1-2:3, 3-4:4, 5-6:5, 7-8:6, 9-10:7）：
 * 升级但不跨台阶时 gain=0，此时给出下一次提升的等级，而不是谎报 +0 奖励。
 */
export function toleranceOutcome(levelBefore: number, levelAfter: number): {
  maxBefore: number;
  maxAfter: number;
  gain: number;
  capped: boolean;
  nextLevel: number | null;
  nextMax: number | null;
} {
  const before = Math.min(MAX_LEVEL, Math.max(1, Math.round(levelBefore)));
  const after = Math.min(MAX_LEVEL, Math.max(1, Math.round(levelAfter)));
  const maxBefore = toleranceFor(before);
  const maxAfter = toleranceFor(after);
  let nextLevel: number | null = null;
  let nextMax: number | null = null;
  for (let lv = after + 1; lv <= MAX_LEVEL; lv++) {
    if (toleranceFor(lv) > maxAfter) { nextLevel = lv; nextMax = toleranceFor(lv); break; }
  }
  return {
    maxBefore,
    maxAfter,
    gain: Math.max(0, maxAfter - maxBefore),
    capped: after >= MAX_LEVEL && maxAfter >= 7,
    nextLevel,
    nextMax,
  };
}

export function durationOf(s: ChallengeSession, now: number): number {
  const end = s.endedAt ?? now;
  return Math.max(0, end - s.startedAt);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(num(ms) / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return mm + ':' + ss;
}

export interface PassSettleInput {
  now: number;
  levelBefore: number;
  levelAfter: number;
  expBefore: number;
  expAfter: number;
  creditsGained: number;
}

export function buildPassedSettlement(s: ChallengeSession, input: PassSettleInput): ChallengeSettlement {
  const tol = toleranceOutcome(input.levelBefore, input.levelAfter);
  const used = Math.min(int(s.errors), tol.maxAfter);
  return {
    result: 'passed',
    at: input.now,
    durationMs: durationOf(s, input.now),
    runs: int(s.runs),
    submits: int(s.submits),
    errors: int(s.errors),
    hints: int(s.hints),
    toleranceMax: tol.maxAfter,
    toleranceUsed: used,
    toleranceRemaining: toleranceRemaining(tol.maxAfter, used),
    toleranceGain: tol.gain,
    toleranceCapped: tol.capped,
    toleranceNextLevel: tol.nextLevel,
    toleranceNextMax: tol.nextMax,
    levelBefore: input.levelBefore,
    levelAfter: input.levelAfter,
    expBefore: input.expBefore,
    expAfter: input.expAfter,
    expGained: Math.max(0, int(input.expAfter) - int(input.expBefore)),
    creditsGained: Math.max(0, int(input.creditsGained)),
  };
}

export function buildFailedSettlement(
  s: ChallengeSession,
  input: { now: number; reason: string; levelNow: number; expNow: number; consciousnessLoss: number },
): ChallengeSettlement {
  const max = Math.max(1, int(s.toleranceMax, toleranceFor(input.levelNow)));
  const used = Math.min(int(s.errors), max);
  return {
    result: 'failed',
    at: input.now,
    durationMs: durationOf(s, input.now),
    runs: int(s.runs),
    submits: int(s.submits),
    errors: int(s.errors),
    hints: int(s.hints),
    toleranceMax: max,
    toleranceUsed: used,
    toleranceRemaining: toleranceRemaining(max, used),
    toleranceGain: 0,
    toleranceCapped: false,
    toleranceNextLevel: null,
    toleranceNextMax: null,
    levelBefore: Math.round(input.levelNow),
    levelAfter: Math.round(input.levelNow),
    expBefore: int(input.expNow),
    expAfter: int(input.expNow),
    expGained: 0,
    creditsGained: 0,
    reason: input.reason || '意识完整度归零',
    resourceLoss: { kind: 'consciousness', amount: Math.max(0, int(input.consciousnessLoss)) },
  };
}

/** 把会话标记为已结算（只允许 active → passed/failed 一次） */
export function settle(s: ChallengeSession, settlement: ChallengeSettlement): ChallengeSession {
  if (s.status !== 'active') return s;
  return {
    ...s,
    status: settlement.result,
    endedAt: settlement.at,
    settlement,
  };
}

/** 旧存档 / 脏数据自愈：无法修复的会话直接丢弃，不阻塞其它数据 */
export function normalizeSession(raw: unknown): ChallengeSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ChallengeSession>;
  const levelId = typeof r.levelId === 'string' && r.levelId ? r.levelId : '';
  if (!levelId) return null;
  const status: ChallengeStatus = r.status === 'passed' || r.status === 'failed' ? r.status : 'active';
  const startedAt = int(r.startedAt, 0);
  const s: ChallengeSession = {
    id: typeof r.id === 'string' && r.id ? r.id : levelId + '@' + startedAt,
    levelId,
    kind: r.kind === 'boss' ? 'boss' : 'level',
    status,
    startedAt,
    endedAt: typeof r.endedAt === 'number' && isFinite(r.endedAt) ? r.endedAt : null,
    runs: int(r.runs),
    submits: int(r.submits),
    errors: int(r.errors),
    hints: int(r.hints),
    toleranceMax: Math.max(1, int(r.toleranceMax, 3)),
    settlement: normalizeSettlement(r.settlement),
  };
  if (s.status !== 'active' && !s.settlement) {
    // 状态是已结算但结算体缺失：退回进行中，避免展示残缺结算
    s.status = 'active';
    s.endedAt = null;
  }
  return s;
}

export function normalizeSettlement(raw: unknown): ChallengeSettlement | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ChallengeSettlement>;
  if (r.result !== 'passed' && r.result !== 'failed') return null;
  const max = Math.max(1, int(r.toleranceMax, 3));
  const used = Math.min(int(r.toleranceUsed, int(r.errors)), max);
  return {
    result: r.result,
    at: int(r.at, 0),
    durationMs: int(r.durationMs),
    runs: int(r.runs),
    submits: int(r.submits),
    errors: int(r.errors),
    hints: int(r.hints),
    toleranceMax: max,
    toleranceUsed: used,
    toleranceRemaining: toleranceRemaining(max, used),
    toleranceGain: int(r.toleranceGain),
    toleranceCapped: r.toleranceCapped === true,
    toleranceNextLevel: typeof r.toleranceNextLevel === 'number' && isFinite(r.toleranceNextLevel) ? r.toleranceNextLevel : null,
    toleranceNextMax: typeof r.toleranceNextMax === 'number' && isFinite(r.toleranceNextMax) ? r.toleranceNextMax : null,
    levelBefore: Math.max(1, int(r.levelBefore, 1)),
    levelAfter: Math.max(1, int(r.levelAfter, 1)),
    expBefore: int(r.expBefore),
    expAfter: int(r.expAfter),
    expGained: int(r.expGained),
    creditsGained: int(r.creditsGained),
    reason: typeof r.reason === 'string' ? r.reason : undefined,
    resourceLoss: r.resourceLoss && (r.resourceLoss as { kind?: string }).kind === 'consciousness'
      ? { kind: 'consciousness', amount: int((r.resourceLoss as { amount?: unknown }).amount) }
      : undefined,
  };
}

/** 规范化整个会话表，并按开始时间保留最近 SESSION_KEEP 个 */
export function normalizeSessions(raw: unknown): Record<string, ChallengeSession> {
  const out: Record<string, ChallengeSession> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const s = normalizeSession(value);
    if (s) out[key] = s;
  }
  const entries = Object.entries(out).sort((a, b) => (b[1].startedAt || 0) - (a[1].startedAt || 0));
  return entries.slice(0, SESSION_KEEP).reduce<Record<string, ChallengeSession>>((acc, [k, v]) => {
    acc[k] = v;
    return acc;
  }, {});
}
