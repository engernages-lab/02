# NEXUS V1.3-B.4 补充 · 事件优先级与冲突仲裁系统开发报告

> 阶段：NEXUS V1.3-B.4 补充要求 · Event Priority & Conflict Arbitration  
> 完成日期：2026-11-19  
> 结论：**CONDITIONAL PASS**（条件见第 13 节）

---

## 1. 项目信息

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》v1.1.3 |
| Node | v24.22.0 |
| npm | 11.19.1 |
| 浏览器（E2E） | Google Chrome 158.0.8127.37（Playwright，真实 Chromium） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD | `50a377f`（并行 cinematic：第三章背景；本阶段未提交） |
| 存档版本 | **v10（未升级）** |
| 工作区 | B.1~B.4 改动未提交；并行工作文件未覆盖/未删除 |

> 执行期间并行开发者多次提交 cinematic 相关 commit（`c146b61`、`0d25327`、`50a377f` 等），并短暂修改过 `StoryPage.tsx` / `SceneArt.tsx`。本阶段未修改这些文件；并行工作区的瞬态变化曾导致 `smoke` 一次失败，并行提交恢复后 `smoke` 通过。

---

## 2. 开发前审查

- **B.1**：`bossPhaseEngine` 状态机 / 阶段切换 / HP 策略 / 事件总线；`bossPhasePlans` 阶段编排。
- **B.2**：`bossAttackEngine` 攻击状态机 / 预警 / 防御闪避 / 伤害 / 冷却；`bossAttackPatterns` 数据驱动；攻击通过 `bossBattleEventBus` 广播。
- **B.3**：`bossWeaknessEngine` 线索 / 分析 / 真实破解 / 暴露 / 恢复；弱点覆盖层通过 `setBossCombatPaused` 暂停攻击。
- **动态事件**：`eventEngine` + `unknownIntrusion` + 全局 `IntrusionOverlay`；`dynamicEvent` 持久化在 `progress`。
- **Judge / Runner**：`pythonRunner` + `judge.ts`；B.3 已接入真实破解。
- **存档**：`save.ts` 字段级 normalize，v10；已有 `battles` / `bossBattles` / `bossAttacks` / `bossWeaknesses`。
- **伤害来源**：Boss 主动攻击（tick）、Boss 反击（判题 miss）、防御失败（环境事件）、弱点效果（Boss HP 结转）。
- **现存冲突**：动态事件 `IntrusionOverlay` 出现时，攻击 tick 未被 `eventLocked` 覆盖；弱点破解覆盖层与全局入侵覆盖层可能叠加；终结流程未清空动态事件。

---

## 3. 新增文件

| 文件 | 用途 |
|---|---|
| `src/game/combatEventArbiter.ts` | 统一优先级（P0~P6）、独占锁、队列、抢占、去重、过期、阶段失效、终结清理、事件记录、存档自愈 |
| `src/game/combatDamage.ts` | 统一玩家伤害结算：护罩减半、意识下限、死亡/终结阻断 |
| `src/components/CombatArbiterDevPanel.tsx` | 仅 DEV：触发未知入侵、恢复/清理动态事件、推进仲裁器、模拟死亡/胜利、查看锁/队列/记录 |
| `test/combat_arbiter.test.mjs` | 仲裁器专项（49 断言） |
| `test/combat_arbiter_integration.test.mjs` | 攻击/动态/弱点/阶段/终结/存档/统一伤害集成（146 断言） |
| `test/combat_arbiter_e2e.mjs` | 真实 Chrome + 真实游戏流程端到端（40 断言） |

---

## 4. 修改文件（B.4 相关）

| 文件 | 修改内容 |
|---|---|
| `src/game/types.ts` | `Progress` 增加 `combatArbiter` |
| `src/services/save.ts` | 仲裁状态自愈：只保留进行中 Boss 战；刷新清空瞬态锁/队列，保留记录与幂等 ID；终结战斗清理 |
| `src/store/gameStore.tsx` | 攻击 P5 锁、弱点破解 P3 锁、动态事件 P2 锁、阶段 P1 锁、死亡/胜利/撤退 P0 清理；动态事件与阶段冲突；统一伤害接入攻击/反击/防御；仲裁 tick；DEV 终结/冷却 |
| `src/pages/BossBattlePage.tsx` | 动态事件期间锁定战斗交互；HUD 仲裁优先级 chip；仲裁 tick 接入页面单一定时器；DEV 仲裁面板 |
| `public/boss.css` | 仲裁 chip / DEV 面板 / 事件记录样式 |

