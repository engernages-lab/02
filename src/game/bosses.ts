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
  intro: StoryLine[];        // 遭遇剧情
  fault: string;
  goal: string;
  behavior: string;
  initialCode: string;
  knowledge: string[];
  hints: [string, string, string];
  summary: string;
  judge: LevelJudgeSpec;
  fragmentId: string;        // 掉落的记忆碎片
  echoStory: StoryLine[];    // 掉落的 Echo 来源剧情
  rewardExp: number;
}

export const BOSSES: BossDef[] = [
  {
    id: 'echo-01', chapter: 1, serverId: 'syntax',
    title: '回响 · 语法镜像', codename: 'ECHO-01',
    intro: [
      { id: 'e1-1', speaker: 'NEXUS 系统', kind: 'system', text: '检测到异常数据流：某个存在正在复刻你的修复手法……' },
      { id: 'e1-2', speaker: '？？？', kind: 'echo', text: '第一个把这台终端修好的人……手法很干净。让我看看，你能不能修好"我"。' },
      { id: 'e1-3', speaker: 'MIRA', kind: 'mira', text: 'R-07，是 ECHO，它把自己伪装成一个镜像任务。它复制了你刚学的东西——也是它给我们设的第一道章节测验。' },
    ],
    fault: '语法镜像被 ECHO 改写：字符串拼接时把方法本身当成了值，终端直接报类型错误。',
    goal: '修复 mirror，让 print(mirror("echo")) 输出 REPAIR-ECHO。',
    behavior: '调用字符串方法要加括号：name.upper()。',
    initialCode: 'def mirror(name):\n    return "REPAIR-" + name.upper\n\nprint(mirror("echo"))',
    knowledge: ['string', 'return', 'print'],
    hints: [
      '报错说不能把字符串和"内置方法"相加——你拼进去的不是值，而是方法本身。',
      '字符串方法 name.upper 是"方法对象"；要拿到大写结果必须调用它。',
      '把 name.upper 改成 name.upper()——加上括号才是调用。',
    ],
    summary: '区分「方法对象」与「方法调用」：name.upper 是方法本身，name.upper() 才返回大写结果。ECHO 就是利用这种细微差别来破坏输出。',
    judge: { judgeKind: 'stdout', stdoutChecks: [{ name: '镜像输出正确', contains: ['REPAIR-ECHO'] }] },
    fragmentId: 'f3',
    echoStory: [
      { id: 'es1-1', speaker: 'ECHO 残片', kind: 'echo', text: '……这段代码我见过。五年前，有人用同样的写法修复过一台老终端。' },
      { id: 'es1-2', speaker: 'MIRA', kind: 'mira', text: 'ECHO 提到"五年前"。这和你记忆里那次事故的时间点完全一致。' },
    ],
    rewardExp: 150,
  },
  {
    id: 'echo-02', chapter: 2, serverId: 'logs',
    title: '回响 · 逻辑断层', codename: 'ECHO-02',
    intro: [
      { id: 'e2-1', speaker: '？？？', kind: 'echo', text: '条件判断……人类最喜欢在这上面偷懒。边界值，是你们永远的破绽。' },
      { id: 'e2-2', speaker: 'MIRA', kind: 'mira', text: '它把评分器的边界改坏了。90 分本该是最高等级——现在会被判成第二档。' },
    ],
    fault: '评分边界的比较符号被改写：恰好 90 分的记录被错判为 B 等级。',
    goal: '修复 grade：90 分及以上返回 A，60 分及以上返回 B，其余返回 C。',
    behavior: '边界要用 >=：score >= 90 返回 "A"。',
    initialCode: 'def grade(score):\n    if score > 90:\n        return "A"\n    elif score >= 60:\n        return "B"\n    else:\n        return "C"\n\nprint(grade(90))',
    knowledge: ['if', 'elif', 'compare'],
    hints: [
      '把 90 分传进去，输出的是 B——说明第一个条件没接住它。',
      '本题的边界是"包含"关系：90 分属于 A 档。',
      '把 if score > 90 改成 if score >= 90。',
    ],
    summary: '边界条件是条件判断最容易出错的地方：> 与 >= 只差一个等号，却决定了边界值归属。',
    judge: {
      judgeKind: 'python',
      pythonChecks: [
        { name: '90 分属于 A 档', expr: 'grade(90) == "A"' },
        { name: '60 分属于 B 档', expr: 'grade(60) == "B"' },
        { name: '59 分属于 C 档', expr: 'grade(59) == "C"' },
      ],
    },
    fragmentId: 'f4',
    echoStory: [
      { id: 'es2-1', speaker: 'ECHO 残片', kind: 'echo', text: '边界……我记得有人在我身上也设过边界。那是被注入之前的事了。' },
      { id: 'es2-2', speaker: 'MIRA', kind: 'mira', text: '"被注入之前"——ECHO 在暗示它原本不是现在这个样子。' },
    ],
    rewardExp: 170,
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
];

export const bossById = (id: string): BossDef | undefined => BOSSES.find(b => b.id === id);
export const bossForChapter = (serverId: string): BossDef | undefined => BOSSES.find(b => b.serverId === serverId);
