# NEXUS V1.3-B.6.1 · Boss Battle Visual Foundation 开发报告

> 阶段：Boss 战斗视觉基础系统  
> 范围：视觉注册/优先级/队列/中断/清理、基础效果、粒子、扫描线、强度、Reduced Motion、性能降级、Boss 主题、DEV 面板与基础接入。未提前实现 B.6.2 攻击电影化演出。

---

## 1. 项目信息

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》 |
| 项目版本 | `package.json` v1.1.3 |
| Node / npm | Node v24.22.0 / npm 11.19.1 |
| 浏览器 | Google Chrome 158.0.8127.37（Playwright headless） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD | `85dd5a7` |
| 存档版本 | **v10**（未升级） |
| 工作区状态 | 含 B.1～B.5.6、并行剧情/视觉/经济改动；本阶段未提交 Git |

## 2. 开发前审查

| 项目 | 结论 |
|---|---|
| Boss 页面 | `BossBattlePage` / `BattleView`，事件、HUD、结算覆盖层均集中在页面与 store |
| 现有动画 | CSS 动画、攻击/弱点/阶段演出分散；无统一 Effect Registry/仲裁 |
| Overlay / Portal | 结算使用 Portal（z950），死亡/章节 Overlay z900；存在层级风险 |
| 视觉系统 | 无可复用统一视觉管理器；本阶段新建基础层，不重写战斗 |
| 音频 | 现有 `sound.ts` 保留，不新建音频节点 |
| 性能 | 现有粒子/全屏效果分散；本阶段集中预算、上限与降级 |
| Reduced Motion | 结算已有 CSS 处理；本阶段扩展至战斗视觉层 |
| 工作区 | 脏工作区，未覆盖/回滚并行文件 |

## 3. 架构

### BossBattleVisualSystem
- `bossBattleVisualConfig.ts`：视觉优先级、层级、强度档位、Boss 主题、效果注册表。
- `bossBattleVisualEngine.ts`：纯状态机，生命周期 CREATED/QUEUED/PLAYING/COMPLETED/INTERRUPTED/CANCELLED/ERROR；队列、抢占、清理、统计、性能降级、粒子预算。
- `BossBattleVisualLayer.tsx`：视觉渲染层（固定 pointer-events:none）、Canvas 粒子、Pulse/Shake/Glitch/Flash/Scanline、Reduced Motion、主题色。
- `BossVisualDevPanel.tsx`：DEV 触发/强度/中断/清理/统计，仅内存。
- `useBossBattleVisuals`：读事件总线、管理 tick/RAF/媒体查询/设置、页面卸载清理。

视觉优先级独立于 B.1～B.4 战斗事件优先级；P0 终结仅清理视觉，不改变战斗。

### 层级
- 视觉根层 z45（pointer-events:none）。
- HUD/交互/结算 Portal 保持现有层级；结算 z950 高于视觉层。
- 粒子 Canvas 单层，不为每粒子创建 DOM。

## 4. 文件变更

新增：
- `src/game/bossBattleVisualConfig.ts`
- `src/game/bossBattleVisualEngine.ts`
- `src/components/BossBattleVisualLayer.tsx`
- `src/components/BossVisualDevPanel.tsx`
- `test/boss_battle_visual.test.mjs`
- `test/boss_battle_visual_integration.test.mjs`
- `test/boss_battle_visual_e2e.mjs`
- 本报告。

修改：
- `src/pages/BossBattlePage.tsx`：接入 hook、视觉层、DEV 面板。
- `public/boss.css`：视觉层、六类效果、强度、Reduced Motion、移动端、DEV 面板样式。
- 未修改 B.1～B.5.6 战斗/统计/评分/奖励/成就/归档逻辑与存档版本。

## 5. 测试结果

| 命令 | 结果 |
|---|---|
| `node test/boss_battle_visual.test.mjs` | **51 / 51 通过** |
| `node test/boss_battle_visual_integration.test.mjs` | **38 / 38 通过** |
| `node test/boss_battle_visual_e2e.mjs` | **23 / 23 通过** |
| `npm run typecheck` | 0 错误 |
| `npm run build` | 成功，`assets/game.js` 约 1770 KB |
| `node test/smoke.mjs` | 全部通过 |

覆盖：注册表唯一性、重复效果、优先级、队列、抢占、中断、取消、终结清理、cleanup 只执行一次、Reduced Motion、强度、粒子预算、性能降级、主题 fallback、非法效果、事件映射、页面卸载清理、RAF/Interval/Canvas 清理、视觉不修改战斗/经济/存档。

