import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;
type UpdateState = { status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'disabled'; version?: string; percent?: number };
let updateState: UpdateState = { status: app.isPackaged ? 'idle' : 'disabled' };

function setUpdateState(next: UpdateState): void {
  updateState = next;
  mainWindow?.webContents.send('updates:state', next);
}

function configureUpdates(): void {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('checking-for-update', () => setUpdateState({ status: 'checking' }));
  autoUpdater.on('update-available', (info) => setUpdateState({ status: 'available', version: info.version }));
  autoUpdater.on('update-not-available', () => setUpdateState({ status: 'idle' }));
  autoUpdater.on('download-progress', (progress) => setUpdateState({ status: 'downloading', percent: Math.round(progress.percent) }));
  autoUpdater.on('update-downloaded', (info) => setUpdateState({ status: 'downloaded', version: info.version }));
  autoUpdater.on('error', () => setUpdateState({ status: 'error' }));
}

async function checkForUpdate(): Promise<UpdateState> {
  if (!app.isPackaged) return updateState;
  await autoUpdater.checkForUpdates();
  return updateState;
}

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

ipcMain.handle('updates:get-state', () => updateState);
ipcMain.handle('updates:check', () => checkForUpdate());
ipcMain.handle('updates:download', async () => {
  if (updateState.status !== 'available') return;
  await autoUpdater.downloadUpdate();
});
ipcMain.handle('updates:install', () => {
  if (updateState.status !== 'downloaded') return;
  autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  configureUpdates();
  createWindow();
  void checkForUpdate();
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
