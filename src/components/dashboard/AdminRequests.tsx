"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Lock, LogOut, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "./ui";
import { useRequests } from "@/hooks/useRequests";
import { cn } from "@/lib/utils";

export default function AdminRequests() {
  const { requests, mode, markAllSeen, login, logout } = useRequests();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
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
        actions={
          mode === "server" ? (
            <button type="button" onClick={logout} className="btn-light !py-2 text-xs">
              <LogOut className="size-4" /> خروج المشرف
            </button>
          ) : undefined
        }
      />
      {mode === "local" && (
        <div className="mb-5 rounded-2xl bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
          تخزين الطلبات على الخادم غير مفعّل، لذلك تُعرض هنا الطلبات المحفوظة في <b>هذا المتصفح فقط</b>. فعّل قاعدة البيانات وكلمة مرور المشرف (انظر README) لتصلك الطلبات من كل الأجهزة.
        </div>
      )}
      {mode === "loading" && <div className="skeleton h-40 !rounded-[1.5rem]" />}
      {mode === "locked" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr("");
            const r = await login(pw);
            setBusy(false);
            if (!r.ok) setErr(r.error);
            else setPw("");
          }}
          className="mx-auto max-w-sm rounded-[1.5rem] border border-navy/[0.07] bg-white p-6 shadow-soft"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-brand-mint text-brand-deep"><Lock className="size-5" /></span>
          <h2 className="mt-4 text-lg font-black">دخول المشرف</h2>
          <p className="mt-1 text-xs font-medium text-muted">بيانات العملاء محمية. اكتب كلمة مرور المشرف لعرض الطلبات.</p>
          <label htmlFor="adm-pw" className="sr-only">كلمة المرور</label>
          <input id="adm-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="field mt-4" placeholder="كلمة المرور" />
          {err && <p role="alert" className="mt-2 text-xs font-bold text-rose-600">{err}</p>}
          <button type="submit" disabled={busy || !pw} className="btn-primary mt-4 w-full disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} دخول
          </button>
        </form>
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
                      {r.status === "submitted" ? "وصل إلى الفريق (إيميل)" : "محفوظ محليًا فقط"}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="font-extrabold">{r.customer.fullName}</div>
                  <div className="flex items-center gap-2 text-muted"><Mail className="size-4" /><span dir="ltr">{r.customer.email}</span></div>
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
                <p className="mt-3 text-[11px] font-semibold text-muted">{new Date(r.createdAt).toLocaleString("ar-EG")}</p>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
