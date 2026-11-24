# NEXUS V1.3 · Final Known Issues

- 日期：2026-11-23
- 版本：NEXUS V1.3 / `nexus-code-repair@1.1.3`
- SAVE_VERSION：10
- 状态：Final Freeze 候选

## P0

0。

## P1

0。

## P2

0。

影响竞赛演示的 P2 已在 F.2/F.3 修复：

- 探索奖励流水刷新丢失。
- 探索终端结算新成就漏显示。
- 全局 Error Boundary 缺失。
- ESM 分块 React 双实例（开发期发现，交付前修复）。

## P3

| 编号 | 问题 | 影响 | 处理建议 |
|---|---|---|---|
| P3-01 | `gameStore` 仍集中初始化全部业务引擎 | Initial JS 仍有 1.17 MB | 不在 Final Freeze 重构；V1.4 再评估按域拆 store |
| P3-02 | CSS 全部首屏加载（约 236 KB） | 首屏多约 236 KB | 优先保持视觉稳定，暂不拆 CSS |
| P3-03 | Chunk 加载失败 Retry 采用整页 reload | 当前页面状态会回到启动页 | 数据安全；如需原地恢复，F.5/V1.4 再优化 |
| P3-04 | 性能数据存在环境波动 | 首屏 1.5–2.8s 均出现过 | 以多次采样中位数评估；现场先预热 |
| P3-05 | 入口不带 query，依赖 index no-cache | 部署缓存配置不当可能加载旧入口 | 静态服务器保持 index no-cache；chunk 使用 hash |
| P3-06 | 未做物理移动设备实测 | 仅 360/390/430/768 视口模拟 | 现场使用桌面演示；移动端以 Chromium 模拟为准 |
| P3-07 | 主要浏览器验证为 Chrome | Edge Chromium 预期兼容，Firefox/Safari 未重新回归 | 竞赛演示固定使用 Chrome |
| P3-08 | 依赖 Google Fonts | 离线/弱网时字体回退 | 已有本地字体回退；现场网络允许时更佳 |
| P3-09 | Demo Save 导入会覆盖正式存档 | 可能误覆盖玩家进度 | 使用独立 Profile；导入前导出备份 |
| P3-10 | Boss Victory 截图中 Toast 可能覆盖右侧 | 竞赛截图仍可用 | 如需更干净截图，演示前等待 Toast 消失再截 |
| P3-11 | 无内置“演示模式” | 需手动导入 Demo Save | 不新增系统；使用 DEMO-SAVE.md 流程 |
| P3-12 | 无后端、无排行榜、无多人 | 不具备在线服务能力 | 项目定位为纯前端离线演示 |

## 浏览器兼容性

| 浏览器 | 状态 |
|---|---|
| Chrome（系统版 / Playwright） | 已实测 |
| Edge Chromium | 预期兼容，未单独回归 |
| Firefox | 未作为 Final 验收浏览器 |
| Safari / iOS | 未实测 |

ESM 动态 import、WASM、Monaco 需要现代浏览器。不支持非常旧的浏览器。

## 低端设备

- 未在真实低端 Android / 旧笔记本上实测。
- 视觉性能模式、Reduced Motion、粒子预算已存在。
- 360 / 390 / 430 / 768 视口通过，不代表低端 GPU 帧率。

## 部署风险

- 必须通过静态服务器访问，不建议直接 `file://` 打开。
- `game.js` 为 ESM 入口，需正确 MIME。
- `.wasm` 需要 `application/wasm`。
- 动态 chunk 使用相对路径，子路径部署需保持 `base` 相对。
- index 建议 no-cache；chunk 使用 hash 可长期缓存。
- 未自动部署到任何平台。

## 性能限制

- Initial JS 1,195,937 bytes；Total JS 2,141,686 bytes。
- 首屏仍包含启动握手、字体、Python 预热。
- 页面切换首次需要加载对应 chunk；已有 Loading。
- Boss 页面 chunk 约 296 KB，首次进入有可感知加载。
- Monaco 资源约 14 MB，按需加载；首次挑战受本地磁盘/网络影响。

## 当前未实现

- 在线账号 / 云存档。
- 排行榜 / 多人。
- 外部 AI API / 在线 LLM。
- 职业 / 装备 / 技能树。
- 正式 Demo 模式切换器（以 Demo Save 文件替代）。
- 真实低端设备性能认证。
- Safari / Firefox 完整回归。
- 自动部署流水线。

以上不阻塞当前竞赛演示。
