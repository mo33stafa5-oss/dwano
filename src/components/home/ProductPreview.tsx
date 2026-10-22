"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Clock, MapPin, MessageCircle, Phone, Pill, Search } from "lucide-react";
import { searchInventory } from "@/lib/search";
import { STATUS_META } from "@/lib/status";
import { formatAgo, cn, clamp } from "@/lib/utils";
import { demoToast } from "@/store/toast";
import { EASE } from "@/lib/motion";

const WORD = "كتافلام";
const STEPS = ["اكتب اسم الدواء", "حدد المنطقة", "ابدأ البحث", "تظهر الصيدليات", "تظهر على الخريطة", "تواصل مباشرة"];

/** Pin positions on the mini map (percent). */
const SPOTS = [
  { x: 24, y: 34 },
  { x: 58, y: 58 },
  { x: 72, y: 26 },
];

export default function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const hits = useMemo(
    () => searchInventory({ q: WORD, medicineId: "cataflam-50", districtId: "sinnuris", areaId: "sinnuris-city" }).slice(0, 3),
    []
  );

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const t = clamp(Math.round((v / 0.17) * WORD.length), 0, WORD.length);
    setTyped((prev) => (prev === t ? prev : t));
    const s = v < 0.17 ? 0 : v < 0.3 ? 1 : v < 0.4 ? 2 : v < 0.6 ? 3 : v < 0.78 ? 4 : 5;
    setStage((prev) => (prev === s ? prev : s));
  });

  const selectedId = stage >= 5 ? (picked ?? hits[0]?.record.id) : picked;
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const loading = stage === 2;
  const showCards = stage >= 3;
  const showPins = stage >= 4;

  return (
    <section ref={ref} className="relative h-[330svh]" aria-label="عرض تفاعلي لطريقة البحث في دوانو">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden bg-ice">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(0,143,115,.10),transparent_55%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pt-16 lg:grid-cols-[0.85fr_1.4fr]">
          {/* narrative */}
          <div className="order-2 lg:order-1">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">شوف دوانو وهو شغال</span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-[2.8rem]">
              من أول حرف لحد <span className="text-gradient-dark">الاتصال بالصيدلية</span>
            </h2>
            <ol className="mt-7 hidden space-y-2.5 lg:block">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={cn(
                    "flex items-center gap-3 text-sm font-bold transition-all duration-500",
                    i <= stage ? "text-navy" : "text-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full border text-xs transition-all duration-500",
                      i < stage && "border-brand bg-brand text-white",
                      i === stage && "scale-110 border-brand bg-brand-mint text-brand-deep shadow-glow",
                      i > stage && "border-navy/10 bg-white"
                    )}
                  >
                    {(i + 1).toLocaleString("ar-EG")}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            <div className="mt-7 hidden h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-navy/10 lg:block">
              <motion.div style={{ width: progressWidth }} className="h-full rounded-full bg-gradient-to-l from-brand-glow to-brand" />
            </div>
            <Link href="/search?q=كتافلام&d=sinnuris&a=sinnuris-city" className="btn-primary group mt-7 !hidden sm:!inline-flex">
              جرّب البحث بنفسك
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          {/* product frame */}
          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-[2rem] border border-navy/10 bg-white shadow-lift">
              <div className="flex items-center gap-1.5 border-b border-navy/5 bg-ice/70 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-rose-300" />
                <span className="size-2.5 rounded-full bg-amber-300" />
                <span className="size-2.5 rounded-full bg-emerald-300" />
                <span className="ms-3 rounded-full bg-white px-3 py-0.5 text-[11px] font-semibold text-muted" dir="ltr">
                  dwano.app/search
                </span>
              </div>

              {/* search bar */}
              <div className="grid grid-cols-[1fr_auto] gap-2 p-3 sm:grid-cols-[1.3fr_1fr_auto] sm:p-4">
                <div className="relative flex items-center gap-2 rounded-2xl border border-navy/10 bg-white px-3 py-2.5 text-sm font-bold">
                  <Pill className="size-4 shrink-0 text-brand" />
                  <span className="min-h-[1.5rem]">
                    {WORD.slice(0, typed) || <span className="font-medium text-muted/60">اسم الدواء…</span>}
                    {stage === 0 && <span className="ms-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-brand" />}
                  </span>
                </div>
                <div
                  className={cn(
                    "hidden items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-bold transition-all duration-500 sm:flex",
                    stage >= 1 ? "border-brand/40 bg-brand-mint/50 text-brand-deep" : "border-navy/10 text-muted/60"
                  )}
                >
                  <MapPin className="size-4 shrink-0" />
                  {stage >= 1 ? "سنورس - المدينة" : "المنطقة…"}
                </div>
                <div className="grid min-w-[84px] place-items-center rounded-2xl bg-brand px-4 text-sm font-extrabold text-white">
                  {loading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Search className="size-4" /> ابحث
                    </span>
                  )}
                </div>
              </div>

              {/* results + map */}
              <div className="grid gap-3 p-3 pt-0 sm:grid-cols-[1.15fr_1fr] sm:p-4 sm:pt-0">
                <div className="space-y-2.5">
                  {loading && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="skeleton h-[74px]" />
                      ))}
                    </>
                  )}
                  {!loading && !showCards && (
                    <div className="grid h-[240px] place-items-center rounded-2xl border border-dashed border-navy/10 text-center text-xs font-semibold text-muted/70">
                      النتائج هتظهر هنا
                    </div>
                  )}
                  <AnimatePresence>
                    {showCards &&
                      hits.map((h, i) => {
                        const meta = STATUS_META[h.status];
                        const active = selectedId === h.record.id;
                        return (
                          <motion.button
                            key={h.record.id}
                            type="button"
                            layout
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: EASE, delay: i * 0.12 }}
                            onClick={() => setPicked(h.record.id)}
                            className={cn(
                              "block w-full rounded-2xl border p-3 text-start transition-all duration-300",
                              active
                                ? "border-brand bg-brand-mint/40 shadow-glow"
                                : "border-navy/10 bg-white hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-extrabold">{h.pharmacy.nameAr}</p>
                                <p className="mt-0.5 text-[11px] font-medium text-muted">{h.pharmacy.address}</p>
                              </div>
                              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", meta.chip)}>
                                {meta.label}
                              </span>
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-muted">
                              <Clock className="size-3" /> {formatAgo(h.record.hoursAgo)}
                            </p>
                            <AnimatePresence>
                              {active && stage >= 5 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.4, ease: EASE }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        demoToast("رقم الصيدلية تجريبي ولن يتم الاتصال فعليًا.");
                                      }}
                                      onKeyDown={(e) => e.key === "Enter" && demoToast("رقم الصيدلية تجريبي ولن يتم الاتصال فعليًا.")}
                                      className="flex items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-extrabold text-white"
                                    >
                                      <Phone className="size-3.5" /> اتصال
                                    </span>
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        demoToast("واتساب الصيدلية تجريبي ولن يتم فتح محادثة فعلية.");
                                      }}
                                      onKeyDown={(e) => e.key === "Enter" && demoToast("واتساب الصيدلية تجريبي ولن يتم فتح محادثة فعلية.")}
                                      className="flex items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-white px-3 py-2 text-xs font-extrabold text-brand-deep"
                                    >
                                      <MessageCircle className="size-3.5" /> واتساب
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                  </AnimatePresence>
                </div>

                {/* mini map */}
                <div className="relative hidden min-h-[240px] overflow-hidden rounded-2xl border border-navy/10 bg-[#EAF4F0] sm:block">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 240" preserveAspectRatio="none" aria-hidden>
                    <defs>
                      <pattern id="mp-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                        <path d="M22 0H0V22" fill="none" stroke="rgba(16,42,67,.06)" />
                      </pattern>
                    </defs>
                    <rect width="200" height="240" fill="url(#mp-grid)" />
                    <path d="M-5 150 C50 120 90 190 140 140 S190 90 210 110" stroke="#fff" strokeWidth="9" fill="none" />
                    <path d="M60 -5 C80 70 50 140 90 245" stroke="#fff" strokeWidth="7" fill="none" />
                    <path d="M-5 60 C60 50 120 80 210 40" stroke="#fff" strokeWidth="5" fill="none" opacity=".8" />
                  </svg>
                  {SPOTS.map((s, i) => {
                    const hit = hits[i];
                    if (!hit) return null;
                    const sel = selectedId === hit.record.id;
                    return (
                      <AnimatePresence key={hit.record.id}>
                        {showPins && (
                          <motion.button
                            type="button"
                            aria-label={hit.pharmacy.nameAr}
                            onClick={() => setPicked(hit.record.id)}
                            initial={{ scale: 0, y: -24, opacity: 0 }}
                            animate={{ scale: sel ? 1.25 : 1, y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 16, delay: i * 0.14 }}
                            className="absolute -translate-x-1/2 -translate-y-full"
                            style={{ left: `${s.x}%`, top: `${s.y}%` }}
                          >
                            <MapPin
                              className="size-9 drop-shadow-md"
                              style={{ color: STATUS_META[hit.status].marker, fill: STATUS_META[hit.status].marker }}
                              strokeWidth={1.5}
                            />
                            {sel && <span className="absolute start-1/2 top-2 size-2 -translate-x-1/2 rounded-full bg-white" />}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    );
                  })}
                  <span className="absolute bottom-2 start-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-muted">
                    مواقع توضيحية
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] font-semibold text-muted">
              صيدليات وأرقام تجريبية خيالية لأغراض العرض فقط.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
