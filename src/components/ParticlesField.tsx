import { useEffect, useRef } from 'react';

export interface ParticlesFieldProps {
  className?: string;
  density?: number;
  speed?: number;
  colors?: string[];
  converge?: boolean;
  enabled?: boolean;
  max?: number;
}

const DEF_COLORS = ['#42D6D0', '#3986C8', '#35D39A', '#8FB0C9', '#F3B75C'];

interface P { x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number; c: string }

export default function ParticlesField({
  className, density = 1, speed = 1, colors = DEF_COLORS, converge = false, enabled = true, max = 120,
}: ParticlesFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const convergeRef = useRef(converge);
  convergeRef.current = converge;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let parts: P[] = [];
    let w = 0, h = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent ? parent.clientWidth : window.innerWidth;
      h = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = w; canvas.height = h;
      const count = Math.min(max, Math.max(12, Math.round((w * h) / 13000) * density));
      if (count !== parts.length) {
        parts = [];
        for (let i = 0; i < count; i++) {
          parts.push({
            x: Math.random() * w, y: Math.random() * h,
            r: 0.8 + Math.random() * 2.2,
            vx: (Math.random() - 0.5) * 0.35 * speed,
            vy: (-0.15 - Math.random() * 0.4) * speed,
            a: 0.25 + Math.random() * 0.6,
            tw: Math.random() * 6.28,
            c: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!enabledRef.current) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (const p of parts) {
        p.tw += 0.02;
        if (convergeRef.current) {
          const dx = cx - p.x, dy = cy - p.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          p.vx = (dx / d) * 1.1 * speed;
          p.vy = (dy / d) * 1.1 * speed;
          p.x += p.vx; p.y += p.vy;
          p.a = Math.max(0.05, 0.9 - d / 600);
        } else {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
          if (p.x < -8) p.x = w + 8;
          if (p.x > w + 8) p.x = -8;
        }
        ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(p.tw));
        ctx.fillStyle = p.c;
        ctx.shadowColor = p.c;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };
    raf = requestAnimationFrame(tick);

    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [density, speed, max, colors]);

  return <canvas ref={ref} className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
