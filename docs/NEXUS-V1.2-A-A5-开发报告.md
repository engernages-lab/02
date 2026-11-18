# NEXUS V1.2-A · A5 兑换中心、真实交易与道具效果系统 · 开发报告

> 阶段：V1.2-A / A5（A6 未开始）
> 分支：`feature/v1.2-a-experience-polish`
> 前置：A1（f1c90a9）、A2（b536df2）、A3（6d9c802）、A4（c03ad54）均已通过并保持可用
> 存档版本：v8 → **v9**

---

## 一、开发前商城架构分析

改动前兑换中心只有一套最小实现：

- 商品数据写在 `src/game/rewards.ts` 的 `SHOP_ITEMS`（17 件），字段只有 id/名称/图标/价格/描述/旧分组/unique/count/slot/flag；
- 购买逻辑内联在 `store.buyShopItem`：判断「是否已拥有 / 余额是否够 / 扣钱 / 加库存或外观 / 写 flag」，没有交易记录、没有限购、没有数量；
- 页面 `RewardCenterPage` 是「分类标签 + 卡片 + 卡片内直接购买按钮」，没有详情、没有二次确认；
- `equipItem` 只能装备、不能卸下；`consumeItem` 只减数量，不产生任何效果；
- 存档里没有交易记录、限购计数、增益状态；
- 唯一被真实消费的道具是挑战页的扫描器/回滚与档案页的解码器，其余商品只是「买到背包里放着」。

A5 要解决的是：**让每件商品都有真实功能，让每次购买都有可核对的账。**

---

## 二、商品数据结构

新增 `src/game/shop.ts`，商品数据与展示彻底分离：

```ts
interface ShopItem {
  id, name, icon, desc;
  category: 'look' | 'tool' | 'special';   // 兼容旧分组（旧测试/旧文案）
  type: 'defense' | 'energy' | 'exp' | 'skill' | 'look' | 'special'; // A5 六类
  price: number;                           // 唯一价格来源
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  kind: 'consumable' | 'permanent' | 'equipment' | 'boost';
  effect: string;                          // 详情页展示的真实功能
  unique?, count?, slot?, flag?;           // 旧字段保留
  usable?, equippable?, permanent?;
  maxOwn?: number;                         // 限购（默认永久 1 / 消耗品 99）
  listed?: boolean;                        // 是否上架
  grants?: { buff?: { kind, amount?, mult? }, items?: Record<string, number> };
}
```

22 件商品覆盖六类：

- 防御：护盾核心（自动拦截一次攻击）、容错护符（超限时挡一次）、意识护罩（伤害减半）
- 能量：意识稳定模块（+10）、纳米修复液（+30）
- 经验：经验增幅器（下次首通 ×1.5，最多 3 次）
- 技能：错误定位扫描器、数据回滚模块、提示券（提示不计入本关次数）
- 外观：终端主题 ×2、粒子背景、称号 ×2、登录界面、地图背景、头像框 ×2
- 特殊：记忆解码器、MIRA 专属对话、机密档案、修复特效

`SHOP_ITEMS` / `shopItemById` 从 `rewards.ts` 重新导出，旧引用与旧测试字段（`count`、`category`、`slot`）保持兼容。

---

## 三、交易系统设计

新增 `src/game/shopTx.ts` 作为**纯逻辑交易层**（不依赖 React / localStorage，可单测）：

```
purchaseItem(player, itemId, qty, requestId, now) → { ok, reason?, duplicate?, player, transaction, charged }
```

校验顺序（全部在业务层重新计算，前端只能传 itemId + 数量 + 请求 id）：

1. 商品是否存在；2. 是否上架；3. 数量是否为 1..99 的整数；4. 请求 id 是否重复；
5. 是否已拥有（永久/外观）；6. 限购（已购 + 数量 ≤ maxOwn）；7. 余额是否足够 `price × qty`；
8. 扣费、写背包/外观/flag、累加限购计数、写交易记录——**一次返回新状态，store 只提交一次**。

