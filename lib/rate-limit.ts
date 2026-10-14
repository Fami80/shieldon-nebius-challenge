type WindowEntry = { count: number; resetAt: number };

const windows = new Map<string, WindowEntry>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function consumeRateLimit(
  key: string,
  limit = 3,
  windowMs = 60_000,
  now = Date.now(),
): RateLimitResult {
  for (const [knownKey, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(knownKey);
  }

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
