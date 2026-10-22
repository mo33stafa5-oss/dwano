import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = { title: { default: "لوحة الإدارة (ديمو)", template: "%s | لوحة الإدارة" }, robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell kind="admin">{children}</DashboardShell>;
}
