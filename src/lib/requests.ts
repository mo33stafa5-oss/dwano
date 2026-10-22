import { z } from "zod";

/** Egyptian mobile: 01[0125] + 8 digits. Accepts Arabic digits, spaces, +20 / 0020 prefixes. */
export function normalizeEgPhone(raw: string): string {
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = raw.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d))).replace(/[\s\-()]/g, "");
  if (s.startsWith("+20")) s = "0" + s.slice(3);
  else if (s.startsWith("0020")) s = "0" + s.slice(4);
  else if (/^20\d{10}$/.test(s)) s = "0" + s.slice(2);
  return s;
}

const phone = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .transform(normalizeEgPhone)
    .refine((v) => /^01[0125]\d{8}$/.test(v), "اكتب رقم موبايل مصري صحيح (مثال: 01012345678)");

export const requestSchema = z.object({
  fullName: z.string().trim().min(3, "اكتب الاسم بالكامل (٣ أحرف على الأقل)"),
  email: z.string().trim().min(1, "البريد الإلكتروني مطلوب").email("اكتب بريدًا إلكترونيًا صحيحًا"),
  phone: phone("رقم الهاتف"),
  whatsapp: phone("رقم الواتساب"),
  address: z.string().trim().max(200, "العنوان طويل جدًا").optional(),
});
export type RequestFormInput = z.input<typeof requestSchema>;
export type RequestFormValues = z.output<typeof requestSchema>;

export interface Coordinates {
  lat: number;
  lng: number;
  accuracyM?: number;
  capturedAt: string;
}

export interface MedicineRequest {
  id: string;
  createdAt: string;
  medicine: { id?: string; name: string };
  customer: { fullName: string; email: string; phone: string; whatsapp: string };
  location: {
    governorate: { id: string; name: string };
    district?: { id: string; name: string };
    area?: { id: string; name: string };
    address?: string;
    coordinates?: Coordinates;
  };
  /** "submitted" = the server accepted it (and emailed the team). "saved-locally" = only stored in this browser. */
  status: "saved-locally" | "submitted";
  /** admin has opened it in the dashboard (this browser only) */
  seen?: boolean;
}

const STORE_KEY = "dwano-medicine-requests";
export const REQUESTS_EVENT = "dwano:requests";

export function generateRequestId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `DW-${t}${r}`;
}

export function loadRequests(): MedicineRequest[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeRequests(list: MedicineRequest[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 100)));
    window.dispatchEvent(new Event(REQUESTS_EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function markRequestsSeen() {
  const list = loadRequests();
  if (list.some((r) => !r.seen)) writeRequests(list.map((r) => ({ ...r, seen: true })));
}

/**
 * Single submission seam.
 * 1) POSTs the request to the server route (emails the Dwano team) or to NEXT_PUBLIC_REQUEST_ENDPOINT if set.
 * 2) Always keeps a copy in this browser so the admin dashboard on the same browser can show a notification.
 * If the server cannot deliver (e.g. email not configured), the request is saved locally and flagged "saved-locally".
 */
export async function submitMedicineRequest(req: Omit<MedicineRequest, "status" | "seen">): Promise<MedicineRequest> {
  const endpoint = process.env.NEXT_PUBLIC_REQUEST_ENDPOINT || "/api/medicine-requests";
  let delivered = false;
  try {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
    delivered = res.ok;
  } catch {
    delivered = false;
  }
  const saved: MedicineRequest = { ...req, status: delivered ? "submitted" : "saved-locally", seen: false };
  writeRequests([saved, ...loadRequests()]);
  return saved;
}
