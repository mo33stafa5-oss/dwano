"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, MessageCircle, Phone, Pill, Search, ShieldCheck, Store } from "lucide-react";
import MapLoader from "@/components/maps/MapLoader";
import StatusBadge from "@/components/ui/StatusBadge";
import Reveal from "@/components/animations/Reveal";
import { getArea, getDistrict } from "@/data/locations";
import { inventory } from "@/data/inventory";
import { getMedicine } from "@/data/medicines";
import { effectiveStatus, MEDICAL_DISCLAIMER, STATUS_ORDER } from "@/lib/status";
import { normalizeAr } from "@/lib/search";
import { formatAgo, formatPhone } from "@/lib/utils";
import { demoToast } from "@/store/toast";
import type { Pharmacy } from "@/types";

export default function PharmacyProfile({ pharmacy }: { pharmacy: Pharmacy }) {
  const [q, setQ] = useState("");
  const area = getArea(pharmacy.areaId);
  const district = getDistrict(pharmacy.districtId);

  const rows = useMemo(() => {
    const n = normalizeAr(q);
    return inventory
      .filter((r) => r.pharmacyId === pharmacy.id)
      .map((r) => ({ r, m: getMedicine(r.medicineId)!, status: effectiveStatus(r.status, r.hoursAgo) }))
      .filter((x) => x.m && (!n || normalizeAr(`${x.m.nameAr} ${x.m.nameEn}`).includes(n)))
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.r.hoursAgo - b.r.hoursAgo);
  }, [pharmacy.id, q]);

  return (
    <div className="bg-ice pb-24 pt-24">
      <div className="mx-auto max-w-6xl px-5">
        <Link href="/search" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand">
          <ArrowRight className="size-4" /> العودة للبحث
        </Link>

        <Reveal>
          <div className="overflow-hidden rounded-[2rem] border border-navy/10 bg-white shadow-soft">
            <div
              className="h-36 sm:h-48"
              style={{ background: `linear-gradient(120deg, hsl(${pharmacy.hue} 70% 32%), hsl(${pharmacy.hue + 30} 80% 22%))` }}
            >
              <div className="grid-lines h-full w-full opacity-60" />
            </div>
            <div className="relative px-6 pb-7 sm:px-9">
              <span
                className="-mt-10 grid size-20 place-items-center rounded-3xl border-4 border-white text-white shadow-lift"
                style={{ background: `linear-gradient(135deg, hsl(${pharmacy.hue} 70% 42%), hsl(${pharmacy.hue + 25} 75% 28%))` }}
              >
                <Store className="size-9" />
              </span>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black">{pharmacy.nameAr}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted">
                    <MapPin className="size-4" /> {pharmacy.address}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    الفيوم · {district?.nameAr} · {area?.nameAr}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => demoToast(`رقم تجريبي: ${formatPhone(pharmacy.phone)} — لن يتم الاتصال فعليًا.`)}
                    className="btn-primary !py-2.5"
                  >
                    <Phone className="size-4" /> اتصال
                  </button>
                  <button
                    type="button"
                    onClick={() => demoToast("واتساب تجريبي: لن يتم فتح محادثة فعلية في نسخة العرض.")}
                    className="btn-light !py-2.5"
                  >
                    <MessageCircle className="size-4" /> واتساب
                  </button>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["مواعيد العمل", pharmacy.hours],
                  ["رقم الهاتف (تجريبي)", formatPhone(pharmacy.phone)],
                  ["الأدوية المُبلَّغ عنها", `${rows.length.toLocaleString("ar-EG")} دواء`],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-2xl bg-ice px-4 py-3">
                    <p className="text-[11px] font-bold text-muted">{l}</p>
                    <p className="mt-0.5 text-sm font-extrabold">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-semibold text-muted/70">صيدلية خيالية · بيانات تجريبية ولا تمثل نشاطًا تجاريًا حقيقيًا.</p>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <div className="rounded-[2rem] border border-navy/10 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-black">الأدوية التي أعلنت الصيدلية عنها</h2>
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <label htmlFor="pp-q" className="sr-only">
                    ابحث في أدوية الصيدلية
                  </label>
                  <input id="pp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في الأدوية…" className="field !w-56 !py-2 !ps-9" />
                </div>
              </div>
              <ul className="mt-4 divide-y divide-navy/5">
                {rows.length === 0 && <li className="py-10 text-center text-sm font-semibold text-muted">لا توجد أدوية مطابقة.</li>}
                {rows.map(({ r, m, status }) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link href={`/medicine/${m.id}`} className="flex items-center gap-2.5 text-sm font-extrabold hover:text-brand">
                      <span className="grid size-9 place-items-center rounded-xl bg-brand-mint text-brand-deep">
                        <Pill className="size-4" />
                      </span>
                      <span>
                        {m.nameAr}
                        <span className="block text-[11px] font-medium text-muted">
                          {m.form} · {m.pack}
                        </span>
                      </span>
                    </Link>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs font-bold text-muted">
                        <Clock className="size-3.5" /> {formatAgo(r.hoursAgo)}
                      </span>
                      <StatusBadge status={status} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-4">
              <div className="h-[320px]">
                <MapLoader
                  points={[{ id: pharmacy.id, lat: pharmacy.lat, lng: pharmacy.lng, status: "available", title: pharmacy.nameAr, subtitle: pharmacy.address }]}
                  selectedId={pharmacy.id}
                  className="h-full w-full"
                  zoom={14}
                />
              </div>
              <p className="flex items-start gap-2 rounded-2xl border border-navy/10 bg-white p-4 text-xs font-semibold leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {MEDICAL_DISCLAIMER}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
