import { useEffect, useState } from 'react';

export interface BossAvatarProps {
  /** 当前阶段（0 起） */
  phase: number;
  /** 血量百分比 0..100 */
  hpPct: number;
  /** 受击计数：变化即播放一次受击动画 */
  hitKey: number;
  /** 阶段击破（防御破裂） */
  broken?: boolean;
  /** 整场击破 */
  defeated?: boolean;
  codename: string;
}

const PHASE_COLORS = ['#42D6D0', '#F3B75C', '#C9A7FF', '#FF5B64'];

/**
 * Boss「立绘」：纯 SVG 全息构造体（闸门守卫）。
 * 无外部图片资源，随阶段换色，受击抖动、破裂闪烁、击破坍塌。
 */
export default function BossAvatar({ phase, hpPct, hitKey, broken, defeated, codename }: BossAvatarProps) {
  const [hit, setHit] = useState(false);

  useEffect(() => {
    if (!hitKey) return;
    setHit(true);
    const t = window.setTimeout(() => setHit(false), 420);
    return () => window.clearTimeout(t);
  }, [hitKey]);

  const color = PHASE_COLORS[Math.min(phase, PHASE_COLORS.length - 1)];
  const dim = hpPct <= 0;

  return (
    <div
      className={
        'boss-avatar phase-' + phase +
        (hit ? ' is-hit' : '') +
        (broken ? ' is-broken' : '') +
        (defeated || dim ? ' is-down' : '')
      }
      style={{ ['--boss-color' as string]: color }}
      aria-label={'Boss ' + codename}
    >
      <svg viewBox="0 0 240 240" className="boss-svg">
        <defs>
          <radialGradient id="gateCore" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="42%" stopColor={color} />
            <stop offset="100%" stopColor="#04101A" />
          </radialGradient>
          <linearGradient id="gateBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* 外层旋转环 */}
        <g className="gate-rings">
          <circle cx="120" cy="120" r="106" className="ring ring-1" />
          <circle cx="120" cy="120" r="92" className="ring ring-2" />
        </g>

        {/* 闸门立柱 */}
        <g className="gate-pillars">
          <rect x="40" y="66" width="14" height="108" rx="7" className="pillar" />
          <rect x="186" y="66" width="14" height="108" rx="7" className="pillar" />
        </g>

        {/* 六边形骨架 */}
        <polygon points="120,36 190,78 190,162 120,204 50,162 50,78" className="hex" />
        <polygon points="120,62 168,90 168,150 120,178 72,150 72,90" className="hex-inner" />

        {/* 能量横梁（随阶段减少） */}
        <g className="gate-bars">
          <rect x="78" y="96" width="84" height="5" rx="2.5" className="bar" />
          <rect x="78" y="139" width="84" height="5" rx="2.5" className="bar" />
        </g>

        {/* 核心 */}
        <circle cx="120" cy="120" r="34" fill="url(#gateCore)" className="core" />
        <circle cx="120" cy="120" r="34" className="core-ring" />
        <text x="120" y="120" textAnchor="middle" dominantBaseline="central" className="core-mark">
          {codename.replace('-', '')}
        </text>

        {/* 轨道节点 */}
        <g className="gate-nodes">
          <circle cx="120" cy="26" r="4" className="node" />
          <circle cx="206" cy="120" r="4" className="node" />
          <circle cx="120" cy="214" r="4" className="node" />
          <circle cx="34" cy="120" r="4" className="node" />
        </g>

        {/* 破裂裂纹（阶段击破时短暂出现） */}
        <g className="gate-cracks">
          <path d="M92 78 L120 118 L104 150" className="crack" />
          <path d="M150 84 L126 120 L146 156" className="crack" />
        </g>
      </svg>
      <div className="boss-avatar-shadow" />
    </div>
  );
}
