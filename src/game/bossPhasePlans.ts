// Boss 多阶段配置（V1.3-B.1）：通用构建器 + 现有 Boss 的阶段编排
//
// 配置来源：现有三档难度的 BossBattleDef（每档 4 个真实判题阶段）。
// 多阶段引擎在其上再做一层「战斗阶段」编排：
//   - GATE-01：3 个战斗阶段（示范 HP 阈值 + 阶段切换演出）；
//   - K-0：2 个战斗阶段（终章压迫感）；
//   - 其余 Boss：默认每个判题阶段一个战斗阶段（4 个），证明阶段数量并非固定为 3。
// 阶段阈值由真实血量段自动推导，不硬编码到 Boss 数据里。

import type { BossPhaseConfig, BossPhaseHpPolicy, BossPhasePlan, BossPhaseTrigger } from './bossPhaseEngine';
import type { BossDifficulty } from './difficulty';
import { bossBattleDef } from './bossDifficulties';
import { bossById } from './bosses';
import type { BossBattleDef } from './battle';

interface StageText {
  name: string;
  description: string;
  intro: string;
  outro: string;
  hpPolicy?: BossPhaseHpPolicy;
  /** 预留：挑战完成 / 特殊事件触发 */
  trigger?: BossPhaseTrigger;
}

interface BossPlanOverride {
  groups: number[][];
  stages: StageText[];
  defaultHpPolicy?: BossPhaseHpPolicy;
}

const GATE01_STAGES: StageText[] = [
  {
    name: '能源封锁',
    description: 'GATE-01 封闭三道能源闸门：只有修正边界判定，才能让第一路能源重新上线。',
    intro: 'GATE-01 展开防御协议：能源闸门已锁定。',
    outro: '能源封锁已解除。',
  },
  {
    name: '防御协议',
    description: '闸门防御逻辑被反转，威胁分级失效，污染数据开始流入链路。',
    intro: 'Boss 进入第二阶段：防御协议过载。',
    outro: '防御协议崩溃，数据链路暴露。',
  },
  {
    name: '核心暴走',
    description: '核心权限完全暴露：数据传输与综合恢复同步进行，GATE-01 进入最后的暴走状态。',
    intro: '核心结构发生变化——GATE-01 进入最终阶段。',
    outro: '核心权限已瓦解。',
  },
];

const K0_STAGES: StageText[] = [
  {
    name: '绝对安全壁垒',
    description: 'K-0 以绝对秩序封锁原初核心：多层权限与裁决逻辑必须同时被修正。',
    intro: 'K-0 展开绝对安全壁垒。',
    outro: '安全壁垒出现裂缝。',
  },
  {
    name: '零号裁决',
    description: '壁垒破碎后，K-0 将剩余算力全部投入最终裁决与核心合并。',
    intro: '核心结构发生变化——零号裁决启动。',
    outro: '零号裁决终止。',
  },
];

/** 现有 Boss 的阶段编排（key = bossId，适用于三档难度） */
const PLAN_OVERRIDES: Record<string, BossPlanOverride> = {
  'gate-01': {
    groups: [[0], [1], [2, 3]],
    stages: GATE01_STAGES,
    defaultHpPolicy: 'inherit',
  },
  k0: {
    groups: [[0, 1], [2, 3]],
    stages: K0_STAGES,
    defaultHpPolicy: 'inherit',
  },
};

const DIFFICULTY_MULTIPLIER: Record<BossDifficulty, number> = {
  easy: 1,
  hard: 1.25,
  expert: 1.5,
};

