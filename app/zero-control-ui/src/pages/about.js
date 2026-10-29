import { element } from "../shared/dom.js";
import { applyConnectorCatalog } from "../shared/connectors.js";
import { sanitizeObservationError } from "../shared/observation-errors.js";

/**
 * Native Zero About page.
 *
 * This replaces the upstream About destination in the Zero product surface. It
 * is intentionally self-contained: no Gateway request, no external link, no
 * telemetry, and no upstream marketing or release-channel controls. Dependency
 * and license notices stay in the repository notice files referenced below.
 */

const PRODUCT_NAME = "Zero";
const PRODUCT_DESCRIPTION = "Private assistant for local Gateway-backed work";

function fact(label, value) {
  const row = element("div", "zero-about__fact");
  row.append(element("dt", "zero-about__fact-label", label));
  row.append(element("dd", "zero-about__fact-value", value));
  return row;
}

function section(title, ...children) {
  const block = element("section", "zero-about__section");
  block.append(element("h2", "zero-about__section-title", title));
  for (const child of children) block.append(child);
  return block;
}

function mountAboutPage(container, context = {}) {
  const root = element("section", "zero-about");
  const host = context?.host;
  let disposed = false;

  const header = element("header", "zero-about__header");
  const brand = element("div", "zero-about__brand");
  brand.append(element("span", "zero-about__mark", "0"));
  const brandCopy = element("div", "zero-about__brand-copy");
  brandCopy.append(element("span", "zero-about__brand-name", PRODUCT_NAME));
  brandCopy.append(element("span", "zero-about__brand-tag", "Private assistant"));
  brand.append(brandCopy);
  header.append(brand);
  header.append(element("h1", "zero-about__heading", `About ${PRODUCT_NAME}`));
  header.append(element("p", "zero-about__lede", PRODUCT_DESCRIPTION));
  root.append(header);

  const facts = element("dl", "zero-about__facts");
  facts.append(fact("Interface", "Native Control UI"));
  facts.append(fact("Runtime", "Gateway runtime, local and loopback-only"));
  facts.append(fact("History", "Canonical Gateway sessions"));
  facts.append(fact("Agents", "Zero only"));
  root.append(facts);

  root.append(
    section(
      "One assistant",
      element(
        "p",
        "zero-about__text",
        "Zero is the only configured agent and the only conversation entry. No specialist workers or separate chat products exist; all work stays in the canonical Zero conversation.",
      ),
    ),
  );

  root.append(
    section(
      "Privacy",
      element(
        "p",
        "zero-about__text",
        "Zero runs against your local Gateway. Credentials stay server-side in the Gateway secret store, sessions and history stay in Gateway state, and the Zero product surface adds no analytics, telemetry, remote feeds, or upstream update checks.",
      ),
    ),
  );

  root.append(
    section(
      "Updates",
      element(
        "p",
        "zero-about__text",
        "The native update framework remains available as a local extension point for a future Zero update server. This build does not expose upstream release channels or promotional update controls.",
      ),
    ),
  );

  const integrations = element("div", "zero-about__integrations");
  integrations.append(
    element(
      "p",
      "zero-about__text",
      "Local CLI adapters and connected apps reuse the Gateway's existing approval and MCP surfaces. Install and authenticate a CLI in a terminal; Zero runs commands only through the host's approved exec tool. Connected-app credentials stay in server-side MCP configuration.",
    ),
  );
  const integrationStatus = element(
    "p",
    "zero-about__hint",
    host?.request
      ? "Checking local adapters…"
      : "Gateway integration status requires the native Control UI host.",
  );
  integrations.append(integrationStatus);
  root.append(section("Local integrations", integrations));

  const timeoutCall = (method, params, timeoutMs) =>
    new Promise((resolvePromise, rejectPromise) => {
      let timer;
      const fail = (error) => {
        clearTimeout(timer);
        rejectPromise(error);
      };
      timer = setTimeout(() => fail(new Error("timeout")), timeoutMs);
      Promise.resolve(host.request(method, params)).then(
        (value) => {
          clearTimeout(timer);
          resolvePromise(value);
        },
        fail,
      );
    });

  const renderRows = (rows, formatter) => {
    const list = element("ul", "zero-about__integration-list");
    for (const row of rows) {
      list.append(element("li", "zero-about__integration-row", formatter(row)));
    }
    return list;
  };

  const connectorState = (row) => {
    if (!row.configured) return "setup required in native MCP settings";
    if (row.status === "disabled") return "configured but disabled in native MCP settings";
    if (row.status === "invalid") return "configured but its native MCP transport is invalid";
    const meta = [];
    if (typeof row.transport === "string" && row.transport) meta.push(row.transport);
    if (row.auth === "oauth") meta.push("OAuth");
    if (row.toolFiltered === true) meta.push("tool filter");
    const detail = meta.length > 0 ? ` [${meta.join(", ")}]` : "";
    const status = String(row.catalogStatus || "");
    if (status === "listed") {
      const tools = Array.isArray(row.tools) ? row.tools.slice(0, 8) : [];
      const count = Number.isInteger(row.capabilityCount) ? row.capabilityCount : tools.length;
      const suffix = tools.length > 0 ? `: ${tools.join(", ")}` : "";
      return `configured${detail}; ${count} cached MCP capabilit${count === 1 ? "y" : "ies"}${suffix}`;
    }
    if (status === "not-connected") {
      return `configured${detail}; native MCP has not connected this session yet`;
    }
    if (status === "not-listed") {
      return `configured${detail}; native MCP has not listed tools yet`;
    }
    if (status === "stale") {
      return `configured${detail}; the cached native MCP catalog is stale`;
    }
    return `configured${detail}; capabilities not checked on this Gateway yet`;
  };

  const loadIntegrationStatus = async () => {
    if (!host?.request) return;
    const timeoutMs = Number(context?.statusTimeoutMs) > 0
      ? Number(context.statusTimeoutMs)
      : 5000;
    const [cli, connectors] = await Promise.allSettled([
      timeoutCall("zero.integrations.cli.status", {}, timeoutMs),
      timeoutCall("zero.integrations.connectors.status", {}, timeoutMs),
    ]);
    if (disposed) return;
    integrations.replaceChildren();

    if (cli.status === "fulfilled" && Array.isArray(cli.value?.adapters)) {
      integrations.append(
        renderRows(cli.value.adapters, (row) => {
          const state = row.available
            ? `available${row.version ? ` (${String(row.version).slice(0, 80)})` : row.error ? ` (version ${row.error})` : ""}`
            : "not found on PATH";
          const native =
            row.nativeDispatch === true
              ? "; native CLI backend ready"
              : "";
          return `${row.label || row.id}: ${state}${native}`;
        }),
      );
    } else {
      integrations.append(
        element("p", "zero-about__hint", "CLI adapter status is unavailable."),
      );
    }

    if (connectors.status === "fulfilled" && Array.isArray(connectors.value?.connectors)) {
      let rows = connectors.value.connectors;
      const sessionKey =
        typeof host?.sessions?.selectedKey === "string" ? host.sessions.selectedKey : "";
      if (sessionKey.startsWith("agent:zero:") && rows.some((row) => row?.configured === true)) {
        try {
          const catalog = await timeoutCall("tools.effective", { sessionKey }, timeoutMs);
          rows = applyConnectorCatalog(rows, catalog);
        } catch {
          rows = applyConnectorCatalog(rows, null);
        }
      }
      if (disposed) return;
      integrations.append(
        renderRows(rows, (row) =>
          `${row.label || row.id}: ${connectorState(row)}`,
        ),
      );
      integrations.append(
        element(
          "p",
          "zero-about__hint",
          "Configured status and cached MCP capabilities do not prove live reachability. This card does not run a connector; live checks require the native MCP probe or app action under host approval.",
        ),
      );
      const setupLink = element(
        "a",
        "zero-about__integration-link",
        "Configure connectors in native MCP settings",
      );
      setupLink.setAttribute("href", `${host.basePath || ""}/settings/mcp`);
      integrations.append(setupLink);
    } else {
      integrations.append(
        element("p", "zero-about__hint", "Connected-app status is unavailable."),
      );
    }

    if (cli.status === "rejected" && connectors.status === "rejected") {
      integrations.append(
        element(
          "p",
          "zero-about__hint",
          "The Zero integration methods are not active on this Gateway yet; a Gateway restart is required to load them.",
        ),
      );
    }
  };

  void loadIntegrationStatus();

  const formatBytes = (value) => {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const observation = element("div", "zero-about__observation");
  const observationStatus = element(
    "p",
    "zero-about__hint",
    host?.request ? "Checking screen-observation state…" : "Screen observation requires the native Control UI host.",
  );
  const observationActions = element("div", "zero-about__observation-actions");
  observation.append(observationStatus, observationActions);
  const observationControlTimeoutMs =
    Number(context?.observationControlTimeoutMs) > 0
      ? Number(context.observationControlTimeoutMs)
      : 5000;
  let observationControlPending = false;
  let observationControlTimedOut = false;
  let observationControlAction = null;
  let lastObservationStatus = null;
  let observationEpoch = 0;
  let observationStatusRequestId = 0;
  root.append(
    section(
      "Screen observation",
      element(
        "p",
        "zero-about__text",
        "Screen observation is off until you enable it. Capture, UI Automation/OCR, and summary memory stay local; Private Mode stops capture and clears app-owned volatile buffers. Raw frames are not added to the chat transcript.",
      ),
      observation,
    ),
  );

  const observationPendingText = (status) => {
    const captureRunning =
      status?.captureRunning === true || status?.running === true || status?.state === "capturing";
    if (observationControlTimedOut) {
      if (captureRunning) {
        return "Capture is running. The observation control request is still unresolved or its result is unknown; it was not canceled or repeated. Controls stay disabled until it settles.";
      }
      return "The observation control request is still unresolved or its result is unknown; it was not canceled or repeated. Controls stay disabled until it settles.";
    }
    const label =
      observationControlAction === "start"
        ? "Start"
        : observationControlAction === "stop"
          ? "Stop"
          : "Private Mode";
    return `${label} request is pending; observation controls are disabled until it settles.`;
  };

  const disableObservationControls = () => {
    for (const child of observationActions.children) {
      if (child?.tagName === "button") child.disabled = true;
    }
  };

  const renderObservation = (status) => {
    if (status && typeof status === "object") lastObservationStatus = status;
    observationActions.replaceChildren();
    if (!status || typeof status !== "object") {
      observationStatus.textContent = observationControlPending
        ? observationPendingText(lastObservationStatus)
        : "Screen-observation status is unavailable.";
      return;
    }
    const ring = status.ring && typeof status.ring === "object" ? status.ring : {};
    const queue = status.queue && typeof status.queue === "object" ? status.queue : {};
    const counters = status.counters && typeof status.counters === "object" ? status.counters : {};
    const captureRunning =
      status.captureRunning === true || status.running === true || status.state === "capturing";
    let text;
    if (status.privateMode) {
      text =
        "Private Mode is on. Capture is stopped, queued work is cancelled, and app-owned volatile buffers are cleared.";
      if (status.sourceAvailable === false) {
        text += " The capture source is also unavailable.";
      }
    } else if (captureRunning) {
      text = `Capturing locally: ${Number(ring.frames) || 0} compressed frames, ${formatBytes(ring.bytes)}, ${Number(queue.pending) || 0} queued, ${Number(counters.processed) || 0} summaries.`;
    } else if (status.sourceAvailable === false || status.state === "unavailable") {
      text =
        "Private Mode is off. Capture source unavailable: the installed Windows CUA driver was not found. No capture was started.";
      if (status.preferenceEnabled === true) {
        text += " The owner preference remains enabled; observation will retry on the next Gateway startup.";
      }
    } else if (status.startFailed === true) {
      const failureText = sanitizeObservationError(
        status.startFailure?.message || "Capture did not start.",
        160,
      );
      text = `Capture could not start: ${failureText} No screen frames are being captured.`;
    } else if (status.state === "error") {
      const errorText = sanitizeObservationError(status.lastError || "unknown local failure", 160);
      text = `Capture stopped after an error: ${errorText}`;
    } else {
      text = "Observation is off. No screen frames are being captured.";
    }
    observationStatus.textContent = observationControlPending
      ? observationPendingText(status)
      : text;
    const enabledForControl = status.preferenceEnabled === true || status.enabled === true;
    if (enabledForControl) {
      const label = captureRunning ? "Stop observation" : "Disable observation";
      const stopButton = element("button", "zero-about__action", label);
      stopButton.addEventListener("click", () => {
        void controlObservation("stop");
      });
      observationActions.append(stopButton);
    } else {
      const startButton = element("button", "zero-about__action", "Enable observation");
      startButton.addEventListener("click", () => {
        void controlObservation("start");
      });
      observationActions.append(startButton);
    }
    const privateButton = element(
      "button",
      "zero-about__action",
      status.privateMode ? "Exit Private Mode" : "Private Mode",
    );
    privateButton.addEventListener("click", () => {
      void controlObservation(status.privateMode ? "private-off" : "private-on");
    });
    observationActions.append(privateButton);
    if (observationControlPending) disableObservationControls();
  };

  const controlObservation = (action) => {
    if (!host?.request || observationControlPending) return;
    observationControlPending = true;
    observationControlTimedOut = false;
    observationControlAction = action;
    observationEpoch += 1;
    observationStatus.textContent = observationPendingText(lastObservationStatus);
    disableObservationControls();

    let settled = false;
    let timer = null;
    const request = Promise.resolve().then(() =>
      host.request("zero.observation.control", { action }),
    );
    timer = setTimeout(() => {
      if (settled || disposed) return;
      observationControlTimedOut = true;
      if (lastObservationStatus) {
        renderObservation(lastObservationStatus);
      } else {
        observationStatus.textContent = observationPendingText(null);
        disableObservationControls();
      }
      void loadObservationStatus();
    }, observationControlTimeoutMs);
    request.then(
      (status) => {
        settled = true;
        clearTimeout(timer);
        observationControlPending = false;
        observationControlTimedOut = false;
        observationControlAction = null;
        observationEpoch += 1;
        if (!disposed) renderObservation(status);
      },
      () => {
        settled = true;
        clearTimeout(timer);
        const timedOut = observationControlTimedOut;
        observationControlPending = false;
        observationControlTimedOut = false;
        observationControlAction = null;
        observationEpoch += 1;
        if (!disposed) {
          observationStatus.textContent = timedOut
            ? "The observation control request failed after the UI timeout; no retry was sent. Refreshing status…"
            : "The observation control request failed; no retry was sent. Refreshing status…";
          void loadObservationStatus();
        }
      },
    );
  };

  const loadObservationStatus = async () => {
    if (!host?.request) return;
    const requestId = (observationStatusRequestId += 1);
    const epoch = observationEpoch;
    try {
      const status = await timeoutCall("zero.observation.status", {}, 5000);
      if (
        !disposed &&
        requestId === observationStatusRequestId &&
        epoch === observationEpoch
      ) {
        renderObservation(status);
      }
    } catch {
      if (
        !disposed &&
        requestId === observationStatusRequestId &&
        epoch === observationEpoch
      ) {
        if (observationControlPending) {
          observationStatus.textContent = observationPendingText(lastObservationStatus);
          disableObservationControls();
        } else {
          observationActions.replaceChildren();
          observationStatus.textContent =
            "Screen observation is not active on this Gateway yet; no capture was started.";
        }
      }
    }
  };

  void loadObservationStatus();

  const legal = section(
    "Legal and dependency notices",
    element(
      "p",
      "zero-about__text",
      "Zero builds on the OpenClaw runtime and other open-source dependencies. Required notices are kept with the source: app/NOTICE, app/zero-control-ui/THIRD_PARTY_NOTICES.md, and the installed Gateway package's own license files.",
    ),
  );
  legal.append(
    element(
      "p",
      "zero-about__hint",
      "Upstream runtime identity, protocol names, and dependency identifiers are retained where compatibility or attribution requires them.",
    ),
  );
  root.append(legal);

  root.append(
    element(
      "p",
      "zero-about__footnote",
      "Zero is a private product surface over the local Gateway. No OpenClaw marketing, community, repository, or release links are shown here.",
    ),
  );

  container.replaceChildren(root);
  return {
    update() {},
    dispose() {
      disposed = true;
      container.replaceChildren();
    },
  };
}

export { PRODUCT_DESCRIPTION, PRODUCT_NAME, mountAboutPage };
