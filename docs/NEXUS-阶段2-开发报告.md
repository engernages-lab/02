# NEXUS 第二阶段 · 开发报告
## 序章《沉睡的意识》与第一章《失落的数据港》正式剧情

> 依据：《NEXUS 游戏项目永久开发总规范 V1.0》+ 阶段 0 分析报告 + 阶段 1 基础架构
> 实施范围：**只做序章与第一章**。第二~六章剧情、后续 Boss、结局流程均未改动。
> 完成日期：2026-11-05

---

## 一、交付概览

| 交付项 | 内容 |
|---|---|
| 独立演出界面 | 新增 `CinematicStage`：全屏场景 + 背景 + 特效 + 角色全息 + 标题卡 + 打字机 + 逐句语音 + 跳过 |
| 序章《沉睡的意识》 | 6 个场景 / 50 句台词，覆盖蓝本全部 6 个节点 |
| 第一章《失落的数据港》 | 4 组演出 / 42 句台词，覆盖蓝本全部 7 个节点 |
| 章节 Boss | 第一章改为 **GATE-01 数据港守卫**（原 ECHO-01 移除），战前/战后各一段独立演出 |
| 第一枚碎片 | `frag-01《初始指令》`，仅首次击破 GATE-01 发放 |
| 存档 | 版本 v2 → **v3**（Boss 代号迁移），旧档无损 |
| 测试 | 8 个套件 / **297 条断言全部通过** |

---

## 二、剧情实现对照（蓝本 → 实际）

### 序章《沉睡的意识》（6 场景）

| 蓝本节点 | 实现 | 台词编号 |
|---|---|---|
| R-07 在废弃服务器中苏醒 | 地下服务器停机层、感官/记忆自检、"我是谁" | pro-wake-01 ~ 08 |
| MIRA 首次出现 | 外部信号接入、MIRA 自述身份、"是我把你留在这里的" | pro-mira-01 ~ 09 |
| 主角名称设置 | MIRA 询问称呼 → **演出内输入框** → "R-07 这个编号我会替你留着" | pro-name-01 ~ 05 |
| MIRA 解释 NEXUS 现状 | 数字文明、恩格尔、黎明协议、K-0 最高安全裁决、六枚碎片 | pro-nexus-01 ~ 13 |
| 发现 K-0 安全协议正在重新执行 | 协议广播、"你不在任何有效运行清单上"、清理程序入队 | pro-k0-01 ~ 08 |
| 逃离地下服务器 | 外壳完整性下降、撤离通道、进入主干网络 | pro-escape-01 ~ 07 |

### 第一章《失落的数据港》（4 组演出）

| 蓝本节点 | 实现 | 触发点 |
|---|---|---|
| R-07 与 MIRA 前往失落的数据港 | 外环抵达、五年前中转站、"像一座沉进海里的城市" | 首次进入地图且已解锁语法维修站 |
| 修复数据港能源 | 五个能源节点 LV-01~05，由**原有 5 个普通关卡**承担；地图面板显示 `能源节点 x / 5` | 关卡面板常驻 |
| 首次发现 R-07 的实验记录 | 未索引档案 `R-SERIES / R-07`、"第七代…前六代…"数据损坏 | 5 关全通后 |
| K-0 第一次向 R-07 发出警告 | "违规修复"、"不可预测就是危险的开始"、部署 GATE-01 | 同上（第二段） |
| 恢复数据港 | 能源节点 5/5 在线、主干恢复供电 | 同上（第一段） |
| GATE-01 Boss 战 | 战前演出（闸门协议）+ 真实判题 + 战后演出 | 章节 Boss 入口 |
| 获得第一枚碎片《初始指令》 | 结算面板 + 碎片档案 + 全六枚进度 | 击破 GATE-01 |
| 恩格尔第一次出现 | 碎片共鸣触发残留意识记录（"我是恩格尔…第一条指令不是命令，是一个问题"） | 战后演出 |

**信息释放控制**：序章不出现恩格尔；第一章只暗示"前六代"、MIRA"我由他编写，但这句话别现在就当真"，不解释 MIRA 身份、R 系列真相、恩格尔之死、K-0 的动机来源——留给后续章节。

---

## 三、独立演出界面（CinematicStage）

