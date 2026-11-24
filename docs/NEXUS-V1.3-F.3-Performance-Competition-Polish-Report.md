# NEXUS V1.3-F.3 · Performance & Competition Polish Report

- 阶段：V1.3-F.3 · Performance & Competition Polish
- 日期：2026-11-23
- 分支：`feature/v1.2-a-experience-polish`
- HEAD：`85dd5a7`
- 结论：**PASS**
- 状态：F.3 冻结，等待人工验收；未进入 F.4，未 Commit / Push / Deploy。

## 1. 项目版本

| 项目 | 实际值 |
|---|---|
| Package | `nexus-code-repair@1.1.3` |
| Branch | `feature/v1.2-a-experience-polish` |
| HEAD | `85dd5a7` |
| SAVE_VERSION | `10`（未升级） |
| Node | `v24.22.0` |
| npm | `11.19.1` |
| 浏览器 | Playwright + 系统 Chrome |

## 2. Preflight

| 项目 | F.2 结束 / F.3 开始 | F.3 结束 |
|---|---:|---:|
| 修改文件 | 19 | 22 |
| 未跟踪文件 | 160 | 164 |
| 工作区变更 | 179 | 186 |

- HEAD、Package、SAVE_VERSION 未变化。
- 未发现新的并行业务修改。
- F.2 文件与 A～E 全部既有内容保留。

检查项：

- Branch / HEAD：实际读取。
- git status：已检查并分类。
- package.json：`1.1.3`，未修改。
- SAVE_VERSION：`10`，未修改。
- Screen 架构：`App.tsx` 条件渲染；无 React Router。
- Bundle 能力：自定义 Rollup，可输出 ESM 多 chunk。
- CSS / 动画：公共 CSS + Boss 视觉引擎 + Reduced Motion。
- Loading：原先无页面级 Loading；F.3 新增。
- Error Boundary：F.2 已有页面级 + 全局边界。
- 测试体系：Unit / Integration / E2E / Smoke 实际执行。

## 3. Workspace Protection

未执行：

- `git reset --hard`
- `git clean`
- 删除未跟踪文件
- 覆盖其他阶段修改
- Commit / Push / Deploy
- package version 修改
- SAVE_VERSION 修改
- 经济数值修改
- Challenge / Boss / MIRA / Explore Core 修改

## 4. Bundle Before

F.2 结束生产构建：

| 指标 | 数值 |
|---|---:|
| 总 JS | 2,148,368 bytes |
| 入口 `assets/game.js` | 2,148,368 bytes |
| 构建器 code units | 1,944 KB |
| CSS | 236 KB |
| micropython 资源 | 592 KB（按需） |
| monaco 资源 | 14 MB（按需） |
| 入口方式 | 单 IIFE，`inlineDynamicImports: true` |

Bundle 审计：

- `gameStore.tsx` 168 KB。
- `SceneArt.tsx` 147 KB。
- React DOM 131 KB。
- `BossBattlePage` 67 KB。
- `BossBattleVisualLayer` 64 KB。
- `bossDifficulties` 62 KB。
- `ChallengePage` 61 KB。
- `WorldMap` 45 KB。
- `levels` 43 KB。
- Boss 引擎/档案/统计/评分/奖励合计数百 KB。

主菜单阶段实际提前加载了所有页面与所有页面级 UI，只有 Python / Monaco 大资源是运行时按需。

## 5. Bundle After

### 5.1 构建策略

- 自定义 Rollup 从单个 IIFE 改为 **ESM 多 chunk**。
- `App.tsx` 仅保留 `StartPage`、`MainMenu` 为 eager。
- 其余 19 个页面使用 `React.lazy` + 动态 import。
- 入口 chunk 不追加 query；避免动态 chunk 以 `../game.js` 引用共享模块时产生第二个 React 实例。
- 动态 chunk 使用 content hash。
- `index.html` 入口改为 `<script type="module">`。

### 5.2 实际 After

| 指标 | 数值 |
|---|---:|
| Initial JS `assets/game.js` | 1,195,937 bytes（1,168 KB） |
| Lazy chunks | 945,749 bytes（924 KB），30 个文件 |
| Total JS | 2,141,686 bytes（2,091 KB） |
| Initial JS 降幅 | **44.3%** |
| Total JS 变化 | -6,682 bytes（-0.3%） |
| JS chunk code units | 1,938 KB |

主要懒加载 chunk：

| Chunk | 大小 |
|---|---:|
| BossPage（含 BossBattlePage / 视觉层） | 296.1 KB |
| CinematicStage + SceneArt | 159.6 KB |
| ChallengePage | 112.6 KB |
| WorldMap | 47.7 KB |
| RewardCenterPage | 24.3 KB |
| ProfilePage | 18.6 KB |
| ExplorePage | 13.0 KB |
| MiraPage | 9.1 KB |
| 其余页面 / 共享模块 | 逐项更小 |

