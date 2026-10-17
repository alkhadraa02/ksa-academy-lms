type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Tiny in-memory fixed-window limiter (per process) used to slow down password guessing. */
export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= max;
}

export function resetRateLimit(key?: string) {
  if (key) buckets.delete(key);
  else buckets.clear();
}
