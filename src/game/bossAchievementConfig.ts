// Boss 战斗隐藏成就配置（V1.3-B.5.4）
//
// 成就条件只引用 B.5.1 真实统计 / B.5.2 正式评分字段；
// 奖励为 XP / 贡献点（创世主碎片由首胜唯一发放，这里固定 0）。
// 所有阈值、等级奖励与目标数集中在此文件。

export const BOSS_ACHIEVEMENT_VERSION = 'v1.0.0';
export const BOSS_ACHIEVEMENT_REWARD_VERSION = 'v1.0.0';

export type BossAchievementCategory =
  | 'combat'
  | 'survival'
  | 'challenge'
  | 'tactics'
  | 'weakness'
  | 'crisis'
  | 'exploration'
  | 'secret';

export type BossAchievementLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Hidden';

export interface BossAchievementRewardAmounts {
  xp: number;
  contribution: number;
  fragments: number;
}

export type BossAchievementCondition =
  | { kind: 'damage-at-most'; value: number }
  | { kind: 'deaths-at-most'; value: number }
  | { kind: 'min-consciousness-at-most'; value: number }
  | { kind: 'defense-or-dodge-at-least'; value: number }
  | { kind: 'all-challenges-passed'; minJudged: number }
  | { kind: 'challenge-failures-at-most'; value: number; minJudged: number }
  | { kind: 'consecutive-success-at-least'; value: number }
  | { kind: 'dodge-success-at-least'; value: number }
  | { kind: 'defense-success-at-least'; value: number }
  | { kind: 'weakness-interrupt-at-least'; value: number }
  | { kind: 'weakness-discovered-at-least'; value: number }
  | { kind: 'unique-weakness-cracked-at-least'; value: number }
  | { kind: 'weakness-exploit-damage' }
  | { kind: 'dynamic-success-at-least'; value: number }
  | { kind: 'dynamic-def-success-at-least'; defId: string; value: number }
  | { kind: 'rating-grade'; grade: 'S' | 'A' | 'B' | 'C' | 'D' };

export interface BossAchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: BossAchievementCategory;
  level: BossAchievementLevel;
  hidden: boolean;
  icon: string;
  conditions: BossAchievementCondition[];
  reward: BossAchievementRewardAmounts;
}

const rewardForLevel = (level: BossAchievementLevel): BossAchievementRewardAmounts => {
  switch (level) {
    case 'Bronze': return { xp: 30, contribution: 15, fragments: 0 };
    case 'Silver': return { xp: 50, contribution: 25, fragments: 0 };
    case 'Gold': return { xp: 80, contribution: 40, fragments: 0 };
    case 'Platinum': return { xp: 120, contribution: 60, fragments: 0 };
    case 'Hidden': return { xp: 60, contribution: 30, fragments: 0 };
  }
};

const def = (
  id: string,
  name: string,
  description: string,
  category: BossAchievementCategory,
  level: BossAchievementLevel,
  hidden: boolean,
  icon: string,
  conditions: BossAchievementCondition[],
): BossAchievementDefinition => ({
  id, name, description, category, level, hidden, icon, conditions,
  reward: rewardForLevel(level),
});

