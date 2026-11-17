# NEXUS V1.2-A · A4 挑战状态、容错系统与结算数据显示 · 开发报告

> 阶段：V1.2-A / A4（A5、A6 未开始）
> 分支：`feature/v1.2-a-experience-polish`
> 前置：A1（f1c90a9）、A2（b536df2）、A3（6d9c802）已通过并保持可用

---

## 一、修改前问题分析

开发前逐项检查了挑战页、Boss 页、重生流程、结算面板、存档与奖励发放，确认以下真实问题：

| # | 问题 | 根因 |
|---|---|---|
| 1 | 升级提示永远是「容错次数 +0」 | 结算面板用 `g.tolerance`（结算后的等级容错）减去 `toleranceFor(oldLevel)` 计算增量，此时 `g.tolerance` 已经等于新等级的容错，差值恒为 0；而且容错是台阶函数（Lv3→4 本来就不增加），旧文案无法区分「没跨台阶」和「已达上限」 |
| 2 | HUD 只显示容错上限，不显示剩余 | `容错 {g.tolerance}` 把「上限」当成了「剩余」，玩家无法判断还能失败几次 |
| 3 | 挑战过程中没有任何运行/提交/用时统计 | `ChallengePage` 只维护 UI 状态，刷新即丢；结算面板只能显示经验/星级，无法回答「本次跑了几次、卡了多久」 |
| 4 | 容错计数有两套来源，可能漂移 | `failedAttempts[levelId]`（星级/奖励用）与页面自己的计数各自维护；防御成功后只清了 `failedAttempts`，没有别的记录可对账 |
| 5 | 重生后容错没有清零 | `finishRebirth` 只恢复意识、重置战斗，未重置本关 `failedAttempts`，与 MIRA「容错计数已清零」的文案矛盾；重生后下一次失败会立刻再次触发攻击 |
| 6 | 结算不可重复触发，但没有幂等保护 | `completeLevel` 每次都重新发经验/贡献点，只靠 UI 关闭面板阻止重复；双击提交、异步重入没有硬保护 |
| 7 | 失败没有结算界面 | 意识归零直接进入重生演出，玩家看不到失败原因、错误次数、容错使用与资源损失 |
| 8 | 手机端结算面板不可达 | `.overlay` 不滚动，390×844 下面板高于视口，底部「返回地图 / 下一关」被裁掉 |
| 9 | Boss 与普通关卡的容错展示公式不一致 | Boss 页手写 `g.tolerance - failures`，挑战页只显示上限，没有共用规则 |
| 10 | 旧存档可能带脏计数 | `failedAttempts` 可能是 `NaN`、负数或字符串，星级与容错展示会算出异常值 |

---

## 二、修改文件清单

| 类型 | 文件 | 说明 |
|---|---|---|
| 新增 | `src/game/challengeSession.ts` | 会话数据类型、生命周期、容错计算、结算构造、规范化与裁剪 |
| 修改 | `src/game/types.ts` | `ProgressState.challengeSessions`（v8 新增字段） |
| 修改 | `src/services/migrations.ts` | `CURRENT_SAVE_VERSION = 8`；v7→v8 迁移补齐会话表并清洗失败计数 |
| 修改 | `src/services/save.ts` | 默认档带 `challengeSessions: {}`；载入时规范化会话 |
| 修改 | `src/store/gameStore.tsx` | `beginChallenge / recordRun / recordSubmit`；`recordFail` 同步会话；`completeLevel` 单次结算；`startDeath / resolveDefense` 写失败结算；`finishRebirth` 清本关容错；Boss 会话与结算 |
| 修改 | `src/pages/ChallengePage.tsx` | 进入即开会话；运行/提交计数；提交与运行防连点（在途锁）；HUD 显示剩余/上限；成功结算改用会话数据；失败结算入口由重生流程承载 |
| 修改 | `src/components/RebirthOverlay.tsx` | 新增「挑战失败 · 结算」阶段，展示原因/用时/次数/容错/资源损失与重新挑战入口 |
| 修改 | `src/components/PlayerStatus.tsx` | 「容错」改为「容错上限」，避免上限/剩余混淆 |
| 修改 | `src/styles/global.css` + `public/global.css` | 结算明细、失败结算、移动端可滚动 overlay |
| 修改 | 测试断言 10 处 | `SAVE_VERSION === 7` → 8、迁移标签更新（存档结构升级，断言同步） |
| 修改 | `test/difficulty_e2e.mjs` | 死亡流程新增「失败结算 → 点击重新挑战 → 重组对话」两步（行为变更的同步） |
| 新增 | `test/session_check.mjs` | 44 条会话/容错/结算/迁移纯逻辑断言 |
| 新增 | `test/settlement_e2e.mjs` | 46 条真实浏览器端到端断言 |
| 新增 | `docs/a4-screens/*.png` | 成功结算（桌面/手机）、失败结算截图 |

