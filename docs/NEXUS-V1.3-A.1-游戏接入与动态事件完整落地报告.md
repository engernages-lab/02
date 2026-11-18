# NEXUS V1.3-A.1 · 游戏接入与动态事件完整落地报告

> 版本：V1.3-A.1
> 分支：`feature/v1.2-a-experience-polish`
> 日期：2026-11-18
> 状态：**PASS（本阶段）**，并附「未执行 / 已知限制」清单（见第 15 节），不掩盖任何未完成项。

---

## 1. 概述与范围

本阶段只做 **V1.3-A.1**：把上一阶段已完成但「仅有骨架、未接入游戏」的挑战逻辑模块，接成真正可玩的功能，并完整落地 **动态事件引擎** 与 **未知入侵（Unknown Intrusion）**。

本阶段 **不开始 V1.3-B**，未改动 31 个原有关卡内容，未修改任何判题规则，未新增存档版本。

明确原则（全程遵守）：
- 不删除已完成挑战逻辑模块，不重新实现已有状态机，优先复用；
- 代码模块存在 ≠ 功能交付；单元测试通过 ≠ 玩家能玩 → 本报告用「真实执行 + jsdom 界面 E2E」分别验证；
- 未实现 / 未执行的内容不写成已完成。

---

## 2. 启动前代码审查结论（A.1-1）

**分支 / 工作区**
- 分支：`feature/v1.2-a-experience-polish`。
- 工作区：仅存在未跟踪文件（上一阶段的 4 个挑战模块 + 报告 + 测试 + `.agents/`、`.tmp/`），`git diff --stat` 对已跟踪文件为空 → 无未提交的既有改动会被覆盖。
- `.tmp/` 为本地临时目录（历史提交已忽略），`.agents/` 为本地工具目录，本阶段均未改动。

**现有挑战模块（复用，不重写）**
- `challengeRules.ts`：规则配置 + `validateChallengeRules`（永不抛错、非法回退）。
- `challengeEngine.ts`：运行状态机（限时/次数/连锁/多阶段/隐藏用例）+ `normalizeRun`。
- `challengeTypes.ts`：五种挑战类型的构建器 + `ChallengeDef`。
- `challengeTemplates.ts`：5 个独立挑战模板（`ind-` 前缀）。
- `challengeSession.ts`（更早已有，A4）：关卡会话统计与**单次结算**的唯一数据源，已并入存档。

**接入点**
- 路由：`src/App.tsx` 用 `{screen === 'X' && <Page/>}` 切换，`Screen` 联合类型在 `src/game/types.ts`。
- 菜单：`src/pages/MainMenu.tsx` 的分组导航数组。
- 存档：`src/services/save.ts`（`defaultState` + `normalizePlayerState` 字段级自愈）、`src/services/migrations.ts`（`CURRENT_SAVE_VERSION`）。
- 判题：`src/services/judge.ts`（`checkUserCode` / `buildHarness` / `combineWithHarness` / `judgeRun`）；运行：`src/services/pythonRunner.ts`（`runPython`）。
- Store：`src/store/gameStore.tsx`（`commitPlayer` 同步提交、`submitBossAttack` 是「判题在 store 内完成」的既有范式，本阶段挑战提交沿用同一范式）。

**审查发现的既有设计问题与最小修复**
1. 既有 `ChallengePage` 与 `LevelDef` 强耦合 → 独立挑战不复用该页，而是新增独立页（避免污染原有关卡体验）。
2. 既有 `ChallengeDef` 只有 `hiddenTests`（进度占位），缺少「隐藏用例的判题表达式」→ 在 `ChallengeDef`/构建器新增**可选** `hiddenChecks`，并在两个隐藏类模板补齐表达式（只用于判题、绝不展示）。
3. `LedgerKind` 无独立挑战的账本类型 → **仅新增一个枚举值 `'challenge'`**（纯追加，不改任何结算规则/数值）。
4. 事件引擎对于「从未触发」的冷却判定会把时间戳 0 误当作「0 时刻触发」→ 改为「仅在存在历史触发时应用冷却」；`advance` 由单步改为可级联（长时间跳变时 presenting 可直接走到超时）。这两处均为最小修复，且由测试覆盖。

---

## 3. 复用与新增清单

**复用（未重写）**：`challengeRules / challengeEngine / challengeTypes / challengeTemplates / challengeSession / judge / pythonRunner / drafts / economy(账本) / progression`。

