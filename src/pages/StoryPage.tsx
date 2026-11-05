import CinematicStage from '../components/CinematicStage';
import { PROLOGUE_SCENES } from '../game/lore/prologue';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';

export default function StoryPage() {
  const g = useGame();
  return (
    <CinematicStage
      scenes={PROLOGUE_SCENES}
      eventId="prologue"
      frameTitle="序章 · 沉睡的意识"
      onRename={name => g.renamePlayer(name)}
      onDone={() => {
        play('unlock');
        g.setFlag('prologueDone', true);
        g.toast('info', '新任务已下发：前往新人训练终端完成接驳。');
        g.nav('map');
      }}
    />
  );
}