因此不会出现「扣了钱没发货 / 发了货没扣钱」；重复点击与重复请求由 `requestId` 去重；前端改价没有意义，因为金额只用 `item.price`。

失败也会写入一条 `status: 'failed'` 的交易记录（金额 0，带原因），便于玩家核对。

---

## 四、货币扣除机制

- 唯一货币仍是既有 `rewards.credits`（贡献点），没有另建货币；
- 扣费发生在 `purchaseItem` 内部：`credits - (item.price × qty)`，与发放写在同一个返回对象里；
- 关卡奖励、章节奖励、Boss 奖励仍然走 A4 的 `completeLevel` 幂等事务，商城不参与、不重复发放；
- 购买前后余额写入同一份存档，刷新后一致（e2e 断言）。

---

## 五、背包实现

兑换中心新增 4 个标签：**兑换商城 / 我的背包 / 交易记录 / 记忆档案**。

背包内容由存档实时推导（不另存一份背包）：

- 消耗品：`rewards.items[id] > 0`，显示数量；
- 装备/外观：`rewards.skins` 包含；
- 永久权益：`progress.flags[flag] === true`；
- 顶部展示当前增益：护盾 / 容错护符 / 意识护罩 / 提示券 / 经验增幅剩余次数。

筛选项：全部 / 消耗品 / 装备 / 外观 / 特殊。每行提供「详情」与「使用 / 装备 / 卸下」，使用条件不满足时按钮禁用并给出原因（如「请在挑战页工具栏使用」）。

所有使用都经过 `useItem()` 校验：库存 > 0、数量不为负、意识不超过 100、增益不超过 3 层、增幅不超过 3 次。

---

## 六、道具真实效果

| 类别 | 道具 | 生效位置 |
|---|---|---|
| 防御 | 护盾核心 | `recordFail`：失误超过容错时自动消耗护盾，判定为防御成功并清零本关失误 |
| 防御 | 容错护符 | 同上，优先于护盾；不改变容错上限（A4 规则未动） |
| 防御 | 意识护罩 | `resolveDefense(false)` 与 Boss 反击：本次意识损失减半并消耗 |
| 能量 | 稳定模块 / 纳米修复液 | 背包直接使用，恢复 10 / 30，封顶 100，满意识时拒绝 |
| 经验 | 经验增幅器 | `completeLevel`：首次通关经验 ×1.5，消耗 1 次，结算面板显示「经验增幅 ×1.5」 |
| 技能 | 扫描器 / 回滚 | 挑战页原有工具栏消费（行为不变） |
| 技能 | 提示券 | `askHint`：优先消耗提示券，不计入本关提示层数 |
| 外观 | 9 件外观 | 装备/卸下写入 `equipped`，状态卡称号与头像框即时刷新 |
| 特殊 | 解码器 / MIRA 对话 / 机密档案 / 修复特效 | 解码器在档案页消费；其余为永久 flag，购买即生效 |

商城页面本身不直接改游戏核心状态：页面只调用 store 的 `purchaseShopItem / useShopItem / equipItem / unequipItem`，效果逻辑集中在 `shopTx` 与 `recordFail / completeLevel / resolveDefense`。

---

## 七、存档与迁移

- `RewardState` 新增三个字段：
  - `transactions: ShopTransaction[]`（最多 30 条，成功/失败都记）；
  - `purchases: Record<string, number>`（限购依据）；
  - `buffs: { shield, guard, barrier, hintTicket, expBoost }`。
- `normalizeRewards` 负责清洗：非法余额归零、交易记录字段修补、限购计数取整、增益层数限制 0..3、非法增幅丢弃（倍率 ≤1 视为无效）。
- 存档版本 **v8 → v9**，迁移步骤只做 `rewards = normalizeRewards(rewards)`，不覆盖其它字段；v1–v8 迁移链原样保留。
- 默认档、导入/导出、清档、A4 会话字段均不受影响。

