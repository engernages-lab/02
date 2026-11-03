# 用 runpy 逐文件执行所有用例：捕获每个用例的 stdout / 退出码 / traceback
# 与 Pyodide 的语义一致：异常 -> rc=1 + traceback；正常 -> rc=0 + stdout
import contextlib
import io
import json
import os
import runpy
import sys
import traceback

base = os.path.dirname(os.path.abspath(__file__))
cases_dir = os.path.join(base, "cases")
results = []

for name in sorted(os.listdir(cases_dir)):
    if not name.endswith(".py"):
        continue
    path = os.path.join(cases_dir, name)
    buf = io.StringIO()
    rc = 0
    err = ""
    try:
        with contextlib.redirect_stdout(buf):
            runpy.run_path(path, run_name="__main__")
    except SystemExit as e:
        rc = e.code if isinstance(e.code, int) else 0
    except BaseException:
        rc = 1
        err = traceback.format_exc()
    results.append({"file": name, "rc": rc, "out": buf.getvalue(), "err": err})

# 结果写入同目录 runall.out（UTF-8），避免控制台重定向编码问题
out_path = os.path.join(cases_dir, "runall.out")
with open(out_path, "w", encoding="utf-8") as fp:
    for r in results:
        fp.write(json.dumps(r, ensure_ascii=False) + "\n")
print("runall done:", len(results), "cases")
