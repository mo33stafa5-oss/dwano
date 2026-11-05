import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { q1, type Row } from "./db";
import { fail } from "./http";
import { cairoToday } from "./db";
import { effectiveSub, type SubState } from "./subscription";

export const COOKIE = "dwano_session";
const MAX_AGE_S = 60 * 60 * 24 * 7;
export type Role = "admin" | "pharmacy" | "warehouse";

const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (s: string) => createHmac("sha256", secret()).update(s).digest("base64url");
const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// ───────────── passwords (scrypt, per-user salt) ─────────────
export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  return safeEq(scryptSync(pw, salt, 64).toString("hex"), hash);
}

// ───────────── session cookie (signed; user re-loaded from DB on every request) ─────────────
export function makeSession(uid: string) {
  const body = Buffer.from(JSON.stringify({ uid, exp: Date.now() + MAX_AGE_S * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}
export const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_S };

function readSession(req: Request): string | null {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(req.headers.get("cookie") ?? "");
  if (!m || !secret()) return null;
  const [body, sig] = decodeURIComponent(m[1]).split(".");
  if (!body || !sig || !safeEq(sig, sign(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { uid: string; exp: number };
    return p.exp > Date.now() ? p.uid : null;
  } catch {
    return null;
  }
}

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  displayName: string;
  pharmacyId: string | null;
  warehouseId: string | null;
}

export async function currentUser(req: Request): Promise<AuthUser | null> {
  const uid = readSession(req);
  if (!uid) return null;
  const r = await q1("SELECT id, username, role, display_name, pharmacy_id, warehouse_id FROM users WHERE id = $1 AND is_active", [uid]);
  return r ? { id: r.id, username: r.username, role: r.role, displayName: r.display_name ?? r.username, pharmacyId: r.pharmacy_id, warehouseId: r.warehouse_id } : null;
}

type Guard<T> = { ok: true } & T | { ok: false; res: NextResponse };

/** Role gate. Admin accounts are never subject to subscription logic. */
export async function requireRole(req: Request, roles: Role[]): Promise<Guard<{ user: AuthUser }>> {
  const user = await currentUser(req);
  if (!user) return { ok: false, res: fail("unauthorized", 401) };
  if (!roles.includes(user.role)) return { ok: false, res: fail("forbidden", 403) };
  return { ok: true, user };
}

export interface PharmacyCtx {
  user: AuthUser;
  pharmacy: Row;
  sub: SubState;
}

/**
 * Pharmacy gate. With `needSubscription` (default) the pharmacy must be approved AND have an active subscription:
 * the check is enforced here, on the server, for every protected endpoint.
 */
export async function requirePharmacy(req: Request, needSubscription = true): Promise<Guard<PharmacyCtx>> {
  const g = await requireRole(req, ["pharmacy"]);
  if (!g.ok) return g;
  const pharmacy = await q1("SELECT * FROM pharmacies WHERE id = $1", [g.user.pharmacyId]);
  if (!pharmacy) return { ok: false, res: fail("forbidden", 403) };
  const subRow = await q1("SELECT status, start_date, end_date FROM pharmacy_subscriptions WHERE pharmacy_id = $1", [pharmacy.id]);
  const sub = effectiveSub(subRow, cairoToday());
  if (needSubscription) {
    if (pharmacy.status !== "active") return { ok: false, res: fail("pharmacy-not-approved", 403, { pharmacyStatus: pharmacy.status }) };
    if (sub !== "active") return { ok: false, res: fail("subscription-required", 403, { subscription: sub }) };
  }
  return { ok: true, user: g.user, pharmacy, sub };
}
