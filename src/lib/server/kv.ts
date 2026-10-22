
/**
 * Tiny Upstash/Vercel-KV Redis client over REST (no dependency).
 * Vercel: Storage → Create → Upstash Redis (or KV) → connect to the project; it adds the env vars below automatically.
 */
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const kvConfigured = Boolean(URL_ && TOKEN);

export async function kv<T = unknown>(...cmd: (string | number)[]): Promise<T> {
  if (!URL_ || !TOKEN) throw new Error("kv-not-configured");
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`kv-${res.status}`);
  const json = (await res.json()) as { result: T; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result;
}

export const REQUESTS_KEY = "dwano:requests";
export const SEEN_KEY = "dwano:requests:seen";
