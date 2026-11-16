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
import { buildChapterSettlement } from '../game/economy';
import { topBugsForChapter } from '../game/codex';
import FragmentGain from '../components/FragmentGain';
import { bossScenesFor } from '../game/lore/bossScenes';
import { CHAPTER6_FINAL_MEMORY_SCENES } from '../game/lore/chapter6';
import { filterMarkerLines } from '../services/judge';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { play } from '../services/sound';

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
  const player = g.player;
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
  const totalChecks = phaseCheckCount(phase);
  // 难度影响提示层级：简单=完整三层，困难=前两层，专家=仅一层思路提示
  const maxHint = difficulty === 'easy' ? phase.hints.length : difficulty === 'hard' ? Math.min(2, phase.hints.length) : Math.min(1, phase.hints.length);
  const passedChecks = popcount(stored.phaseMask[phaseIndex] || 0);
  const pct = hpPercent(stored);
  const alreadyCleared = stored.cleared || (player.progress.bossesDone || []).includes(boss.id);
  const battleInProgress = !!player.progress.battles?.[boss.id] && !stored.cleared && stored.started;
  const failures = player.progress.failedAttempts[boss.id] || 0;
  const eventLocked = g.event.kind !== 'none';

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

  const backToMap = () => {
    play('click');
    g.setCurrentBoss(null);
    g.nav('map');
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
    if (running || submitting || eventLocked || !canFight) return;
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
    if (running || submitting || eventLocked || !canFight) return;
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
  };

  const resetCode = () => {
    setCode(phase.initialCode);
    setVerdict(null);
    setErrorLine(null);
    pushLines([{ kind: 'sys', text: '代码已恢复为本阶段的初始故障版本。' }]);
    play('click');
  };

  const hint = phase.hints[Math.min(hintLevel - 1, maxHint - 1)];
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
      {/* HUD */}
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" disabled={running || submitting} onClick={backToMap}>
          ◀ 撤退（进度已保存）
        </button>
        <div>
          <div className="hud-title" style={{ color: '#C9A7FF' }}>⚡ {boss.codename} · {boss.title}</div>
          <div className="hud-sub">
            第 {boss.chapter} 章 · 阶段 {Math.min(phaseIndex + 1, def.phases.length)} / {def.phases.length} · {phase.title}
            {sim ? ' · 模拟挑战' : ''}
          </div>
        </div>
        <div className="hud-spacer" />
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
      <div className={'boss-arena phase-' + phaseIndex + (eventLocked ? ' locked' : '') + (countered ? ' is-counter' : '')}>
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
              </div>
              <div className="hp-readout">
                <span className="hp-num">{stored.hp} / {stored.maxHp}</span>
                <span className="hp-pct">{pct}%</span>
              </div>
            </div>
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
        {eventLocked && <div className="arena-lock">紧急事件进行中——战斗已暂停</div>}
      </div>

      <div className="chlg-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* 左：本阶段任务 */}
        <div className="chlg-left" style={{ overflowY: 'auto' }}>
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
            <div className="panel-title">MIRA 提示<span className="panel-tag">LEVEL {hintLevel} / {maxHint}</span></div>
            <div style={{ fontSize: 13, color: '#BFD8E8', lineHeight: 1.75 }}>{hint}</div>
            <button className="nxbtn small ghost" style={{ marginTop: 8 }} disabled={hintLevel >= maxHint} onClick={() => { play('click'); setHintLevel(h => Math.min(h + 1, maxHint)); }}>
              下一条提示
            </button>
          </div>
        </div>

        {/* 中：代码 */}
        <div className="chlg-center">
          <div className="toolbar">
            <button className="nxbtn" disabled={running || submitting || eventLocked} onClick={run}>
              {running ? <span className="spinner" /> : '▶'} 运行代码
            </button>
            <button className="nxbtn primary" disabled={running || submitting || eventLocked || !canFight} onClick={submit}>
              {sim ? '提交模拟判题 ⏎' : '提交攻击 ⏎'}
            </button>
            <button className="nxbtn ghost" disabled={running || submitting || eventLocked || sim} onClick={resetCode}>重置代码</button>
            <div className="sp" />
            <span className="chip">{sim ? '模拟挑战：不扣血 / 不发奖' : '判题通过才掉血'}</span>
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
            if (pendingClear) setCleared(pendingClear);
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
                <button className="nxbtn ghost" onClick={() => { play('click'); g.abandonBossBattle(boss.id); }}>
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
