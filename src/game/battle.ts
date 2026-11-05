// 章节 Boss 战：多阶段战斗数据 + 纯逻辑（伤害 / 阶段 / 存档状态）
// 设计约束：
//   1. 伤害只能来自真实判题结果（通过了几条测试 → 打掉多少血）；
//   2. 普通代码错误不算战斗失败，只触发 Boss 反击（意识值 / 容错）；
//   3. 每个阶段的考点必须来自该章已教知识点（见 knowledgeViolations）。
import type { LevelJudgeSpec } from './types';
import { levelsOfServer } from './levels';

export interface BossPhaseDef {
  id: string;
  title: string;
  /** 本阶段要修的模块 */
  objective: string;
  /** 故障日志（终端风格） */
  faultLog: string;
  initialCode: string;
  hints: [string, string, string];
  judge: LevelJudgeSpec;
  /** 本阶段考查的知识点 id（必须属于该章已教范围） */
  knowledge: string[];
  /**
   * 初始故障版「本来就能通过」的测试位掩码。
   * 这些位不算伤害——否则玩家直接提交初始代码就能白打血。
   * 由真实执行初始代码实测得出，测试会回归校验。
   */
  baselineMask: number;
  /** 通关该阶段时的知识总结 */
  summary: string;
}

export interface BossBattleDef {
  bossId: string;
  chapter: number;
  /** 总血量（平均分配到每个阶段） */
  maxHp: number;
  /** 判题没有造成伤害时，Boss 反击对玩家意识的伤害 */
  counterDamage: number;
  /** 战斗场景背景 */
  bg: 'dataport' | 'core' | 'memory';
  phases: BossPhaseDef[];
}

/** 存档里的战斗状态（progress.battles[bossId]） */
export interface BossBattleState {
  hp: number;
  maxHp: number;
  /** 已击破的阶段数（0 = 第一阶段进行中） */
  phase: number;
  /** 每个阶段已经通过过的测试位掩码 */
  phaseMask: number[];
  /** 本场战斗的失败提交次数 */
  failures: number;
  cleared: boolean;
  updatedAt: number;
}

// ---------- 工具 ----------
export const popcount = (n: number): number => {
  let x = n | 0;
  let c = 0;
  while (x) { x &= x - 1; c++; }
  return c;
};

export const fullMask = (bits: number): number => (bits >= 31 ? 0x7fffffff : (1 << bits) - 1);

export const phaseCheckCount = (p: BossPhaseDef): number => {
  if (p.judge.judgeKind === 'python') return (p.judge.pythonChecks || []).length;
  return (p.judge.stdoutChecks || []).length;
};

/** 每个阶段均分的血量 */
export const phaseHp = (def: BossBattleDef): number => Math.max(1, Math.floor(def.maxHp / def.phases.length));

/** 该章已教知识点（从真实关卡数据推导，避免手写清单与关卡脱节） */
export function chapterKnowledge(serverId: string): string[] {
  const fromLevels = levelsOfServer(serverId).flatMap(l => l.knowledge);
  const base = serverId === 'syntax' ? ['print'] : [];
  return [...new Set([...base, ...fromLevels])];
}

/** 第一章（语法维修站 + 训练终端）已教知识点 */
export const CHAPTER1_KNOWLEDGE = chapterKnowledge('syntax');

const CHAPTER_SERVERS = ['syntax', 'logs', 'storage', 'factory', 'diag', 'core'];

/** 截至第 N 章（含）的累计知识点：Boss 考点必须落在这一集合内 */
export function cumulativeKnowledge(chapter: number): string[] {
  const n = Math.max(0, Math.min(CHAPTER_SERVERS.length, Math.floor(chapter)));
  const set = new Set<string>(['print']);
  for (const server of CHAPTER_SERVERS.slice(0, n)) {
    for (const lv of levelsOfServer(server)) for (const k of lv.knowledge) set.add(k);
  }
  return [...set];
}

/** 检查每个阶段的考点是否越界（越界返回违规项，测试会断言为空） */
export function knowledgeViolations(def: BossBattleDef, allowed: string[] = cumulativeKnowledge(def.chapter)): string[] {
  const out: string[] = [];
  for (const p of def.phases) {
    for (const k of p.knowledge) {
      if (!allowed.includes(k)) out.push(p.id + ':' + k);
    }
  }
  return out;
}

// ---------- 状态 ----------
export function createBattleState(def: BossBattleDef): BossBattleState {
  return {
    hp: def.maxHp,
    maxHp: def.maxHp,
    phase: 0,
    phaseMask: def.phases.map(() => 0),
    failures: 0,
    cleared: false,
    updatedAt: Date.now(),
  };
}

