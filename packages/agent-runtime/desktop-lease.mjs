/**
 * @fileoverview Zero Agent Runtime — Physical Desktop Action Lease Manager
 *
 * Enforces mutual exclusion for physical desktop actions (User32 mouse clicks,
 * hardware keystrokes, active window changes).
 *
 * Guarantees that only ONE specialist agent can manipulate the Windows desktop
 * at any given time, preventing clashing inputs, race conditions, and focus stealing.
 */

import { EventEmitter } from 'node:events';

export class DesktopLeaseManager extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {number} [options.defaultTimeoutMs=30000] Default lease expiration (30s)
   */
  constructor(options = {}) {
    super();
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
    this.currentHolder = null;
    this.acquiredAt = null;
    this.expiresAt = null;
    this.currentReason = null;
    this._queue = [];
    this._expirationTimer = null;
  }

  /**
   * Check if lease is currently valid and held
   */
  isHeld() {
    if (!this.currentHolder) return false;
    if (Date.now() >= this.expiresAt) {
      this._expireLease();
      return false;
    }
    return true;
  }

  /**
   * Inspect current lease state
   */
  getStatus() {
    const held = this.isHeld();
    const now = Date.now();
    return {
      held,
      holder: held ? this.currentHolder : null,
      reason: held ? this.currentReason : null,
      acquiredAt: held ? this.acquiredAt : null,
      expiresAt: held ? this.expiresAt : null,
      remainingMs: held ? Math.max(0, this.expiresAt - now) : 0,
      queueLength: this._queue.length,
      queue: this._queue.map((q) => ({ agentId: q.agentId, reason: q.reason, requestedAt: q.requestedAt })),
    };
  }

  /**
   * Acquire exclusive desktop action lease
   * @param {string} agentId Agent requesting access
   * @param {Object} [options]
   * @param {string} [options.reason] Purpose of physical action
   * @param {number} [options.timeoutMs] Lease duration before auto-release
   * @param {number} [options.waitMs=10000] Maximum milliseconds to wait in queue
   * @returns {Promise<{ acquired: boolean, leaseId?: string, holder: string, expiresAt: number }>}
   */
  async acquireLease(agentId, options = {}) {
    if (!agentId) throw new Error('acquireLease requires a valid agentId');
    const reason = options.reason || 'desktop_automation';
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const waitMs = options.waitMs !== undefined ? options.waitMs : 10000;

    const now = Date.now();

    // If currently held by same agent, just extend/renew lease
    if (this.isHeld() && this.currentHolder === agentId) {
      this.expiresAt = now + timeoutMs;
      this._scheduleExpiration();
      return {
        acquired: true,
        holder: agentId,
        expiresAt: this.expiresAt,
        renewed: true,
      };
    }

    // If lease is free (or was expired and cleared), grant immediately
    if (!this.isHeld()) {
      return this._grantLease(agentId, reason, timeoutMs);
    }

    // If waitMs is 0, do not wait, fail fast
    if (waitMs <= 0) {
      return {
        acquired: false,
        holder: this.currentHolder,
        expiresAt: this.expiresAt,
        remainingMs: Math.max(0, this.expiresAt - now),
      };
    }

    // Queue request and wait
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer = null;

      const queueEntry = {
        agentId,
        reason,
        timeoutMs,
        requestedAt: now,
        grant: () => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          resolve(this._grantLease(agentId, reason, timeoutMs));
        },
      };

      this._queue.push(queueEntry);

      timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        // Remove from queue
        const idx = this._queue.indexOf(queueEntry);
        if (idx !== -1) this._queue.splice(idx, 1);

        resolve({
          acquired: false,
          holder: this.currentHolder,
          expiresAt: this.expiresAt,
          remainingMs: Math.max(0, (this.expiresAt || 0) - Date.now()),
          timedOut: true,
        });
      }, waitMs);
    });
  }

  /**
   * Release lease if held by agent
   */
  releaseLease(agentId) {
    if (!agentId) throw new Error('releaseLease requires agentId');
    if (this.currentHolder !== agentId) {
      return { released: false, reason: 'Agent does not currently hold lease' };
    }

    const previousHolder = this.currentHolder;
    this._clearLease();
    this.emit('released', { holder: previousHolder, timestamp: Date.now() });

    // Process next in queue
    this._processNextInQueue();

    return { released: true, previousHolder };
  }

  /**
   * Force release the lease (operator intervention or human takeover)
   */
  forceRelease(operatorReason = 'Human takeover or emergency hold') {
    const previousHolder = this.currentHolder;
    this._clearLease();
    this.emit('forceReleased', { previousHolder, reason: operatorReason, timestamp: Date.now() });
    this._processNextInQueue();
    return { released: true, previousHolder, reason: operatorReason };
  }

  /**
   * Renew lease duration
   */
  renewLease(agentId, extendMs = 15000) {
    if (!this.isHeld() || this.currentHolder !== agentId) {
      return { renewed: false, error: 'Agent does not hold active lease' };
    }
    this.expiresAt += extendMs;
    this._scheduleExpiration();
    return { renewed: true, expiresAt: this.expiresAt };
  }

  _grantLease(agentId, reason, timeoutMs) {
    const now = Date.now();
    this.currentHolder = agentId;
    this.currentReason = reason;
    this.acquiredAt = now;
    this.expiresAt = now + timeoutMs;
    this._scheduleExpiration();

    const payload = {
      acquired: true,
      holder: agentId,
      reason,
      acquiredAt: this.acquiredAt,
      expiresAt: this.expiresAt,
    };
    this.emit('acquired', payload);
    return payload;
  }

  _clearLease() {
    if (this._expirationTimer) {
      clearTimeout(this._expirationTimer);
      this._expirationTimer = null;
    }
    this.currentHolder = null;
    this.currentReason = null;
    this.acquiredAt = null;
    this.expiresAt = null;
  }

  _expireLease() {
    if (!this.currentHolder) return;
    const expiredHolder = this.currentHolder;
    this._clearLease();
    this.emit('expired', { holder: expiredHolder, timestamp: Date.now() });
    this._processNextInQueue();
  }

  _scheduleExpiration() {
    if (this._expirationTimer) {
      clearTimeout(this._expirationTimer);
    }
    const delay = Math.max(0, this.expiresAt - Date.now());
    this._expirationTimer = setTimeout(() => {
      this._expireLease();
    }, delay);
  }

  _processNextInQueue() {
    while (this._queue.length > 0) {
      const next = this._queue.shift();
      if (next && typeof next.grant === 'function') {
        next.grant();
        break;
      }
    }
  }

  destroy() {
    this._clearLease();
    this._queue = [];
    this.removeAllListeners();
  }
}
