import { z } from "zod";
import { requireRole } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { dbMissing, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin only: list medicine requests (newest first). */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  try {
    const rows = await q(
      `SELECT r.*, (p.id IS NOT NULL) AS has_rx FROM medicine_requests r LEFT JOIN prescriptions p ON p.request_id = r.id ORDER BY r.created_at DESC LIMIT 300`
    );
    const requests = rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      medicine: { id: r.medicine_id ?? undefined, name: r.medicine_name },
      customer: { fullName: r.full_name, phone: r.phone, whatsapp: r.whatsapp },
      location: {
        governorate: { id: "gov-fayoum", name: r.governorate },
        district: r.district_id ? { id: r.district_id, name: r.district_name } : undefined,
        area: r.area_id ? { id: r.area_id, name: r.area_name } : undefined,
        address: r.address ?? undefined,
        coordinates: r.lat != null ? { lat: r.lat, lng: r.lng, accuracyM: r.accuracy_m ?? undefined, capturedAt: r.created_at } : undefined,
      },
      status: "submitted",
      seen: r.seen,
      workflow: r.status,
      hasPrescription: r.has_rx,
    }));
    return ok({ requests });
  } catch (e) {
    return handle(e);
  }
}

const patch = z.object({
  ids: z.array(z.string().max(40)).max(200).optional(),
  seen: z.boolean().optional(),
  id: z.string().max(40).optional(),
  workflow: z.enum(["new", "in_review", "contacted", "closed"]).optional(),
});

/** Admin only: mark as seen, or change the workflow status of one request. */
export async function PATCH(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const p = await parseJson(req, patch);
  if ("res" in p) return p.res;
  try {
    if (p.data.ids?.length && p.data.seen !== undefined) await q("UPDATE medicine_requests SET seen = $2 WHERE id = ANY($1::text[])", [p.data.ids, p.data.seen]);
    if (p.data.id && p.data.workflow) await q("UPDATE medicine_requests SET status = $2, seen = true WHERE id = $1", [p.data.id, p.data.workflow]);
    return ok();
  } catch (e) {
    return handle(e);
  }
}

