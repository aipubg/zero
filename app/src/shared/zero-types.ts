/**
 * Zero shared Gateway-bridge contract types.
 *
 * These describe the reusable, server-side bridge library in `src/bridge/`.
 * They are not the product UI: the native `zero-control-ui` plugin reads the
 * canonical Gateway session catalog and chat directly. The types preserve the
 * proven wire vocabulary (WS RPC, one Gateway session per user thread, nested
 * sub-agent activity, and computer takeover through `zero.computer.control`).
 *
 * Every field whose exact wire casing is still unverified against a live
 * Gateway is marked [needs live proof] where it is used; bridge mapping layers
 * own those translations so later corrections stay local.
 */

/** Logical runtime agent identities (roster discovery is OQ-1; MVP ships one). */
export type SpecialistId = 'zero' | 'researcher' | 'operator';

export interface Specialist {
  id: SpecialistId;
  name: string;
  blurb: string;
}

export const SPECIALISTS: Specialist[] = [
  { id: 'zero', name: 'Zero', blurb: 'General assistant' },
  { id: 'researcher', name: 'Researcher', blurb: 'Deep research turns' },
  { id: 'operator', name: 'Operator', blurb: 'Computer-assisted tasks' },
];

/** One user-facing thread per OpenClaw session (D-008). */
export interface ZeroThread {
  /** zero-thread-<uuid> — the OpenClaw session key (subject to OQ-2b live check). */
  key: string;
  title: string;
  agentId: SpecialistId;
  sessionId?: string;
  createdAt: number;
  lastActivityAt?: number;
}

/** chat stream states (bridge-spike §5.2): delta | final | error | aborted. */
export type ChatStreamState = 'delta' | 'final' | 'error' | 'aborted';

export type ZeroChatEvent = {
  runId: string;
  sessionKey: string;
  state: ChatStreamState;
  message?: unknown;
  error?: string;
};

/** Tool-activity projection (from session.tool gateway events; OQ-6 payload). */
export type ZeroToolActivity = {
  sessionKey: string;
  toolName: string;
  status: 'running' | 'done' | 'failed' | 'unknown';
  startedAt: number;
  detail?: string;
};

/** zero.computer.control — canon per bridge-spike.md §11 (as updated 23 Oct)
 * and the computer lane's takeover-hold-contract.md §3: `controlLeaseId` is
 * the ONLY lease spelling in request and response (the retired transition-shim
 * spelling was removed in plugin ≥ 0.1.1; no dual read). `held`/`owned` decide
 * the pill; `reason` carries
 * refusal text/code on failures; `since`/`stats` are ignorable extras. */
export type ComputerControlAction = 'take' | 'release' | 'status';

export type ComputerControlResult = {
  held?: boolean;
  owned?: boolean;
  controlLeaseId?: string;
  resumeSnapshotRequired?: boolean;
  since?: number;
  reason?: string;
  stats?: unknown;
  /** Set by the local runtime wrapper when the gateway method itself fails. */
  code?: string;
};

/**
 * Reserved desktop-relay path from the retired prototype. The native Control
 * UI's built-in Desktop panel owns viewing and input; do not revive this relay.
 */
export const DESKTOP_RELAY_PATH = '/live/desktop';

/** STOP ALL: acknowledged layered stop across sessions (bridge contract). */
export interface StopAllResult {
  sessions: Array<{ sessionKey: string; ok: boolean; detail?: string }>;
}
