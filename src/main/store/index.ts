import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { uid } from 'uid';
import { existsSync } from 'node:fs';
import type { AppMeta, ClientCodeSnippet, ClientTag } from '../../shared/types';

export class FileStore {
  private dataPath: string;
  private meta: AppMeta | null = null;
  private recentlyWritten: Set<string> = new Set();

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async init(options: { createMissing?: boolean } = {}): Promise<boolean> {
    const createMissing = options.createMissing ?? true;
    const codixiePath = path.join(this.dataPath, 'codixie');
    const metaPath = path.join(codixiePath, 'meta.json');
    const tagsPath = path.join(codixiePath, 'tags');
    const snippetsPath = path.join(codixiePath, 'snippets');

    if (!createMissing) {
      if (existsSync(metaPath)) {
        this.meta = await this.readJsonFile<AppMeta>(metaPath);
        return false;
      }
      this.meta = null;
      return true;
    }

    if (!existsSync(codixiePath)) {
      await fs.mkdir(codixiePath, { recursive: true });
    }
    if (!existsSync(tagsPath)) {
      await fs.mkdir(tagsPath, { recursive: true });
    }
    if (!existsSync(snippetsPath)) {
      await fs.mkdir(snippetsPath, { recursive: true });
    }

    if (existsSync(metaPath)) {
      const data = await this.readJsonFile<AppMeta>(metaPath);
      this.meta = data;
      return false;
    }

    return true;
  }

  async initializeNewVault(): Promise<void> {
    const meta: AppMeta = {
      version: 1,
      dataFolder: this.dataPath,
      createdAt: new Date().toISOString(),
    };

    await this.writeJsonFileAtomic(path.join(this.dataPath, 'codixie', 'meta.json'), meta);
    this.meta = meta;

    await this.seedTutorialData();
  }

  private async seedTutorialData(): Promise<void> {
    const tagId = uuidv4();

    const tutorialTag: ClientTag = {
      id: tagId,
      name: 'Tutorial',
      color: '#00c231',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionHash: uid(),
      deletedAt: null,
    };

    const snippet1: ClientCodeSnippet = {
      id: uuidv4(),
      title: 'How to Center a Div?',
      code: '<html>\r\n  <head>\r\n    <style>\r\n      .parent {\r\n        display: flex;\r\n        align-items: center;\r\n        justify-content: center;\r\n        height: 100dvh;\r\n      }\r\n    </style>\r\n  </head>\r\n  <body>\r\n    <div class="parent">\r\n      <div class="child">\r\n        Hello World!\r\n      </div>\r\n    </div>\r\n  </body>\r\n</html>',
      pinned: false,
      isEditable: false,
      currentLanguage: 'html',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [tagId],
      comments: [],
      versionHash: uid(),
      deletedAt: null,
    };

    const snippet2: ClientCodeSnippet = {
      id: uuidv4(),
      title: 'How use it? ',
      code: '// Keep your code-snippets here!\n// Share your code-snippets for friends and coworkers!',
      pinned: true,
      isEditable: true,
      currentLanguage: 'javascript',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [tagId],
      comments: [],
      versionHash: uid(),
      deletedAt: null,
    };

    await this.createTag(tutorialTag);
    await this.createSnippet(snippet1);
    await this.createSnippet(snippet2);
  }

  getMeta(): AppMeta | null {
    return this.meta;
  }

  getCodixiePath(): string {
    return path.join(this.dataPath, 'codixie');
  }

  getDataPath(): string {
    return this.dataPath;
  }

  getAllTags(): Promise<ClientTag[]> {
    return this.readAllFiles<ClientTag>(path.join(this.dataPath, 'codixie', 'tags'));
  }

  async getTag(id: string): Promise<ClientTag | null> {
    const filePath = this.getTagPath(id);
    if (!existsSync(filePath)) return null;
    return this.readJsonFile<ClientTag>(filePath);
  }

  async createTag(tag: ClientTag): Promise<ClientTag> {
    const filePath = this.getTagPath(tag.id);
    await this.writeJsonFileAtomic(filePath, tag);
    return tag;
  }

  async updateTag(tag: ClientTag): Promise<ClientTag> {
    tag = { ...tag, updatedAt: new Date().toISOString(), versionHash: uid() };
    const filePath = this.getTagPath(tag.id);
    await this.writeJsonFileAtomic(filePath, tag);
    return tag;
  }

