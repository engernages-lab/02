# NEXUS 第三轮 · 剩余章节与 K-0 实装前审查（只读）

> 审查范围：第一~六章现状、Boss 框架、碎片/结局/存档链路。
> 结论先行：普通关卡与判题**已齐备**；第三~五章缺正式演出与多阶段 Boss；**K-0 完全未实装**；
> 另发现一个阻断性缺陷——**章节完成标记 chapterNDone 全库无写入路径**，导致章节过场、章节事件与结局入口在真实游玩中永不触发（测试靠种子数据才通过）。

---

## 一、完成情况核对表

图例：✅ 已完成 ／ 🟡 部分完成 ／ ❌ 未完成 ／ ⚠️ 存在问题

| # | 检查项 | 第三章 | 第四章 | 第五章 | 第六章 |
|---|---|---|---|---|---|
| 1 | 章节入口 | 🟡 地图节点在，但入章无演出 | 🟡 同左 | 🟡 同左 | ❌ 解锁链断裂 |
| 2 | 背景/剧情介绍 | 🟡 有 brief 面板文案 | 🟡 同左 | 🟡 同左 | 🟡 同左 |
| 3 | 完整剧情对话 | ❌ 仅 story.ts 遗留 5~8 句 | ❌ 同左 | ❌ 同左 | ❌ 同左 |
| 4 | MIRA 对话与反馈 | 🟡 遗留节点有 MIRA，无章节演出 | 🟡 | 🟡 | ❌ |
| 5 | Python 普通关卡 | ✅ storage 5 关 | ✅ factory 5 关 | ✅ diag 5 关 | ✅ core 5 关 |
| 6 | 章节 Boss | 🟡 echo-03 可进入，但章节定义写的是 index-0（未注册） | 🟡 echo-04 vs judgment-4 | 🟡 echo-05 vs entropy | ❌ K-0 未注册 |
| 7 | Boss 多阶段 | ❌ BOSS_BATTLES 仅 GATE-01 / SOMNIA | ❌ | ❌ | ❌ |
| 8 | Boss 真实代码挑战 | ✅ 单题真实判题（BossChallengePage） | ✅ | ✅ | ❌ 无 |
| 9 | 创世主碎片 | 🟡 f5 → frag-03（旧 id 映射） | 🟡 f6 → frag-04 | 🟡 f7 → frag-05 | ❌ frag-06 无获取路径 |
| 10 | 章节结算 | ❌ 无章节学习复盘 | ❌ | ❌ | ❌ |
| 11 | 下一章解锁 | ⚠️ 依赖 chapter3Done（无人写） | ⚠️ | ⚠️ | ❌ |
| 12 | 存档/进度恢复 | 🟡 bossesDone/碎片持久化，章节完成态缺失 | 🟡 | 🟡 | 🟡 |

### 第六个 Boss（K-0 零号裁决者）
**未完成**：`bosses.ts` 无 `k0` 条目，`battle.ts` 无阶段定义，无专属演出、无碎片发放、无结算。

---

## 二、关键发现（按严重度）

### P0 · 章节完成标记从未写入（阻断性）
- `chapters.ts` 声明 `doneFlag: chapterNDone`，`events.ts` 用它做解锁条件，`WorldMap.tsx` 用它触发章节过场，`endings.ts` 用它判定结局。
- 全库检索：**只有读取，没有写入**（无 `setFlag('chapter3Done')`，store 也无动态写入）。
- 后果：真实游玩中第一~六章永远不会被标记完成 → 章节过场不播、章节事件不解锁、`chapter6Done` 永假 → **结局不可达**。现有测试能通过，是因为测试种子直接写入了这些 flag。
- 修复：在「该章全部关卡 + 章节 Boss 均完成」时写入 `chapterNDone`（store 或章节结算处），并对旧档做一次性回填。

### P1 · 章节 Boss 定义不一致
- `CHAPTERS`: ch3/4/5 的 `bossId` 为 index-0 / judgment-4 / entropy，`currentBossId` 为 echo-03/04/05。
- `bosses.ts` 只注册了 echo-*，`chapterOfBoss('index-0')` 靠 `bossId` 命中，但进入战斗用的是 `currentBossId`，因此玩家实际打的是「旧的 ECHO」，与新章节 Boss 的设定/碎片文案脱节（碎片靠 legacy 映射才没丢）。

### P1 · frag-06 无获取路径
- 第六章无 Boss，frag-06（`legacyIds: ['f1','f2']`）无发放者 → 隐藏结局的六碎片条件在真实游玩中不可满足。

### P2 · 第三~五章只有遗留短台词
- `story.ts` 的 `CHAPTER3_COMPLETE`~`CHAPTER6_COMPLETE` 是早期占位序列（5~8 句），不是章节演出，也未接入 CinematicStage 的场景体系。

### P2 · 第三~五章没有章节结算
- 章节结算面板目前只在多阶段 Boss 战（第一、二章）里；legacy 单题挑战页无评价/知识点/常见错误。

### P3 · 数据冗余/隐患
- `events.ts` 的 `boss-echo-02` 仍存在（已改名 somnia），回放映射无对应场景。
- `vars.ts` 的章节 flag 与 `chapters.ts` 的 doneFlag 重复声明，需保持单一来源。

---

## 三、剧情连续性核对

