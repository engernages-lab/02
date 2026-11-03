# 校验实验室 10 道题的参考答案是否满足题面期望（stdout 必须包含 expect 全部内容）
import io
import contextlib

CASES = [
    ("p1", 'print("WELCOME TO NEXUS")', ["WELCOME TO NEXUS"]),
    ("p2", 'status = "ok"\nif status == "ok":\n    print("ONLINE")\nelse:\n    print("OFFLINE")', ["ONLINE"]),
    ("p3", 'total = 0\ni = 1\nwhile i <= 50:\n    total = total + i\n    i = i + 1\nprint("TOTAL", total)', ["TOTAL 1275"]),
    ("p4", 'scores = [45, 72, 58, 90, 33]\npassed = []\nfor s in scores:\n    if s >= 60:\n        passed.append(s)\nprint(passed)', ["[72, 90]"]),
    ("p5", 'tokens = ["ok", "warn", "ok"]\ncounts = {}\nfor word in tokens:\n    counts[word] = counts.get(word, 0) + 1\nprint(counts)', ["{'ok': 2, 'warn': 1}"]),
    ("p6", 'def area(width, height):\n    return width * height\n\nprint("AREA", area(3, 4))', ["AREA 12"]),
    ("p7", 'text = "abc"\ntry:\n    value = int(text)\nexcept ValueError:\n    value = 0\nprint(value)', ["0"]),
    ("p8", 'parts = ["NEXUS", "REPAIR", "UNIT"]\nprint("-".join(parts))', ["NEXUS-REPAIR-UNIT"]),
    ("p9", 'records = {"sensor": "S-01"}\nprint(records["sensor"])\nprint(records.get("valve", "UNKNOWN"))', ["S-01", "UNKNOWN"]),
    ("p10", 'def grade(scores):\n    for s in scores:\n        if s < 60:\n            return "RETRY"\n    return "ALL PASS"\n\nprint(grade([60, 75, 90]))\nprint(grade([60, 40, 90]))', ["ALL PASS", "RETRY"]),
]

ok = 0
for name, code, expect in CASES:
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(code, "<exec>", "exec"), {})
        out = buf.getvalue()
        missing = [e for e in expect if e not in out]
        good = not missing
        print(("PASS" if good else "FAIL") + " | " + name + " | out=" + repr(out.strip()[:60]) + ("" if good else " | missing=" + str(missing)))
        if good:
            ok += 1
    except BaseException as e:
        print("FAIL | " + name + " | 执行异常: " + type(e).__name__ + ": " + str(e))

print("LAB MISSIONS:", str(ok) + "/" + str(len(CASES)))
raise SystemExit(0 if ok == len(CASES) else 1)
