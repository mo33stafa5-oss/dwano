"use client";

import { motion } from "framer-motion";
import { Clock, MapPinned, PhoneCall, Route, Search } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import RevealText from "@/components/animations/RevealText";
import { cn } from "@/lib/utils";

const CHIPS = ["الفيوم", "سنورس", "المدينة"];

export default function PatientBenefits() {
  return (
    <section className="bg-ice py-24 sm:py-32" aria-labelledby="patients-title">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">للمرضى</span>
          <h2 id="patients-title" className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            <RevealText text="وقتك أغلى من إنك تلف" />
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-4 text-base font-medium leading-loose text-muted">
              دوانو بتجمعلك الصيدليات القريبة والمعلومات اللي محتاجها في مكان واحد، من غير تخمين.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {/* large: location */}
          <Reveal className="md:col-span-2">
            <div className="card group relative h-full overflow-hidden p-8 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white">
                <MapPinned className="size-6" />
              </span>
              <h3 className="mt-5 text-2xl font-black">نتايج حسب منطقتك</h3>
              <p className="mt-2 max-w-md text-sm font-medium leading-loose text-muted">
                اختار المحافظة ثم المركز ثم المنطقة، وهتشوف الصيدليات الأقرب ليك أولًا، وتقدر توسّع البحث لو مفيش نتايج.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {CHIPS.map((c, i) => (
                  <motion.span
                    key={c}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.18, duration: 0.6 }}
                    className="flex items-center gap-2"
                  >
                    <span className="rounded-full border border-brand/30 bg-brand-mint px-4 py-1.5 text-sm font-extrabold text-brand-deep">
                      {c}
                    </span>
                    {i < CHIPS.length - 1 && <span className="text-muted/50">‹</span>}
                  </motion.span>
                ))}
              </div>
              <div className="pointer-events-none absolute -bottom-16 -start-10 size-52 rounded-full bg-brand/10 blur-3xl transition group-hover:bg-brand/20" />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="card group h-full p-7 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-mint text-brand-deep">
                <Clock className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-black">وقت آخر تحديث ظاهر</h3>
              <p className="mt-2 text-sm font-medium leading-loose text-muted">
                كل نتيجة معاها وقت آخر تحديث، والبيانات القديمة بتتعلّم إنها غير مؤكدة.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-brand-mint px-3 py-1 text-xs font-extrabold text-brand-deep">قبل ٣٠ دقيقة</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">بيانات قديمة</span>
              </div>
            </div>
          </Reveal>

          {[
            { icon: PhoneCall, title: "تواصل مباشر", text: "اتصال أو واتساب مباشرة مع الصيدلية من نفس الكارت." },
            { icon: Route, title: "مشاوير أقل", text: "اتأكد الأول، وبعدين اتحرك. وفّر وقتك ومجهودك." },
            { icon: Search, title: "بحث سريع وذكي", text: "اقتراحات تلقائية بتفهم الأسماء بالعربي والإنجليزي." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={0.1 + i * 0.08}>
              <div className={cn("card group h-full p-7 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift")}>
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-mint text-brand-deep transition group-hover:scale-110 group-hover:rotate-[-6deg]">
                  <f.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-black">{f.title}</h3>
                <p className="mt-2 text-sm font-medium leading-loose text-muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
