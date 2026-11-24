// V1.3-D：数字世界探索（纯逻辑 + 可序列化状态）
//
// 复用现有 SERVERS/关卡作为真实区域与终端入口；探索状态只记录发现/完成/奖励幂等，
// 不修改 Challenge、Boss、经济与 MIRA 的核心规则。

import { SERVERS, levelsOfServer, type ServerDef } from './levels';

export type ExplorationNodeKind = 'signal' | 'terminal' | 'ruin' | 'hidden';
export type ExplorationRegionStatus = 'LOCKED' | 'AVAILABLE' | 'EXPLORING' | 'COMPLETED' | 'ABNORMAL';

export interface ExplorationNodeDef {
  id: string;
  regionId: string;
  kind: ExplorationNodeKind;
  name: string;
  description: string;
  levelId?: string;
  credits: number;
  miraXp: number;
  hidden?: boolean;
}

export interface RegionExplorationDef {
  id: string;
  name: string;
  codename: string;
  chapter: number;
  description: string;
  danger: 1 | 2 | 3;
  nodes: ExplorationNodeDef[];
}

const RUIN_NAMES: Record<string, { name: string; desc: string }> = {
  training: { name: '初代核心档案', desc: '数字世界早期运行日志被遗留在这里，记录着第一批修复师的接驳流程。' },
  syntax: { name: '被封锁的记忆节点', desc: '旧数据节点被异常程序封锁，内部保存着尚未归档的语法修复记录。' },
  logs: { name: '日志残响', desc: '一段被覆盖的日志仍在循环播放，像某种未完成的告警。' },
  storage: { name: '存储碎片', desc: '损坏的存储块中残留着零散的数据索引。' },
  factory: { name: '自动化遗迹', desc: '停摆的流水线保存着最后一次运行留下的调度记录。' },
  diag: { name: '诊断记录', desc: '事故诊断中心的缓存里有一段被标记为待复核的记录。' },
  core: { name: '方舟底层档案', desc: '核心机房的底层区块保存着受限的历史数据。' },
};

const regionDefs: RegionExplorationDef[] = SERVERS.map(server => {
  const levels = levelsOfServer(server.id);
  const first = levels[0];
  const ruin = RUIN_NAMES[server.id] || { name: '数据遗迹', desc: '一段未知来源的旧数据遗迹。' };
  const nodes: ExplorationNodeDef[] = [
    {
      id: 'signal:' + server.id, regionId: server.id, kind: 'signal',
      name: '未知数据残留', description: '区域中发现异常信号残留，可能与早先的系统运行记录有关。',
      credits: 5, miraXp: 4,
    },
    {
      id: 'terminal:' + server.id, regionId: server.id, kind: 'terminal',
      name: '损坏的数据终端', description: first ? '终端与维修关卡 ' + first.codename + ' 相连，需要真实修复判题。' : '损坏的终端。',
      levelId: first ? first.id : undefined, credits: 10, miraXp: 8,
    },
    {
      id: 'ruin:' + server.id, regionId: server.id, kind: 'ruin',
      name: ruin.name, description: ruin.desc,
      credits: 8, miraXp: 6,
    },
  ];
  if (server.id === 'training') {
    nodes.push({
      id: 'hidden:training:echo', regionId: server.id, kind: 'hidden',
      name: '不属于当前服务器的数据回声', description: '一段来自更早时代的信号，只在区域主要节点完成后显现。',
      credits: 20, miraXp: 15, hidden: true,
    });
  }
  return {
    id: server.id, name: server.name, codename: server.codename,
    chapter: server.chapter, description: server.desc,
    danger: server.chapter <= 1 ? 1 : server.chapter <= 4 ? 2 : 3,
    nodes,
  };
});

const regionMap = new Map(regionDefs.map(r => [r.id, r]));
export function explorationRegionDefs(): RegionExplorationDef[] { return regionDefs; }
export function explorationRegionDef(id: string): RegionExplorationDef | undefined { return regionMap.get(id); }
export function explorationNodeDef(regionId: string, nodeId: string): ExplorationNodeDef | undefined {
  return regionMap.get(regionId)?.nodes.find(n => n.id === nodeId);
}

export interface ExplorationEventState { status: 'discovered' | 'completed'; discoveredAt: number; completedAt: number | null }
export interface ExplorationRuinState { discoveredAt: number; completedAt: number }
export interface PendingExplorationChallenge { regionId: string; nodeId: string; eventId: string; levelId: string }
export interface ExplorationArchiveEntry { id: string; kind: string; title: string; at: number }

