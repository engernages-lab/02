import type { LevelJudgeSpec } from './types';

// ---------- 服务器节点 ----------
export interface ServerDef {
  id: string;
  name: string;
  codename: string;
  x: number; y: number;      // 地图 SVG 坐标
  icon: string;
  chapter: number;           // 0=序章 1=第一章 … 6=终章
  desc: string;
  lockedReason: string;
}

export const SERVERS: ServerDef[] = [
  { id: 'training', name: '新人训练终端', codename: 'PRIME-01', x: 300, y: 250, icon: '⌨', chapter: 0, desc: '为新任修复师准备的接驳终端，用于唤醒基础输出回路。', lockedReason: '' },
  { id: 'syntax', name: '语法维修站', codename: 'SYNTAX-RIG', x: 770, y: 250, icon: '✦', chapter: 1, desc: '第一章：修复语法结构损坏的 5 个日志程序。', lockedReason: '需要先完成新人训练终端的基础接驳任务。' },
  { id: 'logs', name: '数据日志中心', codename: 'LOG-CORE', x: 960, y: 470, icon: '◈', chapter: 2, desc: '第二章：条件判断与数据分流。', lockedReason: '加密数据区：完成第一章全部 5 个修复任务后可尝试接入。' },
  { id: 'storage', name: '存储数据仓', codename: 'VAULT-03', x: 640, y: 560, icon: '▤', chapter: 3, desc: '第三章：列表与循环引擎。', lockedReason: '权限不足：需要先修复数据日志中心。' },
  { id: 'factory', name: '自动化工厂', codename: 'AUTO-FAB', x: 300, y: 500, icon: '⚙', chapter: 4, desc: '第四章：函数与自动化流水线。', lockedReason: '权限不足：需要先修复存储数据仓。' },
  { id: 'diag', name: '系统诊断中心', codename: 'DIAG-LAB', x: 890, y: 140, icon: '✚', chapter: 5, desc: '第五章：字典与异常处理——事故数据的诊断枢纽。', lockedReason: '权限不足：需要先完成自动化工厂的修复任务。' },
  { id: 'core', name: '方舟核心机房', codename: 'ARK-CORE', x: 620, y: 120, icon: '◉', chapter: 6, desc: '终章：NEXUS 的心脏，五年前事故的源头。', lockedReason: '最高权限封锁：核心机房数据流已被冻结。' },
];

export const serverById = (id: string): ServerDef | undefined => SERVERS.find(s => s.id === id);

// ---------- 关卡 ----------
export interface LevelDef {
  id: string;
  serverId: string;
  order: number;
  title: string;
  codename: string;
  fault: string;      // 故障现象（剧情描述）
  faultLog: string;   // 系统故障日志
  goal: string;       // 任务目标
  behavior: string;   // 正确行为说明
  initialCode: string;
  knowledge: string[];                          // 知识点 id
  hints: [string, string, string];              // MIRA 三层提示
  summary: string;                              // 通关知识总结
  rewardExp: number;
  judge: LevelJudgeSpec;
  varsNote?: { name: string; desc: string }[];  // 变量监视器（静态说明）
}

const JUDGE_TUT: LevelJudgeSpec = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端显示 Hello, world!', contains: ['Hello, world!'] }] };
const JUDGE_1_1: LevelJudgeSpec = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端输出日志标题', contains: ['服务器状态报告'] }] };
const JUDGE_1_2: LevelJudgeSpec = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端输出系统状态消息', contains: ['NEXUS SYSTEM ONLINE'] }] };
const JUDGE_1_3: LevelJudgeSpec = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端输出身份信息', contains: ['R-07'] }] };
const JUDGE_1_4: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '高温数据被保留', expr: 'filter_alerts([22, 41, 42, 38, 45]) == [41, 42, 45]' },
    { name: '边界温度 40 属于警报', expr: 'filter_alerts([39, 40, 41]) == [40, 41]' },
    { name: '全部低于阈值时为空列表', expr: 'filter_alerts([22, 30, 15]) == []' },
  ],
};
const JUDGE_1_5: LevelJudgeSpec = { judgeKind: 'stdout', stdoutChecks: [{ name: '依次输出全部记录', lines: ['A', 'B', 'C'] }] };

function L(d: Omit<LevelDef, 'judge'>, judge: LevelJudgeSpec): LevelDef {
  return { ...d, judge };
}




// ---------- 第六章：方舟核心机房（综合编程 / 完整调试 / 多知识点应用） ----------
const JUDGE_6_1: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '心跳序列正确分类', contains: ['ALIVE SILENT ALIVE SILENT'] }],
};
const JUDGE_6_2: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '两侧警戒区都被标记', expr: 'validate([30, 95, 50]) == [30, 95]' },
    { name: '边界值 39/89/91 精确判定', expr: 'validate([39, 89, 91]) == [39, 91]' },
    { name: '正常区间不误报', expr: 'validate([45, 60]) == []' },
  ],
};
const JUDGE_6_3: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '密文被正确转译', contains: ['NEXUS HUMAN'] }],
};
const JUDGE_6_4: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '通配位不计入匹配', expr: "count_matches(['A', 'B', 'C'], ['A', '?', 'C']) == 2" },
    { name: '完全一致', expr: "count_matches(['A', 'B'], ['A', 'B']) == 2" },
    { name: '全部不符', expr: "count_matches(['A', 'B'], ['X', 'Y']) == 0" },
  ],
};
const JUDGE_6_5: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '正常记录正确分流', expr: "check_cells(['core:80', 'fan:20']) == (['core'], ['fan'])" },
    { name: '非法数值被隔离', expr: "check_cells(['ghost:NaN']) == ([], ['UNKNOWN'])" },
    { name: '缺冒号记录被隔离', expr: "check_cells(['bad']) == ([], ['MALFORMED'])" },
  ],
};

function L6(d: Omit<LevelDef, 'judge'>, judge: LevelJudgeSpec): LevelDef {
  return { ...d, judge };
}

