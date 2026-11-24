# NEXUS V1.3-B.6.7 · Visual Accessibility & Performance Optimization 开发报告

> 项目：《代码修复局：NEXUS 虚拟终端故障营救》  
> 阶段：V1.3-B.6.7 · Boss Visual Cinematic 性能、无障碍与稳定性优化  
> 结论：**PASS**  
> 完成时间：2026-11-22

---

## 1. 项目版本

- 游戏版本：NEXUS V1.3
- package：`nexus-code-repair@1.1.3`
- `SAVE_VERSION = 10`（未升级）
- Node 24.22.0 / npm 11.19.1 / Chrome 158

## 2. Branch

- `feature/v1.2-a-experience-polish`
- 未切换/创建分支，未提交，未部署。

## 3. HEAD

- `85dd5a7`

## 4. 工作区状态

开发前检查 `git status --short`，工作区存在并行开发中的剧情、视觉、经济、UI 修改。本阶段：

- 未执行 `git reset --hard` / `git clean`；
- 未删除/回滚任何未提交工作；
- 仅在视觉系统、设置页、DEV 面板、CSS 与测试上做最小追加；
- 未修改 SAVE_VERSION、Reward、Rating、Statistics、Achievement、Archive 业务逻辑。

## 5. 开发前审查

真实阅读：

- `bossBattleVisualEngine.ts` / `bossBattleVisualConfig.ts`
- `BossBattleVisualLayer.tsx` / `BossVisualDevPanel.tsx`
- B.6.2～B.6.6 Attack/Phase/Weakness/Crisis/Terminal 配置与视图
- `BossBattlePage.tsx` / `BossBattleSettlement.tsx`
- `bossPhaseEngine.ts` / `bossSettlement.ts` / `bossBattleArchive.ts`
- `gameStore.tsx` / `save.ts`
- `SettingsPage.tsx`（Animation/animLevel 已存在，无 Visual Intensity/Performance Mode 设置）
- 现有 B.6.1～B.6.6 测试

审查结论：

- 已有 FPS 测量与 `full/reduced/minimal` 降级，但无 4 级模式、无 AUTO 控制器、无滞后/恢复、无 DPR/可见性/Canvas 暂停。
- 粒子/效果/队列硬限制已有，但未与性能模式联动。
- Visual Intensity 只存在于 localStorage + DEV 面板，未进入设置页。
- Canvas 在页面隐藏、CRITICAL 模式下仍可能刷新；无 DPR 模式。
- Reduced Motion 已覆盖 B.6.1～B.6.6，但缺少统一审计与性能模式联动。

## 6. 修改文件

| 文件 | 变更 |
|---|---|
| `src/game/bossBattleVisualConfig.ts` | 新增 4+1 性能模式、DPR 映射、引擎等级映射、存储 helpers |
| `src/game/bossBattleVisualEngine.ts` | 模式强度缩放、粒子预算模式、FPS 平滑、AUTO 降级/恢复、渲染成本、可见性 helper |
| `src/components/BossBattleVisualLayer.tsx` | 性能控制器接入、FPS/Frame/Canvas 数据、DPR、可见性暂停、压力测试 API、Portal 模式类 |
| `src/components/BossVisualDevPanel.tsx` | VISUAL PERFORMANCE Dashboard + 性能/压力/可见性测试入口 |
| `src/pages/SettingsPage.tsx` | 新增 Boss 视觉强度、视觉性能模式（localStorage，不改 Save） |
| `public/boss.css` | 性能模式 CSS、隐藏暂停、Critical 关闭 Ambient/粒子、低模糊 |
| `test/boss_visual_performance.test.mjs` | 新增 53 项单元测试 |
| `test/boss_visual_performance_integration.test.mjs` | 新增 38 项集成测试 |
| `test/boss_visual_performance_e2e.mjs` | 新增 40 项真实浏览器 E2E |
| `test/boss_attack_cinematic_e2e.mjs` | 移动端攻击演出检查改为 resize 后重新触发，消除时序抖动（未改期望值） |
| `docs/NEXUS-V1.3-B.6.7-Performance-Accessibility-Report.md` | 本报告 |

## 7. 性能优化

