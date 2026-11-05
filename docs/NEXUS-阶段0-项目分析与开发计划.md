# NEXUS 阶段 0 · 现有项目全面分析与开发计划

> 依据：《NEXUS 游戏项目永久开发总规范 V1.0》（`NEXUS_AI开发总规范.md.txt`）
> 阶段约束：**只分析、不修改源码**。本文件为新增文档，未改动任何 `src/`、`public/`、构建配置或存档结构。
> 分析方式：逐文件阅读源码 + 数据统计 + 运行 `tsc --noEmit` + 运行 `node test/smoke.mjs`（针对现有 dist 产物）。
> 分析日期：2026-11-05

---

## 0. 结论摘要

| 项目 | 现状 |
|---|---|
| 技术栈 | React 18 + TypeScript 5.6 + Vite（开发）/ Rollup 自建构建（生产），**无后端**，存档在 localStorage |
| 代码执行 | **MicroPython WASM（micropython-settrace.wasm）主线程执行**，`sys.settrace` 看门狗超时；非 Worker、非 Pyodide |
| 教学体量 | **31 个可玩关卡**（tut-1 + 第一~六章各 5 关）、15 张知识卡、10 道实验室题 |
| Boss 现状 | **5 个「ECHO 回响」章节测验**，名称/编号与规范要求的 6 个 Boss 不一致，**第六章无 Boss**，**无血量、无阶段、无战斗循环** |
| 剧情现状 | 序章完整 + 六段「章节完成」短对话 + 3 段重生剧情；**创世主写作 E.S.（非恩格尔）**，**K-0 不存在**，**无三结局** |
| 可运行性 | `tsc --noEmit` **0 错误**；`node test/smoke.mjs` **全部通过**（启动→六章解锁路径→Boss 入口→兑换中心） |
| 最大风险 | 存档版本不匹配时**直接重置**（违反「不得清空存档」）；道具与外观已购买但**无任何使用/生效入口** |

一句话判断：**这是一个功能完整、可通关、判题真实的六章教学游戏原型；缺失的是「Boss 战玩法层」「正式剧情层」「结局层」与「存档迁移层」，而不是基础框架。**

---

