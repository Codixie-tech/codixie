import type { CodixieAPI } from '../../preload';

declare global {
  interface Window {
    codixieAPI: CodixieAPI;
  }

  type Nullable<T> = {
    [P in keyof T]: T[P] | null;
  };

  type ClientTag = {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    color: string;
    versionHash: string;
    deletedAt: string | null;
  };

  type ClientCodeSnippet = {
    id: string;
    title: string;
    code: string;
    pinned: boolean;
    isEditable: boolean;
    currentLanguage: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    comments: ClientComment[];
    versionHash: string;
    deletedAt: string | null;
  };

  type ClientComment = {
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
    versionHash: string;
    deletedAt: string | null;
  };

  type FileChangeEvent = {
    type: 'create' | 'update' | 'delete';
    path: string;
    entityType: 'tag' | 'snippet';
    entityId: string;
  };

  type AppMeta = {
    version: number;
    dataFolder: string;
    createdAt: string;
  };

  type VaultInfo = {
    path: string;
    name: string;
    active: boolean;
  };
}
