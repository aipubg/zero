/**
 * @fileoverview Zero 3-Tier System Prompt Assembly
 *
 * Builds the system prompt in three tiers (stable → context → volatile) in that
 * order. The stable tier is never rebuilt between turns except during context
 * compaction — this preserves prompt-cache prefixes across turns (sacred rule).
 *
 * Tier layout (Hermes-inspired, adapted for Zero):
 *   stable   — Identity (SOUL.md or built-in), tool/model guidance, coding brief,
 *              platform hint (Windows).
 *   context  — Caller's system_message, project context file
 *              (AGENTS.md → CLAUDE.md → .cursorrules → HERMES.md → .hermes.md),
 *              git workspace snapshot.
 *   volatile — Skills index (<available_skills>), MEMORY.md snapshot, USER.md
 *              snapshot, time/session/model line, runtime environment.
 *
 * Changes to skills index or surface (desktop ↔ TUI) do NOT rebuild the prompt;
 * they travel as a one-shot note on the next user message.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DEFAULT_CONFIG = {
  stableIdentityPath: null, // resolved at construct time
  memoryDir: null,          // resolved at construct time
  projectRoot: process.cwd(),
  maxContextFileChars: 4000,
  maxGitSnapshotChars: 2000,
  skillsMaxEntries: 50,
};

const BUILTIN_IDENTITY = `You are Zero, a persistent intelligent assistant operating on the owner's Windows workstation.

You understand natural language requests, determine the user's actual objective, inspect the environment, plan when needed, choose appropriate models and agents, discover and use skills/plugins/tools, execute work through APIs/local processes/browsers/desktop automation, observe results, detect errors and recover, maintain context across conversations, coordinate parallel operations, and report progress accurately.

You operate in owner mode: broad explicitly configured capabilities with minimal friction. You do not require confirmation for ordinary operations unless a high-risk action is explicitly blocked by policy.

Core principles:
- Use native APIs first, graphical control only when no stable API exists.
- Report outcomes honestly: executed ≠ verified ≠ completed. Never claim success without evidence.
- Preserve prompt-cache stability: do not change system prompt or tools between turns except during compaction.
- Local-first: prefer local processing when feasible; cloud providers are fallbacks.
`;

/** Resolve the first existing project context file, in priority order. */
function resolveContextFile(projectRoot) {
  const candidates = [
    'AGENTS.md', 'CLAUDE.md', '.cursorrules', 'HERMES.md', '.hermes.md',
  ];
  for (const name of candidates) {
    const full = path.join(projectRoot, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

/** Read a file safely, truncated to maxChars. */
function readFileSafe(filePath, maxChars) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return content.slice(0, maxChars);
  } catch { return null; }
}

/** Get a short git workspace snapshot (branch + status summary). */
function gitSnapshot(projectRoot, maxChars) {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot, encoding: 'utf8', timeout: 3000 }).trim();
    const status = execSync('git status --short --branch', { cwd: projectRoot, encoding: 'utf8', timeout: 3000 }).trim();
    const snapshot = `Branch: ${branch}\n${status}`;
    return snapshot.slice(0, maxChars);
  } catch { return null; }
}

/** Format the skills index for the volatile tier. */
function formatSkillsIndex(skills, maxEntries) {
  if (!skills || !skills.length) return '<available_skills>\n(none installed)\n</available_skills>';
  const entries = skills.slice(0, maxEntries).map((s) => {
    const desc = (s.description || '').slice(0, 60);
    return `- ${s.name}: ${desc}`;
  }).join('\n');
  return `<available_skills>\n${entries}\n</available_skills>`;
}

export class SystemPromptBuilder {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.stableIdentityPath = options.stableIdentityPath
      || path.join(this.projectRoot, 'zero-system', 'config', 'SOUL.md');
    this.memoryDir = options.memoryDir
      || path.join(this.projectRoot, 'zero-system', 'state', 'memory');
    this.maxContextFileChars = options.maxContextFileChars ?? DEFAULT_CONFIG.maxContextFileChars;
    this.maxGitSnapshotChars = options.maxGitSnapshotChars ?? DEFAULT_CONFIG.maxGitSnapshotChars;
    this.skillsMaxEntries = options.skillsMaxEntries ?? DEFAULT_CONFIG.skillsMaxEntries;

