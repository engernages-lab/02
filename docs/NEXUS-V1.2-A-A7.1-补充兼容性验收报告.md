# NEXUS V1.2-A · A7.1 补充兼容性验收报告

> 阶段：V1.2-A / A7.1（补充验收；V1.3 未启动）
> 分支：`feature/v1.2-a-experience-polish`
> 基线：A7 报告 `docs/NEXUS-V1.2-A-A7-最终综合回归测试报告.md`（CONDITIONAL PASS）
> 结论：**CONDITIONAL PASS（有条件通过）**——真实 iOS / Android / 低性能设备未执行，按验收规则不得直接改为 PASS。

---

## 一、A7.1 阶段目标

补齐 A7 遗留的测试缺口：Firefox 桌面、iOS Safari、Android Chrome、低性能设备、Hint Ticket 专项、Boss Shield 专项，并在修复后执行 A1–A7 回归。

---

## 二、实际测试环境与设备信息

| 项目 | 实际值 |
|---|---|
| 操作系统 | Windows 11 家庭版 中文版，10.0.26200 Build 26200 |
| 处理器 | Intel64 Family 6 Model 197 Stepping 2，16 逻辑处理器 |
| 内存 | 32,346 MB（测试时可用 9,856 MB） |
| Node.js | v24.22.0 |
| Chrome | 158.0.8127.37（真实安装版，Headless + CDP） |
| Firefox | 159.0（Playwright 1.65.1 自带真实 Firefox 构建） |
| iOS 设备 | **无**（Windows 主机，无 iPhone/iPad、无 Safari/WebKit 真机） |
| Android 设备 | **无**（无 adb、无 USB 真机/模拟器） |
| 低性能设备 | **无**（仅 CPU 节流模拟，见第六节） |

测试边界：除 Firefox 为真实浏览器外，iOS/Android 均为视口模拟，低性能为 CPU 节流模拟；报告中已逐项标注，未把模拟结果写成真机结果。

---

## 三、浏览器兼容性测试结果

| 浏览器 | 方式 | 结果 |
|---|---|---|
| Chrome 158 | 真实浏览器 + CDP（A1–A7 全部 e2e） | 通过 |
| Firefox 159 | 真实 Firefox（Playwright，headless） | **20 / 20 通过** |
| Safari 桌面 | 未执行（无 macOS/Safari） | 未执行 |
| Edge | 未执行 | 未执行 |

Firefox 实测覆盖：启动/主菜单/地图、Monaco 编辑器输入、MicroPython 运行、A3 语法诊断、`while True` 硬超时（5.3s）与终止后复用、A1 草稿刷新恢复、判题结算（+90 贡献点 / +60 经验 / 账本）、刷新持久化、商店购买（590→530、库存 +1）、背包使用（护盾 +1）、Boss 战界面与反击结算、无未捕获页面错误。启动到主菜单 1.5s，Worker 超时 5.3s。

Firefox 测试中未发现 CSS 布局差异导致的功能问题、localStorage 异常、Worker 创建/终止异常或浏览器专属 API 报错。

---

## 四、iOS Safari 测试结果

**未执行（真实设备）**。原因：测试主机为 Windows，无 iPhone/iPad，也无 Safari/WebKit 运行环境；不使用模拟器结果冒充真机。

作为补充，Chrome 移动视口模拟（非 Safari、非真机）覆盖 430×932 / 390×844 / 360×800 / 320×700：无横向溢出、编辑器可用（398–630px）、底部操作栏与 5 标签可用（`a7_e2e` 51/51、`layout_e2e` 116/116）。这些结果**不能**替代 iOS Safari 真机验收。

iOS 专项未执行项：输入法弹出后的页面位移、触摸滚动与点击、iOS 软键盘遮挡、Safari 的 localStorage 清理策略、iOS 省电模式下的 Worker 行为。

---

## 五、Android Chrome 测试结果

**未执行（真实设备）**。原因：无 adb、无 Android 真机/模拟器。

补充模拟（Chrome 158 视口 + CPU 节流）：320–430px 竖屏无横向滚动、底部操作栏可见、编辑器可用、商店/背包/结算可操作；软键盘与系统导航栏遮挡未在真机验证。

Android 专项未执行项：系统返回键、后台切换恢复、旋转、真实触摸长按、软键盘遮挡、厂商浏览器差异。

---

## 六、低性能设备性能记录（CPU 6× 节流模拟）