**新增模块**
- `src/game/eventEngine.ts`：动态事件引擎（纯逻辑、可序列化、永不抛错）。
- `src/game/events/unknownIntrusion.ts`：未知入侵事件定义 + 六种恢复语义。
- `src/pages/ChallengeHubPage.tsx`：挑战大厅（真实配置列表）。
- `src/pages/ChallengePlayPage.tsx`：挑战游玩页（运行/提交/阶段/隐藏用例/倒计时）。
- `src/components/IntrusionOverlay.tsx`：未知入侵覆盖层（全局挂载，六阶段演出 + 交互恢复）。

**最小修改**
- `src/game/types.ts`：`Screen` 增加 `challengehub`/`challengeplay`；`Progress` 增加 `challengeRuns`、`dynamicEvent`、`eventCooldowns`（全部可选，旧档缺失即补）。
- `src/game/challengeEngine.ts`：新增 `normalizeChallengeRuns`。
- `src/game/challengeTypes.ts` + `challengeTemplates.ts`：新增可选 `hiddenChecks`。
- `src/game/economyConfig.ts`：`LedgerKind` 追加 `'challenge'`。
- `src/services/save.ts`：注册事件定义；`defaultState`/`normalizePlayerState` 补齐并自愈新字段。
- `src/store/gameStore.tsx`：独立挑战运行/提交/放弃/超时动作；动态事件触发/推进/完成/放弃/异常恢复/清理；入侵确认步/误触；`currentChallengeId` 导航态。
- `src/App.tsx`：新增两条路由 + 全局 `<IntrusionOverlay/>`。
- `src/pages/MainMenu.tsx`：新增「独立挑战 ⚔」入口。

---

## 4. A1 · 挑战入口与挑战页面接入 —— ✅ 已实现 · ✅ 已测试

- 入口：主菜单「成长」分组「独立挑战 ⚔」→ 挑战大厅。
- 大厅（`ChallengeHubPage`）展示**真实配置**：名称、类型标签、难度、奖励系数、故障、目标、时限、运行/提交/提示上限、隐藏用例数量、阶段列表、当前状态（未开始/进行中/已完成/已失败），进行中还会显示已用运行/提交。
- 挑战页（`ChallengePlayPage`）展示**真实运行态**：剩余时间（限时倒计时）、剩余运行/提交/提示、当前阶段、连锁 Bug 修复状态、隐藏用例通过状态、运行状态与结算后的结束态。
- 「运行代码」= `checkUserCode → runPython(debug)`，仅诊断；「提交判题」= `g.submitChallenge`（Store 内真实 `runPython + judgeRun`）。
- 玩家可编辑代码；Monaco 在 jsdom 中无法建 Worker（与既有页面一致），生产构建在真实浏览器中正常。

覆盖测试：`a7_2_challenge_event_e2e.mjs`（20/20）验证菜单入口、大厅真实配置、挑战页控件/倒计时/终端。

---

## 5. A2 · 状态与存档接入 —— ✅ 已实现 · ✅ 已测试

- **复用 challengeSession** 作为结算唯一数据源；新增 `challengeRuns` 作为「规则执行层」（限时/次数/阶段/bug/隐藏）持久化状态，二者按 challengeId 关联。
- **成功只结算一次**：`runComplete` 仅接受 active/paused；`settle` 仅 active→终态一次。重复提交/重复结算返回原状态（测试 F 验证幂等）。
- **失败后不能继续使用失效会话**：`enterChallenge` 对已终结运行（completed/failed/cancelled）会新建运行；提交次数耗尽/超时/放弃均落入终结态。
- **刷新后能安全恢复**：`normalizeChallengeRuns` 规范化运行表；`normalizeEventState` 清理已终结/已过期事件、保留未过期 active；运行中的挑战刷新后 `enterChallenge` 复用 active 运行。
- **退出后正确清理**：`cancelChallenge` 将进行中运行取消并结算会话为失败（原因「放弃挑战」），不残留 active。
- **不覆盖原有关卡存档/草稿**：挑战草稿使用独立 key（`ch:<challengeId>` 命名空间），与关卡草稿物理隔离；挑战进度只写 `challengeRuns/challengeSessions/exp/credits/ledger`，不触碰 `completedLevels/currentLevelId/bossesDone`。
- **不重复领取**：奖励只在 `settleChallengePass`（运行 active 且整体通过）发放一次；账本 `appendLedger` 记录 `kind:'challenge'`。
- **存档版本**：**实测确认当前为 v10**（非假设），新增字段全部为可选 + normalize 自愈，**未升级版本**。

覆盖测试：集成测试 H（版本仍 v10 + v9→v10 迁移仍在）、UI E2E 存档字段断言（challengeRuns/dynamicEvent/eventCooldowns 持久化、version=10）。

