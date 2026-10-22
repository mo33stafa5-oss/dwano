import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DemoRole } from "@/data/users";

/**
 * DEMO session. Only a display name and a role are stored: never passwords,
 * tokens or any sensitive information.
 */
interface SessionState {
  role: DemoRole | null;
  name: string;
  signIn: (role: DemoRole, name?: string) => void;
  signOut: () => void;
}

const DEFAULT_NAMES: Record<DemoRole, string> = {
  patient: "مستخدم تجريبي",
  pharmacy: "مدير صيدلية تجريبي",
  admin: "مشرف المنصة (تجريبي)",
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      name: "",
      signIn: (role, name) => set({ role, name: name?.trim() || DEFAULT_NAMES[role] }),
      signOut: () => set({ role: null, name: "" }),
    }),
    { name: "dwano-session", storage: createJSONStorage(() => localStorage) }
  )
);
