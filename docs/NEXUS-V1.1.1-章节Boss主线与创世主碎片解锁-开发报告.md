# NEXUS V1.1.1 · 章节 Boss 主线必经与创世主碎片解锁系统 · 开发报告

> 版本：V1.1.1
> 范围：章节主线解锁、Boss 首胜事务、六枚创世主碎片、第六章原初核心门禁、旧存档兼容
> 原则：只改主线进度相关逻辑；不重写 Boss 战、不重做剧情/奖励/存档系统；所有测试均为真实执行。

---

## 一、开发前问题清单（修改前实测）

| # | 问题 | 证据 | 风险 |
|---|---|---|---|
| 1 | 普通关卡完成即可解锁下一章 | `completeLevel` 在 `serverDone` 时直接把下一服务器写入 `unlockedServers`，并写 `pendingChapterUnlock` | 可绕过 Boss |
| 2 | 地图/剧情只看 `chapterNDone` + `unlockedServers` | `WorldMap.baseStatusOf` 用旧 flag 判断下一章 | Boss 不是必经 |
| 3 | Boss 胜利没有统一事务，`completeBoss` 无战斗校验 | `completeBoss(bossId)` 只查 `bossesDone`，任何调用方都能触发 | 未胜利也能发碎片 |
| 4 | `cleared` 可由血量/阶段推导 | `applyBossDamage` / `normalizeBattleState` 允许 `hp=0` 直接视为 cleared | 改血量即可"胜利" |
| 5 | 非主线 Boss 也能发主线碎片 | `echo-03/04/05` 的 `fragmentId` 是 `f5/f6/f7`，旧 id 会归并为 `frag-03/04/05` | Boss A 发 Boss B 的碎片 |
| 6 | 第六章没有"原初核心"独立门禁 | `core` 服务器在第五章关卡完成后即开放，K-0 只要求普通关卡完成 | 可跳过五碎片校验 |
| 7 | 普通关卡会发放创世主碎片 | 终章 `core` 全部完成发放 `f2`（旧 id → `frag-06`） | 未击败 K-0 获得第六枚 |
| 8 | 重生会发放 `f1`（旧 id → `frag-06`） | `finishRebirth` 在第二次重生后 push `f1` | 非 Boss 来源获得第六枚 |
| 9 | 旧存档只有 flags，没有章节/首胜时间/来源 | v1~v7 存档结构 | 新规则下可能丢进度 |
| 10 | 结局只看 `chapter6Done` flag | `EndingsPage` | 旧 flag 可能提前解锁结局 |

### 修改计划（已实施）

1. 新增 `src/game/chapterFlow.ts`：章节状态、门禁、原初核心、真实战斗校验、统一首胜事务、旧档继承。
2. `progress.chapters` 作为唯一主线事实来源；`bossesDone` / `unlockedServers` / `chapterNDone` 保留为兼容字段，不再决定解锁。
3. 移除 `completeLevel` 中"普通关卡完成即解锁下一章 / 发碎片"的所有分支。
4. `gameStore.submitBossAttack` 成为唯一 Boss 攻击入口：真实 Python 判题 → 伤害 → 首胜事务。
5. 地图、Boss 页、关卡页、结局页全部接入统一门禁。
6. 不升存档版本（仍为 v7），通过 `normalizePlayerState` 字段自愈 + 可审计继承完成迁移。

---

## 二、修改与新增文件清单

### 新增

| 文件 | 作用 |
|---|---|
| `src/game/chapterFlow.ts` | 章节状态 / 门禁 / 原初核心 / 战斗胜利校验 / 统一首胜事务 / 旧档继承 |
| `test/chapter_flow_check.mjs` | 章节门禁、首胜幂等、碎片绑定、原初核心、旧档迁移（133 条断言） |
| `test/boss_mainline_real.mjs` | 六章 24 阶段真实 MicroPython 判题 + 首胜事务全链路（177 条断言） |
| `test/chapter_gate_e2e.mjs` | jsdom 端到端：章节状态面板、锁定提示、Boss 必经、原初核心门禁、模拟再战（28 条） |
| `docs/NEXUS-V1.1.1-章节Boss主线与创世主碎片解锁-开发报告.md` | 本文档 |

