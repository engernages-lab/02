// 六章 Boss 的三档难度题目（EASY / HARD / EXPERT）
// 规则：
//   1. 每个难度都是独立 Python 题（不是只改血量/数值）；
//   2. 考点严格落在 cumulativeKnowledge(chapter) 内（由测试断言）；
//   3. 初始故障代码必须真实执行验证，baselineMask 由 audit 脚本实测；
//   4. 判题只调用函数/表达式，允许不同写法的正确解。
import type { BossBattleDef, BossPhaseDef } from './battle';
import {
  GATE01_BATTLE, SOMNIA_BATTLE, INDEX0_BATTLE, JUDGMENT4_BATTLE, ENTROPY_BATTLE, K0_BATTLE,
} from './battle';
import type { BossDifficulty } from './difficulty';

type Phase = BossPhaseDef;

const GATE_HARD: Phase[] = [
  {
    id: 'gate-h1',
    title: '双路能源闸门',
    objective: '修复 startup_v2：能源 ≥ 50 且备用电源在线才 ONLINE；能源 ≥ 50 但备用离线为 STANDBY；否则 OFFLINE。',
    faultLog: '[GATE-01:HARD] DUAL FEED — 备用电源状态没有参与判断，临界值 50 被拒绝。',
    initialCode:
      'def startup_v2(energy, backup):\n' +
      '    if energy > 50:\n' +
      '        if backup:\n' +
      '            return "STANDBY"\n' +
      '        return "ONLINE"\n' +
      '    return "OFFLINE"\n\n' +
      'print(startup_v2(50, True))',
    hints: [
      '闸门现在有两个输入：主能源和备用电源。先分别看它们各自应该影响什么结果。',
      '临界值 50 必须算达标；备用电源在线与离线对应不同状态。',
      '把 energy > 50 改成 >=，并交换 ONLINE / STANDBY 的分支。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '50 级 + 备用在线 → ONLINE', expr: 'startup_v2(50, True) == "ONLINE"' },
        { name: '50 级 + 备用离线 → STANDBY', expr: 'startup_v2(50, False) == "STANDBY"' },
        { name: '49 级 → OFFLINE', expr: 'startup_v2(49, True) == "OFFLINE"' },
        { name: '80 级 + 备用离线 → STANDBY', expr: 'startup_v2(80, False) == "STANDBY"' },
      ],
    },
    knowledge: ['compare', 'if', 'return', 'variable'],
    baselineMask: 4,
    summary: '多输入闸门要分别判断：阈值用 >=，备用电源状态决定“全功率”还是“待机”。',
  },
  {
    id: 'gate-h2',
    title: '能源节点统计',
    objective: '修复 count_ready：统计能源等级 ≥ 30 的节点数量（空列表返回 0）。',
    faultLog: '[GATE-01:HARD] NODE COUNT — 30 级节点被漏计，统计结果偏低。',
    initialCode:
      'def count_ready(levels):\n' +
      '    total = 0\n' +
      '    for lv in levels:\n' +
      '        if lv > 30:\n' +
      '            total = total + 1\n' +
      '    return total',
    hints: [
      '统计结果在临界值附近出错。看看 30 级节点被算成了什么。',
      '“达到 30”与“大于 30”不是同一个条件。',
      '把 if lv > 30 改成 if lv >= 30。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '30 级节点被计入', expr: 'count_ready([30, 10, 60]) == 2' },
        { name: '空列表返回 0', expr: 'count_ready([]) == 0' },
        { name: '全部低于阈值返回 0', expr: 'count_ready([29, 29]) == 0' },
        { name: '高等级节点被计入', expr: 'count_ready([100]) == 1' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'compare', 'return', 'variable'],
    baselineMask: 14,
    summary: '计数类循环最容易在边界条件上出错：>= 与 > 决定了临界节点是否计入。',
  },
  {
    id: 'gate-h3',
    title: '端口标签生成',
    objective: '修复 label_nodes：非空端口名追加 " OK"，空端口追加 " EMPTY"，返回列表。',
    faultLog: '[GATE-01:HARD] PORT LABEL — 空端口与非空端口的标签被互换。',
    initialCode:
      'def label_nodes(nodes):\n' +
      '    out = []\n' +
      '    for n in nodes:\n' +
      '        if n == "":\n' +
      '            out.append(n + " OK")\n' +
      '        else:\n' +
      '            out.append(n + " EMPTY")\n' +
      '    return out',
    hints: [
      '生成的标签和端口实际状态对不上：空端口被标成了 OK。',
      '先判断“是不是空字符串”，再决定追加哪个后缀。',
      '把 if 与 else 两个分支里追加的内容交换。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '非空与空端口标签正确', expr: 'label_nodes(["A", ""]) == ["A OK", " EMPTY"]' },
        { name: '空列表返回空列表', expr: 'label_nodes([]) == []' },
        { name: '单个非空端口', expr: 'label_nodes(["X"]) == ["X OK"]' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'compare', 'string', 'return'],
    baselineMask: 2,
    summary: '字符串分支要先确认判断条件，再决定追加内容；空值是最常见的边界。',
  },
  {
    id: 'gate-h4',
    title: '能源审计汇总',
    objective: '修复 audit：统计 ≥ 50 的 UP 数量与其余 DOWN 数量，返回 [UP数量, DOWN数量]。',
    faultLog: '[GATE-01:HARD] AUDIT SUMMARY — 50 级节点被归入 DOWN，汇总结果错误。',
    initialCode:
      'def audit(levels):\n' +
      '    up = 0\n' +
      '    down = 0\n' +
      '    for lv in levels:\n' +
      '        if lv > 50:\n' +
      '            up = up + 1\n' +
      '        else:\n' +
      '            down = down + 1\n' +
      '    return [up, down]',
    hints: [
      '汇总里 UP 的数量比预期少。先检查 50 级节点被算到了哪一边。',
      'UP 的条件是“达到 50”，不是“大于 50”。',
      '把 if lv > 50 改成 if lv >= 50。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '临界 50 计入 UP', expr: 'audit([50, 20, 80]) == [2, 1]' },
        { name: '空列表', expr: 'audit([]) == [0, 0]' },
        { name: '49 计入 DOWN', expr: 'audit([49]) == [0, 1]' },
        { name: '全高等级', expr: 'audit([100, 100]) == [2, 0]' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'compare', 'return', 'variable'],
    baselineMask: 14,
    summary: '双向计数要保证每条数据恰好落入一边；边界值决定统计口径。',
  },
];

const GATE_EXPERT: Phase[] = [
  {
    id: 'gate-x1',
    title: '能源回路核算',
    objective: '修复 power_report：只统计 0~100 范围内的能源等级，返回 [有效数量, 有效总和]。',
    faultLog: '[GATE-01:EXPERT] LOOP REPORT — 越界能源被计入总和，有效数量与总和同时错误。',
    initialCode:
      'def power_report(levels):\n' +
      '    count = 0\n' +
      '    total = 0\n' +
      '    for lv in levels:\n' +
      '        if lv >= 0:\n' +
      '            total = total + lv\n' +
      '        count = count + 1\n' +
      '    return [count, total]',
    hints: [
      '结果里出现了不该被统计的越界能源。先想清楚“有效能源”的完整范围。',
      '范围判定需要两侧都满足；计数与累加必须发生在同一个有效分支里。',
      '把 0~100 判定写成嵌套 if，并让 count 与 total 都只在有效分支内更新。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '越界值被剔除', expr: 'power_report([50, 120, 20]) == [2, 70]' },
        { name: '负值被剔除', expr: 'power_report([-5, 100]) == [1, 100]' },
        { name: '空列表', expr: 'power_report([]) == [0, 0]' },
        { name: '边界 0 与 101', expr: 'power_report([0, 101]) == [1, 0]' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'compare', 'return', 'variable'],
    baselineMask: 4,
    summary: '范围合法性要两侧同时成立；计数与累加必须在同一有效分支内完成。',
  },
  {
    id: 'gate-x2',
    title: '阈值升压',
    objective: '修复 upshift：低于 limit 的能源值翻倍，其余保持不变，返回新列表。',
    faultLog: '[GATE-01:EXPERT] VOLTAGE SHIFT — 阈值判断方向相反，低压与高压被同时误处理。',
    initialCode:
      'def upshift(values, limit):\n' +
      '    out = []\n' +
      '    for v in values:\n' +
      '        if v > limit:\n' +
      '            out.append(v * 2)\n' +
      '        else:\n' +
      '            out.append(v)\n' +
      '    return out',
    hints: [
      '升压作用在了错误的一侧数据上。先确认“低于阈值”应该怎么判断。',
      '边界值等于 limit 时不属于“低于”。',
      '把 if v > limit 改成 if v < limit。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '低于阈值翻倍', expr: 'upshift([10, 50, 5], 50) == [20, 50, 10]' },
        { name: '等于阈值不变', expr: 'upshift([0], 0) == [0]' },
        { name: '空列表', expr: 'upshift([], 5) == []' },
        { name: '负值与高值', expr: 'upshift([-1, 100], 10) == [-2, 100]' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'compare', 'return', 'variable'],
    baselineMask: 6,
    summary: '筛选/变换类题目要同时确认方向与边界；等于阈值通常不属于“低于”。',
  },
  {
    id: 'gate-x3',
    title: '状态切换计数',
    objective: '修复 transitions：统计相邻状态发生变化的次数（states 为 "up"/"down" 列表）。',
    faultLog: '[GATE-01:EXPERT] TRANSITION COUNT — 比较方向反了，切换次数恒为 0。',
    initialCode:
      'def transitions(states):\n' +
      '    count = 0\n' +
      '    prev = states[0]\n' +
      '    for s in states:\n' +
      '        if s == prev:\n' +
      '            count = count + 1\n' +
      '        prev = s\n' +
      '    return count',
    hints: [
      '切换次数始终不对。问自己：什么时候才算“发生变化”？',
      '当前状态与上一个状态不同才计数；计数后还要记得更新 prev。',
      '把 if s == prev 改成 if s != prev。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '两次切换', expr: 'transitions(["up", "up", "down", "up"]) == 2' },
        { name: '单元素无切换', expr: 'transitions(["up"]) == 0' },
        { name: '一次切换', expr: 'transitions(["up", "down"]) == 1' },
        { name: '完全相同无切换', expr: 'transitions(["down", "down"]) == 0' },
      ],
    },
    knowledge: ['list', 'for', 'if', 'compare', 'string', 'variable', 'return'],
    baselineMask: 5,
    summary: '相邻比较要保存“上一个值”，并用 != 判断变化；单元素是天然边界。',
  },
  {
    id: 'gate-x4',
    title: '温度日志编码',
    objective: '修复 repair_log：温度 ≥ 80 记 "H"，< 20 记 "L"，其余记 "M"，按顺序拼接返回。',
    faultLog: '[GATE-01:EXPERT] TEMP ENCODING — 临界 80 与中温区编码同时错误。',
    initialCode:
      'def repair_log(temps):\n' +
      '    out = ""\n' +
      '    for t in temps:\n' +
      '        if t > 80:\n' +
      '            out = out + "H"\n' +
      '        else:\n' +
      '            if t < 20:\n' +
      '                out = out + "L"\n' +
      '            else:\n' +
      '                out = out + "L"\n' +
      '    return out',
    hints: [
      '编码串里出现了过多的 L：中温区被当成了低温。',
      '高温边界应包含 80；中温区需要第三个编码。',
      '把 > 80 改成 >= 80，并把 else 分支里的 "L" 改成 "M"。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '三类温度编码', expr: 'repair_log([80, 19, 50]) == "HLM"' },
        { name: '空列表', expr: 'repair_log([]) == ""' },
        { name: '低温', expr: 'repair_log([19]) == "L"' },
        { name: '中温区', expr: 'repair_log([79, 21]) == "MM"' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'compare', 'string', 'variable', 'return'],
    baselineMask: 6,
    summary: '多档编码要保证每档边界互斥且完整；80 属于高温档。',
  },
];

const GATE_HARD_DEF: BossBattleDef = {
  bossId: 'gate-01',
  chapter: 1,
  difficulty: 'hard',
  maxHp: 100,
  counterDamage: 3,
  bg: 'dataport',
  phases: GATE_HARD,
};

const GATE_EXPERT_DEF: BossBattleDef = {
  bossId: 'gate-01',
  chapter: 1,
  difficulty: 'expert',
  maxHp: 100,
  counterDamage: 3,
  bg: 'dataport',
  phases: GATE_EXPERT,
};

// ---------- SOMNIA 记忆吞噬体（第二章） ----------
const SOMNIA_HARD: Phase[] = [
  {
    id: 'som-h1',
    title: '记忆分流器',
    objective: '修复 route：error → ALERT，warn → WARN，其余 → PASS（注意分支顺序）。',
    faultLog: '[SOMNIA:HARD] ROUTE COLLISION — warn 被第一段 condition 吞掉，永远到不了 WARN。',
    initialCode:
      'def route(tag):\n' +
      '    if tag == "error" or tag == "warn":\n' +
      '        return "ALERT"\n' +
      '    else:\n' +
      '        return "PASS"',
    hints: ['warn 记忆被误判成 ALERT。两个条件被写进了同一个分支。', '三级分流应该逐级判断：error、warn、其他。', '改成 if / elif / else 三段。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: 'error → ALERT', expr: 'route("error") == "ALERT"' },
        { name: 'warn → WARN', expr: 'route("warn") == "WARN"' },
        { name: 'ok → PASS', expr: 'route("ok") == "PASS"' },
        { name: '其他标签 → PASS', expr: 'route("debug") == "PASS"' },
      ],
    },
    knowledge: ['if', 'elif', 'compare', 'string', 'return'],
    baselineMask: 13,
    summary: '多级分流要用 if / elif / else，保证每个分支只处理自己那一类。',
  },
  {
    id: 'som-h2',
    title: '异常记忆过滤',
    objective: '修复 filter_records：去掉空记录与 "ok" 记录，保留其余记录及顺序。',
    faultLog: '[SOMNIA:HARD] FILTER LEAK — 空记录被写入重建结果，记忆出现噪点。',
    initialCode:
      'def filter_records(records):\n' +
      '    out = []\n' +
      '    for r in records:\n' +
      '        if r != "ok" or r == "":\n' +
      '            out.append(r)\n' +
      '    return out',
    hints: ['结果里出现了空字符串。条件之间的连接词写错了。', '“不是 ok”与“不是空”必须同时成立。', '把 or 改成 and，或者拆成两层 if。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '过滤空与 ok', expr: 'filter_records(["ok", "warn", "", "error"]) == ["warn", "error"]' },
        { name: '空列表', expr: 'filter_records([]) == []' },
        { name: '全 ok', expr: 'filter_records(["ok", "ok"]) == []' },
        { name: '单条警告保留', expr: 'filter_records(["warn"]) == ["warn"]' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'logic', 'compare', 'string', 'return'],
    baselineMask: 14,
    summary: '过滤条件要用 and 连接两个“都不是”；or 会把任意一条命中当成过滤依据。',
  },
  {
    id: 'som-h3',
    title: '合并许可',
    objective: '修复 can_merge：两段记忆都非空且内容不同才允许合并，返回 True/False。',
    faultLog: '[SOMNIA:HARD] MERGE GUARD — 内容相同也被允许合并，重复记忆被放大。',
    initialCode:
      'def can_merge(a, b):\n' +
      '    if a != "" and b != "":\n' +
      '        return True\n' +
      '    return False',
    hints: ['两段完全相同的内容不应该合并。', '在非空判断之外，还要比较两段内容是否不同。', '条件追加 a != b。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '不同内容可合并', expr: 'can_merge("a", "b") == True' },
        { name: '相同内容不可合并', expr: 'can_merge("a", "a") == False' },
        { name: '空内容不可合并', expr: 'can_merge("", "b") == False' },
        { name: '右侧空不可合并', expr: 'can_merge("b", "") == False' },
      ],
    },
    knowledge: ['if', 'logic', 'compare', 'string', 'return'],
    baselineMask: 13,
    summary: '多个前置条件要全部满足；相同内容的记忆合并只会制造重复。',
  },
  {
    id: 'som-h4',
    title: '记忆批次审计',
    objective: '修复 audit_batch：统计 error / warn / 其他 三类数量，返回 [error, warn, other]。',
    faultLog: '[SOMNIA:HARD] BATCH AUDIT — ok 与 warn 的计数被写反，审计结果失真。',
    initialCode:
      'def audit_batch(records):\n' +
      '    fail = 0\n' +
      '    warn = 0\n' +
      '    ok = 0\n' +
      '    for r in records:\n' +
      '        if r == "error":\n' +
      '            fail = fail + 1\n' +
      '        elif r == "ok":\n' +
      '            warn = warn + 1\n' +
      '        else:\n' +
      '            ok = ok + 1\n' +
      '    return [fail, warn, ok]',
    hints: ['审计里 warn 数量是 0，ok 数量却多了。看 elif 的条件和计数变量。', 'elif 应该匹配 warn，而不是 ok。', '把 elif r == "ok" 改成 elif r == "warn"。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '三类计数', expr: 'audit_batch(["error", "warn", "ok"]) == [1, 1, 1]' },
        { name: '空批次', expr: 'audit_batch([]) == [0, 0, 0]' },
        { name: '两条 warn', expr: 'audit_batch(["warn", "warn"]) == [0, 2, 0]' },
        { name: '混合批次', expr: 'audit_batch(["error", "ok", "ok"]) == [1, 0, 2]' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'elif', 'compare', 'string', 'return'],
    baselineMask: 3,
    summary: '多分支计数要让每个分支匹配正确的标签；错位会让两类统计同时偏移。',
  },
];

const SOMNIA_EXPERT: Phase[] = [
  {
    id: 'som-x1',
    title: '双列表记忆合并',
    objective: '修复 contains + merge_memories：按顺序合并两个列表并去重（保留首次出现顺序）。',
    faultLog: '[SOMNIA:EXPERT] MEMORY MERGE — 去重函数在第一个不相等元素就返回 True，合并结果丢失/重复。',
    initialCode:
      'def contains(values, target):\n' +
      '    for v in values:\n' +
      '        if v != target:\n' +
      '            return True\n' +
      '    return False\n\n' +
      'def merge_memories(a, b):\n' +
      '    out = []\n' +
      '    for x in a:\n' +
      '        if not contains(out, x):\n' +
      '            out.append(x)\n' +
      '    for x in b:\n' +
      '        if not contains(out, x):\n' +
      '            out.append(x)\n' +
      '    return out',
    hints: [
      '两个函数要分工：contains 判断“是否存在”，merge 负责按顺序加入。',
      'contains 只有在找到相等元素时才能返回 True；循环结束还没找到才是 False。',
      '把 contains 里的 if v != target 改成 if v == target。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '合并并去重', expr: 'merge_memories([1, 2, 2], [2, 3]) == [1, 2, 3]' },
        { name: '双空列表', expr: 'merge_memories([], []) == []' },
        { name: '字符串记忆', expr: 'merge_memories(["a"], ["a", "b"]) == ["a", "b"]' },
        { name: '保持首次出现顺序', expr: 'merge_memories([1], [2, 1]) == [1, 2]' },
      ],
    },
    knowledge: ['return', 'for', 'list', 'if', 'logic', 'compare'],
    baselineMask: 2,
    summary: '“是否存在”要遍历完整列表后才能下结论；提前返回会把无关元素误判为命中。',
  },
  {
    id: 'som-x2',
    title: '连续损坏检测',
    objective: '修复 verify_chain：不允许出现连续两个 "bad"，其余情况视为可恢复。',
    faultLog: '[SOMNIA:EXPERT] CHAIN CHECK — 连续损坏判断取反，单次损坏被误判为致命。',
    initialCode:
      'def verify_chain(flags):\n' +
      '    prev = ""\n' +
      '    for f in flags:\n' +
      '        if f == "bad":\n' +
      '            if prev != "bad":\n' +
      '                return False\n' +
      '        prev = f\n' +
      '    return True',
    hints: ['单个 bad 不应该让整条记忆链失败；只有连续两个才致命。', '检查 prev 时应判断“上一个也是 bad”。', '把 if prev != "bad" 改成 if prev == "bad"。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '单个损坏可恢复', expr: 'verify_chain(["ok", "bad", "ok"]) == True' },
        { name: '连续损坏致命', expr: 'verify_chain(["bad", "bad"]) == False' },
        { name: '空链', expr: 'verify_chain([]) == True' },
        { name: '两次不连续损坏', expr: 'verify_chain(["bad", "ok", "bad"]) == True' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'logic', 'compare', 'string', 'return'],
    baselineMask: 6,
    summary: '连续性问题需要保存前一个状态，并在“当前 + 前一个”同时成立时才判失败。',
  },
  {
    id: 'som-x3',
    title: '多重守护条件',
    objective: '修复 guard_multi：critical 时 temp>80 或 pressure>120 才 CRITICAL，否则 WATCH；非 critical 时 temp>90 或 pressure>150 为 OVERLOAD，否则 SAFE。',
    faultLog: '[SOMNIA:EXPERT] GUARD PRECEDENCE — and/or 优先级写错，critical 场景被误判为 SAFE/WATCH。',
    initialCode:
      'def guard_multi(temp, pressure, critical):\n' +
      '    if critical and temp > 80 or pressure > 120:\n' +
      '        return "CRITICAL"\n' +
      '    if temp > 90 or pressure > 150:\n' +
      '        return "OVERLOAD"\n' +
      '    return "SAFE"',
    hints: [
      'critical 为 True 时只可能得到 CRITICAL 或 WATCH；现在会掉到 OVERLOAD/SAFE。',
      '先处理 critical 分支，再在分支内部判断温度/压力；非 critical 才检查过载。',
      '用嵌套 if：if critical: ... else: ...，避免 and/or 优先级混淆。',
    ],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: 'critical + 超限 → CRITICAL', expr: 'guard_multi(90, 100, True) == "CRITICAL"' },
        { name: 'critical + 未超限 → WATCH', expr: 'guard_multi(70, 100, True) == "WATCH"' },
        { name: '非 critical + 超限 → OVERLOAD', expr: 'guard_multi(95, 100, False) == "OVERLOAD"' },
        { name: '非 critical + 正常 → SAFE', expr: 'guard_multi(70, 100, False) == "SAFE"' },
      ],
    },
    knowledge: ['if', 'logic', 'compare', 'return'],
    baselineMask: 13,
    summary: 'and 的优先级高于 or；复杂条件优先用嵌套分支表达，避免“看起来对、执行顺序错”。',
  },
  {
    id: 'som-x4',
    title: '异常记忆归档',
    objective: '修复 audit_records：返回 [ok数量, warn数量, 其他标签列表]。',
    faultLog: '[SOMNIA:EXPERT] ARCHIVE AUDIT — warn 被计入 ok，坏标签列表缺失。',
    initialCode:
      'def audit_records(records):\n' +
      '    ok = 0\n' +
      '    warn = 0\n' +
      '    bad = []\n' +
      '    for r in records:\n' +
      '        if r == "ok":\n' +
      '            ok = ok + 1\n' +
      '        elif r == "warn":\n' +
      '            ok = ok + 1\n' +
      '        else:\n' +
      '            bad.append(r)\n' +
      '    return [ok, warn, bad]',
    hints: ['ok 数量比实际多，warn 数量始终为 0。', 'elif 分支的计数变量写错了。', '把 elif 里的 ok = ok + 1 改成 warn = warn + 1。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '三类归档', expr: 'audit_records(["ok", "warn", "error"]) == [1, 1, ["error"]]' },
        { name: '空档案', expr: 'audit_records([]) == [0, 0, []]' },
        { name: '坏标签列表', expr: 'audit_records(["error", "error"]) == [0, 0, ["error", "error"]]' },
        { name: '只有 ok', expr: 'audit_records(["ok"]) == [1, 0, []]' },
      ],
    },
    knowledge: ['for', 'list', 'if', 'elif', 'compare', 'string', 'return'],
    baselineMask: 14,
    summary: '返回元组时要让每个分支只更新自己的统计量；错位会同时污染两类结果。',
  },
];

