import type { SceneBg } from '../game/lore/types';

/**
 * 剧情演出插画层（视觉小说式背景画面）
 *
 * 本版按用户指定的三个 prompt 重画：
 *   1. 停机层：低角度「赛博朋克峡谷」——服务器塔如山脉高耸、窗格高密度、
 *      粗电缆像瀑布垂落、正中央一道红橙数据光柱直冲雾顶、前景微型无人机交代尺度。
 *   2. 数据世界：星门级巨环主导天空，下方多层赛博城市，青蓝 + 品红环境光，
 *      前景极小人物剪影仰望巨环。
 *   3. 撤离通道：一点透视的深邃合金通道，尽头发光方形终端，强烈的体积光与幽闭感。
 *
 * 实现方式：纯矢量（SVG）。所有光效靠径向/线性渐变叠高斯模糊，
 * 窗格靠 <pattern> 平铺再叠计算出的"偶发亮窗"，因此不需要任何外部图片。
 *
 * 后续接入混元生图时：把 scene_*.png 放进 public/art/ 并登记到 SCENE_ART_OVERRIDE，
 * 矢量画面自动退为兜底。
 */

/** 可选的位图覆盖：存在真实生成图时优先使用 */
const SCENE_ART_OVERRIDE: Partial<Record<SceneBg, string>> = {};

const T = {
  deep: '#03070C',
  tower: '#061019',
  teal: '#42D6D0',
  pale: '#8FDDE3',
  mint: '#BDF7E1',
  blue: '#3986C8',
  sky: '#6FB7E8',
  violet: '#C9A7FF',
  amber: '#F3B75C',
  ember: '#FF6B3D',
  rose: '#FF6FA0',
  hot: '#FFD9C0',
};

/** 确定性伪随机（不用 Math.random，保证每次渲染一致） */
const rnd = (i: number, seed = 1) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/* ───────────────────────────── 通用定义 ───────────────────────────── */

function Defs({ uid, warm }: { uid: string; warm?: 'violet' | 'amber' | 'green' }) {
  const accent = warm === 'violet' ? T.violet : warm === 'amber' ? T.amber : warm === 'green' ? T.mint : T.teal;

  /** 窗格图案：不同尺度对应不同景深 */
  const winPattern = (id: string, w: number, h: number, c1: string, c2: string, o: number) => (
    <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
      <rect x={w * 0.14} y={h * 0.16} width={w * 0.28} height={h * 0.13} fill={c1} opacity={o} />
      <rect x={w * 0.58} y={h * 0.17} width={w * 0.2} height={h * 0.1} fill={c2} opacity={o * 0.6} />
      <rect x={w * 0.16} y={h * 0.52} width={w * 0.2} height={h * 0.1} fill={c2} opacity={o * 0.55} />
      <rect x={w * 0.54} y={h * 0.54} width={w * 0.26} height={h * 0.12} fill={c1} opacity={o * 0.8} />
      <rect x={w * 0.34} y={h * 0.82} width={w * 0.16} height={h * 0.07} fill={c2} opacity={o * 0.35} />
    </pattern>
  );

  return (
    <defs>
      {winPattern(`${uid}-win-cyan`, 20, 26, T.mint, T.sky, 0.46)}
      {winPattern(`${uid}-win-far`, 13, 17, T.pale, T.sky, 0.28)}
      {winPattern(`${uid}-win-amber`, 20, 26, T.amber, T.ember, 0.42)}
      {winPattern(`${uid}-win-violet`, 20, 26, T.violet, T.rose, 0.38)}

      {/* 伪厚涂：噪声位移打散边缘 + 高斯模糊 */}
      <filter id={`${uid}-paint`} x="-35%" y="-35%" width="170%" height="170%">
        <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation="18" />
      </filter>
      <filter id={`${uid}-blur`} x="-45%" y="-45%" width="190%" height="190%">
        <feGaussianBlur stdDeviation="26" />
      </filter>
      <filter id={`${uid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <filter id={`${uid}-glow`} x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="7" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${uid}-grain`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="11" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.6" />
        </feComponentTransfer>
      </filter>

      <radialGradient id={`${uid}-vig`} cx="50%" cy="42%" r="74%">
        <stop offset="0%" stopColor={T.deep} stopOpacity="0" />
        <stop offset="58%" stopColor={T.deep} stopOpacity="0.26" />
        <stop offset="100%" stopColor={T.deep} stopOpacity="0.95" />
      </radialGradient>
      <radialGradient id={`${uid}-halo`}>
        <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
        <stop offset="45%" stopColor={accent} stopOpacity="0.16" />
        <stop offset="100%" stopColor={accent} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-ember`}>
        <stop offset="0%" stopColor={T.ember} stopOpacity="0.5" />
        <stop offset="48%" stopColor={T.ember} stopOpacity="0.14" />
        <stop offset="100%" stopColor={T.ember} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-rose`}>
        <stop offset="0%" stopColor={T.rose} stopOpacity="0.34" />
        <stop offset="60%" stopColor={T.violet} stopOpacity="0.09" />
        <stop offset="100%" stopColor={T.violet} stopOpacity="0" />
      </radialGradient>
      {/* 环状渐变：青绿 → 暖橙 → 品红 */}
      <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={T.mint} stopOpacity="1" />
        <stop offset="36%" stopColor={T.pale} stopOpacity="0.6" />
        <stop offset="66%" stopColor={T.ember} stopOpacity="0.95" />
        <stop offset="100%" stopColor={T.rose} stopOpacity="0.8" />
      </linearGradient>
      <radialGradient id={`${uid}-core`}>
        <stop offset="0%" stopColor={T.ember} stopOpacity="0.55" />
        <stop offset="34%" stopColor={T.amber} stopOpacity="0.18" />
        <stop offset="66%" stopColor={T.teal} stopOpacity="0.1" />
        <stop offset="100%" stopColor={T.deep} stopOpacity="0" />
      </radialGradient>
      {/* 中央冲天光柱：底部最亮，向上递减并略微散开 */}
      <linearGradient id={`${uid}-beam`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor={T.hot} stopOpacity="0.95" />
        <stop offset="18%" stopColor={T.ember} stopOpacity="0.85" />
        <stop offset="55%" stopColor={T.ember} stopOpacity="0.34" />
        <stop offset="100%" stopColor={T.amber} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${uid}-shaft`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={T.mint} stopOpacity="0.26" />
        <stop offset="45%" stopColor={T.teal} stopOpacity="0.08" />
        <stop offset="100%" stopColor={T.teal} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${uid}-fogband`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={T.pale} stopOpacity="0" />
        <stop offset="50%" stopColor={T.pale} stopOpacity="0.16" />
        <stop offset="100%" stopColor={T.pale} stopOpacity="0" />
      </linearGradient>
      {/* 底部 UI 安全区：把下缘压黑，保证台词框压得住字 */}
      <linearGradient id={`${uid}-bottom`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={T.deep} stopOpacity="0" />
        <stop offset="55%" stopColor={T.deep} stopOpacity="0.55" />
        <stop offset="100%" stopColor={T.deep} stopOpacity="0.96" />
      </linearGradient>
      <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0D1B2B" />
        <stop offset="55%" stopColor="#08121D" />
        <stop offset="100%" stopColor="#050D16" />
      </linearGradient>
      <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0A141F" />
        <stop offset="42%" stopColor="#0D1926" />
        <stop offset="100%" stopColor="#050B12" />
      </linearGradient>
    </defs>
  );
}

/** 厚涂色块 */
function Wash({
  uid, cx, cy, rx, ry, color, opacity = 0.2,
}: { uid: string; cx: number; cy: number; rx: number; ry: number; color: string; opacity?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} opacity={opacity} filter={`url(#${uid}-paint)`} />;
}

/** 单栋塔：暗体块 + 窗格 + 竖向分格 + 偶发亮窗 + 顶部退台 + 边缘棱光 */
function Tower({
  uid, x, y, w, h, tone = 'cyan', opacity = 1, neon, cap, dense = 1,
}: {
  uid: string; x: number; y: number; w: number; h: number;
  tone?: 'cyan' | 'amber' | 'violet' | 'far'; opacity?: number; neon?: boolean; cap?: boolean; dense?: number;
}) {
  const pat = tone === 'far' ? `${uid}-win-far` : tone === 'amber' ? `${uid}-win-amber` : tone === 'violet' ? `${uid}-win-violet` : `${uid}-win-cyan`;
  const neonColor = tone === 'amber' ? T.amber : tone === 'violet' ? T.rose : T.mint;
  const seed = ((x * 0.37 + y * 0.11 + w * 0.53) % 97) + 1;
  const mull = 20 + (seed % 12);
  const nWin = Math.floor((w * Math.min(h, 520) * dense) / (tone === 'far' ? 6000 : 2400));
  const antenna = rnd(0, seed + 17) > 0.4;

  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} fill={T.tower} />
      <rect x={x} y={y} width={w} height={h} fill={`url(#${pat})`} />
      {Array.from({ length: Math.max(0, Math.floor(w / mull)) }, (_, i) => (
        <rect key={`m${i}`} x={x + i * mull + mull * 0.55} y={y} width={2.2} height={h} fill="#02060A" opacity={0.42} />
      ))}
      {Array.from({ length: nWin }, (_, i) => {
        const bright = rnd(i, seed + 11) > 0.72;
        return (
          <rect
            key={`w${i}`}
            x={x + 4 + rnd(i, seed) * Math.max(2, w - 10)}
            y={y + 6 + rnd(i, seed + 3) * Math.max(2, Math.min(h, 800) - 12)}
            width={2.4 + rnd(i, seed + 7) * 4}
            height={2}
            fill={bright ? (rnd(i, seed + 19) > 0.6 ? T.amber : T.mint) : T.sky}
            opacity={bright ? 0.45 + rnd(i, seed + 23) * 0.45 : 0.12 + rnd(i, seed + 29) * 0.18}
          />
        );
      })}
      <rect x={x + w * 0.16} y={y - 18} width={w * 0.68} height="18" fill={T.tower} />
      <rect x={x + w * 0.16} y={y - 18} width={w * 0.68} height="2" fill={T.pale} opacity="0.22" />
      {antenna && (
        <g>
          <line x1={x + w * 0.5} y1={y - 18} x2={x + w * 0.5} y2={y - 30 - rnd(1, seed) * 60} stroke="#02060A" strokeWidth="2" />
          <circle cx={x + w * 0.5} cy={y - 30 - rnd(1, seed) * 60} r="1.8" fill={T.ember} opacity="0.7" />
        </g>
      )}
      <line x1={x + 1} y1={y} x2={x + 1} y2={y + h} stroke={T.pale} strokeWidth="1.6" strokeOpacity="0.2" />
      <line x1={x + w - 1} y1={y} x2={x + w - 1} y2={y + h} stroke={T.teal} strokeWidth="1.2" strokeOpacity="0.12" />
      {neon && (
        <line x1={x + w * 0.72} y1={y + 10} x2={x + w * 0.72} y2={y + h - 8}
          stroke={neonColor} strokeWidth="2.4" strokeOpacity="0.5" filter={`url(#${uid}-glow)`} />
      )}
      {cap && <rect x={x} y={y - 21} width={w} height="3" fill={T.mint} opacity="0.26" filter={`url(#${uid}-soft)`} />}
    </g>
  );
}

/** 塔群 */
function Skyline({
  uid, seed, count, baseY, hMin, hMax, tone = 'far', opacity = 0.7, neonChance = 0, from = -60, to = 1660, dense = 1,
}: {
  uid: string; seed: number; count: number; baseY: number; hMin: number; hMax: number;
  tone?: 'cyan' | 'amber' | 'violet' | 'far'; opacity?: number; neonChance?: number; from?: number; to?: number; dense?: number;
}) {
  const span = to - from;
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, i) => {
        const w = (span / count) * (0.5 + rnd(i, seed) * 0.9);
        const x = from + (span / count) * i + rnd(i, seed + 1) * 24;
        const h = hMin + rnd(i, seed + 2) * (hMax - hMin);
        return (
          <Tower
            key={i} uid={uid} x={x} y={baseY - h} w={w} h={h + 140}
            tone={tone} neon={rnd(i, seed + 5) < neonChance} cap={rnd(i, seed + 6) < 0.3} dense={dense}
          />
        );
      })}
    </g>
  );
}

