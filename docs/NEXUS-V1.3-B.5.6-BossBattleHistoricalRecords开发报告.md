# NEXUS V1.3-B.5.6 · Boss Battle Historical Records & Performance Archive 开发报告

> 阶段：Boss 战斗历史归档与表现档案  
> 范围：正式归档、历史列表、玩家/Boss 统计、趋势、筛选排序搜索、单场详情、成就时间线、导出、DEV 面板、测试；未实施 B.6。

---

## 1. 项目信息

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》 |
| 项目版本 | `package.json` v1.1.3 |
| Node / npm | Node v24.22.0 / npm 11.19.1 |
| 浏览器 | Google Chrome 158.0.8127.37（Playwright headless） |
| 存档版本 | **v10**（未升级） |
| 证据目录 | `.tmp/b5-archive-evidence/`（10 张真实浏览器截图） |

## 2. Git 状态

- 分支：`feature/v1.2-a-experience-polish`
- HEAD：`85dd5a7`
- 工作区存在 B.1～B.5.5、并行剧情/视觉/经济改动与未跟踪文件；本阶段未提交 Git。
- 未执行 `git reset --hard`、`git clean`、回滚或覆盖并行工作。

## 3. 开发前审查

| 系统 | 位置 | 结论 |
|---|---|---|
| B.5.1 统计 | `bossBattleStats` | 终结快照、battleId、结果/难度/时长/统计/最低意识 |
| B.5.2 评分 | `bossBattleRatings` | 正式 grade/score/dimensions/reasons |
| B.5.3 奖励 | `bossBattleRewards` | rewardId/battleId/实际增量/完整奖励 |
| B.5.4 成就 | `bossAchievements` | 解锁记录/证据/奖励/隐藏 |
| B.5.5 结算 | `bossSettlement` | 只读投影，可复用为历史详情 |
| 现有历史 | `bossBattleStats.history` | 最多 50，且含受上限影响的 eventLog；不能直接承担 200 场长期归档 |
| 终结入口 | `gameStore.submitBossAttack` / death / abandon | 正式 victory/defeat/retreat 均存在 |

结论：新建 compact 正式归档，记录上限 200，累计统计独立保存；历史详情复用 B.5.5 读取层。

## 4. 架构设计

- `bossBattleArchive.ts`：compact 归档记录、累计统计、Boss/难度统计、查询/筛选/排序/分页、趋势、成就历史、详情转换、导出。
- `bossBattleArchiveStore`（同文件实现）：battleId 幂等写入、历史上限、自愈、累计独立。
- `BossBattleArchivePage.tsx`：统计总览、评分/胜率/等级分布、难度/Boss 对比、历史列表、筛选、排序、搜索、分页、Boss 档案、成就历史、详情。
- `BossBattleArchiveDevPanel.tsx`：内存预览 Empty/1/10/200/Overflow/Corrupt，不写存档。
- `BossBattleSettlement` 扩展 `historical` / `archivedAt` / 导出，用于历史详情。

## 5. 数据结构

`BossArchiveRecord`：
- battleId/bossId/bossName/bossCodename/difficulty/result
- startedAt/endedAt/archivedAt/durationMs
- finalPhase/phaseTotal/consciousness/deaths/failureReason
- fragmentTitle/fragmentStatus/fragmentGranted/firstClear
- dataQuality/archiveVersion
- stats：挑战/攻防/弱点/动态/阶段/deaths/phaseRows
- rating：grade/displayScore/totalScore/finalized/dataQuality/version/dimensions/reasons/highlights/weaknesses
- reward：实际/完整/基础/难度/评分/表现/既有偏移/rewardId/grantedAt
- achievements：名称/等级/分类/隐藏/奖励/时间/证据
- strengths/improvements/timeline

不保存完整 eventLog / 大 JSON；`timeline` 仅保存 B.5.1 eventLog 中可识别事件，最多 40 条。

## 6. 归档机制

- 正式 victory/defeat/retreat 终结后自动调用 `archiveBossBattleForPlayer`。
- 胜利在评分、B.5.3 奖励与 B.5.4 成就之后归档，确保快照完整。
- 失败在 closeCombat 后归档；撤退在放弃本场后归档。
- 进行中、DEV 模拟、未终结战斗不归档。
- 同一 battleId 只归档一次；重复终结幂等。
- 归档只读，不发放奖励/解锁成就/修改统计。
- 首次胜利碎片：仅当 `fragmentGranted=true` 时累计 1 个碎片；B.5.3 增量碎片仍为 0。

## 7. 存档兼容

- 新增 `progress.bossBattleArchive`，SAVE_VERSION 保持 **v10**。
- 旧存档补空记录/累计/幂等表/统计映射。
- normalize 过滤非法 battleId/bossId/重复记录/non-finite 数值/非法时间。
- 累计字段有效则保留；缺失或损坏时按现有记录修复，避免归零。
- 不删除 B.5.1～B.5.5 数据、玩家经济、章节进度。

## 8. 历史上限