说明：

- Initial JS 降低 44.3%，超过 30% 目标。
- Total JS 仍约 2.09 MB，因为 `gameStore` 仍统一持有 Boss/Challenge/Explore/MIRA 的真实业务逻辑；本阶段没有为指标重写核心架构。
- CSS 仍全部首屏加载（236 KB），未拆 CSS，避免视觉闪烁。

## 6. Dynamic Import

### 6.1 页面级

`React.lazy` 覆盖：

- Story / WorldMap / Challenge / Profile / Settings / Knowledge / Achievement。
- Archive / Vault / Journal / Endings / Lab / Shop。
- ChallengeHub / ChallengePlay / Boss / BattleArchive / Mira / Explore。

保留 eager：

- `StartPage`、`MainMenu`、Error Boundary、全局 Overlay、GameProvider。

### 6.2 生产问题与修复

首次 ESM 分块时发现：

- 入口以 `game.js?v=1.1.3` 加载，而 lazy chunk 以 `../game.js` 引用共享模块。
- 浏览器将带 query 与不带 query 视为两个模块，导致 React 双实例、`useContext` 崩溃。

修复：

- 入口不再追加 query；chunk 使用 content hash。
- 生产 Smoke 与 F3 E2E 均验证页面正常。

### 6.3 不做的部分

- 不拆分 `gameStore` 核心事务。
- 不动态加载 Boss Core / Challenge Judge / Save 结构。
- 不新增状态管理或大型优化依赖。

## 7. Loading

新增 `src/components/ModuleLoading.tsx`：

- NEXUS 风格终端 Loading。
- `role=status` / `aria-live=polite`。
- 160ms 延迟出现，避免快速 chunk 造成闪烁。
- 进度扫描条、模块初始化文案。
- Reduced Motion 下停止扫描动画并直接显示。
- 移动端宽度适配。
- 加载失败由 Error Boundary 捕获。

实测：

- Explore chunk 延迟 1,000ms：真实 Loading 出现，随后进入 Explore。
- Boss chunk 延迟 1,200ms：真实 Loading 出现，随后进入 Boss。
- 正常本地冷缓存 Explore 加载 71–88ms；多数切换无需 Loading。

## 8. Main Menu

- 未推翻现有设计。
- 初始 JS 降低 44.3%，主菜单阶段不再加载 19 个页面模块。
- 主菜单仍正常显示存档、玩家、Continue、New Game、Rail 导航。
- 启动握手加速：打字 2 字符/24ms → 3 字符/16ms；行间隔 260ms → 180ms。
- 尊重 `prefers-reduced-motion`，直接显示完整启动文本。
- 新增键盘 `focus-visible` 青色高亮，不破坏现有 Hover。

## 9. Transition

- 页面切换使用 Suspense Loading，不再空白等待。
- 页面 chunk 缓存后切换正常。
- Error Boundary 捕获 chunk 失败，提供重载/返回菜单/重启。
- 未出现闪白、双重 React、导航卡死。
- 主菜单 → Explore 冷加载 71–88ms；Profile 切换 160–248ms；Boss 入口（含地图/难度选择/Chunk）约 3.2–3.5s。

## 10. Challenge

只优化展示与加载：

- ChallengePage 独立 chunk。
- Editor / Submit / Success / Failure / Settlement 逻辑未改。
- 结算继续显示 XP、Level、Credits、成就、MIRA。
- F2-A 的“探索者”结算一致性保持。
- 空代码 / 非法代码 / 失败增加 / Refresh 均由 F2 测试继续覆盖。

## 11. Boss

Boss Core 未修改：

- 阶段、攻击、弱点、危机、奖励、评分、结算、档案逻辑保持原样。
- Boss 页面改为独立 chunk（296.1 KB）。
- Boss Loading 与 Arena 加载真实截图。
- 完整 Boss E2E / B 系列回归通过。
- 同一 battleId 奖励/MIRA/档案幂等保持。

## 12. Explore

- ExplorePage 独立 chunk（13.0 KB）+ 共享 chapter/CinematicStage chunk。
- 节点、隐藏信号、奖励、pendingChallenge、探索进度、存档全部未改。
- 首次 lazy 加载 Loading 正常。
- 重复领取、失败重试、Refresh 回归通过。

## 13. Mobile

生产构建真实浏览器：

- 360px：无横向溢出。
- 390px：无横向溢出。
- 430px：F2/F3 回归通过。
- 768px：F2/F3 回归通过。
- Loading 卡片在移动端不遮挡核心操作，完成后自动消失。
- Profile / Shop / Settlement / Error Boundary 视觉可用。