### 修改

| 文件 | 改动 |
|---|---|
| `src/game/types.ts` | 新增 `ChapterProgressState` / `ChapterProgressMap` / `LegacyMigrationAudit` / `OriginCoreProgress`，`Progress` 增加 `chapters` / `migrationAudit` / `originCore`；`PlayerMeta` 增加 `memoryLogs` |
| `src/game/lore/types.ts` | `ChapterDef` 增加 `shardId`（SHARD-01…06） |
| `src/game/lore/chapters.ts` | 六章补 `shardId`，与 Boss / 碎片一一绑定 |
| `src/game/lore/chapter6.ts` | 新增 `CHAPTER6_FINAL_MEMORY_SCENES`（六枚齐备后的记忆重组演出） |
| `src/game/lore/vars.ts` | 修正章节 flag 语义描述；注册 `chapter6EngelSeen` |
| `src/services/save.ts` | 默认值补 `memoryLogs`；`normalizePlayerState` 接入章节自愈与旧档继承（传入来源版本） |
| `src/store/gameStore.tsx` | 同步提交 `commitPlayer`；`completeBoss` 改为调用统一首胜事务；新增 `submitBossAttack`；`completeLevel` 取消下一章解锁与碎片发放；重生改为写 `memoryLogs`；门禁函数接入 Context |
| `src/pages/BossBattlePage.tsx` | 提交攻击改走 `submitBossAttack`；首胜演出顺序（碎片→记忆重组→结算→章节结尾）；模拟再战；门禁拦截 |
| `src/pages/BossPage.tsx` | Boss 入口统一门禁；非主线回响保留旧挑战页 |
| `src/pages/ChallengePage.tsx` | 关卡进入统一门禁（防直接跳转） |
| `src/pages/WorldMap.tsx` | 新增六章主线状态面板；节点/章节解锁提示改为真实状态；原初核心入口；已首胜改为模拟再战 |
| `src/pages/EndingsPage.tsx` | 最终命运选择要求：K-0 完成 + 六碎片 + 最终记忆已阅 |
| `src/pages/ArchivePage.tsx` | 旧档案区显示 `memoryLogs`（重生日志不再计入主线碎片） |
| `src/pages/BossChallengePage.tsx` | 非主线回响明确提示"不发放创世主碎片" |
| `src/styles/global.css` | 章节状态面板 / 原初核心样式 |

> 未改动：`services/judge.ts`、`services/pythonRunner.ts`、`game/levels.ts`、`knowledge.ts`、`progression.ts`、`game/battle.ts` 的判题与关卡数据（Boss 战只调用，不重写）。

---

## 三、统一 Boss 首胜机制

### 3.1 唯一入口

```
BossBattlePage 提交用户代码
  → store.submitBossAttack(bossId, phaseIndex, code)
    → checkUserCode → runPython（真实 MicroPython）
    → judgeRun（真实测试项） → resolveSubmission（真实伤害）
    → verifyBattleState（全部阶段满分 + 阶段走完 + 血量归零）
    → handleBossFirstClear（统一事务）
```

UI 不再持有 `applyBossDamage` / `resetBossBattle` / `completeBoss` 的血量写入能力；`applyBossDamage` 已从 Context 移除。`cleared` 只由 `verifyBattleState` 计算，不再由 `hp<=0` 单独推导。

### 3.2 首胜判定条件（缺一不可）

1. Boss 属于六章主线，且 `boss.fragmentId === chapter.fragmentId`；
2. 章节已开放（第一章初始；其余章节上一章已完成）；
3. 第一~五章全部普通关卡完成；第六章原初核心五碎片校验通过；
4. 战斗记录存在；
5. 四个阶段位掩码全部覆盖（初始故障版本来就通过的 `baselineMask` 不能冒充新通过）；
6. `phase >= 阶段总数` 且 `hp <= 0`；
7. 该 Boss 尚未首胜（幂等）。

