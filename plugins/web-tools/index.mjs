import { SearchEngine } from '../../packages/research-engine/search.mjs';

const search = new SearchEngine();

/**
 * Web Tools Plugin for Project Zero (Hermes-compatible)
 */

export default {
  name: "web-tools",
  description: "Web search and content extraction tools",

  async on_startup(context = {}) {
    context?.logger?.info?.("[web-tools] Web tools plugin initialized");
  },

  register_tools(registerFn) {
    registerFn({
      name: "web_search",
      description: "Search the web for up-to-date information, documentation, and real-time facts.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          maxResults: { type: "number", description: "Maximum results to return (default 5)" },
        },
        required: ["query"],
        additionalProperties: false,
      },
      async execute({ query, maxResults = 5 }) {
        const result = await search.search(query, { limit: maxResults });
        return { ...result, ok: result.status === 'ok', results: result.citations };
      },
    });

    registerFn({
      name: "web_extract",
      description: "Extract readable text and main content from a specified URL.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The web page URL to extract text from" },
        },
        required: ["url"],
        additionalProperties: false,
      },
      async execute({ url }) {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Expected an HTTP(S) URL without credentials');
        const response = await fetch(parsed, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) return { ok: false, status: 'failed', url: parsed.href, httpStatus: response.status, content: '' };
        const reader = response.body.getReader();
        const chunks = []; let bytes = 0; let truncated = false;
        try {
          while (true) {
            const next = await reader.read();
            if (next.done) break;
            const remaining = 1024 * 1024 - bytes;
            chunks.push(next.value.subarray(0, remaining));
            bytes += Math.min(next.value.length, remaining);
            if (bytes >= 1024 * 1024) { truncated = true; await reader.cancel(); break; }
          }
        } finally { reader.releaseLock(); }
        return { ok: true, status: 'retrieved', url: response.url, httpStatus: response.status,
          contentType: response.headers.get('content-type'), content: Buffer.concat(chunks).toString('utf8'),
          bytes, truncated, verified: false, untrustedContent: true, retrievedAt: new Date().toISOString() };
      },
    });
  },
};