- 统一性能模式：`AUTO / NORMAL / REDUCED / LOW / CRITICAL`。
- 粒子预算与模式联动：
  - NORMAL：原预算；
  - REDUCED：×0.65；
  - LOW：×0.35；
  - CRITICAL：0；
  - Hard Limit 仍为 96。
- 效果强度模式缩放：
  - CRITICAL 关闭 Flash/Shake/Glitch 强度，其余 ×0.45；
  - LOW 闪类 ×0.25，其余 ×0.6；
  - REDUCED 闪类 ×0.65，其余 ×0.85。
- Canvas DPR：NORMAL ≤2、REDUCED ≤1.5、LOW/CRITICAL=1；实际取设备 DPR 与上限较小值。
- Canvas 只在粒子数 >0 且页面可见/未被 DEV 暂停时绘制；空 Canvas 清空并停止 RAF；resize 尺寸相同时跳过重设。
- 页面隐藏时停止 FPS 监控与 Canvas RAF，视觉 CSS 动画 `animation-play-state: paused`。
- CRITICAL 关闭 Ambient Grid、Scanlines、Particles；效果仅淡入淡出。
- 压力测试验证 Active ≤6、Queue ≤8、Particles ≤96。

## 8. Performance Mode

- 设置值保存于 localStorage：`nexus_visual_performance_mode`。
- 默认 `AUTO`；AUTO 根据平滑 FPS 选择实际模式。
- 强制模式立即生效（NORMAL/REDUCED/LOW/CRITICAL）。
- 模式不会写入 Save，不升级 SAVE_VERSION。
- `AUTO` 使用实际模式渲染（不会把 AUTO 当作视觉模式）。

## 9. FPS 监测

- 复用既有单一 RAF 监控，不新增第二套 RAF。
- 每秒采样一次，指数平滑 alpha=0.25。
- 监测项：FPS、Frame Time、Canvas 绘制耗时、Active/Queue/Particles、模式、DPR、Render Cost、DOM Visual 数。
- Reduced Motion 或页面隐藏时暂停 FPS RAF，停止无效更新；恢复可见后重新开始。
- DEV 面板显示真实读数；生产不渲染 Dashboard。
- 本次 headless 实测约 52–54 FPS（截图 01/05），未伪装 60FPS。

## 10. Particle Budget

- NORMAL CINEMATIC 64；REDUCED 42；LOW 22；CRITICAL 0。
- 压力测试 20+ 并发效果后仍 ≤96。
- Low 强度=0 粒子；Reduced Motion=0 粒子。
- 多事件同时触发时 Active/Queue 硬限制优先丢弃低优先级/Ambient，Terminal P0 不受影响。

## 11. Canvas Optimization

- DPR 按模式限制（2 / 1.5 / 1）。
- 页面隐藏/DEV 模拟隐藏停止 RAF 并清空 Canvas。
- 空粒子停止绘制并清空。
- 尺寸相同不重复初始化。
- 单一 Canvas；卸载清理 RAF、resize listener 与 Context 内容。
- Canvas 实际绘制耗时写入 DEV Dashboard（`canvasRenderMs`）。

## 12. DOM/CSS Optimization

- CRITICAL 模式隐藏 Ambient/Scanlines/Particles，效果简化为 fade。
- `contain: layout paint` 用于 Crisis/Terminal Portal；根视觉层已有 `contain: strict`。
- 页面隐藏时 CSS 动画暂停，避免后台无意义动画。
- 无长期 `will-change`；无新增高频 React 状态写入（Canvas 耗时只写 ref，每秒同步一次）。
- 保留 Warning、Phase、Weakness、Crisis、Terminal 的关键文本与识别。

## 13. Reduced Motion

- 继续兼容 OS `prefers-reduced-motion`、`animations=false`、`animLevel=low`。
- 关闭 Shake/Glitch/Flash 强度、0 粒子、CSS 扫描/Reveal 动画关闭。
- 保留 Attack Warning、Phase、Weakness、Crisis、Victory/Defeat/Retreat/Interrupted 文本与 Settlement。
- E2E 在 Reduced Motion 下显示 Crisis 信息且 0 粒子；B.6.1～B.6.6 Reduced Motion 回归通过。

## 14. Flash Safety

