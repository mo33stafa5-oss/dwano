import { currentUser } from "@/lib/server/auth";
import { cairoToday, dbConfigured, q1 } from "@/lib/server/db";
import { fail, handle, ok } from "@/lib/server/http";
import { effectiveSub } from "@/lib/server/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!dbConfigured) return fail("db-not-configured", 503);
  try {
    const user = await currentUser(req);
    if (!user) return fail("unauthorized", 401);
    let pharmacy = null;
    let warehouse = null;
    if (user.pharmacyId) {
      const p = await q1("SELECT id, name, status FROM pharmacies WHERE id = $1", [user.pharmacyId]);
const s = (await q1("SELECT status, start_date, end_date FROM pharmacy_subscriptions WHERE pharmacy_id = $1", [user.pharmacyId])) as {
  status: string;
  start_date: string | null;
  end_date: string | null;
} | null;    }
    if (user.warehouseId) {
      const w = await q1("SELECT id, name, phone, whatsapp, address, status FROM warehouses WHERE id = $1", [user.warehouseId]);
      warehouse = w;
    }
    return ok({ user: { username: user.username, role: user.role, displayName: user.displayName }, pharmacy, warehouse });
  } catch (e) {
    return handle(e);
  }
}
