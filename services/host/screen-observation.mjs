import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createObservationLifecycle } from '../../app/zero-control-ui/observation/lifecycle.mjs';
import { OBSERVATION_PREFERENCE_NAMESPACE } from '../../app/zero-control-ui/observation/preference.mjs';

/** Adapt real native capture to the existing About controls and durable lifecycle. */
export function createNativeObservationLifecycle({ observer, prefsPath }) {
  let privateMode = false;
  const status = () => {
    const telemetry = observer.getStatus();
    const failed = Boolean(telemetry.stats.lastCaptureError);
    return {
      enabled: telemetry.running, privateMode, sourceAvailable: process.platform === 'win32',
      running: telemetry.running, state: privateMode ? 'private' : failed ? 'error' : telemetry.running ? 'capturing' : 'stopped',
      lastError: telemetry.stats.lastCaptureError?.message || null,
      ring: { frames: telemetry.buffer.frameCount, bytes: telemetry.buffer.retainedMemoryBytes },
      queue: { active: Number(telemetry.captureInFlight), pending: 0 },
      counters: { processed: telemetry.stats.totalObservationsStored, failed: telemetry.stats.totalCaptureFailures },
      observer: telemetry,
    };
  };
  const engine = {
    status,
    async start() {
      if (privateMode) return status();
      observer.start();
      const frame = await observer.captureTick();
      if (!frame && observer.getStatus().stats.lastCaptureError) await observer.stop();
      return status();
    },
    async stop() { await observer.stop(); return status(); },
    async setPrivateMode(next) {
      privateMode = next === true;
      if (privateMode) { await observer.stop(); observer.buffer.clear(); }
      return status();
    },
    dispose: () => observer.destroy(),
    recent: ({ limit }) => observer.store.getRecentObservations(limit).map(row => ({
      captured_at_ms: row.timestamp, app: row.application_id, window: row.window_context,
      summary: row.semantic_summary, source: row.ocr_status === 'available' ? 'ocr' : 'window', confidence: row.confidence,
    })),
  };
  return createObservationLifecycle({ engine, getStore: async () => ({
    lookup(key) {
      if (!fs.existsSync(prefsPath)) return undefined;
      return JSON.parse(fs.readFileSync(prefsPath, 'utf8'))[OBSERVATION_PREFERENCE_NAMESPACE]?.[key];
    },
    register(key, record) {
      const current = fs.existsSync(prefsPath) ? JSON.parse(fs.readFileSync(prefsPath, 'utf8')) : {};
      if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('Preferences must be an object');
      const next = { ...current, [OBSERVATION_PREFERENCE_NAMESPACE]: { ...current[OBSERVATION_PREFERENCE_NAMESPACE], [key]: record } };
      fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
      const temporary = `${prefsPath}.${crypto.randomUUID()}.tmp`;
      try {
        fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { flag: 'wx' });
        fs.renameSync(temporary, prefsPath);
      } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    },
  }) });
}
