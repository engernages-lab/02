import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import Terminal, { type TermLine } from '../components/Terminal';
import PlayerStatus from '../components/PlayerStatus';
import BossAvatar from '../components/BossAvatar';
import CinematicStage from '../components/CinematicStage';
import { useGame, type DifficultyClearInfo } from '../store/gameStore';
import { bossById, type BossDef } from '../game/bosses';
import {
  battleFor, normalizeBattleState, hpPercent, phaseCheckCount, popcount,
  type BossBattleDef,
} from '../game/battle';
import { bossBattleDef, bossDifficulties, difficultyCheckCount } from '../game/bossDifficulties';
import { BOSS_DIFFICULTIES, difficultyMeta, difficultyOf, type BossDifficulty } from '../game/difficulty';
import { bossGate } from '../game/chapterFlow';
import type { BossFirstClearPayload } from '../game/chapterFlow';
import { knowledgeById } from '../game/knowledge';
import { fragmentById, type CreatorFragmentDef } from '../game/lore/fragments';
import { chapterById } from '../game/lore/chapters';
import { levelsOfServer } from '../game/levels';
import { miraLevelProgress, miraRiskFor, normalizeMiraState } from '../game/miraCore';
import { buildChapterSettlement } from '../game/economy';
import { topBugsForChapter } from '../game/codex';
import FragmentGain from '../components/FragmentGain';
import { bossScenesFor } from '../game/lore/bossScenes';
import { CHAPTER6_FINAL_MEMORY_SCENES } from '../game/lore/chapter6';
import { filterMarkerLines } from '../services/judge';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { play } from '../services/sound';
import { buildBossPhasePlan } from '../game/bossPhasePlans';
import { BOSS_BATTLE_STATUS_LABEL, phaseHpView, phaseIndexForHp, bossBattleEventBus, BOSS_BATTLE_EVENTS } from '../game/bossPhaseEngine';
import { isBlocking as isDynamicEventBlocking } from '../game/eventEngine';
import {
  ATTACK_STATUS_LABEL, ATTACK_TYPE_LABEL, DANGER_LABEL,
  attackRemainingMs, telegraphProgress, responseReadyIn,
} from '../game/bossAttackEngine';
import { devToolsOn } from '../game/devMode';
import { exposureInfo } from '../game/bossWeaknessEngine';
import { weaknessDefinitionsFor } from '../game/bossWeaknessCatalog';
import BossPhaseDevPanel from '../components/BossPhaseDevPanel';
import BossAttackDevPanel from '../components/BossAttackDevPanel';
import BossWeaknessPanel from '../components/BossWeaknessPanel';
import BossWeaknessDevPanel from '../components/BossWeaknessDevPanel';
import CombatArbiterDevPanel from '../components/CombatArbiterDevPanel';
import BossStatsDevPanel from '../components/BossStatsDevPanel';
import BossRatingDevPanel from '../components/BossRatingDevPanel';
import BossRewardDevPanel from '../components/BossRewardDevPanel';
import BossAchievementDevPanel from '../components/BossAchievementDevPanel';
import BossBattleSettlement from '../components/BossBattleSettlement';
import BossSettlementDevPanel from '../components/BossSettlementDevPanel';
import BossBattleVisualLayer, { useBossBattleVisuals } from '../components/BossBattleVisualLayer';
import BossVisualDevPanel from '../components/BossVisualDevPanel';
import { buildBossSettlementData, type BossSettlementData } from '../game/bossSettlement';

export default function BossBattlePage() {
  const g = useGame();
  const boss = bossById(g.player.progress.currentBossId || '');
  const raw = boss ? (g.player.progress.battles || {})[boss.id] : undefined;
  const difficulty = difficultyOf(raw && typeof raw === 'object' ? (raw as { difficulty?: unknown }).difficulty : undefined);
  const def = boss ? bossBattleDef(boss.id, difficulty) : undefined;
  if (!boss || !def) return null;
  return <BattleView boss={boss} def={def} difficulty={difficulty} />;
}

