// 主线事件回放索引：把事件 id 映射成可播放的演出
import type { StoryScene } from './types';
import type { StoryLine } from '../story';
import { PROLOGUE_SCENES } from './prologue';
import { CHAPTER1_ARRIVAL_SCENES, CHAPTER1_RESTORED_SCENES, CHAPTER1_BOSS_INTRO_SCENES, CHAPTER1_VICTORY_SCENES } from './chapter1';
import { CHAPTER2_ARRIVAL_SCENES, CHAPTER2_RESTORED_SCENES, CHAPTER2_BOSS_INTRO_SCENES, CHAPTER2_VICTORY_SCENES } from './chapter2';
import { TUTORIAL_DONE, CHAPTER3_COMPLETE, CHAPTER4_COMPLETE, CHAPTER5_COMPLETE, CHAPTER6_COMPLETE } from '../story';
import { bossScenesFor } from './bossScenes';

export type ReplaySource =
  | { kind: 'scenes'; scenes: StoryScene[] }
  | { kind: 'lines'; nodes: StoryLine[] };

/** 已实装章节的事件回放；未实装返回 null */
export function replayFor(eventId: string): ReplaySource | null {
  switch (eventId) {
    case 'prologue':
      return { kind: 'scenes', scenes: PROLOGUE_SCENES };
    case 'chapter-1':
      return {
        kind: 'scenes',
        scenes: [...CHAPTER1_ARRIVAL_SCENES, ...CHAPTER1_RESTORED_SCENES, ...CHAPTER1_BOSS_INTRO_SCENES, ...CHAPTER1_VICTORY_SCENES],
      };
    case 'chapter-2':
      return {
        kind: 'scenes',
        scenes: [...CHAPTER2_ARRIVAL_SCENES, ...CHAPTER2_RESTORED_SCENES, ...CHAPTER2_BOSS_INTRO_SCENES, ...CHAPTER2_VICTORY_SCENES],
      };
    case 'tutorial-done':
      return { kind: 'lines', nodes: TUTORIAL_DONE };
    case 'chapter-3':
      return { kind: 'lines', nodes: CHAPTER3_COMPLETE };
    case 'chapter-4':
      return { kind: 'lines', nodes: CHAPTER4_COMPLETE };
    case 'chapter-5':
      return { kind: 'lines', nodes: CHAPTER5_COMPLETE };
    case 'chapter-6':
      return { kind: 'lines', nodes: CHAPTER6_COMPLETE };
    case 'boss-gate-01':
    case 'boss-somnia': {
      const s = bossScenesFor(eventId.replace('boss-', ''));
      if (!s.intro || !s.outro) return null;
      return { kind: 'scenes', scenes: [...s.intro, ...s.outro] };
    }
    default:
      return null;
  }
}
