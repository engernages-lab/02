# NEXUS V1.3-F.0 · Integration Architecture Audit

- 审查日期：2026-11-23
- 审查阶段：V1.3-F.0
- 审查性质：只读架构审查，不修改业务代码
- 结论：**允许进入 F.1**
- 当前最高问题：**P2 · 探索奖励流水刷新后丢失（非积分丢失、非重复奖励）**
- 未进入 F.1，未 Commit / Push / Deploy。

## 1. Preflight

### 1.1 工作区

| 项目 | 实际值 |
|---|---|
| Branch | `feature/v1.2-a-experience-polish` |
| HEAD | `85dd5a7` |
| Package | `nexus-code-repair@1.1.3` |
| Node | `v24.22.0` |
| npm | `11.19.1` |
| SAVE_VERSION | `10`（`CURRENT_SAVE_VERSION = 10`） |
| 修改文件 | 18 |
| 未跟踪文件 | 146 |
| 工作区文件总变更 | 164 |

本阶段没有修改任何业务代码；只新增本审查报告。

### 1.2 已修改文件（既有，未提交）

```text
public/boss.css
public/global.css
src/App.tsx
src/components/IntrusionOverlay.tsx
src/components/MiraPanel.tsx
src/game/achievements.ts
src/game/economyConfig.ts
src/game/types.ts
src/pages/BossBattlePage.tsx
src/pages/ChallengePage.tsx
src/pages/MainMenu.tsx
src/pages/ProfilePage.tsx
src/pages/SettingsPage.tsx
src/pages/WorldMap.tsx
src/services/save.ts
src/store/gameStore.tsx
src/vite-env.d.ts
test/challenge_integration_check.mjs
```

以上均为 A～E 阶段既有工作区内容，F.0 未覆盖、未回退。

### 1.3 未跟踪文件

146 个未跟踪文件，主要为 A～E 阶段新增：

- `src/`：47 个（Boss 引擎、MIRA、探索、成长、组件、页面）
- `test/`：67 个（单元、集成、E2E、验收脚本）
- `docs/`：26 个（各阶段报告与审查）
- `tools/`：5 个
- `.agents/`：1 个

### 1.4 当前构建 / 类型状态

- `npm run typecheck`：通过，0 errors。
- 最近构建产物：`dist/assets/game.js`，2,143,371 bytes（约 2.09 MB）。
- 构建日志统计：1,939 KB（构建器按字符串 code units 统计，非文件字节数）。
- 构建方式：单入口 IIFE，`inlineDynamicImports: true`，当前无路由级代码分割。
- F.0 未重新执行全量回归；E 收尾实测结果为单元 29/29、集成 28/28、E2E 38/38，相关回归 46 套件 / 3,042 用例全部通过。

## 2. 当前架构

### 2.1 分层

```text
App.tsx
  └─ GameProvider（gameStore.tsx，中央组合根 / 事务层）
       ├─ services/save.ts         Save v10、migrate、normalize、损坏备份
       ├─ game/judge + pythonRunner 真实判题
       ├─ game/challenge*          挑战会话、独立挑战、判题结果
       ├─ game/rewards + economy   等级奖励、经济账本、商城事务
       ├─ game/boss* + eventEngine Boss 阶段/攻击/弱点/危机/统计/评分/奖励/档案
       ├─ game/miraCore            MIRA 经验、记忆、场景、风险提示
       ├─ game/explorationCore     区域、节点、隐藏信号、探索奖励幂等
       ├─ game/achievements        全量成就重算
       └─ game/progression         等级、经验、称号、容错
  └─ 页面层（18 个 screen）
       MainMenu / WorldMap / ChallengePage / BossPage / BossBattlePage
       ExplorePage / MiraPage / ProfilePage / AchievementsPage
       ArchivePage / JournalPage / BossBattleArchivePage / Shop
       Story / Knowledge / Lab / Settings / Start
```

### 2.2 关键特征

