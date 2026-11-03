// Python 运行器：MicroPython WebAssembly 在主线程加载（~14ms），
// 用 sys.settrace 看门狗实现执行超时（死循环可被打断），不依赖 Worker 环境。
import { parseTraceback } from './judge';
import type { RunOutcomeShape } from '../game/types';

export type PyStatus = 'idle' | 'loading' | 'ready' | 'error';
export interface PyState { status: PyStatus; phase: string }

function engineBase(): string {
  try {
    const u = new URL('micropython/', document.baseURI).href;
    return u.endsWith('/') ? u : u + '/';
  } catch {
    return '';
  }
}

export const ENGINE_BASE = engineBase();

let status: PyStatus = 'idle';
let phase = '';
let engine: { runPython: (code: string) => unknown } | null = null;
let loading: Promise<void> | null = null;
let outBuf = '';
let errBuf = '';

const statusListeners = new Set<(s: PyState) => void>();

function setStatus(s: PyStatus, ph?: string) {
  status = s;
  if (ph !== undefined) phase = ph;
  statusListeners.forEach(f => f({ status, phase }));
}

export function onPyStatus(fn: (s: PyState) => void): () => void {
  statusListeners.add(fn);
  fn({ status, phase });
  return () => { statusListeners.delete(fn); };
}

export function pyState(): PyState { return { status, phase }; }

/** 运行时动态 import（绕过打包器静态解析） */
const dynImport = new Function('u', 'return import(u);') as (u: string) => Promise<Record<string, unknown>>;

const pyStr = (s: string) => JSON.stringify(String(s));

/** 普通执行脚本：接管 print（保证换行/分隔符精确）+ settrace 看门狗（超时可打断） */
function buildRunner(code: string, limitSec: number): string {
  return [
    'import json, sys, time',
    '__nx_src = ' + pyStr(code),
    '__nx_out = []',
    'def __nx_print(*args, sep=" ", end="\\n"):',
    '    __nx_out.append(sep.join([str(a) for a in args]) + end)',
    '__nx_t0 = time.time()',
    '__nx_limit = ' + String(limitSec),
    'def __nx_wd(frame, event, arg):',
    '    if time.time() - __nx_t0 > __nx_limit:',
    '        raise RuntimeError("execution timeout")',
    '    return __nx_wd',
    '__nx_err = ""',
    'sys.settrace(__nx_wd)',
    'try:',
    '    exec(__nx_src, {"print": __nx_print, "__name__": "__main__"})',
    'except Exception as e:',
    '    __nx_err = type(e).__name__ + ": " + str(e)',
    'finally:',
    '    sys.settrace(None)',
    'print("__NX_RES__" + json.dumps({"out": "".join(__nx_out), "err": __nx_err}))',
  ].join('\n');
}

/** 调试脚本：逐行轨迹（行号 + 变量快照 + 输出增量），同样带看门狗 */
function buildDebug(code: string, limitSec: number): string {
  return [
    'import json, sys, time',
    '__nx_src = ' + pyStr(code),
    '__nx_out = []',
    '__nx_trace = []',
    'def __nx_print(*args, sep=" ", end="\\n"):',
    '    __nx_out.append(sep.join([str(a) for a in args]) + end)',
    '__nx_t0 = time.time()',
    '__nx_limit = ' + String(limitSec),
    'def __nx_t__(frame, event, arg):',
    '    if time.time() - __nx_t0 > __nx_limit:',
    '        raise RuntimeError("execution timeout")',
    '    if event == "line":',
    '        if len(__nx_trace) < 500:',
    '            g = frame.f_globals',
    '            d = {}',
    '            for k in g:',
    '                if not k.startswith("__") and k != "print":',
    '                    try:',
    '                        d[k] = repr(g[k])[:80]',
    '                    except Exception:',
    '                        d[k] = "<obj>"',
    '            __nx_trace.append({"line": frame.f_lineno, "vars": d, "out": "".join(__nx_out)})',
    '            del __nx_out[:]',
    '    return __nx_t__',
    'sys.settrace(__nx_t__)',
    'try:',
    '    exec(__nx_src, {"print": __nx_print, "__name__": "__main__"})',
    'finally:',
    '    rest = "".join(__nx_out)',
    '    if rest:',
    '        __nx_trace.append({"line": __nx_trace[-1]["line"] if __nx_trace else -1, "vars": {}, "out": rest})',
    '    sys.settrace(None)',
    'print("__NX_TRACE__" + json.dumps(__nx_trace))',
  ].join('\n');
}