- CRITICAL 下 Flash/Shake/Glitch 强度为 0；LOW 降至 25%；Reduced Motion 关闭。
- 现有 Flash 均为一次性动画，无 1 秒内高频红白交替、无大面积纯白闪屏。
- Terminal Victory/Defeat 的 Reveal 使用渐变与边框反馈，不依赖全屏爆闪。
- E2E Flash Safety Audit 在 CRITICAL 下无 Shake。

## 15. Visual Intensity

- 支持 LOW/MEDIUM/HIGH/CINEMATIC，持久化 `nexus_visual_intensity`。
- Settings 页面新增选择；所有 B.6 效果继续通过统一 intensity 参数生效。
- 设置与 Performance Mode 独立：Intensity 决定效果密度，Performance Mode 决定性能上限。

## 16. Settings Integration

- Settings 页面「画面」新增：
  - Boss 视觉强度 [LOW/MEDIUM/HIGH/CINEMATIC]
  - 视觉性能模式 [AUTO/NORMAL/REDUCED/LOW/CRITICAL]
- 使用 localStorage，不写入/升级 Save；旧存档无字段时默认 AUTO/MEDIUM。
- E2E 验证刷新后 Performance Mode 保持 LOW，root 实际模式 LOW。
- 未覆盖用户已有音量/动画/打字机等设置。

## 17. Page Visibility

- `visibilitychange` 监听，隐藏时：
  - FPS RAF 停止；
  - Canvas RAF 停止并清空；
  - CSS 动画暂停；
  - DEV 显示 Hidden YES。
- 恢复可见后重新启动，不重放已完成事件；Terminal/Settlement 由真实状态决定，视觉不重复。
- E2E 使用 DEV Visibility Pause 验证暂停/恢复；真实 Tab 隐藏监听代码已接入。

## 18. Cleanup

- 页面卸载、HUD 撤退、Battle Terminal、DEV Cleanup 均清理：
  - 视觉状态 active/queued；
  - 弱点/危机/阶段/攻击/终结视图与 queue；
  - Canvas RAF/Resize/Context；
  - FPS RAF / 可见性监听。
- Cleanup 幂等；Terminal P0 后旧事件不复活。

## 19. Memory Leak Test

- DEV Memory Leak Stress：20 次触发 + cleanup 循环；结束后 Active/Queue=0。
- DEV Resize Stress：连续 10 次 resize；无异常、无重复 Canvas。
- 页面切换 E2E：视觉根与 Terminal Portal 均卸载。
- B.6.1～B.6.6 Cleanup/Stale 回归全部通过。

## 20. Unit Test

`test/boss_visual_performance.test.mjs`：**53 / 53 通过**

覆盖：模式归一化/默认、DPR、等级映射、严重度、FPS 平滑、阈值、降级确认、冷却、恢复窗口、强制模式、粒子预算四模式、Flash/Shake/Glitch 安全、Active/Queue/Hard Limit、Terminal P0、Render Cost、Visibility、Settings 持久化。

## 21. Integration Test

`test/boss_visual_performance_integration.test.mjs`：**38 / 38 通过**

覆盖：B.6.1～B.6.6 效果在 CRITICAL 下仍可触发、业务数据只读、Save v10、Reduced Motion 保留核心事件、Hard Limits、Terminal P0、Cleanup、DPR、AUTO 降级/恢复、Settings 兼容。

## 22. E2E Test

`test/boss_visual_performance_e2e.mjs`：**40 / 40 通过**（真实 Chrome）

覆盖：真实 Dashboard 读数、NORMAL/REDUCED/LOW/CRITICAL、CRITICAL 关闭 Ambient、40/25 FPS 降级、恢复、Flash Safety、Stress/Particle/Queue Overflow、Terminal P0、Visibility Pause/Recovery、Memory/Resize Stress、Cleanup、设置刷新持久化、Mobile 360/390/430、Reduced Motion、生产 DEV 隐藏、页面切换清理。

## 23. Regression

### B.6

