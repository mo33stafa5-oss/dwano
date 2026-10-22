"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import type { HeroPhase } from "./HeroSearch";
import { cn } from "@/lib/utils";

const PINS = [
  { x: "16%", y: "30%", d: 0 },
  { x: "30%", y: "66%", d: 0.15 },
  { x: "66%", y: "24%", d: 0.3 },
  { x: "78%", y: "62%", d: 0.45 },
  { x: "90%", y: "34%", d: 0.6 },
];

export default function HeroVisual({ progress, phase }: { progress: MotionValue<number>; phase: HeroPhase }) {
  const reduce = useReducedMotion();
  const boardRotate = useTransform(progress, [0, 1], reduce ? [54, 54] : [54, 28]);
  const boardScale = useTransform(progress, [0, 1], reduce ? [1, 1] : [1, 1.08]);
  const capY = useTransform(progress, [0, 1], reduce ? [0, 0] : [0, -90]);
  const capRotate = useTransform(progress, [0, 1], reduce ? [-28, -28] : [-28, 6]);
  const pinsY = useTransform(progress, [0, 1], reduce ? [0, 0] : [0, -40]);
  const cardsY = useTransform(progress, [0, 1], reduce ? [0, 0] : [0, -140]);

  const lit = phase !== "idle";

  return (
    <div aria-hidden className="relative mx-auto mt-6 h-[300px] w-full max-w-5xl sm:mt-10 sm:h-[400px]">
      {/* tilted map board */}
      <div className="absolute inset-0 [perspective:1400px]">
        <motion.div
          style={{ rotateX: boardRotate, scale: boardScale }}
          className="absolute inset-x-[2%] bottom-0 h-[270px] origin-bottom overflow-hidden rounded-[2.5rem] border border-navy/10 bg-gradient-to-b from-white to-brand-mint/60 shadow-[0_50px_120px_-40px_rgba(0,143,115,.35)] sm:h-[330px]"
        >
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 330" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M44 0H0V44" fill="none" stroke="rgba(16,42,67,.07)" strokeWidth="1" />
              </pattern>
              <radialGradient id="hero-glow" cx="50%" cy="45%" r="55%">
                <stop offset="0" stopColor="#2BD9B0" stopOpacity=".35" />
                <stop offset="1" stopColor="#2BD9B0" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="800" height="330" fill="url(#hero-grid)" />
            <rect width="800" height="330" fill="url(#hero-glow)" />
            <path
              d="M-20 240 C140 180 260 290 410 215 S660 130 830 190"
              stroke="rgba(43,217,176,.55)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="2 10"
            />
            <path d="M150 -10 C190 100 150 200 250 340" stroke="rgba(16,42,67,.08)" strokeWidth="14" fill="none" />
            <path d="M560 -10 C520 90 600 190 560 340" stroke="rgba(16,42,67,.06)" strokeWidth="10" fill="none" />
            <path d="M-10 90 C200 70 420 120 820 60" stroke="rgba(16,42,67,.05)" strokeWidth="8" fill="none" />
          </svg>
        </motion.div>
      </div>

      {/* upright pins */}
      <motion.div style={{ y: pinsY }} className="absolute inset-x-[6%] bottom-[14%] top-[34%]">
        {PINS.map((p, i) => (
          <motion.div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: p.x, top: p.y }}
            initial={{ y: -50, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 14, delay: 2.2 + p.d }}
          >
            <span
              className={cn(
                "relative grid size-9 place-items-center rounded-full border shadow-lg transition-colors duration-500 sm:size-11",
                phase === "located" && i === 2
                  ? "border-brand-glow bg-brand text-white shadow-glow"
                  : "border-brand/30 bg-white text-brand"
              )}
            >
              {(lit || i === 2) && (
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-glow/50" style={{ animationDelay: `${i * 0.3}s` }} />
              )}
              <MapPin className="relative size-4 sm:size-5" />
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* capsule */}
      <motion.div
        style={{ y: capY, rotate: capRotate }}
        className="absolute start-1/2 top-[2%] -translate-x-1/2 sm:top-0"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
          transition={{
            opacity: { duration: 0.8, delay: 1.7 },
            scale: { type: "spring", stiffness: 110, damping: 14, delay: 1.7 },
            y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2.6 },
          }}
          className="relative"
        >
          <div
            className={cn(
              "absolute -inset-10 rounded-full bg-brand-glow/30 blur-3xl transition-opacity duration-700",
              lit ? "opacity-100" : "opacity-50"
            )}
          />
          <div className="relative flex h-[84px] w-[230px] overflow-hidden rounded-full shadow-[0_30px_60px_-12px_rgba(16,42,67,.3)] sm:h-[104px] sm:w-[290px]">
            <div className="relative flex-1 bg-gradient-to-br from-[#2BD9B0] via-brand to-brand-deep" />
            <div className="relative flex-1 bg-gradient-to-br from-white via-[#EAF7F2] to-[#BFE6D8]" />
            <div className="absolute inset-y-0 start-1/2 w-px bg-black/10" />
            <div className="absolute inset-x-6 top-2.5 h-3 rounded-full bg-white/45 blur-[2px]" />
            <div className="absolute inset-x-8 bottom-2 h-2 rounded-full bg-black/10 blur-[3px]" />
          </div>
        </motion.div>
      </motion.div>

      {/* floating glass cards */}
      <motion.div style={{ y: cardsY }} className="pointer-events-none absolute inset-x-0 top-[22%] hidden sm:block">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 2.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute end-[4%] top-4 flex items-center gap-3 rounded-2xl border border-navy/10 bg-white/90 px-4 py-3 text-navy shadow-lift backdrop-blur-xl"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
            <BadgeCheck className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-muted">كتافلام ٥٠ مجم</span>
            <span className="text-sm font-extrabold">متوفر · سنورس - المدينة</span>
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 2.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute start-[4%] top-24 flex items-center gap-3 rounded-2xl border border-navy/10 bg-white/90 px-4 py-3 text-navy shadow-lift backdrop-blur-xl"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-brand-mint text-brand">
            <Clock className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-muted">آخر تحديث</span>
            <span className="text-sm font-extrabold">قبل ٣٠ دقيقة</span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