function extract(raw: string, marker: string): Record<string, unknown> | null {
  const i = raw.lastIndexOf(marker);
  if (i < 0) return null;
  try {
    return JSON.parse(raw.slice(i + marker.length).trim()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 预加载 Python 内核（进入游戏/关卡时调用） */
export function warmUp() {
  if (status === 'ready' || status === 'loading') return;
  if (status === 'error') return;
  void ensureReady().catch(() => { /* 错误已记录在 status 中 */ });
}

async function ensureReady(): Promise<void> {
  if (status === 'ready' && engine) return;
  if (status === 'error') throw new Error(phase || 'Python 内核不可用');
  if (!loading) {
    loading = (async () => {
      setStatus('loading', '载入 Python 内核…');
      const mod = await dynImport(ENGINE_BASE + 'micropython.mjs');
      setStatus('loading', '启动解释器…');
      const loader = mod.loadMicroPython as (opts: Record<string, unknown>) => Promise<{ runPython: (c: string) => unknown }>;
      engine = await loader({
        url: ENGINE_BASE + 'micropython-settrace.wasm',
        stdout: (s: string) => { outBuf += s; },
        stderr: (s: string) => { errBuf += s; },
      });
      setStatus('ready', 'Python 内核就绪');
    })().catch((e: unknown) => {
      loading = null;
      engine = null;
      setStatus('error', 'Python 内核加载失败：' + String((e as Error)?.message || e));
      throw e;
    });
  }
  return loading;
}

let busy = false;
interface Queued {
  code: string;
  timeoutMs: number;
  debug?: boolean;
  resolve: (o: RunOutcomeShape) => void;
}
const queue: Queued[] = [];

function executeOne(item: Queued): RunOutcomeShape {
  const { code, timeoutMs, debug } = item;
  const limitSec = Math.max(1, timeoutMs / 1000);
  outBuf = '';
  errBuf = '';
  const script = debug ? buildDebug(code, limitSec) : buildRunner(code, limitSec);
  let thrown: unknown = null;
  try {
    engine!.runPython(script);
  } catch (e) {
    thrown = e;
  }
  const raw = outBuf;
  if (debug) {
    const trace = extract(raw, '__NX_TRACE__');
    const traceArr = Array.isArray(trace) ? trace : [];
    // 调试模式下输出分散在轨迹的各步 out 中——拼接后作为完整 stdout（实验室判题依赖）
    const dbgOut = traceArr.map((t: { out?: string }) => String(t?.out ?? '')).join('');
    if (thrown) {
      const err = parseTraceback(String(thrown));
      return { ok: false, stdout: dbgOut, stderr: errBuf, error: err, timedOut: false, trace: traceArr as RunOutcomeShape['trace'] };
    }
    return { ok: true, stdout: dbgOut, stderr: errBuf, timedOut: false, trace: traceArr as RunOutcomeShape['trace'] };
  }
  const res = extract(raw, '__NX_RES__');
  const out = res ? String(res.out ?? '') : '';
  const errText = res ? String(res.err ?? '') : '';
  if (errText) {
    if (errText.includes('execution timeout')) {
      return { ok: false, stdout: out, stderr: errBuf, timedOut: true };
    }
    return { ok: false, stdout: out, stderr: errBuf, error: parseTraceback(errText), timedOut: false };
  }
  if (thrown) {
    return { ok: false, stdout: out, stderr: errBuf, error: parseTraceback(String(thrown)), timedOut: false };
  }
  return { ok: true, stdout: out, stderr: errBuf, timedOut: false };
}

function pump() {
  if (busy || queue.length === 0) return;
  busy = true;
  const next = queue.shift()!;
  ensureReady()
    .then(() => {
      const outcome = executeOne(next);
      busy = false;
      next.resolve(outcome);
      pump();
    })
    .catch((e: unknown) => {
      busy = false;
      next.resolve({
        ok: false, stdout: '', stderr: '', timedOut: false,
        error: { type: 'EngineError', message: String((e as Error)?.message || e) },
      });
      pump();
    });
}

export function runPython(code: string, opts?: { timeoutMs?: number; debug?: boolean }): Promise<RunOutcomeShape> {
  return new Promise<RunOutcomeShape>((resolve) => {
    queue.push({ code, timeoutMs: opts?.timeoutMs ?? 5000, debug: opts?.debug, resolve });
    pump();
  });
}

export function resetEngine() {
  engine = null;
  loading = null;
  status = 'idle';
  phase = '';
}