| 线索 | 前两章埋设 | 后续承接方案 |
|---|---|---|
| R-07 真实实验身份 | 第二章「R-SERIES 实验档案」+ 恩格尔「第七次」 | 第三章由 INDEX-0 打开档案库，揭示 R-01~R-06 全部失败、R-07 是唯一「被允许拒绝」的个体（碎片 03） |
| MIRA 封存记忆的原因 | 第二章坦白「删掉过你的一部分记忆」+「答应过一个人」 | 第四章揭示她是黎明崩塌的现场执行者，封存是为了让 R-07 不被 K-0 标记（碎片 04） |
| 恩格尔的创世计划 | 第一、二章记忆影像 | 第五章揭示「黎明协议」真实目的：不是控制，而是把权限拆成六份等待继承者（碎片 05） |
| 五年前的黎明崩塌 | 第一、二章反复提及 | 第五章正面对峙 ENTROPY，还原事故时间线与恩格尔的最后指令 |
| K-0 的安全裁决逻辑 | 第二章 SOMNIA 与 K-0 同源暗示 | 第六章 K-0 以「消除不确定性」为唯一目标，构成终局冲突（碎片 06 + 三结局） |
| 六枚碎片顺序 | 01/02 已实装 | 03 第七个实验体 → 04 秩序的边界 → 05 最后的守护 → 06 起源之外（现有 fragments.ts 已定稿，无需改文案） |

---

## 四、开发计划

### 4.1 按章实施顺序
1. **P0 修复**：章节完成标记写入 + 旧档回填（1 次提交，避免后续每章重复踩坑）。
2. 第三章（INDEX-0）：演出 → 多阶段战斗 → 碎片 03 → 章节结算 → 解锁第四章。
3. 第四章（JUDGMENT-4）：同上，碎片 04。
4. 第五章（ENTROPY）：同上，碎片 05。
5. 第六章（K-0）：演出 → 终局战斗 → 碎片 06 → 章节结算 → 写 `chapter6Done` → 结局入口打通。
6. 全量回归 + 三结局可达性验证。

### 4.2 需要新增的文件
| 文件 | 用途 |
|---|---|
| `src/game/lore/chapter3.ts` `chapter4.ts` `chapter5.ts` `chapter6.ts` | 每章 3~4 组演出（入场 / 中段 / Boss 登场 / 胜利+伏笔） |
| `src/game/lore/bossScenes.ts`（扩展） | index-0 / judgment-4 / entropy / k0 的战前战后演出索引 |
| `src/game/battle.ts`（扩展） | 四个 `BossBattleDef`（4 阶段，考点按章累计） |
| `src/pages/ChapterSettlement`（可内联） | 复用 BossBattlePage 现有面板，legacy 页接入 |
| `test/chapter3_check.mjs` … `chapter6_check.mjs` | 每章数据/判题/碎片逻辑 |
| `test/chapter3_e2e.mjs` … `chapter6_e2e.mjs` | 每章剧情→Boss→碎片→解锁→存档 |

### 4.3 需要修改的文件
| 文件 | 改动 |
|---|---|
| `src/game/lore/chapters.ts` | ch3-5 的 `currentBossId` 改为正式 Boss；ch6 补 `currentBossId: 'k0'` |
| `src/game/bosses.ts` | 新增 index-0 / judgment-4 / entropy / k0（保留 echo-* 作为兼容别名） |
| `src/game/battle.ts` | `BOSS_BATTLES` 扩到 6 个 |
| `src/game/story.ts` | 移除 CHAPTER3~6 遗留序列，迁移到 lore |
| `src/game/lore/dialogue.ts` | 第三~六章指向新演出 |
| `src/store/gameStore.tsx` | 章节完成判定与 `chapterNDone` 写入；Boss 首杀章节结算数据 |
| `src/pages/BossBattlePage.tsx` | 结算增加「下一章解锁」提示 |
| `src/pages/WorldMap.tsx` | 第三~六章过场接入新场景 |
| `src/services/migrations.ts` | 旧档回填 chapterNDone（v7） |
| `src/game/lore/events.ts` | 移除 `boss-echo-02` 或补别名映射 |

### 4.4 可直接复用的模块
- 多阶段战斗：`resolveSubmission` / `baselineMask` / `phaseMask` / `knowledgeViolations`
- 战斗界面：`BossBattlePage`（含 HP、阶段刻度、受击、结算、收集动画）
- 演出：`CinematicStage` + `StoryScene` + `{player}`/`{{code}}` 占位
- 碎片与结局：`fragments.ts`（03~06 文案已定稿）、`endings.ts`（三结局条件已就绪）
- 练习/图鉴：`codex.ts`（错误与关卡已绑定）、`economy.ts`（章节评价）
- 存档：字段级自愈 + v1→v6 迁移链

### 4.5 需要修复的问题（按优先级）
1. P0 章节完成标记写入 + 旧档回填。
2. P1 章节 Boss 定义统一（`bossId` = `currentBossId` = 正式 Boss）。
3. P1 frag-06 获取路径（K-0 首杀）。
4. P2 第三~五章补正式演出与章节结算。
5. P2 清理遗留台词与 `boss-echo-02` 事件。

### 4.6 每章测试方案（12 项）
1. 章节入口与过场播放一次（幂等）。
2. 5 个普通关卡真实判题通过。
3. Boss 入口可达、阶段推进正确。
4. 故障版代码真实不通过且 0 伤害；正确版击破。
5. 首杀发放碎片（03/04/05/06）且重复挑战不再发。
6. 章节结算数据真实（评价/正确率/知识点/常见错误）。
7. `chapterNDone` 写入且只写一次。
8. 下一章解锁（地图节点状态变化）。
9. 刷新/重开后进度与碎片恢复。
10. 旧存档迁移后不丢数据、不重复发奖。
11. 剧情连续（上一章结尾钩子 → 本章开场）。
12. 结局：第六章完成后三结局入口出现，隐藏结局条件仍受六碎片/档案/信任约束。

---

## 五、声明

本次仅做审查与规划，**未修改任何代码**。等待下一阶段指令后，按 4.1 的顺序逐章实施。