function BattleView({ boss, def, difficulty }: { boss: BossDef; def: BossBattleDef; difficulty: BossDifficulty }) {
  const g = useGame();
  const gRef = useRef(g);
  gRef.current = g;
  const player = g.player;
  const visuals = useBossBattleVisuals(boss.id);
  const respawnTick = g.respawnTick;
  const diffMeta = difficultyMeta(difficulty);

  // 统一门禁：章节开放 / 普通关卡 / 原初核心 / 模拟再战
  const gate = bossGate(player, boss.id);
  const canFight = gate.available || gate.simulation;
  const locked = !canFight;
  const sim = gate.simulation;

  const stored = useMemo(
    () => normalizeBattleState((player.progress.battles || {})[boss.id], def),
    [player.progress.battles, boss.id, def],
  );
  const phaseIndex = Math.min(stored.phase, def.phases.length - 1);
  const phase = def.phases[phaseIndex];

  // 多阶段战斗（V1.3-B.1）：战斗阶段叠加在判题阶段之上
  const phasePlan = useMemo(() => buildBossPhasePlan(boss.id, difficulty), [boss.id, difficulty]);
  const phaseRun = g.bossPhaseRunOf(boss.id);
  const battlePhaseIndex = phasePlan
    ? Math.min(phaseRun ? phaseRun.currentPhaseIndex : phaseIndexForHp(phasePlan, stored.hp), phasePlan.phases.length - 1)
    : 0;
  const battlePhase = phasePlan ? phasePlan.phases[battlePhaseIndex] : undefined;
  const battlePhaseTotal = phasePlan ? phasePlan.phases.length : 1;
  const phaseTransitioning = phaseRun ? phaseRun.status === 'phase_transition' : false;
  const battleStatus = phaseRun ? phaseRun.status : 'active';
  const battleStatusLabel = BOSS_BATTLE_STATUS_LABEL[battleStatus] || battleStatus;
  const battleLocked = !!phaseRun && (phaseRun.status === 'phase_transition' || phaseRun.status === 'victory' || phaseRun.status === 'defeat' || phaseRun.status === 'interrupted');
  const localPhaseHp = phasePlan && phaseRun ? phaseHpView(phasePlan, { ...phaseRun, hp: stored.hp }, battlePhaseIndex) : null;
  const transitionInfo = phaseRun ? phaseRun.transition : null;
  const transitionFrom = transitionInfo && phasePlan ? phasePlan.phases[transitionInfo.fromIndex] : undefined;
  const transitionTo = transitionInfo && phasePlan ? phasePlan.phases[transitionInfo.toIndex] : undefined;
  const dynamicBlocking = isDynamicEventBlocking(player.progress.dynamicEvent || null);
  const eventLocked = g.event.kind !== 'none' || dynamicBlocking;
  const arbiterState = g.combatArbiterStateOf(boss.id);

  // 主动攻击（V1.3-B.2）：攻击状态只读，倒计时由页面单一调度器推进
  const attack = g.bossAttackStateOf(boss.id);
  const [attackNow, setAttackNow] = useState(() => Date.now());
  const attackPattern = attack ? attack.currentPattern : null;
  const attackInWarning = !!attack && (attack.attackState === 'telegraph' || attack.attackState === 'attacking');
  const attackActive = !!attack && (attackInWarning || attack.attackState === 'resolving');
  const attackRemain = attack ? attackRemainingMs(attack, attackNow) : null;
  const attackProgress = attack ? telegraphProgress(attack, attackNow) : 0;
  const defenseReady = attack ? responseReadyIn(attack, 'defend', attackNow) : 0;
  const dodgeReady = attack ? responseReadyIn(attack, 'dodge', attackNow) : 0;
  const guardActive = !!attack && attack.guardUntil != null && attackNow <= attack.guardUntil;
  const dodgeActive = !!attack && attack.dodgeUntil != null && attackNow <= attack.dodgeUntil;
  const canRespond = attackInWarning && !battleLocked && !eventLocked && (attack ? attack.attackState === 'telegraph' || attack.attackState === 'attacking' : false);
  const nextAttackIn = attack ? Math.max(0, attack.nextAttackAt - attackNow) : 0;
  const attackStatusLabel = attack ? (ATTACK_STATUS_LABEL[attack.attackState] || attack.attackState) : '待机';

  // 弱点（V1.3-B.3）
  const weakness = g.bossWeaknessStateOf(boss.id);
  const weaknessDefs = useMemo(() => weaknessDefinitionsFor(boss.id, difficulty), [boss.id, difficulty]);
  const weakExposure = weakness ? exposureInfo(weakness, weaknessDefs, attackNow) : null;
  const totalChecks = phaseCheckCount(phase);
  // 难度影响提示层级：简单=完整三层，困难=前两层，专家=仅一层思路提示
  const maxHint = difficulty === 'easy' ? phase.hints.length : difficulty === 'hard' ? Math.min(2, phase.hints.length) : Math.min(1, phase.hints.length);
  const passedChecks = popcount(stored.phaseMask[phaseIndex] || 0);
  const pct = hpPercent(stored);
  const alreadyCleared = stored.cleared || (player.progress.bossesDone || []).includes(boss.id);
  const battleInProgress = !!player.progress.battles?.[boss.id] && !stored.cleared && stored.started;
  const failures = player.progress.failedAttempts[boss.id] || 0;

  const [code, setCode] = useState(phase.initialCode);
  const [term, setTerm] = useState<TermLine[]>([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<import('../services/judge').JudgeVerdict | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [pyState, setPyState] = useState<PyState>({ status: 'idle', phase: '' });
  const [hitKey, setHitKey] = useState(0);
  const [counterKey, setCounterKey] = useState(0);
  const [countered, setCountered] = useState(false);
  const [broken, setBroken] = useState(false);
  const [breakBanner, setBreakBanner] = useState<{ phase: number; title: string } | null>(null);
  const [popups, setPopups] = useState<{ id: number; value: number }[]>([]);
  const [log, setLog] = useState<{ id: number; text: string; kind: 'hit' | 'fail' | 'phase' | 'win' }[]>([]);
  const [introOpen, setIntroOpen] = useState(false);
  const [outroOpen, setOutroOpen] = useState(false);
  const [cleared, setCleared] = useState<BossFirstClearPayload | null>(null);
  const [pendingClear, setPendingClear] = useState<BossFirstClearPayload | null>(null);
  const [gain, setGain] = useState<CreatorFragmentDef | null>(null);
  const [finalMemoryOpen, setFinalMemoryOpen] = useState(false);
  const [selectionOpen, setSelectionOpen] = useState(true);
  const [picked, setPicked] = useState<BossDifficulty>(difficulty);
  const [simResult, setSimResult] = useState<DifficultyClearInfo | null>(null);
  const [settlementData, setSettlementData] = useState<BossSettlementData | null>(null);
  const [settlementPreview, setSettlementPreview] = useState(false);
  const settlementShownRef = useRef<Set<string>>(new Set());
  const popSeq = useRef(1);
  const logSeq = useRef(1);
  const scenes = bossScenesFor(boss.id);
  const fragDef = fragmentById(boss.fragmentId);

  const pushLines = useCallback((lines: TermLine[]) => setTerm(t => [...t.slice(-200), ...lines]), []);
  const addLog = useCallback((text: string, kind: 'hit' | 'fail' | 'phase' | 'win') => {
    const id = logSeq.current++;
    setLog(l => [...l.slice(-30), { id, text, kind }]);
  }, []);
  const pushDamage = useCallback((value: number) => {
    if (value <= 0) return;
    const id = popSeq.current++;
    setPopups(p => [...p, { id, value }]);
    window.setTimeout(() => setPopups(p => p.filter(x => x.id !== id)), 900);
  }, []);

  useEffect(() => {
    warmUp();
    const un = onPyStatus(s => setPyState(s));
    return un;
  }, []);

  // 进入战斗：没有任何战斗记录时先创建推荐难度（EASY）的初始状态；
  // 难度选择界面仍会覆盖在上层，玩家选择后由 startBossBattle 重置为所选难度。
  useEffect(() => {
    if (locked) return;
    if (!(g.player.progress.battles || {})[boss.id]) g.beginBossBattle(boss.id, 'easy');
    g.ensureBossBattleStats(boss.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id, locked]);

  // 战前演出（首次；模拟再战不重复）
  useEffect(() => {
    if (locked || sim) { setIntroOpen(false); return; }
    setIntroOpen(!player.progress.storySeen['bossIntro_' + boss.id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id, locked, sim]);

  // 阶段变化 → 载入该阶段题目
  useEffect(() => {
    const p = def.phases[Math.min(stored.phase, def.phases.length - 1)];
    setCode(p.initialCode);
    setVerdict(null);
    setErrorLine(null);
    setHintLevel(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored.phase, boss.id, respawnTick, def.difficulty, phase.id]);

  // Boss 反击 → 玩家受击反馈（红屏 + 抖动）
  useEffect(() => {
    if (!counterKey) return;
    setCountered(true);
    const t = window.setTimeout(() => setCountered(false), 520);
    return () => window.clearTimeout(t);
  }, [counterKey]);

  // 意识崩解重生后，战斗已被重置 → 重新打开难度选择（允许重新选择）
  useEffect(() => {
    if (respawnTick > 0) setSelectionOpen(true);
  }, [respawnTick]);

  // 刷新/失败/撤退：终态自动恢复结算；胜利首次演出由 startVictory/模拟再战显式打开
  useEffect(() => {
    if (!phaseRun || !phaseRun.battleId) return;
    if (phaseRun.status !== 'victory' && phaseRun.status !== 'defeat' && phaseRun.status !== 'interrupted') return;
    const bid = phaseRun.battleId;
    if (settlementShownRef.current.has(bid)) return;
    if (phaseRun.status === 'victory') {
      if (pendingClear || gain || cleared || simResult || finalMemoryOpen || introOpen || outroOpen) return;
      const timer = window.setTimeout(() => {
        if (settlementShownRef.current.has(bid)) return;
        const data = buildBossSettlementData(gRef.current.player, bid, { now: Date.now() });
        if (data) {
          settlementShownRef.current.add(bid);
          setSettlementPreview(false);
          setSettlementData(data);
        }
      }, 650);
      return () => window.clearTimeout(timer);
    }
    const data = buildBossSettlementData(gRef.current.player, bid, { now: Date.now() });
    if (data) {
      settlementShownRef.current.add(bid);
      setSettlementPreview(false);
      setSettlementData(data);
    }
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseRun ? phaseRun.status : null, phaseRun ? phaseRun.battleId : null, pendingClear, gain, cleared, simResult, finalMemoryOpen, introOpen, outroOpen]);

  // 重新进入 Boss 页面/刷新后：若本场结算尚未被关闭，恢复最近一场终态结算
  useEffect(() => {
    // 仅在当前 Boss 没有进行中的新战斗时恢复上一场终态结算，避免模拟再战/DEV 页面被旧结算遮挡
    if (phaseRun && phaseRun.status !== 'victory' && phaseRun.status !== 'defeat' && phaseRun.status !== 'interrupted') return;
    const store = gRef.current.player.progress.bossBattleStats;
    const latest = store && Array.isArray(store.history)
      ? [...store.history].filter(s => s.bossId === boss.id && s.finalized && (s.result === 'victory' || s.result === 'defeat' || s.result === 'retreat' || s.result === 'interrupted')).sort((a, b) => (a.endedAt || 0) - (b.endedAt || 0)).pop()
      : null;
    if (!latest || settlementShownRef.current.has(latest.battleId)) return;
    if (pendingClear || gain || cleared || simResult || finalMemoryOpen || introOpen || outroOpen) return;
    try { if (sessionStorage.getItem(settlementDismissedKey(latest.battleId))) return; } catch { /* ignore */ }
    const timer = window.setTimeout(() => {
      if (settlementShownRef.current.has(latest.battleId)) return;
      const data = buildBossSettlementData(gRef.current.player, latest.battleId, { now: Date.now() });
      if (data) {
        settlementShownRef.current.add(latest.battleId);
        setSettlementPreview(false);
        setSettlementData(data);
      }
    }, 650);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id, phaseRun ? phaseRun.status : null, player.progress.bossBattleStats, player.progress.bossBattleRatings, pendingClear, gain, cleared, simResult, finalMemoryOpen, introOpen, outroOpen]);

  // 阶段切换演出：切换期间锁定提交，1.6s 后完成初始化（幂等；刷新后也能安全完成）
  const phaseTransitionRef = useRef<string | null>(null);
  useEffect(() => {
    const t = phaseRun ? phaseRun.transition : null;
    if (!phaseRun || phaseRun.status !== 'phase_transition' || !t) {
      phaseTransitionRef.current = null;
      return;
    }
    if (phaseTransitionRef.current === t.id) return;
    phaseTransitionRef.current = t.id;
    play('alarm');
    const timer = window.setTimeout(() => {
      gRef.current.completeBossPhaseTransition(boss.id);
    }, 1600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseRun ? phaseRun.status : null, phaseRun && phaseRun.transition ? phaseRun.transition.id : null, boss.id]);

  // 攻击唯一调度器：页面内单一定时器（卸载即清理）；无变化时 store 不写存档
  useEffect(() => {
    if (locked) return;
    let lastTick = 0;
    const tick = () => {
      const now = Date.now();
      if (now - lastTick >= 140) {
        lastTick = now;
        gRef.current.tickBossAttack(boss.id);
        gRef.current.tickBossWeakness(boss.id);
        gRef.current.tickCombatArbiter(boss.id);
      }
      const st = gRef.current.bossAttackStateOf(boss.id);
      if (st && (st.attackState === 'telegraph' || st.attackState === 'attacking' || st.attackState === 'resolving' || st.attackState === 'cooldown')) {
        setAttackNow(now);
      }
      const wk = gRef.current.bossWeaknessStateOf(boss.id);
      if (wk && Object.values(wk.entries).some(e => e.status === 'analyzing' || e.status === 'exposed')) setAttackNow(now);
    };
    tick();
    const id = window.setInterval(tick, 140);
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id, locked]);

  // 攻击事件 → 战斗记录 / 命中反馈
  useEffect(() => {
    const un = bossBattleEventBus.subscribe(ev => {
      if (ev.bossId !== boss.id) return;
      const name = String(ev.payload.attackName || ev.attackId || 'Boss 攻击');
      switch (ev.type) {
        case BOSS_BATTLE_EVENTS.ATTACK_TELEGRAPH: {
          const sec = Math.round((Number(ev.payload.warningDuration) || 0) / 100) / 10;
          addLog('⚠ ' + name + ' 预警 · 约 ' + sec + 's 后命中', 'phase');
          play('threat');
          break;
        }
        case BOSS_BATTLE_EVENTS.ATTACK_HIT: {
          const amount = Number(ev.payload.amount) || 0;
          addLog('受到「' + name + '」命中 · 意识 -' + amount, 'fail');
          setCounterKey(k => k + 1);
          break;
        }
        case BOSS_BATTLE_EVENTS.ATTACK_BLOCKED: {
          const amount = Number(ev.payload.amount) || 0;
          addLog('防御成功 · 减伤后受到 ' + amount + ' 点伤害', 'hit');
          g.toast('success', '防御成功：意识 -' + amount);
          play('shield');
          break;
        }
        case BOSS_BATTLE_EVENTS.ATTACK_DODGED:
          addLog('闪避成功 · 未受到伤害', 'hit');
          g.toast('success', '闪避成功');
          play('success');
          break;
        case BOSS_BATTLE_EVENTS.ATTACK_RESOLVED:
          addLog('Boss 攻击结束 · 战斗恢复', 'phase');
          break;
        case BOSS_BATTLE_EVENTS.ATTACK_CANCELLED:
          if (ev.payload.reason === 'phase-change') addLog('阶段切换：Boss 攻击已取消', 'phase');
          break;
        case BOSS_BATTLE_EVENTS.WEAKNESS_HINT:
          addLog('线索解锁：' + String(ev.payload.text || ''), 'phase');
          play('click');
          break;
        case BOSS_BATTLE_EVENTS.WEAKNESS_DISCOVERED:
          addLog('弱点已发现：' + String(ev.payload.name || '未知弱点'), 'win');
          g.toast('achieve', '弱点已发现：' + String(ev.payload.name || ''));
          play('unlock');
          break;
        case BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_SUCCESS:
          addLog('弱点破解成功 · 真实判题通过', 'win');
          play('levelup');
          break;
        case BOSS_BATTLE_EVENTS.WEAKNESS_CHALLENGE_FAILED:
          addLog('弱点破解失败', 'fail');
          play('error');
          break;
        case BOSS_BATTLE_EVENTS.WEAKNESS_EXPOSED:
          addLog('WEAKNESS EXPOSED · Boss 核心漏洞已暴露', 'phase');
          play('alarm');
          break;
        case BOSS_BATTLE_EVENTS.WEAKNESS_RECOVERED:
          addLog('Boss 弱点已恢复', 'phase');
          break;
        case BOSS_BATTLE_EVENTS.WEAKNESS_CANCELLED:
          if (ev.payload.reason === 'phase-change') addLog('阶段切换：旧阶段弱点已失效', 'phase');
          break;
        default:
          break;
      }
    });
    return un;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id]);


  const backToMap = () => {
    play('click');
    g.setCurrentBoss(null);
    g.nav('map');
  };

  const openSettlement = useCallback((battleId?: string | null, context?: { fragmentGranted?: boolean; failureReason?: string }) => {
    const bid = battleId || gRef.current.bossPhaseRunOf(boss.id)?.battleId;
    if (!bid) return;
    const data = buildBossSettlementData(gRef.current.player, bid, { ...context, now: Date.now() });
    if (!data) return;
    settlementShownRef.current.add(bid);
    setSettlementPreview(false);
    setSettlementData(data);
  }, [boss.id]);

  const settlementDismissedKey = (battleId: string) => 'nexus_settlement_dismissed:' + battleId;
  const closeSettlement = () => {
    if (settlementData) {
      try { sessionStorage.setItem(settlementDismissedKey(settlementData.battleId), '1'); } catch { /* ignore */ }
    }
    setSettlementPreview(false);
    setSettlementData(null);
  };

  const abandonWithSettlement = () => {
    const bid = phaseRun?.battleId;
    play('click');
    g.abandonBossBattle(boss.id);
    if (bid) window.setTimeout(() => openSettlement(bid, { failureReason: '玩家主动撤退' }), 0);
  };

  const startChallenge = (d: BossDifficulty) => {
    const s = g.startBossBattle(boss.id, d);
    if (!s) {
      g.toast('warn', '无法开始该难度：请检查章节/Boss 门禁或战斗状态。');
      play('deny');
      return;
    }
    setPicked(d);
    setSelectionOpen(false);
    play('unlock');
  };

  /** 只是运行代码（预览输出），不参与 Boss 掉血 */
  const run = async () => {
    if (running || submitting || eventLocked || !canFight || battleLocked) return;
    setRunning(true);
    setVerdict(null);
    setErrorLine(null);
    pushLines([{ kind: 'cmd', text: 'python gate.py' }, { kind: 'sys', text: '正在与 ' + boss.codename + ' 的防御比对……' }]);
    play('run');
    const r = await runPython(code, { timeoutMs: 5000 });
    setRunning(false);
    const stdout = filterMarkerLines(r.stdout || '');
    if (r.timedOut) {
      pushLines([{ kind: 'err', text: '执行超时：防御协议吞掉了你的进程。' }]);
      return;
    }
    if (!r.ok) {
      pushLines([
        ...(stdout.trim() ? [{ kind: 'out' as const, text: stdout.replace(/\n$/, '') }] : []),
        { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
      ]);
      if (r.error?.line) setErrorLine(r.error.line);
      return;
    }
    pushLines([{ kind: 'out', text: stdout.replace(/\n$/, '') || '(无输出)' }]);
  };

  /** 唯一攻击入口：真实 Python 判题 / 伤害 / 首胜事务都在 store 内完成 */
  const submit = async () => {
    if (running || submitting || eventLocked || !canFight || battleLocked) return;
    setSubmitting(true);
    setVerdict(null);
    setErrorLine(null);
    play('run');
    pushLines([{ kind: 'cmd', text: 'python gate.py --attack （阶段 ' + (phaseIndex + 1) + '：' + phase.title + '）' }]);

    const out = await g.submitBossAttack(boss.id, phaseIndex, code);
    setSubmitting(false);

    if (out.status === 'blocked') {
      pushLines([{ kind: 'err', text: out.reason || '提交被拒绝' }]);
      play(out.denied ? 'deny' : 'error');
      return;
    }

    const stdout = filterMarkerLines(out.run?.stdout || '');
    if (out.status === 'timeout') {
      pushLines([{ kind: 'err', text: '攻击超时：防御协议没有被破坏。' }]);
    } else if (out.status === 'error') {
      pushLines([
        ...(stdout.trim() ? [{ kind: 'out' as const, text: stdout.replace(/\n$/, '') }] : []),
        { kind: 'err', text: out.run?.error ? out.run.error.type + ': ' + out.run.error.message : '执行出错' },
      ]);
      if (out.run?.error?.line) setErrorLine(out.run.error.line);
    }

    if (out.verdict) setVerdict(out.verdict);
    if (out.countered) {
      play('error');
      setCounterKey(k => k + 1);
      addLog('未造成伤害（' + (out.status === 'timeout' ? '执行超时' : out.status === 'error' ? '执行出错' : '判题未通过') + '）· 意识 -' + def.counterDamage, 'fail');
      if (out.toleranceTriggered) g.toast('warn', '容错次数用尽——纠错者锁定你了！');
    }

    // 模拟再战：整场真实战斗，完成后只记录难度成绩，不发碎片/章节奖励
    if (out.status === 'simVictory') {
      const dc = out.difficultyClear || null;
      setSimResult(dc);
      openSettlement(phaseRun?.battleId);
      addLog('模拟再战完成 · ' + diffMeta.label + (dc ? ' · 获得 ' + dc.exp + ' 经验 / ' + dc.credits + ' 贡献点' : ''), 'win');
      play('levelup');
      return;
    }

    if (out.status === 'miss') {
      pushLines([
        { kind: 'sys', text: '── 攻击结果 ──' },
        ...((out.verdict?.checks || []).map(c => ({ kind: (c.ok ? 'ok' : 'err') as TermLine['kind'], text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' —— ' + c.detail : '') }))),
        { kind: 'err', text: sim ? '模拟再战未命中：不扣意识、不增加容错。' : '这次没有命中防御核心。' },
      ]);
      return;
    }

    if ((out.status === 'hit' || out.status === 'victory') && out.result) {
      const res = out.result;
      setHitKey(k => k + 1);
      pushDamage(res.damage);
      pushLines([
        { kind: 'sys', text: '── 攻击结果 ──' },
        ...((out.verdict?.checks || []).map(c => ({ kind: (c.ok ? 'ok' : 'err') as TermLine['kind'], text: (c.ok ? '✓ ' : '✗ ') + c.name }))),
        { kind: 'ok', text: '命中防御核心：' + res.newPassed + '/' + res.total + ' 项测试通过，造成 ' + res.damage + ' 点伤害。' },
      ]);
      addLog('命中 · 通过 ' + res.newPassed + '/' + res.total + ' · 伤害 ' + res.damage, 'hit');
      play('success');

      if (res.phaseCleared) {
        setBroken(true);
        window.setTimeout(() => setBroken(false), 1300);
        setBreakBanner({ phase: phaseIndex + 1, title: phase.title });
        window.setTimeout(() => setBreakBanner(null), 1900);
        addLog('防御破裂 · 阶段 ' + (phaseIndex + 1) + '「' + phase.title + '」已击破', 'phase');
        play('alarm');
        pushLines([{ kind: 'sys', text: '── 防御破裂 · ' + phase.title + ' ──' }, { kind: 'ok', text: phase.summary }]);
      }

      if (out.status === 'victory') {
        if (out.firstClear) {
          startVictory(out.firstClear);
        } else {
          // 理论不会发生：真实状态校验未通过时明确提示，不发放任何碎片
          addLog('首胜校验未通过：' + (out.reason || '未知原因'), 'fail');
          g.toast('warn', '首胜未写入：' + (out.reason || 'Boss 战斗状态未通过校验'));
        }
      }
    }
  };

  /** 首胜演出顺序：碎片归位 → 记忆重组（第六章）→ 章节结算（展示用，不控制解锁） */
  const startVictory = (out: BossFirstClearPayload) => {
    setPendingClear(out);
    addLog(boss.codename + ' 核心停止运转', 'win');
    play('levelup');
    if (out.fragmentGranted && fragDef) {
      setGain(fragDef);
    } else {
      proceedAfterFragment(out);
    }
  };

  const proceedAfterFragment = (out: BossFirstClearPayload) => {
    if (out.chapterOrder === 6) {
      setFinalMemoryOpen(true);
      return;
    }
    setCleared(out);
    openSettlement(phaseRun?.battleId, { fragmentGranted: out.fragmentGranted });
  };

  const resetCode = () => {
    setCode(phase.initialCode);
    setVerdict(null);
    setErrorLine(null);
    pushLines([{ kind: 'sys', text: '代码已恢复为本阶段的初始故障版本。' }]);
    play('click');
  };

  const onDefend = () => {
    if (!canRespond) return;
    const r = g.defendBossAttack(boss.id);
    setAttackNow(Date.now());
    if (!r.ok) {
      g.toast('warn', (r.reason || '无法防御') + (r.message ? '（' + r.message + '）' : ''));
      play('deny');
      return;
    }
    if (r.message) g.toast('success', r.message);
    play('shield');
  };

  const onDodge = () => {
    if (!canRespond) return;
    const r = g.dodgeBossAttack(boss.id);
    setAttackNow(Date.now());
    if (!r.ok) {
      g.toast('warn', (r.reason || '无法闪避') + (r.message ? '（' + r.message + '）' : ''));
      play('deny');
      return;
    }
    if (r.message) g.toast('success', r.message);
    play('click');
  };

  const hint = phase.hints[Math.min(hintLevel - 1, maxHint - 1)];
  const miraState = normalizeMiraState(player.mira);
  const miraProgress = miraLevelProgress(miraState);
  const miraRisk = miraRiskFor({
    consciousness: player.consciousness,
    consecutiveFails: stored.failures,
    bossPhase: battlePhaseIndex,
    attackWarning: attackInWarning,
    crisis: dynamicBlocking,
  })[0];
  const knowledgeCards = phase.knowledge.map(knowledgeById).filter(Boolean);
  const opp = boss.opponentName || boss.codename;

  if (locked) {
    return (
      <div className="page page-anim boss-page" style={{ padding: '10px 14px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel" style={{ maxWidth: 620, width: '100%' }}>
          <div className="panel-title">进度门禁<span className="panel-tag">{boss.codename}</span></div>
          <div style={{ fontSize: 14, color: '#FFD9A0', lineHeight: 1.9 }}>{gate.reason}</div>
          <div className="dim" style={{ fontSize: 12.5, marginTop: 8 }}>
            章节 Boss 是主线必经内容：只有首次真实击败本章 Boss，才会获得创世主碎片并解锁下一章。
          </div>
          <div className="cp-btns" style={{ marginTop: 14 }}>
            <button className="nxbtn primary" onClick={backToMap}>返回地图</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'page page-anim boss-page boss-battle bg-' + def.bg} style={{ padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <BossBattleVisualLayer visuals={visuals} />
      {/* HUD */}
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" disabled={running || submitting} onClick={backToMap}>
          ◀ 撤退（进度已保存）
        </button>
        <div>
          <div className="hud-title" style={{ color: '#C9A7FF' }}>⚡ {boss.codename} · {boss.title}</div>
          <div className="hud-sub">
            第 {boss.chapter} 章 · 战斗阶段 {battlePhaseIndex + 1} / {battlePhaseTotal}
            {battlePhase ? ' · ' + battlePhase.phaseName : ''} · 阶段 {Math.min(phaseIndex + 1, def.phases.length)} / {def.phases.length} · {phase.title}
            {sim ? ' · 模拟挑战' : ''}
          </div>
        </div>
        <div className="hud-spacer" />
        <span className={'hud-chip boss-status-chip' + (phaseTransitioning ? ' gold' : '')}>{battleStatusLabel}</span>
        {attackPattern && attackActive && <span className="hud-chip attack-chip">⚠ {attackPattern.attackName}</span>}
        {arbiterState && arbiterState.active && (
          <span className="hud-chip arbiter-chip">仲裁 P{arbiterState.active.priority}</span>
        )}
        <span className="hud-chip" style={{ color: diffMeta.color, borderColor: diffMeta.color }}>{diffMeta.label} · {diffMeta.cn}</span>
        {sim && <span className="hud-chip gold">模拟再战 · 不发永久奖励</span>}
        <div className={'py-status ' + pyState.status} title={pyState.phase}>
          <span className="pd" />
          {pyState.status === 'ready' ? 'PY ENGINE READY' : pyState.status === 'loading' ? '引擎加载中…' : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'}
        </div>
        <span className={'hud-chip' + (player.consciousness <= 20 ? ' red warn-flash' : '')}>意识 {player.consciousness}%</span>
        <span className="hud-chip cyan">容错 {Math.max(0, g.tolerance - failures)} / {g.tolerance}</span>
      </div>

      {/* 战斗舞台 */}
      <div className={'boss-arena phase-' + phaseIndex + (eventLocked ? ' locked' : '') + (countered ? ' is-counter' : '') + (phaseTransitioning ? ' phase-transitioning' : '')}>
        <div className="arena-grid">
          <BossAvatar
            phase={phaseIndex}
            hpPct={pct}
            hitKey={hitKey}
            broken={broken}
            defeated={alreadyCleared && !sim && pct <= 0}
            codename={boss.codename}
          />
          <div className="boss-info">
            <div className="boss-name-row">
              <span className="boss-name">{boss.codename}</span>
              <span className="boss-title">{boss.title}</span>
              <span className="boss-chapter">第 {boss.chapter} 章</span>
            </div>
            <div className="boss-hp">
              <div className="hp-track">
                <div className="hp-fill" style={{ width: pct + '%' }} />
                {def.phases.slice(1).map((_, i) => (
                  <span key={i} className="hp-tick" style={{ left: ((i + 1) / def.phases.length * 100) + '%' }} />
                ))}
                {phasePlan && phasePlan.phases.slice(1).map((p, i) => (
                  <span key={'bp' + i} className="hp-tick hp-phase-tick" title={'战斗阶段阈值 ' + p.hpThreshold + '%'} style={{ left: p.hpThreshold + '%' }} />
                ))}
              </div>
              <div className="hp-readout">
                <span className="hp-num">{stored.hp} / {stored.maxHp}</span>
                <span className="hp-pct">{pct}%</span>
              </div>
            </div>
            {phasePlan && battlePhase && (
              <div className={'boss-battle-phase' + (phaseTransitioning ? ' transitioning' : '')}>
                <span className="bbp-index">战斗阶段 {battlePhaseIndex + 1} / {battlePhaseTotal}</span>
                <span className="bbp-name">{battlePhase.phaseName}</span>
                <span className="bbp-desc">{battlePhase.description}</span>
                {localPhaseHp && (
                  <span className="bbp-local-hp">
                    阶段血量 {localPhaseHp.current} / {localPhaseHp.max} · {battlePhaseIndex === 0 ? '初始阶段' : '进入阈值 ≤ ' + battlePhase.hpThreshold + '%'}
                  </span>
                )}
              </div>
            )}
            <div className="phase-pips">
              {def.phases.map((p, i) => (
                <span key={p.id} className={'pip' + (i < stored.phase ? ' done' : i === phaseIndex && !alreadyCleared ? ' cur' : '')}>
                  <b>{i + 1}</b> {p.title}
                </span>
              ))}
            </div>
            <div className="boss-objective">
              <span className="bo-label">当前目标</span>
              <span className="bo-text">{phase.objective}</span>
            </div>
            <div className="boss-metrics">
              <span className="metric">本阶段测试 <b>{passedChecks} / {totalChecks}</b></span>
              <span className="metric">战斗失误 <b>{stored.failures}</b></span>
              <span className="metric">反击伤害 <b>-{def.counterDamage} 意识</b></span>
            </div>
          </div>
        </div>
        <div className="damage-layer">
          {popups.map(p => <span key={p.id} className="dmg-pop">-{p.value}</span>)}
        </div>
        {breakBanner && (
          <div className="break-banner">
            <div className="bb-main">防御破裂</div>
            <div className="bb-sub">阶段 {breakBanner.phase} · {breakBanner.title}</div>
          </div>
        )}
        {phaseTransitioning && transitionTo && (
          <div className="phase-transition-banner" role="status" aria-live="polite">
            <div className="pt-kicker">PHASE TRANSITION</div>
            <div className="pt-name">{transitionTo.phaseName}</div>
            <div className="pt-sub">Boss 进入第 {transitionTo.phaseIndex + 1} 阶段 · 共 {battlePhaseTotal} 阶段</div>
            <div className="pt-desc">
              {transitionFrom ? transitionFrom.phaseOutro + ' ' : ''}{transitionTo.phaseIntro}
            </div>
          </div>
        )}
        {attackPattern && attackInWarning && (
          <div
            className={'attack-warning' + (attack && attack.attackState === 'attacking' ? ' attacking' : '') + (attackPattern.attackType === 'aoe' ? ' aoe' : '')}
            role="alert"
            aria-live="assertive"
          >
            <div className="aw-head">
              <span className="aw-icon">⚠</span>
              <span className="aw-name">{attackPattern.attackName}</span>
              <span className="aw-meta">{ATTACK_TYPE_LABEL[attackPattern.attackType]} · 危险 {DANGER_LABEL[attackPattern.dangerLevel]} · 伤害 {attackPattern.damage} × {attackPattern.hitCount}</span>
            </div>
            <div className="aw-time">{attackRemain == null ? '命中' : (attackRemain / 1000).toFixed(1) + 's'}</div>
            <div className="aw-track"><div style={{ width: (attack && attack.attackState === 'telegraph' ? attackProgress * 100 : attack && attack.hitCount > 0 ? (attack.hitsResolved / attack.hitCount) * 100 : 0) + '%' }} /></div>
            <div className="aw-tip">{attackPattern.defenseRequirement === 'none' ? '无法防御 · 立即闪避' : '建议：防御或闪避'}</div>
            {attackPattern.hitCount > 1 && attack && (
              <div className="aw-hits">
                {Array.from({ length: attack.hitCount }, (_, i) => (
                  <span key={i} className={'aw-hit' + (i < attack.hitsResolved ? ' done' : '')} />
                ))}
              </div>
            )}
          </div>
        )}
        {attackPattern && attackPattern.attackType === 'aoe' && attackInWarning && <div className="attack-aoe-zone" />}
        {weakExposure && weakExposure.active && weakExposure.definition && (
          <div className="weakness-exposure-banner" role="status" aria-live="polite">
            <div className="web-kicker">WEAKNESS EXPOSED</div>
            <div className="web-name">{weakExposure.definition.name}</div>
            <div className="web-effects">
              伤害 ×{weakExposure.damageMultiplier} · 攻击冷却 ×{weakExposure.attackCooldownBonus}
              {weakExposure.disabledPatternIds.length > 0 ? ' · 已禁用 ' + weakExposure.disabledPatternIds.length + ' 种攻击' : ''}
            </div>
            <div className="web-time">{(weakExposure.remainingMs / 1000).toFixed(1)}s</div>
          </div>
        )}
        {eventLocked && <div className="arena-lock">紧急事件进行中——战斗已暂停</div>}
      </div>

      <div className="chlg-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* 左：本阶段任务 */}
        <div className="chlg-left" style={{ overflowY: 'auto' }}>
          {phasePlan && battlePhase && (
            <div className="panel boss-phase-panel">
              <div className="panel-title">多阶段战斗<span className="panel-tag">{battleStatusLabel}</span></div>
              <div className="tb-item">
                <div className="tb-label">当前阶段</div>
                <div className="tb-text">{battlePhaseIndex + 1} / {battlePhaseTotal} · {battlePhase.phaseName}</div>
              </div>
              <div className="tb-item">
                <div className="tb-label">阶段描述</div>
                <div className="tb-text dim" style={{ fontSize: 12.5 }}>{battlePhase.description}</div>
              </div>
              <div className="tb-item">
                <div className="tb-label">阶段血量</div>
                <div className="tb-text">
                  {localPhaseHp ? localPhaseHp.current + ' / ' + localPhaseHp.max : '—'}
                  <span className="dim">（Boss 总血量 {stored.hp} / {stored.maxHp}）</span>
                </div>
              </div>
              <div className="tb-item">
                <div className="tb-label">当前挑战</div>
                <div className="tb-text">{phase.title} <span className="dim">（{phase.id.toUpperCase()}）</span></div>
              </div>
              <div className="tb-item">
                <div className="tb-label">阶段切换</div>
                <div className="tb-text dim" style={{ fontSize: 12.5 }}>
                  {phaseTransitioning
                    ? '演出中：新阶段初始化完成后可继续提交。'
                    : battlePhaseIndex < battlePhaseTotal - 1
                      ? 'Boss 血量降至 ' + (phasePlan.phases[battlePhaseIndex + 1].hpThreshold) + '% 时进入下一阶段。'
                      : '最终阶段：击破所有防御即可结束战斗。'}
                </div>
              </div>
            </div>
          )}
          <div className={'panel boss-attack-panel' + (attackInWarning ? ' danger-' + (attackPattern ? attackPattern.dangerLevel : 1) : '')}>
            <div className="panel-title">Boss 攻击<span className="panel-tag">{attackStatusLabel}</span></div>
            {attackPattern ? (
              <>
                <div className="tb-item">
                  <div className="tb-label">攻击模式</div>
                  <div className="tb-text">
                    <b>{attackPattern.attackName}</b>
                    <span className="chip" style={{ marginLeft: 6 }}>{ATTACK_TYPE_LABEL[attackPattern.attackType]}</span>
                    <span className={'danger-stars d' + attackPattern.dangerLevel}>{'★'.repeat(attackPattern.dangerLevel)}</span>
                  </div>
                </div>
                <div className="tb-item">
                  <div className="tb-label">攻击信息</div>
                  <div className="tb-text dim" style={{ fontSize: 12.5 }}>
                    伤害 {attackPattern.damage} × {attackPattern.hitCount} · 防御减伤 {Math.round(attackPattern.defenseReduction * 100)}% · 危险 {DANGER_LABEL[attackPattern.dangerLevel]}
                  </div>
                </div>
                {attackInWarning && (
                  <div className="attack-countdown">
                    <div className="ac-top">
                      <span>{attack && attack.attackState === 'telegraph' ? '命中倒计时' : '下一段命中'}</span>
                      <b>{attackRemain == null ? '—' : (attackRemain / 1000).toFixed(1) + 's'}</b>
                    </div>
                    <div className="attack-bar">
                      <div style={{ width: (attack && attack.attackState === 'telegraph' ? attackProgress * 100 : attack && attack.hitCount > 0 ? (attack.hitsResolved / attack.hitCount) * 100 : 0) + '%' }} />
                    </div>
                    <div className="ac-tip">{attackPattern.defenseRequirement === 'none' ? '无法防御：立即闪避' : '建议：防御或闪避'}</div>
                  </div>
                )}
                {attack && attack.attackState === 'resolving' && <div className="attack-countdown resolving">攻击结算中 · 战斗即将恢复</div>}
                {attack && attack.attackState === 'cooldown' && <div className="attack-countdown cooling">冷却中 · 约 {((attackRemain || 0) / 1000).toFixed(1)}s</div>}
                {attack && attack.attackState === 'idle' && <div className="dim" style={{ fontSize: 12.5 }}>下一次攻击约 {(nextAttackIn / 1000).toFixed(1)}s 后</div>}
                <div className="attack-response-row">
                  <button className={'nxbtn small ' + (guardActive ? 'primary' : '')} disabled={!canRespond || defenseReady > 0 || attackPattern.defenseRequirement === 'none'} onClick={onDefend}>
                    防御{defenseReady > 0 ? ' · ' + (defenseReady / 1000).toFixed(1) + 's' : ''}
                  </button>
                  <button className={'nxbtn small ' + (dodgeActive ? 'primary' : '')} disabled={!canRespond || dodgeReady > 0} onClick={onDodge}>
                    闪避{dodgeReady > 0 ? ' · ' + (dodgeReady / 1000).toFixed(1) + 's' : ''}
                  </button>
                </div>
                <div className="attack-response-state">
                  {guardActive ? '防御姿态生效中' : dodgeActive ? '闪避窗口生效中'
                    : attack && attack.lastResult === 'blocked' ? '上次：防御成功'
                      : attack && attack.lastResult === 'dodged' ? '上次：闪避成功'
                        : attack && attack.lastResult === 'hit' ? '上次：被命中' : '等待响应'}
                </div>
              </>
            ) : (
              <div className="dim" style={{ fontSize: 12.5 }}>
                Boss 正在重新计算攻击模式。下一次攻击约 {(nextAttackIn / 1000).toFixed(1)}s 后。
              </div>
            )}
          </div>
          <BossWeaknessPanel bossId={boss.id} difficulty={difficulty} now={attackNow} onLog={addLog} />
          <div className="panel task-block boss-block">
            <div className="panel-title">阶段任务<span className="panel-tag">{phase.id.toUpperCase()}</span></div>
            <div className="tb-item">
              <div className="tb-label">要修复的模块</div>
              <div className="tb-text">{phase.title}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">目标</div>
              <div className="tb-text">{phase.objective}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">首胜奖励</div>
              <div className="tb-text">
                创世主碎片 {chapterById('ch' + boss.chapter)?.shardId || ''}《{fragDef ? fragDef.title : '碎片'}》· 章节完成 · 下一章解锁
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">故障日志</div>
            <div style={{ fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#FF9BA2', lineHeight: 1.8, background: 'rgba(255,91,100,0.06)', border: '1px solid rgba(255,91,100,0.2)', borderRadius: 8, padding: '9px 11px', whiteSpace: 'pre-wrap' }}>
              {phase.faultLog}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">本阶段考点</div>
            <div>
              {knowledgeCards.map(k => <span key={k!.id} className="chip cyan know-chip">{k!.title}</span>)}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">MIRA 提示<span className="panel-tag">Lv.{miraProgress.level} · LEVEL {hintLevel} / {maxHint}</span></div>
            <div className="mira-xp-track"><i style={{ width: miraProgress.pct + '%' }} /></div>
            {miraRisk && <div className={'mira-risk risk-' + miraRisk.level} style={{ marginTop: 6 }}>{miraRisk.text}</div>}
            <div style={{ fontSize: 13, color: '#BFD8E8', lineHeight: 1.75 }}>{hint}</div>
            <button className="nxbtn small ghost" style={{ marginTop: 8 }} disabled={hintLevel >= maxHint} onClick={() => { play('click'); setHintLevel(h => Math.min(h + 1, maxHint)); }}>
              下一条提示
            </button>
          </div>
          {devToolsOn() && (
            <>
              <BossPhaseDevPanel initialBossId={boss.id} initialDifficulty={difficulty} />
              <BossAttackDevPanel initialBossId={boss.id} initialDifficulty={difficulty} initialPhaseIndex={battlePhaseIndex} />
              <BossWeaknessDevPanel initialBossId={boss.id} initialDifficulty={difficulty} initialPhaseIndex={battlePhaseIndex} />
              <CombatArbiterDevPanel bossId={boss.id} />
              <BossStatsDevPanel bossId={boss.id} />
              <BossRatingDevPanel bossId={boss.id} />
              <BossRewardDevPanel bossId={boss.id} />
              <BossAchievementDevPanel bossId={boss.id} />
              <BossSettlementDevPanel bossId={boss.id} onPreview={d => { setSettlementPreview(true); setSettlementData(d); }} />
              <BossVisualDevPanel visuals={visuals} />
            </>
          )}
        </div>

        {/* 中：代码 */}
        <div className="chlg-center">
          <div className="toolbar">
            <button className="nxbtn" disabled={running || submitting || eventLocked || battleLocked} onClick={run}>
              {running ? <span className="spinner" /> : '▶'} 运行代码
            </button>
            <button className="nxbtn primary" disabled={running || submitting || eventLocked || battleLocked || !canFight} onClick={submit}>
              {sim ? '提交模拟判题 ⏎' : '提交攻击 ⏎'}
            </button>
            <button className="nxbtn ghost" disabled={running || submitting || eventLocked || battleLocked || sim} onClick={resetCode}>重置代码</button>
            <div className="sp" />
            <span className="chip">{phaseTransitioning ? '阶段切换中：提交已锁定' : sim ? '模拟挑战：不扣血 / 不发奖' : '判题通过才掉血'}</span>
          </div>
          <div className="code-frame" style={{ flex: 1 }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              errorLine={errorLine}
              onRun={run}
              readOnly={running || submitting}
              fontSize={15}
            />
          </div>
          {verdict && (
            <div className={'result-banner ' + (verdict.passed ? 'ok' : 'fail')}>
              {verdict.passed ? '✓ 全部测试通过' : verdict.timedOut ? '✗ 执行超时' : verdict.error ? '✗ 执行出错：' + verdict.error.type : '✗ 测试未全部通过'}
            </div>
          )}
        </div>

        {/* 右：战斗记录 + 状态 */}
        <div className="chlg-right" style={{ overflowY: 'auto' }}>
          <div className="panel">
            <div className="panel-title">战斗记录<span className="panel-tag">{log.length}</span></div>
            {log.length === 0 && <div className="dim" style={{ fontSize: 12.5 }}>还没有交锋记录。提交一次攻击试试。</div>}
            {log.map(l => (
              <div key={l.id} className={'battle-log-line ' + l.kind}>{l.text}</div>
            ))}
          </div>
          <div className="panel">
            <div className="panel-title">生命体征</div>
            <PlayerStatus showTolerance />
          </div>
        </div>
      </div>

      <div className="chlg-bottom">
        <Terminal lines={term} maxHeight={170} title={opp + ' 对抗终端 · ' + boss.codename} />
      </div>

      {/* 战前演出 */}
      {introOpen && scenes.intro && (
        <CinematicStage
          scenes={scenes.intro}
          eventId={'boss-' + boss.id}
          frameTitle={opp + ' · 遭遇'}
          onDone={() => { setIntroOpen(false); g.markStory('bossIntro_' + boss.id); }}
        />
      )}

      {/* 碎片归位（首胜） */}
      {gain && (
        <FragmentGain
          def={gain}
          onDone={() => {
            setGain(null);
            if (pendingClear) proceedAfterFragment(pendingClear);
          }}
        />
      )}

      {/* 六枚齐备：记忆重组 + 恩格尔最终记忆 */}
      {finalMemoryOpen && pendingClear && (
        <CinematicStage
          scenes={CHAPTER6_FINAL_MEMORY_SCENES}
          eventId="chapter-6"
          frameTitle="最终记忆 · 重组"
          onDone={() => {
            setFinalMemoryOpen(false);
            g.markVaultFinalSeen();
            if (pendingClear) {
              setCleared(pendingClear);
              openSettlement(phaseRun?.battleId, { fragmentGranted: pendingClear.fragmentGranted });
            }
          }}
        />
      )}

      {/* 章节结算 */}
      {cleared && (
        <div className="overlay" style={{ background: 'rgba(10,4,20,0.78)', backdropFilter: 'blur(6px)' }}>
          <div className={'complete-panel boss-complete' + (g.player.progress.flags.fxRepair === true ? ' fx-repair' : '')}>
            <div className="cp-ico" style={{ color: '#C9A7FF' }}>⚡</div>
            <div className="cp-title">{opp} 已击破</div>
            <div className="cp-sub">{boss.codename} · {boss.title} · {cleared.shardCode} · {difficultyMeta(cleared.difficulty).label}</div>
            <div className="cp-rewards">
              <div className="cp-reward"><div className="rv">+{cleared.expGained}</div><div className="rl">经验</div></div>
              <div className="cp-reward"><div className="rv">{fragDef ? fragDef.title : cleared.fragmentTitle}</div><div className="rl">创世主碎片</div></div>
              <div className="cp-reward"><div className="rv">Lv.{cleared.newLevel}</div><div className="rl">等级</div></div>
            </div>
            {fragDef && (
              <div className="cp-summary">
                <div className="cs-label">
                  创世主碎片 {cleared.shardCode}《{fragDef.title}》{cleared.fragmentGranted ? ' 已归位' : ' 已在档案馆中'}
                </div>
                {fragDef.content}
              </div>
            )}
            {(() => {
              const ch = chapterById('ch' + boss.chapter);
              const lvls = ch ? levelsOfServer(ch.serverId) : [];
              const stars = lvls.reduce((s, l) => s + (player.progress.stars[l.id] || 0), 0);
              const fails = lvls.reduce((s, l) => s + (player.progress.failedAttempts[l.id] || 0), 0);
              const hints = lvls.reduce((s, l) => s + (player.progress.hintLevels[l.id] || 0), 0);
              const know = [...new Set(lvls.flatMap(l => l.knowledge))];
              const mastered = know.filter(k => player.progress.knowledge.includes(k));
              const sett = buildChapterSettlement({
                chapter: boss.chapter, levels: lvls.length, stars, fails, hints,
                credits: cleared.credits, exp: cleared.expGained, trust: cleared.trust,
                knowledgeIds: know, masteredIds: mastered, unlocks: cleared.unlocks,
              });
              const acc = lvls.length ? Math.round((stars / (lvls.length * 3)) * 100) : 0;
              const unmastered = know.filter(k => !mastered.includes(k));
              const bugs = topBugsForChapter(boss.chapter, player.meta.bugCodex, 3);
              const phases = player.progress.battles?.[boss.id]?.phaseMask || [];
              return (
                <div className="chapter-settle">
                  <div className="cs-grid">
                    <div className="cs-cell"><div className="k">章节评价</div><div className="v gold">{sett.grade}</div></div>
                    <div className="cs-cell"><div className="k">经验</div><div className="v">+{sett.exp}</div></div>
                    <div className="cs-cell"><div className="k">贡献点</div><div className="v gold">+{sett.credits}</div></div>
                    <div className="cs-cell"><div className="k">碎片</div><div className="v cyan">{cleared.shardCode}</div></div>
                    <div className="cs-cell"><div className="k">正确率</div><div className="v">{acc}%</div></div>
                  </div>
                  <div className="cs-know">
                    <span className="dim" style={{ fontSize: 11.5 }}>知识点表现：</span>
                    {sett.knowledge.map(k => <span key={k.id} className={'chip ' + (k.ok ? 'green' : 'dim')}>{k.id}{k.ok ? ' ✓' : ''}</span>)}
                  </div>
                  {phases.length > 0 && (
                    <div className="cs-know">
                      <span className="dim" style={{ fontSize: 11.5 }}>Boss 各阶段：</span>
                      {phases.map((m, i) => (
                        <span key={i} className={'chip ' + (m > 0 ? 'green' : 'dim')}>第{i + 1}阶段{m > 0 ? ' ✓' : ' 未突破'}</span>
                      ))}
                    </div>
                  )}
                  {bugs.length > 0 && (
                    <div className="cs-know">
                      <span className="dim" style={{ fontSize: 11.5 }}>本章常见错误：</span>
                      {bugs.map(b => <span key={b.id} className="chip red">{b.error} · {b.title}</span>)}
                    </div>
                  )}
                  {unmastered.length > 0 ? (
                    <div className="cs-know">
                      <span className="dim" style={{ fontSize: 11.5 }}>尚未掌握：</span>
                      {unmastered.map(k => <span key={k} className="chip orange">{k}</span>)}
                    </div>
                  ) : (
                    <div className="cs-unlocks">本章知识点已全部掌握。</div>
                  )}
                  {cleared.difficultyExp > 0 && (
                    <div className="cs-know">
                      <span className="dim" style={{ fontSize: 11.5 }}>难度加成：</span>
                      <span className="chip gold">{difficultyMeta(cleared.difficulty).label} · +{cleared.difficultyExp} 经验 / +{cleared.difficultyCredits} 贡献点</span>
                      {cleared.badgeId && <span className="chip cyan">难度徽章</span>}
                      {cleared.titleUnlocked && <span className="chip echo">称号 · 专家裁决者</span>}
                    </div>
                  )}
                  {cleared.nextChapterUnlocked && cleared.nextChapterId && (
                    <div className="cs-unlocks">
                      下一章已解锁：第 {cleared.chapterOrder + 1} 章《{cleared.nextChapterTitle}》——播放完本章结尾后可手动进入。
                    </div>
                  )}
                  {cleared.chapterOrder === 6 && (
                    <div className="cs-unlocks">六枚创世主碎片全部集齐：恩格尔的最终记忆已重组，最终命运选择已开放。</div>
                  )}
                  {cleared.bossClearSource === 'legacy-inherit' && (
                    <div className="cs-know"><span className="chip orange">历史进度继承（非本次战斗胜利）</span></div>
                  )}
                </div>
              );
            })()}
            <div className="cp-btns">
              {scenes.outro && (
                <button className="nxbtn ghost" onClick={() => { play('click'); setCleared(null); setOutroOpen(true); }}>
                  播放本章结尾 ▸
                </button>
              )}
              <button className="nxbtn primary" onClick={backToMap}>返回地图</button>
            </div>
          </div>
        </div>
      )}

      {/* 战后演出：播完才回到地图（下一章入口由玩家手动进入） */}
      {outroOpen && scenes.outro && (
        <CinematicStage
          scenes={scenes.outro}
          eventId={'boss-' + boss.id}
          frameTitle={opp + ' · 击破之后'}
          onDone={() => {
            setOutroOpen(false);
            const out = pendingClear;
            setPendingClear(null);
            g.toast('success', out && out.nextChapterId
              ? '下一章已解锁：第 ' + (out.chapterOrder + 1) + ' 章《' + out.nextChapterTitle + '》'
              : '主线进度已更新');
            backToMap();
          }}
        />
      )}
      {settlementData && (
        <BossBattleSettlement data={settlementData} onClose={closeSettlement} preview={settlementPreview} />
      )}

      {/* 模拟再战完成 */}
      {simResult && (
        <div className="overlay" style={{ background: 'rgba(10,4,20,0.78)' }}>
          <div className="complete-panel boss-complete">
            <div className="cp-ico" style={{ color: '#C9A7FF' }}>◇</div>
            <div className="cp-title">模拟再战完成</div>
            <div className="cp-sub">{boss.codename} · {difficultyMeta(simResult.difficulty).label} · 不发放创世主碎片</div>
            <div className="cp-rewards">
              <div className="cp-reward"><div className="rv">+{simResult.exp}</div><div className="rl">经验</div></div>
              <div className="cp-reward"><div className="rv">+{simResult.credits}</div><div className="rl">贡献点</div></div>
              <div className="cp-reward"><div className="rv">{simResult.badgeId ? '徽章' : '—'}</div><div className="rl">难度成就</div></div>
            </div>
            <div className="cp-summary">
              {simResult.firstTime
                ? '首次通过 ' + difficultyMeta(simResult.difficulty).label + ' 难度：已记录挑战成绩与难度奖励。'
                : '本难度此前已通关：本次仅刷新最近通关记录，不重复发放永久奖励。'}
              {simResult.titleUnlocked ? ' 解锁称号：专家裁决者。' : ''}
            </div>
            <div className="cp-btns">
              <button className="nxbtn primary" onClick={() => { setSimResult(null); backToMap(); }}>返回地图</button>
            </div>
          </div>
        </div>
      )}

      {/* 独立难度选择界面（进入 Boss 战之前 / 模拟再战之前） */}
      {selectionOpen && !locked && (
        <div className="diff-gate" role="dialog" aria-label="选择 Boss 挑战难度">
          <div className="diff-panel">
            <div className="diff-head">
              <div className="diff-portrait">
                <BossAvatar phase={0} hpPct={100} hitKey={0} broken={false} defeated={false} codename={boss.codename} />
              </div>
              <div className="diff-head-main">
                <div className="dh-kicker">第 {boss.chapter} 章 · {chapterById('ch' + boss.chapter)?.title || boss.title} · 主线必经 Boss</div>
                <div className="dh-name">{boss.codename} · {boss.title}</div>
                <div className="dh-sub">
                  {sim ? '已首胜 · 可进行模拟再战' : battleInProgress ? '战斗进行中 · 本次难度已锁定' : '选择本次挑战难度'}
                </div>
                <div className="dh-desc">
                  {chapterById('ch' + boss.chapter)?.coreEvent || ''}
                  {chapterById('ch' + boss.chapter)?.coreEvent ? '　' : ''}
                  {boss.fault}
                </div>
              </div>
              <button className="diff-close" onClick={backToMap}>← 返回章节</button>
            </div>

            {battleInProgress && (
              <div className="diff-locked">
                本次挑战已锁定为 {difficultyMeta(difficulty).label}。战斗失败（意识崩解）或点击「放弃本场」后才能重新选择难度。
              </div>
            )}

            <div className="diff-cards">
              {BOSS_DIFFICULTIES.map(d => {
                const dDef = bossBattleDef(boss.id, d.id);
                const available = !!dDef && bossDifficulties(boss.id).includes(d.id);
                const cardLocked = battleInProgress && d.id !== difficulty;
                const active = picked === d.id;
                const knowIds = dDef ? [...new Set(dDef.phases.flatMap(p => p.knowledge))] : [];
                return (
                  <button
                    key={d.id}
                    className={'diff-card diff-' + d.id + (active ? ' active' : '') + (cardLocked ? ' disabled' : '')}
                    disabled={!available || cardLocked}
                    onClick={() => { play('click'); setPicked(d.id); }}
                    style={{ ['--dc' as string]: d.color, ['--dc-bg' as string]: d.accent }}
                  >
                    <span className="dc-top">
                      <span className="dc-label">{d.label}</span>
                      <span className="dc-cn">{d.cn}</span>
                      {d.recommended && <span className="dc-rec">推荐</span>}
                    </span>
                    <span className="dc-tag">{d.tagline}</span>
                    <span className="dc-desc">{d.description}</span>
                    <span className="dc-meta">
                      <span>阶段 {dDef ? dDef.phases.length : 0}</span>
                      <span>测试 {dDef ? difficultyCheckCount(dDef) : 0}</span>
                    </span>
                    <span className="dc-know">考点：{knowIds.length > 0 ? knowIds.map(k => knowledgeById(k)?.title || k).join(' / ') : d.knowledgeScope}</span>
                    <span className="dc-hint">提示：{d.hintRule}</span>
                    <span className="dc-reward">{available ? d.rewardNote : '该难度题目制作中'}</span>
                  </button>
                );
              })}
            </div>

            <div className="diff-actions">
              <button className="nxbtn ghost" onClick={backToMap}>返回章节</button>
              {battleInProgress && (
                <button className="nxbtn ghost" onClick={abandonWithSettlement}>
                  放弃本场 · 重新选择
                </button>
              )}
              <button
                className="nxbtn primary"
                disabled={!bossDifficulties(boss.id).includes(picked)}
                onClick={() => {
                  if (battleInProgress) { setSelectionOpen(false); return; }
                  startChallenge(picked);
                }}
              >
                {battleInProgress
                  ? '继续挑战 ' + difficultyMeta(difficulty).label
                  : (sim ? '开始模拟再战 ' : '开始挑战 ') + difficultyMeta(picked).label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
