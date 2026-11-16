import { randomUUID } from 'node:crypto';

export class GatewayEventBus {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Event listener must be a function');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event, payload, metadata = {}) {
    if (typeof event !== 'string' || !event.trim()) throw new TypeError('Event name is required');
    const record = { id: randomUUID(), event, payload, timestamp: Date.now() };
    for (const listener of this.listeners) listener(record, metadata);
    return record;
  }

  close() {
    this.listeners.clear();
  }
}
