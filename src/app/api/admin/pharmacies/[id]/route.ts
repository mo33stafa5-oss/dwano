import { z } from "zod";
import { hashPassword, requireRole } from "@/lib/server/auth";
import { tx } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["pending", "active", "suspended", "rejected"]).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
  newPassword: z.string().min(8).max(100).optional(),
});

/** Admin: approve/reject/suspend a pharmacy, edit basics, reset its password. Records are never deleted. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const d = p.data;
  try {
    const found = await tx(async (c) => {
      const r = await c.query(
        `UPDATE pharmacies SET status = COALESCE($2, status), name = COALESCE($3, name), phone = COALESCE($4, phone), address = COALESCE($5, address), updated_at = now()
         WHERE id = $1 RETURNING id`,
        [id, d.status ?? null, d.name ?? null, d.phone ?? null, d.address ?? null]
      );
      if (r.rowCount === 0) return false;
      if (d.newPassword) await c.query("UPDATE users SET password_hash = $2 WHERE pharmacy_id = $1", [id, hashPassword(d.newPassword)]);
      return true;
    });
    return found ? ok() : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}
