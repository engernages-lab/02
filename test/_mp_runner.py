import json
__nx_src = __NX_SRC__
__nx_out = []
def __nx_print(*args, sep=" ", end="\n"):
    __nx_out.append(sep.join([str(a) for a in args]) + end)
__nx_ns = {"print": __nx_print, "__name__": "__main__"}
__nx_err = ""
try:
    exec(__nx_src, __nx_ns)
except Exception as e:
    __nx_err = type(e).__name__ + ": " + str(e)
print("__NX_RES__" + json.dumps({"out": "".join(__nx_out), "err": __nx_err}))