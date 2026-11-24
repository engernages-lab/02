// Boss 攻击模式配置（V1.3-B.2）
//
// - GATE-01 按三个战斗阶段配置真实攻击模式（单体 / 延迟 / 连续 / 不可防御特殊 / 范围）；
// - 其余五章 Boss 使用通用模式表（同样按阶段编排），确保多阶段系统全部可运转；
// - 伤害 / 预警 / 冷却随难度缩放，全部由数据驱动，组件不硬编码攻击。

import type { BossAttackPattern, BossAttackType } from './bossAttackEngine';
import type { BossDifficulty } from './difficulty';

interface PatternSeed {
  key: string;
  name: string;
  type: BossAttackType;
  description: string;
  damage: number;
  warning: number;
  cooldown: number;
  attackDuration: number;
  hitCount?: number;
  hitInterval?: number;
  recovery?: number;
  dodgeWindow: number;
  defenseRequirement?: 'basic' | 'timed' | 'none';
  defenseReduction?: number;
  defenseWindow?: number;
  danger: 1 | 2 | 3;
  visual: BossAttackPattern['visualEffect'];
  audio: string;
  specialEffect?: string;
}

const GATE_PHASE_SEEDS: PatternSeed[][] = [
  // Phase 1 · 能源封锁
  [
    {
      key: 'pulse', name: '数据脉冲', type: 'single',
      description: 'GATE-01 聚集一束数据能量，对维修终端进行一次冲击。',
      damage: 3, warning: 3200, cooldown: 15000, attackDuration: 250,
      dodgeWindow: 1000, defenseRequirement: 'timed', defenseReduction: 0.7, defenseWindow: 1700,
      danger: 1, visual: 'pulse', audio: 'threat',
    },
    {
      key: 'surge', name: '过载蓄能', type: 'delayed',
      description: '闸门蓄能后延迟释放，能量在预警结束后命中。',
      damage: 4, warning: 3400, cooldown: 18000, attackDuration: 800, recovery: 600,
      dodgeWindow: 1100, defenseRequirement: 'timed', defenseReduction: 0.6, defenseWindow: 1600,
      danger: 2, visual: 'wave', audio: 'alarm',
    },
  ],
  // Phase 2 · 防御协议
  [
    {
      key: 'barrage', name: '连续代码冲击', type: 'multi',
      description: '防御协议连续释放三轮冲击，每轮之间留出短暂反应时间。',
      damage: 2, warning: 2800, cooldown: 20000, attackDuration: 300,
      hitCount: 3, hitInterval: 750, recovery: 600,
      dodgeWindow: 850, defenseRequirement: 'timed', defenseReduction: 0.6, defenseWindow: 1400,
      danger: 2, visual: 'barrage', audio: 'threat',
    },
    {
      key: 'lock', name: '协议锁定', type: 'special',
      description: '锁定维修终端：该攻击无法防御，必须在命中前闪避。',
      damage: 3, warning: 2600, cooldown: 22000, attackDuration: 600, recovery: 500,
      dodgeWindow: 900, defenseRequirement: 'none', defenseReduction: 0, defenseWindow: 0,
      danger: 2, visual: 'lock', audio: 'alarm', specialEffect: 'data-lock',
    },
  ],
  // Phase 3 · 核心暴走
  [
    {
      key: 'collapse', name: '核心崩塌', type: 'aoe',
      description: '核心权限暴走，整个战场进入危险区域，范围冲击即将落下。',
      damage: 6, warning: 2200, cooldown: 20000, attackDuration: 400, recovery: 700,
      dodgeWindow: 800, defenseRequirement: 'timed', defenseReduction: 0.5, defenseWindow: 1300,
      danger: 3, visual: 'aoe', audio: 'alarm',
    },
    {
      key: 'frenzy', name: '暴走连击', type: 'multi',
      description: 'GATE-01 进入暴走状态，连续四次高速冲击。',
      damage: 2, warning: 2000, cooldown: 19000, attackDuration: 250,
      hitCount: 4, hitInterval: 550, recovery: 600,
      dodgeWindow: 700, defenseRequirement: 'timed', defenseReduction: 0.5, defenseWindow: 1200,
      danger: 3, visual: 'barrage', audio: 'threat',
    },
    {
      key: 'zeropulse', name: '零号脉冲', type: 'delayed',
      description: '核心能量汇聚成一次高伤害脉冲，预警结束后延迟命中。',
      damage: 7, warning: 2600, cooldown: 24000, attackDuration: 750, recovery: 800,
      dodgeWindow: 750, defenseRequirement: 'timed', defenseReduction: 0.4, defenseWindow: 1200,
      danger: 3, visual: 'burst', audio: 'alarm',
    },
  ],
];