// ---------- INDEX-0 数据索引吞噬者（第三章） ----------
const INDEX0_HARD: Phase[] = [
  {
    id: 'idx-h1',
    title: '最后一次索引',
    objective: '修复 find_last：返回 name 在 names 中最后一次出现的下标；找不到返回 -1。',
    faultLog: '[INDEX-0:HARD] LAST INDEX — 找到第一个就返回，重复档案的最终位置被丢失。',
    initialCode:
      'def find_last(name, names):\n' +
      '    for i in range(len(names)):\n' +
      '        if names[i] == name:\n' +
      '            return i\n' +
      '    return -1',
    hints: ['重复名字只返回了第一次出现的位置。', '不要在找到时立刻返回，先记录下标继续往后找。', '用 last = -1 记录，循环结束再 return last。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '返回最后一次下标', expr: 'find_last("a", ["a", "b", "a"]) == 2' },
        { name: '找不到返回 -1', expr: 'find_last("z", ["a"]) == -1' },
        { name: '单次出现', expr: 'find_last("b", ["a", "b"]) == 1' },
        { name: '空列表', expr: 'find_last("a", []) == -1' },
      ],
    },
    knowledge: ['list', 'for', 'len', 'if', 'compare', 'return', 'variable'],
    baselineMask: 14,
    summary: '“最后一次”要在循环中持续覆盖答案，不能在第一次命中时提前结束。',
  },
  {
    id: 'idx-h2',
    title: '重复与缺失清理',
    objective: '修复 dedupe：按顺序去重，并丢弃 -1 缺失标记。',
    faultLog: '[INDEX-0:HARD] DUPLICATE LEAK — 重复编号被写回索引，去重逻辑缺失。',
    initialCode:
      'def dedupe(ids):\n' +
      '    out = []\n' +
      '    i = 0\n' +
      '    while i < len(ids):\n' +
      '        x = ids[i]\n' +
      '        if x != -1:\n' +
      '            out.append(x)\n' +
      '        i = i + 1\n' +
      '    return out',
    hints: ['-1 已经被正确丢弃了，但重复编号还在。', '在加入前检查 out 里是否已经有这个值。', '追加一层 if x not in out: 再 append。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '去重并丢弃 -1', expr: 'dedupe([3, 3, -1, 5]) == [3, 5]' },
        { name: '全是缺失标记', expr: 'dedupe([-1]) == []' },
        { name: '空列表', expr: 'dedupe([]) == []' },
        { name: '无重复', expr: 'dedupe([1, 2, 3]) == [1, 2, 3]' },
      ],
    },
    knowledge: ['list', 'while', 'len', 'if', 'logic', 'compare', 'return'],
    baselineMask: 14,
    summary: '去重要同时处理“重复”和“缺失”两种脏数据，并保持原有顺序。',
  },
  {
    id: 'idx-h3',
    title: '分页读取',
    objective: '修复 take_chunk：返回前 size 个元素；size<=0 返回空列表；size 超长时返回全部元素。',
    faultLog: '[INDEX-0:HARD] CHUNK SIZE — 分页边界计算错误，读取数量与空列表处理同时出错。',
    initialCode:
      'def take_chunk(items, size):\n' +
      '    if size > len(items):\n' +
      '        return []\n' +
      '    if size <= 0:\n' +
      '        size = 1\n' +
      '    out = []\n' +
      '    i = 0\n' +
      '    while i <= size:\n' +
      '        out.append(items[i])\n' +
      '        i = i + 1\n' +
      '    return out',
    hints: ['分页读多了：size=2 时返回了 3 个。while 的边界看错了。', 'size 超过长度时应读取全部，而不是返回空；size<=0 应返回空。', '把 > 改成 > 时返回 items 的副本；size<=0 直接 return []；while 用 i < size。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '读取前 2 个', expr: 'take_chunk([1, 2, 3], 2) == [1, 2]' },
        { name: '超长返回全部', expr: 'take_chunk([1, 2], 5) == [1, 2]' },
        { name: 'size 为 0 返回空', expr: 'take_chunk([1, 2], 0) == []' },
        { name: '空列表', expr: 'take_chunk([], 3) == []' },
      ],
    },
    knowledge: ['list', 'while', 'len', 'if', 'compare', 'return', 'variable'],
    baselineMask: 8,
    summary: '分页边界要同时考虑 size<=0、size>len 和正常区间；while 用严格小于避免越界。',
  },
  {
    id: 'idx-h4',
    title: '缺失编号统计',
    objective: '修复 count_missing：统计 rows 中编号 <= 0 的脏记录数量（rows 每条为 [编号, 名字]）。',
    faultLog: '[INDEX-0:HARD] MISSING COUNT — 条件方向反了，有效编号被统计为缺失。',
    initialCode:
      'def count_missing(rows):\n' +
      '    bad = 0\n' +
      '    for row in rows:\n' +
      '        if row[0] > 0:\n' +
      '            bad = bad + 1\n' +
      '    return bad',
    hints: ['统计结果正好相反：有效记录被当成缺失。', '“缺失”是编号小于等于 0。', '把 > 0 改成 <= 0。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '混合编号', expr: 'count_missing([[1, "a"], [0, "b"], [-2, "c"]]) == 2' },
        { name: '空表', expr: 'count_missing([]) == 0' },
        { name: '全部有效', expr: 'count_missing([[5, "e"]]) == 0' },
        { name: '编号 0', expr: 'count_missing([[0, "x"]]) == 1' },
      ],
    },
    knowledge: ['list', 'for', 'if', 'compare', 'return', 'variable'],
    baselineMask: 2,
    summary: '统计前先确认“什么算脏数据”；条件方向写反会让结果完全颠倒。',
  },
];

