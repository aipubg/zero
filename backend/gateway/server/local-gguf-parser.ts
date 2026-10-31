import fs from 'node:fs';

export interface GgufValidationResult {
  valid: boolean;
  error?: string;
  version?: number;
  tensorCount?: number;
  metadataCount?: number;
}

export function validateGgufBinary(filePath: string): GgufValidationResult {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }
    const stat = fs.statSync(filePath);
    if (stat.size < 1024 * 1024) {
      return { valid: false, error: 'File is too small (< 1MB) to be a valid GGUF model' };
    }
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(24);
    fs.readSync(fd, header, 0, 24, 0);
    fs.closeSync(fd);

    const magic = header.toString('utf-8', 0, 4);
    if (magic !== 'GGUF') {
      return { valid: false, error: `Invalid GGUF magic bytes: expected 'GGUF', got '${magic}'` };
    }
    const version = header.readUInt32LE(4);
    const tensorCount = Number(header.readBigUInt64LE(8));
    const metadataCount = Number(header.readBigUInt64LE(16));

    return {
      valid: true,
      version,
      tensorCount,
      metadataCount,
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Failed to read GGUF header' };
  }
}

export interface ParsedGuideConfig {
  fromPath?: string;
  systemPrompt?: string;
  parameters: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_ctx?: number;
    stop?: string[];
    repeat_penalty?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  chatTemplate?: string;
  guideRaw: string;
}

/**
 * Parses Ollama Modelfile format, JSON configurations, or plain text system guide instructions.
 * Extracts:
 * - FROM <path_to_gguf>
 * - SYSTEM """...""" or "..." or single-line
 * - PARAMETER temperature <val>, PARAMETER top_p <val>, PARAMETER num_ctx <val>, PARAMETER stop <val>, etc.
 * - TEMPLATE """..."""
 * - JSON Guide / Config:
 *     system / systemPrompt / system_prompt / instructions / prompt -> systemPrompt
 *     temperature / top_p / top_k / repeat_penalty / max_tokens -> generation parameters
 *     num_ctx / context_length / contextSize -> clamped safe context size (512 to 8192)
 *     template / chat_template / chatTemplate -> chatTemplate
 * - Plain text fallback: entire text is assigned as model's core system prompt / guide.
 */