## 14. Accessibility

- 新增全局 `:focus-visible` 高亮。
- Loading 使用 `role=status` + `aria-live`。
- Error Boundary 使用 `role=alert`。
- Reduced Motion：
  - Loading 进度条停止动画。
  - 启动页跳过打字动画。
  - Boss 视觉 Reduced Motion 继续由既有 B.6.7/B.6.8 逻辑处理。
- 按钮文本、错误恢复路径、Toast 保持可读。

## 15. Performance Before / After

### 15.1 Bundle

| 指标 | Before（F.2） | After（F.3） |
|---|---:|---:|
| Initial JS | 2,148,368 bytes | **1,195,937 bytes** |
| Total JS | 2,148,368 bytes | 2,141,686 bytes |
| Initial 降幅 | — | **44.3%** |
| Lazy chunks | 0 | 30 个 / 945,749 bytes |
| CSS | 236 KB | 236 KB（未拆） |

### 15.2 Runtime（生产构建，本地 headless Chrome）

| 指标 | F.2 | F.3 |
|---|---:|---:|
| 首屏 → ENTER NEXUS | 2,122 ms（单次） | 1,478–1,961 ms（多次），最新 1,572 ms |
| ENTER → Main Menu | 235 ms | 198–274 ms |
| Main Menu → Explore | 103 ms | 71–107 ms |
| Explore 冷缓存首次加载 | 未单独测量 | 71–88 ms |
| Profile 切换 | 237 ms | 160–248 ms |
| Boss 入口 → Arena | 3,942 ms | 3,176–3,545 ms |
| Console Error | 0 | 0 |
| 资源加载失败 | 0 | 0 |

结论：

- Initial JS 达到 30% 以上目标。
- 首屏中位数约 1,660 ms，较 2,122 ms 改善约 22%；仍有波动。
- Main Menu 后的即时切换基本持平或略优；剩余时间主要由启动动画、字体与真实业务初始化决定。
- 未伪造性能数据；单次数字不代表所有设备。

## 16. Unit

F.3 新增 Unit：**0**。

本阶段实际执行 Unit 回归：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 22 | 1,411 | 1,411 | 0 |

## 17. Integration

F.3 新增 Integration：**0**。

本阶段实际执行：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 19 | 1,386 | 1,386 | 0 |

## 18. E2E

F.3 新增 E2E：**15 / 15 通过**。

- `f3_performance_e2e.mjs`：12 / 12。
  - 主菜单、Bundle 实际数据、Explore Loading、Explore Loaded、Challenge、Settlement、Profile、Shop、Mobile、Reduced Motion、Chunk Failure、Retry。
- `f3_boss_lazy_e2e.mjs`：3 / 3。
  - Boss Loading、Boss Arena、无异常。

本阶段实际执行 E2E：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 14 | 432 | 432 | 0 |

包含：

- F.3 Lazy / Chunk Failure。
- F.3 Boss Lazy。
- F.2 Stability / Challenge Edge。
- F.1 Cross-System / Boss。
- C MIRA / D Exploration。
- B.6.8 / B.7。
- Layout / Boss Battle / A7 / Economy。

## 19. Regression

本阶段实际连续执行：

| 类型 | F.3 新增 | 本阶段实际回归 | 失败 |
|---|---:|---:|---:|
| Unit | 0 | 1,411 | 0 |
| Integration | 0 | 1,386 | 0 |
| E2E | 15 | 432 | 0 |
| Smoke | 0 | 17 | 0 |
| Performance | 0 | 6 | 0 |
| Build | 0 | 1 | 0 |
| **合计** | **15** | **3,253** | **0** |

测试文件：Unit 22 + Integration 19 + E2E 14 + Smoke 2 + Performance 1 = 58。

测试适配：

- `boss_battle_e2e.mjs` 从 jsdom 经典脚本改为真实浏览器测试。jsdom 不执行 ESM module 脚本，这是 ESM 分块后的测试环境限制，不是游戏功能回退；原测试场景（Boss 界面/失败反击/撤退/中局/已击破）全部保留。
- `mira_e2e.mjs` 在难度面板出现后增加一次战前演出跳过，适配 lazy Boss 页面加载时序。
- F1 Cross E2E 的 P3-03 期望更新为 F.2 已修复的结算成就显示。

## 20. Typecheck

```bash
npm run typecheck
```

结果：**0 errors**。

## 21. Build

```bash
npm run build
```

结果：

