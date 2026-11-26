/**
 * Small in-memory sliding-window limiter (per server instance).
 * Used to stop brute-force guessing of certificate codes and form spam.
 * For multi-instance deployments, swap for Redis/Upstash with the same interface.
 */
const hits = new Map<string, number[]>();

function recent(key: string, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.set(key, list);
  return list;
}

/** Records a hit and returns whether the caller is still within the limit. */
export function take(key: string, limit: number, windowMs: number): boolean {
  const list = recent(key, windowMs);
  if (list.length >= limit) return false;
  list.push(Date.now());
  return true;
}

/** True when the key already used up its limit (does not record a hit). */
export function isLimited(key: string, limit: number, windowMs: number): boolean {
  return recent(key, windowMs).length >= limit;
}

export function record(key: string) {
  const list = hits.get(key) ?? [];
  list.push(Date.now());
  hits.set(key, list);
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "local";
}

export const LIMITS = {
  codeFailures: { limit: 10, windowMs: 15 * 60_000 },
  checkout: { limit: 20, windowMs: 10 * 60_000 },
  forms: { limit: 6, windowMs: 10 * 60_000 },
  adminLogin: { limit: 8, windowMs: 15 * 60_000 },
} as const;