---

## 6. A3 · 动态事件引擎 —— ✅ 已实现 · ✅ 已测试

`src/game/eventEngine.ts`（纯逻辑、可序列化、永不抛错）提供：
- **注册/配置**：`registerEvent / eventDefById`（定义含 `priority / mutualExclude / cooldownMs / presentDurationMs / activeTimeoutMs`）。
- **触发**：`tryTrigger` 在唯一入口内完成三重调度判定 —— 重复触发（already-presenting）、同时触发（mutex）、冷却（cooldown）、未知定义（unknown-def）。
- **生命周期**：`presenting → active → resolving → completed`，`advance` 推进 presenting→active 与 active→超时（resolving/timeout），且支持级联跳变。
- **结束/取消/恢复/清理**：`resolve`（completed）、`cancelEvent`（cancelled）、`recoverException`（recovered）、`dismiss`（清空 current）。
- **优先级 / 互斥**：定义上的 `priority` 与 `mutualExclude` 参与判定。
- **安全**：所有非法数据经 `normalizeEventState/normalizeCooldowns` 回退，绝不因事件引擎白屏或永久锁死操作。

诚实说明：`waiting` 为「无 current」的概念态，`triggering` 为瞬时态不落盘，`recovering` 由覆盖层的关闭阶段体现；上述为设计选择，不影响必需的状态流转与清理。

---

## 7. A4 · 未知入侵与六种恢复方式 —— ✅ 已实现 · ✅ 已测试

`src/game/events/unknownIntrusion.ts` + `IntrusionOverlay.tsx`：六阶段演出（探测/渗透/潜伏/激活/扩散/反制），玩家按正确节点顺序完成隔离序列（`INTRUSION_RECOVER_STEPS=3`），误触消耗失误次数（`INTRUSION_MAX_MISSES=3`），有 45s 超时。

**六种恢复方式逐条落地**（各自清理定时器/动画/监听/临时状态）：
1. **正常完成** — 玩家完成隔离序列 → `resolve('completed')`。
2. **玩家退出** — 「退出隔离」→ `cancelEvent('cancelled')`。
3. **超时** — `activeTimeoutMs` 到期 → `advance()` 转 `resolving('timeout')`。
4. **刷新清理** — 载入存档时 `normalizeEventState()` 清理已终结/已过期事件（集成测试 C）。
5. **异常恢复** — 触发/推进/结算抛错时 `recoverException('recovered')`（DEV 入口可复现）。
6. **重复触发保护** — `tryTrigger()` 的 已展示/互斥/冷却 三重判定。

清理机制：覆盖层所有 `setTimeout/setInterval` 在依赖变化或卸载时清理；结束态展示后自动 `dismissDynamicEvent` 置空 `current`。

覆盖测试：集成测试 D（①~⑥ 全部 PASS）、UI E2E（覆盖层弹出 → 退出 → 自动关闭 → 再触发被冷却拒绝）。

---

## 8. A5 · 测试入口（dev-only）—— ✅ 已实现

- 位置：挑战大厅底部「DEV 测试入口」（仅本机）。
- 开关：`localStorage['nexus_dev_tools']==='1'` 或 URL `?dev=1`（**只控制按钮可见性**）。
- 能力：触发未知入侵 / 推进生命周期 / 触发异常恢复。
- 隔离性：**不发放任何奖励、不修改金币/经验/资产、不覆盖存档与草稿、不伪造判题**；无法通过 URL 参数领取奖励（本入口本就不发奖励）。

---

## 9. A6 · 测试用例与结果 —— ✅ 已实现 · ✅ 已执行

| 测试脚本 | 覆盖内容 | 结果 |
|---|---|---|
| `challenge_engine_check.mjs` | 规则校验 / 状态机 / 5 类模板 / 与原关卡零冲突 | 66 / 66 |
| `challenge_integration_check.mjs`（**新增**） | 事件引擎触发/互斥/冷却/生命周期/刷新清理 + 入侵六种恢复 + 隐藏用例结构 + 多阶段单次结算 + 运行表自愈 + 版本仍 v10 | 54 / 54 |
| `challenge_solutions_real.mjs`（**新增**） | 真实 MicroPython 执行：每个独立挑战参考解通过公开+隐藏判题、初始代码整体失败、隐藏挑战「公开可过/隐藏必挂」 | 21 / 21 |
| `a7_2_challenge_event_e2e.mjs`（**新增**） | jsdom 加载生产构建：主菜单入口→大厅真实配置→挑战页控件/倒计时→入侵覆盖层→退出恢复→冷却重复触发→存档字段与版本 | 20 / 20 |

