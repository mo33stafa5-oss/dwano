"use client";

import { useState } from "react";
import { Loader2, MapPin, MessageCircle, Phone, Search } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { api, errMsg } from "@/lib/api";
import { cn } from "@/lib/utils";
import { GateNotice, PharmacyPage } from "./Gate";

interface Hit {
  id: string;
  name: string;
  strength: string;
  form: string;
  availability: "available" | "limited" | "out" | "unconfirmed";
  updatedAt: string;
  warehouse: { id: string; name: string; phone: string; whatsapp: string | null; address: string; governorate: string };
}
export const AVAIL = {
  available: { label: "متوفر (حسب آخر تحديث)", cls: "bg-brand-mint text-brand-deep" },
  limited: { label: "كمية محدودة", cls: "bg-amber-50 text-amber-700" },
  out: { label: "غير متوفر", cls: "bg-rose-50 text-rose-700" },
  unconfirmed: { label: "غير مؤكد (البيانات قديمة)", cls: "bg-slate-100 text-slate-600" },
} as const;

export default function PharmacyWarehouses() {
  return (
    <PharmacyPage>
      <Inner />
    </PharmacyPage>
  );
}

function Inner() {
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [gate, setGate] = useState<string>();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await api<{ results: Hit[] }>(`/api/pharmacy/warehouse-search?q=${encodeURIComponent(term.trim())}`);
    setBusy(false);
    if (r.ok) return (setHits(r.data.results), setGate(undefined));
    setHits(null);
    setGate(r.error);
    setMsg(errMsg(r.error));
  };

  return (
    <>
      <PageHeader title="بحث المخازن" subtitle="ابحث عن دواء لتعرف المخازن المسجلة التي تعرضه وتتواصل معها مباشرة." />
      <GateNotice error={gate} />
      <form onSubmit={search} className="mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-brand" />
          <label htmlFor="ws-q" className="sr-only">اسم الدواء</label>
          <input id="ws-q" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="اسم الدواء…" className="field !ps-11" />
        </div>
        <button type="submit" disabled={busy || term.trim().length < 2} className="btn-primary disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : "بحث"}</button>
      </form>
      {msg && gate !== "subscription-required" && gate !== "pharmacy-not-approved" && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{msg}</p>}
      <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">التوافر استرشادي حسب آخر تحديث من المخزن، وأي بيانات أقدم من ٧٢ ساعة تظهر «غير مؤكد». أكّد مع المخزن قبل الطلب.</p>
      {hits &&
        (hits.length === 0 ? (
          <EmptyState title="لا توجد نتائج" text="لم تُسجّل أي مخازن هذا الدواء حاليًا." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {hits.map((h) => (
              <Panel key={h.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black">{h.name}</p>
                    <p className="text-xs font-semibold text-muted">{[h.strength, h.form].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", AVAIL[h.availability].cls)}>{AVAIL[h.availability].label}</span>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-extrabold">{h.warehouse.name}</p>
                  <p className="flex items-start gap-2 text-muted"><MapPin className="mt-0.5 size-4 shrink-0" /> {h.warehouse.governorate} - {h.warehouse.address}</p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <a href={`tel:${h.warehouse.phone}`} className="flex items-center gap-1 text-xs font-extrabold text-brand"><Phone className="size-4" /><span dir="ltr">{h.warehouse.phone}</span></a>
                    {h.warehouse.whatsapp && <a href={`https://wa.me/2${h.warehouse.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-extrabold text-brand"><MessageCircle className="size-4" /> واتساب</a>}
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-muted">آخر تحديث: {new Date(h.updatedAt).toLocaleString("ar-EG")}</p>
              </Panel>
            ))}
          </div>
        ))}
    </>
  );
}
