import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmDir = join(__dirname, '..', 'node_modules', '@micropython', 'micropython-webassembly-pyscript');
const OUT = join(__dirname, 'mp_trace_result.txt');
const lines = [];
const log = (k, v) => lines.push(k + ' => ' + String(JSON.stringify(v)).slice(0, 600));

try {
  let out = '';
  const mp = await loadMicroPython({
    url: join(wasmDir, 'micropython-settrace.wasm'),
    stdout: (s) => { out += s; },
    stderr: (s) => { out += s; },
  });
  log('loaded', true);

  // 1) settrace 能否追踪 exec 字符串 + f_locals 能力
  out = '';
  try {
    mp.runPython([
      'import sys',
      '__probe = []',
      'def __t(frame, event, arg):',
      '    if event == "line" and len(__probe) < 4:',
      '        try:',
      '            lv = {k: repr(v)[:30] for k, v in frame.f_locals.items()}',
      '        except Exception as e:',
      '            lv = {"ERR": str(e)}',
      '        __probe.append([frame.f_lineno, lv])',
      '    return __t',
      'sys.settrace(__t)',
      'exec("a = 1\\nb = a + 2\\nprint(\'sum\', b)")',
      'sys.settrace(None)',
      'print("PROBE" + repr(__probe))',
    ].join('\n'));
  } catch (e) { out += 'EXC1:' + String(e).slice(0, 200); }
  log('probe', out);

  // 2) 函数体内部追踪
  out = '';
  try {
    mp.runPython([
      'import sys',
      '__tr = []',
      'def __t2(frame, event, arg):',
      '    if event == "line":',
      '        try:',
      '            lv = {k: repr(v)[:24] for k, v in frame.f_locals.items()}',
      '        except Exception as e:',
      '            lv = {"ERR": str(e)}',
      '        __tr.append([frame.f_lineno, lv])',
      '    return __t2',
      'sys.settrace(__t2)',
      'def work(temps):',
      '    alerts = []',
      '    for t in temps:',
      '        if t >= 40:',
      '            alerts.append(t)',
      '    return alerts',
      'print("R", work([22, 41]))',
      'sys.settrace(None)',
      'print("N", len(__tr))',
      'print("F", repr(__tr[0:5]))',
    ].join('\n'));
  } catch (e) { out += 'EXC2:' + String(e).slice(0, 200); }
  log('trace', out.slice(0, 600));

  // 3) 异常格式
  out = '';
  try {
    mp.runPython('def f(a):\n    return a / 0\nf(1)');
  } catch (e) { out = String(e); }
  log('err', out.slice(0, 240));

  // 4) 多次运行是否稳定（连续 5 次）
  out = '';
  for (let i = 0; i < 5; i++) {
    mp.runPython('print("run' + i + '")');
  }
  log('repeat', out);
} catch (e) {
  lines.push('FATAL: ' + String(e).slice(0, 600));
}

writeFileSync(OUT, lines.join('\n'), 'utf8');
