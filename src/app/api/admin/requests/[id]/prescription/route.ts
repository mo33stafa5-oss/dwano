import { requireRole } from "@/lib/server/auth";
import { q1 } from "@/lib/server/db";
import { dbMissing, fail } from "@/lib/server/http";
import { loadPrescription } from "@/lib/server/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin only: streams the DECRYPTED prescription image. The stored object is never public or readable on its own. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  try {
    const p = await q1("SELECT storage_url, content_type FROM prescriptions WHERE request_id = $1", [id]);
    if (!p) return fail("not-found", 404);
    const img = await loadPrescription(p.storage_url);
    return new Response(new Uint8Array(img), {
      headers: { "Content-Type": p.content_type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline", "Content-Security-Policy": "default-src 'none'" },
    });
  } catch {
    return fail("server-error", 500);
  }
}
