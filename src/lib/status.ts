import type { AvailabilityStatus, RawStatus } from "@/types";

/** Reports older than this are shown as "stale" instead of "available". */
export const STALE_AFTER_HOURS = 72;

export const STATUS_ORDER: AvailabilityStatus[] = ["available", "limited", "unconfirmed", "stale", "out"];

export const STATUS_META: Record<
  AvailabilityStatus,
  { label: string; hint: string; chip: string; dot: string; marker: string }
> = {
  available: {
    label: "متوفر",
    hint: "الصيدلية أعلنت توفره",
    chip: "bg-brand-mint text-brand-deep ring-1 ring-brand/25",
    dot: "bg-brand",
    marker: "#008F73",
  },
  limited: {
    label: "كمية محدودة",
    hint: "الصيدلية أعلنت كمية محدودة",
    chip: "bg-amber-50 text-amber-800 ring-1 ring-amber-300/60",
    dot: "bg-amber-500",
    marker: "#F59E0B",
  },
  out: {
    label: "غير متوفر",
    hint: "الصيدلية أعلنت نفاده",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-300/60",
    dot: "bg-rose-500",
    marker: "#F43F5E",
  },
  unconfirmed: {
    label: "غير مؤكد",
    hint: "لم تؤكد الصيدلية الحالة بعد",
    chip: "bg-sky-50 text-sky-800 ring-1 ring-sky-300/60",
    dot: "bg-sky-500",
    marker: "#0EA5E9",
  },
  stale: {
    label: "بيانات قديمة",
    hint: "آخر تحديث قديم، يُرجى التأكد بالاتصال",
    chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-300/70",
    dot: "bg-slate-400",
    marker: "#94A3B8",
  },
};

/** Stale inventory is never presented as confirmed availability. */
export function effectiveStatus(status: RawStatus, hoursAgo: number): AvailabilityStatus {
  if (hoursAgo > STALE_AFTER_HOURS && (status === "available" || status === "limited")) return "stale";
  return status;
}

export const MEDICAL_DISCLAIMER = "معلومات توافر الأدوية استرشادية، ويُرجى التأكد من الصيدلية قبل التوجه إليها.";
