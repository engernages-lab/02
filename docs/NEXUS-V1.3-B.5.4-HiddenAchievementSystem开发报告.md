# NEXUS V1.3-B.5.4 · Hidden Achievement System 开发报告

> 阶段：Boss 战斗隐藏成就系统  
> 范围：成就配置、判定、进度、解锁、奖励、持久化、DEV 面板与测试；未实施 B.5.5 结算 UI 与 B.5.6 历史成绩。

---

## 1. 项目信息

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》 |
| 项目版本 | `package.json` v1.1.3 |
| Node / npm | Node v24.22.0 / npm 11.19.1 |
| 浏览器 | 系统 Google Chrome 158.0.8127.37（Playwright headless） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD | `85dd5a7`（开发期间存在并行 cinematic 提交，未回滚、未覆盖） |
| 存档版本 | 保持 **v10**（未升级） |
| 工作区状态 | 脏工作区：含 B.1～B.5.3、并行剧情/美术/经济改动与未跟踪文件；本阶段未提交 Git |
| 证据目录 | `.tmp/b5-ach-evidence/`（7 张真实浏览器截图） |

---

## 2. 开发前审查

| 系统 | 实际位置 | 现有能力 | 本阶段处理 |
|---|---|---|---|
| B.5.1 统计 | `bossBattleStats.ts` | 终结快照、挑战/攻击/防御/弱点/动态事件、dataQuality | 只读；新增 3 组最小真实统计字段 |
| B.5.2 评分 | `bossBattleRating.ts` | 正式 S/A/B/C/D、finalized、complete | 只读正式评分 |
| B.5.3 奖励 | `bossBattleReward.ts` | 正式奖励记录、battleId 幂等 | 只读联动，不重复发奖 |
| 战斗终结 | `gameStore.submitBossAttack` | 首胜/难度/评分/奖励事务 | 胜利后追加成就判定，同一状态更新 |
| 经济系统 | `exp / rewards.credits / ledger` | 统一经验、贡献点、账本 | 复用；成就奖励独立账本项 |
| 碎片 | `meta.memoryFragments` | 唯一首胜碎片 | 成就奖励 fragments=0，不重复发放 |
| 存档 | `save.ts` | v10 字段级自愈 | 新增 `progress.bossAchievements` |
| 现有成就 | `progress.achievements` | 普通关卡成就 | 与 Boss 隐藏成就分离，不混淆 |

最小必要统计补充（均来自真实战斗事件，不伪造）：
- `minConsciousness`：战斗开始意识值 + 每次真实伤害后的意识值，记录最低值。
- `weaknessStats.discoveredIds / crackedIds`：按真实 weaknessId 去重，用于“不同弱点”成就。
- `dynamicEventStats.successByDef`：按真实动态事件 defId 记录成功次数，用于未知入侵成就。

---

## 3. 新增文件

| 文件 | 职责 |
|---|---|
| `src/game/bossAchievementConfig.ts` | 16 个成就、分类、等级、隐藏、条件、集中奖励、脱敏公共视图 |
| `src/game/bossAchievementEngine.ts` | 纯函数判定、资格、进度、证据、机制不可用、正式评分联动 |
| `src/game/bossAchievementStore.ts` | 解锁/进度/奖励历史持久化、幂等、经济发放、隐藏读取 |
| `src/components/BossAchievementDevPanel.tsx` | DEV 全量成就列表、进度、预览、证据、JSON |
| `test/boss_achievement.test.mjs` | 成就专项测试（106 项） |
| `test/boss_achievement_integration.test.mjs` | B.5.1+B.5.2+B.5.3+经济+存档集成（63 项） |
| `test/boss_achievement_e2e.mjs` | 真实 Chrome + 真实 MicroPython E2E（134 项） |
| `docs/NEXUS-V1.3-B.5.4-HiddenAchievementSystem开发报告.md` | 本报告 |

