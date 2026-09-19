import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, Notification } from 'electron';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#f5f0e8',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const rendererURL = process.env.ELECTRON_RENDERER_URL;
  if (rendererURL) {
    void mainWindow.loadURL(rendererURL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('show-notification', (_event, input: unknown) => {
  if (!isNotificationInput(input) || !Notification.isSupported()) return;
  new Notification({ title: input.title, body: input.body }).show();
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function isNotificationInput(value: unknown): value is { title: string; body: string } {
  if (typeof value !== 'object' || value === null) return false;
  const input = value as Record<string, unknown>;
  return typeof input.title === 'string' && input.title.length > 0 && input.title.length <= 80 && typeof input.body === 'string' && input.body.length > 0 && input.body.length <= 500;
}
