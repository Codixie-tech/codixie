import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Socket } from 'node:net';
import { createWriteStream } from 'node:fs';
import { z } from 'zod';
import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import type { FileStore } from '../store';
import type { ClientCodeSnippet, ClientTag } from '../../shared/types';

type CodixieMcpOptions = {
  store: FileStore;
  version: string;
};

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const safeEntityIdSchema = z.string().min(1).refine(isSafeEntityId, {
  message: 'Invalid entity id.',
});

export async function startCodixieMcpServer(options: CodixieMcpOptions): Promise<void> {
  const server = createCodixieMcpServer(options);
  const stdin = new Socket({ fd: 0, readable: true, writable: false });
  const stdout = createWriteStream(null, { fd: 1 });
  const transport = new StdioServerTransport(stdin, stdout);
  await server.connect(transport);
}

export function createCodixieMcpServer({ store, version }: CodixieMcpOptions): McpServer {
  const server = new McpServer({ name: 'codixie', version });

  server.registerTool(
    'get_vault_info',
    {
      title: 'Get Vault Info',
      description: 'Return Codixie vault metadata and object counts.',
      annotations: readOnlyAnnotations,
    },
    async () => jsonToolResult(await getVaultInfo(store)),
  );

  server.registerTool(
    'list_tags',
    {
      title: 'List Tags',
      description: 'List Codixie tags.',
      inputSchema: {
        includeDeleted: z.boolean().optional().describe('Include soft-deleted tags.'),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ includeDeleted = false }) => {
      const tags = filterDeleted(await store.getAllTags(), includeDeleted).map(tagSummary);
      return jsonToolResult({ tags });
    },
  );

  server.registerTool(
    'get_tag',
    {
      title: 'Get Tag',
      description: 'Read one Codixie tag by id.',
      inputSchema: {
        id: safeEntityIdSchema.describe('Tag id.'),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ id }) => {
      const tag = await store.getTag(id);
      if (!tag) return toolError(`Tag not found: ${id}`);
      return jsonToolResult({ tag });
    },
  );

  server.registerTool(
    'list_snippets',
    {
      title: 'List Snippets',
      description: 'List Codixie snippets with optional query and tag filters.',
      inputSchema: {
        query: z.string().optional().describe('Case-insensitive search over title, code, and language.'),
        tagId: safeEntityIdSchema.optional().describe('Only include snippets with this tag id.'),
        includeDeleted: z.boolean().optional().describe('Include soft-deleted snippets.'),
        limit: z.number().int().positive().max(200).optional().describe('Maximum number of snippets to return.'),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ query, tagId, includeDeleted = false, limit = 50 }) => {
      const snippets = filterSnippets(await store.getAllSnippets(), { query, tagId, includeDeleted })
        .slice(0, limit)
        .map(snippetSummary);
      return jsonToolResult({ snippets });
    },
  );

  server.registerTool(
    'get_snippet',
    {
      title: 'Get Snippet',
      description: 'Read one Codixie snippet by id, including code and comments.',
      inputSchema: {
        id: safeEntityIdSchema.describe('Snippet id.'),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ id }) => {
      const snippet = await store.getSnippet(id);
      if (!snippet) return toolError(`Snippet not found: ${id}`);
      return jsonToolResult({ snippet });
    },
  );

  server.registerResource(
    'vault-meta',
    'codixie://vault/meta',
    {
      title: 'Codixie Vault Metadata',
      description: 'Current Codixie vault metadata and counts.',
      mimeType: 'application/json',
    },
    async () => jsonResource('codixie://vault/meta', await getVaultInfo(store)),
  );

  server.registerResource(
    'tag',
    new ResourceTemplate('codixie://tags/{id}', {
      list: async () => ({
        resources: (await store.getAllTags()).map((tag) => ({
          uri: tagUri(tag.id),
          name: tag.name || tag.id,
          title: tag.name || tag.id,
          description: `Codixie tag ${tag.id}`,
          mimeType: 'application/json',
        })),
      }),
    }),
    {
      title: 'Codixie Tag',
      description: 'Codixie tag JSON by id.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const id = safeTemplateId(variables.id);
      const tag = await store.getTag(id);
      if (!tag) throw new Error(`Tag not found: ${id}`);
      return jsonResource(uri.href, { tag });
    },
  );

  server.registerResource(
    'snippet',
    new ResourceTemplate('codixie://snippets/{id}', {
      list: async () => ({
        resources: (await store.getAllSnippets()).map((snippet) => ({
          uri: snippetUri(snippet.id),
          name: snippet.title || snippet.id,
          title: snippet.title || snippet.id,
          description: `${snippet.currentLanguage} snippet ${snippet.id}`,
          mimeType: 'application/json',
        })),
      }),
    }),
    {
      title: 'Codixie Snippet',
      description: 'Codixie snippet JSON by id.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const id = safeTemplateId(variables.id);
      const snippet = await store.getSnippet(id);
      if (!snippet) throw new Error(`Snippet not found: ${id}`);
      return jsonResource(uri.href, { snippet });
    },
  );

  return server;
}

async function getVaultInfo(store: FileStore) {
  const [tags, snippets] = await Promise.all([store.getAllTags(), store.getAllSnippets()]);
  return {
    dataPath: store.getDataPath(),
    meta: store.getMeta(),
    tagCount: tags.length,
    snippetCount: snippets.length,
    activeTagCount: filterDeleted(tags, false).length,
    activeSnippetCount: filterDeleted(snippets, false).length,
  };
}

function filterSnippets(
  snippets: ClientCodeSnippet[],
  filters: { query?: string; tagId?: string; includeDeleted: boolean },
): ClientCodeSnippet[] {
  const query = filters.query?.trim().toLowerCase();

  return filterDeleted(snippets, filters.includeDeleted).filter((snippet) => {
    if (filters.tagId && !snippet.tags.includes(filters.tagId)) return false;
    if (!query) return true;
    return [snippet.title, snippet.code, snippet.currentLanguage]
      .some((value) => value.toLowerCase().includes(query));
  });
}

function filterDeleted<T extends { deletedAt: string | null }>(items: T[], includeDeleted: boolean): T[] {
  if (includeDeleted) return items;
  return items.filter((item) => item.deletedAt === null);
}

function tagSummary(tag: ClientTag) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    deletedAt: tag.deletedAt,
    resourceUri: tagUri(tag.id),
  };
}

function snippetSummary(snippet: ClientCodeSnippet) {
  return {
    id: snippet.id,
    title: snippet.title,
    currentLanguage: snippet.currentLanguage,
    pinned: snippet.pinned,
    isEditable: snippet.isEditable,
    tags: snippet.tags,
    commentCount: snippet.comments.length,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
    deletedAt: snippet.deletedAt,
    resourceUri: snippetUri(snippet.id),
  };
}

function jsonToolResult(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function toolError(message: string): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
}

function jsonResource(uri: string, data: unknown): ReadResourceResult {
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function templateVariable(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function safeTemplateId(value: string | string[]): string {
  return safeEntityIdSchema.parse(templateVariable(value));
}

function isSafeEntityId(id: string): boolean {
  if (!id || id === '.' || id === '..' || id.includes('\0')) return false;
  let decoded = id;
  try {
    decoded = decodeURIComponent(id);
  } catch {
    return false;
  }

  return decoded === id && !/[\\/]/.test(id) && id !== '.' && id !== '..';
}

function tagUri(id: string): string {
  return `codixie://tags/${encodeURIComponent(id)}`;
}

function snippetUri(id: string): string {
  return `codixie://snippets/${encodeURIComponent(id)}`;
}
