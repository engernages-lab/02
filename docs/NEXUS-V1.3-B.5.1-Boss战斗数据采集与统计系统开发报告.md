# NEXUS V1.3-B.5.1 · Boss 战斗数据采集与统计系统开发报告

> 阶段：Boss Battle Statistics & Performance Data Collection Engine  
> 范围：仅数据采集、统计、幂等、持久化与 DEV 观测；未实施 B.5.2～B.5.6 的评分、奖励、成就与结算 UI。

---

## 1. 项目信息

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》 |
| 项目版本 | `package.json` v1.1.3 |
| Node / npm | Node v24.22.0 / npm 11.19.1 |
| 浏览器 | 系统 Google Chrome 158.0.8127.37（Playwright headless + 真实 Chromium 内核） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD | `6bf34b3`（开发期间出现并行提交，未回滚、未覆盖） |
| 存档版本 | 保持 **v10**（未升级） |
| 工作区状态 | 脏工作区：含前序 B.1～B.4、并行 Cinematic / 剧情 / 经济改动与未跟踪文件；本阶段未执行 commit |
| 证据目录 | `.tmp/b5-evidence/`（6 张真实浏览器截图） |

并行改动文件（如 `src/components/IntrusionOverlay.tsx`、`src/game/economyConfig.ts`、`src/vite-env.d.ts`、`test/challenge_integration_check.mjs`、`.agents/`、第六章剧情资源等）未被本阶段修改或删除。

---

## 2. 开发前审查

以当前工作区真实代码为准，审查结果如下：

| 审查内容 | 实际位置 | 当前能力 | 本阶段处理 |
|---|---|---|---|
| 战斗开始/结束 | `gameStore.startBossBattle / beginBossBattle / closeCombatForPlayer` | 已有 B.1 运行态与终结清理 | 复用；新增活动统计创建/终结，刷新按 battleId 恢复 |
| 阶段切换 | `bossPhaseEngine`、`bossPhasePlans`、`bossBattleEventBus` | 真实阶段状态机与事件 | 订阅事件 + 阶段快照同步；旧阶段事件拒绝 |
| 攻击/预警 | `bossAttackEngine`、`bossAttackPatterns` | 预警、发起、命中、取消、冷却 | 复用事件；补充 `attack-result.payload.response` |
| 防御/闪避 | `bossAttackEngine.playerDefend / playerDodge` | 真实时间窗判定 | 从真实结算结果映射，不用按钮点击推断 |
| 伤害 | `combatDamage`、`combatEventArbiter` | 统一伤害/护罩结算 | 只读取 `resolution.applied / shield`，不重算 |
| 弱点 | `bossWeaknessEngine`、`bossWeaknessCatalog` | 线索、发现、分析、破解、暴露 | 订阅真实事件；区分发现/破解/暴露/取消 |
| 动态事件 | `eventEngine`、`combatEventArbiter`、`triggerDynamicEvent` | 触发、成功、失败、抢占、清理 | 复用；新增“破解被 P2 抢占只记取消” |
| 代码挑战 | `judge.ts`、`runPython`、`submitBossAttack` | 真实 MicroPython/WASM 判题 | 映射真实 verdict；区分 submitted/judged/passed/failed/runtime/invalid |
| 存档 | `save.ts`、`migrations.ts` | v10 字段级自愈 | 扩展 `progress.bossBattleStats`，不升版本 |
| 原缺陷 | 最终战 4 判题阶段 vs 3 战斗阶段索引误用 | 战斗终结时统计事件访问越界 | 本阶段修复并回归（见第 12 节） |

结论：现有 B.1～B.4 已完成主要业务事件；本阶段采用“观察者订阅 + 必要补充”的方式，未重复实现攻击、伤害、判题或阶段逻辑。

---

## 3. 新增文件

| 文件 | 职责 |
|---|---|
| `src/game/bossBattleStats.ts` | 统计核心：数据结构、事件幂等、增量计数、阶段统计、摘要/终结快照、normalize、历史 50 上限、事件/幂等表上限 |
| `src/components/BossStatsDevPanel.tsx` | DEV 只读统计面板：当前战斗/最近快照、挑战、攻击防御、弱点、动态事件、最近事件、拒绝原因、JSON 查看与导出 |
| `test/boss_battle_stats.test.mjs` | 统计引擎专项单元测试（59 项） |
| `test/boss_battle_stats_integration.test.mjs` | 与 B.1～B.4、combatDamage、Judge、save 的集成测试（34 项） |
| `test/boss_battle_stats_e2e.mjs` | 真实 Chrome + 真实 MicroPython 的端到端测试（45 项） |
| `docs/NEXUS-V1.3-B.5.1-Boss战斗数据采集与统计系统开发报告.md` | 本报告 |

