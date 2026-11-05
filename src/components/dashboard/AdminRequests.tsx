"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ExternalLink, FileImage, Lock, MapPin, MessageCircle, Phone } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "./ui";
import { useRequests } from "@/hooks/useRequests";
import { cn } from "@/lib/utils";

export default function AdminRequests() {
  const { requests, mode, markAllSeen, setWorkflow } = useRequests();
  // remember which ones were new when the page opened so they stay highlighted
  const newIds = useRef<Set<string> | null>(null);
  if (newIds.current === null && requests.length > 0) newIds.current = new Set(requests.filter((r) => !r.seen).map((r) => r.id));
  useEffect(() => {
    if (requests.some((r) => !r.seen)) {
      const t = setTimeout(markAllSeen, 1200);
      return () => clearTimeout(t);
    }
  }, [requests, markAllSeen]);

  return (
    <>
      <PageHeader
        title="طلبات الأدوية"
        subtitle="الطلبات المرسلة من نموذج «اطلب دواءك»."
      />
      {mode === "local" && (
        <div className="mb-5 rounded-2xl bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
          قاعدة البيانات غير مهيّأة على الخادم، لذلك تُعرض هنا الطلبات المحفوظة في <b>هذا المتصفح فقط</b>. اربط PostgreSQL (انظر README) لتصلك الطلبات من كل الأجهزة.
        </div>
      )}
      {mode === "loading" && <div className="skeleton h-40 !rounded-[1.5rem]" />}
      {mode === "locked" && (
        <div className="mx-auto max-w-sm rounded-[1.5rem] border border-navy/[0.07] bg-white p-6 text-center shadow-soft">
          <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-mint text-brand-deep"><Lock className="size-5" /></span>
          <h2 className="mt-4 text-lg font-black">دخول المشرف</h2>
          <p className="mt-1 text-xs font-medium text-muted">بيانات العملاء والروشتات محمية. سجّل الدخول بحساب الإدارة لعرض الطلبات.</p>
          <Link href="/login?next=/admin/requests" className="btn-primary mt-4 w-full">دخول</Link>
        </div>
      )}
      {(mode === "server" || mode === "local") && requests.length === 0 ? (
        <EmptyState title="لا توجد طلبات بعد" text="جرّب إرسال طلب من صفحة البحث وسيظهر هنا." />
      ) : (mode === "server" || mode === "local") && (
        <div className="space-y-4">
          {requests.map((r) => {
            const c = r.location.coordinates;
            return (
              <Panel key={r.id} className={cn(newIds.current?.has(r.id) && "ring-2 ring-brand/40")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">{r.medicine.name}</p>
                    <p dir="ltr" className="text-start font-mono text-xs font-bold text-muted">{r.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {newIds.current?.has(r.id) && <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-black text-white">جديد</span>}
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", r.status === "submitted" ? "bg-brand-mint text-brand-deep" : "bg-amber-50 text-amber-700")}>
                      {r.status === "submitted" ? "محفوظ في قاعدة البيانات" : "محفوظ محليًا فقط"}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="font-extrabold">{r.customer.fullName}</div>
                                  <div className="flex items-center gap-2 text-muted"><Phone className="size-4" /><span dir="ltr">{r.customer.phone}</span></div>
                  <div className="flex items-center gap-2 text-muted"><MessageCircle className="size-4" /><span dir="ltr">{r.customer.whatsapp}</span></div>
                  <div className="flex items-start gap-2 text-muted sm:col-span-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {[r.location.governorate.name, r.location.district?.name, r.location.area?.name].filter(Boolean).join(" - ")}
                      {r.location.address ? ` · ${r.location.address}` : ""}
                    </span>
                  </div>
                  {c && (
                    <a href={`https://www.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-extrabold text-brand sm:col-span-2">
                      <ExternalLink className="size-4" /> عرض موقع GPS على الخريطة
                    </a>
                  )}
                </dl>
                {r.hasPrescription && mode === "server" && (
                  <div className="mt-4 rounded-2xl border border-navy/10 bg-ice p-3">
                    <p className="mb-2 flex items-center gap-2 text-xs font-extrabold"><FileImage className="size-4 text-brand" /> الروشتة المرفقة (للإدارة فقط)</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/admin/requests/${r.id}/prescription`} alt="الروشتة" className="max-h-80 rounded-xl border border-navy/10 bg-white object-contain" loading="lazy" />
                    <a href={`/api/admin/requests/${r.id}/prescription`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-brand"><ExternalLink className="size-3.5" /> فتح بالحجم الكامل</a>
                    <p className="mt-1 text-[11px] font-semibold text-muted">الأدوية التي تُصرف بروشتة لا تُصرف إلا بعد التحقق الصيدلي من الروشتة.</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-muted">{new Date(r.createdAt).toLocaleString("ar-EG")}</p>
                  {mode === "server" && (
                    <select value={r.workflow ?? "new"} onChange={(e) => setWorkflow(r.id, e.target.value)} aria-label="حالة الطلب" className="field !w-auto !py-1.5 text-xs font-bold">
                      <option value="new">جديد</option>
                      <option value="in_review">قيد المراجعة</option>
                      <option value="contacted">تم التواصل</option>
                      <option value="closed">مغلق</option>
                    </select>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