1. **单一 PlayerState 存档**：所有长期数据进入同一 Save v10，页面不持有独立持久化状态。
2. **纯逻辑引擎 + 中央事务**：Boss、MIRA、探索、成就、经济均以纯函数为主；跨系统写入集中到 `gameStore`。
3. **页面按 screen 条件渲染**：无 React Router；刷新后回到启动/主菜单，数据由 Save 恢复。
4. **单一奖励源**：挑战奖励、Boss 奖励、探索奖励、成就奖励均进入既有 `rewards` 与 `ledger`，没有第二套货币。
5. **MIRA 单一成长源**：所有 MIRA 经验使用 `miraAward`，以 `eventLog` 事件 ID 幂等。
6. **无第二套成长/风险系统**：E 的成长与风险只读取真实字段。

### 2.3 架构风险

- `gameStore.tsx` 是约 4,000 行的中央组合根，跨系统事务集中；这是当前稳定性的基础，也是耦合点。
- 所有页面在 `App.tsx` 顶部静态导入，首次启动加载全部系统代码。
- 无全局 React Error Boundary；极端渲染异常可能导致空白页。
- 无 Browser History 路由；浏览器 Back 不会在游戏页面之间回退。

这些属于 F.2/F.3 的稳定性与性能议题，不是当前 P0/P1。

## 3. 数据流审查

| 数据流 | 审查结果 | 真实证据 |
|---|---|---|
| Challenge → Player | PASS | 首通经验、重复通关 0 经验、等级重算、星级、容错、结算 |
| Challenge → Exploration | PASS | 只有真实成功才调用 `completeTerminalChallenge`；失败不完成节点 |
| Challenge → MIRA | PASS | `mira:level:<levelId>` 幂等；首通/重复经验区分 |
| Exploration → Achievements | PASS | 区域完成、隐藏信号真实触发；不提前解锁 |
| Boss → Player | PASS | B.7 首胜事务、奖励、成就、档案、统计 |
| Boss → MIRA | PASS | Victory 使用同一 `mira:boss:victory:<battleId>`，EventBus 与兜底路径幂等 |
| Player Growth → Profile | PASS | 全部读取 PlayerState：等级/经验/称号/容错/风险/探索/成就/MIRA |
| Economy → Rewards | **PARTIAL** | 探索奖励积分正确，但探索账本刷新后丢失（P2-01） |
| Save → 全部系统 | **PARTIAL** | Save v10 自愈正常；账本白名单遗漏 `exploration`（P2-01） |

## 4. 跨系统联动详情

### 4.1 Challenge → Player

- `completeLevel` 以 `firstTime` 决定经验，重复通关不发放玩家经验。
- 等级由 `levelForExp(exp)` 统一重算，不信任旧 level。
- 容错由 `toleranceFor(level)` 即时读取。
- 星级由真实 `failedAttempts` 决定；通关后归零。
- 结算会话 `challengeSessions` 记录 `toleranceUsed` / `toleranceRemaining`。
- 已结算会话有 `status === 'passed'` 防重复结算，重复提交返回 `null`。

结论：PASS。

### 4.2 Challenge → Exploration

- 探索终端通过 `startTerminalChallenge` 写入真实 `pendingChallenge`，并让页面进入真实 Challenge。
- `completeLevel` 成功后调用 `completeTerminalChallenge(exState, levelId, true)`。
- 失败路径不调用成功结算，因此不会误完成节点。
- 奖励先由 `rewardFor` 写 `rewardsClaimed`，再进入既有经济；重复完成 `firstTime=false`，不重复发奖。
- 退出挑战不会伪造奖励；pending 可能保留，但不产生结算。

结论：PASS，存在一个 P3 状态语义问题（见 6.2）。

### 4.3 Challenge → MIRA

- 关卡事件 `mira:level:<levelId>`：首通 10 XP，重复 4 XP。
- 成就事件 `mira:achievement:<id>`：6 XP，事件 ID 幂等。
- 探索事件 `mira:exploration:<nodeId>`：节点奖励 XP，事件 ID 幂等。
- 真实失败提示读取失败次数与意识，不写额外风险状态。

结论：PASS。

### 4.4 Exploration → Achievements / Growth

