/**
 * Browser-safe connector projection.
 *
 * Input is the configured connector list plus the Gateway's cached
 * `tools.effective` result. Output contains only configured state and
 * sanitized MCP tool names. It never carries URLs, headers, launch commands,
 * descriptions, diagnostics text, or credentials, and it never claims live
 * reachability.
 */

export const CONNECTOR_ADAPTERS = Object.freeze([
  { id: "gmail", label: "Gmail", serverNames: ["gmail", "google-mail"] },
  { id: "slack", label: "Slack", serverNames: ["slack"] },
  { id: "github", label: "GitHub", serverNames: ["github"] },
  { id: "notion", label: "Notion", serverNames: ["notion"] },
  { id: "linear", label: "Linear", serverNames: ["linear"] },
]);

const MCP_TOOL_NAME = /^[A-Za-z0-9_.:-]{1,80}$/;
const MAX_MCP_TOOLS = 32;

function safeMcpToolNames(tools) {
  const names = [];
  for (const value of Array.isArray(tools) ? tools : []) {
    const name = typeof value === "string" ? value.trim() : "";
    if (!name || name.length > 80 || !MCP_TOOL_NAME.test(name)) continue;
    if (!names.includes(name)) names.push(name);
    if (names.length >= MAX_MCP_TOOLS) break;
  }
  return names;
}

function catalogNoticeStatus(notices, serverNames) {
  for (const notice of Array.isArray(notices) ? notices : []) {
    const id = typeof notice?.id === "string" ? notice.id : "";
    const servers = Array.isArray(notice?.servers)
      ? notice.servers.filter((name) => typeof name === "string").map((name) => name.toLowerCase())
      : [];
    if (!servers.some((name) => serverNames.includes(name))) continue;
    if (id === "mcp-not-yet-connected") return "not-connected";
    if (id === "mcp-not-yet-listed") return "not-listed";
    if (id === "mcp-stale-catalog") return "stale";
  }
  return null;
}

function readEffectiveMcpTools(catalog) {
  const byServer = new Map();
  for (const group of Array.isArray(catalog?.groups) ? catalog.groups : []) {
    for (const entry of Array.isArray(group?.tools) ? group.tools : []) {
      if (entry?.source !== "mcp" || typeof entry?.mcpServer !== "string") continue;
      const server = entry.mcpServer.trim().toLowerCase();
      const tool = typeof entry?.mcpToolName === "string" ? entry.mcpToolName : entry?.id;
      if (!server || typeof tool !== "string") continue;
      const values = byServer.get(server) ?? [];
      values.push(tool);
      byServer.set(server, values);
    }
  }
  return byServer;
}

function readToolFiltered(server) {
  const filter = server?.toolFilter;
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) return false;
  if (Object.keys(filter).some((key) => key !== "include" && key !== "exclude")) return false;
  const validRule = (value) =>
    value === undefined ||
    (Array.isArray(value) && value.every((entry) => typeof entry === "string"));
  if (!validRule(filter.include) || !validRule(filter.exclude)) return false;
  return [filter.include, filter.exclude].some(
    (value) =>
      Array.isArray(value) &&
      value.some((entry) => typeof entry === "string" && entry.trim().length > 0),
  );
}

function readMcpServerState(server) {
  const enabled = server?.enabled !== false;
  const command = typeof server?.command === "string" ? server.command.trim() : "";
  const url = typeof server?.url === "string" ? server.url.trim() : "";
  const rawTransport = server?.transport;
  const declared =
    typeof rawTransport === "string" ? rawTransport.trim().toLowerCase() : "";
  const invalidTransportType =
    rawTransport !== undefined &&
    rawTransport !== null &&
    typeof rawTransport !== "string";
  let transport;
  if (command) {
    // The installed runtime treats a command-bearing entry as stdio even when
    // HTTP-ish fields are also present.
    transport = "stdio";
  } else if (!url) {
    transport = "invalid";
  } else if (invalidTransportType) {
    transport = "invalid";
  } else if (!declared) {
    // Installed mcp-transport-config falls back to SSE for a remote URL.
    transport = "sse";
  } else if (declared === "sse" || declared === "streamable-http") {
    transport = declared;
  } else {
    transport = "invalid";
  }
  return {
    enabled,
    transport,
    auth: server?.auth === "oauth" ? "oauth" : "none",
    toolFiltered: readToolFiltered(server),
    status: !enabled ? "disabled" : transport === "invalid" ? "invalid" : "ready",
  };
}

