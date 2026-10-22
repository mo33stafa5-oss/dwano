"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import HeroSearch, { type HeroPhase } from "./HeroSearch";
import HeroVisual from "./HeroVisual";
import RevealText from "@/components/animations/RevealText";
import { MEDICAL_DISCLAIMER } from "@/lib/status";
import { EASE } from "@/lib/motion";
import { useT } from "@/hooks/useT";

export default function Hero() {
  const { t } = useT();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<HeroPhase>("idle");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 160]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 120]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#EAF8F2_55%,#F7FAFC_100%)] pt-28 text-navy sm:pt-36">
      {/* ambient background */}
      <motion.div style={{ y: bgY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(43,217,176,.28),transparent_60%)]" />
        <div className="grid-lines-light absolute inset-0" />
        <div className="absolute -start-32 top-1/3 size-[460px] animate-drift rounded-full bg-brand/15 blur-[110px]" />
        <div className="absolute -end-24 top-10 size-[380px] animate-drift rounded-full bg-brand-glow/25 blur-[110px] [animation-delay:-6s]" />
      </motion.div>

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative mx-auto max-w-4xl px-4 text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 1.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/80 px-4 py-1.5 text-xs font-bold text-navy/80 shadow-soft backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-brand-glow" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-glow" />
          </span>
          {t("hero.badge")}
        </motion.span>

        <h1 className="mt-6 text-[2.6rem] font-black leading-[1.25] tracking-tight sm:text-6xl sm:leading-[1.2] lg:text-7xl">
          <RevealText key={t("hero.h1a")} text={t("hero.h1a")} immediate delay={1.5} />
          <br />
          <RevealText key={t("hero.h1b")} text={t("hero.h1b")} immediate delay={1.8} wordClassName="text-gradient-dark" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 2.1 }}
          className="mx-auto mt-6 max-w-2xl text-base font-medium leading-loose text-navy/70 sm:text-lg"
        >
          {t("hero.sub")}
        </motion.p>
      </motion.div>

      <div className="relative mt-10 px-4">
        <HeroSearch onPhase={setPhase} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.8 }}
          className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 text-center text-xs font-semibold leading-relaxed text-muted"
        >
          <ShieldCheck className="size-4 shrink-0 text-brand" />
          {MEDICAL_DISCLAIMER}
        </motion.p>
      </div>

      <HeroVisual progress={scrollYProgress} phase={phase} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ice" />
    </section>
  );
}
