"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "./ui";
import { useAdminStore } from "@/store/adminDash";
import { mergedAreas, mergedDistricts } from "@/lib/adminData";
import { governorates } from "@/data/locations";
import { pharmacies } from "@/data/pharmacies";
import { toast } from "@/store/toast";

export default function AdminGeography() {
  const { extraDistricts, extraAreas, registered, addDistrict, addArea, removeExtra } = useAdminStore();
  const dists = mergedDistricts(extraDistricts);
  const areas = mergedAreas(extraAreas, dists);
  const [newD, setNewD] = useState("");
  const [newA, setNewA] = useState<Record<string, string>>({});
  const countFor = (districtId: string) => pharmacies.filter((p) => p.districtId === districtId).length + registered.filter((r) => r.districtId === districtId).length;

  return (
    <>
      <PageHeader title="الجغرافيا" subtitle="المحافظة والمراكز والمناطق. الإضافات تُحفظ في متصفحك فقط." />
      <Panel title={`محافظة ${governorates[0].nameAr}`} action={<span className="text-xs font-bold text-muted">{dists.length.toLocaleString("ar-EG")} مركز · {areas.length.toLocaleString("ar-EG")} منطقة</span>}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = newD.trim();
            if (v.length < 2) return toast("اكتب اسم المركز.");
            addDistrict(v);
            setNewD("");
            toast("تمت إضافة المركز.", "success");
          }}
          className="flex gap-2"
        >
          <input aria-label="مركز جديد" value={newD} onChange={(e) => setNewD(e.target.value)} placeholder="مركز جديد…" className="field" />
          <button type="submit" className="btn-primary !py-2.5 shrink-0">
            <Plus className="size-4" /> إضافة
          </button>
        </form>
      </Panel>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dists.map((d) => {
          const list = areas.filter((a) => a.districtId === d.id);
          return (
            <section key={d.id} className="rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-black">{d.nameAr}</h2>
                  <p className="text-xs font-semibold text-muted">{countFor(d.id).toLocaleString("ar-EG")} صيدلية</p>
                </div>
                {"extra" in d && d.extra && (
                  <button type="button" aria-label={`حذف ${d.nameAr}`} onClick={() => (removeExtra("district", d.id), toast("تم حذف المركز."))} className="grid size-8 place-items-center rounded-full text-rose-600 transition hover:bg-rose-50">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {list.map((a) => (
                  <li key={a.id} className="flex items-center gap-1 rounded-full bg-ice px-3 py-1 text-xs font-bold">
                    <MapPin className="size-3 text-brand" />
                    {a.shortAr}
                    {"extra" in a && a.extra && (
                      <button type="button" aria-label={`حذف ${a.shortAr}`} onClick={() => removeExtra("area", a.id)} className="ms-1 text-rose-600">
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (newA[d.id] ?? "").trim();
                  if (v.length < 2) return toast("اكتب اسم المنطقة.");
                  addArea(d.id, v);
                  setNewA({ ...newA, [d.id]: "" });
                  toast("تمت إضافة المنطقة.", "success");
                }}
                className="mt-3 flex gap-2"
              >
                <input aria-label={`منطقة جديدة في ${d.nameAr}`} value={newA[d.id] ?? ""} onChange={(e) => setNewA({ ...newA, [d.id]: e.target.value })} placeholder="منطقة جديدة…" className="field !py-2 text-sm" />
                <button type="submit" aria-label="إضافة منطقة" className="btn-light !px-3 !py-2">
                  <Plus className="size-4" />
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </>
  );
}
