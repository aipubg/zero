/**
 * @fileoverview Zero Gateway Protocol Specification & Frame Engine
 * 
 * Provides canonical JSON-RPC 2.0 message framing, Protocol 4 handshake validation,
 * heartbeat management, session attachment, and multiplexed request/response routing.
 */

export const PROTOCOL_VERSION = 4;
export const SUPPORTED_PROTOCOLS = [4];

export const ROLES = Object.freeze({
  OPERATOR: 'operator',
  AGENT: 'agent',
  CLIENT: 'client',
});

export const DEFAULT_SCOPES = Object.freeze([
  'operator.read',
  'operator.write',
  'operator.approvals',
]);

export const RPC_ERROR_CODES = Object.freeze({
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  TIMEOUT: -32002,
  HOLD_ACTIVE: -32003,
  RATE_LIMITED: -32004,
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
 */
export function validateHandshake(params, expectedToken = '') {
  if (!params || typeof params !== 'object') {
    return {
      ok: false,
      code: RPC_ERROR_CODES.INVALID_PARAMS,
      message: 'Handshake parameters required',
    };
  }

  const { role, scopes, clientId, deviceLabel } = params;

  // Protocol version check - support both 'protocol' and negotiation range ('minProtocol' / 'maxProtocol')
  const effectiveProtocol = params.protocol !== undefined
    ? params.protocol
    : (params.maxProtocol !== undefined ? params.maxProtocol : params.minProtocol);
  const protoNum = Number(effectiveProtocol);
  if (!SUPPORTED_PROTOCOLS.includes(protoNum)) {
    return {
      ok: false,
      code: RPC_ERROR_CODES.INVALID_PARAMS,
      message: `Unsupported protocol version ${effectiveProtocol}. Supported versions: ${SUPPORTED_PROTOCOLS.join(', ')}`,
    };
  }

  // Authentication token check if expectedToken is set
  const token = params.token || params.auth?.token || '';
  if (expectedToken && expectedToken.trim().length > 0) {
    if (!token || String(token).trim() !== expectedToken.trim()) {
      return {
        ok: false,
        code: RPC_ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid or missing gateway authentication token',
      };
    }
  }

  // Role validation
  const effectiveRole = role || ROLES.OPERATOR;
  if (!Object.values(ROLES).includes(effectiveRole)) {
    return {
      ok: false,
      code: RPC_ERROR_CODES.INVALID_PARAMS,
      message: `Invalid role '${effectiveRole}'. Must be one of: ${Object.values(ROLES).join(', ')}`,
    };
  }

  const resolvedClientId = clientId || params.client?.id || 'zero-client';
  const resolvedDeviceLabel = deviceLabel || params.client?.displayName || params.client?.platform || 'Zero Operator Terminal';

  return {
    ok: true,
    session: {
      clientId: String(resolvedClientId),
      deviceLabel: String(resolvedDeviceLabel),
      role: effectiveRole,
      scopes: Array.isArray(scopes) ? scopes : [...DEFAULT_SCOPES],
      negotiatedProtocol: protoNum,
      authenticated: true,
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