---

## 八、修改文件清单

| 类型 | 文件 | 说明 |
|---|---|---|
| 新增 | `src/game/shop.ts` | 商品目录、分类/稀有度元数据、购买状态、交易与增益类型、上限常量 |
| 新增 | `src/game/shopTx.ts` | 纯逻辑购买事务、使用道具、装备/卸下 |
| 修改 | `src/game/rewards.ts` | 移除旧商品表（改为 re-export）、新增交易/限购/增益字段与规范化 |
| 修改 | `src/services/migrations.ts` | `CURRENT_SAVE_VERSION = 9` + v8→v9 迁移 |
| 修改 | `src/store/gameStore.tsx` | `purchaseShopItem / useShopItem / unequipItem / consumeHintTicket`；经验增幅接入 `completeLevel`；护盾/护符接入 `recordFail`；护罩接入防御与 Boss 反击 |
| 修改 | `src/pages/RewardCenterPage.tsx` | 商城/背包/交易记录/档案四标签、详情抽屉、二次确认、稀有度视觉、portal 渲染 |
| 修改 | `src/pages/ChallengePage.tsx` | 提示券优先、HUD 增益显示、结算「经验增幅 ×1.5」 |
| 修改 | `src/styles/global.css` + `public/global.css` | 商城网格/稀有度/抽屉/确认框/背包/交易列表/手机适配 |
| 修改 | 10 处测试的版本断言 | v8 → v9 |
| 修改 | `test/smoke.mjs`、`test/reward_e2e.mjs` | 适配「卡片 → 详情 → 购买 → 二次确认」新流程 |
| 修改 | `test/rewards_voice_check.mjs` | 加载器支持相对 import（rewards 现在依赖 shop） |
| 新增 | `test/shop_check.mjs` | 63 条纯逻辑断言 |
| 新增 | `test/shop_e2e.mjs` | 45 条真实浏览器断言 |
| 新增 | `docs/a5-screens/*.png` | 详情、背包、手机商城/详情、经验增幅结算截图 |

未改动：`judge.ts`、`levels.ts`、`battle.ts`、章节流程、Boss 首胜事务、A3 诊断核心、A1 草稿、A2 布局、A4 会话与容错规则。

---

## 九、测试数量与通过率

| 套件 | 结果 |
|---|---|
| `shop_check`（目录/交易/限购/去重/道具/装备/脏数据） | **63 / 63** |
| `shop_e2e`（真实购买/背包/装备/刷新/手机/增幅结算） | **45 / 45** |
| `session_check`（A4） | 44 / 44 |
| `settlement_e2e`（A4） | 46 / 46 |
| `draft_check` / `draft_e2e`（A1） | 52/52 · 39/39 |
| `diagnose_check` / `diagnose_e2e`（A3） | 62/62 · 52/52 |
| `layout_e2e`（A2） | 116 / 116 |
| `verify` / `mp_verify` | 71/71 · 71/71 |
| `boss_battle_check` / `boss_verify` / `boss_battle_e2e` | 105/105 · 19/19 · 24/24 |
| `audit_initial`（31 关初始代码） | 全部不通过（预期） |
| `smoke` | 全部通过 |
| 逻辑套件 12 组 | **1345 条全通过** |
| 其他 e2e（identity/chapter_gate/difficulty/reward/ending/journal/vault/voice/story_flow） | 30/27/36/18/17/11/28/16/46，全部通过 |
| `tsc --noEmit` / `npm run build` | 0 错误 / 954 KB |

### A5 关键断言

