// 挑战页代码草稿：独立于主存档的本地草稿仓库
// 设计要点：
//   1. 每个玩家存档（identity.createdAt）+ 每个关卡一个独立 key，关卡之间物理隔离，不会互相覆盖；
//   2. 每条草稿自带版本号，结构升级可迁移；解析失败先备份原始文本，绝不静默丢弃；
//   3. 只保存玩家自己写的代码 + 真实判题通过的代码，不保存答案 / 隐藏测试 / 判题内部数据；
//   4. 写入失败（隐私模式、配额超限）返回 ok=false，由调用方显式提示，不假装成功。

export const DRAFT_KEY_PREFIX = 'nexus_draft_v1:';
export const DRAFT_CORRUPT_PREFIX = 'nexus_draft_corrupt_';
export const DRAFT_BACKUP_PREFIX = 'nexus_draft_backup_';
export const DRAFT_ENTRY_VERSION = 1;
/** 输入停止后多久落盘（毫秒） */
export const DRAFT_DEBOUNCE_MS = 500;
/** 历史快照上限（只保留不同内容的最近若干版） */
export const DRAFT_HISTORY_MAX = 8;

export interface DraftHistoryItem {
  code: string;
  at: number;
}

export interface DraftEntry {
  v: number;
  /** 最近一次保存的代码 */
  code: string;
  /** 最近一次保存时间（毫秒） */
  updatedAt: number;
  /** 真实判题通过时的代码快照（只由真实通过写入） */
  passedCode?: string;
  passedAt?: number;
  /** 旧版本快照（旧 → 新），用于「恢复上一版」 */
  history: DraftHistoryItem[];
}

export interface DraftWriteResult {
  ok: boolean;
  changed: boolean;
  entry?: DraftEntry;
  /** 失败原因（面向玩家的中文说明） */
  reason?: string;
  /** 主 key 写入失败时是否成功写入了备份 key */
  backedUp?: boolean;
}

/** 取得 localStorage（隐私模式下访问本身可能抛错） */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** 当前玩家存档的草稿命名空间：优先用身份建立时间（同一存档稳定、不同存档互不相同） */
export function draftNamespace(player: { identity?: { createdAt?: number } } | null | undefined): string {
  const t = player?.identity?.createdAt;
  if (typeof t === 'number' && isFinite(t) && t > 0) return 'p' + Math.floor(t);
  return 'guest';
}

export function draftKey(ns: string, levelId: string): string {
  return DRAFT_KEY_PREFIX + ns + ':' + levelId;
}

/** 从完整 key 解析出命名空间与关卡 id（无法识别返回 null） */
export function parseDraftKey(key: string): { ns: string; levelId: string } | null {
  if (!key.startsWith(DRAFT_KEY_PREFIX)) return null;
  const rest = key.slice(DRAFT_KEY_PREFIX.length);
  const i = rest.indexOf(':');
  if (i <= 0 || i >= rest.length - 1) return null;
  return { ns: rest.slice(0, i), levelId: rest.slice(i + 1) };
}

function safeBackup(key: string, raw: string): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(DRAFT_BACKUP_PREFIX + Date.now() + '_' + key.replace(/[^\w-]/g, '_'), raw);
    return true;
  } catch {
    return false;
  }
}

function normalizeHistory(raw: unknown): DraftHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  const out: DraftHistoryItem[] = [];
  for (const item of raw) {
    const it = item as Partial<DraftHistoryItem> | null;
    if (!it || typeof it.code !== 'string') continue;
    out.push({ code: it.code, at: typeof it.at === 'number' && isFinite(it.at) ? it.at : 0 });
    if (out.length >= DRAFT_HISTORY_MAX) break;
  }
  return out;
}

/** 读取单条草稿；缺失返回 null；损坏时先备份再返回 null */
export function readDraft(ns: string, levelId: string): DraftEntry | null {
  const s = storage();
  if (!s) return null;
  const key = draftKey(ns, levelId);
  let raw: string | null = null;
  try {
    raw = s.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    const data = JSON.parse(raw) as Partial<DraftEntry>;
    if (!data || typeof data.code !== 'string') {
      safeBackup(key, raw);
      return null;
    }
    const entry: DraftEntry = {
      v: DRAFT_ENTRY_VERSION,
      code: data.code,
      updatedAt: typeof data.updatedAt === 'number' && isFinite(data.updatedAt) ? data.updatedAt : 0,
      history: normalizeHistory(data.history),
    };
    if (typeof data.passedCode === 'string') {
      entry.passedCode = data.passedCode;
      entry.passedAt = typeof data.passedAt === 'number' && isFinite(data.passedAt) ? data.passedAt : entry.updatedAt;
    }
    return entry;
  } catch {
    safeBackup(key, raw);
    return null;
  }
}

/**
 * 写入草稿。
 * - 内容与上次一致且不要求写入通过代码时返回 changed=false（不产生无意义写盘）；
 * - 内容变化时把上一版压入 history（去重、限长），保证「恢复上一版」可用；
 * - passed=true 时记录通关代码（只能由真实判题通过触发）。
 */
