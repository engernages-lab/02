// Boss 弱点目录（V1.3-B.3）
//
// - GATE-01 三个战斗阶段各有独立弱点、线索与真实 Python 破解挑战；
// - 其余五章 Boss 按阶段生成通用弱点（真实判题挑战），保证多阶段系统全部可运转；
// - 所有战斗效果由配置驱动（额外伤害 / 攻击中断 / 禁用模式 / 冷却延长），页面不硬编码 Boss。

import type { BossWeaknessDefinition, WeaknessClue, WeaknessType, BossWeaknessChallenge } from './bossWeaknessEngine';
import type { BossDifficulty } from './difficulty';
import { buildBossPhasePlan } from './bossPhasePlans';

interface WeaknessSeed {
  name: string;
  description: string;
  weaknessType: WeaknessType;
  clues: WeaknessClue[];
  challenge: BossWeaknessChallenge;
  damageMultiplier: number;
  attackCooldownBonus: number;
  interruptAttack: boolean;
  disableAttackPatternIds: string[];
  exposureEffects: string[];
  vulnerabilityDuration: number;
}

const clue = (
  clueId: string,
  text: string,
  sourceLabel: string,
  trigger: WeaknessClue['trigger'],
): WeaknessClue => ({ clueId, text, sourceLabel, trigger });

