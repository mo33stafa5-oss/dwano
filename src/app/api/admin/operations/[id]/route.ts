
import { z } from "zod";
import { requireRole } from "@/lib/server/auth";
import { tx } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";
import { deriveStatus, itemSchema, loadTx, replaceItems } from "@/lib/server/ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuid = z.string().uuid();

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const missing = dbMissing();
  if (missing) return missing;

  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;

  const { id } = await ctx.params;

  if (!uuid.safeParse(id).success) {
    return fail("not-found", 404);
  }

  try {
    const out = await tx((c) => loadTx(c, id));

    return out
      ? ok({ transaction: out })
      : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}

const patchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().trim().max(500).optional(),
  cancelled: z.boolean().optional(),
  items: z.array(itemSchema).min(1).max(100).optional(),
});

/**
 * Edit a transaction.
 * The before/after snapshot is written to the audit trail
 * in the same database transaction.
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const missing = dbMissing();
  if (missing) return missing;

  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;

  const { id } = await ctx.params;

  if (!uuid.safeParse(id).success) {
    return fail("not-found", 404);
  }

  const p = await parseJson(req, patchSchema);
  if ("res" in p) return p.res;

  const d = p.data;

  try {
    const out = await tx(async (c) => {
      await c.query(
        "SELECT id FROM ops_transactions WHERE id = $1 FOR UPDATE",
        [id]
      );

      const before = await loadTx(c, id);

      if (!before) {
        return null;
      }

      // Normalize optional numeric fields before processing.
      const items = (
        d.items ??
        before.items.map((i) => ({
          productName: i.productName,
          requestedQty: i.requestedQty,
          fulfilledQty: i.fulfilledQty,
          unitPrice: i.unitPrice,
        }))
      ).map((item) => ({
        ...item,
        fulfilledQty: item.fulfilledQty ?? 0,
        unitPrice: item.unitPrice ?? 0,
      }));

      const cancelled =
        d.cancelled ?? (before.status === "cancelled");

      // Replace items only when explicitly provided.
      if (d.items) {
        await replaceItems(c, id, items);
      }

      await c.query(
        `UPDATE ops_transactions
         SET
           tx_date = COALESCE($2, tx_date),
           notes = COALESCE($3, notes),
           status = $4,
           updated_at = now()
         WHERE id = $1`,
        [
          id,
          d.date ?? null,
          d.notes ?? null,
          deriveStatus(items, cancelled),
        ]
      );

      const after = await loadTx(c, id);

      const action =
        d.cancelled === true && before.status !== "cancelled"
          ? "cancel"
          : "update";

      await c.query(
        `INSERT INTO ops_audit
          (transaction_id, actor_id, action, before_data, after_data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          g.user.id,
          action,
          JSON.stringify(before),
          JSON.stringify(after),
        ]
      );

      return after;
    });

    return out
      ? ok({ transaction: out })
      : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}
