import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { defenseById, judgeDefenseResult } from '../game/defense';
import CodeEditor from './CodeEditor';
import { runPython } from '../services/pythonRunner';
import { play } from '../services/sound';
import type { TermLine } from './Terminal';

const WARN_LINES = ['THREAT DETECTED.', 'CORRECTION UNIT APPROACHING.', 'CONSCIOUSNESS UNDER ATTACK.'];

export default function AttackOverlay() {
  const g = useGame();
  const ev = g.event;
  const task = ev.kind === 'attack' ? defenseById(ev.defenseId) : undefined;
  const attemptsLeft = ev.kind === 'attack' ? ev.attemptsLeft : 2;
  const [phase, setPhase] = useState<'warn' | 'fight' | 'won'>('warn');
  const [warnIdx, setWarnIdx] = useState(0);
  const [code, setCode] = useState(task?.code ?? '');
  const [out, setOut] = useState<TermLine[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (phase !== 'warn') return;
    if (warnIdx >= WARN_LINES.length) {
      const t = window.setTimeout(() => setPhase('fight'), 500);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setWarnIdx(i => i + 1), 720);
    return () => window.clearTimeout(t);
  }, [phase, warnIdx]);

  const doRun = async (submit: boolean) => {
    if (!task || busy) return;
    if (code.includes('??')) {
      setOut(o => [...o, { kind: 'err', text: '缺少运算符：把 ?? 替换成' + task.word + '。' }]);
      play('deny');
      return;
    }
    setBusy(true);
    setOut(o => [...o, { kind: 'cmd', text: submit ? 'python defense.py --submit' : 'python defense.py' }]);
    play('run');
    const r = await runPython(code, { timeoutMs: 5000 });
    setBusy(false);

    if (submit) {
      const v = judgeDefenseResult(r, task);
      if (v.ok) {
        setOut(o => [...o, { kind: 'ok', text: '✓ 防御指令已生效。' }]);
        setPhase('won');
        play('shield');
        window.setTimeout(() => g.resolveDefense(true), 1400);
      } else {
        setOut(o => [...o, { kind: 'err', text: '防御失败：' + (v.reason || '未知原因') }]);
        if (attemptsLeft <= 1) {
          play('death');
          setOut(o => [...o, { kind: 'warn', text: '防御尝试耗尽……意识核心受到冲击！' }]);
          window.setTimeout(() => g.resolveDefense(false), 1000);
        } else {
          g.decrementAttackAttempt();
          play('error');
          setOut(o => [...o, { kind: 'sys', text: '剩余防御尝试：' + (attemptsLeft - 1) }]);
        }
      }
    } else {
      // 预览运行
      if (r.timedOut) setOut(o => [...o, { kind: 'err', text: '执行超时（已强制终止）' }]);
      else if (!r.ok) setOut(o => [...o, { kind: 'err', text: r.error ? r.error.type + ': ' + r.error.message : '执行出错' }]);
      else if (r.stdout.trim()) setOut(o => [...o, { kind: 'out', text: r.stdout.replace(/\n$/, '') }]);
      else setOut(o => [...o, { kind: 'muted', text: '(程序运行成功，无输出)' }]);
    }
  };

  const used = 2 - attemptsLeft;

  return (
    <div className="overlay ov-attack">
      <div className="def-panel warning-frame">
        {phase === 'warn' && (
          <div style={{ textAlign: 'center', padding: '30px 0 40px' }}>
            <div className="enemy-wrap"><div className="enemy-hex" /></div>
            <div className="att-lines">
              {WARN_LINES.slice(0, warnIdx + 1).map((l, i) => (
                <div key={i} className="att-line" style={{ animationDelay: (i * 0.5) + 's' }}>{l}</div>
              ))}
            </div>
          </div>
        )}
        {phase === 'fight' && task && (
          <>
            <div className="row">
              <div className="enemy-wrap" style={{ margin: 0 }}><div className="enemy-hex" style={{ width: 64, height: 64, fontSize: 22 }} /></div>
              <div style={{ flex: 1 }}>
                <div className="def-title">紧急代码防御 · {task.title}</div>
                <div className="def-threat">{task.threat}</div>
                <div className="row">
                  <span className="chip red">纠错者逼近中</span>
                  <span className="chip">防御尝试 <strong>{Math.max(0, attemptsLeft)}</strong> / 2</span>
                  <div className="def-attempts" style={{ margin: 0 }}>
                    <span className={'da' + (used >= 1 ? ' used' : '')} />
                    <span className={'da' + (used >= 2 ? ' used' : '')} />
                  </div>
                </div>
                <div className="hint-note">把 ?? 替换成正确的{task.word}，然后点击「提交防御」。运行预览不消耗尝试次数。</div>
              </div>
            </div>
            <div style={{ height: 240, marginTop: 12 }}>
              <CodeEditor value={code} onChange={setCode} fontSize={14} onRun={() => doRun(false)} />
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="nxbtn" disabled={busy} onClick={() => doRun(false)}>▶ 运行预览</button>
              <button className="nxbtn danger primary" disabled={busy} onClick={() => doRun(true)}>⚡ 提交防御（消耗 1 次尝试）</button>
              <div className="sp" />
              <span className="hint-note">主线代码提交已锁定，直到本次危机结束</span>
            </div>
            <div className="def-result">
              {out.map((l, i) => (
                <div key={i} className={'term-line ' + l.kind} style={{ fontFamily: 'Consolas, monospace' }}>{l.text}</div>
              ))}
            </div>
          </>
        )}
        {phase === 'won' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="cp-ico">◈</div>
            <div className="cp-title" style={{ color: '#BDF7E1' }}>SHIELD ONLINE</div>
            <div className="cp-sub" style={{ marginTop: 8 }}>纠错者已被击退。容错计数已清零。</div>
          </div>
        )}
      </div>
    </div>
  );
}