---

## 5. 事件优先级体系

| 优先级 | 类别 | 示例 | 实现 |
|---|---|---|---|
| P0 | 终结事件 | 死亡 / 胜利 / 失败 / 撤退 / 重生 | `COMBAT_PRIORITY.TERMINAL`；`closeCombatArbiter` 清空全部锁/队列 |
| P1 | 战斗状态 | 阶段切换 / 阶段击破 / 中断 / 恢复 | `phase-transition` 独占 P1；阶段完成释放并提升队列 |
| P2 | 重大危机 | 未知入侵 / 系统崩溃 / 核心暴走 | `dynamic-crisis` 独占 P2；可中断 P5 攻击 |
| P3 | 弱点 | 发现 / 破解 / 暴露 / 恢复 | 破解覆盖层持有 P3 独占；可中断 P5，不能抢占 P2 |
| P4 | 动态战斗 | 区域异常 / 战斗干扰 / 环境变化 | 预留，伤害来源可标记 |
| P5 | Boss 攻击 | 预警 / 单体 / 连续 / 范围 / 特殊 | 攻击 live 期间独占 P5；预警/攻击/结算持锁 |
| P6 | 普通系统 | 冷却 / 倒计时 / 提示 | 不入独占锁；队列最低优先级 |

数值越小优先级越高。所有事件记录均带 `priority`。

---

## 6. 冲突规则与实现

| # | 规则 | 实现 |
|---|---|---|
| 1 | 玩家死亡优先于所有事件 | `startDeath` / `closeCombatForPlayer('death')` 清空动态事件、攻击、弱点、仲裁锁/队列 |
| 2 | Boss 胜利优先于所有未完成事件 | 胜利提交 / DEV 胜利调用 P0 终结清理 |
| 3 | 阶段切换取消旧阶段攻击与弱点 | P1 锁 + `syncAttackPhase` + `syncWeaknessPhase` + `invalidatePhase` |
| 4 | 重大动态事件中断普通 Boss 攻击 | P2 请求抢占 P5；攻击 `cancelAttack`；预警消失 |
| 5 | 弱点破解成功中断当前攻击 | P3 覆盖层锁抢占 P5；`applyAttackInterference` 取消/禁用模式 |
| 6 | Boss 攻击不得覆盖重大动态事件 | `eventBlocked` / `higherLock` 阻止攻击 tick；P2 主动取消 |
| 7 | 玩家撤退取消全部战斗事件 | `abandonBossBattle` + `closeCombatForPlayer('retreat')` |
| 8 | 玩家死亡清空攻击/动态/弱点计时 | `startDeath` 清空 dynamicEvent + 仲裁 close；攻击/弱点状态取消 |
| 9 | 同一时间不得多个独占事件 | 单一 `active` 锁；同/低优先级进入队列 |
| 10 | UI 覆盖层不阻止必要操作 | 动态事件期间仅保留入侵覆盖层；弱点覆盖层监听仲裁优先级自动关闭；高优先级时禁用提交 |
| 11 | 低优先级不得抢占高优先级 | `requestExclusive` 按数值比较，低优先级入队 |
| 12 | 阶段完成后重新校验事件阶段 | `invalidatePhase` + 事件 `phaseId` 校验 |
| 13 | 旧阶段事件不得在新阶段执行 | 阶段切换/释放时取消旧阶段锁与队列，写入幂等表 |
| 14 | 所有伤害经统一入口 | `resolvePlayerDamage`（攻击/反击/防御/环境），Boss HP 仍走 B.1/B.3 统一 `applyDamage` |
| 15 | 所有事件结算支持幂等 | `settledEventIds` + 攻击 hitKey + 弱点状态机 + 仲裁记录 |

---

## 7. 仲裁器架构

`CombatArbiterState`：

- `battleId / bossId / phaseId`
- `active: CombatLock | null`（唯一独占锁）
- `queue: CombatEvent[]`（按 priority → createdAt → sequence 排序，最大 32）
- `records: CombatEventRecord[]`（最多 60）
- `settledEventIds: string[]`（最多 120，防止重复伤害/奖励/状态变更）
- `sequence / updatedAt`

核心函数：

