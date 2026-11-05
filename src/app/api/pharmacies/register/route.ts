import { z } from "zod";
import { egPhone } from "@/lib/requests";
import { getArea, getDistrict } from "@/data/locations";
import { hashPassword } from "@/lib/server/auth";
import { tx } from "@/lib/server/db";
import { dbMissing, handle, ok, parseJson, fail } from "@/lib/server/http";
import { username } from "@/lib/server/pharmacies";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(3).max(120),
  owner: z.string().trim().min(3).max(100),
  phone: egPhone("الهاتف"),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  districtId: z.string().min(1).max(80),
  areaId: z.string().min(1).max(80),
  address: z.string().trim().min(6).max(200),
  hours: z.string().trim().min(3).max(80),
  username: z.string().trim().regex(username),
  password: z.string().min(8).max(100),
});

/** Public pharmacy sign-up: creates a PENDING pharmacy, its (inactive-until-approved) subscription row and a login. */
export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const d = p.data;
  const area = getArea(d.areaId);
  if (!getDistrict(d.districtId) || !area || area.districtId !== d.districtId) return fail("invalid-location");
  try {
    await tx(async (c) => {
      const ph = await c.query(
        `INSERT INTO pharmacies (name, owner_name, phone, whatsapp, email, district_id, area_id, address, hours, status, source)
         VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,'pending','registered') RETURNING id`,
        [d.name, d.owner, d.phone, d.email || null, d.districtId, d.areaId, d.address, d.hours]
      );
      const id = ph.rows[0].id;
      await c.query("INSERT INTO pharmacy_subscriptions (pharmacy_id) VALUES ($1)", [id]);
      await c.query("INSERT INTO users (username, password_hash, role, display_name, pharmacy_id) VALUES ($1,$2,'pharmacy',$3,$4)", [d.username, hashPassword(d.password), d.name, id]);
    });
    return ok({}, 201);
  } catch (e) {
    return handle(e);
  }
}
