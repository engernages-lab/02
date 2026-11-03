import { useEffect, useRef, useState } from 'react';
import ParticlesField from '../components/ParticlesField';
import { useGame } from '../store/gameStore';
import { initAudio, play, startMusic, isMusicOn } from '../services/sound';

const BOOT_LINES = [
  'SYSTEM INITIALIZING...',
  'NEXUS NETWORK CONNECTED.',
  'DIGITAL LIFEFORM DATABASE LOADED.',
  'CONSCIOUSNESS SYNC: 100%',
  'WELCOME, R-07.',
];

export default function StartPage() {
  const g = useGame();
  const [step, setStep] = useState(0);      // 已完成的行
  const [ch, setCh] = useState(0);          // 当前行已输入字符
  const [ready, setReady] = useState(false);
  const entered = useRef(false);

  useEffect(() => {
    if (!g.player.settings.animations) { setStep(BOOT_LINES.length); setCh(0); return; }
    const iv = window.setInterval(() => {
      setCh(c => {
        const target = BOOT_LINES[step] || '';
        if (c < target.length) return c + 2;
        return c;
      });
    }, 24);
    return () => window.clearInterval(iv);
  }, [step, g.player.settings.animations]);

  useEffect(() => {
    if (step >= BOOT_LINES.length) { setReady(true); return; }
    const target = BOOT_LINES[step] || '';
    if (ch >= target.length) {
      const t = window.setTimeout(() => setStep(s => s + 1), 260);
      return () => window.clearTimeout(t);
    }
  }, [ch, step]);

  const enter = () => {
    if (entered.current) return;
    entered.current = true;
    initAudio(g.player.settings.sfxVolume, g.player.settings.musicVolume);
    play('boot');
    if (g.player.settings.musicVolume > 0 && !isMusicOn()) startMusic();
    g.nav('menu');
  };

  const skipped = step >= BOOT_LINES.length;

  return (
    <div className="boot-wrap">
      <ParticlesField enabled={g.player.settings.animations} density={1.1} speed={0.9} />
      <div className="boot-core">
        <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
        <div className="orb" />
      </div>
      <div className="boot-lines">
        {BOOT_LINES.slice(0, step).map((l, i) => (
          <div key={i} style={{ opacity: 0.9 }}>{l}</div>
        ))}
        {step < BOOT_LINES.length && <div className="dlg-cursor">{BOOT_LINES[step].slice(0, ch)}</div>}
      </div>
      {!skipped && (
        <button className="nxbtn ghost small" style={{ position: 'absolute', top: 26, right: 30 }} onClick={() => { setStep(BOOT_LINES.length); setCh(0); play('click'); }}>
          跳过初始化 ⏭
        </button>
      )}
      {ready && (
        <>
          <div className="boot-title">代码修复局：NEXUS</div>
          <div className="boot-sub">CODE REPAIR: NEXUS // 在代码崩坏的世界中，寻找数字生命的真相</div>
          <button className="nxbtn primary pulse boot-enter" onClick={enter}>ENTER NEXUS</button>
        </>
      )}
      <div className="boot-foot">v0.1.0 DEMO — 序章 + 第一章 · 本地 Pyodide 运行，无需后端</div>
    </div>
  );
}
