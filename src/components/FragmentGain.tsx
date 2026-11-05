import { useEffect } from 'react';
import type { CreatorFragmentDef } from '../game/lore/fragments';

/** 碎片收集动画（全息归档） */
export default function FragmentGain({ def, onDone }: { def: CreatorFragmentDef; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="frag-gain" onClick={onDone} role="dialog" aria-label="获得创世主碎片">
      <div className="fg-scan" />
      <div className="fg-rings"><span /><span /><span /></div>
      <div className="fg-core">◇</div>
      <div className="fg-order">创世主碎片 · 第 {def.order} 枚</div>
      <div className="fg-name">《{def.title}》</div>
      <div className="fg-sub">{def.subtitle}</div>
      <div className="fg-quote">{def.content}</div>
      <div className="fg-hint">已归档至记忆档案馆 · 点击继续</div>
    </div>
  );
}
