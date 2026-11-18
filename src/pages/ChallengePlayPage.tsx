import { useCallback, useEffect, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import Terminal, { type TermLine } from '../components/Terminal';
import { useGame } from '../store/gameStore';
import { independentChallengeById } from '../game/challengeTemplates';
import { CHALLENGE_TYPE_LABEL } from '../game/challengeTypes';
import { DIFFICULTY_PRESETS } from '../game/challengeRules';
import {
  canRun, canSubmit, canHint, remainingRuns, remainingSubmits, remainingHints,
  remainingMs, allStagesDone,
} from '../game/challengeEngine';
import { formatDuration } from '../game/challengeSession';
import { checkUserCode, filterMarkerLines } from '../services/judge';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { draftNamespace, readDraft, writeDraft } from '../services/drafts';
import { play } from '../services/sound';

const fmtLimit = (v: number | null) => (v == null ? '∞' : String(v));

export default function ChallengePlayPage() {
  const g = useGame();
  const gRef = useRef(g);
  gRef.current = g;

  const id = g.currentChallengeId;
  const def = id ? independentChallengeById(id) : undefined;
  const ns = draftNamespace(g.player);
  const draftId = id ? 'ch:' + id : '';

  const [code, setCode] = useState(() => (def ? def.initialCode : ''));
  const [term, setTerm] = useState<TermLine[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [hidden, setHidden] = useState<{ passed: number; total: number } | null>(null);
  const [pyState, setPyState] = useState<PyState>({ status: 'idle', phase: '' });
  const [now, setNow] = useState(Date.now());

  const run = id ? (g.player.progress.challengeRuns?.[id] || null) : null;

  useEffect(() => {
    const un = onPyStatus(s => setPyState(s));
    warmUp();
    return un;
  }, []);

  // 切题：载入草稿 / 初始代码
  useEffect(() => {
    if (!id || !def) return;
    const entry = readDraft(ns, 'ch:' + id);
    setCode(entry?.code ?? def.initialCode);
    setTerm([]);
    setResult(null);
    setHidden(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 草稿自动保存（500ms 防抖）
  useEffect(() => {
    if (!id) return;
    const t = window.setTimeout(() => { writeDraft(ns, 'ch:' + id, code); }, 500);
    return () => window.clearTimeout(t);
  }, [code, id, ns]);

  // 限时倒计时：到期即一次性结算失败
  useEffect(() => {
    if (!run || run.status !== 'active' || run.deadlineAt == null) return;
    const tick = () => {
      setNow(Date.now());
      if (run.deadlineAt != null && Date.now() >= run.deadlineAt) gRef.current.timeoutChallenge(id as string);
    };
    tick();
    const t = window.setInterval(tick, 400);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.status, run?.deadlineAt, id]);

  const pushLines = useCallback((lines: TermLine[]) => {
    setTerm(t => [...t.slice(-160), ...lines]);
  }, []);

  if (!id || !def) {
    return (
      <div className="page page-anim" style={{ padding: 24 }}>
        <div className="panel">
          <div className="panel-title">未选择挑战</div>
          <div className="dim" style={{ marginBottom: 12 }}>请先在挑战列表中选择一个挑战。</div>
          <button className="nxbtn primary" onClick={() => { play('click'); g.nav('challengehub'); }}>返回挑战列表</button>
        </div>
      </div>
    );
  }

  const terminalRun = !run || run.status !== 'active';
  const remMs = run ? remainingMs(run, now) : null;
  const stages = run?.stages || [];
  const bugs = run?.bugs || [];
  const hiddenTests = run?.hiddenTests || [];
  const remRuns = run ? remainingRuns(run) : def.rules.maxRuns;
  const remSubs = run ? remainingSubmits(run) : def.rules.maxSubmits;
  const remHints = run ? remainingHints(run) : def.rules.maxHints;
  const canDoRun = !!run && canRun(run);
  const canDoSubmit = !!run && canSubmit(run);
  const canDoHint = !!run && canHint(run);
  const stagesDone = !!run && allStagesDone(run);

  const doRun = async () => {
    if (running || !run) return;
    if (!canRun(run)) { pushLines([{ kind: 'err', text: '运行次数已用尽，只能提交或重新进入挑战。' }]); play('deny'); return; }
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([{ kind: 'cmd', text: 'python challenge.py' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
      setResult({ ok: false, msg: '代码被安全策略拦截。' + ck.reason });
      play('deny');
      return;
    }
    if (!g.recordChallengeRun(id)) { pushLines([{ kind: 'err', text: '运行次数已用尽。' }]); return; }
    setRunning(true);
    setResult(null);
    pushLines([{ kind: 'cmd', text: 'python challenge.py（诊断运行）' }]);
    if (pyState.status !== 'ready') pushLines([{ kind: 'sys', text: 'Python 引擎初始化中，代码已排队，就绪后自动执行。' }]);
    play('run');
    const r = await runPython(code, { timeoutMs: 5000, debug: true });
    setRunning(false);
    const stdout = filterMarkerLines(r.stdout || '');
    if (r.timedOut) {
      pushLines([{ kind: 'err', text: '执行超时：程序运行超过安全时限，已被终止。' }]);
      setResult({ ok: false, msg: '运行超时（可能是死循环）。' });
      play('error');
      return;
    }
    if (!r.ok) {
      pushLines([
        ...(stdout.trim() ? [{ kind: 'out' as const, text: stdout.replace(/\n$/, '') }] : []),
        { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' },
      ]);
      setResult({ ok: false, msg: '程序执行出错：' + (r.error ? r.error.type : '未知错误') + '。修正后重试。' });
      play('error');
      return;
    }
    pushLines([
      { kind: 'sys', text: '进程正常退出（exit 0）—— 这只代表能运行，不等于通过，请点击「提交」进行正式判题。' },
      ...(stdout.trim() ? [{ kind: 'out' as const, text: stdout.replace(/\n$/, '') }] : [{ kind: 'muted' as const, text: '(程序没有输出)' }]),
    ]);
    setResult({ ok: true, msg: '运行成功（诊断）。提交后才会进行真实判题。' });
    play('success');
  };

  const doSubmit = async () => {
    if (running || !run) return;
    if (!canSubmit(run)) { pushLines([{ kind: 'err', text: '提交次数已用尽。' }]); play('deny'); return; }
    setRunning(true);
    setResult(null);
    pushLines([{ kind: 'cmd', text: 'submit —— 正式判题' }]);
    play('run');
    const res = await gRef.current.submitChallenge(id, code);
    setRunning(false);

    if (res.status === 'blocked') {
      pushLines([{ kind: 'err', text: res.reason || '提交被阻止' }]);
      setResult({ ok: false, msg: res.reason || '提交被阻止' });
      play('deny');
      return;
    }
    const checks = res.verdict?.checks || [];
    if (checks.length) {
      pushLines(checks.map(c => ({ kind: (c.ok ? 'out' : 'err') as 'out' | 'err', text: (c.ok ? '✓ ' : '✗ ') + c.name + (c.detail ? ' — ' + c.detail : '') })));
    }
    if (res.status === 'timeout') {
      pushLines([{ kind: 'err', text: '判题执行超时。' }]);
      setResult({ ok: false, msg: '执行超时。' });
      play('error');
      return;
    }
    if (res.hiddenTotal && res.hiddenTotal > 0) {
      const hp = res.hiddenPassed || 0;
      pushLines([{ kind: 'sys', text: '隐藏用例：' + hp + ' / ' + res.hiddenTotal + ' 通过（内容不公开）' }]);
      setHidden({ passed: hp, total: res.hiddenTotal });
    }
    if (res.status === 'pass') {
      if (res.expGained != null) writeDraft(ns, 'ch:' + id, code, { passed: true });
      const extra = res.settlement ? '（用时 ' + formatDuration(res.settlement.durationMs) + '）' : '';
      setResult({ ok: true, msg: '✓ 挑战完成！+' + (res.expGained || 0) + ' 经验 / +' + (res.creditsGained || 0) + ' 贡献点 ' + extra });
      play('success');
    } else {
      const reason = res.status === 'error' ? '程序执行出错' : '判题未通过';
      setResult({ ok: false, msg: reason + '。' + (res.reason || '检查输出与边界条件后重试。') });
      play('error');
    }
  };

  const restart = () => {
    play('click');
    g.setCurrentChallenge(id);
    const fresh = g.enterChallenge(id);
    if (fresh) { setResult(null); setHidden(null); setTerm([]); setCode(readDraft(ns, 'ch:' + id)?.code ?? def.initialCode); }
    g.nav('challengeplay');
  };

  const abandon = () => {
    play('deny');
    g.cancelChallenge(id);
    g.setCurrentChallenge(null);
    g.nav('challengehub');
  };

  return (
    <div className="page page-anim" style={{ padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" onClick={() => { play('click'); g.setCurrentChallenge(null); g.nav('challengehub'); }}>◀ 挑战列表</button>
        <div>
          <div className="hud-title">{def.title}</div>
          <div className="hud-sub">{CHALLENGE_TYPE_LABEL[def.type]} · {DIFFICULTY_PRESETS[def.difficulty].label} · 奖励系数 ×{def.rules.rewardMultiplier}</div>
        </div>
        <div className="hud-spacer" />
        <span className="hud-chip" style={{ color: run?.status === 'completed' ? '#5BD6A0' : run?.status === 'failed' ? '#FF5B64' : '#F3B75C' }}>
          状态：{run ? ({ active: '进行中', paused: '已暂停', completed: '已完成', failed: '已失败', cancelled: '已取消', pending: '待开始' }[run.status] || run.status) : '未开始'}
        </span>
        <div className={'py-status ' + pyState.status} title={pyState.phase}>
          <span className="pd" />
          {pyState.status === 'ready' ? 'PY READY' : pyState.status === 'loading' ? '加载中…' : pyState.status === 'error' ? '引擎错误' : 'STANDBY'}
        </div>
      </div>

      <div className="chlg-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* 左：任务 + 规则 + 进度 */}
        <div className="chlg-left" style={{ overflowY: 'auto' }}>
          <div className="panel task-block">
            <div className="panel-title">挑战目标<span className="panel-tag">{def.id}</span></div>
            <div className="tb-item"><div className="tb-label">故障</div><div className="tb-text dim">{def.fault}</div></div>
            <div className="tb-item"><div className="tb-label">目标</div><div className="tb-text warn">{def.goal}</div></div>
            <div className="tb-item">
              <div className="tb-label">规则</div>
              <div className="tb-text dim" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
                · 时限：{def.rules.timeLimitSec == null ? '不限时' : def.rules.timeLimitSec + ' 秒'}<br />
                · 运行：剩余 {fmtLimit(remRuns)} 次（上限 {fmtLimit(def.rules.maxRuns)}）<br />
                · 提交：剩余 {fmtLimit(remSubs)} 次（上限 {fmtLimit(def.rules.maxSubmits)}）<br />
                · 提示：剩余 {fmtLimit(remHints)} 次（上限 {fmtLimit(def.rules.maxHints)}）
              </div>
            </div>
          </div>

          {stages.length > 0 && (
            <div className="panel">
              <div className="panel-title">阶段进度<span className="panel-tag">{stagesDone ? 'DONE' : 'IN PROGRESS'}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stages.map((s, i) => (
                  <div key={s.id} style={{ fontSize: 12.5, color: s.done ? '#5BD6A0' : i === (run?.stageIndex ?? 0) ? '#F3B75C' : '#8FA6B2' }}>
                    {s.done ? '✓' : i === (run?.stageIndex ?? 0) ? '▶' : '·'} {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bugs.length > 0 && (
            <div className="panel">
              <div className="panel-title">连锁 Bug</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {bugs.map(b => (
                  <div key={b.id} style={{ fontSize: 12.5, color: b.fixed ? '#5BD6A0' : '#FF9A5B' }}>
                    {b.fixed ? '✓ 已修复' : '✗ 待修复'} · {b.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hiddenTests.length > 0 && (
            <div className="panel">
              <div className="panel-title">隐藏用例</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hiddenTests.map(h => (
                  <div key={h.id} style={{ fontSize: 12.5, color: h.passed === true ? '#5BD6A0' : h.passed === false ? '#FF5B64' : '#8FA6B2' }}>
                    {h.passed === true ? '✓ 通过' : h.passed === false ? '✗ 未通过' : '？ 未执行'} · {h.label}
                  </div>
                ))}
              </div>
              <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>隐藏用例的判定表达式不会公开，只显示是否通过。</div>
            </div>
          )}

          <div className="panel">
            <div className="panel-title">操作</div>
            <div className="row">
              <button className="nxbtn small danger" disabled={terminalRun} onClick={abandon}>放弃并返回</button>
            </div>
          </div>
        </div>

        {/* 中：编辑器 */}
        <div className="chlg-center">
          <div className="toolbar">
            <button className="nxbtn" disabled={running || !canDoRun} onClick={doRun}>
              {running ? <span className="spinner" /> : '▶'} 运行代码
            </button>
            <button className="nxbtn primary" disabled={running || !canDoSubmit} onClick={doSubmit}>
              {running ? <span className="spinner" /> : '⏎'} 提交判题
            </button>
            <div className="sp" />
            {remMs != null && <span className="chip" style={{ color: remMs < 15000 ? '#FF5B64' : '#42D6D0' }}>剩余 {formatDuration(remMs)}</span>}
            <span className="chip">运行剩余 {fmtLimit(remRuns)} · 提交剩余 {fmtLimit(remSubs)}</span>
          </div>
          <div className="code-frame" style={{ flex: 1 }}>
            <CodeEditor value={code} onChange={setCode} onRun={doRun} readOnly={running} fontSize={15} />
          </div>
          {result && (
            <div className={'result-banner ' + (result.ok ? 'ok' : 'fail')}>
              {result.msg}
              {hidden && <span className="dim" style={{ marginLeft: 10, fontSize: 12 }}>（隐藏用例 {hidden.passed}/{hidden.total}）</span>}
            </div>
          )}
          {terminalRun && (
            <div className="result-banner fail" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>本局挑战已结束（{run?.status === 'completed' ? '已完成' : run?.status === 'failed' ? '已失败' : '已取消'}）。</span>
              <button className="nxbtn small primary" onClick={restart}>再挑战一次</button>
              <button className="nxbtn small ghost" onClick={() => { play('click'); g.setCurrentChallenge(null); g.nav('challengehub'); }}>返回列表</button>
            </div>
          )}
        </div>

        {/* 右：状态 */}
        <div className="chlg-right" style={{ overflowY: 'auto' }}>
          <div className="panel">
            <div className="panel-title">运行状态<span className="panel-tag">{run?.status?.toUpperCase() || 'NONE'}</span></div>
            {run ? (
              <div style={{ fontSize: 12.5, lineHeight: 1.9 }}>
                <div>已运行：{run.runsUsed} 次</div>
                <div>已提交：{run.submitsUsed} 次</div>
                <div>已用提示：{run.hintsUsed} 次</div>
                {run.deadlineAt != null && <div>剩余时间：{formatDuration(Math.max(0, remMs ?? 0))}</div>}
              </div>
            ) : <div className="dim" style={{ fontSize: 12.5 }}>无进行中的运行。</div>}
          </div>
          <div className="panel">
            <div className="panel-title">提示</div>
            <div className="dim" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
              · 「运行」只做诊断，不判定通过；正式结果以「提交」为准。<br />
              · 判题、隐藏用例均由真实 Python 执行，界面无法伪造结果。<br />
              · 提交次数耗尽或超时即为失败；可返回列表重新开始。
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="nxbtn small ghost" disabled={!canDoHint || running} onClick={() => {
                if (!canDoHint) return;
                if (g.recordChallengeHint(id)) {
                  pushLines([{ kind: 'sys', text: '提示：修复后先在「运行」里确认输出，再进行提交；注意边界用例与阶段要求。' }]);
                  play('click');
                }
              }}>获取提示（剩余 {fmtLimit(remHints)}）</button>
            </div>
          </div>
        </div>
      </div>

      <div className="chlg-bottom">
        <Terminal lines={term} maxHeight={170} title={'挑战终端 · ' + def.title} />
      </div>
    </div>
  );
}
