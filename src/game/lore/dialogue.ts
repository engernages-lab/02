// 对话台词注册表：把「台词数据」从组件里彻底分离
// 序章 / 第一章使用正式演出脚本（含场景与特效），其余章节沿用章节完成过场台词。
import {
  TUTORIAL_DONE,
  CHAPTER3_COMPLETE,
  CHAPTER4_COMPLETE,
  CHAPTER5_COMPLETE,
  CHAPTER6_COMPLETE,
  rebirthScript,
  type StoryLine,
} from '../story';
import { PROLOGUE_LINES } from './prologue';
import { CHAPTER1_LINES } from './chapter1';
import { CHAPTER2_LINES } from './chapter2';
import type { ChapterId } from './types';

export interface DialogueSequence {
  /** 与剧情事件 id 对应（STORY_EVENTS） */
  id: string;
  title: string;
  chapter?: ChapterId;
  nodes: StoryLine[];
}

export const DIALOGUE_SEQUENCES: DialogueSequence[] = [
  { id: 'prologue', title: '序章 · 沉睡的意识', nodes: PROLOGUE_LINES },
  { id: 'tutorial-done', title: '训练终端 · 任务完成', nodes: TUTORIAL_DONE },
  { id: 'chapter-1', title: '第一章 · 失落的数据港', chapter: 'ch1', nodes: CHAPTER1_LINES },
  { id: 'chapter-2', title: '第二章 · 破碎的记忆花园', chapter: 'ch2', nodes: CHAPTER2_LINES },
  { id: 'chapter-3', title: '第三章 · 完成', chapter: 'ch3', nodes: CHAPTER3_COMPLETE },
  { id: 'chapter-4', title: '第四章 · 完成', chapter: 'ch4', nodes: CHAPTER4_COMPLETE },
  { id: 'chapter-5', title: '第五章 · 完成', chapter: 'ch5', nodes: CHAPTER5_COMPLETE },
  { id: 'chapter-6', title: '终章 · NEXUS 复苏', chapter: 'ch6', nodes: CHAPTER6_COMPLETE },
];

export const dialogueById = (id: string): DialogueSequence | undefined =>
  DIALOGUE_SEQUENCES.find(d => d.id === id);

export const dialogueForChapter = (chapter: ChapterId): DialogueSequence | undefined =>
  DIALOGUE_SEQUENCES.find(d => d.chapter === chapter);

/** 重生剧情按重生次数动态生成，保持函数式（不预生成） */
export const rebirthDialogue = rebirthScript;

/** 某事件的台词节点 id（阅读进度统计用） */
export function nodeIdsOf(eventId: string): string[] {
  const seq = dialogueById(eventId);
  return seq ? seq.nodes.map(n => n.id) : [];
}
