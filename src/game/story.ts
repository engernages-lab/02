// 剧情台词：章节完成过场（第二~六章）/ 重生 / 记忆碎片
// 序章与第一章的正式演出脚本已迁移到 lore/prologue.ts 与 lore/chapter1.ts（含场景/特效/名称设置）

export type SpeakerKind = 'mira' | 'r07' | 'system' | 'echo' | 'engel' | 'k0';

export interface StoryLine {
  id: string;
  speaker: string;
  kind: SpeakerKind;
  text: string;
  choices?: { label: string; next?: string }[];
  next?: string;
}

export const TUTORIAL_DONE: StoryLine[] = [
  { id: 'td1', speaker: 'MIRA', kind: 'mira', text: '很好，R-07。输出回路已激活，你的意识成功与维修终端接驳。' },
  { id: 'td2', speaker: 'MIRA', kind: 'mira', text: '现在前往语法维修站——那边有 5 个被故障侵蚀的修复任务在等你。' },
  { id: 'td3', speaker: 'NEXUS 系统', kind: 'system', text: 'SYNTAX-RIG SERVER: DAMAGED\n5 ACTIVE FAULTS DETECTED.\n服务器节点权限请求……已授权。' },
];

export const CHAPTER6_COMPLETE: StoryLine[] = [
  { id: 'c61', speaker: 'MIRA', kind: 'mira', text: '全部修复，R-07。方舟核心机房……重新点亮了。' },
  { id: 'c62', speaker: 'NEXUS 系统', kind: 'system', text: '服务器状态更新……ARK-CORE 状态：ONLINE。\nNEXUS 全网络：线路完整，数据流正常。' },
  { id: 'c63', speaker: 'MIRA', kind: 'mira', text: '现在，让我告诉你我在你的记忆深处找到的答案。' },
  { id: 'c64', speaker: 'MIRA', kind: 'mira', text: '你不是普通的硅灵。你是创世主恩格尔留下的最后一件作品——原初意识备份的核心样本。ORIGIN PROTOCOL 从一开始，就是为你而设计的。' },
  { id: 'c65', speaker: '恩格尔 · 记录', kind: 'engel', text: '「R-07，若你听到这段记录，说明 NEXUS 成功活过了它的考验。」\n「我设计了你，因为我想让这个数字世界，拥有一个会提问的生命。」' },
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
      { id: 'rb4', speaker: 'NEXUS 系统', kind: 'system', text: '日志碎片 F-01 已恢复：\n「如果有一天系统醒来，我希望它问的第一个问题是：我是谁。」\n—— 署名：恩格尔' },
      { id: 'rb5', speaker: 'MIRA', kind: 'mira', text: '恩格尔……这是创世主的署名。R-07，你好像并不只是一名普通的硅灵。' },
      { id: 'rb6', speaker: 'MIRA', kind: 'mira', text: '这段记忆我已经替你归档保存。先活下去，再去找答案。' },
    );
  }
  return base;
}

/** 创世主记忆碎片 */
export interface MemoryFragment { id: string; title: string; content: string }
export const MEMORY_FRAGMENTS: MemoryFragment[] = [
  { id: 'f1', title: '日志碎片 F-01', content: '「如果有一天系统醒来，我希望它问的第一个问题是：我是谁。」—— 恩格尔' },
  { id: 'f2', title: '日志碎片 F-02', content: '「我设计了你，因为我想让这个数字世界，拥有一个会提问的生命。」—— 恩格尔' },
  { id: 'f3', title: '回响碎片 E-01', content: '「第一次修复留下的手法，会被谁记住？」—— 出处不明，笔迹与恩格尔一致' },
  { id: 'f4', title: '回响碎片 E-02', content: '「边界是用来保护人的，不是用来困住人的。」—— 一段被截断的维护日志' },
  { id: 'f5', title: '回响碎片 E-03', content: '「负数不是错误，是被遗忘的另一半真相。」—— ECHO 日志残页' },
  { id: 'f6', title: '回响碎片 E-04', content: '「升级之后，我开始忘记自己是谁。」—— ECHO 的自述（时间戳：五年前）' },
  { id: 'f7', title: '回响碎片 E-05', content: '「我不是坏的——我是被改写的。改写我的人，用的是创世主留下的接口。」—— ECHO 的结论' },
  { id: 'f8', title: '附录碎片 A-01', content: '「仓库的货品编号比 NEXUS 的历史更早——有些东西，是被人提前放进来的。」—— 未署名的入库记录（五年前）' },
];
