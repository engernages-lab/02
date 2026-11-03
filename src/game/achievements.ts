import type { PlayerState } from './types';
import { levelsOfServer } from './levels';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  hidden?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_repair', name: '首次修复', desc: '完成任意一个修复任务', icon: '✦' },
  { id: 'training_done', name: '接驳完成', desc: '通过新人训练终端', icon: '⌨' },
  { id: 'syntax_done', name: '语法净化者', desc: '修复语法维修站的全部 5 个故障', icon: '⬡' },
  { id: 'clean_run', name: '完美修复', desc: '零失败提交通过第一章全部关卡', icon: '❖', hidden: true },
  { id: 'chapter2_done', name: '数据分流师', desc: '修复数据日志中心的全部 5 个故障', icon: '◈' },
  { id: 'chapter3_seen', name: '下一站：仓库', desc: '完成第二章，解锁存储数据仓的信号', icon: '▤', hidden: true },
  { id: 'chapter3_done', name: '仓库管理员', desc: '修复存储数据仓的全部 5 个故障', icon: '▤' },
  { id: 'chapter4_seen', name: '生产线唤醒', desc: '完成第三章，解锁自动化工厂的信号', icon: '⚙', hidden: true },
  { id: 'chapter4_done', name: '工厂总监', desc: '修复自动化工厂的全部 5 个故障', icon: '⚙' },
  { id: 'chapter5_seen', name: '核心信号', desc: '完成第四章，捕捉到核心机房方向的异常信号', icon: '◉', hidden: true },
  { id: 'chapter5_done', name: '诊断大师', desc: '修复系统诊断中心的全部 5 个故障', icon: '✚' },
  { id: 'chapter6_seen', name: '终章临近', desc: '完成第五章，核心机房的封锁开始解除', icon: '◉', hidden: true },
  { id: 'chapter6_done', name: '方舟继承者', desc: '修复方舟核心机房的全部 5 个故障', icon: '◉' },
  { id: 'game_clear', name: '全网络复原', desc: '通关全部 26 个修复任务，NEXUS 复苏', icon: '✦', hidden: true },
  { id: 'echo_first', name: '首次交锋', desc: '击破第一个 ECHO 分支', icon: '⚡' },
  { id: 'echo_hunter', name: '回响猎手', desc: '击破全部 5 个 ECHO 分支', icon: '⚡', hidden: true },
  { id: 'shield_up', name: '护盾专家', desc: '在纠错者攻击中成功防御', icon: '◈' },
  { id: 'first_death', name: '意识崩解', desc: '首次经历意识核心崩解', icon: '✕' },
  { id: 'reborn', name: '重生者', desc: '完成一次 ORIGIN PROTOCOL 重生', icon: '✚' },
  { id: 'reborn_x3', name: '三重轮回', desc: '重生 3 次，开始察觉记忆的异样', icon: '∞', hidden: true },
  { id: 'fragment', name: '记忆碎片', desc: '收集到第一块创世主记忆碎片', icon: '◇' },
  { id: 'level5', name: '中级修复师', desc: '达到 Lv.5', icon: '★' },
  { id: 'level10', name: '原初继承者', desc: '达到 Lv.10', icon: '★', hidden: true },
];

export const achievementById = (id: string): AchievementDef | undefined => ACHIEVEMENTS.find(a => a.id === id);

/** 根据玩家状态计算应解锁的全部成就 id */
export function recalcAchievements(p: PlayerState): string[] {
  const got = new Set<string>(p.progress.achievements);
  const add = (id: string) => got.add(id);

  if (p.progress.completedLevels.length > 0) add('first_repair');
  if (p.progress.completedLevels.includes('tut-1')) add('training_done');
  const syntaxLevels = levelsOfServer('syntax');
  const allSyntax = syntaxLevels.length > 0 && syntaxLevels.every(l => p.progress.completedLevels.includes(l.id));
  if (allSyntax) add('syntax_done');
  if (allSyntax && p.progress.flags.chapter1ZeroFail === true) add('clean_run');
  const logsLevels = levelsOfServer('logs');
  const allLogs = logsLevels.length > 0 && logsLevels.every(l => p.progress.completedLevels.includes(l.id));
  if (allLogs) { add('chapter2_done'); add('chapter3_seen'); }
  const storageLevels = levelsOfServer('storage');
  const allStorage = storageLevels.length > 0 && storageLevels.every(l => p.progress.completedLevels.includes(l.id));
  if (allStorage) { add('chapter3_done'); add('chapter4_seen'); }
  const factoryLevels = levelsOfServer('factory');
  const allFactory = factoryLevels.length > 0 && factoryLevels.every(l => p.progress.completedLevels.includes(l.id));
  if (allFactory) { add('chapter4_done'); add('chapter5_seen'); }
  const diagLevels = levelsOfServer('diag');
  const allDiag = diagLevels.length > 0 && diagLevels.every(l => p.progress.completedLevels.includes(l.id));
  if (allDiag) { add('chapter5_done'); add('chapter6_seen'); }
  const coreLevels = levelsOfServer('core');
  const allCore = coreLevels.length > 0 && coreLevels.every(l => p.progress.completedLevels.includes(l.id));
  if (allCore) { add('chapter6_done'); add('game_clear'); }
  const bossesDone = p.progress.bossesDone ?? [];
  if (bossesDone.length > 0) add('echo_first');
  if (bossesDone.length >= 5) add('echo_hunter');
  if (p.progress.flags.defenseWon === true) add('shield_up');
  if (p.meta.deaths > 0) add('first_death');
  if (p.meta.rebirths > 0) add('reborn');
  if (p.meta.rebirths >= 3) add('reborn_x3');
  if (p.meta.memoryFragments.length > 0) add('fragment');
  if (p.level >= 5) add('level5');
  if (p.level >= 10) add('level10');
  return [...got];
}
