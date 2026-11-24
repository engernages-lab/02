# NEXUS V1.3-E.0 · 玩家成长与风险架构审查

- 审查日期：2026-11-23
- 审查范围：现有等级 / 经验 / 容错 / 意识 / 经济 / 成就 / MIRA / 探索 / 存档
- 结论：**已有成长与风险数据完整，可直接聚合展示；不新增第二套属性系统。**

## 1. 审查目标

V1.3-E 要求把玩家等级、经验、容错、意识风险、经济、探索、成就与 MIRA 统一为一条可感知的成长体验。本审查先确认真实代码中已经存在什么、缺少什么，再决定最小改动范围。

## 2. 现有系统盘点

| 系统 | 真实来源 | 现状 | E 阶段处理 |
|---|---|---|---|
| 等级 | `src/game/progression.ts` `LEVEL_XP` / `levelForExp` | 10 级阈值，首通经验后由 `completeLevel` 写入 | 只读复用 |
| 称号 | `TITLES` / `titleForLevel` | 每级对应固定称号 | 只读复用 |
| 容错 | `toleranceFor(level)` | Lv1-2:3、Lv3-4:4、Lv5-6:5、Lv7-8:6、Lv9-10:7 | 只读复用 |
| 经验结算 | `completeLevel` / `buildChallengeReward` | 首通发放，重复通关不再给玩家经验；增幅只在首通消耗 | 不修改 |
| 意识 | `player.consciousness` | 真实战斗 / 死亡 / 重生状态 | 只读复用 |
| 当前失误 | `progress.failedAttempts[levelId]` | 每次失败 +1，通关后归零；用于星级与容错 | 只读复用 |
| 挑战会话 | `progress.challengeSessions` / `settlement` | 保存 `toleranceUsed`、`toleranceRemaining`、`levelBefore/After`、`expAfter` | 只读复用 |
| 经济 | `rewards.ledger` / `appendLedger` | 挑战、等级、Boss、章节、探索等真实流水 | 只读复用 |
| 成就 | `src/game/achievements.ts` / `recalcAchievements` | 挑战、星级、Boss、等级、剧情等 23 项 | 新增 3 项并复用重算 |
| MIRA | `src/game/miraCore.ts` | 经验、阶段、记忆、事件幂等、风险提示 | 只读复用 |
| 探索 | `src/game/explorationCore.ts` | 7 区域、节点完成、隐藏信号、奖励幂等、探索档案 | 只读复用 |
| 存档 | `src/services/save.ts` | Save v10，字段级 `normalizePlayerState` 自愈 | 保持 v10 |

## 3. 关键真实事实

1. 当前全部关卡为 **31 个**（含训练、六章与额外终端），并非固定 26；成长总览按真实关卡数显示。
2. `LEVEL_XP = [0,100,260,470,730,1040,1400,1810,2270,2780]`，Lv2 需要 100，Lv3 需要 260。
3. `toleranceFor` 每 2 级提升 1 次，最高 7 次；升级后容错从当前等级即时读取，不额外存储。
4. 失败次数 `failedAttempts` 在 `completeLevel` 成功时归零，因此它是“当前关卡未结算失误”，不是终身失败总数。
5. 挑战结算中的 `session.toleranceUsed` 与 `toleranceRemaining` 是同一次真实提交的权威数据。
6. 意识完整度是 0–100 的持久化数值；低于 30% 时 MIRA 已有高风险提示。
7. 探索终端直接复用真实关卡 `tut-1` 等，通过 `pendingChallenge` 与 `completeTerminalChallenge` 结算，不复制判题。
8. 成就 `recalcAchievements` 是纯函数，只根据真实存档字段推导；已有重复调用不重复发奖。
9. MIRA 使用 `eventLog` 做事件幂等，单事件经验上限 500；成就奖励可复用 `mira:achievement:<id>` 事件 ID。
10. 旧存档缺少 `progress.exploration`、`mira`、`progress.achievements` 时由 normalize 补齐，不需要升级 SAVE_VERSION。

## 4. 发现的缺口