const GENERIC_PHASE_SEEDS: PatternSeed[][] = [
  [
    {
      key: 'pulse', name: '系统脉冲', type: 'single',
      description: 'Boss 释放一道基础数据脉冲。',
      damage: 3, warning: 3400, cooldown: 15000, attackDuration: 250,
      dodgeWindow: 1000, defenseRequirement: 'timed', defenseReduction: 0.7, defenseWindow: 1700,
      danger: 1, visual: 'pulse', audio: 'threat',
    },
    {
      key: 'cache', name: '缓存崩塌', type: 'delayed',
      description: '失效缓存延迟崩塌，预警结束后命中。',
      damage: 4, warning: 3600, cooldown: 18000, attackDuration: 700, recovery: 600,
      dodgeWindow: 1100, defenseRequirement: 'timed', defenseReduction: 0.6, defenseWindow: 1600,
      danger: 2, visual: 'wave', audio: 'alarm',
    },
  ],
  [
    {
      key: 'chain', name: '连锁报错', type: 'multi',
      description: '错误链连续爆发三次冲击。',
      damage: 2, warning: 2900, cooldown: 20000, attackDuration: 300,
      hitCount: 3, hitInterval: 750, recovery: 600,
      dodgeWindow: 850, defenseRequirement: 'timed', defenseReduction: 0.6, defenseWindow: 1400,
      danger: 2, visual: 'barrage', audio: 'threat',
    },
    {
      key: 'freeze', name: '冻结协议', type: 'special',
      description: '冻结维修终端：无法防御，只能闪避。',
      damage: 3, warning: 2700, cooldown: 22000, attackDuration: 600, recovery: 500,
      dodgeWindow: 900, defenseRequirement: 'none', defenseReduction: 0, defenseWindow: 0,
      danger: 2, visual: 'lock', audio: 'alarm', specialEffect: 'freeze',
    },
    {
      key: 'overload', name: '高能过载', type: 'delayed',
      description: '过载能量在延迟后命中，伤害较高。',
      damage: 5, warning: 3000, cooldown: 21000, attackDuration: 700, recovery: 600,
      dodgeWindow: 900, defenseRequirement: 'timed', defenseReduction: 0.5, defenseWindow: 1400,
      danger: 2, visual: 'burst', audio: 'alarm',
    },
  ],
  [
    {
      key: 'entropy', name: '熵增风暴', type: 'aoe',
      description: '战场被熵增风暴覆盖，范围冲击即将落下。',
      damage: 5, warning: 2400, cooldown: 20000, attackDuration: 400, recovery: 700,
      dodgeWindow: 800, defenseRequirement: 'timed', defenseReduction: 0.5, defenseWindow: 1300,
      danger: 3, visual: 'aoe', audio: 'alarm',
    },
    {
      key: 'meltdown', name: '核心熔断', type: 'delayed',
      description: '核心熔断能量延迟爆发，预警时间较短。',
      damage: 6, warning: 2600, cooldown: 23000, attackDuration: 750, recovery: 700,
      dodgeWindow: 750, defenseRequirement: 'timed', defenseReduction: 0.4, defenseWindow: 1200,
      danger: 3, visual: 'burst', audio: 'alarm',
    },
  ],
  [
    {
      key: 'ruin', name: '全域崩坏', type: 'aoe',
      description: '整个战场进入崩坏状态，范围冲击覆盖所有区域。',
      damage: 6, warning: 2200, cooldown: 20000, attackDuration: 400, recovery: 700,
      dodgeWindow: 750, defenseRequirement: 'timed', defenseReduction: 0.45, defenseWindow: 1200,
      danger: 3, visual: 'aoe', audio: 'alarm',
    },
    {
      key: 'final', name: '终焉连击', type: 'multi',
      description: '终焉模式下的高速四连击。',
      damage: 2, warning: 2000, cooldown: 19000, attackDuration: 250,
      hitCount: 4, hitInterval: 500, recovery: 600,
      dodgeWindow: 700, defenseRequirement: 'timed', defenseReduction: 0.5, defenseWindow: 1200,
      danger: 3, visual: 'barrage', audio: 'threat',
    },
  ],
];

