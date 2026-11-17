// 智能代码诊断：只解释、只提示，不参与任何判题
//
// 设计原则（A3）：
//   1. 唯一事实来源是真实 MicroPython 执行结果（traceback / 异常类型 / stdout）与原有判题结果；
//   2. 语法子类型不能只看报错字符串——MicroPython 把漏冒号、缩进、括号错都报成 "invalid syntax"，
//      必须结合源码结构（括号/引号平衡、块缩进、语句结尾）推断；
//   3. 逻辑错误只能给「可能原因」，并标注置信度，绝不伪装成确定结论；
//   4. 任何提示都不包含答案代码、隐藏测试数据或判题内部表达式。

import type { LevelDef } from '../game/levels';
import type { JudgeVerdict } from './judge';
import type { RunOutcomeShape } from '../game/types';
import { knowledgeById } from '../game/knowledge';

export type DiagKind = 'syntax' | 'runtime' | 'output' | 'logic' | 'timeout' | 'judge' | 'ok' | 'unknown';
export type DiagConfidence = 'high' | 'medium' | 'low';

export interface Diagnosis {
  kind: DiagKind;
  /** 原始异常名（SyntaxError / NameError…）或中文分类（结果不匹配 / 逻辑错误） */
  errorType: string;
  /** 面板标题 */
  title: string;
  /** 1 基行号；无法定位为 null */
  line: number | null;
  /** 1 基列号（仅语法分析可得） */
  column: number | null;
  /** 出错行的代码片段（截断，绝不含答案） */
  snippet: string;
  /** 解释器原始错误信息（去掉 traceback 噪音） */
  rawMessage: string;
  /** 原因说明 */
  reason: string;
  /** 相关知识点 id（优先取本关已教） */
  knowledge: string[];
  /** 三层提示：方向 → 原因 → 修复建议 */
  layers: [string, string, string];
  /** MIRA 台词（随连续失败变化） */
  mira: string;
  confidence: DiagConfidence;
  /** 是否经过判题（false = 只是运行结果） */
  judged: boolean;
  /** 用于判断「同一错误连续触发」 */
  signature: string;
}

export interface DiagnoseInput {
  level: LevelDef;
  code: string;
  run: RunOutcomeShape;
  /** 正式提交时的判题结果；仅运行时为 null */
  verdict?: JudgeVerdict | null;
  /** 同一错误连续触发次数（用于分层与 MIRA 语气） */
  streak?: number;
}

// ---------- traceback 解析 ----------

export interface TbFrame {
  file: string;
  line: number | null;
  func: string | null;
}

/** 从 MicroPython 的 traceback 文本里提取帧（File "<string>", line 6, in boom） */
export function parseTracebackFrames(tb: string | undefined): TbFrame[] {
  const out: TbFrame[] = [];
  if (!tb) return out;
  const re = /File "([^"]+)", line (\d+)(?:, in ([^\r\n]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tb)) !== null) {
    out.push({
      file: m[1],
      line: Number(m[2]) || null,
      func: m[3] ? m[3].trim() : null,
    });
  }
  return out;
}

/** 用户代码在 traceback 里的帧（exec 的源码文件名是 <string>） */
export function userFrames(tb: string | undefined): TbFrame[] {
  const frames = parseTracebackFrames(tb);
  const mine = frames.filter(f => f.file === '<string>');
  return mine.length > 0 ? mine : [];
}

// ---------- 源码结构分析 ----------

interface Balance {
  /** 未闭合的括号栈（字符 + 行列） */
  brackets: { ch: string; line: number; col: number }[];
  /** 未闭合的引号 */
  quote: { ch: string; line: number; col: number } | null;
  /** 是否有 Tab 与空格混用的缩进 */
  mixedIndent: { line: number } | null;
}

/** 扫描括号 / 引号平衡（跳过注释与字符串内部的括号） */
export function scanBalance(code: string): Balance {
  const lines = code.split(/\r?\n/);
  const stack: { ch: string; line: number; col: number }[] = [];
  let quote: { ch: string; line: number; col: number } | null = null;
  let mixedIndent: { line: number } | null = null;
  let indentStyle: 'tab' | 'space' | null = null;
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    // 缩进混用检测：以第一条有缩进的行为基准，出现另一种缩进方式即视为混用
    const lead = raw.match(/^[ \t]+/);
    if (lead && !mixedIndent) {
      const style: 'tab' | 'space' = lead[0].includes('\t') ? 'tab' : 'space';
      if (indentStyle === null) indentStyle = style;
      else if (indentStyle !== style) mixedIndent = { line: li + 1 };
    }
    for (let ci = 0; ci < raw.length; ci++) {
      const ch = raw[ci];
      if (quote) {
        if (ch === '\\') { ci++; continue; }
        if (ch === quote.ch) quote = null;
        continue;
      }
      if (ch === '#') break;
      if (ch === '"' || ch === "'") {
        // 三引号
        if (raw.slice(ci, ci + 3) === ch + ch + ch) {
          const end = raw.indexOf(ch + ch + ch, ci + 3);
          if (end < 0) { quote = { ch, line: li + 1, col: ci + 1 }; break; }
          ci = end + 2;
          continue;
        }
        quote = { ch, line: li + 1, col: ci + 1 };
        continue;
      }
      if (ch === '(' || ch === '[' || ch === '{') {
        stack.push({ ch, line: li + 1, col: ci + 1 });
        continue;
      }
      if (ch === ')' || ch === ']' || ch === '}') {
        const want = pairs[ch];
        for (let k = stack.length - 1; k >= 0; k--) {
          if (stack[k].ch === want) { stack.length = k; break; }
        }
      }
    }
  }
  return { brackets: stack, quote, mixedIndent };
}

