# NEXUS V1.2-A · A7 最终综合回归测试与六大模块联调报告

> 阶段：V1.2-A / A7 最终验收（V1.3 未启动）
> 分支：`feature/v1.2-a-experience-polish`
> 基线：A1 `f1c90a9`、A2 `b536df2`、A3 `6d9c802`、A4 `c03ad54`、A5 `7e71fa9`、A6 `09feb07`
> 存档版本：**v10**
> 验收日期：本轮 A7 执行

---

## 一、A7 测试目标

对 A1–A6 做最终质量验收，而不是新增玩法：

1. 原有玩法（主线、关卡、判题、Boss、碎片、剧情、成长）未被破坏；
2. 六大模块可独立工作，也能形成完整数据流；
3. 存档读取/保存/刷新/迁移安全，异常存档不白屏、不污染核心逻辑；
4. PC 与移动端可用；
5. 修复本轮发现的问题，形成验收结论。

---

## 二、项目整体审计结果

### 2.1 系统清单

| 类别 | 模块 | 位置 | 状态 |
|---|---|---|---|
| 原有 | 启动/主菜单/地图 | `BootScreen`、`MainMenu`、`MapPage` | 保留 |
| 原有 | 剧情与对话 | `DialogSystem`、`game/story.ts`、`lore/*` | 保留 |
| 原有 | 关卡与章节 | `game/levels.ts`（31 关 / 7 服务器） | 保留 |
| 原有 | 判题与执行 | `judge.ts`、`pythonRunner.ts`、MicroPython WASM | 保留（A3 仅补 traceback/沙箱） |
| 原有 | Boss 战 | `battle.ts`、`bossDifficulties.ts`、`chapterFlow.ts` | 保留 |
| 原有 | 碎片/档案 | `lore/fragments.ts`、`story.ts`、Vault | 保留 |
| 原有 | 成长/成就/知识 | `progression.ts`、`achievements.ts`、`knowledge.ts` | 保留 |
| 原有 | 死亡/复活 | `RebirthOverlay`、`resolveDefense`、`startDeath` | 保留（A4 增失败结算） |
| A1 | 草稿自动保存 | `services/drafts.ts` + `ChallengePage` | 新增 |
| A2 | 响应式 | `global.css` + `ChallengePage` 标签/侧栏 | 新增 |
| A3 | 智能诊断 | `services/diagnose.ts`、`sandboxRunner.ts`、`DiagnosisPanel` | 新增 |
| A4 | 挑战会话/结算 | `game/challengeSession.ts`、`RebirthOverlay` 失败结算 | 新增 |
| A5 | 商城/背包/道具 | `game/shop.ts`、`shopTx.ts`、`RewardCenterPage` | 新增 |
| A6 | 经济配置/账本 | `game/economyConfig.ts`、`economy.ts`、迁移 v10 | 新增 |

### 2.2 依赖与关键数据流

```
ChallengePage
 ├─ drafts(NS by player.createdAt + levelId)          A1
 ├─ runPython → judgeRun / diagnoseRun                 A3
 ├─ store.beginChallenge / recordRun / recordSubmit   A4
 ├─ store.completeLevel → economy.computeLevelRewardV2  A6
 │      └─ challengeSession.settle + rewards.ledger     A4/A6
 ├─ store.recordFail → tolerance / shield / guard      A4/A5
 └─ store.hintUsed / consumeHintTicket                 A5
RewardCenterPage → shopTx.purchaseItem/useItem → rewards(credits/items/transactions/buffs)   A5
save/migrations → normalizeRewards + normalizeSessions + levelFromExp + id 白名单             A1/A4/A6/A7
BossBattlePage → chapterFlow.handleBossFirstClear → fragment + chapter + ledger               原有/A6
```

### 2.3 存档结构（v10）

`PlayerState`：身份、等级/经验、意识、meta（碎片/日志）、progress（关卡/Boss/会话/剧情/收藏）、rewards（贡献点/信任/道具/外观/装备/章节/交易/增益/账本）、settings。

### 2.4 潜在冲突点（审计）

