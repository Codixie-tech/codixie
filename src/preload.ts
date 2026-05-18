import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/ipcChannels';

const api = {
  app: {
    isFirstLaunch: () => ipcRenderer.invoke(IPC_CHANNELS.APP_IS_FIRST_LAUNCH),
    getMeta: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_META),
    getDataPath: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_DATA_PATH),
    selectDataFolder: () => ipcRenderer.invoke(IPC_CHANNELS.APP_SELECT_DATA_FOLDER),
    initialLoad: () => ipcRenderer.invoke(IPC_CHANNELS.APP_INITIAL_LOAD),
    changeDataFolder: (newPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_CHANGE_DATA_FOLDER, newPath),
    initializeVault: (newPath: string, username: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_INITIALIZE_VAULT, newPath, username),
    onFileChanged: (callback: (event: any) => void) => {
      const handler = (_e: any, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.FILE_CHANGED, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.FILE_CHANGED, handler);
    },
  },

  tag: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.TAG_GET_ALL),
    create: (tag: any) => ipcRenderer.invoke(IPC_CHANNELS.TAG_CREATE, tag),
    update: (tag: any) => ipcRenderer.invoke(IPC_CHANNELS.TAG_UPDATE, tag),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TAG_DELETE, id),
  },

  snippet: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_GET_ALL),
    create: (snippet: any) => ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_CREATE, snippet),
    update: (snippet: any) => ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_UPDATE, snippet),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_SOFT_DELETE, id),
    restore: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_RESTORE, id),
    permanentDelete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_PERMANENT_DELETE, id),
    pin: (id: string, pinned: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_PIN, id, pinned),
    blockEdit: (id: string, isEditable: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_BLOCK_EDIT, id, isEditable),
    changeTags: (id: string, tags: string[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.SNIPPET_CHANGE_TAGS, id, tags),
  },

  comment: {
    add: (snippetId: string, comment: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.COMMENT_ADD, snippetId, comment),
    update: (snippetId: string, comment: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.COMMENT_UPDATE, snippetId, comment),
    delete: (snippetId: string, commentId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.COMMENT_DELETE, snippetId, commentId),
  },

  user: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.USER_GET),
    setUsername: (username: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.USER_SET_USERNAME, username),
  },

  importExport: {
    importWebExport: (mode: 'replace' | 'merge') =>
      ipcRenderer.invoke(IPC_CHANNELS.IMPORT_WEB_EXPORT, mode),
    exportToFile: () => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_TO_FILE),
  },

  mcp: {
    getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.MCP_GET_CONFIG),
  },
};

contextBridge.exposeInMainWorld('codixieAPI', api);

export type CodixieAPI = typeof api;
