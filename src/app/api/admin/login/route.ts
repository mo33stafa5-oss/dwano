import { NextResponse } from "next/server";
import { adminConfigured, checkPassword, COOKIE, cookieOptions, makeToken } from "@/lib/server/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!adminConfigured) return NextResponse.json({ ok: false, error: "admin-not-configured" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || !checkPassword(body.password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ ok: false, error: "wrong-password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), cookieOptions);
  return res;
}
