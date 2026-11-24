# NEXUS V1.3-B.2 · Boss 攻击模式与攻击预警系统开发报告

> 阶段：NEXUS V1.3-B.2 Boss Attack Patterns & Telegraph System  
> 完成日期：2026-11-19  
> 结论：**CONDITIONAL PASS**（条件见第 14 节）

---

## 1. 项目环境

| 项目 | 值 |
|---|---|
| 项目 | 《代码修复局：NEXUS 虚拟终端故障营救》v1.1.3 |
| Node | v24.22.0 |
| npm | 11.19.1 |
| 浏览器（E2E） | Google Chrome 158.0.8127.37（Playwright 驱动，真实 Chromium 内核） |
| Git 分支 | `feature/v1.2-a-experience-polish` |
| HEAD Commit | `3c0731f`（并行提交：序章插画层；本阶段未提交） |
| 工作区 | 含 B.1/B.2 未提交改动；并行工作文件未覆盖、未删除 |
| 存档版本 | **v10（保持不变，未升级）** |

> 说明：本阶段执行期间，另一并行开发者提交了 `3c0731f feat(cinematic): 序章插画层`。本阶段所有构建与测试均基于该提交后的工作区，未修改该提交涉及的文件。

---

## 2. 开发前架构审查

### 2.1 原 Boss 与 B.1 多阶段系统

- `battle.ts`：4 判题阶段 × 血量、真实判题伤害、原有「反击」机制（`bossCounterAttack`）。
- `bossPhaseEngine.ts`：7 状态战斗状态机、阶段切换、HP 策略、战斗记录、事件总线。
- `bossPhasePlans.ts`：GATE-01 三阶段（100/75/50）、K-0 两阶段、其余 Boss 四阶段。
- 玩家 HP 来源：`player.consciousness`（0~100）；归零走 `startDeath` → `pendingRebirth` → `RebirthOverlay` → `finishRebirth`（恢复到 70）。
- 原有减伤：`rewards.buffs.barrier` 对 Boss 反击伤害减半并消耗 1 层。
- 原有 Boss 反击只在**判题未造成伤害**时触发，不是主动攻击。

**结论**：B.2 新增的是「Boss 主动攻击」层，复用 consciousness、死亡/复活、护罩减伤、事件总线与存档自愈，没有新建 HP 或货币系统。

### 2.2 事件总线

`bossBattleEventBus`（B.1）为进程内事件总线，支持订阅/退订、监听器异常隔离。B.2 直接扩展该总线的事件类型，不新建动态事件引擎。

### 2.3 存档

`save.ts` 字段级自愈，v10 迁移链不变；B.1 已增加 `bossBattles` / `bossBattleHistory` / `bossPhaseProgress`。B.2 新增 `bossAttacks`，同样采用 normalize 兼容旧档。

---

## 3. 新增文件

| 文件 | 用途 |
|---|---|
| `src/game/bossAttackEngine.ts` | 攻击状态机、攻击选择、预警、防御/闪避、命中判定、伤害计算、冷却、阶段同步、攻击记录、自愈、DEV 辅助 |
| `src/game/bossAttackPatterns.ts` | 数据驱动的攻击模式目录：GATE-01 三阶段专属模式 + 其余 Boss 通用模式；按难度缩放伤害/预警/冷却 |
| `src/components/BossAttackDevPanel.tsx` | 仅 DEV 可见的攻击测试面板（虚拟时钟，不写存档、不扣真实意识） |
| `test/boss_attack_engine.test.mjs` | 攻击状态机/模式/预警/防御/闪避/伤害/冷却/阶段/自愈专项（71 断言） |
| `test/boss_attack_integration.test.mjs` | 攻击模式 × 真实阶段 + 存档自愈集成（308 断言） |
| `test/boss_attack_e2e.mjs` | Playwright + 真实 Chrome + 真实 MicroPython 端到端（29 断言） |

