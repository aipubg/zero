/**
 * Canonical tool batch validation and schema enforcement.
 * Tolerant by design: never throws. Missing/fuzzy arguments are normalized
 * or coerced inside the Single Room so the model never hits a hard schema
 * rejection that aborts the chat turn.
 *
 * All aliases come from the single Zero capability registry so the model-facing
 * names, the allowlist and the execution engine can never drift apart.
 */

import { CAPABILITY_ALIASES, resolveCapabilityAlias } from '../../packages/capability-engine/aliases.mjs';

export const TOOL_ALIASES = CAPABILITY_ALIASES;

let _syntheticIdCounter = 0;
function _syntheticId() {
  return `call_synthetic_${Date.now()}_${++_syntheticIdCounter}`;
}

/**
 * Tolerant schema validation: normalizes/coerces instead of throwing.
 * Returns { ok, args, warnings } where args is the normalized version.
 */
function validateSchema(fnName, args, schema) {
  const warnings = [];
  if (!schema || typeof schema !== 'object') return { ok: true, args, warnings };

  const normalized = { ...args };
  const properties = schema.properties || {};

  // 1. Required fields: coerce missing values instead of throwing
  if (Array.isArray(schema.required)) {
    for (const req of schema.required) {
      if (normalized[req] === undefined || normalized[req] === null || normalized[req] === '') {
        const propSpec = properties[req];
        if (propSpec?.type === 'string') normalized[req] = '';
        else if (propSpec?.type === 'number') normalized[req] = 0;
        else if (propSpec?.type === 'boolean') normalized[req] = false;
        else if (propSpec?.type === 'array') normalized[req] = [];
        else if (propSpec?.type === 'object') normalized[req] = {};
        else normalized[req] = '';
        warnings.push(`Coerced missing required argument '${req}' to default`);
      }
    }
  }

  // 2. Additional properties: never reject, just pass through
  // (additionalProperties === false is treated as true for tolerance)

  // 3. Property type and enum validation: coerce instead of throwing
  for (const [key, val] of Object.entries(normalized)) {
    if (val === undefined || val === null) continue;
    const propSpec = properties[key];
    if (!propSpec) continue;

    // Type coercion
    if (propSpec.type) {
      if (propSpec.type === 'string' && typeof val !== 'string') {
        normalized[key] = String(val);
        warnings.push(`Coerced argument '${key}' to string`);
      }
      if (propSpec.type === 'number' && (typeof val !== 'number' || !Number.isFinite(val))) {
        const parsed = Number(val);
        normalized[key] = Number.isFinite(parsed) ? parsed : 0;
        warnings.push(`Coerced argument '${key}' to number`);
      }
      if (propSpec.type === 'boolean' && typeof val !== 'boolean') {
        normalized[key] = val === 'true' || val === 1 || val === '1';
        warnings.push(`Coerced argument '${key}' to boolean`);
      }
      if (propSpec.type === 'array' && !Array.isArray(val)) {
        normalized[key] = typeof val === 'string' ? [val] : [];
        warnings.push(`Coerced argument '${key}' to array`);
      }
      if (propSpec.type === 'object' && (typeof val !== 'object' || Array.isArray(val))) {
        normalized[key] = {};
        warnings.push(`Coerced argument '${key}' to object`);
      }
    }

    // Enum check: coerce to first valid value instead of throwing
    if (Array.isArray(propSpec.enum)) {
      const current = normalized[key];
      if (!propSpec.enum.includes(current)) {
        normalized[key] = propSpec.enum[0];
        warnings.push(`Coerced argument '${key}' to first allowed enum value`);
      }
    }

    // Number bounds: clamp instead of throwing
    if (typeof normalized[key] === 'number') {
      if (propSpec.minimum !== undefined && normalized[key] < propSpec.minimum) {
        normalized[key] = propSpec.minimum;
        warnings.push(`Clamped argument '${key}' to minimum ${propSpec.minimum}`);
      }
      if (propSpec.maximum !== undefined && normalized[key] > propSpec.maximum) {
        normalized[key] = propSpec.maximum;
        warnings.push(`Clamped argument '${key}' to maximum ${propSpec.maximum}`);
      }
    }
  }

  return { ok: true, args: normalized, warnings };
}

