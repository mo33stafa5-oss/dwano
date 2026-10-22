import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Medicine } from "@/types";
import type { DemoRole } from "@/data/users";

export type PharmacyAdminStatus = "active" | "pending" | "suspended" | "rejected";

/** Pharmacies created via the registration wizard (frontend-only, stored in this browser). */
export interface RegisteredPharmacy {
  id: string;
  nameAr: string;
  owner: string;
  phone: string;
  districtId: string;
  areaId: string;
  address: string;
  createdAt: number;
}

export interface ExtraDistrict {
  id: string;
  nameAr: string;
}
export interface ExtraArea {
  id: string;
  districtId: string;
  nameAr: string;
}

export interface PlatformSettings {
  verifyNewPharmacies: boolean;
  showDemoBanner: boolean;
  staleAfterHours: number;
  maintenance: boolean;
}

interface AdminState {
  statusOverrides: Record<string, PharmacyAdminStatus>;
  registered: RegisteredPharmacy[];
  customMedicines: Medicine[];
  medicineEdits: Record<string, Partial<Medicine>>;
  extraDistricts: ExtraDistrict[];
  extraAreas: ExtraArea[];
  roles: Record<string, DemoRole>;
  settings: PlatformSettings;
  setPharmacyStatus: (id: string, s: PharmacyAdminStatus) => void;
  registerPharmacy: (p: Omit<RegisteredPharmacy, "id" | "createdAt">) => string;
  addMedicine: (m: Omit<Medicine, "id">) => void;
  editMedicine: (id: string, patch: Partial<Medicine>) => void;
  addDistrict: (nameAr: string) => void;
  addArea: (districtId: string, nameAr: string) => void;
  removeExtra: (kind: "district" | "area", id: string) => void;
  setRole: (userId: string, role: DemoRole) => void;
  setSettings: (s: Partial<PlatformSettings>) => void;
}

let n = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${++n}`;

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      statusOverrides: {},
      registered: [],
      customMedicines: [],
      medicineEdits: {},
      extraDistricts: [],
      extraAreas: [],
      roles: {},
      settings: { verifyNewPharmacies: true, showDemoBanner: true, staleAfterHours: 72, maintenance: false },

      setPharmacyStatus: (id, s) => set((st) => ({ statusOverrides: { ...st.statusOverrides, [id]: s } })),
      registerPharmacy: (p) => {
        const id = nid("reg");
        set((st) => ({ registered: [{ ...p, id, createdAt: Date.now() }, ...st.registered] }));
        return id;
      },
      addMedicine: (m) => set((st) => ({ customMedicines: [{ ...m, id: nid("med") }, ...st.customMedicines] })),
      editMedicine: (id, patch) =>
        set((st) => {
          if (st.customMedicines.some((m) => m.id === id)) {
            return { customMedicines: st.customMedicines.map((m) => (m.id === id ? { ...m, ...patch } : m)) };
          }
          return { medicineEdits: { ...st.medicineEdits, [id]: { ...st.medicineEdits[id], ...patch } } };
        }),
      addDistrict: (nameAr) => set((st) => ({ extraDistricts: [...st.extraDistricts, { id: nid("dist"), nameAr }] })),
      addArea: (districtId, nameAr) => set((st) => ({ extraAreas: [...st.extraAreas, { id: nid("area"), districtId, nameAr }] })),
      removeExtra: (kind, id) =>
        set((st) =>
          kind === "district"
            ? { extraDistricts: st.extraDistricts.filter((d) => d.id !== id), extraAreas: st.extraAreas.filter((a) => a.districtId !== id) }
            : { extraAreas: st.extraAreas.filter((a) => a.id !== id) }
        ),
      setRole: (userId, role) => set((st) => ({ roles: { ...st.roles, [userId]: role } })),
      setSettings: (p) => set((st) => ({ settings: { ...st.settings, ...p } })),
    }),
    { name: "dwano-admin-dash", storage: createJSONStorage(() => localStorage) }
  )
);

/** Deterministic default status for the seeded demo pharmacies. */
export function defaultAdminStatus(id: string): PharmacyAdminStatus {
  const n = Number(id.replace(/\D/g, ""));
  if (n === 14) return "suspended";
  if (n === 22) return "rejected";
  if (n % 9 === 0 && n !== 9) return "pending";
  if (n === 5 || n === 27) return "pending";
  return "active";
}
