import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/ipcChannels';
import type {
  AppMeta,
  ClientTag,
  ClientCodeSnippet,
  ClientComment,
  FileChangeEvent,
} from './shared/types';

type VaultListResult = {
  activeVaultPath: string;
  vaults: { path: string; name: string; active: boolean }[];
};

type InitialLoadResult = {
  tags: ClientTag[];
  snippets: ClientCodeSnippet[];
  meta: AppMeta | null;
};

type OpenVaultResult = {
  needsInit: boolean;
  data: InitialLoadResult | null;
};

type ImportExportResult = { success: true; tags: ClientTag[]; snippets: ClientCodeSnippet[] } | { success: false; error: string };

type ExportResult = { success: true } | { success: false; error?: string };

type McpConfigResult = {
  command: string;
  args: string[];
  config: string;
  stdio: {
    command: string;
    args: string[];
    config: string;
  };
  http: {
    running: boolean;
    host: string;
    port: number | null;
    url: string | null;
    config: string | null;
  };
};

const api = {
  app: {
    isFirstLaunch: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.APP_IS_FIRST_LAUNCH),
    getMeta: (): Promise<AppMeta | null> => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_META),
    getDataPath: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_DATA_PATH),
    getVaults: (): Promise<VaultListResult> => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VAULTS),
    selectDataFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.APP_SELECT_DATA_FOLDER),
    initialLoad: (): Promise<InitialLoadResult> => ipcRenderer.invoke(IPC_CHANNELS.APP_INITIAL_LOAD),
    changeDataFolder: (newPath: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_CHANGE_DATA_FOLDER, newPath),
    openVault: (newPath: string): Promise<OpenVaultResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_VAULT, newPath),
    removeVault: (vaultPath: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_REMOVE_VAULT, vaultPath),
    initializeVault: (newPath: string): Promise<InitialLoadResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_INITIALIZE_VAULT, newPath),
    onFileChanged: (callback: (event: FileChangeEvent) => void) => {
      const handler = (_e: unknown, data: FileChangeEvent) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.FILE_CHANGED, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.FILE_CHANGED, handler);
    },
  },

  tag: {
    getAll: (): Promise<ClientTag[]> => ipcRenderer.invoke(IPC_CHANNELS.TAG_GET_ALL),
    create: (tag: ClientTag): Promise<ClientTag> => ipcRenderer.invoke(IPC_CHANNELS.TAG_CREATE, tag),
    update: (tag: ClientTag): Promise<ClientTag> => ipcRenderer.invoke(IPC_CHANNELS.TAG_UPDATE, tag),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.TAG_DELETE, id),
  },

  snippet: {
    getAll: (): Promise<ClientCodeSnippet[]> => ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_GET_ALL),
    create: (snippet: ClientCodeSnippet): Promise<ClientCodeSnippet> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_CREATE, snippet),
    update: (snippet: ClientCodeSnippet): Promise<ClientCodeSnippet> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_UPDATE, snippet),
    softDelete: (id: string): Promise<ClientCodeSnippet | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_SOFT_DELETE, id),
    restore: (id: string): Promise<ClientCodeSnippet | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_RESTORE, id),
    permanentDelete: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_PERMANENT_DELETE, id),
    pin: (id: string, pinned: boolean): Promise<ClientCodeSnippet | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_PIN, id, pinned),
    blockEdit: (id: string, isEditable: boolean): Promise<ClientCodeSnippet | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_BLOCK_EDIT, id, isEditable),
    changeTags: (id: string, tags: string[]): Promise<ClientCodeSnippet | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_CHANGE_TAGS, id, tags),
  },

  comment: {
    add: (snippetId: string, comment: ClientComment): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.COMMENT_ADD, snippetId, comment),
    update: (snippetId: string, comment: ClientComment): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.COMMENT_UPDATE, snippetId, comment),
    delete: (snippetId: string, commentId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.COMMENT_DELETE, snippetId, commentId),
  },

  importExport: {
    importWebExport: (mode: 'replace' | 'merge'): Promise<ImportExportResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_WEB_EXPORT, mode),
    exportToFile: (): Promise<ExportResult> => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_TO_FILE),
  },

  mcp: {
    getConfig: (): Promise<McpConfigResult> => ipcRenderer.invoke(IPC_CHANNELS.MCP_GET_CONFIG),
  },
};

contextBridge.exposeInMainWorld('codixieAPI', api);

export type CodixieAPI = typeof api;