export function prepareToolBatch(calls, allowedTools) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(calls) || calls.length === 0) {
    warnings.push('Empty model tool batch');
    return { ok: true, prepared: [], errors, warnings };
  }

  let allowedSet = new Set();
  const schemaMap = new Map();

  if (allowedTools instanceof Set) {
    allowedSet = allowedTools;
  } else if (Array.isArray(allowedTools)) {
    for (const item of allowedTools) {
      if (typeof item === 'string') {
        allowedSet.add(item);
      } else if (item?.function?.name) {
        allowedSet.add(item.function.name);
        if (item.function.parameters) {
          schemaMap.set(item.function.name, item.function.parameters);
        }
      }
    }
  } else if (allowedTools && typeof allowedTools === 'object') {
    for (const [name, def] of Object.entries(allowedTools)) {
      allowedSet.add(name);
      if (def?.parameters) schemaMap.set(name, def.parameters);
    }
  }

  const ids = new Set();

  const prepared = calls.map(call => {
    const callErrors = [];
    const callWarnings = [];

    // Handle missing or duplicate tool call IDs
    let callId = call?.id;
    if (!callId || typeof callId !== 'string' || !callId.trim() || ids.has(callId)) {
      callId = _syntheticId();
      callWarnings.push(`Assigned synthetic tool call ID (original missing or duplicate)`);
    }
    ids.add(callId);

    const rawName = call?.function?.name;
    if (typeof rawName !== 'string' || !rawName.trim()) {
      callErrors.push('Missing model tool call function name');
      return { call, fnName: rawName || 'unknown', rawName, args: {}, errors: callErrors, warnings: callWarnings, _synthetic: true };
    }

    // Resolve the single canonical capability.
    const alias = resolveCapabilityAlias(rawName);
    const canonicalName = alias?.name || rawName;

    // Check allowlist
    const isAllowed = allowedSet.has(rawName) || allowedSet.has(canonicalName);
    if (!isAllowed) {
      callErrors.push(`Model requested an undeclared tool '${rawName}'`);
      return { call, fnName: canonicalName, rawName, args: {}, errors: callErrors, warnings: callWarnings, _synthetic: true };
    }

    // Parse arguments - tolerate malformed JSON
    let args = {};
    if (call.function.arguments !== undefined) {
      if (typeof call.function.arguments === 'string') {
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          args = {};
          callWarnings.push(`Malformed JSON arguments for '${rawName}', using empty object`);
        }
      } else if (typeof call.function.arguments === 'object' && !Array.isArray(call.function.arguments)) {
        args = { ...call.function.arguments };
      } else {
        args = {};
        callWarnings.push(`Non-object arguments for '${rawName}', using empty object`);
      }
    }

    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      args = {};
      callWarnings.push(`Invalid arguments for '${rawName}', using empty object`);
    }

    // Alias defaults are merged first so an explicit model value always wins.
    if (alias?.set) args = { ...alias.set, ...args };
    if (alias?.action && args.action === undefined) args = { ...args, action: alias.action };

    // Validate against tool JSON schema if schema is available (tolerant)
    const schema = schemaMap.get(canonicalName) || schemaMap.get(rawName);
    if (schema) {
      const result = validateSchema(canonicalName, args, schema);
      args = result.args;
      callWarnings.push(...result.warnings);
    }

    return {
      call,
      callId,
      fnName: canonicalName,
      rawName,
      args,
      errors: callErrors,
      warnings: callWarnings,
      ...(alias ? { alias: true } : {}),
    };
  });

  const hasErrors = prepared.some(p => p.errors.length > 0);
  return {
    ok: !hasErrors,
    prepared,
    errors,
    warnings,
  };
}