## A. 当前项目架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│ 入口  index.html  →  src/main.tsx  →  <App/>                         │
│                        └─ GameProvider（唯一全局状态容器）           │
└──────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼───────────────────────────┐
        ▼                          ▼                           ▼
  页面层 pages/              组件层 components/            服务层 services/
  ─────────────             ─────────────────             ────────────────
  boot  StartPage            CodeEditor (Monaco)           pythonRunner  ──┐
  menu  MainMenu             Terminal                      judge         │
  story StoryPage            DialogSystem                  save          │
  map   WorldMap             MiraPanel                     sound         │
  challenge ChallengePage    PlayerStatus                  voice (TTS)   │
  boss  BossPage             AttackOverlay                 ai (本地提示) │
  lab   LabPage              RebirthOverlay                              │
  shop  RewardCenterPage     ParticlesField                              │
  profile/settings/                                                        │
  knowledge/achievements/archive                                           │
                                   │                                      │
                                   ▼                                      ▼
                          数据层 game/                          public/
                          ─────────────                        ─────────
                          levels.ts   (7 服务器 / 31 关)        monaco/vs (本地编辑器)
                          bosses.ts   (5 个 ECHO Boss)          micropython/*.mjs + *.wasm
                          story.ts    (剧情 / 碎片)             global.css
                          knowledge.ts(15 卡)
                          achievements.ts (23 成就)
                          rewards.ts  (贡献点/信任度/商店/档案)
                          defense.ts  (4 个紧急防御任务)
                          playground.ts (10 道实验室题)
                          progression.ts (经验/等级/容错)
                          types.ts
                                   │
                                   ▼
                          services/save.ts
                          localStorage: nexus_code_repair_save_v1
                          { version:1, updatedAt, player:{...} }
```

**运行时数据流（关键三条）**

1. **判题链**：`ChallengePage.submit()` → `checkUserCode()`（白名单/黑名单）→ `combineWithHarness()`（把断言注入用户代码尾部）→ `runPython()`（MicroPython 执行）→ stdout 里的 `__NX_MARKER__` → `judgeRun()` 解析为逐项 ✓/✗ → 全部通过才调用 `completeLevel()`。
2. **状态链**：`GameProvider` 里任何 `setPlayer` → `useEffect` 立刻 `saveGame()`（每帧变更即落盘）→ 刷新后 `loadGame()` 还原。
3. **章节解锁链**：`completeLevel()` 检测「本服务器 5 关全通」→ 写 `flags.chapterNDone` + 解锁下一服务器 → `WorldMap` 读 flags 决定节点状态 → 播放对应 `CHAPTERN_COMPLETE` 剧情。

**技术栈明细**

| 层 | 实际实现 |
|---|---|
| 框架 | React 18.3 + TypeScript 5.6（`strict` 见 tsconfig） |
| 开发服务器 | Vite 5.4（`npm run dev`，127.0.0.1:5173） |
| 生产构建 | `build.mjs`：Rollup + @rollup/plugin-typescript，输出 IIFE `dist/assets/game.js`（约 514 KB） |
| 编辑器 | Monaco 0.52.2，**本地内置** `public/monaco/vs`（CDN 仅兜底） |
| Python | MicroPython WASM，`loadMicroPython` + 自定义 stdout 回调 |
| 样式 | 单一 `src/styles/global.css`（48 KB，与 `public/global.css` 同哈希），**无 CSS 框架** |
| 音频 | Web Audio 实时合成（无音频文件）；语音走 Web Speech API |
| 后端 | **无**（`server.mjs` 只是静态预览） |
| 部署 | GitHub Pages 子路径（`https://engernages-lab.github.io/02/`），构建时把绝对路径改相对 |

---

## B. 当前已经完成的游戏功能清单（**不得重复创建**）

### B1 页面与系统（13 个 screen）
- 启动页：逐行打字 BOOT 序列、可跳过、ENTER NEXUS、粒子背景。
- 主菜单：继续游戏 / 新的开始 / 剧情档案 / 知识库 / 编程实验室 / 奖励兑换中心 / 成就 / 玩家档案 / 系统配置。
- 序章剧情页：15 个对话节点、2 处分支选择（p4/p7）、打字机、逐句语音按钮、跳过、已读记录。
- 数字世界地图：SVG 7 节点 + 中枢、4 种状态（ONLINE/DAMAGED/LOCKED/SEALED）、锁定抖动、首次接入简报、章节过场。
- 挑战页：任务简报 / 故障日志 / 知识点 / 静态变量说明 / Monaco 编辑器 / 运行 / 提交 / 重置 / 单步调试 / 结算面板。
- Boss 页（ECHO 章节测验）：遭遇剧情、题目、判题、击破结算、掉落剧情。
- 编程实验室：10 题、随机换题、草稿自动保存（300 ms 防抖）、变量快照、输出判题。
- 奖励兑换中心：14 件商品（外观 7 / 道具 4 / 特殊 3）、信任度条、记忆档案 4 份。
- 玩家档案、设置、知识库、成就、剧情档案。

### B2 教学与关卡
- **31 关全部可真实通关**（每关含故障描述、故障日志、目标、正确行为、初始故障代码、3 层提示、知识总结、经验值、判题规格、变量说明）。
- 判题双模式：`stdout`（包含 / 不含 / 按顺序匹配行）与 `python`（函数断言注入）。
- 关卡内顺序解锁（上一关通过才能进下一关）。
- 15 张知识卡（基础 / 流程 / 数据 / 函数四组），通关自动点亮，含示例与易错点。
- 10 道跨章节实验室练习（print / if / while / 列表过滤 / 词频 / 函数 / 异常 / 拼接 / get / 综合分级）。

### B3 执行与判题（真实，非模拟）
- MicroPython WASM 本地执行，**完全离线**，启动约 14 ms（README 实测口径）。
- `sys.settrace` 看门狗：5 秒超时**可打断死循环**。
- 执行队列串行化（`busy/queue`），避免并发污染 stdout。
- print 接管（sep/end 精确）、stdout/stderr 分离。
- traceback 解析：类型、消息、行号；错误行在编辑器高亮。
- 安全边界：长度 ≤ 4000 字符；模块白名单 `math/random/time/statistics/datetime/json`；禁用 `eval/exec/compile/input/open/__import__/globals/locals/vars`；先剥离字符串与注释再检测（防绕过）。
- 零基础差异提示：中文标点检测、缺空格定位、逐行顺序比对。
- 单步调试：`sys.settrace` 采集最多 500 步（行号 + 变量 repr 截断 80 字 + 输出增量），逐行回放 + 当前行高亮 + 变量监视器。

### B4 成长与容错
- 经验/等级：10 级阈值表、10 个称号、经验条里程碑。
- 容错：`toleranceFor(level)` = 3/3/4/4/5/5/6/6/7/7。
- 失败计数仅「正式提交」累加（运行不计数）。
- 超限触发「纠错者攻击」：警告动画 → 4 选 1 的紧急代码防御（`??` 填空，真实执行判题）→ 2 次尝试。
- 防御失败：意识 −30%；意识 ≤ 0 → 崩解 → ORIGIN PROTOCOL 重生（意识恢复 70、等级/成就/知识保留、当前关代码重置）。
- 星级：0 次失败 3★ / 1 次 2★ / ≥2 次 1★。

### B5 奖励与元系统
- 修复贡献点：基础 + 首通 + 零失误 + 未用提示 + 评级加成。
- 关卡评级 S/A/B/C（只看失误与提示，不惩罚慢玩家）。
- MIRA 信任度 0–100，5 个阶段（陌生/熟悉/信任/默契/共生）。
- 6 份章节奖励（幂等发放，含称号、终端主题、道具、碎片）。
- 记忆档案 4 份，按碎片数量解锁（2/4/6/9）。
- 23 个成就（含 9 个隐藏成就）。

### B6 存档
- localStorage 单键自动存档；`beforeunload` 兜底。
- 字段级自愈：`rewards`、`settings.voice` 缺失时 `normalize*` 补默认值。
- 导出 JSON / 导入 JSON / 清空重置。
- 损坏存档检测（`isValidSave`）→ 重置并给出提示。

### B7 视听
- Web Audio 合成：13 种音效（click/hover/boot/run/success/error/warning/alarm/threat/shield/levelup/unlock/death/rebirth/deny/type）+ 背景氛围音乐。
- 24 组 CSS keyframes：fadeUp/fadeIn/pulseGlow/barPulse/blink/ringSpin/floaty/corePulse/shakeX/dashFlow/ringPulse/glitch/hexPulse/popIn/starPop/toastIn/warnFlash/waveb/结算与商店动画等。
- 语音：6 种角色画像（MIRA/系统/ECHO/旁白/R-07/E.S.）、角色音色选择、试听、自动朗读（打字完成后）、语速/音调/音量独立。
- 动画开关与强度、打字机速度、全屏、音乐/音效独立音量。

---

## C. 当前尚未完成的游戏功能清单（**明确不存在**）

> 判定口径：源码中找不到实现路径，或只有数据字段而没有消费方（UI/逻辑）。**下列每一条均已核实，非推测。**

### C1 玩法层缺口（最重要）

| # | 缺口 | 核实结论 |
|---|---|---|
| C1-1 | **Boss 血量 / 战斗循环** | `BossDef` 无 hp 字段；`BossPage` 只有「运行 / 挑战 ECHO」两个按钮，判题通过即结束。**无伤害计算、无阶段、无受击反馈** |
| C1-2 | **Boss 多阶段题目** | 每个 Boss 只有 1 道题、1 份判题规格 |
| C1-3 | **第六章 Boss（K-0）** | `BOSSES` 仅 5 条（echo-01…05），第六章无 Boss；`bossForChapter('core')` 返回 undefined |
| C1-4 | **Boss 专属战斗特效/音效** | 无受击、无血条、无阶段转换动画；`sound.ts` 无 Boss 专用音效 |
| C1-5 | **Boss 战状态存档** | 只有 `progress.bossesDone: string[]`（是否击破），无血量/尝试次数/最佳表现 |

### C2 剧情与世界观缺口

| # | 缺口 | 核实结论 |
|---|---|---|
| C2-1 | **创世主名称** | 剧情里写 **E.S.**（`CHAPTER6_COMPLETE` c64/c65、`rebirthScript` rb4/rb5、`MEMORY_FRAGMENTS` f1/f2/f3），**规范要求统一为「恩格尔」** |
| C2-2 | **K-0 角色** | 全项目 **不存在**。当前反派是「ECHO」与「纠错者」，与规范的「K-0 零号裁决者」不是同一设定 |
| C2-3 | **MIRA 真实身份揭示**（第二章核心事件） | 第二章完成剧情只说「日志被刻意删除」，未揭示 MIRA 是记忆完整性系统、五年前封存 R-07 |
| C2-4 | **R 系列实验档案**（第三章核心事件） | 第三章完成剧情只说「货品时间戳比 NEXUS 历史更早」，无 R 系列 / R-07 身世 |
| C2-5 | **恩格尔与 K-0 的矛盾、MIRA 的牺牲**（第四章核心事件） | 第四章完成剧情只说「核心机房发出异常信号」 |
| C2-6 | **黎明协议真相**（第五章核心事件） | 第五章完成剧情只说「不是自然故障，是被注入」，无协议细节与恩格尔最后愿望 |
| C2-7 | **两个主结局 + 隐藏结局** | **完全不存在**。第六章结束只有一段固定对话，无选择、无分支、无结局记录 |
| C2-8 | **主角名称自定义** | `PlayerState.name` 字段存在且会显示，但**全项目没有任何修改入口**（无输入框、无 action） |
| C2-9 | **剧情回顾（章节级）** | `ArchivePage` 只回放**序章**节点 + 碎片；章节完成剧情、Boss 剧情未入库回放 |
| C2-10 | **MIRA 信任度驱动对话** | 信任度只用于兑换中心展示；`trustTier()` 未被任何对话/提示消费 |

### C3 系统层缺口

| # | 缺口 | 核实结论 |
|---|---|---|
| C3-1 | **存档版本迁移** | `loadGame()` 在 `data.version !== SAVE_VERSION` 时**直接 `defaultState()` 重置**（注释写「迁移预留」）。**违反规范「不得清空玩家原有数据」** |
| C3-2 | **道具可用性** | `scan/rollback/stabilizer/decoder` 可购买入库，但**没有任何使用入口**：`consumeItem`、`restoreConsciousness` 已定义、**从未被调用** |
| C3-3 | **外观生效** | `equipped` 只写不读：终端主题、粒子背景、称号、登录页、地图背景**全部不改变实际显示** |
| C3-4 | **响应式布局** | `global.css` **无任何 @media 查询**；`chlg-grid` 固定 `300px minmax(0,1fr) 300px`，菜单固定 `270px 1fr 330px`。**移动端不可用** |
| C3-5 | **章节知识复盘** | 只有单关 `summary`，无章节结束的知识回顾/错题回顾页 |
| C3-6 | **数字世界恢复效果** | 地图节点有状态变色与连线点亮，但无「修复后世界变化」动画/前后对比 |
| C3-7 | **音频资源** | 无任何音频文件（全部实时合成），无角色配音资源（仅系统 TTS） |
| C3-8 | **多语言** | `settings.lang` 字段预留，UI 固定中文，无 i18n 实现 |
| C3-9 | **排行榜 / 每日挑战 / 云存档 / 账户** | 均不存在（README 列为「阶段三」） |

### C4 已确认的缺陷与不一致（修复时应一并处理）

| # | 问题 | 证据 |
|---|---|---|
| C4-1 | 碎片 `f8` 悬空 | `CHAPTER_REWARDS` ch3 发放 `fragment: 'f8'`，但 `MEMORY_FRAGMENTS` 只有 f1–f7 → 玩家碎片数 +1 却看不到内容 |
| C4-2 | 碎片体系与规范不符 | 现有 7 枚「记忆碎片」（f1 来自第 3 次重生、f2 来自通关、f3–f7 来自 Boss、f8 幽灵）；规范要求 **6 枚创世主碎片，各由对应章节 Boss 首次击败专属掉落** |
| C4-3 | 成就文案过期 | `game_clear` 写「通关全部 **26** 个修复任务」，实际 31 关 |
| C4-4 | 主菜单文案过期 | 「序章 + 第一章已实装」「第二章起数据加密（占位）」「记忆碎片 x / **1**」 |
| C4-5 | 启动页文案过期 | 「v0.1.0 DEMO — 序章 + 第一章 · 本地 **Pyodide** 运行」（实际六章 + MicroPython） |
| C4-6 | 终端标签错误 | `Terminal.tsx` 页脚写 `PYTHON 3.12 // PYODIDE`（实际 MicroPython） |
| C4-7 | 死代码 | `src/workers/pythonWorkerSource.ts`（3 行、未 import）、`miraOnReplay()`（未调用） |
| C4-8 | README 与实现不符 | README 称「Web Worker 隔离」「Pyodide」「30 关」，实际主线程 MicroPython、31 关 |
| C4-9 | 结算文案 bug | `ChallengePage` 升级提示里 `+{g.tolerance - Math.min(g.tolerance, 3) < 0 ? 0 : 0}` 恒为 0（无意义表达式） |
| C4-10 | 主菜单双入口 | 「继续游戏」导航项与中央按钮重复同一逻辑 |

---

## D. 现有剧情与正式剧情蓝本之间的差距

### D1 对照表

| 规范要求 | 现状 | 差距等级 |
|---|---|---|
| 序章「沉睡的意识」：R-07 苏醒、认识 MIRA | 已实现 15 节点，含分支 | ✅ 基本达标（但 MIRA 自述为「智能维修助手」，弱于「记忆完整性与恢复辅助系统」） |
| 第一章「失落的数据港」：恢复数字世界、首次遭遇 K-0 | 语法维修站 5 关 + ECHO-01 镜像 | ⚠ 结构对，反派错位（ECHO ≠ K-0） |
| 第二章「破碎的记忆花园」：发现 MIRA 真实身份 | 仅「日志被删过」 | ❌ 核心事件缺失 |
| 第三章「被遗忘的实验档案」：R 系列实验与 R-07 身世 | 仅「时间戳早于 NEXUS 历史」 | ❌ 核心事件缺失 |
| 第四章「失控的核心工坊」：恩格尔与 K-0 矛盾、MIRA 牺牲 | 仅「核心机房发信号」 | ❌ 核心事件缺失 |
| 第五章「黎明崩塌的真相」：事故真相与恩格尔最后愿望 | 仅「不是自然故障」 | ❌ 核心事件缺失 |
| 第六章「起源之外」：击败 K-0、决定未来 | 5 关 + 一段独白式结局，**无 Boss、无选择** | ❌ 核心事件缺失 |
| 四主角（R-07 / MIRA / 恩格尔 / K-0） | R-07、MIRA 有；创世主叫 E.S.；K-0 不存在 | ❌ 2/4 |
| 六枚碎片形成连续故事 | 7 枚散碎片，来源混乱（重生/通关/章节奖励） | ❌ 需重建 |
| 两主结局 + 一隐藏结局 | 无 | ❌ 全缺 |
| 章节名称与现有教学结构映射 | 服务器名是「语法维修站/数据日志中心/存储数据仓/自动化工厂/系统诊断中心/方舟核心机房」，**与蓝本六章名不同** | ⚠ 规范允许「优先保留教学结构，再映射剧情」——**建议保留服务器名，用章节标题做副标题映射** |

### D2 剧情资产盘点（可直接复用）

| 资产 | 位置 | 数量 |
|---|---|---|
| 序章 PROLOGUE | story.ts | 15 节点（含 2 处分支） |
| 训练完成 TUTORIAL_DONE | story.ts | 3 |
| 第一~六章完成 CHAPTER1..6_COMPLETE | story.ts | 5+5+5+5+5+9 = 34 |
| 重生 rebirthScript | story.ts | 3 种分支（10 / 10 / 14 节点） |
| Boss 遭遇 intro | bosses.ts | 5×2~3 |
| Boss 掉落 echoStory | bosses.ts | 5×2 |
| 记忆碎片 MEMORY_FRAGMENTS | story.ts | 7 |

**合计约 100+ 条对话节点，全部带 speaker/kind，可直接被新的对话系统消费。** 这意味着剧情扩充是「增量写文案 + 接线」，不是「重写框架」。

### D3 关键叙事冲突（必须先定夺）

1. **ECHO 与 K-0 的关系**：现状 ECHO 是「被注入改写的受害者」（同情线），规范 K-0 是「坚信自己在保护世界的裁决者」（对立线）。二者不能简单改名——建议保留 ECHO 作为**第一章到第五章的「前哨/镜像」**，把 K-0 作为**第六章真 Boss**，并在第四章埋「ECHO 只是 K-0 的探针」的伏笔。这样既不删已有剧情，又符合规范。
2. **E.S. → 恩格尔**：只需文案替换 + speaker 显示名替换（`kind: 'engel'` 已存在，改 label 即可），**不涉及数据结构**。
3. **碎片数量 7 → 6**：需要一张「旧 id → 新 id」映射表（见 G 节），不能直接删 f1/f2（老存档可能已收集）。

---

## E. 每一章的实际 Python 教学知识点清单

> 以 `levels.ts` 的 `knowledge` 字段与 `goal/behavior` 为准，逐关核对。

### 序章 / 训练终端（1 关）
| 关卡 | 标题 | 知识点 | 实际考点 |
|---|---|---|---|
| tut-1 | 初识终端 | print | 输出函数、字符串引号、英文标点 |

### 第一章 · 语法维修站（5 关）
| 关卡 | 标题 | knowledge | 实际考点 |
|---|---|---|---|
| 1-1 | 沉睡的日志 | if, indent | if 末尾英文冒号 + 代码块缩进（SyntaxError） |
| 1-2 | 消失的字符 | string | 字符串引号闭合（EOL while scanning） |
| 1-3 | 错误的身份 | variable | 变量名一致性与 NameError |
| 1-4 | 反向的数据 | compare, for, indent, return, list | 比较运算符方向与边界（≥ 40）、列表 append |
| 1-5 | 错位的程序 | for, indent, list | for 循环体缩进（IndentationError） |

**第一章知识点集合**：print / if / indent / string / variable / compare / for / list / return / append（判题含函数断言，故已隐含 def+return）

### 第二章 · 数据日志中心（5 关）
| 关卡 | 标题 | knowledge | 实际考点 |
|---|---|---|---|
| 2-1 | 分流的消息 | if, compare | if/else 分支 + else 拼写（els:） |
| 2-2 | 失衡的判断 | compare | = 与 == 的区别 |
| 2-3 | 双重验证 | compare, logic, return | and / or 组合条件（短路语义） |
| 2-4 | 反转的指令 | logic, compare | not 取反、布尔返回值 |
| 2-5 | 循环中的分流 | for, if, elif | for + if/elif/else 多分支 |

**第二章知识点集合**：if / else / elif / compare / logic(and·or·not) / for / return / 布尔值

### 第三章 · 存储数据仓（5 关）
| 关卡 | 标题 | knowledge | 实际考点 |
|---|---|---|---|
| 3-1 | 空仓的货架 | list, for | 索引从 0 开始（items[3] → items[0]） |
| 3-2 | 错位的取货 | list, for, indent | append 必须写进循环体 |
| 3-3 | 沉底的货品 | while, list | while 边界（count < len(items)） |
| 3-4 | 移库的校验 | for, compare, list | 遍历比较（item == target） |
| 3-5 | 清点成册 | list, for, len, if | 双列表分流 + len() + 返回元组 |

**第三章知识点集合**：list / 索引 / append / for / while / len / 双列表分流 / return 元组

### 第四章 · 自动化工厂（5 关）
| 关卡 | 标题 | knowledge | 实际考点 |
|---|---|---|---|
| 4-1 | 失灵的装配 | return, parameter | def 关键字拼写（daf） |
| 4-2 | 空转的产线 | return, parameter | 缺少 return → None |
| 4-3 | 乱序的工单 | parameter, return | 位置参数顺序绑定 |
| 4-4 | 换岗的工位 | parameter, return, compare | 函数对象 vs 函数调用（is_ready vs is_ready(95)） |
| 4-5 | 总装线 | list, parameter, return | `", ".join(parts)`（join 是字符串方法） |

**第四章知识点集合**：def / 参数（位置） / return / 函数调用 / 函数对象 / str.join / 列表可变性

### 第五章 · 系统诊断中心（5 关）
| 关卡 | 标题 | knowledge | 实际考点 |
|---|---|---|---|
| 5-1 | 丢失的键值 | dict, return | dict.get(key, default) 防 KeyError |
| 5-2 | 失血的内存 | try, dict | try/except ValueError 兜底返回 0 |
| 5-3 | 复合的判断 | logic, compare | 括号改变优先级：critical and (a or b) |
| 5-4 | 转译的记录 | dict, for | 字典遍历 + 值写回（records[k] * factor） |
| 5-5 | 综合诊断 | dict, try, logic | 逐条 try/except 隔离 + 分级（HIGH/LOW/OK/ERR） |

**第五章知识点集合**：dict / get / KeyError / try-except(ValueError) / 逻辑优先级 / 字典遍历与写回 / 脏数据隔离

### 第六章 · 方舟核心机房（5 关）
| 关卡 | 标题 | knowledge | 实际考点 |
|---|---|---|---|
| 6-1 | 心跳协议 | if, return, compare | 分支返回值语义对调（逻辑走读） |
| 6-2 | 数据校检 | logic, list, for, compare | 复合区间条件（c < 40 or c > 90） |
| 6-3 | 密文解析 | dict, string, for | 循环内累积拼接（result = result + …） |
| 6-4 | 序列比对 | while, list, logic, compare | while + 索引 + 删除错误 or 分支 |
| 6-5 | 方舟重启 | try, dict, list, return | split 解析 + try/except ValueError/IndexError 双隔离 + 返回元组 |

**第六章知识点集合**：综合运用前五章（if/return/compare/logic/list/for/while/dict/string/try-except）+ 文本解析 split + 多异常类型

### 知识点覆盖矩阵（章节 × 知识卡）

| 知识卡 | 序 | 一 | 二 | 三 | 四 | 五 | 六 |
|---|---|---|---|---|---|---|---|
| print | ● | | | | | | |
| variable | | ● | | | | | |
| string | | ● | | | | | ● |
| if | | ● | ● | | | | ● |
| compare | | ● | ● | ● | ● | ● | ● |
| indent | | ● | | ● | | | |
| for | | ● | ● | ● | | ● | ● |
| list | | ● | | ● | ● | | ● |
| while | | | | ● | | | ● |
| elif | | | ● | | | | |
| logic | | | ● | | | ● | ● |
| dict | | | | | | ● | ● |
| try | | | | | | ● | ● |
| parameter | | | | | ● | | |
| return | | ● | ● | ● | ● | ● | ● |

**结论：教学覆盖完整、梯度合理，无需新增或删减知识点。** 唯一缺口是「章节知识复盘」这一**呈现层**（数据已齐备）。

---

## F. 现有 Boss 战开发所需的技术条件

### F1 已具备（可直接复用，无需新建）

| 能力 | 现有实现 | 复用方式 |
|---|---|---|
| 真实判题 | `judgeRun` + `buildHarness` + `__NX_MARKER__` | Boss 每阶段一个 `LevelJudgeSpec`，逐阶段判定 |
| 真实执行 | `runPython(code,{timeoutMs,debug})` | 伤害必须来自 `verdict.checks` 的真实通过率 |
| 超时保护 | `sys.settrace` 看门狗 | 防 Boss 战被死循环卡死 |
| 代码安全 | `checkUserCode` | Boss 页同样拦截危险代码 |
| Boss 数据模型 | `BossDef`（intro/fault/goal/behavior/initialCode/hints/judge/fragmentId/echoStory） | 扩字段即可，不重建 |
| Boss 页面骨架 | `BossPage` 三栏 + 终端 + 剧情弹层 | 在右栏插入血条/阶段指示，在结算插入阶段动画 |
| 幂等发放 | `completeBoss()` 检查 `bossesDone` | 碎片唯一性已有基础，需改为「首次」语义 |
| 对话系统 | `DialogSystem`（分支/语音/跳过） | Boss 阶段台词、战前战后剧情 |
| 音效 | `play('threat'/'shield'/'levelup'/'death')` | 受击/阶段/胜利音效可扩展 |
| 存档 | `normalize*` 模式 | 新字段加默认值即可兼容 |

### F2 必须新增（这是本阶段的核心结论）

1. **Boss 战斗状态模型**
   ```ts
   // 建议新增 src/game/battle.ts（不改动现有 types 的必填字段）
   interface BossPhase { id: string; title: string; hpShare: number; judge: LevelJudgeSpec; initialCode: string; hint: string; }
   interface BossBattleDef { bossId: string; maxHp: number; phases: BossPhase[]; damage: DamageRule; }
   ```
2. **伤害规则（必须与真实判题挂钩）**
   - 提交 → 真实执行 → 得到 `checks`；
   - 伤害 = `Σ(通过项 × 权重) × 阶段系数`，失败/超时/报错 = 0 伤害 + Boss 反击（意识 −N 或容错 −1）；
   - **禁止**：点击按钮掉血、写死伤害、假判题。
3. **存档字段**（需迁移）
   `progress.battles: Record<bossId, { hp: number; phase: number; attempts: number; bestDamage: number; cleared: boolean; clearedAt: number }>`
4. **UI 组件**：`BossHpBar`（分段血条 + 阶段刻度）、`DamagePopup`（伤害数字浮动）、`BossArena`（受击抖动/故障特效）、`PhaseBanner`。
5. **第六章 Boss K-0**：需要 1 套新的 `BossDef` + 3 阶段题目（建议：阶段 1 复合条件、阶段 2 字典/异常、阶段 3 综合重构），并接入 `core` 服务器。
6. **碎片唯一发放表**：`FRAGMENTS: { id, chapter, bossId, title, content }` 6 条；发放判定 = `battles[bossId].cleared && !meta.memoryFragments.includes(id)`。
7. **章节 Boss 门禁**：现状是「本服务器 5 关全通 → 显示挑战按钮」（WorldMap 已实现）。Boss 未击破时**是否阻止进入下一章**需要产品决策——建议**不阻止**（避免卡死玩家），但把「未击破」显示为章节未完成。

### F3 技术约束（必须遵守，否则会破坏现有稳定性）

- MicroPython 是**单线程主线程 + 串行队列**：Boss 多阶段不能并行判题，必须 `await` 串行。
- MicroPython **不是 CPython**：无 f-string 之外的诸多特性、无 `match`、部分标准库缺失。**Boss 题目只能使用现有章节已教语法**（规范硬性要求）。
- 测试注入走 stdout marker：Boss 阶段判定**不要**改成「读源码字符串匹配」，否则等于假判题。
- `BossPage` 当前无容错联动（"章节测试 · 不消耗容错"）：加入血量后需明确「Boss 战失败是否消耗容错」——建议**独立血量/独立次数**，不污染主线容错。

---

## G. 新旧存档兼容方案

### G1 现状（问题）

```ts
// services/save.ts
if (data.version !== SAVE_VERSION) {
  return { state: defaultState(), fresh: true, corrupted: '版本不一致，已重置。' };
}
```

- `SAVE_VERSION = 1`，**任何版本升级都会清空玩家全部进度**。
- 只做了**字段级**补齐（`normalizeRewards` / `normalizeVoice`），没有**版本级**迁移。
- 导入接口同样拒绝 `version !== 1`。

### G2 目标设计（分三层，逐层降级）

**第 1 层：版本链式迁移（主路径）**

```
raw(version=n) ──migrate_n→n+1──▶ ... ──▶ CURRENT ──normalize──▶ PlayerState
```

- 维护 `MIGRATIONS: Record<number, (old:any)=>any>`，每个版本一个纯函数。
- 迁移函数**只增字段、不改语义、不删旧字段**。
- 迁移后立即 `normalize*` 做字段级自愈。
- 迁移成功 → 覆盖写入新版本 + 同时写一份 `nexus_save_backup_v{n}`。

**第 2 层：字段级自愈（兜底）**

- 所有新增字段必须 **optional + 默认值 + normalize 函数**（沿用现有 `normalizeRewards` 模式）。
- `isValidSave` 只校验「不可能为空」的核心字段（name/level/exp/progress.completedLevels），其余一律可补。

**第 3 层：不可迁移时的无损降级（最后防线）**

- 若 `version > CURRENT`（玩家用了更新的版本）：**不重置**，进入只读模式，提示「存档来自更新版本，已备份」。
- 若 JSON 解析失败：把原始字符串存到 `nexus_save_corrupt_<ts>`，再重置，并提供「导出损坏数据」入口。
- 若迁移函数抛错：回滚到迁移前快照，保留原键不动，仅本次会话使用默认值（不落盘覆盖）。

### G3 具体版本规划

| 版本 | 变更 | 迁移动作 |
|---|---|---|
| v1 → v2 | 新增 `progress.battles`（Boss 战状态）、`meta.fragmentsV2`（六碎片规范 id） | 空对象/空数组；老 `bossesDone` → `battles[id]={cleared:true,hp:0,...}` |
| v2 → v3 | 新增 `progress.endings: string[]`、`progress.chapterRecap: Record<string, boolean>` | `[]` / `{}` |
| v3 → v4 | 新增 `player.displayName`（与 `name` 并存，规范：只改显示名，不改 R-07 编号） | `displayName = name || 'R-07'` |

### G4 旧碎片 id → 新六碎片 id 映射（关键，不能删旧数据）

| 旧 id | 旧来源 | 新归属 | 处理 |
|---|---|---|---|
| f1 | 第 3 次重生 | frag-06「起源之外」 | 保留旧 id，同时写入新 id（双写，UI 去重） |
| f2 | 第六章通关 | frag-05「最后的守护」 | 同上 |
| f3 | Boss echo-01 | frag-01「初始指令」 | 同上 |
| f4 | Boss echo-02 | frag-02「守护者的约定」 | 同上 |
| f5 | Boss echo-03 | frag-03「第七个实验体」 | 同上 |
| f6 | Boss echo-04 | frag-04「秩序的边界」 | 同上 |
| f7 | Boss echo-05 | frag-05（合并） | 与 f2 合并展示，不重复计数 |
| f8 | 章节奖励 ch3（**当前悬空**） | 归档为「附录碎片」 | 新增定义，避免"数量+1 内容为空" |

> 原则：**旧存档里已收集的碎片一律不收回**；新系统按「6 枚主碎片 + N 枚附录碎片」计数，主碎片用于结局解锁判定。

### G5 兼容验收清单（阶段 1 必须逐条测试）

1. 全新玩家（无存档）→ 正常初始化 v4。
2. v1 老存档（含 rewards/voice）→ 迁移后进度、等级、成就、碎片数量**完全不变**。
3. v1 老存档（无 rewards/voice）→ 补默认值，不报错。
4. 手工删除某个新字段 → normalize 补齐。
5. 损坏 JSON → 备份 + 重置 + 提示，**原始数据不丢**。
6. `version: 99`（未来版本）→ 只读提示，不清空。
7. 导出 v1 → 导入到 v4 → 走迁移成功。
8. 导出 v4 → 在旧版本打开 → 拒绝但不清空（旧版本行为，仅提示）。

---

## H. 分阶段开发计划

> 原则：**每阶段独立可运行、可测试、可回滚**；不完成不进入下一阶段；每阶段结束产出开发报告 + Git 提交。

### 阶段 1 · 数据地基与存档迁移（无可见玩法变化）
- 引入 `SAVE_VERSION = 2` + `MIGRATIONS` 链式迁移 + 三层降级。
- 新增字段骨架：`progress.battles`、`progress.endings`、`progress.chapterRecap`、`player.displayName`、`meta.fragmentsV2`。
- 补齐 `f8` 定义；建立旧→新碎片映射表。
- 新增 `test/save_migration.mjs`（8 条验收用例）。
- **验收**：G5 全绿；老存档零丢失；`tsc` 0 错误；smoke 全通过。

### 阶段 2 · 世界观对齐与角色补全（文案层，零玩法风险）
- E.S. → **恩格尔**（story.ts 全部文案 + `ROLE_PROFILES.engel.label`）。
- 新增 K-0 角色定义（`SpeakerKind` 增 `k0`、头像色、语音画像），**只加不改**。
- 补全四角色档案页（`ArchivePage` 增加「角色」分区）。
- 主角显示名自定义入口（设置页 + 序章首次进入时可选），**只改 displayName，R-07 编号固定**。
- 修正 C4-3/C4-4/C4-5/C4-6 过期文案。
- **验收**：全项目搜不到 "E.S."；改名后刷新仍保留；旧存档 displayName 自动补。

### 阶段 3 · Boss 战框架 + 第一章 Boss 试点（GATE-01）
- 新增 `src/game/battle.ts`（BossPhase / DamageRule / 结算函数，纯函数、可单测）。
- 新增组件 `BossHpBar` / `DamagePopup` / `PhaseBanner`。
- 改造 `BossPage`：血量、阶段推进、受击动画、失败反击、战报。
- 第一章 Boss 改为 **GATE-01 数据港守卫**（保留 ECHO 剧情作为前置遭遇，改为「K-0 派出的守卫」）。
- 伤害来源：真实 `verdict.checks`（每通过 1 项 = 固定伤害，阶段系数递增）。
- **验收**：写死伤害不可行（代码审查 + 单测）；错误代码打不掉血；三阶段可通关；存档记录血量；刷新可续战。

### 阶段 4 · 其余五章 Boss + 六碎片体系
- SOMNIA（2）、INDEX-0（3）、JUDGMENT-4（4）、ENTROPY（5）、**K-0（6，3 阶段）**。
- 六碎片唯一发放 + 碎片档案馆（按章节排序、含获取时间）。
- Boss 门禁与章节完成度展示。
- **验收**：6 Boss 全部可真实通关；重复挑战不重复发碎片；碎片数 = 6；第六章有 Boss。

### 阶段 5 · 正式剧情层（六章主线）
- 按 D1 补齐二~六章核心事件（MIRA 身份 / R 系列实验 / 恩格尔与 K-0 矛盾 / 黎明协议真相 / 起源之外）。
- 对话系统升级：条件分支（按 flags / 碎片数 / 信任度）、信任度分级台词。
- 章节知识复盘页（复用 level.summary + 知识卡 + 本关失误记录）。
- **验收**：六章剧情节点全部可达；分支条件可测；旧存档不因新增剧情卡死。

### 阶段 6 · 结局系统
- 第六章末选择 → 《新的黎明》/《永恒秩序》；集齐 6 碎片 + 记忆解锁 → 《超越起源》。
- 结局记录页（`progress.endings`）+ 剧情回顾（章节级回放）。
- **验收**：三种结局均可达成并记录；已解锁结局不丢失；不影响旧存档。

### 阶段 7 · 体验打磨与缺陷清理
- 响应式（≥3 个断点：≤1280 双栏、≤900 单栏、≤600 移动端工具栏折叠）。
- 道具接线（scan/rollback/stabilizer/decoder 真正可用）+ 外观生效（终端主题/粒子/称号/背景）。
- 删除死代码（pythonWorkerSource.ts）、修正 README、性能（首屏体积、wasm 预加载策略）。
- **验收**：移动端可完成一关；道具使用有真实效果；Lighthouse 性能不低于当前。

### 阶段排期建议（按工作量，非日历）

| 阶段 | 相对工作量 | 风险 |
|---|---|---|
| 1 存档地基 | 中 | 高（碰数据） |
| 2 世界观 | 小 | 低 |
| 3 Boss 框架 | 大 | 中 |
| 4 五 Boss | 大 | 中 |
| 5 剧情 | 大 | 低（纯内容） |
| 6 结局 | 中 | 中 |
| 7 打磨 | 中 | 低 |

---

## I. 各阶段可能涉及的文件与模块

| 阶段 | 新增 | 修改 |
|---|---|---|
| 1 | `src/services/migrations.ts`、`src/game/fragments.ts`、`test/save_migration.mjs` | `services/save.ts`、`game/types.ts`、`game/rewards.ts`（碎片定义）、`game/story.ts`（f8）、`store/gameStore.tsx`（初始化/落盘） |
| 2 | `src/game/characters.ts` | `game/story.ts`（E.S.→恩格尔）、`game/types.ts`（SpeakerKind + k0）、`services/voice.ts`（k0 画像）、`pages/ArchivePage.tsx`、`pages/SettingsPage.tsx`、`pages/StartPage.tsx`、`pages/MainMenu.tsx`、`components/Terminal.tsx` |
| 3 | `src/game/battle.ts`、`src/components/BossHpBar.tsx`、`src/components/DamagePopup.tsx`、`src/components/PhaseBanner.tsx` | `pages/BossPage.tsx`（大改）、`game/bosses.ts`（多阶段）、`store/gameStore.tsx`（`damageBoss`/`failBoss`）、`services/sound.ts`（Boss 音效）、`styles/global.css`（血条/受击） |
| 4 | 5 组 Boss 数据（并入 `game/bosses.ts` 或拆分 `game/bosses/ch*.ts`） | `game/bosses.ts`、`pages/BossPage.tsx`、`pages/WorldMap.tsx`（门禁/完成度）、`pages/RewardCenterPage.tsx`（碎片档案） |
| 5 | `src/game/story/chapter2..6.ts`、`src/pages/RecapPage.tsx` | `game/story.ts`（聚合导出）、`components/DialogSystem.tsx`（条件分支）、`pages/WorldMap.tsx`（过场触发）、`App.tsx`（新 screen） |
| 6 | `src/game/endings.ts`、`src/pages/EndingPage.tsx`、`src/pages/StoryReplayPage.tsx` | `pages/WorldMap.tsx`、`pages/BossPage.tsx`（终局）、`store/gameStore.tsx`（`chooseEnding`）、`game/types.ts` |
| 7 | — | `styles/global.css`（响应式，主要工作）、`pages/*`（道具按钮）、`components/PlayerStatus.tsx`（外观应用）、`README.md`、删除 `src/workers/pythonWorkerSource.ts` |

**明确不改动的核心模块**（保护性约束）：`services/judge.ts`、`services/pythonRunner.ts`、`game/levels.ts`（31 关题目与判题）、`game/knowledge.ts`、`game/progression.ts`。Boss 战只**调用**它们，不重写。

---

## J. 可能产生的技术风险

| # | 风险 | 等级 | 影响 | 缓解 |
|---|---|---|---|---|
| J1 | **存档迁移写错导致玩家进度丢失** | 🔴 高 | 不可逆，直接违反规范 | 三层降级 + 迁移前备份 + 8 条验收用例 + 迁移纯函数单测 |
| J2 | **Boss 血量与假判题**（为省事写死伤害） | 🔴 高 | 违反规范「禁止虚构判题」 | 伤害函数只接收 `JudgeVerdict`，单元测试断言「全错 = 0 伤害」 |
| J3 | **Boss 难度失衡**（真实判题 + 血量 → 可能打不过或秒杀） | 🟠 中 | 玩家卡关流失 | 每阶段伤害按通过项比例给，设「保底进度」（连续失败 N 次后 Boss 血量不再回满） |
| J4 | **MicroPython 与 CPython 语法差异** | 🟠 中 | 新 Boss 题可能「本地 CPython 通过、游戏内报错」 | 所有 Boss 题必须用 `test/cases` 同款双引擎回归（现有 71 例框架可复用） |
| J5 | **单线程执行 + 多阶段判题导致卡顿** | 🟡 中 | 阶段切换时 UI 冻结感 | 阶段判题串行 + loading 状态 + 超时 5s 兜底 |
| J6 | **剧情大改导致 flags 断链**（老存档章节卡死） | 🟠 中 | 玩家无法继续 | 新增剧情只挂在**新 flag** 上；旧 flag（chapterNDone 等）永不删除；WorldMap 触发条件「或」逻辑 |
| J7 | **碎片体系重构导致重复发放** | 🟠 中 | 违反「禁止重复发放永久碎片」 | 发放走单一函数 + `battles[id].cleared` 幂等 + 单测覆盖「重复挑战」 |
| J8 | **响应式改造破坏现有布局** | 🟡 中 | 桌面端回归 | 只加 `@media`，不改基础 grid 值；断点用 `min-width` 覆盖式 |
| J9 | **Monaco + WASM 首屏体积**（dist 约 514 KB JS + 480 KB wasm + Monaco 本地文件） | 🟡 中 | 移动端加载慢 | 保持本地内置；按需预加载；Monaco 延迟到进关卡再加载 |
| J10 | **TTS 浏览器差异**（Web Speech 音色/可用性） | 🟢 低 | 语音体验不一致 | 已有 `supported` 降级；保持「文字为主、语音为辅」 |
| J11 | **GitHub Pages 子路径部署**（`/02/`） | 🟡 中 | 资源 404 | 构建已把绝对路径改相对；新增资源必须走 `document.baseURI`（现有 `engineBase()` 模式） |
| J12 | **文档漂移**（README 与实现已不符） | 🟡 中 | 后续开发者误判 | 阶段 7 强制同步 README；每阶段报告附「与 README 差异」 |
| J13 | **回归测试缺口**（只有 smoke + 判题用例，无 UI 单测） | 🟠 中 | Boss/剧情改动易回归 | 阶段 1 起补 `battle.test`、`migration.test`；每阶段跑 smoke |
| J14 | **内容量与工期**（六章剧情 + 6 Boss 是主要工作量） | 🟠 中 | 阶段 5 拖长 | 剧情与 Boss 解耦：Boss 先上（阶段 3–4），剧情后补（阶段 5） |

---

## 附：本次分析的实际验证记录

| 验证项 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit` | **exit 0，0 错误** |
| 浏览器级冒烟 | `node test/smoke.mjs`（jsdom + dist） | **全部 PASS**（启动→六章解锁→Boss 入口→兑换中心→刷新恢复） |
| 关卡数据统计 | 正则统计 `levels.ts` | 31 关（tut-1 + 6×5） |
| 实体统计 | 正则统计各数据文件 | 15 知识卡 / 23 成就 / 14 商品 / 5 Boss / 7 碎片 |
| 部署一致性 | `web_fetch https://engernages-lab.github.io/02/` | 200，HTML 与本项目 `dist/index.html` 同构（相对路径 + `assets/game.js`） |

**未验证项（需在后续阶段实测）**：真实浏览器中的 Monaco 加载、MicroPython 在移动端的启动耗时、TTS 在 Safari/Firefox 的表现。本阶段为静态分析，不做浏览器实测。
