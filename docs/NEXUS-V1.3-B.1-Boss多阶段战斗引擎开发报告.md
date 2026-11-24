# NEXUS V1.3-B.1 · Boss 多阶段战斗引擎开发报告

> 阶段：NEXUS V1.3-B.1 Multi-Phase Boss Battle Engine  
> 完成日期：2026-11-19  
> 结论：**CONDITIONAL PASS**（条件见第 14 节）

---

## 1. 项目环境

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》v1.1.3 |
| Node | v24.22.0 |
| npm | 11.19.1 |
| 浏览器（E2E） | Google Chrome 158.0.8127.37（Playwright 驱动，真实 Chromium 内核） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD Commit | `1eb91f2`（feat(challenge): V1.3-A.1 挑战接入游戏 + 动态事件引擎与未知入侵） |
| 工作区 | 存在并行开发未提交文件（见下），本阶段未覆盖、未删除、未提交它们 |
| 存档版本 | **v10（保持不变，未升级）** |

并行工作文件（本阶段未修改）：

- `.gitignore`
- `public/cinematic.css`
- `src/components/CinematicStage.tsx`
- `src/components/IntrusionOverlay.tsx`
- `src/game/economyConfig.ts`
- `test/challenge_integration_check.mjs`
- `docs/prologue-art/`、`docs/序章插画-生图提示词包.md`、`src/components/SceneArt.tsx`、`.agents/` 等

本阶段新增/修改的文件清单见第 3、4 节。

---

## 2. 开发前架构审查

### 2.1 原 Boss 系统

- `src/game/bosses.ts`：Boss 主数据（6 章主线 + 支线回响）。
- `src/game/battle.ts`：`BossBattleDef` / `BossPhaseDef` / `BossBattleState`，已有「4 个判题阶段 × 25 血」的战斗结算（`resolveSubmission` / `normalizeBattleState` / `verifyBattleState`）。
- `src/game/bossDifficulties.ts`：EASY / HARD / EXPERT 三套真实题目。
- `src/pages/BossBattlePage.tsx`：真实战斗 UI、真 Python 判题、首胜结算。
- `src/game/chapterFlow.ts`：Boss 门禁、真实胜利校验、首胜事务（幂等）。

**结论**：原有「判题阶段」不是「战斗阶段」。B.1 在其上新增一层可扩展的 Boss 战斗阶段编排，不重写原有判题与结算。

### 2.2 挑战 / Judge / 运行器

- `challengeEngine.ts` / `challengeSession.ts` / `challengeRules.ts` / `challengeTemplates.ts`
- `services/judge.ts`（测试注入 + 结果解析 + 代码安全限制）
- `services/pythonRunner.ts`（真实 MicroPython/WASM）
- 挑战奖励与会话持久化已存在。

**结论**：Boss 阶段挑战继续复用真实 Judge 与 Python Runner，没有新建假判题系统。

### 2.3 存档

- `services/save.ts`：`normalizePlayerState` 字段级自愈；损坏存档备份。
- `services/migrations.ts`：v1→v10 迁移链；`CURRENT_SAVE_VERSION = 10`。
- `localStorage` 键保持 `nexus_code_repair_save_v1`。

**结论**：新增字段全部采用「缺失即补」的 normalize，不升级存档版本。

### 2.4 事件引擎

- `game/eventEngine.ts`：世界动态事件生命周期（未知入侵等）。
- B.1 的事件是战斗域事件，采用进程内 `bossBattleEventBus`，**没有**另建一套动态事件引擎，也没有污染 `progress.dynamicEvent`。

---

## 3. 新增文件

| 文件 | 用途 |
|---|---|
| `src/game/bossPhaseEngine.ts` | 多阶段引擎：状态机、阶段切换、HP 策略、事件总线、战斗记录、存档自愈、DEV 辅助函数 |
| `src/game/bossPhasePlans.ts` | 通用阶段配置构建器；GATE-01 三阶段、K-0 两阶段、其余 Boss 默认四阶段；阈值由真实血量段自动推导 |
| `src/game/devMode.ts` | DEV 入口开关（生产构建静态关闭） |
| `src/components/BossPhaseDevPanel.tsx` | 仅 DEV 可见的 Boss 多阶段测试面板（纯内存态） |
| `src/vite-env.d.ts`（修改） | 声明构建期 `process.env.NODE_ENV` 类型 |
| `test/boss_phase_engine.test.mjs` | 状态机 / 阶段切换 / HP / 事件 / 自愈专项（91 断言） |
| `test/boss_phase_integration.test.mjs` | 真实 Python 驱动完整三阶段战斗 + 存档兼容（156 断言） |
| `test/boss_phase_e2e.mjs` | Playwright + 真实 Chrome + 真实 MicroPython 端到端（31 断言） |

