import { NextResponse } from "next/server";
import { z } from "zod";
import { requestSchema } from "@/lib/requests";
import { kv, kvConfigured, REQUESTS_KEY } from "@/lib/server/kv";

export const runtime = "nodejs";

/**
 * Receives a medicine request and emails it to the Dwano team via Resend (https://resend.com).
 * Required env vars (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY        your Resend API key
 * Optional:
 *   REQUEST_NOTIFY_EMAIL  recipient (default: jesse121973@gmail.com)
 *   REQUEST_FROM_EMAIL    sender (default: "Dwano <onboarding@resend.dev>")
 * Also stores the request in Upstash/Vercel KV when configured (see lib/server/kv.ts) so the admin dashboard can list it.
 * If neither email nor storage is configured, this route answers 503 and the website tells the user the request was only saved locally.
 */
const DEFAULT_TO = "jesse121973@gmail.com";

const bodySchema = z.object({
  id: z.string().min(4).max(40),
  createdAt: z.string().max(40),
  medicine: z.object({ id: z.string().max(80).optional(), name: z.string().trim().min(1).max(120) }),
  customer: z.object({ fullName: z.string(), email: z.string(), phone: z.string(), whatsapp: z.string(), }),
  location: z.object({
    governorate: z.object({ id: z.string().max(80), name: z.string().max(80) }),
    district: z.object({ id: z.string().max(80), name: z.string().max(80) }).optional(),
    area: z.object({ id: z.string().max(80), name: z.string().max(80) }).optional(),
    address: z.string().max(200).optional(),
    coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracyM: z.number().optional(), capturedAt: z.string() }).optional(),
  }),
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  const r = parsed.data;
  const customer = requestSchema.safeParse({ ...r.customer, address: r.location.address });
  if (!customer.success) return NextResponse.json({ ok: false, error: "invalid-customer" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  if (!key && !kvConfigured) return NextResponse.json({ ok: false, error: "not-configured" }, { status: 503 });

  const c = customer.data;
  const loc = r.location;
  const where = [loc.governorate.name, loc.district?.name, loc.area?.name].filter(Boolean).join(" - ");
  const map = loc.coordinates ? `https://www.google.com/maps?q=${loc.coordinates.lat},${loc.coordinates.lng}` : "";
  const rows: [string, string][] = [
    ["رقم الطلب", r.id],
    ["الدواء", r.medicine.name],
    ["الاسم", c.fullName],
    ["الإيميل", c.email],
    ["الهاتف", c.phone],
    ["واتساب", c.whatsapp],
    ["المنطقة", where],
    ["العنوان", loc.address ?? "—"],
    ["الموقع (GPS)", loc.coordinates ? `${loc.coordinates.lat.toFixed(5)}, ${loc.coordinates.lng.toFixed(5)}${map ? ` — ${map}` : ""}` : "لم يشارك"],
    ["وقت الطلب", r.createdAt],
  ];
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px">
<h2 style="color:#075E57">طلب دواء جديد على دوانو</h2>
<table style="width:100%;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #e5eaef;color:#64748B;width:120px">${esc(k)}</td><td style="padding:8px;border-bottom:1px solid #e5eaef;font-weight:bold">${esc(v)}</td></tr>`)
    .join("")}</table>
<p style="color:#64748B;font-size:12px">رسالة تلقائية من موقع دوانو (نسخة تجريبية).</p></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  // 1) store (so the admin dashboard can show it from any device)
  let stored = false;
  if (kvConfigured) {
    try {
      const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
      const rl = `dwano:rl:${ip}`;
      const hits = await kv<number>("INCR", rl);
      if (hits === 1) await kv("EXPIRE", rl, 600);
      if (hits > 8) return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
      await kv("LPUSH", REQUESTS_KEY, JSON.stringify({ ...r, customer: { fullName: c.fullName, email: c.email, phone: c.phone, whatsapp: c.whatsapp }, status: "submitted", receivedAt: new Date().toISOString() }));
      await kv("LTRIM", REQUESTS_KEY, 0, 499);
      stored = true;
    } catch {
      stored = false;
    }
  }

  // 2) email the team
  let emailed = false;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.REQUEST_FROM_EMAIL || "Dwano <onboarding@resend.dev>",
          to: [process.env.REQUEST_NOTIFY_EMAIL || DEFAULT_TO],
          reply_to: c.email,
          subject: `طلب دواء جديد: ${r.medicine.name} (${r.id})`,
          html,
          text,
        }),
      });
      emailed = res.ok;
    } catch {
      emailed = false;
    }
  }

  if (!stored && !emailed) return NextResponse.json({ ok: false, error: "delivery-failed" }, { status: 502 });
  return NextResponse.json({ ok: true, stored, emailed });
}
