# NEXUS V1.2-A · A1 挑战页代码自动保存与恢复 · 开发报告

> 阶段：V1.2-A / A1（仅本阶段，A2–A7 未开始）
> 分支：`feature/v1.2-a-experience-polish`
> 基线：main @ 7dbd565（A0 复审通过，工作区干净）

---

## 一、阶段目标与验收对照

| 验收要求 | 实现 | 验证 |
|---|---|---|
| 玩家输入代码后自动保存 | 输入停止 500ms 防抖写入 | 单测 `draft_check` 防抖 5 条 |
| 每个关卡独立保存 | key 含 levelId，关与关物理隔离 | 单测 5 条 + E2E 切关 3 条 |
| 每个玩家存档独立保存 | key 含 `identity.createdAt` 命名空间 | 单测 5 条 + E2E 第十轮 |
| 刷新页面自动恢复 | 进入关卡读草稿即载入 | E2E 第九轮 |
| 切换关卡前保存 | 切关 flush + 防抖器 cleanup flush | 单测 flush/cancel + E2E 第五轮 |
| 支持手动保存 | 「💾 保存草稿」立即落盘（强制刷新时间） | 单测 force + E2E 第四轮 |
| 支持手动清除草稿 | 二段确认后删除本关草稿并回初始版 | E2E 第六轮 |
| 显示保存状态 | 状态胶囊：未保存 / 保存中 / 已保存 / 保存失败 / 已清除 + 保存时间 + 当前行数 | E2E 多轮 |
| 恢复最近一次有效草稿 | 「恢复草稿」+「恢复上一版」（历史最多 8 版） | 单测历史 + E2E 第三轮 |
| 保存异常不静默丢失 | 写失败返回 ok=false，显示失败态 +「复制代码」兜底 + 备份 key | 单测 5 条 |
| 不同关卡草稿不相互覆盖 | 每关独立 key，无共享写 | 单测 + E2E 第五轮 |
| 已完成关卡可查看最终代码 | 真实判题通过时记录 passedCode，「查看通关代码」预览（不覆盖草稿） | E2E 第二轮 |
| 重复进入可自选草稿 / 初始代码 | 默认自动恢复草稿，「改用初始代码」显式切换（旧内容入历史） | E2E 第二/三轮 |
| 不影响真实 MicroPython 判题 | 未改 judge / pythonRunner，只改挑战页与独立草稿层 | verify 71/71 + mp 71/71 + Boss 105/105 |
| 不覆盖通关记录 | 草稿独立 localStorage，不写 progress | E2E 第八轮 |

---

## 二、关键设计

### 1. 存储结构（独立版本化，不升存档版本）

主存档保持 v7 不变；草稿走独立 localStorage：

```
nexus_draft_v1:<namespace>:<levelId>  ->  {
  v: 1,                                  // 草稿结构版本
  code: "<玩家当前代码>",
  updatedAt: 1700000000000,
  passedCode?: "<真实判题通过的代码>",
  passedAt?: 1700000000000,
  history: [{ code, at }, ...]            // 旧→新，最多 8 条
}
```

- `namespace` = `p<identity.createdAt>`：同一存档稳定，开新游戏 / 导入其它存档自动隔离。
- 每关一个 key：写入互不影响，单关损坏也不拖累其它关。
- 只保存玩家自己的代码与真实通过的那一版，**不保存答案、隐藏用例、判题内部数据**。

### 2. 保存时机

| 时机 | 行为 |
|---|---|
| 输入 | 500ms 防抖（再次输入重置计时） |
| 切关 / 组件卸载 | 防抖器 cleanup `flush()` 同步写入 |
| 窗口失焦 / 切后台 / 关页 | `blur` / `visibilitychange` / `beforeunload` 立即写入 |
| 手动保存 | 立即写入并强制刷新保存时间（内容未变也更新） |
| 判题通过 | 立即写入并记录 passedCode |
| 显式切换内容（初始代码 / 历史 / 回滚道具 / 重置） | 立即写入，旧内容进 history |

### 3. 一个必须修掉的坑（切关首帧覆盖草稿）

关卡切换那一帧，React 状态里的 `code` 还是上一帧的值（初始代码），而 refs 已经是新载入的草稿。
若此时照常触发自动保存，会用初始代码覆盖刚恢复的草稿。修复方式：把判定抽成纯函数
`shouldAutosaveDraft({ code, pending, touched, hasDraft, lastSaved })`，其中 `pending` 是「编辑器应有内容」的权威值
（关卡载入、用户输入、程序化切换时同步更新），首帧不一致即跳过写盘。该函数已单测覆盖（含该回归场景）。

### 4. 失败与恢复

