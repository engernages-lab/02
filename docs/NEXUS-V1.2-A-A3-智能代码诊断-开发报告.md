# NEXUS V1.2-A · A3 智能 Python 代码诊断 · 开发报告

> 阶段：V1.2-A / A3（仅本阶段，A4–A6 未开始）
> 分支：`feature/v1.2-a-experience-polish`
> 前置：A1（f1c90a9）、A2（b536df2）已通过并保持可用

---

## 一、开发前检查结论

| 检查项 | 现状 | 处理 |
|---|---|---|
| 代码编辑器 | Monaco，`CodeEditor` 受控 | 不改，仅接入诊断结果 |
| 运行器 | `pythonRunner` 主线程执行，`except` 只回 `类型: 消息` | **补真实 traceback**（`sys.print_exception`），不改编排语义 |
| 判题 | `judgeRun` 依据真实执行 + 注入测试 | 完全不改，诊断只读其结果 |
| 错误提示 | `parseTraceback` 简单解析 + `miraOnError` 7 条静态文案 | 新增 `diagnose.ts` 统一分析，旧函数保留给调试路径 |
| 挑战页 | 运行/提交两处失败分支各自写死提示 | 统一走 `diagnoseAndShow()`，判题逻辑不动 |
| A1 草稿 | 独立 localStorage，500ms 防抖 | 诊断不写草稿；e2e 验证诊断后草稿不丢 |
| A2 响应式 | 4 标签（任务/代码/输出/MIRA） | 新增第 5 标签「诊断」，平板侧栏新增「诊断」 |
| 既有分析模块 | 无（只有错误文案表） | 新建 `services/diagnose.ts`，复用 `knowledge.ts` 知识点 |

---

## 二、新增能力与识别类型

### 1. 语法错误（结合源码结构，不靠字符串匹配）

MicroPython 把漏冒号、缩进、括号、引号全部报成 `SyntaxError: invalid syntax`，且**没有 IndentationError / TabError 类型**。因此诊断先取真实报错行，再做源码结构分析：

| 子类型 | 判定依据 | 输出 |
|---|---|---|
| 缺少冒号 | `if/for/while/def/...` 行不以 `:` 结尾 | 行号 + 列 + 补冒号建议 |
| 代码块没有缩进 | 上一行以 `:` 结尾，本行顶格 | 指出是哪一行开始需要缩进 |
| 多出缩进 | 本行有缩进、上一行不是块开头 | 建议取消多余缩进 |
| 引号未闭合 | 平衡扫描得到未闭合引号位置 | 精确到行/列 |
| 括号未闭合 | 括号栈非空，取最深未闭合括号 | 精确到行/列 |
| 代码块缺内容 / 意外结束 | 报错行超过文件行数（EOF） | 指回最后一条语句 |
| 赋值写进条件 | 条件里出现单个 `=` | 提示改成 `==` |
| Tab 与空格混用 | 缩进风格前后不一致 | 归类 TabError（源码推断，置信度 medium） |
| 其他无效语法 | 以上都不匹配 | 明确说「解释器只给位置」，给排查清单，confidence=low |

### 2. 运行时错误

解析真实 traceback 帧（`File "<string>", line N`），取用户代码最内层帧作为出错行：

NameError / UnboundLocalError / TypeError / ValueError / IndexError / KeyError / ZeroDivisionError / AttributeError / ImportError / ModuleNotFoundError / RecursionError / RuntimeError（含递归）/ OverflowError / AssertionError。

每种异常给出：中文标题、行号、原始信息、原因（尽量从消息里提取具体名字/键/属性）、知识点、三层提示、MIRA 台词。

### 3. 逻辑 / 输出错误

只在「程序正常结束但判题未通过」时触发：

