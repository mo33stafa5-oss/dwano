import { z } from "zod";
import { egPhone } from "@/lib/requests";
import { hashPassword, requireRole } from "@/lib/server/auth";
import { q, tx } from "@/lib/server/db";
import { dbMissing, handle, ok, parseJson } from "@/lib/server/http";
import { username } from "@/lib/server/pharmacies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  try {
    const rows = await q(
      `SELECT w.*, (SELECT username FROM users u WHERE u.warehouse_id = w.id LIMIT 1) AS username,
              (SELECT count(*) FROM warehouse_medicines m WHERE m.warehouse_id = w.id) AS medicines
         FROM warehouses w ORDER BY w.created_at DESC`
    );
    return ok({ warehouses: rows.map((w) => ({ id: w.id, name: w.name, phone: w.phone, whatsapp: w.whatsapp, address: w.address, governorate: w.governorate, status: w.status, username: w.username, medicines: w.medicines, createdAt: w.created_at })) });
  } catch (e) {
    return handle(e);
  }
}

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: egPhone("الهاتف"),
  whatsapp: egPhone("الواتساب").optional().or(z.literal("")),
  address: z.string().trim().min(3).max(200),
  governorate: z.string().trim().min(2).max(60).default("الفيوم"),
  status: z.enum(["pending", "active", "suspended"]).default("active"),
  username: z.string().trim().regex(username),
  password: z.string().min(8).max(100),
});

/** Admin: register a warehouse together with its login. */
export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const d = p.data;
  try {
    const id = await tx(async (c) => {
      const w = await c.query("INSERT INTO warehouses (name, phone, whatsapp, address, governorate, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [d.name, d.phone, d.whatsapp || null, d.address, d.governorate, d.status]);
      await c.query("INSERT INTO users (username, password_hash, role, display_name, warehouse_id) VALUES ($1,$2,'warehouse',$3,$4)", [d.username, hashPassword(d.password), d.name, w.rows[0].id]);
      return w.rows[0].id as string;
    });
    return ok({ id }, 201);
  } catch (e) {
    return handle(e);
  }
}