- 区域完成 → 探索者；隐藏归档 → 数据追踪者。
- 探索交互后统一 `applyAchievementRecalc`。
- 成长总览读取区域、节点、探索百分比、成就数、MIRA 等级。
- 隐藏信号在区域核心节点完成前不可见、不可领取。

结论：PASS。

### 4.5 Boss → Player / MIRA / Archive

- 首胜事务 `handleBossFirstClear` 校验真实战斗状态与难度。
- Boss 奖励进入 `rewards` 与 Boss 奖励存储，Boss 账本使用一次性事件。
- 胜利 MIRA 记忆/经验在 EventBus 与 `submitBossAttack` 兜底路径使用同一事件 ID，因此不会重复发放。
- Boss 战斗统计、评分、奖励、成就、档案馆在 B 系列已回归。

结论：PASS。

### 4.6 Growth → Profile

- 成长总览所有字段来自真实 PlayerState。
- 风险来自真实意识、等级容错；挑战 HUD 额外读取本关失败数。
- 最近成长读取真实账本；探索账本受 P2-01 影响。

结论：PASS，账本显示受 P2-01 影响。

## 5. 状态冲突检查

| 状态 | 检查结论 | 说明 |
|---|---|---|
| `pendingChallenge` | PARTIAL | 失败/退出会保留；不会重复发奖，但会形成 stale pending（P3） |
| Challenge Session | PASS | passed 防重复结算；失败计数同源 |
| Challenge Settlement | PASS | 成功结算唯一数据源，重复提交拦截 |
| Boss Session | PASS | normalize/reconcile + 真实状态校验；B.7 回归 |
| Event Session | PASS | 动态危机锁定/释放；完成事件幂等 |
| Exploration Session | PASS | `rewardsClaimed` 幂等；隐藏条件真实 |
| MIRA Memory | PASS | `eventLog` 幂等；单事件经验封顶 |
| Reward Ledger | **PARTIAL** | 一次性事件去重正常；`exploration` 刷新丢失（P2-01） |
| Save State | PASS | 无效 JSON 备份并重置；字段级自愈；v10 |

### 5.1 页面 / 刷新场景

| 场景 | 结论 |
|---|---|
| Challenge 中途刷新 | 会话与失败数持久化；刷新后从主菜单继续，当前关卡仍保留 |
| Boss 中途刷新 | 阶段运行与真实血量对齐；B.7 已验证 |
| Explore 中途刷新 | 节点/隐藏/pending 持久化；奖励幂等 |
| 主菜单快速跳转 | 页面条件渲染；历史 a7 / layout E2E 通过 |
| 重复提交 / 快速点击 | 结算与会话幂等；按钮禁用 |
| 无效存档 / JSON 损坏 | 备份并重置；不崩溃 |
| 浏览器 Back | 无 History 路由，Back 不保证回到游戏内页面（P3） |

## 6. 问题清单

### 6.1 P2-01 · 探索奖励流水刷新后丢失

**现象**

探索奖励入账时使用 `kind: 'exploration'`：

- `grantExplorationReward` 在 `src/store/gameStore.tsx:1144` 追加 `exploration` 流水。
- 刷新后 `normalizeRewards` → `normalizeLedger` 过滤流水。
- `normalizeLedger` 的白名单只允许 `level / level-repeat / boss / chapter / difficulty / challenge`，遗漏 `exploration`：`src/game/economyConfig.ts:114`。
- `ProfilePage` 的最近成长明确包含 `exploration`，因此刷新前可见、刷新后消失。

**影响**

- 探索贡献点本身保存在 `rewards.credits`，不会丢失。
- 不会重复发奖，不会改变等级、成就或奖励总额。
- 损失的是“最近成长 / 奖励”历史行，属于跨系统数据一致性缺陷。

**等级**

P2。不阻断主流程、不阻断演示、不造成奖励重复或存档损坏。

**最小修复**

1. 在 `normalizeLedger` kind 白名单中加入 `exploration`。
2. 考虑将 `exploration` 加入 `ONE_TIME_KINDS`；探索节点天然一次性，`rewardsClaimed` 已提供第二层保护。
3. 新增测试：`appendLedger({kind:'exploration'}) → normalizeLedger` 保留；非法 kind 仍丢弃；刷新往返后流水存在。
4. 不修改任何奖励数值或探索核心规则。