export function parseGuideOrModelfile(rawContent: string, defaultModelPath?: string): ParsedGuideConfig {
  if (!rawContent || !rawContent.trim()) {
    return {
      fromPath: defaultModelPath,
      systemPrompt: undefined,
      parameters: {},
      chatTemplate: undefined,
      guideRaw: '',
    };
  }

  let trimmed = rawContent.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```[a-zA-Z0-9_-]*\r?\n/, '').replace(/\r?\n```\s*$/, '').trim();
  }

  // 1. Smart JSON Guide / Config Parser
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      const json = JSON.parse(trimmed);
      if (typeof json === 'object' && json !== null) {
        const fromPath = json.from || json.fromPath || json.modelPath || defaultModelPath;

        // Smart extraction of system instructions (NEVER send raw JSON brackets as system prompt)
        let systemPrompt: string | undefined = undefined;
        const candidateSys =
          json.system ??
          json.systemPrompt ??
          json.system_prompt ??
          json.instructions ??
          json.prompt ??
          json.guide ??
          json.system_message ??
          json.systemMessage ??
          json.config?.system ??
          json.config?.systemPrompt;

        if (typeof candidateSys === 'string' && candidateSys.trim()) {
          systemPrompt = candidateSys.trim();
        } else if (Array.isArray(candidateSys)) {
          systemPrompt = candidateSys.map(String).join('\n').trim();
        } else if (Array.isArray(json.messages)) {
          // If OpenAI/Chat format with a system message
          const sysMsg = json.messages.find((m: any) => m && m.role === 'system');
          if (sysMsg && typeof sysMsg.content === 'string') {
            systemPrompt = sysMsg.content.trim();
          }
        }

        const stopVal = json.stop ?? json.parameters?.stop;
        const stop = stopVal ? (Array.isArray(stopVal) ? stopVal : [String(stopVal)]) : undefined;

        // Clamp num_ctx / context_length safely between 512 and 8192
        let safeNumCtx: number | undefined = undefined;
        const rawCtx =
          json.num_ctx ??
          json.context_length ??
          json.contextSize ??
          json.contextLength ??
          json.parameters?.num_ctx ??
          json.parameters?.context_length ??
          json.parameters?.contextSize;
        if (rawCtx !== undefined && rawCtx !== null) {
          const parsedNum = parseInt(String(rawCtx), 10);
          if (!isNaN(parsedNum) && parsedNum > 0) {
            safeNumCtx = Math.max(512, Math.min(parsedNum, 8192));
          }
        }

        const parameters: Record<string, any> = {
          temperature: json.temperature ?? json.parameters?.temperature ?? json.generation_config?.temperature,
          top_p: json.top_p ?? json.parameters?.top_p ?? json.generation_config?.top_p,
          top_k: json.top_k ?? json.parameters?.top_k,
          num_ctx: safeNumCtx,
          stop,
          repeat_penalty: json.repeat_penalty ?? json.parameters?.repeat_penalty,
          max_tokens: json.max_tokens ?? json.parameters?.max_tokens ?? json.parameters?.num_predict,
          ...(typeof json.parameters === 'object' && json.parameters !== null ? json.parameters : {}),
        };

        // If json.parameters also had num_ctx, re-clamp it
        if (parameters.num_ctx) {
          parameters.num_ctx = Math.max(512, Math.min(parseInt(String(parameters.num_ctx), 10) || 4096, 8192));
        }

        // Filter out undefined values
        Object.keys(parameters).forEach((k) => parameters[k] === undefined && delete parameters[k]);

        const chatTemplate =
          json.chatTemplate ||
          json.chat_template ||
          json.template ||
          json.chat_wrapper ||
          json.chatWrapper ||
          undefined;

        return {
          fromPath,
          systemPrompt,
          parameters,
          chatTemplate,
          guideRaw: rawContent,
        };
      }
    } catch {
      // If parsing as JSON threw, check if it was intended as JSON
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        console.warn('[LocalGgufParser] Input resembles JSON but could not be parsed as valid JSON.');
      }
    }
  }

  // 2. Check for Ollama / Dockerfile style Modelfile directives
  const hasModelfileDirectives = /^(FROM|SYSTEM|PARAMETER|TEMPLATE|MESSAGE|LICENSE|ADAPTER)\b/im.test(trimmed);

  if (!hasModelfileDirectives) {
    // If the text looks like raw JSON with curly braces, do NOT assign raw JSON brackets as system prompt!
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return {
        fromPath: defaultModelPath,
        systemPrompt: undefined,
        parameters: {},
        chatTemplate: undefined,
        guideRaw: rawContent,
      };
    }

    // Plain text guide / instructions file! Automatically merge as core system prompt
    return {
      fromPath: defaultModelPath,
      systemPrompt: trimmed,
      parameters: {},
      chatTemplate: undefined,
      guideRaw: rawContent,
    };
  }

  // 3. Parse Modelfile Syntax
  let fromPath = defaultModelPath;
  let systemPrompt: string | undefined = undefined;
  let chatTemplate: string | undefined = undefined;
  const parameters: Record<string, any> = {};
  const stopStrings: string[] = [];

  // Match multi-line blocks for SYSTEM """...""" or SYSTEM '''...''' or SYSTEM "..."
  const systemMultiMatch =
    trimmed.match(/SYSTEM\s+"""([\s\S]*?)"""/i) ||
    trimmed.match(/SYSTEM\s+'''([\s\S]*?)'''/i) ||
    trimmed.match(/SYSTEM\s+"([^"]*)"/i);
  if (systemMultiMatch) {
    systemPrompt = systemMultiMatch[1].trim();
  }

  // Match multi-line blocks for TEMPLATE """...""" or TEMPLATE '''...''' or TEMPLATE "..."
  const templateMultiMatch =
    trimmed.match(/TEMPLATE\s+"""([\s\S]*?)"""/i) ||
    trimmed.match(/TEMPLATE\s+'''([\s\S]*?)'''/i) ||
    trimmed.match(/TEMPLATE\s+"([^"]*)"/i);
  if (templateMultiMatch) {
    chatTemplate = templateMultiMatch[1].trim();
  }

  // Line-by-line scanning for FROM, PARAMETER, and single-line SYSTEM
  const lines = trimmed.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    // FROM <path>
    const fromMatch = line.match(/^FROM\s+(.+)$/i);
    if (fromMatch && !fromPath) {
      fromPath = fromMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }

    // Single-line SYSTEM (if not already captured by multi-line)
    if (!systemPrompt) {
      const singleSysMatch = line.match(/^SYSTEM\s+(.+)$/i);
      if (singleSysMatch && !singleSysMatch[1].startsWith('"""') && !singleSysMatch[1].startsWith("'''")) {
        systemPrompt = singleSysMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }

    // PARAMETER <key> <val>
    const paramMatch = line.match(/^PARAMETER\s+([a-zA-Z0-9_-]+)\s+(.+)$/i);
    if (paramMatch) {
      const key = paramMatch[1].toLowerCase();
      const rawVal = paramMatch[2].trim().replace(/^['"]|['"]$/g, '');

      if (key === 'stop') {
        stopStrings.push(rawVal);
      } else if (['temperature', 'top_p', 'top_k', 'repeat_penalty', 'min_p'].includes(key)) {
        const num = parseFloat(rawVal);
        if (!isNaN(num)) parameters[key] = num;
      } else if (['num_ctx', 'seed', 'num_predict', 'num_gpu', 'threads', 'context_length'].includes(key)) {
        const intVal = parseInt(rawVal, 10);
        if (!isNaN(intVal)) {
          if (key === 'num_ctx' || key === 'context_length') {
            parameters.num_ctx = Math.max(512, Math.min(intVal, 8192));
          } else {
            parameters[key] = intVal;
          }
        }
      } else {
        parameters[key] = rawVal;
      }
    }
  }

  if (stopStrings.length > 0) {
    parameters.stop = stopStrings;
  }

  return {
    fromPath: fromPath || defaultModelPath,
    systemPrompt,
    parameters,
    chatTemplate,
    guideRaw: rawContent,
  };
}
