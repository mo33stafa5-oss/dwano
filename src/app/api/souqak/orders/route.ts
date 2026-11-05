import { randomBytes } from "node:crypto";
import { z } from "zod";
import { egPhone } from "@/lib/requests";
import { cairoToday, q1, tx } from "@/lib/server/db";
import { clientIpHash, dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";

const schema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  customerName: z.string().trim().min(2).max(100),
  phone: egPhone("الهاتف"),
  address: z.string().trim().min(3).max(250),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Public: customers order without an account (no online payment). Price is taken from the DB, never from the client. */
export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const d = p.data;
  const ip = clientIpHash(req);
  try {
    const recent = await q1("SELECT count(*)::int AS n FROM product_orders WHERE ip_hash = $1 AND created_at > now() - interval '10 minutes'", [ip]);
    if ((recent?.n ?? 0) >= 8) return fail("rate-limited", 429);
    const today = cairoToday();
    const id = `SQ-${randomBytes(4).toString("hex").toUpperCase()}`;
    const res = await tx(async (c) => {
      const r = await c.query(
        `SELECT p.id, p.name, p.price, p.quantity, p.pharmacy_id FROM products p
           JOIN pharmacies ph ON ph.id = p.pharmacy_id JOIN pharmacy_subscriptions s ON s.pharmacy_id = ph.id
          WHERE p.id = $1 AND p.is_active AND ph.status = 'active' AND s.status = 'active' AND s.end_date >= $2 AND (s.start_date IS NULL OR s.start_date <= $2)`,
        [d.productId, today]
      );
      const prod = r.rows[0];
      if (!prod) return "unavailable" as const;
      if (prod.quantity < d.quantity) return "insufficient-stock" as const;
      await c.query(
        `INSERT INTO product_orders (id, product_id, pharmacy_id, product_name, quantity, unit_price, customer_name, phone, address, notes, ip_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, prod.id, prod.pharmacy_id, prod.name, d.quantity, prod.price, d.customerName, d.phone, d.address, d.notes || null, ip]
      );
      return "ok" as const;
    });
    if (res !== "ok") return fail(res, 409);
    return ok({ id }, 201);
  } catch (e) {
    return handle(e);
  }
}
