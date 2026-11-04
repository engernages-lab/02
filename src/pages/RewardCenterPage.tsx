import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';
import {
  SHOP_ITEMS, MEMORY_ARCHIVES, normalizeRewards, trustTier, unlockedArchives,
  type ShopCategory, type ShopItem,
} from '../game/rewards';
import { MEMORY_FRAGMENTS } from '../game/story';

const CATS: { id: ShopCategory; name: string; icon: string }[] = [
  { id: 'look', name: '外观奖励', icon: '▤' },
  { id: 'tool', name: '实用道具', icon: '⌖' },
  { id: 'special', name: '特殊奖励', icon: '✦' },
];

export default function RewardCenterPage() {
  const g = useGame();
  const rw = normalizeRewards(g.player.rewards);
  const [tab, setTab] = useState<ShopCategory | 'archive'>('look');
  const [msg, setMsg] = useState<string>('');
  const [openArchive, setOpenArchive] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  const tier = trustTier(rw.trust);
  const fragments = g.player.meta.memoryFragments;
  const archives = unlockedArchives(fragments.length);

  const owned = (item: ShopItem) => {
    if (item.unique) {
      return rw.skins.includes(item.id) || (!!item.flag && g.player.progress.flags[item.flag] === true);
    }
    return false;
  };
  const equipped = (item: ShopItem) => !!item.slot && rw.equipped[item.slot] === item.id;

  const buy = (item: ShopItem) => {
    const res = g.buyShopItem(item.id);
    if (!res.ok) { setMsg(res.reason || '兑换失败'); play('deny'); return; }
    setMsg('兑换成功：' + item.name);
    setJustBought(item.id);
    window.setTimeout(() => setJustBought(null), 900);
  };

  return (
    <div className="page page-anim page-inner" style={{ padding: '14px 18px' }}>
      <div className="hud" style={{ marginBottom: 12 }}>
        <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
        <div>
          <div className="hud-title">奖励兑换中心 · REWARD NEXUS</div>
          <div className="hud-sub">用修复贡献点兑换外观、道具与特殊奖励。外观与道具不影响关卡判题难度。</div>
        </div>
        <div className="hud-spacer" />
        <span className="hud-chip gold">◈ 贡献点 {rw.credits}</span>
        <span className="hud-chip cyan">信任度 {rw.trust} · {tier.name}</span>
        <span className="hud-chip">碎片 {fragments.length}</span>
      </div>

      {/* 信任度条 */}
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-title">MIRA 信任度<span className="panel-tag">{tier.name}</span></div>
        <div className="trust-bar">
          <div className="trust-fill" style={{ width: rw.trust + '%' }} />
        </div>
        <div className="dim" style={{ fontSize: 12.5, marginTop: 6 }}>{tier.desc}</div>
      </div>

      {/* 分类标签 */}
      <div className="shop-tabs">
        {CATS.map(c => (
          <button key={c.id} className={'shop-tab' + (tab === c.id ? ' on' : '')} onClick={() => { play('click'); setTab(c.id); }}>
            <span>{c.icon}</span> {c.name}
          </button>
        ))}
        <button className={'shop-tab' + (tab === 'archive' ? ' on' : '')} onClick={() => { play('click'); setTab('archive'); }}>
          <span>▣</span> 记忆档案
        </button>
      </div>

      {msg && <div className="result-banner ok" style={{ marginBottom: 10 }}>{msg}</div>}

      {tab !== 'archive' && (
        <div className="shop-grid">
          {SHOP_ITEMS.filter(i => i.category === tab).map(item => {
            const isOwned = owned(item);
            const canBuy = rw.credits >= item.price && !isOwned;
            const stock = rw.items[item.id] || 0;
            return (
              <div key={item.id} className={'shop-card' + (isOwned ? ' owned' : '') + (justBought === item.id ? ' just-bought' : '')}>
                <div className="shop-ico">{item.icon}</div>
                <div className="shop-name">{item.name}</div>
                <div className="shop-desc">{item.desc}</div>
                <div className="shop-foot">
                  {isOwned ? (
                    item.slot ? (
                      <button className="nxbtn small" disabled={equipped(item)} onClick={() => { const r = g.equipItem(item.id); if (!r.ok) setMsg(r.reason || ''); else setMsg('已装备：' + item.name); }}>
                        {equipped(item) ? '使用中' : '装备'}
                      </button>
                    ) : <span className="chip green">已解锁</span>
                  ) : (
                    <button className="nxbtn small primary" disabled={!canBuy} onClick={() => buy(item)}>
                      ◈ {item.price}
                    </button>
                  )}
                  {item.count ? <span className="chip">库存 ×{stock}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'archive' && (
        <div className="panel">
          <div className="panel-title">记忆档案<span className="panel-tag">碎片 {fragments.length} / {MEMORY_FRAGMENTS.length}</span></div>
          <div className="dim" style={{ fontSize: 12.5, marginBottom: 10 }}>
            收集记忆碎片可解锁档案；未解锁的档案会显示所需碎片数量。
          </div>
          {MEMORY_ARCHIVES.map(a => {
            const open = archives.some(x => x.id === a.id);
            const read = rw.archiveRead.includes(a.id);
            return (
              <div key={a.id} className={'archive-row' + (open ? '' : ' locked')}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: open ? '#BFE8F5' : '#4A6E85' }}>
                    {open ? a.title : '▣ 未解锁档案（需要 ' + a.need + ' 个碎片）'}
                    {read && <span className="chip green" style={{ marginLeft: 8 }}>已读</span>}
                  </div>
                  {open && (
                    <div className="dim" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.7 }}>
                      {openArchive === a.id ? a.content : a.content.slice(0, 42) + '……'}
                    </div>
                  )}
                </div>
                {open && (
                  <button className="nxbtn small ghost" onClick={() => {
                    play('click');
                    if (openArchive === a.id) { setOpenArchive(null); } else { setOpenArchive(a.id); g.markArchiveRead(a.id); }
                  }}>
                    {openArchive === a.id ? '收起' : '阅读'}
                  </button>
                )}
              </div>
            );
          })}
          <div className="panel-title" style={{ marginTop: 14 }}>已收集碎片</div>
          <div>
            {MEMORY_FRAGMENTS.map(f => {
              const has = fragments.includes(f.id);
              return (
                <span key={f.id} className={'chip ' + (has ? 'cyan' : 'dim')} style={{ marginRight: 6, marginBottom: 6 }} title={has ? f.content : '未收集'}>
                  {has ? f.title : '？ ? 未收集'}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