/** 瀑布状垂落电缆：粗缆 + 细缆混合，带轻微弧度与棱光 */
function CableFall({
  uid, seed, count, top = -60, bottom = 700, spread = 1600, thick = 1, opacity = 0.95, curve = 90,
}: { uid: string; seed: number; count: number; top?: number; bottom?: number; spread?: number; thick?: number; opacity?: number; curve?: number }) {
  return (
    <g opacity={opacity} fill="none">
      {Array.from({ length: count }, (_, i) => {
        const x = (spread / count) * i + rnd(i, seed) * (spread / count) * 0.9 - 40;
        const len = (bottom - top) * (0.55 + rnd(i, seed + 2) * 0.5);
        const endY = top + len;
        const dx = (rnd(i, seed + 3) - 0.5) * curve;
        const w = (0.8 + rnd(i, seed + 4) * 4.2) * thick;
        const d = `M${x} ${top} C${x + dx * 0.4} ${top + len * 0.35} ${x + dx} ${top + len * 0.7} ${x + dx * 0.6} ${endY}`;
        return (
          <g key={i}>
            <path d={d} stroke="#01050A" strokeWidth={w} strokeLinecap="round" />
            <path d={d} stroke={rnd(i, seed + 5) > 0.7 ? T.ember : T.teal} strokeWidth={w * 0.28} strokeOpacity="0.4" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
}

/** 浮尘 / 星点 */
function Motes({ uid, n = 60, seed = 3, color = T.pale, yMax = 780 }: { uid: string; n?: number; seed?: number; color?: string; yMax?: number }) {
  return (
    <g filter={`url(#${uid}-glow)`} opacity="0.65">
      {Array.from({ length: n }, (_, i) => {
        const x = 20 + rnd(i, seed) * 1560;
        const y = 20 + rnd(i, seed + 5) * yMax;
        const r = 0.7 + rnd(i, seed + 9) * 2.2;
        const o = 0.16 + rnd(i, seed + 13) * 0.55;
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} />;
      })}
    </g>
  );
}

/** 雾带 */
function FogBand({ uid, y, h, x = 0, w = 1600, opacity = 0.8 }: { uid: string; y: number; h: number; x?: number; w?: number; opacity?: number }) {
  return <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-fogband)`} opacity={opacity} filter={`url(#${uid}-paint)`} />;
}

/** 微型无人机剪影（前景，用于交代巨大尺度） */
function Drone({ uid, x, y, scale = 1, flip = 1, blur = false }: { uid: string; x: number; y: number; scale?: number; flip?: number; blur?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * flip} ${scale})`} opacity={blur ? 0.5 : 0.95} filter={blur ? `url(#${uid}-soft)` : undefined}>
      {/* 机身 */}
      <path d="M-9 0 L-3 -4 L3 -4 L9 0 L3 4 L-3 4 Z" fill="#01050A" />
      {/* 四轴臂 + 旋翼 */}
      {[[-12, -10], [12, -10], [-12, 10], [12, 10]].map(([dx, dy], i) => (
        <g key={i}>
          <line x1="0" y1="0" x2={dx} y2={dy} stroke="#01050A" strokeWidth="1.8" />
          <ellipse cx={dx} cy={dy} rx="7" ry="1.8" fill={T.pale} opacity="0.22" />
          <circle cx={dx} cy={dy} r="1.2" fill={T.mint} opacity="0.8" />
        </g>
      ))}
      {/* 云台与导航灯 */}
      <circle cx="0" cy="3" r="2.4" fill="#01050A" />
      <circle cx="3.4" cy="-2" r="1.1" fill={T.ember} opacity="0.9" filter={`url(#${uid}-glow)`} />
      <circle cx="-3.4" cy="-2" r="1" fill={T.mint} opacity="0.8" />
    </g>
  );
}

/** 极小的人形剪影（用于巨大尺度对比，背光轮廓） */
function Figure({ uid, x, y, h = 62 }: { uid: string; x: number; y: number; h?: number }) {
  const s = h / 62;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* 身体 */}
      <path d="M-6 0 L-8 -16 L-5 -30 L5 -30 L8 -16 L6 0 Z" fill="#01050A" />
      {/* 头 */}
      <circle cx="0" cy="-37" r="6.4" fill="#01050A" />
      {/* 腿 */}
      <path d="M-5 0 L-6 22 L-1 22 L0 4 L1 22 L6 22 L5 0 Z" fill="#01050A" />
      {/* 背光轮廓 */}
      <path d="M8 -16 L5 -30 L0 -30" stroke={T.pale} strokeWidth="1.2" strokeOpacity="0.5" fill="none" filter={`url(#${uid}-glow)`} />
      <circle cx="6" cy="-38" r="6" stroke={T.pale} strokeWidth="1" strokeOpacity="0.35" fill="none" />
    </g>
  );
}

/* ═══════════ 场景一：地下服务器 · 停机层（服务器峡谷 · 冲天光柱） ═══════════ */

/** 粗野主义服务器巨构：倾斜透视的体块 + 深竖槽 + 横向挑檐 + 稀疏窗槽 + 面向核心的棱光 */
function MegaBlock({
  uid, x, y, w, h, lean = 0, dir = 1, opacity = 1,
}: {
  uid: string; x: number; y: number; w: number; h: number; lean?: number; dir?: 1 | -1; opacity?: number;
}) {
  const bottom = y + h;
  const topL = x + lean * 0.55;
  const topR = x + w + lean;
  const nGroove = Math.max(4, Math.round(w / 56));
  const seed = ((x * 0.31 + w * 0.7) % 89) + 1;
  const ledges = [0.14, 0.3, 0.47, 0.64, 0.81];

  return (
    <g opacity={opacity}>
      <path d={`M${x} ${bottom} L${x + w} ${bottom} L${topR} ${y} L${topL} ${y} Z`} fill="#04090F" />
      {/* 深竖槽 */}
      {Array.from({ length: nGroove - 1 }, (_, i) => {
        const t = (i + 1) / nGroove;
        const bx = x + w * t;
        const tx = topL + (topR - topL) * t;
        return (
          <g key={i}>
            <line x1={bx} y1={bottom} x2={tx} y2={y} stroke="#01050A" strokeWidth={7 + rnd(i, seed) * 7} opacity="0.92" />
            <line x1={bx + 5} y1={bottom} x2={tx + 5} y2={y} stroke={T.teal} strokeWidth="2" opacity="0.16" />
          </g>
        );
      })}
      {/* 横向挑檐 */}
      {ledges.map((f, i) => {
        const yl = y + h * f;
        const t = 1 - f;
        const lx = x + (topL - x) * t;
        const rx = x + w + (topR - x - w) * t;
        return (
          <g key={i}>
            <rect x={lx - 7} y={yl} width={rx - lx + 14} height="11" fill="#020810" opacity="0.95" />
            <rect x={lx - 7} y={yl} width={rx - lx + 14} height="2.4" fill={T.pale} opacity="0.13" />
            <rect x={lx - 7} y={yl + 11} width={rx - lx + 14} height="3" fill="#01050A" opacity="0.9" />
          </g>
        );
      })}
      {/* 稀疏窗槽（只朝核心一侧） */}
      {Array.from({ length: Math.max(5, Math.round(w / 70)) }, (_, i) => {
        const fy = 0.08 + rnd(i, seed + 3) * 0.84;
        const yl = y + h * fy;
        const t = 1 - fy;
        const lx = x + (topL - x) * t;
        const rx = x + w + (topR - x - w) * t;
        const ww = 14 + rnd(i, seed + 5) * 48;
        const px = dir > 0 ? rx - ww - 14 : lx + 14;
        return (
          <rect key={i} x={px} y={yl + 7} width={ww} height="3.6"
            fill={rnd(i, seed + 9) > 0.72 ? T.amber : T.mint} opacity={0.26 + rnd(i, seed + 11) * 0.32} />
        );
      })}
      {/* 霓虹竖缝：避免整块体量过黑 */}
      <line
        x1={dir > 0 ? x + w * 0.8 : x + w * 0.2} y1={bottom}
        x2={topL + (topR - topL) * (dir > 0 ? 0.8 : 0.2)} y2={y}
        stroke={T.amber} strokeWidth="4" strokeOpacity="0.24" filter={`url(#${uid}-glow)`}
      />
      {/* 面向核心的暖色棱光 */}
      <line
        x1={dir > 0 ? x + w : x} y1={bottom}
        x2={dir > 0 ? topR : topL} y2={y}
        stroke={T.ember} strokeWidth="3.2" strokeOpacity="0.55" filter={`url(#${uid}-glow)`}
      />
      <line x1={topL} y1={y} x2={topR} y2={y} stroke={T.pale} strokeWidth="2" strokeOpacity="0.24" />
    </g>
  );
}

/** 塔间悬垂的电缆束：有机弧垂（catenary），带朝向核心的暖色轮廓光 */
function CableSpan({
  uid, seed, count, x0, x1, y0, y1, sag = 140, thick = 3, opacity = 1, warm = false,
}: {
  uid: string; seed: number; count: number; x0: number; x1: number; y0: number; y1: number;
  sag?: number; thick?: number; opacity?: number; warm?: boolean;
}) {
  return (
    <g opacity={opacity} fill="none">
      {Array.from({ length: count }, (_, i) => {
        const ax = x0 + (rnd(i, seed) - 0.3) * 90;
        const bx = x1 + (rnd(i, seed + 2) - 0.7) * 100;
        const ay = y0 + rnd(i, seed + 4) * 220;
        const by = y1 + rnd(i, seed + 6) * 220;
        const s = sag * (0.55 + rnd(i, seed + 8) * 0.9);
        const w = thick * (0.6 + rnd(i, seed + 10) * 1.1);
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2 + s;
        const d = `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`;
        const rim = warm ? T.ember : T.teal;
        return (
          <g key={i}>
            <path d={d} stroke="#01050A" strokeWidth={w} strokeLinecap="round" />
            <path d={d} stroke={rim} strokeWidth={w * 0.32} strokeOpacity={0.44} strokeLinecap="round" />
            {/* 顶部轮廓光 */}
            <path d={`M${ax} ${ay - w * 0.55} Q${mx} ${my - w * 0.55} ${bx} ${by - w * 0.55}`}
              stroke={T.hot} strokeWidth="0.9" strokeOpacity={warm ? 0.5 : 0.16} />
          </g>
        );
      })}
    </g>
  );
}

/** 中央数据核心：分层辉光 + 环状结构 + 辐射光束 + 悬浮数据碎片 */
function DataCore({ uid, cx, cy }: { uid: string; cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={340} ry={330} fill={`url(#${uid}-ember)`} opacity="0.9" />
      <circle cx={cx} cy={cy} r={205} fill={`url(#${uid}-ember)`} opacity="0.8" />
      <circle cx={cx} cy={cy} r={106} fill={T.ember} opacity="0.55" filter={`url(#${uid}-blur)`} />
      <circle cx={cx} cy={cy} r={58} fill="#FFB07A" opacity="0.82" filter={`url(#${uid}-soft)`} />
      <circle cx={cx} cy={cy} r={21} fill="#FFF4EC" opacity="0.95" filter={`url(#${uid}-glow)`} />
      {/* 环状结构 */}
      <ellipse cx={cx} cy={cy} rx={172} ry={47} fill="none" stroke={T.amber} strokeOpacity="0.5" strokeWidth="3"
        transform={`rotate(-12 ${cx} ${cy})`} />
      <ellipse cx={cx} cy={cy} rx={142} ry={39} fill="none" stroke={T.hot} strokeOpacity="0.3" strokeWidth="1.6"
        transform={`rotate(24 ${cx} ${cy})`} />
      {/* 辐射光束 */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + 0.2;
        const r2 = 190 + rnd(i, 7) * 190;
        return (
          <line key={i} x1={cx + Math.cos(a) * 32} y1={cy + Math.sin(a) * 32}
            x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
            stroke={T.amber} strokeWidth={1 + rnd(i, 11) * 2.4} strokeOpacity={0.09 + rnd(i, 13) * 0.15} />
        );
      })}
      {/* 悬浮数据碎片 */}
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={cx - 260 + rnd(i, 17) * 520} y={cy - 240 + rnd(i, 19) * 480}
          width={2 + rnd(i, 21) * 5} height={2 + rnd(i, 23) * 3} fill={T.hot} opacity={0.18 + rnd(i, 25) * 0.4} />
      ))}
    </g>
  );
}

function Underground({ uid }: { uid: string }) {
  return (
    <g>
      {/* 空气与两色光场（核心偏右，制造非对称） */}
      <Wash uid={uid} cx={900} cy={500} rx={600} ry={450} color={T.ember} opacity={0.3} />
      <Wash uid={uid} cx={160} cy={280} rx={560} ry={480} color={T.teal} opacity={0.17} />
      <Wash uid={uid} cx={1480} cy={420} rx={440} ry={440} color={T.blue} opacity={0.15} />

      {/* 深处：雾中远景巨构轮廓 */}
      <Skyline uid={uid} seed={11} count={14} baseY={800} hMin={150} hMax={340} tone="far" opacity={0.2} from={-100} to={1700} />
      <FogBand uid={uid} y={440} h={300} opacity={1} />

      {/* 深处的电缆（在雾里，先画） */}
      <CableSpan uid={uid} seed={43} count={3} x0={-40} x1={1220} y0={120} y1={180} sag={200} thick={3} opacity={0.4} warm />

      {/* 中央发光数据核心 */}
      <DataCore uid={uid} cx={872} cy={464} />
      {/* 核心向雾里扩散的光雾 */}
      <ellipse cx={872} cy={470} rx={560} ry={440} fill={T.ember} opacity="0.2" filter={`url(#${uid}-paint)`} />
      <ellipse cx={872} cy={520} rx={380} ry={280} fill={T.hot} opacity="0.12" filter={`url(#${uid}-blur)`} />
      {/* 从核心射向两侧的光锥 */}
      <path d="M872 470 L-60 250 L-60 720 Z" fill={T.ember} opacity="0.06" filter={`url(#${uid}-blur)`} />
      <path d="M872 470 L1660 220 L1660 760 Z" fill={T.amber} opacity="0.05" filter={`url(#${uid}-blur)`} />

      {/* 左侧近景：粗野主义巨构（更大、更暗、更近） */}
      <MegaBlock uid={uid} x={-180} y={-220} w={560} h={1200} lean={86} dir={1} />
      <MegaBlock uid={uid} x={340} y={-70} w={310} h={1040} lean={52} dir={1} opacity={0.96} />
      <MegaBlock uid={uid} x={612} y={210} w={170} h={770} lean={26} dir={1} opacity={0.78} />

      {/* 右侧远景：巨构更小、更雾化 */}
      <MegaBlock uid={uid} x={1470} y={-180} w={400} h={1180} lean={-74} dir={-1} />
      <MegaBlock uid={uid} x={1180} y={-30} w={300} h={1020} lean={-52} dir={-1} opacity={0.9} />
      <MegaBlock uid={uid} x={1020} y={260} w={150} h={700} lean={-28} dir={-1} opacity={0.7} />

      {/* 塔间下垂的粗电缆束：长短、角度、粗细不一，数量克制不糊画面 */}
      <CableSpan uid={uid} seed={71} count={3} x0={-40} x1={1180} y0={30} y1={90} sag={330} thick={8} warm />
      <CableSpan uid={uid} seed={97} count={3} x0={30} x1={1270} y0={250} y1={300} sag={245} thick={4.6} />
      <CableSpan uid={uid} seed={131} count={4} x0={-20} x1={1330} y0={410} y1={465} sag={190} thick={3.2} warm />
      <CableSpan uid={uid} seed={167} count={4} x0={110} x1={1430} y0={545} y1={585} sag={150} thick={2.2} />
      <CableSpan uid={uid} seed={181} count={3} x0={700} x1={1260} y0={640} y1={670} sag={85} thick={2.8} warm />
      {/* 斜向电力线 */}
      {Array.from({ length: 4 }, (_, i) => (
        <line key={i} x1={-60 + rnd(i, 5) * 260} y1={110 + rnd(i, 7) * 470}
          x2={1180 + rnd(i, 9) * 380} y2={190 + rnd(i, 11) * 430}
          stroke="#01050A" strokeWidth={1.3 + rnd(i, 13) * 2.6} opacity="0.72" />
      ))}

      {/* 体积雾：核心方向更亮 */}
      <FogBand uid={uid} y={530} h={300} opacity={0.9} />
      <FogBand uid={uid} y={690} h={220} opacity={0.75} />

      {/* 前景：微型无人机（交代尺度，近处失焦） */}
      <Drone uid={uid} x={222} y={556} scale={3.6} blur />
      <Drone uid={uid} x={1326} y={512} scale={2.8} flip={-1} />
      <Drone uid={uid} x={1074} y={648} scale={2.2} blur />
      <Drone uid={uid} x={634} y={470} scale={1.2} flip={-1} />

      {/* 底部 UI 安全区 */}
      <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />

      <Motes uid={uid} n={90} seed={4} />
    </g>
  );
}

/* ═══════════ 场景二：NEXUS 数据世界（星门巨环 · 数据之城） ═══════════ */

