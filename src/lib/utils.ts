import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function toArabicDigits(n: number | string) {
  return Number(n).toLocaleString("ar-EG");
}

/** Demo phone numbers are stored as 11 digits; display as 0100 000 1000. */
export function formatPhone(p: string) {
  return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
}

export function formatAgo(hours: number) {
  const n = (x: number) => x.toLocaleString("ar-EG");
  if (hours < 1) return "قبل أقل من ساعة";
  if (hours < 24) {
    const h = Math.round(hours);
    if (h === 1) return "قبل ساعة";
    if (h === 2) return "قبل ساعتين";
    return `قبل ${n(h)} ${h <= 10 ? "ساعات" : "ساعة"}`;
  }
  const d = Math.round(hours / 24);
  if (d === 1) return "قبل يوم";
  if (d === 2) return "قبل يومين";
  return `قبل ${n(d)} ${d <= 10 ? "أيام" : "يومًا"}`;
}