export interface SyntaxAnalysis {
  subtype: string;
  title: string;
  line: number | null;
  column: number | null;
  reason: string;
  fix: string;
  knowledge: string[];
  confidence: DiagConfidence;
}

const KEYWORD_RE = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\b/;
const BLOCK_END_RE = /:\s*(#.*)?$/;
const BARE_ELSE_RE = /^\s*(else|try|finally)\s*:\s*$/;

function indentOf(s: string): number {
  const m = s.match(/^[ \t]*/);
  if (!m) return 0;
  // Tab 按 4 个空格计（与 MicroPython 对齐的近似）
  return m[0].replace(/\t/g, '    ').length;
}

/** 根据报错行 + 源码结构推断语法错误的真实子类型 */
export function analyzeSyntax(code: string, reportedLine: number | null): SyntaxAnalysis {
  const lines = code.split(/\r?\n/);
  const valid = (n: number | null): n is number => typeof n === 'number' && n >= 1;
  const overEof = valid(reportedLine) && reportedLine > lines.length;
  const idx = overEof ? lines.length - 1 : Math.max(0, Math.min((reportedLine || 1) - 1, lines.length - 1));
  const cur = lines[idx] ?? '';
  const balance = scanBalance(code);

  const lastNonEmpty = (() => {
    for (let i = lines.length - 1; i >= 0; i--) if (lines[i].trim()) return i;
    return 0;
  })();
  const target = overEof ? lines[lastNonEmpty] ?? '' : cur;
  const targetLine = overEof ? lastNonEmpty + 1 : idx + 1;

  const base = (
    subtype: string, title: string, reason: string, fix: string,
    knowledge: string[], confidence: DiagConfidence, line = targetLine, column: number | null = null,
  ): SyntaxAnalysis => ({ subtype, title, line, column, reason, fix, knowledge, confidence });

  if (balance.mixedIndent) {
    return base('TabError', '缩进错误 · Tab 与空格混用',
      `第 ${balance.mixedIndent.line} 行的缩进同时用了 Tab 和空格。Python 要求同一代码块使用一致的缩进方式。`,
      '把该行行首的 Tab 全部改成 4 个空格，并检查同一代码块的其它行是否一致。',
      ['indent'], 'medium', balance.mixedIndent.line);
  }

  if (balance.quote) {
    return base('SyntaxError', '语法错误 · 引号未闭合',
      `第 ${balance.quote.line} 行有一个 ${balance.quote.ch === '"' ? '双引号' : '单引号'}没有配对，字符串一直到文件结束都没有闭合。`,
      '检查这一行的字符串是否漏了结尾引号；如果字符串里本身包含引号，需要换用另一种引号或做转义。',
      ['string'], 'high', balance.quote.line, balance.quote.col);
  }

  if (balance.brackets.length > 0) {
    const b = balance.brackets[balance.brackets.length - 1];
    return base('SyntaxError', '语法错误 · 括号未闭合',
      `第 ${b.line} 行的 ${b.ch} 没有找到配对的右括号，后面的代码因此被当成括号内的内容。`,
      '从这一行的左括号开始，补齐对应的右括号；多层嵌套时从最内层开始检查。',
      ['print'], 'high', b.line, b.col);
  }

  if (overEof) {
    const prev = lines[lastNonEmpty] ?? '';
    if (BLOCK_END_RE.test(prev) && KEYWORD_RE.test(prev)) {
      return base('SyntaxError', '语法错误 · 代码块缺少内容',
        `第 ${targetLine} 行（${prev.trim()}）后面缺少代码块，程序在文件结束时还没等到缩进的语句。`,
        '在这个冒号后面换行并缩进 4 个空格，补上这一分支要执行的代码。',
        ['indent', 'if'], 'high', targetLine);
    }
    if (BARE_ELSE_RE.test(prev)) {
      return base('SyntaxError', '语法错误 · 代码块缺少内容',
        `第 ${targetLine} 行只有 ${prev.trim()}，下面没有对应的代码块。`,
        '在 else: 下面换行缩进，补上条件不成立时要执行的语句。',
        ['if', 'indent'], 'high', targetLine);
    }
    return base('SyntaxError', '语法错误 · 代码意外结束',
      `程序读到第 ${targetLine} 行后意外结束：可能还有括号、引号或代码块没有写完。`,
      '从最后一行往回检查：括号是否成对、引号是否闭合、冒号后面是否还有缩进的代码。',
      ['indent'], 'medium', targetLine);
  }

  const prevIdx = (() => {
    for (let i = idx - 1; i >= 0; i--) if (lines[i].trim()) return i;
    return -1;
  })();
  const prev = prevIdx >= 0 ? lines[prevIdx] : '';

  // 语句体没有缩进：上一行以冒号结尾，这一行却顶格
  if (prev && BLOCK_END_RE.test(prev) && indentOf(prev) >= indentOf(cur) && cur.trim()) {
    return base('IndentationError', '缩进错误 · 代码块没有缩进',
      `第 ${prevIdx + 1} 行以冒号结束，说明下面要开始一个代码块；但第 ${targetLine} 行没有缩进，Python 认为它不属于这个代码块。`,
      '把这一行（以及同属该块的后续行）行首缩进 4 个空格，保持整块缩进一致。',
      ['indent', 'for'], 'high', targetLine, 1);
  }

  // 意外缩进：这一行有缩进，上一行却不是代码块开头
  if (cur.trim() && indentOf(cur) > 0 && prev.trim() && !BLOCK_END_RE.test(prev) && indentOf(prev) === 0
      && !/^\s*(elif|else|except|finally)\b/.test(cur)) {
    return base('IndentationError', '缩进错误 · 多出了缩进',
      `第 ${targetLine} 行比上一行多缩进了一层，但上一行并不是 if/for/def 之类的代码块开头。`,
      '取消这一行行首多余的缩进，让它和上一行对齐。',
      ['indent'], 'medium', targetLine, 1);
  }

  // 漏冒号
  if (KEYWORD_RE.test(cur) && !BLOCK_END_RE.test(cur)) {
    const kw = cur.trim().split(/\s+/)[0];
    return base('SyntaxError', '语法错误 · 缺少冒号',
      `第 ${targetLine} 行的 ${kw} 语句末尾缺少英文冒号“:”，Python 无法判断代码块从哪里开始。`,
      `在这一行末尾补上英文冒号 :（注意不是中文冒号），下一行再缩进写代码块。`,
      ['if'], 'high', targetLine, cur.length + 1);
  }

  // 条件里用了赋值号
  const assign = cur.match(/\b(if|elif|while)\b[^:\n]*?([^=!<>+\-*/%])=([^=]|$)/);
  if (assign) {
    const upto = cur.indexOf('=', cur.indexOf(assign[1]));
    return base('SyntaxError', '语法错误 · 把赋值写进了条件',
      `第 ${targetLine} 行的条件里用了单个 “=”；在 Python 里它是赋值，判断相等必须用 “==”。`,
      '把条件里的 = 改成 ==，再确认两侧的值类型一致。',
      ['compare', 'if'], 'high', targetLine, upto + 1);
  }

  // 冒号后面没有内容
  if (BLOCK_END_RE.test(cur)) {
    const next = lines.slice(idx + 1).find(l => l.trim());
    if (next === undefined || indentOf(next) <= indentOf(cur)) {
      return base('SyntaxError', '语法错误 · 代码块缺少内容',
        `第 ${targetLine} 行的冒号后面没有缩进的代码块，Python 期待至少一行属于它的语句。`,
        '在这行下面换行缩进 4 个空格，补上要执行的语句。',
        ['indent', 'if'], 'high', targetLine, cur.length + 1);
    }
  }

  return base('SyntaxError', '语法错误 · 无效语法',
    `第 ${targetLine} 行的写法不符合 Python 语法。解释器只能指出位置，具体原因需要对照这一行的结构检查。`,
    '逐项核对这一行：关键字拼写、括号与引号是否成对、冒号是否缺失、是否把中文标点当成了代码符号。',
    ['print'], 'low', targetLine, 1);
}

// ---------- 运行时错误元数据 ----------

interface RuntimeMeta {
  title: string;
  knowledge: string[];
  cause: (msg: string) => string;
  fix: string;
}

const RUNTIME_META: Record<string, RuntimeMeta> = {
  NameError: {
    title: '运行时错误 · 名字未定义',
    knowledge: ['variable'],
    cause: (msg) => {
      const m = msg.match(/name '([^']+)'/);
      return m
        ? `代码里用到了名字「${m[1]}」，但执行到这一行时它还没有被赋值，或者拼写/大小写和定义处不一致。`
        : '代码使用了一个尚未定义的名字：可能忘了先赋值，也可能拼写不一致。';
    },
    fix: '先确认这个名字在哪儿定义、拼写和大小写是否完全一致；如果它应该由某段代码产生，检查那段代码是否真的执行到了。',
  },
  UnboundLocalError: {
    title: '运行时错误 · 局部变量未赋值',
    knowledge: ['variable', 'return'],
    cause: () => '函数内部先使用了变量，之后才给它赋值；Python 因此把它当成局部变量，读取时还没有值。',
    fix: '把赋值语句移到使用之前，或检查是否漏掉了某个分支里的赋值。',
  },
  TypeError: {
    title: '运行时错误 · 类型不匹配',
    knowledge: ['parameter', 'string', 'logic'],
    cause: (msg) => msg.includes('unsupported types')
      ? '参与运算的两个值类型不同（例如字符串和数字直接相加），Python 不会自动转换。'
      : msg.includes('argument')
        ? '函数收到的参数个数或类型与定义不一致。'
        : '某个操作拿到的值类型不符合要求。',
    fix: '打印或查看参与运算的值，确认它们都是期望的类型；需要时用 str() / int() 明确转换，并核对函数参数个数。',
  },
  ValueError: {
    title: '运行时错误 · 值不符合要求',
    knowledge: ['try', 'string'],
    cause: (msg) => msg.includes('invalid syntax for integer') || msg.includes('invalid literal')
      ? '转换函数收到了无法解析的内容（例如把 "abc" 转成整数）。'
      : '函数收到了类型正确、但内容不合法的值。',
    fix: '在转换前先判断内容是否合法，或用 try/except 捕获并给一个默认值。',
  },
  IndexError: {
    title: '运行时错误 · 索引越界',
    knowledge: ['list'],
    cause: () => '访问的下标超出了序列的有效范围。列表索引从 0 开始，最后一个元素的下标是 len(列表) - 1。',
    fix: '检查下标来源：如果来自循环，确认循环范围没多走一步；取最后一个元素可以用 -1。',
  },
  KeyError: {
    title: '运行时错误 · 键不存在',
    knowledge: ['dict'],
    cause: (msg) => {
      const key = msg.trim();
      return key
        ? `字典里没有键「${key.replace(/^'|'$/g, '')}」，直接取值就会抛错。`
        : '字典里没有要读取的键。';
    },
    fix: '先用 in 判断键是否存在，或改用 get(键, 默认值) 安全取值。',
  },
  ZeroDivisionError: {
    title: '运行时错误 · 除数为零',
    knowledge: ['compare', 'logic'],
    cause: () => '除法或取余运算的右边是 0。这个 0 可能来自没有数据的列表长度，或某个未被赋值的统计量。',
    fix: '在做除法前判断除数是否为 0，必要时先给出默认结果。',
  },
  AttributeError: {
    title: '运行时错误 · 属性或方法不存在',
    knowledge: ['parameter', 'return'],
    cause: (msg) => {
      const m = msg.match(/'([^']+)' object has no attribute '([^']+)'/);
      return m
        ? `类型 ${m[1]} 没有名为「${m[2]}」的属性或方法：可能拼写错了，也可能把方法名当成了属性。`
        : '对象上不存在这个属性或方法。';
    },
    fix: '核对方法名拼写；调用方法要带括号，只写方法名拿到的是方法对象本身。',
  },
  ImportError: {
    title: '运行时错误 · 模块导入失败',
    knowledge: ['variable'],
    cause: () => '要导入的模块不在维修终端允许的模块清单内，或模块名拼写有误。',
    fix: '本题不需要额外模块；如果确实要用，先确认模块在允许清单（math / random / time / statistics / datetime / json）里。',
  },
  ModuleNotFoundError: {
    title: '运行时错误 · 找不到模块',
    knowledge: ['variable'],
    cause: () => '导入的模块在当前运行环境里不存在。',
    fix: '检查模块名拼写；优先用题目已教的内置能力完成。',
  },
  RecursionError: {
    title: '运行时错误 · 递归过深',
    knowledge: ['return', 'parameter'],
    cause: () => '函数不断调用自己，始终没有命中结束条件，调用层级超出了上限。',
    fix: '检查递归的终止条件：是否存在一个分支不继续调用自己，并且一定会被执行到。',
  },
  RuntimeError: {
    title: '运行时错误 · 执行失败',
    knowledge: ['logic'],
    cause: (msg) => msg.includes('recursion') || msg.includes('maximum recursion')
      ? '递归没有在有限层内结束。'
      : '程序在执行中主动抛出了错误。',
    fix: '从报错行往上检查最近一次函数调用与循环，确认终止条件能成立。',
  },
  OverflowError: {
    title: '运行时错误 · 数值溢出',
    knowledge: ['logic'],
    cause: () => '计算结果超出了该类型能表示的范围。',
    fix: '检查是否有无限增长的累加或过大的指数运算。',
  },
  AssertionError: {
    title: '运行时错误 · 断言失败',
    knowledge: ['compare'],
    cause: () => 'assert 后面的条件被判断为假。',
    fix: '检查这个断言想保证的条件，以及它依赖的变量当前值。',
  },
};

