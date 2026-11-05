import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { createHash } from "crypto";
import { dbConfigured } from "./db";

export const ok = (data: object = {}, status = 200) => NextResponse.json({ ok: true, ...data }, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (error: string, status = 400, extra: object = {}) => NextResponse.json({ ok: false, error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export const dbMissing = () => (dbConfigured ? null : fail("db-not-configured", 503));

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<{ data: T } | { res: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { res: fail("invalid-json") };
  }
  const r = schema.safeParse(body);
  if (!r.success) return { res: fail("invalid-body", 400, { issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }) };
  return { data: r.data };
}

/** Generic error handler: never leaks internals; maps unique violations to 409. */
export function handle(e: unknown) {
  const code = (e as { code?: string })?.code;
  if (code === "23505") return fail("duplicate", 409);
  if (code === "23503") return fail("in-use", 409);
  if (code === "23514") return fail("invalid-value", 400);
  console.error("[api]", e);
  return fail("server-error", 500);
}

export function clientIpHash(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  // salted hash: raw IPs are never stored
  return createHash("sha256").update(`${process.env.SESSION_SECRET ?? "dwano"}:${ip}`).digest("hex").slice(0, 32);
}
