# NEXUS 第一阶段 · 开发报告
## 剧情基础架构与玩家身份系统

> 依据：《NEXUS 游戏项目永久开发总规范 V1.0》+ 阶段 0 分析报告（`docs/NEXUS-阶段0-项目分析与开发计划.md`）
> 实施范围：**只做本阶段 12 项任务**，未实现六章正文、Boss 战、结局流程（属于后续阶段）
> 完成日期：2026-11-05

---

## 一、本阶段交付内容（对应 12 项任务）

| # | 任务 | 交付物 | 状态 |
|---|---|---|---|
| 1 | 统一剧情数据管理模块 | `src/game/lore/`（7 个子模块 + 统一出口） | ✅ |
| 2 | 四位核心角色基础资料 | `lore/characters.ts`（R-07 / MIRA / 恩格尔 / K-0） | ✅ |
| 3 | 六章剧情数据配置结构 | `lore/chapters.ts`（蓝本章名 ↔ 现有服务器映射） | ✅ |
| 4 | 创世主六枚碎片数据结构 | `lore/fragments.ts`（6 枚 + 旧 id 归并） | ✅ |
| 5 | 统一剧情变量管理 | `lore/vars.ts`（25 个变量注册表 + 读取器 + 清洗） | ✅ |
| 6 | 玩家显示名称自定义 | `game/identity.ts` + 档案页编辑入口 | ✅ |
| 7 | 默认显示名称 R-07 | `defaultIdentity()` / `defaultState()` | ✅ |
| 8 | 永久保留原始实验编号 R-07 | `originCode` 强制常量，normalize 不可篡改 | ✅ |
| 9 | 全游戏正确调用玩家名称 | PlayerStatus / 档案页 / 对话框 / 启动握手 | ✅ |
| 10 | 保存玩家名称与身份信息 | `PlayerState.identity` 落盘 + 字段级自愈 | ✅ |
| 11 | 旧版本存档自动迁移 | `services/migrations.ts` v1→v2 迁移链 | ✅ |
| 12 | 剧情事件解锁与阅读状态 | `lore/events.ts` + `Progress.story` | ✅ |

---

## 二、模块化设计（职责分离，未把剧情塞进组件）

```
src/game/
├── identity.ts              玩家身份：显示名 / 固定编号 / 清洗 / 校验 / 对话名称替换
├── lore/
│   ├── types.ts             剧情域类型（角色/章节/碎片/结局/事件）
│   ├── characters.ts        四位核心角色档案（含解锁条件）
│   ├── chapters.ts          六章配置（章节名 ↔ 服务器 ↔ Boss ↔ 碎片 ↔ 核心事件 ↔ 知识点）
│   ├── fragments.ts         创世主六碎片 + 旧碎片 id 归并
│   ├── endings.ts           三结局条件 + 纯函数判定
│   ├── vars.ts              剧情变量注册表 / 默认值 / 清洗 / 读取器
│   ├── events.ts            剧情事件注册表 + 解锁 / 阅读次数 / 分支记录
│   ├── dialogue.ts          台词注册表（引用现有台词序列，不含六章正文）
│   └── index.ts             统一出口
└── story.ts                 原有台词数据（本阶段只做恩格尔更名 + 补齐 f8）
```

**依赖方向**：`lore/types` ← 各数据模块 ← `lore/dialogue`（唯一依赖 `story.ts` 的模块）← 页面。
组件层只消费数据，不含剧情内容。

---

## 三、新增文件清单