/** 存档清洗：任何异常都退化为「满血第一阶段」，绝不产生负血/越界阶段 */
export function normalizeBattleState(raw: unknown, def: BossBattleDef): BossBattleState {
  const base = createBattleState(def);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<BossBattleState>;
  const maxHp = typeof r.maxHp === 'number' && isFinite(r.maxHp) && r.maxHp > 0 ? Math.floor(r.maxHp) : def.maxHp;
  const hp = typeof r.hp === 'number' && isFinite(r.hp) ? Math.max(0, Math.min(maxHp, Math.floor(r.hp))) : maxHp;
  const phase = typeof r.phase === 'number' && isFinite(r.phase)
    ? Math.max(0, Math.min(def.phases.length, Math.floor(r.phase)))
    : 0;
  const maskRaw = Array.isArray(r.phaseMask) ? r.phaseMask : [];
  const phaseMask = def.phases.map((p, i) => {
    const bits = phaseCheckCount(p);
    const v = typeof maskRaw[i] === 'number' && isFinite(maskRaw[i]) ? Math.floor(maskRaw[i]) : 0;
    return Math.max(0, Math.min(fullMask(bits), v));
  });
  return {
    hp,
    maxHp,
    phase,
    phaseMask,
    failures: typeof r.failures === 'number' && isFinite(r.failures) ? Math.max(0, Math.floor(r.failures)) : 0,
    cleared: r.cleared === true || phase >= def.phases.length || hp <= 0,
    updatedAt: typeof r.updatedAt === 'number' && isFinite(r.updatedAt) ? r.updatedAt : Date.now(),
  };
}

export interface SubmissionResult {
  /** 本次造成的伤害 */
  damage: number;
  /** 结算后的血量 */
  hpAfter: number;
  /** 合并后的位掩码 */
  mask: number;
  /** 本次新通过的测试数 */
  newPassed: number;
  total: number;
  /** 本阶段是否击破 */
  phaseCleared: boolean;
  /** 是否整场胜利 */
  defeated: boolean;
  /** 结算后所处阶段 */
  phaseAfter: number;
}

/**
 * 把一次真实判题结果换算成战斗结果。
 * checks[i].ok 为 true 表示第 i 条测试真实通过；伤害按「新通过的测试数 / 总测试数」计算。
 */
export function resolveSubmission(
  def: BossBattleDef,
  state: BossBattleState,
  phaseIndex: number,
  checks: { ok: boolean }[],
): SubmissionResult {
  const safeIndex = Math.max(0, Math.min(phaseIndex, def.phases.length - 1));
  const phase = def.phases[safeIndex];
  const total = Math.max(1, phaseCheckCount(phase));
  let passedMask = 0;
  checks.forEach((c, i) => { if (c.ok && i < total) passedMask |= (1 << i); });

  const prevMask = state.phaseMask[safeIndex] || 0;
  const merged = prevMask | passedMask;
  // 初始故障版已能通过的项不计伤害（防止「提交原样代码白打血」）
  const newPassed = popcount(passedMask & ~prevMask & ~phase.baselineMask);
  const cleared = merged === fullMask(total);

  const segHp = phaseHp(def);
  const damage = cleared
    ? Math.max(0, state.hp - Math.max(0, def.maxHp - (safeIndex + 1) * segHp))
    : Math.floor(segHp * newPassed / total);

  const hpAfter = cleared
    ? Math.max(0, def.maxHp - (safeIndex + 1) * segHp)
    : Math.max(0, state.hp - damage);

  const defeated = cleared && safeIndex >= def.phases.length - 1;

  return {
    damage,
    hpAfter,
    mask: merged,
    newPassed,
    total,
    phaseCleared: cleared,
    defeated,
    phaseAfter: cleared ? Math.min(def.phases.length, safeIndex + 1) : safeIndex,
  };
}

/** 血量百分比（用于血条） */
export function hpPercent(state: BossBattleState): number {
  if (state.maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((state.hp / state.maxHp) * 100)));
}

