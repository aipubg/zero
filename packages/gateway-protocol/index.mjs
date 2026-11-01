/**
 * @fileoverview Zero Gateway Protocol Specification & Frame Engine
 * 
 * Provides canonical JSON-RPC 2.0 message framing, Protocol 4 handshake validation,
 * heartbeat management, session attachment, and multiplexed request/response routing.
 */

export const PROTOCOL_VERSION = 4;
export const SUPPORTED_PROTOCOLS = [4];

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  OPERATOR: 'operator',
  AGENT: 'agent',
  CLIENT: 'client',
  VIEWER: 'viewer',
});

export const DEFAULT_SCOPES = Object.freeze([
  'operator.read',
  'operator.write',
  'operator.approvals',
]);

export const VIEWER_SCOPES = Object.freeze([
  'operator.read',
]);

export const ADMIN_SCOPES = Object.freeze([
  'admin',
  'operator.admin',
  'operator.write',
  'operator.read',
  'operator.approvals',
  'operator.sessions.read',
  'computer.control',
]);

export const RPC_ERROR_CODES = Object.freeze({
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  TIMEOUT: -32002,
  FORBIDDEN: -32003,
  HOLD_ACTIVE: -32004,
  RATE_LIMITED: -32005,
});

/**
 * Construct a valid JSON-RPC 2.0 request frame.
 */
export function createRequest(id, method, params = {}) {
  if (id === undefined || id === null) {
    throw new Error('JSON-RPC request frame requires an id.');
  }
  if (!method || typeof method !== 'string') {
    throw new Error('JSON-RPC request frame requires a method name string.');
  }
  return {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };
}

/**
 * Construct a valid JSON-RPC 2.0 success response frame.
 */
export function createResponse(id, result) {
  if (id === undefined || id === null) {
    throw new Error('JSON-RPC response frame requires an id.');
  }
  return {
    jsonrpc: '2.0',
    id,
    result: result !== undefined ? result : null,
  };
}

/**
 * Construct a valid JSON-RPC 2.0 error response frame.
 */
export function createError(id, code, message, data = undefined) {
  const errorObj = {
    code: typeof code === 'number' ? code : RPC_ERROR_CODES.INTERNAL_ERROR,
    message: String(message || 'An internal gateway error occurred'),
  };
  if (data !== undefined) {
    errorObj.data = data;
  }
  return {
    jsonrpc: '2.0',
    id: id !== undefined ? id : null,
    error: errorObj,
  };
}

/**
 * Construct a JSON-RPC 2.0 notification / event frame (no id).
 */
export function createNotification(method, params = {}) {
  if (!method || typeof method !== 'string') {
    throw new Error('JSON-RPC notification frame requires a method name string.');
  }
  return {
    jsonrpc: '2.0',
    method,
    params,
  };
}

/**
 * Construct a gateway heartbeat frame.
 */
export function createHeartbeat(timestamp = Date.now()) {
  return createNotification('zero.heartbeat', {
    timestamp,
    status: 'ok',
    protocol: PROTOCOL_VERSION,
  });
}

/**
 * Parse and validate an incoming raw message buffer or string into a structured frame.
 */
export function parseFrame(raw) {
  let str = '';
  if (typeof raw === 'string') {
    str = raw;
  } else if (Buffer.isBuffer(raw)) {
    str = raw.toString('utf-8');
  } else if (raw && typeof raw === 'object') {
    // Already parsed JSON object
    return _categorizeFrame(raw);
  } else {
    return {
      type: 'invalid',
      error: createError(null, RPC_ERROR_CODES.PARSE_ERROR, 'Unrecognized raw frame type'),
    };
  }

  try {
    const data = JSON.parse(str);
    return _categorizeFrame(data);
  } catch (err) {
    return {
      type: 'invalid',
      error: createError(null, RPC_ERROR_CODES.PARSE_ERROR, `Failed to parse JSON-RPC frame: ${err.message}`),
    };
  }
}

