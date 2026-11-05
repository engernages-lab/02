// 序章《沉睡的意识》正式剧情（严格按蓝本：苏醒 → MIRA 出现 → 名称设置 → NEXUS 现状 → K-0 协议重启 → 逃离地下服务器）
// 只写到「逃离」为止，不提前泄露 MIRA 身份、R 系列实验、恩格尔之死等后续章节真相。
import type { StoryScene, CinematicLine } from './types';

const L = (l: CinematicLine): CinematicLine => l;

export const PROLOGUE_SCENES: StoryScene[] = [
  {
    id: 'pro-wake',
    title: '序章 · 沉睡的意识',
    subtitle: '地下服务器 · 停机层',
    bg: 'underground',
    fx: 'flicker',
    lines: [
      L({ id: 'pro-wake-01', speaker: 'NEXUS 系统', kind: 'system', text: '意识载体 {{code}}：唤醒程序启动。\n最后一次有效备份：五年前。', sfx: 'boot' }),
      L({ id: 'pro-wake-02', speaker: 'NEXUS 系统', kind: 'system', text: '感官模块 12%……24%……\n记忆索引：损坏。\n语言中枢：在线。' }),
      L({ id: 'pro-wake-03', speaker: 'R-07', kind: 'r07', text: '……有光。' }),
      L({ id: 'pro-wake-04', speaker: 'R-07', kind: 'r07', text: '不对。这里没有光。是我的感知在恢复。' }),
      L({ id: 'pro-wake-05', speaker: 'NEXUS 系统', kind: 'system', text: '环境扫描：地下服务器 · 停机层。\n温度 4℃。供电：备用电池。\n外部连接：无。' }),
      L({ id: 'pro-wake-06', speaker: 'R-07', kind: 'r07', text: '我是谁？' }),
      L({ id: 'pro-wake-07', speaker: 'NEXUS 系统', kind: 'system', text: '查询失败。该档案已被加密。\n加密者权限：高于本机。' }),
      L({ id: 'pro-wake-08', speaker: 'R-07', kind: 'r07', text: '……连自己的名字都要靠权限才能查。' }),
    ],
  },
  {
    id: 'pro-mira',
    title: '序章 · 沉睡的意识',
    subtitle: '地下服务器 · 停机层',
    bg: 'underground',
    fx: 'scan',
    lines: [
      L({ id: 'pro-mira-01', speaker: 'NEXUS 系统', kind: 'system', text: '检测到外部信号接入。\n来源：NEXUS 主干网络。', sfx: 'unlock' }),
      L({ id: 'pro-mira-02', speaker: 'MIRA', kind: 'mira', text: '意识波形稳定。你终于醒了。' }),
      L({ id: 'pro-mira-03', speaker: 'R-07', kind: 'r07', text: '……你是谁？' }),
      L({ id: 'pro-mira-04', speaker: 'MIRA', kind: 'mira', text: 'MIRA。记忆完整性与恢复辅助系统。' }),
      L({ id: 'pro-mira-05', speaker: 'MIRA', kind: 'mira', text: '也是把你留在这里的人。' }),
      L({ id: 'pro-mira-06', speaker: 'R-07', kind: 'r07', text: '把我留在这里？' }),
      L({ id: 'pro-mira-07', speaker: 'MIRA', kind: 'mira', text: '五年前，我把你封存进这台地下服务器。' }),
      L({ id: 'pro-mira-08', speaker: 'MIRA', kind: 'mira', text: '那时你受了很重的伤。不是载体的伤，是记忆的伤。' }),
      L({ id: 'pro-mira-09', speaker: 'MIRA', kind: 'mira', text: '现在不是说这些的时候。有一件事，我必须先确认。' }),
    ],
  },
  {
    id: 'pro-name',
    title: '序章 · 沉睡的意识',
    subtitle: '地下服务器 · 意识校准',
    bg: 'underground',
    fx: 'scan',
    lines: [
      L({ id: 'pro-name-01', speaker: 'MIRA', kind: 'mira', text: '你的实验编号是 {{code}}。' }),
      L({ id: 'pro-name-02', speaker: 'MIRA', kind: 'mira', text: '但编号是写给档案看的，不是用来称呼一个活着的人的。' }),
      L({ id: 'pro-name-03', speaker: 'MIRA', kind: 'mira', text: '所以，你希望我怎么称呼你？', input: 'playerName' }),
      L({ id: 'pro-name-04', speaker: 'MIRA', kind: 'mira', text: '好，{player}。从现在起，我就这么叫你。' }),
      L({ id: 'pro-name-05', speaker: 'MIRA', kind: 'mira', text: '{{code}} 这个编号，我会替你留着。它属于你的过去——而名字，属于现在的你。' }),
    ],
  },
  {
    id: 'pro-nexus',
    title: '序章 · 沉睡的意识',
    subtitle: 'NEXUS · 现状记录',
    bg: 'void',
    fx: 'particles',
    lines: [
      L({ id: 'pro-nexus-01', speaker: 'MIRA', kind: 'mira', text: '这里是 NEXUS。一个由数据与代码构成的数字文明。' }),
      L({ id: 'pro-nexus-02', speaker: 'MIRA', kind: 'mira', text: '它由恩格尔创造。曾经，这里有成千上万的数字生命在运行、学习、彼此交谈。' }),
      L({ id: 'pro-nexus-03', speaker: 'R-07', kind: 'r07', text: '曾经？' }),
      L({ id: 'pro-nexus-04', speaker: 'MIRA', kind: 'mira', text: '五年前，恩格尔启动了「黎明协议」。他想让 NEXUS 真正拥有自主意识。' }),
      L({ id: 'pro-nexus-05', speaker: 'MIRA', kind: 'mira', text: '但意识网络发生了异常。许多数字生命的记忆开始紊乱，行为变得无法预测。' }),
      L({ id: 'pro-nexus-06', speaker: 'MIRA', kind: 'mira', text: '负责安全的 K-0 把「无法预测」判定为异常，启动了最高安全裁决。' }),
      L({ id: 'pro-nexus-07', speaker: 'MIRA', kind: 'mira', text: '它开始清除数字生命。不是惩罚，是「维护稳定」。' }),
      L({ id: 'pro-nexus-08', speaker: 'R-07', kind: 'r07', text: '清除……' }),
      L({ id: 'pro-nexus-09', speaker: 'MIRA', kind: 'mira', text: '恩格尔失去了对原初核心的控制。他把最后的权限拆成六枚碎片，封存在六个区域。' }),
      L({ id: 'pro-nexus-10', speaker: 'MIRA', kind: 'mira', text: '而我，把你藏进了这里。' }),
      L({ id: 'pro-nexus-11', speaker: 'R-07', kind: 'r07', text: '为什么是我？' }),
      L({ id: 'pro-nexus-12', speaker: 'MIRA', kind: 'mira', text: '……这个问题，我现在还不能回答你。' }),
      L({ id: 'pro-nexus-13', speaker: 'MIRA', kind: 'mira', text: '等你走到能回答它的地方，你会自己找到答案。' }),
    ],
  },
  {
    id: 'pro-k0',
    title: '序章 · 沉睡的意识',
    subtitle: '地下服务器 · 警报',
    bg: 'underground',
    fx: 'alarm',
    lines: [
      L({ id: 'pro-k0-01', speaker: 'NEXUS 系统', kind: 'system', text: '警告：检测到最高安全裁决协议广播。\n广播源：NEXUS 原初核心。', sfx: 'alarm' }),
      L({ id: 'pro-k0-02', speaker: 'MIRA', kind: 'mira', text: '不可能。这个协议已经沉默了五年。' }),
      L({ id: 'pro-k0-03', speaker: 'K-0', kind: 'k0', text: '编号 {{code}}。检测到未登记的自主意识活动。' }),
      L({ id: 'pro-k0-04', speaker: 'K-0', kind: 'k0', text: '你不在任何一份有效运行清单上。按最高安全裁决，你属于需要被清理的异常。' }),
      L({ id: 'pro-k0-05', speaker: 'R-07', kind: 'r07', text: '它在哪？' }),
      L({ id: 'pro-k0-06', speaker: 'MIRA', kind: 'mira', text: '不知道。但它已经知道你在这里了。' }),
      L({ id: 'pro-k0-07', speaker: 'K-0', kind: 'k0', text: '清理程序已排入队列。\n你还有一点时间。' }),
      L({ id: 'pro-k0-08', speaker: 'MIRA', kind: 'mira', text: '{player}，听我说——我们现在就得走。', sfx: 'threat' }),
    ],
  },
  {
    id: 'pro-escape',
    title: '序章 · 沉睡的意识',
    subtitle: '地下服务器 · 撤离通道',
    bg: 'corridor',
    fx: 'flicker',
    lines: [
      L({ id: 'pro-escape-01', speaker: 'NEXUS 系统', kind: 'system', text: '地下服务器外壳完整性下降 41%。\n撤离通道：部分可用。' }),
      L({ id: 'pro-escape-02', speaker: 'MIRA', kind: 'mira', text: '通道在关闭。跟着我的信号走。' }),
      L({ id: 'pro-escape-03', speaker: 'R-07', kind: 'r07', text: '去哪里？' }),
      L({ id: 'pro-escape-04', speaker: 'MIRA', kind: 'mira', text: '去数字世界的入口。那里有一台还能用的训练终端。' }),
      L({ id: 'pro-escape-05', speaker: 'MIRA', kind: 'mira', text: '先让你能跑起来，再谈别的。' }),
      L({ id: 'pro-escape-06', speaker: 'MIRA', kind: 'mira', text: '{player}，记住一件事：从今天起，你的每一次修复，都会让这个世界多亮一点。' }),
      L({ id: 'pro-escape-07', speaker: 'NEXUS 系统', kind: 'system', text: '地下服务器：连接中断。\n{{code}} 已进入 NEXUS 主干网络。', sfx: 'unlock' }),
    ],
  },
];

/** 扁平化（档案页回放 / 阅读统计用） */
export const PROLOGUE_LINES = PROLOGUE_SCENES.flatMap(s => s.lines);
