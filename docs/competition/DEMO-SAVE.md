# NEXUS 竞赛 Demo Save 说明

## 1. 文件

| 文件 | 状态 | 用途 |
|---|---|---|
| `docs/competition/demo-challenge-save.json` | Lv.1 / 70 XP / 训练终端未通关 | 演示首次代码修复 |
| `docs/competition/demo-save.json` | Lv.5 / 730 XP / 第一章完成 / Boss 待挑战 | 演示 MIRA / Boss / Explore / Profile |
| `docs/competition/demo-save-summary.json` | 摘要 | 快速检查等级、MIRA、成就 |

## 2. 导入

推荐使用独立 Chrome Profile 或独立浏览器窗口，避免覆盖正式存档。

1. 打开游戏。
2. 主菜单 → 系统配置。
3. 找到“导入存档”，选择 Demo Save JSON。
4. 导入会覆盖当前浏览器存档。
5. 刷新页面，确认等级与进度符合预期。

验证结果：

- Challenge Demo Save 加载为 Lv.1 / 70 XP。
- Demo Save 加载为 Lv.5 / 730 XP，MIRA Lv.3，5 个成就。
- Boss GATE-01 可进入，Boss 尚未首胜。
- Explore 训练区域已完成，隐藏信号可调查。

## 3. 备份正式存档

导入前：

1. 系统配置 → 导出 JSON。
2. 保存 `nexus-save-v10.json` 到安全位置。
3. 演示结束后重新导入正式存档。

## 4. 切换演示存档

### 方案 A：手动导入（推荐，简单）

- 第二幕前导入 `demo-challenge-save.json`。
- 第四幕前导入 `demo-save.json`。
- 每次切换后刷新一次。

### 方案 B：两个浏览器 Profile

- Profile A：Challenge Demo Save。
- Profile B：Boss / Explore Demo Save。
- 演示时切换窗口，不需要等待导入。

### 方案 C：两个浏览器（不同用户数据目录）

适合正式舞台，避免同一 Profile 的 localStorage 相互覆盖。

## 5. 恢复与删除

恢复：

- 系统配置 → 导入备份 JSON。
- 刷新页面。

删除演示存档：

```js
localStorage.removeItem('nexus_code_repair_save_v1')
```

然后刷新。游戏会重新初始化新存档。

注意：

- 不要删除 `nexus_code_repair_save_v1` 以外的键。
- 不要修改 SAVE_VERSION。
- 不要手工编辑 `version` 字段。

## 6. 演示限制

- Demo Save 不包含 Boss 首胜，避免提前消耗演示内容。
- Demo Save 不包含隐藏信号完成状态，保留 Explore 演示点。
- Demo Save 不代表正式玩家进度，仅用于竞赛展示。
- 导入会覆盖当前进度，必须备份正式存档。

## 7. 文件位置

```text
docs/competition/
  demo-save.json
  demo-challenge-save.json
  demo-save-summary.json
```
