// MIRA 本地提示引擎（无需 API Key；预留真实大模型接口）
import type { LevelDef } from '../game/levels';

export const HINT_MAX = 3;

export function miraLevelHint(level: LevelDef, used: number): { text: string; level: number; exhausted: boolean } {
  if (used >= HINT_MAX) {
    return {
      text: '我已经给出全部提示了。试着把终端报错信息里的错误类型和行号读出来——答案往往就在那里。',
      level: HINT_MAX,
      exhausted: true,
    };
  }
  return { text: level.hints[used], level: used + 1, exhausted: false };
}

const ERROR_EXPLAIN: Record<string, string> = {
  SyntaxError: '是语法错误。检查这几样：括号和引号是否成对闭合、if/for 语句末尾的英文冒号、以及语句里的标点是否都用了英文符号。',
  IndentationError: '是缩进错误。Python 用行首空格表示代码层级——检查 for/if 下面的代码是否缩进了一致的空格数。',
  NameError: '是名字错误。程序用了一个还没有定义（或拼写不一致）的名字。对比定义处和使用处的拼写与大小写。',
  TypeError: '是类型错误。操作的值的类型不符合预期，比如对字符串做了算术运算。',
  IndexError: '是索引越界。列表索引超出了范围——记住索引起点从 0 开始。',
  ValueError: '是值错误。某个函数收到了不符合要求的数值。',
  ZeroDivisionError: '是除数为零。检查除法运算的分母是否可能为 0。',
};

export function miraOnError(type: string | undefined): string {
  if (type && ERROR_EXPLAIN[type]) return ERROR_EXPLAIN[type];
  return '程序没能正常运行。看看终端里标红的错误信息——错误类型和行号是最重要的线索。';
}

export function miraOnFail(n: number, tolerance: number): { tone: 'normal' | 'hint' | 'danger'; text: string } {
  const rel = tolerance - n;
  if (rel < 0) return { tone: 'danger', text: '警告：提交失败次数已超过容错上限。纠错者正在锁定你的数据坐标……' };
  if (rel === 0) return { tone: 'danger', text: '这是容错次数内的最后一次机会，R-07。再失败一次，纠错者就会锁定你。冷静下来，重读一遍错误信息。' };
  if (rel === 1) return { tone: 'hint', text: '小心，只剩 1 次容错机会了。需要提示的话可以呼叫我。' };
  return { tone: 'normal', text: '提交未通过。别慌——「运行」不会计入失败次数，先在终端里把代码跑通，再回来提交。' };
}

export function miraOnReplay(): string {
  return '这个任务你已经修复过了。这次不计经验，但可以试试用更简洁的写法。';
}

export function miraOnRespawn(): string {
  return '你的意识已重新载入。当前关卡的代码已重置，容错计数也已清零。慢慢来。';
}
