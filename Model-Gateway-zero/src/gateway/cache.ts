interface CacheEntry {
  response: any;
  expiresAt: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTtlMs = 60 * 1000; // 1 minute default TTL

  public buildKey(modelId: string, messages: any[], temperature?: number): string {
    const normalizedMsgs = (messages || []).map((m: any) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));
    return `${modelId}::${temperature ?? 'default'}::${JSON.stringify(normalizedMsgs)}`;
  }

  public get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.response;
  }

  public set(key: string, response: any, ttlMs: number = this.defaultTtlMs): void {
    this.cache.set(key, {
      response,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const responseCache = new ResponseCache();
