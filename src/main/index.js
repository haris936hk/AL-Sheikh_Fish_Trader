const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Detect if running in development mode
const isDev = !app.isPackaged;

// Disable default menu before app is ready
Menu.setApplicationMenu(null);

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Prevent white flash — show on 'ready-to-show'
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      v8CacheOptions: 'code', // Faster script execution via V8 code caching
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Show window only when fully rendered (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools only in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
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