---

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/game/types.ts` | `Progress` 增加 `bossBattles` / `bossBattleHistory` / `bossPhaseProgress`（类型引用，不改变原字段语义） |
| `src/services/save.ts` | 注入多阶段状态自愈；用真实 `battles[bossId]` 血量对账运行状态；旧存档缺字段自动补空对象/空数组 |
| `src/store/gameStore.tsx` | 开始/继续/放弃战斗、提交攻击、Boss 反击死亡、重生重置、首胜事务全链路接入多阶段引擎；新增 `bossPhaseRunOf` / `completeBossPhaseTransition` |
| `src/pages/BossBattlePage.tsx` | HUD 战斗状态、阶段名/描述/血量、阈值刻度、阶段切换演出、切换期间锁定提交、DEV 面板挂载 |
| `public/boss.css` | 多阶段面板、阶段阈值线、切换演出、DEV 面板样式；移动端适配 |
| `build.mjs` / `vite.config.ts` | 最终未产生净修改（DEV 开关改为 `process.env.NODE_ENV` 静态替换，二者原本已具备该替换） |

---

## 5. Boss 多阶段系统设计

### 5.1 状态机

状态：`idle → preparing → active → phase_transition → active → … → victory`；失败 `active → defeat`；异常 `active → interrupted → active(resumed)`。

合法转换表（引擎内 `ALLOWED_TRANSITIONS`）：

| 当前 | 允许 |
|---|---|
| idle | preparing |
| preparing | active, interrupted |
| active | phase_transition, victory, defeat, interrupted |
| phase_transition | active, victory, defeat, interrupted |
| victory / defeat | —（终结） |
| interrupted | preparing, active |

非法转换返回 `ok=false` 且状态不变。`resumeBattle` 会校验血量与终结状态，已死亡/已结束战斗不会重新进入 active。

### 5.2 阶段配置

`BossPhaseConfig`：`phaseId`、`phaseName`、`phaseIndex`、`description`、`hpThreshold`、`maxHp`、`phaseIntro/Outro`、`difficultyMultiplier`、`availableChallenges`、`hpPolicy`、`defense`、`stageMetadata`、`trigger`。

- GATE-01：3 阶段（能源封锁 / 防御协议 / 核心暴走），阈值 100 / 75 / 50，挑战分组 `[p1] [p2] [p3,p4]`。
- K-0：2 阶段（绝对安全壁垒 / 零号裁决），阈值 100 / 50。
- SOMNIA / INDEX-0 / JUDGMENT-4 / ENTROPY：默认 4 阶段（每个判题阶段一个），阈值 100/75/50/25。
- 引擎本身支持任意阶段数量（测试覆盖 5 阶段合成配置）。

阈值由各阶段真实血量段自动推导，未硬编码到 Boss 数据。

### 5.3 阶段切换与幂等

`evaluatePhaseTransition` 选择「满足条件的最高阶段」，一次跨多个阈值只产生一次切换；被跳过阶段写入历史（进入/退出时间相同），不会重复执行。

- `transitionId` 唯一；`completedTransitionIds` 最多保留 32 条。
- `phase_transition` 状态下再次触发会被拒绝。
- `completePhaseTransition` 重复调用不会重复初始化阶段、不会追加历史。
- 刷新时若仍处于 transition：保留切换意图，由 UI 在演出结束后完成；若血量已跨阈值，存档自愈会静默追平阶段，不重复演出。

触发条件：

- HP 阈值（默认）
- 挑战完成（`challenge-complete`）
- 特殊事件（`special-event`，为 B.4 预留）
- 组合条件（`composite`：全部子条件同时满足）
- 显式 trigger 与 HP 阈值取「或」；composite 只按组合条件判定。

### 5.4 HP 策略

| 策略 | 行为 | 使用情况 |
|---|---|---|
| `inherit`（默认） | 保留整体战斗进度，不回血，只钳制到当前阶段段上界 | 全部现有 Boss |
| `restore` | 明确配置时固定恢复到满血 | 仅配置显式声明时 |
| `independent` | 进入新阶段时补满该阶段独立血量段 | 仅配置显式声明时 |

所有路径保证：HP 不低于 0、不超过 maxHp、不因切换突然归零（伤害归零走胜利），不会重复结算同一伤害。

### 5.5 战斗生命周期与记录

`BossBattleRunState`：`battleId`、`bossId`、`bossName`、`difficulty`、`status`、`startedAt/endedAt`、`hp/maxHp`、`currentPhaseId/Index`、`phaseHistory`、`transition`、`completedTransitionIds`、`completedChallenges`、`consumedEventIds`、`stats`、`battleResult`、`updatedAt`。

统计：`damageDealt`、`damageReceived`、`challengeAttempts/Successes/Failures`、`phaseTransitions`。

已终结战斗可转为 `BossBattleRecord`（附加 `grade: null`），供 B.5 评价系统读取；B.1 不实现评分。

### 5.6 事件

`BOSS_BATTLE_EVENTS`：

`BOSS_BATTLE_STARTED`、`BOSS_PHASE_STARTED`、`BOSS_PHASE_TRANSITION`、`BOSS_PHASE_COMPLETED`、`BOSS_CHALLENGE_STARTED`、`BOSS_CHALLENGE_COMPLETED`、`BOSS_DAMAGE_DEALT`、`BOSS_DAMAGE_RECEIVED`、`BOSS_BATTLE_VICTORY`、`BOSS_BATTLE_DEFEAT`、`BOSS_BATTLE_INTERRUPTED`、`BOSS_BATTLE_RESUMED`。

每个事件包含：唯一 `id`、`type`、`battleId`、`bossId`、`phaseId`、时间戳 `at`、`payload`。总线支持订阅/退订，监听器异常不会影响战斗。

### 5.7 存档字段

```ts
progress.bossBattles?: Record<bossId, BossBattleRunState>
progress.bossBattleHistory?: BossBattleRecord[]   // 最多 20 条，battleId 去重
progress.bossPhaseProgress?: Record<bossId, { highestPhaseIndex, clearedPhases, updatedAt }>
```

旧存档缺失自动补 `{}` / `[]`；非法条目（未知 Boss、难度不匹配、越界 HP/阶段、脏历史）全部丢弃或钳制；刷新时运行状态与 `progress.battles[bossId].hp` 对账。

---

## 6. 实际游戏接入

- 接入 Boss：**GATE-01「数据港守卫」**（第 1 章主线 Boss，玩家在完成第一章 6 个普通关卡后从世界地图进入）。
- 进入方式：世界地图 → syntax 服务器 → `挑战 ▸` → 选择难度 → `开始挑战`。
- 阶段流程：能源封锁（p1）→ 防御协议（p2）→ 核心暴走（p3+p4）。
- 阶段切换：判题击破阶段后真实 HP 落到 75 / 50，触发 `phase_transition`，UI 播放 1.6 秒演出（阶段名、outro、intro），期间提交锁定，演出结束进入 active。
- 胜利：最终阶段击破 HP 归零 → 原有首胜事务发放经验 / 贡献点 / 创世主碎片 `frag-01` / 章节解锁；多阶段记录写入历史与阶段进度。
- 奖励结算、章节进度、MIRA、碎片、Vault、复活、商店、背包、经济均走原有路径，未被替换。

---

## 7. 测试结果

所有命令均在项目根目录执行，结果为真实执行。

| 测试 | 执行命令 | 结果 | 断言数量 |
|---|---|---|---|
| 多阶段状态机/切换/HP/事件/自愈 | `node test/boss_phase_engine.test.mjs` | PASS | 91 / 91 |
| 真实 Python 集成 + 存档兼容 | `node test/boss_phase_integration.test.mjs` | PASS | 156 / 156 |
| Boss 多阶段真实浏览器 E2E | `node test/boss_phase_e2e.mjs` | PASS | 31 / 31 |
| 原 Boss 战斗数据/真实判题 | `node test/boss_battle_check.mjs` | PASS | 105 / 105 |
| 原 Boss 战 jsdom E2E | `node test/boss_battle_e2e.mjs` | PASS | 24 / 24 |
| V1.3-A 挑战引擎 | `node test/challenge_engine_check.mjs` | PASS | 66 / 66 |
| V1.3-A 挑战集成 | `node test/challenge_integration_check.mjs` | PASS | 57 / 57 |
| 挑战真实解答 | `node test/challenge_solutions_real.mjs` | PASS | 21 / 21 |
| A7 存档安全 | `node test/a7_save_check.mjs` | PASS | 95 / 95 |
| A7 跨模块联调 | `node test/a7_integration_check.mjs` | PASS | 33 / 33 |
| 章节流程 | `node test/chapter_flow_check.mjs` | PASS | 133 / 133 |
| 第 3~6 章 | `node test/chapter3_check.mjs` 等 | PASS | 各 31 / 31 |
| 经济 | `node test/economy_check.mjs` | PASS | 44 / 44 |
| 商店 | `node test/shop_check.mjs` | PASS | 63 / 63 |
| Vault | `node test/vault_check.mjs` | PASS | 55 / 55 |
| 难度系统 | `node test/difficulty_check.mjs` | PASS | 669 / 669 |
| 会话/奖励/成就/图鉴/身份/结局 | 对应 `*_check.mjs` | PASS | 44 / 37 / 51 / 146 / 30 |
| 冒烟 | `node test/smoke.mjs` | PASS | 全部通过 |
| A7 E2E | `node test/a7_e2e.mjs` | PASS | 51 / 51 |
| A7.1 功能 E2E | `node test/a7_1_features_e2e.mjs` | PASS | 24 / 24 |
| A7.2 挑战+事件 E2E | `node test/a7_2_challenge_event_e2e.mjs` | PASS | 20 / 20 |
| A7.3 兼容性验收 | `node test/a7_3_a2_acceptance.mjs` | PASS | 42 / 42 |
| 章节门禁 E2E | `node test/chapter_gate_e2e.mjs` | PASS | 27 / 27 |
| 剧情流 E2E | `node test/story_flow_e2e.mjs` | PASS | 46 / 46 |
| 布局/移动端 | `node test/layout_e2e.mjs` | PASS | 116 / 116 |
| 难度 E2E | `node test/difficulty_e2e.mjs` | PASS | 36 / 36 |
| 其余 E2E（vault/shop/economy/draft/identity/journal/reward/settlement/ending/voice） | 对应 `*_e2e.mjs` | PASS | 28 / 45 / 19 / 39 / 30 / 11 / 18 / 46 / 17 / 16 |

> 测试未出现 FAIL 项；本阶段未修改的并行工作文件也通过其现有测试。

---

## 8. TypeScript

- 命令：`npm run typecheck`
- 结果：**通过，0 错误**
- 无旧错误遗留。

## 9. Build

- 命令：`npm run build`
- 结果：**成功**
- 产物：`dist/assets/game.js` ≈ **1150 KB**
- Rollup 警告：仅常规 chunk 体积提示，无功能警告。

---

## 10. 浏览器验收

- 浏览器：Google Chrome 158.0.8127.37（Playwright 启动，真实 Chromium 内核）
- 测试方式：`node test/boss_phase_e2e.mjs`（Vite dev server + 真实 MicroPython/WASM + 真实 Monaco 编辑器）
- 实际流程：
  1. 进入 GATE-01 真实战斗；
  2. 显示第一阶段「能源封锁」；
  3. 编辑并提交正确代码，真实判题命中；
  4. HP 100 → 75，触发阶段切换演出；
  5. 进入第二阶段「防御协议」；
  6. **刷新页面**，恢复到阶段 2/3，不重复演出、不重复记录；
  7. 第二阶段击破 → 最终阶段「核心暴走」；
  8. 第三、第四挑战完成，HP 25 → 0；
  9. 胜利结算、碎片归位、章节 Boss 记录、阶段进度写入；
  10. 胜利后提交按钮禁用；
  11. 生产构建（`dist`）中 DEV 入口不可见（`?dev=1` 无效）。
- 截图位置：`.tmp/b1-evidence/`
  - `01-stage1.png`、`02-phase-transition.png`、`03-stage2.png`、`04-refresh-recovered.png`、`05-stage3.png`、`06-victory.png`、`07-production.png`
- 人工目视：已查看 `01` / `02` / `06` / `07` 关键截图，阶段面板、切换演出、胜利结算与生产界面显示正常。
- 页面异常：E2E 期间无未捕获异常 / 无业务控制台错误（仅被主动拦截的 Google Fonts 请求）。

---

## 11. 兼容性

| 平台 | 验证方式 | 结果 |
|---|---|---|
| PC | 真实 Chrome 1440×900（B.1 E2E） | 通过 |
| Mobile | `layout_e2e.mjs` jsdom 模拟 320 / 390 / 667 / 844 视口 | 通过（模拟） |
| Tablet | 同上（宽度覆盖） | 通过（模拟） |
| 真实设备 | **未测试** | 未验证 |

说明：Playwright/jsdom 视口模拟不等同于真实移动设备；真实设备触控、性能与字体渲染仍需人工验证。

---

## 12. 问题与修复

| 编号 | 级别 | 问题 | 原因 | 修复 | 回归 |
|---|---|---|---|---|---|
| B1-01 | P1 | 旧 Boss 入口未显式“开始挑战”时提交被新状态机拦截，原有 E2E 反击流程超时 | 新运行状态初始为 idle/preparing，页面守卫与 store 都禁止提交 | UI 仅锁定切换/终结状态；store 对 idle/preparing 隐式激活（兼容旧行为） | `boss_battle_e2e` 24/24 |
| B1-02 | P1 | 刷新后运行状态可能与真实血量分叉（阶段回退或演出重复） | 运行状态与 `battles[bossId]` 两个数据源 | 在 `save.normalizePlayerState` 中用真实血量 reconcile；阶段只允许单调前进 | 集成测试 156/156、E2E 刷新段 |
| B1-03 | P2 | `restore` HP 策略语义不清（补段 vs 固定恢复） | 初版实现为补满当前段 | 明确为“固定恢复满血”，仅显式配置可用；默认仍 inherit | 引擎测试 91/91 |
| B1-04 | P2 | 阶段切换横幅在截图/动画中过早淡出 | CSS 动画 1.65s 内淡出，与截图时机竞争 | 改为淡入后保持，切换完成由 React 卸载 | E2E 截图 `02-phase-transition.png` |
| B1-05 | P2 | DEV 入口环境判定不可靠（Vite define 未生效） | `__NEXUS_DEV__` 注入方式与构建链不一致 | 改用 `process.env.NODE_ENV` 静态替换（Vite dev / build.mjs 均已支持） | 生产构建验证通过 |
| B1-06 | P3 | 第一阶段显示“阈值 ≤100%”不自然 | 阈值对初始阶段的直观性 | 改为“初始阶段” | 目视截图 |

未发现 P0 问题。

---

## 13. 未完成事项

1. B.2 攻击模式与攻击预警、B.3 弱点/护盾破解、B.4 动态事件战斗联动、B.5 战斗评价、B.6 全面视觉升级均**未开发**（仅保留配置/事件/记录接口）。
2. 真实移动设备 / 平板设备的触控与性能验收未执行。
3. 除 GATE-01 外，其余 5 个 Boss 未做真实浏览器 E2E；其配置一致性由集成测试覆盖（所有难度、阈值、挑战归属、血量和）。
4. 未做长时间挂机/内存与事件监听泄漏的专门性能剖析（事件总线不持久化、切换与定时器均有幂等与清理保护）。
5. 本次未提交 Git（按要求保留工作区供验收）。

---

## 14. 最终结论

### CONDITIONAL PASS

理由：

- 多阶段 Boss 引擎、状态机、阶段切换、HP 策略、战斗记录、存档恢复均已实现并通过 91 + 156 条专项/集成断言。
- GATE-01 已接入真实游戏入口，真实 Python Runner + Judge + 首胜奖励 + 刷新恢复全流程通过真实 Chrome E2E（31/31）。
- 原 Boss、31 关、7 服务器、挑战、动态事件、存档、经济、商店、Vault、MIRA、剧情等回归测试全部通过。
- TypeScript 0 错误，生产构建成功。
- 无 P0/P1 遗留问题。

条件项（满足后可转为 PASS）：

1. 在至少一台真实移动设备与一台平板上完成 Boss 战斗触控、布局与性能人工验收。
2. 在桌面端进行一次完整人工交互走查（非 headless 自动化），重点确认阶段切换演出的节奏与可读性。

---

## 附：证据位置

- 测试证据截图：`.tmp/b1-evidence/`
- 专项测试：`test/boss_phase_engine.test.mjs`、`test/boss_phase_integration.test.mjs`
- 浏览器 E2E：`test/boss_phase_e2e.mjs`
- 本报告：`docs/NEXUS-V1.3-B.1-Boss多阶段战斗引擎开发报告.md`
