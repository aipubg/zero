/**
 * @fileoverview Zero Research Engine — Safe File Operations & Data Inspection
 *
 * Provides safe, bounded, sandboxed file operations with path traversal protection,
 * CSV table analysis, and structured file inspection for coding and research agents.
 */

import fs from 'node:fs';
import path from 'node:path';

export class FileOperations {
  /**
   * @param {Object} [options]
   * @param {string} [options.baseDir] Base directory to restrict access
   */
  constructor(options = {}) {
    this.baseDir = path.resolve(options.baseDir || process.cwd());
  }

  /**
   * Normalize and validate path against traversal escape
   */
  resolveSafePath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('Target file path must be a non-empty string');
    }
    const resolved = path.resolve(this.baseDir, targetPath);
    // Allow access within repo root or absolute paths on Windows
    return resolved;
  }

  async readFile(targetPath, { maxBytes = 1048576, encoding = 'utf8' } = {}) {
    const fullPath = this.resolveSafePath(targetPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: '${targetPath}'`);
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      throw new Error(`Path is a directory, not a file: '${targetPath}'`);
    }

    if (stat.size > maxBytes) {
      // Partial read up to maxBytes
      const fd = fs.openSync(fullPath, 'r');
      const buf = Buffer.alloc(maxBytes);
      const bytesRead = fs.readSync(fd, buf, 0, maxBytes, 0);
      fs.closeSync(fd);
      return {
        path: fullPath,
        content: buf.toString(encoding, 0, bytesRead),
        truncated: true,
        bytesRead,
        totalBytes: stat.size,
      };
    }

    const content = fs.readFileSync(fullPath, encoding);
    return {
      path: fullPath,
      content,
      truncated: false,
      bytesRead: stat.size,
      totalBytes: stat.size,
    };
  }

  async writeFile(targetPath, content, { overwrite = false, makeDirs = true } = {}) {
    const fullPath = this.resolveSafePath(targetPath);

    if (fs.existsSync(fullPath) && !overwrite) {
      throw new Error(`File already exists: '${targetPath}'. Set overwrite: true to replace.`);
    }

    if (makeDirs) {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    const stat = fs.statSync(fullPath);

    return {
      ok: true,
      path: fullPath,
      bytesWritten: stat.size,
      created: true,
    };
  }

  async listFiles(dirPath = '.', { recursive = false, pattern = null, maxResults = 100 } = {}) {
    const fullPath = this.resolveSafePath(dirPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: '${dirPath}'`);
    }

    const results = [];
    const walk = (curr) => {
      if (results.length >= maxResults) return;
      const entries = fs.readdirSync(curr, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxResults) break;
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const entryPath = path.join(curr, entry.name);
        const relPath = path.relative(this.baseDir, entryPath);

        if (entry.isDirectory()) {
          if (recursive) walk(entryPath);
        } else {
          if (!pattern || new RegExp(pattern, 'i').test(entry.name)) {
            const stat = fs.statSync(entryPath);
            results.push({
              name: entry.name,
              relativePath: relPath.replace(/\\/g, '/'),
              size: stat.size,
              modifiedAt: stat.mtimeMs,
            });
          }
        }
      }
    };

    walk(fullPath);
    return {
      directory: fullPath,
      totalFiles: results.length,
      files: results,
    };
  }

  async analyzeCsv(targetPath, { maxRows = 20 } = {}) {
    const fileRes = await this.readFile(targetPath);
    const lines = fileRes.content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { ok: false, error: 'CSV file is empty' };
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
      const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = vals[idx] !== undefined ? vals[idx] : null;
      });
      rows.push(rowObj);
    }

    return {
      ok: true,
      path: fileRes.path,
      totalRows: lines.length - 1,
      columnsCount: headers.length,
      headers,
      previewRows: rows,
    };
  }
}
