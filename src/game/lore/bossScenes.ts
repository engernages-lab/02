// Boss 演出脚本索引：按 bossId 取战前 / 战后演出（各章数据分文件维护）
import type { StoryScene } from './types';
import { CHAPTER1_BOSS_INTRO_SCENES, CHAPTER1_VICTORY_SCENES } from './chapter1';
import { CHAPTER2_BOSS_INTRO_SCENES, CHAPTER2_VICTORY_SCENES } from './chapter2';

export function bossScenesFor(bossId: string): { intro?: StoryScene[]; outro?: StoryScene[] } {
  switch (bossId) {
    case 'gate-01':
      return { intro: CHAPTER1_BOSS_INTRO_SCENES, outro: CHAPTER1_VICTORY_SCENES };
    case 'somnia':
      return { intro: CHAPTER2_BOSS_INTRO_SCENES, outro: CHAPTER2_VICTORY_SCENES };
    default:
      return {};
  }
}