**修改范围**

- `src/game/economyConfig.ts`（白名单，最小一行）
- `test/economy_check.mjs` 或 F.1 新增集成测试（只新增断言）
- 如加入 `ONE_TIME_KINDS`，需补一条重复流水去重断言。

**冻结系统影响**

Economy Core 属于冻结系统。该修复只恢复已存在的 `exploration` 流水，不改变经济数值。按规范，P2 默认不修改冻结系统；建议在 F.1 前由人工确认是否批准这行最小修复，否则记录为已知 P2 并在 F.5 保留。

### 6.2 P3-01 · 放弃探索终端后 pendingChallenge 残留

- 失败或退出挑战时 `pendingChallenge` 不会被清除；只有成功结算或下个终端覆盖。
- 不会重复奖励，不会卡死；但 Explore / Save 中存在 stale pending。
- 建议：F.1 评估是否在“明确放弃”时清理；如无 UI 明确放弃入口，保留现状并记录。

### 6.3 P3-02 · 旧 D 存档的新成就要等下一次重算

- E 新增 3 个成就，`normalizePlayerState` 只过滤合法成就 ID，不主动重算。
- 已完成的旧探索存档在首次打开档案时可能暂时少 3 个成就，下一次探索/挑战/危机事件后补齐。
- 不影响奖励与进度；建议 F.1/F.2 验证并以“下次真实事件补齐”作为可接受行为。

### 6.4 P3-03 · 探索终端结算的成就未进入本次结算列表

- `completeLevel` 的 `gained` 在探索节点结算前计算；终端完成后 `applyAchievementRecalc` 可能新增成就。
- toast 与档案会正确更新，但本次结算页 `newAchievements` 列表不包含这些新增成就。
- 不影响状态与奖励；F.1 可评估是否合并结算展示。

### 6.5 P3-04 · 无全局 Error Boundary

- `App.tsx` 没有错误边界；极端渲染异常可能显示空白页而不是可恢复错误页。
- 存档层已能处理无效 JSON / 字段缺失；这是额外的 UI 韧性缺口。
- F.2 可决定是否新增最小错误边界；不作为 F.0 阻断。

### 6.6 P3-05 · 首次加载无代码分割

- `App.tsx` 静态导入全部 18 个页面；`build.mjs` 使用 `inlineDynamicImports: true`。
- 当前产物 2,143,371 bytes；首次启动加载全部系统代码。
- F.3 要求分析 Challenge / Boss / Explore / Archive / MIRA 懒加载；必须先测真实首屏与页面切换，再决定是否拆分，不能用拆分破坏路由/存档/E2E。

## 7. 问题严重等级汇总

| 等级 | 数量 | 内容 |
|---|---:|---|
| P0 | 0 | 无 |
| P1 | 0 | 无 |
| P2 | 1 | P2-01 探索奖励流水 normalize 丢失 |
| P3 | 5 | stale pending、旧档成就补齐、结算成就列表、Error Boundary、代码分割 |

## 8. 最小实施方案

### 8.1 F.1

1. 先申请人工确认 P2-01 是否允许修改 Economy Core 白名单。
2. 若批准：只加 `exploration` 白名单 + 账本往返测试；不改变数值。
3. 若不批准：保留 P2-01 记录，F.1 只做跨系统集成测试与状态验证。
4. 新增 F.1 集成 / E2E：
   - Challenge → Player → MIRA → Achievement 全链一致性。
   - Challenge → Explore → Reward：失败不完成、退出不奖励、重复不重复发奖。
   - Boss → Reward → MIRA → Achievement → Archive。
   - Exploration → Growth → Profile 刷新往返。
5. 不新增大型系统，不重写判题 / Boss / 经济 / 探索。

### 8.2 F.2

- 真实执行异常流程：Challenge/Boss/Explore 中途刷新、快速跳转、重复点击、无效/旧/异常存档、损坏 JSON。
- 页面完整性扫描：所有 screen 可打开、无空白、无未捕获异常、弹窗可关闭、导航有效。
- 全量回归并给出实际命令与数量，不以“所有测试通过”代替数据。

