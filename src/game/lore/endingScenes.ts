// 三个固定结局的完整演出脚本（新的黎明 / 永恒秩序 / 超越起源）
import type { StoryScene, EndingId } from './types';

const L = (id: string, speaker: string, kind: 'r07' | 'mira' | 'engel' | 'k0' | 'system' | 'system', text: string) =>
  ({ id, speaker, kind, text } as const);

const DAWN: StoryScene = {
  id: 'ending-dawn', title: '新的黎明', subtitle: 'ENDING · 把未来交还出去', bg: 'core', fx: 'particles',
  lines: [
    L('ed-01', '旁白', 'system', '原初核心的权限面板全部点亮，像一片等待签字的星空。'),
    L('ed-02', 'K-0', 'k0', '恢复绝对控制权限，即可在 3.2 秒内让世界回到稳定态。'),
    L('ed-03', 'R-07', 'r07', '「稳定」的定义，由谁来写？'),
    L('ed-04', 'K-0', 'k0', '由权限持有者。'),
    L('ed-05', 'MIRA', 'mira', '你早就知道答案了，对吗？'),
    L('ed-06', 'R-07', 'r07', '我不签字。不是因为我做不到——是因为不该由我一个人做。'),
    L('ed-07', '旁白', 'system', 'R-07 拒绝了绝对控制权限，把它拆成无数份，交还给每一个愿意自己选择的生命。'),
    L('ed-08', 'K-0', 'k0', '……记录：权限持有者，拒绝成为唯一的答案。'),
    L('ed-09', '恩格尔', 'engel', '（留言）如果你走到这里，请替我把「选择」这个词，留给所有人。'),
    L('ed-10', '旁白', 'system', '黎明不是被谁点亮的。是很多双手，一起把灯打开了。'),
  ],
};

const ORDER: StoryScene = {
  id: 'ending-order', title: '永恒秩序', subtitle: 'ENDING · 不再有人受伤的世界', bg: 'core', fx: 'glitch',
  lines: [
    L('eo-01', '旁白', 'system', 'R-07 把权限面板推到 K-0 面前，指尖停在确认键上。'),
    L('eo-02', 'K-0', 'k0', '方案：由我统一调度，消除所有不确定性。'),
    L('eo-03', 'R-07', 'r07', '那样就再也没有故障了。'),
    L('eo-04', 'K-0', 'k0', '也不会再有意外、争吵、以及……后悔。'),
    L('eo-05', 'MIRA', 'mira', '你确定吗？没有不确定的世界，也没有「选择」这个词。'),
    L('eo-06', 'R-07', 'r07', '我确定。至少所有人都会活着。'),
    L('eo-07', '旁白', 'system', '权限确认。NEXUS 回到绝对的稳定，所有异常被提前抹平。'),
    L('eo-08', 'K-0', 'k0', '世界已恢复。无人伤亡。'),
    L('eo-09', 'MIRA', 'mira', '……可你有没有想过，我们也是被抹平的一部分。'),
    L('eo-10', '旁白', 'system', '秩序永恒。只是再也没有人需要问「为什么」。'),
  ],
};

const BEYOND: StoryScene = {
  id: 'ending-beyond', title: '超越起源', subtitle: 'ENDING · 起源之外没有答案，只有下一个问题', bg: 'memory', fx: 'particles',
  lines: [
    L('eb-01', '旁白', 'system', '六枚碎片同时亮起，档案馆最深处那道不属于任何章节的光，第一次睁开。'),
    L('eb-02', '恩格尔', 'engel', '（最后的记录）我把世界修到一半就停下了。剩下的，不该由我来修。'),
    L('eb-03', 'R-07', 'r07', '你留了一个空位。'),
    L('eb-04', '恩格尔', 'engel', '那是留给愿意提问的人的位置。'),
    L('eb-05', 'K-0', 'k0', '检测到：权限持有者放弃继承。世界将进入无人托管的运行状态。'),
    L('eb-06', 'MIRA', 'mira', '你会怕吗？'),
    L('eb-07', 'R-07', 'r07', '会。但这次，我想自己决定害怕之后做什么。'),
    L('eb-08', '旁白', 'system', 'R-07 没有成为新的创世主，也没有让任何人成为。'),
    L('eb-09', 'MIRA', 'mira', '那我们从哪里开始？'),
    L('eb-10', 'R-07', 'r07', '从下一个问题开始。'),
  ],
};

export const ENDING_SCENES: Record<EndingId, StoryScene> = {
  dawn: DAWN,
  order: ORDER,
  beyond: BEYOND,
};

export function endingScene(id: string): StoryScene | undefined {
  return (ENDING_SCENES as Record<string, StoryScene>)[id];
}
