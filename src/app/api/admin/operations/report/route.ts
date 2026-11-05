import { requireRole } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { dbMissing, handle, ok } from "@/lib/server/http";
import { round2 } from "@/lib/server/ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** period = daily (last 30 days) | weekly (last 12 weeks) | monthly (last 12 months); by=pharmacy adds a per-pharmacy breakdown. */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const sp = new URL(req.url).searchParams;
  const period = ({ daily: "day", weekly: "week", monthly: "month" } as Record<string, string>)[sp.get("period") ?? "daily"] ?? "day";
  const span = period === "day" ? "30 days" : period === "week" ? "84 days" : "366 days";
  const byPharmacy = sp.get("by") === "pharmacy";
  try {
    const rows = await q(
      `SELECT date_trunc('${period}', t.tx_date)::date AS bucket ${byPharmacy ? ", p.name AS pharmacy" : ""},
              count(*)::int AS transactions,
              count(*) FILTER (WHERE t.status='fulfilled')::int AS fulfilled,
              count(*) FILTER (WHERE t.status='partial')::int AS partial,
              count(*) FILTER (WHERE t.status='pending')::int AS pending,
              count(*) FILTER (WHERE t.status='cancelled')::int AS cancelled,
              COALESCE(sum(v.value) FILTER (WHERE t.status <> 'cancelled'),0) AS value,
              COALESCE(sum(v.outstanding) FILTER (WHERE t.status <> 'cancelled'),0)::int AS outstanding
         FROM ops_transactions t JOIN pharmacies p ON p.id = t.pharmacy_id
         LEFT JOIN LATERAL (SELECT sum(fulfilled_qty*unit_price) AS value, sum(requested_qty-fulfilled_qty) AS outstanding FROM ops_items i WHERE i.transaction_id = t.id) v ON true
        WHERE t.tx_date >= CURRENT_DATE - interval '${span}'
        GROUP BY 1 ${byPharmacy ? ", 2" : ""} ORDER BY 1 DESC ${byPharmacy ? ", 2" : ""} LIMIT 500`
    );
    return ok({ period, rows: rows.map((r) => ({ ...r, value: round2(Number(r.value)) })) });
  } catch (e) {
    return handle(e);
  }
}
