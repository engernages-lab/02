import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmDir = join(__dirname, '..', 'node_modules', '@micropython', 'micropython-webassembly-pyscript');
const wasm = join(wasmDir, 'micropython-settrace.wasm');
const lines = [];
const log = (k, v) => lines.push(k + ' => ' + String(JSON.stringify(v)).slice(0, 400));

// 方案 A：linebuf: false
try {
  let out = '';
  const mp = await loadMicroPython({ url: wasm, linebuf: false, stdout: (s) => { out += s; }, stderr: (s) => { out += s; } });
  mp.runPython('print("A")\nprint("B")');
  log('A default-linebuf-off', out);
} catch (e) { log('A err', String(e).slice(0, 200)); }

// 方案 B：默认选项（对照）
try {
  let out = '';
  const mp2 = await loadMicroPython({ url: wasm, stdout: (s) => { out += s; }, stderr: (s) => { out += s; } });
  mp2.runPython('print("A")\nprint("B")');
  log('B default', out);
} catch (e) { log('B err', String(e).slice(0, 200)); }

// 方案 C：Python 侧 io.StringIO 重定向（完全可控）
try {
  let out = '';
  const mp3 = await loadMicroPython({ url: wasm, stdout: (s) => { out += s; }, stderr: (s) => { out += s; } });
  mp3.runPython([
    'import io, sys, json',
    '__b = io.StringIO()',
    '__o = sys.stdout',
    '__err = ""',
    'sys.stdout = __b',
    'try:',
    '    exec("print(\'A\')\\nprint(\'B\')", {})',
    'except Exception as e:',
    '    __err = str(e)',
    'finally:',
    '    sys.stdout = __o',
    '    print("__NX_RES__" + json.dumps({"out": __b.getvalue(), "err": __err}))',
  ].join('\n'));
  log('C redirect', out);
} catch (e) { log('C err', String(e).slice(0, 300)); }

writeFileSync(join(__dirname, 'mp_stdout_result.txt'), lines.join('\n'), 'utf8');
