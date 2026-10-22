import { NextResponse } from "next/server";
import { adminConfigured, isAdminRequest } from "@/lib/server/adminAuth";
import { kv, kvConfigured, REQUESTS_KEY, SEEN_KEY } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function gate(req: Request) {
  if (!adminConfigured || !kvConfigured) return NextResponse.json({ ok: false, error: "not-configured" }, { status: 503 });
  if (!isAdminRequest(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return null;
}

/** Admin only: list stored requests (newest first) with a `seen` flag. */
export async function GET(req: Request) {
  const blocked = gate(req);
  if (blocked) return blocked;
  try {
    const [raw, seen] = await Promise.all([kv<string[]>("LRANGE", REQUESTS_KEY, 0, 199), kv<string[]>("SMEMBERS", SEEN_KEY)]);
    const seenSet = new Set(seen);
    const requests = raw
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .map((r) => ({ ...r, seen: seenSet.has(r.id) }));
    return NextResponse.json({ ok: true, requests });
  } catch {
    return NextResponse.json({ ok: false, error: "storage-failed" }, { status: 502 });
  }
}

/** Admin only: mark requests as seen. Body: { ids: string[] } */
export async function POST(req: Request) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  if (ids.length === 0) return NextResponse.json({ ok: true });
  try {
    await kv("SADD", SEEN_KEY, ...ids);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "storage-failed" }, { status: 502 });
  }
}
