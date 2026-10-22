"use client";

import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye, MousePointerClick, Package, PackageCheck, PackageX } from "lucide-react";
import ChartBox, { CHART_COLORS } from "@/components/charts/ChartBox";
import StatusBadge from "@/components/ui/StatusBadge";
import { PageHeader, Panel, StatCard } from "./ui";
import { useDashStore } from "@/store/pharmacyDash";
import { getMedicine } from "@/data/medicines";
import { contactByChannel, days14 } from "@/data/analytics";
import { effectiveStatus } from "@/lib/status";
import { formatAgo } from "@/lib/utils";

export default function PharmacyOverview() {
  const { stock, activeBranchId, branches } = useDashStore();
  const items = stock[activeBranchId] ?? [];
  const branch = branches.find((b) => b.id === activeBranchId);
  const hoursAgo = (t: number) => (Date.now() - t) / 3_600_000;
  const available = items.filter((i) => i.status === "available" || i.status === "limited").length;
  const out = items.filter((i) => i.status === "out").length;
  const recent = [...items].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);

  return (
    <>
      <PageHeader title="نظرة عامة" subtitle={`الفرع: ${branch?.name ?? "—"} · أرقام الزيارات والنقرات تجريبية`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="إجمالي الأدوية" value={items.length} icon={Package} />
        <StatCard label="متوفرة" value={available} icon={PackageCheck} delta={4} />
        <StatCard label="غير متوفرة" value={out} icon={PackageX} tone="rose" />
        <StatCard label="نقرات التواصل (تجريبي)" value={312} icon={MousePointerClick} tone="sky" delta={12} />
        <StatCard label="زيارات الملف (تجريبي)" value={1840} icon={Eye} tone="amber" delta={8} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <ChartBox title="زيارات الملف ونقرات التواصل" subtitle="آخر ١٤ يومًا" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={days14} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={CHART_COLORS.brand} stopOpacity={0.35} />
                  <stop offset="1" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="views" name="زيارات" stroke={CHART_COLORS.brand} strokeWidth={2.5} fill="url(#gv)" />
              <Area type="monotone" dataKey="clicks" name="نقرات" stroke={CHART_COLORS.navy} strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="قنوات التواصل" subtitle="توزيع النقرات" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contactByChannel} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Bar dataKey="value" name="نقرات" fill={CHART_COLORS.brand} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <Panel
        className="mt-5"
        title="آخر تحديثات المخزون"
        action={
          <Link href="/pharmacy/inventory" className="text-xs font-extrabold text-brand hover:underline">
            إدارة المخزون
          </Link>
        }
      >
        <ul className="divide-y divide-navy/5">
          {recent.map((r) => {
            const m = getMedicine(r.medicineId);
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-sm font-extrabold">{m?.nameAr}</span>
                <span className="flex items-center gap-3 text-xs font-bold text-muted">
                  {formatAgo(hoursAgo(r.updatedAt))}
                  <StatusBadge status={effectiveStatus(r.status, hoursAgo(r.updatedAt))} />
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