const INDEX0_EXPERT: Phase[] = [
  {
    id: 'idx-x1',
    title: '有序索引合并',
    objective: '修复 merge_sorted：合并两个升序列表，返回新的升序列表（不要丢尾部元素）。',
    faultLog: '[INDEX-0:EXPERT] SORTED MERGE — 双指针比较方向反了，循环结束后尾部数据被丢弃。',
    initialCode:
      'def merge_sorted(a, b):\n' +
      '    out = []\n' +
      '    i = 0\n' +
      '    j = 0\n' +
      '    while i < len(a) and j < len(b):\n' +
      '        if a[i] > b[j]:\n' +
      '            out.append(a[i])\n' +
      '            i = i + 1\n' +
      '        else:\n' +
      '            out.append(b[j])\n' +
      '            j = j + 1\n' +
      '    return out',
    hints: ['合并结果只包含一部分元素：一个列表先走完后，另一个列表的剩余部分没有处理。', '双指针比较时，较小的元素先进入结果。', '把 a[i] > b[j] 改成 <=，并在主循环后补两个 while 处理剩余元素。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '交错合并', expr: 'merge_sorted([1, 3], [2, 4]) == [1, 2, 3, 4]' },
        { name: '左空', expr: 'merge_sorted([], [1, 2]) == [1, 2]' },
        { name: '重复值', expr: 'merge_sorted([1, 1], [1]) == [1, 1, 1]' },
        { name: '右侧剩余', expr: 'merge_sorted([5], [1, 2, 6]) == [1, 2, 5, 6]' },
      ],
    },
    knowledge: ['list', 'while', 'len', 'if', 'compare', 'logic', 'return'],
    baselineMask: 0,
    summary: '双指针合并要处理三种情况：两侧都有、左侧剩余、右侧剩余。',
  },
  {
    id: 'idx-x2',
    title: '索引循环移位',
    objective: '修复 rotate_left：把列表左移 k 位（k 可以大于等于长度；空列表返回空）。',
    faultLog: '[INDEX-0:EXPERT] ROTATE INDEX — 取模逻辑缺失且循环边界越界，移位结果错误/崩溃。',
    initialCode:
      'def rotate_left(items, k):\n' +
      '    n = len(items)\n' +
      '    if n == 0:\n' +
      '        return []\n' +
      '    while k > n:\n' +
      '        k = k - n\n' +
      '    out = []\n' +
      '    i = k\n' +
      '    while i <= n:\n' +
      '        out.append(items[i])\n' +
      '        i = i + 1\n' +
      '    i = 0\n' +
      '    while i < k:\n' +
      '        out.append(items[i])\n' +
      '        i = i + 1\n' +
      '    return out',
    hints: ['k 等于长度时不需要移位；大于长度要先把 k 降到范围内。', '第一段循环要访问下标 k 到 n-1，不能访问 items[n]。', '把 while k > n 改成 >=，第二段 while 用 i < n。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '左移 1 位', expr: 'rotate_left([1, 2, 3], 1) == [2, 3, 1]' },
        { name: 'k 超过长度', expr: 'rotate_left([1, 2], 4) == [1, 2]' },
        { name: '空列表', expr: 'rotate_left([], 3) == []' },
        { name: 'k 为 0', expr: 'rotate_left([1, 2, 3], 0) == [1, 2, 3]' },
      ],
    },
    knowledge: ['list', 'while', 'len', 'if', 'compare', 'return', 'variable'],
    baselineMask: 0,
    summary: '循环移位要先归一化 k，再把列表分成两段依次拷贝；下标上界是 n-1。',
  },
  {
    id: 'idx-x3',
    title: '缺失档案检索',
    objective: '修复 missing_items：返回 wanted 中不存在于 stock 的元素（保持 wanted 顺序）。',
    faultLog: '[INDEX-0:EXPERT] MISSING LOOKUP — found 判断取反，返回了已存在的元素。',
    initialCode:
      'def missing_items(stock, wanted):\n' +
      '    missing = []\n' +
      '    for w in wanted:\n' +
      '        found = False\n' +
      '        for s in stock:\n' +
      '            if s == w:\n' +
      '                found = True\n' +
      '        if found:\n' +
      '            missing.append(w)\n' +
      '    return missing',
    hints: ['返回结果里全是库存已有的元素。', '内层循环结束后 found 为 True 表示“存在”，不表示“缺失”。', '把 if found 改成 if not found。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '缺失项', expr: 'missing_items(["a", "b"], ["a", "c"]) == ["c"]' },
        { name: '库存为空', expr: 'missing_items([], ["x"]) == ["x"]' },
        { name: '全部存在', expr: 'missing_items(["a"], ["a"]) == []' },
        { name: '需求为空', expr: 'missing_items(["a", "b"], []) == []' },
      ],
    },
    knowledge: ['list', 'for', 'if', 'logic', 'compare', 'return', 'variable'],
    baselineMask: 8,
    summary: '嵌套查找要用 found 标记“是否命中”，返回缺失项时判断的是 not found。',
  },
  {
    id: 'idx-x4',
    title: '连续档案压缩',
    objective: '修复 compress：把连续相同值压缩成 [值, 次数, 值, 次数, ...]；空列表返回空列表。',
    faultLog: '[INDEX-0:EXPERT] RUN COMPRESS — 最后一段连续值没有被写入，压缩结果缺尾。',
    initialCode:
      'def compress(values):\n' +
      '    out = []\n' +
      '    if len(values) == 0:\n' +
      '        return out\n' +
      '    cur = values[0]\n' +
      '    count = 1\n' +
      '    i = 1\n' +
      '    while i < len(values):\n' +
      '        if values[i] == cur:\n' +
      '            count = count + 1\n' +
      '        else:\n' +
      '            out.append(cur)\n' +
      '            out.append(count)\n' +
      '            cur = values[i]\n' +
      '            count = 1\n' +
      '        i = i + 1\n' +
      '    return out',
    hints: ['最后一段连续值没有出现在结果里。', '循环结束后还有一段 cur/count 没有写入。', '在 return 前补 out.append(cur) 与 out.append(count)。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '多段压缩', expr: 'compress([1, 1, 2, 3, 3, 3]) == [1, 2, 2, 1, 3, 3]' },
        { name: '空列表', expr: 'compress([]) == []' },
        { name: '单元素', expr: 'compress([5]) == [5, 1]' },
        { name: '首尾同值', expr: 'compress([1, 2, 1]) == [1, 1, 2, 1, 1, 1]' },
      ],
    },
    knowledge: ['list', 'while', 'len', 'if', 'compare', 'return', 'variable'],
    baselineMask: 2,
    summary: '游程压缩要在循环结束后收尾最后一段，否则尾部数据会静默丢失。',
  },
];

