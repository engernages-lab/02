// 独立挑战模板（V1.3-A）：与 31 个原有关卡完全解耦的示例挑战
//
// 这些模板用于验证 V1.3-A 的五种挑战类型；id 均以 ind- 开头，不与原有关卡冲突。
// 原有关卡（tut-1、1-1..6-5）在此阶段不做任何改动。

import type { ChallengeDef } from './challengeTypes';
import {
  buildTimedChallenge,
  buildChainBugChallenge,
  buildHiddenBugChallenge,
  buildResourceLimitedChallenge,
  buildMultiStageChallenge,
} from './challengeTypes';

const timed: ChallengeDef = buildTimedChallenge({
  id: 'ind-timed',
  title: '应急链路重启（限时）',
  difficulty: 'elite',
  timeLimitSec: 90,
  fault: '应急链路心跳丢失，需在时限内恢复就绪信号。',
  goal: '让程序输出 LINK OK。',
  initialCode: 'print("LINK DOWN")\n',
  reference: 'print("LINK OK")\n',
  rewardExp: 40,
  judge: {
    judgeKind: 'stdout',
    stdoutChecks: [{ name: '链路就绪', contains: ['LINK OK'] }],
  },
});

const chain: ChallengeDef = buildChainBugChallenge({
  id: 'ind-chain',
  title: '继电器连锁修复',
  difficulty: 'advanced',
  fault: '供电继电器阈值与熔断上限同时出错，必须按依赖顺序修复。',
  goal: 'gate 判定 ≥20 为真，fuse 判定 <100 为真。',
  initialCode:
    'def gate(energy):\n    return energy > 20\n\n' +
    'def fuse(energy):\n    return energy > 100\n',
  reference:
    'def gate(energy):\n    return energy >= 20\n\n' +
    'def fuse(energy):\n    return energy < 100\n',
  rewardExp: 50,
  judge: {
    judgeKind: 'python',
    pythonChecks: [
      { name: 'gate 阈值下界', expr: 'gate(20) == True' },
      { name: 'gate 阈值之下', expr: 'gate(19) == False' },
      { name: 'fuse 未熔断', expr: 'fuse(99) == True' },
      { name: 'fuse 熔断触发', expr: 'fuse(101) == False' },
    ],
  },
  bugs: [
    { id: 'bug-relay', label: '继电器阈值（应为 ≥）', fixed: false, dependsOn: [] },
    { id: 'bug-fuse', label: '熔断上限（应为 <）', fixed: false, dependsOn: ['bug-relay'] },
  ],
});

const hidden: ChallengeDef = buildHiddenBugChallenge({
  id: 'ind-hidden',
  title: '均值函数的隐藏边界',
  difficulty: 'elite',
  fault: '均值函数在空输入时崩溃，常规用例无法暴露。',
  goal: 'avg 对空列表返回 0，不抛错。',
  initialCode:
    'def avg(items):\n    total = 0\n    for x in items:\n        total += x\n    return total / len(items)\n',
  reference:
    'def avg(items):\n    if not items:\n        return 0\n    total = 0\n    for x in items:\n        total += x\n    return total / len(items)\n',
  rewardExp: 60,
  judge: {
    judgeKind: 'python',
    pythonChecks: [{ name: '常规均值', expr: 'avg([1, 2, 3]) == 2.0' }],
  },
  hiddenTests: [{ id: 'hidden-empty', label: '空列表边界', passed: null }],
  hiddenChecks: [{ name: '空列表边界', expr: 'avg([]) == 0' }],
});

const resource: ChallengeDef = buildResourceLimitedChallenge({
  id: 'ind-resource',
  title: '受限资源求和',
  difficulty: 'advanced',
  maxRuns: 3,
  maxSubmits: 2,
  maxHints: 1,
  fault: '算力配额紧张，请在有限运行/提交/提示次数内完成求和。',
  goal: '输出 1 到 10 的和（55）。',
  initialCode: 'print(0)\n',
  reference: 'print(sum(range(1, 11)))\n',
  rewardExp: 45,
  judge: {
    judgeKind: 'stdout',
    stdoutChecks: [{ name: '求和结果', contains: ['55'] }],
  },
});

const multi: ChallengeDef = buildMultiStageChallenge({
  id: 'ind-multi',
  title: '指令解析三阶段',
  difficulty: 'special',
  fault: '指令解析函数依次存在语法、逻辑与隐藏用例问题。',
  goal: 'ping→pong，stop→halt，其余→idle。',
  initialCode: 'def parse(cmd)\n    return "pong"\n',
  reference:
    'def parse(cmd):\n    if cmd == "ping":\n        return "pong"\n    if cmd == "stop":\n        return "halt"\n    return "idle"\n',
  rewardExp: 70,
  judge: {
    judgeKind: 'python',
    pythonChecks: [
      { name: 'ping 解析', expr: 'parse("ping") == "pong"' },
      { name: 'stop 解析', expr: 'parse("stop") == "halt"' },
    ],
  },
  stages: [
    { id: 'stage-syntax', label: '语法修复', done: false },
    { id: 'stage-logic', label: '逻辑修复', done: false },
    { id: 'stage-hidden', label: '隐藏用例', done: false },
  ],
  hiddenTests: [{ id: 'mt-hidden-empty', label: '空指令返回 idle', passed: null }],
  hiddenChecks: [
    { name: '未知指令 idle', expr: 'parse("idle") == "idle"' },
    { name: '空指令 idle', expr: 'parse("") == "idle"' },
  ],
});

export const INDEPENDENT_CHALLENGES: ChallengeDef[] = [timed, chain, hidden, resource, multi];

export const independentChallengeById = (id: string): ChallengeDef | undefined =>
  INDEPENDENT_CHALLENGES.find((c) => c.id === id);
