import { z } from "zod";
import { requireRole } from "@/lib/server/auth";
import { q, tx } from "@/lib/server/db";
import { dbMissing, handle, ok, parseJson } from "@/lib/server/http";
import { deriveStatus, itemSchema, loadTx, replaceItems, round2, shapeTx } from "@/lib/server/ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Admin only. Filter by pharmacy / date range / status. Returns rows + KPIs for the same filter. */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const sp = new URL(req.url).searchParams;
  const params: unknown[] = [];
  const w: string[] = [];
  const pharmacy = sp.get("pharmacyId");
  if (pharmacy && z.string().uuid().safeParse(pharmacy).success) { params.push(pharmacy); w.push(`t.pharmacy_id = $${params.length}`); }
  const from = sp.get("from"), to = sp.get("to"), st = sp.get("status");
  if (from && date.safeParse(from).success) { params.push(from); w.push(`t.tx_date >= $${params.length}`); }
  if (to && date.safeParse(to).success) { params.push(to); w.push(`t.tx_date <= $${params.length}`); }
  if (st && ["pending", "partial", "fulfilled", "cancelled"].includes(st)) { params.push(st); w.push(`t.status = $${params.length}`); }
  const where = w.length ? `WHERE ${w.join(" AND ")}` : "";
  try {
    const txs = await q(`SELECT t.*, p.name AS pharmacy_name FROM ops_transactions t JOIN pharmacies p ON p.id = t.pharmacy_id ${where} ORDER BY t.tx_date DESC, t.created_at DESC LIMIT 300`, params);
    const ids = txs.map((t) => t.id);
    const items = ids.length ? await q("SELECT * FROM ops_items WHERE transaction_id = ANY($1::uuid[]) ORDER BY product_name", [ids]) : [];
    const shaped = txs.map((t) => shapeTx(t, items.filter((i) => i.transaction_id === t.id)));
    const kpi = await q(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE t.status='fulfilled')::int AS fulfilled,
              count(*) FILTER (WHERE t.status='partial')::int AS partial,
              count(*) FILTER (WHERE t.status='pending')::int AS pending,
              count(*) FILTER (WHERE t.status='cancelled')::int AS cancelled,
              COALESCE(sum(v.value) FILTER (WHERE t.status <> 'cancelled'),0) AS value,
              COALESCE(sum(v.outstanding) FILTER (WHERE t.status <> 'cancelled'),0)::int AS outstanding
         FROM ops_transactions t
         LEFT JOIN LATERAL (SELECT sum(fulfilled_qty*unit_price) AS value, sum(requested_qty-fulfilled_qty) AS outstanding FROM ops_items i WHERE i.transaction_id = t.id) v ON true
         ${where}`,
      params
    );
    const k = kpi[0];
    return ok({ transactions: shaped, kpis: { ...k, value: round2(Number(k.value)) } });
  } catch (e) {
    return handle(e);
  }
}

const createSchema = z.object({
  pharmacyId: z.string().uuid(),
  date,
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  cancelled: z.boolean().default(false),
  items: z.array(itemSchema).min(1).max(100),
});

export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const p = await parseJson(req, createSchema);
  if ("res" in p) return p.res;
  const d = p.data;
  try {
    const out = await tx(async (c) => {
      const r = await c.query("INSERT INTO ops_transactions (pharmacy_id, tx_date, status, notes, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id", [d.pharmacyId, d.date, deriveStatus(d.items, d.cancelled), d.notes || null, g.user.id]);
      const id = r.rows[0].id as string;
      await replaceItems(c, id, d.items);
      const after = await loadTx(c, id);
      await c.query("INSERT INTO ops_audit (transaction_id, actor_id, action, after_data) VALUES ($1,$2,'create',$3)", [id, g.user.id, JSON.stringify(after)]);
      return after;
    });
    return ok({ transaction: out }, 201);
  } catch (e) {
    return handle(e);
  }
}
