"use client";

import { useMemo, useState } from "react";
import { Check, Pause, Play, Search, X } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { EmptyState, PageHeader, Panel } from "./ui";
import { useAdminStore, type PharmacyAdminStatus } from "@/store/adminDash";
import { ADMIN_STATUS_META, buildPharmacyRows, type AdminPharmacyRow } from "@/lib/adminData";
import { districts, getArea, getDistrict } from "@/data/locations";
import { normalizeAr } from "@/lib/search";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

const PER = 10;
const TABS: ("all" | PharmacyAdminStatus)[] = ["all", "pending", "active", "suspended", "rejected"];

export default function AdminPharmacies() {
  const { statusOverrides, registered, setPharmacyStatus } = useAdminStore();
  const rows = useMemo(() => buildPharmacyRows(statusOverrides, registered), [statusOverrides, registered]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [dist, setDist] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<AdminPharmacyRow | null>(null);
  const [confirm, setConfirm] = useState<{ row: AdminPharmacyRow; to: PharmacyAdminStatus } | null>(null);

  const filtered = useMemo(() => {
    const nq = normalizeAr(q);
    return rows.filter((r) => (tab === "all" || r.status === tab) && (!dist || r.districtId === dist) && (!nq || normalizeAr(`${r.nameAr} ${r.owner} ${r.address}`).includes(nq)));
  }, [rows, q, tab, dist]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pageCount);
  const slice = filtered.slice((cur - 1) * PER, cur * PER);

  const apply = (row: AdminPharmacyRow, to: PharmacyAdminStatus) => {
    setPharmacyStatus(row.id, to);
    toast(`تم تحديث «${row.nameAr}» إلى: ${ADMIN_STATUS_META[to].label}`, "success");
  };

  const actions = (r: AdminPharmacyRow) => {
    const btn = "grid size-8 place-items-center rounded-full border border-navy/10 transition hover:bg-ice";
    return (
      <div className="flex items-center gap-1.5">
        {(r.status === "pending" || r.status === "rejected") && (
          <button type="button" aria-label="اعتماد" title="اعتماد" onClick={() => apply(r, "active")} className={cn(btn, "text-brand")}>
            <Check className="size-4" />
          </button>
        )}
        {r.status === "pending" && (
          <button type="button" aria-label="رفض" title="رفض" onClick={() => setConfirm({ row: r, to: "rejected" })} className={cn(btn, "text-rose-600")}>
            <X className="size-4" />
          </button>
        )}
        {r.status === "active" && (
          <button type="button" aria-label="إيقاف" title="إيقاف" onClick={() => setConfirm({ row: r, to: "suspended" })} className={btn}>
            <Pause className="size-4" />
          </button>
        )}
        {r.status === "suspended" && (
          <button type="button" aria-label="إعادة تفعيل" title="إعادة تفعيل" onClick={() => apply(r, "active")} className={cn(btn, "text-brand")}>
            <Play className="size-4" />
          </button>
        )}
        <button type="button" onClick={() => setView(r)} className="rounded-full px-3 py-1.5 text-xs font-extrabold text-brand transition hover:bg-brand-mint">
          التفاصيل
        </button>
      </div>
    );
  };

  return (
    <>
      <PageHeader title="إدارة الصيدليات" subtitle="اعتماد الطلبات وإيقاف الحسابات. الصيدليات كلها تجريبية." />
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input aria-label="بحث" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="ابحث باسم الصيدلية أو المالك…" className="field !ps-10" />
          </div>
          <select aria-label="المركز" value={dist} onChange={(e) => (setDist(e.target.value), setPage(1))} className="field !w-auto">
            <option value="">كل المراكز</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameAr}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => {
            const n = t === "all" ? rows.length : rows.filter((r) => r.status === t).length;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                type="button"
                onClick={() => (setTab(t), setPage(1))}
                className={cn("rounded-full px-4 py-1.5 text-xs font-extrabold transition", tab === t ? "bg-navy text-white" : "bg-ice text-muted hover:text-navy")}
              >
                {t === "all" ? "الكل" : ADMIN_STATUS_META[t].label} · {n.toLocaleString("ar-EG")}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {slice.length === 0 ? (
            <EmptyState title="لا نتائج" text="غيّر البحث أو الفلاتر." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-start text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-xs font-extrabold text-muted">
                    <th className="py-2 text-start">الصيدلية</th>
                    <th className="text-start">المنطقة</th>
                    <th className="text-start">المصدر</th>
                    <th className="text-start">الحالة</th>
                    <th className="text-start">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r) => (
                    <tr key={r.id} className="border-b border-navy/5 last:border-0">
                      <td className="py-3 pe-3">
                        <p className="font-extrabold">{r.nameAr}</p>
                        <p className="text-xs font-medium text-muted">{r.owner}</p>
                      </td>
                      <td className="pe-3 text-xs font-semibold">
                        {getDistrict(r.districtId)?.nameAr} · {getArea(r.areaId)?.shortAr}
                      </td>
                      <td className="pe-3 text-xs font-semibold text-muted">{r.source === "registered" ? "تسجيل جديد" : "ديمو"}</td>
                      <td className="pe-3">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-extrabold", ADMIN_STATUS_META[r.status].chip)}>{ADMIN_STATUS_META[r.status].label}</span>
                      </td>
                      <td>{actions(r)}</td>
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

      <Modal open={view !== null} onClose={() => setView(null)} title={view?.nameAr ?? ""} size="sm">
        {view && (
          <dl className="space-y-3 text-sm">
            {[
              ["المالك", view.owner],
              ["الهاتف (تجريبي)", view.phone],
              ["المركز", getDistrict(view.districtId)?.nameAr ?? ""],
              ["المنطقة", getArea(view.areaId)?.shortAr ?? ""],
              ["العنوان", view.address],
              ["الحالة", ADMIN_STATUS_META[view.status].label],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-navy/5 pb-2">
                <dt className="font-bold text-muted">{k}</dt>
                <dd className="text-end font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.to === "rejected" ? "رفض الطلب؟" : "إيقاف الصيدلية؟"}
        message={`«${confirm?.row.nameAr}» ${confirm?.to === "rejected" ? "لن تظهر في نتائج البحث." : "ستختفي من نتائج البحث حتى إعادة تفعيلها."}`}
        confirmLabel={confirm?.to === "rejected" ? "رفض" : "إيقاف"}
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && apply(confirm.row, confirm.to)}
      />
    </>
  );
}
