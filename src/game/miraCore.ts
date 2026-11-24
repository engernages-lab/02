// V1.3-C：MIRA 成长 / 记忆 / 场景反馈 / 风险规则（纯逻辑，可序列化）
//
// 设计约束：
//   1. 经验只来自真实游戏事件，事件 ID 幂等；
//   2. 记忆由真实事件解锁，不写虚假剧情；
//   3. 场景对白只做上下文匹配，不随机刷屏；
//   4. 风险提示只读取真实玩家/战斗状态；
//   5. 不修改 Boss、Challenge、经济、奖励、统计等业务逻辑。

export type MiraStage = 'initial' | 'sync' | 'deep' | 'coop';

export interface MiraMemoryDef {
  id: string;
  name: string;
  type: 'connection' | 'repair' | 'explore' | 'crisis' | 'boss' | 'story';
  description: string;
  condition: string;
  mira: string;
}

export const MIRA_MEMORY_DEFS: MiraMemoryDef[] = [
  {
    id: 'mira-first-contact', name: '初始相遇', type: 'connection',
    description: '你第一次接入 NEXUS，MIRA 在噪声中辨认出你的意识信号。',
    condition: '与 MIRA 建立首次连接',
    mira: '信号匹配完成。R-07，从现在开始，我会和你一起读每一条错误。',
  },
  {
    id: 'mira-first-fix', name: '首次修复', type: 'repair',
    description: '你第一次独立修复代码故障，MIRA 记录下这次数据波动。',
    condition: '首次成功完成代码修复挑战',
    mira: '修复成功。我记录了这次数据波动——你的操作比上一次更稳定。',
  },
  {
    id: 'mira-first-explore', name: '首次探索', type: 'explore',
    description: '你第一次进入新的数字世界区域，MIRA 为你标记了安全通道。',
    condition: '首次解锁新的服务器区域',
    mira: '新的区域已标记。异常数据流在前方聚集，保持连接。',
  },
  {
    id: 'mira-major-crisis', name: '重大危机', type: 'crisis',
    description: '未知入侵越过防线，你与 MIRA 一起完成了隔离。',
    condition: '首次成功处理动态危机事件',
    mira: '隔离协议完成。我会记住这次入侵的波形，下次会更早发现它。',
  },
  {
    id: 'mira-boss-victory', name: 'Boss 战经历', type: 'boss',
    description: '你第一次击破章节 Boss，MIRA 的核心与战场共振。',
    condition: '首次成功击败 Boss',
    mira: '高危目标已沉默。你的意识波形很稳——这次胜利值得被记住。',
  },
  {
    id: 'mira-key-story', name: '关键剧情', type: 'story',
    description: '你完成了第一章的主线修复，MIRA 在日志里留下了第一段完整的记忆。',
    condition: '推进重要主线剧情',
    mira: '主线校验完成。R-07，我开始理解你为什么要回到这里。',
  },
];

const MEMORY_MAP = new Map(MIRA_MEMORY_DEFS.map(m => [m.id, m]));
export function miraMemoryById(id: string): MiraMemoryDef | undefined { return MEMORY_MAP.get(id); }

export const MIRA_EXP_TABLE = [0, 30, 80, 150, 250, 380, 540, 730, 950, 1200];

export interface MiraMemoryState { unlockedAt: number; read: boolean }
export interface MiraInteraction { id: string; scene: string; text: string; at: number }

export interface MiraState {
  version: 1;
  level: number;
  exp: number;
  stage: MiraStage;
  eventLog: string[];
  memories: Record<string, MiraMemoryState>;
  lastScene: Record<string, number>;
  interactions: MiraInteraction[];
  updatedAt: number;
}

export function miraLevelForExp(exp: number): number {
  const e = Math.max(0, Math.floor(Number(exp) || 0));
  let level = 1;
  for (let i = 0; i < MIRA_EXP_TABLE.length; i++) if (e >= MIRA_EXP_TABLE[i]) level = i + 1;
  return level;
}

export function miraStageForLevel(level: number): MiraStage {
  if (level >= 9) return 'coop';
  if (level >= 6) return 'deep';
  if (level >= 3) return 'sync';
  return 'initial';
}

export const MIRA_STAGE_LABEL: Record<MiraStage, string> = {
  initial: '初始连接', sync: '稳定同步', deep: '深度连接', coop: '高级协同',
};

export function defaultMiraState(now = Date.now()): MiraState {
  return {
    version: 1, level: 1, exp: 0, stage: 'initial',
    eventLog: [], memories: {}, lastScene: {}, interactions: [], updatedAt: now,
  };
}

const int = (v: unknown, fb = 0): number => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fb);