// ---------- GATE-01 数据 ----------
// 知识点覆盖表（全部来自第一章）：
//   P1 能源启动    → compare / if / return / print
//   P2 防御逻辑    → if / compare / return
//   P3 数据传输    → for / list / if / variable / return
//   P4 综合恢复    → for / list / if / compare / indent / return
export const GATE01_BATTLE: BossBattleDef = {
  bossId: 'gate-01',
  chapter: 1,
  maxHp: 100,
  counterDamage: 3,
  bg: 'dataport',
  phases: [
    {
      id: 'gate-p1',
      title: '能源启动程序',
      objective: '修复 startup：能源等级达到 20 就必须启动（20 也算达标）。',
      faultLog: '[GATE-01] STARTUP THRESHOLD OFF BY ONE — energy=20 rejected.',
      initialCode: 'def startup(energy):\n    if energy > 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))',
      hints: [
        '闸门把「正好 20」当成了不达标。可是能源等级 20 明明够用。',
        '边界值要算合格：>= 20 才是「达到阈值」。',
        '把 if energy > 20 改成 if energy >= 20。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '临界值 20 级能源启动', expr: 'startup(20) == "POWER ON"' },
          { name: '低于阈值 19 级不启动', expr: 'startup(19) == "POWER OFF"' },
          { name: '高等级 60 级启动', expr: 'startup(60) == "POWER ON"' },
        ],
      },
      knowledge: ['compare', 'if', 'return', 'print'],
      baselineMask: 6, // 实测：初始版已通过「19 不启动」「60 启动」两项
      summary: '边界值是闸门逻辑最常见的破绽：> 与 >= 只差一个等号，却决定 20 级能源算不算达标。',
    },
    {
      id: 'gate-p2',
      title: '防御逻辑',
      objective: '修复 shield：威胁 > 80 为 CRITICAL，> 40 为 WARNING，其余 SAFE。',
      faultLog: '[GATE-01] SHIELD TIER DUPLICATED — 40~80 区间的威胁被误判为 SAFE。',
      initialCode: 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 80:\n        return "WARNING"\n    return "SAFE"',
      hints: [
        '60 级的威胁被判成了 SAFE。第二个判断和第一个一模一样，永远进不去。',
        '第二档的门槛是 40，不是 80。',
        '把第二个 if threat > 80 改成 if threat > 40。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '高危 90 判定为 CRITICAL', expr: 'shield(90) == "CRITICAL"' },
          { name: '中危 60 判定为 WARNING', expr: 'shield(60) == "WARNING"' },
          { name: '低危 10 判定为 SAFE', expr: 'shield(10) == "SAFE"' },
          { name: '边界 41 判定为 WARNING', expr: 'shield(41) == "WARNING"' },
        ],
      },
      knowledge: ['if', 'compare', 'return'],
      baselineMask: 5, // 实测：初始版已通过「90 CRITICAL」「10 SAFE」两项
      summary: '多档判定要保证每一档的门槛不同；重复的条件会让整段分支变成死代码。',
    },
    {
      id: 'gate-p3',
      title: '数据传输模块',
      objective: '修复 collect：遍历数据包，把编号 ≥ 1 的有效包收进结果列表。',
      faultLog: '[GATE-01] TRANSFER ABORTED — NameError: name packet is not defined.',
      initialCode: 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(packet)\n    return good\n\nprint(collect([1, 2, 3]))',
      hints: [
        '传输模块在收集数据包时崩溃了：报错说 packet 这个名字不存在。',
        '循环变量叫 p。看看 append 里写的是哪个名字。',
        '把 good.append(packet) 改成 good.append(p)。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '有效包被完整收集', expr: 'collect([1, 2, 3]) == [1, 2, 3]' },
          { name: '空列表返回空列表', expr: 'collect([]) == []' },
          { name: '编号 0 的无效包被过滤', expr: 'collect([0, 5]) == [5]' },
        ],
      },
      knowledge: ['for', 'list', 'if', 'variable', 'return'],
      baselineMask: 0, // 初始版 NameError，一条都不通过
      summary: '循环变量名必须与使用处完全一致；NameError 是数据链路里最常见的断点。',
    },
    {
      id: 'gate-p4',
      title: '综合服务器恢复',
      objective: '修复 scan：把「低于 50」或「高于 90」的异常节点全部标记出来（列表按升序检查即可）。',
      faultLog: '[GATE-01] RESTORE ABORTED — IndentationError: expected an indented block; 低压节点未纳入检测。',
      initialCode: 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n        bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))',
      hints: [
        '两个问题：append 没有缩进（IndentationError），而且只检查了高压侧。',
        'append 必须在 if 里面（缩进 4 个空格）；低压侧还要再加一个 if n < 50。',
        '先缩进 bad.append(n)，再补一段 if n < 50: 换行缩进 bad.append(n)。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '两侧异常节点都被标记', expr: 'sorted(scan([30, 60, 95])) == [30, 95]' },
          { name: '正常区间不误报', expr: 'scan([50, 90]) == []' },
          { name: '低压节点被标记', expr: 'scan([49]) == [49]' },
        ],
      },
      knowledge: ['for', 'list', 'if', 'compare', 'indent', 'return'],
      baselineMask: 0, // 初始版 IndentationError，一条都不通过
      summary: '综合关：缩进决定代码块归属，两段 if 分别覆盖两侧异常——这是数据恢复最稳的写法。',
    },
  ],
};

