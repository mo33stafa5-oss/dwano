import type { InventoryRecord, RawStatus } from "@/types";
import { pharmacies } from "./pharmacies";
import { medicines } from "./medicines";
import { mulberry32 } from "@/lib/rng";

/** 130 DEMO inventory records. IDs reference pharmacies.ts and medicines.ts. */
const rng = mulberry32(77031);
const records: InventoryRecord[] = [];
const seen = new Set<string>();
let n = 0;

function add(pharmacyId: string, medicineId: string, status: RawStatus, hoursAgo: number) {
  const key = `${pharmacyId}:${medicineId}`;
  if (seen.has(key)) return;
  seen.add(key);
  records.push({ id: `inv-${String(++n).padStart(3, "0")}`, pharmacyId, medicineId, status, hoursAgo });
}

// Guarantee a rich Cataflam story in Sinnuris (the headline demo search) and Fayoum.
const SINNURIS_STATUS: [RawStatus, number][] = [
  ["available", 0.5],
  ["available", 3],
  ["limited", 18],
  ["out", 6],
  ["available", 96], // old report -> shown as "stale"
  ["unconfirmed", 30],
];
pharmacies
  .filter((p) => p.districtId === "sinnuris")
  .forEach((p, i) => add(p.id, "cataflam-50", ...SINNURIS_STATUS[i % SINNURIS_STATUS.length]));
pharmacies
  .filter((p) => p.districtId === "sinnuris")
  .slice(0, 3)
  .forEach((p, i) => add(p.id, "cataflam-25", i === 1 ? "limited" : "available", [2, 8, 20][i]));
pharmacies
  .filter((p) => p.districtId === "fayoum")
  .forEach((p, i) => {
    if (i % 2 === 0) add(p.id, "cataflam-50", i % 4 === 0 ? "available" : "limited", [1, 5, 12, 40][i % 4]);
  });
pharmacies
  .filter((p) => ["itsa", "tamiya"].includes(p.districtId))
  .slice(0, 3)
  .forEach((p, i) => add(p.id, "cataflam-50", ["available", "out", "unconfirmed"][i] as RawStatus, [4, 9, 52][i]));

const AGES = [0.3, 1, 2, 5, 9, 14, 26, 40, 70, 100, 150];
function pickStatus(): RawStatus {
  const r = rng();
  if (r < 0.5) return "available";
  if (r < 0.7) return "limited";
  if (r < 0.85) return "out";
  return "unconfirmed";
}

while (records.length < 130) {
  const p = pharmacies[Math.floor(rng() * pharmacies.length)];
  const m = medicines[Math.floor(rng() * medicines.length)];
  add(p.id, m.id, pickStatus(), AGES[Math.floor(rng() * AGES.length)]);
}

export const inventory: InventoryRecord[] = records;
