import { z } from "zod";
import { requirePharmacy } from "@/lib/server/auth";
import { tx } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";

const schema = z.object({ status: z.enum(["confirmed", "delivered", "cancelled"]) });
const ALLOWED: Record<string, string[]> = { new: ["confirmed", "cancelled"], confirmed: ["delivered", "cancelled"], delivered: [], cancelled: [] };

/** Status change on an own order. Confirming reserves stock; cancelling a confirmed order returns it. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requirePharmacy(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const next = p.data.status;
  try {
    const res = await tx(async (c) => {
      const r = await c.query("SELECT status, product_id, quantity FROM product_orders WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE", [id, g.pharmacy.id]);
      const o = r.rows[0];
      if (!o) return "not-found" as const;
      if (!ALLOWED[o.status]?.includes(next)) return "invalid-transition" as const;
      if (next === "confirmed") {
        const u = await c.query("UPDATE products SET quantity = quantity - $2, updated_at = now() WHERE id = $1 AND pharmacy_id = $3 AND quantity >= $2", [o.product_id, o.quantity, g.pharmacy.id]);
        if (u.rowCount === 0) return "insufficient-stock" as const;
      }
      if (next === "cancelled" && o.status === "confirmed") {
        await c.query("UPDATE products SET quantity = quantity + $2, updated_at = now() WHERE id = $1 AND pharmacy_id = $3", [o.product_id, o.quantity, g.pharmacy.id]);
      }
      await c.query("UPDATE product_orders SET status = $2 WHERE id = $1", [id, next]);
      return "ok" as const;
    });
    if (res === "ok") return ok();
    return fail(res, res === "not-found" ? 404 : 409);
  } catch (e) {
    return handle(e);
  }
}
