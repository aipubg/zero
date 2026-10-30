/**
 * OpenDots Spaces Manager for Project Zero
 * Manages shared backend spaces state across the single canonical `/chat/zero` interface:
 * - Coder Space (Repo code, diffs, terminal execution)
 * - Media Space (Video/YouTube playback observation, audio transcription)
 * - Research Space (Deep web search, citations, verified sources)
 */

export const SPACE_IDS = Object.freeze({
  CODER: "coder",
  MEDIA: "media",
  RESEARCH: "research",
});

const DEFAULT_SPACES = {
  [SPACE_IDS.CODER]: {
    id: SPACE_IDS.CODER,
    name: "Coder Space",
    icon: "💻",
    description: "Code generation, git diff inspection & terminal execution",
    activeFile: null,
    files: [],
    openDiffs: [],
    terminalHistory: [],
    status: "ready",
  },
  [SPACE_IDS.MEDIA]: {
    id: SPACE_IDS.MEDIA,
    name: "Media Space",
    icon: "🎬",
    description: "Screen & video observation, YouTube analysis, audio transcription",
    activeMediaUrl: null,
    recentMediaLogs: [],
    transcripts: [],
    status: "ready",
  },
  [SPACE_IDS.RESEARCH]: {
    id: SPACE_IDS.RESEARCH,
    name: "Research Space",
    icon: "🔍",
    description: "Deep web research, synthesis, and verified sources carousel",
    topics: [],
    sources: [],
    activeReport: null,
    status: "ready",
  },
};

class SpacesManager {
  constructor() {
    this.activeSpace = SPACE_IDS.CODER;
    this.spaces = JSON.parse(JSON.stringify(DEFAULT_SPACES));
    this.listeners = new Set();
    this.storageKey = "zero_spaces_state_v1";
    this.loadPersisted();
  }

  loadPersisted() {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.activeSpace && DEFAULT_SPACES[parsed.activeSpace]) {
          this.activeSpace = parsed.activeSpace;
        }
        if (parsed.spaces && typeof parsed.spaces === "object") {
          for (const key of Object.keys(DEFAULT_SPACES)) {
            if (parsed.spaces[key]) {
              this.spaces[key] = { ...this.spaces[key], ...parsed.spaces[key] };
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  persist() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          activeSpace: this.activeSpace,
          spaces: this.spaces,
        })
      );
    } catch {
      // ignore
    }
  }

  subscribe(listener) {
    if (typeof listener === "function") {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  notify() {
    this.persist();
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch {
        // ignore
      }
    }
  }

  getState() {
    return {
      activeSpace: this.activeSpace,
      spaces: { ...this.spaces },
      current: this.spaces[this.activeSpace],
    };
  }

  setActiveSpace(spaceId) {
    if (!DEFAULT_SPACES[spaceId]) return false;
    if (this.activeSpace === spaceId) return true;
    this.activeSpace = spaceId;
    this.notify();
    return true;
  }

  updateSpace(spaceId, updates = {}) {
    if (!this.spaces[spaceId]) return false;
    this.spaces[spaceId] = {
      ...this.spaces[spaceId],
      ...updates,
    };
    this.notify();
    return true;
  }

  recordTerminal(command, output) {
    const history = this.spaces[SPACE_IDS.CODER].terminalHistory || [];
    history.push({ command, output, timestamp: Date.now() });
    if (history.length > 50) history.shift();
    this.updateSpace(SPACE_IDS.CODER, { terminalHistory: history });
  }

  recordDiff(filename, original, modified) {
    const diffs = this.spaces[SPACE_IDS.CODER].openDiffs || [];
    diffs.push({ filename, original, modified, timestamp: Date.now() });
    if (diffs.length > 10) diffs.shift();
    this.updateSpace(SPACE_IDS.CODER, { openDiffs: diffs });
  }

  recordMediaLog(log) {
    const logs = this.spaces[SPACE_IDS.MEDIA].recentMediaLogs || [];
    logs.unshift({ ...log, timestamp: Date.now() });
    if (logs.length > 25) logs.pop();
    this.updateSpace(SPACE_IDS.MEDIA, { recentMediaLogs: logs });
  }

  recordSources(query, sources) {
    const existing = this.spaces[SPACE_IDS.RESEARCH].sources || [];
    const updated = [...sources, ...existing];
    this.updateSpace(SPACE_IDS.RESEARCH, { sources: updated.slice(0, 30) });
  }
}

export const spacesManager = new SpacesManager();
