// 生成判题链路测试用例：把用户代码(可含判题注入)写成 .py 文件
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const req = createRequire(join(root, 'package.json'));
const ts = req('typescript');

function loadTS(file) {
  const src = readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require allowed'); });
  return mod.exports;
}

const { LEVELS } = loadTS(join(root, 'src/game/levels.ts'));
const { buildHarness, combineWithHarness } = loadTS(join(root, 'src/services/judge.ts'));
const { DEFENSE_TASKS } = loadTS(join(root, 'src/game/defense.ts'));

const casesDir = join(__dirname, 'cases');
rmSync(casesDir, { recursive: true, force: true });
mkdirSync(casesDir, { recursive: true });

const meta = [];

const scenarios = [
  ['tut-1', '# ===== 新人训练终端 =====\n# 你的第一条 Python 代码\n\nprint("Hello, world!")', true, 'stdout'],
  ['tut-1', '# ===== 新人训练终端 =====\n# 你的第一条 Python 代码\n\n# 只有注释，没有输出', false, 'stdout'],
  ['1-1', 'log_title = "服务器状态报告"\n\nif log_title != "":\n    print(log_title)', true, 'stdout'],
  ['1-1', 'log_title = "服务器状态报告"\n\nif log_title != ""\n    print(log_title)', false, 'stdout'],
  ['1-2', 'message = "NEXUS SYSTEM ONLINE"\nprint(message)', true, 'stdout'],
  ['1-2', 'message = "NEXUS SYSTEM ONLINE\nprint(message)', false, 'stdout'],
  ['1-3', 'repair_id = "R-07"\n\nprint(repair_id)', true, 'stdout'],
  ['1-3', 'repair_id = "R-07"\n\nprint(repair_ids)', false, 'stdout'],
  ['1-4', 'def filter_alerts(temps):\n    alerts = []\n\n    for temp in temps:\n        if temp >= 40:\n            alerts.append(temp)\n\n    return alerts', true, 'python'],
  ['1-4', 'def filter_alerts(temps):\n    alerts = []\n\n    for temp in temps:\n        if temp > 39:\n            alerts.append(temp)\n\n    return alerts', true, 'python'],
  ['1-4', 'def filter_alerts(temps):\n    alerts = []\n\n    for temp in temps:\n        if temp < 40:\n            alerts.append(temp)\n\n    return alerts', false, 'python'],
  ['1-5', 'records = ["A", "B", "C"]\n\nfor record in records:\n    print(record)', true, 'stdout'],
  ['1-5', 'records = ["A", "B", "C"]\n\nfor record in records:\nprint(record)', false, 'stdout'],
  // ---- 第二章：数据日志中心 ----
  ['2-1', 'status = "error"\n\nif status == "error":\n    print("ALERT: DATA CORRUPTED")\nelse:\n    print("PASS: CHANNEL OK")', true, 'stdout'],
  ['2-1', 'status = "error"\n\nif status == "error":\n    print("ALERT: DATA CORRUPTED")\nels:\n    print("PASS: CHANNEL OK")', false, 'stdout'],
  ['2-2', 'level = 5\n\nif level == 5:\n    print("WARNING LEVEL: 5")\nelse:\n    print("WARNING LEVEL: LOW")', true, 'stdout'],
  ['2-2', 'level = 5\n\nif level = 5:\n    print("WARNING LEVEL: 5")\nelse:\n    print("WARNING LEVEL: LOW")', false, 'stdout'],
  ['2-3', 'def is_overload(temp, pressure):\n    if temp > 90 and pressure > 150:\n        return True\n    return False', true, 'python'],
  ['2-3', 'def is_overload(temp, pressure):\n    if temp > 90 or pressure > 150:\n        return True\n    return False', false, 'python'],
  ['2-4', 'def is_down(ping):\n    return ping == 0\n\ndef should_notify(ping):\n    if not is_down(ping):\n        return False\n    return True', true, 'python'],
  ['2-4', 'def is_down(ping):\n    return ping == 0\n\ndef should_notify(ping):\n    if is_down(ping):\n        return False\n    return True', false, 'python'],
  ['2-5', 'logs = ["ok", "warn", "ok", "error"]\n\nfor log in logs:\n    if log == "ok":\n        print("PASS")\n    elif log == "warn":\n        print("WARN")\n    else:\n        print("FAIL")', true, 'stdout'],
  ['2-5', 'logs = ["ok", "warn", "ok", "error"]\n\nfor log in logs:\n    if log == "ok":\n        print("PASS")\n    else:\n        print("FAIL")', false, 'stdout'],
  // ---- 第三章：存储数据仓 ----
  ['3-1', 'items = ["A", "B", "C"]\n\nprint(items[0])\nprint(items[1])\nprint(items[2])', true, 'stdout'],
  ['3-1', 'items = ["A", "B", "C"]\n\nprint(items[1])\nprint(items[2])\nprint(items[3])', false, 'stdout'],
  ['3-2', 'def store(codes):\n    items = []\n    for code in codes:\n        items.append(code)\n    return items', true, 'python'],
  ['3-2', 'def store(codes):\n    items = []\n    for code in codes:\n        print("SCAN", code)\n    items.append(code)\n    return items', false, 'python'],
  ['3-3', 'count = 0\nitems = ["O-1", "O-2", "O-3", "O-4"]\n\nwhile count < len(items):\n    print(items[count])\n    count = count + 1', true, 'stdout'],
  ['3-3', 'count = 0\nitems = ["O-1", "O-2", "O-3", "O-4"]\n\nwhile count < 3:\n    print(items[count])\n    count = count + 1', false, 'stdout'],
  ['3-4', 'def check_inventory(target, stock):\n    for item in stock:\n        if item == target:\n            return True\n    return False', true, 'python'],
  ['3-4', 'def check_inventory(target, stock):\n    for item in stock:\n        if target == stock:\n            return True\n    return False', false, 'python'],
  ['3-5', 'def categorize(codes):\n    heavy = []\n    light = []\n    for code in codes:\n        if len(code) > 3:\n            heavy.append(code)\n        else:\n            light.append(code)\n    return heavy, light', true, 'python'],
  ['3-5', 'def categorize(codes):\n    heavy = []\n    light = []\n    for code in codes:\n        if len(code) > 3:\n            heavy.append(code)\n        else:\n            heavy.append(code)\n    return heavy, light', false, 'python'],
  // ---- 第四章：自动化工厂 ----
  ['4-1', 'def assemble(part):\n    return part + " ASSEMBLED"\n\ndef power_on(unit):\n    print(unit + " POWER ON")\n\npower_on(assemble("CORE"))', true, 'stdout'],
  ['4-1', 'daf assemble(part):\n    return part + " ASSEMBLED"\n\ndef power_on(unit):\n    print(unit + " POWER ON")\n\npower_on(assemble("CORE"))', false, 'stdout'],
  ['4-2', 'def build(code):\n    result = code + "-BUILT"\n    return result\n\npart = build("FOO")\nprint(part)', true, 'stdout'],
  ['4-2', 'def build(code):\n    result = code + "-BUILT"\n\npart = build("FOO")\nprint(part)', false, 'stdout'],
  ['4-3', 'def schedule(line, product):\n    return product + " -> LINE " + line\n\norder = schedule("B", "SILICON")\nprint(order)', true, 'stdout'],
  ['4-3', 'def schedule(line, product):\n    return product + " -> LINE " + line\n\norder = schedule("SILICON", "B")\nprint(order)', false, 'stdout'],
  ['4-4', 'def is_ready(temperature):\n    if temperature <= 80:\n        return True\n    return False\n\nif is_ready(95):\n    print("START PRODUCTION")\nelse:\n    print("WAIT FOR COOLING")', true, 'stdout'],
  ['4-4', 'def is_ready(temperature):\n    if temperature <= 80:\n        return True\n    return False\n\nif is_ready:\n    print("START PRODUCTION")\nelse:\n    print("WAIT FOR COOLING")', false, 'stdout'],
  ['4-5', 'def add_part(part, parts):\n    parts.append(part)\n\ndef assemble(product, parts):\n    return product + " contains: " + ", ".join(parts)\n\nparts = []\nadd_part("CPU", parts)\nadd_part("RAM", parts)\nprint(assemble("SERVER", parts))', true, 'python'],
  ['4-5', 'def add_part(part, parts):\n    parts.append(part)\n\ndef assemble(product, parts):\n    return product + " contains: " + parts.join(", ")\n\nparts = []\nadd_part("CPU", parts)\nadd_part("RAM", parts)\nprint(assemble("SERVER", parts))', false, 'python'],
  // ---- 第五章：系统诊断中心 ----
  ['5-1', 'def get_code(records, name):\n    return records.get(name, "UNKNOWN")\n\nrecords = {"sensor": "S-01", "relay": "R-02"}\nprint(get_code(records, "sensor"))\nprint(get_code(records, "valve"))', true, 'stdout'],
  ['5-1', 'def get_code(records, name):\n    return records[name]\n\nrecords = {"sensor": "S-01", "relay": "R-02"}\nprint(get_code(records, "sensor"))\nprint(get_code(records, "valve"))', false, 'stdout'],
  ['5-2', 'def parse_count(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0\n\nprint(parse_count("12"))\nprint(parse_count("abc"))', true, 'python'],
  ['5-2', 'def parse_count(text):\n    return int(text)\n\nprint(parse_count("12"))\nprint(parse_count("abc"))', false, 'python'],
  ['5-3', 'def should_alert(temp, pressure, critical):\n    if critical and (temp > 80 or pressure > 120):\n        return True\n    return False', true, 'python'],
  ['5-3', 'def should_alert(temp, pressure, critical):\n    if critical and temp > 80 or pressure > 120:\n        return True\n    return False', false, 'python'],
  ['5-4', 'def convert(records, factor):\n    for key in records:\n        records[key] = records[key] * factor\n    return records', true, 'python'],
  ['5-4', 'def convert(records, factor):\n    for key in records:\n        records[key] = key * factor\n    return records', false, 'python'],
  ['5-5', 'def diagnose(records):\n    result = []\n    for name, value in records.items():\n        try:\n            if int(value) > 80:\n                result.append(name + ": HIGH")\n            elif int(value) < 20:\n                result.append(name + ": LOW")\n            else:\n                result.append(name + ": OK")\n        except ValueError:\n            result.append(name + ": ERR")\n    return result', true, 'python'],
  ['5-5', 'def diagnose(records):\n    result = []\n    for name, value in records.items():\n        if value > 80:\n            result.append(name + ": HIGH")\n        elif value < 20:\n            result.append(name + ": LOW")\n        else:\n            result.append(name + ": OK")\n    return result', false, 'python'],
  // ---- 第六章：方舟核心机房（综合） ----
  ['6-1', 'def check_heartbeat(seq):\n    if seq == 0:\n        return "SILENT"\n    else:\n        return "ALIVE"\n\ndef report(seqs):\n    result = ""\n    for s in seqs:\n        result = result + check_heartbeat(s) + " "\n    return result\n\nprint(report([1, 0, 1, 0]))', true, 'stdout'],
  ['6-1', 'def check_heartbeat(seq):\n    if seq == 0:\n        return "ALIVE"\n    else:\n        return "SILENT"\n\ndef report(seqs):\n    result = ""\n    for s in seqs:\n        result = result + check_heartbeat(s) + " "\n    return result\n\nprint(report([1, 0, 1, 0]))', false, 'stdout'],
  ['6-2', 'def validate(carriers):\n    bad = []\n    for c in carriers:\n        if c < 40 or c > 90:\n            bad.append(c)\n    return bad', true, 'python'],
  ['6-2', 'def validate(carriers):\n    bad = []\n    for c in carriers:\n        if c < 40:\n            bad.append(c)\n    return bad', false, 'python'],
  ['6-3', 'def decode(symbols):\n    table = {"A": "NEXUS", "B": "ECHO", "C": "HUMAN"}\n    result = ""\n    for s in symbols:\n        result = result + table[s] + " "\n    return result\n\nprint(decode(["A", "C"]))', true, 'stdout'],
  ['6-3', 'def decode(symbols):\n    table = {"A": "NEXUS", "B": "ECHO", "C": "HUMAN"}\n    result = ""\n    for s in symbols:\n        result = table[s] + " "\n    return result\n\nprint(decode(["A", "C"]))', false, 'stdout'],
  ['6-4', 'def count_matches(expect, actual):\n    count = 0\n    i = 0\n    while i < len(expect):\n        if actual[i] == expect[i]:\n            count = count + 1\n        i = i + 1\n    return count', true, 'python'],
  ['6-4', 'def count_matches(expect, actual):\n    count = 0\n    i = 0\n    while i < len(expect):\n        if actual[i] == "?" or actual[i] == expect[i]:\n            count = count + 1\n        i = i + 1\n    return count', false, 'python'],
  ['6-5', 'def parse_cell(raw):\n    parts = raw.split(":")\n    return parts[0], int(parts[1])\n\ndef check_cells(cells):\n    ok = []\n    fail = []\n    for raw in cells:\n        try:\n            name, value = parse_cell(raw)\n            if value >= 60:\n                ok.append(name)\n            else:\n                fail.append(name)\n        except ValueError:\n            fail.append("UNKNOWN")\n        except IndexError:\n            fail.append("MALFORMED")\n    return ok, fail', true, 'python'],
  ['6-5', 'def parse_cell(raw):\n    parts = raw.split(":")\n    return parts[0], int(parts[1])\n\ndef check_cells(cells):\n    ok = []\n    fail = []\n    for raw in cells:\n        name, value = parse_cell(raw)\n        if value >= 60:\n            ok.append(name)\n        else:\n            fail.append(name)\n    return ok, fail', false, 'python'],
];

scenarios.forEach(([id, code, expect, kind], i) => {
  const level = LEVELS.find(l => l.id === id);
  let content = kind === 'python' ? combineWithHarness(code, buildHarness(level.judge.pythonChecks || [])) : code;
  const fname = 's' + String(i).padStart(2, '0') + '.py';
  writeFileSync(join(casesDir, fname), content.replace(/\n/g, '\n'));
  meta.push({ file: fname, id, expect, kind, codeLines: code.split('\n').length });
});

// 防御任务（好的/坏的）
DEFENSE_TASKS.forEach((task, i) => {
  const repl = task.id === 'd3' ? 'in' : task.id === 'd2' ? '==' : '>=';
  writeFileSync(join(casesDir, 'd' + i + 'g.py'), task.code.replace('??', repl));
  writeFileSync(join(casesDir, 'd' + i + 'b.py'), task.code);
  meta.push({ file: 'd' + i + 'g.py', defense: task.id, good: true });
  meta.push({ file: 'd' + i + 'b.py', defense: task.id, good: false });
});

writeFileSync(join(casesDir, 'meta.json'), JSON.stringify(meta));
console.log('prep done, cases:', meta.length);
