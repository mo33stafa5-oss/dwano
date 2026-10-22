"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Clock, MapPin, MessageCircle, Phone, Pill, Search } from "lucide-react";
import RevealText from "@/components/animations/RevealText";
import { cn } from "@/lib/utils";

/** Three mini phone screens, one per step. */
function Phone_({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      className={cn(
        "relative mx-auto h-[330px] w-[190px] rounded-[2.2rem] border-[6px] p-3 shadow-lift sm:h-[380px] sm:w-[210px]",
        dark ? "border-white/15 bg-navy-800" : "border-navy bg-white"
      )}
    >
      <div className={cn("absolute inset-x-0 top-2 mx-auto h-4 w-16 rounded-full", dark ? "bg-white/10" : "bg-navy")} />
      <div className="mt-5">{children}</div>
    </div>
  );
}

const SCREENS: ReactNode[] = [
  <Phone_ key="s1">
    <div className="space-y-2.5">
      <p className="text-[11px] font-extrabold text-muted">ابحث عن دواء</p>
      <div className="flex items-center gap-2 rounded-xl border border-brand/40 bg-brand-mint/40 px-2.5 py-2 text-xs font-extrabold">
        <Pill className="size-3.5 text-brand" /> كتافلام
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-navy/10 px-2.5 py-2 text-xs font-bold text-muted">
        <MapPin className="size-3.5 text-brand" /> سنورس - المدينة
      </div>
      <div className="grid place-items-center rounded-xl bg-brand py-2.5 text-xs font-extrabold text-white">
        <span className="flex items-center gap-1.5">
          <Search className="size-3.5" /> ابحث
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {["بانادول", "أوجمنتين", "فيتامين د"].map((c) => (
          <span key={c} className="rounded-full bg-ice px-2 py-0.5 text-[10px] font-bold text-muted">
            {c}
          </span>
        ))}
      </div>
    </div>
  </Phone_>,
  <Phone_ key="s2">
    <div className="space-y-2">
      <p className="text-[11px] font-extrabold text-muted">٣ صيدليات أعلنت التوفر</p>
      {[
        ["صيدلية النور", "متوفر", "bg-brand-mint text-brand-deep"],
        ["صيدلية الشفاء", "محدود", "bg-amber-50 text-amber-800"],
        ["صيدلية الأمل", "غير مؤكد", "bg-sky-50 text-sky-800"],
      ].map(([n, s, c]) => (
        <div key={n} className="rounded-xl border border-navy/10 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold">{n}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-extrabold", c)}>{s}</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-muted">
            <Clock className="size-2.5" /> آخر تحديث قبل ساعة
          </p>
        </div>
      ))}
    </div>
  </Phone_>,
  <Phone_ key="s3" dark>
    <div className="space-y-3 text-white">
      <div className="rounded-xl bg-white/10 p-3">
        <p className="text-xs font-extrabold">صيدلية النور</p>
        <p className="mt-0.5 text-[10px] font-medium text-white/60">سنورس - المدينة</p>
        <span className="mt-2 inline-block rounded-full bg-brand px-2 py-0.5 text-[9px] font-extrabold">متوفر</span>
      </div>
      <div className="grid place-items-center rounded-xl bg-brand py-2.5 text-xs font-extrabold">
        <span className="flex items-center gap-1.5">
          <Phone className="size-3.5" /> اتصال
        </span>
      </div>
      <div className="grid place-items-center rounded-xl border border-white/20 py-2.5 text-xs font-extrabold">
        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5" /> واتساب
        </span>
      </div>
      <p className="text-center text-[9px] font-medium text-white/50">تأكد من الصيدلية قبل التوجه إليها</p>
    </div>
  </Phone_>,
];

const STEPS = [
  {
    n: "١",
    title: "ابحث عن الدواء",
    text: "اكتب اسم الدواء واختر المحافظة والمركز والمنطقة. الاقتراحات التلقائية بتساعدك تكتب الاسم صح.",
    bg: "bg-white",
    fg: "text-navy",
    sub: "text-muted",
  },
  {
    n: "٢",
    title: "اعرف الصيدليات",
    text: "هتشوف الصيدليات اللي أعلنت توفره، مع حالة التوافر ووقت آخر تحديث، وموقعها على الخريطة.",
    bg: "bg-brand-mint",
    fg: "text-navy",
    sub: "text-navy/60",
  },
  {
    n: "٣",
    title: "تواصل مع الصيدلية",
    text: "اتصل أو ابعت واتساب أو افتح الاتجاهات، وتأكد من الصيدلية قبل ما تتحرك.",
    bg: "bg-navy",
    fg: "text-white",
    sub: "text-white/65",
  },
];

function StackCard({
  i,
  n,
  progress,
  step,
}: {
  i: number;
  n: number;
  progress: MotionValue<number>;
  step: (typeof STEPS)[number];
}) {
  const reduce = useReducedMotion();
  const target = 1 - (n - 1 - i) * 0.055;
  const scale = useTransform(progress, [i / n, 1], reduce ? [1, 1] : [1, target]);

  return (
    <div className="sticky top-0 flex h-[100svh] items-center justify-center px-4">
      <motion.div
        style={{ scale, top: `calc(3vh + ${i * 26}px)` }}
        className={cn(
          "relative grid w-full max-w-5xl origin-top items-center gap-6 overflow-hidden rounded-[2.5rem] border border-navy/10 p-7 shadow-lift sm:p-12 md:grid-cols-[1.1fr_0.9fr]",
          step.bg
        )}
      >
        <div>
          <span
            className={cn(
              "inline-grid size-12 place-items-center rounded-2xl text-xl font-black",
              i === 2 ? "bg-brand text-white" : "bg-navy text-white"
            )}
          >
            {step.n}
          </span>
          <h3 className={cn("mt-5 text-3xl font-black sm:text-4xl", step.fg)}>{step.title}</h3>
          <p className={cn("mt-4 max-w-md text-base font-medium leading-loose", step.sub)}>{step.text}</p>
        </div>
        <div className="relative">{SCREENS[i]}</div>
      </motion.div>
    </div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section id="how" className="relative bg-ice pt-24 sm:pt-32" aria-labelledby="how-title">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">كيف تعمل دوانو</span>
        <h2 id="how-title" className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
          <RevealText text="ثلاث خطوات" />{" "}
          <RevealText text="وتوصل لدوائك" delay={0.15} wordClassName="text-gradient-dark" />
        </h2>
      </div>
      <div ref={ref} className="relative mt-10" style={{ height: `${STEPS.length * 100}svh` }}>
        {STEPS.map((s, i) => (
          <StackCard key={s.title} i={i} n={STEPS.length} progress={scrollYProgress} step={s} />
        ))}
      </div>
    </section>
  );
}
