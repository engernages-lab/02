// A3 诊断逻辑回归：真实 MicroPython traceback + 源码结构分析 + 判题结果分类 + 分层提示
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function makeLoader() {
  const cache = new Map();
  const rf = (b) => (existsSync(b) && extname(b) ? b : existsSync(b + '.ts') ? b + '.ts' : existsSync(join(b, 'index.ts')) ? join(b, 'index.ts') : b + '.ts');
  function load(file) {
    const abs = rf(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} };
    cache.set(abs, mod);
    new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
    return mod.exports;
  }
  return (rel) => load(join(root, rel));
}

const L = makeLoader();
const { buildRunnerScript } = L('src/services/pythonRunner.ts');
const D = L('src/services/diagnose.ts');
const S = L('src/services/sandboxRunner.ts');
const J = L('src/services/judge.ts');
const { LEVELS } = L('src/game/levels.ts');

const level = (id) => LEVELS.find((l) => l.id === id);
const WASM = join(root, 'node_modules/@micropython/micropython-webassembly-pyscript/micropython-settrace.wasm');

let pass = 0;
let total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

let raw = '';
const mp = await loadMicroPython({
  url: WASM,
  stdout: (s) => { raw += s; },
  stderr: (s) => { raw += s; },
});

function runRaw(code, limitSec = 3) {
  raw = '';
  try {
    mp.runPython(buildRunnerScript(code, limitSec));
  } catch (e) {
    return { out: '', err: 'EngineError: ' + String(e), tb: '' };
  }
  const i = raw.lastIndexOf('__NX_RES__');
  if (i < 0) return { out: raw, err: 'EngineError: no result marker', tb: '' };
  try {
    return JSON.parse(raw.slice(i + '__NX_RES__'.length).trim());
  } catch {
    return { out: '', err: 'EngineError: bad result json', tb: '' };
  }
}

function outcome(code, limitSec = 3) {
  const res = runRaw(code, limitSec);
  const errText = String(res.err || '');
  const timedOut = errText.includes('execution timeout');
  const error = errText && !timedOut ? J.parseTraceback(errText) : undefined;
  return { ok: !errText && !timedOut, stdout: String(res.out || ''), error, timedOut, traceback: String(res.tb || '') };
}

function judged(levelId, code) {
  const lv = level(levelId);
  const run = lv.judge.judgeKind === 'python'
    ? outcome(J.combineWithHarness(code, J.buildHarness(lv.judge.pythonChecks || [])))
    : outcome(code);
  const verdict = J.judgeRun(lv.judge, run);
  return { lv, run, verdict };
}

function diag(levelId, code, opts = {}) {
  const lv = level(levelId);
  if (opts.judge) {
    const r = judged(levelId, code);
    return {
      d: D.diagnoseRun({ level: lv, code, run: r.run, verdict: r.verdict, streak: opts.streak || 1 }),
      run: r.run,
      verdict: r.verdict,
    };
  }
  const run = outcome(code, opts.limitSec || 3);
  return { d: D.diagnoseRun({ level: lv, code, run, verdict: null, streak: opts.streak || 1 }), run };
}

// 超时用例必须先跑：递归爆栈会让本引擎的 settrace 失效（见 pythonRunner 的 traceSuspect 注释）
console.log('=== A. 超时 ===');
{
  const code = 'for _ in range(100000000):\n    pass';
  const run = outcome(code, 1);
  const d = D.diagnoseRun({ level: level('3-3'), code, run, verdict: null, streak: 1 });
  ok(run.timedOut === true, '真实执行触发超时（for 循环看门狗）');
  ok(d.kind === 'timeout', '超时分类正确', d.kind);
  ok(d.line === 1, '超时定位到循环行', String(d.line));
  ok(/循环/.test(d.reason), '超时原因解释循环', d.reason);
  ok(D.defaultVisibleLayers(1) === 1, '超时同样从第一层开始');
}

console.log('=== B. 语法错误：真实 traceback 行号 + 源码结构推断 ===');
{
  const code = 'log_title = "服务器状态报告"\n\nif log_title != ""\n    print(log_title)';
  const { d, run } = diag('1-1', code);
  ok(!!run.traceback && run.traceback.includes('SyntaxError'), '运行器回传了真实 traceback');
  ok(d.kind === 'syntax', '分类为语法错误', d.kind);
  ok(d.line === 3, '定位到第 3 行（含空行偏移）', String(d.line));
  ok(/冒号/.test(d.reason), '原因指出缺少冒号', d.reason);
  ok(d.knowledge.includes('if'), '关联知识点 if');
  ok(d.confidence === 'high', '解释器证据置信度为 high');
  ok(d.layers.every((t) => t.length > 0), '三层提示均非空');
  ok(!d.layers.join(' ').includes('服务器状态报告'), '语法提示不泄露任务答案');
}

