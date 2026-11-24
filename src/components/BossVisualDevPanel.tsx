import { useGame } from '../store/gameStore';
import type { BossBattleVisuals } from './BossBattleVisualLayer';
import { visualEffectStats } from '../game/bossBattleVisualEngine';
import { devToolsOn } from '../game/devMode';
import type { VisualIntensity } from '../game/bossBattleVisualConfig';
import { weaknessDefinitionsFor } from '../game/bossWeaknessCatalog';
import { activeWeakness } from '../game/bossWeaknessEngine';

/** 仅 DEV：视觉基础测试面板；所有触发仅影响视觉层，不写存档、不改战斗。 */
export default function BossVisualDevPanel({ visuals }: { visuals: BossBattleVisuals }) {
  const g = useGame();
  if (!devToolsOn()) return null;
  const stats = visualEffectStats(visuals.runtime);
  const intensities: VisualIntensity[] = ['LOW', 'MEDIUM', 'HIGH', 'CINEMATIC'];
  const battle = g.player.progress.bossBattles?.[visuals.bossId];
  const weaknessDefs = battle ? weaknessDefinitionsFor(visuals.bossId, battle.difficulty) : [];
  const weaknessRun = g.player.progress.bossWeaknesses?.[visuals.bossId];
  const devWeakness = weaknessRun ? activeWeakness(weaknessRun, weaknessDefs) : weaknessDefs[0];
  const devWeaknessName = devWeakness?.name || '';
  const devWeaknessId = devWeakness?.weaknessId || '';
  const devWeaknessType = devWeakness?.weaknessType || '';
  const triggerWeakness = (kind: 'scan' | 'discovery' | 'crack' | 'break' | 'expose' | 'recovery') =>
    visuals.weakness(kind, devWeaknessName, devWeaknessId, devWeaknessType);
  return (
    <div className="panel dev-visual-panel">
      <div className="panel-title">DEV · Boss 视觉测试<span className="panel-tag">只读战斗 / 不写存档</span></div>
      <div className="dev-visual-row">
        {intensities.map(i => <button key={i} className={'nxbtn small ' + (visuals.intensity === i ? 'primary' : '')} onClick={() => visuals.setIntensity(i)}>{i}</button>)}
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => visuals.trigger('boss-warning-pulse')}>Warning Pulse</button>
        <button className="nxbtn small" onClick={() => visuals.trigger('boss-attack-impact')}>Screen Shake</button>
        <button className="nxbtn small" onClick={() => visuals.trigger('boss-crisis-glitch')}>Digital Glitch</button>
        <button className="nxbtn small" onClick={() => visuals.trigger('boss-weakness-flash')}>Energy Flash</button>
        <button className="nxbtn small" onClick={() => visuals.trigger('boss-scanline')}>Scanline</button>
        <button className="nxbtn small" onClick={() => visuals.trigger('boss-particle-burst')}>Particle Burst</button>
        <button className="nxbtn small" onClick={() => visuals.trigger('boss-particle-stream')}>Particle Stream</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small primary" onClick={() => visuals.attack('warning', 'single', '数据执行攻击')}>Attack Warning</button>
        <button className="nxbtn small" onClick={() => visuals.attack('charge', 'aoe', '数据污染波')}>Charge</button>
        <button className="nxbtn small" onClick={() => visuals.attack('release', 'aoe', 'Digital Wave')}>Digital Wave</button>
        <button className="nxbtn small" onClick={() => visuals.attack('release', 'single', 'Data Strike')}>Data Strike</button>
        <button className="nxbtn small" onClick={() => visuals.attack('release', 'delayed', 'System Crash')}>System Crash</button>
        <button className="nxbtn small" onClick={() => visuals.attack('release', 'special', 'Corruption Wave')}>Corruption Wave</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => visuals.attack('hit', 'single', '数据执行攻击')}>Hit</button>
        <button className="nxbtn small" onClick={() => visuals.attack('block', 'single', '数据执行攻击')}>Block</button>
        <button className="nxbtn small" onClick={() => visuals.attack('dodge', 'single', '数据执行攻击')}>Dodge</button>
        <button className="nxbtn small" onClick={() => visuals.attack('interrupt', 'aoe', '数据污染波')}>Interrupt</button>
        <button className="nxbtn small" onClick={() => visuals.attack('cancel', 'aoe', '数据污染波')}>Cancel</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small primary" onClick={() => visuals.phase(0, 1, '防御协议')}>Phase 1 → 2</button>
        <button className="nxbtn small" onClick={() => visuals.phase(1, 2, '核心暴走')}>Phase 2 → 3</button>
        <button className="nxbtn small" onClick={() => visuals.phase(2, 0, '能源封锁')}>Phase 3 → 1</button>
        <button className="nxbtn small ghost" onClick={() => visuals.trigger('boss-phase-flash')}>Phase Priority</button>
        <button className="nxbtn small ghost" onClick={() => visuals.trigger('boss-warning-pulse')}>Queue Warning</button>
        <button className="nxbtn small" onClick={() => visuals.interrupt('boss-warning-pulse')}>Interrupt</button>
        <button className="nxbtn small danger" onClick={() => visuals.cleanup()}>Cleanup All</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => triggerWeakness('scan')}>Weakness Scan</button>
        <button className="nxbtn small" onClick={() => triggerWeakness('discovery')}>Weakness Discovery</button>
        <button className="nxbtn small" onClick={() => triggerWeakness('crack')}>Weakness Crack</button>
        <button className="nxbtn small" onClick={() => triggerWeakness('break')}>Weakness Break</button>
        <button className="nxbtn small" onClick={() => triggerWeakness('expose')}>Weakness Expose</button>
        <button className="nxbtn small" onClick={() => triggerWeakness('recovery')}>Weakness Recovery</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small primary" onClick={() => visuals.weaknessSequence()}>Weakness Full Sequence</button>
        <button className="nxbtn small" onClick={() => visuals.interruptWeakness()}>Interrupt Weakness</button>
        <button className="nxbtn small" onClick={() => visuals.interruptWeakness()}>Cleanup Weakness</button>
        <button className="nxbtn small" onClick={() => { visuals.attack('warning', 'special', devWeaknessName || 'Boss 攻击'); visuals.weakness('discovery', devWeaknessName, devWeaknessId, devWeaknessType); }}>Weakness Priority</button>
        <button className="nxbtn small danger" onClick={() => visuals.terminal()}>Terminal Override</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => visuals.crisis('warning')}>Crisis Warning</button>
        <button className="nxbtn small" onClick={() => visuals.crisis('detection')}>Crisis Detection</button>
        <button className="nxbtn small" onClick={() => visuals.crisis('identification')}>Crisis Identification</button>
        <button className="nxbtn small" onClick={() => visuals.crisis('escalation')}>Crisis Escalation</button>
        <button className="nxbtn small" onClick={() => visuals.crisis('impact')}>Crisis Impact</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => visuals.crisis('response')}>Crisis Response</button>
        <button className="nxbtn small" onClick={() => visuals.crisis('resolution')}>Crisis Resolution</button>
        <button className="nxbtn small" onClick={() => visuals.crisis('recovery')}>Crisis Recovery</button>
        <button className="nxbtn small primary" onClick={() => visuals.crisisSequence()}>Full Crisis Sequence</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => visuals.interruptCrisis()}>Interrupt Crisis</button>
        <button className="nxbtn small" onClick={() => visuals.interruptCrisis()}>Cleanup Crisis</button>
        <button className="nxbtn small" onClick={() => visuals.crisisPriority()}>Crisis Priority</button>
        <button className="nxbtn small" onClick={() => { visuals.crisis('impact'); visuals.crisis('impact'); }}>Crisis Duplicate</button>
        <button className="nxbtn small ghost" onClick={() => visuals.crisisStale()}>Crisis Stale</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => visuals.terminal('victory')}>Victory Cinematic</button>
        <button className="nxbtn small" onClick={() => visuals.terminal('defeat')}>Defeat Cinematic</button>
        <button className="nxbtn small" onClick={() => visuals.terminal('retreat')}>Retreat Cinematic</button>
        <button className="nxbtn small" onClick={() => visuals.terminal('interrupted')}>Interrupted Cinematic</button>
        <button className="nxbtn small primary" onClick={() => visuals.terminal('victory')}>Full Victory Sequence</button>
        <button className="nxbtn small primary" onClick={() => visuals.terminal('defeat')}>Full Defeat Sequence</button>
      </div>
      <div className="dev-visual-row">
        <button className="nxbtn small" onClick={() => visuals.terminalPriority()}>Terminal Priority</button>
        <button className="nxbtn small" onClick={() => visuals.interruptTerminal()}>Terminal Interrupt</button>
        <button className="nxbtn small" onClick={() => visuals.terminalDuplicate()}>Terminal Duplicate</button>
        <button className="nxbtn small ghost" onClick={() => visuals.terminalStale()}>Terminal Stale</button>
        <button className="nxbtn small" onClick={() => visuals.terminal('victory')}>Settlement Transition</button>
        <button className="nxbtn small" onClick={() => visuals.terminalCleanup()}>Terminal Cleanup</button>
        <button className="nxbtn small" onClick={() => { visuals.setIntensity('LOW'); visuals.terminal('victory'); }}>Terminal Reduced</button>
      </div>
      <div className="dev-registry-panel">
        <div className="panel-title">VISUAL EVENT REGISTRY<span className="panel-tag">真实接入</span></div>
        <div className="dev-registry-grid">
          <span>Terminal · Victory/Defeat/Retreat/Interrupted</span><b>P0</b>
          <span>Phase · BOSS_PHASE_TRANSITION</span><b>P1</b>
          <span>Crisis · unknown-intrusion lifecycle</span><b>P2</b>
          <span>Weakness · BOSS_WEAKNESS_*</span><b>P3</b>
          <span>Attack · BOSS_ATTACK_*</span><b>P4</b>
          <span>Defense · Block/Dodge</span><b>P5</b>
        </div>
      </div>
      <div className="dev-perf-dashboard">
        <div className="panel-title">VISUAL PERFORMANCE<span className="panel-tag">真实运行数据</span></div>
        <div className="dev-stats-grid">
          <span>FPS：<b>{visuals.fps}</b> · Frame {visuals.frameTime}ms</span>
          <span>Mode：<b>{visuals.performanceMode}</b> · Setting {visuals.performanceSetting}</span>
          <span>Active：<b>{stats.active} / {6}</b> · Queue {stats.queued} / {8}</span>
          <span>Particles：<b>{visuals.particleCount} / 96</b></span>
          <span>Canvas DPR：<b>{visuals.canvasDpr}</b> · {visuals.canvasRenderMs}ms</span>
          <span>Render Cost：<b>{visuals.renderCost}</b></span>
          <span>Hidden：<b>{visuals.paused ? 'YES' : 'NO'}</b> · DOM visuals {(() => { try { return document.querySelectorAll('.b6-visual-root .b6-effect, .b6-visual-root .b6-crisis-cine, .b6-visual-root .b6-weak-cine, .b6-crisis-portal, .b6-terminal-portal').length; } catch { return 0; } })()}</span>
          <span>Reason：<b>{visuals.performanceReason}</b></span>
        </div>
        <div className="dev-visual-row">
          <select className="nx-select" value={visuals.performanceSetting} onChange={e => visuals.setPerformanceSetting(e.target.value as typeof visuals.performanceSetting)}>
            {(['AUTO', 'NORMAL', 'REDUCED', 'LOW', 'CRITICAL'] as const).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button className="nxbtn small" onClick={() => visuals.simulateFps(40)}>Simulate 40 FPS</button>
          <button className="nxbtn small" onClick={() => visuals.simulateFps(25)}>Simulate 25 FPS</button>
          <button className="nxbtn small" onClick={() => visuals.simulateFps(60, 16)}>Performance Recovery</button>
        </div>
        <div className="dev-visual-row">
          <button className="nxbtn small" onClick={() => { visuals.stressParticles(); visuals.stressQueue(); }}>Performance Stress Test</button>
          <button className="nxbtn small" onClick={() => visuals.stressParticles()}>Particle Overflow</button>
          <button className="nxbtn small" onClick={() => visuals.stressQueue()}>Queue Overflow</button>
          <button className="nxbtn small" onClick={() => { visuals.setSimulatedHidden(!visuals.simulatedHidden); }}>Visibility Pause</button>
          <button className="nxbtn small" onClick={() => visuals.stressResize()}>Resize Stress</button>
          <button className="nxbtn small" onClick={() => visuals.stressLeak()}>Memory Leak Stress</button>
          <button className="nxbtn small" onClick={() => visuals.cleanup()}>Canvas Cleanup</button>
        </div>
        <div className="dev-visual-row">
          <button className="nxbtn small" onClick={() => { visuals.setIntensity('LOW'); visuals.attack('warning', 'single', '低动画审计'); }}>Reduced Motion Audit</button>
          <button className="nxbtn small" onClick={() => visuals.trigger('boss-crisis-glitch')}>Flash Safety Audit</button>
          <button className="nxbtn small" onClick={() => { visuals.stressParticles(); visuals.stressQueue(); visuals.crisis('impact'); visuals.terminal('victory'); }}>Full Visual Stress</button>
        </div>
      </div>
      <div className="dev-stats-grid">
        <span>Theme：<b>{visuals.theme.visualTheme}</b></span>
        <span>Attack：<b>{visuals.attackView ? visuals.attackView.phase + (visuals.attackView.result ? '/' + visuals.attackView.result : '') : '—'}</b></span>
        <span>Phase：<b>{visuals.phaseTransition ? 'P' + (visuals.phaseTransition.toIndex + 1) + '/' + visuals.phaseTransition.stage : '—'}</b></span>
        <span>Weakness：<b>{visuals.weaknessView ? visuals.weaknessView.kind + '/' + visuals.weaknessView.stageLabel : '—'}</b></span>
        <span>Crisis：<b>{visuals.crisisView ? visuals.crisisView.kind + '/' + visuals.crisisView.stageLabel : '—'}</b></span>
        <span>Overlay：<b>{visuals.crisisOverlayActive ? 'ACTIVE' : '—'}</b></span>
        <span>Terminal：<b>{visuals.terminalView ? visuals.terminalView.kind + '/' + visuals.terminalView.stage : '—'}</b> · Seen {visuals.terminalSeen ? 'YES' : 'NO'}</span>
        <span>Intensity：<b>{visuals.intensity}</b></span>
        <span>Performance：<b>{visuals.performance}</b> · {visuals.fps} FPS</span>
        <span>Reduced：<b>{visuals.reducedMotion ? 'YES' : 'NO'}</b></span>
        <span>Active：<b>{stats.active}</b> · Queued：<b>{stats.queued}</b></span>
        <span>Cleanup：<b>{stats.cleanupCount}</b> · Dropped：<b>{stats.droppedCount}</b></span>
        <span>Particles：<b>{visuals.particleCount}</b></span>
        <span>Completed：<b>{stats.completed}</b></span>
      </div>
      <div className="dev-visual-row">
        {visuals.runtime.active.map(e => <span className="dev-visual-badge" key={e.instanceId}>{e.effectId} · P{e.priority}</span>)}
        {visuals.runtime.queued.map(e => <span className="dev-visual-badge" key={e.instanceId}>Q {e.effectId}</span>)}
      </div>
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>
        视觉测试只读取/触发视觉层；不修改 Boss HP、意识、阶段、攻击、奖励、成就或统计。系统 Reduced Motion 与低动画设置会自动关闭震动/慢化特效。
      </div>
    </div>
  );
}
