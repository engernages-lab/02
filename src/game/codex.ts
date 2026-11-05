// Bug 图鉴：与实际课程关卡绑定的 Python 常见错误
export interface BugEntry {
  id: string;
  error: string;
  title: string;
  desc: string;
  fix: string;
  levelIds: string[];
  chapter: number;
}

export const BUG_CODEX: BugEntry[] = [
  { id: 'syntax', error: 'SyntaxError', title: '语法错误', desc: '条件末尾漏冒号、括号不闭合等。', fix: '检查 if/for 行末的英文冒号与括号配对。', levelIds: ['1-1'], chapter: 1 },
  { id: 'indent', error: 'IndentationError', title: '缩进错误', desc: '代码块没有缩进，或同一块缩进不一致。', fix: '循环体 / 分支体统一缩进 4 个空格。', levelIds: ['1-5'], chapter: 1 },
  { id: 'string', error: 'SyntaxError', title: '字符串未闭合', desc: '引号没成对，字符串在中途断裂。', fix: '字符串两端都要有英文引号。', levelIds: ['1-2'], chapter: 1 },
  { id: 'name', error: 'NameError', title: '名字未定义', desc: '使用了没有定义、或拼写不一致的变量名。', fix: '对比定义处与使用处的拼写和大小写。', levelIds: ['1-3'], chapter: 1 },
  { id: 'compare', error: '逻辑错误', title: '比较写反 / 边界错误', desc: '用 < 代替 >=、用 = 代替 ==，边界值被误判。', fix: '先想清楚「包含边界」还是「不包含」。', levelIds: ['1-4', '2-2'], chapter: 1 },
  { id: 'logic', error: '逻辑错误', title: 'and / or 用错', desc: '该同时满足的地方用了 or，导致误报。', fix: '同时成立用 and，任一成立用 or。', levelIds: ['2-3', '2-4'], chapter: 2 },
  { id: 'branch', error: '逻辑错误', title: '分支写错', desc: 'elif 分支返回值错误，整类数据被误判。', fix: '逐条核对 if / elif / else 的输出。', levelIds: ['2-5'], chapter: 2 },
  { id: 'index', error: 'IndexError', title: '索引越界', desc: '列表索引超出范围，或忘了从 0 开始。', fix: '索引从 0 起，最大是 len(list)-1。', levelIds: ['3-1'], chapter: 3 },
  { id: 'loop', error: '逻辑错误', title: '循环边界', desc: 'while 条件写死数字，最后一两项被漏掉。', fix: '用 len(items) 而不是硬编码次数。', levelIds: ['3-3'], chapter: 3 },
  { id: 'type', error: 'TypeError', title: '类型错误', desc: '把方法当成值，或对字符串做算术。', fix: '调用方法要加括号：name.upper()。', levelIds: ['4-4'], chapter: 4 },
  { id: 'key', error: 'KeyError', title: '键不存在', desc: '字典里没有这个键，直接取值会崩溃。', fix: '用 get(key, 默认值) 安全读取。', levelIds: ['5-1'], chapter: 5 },
  { id: 'value', error: 'ValueError', title: '转换失败', desc: 'int("abc") 之类的转换抛异常。', fix: '用 try/except 兜底，失败时给默认值。', levelIds: ['5-2'], chapter: 5 },
];

export const bugById = (id: string): BugEntry | undefined => BUG_CODEX.find(b => b.id === id);

/** 按 Python 异常类型匹配图鉴条目（用于提交失败时记账） */
export function codexForError(errType?: string): BugEntry | undefined {
  if (!errType) return undefined;
  const exact = BUG_CODEX.find(b => b.error === errType);
  if (exact) return exact;
  if (errType.includes('Indentation')) return bugById('indent');
  if (errType.includes('Syntax')) return bugById('syntax');
  if (errType.includes('Name')) return bugById('name');
  if (errType.includes('Index')) return bugById('index');
  if (errType.includes('Key')) return bugById('key');
  if (errType.includes('Type')) return bugById('type');
  if (errType.includes('Value')) return bugById('value');
  return undefined;
}

export interface BugRecord { count: number; firstAt: number }

/** 章节里的常见错误（按遭遇次数排序） */
export function topBugsForChapter(chapter: number, log: Record<string, BugRecord> | undefined, limit = 3): BugEntry[] {
  if (!log) return [];
  return BUG_CODEX
    .filter(b => b.chapter === chapter && log[b.id])
    .sort((a, b) => (log[b.id]?.count || 0) - (log[a.id]?.count || 0))
    .slice(0, limit);
}