未改动：`judge.ts`、`levels.ts`、`knowledge.ts`、`battle.ts` 判题标准、章节流程与 Boss 首胜事务、A3 诊断核心逻辑、A1 草稿实现、A2 响应式规则。

---

## 三、challengeSession 数据结构与生命周期

```ts
interface ChallengeSession {
  id: string;              // `${levelId}@${startedAt}`，用于幂等与去重
  levelId: string;
  kind: 'level' | 'boss';
  status: 'active' | 'passed' | 'failed';
  startedAt: number;
  endedAt: number | null;
  runs: number;            // 预览运行次数
  submits: number;         // 正式提交次数
  errors: number;          // 失败提交次数（与 failedAttempts 同步）
  hints: number;           // 本次使用的提示层数
  toleranceMax: number;    // 进入时的容错上限
  settlement: ChallengeSettlement | null;
}
```

结算体 `ChallengeSettlement` 记录：结果、耗时、运行/提交/错误/提示、容错上限/已用/剩余、容错增量与是否封顶、下一次提升等级、等级与经验前后值、经验与贡献点增量、失败原因、实际资源损失。

**生命周期（全部由 store 统一推进）**

| 阶段 | 入口 | 行为 |
|---|---|---|
| 初始化 | `beginChallenge(levelId)`（挑战页进入/重生后） | 无会话 → 新建；进行中 → 原样保留（刷新/重进不丢统计）；已结算 → 新开 |
| 开始挑战 | 同上 | `startedAt` 写入，状态 `active` |
| 运行代码 | `recordRun` | `runs + 1`（只在 `active`） |
| 提交挑战 | `recordSubmit` | `submits + 1`；失败再 `recordFail` → `errors + 1` 且同步 `failedAttempts` |
| 成功结算 | `completeLevel` | 若会话已 `passed` 直接返回 `null`（不重复发奖）；否则构造 `passed` 结算并写入会话 |
| 失败结算 | `startDeath` / `resolveDefense(false)` 归零分支 | 构造 `failed` 结算（原因、容错、资源损失），状态置 `failed` |
| 下一关初始化 | 关卡切换 → `beginChallenge(新 id)` | 新会话从零开始，上一关数据不进入下一关 |
| 重生 | `finishRebirth` | 清空本关 `failedAttempts`；已结算的失败会话保留为历史，再次进入会新开会话 |

**防重复**

- 提交/运行各有一把在途锁（`submitLockRef` / `runLockRef`），同一帧内的双击只执行一次，结束后释放（不设固定冷却，不影响连续挑战）。
- `settle()` 只允许 `active → passed/failed` 一次；`completeLevel` 对已结算会话直接返回 `null`。
- 奖励仍由既有 `cleared` / `firstClear` 幂等层兜底，会话层是第二道闸。

**隔离**

- 会话以 `levelId` 为 key，Boss 以 `bossId` 为 key；不同关卡天然隔离。
- 会话表按 `startedAt` 保留最近 12 条，避免长期游玩无限膨胀。

---

## 四、容错系统修复说明

1. **真实增量**：`toleranceOutcome(levelBefore, levelAfter)` 返回 `{maxBefore, maxAfter, gain, capped, nextLevel, nextMax}`。
   - `gain > 0` → 绿色横幅「等级提升 Lv.X → Y · 容错次数 +N（当前 M）」；
   - `gain === 0` 且未满级 → 中性说明「本次容错次数不变（当前 M 次；下次提升 Lv.N → M+1 次）」；
   - 满级 → 「容错次数已达到最高上限 7 次」。