### 3.3 事务内容（一次写入）

1. 记录 `chapters[ch].bossDefeated / bossFirstClearAt / bossClearSource`；
2. 发放并归档对应碎片（`memoryFragments` + `fragmentLog`）；
3. 写 `chapters[ch].completed / completedAt`；
4. 开放下一章（`chapters[next].unlockedAt` + `unlockedServers` 兼容字段）；
5. 写 `bossesDone` 兼容字段；
6. 章节奖励 / 经验 / 等级 / 成就 / 等级解锁；
7. K-0 额外写 `chapter6Done`、`gameCompleted`、`originCore.clearedAt`。

重复调用 `handleBossFirstClear` 返回 `changed=false`，不产生任何永久变化。

---

## 四、章节解锁状态

| 状态 | 含义 | 进入条件 |
|---|---|---|
| `LOCKED` | 未解锁 | 上一章 Boss 未首胜，或第六章五碎片不足 |
| `AVAILABLE` | 可进入 | 上一章已完成，本章尚未开始 |
| `IN_PROGRESS` | 进行中 | 已进入并完成部分普通关卡 |
| `BOSS_REQUIRED` | 等待 Boss | 本章普通关卡全部完成，Boss 可挑战 |
| `BOSS_DEFEATED` | Boss 首胜已记录 | 首胜事务完成、结算展示中 |
| `COMPLETED` | 已完成 | 首胜 + 章节结算完成，下一章开放 |

- 第一~五章：Boss 必须在本章全部普通关卡完成后出现；首次真实击败才结算。
- 第六章：开放条件 = 前五章 Boss 首胜 + 前五枚碎片；原初核心是独立门禁。
- 已首胜 Boss：地图显示"已击破"，提供"模拟再战"，不发永久奖励。

所有状态由 `chapterGate(player, chapterId)` 从 `progress.chapters` + 真实关卡 + 真实碎片计算，不存在固定假数据。

---

## 五、六枚碎片绑定

| Boss ID | Boss 名称 | 碎片 ID | 碎片编号 | 碎片名称 |
|---|---|---|---|---|
| `gate-01` | 数据港守卫 | `frag-01` | SHARD-01 | 初始指令 |
| `somnia` | 记忆吞噬体 | `frag-02` | SHARD-02 | 守护者的约定 |
| `index-0` | 数据索引吞噬者 | `frag-03` | SHARD-03 | 第七个实验体 |
| `judgment-4` | 裁决执行体 | `frag-04` | SHARD-04 | 秩序的边界 |
| `entropy` | 熵潮核心 | `frag-05` | SHARD-05 | 最后的守护 |
| `k0` | 零号裁决者 | `frag-06` | SHARD-06 | 起源之外 |

- 绑定表来自 `CHAPTERS`，`handleBossFirstClear` 校验 `boss.fragmentId === chapter.fragmentId`。
- 非六章主线 Boss（ECHO 回响）不进入首胜事务，不发放创世主碎片。
- 普通关卡章节奖励只允许非主线档案残片（`f8`）；重生日志写入 `meta.memoryLogs`，不进入六碎片。
- 旧 id（f1–f7）仍可被 `hasFragment` 归并（旧档兼容，不收回）。

---

## 六、第六章原初核心门禁

两个独立状态：

1. **第六章开放**（`chapterGate('ch6')`）：前五章 Boss 首胜 + 前五枚碎片；第六章外围区域可进入。
2. **原初核心开放**（`originCoreGate(player)`）：第六章可进入 + 前五枚创世主碎片真实持有；不要求 K-0、不要求第六枚。

K-0 入口：`bossGate('k0')` = 第六章可进入 + 原初核心开放 + 未首胜。