const GATE_SEEDS: WeaknessSeed[] = [
  {
    name: '能源边界校验旁路',
    description: 'GATE-01 的能源阈值比较存在边界旁路：备用电源状态没有参与最终判定。',
    weaknessType: 'logic',
    clues: [
      clue('gate-w1-c1', '每次攻击蓄力前，闸门都会重复校验能源阈值——「50 级」这一临界值被反复读取。', '攻击预警', { kind: 'attack-telegraph' }),
      clue('gate-w1-c2', '防御成功时校验节点出现短暂断电：边界值比较似乎用了「大于」而不是「达到」。', '防御反馈', { kind: 'attack-result', result: 'blocked' }),
      clue('gate-w1-c3', '闪避成功后日志暴露出 backup 参数未参与判定——组合条件存在缺口。', '闪避反馈', { kind: 'attack-result', result: 'dodged' }),
    ],
    challenge: {
      id: 'crack-gate-w1',
      title: '旁路能源边界校验',
      goal: '修复 bypass：能源等级达到 50 且备用电源在线时才返回 True。',
      fault: '边界比较写成了「大于 50」，并把「且」写成了「或」，备用电源被忽略。',
      initialCode:
        'def bypass(level, backup):\n' +
        '    if level > 50 or backup:\n' +
        '        return True\n' +
        '    return False',
      reference:
        'def bypass(level, backup):\n' +
        '    if level >= 50 and backup:\n' +
        '        return True\n' +
        '    return False',
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '50 级 + 备用在线通过', expr: 'bypass(50, True) == True' },
          { name: '49 级不通过', expr: 'bypass(49, True) == False' },
          { name: '60 级但备用离线不通过', expr: 'bypass(60, False) == False' },
          { name: '50 级但备用离线不通过', expr: 'bypass(50, False) == False' },
        ],
      },
      hints: [
        '临界值 50 必须算通过（>=），而不是大于。',
        '两个条件必须同时成立：能源达标并且备用在线。',
        '把 > 改成 >=，把 or 改成 and。',
      ],
    },
    damageMultiplier: 1.5,
    attackCooldownBonus: 1.3,
    interruptAttack: true,
    disableAttackPatternIds: ['gate-01-p1-surge'],
    exposureEffects: ['判题伤害 ×1.5', '过载蓄能暂时禁用', '攻击冷却延长 30%'],
    vulnerabilityDuration: 12000,
  },
  {
    name: '协议重复验证缺口',
    description: '防御协议每次都复用同一个验证结果，第三道 token 校验被省略。',
    weaknessType: 'protocol',
    clues: [
      clue('gate-w2-c1', '「协议锁定」启动时，验证节点连续两次读取同一个 token。', '攻击预警', { kind: 'attack-telegraph', attackType: 'special' }),
      clue('gate-w2-c2', '闪避协议锁定后，校验节点出现结构性停顿：第三道校验没有执行。', '闪避反馈', { kind: 'attack-result', result: 'dodged' }),
      clue('gate-w2-c3', '连续冲击每段都复用前一阶段的验证结果，攻击间隔远大于真实校验耗时。', '攻击预警', { kind: 'attack-telegraph', attackType: 'multi' }),
    ],
    challenge: {
      id: 'crack-gate-w2',
      title: '补全协议验证链',
      goal: '修复 verify：三道 token 必须全部校验通过。',
      fault: '验证函数只检查了前两个 token，第三个 token 被静默跳过。',
      initialCode:
        'def verify(a, b, c):\n' +
        '    return a and b',
      reference:
        'def verify(a, b, c):\n' +
        '    return a and b and c',
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '三道全通过才通过', expr: 'verify(True, True, True) == True' },
          { name: '缺第三道不通过', expr: 'verify(True, True, False) == False' },
          { name: '缺第一道不通过', expr: 'verify(False, True, True) == False' },
        ],
      },
      hints: [
        '函数只用了两个参数，第三个参数没有参与判断。',
        '协议验证要求所有 token 同时有效。',
        '在 return 中补上 and c。',
      ],
    },
    damageMultiplier: 1.4,
    attackCooldownBonus: 1.35,
    interruptAttack: true,
    disableAttackPatternIds: ['gate-01-p2-lock'],
    exposureEffects: ['判题伤害 ×1.4', '协议锁定暂时禁用', '连续攻击冷却延长 35%'],
    vulnerabilityDuration: 10000,
  },
  {
    name: '核心时间窗口错位',
    description: '核心暴走时，危险区域与校验时间窗口不同步：窗口上界从未被校验。',
    weaknessType: 'timing',
    clues: [
      clue('gate-w3-c1', '范围攻击蓄力时，危险区域扩张速度与校验倒计时不一致。', '攻击预警', { kind: 'attack-telegraph', attackType: 'aoe' }),
      clue('gate-w3-c2', '被范围冲击命中后，核心日志显示时间窗口只校验了下界。', '受击日志', { kind: 'attack-result', result: 'hit' }),
      clue('gate-w3-c3', '暴走连击的间隔被硬编码，时间窗口上界存在可利用的间隙。', '攻击预警', { kind: 'attack-telegraph', attackType: 'multi' }),
    ],
    challenge: {
      id: 'crack-gate-w3',
      title: '重写核心时间窗口',
      goal: '修复 in_window：时间 t 必须落在 [start, end) 区间内。',
      fault: '窗口判定只检查了下界，结束时间未参与比较。',
      initialCode:
        'def in_window(t, start, end):\n' +
        '    return t >= start',
      reference:
        'def in_window(t, start, end):\n' +
        '    return t >= start and t < end',
      judge: {
        judgeKind: 'python',
        pythonChecks: [
          { name: '窗口内返回 True', expr: 'in_window(5, 1, 10) == True' },
          { name: '到达上界返回 False', expr: 'in_window(10, 1, 10) == False' },
          { name: '低于下界返回 False', expr: 'in_window(0, 1, 10) == False' },
          { name: '下界本身算窗口内', expr: 'in_window(1, 1, 10) == True' },
        ],
      },
      hints: [
        '结束时间 end 完全没有参与判断。',
        '区间是左闭右开：t >= start 且 t < end。',
        '在 return 中补上 and t < end。',
      ],
    },
    damageMultiplier: 1.6,
    attackCooldownBonus: 1.5,
    interruptAttack: true,
    disableAttackPatternIds: ['gate-01-p3-frenzy'],
    exposureEffects: ['判题伤害 ×1.6', '暴走连击暂时禁用', '攻击冷却延长 50%'],
    vulnerabilityDuration: 9000,
  },
];

const GENERIC_TYPES: WeaknessType[] = ['logic', 'protocol', 'data', 'structure'];
const GENERIC_NAMES = ['逻辑校验旁路', '协议握手缺口', '数据索引异常', '代码结构错位'];
const GENERIC_EFFECTS = ['判题伤害 ×1.4', '攻击冷却延长 25%'];

