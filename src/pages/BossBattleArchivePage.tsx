import { useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import { BOSSES } from '../game/bosses';
import { BOSS_DIFFICULTIES } from '../game/difficulty';
import {
  archiveRecordToSettlementData, archiveStatsExportJson, buildAchievementHistory, buildArchiveAnalytics,
  emptyBossBattleArchiveStore, normalizeBossBattleArchiveStore, queryBossBattleArchive,
  type ArchiveSort, type BossArchiveRecord, type BossBattleArchiveStore,
} from '../game/bossBattleArchive';
import BossBattleSettlement from '../components/BossBattleSettlement';
import BossBattleArchiveDevPanel from '../components/BossBattleArchiveDevPanel';
import { devToolsOn } from '../game/devMode';

const fmtNum = (v: number | null | undefined, suffix = '') => (v == null || !Number.isFinite(v) ? 'N/A' : String(Math.round(v * 10) / 10) + suffix);
const fmtPct = (v: number | null | undefined) => (v == null ? 'N/A' : (Math.round(v * 1000) / 10) + '%');
const fmtTime = (ms: number | null | undefined) => {
  if (ms == null || !Number.isFinite(ms)) return 'N/A';
  const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const fmtDate = (t: number | null | undefined) => (t ? new Date(t).toLocaleDateString() : 'N/A');
const qualityLabel: Record<string, string> = { complete: 'COMPLETE', partial: 'PARTIAL DATA', invalid: 'INVALID', missing: 'LEGACY RECORD' };
const resultLabel: Record<string, string> = { victory: 'VICTORY', defeat: 'SYSTEM FAILURE', retreat: 'MISSION ABORTED' };

export default function BossBattleArchivePage() {
  const g = useGame();
  const player = g.player;
  const actual = player.progress.bossBattleArchive || emptyBossBattleArchiveStore();
  const [preview, setPreview] = useState<BossBattleArchiveStore | null>(null);
  const store = preview || actual;
  const [search, setSearch] = useState('');
  const [bossFilter, setBossFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [achFilter, setAchFilter] = useState('all');
  const [sort, setSort] = useState<ArchiveSort>('newest');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<BossArchiveRecord | null>(null);
  const [achCategory, setAchCategory] = useState('all');
  const [achLevel, setAchLevel] = useState('all');
  const [achSort, setAchSort] = useState<'newest' | 'oldest'>('newest');

  const analytics = useMemo(() => buildArchiveAnalytics(store, player), [store, player]);
  const query = useMemo(() => queryBossBattleArchive(store, {
    search, bossId: bossFilter, difficulty: diffFilter, result: resultFilter, grade: gradeFilter,
    achievement: achFilter, sort, page, pageSize: 12,
  }), [store, search, bossFilter, diffFilter, resultFilter, gradeFilter, achFilter, sort, page]);
  const achievements = useMemo(() => buildAchievementHistory(player, {
    category: achCategory, level: achLevel, bossId: bossFilter, sort: achSort,
  }), [player, achCategory, achLevel, bossFilter, achSort]);
  const detailData = useMemo(() => detail ? archiveRecordToSettlementData(detail) : null, [detail]);

  const setFilter = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };
  const download = (name: string, data: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };
  const bossName = (id: string) => BOSSES.find(b => b.id === id)?.codename || id.toUpperCase();
  const trend = analytics.ratingTrend;
  const trendMax = 100;
  const trendPoints = trend.length > 1
    ? trend.map((p, i) => `${(i / (trend.length - 1)) * 100},${100 - (p.score / trendMax) * 100}`).join(' ')
    : '';

  return (
    <div className="page page-anim archive-page">
      <div className="archive-head">
        <div>
          <div className="archive-kicker">NEXUS COMBAT ARCHIVE</div>
          <h1>战斗档案馆</h1>
          <div className="dim">历史战斗、评分与隐藏成就的长期表现档案</div>
        </div>
        <div className="archive-head-actions">
          <button className="nxbtn small ghost" onClick={() => download('NEXUS_Player_Statistics.json', archiveStatsExportJson(store, player))}>导出战绩 JSON</button>
          <button className="nxbtn small" onClick={() => g.nav('menu')}>返回主菜单</button>
        </div>
      </div>

      {devToolsOn() && <BossBattleArchiveDevPanel store={store} onPreview={setPreview} />}

      <div className="archive-stat-grid">
        <div className="archive-stat"><span>TOTAL BATTLES</span><b>{store.totals.totalBattles}</b></div>
        <div className="archive-stat"><span>VICTORIES</span><b className="ok">{store.totals.victories}</b></div>
        <div className="archive-stat"><span>DEFEATS</span><b className="bad">{store.totals.defeats}</b></div>
        <div className="archive-stat"><span>RETREATS</span><b className="warn">{store.totals.retreats}</b></div>
        <div className="archive-stat"><span>WIN RATE</span><b>{fmtPct(analytics.winRate)}</b></div>
        <div className="archive-stat"><span>BEST RANK</span><b className="gold">{analytics.bestGrade || 'N/A'}</b><em>{analytics.bestScore == null ? 'N/A' : analytics.bestScore + ' / 100'}</em></div>
        <div className="archive-stat"><span>AVERAGE SCORE</span><b>{fmtNum(analytics.averageScore)}</b></div>
        <div className="archive-stat"><span>BEST STREAK</span><b>{store.totals.bestWinStreak}</b></div>
      </div>

      <div className="archive-grid-2">
        <section className="archive-panel">
          <div className="archive-panel-title">评分趋势<span>RATING TREND · 最近 {trend.length} 场</span></div>
          {trend.length > 1 ? (
            <svg className="archive-trend" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={trendPoints} fill="none" stroke="#42D6D0" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
              {trend.map((p, i) => <circle key={p.battleId} cx={(i / (trend.length - 1)) * 100} cy={100 - (p.score / trendMax) * 100} r="1.4" fill="#FFD75E" />)}
            </svg>
          ) : <div className="archive-empty">数据不足（至少需要 2 场正式评分）</div>}
          <div className="archive-trend-labels"><span>较早</span><span>最近</span></div>
        </section>
        <section className="archive-panel">
          <div className="archive-panel-title">评级分布<span>GRADE DISTRIBUTION</span></div>
          <div className="archive-grade-bars">
            {(['S', 'A', 'B', 'C', 'D'] as const).map(g => {
              const max = Math.max(1, ...Object.values(analytics.gradeCounts));
              return <div className="archive-grade-row" key={g}><span>{g}</span><i><em className={'grade-' + g} style={{ width: (analytics.gradeCounts[g] / max) * 100 + '%' }} /></i><b>{analytics.gradeCounts[g]}</b></div>;
            })}
            <div className="archive-grade-row"><span>—</span><i><em className="grade-unrated" style={{ width: store.totals.totalBattles ? (analytics.unratedBattles / Math.max(1, store.totals.totalBattles)) * 100 + '%' : '0%' }} /></i><b>{analytics.unratedBattles}</b></div>
          </div>
          <div className="archive-mini-title">最近胜率</div>
          <div className="archive-winrates">{analytics.recentWinRates.map(x => <span key={x.key}>{x.label}<b>{fmtPct(x.rate)}</b><em>{x.sample} 场</em></span>)}</div>
        </section>
      </div>

      <div className="archive-grid-2">
        <section className="archive-panel">
          <div className="archive-panel-title">难度表现<span>DIFFICULTY</span></div>
          <div className="archive-table">
            <div className="archive-table-row head"><span>难度</span><span>挑战</span><span>胜率</span><span>平均分</span></div>
            {analytics.difficulties.map(d => <div className="archive-table-row" key={d.difficulty}><span>{d.label}</span><span>{d.attempts}</span><span>{fmtPct(d.winRate)}</span><span>{fmtNum(d.averageScore)}</span></div>)}
          </div>
        </section>
        <section className="archive-panel">
          <div className="archive-panel-title">Boss 表现<span>BOSS COMPARISON</span></div>
          <div className="archive-table">
            <div className="archive-table-row head"><span>Boss</span><span>挑战</span><span>胜率</span><span>最佳</span></div>
            {analytics.bosses.map(b => <div className="archive-table-row" key={b.bossId}><span>{b.bossName}</span><span>{b.attempts}</span><span>{fmtPct(b.winRate)}</span><span>{b.bestScore ?? 'N/A'}</span></div>)}
          </div>
        </section>
      </div>

      <section className="archive-panel" id="archive-history">
        <div className="archive-panel-title">战斗历史<span>BATTLE HISTORY · {query.total} 条</span></div>
        <div className="archive-filters">
          <input className="archive-search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="搜索 Boss 名称 / Boss ID / battleId" />
          <select value={bossFilter} onChange={e => setFilter(setBossFilter)(e.target.value)}><option value="all">全部 Boss</option>{BOSSES.map(b => <option key={b.id} value={b.id}>{b.codename}</option>)}</select>
          <select value={diffFilter} onChange={e => setFilter(setDiffFilter)(e.target.value)}><option value="all">全部难度</option>{BOSS_DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
          <select value={resultFilter} onChange={e => setFilter(setResultFilter)(e.target.value)}><option value="all">全部结果</option><option value="victory">Victory</option><option value="defeat">Defeat</option><option value="retreat">Retreat</option></select>
          <select value={gradeFilter} onChange={e => setFilter(setGradeFilter)(e.target.value)}><option value="all">全部评级</option>{['S', 'A', 'B', 'C', 'D'].map(g => <option key={g} value={g}>{g}</option>)}<option value="unrated">无评级</option></select>
          <select value={achFilter} onChange={e => setFilter(setAchFilter)(e.target.value)}><option value="all">全部成就</option><option value="unlocked">有成就</option><option value="none">无成就</option></select>
          <select value={sort} onChange={e => { setSort(e.target.value as ArchiveSort); setPage(1); }}><option value="newest">最新战斗</option><option value="oldest">最早战斗</option><option value="best">最高评分</option><option value="worst">最低评分</option><option value="fastest">最快通关</option><option value="longest">最长战斗</option></select>
        </div>
        {query.records.length === 0 ? <div className="archive-empty">暂无符合条件的战斗记录。</div> : (
          <div className="archive-cards">
            {query.records.map(r => (
              <button key={r.battleId} className={'archive-card result-' + r.result} onClick={() => setDetail(r)}>
                <span className="ac-top"><b>{r.bossCodename}</b><span>{r.difficultyLabel}</span><span className={'ac-quality q-' + r.dataQuality}>{qualityLabel[r.dataQuality] || r.dataQuality}</span></span>
                <span className="ac-result">{resultLabel[r.result]}</span>
                <span className="ac-rating">{r.rating?.grade ? <><b className={'grade-' + r.rating.grade}>{r.rating.grade}</b> {r.rating.displayScore ?? '—'} / 100</> : 'NO OFFICIAL RATING'}</span>
                <span className="ac-meta"><span>{r.endedAt ? new Date(r.endedAt).toLocaleString() : 'N/A'}</span><span>{fmtTime(r.durationMs)}</span></span>
                <span className="ac-badges">{r.firstClear && <em className="gold">FIRST CLEAR</em>}{r.achievements.length > 0 && <em>{r.achievements.length} ACHIEVEMENTS</em>}{r.fragmentGranted && <em>FRAGMENT</em>}</span>
              </button>
            ))}
          </div>
        )}
        <div className="archive-pager">
          <button className="nxbtn small ghost" disabled={query.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</button>
          <span>{query.page} / {query.pages}</span>
          <button className="nxbtn small ghost" disabled={query.page >= query.pages} onClick={() => setPage(p => Math.min(query.pages, p + 1))}>下一页</button>
        </div>
      </section>

      <section className="archive-panel">
        <div className="archive-panel-title">Boss 专属档案<span>BOSS PROFILE</span></div>
        <div className="archive-boss-grid">
          {analytics.bosses.map(b => {
            const bt = store.bossTotals[b.bossId];
            return (
              <button key={b.bossId} className="archive-boss-card" onClick={() => { setBossFilter(b.bossId); setPage(1); document.getElementById('archive-history')?.scrollIntoView({ behavior: 'smooth' }); }}>
                <b>{b.bossName}</b>
                <span>挑战 {b.attempts} · 胜 {b.victories} · 胜率 {fmtPct(b.winRate)}</span>
                <span>最佳 {b.bestScore ?? 'N/A'} · 平均 {fmtNum(b.averageScore)}</span>
                <span>最快通关 {fmtTime(bt?.fastestVictory)} · 首胜 {bt?.firstVictoryDifficulty ? bt.firstVictoryDifficulty.toUpperCase() : 'N/A'}</span>
              </button>
            );
          })}
          {analytics.bosses.length === 0 && <div className="archive-empty">暂无 Boss 档案。</div>}
        </div>
      </section>

      <section className="archive-panel">
        <div className="archive-panel-title">成就历史<span>ACHIEVEMENT HISTORY</span></div>
        <div className="archive-filters compact">
          <select value={achCategory} onChange={e => setAchCategory(e.target.value)}><option value="all">全部分类</option>{['survival', 'challenge', 'tactics', 'weakness', 'crisis', 'combat'].map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select value={achLevel} onChange={e => setAchLevel(e.target.value)}><option value="all">全部等级</option>{['Bronze', 'Silver', 'Gold', 'Platinum'].map(l => <option key={l} value={l}>{l}</option>)}</select>
          <select value={achSort} onChange={e => setAchSort(e.target.value as 'newest' | 'oldest')}><option value="newest">最新解锁</option><option value="oldest">最早解锁</option></select>
        </div>
        {achievements.length === 0 ? <div className="archive-empty">暂无已解锁成就。</div> : (
          <div className="archive-ach-list">
            {achievements.map(a => (
              <div className="archive-ach-item" key={a.achievementId}>
                <b>{a.name}</b><span>{a.level} · {bossName(a.bossId)} · {new Date(a.unlockedAt).toLocaleDateString()}</span>
                <em>{a.description}</em>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && detailData && (
        <BossBattleSettlement data={detailData} historical onClose={() => setDetail(null)} onExport={() => download('NEXUS_Battle_Archive_' + detail.battleId + '.json', JSON.stringify(detail, null, 2))} />
      )}
    </div>
  );
}
