# NEXUS V1.3-B.3 · Boss 弱点机制与代码破解系统开发报告

> 阶段：NEXUS V1.3-B.3 Boss Weakness & Code Crack System  
> 完成日期：2026-11-19  
> 结论：**CONDITIONAL PASS**（条件见第 13 节）

---

## 1. 项目信息

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》v1.1.3 |
| Node | v24.22.0 |
| npm | 11.19.1 |
| 浏览器（E2E） | Google Chrome 158.0.8127.37（Playwright 驱动，真实 Chromium 内核） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD | `c146b61`（并行提交：cinematic 滚动修复；本阶段未提交） |
| 存档版本 | **v10（保持不变，未升级）** |
| 工作区 | B.1/B.2/B.3 改动未提交；并行工作文件未覆盖、未删除 |

> 执行期间并行开发者提交了多个 cinematic 相关 commit（`3c0731f`、`da0d47c`、`c146b61`）。本阶段所有构建与测试均基于当前工作区，未修改这些提交涉及的文件。

---

## 2. 开发前审查

### 2.1 Git 状态

- 分支：`feature/v1.2-a-experience-polish`
- 本阶段开始 HEAD：`3c0731f`，执行期间并行 HEAD 前进到 `c146b61`
- 本阶段未切换分支、未提交、未回滚；B.1/B.2 修改仍在工作区
- 并行修改（`IntrusionOverlay.tsx`、`economyConfig.ts`、`challenge_integration_check.mjs` 等）保持原样

### 2.2 B.1 多阶段系统

- `bossPhaseEngine.ts`：7 状态战斗状态机、阶段切换、HP 策略、战斗记录、事件总线、自愈
- `bossPhasePlans.ts`：GATE-01 三阶段、K-0 两阶段、其余四阶段
- 玩家 HP = `player.consciousness`；死亡/复活沿用既有流程
- 存档：`bossBattles` / `bossBattleHistory` / `bossPhaseProgress`

### 2.3 B.2 攻击系统

- `bossAttackEngine.ts`：攻击状态机、预警、防御/闪避窗口、伤害、冷却、阶段同步、自愈
- `bossAttackPatterns.ts`：数据驱动攻击模式（GATE-01 分阶段 + 通用模式）
- 事件复用 `bossBattleEventBus`
- 存档：`bossAttacks`

### 2.4 Judge / Runner / Challenge

- `services/pythonRunner.ts`：真实 MicroPython/WASM
- `services/judge.ts`：`buildHarness` / `combineWithHarness` / `judgeRun` / `checkUserCode`
- `challengeEngine.ts` / `challengeSession.ts`：挑战状态与结算（弱点破解复用同一真实判题链路，不新建伪判题）

### 2.5 存档

- `save.ts`：字段级 normalize；`CURRENT_SAVE_VERSION = 10`；B.1/B.2 字段已有自愈逻辑

**结论**：B.3 新增弱点引擎与目录，接入 B.1 阶段、B.2 攻击、真实 Judge/Runner、事件总线与存档自愈，不改写原系统。

---

## 3. 新增文件

| 文件 | 用途 |
|---|---|
| `src/game/bossWeaknessEngine.ts` | 弱点状态机、线索解锁、分析发现、真实破解尝试、暴露/恢复、阶段同步、结转伤害、自愈、事件 |
| `src/game/bossWeaknessCatalog.ts` | GATE-01 三阶段弱点 + 其余 Boss 通用弱点（含真实 Python 挑战与判题） |
| `src/components/BossWeaknessPanel.tsx` | 弱点面板、线索列表、分析入口、破解覆盖层（复用 `CodeEditor`）、状态/倒计时 |
| `src/components/BossWeaknessDevPanel.tsx` | 仅 DEV 可见的弱点测试面板（虚拟时钟、内存态） |
| `test/boss_weakness_engine.test.mjs` | 状态机/线索/发现/破解/暴露/阶段/自愈专项（100 断言） |
| `test/boss_weakness_integration.test.mjs` | 真实 Python 破解 + B.1 结转 + B.2 干扰 + 存档集成（108 断言） |
| `test/boss_weakness_e2e.mjs` | Playwright + 真实 Chrome + 真实 MicroPython 端到端（25 断言） |
| `test/boss_weakness_stability.mjs` | Boss 页面进出 10 次稳定性（3 断言） |

