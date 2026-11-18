import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { INDEPENDENT_CHALLENGES } from '../game/challengeTemplates';
import { CHALLENGE_TYPE_LABEL } from '../game/challengeTypes';
import { DIFFICULTY_PRESETS } from '../game/challengeRules';
import { UNKNOWN_INTRUSION_ID } from '../game/events/unknownIntrusion';
import { play } from '../services/sound';

/** dev 工具开关：只影响测试按钮可见性，不发放任何奖励（URL 参数无法领取奖励） */
function devToolsOn(): boolean {
  try {
    if (localStorage.getItem('nexus_dev_tools') === '1') return true;
    return new URLSearchParams(window.location.search).has('dev');
  } catch {
    return false;
  }
}

const fmtLimit = (v: number | null) => (v == null ? '不限' : String(v));
const fmtTime = (v: number | null) => (v == null ? '不限时' : v + ' 秒');

export default function ChallengeHubPage() {
  const g = useGame();
  const [devMsg, setDevMsg] = useState<string>('');
  const dev = devToolsOn();

  const start = (id: string) => {
    play('click');
    const run = g.enterChallenge(id);
    if (!run) { g.toast('warn', '挑战数据缺失，无法进入。'); return; }
    g.setCurrentChallenge(id);
    g.nav('challengeplay');
  };

  return (
    <div className="page page-anim" style={{ padding: '10px 14px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="hud" style={{ marginBottom: 8 }}>
        <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
        <div>
          <div className="hud-title">独立挑战 · CHALLENGE SIM</div>
          <div className="hud-sub">与原有关卡完全独立的规则挑战：限时 / 连锁 Bug / 隐藏 Bug / 资源限制 / 多阶段。不占用主线进度。</div>
        </div>
        <div className="hud-spacer" />
        <span className="hud-chip">挑战 {INDEPENDENT_CHALLENGES.length} 项</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {INDEPENDENT_CHALLENGES.map(def => {
            const rawRun = g.player.progress.challengeRuns?.[def.id];
            const session = g.player.progress.challengeSessions?.[def.id];
            const active = !!rawRun && rawRun.status === 'active';
            const passed = session?.status === 'passed' || rawRun?.status === 'completed';
            const failed = session?.status === 'failed' || rawRun?.status === 'failed';
            const statusText = active ? '进行中' : passed ? '已完成' : failed ? '已失败' : '未开始';
            const statusColor = active ? '#F3B75C' : passed ? '#5BD6A0' : failed ? '#FF5B64' : '#8FA6B2';
            const r = def.rules;
            return (
              <div key={def.id} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="panel-title" style={{ marginBottom: 0 }}>
                  {def.title}
                  <span className="panel-tag">{CHALLENGE_TYPE_LABEL[def.type]}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="chip cyan">{DIFFICULTY_PRESETS[def.difficulty].label}</span>
                  <span className="chip">奖励系数 ×{r.rewardMultiplier}</span>
                  <span className="chip" style={{ color: statusColor }}>{statusText}</span>
                </div>
                <div className="tb-item">
                  <div className="tb-label">故障</div>
                  <div className="tb-text dim" style={{ fontSize: 12.5 }}>{def.fault}</div>
                </div>
                <div className="tb-item">
                  <div className="tb-label">目标</div>
                  <div className="tb-text" style={{ fontSize: 12.5 }}>{def.goal}</div>
                </div>
                <div className="dim" style={{ fontSize: 12, lineHeight: 1.7 }}>
                  · 时限：{fmtTime(r.timeLimitSec)}　· 运行：{fmtLimit(r.maxRuns)} 次　· 提交：{fmtLimit(r.maxSubmits)} 次　· 提示：{fmtLimit(r.maxHints)} 次
                  {(def.hiddenTests?.length || 0) > 0 && <><br />· 隐藏用例：{def.hiddenTests?.length} 项（只显示是否通过，不显示用例内容）</>}
                  {(def.stages?.length || 0) > 0 && <><br />· 阶段：{def.stages?.map(s => s.label).join(' → ')}</>}
                </div>
                {active && rawRun && (
                  <div className="dim" style={{ fontSize: 12, color: '#F3B75C' }}>
                    运行 {rawRun.runsUsed}/{rawRun.limits.maxRuns ?? '∞'}　提交 {rawRun.submitsUsed}/{rawRun.limits.maxSubmits ?? '∞'}
                  </div>
                )}
                <div className="row" style={{ marginTop: 'auto' }}>
                  <button className="nxbtn small primary" onClick={() => start(def.id)}>
                    {active ? '继续挑战 ▶' : passed ? '再次挑战 ▶' : '开始挑战 ▶'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="panel-title">规则说明</div>
          <div className="dim" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
            · 「运行代码」只做诊断，不判定通过；「提交」才会触发真实判题与结算。<br />
            · 隐藏用例只在提交时执行，界面仅显示通过数量，绝不显示用例表达式。<br />
            · 每个挑战独立会话：成功只结算一次；提交次数耗尽或超时即为失败，需重新进入。<br />
            · 挑战草稿与主线关卡草稿物理隔离，互不覆盖。
          </div>
        </div>

        {dev && (
          <div className="panel" style={{ marginTop: 12, borderColor: 'rgba(243,183,92,0.5)' }}>
            <div className="panel-title">DEV 测试入口<span className="panel-tag">仅本机</span></div>
            <div className="dim" style={{ fontSize: 12 }}>不修改金币 / 经验 / 资产，不覆盖存档与草稿；仅用于验证动态事件与六种恢复方式。</div>
            <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
              <button className="nxbtn small primary" onClick={() => {
                const r = g.triggerDynamicEvent(UNKNOWN_INTRUSION_ID);
                setDevMsg(r.ok ? '已触发未知入侵。' : '未触发：' + (r.reason === 'cooldown' ? '冷却中（60s）' : r.reason === 'already-presenting' ? '当前已有同类事件' : r.reason === 'mutex' ? '存在互斥事件' : r.reason || '未知'));
              }}>触发未知入侵</button>
              <button className="nxbtn small ghost" onClick={() => {
                g.advanceDynamicEvent();
                setDevMsg('已请求推进生命周期（presenting→active / 超时检测）。');
              }}>推进生命周期</button>
              <button className="nxbtn small ghost" onClick={() => {
                g.recoverDynamicEvent();
                setDevMsg('已执行异常恢复。');
              }}>触发异常恢复</button>
            </div>
            {devMsg && <div className="dim" style={{ fontSize: 12, marginTop: 8, color: '#F3B75C' }}>{devMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
