import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RawStatus } from "@/types";
import { medicines } from "@/data/medicines";
import { getPharmacy } from "@/data/pharmacies";
import { mulberry32 } from "@/lib/rng";

export interface Branch {
  id: string;
  name: string;
  districtId: string;
  areaId: string;
  address: string;
  phone: string;
  hours: string;
}

export interface StockItem {
  id: string;
  medicineId: string;
  status: RawStatus;
  qty: number;
  /** epoch ms of the last report */
  updatedAt: number;
}

export interface Profile {
  name: string;
  owner: string;
  phone: string;
  whatsapp: string;
  address: string;
  districtId: string;
  areaId: string;
  hours: string;
  logoHue: number;
  coverIdx: number;
}

export interface PharmacySettings {
  staleReminders: boolean;
  lowStockAlerts: boolean;
  weeklyDigest: boolean;
  showWhatsapp: boolean;
  showPhone: boolean;
}

interface DashState {
  seeded: boolean;
  profile: Profile;
  branches: Branch[];
  activeBranchId: string;
  stock: Record<string, StockItem[]>;
  settings: PharmacySettings;
  ensureSeed: () => void;
  setProfile: (p: Partial<Profile>) => void;
  setSettings: (s: Partial<PharmacySettings>) => void;
  setActiveBranch: (id: string) => void;
  addBranch: (b: Omit<Branch, "id">) => void;
  updateBranch: (id: string, b: Partial<Branch>) => void;
  removeBranch: (id: string) => void;
  addStock: (branchId: string, item: Omit<StockItem, "id" | "updatedAt">) => void;
  updateStock: (branchId: string, id: string, patch: Partial<Omit<StockItem, "id">>) => void;
  removeStock: (branchId: string, ids: string[]) => void;
  setStatusBulk: (branchId: string, ids: string[], status: RawStatus) => void;
}

const DEMO = getPharmacy("ph-09")!;
const HOUR = 3_600_000;

const baseProfile: Profile = {
  name: DEMO.nameAr,
  owner: "مالك تجريبي",
  phone: DEMO.phone,
  whatsapp: DEMO.whatsapp,
  address: DEMO.address,
  districtId: DEMO.districtId,
  areaId: DEMO.areaId,
  hours: DEMO.hours,
  logoHue: DEMO.hue,
  coverIdx: 0,
};

const baseBranch: Branch = {
  id: "br-main",
  name: "الفرع الرئيسي",
  districtId: DEMO.districtId,
  areaId: DEMO.areaId,
  address: DEMO.address,
  phone: DEMO.phone,
  hours: DEMO.hours,
};

let uid = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${++uid}`;

function seedStock(salt: number): StockItem[] {
  const rng = mulberry32(900 + salt);
  const now = Date.now();
  const picks = [...medicines].sort(() => rng() - 0.5).slice(0, 26);
  return picks.map((m, i) => {
    const r = rng();
    const status: RawStatus = r < 0.55 ? "available" : r < 0.72 ? "limited" : r < 0.88 ? "out" : "unconfirmed";
    const ages = [0.4, 2, 5, 11, 26, 50, 90];
    return {
      id: `st-${salt}-${i}`,
      medicineId: m.id,
      status,
      qty: status === "out" ? 0 : status === "limited" ? 1 + Math.floor(rng() * 5) : 6 + Math.floor(rng() * 40),
      updatedAt: now - ages[Math.floor(rng() * ages.length)] * HOUR,
    };
  });
}

export const useDashStore = create<DashState>()(
  persist(
    (set, get) => ({
      seeded: false,
      profile: baseProfile,
      branches: [baseBranch],
      activeBranchId: baseBranch.id,
      stock: {},
      settings: { staleReminders: true, lowStockAlerts: true, weeklyDigest: false, showWhatsapp: true, showPhone: true },

      ensureSeed: () => {
        if (get().seeded) return;
        set({ seeded: true, stock: { [baseBranch.id]: seedStock(1) } });
      },
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setActiveBranch: (id) => set({ activeBranchId: id }),
      addBranch: (b) => {
        const id = nid("br");
        set((s) => ({
          branches: [...s.branches, { ...b, id }],
          stock: { ...s.stock, [id]: seedStock(s.branches.length + 2).slice(0, 12) },
        }));
      },
      updateBranch: (id, b) => set((s) => ({ branches: s.branches.map((x) => (x.id === id ? { ...x, ...b } : x)) })),
      removeBranch: (id) =>
        set((s) => {
          const branches = s.branches.filter((x) => x.id !== id);
          const stock = { ...s.stock };
          delete stock[id];
          return { branches, stock, activeBranchId: s.activeBranchId === id ? branches[0]?.id ?? "" : s.activeBranchId };
        }),
      addStock: (branchId, item) =>
        set((s) => ({
          stock: { ...s.stock, [branchId]: [{ ...item, id: nid("st"), updatedAt: Date.now() }, ...(s.stock[branchId] ?? [])] },
        })),
      updateStock: (branchId, id, patch) =>
        set((s) => ({
          stock: {
            ...s.stock,
            [branchId]: (s.stock[branchId] ?? []).map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
          },
        })),
      removeStock: (branchId, ids) =>
        set((s) => ({ stock: { ...s.stock, [branchId]: (s.stock[branchId] ?? []).filter((x) => !ids.includes(x.id)) } })),
      setStatusBulk: (branchId, ids, status) =>
        set((s) => ({
          stock: {
            ...s.stock,
            [branchId]: (s.stock[branchId] ?? []).map((x) =>
              ids.includes(x.id) ? { ...x, status, qty: status === "out" ? 0 : x.qty, updatedAt: Date.now() } : x
            ),
          },
        })),
    }),
    { name: "dwano-pharmacy-dash", storage: createJSONStorage(() => localStorage) }
  )
);
