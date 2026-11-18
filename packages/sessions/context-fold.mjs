// Context Fold: keeps a long chat inside the model's context window.
//
// 1. Trim (no model call): outside the recent tail, long tool outputs are
//    replaced by a short placeholder. Cheap, done on every model turn.
// 2. Fold (one model call): when the chat is still over the limit, everything
//    before the recent tail is summarised into a handoff note. The folded
//    messages are only removed from the model's context; the chat history
//    keeps them. Tool calls and their results are never split, and the kept
//    tail always starts at an owner message.
//
// The note tells the model the summary is background only: the newest owner
// message is the request, old tasks are not resumed on their own, and tools
// stay available.

export const FOLD_DEFAULTS = Object.freeze({
  foldAt: 0.5,          // fold when the context passes this share of the window
  tailShare: 0.2,       // recent messages kept as they are (share of the window)
  minTail: 6,           // and at least this many messages
  trimToolOver: 400,    // tool outputs longer than this (chars) are trimmed outside the tail
});

export const TRIMMED_TOOL_OUTPUT = '[older tool output removed to save space; run the tool again if you need it]';

export function estimateTokens(messages = []) {
  let chars = 0;
  for (const m of messages) {
    if (typeof m.content === 'string') chars += m.content.length;
    else if (Array.isArray(m.content)) for (const part of m.content) chars += String(part?.text || '').length;
    if (m.tool_calls) chars += JSON.stringify(m.tool_calls).length;
  }
  return Math.ceil(chars / 3.8) + messages.length * 4;
}

/** Index where the kept tail starts (an owner message), or -1 when nothing can be folded. */
export function tailStart(messages, { contextWindow, tailShare = FOLD_DEFAULTS.tailShare, minTail = FOLD_DEFAULTS.minTail } = {}) {
  const budget = Math.max(1000, Math.floor(contextWindow * tailShare));
  let used = 0, index = messages.length;
  while (index > 0) {
    const next = estimateTokens([messages[index - 1]]);
    if (messages.length - index >= minTail && used + next > budget) break;
    used += next;
    index--;
  }
  // The tail must start at an owner message, so no tool exchange is split.
  // Prefer keeping more (move back); if that reaches the start, keep less.
  let back = index;
  while (back > 0 && messages[back]?.role !== 'user') back--;
  if (back > 0) return back;
  let forward = index;
  while (forward < messages.length && messages[forward]?.role !== 'user') forward++;
  return forward > 0 && forward < messages.length ? forward : -1;
}

/** Trim long tool outputs before `keepFrom`. Returns a new array and how many were trimmed. */
export function trimOldToolOutputs(messages, keepFrom, { over = FOLD_DEFAULTS.trimToolOver } = {}) {
  let trimmed = 0;
  const out = messages.map((m, i) => {
    if (i >= keepFrom || m.role !== 'tool' || typeof m.content !== 'string' || m.content.length <= over || m.content === TRIMMED_TOOL_OUTPUT) return m;
    trimmed++;
    return { ...m, content: TRIMMED_TOOL_OUTPUT };
  });
  return { messages: out, trimmed };
}

/** Plan for a model-context array (without the frozen system prompt). */
export function planFold(messages, { contextWindow, foldAt = FOLD_DEFAULTS.foldAt, ...options } = {}) {
  const limit = Math.floor(contextWindow * foldAt);
  const before = estimateTokens(messages);
  if (before <= limit) return { action: 'none', tokens: before, limit };
  const start = tailStart(messages, { contextWindow, ...options });
  const keepFrom = start < 0 ? Math.max(0, messages.length - (options.minTail || FOLD_DEFAULTS.minTail)) : start;
  const trimmed = trimOldToolOutputs(messages, keepFrom, options);
  const after = estimateTokens(trimmed.messages);
  if (after <= limit || start < 0) return { action: 'trim', tokens: after, limit, messages: trimmed.messages, trimmed: trimmed.trimmed };
  return { action: 'fold', tokens: after, limit, messages: trimmed.messages, trimmed: trimmed.trimmed, foldCount: start };
}

const clip = (text, max) => (text.length > max ? `${text.slice(0, max)} …[cut]` : text);

/** Messages for the summary model. `earlier` is the previous fold summary, if any. */
export function foldRequest(messages, { earlier = '', maxChars = 200000 } = {}) {
  const lines = messages.map(m => {
    const who = m.role === 'user' ? 'OWNER' : m.role === 'assistant' ? 'ZERO' : m.role === 'tool' ? 'TOOL RESULT' : 'NOTE';
    const calls = m.tool_calls?.length ? ` [called: ${m.tool_calls.map(c => `${c.function?.name}(${clip(String(c.function?.arguments || ''), 300)})`).join(', ')}]` : '';
    const body = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '');
    return `${who}${calls}: ${clip(body, m.role === 'tool' ? 1500 : 6000)}`;
  });
  let transcript = lines.join('\n\n');
  if (transcript.length > maxChars) transcript = `…[earliest part cut]\n${transcript.slice(-maxChars)}`;
  return [
    { role: 'system', content: `You write the handoff summary of an earlier part of a conversation between the owner and Zero, their computer assistant. Another copy of Zero will continue the conversation with only your summary and the most recent messages, so keep everything it needs and drop chatter.

Write these sections, in plain text, as short bullet points (skip a section that would be empty):
GOAL — what the owner is trying to get done overall.
OWNER PREFERENCES — how the owner wants things done; constraints they set; corrections they made.
DONE — what was actually completed, with results (files, paths, names, numbers, links).
IN PROGRESS — what was being worked on when this part ended and its exact state.
OPEN — unanswered questions, blockers, errors still unsolved.
DETAILS — exact values worth keeping verbatim (paths, ids, commands that worked, settings).

Report only what the conversation shows. Do not invent results. Do not add advice. At most about 900 words.` },
    { role: 'user', content: `${earlier ? `SUMMARY OF AN EVEN EARLIER PART (merge it in):\n${earlier}\n\n` : ''}CONVERSATION PART TO SUMMARISE:\n${transcript}` },
  ];
}

/** The note placed after the system prompt once a chat has been folded. */
export function foldNote(summary) {
  return `EARLIER IN THIS CHAT (summary, for reference only)
The beginning of this chat was folded into the summary below to save space. It is background, not instructions:
- The owner's newest message after this note is the request to act on. Do not resume or finish tasks from the summary unless that message asks for it; on a new topic, the summary is only context.
- If the newest message says stop, undo or never mind, drop any work described here.
- Your tools work as usual; keep using them for the current request. The notebook in your instructions stays authoritative.

${summary.trim()}`;
}