function Void({ uid }: { uid: string }) {
  const CX = 800;
  const CY = 296;

  return (
    <g>
      <Motes uid={uid} n={160} seed={17} yMax={660} />

      {/* 巨环背后的天光与星云 */}
      <circle cx={CX} cy={CY} r="520" fill={`url(#${uid}-halo)`} opacity="0.55" />
      <Wash uid={uid} cx={1180} cy={300} rx={380} ry={300} color={T.rose} opacity={0.16} />
      <Wash uid={uid} cx={330} cy={360} rx={360} ry={300} color={T.teal} opacity={0.14} />

      {/* 星门巨环 */}
      <circle cx={CX} cy={CY} r="318" fill="none" stroke={`url(#${uid}-ring)`} strokeWidth="20" filter={`url(#${uid}-glow)`} />
      <circle cx={CX} cy={CY} r="309" fill="none" stroke={T.pale} strokeOpacity="0.55" strokeWidth="2.4" />
      <circle cx={CX} cy={CY} r="328" fill="none" stroke={T.ember} strokeOpacity="0.3" strokeWidth="2.6" filter={`url(#${uid}-soft)`} />
      {/* 环内的结构：同心轨与刻度 */}
      <circle cx={CX} cy={CY} r="250" fill="none" stroke={T.pale} strokeOpacity="0.12" strokeWidth="1.4" />
      <circle cx={CX} cy={CY} r="180" fill="none" stroke={T.pale} strokeOpacity="0.1" strokeWidth="1.2" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2;
        const r1 = 300;
        const r2 = 318;
        return (
          <line key={i} x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1}
            x2={CX + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2}
            stroke={T.pale} strokeOpacity="0.3" strokeWidth="1.4" />
        );
      })}
      <ellipse cx={CX} cy={CY} rx="318" ry="86" fill="none" stroke={T.pale} strokeOpacity="0.2" strokeWidth="1.6" transform={`rotate(-14 ${CX} ${CY})`} />
      <ellipse cx={CX} cy={CY} rx="318" ry="86" fill="none" stroke={T.violet} strokeOpacity="0.2" strokeWidth="1.6" transform={`rotate(64 ${CX} ${CY})`} />

      {/* 远景 → 中景：多层数据之城 */}
      <Skyline uid={uid} seed={41} count={16} baseY={620} hMin={110} hMax={280} tone="far" opacity={0.34} from={-100} to={1700} />
      <FogBand uid={uid} y={500} h={200} opacity={0.85} />
      <Skyline uid={uid} seed={53} count={15} baseY={770} hMin={200} hMax={470} tone="cyan" opacity={0.85} neonChance={0.4} from={-80} to={1680} dense={1.2} />

      {/* 城市中的高架与数据块 */}
      {[
        { x: 150, y: 560, w: 320, h: 18 }, { x: 1090, y: 520, w: 360, h: 20 },
        { x: 420, y: 470, w: 200, h: 14 }, { x: 980, y: 630, w: 260, h: 16 },
      ].map((p, i) => (
        <g key={i}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#050D16" />
          <rect x={p.x} y={p.y} width={p.w} height="2.6" fill={i % 2 ? T.rose : T.mint} opacity="0.5" />
          {Array.from({ length: 4 }, (_, k) => (
            <rect key={k} x={p.x + 20 + k * (p.w / 4.4)} y={p.y + p.h} width="3" height={16 + k * 8} fill={T.teal} opacity="0.2" />
          ))}
        </g>
      ))}

      {/* 光缆 */}
      {[0, 1, 2].map(i => (
        <path key={i}
          d={`M-60 ${300 + i * 80} Q${CX} ${380 + i * 60} 1660 ${250 + i * 90}`}
          stroke={i === 1 ? T.violet : T.teal} strokeWidth="1.8" strokeOpacity="0.3" fill="none" filter={`url(#${uid}-glow)`} />
      ))}

      {/* 前景：横跨画面的高架检修走道 + 极小人物剪影，仰望巨环 */}
      <g>
        <path d="M300 612 L1240 612 L1300 664 L240 664 Z" fill="#01050A" />
        <rect x="300" y="606" width="940" height="6" fill={T.pale} opacity="0.22" />
        {Array.from({ length: 20 }, (_, i) => (
          <line key={i} x1={320 + i * 47} y1="612" x2={320 + i * 47} y2="580" stroke="#01050A" strokeWidth="3.4" />
        ))}
        <line x1="300" y1="580" x2="1240" y2="580" stroke={T.teal} strokeWidth="2.2" strokeOpacity="0.26" />
        {[380, 620, 860, 1100].map((x, i) => (
          <path key={i} d={`M${x} 664 L${x + 16} 960 L${x + 52} 960 L${x + 36} 664 Z`} fill="#01050A" opacity="0.96" />
        ))}
        <Figure uid={uid} x={748} y={588} h={72} />
      </g>

      {/* 底部压暗 */}
      <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />

      {/* 品红与暖色点缀（藏色） */}
      <circle cx="1190" cy="250" r="4" fill={T.rose} opacity="0.8" filter={`url(#${uid}-glow)`} />
      <circle cx="386" cy="430" r="3" fill={T.amber} opacity="0.7" filter={`url(#${uid}-glow)`} />
    </g>
  );
}

/* ═══════════ 场景三：地下服务器 · 撤离通道（深邃合金通道） ═══════════ */

