import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from './store/gameStore';
import ErrorBoundary, { CrashProbe } from './components/ErrorBoundary';
import ModuleLoading from './components/ModuleLoading';
import StartPage from './pages/StartPage';
import MainMenu from './pages/MainMenu';
import AttackOverlay from './components/AttackOverlay';
import RebirthOverlay from './components/RebirthOverlay';
import IntrusionOverlay from './components/IntrusionOverlay';
import { initAudio, startMusic, isMusicOn } from './services/sound';
import { warmUp, onPyStatus, resetEngine, type PyState } from './services/pythonRunner';

const StoryPage = lazy(() => import('./pages/StoryPage'));
const WorldMap = lazy(() => import('./pages/WorldMap'));
const ChallengePage = lazy(() => import('./pages/ChallengePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const VaultPage = lazy(() => import('./pages/VaultPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const EndingsPage = lazy(() => import('./pages/EndingsPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const BossPage = lazy(() => import('./pages/BossPage'));
const RewardCenterPage = lazy(() => import('./pages/RewardCenterPage'));
const ChallengeHubPage = lazy(() => import('./pages/ChallengeHubPage'));
const ChallengePlayPage = lazy(() => import('./pages/ChallengePlayPage'));
const BossBattleArchivePage = lazy(() => import('./pages/BossBattleArchivePage'));
const MiraPage = lazy(() => import('./pages/MiraPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));

function Shell() {
  const g = useGame();
  const { screen, event } = g;
  const audioReady = useRef(false);
  const [crashProbe, setCrashProbe] = useState(() => import.meta.env?.DEV === true && new URLSearchParams(window.location.search).get('crash') === '1');
  const clearCrashProbe = () => {
    setCrashProbe(false);
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  };

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
      <ErrorBoundary
        scope="page"
        onRetry={clearCrashProbe}
        onReturnMenu={() => { clearCrashProbe(); g.nav('menu'); }}
      >
        <Suspense fallback={<ModuleLoading />}>
          {crashProbe ? <CrashProbe /> : (
            <>
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
              {screen === 'battlearchive' && <BossBattleArchivePage />}
              {screen === 'mira' && <MiraPage />}
              {screen === 'explore' && <ExplorePage />}
              {screen === 'shop' && <RewardCenterPage />}
              {screen === 'challengehub' && <ChallengeHubPage />}
              {screen === 'challengeplay' && <ChallengePlayPage />}
            </>
          )}
        </Suspense>
      </ErrorBoundary>
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
      <IntrusionOverlay />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary scope="app">
      <GameProvider>
        <Shell />
      </GameProvider>
    </ErrorBoundary>
  );
}