---

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/game/bossPhaseEngine.ts` | 扩展 `BOSS_WEAKNESS_*` 事件；`BossBattleEvent` 增加 `weaknessId` |
| `src/game/bossAttackEngine.ts` | 增加 `disabledPatterns`（弱点禁用模式）、`cooldownMultiplier`、`applyAttackInterference`；预警事件携带 `attackType`；阶段同步清理禁用 |
| `src/game/types.ts` | `Progress` 增加 `bossWeaknesses?: Record<bossId, BossWeaknessRunState>` |
| `src/services/save.ts` | 弱点状态自愈：仅保留进行中战斗；battleId/阶段不匹配重建；破解中刷新按失败恢复；暴露按剩余时间恢复；终结战斗清理 |
| `src/store/gameStore.tsx` | 新增 `bossWeaknessStateOf` / `tickBossWeakness` / `analyzeBossWeakness` / `submitWeaknessCrack` / `setBossCombatPaused`；线索观察、真实判题、暴露伤害倍率与阶段结转、攻击干扰、死亡/撤退/胜利清理、重生重置 |
| `src/pages/BossBattlePage.tsx` | 弱点面板、暴露演出、弱点事件日志、弱点倒计时调度、DEV 面板挂载 |
| `public/boss.css` | 弱点面板、线索列表、破解覆盖层、暴露横幅、DEV 面板、移动端适配 |

---

## 5. Weakness Engine

### 5.1 状态机

`hidden → hinted → analyzing → discovered → exploiting → exposed → recovered → discovered`  
异常/限制：`locked`（尝试次数耗尽）、`recovered`（暴露结束冷却）、阶段切换取消暴露/破解。

- 线索来源：B.2 攻击预警/命中/防御/闪避、B.1 阶段切换、挑战完成。
- 线索按 `clueId` 去重；只匹配当前阶段弱点，不泄露其他阶段。
- 线索达到 `requiredClues` 后仍需玩家启动 **analysis**；分析有真实时长（2.5s），到期才 `discovered`，不能点击直接解锁。
- 破解尝试在提交前 +1；刷新不会退还；达到 `maxAttempts` 后 `locked`，到期自动解锁。
- 暴露结束 → `recovered` → 冷却结束 → 可再次破解；同一 `exploiting` 状态只能结算一次。

### 5.2 数据结构

`BossWeaknessDefinition`：`weaknessId`、`bossId`、`phaseId`、`phaseIndex`、名称/描述、类型、线索、所需线索、分析时长、真实挑战（初始代码/参考/判题/提示）、暴露时长、伤害倍率、攻击冷却倍率、是否中断攻击、禁用攻击模式、效果说明、恢复规则、最大尝试次数。

`BossWeaknessRunState`：battleId、bossId、phaseId/phaseIndex、activeWeaknessId、各弱点 entry（状态、已获线索、分析时间、尝试/成功次数、暴露时间、冷却、封锁、最后结果）、`pendingCarryDamage`。

### 5.3 真实破解

- 破解入口只在 `discovered` / `recovered` 开放。
- `submitWeaknessCrack` 使用 `buildHarness + combineWithHarness + runPython + judgeRun`，与 Boss/挑战共用真实判题链路。
- 代码安全检查在计数前执行；判题失败/超时/引擎错误都记录失败，不扣货币、不直接导致死亡。
- 成功通过事务式提交：`completeWeaknessCrack` 仅接受 `exploiting`，重复成功被拒绝。

### 5.4 暴露效果

GATE-01 配置：

| 阶段 | 弱点 | 伤害倍率 | 攻击干扰 | 禁用模式 |
|---|---|---|---|---|
| 1 能源封锁 | 能源边界校验旁路（logic） | ×1.5 | 中断当前攻击 + 冷却 ×1.3 | 过载蓄能 |
| 2 防御协议 | 协议重复验证缺口（protocol） | ×1.4 | 中断 + 冷却 ×1.35 | 协议锁定 |
| 3 核心暴走 | 核心时间窗口错位（timing） | ×1.6 | 中断 + 冷却 ×1.5 | 暴走连击 |

伤害实现：

- 非击破提交：按倍率提升本阶段伤害，但钳制在当前阶段下界之上，避免提前触发阶段切换导致挑战错位。
- 击破提交：额外伤害结转到下一战斗阶段（安全下限保护），例如阶段 1 普通 75 HP → 弱点结转后阶段 2 起始 **62 HP**；实测阶段 2 由 62 击破后结转 → 阶段 3 起始 45 HP。
- 攻击干扰：暴露时中断当前攻击；`disabledPatterns` 在暴露期间过滤模式选择；攻击冷却按倍率延长。
- 弱点破解覆盖层打开时暂停 Boss 自动攻击，避免预警被覆盖层遮挡；关闭后 2 秒恢复。

### 5.5 幂等与自愈

- 线索去重；分析/破解/暴露/恢复都有状态门槛。
- `resolved` 以状态机为准，重复 `completeWeaknessCrack` 不重复成功/效果。
- 刷新：分析中 → hinted/discovered（按线索与到期时间）；破解中 → 失败恢复（尝试保留）；暴露 → 保留剩余时间或 recovered；终结战斗 → 清理。
- battleId / Boss / 阶段不匹配 → 新战斗重建，不会把旧阶段效果带入新阶段。

---

## 6. 实际接入

- 接入 Boss：**GATE-01「数据港守卫」**（第 1 章主线）。
- 玩家流程：
  1. 正常进入 Boss 战；
  2. 观察攻击预警 / 防御 / 闪避，获得阶段 1 线索；
  3. 线索达到 2 条后点击「分析弱点」，等待 2.5 秒真实分析；
  4. 弱点发现后打开破解覆盖层，使用同一 `CodeEditor` 编写 Python；
  5. 错误代码由真实 Judge 判失败；正确代码判成功；
  6. 弱点暴露：伤害倍率、攻击中断、禁用模式、冷却延长立即生效；
  7. 击破阶段时额外伤害结转到下一阶段；
  8. 暴露结束自动恢复；阶段切换时旧弱点失效、新阶段弱点加载；
  9. 刷新不重复破解/伤害；战斗结束清理弱点状态。
- 挑战内容基于现有代码修复玩法（边界比较、and/or、时间窗口），全部为真实 Python 判题。

---

## 7. UI

- 战斗页左栏新增 `BOSS WEAKNESS` 面板：状态、类型、线索数量、逐条线索（来源 + 文本）、未解锁占位、分析按钮、破解入口、暴露剩余时间与效果。
- 线索列表可滚动，不遮挡代码编辑器。
- 破解覆盖层复用 `CodeEditor`，显示目标/故障/尝试次数/真实 Judge 标记、判题结果。
- 竞技场新增 `WEAKNESS EXPOSED` 横幅：弱点名、伤害/冷却倍率、禁用攻击数、剩余秒数；位于左下，不遮挡顶部攻击预警。
- 事件日志记录线索解锁、发现、破解成功/失败、暴露、恢复、阶段切换取消。
- 移动端：面板单栏、线索限高滚动、破解覆盖层 96vw/92vh、暴露横幅全宽、无横向溢出。
- DEV 弱点点板：Boss/难度/阶段/弱点选择、注入线索、模拟分析、开始破解、失败/成功、推进时间、攻击中断、阶段切换、刷新恢复、重置；全部内存态。

---

## 8. 存档

新增 `progress.bossWeaknesses`：

- 仅保留仍有进行中战斗的 Boss。
- 破解中刷新 → 计为一次失败（尝试次数保留），不重复成功/奖励。
- 暴露中刷新 → 保留剩余时间；到期 → recovered。
- 分析中刷新 → 根据线索与时间安全退回 hinted 或推进 discovered。
- 终结战斗 / 撤退 / 死亡 → 状态关闭或移除。
- 旧存档缺失 → 自动补 `{}`；`bossBattles` / `bossAttacks` / 章节 / 意识 / 经济 / 奖励均保持。
- 存档版本保持 **v10**。

---

## 9. 测试

所有命令均在项目根目录真实执行。

| 测试 | 命令 | 结果 | 断言 |
|---|---|---|---|
| 弱点引擎 | `node test/boss_weakness_engine.test.mjs` | PASS | 100 / 100 |
| 弱点集成（真实 Python） | `node test/boss_weakness_integration.test.mjs` | PASS | 108 / 108 |
| 弱点真实浏览器 E2E | `node test/boss_weakness_e2e.mjs` | PASS | 25 / 25 |
| 10 次进出稳定性 | `node test/boss_weakness_stability.mjs` | PASS | 3 / 3 |
| B.2 攻击引擎 | `node test/boss_attack_engine.test.mjs` | PASS | 71 / 71 |
| B.2 攻击集成 | `node test/boss_attack_integration.test.mjs` | PASS | 308 / 308 |
| B.2 浏览器 E2E | `node test/boss_attack_e2e.mjs` | PASS | 29 / 29 |
| B.1 多阶段引擎 | `node test/boss_phase_engine.test.mjs` | PASS | 91 / 91 |
| B.1 真实 Python 集成 | `node test/boss_phase_integration.test.mjs` | PASS | 156 / 156 |
| B.1 浏览器 E2E | `node test/boss_phase_e2e.mjs` | PASS | 31 / 31 |
| 原 Boss 数据/判题 | `node test/boss_battle_check.mjs` | PASS | 105 / 105 |
| 原 Boss 战 jsdom E2E | `node test/boss_battle_e2e.mjs` | PASS | 24 / 24 |
| 挑战引擎 | `node test/challenge_engine_check.mjs` | PASS | 66 / 66 |
| 挑战集成 | `node test/challenge_integration_check.mjs` | PASS | 57 / 57 |
| 挑战真实解答 | `node test/challenge_solutions_real.mjs` | PASS | 21 / 21 |
| A7 存档 / 联调 | `node test/a7_save_check.mjs` / `a7_integration_check.mjs` | PASS | 95 / 95、33 / 33 |
| A7 E2E | `node test/a7_e2e.mjs` | PASS | 51 / 51 |
| A7.1 / A7.2 / A7.3 | 对应命令 | PASS | 24 / 24、20 / 20、42 / 42 |
| 章节流程 | `node test/chapter_flow_check.mjs` | PASS | 133 / 133 |
| 第 3~6 章 | `chapter3~6_check.mjs` | PASS | 各 31 / 31 |
| 章节门禁 | `node test/chapter_gate_e2e.mjs` | PASS | 27 / 27 |
| 经济 / 商店 | `economy_check` / `shop_check` / E2E | PASS | 44/44、63/63、19/19、45/45 |
| Vault | `vault_check` / `vault_e2e` | PASS | 55/55、28/28 |
| 难度 | `difficulty_check` / `difficulty_e2e` | PASS | 669/669、36/36 |
| 剧情 | `node test/story_flow_e2e.mjs` | PASS | 46 / 46 |
| 布局/移动端 | `node test/layout_e2e.mjs` | PASS | 116 / 116 |
| 其余 E2E | draft/identity/journal/reward/settlement/ending/voice | PASS | 39/30/11/18/46/17/16 |
| 冒烟 | `node test/smoke.mjs` | PASS | 全部通过 |

---

## 10. E2E（真实浏览器）

- 浏览器：Google Chrome 158.0.8127.37（Playwright，真实 Chromium）
- 主流程：`node test/boss_weakness_e2e.mjs`
  - 生产构建静态服务 + 真实 MicroPython/WASM + 真实 Judge
  - 流程 A：攻击预警 + 防御获得线索 → 分析 → 发现弱点
  - 流程 B：错误代码真实判失败；正确代码真实判成功 → 破解成功
  - 流程 C：暴露横幅；阶段 1 击破后 **Boss HP 75 → 阶段 2 起始 62**（额外伤害结转 13）；HUD 显示 62/100
  - 流程 D：阶段切换后旧弱点失效（recovered），阶段 2 弱点 hidden；阶段 2 线索 → 破解 → 暴露
  - 流程 E：暴露中刷新 → 意识值不变、尝试次数/成功次数不重复、状态按剩余时间恢复
  - 流程 F：完成 p2/p3/p4 → 最终胜利；弱点状态清理
  - 流程 G：DEV 弱点面板注入线索/分析/破解/中断/刷新/重置，正式阶段状态与历史未变
- 截图：`.tmp/b3-evidence/`
  - `01-clues.png`、`02-weakness-discovered.png`、`03-crack-failed.png`、`04-weakness-exposed.png`、`05-stage2-carry.png`、`06-phase2-exposed.png`、`07-refresh-recovered.png`、`08-victory.png`、`09-dev-panel.png`
- 人工目视：已查看 `02` / `03` / `04` / `05` / `09`，线索/发现、破解覆盖层、暴露演出、62 HP 结转、DEV 面板显示正常。
- 页面异常：主流程无未捕获异常/业务控制台错误。
- 稳定性：`node test/boss_weakness_stability.mjs` 进出 Boss 页面 10 次，地图上意识值稳定、无异常、战斗状态未损坏。

---

## 11. 问题与修复

| 编号 | 级别 | 问题 | 原因 | 修复 | 回归 |
|---|---|---|---|---|---|
| B3-01 | P1 | 破解成功后未结算，尝试次数停留在 exploiting | 页面定时器/读状态调用 `normalizeWeaknessRun`，把内存中的 `exploiting` 当作刷新失败恢复为 discovered，导致 `completeWeaknessCrack` 拒绝结算 | 进行中战斗读取原状态（battleId/phase 匹配直接返回 raw）；normalize 只用于存档加载 | 弱点引擎 100/100、集成 108/108、E2E 25/25 |
| B3-02 | P1 | 弱点结转伤害未反映到 HUD/存档 | 结转只更新 `bossBattles` run HP，未同步旧 `progress.battles[bossId].hp` | 阶段切换应用结转时同步 legacy battle HP | E2E：阶段 2 起始 62 HP；B.1 E2E 31/31 |
| B3-03 | P2 | 破解覆盖层遮挡 Boss 攻击预警 | 全屏覆盖层覆盖 arena | 覆盖层打开时暂停 Boss 自动攻击（单一调度器），关闭 2s 后恢复 | B.2 E2E 29/29、B.3 E2E |
| B3-04 | P2 | 静态 E2E 服务器无法加载 MicroPython `.mjs` | 测试静态服务器 MIME 缺少 `.mjs` | 补 `text/javascript` | B.3 E2E 25/25 |
| B3-05 | P3 | 第一阶段显示「阈值 ≤100%」不自然 | B.1 文案 | 改为「初始阶段」 | 目视 |
| B3-06 | P3 | 弱点面板位于左栏下方需滚动 | 面板顺序 | 攻击面板置顶、弱点线索限高滚动；不影响预警操作 | 目视截图 |

未发现 P0 问题。

---

## 12. 未完成事项

1. B.4 动态事件战斗联动、B.5 战斗评价、B.6 全面视觉升级**未开发**。
2. 真实移动设备/平板触控与性能验收未执行（Playwright 视口模拟不等同真实设备）。
3. 其余 5 个 Boss 使用通用弱点配置，仅做集成/真实判题覆盖；真实浏览器 E2E 仅覆盖 GATE-01。
4. 未做数小时级长时间挂机稳定性（已完成 10 次进出与刷新/结算清理测试）。
5. 本次未提交 Git；期间并行 cinematic 提交不属于本阶段改动。
6. 特殊弱点类型/效果仍为基础配置，未扩展到 B.4 事件联动或 B.5 评分。

---

## 13. 最终验收

### CONDITIONAL PASS

理由：

- 弱点引擎、线索、分析发现、真实 Python 破解、暴露效果、恢复、阶段联动、存档自愈全部完成。
- 破解使用真实 MicroPython + Judge；错误代码失败、正确代码成功均通过真实浏览器 E2E。
- 暴露产生真实数值影响：阶段 2 起始 HP 75 → 62（结转 13），攻击中断/禁用模式/冷却延长接入 B.2。
- B.1/B.2、原 Boss、挑战、存档、章节、经济、商店、Vault、布局等全量回归通过。
- TypeScript 0 错误，生产构建成功。
- 无 P0/P1 遗留问题。

条件项（满足后可转为 PASS）：

1. 在真实移动设备与平板上完成弱点面板、破解编辑器、暴露横幅的触控/性能验收。
2. 在桌面端进行一次非 headless 的完整人工交互走查。
3. 如需全 Boss 级实测，补齐其余 5 个 Boss 的真实浏览器 E2E（当前只有集成与真实判题覆盖）。

---

## 附：证据位置

- 截图：`.tmp/b3-evidence/`
- 弱点专项：`test/boss_weakness_engine.test.mjs`、`test/boss_weakness_integration.test.mjs`
- 浏览器 E2E：`test/boss_weakness_e2e.mjs`
- 稳定性：`test/boss_weakness_stability.mjs`
- 本报告：`docs/NEXUS-V1.3-B.3-Boss弱点机制与代码破解系统开发报告.md`
