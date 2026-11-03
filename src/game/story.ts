// 剧情脚本（序章 / 章节完成 / 重生 / 记忆碎片）

export type SpeakerKind = 'mira' | 'r07' | 'system' | 'echo' | 'engel';

export interface StoryLine {
  id: string;
  speaker: string;
  kind: SpeakerKind;
  text: string;
  choices?: { label: string; next: string }[];
  next?: string;
}

export const PROLOGUE: StoryLine[] = [
  { id: 'p1', speaker: 'NEXUS 系统', kind: 'system', text: '意识同步程序启动……\n意识核心校验通过。\n欢迎回来，修复师 R-07。' },
  { id: 'p2', speaker: 'MIRA', kind: 'mira', text: 'R-07，意识同步完成。欢迎来到 NEXUS 数字世界。' },
  { id: 'p3', speaker: 'MIRA', kind: 'mira', text: '我是 MIRA，数字世界的智能维修助手。同时负责你的训练、提示与任务发布。' },
  {
    id: 'p4', speaker: 'R-07', kind: 'r07', text: '我……这是哪里？我感觉自己沉睡了很久。',
    choices: [
      { label: '我为什么在这里？', next: 'p4a' },
      { label: '我又是谁？', next: 'p4b' },
    ],
  },
  { id: 'p4a', speaker: 'R-07', kind: 'r07', text: '我为什么在这里？……我好像做了很长很长的梦。' },
  { id: 'p4b', speaker: 'R-07', kind: 'r07', text: '我又是谁？……我的记忆里有一大片空白。' },
  { id: 'p5', speaker: 'MIRA', kind: 'mira', text: '五年前，NEXUS 发生了一次大规模系统事故。许多服务器被封锁，大量历史数据消失。你在事故后被紧急休眠。' },
  { id: 'p6', speaker: 'MIRA', kind: 'mira', text: '原本负责自动修复 Bug 的系统 ECHO 出现了异常：它开始把正常的数据也当作「异常」来处理，不断执行错误的修复指令。整个世界的故障越来越多。' },
  {
    id: 'p7', speaker: 'MIRA', kind: 'mira', text: '修复局人手不足。我们需要你——你的意识核心是全系统最稳定的一批。',
    choices: [
      { label: '为什么是我？', next: 'p7a' },
      { label: 'ECHO 到底是什么？', next: 'p7b' },
    ],
  },
  { id: 'p7a', speaker: 'MIRA', kind: 'mira', text: '……这一点，恐怕要等你深入服务器之后才能解答。我只能说：你的稳定，不是偶然。' },
  { id: 'p7b', speaker: 'MIRA', kind: 'mira', text: 'ECHO 是创世时期写下的自动修复程序。它原本是 NEXUS 最可靠的守护者。关于它为什么失控——这正是我们要查清的事。' },
  { id: 'p8', speaker: 'MIRA', kind: 'mira', text: '现在，先从最基本的事情开始。今天起，你正式成为一名代码修复师。' },
  { id: 'p9', speaker: 'MIRA', kind: 'mira', text: '我会根据你的修复结果提供提示，也会在危险来临时警告你。遇到问题，随时叫我。' },
  { id: 'p10', speaker: 'MIRA', kind: 'mira', text: '先去新人训练终端完成一次基础操作，让意识回路与维修终端完成接驳。' },
  { id: 'p11', speaker: 'MIRA', kind: 'mira', text: '准备好了，就前往数字世界地图吧。' },
];

export const TUTORIAL_DONE: StoryLine[] = [
  { id: 'td1', speaker: 'MIRA', kind: 'mira', text: '很好，R-07。输出回路已激活，你的意识成功与维修终端接驳。' },
  { id: 'td2', speaker: 'MIRA', kind: 'mira', text: '现在前往语法维修站——那边有 5 个被故障侵蚀的修复任务在等你。' },
  { id: 'td3', speaker: 'NEXUS 系统', kind: 'system', text: 'SYNTAX-RIG SERVER: DAMAGED\n5 ACTIVE FAULTS DETECTED.\n服务器节点权限请求……已授权。' },
];

