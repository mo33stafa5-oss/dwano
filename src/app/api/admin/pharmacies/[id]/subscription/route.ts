import { z } from "zod";
import { requireRole } from "@/lib/server/auth";
import { cairoToday, tx } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";
import { addDaysISO, addMonthsISO } from "@/lib/server/subscription";

export const runtime = "nodejs";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("configure"), monthlyAmount: z.number().min(0).max(1_000_000), startDate: date.optional(), endDate: date.optional() }),
  z.object({
    action: z.literal("payment"),
    amount: z.number().positive().max(1_000_000),
    paidAt: date.optional(),
    periodStart: date.optional(),
    periodEnd: date.optional(),
    method: z.string().trim().max(40).optional(),
    note: z.string().trim().max(300).optional(),
  }),
  z.object({ action: z.literal("suspend") }),
  z.object({ action: z.literal("activate") }),
]);

/**
 * Admin: manual subscription control. A payment extends the paid period by one month from the later of
 * (today, day after the current end date). Payments never reactivate a SUSPENDED pharmacy: the admin does that explicitly.
 * Suspension only blocks subscription-protected features; no data is deleted.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const d = p.data;
  try {
    const done = await tx(async (c) => {
      const ph = await c.query("SELECT id FROM pharmacies WHERE id = $1", [id]);
      if (ph.rowCount === 0) return false;
      await c.query("INSERT INTO pharmacy_subscriptions (pharmacy_id) VALUES ($1) ON CONFLICT (pharmacy_id) DO NOTHING", [id]);
      const sub = (await c.query("SELECT * FROM pharmacy_subscriptions WHERE pharmacy_id = $1 FOR UPDATE", [id])).rows[0];
      const today = cairoToday();
      if (d.action === "configure") {
        await c.query(
          "UPDATE pharmacy_subscriptions SET monthly_amount = $2, start_date = COALESCE($3, start_date), end_date = COALESCE($4, end_date), updated_at = now() WHERE pharmacy_id = $1",
          [id, d.monthlyAmount, d.startDate ?? null, d.endDate ?? null]
        );
      } else if (d.action === "payment") {
        const base = sub.end_date && sub.end_date >= today ? addDaysISO(sub.end_date, 1) : today;
        const pStart = d.periodStart ?? base;
        const pEnd = d.periodEnd ?? addDaysISO(addMonthsISO(pStart, 1), -1);
        if (pEnd < pStart) throw Object.assign(new Error("bad-period"), { code: "23514" });
        await c.query(
          "INSERT INTO subscription_payments (pharmacy_id, amount, paid_at, period_start, period_end, method, note, recorded_by) VALUES ($1,$2,COALESCE($3::date, CURRENT_DATE),$4,$5,$6,$7,$8)",
          [id, d.amount, d.paidAt ?? null, pStart, pEnd, d.method ?? null, d.note ?? null, g.user.id]
        );
        const continuing = sub.end_date && sub.end_date >= today && !d.periodStart ? (sub.start_date ?? pStart) : pStart;
        await c.query(
          "UPDATE pharmacy_subscriptions SET start_date = $2, end_date = $3, status = CASE WHEN status = 'suspended' THEN status ELSE 'active' END, updated_at = now() WHERE pharmacy_id = $1",
          [id, continuing, pEnd]
        );
      } else if (d.action === "suspend") {
        await c.query("UPDATE pharmacy_subscriptions SET status = 'suspended', updated_at = now() WHERE pharmacy_id = $1", [id]);
      } else {
        await c.query("UPDATE pharmacy_subscriptions SET status = 'active', updated_at = now() WHERE pharmacy_id = $1", [id]);
      }
      return true;
    });
    return done ? ok() : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}
