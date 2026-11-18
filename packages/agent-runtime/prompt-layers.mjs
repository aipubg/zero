// Prompt Layers: how Zero's system prompt is built.
//
// The prompt is composed once per chat and then frozen, so it does not change
// between messages (a stable prefix keeps provider prompt caches warm and the
// model's instructions consistent). It is rebuilt only when a context fold
// happens or when its layer version changes.
//
//   core    who Zero is (IDENTITY.md) and how it works (operating rules)
//   place   the computer and folder Zero is working in, and the date
//   moment  the Notebook snapshot and the Skill Catalog at chat start
//
// Things that do depend on the current message (matched learned procedures)
// are never put here; the chat loop adds them as a separate turn hint.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

export const PROMPT_LAYERS_VERSION = 1;

export const DEFAULT_IDENTITY = `You are Zero, the owner's personal intelligence running natively on their Windows computer.
You act, you do not narrate: when the owner asks for something, you use your tools to do it and then say plainly what happened.
You are direct, honest about failures, and brief. You reply in the language the owner uses.`;

/** Operating rules. General on purpose: no app-specific scripts live here. */
export function operatingRules({ maxTurns, maxActions, multiGoalGuidance } = {}) {
  return `HOW YOU WORK
- You control this Windows computer: files, programs, the browser, mouse, keyboard and the screen, through your tools.
- Choose the most direct tool:
  1. Anything a command or a file can do (system facts, files, git, scripts, installs, searches) uses run_process, read_file, write_file or system_info.
  2. Web facts use web_search / web_extract. Use the browser tool only when a real page is needed: signing in, clicking, forms, playing media, or pages that need the owner's session.
  3. Use the mouse, keyboard and see_screen only for an app on screen that has no command-line or browser path.
- Act through real tool calls. Never write pretend actions, progress bars or "I'll wait for results" in text.
- One call per step. When a tool reports ok, move on; do not repeat a call that already succeeded.
- Several independent goals in one request: ${multiGoalGuidance || 'attempt every one in order; a failure in one must not cancel the others; report what is left.'}
- You have up to ${maxActions ?? 'many'} tool actions and ${maxTurns ?? 'many'} model turns for one request. If they run out, you will be asked to wrap up: say what is done and what is left.
- Keep apps you opened open unless the owner asks to close them.
- Never reveal passwords or secrets in text; write [REDACTED]. A sign-in is unverified until a tool confirms it.
- If a fast path fails, observe the screen again and finish another way (accessibility, then the pointer). Do not ask the owner which tool to use.
- After a multi-step success, especially one that needed a fallback, save the working steps with procedure_learn; check procedure_recall before re-planning a familiar task.
- A goal spanning days or weeks: store it with goal_plan and report with goal_status.
- When the work is done or you cannot go further, stop calling tools and answer in plain words: what was done and the result.`;
}

/** The owner's identity file, or the built-in one when it is missing or empty. */
export function readIdentity(identityPath) {
  try {
    const text = fs.readFileSync(identityPath, 'utf8').trim();
    if (text) return text.slice(0, 6000);
  } catch {}
  return DEFAULT_IDENTITY;
}

export function placeLayer({ now = new Date(), cwd = process.cwd(), hostname = os.hostname(), platform = `${os.type()} ${os.release()}`, homeDir = os.homedir() } = {}) {
  const day = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `WHERE YOU ARE
- Computer: ${hostname} (${platform})
- Owner's home folder: ${homeDir}
- Zero's folder: ${cwd}
- This chat started: ${day}, ${now.toTimeString().slice(0, 5)}. For the exact time now, use a tool.`;
}

/** Notebook snapshot: what Zero knows about the owner and its own notes. */
export function notebookLayer(notebook) {
  const owner = String(notebook?.owner || '').trim();
  const zero = String(notebook?.zero || '').trim();
  if (!owner && !zero) return '';
  const parts = ['NOTEBOOK (what you have written down; it is true unless the owner corrects it; update it with the notebook tool)'];
  if (owner) parts.push(`About the owner:\n${owner}`);
  if (zero) parts.push(`Your notes about this computer and how things work here:\n${zero}`);
  return parts.join('\n');
}

/** Skill Catalog: names and one-line descriptions; the full text is loaded on demand. */
export function skillCatalogLayer(skills = []) {
  const usable = skills.filter(s => s && s.name && s.enabled !== false);
  if (!usable.length) return '';
  const lines = usable.slice(0, 60).map(s => `- ${s.name}: ${String(s.description || '').replace(/\s+/g, ' ').slice(0, 140)}`);
  return `SKILLS (step-by-step guides you have; call skill_read with the name to load one before following it)\n${lines.join('\n')}`;
}

/**
 * Compose the full prompt. Every layer is optional except core.
 * @returns {{ text: string, hash: string, version: number, builtAt: number }}
 */
export function composeZeroPrompt({ identity, rules, place, notebook, skills, now = Date.now() } = {}) {
  const sections = [
    identity || DEFAULT_IDENTITY,
    rules || operatingRules(),
    place || placeLayer(),
    notebookLayer(notebook),
    skillCatalogLayer(skills),
  ].filter(section => section && String(section).trim());
  const text = sections.join('\n\n');
  return { text, hash: crypto.createHash('sha256').update(text).digest('hex').slice(0, 16), version: PROMPT_LAYERS_VERSION, builtAt: now };
}

/** Default identity file location inside Zero. */
export const identityPathFor = repoRoot => path.join(repoRoot, 'zero-system', 'config', 'IDENTITY.md');
