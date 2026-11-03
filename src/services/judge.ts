// 判题引擎：测试注入、结果解析、错误分析、代码安全限制
import type { LevelJudgeSpec, RunOutcomeShape } from '../game/types';

// ---------- 错误分析 ----------
export interface ParsedError { type: string; message: string; line?: number }

/** 解析 Pyodide 抛出的 Python 异常信息（完整 traceback 文本） */
export function parseTraceback(raw: string): ParsedError {
  let text = String(raw || '').trim();
  if (text.startsWith('PythonError: ')) text = text.slice('PythonError: '.length);
  const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim() !== '');
  const codeLineIdx = lines.findIndex(l => l.trim() === 'Traceback (most recent call last):');
  const body = codeLineIdx >= 0 ? lines.slice(codeLineIdx) : lines;

  // 类型与消息：取最后一行形如 "XXXError: message" 的
  let type = 'RuntimeError';
  let message = text;
  for (const ln of body) {
    const m = ln.match(/^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Warning))\s*:\s*(.*)$/);
    if (m) { type = m[1]; message = m[2] || type; }
  }
  // line 取最后一个 "line N" 出现位置
  const lineMatches = [...text.matchAll(/line\s+(\d+)/g)];
  const line = lineMatches.length ? parseInt(lineMatches[lineMatches.length - 1][1], 10) : undefined;
  // 保留错误代码行上下文（SyntaxError 的源码行）
  for (const ln of body) {
    if (/^[^\s]/.test(ln) && !/^(Traceback|File|\s*\^)/.test(ln) && !ln.includes(':')) { message += ' | ' + ln.trim(); break; }
  }
  return { type, message, line };
}

// ---------- 测试注入 ----------
export function buildHarness(checks: { name: string; expr: string }[]): string {
  const body = checks.map(c => '    __nx_assert(' + JSON.stringify(c.name) + ', (' + c.expr + '))').join('\n');
  return [
    '',
    '# ===== NEXUS 自动判题模块（系统注入，请勿修改）=====',
    '__nx_tests = []',
    '',
    'def __nx_assert(n, c):',
    '    __nx_tests.append((n, bool(c)))',
    '',
    'try:',
    body,
    'except Exception as __nx_e:',
    '    __nx_tests.append(("测试执行出错", False, str(__nx_e)))',
    '',
    'import json',
    'print("__NX_MARKER__" + json.dumps(__nx_tests))',
    '',
  ].join('\n');
}

/** 组合用户代码与测试模块（用户代码在前，判题模块在后） */
export function combineWithHarness(code: string, harness: string): string {
  return code.trimEnd() + '\n' + harness;
}

// ---------- 结果解析 ----------
export interface JudgeCheck { name: string; ok: boolean; detail?: string }

/** 从 stdout 中解析 __NX_MARKER__ 标记（取最后一次出现） */
export function parseMarker(stdout: string): JudgeCheck[] | null {
  const lines = stdout.split('\n');
  let last: string | null = null;
  for (const ln of lines) {
    if (ln.startsWith('__NX_MARKER__')) last = ln.slice('__NX_MARKER__'.length);
  }
  if (last === null) return null;
  try {
    const raw: unknown = JSON.parse(last);
    if (!Array.isArray(raw)) return null;
    return raw.map((item: unknown) => {
      if (Array.isArray(item)) {
        const name = String(item[0] ?? '未命名测试');
        const ok = item[1] === true;
        const detail = item.length > 2 ? String(item[2]) : undefined;
        return { name, ok, detail };
      }
      return { name: '未知测试', ok: false };
    });
  } catch {
    return null;
  }
}

/** 过滤掉判题标记行（用于终端展示） */
export function filterMarkerLines(stdout: string): string {
  return stdout.split('\n').filter(l => !l.startsWith('__NX_MARKER__')).join('\n');
}

// ---------- 综合判题 ----------
export interface JudgeVerdict {
  passed: boolean;
  checks: JudgeCheck[];
  error?: ParsedError;
  timedOut?: boolean;
}

