const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getGames: () => ipcRenderer.invoke('get-games'),
  addGame: (game) => ipcRenderer.invoke('add-game', game),
  removeGame: (id) => ipcRenderer.invoke('remove-game', id),
  launchGame: (exePath) => ipcRenderer.invoke('launch-game', exePath),
  pickExe: () => ipcRenderer.invoke('pick-exe'),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  powerAction: (action) => ipcRenderer.invoke('power-action', action),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  pickWallpaper: () => ipcRenderer.invoke('pick-wallpaper'),
  searchGameArt: (name) => ipcRenderer.invoke('search-game-art', name),
  downloadArt: (url, name) => ipcRenderer.invoke('download-art', url, name),
  bringToFront: () => ipcRenderer.invoke('bring-to-front'),
  getLocalFileUrl: (filePath) => ipcRenderer.invoke('get-local-file-url', filePath),
  updateGameCover: (gameId, coverPath) => ipcRenderer.invoke('update-game-cover', gameId, coverPath),
  getLoginItem: () => ipcRenderer.invoke('get-login-item'),
  setLoginItem: (enabled) => ipcRenderer.invoke('set-login-item', enabled),
  onGamesUpdated: (callback) => {
    ipcRenderer.on('games-updated', (_event, games) => callback(games));
  },
});
