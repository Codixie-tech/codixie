import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { uid } from 'uid';
import { existsSync } from 'node:fs';
import type { AppMeta, ClientCodeSnippet, ClientTag, FileChangeEvent } from '../../shared/types';

export class FileStore {
  private dataPath: string;
  private meta: AppMeta | null = null;
  private recentlyWritten: Set<string> = new Set();

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async init(): Promise<boolean> {
    const codixiePath = path.join(this.dataPath, 'codixie');
    const metaPath = path.join(codixiePath, 'meta.json');
    const tagsPath = path.join(codixiePath, 'tags');
    const snippetsPath = path.join(codixiePath, 'snippets');

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
    const filePath = path.join(this.dataPath, 'codixie', 'tags', `${id}.json`);
    if (!existsSync(filePath)) return null;
    return this.readJsonFile<ClientTag>(filePath);
  }

  async createTag(tag: ClientTag): Promise<ClientTag> {
    const filePath = path.join(this.dataPath, 'codixie', 'tags', `${tag.id}.json`);
    await this.writeJsonFileAtomic(filePath, tag);
    return tag;
  }

  async updateTag(tag: ClientTag): Promise<ClientTag> {
    tag = { ...tag, updatedAt: new Date().toISOString(), versionHash: uid() };
    const filePath = path.join(this.dataPath, 'codixie', 'tags', `${tag.id}.json`);
    await this.writeJsonFileAtomic(filePath, tag);
    return tag;
  }

  async deleteTag(id: string): Promise<void> {
    const filePath = path.join(this.dataPath, 'codixie', 'tags', `${id}.json`);
    if (existsSync(filePath)) {
      this.markRecentlyWritten(filePath);
      await fs.unlink(filePath);
    }
  }

  getAllSnippets(): Promise<ClientCodeSnippet[]> {
    return this.readAllFiles<ClientCodeSnippet>(path.join(this.dataPath, 'codixie', 'snippets'));
  }

  async getSnippet(id: string): Promise<ClientCodeSnippet | null> {
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${id}.json`);
    if (!existsSync(filePath)) return null;
    return this.readJsonFile<ClientCodeSnippet>(filePath);
  }

  async createSnippet(snippet: ClientCodeSnippet): Promise<ClientCodeSnippet> {
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${snippet.id}.json`);
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
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${snippet.id}.json`);
    await this.writeJsonFileAtomic(filePath, snippet);
    return snippet;
  }

  async softDeleteSnippet(id: string): Promise<ClientCodeSnippet | null> {
    const snippet = await this.getSnippet(id);
    if (!snippet) return null;
    snippet.deletedAt = new Date().toISOString();
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${id}.json`);
    await this.writeJsonFileAtomic(filePath, snippet);
    return snippet;
  }

  async restoreSnippet(id: string): Promise<ClientCodeSnippet | null> {
    const snippet = await this.getSnippet(id);
    if (!snippet) return null;
    snippet.deletedAt = null;
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${id}.json`);
    await this.writeJsonFileAtomic(filePath, snippet);
    return snippet;
  }

  async permanentlyDeleteSnippet(id: string): Promise<void> {
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${id}.json`);
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
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${snippetId}.json`);
    await this.writeJsonFileAtomic(filePath, snippet);
  }

  async updateComment(snippetId: string, comment: ClientCodeSnippet['comments'][0]): Promise<void> {
    const snippet = await this.getSnippet(snippetId);
    if (!snippet) return;
    snippet.comments = snippet.comments.map((c) => (c.id === comment.id ? comment : c));
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${snippetId}.json`);
    await this.writeJsonFileAtomic(filePath, snippet);
  }

  async deleteComment(snippetId: string, commentId: string): Promise<void> {
    const snippet = await this.getSnippet(snippetId);
    if (!snippet) return;
    snippet.comments = snippet.comments.filter((c) => c.id !== commentId);
    snippet.updatedAt = new Date().toISOString();
    snippet.versionHash = uid();
    const filePath = path.join(this.dataPath, 'codixie', 'snippets', `${snippetId}.json`);
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
      await this.writeJsonFileAtomic(path.join(tagsDir, `${tag.id}.json`), tag);
    }
    for (const snippet of data.snippets) {
      await this.writeJsonFileAtomic(path.join(snippetsDir, `${snippet.id}.json`), snippet);
    }
  }

  async mergeData(data: { tags: ClientTag[]; snippets: ClientCodeSnippet[] }): Promise<void> {
    const existingTags = await this.getAllTags();
    const existingSnippets = await this.getAllSnippets();

    const existingTagIds = new Set(existingTags.map((t) => t.id));
    const existingSnippetIds = new Set(existingSnippets.map((s) => s.id));

    for (const tag of data.tags) {
      if (!existingTagIds.has(tag.id)) {
        await this.writeJsonFileAtomic(
          path.join(this.dataPath, 'codixie', 'tags', `${tag.id}.json`),
          tag,
        );
      }
    }

    for (const snippet of data.snippets) {
      if (!existingSnippetIds.has(snippet.id)) {
        await this.writeJsonFileAtomic(
          path.join(this.dataPath, 'codixie', 'snippets', `${snippet.id}.json`),
          snippet,
        );
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

  private async readJsonFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  private async readAllFiles<T>(dir: string): Promise<T[]> {
    if (!existsSync(dir)) return [];
    const files = await fs.readdir(dir);
    const results: T[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        results.push(JSON.parse(content) as T);
      } catch {
        // skip corrupted files
      }
    }
    return results;
  }
}
