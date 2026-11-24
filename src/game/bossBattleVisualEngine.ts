// Boss 战斗视觉运行时（V1.3-B.6.1）
//
// 纯状态机 + 可订阅 runtime：注册/触发/优先级/队列/中断/清理/性能降级。
// 视觉优先级与 B.1~B.4 战斗事件优先级完全独立，绝不改变战斗结果。

import {
  BOSS_VISUAL_EFFECTS,
  MAX_ACTIVE_EFFECTS, MAX_PARTICLE_BUDGET, MAX_QUEUED_EFFECTS,
  VISUAL_INTENSITY_PROFILES, VISUAL_PRIORITY,
  type VisualEffectDef, type VisualEffectType, type VisualIntensity,
  type VisualPerformanceLevel, type VisualPerformanceMode, type ActivePerformanceMode,
  activePerformanceMode, modeSeverity, performanceLevelForMode,
} from './bossBattleVisualConfig';

export type VisualEffectStatus = 'created' | 'queued' | 'playing' | 'completed' | 'interrupted' | 'cancelled' | 'error';
export type VisualLayerName = string;

export interface VisualEffectInstance {
  instanceId: string;
  effectId: string;
  effectType: VisualEffectType;
  priority: number;
  layer: VisualLayerName;
  intensity: number;
  color?: string;
  reducedMotionAlternative: 'fade' | 'none';
  duration: number;
  interruptible: boolean;
  exclusiveGroup: string;
  queueable: boolean;
  status: VisualEffectStatus;
  startedAt: number | null;
  endsAt: number | null;
  cleanupExecuted: boolean;
  createdAt: number;
}

export interface VisualRuntimeState {
  active: VisualEffectInstance[];
  queued: VisualEffectInstance[];
  completed: VisualEffectInstance[];
  sequence: number;
  cleanupCount: number;
  droppedCount: number;
  interruptedCount: number;
  lastTransitionAt: number;
  lastCleanupAt: number | null;
}

export interface VisualTriggerOptions {
  intensity?: VisualIntensity;
  performance?: VisualPerformanceLevel;
  reducedMotion?: boolean;
  /** NORMAL / REDUCED / LOW / CRITICAL；AUTO 由调用方解析为实际模式。 */
  performanceMode?: VisualPerformanceMode;
}

export interface VisualTriggerResult {
  state: VisualRuntimeState;
  accepted: boolean;
  instance: VisualEffectInstance | null;
  reason?: 'duplicate' | 'queued' | 'dropped' | 'invalid' | 'disabled';
}

export function createVisualRuntime(now: number = Date.now()): VisualRuntimeState {
  return {
    active: [], queued: [], completed: [], sequence: 0, cleanupCount: 0,
    droppedCount: 0, interruptedCount: 0, lastTransitionAt: now, lastCleanupAt: null,
  };
}

function cloneInstance(e: VisualEffectInstance): VisualEffectInstance {
  return { ...e };
}

function effectiveIntensity(
  def: VisualEffectDef,
  intensity: VisualIntensity,
  reduced: boolean,
  mode: VisualPerformanceMode = 'NORMAL',
): number {
  const profile = VISUAL_INTENSITY_PROFILES[intensity] || VISUAL_INTENSITY_PROFILES.MEDIUM;
  let v = Math.max(0, Math.min(1, def.intensity * (profile.flash + 0.5)));
  if (reduced) {
    if (def.effectType === 'shake' || def.effectType === 'glitch') v = 0;
    else v *= 0.35;
  }
  const flashing = def.effectType === 'flash' || def.effectType === 'shake' || def.effectType === 'glitch';
  if (mode === 'CRITICAL') {
    if (flashing) v = 0;
    else v *= 0.45;
  } else if (mode === 'LOW') {
    v *= flashing ? 0.25 : 0.6;
  } else if (mode === 'REDUCED') {
    v *= flashing ? 0.65 : 0.85;
  }
  return Math.round(v * 100) / 100;
}

