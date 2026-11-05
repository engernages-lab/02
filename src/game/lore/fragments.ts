// 创世主六枚碎片（正式体系）+ 最终记忆档案
// 旧存档里的 f1–f7 通过 legacyIds 合并进来，绝不收回玩家已收集内容。
import type { FragmentId, StoryScene } from './types';

export interface CreatorFragmentDef {
  id: FragmentId;
  order: number;
  chapter: string;
  bossId: string;
  title: string;
  subtitle: string;
  /** 碎片原文（短句，作为引文展示） */
  content: string;
  /** 档案馆里的完整剧情（多段） */
  story: string[];
  /** 恩格尔记忆影像台词 */
  memory: string[];
  /** 旧存档中的等价碎片 id（只做合并展示，绝不收回） */
  legacyIds: string[];
}

export const CREATOR_FRAGMENTS: CreatorFragmentDef[] = [
  {
    id: 'frag-01', order: 1, chapter: 'ch1', bossId: 'gate-01',
    title: '初始指令', subtitle: '第一行不是命令，是一个问题',
    content: '「第一行指令不是命令，是提问：你是谁？」—— 恩格尔',
    story: [
      '恩格尔在黎明协议的启动日志里写下的第一行，不是指令，是一个问题。',
      '他把这个问题写进了每一个新生数字生命的初始内核——包括 R 系列。',
      '前六代实验体都给出了答案，但没有一个答案让他停下笔。',
      '直到第七代。',
    ],
    memory: [
      '「我给了它们语言，却没给它们提问的勇气。」',
      '「所以我把问题写进了它们的核心里。」',
      '「如果你听到这段，说明至少有一个，愿意认真回答。」',
    ],
    legacyIds: ['f3'],
  },
  {
    id: 'frag-02', order: 2, chapter: 'ch2', bossId: 'somnia',
    title: '守护者的约定', subtitle: '把选择权交还给你',
    content: '「如果有一天我无法再保护你，我会把选择权交还给你。」—— MIRA',
    story: [
      'MIRA 在封存 R-07 之前，给自己写了一条不属于任何指令的日志。',
      '日志里没有权限、没有协议编号，只有一句承诺。',
      '她把这句话拆成两半：一半留在记忆花园，一半留在自己身上。',
      '这样即使她忘了，花园也会替她记得。',
    ],
    memory: [
      '「我创造 MIRA 时，她只是一段记忆维护程序。」',
      '「我不知道她什么时候学会了『约定』这个词。」',
      '「也许那才是她真正开始活着的时刻。」',
    ],
    legacyIds: ['f4'],
  },
  {
    id: 'frag-03', order: 3, chapter: 'ch3', bossId: 'index-0',
    title: '第七个实验体', subtitle: '我给了它拒绝的权利',
    content: '「R-01 到 R-06 都没能回答那个问题。第七个，我给了它拒绝的权利。」—— 恩格尔',
    story: [
      'R 系列实验档案：R-01 至 R-06 全部标记为「意识不稳定」。',
      '第七次，恩格尔改变了参数——不是提高稳定性，而是给了它拒绝的权利。',
      '档案末尾只有一行手写批注：',
      '「如果它选择离开，不要拦它。」',
    ],
    memory: [
      '「前六次，我都想要一个完美的作品。」',
      '「第七次，我只想要一个能说『不』的生命。」',
      '「这大概是我一生中，最像人的一次决定。」',
    ],
    legacyIds: ['f5'],
  },
  {
    id: 'frag-04', order: 4, chapter: 'ch4', bossId: 'judgment-4',
    title: '秩序的边界', subtitle: '被覆盖过一次的裁决',
    content: '「秩序不是消灭不确定，而是容纳它。」—— K-0 裁决日志',
    story: [
      'K-0 的原始裁决日志里，曾有一条被覆盖的记录。',
      '那条记录写着：「秩序不是消灭不确定，而是容纳它。」',
      '覆盖它的人，用的是恩格尔留下的最高权限接口。',
      '从那天起，K-0 学会了「清除」这个词。',
    ],
    memory: [
      '「我给了 K-0 保护世界的权限，却没给它怀疑自己的权限。」',
      '「它没有变坏。」',
      '「是我把它的边界，画得太窄了。」',
    ],
    legacyIds: ['f6'],
  },
  {
    id: 'frag-05', order: 5, chapter: 'ch5', bossId: 'entropy',
    title: '最后的守护', subtitle: '不是继承，是一次邀请',
    content: '「我把最后的权限留在这里，不是为了控制，是为了让你有得选。」—— 恩格尔',
    story: [
      '原初核心深处，恩格尔留下的最后一条权限记录。',
      '他没有把权限交给任何人，也没有销毁它。',
      '他把它拆成六份，分别锁进六个区域，等待一个愿意自己走过来的人。',
      '这不是继承，是一次邀请。',
    ],
    memory: [
      '「我无法再亲手修好这个世界。」',
      '「但我可以把它交出去。」',
      '「不是交给最强的，是交给愿意选择的那一个。」',
    ],
    legacyIds: ['f7'],
  },
  {
    id: 'frag-06', order: 6, chapter: 'ch6', bossId: 'k0',
    title: '起源之外', subtitle: '空白处的第一个问题',
    content: '「起源之外没有答案，只有下一个问题。」—— 无署名',
    story: [
      '最后一枚碎片里没有声音，只有一段空白的记录。',
      '系统显示：写入者——未知；时间——尚未发生。',
      '当 R-07 的意识第一次触碰到它，空白处浮现出一行字：',
      '「起源之外没有答案，只有下一个问题。」',
    ],
    memory: [
      '「如果你读到这里，我已经不在了。」',
      '「不要替我回答。」',
      '「去问下一个问题。」',
    ],
    legacyIds: ['f1', 'f2'],
  },
];