- 成功。
- 入口：1,195,937 bytes。
- 30 个 lazy chunk，合计 945,749 bytes。
- Total JS：2,141,686 bytes。
- 构建日志：1,938 KB code units。
- 耗时：10.7s。
- SAVE_VERSION / package version 未变化。
- 生产 `index.html` 使用 `type="module"` 入口。

## 22. Smoke

生产构建真实启动：

- `test/f1_build_smoke.mjs`：**9 / 9**。
- `test/f2_build_smoke.mjs`：**8 / 8**。
- `test/f2_performance.mjs`：**6 / 6**，同时验证 Boss 入口和生产资源。

覆盖：

- Main Menu。
- Explore / MIRA / Achievement / Knowledge / Profile。
- WorldMap / Challenge editor / Shop。
- Save v10 / Refresh。
- Error Boundary DEV 探针在生产不激活。
- Console Error = 0，资源加载失败 = 0。

## 23. Screenshot Evidence

目录：`.tmp/f3-evidence/`

| 文件 | 内容 |
|---|---|
| `01-main-menu-before.png` | F.2 主菜单基线（真实旧构建） |
| `02-main-menu-after.png` | F.3 主菜单 |
| `03-bundle-analysis.png` | 实际构建 Bundle 分析 |
| `04-explore-loading.png` | Explore Loading |
| `05-explore-loaded.png` | Explore Loaded |
| `06-boss-loading.png` | Boss Loading |
| `07-boss-loaded.png` | Boss Loaded |
| `08-challenge.png` | Challenge |
| `09-settlement.png` | Settlement |
| `10-profile.png` | Profile |
| `11-shop.png` | Shop |
| `12-mobile-390.png` | 390px |
| `13-mobile-360.png` | 360px |
| `14-performance.png` | 实际构建/运行性能摘要 |
| `15-reduced-motion.png` | Reduced Motion |
| `16-chunk-failure.png` | Chunk 失败 Error Boundary |

说明：

- `01` 来自 F.2 同代码基线构建，用于真实 Before 对比。
- `03`、`14` 是本地真实浏览器渲染的实际构建/测量摘要，不是伪造游戏场景。
- Loading 截图通过真实浏览器网络延迟捕获，不是静态假图。
- 其余截图均来自真实运行页面。

## 24. P0 / P1 / P2 / P3

### P0

0。

### P1

0。

### P2

0。

开发中出现的 ESM 双 React 实例白屏已在生产 Smoke 前修复并关闭。

### P3

| 编号 | 说明 |
|---|---|
| P3-01 | `gameStore` 仍集中持有全部业务逻辑，Initial JS 无法进一步大幅下降；不重构核心 |
| P3-02 | CSS 236 KB 仍首屏加载；本阶段未拆 CSS |
| P3-03 | Chunk 失败 Retry 使用整页 reload；数据安全，但不是原页面原地恢复 |
| P3-04 | 性能测量为本地 headless Chrome，存在波动，不代表所有设备 |
| P3-05 | 生产入口不再带 query；依赖 index no-cache 与 hash chunk，部署层需保持正确缓存策略 |
| P3-06 | 03/14 为分析页面截图，非游戏画面 |
| P3-07 | 低端设备未实测，仅桌面 + 360/390/430/768 视口 |

## 25. Risks

1. `gameStore` 体积仍在入口，Boss 逻辑无法在不变更架构的情况下懒加载；这是 Initial JS 44.3% 后的剩余成本。
2. 首屏仍有启动动画、字体与 Python 预热成本；改善存在设备/网络波动。
3. 动态 chunk 依赖静态服务器正确返回 JS MIME 与相对路径；`server.mjs` 已验证。
4. Chunk 失败恢复是整页 reload；如果网络持续失败，错误页会再次出现，但不会白屏。
5. 旧 jsdom Boss 测试不再适用于 ESM 构建；已替换为真实浏览器等价测试，不降低覆盖意图。
6. 未做低端手机真实设备测试。

## 26. Final Verdict

**PASS**

依据：

- Initial JS 从 2,148,368 → 1,195,937 bytes，降幅 **44.3%**。
- 页面级 lazy loading、Loading、Chunk Failure Recovery、Boss Lazy 全部真实通过。
- P0 = 0，P1 = 0，P2 = 0。
- Typecheck 0 errors，Build 成功，生产 Smoke 通过。
- 3,253 项本阶段实际回归/检查全部通过。
- SAVE_VERSION = 10，Package 未改，Boss/Challenge/MIRA/Explore 核心未重写。
- 移动端 360 / 390 / 430 / 768 与 Reduced Motion 验证通过。

## 27. Freeze

F.3 冻结。

- 等待人工验收。
- 不自动进入 F.4。
- 不 Commit。
- 不 Push。
- 不 Deploy。
