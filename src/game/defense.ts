// 紧急代码防御任务（纠错者攻击时使用）
import type { RunOutcomeShape } from './types';

export interface DefenseTask {
  id: string;
  title: string;
  threat: string;
  code: string;     // 含 ?? 占位符，玩家需要替换成正确的运算符/语法
  expect: string;   // 防御成功必须包含在输出中的字符串
  word: string;     // 提示玩家填入的东西是什么
}

export const DEFENSE_TASKS: DefenseTask[] = [
  {
    id: 'd1', title: '能量护盾校准',
    threat: '巡逻者放出干扰脉冲，护盾控制指令失效。校准能量判断，让护盾以 20 点能量启动。',
    code: 'energy = 20\n\nif energy ?? 10:\n    print("SHIELD ON")\nelse:\n    print("SHIELD OFF")',
    expect: 'SHIELD ON', word: '比较运算符（如 >=、>）',
  },
  {
    id: 'd2', title: '访问权限校验',
    threat: '防御协议被篡改，访问令牌校验逻辑损坏。修复判断，让合法令牌放行。',
    code: 'access = "granted"\n\nif access ?? "granted":\n    print("ACCESS OK")\nelse:\n    print("ACCESS DENIED")',
    expect: 'ACCESS OK', word: '等于比较运算符（==）',
  },
  {
    id: 'd3', title: '警报洪流拦截',
    threat: '大量入侵警报涌入。用循环逐个拦截，保护意识核心的数据链路。',
    code: 'alerts = [1, 2, 3]\n\nfor alert ?? alerts:\n    print("BLOCK", alert)',
    expect: 'BLOCK 3', word: '遍历列表用的关键字 in',
  },
  {
    id: 'd4', title: '临界值重校准',
    threat: '纠错者注入高温伪信号。修正危险判定，浓度达到 90 就必须报警。',
    code: 'danger = 95\n\nif danger ?? 90:\n    print("ALERT!")\nelse:\n    print("SAFE")',
    expect: 'ALERT!', word: '大于或等于的比较运算符（>=）',
  },
];

export const defenseById = (id: string): DefenseTask | undefined => DEFENSE_TASKS.find(d => d.id === id);

/** 防御判题：必须基于真实执行结果 */
export function judgeDefenseResult(r: RunOutcomeShape, task: DefenseTask): { ok: boolean; reason?: string } {
  if (r.timedOut) return { ok: false, reason: '防御代码执行超时。检查是不是写了死循环？' };
  if (!r.ok) return { ok: false, reason: r.error ? r.error.type + ': ' + r.error.message : '代码执行出错' };
  if (!r.stdout.includes(task.expect)) return { ok: false, reason: '程序运行成功，但防御指令没有生效——检查 ?? 位置的代码是否正确。' };
  return { ok: true };
}
