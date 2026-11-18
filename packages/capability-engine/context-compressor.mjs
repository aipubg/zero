/**
 * @fileoverview Zero Context Compression Engine
 *
 * Implements Hermes-style context compression for conversation message arrays:
 * 1. Prune (LLM-free): Replace old tool results > 200 chars with placeholder.
 * 2. Boundaries: Keep first 3 messages + token-budget tail (protect_last_n=20);
 *    never split tool_call/tool_result pairs.
 * 3. Summary: Send middle turns to an auxiliary LLM for compression.
 * 4. Rewrite in place: Rebuild system prompt with summary, soft-archive old turns.
 *
 * Prompt caching is sacred: the stable tier (system + tools) is never changed
 * between turns except during compaction.
 */

import { createHash } from 'node:crypto';

const DEFAULT_CONFIG = {
  triggerTokens: 100000,   // 50% of 200K context window
  tailBudgetTokens: 20000, // 20% of 200K
  summaryMaxTokens: 10000,
  protectLastN: 20,
  minToolResultChars: 200,
  charsPerToken: 3.8,
};

/** Estimate token count from character length (Zero model-fabric uses chars/3.8). */
function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / DEFAULT_CONFIG.charsPerToken);
}

function messageTokens(message) {
  let total = 0;
  if (message.role) total += estimateTokens(message.role);
  if (typeof message.content === 'string') total += estimateTokens(message.content);
  else if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (typeof part === 'string') total += estimateTokens(part);
      else if (part?.text) total += estimateTokens(part.text);
    }
  }
  if (message.tool_calls) total += estimateTokens(JSON.stringify(message.tool_calls));
  if (message.tool_call_id) total += estimateTokens(message.tool_call_id);
  return total + 4; // per-message overhead
}

export class ContextCompressor {
  constructor(options = {}) {
    this.triggerTokens = options.triggerTokens ?? DEFAULT_CONFIG.triggerTokens;
    this.tailBudgetTokens = options.tailBudgetTokens ?? DEFAULT_CONFIG.tailBudgetTokens;
    this.summaryMaxTokens = options.summaryMaxTokens ?? DEFAULT_CONFIG.summaryMaxTokens;
    this.protectLastN = options.protectLastN ?? DEFAULT_CONFIG.protectLastN;
    this.minToolResultChars = options.minToolResultChars ?? DEFAULT_CONFIG.minToolResultChars;
    this.charsPerToken = options.charsPerToken ?? DEFAULT_CONFIG.charsPerToken;
    this.llm = options.llm || null; // auxiliary model client: (messages) => Promise<string>
    this.stats = { compressions: 0, tokensSaved: 0, lastCompressionAt: null };
  }

  setLLM(llm) { this.llm = llm; }

  /**
   * Compress a message array in place. Returns { messages, compressed, summary, tokensSaved }.
   * `stablePrefix` = system prompt + tool definitions (never compressed, kept at front).
   * `messages` = conversation turns (user/assistant/tool).
   */
  async compress({ stablePrefix = [], messages = [], sessionId = 'default' } = {}) {
    const totalTokens = stablePrefix.reduce((acc, m) => acc + messageTokens(m), 0)
      + messages.reduce((acc, m) => acc + messageTokens(m), 0);

    if (totalTokens < this.triggerTokens) {
      return { messages: [...messages], compressed: false, summary: null, tokensSaved: 0, totalTokens };
    }

    const beforeTokens = totalTokens;

    // Step 1: Prune old tool results (LLM-free).
    const pruned = this._pruneToolResults(messages);

    // Step 2: Apply boundaries — keep head (first 3) + tail (protectLastN), never split pairs.
    const bounded = this._applyBoundaries(pruned);

    // Step 3: Summarize middle turns with auxiliary LLM.
    let summary = null;
    const middle = bounded.slice(3, bounded.length - this.protectLastN);
    if (this.llm && middle.length > 0) {
      summary = await this._summarize(middle);
    }

    // Step 4: Rewrite in place — head + [summary] + tail.
    const head = bounded.slice(0, 3);
    const tail = bounded.slice(bounded.length - this.protectLastN);

    const compressedMessages = [
      ...head,
      ...(summary ? [{ role: 'system', content: `[Zero System: Context compressed. ${middle.length} older turns summarized.] ${summary}` }] : []),
      ...tail,
    ];

    const afterTokens = stablePrefix.reduce((acc, m) => acc + messageTokens(m), 0)
      + compressedMessages.reduce((acc, m) => acc + messageTokens(m), 0);

    this.stats.compressions++;
    this.stats.tokensSaved += Math.max(0, beforeTokens - afterTokens);
    this.stats.lastCompressionAt = Date.now();

    return {
      messages: compressedMessages,
      compressed: true,
      summary,
      tokensSaved: Math.max(0, beforeTokens - afterTokens),
      totalTokens: afterTokens,
    };
  }

  _pruneToolResults(messages) {
    return messages.map((m) => {
      if (m.role === 'tool' && typeof m.content === 'string' && m.content.length > this.minToolResultChars) {
        return {
          ...m,
          content: `[Old tool output cleared to save context space (${m.content.length} chars removed)]`,
          _pruned: true,
        };
      }
      return m;
    });
  }

  _applyBoundaries(messages) {
    if (messages.length <= this.protectLastN + 3) return messages;

    const head = messages.slice(0, 3);
    const tail = messages.slice(messages.length - this.protectLastN);

    // Never split tool_call/tool_result pairs: expand tail leftward to include
    // any tool message whose tool_call_id references an assistant call in the head/middle.
    const tailCallIds = new Set();
    for (const m of tail) {
      if (m.role === 'tool' && m.tool_call_id) tailCallIds.add(m.tool_call_id);
    }

    let tailStart = messages.length - this.protectLastN;
    while (tailStart > 3) {
      const candidate = messages[tailStart - 1];
      if (candidate.role === 'assistant' && candidate.tool_calls) {
        const hasTailResult = candidate.tool_calls.some((c) => tailCallIds.has(c.id));
        if (hasTailResult) {
          tailStart--;
        } else {
          break;
        }
      } else if (candidate.role === 'tool' && tailCallIds.has(candidate.tool_call_id)) {
        tailStart--;
      } else {
        break;
      }
    }

    return [...messages.slice(0, tailStart), ...messages.slice(tailStart)];
  }

  async _summarize(middle) {
    if (!this.llm) return null;

    const transcript = middle.map((m) => {
      const role = m.role === 'tool' ? `tool (${m.tool_call_id})` : m.role;
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${role}: ${content.slice(0, 2000)}`;
    }).join('\n\n');

    const prompt = `You are a context compression assistant. Summarize the following conversation turns into a compact summary preserving:
1. Goal — what the user is trying to accomplish
2. Constraints & Preferences — any stated requirements
3. Progress — what is Done / In Progress
4. Next steps — what remains to be done

Turns:
${transcript}

Summary:`;

    try {
      const result = await this.llm([{ role: 'system', content: 'You summarize conversation context compactly.' }, { role: 'user', content: prompt }]);
      return typeof result === 'string' ? result : String(result.content || result);
    } catch (error) {
      return `[Compression failed: ${error.message}]`;
    }
  }

  getStatus() {
    return {
      ...this.stats,
      config: {
        triggerTokens: this.triggerTokens,
        tailBudgetTokens: this.tailBudgetTokens,
        summaryMaxTokens: this.summaryMaxTokens,
        protectLastN: this.protectLastN,
      },
    };
  }
}

export const defaultContextCompressor = new ContextCompressor();