import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Lang = "ar" | "en";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "ar",
      setLang: (lang) => set({ lang }),
    }),
    { name: "dwano-lang", storage: createJSONStorage(() => localStorage) }
  )
);
