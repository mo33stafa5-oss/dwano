"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RequireRole from "@/components/shared/RequireRole";
import { FieldError } from "@/components/shared/ContactForm";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { api, errMsg } from "@/lib/api";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

interface Med {
  id: string;
  name: string;
  strength: string;
  form: string;
  availability: "available" | "limited" | "out";
  updatedAt: string;
}
const AV = { available: "متوفر", limited: "كمية محدودة", out: "غير متوفر" } as const;
const TONE = { available: "bg-brand-mint text-brand-deep", limited: "bg-amber-50 text-amber-700", out: "bg-rose-50 text-rose-700" } as const;

export default function WarehouseMedicines() {
  return (
    <RequireRole role="warehouse">
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [items, setItems] = useState<Med[] | null>(null);
  const [edit, setEdit] = useState<Med | "new" | null>(null);
  const [del, setDel] = useState<Med | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ medicines: Med[] }>("/api/warehouse/medicines");
    setItems(r.ok ? r.data.medicines : []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const setAv = async (m: Med, availability: string) => {
    const r = await api(`/api/warehouse/medicines/${m.id}`, { method: "PATCH", json: { availability } });
    if (!r.ok) toast(errMsg(r.error));
    load();
  };

  return (
    <>
      <PageHeader title="أدوية المخزن" subtitle="حدّث التوافر باستمرار: البيانات الأقدم من ٧٢ ساعة تظهر للصيدليات «غير مؤكدة»." actions={<button type="button" onClick={() => setEdit("new")} className="btn-primary !py-2 text-sm"><Plus className="size-4" /> إضافة دواء</button>} />
      {items === null ? (
        <div className="skeleton h-48 !rounded-[1.5rem]" />
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد أدوية" text="أضف أدويتك لتظهر للصيدليات عند البحث." />
      ) : (
        <Panel className="!p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ice text-xs font-extrabold text-muted">
              <tr>{["الدواء", "التركيز", "الشكل", "التوافر", "آخر تحديث", ""].map((h) => <th key={h} className="px-4 py-3 text-start">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {items.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-extrabold">{m.name}</td>
                  <td className="px-4 py-3 text-muted">{m.strength || "—"}</td>
                  <td className="px-4 py-3 text-muted">{m.form || "—"}</td>
                  <td className="px-4 py-3">
                    <select aria-label="التوافر" value={m.availability} onChange={(e) => setAv(m, e.target.value)} className={cn("rounded-full border-0 px-2.5 py-1 text-[11px] font-extrabold", TONE[m.availability])}>
                      {Object.entries(AV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-muted">{new Date(m.updatedAt).toLocaleString("ar-EG")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEdit(m)} className="btn-light !py-1 text-xs">تعديل</button>
                      <button type="button" onClick={() => setDel(m)} className="btn-light !py-1 text-xs text-rose-600">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      {edit && <MedForm med={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSaved={() => (setEdit(null), load())} />}
      <ConfirmDialog
        open={!!del}
        title="حذف الدواء من القائمة؟"
        message={del ? `سيتم حذف «${del.name}» من قائمة مخزنك.` : ""}
        confirmLabel="حذف"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          const r = await api(`/api/warehouse/medicines/${del.id}`, { method: "DELETE" });
          if (!r.ok) toast(errMsg(r.error));
          setDel(null);
          load();
        }}
      />
    </>
  );
}

function MedForm({ med, onClose, onSaved }: { med: Med | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: med?.name ?? "", strength: med?.strength ?? "", form: med?.form ?? "", availability: med?.availability ?? "available" });
  const [nameErr, setNameErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setNameErr("اكتب اسم الدواء");
    setNameErr("");
    setBusy(true);
    setErr("");
    const body = { name: f.name.trim(), strength: f.strength.trim(), form: f.form.trim(), availability: f.availability };
    const r = await api(med ? `/api/warehouse/medicines/${med.id}` : "/api/warehouse/medicines", { method: med ? "PATCH" : "POST", json: body });
    setBusy(false);
    if (r.ok) return onSaved();
    setErr(r.status === 409 ? "هذا الدواء بنفس التركيز والشكل موجود بالفعل." : errMsg(r.error));
  };
  return (
    <Modal open onClose={onClose} title={med ? "تعديل دواء" : "إضافة دواء"} size="sm">
      <form onSubmit={submit} noValidate className="space-y-3">
        <div>
          <label htmlFor="m-name" className="mb-1 block text-xs font-extrabold text-muted">اسم الدواء</label>
          <input id="m-name" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <FieldError msg={nameErr} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="m-str" className="mb-1 block text-xs font-extrabold text-muted">التركيز</label>
            <input id="m-str" dir="ltr" placeholder="500mg" className="field text-start" value={f.strength} onChange={(e) => setF({ ...f, strength: e.target.value })} />
          </div>
          <div>
            <label htmlFor="m-form" className="mb-1 block text-xs font-extrabold text-muted">الشكل</label>
            <input id="m-form" placeholder="أقراص / شراب / حقن" className="field" value={f.form} onChange={(e) => setF({ ...f, form: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="m-av" className="mb-1 block text-xs font-extrabold text-muted">التوافر</label>
          <select id="m-av" className="field" value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value as Med["availability"] })}>
            {Object.entries(AV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">{busy && <Loader2 className="size-4 animate-spin" />} حفظ</button>
      </form>
    </Modal>
  );
}
