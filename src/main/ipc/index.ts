import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';
import type { FileStore } from '../store';
import { FileWatcher } from '../watcher';
import { importFromWebExport, exportToWebFormat } from '../store/importExport';
import fs from 'node:fs/promises';

export function registerIpcHandlers(store: FileStore, mainWindow: BrowserWindow) {
  const watcher = new FileWatcher(store);

  const startWatcher = () => {
    watcher.start((event) => {
      mainWindow.webContents.send(IPC_CHANNELS.FILE_CHANGED, event);
    });
  };

  ipcMain.handle(IPC_CHANNELS.APP_IS_FIRST_LAUNCH, async () => {
    return store.getMeta() === null;
  });

  ipcMain.handle(IPC_CHANNELS.APP_GET_META, async () => {
    return store.getMeta();
  });

  ipcMain.handle(IPC_CHANNELS.APP_GET_DATA_PATH, async () => {
    return store.getDataPath();
  });

  ipcMain.handle(IPC_CHANNELS.APP_SELECT_DATA_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select folder for Codixie data',
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.APP_INITIAL_LOAD, async () => {
    const tags = await store.getAllTags();
    const snippets = await store.getAllSnippets();
    const meta = store.getMeta();
    startWatcher();
    return { tags, snippets, meta };
  });

  ipcMain.handle(IPC_CHANNELS.APP_CHANGE_DATA_FOLDER, async (_e, newPath: string) => {
    watcher.stop();
    const isFirst = await store.loadFromNewPath(newPath);
    if (!isFirst) {
      startWatcher();
    }
    return isFirst;
  });

  ipcMain.handle(IPC_CHANNELS.APP_INITIALIZE_VAULT, async (_e, newPath: string, username: string) => {
    watcher.stop();
    await store.loadFromNewPath(newPath);
    await store.initializeNewVault(username);
    startWatcher();
    const tags = await store.getAllTags();
    const snippets = await store.getAllSnippets();
    const meta = store.getMeta();
    return { tags, snippets, meta };
  });

  // Tags
  ipcMain.handle(IPC_CHANNELS.TAG_GET_ALL, async () => store.getAllTags());
  ipcMain.handle(IPC_CHANNELS.TAG_CREATE, async (_e, tag: ClientTag) => store.createTag(tag));
  ipcMain.handle(IPC_CHANNELS.TAG_UPDATE, async (_e, tag: ClientTag) => store.updateTag(tag));
  ipcMain.handle(IPC_CHANNELS.TAG_DELETE, async (_e, id: string) => store.deleteTag(id));

  // Snippets
  ipcMain.handle(IPC_CHANNELS.SNIPPET_GET_ALL, async () => store.getAllSnippets());
  ipcMain.handle(IPC_CHANNELS.SNIPPET_CREATE, async (_e, snippet: ClientCodeSnippet) => store.createSnippet(snippet));
  ipcMain.handle(IPC_CHANNELS.SNIPPET_UPDATE, async (_e, snippet: ClientCodeSnippet) => store.updateSnippet(snippet));
  ipcMain.handle(IPC_CHANNELS.SNIPPET_SOFT_DELETE, async (_e, id: string) => store.softDeleteSnippet(id));
  ipcMain.handle(IPC_CHANNELS.SNIPPET_RESTORE, async (_e, id: string) => store.restoreSnippet(id));
  ipcMain.handle(IPC_CHANNELS.SNIPPET_PERMANENT_DELETE, async (_e, id: string) => store.permanentlyDeleteSnippet(id));
  ipcMain.handle(IPC_CHANNELS.SNIPPET_PIN, async (_e, id: string, pinned: boolean) => {
    const snippet = await store.getSnippet(id);
    if (!snippet) return null;
    snippet.pinned = pinned;
    return store.updateSnippet(snippet);
  });
  ipcMain.handle(IPC_CHANNELS.SNIPPET_BLOCK_EDIT, async (_e, id: string, isEditable: boolean) => {
    const snippet = await store.getSnippet(id);
    if (!snippet) return null;
    snippet.isEditable = isEditable;
    return store.updateSnippet(snippet);
  });
  ipcMain.handle(IPC_CHANNELS.SNIPPET_CHANGE_TAGS, async (_e, id: string, tags: string[]) => {
    const snippet = await store.getSnippet(id);
    if (!snippet) return null;
    snippet.tags = tags;
    return store.updateSnippet(snippet);
  });

  // Comments
  ipcMain.handle(IPC_CHANNELS.COMMENT_ADD, async (_e, snippetId: string, comment: ClientComment) => {
    await store.addComment(snippetId, comment);
  });
  ipcMain.handle(IPC_CHANNELS.COMMENT_UPDATE, async (_e, snippetId: string, comment: ClientComment) => {
    await store.updateComment(snippetId, comment);
  });
  ipcMain.handle(IPC_CHANNELS.COMMENT_DELETE, async (_e, snippetId: string, commentId: string) => {
    await store.deleteComment(snippetId, commentId);
  });

  // User
  ipcMain.handle(IPC_CHANNELS.USER_GET, async () => store.getMeta());
  ipcMain.handle(IPC_CHANNELS.USER_SET_USERNAME, async (_e, username: string) => {
    await store.setUsername(username);
  });

  // Import/Export
  ipcMain.handle(IPC_CHANNELS.IMPORT_WEB_EXPORT, async (_e, mode: 'replace' | 'merge') => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
      title: 'Import Codixie Web Export',
    });
    if (result.canceled || !result.filePaths[0]) return { success: false, error: 'cancelled' };
    try {
      const content = await fs.readFile(result.filePaths[0], 'utf-8');
      await importFromWebExport(store, content, mode);
      const tags = await store.getAllTags();
      const snippets = await store.getAllSnippets();
      return { success: true, tags, snippets };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_TO_FILE, async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'code-buffer.project.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      title: 'Export Codixie Data',
    });
    if (result.canceled || !result.filePath) return { success: false };
    try {
      const content = await exportToWebFormat(store);
      await fs.writeFile(result.filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // MCP
  ipcMain.handle(IPC_CHANNELS.MCP_GET_CONFIG, async () => {
    const execPath = process.execPath;
    return {
      command: execPath,
      args: ['--mcp'],
      config: JSON.stringify(
        {
          mcpServers: {
            codixie: {
              command: execPath,
              args: ['--mcp'],
            },
          },
        },
        null,
        2,
      ),
    };
  });
}
