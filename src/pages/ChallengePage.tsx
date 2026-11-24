import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import Terminal, { type TermLine } from '../components/Terminal';
import MiraPanel from '../components/MiraPanel';
import DiagnosisPanel from '../components/DiagnosisPanel';
import PlayerStatus from '../components/PlayerStatus';
import DialogSystem from '../components/DialogSystem';
import { useGame, type CompletePayload } from '../store/gameStore';
import type { RunOutcomeShape } from '../game/types';
import { levelById, levelsOfServer, serverById, type LevelDef } from '../game/levels';
import { canEnterServer } from '../game/chapterFlow';
import { milestone } from '../game/progression';
import { riskStatusFor } from '../game/playerGrowthCore';
import { formatDuration } from '../game/challengeSession';
import { normalizeRewards } from '../game/rewards';
import { buildHarness, checkUserCode, combineWithHarness, filterMarkerLines, judgeRun, parseMarker, type JudgeCheck, type JudgeVerdict, type ParsedError } from '../services/judge';
import { miraLevelHint, miraOnError, miraOnFail, miraOnRespawn } from '../services/ai';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { diagnoseRun, type Diagnosis } from '../services/diagnose';
import { knowledgeById } from '../game/knowledge';
import { achievementById } from '../game/achievements';
import { play, isMusicOn } from '../services/sound';
import { GRADE_META } from '../game/rewards';
import { codexForError } from '../game/codex';
import {
  DRAFT_DEBOUNCE_MS, draftNamespace, readDraft, writeDraft, clearDraft, formatDraftClock,
  createDebouncedFlush, shouldAutosaveDraft, type DraftEntry, type DebouncedFlush,
} from '../services/drafts';

/** 与 global.css 保持一致：手机竖屏或横屏手机都用单栏标签布局 */
const MOBILE_MQ = '(max-width: 767px), (max-width: 1100px) and (max-height: 520px)';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    try { return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches; } catch { return false; }
  });
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try { mq = window.matchMedia(query); } catch { return; }
    const onChange = () => setMatches(mq!.matches);
    onChange();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq!.removeEventListener('change', onChange);
    }
    // 旧 Safari
    mq.addListener(onChange);
    return () => mq!.removeListener(onChange);
  }, [query]);
  return matches;
}

const EDITOR_WRAP_KEY = 'nexus_editor_wrap';