- 购买：扣费精确、库存/外观/flag 正确、交易记录含单价/数量/实付/请求 id；
- 双击「确认支付」只扣一次（同一 requestId 去重）；
- 余额不足、商品不存在、下架、已拥有、买满限购、数量 0/-1/1.5/100 全部被拒绝且不扣费；
- 道具：恢复封顶 100、满意识拒绝、库存归零后不再显示、增幅最多 3 次、护盾最多 3 层、扫描器/解码器场景限制；
- 装备：未拥有不能装备、装备写入槽位、卸下清空、重复卸下给原因；
- 刷新：余额、交易记录、库存、装备全部保持，且不重复记账；
- 经验增幅：60 × 1.5 = 90 进入真实结算与存档，用后消耗；
- 手机 390：两列网格、无横向溢出、整宽底部详情面板、购买按钮常驻可见。

---

## 十、PC / 平板 / 手机测试

| 设备 | 结果 |
|---|---|
| PC 1366×900 | 商城四列网格、详情右侧抽屉（购买按钮固定在底部）；背包、交易记录、档案完整（截图 `shop-detail.png`、`shop-bag.png`） |
| 手机 390×844 | 两列商品网格、无横向溢出；详情为整宽底部面板，购买按钮可见（`shop-mobile-sheet.png`）；购买后列表正常（`shop-mobile-list.png`） |
| 手机 320/360/430 | A2 布局回归 116/116 全通过；商城本身在 390 断言双列 + 无溢出 |
| 平板 900×800 | 布局回归通过；商城沿用同一套响应式规则 |

---

## 十一、A1–A4 回归结果

| 阶段 | 回归项 | 结果 |
|---|---|---|
| A1 自动保存 | 52/52、39/39；A5 挑战页改动后草稿仍正常 | 通过 |
| A2 响应式 | 116/116（六种宽度 + 横屏） | 通过 |
| A3 智能诊断 | 62/62、52/52（含 while 沙箱超时） | 通过 |
| A4 会话/容错/结算 | 44/44、46/46；HUD 容错与失败结算不受护盾/护符影响（防护时按防御成功语义清零） | 通过 |
| 判题/Boss/剧情 | 71/71、71/71、105/105、19/19、24/24、30/27/36/46 等 | 通过 |

---

## 十二、遗留问题与风险

**开发中发现并修复**

1. `buyStateOf` 只按单价判断余额，数量 ×2 时仍显示「购买」→ 改为按 `price × qty` 与限购余量判断（e2e 发现）。
2. 详情抽屉渲染在页面容器内，`position:fixed` 受页面高度影响，购买按钮被推到 1036px 不可见 → 改用 `createPortal` 挂到 `body`（截图发现）。
3. `rewards_voice_check` 的旧加载器不支持相对 import（rewards 现在依赖 shop）→ 升级加载器，断言不变。
4. 冒烟与奖励 e2e 仍按旧「卡片内直接购买」流程 → 更新为「详情 → 二次确认」，断言更贴近真实交互。

**遗留风险 / 已知限制**

1. 这是单机本地游戏，存档在 localStorage。业务层能防「前端改价、负数、超大数量、重复请求」，但无法防玩家直接编辑存档改余额——这是架构层面的固有限制，本阶段不做服务端校验。
2. 提示券在挑战页的消耗路径有实现与单元覆盖，但**没有专门的端到端断言**；建议 A6 或后续补齐。
3.  Boss 战中的护盾/护符/护罩复用同一套 `recordFail` 与伤害结算，逻辑已接通并有 Boss 回归，但**没有针对「Boss 战触发护盾」的专项 e2e**。
4. 经验增幅只对「首次通关」生效；重复通关不产生经验，因此也不会消耗增幅（符合现有结算规则）。
5. 交易记录最多保留 30 条，超出后按时间裁剪。
6. 商城价格体系未做经济平衡调整（价格沿用旧表并新增商品），A6 经济系统再统一。

---

## 十三、结论

A5 完成：商城从「只有购买动画」升级为真实交易系统——商品目录单一来源、购买原子化、扣费可核对、限购与去重生效、背包与装备可操作、六类道具都有真实效果、交易记录可查、刷新后状态一致、存档平滑迁移到 v9，PC 与手机体验统一。核心交易与道具/存档测试全部通过。

本阶段到此暂停，不开始 A6。