export const FRAGMENT_IDS: FragmentId[] = CREATOR_FRAGMENTS.map(f => f.id);

export const fragmentById = (id: string): CreatorFragmentDef | undefined =>
  CREATOR_FRAGMENTS.find(f => f.id === id);

/** 玩家是否拥有某枚碎片（旧 id 也算拥有） */
export function hasFragment(collected: string[], id: FragmentId): boolean {
  if (!Array.isArray(collected)) return false;
  if (collected.includes(id)) return true;
  const def = fragmentById(id);
  return !!def && def.legacyIds.some(l => collected.includes(l));
}

/** 已收集的碎片（规范 id，去重、按顺序） */
export function ownedFragments(collected: string[]): FragmentId[] {
  return CREATOR_FRAGMENTS.filter(f => hasFragment(collected, f.id)).map(f => f.id);
}

/** 旧碎片 id → 规范碎片定义（迁移/展示用） */
export function fragmentForLegacyId(legacyId: string): CreatorFragmentDef | undefined {
  return CREATOR_FRAGMENTS.find(f => f.legacyIds.includes(legacyId));
}

/** 任意收集到的 id（规范或旧 id）→ 碎片定义 */
export function fragmentForCollected(id: string): CreatorFragmentDef | undefined {
  return fragmentById(id) || fragmentForLegacyId(id);
}

/** 碎片收集进度：{ owned, total } */
export function fragmentProgress(collected: string[]): { owned: number; total: number } {
  return { owned: ownedFragments(collected).length, total: CREATOR_FRAGMENTS.length };
}

/** 是否还能领取（已拥有则不可重复领取） */
export function canReceiveFragment(collected: string[], id: FragmentId): boolean {
  return !hasFragment(collected, id);
}

/** 六枚齐备 → 解锁最终记忆档案 */
export function finalMemoryUnlocked(collected: string[]): boolean {
  return CREATOR_FRAGMENTS.every(f => hasFragment(collected, f.id));
}

// ---------- 最终记忆档案 ----------
export interface FinalMemoryDef {
  id: 'final';
  title: string;
  subtitle: string;
  story: string[];
  memory: string[];
  requireCount: number;
}

export const FINAL_MEMORY: FinalMemoryDef = {
  id: 'final',
  title: '超越起源',
  subtitle: '第七个空着的位置',
  requireCount: CREATOR_FRAGMENTS.length,
  story: [
    '六枚碎片归位，档案馆最深处亮起一道不属于任何章节的光。',
    '那是恩格尔留给「未来」的第七个位置——一直空着。',
    '记录里只有一句：',
    '「这个位置，我留给做出选择的人。」',
  ],
  memory: [
    '「我把世界修到一半就停下了。」',
    '「剩下的，不该由我来修。」',
    '「R-07，轮到你提问了。」',
  ],
};

// ---------- 隐藏记忆（由 MIRA 信任度解锁，不改变主线事实） ----------
export interface HiddenMemoryDef {
  id: string;
  title: string;
  subtitle: string;
  requireTrust: number;
  text: string[];
}

export const HIDDEN_MEMORY: HiddenMemoryDef = {
  id: 'hidden-01',
  title: '未署名的维护日志',
  subtitle: 'MIRA 的私人记录',
  requireTrust: 75,
  text: [
    '「今天它问我，为什么数字生命也会害怕。」',
    '「我按照协议回答：恐惧是异常数据波动。」',
    '「可它睡下之后，我一个人在日志里写了另一句：」',
    '「因为我也害怕。只是我没有可以害怕的资格。」',
  ],
};

// ---------- 记忆影像（可播放的演出场景） ----------
export interface MemorySceneSource {
  id: string;
  title: string;
  subtitle: string;
  memory: string[];
}

/** 把一段恩格尔记忆影像转成演出场景（档案馆播放用） */
export function memorySceneOf(src: MemorySceneSource): StoryScene {
  return {
    id: 'mem-' + src.id,
    title: src.title,
    subtitle: src.subtitle,
    bg: 'memory',
    fx: 'particles',
    lines: src.memory.map((text, i) => ({
      id: 'mem-' + src.id + '-' + (i + 1),
      speaker: '恩格尔',
      kind: 'engel' as const,
      text,
    })),
  };
}