| 项目 | 实测 | 说明 |
|---|---|---|
| 环境 | Chrome 158，360×800 DPR2，CPU 6× 降速 | **模拟，不是真机** |
| 首次启动到主菜单 | 4.4s | 冷启动 + 节流 |
| 地图 → 关卡编辑器 | 13.8s | 含 Monaco 加载 |
| 简单代码运行（3 次平均） | 305ms | `print(i)` |
| 死循环终止 | 484ms，kind=`runtime` | 页面未卡死，可继续运行 |
| 200 次 localStorage 写入 | 49ms | 无阻塞 |
| JS 堆 | 23MB / 30MB | 无持续增长迹象 |
| 布局 | 无横向溢出，编辑器 498px | 360×800 |

低性能模拟 9/9 通过，但发现一个 P2 差异：6× 节流下 `while True` 被快速终止并归类为“运行时错误”，而不是正常环境下的“超时”（正常 Firefox 5.3s 归类 timeout）。页面可恢复、下一次运行正常，属于提示分类差异，不影响可玩性；未在真机复现，记录为 P2。

---

## 七、Hint Ticket E2E 测试结果（24 条中 12 条）

`test/a7_1_features_e2e.mjs`，真实 React store + jsdom，结果全部通过：

- 持有 1 张提示券时，MIRA 提示按钮可用；
- 使用后提示券 1→0，本关 `hintLevels` 不增加（提示券不占普通提示层数）；
- 提示内容正常显示在 MIRA 面板，且不直接包含目标输出；
- 再点一次（无券）按普通提示计层：`hintLevels=1`；
- 刷新后提示券仍为 0、提示层数仍为 1；
- 无券时点击不会凭空增加/扣减；
- 连续快速点击两次只消耗 1 张，且不会重复叠层；
- 挑战结算/退出/重进后数量一致（刷新场景覆盖）。

未发现重复扣券、负数、刷新回滚或提示泄露答案。

---

## 八、Boss Shield E2E 测试结果（24 条中 12 条）

按项目真实设计验收（未改 Boss 规则）：护盾在“本关失败次数超过容错”时抵消纠错者攻击；Boss 反击是独立机制，护盾不改变它。

- 进入 Boss 战前持有 1 层护盾；
- 在 `gate-01` 失败计数达到容错时提交错误攻击：护盾消耗为 0，**不弹出攻击界面**，`failedAttempts['gate-01']` 清零；
- Boss 反击仍按原机制扣意识（100→85），Boss 失败计数正常增加，未误判 Boss 已击破；
- 护盾只生效一次，第二次提交不会重复激活；
- 无护盾时攻击事件正常触发，不出现负数；
- 刷新后护盾保持 0（不会复活），意识伤害保持；
- 护盾不会影响其他普通关卡（增益按关卡 id 隔离）。

结论：护盾实际有效，且没有改变 Boss 血量、阶段、伤害与判定。

---

## 九、A1–A7 回归测试结果

| 模块 | 套件 | 结果 |
|---|---|---|
| A1 | draft_check / draft_e2e | 52/52 · 39/39 |
| A2 | layout_e2e | 116/116 |
| A3 | diagnose_check / diagnose_e2e | 62/62 · 52/52 |
| A4 | session_check / settlement_e2e | 44/44 · 46/46 |
| A5 | shop_check / shop_e2e | 63/63 · 45/45 |
| A6 | economy_check / economy_e2e | 44/44 · 19/19 |
| A7 | a7_save_check / a7_integration_check / a7_e2e | 95/95 · 33/33 · 51/51 |
| Boss | boss_battle_check / boss_verify / boss_battle_e2e / difficulty_e2e | 105/105 · 19/19 · 24/24 · 36/36 |
| 剧情/章节 | chapter_flow 133、chapter3–6 各 31、story/ending/vault | 通过 |
| 判题 | verify 71、mp_verify 71、smoke、audit_initial | 通过 |
| A7.1 新增 | a7_1_features_e2e / a7_1_firefox_e2e / a7_1_lowend_sim | 24/24 · 20/20 · 9/9 |

---

## 十、发现的问题及 P0/P1/P2 分类

| 编号 | 级别 | 问题 | 影响 |
|---|---|---|---|
| A71-01 | **P0** | A7 的存档白名单只允许关卡 id，加载时把 `failedAttempts['gate-01']` 等 **Boss 失败计数清零** | Boss 容错/攻击在刷新/重载后失效，护盾无法被触发；已修复 |
| A71-02 | P2 | CPU 6× 节流下死循环归类为 `runtime` 而非 `timeout`（484ms 终止） | 仅提示文案/分类差异，页面可恢复；真机未复现 |
| A71-03 | P2 | Playwright 自带 Firefox 在中文路径下无法启动（测试环境问题） | 不影响游戏；测试改用 ASCII 临时目录 |
| A71-04 | P2 | 真实浏览器里剧情弹窗会拦截程序化点击（测试脚本问题） | 不影响游戏；测试增加弹窗关闭逻辑 |

