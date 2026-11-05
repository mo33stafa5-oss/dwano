"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, CircleDollarSign, Clock, History, ListChecks, Loader2, PackageX, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import RequireRole from "@/components/shared/RequireRole";
import { FieldError } from "@/components/shared/ContactForm";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/dashboard/ui";
import { money } from "@/components/souqak/shared";
import { api, errMsg } from "@/lib/api";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

type Status = "pending" | "partial" | "fulfilled" | "cancelled";
interface Item { id?: string; productName: string; requestedQty: number; fulfilledQty: number; unitPrice: number; notes?: string | null; remainingQty?: number; total?: number }
interface Tx { id: string; pharmacyId: string; pharmacyName: string; date: string; status: Status; notes: string | null; items: Item[]; requestedQty: number; fulfilledQty: number; unfulfilledQty: number; total: number }
interface Kpis { total: number; fulfilled: number; partial: number; pending: number; cancelled: number; value: number; outstanding: number }
interface Ph { id: string; name: string }
interface ReportRow { bucket: string; pharmacy?: string; transactions: number; fulfilled: number; partial: number; pending: number; cancelled: number; value: number; outstanding: number }

const ST: Record<Status, [string, string]> = { pending: ["معلّقة", "bg-sky-50 text-sky-700"], partial: ["جزئية", "bg-amber-50 text-amber-700"], fulfilled: ["مكتملة", "bg-brand-mint text-brand-deep"], cancelled: ["ملغاة", "bg-rose-50 text-rose-700"] };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());

