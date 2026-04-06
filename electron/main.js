const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, net, globalShortcut, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { pathToFileURL } = require('url');

// Fix GPU shader disk cache permission errors on Windows that cause black screens
app.commandLine.appendSwitch('--disable-gpu-shader-disk-cache');

const isDev = !app.isPackaged;
const GAMES_FILE = path.join(app.getPath('userData'), 'games.json');
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');
const ART_DIR = path.join(app.getPath('userData'), 'art');

let mainWindow = null;
let tray = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } },
]);

app.on('second-instance', () => {
  bringToFront();
});

function createWindow() {
  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    fullscreen: false,
    fullscreenable: false,
    frame: false,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0f',
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (isDev) return;
    e.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('PC Console');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => { mainWindow?.destroy(); app.quit(); } },
  ]));
  tray.on('click', () => mainWindow?.show());
}

// --- Game Library ---

function loadGames() {
  try {
    if (fs.existsSync(GAMES_FILE)) {
      return JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load games:', err);
  }
  return [];
}

function saveGames(games) {
  try {
    const dir = path.dirname(GAMES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save games:', err);
  }
}

// --- IPC Handlers ---

ipcMain.handle('get-games', () => loadGames());

ipcMain.handle('add-game', async (_event, game) => {
  const games = loadGames();
  games.push({ ...game, id: Date.now().toString() });
  saveGames(games);
  setTimeout(() => retryMissingArt(), 1000);
  return games;
});

ipcMain.handle('remove-game', async (_event, id) => {
  let games = loadGames();
  games = games.filter((g) => g.id !== id);
  saveGames(games);
  return games;
});

ipcMain.handle('launch-game', async (_event, exePath) => {
  if (!exePath) return { success: false, error: 'No path provided' };
  return new Promise((resolve) => {
    const cwd = path.dirname(exePath);
    exec(`start "" "${exePath}"`, { cwd }, (err) => {
      if (err) {
        console.error('Failed to launch game:', err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('pick-exe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Game Executable',
    filters: [{ name: 'Executables', extensions: ['exe', 'lnk', 'bat'] }],
    properties: ['openFile'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('pick-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Cover Image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    properties: ['openFile'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('power-action', async (_event, action) => {
  const commands = {
    shutdown: 'shutdown /s /t 0',
    restart: 'shutdown /r /t 0',
    sleep: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
  };
  const cmd = commands[action];
  if (!cmd) return;
  exec(cmd, (err) => {
    if (err) console.error('Power action failed:', err);
  });
});

// --- Settings ---

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return {};
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

ipcMain.handle('get-settings', () => loadSettings());

ipcMain.handle('set-setting', async (_event, key, value) => {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
});

ipcMain.handle('pick-wallpaper', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Background Wallpaper',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    properties: ['openFile'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// --- Game Art Search (RAWG API) ---

function getRawgApiKey() {
  const settings = loadSettings();
  return settings.rawgApiKey || null;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let body = '';
    request.on('response', (response) => {
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    request.on('error', reject);
    request.end();
  });
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    const chunks = [];
    request.on('response', (response) => {
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          if (!fs.existsSync(ART_DIR)) fs.mkdirSync(ART_DIR, { recursive: true });
          fs.writeFileSync(destPath, Buffer.concat(chunks));
          resolve(destPath);
        } catch (e) { reject(e); }
      });
    });
    request.on('error', reject);
    request.end();
  });
}

function normalizeGameName(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-\.]+/g, ' ')
    .trim();
}

async function searchGameArt(gameName) {
  const apiKey = getRawgApiKey();
  if (!apiKey) {
    console.error('No RAWG API key configured in settings');
    return [];
  }
  try {
    const searchName = normalizeGameName(gameName);
    const query = encodeURIComponent(searchName);
    const data = await fetchJSON(`https://api.rawg.io/api/games?key=${apiKey}&search=${query}&page_size=12`);
    if (!data.results || data.results.length === 0) return [];
    return data.results
      .filter((g) => g.background_image)
      .map((g) => ({
        name: g.name,
        image: g.background_image,
      }));
  } catch (err) {
    console.error('Art search failed:', err);
    return [];
  }
}

async function downloadArt(imageUrl, gameName) {
  try {
    const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
    const safeName = gameName.replace(/[^a-zA-Z0-9]/g, '_');
    const destPath = path.join(ART_DIR, `${safeName}_${Date.now()}.${ext}`);
    return await downloadImage(imageUrl, destPath);
  } catch (err) {
    console.error('Art download failed:', err);
    return null;
  }
}

async function fetchArtForGame(game) {
  const results = await searchGameArt(game.name);
  const best = results.find((r) => r.image);
  if (!best) return null;
  return await downloadArt(best.image, game.name);
}

async function retryMissingArt() {
  const games = loadGames();
  let updated = false;

  for (const game of games) {
    const hasArt = game.coverPath && fs.existsSync(game.coverPath);
    if (hasArt) continue;

    console.log(`Fetching art for "${game.name}"...`);
    try {
      const artPath = await fetchArtForGame(game);
      if (artPath) {
        game.coverPath = artPath;
        updated = true;
        console.log(`Art saved for "${game.name}": ${artPath}`);
      }
    } catch (err) {
      console.error(`Art retry failed for "${game.name}":`, err);
    }
  }

  if (updated) {
    saveGames(games);
    mainWindow?.webContents.send('games-updated', games);
  }
}

let artRetryInterval = null;

function startArtRetry() {
  retryMissingArt();
  artRetryInterval = setInterval(() => retryMissingArt(), 30000);
}

function stopArtRetry() {
  if (artRetryInterval) {
    clearInterval(artRetryInterval);
    artRetryInterval = null;
  }
}

ipcMain.handle('search-game-art', async (_event, gameName) => {
  return await searchGameArt(gameName);
});

ipcMain.handle('download-art', async (_event, imageUrl, gameName) => {
  return await downloadArt(imageUrl, gameName);
});

ipcMain.handle('update-game-cover', async (_event, gameId, coverPath) => {
  const games = loadGames();
  const game = games.find((g) => g.id === gameId);
  if (!game) return null;
  game.coverPath = coverPath;
  saveGames(games);
  mainWindow?.webContents.send('games-updated', games);
  return games;
});

ipcMain.handle('get-login-item', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-login-item', async (_event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
  return enabled;
});

ipcMain.handle('toggle-fullscreen', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('quit-app', () => {
  mainWindow?.destroy();
  app.quit();
});

// --- Bring to Front ---

function bringToFront() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.moveTop();
  mainWindow.focus();
  setTimeout(() => {
    if (mainWindow) mainWindow.setAlwaysOnTop(false);
  }, 200);
}

ipcMain.handle('bring-to-front', () => bringToFront());

// --- App Lifecycle ---

ipcMain.handle('get-local-file-url', (_event, filePath) => {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  return `local-file:///${normalized}`;
});

app.whenReady().then(() => {
  protocol.handle('local-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-file:///', ''));
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();
  createTray();
  startArtRetry();

  const registered = globalShortcut.register('Ctrl+Alt+G', bringToFront);
  console.log('Global shortcut Ctrl+Alt+G registered:', registered);
});

app.on('will-quit', () => {
  stopArtRetry();
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  app.quit();
});
