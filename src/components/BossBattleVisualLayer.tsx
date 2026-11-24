import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../store/gameStore';
import { bossBattleEventBus, BOSS_BATTLE_EVENTS } from '../game/bossPhaseEngine';
import type { DynamicEventState } from '../game/eventEngine';
import {
  crisisCinematicDedupeKey, crisisCinematicStageFor, crisisSnapshotOf, crisisStageAtElapsed,
  crisisTransitions, crisisViewFor,
  type CrisisCinematicKind, type CrisisCinematicView, type CrisisEventSnapshot, type CrisisTransition,
} from '../game/bossCrisisCinematicConfig';
import {
  attackEffectDurationFor, attackEffectIdFor, attackResultLabel, attackResultText,
  attackVisualProfileFor, type AttackCinematicKind, type AttackVisualProfile, type AttackVisualType,
} from '../game/bossAttackCinematicConfig';
import {
  PHASE_CINEMATIC_STAGES, PHASE_CINEMATIC_TOTAL_MS, phaseRevealNumber, phaseStageForElapsed, phaseTransitionThemeFor,
  type PhaseCinematicStage, type PhaseCinematicView,
} from '../game/bossPhaseTransitionCinematicConfig';
import {
  weaknessCinematicDedupeKey, weaknessCinematicKindForEvent, weaknessCinematicStageFor, weaknessCinematicThemeFor,
  type WeaknessCinematicKind, type WeaknessCinematicView,
} from '../game/bossWeaknessCinematicConfig';
import { weaknessDefinitionsFor } from '../game/bossWeaknessCatalog';
import { WEAKNESS_TYPE_LABEL, type BossWeaknessRunState } from '../game/bossWeaknessEngine';
import { bossPhaseBossName } from '../game/bossPhasePlans';
import {
  terminalDedupeKey, terminalKindForEvent, terminalResultLabel, terminalSnapshotOf,
  terminalStageAtElapsed, terminalTotalDuration, terminalViewFor,
  type TerminalCinematicView, type TerminalKind,
} from '../game/bossTerminalCinematicConfig';
import {
  bossVisualThemeFor, getVisualEffectDef,
  DEFAULT_VISUAL_INTENSITY, VISUAL_INTENSITY_PROFILES,
  VISUAL_INTENSITY_STORAGE_KEY, PERFORMANCE_MODE_STORAGE_KEY, DEFAULT_PERFORMANCE_MODE,
  normalizePerformanceMode, performanceLevelForMode, maxDprForMode, savePerformanceMode, saveVisualIntensity,
  type BossVisualTheme, type VisualIntensity, type VisualPerformanceLevel,
  type VisualPerformanceMode, type ActivePerformanceMode,
  VISUAL_PRIORITY,
} from '../game/bossBattleVisualConfig';
import {
  cleanupAllVisualEffects, createVisualRuntime, effectDefForId, visualEffectIdForBattleEvent,
  interruptVisualEffect, particleBudget, tickVisualEffects, triggerVisualEffect, visualIntensityFromStorage,
  nextPerformanceMode, renderCostLevel, visualsPaused,
  type VisualRuntimeState, type PerformanceModeState,
} from '../game/bossBattleVisualEngine';

export interface AttackCinematicView {
  attackId: string;
  attackName: string;
  attackType: string;
  phase: 'warning' | 'charge' | 'release' | 'result';
  result: AttackCinematicKind | null;
  profile: AttackVisualProfile;
  startedAt: number;
  warningDuration: number;
  expiresAt: number;
}

export interface BossBattleVisuals {
  bossId: string;
  theme: BossVisualTheme;
  runtime: VisualRuntimeState;
  intensity: VisualIntensity;
  performance: VisualPerformanceLevel;
  performanceMode: ActivePerformanceMode;
  performanceSetting: VisualPerformanceMode;
  performanceReason: string;
  frameTime: number;
  canvasDpr: number;
  canvasRenderMs: number;
  pageHidden: boolean;
  simulatedHidden: boolean;
  paused: boolean;
  renderCost: 'LOW' | 'MEDIUM' | 'HIGH';
  fps: number;
  reducedMotion: boolean;
  danger: boolean;
  particleCount: number;
  setIntensity: (v: VisualIntensity) => void;
  reportCanvasSample: (ms: number) => void;
  setPerformanceSetting: (v: VisualPerformanceMode) => void;
  setSimulatedHidden: (v: boolean) => void;
  simulateFps: (fps: number, samples?: number) => void;
  stressParticles: () => void;
  stressQueue: () => void;
  stressResize: () => void;
  stressLeak: () => void;
  trigger: (effectId: string) => boolean;
  attack: (kind: AttackCinematicKind, attackType?: string, attackName?: string, attackId?: string) => void;
  attackView: AttackCinematicView | null;
  phaseTransition: PhaseCinematicView | null;
  phase: (fromIndex: number, toIndex: number, toPhaseName?: string) => void;
  weaknessView: WeaknessCinematicView | null;
  weakness: (kind: WeaknessCinematicKind, weaknessName?: string, weaknessId?: string, weaknessType?: string) => void;
  weaknessSequence: () => void;
  interruptWeakness: () => void;
  crisisView: CrisisCinematicView | null;
  crisisOverlayActive: boolean;
  crisis: (kind: CrisisCinematicKind) => void;
  crisisSequence: () => void;
  crisisPriority: () => void;
  interruptCrisis: () => void;
  crisisStale: () => void;
  terminalView: TerminalCinematicView | null;
  terminal: (kind?: TerminalKind) => void;
  terminalPriority: () => void;
  terminalDuplicate: () => void;
  terminalStale: () => void;
  interruptTerminal: () => void;
  terminalCleanup: () => void;
  terminalSeen: boolean;
  interrupt: (id: string) => void;
  cleanup: () => void;
}

interface PendingWeaknessStage {
  kind: WeaknessCinematicKind;
  weaknessId: string;
  weaknessName: string;
  weaknessType: string;
  detail: string;
  at: number;
}

interface WeaknessSequenceState {
  kinds: WeaknessCinematicKind[];
  index: number;
  weaknessId: string;
  weaknessName: string;
  weaknessType: string;
}

interface PendingCrisisStage {
  snapshot: CrisisEventSnapshot;
  transition: CrisisTransition;
  at: number;
  source: 'REAL' | 'DEV';
}

interface CrisisSequenceState {
  kinds: CrisisCinematicKind[];
  index: number;
  snapshot: CrisisEventSnapshot;
}

function devCrisisSnapshot(id: string, battleId: string): CrisisEventSnapshot {
  return {
    id, defId: 'unknown-intrusion', status: 'active', result: null,
    step: 0, missesLeft: 3, startedAt: Date.now(), activateAt: null, deadlineAt: null,
    reason: 'dev-visual', battleId,
  };
}

function weaknessDetailForEvent(kind: WeaknessCinematicKind, payload: Record<string, unknown>, at: number): string {
  if (kind === 'expose') {
    const parts: string[] = [];
    const mult = Number(payload.damageMultiplier);
    const until = Number(payload.exposedUntil);
    if (Number.isFinite(mult) && mult > 0) parts.push('伤害 ×' + mult);
    if (Number.isFinite(until) && until > at) parts.push('暴露 ' + ((until - at) / 1000).toFixed(1) + 's');
    if (parts.length > 0) return parts.join(' · ');
  }
  return weaknessCinematicStageFor(kind).text;
}