| 冲突点 | 结论 |
|---|---|
| `failedAttempts` 与 `challengeSession.errors` | A4 同一次 `commitPlayer` 双写，防御/护符成功时同步清零 |
| 两套碎片 id（f1–f8 档案 / frag-01–06 创世主） | 旧存档 legacy 映射有意重叠，A7 验证不重复计数；未改规则 |
| `buyShopItem` 旧接口与 `purchaseShopItem` | 旧接口是 1 件包装器，统一走新事务 |
| 等级独立存储与经验 | A6 起载入时由经验推导，A7 验证 |
| 草稿命名空间与存档 currentLevelId | A1 按 player.createdAt + levelId 隔离，A7 验证跨关不覆盖 |

---

## 三、A1–A6 独立回归结果

| 模块 | 套件 | 结果 |
|---|---|---|
| A1 | `draft_check` / `draft_e2e` | 52/52 · 39/39 |
| A2 | `layout_e2e`（含 320–1366 + 横屏） | 116/116 |
| A3 | `diagnose_check` / `diagnose_e2e` | 62/62 · 52/52 |
| A4 | `session_check` / `settlement_e2e` | 44/44 · 46/46 |
| A5 | `shop_check` / `shop_e2e` | 63/63 · 45/45 |
| A6 | `economy_check` / `economy_e2e` | 44/44 · 19/19 |
| A7 新增 | `a7_save_check` / `a7_integration_check` / `a7_e2e` | 94/94 · 33/33 · 51/51 |

A1 关键点：进入创建、输入自动保存、刷新恢复、跨关隔离、结算后草稿不被旧状态覆盖。
A2 关键点：7 种目标分辨率无横向溢出、编辑器可用、移动端 5 标签、操作入口可达。
A3 关键点：语法/运行时/逻辑/输出/超时、三层提示、MIRA、诊断不参与判定。
A4 关键点：运行/提交计数、容错、成功/失败结算、死亡复活、Boss 会话、`completeLevel` 幂等。
A5 关键点：真实扣费、库存、使用、装备、交易记录、刷新持久化。
A6 关键点：首通/重复/Boss 奖励、经验升级、价格、失败资源、奖励账本。

---

## 四、六大模块联调结果

### 联调一：挑战 → 保存 → 诊断 → 判题 → 结算

`a7_e2e` 实测：进入 1-1 → 写入语法错误 → 运行 → A3 诊断 `syntax` → 改为正确代码 → 提交 → 首次通关。结果：贡献点 500→590（+90）、经验 0→60、会话 `runs=1 / submits=1 / passed`、账本 1 条、草稿保存成功代码。五处数据一致。

### 联调二：失败 → 死亡 → 复活 → 重新挑战

`settlement_e2e`（46）与 `difficulty_e2e`（36）覆盖：连续失败触发攻击、两次防御失败意识归零、失败结算写入、点击重新挑战进入重组、`finishRebirth` 清空本关 failedAttempts、重生后新会话从零开始、不重复扣失败成本。

### 联调三：通关 → 奖励 → 购买 → 道具 → 再挑战

`a7_e2e` 实测：结算后余额 590 → 商店显示 590 → 购买护盾核心扣至 530、库存 +1 → 背包使用获得 1 层护盾 → 刷新 → HUD 仍显示「护盾 1」且余额 530 → 进入挑战。购买、库存、增益、货币、刷新五处一致。

### 联调四：Boss 战

`boss_battle_check` 105、`boss_verify` 19、`boss_battle_e2e` 24、`difficulty_e2e` 36、`chapter_gate_e2e` 27 全部通过：出场/阶段/血量/判定/反击/胜利/失败/首胜奖励/难度一次性奖励均正常；Boss 会话与普通关卡会话按 id 隔离。Boss 战规则未修改。

### 联调五：碎片与解锁

`identity_lore_check` 146、`ending_check` 30、`vault_check` 55、`vault_e2e` 28、`story_flow_e2e` 46、`chapter_flow_check` 133 通过；A7 纯逻辑补充验证碎片去重、旧 id 映射、已拥有不可重复领取、进度统计。掉落规则、数量、稀有度、剧情条件未改。

### 联调六：长期成长

