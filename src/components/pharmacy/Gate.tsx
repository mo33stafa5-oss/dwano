"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import RequireRole from "@/components/shared/RequireRole";
import { errMsg } from "@/lib/api";

/** Pharmacy page wrapper: login/role guard + a clear notice when the server refuses (not approved / subscription). */
export function PharmacyPage({ children }: { children: ReactNode }) {
  return <RequireRole role="pharmacy">{children}</RequireRole>;
}

export function GateNotice({ error }: { error?: string }) {
  if (error !== "subscription-required" && error !== "pharmacy-not-approved") return null;
  return (
    <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
      <Lock className="mt-0.5 size-4 shrink-0" />
      <span>
        {errMsg(error)} <span className="font-semibold">بياناتك محفوظة ولن تُحذف، وتعود الميزة فور التفعيل.</span>
      </span>
    </div>
  );
}
