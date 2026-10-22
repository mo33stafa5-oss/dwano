import type { AvailabilityStatus, InventoryRecord, Medicine, Pharmacy } from "@/types";
import { inventory } from "@/data/inventory";
import { medicines } from "@/data/medicines";
import { pharmacies } from "@/data/pharmacies";
import { getArea } from "@/data/locations";
import { effectiveStatus, STATUS_ORDER } from "./status";

export function normalizeAr(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ");
}

function terms(m: Medicine) {
  return [m.nameAr, m.nameEn, ...m.aliases].map(normalizeAr);
}

function score(m: Medicine, q: string) {
  let best = 0;
  for (const t of terms(m)) {
    if (t === q) best = Math.max(best, 5);
    else if (t.startsWith(q)) best = Math.max(best, 3);
    else if (t.includes(q)) best = Math.max(best, 1);
  }
  return best;
}

/** Autocomplete over the medicine catalog (Arabic-normalized, brand aliases included). */
export function suggestMedicines(query: string, limit = 6): Medicine[] {
  const q = normalizeAr(query);
  if (!q) return [];
  return medicines
    .map((m) => ({ m, s: score(m, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.m);
}

export type SearchScope = "area" | "district" | "governorate";

export interface SearchParams {
  q?: string;
  medicineId?: string;
  districtId?: string;
  areaId?: string;
  statuses?: AvailabilityStatus[];
  scope?: SearchScope;
  sort?: "relevance" | "fresh";
}

export interface SearchHit {
  record: InventoryRecord;
  pharmacy: Pharmacy;
  medicine: Medicine;
  status: AvailabilityStatus;
}

export function matchMedicineIds(q?: string, medicineId?: string): Set<string> {
  if (medicineId) return new Set([medicineId]);
  const n = normalizeAr(q ?? "");
  if (!n) return new Set();
  return new Set(medicines.filter((m) => score(m, n) > 0).map((m) => m.id));
}

export function searchInventory(p: SearchParams): SearchHit[] {
  const ids = matchMedicineIds(p.q, p.medicineId);
  if (ids.size === 0) return [];
  const scope = p.scope ?? "area";
  const area = p.areaId ? getArea(p.areaId) : undefined;
  const districtId = p.districtId ?? area?.districtId;

  const hits: SearchHit[] = [];
  for (const record of inventory) {
    if (!ids.has(record.medicineId)) continue;
    const pharmacy = pharmacies.find((x) => x.id === record.pharmacyId);
    const medicine = medicines.find((x) => x.id === record.medicineId);
    if (!pharmacy || !medicine) continue;

    if (scope === "area" && p.areaId && pharmacy.areaId !== p.areaId) continue;
    if ((scope === "district" || (scope === "area" && !p.areaId)) && districtId && pharmacy.districtId !== districtId)
      continue;

    const status = effectiveStatus(record.status, record.hoursAgo);
    if (p.statuses && p.statuses.length > 0 && !p.statuses.includes(status)) continue;
    hits.push({ record, pharmacy, medicine, status });
  }

  hits.sort((a, b) =>
    p.sort === "fresh"
      ? a.record.hoursAgo - b.record.hoursAgo
      : STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.record.hoursAgo - b.record.hoursAgo
  );
  return hits;
}
