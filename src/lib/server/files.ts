import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { get, put } from "@vercel/blob";

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

/** Validate by content (magic bytes), not by the client-supplied type or file name. */
export function sniffImage(buf: Buffer): ImageType | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export const EXT: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function readImageFile(file: unknown, maxBytes: number): Promise<{ buf: Buffer; type: ImageType } | { error: "file-too-large" | "file-type-not-allowed" | "file-empty" }> {
  if (!(file instanceof File)) return { error: "file-empty" };
  if (file.size === 0) return { error: "file-empty" };
  if (file.size > maxBytes) return { error: "file-too-large" };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  return type ? { buf, type } : { error: "file-type-not-allowed" };
}

export const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

// ───────────── private prescriptions: AES-256-GCM before upload, so the stored object is unreadable even if its URL leaks ─────────────
const encKey = () => {
  const k = process.env.PRESCRIPTION_KEY;
  if (!k || k.length < 24) throw new Error("PRESCRIPTION_KEY missing or too short");
  return createHash("sha256").update(k).digest();
};
/**
 * Blob auth: on Vercel the SDK uses OIDC (needs BLOB_STORE_ID, added when the store is connected to the project).
 * BLOB_READ_WRITE_TOKEN is only an optional fallback (e.g. local dev). Neither value is ever sent to the browser.
 */
export const blobConfigured = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
export const prescriptionsEnabled = () => blobConfigured() && (process.env.PRESCRIPTION_KEY?.length ?? 0) >= 24;

async function readPrivate(pathname: string): Promise<{ buf: Buffer; contentType: string } | null> {
  const r = await get(pathname, { access: "private" });
  if (!r || r.statusCode !== 200) return null;
  return { buf: Buffer.from(await new Response(r.stream).arrayBuffer()), contentType: r.blob.contentType };
}

export function encrypt(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]);
}
export function decrypt(blob: Buffer): Buffer {
  const d = createDecipheriv("aes-256-gcm", encKey(), blob.subarray(0, 12));
  d.setAuthTag(blob.subarray(12, 28));
  return Buffer.concat([d.update(blob.subarray(28)), d.final()]);
}

/** Stores the ENCRYPTED prescription in the private store and returns its pathname (kept in `prescriptions.storage_url`). */
export async function storePrescription(requestId: string, plain: Buffer): Promise<string> {
  const r = await put(`rx/${requestId}`, encrypt(plain), { access: "private", addRandomSuffix: true, contentType: "application/octet-stream" });
  return r.pathname;
}
export async function loadPrescription(pathname: string): Promise<Buffer> {
  const f = await readPrivate(pathname);
  if (!f) throw new Error("blob-fetch-failed");
  return decrypt(f.buf);
}

/** Product pictures live in the private store too and are served through /api/souqak/image/[id]. Returns the pathname. */
export async function storeProductImage(pharmacyId: string, buf: Buffer, type: ImageType): Promise<string> {
  const r = await put(`products/${pharmacyId}/img.${EXT[type]}`, buf, { access: "private", addRandomSuffix: true, contentType: type });
  return r.pathname;
}
export async function loadProductImage(pathname: string) {
  return readPrivate(pathname);
}
export const productImageUrl = (id: string, hasImage: boolean, v?: string | Date | null) => (hasImage ? `/api/souqak/image/${id}${v ? `?v=${new Date(v).getTime()}` : ""}` : null);