export interface ExplorationState {
  version: 1;
  events: Record<string, ExplorationEventState>;
  ruins: Record<string, ExplorationRuinState>;
  hidden: Record<string, ExplorationArchiveEntry>;
  rewardsClaimed: string[];
  discoveredRegions: string[];
  pendingChallenge: PendingExplorationChallenge | null;
  archive: ExplorationArchiveEntry[];
  updatedAt: number;
}

export function defaultExplorationState(now = Date.now()): ExplorationState {
  return {
    version: 1, events: {}, ruins: {}, hidden: {}, rewardsClaimed: [],
    discoveredRegions: [], pendingChallenge: null, archive: [], updatedAt: now,
  };
}

const int = (v: unknown, fb = 0): number => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : fb);

export function normalizeExplorationState(raw: unknown, now = Date.now()): ExplorationState {
  const fresh = defaultExplorationState(now);
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Partial<ExplorationState>;
  const events: Record<string, ExplorationEventState> = {};
  if (r.events && typeof r.events === 'object') {
    for (const [id, v] of Object.entries(r.events)) {
      if (!explorationNodeDef(id.split(':')[1] || '', id) || !v || typeof v !== 'object') continue;
      const e = v as Partial<ExplorationEventState>;
      if (e.status !== 'completed' && e.status !== 'discovered') continue;
      events[id] = { status: e.status, discoveredAt: int(e.discoveredAt, now), completedAt: typeof e.completedAt === 'number' ? int(e.completedAt) : null };
    }
  }
  const ruins: Record<string, ExplorationRuinState> = {};
  if (r.ruins && typeof r.ruins === 'object') {
    for (const [id, v] of Object.entries(r.ruins)) {
      if (!id.startsWith('ruin:') || !explorationNodeDef(id.split(':')[1] || '', id) || !v || typeof v !== 'object') continue;
      const e = v as Partial<ExplorationRuinState>;
      ruins[id] = { discoveredAt: int(e.discoveredAt, now), completedAt: int(e.completedAt, now) };
    }
  }
  const hidden: Record<string, ExplorationArchiveEntry> = {};
  if (r.hidden && typeof r.hidden === 'object') {
    for (const [id, v] of Object.entries(r.hidden)) {
      if (!id.startsWith('hidden:') || !v || typeof v !== 'object') continue;
      const e = v as Partial<ExplorationArchiveEntry>;
      hidden[id] = { id, kind: 'hidden', title: String(e.title || '隐藏信号'), at: int(e.at, now) };
    }
  }
  const rewardsClaimed = Array.isArray(r.rewardsClaimed) ? [...new Set(r.rewardsClaimed.filter((x): x is string => typeof x === 'string'))].slice(-200) : [];
  const discoveredRegions = Array.isArray(r.discoveredRegions) ? [...new Set(r.discoveredRegions.filter((x): x is string => typeof x === 'string' && regionMap.has(x)))] : [];
  const archive = Array.isArray(r.archive)
    ? r.archive.filter(x => x && typeof x === 'object' && typeof x.title === 'string')
      .map(x => ({ id: String(x.id || ''), kind: String(x.kind || 'explore'), title: String(x.title || ''), at: int(x.at) }))
      .slice(-80)
    : [];
  let pendingChallenge: PendingExplorationChallenge | null = null;
  const pc = r.pendingChallenge;
  if (pc && typeof pc === 'object' && typeof pc.regionId === 'string' && typeof pc.nodeId === 'string') {
    const def = explorationNodeDef(pc.regionId, pc.nodeId);
    if (def?.kind === 'terminal' && def.levelId && pc.levelId === def.levelId) {
      pendingChallenge = { regionId: pc.regionId, nodeId: pc.nodeId, eventId: String(pc.eventId || pc.nodeId), levelId: pc.levelId };
    }
  }
  return { version: 1, events, ruins, hidden, rewardsClaimed, discoveredRegions, pendingChallenge, archive, updatedAt: int(r.updatedAt, now) };
}

export function regionUnlocked(serverId: string, unlockedServers: string[]): boolean {
  if (serverId === 'training') return true;
  return unlockedServers.includes(serverId);
}

