import { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { bossById } from '../game/bosses';
import { battleFor } from '../game/battle';
import BossBattlePage from './BossBattlePage';
import BossChallengePage from './BossChallengePage';

/**
 * Boss 入口分发：
 * - 六章章节 Boss 均配置了 BossBattleDef，走多阶段战斗界面；
 * - 未配置战斗数据的旧 Boss（ECHO 支线等）回退到单题挑战界面。
 */
export default function BossPage() {
  const g = useGame();
  const boss = bossById(g.player.progress.currentBossId || '');

  useEffect(() => {
    if (!boss) { g.nav('map'); return; }
    // 统一入口门禁：六章主线 Boss 必须满足章节 / 关卡 / 原初核心条件；
    // 非主线回响（旧挑战页）不参与创世主碎片体系，保留原有入口。
    const gate = g.bossEntryGate(boss.id);
    if (gate.exists && !gate.available && !gate.simulation) {
      g.toast('warn', gate.reason || '该 Boss 尚未开放。');
      g.setCurrentBoss(null);
      g.nav('map');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss?.id]);

  if (!boss) return null;
  return battleFor(boss.id) ? <BossBattlePage /> : <BossChallengePage />;
}
