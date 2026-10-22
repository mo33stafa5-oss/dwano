"use client";

import { Building2, Clock3, Pill, Search } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartBox, { CHART_COLORS } from "@/components/charts/ChartBox";
import { PageHeader, Panel, StatCard } from "./ui";
import { useAdminStore } from "@/store/adminDash";
import { ADMIN_STATUS_META, buildPharmacyRows, mergedMedicines } from "@/lib/adminData";
import { onboarding, searchTrends } from "@/data/analytics";
import { formatAgo } from "@/lib/utils";
import Link from "next/link";

const tip = { contentStyle: { borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 } };
const axis = { tick: { fontSize: 11, fill: "#64748B" }, tickLine: false, axisLine: false } as const;
const PIE = [CHART_COLORS.brand, CHART_COLORS.amber, CHART_COLORS.slate, CHART_COLORS.rose];

export default function AdminOverview() {
  const { statusOverrides, registered, customMedicines, medicineEdits, setPharmacyStatus } = useAdminStore();
  const rows = buildPharmacyRows(statusOverrides, registered);
  const meds = mergedMedicines(customMedicines, medicineEdits);
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const pending = rows.filter((r) => r.status === "pending");
  const pie = (["active", "pending", "suspended", "rejected"] as const).map((k) => ({ name: ADMIN_STATUS_META[k].label, value: count(k) }));

  return (
    <>
      <PageHeader title="نظرة عامة على المنصة" subtitle="ملخص تجريبي لحالة دوانو في محافظة الفيوم." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي الصيدليات" value={rows.length} icon={Building2} />
        <StatCard label="قيد المراجعة" value={count("pending")} icon={Clock3} tone="amber" />
        <StatCard label="الأدوية في الفهرس" value={meds.length} icon={Pill} tone="sky" />
        <StatCard label="عمليات بحث (محاكاة)" value={searchTrends.reduce((a, b) => a + b.searches, 0)} icon={Search} delta={12} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <ChartBox title="اتجاه البحث والتواصل" subtitle="آخر ١٢ أسبوعًا" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={searchTrends} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="week" interval={2} {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Area type="monotone" dataKey="searches" name="بحث" stroke={CHART_COLORS.brand} strokeWidth={3} fill="url(#gs)" />
              <Area type="monotone" dataKey="contacts" name="تواصل" stroke={CHART_COLORS.navy} strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="حالة الصيدليات" subtitle="حسب القرار الإداري" height={280} note="بيانات فعلية">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {pie.map((_, i) => (
                  <Cell key={i} fill={PIE[i]} />
                ))}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChartBox title="انضمام الصيدليات" subtitle="آخر ٦ شهور" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={onboarding} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Bar dataKey="pharmacies" name="صيدليات" fill={CHART_COLORS.glow} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <Panel title="طلبات تنتظر المراجعة" action={<Link href="/admin/pharmacies" className="text-xs font-extrabold text-brand">عرض الكل</Link>}>
          {pending.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-muted">لا توجد طلبات معلّقة.</p>
          ) : (
            <ul className="divide-y divide-navy/5">
              {pending.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{r.nameAr}</p>
                    <p className="text-xs font-medium text-muted">{r.createdAt ? formatAgo((Date.now() - r.createdAt) / 3_600_000) : "طلب تجريبي"}</p>
                  </div>
                  <button type="button" onClick={() => setPharmacyStatus(r.id, "active")} className="btn-light !px-4 !py-1.5 text-xs">
                    اعتماد
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
