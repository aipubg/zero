/**
 * Zero computer-control hold client and native-surface controls.
 *
 * The authoritative state lives in the Zero policy plugin
 * (`zero.computer.control`). This module is a thin client: it never infers
 * ownership from a click, never mints a lease, never caches a lease across a
 * reconnect, and never opens a second desktop transport. The native Desktop
 * panel still owns viewing and the upstream viewer-control flag; this hold is
 * the separate authority that refuses agent input.
 *
 * Leaving the Desktop surface hands back only the hold this view took. That is
 * a behavior pattern (no source copied) from OpenMausBot's Apache-2.0
 * `src/components/computer-takeover.ts`; see reports/ui/openmausbot-ui-reference.md.
 * The Gateway remains authoritative: a failed hand-back is never rendered as
 * success, and the plugin still releases on connection close.
 */

import { COMPUTER_CONTROL_METHOD } from "../constants.js";
import { isMissingMethod, readableError } from "../shared/errors.js";
import {
  computerScopeLabel,
  isComputerHeldByZero,
  isHoldConflict,
} from "./presentation.js";

const HOLD_ACTIONS = ["take", "release", "status"];

const STATE_LABELS = {
  loading: "Checking",
  unknown: "Unknown",
  unavailable: "Unavailable",
  free: "Free",
  "held-this-client": "Held by you",
  "held-other": "Held by another client",
};

const STATE_TONES = {
  loading: "neutral",
  unknown: "warn",
  unavailable: "error",
  free: "ok",
  "held-this-client": "busy",
  "held-other": "warn",
};

/**
 * Normalize the plugin snapshot. A malformed payload is rejected rather than
 * guessed at: the caller then shows `unknown`, never `free`.
 */
function normalizeSnapshot(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.held !== "boolean") return null;
  const lease =
    typeof value.controlLeaseId === "string" && value.controlLeaseId.trim()
      ? value.controlLeaseId
      : null;
  return {
    held: value.held,
    owned: value.owned === true,
    scope: value.scope === "session" ? "session" : "global",
    controlLeaseId: lease,
    resumeSnapshotRequired: value.resumeSnapshotRequired === true,
    since: Number.isFinite(value.since) ? value.since : null,
    reason: typeof value.reason === "string" ? value.reason : null,
    stats: value.stats && typeof value.stats === "object" ? value.stats : null,
    recent: Array.isArray(value.recent) ? value.recent : [],
  };
}

/** Unwrap `{ result }` from the host RPC without losing a direct payload. */
function unwrapResult(response) {
  if (response && typeof response === "object" && "result" in response) {
    return response.result;
  }
  return response;
}

function classifyError(error) {
  if (isMissingMethod(error)) return "unavailable";
  const message = readableError(error);
  if (isHoldConflict(error)) return "conflict";
  return "error";
}

/**
 * Pure projection of a controller state into what the user may see and do.
 * `state.phase` is one of loading|ready|unknown|unavailable.
 */
function holdView(state = {}) {
  const {
    phase = "loading",
    snapshot = null,
    error = null,
    busy = false,
    connected = true,
  } = state;
  let status;
  if (!connected) {
    // A cached snapshot is never authority while the Gateway is unreachable.
    status = "unknown";
  } else if (phase === "ready") {
    if (!snapshot) status = "unknown";
    else if (!snapshot.held) status = "free";
    else status = isComputerHeldByZero(snapshot) ? "held-this-client" : "held-other";
  } else {
    status = phase;
  }

  const scope = computerScopeLabel(snapshot);
  let detail;
  if (!connected) {
    detail =
      "Gateway disconnected. Computer-control ownership is unknown until the connection returns; no lease is cached.";
  } else if (status === "loading") {
    detail = "Reading the hold state from the Gateway.";
  } else if (status === "unknown") {
    detail =
      "The Gateway did not return a usable hold snapshot. Treat computer control as unknown, not free.";
  } else if (status === "unavailable") {
    detail =
      "This Gateway does not expose zero.computer.control. Computer control cannot be verified from this screen.";
  } else if (status === "free") {
    detail = snapshot?.resumeSnapshotRequired
      ? "Released. Zero must capture a fresh desktop before its next action."
      : "No human hold is active. Zero may act when it has a fresh capture.";
  } else if (status === "held-this-client") {
    detail =
      "Agent input is refused while you hold control; observation remains available. Release to hand control back, or leave this screen to hand it back automatically.";
  } else if (snapshot?.owned === true) {
    detail =
      "The Gateway reports a hold for this connection but returned no usable release lease. Re-read status before acting.";
  } else {
    detail =
      "Another client holds control. This hold is global and affects all sessions; wait for that client to release.";
  }

  return {
    state: status,
    label: STATE_LABELS[status] ?? "Unknown",
    tone: STATE_TONES[status] ?? "warn",
    detail,
    scope,
    error: error ? readableError(error) : null,
    busy,
    connected,
    resumeSnapshotRequired: snapshot?.resumeSnapshotRequired === true,
    canTake: connected && !busy && (status === "free" || status === "unknown"),
    canRelease: connected && !busy && status === "held-this-client",
    canRefresh: !busy,
    // Deliberately not exposed for display. It exists only to authorize release.
    releaseLeaseId: status === "held-this-client" ? snapshot?.controlLeaseId ?? null : null,
  };
}

