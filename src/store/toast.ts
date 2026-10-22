import { create } from "zustand";

export type ToastTone = "info" | "success" | "demo";
export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (message, tone = "info") => {
    const id = ++counter;
    set((s) => ({ items: [...s.items.slice(-2), { id, message, tone }] }));
    setTimeout(() => get().dismiss(id), 4600);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, tone?: ToastTone) => useToastStore.getState().push(message, tone);

/** Honest message for actions that cannot complete in a frontend-only demo. */
export const demoToast = (message: string) => toast(message, "demo");
