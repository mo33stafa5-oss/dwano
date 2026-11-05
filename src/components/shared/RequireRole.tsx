"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Loader2, Lock } from "lucide-react";
import { useMe } from "@/hooks/useMe";

type Role = "admin" | "pharmacy" | "warehouse";

/**
 * UI guard only: every API enforces the real permission on the server.
 * Shows a login prompt when signed out and a notice when the role is wrong.
 */
export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { me, loading } = useMe();
  const path = usePathname();
  if (loading)
    return (
      <div className="grid place-items-center py-24 text-brand">
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  if (!me?.user)
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-navy/[0.07] bg-white p-8 text-center shadow-soft">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-mint text-brand-deep">
          <Lock className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-black">تسجيل الدخول مطلوب</h2>
        <p className="mt-1 text-sm font-medium text-muted">سجّل الدخول بحسابك للوصول إلى هذه الصفحة.</p>
        <Link href={`/login?next=${encodeURIComponent(path)}`} className="btn-primary mt-5">
          تسجيل الدخول
        </Link>
      </div>
    );
  if (me.user.role !== role)
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-navy/[0.07] bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-black">هذه الصفحة غير متاحة لحسابك</h2>
        <p className="mt-1 text-sm font-medium text-muted">لا تملك صلاحية الوصول إلى هذه الصفحة.</p>
      </div>
    );
  return <>{children}</>;
}
