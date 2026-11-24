# NEXUS V1.3-B.6.5 · Dynamic Crisis Event Cinematic Enhancement 开发报告

> 项目：《代码修复局：NEXUS 虚拟终端故障营救》  
> 阶段：V1.3-B.6.5 · 动态危机事件电影化演出增强  
> 结论：**PASS**  
> 完成时间：2026-11-21

---

## 1. 项目版本

- 游戏版本：NEXUS V1.3
- package：`nexus-code-repair@1.1.3`
- `SAVE_VERSION = 10`（未升级）
- Node 24.22.0 / npm 11.19.1 / Chrome 158
- 本阶段未修改战斗判定、危机判定、伤害、HP、奖励、经济、统计、成就、归档与存档。

## 2. Branch

- `feature/v1.2-a-experience-polish`
- 未切换/创建分支，未提交，未部署。

## 3. HEAD

- `85dd5a7`

## 4. 工作区状态

开发前已执行 `git status --short`，工作区存在并行开发中的剧情、视觉、经济、UI 修改（`src/App.tsx`、`src/components/IntrusionOverlay.tsx`、`src/game/economyConfig.ts`、`src/game/types.ts`、`src/pages/BossBattlePage.tsx`、`src/pages/MainMenu.tsx`、`src/services/save.ts`、`src/store/gameStore.tsx`、`src/vite-env.d.ts`、`public/boss.css` 等）。

本阶段处理：

- 未执行 `git reset --hard` / `git clean`；
- 未删除、回滚并行修改；
- 未修改 `IntrusionOverlay.tsx`、`gameStore.tsx`、`types.ts`、`save.ts` 等真实事件模块；
- `public/boss.css` 仅追加 B.6.5 样式段；
- 新增/修改文件仅限 B.6.5 视觉层、DEV 面板、测试与报告。

## 5. 开发前审查

真实阅读：

- `src/game/events/unknownIntrusion.ts`
- `src/game/eventEngine.ts`
- `src/store/gameStore.tsx`（动态事件触发/推进/完成/取消/异常恢复/统计）
- `src/components/IntrusionOverlay.tsx`
- `src/components/CombatArbiterDevPanel.tsx`
- `src/game/combatEventArbiter.ts`
- `src/game/bossPhaseEngine.ts`
- `src/game/bossBattleVisualConfig.ts` / `bossBattleVisualEngine.ts`
- `src/components/BossBattleVisualLayer.tsx` / `BossVisualDevPanel.tsx`
- B.6.1～B.6.4 配置与测试
- `src/pages/BossBattlePage.tsx`（动态事件阻塞、攻击暂停）
- `src/services/save.ts`（dynamicEvent 规范化）

## 6. 真实事件列表

| 正式事件 | 来源 | 说明 |
|---|---|---|
| `unknown-intrusion`（未知入侵） | `events/unknownIntrusion.ts` + `eventEngine.ts` + `gameStore.tsx` | 当前唯一真实动态危机定义 |
| `BOSS_WEAKNESS_*` / `BOSS_PHASE_*` / `BOSS_ATTACK_*` | B.1～B.4 | 仅作为冲突对象，未改造 |

- 定义：`priority=100`、`presentDurationMs=1600`、`activeTimeoutMs=45000`、`cooldownMs=60000`、`mutualExclude=['unknown-intrusion']`。
- 真实结果：`completed / timeout / cancelled / recovered`。
- 真实状态：`presenting → active → resolving(timeout) / completed → dismissed`。
- 覆盖层真实六阶段标签 `探测/渗透/潜伏/激活/扩散/反制` 为**表演标签**，不是正式状态；项目没有独立“危机升级事件”。

## 7. 真实 Event Payload

`DynamicEventState`：

- `id`（实例 id，唯一）
- `defId`（`unknown-intrusion`）
- `status / result / priority / startedAt / activateAt / deadlineAt / endedAt / reason`
- `data.step`（0～3）
- `data.missesLeft`（3～0）

**没有 `battleId / phaseId / crisisId` 字段。** 视觉层只附加当前真实 `battleId` 用于隔离；没有 phaseId 时不伪造。

## 8. Event Lifecycle

