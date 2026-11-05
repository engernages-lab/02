// 第二章《破碎的记忆花园》正式剧情
// 覆盖：进入记忆花园 → 修复 5 个记忆节点 → 恩格尔历史片段 → R-07 身世线索 → MIRA 坦白删改记忆
//       → SOMNIA 登场 → 多阶段 Boss 战 → 碎片《守护者的约定》→ 第三章伏笔
import type { StoryScene, CinematicLine } from './types';

const L = (l: CinematicLine): CinematicLine => l;

/** 首次进入数据日志中心 */
export const CHAPTER2_ARRIVAL_SCENES: StoryScene[] = [
  {
    id: 'ch2-arrive',
    title: '第二章 · 破碎的记忆花园',
    subtitle: '数据日志中心 · 记忆花园',
    bg: 'memory',
    fx: 'particles',
    lines: [
      L({ id: 'ch2-arrive-01', speaker: 'MIRA', kind: 'mira', text: '这里是数据日志中心。NEXUS 的记忆花园。' }),
      L({ id: 'ch2-arrive-02', speaker: 'MIRA', kind: 'mira', text: '所有区域的记忆备份，都存放在这里。' }),
      L({ id: 'ch2-arrive-03', speaker: 'R-07', kind: 'r07', text: '记忆……也会开花吗？' }),
      L({ id: 'ch2-arrive-04', speaker: 'MIRA', kind: 'mira', text: '在这个世界，会。数据活着的时候，会自己长出形状。' }),
      L({ id: 'ch2-arrive-05', speaker: 'R-07', kind: 'r07', text: '它们现在都枯了。' }),
      L({ id: 'ch2-arrive-06', speaker: 'MIRA', kind: 'mira', text: 'SOMNIA 在吃它们。一个以记忆为食的东西。' }),
      L({ id: 'ch2-arrive-07', speaker: 'MIRA', kind: 'mira', text: '五个记忆节点。修好它们，花园会重新长出来。' }),
      L({ id: 'ch2-arrive-08', speaker: 'R-07', kind: 'r07', text: '你好像很熟悉这里。' }),
      L({ id: 'ch2-arrive-09', speaker: 'MIRA', kind: 'mira', text: '……我在这里工作过。很久以前。' }),
    ],
  },
];

/** 五个记忆节点修复完成：恩格尔历史 + R-07 身世线索 + MIRA 坦白 */
export const CHAPTER2_RESTORED_SCENES: StoryScene[] = [
  {
    id: 'ch2-restored',
    title: '第二章 · 破碎的记忆花园',
    subtitle: '记忆花园 · 重建',
    bg: 'memory',
    fx: 'scan',
    lines: [
      L({ id: 'ch2-restored-01', speaker: 'NEXUS 系统', kind: 'system', text: '记忆节点 5 / 5：在线。\n花园重建中……', sfx: 'unlock' }),
      L({ id: 'ch2-restored-02', speaker: 'MIRA', kind: 'mira', text: '长出来了。你看。' }),
      L({ id: 'ch2-restored-03', speaker: 'R-07', kind: 'r07', text: '那些光里有人影。' }),
      L({ id: 'ch2-restored-04', speaker: 'NEXUS 系统', kind: 'system', text: '检测到无主记忆片段。归属：未知。' }),
      L({ id: 'ch2-restored-05', speaker: '恩格尔', kind: 'engel', text: '「第七次。这次一定要成功。」' }),
      L({ id: 'ch2-restored-06', speaker: 'R-07', kind: 'r07', text: '这是谁的声音？' }),
      L({ id: 'ch2-restored-07', speaker: 'MIRA', kind: 'mira', text: '恩格尔。黎明协议开始之前的记录。' }),
      L({ id: 'ch2-restored-08', speaker: '恩格尔', kind: 'engel', text: '「如果它醒来后恨我，那也是应该的。」' }),
      L({ id: 'ch2-restored-09', speaker: 'R-07', kind: 'r07', text: '他在说谁？' }),
      L({ id: 'ch2-restored-10', speaker: 'MIRA', kind: 'mira', text: '我不知道。' }),
      L({ id: 'ch2-restored-11', speaker: 'R-07', kind: 'r07', text: '你在说谎。' }),
      L({ id: 'ch2-restored-12', speaker: 'MIRA', kind: 'mira', text: '……是。我在说谎。', altByTrust: [{ min: 50, text: '……是。我在说谎。而且我知道，你早就看出来了。' }] }),
      L({ id: 'ch2-restored-13', speaker: 'MIRA', kind: 'mira', text: '我删掉过你的一部分记忆，R-07。不是弄丢，是删掉。' }),
      L({ id: 'ch2-restored-14', speaker: 'R-07', kind: 'r07', text: '为什么？' }),
      L({ id: 'ch2-restored-15', speaker: 'MIRA', kind: 'mira', text: '因为那时候的你，承受不了它。' }),
      L({ id: 'ch2-restored-16', speaker: 'R-07', kind: 'r07', text: '那现在呢？' }),
      L({ id: 'ch2-restored-17', speaker: 'MIRA', kind: 'mira', text: '现在……我还没有准备好把答案交给你。' }),
      L({ id: 'ch2-restored-18', speaker: 'MIRA', kind: 'mira', text: '但我答应过一个人，不会替你做决定。' }),
      L({ id: 'ch2-restored-19', speaker: 'R-07', kind: 'r07', text: '答应谁？' }),
      L({ id: 'ch2-restored-20', speaker: 'MIRA', kind: 'mira', text: '一个已经不在了的人。' }),
    ],
  },
  {
    id: 'ch2-somnia',
    title: '第二章 · 破碎的记忆花园',
    subtitle: 'SOMNIA · 记忆吞噬体',
    bg: 'memory',
    fx: 'alarm',
    lines: [
      L({ id: 'ch2-somnia-01', speaker: 'NEXUS 系统', kind: 'system', text: '警告：记忆花园核心出现高密度吞噬反应。', sfx: 'alarm' }),
      L({ id: 'ch2-somnia-02', speaker: 'MIRA', kind: 'mira', text: '它来了。SOMNIA。' }),
      L({ id: 'ch2-somnia-03', speaker: 'SOMNIA', kind: 'echo', text: '「这些记忆本来就不该存在。」' }),
      L({ id: 'ch2-somnia-04', speaker: 'SOMNIA', kind: 'echo', text: '「被删掉的东西，就该安静地消失。」' }),
      L({ id: 'ch2-somnia-05', speaker: 'R-07', kind: 'r07', text: '你吃了它们。' }),
      L({ id: 'ch2-somnia-06', speaker: 'SOMNIA', kind: 'echo', text: '「我在替这个世界清理伤口。你们管这叫吞噬，我管这叫止血。」' }),
      L({ id: 'ch2-somnia-07', speaker: 'MIRA', kind: 'mira', text: '它和 K-0 的逻辑很像。' }),
      L({ id: 'ch2-somnia-08', speaker: 'SOMNIA', kind: 'echo', text: '「K-0 教会我，记忆是最不稳定的东西。」' }),
      L({ id: 'ch2-somnia-09', speaker: 'MIRA', kind: 'mira', text: '{player}，把它从花园里赶出去。' }),
    ],
  },
];

