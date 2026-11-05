import { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { bossById } from '../game/bosses';
import { battleFor } from '../game/battle';
import BossBattlePage from './BossBattlePage';
import BossChallengePage from './BossChallengePage';

/**
 * Boss 入口分发：
 * - 配置了 BossBattleDef 的章节（当前仅第一章 GATE-01）走多阶段战斗界面；
 * - 其余章节继续使用原有单题挑战界面（未改动）。
 */
export default function BossPage() {
  const g = useGame();
  const boss = bossById(g.player.progress.currentBossId || '');

  useEffect(() => {
    if (!boss) g.nav('map');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss?.id]);

  if (!boss) return null;
  return battleFor(boss.id) ? <BossBattlePage /> : <BossChallengePage />;
}