// ---------- JUDGMENT-4 裁决执行体（第四章） ----------
const JUDGMENT4_HARD: Phase[] = [
  {
    id: 'jd-h1',
    title: '有效评分汇总',
    objective: '修复 total_score：只累加大于 0 的分数，忽略 0 与负数。',
    faultLog: '[JUDGMENT-4:HARD] SCORE SUM — 负分被计入总分，裁决结果被污染。',
    initialCode:
      'def total_score(scores):\n' +
      '    total = 0\n' +
      '    for s in scores:\n' +
      '        total = total + s\n' +
      '    return total',
    hints: ['总分比预期低：负数被减掉了。', '只处理有效分数，零和负数都要跳过。', '在累加前加 if s > 0。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '忽略负分', expr: 'total_score([10, -5, 20]) == 30' },
        { name: '空列表', expr: 'total_score([]) == 0' },
        { name: '全负分', expr: 'total_score([-1, -2]) == 0' },
        { name: '零分不参与', expr: 'total_score([0, 5]) == 5' },
      ],
    },
    knowledge: ['parameter', 'return', 'for', 'list', 'if', 'compare'],
    baselineMask: 10,
    summary: '汇总前先定义“有效数据”，否则脏数据会以负数/零的形式混入结果。',
  },
  {
    id: 'jd-h2',
    title: '加分裁决',
    objective: '修复 verdict：最终分 = score + bonus；≥90 PASS，≥60 REVIEW，其余 REJECT。',
    faultLog: '[JUDGMENT-4:HARD] BONUS VERDICT — 使用了原始分而不是最终分，第二档门槛也写错。',
    initialCode:
      'def verdict(score, bonus):\n' +
      '    if score >= 90:\n' +
      '        return "PASS"\n' +
      '    if score >= 70:\n' +
      '        return "REVIEW"\n' +
      '    return "REJECT"',
    hints: ['bonus 完全没参与判断；第二档门槛也不是 60。', '先计算最终分，再按 90 / 60 两档判断。', 'final = score + bonus；两个 if 都用 final。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '加分进入 PASS', expr: 'verdict(80, 10) == "PASS"' },
        { name: '加分进入 REVIEW', expr: 'verdict(55, 5) == "REVIEW"' },
        { name: '低分 REJECT', expr: 'verdict(50, 0) == "REJECT"' },
        { name: '减分后 REVIEW', expr: 'verdict(90, -30) == "REVIEW"' },
      ],
    },
    knowledge: ['parameter', 'return', 'if', 'compare', 'variable'],
    baselineMask: 4,
    summary: '多参数函数要先完成数据变换（加分），再做分支判断；门槛与顺序同样重要。',
  },
  {
    id: 'jd-h3',
    title: '档案标签',
    objective: '修复 make_label：name 为空用 "UNKNOWN"，code 为空用 "N/A"，返回 "name:code"。',
    faultLog: '[JUDGMENT-4:HARD] LABEL FALLBACK — 空参数没有兜底，标签出现空字段。',
    initialCode:
      'def make_label(name, code):\n' +
      '    return name + ":" + code',
    hints: ['空参数会直接拼进结果，需要先做兜底替换。', '分别检查两个参数是否为空字符串。', '用 if 把 name 改成 UNKNOWN、code 改成 N/A，再拼接。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '正常标签', expr: 'make_label("a", "b") == "a:b"' },
        { name: '空 name 兜底', expr: 'make_label("", "b") == "UNKNOWN:b"' },
        { name: '空 code 兜底', expr: 'make_label("a", "") == "a:N/A"' },
        { name: '双空兜底', expr: 'make_label("", "") == "UNKNOWN:N/A"' },
      ],
    },
    knowledge: ['parameter', 'return', 'if', 'compare', 'string', 'variable'],
    baselineMask: 1,
    summary: '输出拼接前先处理空值；兜底值要分别对应不同参数。',
  },
  {
    id: 'jd-h4',
    title: '区间裁决',
    objective: '修复 limit_values：保留 low <= v <= high 的所有值（含边界），返回新列表。',
    faultLog: '[JUDGMENT-4:HARD] RANGE FILTER — 两侧条件用 or 连接，所有值都被放行。',
    initialCode:
      'def limit_values(values, low, high):\n' +
      '    out = []\n' +
      '    for v in values:\n' +
      '        if v >= low or v <= high:\n' +
      '            out.append(v)\n' +
      '    return out',
    hints: ['所有值都被保留了：区间条件没有起到过滤作用。', '值必须同时满足下界与上界。', '把 or 改成 and。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '只保留区间内', expr: 'limit_values([1, 5, 10], 3, 8) == [5]' },
        { name: '空列表', expr: 'limit_values([], 0, 0) == []' },
        { name: '边界包含', expr: 'limit_values([0, 0], 0, 0) == [0, 0]' },
        { name: '高于上界', expr: 'limit_values([9], 0, 8) == []' },
      ],
    },
    knowledge: ['parameter', 'return', 'for', 'list', 'if', 'logic', 'compare'],
    baselineMask: 6,
    summary: '区间过滤必须两侧同时成立；or 会让边界条件失效。',
  },
];

