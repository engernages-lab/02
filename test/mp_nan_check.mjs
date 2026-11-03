import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmDir = join(__dirname, '..', 'node_modules', '@micropython', 'micropython-webassembly-pyscript');
const lines = [];
let raw = '';
const mp = await loadMicroPython({
  url: join(wasmDir, 'micropython-settrace.wasm'),
  stdout: (s) => { raw += s; },
  stderr: (s) => { raw += s; },
});

const run = (code) => {
  raw = '';
  const runner = [
    'import json',
    '__nx_out = []',
    'def __nx_print(*args, sep=" ", end="\\n"):',
    '    __nx_out.append(sep.join([str(a) for a in args]) + end)',
    '__nx_ns = {"print": __nx_print}',
    'try:',
    '    exec(' + JSON.stringify(code) + ', __nx_ns)',
    'except Exception as e:',
    '    __nx_out.append("EXC:" + type(e).__name__ + ":" + str(e))',
    'print("|".join(__nx_out))',
  ].join('\n');
  mp.runPython(runner);
  return raw;
};

lines.push('int(NaN) => ' + JSON.stringify(run("try:\n    v = int('NaN')\n    print('ok', v)\nexcept Exception as e:\n    print('exc', type(e).__name__)")));

lines.push('diagnose => ' + JSON.stringify(run([
  'def diagnose(records):',
  '    result = []',
  '    for name, value in records.items():',
  '        try:',
  '            if int(value) > 80:',
  '                result.append(name + ": HIGH")',
  '            elif int(value) < 20:',
  '                result.append(name + ": LOW")',
  '            else:',
  '                result.append(name + ": OK")',
  '        except ValueError:',
  '            result.append(name + ": ERR")',
  '    return result',
  "print(diagnose({'idle': 5, 'ghost': 'NaN'}))",
  "print(diagnose({'idle': 5, 'ghost': 'X'}))",
].join('\n'))));

writeFileSync(join(__dirname, 'mp_nan_result.txt'), lines.join('\n'), 'utf8');
