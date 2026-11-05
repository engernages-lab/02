import { useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from './store/gameStore';
import StartPage from './pages/StartPage';
import MainMenu from './pages/MainMenu';
import StoryPage from './pages/StoryPage';
import WorldMap from './pages/WorldMap';
import ChallengePage from './pages/ChallengePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import KnowledgePage from './pages/KnowledgePage';
import AchievementsPage from './pages/AchievementsPage';
import ArchivePage from './pages/ArchivePage';
import VaultPage from './pages/VaultPage';
import JournalPage from './pages/JournalPage';
import EndingsPage from './pages/EndingsPage';
import LabPage from './pages/LabPage';
import BossPage from './pages/BossPage';
import RewardCenterPage from './pages/RewardCenterPage';
import AttackOverlay from './components/AttackOverlay';
import RebirthOverlay from './components/RebirthOverlay';
import { initAudio, startMusic, isMusicOn } from './services/sound';
import { warmUp, onPyStatus, resetEngine, type PyState } from './services/pythonRunner';

function Shell() {
  const g = useGame();
  const { screen, event } = g;
  const audioReady = useRef(false);

  // 游戏启动即在后台预加载 Python 引擎：用户看启动动画/序章的时间足够完成初始化
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { warmUp(); } catch { /* ignore */ }
    }, 300);
    return () => window.clearTimeout(t);
  }, []);

  // 全局引擎状态徽标：加载中显示秒数与阶段，异常时可点击重试
  const [py, setPy] = useState<PyState>({ status: 'idle', phase: '' });
  const [pyElapsed, setPyElapsed] = useState(0);
  useEffect(() => {
    const un = onPyStatus(s => setPy(s));
    return un;
  }, []);
  useEffect(() => {
    if (py.status !== 'loading') { setPyElapsed(0); return; }
    const t0 = Date.now();
    const id = window.setInterval(() => setPyElapsed(Math.round((Date.now() - t0) / 1000)), 400);
    return () => window.clearInterval(id);
  }, [py.status]);

  // 首次用户交互时初始化音频（浏览器自动播放策略）
  useEffect(() => {
    const unlock = () => {
      if (audioReady.current) return;
      audioReady.current = true;
      initAudio(g.player.settings.sfxVolume, g.player.settings.musicVolume);
      if (g.player.settings.musicVolume > 0 && !isMusicOn()) startMusic();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [g.player.settings.musicVolume, g.player.settings.sfxVolume]);

  return (
    <div className={'app-root' + (g.player.settings.animations ? '' : ' anim-off')}>
      <div className="grid-bg" />
      <div className="vignette" />
      <div className="scanlines" />
      {screen === 'boot' && <StartPage />}
      {screen === 'menu' && <MainMenu />}
      {screen === 'story' && <StoryPage />}
      {screen === 'map' && <WorldMap />}
      {screen === 'challenge' && <ChallengePage />}
      {screen === 'profile' && <ProfilePage />}
      {screen === 'settings' && <SettingsPage />}
      {screen === 'knowledge' && <KnowledgePage />}
      {screen === 'achievements' && <AchievementsPage />}
      {screen === 'archive' && <ArchivePage />}
      {screen === 'vault' && <VaultPage />}
      {screen === 'journal' && <JournalPage />}
      {screen === 'endings' && <EndingsPage />}
      {screen === 'lab' && <LabPage />}
      {screen === 'boss' && <BossPage />}
      {screen === 'shop' && <RewardCenterPage />}
      {(py.status === 'loading' || py.status === 'error') && (
        <div
          className={'engine-badge ' + py.status}
          onClick={() => { if (py.status === 'error') { resetEngine(); try { warmUp(); } catch { /* ignore */ } } }}
          title={py.phase}
        >
          {py.status === 'loading'
            ? '⚙ Python 引擎加载中 ' + pyElapsed + 's · ' + (py.phase || '准备中')
            : '⚠ 引擎错误：' + (py.phase || '未知') + '（点击重试）'}
        </div>
      )}
      <div className="toast-host">
        {g.toasts.map(t => (
          <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>
        ))}
      </div>
      {event.kind === 'attack' && <AttackOverlay />}
      {event.kind === 'death' && <RebirthOverlay />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