- `presenting`：覆盖层检测中，1600ms 后自动进入 active；
- `active`：玩家按真实节点顺序隔离，step 增加；误触消耗 missesLeft；
- 正常完成：`completeDynamicEvent → completed(completed)`；
- 退出：`abandonDynamicEvent → completed(cancelled)`；
- 超时：`advance → resolving(timeout)`；
- 异常：`recoverDynamicEvent → completed(recovered)`；
- 覆盖层结束态展示 1.5s 后 `dismiss → dynamicEvent=null`；
- 重复触发由 cooldown / mutex / already-presenting 拒绝。

## 9. Architecture

新增 `src/game/bossCrisisCinematicConfig.ts`（纯配置/纯函数）：

- 真实状态 → 危机阶段映射；
- Warning 在真实 1600ms presenting 窗口内拆分为 `Warning(0–700ms) → Detection(700–1600ms)`；
- `presenting→active` → Identification；
- 真实 `step` 增加 → Response；
- 真实 `missesLeft` 减少 → Impact；
- 真实 `completed(completed)` → Resolution；
- 真实 `completed(cancelled/recovered)` / 超时 / dismiss → Recovery；
- 超时 `resolving(timeout)` → Impact + Recovery；
- `escalation` 仅 DEV（真实事件无升级事件）。

视觉层复用 B.6.1：

- 新增 `boss-crisis-cinematic` 效果（P2、cinematic 层、不可排队、可中断）；
- 复用 `triggerVisualEffect / interruptVisualEffect / tickVisualEffects / cleanupAllVisualEffects`；
- 复用同一 120ms Tick、Canvas 粒子与性能预算；
- 无第二套 RAF / Interval / Queue / Priority。

真实危机覆盖层 z=9999，视觉层通过**同一 View 的 Portal**（z=10001，`pointer-events:none`）渲染顶部告警条与边框，避免被覆盖层完全遮住；Portal 不持有引擎状态，不新建队列或计时器。

## 10. 文件变更

| 文件 | 变更 |
|---|---|
| `src/game/bossCrisisCinematicConfig.ts` | 新增：阶段、主题、真实状态快照、差异映射、去重、View |
| `src/game/bossBattleVisualConfig.ts` | 新增 `crisis-cinematic` 类型与 `boss-crisis-cinematic` P2 效果 |
| `src/components/BossBattleVisualLayer.tsx` | 真实 dynamicEvent 观察、阶段排队、P2 抢占、Portal、清理 |
| `src/components/BossVisualDevPanel.tsx` | 新增 14 个危机测试入口与状态 |
| `public/boss.css` | 追加危机横幅、覆盖层顶栏/边框、Reduced Motion、移动端 |
| `test/boss_crisis_cinematic.test.mjs` | 新增：70 项单元测试 |
| `test/boss_crisis_cinematic_integration.test.mjs` | 新增：38 项真实事件引擎集成测试 |
| `test/boss_crisis_cinematic_e2e.mjs` | 新增：45 项真实浏览器 E2E |
| `docs/NEXUS-V1.3-B.6.5-DynamicCrisisEventCinematic开发报告.md` | 本报告 |

## 11. Cinematic Design

- Warning：红色系统警报、顶部告警条、边缘扫描框、真实标题「未知入侵」；
- Detection：真实 presenting 窗口后段，显示 `THREAT DETECTED / CRISIS DETECTION`；
- Identification：显示真实事件名称、真实状态（检测中/隔离中/已结束）；
- Impact：真实误触后显示 `SYSTEM BREACH` 与真实剩余失误次数；
- Response：真实隔离步骤推进，显示真实 `step / 3`；
- Resolution：真实完成显示 `THREAT NEUTRALIZED / CRISIS RESOLVED`；
- Recovery：真实 dismiss/取消/超时/异常恢复显示 `SYSTEM RESTORED`；
- Escalation：仅 DEV Visual Simulation，明确 `DEV` 标记。

不显示虚构倒计时、成功率、威胁等级或危机进度；仅使用真实 `status / step / missesLeft`。

## 12. Priority

复用现有：

- P0 Terminal > P1 Phase > **P2 Crisis** > P3 Weakness > P4 Attack > P5 Defense > P6 HUD > P7 Ambient。

危机演出：

- 可中断攻击/弱点视觉；
- 不抢占 Terminal / Phase；
- 真实 dynamicEvent 存在时抑制迟到攻击/弱点视觉重建；
- 阶段切换、终结、Cleanup 全部清理危机视图、队列与效果。

