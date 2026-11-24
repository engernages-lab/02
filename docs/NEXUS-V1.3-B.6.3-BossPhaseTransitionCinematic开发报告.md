# NEXUS V1.3-B.6.3 · Boss Phase Transition Cinematic Enhancement 开发报告

> 阶段：Boss 阶段转换电影化演出  
> 范围：真实 B.1 Phase Transition 接入、Pre/Distortion/Collapse/Reconstruction/Reveal/Recovery、阶段主题、DEV 面板与测试；未实施 B.6.4～B.6.8。

## 1. 项目版本

- `package.json` v1.1.3
- Node v24.22.0 / npm 11.19.1
- Chrome 158.0.8127.37（Playwright headless）
- 存档版本 **v10**（未升级）

## 2. Git Branch

`feature/v1.2-a-experience-polish`

## 3. HEAD

`85dd5a7`

## 4. 工作区状态

- 工作区包含并行剧情/视觉/经济改动与未提交文件。
- 未执行 `git reset --hard`、`git clean`、回滚或提交。
- 本阶段只修改视觉层、DEV 面板、样式和测试文件，未覆盖并行工作。

## 5. 开发前审查

| 项目 | 结论 |
|---|---|
| B.1 Phase Engine | `BOSS_PHASE_TRANSITION` 事件含 battleId/phaseId（toPhaseId）/transitionId/fromIndex/toIndex/toPhaseName |
| 阶段配置 | `BossPhasePlan.phases` 提供真实 phaseName/description；阶段数量由 Boss 决定 |
| 转换时间 | `run.transition.startedAt`；视觉不新建阶段计时器 |
| B.4 | 阶段切换已由真实仲裁处理；本阶段不新增事件仲裁 |
| B.6.1 | Registry/Priority/Queue/Interrupt/Lifecycle/Cleanup/Canvas/Reduced Motion/Intensity 全部复用 |
| B.6.2 | 攻击 Warning/Charge/Release/Hit/Block/Dodge/Interrupt/Cancel 已在视觉层接入 |
| 现有 UI | 攻击倒计时与阶段标题保留；电影化层 pointer-events:none |

## 6. 真实 Phase Transition Event

真实事件：

```text
type: BOSS_PHASE_TRANSITION
battleId: run.battleId
phaseId: toPhaseId
payload: {
  transitionId,
  fromIndex,
  toIndex,
  toPhaseName
}
```

阶段名称直接来自 `plan.phases[toIndex].phaseName`，不使用虚构名称。去重键：`battleId + transitionId`；旧 battleId、终结后的迟到事件拒绝。

## 7. 架构设计

- `bossPhaseTransitionCinematicConfig.ts`：阶段时间线、阶段主题、Reveal 编号、阶段查询。
- `BossBattleVisualLayer`：
  - 监听真实 `PHASE_TRANSITION`。
  - 清理 Warning/Charge/Release/Hit/Block/Dodge 攻击演出。
  - 触发 P1 `boss-phase-cinematic` 视觉。
  - 维护 phase view（pre/distortion/collapse/reconstruct/reveal/recovery）。
  - `battleId+transitionId` 去重；终结事件立即清空。
- B.6.1 引擎继续负责优先级/队列/中断/cleanup；B.6.2 攻击演出在阶段期间被抑制并清理。
- 视觉层不修改 HP/意识/阶段/攻击/统计/评分/奖励/成就/归档/存档。

## 8. 文件变更

新增：
- `src/game/bossPhaseTransitionCinematicConfig.ts`
- `test/boss_phase_transition_cinematic.test.mjs`
- `test/boss_phase_transition_cinematic_integration.test.mjs`
- `test/boss_phase_transition_cinematic_e2e.mjs`
- 本报告。

修改：
- `src/game/bossBattleVisualConfig.ts`：新增 `phase-cinematic` 效果类型与 P1 注册项。
- `src/components/BossBattleVisualLayer.tsx`：阶段事件、阶段视图、阶段 UI、终结/去重/清理。
- `src/components/BossVisualDevPanel.tsx`：阶段测试按钮与状态。
- `public/boss.css`：阶段电影化、Reveal、移动端、Reduced Motion。
- 未修改 Boss 阶段引擎、B.4、B.6.2 核心逻辑。

