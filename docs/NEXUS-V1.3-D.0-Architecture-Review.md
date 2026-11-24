# NEXUS V1.3-D.0 · 数字世界探索架构审查

## 1. 已有功能

- **World**：`src/game/levels.ts` 已定义 7 个真实服务器区域（training/syntax/logs/storage/factory/diag/core），含名称、代号、坐标、章节、描述与锁定原因；`WorldMap.tsx` 已实现地图与区域选择。
- **Explore**：只有 WorldMap 的服务器选择/关卡入口，没有独立探索状态、节点、遗迹或隐藏内容。
- **Events**：存在 `eventEngine.ts` 与 `unknown-intrusion` 动态危机系统；没有探索事件类型。
- **Challenge**：`ChallengePage` 通过 `currentLevelId` 进入真实代码挑战，使用真实 Python Runner + Judge。
- **MIRA**：C 阶段已有 `miraCore`、成长、记忆、场景反馈与风险规则。
- **Save**：`SAVE_VERSION=10`，`normalizePlayerState` 已按字段自愈；没有探索字段。
- **UI**：复用 `panel`/`hud`/`nxbtn`/`chip` 等 NEXUS 风格组件。

## 2. 缺失功能

- 区域探索状态（LOCKED/AVAILABLE/EXPLORING/COMPLETED/ABNORMAL）。
- 探索节点（异常信号、损坏终端、数据遗迹、隐藏信号）。
- 探索事件状态、奖励幂等、探索档案。
- 探索与真实挑战/MIRA/经济/存档的闭环接口。
- 移动端探索页面。

## 3. 可直接复用

- `SERVERS` 与 `levelsOfServer`：区域与真实终端关卡。
- `ChallengePage` / `gameStore.completeLevel`：真实判题与奖励。
- `miraCore` + `miraAward` / `miraSceneLine`：成长、记忆、场景反馈。
- `RewardState` / `appendLedger` / `safeCredits`：贡献点奖励与账本。
- `normalizePlayerState`：可选字段自愈。
- WorldMap 地图视觉坐标与服务器数据。

## 4. 必须新增

- `src/game/explorationCore.ts`：区域/节点/事件/遗迹/隐藏/进度/存档自愈纯逻辑。
- `src/pages/ExplorePage.tsx`：区域地图、区域详情、探索事件、遗迹、隐藏、探索档案。
- `progress.exploration?: ExplorationState` 可选字段与 normalize。
- Store 只读/幂等接口：`explorationStateOf`、`exploreRegion`、`exploreInteract`、`exploreStartChallenge`。
- 入口：主菜单「数字世界探索」、WorldMap HUD 入口、App 路由。

## 5. 修改文件

- 新增：`explorationCore.ts`、`ExplorePage.tsx`。
- 修改：`types.ts`、`save.ts`、`gameStore.tsx`、`App.tsx`、`MainMenu.tsx`、`WorldMap.tsx`、`economyConfig.ts`（新增 `exploration` ledger kind）、`global.css`。
- 测试：`exploration_core.test.mjs`、`exploration_integration.test.mjs`、`exploration_e2e.mjs`。

## 6. 存档兼容

- 不升级 `SAVE_VERSION`（保持 10）。
- `progress.exploration` 为可选字段；缺失/损坏由 `normalizeExplorationState` 安全初始化。
- 事件、遗迹、隐藏、奖励 ID 全部幂等；刷新后保留。
- 复用现有 Challenge/MIRA/Reward 数据，不修改其业务规则。

## 7. 影响与边界

- 不修改 Boss 冻结系统、战斗、攻击、弱点、结算、奖励、归档。
- 探索只读取区域解锁/关卡结果，挑战仍通过现有真实入口执行。
- 动态危机系统不改造；探索事件使用自身持久状态，不新造事件调度器。
- 移动端沿用现有布局/性能模式；视觉动效遵守 Reduced Motion。

审查结论：可在现有 World/Challenge/MIRA/Save 基础上以最小追加完成 D 阶段。
