"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import { EmptyState, PageHeader, Panel } from "./ui";
import { useAdminStore } from "@/store/adminDash";
import { mergedMedicines } from "@/lib/adminData";
import { normalizeAr } from "@/lib/search";
import { toast } from "@/store/toast";
import type { Medicine } from "@/types";

const PER = 10;
const blank: Omit<Medicine, "id"> = { nameAr: "", nameEn: "", strength: "", form: "أقراص", pack: "", category: "", aliases: [] };

export default function AdminMedicines() {
  const { customMedicines, medicineEdits, addMedicine, editMedicine } = useAdminStore();
  const list = useMemo(() => mergedMedicines(customMedicines, medicineEdits), [customMedicines, medicineEdits]);
  const cats = useMemo(() => Array.from(new Set(list.map((m) => m.category))).sort(), [list]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Medicine | "new" | null>(null);
  const [form, setForm] = useState<Omit<Medicine, "id">>(blank);
  const [aliases, setAliases] = useState("");
  const [err, setErr] = useState("");

  const filtered = useMemo(() => {
    const nq = normalizeAr(q);
    return list.filter((m) => (!cat || m.category === cat) && (!nq || normalizeAr(`${m.nameAr} ${m.nameEn} ${m.aliases.join(" ")}`).includes(nq)));
  }, [list, q, cat]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pageCount);

  const open = (m: Medicine | "new") => {
    const base = m === "new" ? blank : m;
    setForm({ nameAr: base.nameAr, nameEn: base.nameEn, strength: base.strength, form: base.form, pack: base.pack, category: base.category, aliases: base.aliases });
    setAliases(base.aliases.join("، "));
    setErr("");
    setEditing(m);
  };

  const save = () => {
    if (form.nameAr.trim().length < 2) return setErr("اكتب الاسم بالعربية");
    if (form.nameEn.trim().length < 2) return setErr("اكتب الاسم بالإنجليزية");
    if (!form.category.trim()) return setErr("اكتب التصنيف");
    const data = {
      ...form,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      category: form.category.trim(),
      aliases: aliases.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
    };
    if (editing === "new") {
      addMedicine(data);
      toast("تمت إضافة الدواء إلى الفهرس.", "success");
    } else if (editing) {
      editMedicine(editing.id, data);
      toast("تم تحديث بيانات الدواء.", "success");
    }
    setEditing(null);
  };

  const set = (k: keyof Omit<Medicine, "id" | "aliases">) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader
        title="فهرس الأدوية"
        subtitle="فهرس مرجعي فقط. لا توجد اقتراحات بدائل أو نصائح علاجية."
        actions={
          <button type="button" onClick={() => open("new")} className="btn-primary !py-2.5">
            <Plus className="size-4" /> دواء جديد
          </button>
        }
      />
      <Panel>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input aria-label="بحث" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="ابحث بالاسم أو الاسم التجاري…" className="field !ps-10" />
          </div>
          <select aria-label="التصنيف" value={cat} onChange={(e) => (setCat(e.target.value), setPage(1))} className="field !w-auto">
            <option value="">كل التصنيفات</option>
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="mt-5">
          {filtered.length === 0 ? (
            <EmptyState title="لا نتائج" text="جرّب كلمة بحث أخرى." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-xs font-extrabold text-muted">
                    <th className="py-2 text-start">الدواء</th>
                    <th className="text-start">الشكل والتركيز</th>
                    <th className="text-start">التصنيف</th>
                    <th className="text-start">أسماء أخرى</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice((cur - 1) * PER, cur * PER).map((m) => (
                    <tr key={m.id} className="border-b border-navy/5 last:border-0">
                      <td className="py-3 pe-3">
                        <p className="font-extrabold">{m.nameAr}</p>
                        <p dir="ltr" className="text-start text-xs font-medium text-muted">{m.nameEn}</p>
                      </td>
                      <td className="pe-3 text-xs font-semibold">{[m.form, m.strength, m.pack].filter(Boolean).join(" · ")}</td>
                      <td className="pe-3 text-xs font-semibold">{m.category}</td>
                      <td className="pe-3 text-xs font-medium text-muted">{m.aliases.join("، ") || "—"}</td>
                      <td>
                        <button type="button" aria-label={`تعديل ${m.nameAr}`} onClick={() => open(m)} className="grid size-8 place-items-center rounded-full border border-navy/10 transition hover:bg-ice">
                          <Pencil className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Pagination page={cur} pageCount={pageCount} onChange={setPage} total={filtered.length} />
        </div>
      </Panel>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "دواء جديد" : "تعديل الدواء"}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn-light !py-2.5">إلغاء</button>
            <button type="button" onClick={save} className="btn-primary !py-2.5">حفظ</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["nameAr", "الاسم بالعربية"],
            ["nameEn", "الاسم بالإنجليزية"],
            ["strength", "التركيز"],
            ["form", "الشكل الدوائي"],
            ["pack", "العبوة"],
            ["category", "التصنيف"],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`m-${k}`} className="mb-1.5 block text-xs font-extrabold text-muted">{label}</label>
              <input id={`m-${k}`} value={form[k]} onChange={set(k)} className="field" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label htmlFor="m-al" className="mb-1.5 block text-xs font-extrabold text-muted">أسماء بديلة للبحث (مفصولة بفاصلة)</label>
            <input id="m-al" value={aliases} onChange={(e) => setAliases(e.target.value)} className="field" />
          </div>
        </div>
        {err && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">{err}</p>}
      </Modal>
    </>
  );
}