---

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/game/types.ts` | `progress.bossBattleStats?: BossBattleStatsStore` 兼容字段 |
| `src/services/save.ts` | 默认空统计存储；按真实活动战斗 battleId/结果 normalize；终结战斗自动归档；不升 v10 |
| `src/store/gameStore.tsx` | 统计生命周期与真实事件接入：开始、挑战、攻击/防御/闪避、伤害、阶段、弱点、动态事件、死亡、胜利、撤退；事件总线订阅；终结快照；DEV 导出/保障动作；修复阶段索引与死亡统计顺序 |
| `src/game/bossAttackEngine.ts` | 攻击结果事件 payload 增加 `response`（真实防御/闪避结果来源） |
| `src/pages/BossBattlePage.tsx` | Boss 战入口确保统计存在；挂载 `BossStatsDevPanel` |
| `public/boss.css` | `.dev-stats-*` 只读面板样式 |

说明：`src/store/gameStore.tsx`、`src/pages/BossBattlePage.tsx`、`public/boss.css` 等文件同时包含前序阶段改动；本报告只声明 B.5.1 相关增量。

---

## 5. 数据采集体系

### 5.1 战斗基础
- `battleId / bossId / bossName / difficulty / startedAt / endedAt / wallDurationMs`
- `battleStatus`：`active | completed | failed | abandoned | interrupted`
- `result`：`victory | defeat | retreat | interrupted | null`
- `maxPhaseReached / phaseTransitions / phasesCompleted / playerDeathCount`
- `activeDurationMs`：项目无正式暂停系统，固定为 `null`，不伪造活动时长。
- 刷新/离开页面不判负：离开后统计仍为 `active`；刷新按 battleId 恢复。

### 5.2 代码挑战
- `submittedCount / judgedCount / passedCount / failedCount / runtimeErrorCount / invalidCount`
- `successRate`：`passed / judged`；`judged=0` 时为 `null`，不会显示 100%
- `consecutiveSuccess / maxConsecutiveSuccess`
- `failureReasons` 分类；`keyCrackSuccess`
- 数据来源：真实 `runPython` + `judgeRun` verdict；不按按钮点击或 UI 文案推断。

### 5.3 攻击与防御
- 预警、发起、命中、被格挡、被闪避、取消、被弱点中断、被危机中断
- 防御成功/失败、闪避成功/失败、实际受伤、护罩吸收
- 同一攻击以 `attackId + hitIndex/hitKey` 去重；多段伤害不重复累计；取消攻击不计为闪避成功
- 伤害只读取 `combatDamage` 的 `applied / shield`。

### 5.4 阶段
- 每阶段：进入/退出时间、停留时长、实际受伤、攻击次数、挑战成功/失败、弱点发现/破解、结束状态
- 阶段切换与 `bossPhaseEngine` 同步；统计事件归属“战斗阶段”，不是判题阶段索引
- 旧阶段事件按 `PHASE_SCOPED` 类型拒绝，不污染新阶段。

### 5.5 弱点
- 线索、分析、发现、破解提交、破解成功/失败、暴露/恢复、取消
- 暴露持续时间、实际 Boss HP 伤害、攻击中断
- 发现 ≠ 破解，提交 ≠ 成功，暴露 ≠ 伤害；伤害使用真实 Boss HP 结算
- 阶段切换/高优先级抢占导致取消只记 `cancelledCount`，不计玩家破解失败。

### 5.6 动态事件
- 触发次数、按事件定义分类、成功/失败、玩家主动完成、超时、优先级取消、战斗终结清理
- 被中断攻击、事件期间玩家实际受伤、持续时间
- 当前仅接入真实存在的“未知入侵”，未虚构其他事件。

---

## 6. 数据采集边界

统计系统为**只读观察者**：
- 不修改 Boss HP、玩家意识、护罩、阶段、冷却、攻击状态或事件结果
- 不改变 Judge/Runner verdict
- 不发放经验、货币、碎片或奖励
- 不决定胜负
- 不直接写 UI 状态，不反向调用战斗推进接口

数据优先级：
1. 战斗引擎真实结算
2. Judge/Runner 真实返回
3. B.4 仲裁器确认状态
4. gameStore 已提交状态
5. UI 展示状态（不用于核心统计）

统计订阅通过 `bossBattleEventBus` 与 store 已提交结果接入；事件记录失败/数据异常只影响统计完整性，不阻断战斗。

---

## 7. 幂等与去重

- 统计事件主键：`battleId + eventId`
- 同一事件重复提交只累计一次
- 攻击伤害按 `hitKey` 去重
- 挑战结果按战斗内提交序号生成的 `challengeStatId` 去重
- 弱点破解与暴露按真实 attempt/事务 ID 去重
- 每场战斗只生成 1 份最终快照；`finalizeBossBattleStats` 重复调用返回 `already`
- 终结后迟到事件被拒绝并进入 `rejectedEvents`，不修改历史快照
- 刷新不重复创建 `battle-start` 事件（事件 ID 固定为 `battle-start:<battleId>`）
- 去重不依赖时间戳。

---

## 8. 统计计算

- 时长：`wallDurationMs = endedAt - startedAt`，负值/非法时间戳安全归零；`activeDurationMs = null`
- 成功率：仅基于有效判题；无判题返回 `null`
- 攻击：预警、开始、命中分字段统计；取消与中断不混入闪避成功
- 防御：来自真实 `playerResponse` 与攻击结算
- 阶段：使用真实阶段进入/退出事件与 `phaseStats` 增量累计
- 弱点：暴露时长按 `weakness-exposed → weakness-recovered/cancelled` 的时间差；Boss 伤害只累加真实结算
- 动态事件：triggered/failed/timeout/priority-cancelled/battle-end-cleared 分开；系统清理不算玩家成功或失败

最终快照为深拷贝只读结构，包含 `dataQuality`：`complete | partial | invalid`。

---

## 9. 存档与恢复

- 存储位置：`progress.bossBattleStats = { active, history }`
- 存档版本：保持 v10，不升级
- 旧存档缺少字段：默认 `{ active: null, history: [] }`
- 刷新恢复：活动统计按 `active.battleId` 与真实战斗匹配恢复
- 终结战斗：快照进入 history，active 清空
- 历史上限：50 场，超出按最旧清理
- 活动事件日志上限 200，去重 ID 上限 400；清理不破坏增量计数与活动战斗
- 异常存档 normalize：修复计数关系（`passed ≤ judged ≤ submitted` 等）、负数归零、非法时间戳归零、battleId 不匹配丢弃
- 不重置玩家进度、Boss 历史或 B.1～B.4 数据。

---

## 10. DEV 调试面板

`BossStatsDevPanel` 仅 `process.env.NODE_ENV !== 'production'` 且显式开启 DEV 时显示：
- 当前 battleId/Boss/阶段/状态/时长/完整性
- 提交、判题、通过、失败、运行异常、成功率、最长连击
- 预警、发起、命中、防御/闪避成功失败、受伤、护罩
- 弱点线索/发现/分析/破解提交/成功/暴露/伤害
- 动态事件触发/成功/失败/超时/中断攻击
- 最近 12 条事件、被拒绝事件原因、统计 JSON 查看、导出 JSON

边界：
- 生产构建不显示（E2E 验证）
- 只读，不篡改正式统计或奖励
- 不使用 DEV 数据冒充真实成绩；测试/模拟数据与正式统计隔离
- E2E 仅使用 DEV 入口触发真实战斗中的动态事件/抢占，统计仍来自真实事件。

---

## 11. 测试结果

以下均为真实执行命令与结果。

### 11.1 单元 / 集成

| 命令 | 结果 |
|---|---|
| `node test/boss_battle_stats.test.mjs` | **59 / 59 通过** |
| `node test/boss_battle_stats_integration.test.mjs` | **34 / 34 通过** |
| `node test/boss_phase_engine.test.mjs` | 91 / 91 通过 |
| `node test/boss_phase_integration.test.mjs` | 156 / 156 通过 |
| `node test/boss_attack_engine.test.mjs` | 71 / 71 通过 |
| `node test/boss_attack_integration.test.mjs` | 308 / 308 通过 |
| `node test/boss_weakness_engine.test.mjs` | 100 / 100 通过 |
| `node test/boss_weakness_integration.test.mjs` | 108 / 108 通过 |
| `node test/combat_arbiter.test.mjs` | 49 / 49 通过 |
| `node test/combat_arbiter_integration.test.mjs` | 146 / 146 通过 |

覆盖：创建/挑战/判题/运行异常/攻击预警/命中/取消/防御/闪避/伤害/阶段/弱点/动态事件/死亡/胜利/撤退/最终快照/重复 eventId/重复 hitKey/重复 finalize/非法事件/无判题成功率/负数/重复读取一致；以及刷新恢复、50 上限、日志与幂等表截断、旧阶段拒绝、数据边界、终结后迟到事件。

### 11.2 真实浏览器 E2E

`node test/boss_battle_stats_e2e.mjs` → **45 / 45 通过 ✅**

真实 Chrome + 真实 MicroPython/WASM，覆盖：
1. GATE-01 完整战斗、判题失败 + 成功、攻击预警、防御、闪避、真实受伤
2. 阶段推进、弱点发现/破解/暴露
3. 战斗中途刷新：活动统计 battleId 与计数保持
4. 最终击败 Boss：1 份最终快照、complete、事件/幂等表非空
5. 胜利刷新：快照仍 1 份、章节/碎片不重复发放
6. 真实死亡：结果 `defeat / failed`，玩家死亡与受伤统计正确
7. HUD 暂时离开：不判负、统计仍 active；刷新后“放弃本场”：`retreat / abandoned`
8. DEV 面板显示、JSON 导出按钮、生产构建隐藏
9. 未知入侵触发/退出：触发、失败、攻击中断统计
10. 弱点破解进行中被 P2 抢占：记录取消、**不记玩家失败**，抢占事件正常统计

证据截图：
- `.tmp/b5-evidence/01-live-battle.png`
- `.tmp/b5-evidence/02-victory.png`
- `.tmp/b5-evidence/03-dev-stats-panel.png`
- `.tmp/b5-evidence/04-death.png`
- `.tmp/b5-evidence/05-retreat.png`
- `.tmp/b5-evidence/06-weakness-preempted.png`

### 11.3 B.1～B.4 回归

| 命令 | 结果 |
|---|---|
| `node test/boss_phase_e2e.mjs` | 31 / 31 通过 |
| `node test/boss_attack_e2e.mjs` | 29 / 29 通过 |
| `node test/boss_weakness_e2e.mjs` | 25 / 25 通过 |
| `node test/combat_arbiter_e2e.mjs` | 40 / 40 通过 |

### 11.4 全系统回归

| 命令 | 结果 |
|---|---|
| `node test/smoke.mjs` | 冒烟测试全部通过 |
| `node test/acceptance_check.mjs` | 38 / 38 |
| `node test/boss_battle_check.mjs` | 105 / 105 |
| `node test/challenge_integration_check.mjs` | 57 / 57 |
| `node test/chapter_flow_check.mjs` | 133 / 133 |
| `node test/economy_check.mjs` | 44 / 44 |
| `node test/shop_check.mjs` | 63 / 63 |
| `node test/vault_check.mjs` | 55 / 55 |
| `node test/reward_check.mjs` | 37 / 37 |
| `node test/session_check.mjs` | 44 / 44 |
| `node test/layout_e2e.mjs` | 116 / 116 |
| `node test/a7_save_check.mjs` | 95 / 95 |

### 11.5 TypeScript / Build

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | 0 错误 |
| `npm run build` | 成功，`assets/game.js` 约 1497 KB |
| `node test/smoke.mjs` | 通过 |

---

## 12. 发现的问题与修复

| 编号 | 严重程度 | 问题 | 根因 | 修复 | 回归结果 |
|---|---|---|---|---|---|
| B5-01 | **P0** | GATE-01 最终战提交阶段 4 时抛 `TypeError: Cannot read properties of undefined (reading 'phaseId')`，胜利无法结算 | 统计事件使用“判题阶段索引”访问“战斗阶段数组”；GATE-01 为 3 战斗阶段 / 4 判题阶段 | 新增 `statPhaseId`，统一使用当前战斗阶段 phaseId | 完整 E2E 45/45；B.1～B.4 全回归通过 |
| B5-02 | P1 | 玩家被真实攻击打死时最终快照 `playerDeathCount=0` | 攻击死亡路径先 `closeCombatForPlayer` 锁定统计，随后 `startDeath` 的死亡事件被终结态拒绝 | 在攻击/反击死亡分支中、终结前写入 `player-death` 事件（固定 battleId 事件 ID） | 死亡 E2E：defeat/failed、death≥1、damage>0 |
| B5-03 | P1 | 弱点破解被 P2 未知入侵抢占时，统计未记录取消 | 动态事件抢占仲裁器后未映射 `weakness-cancelled` | `triggerDynamicEvent` 检测 `requested.preempted.eventType === 'weakness-crack'`，仅记录取消，不计失败 | 真实浏览器抢占 E2E 通过 |
| B5-04 | P2 | E2E 无法定位 DEV 统计面板标题 | `.panel-title` 存在 `text-transform: uppercase`，`innerText` 为 `BOSS` | 改用 `.dev-stats-panel` DOM 选择器 | E2E 通过 |
| B5-05 | P2 | 刷新/导航时控制台出现资源 404 与 Monaco dispose 提示 | 浏览器刷新销毁 Monaco 与 favicon 资源缺失，与统计无关 | E2E 过滤已知环境噪声，仅断言未捕获 JS 异常 | E2E 无未捕获异常 |
| B5-06 | P2 | 刷新后终结战斗快照未进入历史 | save 仅按 `currentBossId` 查找活动战斗，终结后可能为空 | 优先用 `active.battleId` 反查真实 Boss 运行态 | 集成测试与胜利刷新 E2E 通过 |

除以上问题外，无 P0/P1 遗留。

---

## 13. 性能与稳定性

- 统计采用增量计数，不在每次渲染重算历史事件。
- 事件日志上限 200、幂等 ID 上限 400、历史快照上限 50，避免无限增长。
- 不为每个统计事件创建独立定时器。
- 通过共享事件总线订阅，不阻塞 Boss 主流程。
- 统计写入只更新 `progress.bossBattleStats`，不触发额外战斗状态变更。
- 最终快照使用深拷贝；历史只读。
- 长时间真实 E2E（含阶段推进、刷新、死亡、撤退、抢占、完整胜利）无统计导致的战斗失败或页面异常。
- 未进行数小时挂机 soak；当前上限策略与增量计算已由单元测试验证。

---

## 14. 未完成事项

1. **旧阶段迟到事件的浏览器级注入**：引擎/集成测试已覆盖拒绝逻辑（`stale-phase`），但当前 UI/DEV 面板没有“向新阶段注入旧阶段事件”的入口，未做浏览器级注入测试。
2. **DEV JSON 下载文件内容**：已验证按钮存在与导出逻辑路径；headless 下载落盘内容未单独断言。
3. **50 场历史上限**：由单元测试验证；未在浏览器中连续完成 50 场真实战斗。
4. **浏览器矩阵**：本阶段使用系统 Chrome；未运行 Firefox/WebKit。
5. **人工设备验收**：移动端布局已跑 `layout_e2e` 116/116，但未做真机人工验收。
6. `activeDurationMs` 按设计保持 `null`：项目无正式暂停系统，不伪造活动时长。

以上均不阻塞 B.5.1 数据采集与统计目标。

---

## 15. 最终验收结论

**PASS**

- 本阶段数据采集、统计、幂等、最终快照、存档兼容、DEV 面板与 B.1～B.4 集成均已完成。
- 真实浏览器 E2E 45/45、统计单元 59/59、集成 34/34，B.1～B.4 与全系统回归全部通过。
- TypeScript 0 错误，Build 成功，Smoke 通过。
- 已发现并修复 1 个 P0（最终阶段统计索引导致胜利无法结算）和 2 个 P1（死亡计数、抢占取消），回归通过。
- 当前无 P0/P1 遗留问题，可以进入 **B.5.2 战斗评价算法**。
- 需后续补充的非阻塞项见第 14 节（旧阶段事件浏览器注入、下载内容断言、长时间 soak、浏览器矩阵与真机验收）。