## 9. 演出流程

```text
PHASE_TRANSITION
→ PRE-TRANSITION（0–350ms）
→ SYSTEM DISTORTION（350–800ms）
→ ENERGY COLLAPSE（800–1250ms）
→ CORE RECONSTRUCTION（1250–1850ms）
→ PHASE REVEAL（1850–2850ms）
→ RECOVERY（2850–3200ms）
→ NORMAL BATTLE
```

阶段视图与 B.6.1 tick 同步；不使用独立全局 Interval/RAF。阶段横幅显示 `PHASE TRANSITION`、真实 `PHASE 0X`、真实 `toPhaseName`、阶段阶段标签。

## 10. Visual Priority

复用 B.6.1：
- Terminal P0
- Phase Transition P1
- Crisis P2
- Weakness/Interrupt P3
- Attack Release/Hit P4
- Block/Dodge P5
- HUD P6
- Ambient P7

阶段演出中断低优先级攻击演出；终结 P0 立即清空阶段/攻击视觉；阶段期间新攻击事件被视觉抑制，真实战斗继续。

## 11. B.6.2 Integration

- Warning → Phase：Warning/Charge/Release 视觉被中断清理。
- Release → Phase：release 被清理，阶段优先。
- Hit → Phase：真实 Hit 结果已由 B.2/combatDamage 决定，视觉不修改伤害。
- Phase → New Attack：阶段结束后新攻击视觉可正常启动。
- Phase → Victory/Defeat/Retreat：终结事件清空阶段视图和所有攻击视觉，进入正式结算。
- 阶段期间不会重复播放旧 attack event。

## 12. Reduced Motion

- 继承系统 `prefers-reduced-motion` 与游戏低动画设置。
- 阶段视觉强度降低、Glitch/Shake/粒子减少；保留 Phase 编号、名称、颜色和文本。
- E2E 验证 Reduced Mode 仍显示阶段信息。

## 13. Performance Budget

- 粒子：LOW 0 / MEDIUM 22 / HIGH 42 / CINEMATIC 64，硬上限 96。
- 活动效果上限 6，队列上限 8。
- 单个 B.6.1 Interval + 单 Canvas RAF；无每效果 Timer。
- 阶段演出 duration 3200ms，P1 独占视觉；终结/页面卸载 cleanup。
- 未突破 B.6.1 预算；未新增独立 RAF/Interval。

## 14. DEV Panel

`BossVisualDevPanel` 新增：
- Phase 1→2、Phase 2→3、Phase 3→1（使用 GATE-01 真实阶段名）
- Phase 状态显示
- Phase Priority
- Cleanup All
- Attack/Phase 状态、FPS、Active/Queued/Cleanup/Dropped
- 仅内存，不修改真实 Boss phase/HP/意识/统计/存档；生产隐藏。

## 15. Unit Test

`node test/boss_phase_transition_cinematic.test.mjs` → **33 / 33 通过**。

覆盖阶段配置/时间线/主题/编号、P1 优先级、攻击中断、终结抢占、重复、cleanup、Reduced Motion、强度、粒子/活动/队列上限、非法值 fallback。

## 16. Integration Test

`node test/boss_phase_transition_cinematic_integration.test.mjs` → **22 / 22 通过**。

覆盖真实 B.1 Phase Transition 事件、battleId/transitionId/phaseId/toPhaseName、run 不变、攻击状态不变、阶段抢占 release、终结清理、存档 v10、主题与粒子上限。

## 17. E2E Test

`node test/boss_phase_transition_cinematic_e2e.mjs` → **19 / 19 通过**。

真实 Chrome：
- 生产视觉层存在 / DEV 隐藏
- 真实 P1 阶段转换、PHASE 02、真实“防御协议”、攻击演出清理
- 阶段结束新阶段攻击可启动
- DEV Phase 2→3 使用真实“核心暴走”
- Cleanup、Reduced Motion
- 360/390/430px 无横向溢出、阶段 UI 可见
- 页面切换清理阶段/视觉层
- 无未捕获异常

## 18. Regression

