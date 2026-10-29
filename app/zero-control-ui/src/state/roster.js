/**
 * Session-roster state projection.
 *
 * The Gateway session subscription is the only state source; this reducer keeps
 * the page's view model explicit and testable instead of spreading snapshot
 * parsing through the render path.
 */

const EMPTY_ROSTER = Object.freeze({ loading: true, error: null, sessions: [] });

function applySessionSnapshot(_previous, snapshot) {
  const sessions = Array.isArray(snapshot?.result?.sessions)
    ? snapshot.result.sessions
    : [];
  return {
    loading: snapshot?.loading === true,
    error: typeof snapshot?.error === "string" && snapshot.error ? snapshot.error : null,
    sessions,
  };
}

export { EMPTY_ROSTER, applySessionSnapshot };
