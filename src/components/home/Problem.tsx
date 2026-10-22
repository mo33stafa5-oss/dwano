"use client";

import { motion } from "framer-motion";
import { Hourglass, PhoneOff, Route } from "lucide-react";
import ScrubText from "@/components/animations/ScrubText";
import Reveal from "@/components/animations/Reveal";
import { EASE } from "@/lib/motion";

const SCENES = [
  {
    icon: Route,
    title: "لفّة على صيدلية ورا التانية",
    text: "كل صيدلية بتسأل فيها لوحدها، ووقتك وفلوسك بيروحوا في المشاوير.",
    visual: (
      <svg viewBox="0 0 220 90" className="h-full w-full" aria-hidden>
        <motion.path
          d="M12 70 C50 10 70 90 110 40 S170 10 208 60"
          fill="none"
          stroke="#008F73"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 9"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 2, ease: EASE }}
        />
        {[
          [12, 70],
          [70, 52],
          [140, 38],
          [208, 60],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="6"
            fill="#fff"
            stroke="#008F73"
            strokeWidth="3"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.35, type: "spring", stiffness: 200, damping: 14 }}
          />
        ))}
      </svg>
    ),
  },
  {
    icon: PhoneOff,
    title: "مكالمات مفيهاش رد",
    text: "الخط مشغول أو محدش بيرد، وإنت لسه مش عارف إذا الدواء موجود ولا لأ.",
    visual: (
      <div className="flex h-full items-center justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-10 w-1.5 rounded-full bg-rose-300"
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-600">مشغول…</span>
      </div>
    ),
  },
  {
    icon: Hourglass,
    title: "معلومة مش مؤكدة",
    text: "حتى لو قالولك موجود، مفيش وقت آخر تحديث تعرف منه إن الكلام لسه صحيح.",
    visual: (
      <div className="flex h-full items-center justify-center">
        <motion.span
          className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          آخر تحديث: ؟؟؟
        </motion.span>
      </div>
    ),
  },
];

export default function Problem() {
  return (
    <section className="relative bg-ice py-24 sm:py-32" aria-labelledby="problem-title">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1fr_1fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">المشكلة</span>
          </Reveal>
          <h2 id="problem-title" className="sr-only">
            لماذا يصعب العثور على الدواء
          </h2>
          <ScrubText
            className="mt-4 text-3xl font-black leading-[1.55] text-navy sm:text-[2.6rem]"
            text="كل ما تحتاج دواء، بتلف على صيدلية ورا التانية، وتسأل وتستنى، وفي الآخر ممكن ترجع من غير ما تلاقيه."
          />
        </div>

        <div className="space-y-5">
          {SCENES.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05} y={40}>
              <div className="card group grid gap-5 p-6 hover:-translate-y-1 hover:shadow-lift sm:grid-cols-[1fr_200px] sm:items-center">
                <div>
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-mint text-brand-deep transition group-hover:rotate-[-6deg]">
                    <s.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-xl font-extrabold">{s.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-loose text-muted">{s.text}</p>
                </div>
                <div className="h-24 rounded-2xl bg-ice">{s.visual}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