2. **不再出现 +0**：横幅只在 `gain > 0` 时使用奖励样式；`gain === 0` 用说明性文案，不伪装成奖励。
3. **剩余值**：`toleranceRemaining(max, used) = max(0, max - used)`，永不小于 0；HUD 显示 `容错 剩余/上限`，结算显示「剩余 X / 上限 Y · 本次消耗 Z」。
4. **上限封顶**：结算中 `used = min(errors, max)`；失败结算额外提示「失误 N 次，已超过本关容错上限 M 次，结算按上限计」。
5. **单源**：`recordFail` 在同一 `commitPlayer` 内同时更新 `failedAttempts` 与 `session.errors`；防御成功时两者一起清零；重生时清 `failedAttempts` 并结束旧会话。
6. **Boss 一致**：Boss 战同样走 `beginChallenge(bossId,'boss')`、`recordSubmit`、`recordFail` 与 `passed` 结算；HUD 显示「容错 剩余 / 上限」，与普通关卡同一规则。
7. **脏数据**：迁移与会话规范化把 `NaN`、负数、字符串计数统一归零或取整，`toleranceMax` 至少为 1。

---

## 五、成功与失败结算修复说明

### 成功结算（真实数据，全部来自会话与结算体）

- 关卡名称与编号：`codename · title`（原有）+ 星级；
- 挑战完成状态：「修复成功」；
- 本次用时：`formatDuration(durationMs)`（mm:ss）；
- 运行次数 / 提交次数 / 错误次数 / 提示层数；
- 经验、贡献点：来自 `completeLevel` 真实奖励计算与 `settlement.expGained / creditsGained`；
- 容错：剩余 / 上限 / 本次消耗；
- 等级与升级进度：`Lv.N` + `经验 X（距 Lv.N+1 还差 Y）`，满级显示「已满级」；
- 容错增量：真实 `gain` 或「不变 / 已达上限」的原因；
- 下一关入口：保留原有「下一关」按钮与目标计算。

### 失败结算（新增）

触发条件：意识完整度归零（纠错者攻击两次防御失败、Boss 反击击穿）。单个提交失败仍只算「本次失误」，不是挑战失败。

面板字段：失败原因、本次用时、运行/提交、错误次数、容错上限、已使用容错、剩余容错、实际扣除（意识 -N%）、惩罚说明、重新挑战入口。
- 失败结算不显示任何成功奖励（无经验/贡献点/星级）。
- 结算写入会话（`status = 'failed'`），重生后保留为历史；重新挑战入口进入重组对话，`finishRebirth` 清空本关容错并恢复 70% 意识。

### 展示一致性

- 桌面、平板、手机使用同一份结算数据与同一套组件；
- 手机端结算面板现在可滚动（`overflow-y: auto` + `margin: auto`），390×844 下滚动后按钮可达（e2e 断言）；
- 所有字段经 `normalize*`，不会出现 `NaN` / `undefined` / `+0`（e2e 逐项断言）。

---

## 六、存档兼容性说明

- `CURRENT_SAVE_VERSION` 7 → 8；新增迁移步骤 **v7→v8：挑战会话**：
  - 补齐 `progress.challengeSessions = {}`；
  - 清洗 `failedAttempts`：非有限数/负数归 0，小数取整，正常值保留。
- `defaultState`、`normalizePlayerState` 均带 `challengeSessions`，导入/导出、云存档字符串、`wipeSave` 行为不变。
- 旧档（v1–v7）跨版本迁移链不变，只在最后附加 v8 步骤；`migrateSave` 对缺失版本号仍按 v1 处理。
- 载入时 `normalizeSessions` 丢弃无法修复的会话；`status` 已结算但缺少结算体的会话退回 `active`，避免展示残缺结算。
- 会话表裁剪到 12 条，不影响任何已有字段与迁移链。

---

## 七、自动化测试数量与通过率

| 套件 | 结果 |
|---|---|
| `session_check`（会话/容错/结算/迁移） | **44 / 44** |
| `settlement_e2e`（成功/失败/跨关/双击/手机滚动） | **46 / 46** |
| `diagnose_check` / `diagnose_e2e`（A3 回归） | 62/62 · 52/52 |
| `draft_check` / `draft_e2e`（A1 回归） | 52/52 · 39/39 |
| `layout_e2e`（A2 回归，5 标签） | 116 / 116 |
| `verify` / `mp_verify`（判题链路） | 71/71 · 71/71 |
| `boss_battle_check` / `boss_verify` / `boss_battle_e2e` | 105/105 · 19/19 · 24/24 |
| `audit_initial`（31 关初始代码） | 全部不通过（预期） |
| `smoke` | 全部通过 |
| 逻辑套件 12 组（acceptance/reward/chapter/journal/vault/voice/…） | **1345 条全通过** |
| 其他端到端（identity/chapter_gate/difficulty/reward/ending/journal/vault/voice/story_flow） | 30/27/36/16/17/11/28/16/46，全部通过 |
| `tsc --noEmit` / `npm run build` | 0 错误 / 成功（918 KB） |