- 四枚碎片：原初核心锁定，提示缺少 `SHARD-0X`，不提供进入按钮。
- 五枚碎片、无第六枚：原初核心开放，可挑战 K-0。
- 已击败 K-0：显示已通过裁决，可模拟再战。
- 旧档已解锁 `core` 但碎片不足：保留第六章外围入口（`legacyUnlocked`），原初核心仍锁定。

---

## 七、旧存档迁移方案与结果

不升存档版本（保持 v7），在 `normalizePlayerState` 中自愈：

### 7.1 已存在 Boss 首胜记录

- `bossesDone` 中的 Boss 直接迁移为 `chapters[ch].bossDefeated = true`，来源 `battle`；
- 缺失碎片按记录补发（单独写入 `migrationAudit`，不伪装成新战斗）。

### 7.2 已完成章节但无 Boss 记录（V1.0 等旧档）

- 连续完成 ≥3 章：整段继承（标记 `legacy-inherit`，补发对应碎片）；
- 连续完成 1–2 章且已推进到下一章：继承已完成章节；
- 只解锁下一章、未推进：不补发虚假首胜，保留旧区域入口（`legacyUnlocked`），需补打 Boss（不必重玩普通关卡）；
- 继承写入 `progress.migrationAudit`：时间、来源版本、原因、继承章节、补发碎片。

### 7.3 不降级

- `unlockedServers` 中已有区域即使未满足新规则也保留入口；
- 已完成的普通关卡、等级、经验、贡献点、信任度、称号、道具、剧情、结局全部保留；
- 第六章不会被继承为"已完成"（必须真实击败 K-0）。

### 7.4 实测结果

- `demo-save-ch1-5.json`（v1，第一~五章完成、无 Boss）：5 章继承 + `frag-01`~`frag-05` 补发；`chapter6Done=false`、K-0 未击败；旧等级 8 / 2260 经验 / 成就 / 全部 26 关保留；重复导入不重复发碎片。
- v6 旧档（仅解锁第二章、未推进）：不伪造首胜、不发碎片；GATE-01 仍可挑战；第二章保留入口。
- v5 旧档（有 `bossesDone: ['gate-01']`）：直接迁移为真实战斗来源，章节完成，第二章保持解锁，碎片不重复。
- 新游戏：严格执行新规则，第一章之外全部锁定。

---

## 八、测试结果

### 8.1 六章完整通关（真实判题）

`test/boss_mainline_real.mjs`：

- 六章 × 4 阶段 = 24 个 Boss 阶段；
- 每阶段：24 次初始故障版真实执行（必须 0 伤害）+ 24 次正确解真实执行（必须全部通过）；
- 共 48 次 MicroPython 真实运行；
- 结果：**177 / 177 通过**；六枚碎片按顺序归位、章节逐章解锁、K-0 后 `chapter6Done` / `gameCompleted` / `originCore.clearedAt` / 最终记忆全部正确。

### 8.2 Boss 失败与重复挑战

- `test/boss_battle_e2e.mjs`：失败提交只触发反击（意识 -3、失败 +1、Boss 不掉血、不发碎片、容错计数同步）；撤退续战保留进度；已击破不再显示首次挑战入口；**24 / 24 通过**。
- `test/chapter_flow_check.mjs`：无战斗记录 / 伪造血量归零均拒绝首胜；重复首胜不重复发碎片/经验/贡献点；**133 / 133 通过**。
- `test/chapter_gate_e2e.mjs`：已首胜 → 模拟再战；模拟界面明示不扣血/不发奖；**27 / 27 通过**。

### 8.3 章节跳过防护

- 未解锁章节节点点击 → 明确提示"需要完成第 X 章最终 Boss …，并获得 SHARD-0X"（26 条锁定/条件断言）；
- 直接设置 `currentLevelId` 进入未解锁关卡 → 被 `ChallengePage` 门禁拦回地图；
- 直接调用 `beginBossBattle` / `bossGate`：不满足条件返回不可用；
- 未击败第一章 Boss 时，第二章 `chapterGate` 始终 `LOCKED`，不会因为关卡数据出现而开放。

### 8.4 原初核心门禁