- stdout 判题 → **输出不匹配**，显示差异说明（来自 `judge.ts` 已有的 `diffHint`），提示空格/中文标点/顺序；
- 函数型判题 → **逻辑错误**，根据未通过项名称 + 可验证的代码特征给出「可能原因」：
  `>` 与 `>=` 的边界、`range(固定数字)`、`range(len(x)-1)`、`while` 无计数更新、`while True` 无 break、
  函数缺 `return`、条件里误用 `=` 等。
- 所有逻辑结论 confidence 为 medium/low，文案统一使用「可能 / 值得检查」，不冒充确定结论。

### 4. 超时

- 执行超时 → 定位第一个循环行，解释「循环条件永远为真 / 次数过大」，给缩小范围建议。

---

## 三、分层提示与 MIRA

- 三层固定语义：**方向（定位区域）→ 原因（为什么）→ 修复（怎么改，不给答案代码）**。
- 面板默认展开层数 = 同一错误连续触发次数（1→2→3），也可手动「继续分析 / 回到第一层」。
- MIRA 台词按错误族准备多套变体，用 `（连续次数 + 行号）` 选择，保证连续失败不重复；
  连续 3 次追加安抚/策略句。通过时给正向反馈。
- 不打断编辑：诊断只在运行/提交后更新面板，不弹窗、不抢焦点；手机端需切到「诊断」标签才看。

---

## 四、与判题系统的隔离（本阶段硬约束）

1. `diagnoseRun()` 的输入只有 `level / code / run / verdict`，**没有任何写回判题结论的能力**。
2. 挑战页的通过/失败仍由 `judgeRun` 的 `passed` 决定；诊断在判题之后执行，只影响面板与 MIRA 文案。
3. 不改 `judge.ts`、`levels.ts`、测试用例与判题标准；诊断不读取/不输出 `pythonChecks` 表达式。
4. 提示中不出现标准答案、隐藏测试数据；语法错误提示连任务答案文本都不包含（有断言）。
5. 判题与诊断结论冲突时以判题结果为准（e2e：语法错误 + 提交，面板显示语法错误，但不会因此通关）。
6. 无外部 AI / API / 密钥，纯本地规则 + 解释器输出。

---

## 五、关键实现修复（过程中发现）

### 1. 执行超时对 while 完全失效（原有缺陷）

实测：本引擎的 `sys.settrace` 只对 `for` 循环产生行事件，`while`（含 `while True`）**不产生任何 trace 事件**，看门狗从不触发，主线程会被永久阻塞（浏览器标签页卡死）。

处理：新增 `services/sandboxRunner.ts`——**只对含 `while` 的代码**使用一次性 module Worker 执行，超时直接 `terminate()`，语义仍是「真实执行 + 超时」。不含 `while` 的代码继续走原主线程路径，速度与行为不变。实测普通 while 代码沙箱执行 219ms，死循环 5.4s 返回且页面可交互。

### 2. 递归爆栈会破坏后续的超时看门狗

实测：`RecursionError` 之后，同一实例的 `settrace` 对后续 for 循环不再生效（超时失效）。处理：运行器记录 `traceSuspect`，出现递归错误后后续执行一律改走 Worker 沙箱；`resetEngine()` 清除该标记。

### 3. traceback 的获取方式

该 MicroPython 端口 `sys.stderr` 不可写、异常对象没有 `__traceback__`、`settrace` 的 `exception` 事件不投递。唯一可行方案是 `sys.print_exception(e, io.StringIO())`，已实测能拿到 `File "<string>", line N` 帧，并随 `__NX_RES__` 一并返回（新增 `RunOutcomeShape.traceback`）。

---

## 六、修改文件

