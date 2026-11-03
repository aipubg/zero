// Convert generated tool envelopes to the OpenAI wire contract. This only parses
// requests; authorization, validation and execution belong to the task executor.
export function parseLocalToolCalls(content) {
  const matches = [...content.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/g)];
  if (!matches.length) {
    if (content.includes('<tool_call>')) throw new Error('Incomplete local tool call');
    return undefined;
  }
  const remainder = content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '');
  if (remainder.includes('<tool_call>')) throw new Error('Incomplete local tool call');
  return matches.map((match, index) => {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed || typeof parsed.name !== 'string' || !parsed.name.trim()) throw new Error('Local tool call requires a name');
    const args = parsed.arguments;
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Local tool arguments must be an object');
    return { id: `call-${Date.now()}-${index}`, type: 'function', function: { name: parsed.name, arguments: JSON.stringify(args) } };
  });
}