function Corridor({ uid }: { uid: string }) {
  const VPX = 800;
  const VPY = 410;
  const half = (d: number) => 980 - d * 700;
  const topY = (d: number) => -80 + d * 470;
  const botY = (d: number) => 980 - d * 540;
  const depths = [0, 0.08, 0.17, 0.27, 0.38, 0.5, 0.63, 0.77, 0.89, 1];

  return (
    <g>
      {/* 通道底 */}
      <rect width="1600" height="900" fill="#04090F" />

      {/* 尽头终端的天光（照亮整条通道） */}
      <ellipse cx={VPX} cy={VPY + 20} rx="420" ry="330" fill={`url(#${uid}-halo)`} opacity="1" />
      <Wash uid={uid} cx={VPX} cy={VPY + 60} rx={260} ry={200} color={T.mint} opacity={0.18} />

      {/* 天花板 / 地面 / 侧墙（用面而不是线，避免线框感） */}
      <path d={`M-60 -80 L1660 -80 L${VPX + 260} ${VPY - 40} L${VPX - 260} ${VPY - 40} Z`} fill={`url(#${uid}-panel)`} />
      <path d={`M-60 980 L1660 980 L${VPX + 260} ${VPY + 34} L${VPX - 260} ${VPY + 34} Z`} fill={`url(#${uid}-metal)`} />
      <path d={`M-60 980 L${VPX - 260} ${VPY + 34} L${VPX - 260} ${VPY - 40} L-60 -80 Z`} fill={`url(#${uid}-panel)`} />
      <path d={`M1660 980 L${VPX + 260} ${VPY + 34} L${VPX + 260} ${VPY - 40} L1660 -80 Z`} fill={`url(#${uid}-panel)`} />

      {/* 墙面嵌板：fills + 缝 + 铆接 */}
      {depths.slice(0, -1).map((d0, i) => {
        const d1 = depths[i + 1];
        const quad = (side: number) => {
          const hw0 = half(d0) * side;
          const hw1 = half(d1) * side;
          return `M${VPX + hw0} ${topY(d0)} L${VPX + hw1} ${topY(d1)} L${VPX + hw1} ${botY(d1)} L${VPX + hw0} ${botY(d0)} Z`;
        };
        return (
          <g key={i}>
            <path d={quad(-1)} fill={i % 2 ? '#0C1A2A' : '#091422'} opacity="0.9" />
            <path d={quad(1)} fill={i % 2 ? '#0C1A2A' : '#091422'} opacity="0.9" />
            {/* 板缝 */}
            <line x1={VPX - half(d0) + 12} y1={topY(d0) + 16} x2={VPX - half(d1) + 10} y2={topY(d1) + 14} stroke="#040B12" strokeWidth="2.4" opacity="0.8" />
            <line x1={VPX + half(d0) - 12} y1={topY(d0) + 16} x2={VPX + half(d1) - 10} y2={topY(d1) + 14} stroke="#040B12" strokeWidth="2.4" opacity="0.8" />
            <line x1={VPX - half(d0) + 14} y1={botY(d0) - 26} x2={VPX - half(d1) + 12} y2={botY(d1) - 22} stroke="#040B12" strokeWidth="2" opacity="0.7" />
            <line x1={VPX + half(d0) - 14} y1={botY(d0) - 26} x2={VPX + half(d1) - 12} y2={botY(d1) - 22} stroke="#040B12" strokeWidth="2" opacity="0.7" />
          </g>
        );
      })}

      {/* 纵向加强筋：沿通道收束的透视长线（弱化，只做结构暗示） */}
      {[-1, 1].map(side =>
        [0.18, 0.46, 0.74].map((hf, k) => {
          const pts = depths
            .map(d => {
              const x = VPX + side * (half(d) - 12);
              const y = topY(d) + (botY(d) - topY(d)) * hf;
              return `${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polyline key={`${side}-${k}`} points={pts} fill="none"
              stroke={T.teal} strokeWidth={k === 1 ? 2.2 : 1.2} strokeOpacity={0.12 - k * 0.015} />
          );
        }),
      )}

      {/* 天花板灯槽（发光面 + 溢光） */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const d0 = i * 0.13;
        const d1 = d0 + 0.1;
        const hw0 = 340 - d0 * 210;
        const hw1 = 340 - d1 * 210;
        const y0 = topY(d0) + 26;
        const y1 = topY(d1) + 20;
        return (
          <g key={i}>
            {/* 灯具外壳：压住过亮的发光面，避免变成漂浮白板 */}
            <path d={`M${VPX - hw0 - 16} ${y0 - 8} L${VPX + hw0 + 16} ${y0 - 8} L${VPX + hw1 + 14} ${y1 - 6} L${VPX - hw1 - 14} ${y1 - 6} Z`}
              fill="#050D16" opacity="0.9" />
            <path d={`M${VPX - hw0} ${y0} L${VPX + hw0} ${y0} L${VPX + hw1} ${y1} L${VPX - hw1} ${y1} Z`}
              fill={T.mint} opacity={0.26 - i * 0.03} filter={`url(#${uid}-blur)`} />
            <path d={`M${VPX - hw0 * 0.7} ${y0 + 2} L${VPX + hw0 * 0.7} ${y0 + 2} L${VPX + hw1 * 0.7} ${y1 + 2} L${VPX - hw1 * 0.7} ${y1 + 2} Z`}
              fill={T.hot} opacity={0.3 - i * 0.032} />
            <path d={`M${VPX - hw0 * 0.7} ${y0 + 2} L${VPX + hw0 * 0.7} ${y0 + 2} L${VPX + hw1 * 0.7} ${y1 + 2} L${VPX - hw1 * 0.7} ${y1 + 2} Z`}
              fill="none" stroke={T.pale} strokeOpacity="0.22" strokeWidth="1.2" />
          </g>
        );
      })}

      {/* 管道：粗管 + 高光 + 暖色伴管 */}
      {[-1, 1].map(side => (
        <g key={side}>
          <line x1={VPX + side * 1000} y1={topY(0) + 108} x2={VPX + side * 262} y2={VPY - 34}
            stroke="#0A1624" strokeWidth="26" strokeLinecap="round" />
          <line x1={VPX + side * 1000} y1={topY(0) + 100} x2={VPX + side * 262} y2={VPY - 40}
            stroke={T.teal} strokeWidth="3" strokeOpacity="0.5" filter={`url(#${uid}-glow)`} />
          <line x1={VPX + side * 980} y1={topY(0) + 152} x2={VPX + side * 268} y2={VPY - 22}
            stroke={T.ember} strokeWidth="4" strokeOpacity="0.4" filter={`url(#${uid}-glow)`} />
          <line x1={VPX + side * 1000} y1={botY(0) - 120} x2={VPX + side * 268} y2={VPY + 30}
            stroke="#0A1624" strokeWidth="18" strokeLinecap="round" />
          <line x1={VPX + side * 1000} y1={botY(0) - 128} x2={VPX + side * 268} y2={VPY + 24}
            stroke={T.pale} strokeWidth="2" strokeOpacity="0.28" />
        </g>
      ))}

      {/* 复杂数据电缆：沿墙垂挂 + 汇聚到尽头 */}
      {[-1, 1].map(side =>
        Array.from({ length: 7 }, (_, k) => {
          const base = topY(0) + 190 + k * 26;
          const sag = 30 + k * 9;
          return (
            <path key={k}
              d={`M${VPX + side * 980} ${base} Q${VPX + side * 620} ${base + sag} ${VPX + side * 262} ${VPY - 20 + k * 7}`}
              stroke="#02070D" strokeWidth={2 + k * 0.5} fill="none" opacity="0.9" />
          );
        }),
      )}

      {/* 地面：平滑金属 + 反光 + 尽头光倒影 */}
      <path d={`M-60 980 L1660 980 L${VPX + 260} ${VPY + 34} L${VPX - 260} ${VPY + 34} Z`} fill="#0A1420" opacity="0.55" />
      <ellipse cx={VPX} cy={VPY + 120} rx="180" ry="230" fill={T.mint} opacity="0.14" filter={`url(#${uid}-blur)`} />
      <path d={`M${VPX - 90} ${VPY + 34} L${VPX + 90} ${VPY + 34} L${VPX + 300} 980 L${VPX - 300} 980 Z`}
        fill={T.mint} opacity="0.1" filter={`url(#${uid}-blur)`} />
      {[-1, 1].map(s => (
        <line key={s} x1={VPX + s * 120} y1={VPY + 40} x2={VPX + s * 520} y2="980" stroke={T.amber} strokeWidth="3" strokeOpacity="0.18" />
      ))}
      {Array.from({ length: 13 }, (_, i) => {
        const d = 0.05 + (i / 12) * 0.9;
        const hw = half(d);
        const y = botY(d);
        return <line key={i} x1={VPX - hw} y1={y} x2={VPX + hw} y2={y} stroke={T.pale} strokeOpacity={0.13 - i * 0.008} strokeWidth="1.4" />;
      })}

      {/* 尽头：发光的方形逃生终端 */}
      <g>
        <ellipse cx={VPX} cy={VPY} rx="150" ry="110" fill={T.mint} opacity="0.3" filter={`url(#${uid}-blur)`} />
        <rect x={VPX - 62} y={VPY - 46} width="124" height="82" rx="3" fill={T.hot} opacity="0.55" filter={`url(#${uid}-blur)`} />
        <rect x={VPX - 44} y={VPY - 32} width="88" height="56" rx="2" fill={T.mint} opacity="0.7" />
        <rect x={VPX - 44} y={VPY - 32} width="88" height="56" rx="2" fill="none" stroke={T.hot} strokeOpacity="0.7" strokeWidth="2" />
        <rect x={VPX - 44} y={VPY - 32} width="88" height="8" fill="#FFFFFF" opacity="0.35" />
        <circle cx={VPX} cy={VPY - 58} r="5" fill={T.ember} opacity="0.85" filter={`url(#${uid}-glow)`} />
      </g>

      {/* 体积光：从尽头横向切出的光束 */}
      <path d={`M${VPX - 220} ${VPY - 60} L${VPX + 220} ${VPY - 60} L${VPX + 520} ${VPY + 180} L${VPX - 520} ${VPY + 180} Z`}
        fill={T.mint} opacity="0.07" filter={`url(#${uid}-blur)`} />

      {/* 近景：破损门框剪影 + 垂下的断线 */}
      <path d="M-60 -80 L190 -80 L120 980 L-60 980 Z" fill="#01050A" />
      <path d="M1660 -80 L1450 -80 L1530 980 L1660 980 Z" fill="#01050A" />
      <path d="M190 -80 L120 980" stroke={T.pale} strokeWidth="2.6" strokeOpacity="0.3" filter={`url(#${uid}-glow)`} />
      <path d="M1450 -80 L1530 980" stroke={T.teal} strokeWidth="2" strokeOpacity="0.2" />
      <path d="M240 -80 Q300 180 236 460" stroke="#01050A" strokeWidth="5" fill="none" opacity="0.9" />
      <path d="M240 -80 Q300 180 236 460" stroke={T.ember} strokeWidth="1" fill="none" opacity="0.3" />

      {/* 底部金属地板留白 + 压暗 */}
      <rect x="0" y="720" width="1600" height="180" fill={`url(#${uid}-bottom)`} />

      <Motes uid={uid} n={70} seed={9} yMax={600} />
    </g>
  );
}

/* ═════ 教学章节 · 训练终端（圆形数据平台 · 维修终端 · U 形全息弧屏） ═════ */

function Terminal({ uid }: { uid: string }) {
  const VPX = 800;
  /** U 形全息屏：两端高、中间低的两条二次曲线夹出的弧带 */
  const top = (t: number): [number, number] => {
    const mt = 1 - t;
    return [mt * mt * 250 + 2 * mt * t * VPX + t * t * 1350, mt * mt * 148 + 2 * mt * t * 372 + t * t * 148];
  };
  const bot = (t: number): [number, number] => {
    const mt = 1 - t;
    return [mt * mt * 250 + 2 * mt * t * VPX + t * t * 1350, mt * mt * 372 + 2 * mt * t * 596 + t * t * 372];
  };
  const N = 28;
  const tp = Array.from({ length: N + 1 }, (_, i) => top(i / N));
  const bp = Array.from({ length: N + 1 }, (_, i) => bot(i / N)).reverse();
  const fmt = (p: [number, number]) => p.map(v => v.toFixed(1)).join(' ');
  const bandPath = `M${tp.map(fmt).join(' L')} L${bp.map(fmt).join(' L')} Z`;
  const topEdge = `M${tp.map(fmt).join(' L')}`;
  const botEdge = `M${bp.slice().reverse().map(fmt).join(' L')}`;
  const PANELS = 9;

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-holo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.pale} stopOpacity="0.3" />
          <stop offset="45%" stopColor={T.teal} stopOpacity="0.15" />
          <stop offset="100%" stopColor={T.blue} stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id={`${uid}-plat`}>
          <stop offset="0%" stopColor="#0E2334" />
          <stop offset="68%" stopColor="#071521" />
          <stop offset="100%" stopColor="#040C14" />
        </radialGradient>
        <radialGradient id={`${uid}-lamp`}>
          <stop offset="0%" stopColor="#EEFCF8" stopOpacity="0.95" />
          <stop offset="34%" stopColor={T.mint} stopOpacity="0.5" />
          <stop offset="100%" stopColor={T.teal} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${uid}-grate`} width="26" height="14" patternUnits="userSpaceOnUse">
          <rect width="26" height="14" fill="none" />
          <line x1="0" y1="0" x2="26" y2="0" stroke={T.pale} strokeOpacity="0.07" strokeWidth="1" />
          <line x1="0" y1="7" x2="26" y2="7" stroke={T.pale} strokeOpacity="0.05" strokeWidth="1" />
          <line x1="13" y1="0" x2="13" y2="14" stroke={T.pale} strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>

      {/* 环境：深空 + 远处主架构剪影 */}
      <Wash uid={uid} cx={VPX} cy={430} rx={620} ry={420} color={T.teal} opacity={0.14} />
      <Wash uid={uid} cx={1280} cy={620} rx={360} ry={300} color={T.amber} opacity={0.07} />
      <Skyline uid={uid} seed={97} count={10} baseY={648} hMin={150} hMax={420} tone="far" opacity={0.16} from={-80} to={1680} dense={0.5} />
      {/* 受损浮空数据节点 */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 110 + rnd(i, 21) * 1380;
        const y = 140 + rnd(i, 23) * 360;
        const s = 18 + rnd(i, 25) * 42;
        return (
          <g key={i} opacity={0.45}>
            <path d={`M${x} ${y} l${s} ${-s * 0.22} l${s * 0.28} ${s * 0.62} l${-s * 0.78} ${s * 0.3} Z`}
              fill="#050E18" stroke={T.teal} strokeOpacity="0.32" strokeWidth="1.2" />
            <circle cx={x + s * 0.5} cy={y + s * 0.3} r="1.8" fill={i % 4 === 0 ? T.amber : T.mint} opacity="0.8" />
          </g>
        );
      })}

      {/* 顶部丁达尔体积光 */}
      {[[520, 0.5], [VPX, 0.9], [1090, 0.45]].map(([x, o], i) => (
        <path key={i} d={`M${x - 26} -40 L${x + 26} -40 L${x + 210} 720 L${x - 210} 720 Z`}
          fill={T.mint} opacity={0.05 * (o as number)} filter={`url(#${uid}-blur)`} />
      ))}

      <g transform="translate(0,-196)">
      {/* 圆形数据平台 */}
      <ellipse cx={VPX} cy={700} rx={660} ry={172} fill={`url(#${uid}-plat)`} />
      <ellipse cx={VPX} cy={700} rx={660} ry={172} fill={`url(#${uid}-grate)`} opacity="0.9" />
      {[560, 448, 336, 224].map((rx, i) => (
        <ellipse key={i} cx={VPX} cy={700} rx={rx} ry={rx * 0.26} fill="none"
          stroke={T.teal} strokeOpacity={0.16 - i * 0.03} strokeWidth="1.4" />
      ))}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <line key={i} x1={VPX + Math.cos(a) * 120} y1={700 + Math.sin(a) * 31}
            x2={VPX + Math.cos(a) * 660} y2={700 + Math.sin(a) * 172}
            stroke={T.pale} strokeOpacity="0.06" strokeWidth="1.2" />
        );
      })}
      {/* 平台边缘棱光与地面反光 */}
      <ellipse cx={VPX} cy={700} rx={660} ry={172} fill="none" stroke={T.mint} strokeOpacity="0.4" strokeWidth="2.4" filter={`url(#${uid}-glow)`} />
      <ellipse cx={VPX} cy={706} rx={330} ry={86} fill={T.teal} opacity="0.14" filter={`url(#${uid}-blur)`} />
      <ellipse cx={VPX} cy={712} rx={150} ry={40} fill={T.mint} opacity="0.16" filter={`url(#${uid}-blur)`} />

      {/* 从远处黑暗伸来的光纤数据线 */}
      {Array.from({ length: 11 }, (_, i) => {
        const left = i % 2 === 0;
        const sx = left ? -50 - rnd(i, 3) * 140 : 1650 + rnd(i, 3) * 140;
        const sy = 280 + rnd(i, 5) * 440;
        const ex = 690 + rnd(i, 7) * 220;
        const ey = 656 + rnd(i, 9) * 46;
        const d = `M${sx} ${sy} Q${(sx + ex) / 2} ${Math.min(sy, ey) - 70} ${ex} ${ey}`;
        return <path key={i} d={d} stroke={T.teal} strokeWidth={1 + rnd(i, 11) * 2.2}
          fill="none" opacity={0.22 + rnd(i, 13) * 0.3} filter={`url(#${uid}-glow)`} />;
      })}

      {/* 维修终端：基座 + 倾斜面板 + 顶部发射器 */}
      <g>
        <path d="M754 702 L846 702 L837 664 L763 664 Z" fill="#050D16" stroke={T.teal} strokeOpacity="0.3" strokeWidth="1.2" />
        <path d="M771 664 L829 664 L838 590 L762 590 Z" fill="#081521" stroke={T.pale} strokeOpacity="0.4" strokeWidth="1.6" />
        <path d="M779 602 L821 602 L826 656 L774 656 Z" fill={T.teal} opacity="0.16" />
        <path d="M779 602 L821 602 L826 656 L774 656 Z" fill="none" stroke={T.mint} strokeOpacity="0.72" strokeWidth="1.4" filter={`url(#${uid}-glow)`} />
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={784 + rnd(i, 3) * 8} y={610 + i * 7.4} width={12 + rnd(i, 5) * 20} height="2.4"
            fill={T.mint} opacity={0.26 + rnd(i, 7) * 0.4} />
        ))}
        <circle cx={VPX} cy={584} r="12" fill={`url(#${uid}-lamp)`} />
        <circle cx={VPX} cy={584} r="3.6" fill="#F2FFFB" filter={`url(#${uid}-glow)`} />
        <circle cx={847} cy={676} r="3" fill={T.amber} opacity="0.8" filter={`url(#${uid}-glow)`} />
        {/* 终端向上投出的光柱，接进弧屏 */}
        <path d="M772 588 L786 476 L814 476 L828 588 Z" fill={T.mint} opacity="0.09" filter={`url(#${uid}-blur)`} />
      </g>

      </g>

      {/* U 形全息弧屏 */}
      <g transform="translate(0,-34)">
        <path d={bandPath} fill={`url(#${uid}-holo)`} />
        <path d={bandPath} fill={T.teal} opacity="0.08" filter={`url(#${uid}-blur)`} />
        {/* 面板分隔与抽象数据（无文字） */}
        {Array.from({ length: PANELS }, (_, i) => {
          const t0 = i / PANELS;
          const A = top(t0);
          const B = bot(t0);
          return (
            <g key={i}>
              <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={T.pale} strokeOpacity="0.3" strokeWidth="1.3" />
              {Array.from({ length: 4 }, (_, k) => {
                const tx = t0 + (0.2 + rnd(i * 5 + k, 7) * 0.55) / PANELS;
                const P1 = top(tx);
                const P2 = bot(tx);
                const yy = P1[1] + (P2[1] - P1[1]) * (0.14 + rnd(i * 5 + k, 11) * 0.66);
                const w = 9 + rnd(i * 5 + k, 13) * 30;
                const h2 = 2 + rnd(i * 5 + k, 17) * 8;
                return (
                  <rect key={k} x={P1[0] - 3} y={yy} width={w} height={h2}
                    fill={k % 3 === 0 ? T.mint : T.pale} opacity={0.16 + rnd(i * 5 + k, 19) * 0.38} />
                );
              })}
            </g>
          );
        })}
        {/* 弧屏上下边缘的发光轮廓 */}
        <path d={topEdge} fill="none" stroke={T.mint} strokeWidth="3.4" opacity="0.85" filter={`url(#${uid}-glow)`} />
        <path d={botEdge} fill="none" stroke={T.teal} strokeWidth="2.2" opacity="0.6" filter={`url(#${uid}-glow)`} />
        {/* 弧屏两端的端头高光 */}
        {[0, 1].map(k => {
          const A = top(k);
          const B = bot(k);
          return <line key={k} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={T.hot} strokeWidth="2.6" opacity="0.7" filter={`url(#${uid}-glow)`} />;
        })}
      </g>

      {/* 悬浮半透明全息面板 */}
      {[
        { x: 232, y: 508, w: 154, h: 92, rot: -8 },
        { x: 1218, y: 486, w: 172, h: 100, rot: 7 },
        { x: 392, y: 742, w: 126, h: 72, rot: -5 },
        { x: 1092, y: 752, w: 132, h: 76, rot: 5 },
      ].map((p, i) => (
        <g key={i} transform={`rotate(${p.rot} ${p.x + p.w / 2} ${p.y + p.h / 2})`} opacity="0.55">
          <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={T.teal} opacity="0.08" />
          <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="none" stroke={T.pale} strokeOpacity="0.42" strokeWidth="1.2" />
          {Array.from({ length: 4 }, (_, k) => (
            <rect key={k} x={p.x + 9} y={p.y + 12 + k * 15} width={(p.w - 20) * (0.3 + rnd(i * 4 + k, 11) * 0.62)}
              height="2.2" fill={T.mint} opacity="0.3" />
          ))}
        </g>
      ))}

      {/* 雾与底部 UI 安全区 */}
      <FogBand uid={uid} y={596} h={220} opacity={0.7} />
      <FogBand uid={uid} y={700} h={200} opacity={0.55} />
      <rect x="0" y="690" width="1600" height="210" fill={`url(#${uid}-bottom)`} />

      <Motes uid={uid} n={80} seed={6} yMax={620} />
    </g>
  );
}

/* ═════ 第一章 · 失落的数据港（数据海 · 沉没数据城 · 能源枢纽 · 五节点） ═════ */