P1：无。iOS/Android/真机低性能未执行，属于“未执行”而非“通过”，不计为 P1 缺陷。

---

## 十一、问题修复记录

**A71-01（P0，已修复）**

- 复现：A7 报告中 `normalizePlayerState` 对 `failedAttempts` 使用 `LEVEL_ID_SET`，Boss id 不在其中；加载存档即清空 Boss 失败计数，Boss 攻击/护盾路径无法触发。
- 修复：新增 `FAIL_ID_SET = LEVEL_ID_SET ∪ BOSS_ID_SET`，`failedAttempts` 使用联合白名单；普通关卡未知 id 仍被过滤。
- 测试：`a7_save_check` 增加“Boss 失败计数保留”断言（95/95）；`a7_1_features_e2e` 的 Boss 护盾用例在修复后 24/24 通过。
- 影响范围：仅存档自愈白名单，不改 Boss 规则、不改难度、不改数值。

**测试环境修复（非产品）**

- Firefox 启动路径：`PLAYWRIGHT_BROWSERS_PATH` 指向 ASCII 临时目录；
- 真实浏览器弹窗：测试脚本先关闭 `.dlg-root` 剧情弹窗；
- 依赖误删：安装 Playwright 时 npm 剪掉了未写入 manifest 的 MicroPython 包，已恢复（1.29.0-6），相关 4 个判题套件重新通过。

---

## 十二、修改文件清单

| 文件 | 说明 |
|---|---|
| `src/services/save.ts` | `failedAttempts` 白名单加入 Boss id（P0 修复） |
| `test/a7_save_check.mjs` | 新增 Boss 失败计数保留断言（94→95） |
| `test/a7_1_features_e2e.mjs` | 新增：Hint Ticket + Boss Shield 24 条 |
| `test/a7_1_firefox_e2e.mjs` | 新增：真实 Firefox 20 条 |
| `test/a7_1_lowend_sim.mjs` | 新增：CPU 6× 节流模拟 9 条 |

未改：判题、关卡、Boss、碎片、经济数值、商店价格、剧情。

---

## 十三、新增测试文件清单

- `test/a7_1_features_e2e.mjs`（24）
- `test/a7_1_firefox_e2e.mjs`（20）
- `test/a7_1_lowend_sim.mjs`（9）

---

## 十四、TypeScript 检查结果

`npx tsc --noEmit`：**0 错误**。

## 十五、生产构建结果

`npm run build`：**成功**，`assets/game.js` 963 KB。

---

## 十六、未执行测试及原因

| 项目 | 状态 | 原因 |
|---|---|---|
| iOS Safari 真机 | 未执行 | Windows 主机，无 iPhone/iPad/WebKit |
| Android Chrome 真机 | 未执行 | 无 adb、无 Android 设备/模拟器 |
| 真实低性能设备 | 未执行 | 无低端机；仅 CPU 6× 节流模拟 |
| Safari 桌面 | 未执行 | 无 macOS |
| Edge | 未执行 | 未安装/未纳入本轮 |
| 跨浏览器视觉像素对比 | 未执行 | 无真机截图基线 |

---

## 十七、剩余风险

1. iOS Safari 的软键盘、触摸滚动、localStorage 清理策略仍未真机验证，存在移动端体验风险（P1 级未知，未执行）。
2. Android 系统返回键/后台切换/旋转未真机验证。
3. 低性能真机的帧率与内存表现未知；模拟仅证明功能不阻塞。
4. 6× 节流下死循环提示分类为 runtime（P2），建议后续排查 Worker 超时分类，但不影响当前可玩性。
5. 本地存档安全边界不变：可防误操作/脏数据，不能防直接改档。

---

## 十八、最终验收结论

**CONDITIONAL PASS（有条件通过）**

- Firefox 桌面真实浏览器：通过（20/20）。
- Hint Ticket 专项：通过（12 条）。
- Boss Shield 专项：通过（12 条）。
- A1–A7 回归：通过。
- P0：1 项（Boss 失败计数被清空）已修复并回归；当前 P0 = 0。
- P1：0。
- P2：3 项（节流下超时分类、Firefox 中文路径测试环境、弹窗拦截测试脚本）。
- 未执行：iOS Safari 真机、Android Chrome 真机、真实低性能设备、Safari 桌面、Edge。

按 A7.1 验收标准，“真实 iOS、Android、低性能设备测试已执行”未满足，因此**不能**将结论更新为 PASS；在补齐真机验收前保持 CONDITIONAL PASS。

V1.2-A 停止开发，等待项目负责人验收；未经批准不进入 V1.3。
