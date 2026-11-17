// 循环沙箱：只负责「真实执行 + 硬超时」，不做任何判题
//
// 背景（A3 实测）：当前 MicroPython 的 settrace 看门狗只对 for 循环产生行事件，
// while 循环（含 while True）不产生任何 trace 事件，主线程会被永久阻塞。
// 因此：含 while 的代码在浏览器里改为在一次性 Worker 中执行，超时直接 terminate。
// 不含 while 的代码仍走原来的主线程路径，行为与性能完全不变。

export interface SandboxOutcome {
  /** Worker 是否正常返回（不是超时/崩溃） */
  completed: boolean;
  timedOut: boolean;
  /** 执行期间捕获的 stdout（含 __NX_RES__ 标记） */
  raw: string;
  /** Worker 里 runPython 抛出的错误文本 */
  thrown: string;
  /** Worker 启动/加载失败 */
  fatal: string;
}

/** 是否需要放进循环沙箱：源码里出现 while 关键字（字符串/注释里的误判只会多花一点启动时间） */
export function needsLoopSandbox(code: string): boolean {
  return /\bwhile\b/.test(code);
}

const WORKER_SRC = `
let mp = null;
self.onmessage = async (event) => {
  const data = event.data || {};
  const base = data.base || '';
  let out = '';
  try {
    const mod = await import(base + 'micropython.mjs');
    mp = await mod.loadMicroPython({
      url: base + 'micropython-settrace.wasm',
      stdout: (s) => { out += s; },
      stderr: () => {},
    });
    let thrown = '';
    try {
      mp.runPython(data.script);
    } catch (err) {
      thrown = String(err);
    }
    self.postMessage({ type: 'done', out, thrown });
  } catch (err) {
    self.postMessage({ type: 'fatal', out, message: String(err && err.message ? err.message : err) });
  }
};
`;

/** 浏览器是否支持 module worker */
export function canUseLoopSandbox(): boolean {
  try {
    return typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined'
      && typeof URL.createObjectURL === 'function';
  } catch {
    return false;
  }
}

/**
 * 在一次性 Worker 中执行脚本。
 * 超时后 terminate：这份代码确实跑过、也确实超过了时限，与「真实执行超时」语义一致。
 */
export function runInLoopSandbox(script: string, timeoutMs: number, base: string): Promise<SandboxOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    let out = '';
    let worker: Worker | null = null;
    let objectUrl = '';
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (r: SandboxOutcome) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      try { worker?.terminate(); } catch { /* ignore */ }
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch { /* ignore */ }
      resolve(r);
    };

    try {
      const blob = new Blob([WORKER_SRC], { type: 'text/javascript' });
      objectUrl = URL.createObjectURL(blob);
      worker = new Worker(objectUrl, { type: 'module' });
    } catch (e) {
      resolve({ completed: false, timedOut: false, raw: '', thrown: '', fatal: String((e as Error)?.message || e) });
      return;
    }

    timer = setTimeout(() => {
      finish({ completed: false, timedOut: true, raw: out, thrown: '', fatal: '' });
    }, Math.max(500, timeoutMs) + 250);

    worker.onmessage = (ev: MessageEvent) => {
      const m = (ev.data || {}) as { type?: string; out?: string; thrown?: string; message?: string };
      if (m.type === 'done') {
        finish({ completed: true, timedOut: false, raw: out || m.out || '', thrown: m.thrown || '', fatal: '' });
        return;
      }
      if (m.type === 'fatal') {
        finish({ completed: false, timedOut: false, raw: out || m.out || '', thrown: '', fatal: m.message || 'worker fatal' });
      }
    };
    worker.onerror = () => {
      finish({ completed: false, timedOut: false, raw: out, thrown: '', fatal: 'worker error' });
    };

    try {
      worker.postMessage({ base, script });
    } catch (e) {
      finish({ completed: false, timedOut: false, raw: '', thrown: '', fatal: String((e as Error)?.message || e) });
    }
  });
}