export function judgeRun(spec: LevelJudgeSpec, r: RunOutcomeShape): JudgeVerdict {
  if (r.timedOut) return { passed: false, checks: [], timedOut: true };
  if (!r.ok) return { passed: false, checks: [], error: r.error };

  if (spec.judgeKind === 'python') {
    const checks = parseMarker(r.stdout);
    if (!checks || checks.length === 0) {
      return {
        passed: false,
        checks: [],
        error: { type: 'JudgeError', message: '判题引擎未能读取到测试结果（程序可能提前退出）' },
      };
    }
    const errCheck = checks.find(c => c.name === '测试执行出错');
    if (errCheck) {
      // 测试执行出错：保留逐项明细，出错项改名携带具体原因
      const detailed = checks.map(c => c.name === '测试执行出错'
        ? { name: '测试执行出错：' + (c.detail || '用例内部异常'), ok: false }
        : c);
      return { passed: false, checks: detailed };
    }
    return { passed: checks.every(c => c.ok), checks };
  }

  // stdout 判题
  const checks: JudgeCheck[] = [];
  for (const sc of spec.stdoutChecks || []) {
    let ok = true;
    let detail: string | undefined;
    if (sc.contains) {
      const missing = sc.contains.filter(s => !r.stdout.includes(s));
      if (missing.length > 0) { ok = false; detail = diffHint(r.stdout, missing[0]); }
    }
    if (ok && sc.notContains) {
      const hit = sc.notContains.find(s => r.stdout.includes(s));
      if (hit !== undefined) { ok = false; detail = '输出中不应出现 "' + hit + '"'; }
    }
    if (ok && sc.lines) {
      const actual = r.stdout.split('\n').map(l => l.trim()).filter(Boolean);
      let idx = 0;
      for (const want of sc.lines) {
        const found = actual.indexOf(want, idx);
        if (found < 0) {
          ok = false;
          detail = '期望按顺序输出这些行：' + sc.lines.map(l => '"' + l + '"').join(' → ') + '；实际输出：' + (actual.length ? actual.map(l => '"' + l + '"').join(' → ') : '（无输出）');
          break;
        }
        idx = found + 1;
      }
    }
    checks.push({ name: sc.name, ok, detail });
  }
  return { passed: checks.length > 0 && checks.every(c => c.ok), checks };
}

/** 面向零基础的差异说明：告诉玩家「差在哪」 */
function diffHint(actualRaw: string, want: string): string {
  const a = actualRaw.replace(/\n+$/, '');
  const flat = a.replace(/\s+/g, '');
  const wantFlat = want.replace(/\s+/g, '');
  if (/[，。！？：；（）【】“”‘’、]/.test(a)) {
    return '输出里用了中文标点（，！等），请改成英文标点（, !）';
  }
  if (flat === wantFlat) {
    // 内容一致，只差空白 —— 指出缺空格的位置
    for (let i = 0; i < want.length; i++) {
      if (a[i] !== want[i]) {
        return '只差空格：期望 "' + want + '"，你的输出 "' + a + '"（第 ' + (i + 1) + ' 个字符处）';
      }
    }
    return '只差空格：期望 "' + want + '"，你的输出 "' + a + '"';
  }
  return '实际输出 "' + (a.length > 60 ? a.slice(0, 60) + '…' : a) + '"，需要包含 "' + want + '"';
}

// ---------- 安全限制 ----------
export const ALLOWED_MODULES = ['math', 'random', 'time', 'statistics', 'datetime', 'json'];

export function stripStringsAndComments(code: string): string {
  return code
    .replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, ' ')
    .replace(/(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/g, ' ')
    .replace(/#[^\n]*/g, ' ');
}

export function checkUserCode(code: string): { allowed: boolean; reason?: string } {
  if (code.length > 4000) return { allowed: false, reason: '代码长度超过限制（4000 字符）。请精简后重试。' };
  const stripped = stripStringsAndComments(code);
  const importRe = /\b(?:import|from)\s+([A-Za-z_][A-Za-z0-9_.]*)/g;
  let m: RegExpExecArray | null;
  const bad: string[] = [];
  while ((m = importRe.exec(stripped)) !== null) {
    const head = m[1].split('.')[0];
    if (!ALLOWED_MODULES.includes(head) && !bad.includes(m[1])) bad.push(m[1]);
  }
  if (bad.length > 0) {
    return {
      allowed: false,
      reason: '维修终端模块白名单限制：' + bad.join('、') + ' 不在允许列表中。当前允许：' + ALLOWED_MODULES.join(', '),
    };
  }
  if (/\b(?:eval|exec|compile|input|open|__import__|globals|locals|vars)\s*\(/.test(stripped)) {
    return { allowed: false, reason: '该指令在维修终端中被安全策略禁止（终端不开放文件、求值、交互输入等高风险操作）。' };
  }
  return { allowed: true };
}