export default function AdminOperations() {
  return (
    <RequireRole role="admin">
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [tab, setTab] = useState<"list" | "report">("list");
  const [pharmacies, setPharmacies] = useState<Ph[]>([]);
  const [filters, setFilters] = useState({ pharmacyId: "", from: "", to: "", status: "" });
  const [data, setData] = useState<{ transactions: Tx[]; kpis: Kpis } | null>(null);
  const [form, setForm] = useState<Tx | "new" | null>(null);
  const [audit, setAudit] = useState<Tx | null>(null);

  useEffect(() => {
    api<{ pharmacies: Ph[] }>("/api/admin/pharmacies").then((r) => r.ok && setPharmacies(r.data.pharmacies));
  }, []);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && sp.set(k, v));
    const r = await api<{ transactions: Tx[]; kpis: Kpis }>(`/api/admin/operations?${sp}`);
    setData(r.ok ? r.data : { transactions: [], kpis: { total: 0, fulfilled: 0, partial: 0, pending: 0, cancelled: 0, value: 0, outstanding: 0 } });
  }, [filters]);
  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (t: Tx) => {
    if (!window.confirm("إلغاء هذه المعاملة؟ تبقى محفوظة في السجل.")) return;
    const r = await api(`/api/admin/operations/${t.id}`, { method: "PATCH", json: { cancelled: true } });
    if (!r.ok) toast(errMsg(r.error));
    load();
  };

  const k = data?.kpis;
  const sel = "field !w-auto !py-2 text-xs font-bold";
  return (
    <>
      <PageHeader title="العمليات اليومية" subtitle="سجل داخلي لتعاملات دوانو مع الصيدليات. لا تراه الصيدليات." actions={<button type="button" onClick={() => setForm("new")} className="btn-primary !py-2 text-sm"><Plus className="size-4" /> معاملة جديدة</button>} />
      <div className="mb-3 flex gap-2" role="tablist">
        {([["list", "المعاملات"], ["report", "التقارير"]] as const).map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("rounded-full px-4 py-1.5 text-xs font-extrabold", tab === id ? "bg-brand text-white" : "bg-white text-muted")}>{l}</button>
        ))}
      </div>
      {tab === "report" ? (
        <Report />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <select aria-label="الصيدلية" className={sel} value={filters.pharmacyId} onChange={(e) => setFilters({ ...filters, pharmacyId: e.target.value })}>
              <option value="">كل الصيدليات</option>
              {pharmacies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input aria-label="من تاريخ" type="date" dir="ltr" className={sel} value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            <input aria-label="إلى تاريخ" type="date" dir="ltr" className={sel} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            <select aria-label="الحالة" className={sel} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">كل الحالات</option>
              {(Object.keys(ST) as Status[]).map((s) => <option key={s} value={s}>{ST[s][0]}</option>)}
            </select>
          </div>
          {k && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard label="إجمالي المعاملات" value={k.total} icon={ListChecks} />
              <StatCard label="مكتملة" value={k.fulfilled} icon={CheckCircle2} />
              <StatCard label="جزئية" value={k.partial} icon={Clock} tone="amber" />
              <StatCard label="معلّقة" value={k.pending} icon={Clock} tone="sky" />
              <StatCard label="القيمة المنفّذة (ج.م)" value={Math.round(k.value)} icon={CircleDollarSign} />
              <StatCard label="كميات متبقية" value={k.outstanding} icon={PackageX} tone="rose" />
            </div>
          )}
          {!data ? (
            <div className="skeleton h-48 !rounded-[1.5rem]" />
          ) : data.transactions.length === 0 ? (
            <EmptyState title="لا توجد معاملات" text="سجّل أول معاملة مع صيدلية." />
          ) : (
            <div className="space-y-4">
              {data.transactions.map((t) => (
                <Panel key={t.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{t.pharmacyName}</p>
                      <p className="text-xs font-semibold text-muted">{t.date}{t.notes ? ` · ${t.notes}` : ""}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", ST[t.status][1])}>{ST[t.status][0]}</span>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs">
                      <thead className="text-muted"><tr>{["الصنف", "مطلوب", "منفّذ", "متبقي", "السعر", "الإجمالي"].map((h) => <th key={h} className="py-1 text-start font-extrabold">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-navy/5">
                        {t.items.map((i, n) => (
                          <tr key={i.id ?? n}>
                            <td className="py-1.5 font-bold">{i.productName}</td><td>{i.requestedQty}</td><td>{i.fulfilledQty}</td><td>{i.remainingQty}</td><td>{money(i.unitPrice)}</td><td className="font-black">{money(i.total ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-navy/5 pt-3 text-xs font-bold">
                    <span className="text-muted">مطلوب {t.requestedQty} · منفّذ {t.fulfilledQty} · غير منفّذ {t.unfulfilledQty}</span>
                    <span className="text-sm font-black text-brand-deep">{money(t.total)}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAudit(t)} className="btn-light !py-1 text-xs"><History className="size-3.5" /> السجل</button>
                      {t.status !== "cancelled" && <button type="button" onClick={() => setForm(t)} className="btn-light !py-1 text-xs">تعديل</button>}
                      {t.status !== "cancelled" && <button type="button" onClick={() => cancel(t)} className="btn-light !py-1 text-xs text-rose-600"><Ban className="size-3.5" /> إلغاء</button>}
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </>
      )}
      {form && <TxForm tx={form === "new" ? null : form} pharmacies={pharmacies} onClose={() => setForm(null)} onSaved={() => (setForm(null), load())} />}
      {audit && <AuditModal t={audit} onClose={() => setAudit(null)} />}
    </>
  );
}

function TxForm({ tx, pharmacies, onClose, onSaved }: { tx: Tx | null; pharmacies: Ph[]; onClose: () => void; onSaved: () => void }) {
  const blank: Item = { productName: "", requestedQty: 1, fulfilledQty: 0, unitPrice: 0 };
  const [pharmacyId, setPharmacyId] = useState(tx?.pharmacyId ?? "");
  const [date, setDate] = useState(tx?.date ?? today());
  const [notes, setNotes] = useState(tx?.notes ?? "");
  const [items, setItems] = useState<Item[]>(tx?.items.map((i) => ({ productName: i.productName, requestedQty: i.requestedQty, fulfilledQty: i.fulfilledQty, unitPrice: i.unitPrice })) ?? [blank]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const upd = (n: number, patch: Partial<Item>) => setItems((a) => a.map((x, i) => (i === n ? { ...x, ...patch } : x)));
  const total = items.reduce((s, i) => s + i.fulfilledQty * i.unitPrice, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) return setErr("اختر الصيدلية");
    if (items.some((i) => !i.productName.trim() || i.requestedQty < 1)) return setErr("أكمل أسماء الأصناف والكميات المطلوبة");
    if (items.some((i) => i.fulfilledQty > i.requestedQty || i.fulfilledQty < 0)) return setErr("الكمية المنفّذة لا تتجاوز المطلوبة");
    setBusy(true);
    setErr("");
    const clean = items.map((i) => ({ productName: i.productName.trim(), requestedQty: i.requestedQty, fulfilledQty: i.fulfilledQty, unitPrice: i.unitPrice }));
    const r = tx
      ? await api(`/api/admin/operations/${tx.id}`, { method: "PATCH", json: { date, notes, items: clean } })
      : await api("/api/admin/operations", { method: "POST", json: { pharmacyId, date, notes: notes || undefined, items: clean } });
    setBusy(false);
    if (r.ok) return onSaved();
    setErr(errMsg(r.error));
  };
  const num = "field text-start !px-2 !py-1.5 text-xs";
  return (
    <Modal open onClose={onClose} title={tx ? "تعديل معاملة" : "معاملة جديدة"} description="الحالة تُحسب تلقائيًا من الكميات." size="lg">
      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="t-ph" className="mb-1 block text-xs font-extrabold text-muted">الصيدلية</label>
            <select id="t-ph" disabled={!!tx} className="field" value={pharmacyId} onChange={(e) => setPharmacyId(e.target.value)}>
              <option value="">اختر الصيدلية</option>
              {pharmacies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="t-date" className="mb-1 block text-xs font-extrabold text-muted">التاريخ</label>
            <input id="t-date" type="date" dir="ltr" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          {items.map((i, n) => (
            <div key={n} className="grid grid-cols-12 items-end gap-2 rounded-xl bg-ice p-2">
              <div className="col-span-12 sm:col-span-4"><label className="mb-0.5 block text-[10px] font-extrabold text-muted">الصنف</label><input aria-label="الصنف" className="field !px-2 !py-1.5 text-xs" value={i.productName} onChange={(e) => upd(n, { productName: e.target.value })} /></div>
              <div className="col-span-4 sm:col-span-2"><label className="mb-0.5 block text-[10px] font-extrabold text-muted">مطلوب</label><input aria-label="مطلوب" type="number" min={1} dir="ltr" className={num} value={i.requestedQty} onChange={(e) => upd(n, { requestedQty: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} /></div>
              <div className="col-span-4 sm:col-span-2"><label className="mb-0.5 block text-[10px] font-extrabold text-muted">منفّذ</label><input aria-label="منفّذ" type="number" min={0} dir="ltr" className={num} value={i.fulfilledQty} onChange={(e) => upd(n, { fulfilledQty: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} /></div>
              <div className="col-span-4 sm:col-span-2"><label className="mb-0.5 block text-[10px] font-extrabold text-muted">سعر الوحدة</label><input aria-label="سعر الوحدة" type="number" min={0} step="0.01" dir="ltr" className={num} value={i.unitPrice} onChange={(e) => upd(n, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} /></div>
              <div className="col-span-12 flex items-center justify-between text-[11px] font-bold text-muted sm:col-span-2 sm:justify-end sm:gap-2">
                <span>متبقي {Math.max(0, i.requestedQty - i.fulfilledQty)}</span>
                {items.length > 1 && <button type="button" aria-label="حذف الصنف" onClick={() => setItems((a) => a.filter((_, x) => x !== n))} className="text-rose-600"><Trash2 className="size-4" /></button>}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setItems((a) => [...a, blank])} className="btn-light !py-1.5 text-xs"><Plus className="size-3.5" /> صنف آخر</button>
        </div>
        <div>
          <label htmlFor="t-notes" className="mb-1 block text-xs font-extrabold text-muted">ملاحظات</label>
          <input id="t-notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <p className="text-sm font-black text-brand-deep">إجمالي القيمة المنفّذة: {money(total)}</p>
        <FieldError msg={err} />
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">{busy && <Loader2 className="size-4 animate-spin" />} حفظ</button>
      </form>
    </Modal>
  );
}

function AuditModal({ t, onClose }: { t: Tx; onClose: () => void }) {
  const [rows, setRows] = useState<{ id: number; action: string; at: string; by: string | null; after: Tx | null }[] | null>(null);
  useEffect(() => {
    api<{ audit: { id: number; action: string; at: string; by: string | null; after: Tx | null }[] }>(`/api/admin/operations/${t.id}/audit`).then((r) => setRows(r.ok ? r.data.audit : []));
  }, [t.id]);
  const L: Record<string, string> = { create: "إنشاء", update: "تعديل", cancel: "إلغاء" };
  return (
    <Modal open onClose={onClose} title="سجل التعديلات" description={`${t.pharmacyName} · ${t.date}`} size="md">
      {rows === null ? <div className="skeleton h-24" /> : rows.length === 0 ? <p className="text-sm text-muted">لا يوجد سجل.</p> : (
        <ul className="divide-y divide-navy/5 text-sm">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2.5">
              <b>{L[a.action] ?? a.action}</b>
              <span className="text-xs font-semibold text-muted">{a.after ? `${ST[a.after.status][0]} · ${money(a.after.total)}` : ""}</span>
              <span className="text-xs font-semibold text-muted">{a.by ?? "—"} · {new Date(a.at).toLocaleString("ar-EG")}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function Report() {
  const [period, setPeriod] = useState("daily");
  const [by, setBy] = useState(false);
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  useEffect(() => {
    setRows(null);
    api<{ rows: ReportRow[] }>(`/api/admin/operations/report?period=${period}${by ? "&by=pharmacy" : ""}`).then((r) => setRows(r.ok ? r.data.rows : []));
  }, [period, by]);
  return (
    <Panel title="تقرير العمليات" className="!p-0 overflow-x-auto">
      <div className="flex flex-wrap gap-2 p-4">
        {([["daily", "يومي (٣٠ يومًا)"], ["weekly", "أسبوعي (١٢ أسبوعًا)"], ["monthly", "شهري (١٢ شهرًا)"]] as const).map(([id, l]) => (
          <button key={id} type="button" onClick={() => setPeriod(id)} className={cn("rounded-full px-3 py-1 text-xs font-extrabold", period === id ? "bg-brand text-white" : "bg-ice text-muted")}>{l}</button>
        ))}
        <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={by} onChange={(e) => setBy(e.target.checked)} className="accent-[#008F73]" /> حسب الصيدلية</label>
      </div>
      {rows === null ? <div className="skeleton m-4 h-32" /> : rows.length === 0 ? <div className="p-4"><EmptyState title="لا توجد بيانات" text="لا توجد معاملات في هذه الفترة." /></div> : (
        <table className="w-full min-w-[640px] text-xs">
          <thead className="bg-ice text-muted"><tr>{["الفترة", ...(by ? ["الصيدلية"] : []), "معاملات", "مكتملة", "جزئية", "معلّقة", "ملغاة", "القيمة", "متبقي"].map((h) => <th key={h} className="px-3 py-2.5 text-start font-extrabold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-navy/5">
            {rows.map((r, i) => (
              <tr key={i}><td className="px-3 py-2 font-bold" dir="ltr">{r.bucket}</td>{by && <td className="px-3 py-2">{r.pharmacy}</td>}<td className="px-3 py-2">{r.transactions}</td><td className="px-3 py-2">{r.fulfilled}</td><td className="px-3 py-2">{r.partial}</td><td className="px-3 py-2">{r.pending}</td><td className="px-3 py-2">{r.cancelled}</td><td className="px-3 py-2 font-black">{money(r.value)}</td><td className="px-3 py-2">{r.outstanding}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