- `enqueue`：去重、过期丢弃、阶段校验、队列上限与溢出记录。
- `requestExclusive`：无锁获取；高优先级拒绝并入队；同级入队；低优先级抢占（记录 `interrupted`，写入幂等表）。
- `releaseExclusive`：释放锁并提升最高优先级等待事件（返回 `promoted` 由 store 执行）。
- `settleEvent` / `recordCombatEvent`：幂等结算与直接记录。
- `expireCombatEvents`：活动锁/队列过期清理。
- `invalidatePhase`：旧阶段锁/队列取消，更新阶段。
- `closeCombatArbiter`：P0 终结清空全部并记录。
- `normalizeCombatArbiter`：刷新只保留记录/幂等 ID，不恢复瞬态锁。

事件字段：`eventId`、`battleId`、`bossId`、`phaseId`、`eventType`、`priority`、`createdAt`、`expiresAt`、`status`、`interruptible`、`conflictGroup`、`payload`、`sequence`。

---

## 8. 中断与恢复策略

| 事件 | 中断 | 恢复/清理 |
|---|---|---|
| Boss 攻击预警 | P2/P1/P3 抢占 → `cancelAttack` | 下次重新调度，不补发已取消伤害 |
| 连续攻击 | 取消剩余段（攻击状态 `cancelled`） | 冷却/间隔后重新选择 |
| 弱点分析 | 刷新中国 normalize → hinted/discovered | 线索保留，不重复奖励 |
| 破解中 | 刷新 → 失败恢复（尝试次数保留） | 阶段切换 → cancelled，不应用旧阶段效果 |
| 弱点暴露 | 阶段切换 → recovered/cancelled | 刷新保留剩余时间；终结清理 |
| 重大动态事件 | P1 抢占 → cancelled/recovered | 刷新沿用 eventEngine 状态；P2 锁由仲裁 tick 重新获取 |
| 阶段切换 | P0 终结抢占 | 完成后释放 P1，提升队列 P2 |
| 普通事件 | 过期/队列溢出 | 记录 expired/cancelled，不执行 |

---

## 9. 统一伤害入口

`resolvePlayerDamage(consciousness, barrierLayers, amount, opts)`：

- 伤害 ≥0；护罩存在时 `ceil(amount/2)` 并消耗 1 层；意识下限 0。
- `blockedReason`（终结/死亡）时完全不结算、不消耗护罩。
- Boss 主动攻击：每个 `hitKey` 记录仲裁伤害事件，重复 tick 不会重复扣意识。
- Boss 反击：`counter:<battleId>:<failures>@<time>` 幂等 ID。
- 防御失败环境伤害：`defense:<battleId>:<levelId>@<time>`。
- Boss HP 伤害仍统一走 B.1/B.3 的 `applyDamage` 与弱点结转，不在 UI 修改。

---

## 10. 存档

新增 `progress.combatArbiter`：

- 只保留进行中的 Boss 战；终结/无战斗 → 清理。
- 刷新：活动锁与队列（瞬态）清空；`records` / `settledEventIds` 保留，避免重复伤害/奖励。
- 阶段/战斗 ID 对齐；不匹配 → 新仲裁状态。
- 旧存档无字段 → 正常运行并自动创建。
- 存档版本保持 **v10**。

---

## 11. UI / DEV

- HUD 新增 `仲裁 Pn` chip（仅活动锁时显示）。
- 动态事件期间：代码提交/运行禁用、攻击预警被取消、`arena-lock` 提示。
- 弱点破解覆盖层监听仲裁优先级，P2/P1 抢占时自动关闭；只保留入侵覆盖层。
- DEV 仲裁面板：触发未知入侵、恢复/清理动态事件、重置动态事件冷却、推进仲裁器、模拟 P0 死亡、模拟 P0 胜利、查看活动锁/队列/最后 12 条记录（类型/优先级/状态/原因）。
- 生产构建中 DEV 面板不可见；E2E 已校验。

---

## 12. 测试

所有命令均真实执行。