- 四枚碎片 → 锁定并列出缺少的 SHARD；
- 五枚碎片、无第六枚 → 开放，可挑战 K-0；
- 第六枚已获得 → 最终记忆解锁；
- 五碎片 + 第六章旧档入口 → 可进入原初核心（两个状态独立）。

### 8.5 原有测试回归（全部通过）

| 套件 | 结果 |
|---|---|
| `boss_battle_check.mjs` | 105 / 105 |
| `chapter3_check.mjs` | 31 / 31 |
| `chapter4_check.mjs` | 31 / 31 |
| `chapter5_check.mjs` | 31 / 31 |
| `chapter6_check.mjs` | 31 / 31 |
| `acceptance_check.mjs` | 38 / 38 |
| `identity_lore_check.mjs` | 146 / 146 |
| `ending_check.mjs` | 30 / 30 |
| `vault_check.mjs` | 55 / 55 |
| `boss_verify.mjs` | 19 / 19 |
| `reward_check.mjs` | 37 / 37 |
| `journal_check.mjs` | 51 / 51 |
| `dialog_click_check.mjs` | 通过 |
| `diff_hint_check.mjs` | 通过 |
| `voice_check.mjs` | 28 / 28 |
| `rewards_voice_check.mjs` | 34 / 34 |
| `smoke.mjs`（浏览器） | 全部通过 |
| `boss_battle_e2e.mjs` | 24 / 24 |
| `story_flow_e2e.mjs` | 46 / 46 |
| `identity_e2e.mjs` | 30 / 30 |
| `ending_e2e.mjs` | 17 / 17 |
| `vault_e2e.mjs` | 28 / 28 |
| `reward_e2e.mjs` | 16 / 16 |
| `journal_e2e.mjs` | 11 / 11 |
| `voice_e2e.mjs` | 16 / 16 |
| `chapter_gate_e2e.mjs`（新增） | 27 / 27 |

> 原有 25 个测试脚本 + 新增 3 个测试脚本，共 28 个套件全部通过；纯逻辑断言约 977 条、浏览器端断言 215 条（不含 smoke 的逐项断言）。

### 8.6 生产构建

```
npm run build
[build] chunk: assets/game.js 741 KB
[build] 完成，耗时 5.8s
```

`npx tsc --noEmit` 无错误。

---

## 九、已知遗留问题

1. **客户端存档可被手工修改**：本作是纯前端单机，`localStorage` 没有服务端签名。首胜事务会校验战斗记录完整性，UI 已无法通过改血量/跳页面获得碎片，但开发者工具直接改存档仍无法从密码学上阻止；本次范围不含反作弊服务端。
2. **旧 id 兼容**：`f1/f2` 仍归并为 `frag-06`（不收回旧档内容）。极旧的、已拥有 `f1` 的存档可能在 K-0 前显示 6/6；但 `chapter6Done` 只由 K-0 首胜写入，三个结局仍要求终章完成 + 最终记忆，因此不会提前通关。
3. **v4+ 浅进度旧档不自动补发**：只完成 1–2 章且未推进到下一章的旧档，为避免把"仅解锁下一章"伪造成"已完成章节"，不补发碎片；保留区域入口，玩家只需补打对应 Boss（无需重玩普通关卡）。
4. **UI 层胜利流程的 jsdom 覆盖有限**：Monaco 在 jsdom 中无法加载，端到端测试覆盖了失败/反击/续战/门禁/模拟再战；完整胜利路径由 `boss_mainline_real.mjs` 在真实 MicroPython + 真实首胜事务层验证，浏览器内完整点击胜利流程未做逐帧 e2e。
5. **第六章外围普通关卡可选**：按需求"进入原初核心只需五枚碎片"，K-0 不强制完成 6-1~6-5；`chapter6_done` 成就仍按原有规则要求外围关卡全部完成。
6. **ECHO 侧线 Boss 数据保留**：`echo-03/04/05` 仍保留旧碎片 id 用于旧存档展示，但已从主线首胜事务中排除，不会发放创世主碎片。
