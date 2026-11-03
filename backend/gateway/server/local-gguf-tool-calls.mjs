import { randomUUID } from 'node:crypto';

// Convert generated tool envelopes to the OpenAI wire contract. This only parses
// requests; authorization, validation and execution belong to the task executor.
export function parseLocalToolCalls(content) {
  const calls = []; let cursor = 0;
  while (cursor < content.length) {
    const opening = content.indexOf('<tool_call>', cursor);
    const strayClosing = content.indexOf('</tool_call>', cursor);
    if (strayClosing !== -1 && (opening === -1 || strayClosing < opening)) throw new Error('Unexpected local tool closing tag');
    if (opening === -1) break;
    let start = opening + '<tool_call>'.length;
    while (/\s/.test(content[start] || '') && start < content.length) start++;
    if (content[start] !== '{') throw new Error('Local tool call requires a JSON object');
    let depth = 0; let quoted = false; let escaped = false; let end = start;
    for (; end < content.length; end++) {
      const char = content[end];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === '{') depth++;
      else if (char === '}' && --depth === 0) { end++; break; }
    }
    if (depth !== 0 || quoted) throw new Error('Incomplete local tool call');
    const parsed = JSON.parse(content.slice(start, end));
    let closing = end;
    while (/\s/.test(content[closing] || '') && closing < content.length) closing++;
    if (!content.startsWith('</tool_call>', closing)) throw new Error('Incomplete local tool call');
    cursor = closing + '</tool_call>'.length;
    if (!parsed || typeof parsed.name !== 'string' || !parsed.name.trim()) throw new Error('Local tool call requires a name');
    const args = parsed.arguments;
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Local tool arguments must be an object');
    calls.push({ id: `call-${randomUUID()}`, type: 'function', function: { name: parsed.name, arguments: JSON.stringify(args) } });
  }
  return calls.length ? calls : undefined;
}