  async deleteTag(id: string): Promise<void> {
    const filePath = this.getTagPath(id);
    if (existsSync(filePath)) {
      this.markRecentlyWritten(filePath);
      await fs.unlink(filePath);
    }
  }

  getAllSnippets(): Promise<ClientCodeSnippet[]> {
    return this.readAllFiles<ClientCodeSnippet>(path.join(this.dataPath, 'codixie', 'snippets'));
  }

  async getSnippet(id: string): Promise<ClientCodeSnippet | null> {
    const filePath = this.getSnippetPath(id);
    if (!existsSync(filePath)) return null;
    return this.readJsonFile<ClientCodeSnippet>(filePath);
  }

  async createSnippet(snippet: ClientCodeSnippet): Promise<ClientCodeSnippet> {
    const filePath = this.getSnippetPath(snippet.id);
    await this.writeJsonFileAtomic(filePath, snippet);
    return snippet;
  }

  async updateSnippet(snippet: ClientCodeSnippet): Promise<ClientCodeSnippet> {
    const existing = await this.getSnippet(snippet.id);
    snippet = {
      ...snippet,
      comments: snippet.comments ?? existing?.comments ?? [],
      updatedAt: new Date().toISOString(),
      versionHash: uid(),
    };
    const filePath = this.getSnippetPath(snippet.id);
    await this.writeJsonFileAtomic(filePath, snippet);
    return snippet;
  }

  async softDeleteSnippet(id: string): Promise<ClientCodeSnippet | null> {
    const snippet = await this.getSnippet(id);
    if (!snippet) return null;
    snippet.deletedAt = new Date().toISOString();
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = this.getSnippetPath(id);
    await this.writeJsonFileAtomic(filePath, snippet);
    return snippet;
  }

  async restoreSnippet(id: string): Promise<ClientCodeSnippet | null> {
    const snippet = await this.getSnippet(id);
    if (!snippet) return null;
    snippet.deletedAt = null;
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = this.getSnippetPath(id);
    await this.writeJsonFileAtomic(filePath, snippet);
    return snippet;
  }

  async permanentlyDeleteSnippet(id: string): Promise<void> {
    const filePath = this.getSnippetPath(id);
    if (existsSync(filePath)) {
      this.markRecentlyWritten(filePath);
      await fs.unlink(filePath);
    }
  }

  async addComment(snippetId: string, comment: ClientCodeSnippet['comments'][0]): Promise<void> {
    const snippet = await this.getSnippet(snippetId);
    if (!snippet) return;
    snippet.comments.push(comment);
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = this.getSnippetPath(snippetId);
    await this.writeJsonFileAtomic(filePath, snippet);
  }

  async updateComment(snippetId: string, comment: ClientCodeSnippet['comments'][0]): Promise<void> {
    const snippet = await this.getSnippet(snippetId);
    if (!snippet) return;
    snippet.comments = snippet.comments.map((c) => (c.id === comment.id ? comment : c));
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = this.getSnippetPath(snippetId);
    await this.writeJsonFileAtomic(filePath, snippet);
  }

  async deleteComment(snippetId: string, commentId: string): Promise<void> {
    const snippet = await this.getSnippet(snippetId);
    if (!snippet) return;
    snippet.comments = snippet.comments.filter((c) => c.id !== commentId);
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = this.getSnippetPath(snippetId);
    await this.writeJsonFileAtomic(filePath, snippet);
  }

  async replaceAllData(data: { tags: ClientTag[]; snippets: ClientCodeSnippet[] }): Promise<void> {
    const tagsDir = path.join(this.dataPath, 'codixie', 'tags');
    const snippetsDir = path.join(this.dataPath, 'codixie', 'snippets');

    const existingTags = await fs.readdir(tagsDir);
    for (const f of existingTags) {
      await fs.unlink(path.join(tagsDir, f));
    }

    const existingSnippets = await fs.readdir(snippetsDir);
    for (const f of existingSnippets) {
      await fs.unlink(path.join(snippetsDir, f));
    }

    for (const tag of data.tags) {
      await this.writeJsonFileAtomic(this.getTagPath(tag.id), tag);
    }
    for (const snippet of data.snippets) {
      await this.writeJsonFileAtomic(this.getSnippetPath(snippet.id), snippet);
    }
  }

