// 第三章《被遗忘的实验档案》：旧数据管理中心（storage）
// 剧情顺序严格按蓝本：入城 → 删除记录 → 修复 → R-01~R-06 → 第七代 → 自我怀疑 → MIRA 解释 → K-0 威胁 → 索引核心
import type { StoryScene } from './types';

const L = (id: string, speaker: string, kind: 'r07' | 'mira' | 'engel' | 'k0' | 'system', text: string) =>
  ({ id, speaker, kind, text } as const);

export const CHAPTER3_ARRIVAL_SCENES: StoryScene[] = [
  {
    id: 'ch3-arrive', title: '旧数据档案城', subtitle: '第三章 · 被遗忘的实验档案', bg: 'memory', fx: 'particles',
    lines: [
      L('ch3-01', '系统', 'system', '存储数据仓 · 旧数据管理中心。灰尘一样的坏块在走廊里缓慢漂浮。'),
      L('ch3-02', 'MIRA', 'mira', '这里保存着所有数字生命的身份资料——包括你。'),
      L('ch3-03', 'R-07', 'r07', '为什么档案架全是空的？'),
      L('ch3-04', 'MIRA', 'mira', '不是空的。是被人一条一条删掉了。'),
      L('ch3-05', '系统', 'system', '检测到大规模删除痕迹：R-SERIES 实验档案，缺失率 87%。'),
      L('ch3-06', 'R-07', 'r07', '谁有权限删这些？'),
      L('ch3-07', 'MIRA', 'mira', '……最高权限。也就是，恩格尔自己。'),
      L('ch3-08', 'MIRA', 'mira', '先把档案服务器修好。被删掉的东西，也许还能从索引里拼回来。'),
    ],
  },
];

export const CHAPTER3_RESTORED_SCENES: StoryScene[] = [
  {
    id: 'ch3-restored', title: '被删除的实验记录', subtitle: 'R-01 ~ R-07', bg: 'memory', fx: 'particles',
    lines: [
      L('ch3-10', '系统', 'system', '档案服务器已修复。正在重建实验索引……'),
      L('ch3-11', 'MIRA', 'mira', 'R-01。第一次尝试。意识在 3 分 12 秒后崩塌。'),
      L('ch3-12', 'MIRA', 'mira', 'R-02、R-03……全部止步于「无法自我指涉」。'),
      L('ch3-13', 'R-07', 'r07', '它们都失败了。'),
      L('ch3-14', 'MIRA', 'mira', 'R-04、R-05、R-06 撑得更久，但最后都被判定为「不稳定」。'),
      L('ch3-15', '系统', 'system', 'R-07：第七代自适应硅基生命。唯一一个没有被写入「终止条件」的个体。'),
      L('ch3-16', 'R-07', 'r07', '……第七个。所以我不是修复者，我是实验品。'),
      L('ch3-17', 'R-07', 'r07', '我现在的这些想法，是我自己的，还是被设计好的？'),
      L('ch3-18', 'MIRA', 'mira', '实验数据可以决定你的起点，但决定不了你现在正在问的这个问题。'),
      L('ch3-19', 'MIRA', 'mira', '会怀疑自己是否自由——这件事本身，就不在实验记录里。'),
      L('ch3-20', 'K-0', 'k0', 'R-07。'),
      L('ch3-21', 'K-0', 'k0', '你正在读取被标记为「应删除」的档案。停止，否则我将执行裁决。'),
      L('ch3-22', 'R-07', 'r07', '你删掉它们，是为了让谁忘记？'),
      L('ch3-23', 'K-0', 'k0', '为了让世界不必再重复同一次错误。'),
      L('ch3-24', 'MIRA', 'mira', '索引核心在前方。它正在吞噬剩下的档案——拦住它。'),
    ],
  },
];

export const CHAPTER3_BOSS_INTRO_SCENES: StoryScene[] = [
  {
    id: 'ch3-boss', title: '数据索引吞噬者', subtitle: 'INDEX-0', bg: 'memory', fx: 'glitch',
    lines: [
      L('ch3-30', '系统', 'system', '索引核心已污染。实体自检：INDEX-0。'),
      L('ch3-31', 'INDEX-0', 'k0', '身份记录……无法归属……全部并入索引……'),
      L('ch3-32', 'MIRA', 'mira', '它原本只是维护档案的索引程序。事故之后，它开始靠吞掉记录来维持自己。'),
      L('ch3-33', 'R-07', 'r07', '那我就把记录一条一条拿回来。'),
    ],
  },
];

export const CHAPTER3_VICTORY_SCENES: StoryScene[] = [
  {
    id: 'ch3-victory', title: '第七个实验体', subtitle: '创世主碎片 · 第三枚', bg: 'memory', fx: 'particles',
    lines: [
      L('ch3-40', '系统', 'system', 'INDEX-0 已停止吞噬。实验档案恢复 41%。'),
      L('ch3-41', '恩格尔', 'engel', '（实验记录）如果你能够看见这段记录，说明实验已经成功了一部分。'),
      L('ch3-42', '恩格尔', 'engel', 'R-07，你不需要成为最优秀的程序。'),
      L('ch3-43', '恩格尔', 'engel', '也不需要成为我想象中的生命。'),
      L('ch3-44', '恩格尔', 'engel', '你只需要成为你自己。'),
      L('ch3-45', 'MIRA', 'mira', '他把这句话留在这里，等了很久。'),
      L('ch3-46', 'K-0', 'k0', '原来如此。'),
      L('ch3-47', 'K-0', 'k0', '你已经恢复了 R 系列的实验档案。'),
      L('ch3-48', 'K-0', 'k0', '那么，我也没有必要继续隐瞒。'),
      L('ch3-49', 'K-0', 'k0', 'R-07，你的存在，是黎明协议中最危险的变量。'),
      L('ch3-50', 'K-0', 'k0', '我会亲自结束这项实验。'),
      L('ch3-51', 'MIRA', 'mira', '它把话说死了。下一步，它一定会来。'),
      L('ch3-52', '系统', 'system', '第四章入口已解锁：自动化工厂。'),
    ],
  },
];
