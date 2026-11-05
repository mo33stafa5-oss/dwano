"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import RequireRole from "@/components/shared/RequireRole";
import { FieldError } from "@/components/shared/ContactForm";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { api, errMsg } from "@/lib/api";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";
import { SUB_LABEL } from "@/components/pharmacy/PharmacySubscription";

export interface AdminPharmacy {
  id: string;
  name: string;
  owner?: string;
  phone: string;
  status: "pending" | "active" | "suspended" | "rejected";
  source: string;
  username: string | null;
  districtName?: string | null;
  areaName?: string | null;
  subscription: { amount: number; startDate: string | null; endDate: string | null; adminStatus: string; state: string; lastPaidAt: string | null };
}
const ST = { pending: ["قيد المراجعة", "bg-sky-50 text-sky-700"], active: ["معتمدة", "bg-brand-mint text-brand-deep"], suspended: ["موقوفة", "bg-rose-50 text-rose-700"], rejected: ["مرفوضة", "bg-slate-100 text-slate-600"] } as const;

export default function AdminNetwork() {
  return (
    <RequireRole role="admin">
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [rows, setRows] = useState<AdminPharmacy[] | null>(null);
  const [add, setAdd] = useState(false);
  const load = useCallback(async () => {
    const r = await api<{ pharmacies: AdminPharmacy[] }>("/api/admin/pharmacies");
    setRows(r.ok ? r.data.pharmacies : []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    const r = await api(`/api/admin/pharmacies/${id}`, { method: "PATCH", json: { status } });
    if (!r.ok) toast(errMsg(r.error));
    load();
  };

  return (
    <>
      <PageHeader title="الصيدليات المسجلة" subtitle="اعتماد طلبات التسجيل وإيقاف الصيدليات وإضافة صيدلية يدويًا. لا يتم حذف أي سجل." actions={<button type="button" onClick={() => setAdd(true)} className="btn-primary !py-2 text-sm"><Plus className="size-4" /> إضافة صيدلية</button>} />
      {rows === null ? (
        <div className="skeleton h-48 !rounded-[1.5rem]" />
      ) : rows.length === 0 ? (
        <EmptyState title="لا توجد صيدليات" text="ستظهر هنا طلبات التسجيل الجديدة." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((p) => (
            <Panel key={p.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black">{p.name}</p>
                  <p className="text-xs font-semibold text-muted">{[p.districtName, p.areaName].filter(Boolean).join(" - ")} · <span dir="ltr">{p.phone}</span></p>
                  {p.username && <p className="text-[11px] font-semibold text-muted">المستخدم: <span dir="ltr" className="font-mono">{p.username}</span></p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", ST[p.status][1])}>{ST[p.status][0]}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", (SUB_LABEL[p.subscription.state] ?? SUB_LABEL.pending).cls)}>اشتراك: {(SUB_LABEL[p.subscription.state] ?? SUB_LABEL.pending).label}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-navy/5 pt-3">
                {p.status !== "active" && <button type="button" onClick={() => setStatus(p.id, "active")} className="btn-primary !py-1.5 text-xs">{p.status === "suspended" ? "إعادة التفعيل" : "اعتماد"}</button>}
                {p.status === "active" && <button type="button" onClick={() => setStatus(p.id, "suspended")} className="btn-light !py-1.5 text-xs text-rose-600">إيقاف</button>}
                {p.status === "pending" && <button type="button" onClick={() => setStatus(p.id, "rejected")} className="btn-light !py-1.5 text-xs text-rose-600">رفض</button>}
              </div>
            </Panel>
          ))}
        </div>
      )}
      {add && <AddPharmacy onClose={() => setAdd(false)} onSaved={() => (setAdd(false), load())} />}
    </>
  );
}

function AddPharmacy({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: "", owner: "", phone: "", address: "", username: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "اكتب اسم الصيدلية";
    if (f.username || f.password) {
      if (!/^[a-zA-Z0-9_.-]{4,30}$/.test(f.username)) er.username = "٤-٣٠ حرفًا إنجليزيًا/أرقامًا";
      if (f.password.length < 8) er.password = "٨ أحرف على الأقل";
    }
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setErr("");
    const r = await api("/api/admin/pharmacies", {
      method: "POST",
      json: { name: f.name.trim(), owner: f.owner.trim() || undefined, phone: f.phone.trim() || "", address: f.address.trim() || undefined, account: f.username ? { username: f.username.trim(), password: f.password } : undefined },
    });
    setBusy(false);
    if (r.ok) return onSaved();
    setErr(r.status === 409 ? "اسم المستخدم مستخدم بالفعل." : errMsg(r.error));
  };
  const inp = (k: keyof typeof f, label: string, extra = "") => (
    <div>
      <label htmlFor={`ap-${k}`} className="mb-1 block text-xs font-extrabold text-muted">{label}</label>
      <input id={`ap-${k}`} type={k === "password" ? "password" : "text"} className={cn("field", extra, errors[k] && "!border-rose-400")} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      <FieldError msg={errors[k]} />
    </div>
  );
  return (
    <Modal open onClose={onClose} title="إضافة صيدلية" description="تُضاف كصيدلية معتمدة. أنشئ حساب دخول لها اختياريًا." size="md">
      <form onSubmit={submit} noValidate className="space-y-3">
        {inp("name", "اسم الصيدلية")}
        <div className="grid gap-3 sm:grid-cols-2">{inp("owner", "المسؤول")}{inp("phone", "الموبايل", "text-start")}</div>
        {inp("address", "العنوان")}
        <div className="grid gap-3 sm:grid-cols-2">{inp("username", "اسم المستخدم (اختياري)", "text-start")}{inp("password", "كلمة المرور", "text-start")}</div>
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">{busy && <Loader2 className="size-4 animate-spin" />} حفظ</button>
      </form>
    </Modal>
  );
}
