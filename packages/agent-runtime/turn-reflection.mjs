// Turn Reflection: after some replies, Zero quietly looks back at the chat and
// decides whether anything is worth keeping — a lasting fact for the Notebook,
// or a working procedure to reuse. It runs in the background with its own
// small tool set, never writes into the chat, and never delays the reply.

export const REFLECTION_TOOLS = ['notebook', 'procedure_learn'];

/** Reflect after a busy turn (many tool actions) or every few owner messages. */
export function shouldReflect({ enabled = true, toolActions = 0, ownerMessagesSince = 0, minActions = 3, every = 6 } = {}) {
  if (!enabled) return false;
  return toolActions >= minActions || ownerMessagesSince >= every;
}

const clip = (text, max) => (text.length > max ? `${text.slice(0, max)} …[cut]` : text);

export function reflectionMessages(transcript = [], { maxMessages = 30 } = {}) {
  const recent = transcript.filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'tool').slice(-maxMessages);
  const lines = recent.map(m => {
    const who = m.role === 'user' ? 'OWNER' : m.role === 'assistant' ? 'ZERO' : 'TOOL RESULT';
    const calls = Array.isArray(m.tool_calls) && m.tool_calls.length ? ` [called ${m.tool_calls.map(c => c.function?.name || c.name).join(', ')}]` : '';
    return `${who}${calls}: ${clip(typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? ''), m.role === 'tool' ? 800 : 3000)}`;
  });
  return [
    { role: 'system', content: `You are Zero, reviewing a conversation you just had with the owner, to decide whether anything is worth keeping for future chats. You are not talking to the owner now.

You can keep two kinds of things:
1. Notebook (notebook tool), two books:
   - book "owner": who the owner is — preferences, language, how they like things done, details they told you about themselves.
   - book "zero": facts about this computer and setup — paths, app quirks, settings, what works and what does not.
   One fact goes into ONE book. Read the notebook first (action "read") and replace an existing entry rather than adding a near-duplicate. Keep entries to one short line.
2. A procedure (procedure_learn): the exact working steps of a multi-step task that succeeded, especially one that needed a workaround, so it can be reused.

Rules:
- Keep only what the conversation shows: something the owner said, or a tool result. Never guess the owner's traits, mood, skill or preferences from the topic or tone.
- A one-off request is not a standing preference, unless the owner said "always", "from now on", "remember", or said they like/dislike something.
- No secrets, passwords or keys.
- If nothing is worth keeping, reply exactly: Nothing to keep.` },
    { role: 'user', content: `CONVERSATION:\n${lines.join('\n\n')}` },
  ];
}

/**
 * Run one reflection. `runTool(name, args)` executes a tool and returns its
 * result; only REFLECTION_TOOLS are offered and accepted.
 * @returns {{ saved: Array<{tool:string,args:object,ok:boolean}>, rounds: number, said: string }}
 */
export async function runTurnReflection({ modelFabric, model, transcript, toolDefinitions, runTool, signal, maxRounds = 3 }) {
  const messages = reflectionMessages(transcript);
  const tools = toolDefinitions.filter(def => REFLECTION_TOOLS.includes(def.function?.name));
  const saved = [];
  let said = '';
  let rounds = 0;
  for (; rounds < maxRounds; rounds++) {
    signal?.throwIfAborted?.();
    const response = await modelFabric.executeChat({ ...(model ? { model } : {}), messages, tools, tool_choice: 'auto', max_tokens: 800, stream: false }, { signal });
    const message = response?.data?.choices?.[0]?.message;
    if (!message) break;
    messages.push({ role: 'assistant', content: message.content ?? '', ...(message.tool_calls?.length ? { tool_calls: message.tool_calls } : {}) });
    if (!message.tool_calls?.length) { said = String(message.content || '').trim(); break; }
    for (const call of message.tool_calls) {
      const name = call.function?.name;
      let args = {};
      try { args = JSON.parse(call.function?.arguments || '{}'); } catch {}
      let result;
      if (!REFLECTION_TOOLS.includes(name)) result = { ok: false, error: `Only ${REFLECTION_TOOLS.join(' and ')} can be used here.` };
      else {
        try { result = await runTool(name, args); } catch (error) { result = { ok: false, error: error.message }; }
        if (args.action !== 'read') saved.push({ tool: name, args, ok: result?.ok !== false });
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result ?? null).slice(0, 4000) });
    }
  }
  return { saved, rounds: rounds + 1, said };
}