const CHAPTER6_LEVELS: LevelDef[] = [
  L6({
    id: '6-1', serverId: 'core', order: 1,
    title: '心跳协议', codename: 'ARK-01',
    fault: '方舟心跳协议把静默区间误判为在线——回波判定逻辑写反，停机状态被视为存活。',
    faultLog: '[ARK-CORE] HEARTBEAT MISREAD — seq==0 区间被标记为 ALIVE。',
    goal: '修复心跳判定：seq 为 0 表示静默（SILENT），非 0 表示在线（ALIVE）。',
    behavior: '交换 if/else 两分支的返回值（seq == 0 时返回 SILENT）。',
    initialCode: 'def check_heartbeat(seq):\n    if seq == 0:\n        return "ALIVE"\n    else:\n        return "SILENT"\n\ndef report(seqs):\n    result = ""\n    for s in seqs:\n        result = result + check_heartbeat(s) + " "\n    return result\n\nprint(report([1, 0, 1, 0]))',
    knowledge: ['if', 'return', 'compare'],
    hints: [
      '静默区间被打上了 ALIVE 标记——心跳判定的两个分支返回值对调了。',
      'seq == 0 意味着没有心跳信号，应该返回 SILENT；seq != 0 才是 ALIVE。',
      '把 if seq == 0: 下面的 return "ALIVE" 改成 "SILENT"，else 分支的 return 改成 "ALIVE"（两处对调）。',
    ],
    summary: '最终关的第一课：把判定条件读清楚再写返回值。分支反了程序照样运行，但语义全错——这正是调试需要"走读代码"的原因。',
    rewardExp: 120,
    varsNote: [
      { name: 'check_heartbeat', desc: '心跳判定：0 → SILENT，非 0 → ALIVE。' },
      { name: 'report', desc: '把每条心跳结果拼接成报告文本。' },
      { name: 'seqs', desc: '心跳序列，如 [1, 0, 1, 0]。' },
    ],
  }, JUDGE_6_1),

  L6({
    id: '6-2', serverId: 'core', order: 2,
    title: '数据校检', codename: 'ARK-02',
    fault: '数据校检只拦截了低压警戒区，高压侧的信道全部漏检——警戒判定缺少另一半条件。',
    faultLog: '[ARK-CORE] VALIDATION GAP — 高压侧（> 90）未纳入警戒条件。',
    goal: '修复 validate：把低于 40 或高于 90 的载体全部标记出来。',
    behavior: '把条件补全为 c < 40 or c > 90（复合条件，用 or 连接两侧警戒区）。',
    initialCode: 'def validate(carriers):\n    bad = []\n    for c in carriers:\n        if c < 40:\n            bad.append(c)\n    return bad',
    knowledge: ['logic', 'list', 'for', 'compare'],
    hints: [
      '只有低压侧被拦截，高压侧的信道数据还在自由流动。',
      '警戒区有两个：低于 40 或高于 90。当前条件只管了左边。',
      '把 if c < 40: 补成 if c < 40 or c > 90:——两侧警戒区都标记。',
    ],
    summary: '真实世界的校验条件往往由多个区间组成。漏写一边不是语法错误，而是需求理解的缺口——先读需求，再写条件。',
    rewardExp: 120,
    varsNote: [
      { name: 'validate', desc: '校检函数：返回所有警戒区内的载体。' },
      { name: 'carriers', desc: '载体数据列表。' },
      { name: 'bad', desc: '警戒载体集合。' },
    ],
  }, JUDGE_6_2),

  L6({
    id: '6-3', serverId: 'core', order: 3,
    title: '密文解析', codename: 'ARK-03',
    fault: '密文解析只输出了最后一个符号的译文——拼接时覆盖了累积结果，前面的译文全部丢失。',
    faultLog: '[ARK-CORE] DECODE TRUNCATED — 结果被每次覆盖而非累积拼接。',
    goal: '修复 decode，让符号序列完整转译成 NEXUS HUMAN。',
    behavior: '把 result = table[s] + " " 改成 result = result + table[s] + " "（累积拼接）。',
    initialCode: 'def decode(symbols):\n    table = {"A": "NEXUS", "B": "ECHO", "C": "HUMAN"}\n    result = ""\n    for s in symbols:\n        result = table[s] + " "\n    return result\n\nprint(decode(["A", "C"]))',
    knowledge: ['dict', 'string', 'for'],
    hints: [
      '只输出了最后一条译文。循环里每次都在"重新开始"而不是"继续追加"。',
      '累积拼接的模式是：结果 = 结果 + 新内容。当前写法把 result 丢在了等号右边。',
      '把 result = table[s] + " " 改成 result = result + table[s] + " "。',
    ],
    summary: '在循环里累积结果（result = result + 新内容）是基础而重要的模式；写成覆盖（result = 新内容）程序不报错，但数据只剩最后一步。',
    rewardExp: 130,
    varsNote: [
      { name: 'decode', desc: '密文转译函数：符号 → 译文拼接。' },
      { name: 'table', desc: '符号对照字典。' },
      { name: 'result', desc: '累积的译文结果。' },
    ],
  }, JUDGE_6_3),

  L6({
    id: '6-4', serverId: 'core', order: 4,
    title: '序列比对', codename: 'ARK-04',
    fault: '序列比对把丢失位也当成了匹配——通配符 ? 表示该位数据不确定，却被计入了匹配数。',
    faultLog: '[ARK-CORE] MATCH INFLATED — ? 通配位被错误计入匹配计数。',
    goal: '修复 count_matches：只有确定相等的位才计数，? 表示不确定、不计入匹配。',
    behavior: '去掉条件里的 or actual[i] == "?"，只保留确定相等才计数。',
    initialCode: 'def count_matches(expect, actual):\n    count = 0\n    i = 0\n    while i < len(expect):\n        if actual[i] == "?" or actual[i] == expect[i]:\n            count = count + 1\n        i = i + 1\n    return count',
    knowledge: ['while', 'list', 'logic', 'compare'],
    hints: [
      '匹配数偏大——列为"不确定"的位也被算成了匹配。',
      '? 表示该位数据在读回时丢失了，不能视为匹配成功。',
      '把条件里的 or actual[i] == "?" 删掉：只有 actual[i] == expect[i] 时才计数。',
    ],
    summary: 'while + 索引遍历时，条件的边角分支（通配、默认值、异常值）决定了结果精度。删掉错误的"或"分支，统计口径才正确。',
    rewardExp: 140,
    varsNote: [
      { name: 'count_matches', desc: '比对函数：返回确定匹配的位数。' },
      { name: 'expect', desc: '期望序列。' },
      { name: 'actual', desc: '实际读回序列，? 表示该位不确定。' },
      { name: 'i', desc: '索引游标。' },
    ],
  }, JUDGE_6_4),

  L6({
    id: '6-5', serverId: 'core', order: 5,
    title: '方舟重启', codename: 'ARK-05',
    fault: '方舟重启协议在读到一条损坏记录时整体崩溃——坏数据没有被隔离，整个核心的检查链路瘫痪。',
    faultLog: '[ARK-CORE] BOOT ABORTED — 单条损坏记录（ghost:NaN）导致全量检查中断。',
    goal: '修复 check_cells：正常记录按阈值分流（≥60 入 ok），坏数据隔离为 UNKNOWN（非法数值）或 MALFORMED（缺冒号），不中断。',
    behavior: '用 try/except ValueError / IndexError 隔离坏记录（split(":") 解析文本）。',
    initialCode: 'def parse_cell(raw):\n    parts = raw.split(":")\n    return parts[0], int(parts[1])\n\ndef check_cells(cells):\n    ok = []\n    fail = []\n    for raw in cells:\n        name, value = parse_cell(raw)\n        if value >= 60:\n            ok.append(name)\n        else:\n            fail.append(name)\n    return ok, fail\n\nprint(check_cells(["core:80", "fan:20", "ghost:NaN"]))',
    knowledge: ['try', 'dict', 'list', 'return'],
    hints: [
      '一条 ghost:NaN 就让整个重启协议崩溃了。检查函数解析的是文本，可能遇到两种坏格式。',
      'parse_cell 可能抛 ValueError（int 转换失败）或 IndexError（缺冒号时 parts[1] 不存在）。',
      '在循环里用 try: 包裹解析，except ValueError: 记为 UNKNOWN，except IndexError: 记为 MALFORMED——都用 fail.append 隔离。',
    ],
    summary: '终章之作：先 split 解析再逐条隔离异常——数据库、协议、生产系统面对脏数据的唯一正确姿势。至此，五章所学全部集成。',
    rewardExp: 160,
    varsNote: [
      { name: 'parse_cell', desc: '解析记录："名称:数值" → (名称, 数值)。' },
      { name: 'check_cells', desc: '整表检查：分流 ok/fail，坏数据隔离。' },
      { name: 'ok / fail', desc: '合格与不合格记录集合。' },
    ],
  }, JUDGE_6_5),
];


// ---------- 第五章：系统诊断中心（字典、异常处理、复合逻辑） ----------
const JUDGE_5_1: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '已知设备正常输出，未知设备返回占位', lines: ['S-01', 'UNKNOWN'] }],
};
const JUDGE_5_2: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '正常数字解析', expr: "parse_count('12') == 12" },
    { name: '非法内容返回 0 不崩溃', expr: "parse_count('abc') == 0" },
    { name: '其他数字正常解析', expr: "parse_count('7') == 7" },
  ],
};
const JUDGE_5_3: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '紧急模式且温度超限→报警', expr: 'should_alert(95, 100, True) == True' },
    { name: '紧急模式且压力超限→报警', expr: 'should_alert(70, 130, True) == True' },
    { name: '非紧急模式温度超限→不报警', expr: 'should_alert(95, 100, False) == False' },
    { name: '非紧急模式压力超限→不报警', expr: 'should_alert(70, 130, False) == False' },
  ],
};
const JUDGE_5_4: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '全部数值按倍率转换', expr: "convert({'temp': 30, 'pressure': 10}, 3) == {'temp': 90, 'pressure': 30}" },
    { name: '倍率为 1 时不变', expr: "convert({'fan': 50}, 1) == {'fan': 50}" },
    { name: '倍率为 0 时归零', expr: "convert({'relay': 5}, 0) == {'relay': 0}" },
  ],
};
const JUDGE_5_5: LevelJudgeSpec = {
  judgeKind: 'python',
  // 说明：不同 Python 实现的字典遍历顺序可能不同，故按排序后的结果比较（内容正确即可）
  pythonChecks: [
    { name: '正常记录正确分级', expr: "sorted(diagnose({'core': 95, 'fan': 50})) == sorted(['core: HIGH', 'fan: OK'])" },
    { name: '低值与非法值不崩溃', expr: "sorted(diagnose({'idle': 5, 'ghost': 'NaN'})) == sorted(['idle: LOW', 'ghost: ERR'])" },
  ],
};

