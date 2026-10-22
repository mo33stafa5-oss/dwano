import { pharmacies } from "@/data/pharmacies";
import { districts, areas } from "@/data/locations";
import { medicines } from "@/data/medicines";
import { defaultAdminStatus, type PharmacyAdminStatus, type RegisteredPharmacy } from "@/store/adminDash";
import type { Area, District, Medicine } from "@/types";

export interface AdminPharmacyRow {
  id: string;
  nameAr: string;
  owner: string;
  phone: string;
  districtId: string;
  areaId: string;
  address: string;
  status: PharmacyAdminStatus;
  source: "demo" | "registered";
  createdAt?: number;
}

export const ADMIN_STATUS_META: Record<PharmacyAdminStatus, { label: string; chip: string }> = {
  active: { label: "نشطة", chip: "bg-brand-mint text-brand-deep ring-1 ring-brand/25" },
  pending: { label: "قيد المراجعة", chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  suspended: { label: "موقوفة", chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  rejected: { label: "مرفوضة", chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

export function buildPharmacyRows(
  overrides: Record<string, PharmacyAdminStatus>,
  registered: RegisteredPharmacy[]
): AdminPharmacyRow[] {
  const demo: AdminPharmacyRow[] = pharmacies.map((p) => ({
    id: p.id,
    nameAr: p.nameAr,
    owner: "مالك تجريبي",
    phone: p.phone,
    districtId: p.districtId,
    areaId: p.areaId,
    address: p.address,
    status: overrides[p.id] ?? defaultAdminStatus(p.id),
    source: "demo",
  }));
  const reg: AdminPharmacyRow[] = registered.map((r) => ({
    id: r.id,
    nameAr: r.nameAr,
    owner: r.owner,
    phone: r.phone,
    districtId: r.districtId,
    areaId: r.areaId,
    address: r.address,
    status: overrides[r.id] ?? "pending",
    source: "registered",
    createdAt: r.createdAt,
  }));
  return [...reg, ...demo];
}

export function mergedMedicines(custom: Medicine[], edits: Record<string, Partial<Medicine>>): Medicine[] {
  return [...custom, ...medicines.map((m) => ({ ...m, ...edits[m.id] }))];
}

export function mergedDistricts(extra: { id: string; nameAr: string }[]): (District & { extra?: boolean })[] {
  return [
    ...districts,
    ...extra.map((d) => ({ id: d.id, governorateId: "gov-fayoum", nameAr: d.nameAr, nameEn: d.nameAr, center: [29.31, 30.84] as [number, number], extra: true })),
  ];
}

export function mergedAreas(extra: { id: string; districtId: string; nameAr: string }[], dists: { id: string; nameAr: string }[]): (Area & { extra?: boolean })[] {
  return [
    ...areas,
    ...extra.map((a) => ({
      id: a.id,
      districtId: a.districtId,
      shortAr: a.nameAr,
      nameAr: `${dists.find((d) => d.id === a.districtId)?.nameAr ?? ""} - ${a.nameAr}`,
      center: [29.31, 30.84] as [number, number],
      extra: true,
    })),
  ];
}
