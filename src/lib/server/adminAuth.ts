import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE = "dwano_admin";
const MAX_AGE_S = 60 * 60 * 24 * 7;

export const adminConfigured = Boolean(process.env.ADMIN_PASSWORD);
const secret = () => process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function safeEq(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  // compare hashes so length differences do not leak
  return safeEq(sign(`pw:${input}`), sign(`pw:${real}`));
}

export function makeToken() {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token?: string) {
  if (!token || !adminConfigured) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEq(sig, sign(exp));
}

export const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_S };

export function isAdminRequest(req: Request) {
  const m = /(?:^|;\s*)dwano_admin=([^;]+)/.exec(req.headers.get("cookie") ?? "");
  return verifyToken(m ? decodeURIComponent(m[1]) : undefined);
}
