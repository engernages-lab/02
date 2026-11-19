// 教学章节《训练终端 · 接驳完成》正式演出场景
// 序章结束后 R-07 进入 NEXUS 主干网络，第一次正式接触维修终端。
import type { StoryScene } from './types';
import { TUTORIAL_DONE } from '../story';

export const TUTORIAL_DONE_SCENES: StoryScene[] = [
  {
    id: 'tut-done',
    title: '训练终端 · 接驳完成',
    subtitle: 'NEXUS 主干网络 · 接驳层',
    bg: 'terminal',
    fx: 'particles',
    lines: TUTORIAL_DONE.map(l => ({
      id: l.id,
      speaker: l.speaker,
      kind: l.kind,
      text: l.text,
      choices: l.choices,
    })),
  },
];
