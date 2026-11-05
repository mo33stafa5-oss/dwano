import { z } from "zod";
import type { PoolClient } from "pg";
import type { Row } from "./db";

export const itemSchema = z
  .object({
    productName: z.string().trim().min(1).max(160),
    requestedQty: z.number().int().min(1).max(1_000_000),
    fulfilledQty: z.number().int().min(0).max(1_000_000).default(0),
    unitPrice: z.number().min(0).max(1_000_000).default(0),
    notes: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .refine((i) => i.fulfilledQty <= i.requestedQty, { message: "fulfilled>requested" });

export type OpsItem = z.infer<typeof itemSchema>;

/** Status is derived from quantities; `cancelled` is an explicit override. */
export function deriveStatus(items: { requestedQty: number; fulfilledQty: number }[], cancelled: boolean) {
  if (cancelled) return "cancelled";
  const req = items.reduce((s, i) => s + i.requestedQty, 0);
  const ful = items.reduce((s, i) => s + i.fulfilledQty, 0);
  if (ful === 0) return "pending";
  return ful >= req && items.every((i) => i.fulfilledQty === i.requestedQty) ? "fulfilled" : "partial";
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function shapeTx(t: Row, items: Row[]) {
  const mapped = items.map((i) => ({
    id: i.id, productName: i.product_name, requestedQty: i.requested_qty, fulfilledQty: i.fulfilled_qty, unitPrice: i.unit_price, notes: i.notes,
    remainingQty: i.requested_qty - i.fulfilled_qty, total: round2(i.fulfilled_qty * i.unit_price),
  }));
  return {
    id: t.id, pharmacyId: t.pharmacy_id, pharmacyName: t.pharmacy_name, date: t.tx_date, status: t.status, notes: t.notes, createdAt: t.created_at,
    items: mapped,
    requestedQty: mapped.reduce((s, i) => s + i.requestedQty, 0),
    fulfilledQty: mapped.reduce((s, i) => s + i.fulfilledQty, 0),
    unfulfilledQty: t.status === "cancelled" ? mapped.reduce((s, i) => s + i.requestedQty, 0) : mapped.reduce((s, i) => s + i.remainingQty, 0),
    total: round2(mapped.reduce((s, i) => s + i.total, 0)),
  };
}

export async function replaceItems(c: PoolClient, txId: string, items: OpsItem[]) {
  await c.query("DELETE FROM ops_items WHERE transaction_id = $1", [txId]);
  for (const i of items) {
    await c.query("INSERT INTO ops_items (transaction_id, product_name, requested_qty, fulfilled_qty, unit_price, notes) VALUES ($1,$2,$3,$4,$5,$6)", [txId, i.productName, i.requestedQty, i.fulfilledQty, i.unitPrice, i.notes || null]);
  }
}

export async function loadTx(c: Pick<PoolClient, "query">, id: string) {
  const t = await c.query("SELECT t.*, p.name AS pharmacy_name FROM ops_transactions t JOIN pharmacies p ON p.id = t.pharmacy_id WHERE t.id = $1", [id]);
  if (!t.rows[0]) return null;
  const items = await c.query("SELECT * FROM ops_items WHERE transaction_id = $1 ORDER BY product_name", [id]);
  return shapeTx(t.rows[0], items.rows);
}