## 13. Conflict Arbitration

- Attack Warning → Crisis Warning：Crisis P2 接管，攻击视觉清理，不复活；
- Weakness Discovery → Crisis：Crisis 抢占并清理弱点视图与队列；
- Attack Release → Crisis Impact：真实攻击结算由战斗引擎完成，视觉不修改伤害；
- Crisis → Phase Transition：P1 抢占并清理 Crisis 视觉；
- Crisis → Victory/Defeat/Retreat：P0 抢占并清理；
- 多 Crisis：`battleId:eventId:kind:marker` 去重，不同实例/步骤独立；
- 旧 battleId：拒绝；
- 页面切换/刷新：卸载/存档规范化清理。

## 14. Deduplication

去重键：`battleId + eventId + kind + marker`。

marker 来自真实差异（`start / active / step:N / miss:N / completed / ended:result / dismissed`），保证：

- 同一事件重复广播不重复播放；
- 同一事件不同步骤可独立播放；
- 同名不同事件、不同战斗、不同阶段不冲突。

## 15. Stale Event Protection

- `battleId` 不一致拒绝；
- `dynamicEvent` 被 dismiss 后不再生成新视图（仅允许当前视图自然结束）；
- Terminal 后拒绝一切危机视觉；
- Phase 抢占后清理队列；
- 页面切换卸载 Portal 与视觉层；
- DEV Stale 按钮验证旧 battleId 被拒绝且不产生视图。

## 16. Reduced Motion

- OS `prefers-reduced-motion`；
- `animations=false` / `animLevel=low`；
- LOW / MEDIUM / HIGH / CINEMATIC。

Reduced Motion 下关闭扫描/边框动画/冲击缩放，保留危机名称、阶段、状态、响应与恢复文本；E2E 已验证 `.b6-reduced` 下横幅仍可见。

## 17. Performance Budget

复用 B.6.1：

- LOW 0 / MEDIUM 22 / HIGH 42 / CINEMATIC 64；Hard Limit 96；
- Active Effects ≤ 6，Queue ≤ 8；
- 单次危机、连续危机、多危机、Crisis+Attack、Crisis+Weakness、Crisis+Phase、Crisis+Terminal 均通过；
- 无新增 RAF/Interval/Timer；
- 页面切换与 Terminal/Cleanup 清空所有效果。

未单独采集内存曲线；DEV 面板截图观测约 59 FPS（单次 headless 观测，不作为全设备承诺）。

## 18. DEV Panel

新增：

1. Crisis Warning
2. Crisis Detection
3. Crisis Identification
4. Crisis Escalation（DEV）
5. Crisis Impact
6. Crisis Response
7. Crisis Resolution
8. Crisis Recovery
9. Full Crisis Sequence
10. Interrupt Crisis
11. Cleanup Crisis
12. Crisis Priority
13. Crisis Duplicate
14. Crisis Stale
15. Terminal Override（既有）
16. Phase Override（既有阶段按钮）

DEV 状态显示 `Crisis kind/stage` 与 `Overlay`；所有 DEV 演出带 `DEV` 标记，只改视觉状态，不写存档/Boss/意识/攻击/弱点/统计/奖励。生产构建隐藏面板（E2E 已验证）。

## 19. Unit Test

`test/boss_crisis_cinematic.test.mjs`：**70 / 70 通过**

覆盖：八阶段配置/时长、Warning→Detection、主题/非法主题 fallback、真实快照、事件差异映射（新事件/active/step/miss/completed/cancelled/recovered/timeout/dismiss）、不虚构 Escalation、去重键、View、P2 注册、抢占、重复、Phase/Terminal、Cleanup、Reduced、粒子、Active/Queue、性能降级、层级。

## 20. Integration Test

`test/boss_crisis_cinematic_integration.test.mjs`：**38 / 38 通过**

使用真实 `eventEngine` + `unknownIntrusion`：

- 真实 tryTrigger/advance/resolve/cancel/recover/dismiss；
- 真实 id/status/result/activateAt/deadlineAt/step/misses；
- 真实重复触发/冷却/互斥/blocking；
- 真实超时；
- battleId 隔离与旧 snapshot 拒绝；
- 视觉只读（事件状态与存档不变）；
- Crisis P2 抢占 Weakness P3；Phase P1、Terminal P0 抢占；
- B.4 优先级 P0/P1 < P2 < P3 < P5；
- Save v10。