### A4 自身关键断言

- 会话：新建/恢复/重开、运行/提交/错误计数、结算幂等、脏数据自愈、12 条裁剪；
- 容错：Lv2→3 `+1`、Lv3→4 `0` 且给出下次等级、Lv9→10 满级封顶、剩余永不为负、失败已用封顶；
- 成功：用时/次数/经验/贡献点/容错/等级进度与存档一致，双击提交只结算一次；
- 失败：原因/次数/上限/已用/剩余/资源损失/重试入口，且不含成功奖励；
- 跨关：1-2 会话从零开始，HUD 恢复 `4/4`。

---

## 八、PC / 平板 / 手机测试结果

| 设备 | 结果 |
|---|---|
| PC 1366×900 | 成功结算完整显示（截图 `settle-success.png`）；失败结算完整（`settle-failure.png`）；HUD `容错 剩余/上限`；无溢出 |
| 手机 390×844 | 成功结算无横向溢出；面板可滚动，滚动后「返回地图 / 下一关」可达（截图 `settle-success-mobile.png`）；失败结算在 92vw 内显示，网格两列 |
| 手机 320/360/430 | A2 布局回归 116/116 全通过（诊断标签、操作栏、编辑器高度不受影响） |
| 平板 900×800 | 布局回归通过；侧栏「任务/诊断/MIRA」切换正常 |

---

## 九、发现的问题及遗留风险

**本轮发现并修复**

1. `+0` 横幅（真实计算错误，非文案问题）；
2. HUD 混淆上限与剩余；
3. 重生未清容错（与 MIRA 文案矛盾，会导致重生后立刻再触发攻击）；
4. 结算无幂等保护、无会话统计；
5. 手机端结算面板裁切导致按钮不可达；
6. 旧档脏计数未清洗；
7. 我自己在 A4 引入的 300ms 连点锁会误伤「刚跑完就再运行」，已改为在途锁（由 A3 诊断回归暴露，已修复并复测 52/52）。

**行为变更（有意）**

- 死亡后先展示「挑战失败 · 结算」，需点击「重新挑战」再进入重组对话；不再是全自动。`difficulty_e2e` 已同步该流程。

**遗留风险**

1. Boss 战没有独立的「运行预览」，会话中 `runs` 与 `submits` 同值（每次攻击算一次运行+提交），UI 未展示误导性数据；
2. 失败结算只在意识归零时产生；单纯判题失败属于「本次失误」，不生成失败结算（符合现有玩法）；
3. 会话表最多保留 12 条，更早的历史会被裁剪（不影响奖励与进度）；
4. 手机端成功结算需要滚动才能看到底部按钮（内容确实高于视口，已保证可达）；
5. 重复提交的硬保护依赖页面在途锁 + 会话幂等；若未来新增其他提交入口，必须复用同一会话 API 才能保持幂等。

---

## 十、A1 / A2 / A3 回归结果

| 阶段 | 回归项 | 结果 |
|---|---|---|
| A1 自动保存 | `draft_check` 52/52、`draft_e2e` 39/39；A4 结算后草稿仍保存成功代码；刷新恢复、诊断重置 | 通过 |
| A2 响应式 | `layout_e2e` 116/116（320/360/390/430/768/1024/1366 + 横屏） | 通过 |
| A3 智能诊断 | `diagnose_check` 62/62、`diagnose_e2e` 52/52（分层、MIRA、沙箱超时、防泄露） | 通过 |
| 判题系统 | `verify` 71/71、`mp_verify` 71/71、`audit_initial` 31 关初始代码全不通过 | 通过 |
| Boss 战 | 105/105、19/19、24/24 | 通过 |
| 原有玩法 | `smoke`、1345 条逻辑断言、9 组其他 e2e | 通过 |

---

## 十一、结论与下一步

A4 完成：挑战状态统一到 `challengeSession`，容错计算与展示修复（真实增量、上限说明、剩余值），成功/失败结算全部使用真实数据并具备幂等保护，旧存档平滑迁移到 v8，PC/平板/手机展示一致。

本阶段到此暂停，不开始 A5。A5 将处理商城与经济系统；届时新增的经济入口应继续复用 `challengeSession` 与 `completeLevel` 的幂等事务，避免另起一套奖励发放。