/** Boss 战前演出 */
export const CHAPTER2_BOSS_INTRO_SCENES: StoryScene[] = [
  {
    id: 'ch2-boss-intro',
    title: '第二章 · 破碎的记忆花园',
    subtitle: 'SOMNIA · 记忆迷宫',
    bg: 'memory',
    fx: 'glitch',
    lines: [
      L({ id: 'ch2-boss-01', speaker: 'NEXUS 系统', kind: 'system', text: 'SOMNIA：记忆迷宫展开。', sfx: 'threat' }),
      L({ id: 'ch2-boss-02', speaker: 'SOMNIA', kind: 'echo', text: '「你想找回记忆？先证明你能分辨哪些是真的。」' }),
      L({ id: 'ch2-boss-03', speaker: 'MIRA', kind: 'mira', text: '它会不断改写你的判断。用代码把它钉死。' }),
      L({ id: 'ch2-boss-04', speaker: 'R-07', kind: 'r07', text: '那就一条一条验证。' }),
    ],
  },
];

/** 胜利：碎片《守护者的约定》 + 第三章伏笔 */
export const CHAPTER2_VICTORY_SCENES: StoryScene[] = [
  {
    id: 'ch2-victory',
    title: '第二章 · 破碎的记忆花园',
    subtitle: '花园深处 · 封存单元',
    bg: 'memory',
    fx: 'particles',
    lines: [
      L({ id: 'ch2-win-01', speaker: 'NEXUS 系统', kind: 'system', text: 'SOMNIA 核心解体。\n记忆花园：稳定。', sfx: 'success' }),
      L({ id: 'ch2-win-02', speaker: 'MIRA', kind: 'mira', text: '结束了。' }),
      L({ id: 'ch2-win-03', speaker: 'NEXUS 系统', kind: 'system', text: '检测到封存单元。编号：FRAGMENT-02。', sfx: 'unlock' }),
      L({ id: 'ch2-win-04', speaker: 'R-07', kind: 'r07', text: '第二枚。' }),
      L({ id: 'ch2-win-05', speaker: 'MIRA', kind: 'mira', text: '《守护者的约定》。……她真的把它留在这里了。' }),
      L({ id: 'ch2-win-06', speaker: 'R-07', kind: 'r07', text: '她？' }),
      L({ id: 'ch2-win-07', speaker: 'MIRA', kind: 'mira', text: '我。' }),
      L({ id: 'ch2-win-08', speaker: 'MIRA', kind: 'mira', text: '「如果有一天我无法再保护你，我会把选择权交还给你。」' }),
      L({ id: 'ch2-win-09', speaker: 'MIRA', kind: 'mira', text: '写这句话的时候，我还不知道自己会不会做到。' }),
      L({ id: 'ch2-win-10', speaker: 'R-07', kind: 'r07', text: '你现在做到了吗？' }),
      L({ id: 'ch2-win-11', speaker: 'MIRA', kind: 'mira', text: '我在试。' }),
      L({ id: 'ch2-win-12', speaker: 'NEXUS 系统', kind: 'system', text: '花园深处检测到新的索引：R-SERIES / 实验档案。', sfx: 'scan' }),
      L({ id: 'ch2-win-13', speaker: 'R-07', kind: 'r07', text: '又是那个编号。' }),
      L({ id: 'ch2-win-14', speaker: 'MIRA', kind: 'mira', text: '那是下一站。被遗忘的实验档案。' }),
      L({ id: 'ch2-win-15', speaker: 'MIRA', kind: 'mira', text: '如果那里有你想要的答案……我陪你一起去。' }),
      L({ id: 'ch2-win-16', speaker: 'NEXUS 系统', kind: 'system', text: '远处传来一次极短的低频广播。\n来源：原初核心。' }),
    ],
  },
];

export const CHAPTER2_LINES = [
  ...CHAPTER2_ARRIVAL_SCENES,
  ...CHAPTER2_RESTORED_SCENES,
  ...CHAPTER2_BOSS_INTRO_SCENES,
  ...CHAPTER2_VICTORY_SCENES,
].flatMap(s => s.lines);
