import { useGame } from '../store/gameStore';
import { milestone, titleForLevel, toleranceFor } from '../game/progression';
import { levelsOfServer, levelById } from '../game/levels';
import { KNOWLEDGE, knowledgeById } from '../game/knowledge';
import { ACHIEVEMENTS } from '../game/achievements';
import { MEMORY_FRAGMENTS } from '../game/story';
import PlayerStatus from '../components/PlayerStatus';
import { play } from '../services/sound';

export default function ProfilePage() {
  const g = useGame();
  const p = g.player;
  const ms = milestone(p.exp);

  const allLevels = levelsOfServer('training')
    .concat(levelsOfServer('syntax'), levelsOfServer('logs'), levelsOfServer('storage'), levelsOfServer('factory'), levelsOfServer('diag'), levelsOfServer('core'));
  const totalStars = allLevels.reduce((s, l) => s + (p.progress.stars[l.id] || 0), 0);

  return (
    <div className="page page-anim">
      <div className="page-inner">
        <div className="hud">
          <div>
            <div className="hud-title">玩家档案</div>
            <div className="hud-sub">R-07 修复师数据总览</div>
          </div>
          <div className="hud-spacer" />
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 返回</button>
        </div>

        <div className="pf-grid">
          <div className="panel">
            <div className="panel-title">身份信息</div>
            <PlayerStatus />
            <div className="pf-kv" style={{ marginTop: 8 }}><span className="k">修复师称号</span><span className="v">{titleForLevel(p.level)}</span></div>
            <div className="pf-kv"><span className="k">累计经验</span><span className="v">{p.exp}（{ms.maxed ? 'MAX' : '距 Lv.' + (ms.level + 1) + ' 还差 ' + Math.max(0, ms.need - ms.into) + ' 经验'}）</span></div>
            <div className="pf-kv"><span className="k">当前容错次数</span><span className="v">{toleranceFor(p.level)} 次 / 关</span></div>
          </div>

          <div className="panel">
            <div className="panel-title">修复进度</div>
            {allLevels.map(l => {
              const done = p.progress.completedLevels.includes(l.id);
              const stars = p.progress.stars[l.id] || 0;
              const name = levelById(l.id);
              return (
                <div className="pf-kv" key={l.id}>
                  <span className="k">{l.codename} {name?.title}</span>
                  <span className="v">{done ? '★'.repeat(stars) + ' 已修复' : '待修复'}</span>
                </div>
              );
            })}
            <div className="pf-kv"><span className="k">累计星级</span><span className="v">{totalStars} / {allLevels.length * 3}</span></div>
            <div className="pf-kv"><span className="k">已解锁服务器</span><span className="v">{p.progress.unlockedServers.length} 个</span></div>
          </div>

          <div className="panel">
            <div className="panel-title">意识记录</div>
            <div className="pf-kv"><span className="k">意识完整度</span><span className="v">{p.consciousness}%</span></div>
            <div className="pf-kv"><span className="k">累计死亡次数</span><span className="v">{p.meta.deaths}</span></div>
            <div className="pf-kv"><span className="k">意识重组次数</span><span className="v">{p.meta.rebirths}</span></div>
            <div className="pf-kv"><span className="k">最近死亡关卡</span><span className="v">{p.meta.lastDeathLevel ? levelById(p.meta.lastDeathLevel)?.title || p.meta.lastDeathLevel : '无记录'}</span></div>
            <div className="pf-kv"><span className="k">最近死亡原因</span><span className="v">{p.meta.lastDeathReason || '无记录'}</span></div>
            <div className="pf-kv"><span className="k">意识备份等级</span><span className="v">ORIGIN-v{p.meta.backupLevel}</span></div>
          </div>

          <div className="panel">
            <div className="panel-title">知识掌握</div>
            <div className="pf-kv"><span className="k">已收集知识卡片</span><span className="v">{p.progress.knowledge.length} / {KNOWLEDGE.length}</span></div>
            <div style={{ marginTop: 8 }}>
              {KNOWLEDGE.map(k => (
                <span key={k.id} className={'chip know-chip' + (p.progress.knowledge.includes(k.id) ? ' cyan' : ' dim')}>{k.title}</span>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">成就</div>
            <div className="pf-kv"><span className="k">已解锁</span><span className="v">{p.progress.achievements.length} / {ACHIEVEMENTS.length}</span></div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ACHIEVEMENTS.filter(a => p.progress.achievements.includes(a.id)).map(a => (
                <span key={a.id} className="chip orange">{a.icon} {a.name}</span>
              ))}
              {p.progress.achievements.length === 0 && <span className="dim" style={{ fontSize: 13 }}>还没有成就。去完成第一次修复吧。</span>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">创世主记忆碎片<span className="panel-tag">已收集 {p.meta.memoryFragments.length}</span></div>
            {MEMORY_FRAGMENTS.map(f => p.meta.memoryFragments.includes(f.id) ? (
              <div className="frag-card" key={f.id}>
                <div className="fc-title">◇ {f.title}</div>
                <div className="fc-body">{f.content}</div>
              </div>
            ) : (
              <div className="empty-hint" key={f.id} style={{ padding: '18px 0', fontSize: 12.5 }}>？？？ —— 尚未发现（提示：与重生次数有关）</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