- `records` 最多 **200**，保留最近 200 场。
- `archivedBattleIds` 最多 **500**。
- 累计 `totals` 独立保存，历史裁剪不减少总场次/胜负/奖励/最佳评分/连胜。
- 成就历史读取 B.5.4 永久解锁，不依赖归档裁剪。

## 9. 总统计

`totals`：
- totalBattles/victories/defeats/retreats
- totalDuration/totalXP/totalContribution/totalCredits/totalFragments
- ratingCount/ratingScoreSum/gradeCounts
- bestScore/bestGrade/fastestVictory/longestBattle
- currentWinStreak/bestWinStreak/updatedAt
- 胜率 = victories / (victories + defeats)；撤退不计入胜率分母。
- 平均分只使用 finalized + complete + grade 的评分。
- 撤退重置当前连胜（项目固定策略 `RETREAT_RESETS_WIN_STREAK=true`）。

## 10. Boss 专属统计

`bossTotals`：
- attempts/victories/defeats/retreats
- ratingCount/ratingScoreSum/bestScore/bestGrade
- fastestVictory/longestBattle
- firstVictoryAt/firstVictoryDifficulty/lastBattleAt
- 页面展示挑战、胜率、最佳/平均评分、最快通关、首胜难度。

`difficultyTotals`：按实际难度统计挑战/胜负/平均/最佳评分。

## 11. 历史列表

- 页面入口：主菜单「战斗档案馆」，路由 `battlearchive`。
- 顶部 NEXUS COMBAT ARCHIVE 总览。
- 战斗卡：Boss、难度、结果、评级/分数、日期、时长、首胜/碎片/成就、完整度。
- 结果配色：胜利青、失败红、撤退琥珀。
- 空状态、N/A、旧记录 LEGACY/INVALID 标记。

## 12. 筛选

支持：
- Boss（动态读取 BOSSES）
- 难度（动态读取 BOSS_DIFFICULTIES）
- 结果 victory/defeat/retreat
- 评级 S/A/B/C/D/无评级
- 成就 unlocked/none
- 组合筛选。

## 13. 排序

- 最新 / 最早 / 最高评分 / 最低评分 / 最快通关 / 最长战斗。
- 稳定二级排序：endedAt/archivedAt + battleId。
- 无评分在最高分排序中靠后、最低分排序中靠后（不伪造 0 分）。

## 14. 搜索

- Boss 名称、Boss ID、battleId。
- 输入即过滤；经纯函数 query 计算，页面 memoization，避免每次渲染全量重算。

## 15. 单场详情

- 点击卡片打开 `BossBattleSettlement` 历史模式。
- 顶部 `HISTORICAL RECORD · 历史战斗档案`。
- 展示 battleId、Boss、难度、结果、开始/结束、时长、归档时间、统计、评分、奖励、成就、总结、时间线。
- 只读：不重新挑战、不发奖励、不解锁、不改存档。
- 支持导出单场 JSON。

## 16. 战斗趋势

- 评分趋势：最近最多 20 场完整正式评分，轻量 SVG 折线。
- 评级分布：S/A/B/C/D/无评级 CSS 条。
- 胜率趋势：全部/最近 10/最近 5，样本不足显示数据不足。
- 难度表现、Boss 表现对比表。
- 不引入重型图表库。

## 17. 成就历史

- 读取 B.5.4 `bossAchievements.unlocked`，与归档裁剪无关。
- 展示名称、等级、分类、解锁时间、Boss、难度、battleId、证据、奖励。
- 支持分类/等级/Boss/排序筛选。
- 仅展示已解锁隐藏成就；未解锁隐藏条件不在档案页暴露。

## 18. 时间线

- 从 B.5.1 eventLog 提取可识别真实事件：战斗开始、阶段转换、挑战成功/失败、弱点发现/破解/暴露、动态事件、攻击取消/打断、玩家死亡。
- 使用真实 occurredAt 与 startedAt 计算相对时间，最多 40 条。
- 无可靠事件时显示“当前历史记录未包含完整事件时间线 / Timeline unavailable”，不伪造。

## 19. 导出

- 单场：`NEXUS_Battle_Archive_<battleId>.json`。
- 总统计/Boss/难度/成就：`NEXUS_Player_Statistics.json`。
- 仅真实数据、只读、不修改存档；不含密码/Token 等私密字段。

## 20. DEV 面板

`BossBattleArchiveDevPanel`：
- 正式归档 / Empty / 1 / 10 / 200 / Overflow / Corrupt。
- 显示记录数、幂等 ID 数、总场次、胜率。
- 预览使用内存 store，不写正式存档。
- 生产构建隐藏（E2E 校验 `.dev-archive-panel` 数量为 0）。

## 21. Unit Test

`node test/boss_battle_archive.test.mjs` → **122 / 122 通过，0 失败**。

覆盖：记录/幂等/累计/等级/连胜/最快最长、Boss/难度统计、查询筛选排序搜索分页、趋势、成就历史、normalize/旧存档/损坏/200 上限/500 ID/裁剪累计保护、详情转换、导出。

## 22. Integration Test

`node test/boss_battle_archive_integration.test.mjs` → **86 / 86 通过，0 失败**。

