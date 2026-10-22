"use client";

import { useEffect } from "react";
import { useLangStore } from "@/store/lang";

/** Keeps <html lang/dir> in sync with the chosen language (Arabic = RTL, English = LTR). */
export default function LangSync() {
  const lang = useLangStore((s) => s.lang);
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  return null;
}
