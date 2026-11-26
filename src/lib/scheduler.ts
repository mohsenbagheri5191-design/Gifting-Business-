import { dispatchDueEmails } from "./email";
import { releaseExpiredHolds } from "./redemptions";

/** One "tick" of background work: send scheduled emails, release unpaid top-up holds. */
export async function tick() {
  const [sent, released] = await Promise.all([dispatchDueEmails(), releaseExpiredHolds()]);
  return { sent, released };
}

const g = globalThis as unknown as { __keepsakeScheduler?: NodeJS.Timeout };

/**
 * Long-running servers (`next start`, Docker, Render, Railway…) run the tick every minute.
 * Serverless hosts (e.g. Vercel) should call GET /api/cron/tick on a schedule instead.
 */
export function startScheduler() {
  if (g.__keepsakeScheduler || process.env.DISABLE_SCHEDULER === "true") return;
  g.__keepsakeScheduler = setInterval(() => {
    tick().catch((err) => console.error("[keepsake] scheduler tick failed", err));
  }, 60_000);
  g.__keepsakeScheduler.unref?.();
  // first run shortly after boot
  setTimeout(() => tick().catch((err) => console.error("[keepsake] scheduler tick failed", err)), 5_000).unref?.();
}