export function normalizeMiraState(raw: unknown, now = Date.now()): MiraState {
  const fresh = defaultMiraState(now);
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Partial<MiraState>;
  const exp = Math.max(0, Math.min(100000, int(r.exp)));
  const level = miraLevelForExp(exp);
  const eventLog = Array.isArray(r.eventLog)
    ? [...new Set(r.eventLog.filter((x): x is string => typeof x === 'string' && !!x))].slice(-300)
    : [];
  const memories: Record<string, MiraMemoryState> = {};
  if (r.memories && typeof r.memories === 'object') {
    for (const [id, v] of Object.entries(r.memories)) {
      if (!MEMORY_MAP.has(id) || !v || typeof v !== 'object') continue;
      const e = v as Partial<MiraMemoryState>;
      memories[id] = { unlockedAt: int(e.unlockedAt, now), read: e.read === true };
    }
  }
  const lastScene: Record<string, number> = {};
  if (r.lastScene && typeof r.lastScene === 'object') {
    for (const [k, v] of Object.entries(r.lastScene)) if (typeof v === 'number' && isFinite(v)) lastScene[k] = Math.max(0, Math.floor(v));
  }
  const interactions = Array.isArray(r.interactions)
    ? r.interactions.filter(x => x && typeof x === 'object' && typeof x.text === 'string')
      .map(x => ({ id: String(x.id || ''), scene: String(x.scene || ''), text: String(x.text || ''), at: int(x.at) }))
      .slice(-30)
    : [];
  return {
    version: 1, level, exp, stage: miraStageForLevel(level),
    eventLog, memories, lastScene, interactions,
    updatedAt: int(r.updatedAt, now),
  };
}

export interface MiraAwardResult {
  state: MiraState;
  changed: boolean;
  levelUp: boolean;
  fromLevel: number;
  toLevel: number;
  memoryUnlocked?: MiraMemoryDef;
}

export function miraUnlockMemory(state: MiraState, memoryId: string, now = Date.now()): { state: MiraState; changed: boolean; memory?: MiraMemoryDef } {
  const def = MEMORY_MAP.get(memoryId);
  if (!def || state.memories[memoryId]) return { state, changed: false };
  return {
    state: {
      ...state,
      memories: { ...state.memories, [memoryId]: { unlockedAt: now, read: false } },
      updatedAt: now,
    },
    changed: true,
    memory: def,
  };
}

export function miraAward(
  state: MiraState,
  input: { eventId: string; xp: number; source: string; memoryId?: string; now?: number },
): MiraAwardResult {
  const now = input.now ?? Date.now();
  const eventId = String(input.eventId || '');
  if (!eventId || state.eventLog.includes(eventId)) {
    return { state, changed: false, levelUp: false, fromLevel: state.level, toLevel: state.level };
  }
  const xp = Math.max(0, Math.min(500, Math.floor(input.xp || 0)));
  const eventLog = [...state.eventLog, eventId].slice(-300);
  const exp = state.exp + xp;
  const toLevel = miraLevelForExp(exp);
  const next: MiraState = {
    ...state, exp, level: toLevel, stage: miraStageForLevel(toLevel),
    eventLog, updatedAt: now,
  };
  let changed = true;
  let memoryUnlocked: MiraMemoryDef | undefined;
  if (input.memoryId) {
    const m = miraUnlockMemory(next, input.memoryId, now);
    if (m.changed) { memoryUnlocked = m.memory; Object.assign(next, m.state); }
  }
  return {
    state: next, changed, levelUp: toLevel > state.level,
    fromLevel: state.level, toLevel, memoryUnlocked,
  };
}

export function miraMarkRead(state: MiraState, memoryId: string, now = Date.now()): { state: MiraState; changed: boolean } {
  const e = state.memories[memoryId];
  if (!e || e.read) return { state, changed: false };
  return {
    state: { ...state, memories: { ...state.memories, [memoryId]: { ...e, read: true } }, updatedAt: now },
    changed: true,
  };
}

export function miraLevelProgress(state: MiraState): { level: number; exp: number; floor: number; next: number; pct: number } {
  const level = miraLevelForExp(state.exp);
  const floor = MIRA_EXP_TABLE[Math.min(level - 1, MIRA_EXP_TABLE.length - 1)];
  const next = level >= MIRA_EXP_TABLE.length ? floor : MIRA_EXP_TABLE[level];
  const pct = next > floor ? Math.max(0, Math.min(100, Math.round((state.exp - floor) / (next - floor) * 100))) : 100;
  return { level, exp: state.exp, floor, next, pct };
}

export type MiraScene =
  | 'menu' | 'enter-region' | 'fault' | 'repair-success' | 'challenge-fail'
  | 'reward' | 'memory-unlock' | 'boss-enter' | 'boss-phase' | 'boss-victory'
  | 'boss-defeat' | 'crisis';