---

## 10. 影响隔离与安全边界 —— ✅ 已实现

- 动态事件只改 `dynamicEvent / eventCooldowns`，不改金币/经验/资产，不删代码、不覆盖草稿、不伪造判题、不绕过结算。
- 挑战结算走真实 `judgeRun`；隐藏用例只回传「通过数量/单项是否通过」，**绝不回传表达式**；判题结果无法由前端伪造。
- 安全策略沿用 `checkUserCode`（模块白名单、禁止 eval/exec/open 等）。

---

## 11. 兼容性与移动端

- 新增字段全部可选，`normalizePlayerState` 缺失即补；旧档（v1~v9）迁移链不变，仍收敛到 v10。
- 挑战页/入侵覆盖层复用既有 `chlg-*`/`panel` 响应式布局，覆盖层使用内联样式与 `min(560px,92vw)` 上限，窄屏可滚动。
- 事件覆盖层定时器为 500ms/1.6s/1.5s 级别，非高频，且在卸载时清理。

**未执行**：真实移动设备 / 低性能设备上的未知入侵专项验证（见第 15 节）。

---

## 12. 与原有关卡 / 系统零冲突确认 —— ✅ 已确认

- 31 个原有关卡内容、判题规则、Boss 数值、经济核心规则均未修改（经济仅新增账本枚举值）。
- 原有关卡存档字段（completedLevels/currentLevelId/bossesDone/chapters/…）未被挑战流程写入。
- 挑战草稿与关卡草稿物理隔离。
- 回归测试全绿（见第 18 节）。

---

## 13. 18 项交付验收（按本任务要求归纳）逐条结论

| # | 验收项 | 结论 |
|---|---|---|
| 1 | 未删除已完成挑战模块、未重复实现状态机 | ✅ 复用 |
| 2 | 游戏内存在挑战入口（主菜单） | ✅ |
| 3 | 挑战页展示真实配置（名称/类型/难度/说明/规则/时限/剩余/阶段/状态） | ✅ |
| 4 | 运行代码经 pythonRunner 真实执行 | ✅ |
| 5 | 提交经 Judge 真实判题，运行≠通过 | ✅ |
| 6 | 隐藏用例不暴露答案 | ✅（仅数量/单项结果） |
| 7 | 不绕过 Judge 制造通关 | ✅ |
| 8 | 成功后只结算一次 | ✅（幂等） |
| 9 | 失败后不能继续使用失效会话 | ✅ |
| 10 | 刷新后可安全恢复 | ✅（运行保留/过期清理） |
| 11 | 退出后正确清理 | ✅ |
| 12 | 不覆盖原有关卡存档/草稿 | ✅ |
| 13 | 不重复领取奖励 | ✅ |
| 14 | 存档版本未无谓升级（仍 v10） | ✅ |
| 15 | 事件引擎具备注册/触发/生命周期/优先级/互斥/结束/取消/恢复/清理 | ✅ |
| 16 | 未知入侵六种恢复方式全部落地 | ✅ |
| 17 | 事件影响隔离（不改经济/代码/草稿/判题/结算） | ✅ |
| 18 | 原有关卡与系统零回归 | ✅（见第 18 节） |

---

## 14. 自检记录（每完成一步自检）

- A.1-1 审查后：确认分支/工作区、4 模块、66 项既有测试、接入点。
- 每写一批代码后：`npm run typecheck`（0 错误）。
- 事件引擎初版：集成测试发现「冷却把 0 当作触发」与「advance 不级联」两处缺陷 → 最小修复后 54/54。
- 接入页面/覆盖层后：`npm run build` 成功，回归批次全绿。
- 完成后：补充真实执行测试（21/21）与 jsdom UI E2E（20/20）。

---

## 15. 状态清单（已实现/已测试 vs 仅有骨架 vs 未实现 vs 未执行）

**已实现且已测试**
- 挑战大厅 + 挑战页接入、真实判题（运行/提交分离）、五类挑战完整可玩（含隐藏/多阶段/连锁/资源/限时）。
- 运行状态机持久化与刷新恢复、单次结算、退出清理、草稿隔离。
- 动态事件引擎（触发/互斥/冷却/生命周期/优先级/恢复/清理）。
- 未知入侵六种恢复方式。
- DEV 测试入口（隔离、无奖励）。

**仅有代码骨架（存在但未在本阶段作为核心路径暴露）**
- 事件引擎中 `waiting`/`triggering`/`recovering` 为概念/瞬时/过渡态，未作为独立可观察持久态（不影响必需流转）。