覆盖：B.5.1→B.5.2→B.5.3→B.5.4→B.5.5→归档全链路、数据一致、幂等只读、存档 v10、旧存档、损坏自愈、失败/撤退归档、裁剪累计保护、历史详情/成就历史。

## 23. E2E Test

`node test/boss_battle_archive_e2e.mjs` → **204 / 204 通过，0 失败**。

覆盖：
- 真实 GATE-01 胜利 → 正式归档/累计/详情
- 真实失败/撤退归档，且无评分/奖励误发
- 档案页统计卡、卡片、历史详情 `HISTORICAL RECORD`、关闭返回
- 搜索、结果筛选、排序
- 刷新恢复归档与总统计
- 移动端无横向溢出、搜索可用
- DEV 10/200/Overflow/Corrupt 预览，不写存档
- 生产隐藏 DEV 面板

截图：`.tmp/b5-archive-evidence/01~10`。

## 24. Regression

| 范围 | 结果 |
|---|---|
| B.5.1 Unit/Integration/E2E | 59/34/45 |
| B.5.2 Unit/Integration/E2E | 73/35/77 |
| B.5.3 Unit/Integration/E2E | 84/50/108 |
| B.5.4 Unit/Integration/E2E | 106/63/134 |
| B.5.5 Unit/Integration/E2E | 105/62/166 |
| B.1～B.4 | 91/156/31、71/308/29、100/108/25、49/146/40 全通过 |
| 全系统 | acceptance 38、boss battle 105、challenge 57、chapter flow 133、economy 44、shop 63、vault 55、reward 37、session 44 |
| layout / save | 116/116、95/95 |

## 25. TypeScript

`npm run typecheck` → **0 错误**。

## 26. Build

`npm run build` → **成功**，`assets/game.js` 约 1740 KB。

## 27. Smoke

`node test/smoke.mjs` → **全部通过**。

## 28. 问题与修复

| 编号 | 严重程度 | 问题 | 根因 | 修复 | 回归结果 |
|---|---|---|---|---|---|
| B5.6-01 | P1 | 损坏的累计字段可能被归零，历史裁剪后总场次错误下降 | normalize 直接接受损坏 totals | totals 无效/小于现有记录数时按可用记录修复，有效累计继续保留 | 单元/集成通过 |
| B5.6-02 | P2 | 归档页 E2E 使用 Page.innerText 导致失败 | 测试 API 使用错误 | 改用 textOf | E2E 通过 |
| B5.6-03 | P2 | 归档详情可能被自动结算覆盖层遮挡 | 页面层叠与既有结算恢复 | 历史详情使用 Portal / 既有 z-index 体系 | E2E 通过 |
| B5.6-04 | P3 | 测试期望与 fixture 等级/数量不一致 | fixture 生成规则 | 修正期望，保持真实数据断言 | 122/86 通过 |

无 P0/P1 遗留（B5.6-01 已修复）。

## 29. 未完成事项

1. **旧存档历史回填**：本阶段归档从 B.5.6 上线后的正式终结开始；历史 `bossBattleStats.history` 未自动批量回填为 200 条归档。旧玩家能看到新战斗归档与 B.5.4 成就历史，但上线前 50 条统计不会自动转换为完整档案。
2. **单场真实高/低评分战斗**：E2E 使用真实 GATE-01 胜利（正常评分）以及失败/撤退；S/D 等档案展示由单元/集成/DEV 预览覆盖，未额外跑多场真实 S/D。
3. **导出下载内容**：按钮和 JSON 生成逻辑已实现，未断言 headless 下载落盘内容。
4. **浏览器矩阵/真机/长时间 soak**：仅 Chrome headless；未做 Firefox/WebKit、真机与小时级运行。
5. **时间线**：依赖 B.5.1 eventLog（最多 40 条）；旧/被裁剪记录可能显示 unavailable，符合不伪造原则。

## 30. 风险

- 200 条 compact 记录会占用 localStorage 空间；已去除大 eventLog/完整快照，并保留 SAVE_VERSION v10。
- 旧存档不回填意味着档案页初期只显示后续新战斗；不影响现有进度/经济/成就。
- 累计统计与归档记录可能因旧存档缺字段而不一致；已采用“有效累计优先、损坏按可用记录修复”策略，不主动用不完整历史覆盖有效累计。
- 归档页只读，不参与奖励/成就/战斗，避免重复领取风险。

## 31. 最终验收

**PASS**

- 正式 victory/defeat/retreat 自动归档，battleId 幂等；200 条上限、500 ID、累计统计独立。
- 历史页、筛选、排序、搜索、分页、Boss 档案、成就历史、趋势、详情、时间线与导出完成。
- 历史详情复用只读结算，不重新发奖/解锁/修改数据。
- 单元 122/122、集成 86/86、E2E 204/204；B.1～B.5.5 与全系统回归通过。
- TypeScript 0 错误、Build 成功、Smoke 通过。
- 无 P0/P1 遗留。

**允许进入 NEXUS V1.3-B.6 · Boss Battle Visual Experience Enhancement**（本阶段未提前实施 B.6）。