function L5(d: Omit<LevelDef, 'judge'>, judge: LevelJudgeSpec): LevelDef {
  return { ...d, judge };
}

const CHAPTER5_LEVELS: LevelDef[] = [
  L5({
    id: '5-1', serverId: 'diag', order: 1,
    title: '丢失的键值', codename: 'DIAG-01',
    fault: '诊断系统读取设备编号时崩溃——某个设备不存在于记录表中，直接按键访问触发了 KeyError。',
    faultLog: "[DIAG-LAB] EXCEPTION: KeyError — 'valve'。设备登记表缺少该键。",
    goal: '修复记录读取，让存在的设备输出编号、不存在的设备输出 UNKNOWN（不崩溃）。',
    behavior: '用 get() 方法读取：records.get(name, "UNKNOWN")，键缺失时返回默认值。',
    initialCode: 'def get_code(records, name):\n    return records[name]\n\nrecords = {"sensor": "S-01", "relay": "R-02"}\nprint(get_code(records, "sensor"))\nprint(get_code(records, "valve"))',
    knowledge: ['dict', 'return'],
    hints: [
      '程序在第二次读取时崩溃：valve 这台设备没有登记在字典里。',
      '字典用中括号直接取键会抛 KeyError；get() 方法可以在键缺失时返回你指定的默认值。',
      '把 return records[name] 改成 return records.get(name, "UNKNOWN")——键不存在时返回 UNKNOWN。',
    ],
    summary: '字典是键值对集合：records["sensor"] 取键对应的值；键不存在会抛 KeyError。records.get(键, 默认值) 则安全返回默认值，是防御性读取的标准写法。',
    rewardExp: 90,
    varsNote: [
      { name: 'records', desc: '设备登记字典：{"sensor": "S-01", "relay": "R-02"}。' },
      { name: 'get_code', desc: '读取函数：按设备名返回编号。' },
    ],
  }, JUDGE_5_1),

  L5({
    id: '5-2', serverId: 'diag', order: 2,
    title: '失血的内存', codename: 'DIAG-02',
    fault: '内存读数解析器遇到非数字内容时直接崩溃——转换失败没有被捕获，业务链路断在解析这一环。',
    faultLog: '[DIAG-LAB] EXCEPTION: ValueError — invalid literal for int()。解析未受保护。',
    goal: '让 parse_count 在内容不是数字时返回 0，而不是抛异常崩溃。',
    behavior: '用 try/except 捕获 ValueError：解析失败时返回 0。',
    initialCode: 'def parse_count(text):\n    return int(text)\n\nprint(parse_count("12"))\nprint(parse_count("abc"))',
    knowledge: ['try', 'dict'],
    hints: [
      '第二次调用时崩溃：int("abc") 无法转换。程序希望坏数据也能被"兜住"。',
      'Python 用 try / except 结构捕获并处理异常，让程序继续运行。',
      '把函数体改成：try: return int(text) 然后 except ValueError: return 0——转换失败时返回 0。',
    ],
    summary: 'try/except 是异常处理结构：try 块里出错的语句会被 except 捕获，程序不会崩溃。int(text) 对非数字抛 ValueError，用 except ValueError 精确捕获它。',
    rewardExp: 100,
    varsNote: [
      { name: 'parse_count', desc: '解析函数：把文本转换成整数，失败返回 0。' },
      { name: 'text', desc: '待解析的文本读数。' },
    ],
  }, JUDGE_5_2),

  L5({
    id: '5-3', serverId: 'diag', order: 3,
    title: '复合的判断', codename: 'DIAG-03',
    fault: '报警逻辑在"非紧急模式"下依然触发——复合条件缺少括号，or 把不该报警的场景放行了。',
    faultLog: '[DIAG-LAB] FALSE ALARM — and 优先于 or，复合条件缺括号导致优先级错位。',
    goal: '修复报警判定：只有紧急模式（critical）且温度或压力任一超限时才报警。',
    behavior: '给温度/压力条件加上括号：critical and (temp > 80 or pressure > 120)。',
    initialCode: 'def should_alert(temp, pressure, critical):\n    if critical and temp > 80 or pressure > 120:\n        return True\n    return False',
    knowledge: ['logic', 'compare'],
    hints: [
      '非紧急模式下压力超限也报警了——想想 and 和 or 谁先运算。',
      'Python 里 not > and > or：critical and temp > 80 or pressure > 120 实际是 (critical and temp > 80) or (pressure > 120)。',
      '给或条件加括号：if critical and (temp > 80 or pressure > 120):——表达真正的意图：「紧急模式 且（温度或压力任一超限）」。',
    ],
    summary: '复合逻辑的优先级：not > and > or。想要"先或后与"必须用括号。不带括号的复合条件常产生静默的逻辑错误，测试组合输入是发现它的关键。',
    rewardExp: 100,
    varsNote: [
      { name: 'should_alert', desc: '报警判定函数：(温度, 压力, 是否紧急模式)。' },
      { name: 'critical', desc: '紧急模式开关。' },
    ],
  }, JUDGE_5_3),

  L5({
    id: '5-4', serverId: 'diag', order: 4,
    title: '转译的记录', codename: 'DIAG-04',
    fault: '数值转译把读数变成了一串重复的文本——转换时用错了字典的值，把键当成了值。',
    faultLog: '[DIAG-LAB] TRANSLATION CORRUPTED — 使用 key 而非 records[key] 参与计算。',
    goal: '修复 convert，让字典里每个数值按倍率正确转换。',
    behavior: '把 records[key] = key * factor 改成 records[key] = records[key] * factor（读取值再计算）。',
    initialCode: 'def convert(records, factor):\n    for key in records:\n        records[key] = key * factor\n    return records',
    knowledge: ['dict', 'for'],
    hints: [
      '转换结果变成了一串重复的字母——字符串被"乘以"了数字。',
      '遍历字典时 key 是键（比如 "temp"），要拿它对应的值必须写 records[key]。',
      '把 records[key] = key * factor 改成 records[key] = records[key] * factor——先取值，再乘倍率，写回。',
    ],
    summary: '遍历字典 for key in records 拿到的是键；取值用 records[key]，改值用 records[key] = 新值。把键当值参与运算不会报错，但会产生难以察觉的错误数据。',
    rewardExp: 110,
    varsNote: [
      { name: 'convert', desc: '转译函数：把字典里每个数值乘以倍率并写回。' },
      { name: 'records', desc: '读数字典，如 {"temp": 30, "pressure": 10}。' },
      { name: 'factor', desc: '转换倍率。' },
    ],
  }, JUDGE_5_4),

  L5({
    id: '5-5', serverId: 'diag', order: 5,
    title: '综合诊断', codename: 'DIAG-05',
    fault: '诊断中心无法处理损坏的数据记录——记录里混入非法字符后整个诊断程序崩溃，系统性瘫痪。',
    faultLog: '[DIAG-LAB] SYSTEMATIC CRASH — 单条坏数据导致全表诊断中断。需要异常隔离。',
    goal: '修复 diagnose：正常读数 > 80 标 HIGH、< 20 标 LOW、其余 OK；非法内容标 ERR 且不中断。',
    behavior: '逐条用 try/except 包裹转换与比较：int(value) 失败时输出 ERR 并继续。',
    initialCode: 'def diagnose(records):\n    result = []\n    for name, value in records.items():\n        if value > 80:\n            result.append(name + ": HIGH")\n        elif value < 20:\n            result.append(name + ": LOW")\n        else:\n            result.append(name + ": OK")\n    return result',
    knowledge: ['dict', 'try', 'logic'],
    hints: [
      '整张表因为一条坏数据崩溃了。看看记录值可能是什么类型。',
      '把每条记录都放进 try 块：能 int(value) 就分级，不能就输出 ERR。',
      '用 items() 遍历键值对；在循环体里加 try: int(value) 比较分级，except ValueError: result.append(name + ": ERR")。',
    ],
    summary: '真实数据总是混着坏数据。防御式写法：items() 遍历字典，int(value) 统一转数字，try/except 把非法条目隔离成 ERR——一条坏数据不再拖垮整个系统。',
    rewardExp: 130,
    varsNote: [
      { name: 'diagnose', desc: '诊断函数：遍历字典分级（HIGH/LOW/OK/ERR）。' },
      { name: 'records', desc: '记录字典，值可能是数字或非法文本。' },
      { name: 'result', desc: '分级结果列表。' },
    ],
  }, JUDGE_5_5),
];