// ---------- MIRA 台词 ----------

const MIRA_LINES: Record<string, string[]> = {
  syntax: [
    'R-07，检测到一处语法异常。代码结构有偏差，先看第 {line} 行——语句本身还没写完整。',
    '别急，这是结构层面的问题，不是你的思路错了。第 {line} 行附近有一个符号或缩进让解析器停住了。',
    '终端在解析阶段就退出了。先把第 {line} 行当作重点，检查它和上一行的关系。',
  ],
  NameError: [
    '系统找不到你引用的那个名字。它可能还没被赋值，也可能是拼写和定义处不一样。',
    '变量引用异常。先确认这个名字在哪里第一次出现、又在哪里被使用。',
    '我查了一下，这个名字在执行到第 {line} 行时还不存在——顺序或拼写，二者必有一个问题。',
  ],
  TypeError: [
    '类型对不上。两个值看起来都能用，但它们的类型不允许这样做运算。',
    '操作数类型异常。先分别确认左右两边到底是什么类型。',
    '这类错误通常藏得很深：值是对的，类型不是。第 {line} 行附近值得逐项核对。',
  ],
  ValueError: [
    '值不合要求。函数收到了内容无法解析的数据，先看看转换前的原值长什么样。',
    '转换失败。不是语法问题，是数据本身不合法，需要兜底。',
  ],
  IndexError: [
    '索引越界了。记住列表从 0 开始，最后一个位置是长度减一。',
    '你访问的位置超出了序列范围。检查下标是怎么算出来的。',
  ],
  KeyError: [
    '字典里没有这个键。先用 in 探一下，或者用 get() 给个默认值。',
    '读取了一个不存在的键——键名拼写和数据结构都值得核对。',
  ],
  ZeroDivisionError: [
    '除数是 0。它可能来自空列表的长度，或一个还没算出来的统计值。',
    '除零异常。在除法之前，先确认分母真的不是 0。',
  ],
  AttributeError: [
    '对象上没有这个属性或方法。方法要带括号调用，属性名要拼写正确。',
    '属性访问失败。你操作的对象类型，可能和你以为的不一样。',
  ],
  ImportError: [
    '这个模块不在维修终端的允许清单里。本题应该不需要额外导入。',
    '导入被拒绝。先确认题目要求的能力是否用内置语法就能完成。',
  ],
  output: [
    '代码跑通了，只是结果和任务要求不一致。这是输出层面的问题，不是崩溃。',
    '没有报错，但判题没通过。先把你的输出和「正确行为」逐字对照一遍。',
    '逻辑看起来能跑，但结果对不上。注意空格、中文标点、大小写和输出顺序。',
  ],
  logic: [
    '代码能运行，但计算结果和预期不一致。我们检查一下条件判断的执行路径。',
    '测试没有全部通过。这类问题通常出在边界值、循环次数或返回值上。',
    '没有异常，说明语法没问题；问题在逻辑。按任务目标的例子手动走一遍代码。',
  ],
  timeout: [
    '程序运行超时了。检查循环条件是否最终会变成假。',
    '执行时间超过安全上限，已被强制终止。重点看 while 和嵌套循环。',
  ],
  judge: [
    '判题引擎没有拿到完整结果，可能是程序提前退出。先让代码能完整跑完。',
  ],
  ok: [
    '很好！这次你自己找到了问题所在，代码逻辑已经恢复正常。',
    '通过了。记住刚才的修改方式——下次遇到同类结构，你会更快。',
    '修复确认。你的代码和判题结果一致，继续下一个任务吧。',
  ],
  unknown: [
    '我暂时无法确定具体原因。先把终端里的完整报错读一遍，再逐步缩小范围。',
    '信息不足，我不会乱猜。你可以先运行一次，让错误信息更完整一些。',
  ],
};

