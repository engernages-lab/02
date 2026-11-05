import { useCallback, useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import Terminal, { type TermLine } from '../components/Terminal';
import PlayerStatus from '../components/PlayerStatus';
import DialogSystem from '../components/DialogSystem';
import CinematicStage from '../components/CinematicStage';
import { useGame } from '../store/gameStore';
import { bossById } from '../game/bosses';
import { knowledgeById } from '../game/knowledge';
import { MEMORY_FRAGMENTS } from '../game/story';
import { fragmentById, fragmentForCollected, type CreatorFragmentDef } from '../game/lore/fragments';
import FragmentGain from '../components/FragmentGain';
import { bossScenesFor } from '../game/lore/bossScenes';
import { buildHarness, checkUserCode, combineWithHarness, filterMarkerLines, judgeRun, type JudgeVerdict } from '../services/judge';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { play } from '../services/sound';

export default function BossChallengePage() {
  const g = useGame();
  const boss = bossById(g.player.progress.currentBossId || '');
  const player = g.player;

  const [code, setCode] = useState(boss?.initialCode ?? '');
  const [term, setTerm] = useState<TermLine[]>([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [outroOpen, setOutroOpen] = useState(false);
  const [cleared, setCleared] = useState<{ fragmentId: string; expGained: number; levelUp: boolean; newLevel: number } | null>(null);
  const [gain, setGain] = useState<CreatorFragmentDef | null>(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [pyState, setPyState] = useState<PyState>({ status: 'idle', phase: '' });
  const [errorLine, setErrorLine] = useState<number | null>(null);

  useEffect(() => {
    const un = onPyStatus(s => setPyState(s));
    warmUp();
    return un;
  }, []);

  useEffect(() => {
    if (!boss) { g.nav('map'); return; }
    setCode(boss.initialCode);
    setTerm([]);
    setVerdict(null);
    setCleared(null);
    setErrorLine(null);
    setHintLevel(1);
    const seenKey = 'bossIntro_' + boss.id;
    setIntroOpen(!player.progress.storySeen[seenKey]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss?.id]);

  const pushLines = useCallback((lines: TermLine[]) => setTerm(t => [...t.slice(-200), ...lines]), []);

  if (!boss) return null;

  const opp = boss.opponentName || 'ECHO';
  const bossScenes = bossScenesFor(boss.id);

  const run = async () => {
    if (running || submitting) return;
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([{ kind: 'cmd', text: 'python echo.py' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
      play('deny');
      return;
    }
    setRunning(true);
    setVerdict(null);
    setErrorLine(null);
    pushLines([{ kind: 'cmd', text: 'python echo.py' }, { kind: 'sys', text: '正在与 ECHO 的镜像比对……' }]);
    play('run');
    const r = await runPython(code, { timeoutMs: 5000 });
    setRunning(false);
    const stdout = filterMarkerLines(r.stdout || '');
    if (r.timedOut) {
      pushLines([{ kind: 'err', text: '执行超时：ECHO 的镜像循环吞掉了你的进程。' }]);
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

  const submit = async () => {
    if (running || submitting || cleared) return;
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([{ kind: 'cmd', text: 'python echo.py --challenge' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
      play('deny');
      return;
    }
    setSubmitting(true);
    setVerdict(null);
    setErrorLine(null);
    play('run');
    pushLines([{ kind: 'cmd', text: 'python echo.py --challenge （章节测试）' }]);
    // Boss 判题：python 检查需要 harness（复用 judge 的 buildHarness 逻辑已在 judgeRun 内基于 stdout/marker）
    const combined = boss.judge.judgeKind === 'python'
      ? combineWithHarness(code, buildHarness(boss.judge.pythonChecks || []))
      : code;
    const r = await runPython(combined, { timeoutMs: 5000 });
    setSubmitting(false);
    if (r.timedOut) {
      pushLines([{ kind: 'err', text: '挑战超时：ECHO 拒绝了这个答案。' }]);
      setVerdict({ passed: false, checks: [], timedOut: true });
      play('error');
      return;
    }
    if (!r.ok) {
      pushLines([
        ...(filterMarkerLines(r.stdout || '').trim() ? [{ kind: 'out' as const, text: filterMarkerLines(r.stdout).replace(/\n$/, '') }] : []),
        { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
      ]);
      setVerdict({ passed: false, checks: [], error: r.error });
      play('error');
      return;
    }
    const v = judgeRun(boss.judge, r);
    if (v.passed) {
      const res = g.completeBoss(boss.id);
      setVerdict({ passed: true, checks: v.checks });
      if (res) {
        setCleared(res);
        const fd = fragmentForCollected(res.fragmentId);
        if (fd) setGain(fd);
        pushLines([
          { kind: 'sys', text: '── ' + opp + ' 核心逻辑修复 ──' },
          ...v.checks.map(c => ({ kind: 'ok' as const, text: '✓ ' + c.name })),
          { kind: 'ok', text: '⚡ ' + opp + ' 已被击破！' },
        ]);
        play('levelup');
        if (bossScenes.outro) setOutroOpen(true);
      }
    } else {
      pushLines([
        { kind: 'sys', text: '── 章节测试未通过 ──' },
        ...v.checks.map(c => ({ kind: (c.ok ? 'ok' : 'err') as TermLine['kind'], text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' —— ' + c.detail : '') })),
        { kind: 'err', text: opp + ' 还在运行。再试一次。' },
      ]);
      setVerdict(v);
      play('error');
    }
  };

  const hint = boss.hints[Math.min(hintLevel - 1, boss.hints.length - 1)];
  const fragDef = fragmentById(boss.fragmentId);
  const legacyFrag = MEMORY_FRAGMENTS.find(f => f.id === boss.fragmentId);
  const fragTitle = fragDef?.title || legacyFrag?.title || '记忆碎片';
  const fragContent = fragDef?.content || legacyFrag?.content || '';
  const knowledgeCards = boss.knowledge.map(knowledgeById).filter(Boolean);

  return (
    <div className="page page-anim boss-page" style={{ padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" disabled={running || submitting} onClick={() => { play('click'); g.nav('map'); }}>◀ 服务器地图</button>
        <div>
          <div className="hud-title" style={{ color: '#C9A7FF' }}>⚡ {boss.title}</div>
          <div className="hud-sub">章节 Boss · 第 {boss.chapter} 章 · {boss.codename}</div>
        </div>
        <div className="hud-spacer" />
        <div className={'py-status ' + pyState.status} title={pyState.phase}>
          <span className="pd" />
          {pyState.status === 'ready' ? 'PY ENGINE READY' : pyState.status === 'loading' ? '引擎加载中…' : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'}
        </div>
        <span className="hud-chip">意识 {player.consciousness}%</span>
      </div>

      <div className="chlg-grid" style={{ flex: 1, minHeight: 0 }}>
        <div className="chlg-left" style={{ overflowY: 'auto' }}>
          <div className="panel task-block boss-block">
            <div className="panel-title">章节 Boss 战<span className="panel-tag">{boss.codename}</span></div>
            <div className="tb-item">
              <div className="tb-label">{opp} 的破绽</div>
              <div className="tb-text">{boss.fault}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">挑战目标</div>
              <div className="tb-text">{boss.goal}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">正确行为</div>
              <div className="tb-text warn">{boss.behavior}</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">本章知识点整合</div>
            <div>
              {knowledgeCards.map(k => <span key={k!.id} className="chip cyan know-chip">{k!.title}</span>)}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">MIRA 提示<span className="panel-tag">LEVEL {hintLevel}</span></div>
            <div style={{ fontSize: 13, color: '#BFD8E8', lineHeight: 1.75 }}>{hint}</div>
            <button className="nxbtn small ghost" style={{ marginTop: 8 }} disabled={hintLevel >= boss.hints.length} onClick={() => { play('click'); setHintLevel(h => Math.min(h + 1, boss.hints.length)); }}>
              下一条提示
            </button>
          </div>
        </div>

        <div className="chlg-center">
          <div className="toolbar">
            <button className="nxbtn" disabled={running || submitting} onClick={run}>
              {running ? <span className="spinner" /> : '▶'} 运行代码
            </button>
            <button className="nxbtn primary" disabled={running || submitting || !!cleared} onClick={submit}>
              挑战 {opp} ⏎
            </button>
            <div className="sp" />
            <span className="chip">章节测试 · 不消耗容错</span>
          </div>
          <div className="code-frame" style={{ flex: 1 }}>
            <CodeEditor value={code} onChange={setCode} errorLine={errorLine} onRun={run} readOnly={running || submitting} fontSize={15} />
          </div>
          {verdict && (
            <div className={'result-banner ' + (verdict.passed ? 'ok' : 'fail')}>
              {verdict.passed ? '⚡ ECHO 分支已被击破' : verdict.timedOut ? '✗ 挑战超时' : verdict.error ? '✗ 执行出错：' + verdict.error.type : '✗ 章节测试未通过'}
            </div>
          )}
        </div>

        <div className="chlg-right" style={{ overflowY: 'auto' }}>
          <div className="panel boss-echo-panel">
            <div className="panel-title">{opp}<span className="panel-tag">{boss.title}</span></div>
            <div style={{ fontSize: 13, color: '#C9A7FF', lineHeight: 1.8 }}>
              「{cleared ? '……原来，我一直在等一个能修好我的人。' : '你能修好别人，也能修好自己吗？'}」
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">生命体征</div>
            <PlayerStatus showTolerance />
          </div>
          <div className="panel">
            <div className="panel-title">掉落</div>
            <div style={{ fontSize: 12.5, color: '#BFD8E8', lineHeight: 1.8 }}>
              · 经验 +{boss.rewardExp}<br />
              · 创世主碎片：{fragTitle}<br />
              · 章节后续剧情
            </div>
          </div>
        </div>
      </div>

      <div className="chlg-bottom">
        <Terminal lines={term} maxHeight={190} title={opp + ' 对抗终端 · ' + boss.codename} />
      </div>

      {introOpen && bossScenes.intro && (
        <CinematicStage
          scenes={bossScenes.intro}
          eventId={'boss-' + boss.id}
          frameTitle={opp + ' · 遭遇'}
          onDone={() => { setIntroOpen(false); g.markStory('bossIntro_' + boss.id); }}
        />
      )}
      {introOpen && !bossScenes.intro && boss.intro && (
        <DialogSystem
          nodes={boss.intro}
          speedMs={player.settings.typewriterMs}
          animEnabled={player.settings.animations}
          eventId={'boss-' + boss.id}
          frameTitle={'ECHO 分支 · ' + boss.codename}
          onSeen={id => g.markStory(id)}
          onDone={() => { setIntroOpen(false); g.markStory('bossIntro_' + boss.id); }}
        />
      )}

      {gain && <FragmentGain def={gain} onDone={() => setGain(null)} />}

      {cleared && (
        <div className="overlay" style={{ background: 'rgba(10,4,20,0.78)', backdropFilter: 'blur(6px)' }}>
          <div className="complete-panel boss-complete">
            <div className="cp-ico" style={{ color: '#C9A7FF' }}>⚡</div>
            <div className="cp-title">{opp} 已击破</div>
            <div className="cp-sub">{boss.codename} · {boss.title}</div>
            <div className="cp-rewards">
              <div className="cp-reward"><div className="rv">+{cleared.expGained}</div><div className="rl">经验</div></div>
              <div className="cp-reward"><div className="rv">{fragTitle}</div><div className="rl">创世主碎片</div></div>
              <div className="cp-reward"><div className="rv">Lv.{cleared.newLevel}</div><div className="rl">等级</div></div>
            </div>
            {fragContent && (
              <div className="cp-summary">
                <div className="cs-label">获得碎片《{fragTitle}》</div>
                {fragContent}
              </div>
            )}
            <div className="cp-btns">
              {!bossScenes.outro && boss.echoStory && (
                <button className="nxbtn ghost" onClick={() => { play('click'); setEchoOpen(true); }}>查看后续剧情</button>
              )}
              {bossScenes.outro && (
                <button className="nxbtn ghost" onClick={() => { play('click'); setOutroOpen(true); }}>重看本章结尾</button>
              )}
              <button className="nxbtn primary" onClick={() => { play('click'); g.setCurrentBoss(null); g.nav('map'); }}>返回地图</button>
            </div>
          </div>
        </div>
      )}

      {echoOpen && boss.echoStory && (
        <DialogSystem
          nodes={boss.echoStory}
          speedMs={player.settings.typewriterMs}
          animEnabled={player.settings.animations}
          frameTitle="ECHO 来源 · 残片"
          onSeen={id => g.markStory(id)}
          onDone={() => { setEchoOpen(false); }}
        />
      )}

      {outroOpen && bossScenes.outro && (
        <CinematicStage
          scenes={bossScenes.outro}
          eventId={'boss-' + boss.id}
          frameTitle={opp + ' · 击破之后'}
          onDone={() => setOutroOpen(false)}
        />
      )}
    </div>
  );
}
