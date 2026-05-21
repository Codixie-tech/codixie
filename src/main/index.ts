import { app, BrowserWindow, dialog, shell } from "electron";
import Store from "electron-store";
import path from "node:path";
import { updateElectronApp } from "update-electron-app";
import { registerIpcHandlers } from "./ipc";
import { startCodixieHttpMcpServer, startCodixieMcpServer, type CodixieHttpMcpServer } from "./mcp/server";
import { FileStore } from "./store";

if (require("electron-squirrel-startup")) app.quit();

const isMcpMode = process.argv.includes("--mcp");
const isHeadlessMode = isMcpMode || process.argv.includes("--headless");

if (isHeadlessMode) {
  app.commandLine.appendSwitch("headless");
  app.commandLine.appendSwitch("disable-gpu");
  if (process.platform === "linux") {
    app.commandLine.appendSwitch("ozone-platform", "headless");
  }
}

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
let httpMcpServer: CodixieHttpMcpServer | null = null;

function resolveDataPath(): string {
  return (
    electronStore.get("activeVaultPath") ||
    electronStore.get("dataPath") ||
    path.join(app.getPath("documents"), "Codixie")
  );
}

async function startMcpMode(): Promise<void> {
  const store = new FileStore(resolveDataPath());
  await store.init({ createMissing: false });
  await startCodixieMcpServer({ store, version: app.getVersion() });
}

async function startHttpMcpMode(store: FileStore): Promise<void> {
  try {
    const configuredPort = Number(process.env.CODIXIE_MCP_HTTP_PORT || 0);
    httpMcpServer = await startCodixieHttpMcpServer({ store, version: app.getVersion(), port: configuredPort });
  } catch (error) {
    httpMcpServer = null;
    console.error('Failed to start Codixie MCP HTTP server:', error);
  }
}

const createWindow = async () => {
  const store = new FileStore(resolveDataPath());
  await store.init();
  await startHttpMcpMode(store);

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

  registerIpcHandlers(store, mainWindow, electronStore, () => httpMcpServer);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.whenReady().then(async () => {
  if (isMcpMode) {
    await startMcpMode();
    return;
  }

  await createWindow();
  setupAutoUpdate();
}).catch((error: unknown) => {
  console.error(error);
  app.exit(1);
});

app.on("window-all-closed", () => {
  if (isMcpMode) return;
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (!httpMcpServer) return;
  void httpMcpServer.close();
  httpMcpServer = null;
});

app.on("activate", () => {
  if (isMcpMode) return;
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
