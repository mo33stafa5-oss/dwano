"use client";

import { useMemo, useState } from "react";
import { MapPin, Pencil, Phone, Plus, Trash2, Clock, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PageHeader } from "./ui";
import { useDashStore, type Branch } from "@/store/pharmacyDash";
import { areasOfDistrict, districts, getArea, getDistrict } from "@/data/locations";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

const empty: Omit<Branch, "id"> = { name: "", districtId: "fayoum", areaId: "", address: "", phone: "", hours: "٩:٠٠ ص - ١٠:٠٠ م" };

export default function BranchManager() {
  const { branches, stock, activeBranchId, setActiveBranch, addBranch, updateBranch, removeBranch } = useDashStore();
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const [form, setForm] = useState<Omit<Branch, "id">>(empty);
  const [err, setErr] = useState("");
  const [del, setDel] = useState<Branch | null>(null);
  const areaOptions = useMemo(() => areasOfDistrict(form.districtId), [form.districtId]);

  const open = (b: Branch | "new") => {
    setForm(b === "new" ? empty : { name: b.name, districtId: b.districtId, areaId: b.areaId, address: b.address, phone: b.phone, hours: b.hours });
    setErr("");
    setEditing(b);
  };

  const save = () => {
    if (form.name.trim().length < 3) return setErr("اسم الفرع ٣ أحرف على الأقل");
    if (!form.areaId) return setErr("اختر المنطقة");
    if (form.address.trim().length < 6) return setErr("اكتب العنوان بالتفصيل");
    if (!/^01[0125]\d{8}$/.test(form.phone.trim())) return setErr("اكتب رقم موبايل مصريًا صحيحًا (١١ رقم)");
    if (editing === "new") {
      addBranch({ ...form, name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim() });
      toast("تمت إضافة الفرع بمخزون مستقل.", "success");
    } else if (editing) {
      updateBranch(editing.id, { ...form, name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim() });
      toast("تم تحديث الفرع.", "success");
    }
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="إدارة الفروع"
        subtitle="لكل فرع مخزونه وموقعه المستقل. اختر الفرع النشط لإدارة مخزونه."
        actions={
          <button type="button" onClick={() => open("new")} className="btn-primary !py-2.5">
            <Plus className="size-4" /> فرع جديد
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => {
          const active = b.id === activeBranchId;
          return (
            <div key={b.id} className={cn("rounded-[1.5rem] border bg-white p-5 shadow-soft transition", active ? "border-brand shadow-glow" : "border-navy/[0.07]")}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-black">{b.name}</h2>
                {active && (
                  <span className="flex items-center gap-1 rounded-full bg-brand-mint px-2.5 py-0.5 text-[11px] font-extrabold text-brand-deep">
                    <Check className="size-3" /> الفرع النشط
                  </span>
                )}
              </div>
              <ul className="mt-3 space-y-1.5 text-xs font-semibold text-muted">
                <li className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0" /> {getDistrict(b.districtId)?.nameAr} · {getArea(b.areaId)?.shortAr} · {b.address}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5" /> {b.phone}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-3.5" /> {b.hours}
                </li>
              </ul>
              <p className="mt-3 rounded-xl bg-ice px-3 py-2 text-xs font-extrabold">{(stock[b.id]?.length ?? 0).toLocaleString("ar-EG")} دواء في المخزون</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!active && (
                  <button type="button" onClick={() => (setActiveBranch(b.id), toast(`الفرع النشط الآن: ${b.name}`))} className="btn-light !px-4 !py-2 text-xs">
                    تعيين كنشط
                  </button>
                )}
                <button type="button" onClick={() => open(b)} className="btn-light !px-4 !py-2 text-xs">
                  <Pencil className="size-3.5" /> تعديل
                </button>
                {branches.length > 1 && (
                  <button type="button" onClick={() => setDel(b)} className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50">
                    <Trash2 className="size-3.5" /> حذف
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "فرع جديد" : "تعديل الفرع"}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn-light !py-2.5">
              إلغاء
            </button>
            <button type="button" onClick={save} className="btn-primary !py-2.5">
              حفظ
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="b-name" className="mb-1.5 block text-xs font-extrabold text-muted">
              اسم الفرع
            </label>
            <input id="b-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
          </div>
          <div>
            <label htmlFor="b-d" className="mb-1.5 block text-xs font-extrabold text-muted">
              المركز
            </label>
            <select id="b-d" value={form.districtId} onChange={(e) => setForm({ ...form, districtId: e.target.value, areaId: "" })} className="field">
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameAr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="b-a" className="mb-1.5 block text-xs font-extrabold text-muted">
              المنطقة
            </label>
            <select id="b-a" value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })} className="field">
              <option value="">اختر المنطقة</option>
              {areaOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.shortAr}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="b-addr" className="mb-1.5 block text-xs font-extrabold text-muted">
              العنوان
            </label>
            <input id="b-addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" />
          </div>
          <div>
            <label htmlFor="b-phone" className="mb-1.5 block text-xs font-extrabold text-muted">
              الهاتف
            </label>
            <input id="b-phone" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field text-start" />
          </div>
          <div>
            <label htmlFor="b-hours" className="mb-1.5 block text-xs font-extrabold text-muted">
              مواعيد العمل
            </label>
            <input id="b-hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="field" />
          </div>
        </div>
        {err && (
          <p role="alert" className="mt-3 text-xs font-bold text-rose-600">
            {err}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={del !== null}
        title="حذف الفرع"
        message={`سيتم حذف «${del?.name}» ومخزونه بالكامل. لا يمكن التراجع عن ذلك.`}
        confirmLabel="حذف الفرع"
        danger
        onClose={() => setDel(null)}
        onConfirm={() => {
          if (del) {
            removeBranch(del.id);
            toast("تم حذف الفرع.", "success");
          }
        }}
      />
    </>
  );
}