function makeInstance(def: VisualEffectDef, state: VisualRuntimeState, now: number, opts: VisualTriggerOptions): VisualEffectInstance {
  const reduced = opts.reducedMotion === true;
  return {
    instanceId: def.effectId + ':' + (state.sequence + 1),
    effectId: def.effectId,
    effectType: def.effectType,
    priority: def.priority,
    layer: def.layer,
    intensity: effectiveIntensity(def, opts.intensity || 'MEDIUM', reduced, opts.performanceMode || 'NORMAL'),
    color: def.color,
    reducedMotionAlternative: def.reducedMotionAlternative,
    interruptible: def.interruptible,
    duration: def.duration,
    exclusiveGroup: def.exclusiveGroup,
    queueable: def.queueable,
    status: 'created',
    startedAt: null,
    endsAt: null,
    cleanupExecuted: false,
    createdAt: now,
  };
}

function cleanupInstance(e: VisualEffectInstance, status: VisualEffectStatus): { instance: VisualEffectInstance; cleaned: boolean } {
  const cleaned = !e.cleanupExecuted;
  return {
    instance: { ...e, status, cleanupExecuted: true },
    cleaned,
  };
}

export function triggerVisualEffect(
  state: VisualRuntimeState,
  def: VisualEffectDef,
  now: number = Date.now(),
  opts: VisualTriggerOptions = {},
): VisualTriggerResult {
  if (!def || typeof def.effectId !== 'string' || !def.effectId || !Number.isFinite(def.duration) || def.duration <= 0) {
    return { state: { ...state, droppedCount: state.droppedCount + 1 }, accepted: false, instance: null, reason: 'invalid' };
  }
  if (state.active.some(e => e.effectId === def.effectId) || state.queued.some(e => e.effectId === def.effectId)) {
    return { state, accepted: false, instance: null, reason: 'duplicate' };
  }

  let next: VisualRuntimeState = {
    ...state,
    active: [...state.active],
    queued: [...state.queued],
    completed: [...state.completed],
    sequence: state.sequence + 1,
    lastTransitionAt: now,
  };
  let cleanupCount = 0;
  const isTerminal = def.priority <= VISUAL_PRIORITY.terminal;
  let instance = makeInstance(def, next, now, opts);

  if (isTerminal) {
    for (const e of next.active) {
      const c = cleanupInstance(e, 'interrupted');
      if (c.cleaned) cleanupCount += 1;
      next.completed.push(c.instance);
    }
    for (const e of next.queued) {
      const c = cleanupInstance(e, 'cancelled');
      if (c.cleaned) cleanupCount += 1;
      next.completed.push(c.instance);
    }
    next.active = [];
    next.queued = [];
    next.interruptedCount += cleanupCount;
  } else {
    const sameGroup = next.active.filter(e => e.exclusiveGroup === def.exclusiveGroup);
    const higherActive = next.active.filter(e => e.priority < def.priority || e.priority === def.priority);
    if (sameGroup.length > 0 && def.priority >= Math.min(...sameGroup.map(e => e.priority))) {
      if (!def.queueable) return { state: { ...next, droppedCount: next.droppedCount + 1 }, accepted: false, instance: null, reason: 'dropped' };
      if (next.queued.length >= MAX_QUEUED_EFFECTS) {
        return { state: { ...next, droppedCount: next.droppedCount + 1 }, accepted: false, instance: null, reason: 'dropped' };
      }
      instance = { ...instance, status: 'queued' };
      next.queued = [...next.queued, instance];
      return { state: { ...next, queued: next.queued.slice(-MAX_QUEUED_EFFECTS) }, accepted: true, instance, reason: 'queued' };
    }
    if (higherActive.length > 0) {
      if (!def.queueable) return { state: { ...next, droppedCount: next.droppedCount + 1 }, accepted: false, instance: null, reason: 'dropped' };
      if (next.queued.length >= MAX_QUEUED_EFFECTS) {
        return { state: { ...next, droppedCount: next.droppedCount + 1 }, accepted: false, instance: null, reason: 'dropped' };
      }
      instance = { ...instance, status: 'queued' };
      next.queued = [...next.queued, instance];
      return { state: { ...next, queued: next.queued.slice(-MAX_QUEUED_EFFECTS) }, accepted: true, instance, reason: 'queued' };
    }
    // 新效果优先级更高：中断可中断的低优先级效果；不可中断的保留并队列。
    const blocked = next.active.filter(e => !e.interruptible && e.priority > def.priority);
    const removable = next.active.filter(e => e.interruptible && e.priority > def.priority);
    if (blocked.length > 0 && !def.queueable) {
      return { state: { ...next, droppedCount: next.droppedCount + 1 }, accepted: false, instance: null, reason: 'dropped' };
    }
    if (blocked.length > 0) {
      instance = { ...instance, status: 'queued' };
      next.queued = [...next.queued, instance].slice(-MAX_QUEUED_EFFECTS);
      return { state: next, accepted: true, instance, reason: 'queued' };
    }
    for (const e of removable) {
      const c = cleanupInstance(e, 'interrupted');
      if (c.cleaned) cleanupCount += 1;
      next.completed.push(c.instance);
      next.interruptedCount += 1;
    }
    next.active = next.active.filter(e => !removable.some(r => r.instanceId === e.instanceId));
  }

  instance = { ...instance, status: 'playing', startedAt: now, endsAt: now + Math.max(120, def.duration) };
  next.active = [...next.active, instance].slice(-MAX_ACTIVE_EFFECTS);
  next.cleanupCount += cleanupCount;
  if (cleanupCount > 0) next.lastCleanupAt = now;
  next.completed = next.completed.slice(-24);
  return { state: next, accepted: true, instance };
}

