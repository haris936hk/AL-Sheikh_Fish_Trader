const path = require('path');

const { app, BrowserWindow, Menu } = require('electron');

// Detect if running in development mode
const isDev = !app.isPackaged;

// Disable default menu before app is ready
Menu.setApplicationMenu(null);

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Keeps Node.js isolated from renderer JS
      nodeIntegration: false, // Renderer cannot access Node.js directly
      sandbox: false, // Required: preload uses require() for channels.js
      v8CacheOptions: 'code',
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Log any page load failures to the console for debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorCode, errorDescription);
  });

  // Open DevTools only in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

app
  .whenReady()
  .then(() => {
    // Deferred loading: only require heavy modules after app is ready
    const db = require('./database/index.js');
    const { registerHandlers } = require('./ipc/handlers.js');

    // Initialize database
    try {
      db.initialize();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }

    // Register IPC handlers
    registerHandlers();
    console.log('IPC handlers registered');

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    return null;
  })
  .catch((err) => {
    console.error('App failed to start:', err);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up database connection and jsreport on quit
app.on('before-quit', async () => {
  try {
    const jsreportService = require('./services/jsreportService.js');
    await jsreportService.close();
  } catch {
    // jsreport may not have been initialized
  }
  const db = require('./database/index.js');
  db.close();
  console.log('Database connection closed');
});
