"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="4" y1="2" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2BD9B0" />
          <stop offset="1" stopColor="#008F73" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#g${id})`} />
      <path
        d="M20 7.5a8.5 8.5 0 0 0-8.5 8.5c0 6.2 8.5 16.5 8.5 16.5S28.5 22.2 28.5 16A8.5 8.5 0 0 0 20 7.5Z"
        fill="#fff"
        fillOpacity=".95"
      />
      <g transform="rotate(-38 20 16)">
        <rect x="14" y="12.2" width="12" height="7.6" rx="3.8" fill="#075E57" />
        <path d="M20 12.2h2.2a3.8 3.8 0 0 1 0 7.6H20z" fill="#DDF8ED" />
      </g>
    </svg>
  );
}

export default function Logo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[22px] font-extrabold tracking-tight",
            tone === "light" ? "text-white" : "text-navy"
          )}
        >
          دوانو
        </span>
        <span
          className={cn(
            "mt-0.5 text-[10px] font-bold uppercase tracking-[0.28em]",
            tone === "light" ? "text-brand-glow" : "text-brand"
          )}
          dir="ltr"
        >
          Dwano
        </span>
      </span>
    </span>
  );
}