/**
 * Controller for the hold RPC.
 *
 * Race rules:
 *  - an action (take/release) bumps `generation`; a status response started
 *    before that action is ignored;
 *  - a second click while an action is in flight is a no-op;
 *  - a disconnect bumps `generation`, clears the cached snapshot/lease, and
 *    shows `unknown`; the first successful status after reconnect is
 *    authoritative;
 *  - an action error never renders success. Conflict errors re-read status;
 *    all other errors become `unknown` until a successful status arrives.
 */
function createComputerHold({
  request,
  onState = () => {},
  pollMs = 5000,
  autoStart = true,
  setIntervalFn = typeof setInterval === "function" ? setInterval : null,
  clearIntervalFn = typeof clearInterval === "function" ? clearInterval : null,
} = {}) {
  if (typeof request !== "function") throw new Error("A Gateway request function is required.");

  let disposed = false;
  let generation = 0;
  let actionInFlight = false;
  let pendingTake = null;
  let pendingRelease = null;
  let timer = null;
  let connected = true;
  let state = {
    phase: "loading",
    snapshot: null,
    error: null,
    busy: false,
    connected: true,
  };

  const view = () => holdView(state);
  const emit = () => {
    if (!disposed) onState(view(), state);
  };
  const setState = (next) => {
    state = { ...state, ...next, connected };
    emit();
  };
  const isCurrent = (id) => !disposed && id === generation;

  const call = async (action, params) => {
    const response = await request(COMPUTER_CONTROL_METHOD, params);
    return normalizeSnapshot(unwrapResult(response));
  };

  const applySnapshot = (snapshot) => {
    setState({ phase: "ready", snapshot, error: null, busy: false });
  };

  const applyUnknown = (error) => {
    setState({ phase: "unknown", snapshot: null, error, busy: false });
  };

  const applyUnavailable = (error) => {
    setState({ phase: "unavailable", snapshot: null, error, busy: false });
  };

  /**
   * Fire-and-forget hand-back. The caller is leaving, so no response may be
   * rendered; a rejected release is dropped and the plugin's connection-close
   * release remains the backstop.
   */
  const sendRelease = (leaseId) => {
    try {
      const pending = request(COMPUTER_CONTROL_METHOD, {
        action: "release",
        controlLeaseId: leaseId,
      });
      if (pending && typeof pending.catch === "function") pending.catch(() => {});
    } catch {
      // A failed hand-back must never block navigation.
    }
  };

  const refresh = async () => {
    if (disposed || actionInFlight) return view();
    const id = generation;
    try {
      const snapshot = await call("status", { action: "status" });
      if (!isCurrent(id)) return view();
      if (!snapshot) applyUnknown(new Error("The Gateway returned no usable hold snapshot."));
      else applySnapshot(snapshot);
    } catch (error) {
      if (!isCurrent(id)) return view();
      if (classifyError(error) === "unavailable") applyUnavailable(error);
      else applyUnknown(error);
    }
    return view();
  };

  const take = async () => {
    if (disposed) return view();
    if (actionInFlight) return view();
    if (!connected) {
      applyUnknown(new Error("Gateway disconnected; reconnect before taking control."));
      return view();
    }
    actionInFlight = true;
    generation += 1;
    const id = generation;
    setState({ phase: state.phase, error: null, busy: true });
    try {
      pendingTake = call("take", { action: "take" });
      const snapshot = await pendingTake;
      if (!isCurrent(id)) return view();
      if (!snapshot) applyUnknown(new Error("The Gateway returned no usable hold snapshot."));
      else applySnapshot(snapshot);
    } catch (error) {
      if (!isCurrent(id)) return view();
      if (classifyError(error) === "unavailable") applyUnavailable(error);
      else if (classifyError(error) === "conflict") {
        // Another client owns the global hold. Re-read rather than assume.
        applyUnknown(error);
        actionInFlight = false;
        return refresh();
      } else applyUnknown(error);
    } finally {
      pendingTake = null;
      if (isCurrent(id)) actionInFlight = false;
    }
    return view();
  };

  const release = async () => {
    if (disposed) return view();
    if (actionInFlight) return view();
    const leaseId = view().releaseLeaseId;
    if (!leaseId) {
      applyUnknown(new Error("This client has no release lease; re-read status."));
      return view();
    }
    if (!connected) {
      applyUnknown(new Error("Gateway disconnected; the hold is no longer owned by this client."));
      return view();
    }
    actionInFlight = true;
    generation += 1;
    const id = generation;
    setState({ phase: state.phase, error: null, busy: true });
    try {
      pendingRelease = call("release", {
        action: "release",
        controlLeaseId: leaseId,
      });
      const snapshot = await pendingRelease;
      if (!isCurrent(id)) return view();
      if (!snapshot) applyUnknown(new Error("The Gateway returned no usable hold snapshot."));
      else applySnapshot(snapshot);
    } catch (error) {
      if (!isCurrent(id)) return view();
      if (classifyError(error) === "unavailable") applyUnavailable(error);
      else {
        // Never retain a lease that the Gateway rejected. A conflict is
        // re-read; any other failure is honestly unknown.
        applyUnknown(error);
        if (classifyError(error) === "conflict") {
          actionInFlight = false;
          return refresh();
        }
      }
    } finally {
      pendingRelease = null;
      if (isCurrent(id)) actionInFlight = false;
    }
    return view();
  };

  const setConnected = (next) => {
    const value = next !== false;
    if (value === connected) return view();
    connected = value;
    generation += 1;
    actionInFlight = false;
    if (!value) {
      setState({
        phase: "unknown",
        snapshot: null,
        error: new Error("Gateway disconnected. Computer-control state is unknown."),
        busy: false,
      });
      return view();
    }
    setState({ phase: "loading", snapshot: null, error: null, busy: false });
    return refresh();
  };

  /**
   * Hand back on leaving the Desktop surface or the page.
   *
   * Only a hold this client took is released (`releaseLeaseId` is populated
   * only for `owned` snapshots). A take still in flight is awaited just long
   * enough to release the lease it returns; a release already in flight is not
   * duplicated. Nothing is rendered after this call, and no failure is turned
   * into a success state.
   */
  const leave = () => {
    if (disposed) return view();
    const leaseId = view().releaseLeaseId;
    const taking = pendingTake;
    const releasing = pendingRelease;
    disposed = true;
    generation += 1;
    actionInFlight = false;
    stop();
    if (releasing) {
      // Already handing back; do not send a second release for the same lease.
    } else if (taking) {
      // Prefer the lease the take returns: an idempotent take may return the
      // existing lease, and a re-take may mint a different one. If the take
      // fails, the hold we already had is still ours to hand back.
      taking
        .then((snapshot) => {
          const pendingLease = snapshot?.controlLeaseId ?? leaseId;
          if (pendingLease && connected) sendRelease(pendingLease);
        })
        .catch(() => {
          if (leaseId && connected) sendRelease(leaseId);
        });
    } else if (leaseId && connected) {
      sendRelease(leaseId);
    }
    return view();
  };

  const start = () => {
    if (disposed || timer || !setIntervalFn) return;
    void refresh();
    timer = setIntervalFn(() => void refresh(), pollMs);
  };

  const stop = () => {
    if (timer && clearIntervalFn) clearIntervalFn(timer);
    timer = null;
  };

  const dispose = () => {
    disposed = true;
    generation += 1;
    actionInFlight = false;
    pendingTake = null;
    pendingRelease = null;
    stop();
  };

  if (autoStart) start();

  return {
    dispose,
    leave,
    refresh,
    release,
    setConnected,
    start,
    stop,
    take,
    view,
  };
}

