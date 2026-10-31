import type { ProviderStatus, ProviderTelemetry } from './types.ts';

const STORAGE_KEY = 'modular_gateway_telemetry_v1';

class TelemetryService {
  private store: Record<string, ProviderTelemetry> = {};
  private listeners: Set<(data: Record<string, ProviderTelemetry>) => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.store = JSON.parse(raw);
      }
    } catch {
      this.store = {};
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
    } catch {}
    this.notify();
  }

  private notify(): void {
    const clone = { ...this.store };
    this.listeners.forEach((fn) => fn(clone));
  }

  public subscribe(fn: (data: Record<string, ProviderTelemetry>) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public get(providerId: string): ProviderTelemetry {
    if (!this.store[providerId]) {
      this.store[providerId] = {
        status: 'idle',
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokensUsed: 0,
        lastActiveKeyIndex: 0,
      };
    }
    return this.store[providerId];
  }

  public getAll(): Record<string, ProviderTelemetry> {
    return { ...this.store };
  }

  public recordPing(
    providerId: string,
    latencyMs: number,
    ok: boolean = true,
    error?: string
  ): void {
    const item = this.get(providerId);
    item.lastPingMs = latencyMs;
    item.lastTestedAt = Date.now();
    if (ok) {
      item.status = 'active';
      item.lastError = undefined;
    } else {
      item.status = 'error';
      item.lastError = error;
    }
    this.persist();
  }

  public recordSuccess(providerId: string, latencyMs: number, tokensUsed: number): void {
    const item = this.get(providerId);
    item.totalRequests += 1;
    item.successfulRequests += 1;
    item.totalTokensUsed += tokensUsed;
    if (item.avgLatencyMs) {
      item.avgLatencyMs = Math.round((item.avgLatencyMs + latencyMs) / 2);
    } else {
      item.avgLatencyMs = latencyMs;
    }
    item.status = 'active';
    item.lastError = undefined;
    this.persist();
  }

  public recordFailure(providerId: string, error: string, isRateLimit?: boolean): void {
    const item = this.get(providerId);
    item.totalRequests += 1;
    item.failedRequests += 1;
    item.lastError = error;
    if (isRateLimit || error.toLowerCase().includes('rate limit') || error.includes('429')) {
      item.status = 'rate-limited';
    } else {
      item.status = 'error';
    }
    this.persist();
  }

  public setKeyIndex(providerId: string, keyIndex: number): void {
    const item = this.get(providerId);
    item.lastActiveKeyIndex = keyIndex;
    this.persist();
  }

  public setStatus(providerId: string, status: ProviderStatus): void {
    const item = this.get(providerId);
    item.status = status;
    this.persist();
  }
}

export const telemetry = new TelemetryService();