// ---------- 第四章：自动化工厂（函数、参数、返回值） ----------
const JUDGE_4_1: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '装配结果正确输出', contains: ['CORE ASSEMBLED POWER ON'] }],
};
const JUDGE_4_2: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [
    { name: '输出装配产物编号', contains: ['FOO-BUILT'] },
    { name: '不输出 None', notContains: ['None'] },
  ],
};
const JUDGE_4_3: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '工单内容正确', contains: ['SILICON -> LINE B'] }],
};
const JUDGE_4_4: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [
    { name: '温度未达标时等待冷却', contains: ['WAIT FOR COOLING'] },
    { name: '不错误启动产线', notContains: ['START PRODUCTION'] },
  ],
};
const JUDGE_4_5: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '总装输出格式正确', expr: "assemble('SERVER', ['CPU', 'RAM']) == 'SERVER contains: CPU, RAM'" },
    { name: '单件商品也能总装', expr: "assemble('NODE', ['CHIP']) == 'NODE contains: CHIP'" },
  ],
};

function L4(d: Omit<LevelDef, 'judge'>, judge: LevelJudgeSpec): LevelDef {
  return { ...d, judge };
}

const CHAPTER4_LEVELS: LevelDef[] = [
  L4({
    id: '4-1', serverId: 'factory', order: 1,
    title: '失灵的装配', codename: 'FA-01',
    fault: '装配线的控制程序无法启动——函数定义的关键字被错误拼写，Python 无法识别这条指令。',
    faultLog: '[AUTO-FAB] EXCEPTION: SyntaxError — invalid syntax (daf assemble(part):)。装配指令无法解析。',
    goal: '修复函数定义，让程序输出 CORE ASSEMBLED POWER ON。',
    behavior: '把错误拼写的 daf 改成 def（定义函数的关键字）。',
    initialCode: 'daf assemble(part):\n    return part + " ASSEMBLED"\n\ndef power_on(unit):\n    print(unit + " POWER ON")\n\npower_on(assemble("CORE"))',
    knowledge: ['return', 'parameter'],
    hints: [
      '报错指向函数定义第一行附近。Python 用来定义函数的关键字是什么？',
      '定义函数用 def，后面跟函数名、圆括号参数列表和英文冒号。',
      '把第 1 行的 daf 改成 def：daf 不是 Python 的关键字，所以解析器在冒号处报错。',
    ],
    summary: '函数用 def 定义：def 函数名(参数): 后跟缩进的函数体。函数只有被调用时才会执行；名字拼错会被当成普通标识符并引发语法错误。',
    rewardExp: 70,
    varsNote: [
      { name: 'assemble', desc: '装配函数：给零件编号追加 " ASSEMBLED" 后缀并返回。' },
      { name: 'power_on', desc: '开机函数：输出整机名称与 " POWER ON"。' },
    ],
  }, JUDGE_4_1),

  L4({
    id: '4-2', serverId: 'factory', order: 2,
    title: '空转的产线', codename: 'FA-02',
    fault: '产线"空转"：装配结果没有交还给调用方，输出的编号变成了 None。',
    faultLog: '[AUTO-FAB] PRODUCT ID = None — 函数缺少返回值，结果未回传产线。',
    goal: '修复 build 函数，让调用方拿到装配产物编号 FOO-BUILT 并正确输出。',
    behavior: '在 build 函数末尾添加 return result（把结果交还给调用者）。',
    initialCode: 'def build(code):\n    result = code + "-BUILT"\n\npart = build("FOO")\nprint(part)',
    knowledge: ['return', 'parameter'],
    hints: [
      '输出的是 None——说明函数没有把任何值交还给调用方。',
      '函数把结果交给调用者靠 return 语句；没有 return 的函数默认返回 None。',
      '在 build 函数体的最后（result 那一行之下，保持 4 空格缩进）添加：return result',
    ],
    summary: '函数的「产出」通过 return 交还给调用者；漏写 return 时函数返回 None。这是"函数能用但结果永远是 None"的经典故障。',
    rewardExp: 80,
    varsNote: [
      { name: 'build', desc: '装配函数：期望返回 code + "-BUILT"。' },
      { name: 'result', desc: '装配产物编号，需要被 return 出去。' },
      { name: 'part', desc: '接收 build 返回值的变量。' },
    ],
  }, JUDGE_4_2),

  L4({
    id: '4-3', serverId: 'factory', order: 3,
    title: '乱序的工单', codename: 'FA-03',
    fault: '工单调度把「产线」和「产品」两个参数填反了——程序没有报错，但每一张工单都被配到了错误的产线。',
    faultLog: '[AUTO-FAB] ORDER MISROUTED — 调用时位置参数顺序与定义不符。',
    goal: '修复调用语句，让输出显示 SILICON -> LINE B。',
    behavior: '把 schedule("SILICON", "B") 改成 schedule("B", "SILICON")——第一个参数是产线编号。',
    initialCode: 'def schedule(line, product):\n    return product + " -> LINE " + line\n\norder = schedule("SILICON", "B")\nprint(order)',
    knowledge: ['parameter', 'return'],
    hints: [
      '输出里产品和产线对调了——看看调用时传参的顺序。',
      '位置参数按顺序绑定：调用函数时，第一个实参会传给定义时的第一个形参（这里是 line）。',
      '把第 5 行 schedule("SILICON", "B") 改成 schedule("B", "SILICON")：先传产线，再传产品。',
    ],
    summary: '位置参数严格按顺序传递。参数顺序写反不会报错，只会静默产生错误结果——比报错更难发现，调试时先检查调用处。',
    rewardExp: 90,
    varsNote: [
      { name: 'schedule', desc: '排产函数：参数为 (产线 line, 产品 product)。' },
      { name: 'order', desc: '接收排产结果的变量。' },
    ],
  }, JUDGE_4_3),

  L4({
    id: '4-4', serverId: 'factory', order: 4,
    title: '换岗的工位', codename: 'FA-04',
    fault: '产线在 95 度高温下仍然开工——安全判断里写的不是函数的「结果」，而是函数「本身」，永远为真。',
    faultLog: '[AUTO-FAB] THERMAL BYPASS — 条件判断引用了函数对象而非调用结果。',
    goal: '修复安全判断，让温度 95 时输出 WAIT FOR COOLING（等待冷却）。',
    behavior: '把判断条件里的 is_ready 改成 is_ready(95)（调用函数，而不是引用函数名）。',
    initialCode: 'def is_ready(temperature):\n    if temperature <= 80:\n        return True\n    return False\n\nif is_ready:\n    print("START PRODUCTION")\nelse:\n    print("WAIT FOR COOLING")',
    knowledge: ['parameter', 'return', 'compare'],
    hints: [
      '95 度不该开工，但产线还是启动了。问题出在 if 条件里写的内容。',
      '函数名加括号才是"调用"，会执行函数体并得到返回值；只写函数名拿到的是函数对象（作为条件永远为真）。',
      '把 if is_ready: 改成 if is_ready(95):——调用它，并用返回值（True/False）做判断。',
    ],
    summary: '定义函数不等于调用函数。is_ready 是函数对象（恒为真值），is_ready(95) 才是它的计算结果。这类"忘写括号"的 bug 不报错，但逻辑永远不对。',
    rewardExp: 100,
    varsNote: [
      { name: 'is_ready', desc: '就绪判定函数：温度 ≤ 80 返回 True。' },
      { name: 'temperature', desc: '温度参数。' },
    ],
  }, JUDGE_4_4),

  L4({
    id: '4-5', serverId: 'factory', order: 5,
    title: '总装线', codename: 'FA-05',
    fault: '总装线把清单合并成文本时崩溃——join 方法被用反了，字符串方法与列表方法放错了位置。',
    faultLog: '[AUTO-FAB] EXCEPTION: AttributeError — list object has no attribute join。总装指令中断。',
    goal: '修复 assemble 函数，让它把零件清单合并成 "SERVER contains: CPU, RAM" 这样的文本。',
    behavior: '把 parts.join(", ") 改成 ", ".join(parts)——join 是字符串的方法。',
    initialCode: 'def add_part(part, parts):\n    parts.append(part)\n\ndef assemble(product, parts):\n    return product + " contains: " + parts.join(", ")\n\nparts = []\nadd_part("CPU", parts)\nadd_part("RAM", parts)\nprint(assemble("SERVER", parts))',
    knowledge: ['list', 'parameter', 'return'],
    hints: [
      '报错发生在 assemble 内部——它想把零件清单合并成一段文本。',
      '把列表元素连接成字符串，用的是字符串的 join 方法：格式是 "分隔符".join(列表)。',
      '把 parts.join(", ") 改成 ", ".join(parts)：写法是分隔符在前，列表在括号里。',
    ],
    summary: '", ".join(零件列表) 会把列表元素用 ", " 连接成一个字符串。join 定义在字符串上，不是列表上；函数之间通过参数传值、return 回传，组成流水线。',
    rewardExp: 110,
    varsNote: [
      { name: 'add_part', desc: '上料函数：把零件加入清单（列表是可变对象，无需返回）。' },
      { name: 'assemble', desc: '总装函数：返回 "产品 contains: 零件清单" 文本。' },
      { name: 'parts', desc: '零件清单，由 add_part 逐件添加。' },
    ],
  }, JUDGE_4_5),
];