| 类型 | 文件 | 说明 |
|---|---|---|
| 新增 | `src/services/diagnose.ts` | 诊断核心：traceback 帧解析、括号/引号/缩进分析、运行时元数据、逻辑特征、三层提示、MIRA 台词 |
| 新增 | `src/services/sandboxRunner.ts` | while 代码的 Worker 硬超时沙箱（含可用性检测） |
| 新增 | `src/components/DiagnosisPanel.tsx` | 诊断面板：状态/类型/行号/片段/原因/三层/MIRA/历史/原始信息 |
| 修改 | `src/services/pythonRunner.ts` | 回传 traceback；while 走沙箱；递归后降级沙箱；结果解释函数重构 |
| 修改 | `src/game/types.ts` | `RunOutcomeShape.traceback` |
| 修改 | `src/pages/ChallengePage.tsx` | 诊断接入运行/提交各分支、连续失败计数、第 5 标签、平板侧栏诊断、面板挂载 |
| 修改 | `src/styles/global.css` + `public/global.css` | 诊断面板样式、手机/平板标签过滤 |
| 新增 | `test/diagnose_check.mjs` | 62 条逻辑断言（真实 MicroPython） |
| 新增 | `test/diagnose_e2e.mjs` | 52 条端到端断言（Chrome Headless + CDP） |
| 新增 | `docs/a3-screens/*.png` | 桌面运行时错误 / 超时 / 手机诊断截图 |

未改动：`judge.ts`、`levels.ts`、`knowledge.ts`、`battle.ts`、`chapterFlow.ts`、存档结构与迁移链。

---

## 七、测试结果（全部真实执行）

| 测试 | 结果 |
|---|---|
| `diagnose_check`（语法/运行时/超时/逻辑/输出/分层/防泄露） | **62 / 62** |
| `diagnose_e2e`（真实 Chrome + 真实 MicroPython） | **52 / 52** |
| `draft_check` / `draft_e2e`（A1 回归） | 52/52 · 39/39 |
| `verify` / `mp_verify`（判题链路） | 71/71 · 71/71 |
| `boss_battle_check` / `boss_verify` | 105/105 · 19/19 |
| `audit_initial`（31 关初始代码） | 全部不通过（预期） |
| `smoke`（原有玩法） | 全部通过 |
| `layout_e2e`（A2 回归，5 标签） | 116 / 116 |
| 逻辑套件 11 组 | 1345 条全通过 |
| `tsc --noEmit` / `npm run build` | 0 错误 / 成功（896 KB） |

### 对应任务书 A–I

| 用例 | 覆盖 |
|---|---|
| A 语法错误 | 缺冒号/缺缩进/引号/括号/赋值条件/EOF，行号断言 |
| B 变量错误 | NameError + 行号 + 名字提取 |
| C 类型错误 | TypeError（str + int） |
| D 索引错误 | IndexError + 行号 |
| E 逻辑错误 | 1-4 用 `>` 代替 `>=`，真实判题失败后给边界提示且 confidence=medium |
| F 分层提示 | 连续三次同一错误，面板 layers 1→2→3（单测 + e2e） |
| G 草稿保存 | 诊断后草稿内容不变；刷新后恢复且诊断重置 |
| H 移动端 | 320/360/390/430 诊断标签、无横向溢出、操作栏可见、编辑器高度不受影响 |
| I 功能回归 | 进入关卡/运行/提交/通关/Boss/存档恢复全套回归 |

---

## 八、已知限制

1. **TabError 无法由解释器直接给出**：本 MicroPython 不抛 TabError，只能在已发生语法错误时由缩进风格分析归类（medium）。
2. **逻辑原因只能是可能**：无法从「结果不对」唯一反推出错误代码，面板明确标注置信度与「可能原因」。
3. **Worker 沙箱依赖 module worker**：不支持的环境会退回主线程（保持原可用性，但死循环仍可能卡住）；现代浏览器均支持。
4. **调试模式含 while 时也走沙箱**：超时会丢失部分轨迹（原实现会直接卡死，属于改进）。
5. A4 才修「升级提示容错 +0」，本轮截图里仍可见，未越界修改。

---

## 九、下一阶段

A3 完成并暂停。A4 将统一 `challengeSession` 数据源、修复容错 +0 与结算显示；A5 商城；A6 经济。