export function tickVisualEffects(state: VisualRuntimeState, now: number = Date.now()): VisualRuntimeState {
  if (state.active.length === 0 && state.queued.length === 0) return state;
  let changed = false;
  let next: VisualRuntimeState = {
    ...state,
    active: [...state.active],
    queued: [...state.queued],
    completed: [...state.completed],
  };
  let cleanupCount = 0;
  const stillActive: VisualEffectInstance[] = [];
  for (const e of next.active) {
    if (e.endsAt != null && now >= e.endsAt) {
      const c = cleanupInstance(e, 'completed');
      if (c.cleaned) cleanupCount += 1;
      next.completed.push(c.instance);
      changed = true;
    } else {
      stillActive.push(e);
    }
  }
  next.active = stillActive;
  if (next.active.length === 0 && next.queued.length > 0) {
    const ordered = [...next.queued].sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
    const nextEffect = ordered[0];
    next.queued = ordered.slice(1);
    next.active = [{ ...nextEffect, status: 'playing', startedAt: now, endsAt: now + Math.max(120, nextEffect.duration) }];
    changed = true;
  }
  if (!changed) return state;
  next.cleanupCount += cleanupCount;
  if (cleanupCount > 0) next.lastCleanupAt = now;
  next.completed = next.completed.slice(-24);
  next.lastTransitionAt = now;
  return next;
}

export function interruptVisualEffect(state: VisualRuntimeState, instanceOrEffectId: string, now: number = Date.now()): VisualRuntimeState {
  let found = false;
  let cleanupCount = 0;
  const active: VisualEffectInstance[] = [];
  for (const e of state.active) {
    if (e.instanceId === instanceOrEffectId || e.effectId === instanceOrEffectId) {
      const c = cleanupInstance(e, 'interrupted');
      if (c.cleaned) cleanupCount += 1;
      state = { ...state, completed: [...state.completed, c.instance].slice(-24) };
      found = true;
    } else active.push(e);
  }
  const queued: VisualEffectInstance[] = [];
  for (const e of state.queued) {
    if (e.instanceId === instanceOrEffectId || e.effectId === instanceOrEffectId) {
      const c = cleanupInstance(e, 'cancelled');
      if (c.cleaned) cleanupCount += 1;
      state = { ...state, completed: [...state.completed, c.instance].slice(-24) };
      found = true;
    } else queued.push(e);
  }
  if (!found) return state;
  return {
    ...state, active, queued, cleanupCount: state.cleanupCount + cleanupCount,
    interruptedCount: state.interruptedCount + 1, lastCleanupAt: now, lastTransitionAt: now,
  };
}

