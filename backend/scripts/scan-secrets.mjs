#!/usr/bin/env node
/**
 * Zero AI - Secret Scanner
 * Scans tracked source and configuration files for exposed secrets, API keys, and credentials.
 * Fails with non-zero exit code if unmasked secrets are detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.zero-data',
  'zero-data',
  '.openclaw',
  'state',
  'venv',
  '.venv',
]);

const EXCLUDED_FILES = new Set([
  '.env',
  '.env.local',
  'scan-secrets.mjs',
]);

const SECRET_PATTERNS = [
  { name: 'NVIDIA API Key', regex: /\bnvapi-[A-Za-z0-9_-]{30,}\b/ },
  { name: 'OpenAI API Key', regex: /\bsk-[A-Za-z0-9_-]{30,}\b/ },
  { name: 'Private Key Block', regex: /-----BEGIN\s+[A-Z\s]+PRIVATE\s+KEY-----/ },
  { name: 'Anthropic API Key', regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'GitHub Token', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/ },
  { name: 'Generic Live Key', regex: /"apiKey"\s*:\s*"(?!env:)[A-Za-z0-9_-]{35,}"/ },
];

function scanTrackedFiles(findings = []) {
  // Never traverse ignored owner data, downloaded models, artifacts or dependencies.
  // Failure to enumerate tracked paths is an error, never an empty clean scan.
  const tracked = execFileSync('git', ['ls-files', '--cached', '-z'], {
    cwd: REPO_ROOT, encoding: 'utf8', timeout: 30000, maxBuffer: 32 * 1024 * 1024,
  }).split('\0').filter(Boolean);
  for (const relPath of tracked) {
    const parts = relPath.split('/');
    const name = parts.at(-1);
    if (parts.slice(0, -1).some(part => EXCLUDED_DIRS.has(part))) continue;
    const fullPath = path.resolve(REPO_ROOT, relPath);
    const relative = path.relative(REPO_ROOT, fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Tracked path escapes repository');
    // A deleted tracked file has no working-tree bytes to inspect.
    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.lstatSync(fullPath);
    if (stat.isSymbolicLink()) throw new Error(`Cannot scan tracked symlink: ${relPath}`);
    if (stat.isFile()) {
      if (EXCLUDED_FILES.has(name) || name.endsWith('.png') || name.endsWith('.webp') || name.endsWith('.gguf')) {
        continue;
      }

      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        throw new Error(`Cannot read tracked file: ${relPath}`);
      }

      for (const pattern of SECRET_PATTERNS) {
        for (const match of content.matchAll(new RegExp(pattern.regex.source, 'g'))) {
          // Check if it's explicitly masked or redacted
          if (match[0].includes('REDACTED') || match[0].includes('placeholder') || match[0].includes('0000000000000000')) {
            continue;
          }
          findings.push({
            file: relPath,
            rule: pattern.name,
          });
        }
      }
    }
  }

  return findings;
}

console.log('Zero AI Secret Scanner: Scanning included tracked working-tree files for credential patterns...');
const findings = scanTrackedFiles();

if (findings.length > 0) {
  console.error(`\n❌ FAIL: Found ${findings.length} potential credential leaks:`);
  for (const f of findings) {
    console.error(`  - ${f.file} (${f.rule})`);
  }
  process.exit(1);
} else {
  console.log('✔ PASS: 0 exposed credentials found by configured patterns in included tracked files. Ignored/untracked files and excluded paths are not covered.');
  process.exit(0);
}
