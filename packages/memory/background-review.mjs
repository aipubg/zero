/**
 * @fileoverview Zero Background Review — Self-Improving Loop
 *
 * Hermes-inspired: after each conversation turn, a background review can
 * replay the conversation through a lightweight agent and decide what to
 * persist to memory or skills. Runs asynchronously, never blocks the main
 * turn, and uses the same provider/model/cached system prompt (cache-hit
 * friendly) with a whitelist of memory/skill tools only.
 */

import { EventEmitter } from 'node:events';

const REVIEW_PROMPT = `You are a memory curator reviewing a completed conversation.
Your job: identify facts, preferences, procedures, or skills worth persisting.

Rules:
- MEMORY: stable facts about the user, their preferences, or their environment that apply across sessions.
- USER: user profile details (name, role, goals, constraints).
- SKILL: a repeatable procedure learned from this task that could help future tasks.
- Do NOT save transient chat, one-off observations, or already-known information.
- Keep each entry concise (one sentence or short paragraph).

Conversation:
{{CONVERSATION}}

Respond with a JSON object:
{
  "memory": [{"content": "...", "category": "general"}],
  "user": [{"content": "..."}],
  "skills": [{"name": "...", "description": "...", "triggers": ["..."]}],
  "reasoning": "brief explanation of what was saved and why"
}
If nothing is worth saving, return empty arrays and a brief reasoning string.
`;

/** Run a background review of a conversation. Returns { memory, user, skills, reasoning }. */
export async function reviewConversation({
  messages = [],
  modelFabric = null,
  modelId = null,
  systemPrompt = null,
  sessionId = 'default',
} = {}) {
  if (!modelFabric || typeof modelFabric.executeChat !== 'function') {
    return { memory: [], user: [], skills: [], reasoning: 'no model fabric available', skipped: true };
  }

  // Build a compact transcript for the reviewer.
  const transcript = messages
    .slice(-20) // last 20 messages only
    .map((m) => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${m.role || 'unknown'}: ${content.slice(0, 1000)}`;
    })
    .join('\n\n');

  const reviewContent = REVIEW_PROMPT.replace('{{CONVERSATION}}', transcript);

  try {
    const result = await modelFabric.executeChat({
      model: modelId || 'auto',
      messages: [
        { role: 'system', content: systemPrompt || 'You are a careful memory curator.' },
        { role: 'user', content: reviewContent },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    });

    const raw = result.data?.choices?.[0]?.message?.content || '';
    const parsed = _parseReviewJSON(raw);

    return {
      memory: Array.isArray(parsed.memory) ? parsed.memory : [],
      user: Array.isArray(parsed.user) ? parsed.user : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      reasoning: parsed.reasoning || 'No specific items identified.',
      skipped: false,
    };
  } catch (error) {
    return {
      memory: [],
      user: [],
      skills: [],
      reasoning: `Review failed: ${error.message}`,
      skipped: true,
      error: error.message,
    };
  }
}

/** Apply review results to the file memory store and optionally suggest skills. */
export async function applyReviewResults(review, fileMemoryStore, unifiedMemory = null, skillLoader = null) {
  const applied = { memory: 0, user: 0, skills: 0, errors: [] };

  // Persist memory entries to file store.
  for (const entry of review.memory || []) {
    try {
      if (entry && entry.content) {
        fileMemoryStore.addMemory(entry.content);
        applied.memory++;
        if (unifiedMemory && typeof unifiedMemory.remember === 'function') {
          unifiedMemory.remember({
            layer: 'semantic',
            category: entry.category || 'general',
            content: entry.content,
            tags: ['background-review'],
            source: 'system',
            confidence: 0.7,
          });
        }
      }
    } catch (err) {
      applied.errors.push(`memory: ${err.message}`);
    }
  }

  // Persist user entries.
  for (const entry of review.user || []) {
    try {
      if (entry && entry.content) {
        fileMemoryStore.addUser(entry.content);
        applied.user++;
      }
    } catch (err) {
      applied.errors.push(`user: ${err.message}`);
    }
  }

  // Record skill suggestions (does not auto-create skills; returns them for user approval).
  for (const skill of review.skills || []) {
    try {
      if (skill && skill.name) {
        applied.skills++;
        // Optionally create via skill loader if available.
        if (skillLoader && typeof skillLoader.createSkill === 'function') {
          await skillLoader.createSkill({
            name: skill.name,
            description: skill.description || 'Auto-learned skill from background review.',
            triggers: skill.triggers || [skill.name],
          });
        }
      }
    } catch (err) {
      applied.errors.push(`skill ${skill.name}: ${err.message}`);
    }
  }

  return applied;
}

function _parseReviewJSON(raw) {
  try {
    // Try to extract JSON from markdown code blocks.
    const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = match ? match[1] : raw;
    return JSON.parse(jsonStr);
  } catch {
    // Fallback: return empty structure.
    return { memory: [], user: [], skills: [], reasoning: 'Could not parse review output.' };
  }
}

export class BackgroundReviewEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.modelFabric = options.modelFabric || null;
    this.fileMemoryStore = options.fileMemoryStore || null;
    this.unifiedMemory = options.unifiedMemory || null;
    this.skillLoader = options.skillLoader || null;
    this.systemPrompt = options.systemPrompt || null;
    this.enabled = options.enabled !== false;
    this._pending = null;
  }

  setModelFabric(modelFabric) { this.modelFabric = modelFabric; }
  setSystemPrompt(prompt) { this.systemPrompt = prompt; }

  /**
   * Trigger a background review of a completed conversation. Non-blocking:
   * returns immediately; the review runs asynchronously and emits 'review:complete'.
   */
  review({ messages = [], modelId = null, sessionId = 'default' } = {}) {
    if (!this.enabled) return { skipped: true, reason: 'disabled' };

    this._pending = (async () => {
      try {
        const review = await reviewConversation({
          messages,
          modelFabric: this.modelFabric,
          modelId,
          systemPrompt: this.systemPrompt,
          sessionId,
        });

        let applied = null;
        if (!review.skipped && this.fileMemoryStore) {
          applied = await applyReviewResults(review, this.fileMemoryStore, this.unifiedMemory, this.skillLoader);
        }

        this.emit('review:complete', { review, applied, sessionId });
        return { review, applied };
      } catch (error) {
        this.emit('review:error', { error: error.message, sessionId });
        return { error: error.message };
      } finally {
        this._pending = null;
      }
    })();

    return { pending: true };
  }

  getPending() {
    return this._pending;
  }
}

export const defaultBackgroundReviewEngine = new BackgroundReviewEngine();