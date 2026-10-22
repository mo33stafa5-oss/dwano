"use client";

import { ArrowLeft } from "lucide-react";
import MagneticButton from "@/components/animations/MagneticButton";
import RevealText from "@/components/animations/RevealText";
import Reveal from "@/components/animations/Reveal";
import { demoToast } from "@/store/toast";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-28 text-white sm:py-40" aria-labelledby="cta-title">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(0,143,115,.6),transparent_60%)]" />
        <div className="grid-lines absolute inset-0 opacity-60" />
        <div className="absolute -start-20 top-10 size-[360px] animate-drift rounded-full bg-brand/30 blur-[110px]" />
        <div className="absolute -end-20 bottom-0 size-[320px] animate-drift rounded-full bg-brand-glow/20 blur-[110px] [animation-delay:-5s]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 id="cta-title" className="text-5xl font-black leading-[1.25] sm:text-7xl">
          <RevealText text="دواءك أقرب" /> <RevealText text="مما تتخيل" wordClassName="text-gradient" delay={0.2} />
        </h2>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-base font-medium leading-loose text-white/65 sm:text-lg">
            ابحث عن دواءك دلوقتي، أو انضم لدوانو كصيدلية وخلّي الناس توصلك.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MagneticButton href="/search" className="btn-primary group !px-8 !py-4 text-base">
              ابحث عن دواء
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            </MagneticButton>
            <MagneticButton
              className="btn-ghost !px-8 !py-4 text-base"
              onClick={() => demoToast("تسجيل الصيدليات متاح كواجهة ديمو في المرحلة القادمة.")}
            >
              سجّل صيدليتك
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
