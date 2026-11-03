# 验证 worker 内嵌的调试胶水（base64 解码后同款）在 CPython 下的行为
import contextlib
import io
import os

here = os.path.dirname(os.path.abspath(__file__))
glue = open(os.path.join(here, "_glue_check.py"), encoding="utf-8").read()


def run_case(code):
    out = {"v": ""}

    def take_out():
        v = out["v"]
        out["v"] = ""
        return v

    ns = {"__nx_src": code, "__nx_take_out": take_out}

    class Sink:
        def write(self, s):
            out["v"] += s

        def flush(self):
            pass

    sink = Sink()
    err = None
    try:
        with contextlib.redirect_stdout(sink):
            exec(compile(glue, "<glue>", "exec"), ns)
    except BaseException as e:
        err = e
    return ns.get("__nx_trace", []), out["v"], err


# 用例 1：函数 + 循环 + 局部变量 + 末尾输出
code1 = '''def filter_alerts(temps):
    alerts = []
    for temp in temps:
        if temp >= 40:
            alerts.append(temp)
    return alerts

r = filter_alerts([22, 41, 42, 38, 45])
print("RESULT", r)'''
t1, tail1, e1 = run_case(code1)
print("case1 steps:", len(t1), "| err:", e1, "| tail:", repr(tail1))
assert e1 is None
assert any("alerts" in s["vars"] for s in t1), "缺少函数局部变量"
assert any("temp" in s["vars"] for s in t1), "缺少循环变量"
outs = [s["out"] for s in t1 if s.get("out")]
print("case1 输出增量:", outs)
assert outs and outs[-1].strip() == "RESULT [41, 42, 45]", "输出增量不正确"

# 用例 2：异常（轨迹保留 + 异常抛出）
code2 = 'def divide(a, b):\n    return a / b\n\nx = divide(1, 0)'
t2, tail2, e2 = run_case(code2)
print("case2 steps:", len(t2), "| err:", type(e2).__name__ if e2 else None)
assert e2 is not None and type(e2).__name__ == "ZeroDivisionError"

# 用例 3：长循环截断（500 步）
code3 = 'i = 0\ntotal = 0\nwhile i < 10000:\n    total = total + i\n    i = i + 1\nprint(total)'
t3, tail3, e3 = run_case(code3)
print("case3 steps:", len(t3), "| tail:", repr(tail3))
assert e3 is None
assert len(t3) <= 502, "轨迹未截断"

# 用例 4：无输出的程序（空轨迹也合法）
t4, tail4, e4 = run_case('x = 1')
print("case4 steps:", len(t4), "| err:", e4)
assert e4 is None

print("ALL GLUE CHECKS PASSED")
