import { COOKIE, cookieOptions } from "@/lib/server/auth";
import { ok } from "@/lib/server/http";

export async function POST() {
  const res = ok();
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
