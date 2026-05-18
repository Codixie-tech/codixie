import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { FileStore } from './store';
import { registerIpcHandlers } from './ipc';
import Store from 'electron-store';

app.disableHardwareAcceleration();

const electronStore = new Store<{ dataPath: string }>({
  name: 'codixie-config',
  defaults: { dataPath: '' },
});

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Codixie',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  let dataPath = electronStore.get('dataPath');

  if (!dataPath) {
    dataPath = path.join(app.getPath('documents'), 'Codixie');
  }

  const store = new FileStore(dataPath);
  await store.init();

  registerIpcHandlers(store, mainWindow);

  electronStore.onDidChange('dataPath', (newPath) => {
    if (newPath) {
      electronStore.set('dataPath', newPath);
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
