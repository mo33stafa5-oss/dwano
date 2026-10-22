"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
  total?: number;
}

export default function Pagination({ page, pageCount, onChange, total }: Props) {
  if (pageCount <= 1 && !total) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav aria-label="التنقل بين الصفحات" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-muted">
        {total !== undefined ? `${total.toLocaleString("ar-EG")} عنصر` : ""}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="السابق"
          className="grid size-9 place-items-center rounded-full border border-navy/10 bg-white transition hover:border-brand/40 disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
        {pages.slice(Math.max(0, page - 3), page + 2).map((p) => (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cn(
              "grid size-9 place-items-center rounded-full text-xs font-extrabold transition",
              p === page ? "bg-brand text-white" : "border border-navy/10 bg-white hover:border-brand/40"
            )}
          >
            {p.toLocaleString("ar-EG")}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          aria-label="التالي"
          className="grid size-9 place-items-center rounded-full border border-navy/10 bg-white transition hover:border-brand/40 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </nav>
  );
}
