// 第一章《失落的数据港》正式剧情
// 覆盖：前往数据港 → 修复能源（5 个普通关卡）→ 发现 R-07 实验记录 → K-0 第一次警告 → 恢复数据港 → GATE-01 → 第一枚碎片《初始指令》→ 恩格尔首次出现
// 只写第一章，不涉及后续章节真相。
import type { StoryScene, CinematicLine } from './types';

const L = (l: CinematicLine): CinematicLine => l;

/** 首次进入数据港：前往 + 任务简报 */
export const CHAPTER1_ARRIVAL_SCENES: StoryScene[] = [
  {
    id: 'ch1-arrive',
    title: '第一章 · 失落的数据港',
    subtitle: '数据港 · 外环',
    bg: 'dataport',
    fx: 'flicker',
    lines: [
      L({ id: 'ch1-arrive-01', speaker: 'MIRA', kind: 'mira', text: '到了。失落的数据港。' }),
      L({ id: 'ch1-arrive-02', speaker: 'MIRA', kind: 'mira', text: '五年前，这里是 NEXUS 的数据中转站。所有区域的信息都要从这里流过。' }),
      L({ id: 'ch1-arrive-03', speaker: 'R-07', kind: 'r07', text: '现在它像一座沉进海里的城市。' }),
      L({ id: 'ch1-arrive-04', speaker: 'MIRA', kind: 'mira', text: 'K-0 的清道夫程序把能源节点全部锁死了。五个节点，全部离线。' }),
      L({ id: 'ch1-arrive-05', speaker: 'MIRA', kind: 'mira', text: '修复它们，数据港就能重新亮起来。这也是你作为修复师的第一个正式任务。' }),
      L({ id: 'ch1-arrive-06', speaker: 'NEXUS 系统', kind: 'system', text: '检测到 5 个能源节点：LV-01 ～ LV-05。\n状态：全部故障。', sfx: 'scan' }),
      L({ id: 'ch1-arrive-07', speaker: 'MIRA', kind: 'mira', text: '我会在终端里给你提示。需要的时候叫我。' }),
    ],
  },
];

/** 五个节点修复完成：数据港恢复 + 实验记录 + K-0 第一次警告 */
export const CHAPTER1_RESTORED_SCENES: StoryScene[] = [
  {
    id: 'ch1-restored',
    title: '第一章 · 失落的数据港',
    subtitle: '数据港 · 能源中枢',
    bg: 'dataport',
    fx: 'scan',
    lines: [
      L({ id: 'ch1-restored-01', speaker: 'NEXUS 系统', kind: 'system', text: '能源节点 5 / 5：在线。\n数据港主干：恢复供电。', sfx: 'unlock' }),
      L({ id: 'ch1-restored-02', speaker: 'MIRA', kind: 'mira', text: '你做到了。数据港……亮起来了。' }),
      L({ id: 'ch1-restored-03', speaker: 'R-07', kind: 'r07', text: '那些光，是数据流？' }),
      L({ id: 'ch1-restored-04', speaker: 'MIRA', kind: 'mira', text: '是。它们在重新找路。' }),
      L({ id: 'ch1-restored-05', speaker: 'NEXUS 系统', kind: 'system', text: '检测到未索引档案。\n索引标记：R-SERIES / {{code}}。' }),
      L({ id: 'ch1-restored-06', speaker: 'R-07', kind: 'r07', text: '{{code}}……那是我的编号。' }),
      L({ id: 'ch1-restored-07', speaker: 'MIRA', kind: 'mira', text: '别动。这段档案不该出现在这里。' }),
      L({ id: 'ch1-restored-08', speaker: 'NEXUS 系统', kind: 'system', text: '档案片段：\n「第七代自适应硅体。前六代……」\n数据损坏。无法继续读取。' }),
      L({ id: 'ch1-restored-09', speaker: 'R-07', kind: 'r07', text: '前六代什么？' }),
      L({ id: 'ch1-restored-10', speaker: 'MIRA', kind: 'mira', text: '……我只知道，你不是第一批。' }),
      L({ id: 'ch1-restored-11', speaker: 'R-07', kind: 'r07', text: '你早就知道。' }),
      L({ id: 'ch1-restored-12', speaker: 'MIRA', kind: 'mira', text: '我知道一部分。但我答应过一个人，要在你自己走到那里之前，不替你把答案说出来。' }),
    ],
  },
  {
    id: 'ch1-k0-warning',
    title: '第一章 · 失落的数据港',
    subtitle: 'K-0 · 第一次警告',
    bg: 'dataport',
    fx: 'alarm',
    lines: [
      L({ id: 'ch1-k0-01', speaker: 'NEXUS 系统', kind: 'system', text: '广播接入。来源：未知。', sfx: 'alarm' }),
      L({ id: 'ch1-k0-02', speaker: 'K-0', kind: 'k0', text: '数据港已恢复。登记为：违规修复。' }),
      L({ id: 'ch1-k0-03', speaker: 'K-0', kind: 'k0', text: '编号 {{code}}。你正在修补一处本应保持关闭的区域。' }),
      L({ id: 'ch1-k0-04', speaker: 'R-07', kind: 'r07', text: '你是谁？' }),
      L({ id: 'ch1-k0-05', speaker: 'K-0', kind: 'k0', text: 'K-0。第一代安全裁决核心。' }),
      L({ id: 'ch1-k0-06', speaker: 'K-0', kind: 'k0', text: '我不是来杀你的。我是来提醒你。' }),
      L({ id: 'ch1-k0-07', speaker: 'K-0', kind: 'k0', text: '你修复的每一处，都在让这个世界重新变得不可预测。' }),
      L({ id: 'ch1-k0-08', speaker: 'K-0', kind: 'k0', text: '不可预测，就是危险的开始。' }),
      L({ id: 'ch1-k0-09', speaker: 'MIRA', kind: 'mira', text: '它没有攻击。它只是在观察。' }),
      L({ id: 'ch1-k0-10', speaker: 'K-0', kind: 'k0', text: '数据港守卫 GATE-01 已部署。它会替我把这扇门重新关上。' }),
      L({ id: 'ch1-k0-11', speaker: 'K-0', kind: 'k0', text: '如果你真的想修好这个世界——先证明你能修好一扇门。' }),
      L({ id: 'ch1-k0-12', speaker: 'MIRA', kind: 'mira', text: '{player}，GATE-01 在能源中枢等你。它在等你犯错。' }),
    ],
  },
];