// ---------- 第三章：存储数据仓（列表、索引、for/while、列表操作） ----------
const JUDGE_3_1: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '按顺序输出全部货品', lines: ['A', 'B', 'C'] }],
};
const JUDGE_3_2: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '所有货号入库', expr: "store(['P-01', 'P-02', 'P-03']) == ['P-01', 'P-02', 'P-03']" },
    { name: '空清单返回空列表', expr: 'store([]) == []' },
    { name: '单个货号正常入库', expr: "store(['X']) == ['X']" },
  ],
};
const JUDGE_3_3: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '输出全部四件货品', lines: ['O-1', 'O-2', 'O-3', 'O-4'] }],
};
const JUDGE_3_4: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '命中库存返回 True', expr: "check_inventory('P-02', ['P-01', 'P-02', 'P-03']) == True" },
    { name: '缺货返回 False', expr: "check_inventory('Q-9', ['P-01', 'P-02']) == False" },
    { name: '空库存返回 False', expr: "check_inventory('A-1', []) == False" },
  ],
};
const JUDGE_3_5: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '按长度正确分类', expr: "categorize(['A-1', 'STORAGE', 'B-2']) == (['STORAGE'], ['A-1', 'B-2'])" },
    { name: '空清单分类', expr: 'categorize([]) == ([], [])' },
    { name: '单件货品归轻量区', expr: "categorize(['X']) == ([], ['X'])" },
  ],
};

function L3(d: Omit<LevelDef, 'judge'>, judge: LevelJudgeSpec): LevelDef {
  return { ...d, judge };
}