function genericChallenge(bossId: string, phaseIndex: number): BossWeaknessChallenge {
  switch (phaseIndex % 4) {
    case 0:
      return {
        id: 'crack-' + bossId + '-w' + (phaseIndex + 1),
        title: '修复逻辑边界',
        goal: '修复 valid：数值达到 10 才返回 True。',
        fault: '边界写成了「大于 10」。',
        initialCode: 'def valid(x):\n    return x > 10',
        reference: 'def valid(x):\n    return x >= 10',
        judge: {
          judgeKind: 'python',
          pythonChecks: [
            { name: '10 算有效', expr: 'valid(10) == True' },
            { name: '9 无效', expr: 'valid(9) == False' },
            { name: '11 有效', expr: 'valid(11) == True' },
          ],
        },
        hints: ['注意边界值。', '达到阈值应使用 >=。', '把 > 改成 >='],
      };
    case 1:
      return {
        id: 'crack-' + bossId + '-w' + (phaseIndex + 1),
        title: '补全协议条件',
        goal: '修复 allow：两个条件必须同时成立。',
        fault: '条件连接词用了 or。',
        initialCode: 'def allow(a, b):\n    return a or b',
        reference: 'def allow(a, b):\n    return a and b',
        judge: {
          judgeKind: 'python',
          pythonChecks: [
            { name: '双条件成立才通过', expr: 'allow(True, True) == True' },
            { name: '单条件不通过', expr: 'allow(True, False) == False' },
            { name: '全假不通过', expr: 'allow(False, False) == False' },
          ],
        },
        hints: ['or 只需要一个条件。', '协议要求同时满足。', '把 or 改成 and。'],
      };
    case 2:
      return {
        id: 'crack-' + bossId + '-w' + (phaseIndex + 1),
        title: '修复安全取值',
        goal: '修复 read：缺失键返回 0，不崩溃。',
        fault: '直接使用 table[key] 会触发 KeyError。',
        initialCode: 'def read(table, key):\n    return table[key]',
        reference: 'def read(table, key):\n    return table.get(key, 0)',
        judge: {
          judgeKind: 'python',
          pythonChecks: [
            { name: '存在的键返回值', expr: 'read({1: 5}, 1) == 5' },
            { name: '缺失键返回 0', expr: 'read({1: 5}, 9) == 0' },
            { name: '空字典返回 0', expr: 'read({}, 1) == 0' },
          ],
        },
        hints: ['键不存在时直接取值会崩溃。', '字典有安全的 get 方法。', '使用 table.get(key, 0)。'],
      };
    default:
      return {
        id: 'crack-' + bossId + '-w' + (phaseIndex + 1),
        title: '修正筛选结构',
        goal: '修复 clean：只保留大于 0 的数值。',
        fault: '筛选条件方向反了。',
        initialCode: 'def clean(xs):\n    out = []\n    for x in xs:\n        if x < 0:\n            out.append(x)\n    return out',
        reference: 'def clean(xs):\n    out = []\n    for x in xs:\n        if x > 0:\n            out.append(x)\n    return out',
        judge: {
          judgeKind: 'python',
          pythonChecks: [
            { name: '只保留正值', expr: 'clean([3, -1, 5]) == [3, 5]' },
            { name: '全负返回空', expr: 'clean([-1, -2]) == []' },
            { name: '空列表返回空', expr: 'clean([]) == []' },
          ],
        },
        hints: ['结果全是负数。', '应该保留大于 0 的值。', '把 if x < 0 改成 if x > 0。'],
      };
  }
}

const DIFFICULTY = {
  easy: { duration: 1, maxAttempts: 5, requiredClues: 2, cooldownBonusDelta: 0, recovery: 6000, lock: 20000 },
  hard: { duration: 0.85, maxAttempts: 4, requiredClues: 2, cooldownBonusDelta: 0.05, recovery: 8000, lock: 25000 },
  expert: { duration: 0.7, maxAttempts: 3, requiredClues: 3, cooldownBonusDelta: 0.1, recovery: 10000, lock: 30000 },
} as const;

