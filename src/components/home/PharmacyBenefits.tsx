"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BarChart3, Boxes, Building2, GitBranch, Package, Store, TrendingUp, Users } from "lucide-react";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import RevealText from "@/components/animations/RevealText";
import Reveal from "@/components/animations/Reveal";
import { demoKpis, weeklyProfileViews } from "@/data/analytics";
import { demoToast } from "@/store/toast";
import { EASE } from "@/lib/motion";

const FEATURES = [
  { icon: Boxes, title: "رؤية واضحة للمخزون", text: "حدّث حالة كل دواء في ثوانٍ." },
  { icon: Users, title: "عملاء بيدوروا عليك", text: "ظهور للناس القريبة منك وقت ما تحتاج." },
  { icon: Store, title: "ملف صيدلية احترافي", text: "بيانات التواصل والمواعيد والموقع." },
  { icon: GitBranch, title: "إدارة الفروع", text: "كل فرع له مخزونه ومكانه." },
  { icon: Package, title: "تحديث مخزون بسيط", text: "إضافة وتعديل وتغيير التوافر بضغطة." },
];

const SPARK = (() => {
  const max = Math.max(...weeklyProfileViews);
  const pts = weeklyProfileViews.map((v, i) => [(i / (weeklyProfileViews.length - 1)) * 300, 70 - (v / max) * 60]);
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
})();

const ROWS: [string, string, string][] = [
  ["كتافلام ٥٠ مجم", "متوفر", "bg-emerald-400/15 text-emerald-300"],
  ["بانادول إكسترا", "كمية محدودة", "bg-amber-400/15 text-amber-300"],
  ["أوجمنتين ١ جم", "غير متوفر", "bg-rose-400/15 text-rose-300"],
  ["فيتامين د٣", "متوفر", "bg-emerald-400/15 text-emerald-300"],
];

export default function PharmacyBenefits() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "center 0.5"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [38, 0]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [6, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.86, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80, 0]);

  return (
    <section id="pharmacies" className="relative overflow-hidden bg-navy-900 py-24 text-white sm:py-32" aria-labelledby="pharm-title">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -end-40 top-0 size-[560px] rounded-full bg-brand/25 blur-[140px]" />
        <div className="grid-lines absolute inset-0 opacity-60" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[0.9fr_1.3fr]">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-glow">للصيدليات</span>
          <h2 id="pharm-title" className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            <RevealText text="خلّي صيدليتك" /> <RevealText text="تتشاف" wordClassName="text-gradient" delay={0.15} />
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-4 text-base font-medium leading-loose text-white/65">
              لوحة تحكم بسيطة تساعد صيدليتك توصل للناس اللي بتدور على أدويتها قريب منك.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
                className="flex items-start gap-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
                  <f.icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold">{f.title}</span>
                  <span className="text-sm font-medium text-white/55">{f.text}</span>
                </span>
              </motion.li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => demoToast("لوحة الصيدلية الكاملة تُبنى في مرحلة لاحقة من الديمو.")}
            className="btn-primary mt-9"
          >
            شوف لوحة الصيدلية
          </button>
        </div>

        {/* tilted dashboard */}
        <div ref={ref} className="[perspective:1600px]">
          <motion.div
            style={{ rotateX, rotateZ, scale, y }}
            className="origin-bottom overflow-hidden rounded-[2rem] border border-white/10 bg-navy-800 shadow-[0_60px_140px_-30px_rgba(0,143,115,.5)]"
          >
            <div className="grid grid-cols-[56px_1fr]">
              <div className="flex flex-col items-center gap-4 border-e border-white/5 bg-black/20 py-5">
                <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
                  <Building2 className="size-4" />
                </span>
                {[BarChart3, Package, GitBranch].map((I, i) => (
                  <I key={i} className="size-4 text-white/35" />
                ))}
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold">لوحة الصيدلية</p>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/60">أرقام تجريبية</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ["الأدوية", demoKpis.medicines],
                    ["المتوفر", demoKpis.available],
                    ["زيارات الملف", demoKpis.profileViews],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="rounded-2xl border border-white/5 bg-white/[0.04] p-3">
                      <p className="text-[10px] font-semibold text-white/50">{l}</p>
                      <AnimatedCounter value={Number(v)} className="mt-1 block text-xl font-black sm:text-2xl" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white/55">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-brand-glow" /> زيارات الأسبوع
                    </span>
                    <span>آخر ٧ أيام</span>
                  </div>
                  <svg viewBox="0 0 300 80" className="mt-3 h-20 w-full" preserveAspectRatio="none" aria-hidden>
                    <defs>
                      <linearGradient id="sp-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#2BD9B0" stopOpacity=".35" />
                        <stop offset="1" stopColor="#2BD9B0" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${SPARK} L300 80 L0 80 Z`} fill="url(#sp-fill)" />
                    <motion.path
                      d={SPARK}
                      fill="none"
                      stroke="#2BD9B0"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.8, ease: EASE, delay: 0.3 }}
                    />
                  </svg>
                </div>
                <div className="mt-3 divide-y divide-white/5 rounded-2xl border border-white/5 bg-white/[0.04] text-xs">
                  {ROWS.map(([n, s, c]) => (
                    <div key={n} className="flex items-center justify-between px-4 py-2.5">
                      <span className="font-bold">{n}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${c}`}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