| 测试 | 命令 | 结果 | 断言 |
|---|---|---|---|
| 仲裁器专项 | `node test/combat_arbiter.test.mjs` | PASS | 49 / 49 |
| 仲裁集成 | `node test/combat_arbiter_integration.test.mjs` | PASS | 146 / 146 |
| 仲裁真实浏览器 E2E | `node test/combat_arbiter_e2e.mjs` | PASS | 40 / 40 |
| B.3 弱点引擎/集成/E2E/稳定性 | 对应命令 | PASS | 100、108、25、3 |
| B.2 攻击引擎/集成/E2E | 对应命令 | PASS | 71、308、29 |
| B.1 多阶段引擎/集成/E2E | 对应命令 | PASS | 91、156、31 |
| 原 Boss | `boss_battle_check` / `boss_battle_e2e` | PASS | 105、24 |
| Challenge | `challenge_engine_check` / `challenge_integration_check` / `challenge_solutions_real` | PASS | 66、57、21 |
| 存档 / 联调 | `a7_save_check` / `a7_integration_check` | PASS | 95、33 |
| A7 E2E | `a7_e2e` | PASS | 51 |
| A7.1/7.2/7.3 | 对应命令 | PASS | 24、20、42 |
| 低端设备 | `a7_1_lowend_sim` | PASS | 9 |
| 章节流程 | `chapter_flow_check` | PASS | 133 |
| 第 3~6 章 | `chapter3~6_check` | PASS | 各 31 |
| 章节门禁 | `chapter_gate_e2e` | PASS | 27 |
| 经济/商店 | check + e2e | PASS | 44/19、63/45 |
| Vault / 难度 | check + e2e | PASS | 55/28、669/36 |
| 剧情 | `story_flow_e2e` | PASS | 46 |
| 布局/移动端 | `layout_e2e` | PASS | 116 |
| 其余 E2E | draft/identity/journal/reward/settlement/ending/voice | PASS | 39/30/11/18/46/17/16 |
| 冒烟 | `node test/smoke.mjs` | PASS | 全部通过 |

> 说明：批量运行部分 E2E 时曾出现固定端口被上一测试占用（`EADDRINUSE` / Vite strictPort），单独重跑均通过；B.1/B.2 E2E 已改为随机端口以避免并行测试冲突。并行工作区瞬态改动 `StoryPage` 曾导致一次 `smoke` 失败，并行提交恢复后通过，与本阶段代码无关。

---

## 13. TypeScript / Build

- `npm run typecheck`：**通过，0 错误**
- `npm run build`：**成功**
- 产物：`dist/assets/game.js` ≈ **1402 KB**（含并行 cinematic 美术资源）
- Rollup 仅常规体积提示，无功能警告。

---

## 14. 真实浏览器 E2E

- 浏览器：Google Chrome 158.0.8127.37（Playwright，真实 Chromium）
- 命令：`node test/combat_arbiter_e2e.mjs`（40/40）
- 流程：
  1. **刷新恢复**（静态生产构建，真实存档）：激活的未知入侵 + 仲裁记录 → 刷新后覆盖层恢复；活动锁清空、幂等记录保留；意识/奖励无重复；生产无 DEV 面板。
  2. **攻击 vs 动态事件**（Vite dev）：Boss 预警持有 P5 → 触发未知入侵 → P2 抢占，预警消失；记录 `boss-attack interrupted`；危机期间意识稳定。
  3. **阶段 vs 动态事件**：阶段切换 P1 锁 → 触发入侵进入队列 → 阶段完成释放 P1，P2 按优先级执行；覆盖层只出现入侵一个。
  4. **胜利 P0**：动态事件进行中模拟胜利 → 覆盖层/预警清除、动态事件清空、锁/队列清空、无奖励。
  5. **死亡 P0**：动态事件进行中模拟死亡 → 重生覆盖层出现、入侵/预警清除、意识归零、仲裁清空、无后续伤害。
- 截图：`.tmp/b4-evidence/`
  - `01-refresh-recovery.png`、`02-attack-vs-crisis.png`、`03-phase-queued-crisis.png`、`04-victory-stop.png`、`05-death-stop.png`
- 人工目视：已查看 `02` / `03`，确认攻击预警被 P2 中断、阶段队列危机在阶段完成后出现，覆盖层无叠加。
- 页面无未捕获异常/业务控制台错误。

---

## 15. 问题与修复