/** 兼容分组配置：必须按顺序完整覆盖所有判题阶段，否则回退为默认逐阶段分组 */
function sanitizeGroups(raw: number[][] | undefined, count: number): number[][] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return Array.from({ length: count }, (_, i) => [i]);
  }
  const flat: number[] = [];
  const groups: number[][] = [];
  for (const group of raw) {
    if (!Array.isArray(group) || group.length === 0) return Array.from({ length: count }, (_, i) => [i]);
    const normalized: number[] = [];
    for (const idx of group) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= count) return Array.from({ length: count }, (_, i) => [i]);
      normalized.push(idx);
    }
    groups.push(normalized);
    flat.push(...normalized);
  }
  if (flat.length !== count || flat.some((v, i) => v !== i)) {
    return Array.from({ length: count }, (_, i) => [i]);
  }
  return groups;
}

/** 每个判题阶段占用的血量（与 battle.ts 的 phaseHp 一致，余数计入最后一段） */
function challengeHpSegments(def: BossBattleDef): number[] {
  const count = def.phases.length;
  if (count <= 0) return [];
  const seg = Math.max(1, Math.floor(def.maxHp / count));
  return def.phases.map((_, i) => (i === count - 1 ? Math.max(1, def.maxHp - seg * (count - 1)) : seg));
}

function fallbackStageText(def: BossBattleDef, index: number): StageText {
  const phase = def.phases[index];
  return {
    name: phase.title,
    description: phase.objective,
    intro: 'Boss 进入第 ' + (index + 1) + ' 阶段：' + phase.title + '。',
    outro: '第 ' + (index + 1) + ' 阶段「' + phase.title + '」已击破。',
  };
}

/**
 * 构建某个 Boss + 难度的多阶段战斗配置。
 * 不存在的 Boss / 难度返回 undefined；任何脏配置都会回退到安全的默认分组。
 */
export function buildBossPhasePlan(bossId: string, difficulty: BossDifficulty = 'easy'): BossPhasePlan | undefined {
  const def = bossBattleDef(bossId, difficulty);
  const boss = bossById(bossId);
  if (!def || !boss || def.phases.length === 0) return undefined;

  const override = PLAN_OVERRIDES[bossId];
  const groups = sanitizeGroups(override?.groups, def.phases.length);
  const segments = challengeHpSegments(def);
  const totalHp = Math.max(1, Math.floor(def.maxHp));

  let consumed = 0;
  const phases: BossPhaseConfig[] = groups.map((group, index) => {
    const maxHp = group.reduce((sum, i) => sum + segments[i], 0);
    const hpThreshold = index === 0 ? 100 : Math.round(((totalHp - consumed) / totalHp) * 1000) / 10;
    consumed += maxHp;
    const text = override?.stages[index] || fallbackStageText(def, group[0]);
    return {
      phaseId: bossId + '-bp' + (index + 1),
      phaseName: text.name,
      phaseIndex: index,
      description: text.description,
      hpThreshold,
      maxHp,
      phaseIntro: text.intro,
      phaseOutro: text.outro,
      difficultyMultiplier: DIFFICULTY_MULTIPLIER[difficulty] || 1,
      availableChallenges: group.map(i => def.phases[i].id),
      hpPolicy: text.hpPolicy || override?.defaultHpPolicy || 'inherit',
      defense: index * 5,
      stageMetadata: {
        challengeIndexes: group,
        challengeTitles: group.map(i => def.phases[i].title),
      },
      trigger: text.trigger,
    };
  });

  return {
    bossId,
    bossName: boss.codename + ' · ' + boss.title,
    difficulty,
    totalHp,
    defaultHpPolicy: override?.defaultHpPolicy || 'inherit',
    phases,
  };
}

/** 所有可构建多阶段配置的 Boss（用于 DEV 入口；仅六章主线 Boss 有战斗数据） */
export const BOSS_PHASE_BOSS_IDS = ['gate-01', 'somnia', 'index-0', 'judgment-4', 'entropy', 'k0'];

/** 粗略的 Boss 显示名（DEV 下拉与 UI 提示） */
export function bossPhaseBossName(bossId: string): string {
  const boss = bossById(bossId);
  return boss ? boss.codename + ' · ' + boss.title : bossId.toUpperCase();
}
