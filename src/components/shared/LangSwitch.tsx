"use client";

import { Languages } from "lucide-react";
import { useLangStore } from "@/store/lang";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

export default function LangSwitch({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const setLang = useLangStore((s) => s.setLang);
  const { lang } = useT();
  const next = lang === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-extrabold transition",
        tone === "light" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-navy/80 hover:bg-navy/5",
        className
      )}
    >
      <Languages className="size-4" />
      {lang === "ar" ? "EN" : "عربي"}
    </button>
  );
}