### 8.3 F.3

- 先测真实首屏、启动、页面切换、Challenge、Boss、Explore、移动端；未测量项标记 `NOT MEASURED`。
- 再评估路由级懒加载；拆分后必须回归 Save、路由状态、E2E 与移动端。
- 性能优化不得牺牲视觉演出、Reduced Motion、Performance Mode。

### 8.4 F.4

- 采用真实存档与手动演示流程优先，不伪造奖励/成就/Boss 胜利。
- 若新增演示辅助，必须与正式存档隔离；成本过高则不新增。
- 按 5～8 分钟六幕流程准备并实测截图 01～13。

### 8.5 F.5

- 执行最终验收全链路；P0 / P1 必须为 0；P2 必须记录且不影响演示。
- 通过后冻结 NEXUS V1.3，禁止自动 Commit / Push / Deploy，等待人工确认。

## 9. 测试方案

### 9.1 新增 Unit

- 跨系统数据映射：Challenge settlement → exp / level / tolerance / risk。
- Reward Idempotency：challenge / boss / exploration / achievement / MIRA。
- State Recovery：challenge session、exploration pending、boss run、MIRA eventLog。
- Save Compatibility：v10 旧档缺 MIRA / Explore / Achievement / Ledger / Boss 数据。
- **P2-01 专项**：`exploration` 账本 normalize 保留与重复去重。

### 9.2 新增 Integration

- Challenge → Player → MIRA → Achievement。
- Challenge → Explore → Reward。
- Boss → Reward → MIRA → Achievement → Archive。
- Exploration → Growth → Profile。
- 重复结算 / 重复领取 / 刷新后再次领取。

### 9.3 新增 E2E

至少覆盖规范要求 8 项：

1. 完整挑战成长流程。
2. Explore 真实挑战。
3. 隐藏信号。
4. Boss 完整流程。
5. 刷新恢复。
6. 重复领取。
7. 移动端 360 / 390 / 430。
8. 竞赛演示流程。

### 9.4 已有回归基线

E 收尾实测（同一工作区）：

| 类型 | 文件数 | 用例数 | 结果 |
|---|---:|---:|---|
| Unit / 纯逻辑 | 22 | 1,407 | 全部通过 |
| Integration | 15 | 1,284 | 全部通过 |
| E2E | 9 | 351 | 全部通过 |
| 合计 | 46 | 3,042 | 全部通过 |

F.0 未重复执行上述全量回归；F.2/F.5 必须重新执行并记录实际输出。

## 10. 证据

- 关键账本白名单：`src/game/economyConfig.ts:114`
- 探索奖励入账：`src/store/gameStore.tsx:1144`
- 奖励 normalize：`src/game/rewards.ts:92`
- 探索终端完成：`src/store/gameStore.tsx:3233`
- Boss 胜利兜底：`src/store/gameStore.tsx:3653`
- Boss 首胜/结算：`src/store/gameStore.tsx:3707`
- 成就 normalize：`src/services/save.ts:285`
- 结算成就列表：`src/store/gameStore.tsx:3266`
- 页面静态导入：`src/App.tsx:3`
- 单包构建：`build.mjs:46`

## 11. 审查结论

A～E 系统已经形成真实闭环：

- Challenge、Boss、Explore、MIRA、Achievements、Economy、Profile、Save 之间的主数据流连通。
- 奖励幂等与重复结算防护总体成立。
- 存档 v10 自愈可用，无 P0 / P1。
- 唯一 P2 是探索奖励流水的 normalize 白名单遗漏，积分不丢、奖励不重复、流程不阻断。
- P3 均为展示、迁移补齐或性能/韧性优化，不阻断竞赛演示。

**F.0 结论：允许进入 F.1。**

进入 F.1 前需人工确认：P2-01 是否批准一行 Economy Core 白名单修复。若批准，F.1 做最小修复 + 账本往返测试；若不批准，记录为已知 P2，继续集成与回归，F.5 保留说明。

F.0 已停止，未修改业务代码，未进入 F.1。
