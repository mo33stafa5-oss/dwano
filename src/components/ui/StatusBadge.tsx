import type { AvailabilityStatus } from "@/types";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status, className }: { status: AvailabilityStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold", m.chip, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
