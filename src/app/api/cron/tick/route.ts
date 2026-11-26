import { NextResponse } from "next/server";
import { tick } from "@/lib/scheduler";

/**
 * For serverless hosts: call every minute (e.g. Vercel Cron) with
 *   Authorization: Bearer $CRON_SECRET
 * Sends scheduled e-certificates and releases expired top-up holds.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await tick());
}