const JUDGMENT4_EXPERT: Phase[] = [
  {
    id: 'jd-x1',
    title: '数值标准化流水线',
    objective: '修复 normalize + apply_all：把小于 0 的值变为 0、大于 100 的值变为 100，其余保持不变；apply_all 返回每个元素标准化后的新列表。',
    faultLog: '[JUDGMENT-4:EXPERT] NORMALIZE PIPELINE — 单值标准化没有实现，批量函数还额外加了 1。',
    initialCode:
      'def normalize(value):\n' +
      '    return value\n\n' +
      'def apply_all(values):\n' +
      '    out = []\n' +
      '    for v in values:\n' +
      '        out.append(normalize(v) + 1)\n' +
      '    return out',
    hints: ['normalize 目前什么都没做；apply_all 还擅自加 1。', '标准化要处理下界 0 与上界 100 两种情况。', 'normalize 用两个 if 返回边界值；apply_all 直接 append normalize(v)。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '批量标准化', expr: 'apply_all([-5, 50, 150]) == [0, 50, 100]' },
        { name: '空列表', expr: 'apply_all([]) == []' },
        { name: '边界值不变', expr: 'apply_all([0, 100]) == [0, 100]' },
        { name: '两侧越界', expr: 'apply_all([101, -1]) == [100, 0]' },
      ],
    },
    knowledge: ['parameter', 'return', 'for', 'list', 'if', 'compare'],
    baselineMask: 2,
    summary: '多函数协作要保证每个函数只做自己的事：标准化与批量遍历分离。',
  },
  {
    id: 'jd-x2',
    title: '工单审计',
    objective: '修复 audit_orders：orders 每条为 [编号, 数量]；返回 (有效数量总和, 无效数量条数)，数量 <= 0 视为无效。',
    faultLog: '[JUDGMENT-4:EXPERT] ORDER AUDIT — 有效/无效分支互换，负数被累加。',
    initialCode:
      'def audit_orders(orders):\n' +
      '    ok_total = 0\n' +
      '    bad = 0\n' +
      '    for row in orders:\n' +
      '        amount = row[1]\n' +
      '        if amount > 0:\n' +
      '            bad = bad + 1\n' +
      '        else:\n' +
      '            ok_total = ok_total + amount\n' +
      '    return ok_total, bad',
    hints: ['有效数量与无效条数的统计正好反了。', '正数才累加，非正数只计条数。', '交换两个分支里的语句。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '有效与无效统计', expr: 'audit_orders([[1, 10], [2, -5], [3, 20]]) == (30, 1)' },
        { name: '空工单', expr: 'audit_orders([]) == (0, 0)' },
        { name: '数量 0 无效', expr: 'audit_orders([[1, 0]]) == (0, 1)' },
        { name: '全部有效', expr: 'audit_orders([[1, 5]]) == (5, 0)' },
      ],
    },
    knowledge: ['parameter', 'return', 'for', 'list', 'if', 'compare', 'variable'],
    baselineMask: 2,
    summary: '统计前先明确“有效”的定义；分支互换会让总和与条数同时出错。',
  },
  {
    id: 'jd-x3',
    title: '清洗汇总流水线',
    objective: '修复 clean + pipeline：clean 只保留 0 <= v <= limit 的值；pipeline 返回 (有效数量, 有效总和)。',
    faultLog: '[JUDGMENT-4:EXPERT] CLEAN PIPELINE — 清洗用 or 放行全部数据，汇总又遍历原始列表。',
    initialCode:
      'def clean(values, limit):\n' +
      '    out = []\n' +
      '    for v in values:\n' +
      '        if v >= 0 or v <= limit:\n' +
      '            out.append(v)\n' +
      '    return out\n\n' +
      'def pipeline(raw, limit):\n' +
      '    data = clean(raw, limit)\n' +
      '    total = 0\n' +
      '    for v in raw:\n' +
      '        total = total + v\n' +
      '    return len(data), total',
    hints: ['清洗没有过滤任何值；汇总也没有使用清洗后的数据。', '范围条件要两侧同时成立；汇总遍历 data。', 'or 改 and；第二个循环改成 for v in data。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '清洗后汇总', expr: 'pipeline([1, 200, -1, 3], 100) == (2, 4)' },
        { name: '空输入', expr: 'pipeline([], 10) == (0, 0)' },
        { name: '边界包含', expr: 'pipeline([5], 5) == (1, 5)' },
        { name: '越界剔除', expr: 'pipeline([101], 100) == (0, 0)' },
      ],
    },
    knowledge: ['parameter', 'return', 'for', 'list', 'if', 'logic', 'len'],
    baselineMask: 6,
    summary: '流水线的每一段都要把上一段的输出当作输入；清洗条件错会让后续全部失效。',
  },
  {
    id: 'jd-x4',
    title: '多级闸门校验',
    objective: '修复 count_ok + gate_check：count_ok 返回 >=1 的元素数量；gate_check 判断数量是否 >= min_ok。',
    faultLog: '[JUDGMENT-4:EXPERT] GATE AGGREGATE — count_ok 返回布尔值，比较符也从 >= 变成了 >。',
    initialCode:
      'def count_ok(levels):\n' +
      '    count = 0\n' +
      '    for x in levels:\n' +
      '        if x >= 1:\n' +
      '            count = count + 1\n' +
      '    return count > 0\n\n' +
      'def gate_check(levels, min_ok):\n' +
      '    if count_ok(levels) > min_ok:\n' +
      '        return True\n' +
      '    return False',
    hints: ['count_ok 应该返回数量，不是 True/False。', 'gate_check 的“达到 min_ok”包含等于。', 'return count；比较用 >=。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '达到门槛', expr: 'gate_check([1, 0, 2], 2) == True' },
        { name: '未达门槛', expr: 'gate_check([1, 0], 2) == False' },
        { name: '空列表 + 门槛 0', expr: 'gate_check([], 0) == True' },
        { name: '全不合格 + 门槛 0', expr: 'gate_check([0], 0) == True' },
      ],
    },
    knowledge: ['parameter', 'return', 'for', 'list', 'if', 'compare'],
    baselineMask: 2,
    summary: '函数返回值要符合调用方的预期（数量 vs 布尔）；边界“等于门槛”要算通过。',
  },
];

