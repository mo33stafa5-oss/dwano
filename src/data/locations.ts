import type { Area, District, Governorate } from "@/types";

/** Normalized location IDs. Coordinates are ILLUSTRATIVE only. */
export const governorates: Governorate[] = [{ id: "gov-fayoum", nameAr: "الفيوم", nameEn: "Fayoum" }];

export const districts: District[] = [
  { id: "fayoum", governorateId: "gov-fayoum", nameAr: "الفيوم", nameEn: "Fayoum", center: [29.31, 30.84] },
  { id: "sinnuris", governorateId: "gov-fayoum", nameAr: "سنورس", nameEn: "Sinnuris", center: [29.41, 30.87] },
  { id: "itsa", governorateId: "gov-fayoum", nameAr: "إطسا", nameEn: "Itsa", center: [29.23, 30.77] },
  { id: "ibshaway", governorateId: "gov-fayoum", nameAr: "أبشواي", nameEn: "Ibshaway", center: [29.36, 30.68] },
  { id: "tamiya", governorateId: "gov-fayoum", nameAr: "طامية", nameEn: "Tamiya", center: [29.46, 30.99] },
  {
    id: "youssef-el-seddik",
    governorateId: "gov-fayoum",
    nameAr: "يوسف الصديق",
    nameEn: "Youssef El Seddik",
    center: [29.43, 30.69],
  },
];

const AREA_SUFFIXES: { key: string; ar: string; d: [number, number] }[] = [
  { key: "city", ar: "المدينة", d: [0, 0] },
  { key: "east", ar: "الحي الشرقي", d: [0.006, 0.014] },
  { key: "west", ar: "الحي الغربي", d: [-0.004, -0.015] },
  { key: "north", ar: "الحي الشمالي", d: [0.015, -0.003] },
  { key: "south", ar: "الحي الجنوبي", d: [-0.014, 0.004] },
];

/** 5 illustrative areas per district (30 in total). */
export const areas: Area[] = districts.flatMap((d) =>
  AREA_SUFFIXES.map((s) => ({
    id: `${d.id}-${s.key}`,
    districtId: d.id,
    shortAr: s.ar,
    nameAr: `${d.nameAr} - ${s.ar}`,
    center: [d.center[0] + s.d[0], d.center[1] + s.d[1]] as [number, number],
  }))
);

export const getDistrict = (id: string) => districts.find((d) => d.id === id);
export const getArea = (id: string) => areas.find((a) => a.id === id);
export const areasOfDistrict = (districtId: string) => areas.filter((a) => a.districtId === districtId);
export const districtsOfGovernorate = (govId: string) => districts.filter((d) => d.governorateId === govId);