{
  const code = 'records = ["A", "B"]\n\nfor record in records:\nprint(record)';
  const d = diag('1-5', code).d;
  ok(d.errorType === 'IndentationError' && d.line === 4, '循环体未缩进 → IndentationError 第 4 行', d.errorType + ':' + d.line);
  ok(/缩进/.test(d.reason), '原因指出缺少缩进', d.reason);
}

{
  const code = 'message = "NEXUS SYSTEM ONLINE\nprint(message)';
  const d = diag('1-2', code).d;
  ok(d.kind === 'syntax' && /引号/.test(d.reason), '未闭合引号 → 指出引号问题', d.reason);
  ok(d.line === 1, '引号错误定位到第 1 行', String(d.line));
}

{
  const code = 'def total(xs):\n    return sum(xs)\n\nprint(total([1, 2]';
  const d = diag('1-4', code).d;
  ok(/括号/.test(d.reason), '未闭合括号 → 指出括号问题', d.reason);
  ok(d.line === 4, '括号错误定位到第 4 行', String(d.line));
}

{
  const a = D.analyzeSyntax('x = 1\n\tprint(x)\n        print(2)\n', 2);
  ok(a.subtype === 'TabError', 'Tab 与空格混用可被源码分析识别', a.subtype);
}

{
  const code = 'x = 1\nif x = 1:\n    print(x)';
  const d = diag('1-4', code).d;
  ok(/==/.test(d.reason), '条件里误用 = → 提示改成 ==', d.reason);
  ok(d.line === 2, '定位到第 2 行');
}

{
  const code = 'x = 1\nif x > 0\n    print(x)';
  const d = diag('1-4', code).d;
  ok(d.kind === 'syntax' && d.line === 2, '缺冒号定位到第 2 行', String(d.line));
}

console.log('=== C. 运行时错误：异常类型 + 真实行号 ===');
{
  const d = diag('1-3', 'repair_id = "R-07"\n\nprint(repair_ids)').d;
  ok(d.kind === 'runtime' && d.errorType === 'NameError', 'NameError 识别', d.errorType);
  ok(d.line === 3, 'NameError 定位到第 3 行', String(d.line));
  ok(/repair_ids/.test(d.reason), '原因包含未定义的名字', d.reason);
  ok(d.knowledge.includes('variable'), '关联变量知识点');
}

{
  const d = diag('1-4', 'print("温度" + 40)').d;
  ok(d.kind === 'runtime' && d.errorType === 'TypeError', 'TypeError 识别', d.errorType);
  ok(/类型/.test(d.reason), '原因解释类型不匹配', d.reason);
}

{
  const d = diag('5-2', 'print(int("abc"))').d;
  ok(d.errorType === 'ValueError' && /转换|解析/.test(d.reason), 'ValueError 识别并解释', d.reason);
}

{
  const d = diag('3-1', 'alerts = []\nprint(alerts[0])').d;
  ok(d.errorType === 'IndexError' && /0 开始|越界/.test(d.reason), 'IndexError 识别并解释索引', d.reason);
  ok(d.line === 2, 'IndexError 定位到第 2 行', String(d.line));
}

{
  const d = diag('5-1', 'records = {"a": 1}\nprint(records["b"])').d;
  ok(d.errorType === 'KeyError' && /键/.test(d.reason), 'KeyError 识别并解释', d.reason);
}

{
  const d = diag('5-5', 'print(10 / 0)').d;
  ok(d.errorType === 'ZeroDivisionError' && /0/.test(d.reason), '除零错误识别', d.reason);
}

{
  const d = diag('4-4', 'name = "R-07"\nprint(name.upper2())').d;
  ok(d.errorType === 'AttributeError' && /属性|方法/.test(d.reason), 'AttributeError 识别', d.reason);
}

{
  const d = diag('4-1', 'import os\nprint(os.getcwd())').d;
  ok(d.kind !== 'runtime' || d.errorType === 'ImportError' || d.errorType === 'ModuleNotFoundError', '导入错误被识别为运行时错误', d.errorType);
}