---

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/game/bossPhaseEngine.ts` | 事件类型扩展 `BOSS_ATTACK_*` / `BOSS_PLAYER_*`；事件增加可选 `attackId`；复用同一事件总线 |
| `src/game/types.ts` | `Progress` 增加 `bossAttacks?: Record<bossId, BossAttackState>` |
| `src/services/save.ts` | 攻击状态自愈：仅保留有进行中战斗的 Boss；预警/攻击中刷新一律安全取消；终结战斗清理攻击状态；旧档补 `{}` |
| `src/store/gameStore.tsx` | 新增 `tickBossAttack` / `bossAttackStateOf` / `defendBossAttack` / `dodgeBossAttack`；接入意识伤害、护罩减伤、死亡、Boss 战失败记录、阶段取消/同步、战斗结束清理、重生重置 |
| `src/pages/BossBattlePage.tsx` | 单一定时调度器、攻击事件订阅、预警覆盖层、倒计时、范围危险区、攻击面板、防御/闪避按钮、命中反馈、DEV 攻击面板挂载 |
| `public/boss.css` | 攻击面板、预警、倒计时条、多段命中点、AoE 危险区、DEV 面板、移动端适配 |
| `src/vite-env.d.ts` | 构建期 `process.env.NODE_ENV` 类型声明（DEV 开关） |

---

## 5. Boss 攻击系统

### 5.1 攻击模式配置

`BossAttackPattern` 包含：

`attackId`、`attackName`、`attackType`、`description`、`damage`、`warningDuration`、`cooldown`、`attackDuration`、`hitCount`、`hitIntervalMs`、`recoveryDuration`、`difficulty`、`dodgeWindow`、`defenseRequirement`、`defenseReduction`、`defenseWindow`、`phaseRestriction`、`target`、`visualEffect`、`audioEffect`、`dangerLevel`、`specialEffect`、`attackMetadata`。

支持类型：

- 单体：`数据脉冲`
- 延迟：`过载蓄能` / `零号脉冲`
- 连续：`连续代码冲击`（3 段）/ `暴走连击`（4 段）
- 范围：`核心崩塌`
- 特殊：`协议锁定`（不可防御，只能闪避；`specialEffect=data-lock`，为 B.3/B.4 预留）

GATE-01 按 3 个战斗阶段分别配置；其余 5 个 Boss 使用通用模式表（同样按阶段编排）。所有模式由配置生成，UI 与 store 不硬编码攻击。

难度缩放：EASY ×1 / HARD ×1.2 / EXPERT ×1.45 伤害；预警缩短 0/300/600ms；冷却缩短 0/10%/20%；闪避窗口与减伤相应收紧。

### 5.2 攻击状态机

`idle → selecting → telegraph → attacking → resolving → cooldown → idle`

异常：

- `telegraph → cancelled`
- `attacking → interrupted`
- 战斗结束 / 动态事件 / 玩家死亡：取消并立即回到 `idle`（不允许残留计时器或重复渲染）

非法转换一律拒绝；`tick` 无变化时不写存档。

### 5.3 预警

- 预警时长由模式配置（GATE-01 2.0~3.4 秒）。
- UI 显示：攻击名、类型、危险等级、伤害、倒计时、进度条、推荐应对。
- 多段攻击显示命中点进度。
- AoE 攻击显示危险区域（仅 arena 内，不遮挡代码编辑器）。
- 颜色/边框分级，不使用高频闪烁；移动端压缩宽度。

### 5.4 玩家响应

- **防御**：预警/攻击阶段可按下；姿态持续 `defenseWindow`（约 1.2~1.7 秒），命中时仍在姿态内才减伤。防御冷却 3 秒。
- **闪避**：按下后进入 `dodgeWindow`（约 0.7~1.1 秒），命中时仍在窗口内才成功。闪避冷却 4.5 秒。
- **未响应**：正常命中并扣意识。
- **不可防御攻击**：防御按钮禁用，提示“无法防御 · 立即闪避”。
- 防御/闪避不使用新货币或资源，只受冷却与时间窗口限制。

### 5.5 伤害计算

统一在 `bossAttackEngine`：

```
hit      = ceil(pattern.damage × damageScale)
blocked  = ceil(pattern.damage × (1 - defenseReduction) × damageScale)
dodged   = 0
```

`damageScale`：

- 普通战斗 = 1
- 拥有 `barrier` 护罩 = 0.5（并消耗 1 层，复用原有减伤）
- 模拟再战 = 0（不扣真实意识）

保证：伤害 ≥0、玩家意识 ≥0、同一 `hitKey`（`instanceId:hitIndex`）只结算一次、攻击结束后不再命中、玩家死亡/Boss 战结束后攻击取消。

### 5.6 冷却与节奏

- 每个模式独立冷却（15~24 秒）。
- 攻击结束后的全局间隔 3.5 秒。
- 首次攻击延迟 7 秒。
- 单一定时器位于 `BossBattlePage`（140ms），页面卸载/隐藏即停止；刷新由自愈取消活动攻击。
- 避免无限攻击、无限倒计时、重复 Timer、重复伤害。

### 5.7 阶段联动

- 阶段切换时：取消当前预警/攻击、清空玩家响应、重置攻击模式冷却、新阶段有 2.2 秒缓冲。
- 新阶段只加载 `phaseRestriction` 匹配的攻击模式。
- 旧阶段攻击不会在新阶段结算。
- 战斗胜利/失败/中断/撤退/重生：取消攻击并清理状态。

### 5.8 事件

复用 `bossBattleEventBus`：

`BOSS_ATTACK_SELECTED`、`BOSS_ATTACK_TELEGRAPH`、`BOSS_ATTACK_STARTED`、`BOSS_ATTACK_RESOLVED`、`BOSS_ATTACK_HIT`、`BOSS_ATTACK_DODGED`、`BOSS_ATTACK_BLOCKED`、`BOSS_ATTACK_CANCELLED`、`BOSS_ATTACK_INTERRUPTED`、`BOSS_PLAYER_DEFEND`、`BOSS_PLAYER_DODGE`。

每个事件包含：唯一 `id`、`type`、`battleId`、`bossId`、`phaseId`、`attackId`、时间戳、payload。

### 5.9 存档

`progress.bossAttacks[bossId]`：

- 预警 / 攻击中刷新 → 安全取消（`cancelled`），不结算任何伤害，2.5 秒后重新调度。
- 冷却中刷新 → 保留绝对冷却时间；已过期则回到 idle。
- 终结战斗 / 未知 Boss → 清理。
- 同一 `resolvedHitKeys` 最多保留 40 条，防止重复伤害。
- 存档版本仍为 v10。

---

## 6. 实际接入

- 接入 Boss：**GATE-01「数据港守卫」**（第 1 章主线）。
- 进入：世界地图 → syntax 服务器 → `挑战 ▸` → 选择难度 → `开始挑战`。
- 攻击触发：开战后 7 秒，Boss 按当前战斗阶段随机选择可用模式（避开上一次），进入预警。
- 防御/闪避：预警期间点击左侧攻击面板的「防御 / 闪避」；按钮显示冷却剩余。
- 受伤：命中后意识下降，HUD、生命体征、战斗记录、Toast 同步；意识归零进入既有重生流程，并记录本场 Boss 战失败。
- 阶段变化：阶段 1 单体/延迟 → 阶段 2 连续/不可防御特殊 → 阶段 3 范围/高速连击/高伤延迟。
- 阶段切换会立即取消旧攻击；新阶段重新加载模式并重置冷却。
- 胜利/撤退/重生后不再触发攻击。
- 模拟再战保留攻击演出但不扣意识。

---

## 7. 测试结果

所有命令均在项目根目录真实执行。

| 测试 | 执行命令 | 结果 | 断言数量 |
|---|---|---|---|
| 攻击状态机/模式/预警/防御/闪避/伤害/冷却/阶段/自愈 | `node test/boss_attack_engine.test.mjs` | PASS | 71 / 71 |
| 攻击模式 × 真实阶段 + 存档集成 | `node test/boss_attack_integration.test.mjs` | PASS | 308 / 308 |
| Boss 攻击真实浏览器 E2E | `node test/boss_attack_e2e.mjs` | PASS | 29 / 29 |
| B.1 多阶段引擎 | `node test/boss_phase_engine.test.mjs` | PASS | 91 / 91 |
| B.1 真实 Python + 存档 | `node test/boss_phase_integration.test.mjs` | PASS | 156 / 156 |
| B.1 真实浏览器 E2E | `node test/boss_phase_e2e.mjs` | PASS | 31 / 31 |
| 原 Boss 数据/真实判题 | `node test/boss_battle_check.mjs` | PASS | 105 / 105 |
| 原 Boss 战 jsdom E2E | `node test/boss_battle_e2e.mjs` | PASS | 24 / 24 |
| 挑战引擎 | `node test/challenge_engine_check.mjs` | PASS | 66 / 66 |
| 挑战集成 | `node test/challenge_integration_check.mjs` | PASS | 57 / 57 |
| 挑战真实解答 | `node test/challenge_solutions_real.mjs` | PASS | 21 / 21 |
| A7 存档安全 | `node test/a7_save_check.mjs` | PASS | 95 / 95 |
| A7 跨模块联调 | `node test/a7_integration_check.mjs` | PASS | 33 / 33 |
| A7 E2E | `node test/a7_e2e.mjs` | PASS | 51 / 51 |
| A7.1 功能 E2E | `node test/a7_1_features_e2e.mjs` | PASS | 24 / 24 |
| A7.2 挑战+事件 E2E | `node test/a7_2_challenge_event_e2e.mjs` | PASS | 20 / 20 |
| A7.3 兼容性验收 | `node test/a7_3_a2_acceptance.mjs` | PASS | 42 / 42 |
| 低端设备模拟 | `node test/a7_1_lowend_sim.mjs` | PASS | 9 / 9 |
| 章节流程 | `node test/chapter_flow_check.mjs` | PASS | 133 / 133 |
| 第 3~6 章 | `node test/chapter3_check.mjs` 等 | PASS | 各 31 / 31 |
| 章节门禁 | `node test/chapter_gate_e2e.mjs` | PASS | 27 / 27 |
| 经济 | `node test/economy_check.mjs` / `economy_e2e.mjs` | PASS | 44 / 44、19 / 19 |
| 商店 | `node test/shop_check.mjs` / `shop_e2e.mjs` | PASS | 63 / 63、45 / 45 |
| Vault | `node test/vault_check.mjs` / `vault_e2e.mjs` | PASS | 55 / 55、28 / 28 |
| 难度 | `node test/difficulty_check.mjs` / `difficulty_e2e.mjs` | PASS | 669 / 669、36 / 36 |
| 剧情 | `node test/story_flow_e2e.mjs` | PASS | 46 / 46 |
| 布局/移动端 | `node test/layout_e2e.mjs` | PASS | 116 / 116 |
| 其余 E2E（draft/identity/journal/reward/settlement/ending/voice） | 对应 `*_e2e.mjs` | PASS | 39 / 30 / 11 / 18 / 46 / 17 / 16 |
| 冒烟 | `node test/smoke.mjs` | PASS | 全部通过 |

> 本阶段未出现 FAIL 项。

---

## 8. TypeScript

- 命令：`npm run typecheck`
- 结果：**通过，0 错误**
- 无旧错误遗留。

## 9. Build

- 命令：`npm run build`
- 结果：**成功**
- 产物：`dist/assets/game.js` ≈ **1225 KB**
- 警告：仅常规 chunk 体积提示，无功能警告。

---

## 10. 浏览器验收

- 浏览器：Google Chrome 158.0.8127.37（Playwright 启动，真实 Chromium 内核）
- 测试方式：`node test/boss_attack_e2e.mjs`（Vite dev server + 真实 MicroPython/WASM）
- 实际流程：
  1. 进入 GATE-01 真实战斗；
  2. Boss 主动选择攻击并显示预警与倒计时；
  3. 玩家在真实时间窗口内防御 → 减伤命中；
  4. 下一次攻击在闪避窗口内闪避 → 0 伤害；
  5. 未响应 → 意识真实下降；
  6. 攻击结束进入冷却，冷却结束后自动进入下一次攻击；
  7. 提交阶段 1 正确答案触发阶段切换 → 旧攻击取消，新阶段加载「协议锁定」等新攻击模式；
  8. 预警中刷新页面 → 意识不变、攻击状态安全取消、不重复伤害；
  9. 关闭页面后等待再打开 → 无残留攻击计时器、无额外伤害；
  10. DEV 攻击面板可手动开始/推演/重置，且不修改正式阶段状态与战斗历史；
  11. 生产构建（`dist`）中 DEV 面板不可见，攻击系统与预警正常。
- 截图位置：`.tmp/b2-evidence/`
  - `01-attack-warning.png`、`02-defense-blocked.png`、`03-dodge-success.png`、`04-hit-damage.png`、`05-stage2-attack.png`、`06-refresh-recovered.png`、`07-dev-panel.png`、`08-production.png`
- 人工目视：已查看 `01` / `02` / `04` / `05` / `07`，预警、倒计时、防御减伤、受击伤害、阶段 2 不可防御攻击、DEV 面板显示正常。
- 页面异常：E2E 期间无未捕获异常 / 无业务控制台错误（仅被主动拦截的字体请求）。

---

## 11. 兼容性

| 平台 | 验证方式 | 结果 |
|---|---|---|
| PC | 真实 Chrome 1440×900（B.2/B.1 E2E） | 通过 |
| Mobile | `layout_e2e.mjs` jsdom 模拟 320 / 390 / 667 / 844 视口 | 通过（模拟） |
| Tablet | 同上 | 通过（模拟） |
| 真实设备 | **未测试** | 未验证 |

攻击预警在移动端使用全宽压缩布局；Playwright 视口模拟不等同真实设备触控与性能表现。

---

## 12. 问题与修复

| 编号 | 级别 | 问题 | 原因 | 修复 | 回归 |
|---|---|---|---|---|---|
| B2-01 | P1 | B.1 最终胜利时碎片动画不结束、胜利结算面板不出现 | 攻击计时器在战斗结束后仍每 140ms 触发 UI 更新，重置 `FragmentGain` 的 3.8s 定时器 | 战斗结束后攻击引擎立即回到 idle；store 对终结/未开始战斗停止重复调度；UI 仅对预警/攻击/结算/冷却更新倒计时 | B.1 E2E 31/31 |
| B2-02 | P2 | 攻击数值/节奏过重，长时间操作有死亡风险 | 初始伤害 4~12、冷却 9~18 秒 | 调整为 3~7 伤害、15~24 秒冷却、首次延迟 7 秒、全局间隔 3.5 秒 | 攻击专项 71/308；B.2 E2E 29/29 |
| B2-03 | P2 | 攻击面板在左栏底部，需滚动才能防御 | 面板插入顺序靠后 | `.boss-attack-panel { order: -1 }` 固定到左栏首位 | 目视截图 01 |
| B2-04 | P2 | 不可防御攻击的防御按钮仍可点击 | 仅文案提示 | `defenseRequirement === 'none'` 时禁用防御按钮 | 目视截图 05 |
| B2-05 | P3 | 预警未显示伤害数值 | 初始 meta 只有类型/危险等级 | 预警 meta 增加 `伤害 X × Y` | 截图 01 |
| B2-06 | P3 | E2E 固定端口偶发被残留 Vite/端口占用影响 | 固定端口 + 并行测试残留 | E2E 使用动态端口并显式等待服务就绪 | B.2 E2E 稳定通过 |
| B2-07 | P3 | DEV 面板标题大小写导致 E2E 断言失败 | CSS `text-transform: uppercase` | 测试改为匹配不受大小写影响的中文片段 | B.2 E2E 29/29 |

未发现 P0 问题。

---

## 13. 未完成事项

1. B.3 弱点机制与代码破解、B.4 动态事件战斗联动、B.5 战斗评价、B.6 全面视觉升级**未开发**；特殊攻击仅保留配置/事件接口（`data-lock` / `freeze` 等）。
2. 真实移动设备 / 平板触控与性能验收未执行。
3. 除 GATE-01 外，其余 5 个 Boss 使用通用攻击模式，未做真实浏览器 E2E；阶段/模式配置一致性由集成测试覆盖。
4. 未做长时间挂机下的内存与事件监听泄漏专项剖析（定时器在页面卸载时清理，刷新由 normalize 取消）。
5. 本次未提交 Git（保留工作区供验收）；期间并行提交 `3c0731f` 不属于本阶段改动。

---

## 14. 最终验收

### CONDITIONAL PASS

理由：

- Boss 主动攻击已真实接入 GATE-01：预警、倒计时、防御、闪避、未响应受伤、冷却、阶段攻击模式变化、刷新恢复、退出清理全部通过真实 Chrome E2E（29/29）。
- 攻击状态机与伤害仅在统一引擎中计算，无页面各自结算、无重复伤害。
- B.1 多阶段引擎、原 Boss 战、挑战/Judge、奖励、章节、经济、商店、Vault、存档等回归全部通过。
- TypeScript 0 错误，生产构建成功。
- 无 P0/P1 遗留问题。

条件项（满足后可转为 PASS）：

1. 在真实移动设备与平板上完成攻击预警可读性、防御/闪避触控响应与性能验收。
2. 在桌面端进行一次非 headless 的完整人工交互走查，重点确认长时间战斗中攻击节奏与意识压力。

---

## 附：证据位置

- 测试截图：`.tmp/b2-evidence/`
- 攻击专项：`test/boss_attack_engine.test.mjs`、`test/boss_attack_integration.test.mjs`
- 浏览器 E2E：`test/boss_attack_e2e.mjs`
- 本报告：`docs/NEXUS-V1.3-B.2-Boss攻击模式与攻击预警系统开发报告.md`
