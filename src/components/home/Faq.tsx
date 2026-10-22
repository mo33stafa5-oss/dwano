"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import RevealText from "@/components/animations/RevealText";
import Reveal from "@/components/animations/Reveal";
import { MEDICAL_DISCLAIMER } from "@/lib/status";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const FAQS = [
  { q: "إيه هي دوانو؟", a: "دوانو منصة بتساعدك تعرف الصيدليات القريبة منك اللي أعلنت عن توفر دواء معين، وتتواصل معاها بسهولة." },
  { q: "هل دوانو صيدلية أو بتبيع أدوية؟", a: "لأ. دوانو منصة اكتشاف فقط. مبنبيعش أدوية ومبنقدمش استشارات طبية." },
  { q: "هل معلومات التوافر مؤكدة؟", a: `${MEDICAL_DISCLAIMER} وبنعرض وقت آخر تحديث لكل نتيجة، والبيانات القديمة بتتعلّم كغير مؤكدة.` },
  { q: "هل بتقترحوا بدائل للدواء؟", a: "لأ. مش بنقترح أدوية بديلة. لو محتاج بديل اسأل الصيدلي أو الطبيب." },
  { q: "إزاي أسجّل صيدليتي؟", a: "في النسخة الكاملة هتقدر تسجّل بياناتك وتنتظر مراجعة الإدارة. النسخة الحالية ديمو للعرض فقط." },
  { q: "هل الصيدليات والبيانات حقيقية؟", a: "لأ. الموقع الحالي نسخة عرض تجريبية، وكل الصيدليات والأرقام وأرقام الهواتف خيالية." },
  { q: "هتشتغلوا في أي محافظات؟", a: "بنبدأ من محافظة الفيوم (مراكزها الستة)، وبعدين نتوسع لباقي المحافظات." },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-24 sm:py-32" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">الأسئلة الشائعة</span>
          <h2 id="faq-title" className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            <RevealText text="عندك سؤال؟" />
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-4 text-base font-medium leading-loose text-muted">أهم الأسئلة اللي بتتكرر، بإجابات واضحة ومباشرة.</p>
          </Reveal>
        </div>

        <div className="divide-y divide-navy/10 rounded-[2rem] border border-navy/10 bg-ice/60 px-3 sm:px-6">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-start text-base font-extrabold transition hover:text-brand sm:text-lg"
                  >
                    {f.q}
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-300",
                        isOpen ? "rotate-45 border-brand bg-brand text-white" : "border-navy/15 bg-white"
                      )}
                    >
                      <Plus className="size-4" />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pe-10 text-sm font-medium leading-loose text-muted sm:text-base">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
