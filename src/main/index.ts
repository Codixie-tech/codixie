import { app, BrowserWindow, dialog, shell } from "electron";
import path from "node:path";
import { updateElectronApp } from "update-electron-app";
import { FileStore } from "./store";
import { registerIpcHandlers } from "./ipc";
import Store from "electron-store";

app.disableHardwareAcceleration();

type AppConfig = {
  dataPath: string;
  activeVaultPath: string;
  recentVaultPaths: string[];
};

const electronStore = new Store<AppConfig>({
  name: "codixie-config",
  defaults: { dataPath: "", activeVaultPath: "", recentVaultPaths: [] },
});

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Codixie",
    icon: path.join(__dirname, "logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();

  mainWindow.webContents.on("before-input-event", (_e, input) => {
    if (input.key === "F12") {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  let dataPath =
    electronStore.get("activeVaultPath") || electronStore.get("dataPath");

  if (!dataPath) {
    dataPath = path.join(app.getPath("documents"), "Codixie");
  }

  const store = new FileStore(dataPath);
  await store.init();

  registerIpcHandlers(store, mainWindow, electronStore);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.on("ready", () => {
  createWindow().then(() => {
    setupAutoUpdate();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

function setupAutoUpdate() {
  if (process.platform === "linux") {
    checkForLinuxUpdate();
    return;
  }

  updateElectronApp();
}

async function checkForLinuxUpdate() {
  try {
    const repo = "Codixie-tech/codixie";
    const currentVersion = app.getVersion();

    const response = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
    );
    if (!response.ok) return;

    const release = await response.json();
    const latestTag = release.tag_name as string;
    const latestVersion = latestTag.replace(/^v/, "");

    if (compareVersions(latestVersion, currentVersion) > 0) {
      const result = await dialog.showMessageBox(mainWindow!, {
        type: "info",
        title: "Update available",
        message: `Codixie ${latestVersion} is available.`,
        detail: "You can download the new version from GitHub.",
        buttons: ["Download", "Later"],
        defaultId: 0,
        cancelId: 1,
      });

      if (result.response === 0) {
        void shell.openExternal(release.html_url);
      }
    }
  } catch {
    // silently fail — don't bother the user
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
