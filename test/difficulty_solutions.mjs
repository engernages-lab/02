// Boss 三档难度的参考解（只给测试/审计使用，不进入游戏包）
// key = phase.id；每个函数都必须让该阶段全部 pythonChecks 通过。
export const DIFFICULTY_SOLUTIONS = {
  // ---------- EASY（与既有 Boss 战一致） ----------
  'gate-p1': 'def startup(energy):\n    if energy >= 20:\n        return "POWER ON"\n    else:\n        return "POWER OFF"\n\nprint(startup(20))',
  'gate-p2': 'def shield(threat):\n    if threat > 80:\n        return "CRITICAL"\n    if threat > 40:\n        return "WARNING"\n    return "SAFE"',
  'gate-p3': 'def collect(packets):\n    good = []\n    for p in packets:\n        if p >= 1:\n            good.append(p)\n    return good\n\nprint(collect([1, 2, 3]))',
  'gate-p4': 'def scan(nodes):\n    bad = []\n    for n in nodes:\n        if n > 90:\n            bad.append(n)\n        if n < 50:\n            bad.append(n)\n    return bad\n\nprint(scan([30, 60, 95]))',
  'som-p1': 'def classify(tag):\n    if tag == "error":\n        return "ALERT"\n    else:\n        return "PASS"\n\nprint(classify("error"))',
  'som-p2': 'def guard(temp, pressure):\n    if temp > 90 and pressure > 150:\n        return "OVERLOAD"\n    return "SAFE"',
  'som-p3': 'def scan(logs):\n    out = []\n    for lv in logs:\n        if lv == "error":\n            out.append("FAIL")\n        elif lv == "warn":\n            out.append("WARN")\n        else:\n            out.append("PASS")\n    return out\n\nprint(scan(["ok", "warn", "error"]))',
  'som-p4': 'def recover(nodes):\n    good = []\n    for n in nodes:\n        if n >= 1 and n <= 99:\n            good.append(n)\n    return good\n\nprint(recover([0, 5, 120]))',
  'idx-p1': 'def find_id(name, names):\n    for i in range(len(names)):\n        if names[i] == name:\n            return i\n    return -1',
  'idx-p2': 'def read_names(rows):\n    names = []\n    for row in rows:\n        if row[0] > 0:\n            names.append(row[1])\n    return names',
  'idx-p3': 'def dedupe(ids):\n    out = []\n    i = 0\n    while i < len(ids):\n        x = ids[i]\n        if x != -1 and x not in out:\n            out.append(x)\n        i = i + 1\n    return out',
  'idx-p4': 'def restore(records):\n    names = []\n    for row in records:\n        if row[0] > 0 and row[1] not in names:\n            names.append(row[1])\n    return names',
  'jd-p1': 'def power_ok(levels):\n    for x in levels:\n        if x < 1:\n            return False\n    return True',
  'jd-p2': 'def verdict(score):\n    if score >= 90:\n        return "CLEAR"\n    if score >= 60:\n        return "HOLD"\n    return "BLOCK"',
  'jd-p3': 'def unlock(a, b, c):\n    if a == "root" and b == "root" and c == "root":\n        return True\n    return False',
  'jd-p4': 'def restore_cmd(ids):\n    out = []\n    for x in ids:\n        if x > 0 and x not in out:\n            out.append(x)\n    return out',
  'en-p1': 'def clean(values):\n    out = []\n    for v in values:\n        if v > 0:\n            out.append(v)\n    return out',
  'en-p2': 'def lookup(table, key):\n    return table.get(key, 0)',
  'en-p3': 'def to_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0',
  'en-p4': 'def repair(rows):\n    total = 0\n    for r in rows:\n        try:\n            total = total + int(r)\n        except ValueError:\n            continue\n    return total',
  'k0-p1': 'def pass_gate(a, b, c):\n    if a and b and c:\n        return True\n    return False',
  'k0-p2': 'def judge(score):\n    if score >= 90:\n        return "PASS"\n    if score >= 60:\n        return "REVIEW"\n    return "REJECT"',
  'k0-p3': 'def merge(a, b):\n    out = dict(a)\n    for k in b:\n        if k not in out or b[k] > out[k]:\n            out[k] = b[k]\n    return out',
  'k0-p4': 'def final_repair(rows):\n    total = 0\n    for r in rows:\n        try:\n            total = total + int(r)\n        except ValueError:\n            continue\n    return "STABLE" if total >= 0 else "UNSTABLE"',

  // ---------- GATE-01 HARD ----------
  'gate-h1': 'def startup_v2(energy, backup):\n    if energy >= 50:\n        if backup:\n            return "ONLINE"\n        return "STANDBY"\n    return "OFFLINE"\n\nprint(startup_v2(50, True))',
  'gate-h2': 'def count_ready(levels):\n    total = 0\n    for lv in levels:\n        if lv >= 30:\n            total = total + 1\n    return total',
  'gate-h3': 'def label_nodes(nodes):\n    out = []\n    for n in nodes:\n        if n == "":\n            out.append(n + " EMPTY")\n        else:\n            out.append(n + " OK")\n    return out',
  'gate-h4': 'def audit(levels):\n    up = 0\n    down = 0\n    for lv in levels:\n        if lv >= 50:\n            up = up + 1\n        else:\n            down = down + 1\n    return [up, down]',

  // ---------- GATE-01 EXPERT ----------
  'gate-x1': 'def power_report(levels):\n    count = 0\n    total = 0\n    for lv in levels:\n        if lv >= 0:\n            if lv <= 100:\n                count = count + 1\n                total = total + lv\n    return [count, total]',
  'gate-x2': 'def upshift(values, limit):\n    out = []\n    for v in values:\n        if v < limit:\n            out.append(v * 2)\n        else:\n            out.append(v)\n    return out',
  'gate-x3': 'def transitions(states):\n    count = 0\n    prev = states[0]\n    for s in states:\n        if s != prev:\n            count = count + 1\n        prev = s\n    return count',
  'gate-x4': 'def repair_log(temps):\n    out = ""\n    for t in temps:\n        if t >= 80:\n            out = out + "H"\n        else:\n            if t < 20:\n                out = out + "L"\n            else:\n                out = out + "M"\n    return out',

  // ---------- SOMNIA HARD ----------
  'som-h1': 'def route(tag):\n    if tag == "error":\n        return "ALERT"\n    elif tag == "warn":\n        return "WARN"\n    else:\n        return "PASS"',
  'som-h2': 'def filter_records(records):\n    out = []\n    for r in records:\n        if r != "ok" and r != "":\n            out.append(r)\n    return out',
  'som-h3': 'def can_merge(a, b):\n    if a != "" and b != "" and a != b:\n        return True\n    return False',
  'som-h4': 'def audit_batch(records):\n    fail = 0\n    warn = 0\n    ok = 0\n    for r in records:\n        if r == "error":\n            fail = fail + 1\n        elif r == "warn":\n            warn = warn + 1\n        else:\n            ok = ok + 1\n    return [fail, warn, ok]',

  // ---------- SOMNIA EXPERT ----------
  'som-x1': 'def contains(values, target):\n    for v in values:\n        if v == target:\n            return True\n    return False\n\ndef merge_memories(a, b):\n    out = []\n    for x in a:\n        if not contains(out, x):\n            out.append(x)\n    for x in b:\n        if not contains(out, x):\n            out.append(x)\n    return out',
  'som-x2': 'def verify_chain(flags):\n    prev = ""\n    for f in flags:\n        if f == "bad":\n            if prev == "bad":\n                return False\n        prev = f\n    return True',
  'som-x3': 'def guard_multi(temp, pressure, critical):\n    if critical:\n        if temp > 80 or pressure > 120:\n            return "CRITICAL"\n        return "WATCH"\n    if temp > 90 or pressure > 150:\n        return "OVERLOAD"\n    return "SAFE"',
  'som-x4': 'def audit_records(records):\n    ok = 0\n    warn = 0\n    bad = []\n    for r in records:\n        if r == "ok":\n            ok = ok + 1\n        elif r == "warn":\n            warn = warn + 1\n        else:\n            bad.append(r)\n    return [ok, warn, bad]',

  // ---------- INDEX-0 HARD ----------
  'idx-h1': 'def find_last(name, names):\n    last = -1\n    for i in range(len(names)):\n        if names[i] == name:\n            last = i\n    return last',
  'idx-h2': 'def dedupe(ids):\n    out = []\n    i = 0\n    while i < len(ids):\n        x = ids[i]\n        if x != -1:\n            if x not in out:\n                out.append(x)\n        i = i + 1\n    return out',
  'idx-h3': 'def take_chunk(items, size):\n    if size <= 0:\n        return []\n    if size > len(items):\n        size = len(items)\n    out = []\n    i = 0\n    while i < size:\n        out.append(items[i])\n        i = i + 1\n    return out',
  'idx-h4': 'def count_missing(rows):\n    bad = 0\n    for row in rows:\n        if row[0] <= 0:\n            bad = bad + 1\n    return bad',

  // ---------- INDEX-0 EXPERT ----------
  'idx-x1': 'def merge_sorted(a, b):\n    out = []\n    i = 0\n    j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            out.append(a[i])\n            i = i + 1\n        else:\n            out.append(b[j])\n            j = j + 1\n    while i < len(a):\n        out.append(a[i])\n        i = i + 1\n    while j < len(b):\n        out.append(b[j])\n        j = j + 1\n    return out',
  'idx-x2': 'def rotate_left(items, k):\n    n = len(items)\n    if n == 0:\n        return []\n    while k >= n:\n        k = k - n\n    out = []\n    i = k\n    while i < n:\n        out.append(items[i])\n        i = i + 1\n    i = 0\n    while i < k:\n        out.append(items[i])\n        i = i + 1\n    return out',
  'idx-x3': 'def missing_items(stock, wanted):\n    missing = []\n    for w in wanted:\n        found = False\n        for s in stock:\n            if s == w:\n                found = True\n        if not found:\n            missing.append(w)\n    return missing',
  'idx-x4': 'def compress(values):\n    out = []\n    if len(values) == 0:\n        return out\n    cur = values[0]\n    count = 1\n    i = 1\n    while i < len(values):\n        if values[i] == cur:\n            count = count + 1\n        else:\n            out.append(cur)\n            out.append(count)\n            cur = values[i]\n            count = 1\n        i = i + 1\n    out.append(cur)\n    out.append(count)\n    return out',

  // ---------- JUDGMENT-4 HARD ----------
  'jd-h1': 'def total_score(scores):\n    total = 0\n    for s in scores:\n        if s > 0:\n            total = total + s\n    return total',
  'jd-h2': 'def verdict(score, bonus):\n    final = score + bonus\n    if final >= 90:\n        return "PASS"\n    if final >= 60:\n        return "REVIEW"\n    return "REJECT"',
  'jd-h3': 'def make_label(name, code):\n    if name == "":\n        name = "UNKNOWN"\n    if code == "":\n        code = "N/A"\n    return name + ":" + code',
  'jd-h4': 'def limit_values(values, low, high):\n    out = []\n    for v in values:\n        if v >= low and v <= high:\n            out.append(v)\n    return out',

  // ---------- JUDGMENT-4 EXPERT ----------
  'jd-x1': 'def normalize(value):\n    if value < 0:\n        return 0\n    if value > 100:\n        return 100\n    return value\n\ndef apply_all(values):\n    out = []\n    for v in values:\n        out.append(normalize(v))\n    return out',
  'jd-x2': 'def audit_orders(orders):\n    ok_total = 0\n    bad = 0\n    for row in orders:\n        amount = row[1]\n        if amount > 0:\n            ok_total = ok_total + amount\n        else:\n            bad = bad + 1\n    return ok_total, bad',
  'jd-x3': 'def clean(values, limit):\n    out = []\n    for v in values:\n        if v >= 0 and v <= limit:\n            out.append(v)\n    return out\n\ndef pipeline(raw, limit):\n    data = clean(raw, limit)\n    total = 0\n    for v in data:\n        total = total + v\n    return len(data), total',
  'jd-x4': 'def count_ok(levels):\n    count = 0\n    for x in levels:\n        if x >= 1:\n            count = count + 1\n    return count\n\ndef gate_check(levels, min_ok):\n    if count_ok(levels) >= min_ok:\n        return True\n    return False',

  // ---------- ENTROPY HARD ----------
  'en-h1': 'def collect(table, keys):\n    out = []\n    for k in keys:\n        out.append(table.get(k, 0))\n    return out',
  'en-h2': 'def count_valid(records):\n    good = 0\n    bad = 0\n    for k in records:\n        try:\n            int(records[k])\n            good = good + 1\n        except ValueError:\n            bad = bad + 1\n    return good, bad',
  'en-h3': 'def sum_valid(records):\n    total = 0\n    for k in records:\n        try:\n            total = total + int(records[k])\n        except ValueError:\n            pass\n    return total',
  'en-h4': 'def has_all(table, keys):\n    missing = []\n    for k in keys:\n        if table.get(k, "MISSING") == "MISSING":\n            missing.append(k)\n    return missing',

  // ---------- ENTROPY EXPERT ----------
  'en-x1': 'def merge_tables(a, b):\n    out = dict(a)\n    for k in b:\n        if k in out:\n            out[k] = out[k] + b[k]\n        else:\n            out[k] = b[k]\n    return out',
  'en-x2': 'def repair_ledger(rows):\n    out = {}\n    for row in rows:\n        k = row[0]\n        try:\n            v = int(row[1])\n        except ValueError:\n            continue\n        if k in out:\n            out[k] = out[k] + v\n        else:\n            out[k] = v\n    return out',
  'en-x3': 'def diagnose(records):\n    out = []\n    for name in records:\n        value = records[name]\n        try:\n            n = int(value)\n        except ValueError:\n            out.append(name + ":ERR")\n            continue\n        if n > 80:\n            out.append(name + ":HIGH")\n        elif n < 20:\n            out.append(name + ":LOW")\n        else:\n            out.append(name + ":OK")\n    return out',
  'en-x4': 'def stable_sum(records, keys):\n    total = 0\n    missing = 0\n    for k in keys:\n        value = records.get(k, "MISSING")\n        if value == "MISSING":\n            missing = missing + 1\n        else:\n            try:\n                total = total + int(value)\n            except ValueError:\n                missing = missing + 1\n    return total, missing',

  // ---------- K-0 HARD ----------
  'k0-h1': 'def merge_priority(a, b):\n    out = dict(a)\n    for k in b:\n        if k not in out or b[k] > out[k]:\n            out[k] = b[k]\n    return out',
  'k0-h2': 'def is_ascending(values):\n    i = 1\n    while i < len(values):\n        if values[i] <= values[i - 1]:\n            return False\n        i = i + 1\n    return True',
  'k0-h3': 'def score_records(records):\n    total = 0\n    for row in records:\n        if row[0] == "ok":\n            total = total + row[1]\n    return total',
  'k0-h4': 'def repair_matrix(rows):\n    total = 0\n    for row in rows:\n        for cell in row:\n            try:\n                total = total + int(cell)\n            except ValueError:\n                pass\n    return total',

  // ---------- K-0 EXPERT ----------
  'k0-x1': 'def recover(entries):\n    table = {}\n    bad = 0\n    for entry in entries:\n        key = entry[0]\n        try:\n            value = int(entry[1])\n        except ValueError:\n            bad = bad + 1\n            continue\n        if key in table:\n            table[key] = table[key] + value\n        else:\n            table[key] = value\n    return table, bad',
  'k0-x2': 'def merge_safe(a, b):\n    out = dict(a)\n    conflicts = []\n    for k in b:\n        if k in out:\n            if b[k] != out[k]:\n                conflicts.append(k)\n            if b[k] > out[k]:\n                out[k] = b[k]\n        else:\n            out[k] = b[k]\n    return out, conflicts',
  'k0-x3': 'def audit_stream(records, limit):\n    high = 0\n    low = 0\n    bad = 0\n    for raw in records:\n        try:\n            value = int(raw)\n        except ValueError:\n            bad = bad + 1\n            continue\n        if value > limit:\n            high = high + 1\n        elif value < 0:\n            low = low + 1\n    return high, low, bad',
  'k0-x4': 'def final_repair(rows):\n    total = 0\n    bad = 0\n    for row in rows:\n        try:\n            total = total + int(row[1])\n        except ValueError:\n            bad = bad + 1\n    if total >= 0:\n        return "STABLE", total, bad\n    return "UNSTABLE", total, bad',
};