function pickLine(lines: string[] | undefined, seed: number): string {
  if (!lines || lines.length === 0) return '';
  const i = Math.abs(Math.floor(seed)) % lines.length;
  return lines[i];
}

/** 连续失败时的追加安抚（不重复同一句） */
const MIRA_STREAK = [
  '别着急，R-07。错误日志已经保留下来，我们可以逐步缩小问题范围。',
  '同一种错误又出现了。先别改代码，读一遍提示里的第二层，再动手。',
  '你已经连续卡在同一个点上了。把这一行单独拿出来，用最小例子试一次。',
];

// ---------- 组装诊断 ----------

function lineText(lines: string[], line: number | null): string {
  if (typeof line !== 'number' || line < 1 || line > lines.length) return '';
  const t = lines[line - 1].trim();
  return t.length > 120 ? t.slice(0, 120) + '…' : t;
}

function knowledgeFor(level: LevelDef, ids: string[]): string[] {
  const known = ids.filter(id => !!knowledgeById(id));
  const inLevel = known.filter(id => level.knowledge.includes(id));
  const rest = known.filter(id => !level.knowledge.includes(id));
  const merged = [...inLevel, ...rest];
  return merged.length > 0 ? merged.slice(0, 3) : level.knowledge.slice(0, 2);
}