export default function ChallengePage() {
  const g = useGame();
  const levelId = g.player.progress.currentLevelId;
  const level = levelId ? levelById(levelId) : undefined;
  const player = g.player;
  const respawnTick = g.respawnTick;
  // 手机 / 横屏手机使用单栏 + 标签；平板（768–1099）使用双栏 + 可折叠侧栏
  const isMobile = useMediaQuery(MOBILE_MQ);

  const [code, setCode] = useState(level?.initialCode ?? '');
  const [term, setTerm] = useState<TermLine[]>([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [miraMsg, setMiraMsg] = useState<string>('任务简报已同步。仔细阅读左侧的故障现象，然后开始修复。');
  const [miraTag, setMiraTag] = useState('MIRA');
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [done, setDone] = useState<{ payload: CompletePayload; summary: string; nextId: string | null; nextLabel: string } | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [pyState, setPyState] = useState<PyState>({ status: 'idle', phase: '' });
  const [musicOn, setMusicOn] = useState(isMusicOn());
  const [dbg, setDbg] = useState<{ steps: { line: number; vars: Record<string, string>; out?: string }[]; idx: number; done: boolean; failed?: boolean } | null>(null);
  const [debugLine, setDebugLine] = useState<number | null>(null);
  const [loadElapsed, setLoadElapsed] = useState(0);
  const [scanLines, setScanLines] = useState<number[]>([]);
  const historyRef = useRef<string[]>([]);

  // ---------- 代码草稿（A1：挑战页自动保存 / 恢复） ----------
  /** 草稿按「玩家存档 + 关卡」隔离：同一份存档的不同关卡互不覆盖 */
  const draftNs = draftNamespace(player);
  const nsRef = useRef(draftNs);
  nsRef.current = draftNs;
  const levelRef = useRef<string | null>(null);
  /** 本次进入后玩家是否真的改过代码（避免把未修改的初始故障版写成草稿） */
  const touchedRef = useRef(false);
  const draftRef = useRef<DraftEntry | null>(null);
  const pendingRef = useRef('');
  const lastSavedRef = useRef('');
  const passedNextRef = useRef(false);
  const saverRef = useRef<DebouncedFlush<string> | null>(null);
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'cleared'>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [draftError, setDraftError] = useState('');
  const [draftNotice, setDraftNotice] = useState('');
  const [draftArmed, setDraftArmed] = useState(false);

  // ---------- 智能诊断（A3） ----------
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [diagStatus, setDiagStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [diagHistory, setDiagHistory] = useState<Diagnosis[]>([]);
  /** 同一错误连续触发次数：决定面板默认展开到第几层 */
  const [diagStreak, setDiagStreak] = useState(0);
  const diagSigRef = useRef('');
  const diagStreakRef = useRef(0);
  /** 提交/运行防连点：状态更新是异步的，用同步锁挡住同一帧内的重复点击 */
  const submitLockRef = useRef(false);
  const runLockRef = useRef(false);

  // ---------- 响应式布局状态（A2） ----------
  /** 手机端标签：任务 / 代码 / 输出 / 诊断 / MIRA */
  const [view, setView] = useState<'task' | 'code' | 'out' | 'diag' | 'mira'>('code');
  /** 平板侧栏显示哪一块（任务 / 诊断 / MIRA） */
  const [sideTab, setSideTab] = useState<'task' | 'diag' | 'mira'>('task');
  const [sideCollapsed, setSideCollapsed] = useState(false);
  /** 窄屏编辑器自动换行开关（关闭时编辑器独立横向滚动） */
  const [wrapMode, setWrapMode] = useState<boolean>(() => {
    try { return localStorage.getItem(EDITOR_WRAP_KEY) === '1'; } catch { return false; }
  });
  const toggleWrap = () => {
    setWrapMode(v => {
      const next = !v;
      try { localStorage.setItem(EDITOR_WRAP_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
    play('click');
  };

  const locked = g.event.kind !== 'none';

  /** 落盘一次草稿（不经过防抖）；失败时保留错误状态，绝不静默丢弃 */
  const commitDraft = useCallback((next: string, passed = false, force = false): boolean => {
    const lid = levelRef.current;
    if (!lid) return false;
    const r = writeDraft(nsRef.current, lid, next, { passed, force });
    if (r.entry) {
      draftRef.current = r.entry;
      setDraft(r.entry);
    }
    if (r.ok) {
      lastSavedRef.current = next;
      setSavedAt(r.entry?.updatedAt ?? Date.now());
      setDraftStatus('saved');
      setDraftError('');
      return true;
    }
    setDraftStatus('error');
    setDraftError(r.reason || '保存失败');
    return false;
  }, []);

  /** 立即写入（手动保存 / 切关 / 离开页面），并取消待执行的防抖写入 */
  const writeNow = useCallback((next: string, passed = false, force = false): boolean => {
    saverRef.current?.cancel();
    pendingRef.current = next;
    return commitDraft(next, passed, force);
  }, [commitDraft]);

  /** 把防抖队列里尚未落盘的内容立即写入 */
  const flushDraft = useCallback(() => {
    const s = saverRef.current;
    if (s && s.pending()) s.flush();
  }, []);

  /** 切换编辑器内容（显式操作可要求立即存档，避免「选了初始代码、刷新又回到草稿」） */
  const applyCode = useCallback((next: string, opts?: { touch?: boolean; save?: boolean; passed?: boolean; notice?: string }) => {
    setCode(next);
    pendingRef.current = next;
    if (opts?.touch) touchedRef.current = true;
    if (opts?.save) writeNow(next, opts?.passed);
    if (opts?.notice !== undefined) setDraftNotice(opts.notice);
  }, [writeNow]);

  useEffect(() => {
    if (!level) { g.nav('map'); return; }
    // 统一章节门禁：未开放章节的关卡不允许通过任何入口直接进入
    const access = canEnterServer(player, level.serverId);
    if (!access.ok) {
      g.toast('warn', access.reason || '该区域尚未解锁。');
      g.setCurrentLevel(null);
      g.nav('map');
      return;
    }

    const sameLevel = levelRef.current === level.id;
    // 切关前把上一关尚未落盘的输入立即保存，避免切换丢代码
    if (!sameLevel) flushDraft();

    const saved = readDraft(draftNs, level.id);
    draftRef.current = saved;
    setDraft(saved);
    setSavedAt(saved?.updatedAt ?? null);
    setDraftError('');
    setDraftArmed(false);
    touchedRef.current = false;

    if (sameLevel) {
      // 重生 / 同关重新进入：编辑器回到初始故障版，但草稿保留，可一键恢复
      setCode(level.initialCode);
      pendingRef.current = level.initialCode;
      lastSavedRef.current = level.initialCode;
      setDraftStatus(saved ? 'saved' : 'idle');
      setDraftNotice(saved ? '意识重组后代码已重置，本地仍保留你的草稿' : '');
    } else {
      // 首次进入 / 切换关卡：有草稿就恢复草稿，没有则用初始故障版
      const start = saved?.code ?? level.initialCode;
      setCode(start);
      pendingRef.current = start;
      lastSavedRef.current = saved?.code ?? level.initialCode;
      setDraftStatus(saved ? 'saved' : 'idle');
      setDraftNotice(saved ? '已恢复上次保存的草稿' : '');
    }
    levelRef.current = level.id;
    setView('code');
    // 开启/恢复本次挑战会话（刷新保留统计；已结算则新开，避免上一关数据串场）
    g.beginChallenge(level.id);
    // 新关卡重置诊断（历史只保留本次挑战内）
    setDiag(null);
    setDiagStatus('idle');
    setDiagHistory([]);
    setDiagStreak(0);
    diagSigRef.current = '';
    diagStreakRef.current = 0;

    setTerm([]);
    setErrorLine(null);
    setVerdict(null);
    setDone(null);
    setResetArmed(false);
    setBriefOpen(!player.progress.storySeen[level.id]);
    setMiraMsg('任务简报已同步。仔细阅读左侧的故障现象，然后开始修复。');
    setMiraTag('MIRA');
    setDbg(null);
    setDebugLine(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, respawnTick, level?.id]);

  // 草稿防抖写入器：关掉页面 / 切关时由 cleanup 立即补写
  useEffect(() => {
    if (!level?.id) return;
    const saver = createDebouncedFlush<string>((next) => {
      const passed = passedNextRef.current;
      passedNextRef.current = false;
      commitDraft(next, passed);
    }, DRAFT_DEBOUNCE_MS);
    saverRef.current = saver;
    return () => {
      saver.flush();
      if (saverRef.current === saver) saverRef.current = null;
    };
  }, [draftNs, level?.id, commitDraft]);

  // 输入防抖自动保存：只在真正改过代码（或已有草稿）时写入
  useEffect(() => {
    if (!shouldAutosaveDraft({
      code,
      pending: pendingRef.current,
      touched: touchedRef.current,
      hasDraft: !!draftRef.current,
      lastSaved: lastSavedRef.current,
    })) return;
    setDraftStatus(s => (s === 'error' ? s : 'saving'));
    saverRef.current?.schedule(code);
  }, [code, level?.id, draftNs]);

  // 失焦 / 切后台 / 关闭页面：补充保存（localStorage 同步写入，关页也来得及）
  useEffect(() => {
    const onLeave = () => {
      if (!levelRef.current) return;
      if (!touchedRef.current && !draftRef.current) return;
      if (pendingRef.current === lastSavedRef.current) return;
      writeNow(pendingRef.current);
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') onLeave(); };
    window.addEventListener('beforeunload', onLeave);
    window.addEventListener('blur', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      onLeave();
    };
  }, [writeNow]);

  useEffect(() => {
    if (levelId && !level) g.nav('map');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, level]);

  useEffect(() => {
    const un = onPyStatus(s => setPyState(s));
    return un;
  }, []);

  // 进入关卡即开始加载 Python 引擎（利用读题时间）
  useEffect(() => {
    warmUp();
  }, []);

  // 引擎加载计时（让等待变成可见的进度，而不是"卡住"）
  useEffect(() => {
    if (pyState.status !== 'loading') { setLoadElapsed(0); return; }
    const t0 = Date.now();
    const id = window.setInterval(() => setLoadElapsed(Math.round((Date.now() - t0) / 1000)), 400);
    return () => window.clearInterval(id);
  }, [pyState.status]);

  // 移动端视口 / 虚拟键盘补偿：底部操作栏贴住可视区域，键盘弹出时不遮挡
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const vv = window.visualViewport;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      root.style.setProperty('--app-vh', Math.round(h) + 'px');
      const offset = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      root.style.setProperty('--kb-offset', offset + 'px');
    };
    apply();
    window.addEventListener('resize', apply);
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    return () => {
      root.style.removeProperty('--app-vh');
      root.style.removeProperty('--kb-offset');
      window.removeEventListener('resize', apply);
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
    };
  }, []);

  useEffect(() => {
    // 重生后 MIRA 提示
    if (respawnTick > 0 && level) {
      setMiraMsg(miraOnRespawn());
      setMiraTag('MIRA');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respawnTick]);

  const pushLines = useCallback((lines: TermLine[]) => {
    setTerm(t => [...t.slice(-260), ...lines]);
  }, []);

  const outputLines = useCallback((r: { stdout: string; stderr?: string; error?: ParsedError; timedOut?: boolean }) => {
    const ls: TermLine[] = [];
    const stdout = filterMarkerLines(r.stdout ?? '');
    if (stdout.trim() !== '') {
      ls.push({ kind: 'out', text: stdout.replace(/\n$/, '') });
    }
    if (r.stderr && r.stderr.trim() !== '') ls.push({ kind: 'warn', text: r.stderr.replace(/\n$/, '') });
    if (r.timedOut) ls.push({ kind: 'err', text: '执行超时：程序运行超过安全时限，已被强制终止（请检查死循环）。' });
    if (r.error) ls.push({ kind: 'err', text: r.error.type + ': ' + r.error.message });
    return ls;
  }, []);

  if (!level) return null;

  // ---------- 草稿操作 ----------
  /** 编辑器内容变化：标记为「玩家真的改过」，交给防抖保存 */
  const handleCodeChange = (v: string) => {
    touchedRef.current = true;
    pendingRef.current = v;
    setCode(v);
  };

  const saveDraftNow = () => {
    if (!level) return;
    const ok = writeNow(code, false, true);
    if (ok) {
      g.toast('success', '草稿已保存到本机');
      setDraftNotice('已手动保存');
    } else {
      g.toast('warn', draftError || '草稿保存失败，请先复制代码');
    }
    play('click');
  };

  const clearDraftNow = () => {
    if (!level) return;
    if (!draftArmed) {
      setDraftArmed(true);
      window.setTimeout(() => setDraftArmed(false), 3000);
      return;
    }
    saverRef.current?.cancel();
    clearDraft(draftNs, level.id);
    draftRef.current = null;
    setDraft(null);
    setDraftArmed(false);
    setDraftStatus('cleared');
    setDraftError('');
    setSavedAt(null);
    touchedRef.current = false;
    setCode(level.initialCode);
    pendingRef.current = level.initialCode;
    lastSavedRef.current = level.initialCode;
    setDraftNotice('草稿已清除，编辑器已回到初始故障版本');
    g.toast('info', '本关草稿已清除');
    play('click');
  };

  /** 显式「改用初始代码」：覆盖草稿但把旧内容压入历史，仍可恢复 */
  const useInitialCode = () => {
    if (!level) return;
    applyCode(level.initialCode, { touch: true, save: true, notice: '已改用初始故障版本（旧内容已存入历史）' });
    play('click');
  };

  /** 恢复本地草稿 */
  const restoreDraft = () => {
    const d = draftRef.current;
    if (!d) return;
    applyCode(d.code, { touch: true, notice: '已恢复本地草稿' });
    lastSavedRef.current = d.code;
    setDraftStatus('saved');
    play('click');
  };

  /** 恢复上一版（历史上一次不同的内容） */
  const restoreHistory = () => {
    const h = draftRef.current?.history || [];
    const last = h[h.length - 1];
    if (!last) return;
    applyCode(last.code, { touch: true, save: true, notice: '已恢复到上一个版本（刚改的内容已存入历史）' });
    play('click');
  };

  /** 查看真实判题通过时的代码（只预览，不覆盖当前草稿） */
  const previewPassed = () => {
    const d = draftRef.current;
    if (!d?.passedCode) {
      g.toast('info', '本关还没有记录到通关代码（只记录真实判题通过的那一版）。');
      return;
    }
    setCode(d.passedCode);
    pendingRef.current = d.passedCode;
    lastSavedRef.current = d.passedCode;
    setDraftNotice('已载入通关代码（仅查看，不会覆盖当前草稿）');
    play('click');
  };

  /** 保存失败时的兜底：把代码复制到剪贴板，避免玩家丢失 */
  const copyCode = () => {
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) g.toast('success', '代码已复制到剪贴板');
        else g.toast('warn', '复制失败，请手动选中代码');
      } catch {
        g.toast('warn', '复制失败，请手动选中代码');
      }
    };
    try {
      const nav = navigator as Navigator & { clipboard?: { writeText?: (t: string) => Promise<void> } };
      if (nav.clipboard?.writeText) {
        nav.clipboard.writeText(code).then(() => g.toast('success', '代码已复制到剪贴板')).catch(fallback);
      } else {
        fallback();
      }
    } catch {
      fallback();
    }
  };

  /** 记录一次代码快照（回滚道具用） */
  const snapshot = useCallback((current: string) => {
    historyRef.current.push(current);
    if (historyRef.current.length > 12) historyRef.current.shift();
  }, []);

  /** 代码扫描器：标出与初始版本不同的行（只定位，不给答案） */
  const useScan = () => {
    if (!level) return;
    if (!g.consumeItem('scan')) {
      g.toast('warn', '扫描器库存不足——可在兑换中心补充。');
      play('deny');
      return;
    }
    const base = level.initialCode.split('\n');
    const cur = code.split('\n');
    const changed: number[] = [];
    cur.forEach((l, i) => { if ((base[i] ?? '') !== l && l.trim()) changed.push(i + 1); });
    const fallback = cur.map((l, i) => (l.trim() && !l.trim().startsWith('#') ? i + 1 : 0)).filter(Boolean);
    const picked = (changed.length ? changed : fallback).slice(0, 3);
    setScanLines(picked);
    setMiraTag('扫描器');
    setMiraMsg(picked.length
      ? '扫描完成：已高亮第 ' + picked.join('、') + ' 行。这些是你改动过 / 最需要复核的区域——结论要你自己判断。'
      : '扫描完成：没有发现可定位的行。先写几行代码再试试。');
    play('unlock');
  };

  /** 数据回滚模块：恢复到上一个代码快照 */
  const useRollback = () => {
    if (!g.consumeItem('rollback')) {
      g.toast('warn', '回滚模块库存不足——可在兑换中心补充。');
      play('deny');
      return;
    }
    const prev = historyRef.current.pop();
    if (prev === undefined) {
      g.toast('warn', '没有可回滚的快照。');
      play('deny');
      return;
    }
    setCode(prev);
    pendingRef.current = prev;
    touchedRef.current = true;
    writeNow(prev);
    setScanLines([]);
    setVerdict(null);
    setErrorLine(null);
    pushLines([{ kind: 'sys', text: '数据回滚：已恢复到上一次代码快照。' }]);
    play('click');
  };

  /**
   * 生成并展示诊断。
   * 只读取真实执行结果与判题结果，绝不参与判定；同一错误连续出现时自动加深提示层级。
   */
  const diagnoseAndShow = (run: RunOutcomeShape, verdict: JudgeVerdict | null, codeUsed: string): Diagnosis | null => {
    if (!level) return null;
    const prevSig = diagSigRef.current;
    const guess = prevSig ? diagStreakRef.current + 1 : 1;
    let d = diagnoseRun({ level, code: codeUsed, run, verdict, streak: guess });
    if (d.signature !== prevSig) {
      diagStreakRef.current = 1;
      d = diagnoseRun({ level, code: codeUsed, run, verdict, streak: 1 });
    } else {
      diagStreakRef.current = guess;
    }
    diagSigRef.current = d.signature;
    setDiagStreak(diagStreakRef.current);
    setDiag(d);
    setDiagStatus('done');
    if (d.kind !== 'ok') {
      setDiagHistory((h) => [d, ...h.filter((x) => x.signature !== d.signature)].slice(0, 6));
    }
    if (d.mira && (d.kind !== 'ok' || verdict?.passed)) {
      setMiraTag(d.kind === 'ok' ? 'MIRA' : d.kind === 'syntax' || d.kind === 'runtime' ? '排错助手' : '诊断');
      setMiraMsg(d.mira);
    }
    return d;
  };

  const run = async () => {
    if (!level || running || submitting || locked) return;
    if (runLockRef.current) return;
    runLockRef.current = true;
    try {
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([
        { kind: 'cmd', text: 'python task.py' },
        { kind: 'err', text: '安全策略阻止：' + ck.reason },
      ]);
      setMiraTag('安全警告');
      setMiraMsg('这条代码被维修终端的安全策略拦下了。' + ck.reason);
      play('deny');
      return;
    }
    snapshot(code);
    setRunning(true);
    setDiagStatus('running');
    setVerdict(null);
    g.recordRun(level.id);
    setErrorLine(null);
    setScanLines([]);
    pushLines([{ kind: 'cmd', text: 'python task.py' }]);
    if (pyState.status !== 'ready') {
      pushLines([{ kind: 'sys', text: 'Python 引擎初始化中（本地加载，通常 2~5 秒）——代码已排队，就绪后自动执行。' }]);
    }
    pushLines([{ kind: 'sys', text: '正在运行……' }]);
    play('run');
    const r = await runPython(code, { timeoutMs: 5000 });
    setRunning(false);
    pushLines([{ kind: 'sys', text: r.ok ? '进程正常退出（exit 0）' : '进程异常结束' }]);
    if (!r.ok) {
      pushLines(outputLines(r));
      if (r.error) {
        setErrorLine(r.error.line && r.error.line <= code.split('\n').length ? r.error.line : null);
      }
    } else {
      pushLines(outputLines(r));
    }
    // 无论成功失败都给出诊断：成功时显示「运行成功（未判题）」，失败时定位错误
    diagnoseAndShow(r, null, code);
    } finally {
      runLockRef.current = false;
    }
  };

  const submit = async () => {
    if (!level || running || submitting || locked) return;
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([
        { kind: 'cmd', text: 'python task.py --submit' },
        { kind: 'err', text: '安全策略阻止：' + ck.reason },
      ]);
      setMiraTag('安全警告');
      setMiraMsg('提交被拦截。' + ck.reason);
      play('deny');
      return;
    }
    snapshot(code);
    setSubmitting(true);
    setDiagStatus('running');
    setVerdict(null);
    g.recordSubmit(level.id);
    setErrorLine(null);
    setScanLines([]);
    play('run');
    const codeLines = code.split('\n').length;
    const combined = level.judge.judgeKind === 'python'
      ? combineWithHarness(code, buildHarness(level.judge.pythonChecks || []))
      : code;
    pushLines([{ kind: 'cmd', text: 'python task.py --submit （正式判题）' }]);
    const r = await runPython(combined, { timeoutMs: 5000 });
    setSubmitting(false);

    if (r.timedOut) {
      pushLines(outputLines(r));
      setVerdict({ passed: false, checks: [], timedOut: true });
      const d = diagnoseAndShow(r, { passed: false, checks: [], timedOut: true }, code);
      setMiraTag('系统警告');
      setMiraMsg((d?.mira || '判题超时。') + ' 本次提交已计为一次失败——先处理循环的结束条件。');
      g.recordFail(level.id);
      play('error');
      return;
    }
    if (!r.ok) {
      pushLines(outputLines(r));
      const errLine = r.error && r.error.line && r.error.line <= codeLines ? r.error.line : null;
      setErrorLine(errLine);
      setVerdict({ passed: false, checks: [], error: r.error });
      const d = diagnoseAndShow(r, { passed: false, checks: [], error: r.error }, code);
      // 执行错误同样计入失败提交
      const fp = g.recordFail(level.id);
      if (!fp.triggered) {
        const m = miraOnFail(fp.n, fp.tolerance);
        if (m.tone === 'danger') {
          setMiraTag('系统警告');
          setMiraMsg(String(m.text));
          play('warning');
        } else if (d) {
          setMiraMsg(d.mira + ' ' + String(m.text));
        }
      }
      play('error');
      return;
    }
    const v = judgeRun(level.judge, r);
    const stdout = filterMarkerLines(r.stdout);
    if (v.passed) {
      pushLines([
        { kind: 'out', text: stdout.replace(/\n$/, '') || '(无输出)' },
        { kind: 'sys', text: '── 自动判题结果 ──' },
        ...(v.checks.map(c => ({ kind: 'ok' as const, text: '✓ ' + c.name }))),
        { kind: 'ok', text: '★★★★ 全部测试通过，修复完成！' },
      ]);
      const payload = g.completeLevel(level.id);
      setVerdict({ passed: true, checks: v.checks });
      diagnoseAndShow(r, v, code);
      // 真实判题通过：把这版代码记为「通关代码」。只写草稿层，不改动关卡完成记录。
      writeNow(code, true);
      setDraftNotice('通关代码已存档（可随时回看）');
      if (payload) {
        // 「下一个修复端」：同服务器下一关 → 否则下一个已开放服务器的首个未通关关卡
        const progress = g.player.progress;
        const doneSet = new Set<string>([...progress.completedLevels, level.id]);
        const siblings = levelsOfServer(level.serverId);
        const idx = siblings.findIndex(s => s.id === level.id);
        let target: { id: string; label: string } | null = null;
        if (idx >= 0 && idx < siblings.length - 1) {
          target = { id: siblings[idx + 1].id, label: '下一关' };
        } else {
          const chapterDone = (sid: string) => {
            const lv = levelsOfServer(sid);
            return lv.length > 0 && lv.every(l => doneSet.has(l.id));
          };
          const prevOf: Record<string, string> = { logs: 'syntax', storage: 'logs', factory: 'storage', diag: 'factory', core: 'diag' };
          const available = (sid: string) => {
            if (sid === 'training') return true;
            if (sid === 'syntax') return doneSet.has('tut-1');
            const prev = prevOf[sid];
            return prev ? chapterDone(prev) : false;
          };
          const order = ['training', 'syntax', 'logs', 'storage', 'factory', 'diag', 'core'];
          const cur = order.indexOf(level.serverId);
          for (let i = cur + 1; i < order.length; i++) {
            const sid = order[i];
            if (!available(sid)) continue;
            const lv = levelsOfServer(sid).find(l => !doneSet.has(l.id));
            if (lv) { target = { id: lv.id, label: '前往' + (serverById(sid)?.name || '') }; break; }
          }
        }
        setDone({ payload, summary: level.summary, nextId: target ? target.id : null, nextLabel: target ? target.label : '' });
      }
    } else {
      pushLines([
        { kind: 'out', text: stdout.replace(/\n$/, '') || '(无输出)' },
        { kind: 'sys', text: '── 自动判题结果 ──' },
        ...(v.checks.length ? v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err') as TermLine['kind'], text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' —— ' + c.detail : '') })) : []),
        { kind: 'err', text: '测试未全部通过。请继续修复。' },
      ]);
      setVerdict(v);
      const d = diagnoseAndShow(r, v, code);
      g.recordBug(codexForError(r.error?.type)?.id || 'logic');
      const fp = g.recordFail(level.id);
      if (fp.triggered) {
        setMiraTag('紧急警告');
        setMiraMsg('纠错者已锁定你的数据坐标！执行紧急防御协议！');
        play('alarm');
      } else {
        const m = miraOnFail(fp.n, fp.tolerance);
        if (m.tone === 'danger') {
          setMiraTag('系统警告');
          setMiraMsg(String(m.text));
          play('warning');
        } else {
          if (d) setMiraMsg(d.mira + ' ' + String(m.text));
          play('error');
        }
      }
    }
    } finally {
      submitLockRef.current = false;
    }
  };

  const askHint = () => {
    if (!level) return;
    const used = player.progress.hintLevels[level.id] || 0;
    const r = miraLevelHint(level, used);
    // A5 提示券：优先消耗，不计入本关提示层数（保护评级）
    const rw = normalizeRewards(player.rewards);
    const byTicket = rw.buffs.hintTicket > 0 && g.consumeHintTicket();
    setMiraTag('提示 LEVEL ' + r.level);
    setMiraMsg(byTicket ? r.text + '（已消耗 1 张提示券，本关提示次数未增加）' : r.text);
    if (!byTicket) g.hintUsed(level.id);
    play('click');
  };

  const resetCode = () => {
    if (resetArmed) {
      snapshot(code);
      applyCode(level.initialCode, { touch: true, save: true, notice: '已恢复初始故障版本（旧内容已存入历史）' });
      setScanLines([]);
      setResetArmed(false);
      setVerdict(null);
      setErrorLine(null);
      pushLines([{ kind: 'sys', text: '代码已恢复为初始故障版本。' }]);
      play('click');
    } else {
      setResetArmed(true);
      window.setTimeout(() => setResetArmed(false), 3000);
    }
  };

  /** 进入单步调试：执行一次带轨迹采集的运行，然后逐步回放 */
  const startDebug = async () => {
    if (!level || running || submitting || locked) return;
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([{ kind: 'cmd', text: 'python task.py --debug' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
      setMiraTag('安全警告');
      setMiraMsg('调试模式同样受安全策略限制。' + ck.reason);
      play('deny');
      return;
    }
    setRunning(true);
    setDbg(null);
    setDebugLine(null);
    setVerdict(null);
    setErrorLine(null);
    pushLines([{ kind: 'cmd', text: 'python task.py --debug' }, { kind: 'sys', text: '正在采集执行轨迹（逐行回放模式）…' }]);
    play('run');
    const r = await runPython(code, { timeoutMs: 5000, debug: true });
    setRunning(false);

    if (r.timedOut) {
      pushLines([{ kind: 'err', text: '调试采集超时：程序运行超过安全时限，已被强制终止（检查死循环）。' }]);
      setMiraTag('系统警告');
      setMiraMsg('调试超时。你的程序可能存在死循环——检查循环条件是否最终会变成假。');
      play('error');
      return;
    }
    const steps = (r.trace || []).filter(t => t.line >= 0);
    if (steps.length === 0) {
      pushLines([{ kind: 'warn', text: '未采集到执行轨迹：代码可能是空的，或只有注释/未执行的部分。' }]);
      return;
    }
    // 初始：停在第一步
    const first = steps[0];
    const firstOut = steps.slice(0, 1).map(s => s.out || '').join('');
    if (firstOut) pushLines([{ kind: 'out', text: firstOut.replace(/\n$/, '') }]);
    pushLines([{ kind: 'sys', text: '调试就绪：共 ' + steps.length + ' 步。用「下一步」逐行查看变量变化。' }]);
    setDbg({ steps, idx: 0, done: false, failed: !r.ok });
    setDebugLine(first.line > 0 ? first.line : null);
    if (!r.ok && r.error) {
      setMiraTag('排错助手');
      setMiraMsg('程序在第 ' + (r.error.line ?? '?') + ' 行附近出错。单步回放已保留到崩溃前的轨迹——' + miraOnError(r.error.type));
    } else {
      setMiraTag('调试模式');
      setMiraMsg('轨迹已采集。右侧「变量监视器」会随每一步更新——注意观察变量在循环中如何变化。');
    }
  };

  /** 调试：推进到指定步（输出该区间产生的输出） */
  const applyDbgStep = (ni: number) => {
    if (!dbg) return;
    const idx = Math.max(0, Math.min(ni, dbg.steps.length - 1));
    const step = dbg.steps[idx];
    if (idx > dbg.idx) {
      const chunk = dbg.steps.slice(dbg.idx + 1, idx + 1).map(s => s.out || '').join('');
      if (chunk) pushLines([{ kind: 'out', text: chunk.replace(/\n$/, '') }]);
    }
    setDebugLine(step.line > 0 ? step.line : null);
    const isLast = idx >= dbg.steps.length - 1;
    if (isLast) {
      pushLines([{ kind: 'sys', text: '调试轨迹结束（共 ' + dbg.steps.length + ' 步）。' + (dbg.failed ? '程序在执行中出错。' : '') }]);
    }
    setDbg({ ...dbg, idx, done: isLast });
  };

  const dbgNext = () => {
    if (!dbg || dbg.done) return;
    play('click');
    applyDbgStep(dbg.idx + 1);
  };

  const dbgToEnd = () => {
    if (!dbg) return;
    play('click');
    applyDbgStep(dbg.steps.length - 1);
  };

  const dbgExit = () => {
    setDbg(null);
    setDebugLine(null);
    pushLines([{ kind: 'sys', text: '已退出调试模式。' }]);
    play('click');
  };

  const hintUsed = player.progress.hintLevels[level.id] || 0;
  // 容错显示统一取会话（进行中）或存档镜像，剩余值永不小于 0
  const activeSession = player.progress.challengeSessions?.[level.id];
  const tolUsed = activeSession && activeSession.status === 'active'
    ? activeSession.errors
    : (player.progress.failedAttempts[level.id] || 0);
  const tolLeft = Math.max(0, g.tolerance - tolUsed);
  const risk = riskStatusFor({ consciousness: player.consciousness, level: player.level, failures: tolUsed, toleranceRemaining: tolLeft });
  const myRewards = normalizeRewards(player.rewards);
  const buffs = myRewards.buffs;
  const stars = player.progress.stars[level.id] || 0;
  const server = serverById(level.serverId);
  const knowledgeCards = level.knowledge.map(knowledgeById).filter(Boolean);

  return (
    <div className={'page page-anim chlg-page v-' + view + ' st-' + sideTab + (sideCollapsed ? ' side-collapsed' : '')}>
      {/* HUD */}
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" disabled={locked || running || submitting} onClick={() => { play('click'); g.nav('map'); }}>◀ 服务器地图</button>
        <div>
          <div className="hud-title">{level.title}</div>
          <div className="hud-sub">{server ? server.name + ' · ' : ''}任务代号 {level.codename}</div>
        </div>
        <div className="hud-spacer" />
        <div className={'py-status ' + pyState.status} title={pyState.phase}>
          <span className="pd" />
          {pyState.status === 'ready'
            ? 'PY ENGINE READY'
            : pyState.status === 'loading'
              ? '引擎加载中 ' + loadElapsed + 's · ' + (pyState.phase || '准备中')
              : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'}
        </div>
        <span className="hud-chip">{stars > 0 ? '★'.repeat(stars) : '未通关'}</span>
        <span className="hud-chip cyan" title="剩余容错 / 本关容错上限">容错 {tolLeft}/{g.tolerance}</span>
        <span className={'hud-chip risk-' + risk.level.toLowerCase()} title={risk.hint}>{risk.label}</span>
        <span className="hud-chip gold" title="贡献点（兑换中心货币）">◈ {myRewards.credits}</span>
        {buffs.shield > 0 && <span className="hud-chip" title="护盾：自动拦截下一次纠错者攻击">⛨ 护盾 {buffs.shield}</span>}
        {buffs.guard > 0 && <span className="hud-chip" title="容错护符：挡下一次超限攻击">◈ 护符 {buffs.guard}</span>}
        {buffs.hintTicket > 0 && <span className="hud-chip" title="提示券：不计入本关提示次数">◇ 提示券 {buffs.hintTicket}</span>}
        <span className="hud-chip">意识 {player.consciousness}%</span>
        <div className="side-switch" role="group" aria-label="侧栏切换">
          <button className={'ss-btn' + (!sideCollapsed && sideTab === 'task' ? ' on' : '')}
            onClick={() => { play('click'); setSideTab('task'); setSideCollapsed(false); }}>任务</button>
          <button className={'ss-btn' + (!sideCollapsed && sideTab === 'diag' ? ' on' : '')}
            onClick={() => { play('click'); setSideTab('diag'); setSideCollapsed(false); }}>诊断</button>
          <button className={'ss-btn' + (!sideCollapsed && sideTab === 'mira' ? ' on' : '')}
            onClick={() => { play('click'); setSideTab('mira'); setSideCollapsed(false); }}>MIRA</button>
          <button className="ss-btn ico" title={sideCollapsed ? '展开侧栏（优先编辑器）' : '收起侧栏（优先编辑器）'}
            onClick={() => { play('click'); setSideCollapsed(v => !v); }}>{sideCollapsed ? '▸' : '◂'}</button>
        </div>
        <button className="nxbtn small ghost hud-music" onClick={() => { g.toggleMusic(); setMusicOn(isMusicOn()); }}>
          {musicOn ? '♪ 音乐开' : '♪ 音乐关'}
        </button>
      </div>

      {/* 手机端标签：任务 / 代码 / 输出 / MIRA */}
      <div className="mobile-tabs" role="tablist" aria-label="挑战页分区">
        {([['task', '任务'], ['code', '代码'], ['out', '输出'], ['diag', '诊断'], ['mira', 'MIRA']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id}
            className={'mt-btn' + (view === id ? ' on' : '')}
            onClick={() => { play('click'); setView(id); }}>
            {label}
            {id === 'out' && term.length > 0 && <span className="mt-dot" aria-hidden="true" />}
            {id === 'diag' && diag && diag.kind !== 'ok' && <span className="mt-dot" aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="chlg-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* 左栏：任务说明 */}
        <div className="chlg-left" style={{ overflowY: 'auto' }}>
          <div className="panel task-block">
            <div className="panel-title">任务简报<span className="panel-tag">{level.codename}</span></div>
            <div className="tb-item">
              <div className="tb-label">故障现象</div>
              <div className="tb-text">{level.fault}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">任务目标</div>
              <div className="tb-text">{level.goal}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">正确行为</div>
              <div className="tb-text warn">{level.behavior}</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">故障日志</div>
            <div style={{ fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#FF9BA2', lineHeight: 1.8, background: 'rgba(255,91,100,0.06)', border: '1px solid rgba(255,91,100,0.2)', borderRadius: 8, padding: '9px 11px', whiteSpace: 'pre-wrap' }}>
              {level.faultLog}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">知识点</div>
            <div>
              {knowledgeCards.map(k => (
                <span key={k!.id} className="chip cyan know-chip">{k!.title}</span>
              ))}
            </div>
          </div>
          {level.varsNote && level.varsNote.length > 0 && (
            <div className="panel">
              <div className="panel-title">变量监视器<span className="panel-tag">STATIC MODE</span></div>
              {level.varsNote.map(v => (
                <div className="pf-kv" key={v.name} style={{ fontSize: 12.5 }}>
                  <span className="k">{v.name}</span>
                  <span className="v" style={{ textAlign: 'right' }}>{v.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 中栏：编辑器 */}
        <div className="chlg-center">
          <div className="draft-bar" role="status" aria-live="polite">
            <span className={'draft-pill ' + draftStatus} title={draftError || undefined}>
              <span className="dot" />
              {draftStatus === 'saving' ? '草稿 · 保存中…'
                : draftStatus === 'saved' ? '草稿 · 已保存'
                  : draftStatus === 'error' ? '草稿 · 保存失败'
                    : draftStatus === 'cleared' ? '草稿 · 已清除'
                      : '草稿 · 未保存'}
            </span>
            {savedAt ? <span className="draft-time">保存于 {formatDraftClock(savedAt)}</span> : null}
            <span className="draft-lines">当前 {code.split('\n').length} 行</span>
            {draftNotice && <span className="draft-notice">{draftNotice}</span>}
            <div className="sp" />
            {draftStatus === 'error' && (
              <button className="nxbtn small danger" onClick={copyCode}>复制代码</button>
            )}
            {draft && draft.code !== code && (
              <button className="nxbtn small ghost" onClick={restoreDraft}>恢复草稿</button>
            )}
            {draft?.passedCode && draft.passedCode !== code && (
              <button className="nxbtn small ghost" onClick={previewPassed}>查看通关代码</button>
            )}
            {draft && code !== level.initialCode && (
              <button className="nxbtn small ghost" onClick={useInitialCode}>改用初始代码</button>
            )}
            {!!(draft?.history && draft.history.length > 0) && (
              <button className="nxbtn small ghost" onClick={restoreHistory}>恢复上一版</button>
            )}
            <button className="nxbtn small ghost" disabled={running || submitting} onClick={saveDraftNow}
              title="立即把当前代码保存到本机（不等自动保存）">
              💾 保存草稿
            </button>
            <button className={'nxbtn small ' + (draftArmed ? 'danger' : 'ghost')} disabled={running || submitting} onClick={clearDraftNow}
              title="清除本关草稿并回到初始故障版本">
              {draftArmed ? '确认清除？' : '清除草稿'}
            </button>
          </div>
          <div className="toolbar">
            <button className="nxbtn" disabled={running || submitting || locked} onClick={run}>
              {running ? <span className="spinner" /> : '▶'} 运行代码
              <span className="hint-chip" style={{ marginLeft: 8, fontSize: 11, color: '#4A6E85' }}>Ctrl+Enter</span>
            </button>
            <button className="nxbtn primary" disabled={running || submitting || locked} onClick={submit}>
              提交修复 ⏎
            </button>
            <button className="nxbtn ghost" disabled={running || submitting || locked} onClick={resetCode}>
              {resetArmed ? '确认重置？' : '重置代码'}
            </button>
            <button className="nxbtn warn" disabled={running || submitting || locked || !!dbg} onClick={startDebug}
              title="采集执行轨迹并逐行回放，右侧变量监视器实时更新">
              🐞 单步调试
            </button>
            <button className="nxbtn ghost small" disabled={running || submitting || locked} onClick={useScan}
              title="消耗 1 个扫描器：高亮可疑行，只定位不给答案">
              ⌖ 扫描 ×{player.rewards?.items?.scan || 0}
            </button>
            <button className="nxbtn ghost small" disabled={running || submitting || locked} onClick={useRollback}
              title="消耗 1 个回滚模块：恢复上一次代码快照">
              ↺ 回滚 ×{player.rewards?.items?.rollback || 0}
            </button>
            <button className="nxbtn ghost small only-mobile" onClick={toggleWrap}
              title="窄屏下切换自动换行；关闭后代码在编辑器内独立横向滚动">
              {wrapMode ? '↩ 自动换行 开' : '↔ 自动换行 关'}
            </button>
            <div className="sp" />
            <span className="chip">运行不增加失败次数</span>
            {locked && <span className="chip red warn-flash">紧急事件进行中——主线提交已锁定</span>}
          </div>
          <div className="code-frame" style={{ flex: 1 }}>
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              errorLine={errorLine}
              debugLine={debugLine}
              markLines={scanLines}
              onRun={run}
              readOnly={running || submitting}
              wordWrap={!isMobile || wrapMode}
              fontSize={player.settings.animLevel === 'low' ? 15 : isMobile ? 14 : 15.5}
            />
          </div>
          {dbg && (
            <div className="dbg-bar">
              <span className="chip orange">
                🐞 单步调试 · 第 {dbg.idx + 1} / {dbg.steps.length} 步 · 第 {debugLine ?? '?'} 行
              </span>
              <button className="nxbtn small" onClick={dbgNext} disabled={dbg.done}>▶ 下一步</button>
              <button className="nxbtn small ghost" onClick={dbgToEnd} disabled={dbg.done}>⏭ 运行到结束</button>
              <button className="nxbtn small ghost" onClick={dbgExit}>◼ 退出调试</button>
              <div className="sp" />
              <span className="hint-note">回放模式：轨迹已在后台采集完毕，逐步查看每行的变量与输出。</span>
            </div>
          )}
          {verdict && (
            <div>
              <div className={'result-banner ' + (verdict.passed ? 'ok' : 'fail')}>
                {verdict.passed ? '✓ 修复成功——全部测试通过' : verdict.timedOut ? '✗ 判题超时（已强制终止）' : verdict.error ? '✗ 执行出错：' + verdict.error.type : '✗ 测试未全部通过'}
              </div>
              {verdict.error && <div style={{ fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#FF9BA2', marginTop: 6, whiteSpace: 'pre-wrap' }}>{verdict.error.message}</div>}
              {!verdict.error && verdict.checks.length > 0 && (
                <div className="checks-list">
                  {verdict.checks.map((c: JudgeCheck, i: number) => (
                    <div key={i} className={'ck ' + (c.ok ? 'ok' : 'fail')}>{c.ok ? '✓' : '✗'} {c.name}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右栏：MIRA + 状态 */}
        <div className="chlg-right" style={{ overflowY: 'auto' }}>
          <DiagnosisPanel diag={diag} status={diagStatus} streak={diagStreak} history={diagHistory} />
          <MiraPanel message={miraMsg} msgTag={miraTag} hintUsed={hintUsed} onAskHint={locked ? undefined : askHint} />
          {dbg && (
            <div className="panel">
              <div className="panel-title">
                变量监视器
                <span className="panel-tag">DEBUG 行 {debugLine ?? '?'}</span>
              </div>
              <DebugVars vars={dbg.steps[Math.min(dbg.idx, dbg.steps.length - 1)].vars} />
              <div className="hint-note" style={{ marginTop: 8 }}>
                第 {dbg.idx + 1} / {dbg.steps.length} 步 · 值为变量的 repr（截断 80 字）
              </div>
            </div>
          )}
          <div className="panel">
            <div className="panel-title">生命体征</div>
            <PlayerStatus showTolerance />
          </div>
        </div>
      </div>

      {/* 底部终端 */}
      <div className="chlg-bottom">
        <Terminal lines={term} maxHeight={210} title={'维修终端 · ' + level.codename} />
      </div>

      {/* 手机端固定操作栏：始终可见，键盘弹出时随可视区域上移 */}
      <div className="mobile-actions">
        <button className="nxbtn ghost" disabled={running || submitting} onClick={saveDraftNow} title="立即保存草稿">💾</button>
        <button className="nxbtn" disabled={running || submitting || locked} onClick={run}>
          {running ? <span className="spinner" /> : '▶'} 运行
        </button>
        <button className="nxbtn primary" disabled={running || submitting || locked} onClick={submit}>
          提交修复
        </button>
      </div>

      {/* 首次进入关卡简报 */}
      {briefOpen && (
        <DialogSystem
          nodes={[
            { id: level.id + '-b1', speaker: 'MIRA', kind: 'mira', text: '任务简报：「' + level.title + '」\n' + level.fault },
            { id: level.id + '-b2', speaker: 'NEXUS 系统', kind: 'system', text: '故障日志：' + level.faultLog + '\n任务目标：' + level.goal + '\n\n操作指引：在中间编辑器里改代码 → 点「运行代码」预览结果（不计数）→ 点「提交修复」正式判题' },
          ]}
          speedMs={player.settings.typewriterMs}
          animEnabled={player.settings.animations}
          frameTitle={level.title + ' · 任务简报'}
          onSeen={id => g.markStory(id)}
          onDone={() => { setBriefOpen(false); g.markStory(level.id); g.toast('info', '提示：点击「MIRA 提示」可获得分层指导。'); }}
        />
      )}

      {/* 通关结算 */}
      {done && (
        <div className="overlay ov-result" style={{ background: 'rgba(3,10,16,0.72)', backdropFilter: 'blur(5px)' }}>
          <div className={'complete-panel' + (g.player.progress.flags.fxRepair === true ? ' fx-repair' : '')}>
            <div className="cp-ico">✓</div>
            <div className="cp-title">修复成功</div>
            <div className="cp-sub">{level.codename} · {level.title} 已恢复运行</div>
            <div className="star-row">
              {[1, 2, 3].map(i => <span key={i} className={'star' + (i <= done.payload.stars ? ' on' : '')} style={{ animationDelay: (0.15 * i) + 's' }}>★</span>)}
            </div>
            {done.payload.reward && (() => {
              const rw = done.payload.reward!;
              const meta = GRADE_META[rw.breakdown.grade];
              return (
                <div className={'reward-settle grade-' + rw.breakdown.grade}>
                  <div className="reward-particles" aria-hidden="true">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span key={i} style={{ '--i': i } as React.CSSProperties} />
                    ))}
                  </div>
                  <div className={'grade-badge g-' + rw.breakdown.grade}>
                    <span className="gb-letter">{rw.breakdown.grade}</span>
                    <span className="gb-desc">{meta.desc}</span>
                  </div>
                  <div className="settle-grid">
                    <div className="sg-item"><span className="k">贡献点</span><span className="v gold">+{rw.breakdown.total}</span></div>
                    <div className="sg-item"><span className="k">失误次数</span><span className="v">{rw.fails}</span></div>
                    <div className="sg-item"><span className="k">使用提示</span><span className="v">{rw.hints} 次</span></div>
                    <div className="sg-item"><span className="k">信任度</span><span className="v cyan">{rw.trustUp ? '+' + rw.breakdown.trustGain : '已满'}</span></div>
                  </div>
                  <div className="settle-tags">
                    {rw.breakdown.firstClear > 0 && <span className="chip gold">首通 +{rw.breakdown.firstClear}</span>}
                    {rw.breakdown.noFail > 0 && <span className="chip green">零失误 +{rw.breakdown.noFail}</span>}
                    {rw.breakdown.noHint > 0 && <span className="chip green">未用提示 +{rw.breakdown.noHint}</span>}
                    {rw.breakdown.gradeBonus > 0 && <span className="chip cyan">评级奖励 +{rw.breakdown.gradeBonus}</span>}
                    {(rw.breakdown.improvement || 0) > 0 && <span className="chip cyan">星级提升 +{rw.breakdown.improvement}</span>}
                    {rw.duplicate && <span className="chip dim">重复通关：仅星级提升有补偿</span>}
                  </div>
                  {rw.chapterReward && (
                    <div className="chapter-reward">
                      <div className="cr-title">✦ 章节奖励 · {rw.chapterReward.title}</div>
                      <div className="cr-desc">{rw.chapterReward.desc}</div>
                      <div className="cr-gain">
                        +{rw.chapterReward.credits} 贡献点
                        {rw.chapterReward.skins.length > 0 && ' · 解锁外观'}
                        {Object.keys(rw.chapterReward.items).length > 0 && ' · 获得道具'}
                        {rw.chapterReward.fragment && ' · 记忆碎片'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="cp-rewards">
              <div className="cp-reward"><div className="rv">+{done.payload.expGained}</div><div className="rl">经验</div></div>
              <div className="cp-reward"><div className="rv">Lv.{done.payload.newLevel}</div><div className="rl">等级</div></div>
              <div className="cp-reward"><div className="rv">{level.knowledge.length}</div><div className="rl">知识卡片</div></div>
            </div>
            {done.payload.session && (() => {
              const st = done.payload.session!;
              const ms = milestone(st.expAfter);
              return (
                <div className="settle-detail">
                  <div className="sd-row">
                    <span>用时 <b>{formatDuration(st.durationMs)}</b></span>
                    <span>运行 <b>{st.runs}</b> 次</span>
                    <span>提交 <b>{st.submits}</b> 次</span>
                    <span>失误 <b>{st.errors}</b> 次</span>
                    <span>提示 <b>{st.hints}</b> 层</span>
                  </div>
                  <div className="sd-row">
                    <span>容错 剩余 <b>{st.toleranceRemaining}</b> / 上限 {st.toleranceMax}</span>
                    <span>本次消耗 <b>{st.toleranceUsed}</b> 次</span>
                  </div>
                  <div className="sd-row">
                    <span>等级 Lv.{st.levelAfter}</span>
                    <span>经验 {st.expAfter}{ms.maxed ? '（已满级）' : `（距 Lv.${ms.level + 1} 还差 ${Math.max(0, ms.need - ms.into)}）`}</span>
                    {done.payload.expBoosted && <span className="chip cyan">经验增幅 ×{done.payload.expBoostMult || 1.5}</span>}
                  </div>
                  {done.payload.levelUp && (st.toleranceGain > 0 ? (
                    <div className="result-banner ok" style={{ marginTop: 8 }}>
                      ⬆ 等级提升 Lv.{st.levelBefore} → Lv.{st.levelAfter} · 容错次数 +{st.toleranceGain}（当前 {st.toleranceMax}）
                    </div>
                  ) : (
                    <div className="settle-note">
                      ⬆ 等级提升 Lv.{st.levelBefore} → Lv.{st.levelAfter} ·{' '}
                      {st.toleranceCapped
                        ? `容错次数已达到最高上限 ${st.toleranceMax} 次`
                        : `本次容错次数不变（当前 ${st.toleranceMax} 次${st.toleranceNextLevel ? `；下次提升 Lv.${st.toleranceNextLevel} → ${st.toleranceNextMax} 次` : ''}）`}
                    </div>
                  ))}
                </div>
              );
            })()}
            {!done.payload.firstTime && <div className="dim" style={{ fontSize: 12.5, marginBottom: 8 }}>已通关关卡：不再发放经验与基础贡献点（仅星级提升给少量补偿）。</div>}
            {(done.payload.unlocks || []).length > 0 && (
              <div className="result-banner ok" style={{ marginBottom: 8 }}>
                ✦ 等级解锁：{done.payload.unlocks!.join('、')}（已自动装备）
              </div>
            )}
            {done.payload.newAchievements.length > 0 && (
              <div className="dim" style={{ fontSize: 13, marginBottom: 8 }}>
                成就：{done.payload.newAchievements.map(id => achievementById(id)?.name).join('、')}
              </div>
            )}
            <div className="cp-summary">
              <div className="cs-label">MIRA 知识总结</div>
              {done.summary}
            </div>
            <div className="dim" style={{ fontSize: 12, marginBottom: 8, color: '#6FD8A8' }}>
              ✓ 进度已自动保存到本机（关闭浏览器后重新打开可继续）
            </div>
            <div className="cp-btns">
              <button className="nxbtn ghost" onClick={() => { play('click'); g.nav('map'); }}>返回地图</button>
              {done.nextId && (
                <button className="nxbtn primary" onClick={() => { play('click'); g.setCurrentLevel(done.nextId!); }}>
                  {done.nextLabel || '下一关'}：{levelById(done.nextId)?.title} ▸
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 动态变量表（调试模式） */
function DebugVars({ vars }: { vars: Record<string, string> }) {
  const entries = Object.entries(vars).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    return <div className="dim" style={{ fontSize: 12.5, padding: '6px 0' }}>该步没有可见的局部变量（可能还没执行到赋值语句）。</div>;
  }
  return (
    <div style={{ fontFamily: 'Consolas, monospace', fontSize: 12.5 }}>
      {entries.map(([k, v]) => (
        <div key={k} className="pf-kv" style={{ fontSize: 12, alignItems: 'flex-start' }}>
          <span className="k" style={{ flex: '0 0 42%' }}>{k}</span>
          <span className="v" style={{ flex: 1, textAlign: 'right', overflowWrap: 'anywhere', color: '#BDE9F2' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