`draft_e2e`、`settlement_e2e`、`economy_e2e`、`a7_e2e` 覆盖等级/经验/金币/装备/背包/完成关卡/Boss/碎片/成就在成功、失败、复活、刷新后的状态；A6 起等级由经验推导，A7 验证刷新后 level=1/exp=60/credits=530 一致。

---

## 五、原有游戏完整性测试

| 检查项 | 结果 | 证据 |
|---|---|---|
| 启动与主菜单 | 通过 | a7_e2e、smoke、identity_e2e |
| 角色展示 | 通过 | PlayerStatus、identity_e2e |
| 主线剧情 | 通过 | story_flow_e2e 46、ending_check 30 |
| 关卡顺序/解锁 | 通过 | chapter_gate_e2e 27、chapter3–6 各 31 |
| 代码挑战/判题 | 通过 | verify 71、mp_verify 71、diagnose 62/52 |
| Boss 战 | 通过 | 105/19/24/36 |
| 碎片/解锁 | 通过 | vault 55/28、lore 146 |
| 死亡/复活 | 通过 | settlement 46、difficulty 36 |
| 商店/背包/成长 | 通过 | shop 63/45、economy 44/19 |
| 全流程可完成 | 通过 | 初始代码 31 关全不通过、`audit_initial` 符合预期；playthrough 工具可跑 |

未发现原有功能消失、剧情跳段、关卡锁死、Boss 无法攻击/受伤、碎片拾取异常或玩家无法继续游戏。

---

## 六、Boss 战测试记录

- 出场演出、阶段切换、血量与伤害、反击、防御事件：`boss_battle_check` 105 条；
- 真实判题驱动伤害：`boss_verify` 19 条；
- 浏览器完整生命周期：`boss_battle_e2e` 24 条；
- 难度选择/锁定/放弃/模拟再战/失败重生：`difficulty_e2e` 36 条；
- 章节门禁与首胜事务：`chapter_gate_e2e` 27 条。
全部通过，未改动 Boss 数据与判题。

---

## 七、碎片系统测试记录

- 去重计数、旧 id 映射、已拥有判定、进度统计：`a7_integration_check` D 段；
- 档案解锁、阅读、解码器：`vault_check` 55、`vault_e2e` 28；
- 剧情/结局关联：`story_flow_e2e` 46、`ending_check` 30、`ending_e2e` 17；
- 创作者碎片与 Boss 首胜：`chapter_flow_check` 133、`boss_battle_check` 105。
未发现重复发放、拾取消失或刷新后重新锁定。

---

## 八、存档兼容性测试

| 场景 | 结果 |
|---|---|
| 正常保存后刷新 | 通过（a7_e2e、shop_e2e、settlement_e2e） |
| 挑战中刷新 | 通过（draft_e2e、session_check） |
| 结算中刷新 | 通过（settlement_e2e） |
| 购买/使用道具后刷新 | 通过（shop_e2e、a7_e2e） |
| Boss 战后刷新 | 通过（boss_battle_e2e、difficulty_e2e） |
| 碎片获得后刷新 | 通过（vault_e2e、story_flow_e2e） |
| 升级后刷新 | 通过（economy_e2e、a7_e2e） |
| 关闭重开 | 通过（identity_e2e、draft_e2e） |
| 旧版本升级 | 通过（`a7_save_check` v1–v10 逐级） |

---

## 九、历史版本迁移测试

`a7_save_check` 对 v1–v10 各版本存档执行迁移 + 规范化：

- 等级/经验合法（1..10、有限数、上限夹取）；
- 贡献点合法（0..1,000,000）；
- 记忆碎片（含 frag-01 创作者碎片）保留；
- Boss 击败记录保留；
- 背包库存保留；
- 关卡完成进度保留；
- 重复迁移不改变贡献点/经验/碎片，不产生重复账本流水；
- v10 存档不会被旧逻辑覆盖。

---

## 十、异常存档测试

`a7_save_check` 覆盖并验证：