## 21. E2E Test

`test/boss_crisis_cinematic_e2e.mjs`：**45 / 45 通过**（真实 Chrome）

真实流程：

- 通过 `CombatArbiterDevPanel` 调用正式 `triggerDynamicEvent` 触发真实 `unknown-intrusion`；
- 真实覆盖层出现，Portal 位于覆盖层之上；
- 真实 Warning → Detection → Identification；
- 真实节点 step 1 → Response；
- 真实误触 → Impact；
- 真实完成 → Resolution；
- 真实 dismiss → Recovery；
- 真实 dynamicEvent=null、存档 v10、意识值未被视觉修改；
- 真实 Attack Warning → Crisis：攻击视觉清理；
- 真实危机 P2 抢占 DEV 弱点 P3；
- P1 阶段转换清理 Crisis；
- Terminal Override 清理 Crisis；
- Reduced Motion；
- 360/390/430px 无溢出、完整可见、不遮挡 HP/输入/防御/闪避；
- 页面切换清理 Portal/视觉层；
- 全流程无未捕获异常。

> 真实危机在 Boss 战内没有自然调度器，唯一入口为 DEV 仲裁面板/事件晋升；E2E 使用真实 API 触发真实事件与真实覆盖层，不是静态 CSS 模拟。

## 22. Regression

### B.6

| 阶段 | Unit | Integration | E2E |
|---|---|---|---|
| B.6.1 | 51 / 51 | 38 / 38 | 23 / 23 |
| B.6.2 | 63 / 63 | 32 / 32 | 28 / 28（首次移动端时序抖动，重跑通过） |
| B.6.3 | 33 / 33 | 22 / 22 | 19 / 19 |
| B.6.4 | 55 / 55 | 43 / 43 | 47 / 47 |
| B.6.5 | 70 / 70 | 38 / 38 | 45 / 45 |

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

## 23. TypeScript

`npm run typecheck`：**0 errors**。

## 24. Build

`npm run build`：**PASS**  
`assets/game.js` ≈ 1838 KB。

## 25. Smoke

`node test/smoke.mjs`：**全部通过**。

## 26. Screenshot Evidence

目录：`.tmp/b6-5-evidence/`（19 张，真实浏览器）

1. `01-crisis-warning.png` — 真实 Warning
2. `02-crisis-detection.png` — 真实 Detection
3. `03-crisis-identification.png` — 真实 Identification
4. `04-crisis-escalation.png` — DEV Escalation（标注 DEV）
5. `05-crisis-impact.png` — 真实 Impact
6. `06-crisis-response.png` — 真实 Response
7. `07-crisis-resolution.png` — 真实 Resolution
8. `08-crisis-recovery.png` — 真实 Recovery
9. `09-crisis-cleanup.png` — DEV Cleanup
10. `10-crisis-priority.png` — DEV Priority
11. `11-crisis-attack-conflict.png` — 真实 Crisis + Attack
12. `12-crisis-weakness-conflict.png` — 真实 Crisis + DEV Weakness
13. `13-crisis-phase-override.png` — 真实 Phase 抢占 DEV Crisis
14. `14-crisis-terminal-override.png` — DEV Terminal Override
15. `15-reduced-motion.png` — DEV
16. `16-mobile-360.png` — DEV
17. `17-mobile-390.png` — DEV
18. `18-mobile-430.png` — DEV
19. `19-dev-panel.png` — DEV 面板

真实截图来自正式战斗入口与真实 `triggerDynamicEvent` / 真实覆盖层/节点交互；DEV 截图带 `DEV` 标记。

## 27. Bugs

