import { mulberry32 } from "@/lib/rng";

/** SIMULATED metrics for UI demonstration only. Always label them as demo numbers. */
export const demoKpis = {
  medicines: 128,
  available: 94,
  unavailable: 34,
  contactClicks: 312,
  profileViews: 1840,
};

export const weeklyProfileViews = [120, 168, 150, 214, 198, 262, 310];
export const weeklyContactClicks = [22, 31, 28, 44, 39, 58, 71];

export const topSearched = [
  { name: "كتافلام", count: 214 },
  { name: "بانادول", count: 171 },
  { name: "أوجمنتين", count: 139 },
  { name: "فيتامين د٣", count: 96 },
  { name: "كونكور", count: 71 },
];

const r = mulberry32(4242);
const n = (x: number) => x.toLocaleString("ar-EG");

/** 14 days of pharmacy profile visits / contact clicks. */
export const days14 = Array.from({ length: 14 }, (_, i) => ({
  day: `يوم ${n(i + 1)}`,
  views: Math.round(90 + i * 9 + r() * 60),
  clicks: Math.round(12 + i * 1.6 + r() * 14),
}));

export const inventoryActivity = Array.from({ length: 8 }, (_, i) => ({
  week: `أسبوع ${n(i + 1)}`,
  updates: Math.round(20 + r() * 40 + i * 3),
}));

export const contactByChannel = [
  { name: "اتصال", value: 168 },
  { name: "واتساب", value: 104 },
  { name: "الاتجاهات", value: 40 },
];

/** Platform-wide (admin) simulated series. */
export const searchTrends = Array.from({ length: 12 }, (_, i) => ({
  week: `أسبوع ${n(i + 1)}`,
  searches: Math.round(400 + i * 85 + r() * 160),
  contacts: Math.round(60 + i * 17 + r() * 40),
}));

export const onboarding = ["شهر ١", "شهر ٢", "شهر ٣", "شهر ٤", "شهر ٥", "شهر ٦"].map((m, i) => ({
  month: m,
  pharmacies: Math.round(2 + i * 2.4 + r() * 3),
}));

export const popularMedicines = [
  { name: "كتافلام", searches: 1240 },
  { name: "بانادول إكسترا", searches: 980 },
  { name: "أوجمنتين", searches: 860 },
  { name: "فيتامين د٣", searches: 610 },
  { name: "كونكور", searches: 480 },
  { name: "نيوروبيون", searches: 390 },
];