const SCENE_LINES: Record<MiraScene, string[]> = {
  menu: [
    '连接稳定。R-07，今天想先修复哪一段数据？',
    '我在。终端日志保持同步，随时可以开始。',
  ],
  'enter-region': [
    '前方检测到异常数据流……这里似乎隐藏着尚未被发现的记录。',
    '新区域已建立映射。保持连接，我会标记可用的数据节点。',
  ],
  fault: [
    '这段代码的语法结构有偏差。先看错误行，不要急着改逻辑。',
    '终端在解析阶段停住了。我会把真实报错保留下来。',
  ],
  'repair-success': [
    '修复成功！我已经记录下这次数据波动。你的操作比上一次更加稳定了。',
    '判题通过。每一次成功修复，都在让我们的连接更稳定。',
  ],
  'challenge-fail': [
    '先别着急，错误出现在数据解析环节。我们重新检查一下输入条件。',
    '这次没有通过。运行不会计入失败次数，先用终端把错误读完整。',
  ],
  reward: [
    '奖励已归档。数字世界的反馈正在回到你身上。',
    '这次的结果我会记住。继续前进，R-07。',
  ],
  'memory-unlock': [
    '一段新的记忆已归档。我会保留它，不会覆盖。',
    '我的核心记录里多了一段关于你的数据。',
  ],
  'boss-enter': [
    '检测到高危目标。建议先观察攻击规律，不要急于行动。',
    'Boss 核心已锁定。防御或闪避的窗口会出现在真实预警里。',
  ],
  'boss-phase': [
    '阶段结构发生变化。旧规则失效了，重新读一遍当前阶段。',
    'Boss 正在重构核心。注意新的攻击模式。',
  ],
  'boss-victory': [
    '高危目标已沉默。这次胜利值得被记住。',
    '战斗结束。你的意识波形很稳，我记录下了这一场。',
  ],
  'boss-defeat': [
    '连接中断了……别急，我们会重新载入。',
    '这次失败已经被记录。下一次，先观察再行动。',
  ],
  crisis: [
    '未知入侵越过了防线。请按真实隔离序列操作。',
    '检测到高优先级危机。先处理它，再继续战斗。',
  ],
};

export function miraSceneLine(scene: MiraScene, state: MiraState, ctx: Record<string, string | number> = {}, now = Date.now()): { state: MiraState; text: string; changed: boolean } {
  const lines = SCENE_LINES[scene] || SCENE_LINES.menu;
  const hasLast = Object.prototype.hasOwnProperty.call(state.lastScene, scene);
  const last = state.lastScene[scene] || 0;
  const cooldown = scene === 'boss-enter' || scene === 'memory-unlock' ? 1500 : 6000;
  const text = lines[Math.floor((state.eventLog.length + state.level) % lines.length)]
    .replace(/\{(\w+)\}/g, (_, k) => String(ctx[k] ?? ''));
  if (hasLast && now - last < cooldown) return { state, text, changed: false };
  const next: MiraState = {
    ...state,
    lastScene: { ...state.lastScene, [scene]: now },
    interactions: [{ id: scene + ':' + now, scene, text, at: now }, ...state.interactions].slice(0, 30),
    updatedAt: now,
  };
  return { state: next, text, changed: true };
}

export type MiraRiskLevel = 'low' | 'medium' | 'high';
export interface MiraRisk { level: MiraRiskLevel; text: string }

export interface MiraRiskContext {
  bossPhase?: number;
  attackWarning?: boolean;
  crisis?: boolean;
  consecutiveFails?: number;
  consciousness?: number;
}

/** 只读取真实状态，不生成随机风险。 */
export function miraRiskFor(ctx: MiraRiskContext): MiraRisk[] {
  const out: MiraRisk[] = [];
  const c = typeof ctx.consciousness === 'number' ? ctx.consciousness : 100;
  if (ctx.crisis) out.push({ level: 'high', text: '动态危机正在执行：按真实隔离序列处理，不要继续提交。' });
  if (ctx.attackWarning) out.push({ level: 'high', text: 'Boss 攻击预警已出现：观察倒计时，优先防御或闪避。' });
  if (c <= 30) out.push({ level: 'high', text: '意识完整度低于 30%：下一次受击可能致命。' });
  else if (c <= 55) out.push({ level: 'medium', text: '意识完整度偏低：优先处理能避免伤害的操作。' });
  if ((ctx.consecutiveFails || 0) >= 3) out.push({ level: 'high', text: '连续失败已超过 3 次：先读诊断第二层，再修改代码。' });
  else if ((ctx.consecutiveFails || 0) >= 2) out.push({ level: 'medium', text: '连续失败：先确认错误类型和行号，不要盲目重试。' });
  if ((ctx.bossPhase || 0) >= 2) out.push({ level: 'medium', text: 'Boss 已进入高阶段：攻击模式变化，先观察预警。' });
  if (out.length === 0) out.push({ level: 'low', text: '当前状态稳定。继续按真实反馈推进。' });
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'high' ? -1 : b.level === 'high' ? 1 : a.level === 'medium' ? -1 : 1));
}

export function miraProgressSummary(state: MiraState): { label: string; pct: number } {
  const p = miraLevelProgress(state);
  return { label: MIRA_STAGE_LABEL[state.stage] + ' · Lv.' + p.level, pct: p.pct };
}
