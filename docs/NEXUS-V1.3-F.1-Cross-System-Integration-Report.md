# NEXUS V1.3-F.1 · Cross-System Integration Report

- 阶段：V1.3-F.1 · Cross-System Integration & Data Consistency
- 日期：2026-11-23
- 分支：`feature/v1.2-a-experience-polish`
- HEAD：`85dd5a7`
- 结论：**PASS**
- 状态：F.1 冻结，等待人工验收；未进入 F.2，未 Commit / Push / Deploy。

## 1. Preflight

### 1.1 实际工作区

| 项目 | 实际值 |
|---|---|
| Branch | `feature/v1.2-a-experience-polish` |
| HEAD | `85dd5a7` |
| Package | `nexus-code-repair@1.1.3` |
| Node | `v24.22.0` |
| npm | `11.19.1` |
| SAVE_VERSION | `10` |
| 修改文件 | 18 |
| F.1 开始时未跟踪文件 | 147 |
| F.1 开始时工作区变更 | 165 |

与 F.0 对比：

- HEAD 未变化。
- 18 个已修改文件未变化。
- 未跟踪文件由 146 → 147，新增的是 F.0 审查报告。
- 未发现新的并行代码修改。

### 1.2 本阶段新增文件

```text
test/f1_ledger.test.mjs
test/f1_cross_system_integration.test.mjs
test/f1_cross_system_e2e.mjs
test/f1_boss_e2e.mjs
test/f1_build_smoke.mjs
docs/NEXUS-V1.3-F.1-Cross-System-Integration-Report.md
```

### 1.3 既有工作区保护

- 未执行 `git reset --hard` / `git clean`。
- 未删除 A～E 既有文件。
- 未覆盖既有未提交修改。
- 未 Commit / Push / Deploy。
- 未修改 package version。
- 未修改 SAVE_VERSION。

## 2. F.1 修改范围

### 2.1 源码

只修改：

```text
src/game/economyConfig.ts
```

修改内容：`normalizeLedger` 的 kind 白名单加入 `exploration`。

未修改：

- 奖励数值。
- 探索奖励。
- Challenge 奖励。
- Boss 奖励。
- 商城事务。
- Save Version。
- Ledger 结构 / 去重模型。
- Challenge / Boss / MIRA / Explore 核心。

### 2.2 测试

新增 5 个 F.1 测试文件，覆盖 P2、跨系统、Boss、刷新、生产构建 Smoke。

## 3. P2-01 修复

### 3.1 问题

探索奖励入账：

```text
kind = exploration
```

`normalizeLedger` 白名单遗漏该类型，刷新后流水被过滤。

### 3.2 是否修复

**已修复。**

### 3.3 修复方式

在既有白名单追加 `exploration`：

```text
level / level-repeat / boss / chapter / difficulty / challenge / exploration
```

只恢复已有探索流水，不改变任何金额、奖励规则或一次性事件语义。

### 3.4 ONE_TIME_KINDS 审查

**未加入 `ONE_TIME_KINDS`。**

原因：

- 探索节点本身唯一。
- `rewardsClaimed` 已防止重复领取。
- `completeExploreNode` / `completeTerminalChallenge` 重复调用返回 `changed=false` / `firstTime=false`。
- 再加一层一次性去重属于重复防护，不符合“已有结构能防止重复时不重复新增机制”。

测试验证：

- 同一探索节点第二次调查：贡献点不增加。
- 同一节点第二次领取：不产生第二条有效探索流水。
- 重复调用终端完成：不重复发奖。

### 3.5 P2 测试

F.1 ledger 测试：`node test/f1_ledger.test.mjs`，**19 / 19 通过**。

| 要求 | 结果 |
|---|---|
| exploration 入账后 normalize 保留 | PASS |
| 非法 kind 被过滤 | PASS |
| Save → Refresh → normalize 后流水保留 | PASS |
| 同一节点重复领取不重复贡献点 | PASS |
| 重复领取不产生第二条有效流水 | PASS |
| 空 ref 仍被丢弃 | PASS |
| SAVE_VERSION 保持 10 | PASS |

真实浏览器验证：

- `f1_cross_system_e2e.mjs` 刷新后读取存档，`rewards.ledger` 中 `exploration` 仍存在。
- Profile“最近成长”真实显示 `exploration` 行。
- 截图 `07-exploration-ledger.png`。
- 生产构建 Smoke 读取同一流水并显示。

## 4. 跨系统流程

### 4.1 Challenge → Player

真实数据：

- 初始 70 XP / Lv1。
- 首通 `tut-1` +40 XP。
- 结果 110 XP / Lv2。
- 容错上限 3。
- 为覆盖失败路径，真实先提交错误代码 1 次；首通结算为 2 星、剩余容错 2/3。
- 结算 `expGained=40`、`expAfter=110`、`toleranceMax=3`、`creditsGained` 来自真实奖励。

