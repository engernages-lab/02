// 六章剧情配置：正式蓝本 ↔ 现有教学结构映射
// 本阶段只建立结构，不写完整剧情正文（正文在后续阶段按章补齐）。
import type { ChapterDef } from './types';

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch1', order: 1,
    title: '失落的数据港', area: '语法维修站',
    serverId: 'syntax',
    bossId: 'gate-01', currentBossId: 'gate-01',
    fragmentId: 'frag-01',
    coreEvent: '恢复数字世界，首次遭遇 K-0',
    knowledgeFocus: ['print', 'if', 'indent', 'string', 'variable', 'compare', 'for', 'list'],
    storyEventId: 'chapter-1', doneFlag: 'chapter1Done',
  },
  {
    id: 'ch2', order: 2,
    title: '破碎的记忆花园', area: '数据日志中心',
    serverId: 'logs',
    bossId: 'somnia', currentBossId: 'somnia',
    fragmentId: 'frag-02',
    coreEvent: '发现 MIRA 的真实身份',
    knowledgeFocus: ['if', 'else', 'elif', 'compare', 'logic', 'for', 'return'],
    storyEventId: 'chapter-2', doneFlag: 'chapter2Done',
  },
  {
    id: 'ch3', order: 3,
    title: '被遗忘的实验档案', area: '存储数据仓',
    serverId: 'storage',
    bossId: 'index-0', currentBossId: 'index-0',
    fragmentId: 'frag-03',
    coreEvent: '发现 R 系列实验与 R-07 的身世',
    knowledgeFocus: ['list', 'for', 'while', 'len', 'indent', 'compare'],
    storyEventId: 'chapter-3', doneFlag: 'chapter3Done',
  },
  {
    id: 'ch4', order: 4,
    title: '失控的核心工坊', area: '自动化工厂',
    serverId: 'factory',
    bossId: 'judgment-4', currentBossId: 'judgment-4',
    fragmentId: 'frag-04',
    coreEvent: '发现恩格尔与 K-0 的矛盾，以及 MIRA 的牺牲',
    knowledgeFocus: ['def', 'parameter', 'return', 'list', 'compare'],
    storyEventId: 'chapter-4', doneFlag: 'chapter4Done',
  },
  {
    id: 'ch5', order: 5,
    title: '黎明崩塌的真相', area: '系统诊断中心',
    serverId: 'diag',
    bossId: 'entropy', currentBossId: 'entropy',
    fragmentId: 'frag-05',
    coreEvent: '揭露五年前事故与恩格尔的最后愿望',
    knowledgeFocus: ['dict', 'try', 'logic', 'compare', 'for'],
    storyEventId: 'chapter-5', doneFlag: 'chapter5Done',
  },
  {
    id: 'ch6', order: 6,
    title: '起源之外', area: '方舟核心机房',
    serverId: 'core',
    bossId: 'k0', currentBossId: 'k0',
    fragmentId: 'frag-06',
    coreEvent: '击败 K-0，决定数字世界的未来',
    knowledgeFocus: ['if', 'return', 'compare', 'logic', 'list', 'dict', 'try', 'while'],
    storyEventId: 'chapter-6', doneFlag: 'chapter6Done',
  },
];

export const chapterById = (id: string): ChapterDef | undefined => CHAPTERS.find(c => c.id === id);
export const chapterByServer = (serverId: string): ChapterDef | undefined => CHAPTERS.find(c => c.serverId === serverId);
export const chapterOfBoss = (bossId: string): ChapterDef | undefined =>
  CHAPTERS.find(c => c.bossId === bossId || c.currentBossId === bossId);
