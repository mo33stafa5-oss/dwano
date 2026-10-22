"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toast";
import { EASE } from "@/lib/motion";

const ICONS = { info: Info, success: CheckCircle2, demo: FlaskConical } as const;

export default function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-navy/95 px-4 py-3 text-sm font-semibold text-white shadow-lift backdrop-blur-xl"
            >
              <Icon className="mt-0.5 size-[18px] shrink-0 text-brand-glow" aria-hidden />
              <p className="leading-relaxed">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="إغلاق"
                className="-me-1 ms-1 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
