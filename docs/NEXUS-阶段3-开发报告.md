# NEXUS 第三阶段 · 开发报告
## 章节 Boss 战斗系统（GATE-01 实装）

> 依据：《NEXUS 游戏项目永久开发总规范 V1.0》+ 阶段 2 开发报告
> 实施范围：**只建立战斗框架并只对第一章 GATE-01 启用**。第二~五章 Boss 保持原有单题挑战，未改动。
> 完成日期：2026-11-05

---

## 一、交付概览

| 交付项 | 内容 |
|---|---|
| Boss 战独立界面 | 新增 `BossBattlePage`：战斗舞台 + 血条 + 阶段刻度 + 代码区 + 战斗记录 + 终端 |
| Boss 立绘 | 新增 `BossAvatar`：纯 SVG 全息构造体（闸门守卫），随阶段换色 |
| 多阶段战斗 | GATE-01 共 4 阶段，每阶段 25 血，全部来自真实判题 |
| 真实执行 / 判题 | 复用 `CodeEditor` / `runPython` / `judgeRun` + 测试注入，无任何模拟判题 |
| 战斗反馈 | 受击抖动、伤害飘字、防御破裂横幅、阶段推进、玩家受击红屏、血条缓动 |
| 意识 / 容错接入 | 失败 → Boss 反击 −3 意识 + 原有 `recordFail` 容错计数（可触发纠错者攻击） |
| 存档 | v3 → **v4**（`progress.battles`），撤退/刷新可续战 |
| 碎片 | 仅首次击破发放 `frag-01《初始指令》`，已击破不再提供挑战入口 |
| 测试 | 10 个套件 / **400 条断言通过** |

---

## 二、知识点覆盖表（先读第一章教学内容，再出题）

第一章实际教学内容来自 `levels.ts`：

| 关卡 | 知识点 |
|---|---|
| tut-1 初识终端 | print |
| 1-1 沉睡的日志 | if, indent |
| 1-2 消失的字符 | string |
| 1-3 错误的身份 | variable |
| 1-4 反向的数据 | compare, for, indent, return, list |
| 1-5 错位的程序 | for, indent, list |

自动汇总为 `CHAPTER1_KNOWLEDGE = {print, if, indent, string, variable, compare, for, list, return}`（`battle.ts` 从真实关卡数据推导，不手写）。

| 阶段 | 考查知识点 | 对应关卡 | 是否越界 |
|---|---|---|---|
| P1 能源启动程序 | compare / if / return / print | 1-4 / 1-1 / 1-4 / tut-1 | ✅ |
| P2 防御逻辑 | if / compare / return | 1-1 / 1-4 / 1-4 | ✅ |
| P3 数据传输模块 | for / list / if / variable / return | 1-5 / 1-4 / 1-1 / 1-3 / 1-4 | ✅ |
| P4 综合服务器恢复 | for / list / if / compare / indent / return | 1-5 / 1-4 / 1-1 / 1-4 / 1-5 / 1-4 | ✅ |

测试 `knowledgeViolations(GATE01_BATTLE) === []` 保证任何阶段都不会出现 dict / try / while / elif 等后续章节内容。

---

## 三、战斗机制

### 3.1 血量与伤害

- Boss 总血量 **100**，4 个阶段均分，每阶段 **25**。
- 每次「提交攻击」= 真实执行 + 注入测试 + `judgeRun`：
  - 通过 1 条测试 → `floor(25 × 新通过数 / 总测试数)` 点伤害；
  - 全部测试通过 → 该阶段防御破裂，血量对齐阶段底线（25 / 50 / 75 / 0）；
  - 0 条新通过 → **不掉血**，Boss 反击。
- **基线保护**：初始故障代码本来就能通过的测试位记入 `baselineMask`（实测 P1=6、P2=5、P3=0、P4=0），这些位不产生伤害——否则玩家直接提交原样代码就能白打血。测试会回归校验基线。

### 3.2 失败处理（不判负）

| 情况 | 处理 |
|---|---|
| 语法错误 / 运行错误 / 超时 | 不判负；Boss 反击（意识 −3）+ 容错计数 +1 |
| 判题通过 0 条 | 同上 |
| 判题通过部分 | 造成伤害，不反击 |
| 意识降到 0 | 走**原有**死亡/重生流程；重生后该场战斗重置为满血第一阶段 |

### 3.3 与原有系统的关系（未修改机制）

