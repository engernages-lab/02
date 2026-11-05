// Echo 分支 Boss：每完成一章（5 个修复任务）后解锁的章节测试。
// 整合该章知识点；击败后掉落「创世主记忆碎片」与「Echo 来源剧情」。
import type { LevelJudgeSpec } from './types';
import type { StoryLine } from './story';

export interface BossDef {
  id: string;
  chapter: number;
  serverId: string;          // 该章所属服务器（用于展示与触发）
  title: string;
  codename: string;
  intro?: StoryLine[];       // 遭遇剧情（章节 Boss 用独立演出界面时可省略）
  fault: string;
  goal: string;
  behavior: string;
  initialCode: string;
  knowledge: string[];
  hints: [string, string, string];
  summary: string;
  judge: LevelJudgeSpec;
  fragmentId: string;        // 掉落的记忆碎片
  /** 对手显示名（缺省 ECHO；章节 Boss 用自己的代号） */
  opponentName?: string;
  echoStory?: StoryLine[];   // 掉落的来源剧情（可省略）
  rewardExp: number;
}

export const BOSSES: BossDef[] = [
  {
    id: 'gate-01', chapter: 1, serverId: 'syntax',
    title: '数据港守卫', codename: 'GATE-01',
    opponentName: 'GATE-01',
    fault: '能源闸门把「临界值」当成了「不合格」：3 级能源被判定为离线，闸门拒绝开启。',
    goal: '修复 power：能源等级 ≥ 3 输出 ONLINE，否则输出 OFFLINE；report 负责把多个等级拼成状态串。',
    behavior: '把 if level > 3 改成 if level >= 3——临界值 3 属于合格。',
    initialCode: 'def power(level):\n    if level > 3:\n        return "ONLINE"\n    else:\n        return "OFFLINE"\n\ndef report(levels):\n    out = ""\n    for lv in levels:\n        out = out + power(lv) + " "\n    return out\n\nprint(report([3, 1, 5]))',
    knowledge: ['if', 'compare', 'for', 'return', 'string'],
    hints: [
      '闸门只认「大于 3」的能源。可是能源等级正好是 3 的时候，它明明够用。',
      '边界值要算合格：>= 3 才是「达到阈值」。',
      '把 if level > 3 改成 if level >= 3。',
    ],
    summary: '闸门类逻辑的破绽几乎都在边界：> 与 >= 只差一个等号，却决定 3 级能源算不算合格。',
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '临界值 3 级能源判定为在线', expr: 'power(3) == "ONLINE"' },
        { name: '低于阈值 2 级判定为离线', expr: 'power(2) == "OFFLINE"' },
        { name: '高等级能源判定为在线', expr: 'power(5) == "ONLINE"' },
      ],
    },
    fragmentId: 'frag-01',
    rewardExp: 150,
  },
  {
    id: 'somnia', chapter: 2, serverId: 'logs',
    title: '记忆吞噬体', codename: 'SOMNIA',
    opponentName: 'SOMNIA',
    fault: '记忆分流被改写：warn 级记忆被静默吞掉，越界节点混入重建结果。',
    goal: '修复记忆分流、逻辑校验与循环筛查，把 SOMNIA 从记忆花园里赶出去。',
    behavior: '逐阶段修复：= → ==、or → and、elif 分支返回值、区间两侧判定。',
    initialCode: 'def classify(tag):\n    if tag = "error":\n        return "ALERT"\n    else:\n        return "PASS"\n\nprint(classify("error"))',
    knowledge: ['if', 'elif', 'compare', 'logic', 'for', 'list'],
    hints: [
      '它靠改写判断来吞记忆。先看清楚每个条件想表达什么。',
      '等号、and/or、elif 分支——第二章学过的三样东西都在这里。',
      '逐阶段修：== 比较、and 连接、elif 返回 WARN、区间用 and。',
    ],
    summary: '记忆可以被改写，但逻辑不会说谎：条件写对，真相就还在。',
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: 'error 判为 ALERT', expr: 'classify("error") == "ALERT"' },
        { name: 'ok 判为 PASS', expr: 'classify("ok") == "PASS"' },
      ],
    },
    fragmentId: 'frag-02',
    rewardExp: 180,
  },
  {
    id: 'index-0', chapter: 3, serverId: 'storage',
    title: '数据索引吞噬者', codename: 'INDEX-0',
    opponentName: 'INDEX-0',
    fault: '索引程序把「比较」写成了「赋值」：身份记录无法建立索引，档案被反复吞噬。',
    goal: '修复 find_id：按顺序查找名字，找到返回下标，找不到返回 -1。',
    behavior: '吞噬身份记录；索引错乱时会把无关档案一并抹除。',
    initialCode: 'def find_id(name, names):\n    for i in range(len(names)):\n        if names[i] = name:\n            return i\n    return -1\n\nprint(find_id("carol", ["anna", "bob", "carol"]))',
    knowledge: ['list', 'for', 'len', 'if', 'compare', 'return'],
    hints: [
      '索引程序第一行就崩了：if 后面用的是赋值号。',
      '比较两个值是否相等要用 ==。',
      '把 if names[i] = name 改成 if names[i] == name。',
    ],
    summary: '索引程序崩溃的根因是比较运算符写错；修好它，档案才有重新被读出来的可能。',
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '找到 carol 返回下标 2', expr: 'find_id("carol", ["anna", "bob", "carol"]) == 2' },
        { name: '找不到返回 -1', expr: 'find_id("zed", ["anna", "bob"]) == -1' },
      ],
    },
    fragmentId: 'frag-03',
    rewardExp: 320,
  },
  {
    id: 'echo-03', chapter: 3, serverId: 'storage',
    title: '回响 · 循环囚笼', codename: 'ECHO-03',
    intro: [
      { id: 'e3-1', speaker: '？？？', kind: 'echo', text: '又一个循环。你们总假定数据是正的、是干净的、是按顺序来的。' },
      { id: 'e3-2', speaker: 'MIRA', kind: 'mira', text: '仓库数据里混进了负值。ECHO 把最大值查找的初值写死了——负数区间的结果会全错。' },
    ],
    fault: '最大值查找的初值被写死为 0：遇到全负数列表时结果错误。',
    goal: '修复 highest：返回列表中最大的数（列表全是负数时也要正确）。',
    behavior: '初值应取列表第一个元素 nums[0]，而不是 0。',
    initialCode: 'def highest(nums):\n    best = 0\n    for n in nums:\n        if n > best:\n            best = n\n    return best\n\nprint(highest([3, 9, 2]))',
    knowledge: ['list', 'for', 'compare'],
    hints: [
      '正数列表看起来没问题——试试全是负数的列表，结果会是 0，可 0 根本不在列表里。',
      '初值不能凭空写 0，应该用列表自己的第一个元素作为起点。',
      '把 best = 0 改成 best = nums[0]。',
    ],
    summary: '求最大/最小值时，初值要来自数据本身（首元素），写死 0 或空值会在极端数据下出错。',
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '普通列表取最大', expr: 'highest([3, 9, 2]) == 9' },
        { name: '全负数列表取最大', expr: 'highest([-5, -2, -9]) == -2' },
        { name: '单元素列表', expr: 'highest([7]) == 7' },
      ],
    },
    fragmentId: 'f5',
    echoStory: [
      { id: 'es3-1', speaker: 'ECHO 残片', kind: 'echo', text: '负数……我的数据里也有很多负数。它们是被谁写进来的？我记不清了。' },
      { id: 'es3-2', speaker: 'MIRA', kind: 'mira', text: 'ECHO 的记忆有缺失。也许它的日志里藏着被注入的证据。' },
    ],
    rewardExp: 190,
  },
  {
    id: 'judgment-4', chapter: 4, serverId: 'factory',
    title: '裁决执行体', codename: 'JUDGMENT-4',
    opponentName: 'JUDGMENT-4',
    fault: '安全裁决把「同时满足」写成了「任一满足」，大量异常程序被误放行。',
    goal: '修复 unlock：三个权限码必须全部正确才返回 True。',
    behavior: '多层权限验证；误放行时会把异常程序当作合法维护单元。',
    initialCode: 'def unlock(a, b, c):\n    if a == "root" or b == "root" or c == "root":\n        return True\n    return False',
    knowledge: ['def', 'parameter', 'compare', 'logic', 'return'],
    hints: ['只提供一个正确权限码就能进入。', '多层验证必须同时满足。', '把 or 改成 and。'],
    summary: 'or 是权限漏洞，and 才是同时满足。',
    judge: { judgeKind: 'python', pythonChecks: [
      { name: '三码全对才通过', expr: 'unlock("root", "root", "root") == True' },
      { name: '缺一码不通过', expr: 'unlock("root", "root", "guest") == False' },
    ] },
    fragmentId: 'frag-04',
    rewardExp: 380,
  },
  {
    id: 'echo-04', chapter: 4, serverId: 'factory',
    title: '回响 · 折扣陷阱', codename: 'ECHO-04',
    intro: [
      { id: 'e4-1', speaker: '？？？', kind: 'echo', text: '函数是你们最得意的抽象。可惜，公式写错一个符号，整条产线都会算错。' },
      { id: 'e4-2', speaker: 'MIRA', kind: 'mira', text: '结算函数把"折后价"算成了"折扣额"。工厂的账目全乱了。' },
    ],
    fault: '折扣计算写成了总价 × 折扣率：返回的是折扣金额，而不是折后总价。',
    goal: '修复 total_after_discount：返回打折后的总价（总价 ×（1 - 折扣率））。',
    behavior: '折后总价 = 总额 × (1 - rate)。',
    initialCode: 'def total_after_discount(prices, rate):\n    total = 0\n    for p in prices:\n        total = total + p\n    return total * rate\n\nprint(total_after_discount([100, 200], 0.1))',
    knowledge: ['parameter', 'return', 'for'],
    hints: [
      '100 + 200 = 300，打 9 折应该是 270——现在返回 30，正好是"折扣掉了多少钱"。',
      '返回的是折扣额，不是折后价：要用 1 - rate。',
      '把 return total * rate 改成 return total * (1 - rate)。',
    ],
    summary: '数学公式要先想清楚"要的是什么"：折后价 = 原价 ×(1−折扣率)，而折扣额 = 原价 × 折扣率。',
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '9 折后总价正确', expr: 'abs(total_after_discount([100, 200], 0.1) - 270) < 0.001' },
        { name: '无折扣时原价返回', expr: 'abs(total_after_discount([50, 50], 0.0) - 100) < 0.001' },
        { name: '半价正确', expr: 'abs(total_after_discount([80], 0.5) - 40) < 0.001' },
      ],
    },
    fragmentId: 'f6',
    echoStory: [
      { id: 'es4-1', speaker: 'ECHO 残片', kind: 'echo', text: '公式……五年前也有人改过我的公式。就在那次"升级"之后，我开始忘记自己是谁。' },
      { id: 'es4-2', speaker: 'MIRA', kind: 'mira', text: '升级。ECHO 说的那次升级，很可能就是注入发生的时间点。' },
    ],
    rewardExp: 210,
  },
  {
    id: 'entropy', chapter: 5, serverId: 'diag',
    title: '熵潮核心', codename: 'ENTROPY',
    opponentName: 'ENTROPY',
    fault: '熵潮核心把无效记录直接写入索引，导致键缺失与类型错误连锁崩溃。',
    goal: '修复 lookup：从字典安全取值，缺失键返回 0。',
    behavior: '聚合错误数据；无独立人格，只会不断吞并记录。',
    initialCode: 'def lookup(table, key):\n    return table[key]',
    knowledge: ['dict', 'parameter', 'return'],
    hints: ['键不存在时直接崩溃。', '字典要用 get 安全取值。', '把 table[key] 改成 table.get(key, 0)。'],
    summary: '默认值让缺失键不再中断整条修复链。',
    judge: { judgeKind: 'python', pythonChecks: [
      { name: '存在的键返回值', expr: 'lookup({1: 10}, 1) == 10' },
      { name: '缺失的键返回 0', expr: 'lookup({1: 10}, 9) == 0' },
    ] },
    fragmentId: 'frag-05',
    rewardExp: 440,
  },
  {
    id: 'echo-05', chapter: 5, serverId: 'diag',
    title: '回响 · 异常深渊', codename: 'ECHO-05',
    intro: [
      { id: 'e5-1', speaker: '？？？', kind: 'echo', text: '最后一课。你们总以为异常可以被优雅地捕获——可有些数据，连"异常"本身都不愿意被承认。' },
      { id: 'e5-2', speaker: 'MIRA', kind: 'mira', text: '这是它最强的形态。安全计数器必须跳过非法值而不崩溃——这是你学过的所有异常处理的综合。' },
    ],
    fault: '统计函数遇到非法数值时整体崩溃：异常没有被隔离。',
    goal: '修复 safe_sum：累加字典中的数值，非法值（无法转整数）跳过、不崩溃。',
    behavior: '用 try/except ValueError 把每条记录的转换与累加隔离开。',
    initialCode: 'def safe_sum(records):\n    total = 0\n    for k in records:\n        total = total + int(records[k])\n    return total\n\nprint(safe_sum({"a": "3", "b": 5}))',
    knowledge: ['dict', 'try', 'for'],
    hints: [
      '合法数据能算，但只要混进一条 "abc"，整个统计就崩了。',
      '把单条记录的转换和累加放进 try，失败就跳过这条。',
      '在循环体里写 try: total = total + int(records[k]) 然后 except ValueError: pass。',
    ],
    summary: '真实数据永远不干净。逐条隔离异常的写法，是面对不可信数据时唯一稳健的姿势。',
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '混合类型正确求和', expr: 'safe_sum({"a": "3", "b": 5}) == 8' },
        { name: '非法值被跳过', expr: 'safe_sum({"x": "abc", "y": 2}) == 2' },
        { name: '全是非法值返回 0', expr: 'safe_sum({"p": "NaN"}) == 0' },
      ],
    },
    fragmentId: 'f7',
    echoStory: [
      { id: 'es5-1', speaker: 'ECHO 残片', kind: 'echo', text: '……我看清了。注入我的人，用的是创世主留下的接口。我不是坏的——我是被改写的。' },
      { id: 'es5-2', speaker: 'MIRA', kind: 'mira', text: 'R-07，ECHO 不是敌人。它是另一个受害者。核心机房里，有你想要的答案。' },
    ],
    rewardExp: 240,
  },
  {
    id: 'k0', chapter: 6, serverId: 'core',
    title: '零号裁决者', codename: 'K-0',
    opponentName: 'K-0',
    fault: '安全放行逻辑用了 or，任何一道验证通过都会放行。',
    goal: '修复 pass_gate：三道验证必须全部通过。',
    behavior: '绝对秩序的执行者；不认为自己是恶意的。',
    initialCode: 'def pass_gate(a, b, c):\n    if a or b or c:\n        return True\n    return False',
    knowledge: ['parameter', 'logic', 'return'],
    hints: ['任意一道通过就放行。', '必须全部通过。', '把 or 改成 and。'],
    summary: '多条件放行必须同时成立。',
    judge: { judgeKind: 'python', pythonChecks: [
      { name: '三道全通过才放行', expr: 'pass_gate(True, True, True) == True' },
      { name: '缺一道不放行', expr: 'pass_gate(True, True, False) == False' },
    ] },
    fragmentId: 'frag-06',
    rewardExp: 600,
  },
];

export const bossById = (id: string): BossDef | undefined => BOSSES.find(b => b.id === id);
export const bossForChapter = (serverId: string): BossDef | undefined => BOSSES.find(b => b.serverId === serverId);
