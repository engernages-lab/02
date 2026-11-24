# NEXUS V1.3-F.2 · Stability & Full Regression Report

- 阶段：V1.3-F.2 · Stability & Full Regression
- 日期：2026-11-23
- 分支：`feature/v1.2-a-experience-polish`
- HEAD：`85dd5a7`
- 结论：**PASS**
- 状态：F.2 冻结，等待人工验收；未进入 F.3，未 Commit / Push / Deploy。

## 1. 项目版本

| 项目 | 实际值 |
|---|---|
| Package | `nexus-code-repair@1.1.3` |
| Branch | `feature/v1.2-a-experience-polish` |
| HEAD | `85dd5a7` |
| SAVE_VERSION | `10`（未升级） |
| Node | `v24.22.0` |
| npm | `11.19.1` |
| 浏览器 | Playwright + 系统 Chrome（真实浏览器） |

## 2. Preflight

### 2.1 实际工作区

| 项目 | F.1 结束 / F.2 开始 | F.2 结束 |
|---|---:|---:|
| 修改文件 | 18 | 19 |
| 未跟踪文件 | 153 | 160 |
| 工作区变更 | 171 | 179 |

F.2 开始与结束时 HEAD、Package、SAVE_VERSION 均未变化。

F.2 未发现新的并行业务修改；既有 A～F.1 工作区内容全部保留。

### 2.2 检查项

- Branch / HEAD：已读取实际值。
- package.json：`1.1.3`，未修改。
- SAVE_VERSION：`10`，未修改。
- Error Boundary 架构：原本不存在；F.2 新增。
- 结算 / 成就 / Toast / Explore 终端数据流：已审查并修复 P3-03。
- 测试体系：Unit / Integration / E2E / Smoke 实际执行。

## 3. 工作区保护

未执行：

- `git reset --hard`
- `git clean`
- 删除既有未跟踪文件
- 覆盖其他阶段文件
- Commit / Push / Deploy
- package version 修改
- SAVE_VERSION 修改

## 4. 修改文件

### F.2 新增

```text
src/components/ErrorBoundary.tsx
test/f2_stability.test.mjs
test/f2_stability_e2e.mjs
test/f2_challenge_edge_e2e.mjs
test/f2_build_smoke.mjs
test/f2_performance.mjs
docs/NEXUS-V1.3-F.2-Stability-Full-Regression-Report.md
```

### F.2 修改

```text
src/App.tsx                页面级 + 全局 Error Boundary 包裹、DEV crash 探针
src/store/gameStore.tsx    探索终端结算合并真实新成就
public/global.css          NEXUS 风格错误页 + 移动端规则
index.html                 内联 favicon，消除非资源 404
test/f1_cross_system_e2e.mjs  P3-03 期望更新为已修复行为
```

F.1 的 `src/game/economyConfig.ts` 探索账本白名单修复继续保留，F.2 未再修改。

未修改：

- Boss Core。
- Challenge Judge / 判题核心。
- MIRA Core。
- Explore 规则 / 奖励数值。
- 经济数值。
- SAVE_VERSION。
- Package version。

## 5. F.2-A 修复

### 5.1 问题

探索终端完成时：

- `completeTerminalChallenge` 完成真实节点。
- `applyAchievementRecalc` 真实解锁探索者并发放 MIRA 奖励。
- 但 `completeLevel` 返回的 `newAchievements` 仍来自探索结算前计算的 `gained`，导致结算页漏显示“探索者”。

### 5.2 修复

在 `completeLevel` 中：

1. 保留原 `gained` 作为玩家/结算基础。
2. 探索终端结算前记录成就集合。
3. 执行既有 `applyAchievementRecalc`（成就真实写入、MIRA 唯一发放、Toast 正常）。
4. 对比前后成就，把本次真实新增 ID 合并进结算返回的 `newAchievements`。

未新增成就系统，未在前端伪造成就，未重复执行 MIRA 奖励。

### 5.3 验证

F.2 真实 E2E：