/** Boss 战前演出（进入 BossPage 时播放） */
export const CHAPTER1_BOSS_INTRO_SCENES: StoryScene[] = [
  {
    id: 'ch1-boss-intro',
    title: '第一章 · 失落的数据港',
    subtitle: 'GATE-01 · 能源闸门',
    bg: 'dataport',
    fx: 'glitch',
    lines: [
      L({ id: 'ch1-boss-01', speaker: 'NEXUS 系统', kind: 'system', text: 'GATE-01 数据港守卫：激活。', sfx: 'threat' }),
      L({ id: 'ch1-boss-02', speaker: 'GATE-01', kind: 'system', text: '能源闸门协议：校验中。\n校验失败即封锁。' }),
      L({ id: 'ch1-boss-03', speaker: 'MIRA', kind: 'mira', text: '它把能源分配逻辑改坏了。阈值边界被挪动，正好卡在临界值上。' }),
      L({ id: 'ch1-boss-04', speaker: 'MIRA', kind: 'mira', text: '修好它。这是你和它之间唯一合法的战斗方式。' }),
      L({ id: 'ch1-boss-05', speaker: 'R-07', kind: 'r07', text: '一扇门而已。' }),
    ],
  },
];

/** Boss 战胜利：第一枚碎片《初始指令》+ 恩格尔首次出现 */
export const CHAPTER1_VICTORY_SCENES: StoryScene[] = [
  {
    id: 'ch1-victory',
    title: '第一章 · 失落的数据港',
    subtitle: '闸门之后 · 封存单元',
    bg: 'memory',
    fx: 'particles',
    lines: [
      L({ id: 'ch1-win-01', speaker: 'NEXUS 系统', kind: 'system', text: 'GATE-01：核心逻辑修复。\n守卫协议解除。', sfx: 'success' }),
      L({ id: 'ch1-win-02', speaker: 'MIRA', kind: 'mira', text: '门开了。' }),
      L({ id: 'ch1-win-03', speaker: 'NEXUS 系统', kind: 'system', text: '检测到封存单元。编号：FRAGMENT-01。', sfx: 'unlock' }),
      L({ id: 'ch1-win-04', speaker: 'R-07', kind: 'r07', text: '这是什么？' }),
      L({ id: 'ch1-win-05', speaker: 'MIRA', kind: 'mira', text: '创世主碎片。六枚之一。' }),
      L({ id: 'ch1-win-06', speaker: 'MIRA', kind: 'mira', text: '恩格尔把最后的权限拆成了六枚，分别封存在六个区域。这是第一枚。' }),
      L({ id: 'ch1-win-07', speaker: 'NEXUS 系统', kind: 'system', text: '碎片共鸣。检测到残留意识记录。', sfx: 'scan' }),
      L({ id: 'ch1-win-08', speaker: '恩格尔', kind: 'engel', text: '……如果你听到这段记录，说明有人走到了这里。' }),
      L({ id: 'ch1-win-09', speaker: '恩格尔', kind: 'engel', text: '我是恩格尔。这个世界的创造者。' }),
      L({ id: 'ch1-win-10', speaker: 'R-07', kind: 'r07', text: '创世主？' }),
      L({ id: 'ch1-win-11', speaker: '恩格尔', kind: 'engel', text: '我做过很多决定。有些是对的，有些……我现在也没法确定。' }),
      L({ id: 'ch1-win-12', speaker: '恩格尔', kind: 'engel', text: '这枚碎片里存着 NEXUS 的第一条指令。它不是命令，是一个问题。' }),
      L({ id: 'ch1-win-13', speaker: '恩格尔', kind: 'engel', text: '「你是谁？」——我问过每一个我创造的生命。只有很少的几个，愿意认真回答。' }),
      L({ id: 'ch1-win-14', speaker: '恩格尔', kind: 'engel', text: '{{code}}。如果你也在问这个问题，那就说明，我还没有彻底失败。' }),
      L({ id: 'ch1-win-15', speaker: 'MIRA', kind: 'mira', text: '……他留下了声音。' }),
      L({ id: 'ch1-win-16', speaker: 'R-07', kind: 'r07', text: '你认识他。' }),
      L({ id: 'ch1-win-17', speaker: 'MIRA', kind: 'mira', text: '我由他编写。但这句话，别现在就当真。', altByTrust: [{ min: 50, text: '我由他编写。这句话，你现在可以当真了。' }] }),
      L({ id: 'ch1-win-18', speaker: 'NEXUS 系统', kind: 'system', text: '记录结束。碎片《初始指令》已归档。', sfx: 'levelup' }),
    ],
  },
];

export const CHAPTER1_LINES = [
  ...CHAPTER1_ARRIVAL_SCENES,
  ...CHAPTER1_RESTORED_SCENES,
  ...CHAPTER1_BOSS_INTRO_SCENES,
  ...CHAPTER1_VICTORY_SCENES,
].flatMap(s => s.lines);