const DIFFICULTY_SCALE: Record<BossDifficulty, {
  damage: number; warning: number; warningDelta: number; cooldown: number;
  dodgeDelta: number; reductionDelta: number; defenseWindowDelta: number;
}> = {
  easy: { damage: 1, warning: 1, warningDelta: 0, cooldown: 1, dodgeDelta: 0, reductionDelta: 0, defenseWindowDelta: 0 },
  hard: { damage: 1.2, warning: 1, warningDelta: -300, cooldown: 0.9, dodgeDelta: -100, reductionDelta: -0.05, defenseWindowDelta: -100 },
  expert: { damage: 1.45, warning: 1, warningDelta: -600, cooldown: 0.8, dodgeDelta: -200, reductionDelta: -0.1, defenseWindowDelta: -200 },
};

function buildPatterns(bossId: string, seeds: PatternSeed[][], difficulty: BossDifficulty): BossAttackPattern[] {
  const scale = DIFFICULTY_SCALE[difficulty];
  const out: BossAttackPattern[] = [];
  seeds.forEach((group, phaseIndex) => {
    group.forEach((seed, i) => {
      out.push({
        attackId: bossId + '-p' + (phaseIndex + 1) + '-' + seed.key,
        attackName: seed.name,
        attackType: seed.type,
        description: seed.description,
        damage: Math.max(1, Math.round(seed.damage * scale.damage)),
        warningDuration: Math.max(1400, Math.round(seed.warning * scale.warning) + scale.warningDelta),
        cooldown: Math.max(5000, Math.round(seed.cooldown * scale.cooldown)),
        attackDuration: Math.max(0, seed.attackDuration),
        hitCount: Math.max(1, Math.floor(seed.hitCount ?? 1)),
        hitIntervalMs: Math.max(0, Math.floor(seed.hitInterval ?? 0)),
        recoveryDuration: Math.max(300, Math.floor(seed.recovery ?? 500)),
        difficulty,
        dodgeWindow: Math.max(500, seed.dodgeWindow + scale.dodgeDelta),
        defenseRequirement: seed.defenseRequirement ?? 'timed',
        defenseReduction: Math.max(0, Math.min(1, Math.round(((seed.defenseReduction ?? 0.6) + scale.reductionDelta) * 100) / 100)),
        defenseWindow: Math.max(0, (seed.defenseWindow ?? 1400) + scale.defenseWindowDelta),
        phaseRestriction: [phaseIndex],
        target: 'player',
        visualEffect: seed.visual,
        audioEffect: seed.audio,
        dangerLevel: seed.danger,
        specialEffect: seed.specialEffect,
        attackMetadata: { seed: seed.key, phase: phaseIndex, index: i },
      });
    });
  });
  return out;
}

const cache = new Map<string, BossAttackPattern[]>();

/** 某个 Boss + 难度下的全部攻击模式（含阶段限制） */
export function bossAttackPatterns(bossId: string, difficulty: BossDifficulty): BossAttackPattern[] {
  const key = bossId + '|' + difficulty;
  const hit = cache.get(key);
  if (hit) return hit;
  const seeds = bossId === 'gate-01' ? GATE_PHASE_SEEDS : GENERIC_PHASE_SEEDS;
  const list = buildPatterns(bossId, seeds, difficulty);
  cache.set(key, list);
  return list;
}

/** 当前阶段可用的攻击模式 */
export function attackPatternsFor(bossId: string, difficulty: BossDifficulty, phaseIndex: number): BossAttackPattern[] {
  return bossAttackPatterns(bossId, difficulty).filter(p => p.phaseRestriction.includes(phaseIndex));
}

export function attackPatternById(bossId: string, difficulty: BossDifficulty, attackId: string): BossAttackPattern | undefined {
  return bossAttackPatterns(bossId, difficulty).find(p => p.attackId === attackId);
}
