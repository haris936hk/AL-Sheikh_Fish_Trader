const path = require('path');

const { app, BrowserWindow, Menu, dialog } = require('electron');

// Detect if running in development mode
const isDev = !app.isPackaged;

// Disable default menu before app is ready
Menu.setApplicationMenu(null);

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (app.isReady()) {
    dialog.showErrorBox('Critical Error', `An unexpected error occurred: ${error.message}\n\nThe application will now close.`);
  }
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Wait for 'ready-to-show' to avoid white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Keeps Node.js isolated from renderer JS
      nodeIntegration: false, // Renderer cannot access Node.js directly
      sandbox: false, // Required: preload uses require() for channels.js
      v8CacheOptions: 'code',
      backgroundThrottling: false, // Prevent throttling when window loses focus
    },
  });

  // Show window only after content has been painted
  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Log any page load failures to the console for debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorCode, errorDescription);
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details.reason);
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'error',
      title: 'Renderer Crashed',
      message: 'The renderer process has crashed.',
      detail: `Reason: ${details.reason}. Would you like to reload the app?`,
      buttons: ['Reload', 'Quit'],
      defaultId: 0,
      cancelId: 1
    });
    if (choice === 0) {
      mainWindow.reload();
    } else {
      app.quit();
    }
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
      dialog.showErrorBox('Database Error', `Failed to initialize database.\n\nError: ${error.message}\n\nThe application will now close.`);
      app.quit();
      return; // Stop further execution
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

// Clean up database connection on quit
app.on('will-quit', () => {
  try {
    const db = require('./database/index.js');
    db.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error closing database:', err);
  }
});