export function createConnectorStatus(config = {}, catalog = null) {
  const servers = config?.mcp?.servers ?? {};
  const byName = new Map(
    Object.entries(servers).map(([name, server]) => [
      name.trim().toLowerCase(),
      { name, server },
    ]),
  );
  const toolsByServer = catalog ? readEffectiveMcpTools(catalog) : null;
  return CONNECTOR_ADAPTERS.map((connector) => {
    const matching = connector.serverNames
      .map((name) => byName.get(name))
      .filter((entry) => entry !== undefined);
    const configured = matching.length > 0;
    const states = matching.map((entry) => ({ entry, state: readMcpServerState(entry.server) }));
    const ready = states.find((candidate) => candidate.state.status === "ready");
    const primary = ready ?? states[0];
    const state = primary?.state ?? null;
    const status = !configured
      ? "not-configured"
      : ready
        ? "ready"
        : states.some((candidate) => candidate.state.status === "disabled")
          ? "disabled"
          : "invalid";
    let catalogStatus = "not-configured";
    let tools = [];
    if (configured) {
      if (!catalog || status !== "ready") {
        catalogStatus = "not-requested";
      } else {
        const serverNames = ready ? [ready.entry.name.toLowerCase()] : [];
        const names = serverNames.flatMap((name) => toolsByServer.get(name) ?? []);
        tools = safeMcpToolNames(names);
        catalogStatus =
          tools.length > 0
            ? "listed"
            : (catalogNoticeStatus(catalog.notices, serverNames) ?? "not-listed");
      }
    }
    return {
      id: connector.id,
      label: connector.label,
      configured,
      server: primary?.entry.name ?? null,
      enabled: state?.enabled ?? false,
      transport: state?.transport ?? null,
      auth: state?.auth ?? "none",
      toolFiltered: state?.toolFiltered ?? false,
      status,
      catalogStatus,
      tools,
      capabilityCount: tools.length,
      reachable: null,
      settingsPath: "/settings/mcp",
    };
  });
}

/**
 * Enrich already-configured connector rows with a cached native MCP catalog.
 * Rows that are not configured, disabled, invalid, or have no cached tools
 * remain explicit.
 */
export function applyConnectorCatalog(connectors, catalog) {
  const rows = Array.isArray(connectors) ? connectors : [];
  if (!catalog) return rows.map((row) => ({ ...row, reachable: null }));
  const serverNamesByConnector = new Map(
    CONNECTOR_ADAPTERS.map((connector) => [connector.id, connector.serverNames]),
  );
  const toolsByServer = readEffectiveMcpTools(catalog);
  return rows.map((row) => {
    const id = typeof row?.id === "string" ? row.id : "";
    const configured = row?.configured === true;
    const ready = row?.status === undefined || row?.status === "ready";
    const matching = serverNamesByConnector.get(id) ?? [];
    if (!configured || !ready) {
      return {
        ...row,
        catalogStatus: configured ? "not-requested" : "not-configured",
        tools: [],
        capabilityCount: 0,
        reachable: null,
      };
    }
    const names = (typeof row?.server === "string" && row.server
      ? [row.server.trim().toLowerCase()]
      : matching
    ).flatMap((name) => toolsByServer.get(name) ?? []);
    const tools = safeMcpToolNames(names);
    return {
      ...row,
      catalogStatus:
        tools.length > 0
          ? "listed"
          : (catalogNoticeStatus(catalog?.notices, matching) ?? "not-listed"),
      tools,
      capabilityCount: tools.length,
      reachable: null,
    };
  });
}