// ---------- SOMNIA 数据（第二章） ----------
// 知识点覆盖表（全部来自第二章）：
//   P1 记忆分流   → if / else / compare
//   P2 逻辑校验   → logic(and/or) / compare / return
//   P3 循环筛查   → for / if / elif / list
//   P4 综合重建   → for / logic / compare / list
export const SOMNIA_BATTLE: BossBattleDef = {
  bossId: 'somnia',
  chapter: 2,
  maxHp: 100,
  counterDamage: 4,
  bg: 'memory',
  phases: [
    {
      id: 'som-p1',
      title: '记忆分流',
      objective: '修复 classify：把 error 记忆判为 ALERT，其余判为 PASS（注意赋值与比较的区别）。',
      faultLog: '[SOMNIA] CLASSIFY SYNTAX ERROR — 条件里用了赋值号 = ，记忆无法分流。',
      initialCode: 'def classify(tag):\n    if tag = "error":\n        return "ALERT"\n    else:\n        return "PASS"\n\nprint(classify("error"))',
      hints: [
        '分流模块直接报语法错误了。条件里的那个符号看起来不太对。',
        '判断相等要用两个等号 ==，一个等号是赋值。',
        '把 if tag = "error" 改成 if tag == "error"。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: 'error 记忆判为 ALERT', expr: 'classify("error") == "ALERT"' },
          { name: 'ok 记忆判为 PASS', expr: 'classify("ok") == "PASS"' },
          { name: 'warn 记忆判为 PASS', expr: 'classify("warn") == "PASS"' },
        ],
      },
      knowledge: ['if', 'compare', 'return'],
      baselineMask: 0,
      summary: '= 是赋值，== 才是比较。条件里写成赋值，程序连编译都过不去。',
    },
    {
      id: 'som-p2',
      title: '逻辑校验',
      objective: '修复 guard：只有温度和压力「同时」超限才判 OVERLOAD。',
      faultLog: '[SOMNIA] GUARD MISFIRE — 单侧超限就触发过载，记忆被过度清除。',
      initialCode: 'def guard(temp, pressure):\n    if temp > 90 or pressure > 150:\n        return "OVERLOAD"\n    return "SAFE"',
      hints: [
        '温度正常、压力也正常的时候，它居然也报过载——条件太宽松了。',
        '「同时超限」需要两个条件都成立，用 and 而不是 or。',
        '把 or 改成 and：if temp > 90 and pressure > 150。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '双超限判定为过载', expr: 'guard(95, 160) == "OVERLOAD"' },
          { name: '仅温度超限不过载', expr: 'guard(95, 100) == "SAFE"' },
          { name: '仅压力超限不过载', expr: 'guard(70, 160) == "SAFE"' },
        ],
      },
      knowledge: ['logic', 'compare', 'return'],
      baselineMask: 1,
      summary: 'and 要求两边都成立，or 只要一边成立。报警逻辑用错，会造成大面积误判。',
    },
    {
      id: 'som-p3',
      title: '循环筛查',
      objective: '修复 scan：逐条扫描日志，ok→PASS、warn→WARN、error→FAIL。',
      faultLog: '[SOMNIA] SCAN DEGRADED — warn 级别被当成 PASS，警告被静默吞掉。',
      initialCode: 'def scan(logs):\n    out = []\n    for lv in logs:\n        if lv == "error":\n            out.append("FAIL")\n        elif lv == "warn":\n            out.append("PASS")\n        else:\n            out.append("PASS")\n    return out\n\nprint(scan(["ok", "warn", "error"]))',
      hints: [
        'warn 的记忆被标成了 PASS。看 elif 分支里写的是什么。',
        '三个分支要分别对应 FAIL / WARN / PASS。',
        '把 elif 分支里的 out.append("PASS") 改成 out.append("WARN")。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '三类日志正确分级', expr: 'scan(["ok", "warn", "error"]) == ["PASS", "WARN", "FAIL"]' },
          { name: '单条 warn 判为 WARN', expr: 'scan(["warn"]) == ["WARN"]' },
          { name: '空列表返回空列表', expr: 'scan([]) == []' },
        ],
      },
      knowledge: ['for', 'if', 'elif', 'list', 'return'],
      baselineMask: 4,
      summary: 'if / elif / else 从上到下只命中一个分支；分支里的返回值写错，整类数据都会被误判。',
    },
    {
      id: 'som-p4',
      title: '综合记忆重建',
      objective: '修复 recover：只保留编号在 1~99 之间的合法记忆节点（两侧边界都要卡住）。',
      faultLog: '[SOMNIA] RECOVER OVERFLOW — 越界节点混入重建结果，记忆出现噪点。',
      initialCode: 'def recover(nodes):\n    good = []\n    for n in nodes:\n        if n >= 1 or n <= 99:\n            good.append(n)\n    return good\n\nprint(recover([0, 5, 120]))',
      hints: [
        '0 和 120 都被收进来了。两个条件之间用错了连接词。',
        '「同时满足 1~99」要用 and：n >= 1 and n <= 99。',
        '把 if n >= 1 or n <= 99 改成 if n >= 1 and n <= 99。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '越界节点被过滤', expr: 'recover([0, 5, 120]) == [5]' },
          { name: '合法节点被保留', expr: 'recover([50]) == [50]' },
          { name: '全越界返回空列表', expr: 'recover([0, 120]) == []' },
        ],
      },
      knowledge: ['for', 'logic', 'compare', 'list', 'return'],
      baselineMask: 2,
      summary: '区间判定要两侧同时成立：and 连接两个边界，缺一边就会漏掉越界数据。',
    },
  ],
};

