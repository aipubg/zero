import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROTOCOL_VERSION,
  SUPPORTED_PROTOCOLS,
  ROLES,
  RPC_ERROR_CODES,
  createRequest,
  createResponse,
  createError,
  createNotification,
  createHeartbeat,
  parseFrame,
  validateHandshake,
  GatewayMultiplexer,
} from '../index.mjs';

test('Zero Gateway Protocol Specification', async (t) => {
  await t.test('creates standard JSON-RPC 2.0 requests, responses, and notifications', () => {
    const req = createRequest(101, 'chat.history', { sessionKey: 'session-123' });
    assert.equal(req.jsonrpc, '2.0');
    assert.equal(req.id, 101);
    assert.equal(req.method, 'chat.history');
    assert.equal(req.params.sessionKey, 'session-123');

    const res = createResponse(101, { messages: [] });
    assert.equal(res.jsonrpc, '2.0');
    assert.equal(res.id, 101);
    assert.deepEqual(res.result, { messages: [] });

    const err = createError(101, RPC_ERROR_CODES.HOLD_ACTIVE, 'Human hold active', { holdReason: 'Manual pause' });
    assert.equal(err.jsonrpc, '2.0');
    assert.equal(err.id, 101);
    assert.equal(err.error.code, -32003);
    assert.equal(err.error.data.holdReason, 'Manual pause');

    const notif = createNotification('zero.stream.delta', { chunk: 'Hello' });
    assert.equal(notif.jsonrpc, '2.0');
    assert.equal(notif.id, undefined);
    assert.equal(notif.method, 'zero.stream.delta');
  });

  await t.test('parses and categorizes incoming raw frame strings and buffers', () => {
    const rawReq = JSON.stringify({ jsonrpc: '2.0', id: 'req_1', method: 'health', params: {} });
    const parsedReq = parseFrame(rawReq);
    assert.equal(parsedReq.type, 'request');
    assert.equal(parsedReq.id, 'req_1');
    assert.equal(parsedReq.method, 'health');

    const rawHeartbeat = JSON.stringify(createHeartbeat());
    const parsedHeartbeat = parseFrame(Buffer.from(rawHeartbeat));
    assert.equal(parsedHeartbeat.type, 'notification');
    assert.equal(parsedHeartbeat.method, 'zero.heartbeat');
    assert.equal(parsedHeartbeat.params.protocol, PROTOCOL_VERSION);

    const invalidJson = parseFrame('{ invalid-json');
    assert.equal(invalidJson.type, 'invalid');
    assert.equal(invalidJson.error.error.code, RPC_ERROR_CODES.PARSE_ERROR);

    // Reference protocol wire frames
    const refReq = parseFrame(JSON.stringify({ type: 'req', id: 'cli_1', method: 'agents.list', params: {} }));
    assert.equal(refReq.type, 'request');
    assert.equal(refReq.id, 'cli_1');
    assert.equal(refReq.method, 'agents.list');
    assert.equal(refReq.isReferenceWire, true);

    const refEvent = parseFrame(JSON.stringify({ type: 'event', event: 'chat.delta', payload: { delta: 'hi' } }));
    assert.equal(refEvent.type, 'notification');
    assert.equal(refEvent.method, 'chat.delta');
    assert.equal(refEvent.isReferenceWire, true);
  });

  await t.test('validates Protocol 4 Handshake with role and token security', () => {
    const valid = validateHandshake(
      { protocol: 4, role: 'operator', clientId: 'cli-test', token: 'secret-tok' },
      'secret-tok'
    );
    assert.equal(valid.ok, true);
    assert.equal(valid.session.negotiatedProtocol, 4);
    assert.equal(valid.session.role, 'operator');
    assert.equal(valid.session.authenticated, true);

    const badProto = validateHandshake({ protocol: 2, role: 'operator' });
    assert.equal(badProto.ok, false);
    assert.match(badProto.message, /Unsupported protocol version/);

    const badToken = validateHandshake(
      { protocol: 4, role: 'operator', token: 'wrong' },
      'secret-tok'
    );
    assert.equal(badToken.ok, false);
    assert.equal(badToken.code, RPC_ERROR_CODES.UNAUTHORIZED);
  });

  await t.test('Multiplexer resolves and rejects requests with timeout deadlines', async () => {
    const mux = new GatewayMultiplexer({ defaultTimeoutMs: 100 });
    assert.equal(mux.pendingCount, 0);

    const promiseA = mux.registerRequest('req_A', 200);
    assert.equal(mux.pendingCount, 1);
    mux.resolveResponse('req_A', { status: 'success' });
    const result = await promiseA;
    assert.deepEqual(result, { status: 'success' });
    assert.equal(mux.pendingCount, 0);

    const promiseB = mux.registerRequest('req_B', 50);
    await assert.rejects(promiseB, /timed out/);
    assert.equal(mux.pendingCount, 0);
  });
});
