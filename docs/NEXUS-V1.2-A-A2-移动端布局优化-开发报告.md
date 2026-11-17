# NEXUS V1.2-A · A2 移动端布局优化 · 开发报告

> 阶段：V1.2-A / A2（仅本阶段，A3 未开始）
> 分支：`feature/v1.2-a-experience-polish`
> 前置：A1 已提交（f1c90a9），A1 七项验收已复核通过

---

## 一、断点方案

| 视口 | 布局 | 说明 |
|---|---|---|
| ≥1100px | 桌面三栏 300 / 1fr / 300 | 与 A2 前完全一致，未改视觉 |
| 768–1099px（高 ≥521） | 双栏：编辑器 + 可折叠侧栏 | 侧栏在「任务 / MIRA」间切换，可整体收起；底部终端保留 |
| ≤767px | 单栏 + 顶部标签（任务 / 代码 / 输出 / MIRA） | 终端移到「输出」标签，不占代码页空间 |
| 横屏手机（≤1100 且高 ≤520） | 同单栏，但压缩 HUD、隐藏草稿栏 | 高度优先给编辑器 |

判定条件与 `ChallengePage` 里的 `matchMedia` 完全一致：
`(max-width: 767px), (max-width: 1100px) and (max-height: 520px)`。

---

## 二、实现要点

### 1. 结构（未拆组件、未重写业务）

- 根容器改为 `.chlg-page`，把原来写死的内联 `height:100vh; padding; display:flex; overflow:hidden` 迁到 CSS，内联样式会压过媒体查询，必须先搬走。
- 新增 `view`（手机标签）、`sideTab`（平板侧栏内容）、`sideCollapsed`（平板折叠）、`wrapMode`（窄屏换行）四个状态。
- 手机标签栏与固定操作栏始终渲染，靠 CSS 在小屏显示——避免切换布局时卸载编辑器、丢失滚动位置与撤销栈。
- 平板的侧栏不新增 DOM 包装：`.chlg-left` / `.chlg-right` 同时放进第 2 列同一格，用 `st-task` / `st-mira` 类二选一显示。

### 2. 编辑器空间优先

- 手机端草稿栏与工具栏都是「单行 + 横向滚动」，不再换行堆高。
- 实测编辑器高度：320×568 → 266px；390×844 → 570px；844×390 → 182px。

### 3. 虚拟键盘不遮挡操作栏

- `index.html` viewport 增加 `viewport-fit=cover, interactive-widget=resizes-content`。
- `ChallengePage` 监听 `visualViewport` 的 `resize` / `scroll`，把可视高度写入 `--app-vh`、把键盘占位写入 `--kb-offset`。
- 页面高度用 `--app-vh`，固定操作栏 `bottom: calc(var(--kb-offset) + env(safe-area-inset-bottom))`，页面底部预留 62px。
- 实测：注入 `--kb-offset: 300px` 后操作栏整体上移 300px 且仍在可视区域内。

### 4. 横向溢出

- `html/body/.page/.page-root` 加 `max-width:100%`；网格与三栏子项统一 `min-width:0`；文本 `overflow-wrap:anywhere`。
- 窄屏编辑器关闭 `wordWrap`（`CodeEditor` 新增 `wordWrap` 属性），长行在编辑器内部横向滚动；提供「自动换行」开关并持久化到 `localStorage.nexus_editor_wrap`。
- 实测 320/360/390/430/768/1024/1366 及 844×390、667×375：`documentElement.scrollWidth` 均不超过视口；320px 下主菜单与世界地图同样无横向溢出。

### 5. 触摸目标

手机端按钮最小高度：HUD 34px、标签 38px、工具栏 42px、固定操作栏 46px；全局 ≤640px 的 40px 规则保持不变。

---

## 三、过程中发现并修掉的问题

| # | 问题 | 根因 | 处理 |
|---|---|---|---|
| 1 | A2 样式写完后页面毫无变化 | 只改了 `src/styles/global.css`，但 `index.html` 引用的是 `public/global.css`，构建复制的是 `public/` | 同步两份 CSS 后重建；本报告与提交都包含 `public/global.css` |
| 2 | 手机工具栏高达 179px，编辑器被压到 131px | `flex-wrap:nowrap` 下 span 被 `flex-shrink` 压成 33px 宽，文字竖排撑高容器 | 工具栏/草稿栏子项统一 `flex:0 0 auto`，chip `white-space:nowrap` |
| 3 | 桌面三栏内容压住底部终端（既有问题） | 网格行高按内容撑开，`min-height:0` 只允许收缩不退让 | `.chlg-grid` 增加 `grid-template-rows:minmax(0,1fr)` + `overflow:hidden`，三栏内部滚动 |
| 4 | 引擎错误徽标盖住手机「运行 / 提交」 | 徽标 z-index 260、固定右下 | 手机端操作栏 z-index 400，徽标上移 74px 并降为 300 |
| 5 | 320px 与横屏编辑器高度不足 | HUD/草稿栏占用过多 | 手机 HUD 精简（隐藏副标题/引擎状态/音乐）、横屏隐藏草稿栏并压缩标签 |

