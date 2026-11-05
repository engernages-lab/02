import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import Terminal, { type TermLine } from '../components/Terminal';
import PlayerStatus from '../components/PlayerStatus';
import BossAvatar from '../components/BossAvatar';
import CinematicStage from '../components/CinematicStage';
import { useGame } from '../store/gameStore';
import { bossById, type BossDef } from '../game/bosses';
import {
  battleFor, normalizeBattleState, resolveSubmission, hpPercent, phaseCheckCount, popcount,
  type BossBattleDef,
} from '../game/battle';
import { knowledgeById } from '../game/knowledge';
import { fragmentById, fragmentForCollected, type CreatorFragmentDef } from '../game/lore/fragments';
import { chapterById } from '../game/lore/chapters';
import { levelsOfServer } from '../game/levels';
import { buildChapterSettlement } from '../game/economy';
import { topBugsForChapter } from '../game/codex';
import FragmentGain from '../components/FragmentGain';
import { bossScenesFor } from '../game/lore/bossScenes';
import { buildHarness, checkUserCode, combineWithHarness, filterMarkerLines, judgeRun, type JudgeVerdict } from '../services/judge';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { play } from '../services/sound';

interface ClearedInfo {
  fragmentId: string;
  expGained: number;
  levelUp: boolean;
  newLevel: number;
  credits: number;
  trust: number;
  unlocks: string[];
}

export default function BossBattlePage() {
  const g = useGame();
  const boss = bossById(g.player.progress.currentBossId || '');
  const def = boss ? battleFor(boss.id) : undefined;
  if (!boss || !def) return null;
  return <BattleView boss={boss} def={def} />;
}

