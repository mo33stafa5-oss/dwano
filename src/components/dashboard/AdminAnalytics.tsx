"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartBox, { CHART_COLORS } from "@/components/charts/ChartBox";
import { PageHeader } from "./ui";
import { useAdminStore } from "@/store/adminDash";
import { buildPharmacyRows } from "@/lib/adminData";
import { districts } from "@/data/locations";
import { contactByChannel, popularMedicines, searchTrends } from "@/data/analytics";

const tip = { contentStyle: { borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 } };
const axis = { tick: { fontSize: 11, fill: "#64748B" }, tickLine: false, axisLine: false } as const;
const PIE = [CHART_COLORS.brand, CHART_COLORS.navy, CHART_COLORS.sky];

export default function AdminAnalytics() {
  const { statusOverrides, registered } = useAdminStore();
  const rows = buildPharmacyRows(statusOverrides, registered).filter((r) => r.status === "active");
  const byDistrict = districts.map((d) => ({ name: d.nameAr, count: rows.filter((r) => r.districtId === d.id).length }));

  return (
    <>
      <PageHeader title="تحليلات المنصة" subtitle="أرقام البحث والتواصل محاكاة. توزيع الصيدليات النشطة محسوب من البيانات." />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartBox title="عمليات البحث الأسبوعية" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={searchTrends} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="week" interval={2} {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="searches" name="بحث" stroke={CHART_COLORS.brand} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="قنوات التواصل" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={contactByChannel} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {contactByChannel.map((_, i) => (
                  <Cell key={i} fill={PIE[i % PIE.length]} />
                ))}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="الأدوية الأكثر بحثًا" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={popularMedicines} layout="vertical" margin={{ top: 4, right: 12, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" {...axis} />
              <YAxis type="category" dataKey="name" width={90} {...axis} />
              <Tooltip {...tip} />
              <Bar dataKey="searches" name="بحث" fill={CHART_COLORS.glow} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="الصيدليات النشطة لكل مركز" height={280} note="بيانات فعلية">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDistrict} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" {...axis} />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip {...tip} />
              <Bar dataKey="count" name="صيدليات" fill={CHART_COLORS.brand} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </>
  );
}