  async mergeData(data: { tags: ClientTag[]; snippets: ClientCodeSnippet[] }): Promise<void> {
    const existingTags = await this.getAllTags();
    const existingSnippets = await this.getAllSnippets();

    const existingTagIds = new Set(existingTags.map((t) => t.id));
    const existingSnippetIds = new Set(existingSnippets.map((s) => s.id));

    for (const tag of data.tags) {
      if (!existingTagIds.has(tag.id)) {
        await this.writeJsonFileAtomic(this.getTagPath(tag.id), tag);
      }
    }

    for (const snippet of data.snippets) {
      if (!existingSnippetIds.has(snippet.id)) {
        await this.writeJsonFileAtomic(this.getSnippetPath(snippet.id), snippet);
      }
    }
  }

  async loadFromNewPath(newDataPath: string): Promise<boolean> {
    this.dataPath = newDataPath;
    this.meta = null;
    return this.init();
  }

  isRecentlyWritten(filePath: string): boolean {
    return this.recentlyWritten.has(filePath);
  }

  markRecentlyWritten(filePath: string): void {
    this.recentlyWritten.add(filePath);
    setTimeout(() => {
      this.recentlyWritten.delete(filePath);
    }, 2000);
  }

  private async writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
    const tmpPath = filePath + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tmpPath, filePath);
    this.markRecentlyWritten(filePath);
  }

  private getTagPath(id: string): string {
    return this.getEntityFilePath(path.join(this.dataPath, 'codixie', 'tags'), id);
  }

  private getSnippetPath(id: string): string {
    return this.getEntityFilePath(path.join(this.dataPath, 'codixie', 'snippets'), id);
  }

  private getEntityFilePath(entityDir: string, id: string): string {
    if (!this.isSafeEntityId(id)) {
      throw new Error(`Invalid entity id: ${id}`);
    }

    const resolvedDir = path.resolve(entityDir);
    const resolvedPath = path.resolve(resolvedDir, `${id}.json`);
    const relativePath = path.relative(resolvedDir, resolvedPath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Invalid entity id: ${id}`);
    }

    return resolvedPath;
  }

  private isSafeEntityId(id: string): boolean {
    if (!id || id === '.' || id === '..' || id.includes('\0')) return false;
    let decoded = id;
    try {
      decoded = decodeURIComponent(id);
    } catch {
      return false;
    }

    return decoded === id && !/[\\/]/.test(id) && id !== '.' && id !== '..';
  }

  private async readJsonFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  private async readAllFiles<T extends { id: string }>(dir: string): Promise<T[]> {
    if (!existsSync(dir)) return [];
    const files = await fs.readdir(dir);

    const entries: Array<{ filename: string; data: T }> = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        entries.push({ filename: file, data: JSON.parse(content) as T });
      } catch {
        // skip corrupted files
      }
    }

    const byId = new Map<string, Array<{ filename: string; data: T }>>();
    for (const entry of entries) {
      const list = byId.get(entry.data.id) ?? [];
      list.push(entry);
      byId.set(entry.data.id, list);
    }

    const results: T[] = [];
    for (const [id, group] of byId) {
      if (group.length === 1) {
        results.push(group[0].data);
        continue;
      }

      // Sync conflict copies (Dropbox, Google Drive, etc.) — original matches {id}.json
      const originalIdx = group.findIndex((e) => e.filename === `${id}.json`);
      const original = originalIdx >= 0 ? group[originalIdx] : group[0];
      results.push(original.data);

      const conflicts = originalIdx >= 0
        ? group.filter((_, i) => i !== originalIdx)
        : group.slice(1);

      for (const conflict of conflicts) {
        const newId = uuidv4();
        const fixed = { ...conflict.data, id: newId } as T;

        const newPath = path.join(dir, `${newId}.json`);
        await this.writeJsonFileAtomic(newPath, fixed);

        const oldPath = path.join(dir, conflict.filename);
        this.markRecentlyWritten(oldPath);
        try {
          await fs.unlink(oldPath);
        } catch {
          // already removed
        }

        results.push(fixed);
      }
    }

    return results;
  }
}