function withLine(template: string, line: number | null): string {
  return template.replace(/\{line\}/g, typeof line === 'number' ? String(line) : '?');
}

function miraFor(kind: DiagKind, errorType: string, line: number | null, streak: number): string {
  const key = kind === 'runtime' ? (errorType || 'RuntimeError') : kind === 'syntax' ? 'syntax' : kind;
  const bank = MIRA_LINES[key] || MIRA_LINES[errorType] || MIRA_LINES.unknown;
  let text = withLine(pickLine(bank, streak + (line || 0)), line);
  if (streak >= 3) text += ' ' + pickLine(MIRA_STREAK, streak);
  return text;
}

function baseDiag(p: Partial<Diagnosis> & { kind: DiagKind; errorType: string; title: string }): Diagnosis {
  return {
    kind: p.kind,
    errorType: p.errorType,
    title: p.title,
    line: p.line ?? null,
    column: p.column ?? null,
    snippet: p.snippet ?? '',
    rawMessage: p.rawMessage ?? '',
    reason: p.reason ?? '',
    knowledge: p.knowledge ?? [],
    layers: p.layers ?? ['', '', ''],
    mira: p.mira ?? '',
    confidence: p.confidence ?? 'low',
    judged: p.judged ?? false,
    signature: '',
  };
}

