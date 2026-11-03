# 验证 sys.settrace 轨迹采集逻辑（与 worker 注入的 glue 同款）
# 用 CPython 模拟：StringIO 包装器替代 JS setStdout，dict 替代 JS 对象
import contextlib
import io
import sys


class OutSince:
    def __init__(self, sink, tracker):
        self.sink = sink
        self.tracker = tracker
        self._buf = io.StringIO()

    def write(self, s):
        self._buf.write(s)
        self.tracker["val"] += s

    def flush(self):
        self.sink.write(self._buf.getvalue())
        self._buf = io.StringIO()


def run_traced(code):
    trace = []
    out_since = {"val": ""}
    real_out = io.StringIO()

    class FakeSink:
        def write(self, s):
            real_out.write(s)

        def flush(self):
            pass

    wrapper = OutSince(FakeSink(), out_since)

    def tracer(frame, event, arg):
        if event == "line" and frame.f_code.co_filename == "<exec>":
            if len(trace) < 500:
                trace.append({
                    "line": frame.f_lineno,
                    "vars": {k: repr(v)[:80] for k, v in frame.f_locals.items()
                             if not k.startswith("__") and k not in ("frame", "event", "arg", "tracer")},
                    "out": out_since["val"],
                })
                out_since["val"] = ""
        return tracer

    sys.settrace(tracer)
    out_since["val"] = ""
    try:
        with contextlib.redirect_stdout(wrapper):
            exec(compile(code, "<exec>", "exec"))
        if out_since["val"]:
            trace.append({"line": trace[-1]["line"] if trace else -1, "vars": {}, "out": out_since["val"]})
    except BaseException:
        real_out.write("\n[EXCEPTION] " + sys.exc_info()[0].__name__)
    finally:
        sys.settrace(None)
        wrapper.flush()

    return trace, real_out.getvalue()


# ---------- 用例 1：1-4 修复版（函数 + 循环 + 局部变量） ----------
code14 = '''def filter_alerts(temps):
    alerts = []

    for temp in temps:
        if temp >= 40:
            alerts.append(temp)

    return alerts

r = filter_alerts([22, 41, 42, 38, 45])
print("RESULT", r)'''

trace, out = run_traced(code14)
print("== 1-4 轨迹步数:", len(trace), " 输出:", repr(out))
assert out.strip() == "RESULT [41, 42, 45]", "stdout 校验失败: " + repr(out)
assert len(trace) > 5, "轨迹过短"
has_alerts = any("alerts" in t["vars"] for t in trace)
print("   包含函数局部变量 alerts 的步骤:", has_alerts)
assert has_alerts, "未采集到函数局部变量"
has_temp = any("temp" in t["vars"] for t in trace)
assert has_temp, "未采集到循环变量 temp"
print("   包含循环变量 temp 的步骤:", has_temp)
out_steps = [t for t in trace if t["out"]]
print("   带输出增量的步骤数:", len(out_steps), " 最后输出增量:", repr(out_steps[-1]["out"] if out_steps else None))
assert out_steps and out_steps[-1]["out"].strip() == "RESULT [41, 42, 45]", "输出增量定位错误"

# ---------- 用例 2：异常时轨迹保留到崩溃点 ----------
code_bad = '''def divide(a, b):
    return a / b

x = divide(1, 0)'''
trace2, out2 = run_traced(code_bad)
print("== 异常轨迹步数:", len(trace2), " 输出:", repr(out2))
assert "ZeroDivisionError" in out2, "异常未捕获标记"
last_line = max(t["line"] for t in trace2) if trace2 else None
print("   最后轨迹行号:", last_line, "（应为 return a / b 附近，def 第2行）")
assert last_line >= 1 and last_line <= 4, "异常前最后行号异常: " + str(last_line)

# ---------- 用例 3：500 步截断（长循环不引爆） ----------
code_loop = '''i = 0
total = 0
while i < 10000:
    total = total + i
    i = i + 1
print(total)'''
trace3, out3 = run_traced(code_loop)
print("== 长循环轨迹步数(应被截断在500):", len(trace3), " 输出:", repr(out3))
assert len(trace3) <= 502, "轨迹未截断"

print("ALL DEBUG TRACE CHECKS PASSED")
