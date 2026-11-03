// Python 知识库
export interface KnowledgeCard {
  id: string;
  title: string;
  group: string;
  brief: string;
  example: string;
  pitfalls: string[];
}

export const KNOWLEDGE: KnowledgeCard[] = [
  {
    id: 'variable', title: '变量：给数据起名字', group: '基础',
    brief: '变量是给数据起的名字。赋值之后，就可以通过名字使用这份数据。',
    example: 'repair_id = "R-07"\nprint(repair_id)   # 输出 R-07',
    pitfalls: ['变量先定义后使用，否则报 NameError。', '名字拼写与大小写必须一致：repair_id 和 repair_ids 是两个名字。', '变量名不能以数字开头。'],
  },
  {
    id: 'print', title: 'print()：输出内容', group: '基础',
    brief: 'print() 把文字或变量的值显示到终端，是调试代码最常用的工具。',
    example: 'print("你好，NEXUS")\nprint(42)',
    pitfalls: ['输出文字要加引号，输出变量不要加引号。', '括号必须闭合，漏掉右括号会语法错误。', '每个 print 默认输出一行。'],
  },
  {
    id: 'string', title: '字符串：被引号包裹的文字', group: '基础',
    brief: '字符串是文本数据，用英文双引号 " 或单引号 '+"'"+' 包裹。',
    example: 'name = "R-07"\nmsg = '+"'"+'SYSTEM ONLINE'+"'",
    pitfalls: ['引号必须成对出现，缺失会报 EOL 错误。', '不要混用配对：像 "abc'+"'"+' 这样的写法是错的。', '跨多行的字符串需要使用三引号 """ 包裹。'],
  },
  {
    id: 'if', title: 'if：条件判断分支', group: '流程',
    brief: 'if 根据条件的真假，决定执行哪一段代码。',
    example: 'energy = 20\nif energy >= 10:\n    print("活力充足")\nelse:\n    print("活力不足")',
    pitfalls: ['if 条件末尾必须写英文冒号 :。', '条件体必须缩进，否则报 IndentationError。', 'else 与 if 对齐，且同样以冒号结尾。'],
  },
  {
    id: 'compare', title: '比较运算符', group: '流程',
    brief: '比较运算符对两个值做比较，结果是一个布尔值（True / False）。',
    example: '== 等于    != 不等于\n< 小于    > 大于\n<= 小于等于  >= 大于等于',
    pitfalls: ['判断相等用 ==，单个 = 是赋值。', '注意边界值：温度恰好 40 时，>= 会保留、> 不会。', '比较结果可直接用于 if 条件。'],
  },
  {
    id: 'for', title: 'for 循环：遍历列表', group: '流程',
    brief: 'for 循环依次取出列表中的每个元素，执行一次循环体。',
    example: 'records = ["A", "B", "C"]\nfor record in records:\n    print(record)',
    pitfalls: ['冒号 : 之后循环体必须缩进。', '循环体不缩进会报 IndentationError。', '循环变量（record）只在循环体内部使用。'],
  },
  {
    id: 'list', title: '列表：有序的数据集合', group: '数据',
    brief: '列表用方括号定义，可以存放多个数据，支持增删改查。',
    example: 'alerts = []\nalerts.append(41)  # 追加元素\nprint(alerts[0])   # 取出第 1 个元素（索引从 0 开始）',
    pitfalls: ['索引从 0 开始：alerts[0] 是第一个元素。', 'append() 在列表末尾追加元素。', 'len(alerts) 获取元素个数。'],
  },
  {
    id: 'indent', title: '缩进：代码块的层级', group: '基础',
    brief: 'Python 用行首空格表示代码块层级。同一代码块的缩进量必须一致。',
    example: 'for x in items:\n    print(x)   # 缩进 4 个空格',
    pitfalls: ['缩进不一致会报 IndentationError。', '不要混用 Tab 与空格。', '官方建议统一使用 4 个空格。'],
  },
  {
    id: 'while', title: 'while：条件循环', group: '流程',
    brief: 'while 在条件为真时不断重复执行循环体，直到条件为假。适合需要自己控制次数的场景。',
    example: 'count = 0\nitems = ["A", "B", "C"]\nwhile count < len(items):\n    print(items[count])\n    count = count + 1',
    pitfalls: ['循环体里必须有让条件最终变假的操作（如 count += 1），否则死循环。', '用 len(列表) 而不是硬编码数字，列表变长也不会出错。', '遍历列表时 for 更简洁；while 适合「满足条件才继续」的逻辑。'],
  },
  {
    id: 'elif', title: 'elif：多分支判断', group: '流程',
    brief: 'if ... elif ... else ... 从上到下依次判断，命中一个分支后即结束。适合多分类逻辑。',
    example: 'if tag == "ok":\n    print("PASS")\nelif tag == "warn":\n    print("WARN")\nelse:\n    print("FAIL")',
    pitfalls: ['elif 必须跟在 if 之后，且与 if 对齐缩进。', '命中一个分支后，后面的分支不再执行。', '可以有任意多个 elif，else 只能有一个（可以省略）。'],
  },
  {
    id: 'logic', title: '布尔逻辑：and / or / not', group: '流程',
    brief: '用逻辑运算符组合多个条件：and 两边都为真才为真；or 一边为真即为真；not 取反。',
    example: 'if temp > 90 and pressure > 150:\n    print("OVERLOAD")\n    \nif not online:\n    print("OFFLINE")',
    pitfalls: ['and 与 or 要分清：报警逻辑用错会造成误报或漏报。', '优先级：not 高于 and，and 高于 or；不放心就加括号。', 'not 常用于反转判断，让代码语义更直白。'],
  },
  {
    id: 'dict', title: '字典：键值对数据', group: '数据',
    brief: '字典用键存取数据，像一本"编号 → 记录"的登记簿。',
    example: 'records = {"sensor": "S-01", "relay": "R-02"}\nprint(records["sensor"])        # S-01\nprint(records.get("valve", "?")) # 键缺失返回默认值',
    pitfalls: ['直接 records["不存在的键"] 会抛 KeyError。', '用 get(键, 默认值) 安全读取。', 'for key in dict 遍历的是键；要拿值用 dict[key] 或用 items()。'],
  },
  {
    id: 'try', title: 'try/except：异常处理', group: '流程',
    brief: '让程序在出错时优雅降级而不是崩溃：把可能出错的语句放进 try，出错后交给 except 处理。',
    example: 'def parse(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0',
    pitfalls: ['try 块里出错的那一行之后的语句不会执行。', 'except 后面写上异常类型（如 ValueError）更精确，避免吞掉真正的 bug。', '一条坏数据不应拖垮整个循环——把 try 放在循环体里做隔离。'],
  },
  {
    id: 'parameter', title: '参数：函数的数据入口', group: '函数',
    brief: '函数通过参数接收外部数据。调用时按位置传入，参数个数与定义一致。',
    example: 'def greet(name, title):\n    return title + " " + name\n\nprint(greet("R-07", "REPAIRER"))',
    pitfalls: ['位置参数按顺序绑定：第一个实参给第一个形参，顺序反了会静默出错（不报错！）。', '调用时参数个数要与定义匹配，不然 TypeError。', '只写函数名（不带括号）不会执行函数——那是函数对象本身。'],
  },
  {
    id: 'return', title: 'return：函数的返回值', group: '函数',
    brief: 'def 定义函数，return 把计算结果交还给调用者。',
    example: 'def double(n):\n    return n * 2\n\nprint(double(21))   # 42',
    pitfalls: ['return 语句之后的代码不会执行。', '没有 return 的函数默认返回 None。', '调用函数时参数个数要与定义一致。'],
  },
];

export const knowledgeById = (id: string): KnowledgeCard | undefined => KNOWLEDGE.find(k => k.id === id);
