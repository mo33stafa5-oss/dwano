import { z } from "zod";
import { requireRole } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { dbMissing, fail, handle, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return fail("not-found", 404);
  try {
    const rows = await q("SELECT a.id, a.action, a.before_data, a.after_data, a.created_at, u.username FROM ops_audit a LEFT JOIN users u ON u.id = a.actor_id WHERE a.transaction_id = $1 ORDER BY a.created_at DESC LIMIT 100", [id]);
    return ok({ audit: rows.map((r) => ({ id: r.id, action: r.action, before: r.before_data, after: r.after_data, at: r.created_at, by: r.username })) });
  } catch (e) {
    return handle(e);
  }
}
