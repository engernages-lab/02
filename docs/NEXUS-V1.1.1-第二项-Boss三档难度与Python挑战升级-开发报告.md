# NEXUS V1.1.1 · 第二项核心改进：Boss 三档难度与 Python 挑战升级 · 开发报告

> 目标：六个章节 Boss × EASY / HARD / EXPERT 三档独立 Python 挑战（共 18 套、72 个阶段），
> 难度差异来自「代码题目、考点、测试、边界、提示、评分」，不是血量/扣血/错误次数。
> 所有题目接入真实 MicroPython 判题；全部初始故障代码与参考解均经过真实执行审计。

---

## 一、开发前检查与问题清单

| # | 现状 | 本次处理 |
|---|---|---|
| 1 | 每个 Boss 只有一套 `BossBattleDef`（4 阶段） | 新增 18 套难度配置，72 个阶段 |
| 2 | `BossBattleState` 没有难度字段，旧战斗状态无法区分题目 | 增加 `difficulty` / `started`，旧档缺失默认 EASY |
| 3 | Boss 入口没有难度选择界面 | 新增全屏难度准备界面（含 Boss 形象、背景、三档卡片、考点、阶段、提示、奖励、返回） |
| 4 | 题目难度只能靠改血量/反击值 | 三档使用不同函数、不同错误、不同测试集，血量统一 100 |
| 5 | 奖励只有章节首杀 | 增加难度一次性经验/贡献点、困难/专家徽章、专家称号；按难度防刷 |
| 6 | 没有难度挑战记录 | `progress.bossRecords` 记录首次/最高难度、各难度通关时间与次数 |
| 7 | `baselineMask` 可能手写失真 | 新增 `tools/audit_difficulty.mjs` 逐阶段真实执行并校验 |
| 8 | 旧存档没有难度/记录字段 | 不升存档版本，`normalizePlayerState` 自愈；旧战斗按 EASY 处理 |

**结论**：开发前未发现「未教授语法」被现有 Boss 使用；本次新增题目按实际课程清单逐条约束并通过 `cumulativeKnowledge` 自动校验。

---

## 二、实际课程知识点清单（题目设计的唯一依据）

从 `src/game/levels.ts` 实际数据导出：

| 章节 | 服务器 | 实际 knowledge 标签 |
|---|---|---|
| 第 1 章 | 语法维修站 | `print` `if` `indent` `string` `variable` `compare` `for` `list` `return` |
| 第 2 章 | 数据日志中心 | 前章 + `else` `elif` `logic` `not` |
| 第 3 章 | 存储数据仓 | 前章 + `while` `len` `range`（Boss 既有写法）、列表下标 |
| 第 4 章 | 自动化工厂 | 前章 + 函数 `def`、`parameter`、`return` |
| 第 5 章 | 系统诊断中心 | 前章 + `dict`、`get`、`try` / `except`、`int` |
| 第 6 章 | 方舟核心机房 | 全部已学：列表/循环/字典/异常/函数/条件综合 |

约束：

- 第 1 章题目只用变量、字符串、比较、`if`、`for`、列表、`print`；
- 第 2 章不出现列表下标循环、字典、异常；
- 第 3 章不出现函数参数/字典/异常；
- 第 4 章才出现多函数、参数、返回值；
- 第 5 章才出现字典/`try`；
- 第 6 章综合全部已学内容，不引入第三方库、网络、数据库、硬件或非编程知识。

`tools/audit_difficulty.mjs` 对每个阶段调用 `knowledgeViolations(def)`，18 套全部为空。

---

## 三、难度架构

```
difficulty.ts           三档元数据（标签/颜色/说明/知识点范围/提示规则/奖励）
bossDifficulties.ts     18 套 BossBattleDef + 72 个 BossPhaseDef
battle.ts               BossBattleState 增加 difficulty/started；normalize 对难度不匹配直接重置
gameStore.tsx           beginBossBattle(bossId,difficulty) / startBossBattle / abandonBossBattle
                        submitBossAttack 读取当前难度 → 真实判题 → 伤害 → 首胜/模拟事务
chapterFlow.ts          handleBossFirstClear(..., {difficulty}) / recordBossDifficultyClear
BossBattlePage.tsx      难度准备界面 + 难度锁定 + 模拟再战 + 首胜结算
ProfilePage.tsx         每个 Boss 的难度战绩与徽章
```

### 3.1 难度锁定

- `BossBattleState.started`：点击「开始挑战」后置为 `true`；
- 进入未完成战斗前必须选择难度；进行中再次进入只显示「继续挑战 / 放弃本场」；
- 放弃本场会清空战斗进度（不动永久奖励），之后可重新选择；
- 意识崩解重生后战斗重置，难度选择界面自动重新打开，可重新选择；
- 旧存档没有 `started` 的进行中战斗按已开始处理，避免随意切换。

### 3.2 血量与难度解耦

三档 `maxHp` 均为 100，阶段数均为 4；反击伤害仅保留原有小幅差异（3/4/5），
不参与难度定义。伤害仍只来自真实判题的 `newPassed / total`。

### 3.3 提示层级