export function nodeState(state: ExplorationState, nodeId: string): 'available' | 'discovered' | 'completed' | 'locked' {
  const def = explorationNodeDef(nodeId.split(':')[1] || '', nodeId);
  if (!def) return 'locked';
  if (def.kind === 'signal') {
    const e = state.events[nodeId];
    return e?.status === 'completed' ? 'completed' : e ? 'discovered' : 'available';
  }
  if (def.kind === 'terminal') return state.events[nodeId]?.status === 'completed' ? 'completed' : 'available';
  if (def.kind === 'ruin') return state.ruins[nodeId] ? 'completed' : (state.events[nodeId] ? 'discovered' : 'available');
  if (def.kind === 'hidden') return state.hidden[nodeId] ? 'completed' : hiddenAvailable(state, def.regionId) ? 'available' : 'locked';
  return 'available';
}

export function regionCoreNodes(regionId: string): ExplorationNodeDef[] {
  return (regionMap.get(regionId)?.nodes || []).filter(n => n.kind !== 'hidden');
}

export function regionProgress(state: ExplorationState, regionId: string): { completed: number; total: number; pct: number } {
  const nodes = regionCoreNodes(regionId);
  const completed = nodes.filter(n => nodeState(state, n.id) === 'completed').length;
  return { completed, total: nodes.length, pct: nodes.length ? Math.round(completed / nodes.length * 100) : 0 };
}

export function regionCompleted(state: ExplorationState, regionId: string): boolean {
  const nodes = regionCoreNodes(regionId);
  return nodes.length > 0 && nodes.every(n => nodeState(state, n.id) === 'completed');
}

export function regionStatus(state: ExplorationState, regionId: string, unlockedServers: string[]): ExplorationRegionStatus {
  if (!regionUnlocked(regionId, unlockedServers)) return 'LOCKED';
  const nodes = regionCoreNodes(regionId);
  const completed = nodes.filter(n => nodeState(state, n.id) === 'completed').length;
  const discovered = nodes.some(n => nodeState(state, n.id) === 'discovered');
  if (completed === nodes.length && nodes.length > 0) return 'COMPLETED';
  if (discovered && completed < nodes.length) return 'ABNORMAL';
  if (completed > 0 || state.discoveredRegions.includes(regionId)) return 'EXPLORING';
  return 'AVAILABLE';
}

export function hiddenAvailable(state: ExplorationState, regionId: string): boolean {
  if (regionId !== 'training') return false;
  return regionCompleted(state, regionId) && !state.hidden['hidden:training:echo'];
}

export function discoverRegion(state: ExplorationState, regionId: string, now = Date.now()): { state: ExplorationState; changed: boolean } {
  const def = regionMap.get(regionId);
  if (!def) return { state, changed: false };
  const signal = def.nodes.find(n => n.kind === 'signal');
  if (!signal || state.events[signal.id]?.status === 'completed') {
    if (state.discoveredRegions.includes(regionId)) return { state, changed: false };
    return { state: { ...state, discoveredRegions: [...state.discoveredRegions, regionId], updatedAt: now }, changed: true };
  }
  if (state.events[signal.id]) return { state, changed: false };
  return {
    state: {
      ...state,
      discoveredRegions: state.discoveredRegions.includes(regionId) ? state.discoveredRegions : [...state.discoveredRegions, regionId],
      events: { ...state.events, [signal.id]: { status: 'discovered', discoveredAt: now, completedAt: null } },
      updatedAt: now,
    },
    changed: true,
  };
}

export interface ExploreResult {
  state: ExplorationState;
  changed: boolean;
  node?: ExplorationNodeDef;
  credits: number;
  miraXp: number;
  firstTime: boolean;
}

function rewardFor(state: ExplorationState, node: ExplorationNodeDef, now: number): { state: ExplorationState; firstTime: boolean } {
  if (state.rewardsClaimed.includes(node.id)) return { state, firstTime: false };
  return {
    state: {
      ...state,
      rewardsClaimed: [...state.rewardsClaimed, node.id].slice(-200),
      archive: [{ id: node.id, kind: node.kind, title: node.name, at: now }, ...state.archive].slice(0, 80),
      updatedAt: now,
    },
    firstTime: true,
  };
}

