/**
 * @fileoverview Zero Skill SDK & Canonical Skill Loader
 *
 * Discovers, parses, validates, and matches canonical SKILL.md packages.
 * Allows autonomous agents to discover capabilities by trigger phrasing and workflows.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseSkillMarkdown } from './frontmatter.mjs';
import { SkillStore } from './store.mjs';
import { executeLoadedSkill } from './execution.mjs';

export class SkillLoader extends SkillStore {
  /**
   * @param {Object} [options]
   * @param {string} [options.skillsDir] - Directory where skills are stored
   */
  constructor(options = {}) {
    super(options);
    this._cache = new Map();
    this.diagnostics = [];
    this.loadAll();
  }

  /**
   * Parse frontmatter and content from SKILL.md
   */
  parseSkillFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return parseSkillMarkdown(fs.readFileSync(filePath, 'utf8'), path.basename(path.dirname(filePath)), filePath);
  }

  /**
   * Load and cache all SKILL.md files in skills directory
   */
  loadAll() {
    this._cache.clear();
    this.diagnostics = [];
    const state = this._readState();
    if (!fs.existsSync(this.skillsDir)) return [];

    try {
      const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const skillFile = path.join(this.skillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            try {
              if (fs.lstatSync(skillFile).isSymbolicLink()) throw new Error('SKILL.md cannot be a symbolic link');
              const skill = this.parseSkillFile(skillFile);
              if (this._cache.has(skill.name)) throw new Error(`Duplicate skill name '${skill.name}'`);
              this._cache.set(skill.name, this._decorate(skill, state));
            } catch (error) { this.diagnostics.push({ filePath: skillFile, error: error.message }); }
          }
        }
      }
    } catch (err) {
      this.diagnostics.push({ filePath: this.skillsDir, error: err.message });
    }

    return Array.from(this._cache.values());
  }

  getSkill(name) {
    this.loadAll();
    return this._cache.get(name) || null;
  }

  listSkills() {
    this.loadAll();
    return Array.from(this._cache.values()).map(({ content, ...skill }) => skill);
  }

  getStatus() {
    const skills = this.listSkills();
    return { ok: true, skillsDir: this.skillsDir, total: skills.length,
      enabled: skills.filter(skill => skill.enabled).length, disabled: skills.filter(skill => !skill.enabled).length,
      skills, diagnostics: this.diagnostics };
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
      if (!skill.enabled) continue;
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
   * Execute a skill through the ZERO capability and task execution engine
   * @param {string} skillName
   * @param {Object} [params]
   * @param {Object} [context]
   * @returns {Promise<Object>}
   */
  async executeSkill(skillName, params = {}, context = {}) {
    return executeLoadedSkill(this, skillName, params, context);
  }
}