| 编号 | Severity | 问题 | Root Cause | Fix | Regression |
|---|---|---|---|---|---|
| B65-01 | P2 | 真实危机全屏覆盖层 z=9999 遮住 Boss 视觉层，危机电影化不可见 | 视觉根层 z=45 | 同一危机 View 增加 Portal（z=10001, pointer-events:none）顶部告警条+边框，复用同一引擎 | E2E Portal 可见/移动端边界通过 |
| B65-02 | P2 | 真实 completed 后覆盖层仍展示 1.5s，但 Portal 提前消失，Resolution 不可见 | `crisisOverlayActive` 使用 blocking 判定，排除 completed | 改为真实 `dynamicEvent` 存在即显示 Portal | E2E Resolution 截图通过 |
| B65-03 | P2 | 真实 dismiss 后 Recovery 未播放 | 观察 Effect 仅在 next 非空时入队 | dismiss 时使用 prev snapshot 入队 Recovery | E2E 真实 Recovery 通过 |
| B65-04 | P3 | Detection 截图依赖固定 sleep，易跳过 700–1600ms 窗口 | 测试时序 | 改为等待 Detection 阶段出现 | E2E 45/45 |
| B65-05 | P3 | DEV 危机横幅 detail 重复显示阶段文本 | DEV detail 使用 stage.text | 改为明确 `DEV 视觉模拟 · 阶段` | 截图 15 复验 |
| B65-06 | P3 | B.6.2 E2E 移动端攻击演出一次超时 | 既有 900ms 时序抖动 | 未修改测试期望，重跑通过 | B.6.2 28/28 |

统计：**P0 = 0，P1 = 0，P2 = 3（已修复），P3 = 3（2 修复，1 为既有测试抖动）**。

## 28. Remaining Issues

1. 真实危机事件没有 `battleId / phaseId / crisisId`；视觉层仅附加当前 `battleId` 做隔离，未伪造字段。
2. Boss 战内没有自然危机调度器；E2E 通过 DEV 仲裁面板调用正式 `triggerDynamicEvent`，真实事件/覆盖层/节点交互均真实。
3. 项目没有独立“危机升级”正式事件；Escalation 仅 DEV 模拟，不进入真实流程。
4. 真实超时路径（45s）仅由集成测试覆盖，未在 E2E 等待真实 45s。
5. 真实危机覆盖层会遮住 Boss HP 等战斗 UI（既有行为）；视觉层未改变覆盖层，Portal 仅顶部/边缘。
6. 未采集内存曲线/FPS 基准；仅记录 DEV 面板单次观测。

## 29. Risk

- 真实事件状态观察依赖 React render；若未来事件引擎改为纯 EventBus，需要重新接入。
- 覆盖层与 Portal 的 z-index 关系依赖 9999/10001；未来修改覆盖层层级需同步调整。
- 真实事件结束后视觉 Recovery 仍会短暂显示（1.4s），属于表现层，不影响真实状态。
- 未来新增多种危机定义时，`crisisCinematicThemeFor` 对其他 defId 统一 fallback，需要扩展真实主题映射。
- 现有战斗/危机逻辑未修改，回归全部通过；风险主要在后续事件扩展与覆盖层 UI 调整。

## 30. Acceptance

- [x] 已真实审查 Crisis Event
- [x] 正式事件来源真实
- [x] 正式事件 Payload 真实
- [x] Dynamic Crisis Cinematic
- [x] Warning
- [x] Detection
- [x] Threat Identification
- [x] Escalation（真实不存在 → DEV 模拟并标注）
- [x] Impact
- [x] Response
- [x] Resolution
- [x] Recovery
- [x] Cleanup
- [x] Event Deduplication
- [x] Stale Event Protection
- [x] Priority
- [x] B.6.2 Integration
- [x] B.6.3 Integration
- [x] B.6.4 Integration
- [x] Terminal Override
- [x] Reduced Motion
- [x] Performance Budget
- [x] DEV Panel
- [x] DEV Simulation Isolation
- [x] Mobile 360 / 390 / 430
- [x] Unit Tests（70 / 70）
- [x] Integration Tests（38 / 38）
- [x] E2E Tests（45 / 45）
- [x] B.1～B.6.4 Regression
- [x] Full System Regression
- [x] TypeScript 0 Errors
- [x] Build PASS
- [x] Smoke PASS
- [x] Screenshot Evidence（19 张）
- [x] Formal Report
- [x] No P0
- [x] No P1

## 31. Final Conclusion

**NEXUS V1.3-B.6.5 PASS**

动态危机电影化已接入真实 `unknown-intrusion` 事件，视觉层保持只读，未修改战斗、危机、伤害、奖励、统计、成就、归档与存档。未提交 Git、未部署、未清理工作区、未进入 B.6.6。

等待正式验收。