**未实现**
- V1.3-B 的全部内容（按约定本阶段不做）。
- 未知入侵之外的第二个动态事件定义（引擎已通用，但本阶段只注册了未知入侵）。

**未执行（诚实声明）**
- **可视化浏览器手动操作**：本环境内置浏览器视口为 0×0（不可见），无法进行真实点击/截图验证；已用 **jsdom 加载生产构建**（20/20）与 **Node 真实 MicroPython 执行**（21/21）替代覆盖界面接入与判题可玩性。
- **真实移动端 / 低性能设备**上的未知入侵专项验证：未做设备级验证。
- **在可视化浏览器里完整点击「提交」得到一次真实通过**：判题链路由真实引擎分段验证（参考解通过、初始失败），但未在可见浏览器中走完一次交互动画流程。

**外部变化（非本次任务，未处理）**
- 会话进行中，工作区出现新的未跟踪文件 `src/components/SceneArt.tsx` 与 `src/components/CinematicStage.tsx`（疑似并行进行中的过场美术工作）。其中 `SceneArt.tsx` 有 4 处 TS 类型错误（`opacity` 传字符串），导致**仓库整体** `npm run typecheck` 非零退出；**本次任务的改动文件本身 0 错误**，且不影响 `npm run build` 产物。为避免覆盖他人进行中的工作，未改动该文件。

---

## 16. 已知限制与后续建议

- 若后续新增更多动态事件，只需 `registerEvent` + 复用 `tryTrigger/advance/resolve`，并在 App 中按 defId 渲染对应覆盖层。
- 挑战页的 Monaco 在 jsdom/无 Worker 环境下停留加载态属预期（既有页面同样如此）。
- 建议在 V1.3-B 前补一次真实浏览器手玩验收（尤其移动端入侵覆盖层）。

---

## 17. 变更文件清单

**新增**
- `src/game/eventEngine.ts`
- `src/game/events/unknownIntrusion.ts`
- `src/pages/ChallengeHubPage.tsx`
- `src/pages/ChallengePlayPage.tsx`
- `src/components/IntrusionOverlay.tsx`
- `test/challenge_integration_check.mjs`
- `test/challenge_solutions_real.mjs`
- `test/a7_2_challenge_event_e2e.mjs`
- 本报告

**修改**
- `src/game/types.ts`、`src/game/challengeEngine.ts`、`src/game/challengeTypes.ts`、`src/game/challengeTemplates.ts`
- `src/game/economyConfig.ts`（仅追加 `LedgerKind='challenge'`）
- `src/services/save.ts`、`src/store/gameStore.tsx`、`src/App.tsx`、`src/pages/MainMenu.tsx`

---

## 18. 回归与构建结果汇总

| 项目 | 结果 |
|---|---|
| `npm run typecheck`（**本次任务改动文件**） | 0 错误 |
| `npm run typecheck`（仓库整体） | 存在 4 处错误，**全部位于非本次改动的未跟踪文件 `src/components/SceneArt.tsx`**（`Skyline` 的 `opacity` 传入字符串）；该文件在本次会话过程中出现（由另一并行工作进行创建，被 `CinematicStage.tsx` 引用），**为保证不干扰他人进行中的工作，未修改**。 |
| `npm run build` | 成功（仅对 `SceneArt.tsx` 报 TS 警告，不影响打包；`assets/game.js` ≈1075 KB） |
| challenge_engine_check | 66 / 66 |
| challenge_integration_check | 54 / 54 |
| challenge_solutions_real | 21 / 21 |
| a7_2_challenge_event_e2e | 20 / 20 |
| session_check | 44 / 44 |
| economy_check | 44 / 44 |
| difficulty_check | 669 / 669 |
| chapter_flow_check | 133 / 133 |
| reward_check | 37 / 37 |
| shop_check | 63 / 63 |
| boss_battle_check | 105 / 105 |
| verify（判题链路） | 71 / 71 |
| smoke（生产构建 jsdom 冒烟） | 全部通过 |
| a7_save_check | 95 / 95 |

---

## 19. 结论

- **本阶段（V1.3-A.1）：PASS。** 挑战机制真正接入并可玩，真实判题与结算成立；动态事件引擎与未知入侵六种恢复全部落地；原有系统零回归，存档版本未无谓升级。
- **条件项**：真实可视化浏览器 / 移动端的最终手玩验收未在本环境执行（受内置浏览器视口不可见限制），建议下一阶段前补做。除此之外无阻断问题。