function actionButton(doc, label, action) {
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "zero-computer-hold__button";
  button.setAttribute("data-action", action);
  button.textContent = label;
  return button;
}

/**
 * Mount the hold controls above the native Desktop panel. This does not
 * replace the panel, register a route, or create a second viewer.
 */
function mountComputerHold(container, host, options = {}) {
  if (!container || typeof document === "undefined") {
    return { dispose() {} };
  }
  const doc = container.ownerDocument ?? document;
  const section = doc.createElement("section");
  section.className = "zero-computer-hold";
  section.setAttribute("data-zero-computer-hold", "");
  section.setAttribute("role", "region");
  section.setAttribute("aria-label", "Zero computer control hold");

  const header = doc.createElement("div");
  header.className = "zero-computer-hold__header";
  const pill = doc.createElement("span");
  pill.className = "zero-computer-hold__pill";
  const title = doc.createElement("strong");
  title.className = "zero-computer-hold__title";
  header.append(pill, title);

  const detail = doc.createElement("p");
  detail.className = "zero-computer-hold__detail";
  detail.setAttribute("aria-live", "polite");

  const scope = doc.createElement("p");
  scope.className = "zero-computer-hold__scope";

  const error = doc.createElement("p");
  error.className = "zero-computer-hold__error";
  error.setAttribute("role", "alert");
  error.setAttribute("hidden", "");

  const actions = doc.createElement("div");
  actions.className = "zero-computer-hold__actions";
  const takeButton = actionButton(doc, "Take control", "take");
  const releaseButton = actionButton(doc, "Return control", "release");
  const refreshButton = actionButton(doc, "Refresh", "refresh");
  actions.append(takeButton, releaseButton, refreshButton);

  section.append(header, detail, scope, error, actions);
  container.append(section);

  const request = (method, params) => host.request(method, params);
  const render = (view) => {
    section.setAttribute("data-state", view.state);
    section.setAttribute("aria-busy", view.busy ? "true" : "false");
    pill.setAttribute("data-tone", view.tone);
    pill.textContent = view.label;
    title.textContent =
      view.state === "held-this-client"
        ? "You hold computer control"
        : view.state === "held-other"
          ? "Computer control is held by another client"
          : view.state === "free"
            ? "Computer control is free"
            : view.state === "unavailable"
              ? "Computer control is unavailable"
              : view.state === "loading"
                ? "Checking computer control"
                : "Computer control state unknown";
    detail.textContent = view.detail;
    scope.textContent = view.scope;
    error.textContent = view.error ?? "";
    if (view.error) error.removeAttribute("hidden");
    else error.setAttribute("hidden", "");
    takeButton.disabled = !view.canTake;
    releaseButton.disabled = !view.canRelease;
    refreshButton.disabled = !view.canRefresh;
  };
  const controller = createComputerHold({
    request,
    pollMs: options.pollMs,
    autoStart: options.autoStart,
    setIntervalFn: options.setIntervalFn,
    clearIntervalFn: options.clearIntervalFn,
    onState: render,
  });
  // Render the honest initial state before the first response arrives.
  render(controller.view());

  takeButton.addEventListener("click", () => void controller.take());
  releaseButton.addEventListener("click", () => void controller.release());
  refreshButton.addEventListener("click", () => void controller.refresh());

  const onVisible = () => {
    if (doc.visibilityState === "hidden") return;
    void controller.refresh();
  };
  const onOnline = () => controller.setConnected(true);
  const onOffline = () => controller.setConnected(false);
  const onPageHide = () => controller.leave();
  if (typeof window !== "undefined") {
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("pagehide", onPageHide);
    doc.addEventListener("visibilitychange", onVisible);
  }

  if (options.autoStart !== false) {
    controller.start();
    if (host?.connection) controller.setConnected(host.connection.connected !== false);
  }

  return {
    controller,
    dispose() {
      controller.dispose();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
        window.removeEventListener("pagehide", onPageHide);
        doc.removeEventListener("visibilitychange", onVisible);
      }
      section.remove();
    },
    element: section,
    leave: () => controller.leave(),
    refresh: () => controller.refresh(),
    release: () => controller.release(),
    take: () => controller.take(),
  };
}

export {
  HOLD_ACTIONS,
  createComputerHold,
  holdView,
  mountComputerHold,
  normalizeSnapshot,
};
