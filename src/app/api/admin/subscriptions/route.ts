import { requireRole } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { dbMissing, handle, ok } from "@/lib/server/http";
import { listPharmacies } from "@/lib/server/pharmacies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: subscription dashboard (paid/unpaid/active/expired counts), pharmacy rows and payment history. */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  try {
    const rows = (await listPharmacies()).filter((p) => p.source === "registered" || p.subscription.state !== "pending" || p.subscription.endDate);
    const count = (s: string) => rows.filter((r) => r.subscription.state === s).length;
    const payments = await q(
      `SELECT x.id, x.amount, x.paid_at, x.period_start, x.period_end, x.method, x.note, p.name AS pharmacy_name, p.id AS pharmacy_id
         FROM subscription_payments x JOIN pharmacies p ON p.id = x.pharmacy_id ORDER BY x.paid_at DESC, x.created_at DESC LIMIT 200`
    );
    const summary = { total: rows.length, active: count("active"), pending: count("pending"), expired: count("expired"), suspended: count("suspended"), paid: count("active"), unpaid: rows.length - count("active") };
    return ok({ summary, pharmacies: rows, payments });
  } catch (e) {
    return handle(e);
  }
}
