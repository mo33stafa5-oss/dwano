import { q, cairoToday, type Row } from "./db";
import { effectiveSub } from "./subscription";
import { getArea, getDistrict } from "@/data/locations";

export const username = /^[a-zA-Z0-9_.-]{4,30}$/;

/** Pharmacies with their subscription (effective state computed from dates) and account info. */
export async function listPharmacies(): Promise<Row[]> {
  const today = cairoToday();
  const rows = await q(
    `SELECT p.*, s.monthly_amount, s.start_date, s.end_date, s.status AS sub_status,
            (SELECT username FROM users u WHERE u.pharmacy_id = p.id LIMIT 1) AS username,
            (SELECT max(paid_at) FROM subscription_payments x WHERE x.pharmacy_id = p.id) AS last_paid_at
       FROM pharmacies p LEFT JOIN pharmacy_subscriptions s ON s.pharmacy_id = p.id
      ORDER BY p.created_at DESC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    owner: r.owner_name,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    address: r.address,
    hours: r.hours,
    districtId: r.district_id,
    areaId: r.area_id,
    districtName: r.district_id ? getDistrict(r.district_id)?.nameAr : null,
    areaName: r.area_id ? getArea(r.area_id)?.shortAr : null,
    status: r.status,
    source: r.source,
    username: r.username,
    createdAt: r.created_at,
    subscription: {
      amount: r.monthly_amount ?? 0,
      startDate: r.start_date,
      endDate: r.end_date,
      adminStatus: r.sub_status ?? "pending",
      state: effectiveSub(r.sub_status ? { status: r.sub_status, start_date: r.start_date, end_date: r.end_date } : null, today),
      lastPaidAt: r.last_paid_at,
    },
  }));
}
