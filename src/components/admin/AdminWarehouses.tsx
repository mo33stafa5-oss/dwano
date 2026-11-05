"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import RequireRole from "@/components/shared/RequireRole";
import { FieldError } from "@/components/shared/ContactForm";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { api, errMsg } from "@/lib/api";
import { normalizeEgPhone } from "@/lib/requests";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

interface W { id: string; name: string; phone: string; whatsapp: string | null; address: string; governorate: string; status: "pending" | "active" | "suspended"; username: string | null; medicines: number }
const ST = { pending: ["قيد المراجعة", "bg-sky-50 text-sky-700"], active: ["نشط", "bg-brand-mint text-brand-deep"], suspended: ["موقوف", "bg-rose-50 text-rose-700"] } as const;

export default function AdminWarehouses() {
  return (
    <RequireRole role="admin">
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [rows, setRows] = useState<W[] | null>(null);
  const [form, setForm] = useState<W | "new" | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ warehouses: W[] }>("/api/admin/warehouses");
    setRows(r.ok ? r.data.warehouses : []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const setStatus = async (id: string, status: string) => {
    const r = await api(`/api/admin/warehouses/${id}`, { method: "PATCH", json: { status } });
    if (!r.ok) toast(errMsg(r.error));
    load();
  };
  return (
    <>
      <PageHeader title="المخازن" subtitle="تسجيل المخازن واعتمادها وإيقافها. يتم إنشاء حساب الدخول للمخزن من هنا." actions={<button type="button" onClick={() => setForm("new")} className="btn-primary !py-2 text-sm"><Plus className="size-4" /> تسجيل مخزن</button>} />
      {rows === null ? (
        <div className="skeleton h-48 !rounded-[1.5rem]" />
      ) : rows.length === 0 ? (
        <EmptyState title="لا توجد مخازن" text="سجّل أول مخزن لتتمكن الصيدليات من البحث في أدويته." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((w) => (
            <Panel key={w.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black">{w.name}</p>
                  <p className="text-xs font-semibold text-muted">{w.governorate} - {w.address}</p>
                  <p className="text-xs font-semibold text-muted"><span dir="ltr">{w.phone}</span> · {w.medicines.toLocaleString("ar-EG")} صنف{w.username ? <> · <span dir="ltr" className="font-mono">{w.username}</span></> : null}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", ST[w.status][1])}>{ST[w.status][0]}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-navy/5 pt-3">
                {w.status !== "active" && <button type="button" onClick={() => setStatus(w.id, "active")} className="btn-primary !py-1.5 text-xs">{w.status === "suspended" ? "إعادة التفعيل" : "اعتماد"}</button>}
                {w.status === "active" && <button type="button" onClick={() => setStatus(w.id, "suspended")} className="btn-light !py-1.5 text-xs text-rose-600">إيقاف</button>}
                <button type="button" onClick={() => setForm(w)} className="btn-light !py-1.5 text-xs">تعديل</button>
              </div>
            </Panel>
          ))}
        </div>
      )}
      {form && <WForm w={form === "new" ? null : form} onClose={() => setForm(null)} onSaved={() => (setForm(null), load())} />}
    </>
  );
}

function WForm({ w, onClose, onSaved }: { w: W | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: w?.name ?? "", phone: w?.phone ?? "", whatsapp: w?.whatsapp ?? "", address: w?.address ?? "", governorate: w?.governorate ?? "الفيوم", username: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "اكتب اسم المخزن";
    const phone = normalizeEgPhone(f.phone);
    if (!/^01[0125]\d{8}$/.test(phone)) er.phone = "رقم موبايل مصري صحيح";
    const wa = f.whatsapp ? normalizeEgPhone(f.whatsapp) : "";
    if (wa && !/^01[0125]\d{8}$/.test(wa)) er.whatsapp = "رقم غير صحيح";
    if (f.address.trim().length < 3) er.address = "اكتب العنوان";
    if (!w) {
      if (!/^[a-zA-Z0-9_.-]{4,30}$/.test(f.username)) er.username = "٤-٣٠ حرفًا إنجليزيًا/أرقامًا";
      if (f.password.length < 8) er.password = "٨ أحرف على الأقل";
    } else if (f.password && f.password.length < 8) er.password = "٨ أحرف على الأقل";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setErr("");
    const common = { name: f.name.trim(), phone, address: f.address.trim(), governorate: f.governorate.trim() || "الفيوم" };
    const r = w
      ? await api(`/api/admin/warehouses/${w.id}`, { method: "PATCH", json: { ...common, whatsapp: wa || undefined, newPassword: f.password || undefined } })
      : await api("/api/admin/warehouses", { method: "POST", json: { ...common, whatsapp: wa, username: f.username.trim(), password: f.password, status: "active" } });
    setBusy(false);
    if (r.ok) return onSaved();
    setErr(r.status === 409 ? "اسم المستخدم مستخدم بالفعل." : errMsg(r.error));
  };
  const inp = (k: keyof typeof f, label: string, ltr = false, type = "text") => (
    <div>
      <label htmlFor={`w-${k}`} className="mb-1 block text-xs font-extrabold text-muted">{label}</label>
      <input id={`w-${k}`} type={type} dir={ltr ? "ltr" : undefined} className={cn("field", ltr && "text-start", errors[k] && "!border-rose-400")} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      <FieldError msg={errors[k]} />
    </div>
  );
  return (
    <Modal open onClose={onClose} title={w ? "تعديل مخزن" : "تسجيل مخزن"} size="md">
      <form onSubmit={submit} noValidate className="space-y-3">
        {inp("name", "اسم المخزن")}
        <div className="grid gap-3 sm:grid-cols-2">{inp("phone", "الهاتف", true)}{inp("whatsapp", "واتساب (اختياري)", true)}</div>
        <div className="grid gap-3 sm:grid-cols-2">{inp("governorate", "المحافظة")}{inp("address", "العنوان")}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {!w && inp("username", "اسم مستخدم المخزن", true)}
          {inp("password", w ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور", true, "password")}
        </div>
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">{busy && <Loader2 className="size-4 animate-spin" />} حفظ</button>
      </form>
    </Modal>
  );
}