// ---------- INDEX-0 数据索引吞噬者（第三章） ----------
// 知识点全部来自第一~三章：list / for / while / len / if / elif / compare / logic / return / indent
export const INDEX0_BATTLE: BossBattleDef = {
  bossId: 'index-0',
  chapter: 3,
  maxHp: 100,
  counterDamage: 3,
  bg: 'memory',
  phases: [
    {
      id: 'idx-p1',
      title: '修复身份索引程序',
      objective: '修复 find_id：在 names 列表里按顺序查找 name，找到返回下标，找不到返回 -1。',
      faultLog: '[INDEX-0] IDENTITY INDEX BROKEN — 比较运算符写成了赋值，索引程序无法启动。',
      initialCode: 'def find_id(name, names):\n    for i in range(len(names)):\n        if names[i] = name:\n            return i\n    return -1\n\nprint(find_id("carol", ["anna", "bob", "carol"]))',
      hints: [
        '索引程序第一行就崩了：if 后面用的是赋值号。',
        '比较两个值是否相等要用 ==。',
        '把 if names[i] = name 改成 if names[i] == name。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '找到 carol 返回下标 2', expr: 'find_id("carol", ["anna", "bob", "carol"]) == 2' },
          { name: '找到第一个 anna 返回 0', expr: 'find_id("anna", ["anna", "bob"]) == 0' },
          { name: '找不到返回 -1', expr: 'find_id("zed", ["anna", "bob"]) == -1' },
        ],
      },
      knowledge: ['list', 'for', 'len', 'if', 'compare', 'return'],
      baselineMask: 0,
      summary: '把 = 当 == 用是最常见的语法错误；它会让整段程序连运行都做不到。',
    },
    {
      id: 'idx-p2',
      title: '修复数据读取逻辑',
      objective: '修复 read_names：每条记录是 [编号, 名字]，只保留编号 > 0 的记录的名字。',
      faultLog: '[INDEX-0] READ LOGIC INVERTED — 编号为 0 的脏数据被当成了有效记录。',
      initialCode: 'def read_names(rows):\n    names = []\n    for row in rows:\n        if row[0] > 0 or row[1]:\n            names.append(row[1])\n    return names',
      hints: [
        '编号为 0 的记录被读进来了，说明条件太宽松。',
        '只需要编号 > 0 这一条，用 and 或直接去掉后半个条件。',
        '把 if row[0] > 0 or row[1] 改成 if row[0] > 0。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '跳过编号 0 的脏数据', expr: 'read_names([[1, "a"], [0, "b"], [2, "c"]]) == ["a", "c"]' },
          { name: '全部有效时全部返回', expr: 'read_names([[3, "x"], [4, "y"]]) == ["x", "y"]' },
          { name: '空记录返回空列表', expr: 'read_names([]) == []' },
        ],
      },
      knowledge: ['list', 'for', 'if', 'compare', 'logic', 'return'],
      baselineMask: 1,
      summary: 'or 会把「其中一个成立」当成成立；这里必须两个条件同时满足才算有效。',
    },
    {
      id: 'idx-p3',
      title: '解决重复与丢失',
      objective: '修复 dedupe：按出现顺序去重，并丢弃 -1（缺失标记）。',
      faultLog: '[INDEX-0] DUPLICATE / MISSING ENTRIES — -1 被当成有效编号写入索引。',
      initialCode: 'def dedupe(ids):\n    out = []\n    i = 0\n    while i < len(ids):\n        x = ids[i]\n        if x not in out:\n            out.append(x)\n        i = i + 1\n    return out',
      hints: [
        '结果里出现了 -1，说明缺失标记没有被跳过。',
        '先判断 x != -1，再判断是否已经出现过。',
        '在 if x not in out 前面加上 if x != -1: 并正确缩进。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '去重并丢弃 -1', expr: 'dedupe([3, 3, -1, 5, 5, 7]) == [3, 5, 7]' },
          { name: '全部是缺失标记时返回空', expr: 'dedupe([-1, -1]) == []' },
          { name: '空列表返回空', expr: 'dedupe([]) == []' },
        ],
      },
      knowledge: ['list', 'while', 'len', 'if', 'compare', 'indent', 'return'],
      baselineMask: 2,
      summary: '去重要同时处理两种脏数据：重复项与缺失项；顺序必须保持不变。',
    },
    {
      id: 'idx-p4',
      title: '综合实验档案恢复',
      objective: '修复 restore：把 [[编号, 名字], ...] 还原成去重、去脏、保序的名字列表。',
      faultLog: '[INDEX-0] ARCHIVE RESTORE FAILED — 重复记录被写入了两次。',
      initialCode: 'def restore(records):\n    names = []\n    for row in records:\n        if row[0] > 0:\n            names.append(row[1])\n        names.append(row[1])\n    return names',
      hints: [
        '每条记录被加入了两次：分支里加了一次，分支外又加了一次。',
        '只保留分支里的那一次，并跳过已经存在的名字。',
        '删掉分支外的 append，并在分支里加 if row[1] not in names。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '去重且保持顺序', expr: 'restore([[1, "a"], [1, "a"], [2, "b"], [-1, "x"]]) == ["a", "b"]' },
          { name: '单条记录正常恢复', expr: 'restore([[3, "c"]]) == ["c"]' },
          { name: '空档案返回空列表', expr: 'restore([]) == []' },
        ],
      },
      knowledge: ['list', 'for', 'if', 'compare', 'len', 'return'],
      baselineMask: 2,
      summary: '综合题要把前面三个修复点串起来：读得对、判得准、不重复。',
    },
  ],
};