| 范围 | 结果 |
|---|---|
| B.6.1 | Unit 51/51、Integration 38/38、E2E 23/23 |
| B.6.2 | Unit 63/63、Integration 32/32、E2E 28/28 |
| B.5.1~B.5.6 | 59/34/45、73/35/77、84/50/108、106/63/134、105/62/166、122/86/204 |
| B.1～B.4 | 91/156/31、71/308/29、100/108/25、49/146/40 |
| Acceptance / Boss Battle / Challenge / Chapter / Economy / Shop / Vault / Reward / Session | 38、105、57、133、44、63、55、37、44 |
| Layout / Save | 116/116、95/95 |

## 19. TypeScript

`npm run typecheck` → **0 错误**。

## 20. Build

`npm run build` → **成功**，`assets/game.js` 约 1793 KB。

## 21. Smoke

`node test/smoke.mjs` → **全部通过**。

## 22. Screenshots

`.tmp/b6-3-evidence/`：
- `01-phase-transition-warning.png`
- `02-pre-transition.png`
- `03-distortion.png`
- `04-energy-collapse.png`
- `05-core-reconstruction.png`
- `06-phase-reveal.png`
- `07-phase-02.png`
- `08-phase-03-transition-ready.png`
- `09-phase-03.png`
- `10-reduced-motion.png`
- `11-mobile-360.png`
- `11-mobile-390.png`
- `11-mobile-430.png`
- `13-cleanup.png`
- `14-dev-panel.png`

真实阶段截图来自正式战斗入口；DEV 截图明确为 DEV 面板。

## 23. Bugs

| 编号 | Severity | 问题 | Root Cause | Fix | Regression |
|---|---|---|---|---|---|
| B6.3-01 | P2 | 阶段转换后攻击取消事件重新生成攻击视图 | 阶段视图与后到攻击事件无互斥 | 阶段期间抑制攻击视觉事件 | E2E/集成通过 |
| B6.3-02 | P2 | Cleanup All 未清空阶段/攻击展示状态 | Cleanup 只清 engine active/queued | cleanup 同步清 attackView/phaseView | E2E 19/19 |
| B6.3-03 | P2 | 阶段横幅遮挡战斗/输入区域 | 顶部居中位置与 HUD/代码区冲突 | 移至底部终端上方，攻击横幅上移 | 截图/E2E |
| B6.3-04 | P3 | E2E 阶段截图时间窗不稳定 | 截图耗时与 3.2s 演出重叠 | 调整截图节奏/阶段时间线 | 19/19 |

P0：0  
P1：0  
P2：3（已修复）  
P3：1（测试时序，已处理）

## 24. Remaining Issues

1. 真实浏览器只直接验证 Phase 1→2；Phase 2→3 使用 DEV 视觉触发，真实阶段数量/名称来自 GATE-01 配置。
2. Terminal Override 使用集成/引擎测试验证，E2E 未在真实 Victory/Defeat/Retreat 瞬间单独截取阶段抢占图。
3. FPS/内存未对 B.6.3 各强度、移动端做独立长跑采样；复用 B.6.1 预算与 60 FPS 基线。
4. Firefox/WebKit、真机与长时间 soak 未执行。
5. 阶段形式通过 CSS/Canvas/Glitch 表现，未引入 3D Boss 模型（符合项目范围）。

## 25. Risk

- 阶段演出期间抑制攻击视觉可能延迟一次攻击反馈，但真实伤害/判定不受影响；终结 P0 可立即接管。
- 阶段事件与攻击事件同 tick 到达时依赖真实事件顺序；已显式清理攻击视觉并去重。
- 视觉配置 fallback 安全；主题缺失不会导致 NaN/非法颜色。
- 视觉层 pointer-events:none，横幅位于底部终端区域，不阻塞按钮/输入。

## 26. Acceptance

**PASS**

- 真实 B.1 Phase Transition 接入，Pre/Distortion/Collapse/Reconstruction/Reveal/Recovery 完整。
- 阶段主题/编号/名称来自真实配置；P1 优先级、攻击清理、终结抢占、去重、stale 保护、Reduced Motion、预算与 DEV 面板完成。
- Unit 33/33、Integration 22/22、E2E 19/19；B.6.1/B.6.2 与 B.1～B.5.6 全回归通过。
- TypeScript 0 错误、Build 成功、Smoke 通过。
- 无 P0/P1 遗留。

**NEXUS V1.3-B.6.3 PASS**。本阶段停止，不自动进入 B.6.4。