export function writeDraft(
  ns: string,
  levelId: string,
  code: string,
  opts?: { passed?: boolean; now?: number; force?: boolean },
): DraftWriteResult {
  const now = opts?.now ?? Date.now();
  const prev = readDraft(ns, levelId);
  if (prev && prev.code === code && !opts?.passed && !opts?.force) {
    return { ok: true, changed: false, entry: prev };
  }

  const history = prev ? prev.history.slice() : [];
  const prevCode = prev?.code;
  if (typeof prevCode === 'string' && prevCode.length > 0 && prevCode !== code) {
    const last = history[history.length - 1];
    if (!last || last.code !== prevCode) history.push({ code: prevCode, at: prev?.updatedAt || now });
    while (history.length > DRAFT_HISTORY_MAX) history.shift();
  }

  const entry: DraftEntry = {
    v: DRAFT_ENTRY_VERSION,
    code,
    updatedAt: now,
    history,
  };
  if (opts?.passed) {
    entry.passedCode = code;
    entry.passedAt = now;
  } else if (prev?.passedCode) {
    entry.passedCode = prev.passedCode;
    entry.passedAt = prev.passedAt;
  }

  const s = storage();
  const key = draftKey(ns, levelId);
  if (!s) {
    return { ok: false, changed: true, entry, reason: '浏览器本地存储不可用（可能是隐私模式）' };
  }
  try {
    s.setItem(key, JSON.stringify(entry));
    return { ok: true, changed: true, entry };
  } catch {
    const backedUp = safeBackup(key, JSON.stringify(entry));
    return {
      ok: false,
      changed: true,
      entry,
      backedUp,
      reason: backedUp
        ? '写入本地存储失败（可能已满），当前代码已转存为备份'
        : '写入本地存储失败（可能已满或不可用），请先复制代码',
    };
  }
}

/** 删除单条草稿 */
export function clearDraft(ns: string, levelId: string): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.removeItem(draftKey(ns, levelId));
    return true;
  } catch {
    return false;
  }
}

/** 列出某存档下已有草稿的关卡 id（用于调试与测试） */
export function listDraftLevels(ns: string): string[] {
  const s = storage();
  if (!s) return [];
  const out: string[] = [];
  try {
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (!k) continue;
      const parsed = parseDraftKey(k);
      if (parsed && parsed.ns === ns) out.push(parsed.levelId);
    }
  } catch {
    // 遍历失败时返回已收集结果
  }
  return out.sort();
}

/**
 * 清空草稿。
 * 传 ns 只清该存档；不传则清全部玩家的草稿（清空存档时使用）。
 */
export function clearAllDrafts(ns?: string): number {
  const s = storage();
  if (!s) return 0;
  const keys: string[] = [];
  try {
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (!k) continue;
      const parsed = parseDraftKey(k);
      if (!parsed) continue;
      if (ns === undefined || parsed.ns === ns) keys.push(k);
    }
    for (const k of keys) s.removeItem(k);
  } catch {
    return 0;
  }
  return keys.length;
}

/** 把毫秒时间格式化为 HH:MM（本地时区），用于「保存于 12:03」 */
export function formatDraftClock(ts: number | null | undefined): string {
  if (typeof ts !== 'number' || !isFinite(ts) || ts <= 0) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return hh + ':' + mm;
}

export interface AutosaveGuardInput {
  /** 本次渲染的编辑器内容 */
  code: string;
  /** 编辑器「应有内容」的权威值（关卡载入 / 程序化切换 / 用户输入时同步更新） */
  pending: string;
  /** 玩家是否真的改过 */
  touched: boolean;
  /** 本关是否已存在草稿 */
  hasDraft: boolean;
  /** 最近一次落盘的内容 */
  lastSaved: string;
}

/**
 * 是否应该触发一次防抖自动保存。
 * 关键场景：切换关卡的那一帧，`code` 还是上一关/初始值，而 `pending` 已经是新载入的草稿——
 * 此时若照常保存，就会用旧内容覆盖刚恢复的草稿。这个判定单独成函数便于测试。
 */
export function shouldAutosaveDraft(i: AutosaveGuardInput): boolean {
  if (i.code !== i.pending) return false;
  if (!i.touched && !i.hasDraft) return false;
  if (i.code === i.lastSaved) return false;
  return true;
}

export interface DebouncedFlush<T> {
  /** 推迟 delayMs 后写入最新值（重复调用重置计时） */
  schedule(value: T): void;
  /** 立即写入待写值（没有待写值时什么也不做） */
  flush(): void;
  /** 取消待写值（不写入） */
  cancel(): void;
  /** 是否有尚未落盘的值 */
  pending(): boolean;
}

/**
 * 通用防抖落盘器：输入停止 delayMs 后执行一次；页面切走时可 flush 立即落盘。
 * 独立成纯工具是为了能在 Node 里用真实计时器测试（组件只负责接线）。
 */
export function createDebouncedFlush<T>(fn: (value: T) => void, delayMs: number): DebouncedFlush<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let hasValue = false;
  let value: T;
  const clear = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return {
    schedule(v: T) {
      value = v;
      hasValue = true;
      clear();
      timer = setTimeout(() => {
        timer = null;
        if (!hasValue) return;
        hasValue = false;
        fn(value);
      }, delayMs);
    },
    flush() {
      clear();
      if (!hasValue) return;
      hasValue = false;
      fn(value);
    },
    cancel() {
      clear();
      hasValue = false;
    },
    pending() {
      return hasValue;
    },
  };
}
