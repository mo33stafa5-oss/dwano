"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";

/** Card wrapper for Recharts. Charts render after mount so ResponsiveContainer never measures 0×0 during SSR. */
export default function ChartBox({
  title,
  subtitle,
  height = 260,
  children,
  className,
  note,
}: {
  title: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
  className?: string;
  note?: string;
}) {
  const ready = useHydrated();
  return (
    <div className={cn("rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs font-medium text-muted">{subtitle}</p>}
        </div>
        <span className="rounded-full bg-ice px-2.5 py-0.5 text-[10px] font-bold text-muted">{note ?? "أرقام تجريبية"}</span>
      </div>
      <div className="mt-4" style={{ height, direction: "ltr" }}>
        {ready ? children : <div className="skeleton h-full w-full" />}
      </div>
    </div>
  );
}

export const CHART_COLORS = { brand: "#008F73", glow: "#2BD9B0", navy: "#102A43", amber: "#F59E0B", rose: "#F43F5E", sky: "#0EA5E9", slate: "#94A3B8" };
