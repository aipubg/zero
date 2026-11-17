/**
 * Computer-control presentation helpers.
 *
 * These are pure projections over the canonical hold snapshot owned by the
 * Zero policy plugin. They never call the Gateway and never open a second
 * desktop transport; the built-in Desktop panel still owns view and input.
 */

function isComputerHeldByZero(snapshot) {
  return (
    snapshot?.held === true &&
    snapshot?.owned === true &&
    typeof snapshot?.controlLeaseId === "string"
  );
}

function isHoldConflict(error) {
  return /already-held|lease-invalid/i.test(String(error?.message ?? error ?? ""));
}

function computerScopeLabel(snapshot) {
  if (!snapshot) return "Global hold · all sessions";
  if (snapshot.scope === "session") return "Session hold";
  return "Global hold · all sessions";
}

export { computerScopeLabel, isComputerHeldByZero, isHoldConflict };