export function completeExploreNode(
  state: ExplorationState,
  regionId: string,
  nodeId: string,
  unlockedServers: string[],
  now = Date.now(),
): ExploreResult {
  const def = explorationNodeDef(regionId, nodeId);
  if (!def || !regionUnlocked(regionId, unlockedServers)) return { state, changed: false, credits: 0, miraXp: 0, firstTime: false };
  if (def.kind === 'terminal') return { state, changed: false, node: def, credits: 0, miraXp: 0, firstTime: false };
  if (def.kind === 'hidden' && !hiddenAvailable(state, regionId)) return { state, changed: false, node: def, credits: 0, miraXp: 0, firstTime: false };
  if (nodeState(state, nodeId) === 'completed') return { state, changed: false, node: def, credits: 0, miraXp: 0, firstTime: false };
  let next = state;
  if (def.kind === 'signal') {
    next = {
      ...next,
      events: { ...next.events, [nodeId]: { status: 'completed', discoveredAt: next.events[nodeId]?.discoveredAt || now, completedAt: now } },
      updatedAt: now,
    };
  } else if (def.kind === 'ruin') {
    next = { ...next, ruins: { ...next.ruins, [nodeId]: { discoveredAt: now, completedAt: now } }, updatedAt: now };
  } else if (def.kind === 'hidden') {
    next = {
      ...next,
      hidden: { ...next.hidden, [nodeId]: { id: nodeId, kind: 'hidden', title: def.name, at: now } },
      updatedAt: now,
    };
  }
  const rw = rewardFor(next, def, now);
  return { state: rw.state, changed: true, node: def, credits: def.credits, miraXp: def.miraXp, firstTime: rw.firstTime };
}

export function startTerminalChallenge(state: ExplorationState, regionId: string, nodeId: string, now = Date.now()): { state: ExplorationState; pending: PendingExplorationChallenge | null; node?: ExplorationNodeDef } {
  const def = explorationNodeDef(regionId, nodeId);
  if (!def || def.kind !== 'terminal' || !def.levelId) return { state, pending: null };
  const pending: PendingExplorationChallenge = { regionId, nodeId, eventId: nodeId, levelId: def.levelId };
  return { state: { ...state, pendingChallenge: pending, updatedAt: now }, pending, node: def };
}

export function completeTerminalChallenge(
  state: ExplorationState,
  levelId: string,
  success: boolean,
  now = Date.now(),
): ExploreResult {
  const pending = state.pendingChallenge;
  if (!pending || pending.levelId !== levelId) return { state, changed: false, credits: 0, miraXp: 0, firstTime: false };
  if (!success) return { state: { ...state, pendingChallenge: null, updatedAt: now }, changed: false, credits: 0, miraXp: 0, firstTime: false };
  const def = explorationNodeDef(pending.regionId, pending.nodeId);
  if (!def) return { state, changed: false, credits: 0, miraXp: 0, firstTime: false };
  let next: ExplorationState = {
    ...state,
    pendingChallenge: null,
    events: { ...state.events, [pending.nodeId]: { status: 'completed', discoveredAt: now, completedAt: now } },
    updatedAt: now,
  };
  const rw = rewardFor(next, def, now);
  return { state: rw.state, changed: true, node: def, credits: def.credits, miraXp: def.miraXp, firstTime: rw.firstTime };
}

export function explorationTotals(state: ExplorationState, unlockedServers: string[]): {
  regionsUnlocked: number; regionsCompleted: number; nodesCompleted: number; nodesTotal: number;
  ruinsCompleted: number; eventsCompleted: number; hiddenFound: number; pct: number;
} {
  let regionsUnlocked = 0, regionsCompleted = 0, nodesCompleted = 0, nodesTotal = 0;
  for (const r of regionDefs) {
    if (!regionUnlocked(r.id, unlockedServers)) { nodesTotal += regionCoreNodes(r.id).length; continue; }
    regionsUnlocked += 1;
    if (regionCompleted(state, r.id)) regionsCompleted += 1;
    const p = regionProgress(state, r.id);
    nodesCompleted += p.completed;
    nodesTotal += p.total;
  }
  return {
    regionsUnlocked, regionsCompleted, nodesCompleted, nodesTotal,
    ruinsCompleted: Object.keys(state.ruins).length,
    eventsCompleted: Object.values(state.events).filter(e => e.status === 'completed').length,
    hiddenFound: Object.keys(state.hidden).length,
    pct: nodesTotal ? Math.round(nodesCompleted / nodesTotal * 100) : 0,
  };
}

export function regionDangerLabel(danger: number): string {
  return danger >= 3 ? 'HIGH' : danger === 2 ? 'MEDIUM' : 'LOW';
}

export function regionCoordinates(serverId: string): { x: number; y: number; icon: string } {
  const s = SERVERS.find(x => x.id === serverId);
  return { x: s?.x || 0, y: s?.y || 0, icon: s?.icon || '◇' };
}

export function serverDefOf(serverId: string): ServerDef | undefined { return SERVERS.find(s => s.id === serverId); }
