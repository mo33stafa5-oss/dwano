import { requirePharmacy } from "@/lib/server/auth";
import { q } from "@/lib/server/db";
import { dbMissing, handle, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requirePharmacy(req);
  if (!g.ok) return g.res;
  try {
    const rows = await q("SELECT id, product_name, quantity, unit_price, customer_name, phone, address, notes, status, created_at FROM product_orders WHERE pharmacy_id = $1 ORDER BY created_at DESC LIMIT 300", [g.pharmacy.id]);
    return ok({ orders: rows.map((r) => ({ id: r.id, productName: r.product_name, quantity: r.quantity, unitPrice: r.unit_price, customerName: r.customer_name, phone: r.phone, address: r.address, notes: r.notes, status: r.status, createdAt: r.created_at })) });
  } catch (e) {
    return handle(e);
  }
}
