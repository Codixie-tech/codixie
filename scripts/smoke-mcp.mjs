import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const command = process.env.MCP_COMMAND;
const args = process.env.MCP_ARGS ? JSON.parse(process.env.MCP_ARGS) : ['--mcp'];

if (!command) {
  throw new Error('Set MCP_COMMAND to a packaged Codixie executable before running this smoke test.');
}

const client = new Client({ name: 'codixie-smoke', version: '1.0.0' });
const transport = new StdioClientTransport({ command, args, stderr: 'pipe' });

transport.stderr?.on('data', (chunk) => {
  process.stderr.write(chunk);
});

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
} finally {
  await client.close();
}