// ---------- ENTROPY 熵潮核心（第五章） ----------
const ENTROPY_HARD: Phase[] = [
  {
    id: 'en-h1',
    title: '安全批量取值',
    objective: '修复 collect：按 keys 顺序从 table 取值，缺失键返回 0，返回列表。',
    faultLog: '[ENTROPY:HARD] BATCH READ — 缺失键直接下标取值，索引整体崩溃。',
    initialCode:
      'def collect(table, keys):\n' +
      '    out = []\n' +
      '    for k in keys:\n' +
      '        out.append(table[k])\n' +
      '    return out',
    hints: ['键不存在时程序直接崩溃。', '字典要用 get 提供默认值。', '把 table[k] 改成 table.get(k, 0)。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '缺失键补 0', expr: 'collect({1: 10}, [1, 2]) == [10, 0]' },
        { name: '空字典', expr: 'collect({}, [1]) == [0]' },
        { name: '空键列表', expr: 'collect({1: 10}, []) == []' },
        { name: '重复键', expr: 'collect({1: 10}, [1, 1]) == [10, 10]' },
      ],
    },
    knowledge: ['dict', 'for', 'list', 'parameter', 'return'],
    baselineMask: 0,
    summary: '批量读取字典要用 get 兜底；缺失键不应该让整个流程崩溃。',
  },
  {
    id: 'en-h2',
    title: '记录合法性统计',
    objective: '修复 count_valid：统计 records 中可转整数的数量与不可转的数量，返回 (good, bad)。',
    faultLog: '[ENTROPY:HARD] VALID COUNT — 非数字记录抛出异常，统计中断。',
    initialCode:
      'def count_valid(records):\n' +
      '    good = 0\n' +
      '    bad = 0\n' +
      '    for k in records:\n' +
      '        int(records[k])\n' +
      '        good = good + 1\n' +
      '    return good, bad',
    hints: ['遇到 "x" 这类记录时程序直接崩溃。', '转换可能失败，要用 try / except 包住单条记录。', 'try 里 int 后 good+1；except ValueError 里 bad+1。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '混合记录', expr: 'count_valid({"a": "1", "b": "x"}) == (1, 1)' },
        { name: '空字典', expr: 'count_valid({}) == (0, 0)' },
        { name: '负数字符串合法', expr: 'count_valid({"a": "-3"}) == (1, 0)' },
        { name: '空字符串非法', expr: 'count_valid({"a": "", "b": "2"}) == (1, 1)' },
      ],
    },
    knowledge: ['dict', 'for', 'try', 'parameter', 'return'],
    baselineMask: 0,
    summary: '逐条隔离异常，单条坏记录不能中断整批统计。',
  },
  {
    id: 'en-h3',
    title: '污染值求和',
    objective: '修复 sum_valid：累加 records 中可转整数的值，非法记录跳过。',
    faultLog: '[ENTROPY:HARD] SUM VALID — 无法转换的记录让求和流程中断。',
    initialCode:
      'def sum_valid(records):\n' +
      '    total = 0\n' +
      '    for k in records:\n' +
      '        total = total + int(records[k])\n' +
      '    return total',
    hints: ['遇到 "x" 时整个求和崩溃。', '把单条记录的转换与累加放进 try。', 'except ValueError 时直接继续下一条。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '跳过非法值求和', expr: 'sum_valid({"a": "1", "b": "x", "c": "2"}) == 3' },
        { name: '空字典', expr: 'sum_valid({}) == 0' },
        { name: '全非法', expr: 'sum_valid({"a": "x"}) == 0' },
        { name: '负数参与', expr: 'sum_valid({"a": "-1", "b": "5"}) == 4' },
      ],
    },
    knowledge: ['dict', 'for', 'try', 'return', 'variable'],
    baselineMask: 0,
    summary: '异常处理的位置要精确到“单条记录”，而不是包住整段循环。',
  },
  {
    id: 'en-h4',
    title: '缺失键审计',
    objective: '修复 has_all：返回 keys 中在 table 里不存在的键列表（按输入顺序）。',
    faultLog: '[ENTROPY:HARD] MISSING KEYS — 用空字符串作为占位，值本身为 0 时被误判为缺失。',
    initialCode:
      'def has_all(table, keys):\n' +
      '    missing = []\n' +
      '    for k in keys:\n' +
      '        if table.get(k, "") == "":\n' +
      '            missing.append(k)\n' +
      '    return missing',
    hints: ['值为 0 的键也被当成缺失了。', '占位值不能和真实值混淆，换一个不会出现的标记。', '用 table.get(k, "MISSING") 判断。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '缺失键列表', expr: 'has_all({1: 10}, [1, 2]) == [2]' },
        { name: '空键列表', expr: 'has_all({}, []) == []' },
        { name: '零值不算缺失', expr: 'has_all({1: 0}, [1]) == []' },
        { name: '多个缺失', expr: 'has_all({}, [3, 4]) == [3, 4]' },
        { name: '空字符串值不算缺失', expr: 'has_all({1: ""}, [1]) == []' },
      ],
    },
    knowledge: ['dict', 'for', 'list', 'if', 'compare', 'return'],
    baselineMask: 15,
    summary: '默认占位值必须与合法数据可区分；0 和空字符串都是真实数据。',
  },
];