function finish(d: Diagnosis): Diagnosis {
  d.signature = [d.kind, d.errorType, d.line ?? '-', d.reason.slice(0, 24)].join('|');
  return d;
}

function syntaxDiag(input: DiagnoseInput, reportedLine: number | null): Diagnosis {
  const { level, code } = input;
  const lines = code.split(/\r?\n/);
  const analysis = analyzeSyntax(code, reportedLine);
  const line = analysis.line;
  const knowledge = knowledgeFor(level, analysis.knowledge);
  const snippet = lineText(lines, line);
  const kind: DiagKind = 'syntax';
  const errorType = analysis.subtype === 'TabError' ? 'TabError'
    : analysis.subtype === 'IndentationError' ? 'IndentationError'
      : 'SyntaxError';
  const d = baseDiag({
    kind,
    errorType,
    title: analysis.title,
    line,
    column: analysis.column,
    snippet,
    rawMessage: input.run.error ? input.run.error.type + ': ' + input.run.error.message : 'SyntaxError',
    reason: analysis.reason,
    knowledge,
    confidence: analysis.confidence,
    layers: [
      `先定位到第 ${line ?? '?'} 行，确认这一行的语句结构是否完整（关键字、括号、冒号、缩进）。`,
      analysis.reason,
      analysis.fix,
    ],
    mira: miraFor(kind, errorType, line, input.streak ?? 1),
  });
  return finish(d);
}

function runtimeDiag(input: DiagnoseInput): Diagnosis {
  const { level, code, run } = input;
  const err = run.error;
  const lines = code.split(/\r?\n/);
  const frames = userFrames(run.traceback);
  const frame = frames.length > 0 ? frames[frames.length - 1] : null;
  const line = frame && frame.line && frame.line <= lines.length ? frame.line : (err?.line && err.line <= lines.length ? err.line : null);
  const type = err?.type || 'RuntimeError';
  const msg = err?.message || '';
  const meta = RUNTIME_META[type] || RUNTIME_META.RuntimeError;
  const snippet = lineText(lines, line);
  const reason = meta.cause(msg);
  const d = baseDiag({
    kind: 'runtime',
    errorType: type,
    title: meta.title,
    line,
    column: null,
    snippet,
    rawMessage: type + ': ' + msg,
    reason,
    knowledge: knowledgeFor(level, meta.knowledge),
    confidence: line ? 'high' : 'medium',
    layers: [
      line
        ? `运行时崩溃发生在第 ${line} 行。先看这一行的变量和数据是否和你想的一样。`
        : '程序在运行时崩溃了。先在出错语句前打印关键变量，确认执行到哪一步。',
      reason,
      meta.fix,
    ],
    mira: miraFor('runtime', type, line, input.streak ?? 1),
  });
  return finish(d);
}

