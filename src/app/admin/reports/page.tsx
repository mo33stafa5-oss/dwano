import type { Metadata } from "next";
import AdminReports from "@/components/dashboard/AdminReports";

export const metadata: Metadata = { title: "التقارير" };

export default function Page() {
  return <AdminReports />;
}
