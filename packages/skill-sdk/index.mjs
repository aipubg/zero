/**
 * @fileoverview Zero Skill SDK & Canonical Skill Loader
 *
 * Discovers, parses, validates, and matches canonical SKILL.md packages.
 * Allows autonomous agents to discover capabilities by trigger phrasing and workflows.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createSkill } from '../../skills/self-learning-creator.mjs';

export class SkillLoader {
  /**
   * @param {Object} [options]
   * @param {string} [options.skillsDir] - Directory where skills are stored
   */
  constructor(options = {}) {
    this.skillsDir = options.skillsDir || path.resolve(process.cwd(), 'skills');
    this._cache = new Map();
    this.loadAll();
  }

  /**
   * Parse frontmatter and content from SKILL.md
   */
  parseSkillFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');

    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      // Basic fallback without frontmatter
      const dirName = path.basename(path.dirname(filePath));
      return {
        name: dirName,
        description: 'Autonomous skill package',
        triggers: [dirName],
        content: raw,
        filePath,
      };
    }

    const frontmatterRaw = match[1];
    const body = match[2];

    const parsed = {
      name: path.basename(path.dirname(filePath)),
      description: '',
      triggers: [],
      content: body.trim(),
      filePath,
    };

    // Parse simple YAML fields
    for (const line of frontmatterRaw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('name:')) {
        parsed.name = trimmed.slice(5).trim();
      } else if (trimmed.startsWith('description:')) {
        parsed.description = trimmed.slice(12).trim();
      } else if (trimmed.startsWith('- "') || trimmed.startsWith("- '") || trimmed.startsWith('- ')) {
        const trigger = trimmed.replace(/^-\s*["']?/, '').replace(/["']?$/, '').trim();
        if (trigger) parsed.triggers.push(trigger);
      }
    }

    // Extract capabilities from markdown bullet points
    parsed.capabilities = [];
    const capSection = body.match(/## Capabilities\r?\n([\s\S]*?)(?=\r?\n##|$)/i);
    if (capSection) {
      const lines = capSection[1].split(/\r?\n/);
      for (const l of lines) {
        const clean = l.replace(/^\d+\.\s*\*\*?/, '').replace(/\*\*?$/, '').trim();
        if (clean) parsed.capabilities.push(clean);
      }
    }

    return parsed;
  }

  /**
   * Load and cache all SKILL.md files in skills directory
   */
  loadAll() {
    this._cache.clear();
    if (!fs.existsSync(this.skillsDir)) return [];

    try {
      const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillFile = path.join(this.skillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            const skill = this.parseSkillFile(skillFile);
            if (skill && skill.name) {
              this._cache.set(skill.name, skill);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[SkillLoader] Error loading skills directory:', err.message);
    }

    return Array.from(this._cache.values());
  }

  getSkill(name) {
    if (!this._cache.has(name)) {
      this.loadAll();
    }
    return this._cache.get(name) || null;
  }

  listSkills() {
    if (this._cache.size === 0) {
      this.loadAll();
    }
    return Array.from(this._cache.values()).map((s) => ({
      name: s.name,
      description: s.description,
      triggers: s.triggers,
      capabilities: s.capabilities || [],
      filePath: s.filePath,
    }));
  }

  /**
   * Find matching skill for user instruction or prompt
   */
  matchSkill(prompt) {
    if (!prompt) return null;
    const lower = String(prompt).toLowerCase();
    const all = this.listSkills();

    let bestMatch = null;
    let highestScore = 0;

    for (const skill of all) {
      let score = 0;
      if (lower.includes(skill.name.toLowerCase())) {
        score += 10;
      }
      for (const trigger of skill.triggers) {
        if (lower.includes(trigger.toLowerCase())) {
          score += 5;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = skill;
      }
    }

    return highestScore > 0 ? { skill: bestMatch, score: highestScore } : null;
  }

  /**
   * Programmatically create a new skill package
   */
  createCustomSkill(params) {
    const res = createSkill(params);
    if (res.ok) {
      this.loadAll();
    }
    return res;
  }
}