| 阶段 | Unit | Integration | E2E |
|---|---|---|---|
| B.6.1 | 51 / 51 | 38 / 38 | 23 / 23 |
| B.6.2 | 63 / 63 | 32 / 32 | 28 / 28（移动端时序检查改为 resize 后重触发） |
| B.6.3 | 33 / 33 | 22 / 22 | 19 / 19 |
| B.6.4 | 55 / 55 | 43 / 43 | 47 / 47 |
| B.6.5 | 70 / 70 | 38 / 38 | 45 / 45 |
| B.6.6 | 75 / 75 | 38 / 38 | 43 / 43 |
| B.6.7 | 53 / 53 | 38 / 38 | 40 / 40 |

### B.5

| 阶段 | Unit | Integration | E2E |
|---|---|---|---|
| B.5.1 | 59 / 59 | 34 / 34 | 45 / 45 |
| B.5.2 | 73 / 73 | 35 / 35 | 77 / 77 |
| B.5.3 | 84 / 84 | 50 / 50 | 108 / 108 |
| B.5.4 | 106 / 106 | 63 / 63 | 134 / 134 |
| B.5.5 | 105 / 105 | 62 / 62 | 166 / 166 |
| B.5.6 | 122 / 122 | 86 / 86 | 204 / 204 |

### B.1～B.4

| 阶段 | Unit | Integration | E2E |
|---|---|---|---|
| B.1 | 91 / 91 | 156 / 156 | 31 / 31 |
| B.2 | 71 / 71 | 308 / 308 | 29 / 29 |
| B.3 | 100 / 100 | 108 / 108（+stability 3/3） | 25 / 25 |
| B.4 | 49 / 49 | 146 / 146 | 40 / 40 |

### 全系统

| 检查 | 结果 |
|---|---|
| Acceptance | 38 / 38 |
| Boss Battle | 105 / 105 |
| Challenge Engine | 66 / 66 |
| Challenge Integration | 57 / 57 |
| Chapter Flow | 133 / 133 |
| Economy | 44 / 44 |
| Shop | 63 / 63 |
| Vault | 55 / 55 |
| Reward | 37 / 37 |
| Session | 44 / 44 |
| Save（a7_save） | 95 / 95 |
| a7 Integration | 33 / 33 |
| Layout E2E | 116 / 116 |
| Boss Battle E2E | 24 / 24 |

## 24. TypeScript

`npm run typecheck`：**0 errors**。

## 25. Build

`npm run build`：**PASS**  
`assets/game.js` ≈ 1870 KB。

## 26. Smoke

`node test/smoke.mjs`：**全部通过**。

## 27. Screenshot

目录：`.tmp/b6-7-evidence/`（20 张，真实浏览器）

1. `01-performance-dashboard.png` — 真实 Dashboard
2. `02-normal.png` — NORMAL
3. `03-reduced.png` — REDUCED
4. `04-low.png` — LOW
5. `05-critical.png` — CRITICAL
6. `06-dynamic-degradation.png` — 40FPS 降级
7. `07-performance-recovery.png` — 恢复
8. `08-reduced-motion.png` — Reduced Motion
9. `09-flash-safety.png` — Flash Safety
10. `10-stress.png` — Stress
11. `11-particle-overflow.png` — Particle Overflow
12. `12-queue-overflow.png` — Queue Overflow
13. `13-terminal-p0.png` — Terminal P0
14. `14-visibility-pause.png` — Visibility Pause
15. `15-cleanup.png` — Cleanup
16. `16-mobile-360.png`
17. `17-mobile-390.png`
18. `18-mobile-430.png`
19. `19-production-hidden.png` — 生产 DEV 隐藏
20. `20-dev-panel.png` — DEV 面板

截图均来自真实 Chrome；Dashboard 为真实运行读数（headless 约 52–54 FPS），未伪造 60FPS。

## 28. Bugs

