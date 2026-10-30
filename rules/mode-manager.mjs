import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "active-mode.json");

export const MODES = Object.freeze({
  OWNER: "owner",
  DISTRIBUTION: "distribution",
});

export class ModeManager {
  constructor() {
    this.activeMode = MODES.OWNER; // Default to Owner Mode for high autonomy
    this.ownerPolicy = this.loadPolicy("owner-policy.json");
    this.distRules = this.loadPolicy("distribution-rules.json");
    this.loadActiveMode();
  }

  loadPolicy(filename) {
    try {
      const filePath = path.join(__dirname, filename);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    } catch {
      // fallback
    }
    return {};
  }

  loadActiveMode() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        if (raw.mode === MODES.OWNER || raw.mode === MODES.DISTRIBUTION) {
          this.activeMode = raw.mode;
        }
      }
    } catch {
      // ignore
    }
  }

  saveActiveMode() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify({ mode: this.activeMode, updatedAt: Date.now() }, null, 2), "utf8");
    } catch {
      // ignore
    }
  }

  getMode() {
    return this.activeMode;
  }

  getPolicy() {
    return this.activeMode === MODES.OWNER ? this.ownerPolicy : this.distRules;
  }

  setMode(mode) {
    if (mode !== MODES.OWNER && mode !== MODES.DISTRIBUTION) {
      throw new Error(`Invalid mode: ${mode}. Must be 'owner' or 'distribution'.`);
    }
    this.activeMode = mode;
    this.saveActiveMode();
    return { ok: true, mode: this.activeMode, policy: this.getPolicy() };
  }

  isOwnerMode() {
    return this.activeMode === MODES.OWNER;
  }

  shouldBypassConfirmation(actionName = "") {
    if (this.isOwnerMode()) {
      return true;
    }
    const policy = this.getPolicy();
    if (policy.bypassConfirmation) return true;
    if (policy.requireConfirmation && policy.requireConfirmation[actionName] === false) {
      return true;
    }
    return false;
  }
}

export const modeManager = new ModeManager();