> 另：A1 阶段用 PowerShell 追加中文注释时把 `global.css` 写成了非法 UTF-8（11 处替换字符），本次已按字节修复，`src/styles` 与 `public/` 现均为合法 UTF-8。

---

## 四、真实测试（Chrome Headless + CDP）

不是 jsdom。测试脚本 `test/layout_e2e.mjs` 用本机 Chrome 无头实例，通过 CDP 设置真实视口、点击真实 DOM、读取 `getBoundingClientRect` 与 `getComputedStyle`，并在关键尺寸截图。

| 维度 | 断言数 | 结果 |
|---|---|---|
| 桌面 1366×768（三栏保留 / 终端完整 / 编辑器不被遮挡 / 无溢出） | 10 | 全部通过 |
| 平板 1024×768、768×1024（双栏 / 侧栏开关 / 收起后编辑器变宽 / MIRA 切换） | 24 | 全部通过 |
| 手机 430 / 390 / 360 / 320（单栏 / 标签切换 / 操作栏 / 编辑器宽度高度 / 换行开关 / 无溢出） | 76 | 全部通过 |
| 横屏 844×390、667×375（单栏 / 编辑器高度 / 操作栏 / 无溢出） | 10 | 全部通过 |
| 虚拟键盘补偿（--kb-offset 链路） | 3 | 全部通过 |
| 其它页面 320px 横向溢出（世界地图 / 主菜单） | 2 | 全部通过 |
| **合计** | **116** | **116 / 116** |

关键实测值：编辑器宽度 1366→682px、1024→682px（收起侧栏 996px）、768→426px（收起 740px）、手机 390→374px、320→304px；手机操作栏底边始终等于视口高度。

回归测试（全部真实执行）：

- `draft_check` 52/52、`draft_e2e` 39/39（A1 未被破坏）
- `verify` 71/71、`mp_verify` 71/71（判题链路）
- `boss_battle_check` 105/105、`boss_verify` 19/19
- `audit_initial`：31 关初始代码仍全部无法通过
- `smoke` 全通过
- 逻辑套件 11 组 1345 条全通过
- `tsc --noEmit` 0 错误；`npm run build` 成功（856 KB）

---

## 五、修改文件

| 类型 | 文件 | 说明 |
|---|---|---|
| 新增 | `test/layout_e2e.mjs` | Chrome Headless + CDP 布局测试（116 断言） |
| 修改 | `src/pages/ChallengePage.tsx` | 标签栏、侧栏开关、固定操作栏、view/sideTab/wrap 状态、visualViewport 补偿 |
| 修改 | `src/components/CodeEditor.tsx` | 新增 `wordWrap` 属性 |
| 修改 | `src/styles/global.css` | A2 断点与布局规则（并修复非法 UTF-8） |
| 修改 | `public/global.css` | 与 src 同步（构建实际引用） |
| 修改 | `index.html` | viewport 增加 viewport-fit / interactive-widget |
| 新增 | `docs/a2-screens/*.png` | 390 / 900 / 1366 / 320 实测截图 |

未修改：`judge.ts`、`pythonRunner.ts`、`levels.ts`、`battle.ts`、`chapterFlow.ts`、存档结构。

---

## 六、已知限制

1. 无头 Chrome 无法真正弹出软键盘：键盘行为按「`--kb-offset` 变化 → 操作栏上移」的链路验证，真机 iOS/Android 仍建议各手测一次。
2. 横屏高度 ≤520px 时隐藏草稿栏按钮（保存仍可用底部 💾，自动保存不受影响）；恢复草稿 / 查看通关代码等操作在竖屏或桌面可用。
3. jsdom 不执行媒体查询，A1 的 e2e 仍按桌面布局跑；布局正确性由 A2 的真实浏览器测试覆盖。
4. 主菜单在 320px 仍是两列入口（未溢出、可点击），未改成单列——不在本次挑战页范围内，如需要可在后续统一。

---

## 七、下一阶段

A2 通过，未开始 A3。A3 将改动 `pythonRunner`（回传真实 traceback）、新增 `services/diagnose.ts`、`MiraPanel` 与挑战页诊断展示。