全部读取唯一数据源：`completeLevel` / `challengeSession` / `rewards`。

### 4.2 Challenge → MIRA

- `mira:level:tut-1` 首通 +10 XP。
- 同事件重复调用不重复发 XP。
- 成就奖励 `mira:achievement:first_repair` +6 XP，重复事件不重复。
- 首次修复记忆真实解锁。

### 4.3 Challenge → Achievement

- 首次修复：真实解锁。
- 接驳完成：真实解锁。
- 探索者：终端完成训练区域后真实解锁。
- 数据追踪者：隐藏信号归档后真实解锁。
- 危机处理者：Boss 真实危机记忆后由既有重算支持。

### 4.4 Challenge → Explore

真实 E2E：

- 失败提交：节点未完成、贡献点未增加、`failedAttempts` +1、`pendingChallenge` 保留。
- 成功提交：终端节点完成、探索奖励 +10、探索账本新增、MIRA 增加、成就重算。
- 重复通关：玩家 XP 不重复、等级不跳变、探索节点状态不被破坏。
- 退出/失败不清空 pending：符合 F.0 记录的 P3-01 现状，本阶段不主动清理。

### 4.5 Exploration → Growth → Profile

- 信号 +5、遗迹 +8、终端 +10、隐藏 +20。
- 训练区域核心节点完成 → 区域完成。
- 隐藏信号在区域完成后才出现，且只能领取一次。
- 成长总览显示 Lv2 / 110 XP、已完成区域 1、探索节点 3、探索百分比、成就数、MIRA。
- 刷新后等级、经验、隐藏、成就、流水均保留。

### 4.6 Boss → Reward → MIRA → Achievement → Archive

真实 Boss 战执行：

- Phase 1 防御、弱点发现、破解、暴露。
- Phase Transition。
- 未知入侵真实动态危机隔离。
- 后续阶段真实判题。
- Victory Terminal / Settlement。

数据验证：

- Boss 统计仅 1 份 Victory。
- Boss 档案 1 条。
- `grantedBattleIds` 仅 1 个 battleId。
- Boss 奖励账本存在。
- MIRA Boss 战记忆、真实危机记忆与 XP。
- Boss 成就存储可读取。
- 刷新后档案、账本、MIRA 记忆保留。
- 同一 battleId 的奖励/档案/MIRA 在集成测试中重复触发均不重复。

### 4.7 Save / Refresh

- SAVE_VERSION = 10。
- 新存档初始化正常。
- 旧档缺失 explore / mira / achievements / boss / ledger 时 normalize 自愈。
- 异常等级/经验/意识夹取。
- 无效成就 ID 过滤。
- 刷新后 XP、Level、Credits、Ledger、Achievement、Explore、MIRA、Boss Archive 保持。
- P2 修复后探索流水刷新不丢。

## 5. Unit

F.1 新增 Unit：

```text
node test/f1_ledger.test.mjs
19 / 19 通过
```

本阶段执行 Unit / 纯逻辑回归：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 21 | 1,387 | 1,387 | 0 |

包含：

- F.1 Ledger / P2。
- Player Growth。
- MIRA Core。
- Exploration Core。
- Economy。
- Boss 成就/结算/档案/评分/奖励/统计。
- Boss 视觉系统/性能/危机/终端/弱点电影化。
- Boss 阶段/攻击/弱点引擎。
- Combat Arbiter。

## 6. Integration

F.1 新增 Integration：

```text
node test/f1_cross_system_integration.test.mjs
41 / 41 通过
```

覆盖：

- Challenge → Player。
- Challenge → MIRA → Achievement。
- Challenge → Explore 失败/成功/重复。
- Exploration → Growth → Profile → Save。
- Boss → Reward → MIRA → Achievement → Archive。
- P3-02 旧档成就补齐。
- 重复奖励 / 重复档案 / 重复 MIRA 事件。

本阶段执行 Integration 回归：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 19 | 1,386 | 1,386 | 0 |

## 7. E2E

F.1 新增真实浏览器测试：

```text
node test/f1_cross_system_e2e.mjs
42 / 42 通过

node test/f1_boss_e2e.mjs
20 / 20 通过
```

新增 E2E 覆盖：

1. Challenge 首通。
2. Challenge 重复通关。
3. Explore 真实终端挑战。
4. Explore 失败。
5. Explore 成功。
6. Hidden Signal。
7. Boss 完整流程。
8. Refresh Recovery。
9. Reward Idempotency。
10. Mobile Layout 360 / 390 / 430。

本阶段执行 E2E 回归：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 10 | 375 | 375 | 0 |

包含：

- F.1 Cross-System。
- F.1 Boss。
- C · MIRA。
- D · Exploration。
- B.6.8 视觉系统整合。
- B.7 Boss 最终验收。
- Layout。
- Boss Battle。
- A7 全系统。
- Economy。

