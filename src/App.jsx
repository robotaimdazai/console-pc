import { useState, useEffect, useCallback } from 'react';
import { getGames, launchGame, removeGame, powerAction } from './stores/gameStore';
import { toLocalFileUrl } from './utils/fileUrl';
import Home from './components/Home';
import AddGame from './components/AddGame';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';

const VIEWS = { HOME: 'home', ADD_GAME: 'addGame', SIDEBAR: 'sidebar', SETTINGS: 'settings' };

export default function App() {
  const [games, setGames] = useState([]);
  const [view, setView] = useState(VIEWS.HOME);
  const [clock, setClock] = useState('');
  const [wallpaper, setWallpaper] = useState(null);
  const [gamerTag, setGamerTag] = useState('');

  useEffect(() => {
    loadGames();
    loadWallpaper();

    window.api.onGamesUpdated((updatedGames) => {
      setGames(updatedGames);
    });

    const interval = setInterval(() => {
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    const list = await getGames();
    setGames(list);
  };

  const loadWallpaper = async () => {
    const settings = await window.api.getSettings();
    if (settings.wallpaper) setWallpaper(settings.wallpaper);
    if (settings.gamerTag) setGamerTag(settings.gamerTag);
  };

  const handlePickWallpaper = async () => {
    const path = await window.api.pickWallpaper();
    if (path) {
      await window.api.setSetting('wallpaper', path);
      setWallpaper(path);
    }
  };

  const handleClearWallpaper = async () => {
    await window.api.setSetting('wallpaper', null);
    setWallpaper(null);
  };

  const handleLaunch = useCallback(async (game) => {
    if (game) await launchGame(game.exePath);
  }, []);

  const handleRemove = useCallback(async (game) => {
    if (!game) return;
    const updated = await removeGame(game.id);
    setGames(updated);
  }, []);

  const handleSettingsClose = (updatedTag) => {
    if (typeof updatedTag === 'string') setGamerTag(updatedTag);
    setView(VIEWS.HOME);
  };

  const sidebarActions = [
    { label: 'Add Game', icon: '＋', action: () => setView(VIEWS.ADD_GAME) },
    { label: 'Settings', icon: '⚙', action: () => setView(VIEWS.SETTINGS) },
    { label: 'Set Wallpaper', icon: '🖼', action: handlePickWallpaper },
    { label: 'Clear Wallpaper', icon: '✖', action: handleClearWallpaper },
    { label: 'Sleep', icon: '🌙', action: () => powerAction('sleep') },
    { label: 'Restart', icon: '↻', action: () => powerAction('restart') },
    { label: 'Shutdown', icon: '⏻', action: () => powerAction('shutdown') },
    { label: 'Quit App', icon: '✕', action: () => window.api.quitApp() },
  ];

  const onGameAdded = (updatedGames) => {
    setGames(updatedGames);
    setView(VIEWS.HOME);
  };

  return (
    <>
      {wallpaper && (
        <div
          className="app-bg"
          style={{ backgroundImage: `url("${toLocalFileUrl(wallpaper)}")` }}
        />
      )}
      <div className="app">
        <header className="top-bar">
          <div className="top-bar-title">PC Console</div>
          <div className="top-bar-actions">
            <button
              className="top-btn"
              onClick={() => setView(VIEWS.ADD_GAME)}
              title="Add Game"
            >＋</button>
            <button
              className="top-btn"
              onClick={() => setView(view === VIEWS.SIDEBAR ? VIEWS.HOME : VIEWS.SIDEBAR)}
              title="Menu"
            >☰</button>
          </div>
          <div className="top-bar-clock">{clock}</div>
        </header>

        <main className="content">
          <Home
            games={games}
            visible={view === VIEWS.HOME}
            gamerTag={gamerTag}
            onLaunch={handleLaunch}
            onRemove={handleRemove}
            onAddGame={() => setView(VIEWS.ADD_GAME)}
          />

          {view === VIEWS.ADD_GAME && (
            <AddGame onClose={() => setView(VIEWS.HOME)} onAdded={onGameAdded} />
          )}

          {view === VIEWS.SETTINGS && (
            <Settings onClose={handleSettingsClose} />
          )}

          {view === VIEWS.SIDEBAR && (
            <Sidebar
              items={sidebarActions}
              onClose={() => setView(VIEWS.HOME)}
            />
          )}
        </main>
      </div>
    </>
  );
}