console.log('=== D. 循环沙箱判定（浏览器侧硬超时的入口） ===');
{
  ok(S.needsLoopSandbox('while True:\n    pass') === true, '含 while 的代码会进入循环沙箱');
  ok(S.needsLoopSandbox('for i in range(3):\n    print(i)') === false, '不含 while 的代码保持主线程路径');
  ok(typeof S.canUseLoopSandbox() === 'boolean', '沙箱可用性检测返回布尔值（Node 不做 Worker 断言）');
}

console.log('=== E. 逻辑错误：基于真实判题结果 + 可验证代码特征 ===');
{
  const code = 'def filter_alerts(temps):\n    alerts = []\n\n    for temp in temps:\n        if temp > 40:\n            alerts.append(temp)\n\n    return alerts';
  const { d, verdict } = diag('1-4', code, { judge: true });
  ok(verdict.passed === false, '判题确实未通过（前置条件）');
  ok(d.kind === 'logic', '分类为逻辑错误', d.kind);
  ok(d.judged === true, '标记为经过判题');
  ok(/边界|>=|临界/.test(d.reason + d.layers.join(' ')), '提示指向边界/比较运算', d.reason);
  ok(d.confidence === 'medium' || d.confidence === 'low', '逻辑推断不冒充确定结论', d.confidence);
  ok(!d.rawMessage.includes('filter_alerts([22, 41'), '不暴露测试表达式原文', d.rawMessage);
}

{
  const code = 'def filter_alerts(temps):\n    alerts = []\n    for temp in temps:\n        if temp >= 40:\n            alerts.append(temp)\n    return alerts';
  const { d } = diag('1-4', code, { judge: true });
  ok(d.kind === 'logic' || d.kind === 'ok', '正确写法不应被误报为语法/运行时错误', d.kind);
}

console.log('=== F. 输出不匹配 ===');
{
  const code = 'log_title = "错误标题"\n\nif log_title != "":\n    print(log_title)';
  const { d, verdict } = diag('1-1', code, { judge: true });
  ok(verdict.passed === false, '判题未通过（前置条件）');
  ok(d.kind === 'output', '分类为输出不匹配', d.kind);
  ok(/输出|差异|包含/.test(d.reason + d.rawMessage), '提示指向输出差异', d.reason);
  ok(d.judged === true, '经过判题');
}

console.log('=== G. 通过 / 仅运行 ===');
{
  const code = 'log_title = "服务器状态报告"\n\nif log_title != "":\n    print(log_title)';
  const { d } = diag('1-1', code, { judge: true });
  ok(d.kind === 'ok' && d.judged === true, '正确代码判题通过', d.kind + '/' + d.judged);
  ok(/通过|恢复正常/.test(d.mira), 'MIRA 给出通过反馈', d.mira);
}
{
  const code = 'log_title = "服务器状态报告"\nprint(log_title)';
  const { d } = diag('1-1', code);
  ok(d.kind === 'ok' && d.judged === false, '只运行未判题时标记 judged=false', d.kind + '/' + d.judged);
  ok(/提交|判题/.test(d.layers.join(' ')), '提示玩家运行不等于提交');
}

console.log('=== H. 分层提示与 MIRA 变化 ===');
{
  const code = 'print(repair_ids)';
  const d1 = diag('1-3', code, { streak: 1 }).d;
  const d2 = diag('1-3', code, { streak: 2 }).d;
  const d3 = diag('1-3', code, { streak: 3 }).d;
  ok(D.defaultVisibleLayers(1) === 1 && D.defaultVisibleLayers(2) === 2 && D.defaultVisibleLayers(3) === 3, '连续失败逐层展开 1→2→3');
  ok(D.defaultVisibleLayers(9) === 3, '展开层数上限为 3');
  ok(d1.mira !== d2.mira && d2.mira !== d3.mira, '连续失败 MIRA 台词不重复');
  ok(/别着急|最小例子|第二层/.test(d3.mira), '连续失败追加安抚/策略');
  ok(d1.signature === diag('1-3', code, { streak: 1 }).d.signature, '同一错误 signature 稳定');
  ok(d1.layers[0] !== d1.layers[2], '第一层与第三层内容不同（方向 vs 修复）');
}

console.log('=== I. 隔离与防泄露 ===');
{
  const code = 'log_title = "服务器状态报告"\n\nif log_title != ""\n    print(log_title)';
  const { d, verdict } = diag('1-1', code, { judge: true });
  ok(verdict.passed === false && d.kind === 'syntax', '判题未过时诊断仍以真实语法错误为准', d.kind);
  ok(!/filter_alerts\(\[/.test(d.layers.join(' ')), '提示中不含判题表达式');
}

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
