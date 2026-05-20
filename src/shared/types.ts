export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type ClientTag = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  color: string;
  versionHash: string;
  deletedAt: string | null;
};

export type ClientCodeSnippet = {
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

export type ClientComment = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  versionHash: string;
  deletedAt: string | null;
};

export type AppMeta = {
  version: number;
  dataFolder: string;
  createdAt: string;
};

export type VaultInfo = {
  path: string;
  name: string;
  active: boolean;
};

export type FileChangeEvent = {
  type: 'create' | 'update' | 'delete';
  path: string;
  entityType: 'tag' | 'snippet';
  entityId: string;
};