function timeoutDiag(input: DiagnoseInput): Diagnosis {
  const { level, code } = input;
  const lines = code.split(/\r?\n/);
  const loopLine = (() => {
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(while|for)\b/.test(lines[i])) return i + 1;
    }
    return null;
  })();
  const d = baseDiag({
    kind: 'timeout',
    errorType: 'Timeout',
    title: '执行超时',
    line: loopLine,
    snippet: lineText(lines, loopLine),
    rawMessage: '执行超过 5 秒，已被安全机制强制终止',
    reason: '程序在 5 秒内没有结束。最常见的原因是循环条件永远为真，或者循环次数远比预期大。',
    knowledge: knowledgeFor(level, ['while', 'for']),
    confidence: 'high',
    layers: [
      '先找出循环：while 的条件里是否有变量会在循环体内被修改？',
      '如果条件始终为真（或 for 的范围过大），循环就永远不会结束。',
      '在循环体里加一次 print 观察变量，或先把范围改小验证逻辑，再恢复。',
    ],
    mira: miraFor('timeout', 'Timeout', loopLine, input.streak ?? 1),
  });
  return finish(d);
}

/** 从代码里找可验证的可疑写法（逻辑错误只能给「可能原因」） */
export function logicSignals(code: string, level: LevelDef): string[] {
  const ids = new Set(level.knowledge);
  const out: string[] = [];
  const has = (s: string) => code.includes(s);

  if (ids.has('compare')) {
    if (/[^<>!=]>[^=]/.test(code) && !has('>=')) {
      out.push('代码里用了 >，但没有出现 >=：如果任务要求「达到 / 不低于」某个值，临界值会被漏掉。');
    }
    if (/[^<>!=]<[^=]/.test(code) && !has('<=')) {
      out.push('代码里用了 <，但没有出现 <=：注意任务是否包含边界值。');
    }
    if (/if\s+[^:\n]*[^=!<>]=[^=]/.test(code)) {
      out.push('条件里出现了单个 =：那是在赋值，判断相等要用 ==。');
    }
  }
  if (ids.has('for')) {
    const m = code.match(/range\(\s*(\d+)\s*\)/);
    if (m) out.push(`range(${m[1]}) 用的是固定次数；如果处理的是列表，通常应该用 len(列表)。`);
    if (/range\(\s*len\([^)]*\)\s*-\s*1\s*\)/.test(code)) {
      out.push('range(len(x) - 1) 会少遍历最后一个元素，确认这是不是你要的效果。');
    }
    if (/range\(\s*1\s*,\s*len\(/.test(code)) {
      out.push('range(1, len(x)) 会跳过第一个元素，注意任务是否要从头处理。');
    }
  }
  if (ids.has('while')) {
    if (/while\s+True\s*:/.test(code) && !has('break')) out.push('while True 里没有 break，循环可能没有出口。');
    const body = code.split(/while[^:]*:/)[1] || '';
    if (/while\b/.test(code) && !/\b(count|i|index|idx)\s*(\+=|=)/.test(body)) {
      out.push('while 循环体里似乎没有更新计数变量，条件可能永远成立。');
    }
  }
  if (ids.has('return')) {
    if (/def\s+\w+\([^)]*\)\s*:/.test(code) && !/\breturn\b/.test(code)) {
      out.push('函数里没有 return，调用结果会是 None。');
    }
  }
  if (ids.has('list')) {
    if (/\bfor\s+\w+\s+in\s+range\(/.test(code) && /\[\s*\w+\s*\+\s*1\s*\]/.test(code)) {
      out.push('循环里用「下标 + 1」取元素时要注意最后一次会越界。');
    }
  }
  if (ids.has('logic')) {
    if (/\band\b/.test(code) && !/\bor\b/.test(code) && /报警|告警|同时|全部|都/.test(level.behavior)) {
      out.push('任务描述提到「同时成立」时要用 and；如果条件本该二选一，才用 or。');
    }
  }
  return out;
}

function judgeDiag(input: DiagnoseInput): Diagnosis {
  const { level, code, verdict } = input;
  const v = verdict!;
  const lines = code.split(/\r?\n/);
  const failed = v.checks.filter(c => !c.ok && !/测试执行出错/.test(c.name));
  const first = failed[0];
  const detail = failed.map(c => c.detail).filter(Boolean).join('；');
  const stdoutJudge = level.judge.judgeKind === 'stdout';
  const kind: DiagKind = stdoutJudge ? 'output' : 'logic';
  const signals = logicSignals(code, level);
  const failedNames = failed.map(c => '「' + c.name + '」').join('、');

  const reason = stdoutJudge
    ? (detail || '程序能正常运行，但输出内容与任务要求不一致。')
    : (signals[0]
      ? '测试用例没有全部通过。可能的逻辑问题：' + signals[0]
      : `测试项 ${failedNames || '若干检查'} 的结果与期望不符。代码能跑通，说明问题在计算过程或返回值上。`);

  const layers: [string, string, string] = stdoutJudge
    ? [
      '代码已经跑通，问题出在「输出」而不是语法。先对照「正确行为」，确认要打印的每一行文字。',
      reason,
      '逐字对照期望输出：空格、中文标点、大小写、顺序都算差异；改完先点「运行」自查，再提交。',
    ]
    : [
      `没有崩溃，说明语法没问题。重点看${failedNames || '未通过的测试项'}对应的逻辑：条件、循环、返回值。`,
      reason,
      signals.length > 1
        ? '按提示逐项排除：' + signals.slice(0, 3).join(' ')
        : '用任务目标里的例子手动走一遍：代入一组输入，逐步写出每个变量的值，再和期望对比。',
    ];

  const d = baseDiag({
    kind,
    errorType: stdoutJudge ? '输出结果不匹配' : '逻辑错误',
    title: stdoutJudge ? '结果不匹配 · 输出有差异' : '逻辑错误 · 测试未通过',
    line: null,
    snippet: '',
    rawMessage: failed.map(c => (c.ok ? '' : '✗ ' + c.name + (c.detail ? ' —— ' + c.detail : ''))).filter(Boolean).join('\n'),
    reason,
    knowledge: knowledgeFor(level, stdoutJudge ? ['print', 'string'] : ['if', 'for', 'return', 'compare']),
    confidence: signals.length > 0 ? 'medium' : 'low',
    layers,
    mira: miraFor(kind, kind, null, input.streak ?? 1),
    judged: true,
  });
  return finish(d);
}

function okDiag(input: DiagnoseInput): Diagnosis {
  const { level, verdict } = input;
  const judged = !!verdict;
  const d = baseDiag({
    kind: 'ok',
    errorType: '通过',
    title: judged ? '判题通过' : '运行成功',
    line: null,
    snippet: '',
    rawMessage: judged ? '全部测试通过' : '进程正常退出（exit 0）',
    reason: judged
      ? '代码通过了全部真实判题测试。'
      : '代码成功运行。注意：运行只预览结果，不计入提交次数，也没有经过正式判题。',
    knowledge: knowledgeFor(level, level.knowledge),
    confidence: 'high',
    layers: [
      judged ? '这次修复已经通过判题。' : '程序正常结束，可以先检查输出是否符合任务目标。',
      judged ? '判题依据是真实执行结果与测试项，不是提示系统。' : '若结果与「正确行为」不一致，问题属于输出或逻辑层面。',
      judged ? '可以继续下一关，或用更简洁的写法再试一次。' : '确认无误后点击「提交修复」进行正式判题。',
    ],
    mira: miraFor('ok', 'ok', null, input.streak ?? 1),
    judged,
  });
  return finish(d);
}

function judgeErrorDiag(input: DiagnoseInput): Diagnosis {
  const { level } = input;
  const d = baseDiag({
    kind: 'judge',
    errorType: 'JudgeError',
    title: '判题未完成',
    rawMessage: '判题引擎未能读取到测试结果（程序可能提前退出）',
    reason: '判题模块没有拿到测试结果，通常是因为代码在测试执行前就结束了，或者顶层代码里调用了 sys.exit 之类的操作。',
    knowledge: knowledgeFor(level, ['return', 'print']),
    confidence: 'medium',
    layers: [
      '判题结果缺失，先让代码完整执行到文件末尾。',
      '检查是否有提前结束程序的语句，或把代码写在了函数里却从未调用。',
      '先点「运行」确认没有任何异常，再提交。',
    ],
    mira: miraFor('judge', 'JudgeError', null, input.streak ?? 1),
    judged: true,
  });
  return finish(d);
}

/**
 * 主入口：根据真实执行结果 +（可选）判题结果生成诊断。
 * 诊断永远不改变判题结论；verdict 存在时以 verdict 为准。
 */
export function diagnoseRun(input: DiagnoseInput): Diagnosis {
  const { run, verdict } = input;

  if (run.timedOut || verdict?.timedOut) return timeoutDiag(input);

  if (!run.ok) {
    const type = run.error?.type || '';
    if (type === 'SyntaxError' || type === 'IndentationError' || type === 'TabError') {
      const frames = userFrames(run.traceback);
      const reported = frames.length > 0 ? frames[frames.length - 1].line : (run.error?.line ?? null);
      return syntaxDiag(input, reported);
    }
    return runtimeDiag(input);
  }

  if (!verdict) return okDiag(input);
  if (verdict.passed) return okDiag(input);
  if (verdict.error?.type === 'JudgeError') return judgeErrorDiag(input);
  return judgeDiag(input);
}

/** 面板展示用：错误分类的短标签 */
export function kindLabel(kind: DiagKind): string {
  switch (kind) {
    case 'syntax': return '语法错误';
    case 'runtime': return '运行时错误';
    case 'output': return '输出不匹配';
    case 'logic': return '逻辑错误';
    case 'timeout': return '执行超时';
    case 'judge': return '判题异常';
    case 'ok': return '运行成功';
    default: return '待分析';
  }
}

/** 连续触发同一错误时，面板默认展开到第几层（手动展开另算） */
export function defaultVisibleLayers(streak: number): number {
  return Math.max(1, Math.min(3, Math.floor(streak) || 1));
}
