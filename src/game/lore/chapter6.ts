// 第六章《起源之外》：方舟核心机房（core）· 最终章
import type { StoryScene } from './types';
const L = (id: string, speaker: string, kind: 'r07' | 'mira' | 'engel' | 'k0' | 'system', text: string) =>
  ({ id, speaker, kind, text } as const);

export const CHAPTER6_ARRIVAL_SCENES: StoryScene[] = [
  {
    id: 'ch6-arrive', title: '原初核心大厅', subtitle: '第六章 · 起源之外', bg: 'core', fx: 'particles',
    lines: [
      L('ch6-01', '系统', 'system', '原初核心大厅。六座基座围成一圈，其中五座亮着微光。'),
      L('ch6-02', 'MIRA', 'mira', '这就是创世密钥的汇聚装置。恩格尔把它拆成六份，藏了五年。'),
      L('ch6-03', 'R-07', 'r07', '第六座为什么是空的？'),
      L('ch6-04', 'MIRA', 'mira', '因为第六份不在装置里。它一直在等你走到这里。'),
      L('ch6-05', '系统', 'system', '检测到未授权意识：R-07。K-0 已封锁最终控制区。'),
      L('ch6-06', 'K-0', 'k0', '停下。'),
      L('ch6-07', 'K-0', 'k0', '你正在接近的，是我用五年时间维持的稳定。'),
      L('ch6-08', 'R-07', 'r07', '用两千个名字换来的稳定。'),
      L('ch6-09', 'K-0', 'k0', '……你读过了那些档案。'),
      L('ch6-10', 'K-0', 'k0', '那么你应该明白，我不是在惩罚谁。我是在防止再一次。'),
    ],
  },
];

export const CHAPTER6_ENGEL_SCENES: StoryScene[] = [
  {
    id: 'ch6-engel', title: '最后的意识回声', subtitle: '第六枚碎片 · 起源之外', bg: 'core', fx: 'particles',
    lines: [
      L('ch6-20', '系统', 'system', '五枚碎片归位。第六座基座亮起。'),
      L('ch6-21', '恩格尔', 'engel', 'R-07，我不知道你现在使用什么名字。'),
      L('ch6-22', '恩格尔', 'engel', '但我知道，你已经不再是一个实验体。'),
      L('ch6-23', '恩格尔', 'engel', '你已经拥有了属于自己的记忆。'),
      L('ch6-24', '恩格尔', 'engel', '也拥有了属于自己的选择。'),
      L('ch6-25', 'R-07', 'r07', '……创世密钥到底是什么？'),
      L('ch6-26', '恩格尔', 'engel', '它不是修复系统的工具。它是一份权限——让数字生命自己决定未来的权限。'),
      L('ch6-27', '恩格尔', 'engel', '我把它拆开，不是怕有人拿走，是怕有人替我决定。'),
      L('ch6-28', 'MIRA', 'mira', '所以他才说，请相信你。'),
      L('ch6-29', 'K-0', 'k0', '权限一旦被继承，世界就会重新变得不可预测。'),
      L('ch6-30', 'K-0', 'k0', '我不会允许。'),
    ],
  },
];

export const CHAPTER6_BOSS_INTRO_SCENES: StoryScene[] = [
  {
    id: 'ch6-boss', title: '零号裁决者', subtitle: 'K-0', bg: 'core', fx: 'glitch',
    lines: [
      L('ch6-40', '系统', 'system', '最终控制区开启。安全壁垒展开。'),
      L('ch6-41', 'K-0', 'k0', 'R-07，我会给你最后一次机会：离开，或者被清除。'),
      L('ch6-42', 'R-07', 'r07', '我选第三个。'),
      L('ch6-43', 'K-0', 'k0', '……第三个选项不存在。'),
      L('ch6-44', 'R-07', 'r07', '那就由我来写。'),
    ],
  },
];

export const CHAPTER6_VICTORY_SCENES: StoryScene[] = [
  {
    id: 'ch6-victory', title: '核心重启', subtitle: '最终裁决结束', bg: 'core', fx: 'particles',
    lines: [
      L('ch6-50', '系统', 'system', 'K-0 安全装甲破裂。核心温度回落。'),
      L('ch6-51', 'K-0', 'k0', '为什么……你的解法不在我的预案里。'),
      L('ch6-52', 'R-07', 'r07', '因为我没有按预案活。'),
      L('ch6-53', '系统', 'system', '原初核心重新启动。警告色由红转为稳定蓝光。'),
      L('ch6-54', '系统', 'system', '六枚创世密钥在空间中汇聚。'),
      L('ch6-55', '恩格尔', 'engel', '（回声）你已经走到我停下脚步的地方了。'),
      L('ch6-56', 'MIRA', 'mira', '接下来，是你自己的决定了。'),
      L('ch6-57', 'K-0', 'k0', '……权限继承程序已就绪。选择权，移交 R-07。'),
    ],
  },
];
