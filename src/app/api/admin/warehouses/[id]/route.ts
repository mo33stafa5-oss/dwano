import { z } from "zod";
import { egPhone } from "@/lib/requests";
import { hashPassword, requireRole } from "@/lib/server/auth";
import { tx } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: egPhone("الهاتف").optional(),
  whatsapp: egPhone("الواتساب").optional(),
  address: z.string().trim().min(3).max(200).optional(),
  governorate: z.string().trim().min(2).max(60).optional(),
  status: z.enum(["pending", "active", "suspended"]).optional(),
  newPassword: z.string().min(8).max(100).optional(),
});

/** Admin: edit, approve, activate or suspend a warehouse; reset its password. Data is kept. */
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
        `UPDATE warehouses SET name = COALESCE($2,name), phone = COALESCE($3,phone), whatsapp = COALESCE($4,whatsapp), address = COALESCE($5,address),
                governorate = COALESCE($6,governorate), status = COALESCE($7,status), updated_at = now() WHERE id = $1 RETURNING id`,
        [id, d.name ?? null, d.phone ?? null, d.whatsapp ?? null, d.address ?? null, d.governorate ?? null, d.status ?? null]
      );
      if (r.rowCount === 0) return false;
      if (d.newPassword) await c.query("UPDATE users SET password_hash = $2 WHERE warehouse_id = $1", [id, hashPassword(d.newPassword)]);
      return true;
    });
    return found ? ok() : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}
