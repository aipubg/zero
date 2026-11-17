/**
 * Thin Gateway client used by the native Zero pages.
 *
 * The host injects the authenticated Control UI connection; this module never
 * opens a socket, reads a credential, or owns a transcript. It only centralizes
 * the guard rails around host.request so pages fail explicitly instead of
 * silently rendering stale state.
 */

function gatewayRequest(host, method, params) {
  if (!host || typeof host.request !== "function") {
    return Promise.reject(new Error("Gateway connection is unavailable."));
  }
  return host.request(method, params);
}

function connectionState(host) {
  const connection = host?.connection ?? {};
  return {
    connected: connection.connected === true,
    canRead: connection.connected === true && connection.canRead === true,
    canWrite: connection.connected === true && connection.canWrite === true,
  };
}

export { connectionState, gatewayRequest };
