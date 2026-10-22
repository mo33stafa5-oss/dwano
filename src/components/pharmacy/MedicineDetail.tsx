"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Pill, ShieldCheck, Store } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Reveal from "@/components/animations/Reveal";
import { searchInventory } from "@/lib/search";
import { getArea } from "@/data/locations";
import { MEDICAL_DISCLAIMER, STATUS_META, STATUS_ORDER } from "@/lib/status";
import { formatAgo } from "@/lib/utils";
import type { AvailabilityStatus, Medicine } from "@/types";

export default function MedicineDetail({ medicine }: { medicine: Medicine }) {
  const hits = useMemo(() => searchInventory({ medicineId: medicine.id, scope: "governorate" }), [medicine.id]);
  const counts = STATUS_ORDER.map((s) => [s, hits.filter((h) => h.status === s).length] as [AvailabilityStatus, number]);

  return (
    <div className="bg-ice pb-24 pt-24">
      <div className="mx-auto max-w-5xl px-5">
        <Link href="/search" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand">
          <ArrowRight className="size-4" /> العودة للبحث
        </Link>
        <Reveal>
          <div className="rounded-[2rem] border border-navy/10 bg-white p-7 shadow-soft sm:p-9">
            <div className="flex items-start gap-4">
              <span className="grid size-16 place-items-center rounded-3xl bg-brand text-white shadow-glow">
                <Pill className="size-8" />
              </span>
              <div>
                <h1 className="text-3xl font-black">{medicine.nameAr}</h1>
                <p className="mt-0.5 text-sm font-semibold text-muted" dir="ltr">
                  {medicine.nameEn} · {medicine.strength}
                </p>
              </div>
            </div>
            <dl className="mt-7 grid gap-3 sm:grid-cols-4">
              {[
                ["التركيز", medicine.strength],
                ["الشكل الدوائي", medicine.form],
                ["العبوة", medicine.pack],
                ["الفئة", medicine.category],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-ice px-4 py-3">
                  <dt className="text-[11px] font-bold text-muted">{l}</dt>
                  <dd className="mt-0.5 text-sm font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs font-semibold leading-relaxed text-muted">
              دوانو لا تقدّم نصائح طبية ولا ترشّح بدائل. اسأل الصيدلي أو الطبيب عن الاستخدام المناسب.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-5 flex flex-wrap gap-2">
            {counts.map(([s, n]) => (
              <span key={s} className="flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-1.5 text-xs font-extrabold">
                <span className={`size-2 rounded-full ${STATUS_META[s].dot}`} />
                {STATUS_META[s].label}
                <span className="text-muted">{n.toLocaleString("ar-EG")}</span>
              </span>
            ))}
          </div>
        </Reveal>

        <h2 className="mb-4 mt-8 text-xl font-black">الصيدليات التي أعلنت عن هذا الدواء</h2>
        {hits.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-navy/15 bg-white/60 py-16 text-center text-sm font-semibold text-muted">
            لا توجد صيدليات تجريبية أعلنت عن هذا الدواء حاليًا.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {hits.map((h, i) => (
              <Reveal key={h.record.id} delay={Math.min(i, 6) * 0.04}>
                <Link href={`/pharmacies/${h.pharmacy.id}`} className="card flex items-center justify-between gap-3 p-4 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift">
                  <span className="flex items-center gap-3">
                    <span
                      className="grid size-11 place-items-center rounded-2xl text-white"
                      style={{ background: `linear-gradient(135deg, hsl(${h.pharmacy.hue} 70% 42%), hsl(${h.pharmacy.hue + 25} 75% 28%))` }}
                    >
                      <Store className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold">{h.pharmacy.nameAr}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted">
                        <MapPin className="size-3" /> {getArea(h.pharmacy.areaId)?.nameAr}
                        <Clock className="ms-2 size-3" /> {formatAgo(h.record.hoursAgo)}
                      </span>
                    </span>
                  </span>
                  <StatusBadge status={h.status} />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
        <p className="mt-8 flex items-start gap-2 rounded-2xl border border-navy/10 bg-white p-4 text-xs font-semibold leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {MEDICAL_DISCLAIMER} كل الصيدليات خيالية.
        </p>
      </div>
    </div>
  );
}
