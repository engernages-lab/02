# NEXUS V1.3-E · 玩家成长与风险系统整合报告

- 阶段：V1.3-E Player Growth & Risk System Integration
- 日期：2026-11-23
- 分支：`feature/v1.2-a-experience-polish`
- 存档版本：`SAVE_VERSION = 10`（未升级）
- 结论：**PASS**
- 状态：E 阶段实现与验证完成，等待人工验收；未进入 F 阶段。

## 1. 阶段目标

把已有的等级 / 经验、挑战容错、意识风险、经济、探索、成就与 MIRA 聚合成一条连贯的成长体验，而不是再造第二套系统。E 阶段只做真实数据的读取、展示与事件联动，不修改 Challenge 判题、Boss 战斗、经济与探索核心规则。

## 2. 架构审查结论

审查文档：`docs/NEXUS-V1.3-E.0-Player-Growth-Architecture-Review.md`

核心结论：

- 等级阈值、称号、容错、首通经验、失败计数、挑战结算、经济账本、成就、MIRA、探索状态与 Save v10 自愈均已存在。
- 缺少的不是数值系统，而是统一的展示与事件联动。
- 新代码 `playerGrowthCore.ts` 只做读模型，不写入任何新属性。
- 风险状态不单独存档，完全由真实意识、等级容错、本次挑战失败数推导。

## 3. 本阶段实现

### 3.1 成长总览

新增 `src/game/playerGrowthCore.ts`：

- `riskStatusFor`：NORMAL / WARNING / DANGER / CRITICAL 四档只读风险。
- `growthOverviewFor`：等级、称号、经验进度、容错上限、已完成挑战、星级、区域、节点、探索率、成就数、MIRA 等级与阶段。
- `RISK_META`：统一标签、提示与颜色。
- 所有数据来自 `PlayerState`，没有新增等级、经验、装备、技能树或属性字段。

### 3.2 玩家档案

`src/pages/ProfilePage.tsx` 新增“成长总览”：

- Lv / 称号 / 容错上限 / MIRA 等级。
- 风险状态 pill 与真实提示。
- 经验条与“下一等级还差多少”。
- 已修复挑战、累计星级、当前失误计数、已解锁区域、已完成区域、探索节点/百分比、成就数。
- “最近成长 / 奖励”读取真实 `rewards.ledger`。
- 意识记录增加“当前风险状态”“当前容错状态”。

### 3.3 挑战 HUD 风险

`src/pages/ChallengePage.tsx`：

- 使用真实 `tolUsed` / `tolLeft` 调用 `riskStatusFor`。
- HUD 新增风险 chip，与现有“容错 x/y”并列。
- 失败提交后即时从 NORMAL 进入 WARNING / DANGER，不新增计时器或随机来源。

### 3.4 成就联动

`src/game/achievements.ts` 新增 3 项：

| 成就 | 触发条件 |
|---|---|
| 探索者 | 任一服务器区域核心节点全部完成 |
| 数据追踪者 | 探索隐藏信号真实归档 |
| 危机处理者 | MIRA 已解锁真实危机记忆 |

`src/store/gameStore.tsx`：

- 探索交互、动态危机完成、探索终端通关后统一调用 `applyAchievementRecalc`。
- 成就解锁 toast + MIRA 幂等奖励事件 `mira:achievement:<id>`（6 XP）。
- 重复重算不会重复发放。

### 3.5 探索与成长

- 探索终端的真实挑战完成会同时更新：关卡首通经验、容错结算、探索节点、探索奖励、MIRA、成就。
- 成长总览显示区域完成数、探索节点数与探索百分比。
- 隐藏信号不会提前泄漏，必须在区域完成后才进入成就与档案。

### 3.6 MIRA 联动

- 挑战 / 探索 / 成就产生真实 MIRA 经验。
- MIRA 风险提示继续读取真实意识与连续失败，不新建风险引擎。
- 成长总览同步 MIRA 等级与阶段。

### 3.7 样式与适配

- `public/global.css` 增加成长面板、风险 pill、经验条、成长网格、最近成长行、HUD 风险 chip 与移动端规则。
- 360 / 390 / 430px 无横向溢出，成长面板可见。

## 4. 修改文件

新增：

- `src/game/playerGrowthCore.ts`
- `test/player_growth.test.mjs`
- `test/player_growth_integration.test.mjs`
- `test/player_growth_e2e.mjs`
- `docs/NEXUS-V1.3-E.0-Player-Growth-Architecture-Review.md`

修改：

- `src/game/achievements.ts`
- `src/pages/ProfilePage.tsx`
- `src/pages/ChallengePage.tsx`
- `src/store/gameStore.tsx`
- `public/global.css`

未修改：

- Challenge 判题核心、Boss 战斗核心、经济数值、探索奖励数值、Save 版本号。

## 5. 单元测试

命令：`node test/player_growth.test.mjs`

结果：**29 / 29 通过**

覆盖：

- 真实等级阈值、Lv1→Lv2、Lv10 上限。
- 真实称号、等级容错、经验里程碑、满级。
- NORMAL / WARNING / DANGER / CRITICAL 全部阈值。
- 意识与容错双来源风险。
- 成长总览的等级、挑战、区域、探索、MIRA、成就统计。
- 探索者、数据追踪者、危机处理者触发。
- 重复重算幂等。
- Save v10、默认探索/MIRA、缺失字段安全初始化。

## 6. 集成测试

命令：`node test/player_growth_integration.test.mjs`

结果：**28 / 28 通过**

覆盖：

