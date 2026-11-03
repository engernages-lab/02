// MicroPython wasm 能力验证：加载耗时 / print 捕获 / 判题 harness / settrace
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmDir = join(__dirname, '..', 'node_modules', '@micropython', 'micropython-webassembly-pyscript');

let out = '';
const t0 = Date.now();
const mp = await loadMicroPython({
  url: join(wasmDir, 'micropython-settrace.wasm'),
  stdout: (s) => { out += s; },
  stderr: (s) => { out += s; },
});
const tLoad = Date.now() - t0;
console.log('LOAD_MS=' + tLoad);

// 1) print 捕获
out = '';
mp.runPython('print("Hello, world!")');
console.log('print =>', JSON.stringify(out));

// 2) 判题 harness（json.dumps + marker），用 1-4 的三条 python check
out = '';
mp.runPython(`
def filter_alerts(temps):
    alerts = []
    for temp in temps:
        if temp >= 40:
            alerts.append(temp)
    return alerts
`);
mp.runPython(`
import json
__r = []
__r.append(["A", filter_alerts([22, 41, 42, 38, 45]) == [41, 42, 45]])
__r.append(["B", filter_alerts([39, 40, 41]) == [40, 41]])
__r.append(["C", filter_alerts([22, 30, 15]) == []])
print("__NX_MARKER__" + json.dumps(__r))
`);
console.log('harness =>', JSON.stringify(out.slice(0, 200)));

// 3) 异常类型（判题依赖 traceback 解析）
out = '';
try {
  mp.runPython('def get_code(records, name):\n    return records[name]\nprint(get_code({"a": 1}, "b"))');
} catch (e) {
  out += 'EXC:' + String(e).slice(0, 160);
}
console.log('exception =>', JSON.stringify(out));

// 4) 6-5 综合用例（try/except ValueError/IndexError + split）
out = '';
mp.runPython(`
def parse_cell(raw):
    parts = raw.split(":")
    return parts[0], int(parts[1])

def check_cells(cells):
    ok = []
    fail = []
    for raw in cells:
        try:
            name, value = parse_cell(raw)
            if value >= 60:
                ok.append(name)
            else:
                fail.append(name)
        except ValueError:
            fail.append("UNKNOWN")
        except IndexError:
            fail.append("MALFORMED")
    return ok, fail
`);
mp.runPython(`
import json
__r = []
__r.append(["A", check_cells(['core:80', 'fan:20']) == (['core'], ['fan'])])
__r.append(["B", check_cells(['ghost:NaN']) == ([], ['UNKNOWN'])])
__r.append(["C", check_cells(['bad']) == ([], ['MALFORMED'])])
print("__NX_MARKER__" + json.dumps(__r))
`);
console.log('complex =>', JSON.stringify(out.slice(0, 240)));

// 5) dict / 字符串方法 / 列表方法
out = '';
mp.runPython(`
import json
d = {"sensor": "S-01"}
r = []
r.append(["get", d.get("valve", "UNKNOWN")])
r.append(["items", list(d.items())])
r.append(["join", "-".join(["NEXUS", "REPAIR", "UNIT"])])
r.append(["repr", repr([72, 90])])
print("__NX_MARKER__" + json.dumps(r))
`);
console.log('dict/str =>', JSON.stringify(out.slice(0, 240)));

// 6) sys.settrace 支持检测
out = '';
mp.runPython(`
import sys
print("has_settrace", hasattr(sys, "settrace"))
`);
console.log('settrace =>', JSON.stringify(out));

console.log('OK');
