import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import { z } from 'zod';
import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import type { FileStore } from '../store';
import type { ClientCodeSnippet, ClientTag } from '../../shared/types';

type CodixieMcpOptions = {
  store: FileStore;
  version: string;
};

export type CodixieHttpMcpServer = {
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export async function startCodixieHttpMcpServer(
  options: CodixieMcpOptions & { host?: string; port?: number },
): Promise<CodixieHttpMcpServer> {
  const host = options.host ?? '127.0.0.1';
  const requestedPort = options.port ?? 0;

  const httpServer = createServer(async (req, res) => {
    try {
      await handleMcpHttpRequest(req, res, options);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null }));
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(requestedPort, host, () => {
      httpServer.off('error', reject);
      resolve();
    });
  });

  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    await closeHttpServer(httpServer);
    throw new Error('Failed to determine MCP HTTP server address.');
  }

  const url = `http://${host}:${address.port}/mcp`;
  return {
    host,
    port: address.port,
    url,
    close: () => closeHttpServer(httpServer),
  };
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

async function handleMcpHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options: CodixieMcpOptions,
): Promise<void> {
  if (req.url !== '/mcp') {
    res.writeHead(404).end('Not found');
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null }));
    return;
  }

  const server = createCodixieMcpServer(options);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  try {
    await transport.handleRequest(req, res, await readJsonBody(req));
  } finally {
    await transport.close();
    await server.close();
  }
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('MCP request body is too large.'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function closeHttpServer(server: HttpServer): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
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
