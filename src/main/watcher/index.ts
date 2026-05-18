import chokidar, { type FSWatcher } from 'chokidar';
import path from 'node:path';
import type { FileChangeEvent } from '../../shared/types';
import type { FileStore } from '../store';

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private store: FileStore;

  constructor(store: FileStore) {
    this.store = store;
  }

  start(onChange: (event: FileChangeEvent) => void): void {
    const tagsDir = path.join(this.store.getCodixiePath(), 'tags');
    const snippetsDir = path.join(this.store.getCodixiePath(), 'snippets');

    this.watcher = chokidar.watch([tagsDir, snippetsDir], {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
      ignored: /(^|[/\\])\../,
    });

    const getEntityType = (filePath: string): 'tag' | 'snippet' | null => {
      if (filePath.includes(`${path.sep}tags${path.sep}`)) return 'tag';
      if (filePath.includes(`${path.sep}snippets${path.sep}`)) return 'snippet';
      return null;
    };

    const getEntityId = (filePath: string): string => {
      return path.basename(filePath, '.json');
    };

    this.watcher.on('add', (filePath) => {
      if (this.store.isRecentlyWritten(filePath)) return;
      const entityType = getEntityType(filePath);
      if (!entityType) return;
      onChange({ type: 'create', path: filePath, entityType, entityId: getEntityId(filePath) });
    });

    this.watcher.on('change', (filePath) => {
      if (this.store.isRecentlyWritten(filePath)) return;
      const entityType = getEntityType(filePath);
      if (!entityType) return;
      onChange({ type: 'update', path: filePath, entityType, entityId: getEntityId(filePath) });
    });

    this.watcher.on('unlink', (filePath) => {
      if (this.store.isRecentlyWritten(filePath)) return;
      const entityType = getEntityType(filePath);
      if (!entityType) return;
      onChange({ type: 'delete', path: filePath, entityType, entityId: getEntityId(filePath) });
    });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
