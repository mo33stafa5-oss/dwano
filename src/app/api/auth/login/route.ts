import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { cookieOptions, COOKIE, hashPassword, makeSession, verifyPassword } from "@/lib/server/auth";
import { q1 } from "@/lib/server/db";
import { dbMissing, fail, handle, ok, parseJson } from "@/lib/server/http";

export const runtime = "nodejs";

const schema = z.object({ username: z.string().trim().min(1).max(60), password: z.string().min(1).max(200) });

const eq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(req: Request) {
  const missing = dbMissing();
  if (missing) return missing;
  const p = await parseJson(req, schema);
  if ("res" in p) return p.res;
  const { username, password } = p.data;
  try {
    // Bootstrap/primary admin comes from environment variables (ADMIN_USERNAME default "admin" + ADMIN_PASSWORD)
    const envUser = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD;
    let user = await q1("SELECT * FROM users WHERE lower(username) = lower($1)", [username]);
    if (envPass && username.toLowerCase() === envUser && (!user || user.role === "admin") && eq(password, envPass)) {
      user = user
        ? ((await q1("UPDATE users SET password_hash = $2, is_active = true WHERE id = $1 RETURNING *", [user.id, verifyPassword(password, user.password_hash) ? user.password_hash : hashPassword(password)])) as typeof user)
        : await q1("INSERT INTO users (username, password_hash, role, display_name) VALUES ($1,$2,'admin','مشرف دوانو') RETURNING *", [envUser, hashPassword(password)]);
    } else if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
      await new Promise((r) => setTimeout(r, 700)); // slow down guessing
      return fail("wrong-credentials", 401);
    }
    await q1("UPDATE users SET last_login_at = now() WHERE id = $1 RETURNING id", [user!.id]);
    const res = ok({ role: user!.role });
    res.cookies.set(COOKIE, makeSession(user!.id), cookieOptions);
    return res;
  } catch (e) {
    return handle(e);
  }
}