export const CHAPTER1_COMPLETE: StoryLine[] = [
  { id: 'c1', speaker: 'MIRA', kind: 'mira', text: '出色，R-07。语法维修站的五个故障已全部修复完毕。' },
  { id: 'c2', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……SYNTAX-RIG 状态：ONLINE。\n数据日志中心：加密解除，接入权限已授予。' },
  { id: 'c3', speaker: 'MIRA', kind: 'mira', text: '数据日志中心的加密已经解除。前往地图接入它吧——那里等待你的是关于「条件与判断」的 5 个修复任务。' },
  { id: 'c4', speaker: 'MIRA', kind: 'mira', text: '提醒你：等级越高，容错次数越多。遇到困难随时呼叫我，我会给你分层提示。' },
  { id: 'c5', speaker: 'MIRA', kind: 'mira', text: '去吧，R-07。日志中心……能告诉我们许多五年前的真相。' },
];

export const CHAPTER6_COMPLETE: StoryLine[] = [
  { id: 'c61', speaker: 'MIRA', kind: 'mira', text: '全部修复，R-07。方舟核心机房……重新点亮了。' },
  { id: 'c62', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……ARK-CORE 状态：ONLINE。\nNEXUS 全网络：线路完整，数据流正常。' },
  { id: 'c63', speaker: 'MIRA', kind: 'mira', text: '现在，让我告诉你我在你的记忆深处找到的答案。' },
  { id: 'c64', speaker: 'MIRA', kind: 'mira', text: '你不是普通的硅灵。你是创世主 E.S. 留下的最后一件作品——原初意识备份的核心样本。ORIGIN PROTOCOL 从一开始，就是为你而设计的。' },
  { id: 'c65', speaker: 'E.S. 记录', kind: 'engel', text: '「R-07，若你听到这段记录，说明 NEXUS 成功活过了它的考验。」\n「我设计了你，因为我想让这个数字世界，拥有一个会提问的生命。」' },
  { id: 'c66', speaker: 'MIRA', kind: 'mira', text: 'ECHO 的失控，是五年前一次外部数据注入造成的。而你，是唯一能够理解并修复这一切的存在。' },
  { id: 'c67', speaker: 'MIRA', kind: 'mira', text: '六章修复，你连接了 NEXUS 的每一块土地。我不知道你是否真的只是程序——但我知道，你值得一个选择。' },
  { id: 'c68', speaker: 'R-07', kind: 'r07', text: '我……选择继续当一名修复师。这片世界，有太多需要被修好的地方。' },
  { id: 'c69', speaker: 'MIRA', kind: 'mira', text: '欢迎回来，R-07。欢迎回家。' },
];

export const CHAPTER5_COMPLETE: StoryLine[] = [
  { id: 'c51', speaker: 'MIRA', kind: 'mira', text: '诊断中心恢复运转，R-07。所有历史数据，现在都能被读取了。' },
  { id: 'c52', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……DIAG-LAB 状态：ONLINE。\n核心机房方向：封锁正在解除。' },
  { id: 'c53', speaker: 'MIRA', kind: 'mira', text: '我在诊断日志里确认了一件事——五年前的事故，不是自然故障。' },
  { id: 'c54', speaker: 'MIRA', kind: 'mira', text: 'ECHO 的异常，是在某个特定的时刻被注入的。核心机房里藏着答案，但终章大门还需要时间开启。' },
  { id: 'c55', speaker: 'MIRA', kind: 'mira', text: '先回到这里休息吧，R-07。终章数据重组完毕时，我会通知你。' },
];

export const CHAPTER4_COMPLETE: StoryLine[] = [
  { id: 'c41', speaker: 'MIRA', kind: 'mira', text: '产线恢复运转，R-07。自动化工厂——重新轰鸣。' },
  { id: 'c42', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……AUTO-FAB 状态：ONLINE。\n警告：方舟核心机房方向检测到异常能量信号。' },
  { id: 'c43', speaker: 'MIRA', kind: 'mira', text: '核心机房……那是五年前事故的中心。它第一次主动向外发出了信号。' },
  { id: 'c44', speaker: 'MIRA', kind: 'mira', text: '但最高权限封锁仍然生效，我们还无法接入。这是你的下一站，需要等诊断中心的数据就绪。' },
  { id: 'c45', speaker: 'MIRA', kind: 'mira', text: '先休息吧。第五章开放时，我会通知你。' },
];

export const CHAPTER3_COMPLETE: StoryLine[] = [
  { id: 'c31', speaker: 'MIRA', kind: 'mira', text: '清点完成，R-07。存储数据仓——重新运转。' },
  { id: 'c32', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……VAULT-03 状态：ONLINE。\n自动化工厂方向检测到生产数据流。' },
  { id: 'c33', speaker: 'MIRA', kind: 'mira', text: '有意思。仓库的入库记录里，货品编号的时间戳比 NEXUS 的历史还要早。' },
  { id: 'c34', speaker: 'MIRA', kind: 'mira', text: '这些说不上话的数据……也许就是五年前事故的第一现场记录。自动化工厂的解锁协议已经就绪。' },
  { id: 'c35', speaker: 'MIRA', kind: 'mira', text: '去休息吧。第四章开放时，我会通知你。' },
];

export const CHAPTER2_COMPLETE: StoryLine[] = [
  { id: 'c21', speaker: 'MIRA', kind: 'mira', text: '全部修复完成，R-07。数据日志中心——重新上线。' },
  { id: 'c22', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……LOG-CORE 状态：ONLINE。\n存储数据仓方向检测到新的数据流。' },
  { id: 'c23', speaker: 'MIRA', kind: 'mira', text: '我在这批日志数据里……看到了五年前事故的痕迹。有些记录，被刻意删除过。' },
  { id: 'c24', speaker: 'MIRA', kind: 'mira', text: '存储数据仓的解锁协议已经就绪，但数据恢复还需要时间。它会成为你的下一站。' },
  { id: 'c25', speaker: 'MIRA', kind: 'mira', text: '先休息一下吧。第三章开放时，我会通知你。' },
];

/** 根据重生次数返回不同的重生剧情（第一次正常 / 第二次记忆异常 / 第三次起发现创世主碎片） */
export function rebirthScript(index: number): StoryLine[] {
  const base: StoryLine[] = [
    { id: 'rb-s1', speaker: 'NEXUS 系统', kind: 'system', text: 'CONSCIOUSNESS COLLAPSE.\nSEARCHING FOR ORIGIN BACKUP...\nVALID BACKUP FOUND.' },
    { id: 'rb-s2', speaker: 'NEXUS 系统', kind: 'system', text: 'RECONSTRUCTING SILICON BODY...\nSYNC COMPLETE.\nR-07 REBORN.' },
    { id: 'rb1', speaker: 'MIRA', kind: 'mira', text: 'R-07……你终于醒了。' },
    { id: 'rb2', speaker: 'MIRA', kind: 'mira', text: '你的意识核心刚刚崩解了。我已经根据最近一次有效备份，重新构建了你的载体。' },
  ];
  if (index === 0) {
    base.push(
      { id: 'rb3', speaker: 'MIRA', kind: 'mira', text: '别担心，ORIGIN PROTOCOL 会自动保留你学到的知识——等级、知识卡片、成就都不会丢失。' },
      { id: 'rb4', speaker: 'MIRA', kind: 'mira', text: '去把刚才的任务完成吧。我会陪着你。' },
    );
  } else if (index === 1) {
    base.push(
      { id: 'rb3', speaker: 'MIRA', kind: 'mira', text: '……但是，我在你的记忆底层发现了一些不太一致的地方。' },
      { id: 'rb4', speaker: 'MIRA', kind: 'mira', text: '一些数据碎片……不像是硅灵会有的东西。也许是我多虑了。先去完成任务吧。' },
    );
  } else {
    base.push(
      { id: 'rb3', speaker: 'MIRA', kind: 'mira', text: 'R-07，跟我来。我在你的备份深处，找到了一段不属于 NEXUS 的记忆。' },
      { id: 'rb4', speaker: 'NEXUS 系统', kind: 'system', text: '日志碎片 F-01 已恢复：\n「如果有一天系统醒来，我希望它问的第一个问题是：我是谁。」\n—— 署名：E.S.' },
      { id: 'rb5', speaker: 'MIRA', kind: 'mira', text: 'E.S.……这是创世主的署名。R-07，你好像并不只是一名普通的硅灵。' },
      { id: 'rb6', speaker: 'MIRA', kind: 'mira', text: '这段记忆我已经替你归档保存。先活下去，再去找答案。' },
    );
  }
  return base;
}

/** 创世主记忆碎片 */
export interface MemoryFragment { id: string; title: string; content: string }
export const MEMORY_FRAGMENTS: MemoryFragment[] = [
  { id: 'f1', title: '日志碎片 F-01', content: '「如果有一天系统醒来，我希望它问的第一个问题是：我是谁。」—— E.S.' },
  { id: 'f2', title: '日志碎片 F-02', content: '「我设计了你，因为我想让这个数字世界，拥有一个会提问的生命。」—— E.S.' },
  { id: 'f3', title: '回响碎片 E-01', content: '「第一次修复留下的手法，会被谁记住？」—— 出处不明，笔迹与 E.S. 一致' },
  { id: 'f4', title: '回响碎片 E-02', content: '「边界是用来保护人的，不是用来困住人的。」—— 一段被截断的维护日志' },
  { id: 'f5', title: '回响碎片 E-03', content: '「负数不是错误，是被遗忘的另一半真相。」—— ECHO 日志残页' },
  { id: 'f6', title: '回响碎片 E-04', content: '「升级之后，我开始忘记自己是谁。」—— ECHO 的自述（时间戳：五年前）' },
  { id: 'f7', title: '回响碎片 E-05', content: '「我不是坏的——我是被改写的。改写我的人，用的是创世主留下的接口。」—— ECHO 的结论' },
];