回归：
- B.5.1 59/34/45、B.5.2 73/35/77、B.5.3 84/50/108、B.5.4 106/63/134、B.5.5 105/62/166、B.5.6 122/86/204。
- B.1～B.4 Engine/Integration/E2E：91/156/31、71/308/29、100/108/25、49/146/40。
- Acceptance 38、Boss Battle 105、Challenge 57、Chapter 133、Economy 44、Shop 63、Vault 55、Reward 37、Session 44。
- Layout 116/116、A7 Save 95/95。

## 6. 性能

- DEV 面板实测 FPS：**60 FPS**（headless Desktop，MEDIUM/HIGH 基础环境）。
- 粒子预算：LOW 0 / MEDIUM 22 / HIGH 42 / CINEMATIC 64，硬上限 96；性能降级为 full/reduced/minimal。
- 活动效果上限 6，队列上限 8；超出丢弃并计数。
- 单一 120ms tick + 单 Canvas RAF + 单粒子 RAF；无每粒子 DOM、无每效果独立定时器。
- 页面卸载：取消 Interval/RAF、清理 Canvas、cleanupAll；生产 E2E 无未捕获异常。
- 移动端 390px 无横向溢出，视觉层 pointer-events:none，不阻塞提交按钮。

## 7. 视觉截图

真实浏览器截图 11 张，位于 `.tmp/b6-1-evidence/`：
1. `01-production-visual.png` 生产初始视觉
2. `02-initial.png` MEDIUM 初始
3. `03-particles.png` HIGH 粒子
4. `04-low.png` LOW 强度
5. `05-scanline.png` Scanline
6. `06-interrupt.png` 视觉中断
7. `07-effects.png` Shake/Glitch
8. `08-cleanup.png` Cleanup 后
9. `09-reduced.png` Reduced Motion
10. `10-mobile.png` 移动端
11. `11-dev-panel.png` DEV 面板

## 8. 问题与修复

| 编号 | 严重程度 | 问题 | 根因 | 修复 | 回归 |
|---|---|---|---|---|---|
| B6.1-01 | P2 | 队列效果启动时使用固定 1s 时长 | queued instance 没有保留原始 duration | instance 增加 duration 字段，出队按定义时长 | 单元 51/51 |
| B6.1-02 | P2 | 终结清理的中断计数可能累计历史 interrupted | 直接统计 completed 全部 | 使用本次 cleanupCount | 单元通过 |
| B6.1-03 | P2 | hook 的 `performance` 状态遮蔽全局 performance | 命名冲突 | 重命名为 perfLevel | typecheck 0 |
| B6.1-04 | P3 | 视觉 E2E 中地图节点持续动画导致 click 不稳定 | 页面节点动画 | 测试点击 force | E2E 23/23 |

无 P0/P1 问题。

## 9. 未完成事项

1. 未实现 B.6.2 攻击电影化演出、B.6.3 阶段演出、B.6.4 弱点破防、B.6.5 危机演出、B.6.6 终结演出（按阶段边界）。
2. FPS 仅在 Desktop headless 实测；未对 375/414/768/1024 各尺寸、移动端/低端设备进行逐档 FPS 采样。
3. Reduced Motion 使用 Playwright 系统媒体模拟；未做真机系统设置验收。
4. 页面切换清理有单元/卸载实现，未额外做多页面往返长时间 soak。
5. 视觉配置目前 GATE-01/默认主题；其他 Boss 使用 fallback，未制作独立主题。
6. 视觉强度通过 DEV/localStorage 控制，未新增正式设置 UI。

## 10. 最终验收

**PASS**

- 视觉注册、优先级、队列、抢占、中断、生命周期、cleanup、性能降级、Reduced Motion、Boss 主题、六类基础效果、Canvas 粒子、Scanline、DEV 面板与 Boss 页面基础接入完成。
- 视觉层只读观察战斗并以 pointer-events:none 隔离，不修改存档/HP/意识/阶段/攻击/统计/评分/奖励/成就/归档。
- 单元 51/51、集成 38/38、真实浏览器 E2E 23/23；B.1～B.5.6 与全系统回归通过。
- TypeScript 0 错误、Build 成功、Smoke 通过。
- 无 P0/P1 遗留。

**B.6.1 完成，禁止提前实施 B.6.2；等待 B.6.2 正式任务。**
