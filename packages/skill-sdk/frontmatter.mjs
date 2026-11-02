import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// SDK installs use the declared dependency. The host monorepo ships YAML with OpenClaw.
let yaml;
try { yaml = require('yaml'); } catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  yaml = createRequire(require.resolve('openclaw'))('yaml');
}

export function parseSkillMarkdown(raw, fallbackName, filePath) {
  raw = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  let body = raw;
  let fields = {};
  if (raw.startsWith('---\n')) {
    const match = raw.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
    if (!match) throw new Error('Unterminated SKILL.md frontmatter');
    const document = yaml.parseDocument(match[1], { uniqueKeys: true });
    if (document.errors.length || document.warnings.length) throw new Error(`Invalid SKILL.md frontmatter: ${(document.errors[0] || document.warnings[0]).message}`);
    fields = document.toJS({ maxAliasCount: 50 }) || {};
    if (typeof fields !== 'object' || Array.isArray(fields)) throw new Error('SKILL.md frontmatter must be a mapping');
    body = match[2];
  }
  const name = fields.name ?? fallbackName;
  if (typeof name !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(name)) {
    throw new Error('SKILL.md name must be a safe package name (letters, digits, hyphens, underscores)');
  }
  const description = fields.description ?? 'Autonomous skill package';
  if (typeof description !== 'string') throw new Error('SKILL.md description must be text');
  const triggers = fields.triggers ?? [name];
  if (!Array.isArray(triggers) || triggers.some(item => typeof item !== 'string')) throw new Error('SKILL.md triggers must be a list of strings');
  const allowed = fields['allowed-tools'];
  if (allowed !== undefined && typeof allowed !== 'string' && !Array.isArray(allowed)) throw new Error('SKILL.md allowed-tools must be text or a list');
  const allowedTools = allowed === undefined ? null : Array.isArray(allowed) ? allowed : allowed.split(/[\s,]+/).filter(Boolean);
  if (allowedTools?.some(item => typeof item !== 'string')) throw new Error('SKILL.md allowed-tools must contain strings');
  const section = body.match(/^## Capabilities\s*\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/im);
  const capabilities = section ? section[1].split('\n').filter(line => /^\s*(?:\d+\.|[-*])\s+/.test(line))
    .map(line => line.replace(/^\s*(?:\d+\.|[-*])\s+/, '').replace(/\*\*/g, '').trim()) : [];
  let metadata = fields.metadata || {};
  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata); } catch { throw new Error('SKILL.md metadata must be a mapping or JSON object'); }
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('SKILL.md metadata must be a mapping');
  return { name, description: description.trim(), triggers, capabilities, allowedTools,
    version: fields.version == null ? metadata.version || null : String(fields.version), metadata,
    homepage: fields.homepage || null, userInvocable: fields['user-invocable'] !== false,
    disableModelInvocation: fields['disable-model-invocation'] === true,
    content: body.trim(), filePath };
}
