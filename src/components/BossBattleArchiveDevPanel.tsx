import { useState } from 'react';
import {
  normalizeBossBattleArchiveStore, emptyBossBattleArchiveStore,
  type BossArchiveRecord, type BossBattleArchiveStore,
} from '../game/bossBattleArchive';
import { BOSS_ACHIEVEMENT_DEFINITIONS } from '../game/bossAchievementConfig';

const bossIds = ['gate-01', 'somnia', 'index-0', 'judgment-4', 'entropy', 'k0'];
const difficulties = ['easy', 'hard', 'expert'];
const results: ('victory' | 'defeat' | 'retreat')[] = ['victory', 'defeat', 'retreat'];
const grades = ['S', 'A', 'B', 'C', 'D'];

function demoAchievement(i: number) {
  const d = BOSS_ACHIEVEMENT_DEFINITIONS[i % BOSS_ACHIEVEMENT_DEFINITIONS.length];
  return {
    achievementId: d.id, name: d.name, description: d.description, category: d.category, level: d.level,
    hidden: d.hidden, icon: d.icon, reward: { ...d.reward, fragments: 0 }, unlockedAt: Date.now() - i * 1000,
    evidence: 'DEV 预览证据',
  };
}

function demoRecord(i: number, over: { result?: 'victory' | 'defeat' | 'retreat'; grade?: string | null; quality?: 'complete' | 'partial' | 'invalid' } = {}): BossArchiveRecord {
  const result = over.result || results[i % results.length];
  const grade = over.grade === undefined ? grades[i % grades.length] : over.grade;
  const quality = over.quality || (i % 7 === 0 ? 'partial' : 'complete');
  const now = 1_700_000_000_000 + i * 86_400_000;
  return {
    battleId: 'archive-demo-' + i, bossId: bossIds[i % bossIds.length],
    bossName: (bossIds[i % bossIds.length] || '').toUpperCase() + ' · DEV 档案',
    bossCodename: (bossIds[i % bossIds.length] || '').toUpperCase(),
    difficulty: difficulties[i % difficulties.length],
    difficultyLabel: difficulties[i % difficulties.length].toUpperCase(),
    result, startedAt: now - 120000, endedAt: now, archivedAt: now + 1000, durationMs: 120000,
    finalPhase: 3, phaseTotal: 3, consciousness: result === 'defeat' ? 0 : 55 + (i % 40), deaths: result === 'defeat' ? 1 : 0,
    failureReason: result === 'defeat' ? '意识完整度归零' : result === 'retreat' ? '玩家主动撤退' : '',
    fragmentTitle: '初始指令', fragmentStatus: result === 'victory' ? '已归位' : '未发放',
    fragmentGranted: result === 'victory' && i % 2 === 0, firstClear: i === 0, dataQuality: quality,
    stats: {
      challenge: { submitted: 6, judged: 5, passed: 4, failed: 1, invalid: 1, streak: 3 },
      combat: { warning: 5, hit: 1, blocked: 2, dodged: 2, cancelled: 1, interrupted: 1, damageTaken: 12, damageDealt: 120 },
      weakness: { discovered: 2, uniqueDiscovered: 2, cracked: 2, exposed: 1, damage: 18 },
      dynamic: { triggered: 1, success: 1, failed: 0, successRate: 100 },
      phases: { transitions: 2, completed: 3, maxPhase: 3, minConsciousness: 18 },
      deaths: 0,
      phaseRows: [
        { phaseId: 'p1', label: '阶段 1', durationMs: 30000, damageTaken: 5, attackCount: 2, challengeSuccess: 1, challengeFailed: 0, weaknessDiscoveries: 1, weaknessCracks: 1, endState: 'completed' },
        { phaseId: 'p2', label: '阶段 2', durationMs: 90000, damageTaken: 7, attackCount: 3, challengeSuccess: 2, challengeFailed: 1, weaknessDiscoveries: 1, weaknessCracks: 1, endState: 'victory' },
      ],
    },
    rating: result === 'victory' && grade ? {
      grade, displayScore: grade === 'S' ? 96 : grade === 'A' ? 85 : grade === 'B' ? 75 : grade === 'C' ? 65 : 50,
      totalScore: 80, finalized: quality === 'complete', dataQuality: quality, ratingVersion: 'v1.0.0',
      dimensions: [
        { key: 'survival', label: '生存表现', score: 20, maxScore: 25, weight: 25, effectiveWeight: 0.25, availability: 'available', available: true, reason: 'DEV' },
      ],
      reasons: ['DEV 预览评分'], highlights: [], weaknesses: [],
    } : null,
    reward: {
      available: result === 'victory', granted: result === 'victory', xp: result === 'victory' ? 75 : null,
      contribution: result === 'victory' ? 52 : null, credits: result === 'victory' ? 52 : null, fragments: 0,
      baseXp: 150, difficultyXp: 0, performanceXp: 45, specialXp: 30, fullXp: 225, legacyXp: 150,
      rewardId: 'boss-reward:archive-demo-' + i + ':v1.0.0', grantedAt: result === 'victory' ? now + 1000 : null,
      fragmentTitle: '初始指令', fragmentStatus: result === 'victory' ? '已归位' : '未发放',
    },
    achievements: result === 'victory' ? [demoAchievement(i)] : [],
    strengths: ['DEV 预览亮点'], improvements: ['DEV 预览改进'], timeline: [{ offsetMs: 0, label: '战斗开始', kind: 'battle-started' }, { offsetMs: 60000, label: '阶段转换', kind: 'phase-transition' }],
    archiveVersion: 'v1.0.0',
  };
}