export function cleanupAllVisualEffects(state: VisualRuntimeState, now: number = Date.now()): VisualRuntimeState {
  let cleanupCount = 0;
  const completed = [...state.completed];
  for (const e of state.active) {
    const c = cleanupInstance(e, 'interrupted');
    if (c.cleaned) cleanupCount += 1;
    completed.push(c.instance);
  }
  for (const e of state.queued) {
    const c = cleanupInstance(e, 'cancelled');
    if (c.cleaned) cleanupCount += 1;
    completed.push(c.instance);
  }
  if (state.active.length === 0 && state.queued.length === 0) return state;
  return {
    ...state, active: [], queued: [], completed: completed.slice(-24),
    cleanupCount: state.cleanupCount + cleanupCount, lastCleanupAt: now, lastTransitionAt: now,
  };
}

export function visualEffectStats(state: VisualRuntimeState): {
  active: number; queued: number; completed: number; cleanupCount: number; droppedCount: number; interruptedCount: number;
} {
  return {
    active: state.active.length, queued: state.queued.length, completed: state.completed.length,
    cleanupCount: state.cleanupCount, droppedCount: state.droppedCount, interruptedCount: state.interruptedCount,
  };
}

export function particleBudget(
  intensity: VisualIntensity,
  performance: VisualPerformanceLevel,
  reducedMotion: boolean,
  mode: VisualPerformanceMode = 'NORMAL',
): number {
  if (reducedMotion || intensity === 'LOW' || mode === 'CRITICAL') return 0;
  const base = (VISUAL_INTENSITY_PROFILES[intensity] || VISUAL_INTENSITY_PROFILES.MEDIUM).particles;
  const level = performance === 'minimal' ? 0.2 : performance === 'reduced' ? 0.55 : 1;
  const modeScale = mode === 'LOW' ? 0.35 : mode === 'REDUCED' ? 0.65 : 1;
  return Math.max(0, Math.min(MAX_PARTICLE_BUDGET, Math.round(base * level * modeScale)));
}

/** 性能降级：阈值/冷却固定，避免频繁切换造成视觉抖动 */
export function evaluateVisualPerformance(
  fps: number,
  current: VisualPerformanceLevel,
  lastChangeAt: number,
  now: number,
): VisualPerformanceLevel {
  if (!Number.isFinite(fps) || fps <= 0) return current;
  const cooled = now - lastChangeAt > 4000;
  if (fps < 28) return 'minimal';
  if (fps < 44) return 'reduced';
  if (fps >= 56 && cooled && current !== 'full') return 'full';
  return current;
}

export function visualEnabledFor(reducedMotion: boolean): boolean {
  return true;
}

export interface PerformanceModeState {
  mode: ActivePerformanceMode;
  smoothedFps: number;
  lastChangeAt: number;
  stableSince: number;
  reason: string;
}

export function smoothFps(prev: number, sample: number, alpha = 0.25): number {
  if (!Number.isFinite(sample) || sample <= 0) return prev;
  if (!Number.isFinite(prev) || prev <= 0) return sample;
  return Math.round((prev * (1 - alpha) + sample * alpha) * 10) / 10;
}

export function performanceTargetForFps(fps: number): ActivePerformanceMode {
  if (!Number.isFinite(fps) || fps <= 0) return 'NORMAL';
  if (fps < 30) return 'CRITICAL';
  if (fps < 45) return 'LOW';
  if (fps < 55) return 'REDUCED';
  return 'NORMAL';
}