- 写失败（隐私模式 / 配额满）：状态变「保存失败」，工具条出现「复制代码」，并尝试写 `nexus_draft_backup_*` 备份 key。
- 读取时 JSON 损坏：备份原始文本到 `nexus_draft_backup_<ts>_*`，不删除原 key，不静默丢弃。
- 清空存档（设置页「重置进度」）：`wipeSave` 同时 `clearAllDrafts()`，避免下一周目看到残留草稿。

---

## 三、修改文件清单

| 类型 | 文件 | 说明 |
|---|---|---|
| 新增 | `src/services/drafts.ts` | 草稿仓库：key/命名空间、读写、历史、通关代码、清除、损坏备份、防抖器、自动保存判定、时间格式化 |
| 新增 | `test/draft_check.mjs` | 草稿逻辑回归（52 条断言，内存版 localStorage） |
| 新增 | `test/draft_e2e.mjs` | jsdom 端到端（39 条断言，真实构建产物） |
| 修改 | `src/pages/ChallengePage.tsx` | 草稿栏 UI、载入/恢复策略、防抖保存、切关/失焦/卸载补写、手动保存/清除、通关代码、复制兜底 |
| 修改 | `src/store/gameStore.tsx` | `wipeSave` 同时清理全部草稿（单行接线） |
| 修改 | `src/styles/global.css` | `.draft-bar` / `.draft-pill` 等草稿栏样式（28 行） |
| 修改 | `public/global.css` | 与 `src/styles/global.css` 同步（index.html 直接引用 public） |

未修改：`services/judge.ts`、`services/pythonRunner.ts`、`game/levels.ts`、`game/knowledge.ts`、`game/progression.ts`、
`game/battle.ts`、`chapterFlow.ts`、存档结构与迁移链。

---

## 四、实际测试结果（真实执行，非模拟）

| 测试 | 结果 |
|---|---|
| `node test/draft_check.mjs` | **52 / 52** |
| `node test/draft_e2e.mjs`（构建产物 + jsdom） | **39 / 39** |
| `node test/verify.mjs`（判题链路） | **71 / 71** |
| `node test/mp_verify.mjs`（真实 MicroPython） | **71 / 71** |
| `node test/boss_battle_check.mjs`（24 阶段） | **105 / 105** |
| `node test/boss_verify.mjs` | **19 / 19** |
| `node tools/audit_initial.mjs` | 31 关初始代码全部无法通过（符合预期） |
| `node test/smoke.mjs`（jsdom 冒烟） | 全部通过 |
| 逻辑套件（acceptance / reward / rewards_voice / chapter_flow / chapter3–6 / difficulty / ending / identity_lore / journal / vault / voice） | 38 / 37 / 34 / 133 / 31×4 / 669 / 30 / 146 / 51 / 55 / 28，全部通过（共 1345 条） |
| `tsc --noEmit` | 0 错误 |
| `npm run build` | 成功（game.js 850 KB） |

E2E 覆盖的十一个场景：进入自动恢复、保存状态与时间、通关代码预览不覆盖、恢复草稿、历史回退、手动保存、
切关隔离、清除草稿、未修改不产生草稿、通关记录不变、刷新恢复、换存档隔离、重置进度清理草稿。

---

## 五、已知限制（如实记录）

1. **jsdom 里 Monaco 无法创建 Worker**，端到端测试无法真实敲键盘，因此「输入 → 500ms 落盘」由
   `createDebouncedFlush` 的真实计时器单测 + `shouldAutosaveDraft` 判定单测覆盖，组件接线由手动保存/切关路径验证。
   建议在真实浏览器里再手测一次连续输入与关页。
2. 历史版本上限 8 条，超出丢弃最旧的一条（不无限增长占用存储）。
3. 「查看通关代码」是预览：不会覆盖当前草稿；若在预览状态下继续编辑，会以编辑后的内容成为新草稿（旧版进历史）。
4. A1 不涉及移动端布局，草稿栏在窄屏会换行，属 A2 处理范围。
5. 草稿不进入存档导出 JSON（避免把代码塞进存档体积）；换浏览器/清缓存会丢失草稿，主存档不受影响。

---

## 六、存档兼容与回滚

- 主存档版本仍为 **v7**，字段与迁移链零改动；旧存档（v1–v7）行为不变。
- 新增数据全部在 `nexus_draft_v1:*` 命名空间，删除这些 key 即可完全回滚到无草稿状态。
- 草稿按 `identity.createdAt` 隔离：导入别人的存档不会读到本机其它存档的草稿。

---

## 七、下一阶段

A1 通过，未开始 A2。A2 需改动 `global.css`（含 `public/` 同步）、`ChallengePage` 结构（标签切换 / 固定操作栏）、
`CodeEditor`（窄屏横向滚动）与 viewport 配置。
