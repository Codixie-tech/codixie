import { z } from 'zod';

export const TagDTOSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  deletedAt: z.coerce.string().nullable(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  versionHash: z.string(),
});

export const CommentDTOSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  deletedAt: z.coerce.string().nullable(),
  versionHash: z.string(),
});

export const ExportedCommentSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  deletedAt: z.coerce.string().nullable(),
  versionHash: z.string(),
  codeSnippetId: z.string(),
});

export const ExportedCodeSnippetSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  code: z.string(),
  pinned: z.boolean(),
  isEditable: z.boolean(),
  currentLanguage: z.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  versionHash: z.string(),
  deletedAt: z.coerce.string().nullable(),
  tags: z.array(z.string().uuid()),
  comments: z.array(z.string().uuid()),
});

export const StorageShema = z.object({
  codeSnippets: ExportedCodeSnippetSchema.array(),
  comments: ExportedCommentSchema.array(),
  isSidebarCollapsed: z.boolean(),
  lastSyncDate: z.any().nullable(),
  tags: TagDTOSchema.array(),
  replaceStoreVersion: z.number(),
  codeSnippetsOffline: z.array(z.string()),
  tagsOffline: z.array(z.string()),
  commentsOffline: z.array(z.string()),
});

export const AppMetaSchema = z.object({
  version: z.number(),
  dataFolder: z.string(),
  createdAt: z.string(),
});

export type TagDTO = z.infer<typeof TagDTOSchema>;
export type CommentDTO = z.infer<typeof CommentDTOSchema>;
export type CodeSnippetDTO = z.infer<typeof ExportedCodeSnippetSchema>;
