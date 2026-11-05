import { normalizeAr } from "@/lib/search";
import { cairoToday, q } from "@/lib/server/db";
import { dbMissing, handle, ok } from "@/lib/server/http";
import { productImageUrl } from "@/lib/server/files";
import { getArea, getDistrict } from "@/data/locations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATS = ["cosmetics", "skincare", "haircare", "personal_care"];

/** Public catalogue: only active products of approved pharmacies whose subscription is active. */
export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const sp = new URL(req.url).searchParams;
  const term = normalizeAr(sp.get("q") ?? "").slice(0, 80);
  const cat = sp.get("category") ?? "";
  try {
    const params: unknown[] = [cairoToday()];
    let where = `p.is_active AND p.quantity > 0 AND ph.status = 'active' AND s.status = 'active' AND s.end_date IS NOT NULL AND s.end_date >= $1 AND (s.start_date IS NULL OR s.start_date <= $1)`;
    if (term) { params.push(`%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`); where += ` AND p.name_norm ILIKE $${params.length}`; }
    if (CATS.includes(cat)) { params.push(cat); where += ` AND p.category = $${params.length}`; }
    const rows = await q(
      `SELECT p.id, p.name, p.description, p.category, p.price, p.quantity, p.image_url, p.updated_at, ph.id AS pharmacy_id, ph.name AS pharmacy_name,
              ph.phone, ph.district_id, ph.area_id
         FROM products p JOIN pharmacies ph ON ph.id = p.pharmacy_id JOIN pharmacy_subscriptions s ON s.pharmacy_id = ph.id
        WHERE ${where} ORDER BY p.created_at DESC LIMIT 200`,
      params
    );
    return ok({
      products: rows.map((r) => ({
        id: r.id, name: r.name, description: r.description, category: r.category, price: r.price, quantity: r.quantity, imageUrl: productImageUrl(r.id, Boolean(r.image_url), r.updated_at),
        pharmacy: { id: r.pharmacy_id, name: r.pharmacy_name, phone: r.phone, district: getDistrict(r.district_id ?? "")?.nameAr ?? "", area: getArea(r.area_id ?? "")?.nameAr ?? "" },
      })),
    });
  } catch (e) {
    return handle(e);
  }
}
