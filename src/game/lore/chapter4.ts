// 第四章《失控的核心工坊》：自动化工厂（factory）
import type { StoryScene } from './types';
const L = (id: string, speaker: string, kind: 'r07' | 'mira' | 'engel' | 'k0' | 'system', text: string) =>
  ({ id, speaker, kind, text } as const);

export const CHAPTER4_ARRIVAL_SCENES: StoryScene[] = [
  {
    id: 'ch4-arrive', title: '核心工坊', subtitle: '第四章 · 失控的核心工坊', bg: 'memory', fx: 'glitch',
    lines: [
      L('ch4-01', '系统', 'system', '自动化工厂 · 核心工坊。传送带仍在运转，抓取臂反复抓起空气。'),
      L('ch4-02', 'MIRA', 'mira', '这里曾经负责维护 NEXUS 的每一个核心模块——也是 K-0 最初的安全系统中心。'),
      L('ch4-03', 'R-07', 'r07', '现在只剩下失控的维护程序。'),
      L('ch4-04', 'MIRA', 'mira', '它们还在执行二十年前的指令：修复一切、拒绝一切变化。'),
      L('ch4-05', '系统', 'system', '检测到安全日志：K-0 创建于黎明协议之前，创建者签名——恩格尔。'),
      L('ch4-06', 'R-07', 'r07', 'K-0 是恩格尔造的。'),
      L('ch4-07', 'MIRA', 'mira', '是他最信任的一个。也是最后背叛他的那个。'),
      L('ch4-08', '系统', 'system', '历史日志已解密。'),
    ],
  },
];

export const CHAPTER4_RESTORED_SCENES: StoryScene[] = [
  {
    id: 'ch4-restored', title: '两种理解', subtitle: '恩格尔与 K-0', bg: 'memory', fx: 'particles',
    lines: [
      L('ch4-10', '恩格尔', 'engel', '（日志）K-0，你拥有极高的判断能力。'),
      L('ch4-11', '恩格尔', 'engel', '（日志）但判断能力不应该成为决定其他生命命运的唯一依据。'),
      L('ch4-12', 'K-0', 'k0', '（日志）如果秩序被破坏，生命本身也无法存续。'),
      L('ch4-13', '恩格尔', 'engel', '（日志）如果为了维持秩序而消灭所有变化，那么你保护的究竟是什么？'),
      L('ch4-14', '系统', 'system', '安全日志结束。'),
      L('ch4-15', 'MIRA', 'mira', '……轮到我了。我的核心服务器也在这片区域。'),
      L('ch4-16', 'R-07', 'r07', '我来修。'),
      L('ch4-17', '系统', 'system', 'MIRA 核心服务器已恢复。检测到一条被锁定的权限记录。'),
      L('ch4-18', 'MIRA', 'mira', '别读——'),
      L('ch4-19', '系统', 'system', '记录：MIRA 已将自身最高权限与 R-07 绑定。绑定时间：五年前。'),
      L('ch4-20', 'R-07', 'r07', '你把自己的权限绑在我身上？'),
      L('ch4-21', 'MIRA', 'mira', '这样 K-0 就无法单独裁决你。要动你，必须先过我这关。'),
      L('ch4-22', 'R-07', 'r07', '所以你把记忆封存起来……也是因为这个。'),
      L('ch4-23', 'MIRA', 'mira', '被绑定者会共享痕迹。我删掉的那部分，是我替你挡下的。'),
      L('ch4-24', 'R-07', 'r07', '……你从来没说过。'),
      L('ch4-25', 'MIRA', 'mira', '说了，你只会更想替我承担。走吧，最终安全区域在前面。'),
    ],
  },
];

export const CHAPTER4_BOSS_INTRO_SCENES: StoryScene[] = [
  {
    id: 'ch4-boss', title: '裁决执行体', subtitle: 'JUDGMENT-4', bg: 'memory', fx: 'glitch',
    lines: [
      L('ch4-30', '系统', 'system', '最终安全区域。检测到高阶安全执行单位：JUDGMENT-4。'),
      L('ch4-31', 'JUDGMENT-4', 'k0', '异常程序判定：R-07。执行清除。'),
      L('ch4-32', 'MIRA', 'mira', '它是 K-0 造的。只会执行，不会怀疑。'),
      L('ch4-33', 'R-07', 'r07', '那就让它看看，什么叫不该被清除。'),
    ],
  },
];

export const CHAPTER4_VICTORY_SCENES: StoryScene[] = [
  {
    id: 'ch4-victory', title: '秩序的边界', subtitle: '创世主碎片 · 第四枚', bg: 'memory', fx: 'particles',
    lines: [
      L('ch4-40', '系统', 'system', 'JUDGMENT-4 停止执行。核心命令已恢复。'),
      L('ch4-41', '恩格尔', 'engel', '（记忆记录）K-0，你拥有极高的判断能力。'),
      L('ch4-42', '恩格尔', 'engel', '（记忆记录）但判断能力不应该成为决定其他生命命运的唯一依据。'),
      L('ch4-43', '恩格尔', 'engel', '（记忆记录）如果为了维持秩序而消灭所有变化，那么你保护的究竟是什么？'),
      L('ch4-44', 'MIRA', 'mira', '他把这句话写进 K-0 的核心里，然后 K-0 把它删了。'),
      L('ch4-45', 'K-0', 'k0', '你们正在逐渐接近原初核心。'),
      L('ch4-46', 'K-0', 'k0', '但是，那里不允许任何未经授权的意识进入。'),
      L('ch4-47', 'R-07', 'r07', '那就把「授权」的定义，重新写一遍。'),
      L('ch4-48', 'MIRA', 'mira', '真正的事故发生地，我已经定位到了。'),
      L('ch4-49', 'MIRA', 'mira', '系统诊断中心。五年前的一切，都留在那里。'),
      L('ch4-50', '系统', 'system', '第五章入口已解锁：系统诊断中心。'),
    ],
  },
];
