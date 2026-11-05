import { requirePharmacy } from "@/lib/server/auth";
import { q, q1 } from "@/lib/server/db";
import { dbMissing, handle, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pharmacy: own subscription status and payment history. Works even when suspended/expired (so it can see why). */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requirePharmacy(req, false);
  if (!g.ok) return g.res;
  try {
    const s = await q1("SELECT monthly_amount, start_date, end_date FROM pharmacy_subscriptions WHERE pharmacy_id = $1", [g.pharmacy.id]);
    const payments = await q("SELECT id, amount, paid_at, period_start, period_end, method FROM subscription_payments WHERE pharmacy_id = $1 ORDER BY paid_at DESC LIMIT 36", [g.pharmacy.id]);
    return ok({ pharmacy: { name: g.pharmacy.name, status: g.pharmacy.status }, state: g.sub, amount: s?.monthly_amount ?? 0, startDate: s?.start_date ?? null, endDate: s?.end_date ?? null, payments });
  } catch (e) {
    return handle(e);
  }
}