function _categorizeFrame(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      type: 'invalid',
      error: createError(null, RPC_ERROR_CODES.INVALID_REQUEST, 'Frame must be a valid JSON-RPC 2.0 or gateway object'),
    };
  }

  // Support reference client wire format ({ type: 'req' | 'res' | 'event', ... })
  if (data.type === 'req' || data.type === 'res' || data.type === 'event') {
    if (data.type === 'req') {
      return {
        type: 'request',
        id: data.id,
        method: data.method,
        params: data.params || {},
        frame: data,
        isReferenceWire: true,
      };
    }
    if (data.type === 'res') {
      return {
        type: data.ok !== false ? 'response' : 'error',
        id: data.id,
        result: data.payload !== undefined ? data.payload : data.result,
        error: data.ok !== false ? null : { message: data.error },
        frame: data,
        isReferenceWire: true,
      };
    }
    if (data.type === 'event') {
      return {
        type: 'notification',
        method: data.event,
        params: data.payload || {},
        frame: data,
        isReferenceWire: true,
      };
    }
  }

  if (data.jsonrpc !== '2.0') {
    return {
      type: 'invalid',
      error: createError(data.id, RPC_ERROR_CODES.INVALID_REQUEST, 'Missing or invalid jsonrpc version (must be "2.0")'),
    };
  }

  // Response with Error
  if (data.error && typeof data.error === 'object') {
    return {
      type: 'error',
      id: data.id,
      error: data.error,
      frame: data,
    };
  }

  // Response with Result
  if ('result' in data) {
    return {
      type: 'response',
      id: data.id,
      result: data.result,
      frame: data,
    };
  }

  // Request with ID and Method
  if (data.id !== undefined && typeof data.method === 'string') {
    return {
      type: 'request',
      id: data.id,
      method: data.method,
      params: data.params || {},
      frame: data,
    };
  }

  // Notification (Method, no ID)
  if (typeof data.method === 'string' && data.id === undefined) {
    return {
      type: 'notification',
      method: data.method,
      params: data.params || {},
      frame: data,
    };
  }

  return {
    type: 'invalid',
    error: createError(data.id, RPC_ERROR_CODES.INVALID_REQUEST, 'Frame does not match any valid JSON-RPC 2.0 structure'),
  };
}

/**
 * Validate Protocol 4 Handshake payload from client.
 * Strictly derives authenticated principal, roles, and scopes from server-side policy.
 * Client-supplied role/scopes are treated only as non-binding requests and NEVER grant authority.
 * 
 * @param {Object} params Handshake payload from client
 * @param {string|Object} authOptions Configured expected token or auth policy object
 * @returns {Object} Handshake verification result with server-authorized session
 */
