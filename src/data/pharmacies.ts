import type { Pharmacy } from "@/types";
import { areasOfDistrict, getArea, getDistrict } from "./locations";
import { mulberry32 } from "@/lib/rng";

/**
 * 30 FICTIONAL pharmacies (DEMO DATA). Names, addresses and phone numbers are made up;
 * coordinates are illustrative. None of these are real businesses.
 */
const NAMES = [
  "النور", "الشفاء", "الأمل", "السلام", "الحياة", "الصفوة", "المحبة", "الإيمان", "الرحمة", "الفردوس",
  "الوفاء", "الواحة", "القمة", "البركة", "الندى", "الهدى", "الصحة", "العافية", "الأمان", "الفجر",
  "الريان", "الياسمين", "التوفيق", "الخير", "الوئام", "الأصدقاء", "الزهراء", "الأطباء", "المروج", "النخيل",
];

const DISTRIBUTION: [string, number][] = [
  ["fayoum", 8],
  ["sinnuris", 6],
  ["itsa", 4],
  ["ibshaway", 4],
  ["tamiya", 4],
  ["youssef-el-seddik", 4],
];

const HOURS = ["٩:٠٠ ص - ١٢:٠٠ م", "٨:٠٠ ص - ١١:٠٠ م", "٢٤ ساعة", "١٠:٠٠ ص - ١٢:٠٠ م", "٩:٠٠ ص - ١٠:٠٠ م"];

const rng = mulberry32(20261022);

let idx = 0;
export const pharmacies: Pharmacy[] = DISTRIBUTION.flatMap(([districtId, count]) => {
  const areaList = areasOfDistrict(districtId);
  const district = getDistrict(districtId)!;
  return Array.from({ length: count }, (_, k) => {
    const i = idx++;
    // Sinnuris gets 3 pharmacies in "المدينة" so the headline demo search (كتافلام / سنورس - المدينة) is rich.
    const area = districtId === "sinnuris" ? areaList[k < 3 ? 0 : (k - 2) % areaList.length] : areaList[k % areaList.length];
    const phone = `0100000${String(1000 + i).slice(-4)}`;
    return {
      id: `ph-${String(i + 1).padStart(2, "0")}`,
      nameAr: `صيدلية ${NAMES[i]}`,
      districtId,
      areaId: area.id,
      address: `شارع ${["الجمهورية", "الجيش", "النصر", "التحرير", "السلام", "المحطة"][(i + k) % 6]}، ${area.shortAr}، ${district.nameAr}`,
      phone,
      whatsapp: phone,
      lat: +(area.center[0] + (rng() - 0.5) * 0.012).toFixed(5),
      lng: +(area.center[1] + (rng() - 0.5) * 0.012).toFixed(5),
      hours: HOURS[(i * 3 + k) % HOURS.length],
      hue: 150 + Math.round(rng() * 60),
      isDemo: true as const,
    };
  });
});

export const getPharmacy = (id: string) => pharmacies.find((p) => p.id === id);
export const areaLabel = (p: Pharmacy) => getArea(p.areaId)?.nameAr ?? "";