| 异常 | 处理 |
|---|---|
| 损坏 JSON | `importSave` 拒绝并返回原因，不白屏 |
| `player: null` | 拒绝导入 |
| 缺字段/缺 progress | 补默认，不崩溃 |
| 负数金币/经验 | 归零；等级由经验推导 |
| NaN/Infinity | 计数归零或丢弃 |
| 超大数值 | 夹到上限（贡献点 100 万 / 经验 1000 万） |
| 负数/小数库存 | 负数丢弃、小数取整 |
| 重复交易记录 | 去重；**状态非法的交易记录直接丢弃**（本轮修复：过去会被猜成成功） |
| 无效碎片 ID | 白名单过滤（档案 + 创世主），不虚增档案解锁 |
| 不存在的关卡 ID | 完成列表/星级/失败计数全部过滤 |
| 不完整挑战会话 | 丢弃或退回进行中 |
| 重复账本/非法账本行 | 去重并丢弃 |
| 非法服务器/知识点/成就/Boss 记录 | 过滤或去重 |

所有异常存档均可进入游戏，未出现白屏、崩溃或负资产。

---

## 十一、PC 与移动端测试结果

| 分辨率 | 结果 |
|---|---|
| 1920×1080 | 无溢出，编辑器 658px，工具栏可用 |
| 1366×768 | 无溢出，编辑器 307px，工具栏可用 |
| 1024×768 | 无溢出，编辑器 345px，工具栏可用 |
| 430×932 | 无溢出，编辑器 630px，底部操作栏可用，5 标签 |
| 390×844 | 无溢出，编辑器 542px，底部操作栏可用，5 标签 |
| 360×800 | 无溢出，编辑器 498px，底部操作栏可用，5 标签 |
| 320×700 | 无溢出，编辑器 398px，底部操作栏可用，5 标签 |

补充：`layout_e2e` 116 条（含横屏、平板 768/1024）全通过；结算面板在 390×844 可滚动且按钮可达（`settlement_e2e`）。

---

## 十二、性能测试结果（Headless Chrome，桌面）

| 指标 | 实测 | 阈值/说明 |
|---|---|---|
| 启动（boot 页 → 主菜单） | 66ms | <12s 断言通过；本地已缓存静态资源 |
| 进入关卡（地图 → 编辑器就绪） | 631–953ms | <15s 断言通过 |
| 打开商店 | 5–8ms（SPA 已加载） | <6s 断言通过 |
| 500 次 localStorage 写入 | 4–7ms | <300ms 断言通过 |
| JS 堆占用 | 20MB / 36MB | <600MB 断言通过 |
| 自动保存 | 500ms 防抖；切关/失焦立即补写 | 未观察到重复写入（draft_check/e2e） |
| Worker | 每次 while 执行后 terminate；递归后降级 | A3 e2e 超时 5.4s 返回，页面可交互 |

说明：以上为无头桌面环境数据，未在低端真机测量；仅代表功能不阻塞，不代表真实设备帧率。

---

## 十三、发现的问题及修复记录

| # | 问题 | 来源 | 修复 |
|---|---|---|---|
| 1 | 负数/小数库存可进入存档（`scan:-2`、`rollback:1.5`） | A7 异常存档 | `normalizeRewards.items` 改为非负整数并去零 |
| 2 | 完成关卡列表重复、含数字/不存在 id | A7 | `normalizePlayerState` 字符串化 + 去重 + 关卡白名单 |
| 3 | 星级可 99 或 -2、含未知关卡 | A7 | 星级夹到 0..3 且只保留合法关卡 |
| 4 | 失败/提示计数可为负或超大 | A7 | 计数夹取 0..999 / 0..99 并过滤未知关卡 |
| 5 | 非法碎片 id 会虚增档案解锁数量 | A7 | 碎片白名单（档案 f1–f8 ∪ 创世主 frag-01–06） |
| 6 | 非法服务器/知识点/成就/Boss 记录残留 | A7 | 白名单过滤 + 去重 |
| 7 | 交易记录 `status` 非法时被“猜”成成功 | A7 | 仅接受 `ok/failed`，其余丢弃 |
| 8 | 缺失意识字段被当成 0（相当于死亡） | A7 | 缺失时默认 100，非法值夹 0..100 |
| 9 | 商店“刷新后道具使用状态”断言依赖 0 值键 | A7 测试 | 归一化后 0 值键被清理，断言改为 `|| 0`（行为更干净） |
| 10 | 桌面分辨率下把隐藏的移动操作栏当作失败 | A7 测试 | 桌面改查工具栏，移动端查底栏 |
| 11 | A4 草稿测试种子 `level 5 / exp 1040` 不一致 | A6/A7 | 改为 `exp 1000`，与等级推导一致 |