// ---------- JUDGMENT-4 裁决执行体（第四章） ----------
// 知识点：def / parameter / return / list / for / if / compare / logic / len
export const JUDGMENT4_BATTLE: BossBattleDef = {
  bossId: 'judgment-4',
  chapter: 4,
  maxHp: 100,
  counterDamage: 4,
  bg: 'memory',
  phases: [
    {
      id: 'jd-p1',
      title: '解除外围能源防御',
      objective: '修复 power_ok：所有能源等级都 ≥ 1 才算通过。',
      faultLog: '[JUDGMENT-4] PERIMETER POWER LOOP — 只要有一路能源达标就放行。',
      initialCode: 'def power_ok(levels):\n    for x in levels:\n        if x >= 1:\n            return True\n    return False',
      hints: [
        '只要有一路达标就返回 True 了，可防御需要全部达标。',
        '应该先假设失败，遇到不合格立刻返回 False，循环结束再返回 True。',
        '把条件改成 if x < 1: return False，循环后 return True。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '全部达标才算通过', expr: 'power_ok([2, 3, 1]) == True' },
          { name: '有一路为 0 就不通过', expr: 'power_ok([2, 0, 3]) == False' },
          { name: '空列表视为通过', expr: 'power_ok([]) == True' },
        ],
      },
      knowledge: ['for', 'list', 'if', 'compare', 'return'],
      baselineMask: 2,
      summary: '「全部满足」要在遇到反例时立刻否定，而不是遇到正例就肯定。',
    },
    {
      id: 'jd-p2',
      title: '修复安全裁决逻辑',
      objective: '修复 verdict：score ≥ 90 为 CLEAR，≥ 60 为 HOLD，其余 BLOCK。',
      faultLog: '[JUDGMENT-4] VERDICT TIER COLLISION — 两个分支门槛相同，HOLD 永远不可达。',
      initialCode: 'def verdict(score):\n    if score >= 90:\n        return "CLEAR"\n    if score >= 90:\n        return "HOLD"\n    return "BLOCK"',
      hints: [
        'HOLD 永远不会出现，因为第二个条件和第一个一样。',
        '第二档的门槛是 60。',
        '把第二个 if score >= 90 改成 if score >= 60。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '90 分以上放行', expr: 'verdict(95) == "CLEAR"' },
          { name: '60~89 分挂起', expr: 'verdict(70) == "HOLD"' },
          { name: '低于 60 拦截', expr: 'verdict(20) == "BLOCK"' },
          { name: '边界 60 分挂起', expr: 'verdict(60) == "HOLD"' },
        ],
      },
      knowledge: ['if', 'compare', 'return'],
      baselineMask: 5,
      summary: '重复条件会让整段分支变成死代码，边界值要单独验证。',
    },
    {
      id: 'jd-p3',
      title: '破解多层权限验证',
      objective: '修复 unlock：三个权限码必须全部正确才返回 True。',
      faultLog: '[JUDGMENT-4] AUTH BYPASS — 任一权限码正确即放行。',
      initialCode: 'def unlock(a, b, c):\n    if a == "root" or b == "root" or c == "root":\n        return True\n    return False',
      hints: [
        '只提供一个正确的权限码就能进去了，说明条件之间用了 or。',
        '三层验证必须同时满足，应该用 and。',
        '把 or 全部改成 and。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '三码全对才通过', expr: 'unlock("root", "root", "root") == True' },
          { name: '缺一码不通过', expr: 'unlock("root", "root", "guest") == False' },
          { name: '只有一码不通过', expr: 'unlock("root", "guest", "guest") == False' },
        ],
      },
      knowledge: ['parameter', 'compare', 'logic', 'return'],
      baselineMask: 2,
      summary: '多层校验里 or 是权限漏洞，and 才是「同时满足」。',
    },
    {
      id: 'jd-p4',
      title: '完成核心命令恢复',
      objective: '修复 restore_cmd：只保留编号 > 0 的命令，并去重、保持顺序。',
      faultLog: '[JUDGMENT-4] CORE CMD RESTORE — 重复命令被写回两次。',
      initialCode: 'def restore_cmd(ids):\n    out = []\n    for x in ids:\n        if x > 0:\n            out.append(x)\n        out.append(x)\n    return out',
      hints: [
        '每条命令都被写入了两次：分支里一次，分支外又一次。',
        '删掉循环里分支外那次 append。',
        '再加上 if x not in out 避免重复。',
      ],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '去重且只保留有效命令', expr: 'restore_cmd([1, 1, 2, -1, 3]) == [1, 2, 3]' },
          { name: '全部无效时返回空', expr: 'restore_cmd([-1, 0]) == []' },
          { name: '空列表返回空', expr: 'restore_cmd([]) == []' },
        ],
      },
      knowledge: ['list', 'for', 'if', 'compare', 'logic', 'return'],
      baselineMask: 2,
      summary: '核心恢复要同时保证：来源有效、结果去重、顺序不变。',
    },
  ],
};

