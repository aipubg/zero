import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OBSERVATION_LIMITS } from "./constants.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function capText(value, maxChars) {
  const text = String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, " ")
    .replace(/[ \t]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}

/** Strip common credential shapes; observed text is untrusted input. */
export function sanitizeObservedText(value, maxChars = OBSERVATION_LIMITS.maxObservedTextChars) {
  let text = capText(value, maxChars);
  text = text
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gu, "[redacted private key]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/giu, "Bearer [redacted]")
    .replace(/\b(?:sk|pk|rk|api)[_-][A-Za-z0-9_-]{16,}\b/giu, "[redacted key]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/gu, "[redacted key]")
    .replace(/\b(password|passwd|pwd|secret|token)\s*[:=]\s*\S+/giu, "$1: [redacted]");
  return text;
}

function runPowerShell({ scriptPath, input, timeoutMs, maxBuffer, signal }) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      { timeout: timeoutMs, maxBuffer, windowsHide: true, encoding: "utf8", signal },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && String(stderr).trim()) {
          // Diagnostics stay local and are not returned to the model.
        }
        resolve(String(stdout ?? ""));
      },
    );
    if (input !== undefined) {
      child.stdin?.end(String(input));
    } else {
      child.stdin?.end();
    }
  });
}

function parseJsonOutput(output) {
  const text = String(output ?? "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createPowerShellUiaAdapter({
  scriptPath = path.join(moduleDir, "uia-snapshot.ps1"),
  run = runPowerShell,
  timeoutMs = 1_500,
  maxBytes = 256 * 1024,
  maxChars = OBSERVATION_LIMITS.maxObservedTextChars,
} = {}) {
  return {
    kind: "uia",
    async read({ signal } = {}) {
      signal?.throwIfAborted?.();
      const output = await run({ scriptPath, timeoutMs, maxBuffer: maxBytes, signal });
      const parsed = parseJsonOutput(output);
      if (!parsed || parsed.ok !== true) return { ok: false, reason: "uia-unavailable", text: "" };
      return {
        ok: true,
        app: typeof parsed.app === "string" ? parsed.app : "",
        window: typeof parsed.window === "string" ? parsed.window : "",
        text: sanitizeObservedText(parsed.text, maxChars),
        confidence: 0.8,
      };
    },
  };
}

export function createWindowsOcrAdapter({
  scriptPath = path.join(moduleDir, "ocr-snapshot.ps1"),
  run = runPowerShell,
  timeoutMs = 3_000,
  maxBytes = 512 * 1024,
  maxChars = OBSERVATION_LIMITS.maxObservedTextChars,
} = {}) {
  return {
    kind: "ocr",
    async read({ buffer, mimeType = "image/png", signal } = {}) {
      signal?.throwIfAborted?.();
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return { ok: false, reason: "no-image", text: "" };
      }
      const input = JSON.stringify({ mimeType, dataBase64: buffer.toString("base64") });
      const output = await run({ scriptPath, input, timeoutMs, maxBuffer: maxBytes, signal });
      const parsed = parseJsonOutput(output);
      if (!parsed || parsed.ok !== true) return { ok: false, reason: parsed?.reason ?? "ocr-unavailable", text: "" };
      return {
        ok: true,
        app: typeof parsed.app === "string" ? parsed.app : "",
        window: typeof parsed.window === "string" ? parsed.window : "",
        text: sanitizeObservedText(parsed.text, maxChars),
        confidence: 0.6,
      };
    },
  };
}

export function createPerceptionPipeline({
  uia = null,
  ocr = null,
  maxChars = OBSERVATION_LIMITS.maxObservedTextChars,
  clock = Date.now,
} = {}) {
  const processFrame = async (frame, { signal } = {}) => {
    signal?.throwIfAborted?.();
    let result = null;
    let source = "none";
    if (uia) {
      try {
        const value = await uia.read({ frame, signal });
        if (value?.ok && value.text) {
          result = value;
          source = "uia";
        }
      } catch (error) {
        if (signal?.aborted) throw error;
      }
    }
    if (!result && ocr) {
      try {
        const value = await ocr.read({ buffer: frame.buffer, mimeType: frame.mimeType, signal });
        if (value?.ok) {
          result = value;
          source = "ocr";
        }
      } catch (error) {
        if (signal?.aborted) throw error;
      }
    }
    const text = sanitizeObservedText(result?.text ?? "", maxChars);
    const summary =
      text ||
      (result?.window
        ? `Window: ${sanitizeObservedText(result.window, 200)}`
        : "Window changed; no readable text extracted.");
    return {
      capturedAtMs: frame.capturedAtMs ?? clock(),
      app: sanitizeObservedText(result?.app ?? "", 200),
      window: sanitizeObservedText(result?.window ?? "", 300),
      summary,
      source: text ? source : "window",
      confidence: Number.isFinite(result?.confidence) ? result.confidence : text ? 0.5 : 0.2,
      textLength: text.length,
    };
  };
  return { processFrame };
}