const ENTROPY_EXPERT: Phase[] = [
  {
    id: 'en-x1',
    title: '双表合并',
    objective: '修复 merge_tables：合并两个字典，同一个键的值相加，返回新字典。',
    faultLog: '[ENTROPY:EXPERT] TABLE MERGE — 同键被后者覆盖，累计数据丢失。',
    initialCode:
      'def merge_tables(a, b):\n' +
      '    out = dict(a)\n' +
      '    for k in b:\n' +
      '        out[k] = b[k]\n' +
      '    return out',
    hints: ['同一个键的值没有相加，而是被覆盖了。', '先判断键是否已经在结果里。', 'if k in out: out[k] = out[k] + b[k]，否则直接写入。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '同键相加', expr: 'merge_tables({"a": 1}, {"a": 2, "b": 3}) == {"a": 3, "b": 3}' },
        { name: '双空字典', expr: 'merge_tables({}, {}) == {}' },
        { name: '正负抵消', expr: 'merge_tables({"x": 5}, {"x": -5}) == {"x": 0}' },
        { name: '新键合入', expr: 'len(merge_tables({"a": 1}, {"b": 2})) == 2' },
      ],
    },
    knowledge: ['dict', 'for', 'if', 'compare', 'return'],
    baselineMask: 10,
    summary: '合并策略要先明确“同键如何处理”；覆盖与累加是两种完全不同的语义。',
  },
  {
    id: 'en-x2',
    title: '账本修复',
    objective: '修复 repair_ledger：rows 每条为 [键, 原始值]；按键盘累加可转整数的值，非法记录跳过。',
    faultLog: '[ENTROPY:EXPERT] LEDGER REPAIR — 单条非法值让整本账崩溃，且没有按键盘累加。',
    initialCode:
      'def repair_ledger(rows):\n' +
      '    out = {}\n' +
      '    for row in rows:\n' +
      '        k = row[0]\n' +
      '        v = int(row[1])\n' +
      '        if k in out:\n' +
      '            out[k] = out[k] + v\n' +
      '        else:\n' +
      '            out[k] = v\n' +
      '    return out',
    hints: ['遇到 "x" 时整个账本崩溃。', '单条记录的转换要放进 try。', 'try 里转换并累加；except ValueError 时 continue。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '累加并跳过非法', expr: 'repair_ledger([["a", "1"], ["a", "2"], ["b", "x"], ["c", "3"]]) == {"a": 3, "c": 3}' },
        { name: '空行', expr: 'repair_ledger([]) == {}' },
        { name: '全非法', expr: 'repair_ledger([["a", "x"]]) == {}' },
        { name: '正负抵消', expr: 'repair_ledger([["a", "-1"], ["a", "1"]]) == {"a": 0}' },
      ],
    },
    knowledge: ['dict', 'for', 'try', 'if', 'compare', 'return'],
    baselineMask: 0,
    summary: '按键盘聚合时要同时处理转换失败与同键累加，两个问题不能互相掩盖。',
  },
  {
    id: 'en-x3',
    title: '污染诊断',
    objective: '修复 diagnose：对 records（名 → 字符串值）逐条诊断，>80 输出 "名:HIGH"，<20 输出 "名:LOW"，其余 "名:OK"，非法值 "名:ERR"。',
    faultLog: '[ENTROPY:EXPERT] DIAGNOSE — 非法值直接崩溃，边界判断也写错。',
    initialCode:
      'def diagnose(records):\n' +
      '    out = []\n' +
      '    for name in records:\n' +
      '        value = records[name]\n' +
      '        n = int(value)\n' +
      '        if n > 80:\n' +
      '            out.append(name + ":HIGH")\n' +
      '        elif n < 20:\n' +
      '            out.append(name + ":LOW")\n' +
      '        else:\n' +
      '            out.append(name + ":OK")\n' +
      '    return out',
    hints: ['遇到无法转整数的值时程序崩溃。', '转换失败要单独输出 ERR，不能影响其他记录。', '用 try / except ValueError，except 里 append ":ERR" 并 continue。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '三类 + 非法', expr: 'sorted(diagnose({"a": "90", "b": "5", "c": "x"})) == ["a:HIGH", "b:LOW", "c:ERR"]' },
        { name: '空字典', expr: 'diagnose({}) == []' },
        { name: '中温区', expr: 'diagnose({"a": "50"}) == ["a:OK"]' },
        { name: '边界 20', expr: 'diagnose({"a": "20"}) == ["a:OK"]' },
      ],
    },
    knowledge: ['dict', 'for', 'try', 'if', 'elif', 'compare', 'string', 'return'],
    baselineMask: 0,
    summary: '逐条诊断要把异常隔离在单条记录内，再处理正常值的多档判断。',
  },
  {
    id: 'en-x4',
    title: '稳定求和',
    objective: '修复 stable_sum：对 keys 逐个从 records 取值并转整数累加；缺失键或非法值计入 missing，返回 (total, missing_count)。',
    faultLog: '[ENTROPY:EXPERT] STABLE SUM — 缺失键与非法值都没有被隔离，统计中断。',
    initialCode:
      'def stable_sum(records, keys):\n' +
      '    total = 0\n' +
      '    missing = 0\n' +
      '    for k in keys:\n' +
      '        value = records.get(k, "MISSING")\n' +
      '        if value == "MISSING":\n' +
      '            missing = missing + 1\n' +
      '        else:\n' +
      '            total = total + int(value)\n' +
      '    return total, missing',
    hints: ['值 "x" 无法转整数，会中断整个统计。', '缺失键与非法值都算 missing，但处理位置不同。', '在 else 分支里用 try / except ValueError 包住 int。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '缺失与非法', expr: 'stable_sum({"a": "2", "b": "x"}, ["a", "b", "c"]) == (2, 2)' },
        { name: '空键', expr: 'stable_sum({}, []) == (0, 0)' },
        { name: '正常值', expr: 'stable_sum({"a": "5"}, ["a"]) == (5, 0)' },
        { name: '负值', expr: 'stable_sum({"a": "-1"}, ["a"]) == (-1, 0)' },
      ],
    },
    knowledge: ['dict', 'for', 'try', 'if', 'compare', 'return'],
    baselineMask: 0,
    summary: '“缺失”和“非法”是两种坏数据，但都可以计入同一个容错指标；转换异常必须隔离。',
  },
];

// ---------- K-0 零号裁决者（第六章） ----------
const K0_HARD: Phase[] = [
  {
    id: 'k0-h1',
    title: '优先级配置合并',
    objective: '修复 merge_priority：合并两个字典，同一个键保留较大的值，返回新字典。',
    faultLog: '[K-0:HARD] PRIORITY MERGE — 后者无条件覆盖前者，较高优先级的配置被降级。',
    initialCode:
      'def merge_priority(a, b):\n' +
      '    out = dict(a)\n' +
      '    for k in b:\n' +
      '        out[k] = b[k]\n' +
      '    return out',
    hints: ['同键时后一个字典直接覆盖了前一个。', '同键应该保留较大的值。', '用 if k not in out or b[k] > out[k] 再赋值。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '后者更大', expr: 'merge_priority({"a": 1}, {"a": 5}) == {"a": 5}' },
        { name: '前者更大', expr: 'merge_priority({"a": 5}, {"a": 1}) == {"a": 5}' },
        { name: '新键合入', expr: 'merge_priority({}, {"b": 2}) == {"b": 2}' },
        { name: '多键保留', expr: 'len(merge_priority({"a": 1, "c": 3}, {"b": 2})) == 3' },
      ],
    },
    knowledge: ['dict', 'for', 'if', 'logic', 'compare', 'return'],
    baselineMask: 13,
    summary: '合并时的冲突策略必须显式：覆盖、取大、取小，各对应不同条件。',
  },
  {
    id: 'k0-h2',
    title: '严格递增校验',
    objective: '修复 is_ascending：判断列表是否严格递增；空列表和单元素返回 True。',
    faultLog: '[K-0:HARD] ASCENDING CHECK — 相等被当成递增，序列出现平台仍被判通过。',
    initialCode:
      'def is_ascending(values):\n' +
      '    i = 1\n' +
      '    while i < len(values):\n' +
      '        if values[i] < values[i - 1]:\n' +
      '            return False\n' +
      '        i = i + 1\n' +
      '    return True',
    hints: ['相等的情况没有被拒绝。', '严格递增要求后一个大于前一个。', '把 < 改成 <=。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '严格递增', expr: 'is_ascending([1, 2, 3]) == True' },
        { name: '相等不算递增', expr: 'is_ascending([1, 2, 2]) == False' },
        { name: '空列表', expr: 'is_ascending([]) == True' },
        { name: '下降', expr: 'is_ascending([5, 4]) == False' },
      ],
    },
    knowledge: ['list', 'while', 'len', 'if', 'compare', 'return'],
    baselineMask: 13,
    summary: '“递增”与“非递减”只差一个等号，却决定了平台数据是否合法。',
  },
  {
    id: 'k0-h3',
    title: '有效记录计分',
    objective: '修复 score_records：records 每条为 [标记, 分值]；只累加标记为 "ok" 的分值。',
    faultLog: '[K-0:HARD] SCORE FILTER — 标记判断写反，失效记录的分值被计入总分。',
    initialCode:
      'def score_records(records):\n' +
      '    total = 0\n' +
      '    for row in records:\n' +
      '        if row[0] == "bad":\n' +
      '            total = total + row[1]\n' +
      '    return total',
    hints: ['总分把 bad 记录加进去了。', '只有 "ok" 记录才计分。', '把 == "bad" 改成 == "ok"。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '只计 ok', expr: 'score_records([["ok", 3], ["bad", 9], ["ok", 2]]) == 5' },
        { name: '空列表', expr: 'score_records([]) == 0' },
        { name: '全 bad', expr: 'score_records([["bad", 4]]) == 0' },
        { name: '负数分值', expr: 'score_records([["ok", -1]]) == -1' },
      ],
    },
    knowledge: ['list', 'for', 'if', 'compare', 'string', 'return'],
    baselineMask: 2,
    summary: '计分前先确认标记筛选；条件写反会让无效数据产生有效分数。',
  },
  {
    id: 'k0-h4',
    title: '矩阵容错求和',
    objective: '修复 repair_matrix：rows 是二维字符串列表；累加所有可转整数的单元格，非法单元格跳过。',
    faultLog: '[K0:HARD] MATRIX SUM — 单个非法单元格让整个矩阵求和崩溃。',
    initialCode:
      'def repair_matrix(rows):\n' +
      '    total = 0\n' +
      '    for row in rows:\n' +
      '        for cell in row:\n' +
      '            total = total + int(cell)\n' +
      '    return total',
    hints: ['遇到无法转整数的单元格时整个求和崩溃。', '每个单元格单独隔离异常。', '在内层循环里 try 转换累加，except ValueError 时继续。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '跳过非法单元格', expr: 'repair_matrix([["1", "x"], ["2"]]) == 3' },
        { name: '空矩阵', expr: 'repair_matrix([]) == 0' },
        { name: '全非法', expr: 'repair_matrix([["x"]]) == 0' },
        { name: '负数参与', expr: 'repair_matrix([["-1", "2"]]) == 1' },
      ],
    },
    knowledge: ['list', 'for', 'try', 'return', 'variable'],
    baselineMask: 0,
    summary: '二维数据的容错要落到单元格级；一个坏值不应该让整张表归零。',
  },
];

