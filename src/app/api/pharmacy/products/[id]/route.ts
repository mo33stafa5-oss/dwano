import { z } from "zod";
import { normalizeAr } from "@/lib/search";
import { requirePharmacy } from "@/lib/server/auth";
import { q1 } from "@/lib/server/db";
import { blobConfigured, productImageUrl, readImageFile, storeProductImage } from "@/lib/server/files";
import { dbMissing, fail, handle, ok } from "@/lib/server/http";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(["cosmetics", "skincare", "haircare", "personal_care"]).optional(),
  price: z.number().positive().max(1_000_000).optional(),
  quantity: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
});

/** Edit / (de)activate own product. multipart (`data` + optional `image`) or JSON. Ownership enforced in WHERE. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requirePharmacy(req);
  if (!g.ok) return g.res;
  const { id } = await ctx.params;
  try {
    let raw: unknown;
    let file: unknown = null;
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      try { raw = JSON.parse(String(form.get("data") ?? "{}")); } catch { return fail("invalid", 400); }
      file = form.get("image");
    } else {
      raw = await req.json().catch(() => null);
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return fail("invalid", 400);
    const d = parsed.data;
    let imageUrl: string | null = null;
    if (file && typeof file !== "string" && (file as File).size > 0) {
      if (!blobConfigured()) return fail("storage-not-configured", 503);
      const img = await readImageFile(file, 3 * 1024 * 1024);
      if ("error" in img) return fail(img.error, 400);
      imageUrl = await storeProductImage(g.pharmacy.id, img.buf, img.type);
    }
    const r = await q1(
      `UPDATE products SET name = COALESCE($3,name), name_norm = COALESCE($4,name_norm), description = COALESCE($5,description), category = COALESCE($6,category),
              price = COALESCE($7,price), quantity = COALESCE($8,quantity), is_active = COALESCE($9,is_active), image_url = COALESCE($10,image_url), updated_at = now()
        WHERE id = $1 AND pharmacy_id = $2 RETURNING id`,
      [id, g.pharmacy.id, d.name ?? null, d.name ? normalizeAr(d.name) : null, d.description ?? null, d.category ?? null, d.price ?? null, d.quantity ?? null, d.isActive ?? null, imageUrl]
    );
    return r ? ok() : fail("not-found", 404);
  } catch (e) {
    return handle(e);
  }
}
