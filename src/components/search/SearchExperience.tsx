"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, List, Map as MapIcon, MapPin, MessageCircle, Navigation, Phone, Pill, RotateCcw, Search, SearchX, ShieldCheck, SlidersHorizontal, Store, X } from "lucide-react";
import MapLoader from "@/components/maps/MapLoader";
import type { MapPoint } from "@/components/maps/PharmacyMap";
import StatusBadge from "@/components/ui/StatusBadge";
import { areasOfDistrict, districts, getArea, getDistrict, governorates } from "@/data/locations";
import { getMedicine } from "@/data/medicines";
import { searchInventory, suggestMedicines, type SearchHit, type SearchScope } from "@/lib/search";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import { haversineKm, formatKm } from "@/lib/geo";
import { cn, formatAgo, formatPhone } from "@/lib/utils";
import { demoToast } from "@/store/toast";
import { useT } from "@/hooks/useT";
import { EASE } from "@/lib/motion";
import type { AvailabilityStatus, Pharmacy } from "@/types";

type Sort = "relevance" | "fresh" | "distance";
const DISTANCES = [0, 2, 5, 10];

interface Group {
  pharmacy: Pharmacy;
  hits: SearchHit[];
  best: AvailabilityStatus;
  freshest: number;
  km: number | null;
}

