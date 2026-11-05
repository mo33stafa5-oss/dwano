export type SubState = "active" | "pending" | "expired" | "suspended";

/**
 * Effective subscription state, computed from dates on every request (so expiry is automatic):
 *  suspended: admin suspended it · pending: never paid / not started · expired: end date passed · active otherwise
 */
export function effectiveSub(row: { status: string; start_date: string | null; end_date: string | null } | null, today: string): SubState {
  if (!row) return "pending";
  if (row.status === "suspended") return "suspended";
  if (!row.start_date || !row.end_date) return "pending";
  if (row.end_date < today) return "expired";
  if (row.start_date > today) return "pending";
  return row.status === "active" ? "active" : "pending";
}

export function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() !== day) d.setUTCDate(0); // clamp (e.g. Jan 31 + 1 month)
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