function storeFrom(records: unknown[]): BossBattleArchiveStore {
  return normalizeBossBattleArchiveStore({ records, archivedBattleIds: records.map((r: any) => r?.battleId).filter(Boolean), bossTotals: {}, difficultyTotals: {}, updatedAt: Date.now() });
}

/** 仅 DEV：归档预览、状态与损坏数据验证；全部为内存数据 */
export default function BossBattleArchiveDevPanel({ store, onPreview }: { store: BossBattleArchiveStore; onPreview: (s: BossBattleArchiveStore | null) => void }) {
  const [msg, setMsg] = useState('');
  const set = (records: unknown[], label: string) => {
    onPreview(storeFrom(records));
    setMsg('已加载 DEV 归档预览：' + label + '（不写入存档）。');
  };
  const exportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'NEXUS_Archive_DEV.json'; a.click(); URL.revokeObjectURL(url);
      setMsg('已导出当前归档 JSON。');
    } catch { setMsg('导出失败。'); }
  };
  return (
    <div className="dev-archive-panel">
      <div className="panel-title">DEV · 战斗归档预览<span className="panel-tag">内存 / 只读</span></div>
      <div className="dev-settlement-buttons">
        <button className="nxbtn small" onClick={() => { onPreview(null); setMsg('已恢复正式归档。'); }}>正式归档</button>
        <button className="nxbtn small" onClick={() => set([], 'Empty')}>Empty</button>
        <button className="nxbtn small" onClick={() => set([demoRecord(0)], '1 Record')}>1</button>
        <button className="nxbtn small" onClick={() => set(Array.from({ length: 10 }, (_, i) => demoRecord(i)), '10 Records')}>10</button>
        <button className="nxbtn small" onClick={() => set(Array.from({ length: 200 }, (_, i) => demoRecord(i)), '200 Records')}>200</button>
        <button className="nxbtn small" onClick={() => set(Array.from({ length: 205 }, (_, i) => demoRecord(i)), 'Overflow')}>Overflow</button>
        <button className="nxbtn small" onClick={() => set([demoRecord(0, { result: 'victory', grade: 'S' }), demoRecord(1, { result: 'defeat', grade: null }), demoRecord(2, { result: 'retreat', grade: null }), demoRecord(3, { result: 'victory', grade: 'D', quality: 'partial' }), null, { battleId: 'bad' }], 'Mixed / Corrupt')}>Corrupt</button>
        <button className="nxbtn small ghost" onClick={exportJson}>导出 JSON</button>
      </div>
      <div className="dev-stats-grid">
        <span>记录：<b>{store.records.length}</b></span>
        <span>已归档 ID：<b>{store.archivedBattleIds.length}</b></span>
        <span>总场次：<b>{store.totals.totalBattles}</b></span>
        <span>胜率：<b>{store.totals.victories + store.totals.defeats > 0 ? Math.round((store.totals.victories / (store.totals.victories + store.totals.defeats)) * 100) + '%' : 'N/A'}</b></span>
      </div>
      {msg && <div className="dev-phase-msg">{msg}</div>}
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>DEV 预览仅存在页面内存；不修改存档、奖励、成就或正式战斗数据。生产构建中不可见。</div>
    </div>
  );
}
