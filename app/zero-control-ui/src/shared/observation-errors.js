/**
 * Browser-safe sanitizer for observation errors shown on the native About page.
 *
 * It keeps safe categories/context (for example `CUA_CAPTURE_ERROR` or
 * `capture failed`) while removing credential-shaped values. It is not a
 * general log redactor; backend logs still follow the host's redaction rules.
 */
export function sanitizeObservationError(value, maxChars = 200) {
  let text = String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, " ")
    .replace(/[ \t]+/gu, " ")
    .replace(/\s*\n\s*/gu, " ")
    .trim();
  text = text
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/giu,
      "[redacted private key]",
    )
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/giu, "Bearer [redacted]")
    .replace(
      /\b(token|password|passwd|pwd|secret|api[_-]?key|authorization)\b\s*[:=]\s*([^\s,;]+)/giu,
      "$1: [redacted]",
    )
    .replace(/\b(?:sk|pk|rk|ghp|gho|ghu|ghs|ghr|xox[baprs])[-_][A-Za-z0-9_-]{8,}\b/giu, "[redacted key]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/gu, "[redacted key]")
    .replace(/\b(https?:\/\/)[^\s/@]+:[^\s/@]+@/giu, "$1[redacted]@");
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}
