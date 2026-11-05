import { z } from "zod";
import { q1 } from "@/lib/server/db";
import { loadProductImage } from "@/lib/server/files";
import { dbMissing, fail } from "@/lib/server/http";

export const runtime = "nodejs";

/**
 * Product pictures (non-sensitive) are stored in the private Blob store and streamed from here.
 * Only product images are reachable; prescriptions are never served by this route.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return fail("not-found", 404);
  try {
    const p = await q1("SELECT image_url FROM products WHERE id = $1 AND image_url IS NOT NULL", [id]);
    if (!p) return fail("not-found", 404);
    const f = await loadProductImage(p.image_url);
    if (!f) return fail("not-found", 404);
    return new Response(new Uint8Array(f.buf), { headers: { "Content-Type": f.contentType, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=3600" } });
  } catch {
    return fail("server-error", 500);
  }
}
