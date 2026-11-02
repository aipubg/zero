import { createHash } from 'node:crypto';
import { McpStdio } from './mcp-stdio.mjs';

export function mcpCapabilityName(id, name) {
  const hash = createHash('sha256').update(JSON.stringify([id, name])).digest('hex').slice(0, 12);
  return `mcp_${String(name).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 32)}_${hash}`;
}

export async function discoverMcp(entry, args) {
  const client = new McpStdio(entry, args);
  try {
    await client.start();
    const tools = []; let cursor; let pages = 0;
    do {
      if (++pages > 16) throw new Error('MCP tool catalog exceeds pagination limit');
      const page = await client.request('tools/list', cursor ? { cursor } : {});
      if (!Array.isArray(page?.tools)) throw new Error('MCP server returned no tool catalog');
      tools.push(...page.tools); if (tools.length > 256) throw new Error('MCP tool catalog exceeds 256 tools');
      if (page.nextCursor && page.nextCursor === cursor) throw new Error('MCP tool pagination did not advance');
      cursor = page.nextCursor;
    } while (cursor);
    const seen = new Set();
    for (const tool of tools) {
      if (typeof tool.name !== 'string' || !tool.name || seen.has(tool.name) || tool.inputSchema?.type !== 'object') throw new Error('Invalid executable MCP tool declaration');
      seen.add(tool.name);
    }
    if (!tools.length) throw new Error('MCP server provides no executable tools');
    return tools;
  } finally { await client.close(); }
}

export function createMcpPlugin(entry, source) {
  let client = null;
  const handlers = Object.fromEntries(source.mcpTools.map(tool => [mcpCapabilityName(source.mcpManifest.id, tool.name), async (args, signal) => {
    if (!client) throw new Error('MCP plugin is disabled');
    const forwarded = { ...args };
    const capability = mcpCapabilityName(source.mcpManifest.id, tool.name);
    for (const field of ['action', 'toolName']) if (forwarded[field] === capability && !Object.hasOwn(tool.inputSchema.properties || {}, field)) delete forwarded[field];
    const result = await client.request('tools/call', { name: tool.name, arguments: forwarded }, { signal });
    if (!Array.isArray(result?.content)) throw new Error('MCP tool returned an invalid execution result');
    return { ok: result?.isError !== true, executed: true, verified: false,
      outcome: result?.isError ? 'FAILED' : 'UNVERIFIED', result };
  }]));
  return { handlers,
    async onEnable() { const next = new McpStdio(entry, source.args); await next.start(); client = next; },
    async onDisable() { const previous = client; client = null; await previous?.close(); },
    async onDestroy() { const previous = client; client = null; await previous?.close(); },
  };
}
