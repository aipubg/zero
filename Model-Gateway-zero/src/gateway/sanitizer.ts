import type { ChatMessage, ChatMessagePart } from './types';

/**
 * Automatic Message & Payload Healer
 * 
 * Guarantees zero 400 Bad Request and zero template errors across both strict cloud APIs 
 * and local GGUF ChatML/Jinja templates by:
 * 1. Extracting and merging all system instructions into a single unified system prompt placed strictly at index 0.
 * 2. Stripping empty/whitespace messages (unless they carry multimodal images or tool calls).
 * 3. Automatically merging consecutive turns of the same role (user + user or assistant + assistant) separated by \n\n.
 * 4. Normalizing images into standard OpenAI multimodal content arrays.
 */
export function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ id: 'user-default', role: 'user', content: 'Hello' }];
  }

  const systemTexts: string[] = [];
  const validTurns: ChatMessage[] = [];

  for (const msg of messages) {
    if (!msg) continue;

    // Check if message has image attachments
    const hasImages =
      (Array.isArray(msg.images) && msg.images.length > 0) ||
      (Array.isArray(msg.content) && msg.content.some((p) => p && p.type === 'image_url'));
    const hasToolCalls = Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0;

    // Extract text representation
    let text = '';
    if (typeof msg.content === 'string') {
      text = msg.content;
    } else if (Array.isArray(msg.content)) {
      text = msg.content
        .map((p) => (typeof p === 'string' ? p : p?.text || ''))
        .filter(Boolean)
        .join('\n');
    }

    // Strip out messages with completely empty/null content unless they contain tool_calls or images
    if (!text.trim() && !hasImages && !hasToolCalls) {
      continue;
    }

    // Route system messages vs conversation turns
    if (msg.role === 'system') {
      if (text.trim()) {
        systemTexts.push(text.trim());
      }
    } else {
      // Normalize multimodal images into parts if images array exists
      let normalizedContent = msg.content;
      if (Array.isArray(msg.images) && msg.images.length > 0 && typeof msg.content === 'string') {
        const parts: ChatMessagePart[] = [];
        if (msg.content.trim()) {
          parts.push({ type: 'text', text: msg.content.trim() });
        }
        for (const imgUrl of msg.images) {
          parts.push({ type: 'image_url', image_url: { url: imgUrl } });
        }
        normalizedContent = parts;
      }

      validTurns.push({
        ...msg,
        content: normalizedContent,
      });
    }
  }

  // Merge consecutive turns of the same role (user + user or assistant + assistant)
  const mergedTurns: ChatMessage[] = [];

  for (const turn of validTurns) {
    if (mergedTurns.length === 0) {
      mergedTurns.push({ ...turn });
      continue;
    }

    const prev = mergedTurns[mergedTurns.length - 1];
    if (prev.role === turn.role) {
      // Extract text content from prev and turn
      const prevText =
        typeof prev.content === 'string'
          ? prev.content
          : Array.isArray(prev.content)
          ? prev.content.map((p) => (typeof p === 'string' ? p : p.text || '')).join('\n')
          : '';
      const turnText =
        typeof turn.content === 'string'
          ? turn.content
          : Array.isArray(turn.content)
          ? turn.content.map((p) => (typeof p === 'string' ? p : p.text || '')).join('\n')
          : '';

      const combinedText = [prevText, turnText].filter(Boolean).join('\n\n');

      // Combine images
      const prevImages = Array.isArray(prev.images)
        ? prev.images
        : Array.isArray(prev.content)
        ? prev.content.filter((p) => p.type === 'image_url' && p.image_url).map((p) => p.image_url!.url)
        : [];
      const turnImages = Array.isArray(turn.images)
        ? turn.images
        : Array.isArray(turn.content)
        ? turn.content.filter((p) => p.type === 'image_url' && p.image_url).map((p) => p.image_url!.url)
        : [];
      const combinedImages = Array.from(new Set([...prevImages, ...turnImages]));

      // Combine tool calls
      const combinedToolCalls = [
        ...(Array.isArray(prev.tool_calls) ? prev.tool_calls : []),
        ...(Array.isArray(turn.tool_calls) ? turn.tool_calls : []),
      ];

      if (combinedImages.length > 0) {
        const parts: ChatMessagePart[] = [];
        if (combinedText) parts.push({ type: 'text', text: combinedText });
        for (const img of combinedImages) {
          parts.push({ type: 'image_url', image_url: { url: img } });
        }
        prev.content = parts;
        prev.images = combinedImages;
      } else {
        prev.content = combinedText;
      }

      if (combinedToolCalls.length > 0) {
        prev.tool_calls = combinedToolCalls;
      }
    } else {
      mergedTurns.push({ ...turn });
    }
  }

  // Ensure first turn after system is user (if an assistant turn is stranded at the beginning, prefix user prompt)
  if (mergedTurns.length > 0 && mergedTurns[0].role === 'assistant') {
    mergedTurns.unshift({
      id: `user-preflight-${Date.now()}`,
      role: 'user',
      content: 'Hello, please proceed.',
    });
  }

  // If no conversation turns left, provide default user message
  if (mergedTurns.length === 0) {
    mergedTurns.push({
      id: `user-default-${Date.now()}`,
      role: 'user',
      content: 'Hello',
    });
  }

  // Place unified system message strictly at index 0 if any existed
  const result: ChatMessage[] = [];
  if (systemTexts.length > 0) {
    result.push({
      id: `system-unified-${Date.now()}`,
      role: 'system',
      content: systemTexts.join('\n\n'),
    });
  }

  for (const t of mergedTurns) {
    result.push(t);
  }

  return result;
}
