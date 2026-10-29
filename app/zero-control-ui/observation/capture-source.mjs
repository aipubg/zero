import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { OBSERVATION_LIMITS } from "./constants.mjs";

function unique(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

/** Resolve the installed CUA driver SDK without adding a dependency. */
export function resolveCuaDriverEntry({
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  const configured = env.ZERO_OBSERVATION_CUA_DRIVER_ENTRY;
  const candidates = [
    configured,
    path.join(cwd, "node_modules", ".pnpm", "node_modules", "@trycua", "cua-driver", "dist", "index.js"),
    path.join(cwd, "backend", "node_modules", ".pnpm", "node_modules", "@trycua", "cua-driver", "dist", "index.js"),
  ];
  const pnpmRoots = [path.join(cwd, "node_modules", ".pnpm"), path.join(cwd, "backend", "node_modules", ".pnpm")];
  for (const root of pnpmRoots) {
    try {
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith("@trycua+cua-driver@")) continue;
        candidates.push(
          path.join(root, entry.name, "node_modules", "@trycua", "cua-driver", "dist", "index.js"),
        );
      }
    } catch {
      // A missing pnpm store is a normal unavailable state.
    }
  }
  for (const candidate of unique(candidates)) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // next candidate
    }
  }
  return null;
}

/** Parse PNG/JPEG dimensions without decoding pixels. */
export function readImageDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) return { width: 0, height: 0 };
  if (
    buffer[0] === 0x89 &&
    buffer.toString("ascii", 1, 4) === "PNG" &&
    buffer.toString("ascii", 12, 16) === "IHDR"
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  return { width: 0, height: 0 };
}

function parseStructured(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function structuredGeometry(value) {
  const record = parseStructured(value);
  if (!record) return { width: 0, height: 0, sceneKey: null };
  const width = Number(record.screenshot_width ?? record.width ?? 0);
  const height = Number(record.screenshot_height ?? record.height ?? 0);
  const display = typeof record.display === "string" ? record.display : null;
  return {
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0,
    sceneKey: display,
  };
}

async function defaultLoadSdk(entry) {
  return await import(pathToFileURL(entry).href);
}

/**
 * CUA-driver capture source.
 *
 * Reuses the already-installed OpenClaw/CUA driver SDK (MIT, 0.32.0) instead of
 * adding a new native capture stack. It is lazy: importing this module never
 * starts the driver, and `start()` is reachable only after an explicit owner
 * observation start.
 */
export function createCuaCaptureSource({
  entryPath = resolveCuaDriverEntry(),
  loadSdk = defaultLoadSdk,
  maxImageDimension = OBSERVATION_LIMITS.maxImageDimension,
  session = "zero-observer",
  clock = Date.now,
} = {}) {
  let sdk = null;
  let driver = null;
  let started = false;
  let counter = 0;

  const start = async () => {
    if (started) return;
    if (!entryPath) throw new Error("CUA_DRIVER_UNAVAILABLE: installed driver entry not found");
    sdk ??= await loadSdk(entryPath);
    driver ??= sdk.CuaDriver.create();
    if (typeof driver.startSession === "function" && sdk.StartSessionInput) {
      await driver.startSession(sdk.StartSessionInput.new({ session }));
    }
    started = true;
  };

  const capture = async ({ signal } = {}) => {
    await start();
    signal?.throwIfAborted?.();
    const input = sdk.GetDesktopStateInput
      ? sdk.GetDesktopStateInput.new({ session, maxImageDimension })
      : { session, maxImageDimension };
    const result = await driver.getDesktopState(input, signal ? { signal } : undefined);
    if (result?.isError) {
      throw new Error(`CUA_CAPTURE_ERROR: ${result.errorCode ?? "capture failed"}`);
    }
    const image = Array.isArray(result?.images) ? result.images[0] : null;
    if (!image?.dataBase64) throw new Error("CUA_CAPTURE_ERROR: no image returned");
    const buffer = Buffer.from(
      String(image.dataBase64).replace(/^data:[^;]+;base64,/u, ""),
      "base64",
    );
    const geometry = structuredGeometry(result.structuredJson);
    const dimensions = readImageDimensions(buffer);
    return {
      id: `frame-${clock()}-${counter++}`,
      capturedAtMs: clock(),
      buffer,
      bytes: buffer.length,
      mimeType: typeof image.mimeType === "string" ? image.mimeType : "image/png",
      width: geometry.width || dimensions.width,
      height: geometry.height || dimensions.height,
      sourceKey: "display:primary",
      sceneKey: geometry.sceneKey ?? "display:primary",
    };
  };

  const stop = async () => {
    started = false;
    const current = driver;
    driver = null;
    if (!current) return;
    try {
      if (sdk?.EndSessionInput && typeof current.endSession === "function") {
        await current.endSession(sdk.EndSessionInput.new({ session }));
      }
    } catch {
      // stop is best-effort
    }
    try {
      await current.shutdown?.();
    } catch {
      // stop is best-effort
    }
    try {
      current.uniffiDestroy?.();
    } catch {
      // stop is best-effort
    }
  };

  return {
    kind: "cua",
    available: Boolean(entryPath),
    start,
    capture,
    stop,
    dispose: stop,
  };
}

export function createFakeCaptureSource({ frames = [], available = true } = {}) {
  let index = 0;
  return {
    kind: "fake",
    available,
    started: false,
    async start() {
      this.started = true;
    },
    async capture() {
      if (!this.started) throw new Error("fake source not started");
      const frame = frames[Math.min(index, Math.max(0, frames.length - 1))];
      index += 1;
      if (!frame) throw new Error("fake source has no frames");
      return { ...frame, buffer: Buffer.from(frame.buffer ?? Buffer.from("frame")) };
    },
    async stop() {
      this.started = false;
    },
    async dispose() {
      this.started = false;
    },
  };
}