// ---------- ENTROPY 熵潮核心（第五章） ----------
// 知识点：list / for / while / dict / get / try / except / if / compare / len / return
export const ENTROPY_BATTLE: BossBattleDef = {
  bossId: 'entropy',
  chapter: 5,
  maxHp: 100,
  counterDamage: 4,
  bg: 'memory',
  phases: [
    {
      id: 'en-p1',
      title: '清除外围数据污染',
      objective: '修复 clean：只保留 > 0 的有效数据，丢弃污染值。',
      faultLog: '[ENTROPY] POLLUTION FILTER INVERTED — 负值污染被写入核心。',
      initialCode: 'def clean(values):\n    out = []\n    for v in values:\n        if v < 0:\n            out.append(v)\n    return out',
      hints: ['结果里全是负数，说明筛选条件反了。', '应该保留大于 0 的数据。', '把 if v < 0 改成 if v > 0。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '只保留正值', expr: 'clean([3, -1, 5, 0, 2]) == [3, 5, 2]' },
          { name: '全污染返回空', expr: 'clean([-1, -2]) == []' },
          { name: '空列表返回空', expr: 'clean([]) == []' },
        ],
      },
      knowledge: ['list', 'for', 'if', 'compare', 'return'],
      baselineMask: 2,
      summary: '筛选条件写反，会把污染物当成有效数据写进核心。',
    },
    {
      id: 'en-p2',
      title: '修复异常数据之间的关联',
      objective: '修复 lookup：从字典里安全取值，没有该键时返回 0。',
      faultLog: '[ENTROPY] KEY ERROR — 缺失键直接取值导致索引崩溃。',
      initialCode: 'def lookup(table, key):\n    return table[key]',
      hints: ['键不存在时程序直接崩溃了。', '字典要用 get 安全取值。', '把 table[key] 改成 table.get(key, 0)。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '存在的键返回值', expr: 'lookup({1: 10}, 1) == 10' },
          { name: '缺失的键返回 0', expr: 'lookup({1: 10}, 9) == 0' },
          { name: '空字典返回 0', expr: 'lookup({}, 1) == 0' },
        ],
      },
      knowledge: ['dict', 'parameter', 'return'],
      baselineMask: 2,
      summary: '字典取值的默认值能避免 KeyError 让整个索引崩溃。',
    },
    {
      id: 'en-p3',
      title: '修复多个相互关联的核心程序',
      objective: '修复 to_int：字符串转整数，失败时返回 0。',
      faultLog: '[ENTROPY] VALUE ERROR — 无法转换的记录让整个修复流程中断。',
      initialCode: 'def to_int(text):\n    return int(text)',
      hints: ['遇到非数字字符串时 int 会抛异常。', '用 try / except 兜底。', '转换失败时 return 0。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '数字字符串正常转换', expr: 'to_int("42") == 42' },
          { name: '非数字返回 0', expr: 'to_int("abc") == 0' },
          { name: '空字符串返回 0', expr: 'to_int("") == 0' },
        ],
      },
      knowledge: ['try', 'return', 'parameter'],
      baselineMask: 2,
      summary: '异常不能被吞掉，但也不能让整条修复链因此中断。',
    },
    {
      id: 'en-p4',
      title: '完成整个污染核心的综合修复',
      objective: '修复 repair：把记录逐条转成整数，跳过无效项并求和。',
      faultLog: '[ENTROPY] CORE REPAIR INCOMPLETE — 无效记录未跳过，总和错误。',
      initialCode: 'def repair(rows):\n    total = 0\n    for r in rows:\n        total = total + int(r)\n    return total',
      hints: ['遇到非数字记录会直接崩溃。', '先转换，失败就跳过这一条。', '用 to_int 的写法：try 里累加，except 里 continue。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '跳过无效记录后求和', expr: 'repair(["1", "2", "x", "3"]) == 6' },
          { name: '全部无效返回 0', expr: 'repair(["a", "b"]) == 0' },
          { name: '空列表返回 0', expr: 'repair([]) == 0' },
        ],
      },
      knowledge: ['list', 'for', 'try', 'return'],
      baselineMask: 1,
      summary: '综合修复要同时处理转换失败与累加顺序。',
    },
  ],
};