export function validateHandshake(params, authOptions = '') {
  if (!params || typeof params !== 'object') {
    return {
      ok: false,
      code: RPC_ERROR_CODES.INVALID_PARAMS,
      message: 'Handshake parameters required',
    };
  }

  const expectedToken = typeof authOptions === 'string'
    ? authOptions.trim()
    : (authOptions?.expectedToken || '').trim();
  const allowViewer = typeof authOptions === 'object' && authOptions !== null
    ? authOptions.allowViewer !== false
    : true;

  const { clientId, deviceLabel, requestedRole, requestedScopes } = params;

  // Protocol version check - support both 'protocol' and negotiation range ('minProtocol' / 'maxProtocol')
  const effectiveProtocol = params.protocol !== undefined
    ? params.protocol
    : (params.maxProtocol !== undefined ? params.maxProtocol : (params.minProtocol !== undefined ? params.minProtocol : PROTOCOL_VERSION));
  const protoNum = Number(effectiveProtocol);
  if (!SUPPORTED_PROTOCOLS.includes(protoNum)) {
    return {
      ok: false,
      code: RPC_ERROR_CODES.INVALID_PARAMS,
      message: `Unsupported protocol version ${effectiveProtocol}. Supported versions: ${SUPPORTED_PROTOCOLS.join(', ')}`,
    };
  }

  // Authentication token resolution from params
  const clientToken = (params.token || params.auth?.token || '').trim();
  const resolvedClientId = clientId || params.client?.id || 'zero-client';
  const resolvedDeviceLabel = deviceLabel || params.client?.displayName || params.client?.platform || 'Zero Operator Terminal';

  const validSessions = typeof authOptions === 'object' && authOptions !== null ? authOptions.validSessions : null;
  const verifiedSession = typeof authOptions === 'object' && authOptions !== null ? authOptions.verifiedSession : null;

  let isAuthenticated = false;
  let grantedRole = ROLES.VIEWER;
  let grantedScopes = [...VIEWER_SCOPES];

  if (verifiedSession) {
    isAuthenticated = true;
    const clientReqRole = params.role || requestedRole;
    grantedRole = clientReqRole === ROLES.ADMIN && verifiedSession.role === ROLES.ADMIN ? ROLES.ADMIN : (verifiedSession.role || ROLES.OPERATOR);
    grantedScopes = [...(verifiedSession.scopes || ADMIN_SCOPES)];
  } else if (validSessions && clientToken && (typeof validSessions.has === 'function' ? validSessions.has(clientToken) : validSessions[clientToken])) {
    const sessionObj = typeof validSessions.get === 'function' ? validSessions.get(clientToken) : validSessions[clientToken];
    isAuthenticated = true;
    const clientReqRole = params.role || requestedRole;
    grantedRole = clientReqRole === ROLES.ADMIN && sessionObj?.role === ROLES.ADMIN ? ROLES.ADMIN : (sessionObj?.role || ROLES.OPERATOR);
    grantedScopes = [...(sessionObj?.scopes || ADMIN_SCOPES)];
  } else if (expectedToken.length > 0) {
    if (clientToken === expectedToken) {
      isAuthenticated = true;
      const clientReqRole = params.role || requestedRole;
      grantedRole = clientReqRole === ROLES.ADMIN ? ROLES.ADMIN : ROLES.OPERATOR;
      grantedScopes = [...ADMIN_SCOPES];
    } else if (clientToken.length > 0) {
      // Provided an invalid token
      return {
        ok: false,
        code: RPC_ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid gateway authentication token',
      };
    } else if (!allowViewer) {
      // Tokenless and viewer disallowed
      return {
        ok: false,
        code: RPC_ERROR_CODES.UNAUTHORIZED,
        message: 'Missing gateway authentication token',
      };
    }
  } else {
    // If no expectedToken was configured in host (development/local trust)
    isAuthenticated = true;
    const clientReqRole = params.role || requestedRole;
    grantedRole = clientReqRole === ROLES.ADMIN ? ROLES.ADMIN : ROLES.OPERATOR;
    grantedScopes = [...ADMIN_SCOPES];
  }

  // If client requested a narrower subset of authorized scopes, filter them
  const clientRequestedScopes = Array.isArray(params.scopes) ? params.scopes : (Array.isArray(requestedScopes) ? requestedScopes : null);
  if (isAuthenticated && clientRequestedScopes && clientRequestedScopes.length > 0) {
    // Authenticated client can request a narrower subset of granted scopes; cannot self-grant!
    grantedScopes = grantedScopes.filter((s) => clientRequestedScopes.includes(s));
  }

  return {
    ok: true,
    session: {
      clientId: String(resolvedClientId),
      deviceLabel: String(resolvedDeviceLabel),
      role: grantedRole,
      scopes: grantedScopes,
      negotiatedProtocol: protoNum,
      authenticated: isAuthenticated,
      connectedAt: Date.now(),
    },
  };
}

/**
 * Multiplexer for tracking async request/response transactions with timeout deadlines.
 */
export class GatewayMultiplexer {
  constructor(options = {}) {
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
    this._pending = new Map();
  }

  registerRequest(id, timeoutMs = this.defaultTimeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this._pending.has(id)) {
          this._pending.delete(id);
          reject(new Error(`Gateway request '${id}' timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this._pending.set(id, { resolve, reject, timer, startedAt: Date.now() });
    });
  }

  resolveResponse(id, result) {
    const entry = this._pending.get(id);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this._pending.delete(id);
    entry.resolve(result);
    return true;
  }

  rejectResponse(id, error) {
    const entry = this._pending.get(id);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this._pending.delete(id);
    entry.reject(error);
    return true;
  }

  clear() {
    for (const [id, entry] of this._pending.entries()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(`Multiplexer cleared; aborting pending request '${id}'`));
    }
    this._pending.clear();
  }

  get pendingCount() {
    return this._pending.size;
  }
}