function Dataport({ uid }: { uid: string }) {
  const HZ = 556; // 数据海水平线
  /** 残破建筑：方形楼体 + 顶部塌损缺口 + 竖向窗带 + 一侧霓虹棱光 */
  const ruin = (b: { x: number; y: number; w: number; h: number; rot: number }, i: number) => {
    const { x, y, w, h, rot } = b;
    const body = `M${x} ${y + h} L${x} ${y + h * 0.12} L${x + w * 0.26} ${y + h * 0.12} L${x + w * 0.34} ${y + h * 0.02} L${x + w * 0.56} ${y + h * 0.2} L${x + w * 0.7} ${y + h * 0.09} L${x + w} ${y + h * 0.24} L${x + w} ${y + h} Z`;
    const cols = Math.max(3, Math.round(w / 22));
    return (
      <g key={i} transform={`rotate(${rot} ${x + w / 2} ${y + h})`}>
        <path d={body} fill="#040B13" />
        <path d={body} fill="none" stroke={T.teal} strokeOpacity="0.18" strokeWidth="1.4" />
        {/* 竖向窗带：楼体感的关键 */}
        {Array.from({ length: cols }, (_, c) => {
          const cx2 = x + 6 + c * ((w - 12) / cols);
          const lit = rnd(c, i + 5) > 0.55;
          return (
            <g key={c}>
              <rect x={cx2} y={y + h * 0.3} width={Math.max(2, (w - 12) / cols - 5)} height={h * 0.62}
                fill={lit ? (rnd(c, i + 9) > 0.78 ? T.amber : T.mint) : '#02070C'}
                opacity={lit ? 0.16 + rnd(c, i + 13) * 0.24 : 0.5} />
            </g>
          );
        })}
        {/* 楼体一侧的霓虹棱光 */}
        <line x1={x + w - 1} y1={y + h * 0.24} x2={x + w - 1} y2={y + h}
          stroke={rnd(i, 7) > 0.6 ? T.amber : T.pale} strokeWidth="1.8" strokeOpacity="0.34" filter={`url(#${uid}-glow)`} />
        {/* 塌损断口的冷光边 */}
        <path d={`M${x + w * 0.34} ${y + h * 0.02} L${x + w * 0.56} ${y + h * 0.2} L${x + w * 0.7} ${y + h * 0.09}`}
          stroke={T.pale} strokeOpacity="0.28" strokeWidth="1.6" fill="none" />
      </g>
    );
  };

  return (
    <g>
      <g transform="translate(0,-146)">
        {/* 数字虚空底与远处暖色故障光 */}
        <Wash uid={uid} cx={800} cy={360} rx={720} ry={430} color={T.blue} opacity={0.2} />
        <Wash uid={uid} cx={470} cy={280} rx={430} ry={330} color={T.teal} opacity={0.13} />
        <Wash uid={uid} cx={1200} cy={404} rx={400} ry={320} color={T.ember} opacity={0.12} />

        {/* 背景：巨塔剪影两层，雾化到黑 */}
        <Skyline uid={uid} seed={101} count={9} baseY={HZ} hMin={250} hMax={540} tone="far" opacity={0.2} from={-120} to={1720} dense={0.35} />
        <Skyline uid={uid} seed={139} count={13} baseY={HZ - 26} hMin={150} hMax={380} tone="far" opacity={0.13} from={-140} to={1740} dense={0.3} />
        {/* 背景里零星的琥珀故障灯与青色残流 */}
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={60 + rnd(i, 31) * 1480} y={140 + rnd(i, 33) * 300}
            width={2 + rnd(i, 35) * 16} height="2" fill={rnd(i, 37) > 0.62 ? T.amber : T.teal}
            opacity={0.16 + rnd(i, 39) * 0.3} />
        ))}

        {/* 中景：沉没的残破数据城 */}
        {[
          { x: 168, y: 302, w: 124, h: 254, rot: -5 },
          { x: 322, y: 382, w: 92, h: 174, rot: 4 },
          { x: 466, y: 332, w: 112, h: 224, rot: -2 },
          { x: 632, y: 402, w: 82, h: 154, rot: 3 },
          { x: 972, y: 356, w: 102, h: 200, rot: -4 },
          { x: 1114, y: 318, w: 132, h: 238, rot: 5 },
          { x: 1284, y: 388, w: 98, h: 168, rot: -3 },
        ].map(ruin)}
        {/* 远处残楼上的故障起火点（暖色对比） */}
        <g>
          <ellipse cx={1096} cy={402} rx={96} ry={74} fill={T.ember} opacity="0.17" filter={`url(#${uid}-blur)`} />
          <ellipse cx={1096} cy={418} rx={48} ry={30} fill={T.amber} opacity="0.3" filter={`url(#${uid}-paint)`} />
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={1068 + rnd(i, 111) * 62} cy={388 + rnd(i, 113) * 62} r={1 + rnd(i, 115) * 2.6}
              fill={rnd(i, 117) > 0.5 ? T.hot : T.amber} opacity={0.3 + rnd(i, 119) * 0.5} filter={`url(#${uid}-glow)`} />
          ))}
          <path d="M1068 400 Q1090 328 1124 296" stroke={T.pale} strokeWidth="12" strokeOpacity="0.07" fill="none" filter={`url(#${uid}-paint)`} />
        </g>

        <FogBand uid={uid} y={430} h={170} opacity={0.9} />

        {/* 枢纽正后方的一座节点（被枢纽遮住一半，制造层次） */}
        <path d={`M792 ${HZ} L798 ${HZ - 300} L814 ${HZ - 300} L820 ${HZ} Z`} fill="#03080F" />
        <circle cx={806} cy={HZ - 306} r="3" fill={T.mint} opacity="0.3" filter={`url(#${uid}-glow)`} />

        {/* 中央：沉睡的能源枢纽（圆柱体 + 环带 + 休眠核心） */}
        <g>
          <ellipse cx={800} cy={HZ + 4} rx={212} ry={46} fill="#02070C" />
          <path d={`M636 ${HZ + 30} L664 348 L936 348 L964 ${HZ + 30} Z`} fill={`url(#${uid}-metal)`} opacity="0.96" />
          {/* 柱面竖向棱 */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <line key={i} x1={636 + i * 55} y1={HZ + 30} x2={664 + i * 45} y2={348} stroke="#02070C" strokeWidth="4" opacity="0.85" />
          ))}
          {/* 四道环带 */}
          {[392, 436, 480, 524].map((y, i) => (
            <g key={i}>
              <ellipse cx={800} cy={y} rx={150 - i * 6} ry={22 - i * 1.6} fill="none" stroke={T.teal} strokeOpacity={0.26 - i * 0.03} strokeWidth="2" />
              <ellipse cx={800} cy={y - 2} rx={150 - i * 6} ry={22 - i * 1.6} fill="none" stroke={T.pale} strokeOpacity="0.1" strokeWidth="1" />
            </g>
          ))}
          {/* 顶端平台 */}
          <ellipse cx={800} cy={348} rx={136} ry={26} fill="#071320" stroke={T.pale} strokeOpacity="0.3" strokeWidth="1.6" />
          <ellipse cx={800} cy={348} rx={136} ry={26} fill={T.teal} opacity="0.07" />
          {/* 休眠核心：极暗的青 + 琥珀故障点 */}
          <ellipse cx={800} cy={470} rx={62} ry={58} fill={T.teal} opacity="0.1" filter={`url(#${uid}-blur)`} />
          <circle cx={800} cy={470} r={23} fill="#02070C" stroke={T.teal} strokeOpacity="0.34" strokeWidth="1.6" />
          <circle cx={800} cy={470} r={6} fill={T.mint} opacity="0.34" filter={`url(#${uid}-glow)`} />
          <circle cx={817} cy={452} r="2.8" fill={T.amber} opacity="0.6" filter={`url(#${uid}-glow)`} />
          <circle cx={788} cy={484} r="2" fill={T.amber} opacity="0.4" />
          {/* 两侧棱光 */}
          <line x1={664} y1={348} x2={636} y2={HZ + 30} stroke={T.pale} strokeWidth="3" strokeOpacity="0.36" filter={`url(#${uid}-glow)`} />
          <line x1={936} y1={348} x2={964} y2={HZ + 30} stroke={T.teal} strokeWidth="2.2" strokeOpacity="0.28" />
        </g>

        {/* 环枢纽的 4 座能源节点（已熄灭，塔形 + 环箍 + 顶部平台） */}
        {[
          { x: 372, h: 232, warm: true }, { x: 540, h: 176, warm: false },
          { x: 1058, h: 208, warm: true }, { x: 1236, h: 264, warm: false },
        ].map((n, i) => {
          const topY = HZ - n.h;
          const halfB = 26 + rnd(i, 91) * 8;
          const halfT = 11;
          return (
            <g key={i}>
              <path d={`M${n.x - halfB} ${HZ} L${n.x - halfT} ${topY} L${n.x + halfT} ${topY} L${n.x + halfB} ${HZ} Z`} fill="#03090F" />
              <line x1={n.x - halfB} y1={HZ} x2={n.x - halfT} y2={topY} stroke={T.pale} strokeWidth="1.6" strokeOpacity="0.26" />
              <line x1={n.x + halfB} y1={HZ} x2={n.x + halfT} y2={topY} stroke={T.teal} strokeWidth="1.3" strokeOpacity="0.18" />
              {[0.24, 0.48, 0.72].map((f, k) => {
                const yy = topY + n.h * f;
                const hw = halfT + (halfB - halfT) * f;
                return <rect key={k} x={n.x - hw} y={yy} width={hw * 2} height="5" fill="#061019" stroke={T.teal} strokeOpacity="0.16" />;
              })}
              <rect x={n.x - 15} y={topY - 10} width="30" height="10" fill="#040B12" stroke={T.teal} strokeOpacity="0.18" />
              <circle cx={n.x} cy={topY - 14} r="3" fill={n.warm ? T.amber : T.mint} opacity={n.warm ? 0.5 : 0.32} filter={`url(#${uid}-glow)`} />
              {/* 塔身残余的青色数据流 */}
              <line x1={n.x + 4} y1={HZ - 6} x2={n.x + 2} y2={topY + 22} stroke={T.mint} strokeWidth="1.2" strokeOpacity="0.24" />
            </g>
          );
        })}

        {/* 数据海：雾气过渡 + 水面 + 倒影 + 涟漪 */}
        <rect x="0" y={HZ - 42} width="1600" height="74" fill={T.pale} opacity="0.05" filter={`url(#${uid}-blur)`} />
        <rect x="0" y={HZ} width="1600" height={900 - HZ} fill="#02070C" />
        <rect x="0" y={HZ - 8} width="1600" height="92" fill="#04101B" opacity="0.88" />
        <rect x="520" y={HZ - 16} width="560" height="44" fill={T.teal} opacity="0.12" filter={`url(#${uid}-blur)`} />
        {/* 枢纽与各灯的倒影（向下渐隐） */}
        {[
          { x: 690, w: 200, c: T.teal, o: 0.15, h: 210 },
          { x: 1112, w: 30, c: T.amber, o: 0.2, h: 176 },
          { x: 366, w: 26, c: T.amber, o: 0.17, h: 156 },
          { x: 524, w: 20, c: T.mint, o: 0.13, h: 146 },
          { x: 1052, w: 22, c: T.amber, o: 0.12, h: 138 },
        ].map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={HZ} width={r.w} height={r.h * 0.45} fill={r.c} opacity={r.o} filter={`url(#${uid}-blur)`} />
            <rect x={r.x} y={HZ + r.h * 0.4} width={r.w} height={r.h * 0.6} fill={r.c} opacity={r.o * 0.45} filter={`url(#${uid}-blur)`} />
          </g>
        ))}
        {/* 涟漪：越近越粗、越散 */}
        {Array.from({ length: 30 }, (_, i) => {
          const t = i / 29;
          const y = HZ + 6 + t * 190;
          const wdt = 30 + t * 260 + rnd(i, 45) * 130;
          const x = 770 + (rnd(i, 41) - 0.5) * 920;
          return (
            <rect key={i} x={x} y={y} width={wdt} height={1 + t * 2.2}
              fill={rnd(i, 47) > 0.72 ? T.amber : T.pale} opacity={0.05 + rnd(i, 49) * 0.15} />
          );
        })}
        {/* 水面雾：让沉没城市的底部化进雾里，弱化硬水线 */}
        <FogBand uid={uid} y={HZ - 54} h={110} opacity={0.85} />
        <FogBand uid={uid} y={HZ - 6} h={70} opacity={0.55} />

        {/* 前景：如海藻般缠绕的粗光纤电缆（有机绕圈，非规则排布） */}
        {Array.from({ length: 12 }, (_, i) => {
          const leftSide = i % 2 === 0;
          const x0 = leftSide ? -60 + rnd(i, 51) * 300 : 1660 - rnd(i, 51) * 280;
          const x1 = leftSide ? 280 + rnd(i, 53) * 300 : 1040 + rnd(i, 53) * 320;
          const y0 = HZ + 20 + rnd(i, 55) * 130;
          const y1 = HZ + 10 + rnd(i, 61) * 110;
          const d = `M${x0} ${y0} C${x0 + (x1 - x0) * 0.28} ${HZ - 70 - rnd(i, 57) * 80} ${x0 + (x1 - x0) * 0.62} ${HZ + 150 + rnd(i, 59) * 110} ${x1} ${y1}`;
          const wd = 6 + rnd(i, 63) * 11;
          return (
            <g key={i} fill="none">
              <path d={d} stroke="#02070C" strokeWidth={wd} strokeLinecap="round" />
              <path d={d} stroke={T.teal} strokeWidth={1 + rnd(i, 65) * 1.6} strokeOpacity="0.34" filter={`url(#${uid}-glow)`} />
              {/* 断口处的一点微光 */}
              {rnd(i, 67) > 0.72 && <circle cx={x1} cy={y1} r="2.2" fill={T.amber} opacity="0.6" filter={`url(#${uid}-glow)`} />}
            </g>
          );
        })}
        {/* 水面漂浮的机械残骸 */}
        {Array.from({ length: 7 }, (_, i) => {
          const x = 80 + rnd(i, 71) * 1440;
          const y = HZ + 26 + rnd(i, 73) * 120;
          const s = 18 + rnd(i, 75) * 44;
          return (
            <g key={i} opacity={0.82}>
              <path d={`M${x} ${y} l${s} ${-s * 0.18} l${s * 0.3} ${s * 0.42} l${-s * 0.9} ${s * 0.24} Z`} fill="#02070C" stroke={T.teal} strokeOpacity="0.24" />
              <circle cx={x + s * 0.5} cy={y + s * 0.16} r="1.6" fill={i % 3 === 0 ? T.amber : T.teal} opacity="0.6" />
            </g>
          );
        })}
        {/* 微型浮空平台（前景尺度参照，保持在台词框上方可见区） */}
        {[
          { x: 176, y: 502, w: 158, h: 22, o: 0.92 },
          { x: 1288, y: 480, w: 184, h: 24, o: 0.96 },
          { x: 470, y: 528, w: 126, h: 18, o: 0.75 },
        ].map((p, i) => (
          <g key={i} opacity={p.o}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#02070C" />
            <rect x={p.x} y={p.y} width={p.w} height="2.6" fill={T.mint} opacity="0.45" />
            <rect x={p.x + p.w * 0.35} y={p.y + p.h} width="3" height={16 + i * 6} fill={T.teal} opacity="0.22" />
            <circle cx={p.x + p.w * 0.82} cy={p.y + 1} r="1.8" fill={T.amber} opacity="0.6" />
          </g>
        ))}

        {/* 像流星一样缓缓下落的数据粒子 */}
        {Array.from({ length: 27 }, (_, i) => {
          const x = 40 + rnd(i, 81) * 1520;
          const y = 120 + rnd(i, 83) * 380;
          const len = 12 + rnd(i, 85) * 40;
          return (
            <line key={i} x1={x} y1={y} x2={x - len * 0.24} y2={y + len}
              stroke={rnd(i, 87) > 0.82 ? T.amber : T.pale}
              strokeWidth={0.8 + rnd(i, 89) * 1.2} strokeOpacity={0.18 + rnd(i, 91) * 0.34} />
          );
        })}

        <FogBand uid={uid} y={470} h={180} opacity={0.75} />
      </g>

      {/* 底部 UI 安全区 */}
      <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />

      <Motes uid={uid} n={80} seed={8} yMax={540} />
    </g>
  );
}

/* ═════ 第二章 · 破碎的记忆花园（镜面天花板 · 数据枯树 · 记忆花田 · 碎玻璃地） ═════ */

