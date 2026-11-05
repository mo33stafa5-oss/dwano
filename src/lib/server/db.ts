import { Pool, types, type PoolClient } from "pg";

// keep DATE as 'YYYY-MM-DD' strings, numeric/bigint as numbers
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => parseFloat(v));
types.setTypeParser(20, (v) => parseInt(v, 10));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

const URL_ = process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const dbConfigured = Boolean(URL_);

const g = globalThis as unknown as { __dwanoPg?: Pool };
function pool() {
  if (!g.__dwanoPg) g.__dwanoPg = new Pool({ connectionString: URL_, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
  return g.__dwanoPg;
}

export async function q(text: string, params: unknown[] = []): Promise<Row[]> {
  return (await pool().query(text, params)).rows;
}

export async function q1(text: string, params: unknown[] = []): Promise<Row | null> {
  return (await q(text, params))[0] ?? null;
}

/** Run several statements atomically. Rolls back on any error. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("BEGIN");
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

export const cairoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