const CHAPTER3_LEVELS: LevelDef[] = [
  L3({
    id: '3-1', serverId: 'storage', order: 1,
    title: '空仓的货架', codename: 'VAULT-01',
    fault: '仓管程序读取货架清单时崩溃——它访问了一个不存在的货位，越过了列表的边界。',
    faultLog: '[VAULT-03] EXCEPTION: IndexError — list index out of range (items[3])。取货指令崩溃。',
    goal: '修复索引访问，让程序按顺序输出 A、B、C 三件货品。',
    behavior: '把 items[3] 改成 items[0]（并调整前两行），记住列表索引起始是 0。',
    initialCode: 'items = ["A", "B", "C"]\n\nprint(items[1])\nprint(items[2])\nprint(items[3])',
    knowledge: ['list', 'for'],
    hints: [
      '程序报 IndexError——它访问的下标超出了列表的边界。数一数 items 里有几个元素、下标分别是什么。',
      'Python 列表的索引从 0 开始：items[0] 是第一件，items[1] 是第二件……最后一个元素的下标是长度减 1。',
      '把第 4 行的 items[3] 改成 items[0]，同时把前两行改成 items[1]、items[2]——输出顺序就会是 A、B、C。',
    ],
    summary: '列表索引从 0 开始。第 n 件货品是 items[n-1]；访问下标 >= len(items) 会抛 IndexError。len(列表) 获取元素个数。',
    rewardExp: 80,
    varsNote: [
      { name: 'items', desc: '货品清单列表，含 "A"、"B"、"C" 三件。' },
    ],
  }, JUDGE_3_1),

  L3({
    id: '3-2', serverId: 'storage', order: 2,
    title: '错位的取货', codename: 'VAULT-02',
    fault: '入库记录只保存了最后一件货品——append 指令被放在了循环外面，前面两件入库记录全部丢失。',
    faultLog: '[VAULT-03] STOCK COUNT = 1 — 入库指令疑似脱离循环体。请检查缩进。',
    goal: '修复入库指令，让 store 函数把每一件货品都加入列表并返回完整清单。',
    behavior: '把 items.append(code) 移入 for 循环体（缩进 4 个空格）。',
    initialCode: 'def store(codes):\n    items = []\n    for code in codes:\n        items.append(code)\n    return items',
    knowledge: ['list', 'for', 'indent'],
    hints: [
      '只入库了最后一件。append 的缩进位置决定了它执行几次。',
      '循环体 = for 下方缩进的代码，会为每个元素执行一次。目前 append 缩进在循环外，只执行了一次。',
      '把 items.append(code) 这一行缩进 4 个空格，让它成为 for code in codes: 的循环体。',
    ],
    summary: 'append 在循环内＝每个元素都入库；在循环外＝只在循环结束后执行一次。缩进不仅决定层级，还决定代码"执行几次"。',
    rewardExp: 90,
    varsNote: [
      { name: 'store', desc: '入库函数：传入货号列表，返回完整入库清单。' },
      { name: 'items', desc: '入库清单，用 append 逐个追加。' },
      { name: 'code', desc: '循环变量：逐件货号。' },
    ],
  }, JUDGE_3_2),

  L3({
    id: '3-3', serverId: 'storage', order: 3,
    title: '沉底的货品', codename: 'VAULT-03',
    fault: '盘点程序只输出前三件货品——while 循环的上限被写死了，第四件货品永远排不上号。',
    faultLog: '[VAULT-03] COUNT MISSING ITEM — 循环边界为硬编码 3，与货架实际长度脱节。',
    goal: '修复 while 循环边界，让程序输出全部四件货品（O-1 到 O-4）。',
    behavior: '把 while count < 3: 改成 while count < len(items):（或等价写法）。',
    initialCode: 'count = 0\nitems = ["O-1", "O-2", "O-3", "O-4"]\n\nwhile count < 3:\n    print(items[count])\n    count = count + 1',
    knowledge: ['while', 'list'],
    hints: [
      '输出到 O-3 就停了，第四件货品没被读到。循环的条件是罪魁祸首。',
      'while 循环还有一个隐藏问题：如果货架再加一件货，这个程序又会漏掉。有什么方法能动态知道货架长度？',
      '用 len(items) 代替写死的 3：把 while count < 3: 改成 while count < len(items):，货架无论多长都能完整盘点。',
    ],
    summary: 'while 循环在条件为真时持续执行。用 len(列表) 作为边界，代码就能适应数据变化；硬编码数字是隐蔽 bug 的温床。',
    rewardExp: 90,
    varsNote: [
      { name: 'count', desc: '循环计数器，从 0 开始递增。' },
      { name: 'items', desc: '货品清单，共 4 件（O-1 ~ O-4）。' },
    ],
  }, JUDGE_3_3),

  L3({
    id: '3-4', serverId: 'storage', order: 4,
    title: '移库的校验', codename: 'VAULT-04',
    fault: '移库校验系统永远提示缺货——它把目标货品和整个货架清单做比较，而不是逐件比对。',
    faultLog: '[VAULT-03] INVENTORY CHECK ALWAYS FALSE — 比较对象错位：target 与整张清单比较。',
    goal: '修复比较对象，让 check_inventory 在货品存在于清单中时返回 True。',
    behavior: '把 if target == stock: 改成 if item == target:（循环里逐件比较）。',
    initialCode: 'def check_inventory(target, stock):\n    for item in stock:\n        if target == stock:\n            return True\n    return False',
    knowledge: ['for', 'compare', 'list'],
    hints: [
      '清单里明明有目标货品，却永远返回 False。问题出在循环内部的比较上。',
      'for item in stock 会依次取出 stock 的每个元素。这个循环里，item 和 stock 分别是什么？',
      '把 if target == stock: 改成 if item == target:——逐件比较，而不是拿目标跟整张清单比较。',
    ],
    summary: '遍历列表时，循环变量才是"当前这一件"。拿它和整个列表比较永远不成立（除非比较对象本身就是列表）。',
    rewardExp: 100,
    varsNote: [
      { name: 'check_inventory', desc: '库存校验函数：目标货品在清单中返回 True，否则 False。' },
      { name: 'target', desc: '要查找的目标货品编号。' },
      { name: 'stock', desc: '库存清单（列表）。' },
      { name: 'item', desc: '循环变量：当前这一件货品。' },
    ],
  }, JUDGE_3_4),

  L3({
    id: '3-5', serverId: 'storage', order: 5,
    title: '清点成册', codename: 'VAULT-05',
    fault: '分类清点程序把所有货品都堆进了重载区——else 分支的入库目标写错了，轻量货品全部被重载登记。',
    faultLog: '[VAULT-03] CLASSIFICATION FLATTENED — 轻量货品被错误 append 到 heavy 清单。',
    goal: '修复分类逻辑：编号长度 > 3 的进入 heavy 清单，其余进入 light 清单，返回 (heavy, light)。',
    behavior: '把 else 分支里的 heavy.append(code) 改成 light.append(code)。',
    initialCode: 'def categorize(codes):\n    heavy = []\n    light = []\n    for code in codes:\n        if len(code) > 3:\n            heavy.append(code)\n        else:\n            heavy.append(code)\n    return heavy, light',
    knowledge: ['list', 'for', 'len', 'if'],
    hints: [
      '两条分支都把货品放进了 heavy。看看 else 分支的入库目标。',
      '函数准备了两个清单：heavy（重载区）和 light（轻量区）。else 分支把"不长于 3 个字符"的货品放进了哪个？',
      '把 else: 下面的 heavy.append(code) 改成 light.append(code)。',
    ],
    summary: '分支与数据操作配合：if/else 决定数据流向哪条"运输线"。函数返回多个值时用 return a, b（元组），调用方按位置接收。',
    rewardExp: 110,
    varsNote: [
      { name: 'categorize', desc: '分类函数：返回 (heavy, light) 两个清单。' },
      { name: 'heavy', desc: '重载区清单（编号长度 > 3）。' },
      { name: 'light', desc: '轻量区清单（其余货品）。' },
    ],
  }, JUDGE_3_5),
];


// ---------- 第二章：数据日志中心（if/else、比较、布尔逻辑） ----------
const JUDGE_2_1: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [
    { name: 'error 状态触发警报输出', contains: ['ALERT: DATA CORRUPTED'], notContains: ['PASS: CHANNEL OK'] },
  ],
};
const JUDGE_2_2: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [
    { name: '等级 5 触发对应警报', contains: ['WARNING LEVEL: 5'], notContains: ['WARNING LEVEL: LOW'] },
  ],
};
const JUDGE_2_3: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '温度与压力双超限判定为过载', expr: 'is_overload(95, 160) == True' },
    { name: '仅温度超限不算过载', expr: 'is_overload(95, 120) == False' },
    { name: '仅压力超限不算过载', expr: 'is_overload(80, 160) == False' },
    { name: '双正常不算过载', expr: 'is_overload(80, 120) == False' },
  ],
};
const JUDGE_2_4: LevelJudgeSpec = {
  judgeKind: 'python',
  pythonChecks: [
    { name: '宕机时触发通知', expr: 'should_notify(0) == True' },
    { name: '在线时不发通知', expr: 'should_notify(8) == False' },
  ],
};
const JUDGE_2_5: LevelJudgeSpec = {
  judgeKind: 'stdout',
  stdoutChecks: [{ name: '逐条正确分类日志', lines: ['PASS', 'WARN', 'PASS', 'FAIL'] }],
};

function L2(d: Omit<LevelDef, 'judge'>, judge: LevelJudgeSpec): LevelDef {
  return { ...d, judge };
}