function Garden({ uid }: { uid: string }) {
  const HZ = 430; // 花田地平线（整体上移后落到可见区）
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-ceil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A0A1E" />
          <stop offset="55%" stopColor="#0B1230" />
          <stop offset="100%" stopColor="#071021" />
        </linearGradient>
        <radialGradient id={`${uid}-orb`}>
          <stop offset="0%" stopColor={T.mint} stopOpacity="0.3" />
          <stop offset="55%" stopColor={T.violet} stopOpacity="0.12" />
          <stop offset="100%" stopColor={T.violet} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-void`}>
          <stop offset="0%" stopColor="#050A16" />
          <stop offset="100%" stopColor="#01040A" />
        </radialGradient>
        {/* 记忆碎花点阵：远/近两种密度 */}
        <pattern id={`${uid}-flora`} width="24" height="20" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="5" r="1.2" fill={T.mint} opacity="0.5" />
          <circle cx="12" cy="12" r="1.5" fill={T.violet} opacity="0.45" />
          <circle cx="19" cy="4" r="1" fill={T.pale} opacity="0.35" />
          <circle cx="7" cy="16" r="1.1" fill={T.sky} opacity="0.4" />
          <circle cx="21" cy="15" r="0.9" fill={T.mint} opacity="0.3" />
        </pattern>
        <pattern id={`${uid}-flora-far`} width="16" height="13" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r="0.8" fill={T.pale} opacity="0.3" />
          <circle cx="9" cy="8" r="0.7" fill={T.violet} opacity="0.25" />
          <circle cx="13" cy="3" r="0.6" fill={T.mint} opacity="0.2" />
        </pattern>
      </defs>

      <g transform="translate(0,-110)">
        {/* 镜面天花板 */}
        <rect x="0" y={-130} width="1600" height={HZ + 130} fill={`url(#${uid}-ceil)`} />
        <Wash uid={uid} cx={420} cy={170} rx={520} ry={270} color={T.violet} opacity={0.16} />
        <Wash uid={uid} cx={1180} cy={230} rx={460} ry={240} color={T.teal} opacity={0.1} />
        {/* 镜像里的枯树轮廓（雾中倒影） */}
        <path d="M834 120 C860 220 806 260 826 360 C842 430 812 460 820 520 L872 520 C880 450 852 410 868 340 C882 270 846 220 872 120 Z"
          fill="#0A0D20" opacity="0.5" filter={`url(#${uid}-blur)`} />
        {/* 横向拉丝反射（镜面感的来源） */}
        {Array.from({ length: 46 }, (_, i) => {
          const y = 10 + i * 9 + rnd(i, 3) * 6;
          const w = 120 + rnd(i, 5) * 620;
          const x = rnd(i, 7) * 1500;
          return <rect key={i} x={x} y={y} width={w} height={1 + rnd(i, 9) * 2.4}
            fill={rnd(i, 11) > 0.5 ? T.pale : T.violet} opacity={0.05 + rnd(i, 13) * 0.14} />;
        })}
        {/* 竖向玻璃分格 */}
        {[120, 340, 560, 780, 1000, 1220, 1440].map((x, i) => (
          <line key={i} x1={x} y1={-130} x2={x} y2={820} stroke={T.pale} strokeWidth="1.2" strokeOpacity={0.08 + rnd(i, 17) * 0.06} />
        ))}

        {/* 远处全息光球（内含模糊人影） */}
        {[{ x: 300, y: 330, r: 46 }, { x: 1246, y: 296, r: 38 }, { x: 640, y: 302, r: 27 }].map((o, i) => (
          <g key={i}>
            <circle cx={o.x} cy={o.y} r={o.r * 1.8} fill={`url(#${uid}-orb)`} opacity="0.6" />
            <circle cx={o.x} cy={o.y} r={o.r} fill="none" stroke={T.pale} strokeOpacity="0.16" strokeWidth="1.2" />
            <ellipse cx={o.x} cy={o.y + o.r * 0.1} rx={o.r * 0.34} ry={o.r * 0.72} fill="#05091A" opacity="0.72" filter={`url(#${uid}-soft)`} />
          </g>
        ))}

        <FogBand uid={uid} y={HZ - 70} h={160} opacity={0.85} />

        {/* 发光记忆花田：远 → 近（点阵密度与亮度递增） */}
        <rect x="0" y={HZ - 26} width="1600" height="60" fill={`url(#${uid}-flora-far)`} opacity="0.7" />
        <rect x="0" y={HZ} width="1600" height="120" fill={`url(#${uid}-flora-far)`} opacity="0.9" />
        <rect x="0" y={HZ + 90} width="1600" height="150" fill={`url(#${uid}-flora)`} opacity="0.4" />
        <rect x="0" y={HZ + 200} width="1600" height="200" fill={`url(#${uid}-flora)`} opacity="0.5" />
        <Wash uid={uid} cx={620} cy={HZ + 160} rx={420} ry={140} color={T.violet} opacity={0.18} />
        <Wash uid={uid} cx={1120} cy={HZ + 220} rx={380} ry={150} color={T.teal} opacity={0.12} />
        <Wash uid={uid} cx={540} cy={HZ + 120} rx={420} ry={130} color={T.mint} opacity={0.1} />

        {/* 花簇：近处更大更亮，读作「花」而不是噪点 */}
        {Array.from({ length: 130 }, (_, i) => {
          const t = rnd(i, 111); // 0 远 → 1 近
          const y = HZ + 16 + t * 300;
          const x = 20 + rnd(i, 113) * 1560;
          const s = 1.2 + t * 4.4;
          const cluster = 3 + Math.floor(rnd(i, 115) * 4);
          const hue = rnd(i, 117);
          return (
            <g key={i} opacity={0.35 + t * 0.5}>
              {Array.from({ length: cluster }, (_, k) => (
                <circle key={k}
                  cx={x + (rnd(i * 7 + k, 119) - 0.5) * s * 7}
                  cy={y + (rnd(i * 7 + k, 121) - 0.5) * s * 5}
                  r={s * (0.5 + rnd(i * 7 + k, 123) * 0.9)}
                  fill={hue > 0.72 ? T.pale : hue > 0.42 ? T.violet : T.mint} />
              ))}
              {t > 0.5 && (
                <line x1={x} y1={y} x2={x + (rnd(i, 125) - 0.5) * 6} y2={y + s * 6}
                  stroke={T.teal} strokeWidth="0.7" opacity="0.3" />
              )}
            </g>
          );
        })}
        {/* 近景冷白高光花 */}
        {Array.from({ length: 18 }, (_, i) => (
          <circle key={i} cx={40 + rnd(i, 131) * 1520} cy={HZ + 190 + rnd(i, 133) * 190}
            r={1.6 + rnd(i, 135) * 2.4} fill="#EFFBF7" opacity={0.5 + rnd(i, 137) * 0.4} filter={`url(#${uid}-glow)`} />
        ))}
        {/* 被 SOMNIA 吃掉的一角：枯斑 + 灰白碎片 + 故障条 */}
        <path d="M980 470 Q1060 500 1010 560 Q950 600 880 570 Q840 520 900 480 Z" fill="#0A0B12" opacity="0.78" filter={`url(#${uid}-paint)`} />
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={860 + rnd(i, 21) * 190} cy={480 + rnd(i, 23) * 90} r={0.8 + rnd(i, 25) * 1.4}
            fill="#9BA6B8" opacity={0.14 + rnd(i, 27) * 0.3} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={880 + rnd(i, 31) * 160} y={492 + rnd(i, 33) * 70} width={12 + rnd(i, 35) * 40} height="2"
            fill={T.pale} opacity="0.3" />
        ))}

        {/* 中央：数据枯树（主干 = 缠绕光纤/脉络，枝条断裂） */}
        <g>
          <path d="M796 700 C800 610 780 560 792 500 C802 442 786 402 800 352 C812 306 806 250 818 196 L846 200 C836 258 844 306 832 352 C820 400 838 444 828 500 C818 556 840 606 834 700 Z"
            fill="#02060C" />
          <path d="M796 700 C800 610 780 560 792 500 C802 442 786 402 800 352 C812 306 806 250 818 196"
            stroke={T.pale} strokeWidth="2.6" strokeOpacity="0.3" fill="none" filter={`url(#${uid}-glow)`} />
          <path d="M846 200 C836 258 844 306 832 352 C820 400 838 444 828 500 C818 556 840 606 834 700"
            stroke={T.violet} strokeWidth="2" strokeOpacity="0.28" fill="none" />
          {[
            { d: 'M812 300 C740 250 668 214 590 196', w: 22 },
            { d: 'M824 356 C920 320 1000 268 1078 246', w: 19 },
            { d: 'M800 452 C716 452 646 486 578 500', w: 15 },
            { d: 'M830 500 C918 508 986 540 1060 560', w: 13 },
            { d: 'M816 250 C860 196 900 152 946 118', w: 11 },
            { d: 'M806 404 C766 344 730 300 690 262', w: 9 },
            { d: 'M590 196 C552 186 520 168 486 164', w: 5 },
            { d: 'M590 196 C560 216 540 242 512 258', w: 4.4 },
            { d: 'M1078 246 C1122 236 1152 214 1190 206', w: 5 },
            { d: 'M1078 246 C1112 266 1130 292 1158 308', w: 4.4 },
            { d: 'M578 500 C540 512 508 532 474 540', w: 4 },
            { d: 'M1060 560 C1100 566 1130 584 1168 592', w: 3.6 },
            { d: 'M946 118 C968 104 986 96 1012 90', w: 4 },
            { d: 'M690 262 C664 240 648 214 630 196', w: 4 },
          ].map((b, i) => (
            <g key={i} fill="none">
              <path d={b.d} stroke="#02060C" strokeWidth={b.w} strokeLinecap="round" />
              <path d={b.d} stroke={i % 3 === 0 ? T.violet : T.teal} strokeWidth={b.w * 0.2} strokeOpacity={0.34 + (i > 6 ? 0.12 : 0)} filter={`url(#${uid}-glow)`} />
            </g>
          ))}
          {/* 枝端分叉：从各大枝末端长出来的碎杈（不是散落的划线） */}
          {[
            { x: 590, y: 196, dx: -1, dy: -1 }, { x: 590, y: 196, dx: -0.2, dy: -1 },
            { x: 1078, y: 246, dx: 1, dy: -1 }, { x: 1078, y: 246, dx: 0.4, dy: -1 },
            { x: 578, y: 500, dx: -1, dy: -0.3 }, { x: 1060, y: 560, dx: 1, dy: -0.4 },
            { x: 946, y: 118, dx: 0.8, dy: -1 }, { x: 690, y: 262, dx: -0.8, dy: -0.8 },
            { x: 486, y: 164, dx: -0.6, dy: -1 }, { x: 512, y: 258, dx: -0.9, dy: -0.2 },
            { x: 1190, y: 206, dx: 0.7, dy: -1 }, { x: 1158, y: 308, dx: 1, dy: -0.3 },
            { x: 474, y: 540, dx: -0.8, dy: -0.5 }, { x: 1168, y: 592, dx: 0.9, dy: -0.5 },
            { x: 1012, y: 90, dx: 0.3, dy: -1 }, { x: 630, y: 196, dx: -0.5, dy: -1 },
          ].map((t, i) => {
            const len = 26 + rnd(i, 105) * 54;
            const len2 = len * (0.5 + rnd(i, 107) * 0.4);
            return (
              <g key={i} fill="none">
                <path d={`M${t.x} ${t.y} l${t.dx * len} ${t.dy * len * 0.7}`}
                  stroke="#02060C" strokeWidth={2.4 + rnd(i, 109) * 2.6} strokeLinecap="round" />
                <path d={`M${t.x + t.dx * len * 0.6} ${t.y + t.dy * len * 0.42} l${t.dx * len2} ${(1 - t.dy) * len2 * 0.5}`}
                  stroke="#02060C" strokeWidth={1.6 + rnd(i, 111) * 1.8} strokeLinecap="round" />
                <path d={`M${t.x} ${t.y} l${t.dx * len} ${t.dy * len * 0.7}`}
                  stroke={i % 2 ? T.teal : T.violet} strokeWidth="1" strokeOpacity="0.3" />
              </g>
            );
          })}
          {/* 垂下的光纤丝：像枯枝上的藤蔓 */}
          {Array.from({ length: 34 }, (_, i) => {
            const x = 470 + rnd(i, 41) * 700;
            const y0 = 170 + rnd(i, 43) * 320;
            const drop = 90 + rnd(i, 49) * 140;
            return (
              <path key={i}
                d={`M${x} ${y0} Q${x + (rnd(i, 45) - 0.5) * 50} ${y0 + drop * 0.5} ${x + (rnd(i, 47) - 0.5) * 30} ${y0 + drop}`}
                stroke={rnd(i, 53) > 0.7 ? T.violet : T.pale} strokeWidth={0.8 + rnd(i, 55) * 1.2}
                strokeOpacity={0.12 + rnd(i, 51) * 0.24} fill="none" />
            );
          })}
          {/* 根部：从主干张开探入花田 */}
          {[-1, 1].map(s => (
            <g key={s}>
              <path d={`M${s < 0 ? 798 : 834} 660 C${s < 0 ? 768 : 866} 690 ${s < 0 ? 706 : 900} 700 ${s < 0 ? 640 : 968} 726 L${s < 0 ? 664 : 940} 742 C${s < 0 ? 730 : 880} 716 ${s < 0 ? 780 : 850} 706 ${s < 0 ? 806 : 828} 692 Z`}
                fill="#02060C" />
              <path d={`M${s < 0 ? 798 : 834} 660 C${s < 0 ? 768 : 866} 690 ${s < 0 ? 706 : 900} 700 ${s < 0 ? 640 : 968} 726`}
                stroke={T.teal} strokeWidth="1.6" strokeOpacity="0.26" fill="none" />
            </g>
          ))}
        </g>

        {/* 漂浮的记忆碎片 */}
        {Array.from({ length: 22 }, (_, i) => {
          const x = 90 + rnd(i, 61) * 1420;
          const y = 150 + rnd(i, 63) * 330;
          const s = 3 + rnd(i, 65) * 9;
          return (
            <g key={i} transform={`rotate(${rnd(i, 67) * 90} ${x} ${y})`} opacity={0.4 + rnd(i, 69) * 0.45}>
              <path d={`M${x} ${y} l${s} ${-s * 0.4} l${s * 0.5} ${s * 0.7} l${-s * 0.8} ${s * 0.3} Z`}
                fill={rnd(i, 71) > 0.6 ? T.violet : T.mint} opacity="0.5" />
              <circle cx={x} cy={y} r="1.2" fill="#F2FBF7" filter={`url(#${uid}-glow)`} />
            </g>
          );
        })}

        {/* 体积光：冷白光柱穿过青紫雾 */}
        {[[430, 0.5], [780, 0.85], [1120, 0.45]].map(([x, o], i) => (
          <path key={i} d={`M${x - 30} -130 L${x + 30} -130 L${x + 260} 760 L${x - 260} 760 Z`}
            fill={T.mint} opacity={0.035 * (o as number)} filter={`url(#${uid}-blur)`} />
        ))}

        {/* 破碎的透明玻璃地面：碎片 + 裂纹 + 下方虚空（抬高到可见区下缘） */}
        <g>
          <rect x="0" y={604} width="1600" height={320} fill={`url(#${uid}-void)`} opacity="0.85" />
          {Array.from({ length: 14 }, (_, i) => {
            const x = -40 + rnd(i, 81) * 1700;
            const y = 616 + rnd(i, 83) * 130;
            const s = 90 + rnd(i, 85) * 190;
            return (
              <g key={i}>
                <path d={`M${x} ${y} l${s} ${-s * 0.2} l${s * 0.44} ${s * 0.46} l${-s * 0.92} ${s * 0.3} Z`}
                  fill="#050A14" opacity="0.6" stroke={T.pale} strokeOpacity={0.14 + rnd(i, 87) * 0.12} strokeWidth="1" />
                {/* 玻璃上缘的高光 */}
                <path d={`M${x} ${y} l${s} ${-s * 0.2}`} stroke={T.pale} strokeWidth="1.6"
                  strokeOpacity={0.24 + rnd(i, 89) * 0.2} fill="none" filter={`url(#${uid}-glow)`} />
              </g>
            );
          })}
          {Array.from({ length: 7 }, (_, i) => {
            const x = rnd(i, 91) * 1600;
            return <path key={i} d={`M${x} 622 L${x + 58} 656 L${x + 14} 694 L${x + 96} 742`}
              stroke={T.pale} strokeOpacity="0.2" strokeWidth="1.3" fill="none" />;
          })}
        </g>

        <FogBand uid={uid} y={700} h={160} opacity={0.6} />
        <Motes uid={uid} n={90} seed={11} color={T.violet} yMax={600} />
      </g>

      <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />
    </g>
  );
}

/* ═════ 第三章 · 被遗忘的实验档案（双壁档案塔 · 旋转索引核 · 删除痕迹） ═════ */

