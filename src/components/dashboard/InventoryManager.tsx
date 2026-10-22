"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownAZ, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState, PageHeader } from "./ui";
import { useDashStore, type StockItem } from "@/store/pharmacyDash";
import { useAdminStore } from "@/store/adminDash";
import { medicines as baseMedicines } from "@/data/medicines";
import { normalizeAr } from "@/lib/search";
import { effectiveStatus, STATUS_META, STATUS_ORDER } from "@/lib/status";
import { formatAgo, cn } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { AvailabilityStatus, RawStatus } from "@/types";

const PAGE = 8;
type SortKey = "name" | "status" | "updated";
const RAW: RawStatus[] = ["available", "limited", "out", "unconfirmed"];

export default function InventoryManager() {
  const { stock, branches, activeBranchId, setActiveBranch, addStock, updateStock, removeStock, setStatusBulk } = useDashStore();
  const custom = useAdminStore((s) => s.customMedicines);
  const edits = useAdminStore((s) => s.medicineEdits);
  const catalog = useMemo(() => [...custom, ...baseMedicines].map((m) => ({ ...m, ...(edits[m.id] ?? {}) })), [custom, edits]);
  const nameOf = (id: string) => catalog.find((m) => m.id === id);

  const items = useMemo(() => stock[activeBranchId] ?? [], [stock, activeBranchId]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<AvailabilityStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<StockItem | "new" | null>(null);
  const [confirm, setConfirm] = useState<string[] | null>(null);

  // form state
  const [fMed, setFMed] = useState("");
  const [fStatus, setFStatus] = useState<RawStatus>("available");
  const [fQty, setFQty] = useState(10);
  const [fErr, setFErr] = useState("");

  const hoursAgo = (t: number) => (Date.now() - t) / 3_600_000;

  const rows = useMemo(() => {
    const n = normalizeAr(q);
    const list = items
      .map((it) => ({ it, m: nameOf(it.medicineId), eff: effectiveStatus(it.status, (Date.now() - it.updatedAt) / 3_600_000) }))
      .filter((x) => x.m)
      .filter((x) => filter === "all" || x.eff === filter)
      .filter((x) => !n || normalizeAr(`${x.m!.nameAr} ${x.m!.nameEn}`).includes(n));
    list.sort((a, b) => {
      if (sort === "name") return a.m!.nameAr.localeCompare(b.m!.nameAr, "ar");
      if (sort === "status") return STATUS_ORDER.indexOf(a.eff) - STATUS_ORDER.indexOf(b.eff);
      return b.it.updatedAt - a.it.updatedAt;
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, filter, sort, catalog]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  useEffect(() => setSelected([]), [activeBranchId]);

  const view = rows.slice((page - 1) * PAGE, page * PAGE);
  const allOnPage = view.length > 0 && view.every((r) => selected.includes(r.it.id));

  const openNew = () => {
    setFMed("");
    setFStatus("available");
    setFQty(10);
    setFErr("");
    setEditing("new");
  };
  const openEdit = (it: StockItem) => {
    setFMed(it.medicineId);
    setFStatus(it.status);
    setFQty(it.qty);
    setFErr("");
    setEditing(it);
  };

  const save = () => {
    if (!fMed) return setFErr("اختر الدواء");
    if (!Number.isFinite(fQty) || fQty < 0) return setFErr("الكمية لازم تكون رقمًا صحيحًا أكبر من أو يساوي صفر");
    const qty = fStatus === "out" ? 0 : fQty;
    if (editing === "new") {
      if (items.some((i) => i.medicineId === fMed)) return setFErr("الدواء موجود بالفعل في مخزون هذا الفرع، عدّله بدل إضافته.");
      addStock(activeBranchId, { medicineId: fMed, status: fStatus, qty });
      toast("تمت إضافة الدواء للمخزون.", "success");
    } else if (editing) {
      updateStock(activeBranchId, editing.id, { medicineId: fMed, status: fStatus, qty });
      toast("تم تحديث الدواء.", "success");
    }
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="إدارة المخزون"
        subtitle="حدّث حالة كل دواء. العملاء بيشوفوا وقت آخر تحديث، والبيانات القديمة بتتعلّم تلقائيًا."
        actions={
          <>
            {branches.length > 1 && (
              <select aria-label="الفرع" value={activeBranchId} onChange={(e) => setActiveBranch(e.target.value)} className="field !w-auto !py-2 text-sm">
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={openNew} className="btn-primary !py-2.5">
              <Plus className="size-4" /> إضافة دواء
            </button>
          </>
        }
      />

      <div className="rounded-[1.5rem] border border-navy/[0.07] bg-white shadow-soft">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-navy/5 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <label htmlFor="inv-q" className="sr-only">
              بحث في المخزون
            </label>
            <input id="inv-q" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="ابحث باسم الدواء…" className="field !py-2 !ps-9 text-sm" />
          </div>
          <select aria-label="تصفية الحالة" value={filter} onChange={(e) => (setFilter(e.target.value as AvailabilityStatus | "all"), setPage(1))} className="field !w-auto !py-2 text-sm">
            <option value="all">كل الحالات</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
            <ArrowDownAZ className="size-4" />
            <select aria-label="الترتيب" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field !w-auto !py-2 text-sm">
              <option value="updated">الأحدث تحديثًا</option>
              <option value="name">الاسم</option>
              <option value="status">الحالة</option>
            </select>
          </label>
        </div>

        {/* bulk bar */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 bg-brand-mint/50 px-4 py-3 text-sm">
                <span className="font-extrabold">{selected.length.toLocaleString("ar-EG")} محدد</span>
                {RAW.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusBulk(activeBranchId, selected, s);
                      toast(`تم تغيير ${selected.length.toLocaleString("ar-EG")} عنصر إلى «${STATUS_META[s].label}».`, "success");
                      setSelected([]);
                    }}
                    className="rounded-full border border-brand/30 bg-white px-3 py-1 text-xs font-extrabold hover:bg-brand-mint"
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
                <button type="button" onClick={() => setConfirm(selected)} className="ms-auto flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-extrabold text-white hover:bg-rose-700">
                  <Trash2 className="size-3.5" /> حذف
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-navy/5 text-xs font-extrabold text-muted">
                <th className="w-12 p-4 text-start">
                  <input
                    type="checkbox"
                    aria-label="تحديد الكل"
                    checked={allOnPage}
                    onChange={() => setSelected(allOnPage ? selected.filter((id) => !view.some((r) => r.it.id === id)) : Array.from(new Set([...selected, ...view.map((r) => r.it.id)])))}
                    className="size-4 accent-[#008F73]"
                  />
                </th>
                <th className="p-4 text-start">الدواء</th>
                <th className="p-4 text-start">الحالة</th>
                <th className="p-4 text-start">الكمية</th>
                <th className="p-4 text-start">آخر تحديث</th>
                <th className="p-4 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {view.map(({ it, m, eff }) => (
                  <motion.tr
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className={cn("border-b border-navy/5 last:border-0", selected.includes(it.id) && "bg-brand-mint/30")}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        aria-label={`تحديد ${m!.nameAr}`}
                        checked={selected.includes(it.id)}
                        onChange={() => setSelected((s) => (s.includes(it.id) ? s.filter((x) => x !== it.id) : [...s, it.id]))}
                        className="size-4 accent-[#008F73]"
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-extrabold">{m!.nameAr}</p>
                      <p className="text-xs font-medium text-muted">
                        {m!.form} · {m!.pack}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge status={eff} />
                        <select
                          aria-label={`تغيير حالة ${m!.nameAr}`}
                          value={it.status}
                          onChange={(e) => {
                            const s = e.target.value as RawStatus;
                            updateStock(activeBranchId, it.id, { status: s, qty: s === "out" ? 0 : it.qty });
                            toast(`تم تغيير الحالة إلى «${STATUS_META[s].label}».`, "success");
                          }}
                          className="rounded-lg border border-navy/10 bg-white px-2 py-1 text-[11px] font-bold outline-none focus:border-brand"
                        >
                          {RAW.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-4 font-bold tabular-nums">{it.qty.toLocaleString("ar-EG")}</td>
                    <td className="p-4 text-xs font-bold text-muted">{formatAgo(hoursAgo(it.updatedAt))}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button type="button" aria-label={`تعديل ${m!.nameAr}`} onClick={() => openEdit(it)} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-navy/5 hover:text-navy">
                          <Pencil className="size-4" />
                        </button>
                        <button type="button" aria-label={`حذف ${m!.nameAr}`} onClick={() => setConfirm([it.id])} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {view.length === 0 && (
            <div className="p-6">
              <EmptyState
                title="لا توجد أدوية مطابقة"
                text="جرّب تغيير البحث أو الفلتر، أو أضف دواءً جديدًا."
                action={
                  <button type="button" onClick={openNew} className="btn-primary !py-2">
                    إضافة دواء
                  </button>
                }
              />
            </div>
          )}
        </div>
        <div className="border-t border-navy/5 p-4">
          <Pagination page={page} pageCount={pageCount} onChange={setPage} total={rows.length} />
        </div>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "إضافة دواء للمخزون" : "تعديل الدواء"}
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
        <div className="space-y-4">
          <div>
            <label htmlFor="im-med" className="mb-1.5 block text-xs font-extrabold text-muted">
              الدواء
            </label>
            <select id="im-med" value={fMed} onChange={(e) => setFMed(e.target.value)} className="field">
              <option value="">اختر من الكتالوج</option>
              {catalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nameAr} — {m.form}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="im-status" className="mb-1.5 block text-xs font-extrabold text-muted">
                الحالة
              </label>
              <select id="im-status" value={fStatus} onChange={(e) => setFStatus(e.target.value as RawStatus)} className="field">
                {RAW.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="im-qty" className="mb-1.5 block text-xs font-extrabold text-muted">
                الكمية (للصيدلية فقط)
              </label>
              <input id="im-qty" type="number" min={0} value={fQty} disabled={fStatus === "out"} onChange={(e) => setFQty(Number(e.target.value))} className="field" />
            </div>
          </div>
          {fErr && (
            <p role="alert" className="text-xs font-bold text-rose-600">
              {fErr}
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title="تأكيد الحذف"
        message={`سيتم حذف ${(confirm?.length ?? 0).toLocaleString("ar-EG")} عنصر من مخزون هذا الفرع. لا يمكن التراجع عن ذلك.`}
        confirmLabel="حذف"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            removeStock(activeBranchId, confirm);
            setSelected((s) => s.filter((x) => !confirm.includes(x)));
            toast("تم الحذف.", "success");
          }
        }}
      />
    </>
  );
}