以上均为最小范围修复，未改判题、关卡、Boss、碎片规则。

---

## 十四、未解决问题及风险

| 级别 | 事项 | 说明 |
|---|---|---|
| P0 | 无 | 未发现阻断验收的问题 |
| P1 | 真实设备视觉/触控未人工验收 | 仅在 Headless Chrome 模拟视口；真机 Safari/低端 Android 未测 |
| P1 | 本地存档安全边界 | 纯前端 localStorage，能防误操作/重复请求/脏数据，不能防直接改档；不声称服务端防作弊 |
| P2 | 旧碎片 id 与档案 id 有意重叠（f1–f7） | 为不收回旧存档碎片而保留；A7 验证不重复计数，未改规则 |
| P2 | 提示券、Boss 战护盾缺少专项 e2e | 已有实现与回归覆盖，缺独立用例 |
| P2 | 满级后经验继续累积但被上限夹取 | 等级上限设计的自然结果 |
| P2 | 结算面板在小屏需滚动 | 已保证可滚动且按钮可达，属于设计取舍 |

---

## 十五、自动化测试执行数量

| 类别 | 套件数 | 结果 |
|---|---|---|
| 单元/逻辑 | 30 | 全部通过（含 A7 两个新套件） |
| 端到端（浏览器） | 17 | 全部通过 |
| 经济/Boss/碎片专项 | 6 | 全部通过 |
| 构建/类型 | 2 | 通过 |

已统计断言约 **2600+** 条（A7 新增 94+33+51=178 条），另有 `smoke`、`mp_*`、`audit_*` 等脚本内部检查未逐条计入。

---

## 十六、通过 / 失败 / 未执行

- 通过：全部已执行套件（见上表），失败 0。
- 未执行：真实移动设备（iOS/Android）人工验收、低端机性能、跨浏览器（Firefox/Safari）兼容、多人/后端场景——本项目无后端，明确不在范围内。

---

## 十七、TypeScript 检查

`npx tsc --noEmit`：0 错误。

## 十八、生产构建

`npm run build`：成功，`assets/game.js` 963 KB（A6 为 960 KB，A7 新增白名单/测试相关代码）。

---

## 十九、Git 修改文件清单（A7）

| 类型 | 文件 |
|---|---|
| 修改 | `src/services/save.ts`：id 白名单、库存/星级/计数清洗、意识默认值 |
| 修改 | `src/game/rewards.ts`：库存规范化、非法交易状态丢弃 |
| 新增 | `test/a7_save_check.mjs`（94 条） |
| 新增 | `test/a7_integration_check.mjs`（33 条） |
| 新增 | `test/a7_e2e.mjs`（51 条，7 分辨率 + 全链路 + 性能） |
| 修改 | `test/shop_check.mjs`：非法交易记录期望改为丢弃（更严格） |
| 修改 | `test/shop_e2e.mjs`：0 值库存键断言改为 `|| 0` |
| 新增 | `docs/NEXUS-V1.2-A-A7-最终综合回归测试报告.md` |

## 二十、Git 提交记录

| 阶段 | 提交 |
|---|---|
| A1–A6 | `f1c90a9` / `b536df2` / `6d9c802` / `c03ad54` / `7e71fa9` / `09feb07` |
| A7 | 本次提交（见 `git log`） |

---

## 二十一、V1.2-A 最终验收结论

**CONDITIONAL PASS**

- P0 全部通过：启动、主线、关卡、判题、Boss、碎片、存档读写与迁移、货币/经验/库存一致、成功/失败结算、无重复奖励与重复扣款、无数据丢失。
- P1/P2 剩余项均为非阻断：真实设备人工验收未执行、本地存档安全边界、旧碎片 id 兼容说明、提示券/Boss 护盾缺专项 e2e、满级经验上限、小屏结算滚动。
- 未修改判题标准、关卡难度、Boss/碎片规则，未删除任何原有系统。

V1.2-A 可以交付验收；未经批准不进入 V1.3。
