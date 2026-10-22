import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = { title: { default: "لوحة الصيدلية (ديمو)", template: "%s | لوحة الصيدلية" }, robots: { index: false } };

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell kind="pharmacy">{children}</DashboardShell>;
}
