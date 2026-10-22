"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, MapPin, Pill, Search } from "lucide-react";
import { areasOfDistrict, districts, governorates } from "@/data/locations";
import { suggestMedicines } from "@/lib/search";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

export type HeroPhase = "idle" | "typing" | "located";

const QUICK = ["كتافلام", "بانادول", "أوجمنتين"];

export default function HeroSearch({ onPhase }: { onPhase: (p: HeroPhase) => void }) {
  const router = useRouter();
  const { t, isEn } = useT();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [govId] = useState(governorates[0].id);
  const [districtId, setDistrictId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => suggestMedicines(q), [q]);
  const areaOptions = useMemo(() => (districtId ? areasOfDistrict(districtId) : []), [districtId]);

  const updatePhase = (nextQ: string, nextDistrict: string) => {
    if (nextDistrict) onPhase("located");
    else if (nextQ) onPhase("typing");
    else onPhase("idle");
  };

  const submit = (override?: string) => {
    const query = (override ?? q).trim();
    if (!query) {
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    const params = new URLSearchParams({ q: query });
    if (districtId) params.set("d", districtId);
    if (areaId) params.set("a", areaId);
    router.push(`/search?${params.toString()}`);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setCursor((c) => Math.min(suggestions.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && cursor >= 0 && suggestions[cursor]) {
        const m = suggestions[cursor];
        setQ(m.nameAr);
        setOpen(false);
        setCursor(-1);
        updatePhase(m.nameAr, districtId);
      } else submit();
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <motion.form
      role="search"
      aria-label="بحث عن دواء"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 1.9 }}
      className="relative z-20 mx-auto w-full max-w-4xl rounded-[2rem] border border-navy/10 bg-white/80 p-3 shadow-[0_30px_80px_-30px_rgba(16,42,67,.28)] backdrop-blur-2xl sm:p-4"
    >
      <div className="grid gap-2.5 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        {/* medicine */}
        <div className="relative md:col-span-1">
          <label htmlFor="hero-q" className="sr-only">
            {t("search.medicine")}
          </label>
          <Pill className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-brand" />
          <input
            id="hero-q"
            ref={inputRef}
            value={q}
            autoComplete="off"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls="hero-suggest"
            placeholder={t("hero.medicine")}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setCursor(-1);
              updatePhase(e.target.value, districtId);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKey}
            className="field !ps-11"
          />
          <AnimatePresence>
            {open && suggestions.length > 0 && (
              <motion.ul
                id="hero-suggest"
                role="listbox"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-navy/10 bg-white p-1.5 text-start shadow-lift"
              >
                {suggestions.map((m, i) => (
                  <li key={m.id} role="option" aria-selected={i === cursor}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQ(m.nameAr);
                        setOpen(false);
                        updatePhase(m.nameAr, districtId);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start transition",
                        i === cursor ? "bg-brand-mint" : "hover:bg-brand-mint/60"
                      )}
                    >
                      <span className="text-sm font-extrabold text-navy">{m.nameAr}</span>
                      <span className="text-xs font-medium text-muted">
                        {m.form} · {m.category}
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* governorate */}
        <div className="relative">
          <label htmlFor="hero-gov" className="sr-only">
            المحافظة
          </label>
          <MapPin className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-brand" />
          <select id="hero-gov" value={govId} disabled className="field !ps-11">
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>
                {isEn ? g.nameEn : g.nameAr}
              </option>
            ))}
          </select>
        </div>

        {/* district */}
        <div>
          <label htmlFor="hero-district" className="sr-only">
            المركز
          </label>
          <select
            id="hero-district"
            value={districtId}
            onChange={(e) => {
              setDistrictId(e.target.value);
              setAreaId("");
              updatePhase(q, e.target.value);
            }}
            className="field"
          >
            <option value="">{t("hero.allDistricts")}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {isEn ? d.nameEn : d.nameAr}
              </option>
            ))}
          </select>
        </div>

        {/* area */}
        <div>
          <label htmlFor="hero-area" className="sr-only">
            المنطقة
          </label>
          <select
            id="hero-area"
            value={areaId}
            disabled={!districtId}
            onChange={(e) => setAreaId(e.target.value)}
            className="field"
          >
            <option value="">{districtId ? t("hero.allAreas") : t("hero.pickDistrict")}</option>
            {areaOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.shortAr}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={busy} className="btn-primary group h-full min-h-[50px] md:px-7">
          {busy ? (
            <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="جاري البحث" />
          ) : (
            <>
              <Search className="size-[18px]" />
              {t("hero.search")}
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 px-1 text-xs font-semibold text-muted sm:justify-start">
        <span>{t("hero.try")}</span>
        {QUICK.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setQ(c);
              updatePhase(c, districtId);
              submit(c);
            }}
            className="rounded-full border border-navy/10 bg-white px-3 py-1 text-navy/80 transition hover:border-brand/40 hover:bg-brand-mint/60"
          >
            {c}
          </button>
        ))}
        <span className="ms-auto hidden text-muted/70 sm:inline">{t("hero.soon")}</span>
      </div>
    </motion.form>
  );
}