难度影响实际可用的提示数量（数据中保留三层，UI 按难度截断）：

- EASY：3 层（现象 → 定位方向 → 具体修复点）；
- HARD：2 层（现象 → 思路方向），不直接给出修复行；
- EXPERT：1 层（现象/思路），要求独立分析。

---

## 四、18 套难度配置（72 个阶段）

| Boss | EASY | HARD | EXPERT |
|---|---|---|---|
| **GATE-01** | 能源启动程序 / 防御逻辑 / 数据传输模块 / 综合服务器恢复（13 测试） | 双路能源闸门 / 能源节点统计 / 端口标签生成 / 能源审计汇总（15） | 能源回路核算 / 阈值升压 / 状态切换计数 / 温度日志编码（16） |
| **SOMNIA** | 记忆分流 / 逻辑校验 / 循环筛查 / 综合记忆重建（12） | 记忆分流器 / 异常记忆过滤 / 合并许可 / 记忆批次审计（16） | 双列表记忆合并 / 连续损坏检测 / 多重守护条件 / 异常记忆归档（16） |
| **INDEX-0** | 修复身份索引程序 / 修复数据读取逻辑 / 解决重复与丢失 / 综合实验档案恢复（12） | 最后一次索引 / 重复与缺失清理 / 分页读取 / 缺失编号统计（16） | 有序索引合并 / 索引循环移位 / 缺失档案检索 / 连续档案压缩（16） |
| **JUDGMENT-4** | 解除外围能源防御 / 修复安全裁决逻辑 / 破解多层权限验证 / 完成核心命令恢复（13） | 有效评分汇总 / 加分裁决 / 档案标签 / 区间裁决（16） | 数值标准化流水线 / 工单审计 / 清洗汇总流水线 / 多级闸门校验（16） |
| **ENTROPY** | 清除外围数据污染 / 修复异常数据关联 / 修复多个关联核心程序 / 完成综合修复（12） | 安全批量取值 / 记录合法性统计 / 污染值求和 / 缺失键审计（17） | 双表合并 / 账本修复 / 污染诊断 / 稳定求和（16） |
| **K-0** | 绝对安全壁垒 / 零号裁决 / 原初核心崩坏 / 最终命令（14） | 优先级配置合并 / 严格递增校验 / 有效记录计分 / 矩阵容错求和（16） | 恢复流水线 / 安全配置合并 / 数据流审计 / 最终恢复命令（16） |

合计：**18 套配置、72 个阶段、268 条真实测试检查**。

每档难度都是独立题目：阶段 id、阶段标题、初始代码、测试表达式全部不同（`difficulty_check.mjs` 断言）。

---

## 五、奖励系统

| 难度 | 首通额外经验 | 首通额外贡献点 | 徽章 | 称号 |
|---|---|---|---|---|
| EASY | 0% | 0% | 无 | 无 |
| HARD | +40% Boss 基础经验 | +50% 章节首杀贡献点 | 每 Boss 一枚「困难徽章」 | 无 |
| EXPERT | +70% Boss 基础经验 | +100% 章节首杀贡献点 | 每 Boss 一枚「专家徽章」 | 首次专家通关解锁「专家裁决者」 |

- 三档均可获得对应 Boss 的创世主碎片、章节完成、下一章解锁——**主线不锁在专家难度**。
- 难度奖励按 `bossId@difficulty` 一次性发放（`rewards.difficultyRewards` + `bossRecords.clear.rewarded` 双账本幂等）；
- 重复通关同一难度只累计次数/刷新时间，不再发经验、贡献点、徽章；
- 碎片/章节规则仍走 `handleBossFirstClear`，只发一次；
- 模拟再战可以补拿此前未通关难度的徽章/一次性奖励，但拿不到第二枚碎片。

实测总收益（六章全通）：
- EASY：经验 2070 / 贡献点 1290 / 0 徽章
- HARD：经验 2898 / 贡献点 1935 / 6 枚困难徽章
- EXPERT：经验 3519 / 贡献点 2580 / 6 枚专家徽章 + 专家称号

---

## 六、难度挑战记录

`progress.bossRecords[bossId]`：

```ts
{
  firstDifficulty, bestDifficulty, firstClearAt,
  cleared: {
    easy: { firstAt, lastAt, count, rewarded },
    hard: { ... },
    expert: { ... }
  }
}
```

- 每个 Boss 独立记录，允许六个 Boss 使用不同难度；
- 存档自愈时，旧档已首胜 Boss 补为 EASY 通关记录（不重复发奖）；
- 档案页展示：最高难度、各难度通关次数、徽章列表；
- 地图 Boss 面板显示「最高 EXPERT（2/3）」等真实进度。

---

## 七、真实 Python 判题机制

- 每个阶段 `judge.judgeKind = 'python'`，通过 `buildHarness` + `combineWithHarness` 注入真实函数断言；
- 判题只看真实执行结果，不做代码文本匹配；不同写法的正确解均可通过；
- 初始故障代码全部真实执行并测量 `baselineMask`，审计脚本逐条比对声明值；
- `baselineMask` 位不参与伤害，防止「直接提交初始代码白打血」；
- 专家难度包含边界/空输入/负数/重复键/非法字符串等隐藏边界测试；
- 难度不匹配的战斗状态在 `normalizeBattleState` 中直接重置，测试集不会互相错用。