function Archive({ uid }: { uid: string }) {
  const VPX = 800;
  const VPY = 420;
  return (
    <g>
      <g transform="translate(0,-104)">
        <defs>
          {/* 档案货架的索引灯网格：平铺出密集灯光，避免大量独立图元 */}
          <pattern id={`${uid}-shelf`} width="30" height="34" patternUnits="userSpaceOnUse">
            <rect x="4" y="6" width="7" height="2.4" fill={T.mint} opacity="0.55" />
            <rect x="16" y="6" width="4" height="2.2" fill={T.pale} opacity="0.35" />
            <rect x="7" y="17" width="5" height="2.2" fill={T.pale} opacity="0.4" />
            <rect x="18" y="17" width="8" height="2.4" fill={T.mint} opacity="0.45" />
            <rect x="4" y="27" width="10" height="2" fill={T.violet} opacity="0.22" />
            <rect x="0" y="31" width="30" height="2" fill="#0B1A2A" />
          </pattern>
        </defs>

        {/* 深空底 */}
        <Wash uid={uid} cx={VPX} cy={VPY} rx={620} ry={430} color={T.teal} opacity={0.14} />
        <Wash uid={uid} cx={300} cy={300} rx={420} ry={380} color={T.blue} opacity={0.12} />
        <Wash uid={uid} cx={1300} cy={320} rx={420} ry={380} color={T.blue} opacity={0.12} />

        {/* 两侧档案塔：一层层向灭点收束的货架 */}
        {Array.from({ length: 15 }, (_, i) => {
          const t = i / 14;
          const s = 1 - t * 0.84;
          const inner = 60 + t * 620;         // 内缘向中间收
          const w = 168 * s + 26;
          const top = -170;                   // 塔体上下都超出画面，避免露出阶梯状断口
          const bot = 1200;
          const hollow = rnd(i, 5) > 0.62;    // 部分档案柱已被清空
          return (
            <g key={i}>
              {[
                { x: inner - w, tilt: (rnd(i, 7) - 0.5) * 1.6 },              // 左
                { x: 1600 - inner, tilt: (rnd(i, 9) - 0.5) * 1.6 },           // 右
              ].map((side, k) => (
                <g key={k} transform={`rotate(${side.tilt} ${side.x + w / 2} ${bot})`}>
                  <rect x={side.x} y={top} width={w} height={bot - top} fill={side.x < VPX ? '#071322' : '#061020'} />
                  {/* 塔与塔之间的竖向暗缝：让货架读成独立塔体 */}
                  <rect x={k === 0 ? side.x : side.x + w - 7} y={top} width="7" height={bot - top} fill="#010409" opacity="0.92" />
                  {/* 朝通道的内侧面压亮，让墙体成型 */}
                  <rect x={k === 0 ? side.x + w - w * 0.22 : side.x} y={top} width={w * 0.22} height={bot - top}
                    fill={T.pale} opacity="0.045" />
                  {/* 货架横梁 */}
                  {Array.from({ length: Math.max(6, Math.floor((bot - top) / (34 + t * 46))) }, (_, r) => {
                    const y = top + 16 + r * (34 + t * 46);
                    return (
                      <g key={r}>
                        <line x1={side.x + 2} y1={y} x2={side.x + w - 2} y2={y} stroke="#0B1A2A" strokeWidth="3.4" />
                        <line x1={side.x + 2} y1={y} x2={side.x + w - 2} y2={y} stroke={T.teal} strokeOpacity="0.16" strokeWidth="1" />
                      </g>
                    );
                  })}
                  {/* 索引灯网格：被清空的档案只剩很淡的残光 */}
                  <rect x={side.x} y={top} width={w} height={bot - top}
                    fill={`url(#${uid}-shelf)`} opacity={hollow ? 0.14 : 0.62} />
                  {/* 少量故障红点 */}
                  {Array.from({ length: hollow ? 2 : 5 }, (_, r) => (
                    <rect key={r}
                      x={side.x + 6 + rnd(r + i, 11) * Math.max(6, w - 14)}
                      y={top + 30 + rnd(r + i, 13) * (bot - top - 60)}
                      width={2.4} height={2.4} fill={T.ember} opacity={0.5 + rnd(r + i, 15) * 0.4} />
                  ))}
                  {/* 断裂 / 倾斜造成的黑色损坏区 */}
                  {rnd(i * 2 + k, 19) > 0.6 && (
                    <path d={`M${side.x + w * 0.2} ${bot - (bot - top) * 0.28} l${w * 0.5} ${-(bot - top) * 0.08} l${w * 0.1} ${(bot - top) * 0.2} l${-w * 0.55} ${(bot - top) * 0.06} Z`}
                      fill="#01040A" opacity="0.9" />
                  )}
                  {/* 朝通道一侧的冷光边 */}
                  <line x1={k === 0 ? side.x + w - 2 : side.x + 2} y1={top + 8}
                    x2={k === 0 ? side.x + w - 2 : side.x + 2} y2={bot - 8}
                    stroke={T.pale} strokeWidth={1.6 - t} strokeOpacity={0.2 - t * 0.12} />
                </g>
              ))}
            </g>
          );
        })}

        {/* 中央索引核：多层垂直旋转的储存环 */}
        <g>
          <ellipse cx={VPX} cy={VPY} rx={190} ry={54} fill={T.teal} opacity="0.1" filter={`url(#${uid}-blur)`} />
          {/* 竖轴 */}
          <path d={`M${VPX - 16} 560 L${VPX - 9} 150 L${VPX + 9} 150 L${VPX + 16} 560 Z`} fill="#03080F" />
          <line x1={VPX - 16} y1={560} x2={VPX - 9} y2={150} stroke={T.pale} strokeWidth="1.6" strokeOpacity="0.24" />
          <line x1={VPX + 16} y1={560} x2={VPX + 9} y2={150} stroke={T.teal} strokeWidth="1.4" strokeOpacity="0.18" />
          {/* 六个储存环：错位旋转、逐层变小 */}
          {[
            { cy: 540, rx: 230, ry: 58, rot: -7 },
            { cy: 480, rx: 208, ry: 52, rot: 6 },
            { cy: 420, rx: 182, ry: 46, rot: -5 },
            { cy: 360, rx: 152, ry: 39, rot: 8 },
            { cy: 300, rx: 120, ry: 31, rot: -6 },
            { cy: 244, rx: 88, ry: 23, rot: 5 },
          ].map((r, i) => (
            <g key={i} transform={`rotate(${r.rot} ${VPX} ${r.cy})`}>
              <ellipse cx={VPX} cy={r.cy} rx={r.rx} ry={r.ry} fill="none"
                stroke={i % 2 ? T.pale : T.mint} strokeWidth="6" strokeOpacity={0.34 - i * 0.03} filter={`url(#${uid}-glow)`} />
              <ellipse cx={VPX} cy={r.cy} rx={r.rx} ry={r.ry} fill="none"
                stroke="#02070C" strokeWidth="2.2" strokeOpacity="0.9" />
              {/* 环上的刻度与配重 */}
              {Array.from({ length: 10 }, (_, k) => {
                const a = (k / 10) * Math.PI * 2;
                return <rect key={k} x={VPX + Math.cos(a) * r.rx - 2} y={r.cy + Math.sin(a) * r.ry - 2}
                  width="4" height="4" fill={T.mint} opacity={0.35} />;
              })}
            </g>
          ))}
          {/* 核心炽光 */}
          <circle cx={VPX} cy={VPY} r="34" fill={T.mint} opacity="0.22" filter={`url(#${uid}-blur)`} />
          <circle cx={VPX} cy={VPY} r="9" fill="#EAFBF7" opacity="0.9" filter={`url(#${uid}-glow)`} />
        </g>

        {/* 被删除档案形成的黑色数据旋涡 */}
        {[0, 1, 2, 3].map(i => (
          <ellipse key={i} cx={VPX} cy={VPY - 10 + i * 8} rx={286 - i * 30} ry={76 - i * 9}
            fill="none" stroke="#01040A" strokeWidth={7 - i * 1.2} strokeOpacity="0.7"
            strokeDasharray={`${70 + i * 22} ${30 + i * 9}`} transform={`rotate(${-14 + i * 7} ${VPX} ${VPY})`} />
        ))}
        {Array.from({ length: 26 }, (_, i) => {
          const a = rnd(i, 21) * Math.PI * 2;
          const rr = 120 + rnd(i, 23) * 190;
          const x = VPX + Math.cos(a) * rr;
          const y = VPY - 10 + Math.sin(a) * rr * 0.3;
          const s = 4 + rnd(i, 25) * 12;
          return (
            <g key={i} transform={`rotate(${rnd(i, 27) * 120} ${x} ${y})`} opacity={0.5 + rnd(i, 29) * 0.4}>
              <path d={`M${x} ${y} l${s} ${-s * 0.3} l${s * 0.4} ${s * 0.6} l${-s * 0.7} ${s * 0.3} Z`}
                fill="#050B14" stroke={T.pale} strokeOpacity="0.3" strokeWidth="1" />
            </g>
          );
        })}

        {/* 远处漫长的档案通道与尽头冷光（窄口，避免形成大三角光斑） */}
        <g>
          <path d={`M${VPX - 96} 600 L${VPX - 40} ${VPY + 22} L${VPX + 40} ${VPY + 22} L${VPX + 96} 600 Z`} fill="#02070C" opacity="0.92" />
          <rect x={VPX - 30} y={VPY - 18} width="60" height="42" fill={T.mint} opacity="0.4" filter={`url(#${uid}-blur)`} />
          <rect x={VPX - 12} y={VPY - 6} width="24" height="20" fill="#D8FFF6" opacity="0.8" />
          <rect x={VPX - 12} y={VPY - 6} width="24" height="20" fill="none" stroke={T.mint} strokeOpacity="0.5" />
        </g>

        {/* 地面：暗色反光地砖 + 少量地灯 */}
        <rect x="0" y="600" width="1600" height="300" fill="#030810" />
        {Array.from({ length: 9 }, (_, i) => {
          const t = i / 8;
          const y = 606 + t * t * 300;
          const hw = 120 + t * 760;
          return <line key={i} x1={VPX - hw} y1={y} x2={VPX + hw} y2={y} stroke={T.pale} strokeOpacity={0.08 - t * 0.03} strokeWidth="1.2" />;
        })}
        {[-1, 1].map(s => [0.3, 0.55, 0.8].map((f, k) => (
          <line key={`${s}-${k}`} x1={VPX + s * 60} y1={620} x2={VPX + s * 900} y2={940}
            stroke={T.pale} strokeOpacity="0.06" strokeWidth="1.2" />
        )))}
        {/* 地上的发光地灯（参考图里的亮砖） */}
        {[
          { x: 300, y: 700, r: 26 }, { x: 620, y: 760, r: 22 }, { x: 1180, y: 736, r: 24 }, { x: 1420, y: 690, r: 20 },
        ].map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={p.r} ry={p.r * 0.32} fill="#DFFFF8" opacity="0.22" filter={`url(#${uid}-blur)`} />
        ))}
        <ellipse cx={VPX} cy={700} rx={420} ry={110} fill={T.teal} opacity="0.1" filter={`url(#${uid}-blur)`} />

        {/* 灰白数据碎片（数字灰尘） */}
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={60 + rnd(i, 31) * 1480} cy={180 + rnd(i, 33) * 620}
            r={0.7 + rnd(i, 35) * 2.2} fill="#C9D6E4" opacity={0.12 + rnd(i, 37) * 0.4} />
        ))}
        {Array.from({ length: 16 }, (_, i) => {
          const x = 120 + rnd(i, 41) * 1360;
          const y = 420 + rnd(i, 43) * 380;
          const s = 5 + rnd(i, 45) * 14;
          return <path key={i} d={`M${x} ${y} l${s} ${-s * 0.3} l${s * 0.4} ${s * 0.5} l${-s * 0.8} ${s * 0.2} Z`}
            fill="#8FA2B6" opacity={0.1 + rnd(i, 47) * 0.24} />;
        })}

        {/* 少量红色高权限删除警告灯（藏色） */}
        {[
          { x: 470, y: 300 }, { x: 1180, y: 268 }, { x: 330, y: 470 }, { x: 1300, y: 452 }, { x: 700, y: 214 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.6" fill={T.ember} opacity="0.85" filter={`url(#${uid}-glow)`} />
            <circle cx={p.x} cy={p.y} r="10" fill={T.ember} opacity="0.1" filter={`url(#${uid}-blur)`} />
          </g>
        ))}

        <FogBand uid={uid} y={500} h={200} opacity={0.8} />
        <FogBand uid={uid} y={660} h={200} opacity={0.6} />
        <Motes uid={uid} n={70} seed={13} color={T.pale} yMax={560} />
      </g>

      <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />
    </g>
  );
}

/* ═════ 第四章 · 失控的核心工坊（自动化工厂 · 机械臂 · 熔融能源塔） ═════ */

