"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartBox, { CHART_COLORS } from "@/components/charts/ChartBox";
import { PageHeader } from "./ui";
import { days14, inventoryActivity, topSearched } from "@/data/analytics";

const tip = { contentStyle: { borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 } };
const axis = { tick: { fontSize: 11, fill: "#64748B" }, tickLine: false, axisLine: false } as const;

export default function PharmacyAnalytics() {
  return (
    <>
      <PageHeader title="التحليلات" subtitle="كل الأرقام هنا محاكاة لأغراض العرض." />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartBox title="زيارات الملف" subtitle="آخر ١٤ يومًا" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days14} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" interval={2} {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="views" name="زيارات" stroke={CHART_COLORS.brand} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="نقرات التواصل" subtitle="آخر ١٤ يومًا" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days14} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" interval={2} {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="clicks" name="نقرات" stroke={CHART_COLORS.navy} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="الأدوية الأكثر بحثًا" subtitle="في منطقتك" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSearched} layout="vertical" margin={{ top: 4, right: 12, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" {...axis} />
              <YAxis type="category" dataKey="name" width={80} {...axis} />
              <Tooltip {...tip} />
              <Bar dataKey="count" name="عمليات بحث" fill={CHART_COLORS.glow} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="نشاط تحديث المخزون" subtitle="تحديثات أسبوعية" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryActivity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="week" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Bar dataKey="updates" name="تحديثات" fill={CHART_COLORS.brand} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </>
  );
}