// ---------- K-0 零号裁决者（终章） ----------
// 知识点：list / for / while / dict / get / try / except / def / return / logic / compare
export const K0_BATTLE: BossBattleDef = {
  bossId: 'k0',
  chapter: 6,
  maxHp: 100,
  counterDamage: 5,
  bg: 'core',
  phases: [
    {
      id: 'k0-p1',
      title: '绝对安全壁垒',
      objective: '修复 pass_gate：三道验证全部通过才放行。',
      faultLog: '[K-0] SECURITY BARRIER — 任一验证通过即放行，壁垒形同虚设。',
      initialCode: 'def pass_gate(a, b, c):\n    if a or b or c:\n        return True\n    return False',
      hints: ['任意一道通过就进去了。', '三道验证必须同时通过。', '把 or 改成 and。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '三道全通过才放行', expr: 'pass_gate(True, True, True) == True' },
          { name: '缺一道不放行', expr: 'pass_gate(True, True, False) == False' },
          { name: '全不通过不放行', expr: 'pass_gate(False, False, False) == False' },
        ],
      },
      knowledge: ['parameter', 'logic', 'if', 'return'],
      baselineMask: 5,
      summary: 'or 会让安全壁垒失效；多条件放行必须用 and。',
    },
    {
      id: 'k0-p2',
      title: '零号裁决',
      objective: '修复 judge：分数 ≥ 90 放行，≥ 60 复审，其余驳回。',
      faultLog: '[K-0] VERDICT LOGIC — 复审分支被前一档吞掉。',
      initialCode: 'def judge(score):\n    if score >= 90:\n        return "PASS"\n    if score >= 90:\n        return "REVIEW"\n    return "REJECT"',
      hints: ['复审分支永远进不去。', '第二档门槛是 60。', '把第二个 90 改成 60。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '高分放行', expr: 'judge(95) == "PASS"' },
          { name: '中分复审', expr: 'judge(70) == "REVIEW"' },
          { name: '低分驳回', expr: 'judge(10) == "REJECT"' },
          { name: '边界 60 复审', expr: 'judge(60) == "REVIEW"' },
        ],
      },
      knowledge: ['if', 'compare', 'return'],
      baselineMask: 5,
      summary: '多档裁决的分支门槛必须互不重叠。',
    },
    {
      id: 'k0-p3',
      title: '原初核心崩坏',
      objective: '修复 merge：合并两个字典，同键取较大值。',
      faultLog: '[K-0] CORE MERGE — 同键值被后者直接覆盖，导致数据回退。',
      initialCode: 'def merge(a, b):\n    out = dict(a)\n    for k in b:\n        out[k] = b[k]\n    return out',
      hints: ['同键时后一个字典直接覆盖了前一个。', '同键应该保留较大的值。', '用 if k not in out or b[k] > out[k] 判断。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '同键取较大值', expr: 'merge({"a": 1}, {"a": 5})["a"] == 5' },
          { name: '新键被合入', expr: 'merge({"a": 1}, {"b": 2})["b"] == 2' },
          { name: '不同键都保留', expr: 'len(merge({"a": 1}, {"b": 2})) == 2' },
        ],
      },
      knowledge: ['dict', 'for', 'if', 'compare', 'return'],
      baselineMask: 2,
      summary: '合并策略要明确：同键时是覆盖还是取优，必须写清楚。',
    },
    {
      id: 'k0-p4',
      title: '最终命令',
      objective: '修复 final_repair：把记录转成整数求和，跳过无效项，最后返回稳定状态。',
      faultLog: '[K-0] FINAL COMMAND — 无效记录让最终修复中断。',
      initialCode: 'def final_repair(rows):\n    total = 0\n    for r in rows:\n        total = total + int(r)\n    return "STABLE" if total >= 0 else "UNSTABLE"',
      hints: ['遇到非数字记录会抛异常。', '用 try / except 跳过无效项。', 'except 里 continue，最后按 total 返回状态。'],
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '跳过无效项后判定稳定', expr: 'final_repair(["1", "2", "x"]) == "STABLE"' },
          { name: '全无效仍判定稳定', expr: 'final_repair(["a"]) == "STABLE"' },
          { name: '空记录判定稳定', expr: 'final_repair([]) == "STABLE"' },
        ],
      },
      knowledge: ['list', 'for', 'try', 'if', 'return'],
      baselineMask: 1,
      summary: '最终命令必须容错：单条坏数据不能中断整个世界的修复。',
    },
  ],
};

export const BOSS_BATTLES: BossBattleDef[] = [GATE01_BATTLE, SOMNIA_BATTLE, INDEX0_BATTLE, JUDGMENT4_BATTLE, ENTROPY_BATTLE, K0_BATTLE];

export const battleFor = (bossId: string): BossBattleDef | undefined =>
  BOSS_BATTLES.find(b => b.bossId === bossId);
