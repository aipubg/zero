/**
 * Bounded local worker queue.
 *
 * Jobs are local perception work. The queue never owns a network client and
 * never retries forever: when pending work exceeds the bound the newest job is
 * refused and the caller records the drop. `clear()` aborts active work and
 * empties pending work for Private Mode/stop.
 */
export function createWorkerQueue({
  concurrency = 1,
  maxPending = 8,
  onError = () => {},
} = {}) {
  let pending = [];
  let active = 0;
  let generation = 0;
  let stopped = false;
  const activeControllers = new Set();
  const idleWaiters = new Set();

  const notifyIdle = () => {
    if (active !== 0 || pending.length !== 0) return;
    for (const resolve of idleWaiters) resolve();
    idleWaiters.clear();
  };

  const whenIdle = () =>
    active === 0 && pending.length === 0
      ? Promise.resolve()
      : new Promise((resolve) => idleWaiters.add(resolve));

  const stats = () => ({
    pending: pending.length,
    active,
    concurrency,
    maxPending,
    generation,
    stopped,
  });

  const drain = async () => {
    while (!stopped && active < concurrency && pending.length > 0) {
      const job = pending.shift();
      active += 1;
      const controller = new AbortController();
      activeControllers.add(controller);
      try {
        await job.run({
          signal: controller.signal,
          generation,
          isCurrent: () => !stopped && generation === job.generation,
        });
      } catch (error) {
        if (!controller.signal.aborted) onError(error);
      } finally {
        activeControllers.delete(controller);
        active -= 1;
        notifyIdle();
        void drain();
      }
    }
  };

  const enqueue = (run, metadata = {}) => {
    if (stopped) return { accepted: false, reason: "stopped" };
    if (typeof run !== "function") return { accepted: false, reason: "invalid" };
    if (pending.length >= maxPending) return { accepted: false, reason: "full" };
    pending.push({ run, generation, ...metadata });
    void drain();
    notifyIdle();
    return { accepted: true, reason: null };
  };

  const clear = (reason = "clear") => {
    generation += 1;
    for (const controller of activeControllers) {
      try {
        controller.abort(new Error(reason));
      } catch {
        // ignore
      }
    }
    activeControllers.clear();
    pending = [];
    notifyIdle();
  };

  const stop = () => {
    stopped = true;
    clear("stop");
  };

  return { enqueue, clear, stop, stats, whenIdle };
}