- 结算页显示“探索者”。
- Toast 显示“成就解锁：探索者”。
- 档案状态包含 `explorer_first`。
- MIRA 成就奖励事件只记录一次。
- 重复完成不再次显示探索者。
- 重复完成不重复 MIRA XP。
- Refresh 后成就、MIRA、探索状态保留。
- 9 项要求全部通过。

Evidence：`02-challenge-settlement.png`、`03-achievement-settlement.png`。

## 6. F.2-B Error Boundary

### 6.1 架构

新增 `ErrorBoundary`：

- **页面级**：包裹全部 screen；单页渲染异常显示错误页，可从错误页返回主菜单或重试。
- **全局级**：包裹 `GameProvider` + `Shell`；核心渲染异常仍可恢复。

### 6.2 错误页

- NEXUS 暗色终端风格。
- `NEXUS SYSTEM FAILURE` / `检测到异常数据流`。
- 故障红、扫描线、Glitch、隔离状态。
- 三个恢复入口：
  - 重新加载模块（重置边界并重挂载）。
  - 返回主菜单（同时清除 DEV 探针并回到真实菜单）。
  - 重新启动系统（清除查询参数并 reload）。
- DEV 才显示错误 message；生产不显示内部堆栈。

### 6.3 DEV-only 测试入口

- 仅 `import.meta.env?.DEV === true` 时响应 `?crash=1`。
- 生产 Smoke 已确认 `?crash=1` 不触发错误页，不进入正式功能。
- 不写入存档，不发放奖励。

### 6.4 发现并修复的生产白屏

首次加入边界后，生产构建读取 `import.meta.env.DEV` 时因构建环境不含 env 而白屏。已改为安全可选访问：

```text
import.meta.env?.DEV === true
```

修复后：

- 生产构建正常启动。
- F.1 Smoke 9/9、F.2 Smoke 8/8 通过。
- Error Boundary 的 Retry / 返回主菜单 / 重启均真实执行通过。

### 6.5 验证

- Error 页真实显示。
- 3 个恢复按钮存在。
- “重新加载模块”恢复成功。
- “返回主菜单”恢复成功。
- “重新启动系统”恢复成功。
- 生产构建 DEV 探针不激活。
- 无未捕获异常导致白屏。

Evidence：`08-error-boundary.png`、`09-error-recovery.png`。

## 7. F.2-C 边缘情况

### 7.1 新增测试

| 文件 | 覆盖 |
|---|---|
| `f2_stability.test.mjs` | Save 异常/损坏 JSON/旧档、Economy、MIRA、Achievement、Explore、Session |
| `f2_challenge_edge_e2e.mjs` | 空代码、非法代码、退出刷新、未解锁区域 |
| `f2_stability_e2e.mjs` | 结算成就、重复结算、Error Boundary、Refresh、多尺寸 |
| `f2_build_smoke.mjs` | 生产世界地图/Challenge/Shop/存档/DEV 探针隔离 |
| `f2_performance.mjs` | 生产首屏/切换/Boss 初始化真实测量 |

### 7.2 关键结果

Challenge：

- 空代码：不完成、不加经验/贡献点、失败计数 +1、无通过结算。
- 非法代码：不完成、不加经验/贡献点、失败累计 +1。
- 刷新：失败计数保留、不伪造通关/奖励。
- 快速提交/重复结算：既有 session 防重复，无重复奖励。
- Judge/Python 异常：以真实失败路径记录，不伪造死亡或通过。

Explore：

- 未解锁区域不能完成节点。
- 重复调查节点不重复发奖。
- 隐藏信号区域未完成不可领取。
- 终端失败清 pending、不完成节点；成功只首次发奖。
- 重复终端完成不重复发奖/流水。

MIRA / Achievement：

- 同事件不重复 XP。
- 记忆与 eventLog 唯一。
- 成就重复重算幂等。
- 已解锁成就不再次进入结算新成就。

Boss：

- Boss Core 未修改。
- F.1 Boss E2E / B 系列回归通过。
- 同一 battleId 奖励/档案/MIRA 幂等由既有测试持续验证。

Save / Economy：

- 非法 Level/XP/Consciousness 自愈。
- 缺少 MIRA/Explore/Ledger 自动补齐。
- 损坏 JSON 安全重置并提示。
- 探索 Ledger 刷新保留。
- 经济数值未修改。

