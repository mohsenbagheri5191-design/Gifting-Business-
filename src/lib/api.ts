import { NextResponse } from "next/server";
import { UserError } from "./validation";
import { clientIp, take } from "./rate-limit";

/** Wraps a route handler: friendly JSON errors, no stack traces leaked. */
export async function json<T>(fn: () => Promise<T>, status = 200) {
  try {
    return NextResponse.json(await fn(), { status });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[keepsake] api error", err);
    return NextResponse.json({ error: "Something went wrong on our side. Please try again in a moment." }, { status: 500 });
  }
}

export function limitOrThrow(req: Request, bucket: string, limit: number, windowMs: number) {
  if (!take(`${bucket}:${clientIp(req.headers)}`, limit, windowMs)) {
    throw new UserError("Too many attempts — please wait a few minutes and try again.", 429);
  }
}

export async function body(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new UserError("Invalid request.");
  }
}
