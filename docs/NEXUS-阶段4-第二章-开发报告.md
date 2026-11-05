# NEXUS 第四阶段 · 第二章开发报告
## 《破碎的记忆花园》· SOMNIA · 《守护者的约定》

> 依据：《NEXUS 游戏项目永久开发总规范 V1.0》+ 阶段 3 开发报告
> 执行规则：**每次只实现一章**。本次只完成**第二章**；第三章（INDEX-0）及之后**未开始**。
> 完成日期：2026-11-05

---

## 一、十章内容对照（全部落地）

| 要求 | 实现 | 位置 |
|---|---|---|
| 1. 开场剧情 | 进入数据日志中心 / 记忆花园，SOMNIA 正在吞噬记忆 | `ch2-arrive-01~09` |
| 2. 与 MIRA 的重要对话 | MIRA 承认「我删掉过你的一部分记忆」，并说明「答应过一个人不替你做决定」 | `ch2-restored-12~20` |
| 3. R-07 身世线索 | 无主记忆片段 + 「R-SERIES / 实验档案」索引 | `ch2-restored-04~05`、`ch2-win-12` |
| 4. 恩格尔历史补充 | 黎明协议之前的记录：「第七次。这次一定要成功。」「如果它醒来后恨我，那也是应该的。」 | `ch2-restored-05~08` |
| 5. 本章主要事件 | 修复 5 个记忆节点 → 花园重建 → 记忆片段浮现 | 5 个普通关卡 + `ch2-restored` |
| 6. Boss 登场 | SOMNIA 记忆吞噬体（「我在替这个世界清理伤口」） | `ch2-somnia-01~09` + 战前演出 |
| 7. 对应教学内容的 Python 挑战 | 4 阶段考点全部来自第一~二章（见下表） | `SOMNIA_BATTLE` |
| 8. Boss 多阶段战斗 | 100 血 / 4 阶段 / 真实判题驱动 | `BossBattlePage` |
| 9. 获胜获得碎片 | `frag-02《守护者的约定》`（仅首杀） | `bosses.ts` + `fragments.ts` |
| 10. 结尾与伏笔 | MIRA「我陪你一起去」+ R-SERIES 实验档案坐标 + 原初核心低频广播（K-0） | `ch2-win-12~16` |

**未新增主线人物**：SOMNIA 是记忆吞噬体（非人格化敌对单位），符合规范允许的 Boss 类型。

---

## 二、知识点覆盖表（第二章实际教学内容）

第二章关卡知识点（`levels.ts`）：2-1 if/compare、2-2 compare、2-3 compare/logic/return、2-4 logic/compare、2-5 for/if/elif。

| 阶段 | 题目 | 缺陷 | 正确修复 | 考点 |
|---|---|---|---|---|
| P1 记忆分流 | `classify(tag)` | `if tag = "error"`（赋值当比较，语法错误） | 改为 `==` | if / compare / return |
| P2 逻辑校验 | `guard(temp, pressure)` | `or` 导致单侧超限就过载 | 改为 `and` | logic / compare / return |
| P3 循环筛查 | `scan(logs)` | warn 分支返回 PASS | 改为 WARN | for / if / elif / list / return |
| P4 综合记忆重建 | `recover(nodes)` | `or` 导致越界节点混入 | 改为 `and`（1~99） | for / logic / compare / list / return |

`cumulativeKnowledge(2)` = 第一~二章累计知识点；`knowledgeViolations(SOMNIA_BATTLE) === []` 由测试保证。

---

## 三、SOMNIA 战斗

- 血量 100，4 阶段各 25；反击伤害 4 点意识。
- 伤害 = 真实判题新通过项比例；初始故障版已通过的项记入 `baselineMask`（实测 P1=0、P2=1、P3=4、P4=2），不计伤害。
- 失败不判负：意识 −4 + 原有容错计数；意识归零走既有死亡/重生流程。
- 胜利：`completeBoss('somnia')` 首次发放 `frag-02`，重复挑战不再发放。

---

## 四、存档（v4 → v5）

| 变更 | 迁移 |
|---|---|
| 第二章 Boss 代号 `echo-02` → `somnia` | `bossesDone` / `currentBossId` 映射并去重 |
| 新增 `chapter2ArrivalSeen` / `chapter2RestoreSeen` | flags 自由键，旧档缺失即补播一次 |
| 战斗状态 | 沿用 v4 的 `progress.battles`，无需改动 |

