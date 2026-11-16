// Boss 演出脚本索引：按 bossId 取战前 / 战后演出（各章数据分文件维护）
import type { StoryScene } from './types';
import { CHAPTER1_BOSS_INTRO_SCENES, CHAPTER1_VICTORY_SCENES } from './chapter1';
import { CHAPTER2_BOSS_INTRO_SCENES, CHAPTER2_VICTORY_SCENES } from './chapter2';
import { CHAPTER3_BOSS_INTRO_SCENES } from './chapter3';
import { CHAPTER4_BOSS_INTRO_SCENES } from './chapter4';
import { CHAPTER5_BOSS_INTRO_SCENES } from './chapter5';
import { CHAPTER6_BOSS_INTRO_SCENES } from './chapter6';

export function bossScenesFor(bossId: string): { intro?: StoryScene[]; outro?: StoryScene[] } {
  switch (bossId) {
    case 'gate-01':
      return { intro: CHAPTER1_BOSS_INTRO_SCENES, outro: CHAPTER1_VICTORY_SCENES };
    case 'somnia':
      return { intro: CHAPTER2_BOSS_INTRO_SCENES, outro: CHAPTER2_VICTORY_SCENES };
    // 第三~六章：战前演出放在战斗界面；战后由地图播放章节胜利演出（避免重复播放）
    case 'index-0':
      return { intro: CHAPTER3_BOSS_INTRO_SCENES };
    case 'judgment-4':
      return { intro: CHAPTER4_BOSS_INTRO_SCENES };
    case 'entropy':
      return { intro: CHAPTER5_BOSS_INTRO_SCENES };
    case 'k0':
      return { intro: CHAPTER6_BOSS_INTRO_SCENES };
    default:
      return {};
  }
}