## 8. Regression

本阶段实际执行，不引用历史数字：

| 类型 | 实际执行 | 通过 | 失败 |
|---|---:|---:|---:|
| Unit / 纯逻辑 | 1,387 | 1,387 | 0 |
| Integration | 1,386 | 1,386 | 0 |
| E2E | 375 | 375 | 0 |
| Build Smoke | 9 | 9 | 0 |
| **合计** | **3,157** | **3,157** | **0** |

## 9. Typecheck

```bash
npm run typecheck
```

结果：**0 errors**。

## 10. Build

```bash
npm run build
```

结果：

- 成功。
- `dist/assets/game.js`：2,143,397 bytes。
- 构建日志：1,939 KB code units。
- 耗时：10.7s。
- P2 修复相比 F.0 的 2,143,371 bytes 增加 26 bytes。

## 11. Smoke

生产构建真实启动：

```bash
node server.mjs
node test/f1_build_smoke.mjs
```

结果：**9 / 9 通过**。

验证：

- dist 生产产物启动。
- 主菜单。
- 玩家档案。
- 探索流水（P2 修复）。
- 数字世界探索。
- MIRA 核心。
- 成就系统。
- Python 知识库。
- Save v10。
- 无未捕获异常。

截图：`12-build-smoke.png`。

## 12. Screenshots

目录：`.tmp/f1-evidence/`

| 文件 | 内容 |
|---|---|
| `01-challenge-success.png` | 真实 Challenge 成功结算 |
| `02-player-growth.png` | 玩家成长总览 |
| `03-mira.png` | MIRA 页面 |
| `04-achievement.png` | 成就页 |
| `05-explore.png` | 数字世界探索 |
| `06-exploration-reward.png` | 探索奖励 / 隐藏信号 |
| `07-exploration-ledger.png` | 刷新后探索流水（P2 修复） |
| `08-boss-victory.png` | Boss Victory 结算 |
| `09-boss-archive.png` | Boss 档案 |
| `10-refresh-recovery.png` | 刷新恢复 |
| `11-mobile.png` | 390px 移动端 |
| `12-build-smoke.png` | 生产构建 Smoke |

全部来自真实运行页面。

## 13. P0 / P1 / P2 / P3

### P0

0。

### P1

0。

### P2

- **P2-01 探索流水刷新丢失：已修复并关闭。**
- 修复后无剩余 P2。

### P3 验证结果

| 编号 | 结果 | 说明 |
|---|---|---|
| P3-01 Pending Challenge | 保留现状 | 失败后 pending 保留以支持重试；不伪造奖励；本阶段不清理 |
| P3-02 旧档成就补齐 | PASS（无需修改） | normalize 不伪造；下一次真实成就重算补齐探索者/数据追踪者 |
| P3-03 终端结算成就列表 | 复现（仅显示） | 探索者已在档案/Toast 解锁，但结算 `newAchievements` 未包含；未改奖励逻辑 |
| P3-04 Error Boundary | 未修改 | 仍无全局错误边界；无 P0/P1，不阻断演示 |
| P3-05 代码分割 | 未修改 | 单包 2.14 MB；留待 F.3 实测与优化 |

## 14. Risks

1. **P3-03 显示不一致**：终端完成后新增的探索成就不会出现在本次结算列表，但档案、Toast 与奖励状态正确。不影响演示闭环。
2. **P3-01 stale pending**：退出终端挑战后 pending 保留；无重复奖励，下一次终端会覆盖。无清理机制。
3. **P3-02 旧档成就延迟**：旧 Explore 存档首次打开可能暂缺新成就，下一次真实事件补齐。
4. **首包体积**：全部页面静态加载，生产包 2.14 MB；F.3 需要实测首屏/切换与移动端后再决定懒加载。
5. **无全局 Error Boundary**：极端渲染异常可能空白；当前任何回归均未触发。
6. **Boss 测试依赖真实计时与弱点流程**：F.1 Boss E2E 已真实通过，但仍属于较慢的浏览器用例。

以上均为 P3，不阻断 F.1 PASS。

## 15. Final Verdict

**PASS**

依据：

- P2-01 已最小修复，并有单元、集成、真实浏览器刷新、生产构建 Smoke 四层验证。
- Challenge / Player / MIRA / Achievement / Explore / Boss / Economy / Profile / Save 真实闭环通过。
- 重复挑战、重复领奖、重复 Boss 档案、重复 MIRA 事件均不重复生效。
- P0 = 0，P1 = 0，剩余 P2 = 0。
- Typecheck / Build / Smoke / 3,157 项回归全部通过。

## 16. Freeze

F.1 冻结。

- 等待人工验收。
- 不自动进入 F.2。
- 不 Commit。
- 不 Push。
- 不 Deploy。