存储键不变；迁移链 v1→v2→v3→v4→v5 连续可用。

---

## 五、文件清单

### 新增（3）
| 文件 | 说明 |
|---|---|
| `src/game/lore/chapter2.ts` | 第二章 4 组演出 48 句正式剧情 |
| `src/game/lore/bossScenes.ts` | Boss 演出索引（gate-01 / somnia） |
| `docs/NEXUS-阶段4-第二章-开发报告.md` | 本文件 |

### 修改（10）
| 文件 | 改动 |
|---|---|
| `src/game/battle.ts` | `SOMNIA_BATTLE`（4 阶段）+ `cumulativeKnowledge` + 考点校验按章累计 |
| `src/game/bosses.ts` | ECHO-02 → SOMNIA（新题面/判题/碎片） |
| `src/game/lore/dialogue.ts` | 第二章台词指向正式演出脚本 |
| `src/game/story.ts` | 移除旧第二章过场 |
| `src/game/lore/chapters.ts` | 第二章 `currentBossId` → `somnia` |
| `src/game/lore/vars.ts` | 注册两个第二章剧情标记 |
| `src/services/migrations.ts` | 版本 5 + v4→v5 迁移 |
| `src/pages/WorldMap.tsx` | 第二章开场/恢复演出 |
| `src/pages/BossBattlePage.tsx`、`BossChallengePage.tsx` | 演出索引改用 `bossScenes` |
| `test/*` | 适配 v5 / SOMNIA / 第二章剧情 |

**未改动**：`levels.ts`（31 关）、判题与执行器、容错机制、第一章内容、第三~六章。

---

## 六、第二章独立测试结果

| 检查项 | 结果 | 证据 |
|---|---|---|
| 剧情连续 | ✅ | 开场→5 关→花园恢复→MIRA 坦白→SOMNIA→胜利→第三章伏笔；E2E 第六~九轮 |
| Boss 正常 | ✅ | 4 阶段战斗界面、血量/阶段刻度、战前演出；`boss_battle_e2e` 26/26 |
| Python 判题正常 | ✅ | 真实 MicroPython 执行：初始版全不通过且 0 伤害、正确版全通过并击破；`boss_battle_check` 105/105 |
| 碎片正常获取 | ✅ | `frag-02《守护者的约定》` 绑定 SOMNIA，档案显示 2/6 |
| 存档正常 | ✅ | v4→v5 迁移；战斗进度落盘；旧档无损 |
| 下一章解锁正常 | ✅ | 第二章 5 关全通后 `storage` 解锁（smoke 第五轮「第二章完成后存储数据仓显示 DAMAGED」通过） |

### 全量回归（10 套件）

| 套件 | 结果 |
|---|---|
| Boss 战斗逻辑 + 真实判题 | **105 / 105** |
| Boss 战斗端到端 | **26 / 26** |
| 身份/剧情/迁移逻辑 | **146 / 146** |
| 剧情链路端到端（含第二章四轮） | **46 / 46** |
| 原有浏览器冒烟 | **54 / 54** |
| 身份端到端 | **30 / 30** |
| 原 Boss 判题回归 | **11 / 11** |
| 对话推进 / 奖励语音 / 差异提示 | 通过（2 + 34 + 4） |
| TypeScript 类型检查 | **0 错误** |
| 生产构建 | **成功**（约 636 KB） |

---

## 七、已知限制

1. 第三~六章未开始（按「每次一章」规则）。
2. SOMNIA 沿用既有合成音效，无专属配音。
3. 第二章没有新增「记忆花园」专属场景背景，沿用 `memory` 背景 + 粒子特效。
4. 碎片仍为「六枚主碎片」体系，第二枚已可通过战斗获得。

## 八、结论

- 第二章《破碎的记忆花园》全部 10 项内容落地，SOMNIA 多阶段战斗与碎片获取实测通过。
- 原有功能（第一章、31 关、判题、存档、容错、奖励）全部回归通过。
- 存档 v1~v4 均可无损迁移到 v5。
- **第二章通过，可以进入第三章《被遗忘的实验档案》（INDEX-0）**，等待确认后开始。
