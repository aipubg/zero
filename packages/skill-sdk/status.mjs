import fs from 'node:fs';
import path from 'node:path';

const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
export function hasBinary(name) {
  if (!name || /[\\/]/.test(name)) return false;
  const extensions = process.platform === 'win32' ? ['', ...(process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')] : [''];
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    if (!directory) continue;
    for (const extension of extensions) {
      const file = path.join(directory.replace(/^"|"$/g, ''), name + extension);
      try {
        if (fs.statSync(file).isFile()) {
          fs.accessSync(file, process.platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
          return true;
        }
      } catch {}
    }
  }
  return false;
}

export function skillStatusRow(skill) {
  const metadata = skill.metadata?.zero || skill.metadata?.openclaw || skill.metadata?.clawdbot || skill.metadata?.moltbot || {};
  const requires = metadata.requires || {};
  const requirements = { bins: strings(requires.bins), anyBins: strings(requires.anyBins), env: strings(requires.env), config: strings(requires.config), os: strings(metadata.os) };
  const configChecks = requirements.config.map(key => {
    const value = key.split('.').reduce((object, part) => object && Object.hasOwn(object, part) ? object[part] : undefined, skill.config);
    return { path: key, value: Boolean(value), satisfied: Boolean(value) };
  });
  const missing = {
    bins: requirements.bins.filter(name => !hasBinary(name)),
    anyBins: requirements.anyBins.some(hasBinary) ? [] : requirements.anyBins,
    env: requirements.env.filter(name => !(skill.config?.env?.[name] || process.env[name] || (metadata.primaryEnv === name && skill.config?.apiKey))),
    config: configChecks.filter(check => !check.satisfied).map(check => check.path),
    os: requirements.os.length && !requirements.os.includes(process.platform) ? requirements.os : [],
  };
  const eligible = skill.enabled && (metadata.always === true || Object.values(missing).every(values => !values.length));
  return {
    name: skill.name, skillKey: skill.name, description: skill.description, version: skill.version,
    source: skill.managed ? 'zero-managed' : 'zero-bundled', bundled: !skill.managed,
    filePath: skill.filePath, baseDir: path.dirname(skill.filePath), enabled: skill.enabled, disabled: !skill.enabled,
    always: metadata.always === true, blockedByAllowlist: false, blockedByAgentFilter: false,
    eligible, platformIncompatible: missing.os.length > 0, modelVisible: eligible && !skill.disableModelInvocation,
    userInvocable: skill.userInvocable, commandVisible: eligible && skill.userInvocable,
    emoji: metadata.emoji, homepage: skill.homepage || metadata.homepage, primaryEnv: metadata.primaryEnv,
    requirements, missing, configChecks,
    // Dependency installers in external metadata are not registered executable capabilities.
    install: [], triggers: skill.triggers, capabilities: skill.capabilities, allowedTools: skill.allowedTools,
    managed: skill.managed, installedAt: skill.installedAt, updatedAt: skill.updatedAt,
    origin: skill.source, status: !skill.enabled ? 'disabled' : eligible ? 'ready' : 'needs-setup',
  };
}