| 文件 | 行数级别 | 职责 |
|---|---|---|
| `src/game/identity.ts` | ~120 行 | 身份模型、名称清洗/校验、`displayNameOf`、`originCodeOf`、`applyPlayerName` |
| `src/game/lore/types.ts` | ~95 行 | 剧情域全部类型定义（无运行时依赖） |
| `src/game/lore/characters.ts` | ~75 行 | 四角色档案 + `characterUnlocked` |
| `src/game/lore/chapters.ts` | ~95 行 | 六章配置 + `chapterByServer` / `chapterOfBoss` |
| `src/game/lore/fragments.ts` | ~75 行 | 六碎片 + `hasFragment` / `ownedFragments` / `fragmentForLegacyId` |
| `src/game/lore/endings.ts` | ~65 行 | 三结局 + `endingEligible` / `availableEndings`（只判定，不触发流程） |
| `src/game/lore/vars.ts` | ~130 行 | 25 个剧情变量注册表 + 默认值 + 清洗 + 读取 |
| `src/game/lore/events.ts` | ~150 行 | 14 个剧情事件 + 阅读状态纯函数（`markNodeSeen` / `unlockEvent` / `recordChoice`） |
| `src/game/lore/dialogue.ts` | ~55 行 | 台词序列注册表 + `nodeIdsOf` |
| `src/game/lore/index.ts` | ~10 行 | 统一出口 |
| `src/services/migrations.ts` | ~85 行 | 存档版本迁移链（纯函数，不写存储） |
| `test/identity_lore_check.mjs` | ~200 行 | 身份/剧情/迁移逻辑测试（101 项） |
| `test/identity_e2e.mjs` | ~200 行 | jsdom 端到端：旧档迁移 / 改名 / 刷新保留（30 项） |

## 四、修改文件清单

| 文件 | 改动 |
|---|---|
| `src/game/types.ts` | `PlayerState.identity?`、`Progress.story?`（可选字段，旧档无需即可运行） |
| `src/services/save.ts` | 版本号改为 2；读取/导入走迁移链；新增 `normalizePlayerState`；损坏存档先备份；未来版本按兼容模式读取（不再重置） |
| `src/store/gameStore.tsx` | 新增 `renamePlayer` / `unlockStoryEvent` / `recordStoryChoice`；`markStory` 改为双写（storySeen + 阅读次数）；迁移提示 toast |
| `src/components/DialogSystem.tsx` | 说话人与正文按显示名替换；`eventId` 解锁事件；分支选择入库 |
| `src/components/PlayerStatus.tsx` | 显示名 + 「编号 R-07」标识 |
| `src/pages/ProfilePage.tsx` | 身份信息卡：显示名 / 固定编号 / 命名状态 / 改名表单（含校验提示） |
| `src/pages/ArchivePage.tsx` | 新增核心角色档案、剧情事件（解锁/已读句数）、创世主六碎片进度；保留原序章与记忆残片 |
| `src/pages/WorldMap.tsx` | 服务器面板显示「第 N 章 · 正式章节名」；章节过场传入事件 id |
| `src/pages/StoryPage.tsx` | 序章传入 `eventId="prologue"` |
| `src/pages/BossPage.tsx` | Boss 遭遇剧情传入 `eventId` |
| `src/components/RebirthOverlay.tsx` | 重生剧情传入 `eventId="rebirth"` |
| `src/pages/StartPage.tsx` | 启动握手最后一行使用显示名 |
| `src/pages/SettingsPage.tsx` | 存档版本号改为动态读取 |
| `src/game/story.ts` | 创世主 E.S. → **恩格尔**（5 处）；补齐悬空的碎片 `f8` 定义；`SpeakerKind` 增加 `k0` |
| `src/game/rewards.ts` | 记忆档案文本 E.S. → 恩格尔 |
| `src/services/voice.ts` | 新增 `k0` 语音画像；恩格尔画像标签更名 |
| `test/smoke.mjs` | 版本断言 v1 → v2，新增 3 条身份/剧情状态断言 |

> 说明：E.S. → 恩格尔属于规范第九条第 3 款的硬性要求（"禁止更改恩格尔的名字"），且四位角色档案必须与之自洽，因此在本阶段一并修正；**未新增任何剧情正文**。

---

## 五、数据结构

```ts
// 身份（v2 新增，可选字段）
interface PlayerIdentity {
  displayName: string;   // 默认 'R-07'，可自定义（≤12 字符）
  originCode: string;    // 恒为 'R-07'，normalize 时强制覆写
  renamed: boolean;
  createdAt: number;
}

// 剧情阅读状态（v2 新增，可选字段）
interface StoryReadState {
  unlocked: string[];                // 已解锁的剧情事件 id
  seen: Record<string, number>;      // 对话节点 id → 阅读次数（旧 storySeen 合并而来）
  choices: Record<string, string>;   // 分支节点 id → 选项文本
  lastEventId: string | null;
}
```

- 旧字段 `progress.storySeen`（boolean 映射）**保留并继续双写**，任何旧逻辑与旧存档都不受影响。
- 新字段全部 optional，缺失时由 `normalizePlayerState` 补齐。

---

## 六、存档迁移（v1 → v2）