- 容错：调用既有 `recordFail(bossId)`，仍由 `toleranceFor(level)` 决定阈值，超过仍触发原有「纠错者攻击」浮层；**`toleranceFor` / `recordFail` / `resolveDefense` 代码未改**。
- 意识：Boss 反击使用 `consciousness` 字段；归零调用既有 `startDeath`。
- 星级 / 经验 / 成就 / 碎片：击破时调用既有 `completeBoss`（幂等，重复挑战不重复发碎片）。

### 3.4 进度保存

`progress.battles[bossId] = { hp, maxHp, phase, phaseMask, failures, cleared, updatedAt }`

- 每次伤害 / 反击都立即落盘；撤退（◀ 撤退）不丢进度；刷新后续战。
- 迁移 v3→v4 自动补齐该字段，旧档无需处理。

---

## 四、GATE-01 四个阶段

| 阶段 | 题目 | 缺陷 | 正确修复 | 测试 |
|---|---|---|---|---|
| P1 能源启动程序 | `startup(energy)` 返回 POWER ON/OFF | `if energy > 20` 把临界值 20 判为不达标 | 改为 `>= 20` | 20→ON / 19→OFF / 60→ON |
| P2 防御逻辑 | `shield(threat)` 三档判定 | 第二个条件复制成 `> 80`，40~80 区间误判 SAFE | 第二个条件改 `> 40` | 90→CRITICAL / 60→WARNING / 10→SAFE / 41→WARNING |
| P3 数据传输模块 | `collect(packets)` 过滤有效包 | `good.append(packet)` 名字不存在（NameError） | 改为 `append(p)` | [1,2,3] / [] / [0,5] |
| P4 综合服务器恢复 | `scan(nodes)` 标记异常节点 | `append` 未缩进（IndentationError）+ 只查高压侧 | 缩进 + 补 `if n < 50` | [30,60,95]→[30,95] / [50,90]→[] / [49]→[49] |

---

## 五、战斗界面

- **舞台**：Boss 立绘（SVG：旋转环 / 六边形骨架 / 闸门立柱 / 能量核心 / 轨道节点）+ 名称 / 代号 / 章节。
- **血条**：100 点，4 段刻度线，缓动过渡，红橙渐变 + 发光。
- **阶段刻度**：4 个 pill，已击破划线置灰，当前阶段高亮。
- **动画**：受击抖动（bossHit）、裂纹闪烁（crackFlash）、防御破裂横幅（breakIn）、伤害飘字（dmgFloat）、玩家受击红屏抖动（arenaHit/arenaFlash）、阶段换色（phase-0~3）。
- **信息区**：当前目标、故障日志、本阶段考点、MIRA 三级提示、本阶段测试进度 x/y、战斗失误数。
- **终端**：复用 `Terminal`，输出判题逐项 ✓/✗。

---

## 六、文件清单

### 新增（8）
| 文件 | 说明 |
|---|---|
| `src/game/battle.ts` | 战斗数据（4 阶段）+ 伤害/阶段/存档纯逻辑 + 知识点校验 |
| `src/components/BossAvatar.tsx` | Boss 立绘（SVG 构造体 + 受击/破裂/坍塌状态） |
| `src/pages/BossBattlePage.tsx` | Boss 战独立界面 |
| `src/pages/BossChallengePage.tsx` | 原单题挑战页（第二~五章继续使用，行为不变） |
| `public/boss.css` | 战斗界面样式与动画 |
| `test/boss_battle_check.mjs` | 战斗逻辑 + 知识点 + 真实判题测试（75 项） |
| `test/boss_battle_e2e.mjs` | 战斗界面端到端（26 项） |
| `docs/NEXUS-阶段3-开发报告.md` | 本文件 |

### 修改（7）
| 文件 | 改动 |
|---|---|
| `src/pages/BossPage.tsx` | 改为分发器：有战斗配置 → 战斗界面；否则 → 原挑战页 |
| `src/game/types.ts` | `Progress.battles?` |
| `src/services/migrations.ts` | 版本 4 + v3→v4 迁移 |
| `src/store/gameStore.tsx` | `beginBossBattle` / `applyBossDamage` / `bossCounterAttack` / `resetBossBattle`；重生重置战斗 |
| `index.html` | 引入 `boss.css` |
| `test/smoke.mjs`、`test/story_flow_e2e.mjs`、`test/identity_*.mjs` | 适配 v4 与新战斗界面 |
| `README.md` | 功能表补充 Boss 战系统 |

**未改动**：`game/levels.ts`（31 关）、`services/judge.ts`、`services/pythonRunner.ts`、`game/progression.ts`、容错机制、第二~五章 Boss 数据。

---

## 七、实际测试结果

