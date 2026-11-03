import { useCallback, useEffect, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import Terminal, { type TermLine } from '../components/Terminal';
import { useGame } from '../store/gameStore';
import { LAB_MISSIONS, labMissionById } from '../game/playground';
import { checkUserCode, filterMarkerLines } from '../services/judge';
import { runPython, onPyStatus, warmUp, type PyState } from '../services/pythonRunner';
import { play } from '../services/sound';

const DRAFT_PREFIX = 'nexus_lab_draft_';

export default function LabPage() {
  const g = useGame();
  const [missionId, setMissionId] = useState<string>(() => {
    const saved = (() => { try { return localStorage.getItem('nexus_lab_last'); } catch { return null; } })();
    return saved && labMissionById(saved) ? saved : LAB_MISSIONS[0].id;
  });
  const mission = labMissionById(missionId) || LAB_MISSIONS[0];

  const [code, setCode] = useState<string>(() => {
    try { return localStorage.getItem(DRAFT_PREFIX + missionId) ?? mission.initialCode; } catch { return mission.initialCode; }
  });
  const [term, setTerm] = useState<TermLine[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [vars, setVars] = useState<Record<string, string> | null>(null);
  const [steps, setSteps] = useState(0);
  const [pyState, setPyState] = useState<PyState>({ status: 'idle', phase: '' });
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const un = onPyStatus(s => setPyState(s));
    return un;
  }, []);

  // 进入实验室即预加载引擎
  useEffect(() => {
    warmUp();
  }, []);

  // 切题：载入草稿 / 初始代码
  useEffect(() => {
    try { localStorage.setItem('nexus_lab_last', missionId); } catch { /* ignore */ }
    let next = mission.initialCode;
    try { next = localStorage.getItem(DRAFT_PREFIX + missionId) ?? mission.initialCode; } catch { /* ignore */ }
    setCode(next);
    setTerm([]);
    setResult(null);
    setVars(null);
    setSteps(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  // 草稿自动保存（300ms 防抖）
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try { localStorage.setItem(DRAFT_PREFIX + missionId, code); } catch { /* ignore */ }
    }, 300);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [code, missionId]);

  const pushLines = useCallback((lines: TermLine[]) => {
    setTerm(t => [...t.slice(-160), ...lines]);
  }, []);

  const nextMission = () => {
    const others = LAB_MISSIONS.filter(m => m.id !== missionId);
    const pick = others[Math.floor(Math.random() * others.length)];
    play('click');
    setMissionId(pick.id);
  };

  const run = async () => {
    if (running) return;
    const ck = checkUserCode(code);
    if (!ck.allowed) {
      pushLines([{ kind: 'cmd', text: 'python lab.py' }, { kind: 'err', text: '安全策略阻止：' + ck.reason }]);
      setResult({ ok: false, msg: '代码被实验室安全策略拦截。' + ck.reason });
      play('deny');
      return;
    }
    setRunning(true);
    setResult(null);
    pushLines([{ kind: 'cmd', text: 'python lab.py' }]);
    if (pyState.status !== 'ready') {
      pushLines([{ kind: 'sys', text: 'Python 引擎初始化中（本地加载，通常 2~5 秒）——代码已排队，就绪后自动执行。' }]);
    }
    pushLines([{ kind: 'sys', text: '正在运行（含变量快照采集）…' }]);
    play('run');
    const r = await runPython(code, { timeoutMs: 5000, debug: true });
    setRunning(false);
    const stdout = filterMarkerLines(r.stdout || '');
    if (r.timedOut) {
      pushLines([{ kind: 'err', text: '执行超时：程序运行超过安全时限，已被强制终止。' }]);
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
      setVars(null);
      play('error');
      return;
    }
    pushLines([
      { kind: 'sys', text: '进程正常退出（exit 0）' },
      ...(stdout.trim() ? [{ kind: 'out' as const, text: stdout.replace(/\n$/, '') }] : [{ kind: 'muted' as const, text: '(程序没有输出)' }]),
    ]);
    const trace = (r.trace || []).filter(t => t.line >= 0);
    setSteps(trace.length);
    const finalVars = trace.length > 0 ? trace[trace.length - 1].vars : {};
    setVars(finalVars);
    const passed = mission.expect.every(s => stdout.includes(s));
    if (passed) {
      setResult({ ok: true, msg: '✓ 目标达成！输出符合预期。可以「换一题」继续练习。' });
      play('success');
    } else {
      setResult({ ok: false, msg: '输出还没有达到目标。对照左侧「目标输出」检查 print 的内容。' });
      play('warning');
    }
  };

  const resetCode = () => {
    setCode(mission.initialCode);
    setTerm([]);
    setResult(null);
    setVars(null);
    setSteps(0);
    try { localStorage.removeItem(DRAFT_PREFIX + missionId); } catch { /* ignore */ }
    play('click');
  };

  const index = LAB_MISSIONS.findIndex(m => m.id === mission.id) + 1;

  return (
    <div className="page page-anim" style={{ padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
        <div>
          <div className="hud-title">编程实验室 · SANDBOX</div>
          <div className="hud-sub">自由练习区：真实运行 Python，随时查看变量；不会影响主线进度与容错。</div>
        </div>
        <div className="hud-spacer" />
        <span className="hud-chip">练习题 {index} / {LAB_MISSIONS.length}</span>
        <div className={'py-status ' + pyState.status} title={pyState.phase}>
          <span className="pd" />
          {pyState.status === 'ready' ? 'PY ENGINE READY' : pyState.status === 'loading' ? '引擎加载中…' : pyState.status === 'error' ? '引擎错误' : 'ADAPTER STANDBY'}
        </div>
      </div>

      <div className="chlg-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* 左：题目 */}
        <div className="chlg-left" style={{ overflowY: 'auto' }}>
          <div className="panel task-block">
            <div className="panel-title">练习任务<span className="panel-tag">LAB-{String(index).padStart(2, '0')}</span></div>
            <div className="tb-item">
              <div className="tb-label">题目</div>
              <div className="tb-text">{mission.title} —— {mission.desc}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">目标输出</div>
              <div className="tb-text warn" style={{ fontFamily: 'Consolas, monospace' }}>{mission.goal}</div>
            </div>
            <div className="tb-item">
              <div className="tb-label">提示</div>
              <div className="tb-text dim">{mission.hint}</div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="nxbtn small primary" onClick={nextMission}>🎲 换一题</button>
              <button className="nxbtn small ghost" onClick={resetCode}>恢复初始代码</button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">实验室说明</div>
            <div className="dim" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
              · 已通过新人训练终端后解锁本实验室。<br />
              · 代码支持前六章学过的全部语法（变量 / 条件 / 循环 / 列表 / 字典 / 函数 / 异常）。<br />
              · 运行会采集执行轨迹，右侧「变量监视器」显示运行结束时的变量状态。<br />
              · 草稿自动保存到本地，刷新页面不会丢失。<br />
              · 安全边界：禁止文件、网络、求值类操作（教学沙箱）。
            </div>
          </div>
        </div>

        {/* 中：编辑器 */}
        <div className="chlg-center">
          <div className="toolbar">
            <button className="nxbtn" disabled={running} onClick={run}>
              {running ? <span className="spinner" /> : '▶'} 运行代码
            </button>
            <button className="nxbtn ghost" disabled={running} onClick={resetCode}>恢复初始代码</button>
            <div className="sp" />
            <span className="chip">自由练习 · 不计失败</span>
          </div>
          <div className="code-frame" style={{ flex: 1 }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              onRun={run}
              readOnly={running}
              fontSize={15}
            />
          </div>
          {result && (
            <div className={'result-banner ' + (result.ok ? 'ok' : 'fail')}>
              {result.msg}
              {steps > 0 && <span className="dim" style={{ marginLeft: 10, fontSize: 12 }}>（执行 {steps} 步）</span>}
            </div>
          )}
        </div>

        {/* 右：变量监视 */}
        <div className="chlg-right" style={{ overflowY: 'auto' }}>
          <div className="panel">
            <div className="panel-title">
              变量监视器
              <span className="panel-tag">{vars ? 'SNAPSHOT' : 'STANDBY'}</span>
            </div>
            {vars ? (
              <LabVars vars={vars} />
            ) : (
              <div className="dim" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
                运行代码后，这里会显示程序结束时的变量状态（来自执行轨迹的最后一步）。
                <br /><br />
                小技巧：把变量用 print 打出来，或用桌面纸笔推演循环过程。
              </div>
            )}
          </div>
          <div className="panel">
            <div className="panel-title">快速参考</div>
            <div>
              {['if 条件:', 'for x in 列表:', 'while 条件:', 'def 函数(参数):', 'return 值', 'dict.get(键, 默认值)', 'try / except'].map(s => (
                <span key={s} className="chip cyan know-chip" style={{ fontFamily: 'Consolas, monospace' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="chlg-bottom">
        <Terminal lines={term} maxHeight={190} title={'实验室终端 · ' + mission.title} />
      </div>
    </div>
  );
}

function LabVars({ vars }: { vars: Record<string, string> }) {
  const entries = Object.entries(vars).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    return <div className="dim" style={{ fontSize: 12.5 }}>程序结束时没有局部变量（可能只有输出语句）。</div>;
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
