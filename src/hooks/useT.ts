"use client";

import { useCallback } from "react";
import { ar, type TKey } from "@/locales/ar";
import { en } from "@/locales/en";
import { useLangStore } from "@/store/lang";
import { useHydrated } from "./useHydrated";

/** Translation hook. Renders Arabic until hydrated so SSR and first paint always match. */
export function useT() {
  const stored = useLangStore((s) => s.lang);
  const hydrated = useHydrated();
  const lang = hydrated ? stored : "ar";
  const t = useCallback((key: TKey): string => (lang === "en" ? en[key] : ar[key]), [lang]);
  return { t, lang, isEn: lang === "en" };
}
