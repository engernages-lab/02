import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';
import { normalizeRewards, trustTier, unlockedArchives, MEMORY_ARCHIVES } from '../game/rewards';
import {
  SHOP_ITEMS, CATEGORY_META, RARITY_META, buyStateOf, maxOwnOf, BUY_STATE_TEXT,
  type ShopItem, type Rarity, type ShopCategory,
} from '../game/shop';
import { MEMORY_FRAGMENTS } from '../game/story';

type Tab = 'shop' | 'bag' | 'history' | 'archive';
type BagFilter = 'all' | 'consumable' | 'equipment' | 'look' | 'special';

const TABS: { id: Tab; name: string; icon: string }[] = [
  { id: 'shop', name: '兑换商城', icon: '◈' },
  { id: 'bag', name: '我的背包', icon: '▤' },
  { id: 'history', name: '交易记录', icon: '▦' },
  { id: 'archive', name: '记忆档案', icon: '▣' },
];

const BAG_FILTERS: { id: BagFilter; name: string }[] = [
  { id: 'all', name: '全部' },
  { id: 'consumable', name: '消耗品' },
  { id: 'equipment', name: '装备' },
  { id: 'look', name: '外观' },
  { id: 'special', name: '特殊' },
];

const rarityClass = (r: Rarity) => 'r-' + r;

function timeText(ts: number): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