export const BOSS_ACHIEVEMENT_DEFINITIONS: BossAchievementDefinition[] = [
  def('boss_perfect_defense', '完美防线', '在 Boss 战中未受到任何有效伤害并取得胜利。', 'survival', 'Gold', true, '◇', [
    { kind: 'damage-at-most', value: 0 },
    { kind: 'deaths-at-most', value: 0 },
  ]),
  def('boss_last_stand', '最后一线生机', '意识值曾跌至危险阈值，最终仍取得胜利。', 'survival', 'Silver', true, '◈', [
    { kind: 'min-consciousness-at-most', value: 20 },
  ]),
  def('boss_no_death', '零死亡者', '在 Boss 战中取得胜利且未发生死亡。', 'survival', 'Bronze', false, '✦', [
    { kind: 'deaths-at-most', value: 0 },
  ]),
  def('boss_clutch_survivor', '极限生还', '意识值极低时仍完成有效防御或闪避并取得胜利。', 'survival', 'Gold', true, '◉', [
    { kind: 'min-consciousness-at-most', value: 15 },
    { kind: 'defense-or-dodge-at-least', value: 1 },
  ]),
  def('boss_code_master', '代码大师', '所有有效判题全部通过，且没有无效提交。', 'challenge', 'Silver', false, '⌘', [
    { kind: 'all-challenges-passed', minJudged: 3 },
  ]),
  def('boss_perfect_streak', '连续修复者', '单场 Boss 战连续成功通过至少 5 次挑战。', 'challenge', 'Silver', false, '⟡', [
    { kind: 'consecutive-success-at-least', value: 5 },
  ]),
  def('boss_first_try', '一次通过', '至少 3 次有效判题全部通过，没有失败提交。', 'challenge', 'Bronze', false, '✓', [
    { kind: 'challenge-failures-at-most', value: 0, minJudged: 3 },
  ]),
  def('boss_dodge_master', '无伤战术家', '在 Boss 战中成功闪避至少 3 次。', 'tactics', 'Silver', false, '↯', [
    { kind: 'dodge-success-at-least', value: 3 },
  ]),
  def('boss_defense_master', '绝对防御', '在 Boss 战中成功防御至少 3 次。', 'tactics', 'Silver', false, '◘', [
    { kind: 'defense-success-at-least', value: 3 },
  ]),
  def('boss_counter_master', '以攻代守', '通过真实弱点机制打断 Boss 攻击并取得胜利。', 'tactics', 'Gold', true, '⌁', [
    { kind: 'weakness-interrupt-at-least', value: 1 },
  ]),
  def('boss_weakness_hunter', '弱点猎人', '发现至少 1 个 Boss 弱点并取得胜利。', 'weakness', 'Bronze', false, '◎', [
    { kind: 'weakness-discovered-at-least', value: 1 },
  ]),
  def('boss_weakness_master', '弱点专家', '在同一场 Boss 战中破解至少 2 个不同弱点。', 'weakness', 'Gold', false, '◈', [
    { kind: 'unique-weakness-cracked-at-least', value: 2 },
  ]),
  def('boss_weakness_exploit', '致命破绽', '在弱点暴露窗口内造成真实 Boss HP 伤害。', 'weakness', 'Silver', true, '✧', [
    { kind: 'weakness-exploit-damage' },
  ]),
  def('boss_crisis_responder', '危机解除', '成功处理至少 1 次真实动态危机事件。', 'crisis', 'Silver', false, '△', [
    { kind: 'dynamic-success-at-least', value: 1 },
  ]),
  def('boss_intrusion_destroyer', '入侵终结者', '成功完成未知入侵事件并取得胜利。', 'crisis', 'Gold', true, '⌬', [
    { kind: 'dynamic-def-success-at-least', defId: 'unknown-intrusion', value: 1 },
  ]),
  def('boss_rating_s', '卓越执行', '正式战斗评分达到 S 级。', 'combat', 'Platinum', false, '★', [
    { kind: 'rating-grade', grade: 'S' },
  ]),
];

export const BOSS_ACHIEVEMENT_MAP: Record<string, BossAchievementDefinition> = Object.fromEntries(
  BOSS_ACHIEVEMENT_DEFINITIONS.map(d => [d.id, d]),
);

export const BOSS_ACHIEVEMENT_CATEGORY_LABEL: Record<BossAchievementCategory, string> = {
  combat: '战斗表现',
  survival: '生存表现',
  challenge: '代码挑战',
  tactics: '战术操作',
  weakness: '弱点破解',
  crisis: '危机处理',
  exploration: '机制探索',
  secret: '隐藏秘密',
};

export const BOSS_ACHIEVEMENT_LEVEL_LABEL: Record<BossAchievementLevel, string> = {
  Bronze: '铜级',
  Silver: '银级',
  Gold: '金级',
  Platinum: '铂金',
  Hidden: '隐藏',
};

export const BOSS_ACHIEVEMENT_REWARD_CAPS = {
  totalXp: 1200,
  totalContribution: 600,
};

/** 隐藏成就未解锁时对普通展示层使用的脱敏视图 */
export interface BossAchievementPublicView {
  id: string;
  hidden: boolean;
  unlocked: boolean;
  name: string | null;
  description: string | null;
  category: string | null;
  level: string | null;
  icon: string | null;
  reward: BossAchievementRewardAmounts | null;
  unlockedAt: number | null;
  progress: number;
  target: number;
}

export function publicAchievementView(
  definition: BossAchievementDefinition,
  unlocked: boolean,
  unlockedAt: number | null,
  progress: number,
  target: number,
  includeHiddenSecrets = false,
): BossAchievementPublicView {
  const reveal = !definition.hidden || unlocked || includeHiddenSecrets;
  return {
    id: definition.id,
    hidden: definition.hidden,
    unlocked,
    name: reveal ? definition.name : null,
    description: reveal ? definition.description : null,
    category: reveal ? definition.category : null,
    level: reveal ? definition.level : null,
    icon: reveal ? definition.icon : null,
    reward: reveal ? definition.reward : null,
    unlockedAt,
    progress: unlocked ? target : Math.max(0, Math.min(target, progress)),
    target,
  };
}
