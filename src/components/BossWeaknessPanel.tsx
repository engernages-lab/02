import { useEffect, useMemo, useState } from 'react';
import CodeEditor from './CodeEditor';
import { useGame } from '../store/gameStore';
import type { BossDifficulty } from '../game/difficulty';
import {
  WEAKNESS_STATUS_LABEL, WEAKNESS_TYPE_LABEL,
  activeWeakness, activeEntry, definitionsForPhase,
  type BossWeaknessDefinition,
} from '../game/bossWeaknessEngine';
import { weaknessDefinitionsFor } from '../game/bossWeaknessCatalog';
import { play } from '../services/sound';

const sec = (ms: number) => (Math.max(0, ms) / 1000).toFixed(1) + 's';

/**
 * Boss 弱点面板 + 真实代码破解覆盖层。
 * 破解判题完全由 gameStore 调用真实 Python Runner / Judge 完成。
 */
export default function BossWeaknessPanel({
  bossId,
  difficulty,
  now,
  onLog,
}: {
  bossId: string;
  difficulty: BossDifficulty;
  now: number;
  onLog?: (text: string, kind: 'hit' | 'fail' | 'phase' | 'win') => void;
}) {
  const g = useGame();
  const weakness = g.bossWeaknessStateOf(bossId);
  const arbiter = g.combatArbiterStateOf(bossId);
  const defs = useMemo(() => weaknessDefinitionsFor(bossId, difficulty), [bossId, difficulty]);
  const def = weakness ? activeWeakness(weakness, defs) : undefined;
  const entry = weakness ? activeEntry(weakness, defs) : undefined;

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!open || !def) return;
    setCode(def.challenge.initialCode);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, def ? def.weaknessId : '']);

  // 覆盖层打开时获取 P3 仲裁锁并暂停 Boss 自动攻击；更高优先级事件可拒绝/抢占
  useEffect(() => {
    if (!open) return;
    const r = g.setBossCombatPaused(bossId, true);
    if (!r.ok) {
      setOpen(false);
      g.toast('warn', '更高优先级的战斗事件正在进行，弱点破解暂时不可用。');
      return;
    }
    return () => { g.setBossCombatPaused(bossId, false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bossId]);

  // 动态危机 / 阶段切换等更高优先级事件抢占时，关闭破解覆盖层
  useEffect(() => {
    if (!open) return;
    if (arbiter && arbiter.active && arbiter.active.priority < 3) {
      setOpen(false);
      g.toast('warn', '更高优先级事件中断了弱点破解。');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, arbiter ? arbiter.active ? arbiter.active.eventId : '' : '']);

  if (!weakness || !def || !entry) return null;

  const status = entry.status;
  const clues = def.clues.filter(c => entry.clues.includes(c.clueId));
  const required = def.requiredClues;
  const analysisRemain = entry.analysisEndsAt != null ? Math.max(0, entry.analysisEndsAt - now) : 0;
  const exposedRemain = entry.exposedUntil != null ? Math.max(0, entry.exposedUntil - now) : 0;
  const cooldownRemain = entry.cooldownUntil != null ? Math.max(0, entry.cooldownUntil - now) : 0;
  const lockedRemain = entry.lockedUntil != null ? Math.max(0, entry.lockedUntil - now) : 0;

  const analyze = () => {
    const r = g.analyzeBossWeakness(bossId);
    if (!r.ok) { g.toast('warn', r.reason || '无法分析'); play('deny'); return; }
    play('click');
    if (r.message) g.toast('info', r.message);
    onLog?.('开始分析弱点线索…', 'phase');
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setResult(null);
    const r = await g.submitWeaknessCrack(bossId, code);
    setSubmitting(false);
    if (r.status === 'success') {
      setOpen(false);
      setResult(null);
      onLog?.('弱点破解成功：' + def.name + ' 已暴露', 'win');
      return;
    }
    if (r.status === 'blocked') {
      setResult({ ok: false, msg: r.reason || '提交被阻止' });
      return;
    }
    const err = r.verdict ? r.verdict.error : undefined;
    const reason = r.status === 'timeout' ? '执行超时'
      : r.status === 'error' ? '程序执行出错' + (err ? '（' + err.type + ': ' + err.message + '）' : '')
        : (r.reason || '判题未通过');
    setResult({ ok: false, msg: '破解失败：' + reason });
    onLog?.('破解失败：' + reason, 'fail');
  };

  const statusHint = (() => {
    switch (status) {
      case 'hidden':
        return '继续战斗：Boss 攻击预警、命中、防御与闪避都会留下线索。';
      case 'hinted':
        return '已获得 ' + clues.length + ' / ' + required + ' 条线索。「分析弱点」需要线索足够并等待真实解析时间。';
      case 'analyzing':
        return '正在解析线索…… ' + sec(analysisRemain);
      case 'discovered':
        return '弱点已定位，破解入口已开放。';
      case 'exploiting':
        return '真实 Python 判题中……';
      case 'exposed':
        return '弱点暴露：伤害 ×' + def.damageMultiplier + '，剩余 ' + sec(exposedRemain);
      case 'recovered':
        return cooldownRemain > 0 ? '弱点正在恢复：' + sec(cooldownRemain) : '恢复完成，可再次破解。';
      case 'locked':
        return '尝试次数耗尽：弱点暂时封锁 ' + sec(lockedRemain);
      default:
        return '';
    }
  })();

  const canAnalyze = status === 'hinted' && clues.length >= required;
  const canCrack = status === 'discovered' || status === 'recovered';

  return (
    <>
      <div className={'panel boss-weakness-panel status-' + status}>
        <div className="panel-title">BOSS WEAKNESS<span className="panel-tag">{WEAKNESS_STATUS_LABEL[status]}</span></div>
        <div className="tb-item">
          <div className="tb-label">当前阶段弱点</div>
          <div className="tb-text">
            <b>{status === 'hidden' ? '？？？' : def.name}</b>
            {status !== 'hidden' && <span className="chip" style={{ marginLeft: 6 }}>{WEAKNESS_TYPE_LABEL[def.weaknessType]}</span>}
          </div>
        </div>
        <div className="tb-item">
          <div className="tb-label">线索</div>
          <div className="tb-text dim" style={{ fontSize: 12.5 }}>{statusHint}</div>
        </div>

        <div className="weakness-clue-list">
          {clues.map(c => (
            <div key={c.clueId} className="weakness-clue">
              <span className="wc-source">{c.sourceLabel}</span>
              <span className="wc-text">{c.text}</span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, required - clues.length) }, (_, i) => (
            <div key={'lock' + i} className="weakness-clue locked">
              <span className="wc-source">未解锁</span>
              <span className="wc-text">继续战斗以获取更多线索（线索 {clues.length + i + 1}）</span>
            </div>
          ))}
        </div>

        <div className="weakness-actions">
          {status === 'hinted' && (
            <button className="nxbtn small primary" disabled={!canAnalyze} onClick={analyze}>
              分析弱点（{clues.length}/{required}）
            </button>
          )}
          {(status === 'discovered' || status === 'recovered') && (
            <button className="nxbtn small primary" onClick={() => { play('click'); setOpen(true); }}>
              开始弱点破解
            </button>
          )}
          {status === 'analyzing' && <button className="nxbtn small" disabled>解析中 {sec(analysisRemain)}</button>}
          {status === 'exploiting' && <button className="nxbtn small" disabled>破解判题中…</button>}
          {status === 'exposed' && (
            <span className="weakness-exposure-effect">
              暴露 {sec(exposedRemain)} · 伤害 ×{def.damageMultiplier} · 攻击冷却 ×{def.attackCooldownBonus}
            </span>
          )}
          {status === 'locked' && <span className="dim" style={{ fontSize: 12 }}>封锁剩余 {sec(lockedRemain)}</span>}
        </div>

        {def.disableAttackPatternIds.length > 0 && (
          <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
            暴露效果：{def.exposureEffects.join(' · ')}
          </div>
        )}
      </div>

      {open && (
        <div className="overlay weakness-overlay" role="dialog" aria-label="弱点破解">
          <div className="weakness-crack-panel">
            <div className="wcp-head">
              <div>
                <div className="wcp-kicker">WEAKNESS CRACK · {WEAKNESS_TYPE_LABEL[def.weaknessType]}</div>
                <div className="wcp-title">{def.name}</div>
                <div className="wcp-sub">真实 Python 判题 · 判题通过后弱点暴露</div>
              </div>
              <button className="nxbtn small ghost" disabled={submitting} onClick={() => setOpen(false)}>✕ 关闭</button>
            </div>
            <div className="wcp-info">
              <div><b>目标：</b>{def.challenge.goal}</div>
              <div><b>故障：</b>{def.challenge.fault}</div>
              <div className="dim">尝试次数：{entry.attempts} / {def.maxAttempts > 0 ? def.maxAttempts : '∞'} · 线索 {clues.length} 条</div>
            </div>
            <div className="wcp-code">
              <CodeEditor
                value={code}
                onChange={setCode}
                height="100%"
                fontSize={15}
                readOnly={submitting}
                onRun={submit}
              />
            </div>
            <div className="wcp-actions">
              <button className="nxbtn primary" disabled={submitting} onClick={submit}>
                {submitting ? <span className="spinner" /> : '提交破解 ⏎'}
              </button>
              <button className="nxbtn ghost" disabled={submitting} onClick={() => setCode(def.challenge.initialCode)}>重置代码</button>
              <div className="sp" />
              <span className="chip">真实 Judge</span>
            </div>
            {result && <div className={'result-banner ' + (result.ok ? 'ok' : 'fail')}>{result.msg}</div>}
          </div>
        </div>
      )}
    </>
  );
}