审计结果：**72/72 阶段通过，268/268 测试检查通过，0 失败**；所有初始故障版均不能直接通关，所有参考解均真实通过。

---

## 八、旧存档兼容

不升存档版本（仍 v7）：

- 旧战斗状态缺少 `difficulty` → EASY；
- 缺少 `started` → 若已有阶段/血量/失误进度则视为已开始，否则视为未开始；
- 已首胜 Boss 缺少 `bossRecords` → 补 EASY 通关记录，`rewarded: true`，不重复发奖；
- `rewards.badges` / `rewards.difficultyRewards` 缺失 → 空数组自愈；
- 旧碎片/章节/等级/贡献点/信任度/结局全部保留；
- EASY 题目与原 Boss 战保持一致，旧玩家进度不受影响。

---

## 九、测试结果

### 9.1 难度配置审计（真实 MicroPython）

`node tools/audit_difficulty.mjs`

- 18 套配置、72 阶段、268 条测试；
- 每阶段：初始故障代码真实执行 + 参考解真实执行；
- 初始代码不能直接通关；`baselineMask` 与实测一致；考点不超纲；
- 结果：**0 失败**。

### 9.2 三档难度真实通关

`node test/boss_difficulty_real.mjs`

- EASY / HARD / EXPERT 各跑一遍六章主线；
- 72 次正确解真实执行 + 72 次初始故障版真实执行；
- 六碎片、章节解锁、徽章、专家称号、收益差异全部断言；
- 结果：**506 / 506 通过**（EASY 2070 经验，HARD 2898，EXPERT 3519）。

### 9.3 难度纯逻辑

`node test/difficulty_check.mjs`

- 18 套完整性 / 72 阶段唯一性 / 知识范围 / 奖励幂等 / 记录 / 旧档字段；
- 结果：**669 / 669 通过**。

### 9.4 难度选择端到端（jsdom + dist）

`node test/difficulty_e2e.mjs`

- 三档卡片、推荐、考点、阶段、测试数、返回按钮；
- HARD / EXPERT 各自加载独立第一阶段；
- 进行中难度锁定、其它难度禁用、继续挑战、放弃重选；
- 已首胜 → 模拟再战 → 自由选难度；
- 战斗失败（意识崩解）→ 重生 → 难度选择界面重新打开；
- 结果：**34 / 34 通过**。

### 9.5 原有回归（全部通过）

| 套件 | 结果 |
|---|---|
| `chapter_flow_check.mjs` | 133 / 133 |
| `boss_mainline_real.mjs` | 177 / 177 |
| `boss_battle_check.mjs` | 105 / 105 |
| `chapter3~6_check.mjs` | 各 31 / 31 |
| `acceptance_check.mjs` | 38 / 38 |
| `identity_lore_check.mjs` | 146 / 146 |
| `ending_check.mjs` | 30 / 30 |
| `vault_check.mjs` | 55 / 55 |
| `boss_verify.mjs` | 19 / 19 |
| `reward_check.mjs` | 37 / 37 |
| `journal_check.mjs` | 51 / 51 |
| `voice_check.mjs` | 28 / 28 |
| `rewards_voice_check.mjs` | 34 / 34 |
| `dialog_click_check.mjs` / `diff_hint_check.mjs` | 通过 |
| `smoke.mjs` | 全部通过 |
| `boss_battle_e2e.mjs` | 24 / 24 |
| `story_flow_e2e.mjs` | 46 / 46 |
| `chapter_gate_e2e.mjs` | 27 / 27 |
| `identity_e2e.mjs` | 30 / 30 |
| `ending_e2e.mjs` | 17 / 17 |
| `vault_e2e.mjs` | 28 / 28 |
| `reward_e2e.mjs` | 16 / 16 |
| `journal_e2e.mjs` | 11 / 11 |
| `voice_e2e.mjs` | 16 / 16 |

### 9.6 生产构建

```
npx tsc --noEmit            → 0 错误
npm run build               → assets/game.js 829 KB
```

---

## 十、已知遗留问题

1. **难度界面是战斗页内的全屏独立界面**（不是单独路由）：视觉与交互是独立界面，但为兼容旧存档/旧入口未新增 Screen 路由；从地图进入 Boss 仍会先渲染战斗页骨架，再被难度界面覆盖。
2. **暂未提供逐难度的星级/耗时排行**：`bossRecords` 记录最高难度与各难度通关次数，未记录每次战斗的代码质量分/用时。
3. **专家「隐藏测试」仍会在提交后显示结果**：测试表达式不预先展示，但不做“部分结果隐藏”；如需更强反作弊可后续只在失败时给出汇总。
4. **纯前端存档**：与既有系统一致，无法从密码学上阻止玩家手改 localStorage；但 UI 已无法通过改血量/跳页面获取难度奖励。
5. **第 6 章 K-0 外围关卡仍可选**：沿用 V1.1.1 第一项改进的规则（原初核心只校验前五枚碎片），难度系统未改变这一点。
