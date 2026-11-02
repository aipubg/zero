import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const runFile = promisify(execFile);
const marker = '.zero-plugin-revision';

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function readJson(file, optional = false) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw new Error(`Cannot read plugin JSON '${file}': ${error.message}`, { cause: error });
  }
}

async function containedFile(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) {
    throw new Error('Plugin entry/manifest must be a relative file path');
  }
  const file = path.resolve(root, relative);
  if (!inside(root, file) || !inside(await fs.realpath(root), await fs.realpath(file))) {
    throw new Error('Plugin entry/manifest escapes its package directory');
  }
  if (!(await fs.stat(file)).isFile()) throw new Error(`Plugin file is not a regular file: ${relative}`);
  return file;
}

async function assertCopyable(directory) {
  // Never follow a package junction/symlink into user data or another installation.
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    if (item.name === '.git' || item.name === '.bin') continue;
    const file = path.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error(`Plugin source contains a symlink: ${file}`);
    if (item.isDirectory()) await assertCopyable(file);
    else if (!item.isFile()) throw new Error(`Plugin source contains a special file: ${file}`);
  }
}

export class PluginSourceLoader {
  constructor(pluginsDir, { npmCliPath } = {}) {
    this.pluginsDir = path.resolve(pluginsDir);
    this.releasesDir = path.join(this.pluginsDir, 'releases');
    this.npmCliPath = npmCliPath;
  }

  async _allocate() {
    await fs.mkdir(this.releasesDir, { recursive: true });
    const root = await fs.mkdtemp(path.join(this.releasesDir, 'revision-'));
    await fs.writeFile(path.join(root, marker), path.basename(root));
    return root;
  }

  async discard(source) {
    if (!source?.root) return;
    const root = path.resolve(source.root);
    // Only remove our own immediate revision directory, never a source/data dir.
    if (path.dirname(root) !== this.releasesDir || !path.basename(root).startsWith('revision-')) {
      throw new Error('Refusing to remove an unmanaged plugin directory');
    }
    let contents;
    try {
      if ((await fs.lstat(root)).isSymbolicLink()) throw new Error('Refusing to remove a linked plugin revision');
      if (path.dirname(await fs.realpath(root)) !== await fs.realpath(this.releasesDir)) {
        throw new Error('Plugin revision escapes managed storage');
      }
      contents = await fs.readFile(path.join(root, marker), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    if (contents !== path.basename(root)) throw new Error('Plugin revision ownership marker mismatch');
    await fs.rm(root, { recursive: true, force: true });
  }

  async _copy(from, to) {
    from = await fs.realpath(from);
    if (inside(from, to)) throw new Error('Plugin storage must be outside the source directory');
    await assertCopyable(from);
    await fs.cp(from, to, {
      recursive: true,
      filter: (file) => !['.git', '.bin', marker].includes(path.basename(file)),
    });
    await fs.writeFile(path.join(to, marker), path.basename(to));
  }

  async _npmCli() {
    const candidates = [
      this.npmCliPath,
      process.env.npm_execpath,
      path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
      ...String(process.env.PATH || '').split(path.delimiter).flatMap((directory) => [
        path.join(directory, 'node_modules/npm/bin/npm-cli.js'),
        path.resolve(directory, '../lib/node_modules/npm/bin/npm-cli.js'),
      ]),
    ];
    for (const candidate of candidates.filter(Boolean)) {
      if (!/npm-cli\.(?:c?js|mjs)$/.test(candidate)) continue;
      try { if ((await fs.stat(candidate)).isFile()) return candidate; } catch {}
    }
    throw new Error('npm CLI not found; set PluginManager option npmCliPath to npm-cli.js');
  }

  async stage(input) {
    const root = await this._allocate();
    let source;
    try {
      let packageRoot = root;
      if (input?.root && input.revision) {
        await this._copy(input.root, root);
        packageRoot = path.resolve(root, input.packageRoot || '.');
        if (!inside(root, packageRoot)) throw new Error('Stored package path escapes its revision');
        source = { ...input, root, revision: path.basename(root) };
      } else if (input.kind === 'directory') {
        await this._copy(path.resolve(input.spec), root);
        source = { kind: 'directory', spec: path.resolve(input.spec), root, packageRoot: '.', revision: path.basename(root) };
      } else if (input.kind === 'package') {
        if (typeof input.spec !== 'string' || !input.spec.trim() || input.spec.startsWith('-')) {
          throw new Error('Plugin package requires a package specifier or local tarball path');
        }
        let spec = input.spec;
        try { if ((await fs.stat(spec)).isFile()) spec = path.resolve(spec); } catch {}
        await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ private: true, name: 'zero-plugin-install', version: '1.0.0' }));
        await runFile(process.execPath, [await this._npmCli(), 'install', '--prefix', root,
          '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', '--save-exact', '--install-links', '--', spec],
        { cwd: root, windowsHide: true, timeout: 120_000, maxBuffer: 2 * 1024 * 1024 });
        const installed = await readJson(path.join(root, 'package.json'));
        const names = Object.keys(installed.dependencies || {});
        if (names.length !== 1) throw new Error('Plugin package must resolve to one direct dependency');
        packageRoot = path.resolve(root, 'node_modules', names[0]);
        if (!inside(root, packageRoot)) throw new Error('Invalid installed package name');
        await assertCopyable(root);
        source = { kind: 'package', spec: input.spec, root, packageRoot: path.relative(root, packageRoot), revision: path.basename(root) };
      } else {
        throw new Error('Unsupported plugin source');
      }
      const { manifest, entry } = await this.describe(packageRoot);
      source.entry = path.relative(root, entry);
      return { manifest, source };
    } catch (error) {
      await this.discard({ root });
      throw error;
    }
  }

  async describe(directory) {
    const pkg = await readJson(path.join(directory, 'package.json'), true);
    let manifest;
    for (const name of ['zero.plugin.json', 'plugin.json', 'openclaw.plugin.json']) {
      manifest = await readJson(path.join(directory, name), true);
      if (manifest) break;
    }
    if (!manifest && typeof pkg?.zeroPlugin === 'string') {
      manifest = await readJson(await containedFile(directory, pkg.zeroPlugin));
    }
    manifest ||= pkg?.zeroPlugin || (pkg && { ...pkg, id: pkg.id || pkg.name });
    if (!manifest || typeof manifest !== 'object') throw new Error('Plugin source requires a plugin manifest or package.json');
    manifest = { ...manifest, version: manifest.version || pkg?.version };
    let entry = manifest.entry || manifest.entrypoint || manifest.main || pkg?.main;
    if (!entry) {
      for (const name of ['index.mjs', 'index.js', 'plugin.mjs', 'plugin.js', 'index.cjs']) {
        try { await fs.access(path.join(directory, name)); entry = name; break; } catch {}
      }
    }
    if (!entry) throw new Error('Plugin source has no executable entry');
    return { manifest, entry: await containedFile(directory, entry) };
  }

  async import(source) {
    const entry = await containedFile(source.root, source.entry);
    // Each staged revision has its own path, including relative dependencies.
    return import(`${pathToFileURL(entry).href}?instance=${randomUUID()}`);
  }
}