---

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/game/bossBattleStats.ts` | 增加 `minConsciousness`、弱点 discovered/cracked ID、动态事件 successByDef |
| `src/store/gameStore.tsx` | 伤害事件携带真实意识值；胜利后自动判定/解锁/发奖励 |
| `src/game/types.ts` | `progress.bossAchievements?: BossAchievementStore` |
| `src/services/save.ts` | 默认空成就；读取 normalize；保持 v10 |
| `src/pages/BossBattlePage.tsx` | 挂载 `BossAchievementDevPanel` |
| `public/boss.css` | `.dev-achievement-*` 样式 |

未修改 Boss 核心战斗逻辑、B.5.1 采集规则（仅最小字段补充）、B.5.2 评分规则、B.5.3 奖励规则、商品/商城/章节/并行剧情文件。

---

## 5. 成就配置

共 16 个成就（≥15）。奖励：Bronze 30/15、Silver 50/25、Gold 80/40、Platinum 120/60（XP/贡献点），碎片统一 0。

| ID | 名称 | 分类 | 等级 | 隐藏 | 条件 |
|---|---|---|---|---|---|
| boss_perfect_defense | 完美防线 | survival | Gold | 是 | 伤害=0、死亡=0、正式胜利 |
| boss_last_stand | 最后一线生机 | survival | Silver | 是 | 最低意识≤20、正式胜利 |
| boss_no_death | 零死亡者 | survival | Bronze | 否 | 死亡=0、正式胜利 |
| boss_clutch_survivor | 极限生还 | survival | Gold | 是 | 最低意识≤15 + 防御/闪避≥1 |
| boss_code_master | 代码大师 | challenge | Silver | 否 | 判题≥3、全通过、invalid=0 |
| boss_perfect_streak | 连续修复者 | challenge | Silver | 否 | 最长连续成功≥5 |
| boss_first_try | 一次通过 | challenge | Bronze | 否 | 判题≥3、失败=0、invalid=0 |
| boss_dodge_master | 无伤战术家 | tactics | Silver | 否 | 真实闪避成功≥3 |
| boss_defense_master | 绝对防御 | tactics | Silver | 否 | 真实防御成功≥3 |
| boss_counter_master | 以攻代守 | tactics | Gold | 是 | 真实弱点打断攻击≥1 |
| boss_weakness_hunter | 弱点猎人 | weakness | Bronze | 否 | 发现弱点≥1 |
| boss_weakness_master | 弱点专家 | weakness | Gold | 否 | 不同弱点破解≥2 |
| boss_weakness_exploit | 致命破绽 | weakness | Silver | 是 | 破解 + 真实 Boss HP 伤害>0 |
| boss_crisis_responder | 危机解除 | crisis | Silver | 否 | 动态事件成功≥1 |
| boss_intrusion_destroyer | 入侵终结者 | crisis | Gold | 是 | `unknown-intrusion` 成功≥1 |
| boss_rating_s | 卓越执行 | combat | Platinum | 否 | 正式评分 S |

每个成就包含：ID、名称、描述、分类、等级、隐藏状态、图标、条件、奖励、目标数。

---

## 6. 判定算法

### 6.1 数据来源
- B.5.1 最终统计快照（victory、finalized、dataQuality）。
- B.5.2 正式评分（仅 S 成就；要求 finalized、complete、battleId/version 一致）。
- B.5.3 奖励记录（只读，用于证据/关联，不重复发奖）。

### 6.2 正式资格
同时满足：
1. battleId/bossId 有效
2. `battleResult === victory`
3. `stats.finalized === true`
4. `stats.dataQuality === complete`
5. 输入不是 DEV/模拟来源（正式调用只来自真实胜利事务）
6. 成就条件全部满足
7. 尚未解锁

partial/invalid/进行中/失败/撤退均不产生正式成就，并记录拒绝原因。

### 6.3 判定与进度
- 纯函数遍历配置，各条件返回 `value/target/completed/applicable`。
- 计数条件进度可直接展示（连续 5、闪避 3、不同弱点 2 等）。
- 二值条件进度为 0/1。
- 进度只在正式终结判定后写入，避免战斗过程中频繁扫描/写存档。
- 证据只保存最小真实字段：挑战/判题/连续、死亡、伤害、最低意识、防御/闪避、弱点、动态事件、评分等级。

### 6.4 机制不可用
- 无弱点机制 → 弱点类成就 `mechanic-unavailable`，不判失败。
- 无动态事件 → 危机类成就 `mechanic-unavailable`。
- 无攻击/无操作 → 战术类成就 `mechanic-unavailable`。
- 缺少最低意识历史 → `data-missing`，不伪造“最后一线生机”。

---

## 7. 隐藏机制

- 配置包含 `hidden` 标记。
- `publicBossAchievementViews` 对未解锁隐藏成就返回脱敏视图：名称/描述/分类/等级/奖励均为 `null`。
- 解锁后展示完整信息。
- DEV 面板通过 `includeHiddenSecrets=true` 查看全部。
- 不提供普通 UI 直接读取隐藏条件的接口；正式成就展示留给 B.5.5。

---

## 8. 奖励

- 每个成就配置独立 XP/贡献点，fragments 固定 0。
- 纯计算：`calculateBossAchievementReward`，总上限 XP 1200 / 贡献点 600。
- 发放：`evaluateAndApplyBossAchievements`：
  - 同一 battleId 评测事件去重（`achievement-eval:<battleId>`）。
  - 同一 achievementId 只解锁/领取一次。
  - 解锁记录 `rewardGranted=true`、`rewardGrantedAt`。
  - 复用 XP、贡献点、等级、等级解锁与账本。
  - 不新增货币；不重复发放创世主碎片。
- 与 B.5.3 Boss 奖励使用不同账本 ref（`achievement:<id>`），互不覆盖。

---

## 9. 存档

新增：

```ts
progress.bossAchievements = {
  unlocked: [],            // 永久解锁，最多 200
  progress: [],            // 最多 300
  rewardHistory: [],       // 最多 200
  eventDeduplication: [],  // 最多 500
}
```

- 存档版本保持 **v10**。
- 旧存档缺失自动补空。
- normalize：校验成就 ID、去重 achievementId/rewardId/eventId、夹取时间与进度、过滤非法证据。
- 永久解锁状态不因历史裁剪丢失（当前 16 个，上限 200）。
- 不修改 B.5.1 统计、B.5.2 评分、B.5.3 奖励、XP、贡献点、碎片或章节进度。

---

## 10. DEV 面板

`BossAchievementDevPanel`：
- 全量成就（含隐藏）、ID、名称、分类、等级、隐藏状态、解锁状态、进度/目标、解锁时间、奖励
- 当前 battleId、完整性、已解锁数量
- 重算预览：判定资格、新解锁、拒绝原因、真实证据
- 导出 JSON、查看成就存储 JSON
- 生产构建隐藏（E2E 校验 `.dev-achievement-panel` 数量为 0）
- 预览不写正式解锁、不发奖励

---

## 11. 测试结果

### 11.1 成就专项

| 命令 | 通过 / 总数 | 失败 |
|---|---|---:|
| `node test/boss_achievement.test.mjs` | **106 / 106** | 0 |
| `node test/boss_achievement_integration.test.mjs` | **63 / 63** | 0 |
| `node test/boss_achievement_e2e.mjs` | **134 / 134** | 0 |

覆盖：16 成就、条件边界、隐藏、进度、证据、complete/partial/invalid/missing、mechanicUnavailable、victory/defeat/retreat/active、正式评分 S/A/缺失、幂等、奖励、存档自愈、历史/事件去重、经济发放。

### 11.2 B.5.1～B.5.3 回归

| 命令 | 结果 |
|---|---|
| `node test/boss_battle_stats.test.mjs` | 59 / 59 |
| `node test/boss_battle_stats_integration.test.mjs` | 34 / 34 |
| `node test/boss_battle_stats_e2e.mjs` | 45 / 45 |
| `node test/boss_battle_rating.test.mjs` | 73 / 73 |
| `node test/boss_battle_rating_integration.test.mjs` | 35 / 35 |
| `node test/boss_battle_rating_e2e.mjs` | 77 / 77 |
| `node test/boss_battle_reward.test.mjs` | 84 / 84 |
| `node test/boss_battle_reward_integration.test.mjs` | 50 / 50 |
| `node test/boss_battle_reward_e2e.mjs` | 108 / 108 |

### 11.3 B.1～B.4 回归

| 命令 | 结果 |
|---|---|
| boss_phase_engine / integration / e2e | 91/91、156/156、31/31 |
| boss_attack_engine / integration / e2e | 71/71、308/308、29/29 |
| boss_weakness_engine / integration / e2e | 100/100、108/108、25/25 |
| combat_arbiter / integration / e2e | 49/49、146/146、40/40 |

### 11.4 全系统

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

### 11.5 TypeScript / Build / Smoke

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | 0 错误 |
| `npm run build` | 成功，`assets/game.js` 约 1627 KB |
| `node test/smoke.mjs` | 全部通过 |

---

## 12. 问题与修复

| 编号 | 严重程度 | 问题 | 根因 | 修复 | 回归结果 |
|---|---|---|---|---|---|
| B5.4-01 | P1 | 隐藏成就公共视图最初使用动态 `require` | 企图延迟加载配置，浏览器 ESM 不可用 | 改为静态 import | TypeScript/Build/E2E 通过 |
| B5.4-02 | P2 | 存档 normalize 原地排序输入 | 直接对 `src.unlocked` 排序 | 克隆后排序 | 单元存档测试通过 |
| B5.4-03 | P2 | 成就奖励上限低于全解锁总和，累计与逐条记录可能不一致 | 初版上限 600/300 | 调整为 1200/600，覆盖全部成就 | 单元/集成通过 |
| B5.4-04 | P2 | 集成夹具缺少真实弱点打断事件，误判“以攻代守” | 测试夹具不完整 | 增加真实 attack-interrupted 事件 | 集成 63/63 |
| B5.4-05 | P3 | 测试断言数初版不足 100/60 | 覆盖拆分为条件断言 | 补充配置、边界、进度、自愈断言 | 106/63 |

无 P0 问题，无 B.5.4 相关 P1 遗留。

---

## 13. 未完成事项

1. **真实浏览器逐项触发全部 16 个成就**：E2E 真实战斗验证了零死亡、弱点猎人等成就与自动解锁/奖励/刷新；完美防线、挑战计数、防御/闪避 3 次等由单元/集成真实统计覆盖，DEV 面板可全量预览，未为每个成就单独跑一场浏览器战斗。
2. **最低意识历史**：新战斗开始记录初始意识，真实伤害更新最低值；旧存档历史快照没有该字段，不追溯解锁“最后一线生机/极限生还”。
3. **隐藏成就正式展示 UI**：按阶段范围未开发，留给 B.5.5；公共脱敏 API 已就绪。
4. **历史上限（200/300/500）**：单元/集成覆盖，未在浏览器累计到上限。
5. **DEV JSON 下载内容**：按钮/导出逻辑验证，未断言 headless 下载落盘内容。
6. **浏览器矩阵 / 真机 / 长时间 soak**：仅 Chrome，未做人工设备与数小时连续战斗。
7. **成就碎片奖励**：按现有唯一碎片机制固定为 0，避免与首胜碎片重复；未新增碎片经济。

以上均不阻塞 B.5.4 核心目标。

---

## 14. 最终验收

**PASS**

- 16 个成就配置、判定、隐藏、进度、证据、自动解锁、永久记录、奖励与幂等完整。
- 正式统计/评分联动正确；partial/invalid/失败/撤退不产生正式成就；系统取消/抢占不误判。
- 成就奖励复用现有经济，重复评测/刷新/存档恢复不重复发放；碎片不重复。
- 存档保持 v10，B.5.1～B.5.3 数据完整。
- 成就单元 106/106、集成 63/63、真实浏览器 E2E 134/134；B.1～B.5.3 与全系统回归通过。
- TypeScript 0 错误、Build 成功、Smoke 通过。
- 未提前实施 B.5.5/B.5.6。

**允许进入 NEXUS V1.3-B.5.5 · Boss Battle Settlement UI**。