function BattleView({ boss, def }: { boss: BossDef; def: BossBattleDef }) {
  const g = useGame();
  const player = g.player;
  const respawnTick = g.respawnTick;

  const stored = useMemo(
    () => normalizeBattleState((player.progress.battles || {})[boss.id], def),
    [player.progress.battles, boss.id, def],
  );
  const phaseIndex = Math.min(stored.phase, def.phases.length - 1);
  const phase = def.phases[phaseIndex];
  const totalChecks = phaseCheckCount(phase);
  const passedChecks = popcount(stored.phaseMask[phaseIndex] || 0);
  const pct = hpPercent(stored);
  const alreadyCleared = stored.cleared || (player.progress.bossesDone || []).includes(boss.id);
  const failures = player.progress.failedAttempts[boss.id] || 0;
  const locked = g.event.kind !== 'none';

  const [code, setCode] = useState(phase.initialCode);
  const [term, setTerm] = useState<TermLine[]>([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
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
  const [cleared, setCleared] = useState<ClearedInfo | null>(null);
  const [gain, setGain] = useState<CreatorFragmentDef | null>(null);
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

  // 进入战斗：没有进度就创建满血状态（已有进度则续战）
  useEffect(() => {
    g.beginBossBattle(boss.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id]);

  // 战前演出（首次）
  useEffect(() => {
    setIntroOpen(!player.progress.storySeen['bossIntro_' + boss.id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id]);

  // 阶段变化 → 载入该阶段题目
  useEffect(() => {
    const p = def.phases[Math.min(stored.phase, def.phases.length - 1)];
    setCode(p.initialCode);
    setVerdict(null);
    setErrorLine(null);
    setHintLevel(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored.phase, boss.id, respawnTick]);

  // Boss 反击 → 玩家受击反馈（红屏 + 抖动）
  useEffect(() => {
    if (!counterKey) return;
    setCountered(true);
    const t = window.setTimeout(() => setCountered(false), 520);
    return () => window.clearTimeout(t);
  }, [counterKey]);

  const run = async () => {
    if (running || submitting || locked) return;
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([{ kind: 'cmd', text: 'python gate.py' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
      play('deny');
      return;
    }
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

  /** 判题没有造成伤害：不判负，只让 Boss 反击（意识 / 容错），战斗继续 */
  const handleFail = (reason: string) => {
    play('error');
    setCounterKey(k => k + 1);
    const fp = g.recordFail(boss.id);
    g.bossCounterAttack(boss.id, def.counterDamage);
    addLog('未造成伤害（' + reason + '）· 意识 -' + def.counterDamage, 'fail');
    if (fp.triggered) g.toast('warn', '容错次数用尽——纠错者锁定你了！');
  };

  const submit = async () => {
    if (running || submitting || locked || alreadyCleared) return;
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([{ kind: 'cmd', text: 'python gate.py --attack' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
      play('deny');
      return;
    }
    setSubmitting(true);
    setVerdict(null);
    setErrorLine(null);
    play('run');
    pushLines([{ kind: 'cmd', text: 'python gate.py --attack （阶段 ' + (phaseIndex + 1) + '：' + phase.title + '）' }]);

    const combined = phase.judge.judgeKind === 'python'
      ? combineWithHarness(code, buildHarness(phase.judge.pythonChecks || []))
      : code;
    const r = await runPython(combined, { timeoutMs: 5000 });
    setSubmitting(false);

    if (r.timedOut) {
      pushLines([{ kind: 'err', text: '攻击超时：防御协议没有被破坏。' }]);
      handleFail('执行超时');
      return;
    }
    if (!r.ok) {
      pushLines([
        ...(filterMarkerLines(r.stdout || '').trim() ? [{ kind: 'out' as const, text: filterMarkerLines(r.stdout).replace(/\n$/, '') }] : []),
        { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
      ]);
      if (r.error?.line) setErrorLine(r.error.line);
      handleFail(r.error ? r.error.type : '执行出错');
      return;
    }

    const v = judgeRun(phase.judge, r);
    const res = resolveSubmission(def, stored, phaseIndex, v.checks);
    setVerdict(v);

    if (res.newPassed === 0) {
      pushLines([
        { kind: 'sys', text: '── 攻击结果 ──' },
        ...v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err') as TermLine['kind'], text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' —— ' + c.detail : '') })),
        { kind: 'err', text: '这次没有命中防御核心。' },
      ]);
      handleFail('判题未通过');
      return;
    }

    // 命中：按真实通过的测试数扣血
    g.applyBossDamage(boss.id, phaseIndex, {
      hpAfter: res.hpAfter,
      mask: res.mask,
      phaseAfter: res.phaseAfter,
      defeated: res.defeated,
    });
    setHitKey(k => k + 1);
    pushDamage(res.damage);
    pushLines([
      { kind: 'sys', text: '── 攻击结果 ──' },
      ...v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err') as TermLine['kind'], text: (c.ok ? '✓ ' : '✗ ') + c.name })),
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

      if (res.defeated) {
        const out = g.completeBoss(boss.id);
        addLog(boss.codename + ' 核心停止运转', 'win');
        play('levelup');
        if (out) {
          setCleared(out);
          const fd = fragmentForCollected(out.fragmentId);
          if (fd) setGain(fd);
          else if (scenes.outro) setOutroOpen(true);
        }
      }
    }
  };

  const resetCode = () => {
    setCode(phase.initialCode);
    setVerdict(null);
    setErrorLine(null);
    pushLines([{ kind: 'sys', text: '代码已恢复为本阶段的初始故障版本。' }]);
    play('click');
  };

  const hint = phase.hints[Math.min(hintLevel - 1, phase.hints.length - 1)];
  const knowledgeCards = phase.knowledge.map(knowledgeById).filter(Boolean);
  const opp = boss.opponentName || boss.codename;

  return (
    <div className={'page page-anim boss-page boss-battle bg-' + def.bg} style={{ padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* HUD */}
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" disabled={running || submitting} onClick={() => { play('click'); g.setCurrentBoss(null); g.nav('map'); }}>
          ◀ 撤退（进度已保存）
        </button>
        <div>
          <div className="hud-title" style={{ color: '#C9A7FF' }}>⚡ {boss.codename} · {boss.title}</div>
          <div className="hud-sub">第 {boss.chapter} 章 · 阶段 {Math.min(phaseIndex + 1, def.phases.length)} / {def.phases.length} · {phase.title}</div>
        </div>
        <div className="hud-spacer" />
        <div className={'py-status ' + pyState.status} title={pyState.phase}>
          <span className="pd" />
          {pyState.status === 'ready' ? 'PY ENGINE READY' : pyState.status === 'loading' ? '引擎加载中…' : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'}
        </div>
        <span className={'hud-chip' + (player.consciousness <= 20 ? ' red warn-flash' : '')}>意识 {player.consciousness}%</span>
        <span className="hud-chip cyan">容错 {Math.max(0, g.tolerance - failures)} / {g.tolerance}</span>
      </div>

      {/* 战斗舞台 */}
      <div className={'boss-arena phase-' + phaseIndex + (locked ? ' locked' : '') + (countered ? ' is-counter' : '')}>
        <div className="arena-grid">
          <BossAvatar
            phase={phaseIndex}
            hpPct={pct}
            hitKey={hitKey}
            broken={broken}
            defeated={alreadyCleared && pct <= 0}
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
        {locked && <div className="arena-lock">紧急事件进行中——战斗已暂停</div>}
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
            <div className="panel-title">MIRA 提示<span className="panel-tag">LEVEL {hintLevel}</span></div>
            <div style={{ fontSize: 13, color: '#BFD8E8', lineHeight: 1.75 }}>{hint}</div>
            <button className="nxbtn small ghost" style={{ marginTop: 8 }} disabled={hintLevel >= phase.hints.length} onClick={() => { play('click'); setHintLevel(h => Math.min(h + 1, phase.hints.length)); }}>
              下一条提示
            </button>
          </div>
        </div>

        {/* 中：代码 */}
        <div className="chlg-center">
          <div className="toolbar">
            <button className="nxbtn" disabled={running || submitting || locked} onClick={run}>
              {running ? <span className="spinner" /> : '▶'} 运行代码
            </button>
            <button className="nxbtn primary" disabled={running || submitting || locked || alreadyCleared} onClick={submit}>
              提交攻击 ⏎
            </button>
            <button className="nxbtn ghost" disabled={running || submitting || locked} onClick={resetCode}>重置代码</button>
            <div className="sp" />
            <span className="chip">判题通过才掉血</span>
          </div>
          <div className="code-frame" style={{ flex: 1 }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              errorLine={errorLine}
              onRun={run}
              readOnly={running || submitting || alreadyCleared}
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

      {/* 胜利结算 */}
      {cleared && (
        <div className="overlay" style={{ background: 'rgba(10,4,20,0.78)', backdropFilter: 'blur(6px)' }}>
          <div className="complete-panel boss-complete">
            <div className="cp-ico" style={{ color: '#C9A7FF' }}>⚡</div>
            <div className="cp-title">{opp} 已击破</div>
            <div className="cp-sub">{boss.codename} · {boss.title}</div>
            <div className="cp-rewards">
              <div className="cp-reward"><div className="rv">+{cleared.expGained}</div><div className="rl">经验</div></div>
              <div className="cp-reward"><div className="rv">{fragDef ? fragDef.title : '碎片'}</div><div className="rl">创世主碎片</div></div>
              <div className="cp-reward"><div className="rv">Lv.{cleared.newLevel}</div><div className="rl">等级</div></div>
            </div>
            {fragDef && (
              <div className="cp-summary">
                <div className="cs-label">获得碎片《{fragDef.title}》</div>
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
                    <div className="cs-cell"><div className="k">碎片</div><div className="v cyan">{fragDef ? fragDef.title : '—'}</div></div>
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
                  {unmastered.length > 0 && (
                    <div className="vd-actions" style={{ marginTop: 8 }}>
                      <button className="nxbtn small" onClick={() => { play('click'); g.nav('lab'); }}>前往编程实验室做补充练习 ▸</button>
                    </div>
                  )}
                  {sett.unlocks.length > 0 && <div className="cs-unlocks">新解锁：{sett.unlocks.join('、')}</div>}
                </div>
              );
            })()}
            <div className="cp-btns">
              {scenes.outro && (
                <button className="nxbtn ghost" onClick={() => { play('click'); setOutroOpen(true); }}>重看本章结尾</button>
              )}
              <button className="nxbtn primary" onClick={() => { play('click'); g.setCurrentBoss(null); g.nav('map'); }}>返回地图</button>
            </div>
          </div>
        </div>
      )}

      {/* 战后演出 */}
      {gain && (
        <FragmentGain
          def={gain}
          onDone={() => { setGain(null); if (scenes.outro) setOutroOpen(true); }}
        />
      )}

      {outroOpen && scenes.outro && (
        <CinematicStage
          scenes={scenes.outro}
          eventId={'boss-' + boss.id}
          frameTitle={opp + ' · 击破之后'}
          onDone={() => setOutroOpen(false)}
        />
      )}
    </div>
  );
}