export default function SearchExperience() {
  const { t } = useT();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [committed, setCommitted] = useState(params.get("q") ?? "");
  const [medicineId, setMedicineId] = useState<string | undefined>();
  const [districtId, setDistrictId] = useState(params.get("d") ?? "");
  const [areaId, setAreaId] = useState(params.get("a") ?? "");
  const [statuses, setStatuses] = useState<AvailabilityStatus[]>([]);
  const [sort, setSort] = useState<Sort>("relevance");
  const [maxKm, setMaxKm] = useState(0);
  const [scope, setScope] = useState<SearchScope>("area");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [drawer, setDrawer] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const areaOptions = useMemo(() => (districtId ? areasOfDistrict(districtId) : []), [districtId]);
  const suggestions = useMemo(() => suggestMedicines(q), [q]);

  const run = (nextQ = q, nextMed = medicineId) => {
    setCommitted(nextQ.trim());
    setMedicineId(nextMed);
    setScope("area");
    setSelected(null);
    setLoading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setLoading(false)));
    const sp = new URLSearchParams();
    if (nextQ.trim()) sp.set("q", nextQ.trim());
    if (districtId) sp.set("d", districtId);
    if (areaId) sp.set("a", areaId);
    window.history.replaceState(null, "", `/search?${sp.toString()}`);
  };

  const reference: [number, number] | null = areaId
    ? (getArea(areaId)?.center ?? null)
    : districtId
      ? (getDistrict(districtId)?.center ?? null)
      : null;

  const baseHits = useMemo(
    () => searchInventory({ q: committed, medicineId, districtId, areaId, scope }),
    [committed, medicineId, districtId, areaId, scope]
  );

  const statusCounts = useMemo(() => {
    const m = new Map<AvailabilityStatus, number>();
    const seen = new Set<string>();
    baseHits.forEach((h) => {
      const k = `${h.pharmacy.id}:${h.status}`;
      if (seen.has(k)) return;
      seen.add(k);
      m.set(h.status, (m.get(h.status) ?? 0) + 1);
    });
    return m;
  }, [baseHits]);

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const h of baseHits) {
      if (statuses.length > 0 && !statuses.includes(h.status)) continue;
      const km = reference ? haversineKm(reference, [h.pharmacy.lat, h.pharmacy.lng]) : null;
      const g = map.get(h.pharmacy.id) ?? { pharmacy: h.pharmacy, hits: [], best: h.status, freshest: h.record.hoursAgo, km };
      g.hits.push(h);
      if (STATUS_ORDER.indexOf(h.status) < STATUS_ORDER.indexOf(g.best)) g.best = h.status;
      g.freshest = Math.min(g.freshest, h.record.hoursAgo);
      map.set(h.pharmacy.id, g);
    }
    let list = [...map.values()];
    if (maxKm > 0 && reference) list = list.filter((g) => g.km !== null && g.km <= maxKm);
    list.sort((a, b) => {
      if (sort === "fresh") return a.freshest - b.freshest;
      if (sort === "distance" && a.km !== null && b.km !== null) return a.km - b.km;
      return STATUS_ORDER.indexOf(a.best) - STATUS_ORDER.indexOf(b.best) || a.freshest - b.freshest;
    });
    return list;
  }, [baseHits, statuses, maxKm, sort, reference]);

  const points: MapPoint[] = useMemo(
    () =>
      groups.map((g) => ({
        id: g.pharmacy.id,
        lat: g.pharmacy.lat,
        lng: g.pharmacy.lng,
        status: g.best,
        title: g.pharmacy.nameAr,
        subtitle: g.pharmacy.address,
      })),
    [groups]
  );

  const widerScope: SearchScope | null = scope === "area" && areaId ? "district" : scope !== "governorate" ? "governorate" : null;
  const locationLabel = areaId ? getArea(areaId)?.nameAr : districtId ? getDistrict(districtId)?.nameAr : governorates[0].nameAr;
  const medicineLabel = (medicineId ? getMedicine(medicineId)?.nameAr : undefined) ?? committed;
  const hasQuery = Boolean(committed || medicineId);
  const filtersActive = statuses.length > 0 || sort !== "relevance" || maxKm > 0 || scope !== "area";

  const select = (id: string) => {
    setSelected(id);
    // map -> list sync: scroll the matching card into view
    document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (!suggestOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSuggestOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [suggestOpen]);

  const reset = () => {
    setStatuses([]);
    setSort("relevance");
    setMaxKm(0);
    setScope("area");
  };

  const Filters = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-extrabold text-muted">حالة التوافر</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => {
            const on = statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setStatuses((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition",
                  on ? "border-brand bg-brand text-white" : "border-navy/10 bg-white hover:border-brand/40"
                )}
              >
                <span className={cn("size-2 rounded-full", on ? "bg-white" : STATUS_META[s].dot)} />
                {STATUS_META[s].label}
                <span className={on ? "text-white/80" : "text-muted"}>{(statusCounts.get(s) ?? 0).toLocaleString("ar-EG")}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-sort" className="mb-2 block text-xs font-extrabold text-muted">
            {t("search.sort")}
          </label>
          <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !py-2.5">
            <option value="relevance">{t("search.sort.relevance")}</option>
            <option value="fresh">{t("search.sort.fresh")}</option>
            <option value="distance" disabled={!reference}>
              {t("search.sort.distance")}
            </option>
          </select>
        </div>
        <div>
          <label htmlFor="f-km" className="mb-2 block text-xs font-extrabold text-muted">
            {t("search.distance")} {reference ? "" : "(اختر المركز)"}
          </label>
          <select id="f-km" value={maxKm} disabled={!reference} onChange={(e) => setMaxKm(Number(e.target.value))} className="field !py-2.5">
            {DISTANCES.map((d) => (
              <option key={d} value={d}>
                {d === 0 ? t("search.anyDistance") : `حتى ${d.toLocaleString("ar-EG")} كم`}
              </option>
            ))}
          </select>
        </div>
      </div>
      {filtersActive && (
        <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-extrabold text-brand">
          <RotateCcw className="size-3.5" /> {t("search.clear")}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-ice pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <h1 className="text-3xl font-black sm:text-4xl">{t("search.title")}</h1>
        <p className="mt-2 flex items-start gap-2 text-sm font-medium text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
          {t("common.disclaimer")}
        </p>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSuggestOpen(false);
            run();
          }}
          className="relative z-30 mt-5 grid gap-2.5 rounded-[1.75rem] border border-navy/10 bg-white p-3 shadow-soft md:grid-cols-[1.6fr_1fr_1fr_auto]"
        >
          <div className="relative">
            <label htmlFor="s-q" className="sr-only">
              اسم الدواء
            </label>
            <Pill className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-brand" />
            <input
              id="s-q"
              value={q}
              autoComplete="off"
              placeholder={t("search.medicine")}
              onChange={(e) => {
                setQ(e.target.value);
                setMedicineId(undefined);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 120)}
              className="field !ps-11"
            />
            <AnimatePresence>
              {suggestOpen && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-navy/10 bg-white p-1.5 shadow-lift"
                >
                  {suggestions.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQ(m.nameAr);
                          setSuggestOpen(false);
                          run(m.nameAr, m.id);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-brand-mint/60"
                      >
                        <span className="text-sm font-extrabold">{m.nameAr}</span>
                        <span className="text-xs font-medium text-muted">
                          {m.form} · {m.pack}
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label htmlFor="s-d" className="sr-only">
              المركز
            </label>
            <select
              id="s-d"
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value);
                setAreaId("");
                setScope("area");
              }}
              className="field"
            >
              <option value="">كل مراكز {governorates[0].nameAr}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameAr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="s-a" className="sr-only">
              المنطقة
            </label>
            <select
              id="s-a"
              value={areaId}
              disabled={!districtId}
              onChange={(e) => {
                setAreaId(e.target.value);
                setScope("area");
              }}
              className="field"
            >
              <option value="">{districtId ? "كل المناطق" : "اختر المركز أولًا"}</option>
              {areaOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.shortAr}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary min-h-[50px] md:px-7">
            {loading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="جاري البحث" />
            ) : (
              <>
                <Search className="size-[18px]" /> {t("hero.search")}
              </>
            )}
          </button>
        </form>

        {/* desktop filters + mobile controls */}
        <div className="mt-4 hidden rounded-[1.5rem] border border-navy/[0.07] bg-white p-4 shadow-soft lg:block">{Filters}</div>
        <div className="mt-4 flex items-center gap-2 lg:hidden">
          <button type="button" onClick={() => setDrawer(true)} className="btn-light !px-4 !py-2.5 text-sm">
            <SlidersHorizontal className="size-4" /> {t("search.filters")}
            {filtersActive && <span className="size-2 rounded-full bg-brand" />}
          </button>
          <div className="ms-auto flex rounded-full border border-navy/10 bg-white p-1" role="tablist" aria-label="طريقة العرض">
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold transition",
                  view === v ? "bg-brand text-white" : "text-muted"
                )}
              >
                {v === "list" ? <List className="size-3.5" /> : <MapIcon className="size-3.5" />}
                {v === "list" ? t("search.list") : t("search.map")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]" aria-live="polite">
          {/* results */}
          <div ref={listRef} className={cn(view === "map" && "hidden lg:block")}>
            {hasQuery && (
              <p className="mb-3 text-sm font-bold text-muted">
                {loading ? (
                  "جاري البحث…"
                ) : (
                  <>
                    <span className="text-navy">
                      {groups.length.toLocaleString("ar-EG")} صيدلية
                    </span>{" "}
                    لـ «{medicineLabel}» في {locationLabel}
                    {scope !== "area" && areaId ? " (بحث موسّع)" : ""}
                  </>
                )}
              </p>
            )}

            {!hasQuery && (
              <div className="grid place-items-center rounded-[2rem] border border-dashed border-navy/15 bg-white/60 px-6 py-20 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand-mint text-brand-deep">
                  <Pill className="size-7" />
                </span>
                <h2 className="mt-5 text-xl font-black">ابدأ بكتابة اسم الدواء</h2>
                <p className="mt-2 max-w-sm text-sm font-medium leading-loose text-muted">
                  هنعرضلك الصيدليات اللي أعلنت عن توفره. جرّب «كتافلام» أو «بانادول».
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-48 !rounded-[1.75rem]" />
                ))}
              </div>
            )}

            {!loading && hasQuery && groups.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid place-items-center rounded-[2rem] border border-navy/10 bg-white px-6 py-16 text-center shadow-soft"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                  <SearchX className="size-7" />
                </span>
                <h2 className="mt-5 text-xl font-black">مفيش صيدليات أعلنت توفر الدواء هنا</h2>
                <p className="mt-2 max-w-md text-sm font-medium leading-loose text-muted">
                  مفيش بيانات مطابقة في {locationLabel} حاليًا. ده مش معناه إن الدواء مش موجود، ممكن تكون الصيدليات لسه مسجلتش.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {widerScope && (
                    <button type="button" onClick={() => setScope(widerScope)} className="btn-primary">
                      {t("search.expand")} {widerScope === "district" ? "لكل المركز" : "لكل المحافظة"}
                    </button>
                  )}
                  {filtersActive && (
                    <button type="button" onClick={reset} className="btn-light">
                      {t("search.clear")}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {!loading && groups.length > 0 && (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {groups.map((g, i) => {
                    const meta = STATUS_META[g.best];
                    const active = selected === g.pharmacy.id;
                    return (
                      <motion.article
                        id={`card-${g.pharmacy.id}`}
                        key={g.pharmacy.id}
                        layout
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                        onClick={() => {
                          setSelected(g.pharmacy.id);
                          if (window.innerWidth < 1024) setView("map");
                        }}
                        className={cn(
                          "card group cursor-pointer p-5 hover:-translate-y-0.5 hover:shadow-lift",
                          active ? "border-brand shadow-glow" : "hover:border-brand/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className="grid size-12 shrink-0 place-items-center rounded-2xl text-white"
                              style={{ background: `linear-gradient(135deg, hsl(${g.pharmacy.hue} 70% 42%), hsl(${g.pharmacy.hue + 25} 75% 28%))` }}
                              aria-hidden
                            >
                              <Store className="size-6" />
                            </span>
                            <div>
                              <h3 className="text-base font-black leading-tight">
                                <Link href={`/pharmacies/${g.pharmacy.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-brand">
                                  {g.pharmacy.nameAr}
                                </Link>
                              </h3>
                              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted">
                                <MapPin className="size-3.5 shrink-0" /> {g.pharmacy.address}
                              </p>
                              <p className="mt-0.5 text-[11px] font-semibold text-muted/80">
                                الفيوم · {getArea(g.pharmacy.areaId)?.nameAr}
                                {g.km !== null && <> · <span className="text-brand-deep">{formatKm(g.km)} (تقريبي)</span></>}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={g.best} />
                        </div>

                        <ul className="mt-4 space-y-1.5">
                          {g.hits.map((h) => (
                            <li key={h.record.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ice px-4 py-2.5">
                              <Link
                                href={`/medicine/${h.medicine.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-sm font-extrabold hover:text-brand"
                              >
                                <Pill className="size-4 text-brand" /> {h.medicine.nameAr}
                                <span className="text-xs font-medium text-muted">· {h.medicine.form}</span>
                              </Link>
                              <span className="flex items-center gap-2 text-xs font-bold text-muted">
                                <StatusBadge status={h.status} className="!px-2 !py-0.5 !text-[10px]" />
                                <Clock className="size-3.5" /> {formatAgo(h.record.hoursAgo)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {g.best === "stale" && <p className="mt-2 text-[11px] font-bold text-slate-500">{meta.hint}.</p>}

                        <div className="mt-4 grid grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => demoToast(`رقم تجريبي: ${formatPhone(g.pharmacy.phone)} — لن يتم الاتصال فعليًا.`)}
                            className="flex items-center justify-center gap-1 rounded-xl bg-brand px-2 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#00a483] active:scale-95"
                          >
                            <Phone className="size-3.5" /> {t("common.call")}
                          </button>
                          <button
                            type="button"
                            onClick={() => demoToast("واتساب تجريبي: لن يتم فتح محادثة فعلية في نسخة العرض.")}
                            className="flex items-center justify-center gap-1 rounded-xl border border-brand/30 bg-white px-2 py-2.5 text-xs font-extrabold text-brand-deep transition hover:bg-brand-mint active:scale-95"
                          >
                            <MessageCircle className="size-3.5" /> {t("common.whatsapp")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(g.pharmacy.id);
                              if (window.innerWidth < 1024) setView("map");
                              demoToast("الاتجاهات هنا توضيحية: الموقع على الخريطة غير حقيقي.");
                            }}
                            className="flex items-center justify-center gap-1 rounded-xl border border-navy/10 bg-white px-2 py-2.5 text-xs font-extrabold transition hover:bg-ice active:scale-95"
                          >
                            <Navigation className="size-3.5" /> {t("common.directions")}
                          </button>
                          <Link
                            href={`/pharmacies/${g.pharmacy.id}`}
                            className="flex items-center justify-center rounded-xl border border-navy/10 bg-white px-2 py-2.5 text-xs font-extrabold transition hover:bg-ice active:scale-95"
                          >
                            {t("common.details")}
                          </Link>
                        </div>
                        <p className="mt-3 text-[10px] font-semibold text-muted/70">{t("common.demoData")}</p>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
                <p className="rounded-2xl border border-navy/10 bg-white p-4 text-center text-xs font-semibold leading-relaxed text-muted">
                  {t("common.disclaimer")}
                </p>
              </div>
            )}
          </div>

          {/* map */}
          <div className={cn(view === "list" && "hidden lg:block")}>
            <div className="sticky top-24 h-[70svh] min-h-[380px] lg:h-[calc(100svh-8rem)]">
              <MapLoader points={points} selectedId={selected} onSelect={select} className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* mobile filter drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[96] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("search.filters")}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-lift"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-black">{t("search.filters")}</h2>
                <button type="button" onClick={() => setDrawer(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full hover:bg-navy/5">
                  <X className="size-5" />
                </button>
              </div>
              {Filters}
              <button type="button" onClick={() => setDrawer(false)} className="btn-primary mt-6 w-full">
                عرض {groups.length.toLocaleString("ar-EG")} نتيجة
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
