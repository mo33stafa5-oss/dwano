import { z } from "zod";
import { egPhone } from "@/lib/requests";
import { hashPassword, requireRole } from "@/lib/server/auth";
import { tx } from "@/lib/server/db";
import { dbMissing, handle, ok, parseJson } from "@/lib/server/http";
import { listPharmacies, username } from "@/lib/server/pharmacies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const g = await requireRole(req, ["admin"]);
  if (!g.ok) return g.res;
  try {
    return ok({ pharmacies: await listPharmacies() });
  } catch (e) {
    return handle(e);
  }
}

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  owner: z.string().trim().max(100).optional(),
  phone: egPhone("الهاتف").optional().or(z.literal("")),
  districtId: z.string().max(80).optional(),
  areaId: z.string().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  // optional login for the pharmacy (admin-created)
  account: z.object({ username: z.string().trim().regex(username), password: z.string().min(8).max(100) }).optional(),
});

/** Admin: register a pharmacy by hand (used by the operations page and for onboarding). Created ACTIVE. */
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
      const ph = await c.query(
        `INSERT INTO pharmacies (name, owner_name, phone, district_id, area_id, address, status, source)
         VALUES ($1,$2,$3,$4,$5,$6,'active',$7) RETURNING id`,
        [d.name, d.owner || "—", d.phone || "—", d.districtId ?? null, d.areaId ?? null, d.address ?? null, d.account ? "registered" : "manual"]
      );
      const pid = ph.rows[0].id;
      await c.query("INSERT INTO pharmacy_subscriptions (pharmacy_id) VALUES ($1)", [pid]);
      if (d.account) await c.query("INSERT INTO users (username, password_hash, role, display_name, pharmacy_id) VALUES ($1,$2,'pharmacy',$3,$4)", [d.account.username, hashPassword(d.account.password), d.name, pid]);
      return pid as string;
    });
    return ok({ id }, 201);
  } catch (e) {
    return handle(e);
  }
}
