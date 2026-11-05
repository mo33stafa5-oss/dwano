import { z } from "zod";
import { normalizeAr } from "@/lib/search";
import { requireRole } from "@/lib/server/auth";
import { q1 } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  strength: z.string().trim().max(60).optional(),
  form: z.string().trim().max(60).optional(),
  availability: z.enum(["available", "limited", "out"]).optional(),
});

async function guard(req: Request) {
  const g = await requireRole(req, ["warehouse"]);
  if (!g.ok) return g;
  const w = await q1("SELECT status FROM warehouses WHERE id = $1", [g.user.warehouseId]);
  if (w?.status !== "active") return { ok: false as const, res: fail("warehouse-not-active", 403) };
  return g;
}

/** Update a listing (ownership enforced in the WHERE clause). Every change refreshes `updated_at`. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await guard(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const d = p.data;
  try {
    const r = await q1(
      `UPDATE warehouse_medicines SET name = COALESCE($3,name), name_norm = COALESCE($4,name_norm), strength = COALESCE($5,strength), form = COALESCE($6,form),
              availability = COALESCE($7,availability), updated_at = now() WHERE id = $1 AND warehouse_id = $2 RETURNING id`,
      [id, g.user.warehouseId, d.name ?? null, d.name ? normalizeAr(d.name) : null, d.strength ?? null, d.form ?? null, d.availability ?? null]
    );
    return r ? ok() : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await guard(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  try {
    const r = await q1("DELETE FROM warehouse_medicines WHERE id = $1 AND warehouse_id = $2 RETURNING id", [id, g.user.warehouseId]);
    return r ? ok() : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}
