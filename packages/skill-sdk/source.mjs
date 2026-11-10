import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export function githubSource(input, options = {}) {
  let url;
  try { url = new URL(input); } catch { return null; }
  if (!['github.com', 'raw.githubusercontent.com'].includes(url.hostname)) return null;
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Use an HTTPS GitHub URL without credentials, query, or fragment');
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const [owner, repoPart, kind, ...tail] = parts;
  const repo = repoPart?.replace(/\.git$/, '');
  if (!owner || !repo || ['.', '..'].includes(owner) || ['.', '..'].includes(repo) || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) throw new Error('Invalid GitHub repository URL');
  let ref = options.ref || null;
  let subpath = options.subpath || '';
  if (url.hostname === 'raw.githubusercontent.com') {
    ref ||= kind;
    subpath ||= tail.join('/');
  } else if (kind) {
    if (!['tree', 'blob'].includes(kind) || !tail.length) throw new Error('Expected a GitHub repository, tree, or SKILL.md URL');
    ref ||= tail[0];
    subpath ||= tail.slice(1).join('/');
  }
  if (ref && (typeof ref !== 'string' || ref.startsWith('-') || /[\r\n\0]/.test(ref))) throw new Error('Invalid GitHub ref');
  subpath = subpath.replace(/\/SKILL\.md$/i, '').replace(/^SKILL\.md$/i, '');
  if (path.isAbsolute(subpath) || subpath.split(/[\\/]/).some(part => part === '..') || subpath.includes('\0')) throw new Error('GitHub skill path must stay inside the repository');
  return { type: 'github', url: `https://github.com/${owner}/${repo}.git`, ref, subpath };
}

export function copySkillTree(source, destination) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error(`Skill packages cannot contain symbolic links: ${source}`);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      if (entry === '.git' || entry === '.zero-skills.json' || entry.startsWith('.skill-')) continue;
      copySkillTree(path.join(source, entry), path.join(destination, entry));
    }
  } else if (stat.isFile()) {
    fs.copyFileSync(source, destination);
    fs.chmodSync(destination, stat.mode & 0o777);
  } else {
    throw new Error(`Unsupported skill package entry: ${source}`);
  }
}

/** Acquire a source snapshot. Git is a transport only; installed scripts are never run here. */
export async function acquireSource(input, options = {}) {
  const source = typeof input === 'object' && input !== null ? input : githubSource(input, options) || { type: 'local', path: path.resolve(input) };
  if (source.type === 'local') {
    const supplied = path.resolve(source.path);
    if (fs.lstatSync(supplied).isSymbolicLink()) throw new Error('Local skill source cannot be a symbolic link');
    const directory = fs.statSync(supplied).isFile() ? path.dirname(supplied) : supplied;
    if (!fs.existsSync(path.join(directory, 'SKILL.md'))) throw new Error('Local skill source requires SKILL.md');
    return { directory, source: { type: 'local', path: directory }, cleanup() {} };
  }
  if (source.type !== 'github') throw new Error('Unsupported skill source');
  const checked = githubSource(source.url, { ...source, ...(options.ref !== undefined ? { ref: options.ref } : {}), ...(options.subpath !== undefined ? { subpath: options.subpath } : {}) });
  if (!checked) throw new Error('Expected a GitHub repository URL');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-skill-github-'));
  const checkout = path.join(temporary, 'repository');
  const cleanup = () => {
    if (!fs.existsSync(temporary)) return;
    const resolved = fs.realpathSync.native(temporary);
    if (path.dirname(resolved) !== fs.realpathSync.native(os.tmpdir()) || !path.basename(resolved).startsWith('zero-skill-github-')) throw new Error('Refusing to remove an unexpected skill source directory');
    fs.rmSync(resolved, { recursive: true, force: true });
  };
  try {
    const pinnedCommit = checked.ref && /^[a-f0-9]{40}$/i.test(checked.ref);
    const gitOptions = {
      windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    };
    const deadline = Date.now() + 120000;
    const git = args => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('GitHub skill acquisition timed out');
      return run('git', args, { ...gitOptions, timeout: remaining });
    };
    if (pinnedCommit) {
      // Fetch only the requested snapshot, not the unrelated current HEAD first.
      await git(['init', '--quiet', checkout]);
      await git(['-C', checkout, 'remote', 'add', 'origin', checked.url]);
      await git(['-C', checkout, 'fetch', '--depth', '1', '--no-tags', 'origin', checked.ref]);
      await git(['-C', checkout, 'checkout', '--detach', 'FETCH_HEAD']);
    } else await git(['clone', '--depth', '1', '--no-tags', ...(checked.ref ? ['--branch', checked.ref] : []), '--', checked.url, checkout]);
    const directory = path.resolve(checkout, checked.subpath);
    if (directory !== checkout && !directory.startsWith(checkout + path.sep)) throw new Error('Skill path escapes repository');
    // A symlink in any ancestor must not allow a selected subtree to escape checkout.
    let current = directory;
    while (current !== checkout) {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error('GitHub skill path cannot contain symbolic links');
      current = path.dirname(current);
    }
    if (!fs.existsSync(path.join(directory, 'SKILL.md'))) throw new Error('GitHub skill source requires SKILL.md; specify subpath for repositories with multiple skills');
    const { stdout } = await git(['-C', checkout, 'rev-parse', 'HEAD']);
    const revision = stdout.trim();
    if (pinnedCommit && revision.toLowerCase() !== checked.ref.toLowerCase()) throw new Error('Git snapshot differs from the requested pinned revision');
    return { directory, source: { ...checked, revision }, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
