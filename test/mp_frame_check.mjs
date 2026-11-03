import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmDir = join(__dirname, '..', 'node_modules', '@micropython', 'micropython-webassembly-pyscript');
const lines = [];
const log = (k, v) => lines.push(k + ' => ' + String(JSON.stringify(v)).slice(0, 900));

let out = '';
const mp = await loadMicroPython({
  url: join(wasmDir, 'micropython-settrace.wasm'),
  stdout: (s) => { out += s; },
  stderr: (s) => { out += s; },
});

out = '';
try {
  mp.runPython([
    'import sys',
    '__ns = {}',
    '__tr = []',
    '__skip = ("sys", "__t__", "__tr", "__ns", "__skip")',
    'def __t__(frame, event, arg):',
    '    if event == "line" and len(__tr) < 30:',
    '        g = frame.f_globals',
    '        d = {}',
    '        for k in g:',
    '            if not k.startswith("__") and k not in __skip:',
    '                try:',
    '                    d[k] = repr(g[k])[:24]',
    '                except Exception:',
    '                    d[k] = "<obj>"',
    '        __tr.append([frame.f_lineno, d])',
    '    return __t__',
    'sys.settrace(__t__)',
    'exec("a = 1\\nb = a + 1\\nfor i in range(2):\\n    b = b + i\\nprint(\'done\', b)", __ns)',
    'sys.settrace(None)',
    'print("COUNT", len(__tr))',
    'print("TR", repr(__tr))',
  ].join('\n'));
} catch (e) { out += 'EXC:' + String(e).slice(0, 400); }
log('exec-trace', out.slice(0, 1000));

writeFileSync(join(__dirname, 'mp_frame_result.txt'), lines.join('\n'), 'utf8');