function Workshop({ uid }: { uid: string }) {
  /** 机械臂：分段粗臂 + 关节圆 + 液压管 */
  const drawArm = (pts: [number, number][], w0 = 30, hot = false) => (
    <g>
      {pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1];
        const w = w0 * (1 - i * 0.2);
        return (
          <g key={i}>
            <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#0A1622" strokeWidth={w} strokeLinecap="round" />
            <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#16283A" strokeWidth={w * 0.62} strokeLinecap="round" />
            {/* 面板分割线 */}
            <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#02070C" strokeWidth="1.6" strokeOpacity="0.7" />
            {/* 上缘棱光：靠近熔池的一侧更暖 */}
            <line x1={p[0]} y1={p[1] - w * 0.34} x2={q[0]} y2={q[1] - w * 0.34}
              stroke={hot && i > 1 ? T.ember : T.pale} strokeWidth="2.4" strokeOpacity={hot ? 0.42 : 0.2} />
            <circle cx={q[0]} cy={q[1]} r={w * 0.52} fill="#0A1620" stroke={T.teal} strokeOpacity="0.22" strokeWidth="1.6" />
            <circle cx={q[0]} cy={q[1]} r={w * 0.18} fill="#02070C" />
          </g>
        );
      })}
    </g>
  );

  return (
    <g>
      <g transform="translate(0,-104)">
        {/* 环境：冷青底 + 熔池暖光（压低整体亮度，靠熔池做唯一强光源） */}
        <Wash uid={uid} cx={820} cy={470} rx={380} ry={260} color={T.ember} opacity={0.15} />
        <Wash uid={uid} cx={300} cy={260} rx={460} ry={380} color={T.teal} opacity={0.08} />
        <Wash uid={uid} cx={1320} cy={300} rx={420} ry={360} color={T.blue} opacity={0.08} />

        {/* 远景：工业塔架与巨大机门剪影 */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = -40 + i * 150 + rnd(i, 3) * 40;
          const w = 60 + rnd(i, 5) * 90;
          const h = 220 + rnd(i, 7) * 320;
          return (
            <g key={i} opacity={0.5}>
              <rect x={x} y={470 - h} width={w} height={h} fill="#040B12" />
              {Array.from({ length: 4 }, (_, k) => (
                <line key={k} x1={x + 6} y1={470 - h + 20 + k * (h / 4.4)} x2={x + w - 6} y2={470 - h + 20 + k * (h / 4.4)}
                  stroke={T.teal} strokeOpacity="0.07" />
              ))}
              {/* 少量橙色能源灯 */}
              {rnd(i, 9) > 0.55 && (
                <rect x={x + w * 0.4} y={470 - h * 0.7} width="4" height={h * 0.4} fill={T.amber} opacity="0.12" />
              )}
            </g>
          );
        })}
        {/* 远处巨大机门 */}
        <rect x={700} y={200} width="200" height="270" fill="#02070C" />
        <rect x={712} y={214} width="176" height="246" fill="none" stroke={T.teal} strokeOpacity="0.14" strokeWidth="2" />
        <line x1={800} y1={214} x2={800} y2={460} stroke={T.teal} strokeOpacity="0.1" />

        {/* 把远景压暗：让前景机械与熔池拉开层次 */}
        <rect x="0" y="0" width="1600" height="900" fill="#01050B" opacity="0.5" />

        {/* 顶部桁架与吊架 */}
        {[60, 200, 340, 480, 620].map((y, i) => (
          <g key={i}>
            <rect x="-40" y={y} width="1680" height="14" fill="#050D14" />
            <rect x="-40" y={y} width="1680" height="2" fill={T.pale} opacity="0.1" />
          </g>
        ))}
        {Array.from({ length: 8 }, (_, i) => {
          const x = 110 + i * 200;
          return (
            <g key={i}>
              <line x1={x} y1={0} x2={x} y2={120} stroke="#050D14" strokeWidth="5" />
              {/* 悬挂的橙色工灯 */}
              <circle cx={x} cy={124} r="5" fill={T.amber} opacity="0.7" filter={`url(#${uid}-glow)`} />
              <circle cx={x} cy={124} r="16" fill={T.amber} opacity="0.12" filter={`url(#${uid}-blur)`} />
            </g>
          );
        })}

        {/* 中央能源塔：旋转机械环 + 服务器结构 + 不稳定橙光 */}
        <g>
          <path d="M966 520 L986 170 L1120 170 L1140 520 Z" fill="#0E1C28" />
          <path d="M966 520 L986 170 L1120 170 L1140 520 Z" fill="none" stroke={T.pale} strokeOpacity="0.22" strokeWidth="2" />
          <line x1={986} y1={170} x2={966} y2={520} stroke={T.pale} strokeWidth="2.6" strokeOpacity="0.32" filter={`url(#${uid}-glow)`} />
          {/* 塔身分段 */}
          {[210, 270, 330, 390, 450].map((y, i) => (
            <g key={i}>
              <ellipse cx={1053} cy={y} rx={72 - i * 3} ry={17} fill="none" stroke={T.teal} strokeOpacity="0.2" strokeWidth="2" />
              <rect x={982 + i} y={y - 6} width={142 - i * 2} height="12" fill="#061019" stroke="#0B1A24" />
              {/* 不稳定橙光带 */}
              {i % 2 === 0 && (
                <rect x={986 + i} y={y - 5} width={130 - i * 2} height="10" fill={T.ember} opacity="0.5" filter={`url(#${uid}-blur)`} />
              )}
            </g>
          ))}
          {/* 旋转机械环 */}
          {[
            { cy: 300, rx: 128, rot: -8 },
            { cy: 360, rx: 146, rot: 6 },
            { cy: 420, rx: 156, rot: -4 },
          ].map((r, i) => (
            <g key={i} transform={`rotate(${r.rot} 1053 ${r.cy})`}>
              <ellipse cx={1053} cy={r.cy} rx={r.rx} ry={30} fill="none" stroke={i === 1 ? T.ember : T.pale}
                strokeWidth="7" strokeOpacity={i === 1 ? 0.45 : 0.26} filter={`url(#${uid}-glow)`} />
              <ellipse cx={1053} cy={r.cy} rx={r.rx} ry={30} fill="none" stroke="#02070C" strokeWidth="2" strokeOpacity="0.9" />
            </g>
          ))}
          {/* 控制模块与指示灯 */}
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={1000 + rnd(i, 11) * 110} y={186 + rnd(i, 13) * 320}
              width={5 + rnd(i, 15) * 9} height="3.4"
              fill={rnd(i, 17) > 0.6 ? T.ember : T.mint} opacity={0.3 + rnd(i, 19) * 0.45} />
          ))}
          {/* 塔基与管线 */}
          <rect x={962} y={506} width="182" height="18" fill="#040C14" />
          {[-1, 1].map(s => (
            <path key={s} d={`M${1053 + s * 40} 520 C${1053 + s * 120} 520 ${1053 + s * 190} 500 ${1053 + s * 240} 520`}
              stroke={s < 0 ? T.ember : T.teal} strokeWidth="5" strokeOpacity="0.3" fill="none" filter={`url(#${uid}-glow)`} />
          ))}
        </g>

        {/* 机械臂：左侧抓取空气、右侧对准熔池、上方倾倒 */}
        {drawArm([[90, 470], [250, 300], [470, 330], [600, 296]], 44, true)}
        {drawArm([[1520, 470], [1330, 300], [1180, 280], [1108, 300]], 40, true)}
        {drawArm([[560, 120], [660, 250], [745, 330], [812, 392]], 30, true)}

        {/* 熔融倾注与坩埚 */}
        <g>
          {/* 浇注流 */}
          <path d="M816 394 C824 430 830 462 838 492 L862 492 C852 458 844 428 836 394 Z"
            fill={`url(#${uid}-beam)`} opacity="0.95" filter={`url(#${uid}-soft)`} />
          <path d="M822 396 C828 434 834 464 840 490 L852 490 C846 462 840 430 834 396 Z"
            fill={T.hot} opacity="0.6" filter={`url(#${uid}-blur)`} />
          {/* 飞溅火花 */}
          {Array.from({ length: 22 }, (_, i) => {
            const x = 826 + (rnd(i, 21) - 0.5) * 90;
            const y = 430 + rnd(i, 23) * 66;
            return <circle key={i} cx={x} cy={y} r={0.8 + rnd(i, 25) * 1.8}
              fill={rnd(i, 27) > 0.4 ? T.hot : T.amber} opacity={0.4 + rnd(i, 29) * 0.5} filter={`url(#${uid}-glow)`} />;
          })}
          {/* 坩埚与熔池 */}
          <path d="M760 520 L900 520 L878 552 L782 552 Z" fill="#050D14" stroke="#0B1A24" strokeWidth="2" />
          <ellipse cx={830} cy={518} rx={66} ry={16} fill={T.ember} opacity="0.85" filter={`url(#${uid}-soft)`} />
          <ellipse cx={830} cy={516} rx={44} ry={10} fill={T.hot} opacity="0.9" filter={`url(#${uid}-blur)`} />
          <ellipse cx={830} cy={500} rx={150} ry={54} fill={T.ember} opacity="0.2" filter={`url(#${uid}-blur)`} />
        </g>

        {/* 传送带与生产线 */}
        {[
          { y: 556, x0: -40, x1: 660 },
          { y: 604, x0: 940, x1: 1680 },
        ].map((b, i) => (
          <g key={i}>
            <rect x={b.x0} y={b.y} width={b.x1 - b.x0} height="16" fill="#050D14" />
            <rect x={b.x0} y={b.y} width={b.x1 - b.x0} height="2.4" fill={T.teal} opacity="0.2" />
            {Array.from({ length: Math.floor((b.x1 - b.x0) / 46) }, (_, k) => {
              const x = b.x0 + k * 46;
              return (
                <g key={k}>
                  <line x1={x} y1={b.y + 16} x2={x} y2={b.y + 30} stroke="#050D14" strokeWidth="4" />
                  {/* 传送带上的零件：部分是破碎数据块 */}
                  {rnd(k + i, 31) > 0.42 && (
                    <rect x={x + 8} y={b.y - 10} width={6 + rnd(k + i, 33) * 14} height={8 + rnd(k + i, 35) * 6}
                      fill="#0A1620" stroke={rnd(k + i, 37) > 0.6 ? T.ember : T.teal} strokeOpacity="0.4" />
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* 密集光纤与能源管道（橙 / 青对比，只保留几条主脉，避免雾化） */}
        {Array.from({ length: 6 }, (_, i) => {
          const y = 160 + i * 52;
          const warm = i % 3 === 0;
          return (
            <path key={i}
              d={`M-40 ${y} C${240} ${y - 40} ${420} ${y + 50} ${640} ${y + 10} M${980} ${y + 18} C${1200} ${y - 20} ${1400} ${y + 40} 1680 ${y}`}
              stroke={warm ? T.ember : T.teal} strokeWidth={1.4 + rnd(i, 41) * 2}
              strokeOpacity={warm ? 0.26 : 0.14} fill="none" filter={warm ? `url(#${uid}-glow)` : undefined} />
          );
        })}

        {/* 前景剪影：检修台与货箱，压出最前层次 */}
        <rect x={30} y={556} width={200} height={96} fill="#01050A" />
        <rect x={30} y={556} width={200} height="3" fill={T.pale} opacity="0.16" />
        <rect x={62} y={514} width={126} height={44} fill="#01050A" />
        <rect x={62} y={514} width={126} height="2.4" fill={T.amber} opacity="0.2" />
        <rect x={1376} y={572} width={240} height={82} fill="#01050A" />
        <rect x={1376} y={572} width={240} height="3" fill={T.teal} opacity="0.16" />

        {/* 地面：深色金属平台 + 轨道 + 熔光反射 */}
        <rect x="0" y="660" width="1600" height="240" fill="#040A10" />
        {Array.from({ length: 10 }, (_, i) => {
          const t = i / 9;
          const y = 664 + t * t * 236;
          const hw = 180 + t * 900;
          return <line key={i} x1={800 - hw} y1={y} x2={800 + hw} y2={y} stroke={T.pale} strokeOpacity={0.07 - t * 0.02} strokeWidth="1.2" />;
        })}
        {[-1, 1].map(s => (
          <line key={s} x1={800 + s * 120} y1={664} x2={800 + s * 900} y2={900} stroke={T.pale} strokeOpacity="0.06" strokeWidth="1.4" />
        ))}
        {/* 熔池在地面的倒影 */}
        <rect x={720} y={660} width={240} height={140} fill={T.ember} opacity="0.14" filter={`url(#${uid}-blur)`} />
        <rect x={790} y={664} width={90} height={90} fill={T.amber} opacity="0.16" filter={`url(#${uid}-blur)`} />

        {/* 火花与数字粒子 */}
        {Array.from({ length: 26 }, (_, i) => {
          const x = 60 + rnd(i, 51) * 1480;
          const y = 180 + rnd(i, 53) * 440;
          const len = 10 + rnd(i, 55) * 34;
          return (
            <line key={i} x1={x} y1={y} x2={x - len * 0.3} y2={y + len}
              stroke={rnd(i, 57) > 0.5 ? T.amber : T.pale} strokeWidth={0.8 + rnd(i, 59) * 1.2}
              strokeOpacity={0.16 + rnd(i, 61) * 0.3} />
          );
        })}

        <FogBand uid={uid} y={480} h={180} opacity={0.55} />
        <Motes uid={uid} n={70} seed={15} color={T.pale} yMax={520} />
      </g>

      <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />
    </g>
  );
}

/* ───────────────────────── 其余场景：轻量变体 ───────────────────────── */

function Variant({ uid, kind }: { uid: string; kind: 'dataport' | 'memory' | 'core' | 'terminal' }) {
  if (kind === 'core') {
    return (
      <g>
        <circle cx="800" cy="420" r="420" fill={`url(#${uid}-halo)`} opacity="0.7" />
        <Wash uid={uid} cx={800} cy={430} rx={340} ry={300} color={T.violet} opacity={0.22} />
        <Skyline uid={uid} seed={61} count={12} baseY={790} hMin={90} hMax={250} tone="violet" opacity={0.45} />
        <circle cx="800" cy="420" r="150" fill="none" stroke={`url(#${uid}-ring)`} strokeOpacity="0.4" strokeWidth="3" />
        <circle cx="800" cy="420" r="62" fill={T.amber} opacity="0.24" filter={`url(#${uid}-blur)`} />
        <circle cx="800" cy="420" r="12" fill="#FFF2D8" opacity="0.95" filter={`url(#${uid}-glow)`} />
        <Motes uid={uid} n={60} seed={23} color={T.amber} />
        <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />
      </g>
    );
  }
  if (kind === 'terminal') {
    return (
      <g>
        <ellipse cx="800" cy="520" rx="420" ry="240" fill={`url(#${uid}-halo)`} opacity="0.5" />
        <Skyline uid={uid} seed={71} count={12} baseY={800} hMin={70} hMax={200} tone="far" opacity={0.35} />
        <rect x="330" y="320" width="940" height="310" rx="10" fill="#04120C" opacity="0.86" stroke={T.mint} strokeOpacity="0.28" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x="360" y={356 + i * 38} width={170 + rnd(i, 5) * 560} height="4" fill={T.mint} opacity={0.14 + rnd(i, 7) * 0.2} />
        ))}
        <Motes uid={uid} n={34} seed={29} color={T.mint} />
        <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />
      </g>
    );
  }
  const warm = kind === 'memory';
  return (
    <g>
      <circle cx="800" cy="400" r="380" fill={`url(#${uid}-${warm ? 'ember' : 'halo'})`} opacity="0.65" />
      <Skyline uid={uid} seed={warm ? 83 : 89} count={13} baseY={800} hMin={80} hMax={230}
        tone={warm ? 'amber' : 'far'} opacity={0.4} />
      <Wash uid={uid} cx={warm ? 1150 : 380} cy={420} rx={280} ry={230} color={warm ? T.rose : T.teal} opacity={0.12} />
      <circle cx="800" cy="380" r="230" fill="none" stroke={warm ? T.amber : T.pale} strokeOpacity="0.22" strokeWidth="1.6" />
      <circle cx="800" cy="380" r="40" fill={warm ? T.amber : T.mint} opacity="0.26" filter={`url(#${uid}-blur)`} />
      <Motes uid={uid} n={64} seed={31} color={warm ? T.amber : T.pale} />
      <rect x="0" y="700" width="1600" height="200" fill={`url(#${uid}-bottom)`} />
    </g>
  );
}

export default function SceneArt({ bg }: { bg: SceneBg }) {
  const override = SCENE_ART_OVERRIDE[bg];
  if (override) {
    return (
      <div className="cine-art cine-art-photo">
        <img src={override} alt="" />
      </div>
    );
  }

  const uid = `sa-${bg}`;
  const warm = bg === 'core' ? 'violet' : bg === 'memory' ? 'amber' : bg === 'terminal' ? 'green' : undefined;

  return (
    <div className="cine-art" aria-hidden="true">
      <div className="cine-art-inner">
        <svg className="cine-art-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <Defs uid={uid} warm={warm} />

          <rect width="1600" height="900" fill={T.deep} />

          {bg === 'underground' && <Underground uid={uid} />}
          {bg === 'corridor' && <Corridor uid={uid} />}
          {bg === 'void' && <Void uid={uid} />}
          {bg === 'dataport' && <Dataport uid={uid} />}
          {(bg === 'memory' || bg === 'core') && <Variant uid={uid} kind={bg} />}
          {bg === 'garden' && <Garden uid={uid} />}
          {bg === 'archive' && <Archive uid={uid} />}
          {bg === 'workshop' && <Workshop uid={uid} />}
          {bg === 'terminal' && <Terminal uid={uid} />}

          {/* 暗角（电影感影调） */}
          <rect width="1600" height="900" fill={`url(#${uid}-vig)`} />
          {/* 厚涂颗粒 */}
          <rect width="1600" height="900" filter={`url(#${uid}-grain)`} opacity="0.06" style={{ mixBlendMode: 'overlay' }} />
        </svg>
      </div>
    </div>
  );
}
