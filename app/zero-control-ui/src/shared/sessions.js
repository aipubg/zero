import { TEAM_ROLES } from "../constants.js";

/**
 * Canonical Gateway session/agent projections. The Gateway owns the session
 * catalog and history; these helpers only label and sort the visible rows.
 */

function agentName(agents, agentId) {
  const agent = agents.find((row) => row?.id === agentId);
  return agent?.name || agent?.identity?.name || agentId || "default agent";
}

function sessionTitle(session) {
  return session.displayName || session.derivedTitle || session.label || session.key;
}

function sessionTime(session) {
  const stamp = session.lastActivityAt ?? session.updatedAt ?? session.createdAt;
  return typeof stamp === "number" ? stamp : null;
}


function isDelegated(session) {
  return (
    typeof session.parentSessionKey === "string" ||
    (typeof session.spawnDepth === "number" && session.spawnDepth > 0)
  );
}

function surfaceHref(host, path) {
  return `${host.basePath || ""}${path}`;
}

function agentRole(agent) {
  const key = `${agent?.id ?? ""} ${agent?.name ?? ""}`.toLowerCase();
  if (/\bzero\b|\blead\b|\bassistant\b/.test(key)) return "Lead";
  if (/research/.test(key)) return "Researcher";
  if (/operator|computer/.test(key)) return "Operator";
  return agent?.name || agent?.id || "Specialist";
}

function roleRank(role) {
  const index = TEAM_ROLES.indexOf(role);
  return index === -1 ? TEAM_ROLES.length : index;
}

function latestSessionFor(sessions, agentId) {
  if (!agentId) return null;
  const matching = (Array.isArray(sessions) ? sessions : []).filter(
    (session) => session?.agentId === agentId,
  );
  const topLevel = matching.filter((session) => !isDelegated(session));
  return (topLevel.length > 0 ? topLevel : matching)
    .slice()
    .sort((left, right) => (sessionTime(right) ?? 0) - (sessionTime(left) ?? 0))[0] ?? null;
}

function sessionActivityCounts(sessions, agentId) {
  const matching = (Array.isArray(sessions) ? sessions : []).filter(
    (session) => session?.agentId === agentId,
  );
  return {
    active: matching.filter((session) => session.hasActiveRun === true).length,
    delegated: matching.filter(isDelegated).length,
    total: matching.length,
  };
}


export { agentName, sessionTitle, sessionTime, isDelegated, surfaceHref, agentRole, roleRank, latestSessionFor, sessionActivityCounts };