- **场景模型**：`StoryScene { id, title, subtitle, bg, fx, lines }`，背景 7 种（地下/通道/数据港/核心/虚空/记忆/终端），特效 5 种（扫描/警报/故障闪烁/粒子/无）。
- **表现**：全屏舞台、章节标题卡（进场动画）、角色全息方块（按角色着色：MIRA 青白 / K-0 紫 / 恩格尔 金 / 系统 绿）、逐字打字机、逐句 🔊 语音、进度 `n / N`、跳过。
- **交互**：点击任意处 / 空格 / 回车推进；第一次点击补全当前句；选项按钮；名称设置输入框（含"沿用 R-07"）。
- **数据与组件分离**：演出脚本在 `lore/prologue.ts` / `lore/chapter1.ts`，组件内**没有任何剧情文本**。
- **样式独立**：新增 `public/cinematic.css`（与 global.css 分离），并在 `index.html` 增加一个 link。
- **称呼规则**：`{player}` → 玩家显示名；`{{code}}` → 固定实验编号 R-07（改名后仍显示 R-07）；裸写的 R-07 在改名后按显示名处理（兼容旧台词）。

---

## 四、GATE-01 设计（合规性说明）

- **只使用第一章已教知识点**：`if` / `compare` / `for` / `return` / `string`。旧 ECHO-01 的 `str.upper()` 属于未教内容，已随本次替换修正。
- **判题真实**：函数断言 `power(3)=="ONLINE"` / `power(2)=="OFFLINE"` / `power(5)=="ONLINE"`，由 MicroPython 真实执行后注入 harness 判定。
- **不是按钮战**：只有判题全部通过才 `completeBoss`，无任何"点击造成伤害"路径。
- **碎片唯一**：`completeBoss` 检查 `bossesDone`，重复挑战返回 `null`，不重复发放。
- **GATE-01 的定位**：非人格化安全程序（蓝本允许的 Boss 敌对单位），对白走系统语气，不算新增核心角色。

---

## 五、存档变更（v2 → v3）

| 变更 | 迁移动作 |
|---|---|
| 第一章 Boss 代号 `echo-01` → `gate-01` | `progress.bossesDone` 内映射并去重；`currentBossId` 同步映射 |
| 新增剧情标记 `chapter1ArrivalSeen` / `chapter1RestoreSeen` | 无需迁移：flags 是自由键，旧档缺失即为"未看"，下次进入地图补播一次 |
| 碎片 id `f3` → `frag-01` | 沿用阶段 1 的 legacy 归并：`hasFragment(['f3'],'frag-01') === true`，旧档不收回 |

存储键仍为 `nexus_code_repair_save_v1`；迁移链 `v1→v2→v3` 连续可用。

---

## 六、文件清单

### 新增（6）
| 文件 | 说明 |
|---|---|
| `src/game/lore/prologue.ts` | 序章 6 场景 50 句正式剧情 + 扁平化导出 |
| `src/game/lore/chapter1.ts` | 第一章 4 组演出 42 句 + `bossScenesFor()` |
| `src/components/CinematicStage.tsx` | 独立演出界面组件 |
| `public/cinematic.css` | 演出专用样式（含移动端断点） |
| `test/story_flow_e2e.mjs` | 剧情链路端到端测试（31 项） |
| `docs/NEXUS-阶段2-开发报告.md` | 本文件 |

### 修改（主要）
| 文件 | 改动 |
|---|---|
| `src/game/story.ts` | 移除旧序章与旧第一章过场（已迁到 lore/）；`choices.next` 放宽为可选 |
| `src/game/lore/dialogue.ts` | 序章/第一章改指向新演出脚本 |
| `src/game/lore/types.ts` | 新增 `StoryScene` / `CinematicLine` / `SceneBg` / `SceneFx` |
| `src/game/lore/events.ts` | 第一章 Boss 事件改为 `boss-gate-01` |
| `src/game/lore/vars.ts` | 注册两个第一章剧情标记 |
| `src/game/lore/chapters.ts` | 第一章 `currentBossId` → `gate-01` |
| `src/game/bosses.ts` | ECHO-01 → GATE-01（新题面/判题/碎片）；新增 `opponentName`；`intro/echoStory` 改可选 |
| `src/game/achievements.ts` | 成就描述去 ECHO 化 |
| `src/services/migrations.ts` | 新增 v2→v3 步骤 |
| `src/pages/StoryPage.tsx` | 改用 CinematicStage，接入名称设置 |
| `src/pages/WorldMap.tsx` | 第一章"前往/恢复"演出、能源节点进度、GATE-01 入口 |
| `src/pages/BossPage.tsx` | 战前/战后演出、对手名数据化、碎片取规范定义 |
| `src/pages/ArchivePage.tsx` | 序章回放改用新台词；标题更正 |
| `src/pages/ProfilePage.tsx` | 碎片面板改为创世主六碎片 |
| `index.html` | 引入 cinematic.css |
| `test/smoke.mjs`、`test/boss_verify.mjs`、`test/identity_lore_check.mjs`、`test/identity_e2e.mjs` | 适配 v3 / GATE-01 / 新演出 |
| `README.md` | 功能表补充演出系统、第一章剧情、章节 Boss |