const CHAPTER2_LEVELS: LevelDef[] = [
  L2({
    id: '2-1', serverId: 'logs', order: 1,
    title: '分流的消息', codename: 'LOG-01',
    fault: '日志分流系统把本应放行的「正常通道」消息全拦了下来——else 分支的关键字损坏，变成了无效语句。',
    faultLog: '[LOG-CORE] EXCEPTION: SyntaxError — invalid syntax (els:)。放行分支无法解析。',
    goal: '修复分支结构，让 error 状态触发警报输出，其他状态正常放行。',
    behavior: '把错误拼写的 els: 改成 else:（与 if 对齐、末尾带冒号），使放行分支生效。',
    initialCode: 'status = "error"\n\nif status == "error":\n    print("ALERT: DATA CORRUPTED")\nels:\n    print("PASS: CHANNEL OK")',
    knowledge: ['if', 'compare'],
    hints: [
      '警报分支能正常运行，但放行分支报语法错误。检查最后一个分支的关键字拼写。',
      'if 的分支结构是 if ... else ...。else 必须与 if 对齐，且以英文冒号结尾。',
      '把第 6 行的 els: 改成 else:——Python 不认 els 这个关键字，所以解析器在冒号处报错。',
    ],
    summary: 'if/else 构成双分支：条件为真执行 if 块，否则执行 else 块。else 必须小写、与 if 对齐、以冒号结尾；拼错关键字会直接 SyntaxError。',
    rewardExp: 70,
    varsNote: [{ name: 'status', desc: '日志状态字符串："error" 或其他值。' }],
  }, JUDGE_2_1),

  L2({
    id: '2-2', serverId: 'logs', order: 2,
    title: '失衡的判断', codename: 'LOG-02',
    fault: '告警等级判断失效——系统把「赋值」当成了「比较」，条件语句直接变成了非法表达式。',
    faultLog: '[LOG-CORE] EXCEPTION: SyntaxError — invalid syntax (level = 5)。判断条件损坏。',
    goal: '修复比较判断，让等级为 5 时输出对应警报。',
    behavior: '把 if 条件里的单个 =（赋值）改成 ==（等于比较）。',
    initialCode: 'level = 5\n\nif level = 5:\n    print("WARNING LEVEL: 5")\nelse:\n    print("WARNING LEVEL: LOW")',
    knowledge: ['compare'],
    hints: [
      '错误指向条件判断那一行。为什么这里不能直接赋值呢？',
      'Python 里单个等号 = 是赋值（把值存进变量），两个等号 == 才是相等比较。if 条件需要的是判断。',
      '把第 4 行 if level = 5: 改成 if level == 5:。',
    ],
    summary: '= 是赋值，== 是相等比较。if 条件里必须用 ==；写成 = 会报 SyntaxError，即使某些场景不报错，也会产生非常隐蔽的 bug。',
    rewardExp: 70,
    varsNote: [{ name: 'level', desc: '告警等级（整数 5）。' }],
  }, JUDGE_2_2),

  L2({
    id: '2-3', serverId: 'logs', order: 3,
    title: '双重验证', codename: 'LOG-03',
    fault: '过载检测把「任意一个指标超限」就判定为过载，误报率高达 87%。任务要求：温度与压力同时超限才算紧急。',
    faultLog: '[LOG-CORE] FALSE ALERT RATE 87% — 判定条件使用了错误的逻辑连接词。',
    goal: '修改判定逻辑，让 is_overload 只有在温度 > 90 且 压力 > 150 时才返回 True。',
    behavior: '把条件里的 or 改成 and（或任何等价写法）。',
    initialCode: 'def is_overload(temp, pressure):\n    if temp > 90 or pressure > 150:\n        return True\n    return False',
    knowledge: ['compare', 'logic', 'return'],
    hints: [
      '误报率太高——先想清楚：是「任一超限」还是「双双超限」才该算过载？',
      'Python 用 and（并且）与 or（或者）连接多个条件。当前用 or，只要一边满足就为真，所以 87% 的情况都在误报。',
      '把 if 里的 or 改成 and：只有温度 > 90 并且压力 > 150 时才返回 True。',
    ],
    summary: '布尔逻辑：and 两边都为真才为真；or 一边为真即为真。报警类逻辑用错 and/or 会造成误报或漏报——这是真实世界里最常见的故障之一。',
    rewardExp: 90,
    varsNote: [
      { name: 'is_overload', desc: '判定函数：输入温度与压力，返回是否过载。' },
      { name: 'temp', desc: '温度读数。' },
      { name: 'pressure', desc: '压力读数。' },
    ],
  }, JUDGE_2_3),

  L2({
    id: '2-4', serverId: 'logs', order: 4,
    title: '反转的指令', codename: 'LOG-04',
    fault: '宕机通知逻辑反了——服务器在线时疯狂发送通知，真正宕机时却保持静默。',
    faultLog: '[LOG-CORE] NOTIFY QUEUE REVERSED — ping 探测结果与通知开关呈反相关。',
    goal: '修复 should_notify：服务器宕机（ping == 0）时应返回 True（发通知），在线时返回 False。',
    behavior: '用 not 反转现有判断（或等价写法：if ping == 0: return True）。',
    initialCode: 'def is_down(ping):\n    return ping == 0\n\ndef should_notify(ping):\n    if is_down(ping):\n        return False\n    return True',
    knowledge: ['logic', 'compare'],
    hints: [
      '所有通知都反了。看看 should_notify 对 is_down 的返回结果做了怎样的取舍。',
      '宕机时 is_down 返回 True——但当前代码在 True 时返回 False（不通知）。可以用 not 把判断反过来。',
      '把 if is_down(ping): 改成 if not is_down(ping):，即「在线时不通知，宕机时通知」。',
    ],
    summary: 'not 是逻辑取反：not True == False，not False == True。反转一个判断条件时，not 比改返回值更清晰、更不容易出错。',
    rewardExp: 90,
    varsNote: [
      { name: 'is_down', desc: '探测函数：ping == 0 表示宕机。' },
      { name: 'should_notify', desc: '通知决策函数：根据 is_down 决定是否发通知。' },
    ],
  }, JUDGE_2_4),

  L2({
    id: '2-5', serverId: 'logs', order: 5,
    title: '循环中的分流', codename: 'LOG-05',
    fault: '日志循环把 warn 级别的消息错误地归入 FAIL——else 兜住了所有非 ok 情况，缺少细分。',
    faultLog: '[LOG-CORE] LEVEL MISCLASSIFICATION — warn 条目被标记为 FAIL。',
    goal: '增加 elif 分支，让 warn 输出 WARN，只有 error 输出 FAIL。',
    behavior: '在 if 与 else 之间插入 elif log == "warn": 分支，输出 WARN。',
    initialCode: 'logs = ["ok", "warn", "ok", "error"]\n\nfor log in logs:\n    if log == "ok":\n        print("PASS")\n    else:\n        print("FAIL")',
    knowledge: ['for', 'if', 'elif'],
    hints: [
      '目前只有 PASS 和 FAIL 两档。想想 warn 消息应该被哪一档接收。',
      '多分支判断用 elif——它是 else if 的缩写：if 条件不满足但 elif 条件满足时，执行 elif 分支。',
      '在 if log == "ok": 分支与 else: 之间插入一行：elif log == "warn":，并在下一行缩进 4 个空格写 print("WARN")。',
    ],
    summary: 'elif 链：if ... elif ... else ... 从上到下依次判断，命中一个分支后立即结束。可以写任意多个 elif，适合多分类的逻辑。',
    rewardExp: 100,
    varsNote: [
      { name: 'logs', desc: '日志级别列表，包含 "ok"、"warn"、"error"。' },
      { name: 'log', desc: '循环变量：逐条取出的日志级别。' },
    ],
  }, JUDGE_2_5),
];