| 编号 | 级别 | 问题 | 原因 | 修复 | 回归 |
|---|---|---|---|---|---|
| B4-01 | P1 | 阶段 P1 锁在阶段完成后不释放，队列 P2 不执行 | P1 锁使用旧阶段 `currentPhaseIndex`（引擎在 transition 完成前不推进），与完成后阶段不匹配，normalize 清空锁 | 使用 `transition.toIndex` 作为新阶段；`readCombatArbiter` 在 transition 期间使用目标阶段 | 仲裁 E2E 40/40、B.1 31/31 |
| B4-02 | P1 | 活动锁/队列每 tick 被清空 | `readCombatArbiter` 每 tick 调 normalize，normalize 清空瞬态锁 | 进行中战斗读取原始状态；normalize 仅用于加载存档/阶段不匹配 | 仲裁 49/146、B.2/B.3 E2E |
| B4-03 | P1 | 阶段切换期间触发的动态事件被拒绝而非排队 | 读取仲裁使用旧阶段，事件 phaseId 校验失败 | transition 期间统一使用目标阶段；队列保存 P2 | 仲裁 E2E |
| B4-04 | P2 | 连续测试第二次入侵被 60s 冷却阻止 | unknown-intrusion 冷却 | DEV 增加“重置动态事件冷却”；E2E 使用 | E2E 40/40 |
| B4-05 | P2 | 入侵覆盖层与弱点破解覆盖层可能叠加 | 两个 UI 互不感知 | 破解面板监听仲裁优先级，P2/P1 抢占时自动关闭；动态期间禁用提交 | B.3 E2E 25/25、仲裁 E2E |
| B4-06 | P2 | 死亡/胜利未清空动态事件与仲裁 | 旧终结流程只处理攻击/弱点 | `closeCombatForPlayer` 统一清空 dynamicEvent/锁/队列并记录 P0 | 仲裁 E2E |
| B4-07 | P2 | 护罩可能被攻击引擎与统一伤害重复处理 | B.2 在攻击引擎内已减半 | 攻击引擎只产生基础伤害；护罩统一在 `resolvePlayerDamage` 消耗 | B.2 E2E 29/29 |
| B4-08 | P3 | 批量 E2E 固定端口冲突 | 上一测试 Vite/jsdom 端口未释放 | B.1/B.2 E2E 随机端口；单独重跑确认 | 回归 |
| B4-09 | — | `smoke` 一次失败在序章 | 并行未提交 `StoryPage.tsx` 临时改为第三章；并行提交恢复后通过 | 未修改并行文件 | `smoke` 通过 |

未发现 P0 遗留问题。

---

## 16. 未完成事项

1. B.5 战斗评价、B.6 全面视觉升级**未开发**。
2. 真实移动设备/平板触控与性能验收未执行；E2E 仅为桌面 Chrome。
3. 现有动态事件只有未知入侵一种；其他 P2/P4 事件类型仅有仲裁接口，未新增具体事件内容。
4. 覆盖层冲突 E2E 覆盖“攻击预警 vs 入侵”“阶段切换 vs 入侵”；“弱点破解覆盖层 vs 入侵”由仲裁优先级/组件监听保证，未做专门 E2E。
5. 未做小时级长时间挂机；已完成 10 次 Boss 页面进出稳定性测试。
6. 本阶段未提交 Git；并行 cinematic 提交不属于本阶段。

---

## 17. 最终验收

### CONDITIONAL PASS

理由：

- 统一优先级 P0~P6、独占锁、队列、抢占、去重、过期、阶段失效、终结清理、幂等、存档自愈全部完成。
- 攻击 P5、弱点 P3、动态事件 P2、阶段 P1、终结 P0 已实际接入并可在真实浏览器中验证。
- 统一伤害入口覆盖 Boss 攻击、反击、环境伤害；护罩/意识下限/死亡阻断一致。
- 刷新不重复伤害/奖励；死亡/胜利/撤退停止全部战斗事件。
- TypeScript 0 错误，Build 成功；B.1/B.2/B.3 与全系统回归通过（含 smoke）。
- 无 P0/P1 遗留问题。

条件项（满足后可转为 PASS）：

1. 真实移动设备/平板上的覆盖层互斥、仲裁提示与触控验收。
2. 桌面端非 headless 的完整人工交互走查。
3. 若后续新增第二种动态事件，需要补充对应 P2/P4 冲突 E2E。
4. 弱点破解覆盖层与动态危机的专门 E2E（当前由仲裁单测与组件逻辑覆盖）。

---

## 附：证据位置

- 截图：`.tmp/b4-evidence/`
- 仲裁专项：`test/combat_arbiter.test.mjs`、`test/combat_arbiter_integration.test.mjs`
- 浏览器 E2E：`test/combat_arbiter_e2e.mjs`
- 本报告：`docs/NEXUS-V1.3-B.4-事件优先级与冲突仲裁系统开发报告.md`
