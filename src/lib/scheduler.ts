import { dispatchDueEmails } from "./email";
import { releaseExpiredHolds } from "./redemptions";

/** One "tick" of background work: send scheduled emails, release unpaid top-up holds. */
export async function tick() {
  const [sent, released] = await Promise.all([dispatchDueEmails(), releaseExpiredHolds()]);
  return { sent, released };
}

let lastOpportunisticTick = 0;

/**
 * Runs the tick at most once a minute per server instance. Called after page views, so
 * scheduled e-certificates still go out on hosts without background timers (Vercel, Netlify).
 */
export async function maybeTick() {
  if (process.env.DISABLE_SCHEDULER === "true" || Date.now() - lastOpportunisticTick < 60_000) return;
  lastOpportunisticTick = Date.now();
  try {
    await tick();
  } catch (err) {
    console.error("[cadeau] background tick failed", err);
  }
}

const g = globalThis as unknown as { __cadeauScheduler?: NodeJS.Timeout };

/**
 * Long-running servers (`next start`, Docker, Render, Railway…) run the tick every minute.
 * Serverless hosts (e.g. Vercel) should call GET /api/cron/tick on a schedule instead.
 */
export function startScheduler() {
  if (g.__cadeauScheduler || process.env.DISABLE_SCHEDULER === "true") return;
  g.__cadeauScheduler = setInterval(() => {
    tick().catch((err) => console.error("[cadeau] scheduler tick failed", err));
  }, 60_000);
  g.__cadeauScheduler.unref?.();
  // first run shortly after boot
  setTimeout(() => tick().catch((err) => console.error("[cadeau] scheduler tick failed", err)), 5_000).unref?.();
}
