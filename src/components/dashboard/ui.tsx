"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  suffix,
  tone = "brand",
}: {
  label: string;
  value: number;
  delta?: number;
  icon: typeof ArrowUpRight;
  suffix?: string;
  tone?: "brand" | "amber" | "rose" | "sky";
}) {
  const tones = {
    brand: "bg-brand-mint text-brand-deep",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-700",
  } as const;
  return (
    <div className="rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <span className={cn("grid size-10 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
        {delta !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-extrabold", delta >= 0 ? "text-brand" : "text-rose-600")}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toLocaleString("ar-EG")}٪
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-black tabular-nums">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="mt-0.5 text-xs font-bold text-muted">{label}</p>
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 shadow-soft", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-extrabold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-extrabold">{label}</p>
        {hint && <p className="mt-0.5 text-xs font-medium text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300", checked ? "bg-brand" : "bg-navy/15")}
      >
        <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all duration-300", checked ? "start-6" : "start-1")} />
      </button>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-navy/15 py-14 text-center">
      <p className="text-base font-black">{title}</p>
      <p className="mt-1 max-w-xs text-sm font-medium text-muted">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