| 套件 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit` | **0 错误** |
| Boss 战斗逻辑 + 真实判题 | `node test/boss_battle_check.mjs` | **75 / 75** |
| Boss 战斗端到端 | `node test/boss_battle_e2e.mjs` | **26 / 26** |
| 身份/剧情/迁移逻辑 | `node test/identity_lore_check.mjs` | **136 / 136** |
| 剧情链路端到端 | `node test/story_flow_e2e.mjs` | **31 / 31** |
| 原有浏览器冒烟 | `node test/smoke.mjs` | **54 / 54** |
| 身份端到端 | `node test/identity_e2e.mjs` | **30 / 30** |
| 原 Boss 判题回归 | `node test/boss_verify.mjs` | **11 / 11** |
| 对话推进回归 | `node test/dialog_click_check.mjs` | **通过** |
| 奖励 / 语音回归 | `node test/rewards_voice_check.mjs` | **34 / 34** |
| 判题差异提示 | `node test/diff_hint_check.mjs` | **通过**（3 种错误输出提示正确） |
| 生产构建 | `npm run build` | **成功**（`dist/assets/game.js` 约 620 KB） |

**关键验证点（真实执行，非模拟）**
- 四个阶段的**初始故障版**：判题不通过、造成 0 伤害（含基线保护）。
- 四个阶段的**正确修复版**：判题全部通过、防御破裂、血量按 25 结算。
- 失败提交：意识 100 → 97，Boss 血量不变，容错计数 +1，战斗继续。
- 中局存档（42 血 / 第 2 阶段）：进入即续战，阶段刻度正确。
- 已击破：地图显示「已击破」，不再出现挑战入口。

---

## 八、12 项要求验收

| # | 要求 | 结果 | 证据 |
|---|---|---|---|
| 1 | 创建 Boss 战独立界面 | ✅ | `BossBattlePage` + `.boss-arena`，E2E 断言 |
| 2 | 名称 / 立绘 / 背景 / 生命值 | ✅ | 名称代号、SVG 立绘、`bg-dataport` 背景、100 血条 |
| 3 | 多阶段战斗 | ✅ | 4 阶段，阶段推进与刻度 |
| 4 | 接入现有编辑器 | ✅ | 复用 `CodeEditor`（Monaco） |
| 5 | 接入现有执行器 | ✅ | 复用 `runPython`（MicroPython + 超时） |
| 6 | 接入现有判题 | ✅ | 复用 `buildHarness` + `judgeRun` |
| 7 | 真实结果改变 Boss 状态 | ✅ | 伤害 = 新通过测试数，实测四阶段 |
| 8 | 破裂 / 受伤 / 阶段转换动画 | ✅ | bossHit / crackFlash / breakIn / dmgFloat / arenaHit |
| 9 | 接入意识值与容错 | ✅ | 反击 −3 意识；`recordFail` 原样调用；死亡走原流程 |
| 10 | 失败后可重新挑战 | ✅ | 无硬性判负；撤退续战；死亡后重置重打 |
| 11 | Boss 进度保存 | ✅ | `progress.battles` 每次落盘，v4 迁移 |
| 12 | 仅首次获胜发碎片 | ✅ | `completeBoss` 幂等；已击破不再提供入口 |

**禁止项自查**
- 普通代码错误**不会**直接判为战斗失败（只反击）。
- **没有**任何点击攻击/按钮扣血路径。
- **没有**修改原有容错机制（`toleranceFor`/`recordFail`/`resolveDefense` 未改）。
- **只有** GATE-01 启用战斗框架，第二~五章仍走原界面（E2E 第六轮验证）。

---

## 九、已知限制

1. 只有 GATE-01 使用战斗框架；推广到第二~五章需按章补 `BossBattleDef`（本阶段明确不做）。
2. 血量按阶段均分，没有「护盾 / 破防值」等更细的战斗数值。
3. Boss 无独立配音与专属音效，沿用既有 `success/alarm/threat/shield` 等合成音效。
4. 玩家侧没有立绘，受击反馈为舞台红屏 + HUD 意识下降。
5. 没有战斗回放/结算统计页（战斗记录仅本场内存保留）。

## 十、结论

- 统一的章节 Boss 战框架已建立，并只在 GATE-01 上完成实装与实测。
- 伤害、阶段、胜利判定全部由真实 Python 判题驱动，无模拟路径。
- 原有 31 关、剧情、存档、容错、意识、奖励系统全部回归通过。
- 存档 v1/v2/v3 均可无损迁移到 v4。
- **可以进入下一阶段**（建议：把战斗框架推广到第二~五章，或继续第二章剧情）。