| 缺口 | 影响 | 最小方案 |
|---|---|---|
| 经验 / 等级 / 容错只在结算页出现 | 玩家无法在档案中形成长期成长感 | 新增“成长总览”只读聚合面板 |
| 风险状态没有统一命名 | 挑战中只有“容错 2/3”，MIRA 有提示但无统一等级 | 新增 `riskStatusFor` 四档只读规则 |
| 成就未覆盖探索完成 / 隐藏信号 / 真实危机 | 探索与危机缺少长期反馈 | 新增 3 个成就并接入既有重算 |
| 成就解锁没有成长侧反馈 | 成就只弹 toast，不进入成长记录 | 成就奖励复用 MIRA 幂等事件 |
| 档案的探索进度分散 | 玩家看不到区域/节点/隐藏信号汇总 | 成长总览加入区域/探索统计 |

## 5. 设计决策

### 5.1 单一数据源

所有数值来自 `PlayerState` 现有字段。`playerGrowthCore.ts` 只做读模型：

```text
level / exp / title / tolerance       ← progression.ts
consciousness / failedAttempts        ← player
regions / nodes / exploration pct     ← progress.exploration
achievementCount                      ← progress.achievements
miraLevel / miraStage                 ← mira
```

不写入任何新属性，不新增等级、经验、容错、风险或 MIRA 状态字段。

### 5.2 风险规则

`riskStatusFor({ consciousness, level, failures?, toleranceRemaining? })`：

| 条件 | 等级 |
|---|---|
| 意识 ≤ 20 或剩余容错 ≤ 0 | CRITICAL |
| 意识 ≤ 35 或剩余容错 ≤ 1 | DANGER |
| 意识 ≤ 60 或剩余容错 ≤ 2 或已失败 ≥ 2 | WARNING |
| 其他 | NORMAL |

挑战 HUD 传入真实 `tolUsed` 与 `tolLeft`；档案只读取真实意识与等级容错。两者都不写回存档。

### 5.3 成就映射

| 成就 | 真实触发 |
|---|---|
| 探索者 `explorer_first` | 任一区域核心节点全部完成 |
| 数据追踪者 `hidden_signal` | `exploration.hidden` 存在真实隐藏归档 |
| 危机处理者 `crisis_handler` | MIRA 已解锁 `mira-major-crisis` 记忆 |

成就只在探索交互、动态危机完成、终端挑战完成等真实事件后重算；奖励事件 ID 幂等。

### 5.4 存档策略

保持 `SAVE_VERSION = 10`。新增内容全部可选：

- `progress.exploration`：缺失时初始化空探索状态。
- `mira`：缺失时初始化 MIRA。
- `progress.achievements`：缺失时补空数组。
- 成长总览与风险状态不落盘，完全由当前存档推导。

## 6. 数据流

```text
真实挑战提交
  → recordFail / completeLevel（既有）
  → exp / level / tolerance / session（既有）
  → 成长总览读取
  → 风险 HUD 读取

真实探索交互
  → completeExploreNode / completeTerminalChallenge（既有）
  → exploration 状态（既有）
  → recalcAchievements（既有 + 新规则）
  → 成就 → MIRA 幂等奖励

真实危机完成
  → MIRA 记忆（既有）
  → recalcAchievements → 危机处理者
```

## 7. 非目标

- 不新增 RPG 属性、装备、技能树、天赋点。
- 不新增第二套等级 / 经验 / 风险 / MIRA 系统。
- 不修改 Challenge 判题、Boss 战斗、经济与探索核心规则。
- 不升级存档版本，不改变既有奖励数值。
- 不新增随机风险事件。

## 8. 实施清单

- [x] `playerGrowthCore.ts`：`riskStatusFor` / `growthOverviewFor` / `RISK_META`
- [x] 新增 3 个成就与重算规则
- [x] 档案“成长总览”与风险行
- [x] 挑战 HUD 风险 chip
- [x] 探索 / 危机 / 终端完成的成就重算
- [x] 成就奖励 MIRA 幂等
- [x] Save v10 兼容测试
- [x] 单元 / 集成 / 真实浏览器 E2E

## 9. 验收映射

| 需求 | 证据 |
|---|---|
| 成长来源统一 | 成长总览、E2E 经验 70→110 / Lv1→Lv2 |
| 容错与失败联动 | 挑战失败后 HUD WARNING、结算容错 2/3 |
| 风险四档 | `riskStatusFor` 29 项单元测试 |
| 探索联动 | 区域完成、隐藏信号、成长总览 1/7 |
| 成就 | 首次修复、接驳完成、探索者、数据追踪者 |
| 存档 | 刷新后等级 / 经验 / 成就 / 探索保留，v10 |
| 无重复奖励 | 重玩通关经验不变；成就奖励事件幂等 |

审查结论：按上述最小方案直接实施，不扩展系统边界。
