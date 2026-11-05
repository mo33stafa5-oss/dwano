import { z } from "zod";
import { requestSchema } from "@/lib/requests";
import { PRESCRIPTION_MAX_BYTES } from "@/lib/requests";
import { getArea, getDistrict, governorates } from "@/data/locations";
import { q1, tx } from "@/lib/server/db";
import { clientIpHash, dbMissing, fail, handle, ok } from "@/lib/server/http";
import { prescriptionsEnabled, readImageFile, sha256, storePrescription } from "@/lib/server/files";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const bodySchema = z.object({
  medicine: z.object({ id: z.string().max(80).optional(), name: z.string().trim().min(1).max(120) }),
  customer: z.object({ fullName: z.string(), phone: z.string(), whatsapp: z.string() }),
  location: z.object({
    district: z.object({ id: z.string().max(80) }).optional(),
    area: z.object({ id: z.string().max(80) }).optional(),
    address: z.string().max(200).optional(),
    coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracyM: z.number().optional() }).optional(),
  }),
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Public: create a medicine request (+ optional prescription image). Stored in PostgreSQL. */
export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("invalid-body");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return fail("invalid-body");
  }
  const body = bodySchema.safeParse(raw);
  if (!body.success) return fail("invalid-body");
  const cust = requestSchema.safeParse({ ...body.data.customer, address: body.data.location.address });
  if (!cust.success) return fail("invalid-customer");

  const file = form.get("prescription");
  let image: { buf: Buffer; type: "image/jpeg" | "image/png" | "image/webp" } | null = null;
  if (file instanceof File && file.size > 0) {
    if (!prescriptionsEnabled()) return fail("prescriptions-not-configured", 503);
    const r = await readImageFile(file, PRESCRIPTION_MAX_BYTES);
    if ("error" in r) return fail(r.error, 400);
    image = r;
  }

  try {
    const ipHash = clientIpHash(req);
    const recent = await q1("SELECT count(*) AS n FROM medicine_requests WHERE ip_hash = $1 AND created_at > now() - interval '10 minutes'", [ipHash]);
    if ((recent?.n ?? 0) >= 8) return fail("rate-limited", 429);

    const id = `DW-${Date.now().toString(36).toUpperCase().slice(-5)}${randomBytes(3).toString("hex").toUpperCase()}`;
    const loc = body.data.location;
    // names come from our own location data, never from the client
    const district = loc.district ? getDistrict(loc.district.id) : undefined;
    const area = loc.area ? getArea(loc.area.id) : undefined;
    const c = cust.data;
    const url = image ? await storePrescription(id, image.buf) : null;

    await tx(async (db) => {
      await db.query(
        `INSERT INTO medicine_requests (id, medicine_id, medicine_name, full_name, phone, whatsapp, governorate, district_id, district_name, area_id, area_name, address, lat, lng, accuracy_m, ip_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [id, body.data.medicine.id ?? null, body.data.medicine.name, c.fullName, c.phone, c.whatsapp, governorates[0].nameAr, district?.id ?? null, district?.nameAr ?? null, area?.id ?? null, area?.shortAr ?? null, c.address ?? null, loc.coordinates?.lat ?? null, loc.coordinates?.lng ?? null, loc.coordinates?.accuracyM ? Math.round(loc.coordinates.accuracyM) : null, ipHash]
      );
      if (image && url) {
        await db.query("INSERT INTO prescriptions (request_id, storage_url, content_type, size_bytes, sha256) VALUES ($1,$2,$3,$4,$5)", [id, url, image.type, image.buf.length, sha256(image.buf)]);
      }
    });

    void notifyTeam({ id, medicine: body.data.medicine.name, name: c.fullName, phone: c.phone, whatsapp: c.whatsapp, where: [governorates[0].nameAr, district?.nameAr, area?.shortAr].filter(Boolean).join(" - "), address: c.address, gps: loc.coordinates, hasRx: Boolean(image) });
    return ok({ id, createdAt: new Date().toISOString() }, 201);
  } catch (e) {
    return handle(e);
  }
}

/** Optional heads-up email to the team (Resend). Contains NO prescription image and no private links. */
async function notifyTeam(r: { id: string; medicine: string; name: string; phone: string; whatsapp: string; where: string; address?: string; gps?: { lat: number; lng: number }; hasRx: boolean }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const rows: [string, string][] = [
    ["رقم الطلب", r.id],
    ["الدواء", r.medicine],
    ["الاسم", r.name],
    ["الهاتف", r.phone],
    ["واتساب", r.whatsapp],
    ["المنطقة", r.where],
    ["العنوان", r.address ?? "—"],
    ["GPS", r.gps ? `${r.gps.lat.toFixed(5)}, ${r.gps.lng.toFixed(5)}` : "لم يشارك"],
    ["روشتة", r.hasRx ? "مرفقة (تظهر في لوحة المشرف فقط)" : "لا"],
  ];
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px"><h2 style="color:#075E57">طلب دواء جديد على دوانو</h2><table style="width:100%;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #e5eaef;color:#64748B;width:110px">${esc(k)}</td><td style="padding:8px;border-bottom:1px solid #e5eaef;font-weight:bold">${esc(v)}</td></tr>`)
    .join("")}</table></div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.REQUEST_FROM_EMAIL || "Dwano <onboarding@resend.dev>",
        to: [process.env.REQUEST_NOTIFY_EMAIL || "jesse121973@gmail.com"],
        subject: `طلب دواء جديد: ${r.medicine} (${r.id})`,
        html,
      }),
    });
  } catch {
    /* email is best-effort */
  }
}

