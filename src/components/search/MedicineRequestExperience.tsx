"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Pill, Search, ShieldCheck } from "lucide-react";
import MedicineRequestForm from "./MedicineRequestForm";
import { areasOfDistrict, districts, governorates } from "@/data/locations";
import { getMedicine } from "@/data/medicines";
import { suggestMedicines } from "@/lib/search";
import { useT } from "@/hooks/useT";
import { EASE } from "@/lib/motion";

/**
 * Search page: same search bar and location selectors as before, but a search now opens
 * the Medicine Request form instead of listing pharmacies.
 */
export default function MedicineRequestExperience() {
  const { t } = useT();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [committed, setCommitted] = useState(params.get("q") ?? "");
  const [medicineId, setMedicineId] = useState<string | undefined>();
  const [districtId, setDistrictId] = useState(params.get("d") ?? "");
  const [areaId, setAreaId] = useState(params.get("a") ?? "");
  const [suggestOpen, setSuggestOpen] = useState(false);

  const areaOptions = useMemo(() => (districtId ? areasOfDistrict(districtId) : []), [districtId]);
  const suggestions = useMemo(() => suggestMedicines(q), [q]);

  const run = (nextQ = q, nextMed = medicineId) => {
    setCommitted(nextQ.trim());
    setMedicineId(nextMed);
    const sp = new URLSearchParams();
    if (nextQ.trim()) sp.set("q", nextQ.trim());
    if (districtId) sp.set("d", districtId);
    if (areaId) sp.set("a", areaId);
    window.history.replaceState(null, "", `/search?${sp.toString()}`);
  };

  useEffect(() => {
    if (!suggestOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSuggestOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [suggestOpen]);

  const medicineName = (medicineId ? getMedicine(medicineId)?.nameAr : undefined) ?? committed;
  const hasQuery = Boolean(committed || medicineId);

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
            <select id="s-a" value={areaId} disabled={!districtId} onChange={(e) => setAreaId(e.target.value)} className="field">
              <option value="">{districtId ? "كل المناطق" : "اختر المركز أولًا"}</option>
              {areaOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.shortAr}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary min-h-[50px] md:px-7">
            <Search className="size-[18px]" /> {t("hero.search")}
          </button>
        </form>

        <div className="mt-6" aria-live="polite">
          <AnimatePresence mode="wait">
            {hasQuery ? (
              <motion.div key="request" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                <MedicineRequestForm
                  medicineId={medicineId}
                  medicineName={medicineName}
                  districtId={districtId}
                  areaId={areaId}
                  onReset={() => {
                    setQ("");
                    setCommitted("");
                    setMedicineId(undefined);
                    window.history.replaceState(null, "", "/search");
                  }}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid place-items-center rounded-[2rem] border border-dashed border-navy/15 bg-white/60 px-6 py-20 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand-mint text-brand-deep">
                  <Pill className="size-7" />
                </span>
                <h2 className="mt-5 text-xl font-black">ابدأ بكتابة اسم الدواء</h2>
                <p className="mt-2 max-w-sm text-sm font-medium leading-loose text-muted">اكتب اسم الدواء واضغط «ابحث»، وهيظهر لك نموذج تسجيل طلبك. جرّب «كتافلام» أو «بانادول».</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