## 8. Unit

F.2 新增 Unit：**24 / 24 通过**。

本阶段实际执行 Unit / 纯逻辑回归：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 22 | 1,411 | 1,411 | 0 |

## 9. Integration

F.2 新增 Integration：**0**（F.1 跨系统集成继续作为回归执行）。

本阶段实际执行：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 19 | 1,386 | 1,386 | 0 |

## 10. E2E

F.2 新增 E2E：**45 / 45 通过**。

- F.2 稳定性 E2E：30 / 30。
- F.2 Challenge 边缘 E2E：15 / 15。

本阶段实际执行 E2E：

| 文件数 | 用例数 | 通过 | 失败 |
|---:|---:|---:|---:|
| 12 | 420 | 420 | 0 |

包含：

- F.2 Stability。
- F.2 Challenge Edge。
- F.1 Cross-System。
- F.1 Boss。
- C MIRA。
- D Exploration。
- B.6.8 视觉整合。
- B.7 Boss 验收。
- Layout。
- Boss Battle。
- A7。
- Economy。

浏览器验证：

- Desktop 1440×900。
- 360 / 390 / 430 / 768px 无横向溢出。
- 成长面板可见。
- Boss 真实完整流程。
- Challenge 真实 Judge。
- Error Boundary 真实异常恢复。

## 11. Regression

本阶段实际连续执行，未引用历史结果：

| 类型 | F.2 新增 | 本阶段实际回归 | 失败 |
|---|---:|---:|---:|
| Unit | 24 | 1,411 | 0 |
| Integration | 0 | 1,386 | 0 |
| E2E | 45 | 420 | 0 |
| Smoke | 8 | 17 | 0 |
| Performance | 6 | 6 | 0 |
| Build | 1 | 1 | 0 |
| **合计** | **84** | **3,241** | **0** |

回归总数含 6 项性能检查；不计性能为 3,235 项测试/检查。

测试文件数：Unit 22 + Integration 19 + E2E 12 + Smoke 2 + Performance 1 = 56。

实际命令均以 `node test/<file>` 执行；Build 为 `npm run build`。

## 12. Typecheck

```bash
npm run typecheck
```

结果：**0 errors**。

## 13. Build

```bash
npm run build
```

结果：

- 成功。
- `dist/assets/game.js`：2,148,368 bytes。
- 构建日志：1,944 KB code units。
- 耗时：10.6s。
- 相比 F.1 的 2,143,397 bytes 增加 4,971 bytes。
- 未修改 `SAVE_VERSION` 或 package version。

## 14. Smoke

### 14.1 F.2 生产 Smoke

```bash
node test/f2_build_smoke.mjs
```

结果：**8 / 8 通过**。

- 生产构建启动。
- DEV crash 探针不激活。
- WorldMap 可打开。
- Challenge 编辑器可打开。
- Shop / 兑换中心可打开。
- Profile 探索流水可见。
- Save v10 / Lv2。
- Refresh 恢复。
- 无未捕获异常。

### 14.2 F.1 生产 Smoke 回归

```bash
node test/f1_build_smoke.mjs
```

结果：**9 / 9 通过**。

覆盖主菜单、档案、探索流水、Explore、MIRA、Achievement、Knowledge、Save 与异常。

## 15. Performance

生产构建 + 系统 Chrome + 本地静态服务器，实际测量：

| 指标 | 数值 |
|---|---:|
| Bundle | 2,148,368 bytes |
| Build code units | 1,944 KB |
| 首屏到 ENTER NEXUS | 2,122 ms |
| Navigation DOMContentLoaded | 338 ms |
| Navigation load | 339 ms |
| 进入主菜单（点击 ENTER 后） | 235 ms |
| 主菜单 → Explore | 103 ms |
| 切换 → Profile | 237 ms |
| Boss 入口 → arena（含地图/难度选择） | 3,942 ms |
| Console Error | 0 |
| 资源加载失败 | 0 |

说明：

- 首屏时间包含启动动画与字体加载，不是纯 JS 执行时间。
- 本阶段未做代码分割，Bundle 2.14 MB 保持现状；F.3 处理。
- 未伪造任何性能数字；未测量项不宣称。

