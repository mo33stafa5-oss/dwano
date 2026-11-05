import { z } from "zod";
import { normalizeAr } from "@/lib/search";
import { requireRole } from "@/lib/server/auth";
import { q, q1 } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Warehouse: own medicine listings only (scoped by the logged-in warehouse id, never by a client-supplied id). */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["warehouse"]);
  if (!g.ok) return g.res;
  try {
    const rows = await q("SELECT id, name, strength, form, availability, updated_at FROM warehouse_medicines WHERE warehouse_id = $1 ORDER BY updated_at DESC LIMIT 1000", [g.user.warehouseId]);
    return ok({ medicines: rows.map((r) => ({ id: r.id, name: r.name, strength: r.strength, form: r.form, availability: r.availability, updatedAt: r.updated_at })) });
  } catch (e) {
    return handle(e);
  }
}

const medSchema = z.object({
  name: z.string().trim().min(2).max(120),
  strength: z.string().trim().max(60).default(""),
  form: z.string().trim().max(60).default(""),
  availability: z.enum(["available", "limited", "out"]).default("available"),
});

export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["warehouse"]);
  if (!g.ok) return g.res;
  const p = await parseJson(req, medSchema);
  if ("res" in p) return p.res;
  const d = p.data;
  try {
    const w = await q1("SELECT status FROM warehouses WHERE id = $1", [g.user.warehouseId]);
    if (w?.status !== "active") return fail("warehouse-not-active", 403, { warehouseStatus: w?.status });
    const r = await q1(
      "INSERT INTO warehouse_medicines (warehouse_id, name, name_norm, strength, form, availability) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [g.user.warehouseId, d.name, normalizeAr(d.name), d.strength, d.form, d.availability]
    );
    return ok({ id: r!.id }, 201);
  } catch (e) {
    return handle(e);
  }
}
