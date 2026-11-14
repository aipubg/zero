/**
 * Local plugin entry SDK.
 *
 * The Zero Policy plugin used to import these helpers from the upstream
 * package, which made the project depend on an external bundle. These are
 * the two helpers it needs, implemented natively:
 *
 *   definePluginEntry             declares a plugin and its config schema
 *   buildJsonPluginConfigSchema   turns a JSON schema into a runtime schema
 *
 * The runtime schema only has to support "safeParse", which is all the
 * plugin loader and the config loader use.
 */

/** An empty object schema: every plugin config is optional by default. */
export function emptyPluginConfigSchema() {
  return {
    safeParse(value) {
      if (value === undefined || value === null) return { success: true, data: {} };
      if (typeof value !== 'object' || Array.isArray(value)) {
        return {
          success: false,
          error: { issues: [{ path: [], message: 'Expected an object' }] },
        };
      }
      return { success: true, data: value };
    },
  };
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value, type) {
  switch (type) {
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'integer': return Number.isInteger(value);
    case 'boolean': return typeof value === 'boolean';
    case 'null': return value === null;
    default: return true;
  }
}

/**
 * Validate a value against a JSON schema subset: type, required,
 * properties, additionalProperties and enum. Unknown keywords are ignored,
 * which matches how the plugin loader treats a schema.
 */
function validateAgainstJsonSchema(schema, value, path = [], issues = []) {
  if (!schema || typeof schema !== 'object') return issues;

  if (Array.isArray(schema.allOf)) {
    for (const part of schema.allOf) validateAgainstJsonSchema(part, value, path, issues);
    return issues;
  }
  if (schema.anyOf || schema.oneOf) {
    const options = schema.anyOf || schema.oneOf;
    const ok = options.some(part => validateAgainstJsonSchema(part, value, path, []).length === 0);
    if (!ok) issues.push({ path, message: 'Value does not match any allowed schema' });
    return issues;
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    issues.push({ path, message: `Expected one of ${schema.enum.map(v => JSON.stringify(v)).join(', ')}` });
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some(t => matchesType(value, t))) {
      issues.push({ path, message: `Expected ${types.join(' or ')} but received ${typeOf(value)}` });
      return issues;
    }
  }

  if (schema.type === 'object' || schema.properties) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return issues;
    for (const required of schema.required || []) {
      if (value[required] === undefined) {
        issues.push({ path: [...path, required], message: 'Required property is missing' });
      }
    }
    const properties = schema.properties || {};
    for (const [key, child] of Object.entries(properties)) {
      if (value[key] === undefined) continue;
      validateAgainstJsonSchema(child, value[key], [...path, key], issues);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          issues.push({ path: [...path, key], message: 'Additional property is not allowed' });
        }
      }
    }
  }

  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateAgainstJsonSchema(schema.items, item, [...path, index], issues));
  }

  return issues;
}

/**
 * Build a runtime config schema from a JSON schema.
 * The result exposes safeParse, which is the contract the plugin loader uses.
 */
export function buildJsonPluginConfigSchema(jsonSchema) {
  const schema = jsonSchema && typeof jsonSchema === 'object' ? jsonSchema : {};
  return {
    jsonSchema: schema,
    safeParse(value) {
      if (value === undefined || value === null) return { success: true, data: {} };
      const issues = validateAgainstJsonSchema(schema, value);
      if (issues.length) return { success: false, error: { issues } };
      return { success: true, data: value };
    },
  };
}

/** Build a runtime schema from an explicit shape, for simple object configs. */
export function buildPluginConfigSchema(shape = {}) {
  return buildJsonPluginConfigSchema({
    type: 'object',
    properties: shape,
    additionalProperties: false,
  });
}

function cachedLazyValueGetter(value) {
  let cached;
  let resolved = false;
  return () => {
    if (!resolved) {
      cached = typeof value === 'function' ? value() : value;
      resolved = true;
    }
    return cached;
  };
}

/**
 * Declare a plugin entry.
 *
 * The config schema is resolved lazily so a plugin that needs runtime state
 * (for example a schema read from disk) is only built when it is first used.
 */
export function definePluginEntry({
  id,
  name,
  description,
  kind,
  configSchema = emptyPluginConfigSchema(),
  reload,
  nodeHostCommands,
  securityAuditCollectors,
  register,
}) {
  const getConfigSchema = cachedLazyValueGetter(configSchema);
  return {
    id,
    name,
    description,
    ...(kind ? { kind } : {}),
    ...(reload ? { reload } : {}),
    ...(nodeHostCommands ? { nodeHostCommands } : {}),
    ...(securityAuditCollectors ? { securityAuditCollectors } : {}),
    get configSchema() {
      return getConfigSchema();
    },
    register,
  };
}