## 16. Visual QA

- 主菜单、Explore、MIRA、Profile、Settlement、Error Boundary 均真实截图。
- Settlement 正确显示经验、等级、贡献点、成就、MIRA 与探索更新。
- 成就结算包含“探索者”。
- Error Boundary 视觉统一，按钮可操作。
- 390 / 360 / 430 / 768 无横向溢出。
- Reduced Motion 由 B.6.8 回归覆盖，F.2 未破坏。
- 错误页移动端 CSS 已添加；桌面真实截图验证。

## 17. Screenshot Evidence

目录：`.tmp/f2-evidence/`

| 文件 | 内容 |
|---|---|
| `01-main-menu.png` | 主菜单 |
| `02-challenge-settlement.png` | Challenge 结算 |
| `03-achievement-settlement.png` | 成就结算区域 |
| `04-explore.png` | 数字世界探索 |
| `05-mira.png` | MIRA |
| `06-boss-victory.png` | Boss Victory |
| `07-profile-growth.png` | 成长总览 |
| `08-error-boundary.png` | 错误边界 |
| `09-error-recovery.png` | 错误恢复 |
| `10-mobile-390.png` | 390px |
| `11-mobile-360.png` | 360px |
| `12-refresh-recovery.png` | 刷新恢复 |
| `13-performance-menu.png` | 生产首屏/主菜单 |

Boss Victory 截图来自本阶段重新执行的真实 Boss E2E；其余均来自 F.2 真实运行。

## 18. P0 / P1 / P2 / P3

### P0

0。

### P1

0。

> F.2 开发中曾出现一次生产构建白屏（Error Boundary 读取 `import.meta.env.DEV`），已被生产 Smoke 在交付前捕获并修复；最终构建无此问题。

### P2

0。

- P2-01（F.1 探索流水）保持修复。
- F.2-A P3-03 已升级并修复。

### P3

| 编号 | 状态 | 说明 |
|---|---|---|
| P3-01 Pending Challenge | 保留 | 退出/失败后 pending 保留，不重复奖励；本阶段不清理 |
| P3-02 旧档成就补齐 | 保留 | 旧存档在下一次真实成就会话后补齐 |
| P3-04 Error Boundary | 已修复 | 页面级 + 全局边界；DEV 探针不进入生产 |
| P3-05 代码分割 | 保留 | 2.14 MB 单包；F.3 处理 |
| P3-06 Boundary 范围 | 记录 | React Error Boundary 不捕获事件处理/异步异常；需在 F.3/F.4 继续观察 |
| P3-07 移动错误页 | 记录 | 错误页移动端 CSS 已加入，未单独做 360/390 错误态截图 |

## 19. Risks

1. Error Boundary 只隔离渲染/生命周期错误，不覆盖异步 Promise 与事件回调异常。
2. 生产构建无法用 DEV 探针主动触发错误页；生产真实错误路径未人为制造，页面级边界由 DEV 真实异常验证。
3. P3-01 stale pending 仍存在，但无重复奖励。
4. 旧档新成就仍依赖下一次真实成就重算。
5. 单包 2.14 MB，首次启动在慢网络/低端设备仍需 F.3 评估。
6. Boss E2E 依赖真实计时，执行较慢；本次通过。
7. 性能数字为本地 headless Chrome 实测，不代表所有设备。

## 20. Final Verdict

**PASS**

依据：

- P0 = 0，P1 = 0，P2 = 0。
- F.2-A 结算/成就/Toast/MIRA/重复/Refresh 全部通过。
- Error Boundary 真实异常、三种恢复路径、生产 DEV 隔离全部通过。
- Challenge / Explore / Boss / MIRA / Achievement / Economy / Save 边缘与回归通过。
- Typecheck 0 errors，Build 成功，生产 Smoke 通过。
- SAVE_VERSION 仍为 10，Boss/Challenge/MIRA/Explore 核心未被重写。

## 21. Freeze

F.2 冻结。

- 等待人工验收。
- 不自动进入 F.3。
- 不 Commit。
- 不 Push。
- 不 Deploy。
