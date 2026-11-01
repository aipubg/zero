#!/usr/bin/env node
/**
 * Zero AI - Secret Scanner
 * Scans tracked source and configuration files for exposed secrets, API keys, and credentials.
 * Fails with non-zero exit code if unmasked secrets are detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function scanDirectory(dir, findings = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(REPO_ROOT, fullPath);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, findings);
    } else if (entry.isFile()) {
      if (EXCLUDED_FILES.has(entry.name) || entry.name.endsWith('.png') || entry.name.endsWith('.webp') || entry.name.endsWith('.gguf')) {
        continue;
      }

      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue; // Binary or unreadable
      }

      for (const pattern of SECRET_PATTERNS) {
        const match = content.match(pattern.regex);
        if (match) {
          // Check if it's explicitly masked or redacted
          if (match[0].includes('REDACTED') || match[0].includes('placeholder') || match[0].includes('0000000000000000')) {
            continue;
          }
          findings.push({
            file: relPath,
            rule: pattern.name,
            snippet: match[0].slice(0, 8) + '...' + match[0].slice(-4),
          });
        }
      }
    }
  }

  return findings;
}

console.log('Zero AI Secret Scanner: Scanning repository for credential leaks...');
const findings = scanDirectory(REPO_ROOT);

if (findings.length > 0) {
  console.error(`\n❌ FAIL: Found ${findings.length} potential credential leaks:`);
  for (const f of findings) {
    console.error(`  - ${f.file} (${f.rule}): ${f.snippet}`);
  }
  process.exit(1);
} else {
  console.log('✔ PASS: 0 exposed credentials found across repository.');
  process.exit(0);
}