**迁移链**（`services/migrations.ts`，纯函数）：
```
raw(v1) → [v1→v2: identity + story + flags 清洗] → v2 → normalizePlayerState → PlayerState
```

规则：
1. **只增字段**，不删不改旧字段语义；`chapter1ZeroFail` 等历史 flag 原样保留（不注入默认值，避免"缺失 vs 显式 false"语义漂移）。
2. 旧 `storySeen` 合并进 `story.seen`（次数=1），**不臆造事件解锁状态**。
3. 存储键 `nexus_code_repair_save_v1` **保持不变**（改名会导致所有玩家进度丢失）。
4. 版本高于当前（未来版本）：**按兼容模式读取，不重置**，并提示。
5. 损坏存档：先把原始串备份到 `nexus_save_corrupt_<时间戳>`，再重置并提示。
6. 导入接口同样走迁移链，不再因版本不一致直接拒绝。

---

## 七、实际测试结果

| 测试 | 命令 | 结果 |
|---|---|---|
| TypeScript 类型检查 | `npx tsc --noEmit` | **0 错误**（exit 0） |
| 身份 / 剧情 / 迁移逻辑 | `node test/identity_lore_check.mjs` | **101 / 101 通过** |
| 端到端（迁移+改名+刷新） | `node test/identity_e2e.mjs` | **30 / 30 通过** |
| 原有浏览器冒烟（全流程） | `node test/smoke.mjs` | **全部通过**（六章解锁路径、Boss 入口、兑换中心、刷新恢复） |
| 奖励 / 语音回归 | `node test/rewards_voice_check.mjs` | **34 / 34 通过** |
| Boss / 实验室判题回归 | `node test/boss_verify.mjs` | **11 / 11 通过** |
| 对话点击推进回归 | `node test/dialog_click_check.mjs` | **通过**（1/15 → 2/15 推进，可跳过） |
| 判题差异提示回归 | `node test/diff_hint_check.mjs` | **通过**（三种错误输出均给出正确提示） |
| 生产构建 | `npm run build` | **成功**（`dist/assets/game.js` 约 549 KB） |

### 需求验收对照

| 检查项 | 结果 | 证据 |
|---|---|---|
| 自定义名称能否保存 | ✅ | E2E：改名后 `identity.displayName === '小林'` 且 `name` 同步；刷新后仍在 |
| 默认名称能否正确显示 | ✅ | 逻辑测试：`defaultIdentity().displayName === 'R-07'`；E2E 新档菜单/档案显示 R-07 |
| 原始编号是否始终为 R-07 | ✅ | 逻辑测试：传入 `originCode:'X-99'` 被强制修正；E2E：改名后存档 `originCode === 'R-07'` |
| 刷新页面后名称是否保留 | ✅ | E2E 第三轮：重载存档后菜单/档案仍显示自定义名 |
| 旧存档是否仍然可以读取 | ✅ | E2E 第一轮：v1 存档 → 菜单显示「继续游戏」（未重置），等级/经验/通关/flag/碎片全部保留 |

---

## 八、已知限制（有意留到后续阶段）

1. **六章剧情正文未写**：`chapters.ts` 只有配置（章名、核心事件、知识点、Boss/碎片映射），`dialogue.ts` 只登记现有台词。
2. **Boss 数据未改**：仍是 5 个 ECHO 章节测验；`chapters.ts` 用 `currentBossId` 如实标注第六章暂无 Boss。
3. **结局只有条件，没有流程**：`endings.ts` 提供条件判定纯函数，终章选择与结局播放属后续阶段。
4. **K-0 只有档案**：角色资料与语音画像已建立，剧情与 Boss 战未接入。
5. **信任度未驱动对话**：仍只用于兑换中心展示（阶段 5 处理）。
6. **道具/外观仍未接线**、**响应式仍未实现**（阶段 7 处理）。

## 九、结论

- 本阶段 12 项任务全部完成，且未提前实现后续阶段功能。
- 现有游戏功能（31 关、判题、单步调试、实验室、Boss、奖励、语音、存档）**全部回归通过**。
- 存档兼容：v1 存档可无损读取并自动迁移到 v2；更高版本按兼容模式读取，不清空。
- **可以进入下一阶段**（建议按阶段 0 计划推进「阶段 2：Boss 战框架 + GATE-01 试点」或继续剧情层，由项目方决定）。
