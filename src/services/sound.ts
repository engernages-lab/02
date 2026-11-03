// 音效系统：Web Audio 实时合成，不依赖外部音频文件
export type SfxName =
  | 'click' | 'hover' | 'boot' | 'run' | 'success' | 'error' | 'warning' | 'alarm'
  | 'threat' | 'shield' | 'levelup' | 'unlock' | 'death' | 'rebirth' | 'deny' | 'type';

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicOn = false;
let musicTimer: number | null = null;

export function initAudio(sfxVol = 0.6, musicVol = 0.35) {
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      sfxGain = ctx.createGain();
      sfxGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.connect(ctx.destination);
      sfxGain.gain.value = sfxVol;
      musicGain.gain.value = musicVol * 0.45;
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function setVolumes(sfx: number, music: number) {
  if (sfxGain && ctx) sfxGain.gain.setTargetAtTime(sfx, ctx.currentTime, 0.05);
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(music * 0.45, ctx.currentTime, 0.05);
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, opts?: { slideTo?: number; delay?: number }) {
  if (!ctx || !sfxGain) return;
  try {
    const t0 = ctx.currentTime + (opts?.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (opts?.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch { /* ignore */ }
}

function noise(dur: number, vol: number, opts?: { delay?: number }) {
  if (!ctx || !sfxGain) return;
  try {
    const t0 = ctx.currentTime + (opts?.delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(g);
    g.connect(sfxGain);
    src.start(t0);
  } catch { /* ignore */ }
}

export function play(name: SfxName) {
  if (!ctx || !sfxGain) return;
  switch (name) {
    case 'click': tone(1500, 0.05, 'square', 0.07); break;
    case 'hover': tone(2200, 0.02, 'sine', 0.015); break;
    case 'boot': tone(110, 0.5, 'sawtooth', 0.06, { slideTo: 660 }); tone(880, 0.35, 'sine', 0.05, { delay: 0.2, slideTo: 1320 }); break;
    case 'run': tone(320, 0.12, 'square', 0.05, { slideTo: 480 }); break;
    case 'success': tone(523, 0.14, 'sine', 0.15); tone(659, 0.14, 'sine', 0.15, { delay: 0.1 }); tone(784, 0.24, 'sine', 0.15, { delay: 0.2 }); break;
    case 'error': tone(220, 0.28, 'sawtooth', 0.09, { slideTo: 110 }); break;
    case 'warning': tone(880, 0.12, 'square', 0.09); tone(880, 0.12, 'square', 0.09, { delay: 0.16 }); break;
    case 'alarm':
      for (let i = 0; i < 5; i++) tone(i % 2 ? 660 : 440, 0.12, 'square', 0.11, { delay: i * 0.14 });
      break;
    case 'threat': tone(110, 1.0, 'sawtooth', 0.13, { slideTo: 50 }); tone(440, 0.9, 'square', 0.05, { slideTo: 880 }); noise(0.7, 0.05); break;
    case 'shield': tone(392, 0.1, 'sine', 0.14); tone(523, 0.1, 'sine', 0.14, { delay: 0.08 }); tone(659, 0.22, 'sine', 0.14, { delay: 0.16 }); break;
    case 'levelup':
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.17, 'triangle', 0.13, { delay: i * 0.09 }));
      break;
    case 'unlock': tone(523, 0.12, 'sine', 0.13); tone(784, 0.18, 'sine', 0.13, { delay: 0.1 }); tone(1046, 0.32, 'sine', 0.11, { delay: 0.22 }); break;
    case 'death': tone(220, 1.2, 'sawtooth', 0.15, { slideTo: 40 }); noise(1.1, 0.09); break;
    case 'rebirth': tone(220, 0.5, 'sine', 0.09); tone(330, 0.6, 'sine', 0.08, { delay: 0.4 }); tone(440, 0.9, 'sine', 0.07, { delay: 0.9 }); break;
    case 'deny': tone(180, 0.18, 'square', 0.09); tone(140, 0.22, 'square', 0.09, { delay: 0.12 }); break;
    case 'type': tone(2400, 0.012, 'sine', 0.012); break;
  }
}

/** 氛围音乐：循环的柔和合成器垫（跟随设置音量） */
export function startMusic() {
  if (!ctx || !musicGain || musicOn) return;
  musicOn = true;
  const freqs = [110, 164.81, 220, 329.63];
  const layer = () => {
    if (!ctx || !musicGain) return;
    const t0 = ctx.currentTime;
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.09, t0 + 1.8);
      g.gain.linearRampToValueAtTime(0.0001, t0 + 4.2);
      osc.connect(g);
      g.connect(musicGain);
      osc.start(t0);
      osc.stop(t0 + 4.5);
    }
  };
  layer();
  musicTimer = window.setInterval(layer, 4200);
}

export function stopMusic() {
  musicOn = false;
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function isMusicOn() { return musicOn; }