function scale(
  seed: WeaknessSeed,
  bossId: string,
  phaseId: string,
  phaseIndex: number,
  difficulty: BossDifficulty,
  id: string,
): BossWeaknessDefinition {
  const d = DIFFICULTY[difficulty];
  return {
    weaknessId: id,
    bossId,
    phaseId,
    phaseIndex,
    name: seed.name,
    description: seed.description,
    weaknessType: seed.weaknessType,
    discoveryDifficulty: difficulty,
    clues: seed.clues,
    requiredClues: Math.min(seed.clues.length, d.requiredClues),
    analysisDurationMs: 2500,
    challenge: seed.challenge,
    vulnerabilityDuration: Math.max(3000, Math.round(seed.vulnerabilityDuration * d.duration)),
    damageMultiplier: seed.damageMultiplier,
    attackCooldownBonus: Math.round((seed.attackCooldownBonus + d.cooldownBonusDelta) * 100) / 100,
    interruptAttack: seed.interruptAttack,
    disableAttackPatternIds: seed.disableAttackPatternIds,
    exposureEffects: seed.exposureEffects,
    recoveryRule: { recoveryCooldownMs: d.recovery, lockRecoveryMs: d.lock },
    maxAttempts: d.maxAttempts,
  };
}

const cache = new Map<string, BossWeaknessDefinition[]>();

/** 某个 Boss + 难度的全部阶段弱点（含 phaseId / phaseIndex） */
export function weaknessDefinitionsFor(bossId: string, difficulty: BossDifficulty): BossWeaknessDefinition[] {
  const key = bossId + '|' + difficulty;
  const hit = cache.get(key);
  if (hit) return hit;
  const plan = buildBossPhasePlan(bossId, difficulty);
  if (!plan) { cache.set(key, []); return []; }
  const defs: BossWeaknessDefinition[] = [];
  for (const phase of plan.phases) {
    if (bossId === 'gate-01' && phase.phaseIndex < GATE_SEEDS.length) {
      defs.push(scale(GATE_SEEDS[phase.phaseIndex], bossId, phase.phaseId, phase.phaseIndex, difficulty, bossId + '-w' + (phase.phaseIndex + 1)));
    } else {
      const idx = phase.phaseIndex % 4;
      defs.push(scale(
        {
          name: GENERIC_NAMES[idx],
          description: 'Boss 在「' + phase.phaseName + '」阶段暴露出可被代码破解的' + GENERIC_NAMES[idx] + '。',
          weaknessType: GENERIC_TYPES[idx],
          clues: [
            clue(bossId + '-w' + (phase.phaseIndex + 1) + '-c1', '攻击蓄力时，Boss 会重复执行同一段校验逻辑。', '攻击预警', { kind: 'attack-telegraph' }),
            clue(bossId + '-w' + (phase.phaseIndex + 1) + '-c2', '防御或闪避成功后，校验节点出现短暂停顿。', '战斗反馈', { kind: 'attack-result', result: 'blocked' }),
            clue(bossId + '-w' + (phase.phaseIndex + 1) + '-c3', '闪避成功时，第二道校验被跳过。', '战斗反馈', { kind: 'attack-result', result: 'dodged' }),
          ],
          challenge: genericChallenge(bossId, phase.phaseIndex),
          damageMultiplier: 1.4,
          attackCooldownBonus: 1.25,
          interruptAttack: true,
          disableAttackPatternIds: [],
          exposureEffects: [...GENERIC_EFFECTS],
          vulnerabilityDuration: 10000,
        },
        bossId, phase.phaseId, phase.phaseIndex, difficulty,
        bossId + '-w' + (phase.phaseIndex + 1),
      ));
    }
  }
  cache.set(key, defs);
  return defs;
}

export function weaknessDefinitionById(bossId: string, difficulty: BossDifficulty, weaknessId: string): BossWeaknessDefinition | undefined {
  return weaknessDefinitionsFor(bossId, difficulty).find(d => d.weaknessId === weaknessId);
}
