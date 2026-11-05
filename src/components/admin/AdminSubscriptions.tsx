"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, CircleDollarSign, Clock, Loader2, PauseCircle, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import RequireRole from "@/components/shared/RequireRole";
import { FieldError } from "@/components/shared/ContactForm";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/dashboard/ui";
import { money } from "@/components/souqak/shared";
import { SUB_LABEL } from "@/components/pharmacy/PharmacySubscription";
import type { AdminPharmacy } from "./AdminNetwork";
import { api, errMsg } from "@/lib/api";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

interface Payment { id: string; amount: number; paid_at: string; period_start: string; period_end: string; method: string | null; note: string | null; pharmacy_name: string }
interface Data { summary: { total: number; active: number; pending: number; expired: number; suspended: number; paid: number; unpaid: number }; pharmacies: AdminPharmacy[]; payments: Payment[] }

export default function AdminSubscriptions() {
  return (
    <RequireRole role="admin">
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [d, setD] = useState<Data | null>(null);
  const [pay, setPay] = useState<AdminPharmacy | null>(null);
  const [cfg, setCfg] = useState<AdminPharmacy | null>(null);
  const load = useCallback(async () => {
    const r = await api<Data>("/api/admin/subscriptions");
    setD(r.ok ? r.data : { summary: { total: 0, active: 0, pending: 0, expired: 0, suspended: 0, paid: 0, unpaid: 0 }, pharmacies: [], payments: [] });
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "suspend" | "activate") => {
    const r = await api(`/api/admin/pharmacies/${id}/subscription`, { method: "POST", json: { action } });
    if (!r.ok) toast(errMsg(r.error));
    load();
  };

  if (!d) return <div className="skeleton h-64 !rounded-[1.5rem]" />;
  const s = d.summary;
  return (
    <>
      <PageHeader title="الاشتراكات" subtitle="الاشتراك الشهري للصيدليات. الإيقاف يمنع ميزات سوقك وبحث المخازن فقط، والبيانات تبقى محفوظة." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="مدفوع (فعّال)" value={s.paid} icon={BadgeCheck} />
        <StatCard label="غير مدفوع" value={s.unpaid} icon={CircleDollarSign} tone="amber" />
        <StatCard label="منتهي" value={s.expired} icon={Clock} tone="rose" />
        <StatCard label="موقوف" value={s.suspended} icon={PauseCircle} tone="sky" />
      </div>
      <Panel title={`الصيدليات (${s.total.toLocaleString("ar-EG")})`} className="!p-0 overflow-x-auto">
        {d.pharmacies.length === 0 ? (
          <div className="p-4"><EmptyState title="لا توجد صيدليات" text="سجّل صيدلية أو اعتمد طلبًا أولًا." /></div>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-ice text-xs font-extrabold text-muted">
              <tr>{["الصيدلية", "الحالة", "القيمة الشهرية", "الفترة", "آخر دفعة", ""].map((h) => <th key={h} className="px-4 py-3 text-start">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {d.pharmacies.map((p) => {
                const st = SUB_LABEL[p.subscription.state] ?? SUB_LABEL.pending;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-extrabold">{p.name}</td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", st.cls)}>{st.label}</span></td>
                    <td className="px-4 py-3">{money(p.subscription.amount)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-muted">{p.subscription.startDate ?? "—"} → {p.subscription.endDate ?? "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-muted">{p.subscription.lastPaidAt ? new Date(p.subscription.lastPaidAt).toLocaleDateString("ar-EG") : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => setPay(p)} className="btn-primary !py-1 text-xs">تسجيل دفعة</button>
                        <button type="button" onClick={() => setCfg(p)} className="btn-light !py-1 text-xs">القيمة</button>
                        {p.subscription.adminStatus === "suspended" ? (
                          <button type="button" onClick={() => act(p.id, "activate")} className="btn-light !py-1 text-xs">إعادة تفعيل</button>
                        ) : (
                          <button type="button" onClick={() => act(p.id, "suspend")} className="btn-light !py-1 text-xs text-rose-600">إيقاف</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
      <Panel title="سجل المدفوعات" className="mt-5">
        {d.payments.length === 0 ? (
          <p className="text-sm font-medium text-muted"><Users className="me-1 inline size-4" /> لا توجد مدفوعات مسجلة بعد.</p>
        ) : (
          <ul className="divide-y divide-navy/5 text-sm">
            {d.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span className="font-extrabold">{p.pharmacy_name}</span>
                <span className="font-black text-brand-deep">{money(p.amount)}</span>
                <span className="text-xs font-semibold text-muted">{p.period_start} → {p.period_end}{p.method ? ` · ${p.method}` : ""}</span>
                <span className="text-xs font-semibold text-muted">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {pay && <PayModal p={pay} onClose={() => setPay(null)} onSaved={() => (setPay(null), load())} />}
      {cfg && <CfgModal p={cfg} onClose={() => setCfg(null)} onSaved={() => (setCfg(null), load())} />}
    </>
  );
}

function PayModal({ p, onClose, onSaved }: { p: AdminPharmacy; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(p.subscription.amount ? String(p.subscription.amount) : "");
  const [method, setMethod] = useState("نقدي");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) return setErr("اكتب مبلغًا صحيحًا");
    setBusy(true);
    const r = await api(`/api/admin/pharmacies/${p.id}/subscription`, { method: "POST", json: { action: "payment", amount: Number(amount), method, note: note || undefined } });
    setBusy(false);
    if (r.ok) return (toast("تم تسجيل الدفعة وتمديد الاشتراك شهرًا.", "success"), onSaved());
    setErr(errMsg(r.error));
  };
  return (
    <Modal open onClose={onClose} title={`تسجيل دفعة · ${p.name}`} description="تمدّد الاشتراك شهرًا. الدفعة لا تعيد تفعيل صيدلية موقوفة." size="sm">
      <form onSubmit={submit} className="space-y-3">
        <div><label htmlFor="pm-a" className="mb-1 block text-xs font-extrabold text-muted">المبلغ (ج.م)</label><input id="pm-a" type="number" min="0" step="0.01" dir="ltr" className="field text-start" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><label htmlFor="pm-m" className="mb-1 block text-xs font-extrabold text-muted">طريقة الدفع</label><input id="pm-m" className="field" value={method} onChange={(e) => setMethod(e.target.value)} /></div>
        <div><label htmlFor="pm-n" className="mb-1 block text-xs font-extrabold text-muted">ملاحظة</label><input id="pm-n" className="field" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <FieldError msg={err} />
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">{busy && <Loader2 className="size-4 animate-spin" />} تسجيل</button>
      </form>
    </Modal>
  );
}

function CfgModal({ p, onClose, onSaved }: { p: AdminPharmacy; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(String(p.subscription.amount ?? 0));
  const [start, setStart] = useState(p.subscription.startDate ?? "");
  const [end, setEnd] = useState(p.subscription.endDate ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(amount) >= 0)) return setErr("مبلغ غير صحيح");
    setBusy(true);
    const r = await api(`/api/admin/pharmacies/${p.id}/subscription`, { method: "POST", json: { action: "configure", monthlyAmount: Number(amount), startDate: start || undefined, endDate: end || undefined } });
    setBusy(false);
    if (r.ok) return onSaved();
    setErr(errMsg(r.error));
  };
  return (
    <Modal open onClose={onClose} title={`إعدادات الاشتراك · ${p.name}`} size="sm">
      <form onSubmit={submit} className="space-y-3">
        <div><label htmlFor="cf-a" className="mb-1 block text-xs font-extrabold text-muted">القيمة الشهرية (ج.م)</label><input id="cf-a" type="number" min="0" step="0.01" dir="ltr" className="field text-start" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="cf-s" className="mb-1 block text-xs font-extrabold text-muted">البداية</label><input id="cf-s" type="date" dir="ltr" className="field" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><label htmlFor="cf-e" className="mb-1 block text-xs font-extrabold text-muted">الانتهاء</label><input id="cf-e" type="date" dir="ltr" className="field" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <FieldError msg={err} />
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">{busy && <Loader2 className="size-4 animate-spin" />} حفظ</button>
      </form>
    </Modal>
  );
}
