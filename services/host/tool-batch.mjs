/**
 * Canonical tool batch validation and schema enforcement.
 * Validates the complete model batch before any side effect or transcript admission.
 *
 * All aliases come from the single Zero capability registry so the model-facing
 * names, the allowlist and the execution engine can never drift apart.
 */

import { CAPABILITY_ALIASES, resolveCapabilityAlias } from '../../packages/capability-engine/aliases.mjs';

export const TOOL_ALIASES = CAPABILITY_ALIASES;

function validateSchema(fnName, args, schema) {
  if (!schema || typeof schema !== 'object') return;

  // 1. Required fields
  if (Array.isArray(schema.required)) {
    for (const req of schema.required) {
      if (args[req] === undefined || args[req] === null || args[req] === '') {
        throw new Error(`Tool '${fnName}' missing required argument '${req}'`);
      }
    }
  }

  const properties = schema.properties || {};

  // 2. Additional properties check
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(args)) {
      if (!Object.hasOwn(properties, key)) {
        throw new Error(`Tool '${fnName}' received unexpected argument '${key}'`);
      }
    }
  }

  // 3. Property type and enum validation
  for (const [key, val] of Object.entries(args)) {
    if (val === undefined || val === null) continue;
    const propSpec = properties[key];
    if (!propSpec) continue;

    // Type check
    if (propSpec.type) {
      if (propSpec.type === 'string' && typeof val !== 'string') {
        throw new Error(`Tool '${fnName}' argument '${key}' must be a string, got ${typeof val}`);
      }
      if (propSpec.type === 'number' && (typeof val !== 'number' || !Number.isFinite(val))) {
        throw new Error(`Tool '${fnName}' argument '${key}' must be a finite number, got ${typeof val}`);
      }
      if (propSpec.type === 'boolean' && typeof val !== 'boolean') {
        throw new Error(`Tool '${fnName}' argument '${key}' must be a boolean, got ${typeof val}`);
      }
      if (propSpec.type === 'array' && !Array.isArray(val)) {
        throw new Error(`Tool '${fnName}' argument '${key}' must be an array`);
      }
      if (propSpec.type === 'object' && (typeof val !== 'object' || Array.isArray(val))) {
        throw new Error(`Tool '${fnName}' argument '${key}' must be an object`);
      }
    }

    // Enum check
    if (Array.isArray(propSpec.enum)) {
      if (!propSpec.enum.includes(val)) {
        throw new Error(`Tool '${fnName}' argument '${key}' value '${val}' is not in allowed choices: [${propSpec.enum.join(', ')}]`);
      }
    }

    // Number bounds
    if (typeof val === 'number') {
      if (propSpec.minimum !== undefined && val < propSpec.minimum) {
        throw new Error(`Tool '${fnName}' argument '${key}' value ${val} is below minimum ${propSpec.minimum}`);
      }
      if (propSpec.maximum !== undefined && val > propSpec.maximum) {
        throw new Error(`Tool '${fnName}' argument '${key}' value ${val} exceeds maximum ${propSpec.maximum}`);
      }
    }
  }
}

export function prepareToolBatch(calls, allowedTools) {
  if (!Array.isArray(calls) || !calls.length) {
    throw new Error('Empty model tool batch');
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

  return calls.map(call => {
    if (!call || typeof call.id !== 'string' || !call.id.trim() || ids.has(call.id)) {
      throw new Error('Missing or duplicate model tool call ID');
    }
    ids.add(call.id);

    const rawName = call.function?.name;
    if (typeof rawName !== 'string' || !rawName.trim()) {
      throw new Error('Missing model tool call function name');
    }

    // Resolve the single canonical capability. Aliases never bypass the
    // allowlist: the canonical capability must itself be declared.
    const alias = resolveCapabilityAlias(rawName);
    const canonicalName = alias?.name || rawName;

    // Check allowlist
    const isAllowed = allowedSet.has(rawName) || allowedSet.has(canonicalName);
    if (!isAllowed) {
      throw new Error(`Model requested an undeclared tool '${rawName}'`);
    }

    let args;
    try {
      args = typeof call.function.arguments === 'string'
        ? JSON.parse(call.function.arguments)
        : (call.function.arguments ?? {});
    } catch {
      throw new Error(`Malformed model tool arguments JSON for '${rawName}'`);
    }

    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw new Error(`Model tool arguments for '${rawName}' must be an object`);
    }

    // Alias defaults are merged first so an explicit model value always wins.
    if (alias?.set) args = { ...alias.set, ...args };
    if (alias?.action && args.action === undefined) args = { ...args, action: alias.action };

    // Validate against tool JSON schema if schema is available
    const schema = schemaMap.get(canonicalName) || schemaMap.get(rawName);
    if (schema) {
      validateSchema(canonicalName, args, schema);
    }

    return {
      call,
      fnName: canonicalName,
      rawName,
      args,
      ...(alias ? { alias: true } : {}),
    };
  });
}
