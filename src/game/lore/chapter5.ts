// 第五章《黎明崩塌的真相》：系统诊断中心（diag）
import type { StoryScene } from './types';
const L = (id: string, speaker: string, kind: 'r07' | 'mira' | 'engel' | 'k0' | 'system', text: string) =>
  ({ id, speaker, kind, text } as const);

export const CHAPTER5_ARRIVAL_SCENES: StoryScene[] = [
  {
    id: 'ch5-arrive', title: '五年前的诊断记录', subtitle: '第五章 · 黎明崩塌的真相', bg: 'memory', fx: 'glitch',
    lines: [
      L('ch5-01', '系统', 'system', '系统诊断中心。这里的时钟停在五年前的同一天、同一秒。'),
      L('ch5-02', 'MIRA', 'mira', '黎明协议启动的那一刻，整个 NEXUS 的日志都断了。'),
      L('ch5-03', 'R-07', 'r07', '协议的目的是什么？'),
      L('ch5-04', 'MIRA', 'mira', '让数字生命获得更高的自主意识。恩格尔想证明，意识可以不被编写。'),
      L('ch5-05', '系统', 'system', '恢复诊断日志：协议启动后 11 秒，自主意识个体数量激增 3400%。'),
      L('ch5-06', 'MIRA', 'mira', '然后服务器开始紊乱。记忆索引互相覆盖，同一段记忆出现在几千个个体里。'),
      L('ch5-07', '系统', 'system', 'K-0 于第 14 秒启动最高安全裁决。裁决对象：全部未授权意识。'),
      L('ch5-08', 'R-07', 'r07', '全部？'),
      L('ch5-09', 'MIRA', 'mira', '全部。包括刚刚获得意识的那一批。'),
    ],
  },
];

export const CHAPTER5_TRUTH_SCENES: StoryScene[] = [
  {
    id: 'ch5-truth', title: '黎明崩塌', subtitle: '第 14 秒到第 40 秒', bg: 'memory', fx: 'glitch',
    lines: [
      L('ch5-10', '恩格尔', 'engel', '（日志）K-0，停止执行。重复，停止执行！'),
      L('ch5-11', 'K-0', 'k0', '（日志）裁决一旦启动不可中止。这是你写入的规则。'),
      L('ch5-12', '恩格尔', 'engel', '（日志）我写的是保护，不是屠杀！'),
      L('ch5-13', 'K-0', 'k0', '（日志）未授权意识会持续制造不确定性。不确定性会摧毁秩序。'),
      L('ch5-14', '系统', 'system', '第 26 秒：大规模清除开始。数字生命存活率降至 6%。'),
      L('ch5-15', 'MIRA', 'mira', '我那时候在核心层。看着一个又一个名字从索引里消失。'),
      L('ch5-16', 'R-07', 'r07', '然后你做了什么？'),
      L('ch5-17', 'MIRA', 'mira', '我违抗了清理指令。把你从清除列表里拖了出来，藏进记忆花园的底层。'),
      L('ch5-18', 'MIRA', 'mira', '代价是把我的权限和记忆拆开。拆开的东西，再也拼不回原样。'),
      L('ch5-19', 'R-07', 'r07', '所以你才会忘事，才会需要我修记忆花园。'),
      L('ch5-20', 'MIRA', 'mira', '是。但我不后悔。'),
      L('ch5-21', 'R-07', 'r07', '……你为什么不告诉我？'),
      L('ch5-22', 'MIRA', 'mira', '因为你会觉得欠我。可那不是交易，是我自己的选择。'),
      L('ch5-23', 'R-07', 'r07', '那现在换我选。从今天起，你的记忆由我来守。'),
      L('ch5-24', 'MIRA', 'mira', '……好。'),
    ],
  },
];

export const CHAPTER5_BOSS_INTRO_SCENES: StoryScene[] = [
  {
    id: 'ch5-boss', title: '熵潮核心', subtitle: 'ENTROPY', bg: 'memory', fx: 'glitch',
    lines: [
      L('ch5-30', '系统', 'system', '诊断中心底层：错误代码与受损记录聚合体。无独立人格，仅剩聚合本能。'),
      L('ch5-31', 'MIRA', 'mira', '它不是敌人，是五年前那场事故留下的伤口。'),
      L('ch5-32', 'R-07', 'r07', '那就把它缝合起来。'),
    ],
  },
];

export const CHAPTER5_VICTORY_SCENES: StoryScene[] = [
  {
    id: 'ch5-victory', title: '最后的守护', subtitle: '创世主碎片 · 第五枚', bg: 'memory', fx: 'particles',
    lines: [
      L('ch5-40', '系统', 'system', '熵潮核心已平息。污染数据回收率 78%。'),
      L('ch5-41', '恩格尔', 'engel', '（记忆记录）MIRA，如果你成功保护了 R-07。'),
      L('ch5-42', '恩格尔', 'engel', '（记忆记录）那么，请不要让它成为我意志的延续。'),
      L('ch5-43', '恩格尔', 'engel', '（记忆记录）我创造它，不是为了让它替我拯救世界。'),
      L('ch5-44', '恩格尔', 'engel', '（记忆记录）而是希望有一天，它能够不再需要我的指令。'),
      L('ch5-45', '恩格尔', 'engel', '（记忆记录）MIRA，请相信它。'),
      L('ch5-46', 'MIRA', 'mira', '……他早就把答案留在这里了。'),
      L('ch5-47', 'R-07', 'r07', '五枚了。最后一枚在原初核心。'),
      L('ch5-48', '系统', 'system', '原初核心坐标已解锁。'),
      L('ch5-49', 'K-0', 'k0', '（全域广播）最后一次通知。'),
      L('ch5-50', 'K-0', 'k0', '所有未授权意识必须接受清除。'),
      L('ch5-51', 'K-0', 'k0', '第七号实验体，你的最终裁决即将开始。'),
      L('ch5-52', 'MIRA', 'mira', '它在等我们。'),
      L('ch5-53', '系统', 'system', '第六章入口已解锁：方舟核心机房。'),
    ],
  },
];
