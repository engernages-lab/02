// A6 经济配置与安全数值（无依赖的叶子模块，供 rewards / economy / store / 测试共用）
// 原则：
//   1. 所有奖励倍率、上限、价格带集中在这里；
//   2. 货币与经验进入存档前必须经过 safe* 夹取；
//   3. 奖励账本为每次入账提供唯一标识，一次性事件只允许入账一次。

export const ECONOMY = {
  version: 1,
  level: {
    baseDivisor: 3,
    baseMin: 15,
    firstClear: 30,
    noFail: 10,
    noHint: 10,
    gradeS: 20,
    gradeA: 12,
    gradeB: 6,
    improvementPerStar: 6,
    improvementMaxStars: 2,
    trustFirst: 2,
    trustS: 1,
    trustFirstExtra: 1,
    trustImprove: 1,
  },
  caps: {
    credits: 1_000_000,
    exp: 10_000_000,
    trust: 100,
  },
  /** 稀有度价格带（审计/测试用；运行时价格仍只来自商品目录） */
  priceBand: {
    common: { min: 20, max: 90 },
    rare: { min: 50, max: 170 },
    epic: { min: 90, max: 300 },
    legendary: { min: 200, max: 520 },
  },
  expBoost: { mult: 1.5, maxUses: 3 },
  /** 成长曲线约束：首级门槛不过高、末级不形成极端经验墙 */
  curve: { firstMax: 150, lastMax: 4000, growthRatioMax: 8 },
} as const;

/** 安全货币：有限数、取整、夹在 0..上限 */
export function safeCredits(v: unknown): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(ECONOMY.caps.credits, n);
}

/** 安全经验：有限数、取整、夹在 0..上限 */
export function safeExp(v: unknown): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(ECONOMY.caps.exp, n);
}

// ---------- 奖励账本：每次入账都有唯一标识 ----------

export type LedgerKind = 'level' | 'level-repeat' | 'boss' | 'chapter' | 'difficulty' | 'challenge';

export interface RewardLedgerEntry {
  id: string;
  kind: LedgerKind;
  /** 事件引用：关卡 id / Boss id / 章节 id / bossId+difficulty */
  ref: string;
  credits: number;
  exp: number;
  at: number;
}

export const MAX_LEDGER = 80;

/** 这些奖励事件在整份存档里只能入账一次 */
const ONE_TIME_KINDS: LedgerKind[] = ['level', 'boss', 'chapter', 'difficulty'];

export function ledgerId(kind: LedgerKind, ref: string, at: number): string {
  return 'rw-' + kind + '-' + ref + '-' + at.toString(36);
}

export function hasLedger(list: RewardLedgerEntry[] | undefined, kind: LedgerKind, ref: string): boolean {
  if (!Array.isArray(list)) return false;
  return list.some(e => e && e.kind === kind && e.ref === ref);
}

/**
 * 追加一条奖励流水。
 * 一次性事件（首通/首杀/章节/难度）已存在时返回原数组，调用方据此避免重复发奖。
 */
export function appendLedger(
  list: RewardLedgerEntry[] | undefined,
  entry: { kind: LedgerKind; ref: string; credits: number; exp: number; at?: number },
): RewardLedgerEntry[] {
  const cur = Array.isArray(list) ? list : [];
  if (ONE_TIME_KINDS.includes(entry.kind) && hasLedger(cur, entry.kind, entry.ref)) return cur;
  const at = typeof entry.at === 'number' && Number.isFinite(entry.at) ? Math.max(0, Math.floor(entry.at)) : Date.now();
  const row: RewardLedgerEntry = {
    id: ledgerId(entry.kind, entry.ref, at),
    kind: entry.kind,
    ref: entry.ref,
    credits: safeCredits(entry.credits),
    exp: safeExp(entry.exp),
    at,
  };
  return [...cur, row].slice(-MAX_LEDGER);
}

/** 规范化账本：过滤非法行、去重一次性事件、裁剪长度 */
export function normalizeLedger(raw: unknown): RewardLedgerEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: RewardLedgerEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Partial<RewardLedgerEntry>;
    const kind = e.kind;
    if (kind !== 'level' && kind !== 'level-repeat' && kind !== 'boss' && kind !== 'chapter' && kind !== 'difficulty') continue;
    if (typeof e.ref !== 'string' || !e.ref) continue;
    if (ONE_TIME_KINDS.includes(kind) && out.some(x => x.kind === kind && x.ref === e.ref)) continue;
    const at = Math.max(0, Math.floor(Number(e.at) || 0));
    out.push({
      id: typeof e.id === 'string' && e.id ? e.id : ledgerId(kind, e.ref, at),
      kind, ref: e.ref,
      credits: safeCredits(e.credits),
      exp: safeExp(e.exp),
      at,
    });
  }
  return out.slice(-MAX_LEDGER);
}
