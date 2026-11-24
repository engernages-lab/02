# NEXUS V1.3-B.5.2 · Boss 战斗评价算法开发报告

> 阶段：Boss Battle Performance Rating Engine  
> 范围：仅评分算法、评分配置、评分持久化、DEV 评分预览与测试；未实施 B.5.3 奖励、B.5.4 隐藏成就、B.5.5 结算 UI、B.5.6 历史成绩系统。

---

## 1. 项目信息

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》 |
| 项目版本 | `package.json` v1.1.3 |
| Node / npm | Node v24.22.0 / npm 11.19.1 |
| 浏览器 | 系统 Google Chrome 158.0.8127.37（Playwright headless） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD | `5647e74`（开发期间存在并行 cinematic 提交，未回滚、未覆盖） |
| 存档版本 | 保持 **v10**（未升级） |
| 工作区状态 | 脏工作区：含 B.1～B.5.1、并行剧情/美术/经济改动与未跟踪文件；本阶段未提交 Git |
| 证据目录 | `.tmp/b5-rating-evidence/`（7 张真实浏览器截图） |

开发期间 `src/pages/StoryPage.tsx` 曾被并行工作临时改为“结局 · 永恒秩序”，导致一次 smoke 在序章步骤失败；并行提交恢复序章后，最终 `node test/smoke.mjs` 通过。本阶段未修改该文件。

---

## 2. 开发前审查

| 审查项 | 实际位置 | 当前能力 | 本阶段处理 |
|---|---|---|---|
| B.5.1 统计快照 | `src/game/bossBattleStats.ts` | 只读终结快照、dataQuality、五维统计 | 作为唯一输入，不重新采集 |
| `finalizeBossBattleStats` | 同上 | 终结即锁定、深拷贝 | 读取时只读，不修改 |
| `calculateBossBattleSummary` | 当前工作区不存在独立函数 | 统计快照本身即摘要 | 未重复实现 |
| `phaseStats` | 同上 | 各阶段时长/伤害/挑战/弱点 | 评分不直接用阶段数量做加减分 |
| `challengeStats` | 同上 | submitted/judged/passed/failed/runtime/invalid/streak/keyCrack | 通过率归一化 |
| `attackStats` | 同上 | telegraph/started/hit/blocked/cancelled/interrupted/damage/shield | 生存与战术的真实来源 |
| `defenseStats` | 同上 | 防御/闪避成功与失败 | 战术操作成功率 |
| `weaknessStats` | 同上 | 发现/破解/暴露/伤害/取消 | 弱点评分与公平性归一化 |
| `dynamicEventStats` | 同上 | 触发/成功/失败/超时/系统取消/终结清理 | 仅玩家可处理事件进入危机评分 |
| `save.ts` | `src/services/save.ts` | v10 字段级自愈 | 新增评分存储，不升版本 |
| 战斗终结 | `gameStore.submitBossAttack` → `closeCombatForPlayer` | 先终结统计再发奖励 | 胜利后基于最终快照生成评分 |
| 现有评分/Rank | 无 | 仅奖励等级 `Grade`（关卡评价），与 Boss 表现评价无关 | 未复用、未冲突，新建独立评分体系 |
| Boss/难度差异 | `bossPhasePlans`、`bossWeaknessCatalog` | 阶段数/弱点数/难度不同 | 弱点按真实定义数量归一化；阶段数量不直接计分 |

确认：统计快照只读；B.5.1 已有历史存储与 50 上限；不同 Boss 的挑战/阶段/弱点数量不同；当前无 Boss 战斗评分逻辑。

---

## 3. 新增文件

