// 自由编程实验室题库：10 道跨章节练习题（真实运行 + 输出包含判题）
export interface LabMission {
  id: string;
  title: string;
  desc: string;
  goal: string;
  hint: string;
  initialCode: string;
  expect: string[];
}

export const LAB_MISSIONS: LabMission[] = [
  {
    id: 'p1', title: '欢迎终端',
    desc: '让终端输出一行欢迎语，熟悉最基本的输出指令。',
    goal: '输出：WELCOME TO NEXUS',
    hint: 'print("WELCOME TO NEXUS") —— 文字要加英文引号。',
    initialCode: '# 在下面写一行 print，输出 WELCOME TO NEXUS\n',
    expect: ['WELCOME TO NEXUS'],
  },
  {
    id: 'p2', title: '状态判定',
    desc: '根据状态变量输出对应文字——练习 if/else 双分支。',
    goal: '输出 ONLINE（status 为 "ok" 时）',
    hint: 'if status == "ok": 输出 "ONLINE"，否则输出 "OFFLINE"。注意比较用 ==。',
    initialCode: 'status = "ok"\n\n# 用 if/else 判断 status，输出 ONLINE 或 OFFLINE\n',
    expect: ['ONLINE'],
  },
  {
    id: 'p3', title: '累加器',
    desc: '用 while 循环把 1 到 50 的数字加起来，练习循环与累加。',
    goal: '输出：TOTAL 1275',
    hint: 'total = 0，i = 1；while i <= 50：total += i；i += 1。最后 print("TOTAL", total)。',
    initialCode: 'total = 0\ni = 1\n\n# 用 while 循环累加 1..50，然后 print("TOTAL", total)\n',
    expect: ['TOTAL 1275'],
  },
  {
    id: 'p4', title: '列表过滤',
    desc: '从分数列表里挑出及格的分数（>= 60），练习 for + if + append。',
    goal: '输出：[72, 90]',
    hint: 'for s in scores: if s >= 60: passed.append(s)。最后 print(passed)。',
    initialCode: 'scores = [45, 72, 58, 90, 33]\npassed = []\n\n# 用 for 循环把 >= 60 的分数加入 passed，然后 print(passed)\n',
    expect: ['[72, 90]'],
  },
  {
    id: 'p5', title: '词频统计',
    desc: '统计列表中每个词出现的次数，练习字典的遍历与更新。',
    goal: "输出：{'ok': 2, 'warn': 1}",
    hint: "counts[word] = counts.get(word, 0) + 1 —— get 拿不到键时返回 0。",
    initialCode: 'tokens = ["ok", "warn", "ok"]\ncounts = {}\n\n# 用 for 统计每个 token 出现次数，然后 print(counts)\n',
    expect: ["{'ok': 2, 'warn': 1}"],
  },
  {
    id: 'p6', title: '函数模板',
    desc: '写一个计算面积的函数，练习 def、参数与 return。',
    goal: '输出：AREA 12',
    hint: 'def area(width, height): return width * height —— 最后一行代码不需要改。',
    initialCode: 'def area(width, height):\n    # 在这里返回 width * height\n    pass\n\nprint("AREA", area(3, 4))\n',
    expect: ['AREA 12'],
  },
  {
    id: 'p7', title: '异常兜底',
    desc: '把非数字文本安全转换：失败时输出 0，而不是让程序崩溃。',
    goal: '输出：0',
    hint: 'try: value = int(text)；except ValueError: value = 0。练习异常处理。',
    initialCode: 'text = "abc"\n\n# 用 try/except 把 text 转成整数；失败时输出 0\n',
    expect: ['0'],
  },
  {
    id: 'p8', title: '字符串拼接',
    desc: '把零件清单用横线拼成一个编号，练习循环里的字符串累积。',
    goal: '输出：NEXUS-REPAIR-UNIT',
    hint: '用 "-".join(parts) 一次拼好，或循环累积时处理末尾多余的分隔符。',
    initialCode: 'parts = ["NEXUS", "REPAIR", "UNIT"]\nresult = ""\n\n# 拼成 NEXUS-REPAIR-UNIT 并 print\n',
    expect: ['NEXUS-REPAIR-UNIT'],
  },
  {
    id: 'p9', title: '字典安全读取',
    desc: '读取设备编号：存在的输出编号，不存在用 get 兜底输出 UNKNOWN。',
    goal: '输出两行：S-01 与 UNKNOWN',
    hint: 'print(records["sensor"]) 和 print(records.get("valve", "UNKNOWN"))。',
    initialCode: 'records = {"sensor": "S-01"}\n\n# 输出 sensor 的编号；用 get 读取 valve，缺失时输出 UNKNOWN\n',
    expect: ['S-01', 'UNKNOWN'],
  },
  {
    id: 'p10', title: '综合：统计与分级',
    desc: '实现 grade 函数：所有分数都及格返回 "ALL PASS"，否则返回 "RETRY"。',
    goal: '输出两行：ALL PASS 与 RETRY',
    hint: '遍历 scores，一旦发现 < 60 就立即 return "RETRY"；循环结束后 return "ALL PASS"。',
    initialCode: 'def grade(scores):\n    # 所有分数 >= 60 返回 "ALL PASS"，否则 "RETRY"\n    return ""\n\nprint(grade([60, 75, 90]))\nprint(grade([60, 40, 90]))\n',
    expect: ['ALL PASS', 'RETRY'],
  },
];

export const labMissionById = (id: string): LabMission | undefined => LAB_MISSIONS.find(m => m.id === id);