export function useBossBattleVisuals(bossId: string): BossBattleVisuals {
  const g = useGame();
  const initialIntensity = (() => {
    try { return visualIntensityFromStorage(localStorage.getItem(VISUAL_INTENSITY_STORAGE_KEY)); } catch { return DEFAULT_VISUAL_INTENSITY; }
  })();
  const initialPerformanceSetting = (() => {
    try { return normalizePerformanceMode(localStorage.getItem(PERFORMANCE_MODE_STORAGE_KEY)); } catch { return DEFAULT_PERFORMANCE_MODE; }
  })();
  const initialMode: ActivePerformanceMode = initialPerformanceSetting === 'AUTO' ? 'NORMAL' : initialPerformanceSetting;
  const runtimeRef = useRef<VisualRuntimeState>(createVisualRuntime());
  const [runtime, setRuntime] = useState<VisualRuntimeState>(runtimeRef.current);
  const [intensity, setIntensityState] = useState<VisualIntensity>(initialIntensity);
  const [performanceSetting, setPerformanceSettingState] = useState<VisualPerformanceMode>(initialPerformanceSetting);
  const [performanceMode, setPerformanceMode] = useState<ActivePerformanceMode>(initialMode);
  const [performanceReason, setPerformanceReason] = useState('init');
  const perfStateRef = useRef<PerformanceModeState>({
    mode: initialMode, smoothedFps: 60, lastChangeAt: 0, stableSince: 0, reason: 'init',
  });
  const perfClockRef = useRef(0);
  const [mediaReduced, setMediaReduced] = useState(false);
  const perfLevel: VisualPerformanceLevel = performanceLevelForMode(performanceMode);
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);
  const [canvasRenderMs, setCanvasRenderMs] = useState(0);
  const canvasMsRef = useRef(0);
  const [pageHidden, setPageHidden] = useState(false);
  const [simulatedHidden, setSimulatedHiddenState] = useState(false);
  const paused = visualsPaused(pageHidden, simulatedHidden);
  const [attackView, setAttackView] = useState<AttackCinematicView | null>(null);
  const attackViewRef = useRef<AttackCinematicView | null>(null);
  const processedEventIds = useRef<Set<string>>(new Set());
  const processedTransitionIds = useRef<Set<string>>(new Set());
  const [phaseTransition, setPhaseTransition] = useState<PhaseCinematicView | null>(null);
  const phaseRef = useRef<PhaseCinematicView | null>(null);
  const [weaknessView, setWeaknessView] = useState<WeaknessCinematicView | null>(null);
  const weaknessViewRef = useRef<WeaknessCinematicView | null>(null);
  const processedWeaknessKeys = useRef<Set<string>>(new Set());
  const pendingWeaknessQueueRef = useRef<PendingWeaknessStage[]>([]);
  const weaknessSequenceRef = useRef<WeaknessSequenceState | null>(null);
  const weaknessNameRef = useRef('');
  const weaknessTypeRef = useRef('');
  const weaknessRunRef = useRef<BossWeaknessRunState | null>(null);
  const [crisisView, setCrisisView] = useState<CrisisCinematicView | null>(null);
  const crisisViewRef = useRef<CrisisCinematicView | null>(null);
  const crisisQueueRef = useRef<PendingCrisisStage[]>([]);
  const crisisSequenceRef = useRef<CrisisSequenceState | null>(null);
  const processedCrisisKeys = useRef<Set<string>>(new Set());
  const lastCrisisSnapshotRef = useRef<CrisisEventSnapshot | null>(null);
  const devCrisisSeqRef = useRef(0);
  const crisisOverlayActiveRef = useRef(false);
  const [terminalView, setTerminalView] = useState<TerminalCinematicView | null>(null);
  const terminalViewRef = useRef<TerminalCinematicView | null>(null);
  const processedTerminalKeys = useRef<Set<string>>(new Set());
  const devTerminalSeqRef = useRef(0);
  const terminalSeenRef = useRef(false);
  const currentBattleIdRef = useRef<string | null>(null);
  currentBattleIdRef.current = g.player.progress.bossBattles?.[bossId]?.battleId || null;
  const attackMetaRef = useRef<{ name: string; type: string }>({ name: '', type: 'single' });
  const reducedMotion = mediaReduced || !g.player.settings.animations || g.player.settings.animLevel === 'low';
  const danger = g.player.consciousness <= 30;
  const theme = useMemo(() => bossVisualThemeFor(bossId), [bossId]);
  const battleDifficulty = g.player.progress.bossBattles?.[bossId]?.difficulty;
  const weaknessDefs = useMemo(
    () => (battleDifficulty ? weaknessDefinitionsFor(bossId, battleDifficulty) : []),
    [bossId, battleDifficulty],
  );
  const weaknessRun = g.player.progress.bossWeaknesses?.[bossId] || null;
  weaknessRunRef.current = weaknessRun;
  const dynamicEvent: DynamicEventState | null = g.player.progress.dynamicEvent || null;
  const crisisOverlayActive = !!dynamicEvent;
  crisisOverlayActiveRef.current = crisisOverlayActive;
  const crisisRenderSnapshot = crisisSnapshotOf(dynamicEvent, currentBattleIdRef.current || '');
  const crisisRenderKey = crisisRenderSnapshot
    ? [crisisRenderSnapshot.id, crisisRenderSnapshot.status, crisisRenderSnapshot.result, crisisRenderSnapshot.step, crisisRenderSnapshot.missesLeft, crisisRenderSnapshot.battleId].join('|')
    : 'none';
  const activeWeaknessDef = weaknessRun?.activeWeaknessId
    ? weaknessDefs.find(d => d.weaknessId === weaknessRun.activeWeaknessId)
    : undefined;
  if (activeWeaknessDef) {
    weaknessNameRef.current = activeWeaknessDef.name;
    weaknessTypeRef.current = activeWeaknessDef.weaknessType;
  }
  useEffect(() => {
    processedEventIds.current = new Set();
    processedTransitionIds.current = new Set();
    processedWeaknessKeys.current = new Set();
    terminalSeenRef.current = false;
    attackMetaRef.current = { name: '', type: 'single' };
    weaknessNameRef.current = '';
    weaknessTypeRef.current = '';
    pendingWeaknessQueueRef.current = [];
    weaknessSequenceRef.current = null;
    crisisViewRef.current = null;
    setCrisisView(null);
    crisisQueueRef.current = [];
    crisisSequenceRef.current = null;
    processedCrisisKeys.current = new Set();
    lastCrisisSnapshotRef.current = null;
    terminalViewRef.current = null;
    setTerminalView(null);
    processedTerminalKeys.current = new Set();
    setAttackView(null); attackViewRef.current = null;
    setPhaseTransition(null); phaseRef.current = null;
    setWeaknessView(null); weaknessViewRef.current = null;
  }, [bossId]);
  const particleCount = particleBudget(intensity, perfLevel, reducedMotion, performanceMode);

  const commit = useCallback((next: VisualRuntimeState) => {
    runtimeRef.current = next;
    setRuntime(next);
  }, []);

  const trigger = useCallback((effectId: string): boolean => {
    const def = effectDefForId(effectId) || getVisualEffectDef(effectId);
    if (!def) return false;
    const result = triggerVisualEffect(runtimeRef.current, def, Date.now(), { intensity, performance: perfLevel, reducedMotion, performanceMode });
    if (result.state !== runtimeRef.current) commit(result.state);
    return result.accepted;
  }, [intensity, perfLevel, reducedMotion, performanceMode, commit]);

  const interrupt = useCallback((id: string) => {
    commit(interruptVisualEffect(runtimeRef.current, id, Date.now()));
  }, [commit]);

  const cleanup = useCallback(() => {
    attackViewRef.current = null;
    setAttackView(null);
    phaseRef.current = null;
    setPhaseTransition(null);
    weaknessViewRef.current = null;
    setWeaknessView(null);
    pendingWeaknessQueueRef.current = [];
    weaknessSequenceRef.current = null;
    crisisViewRef.current = null;
    setCrisisView(null);
    crisisQueueRef.current = [];
    crisisSequenceRef.current = null;
    terminalViewRef.current = null;
    setTerminalView(null);
    commit(cleanupAllVisualEffects(runtimeRef.current, Date.now()));
  }, [commit]);

  const setIntensity = useCallback((v: VisualIntensity) => {
    setIntensityState(v);
    saveVisualIntensity(v);
  }, []);

  const setPerformanceSetting = useCallback((v: VisualPerformanceMode) => {
    const mode = normalizePerformanceMode(v);
    setPerformanceSettingState(mode);
    savePerformanceMode(mode);
    if (mode !== 'AUTO') {
      perfStateRef.current = { ...perfStateRef.current, mode, lastChangeAt: Date.now(), reason: 'forced:' + mode };
      setPerformanceMode(mode);
      setPerformanceReason('forced:' + mode);
    } else {
      perfStateRef.current = { ...perfStateRef.current, stableSince: 0, reason: 'auto' };
      setPerformanceReason('auto');
    }
  }, []);

  const setSimulatedHidden = useCallback((v: boolean) => {
    setSimulatedHiddenState(v);
  }, []);

  const reportCanvasMs = useCallback((ms: number) => {
    canvasMsRef.current = Number.isFinite(ms) && ms >= 0 ? ms : 0;
  }, []);

  const simulateFps = useCallback((targetFps: number, samples = 8) => {
    let state = { ...perfStateRef.current };
    const count = Math.max(1, samples);
    const base = Math.max(Date.now(), perfClockRef.current + 1000);
    perfClockRef.current = base + (count - 1) * 1000;
    let changed = false;
    for (let i = 0; i < count; i++) {
      const r = nextPerformanceMode(state, performanceSetting, targetFps, base + i * 1000);
      state = r.state;
      changed = changed || r.changed;
    }
    perfStateRef.current = state;
    setFps(Math.round(state.smoothedFps));
    setFrameTime(Math.round((1000 / Math.max(1, state.smoothedFps)) * 10) / 10);
    setPerformanceReason(state.reason);
    if (changed || state.mode !== performanceMode) setPerformanceMode(state.mode);
  }, [performanceSetting, performanceMode]);

  const stressParticles = useCallback(() => {
    const now = Date.now();
    let st = runtimeRef.current;
    for (const id of ['boss-particle-burst', 'boss-particle-stream', 'boss-scanline', 'boss-crisis-glitch']) {
      const def = effectDefForId(id);
      if (def) st = triggerVisualEffect(st, def, now, { intensity: 'CINEMATIC', performance: perfLevel, reducedMotion, performanceMode }).state;
    }
    commit(st);
  }, [perfLevel, reducedMotion, performanceMode, commit]);

  const stressQueue = useCallback(() => {
    const base = effectDefForId('boss-particle-burst');
    if (!base) return;
    const now = Date.now();
    let st = runtimeRef.current;
    for (let i = 0; i < 12; i++) {
      st = triggerVisualEffect(st, {
        ...base, effectId: 'b67-queue-' + i, priority: VISUAL_PRIORITY.ambient,
        duration: 700, queueable: true, exclusiveGroup: 'b67-stress',
      }, now + i, { intensity: 'LOW', performance: 'minimal', reducedMotion: true, performanceMode }).state;
    }
    commit(st);
  }, [performanceMode, commit]);

  const stressResize = useCallback(() => {
    for (let i = 0; i < 10; i++) window.dispatchEvent(new Event('resize'));
  }, []);

  const stressLeak = useCallback(() => {
    const base = effectDefForId('boss-particle-burst');
    if (!base) return;
    const now = Date.now();
    let st = runtimeRef.current;
    for (let i = 0; i < 20; i++) {
      st = triggerVisualEffect(st, { ...base, effectId: 'b67-leak-' + i, duration: 300, queueable: true }, now + i, { intensity: 'LOW', performance: 'minimal', reducedMotion: true, performanceMode }).state;
      st = cleanupAllVisualEffects(st, now + i);
    }
    commit(st);
  }, [performanceMode, commit]);

  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (!mq) return;
    setMediaReduced(mq.matches);
    const onChange = () => setMediaReduced(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const triggerAttack = useCallback((kind: AttackCinematicKind, attackType = 'single', attackName = '', attackId = 'dev-attack') => {
    const now = Date.now();
    const profile = attackVisualProfileFor(attackType, bossId);
    let st = runtimeRef.current;
    for (const effectId of ['boss-attack-warning', 'boss-attack-charge', 'boss-attack-release', 'boss-attack-hit', 'boss-attack-block', 'boss-attack-dodge']) {
      if (kind === 'warning' && (effectId === 'boss-attack-warning' || effectId === 'boss-attack-charge')) continue;
      st = interruptVisualEffect(st, effectId, now);
    }
    const def = effectDefForId(attackEffectIdFor(kind));
    if (def) {
      const color = kind === 'warning' ? profile.warningColor : kind === 'charge' ? profile.chargeColor : kind === 'block' ? profile.blockColor : kind === 'dodge' ? profile.dodgeColor : kind === 'hit' ? profile.hitColor : profile.releaseColor;
      const duration = kind === 'charge'
        ? attackEffectDurationFor(kind, attackViewRef.current?.warningDuration || 1200)
        : attackEffectDurationFor(kind, attackViewRef.current?.warningDuration);
      st = triggerVisualEffect(st, { ...def, duration, color }, now, { intensity, performance: perfLevel, reducedMotion, performanceMode }).state;
    }
    commit(st);
    const isResult = kind === 'hit' || kind === 'block' || kind === 'dodge' || kind === 'interrupt' || kind === 'cancel';
    const view: AttackCinematicView = {
      attackId,
      attackName: attackName || (isResult ? (attackViewRef.current?.attackName || '') : ''),
      attackType,
      phase: kind === 'warning' ? 'warning' : kind === 'charge' ? 'charge' : kind === 'release' ? 'release' : 'result',
      result: isResult ? kind : null,
      profile,
      startedAt: now,
      warningDuration: attackViewRef.current?.warningDuration || 0,
      expiresAt: now + (kind === 'warning' ? Math.max(600, (attackViewRef.current?.warningDuration || 1200)) : kind === 'charge' ? 1600 : 900),
    };
    attackViewRef.current = view;
    setAttackView(view);
  }, [bossId, intensity, perfLevel, reducedMotion, performanceMode, commit]);

  const triggerPhase = useCallback((fromIndex: number, toIndex: number, toPhaseName = '') => {
    if (terminalSeenRef.current) return;
    const now = Date.now();
    const theme = phaseTransitionThemeFor(toIndex);
    const view: PhaseCinematicView = {
      transitionId: 'dev-phase-' + fromIndex + '-' + toIndex,
      fromIndex, toIndex, toPhaseName: toPhaseName || 'PHASE ' + (toIndex + 1),
      stage: 'pre', startedAt: now, expiresAt: now + PHASE_CINEMATIC_TOTAL_MS, theme, reason: 'dev',
    };
    phaseRef.current = view; setPhaseTransition(view);
    attackViewRef.current = null; setAttackView(null);
    weaknessViewRef.current = null; setWeaknessView(null);
    pendingWeaknessQueueRef.current = [];
    weaknessSequenceRef.current = null;
    crisisViewRef.current = null; setCrisisView(null);
    crisisQueueRef.current = [];
    crisisSequenceRef.current = null;
    let st = runtimeRef.current;
    for (const effectId of ['boss-attack-warning', 'boss-attack-charge', 'boss-attack-release', 'boss-attack-hit', 'boss-attack-block', 'boss-attack-dodge', 'boss-weakness-cinematic', 'boss-crisis-cinematic', 'boss-phase-cinematic']) {
      st = interruptVisualEffect(st, effectId, now);
    }
    const def = effectDefForId('boss-phase-cinematic');
    if (def) st = triggerVisualEffect(st, { ...def, color: theme.primary }, now, { intensity, performance: perfLevel, reducedMotion, performanceMode }).state;
    commit(st);
  }, [intensity, perfLevel, reducedMotion, performanceMode, commit]);

  const triggerWeakness = useCallback((kind: WeaknessCinematicKind, opts: {
    weaknessName?: string; weaknessId?: string; weaknessType?: string; detail?: string;
    reason?: 'battle' | 'dev'; keepSequence?: boolean; keepPending?: boolean;
  } = {}) => {
    if (terminalSeenRef.current || phaseRef.current) return;
    const now = Date.now();
    const stage = weaknessCinematicStageFor(kind);
    const weaknessId = opts.weaknessId || weaknessRunRef.current?.activeWeaknessId || '';
    const weaknessName = opts.weaknessName || weaknessNameRef.current || '';
    const weaknessType = opts.weaknessType || weaknessTypeRef.current || '';
    if (opts.weaknessName) weaknessNameRef.current = opts.weaknessName;
    if (opts.weaknessType) weaknessTypeRef.current = opts.weaknessType;
    if (!opts.keepSequence) weaknessSequenceRef.current = null;
    if (!opts.keepPending) pendingWeaknessQueueRef.current = [];
    const view: WeaknessCinematicView = {
      weaknessId, weaknessName, weaknessType, kind,
      stageLabel: stage.label, kicker: stage.kicker, text: stage.text,
      detail: opts.detail || stage.text,
      startedAt: now, expiresAt: now + stage.durationMs,
      theme: weaknessCinematicThemeFor(kind, theme),
      reason: opts.reason || 'battle',
    };
    weaknessViewRef.current = view;
    setWeaknessView(view);
    attackViewRef.current = null;
    setAttackView(null);
    let st = runtimeRef.current;
    for (const effectId of [
      'boss-attack-warning', 'boss-attack-charge', 'boss-attack-release',
      'boss-attack-hit', 'boss-attack-block', 'boss-attack-dodge', 'boss-weakness-cinematic',
    ]) st = interruptVisualEffect(st, effectId, now);
    const def = effectDefForId('boss-weakness-cinematic');
    if (def) {
      st = triggerVisualEffect(st, { ...def, duration: stage.durationMs, color: view.theme.primary }, now, {
        intensity, performance: perfLevel, reducedMotion, performanceMode,
      }).state;
    }
    commit(st);
  }, [theme, intensity, perfLevel, reducedMotion, performanceMode, commit]);
  const triggerWeaknessRef = useRef(triggerWeakness);
  triggerWeaknessRef.current = triggerWeakness;

  const clearWeakness = useCallback((clearSequence = true) => {
    weaknessViewRef.current = null;
    setWeaknessView(null);
    pendingWeaknessQueueRef.current = [];
    if (clearSequence) weaknessSequenceRef.current = null;
    commit(interruptVisualEffect(runtimeRef.current, 'boss-weakness-cinematic', Date.now()));
  }, [commit]);

  const triggerWeaknessStage = useCallback((kind: WeaknessCinematicKind, weaknessName?: string, weaknessId?: string, weaknessType?: string) => {
    triggerWeakness(kind, { weaknessName, weaknessId, weaknessType, reason: 'dev' });
  }, [triggerWeakness]);

  const startWeaknessSequence = useCallback(() => {
    if (terminalSeenRef.current || phaseRef.current) return;
    const kinds: WeaknessCinematicKind[] = ['scan', 'discovery', 'crack', 'break', 'expose', 'recovery'];
    weaknessSequenceRef.current = {
      kinds, index: 1,
      weaknessId: weaknessRunRef.current?.activeWeaknessId || '',
      weaknessName: weaknessNameRef.current,
      weaknessType: weaknessTypeRef.current,
    };
    triggerWeakness('scan', {
      weaknessName: weaknessNameRef.current,
      weaknessId: weaknessRunRef.current?.activeWeaknessId || '',
      weaknessType: weaknessTypeRef.current,
      reason: 'dev', keepSequence: true,
    });
  }, [triggerWeakness]);

  const clearCrisis = useCallback((clearSequence = true) => {
    crisisViewRef.current = null;
    setCrisisView(null);
    crisisQueueRef.current = [];
    if (clearSequence) crisisSequenceRef.current = null;
    commit(interruptVisualEffect(runtimeRef.current, 'boss-crisis-cinematic', Date.now()));
  }, [commit]);

  const applyCrisisTransition = useCallback((
    snapshot: CrisisEventSnapshot,
    transition: CrisisTransition,
    source: 'REAL' | 'DEV',
    now: number = Date.now(),
    opts: { keepSequence?: boolean } = {},
  ): boolean => {
    if (terminalSeenRef.current || phaseRef.current) return false;
    if (source === 'REAL' && snapshot.battleId && currentBattleIdRef.current && snapshot.battleId !== currentBattleIdRef.current) return false;
    const stage = crisisCinematicStageFor(transition.kind);
    const view = crisisViewFor(snapshot, transition, now, source);
    if (!opts.keepSequence) crisisSequenceRef.current = null;
    crisisViewRef.current = view;
    setCrisisView(view);
    attackViewRef.current = null; setAttackView(null);
    weaknessViewRef.current = null; setWeaknessView(null);
    pendingWeaknessQueueRef.current = [];
    weaknessSequenceRef.current = null;
    let st = runtimeRef.current;
    for (const effectId of [
      'boss-attack-warning', 'boss-attack-charge', 'boss-attack-release',
      'boss-attack-hit', 'boss-attack-block', 'boss-attack-dodge',
      'boss-weakness-cinematic', 'boss-crisis-cinematic',
    ]) st = interruptVisualEffect(st, effectId, now);
    const def = effectDefForId('boss-crisis-cinematic');
    if (def) {
      st = triggerVisualEffect(st, { ...def, duration: stage.durationMs, color: view.theme.primary }, now, {
        intensity, performance: perfLevel, reducedMotion, performanceMode,
      }).state;
    }
    commit(st);
    return true;
  }, [intensity, perfLevel, reducedMotion, performanceMode, commit]);
  const applyCrisisRef = useRef(applyCrisisTransition);
  applyCrisisRef.current = applyCrisisTransition;

  const enqueueCrisis = useCallback((
    snapshot: CrisisEventSnapshot,
    transitions: CrisisTransition[],
    source: 'REAL' | 'DEV',
  ) => {
    if (source === 'REAL' && snapshot.battleId && currentBattleIdRef.current && snapshot.battleId !== currentBattleIdRef.current) return;
    const now = Date.now();
    if (transitions.some(t => t.kind === 'warning' && t.marker === 'start')) {
      crisisQueueRef.current = [];
      crisisSequenceRef.current = null;
    }
    let anchor = crisisViewRef.current ? Math.max(now, crisisViewRef.current.expiresAt) : now;
    let applied = false;
    for (const t of transitions) {
      const key = crisisCinematicDedupeKey(snapshot.battleId, snapshot.id, t.kind, t.marker);
      if (processedCrisisKeys.current.has(key)) continue;
      processedCrisisKeys.current.add(key);
      const duration = crisisCinematicStageFor(t.kind).durationMs;
      if (!crisisViewRef.current && crisisQueueRef.current.length === 0 && !applied) {
        const ok = applyCrisisRef.current(snapshot, t, source, now, { keepSequence: true });
        applied = true;
        if (!ok) continue;
        anchor = now + duration;
      } else {
        const at = Math.max(anchor, now);
        crisisQueueRef.current.push({ snapshot, transition: t, at, source });
        anchor = at + duration;
      }
    }
    if (processedCrisisKeys.current.size > 300) {
      processedCrisisKeys.current = new Set([...processedCrisisKeys.current].slice(-200));
    }
  }, []);
  const enqueueCrisisRef = useRef(enqueueCrisis);
  enqueueCrisisRef.current = enqueueCrisis;
  const clearCrisisRef = useRef(clearCrisis);
  clearCrisisRef.current = clearCrisis;

  const triggerCrisisStage = useCallback((kind: CrisisCinematicKind) => {
    const id = 'dev-crisis-' + (++devCrisisSeqRef.current);
    const snapshot = devCrisisSnapshot(id, currentBattleIdRef.current || 'dev-battle');
    crisisQueueRef.current = [];
    crisisSequenceRef.current = null;
    applyCrisisTransition(snapshot, {
      kind, marker: 'dev', detail: 'DEV 视觉模拟 · ' + crisisCinematicStageFor(kind).label,
    }, 'DEV');
  }, [applyCrisisTransition]);

  const startCrisisSequence = useCallback(() => {
    const kinds: CrisisCinematicKind[] = ['warning', 'identification', 'escalation', 'impact', 'response', 'resolution', 'recovery'];
    const snapshot = devCrisisSnapshot('dev-crisis-seq-' + (++devCrisisSeqRef.current), currentBattleIdRef.current || 'dev-battle');
    crisisQueueRef.current = [];
    crisisSequenceRef.current = { kinds, index: 1, snapshot };
    applyCrisisTransition(snapshot, {
      kind: 'warning', marker: 'seq-start', detail: 'DEV 序列模拟开始',
    }, 'DEV', Date.now(), { keepSequence: true });
  }, [applyCrisisTransition]);

  const triggerCrisisPriority = useCallback(() => {
    const snapshot = devCrisisSnapshot('dev-crisis-priority-' + (++devCrisisSeqRef.current), currentBattleIdRef.current || 'dev-battle');
    triggerAttack('warning', 'special', '未知入侵');
    applyCrisisTransition(snapshot, {
      kind: 'impact', marker: 'dev-priority', detail: '危机 P2 抢占攻击视觉',
    }, 'DEV');
  }, [triggerAttack, applyCrisisTransition]);

  const triggerCrisisStale = useCallback(() => {
    const snapshot = devCrisisSnapshot('dev-crisis-stale-' + (++devCrisisSeqRef.current), 'stale-battle');
    enqueueCrisisRef.current(snapshot, [{
      kind: 'warning', marker: 'stale', detail: '旧战斗事件应被拒绝',
    }], 'REAL');
  }, []);

  useEffect(() => {
    const battleId = currentBattleIdRef.current || '';
    const next = crisisSnapshotOf(dynamicEvent, battleId);
    let prev = lastCrisisSnapshotRef.current;
    if (prev && next && prev.battleId && next.battleId && prev.battleId !== next.battleId) {
      clearCrisisRef.current(false);
      prev = null;
    }
    if (prev && !next && prev.battleId && battleId && prev.battleId !== battleId) {
      clearCrisisRef.current(false);
      prev = null;
    }
    const transitions = crisisTransitions(prev, next);
    lastCrisisSnapshotRef.current = next;
    const transitionSource = next || prev;
    if (transitionSource && transitions.length > 0) enqueueCrisisRef.current(transitionSource, transitions, 'REAL');
  }, [crisisRenderKey, bossId]);

  const triggerTerminal = useCallback((kind: TerminalKind, opts: {
    battleId?: string; eventId?: string; bossId?: string; phaseId?: string; reason?: string;
    source?: 'REAL' | 'DEV';
  } = {}): boolean => {
    const source = opts.source || 'DEV';
    const battleId = opts.battleId || currentBattleIdRef.current || 'dev-battle';
    if (source === 'REAL' && opts.battleId && currentBattleIdRef.current && opts.battleId !== currentBattleIdRef.current) return false;
    const eventId = opts.eventId || 'dev-terminal-' + (++devTerminalSeqRef.current);
    const key = terminalDedupeKey(battleId, eventId);
    if (processedTerminalKeys.current.has(key)) return false;
    processedTerminalKeys.current.add(key);
    if (processedTerminalKeys.current.size > 100) {
      processedTerminalKeys.current = new Set([...processedTerminalKeys.current].slice(-60));
    }
    const now = Date.now();
    const snapshot = {
      battleId, eventId, bossId: opts.bossId || bossId, phaseId: opts.phaseId || '',
      kind, reason: opts.reason || '',
    };
    const view = terminalViewFor(snapshot, bossPhaseBossName(snapshot.bossId), now, source);
    view.title = terminalResultLabel(kind);
    terminalSeenRef.current = true;
    terminalViewRef.current = view;
    setTerminalView(view);
    attackViewRef.current = null; setAttackView(null);
    phaseRef.current = null; setPhaseTransition(null);
    weaknessViewRef.current = null; setWeaknessView(null);
    pendingWeaknessQueueRef.current = [];
    weaknessSequenceRef.current = null;
    crisisViewRef.current = null; setCrisisView(null);
    crisisQueueRef.current = [];
    crisisSequenceRef.current = null;
    lastCrisisSnapshotRef.current = null;
    let st = cleanupAllVisualEffects(runtimeRef.current, now);
    const def = effectDefForId('boss-terminal-cinematic');
    if (def) {
      st = triggerVisualEffect(st, { ...def, duration: terminalTotalDuration(kind), color: view.theme.primary }, now, {
        intensity, performance: perfLevel, reducedMotion, performanceMode,
      }).state;
    }
    commit(st);
    return true;
  }, [bossId, intensity, perfLevel, reducedMotion, performanceMode, commit]);

  const interruptTerminal = useCallback(() => {
    terminalViewRef.current = null;
    setTerminalView(null);
    commit(interruptVisualEffect(runtimeRef.current, 'boss-terminal-cinematic', Date.now()));
  }, [commit]);

  const terminalCleanup = useCallback(() => {
    terminalViewRef.current = null;
    setTerminalView(null);
    terminalSeenRef.current = false;
    processedTerminalKeys.current = new Set();
    commit(cleanupAllVisualEffects(runtimeRef.current, Date.now()));
  }, [commit]);

  const triggerTerminalPriority = useCallback(() => {
    triggerAttack('warning', 'aoe', '终结优先级测试');
    triggerTerminal('victory', { source: 'DEV' });
  }, [triggerAttack, triggerTerminal]);

  const triggerTerminalDuplicate = useCallback(() => {
    const eventId = 'dev-terminal-dup-' + (++devTerminalSeqRef.current);
    triggerTerminal('victory', { source: 'DEV', eventId });
    triggerTerminal('victory', { source: 'DEV', eventId });
  }, [triggerTerminal]);

  const triggerTerminalStale = useCallback(() => {
    triggerTerminal('victory', {
      source: 'REAL', battleId: 'stale-battle', eventId: 'dev-stale-terminal',
    });
  }, [triggerTerminal]);

  const triggerTerminalDev = useCallback((kind: TerminalKind = 'interrupted') => {
    triggerTerminal(kind, { source: 'DEV' });
  }, [triggerTerminal]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = tickVisualEffects(runtimeRef.current, Date.now());
      if (next !== runtimeRef.current) commit(next);
      if (attackViewRef.current && attackViewRef.current.expiresAt <= Date.now()) {
        attackViewRef.current = null;
        setAttackView(null);
      }
      const pv = phaseRef.current;
      if (pv) {
        const now = Date.now();
        if (now >= pv.expiresAt) {
          phaseRef.current = null;
          setPhaseTransition(null);
        } else {
          const stage = phaseStageForElapsed(now - pv.startedAt).stage;
          if (stage !== pv.stage) {
            const next = { ...pv, stage };
            phaseRef.current = next;
            setPhaseTransition(next);
          }
        }
      }
      const now = Date.now();
      const wv = weaknessViewRef.current;
      if (wv && now >= wv.expiresAt) {
        weaknessViewRef.current = null;
        setWeaknessView(null);
      }
      const seq = weaknessSequenceRef.current;
      if (seq) {
        if (!weaknessViewRef.current) {
          const kind = seq.kinds[seq.index];
          if (kind) {
            seq.index += 1;
            triggerWeaknessRef.current(kind, {
              weaknessName: seq.weaknessName, weaknessId: seq.weaknessId,
              weaknessType: seq.weaknessType, reason: 'dev', keepSequence: true,
            });
          } else {
            weaknessSequenceRef.current = null;
          }
        }
      } else {
        const queue = pendingWeaknessQueueRef.current;
        const pending = queue[0];
        if (pending && now >= pending.at) {
          pendingWeaknessQueueRef.current = queue.slice(1);
          triggerWeaknessRef.current(pending.kind, {
            weaknessName: pending.weaknessName, weaknessId: pending.weaknessId,
            weaknessType: pending.weaknessType, detail: pending.detail,
            reason: 'battle', keepPending: true,
          });
        }
      }
      const cv = crisisViewRef.current;
      if (cv) {
        if (now >= cv.expiresAt) {
          crisisViewRef.current = null;
          setCrisisView(null);
        } else {
          const sd = crisisStageAtElapsed(cv.kind, now - cv.startedAt);
          if (sd.kind !== cv.stage) {
            const next = { ...cv, stage: sd.kind, stageLabel: sd.label, kicker: sd.kicker, text: sd.text };
            crisisViewRef.current = next;
            setCrisisView(next);
          }
        }
      }
      if (!crisisViewRef.current) {
        const cq = crisisQueueRef.current;
        const cp = cq[0];
        if (cp && now >= cp.at) {
          cq.shift();
          applyCrisisRef.current(cp.snapshot, cp.transition, cp.source, now, { keepSequence: true });
        } else if (!cp && crisisSequenceRef.current) {
          const seq = crisisSequenceRef.current;
          const kind = seq.kinds[seq.index];
          if (kind) {
            seq.index += 1;
            applyCrisisRef.current(seq.snapshot, {
              kind, marker: 'dev-seq:' + seq.index, detail: 'DEV 序列模拟 · ' + crisisCinematicStageFor(kind).label,
            }, 'DEV', now, { keepSequence: true });
          } else {
            crisisSequenceRef.current = null;
          }
        }
      }
      const tv = terminalViewRef.current;
      if (tv) {
        if (now >= tv.expiresAt) {
          terminalViewRef.current = null;
          setTerminalView(null);
        } else {
          const sd = terminalStageAtElapsed(tv.kind, now - tv.startedAt);
          if (sd.stage !== tv.stage) {
            const next = {
              ...tv, stage: sd.stage, stageLabel: sd.label, kicker: sd.kicker,
              description: sd.text, reveal: sd.reveal, title: terminalResultLabel(tv.kind),
            };
            terminalViewRef.current = next;
            setTerminalView(next);
          }
        }
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [commit]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.visibilityState === 'hidden');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    let raf = 0;
    let frames = 0;
    let last = window.performance.now();
    const tick = (t: number) => {
      frames += 1;
      if (t - last >= 1000) {
        const sample = frames * 1000 / (t - last);
        const result = nextPerformanceMode(perfStateRef.current, performanceSetting, sample, t);
        perfStateRef.current = result.state;
        setFps(Math.round(result.state.smoothedFps));
        setFrameTime(Math.round((1000 / Math.max(1, result.state.smoothedFps)) * 10) / 10);
        setCanvasRenderMs(Math.round(canvasMsRef.current * 10) / 10);
        setPerformanceReason(result.state.reason);
        if (result.changed) setPerformanceMode(result.state.mode);
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [performanceSetting, paused, reducedMotion]);

  useEffect(() => {
    const un = bossBattleEventBus.subscribe(ev => {
      if (ev.bossId !== bossId) return;
      if (ev.battleId && currentBattleIdRef.current && ev.battleId !== currentBattleIdRef.current) return;
      if (terminalSeenRef.current
        && ev.type !== BOSS_BATTLE_EVENTS.VICTORY
        && ev.type !== BOSS_BATTLE_EVENTS.DEFEAT
        && ev.type !== BOSS_BATTLE_EVENTS.INTERRUPTED) return;
      const eventKey = ev.battleId + ':' + ev.id;
      if (processedEventIds.current.has(eventKey)) return;
      processedEventIds.current.add(eventKey);
      if (processedEventIds.current.size > 300) processedEventIds.current = new Set([...processedEventIds.current].slice(-200));
      if (ev.type === BOSS_BATTLE_EVENTS.ATTACK_SELECTED) {
        attackMetaRef.current = { name: String(ev.payload?.attackName || ''), type: String(ev.payload?.attackType || 'single') };
        return;
      }
      const attackType = String(ev.payload?.attackType || attackMetaRef.current.type || 'single');
      const attackName = String(ev.payload?.attackName || attackMetaRef.current.name || '');
      const warningDuration = Number(ev.payload?.warningDuration) || 0;
      if (ev.type === BOSS_BATTLE_EVENTS.WEAKNESS_CANCELLED) {
        clearWeakness();
        return;
      }
      if (ev.type === BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_FAILED) {
        if (weaknessViewRef.current?.kind === 'crack') clearWeakness();
        return;
      }
      const weaknessKind = weaknessCinematicKindForEvent(ev.type, ev.payload);
      if (weaknessKind) {
        if (phaseRef.current || terminalSeenRef.current || crisisViewRef.current || crisisOverlayActiveRef.current) return;
        const run = weaknessRunRef.current;
        if (run && ev.phaseId && run.phaseId && ev.phaseId !== run.phaseId) return;
        if (run && ev.weaknessId && !run.entries[ev.weaknessId]) return;
        const wkey = weaknessCinematicDedupeKey(ev.battleId, String(ev.weaknessId || ''), ev.id);
        if (processedWeaknessKeys.current.has(wkey)) return;
        processedWeaknessKeys.current.add(wkey);
        if (processedWeaknessKeys.current.size > 300) {
          processedWeaknessKeys.current = new Set([...processedWeaknessKeys.current].slice(-200));
        }
        const payload = (ev.payload || {}) as Record<string, unknown>;
        const name = typeof payload.name === 'string' ? payload.name : '';
        const type = typeof payload.weaknessType === 'string' ? payload.weaknessType : '';
        const detail = weaknessDetailForEvent(weaknessKind, payload, ev.at);
        const current = weaknessViewRef.current;
        const queued = pendingWeaknessQueueRef.current;
        const stageMeta = {
          weaknessId: String(ev.weaknessId || ''),
          weaknessName: name || weaknessNameRef.current,
          weaknessType: type || weaknessTypeRef.current,
          detail,
        };
        if (weaknessKind === 'break' && current?.kind === 'crack') {
          queued.push({ ...stageMeta, kind: 'break', at: current.expiresAt });
        } else if (weaknessKind === 'expose') {
          const last = queued[queued.length - 1];
          let anchor: number | null = null;
          if (last && last.kind === 'break') anchor = last.at + weaknessCinematicStageFor('break').durationMs;
          else if (current?.kind === 'break') anchor = current.expiresAt;
          else if (current?.kind === 'crack') anchor = current.expiresAt + weaknessCinematicStageFor('break').durationMs;
          if (anchor != null) queued.push({ ...stageMeta, kind: 'expose', at: anchor });
          else triggerWeakness(weaknessKind, { ...stageMeta, reason: 'battle' });
        } else {
          triggerWeakness(weaknessKind, {
            weaknessName: name || undefined,
            weaknessId: String(ev.weaknessId || ''),
            weaknessType: type || undefined,
            detail,
            reason: 'battle',
          });
        }
        return;
      }
      const duringPhase = !!phaseRef.current;
      if (duringPhase && (ev.type === BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH || ev.type === BOSS_BATTLE_EVENTS.ATTACK_STARTED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_HIT || ev.type === BOSS_BATTLE_EVENTS.ATTACK_BLOCKED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_DODGED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_INTERRUPTED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_CANCELLED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_RESOLVED)) return;
      const duringWeakness = !!weaknessViewRef.current;
      const duringCrisis = !!crisisViewRef.current || crisisOverlayActiveRef.current;
      if ((duringWeakness || duringCrisis) && (ev.type === BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH || ev.type === BOSS_BATTLE_EVENTS.ATTACK_STARTED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_HIT || ev.type === BOSS_BATTLE_EVENTS.ATTACK_BLOCKED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_DODGED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_INTERRUPTED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_CANCELLED || ev.type === BOSS_BATTLE_EVENTS.ATTACK_RESOLVED)) return;
      switch (ev.type) {
        case BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH: {
          const view: AttackCinematicView = {
            attackId: String(ev.attackId || ''), attackName, attackType,
            phase: 'warning', result: null, profile: attackVisualProfileFor(attackType, bossId),
            startedAt: ev.at, warningDuration: warningDuration || 800, expiresAt: ev.at + (warningDuration || 800) + 250,
          };
          attackViewRef.current = view; setAttackView(view);
          const warningDef = effectDefForId('boss-attack-warning');
          const chargeDef = effectDefForId('boss-attack-charge');
          let st = interruptVisualEffect(runtimeRef.current, 'boss-attack-warning', ev.at);
          st = interruptVisualEffect(st, 'boss-attack-charge', ev.at);
          if (warningDef) st = triggerVisualEffect(st, { ...warningDef, duration: Math.max(260, Math.min(800, Math.round((warningDuration || 800) * .8))), color: view.profile.warningColor }, ev.at, { intensity, performance: perfLevel, reducedMotion, performanceMode }).state;
          if (chargeDef) st = triggerVisualEffect(st, { ...chargeDef, duration: Math.max(300, warningDuration || 900), color: view.profile.chargeColor }, ev.at + 1, { intensity, performance: perfLevel, reducedMotion, performanceMode }).state;
          commit(st);
          break;
        }
        case BOSS_BATTLE_EVENTS.ATTACK_STARTED: {
          let st = runtimeRef.current;
          st = interruptVisualEffect(st, 'boss-attack-warning', ev.at);
          st = interruptVisualEffect(st, 'boss-attack-charge', ev.at);
          const def = effectDefForId('boss-attack-release');
          const profile = attackViewRef.current?.profile || attackVisualProfileFor(attackType, bossId);
          if (def) st = triggerVisualEffect(st, { ...def, color: profile.releaseColor }, ev.at, { intensity, performance: perfLevel, reducedMotion, performanceMode }).state;
          commit(st);
          setAttackView(prev => {
            const base = prev || { attackId: String(ev.attackId || ''), attackName, attackType, profile, startedAt: ev.at, warningDuration, expiresAt: ev.at + 900, phase: 'release' as const, result: null };
            const next = { ...base, phase: 'release' as const, expiresAt: ev.at + 900 };
            attackViewRef.current = next;
            return next;
          });
          break;
        }
        case BOSS_BATTLE_EVENTS.ATTACK_HIT:
        case BOSS_BATTLE_EVENTS.ATTACK_BLOCKED:
        case BOSS_BATTLE_EVENTS.ATTACK_DODGED:
        case BOSS_BATTLE_EVENTS.ATTACK_INTERRUPTED:
        case BOSS_BATTLE_EVENTS.ATTACK_CANCELLED: {
          const kind: AttackCinematicKind = ev.type === BOSS_BATTLE_EVENTS.ATTACK_HIT ? 'hit'
            : ev.type === BOSS_BATTLE_EVENTS.ATTACK_BLOCKED ? 'block'
              : ev.type === BOSS_BATTLE_EVENTS.ATTACK_DODGED ? 'dodge'
                : ev.type === BOSS_BATTLE_EVENTS.ATTACK_INTERRUPTED ? 'interrupt' : 'cancel';
          triggerAttack(kind, attackType, attackName, String(ev.attackId || ''));
          break;
        }
        case BOSS_BATTLE_EVENTS.ATTACK_RESOLVED: {
          const current = attackViewRef.current;
          const next = current && current.phase !== 'result' ? null : current;
          attackViewRef.current = next;
          setAttackView(next);
          break;
        }
        case BOSS_BATTLE_EVENTS.PHASE_TRANSITION: {
          const transitionId = String(ev.payload?.transitionId || ev.id);
          const key = ev.battleId + ':' + transitionId;
          if (processedTransitionIds.current.has(key) || terminalSeenRef.current) return;
          processedTransitionIds.current.add(key);
          const fromIndex = Number(ev.payload?.fromIndex);
          const toIndex = Number(ev.payload?.toIndex);
          const safeFrom = Number.isFinite(fromIndex) ? fromIndex : 0;
          const safeTo = Number.isFinite(toIndex) ? toIndex : safeFrom + 1;
          const toName = String(ev.payload?.toPhaseName || '');
          const theme = phaseTransitionThemeFor(safeTo);
          const now = ev.at;
          const view: PhaseCinematicView = {
            transitionId, fromIndex: safeFrom, toIndex: safeTo, toPhaseName: toName || 'PHASE ' + (safeTo + 1),
            stage: 'pre', startedAt: now, expiresAt: now + PHASE_CINEMATIC_TOTAL_MS, theme, reason: 'battle',
          };
          phaseRef.current = view; setPhaseTransition(view);
          attackViewRef.current = null; setAttackView(null);
          weaknessViewRef.current = null; setWeaknessView(null);
          pendingWeaknessQueueRef.current = [];
          weaknessSequenceRef.current = null;
          crisisViewRef.current = null; setCrisisView(null);
          crisisQueueRef.current = [];
          crisisSequenceRef.current = null;
          let st = runtimeRef.current;
          for (const effectId of ['boss-attack-warning', 'boss-attack-charge', 'boss-attack-release', 'boss-attack-hit', 'boss-attack-block', 'boss-attack-dodge', 'boss-weakness-cinematic', 'boss-crisis-cinematic', 'boss-phase-cinematic']) {
            st = interruptVisualEffect(st, effectId, now);
          }
          const def = effectDefForId('boss-phase-cinematic');
          if (def) st = triggerVisualEffect(st, { ...def, color: theme.primary }, now, { intensity, performance: perfLevel, reducedMotion, performanceMode }).state;
          commit(st);
          break;
        }
        case BOSS_BATTLE_EVENTS.VICTORY:
        case BOSS_BATTLE_EVENTS.DEFEAT:
        case BOSS_BATTLE_EVENTS.INTERRUPTED: {
          const kind = terminalKindForEvent(ev.type, ev.payload);
          if (!kind) break;
          const snapshot = terminalSnapshotOf(ev.type, ev.payload, {
            battleId: ev.battleId, eventId: ev.id, bossId: ev.bossId, phaseId: ev.phaseId || '',
          });
          if (!snapshot) break;
          triggerTerminal(snapshot.kind, {
            source: 'REAL', battleId: snapshot.battleId, eventId: snapshot.eventId,
            bossId: snapshot.bossId, phaseId: snapshot.phaseId, reason: snapshot.reason,
          });
          break;
        }
        default: {
          const effectId = visualEffectIdForBattleEvent(ev.type);
          if (effectId) trigger(effectId);
          break;
        }
      }
    });
    return un;
  }, [bossId, trigger, triggerAttack, triggerWeakness, clearWeakness, triggerTerminal, cleanup, intensity, perfLevel, reducedMotion, performanceMode, commit]);

  useEffect(() => {
    return () => {
      runtimeRef.current = cleanupAllVisualEffects(runtimeRef.current, Date.now());
    };
  }, []);

  return {
    bossId, theme, runtime, intensity, performance: perfLevel,
    performanceMode, performanceSetting, performanceReason,
    frameTime, canvasDpr: maxDprForMode(performanceMode), canvasRenderMs,
    pageHidden, simulatedHidden, paused,
    renderCost: renderCostLevel(performanceMode, runtime.active.length, particleCount),
    fps, reducedMotion, danger, particleCount,
    setIntensity, reportCanvasSample: reportCanvasMs, setPerformanceSetting, setSimulatedHidden, simulateFps,
    stressParticles, stressQueue, stressResize, stressLeak,
    trigger, attack: triggerAttack, attackView,
    phaseTransition, phase: triggerPhase,
    weaknessView, weakness: triggerWeaknessStage, weaknessSequence: startWeaknessSequence,
    interruptWeakness: clearWeakness,
    crisisView, crisisOverlayActive, crisis: triggerCrisisStage, crisisSequence: startCrisisSequence,
    crisisPriority: triggerCrisisPriority, interruptCrisis: clearCrisis, crisisStale: triggerCrisisStale,
    terminalView, terminal: triggerTerminalDev, terminalPriority: triggerTerminalPriority,
    terminalDuplicate: triggerTerminalDuplicate, terminalStale: triggerTerminalStale,
    interruptTerminal, terminalCleanup, terminalSeen: terminalSeenRef.current,
    interrupt, cleanup,
  };
}

function ParticleCanvas({ visuals, onSample }: { visuals: BossBattleVisuals; onSample?: (ms: number) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const count = visuals.particleCount;
    const ctx0 = canvas.getContext('2d');
    if (count <= 0 || visuals.paused) {
      ctx0?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const dpr = Math.min(visuals.canvasDpr, window.devicePixelRatio || 1);
    const resize = () => {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => window.removeEventListener('resize', resize);
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.22 * dpr, vy: (0.12 + Math.random() * 0.35) * dpr,
      size: (0.7 + Math.random() * 1.8) * dpr, alpha: 0.12 + Math.random() * 0.4,
    }));
    let raf = 0;
    const draw = () => {
      const started = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = visuals.theme.primaryColor;
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.vx; p.y += p.vy;
        if (p.y > canvas.height + 4) { p.y = -4; p.x = Math.random() * canvas.width; }
        if (p.x < -4) p.x = canvas.width + 4;
        if (p.x > canvas.width + 4) p.x = -4;
      }
      ctx.globalAlpha = 1;
      if (onSample) onSample(performance.now() - started);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [visuals.particleCount, visuals.theme.primaryColor, visuals.canvasDpr, visuals.paused, onSample]);
  return <canvas ref={ref} className="b6-particles" aria-hidden="true" />;
}

export default function BossBattleVisualLayer({ visuals }: { visuals: BossBattleVisuals }) {
  const profile = VISUAL_INTENSITY_PROFILES[visuals.intensity] || VISUAL_INTENSITY_PROFILES.MEDIUM;
  const shake = visuals.runtime.active.find(e => e.effectType === 'shake');
  const active = visuals.runtime.active;
  const colors = { '--b6-primary': visuals.theme.primaryColor, '--b6-secondary': visuals.theme.secondaryColor, '--b6-danger': visuals.theme.dangerColor } as React.CSSProperties;
  const weakness = visuals.weaknessView;
  const weaknessTypeLabel = weakness && weakness.weaknessType
    ? (WEAKNESS_TYPE_LABEL as Record<string, string>)[weakness.weaknessType] || ''
    : '';
  const scanningWeakness = weakness?.kind === 'scan';
  const crisis = visuals.crisisView;
  const terminalActive = !!visuals.terminalView;
  const phaseOrTerminal = !!visuals.phaseTransition || terminalActive;
  return (
    <>
    <div
      className={'b6-visual-root' + (visuals.reducedMotion ? ' b6-reduced' : '') + (shake ? ' b6-shaking' : '') + (visuals.danger ? ' b6-danger' : '') + (visuals.paused ? ' b6-hidden' : '') + ' b6-mode-' + visuals.performanceMode.toLowerCase()}
      data-intensity={visuals.intensity}
      data-performance={visuals.performance}
      data-performance-mode={visuals.performanceMode}
      data-theme={visuals.theme.visualTheme}
      style={{ ...colors, ['--b6-shake' as string]: String(shake ? shake.intensity * 8 : 0), ['--b6-scanline' as string]: String(profile.scanline) }}
      aria-hidden="true"
    >
      <div className="b6-ambient-grid" />
      {!visuals.reducedMotion && visuals.intensity !== 'LOW' && <div className="b6-scanlines" />}
      <ParticleCanvas visuals={visuals} onSample={visuals.reportCanvasSample} />
      {visuals.phaseTransition && !terminalActive && (
        <div
          className={'b6-phase-cine b6-phase-' + visuals.phaseTransition.stage}
          style={{ ['--b6-phase-primary' as string]: visuals.phaseTransition.theme.primary, ['--b6-phase-secondary' as string]: visuals.phaseTransition.theme.secondary, ['--b6-phase-danger' as string]: visuals.phaseTransition.theme.danger }}
        >
          <div className="b6-phase-kicker">{visuals.phaseTransition.stage === 'reveal' ? 'BOSS SYSTEM EVOLVED' : 'PHASE TRANSITION'}</div>
          <div className="b6-phase-number">{phaseRevealNumber(visuals.phaseTransition.toIndex)}</div>
          <div className="b6-phase-name">{visuals.phaseTransition.toPhaseName}</div>
          <div className="b6-phase-stage">{[...PHASE_CINEMATIC_STAGES].find(x => x.stage === visuals.phaseTransition!.stage)?.label || visuals.phaseTransition.stage}</div>
        </div>
      )}
      {crisis && !phaseOrTerminal && (
        <div
          className={'b6-crisis-cine b6-crisis-' + crisis.stage}
          role="status"
          aria-live="polite"
          style={{
            ['--b6-crisis-primary' as string]: crisis.theme.primary,
            ['--b6-crisis-secondary' as string]: crisis.theme.secondary,
            ['--b6-crisis-danger' as string]: crisis.theme.danger,
            ['--b6-crisis-duration' as string]: (crisis.expiresAt - crisis.startedAt) + 'ms',
          }}
        >
          <div className="b6-crisis-kicker">
            {crisis.kicker}
            {crisis.source === 'DEV' && <span className="b6-crisis-dev">DEV</span>}
          </div>
          <div className="b6-crisis-title">{crisis.title}</div>
          <div className="b6-crisis-text">{crisis.text}</div>
          <div className="b6-crisis-detail">{crisis.detail}</div>
          <div className="b6-crisis-meta">{crisis.statusLabel} · {crisis.stageLabel}</div>
        </div>
      )}
      {weakness && !phaseOrTerminal && (
        <div
          className={'b6-weak-cine b6-weak-' + weakness.kind}
          role="status"
          aria-live="polite"
          style={{
            ['--b6-weak-primary' as string]: weakness.theme.primary,
            ['--b6-weak-secondary' as string]: weakness.theme.secondary,
            ['--b6-weak-danger' as string]: weakness.theme.danger,
            ['--b6-weak-duration' as string]: (weakness.expiresAt - weakness.startedAt) + 'ms',
          }}
        >
          <div className="b6-weak-kicker">
            {weakness.kicker}
            {weakness.reason === 'dev' && <span className="b6-weak-dev">DEV</span>}
          </div>
          <div className="b6-weak-title">
            {scanningWeakness ? 'SCANNING BOSS DATA' : (weakness.weaknessName || weakness.stageLabel)}
          </div>
          {!scanningWeakness && weaknessTypeLabel && <div className="b6-weak-type">{weaknessTypeLabel}</div>}
          <div className="b6-weak-text">{weakness.text}</div>
          {weakness.detail && weakness.detail !== weakness.text && <div className="b6-weak-detail">{weakness.detail}</div>}
          <div className="b6-weak-stage">{weakness.stageLabel}</div>
        </div>
      )}
      {visuals.attackView && !phaseOrTerminal && (
        <div
          className={'b6-attack-cine b6-attack-' + visuals.attackView.phase + ' b6-vt-' + visuals.attackView.profile.visualType}
          style={{ ['--b6-attack-color' as string]: visuals.attackView.phase === 'warning' ? visuals.attackView.profile.warningColor : visuals.attackView.phase === 'release' ? visuals.attackView.profile.releaseColor : visuals.attackView.profile.hitColor }}
        >
          <div className="b6-attack-kicker">
            {visuals.attackView.phase === 'warning' ? 'WARNING · BOSS ATTACK DETECTED' : visuals.attackView.phase === 'charge' ? 'ENERGY CHARGING' : visuals.attackView.phase === 'release' ? 'ATTACK RELEASE' : 'COMBAT RESULT'}
          </div>
          <div className="b6-attack-title">
            {visuals.attackView.phase === 'result' && visuals.attackView.result
              ? attackResultLabel(visuals.attackView.result)
              : visuals.attackView.attackName || 'Boss 攻击'}
          </div>
          <div className="b6-attack-desc">
            {visuals.attackView.phase === 'warning'
              ? '攻击即将释放 · DEFEND / DODGE'
              : visuals.attackView.phase === 'result' && visuals.attackView.result
                ? attackResultText(visuals.attackView.result)
                : visuals.attackView.phase === 'release' ? '攻击轨迹已释放' : 'Boss 正在聚集攻击能量'}
          </div>
        </div>
      )}
      {active.map(e => (
        <div
          key={e.instanceId}
          className={'b6-effect b6-' + e.effectType + ' b6-layer-' + e.layer}
          style={{
            ['--b6-effect-color' as string]: e.color || (e.effectType === 'glitch' ? visuals.theme.dangerColor : visuals.theme.primaryColor),
            ['--b6-effect-intensity' as string]: String(e.intensity),
            animationDuration: e.duration + 'ms',
          }}
        />
      ))}
    </div>
    <CrisisCinematicPortal visuals={visuals} />
    <TerminalCinematicPortal visuals={visuals} />
    </>
  );
}

/** 终结演出 Portal：位于真实 Settlement（z=950）之上，pointer-events:none，只负责视觉过渡。 */
function TerminalCinematicPortal({ visuals }: { visuals: BossBattleVisuals }) {
  const t = visuals.terminalView;
  if (typeof document === 'undefined' || !t) return null;
  return createPortal(
    <div
      className={'b6-terminal-portal b6-terminal-' + t.kind + ' b6-terminal-stage-' + t.stage + ' b6-mode-' + visuals.performanceMode.toLowerCase() + (visuals.reducedMotion ? ' b6-reduced' : '') + (visuals.paused ? ' b6-hidden' : '')}
      aria-hidden="true"
      style={{
        ['--b6-terminal-primary' as string]: t.theme.primary,
        ['--b6-terminal-secondary' as string]: t.theme.secondary,
        ['--b6-terminal-danger' as string]: t.theme.danger,
      }}
    >
      <div className="b6-terminal-frame" />
      <div className="b6-terminal-strip">
        <div className="b6-terminal-strip-kicker">
          {t.kicker}
          {t.source === 'DEV' && <span className="b6-terminal-dev">DEV</span>}
        </div>
        <div className="b6-terminal-strip-title">{t.title}</div>
        <div className="b6-terminal-strip-meta">{t.bossName} · {t.stageLabel}</div>
      </div>
      {t.reveal && (
        <div className="b6-terminal-reveal">
          <div className="b6-terminal-result">{t.result}</div>
          <div className="b6-terminal-boss">{t.bossName}</div>
          <div className="b6-terminal-stage-label">{t.stageLabel}</div>
          <div className="b6-terminal-desc">{t.description}</div>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** 真实危机覆盖层之上的纯视觉顶栏/边框；pointer-events:none，不创建第二个引擎。 */
function CrisisCinematicPortal({ visuals }: { visuals: BossBattleVisuals }) {
  const crisis = visuals.crisisView;
  if (typeof document === 'undefined' || !visuals.crisisOverlayActive || !crisis || visuals.terminalView || visuals.phaseTransition) return null;
  return createPortal(
    <div
      className={'b6-crisis-portal b6-crisis-portal-' + crisis.stage + ' b6-mode-' + visuals.performanceMode.toLowerCase() + (visuals.reducedMotion ? ' b6-reduced' : '') + (visuals.paused ? ' b6-hidden' : '')}
      aria-hidden="true"
      style={{
        ['--b6-crisis-primary' as string]: crisis.theme.primary,
        ['--b6-crisis-secondary' as string]: crisis.theme.secondary,
        ['--b6-crisis-danger' as string]: crisis.theme.danger,
      }}
    >
      <div className="b6-crisis-frame" />
      <div className="b6-crisis-strip">
        <div className="b6-crisis-strip-kicker">
          {crisis.kicker}
          {crisis.source === 'DEV' && <span className="b6-crisis-dev">DEV</span>}
        </div>
        <div className="b6-crisis-strip-title">{crisis.title}</div>
        <div className="b6-crisis-strip-meta">{crisis.stageLabel} · {crisis.statusLabel}</div>
      </div>
    </div>,
    document.body,
  );
}
