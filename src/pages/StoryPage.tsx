import DialogSystem from '../components/DialogSystem';
import { PROLOGUE } from '../game/story';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';

export default function StoryPage() {
  const g = useGame();
  return (
    <DialogSystem
      nodes={PROLOGUE}
      frameTitle="序章 · 苏醒"
      speedMs={g.player.settings.typewriterMs}
      animEnabled={g.player.settings.animations}
      onSeen={(id) => g.markStory('prologue_' + id)}
      onDone={() => {
        play('unlock');
        g.setFlag('prologueDone', true);
        g.toast('info', '新任务已下发：前往新人训练终端完成接驳。');
        g.nav('map');
      }}
    />
  );
}