**未改动**：`game/levels.ts`（31 个普通关卡原样保留）、`services/judge.ts`、`services/pythonRunner.ts`、`game/knowledge.ts`、`game/progression.ts`。

---

## 七、实际测试结果

| 套件 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx tsc --noEmit` | **0 错误** |
| 剧情链路 E2E | `node test/story_flow_e2e.mjs` | **31 / 31** |
| 原有浏览器冒烟 | `node test/smoke.mjs` | **52 / 52** |
| 身份/剧情/迁移逻辑 | `node test/identity_lore_check.mjs` | **136 / 136** |
| 身份端到端 | `node test/identity_e2e.mjs` | **30 / 30** |
| Boss/实验室判题 | `node test/boss_verify.mjs` | **11 / 11** |
| 奖励/语音回归 | `node test/rewards_voice_check.mjs` | **34 / 34** |
| 对话推进回归 | `node test/dialog_click_check.mjs` | **通过**（1/50 → 2/50） |
| 判题差异提示 | `node test/diff_hint_check.mjs` | **通过**（3 种错误输出均正确提示） |
| 生产构建 | `npm run build` | **成功**（`dist/assets/game.js` 约 577 KB） |

### 八项要求验收

| 要求 | 结果 | 证据 |
|---|---|---|
| 1. 使用正式角色名称与对话 | ✅ | 序章/第一章只出现 R-07、MIRA、K-0、恩格尔；测试断言序章无恩格尔、第一章有恩格尔 |
| 2. 不擅自增加新核心人物 | ✅ | 无新角色；GATE-01 为非人格化安全程序 |
| 3. 不一次性泄露后续真相 | ✅ | 序章止于"逃离"；第一章只暗示前六代与 MIRA 由恩格尔编写 |
| 4. 重要剧情独立演出界面 | ✅ | `.cine-root` 全屏舞台，E2E 断言存在 |
| 5. 保留原有普通关卡 | ✅ | `levels.ts` 零改动，31 关仍在；冒烟跑通六章解锁路径 |
| 6. 完成后可正常继续游戏 | ✅ | 序章→地图→训练关→数据港→5 关→GATE-01→碎片→地图 |
| 7. 对话/跳过/播放/剧情存档 | ✅ | E2E：点击推进、跳过、名称、flags、事件解锁、阅读次数全部落盘 |
| 8. 称呼使用自定义名称 | ✅ | 演出内改名后，说话人标签与台词正文均替换；原始编号仍为 R-07 |

---

## 八、已知限制（留给后续阶段）

1. **Boss 血量/阶段框架未做**：GATE-01 仍是"单次真实判题"制（与其余 Boss 一致），血量战斗系统属阶段 3。
2. **恩格尔仅以"残留意识记录"出现**：符合蓝本（他已失去现实生命），但没有独立立绘/场景演出。
3. **第二~六章剧情未动**：仍是原有短过场；其 Boss 仍为 ECHO-02~05。
4. **演出无配音资源**：沿用 Web Speech TTS，浏览器不支持时自动降级为纯文字。
5. **无剧情回放器**：档案页只展示已读台词文本，不能重新播放演出。

## 九、结论

- 序章与第一章的正式剧情、独立演出、名称设置、K-0 首次警告、GATE-01、首枚碎片、恩格尔首次出现全部落地。
- 原有 31 关、判题、单步调试、实验室、奖励、语音、存档全部回归通过。
- 存档 v1/v2 均可无损迁移到 v3。
- **可以进入下一阶段**（建议：阶段 3 Boss 战框架，或第二章《破碎的记忆花园》剧情）。