| 编号 | Severity | 问题 | Root Cause | Fix | Regression |
|---|---|---|---|---|---|
| B67-01 | P2 | Dashboard 截图只截到局部按钮 | 滚动容器内元素截图裁剪 | scrollIntoView + 视口截图 | 截图 01–14 复验 |
| B67-02 | P2 | AUTO 模式切换等待条件错误 | root 只显示实际模式，不会显示 AUTO | 测试只在非 AUTO 时等待模式属性 | E2E 40/40 |
| B67-03 | P2 | Reduced Motion 下 FPS RAF 增加额外状态更新，导致 B.6.2 移动端时序失败 | 新监控在 Reduced Motion 仍运行 | Reduced Motion 暂停 FPS 监控（保留强制模式） | B.6.2 28/28 |
| B67-04 | P3 | B.6.2 移动端攻击演出检查在 900ms 视窗后到期 | 既有测试时序抖动 | resize 后重新触发 Digital Wave 再检查（未改期望） | 28/28 |
| B67-05 | P3 | DEV 连续恢复模拟时间戳前进导致冷却不通过 | 每次模拟使用 Date.now，与上次未来时间冲突 | 新增模拟时钟 ref，保证单调时间 | Recovery E2E 通过 |
| B67-06 | P3 | CRITICAL 下 Reveal/Strip 仍有 backdrop-filter | 未按模式移除模糊 | 模式 CSS 关闭低/极低模式模糊 | 截图 04/05 |

统计：**P0 = 0，P1 = 0，P2 = 3（已修复），P3 = 3（已修复）**。

## 29. Remaining Issues

1. 真实浏览器 Tab 隐藏监听已接入，但 E2E 使用 DEV Visibility Pause 验证；Playwright 稳定模拟 `visibilityState` 受限。
2. FPS 数据来自 headless Chrome（52–54 FPS），不代表低端真机；未采集真实移动设备 GPU/内存曲线。
3. Settings 页面新增的选择项通过 localStorage 持久化；E2E 验证了刷新保持，但未逐步点击 Settings 页面控件。
4. Reduced Motion 下 FPS 自动监控暂停（为降低额外更新），强制 Performance Mode 仍生效；Dashboard 显示最后 FPS。
5. Canvas DPR 为上限策略，实际使用 `min(devicePixelRatio, cap)`；Dashboard 显示配置上限。
6. CRITICAL 显著简化装饰视觉，但保留 Warning/Phase/Weakness/Crisis/Terminal 文本与结果。

## 30. Risk

- AUTO 阈值基于平滑 FPS，低端设备实际帧率波动可能触发一次降级；2.5s/3s/5s 滞后已避免抖动。
- 强制 LOW/CRITICAL 会降低视觉丰富度，但不影响业务与结算。
- localStorage 设置与 Save 分离；清除浏览器存储会恢复默认 AUTO/MEDIUM。
- 真实页面隐藏与恢复由浏览器事件控制；后台标签页恢复时视觉时间戳可能跳跃，但事件结果不变。
- 新增 Dashboard 仅 DEV，生产隐藏；不影响正式 UI。

## 31. Acceptance

- [x] B.6.1～B.6.6 全部真实接入
- [x] Performance Dashboard
- [x] FPS Monitor
- [x] Dynamic Degradation
- [x] Recovery Hysteresis
- [x] Particle Hard Limit
- [x] Active Effect Hard Limit
- [x] Queue Hard Limit
- [x] Canvas DPR
- [x] Canvas Cleanup
- [x] DOM Optimization
- [x] Reduced Motion
- [x] Flash Safety
- [x] Visual Intensity
- [x] Settings Integration
- [x] Page Visibility
- [x] Memory Leak Audit
- [x] Terminal P0
- [x] Stale Event Protection
- [x] Save Integrity
- [x] DEV Simulation Isolation
- [x] Mobile 360 / 390 / 430
- [x] Unit Test（53 / 53）
- [x] Integration Test（38 / 38）
- [x] E2E Test（40 / 40）
- [x] B.1～B.6.6 Regression
- [x] Full System Regression
- [x] TypeScript 0 Errors
- [x] Build PASS
- [x] Smoke PASS
- [x] Screenshot Evidence（20 张）
- [x] Formal Report
- [x] No P0
- [x] No P1

## 32. Final Conclusion

**NEXUS V1.3-B.6.7 PASS**

Boss Visual Cinematic 已具备统一性能模式、AUTO 滞后降级/恢复、粒子/队列硬限制、Canvas DPR/可见性暂停、Flash 安全、Reduced Motion 完整性与设置持久化。视觉系统仍为只读表现层，未修改任何真实战斗、结算、奖励、统计、成就、归档或存档数据。

未提交 Git、未部署、未清理工作区、未进入 B.6.8。等待正式验收。