/** AUTO 模式：2.5s 降级确认 + 3s 切换冷却 + 5s 稳定恢复，单向逐级恢复。 */
export function nextPerformanceMode(
  state: PerformanceModeState,
  setting: VisualPerformanceMode,
  sample: number,
  now: number,
  opts: { degradeMs?: number; recoveryMs?: number; cooldownMs?: number; recoverFps?: number } = {},
): { state: PerformanceModeState; changed: boolean } {
  const smoothedFps = smoothFps(state.smoothedFps, sample);
  if (setting !== 'AUTO') {
    const mode = setting;
    return {
      state: { ...state, smoothedFps, mode, lastChangeAt: mode !== state.mode ? now : state.lastChangeAt, reason: mode !== state.mode ? 'forced:' + mode : state.reason },
      changed: mode !== state.mode,
    };
  }
  const degradeMs = opts.degradeMs ?? 2500;
  const recoveryMs = opts.recoveryMs ?? 5000;
  const cooldownMs = opts.cooldownMs ?? 3000;
  const recoverFps = opts.recoverFps ?? 58;
  const target = performanceTargetForFps(smoothedFps);
  const curSev = modeSeverity(state.mode);
  const targetSev = modeSeverity(target);

  if (targetSev > curSev) {
    const stableSince = state.stableSince || now;
    if (now - stableSince >= degradeMs && now - state.lastChangeAt >= cooldownMs) {
      return {
        state: { mode: target, smoothedFps, lastChangeAt: now, stableSince: 0, reason: 'degrade:' + target + '@' + smoothedFps.toFixed(1) + 'fps' },
        changed: true,
      };
    }
    return { state: { ...state, smoothedFps, stableSince, reason: state.reason }, changed: false };
  }
  if (targetSev < curSev) {
    const stableSince = state.stableSince || now;
    if (smoothedFps >= recoverFps && now - stableSince >= recoveryMs && now - state.lastChangeAt >= recoveryMs) {
      const nextSev = Math.max(0, curSev - 1);
      const mode: ActivePerformanceMode = nextSev === 0 ? 'NORMAL' : nextSev === 1 ? 'REDUCED' : nextSev === 2 ? 'LOW' : 'CRITICAL';
      return {
        state: { mode, smoothedFps, lastChangeAt: now, stableSince: 0, reason: 'recover:' + mode + '@' + smoothedFps.toFixed(1) + 'fps' },
        changed: true,
      };
    }
    return { state: { ...state, smoothedFps, stableSince, reason: state.reason }, changed: false };
  }
  return { state: { ...state, smoothedFps, stableSince: 0, reason: state.reason }, changed: false };
}

export function renderCostLevel(mode: ActivePerformanceMode, active: number, particles: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (mode === 'CRITICAL') return 'LOW';
  if (mode === 'LOW') return particles > 12 ? 'MEDIUM' : 'LOW';
  if (mode === 'REDUCED') return active >= 4 || particles > 30 ? 'HIGH' : 'MEDIUM';
  return active >= 4 || particles > 40 ? 'HIGH' : 'MEDIUM';
}

export function visualsPaused(documentHidden: boolean, simulatedHidden: boolean): boolean {
  return documentHidden || simulatedHidden;
}

export function performanceLevelFor(setting: VisualPerformanceMode, auto: ActivePerformanceMode): VisualPerformanceLevel {
  return performanceLevelForMode(activePerformanceMode(setting, auto));
}

/** B.1~B.4 战斗事件 -> 基础视觉反馈；仅读取事件类型，不改变战斗。 */
export function visualEffectIdForBattleEvent(eventType: string): string | null {
  switch (eventType) {
    case 'BOSS_ATTACK_TELEGRAPH': return 'boss-warning-pulse';
    case 'BOSS_ATTACK_HIT': return 'boss-attack-impact';
    case 'BOSS_ATTACK_BLOCKED': return 'boss-defend-pulse';
    case 'BOSS_ATTACK_DODGED': return 'boss-dodge-pulse';
    case 'BOSS_WEAKNESS_EXPOSED': return 'boss-weakness-flash';
    case 'BOSS_WEAKNESS_CHALLENGE_SUCCESS': return 'boss-weakness-flash';
    case 'BOSS_PHASE_TRANSITION': return 'boss-phase-flash';
    case 'BOSS_BATTLE_VICTORY':
    case 'BOSS_BATTLE_DEFEAT':
    case 'BOSS_BATTLE_INTERRUPTED': return 'boss-terminal-flash';
    default: return null;
  }
}

export function visualIntensityFromStorage(raw: string | null | undefined): VisualIntensity {
  if (raw === 'LOW' || raw === 'MEDIUM' || raw === 'HIGH' || raw === 'CINEMATIC') return raw;
  return 'MEDIUM';
}

export function effectDefForId(effectId: string): VisualEffectDef | null {
  return BOSS_VISUAL_EFFECTS[effectId] ? { ...BOSS_VISUAL_EFFECTS[effectId] } : null;
}
