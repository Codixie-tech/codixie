import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = process.env.MCP_HTTP_URL;

if (!url) {
  throw new Error('Set MCP_HTTP_URL to the running Codixie MCP HTTP endpoint, for example http://127.0.0.1:12345/mcp.');
}

const client = new Client({ name: 'codixie-http-smoke', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(new URL(url));

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const toolNames = new Set(tools.tools.map((tool) => tool.name));
  for (const name of ['get_vault_info', 'list_snippets', 'get_snippet', 'list_tags', 'get_tag']) {
    if (!toolNames.has(name)) {
      throw new Error(`Missing MCP tool: ${name}`);
    }
  }

  const resources = await client.listResources();
  if (!resources.resources.some((resource) => resource.uri === 'codixie://vault/meta')) {
    throw new Error('Missing MCP resource: codixie://vault/meta');
  }

  const vaultInfo = await client.callTool({ name: 'get_vault_info', arguments: {} });
  if (!vaultInfo.content?.some((item) => item.type === 'text')) {
    throw new Error('get_vault_info did not return text content');
  }

  const traversal = await client.callTool({ name: 'get_snippet', arguments: { id: '../meta' } });
  if (!traversal.isError) {
    throw new Error('Traversal id unexpectedly succeeded.');
  }
} finally {
  await client.close();
}
