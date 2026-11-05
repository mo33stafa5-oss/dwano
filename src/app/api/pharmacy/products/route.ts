import { z } from "zod";
import { normalizeAr } from "@/lib/search";
import { requirePharmacy } from "@/lib/server/auth";
import { q, q1 } from "@/lib/server/db";
import { blobConfigured, productImageUrl, readImageFile, storeProductImage } from "@/lib/server/files";
import { dbMissing, fail, handle, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(""),
  category: z.enum(["cosmetics", "skincare", "haircare", "personal_care"]),
  price: z.number().positive().max(1_000_000),
  quantity: z.number().int().min(0).max(100000),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requirePharmacy(req);
  if (!g.ok) return g.res;
  try {
    const rows = await q("SELECT id, name, description, category, price, quantity, is_active, image_url, updated_at FROM products WHERE pharmacy_id = $1 ORDER BY created_at DESC", [g.pharmacy.id]);
    return ok({ products: rows.map((r) => ({ id: r.id, name: r.name, description: r.description, category: r.category, price: r.price, quantity: r.quantity, isActive: r.is_active, imageUrl: productImageUrl(r.id, Boolean(r.image_url), r.updated_at), updatedAt: r.updated_at })) });
  } catch (e) {
    return handle(e);
  }
}

/** multipart: `data` (JSON) + optional `image`. Needs approved pharmacy + active subscription. */
export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requirePharmacy(req);
  if (!g.ok) return g.res;
  try {
    const form = await req.formData();
    let raw: unknown;
    try { raw = JSON.parse(String(form.get("data") ?? "")); } catch { return fail("invalid", 400); }
    const parsed = productSchema.safeParse(raw);
    if (!parsed.success) return fail("invalid", 400);
    const d = parsed.data;
    let imageUrl: string | null = null;
    const file = form.get("image");
    if (file && typeof file !== "string" && (file as File).size > 0) {
      if (!blobConfigured()) return fail("storage-not-configured", 503);
      const img = await readImageFile(file, 3 * 1024 * 1024);
      if ("error" in img) return fail(img.error, 400);
      imageUrl = await storeProductImage(g.pharmacy.id, img.buf, img.type);
    }
    const r = await q1(
      "INSERT INTO products (pharmacy_id, name, name_norm, description, category, price, quantity, is_active, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [g.pharmacy.id, d.name, normalizeAr(d.name), d.description, d.category, d.price, d.quantity, d.isActive, imageUrl]
    );
    return ok({ id: r!.id }, 201);
  } catch (e) {
    return handle(e);
  }
}