export default function RewardCenterPage() {
  const g = useGame();
  const rw = normalizeRewards(g.player.rewards);
  const [tab, setTab] = useState<Tab>('shop');
  const [cat, setCat] = useState<ShopCategory | 'all'>('all');
  const [bagFilter, setBagFilter] = useState<BagFilter>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [confirm, setConfirm] = useState<{ itemId: string; qty: number; requestId: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [msgTone, setMsgTone] = useState<'ok' | 'warn'>('ok');
  const [justBought, setJustBought] = useState<string | null>(null);
  const [openArchive, setOpenArchive] = useState<string | null>(null);
  const reqSeq = useRef(0);

  const tier = trustTier(rw.trust);
  const fragments = g.player.meta.memoryFragments;
  const archives = unlockedArchives(fragments.length);
  const detail = detailId ? SHOP_ITEMS.find(i => i.id === detailId) || null : null;

  const bagEntries = useMemo(() => SHOP_ITEMS.filter(i => {
    if (i.kind === 'consumable' || i.count) return (rw.items[i.id] || 0) > 0;
    if (i.equippable) return rw.skins.includes(i.id);
    if (i.flag) return g.player.progress.flags[i.flag] === true;
    return false;
  }), [rw.items, rw.skins, g.player.progress.flags]);

  const filteredBag = bagEntries.filter(i => {
    if (bagFilter === 'all') return true;
    if (bagFilter === 'consumable') return i.kind === 'consumable' || i.kind === 'boost';
    if (bagFilter === 'equipment') return i.equippable === true;
    if (bagFilter === 'look') return i.type === 'look';
    return i.type === 'special' || i.flag;
  });

  const bagCount = bagEntries.reduce((a, i) => a + ((rw.items[i.id] || 0) || (i.equippable || i.flag ? 1 : 0)), 0);

  const stateOf = (item: ShopItem, qtyArg = 1) => buyStateOf(item, {
    credits: rw.credits,
    purchases: rw.purchases[item.id] || 0,
    ownedSkins: rw.skins,
    flags: g.player.progress.flags,
    qty: qtyArg,
  });

  const equippedOf = (item: ShopItem) => !!item.slot && rw.equipped[item.slot] === item.id;

  const openDetail = (item: ShopItem) => {
    play('click');
    setDetailId(item.id);
    setQty(1);
    setConfirm(null);
  };

  const beginConfirm = (item: ShopItem) => {
    const max = Math.max(1, Math.min(99, maxOwnOf(item) - (rw.purchases[item.id] || 0)));
    const n = Math.max(1, Math.min(qty, max));
    reqSeq.current += 1;
    setConfirm({
      itemId: item.id,
      qty: n,
      requestId: 'rq-' + Date.now().toString(36) + '-' + reqSeq.current + '-' + Math.random().toString(36).slice(2, 6),
    });
    play('click');
  };

  const doPurchase = () => {
    if (!confirm) return;
    const item = SHOP_ITEMS.find(i => i.id === confirm.itemId);
    if (!item) return;
    const res = g.purchaseShopItem(item.id, confirm.qty, confirm.requestId);
    if (!res.ok) {
      setMsgTone('warn');
      setMsg('购买失败：' + (res.reason || '未知原因'));
      setConfirm(null);
      return;
    }
    setMsgTone('ok');
    setMsg('交易完成：' + item.name + ' ×' + confirm.qty + '（-' + (item.price * confirm.qty) + ' 贡献点）');
    setJustBought(item.id);
    setConfirm(null);
    window.setTimeout(() => setJustBought(null), 1200);
  };

  const useOrEquip = (item: ShopItem) => {
    if (equippedOf(item)) {
      const r = g.unequipItem(item.slot!);
      if (!r.ok) { setMsgTone('warn'); setMsg(r.reason || '卸下失败'); return; }
      setMsgTone('ok'); setMsg('已卸下：' + item.name); return;
    }
    if (item.equippable) {
      const r = g.equipItem(item.id);
      if (!r.ok) { setMsgTone('warn'); setMsg(r.reason || '装备失败'); return; }
      setMsgTone('ok'); setMsg('已装备：' + item.name); return;
    }
    if (item.usable) {
      const r = g.useShopItem(item.id);
      if (!r.ok) { setMsgTone('warn'); setMsg(r.reason || '无法使用'); return; }
      setMsgTone('ok'); setMsg(r.message || ('已使用：' + item.name)); return;
    }
    if (item.flag) { setMsgTone('ok'); setMsg('该物品为永久权益，已自动生效'); return; }
    setMsgTone('warn');
    setMsg(item.id === 'decoder' ? '请在「记忆档案」中使用解码器' : '该道具在对应场景中使用');
  };

  const buyHint = (item: ShopItem): string => {
    if (item.id === 'decoder') return '在「记忆档案」中使用';
    if (item.id === 'scan' || item.id === 'rollback') return '在挑战页工具栏使用';
    return '';
  };

  const buffText = [
    rw.buffs.shield > 0 ? '护盾 ×' + rw.buffs.shield : '',
    rw.buffs.guard > 0 ? '容错护符 ×' + rw.buffs.guard : '',
    rw.buffs.barrier > 0 ? '意识护罩 ×' + rw.buffs.barrier : '',
    rw.buffs.hintTicket > 0 ? '提示券 ×' + rw.buffs.hintTicket : '',
    rw.buffs.expBoost ? '经验增幅 ' + rw.buffs.expBoost.uses + ' 次（×' + rw.buffs.expBoost.mult + '）' : '',
  ].filter(Boolean);

  return (
    <div className="page page-anim page-inner shop-page">
      <div className="hud shop-hud">
        <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 主菜单</button>
        <div>
          <div className="hud-title">兑换中心 · REWARD NEXUS</div>
          <div className="hud-sub">贡献点换真实道具与外观：价格、限购与效果全部由终端业务层结算。</div>
        </div>
        <div className="hud-spacer" />
        <span className="hud-chip gold">◈ {rw.credits}</span>
        <span className="hud-chip cyan">信任 {rw.trust} · {tier.name}</span>
        <span className="hud-chip">碎片 {fragments.length}</span>
      </div>

      <div className="shop-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={'shop-tab' + (tab === t.id ? ' on' : '')}
            onClick={() => { play('click'); setTab(t.id); setDetailId(null); setConfirm(null); }}>
            <span>{t.icon}</span> {t.name}
            {t.id === 'bag' && <span className="shop-tab-n">{bagCount}</span>}
            {t.id === 'history' && rw.transactions.length > 0 && <span className="shop-tab-n">{rw.transactions.length}</span>}
          </button>
        ))}
      </div>

      {msg && (
        <div className={'result-banner ' + (msgTone === 'ok' ? 'ok' : 'fail')} style={{ marginBottom: 10 }}>
          {msg}
        </div>
      )}

      {tab === 'shop' && (
        <>
          <div className="shop-cats">
            <button className={'shop-cat' + (cat === 'all' ? ' on' : '')} onClick={() => { play('click'); setCat('all'); }}>全部</button>
            {CATEGORY_META.map(c => (
              <button key={c.id} className={'shop-cat' + (cat === c.id ? ' on' : '')} onClick={() => { play('click'); setCat(c.id); }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          <div className="shop-grid">
            {SHOP_ITEMS.filter(i => i.listed !== false && (cat === 'all' || i.type === cat)).map(item => {
              const st = stateOf(item);
              const stock = rw.items[item.id] || 0;
              return (
                <button key={item.id}
                  className={'shop-card ' + rarityClass(item.rarity) + (st !== 'buy' ? ' dimmed' : '') + (justBought === item.id ? ' just-bought' : '')}
                  onClick={() => openDetail(item)}>
                  <div className="sc-top">
                    <span className="sc-ico">{item.icon}</span>
                    <span className={'sc-rarity ' + rarityClass(item.rarity)}>{RARITY_META[item.rarity].name}</span>
                  </div>
                  <div className="sc-name">{item.name}</div>
                  <div className="sc-desc">{item.desc}</div>
                  <div className="sc-foot">
                    <span className="sc-price">◈ {item.price}</span>
                    {stock > 0 && <span className="chip dim">库存 ×{stock}</span>}
                    {st !== 'buy' && <span className={'chip ' + (st === 'insufficient' ? 'red' : 'dim')}>{BUY_STATE_TEXT[st]}</span>}
                    {st === 'buy' && (rw.purchases[item.id] || 0) > 0 && <span className="chip dim">已购 {rw.purchases[item.id]}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === 'bag' && (
        <div className="panel shop-bag">
          <div className="panel-title">背包<span className="panel-tag">{bagCount} 件</span></div>
          {buffText.length > 0 && (
            <div className="bag-buffs">
              <span className="bb-label">当前增益</span>
              {buffText.map(t => <span key={t} className="chip cyan">{t}</span>)}
            </div>
          )}
          <div className="shop-cats" style={{ marginBottom: 8 }}>
            {BAG_FILTERS.map(f => (
              <button key={f.id} className={'shop-cat' + (bagFilter === f.id ? ' on' : '')} onClick={() => { play('click'); setBagFilter(f.id); }}>{f.name}</button>
            ))}
          </div>
          {filteredBag.length === 0 ? (
            <div className="dim" style={{ padding: '18px 4px' }}>这里还是空的。去兑换商城看看防御道具、能量补给和外观。</div>
          ) : (
            <div className="bag-list">
              {filteredBag.map(item => {
                const count = rw.items[item.id] || 0;
                const isEq = equippedOf(item);
                const hint = buyHint(item);
                return (
                  <div key={item.id} className={'bag-row ' + rarityClass(item.rarity)}>
                    <span className="bag-ico">{item.icon}</span>
                    <div className="bag-main">
                      <div className="bag-name">
                        {item.name}
                        <span className={'sc-rarity ' + rarityClass(item.rarity)}>{RARITY_META[item.rarity].name}</span>
                        {isEq && <span className="chip green">使用中</span>}
                        {item.permanent && <span className="chip dim">永久</span>}
                      </div>
                      <div className="bag-sub">
                        {item.kind === 'consumable' || item.count ? '数量 ×' + count : item.equippable ? (rw.skins.includes(item.id) ? '已拥有' : '未拥有') : '已解锁'}
                        {item.usable && count > 0 && !hint && ' · 可使用'}
                        {hint && ' · ' + hint}
                      </div>
                    </div>
                    <div className="bag-actions">
                      <button className="nxbtn small ghost" onClick={() => openDetail(item)}>详情</button>
                      {(item.usable || item.equippable) && (
                        <button className="nxbtn small primary"
                          disabled={!!hint || (item.kind === 'consumable' && count <= 0 && !item.equippable)}
                          onClick={() => useOrEquip(item)}>
                          {isEq ? '卸下' : item.equippable ? '装备' : '使用'}
                        </button>
                      )}
                      {item.flag && <span className="chip cyan">已生效</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="panel shop-history">
          <div className="panel-title">交易记录<span className="panel-tag">最近 {rw.transactions.length} 笔</span></div>
          {rw.transactions.length === 0 ? (
            <div className="dim" style={{ padding: '18px 4px' }}>还没有交易。购买成功或失败都会记在这里。</div>
          ) : (
            <div className="tx-list">
              {[...rw.transactions].reverse().map(tx => (
                <div key={tx.id} className={'tx-row ' + (tx.status === 'ok' ? 'ok' : 'failed')}>
                  <span className={'tx-status ' + tx.status}>{tx.status === 'ok' ? '成功' : '失败'}</span>
                  <div className="tx-main">
                    <div className="tx-name">{tx.itemName} <span className="dim">×{tx.qty}</span></div>
                    <div className="tx-sub">
                      {timeText(tx.at)} · 单价 {tx.unitPrice} · 实付 {tx.total}
                      {tx.reason ? ' · ' + tx.reason : ''}
                    </div>
                  </div>
                  <span className="tx-id" title={tx.id}>{tx.id.slice(-8)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'archive' && (
        <div className="panel">
          <div className="panel-title">记忆档案<span className="panel-tag">碎片 {fragments.length} / {MEMORY_FRAGMENTS.length}</span></div>
          <div className="dim" style={{ fontSize: 12.5, marginBottom: 10 }}>
            收集记忆碎片可解锁档案；解码器可直接解锁一份未收集档案（不影响关卡判题）。
          </div>
          {MEMORY_ARCHIVES.map(a => {
            const read = rw.archiveRead.includes(a.id);
            const open = archives.some(x => x.id === a.id) || read;
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
                    if (openArchive === a.id) setOpenArchive(null);
                    else { setOpenArchive(a.id); g.markArchiveRead(a.id); }
                  }}>{openArchive === a.id ? '收起' : '阅读'}</button>
                )}
                {!open && (rw.items.decoder || 0) > 0 && (
                  <button className="nxbtn small primary" onClick={() => {
                    if (!g.consumeItem('decoder')) return;
                    g.markArchiveRead(a.id);
                    setMsgTone('ok');
                    setMsg('记忆解码器已使用：' + a.title);
                    play('success');
                  }}>使用解码器</button>
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

      {/* 商品详情抽屉：portal 到 body，避免被页面容器高度影响 */}
      {detail && typeof document !== 'undefined' && createPortal(
        <div className="shop-drawer-mask" onClick={() => { setDetailId(null); setConfirm(null); }}>
          <aside className={'shop-drawer ' + rarityClass(detail.rarity)} onClick={(e) => e.stopPropagation()}>
            <div className="sd-head">
              <span className="sd-ico">{detail.icon}</span>
              <div>
                <div className="sd-title">{detail.name}</div>
                <div className="sd-tags">
                  <span className={'sc-rarity ' + rarityClass(detail.rarity)}>{RARITY_META[detail.rarity].name}</span>
                  <span className="chip dim">{CATEGORY_META.find(c => c.id === detail.type)?.name}</span>
                  {detail.permanent && <span className="chip dim">永久</span>}
                </div>
              </div>
              <button className="sd-close" onClick={() => { setDetailId(null); setConfirm(null); }} aria-label="关闭">✕</button>
            </div>
            <div className="sd-body">
              <p className="sd-desc">{detail.desc}</p>
              <div className="sd-effect"><span>实际功能</span><b>{detail.effect}</b></div>
              <div className="sd-kv"><span>单价</span><b>◈ {detail.price}</b></div>
              <div className="sd-kv"><span>当前余额</span><b>◈ {rw.credits}</b></div>
              <div className="sd-kv"><span>购买限制</span><b>限购 {maxOwnOf(detail)} 件 · 已购 {rw.purchases[detail.id] || 0}</b></div>
              {detail.kind !== 'permanent' && detail.kind !== 'equipment' && (
                <div className="sd-qty">
                  <span>购买数量</span>
                  <div className="qty-ctl">
                    <button onClick={() => { play('click'); setQty(q => Math.max(1, q - 1)); }} disabled={qty <= 1}>−</button>
                    <b>{qty}</b>
                    <button onClick={() => { play('click'); setQty(q => Math.min(Math.max(1, maxOwnOf(detail) - (rw.purchases[detail.id] || 0)), q + 1)); }}>＋</button>
                  </div>
                  <span className="dim">应付 <b className="gold">{detail.price * qty}</b></span>
                </div>
              )}
            </div>
            <div className="sd-foot">
              {(() => {
                const st = stateOf(detail, qty);
                const maxOwn = maxOwnOf(detail);
                const remain = Math.max(0, maxOwn - (rw.purchases[detail.id] || 0));
                if (st === 'owned') {
                  return detail.equippable ? (
                    <button className="nxbtn primary" onClick={() => useOrEquip(detail)}>
                      {equippedOf(detail) ? '卸下' : '装备'}
                    </button>
                  ) : <span className="chip green">已拥有 · 已解锁</span>;
                }
                return (
                  <button className="nxbtn primary" disabled={st !== 'buy'} onClick={() => beginConfirm(detail)}>
                    {st === 'buy' ? '购买 · ◈ ' + detail.price * Math.min(qty, Math.max(1, remain))
                      : BUY_STATE_TEXT[st] + (st === 'limit' ? '（' + maxOwn + '）' : '')}
                  </button>
                );
              })()}
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {/* 二次确认（portal 到 body，保证手机端底部按钮可见） */}
      {confirm && typeof document !== 'undefined' && (() => {
        const item = SHOP_ITEMS.find(i => i.id === confirm.itemId);
        if (!item) return null;
        const total = item.price * confirm.qty;
        return createPortal(
          <div className="shop-confirm-mask" onClick={() => setConfirm(null)}>
            <div className="shop-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="cf-title">确认交易</div>
              <div className="cf-line"><span>{item.name} ×{confirm.qty}</span><b>◈ {total}</b></div>
              <div className="cf-sub">单价 {item.price} · 交易后余额 {Math.max(0, rw.credits - total)}</div>
              <div className="cf-note">终端会重新校验价格、限购与余额，确认后立即扣费并写入背包。</div>
              <div className="cf-btns">
                <button className="nxbtn ghost" onClick={() => { play('click'); setConfirm(null); }}>取消</button>
                <button className="nxbtn primary" onClick={doPurchase}>确认支付</button>
              </div>
            </div>
          </div>,
          document.body,
        );
      })()}
    </div>
  );
}