export const LEVELS: LevelDef[] = [
  L({
    id: 'tut-1', serverId: 'training', order: 1,
    title: '初识终端', codename: 'CAL-BASIC',
    fault: '训练终端的输出回路处于待机状态——它需要接收你的第一条输出指令，才能与你的意识完成接驳。',
    faultLog: '[PRIME-01] OUTPUT CIRCUIT STANDBY — 等待第一条 print 指令。',
    goal: '让终端输出：Hello, world!',
    behavior: '在编辑器里写一行 print("Hello, world!")，点击「运行代码」看结果，再点「提交修复」完成接驳。',
    initialCode: '# ===== 新人训练终端 =====\n# 你的第一条 Python 代码\n#\n# 目标：让终端显示 Hello, world!\n#\n# ↓ 在下一行写：print("Hello, world!")\n',
    knowledge: ['print'],
    hints: [
      '输出电路在等第一条指令。Python 里用 print() 函数把内容显示到终端——就像对世界说第一句话。',
      '把要显示的文字放进 print 的英文括号里，文字的两侧要加英文双引号：print("这里写文字")。',
      '在第 7 行写：print("Hello, world!") —— 逐字符对照：H 大写；逗号后面有一个空格；最后是英文感叹号 !。全部使用英文标点（中文的 ，！ 会判错）。',
    ],
    summary: 'print() 是 Python 最基础的输出函数。文字（字符串）要放在英文引号里：print("Hello, world!")。这就是所有程序员的第一行代码。',
    rewardExp: 40,
    varsNote: [{ name: 'print', desc: '输出函数：print("文字") 会把引号里的内容显示到终端。' }],
  }, JUDGE_TUT),

  L({
    id: '1-1', serverId: 'syntax', order: 1,
    title: '沉睡的日志', codename: 'LV-01',
    fault: '日志采集程序无法运行，报出语法错误。服务器状态报告的标题始终无法输出。',
    faultLog: '[SYNTAX-RIG] EXCEPTION: SyntaxError — 条件语句结构损坏。日志采集进程已挂起。',
    goal: '修复语法错误，让程序正常输出日志标题「服务器状态报告」。',
    behavior: 'if 条件语句的末尾需要英文冒号 :，使 print 语句成为 if 的代码块。',
    initialCode: 'log_title = "服务器状态报告"\n\nif log_title != ""\n    print(log_title)',
    knowledge: ['if', 'indent'],
    hints: [
      '程序在条件判断语句处中断了。请检查 if 语句的完整结构，特别是条件的结尾部分。',
      'Python 的 if 语句写完条件后，需要一个特殊符号来标志代码块的开始。',
      '检查第 3 行 if log_title != "" 的末尾——条件表达式结束后，要补上英文冒号 :。',
    ],
    summary: 'if 语句的格式是：if 条件: 换行后缩进写分支代码。英文冒号 : 是 Python 代码块开始的标志，漏掉它会触发 SyntaxError（语法错误）。',
    rewardExp: 60,
    varsNote: [{ name: 'log_title', desc: '日志标题字符串（"服务器状态报告"）。' }],
  }, JUDGE_1_1),

  L({
    id: '1-2', serverId: 'syntax', order: 2,
    title: '消失的字符', codename: 'LV-02',
    fault: '系统状态消息的字符串无法解析——字符串没有闭合，内容在中途断裂。',
    faultLog: '[SYNTAX-RIG] EXCEPTION: EOL while scanning string literal — 消息文本未闭合。',
    goal: '修复字符串语法错误，让系统状态消息正常输出。',
    behavior: '给字符串补上缺失的闭合引号（英文双引号 " 或单引号 ' + "'" + '），让引号成对出现。',
    initialCode: 'message = "NEXUS SYSTEM ONLINE\nprint(message)',
    knowledge: ['string'],
    hints: [
      '错误发生在第一行：终端报「扫描字符串时提前结束」。看看字符串的两端是否都有引号。',
      '字符串需要用一对引号包起来，并且必须成对闭合。数一数第一行有几个引号。',
      '第 1 行 message = "NEXUS SYSTEM ONLINE" 的末尾少了一个英文双引号（"），补上即可。',
    ],
    summary: '字符串要用引号（英文双引号 " 或单引号 ' + "'" + '）成对包裹。引号缺失，就会触发字符串相关的语法错误。',
    rewardExp: 60,
    varsNote: [{ name: 'message', desc: '系统状态消息字符串。' }],
  }, JUDGE_1_2),

  L({
    id: '1-3', serverId: 'syntax', order: 3,
    title: '错误的身份', codename: 'LV-03',
    fault: '身份识别系统找不到当前维修员的身份信息，程序报出 NameError。',
    faultLog: "[SYNTAX-RIG] EXCEPTION: NameError — name 'repair_ids' is not defined",
    goal: '修复变量名称问题，让身份信息正常显示。',
    behavior: '让 print 中引用的变量名与第一行定义的变量名完全一致（repair_id）。',
    initialCode: 'repair_id = "R-07"\n\nprint(repair_ids)',
    knowledge: ['variable'],
    hints: [
      '错误提示 NameError 说明程序找不到某个名字。对比一下：定义的名字和使用的名字是一样的吗？',
      '变量的名字必须完全一致：定义时叫什么，使用时就写什么（大小写也必须一样）。',
      '第 4 行 print 括号里的 repair_ids 比第 1 行定义的 repair_id 多了一个字母 s，删掉它。',
    ],
    summary: 'Python 变量先定义、后使用。定义和引用时名字必须完全一致（含大小写），否则会报 NameError: name ... is not defined。',
    rewardExp: 60,
    varsNote: [{ name: 'repair_id', desc: '修复师代号（字符串 "R-07"）。' }],
  }, JUDGE_1_3),

  L({
    id: '1-4', serverId: 'syntax', order: 4,
    title: '反向的数据', codename: 'LV-04',
    fault: '高温报警数据没有进入警报列表——过滤条件写反了，40 度以上的数据全部被丢掉了。',
    faultLog: '[SYNTAX-RIG] ALERT QUEUE EMPTY — 高温项被错误过滤。',
    goal: '修复比较运算符，让温度 ≥ 40 的数据进入警报列表。',
    behavior: '把条件 temp < 40 改为 temp >= 40（或等价的写法），让 40 度及以上的温度被保留。',
    initialCode: 'def filter_alerts(temps):\n    alerts = []\n\n    for temp in temps:\n        if temp < 40:\n            alerts.append(temp)\n\n    return alerts',
    knowledge: ['compare', 'for', 'indent', 'return', 'list'],
    hints: [
      '警报列表一直是空的。问题出在过滤条件上，检查 if 后面的比较运算符。',
      '当前条件是 temp < 40（低于 40 才保留）。想一想：警报应该保留「温度达到或超过 40」还是「低于 40」？',
      '把 if temp < 40 改成 if temp >= 40（大于等于）。这样 40 度及以上的数据才会进入警报列表。',
    ],
    summary: '比较运算符：< 小于、> 大于、>= 大于等于、<= 小于等于、== 等于、!= 不等于。注意边界值：40 度算不算警报，取决于用 >= 还是 >。',
    rewardExp: 80,
    varsNote: [
      { name: 'filter_alerts', desc: '过滤函数：输入温度列表，返回警报列表。' },
      { name: 'alerts', desc: '警报列表，通过 append 收集符合条件的温度。' },
      { name: 'temp', desc: '循环变量：遍历 temps 中的每个温度。' },
    ],
  }, JUDGE_1_4),

  L({
    id: '1-5', serverId: 'syntax', order: 5,
    title: '错位的程序', codename: 'LV-05',
    fault: '日志读取程序因为缩进问题无法运行——for 循环的循环体没有被识别。',
    faultLog: '[SYNTAX-RIG] EXCEPTION: IndentationError — expected an indented block',
    goal: '修复代码缩进，让程序依次输出每一条记录。',
    behavior: '把 print(record) 缩进到 for 循环体内部（行首加 4 个空格）。',
    initialCode: 'records = ["A", "B", "C"]\n\nfor record in records:\nprint(record)',
    knowledge: ['for', 'indent', 'list'],
    hints: [
      '错误提示 IndentationError 说明缩进有问题。看看 for 循环下面那行代码的位置。',
      'for 循环会重复执行它下面的代码块，而代码块要靠缩进（行首空格）来表示层级。',
      '给第 4 行 print(record) 的行首加上 4 个空格，让它成为 for 循环的循环体。',
    ],
    summary: 'Python 用缩进表示代码块层级。for 循环体、if 分支体都必须缩进，且同一代码块的缩进量必须一致（官方建议 4 个空格）。',
    rewardExp: 90,
    varsNote: [
      { name: 'records', desc: '日志记录列表，包含 "A"、"B"、"C"。' },
      { name: 'record', desc: '循环变量：每次循环取列表中的一个元素。' },
    ],
  }, JUDGE_1_5),
  ...CHAPTER2_LEVELS,
  ...CHAPTER3_LEVELS,
  ...CHAPTER4_LEVELS,
  ...CHAPTER5_LEVELS,
  ...CHAPTER6_LEVELS,
];




export const levelById = (id: string): LevelDef | undefined => LEVELS.find(l => l.id === id);

export const levelsOfServer = (serverId: string): LevelDef[] =>
  LEVELS.filter(l => l.serverId === serverId).sort((a, b) => a.order - b.order);

export type LevelUnlock = 'completed' | 'unlocked' | 'locked';

/** 关卡状态：已通关 / 可进入 / 未解锁（上一关未通过） */
export function levelUnlockState(progress: { completedLevels: string[] }, levelId: string): LevelUnlock {
  if (progress.completedLevels.includes(levelId)) return 'completed';
  const level = levelById(levelId);
  if (!level) return 'locked';
  const siblings = levelsOfServer(level.serverId);
  const idx = siblings.findIndex(s => s.id === levelId);
  if (idx <= 0) return 'unlocked';
  const prev = siblings[idx - 1];
  return prev && progress.completedLevels.includes(prev.id) ? 'unlocked' : 'locked';
}

/** 服务器是否可进入 */
export function serverUnlocked(progress: { unlockedServers: string[] }, serverId: string): boolean {
  return progress.unlockedServers.includes(serverId);
}
