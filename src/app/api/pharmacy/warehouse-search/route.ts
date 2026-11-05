import { normalizeAr } from "@/lib/search";
import { requirePharmacy } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { dbMissing, fail, handle, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pharmacy (approved + active subscription): find ACTIVE warehouses that list a medicine. */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requirePharmacy(req);
  if (!g.ok) return g.res;
  const term = normalizeAr(new URL(req.url).searchParams.get("q") ?? "").slice(0, 80);
  if (term.length < 2) return fail("query-too-short", 400);
  try {
    const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const rows = await q(
      `SELECT m.id, m.name, m.strength, m.form, m.availability, m.updated_at, (m.updated_at < now() - interval '72 hours') AS stale,
              w.id AS warehouse_id, w.name AS warehouse_name, w.phone, w.whatsapp, w.address, w.governorate
         FROM warehouse_medicines m JOIN warehouses w ON w.id = m.warehouse_id
        WHERE w.status = 'active' AND m.name_norm ILIKE $1
        ORDER BY (m.availability = 'available') DESC, m.updated_at DESC LIMIT 100`,
      [like]
    );
    return ok({
      results: rows.map((r) => ({
        id: r.id,
        name: r.name,
        strength: r.strength,
        form: r.form,
        // stock older than 72h is never shown as available
        availability: r.stale ? "unconfirmed" : r.availability,
        updatedAt: r.updated_at,
        warehouse: { id: r.warehouse_id, name: r.warehouse_name, phone: r.phone, whatsapp: r.whatsapp, address: r.address, governorate: r.governorate },
      })),
    });
  } catch (e) {
    return handle(e);
  }
}