| 文件 | 职责 |
|---|---|
| `src/game/bossBattleRatingConfig.ts` | 五维权重、子项上限、死亡惩罚、等级阈值、展示分规则、历史上限 |
| `src/game/bossBattleRating.ts` | 评分纯函数、维度计算、缺失数据处理、动态权重、等级、依据/亮点/不足、稳定摘要、评分存储 normalize/record/find |
| `src/components/BossRatingDevPanel.tsx` | DEV 只读评分面板：正式评分/重算预览、维度/权重/可用性、等级、依据、JSON、输入快照 |
| `test/boss_battle_rating.test.mjs` | 评分算法/边界/公平性/持久化专项测试（73 项） |
| `test/boss_battle_rating_integration.test.mjs` | B.5.1 快照、存档 v10、持久化、幂等、partial/invalid 集成测试（35 项） |
| `test/boss_battle_rating_e2e.mjs` | 真实 Chrome + 真实 MicroPython 端到端测试（77 项） |
| `docs/NEXUS-V1.3-B.5.2-Boss战斗评价算法开发报告.md` | 本报告 |

---

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/game/types.ts` | `progress.bossBattleRatings?: BossBattleRatingStore` 兼容字段 |
| `src/services/save.ts` | 默认空评分存储；读取时 normalize，保留 B.5.1 统计；保持 v10 |
| `src/store/gameStore.tsx` | 胜利终结后基于最终统计快照生成评分并写入；异常不影响战斗；评分存储 helper |
| `src/pages/BossBattlePage.tsx` | 挂载 `BossRatingDevPanel` |
| `public/boss.css` | `.dev-rating-*` 只读面板样式 |

未修改 B.1～B.5.1 的战斗、统计、奖励或判题逻辑；未触碰并行剧情/美术文件。

---

## 5. 评分体系

### 5.1 权重

| 维度 | 权重 | 组成 |
|---|---:|---|
| 生存表现 | 25 | 攻击规避 15 + 死亡惩罚 10 |
| 代码挑战 | 30 | 通过率 26 + 连续成功 2 + 关键破解 2 |
| 战术操作 | 20 | 防御成功率 12 + 闪避成功率 8 |
| 弱点破解 | 15 | 发现 5 + 破解成功率 8 + 利用 2 |
| 危机处理 | 10 | 玩家可处理事件成功率 10 |
| 合计 | **100** | 配置集中，单元测试校验 |

### 5.2 公式

- **生存**
  - 可判定攻击结果 `outcomes = hitCount + blockedCount + dodgeSuccessCount`
  - 攻击规避 `15 × (1 − hitCount / outcomes)`
  - 死亡惩罚 `max(0, 10 − 5 × deaths)`
  - 项目没有可靠的 `expectedDamageBaseline`：不使用“固定伤害扣固定分”，改用真实攻击结果的命中率归一化；实际伤害、护罩吸收仅用于评分依据，不重复扣分。
  - 无攻击证据 → `mechanicUnavailable`；有伤害/死亡但缺少可判定结果 → 部分子项缺失，评分降为 partial。
- **代码挑战**
  - `passRate = passed / judged`，通过分 `26 × passRate`
  - 连续分 `2 × (maxConsecutive / judged)`（上限 2）
  - 关键破解 `keyCrackSuccess ? 2 : 0`（无该记录不扣分）
  - `judged = 0` → `dataMissing`，不自动满分。
- **战术**
  - 防御 `12 × defenseSuccess / (defenseSuccess + defenseFailed)`
  - 闪避 `8 × dodgeSuccess / (dodgeSuccess + dodgeFailed)`
  - 无某子项尝试时不重新分配该子项分数，标记 partial；有攻击但完全没有操作 → 真实 0 分；没有攻击且没有操作 → `mechanicUnavailable`。
  - 攻击取消/弱点中断/动态抢占不计入防御或闪避成功。
- **弱点**
  - Boss 真实弱点数量由 `weaknessDefinitionsFor(bossId, difficulty)` 得出。
  - 发现 `5 × min(discovered / definitions, 1)`（不同弱点数量归一化）
  - 破解 `8 × success / (success + failed)`；无有效尝试为 0；未结算提交标记 partial。
  - 利用：暴露且有额外 Boss 伤害 → 2；仅暴露 → 1；未利用 → 0。
  - 无弱点机制 → `mechanicUnavailable`；系统/抢占取消只记原因，不算失败。
- **危机**
  - `eligible = success + failed + timeout`（被 P2 抢占、P0/P1 清理、刷新恢复不计入玩家失败）
  - `10 × success / eligible`
  - 未触发事件或仅系统取消 → `mechanicUnavailable`；有触发但无法归属玩家 → `dataMissing`。
- **总分**
  - `availableWeight = Σ可评分维度权重`
  - `totalScore = Σ可评分维度得分 × 100 / availableWeight`
  - 缺失机制/数据不自动满分、不自动零分；`mechanicUnavailable` 与 `dataMissing` 均不参与总分，后者额外降低完整性。
  - 维度得分保留两位小数；展示分四舍五入为整数。

---

## 6. 数据完整性

| 状态 | 处理 |
|---|---|
| `complete` | 统计与各可用维度均完整；胜利时生成正式评分 `finalized=true` |
| `partial` | B.5.1 快照 partial、战斗未终结、存在 dataMissing 或子项不完整；生成临时评分 `finalized=false` |
| `invalid` | 输入缺少 battleId/bossId、stat dataQuality=invalid、没有可评分维度；返回 invalid，写入被拒绝 |
| `mechanicUnavailable` | Boss 无该机制（无弱点定义、无攻击、无动态事件、仅系统取消）；不参与总分，不降低完整性 |
| `dataMissing` | 机制存在但缺少可靠数据；不参与总分，整体降为 partial，禁止正式评分 |

权重处理：
- 机制不存在 → 按可用权重归一化，不惩罚玩家。
- 数据缺失 → 同样排除并归一化，但 `finalized=false`，后续 B.5.3 必须识别为临时/不完整。
- `scoreBreakdown` 记录可用权重、有效权重、子项分数与缺失原因。
- 评分不修改输入快照；DEV 预览不写入正式评分。

---

## 7. 评分等级

| 等级 | 展示分 | 名称 |
|---|---:|---|
| S | 90～100 | 卓越 |
| A | 80～89 | 优秀 |
| B | 70～79 | 良好 |
| C | 60～69 | 合格 |
| D | 0～59 | 待提升 |

- 展示分 = `Math.round(clamp(totalScore, 0, 100))`，等级基于展示分判定。
- 89.5 → 90 → S；79.5 → 80 → A；59.9 → 60 → C，保证显示分与等级一致。
- 分数 0 为 D；超过 100 钳制为 100；负数钳制为 0。

---

## 8. 评分输出

`BossBattleRating` 包含：
- `battleId / bossId / battleResult / ratingId / ratingVersion / ratedAt`
- `totalScore / displayScore / grade`
- `dimensionScores`：每维得分、满分、是否可用、可用性、partial、权重、有效权重、子项
- `dimensionWeights / dimensionEffectiveWeights / dimensionAvailability`
- `dataQuality / scoreBreakdown`
- `performanceHighlights / performanceWeaknesses / ratingReasons`
- `sourceStatsHash`（8 位稳定摘要，非加密哈希）
- `finalized`

解释文案全部由真实统计字段生成，例如“代码挑战通过 9 / 10，成功率 90%”“本场未发生死亡”“成功防御 3 次”“弱点破解取消 1 次，系统取消不计为失败”。

---

## 9. 幂等

- `ratingId = rating:<battleId>:<ratingVersion>`；同一战斗同一算法版本只生成一份正式评分。
- 同一 `ratingId` 重复写入被拒绝（`duplicate`）。
- 正式评分已存在时，不生成第二份正式评分（`battle-already-rated`）。
- 临时 partial 评分可被后续正式评分替换；正式历史不被新评分覆盖。
- 刷新/重复结算：评分已持久化，不重复计算或累计。
- 评分配置版本 `v1.0.0` 随评分保存；算法升级不自动修改历史。
- 失败/撤退评分 `finalized=false` 且不写入正式历史。

---

## 10. 存档

- 新增 `progress.bossBattleRatings = { history: BossBattleRating[] }`。
- 默认空存储；旧存档缺失时补空，不重置玩家进度、不删除 B.5.1 统计、不破坏 B.1～B.4。
- 存档版本保持 **v10**。
- 评分历史最多 50 条，按 `ratedAt` 清理最旧。
- normalize 丢弃非法/空 battleId/无效 dataQuality/非胜利评分，去重 `ratingId`，同一战斗只保留一份正式评分。
- 损坏评分不影响统计快照、战斗状态、奖励或章节进度。

---

## 11. DEV 调试

`BossRatingDevPanel`（仅 DEV）：
- 正式评分/重算预览切换
- 总分、展示分、等级、数据完整性、算法版本、统计摘要
- 每维得分/满分、原权重、有效权重、可评分状态、子项不完整
- 等级阈值、评分依据、表现亮点、表现不足
- 评分计算明细 JSON、输入统计快照 JSON、导出评分 JSON

边界：
- 生产构建不显示（E2E 校验 `.dev-rating-panel` 数量为 0）
- 预览只计算，不写入正式评分、不修改统计、不触发奖励
- 模拟/缺失数据明确标记，不冒充真实成绩

---

## 12. 测试结果

### 12.1 评分专项

| 命令 | 结果 |
|---|---|
| `node test/boss_battle_rating.test.mjs` | **73 / 73 通过 ✅** |
| `node test/boss_battle_rating_integration.test.mjs` | **35 / 35 通过 ✅** |
| `node test/boss_battle_rating_e2e.mjs` | **77 / 77 通过 ✅** |

覆盖：100/0 分、S/A/B/C/D 边界、89.5/90、79.5/80、59.9/60、分数钳制、非法输入、无判题/无防御/无闪避/无弱点/无动态事件、partial/invalid、mechanicUnavailable/dataMissing、动态权重、权重总和、维度专项、公平性（挑战数量/弱点数量/阶段数量/难度）、相同输入一致性、输入不变、评分持久化/幂等/历史上限、存档自愈。

### 12.2 E2E 场景

`node test/boss_battle_rating_e2e.mjs` 使用真实 Chrome + 真实 MicroPython：
1. GATE-01 完整战斗（判题失败 + 成功、防御、闪避、受伤、阶段、弱点）
2. 胜利生成统计快照与 1 份正式评分
3. 评分 battleId/版本/总分/等级/五维/依据/摘要校验
4. 刷新后评分仍 1 份，分数与 ratedAt 不变
5. 刷新不重复发放经验/贡献点/碎片
6. Boss 失败：无正式评分
7. 撤退：无正式评分
8. 生产构建隐藏评分 DEV 面板
9. DEV 面板显示正式评分/依据/版本/导出按钮
10. DEV 重算预览不覆盖正式评分，并标记临时预览
11. 浏览器内 partial 快照：临时评分 + 数据缺失，不写正式评分
12. 浏览器内 invalid 快照：无效评分 + 原因，不写正式评分

证据：
- `.tmp/b5-rating-evidence/01-live-battle.png`
- `.tmp/b5-rating-evidence/02-victory.png`
- `.tmp/b5-rating-evidence/03-dev-stats-panel.png`
- `.tmp/b5-rating-evidence/04-death.png`
- `.tmp/b5-rating-evidence/05-retreat.png`
- `.tmp/b5-rating-evidence/06-weakness-preempted.png`
- `.tmp/b5-rating-evidence/07-dev-rating-panel.png`

### 12.3 B.1～B.5.1 回归

| 命令 | 结果 |
|---|---|
| `node test/boss_phase_engine.test.mjs` | 91 / 91 |
| `node test/boss_phase_integration.test.mjs` | 156 / 156 |
| `node test/boss_phase_e2e.mjs` | 31 / 31 |
| `node test/boss_attack_engine.test.mjs` | 71 / 71 |
| `node test/boss_attack_integration.test.mjs` | 308 / 308 |
| `node test/boss_attack_e2e.mjs` | 29 / 29（首次因 Vite 未就绪失败，重跑通过） |
| `node test/boss_weakness_engine.test.mjs` | 100 / 100 |
| `node test/boss_weakness_integration.test.mjs` | 108 / 108 |
| `node test/boss_weakness_e2e.mjs` | 25 / 25 |
| `node test/combat_arbiter.test.mjs` | 49 / 49 |
| `node test/combat_arbiter_integration.test.mjs` | 146 / 146 |
| `node test/combat_arbiter_e2e.mjs` | 40 / 40 |
| `node test/boss_battle_stats.test.mjs` | 59 / 59 |
| `node test/boss_battle_stats_integration.test.mjs` | 34 / 34 |
| `node test/boss_battle_stats_e2e.mjs` | 45 / 45（一次 44/45 波动，重跑通过） |

### 12.4 全系统回归

| 命令 | 结果 |
|---|---|
| `node test/smoke.mjs` | **冒烟测试全部通过** |
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

### 12.5 TypeScript / Build / Smoke

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | 0 错误 |
| `npm run build` | 成功，`assets/game.js` 约 1557 KB |
| `node test/smoke.mjs` | 全部通过（当前 HEAD） |

说明：开发中 smoke 曾因并行 `StoryPage` 临时改为“结局 · 永恒秩序”失败；并行提交恢复序章后通过。B.2/B.5.1 E2E 各有一次端口/时序波动，独立重跑通过。

---

## 13. 问题与修复

| 编号 | 严重程度 | 问题 | 根因 | 修复 | 回归结果 |
|---|---|---|---|---|---|
| B5.2-01 | P1 | 失败/撤退评分理论上可进入持久化历史 | 评分输出未携带战斗结果，store 只检查 dataQuality | 增加 `battleResult`；仅 `victory` 可写入；normalize 过滤非胜利 | 集成测试 + E2E 失败/撤退均无正式评分 |
| B5.2-02 | P2 | DEV 点击“重算预览”后仍显示“正式” | 预览复用正式快照的 `finalized=true` | 面板在 `preview` 状态明确显示“临时预览” | E2E 77/77 |
| B5.2-03 | P2 | 多场评分时 “最近评分” 可能返回最早正式评分 | `find` 返回首个 finalized | 改为返回最后一个正式评分 | 单元测试通过 |
| B5.2-04 | P2（外部） | smoke 序章步骤失败 | 并行工作把 `StoryPage` 临时改为结局演出 | 未覆盖并行文件；等待并行提交恢复序章后重跑 | 最终 smoke 通过 |
| B5.2-05 | P3 | B.2 E2E 一次 Vite 未就绪 | 端口/启动时序 | 独立重跑 | 29/29 通过 |
| B5.2-06 | P3 | B.5.1 E2E 一次 44/45 | 战斗时序/动态事件波动 | 独立重跑 | 45/45 通过 |

无 P0 问题，无 B.5.2 相关 P1 遗留。

---

## 14. 未完成事项

1. **无弱点/无动态事件的浏览器级真实 Boss 战**：当前可选 Boss 均配置了弱点，动态事件触发随机；这两类机制缺失由单元/集成测试覆盖，未做专门浏览器战斗。
2. **不同 Boss 的浏览器级评分对比**：K-0 等需要终章进度；当前 E2E 使用 GATE-01，不同难度通过 DEV partial 快照（hard）与集成测试覆盖。
3. **评分 JSON 下载内容**：已验证按钮与导出逻辑；headless 下载落盘内容未单独断言。
4. **50 条评分历史上限**：单元测试覆盖；未在浏览器连续完成 50 场真实战斗。
5. **浏览器矩阵**：仅系统 Chrome；未运行 Firefox/WebKit。
6. **人工设备验收**：移动端布局由 `layout_e2e` 116/116 覆盖，未做真机人工验收。
7. **长时间 soak**：未做数小时连续战斗/评分压力测试；当前为增量计算与历史上限。

以上均不阻塞 B.5.2 核心目标。

---

## 15. 最终验收

**PASS**

- 五维评分、权重、缺失机制/数据策略、等级边界、可解释输出、评分持久化、幂等、历史保护、DEV 面板均已实现。
- 评分单元 73/73、集成 35/35、真实浏览器 E2E 77/77；B.1～B.5.1 与全系统回归通过。
- `npm run typecheck` 0 错误、`npm run build` 成功、`node test/smoke.mjs` 通过。
- 未提前实现 B.5.3 奖励/B.5.4 成就/B.5.5 结算 UI/B.5.6 历史成绩系统。
- 无 P0 问题，无 B.5.2 相关 P1 遗留。

**允许进入 B.5.3**（奖励计算可读取 `progress.bossBattleRatings`，并必须检查 `finalized` 与 `dataQuality`）。