- 70 XP + 40 XP → Lv2 / 110 XP，容错按真实等级读取。
- 连续失败 0→1→2→3 对应 NORMAL→WARNING→DANGER→CRITICAL。
- MIRA 读取真实连续失败与低意识。
- 探索信号 + 遗迹 + 真实终端 + 隐藏信号 → 区域完成。
- 成长总览同步探索数据与成就数。
- 成就重复重算幂等。
- 成就奖励 MIRA 幂等。
- 真实危机记忆触发危机处理者，未经历不会误触发。
- 等级 / 经验 / 隐藏档案 / MIRA / 成就 JSON 往返保持。
- 旧存档缺失字段自愈、异常等级/经验修正。

## 7. 真实浏览器 E2E

命令：`node test/player_growth_e2e.mjs`

结果：**38 / 38 通过**

真实流程：

1. 主菜单 → 玩家档案：Lv.1、见习硅灵、容错 3、NORMAL、70 XP。
2. 数字世界探索 → 新人训练终端 → 真实修复 `tut-1`。
3. 结算：+40 XP、Lv.1 → Lv.2、110 XP、容错仍为 3；存档 `version=10`。
4. 首次修复、接驳完成成就真实解锁；MIRA 获得经验。
5. 返回地图 → 重玩 `tut-1` → 提交错误输出。
6. HUD 风险进入 WARNING，容错显示 2/3，`failedAttempts` 真实记录。
7. 重玩通关：玩家经验保持 110，不重复发放、不跳级。
8. 探索信号、遗迹、隐藏信号；探索者、数据追踪者真实解锁。
9. 成就页显示 4 / 26 已解锁。
10. 成长总览显示 Lv.2、已完成区域 1、探索节点 3、14%、MIRA Lv.2。
11. 360 / 390 / 430px 无横向溢出。
12. 刷新后等级、经验、成长总览、成就、探索档案保留，Save v10。
13. 真实意识 30% → 档案风险显示 DANGER。
14. 全流程无未捕获异常。

E2E 截图目录：`.tmp/e-evidence/`

| 文件 | 内容 |
|---|---|
| `01-player-profile.png` | 玩家档案首屏 |
| `02-player-growth.png` | 成长总览 |
| `03-level-up.png` | 真实挑战升级结算 |
| `04-risk-status.png` | 失败后 WARNING / 容错 2/3 |
| `05-achievements.png` | 4 个真实成就已解锁 |
| `06-exploration-growth.png` | 探索后的成长总览 |
| `07-mobile.png` | 390px 移动端档案 |
| `08-persistence.png` | 刷新后持久化 |

## 8. 回归测试

本阶段执行相关回归套件：

| 类型 | 文件数 | 用例数 | 结果 |
|---|---:|---:|---|
| 纯逻辑 / 单元 | 22 | 1,407 | 全部通过 |
| 集成 | 15 | 1,284 | 全部通过 |
| 真实浏览器 E2E | 9 | 351 | 全部通过 |
| **合计** | **46** | **3,042** | **全部通过** |

重点回归结果：

| 套件 | 结果 |
|---|---|
| C · MIRA E2E | 18 / 18 |
| D · 数字世界探索 E2E | 34 / 34 |
| B.6.8 · 视觉系统整合 E2E | 32 / 32 |
| B.7 · Boss 最终验收 E2E | 19 / 19 |
| 全系统 a7 E2E | 51 / 51 |
| 布局 E2E | 116 / 116 |
| Boss 战斗 E2E | 24 / 24 |
| 经济 E2E | 19 / 19 |
| E · 成长 E2E | 38 / 38 |

纯逻辑与集成回归包含：Boss 阶段、攻击、弱点、战斗仲裁、统计、评分、奖励、成就、结算、档案馆、终端/危机/弱点电影化、视觉性能、MIRA、探索与 E 成长。

## 9. 类型检查与构建

| 项目 | 结果 |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run build` | 成功 |
| 产物 | `assets/game.js` 1,939 KB |
| 构建耗时 | 10.8s |

## 10. 风险与问题

### P0

无。

### P1

无。

### P2

无。

### P3

1. **当前失误计数不是终身失败总数**：`failedAttempts` 在通关后归零，面板已改名为“当前失误计数”，避免误解。
2. **档案风险只读取意识与等级容错**：档案没有“当前关卡会话”，因此不伪造本关失败数；本关失败风险在挑战 HUD 中实时显示。
3. **成就奖励只给 MIRA 6 XP**：不重复发放玩家经验或贡献点，避免与既有经济/等级结算叠加。
4. **真实关卡总数为 31**：成长总览与 E2E 使用真实数量，未使用需求示例中的 26。
5. **E2E 使用确定性预置存档**：用于精确验证 70→110 XP 与失败风险；完整新手流程由既有 a7、Challenge、布局等回归覆盖。

## 11. 验收结论

- 成长来源统一，未新增第二套等级 / 经验 / 风险 / MIRA。
- 风险等级来自真实意识、容错与失败，挑战 HUD 与档案均可展示。
- 探索、成就、MIRA、经济与成长总览形成真实闭环。
- 重复通关不重复发经验，成就奖励幂等，探索奖励保持幂等。
- 存档保持 v10，缺失字段自愈，刷新后数据保留。
- 桌面与 360 / 390 / 430px 移动端可用。
- C MIRA、D 探索、B 系列与 Boss 最终验收回归全部通过。

**V1.3-E 判定：PASS。E 阶段冻结，等待人工验收；不进入 F 阶段，未 Commit / Push / Deploy。**
