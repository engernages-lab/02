import { useCallback, useEffect, useMemo, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import Terminal, { type TermLine } from '../components/Terminal';
import MiraPanel from '../components/MiraPanel';
import PlayerStatus from '../components/PlayerStatus';
import DialogSystem from '../components/DialogSystem';
import { useGame, type CompletePayload } from '../store/gameStore';
import { levelById, levelsOfServer, serverById, type LevelDef } from '../game/levels';
import { buildHarness, checkUserCode, combineWithHarness, filterMarkerLines, judgeRun, parseMarker, type JudgeCheck, type JudgeVerdict, type ParsedError } from '../services/judge';
import { miraLevelHint, miraOnError, miraOnFail, miraOnRespawn } from '../services/ai';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { knowledgeById } from '../game/knowledge';
import { achievementById } from '../game/achievements';
import { play, isMusicOn } from '../services/sound';

export default function ChallengePage() {
  const g = useGame();
  const levelId = g.player.progress.currentLevelId;
  const level = levelId ? levelById(levelId) : undefined;
  const player = g.player;
  const respawnTick = g.respawnTick;

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

  const locked = g.event.kind !== 'none';

  useEffect(() => {
    if (!level) { g.nav('map'); return; }
    setCode(level.initialCode);
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

  const run = async () => {
    if (!level || running || submitting || locked) return;
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
    setRunning(true);
    setVerdict(null);
    setErrorLine(null);
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
        setMiraTag('排错助手');
        setMiraMsg('终端报错了。' + miraOnError(r.error.type));
      }
    } else {
      pushLines(outputLines(r));
    }
  };

  const submit = async () => {
    if (!level || running || submitting || locked) return;
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
    setSubmitting(true);
    setVerdict(null);
    setErrorLine(null);
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
      setMiraTag('系统警告');
      setMiraMsg('判题超时。提交已计为一次失败——检查代码里是否有死循环。');
      g.recordFail(level.id);
      play('error');
      return;
    }
    if (!r.ok) {
      pushLines(outputLines(r));
      const errLine = r.error && r.error.line && r.error.line <= codeLines ? r.error.line : null;
      setErrorLine(errLine);
      setVerdict({ passed: false, checks: [], error: r.error });
      setMiraTag('排错助手');
      setMiraMsg('程序没能通过判题（执行出错）。' + miraOnError(r.error?.type));
      // 执行错误同样计入失败提交
      const fp = g.recordFail(level.id);
      if (!fp.triggered) {
        const m = miraOnFail(fp.n, fp.tolerance);
        setMiraTag(m.tone === 'danger' ? '系统警告' : 'MIRA');
        setMiraMsg(String(m.text));
        if (m.tone === 'danger') play('warning');
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
      setMiraTag('判题反馈');
      const fp = g.recordFail(level.id);
      if (fp.triggered) {
        setMiraTag('紧急警告');
        setMiraMsg('纠错者已锁定你的数据坐标！执行紧急防御协议！');
        play('alarm');
      } else {
        const m = miraOnFail(fp.n, fp.tolerance);
        setMiraTag(m.tone === 'danger' ? '系统警告' : 'MIRA');
        setMiraMsg(String(m.text));
        if (m.tone === 'danger') play('warning');
        else play('error');
      }
    }
  };

  const askHint = () => {
    if (!level) return;
    const used = player.progress.hintLevels[level.id] || 0;
    const r = miraLevelHint(level, used);
    setMiraTag('提示 LEVEL ' + r.level);
    setMiraMsg(r.text);
    g.hintUsed(level.id);
    play('click');
  };

  const resetCode = () => {
    if (resetArmed) {
      setCode(level.initialCode);
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
  const stars = player.progress.stars[level.id] || 0;
  const server = serverById(level.serverId);
  const knowledgeCards = level.knowledge.map(knowledgeById).filter(Boolean);

  return (
    <div className="page page-anim" style={{ padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
        <span className="hud-chip cyan">容错 {g.tolerance}</span>
        <span className="hud-chip">意识 {player.consciousness}%</span>
        <button className="nxbtn small ghost" onClick={() => { g.toggleMusic(); setMusicOn(isMusicOn()); }}>
          {musicOn ? '♪ 音乐开' : '♪ 音乐关'}
        </button>
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
            <div className="sp" />
            <span className="chip">运行不增加失败次数</span>
            {locked && <span className="chip red warn-flash">紧急事件进行中——主线提交已锁定</span>}
          </div>
          <div className="code-frame" style={{ flex: 1 }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              errorLine={errorLine}
              debugLine={debugLine}
              onRun={run}
              readOnly={running || submitting}
              fontSize={player.settings.animLevel === 'low' ? 15 : 15.5}
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
        <div className="overlay" style={{ background: 'rgba(3,10,16,0.72)', backdropFilter: 'blur(5px)' }}>
          <div className="complete-panel">
            <div className="cp-ico">✓</div>
            <div className="cp-title">修复成功</div>
            <div className="cp-sub">{level.codename} · {level.title} 已恢复运行</div>
            <div className="star-row">
              {[1, 2, 3].map(i => <span key={i} className={'star' + (i <= done.payload.stars ? ' on' : '')} style={{ animationDelay: (0.15 * i) + 's' }}>★</span>)}
            </div>
            <div className="cp-rewards">
              <div className="cp-reward"><div className="rv">+{done.payload.expGained}</div><div className="rl">经验</div></div>
              <div className="cp-reward"><div className="rv">Lv.{done.payload.newLevel}</div><div className="rl">等级</div></div>
              <div className="cp-reward"><div className="rv">{level.knowledge.length}</div><div className="rl">知识卡片</div></div>
            </div>
            {done.payload.levelUp && (
              <div className="result-banner ok" style={{ marginBottom: 10 }}>
                ⬆ 等级提升！Lv.{done.payload.oldLevel} → Lv.{done.payload.newLevel} 容错次数 +{g.tolerance - Math.min(g.tolerance, 3) < 0 ? 0 : 0}（当前 {g.tolerance}）
              </div>
            )}
            {!done.payload.firstTime && <div className="dim" style={{ fontSize: 12.5, marginBottom: 8 }}>已通关关卡，不重复发放经验。</div>}
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
