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

export const egPhone = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .transform(normalizeEgPhone)
    .refine((v) => /^01[0125]\d{8}$/.test(v), "اكتب رقم موبايل مصري صحيح (مثال: 01012345678)");

export const requestSchema = z.object({
  fullName: z.string().trim().min(3, "اكتب الاسم بالكامل (٣ أحرف على الأقل)").max(100),
  phone: egPhone("رقم الهاتف"),
  whatsapp: egPhone("رقم الواتساب"),
  address: z.string().trim().max(200, "العنوان طويل جدًا").optional(),
});
export type RequestFormInput = z.input<typeof requestSchema>;
export type RequestFormValues = z.output<typeof requestSchema>;

export const PRESCRIPTION_MAX_BYTES = 4 * 1024 * 1024; // stays under the 4.5 MB serverless body limit
export const PRESCRIPTION_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface Coordinates {
  lat: number;
  lng: number;
  accuracyM?: number;
  capturedAt: string;
}

export type RequestWorkflow = "new" | "in_review" | "contacted" | "closed";

export interface MedicineRequest {
  id: string;
  createdAt: string;
  medicine: { id?: string; name: string };
  customer: { fullName: string; phone: string; whatsapp: string };
  location: {
    governorate: { id: string; name: string };
    district?: { id: string; name: string };
    area?: { id: string; name: string };
    address?: string;
    coordinates?: Coordinates;
  };
  /** "submitted" = the server stored it. "saved-locally" = only stored in this browser. */
  status: "saved-locally" | "submitted";
  seen?: boolean;
  workflow?: RequestWorkflow;
  hasPrescription?: boolean;
}

export type SubmitInput = Omit<MedicineRequest, "id" | "createdAt" | "status" | "seen" | "workflow" | "hasPrescription">;

export type SubmitResult =
  | { ok: true; request: MedicineRequest }
  | { ok: false; error: "prescription-too-large" | "prescription-type" | "prescriptions-not-configured" | "rate-limited" | "invalid" };

const STORE_KEY = "dwano-medicine-requests";
export const REQUESTS_EVENT = "dwano:requests";

function localId() {
  return `DW-L${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).toUpperCase().slice(2, 5)}`;
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
    localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 50)));
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
 * Single submission seam: multipart POST (JSON `data` + optional `prescription` image) to /api/medicine-requests.
 * If the server is unreachable or not configured, the request is kept in this browser only (status "saved-locally").
 */
export async function submitMedicineRequest(input: SubmitInput, prescription?: File | null): Promise<SubmitResult> {
  const endpoint = process.env.NEXT_PUBLIC_REQUEST_ENDPOINT || "/api/medicine-requests";
  const fd = new FormData();
  fd.set("data", JSON.stringify(input));
  if (prescription) fd.set("prescription", prescription);
  try {
    const res = await fetch(endpoint, { method: "POST", body: fd });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string; createdAt?: string };
    if (res.ok && json.id) {
      const req: MedicineRequest = { ...input, id: json.id, createdAt: json.createdAt ?? new Date().toISOString(), status: "submitted", seen: false, hasPrescription: Boolean(prescription) };
      return { ok: true, request: req };
    }
    if (json.error === "file-too-large") return { ok: false, error: "prescription-too-large" };
    if (json.error === "file-type-not-allowed" || json.error === "file-empty") return { ok: false, error: "prescription-type" };
    if (json.error === "prescriptions-not-configured") return { ok: false, error: "prescriptions-not-configured" };
    if (res.status === 429) return { ok: false, error: "rate-limited" };
    if (res.status === 400) return { ok: false, error: "invalid" };
  } catch {
    /* fall through to local copy */
  }
  const local: MedicineRequest = { ...input, id: localId(), createdAt: new Date().toISOString(), status: "saved-locally", seen: false, hasPrescription: false };
  writeRequests([local, ...loadRequests()]);
  return { ok: true, request: local };
}
