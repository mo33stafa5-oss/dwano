"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader, Panel } from "./ui";
import { useAdminStore } from "@/store/adminDash";
import { ADMIN_STATUS_META, buildPharmacyRows, mergedMedicines } from "@/lib/adminData";
import { districts, getArea, getDistrict } from "@/data/locations";
import { inventory } from "@/data/inventory";
import { effectiveStatus, STATUS_META } from "@/lib/status";
import { downloadCsv } from "@/lib/csv";
import { toast } from "@/store/toast";

type Kind = "pharmacies" | "inventory" | "medicines";

export default function AdminReports() {
  const { statusOverrides, registered, customMedicines, medicineEdits } = useAdminStore();
  const [kind, setKind] = useState<Kind>("pharmacies");
  const [dist, setDist] = useState("");

  const rows = useMemo(() => {
    if (kind === "pharmacies") {
      return buildPharmacyRows(statusOverrides, registered)
        .filter((r) => !dist || r.districtId === dist)
        .map((r) => ({
          "الاسم": r.nameAr,
          "المالك": r.owner,
          "المركز": getDistrict(r.districtId)?.nameAr ?? "",
          "المنطقة": getArea(r.areaId)?.shortAr ?? "",
          "العنوان": r.address,
          "الحالة": ADMIN_STATUS_META[r.status].label,
          "المصدر": r.source === "registered" ? "تسجيل جديد" : "ديمو",
        }));
    }
    const meds = mergedMedicines(customMedicines, medicineEdits);
    if (kind === "medicines") {
      return meds.map((m) => ({ "الاسم": m.nameAr, "English": m.nameEn, "التركيز": m.strength, "الشكل": m.form, "العبوة": m.pack, "التصنيف": m.category }));
    }
    const ph = new Map(buildPharmacyRows(statusOverrides, registered).map((r) => [r.id, r]));
    const md = new Map(meds.map((m) => [m.id, m]));
    return inventory
      .filter((i) => ph.has(i.pharmacyId) && (!dist || ph.get(i.pharmacyId)!.districtId === dist))
      .map((i) => ({
        "الصيدلية": ph.get(i.pharmacyId)!.nameAr,
        "الدواء": md.get(i.medicineId)?.nameAr ?? i.medicineId,
        "الحالة": STATUS_META[effectiveStatus(i.status, i.hoursAgo)].label,
        "آخر تحديث (ساعات)": i.hoursAgo,
      }));
  }, [kind, dist, statusOverrides, registered, customMedicines, medicineEdits]);

  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const names: Record<Kind, string> = { pharmacies: "الصيدليات", inventory: "سجلات المخزون", medicines: "الأدوية" };

  return (
    <>
      <PageHeader
        title="التقارير"
        subtitle="صدّر البيانات كملف CSV (يفتح في Excel بالعربية)."
        actions={
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => (downloadCsv(`dwano-${kind}.csv`, rows), toast(`تم تجهيز ملف ${names[kind]}.`, "success"))}
            className="btn-primary !py-2.5 disabled:opacity-50"
          >
            <Download className="size-4" /> تصدير CSV
          </button>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <select aria-label="نوع التقرير" value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="field !w-auto">
            {(Object.keys(names) as Kind[]).map((k) => (
              <option key={k} value={k}>{names[k]}</option>
            ))}
          </select>
          {kind !== "medicines" && (
            <select aria-label="المركز" value={dist} onChange={(e) => setDist(e.target.value)} className="field !w-auto">
              <option value="">كل المراكز</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.nameAr}</option>
              ))}
            </select>
          )}
          <span className="text-xs font-bold text-muted">{rows.length.toLocaleString("ar-EG")} صف</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs font-extrabold text-muted">
                {cols.map((c) => (
                  <th key={c} className="py-2 text-start">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((r, i) => (
                <tr key={i} className="border-b border-navy/5 last:border-0">
                  {cols.map((c) => (
                    <td key={c} className="py-2.5 pe-3 text-xs font-semibold">{String((r as Record<string, string | number>)[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 12 && <p className="mt-3 text-xs font-semibold text-muted">معاينة أول ١٢ صفًا فقط. الملف المُصدَّر يحوي كل الصفوف.</p>}
      </Panel>
    </>
  );
}