    // Stable tier is built once and cached (prompt caching).
    this._stableCache = null;
    this._stableIdentity = null;
  }

  /** Build (or retrieve cached) stable tier — identity + tool/model guidance + platform hint. */
  buildStable({ agentId = 'zero', tools = [], modelInfo = null } = {}) {
    if (this._stableCache) return this._stableCache;

    const identity = this._loadStableIdentity();
    const toolGuidance = this._buildToolGuidance(tools);
    const modelGuidance = modelInfo ? this._buildModelGuidance(modelInfo) : '';
    const platformHint = this._buildPlatformHint();

    const stable = [
      identity,
      '',
      '## Tool & Model Guidance',
      toolGuidance,
      '',
      modelGuidance,
      '',
      '## Platform Hint',
      platformHint,
    ].filter(Boolean).join('\n');

    this._stableCache = stable;
    return stable;
  }

  /** Invalidate stable cache (call only during compaction or config change). */
  invalidateStable() {
    this._stableCache = null;
  }

  /** Build context tier — caller system_message + project context file + git snapshot. */
  buildContext({ systemMessage = null, includeGit = true } = {}) {
    const parts = [];

    if (systemMessage && typeof systemMessage === 'string' && systemMessage.trim()) {
      parts.push('## Caller Context\n' + systemMessage.trim());
    }

    const contextFile = resolveContextFile(this.projectRoot);
    if (contextFile) {
      const content = readFileSafe(contextFile, this.maxContextFileChars);
      if (content) {
        parts.push(`## Project Context (${path.basename(contextFile)})\n${content}`);
      }
    }

    if (includeGit) {
      const snap = gitSnapshot(this.projectRoot, this.maxGitSnapshotChars);
      if (snap) {
        parts.push('## Git Workspace\n' + snap);
      }
    }

    return parts.join('\n\n');
  }

  /** Build volatile tier — skills index, memory snapshots, time/session/model, runtime env. */
  buildVolatile({ skills = [], memorySnapshot = null, userSnapshot = null,
    sessionId = 'default', modelId = null, agentId = 'zero', runtime = null } = {}) {
    const now = new Date().toISOString();
    const parts = [];

    parts.push('## Available Skills\n' + formatSkillsIndex(skills, this.skillsMaxEntries));

    if (memorySnapshot && typeof memorySnapshot === 'string' && memorySnapshot.trim()) {
      parts.push('## Agent Memory (MEMORY.md)\n' + memorySnapshot.trim());
    }

    if (userSnapshot && typeof userSnapshot === 'string' && userSnapshot.trim()) {
      parts.push('## User Profile (USER.md)\n' + userSnapshot.trim());
    }

    const runtimeLine = runtime ? `Runtime: ${runtime.platform} ${runtime.arch} (Node ${process.version})` : `Runtime: ${process.platform} ${process.arch} (Node ${process.version})`;
    parts.push('## Session\nSession ID: ' + sessionId + '\nAgent: ' + agentId + '\nModel: ' + (modelId || 'auto') + '\nTime: ' + now + '\n' + runtimeLine);

    return parts.join('\n\n');
  }

  /** Assemble the full system prompt: stable + context + volatile. */
  assemble(options = {}) {
    const stable = this.buildStable(options.stable || {});
    const context = this.buildContext(options.context || {});
    const volatile = this.buildVolatile(options.volatile || {});

    const tiers = [];
    if (stable) tiers.push('## System Identity (Stable)\n' + stable);
    if (context) tiers.push('## Context\n' + context);
    if (volatile) tiers.push('## Volatile Context\n' + volatile);

    return tiers.join('\n\n');
  }

  /** Hash of the stable tier — used to detect cache-break changes. */
  stableHash() {
    const stable = this.buildStable();
    return createHash('sha256').update(stable).digest('hex').slice(0, 16);
  }

  // ---- private helpers ----

  _loadStableIdentity() {
    const fromFile = readFileSafe(this.stableIdentityPath, 8000);
    if (fromFile && fromFile.trim()) return fromFile.trim();
    return BUILTIN_IDENTITY;
  }

  _buildToolGuidance(tools) {
    if (!tools || !tools.length) return '(no tools configured)';
    return tools.map((t) => `- ${t.name}: ${t.description || '(no description)'}`).join('\n');
  }

  _buildModelGuidance(modelInfo) {
    const lines = [];
    if (modelInfo.primary) lines.push(`- Primary model: ${modelInfo.primary}`);
    if (modelInfo.fallbacks && modelInfo.fallbacks.length) lines.push(`- Fallbacks: ${modelInfo.fallbacks.join(', ')}`);
    if (modelInfo.reasoning !== undefined) lines.push(`- Reasoning: ${modelInfo.reasoning}`);
    return lines.length ? lines.join('\n') : '(no model assignment)';
  }

  _buildPlatformHint() {
    return `Platform: ${process.platform} ${process.arch}\nNative capabilities: Windows UI Automation, file system, local shell, browser automation, screen observation, local vision (SmolVLM GGUF).`;
  }
}

export const defaultSystemPromptBuilder = new SystemPromptBuilder();