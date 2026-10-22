export type RawStatus = "available" | "limited" | "out" | "unconfirmed";
export type AvailabilityStatus = RawStatus | "stale";

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface District {
  id: string;
  governorateId: string;
  nameAr: string;
  nameEn: string;
  /** illustrative [lat, lng] — not surveyed */
  center: [number, number];
}

export interface Area {
  id: string;
  districtId: string;
  /** short name, e.g. "المدينة" */
  shortAr: string;
  /** full label, e.g. "سنورس - المدينة" */
  nameAr: string;
  center: [number, number];
}

export interface Medicine {
  id: string;
  nameAr: string;
  nameEn: string;
  strength: string;
  form: string;
  pack: string;
  category: string;
  aliases: string[];
}

export interface Pharmacy {
  id: string;
  nameAr: string;
  districtId: string;
  areaId: string;
  address: string;
  /** DEMO number, 11 digits. Never dialed from the UI. */
  phone: string;
  whatsapp: string;
  lat: number;
  lng: number;
  hours: string;
  /** hue used to generate a consistent illustration color */
  hue: number;
  isDemo: true;
}

export interface InventoryRecord {
  id: string;
  pharmacyId: string;
  medicineId: string;
  status: RawStatus;
  /** hours since the pharmacy last reported this item (static so SSR/CSR match) */
  hoursAgo: number;
}