const K0_EXPERT: Phase[] = [
  {
    id: 'k0-x1',
    title: '恢复流水线',
    objective: '修复 recover：entries 每条为 [键, 原始值]；按键盘累加可转整数的值，非法值计入 bad，返回 (字典, bad数量)。',
    faultLog: '[K0:EXPERT] RECOVERY — 单条非法值让整个恢复流程中断，bad 计数失效。',
    initialCode:
      'def recover(entries):\n' +
      '    table = {}\n' +
      '    bad = 0\n' +
      '    for entry in entries:\n' +
      '        key = entry[0]\n' +
      '        value = int(entry[1])\n' +
      '        if key in table:\n' +
      '            table[key] = table[key] + value\n' +
      '        else:\n' +
      '            table[key] = value\n' +
      '    return table, bad',
    hints: ['遇到 "x" 时整个恢复流程崩溃，bad 没有增加。', '单条记录的转换要放进 try。', 'try 里转换并累加；except ValueError 时 bad+1 并 continue。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '累加并统计非法', expr: 'recover([["a", "1"], ["a", "2"], ["b", "x"]]) == ({"a": 3}, 1)' },
        { name: '空输入', expr: 'recover([]) == ({}, 0)' },
        { name: '全非法', expr: 'recover([["a", "x"]]) == ({}, 1)' },
        { name: '负数累加', expr: 'recover([["a", "-1"], ["b", "2"]]) == ({"a": -1, "b": 2}, 0)' },
      ],
    },
    knowledge: ['dict', 'for', 'try', 'if', 'compare', 'return'],
    baselineMask: 0,
    summary: '数据恢复要同时做三件事：转换隔离、按键盘聚合、坏数据计数。',
  },
  {
    id: 'k0-x2',
    title: '安全配置合并',
    objective: '修复 merge_safe：合并两个字典；同键保留较大值，并把发生冲突的键按出现顺序放入列表，返回 (字典, 冲突列表)。',
    faultLog: '[K0:EXPERT] SAFE MERGE — 所有同键都被当作冲突，且较小值覆盖了较大值。',
    initialCode:
      'def merge_safe(a, b):\n' +
      '    out = dict(a)\n' +
      '    conflicts = []\n' +
      '    for k in b:\n' +
      '        if k in out:\n' +
      '            conflicts.append(k)\n' +
      '        out[k] = b[k]\n' +
      '    return out, conflicts',
    hints: ['值相同不应该算冲突；取大逻辑也缺失。', '同键时先比较值是否不同，再决定是否记录冲突。', '同键内：if b[k] != out[k] 记冲突；if b[k] > out[k] 才覆盖。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '冲突取大', expr: 'merge_safe({"a": 1}, {"a": 5}) == ({"a": 5}, ["a"])' },
        { name: '不降级', expr: 'merge_safe({"a": 5}, {"a": 1}) == ({"a": 5}, ["a"])' },
        { name: '新键无冲突', expr: 'merge_safe({}, {"b": 2}) == ({"b": 2}, [])' },
        { name: '同值不算冲突', expr: 'merge_safe({"a": 1}, {"a": 1}) == ({"a": 1}, [])' },
      ],
    },
    knowledge: ['dict', 'for', 'list', 'if', 'compare', 'logic', 'return'],
    baselineMask: 5,
    summary: '冲突检测与冲突解决是两步：先判断值是否不同，再决定保留哪个。',
  },
  {
    id: 'k0-x3',
    title: '数据流审计',
    objective: '修复 audit_stream：records 为字符串列表；返回 (超过 limit 数量, 负数数量, 非法数量)，等于 limit 不算超过。',
    faultLog: '[K0:EXPERT] STREAM AUDIT — 边界用 >= 导致等于 limit 被算作超高，非法值也会中断审计。',
    initialCode:
      'def audit_stream(records, limit):\n' +
      '    high = 0\n' +
      '    low = 0\n' +
      '    bad = 0\n' +
      '    for raw in records:\n' +
      '        value = int(raw)\n' +
      '        if value >= limit:\n' +
      '            high = high + 1\n' +
      '        elif value < 0:\n' +
      '            low = low + 1\n' +
      '    return high, low, bad',
    hints: ['等于 limit 的记录被算成超高；非法字符串会让审计崩溃。', '“超过”是严格大于；非法值计入 bad。', '把 >= 改成 >，并用 try / except ValueError 包住转换。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '三类审计', expr: 'audit_stream(["120", "-1", "x", "50"], 100) == (1, 1, 1)' },
        { name: '空输入', expr: 'audit_stream([], 100) == (0, 0, 0)' },
        { name: '等于阈值不算超高', expr: 'audit_stream(["101"], 100) == (1, 0, 0)' },
        { name: '边界值', expr: 'audit_stream(["0", "100"], 100) == (0, 0, 0)' },
      ],
    },
    knowledge: ['list', 'for', 'try', 'if', 'elif', 'compare', 'return'],
    baselineMask: 0,
    summary: '边界语义（> 与 >=）决定统计结果；异常隔离要放在转换处。',
  },
  {
    id: 'k0-x4',
    title: '最终恢复命令',
    objective: '修复 final_repair：rows 每条为 [键, 原始值]；累加可转整数的值，非法值计入 bad；返回 (状态, 总和, bad)，总和 >=0 为 STABLE。',
    faultLog: '[K0:EXPERT] FINAL COMMAND — 无效记录让最终修复中断，状态与坏数据计数都错误。',
    initialCode:
      'def final_repair(rows):\n' +
      '    total = 0\n' +
      '    bad = 0\n' +
      '    for row in rows:\n' +
      '        total = total + int(row[1])\n' +
      '    if total >= 0:\n' +
      '        return "STABLE", total, bad\n' +
      '    return "UNSTABLE", total, bad',
    hints: ['遇到 "x" 时整个最终命令崩溃。', '单条记录转换失败要计入 bad 并跳过。', 'try 里累加；except ValueError 里 bad+1。'],
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '跳过非法并判定稳定', expr: 'final_repair([["a", "1"], ["b", "x"], ["c", "-1"]]) == ("STABLE", 0, 1)' },
        { name: '空记录', expr: 'final_repair([]) == ("STABLE", 0, 0)' },
        { name: '全非法', expr: 'final_repair([["a", "x"]]) == ("STABLE", 0, 1)' },
        { name: '负总和', expr: 'final_repair([["a", "-5"]]) == ("UNSTABLE", -5, 0)' },
      ],
    },
    knowledge: ['list', 'for', 'try', 'if', 'compare', 'return', 'variable'],
    baselineMask: 0,
    summary: '最终命令要同时保证：单条坏数据不中断、总和正确、状态判定与容错计数一致。',
  },
];


// ---------- 难度索引 ----------
const mkDef = (bossId: string, chapter: number, difficulty: BossDifficulty, bg: BossBattleDef['bg'], counterDamage: number, phases: Phase[]): BossBattleDef =>
  ({ bossId, chapter, difficulty, maxHp: 100, counterDamage, bg, phases });

const SOMNIA_HARD_DEF = mkDef('somnia', 2, 'hard', 'memory', 4, SOMNIA_HARD);
const SOMNIA_EXPERT_DEF = mkDef('somnia', 2, 'expert', 'memory', 4, SOMNIA_EXPERT);
const INDEX0_HARD_DEF = mkDef('index-0', 3, 'hard', 'memory', 3, INDEX0_HARD);
const INDEX0_EXPERT_DEF = mkDef('index-0', 3, 'expert', 'memory', 3, INDEX0_EXPERT);
const JUDGMENT4_HARD_DEF = mkDef('judgment-4', 4, 'hard', 'memory', 4, JUDGMENT4_HARD);
const JUDGMENT4_EXPERT_DEF = mkDef('judgment-4', 4, 'expert', 'memory', 4, JUDGMENT4_EXPERT);
const ENTROPY_HARD_DEF = mkDef('entropy', 5, 'hard', 'memory', 4, ENTROPY_HARD);
const ENTROPY_EXPERT_DEF = mkDef('entropy', 5, 'expert', 'memory', 4, ENTROPY_EXPERT);
const K0_HARD_DEF = mkDef('k0', 6, 'hard', 'core', 5, K0_HARD);
const K0_EXPERT_DEF = mkDef('k0', 6, 'expert', 'core', 5, K0_EXPERT);

export const BOSS_DIFFICULTY_BATTLES: Record<string, Partial<Record<BossDifficulty, BossBattleDef>>> = {
  'gate-01': { easy: GATE01_BATTLE, hard: GATE_HARD_DEF, expert: GATE_EXPERT_DEF },
  somnia: { easy: SOMNIA_BATTLE, hard: SOMNIA_HARD_DEF, expert: SOMNIA_EXPERT_DEF },
  'index-0': { easy: INDEX0_BATTLE, hard: INDEX0_HARD_DEF, expert: INDEX0_EXPERT_DEF },
  'judgment-4': { easy: JUDGMENT4_BATTLE, hard: JUDGMENT4_HARD_DEF, expert: JUDGMENT4_EXPERT_DEF },
  entropy: { easy: ENTROPY_BATTLE, hard: ENTROPY_HARD_DEF, expert: ENTROPY_EXPERT_DEF },
  k0: { easy: K0_BATTLE, hard: K0_HARD_DEF, expert: K0_EXPERT_DEF },
};

export function bossBattleDef(bossId: string, difficulty: BossDifficulty = 'easy'): BossBattleDef | undefined {
  const sets = BOSS_DIFFICULTY_BATTLES[bossId];
  if (!sets) return undefined;
  return sets[difficulty] || sets.easy;
}

export function bossDifficulties(bossId: string): BossDifficulty[] {
  const sets = BOSS_DIFFICULTY_BATTLES[bossId];
  if (!sets) return [];
  return (['easy', 'hard', 'expert'] as BossDifficulty[]).filter(d => !!sets[d]);
}

export function difficultyCheckCount(def: BossBattleDef): number {
  return def.phases.reduce((sum, p) => sum + (p.judge.pythonChecks || []).length, 0);
}
