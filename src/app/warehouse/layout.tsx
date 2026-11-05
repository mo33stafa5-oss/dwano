import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = { title: { default: "لوحة المخزن", template: "%s | لوحة المخزن" }, robots: { index: false } };

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell kind="warehouse">{children}</DashboardShell>;
}
