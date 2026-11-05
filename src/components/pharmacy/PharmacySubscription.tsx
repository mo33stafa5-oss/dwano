"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { money } from "@/components/souqak/shared";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PharmacyPage } from "./Gate";

export const SUB_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: "فعّال", cls: "bg-brand-mint text-brand-deep" },
  pending: { label: "بانتظار التفعيل", cls: "bg-sky-50 text-sky-700" },
  expired: { label: "منتهي", cls: "bg-amber-50 text-amber-700" },
  suspended: { label: "موقوف", cls: "bg-rose-50 text-rose-700" },
};

interface Data {
  pharmacy: { name: string; status: string };
  state: string;
  amount: number;
  startDate: string | null;
  endDate: string | null;
  payments: { id: string; amount: number; paid_at: string; period_start: string; period_end: string; method: string | null }[];
}

export default function PharmacySubscription() {
  return (
    <PharmacyPage>
      <Inner />
    </PharmacyPage>
  );
}

function Inner() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    api<Data>("/api/pharmacy/subscription").then((r) => (r.ok ? setD(r.data) : setErr(true)));
  }, []);
  if (err) return <p className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">تعذّر تحميل بيانات الاشتراك.</p>;
  if (!d) return <div className="skeleton h-48 !rounded-[1.5rem]" />;
  const s = SUB_LABEL[d.state] ?? SUB_LABEL.pending;
  return (
    <>
      <PageHeader title="اشتراكي" subtitle="حالة الاشتراك الشهري وسجل المدفوعات. التجديد يتم بالتنسيق مع إدارة دوانو." />
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-mint text-brand-deep"><CreditCard className="size-5" /></span>
            <div>
              <p className="font-black">{d.pharmacy.name}</p>
              <p className="text-xs font-semibold text-muted">القيمة الشهرية: {money(d.amount)}</p>
            </div>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-extrabold", s.cls)}>{s.label}</span>
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-bold text-muted">بداية الاشتراك</dt><dd className="font-extrabold">{d.startDate ?? "—"}</dd></div>
          <div><dt className="text-xs font-bold text-muted">نهاية الاشتراك</dt><dd className="font-extrabold">{d.endDate ?? "—"}</dd></div>
        </dl>
        {d.state !== "active" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">ميزات سوقك وبحث المخازن متوقفة حتى تفعيل الاشتراك. بياناتك ومنتجاتك محفوظة.</p>}
      </Panel>
      <Panel title="سجل المدفوعات" className="mt-5">
        {d.payments.length === 0 ? (
          <p className="text-sm font-medium text-muted">لا توجد مدفوعات مسجلة.</p>
        ) : (
          <ul className="divide-y divide-navy/5 text-sm">
            {d.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span className="font-extrabold">{money(p.amount)}</span>
                <span className="text-muted">عن الفترة {p.period_start} → {p.period_end}</span>
                <span className="text-xs font-semibold text-muted">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
