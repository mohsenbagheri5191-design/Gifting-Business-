export async function register() {
  // Long-running servers send scheduled emails every minute. Serverless functions (Vercel, Netlify)
  // are frozen between requests, so there the work runs after page views and via /api/cron/tick.
  const serverless = !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build" && !serverless) {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
